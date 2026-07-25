// Combat and feedback effects: tracer lines, boom flashes, click markers and
// one pooled muzzle-flash point light. All buffers preallocated; the per-frame
// path allocates nothing.
import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'

const MAX_TRACERS = 256
const TRACER_LIFE = 0.09
const BOOM_LIFE = 0.4
const MARKER_LIFE = 0.5

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

interface FxPool {
  group: THREE.Group
  positions: Float32Array
  colors: Float32Array
  posAttr: THREE.BufferAttribute
  colAttr: THREE.BufferAttribute
  lines: THREE.LineSegments
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

  return { group, positions, colors, posAttr, colAttr, lines, booms, markers, muzzle, disposables, alive: false }
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
  }, 0)

  return <primitive object={pool.group} />
}
