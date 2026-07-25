// Combat and feedback effects: tracer lines, boom flashes, click markers,
// dashed move-order ribbons with destination rings and one pooled muzzle-flash
// point light. All buffers preallocated; the per-frame path allocates nothing.
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'

const MAX_TRACERS = 256
const TRACER_LIFE = 0.09
const BOOM_LIFE = 0.4
const MARKER_LIFE = 0.5
// Move-order feedback: dash pattern along agent routes and the lingering
// destination ring. MAX_PATH caps total dash segments across the squad.
const MAX_PATH = 768
const PATH_PERIOD = 0.9
const PATH_DASH = 0.34
const PATH_Y = 0.07
const DEST_FADE = 0.8
const MAX_SQUAD = 4

// The sim owns tracer/boom timestamps; accept either an age counter or a
// world-time stamp (stamps are large once the mission is a few seconds in).
const ageOf = (tag: number, now: number): number => (tag > 5 ? Math.max(0, now - tag) : Math.max(0, tag))

const markerQueue: Array<{ x: number; z: number }> = []

export function pushClickMarker(x: number, z: number): void {
  markerQueue.push({ x, z })
}

interface BoomSlot {
  mesh: THREE.Mesh
  mat: THREE.MeshStandardMaterial
}

interface MarkerSlot {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  age: number
  active: boolean
}

// Destination ring per squad slot: tracks the route end while the agent
// walks (state 1), then fades out in place after arrival (state 2).
interface DestSlot {
  mesh: THREE.Mesh
  mat: THREE.MeshBasicMaterial
  state: 0 | 1 | 2
  age: number
  x: number
  z: number
}

interface FxPool {
  group: THREE.Group
  positions: Float32Array
  colors: Float32Array
  posAttr: THREE.BufferAttribute
  colAttr: THREE.BufferAttribute
  lines: THREE.LineSegments
  pathPositions: Float32Array
  pathPosAttr: THREE.BufferAttribute
  pathLines: THREE.LineSegments
  dests: DestSlot[]
  booms: BoomSlot[]
  markers: MarkerSlot[]
  muzzle: THREE.PointLight
  disposables: Array<{ dispose: () => void }>
  alive: boolean
}

// Tracer hex colors resolved once per distinct color, keeping the frame loop
// free of string parsing.
const colorCache = new Map<string, [number, number, number]>()

function tracerRgb(hex: string): [number, number, number] {
  let rgb = colorCache.get(hex)
  if (!rgb) {
    rgb = [
      parseInt(hex.slice(1, 3), 16) / 255 || 0,
      parseInt(hex.slice(3, 5), 16) / 255 || 0,
      parseInt(hex.slice(5, 7), 16) / 255 || 0,
    ]
    colorCache.set(hex, rgb)
  }
  return rgb
}

function buildPool(): FxPool {
  const group = new THREE.Group()
  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(r: T): T => {
    disposables.push(r)
    return r
  }

  const positions = new Float32Array(MAX_TRACERS * 6)
  const colors = new Float32Array(MAX_TRACERS * 6)
  const lineGeom = track(new THREE.BufferGeometry())
  const posAttr = new THREE.BufferAttribute(positions, 3)
  posAttr.setUsage(THREE.DynamicDrawUsage)
  const colAttr = new THREE.BufferAttribute(colors, 3)
  colAttr.setUsage(THREE.DynamicDrawUsage)
  lineGeom.setAttribute('position', posAttr)
  lineGeom.setAttribute('color', colAttr)
  lineGeom.setDrawRange(0, 0)
  const lineMat = track(
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const lines = new THREE.LineSegments(lineGeom, lineMat)
  lines.frustumCulled = false
  lines.renderOrder = 8
  group.add(lines)

  // Move-order ribbons: positions rebuilt per frame, colors constant teal
  // written once here so the frame loop touches only the position buffer.
  const pathPositions = new Float32Array(MAX_PATH * 6)
  const pathColors = new Float32Array(MAX_PATH * 6)
  for (let i = 0; i < MAX_PATH * 2; i++) {
    const o = i * 3
    pathColors[o] = 0.3
    pathColors[o + 1] = 0.56
    pathColors[o + 2] = 0.5
  }
  const pathGeom = track(new THREE.BufferGeometry())
  const pathPosAttr = new THREE.BufferAttribute(pathPositions, 3)
  pathPosAttr.setUsage(THREE.DynamicDrawUsage)
  pathGeom.setAttribute('position', pathPosAttr)
  pathGeom.setAttribute('color', new THREE.BufferAttribute(pathColors, 3))
  pathGeom.setDrawRange(0, 0)
  const pathLines = new THREE.LineSegments(pathGeom, lineMat)
  pathLines.frustumCulled = false
  pathLines.renderOrder = 7
  group.add(pathLines)

  const destGeom = track(new THREE.RingGeometry(0.34, 0.46, 20).rotateX(-Math.PI / 2))
  const dests: DestSlot[] = []
  for (let i = 0; i < MAX_SQUAD; i++) {
    const mat = track(
      new THREE.MeshBasicMaterial({
        color: '#7ef0d4',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    const mesh = new THREE.Mesh(destGeom, mat)
    mesh.visible = false
    mesh.renderOrder = 6
    group.add(mesh)
    dests.push({ mesh, mat, state: 0, age: 0, x: 0, z: 0 })
  }

  const boomGeom = track(new THREE.SphereGeometry(1, 10, 8))
  const booms: BoomSlot[] = []
  for (let i = 0; i < 24; i++) {
    const mat = track(
      new THREE.MeshStandardMaterial({
        color: '#000000',
        emissive: new THREE.Color('#ffb46b'),
        emissiveIntensity: 3,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
    )
    const mesh = new THREE.Mesh(boomGeom, mat)
    mesh.visible = false
    mesh.frustumCulled = false
    group.add(mesh)
    booms.push({ mesh, mat })
  }

  const markerGeom = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 4))
  const markers: MarkerSlot[] = []
  for (let i = 0; i < 8; i++) {
    const mat = track(
      new THREE.MeshBasicMaterial({
        color: '#59d6c9',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    const mesh = new THREE.Mesh(markerGeom, mat)
    mesh.visible = false
    mesh.renderOrder = 6
    group.add(mesh)
    markers.push({ mesh, mat, age: 0, active: false })
  }

  const muzzle = new THREE.PointLight('#ffd9a0', 0, 10, 2)
  group.add(muzzle)

  return {
    group,
    positions,
    colors,
    posAttr,
    colAttr,
    lines,
    pathPositions,
    pathPosAttr,
    pathLines,
    dests,
    booms,
    markers,
    muzzle,
    disposables,
    alive: false,
  }
}

export default function Fx() {
  const pool = useMemo(buildPool, [])

  useEffect(() => {
    pool.alive = true
    return () => {
      pool.alive = false
      markerQueue.length = 0
      setTimeout(() => {
        if (!pool.alive) for (const d of pool.disposables) d.dispose()
      }, 0)
    }
  }, [pool])

  useFrame((_, rawDt) => {
    const w = getWorld()
    if (!w) return
    const dt = Math.min(rawDt, 0.05)
    const now = w.time

    // Tracers.
    const n = Math.min(w.tracers.length, MAX_TRACERS)
    let freshFrom: { x: number; z: number; y: number } | null = null
    for (let i = 0; i < n; i++) {
      const tr = w.tracers[i]
      const age = ageOf(tr.t, now)
      const k = Math.max(0, 1 - age / TRACER_LIFE)
      if (age < 0.03) freshFrom = { x: tr.from.x, z: tr.from.z, y: tr.y0 }
      const o = i * 6
      pool.positions[o] = tr.from.x
      pool.positions[o + 1] = tr.y0
      pool.positions[o + 2] = tr.from.z
      pool.positions[o + 3] = tr.to.x
      pool.positions[o + 4] = tr.y1
      pool.positions[o + 5] = tr.to.z
      const [r, g, b] = tracerRgb(tr.color)
      pool.colors[o] = r * k
      pool.colors[o + 1] = g * k
      pool.colors[o + 2] = b * k
      pool.colors[o + 3] = r * k * 0.55
      pool.colors[o + 4] = g * k * 0.55
      pool.colors[o + 5] = b * k * 0.55
    }
    pool.lines.geometry.setDrawRange(0, n * 2)
    pool.posAttr.needsUpdate = true
    pool.colAttr.needsUpdate = true

    // Muzzle flash light.
    if (freshFrom) {
      pool.muzzle.position.set(freshFrom.x, Math.max(0.9, freshFrom.y), freshFrom.z)
      pool.muzzle.intensity = 8
    } else {
      pool.muzzle.intensity *= Math.exp(-22 * dt)
      if (pool.muzzle.intensity < 0.02) pool.muzzle.intensity = 0
    }

    // Booms.
    for (let i = 0; i < pool.booms.length; i++) {
      const slot = pool.booms[i]
      if (i >= w.booms.length) {
        slot.mesh.visible = false
        continue
      }
      const bm = w.booms[i]
      const k = Math.min(1, ageOf(bm.t, now) / BOOM_LIFE)
      if (k >= 1) {
        slot.mesh.visible = false
        continue
      }
      slot.mesh.visible = true
      slot.mesh.position.set(bm.pos.x, 0.9, bm.pos.z)
      const sc = Math.max(0.05, bm.r * (0.35 + 1.6 * k))
      slot.mesh.scale.setScalar(sc)
      slot.mat.opacity = 1 - k
      slot.mat.emissive.set(bm.color)
      slot.mat.emissiveIntensity = 0.4 + 3 * (1 - k)
    }

    // Click markers.
    while (markerQueue.length > 0) {
      const src = markerQueue.pop()
      if (!src) break
      let slot = pool.markers.find((mk) => !mk.active)
      if (!slot) slot = pool.markers[0]
      slot.active = true
      slot.age = 0
      slot.mesh.position.set(src.x, 0.06, src.z)
    }
    for (const mk of pool.markers) {
      if (!mk.active) {
        mk.mesh.visible = false
        continue
      }
      mk.age += dt
      const k = mk.age / MARKER_LIFE
      if (k >= 1) {
        mk.active = false
        mk.mesh.visible = false
        continue
      }
      mk.mesh.visible = true
      mk.mesh.scale.setScalar(1.5 - 1.1 * k)
      mk.mat.opacity = 0.85 * (1 - k)
    }

    // Move-order ribbons: a dashed teal line from each walking agent along its
    // route, with the dash pattern carried across waypoints in world space.
    let seg = 0
    for (const u of w.units) {
      if (u.kind !== 'agent') continue
      const slot = (u.agentSlot ?? 0) - 1
      if (slot < 0 || slot >= pool.dests.length) continue
      const d = pool.dests[slot]
      const alive = u.stance !== 'dead' && u.hp > 0
      if (!alive || u.path.length === 0) {
        if (d.state === 1) {
          d.state = alive ? 2 : 0
          d.age = 0
        }
        continue
      }
      const end = u.path[u.path.length - 1]
      d.state = 1
      d.x = end.x
      d.z = end.z
      let ax = u.pos.x
      let az = u.pos.z
      let phase = 0
      for (let i = 0; i < u.path.length && seg < MAX_PATH; i++) {
        const wp = u.path[i]
        const sx = wp.x - ax
        const sz = wp.z - az
        const len = Math.sqrt(sx * sx + sz * sz)
        if (len < 1e-4) continue
        const nx = sx / len
        const nz = sz / len
        let sPos = 0
        while (sPos < len && seg < MAX_PATH) {
          const cyc = phase % PATH_PERIOD
          // Floor keeps float residue from stalling the walk.
          const run = Math.max(1e-4, Math.min((cyc < PATH_DASH ? PATH_DASH : PATH_PERIOD) - cyc, len - sPos))
          if (cyc < PATH_DASH) {
            const o = seg * 6
            pool.pathPositions[o] = ax + nx * sPos
            pool.pathPositions[o + 1] = PATH_Y
            pool.pathPositions[o + 2] = az + nz * sPos
            pool.pathPositions[o + 3] = ax + nx * (sPos + run)
            pool.pathPositions[o + 4] = PATH_Y
            pool.pathPositions[o + 5] = az + nz * (sPos + run)
            seg++
          }
          sPos += run
          phase += run
        }
        ax = wp.x
        az = wp.z
      }
    }
    pool.pathLines.geometry.setDrawRange(0, seg * 2)
    pool.pathPosAttr.needsUpdate = true

    // Destination rings: pulse while the route is live, fade after arrival.
    for (const d of pool.dests) {
      if (d.state === 0) {
        d.mesh.visible = false
        continue
      }
      d.mesh.visible = true
      d.mesh.position.set(d.x, 0.06, d.z)
      if (d.state === 1) {
        d.mesh.scale.setScalar(1 + 0.08 * Math.sin(now * 6))
        d.mat.opacity = 0.8
      } else {
        d.age += dt
        const k = d.age / DEST_FADE
        if (k >= 1) {
          d.state = 0
          d.mesh.visible = false
          continue
        }
        d.mesh.scale.setScalar(1 + 0.6 * k)
        d.mat.opacity = 0.8 * (1 - k)
      }
    }
  }, 0)

  return <primitive object={pool.group} />
}
