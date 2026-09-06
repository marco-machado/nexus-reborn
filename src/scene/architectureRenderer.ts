// Static instanced architecture and its single-shell cutaways. Visual parts
// share an owner; hiding a building can never leave an opaque roof/sign behind.
import * as THREE from 'three/webgpu'
import { color, float, instancedBufferAttribute, mix, normalLocal, positionWorld, texture, vec2 } from 'three/tsl'
import type { CameraFootprint, CityData, WorldApi } from '../game/types'
import { AMBER, ARMOR_MID, BG, GUN_IRON, INK_DIM, TEAL } from '../ui/tokens'
import { buildArchitectureLayout } from './cityArchitecture'
import type { ArchitectureFamily, ArchitecturePart, PartMaterial } from './cityArchitecture'
import { makeArchitectureMaps, makeArchitectureSign } from './cityMaterials'
import type { ArchitectureKind, ArchitectureMaps } from './cityMaterials'
import {
  appendRouteProbes, classifyOcclusion, collectOcclusionProbes, createOcclusionProbes,
  ROUTE_PROBE_CAPACITY, updateOcclusionFade,
} from './cityOcclusion'

interface PartBatch {
  mesh: THREE.InstancedMesh
  owners: Int32Array
  pristine: Float32Array
}
interface ShellBatch extends PartBatch {
  opacity: THREE.InstancedBufferAttribute
}

const LABELS: Record<ArchitectureFamily, [string, string]> = {
  tower: ['NEXUS', 'CORPORATE SERVICES'],
  block: ['MARKET 07', 'TRADE / SUPPLIES'],
  slab: ['RESIDENCE', 'SECTOR 07'],
  industrial: ['SERVICE 88', 'AUTHORIZED ACCESS'],
  wall: ['RESTRICTED', 'KEEP CLEAR'],
  checkpoint: ['CORPSEC', 'CHECKPOINT / ID SCAN'],
}
const NO_PICK: THREE.Object3D['raycast'] = () => undefined

export interface ArchitectureRender {
  group: THREE.Group
  update: (camera: THREE.Camera, world: WorldApi, footprint: CameraFootprint | null, dt: number) => void
  dispose: () => void
}

export function buildArchitecture(city: CityData): ArchitectureRender {
  const layout = buildArchitectureLayout(city)
  const group = new THREE.Group()
  group.name = 'City architecture'
  const disposables: Array<{ dispose: () => void }> = []
  const track = <T extends { dispose: () => void }>(value: T): T => { disposables.push(value); return value }
  const box = track(new THREE.BoxGeometry(1, 1, 1))
  const plane = track(new THREE.PlaneGeometry(1, 1))
  const parts: PartBatch[] = []
  const shells: ShellBatch[] = []
  const fade = new Float32Array(layout.length).fill(1)
  const tiers = new Uint8Array(layout.length)
  const ghosted = new Uint8Array(layout.length)
  const changed = new Uint8Array(layout.length)
  const boxes = new Float32Array(layout.length * 6)
  layout.forEach((owner, i) => boxes.set(owner.bounds, i * 6))
  const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()
  const rotation = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  const maps = new Map<ArchitectureKind, ArchitectureMaps>()
  const materials = new Map<string, THREE.Material>()

  // World-space UVs give every six meters one tile regardless of instance
  // size or tower setback. Horizontal faces read as a roof, never windows.
  const horizontal = normalLocal.y.abs()
  const uv = vec2(mix(positionWorld.x, positionWorld.z, normalLocal.x.abs()), positionWorld.y).div(6)
  const facadeMaterial = (family: ArchitectureFamily, opacity?: THREE.InstancedBufferAttribute): THREE.MeshStandardNodeMaterial => {
    const kind = family === 'checkpoint' ? 'wall' : family
    let set = maps.get(kind)
    if (!set) {
      set = makeArchitectureMaps(kind)
      maps.set(kind, set)
      track(set.map); track(set.emissiveMap); track(set.roughnessMap)
    }
    const material = track(new THREE.MeshStandardNodeMaterial({ roughness: 1, metalness: 0.08,
      transparent: !!opacity, depthWrite: !opacity }))
    material.colorNode = mix(texture(set.map, uv).rgb, color(ARMOR_MID[1]), horizontal)
    material.roughnessNode = mix(texture(set.roughnessMap, uv).g, float(0.9), horizontal)
    let emission = texture(set.emissiveMap, uv).rgb.mul(horizontal.oneMinus()).mul(0.65)
    if (opacity) {
      const alpha = float(instancedBufferAttribute<'float'>(opacity, 'float'))
      material.opacityNode = alpha
      emission = emission.mul(alpha.mul(alpha))
    }
    material.emissiveNode = emission
    return material
  }
  const getMaterial = (family: ArchitectureFamily, role: PartMaterial): THREE.Material => {
    const key = role === 'facade' || role === 'sign' ? family + ':' + role : role
    let material = materials.get(key)
    if (material) return material
    if (role === 'facade') material = facadeMaterial(family)
    else if (role === 'sign') {
      const map = track(makeArchitectureSign(...LABELS[family], family === 'checkpoint'))
      material = track(new THREE.MeshStandardMaterial({ map, emissiveMap: map,
        emissive: new THREE.Color(INK_DIM), emissiveIntensity: 0.7, roughness: 0.7, side: THREE.DoubleSide }))
    } else {
      const shades = { trim: INK_DIM, metal: GUN_IRON, recess: BG, signal: TEAL }
      material = track(new THREE.MeshStandardMaterial({ color: shades[role],
        roughness: role === 'metal' ? 0.63 : 0.88,
        metalness: role === 'metal' ? 0.2 : 0.03,
        ...(role === 'signal' ? { color: BG, emissive: new THREE.Color(AMBER), emissiveIntensity: 1.3 } : {}) }))
    }
    materials.set(key, material)
    return material
  }
  const setupMesh = (mesh: THREE.InstancedMesh, name: string): void => {
    mesh.name = name
    mesh.frustumCulled = false
    mesh.raycast = NO_PICK
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    track(mesh)
    group.add(mesh)
  }

  const buckets = new Map<string, ArchitecturePart[]>()
  for (const owner of layout) for (const part of owner.parts) {
    const key = part.material === 'facade' || part.material === 'sign'
      ? owner.family + ':' + part.material : part.material
    const list = buckets.get(key)
    if (list) list.push(part)
    else buckets.set(key, [part])
  }
  for (const [name, list] of buckets) {
    const first = list[0]
    const material = getMaterial(layout[first.owner].family, first.material)
    const mesh = new THREE.InstancedMesh(first.material === 'sign' ? plane : box, material, list.length)
    const owners = new Int32Array(list.length)
    list.forEach((part, i) => {
      rotation.setFromAxisAngle(up, (part.side ?? 0) * Math.PI / 2)
      position.set(part.x, part.y, part.z)
      scale.set(part.material === 'sign' ? Math.max(part.w, part.d) : part.w, part.h, part.material === 'sign' ? 1 : part.d)
      matrix.compose(position, rotation, scale)
      mesh.setMatrixAt(i, matrix)
      owners[i] = part.owner
    })
    mesh.instanceMatrix.needsUpdate = true
    parts.push({mesh, owners, pristine: (mesh.instanceMatrix.array as Float32Array).slice()})
    setupMesh(mesh, 'Architecture ' + name)
  }
  const families = new Set(layout.map((o) => o.family))
  for (const family of families) {
    const ids = layout.flatMap((o, i) => o.family === family ? [i] : [])
    const opacity = new THREE.InstancedBufferAttribute(new Float32Array(ids.length).fill(1), 1)
    opacity.setUsage(THREE.DynamicDrawUsage)
    const mesh = new THREE.InstancedMesh(box, facadeMaterial(family, opacity), ids.length)
    ids.forEach((owner, i) => {
      const [x0, y0, z0, x1, y1, z1] = layout[owner].bounds
      rotation.identity()
      matrix.compose(position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rotation, scale.set(x1 - x0, y1 - y0, z1 - z0))
      mesh.setMatrixAt(i, matrix)
    })
    const pristine = (mesh.instanceMatrix.array as Float32Array).slice()
    ;(mesh.instanceMatrix.array as Float32Array).fill(0)
    mesh.instanceMatrix.needsUpdate = true
    mesh.renderOrder = 3
    mesh.visible = false
    setupMesh(mesh, 'Architecture ghost ' + family)
    shells.push({mesh, owners: new Int32Array(ids), pristine, opacity})
  }

  return {
    group,
    update(camera, world, footprint, dt) {
      const originalCount = collectOcclusionProbes(probes, world, footprint)
      const count = appendRouteProbes(probes, world.units, originalCount)
      classifyOcclusion(boxes, tiers, camera.position, probes, count)
      updateOcclusionFade(fade, tiers, dt)
      changed.fill(0)
      let anyChanged = false
      for (let i = 0; i < fade.length; i++) {
        const hidden = fade[i] < 1 ? 1 : 0
        if (hidden !== ghosted[i]) { ghosted[i] = hidden; changed[i] = 1; anyChanged = true }
      }
      // One batch upload per changed material, not one per attachment. All
      // geometry belonging to a ghost is removed, including its sign plane.
      if (anyChanged) for (const batch of parts) {
        const array = batch.mesh.instanceMatrix.array as Float32Array
        let dirty = false
        for (let i = 0; i < batch.owners.length; i++) {
          const owner = batch.owners[i]
          if (!changed[owner]) continue
          const offset = i * 16
          for (let k = 0; k < 16; k++) array[offset + k] = ghosted[owner] ? 0 : batch.pristine[offset + k]
          dirty = true
        }
        if (dirty) batch.mesh.instanceMatrix.needsUpdate = true
      }
      for (const batch of shells) {
        const array = batch.mesh.instanceMatrix.array as Float32Array
        let dirty = false
        let opacityDirty = false
        let visible = false
        for (let i = 0; i < batch.owners.length; i++) {
          const owner = batch.owners[i]
          if (ghosted[owner]) visible = true
          if (batch.opacity.array[i] !== fade[owner]) { batch.opacity.array[i] = fade[owner]; opacityDirty = true }
          if (!changed[owner]) continue
          const offset = i * 16
          for (let k = 0; k < 16; k++) array[offset + k] = ghosted[owner] ? batch.pristine[offset + k] : 0
          dirty = true
        }
        if (dirty) batch.mesh.instanceMatrix.needsUpdate = true
        if (opacityDirty) batch.opacity.needsUpdate = true
        batch.mesh.visible = visible
      }
    },
    dispose() { for (const resource of disposables) resource.dispose() },
  }
}
