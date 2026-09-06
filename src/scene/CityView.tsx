// Static city rendering: ground, streetlights, props and tactical markings.
// Architecture owns building detail and its single-shell visibility pass.
// Everything is built once per city and disposed with the mission.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getCameraFootprint, getWorld } from '../game/runtime'
import type { CityData, PropData } from '../game/types'
import { makeGlowTexture, makeGroundMaps } from './textures'
import { buildArchitecture } from './architectureRenderer'

const UP = new THREE.Vector3(0, 1, 0)

interface Built {
  group: THREE.Group
  architecture: ReturnType<typeof buildArchitecture>
  dispose: () => void
  alive: boolean
}

const fract = (v: number): number => v - Math.floor(v)

function buildCity(city: CityData): Built {
  const group = new THREE.Group()
  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(r: T): T => {
    disposables.push(r)
    return r
  }
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const off = new THREE.Vector3()
  const col = new THREE.Color()

  // Ground.
  const groundMaps = makeGroundMaps(city)
  track(groundMaps.map)
  track(groundMaps.roughnessMap)
  const groundGeom = track(new THREE.PlaneGeometry(city.size, city.size))
  const groundMat = track(
    new THREE.MeshStandardMaterial({
      map: groundMaps.map,
      roughnessMap: groundMaps.roughnessMap,
      roughness: 1,
      metalness: 0.15,
    }),
  )
  const ground = new THREE.Mesh(groundGeom, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(city.size / 2, 0, city.size / 2)
  group.add(ground)

  // Architectural parts share ownership with one ghost shell per building.
  const architecture = buildArchitecture(city)
  group.add(architecture.group)

  // Streetlights: dark poles, hot emissive heads, additive light pools.
  const street = city.lights.filter((l) => l.kind === 'street')
  const poleGeom = track(new THREE.BoxGeometry(0.09, 4.2, 0.09))
  const poleMat = track(new THREE.MeshStandardMaterial({ color: '#171b20', roughness: 0.9 }))
  const poleMesh = new THREE.InstancedMesh(poleGeom, poleMat, street.length)
  const headGeom = track(new THREE.BoxGeometry(0.5, 0.14, 0.2))
  const headMat = track(
    new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ffc07a'), emissiveIntensity: 3 }),
  )
  const headMesh = new THREE.InstancedMesh(headGeom, headMat, street.length)
  const glowTex = track(makeGlowTexture())
  const glowGeom = track(new THREE.PlaneGeometry(3.8, 3.8).rotateX(-Math.PI / 2))
  const glowMat = track(
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: '#ffb46b',
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const glowMesh = new THREE.InstancedMesh(glowGeom, glowMat, street.length)
  q.identity()
  for (let i = 0; i < street.length; i++) {
    const l = street[i]
    m.compose(p.set(l.x, 2.1, l.z), q, sc.set(1, 1, 1))
    poleMesh.setMatrixAt(i, m)
    m.compose(p.set(l.x, 4.22, l.z), q, sc.set(1, 1, 1))
    headMesh.setMatrixAt(i, m)
    m.compose(p.set(l.x, 0.04, l.z), q, sc.set(1, 1, 1))
    glowMesh.setMatrixAt(i, m)
  }
  poleMesh.instanceMatrix.needsUpdate = true
  headMesh.instanceMatrix.needsUpdate = true
  glowMesh.instanceMatrix.needsUpdate = true
  poleMesh.frustumCulled = false
  headMesh.frustumCulled = false
  glowMesh.frustumCulled = false
  glowMesh.renderOrder = 2
  group.add(poleMesh, headMesh, glowMesh)

  // Props.
  const byKind = (k: PropData['kind']): PropData[] => city.props.filter((pr) => pr.kind === k)
  const setAt = (mesh: THREE.InstancedMesh, i: number, pr: PropData, y: number, dz: number, s: number): void => {
    q.setFromAxisAngle(UP, pr.rot)
    off.set(0, y, dz).applyQuaternion(q)
    off.x += pr.x
    off.z += pr.z
    m.compose(p.copy(off), q, sc.set(s, s, s))
    mesh.setMatrixAt(i, m)
  }
  // A zero-count InstancedMesh allocates a zero-size uniform buffer, which
  // WebGPU rejects at bind group creation. Archetypes drop whole prop kinds
  // (a compound has no barriers), so empty batches never reach the scene.
  const finish = (mesh: THREE.InstancedMesh): void => {
    if (mesh.count === 0) return
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.frustumCulled = false
    group.add(mesh)
  }

  const cratePs = byKind('crate')
  const crateGeom = track(new THREE.BoxGeometry(0.9, 0.9, 0.9))
  const crateMat = track(new THREE.MeshStandardMaterial({ color: '#2a2620', roughness: 0.92 }))
  const crateMesh = new THREE.InstancedMesh(crateGeom, crateMat, cratePs.length)
  for (let i = 0; i < cratePs.length; i++) {
    const s = 0.72 + fract(cratePs[i].rot * 5) * 0.4
    setAt(crateMesh, i, cratePs[i], 0.45 * s, 0, s)
  }
  finish(crateMesh)

  const barrierPs = byKind('barrier')
  const barrierGeom = track(new THREE.BoxGeometry(1.6, 0.9, 0.42))
  const barrierMat = track(new THREE.MeshStandardMaterial({ color: '#232a2e', roughness: 0.85 }))
  const barrierMesh = new THREE.InstancedMesh(barrierGeom, barrierMat, barrierPs.length)
  const stripeGeom = track(new THREE.BoxGeometry(1.62, 0.12, 0.44))
  const stripeMat = track(
    new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ff5c4a'), emissiveIntensity: 1.6 }),
  )
  const stripeMesh = new THREE.InstancedMesh(stripeGeom, stripeMat, barrierPs.length)
  for (let i = 0; i < barrierPs.length; i++) {
    setAt(barrierMesh, i, barrierPs[i], 0.45, 0, 1)
    setAt(stripeMesh, i, barrierPs[i], 0.62, 0, 1)
  }
  finish(barrierMesh)
  finish(stripeMesh)

  const carPs = byKind('car')
  const carPalette = ['#232a31', '#1e242b', '#2a2431', '#1f2b28', '#262024']
  const carBodyGeom = track(new THREE.BoxGeometry(1.8, 0.72, 4.2))
  const carBodyMat = track(new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.35 }))
  const carBodyMesh = new THREE.InstancedMesh(carBodyGeom, carBodyMat, carPs.length)
  const cabinGeom = track(new THREE.BoxGeometry(1.56, 0.5, 2.1))
  const cabinMat = track(new THREE.MeshStandardMaterial({ color: '#0c1013', roughness: 0.3, metalness: 0.4 }))
  const cabinMesh = new THREE.InstancedMesh(cabinGeom, cabinMat, carPs.length)
  const tailGeom = track(new THREE.BoxGeometry(1.5, 0.09, 0.07))
  const tailMat = track(
    new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ff3b30'), emissiveIntensity: 2.2 }),
  )
  const tailMesh = new THREE.InstancedMesh(tailGeom, tailMat, carPs.length)
  for (let i = 0; i < carPs.length; i++) {
    setAt(carBodyMesh, i, carPs[i], 0.42, 0, 1)
    setAt(cabinMesh, i, carPs[i], 0.95, -0.3, 1)
    setAt(tailMesh, i, carPs[i], 0.62, 2.08, 1)
    col.set(carPalette[i % carPalette.length])
    carBodyMesh.setColorAt(i, col)
  }
  finish(carBodyMesh)
  finish(cabinMesh)
  finish(tailMesh)

  const dumpsterPs = byKind('dumpster')
  const dumpsterGeom = track(new THREE.BoxGeometry(1.1, 1.02, 1.8))
  const dumpsterMat = track(new THREE.MeshStandardMaterial({ color: '#1d2a24', roughness: 0.9 }))
  const dumpsterMesh = new THREE.InstancedMesh(dumpsterGeom, dumpsterMat, dumpsterPs.length)
  for (let i = 0; i < dumpsterPs.length; i++) setAt(dumpsterMesh, i, dumpsterPs[i], 0.51, 0, 1)
  finish(dumpsterMesh)

  const pillarPs = byKind('pillar')
  const pillarGeom = track(new THREE.BoxGeometry(0.9, 5, 0.9))
  const pillarMat = track(new THREE.MeshStandardMaterial({ color: '#232a2e', roughness: 0.8 }))
  const pillarMesh = new THREE.InstancedMesh(pillarGeom, pillarMat, pillarPs.length)
  const capGeom = track(new THREE.BoxGeometry(0.96, 0.4, 0.96))
  const capMat = track(
    new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#f0b445'), emissiveIntensity: 2.6 }),
  )
  const capMesh = new THREE.InstancedMesh(capGeom, capMat, pillarPs.length)
  for (let i = 0; i < pillarPs.length; i++) {
    setAt(pillarMesh, i, pillarPs[i], 2.5, 0, 1)
    setAt(capMesh, i, pillarPs[i], 4.55, 0, 1)
  }
  finish(pillarMesh)
  finish(capMesh)

  // Ground-level gate warnings remain visible when the overhead sign ghosts.
  // Checkpoint archetype only; compound gate pillars stay bare posts.
  if (city.archetype === 'checkpoint' && pillarPs.length >= 2) {
    const a = pillarPs[0]
    const b = pillarPs[1]
    const midX = (a.x + b.x) / 2
    const gz = (a.z + b.z) / 2
    const span = Math.abs(b.x - a.x)
    const laserGeom = track(new THREE.BoxGeometry(span - 0.9, 0.045, 0.045))
    const laserMat = track(
      new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#ff2a2a'), emissiveIntensity: 3 }),
    )
    for (const ly of [0.5, 0.9, 1.3]) {
      const beam = new THREE.Mesh(laserGeom, laserMat)
      beam.position.set(midX, ly, gz)
      group.add(beam)
    }
  }

  // Dashed extraction ring decal.
  const ex = city.extraction
  const dashGeom = track(new THREE.BoxGeometry(0.55, 0.05, 0.16))
  const dashMat = track(
    new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#7ef0d4'), emissiveIntensity: 1.3 }),
  )
  const dashMesh = new THREE.InstancedMesh(dashGeom, dashMat, 20)
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2
    q.setFromAxisAngle(UP, -(ang + Math.PI / 2))
    m.compose(p.set(ex.x + Math.cos(ang) * ex.r, 0.05, ex.z + Math.sin(ang) * ex.r), q, sc.set(1, 1, 1))
    dashMesh.setMatrixAt(i, m)
  }
  dashMesh.instanceMatrix.needsUpdate = true
  dashMesh.frustumCulled = false
  group.add(dashMesh)

  return {
    group,
    architecture,
    dispose: () => {
      architecture.dispose()
      for (const d of disposables) d.dispose()
    },
    alive: false,
  }
}

export default function CityView() {
  const world = getWorld()
  const camera = useThree((s) => s.camera)
  const built = useMemo(() => (world ? buildCity(world.city) : null), [world])
  // Deferred disposal: StrictMode remounts reuse the same memoized resources,
  // so only dispose when the cleanup is not immediately followed by a mount.
  useEffect(() => {
    if (!built) return
    built.alive = true
    return () => {
      built.alive = false
      setTimeout(() => {
        if (!built.alive) built.dispose()
      }, 0)
    }
  }, [built])
  useFrame((_, rawDt) => {
    const w = getWorld()
    if (!built || !w) return
    built.architecture.update(camera, w, getCameraFootprint(), Math.min(rawDt, 0.05))
  }, 0)
  if (!built) return null
  return <primitive object={built.group} />
}
