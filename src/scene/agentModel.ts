// Armored operative built from pooled geometry. Author in anatomical coordinates
// (+Z forward), then bake +X forward to preserve the mission's heading and gait.
import * as THREE from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { AMBER, BG, BODY_DEEP, GUN_IRON, PRINT_WHITE } from '../ui/tokens'
import { mulberry32 } from '../game/rng'

type V3 = [number, number, number]
type Finish = 'armor' | 'edge' | 'suit' | 'webbing' | 'rubber' | 'optic'
type Batch = { geometry: THREE.BufferGeometry; finish: Finish }
export interface AgentResources {
  body: Batch[]
  leftLeg: Batch[]
  rightLeg: Batch[]
  rifle: Batch[]
  materials: Record<Exclude<Finish, 'optic'>, THREE.MeshStandardMaterial>
}

class Parts {
  private pieces = new Map<Finish, THREE.BufferGeometry[]>()

  add(finish: Finish, geometry: THREE.BufferGeometry, position: V3, rotation: V3 = [0, 0, 0]) {
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)))
    geometry.translate(...position)
    const plain = geometry.index ? geometry.toNonIndexed() : geometry
    if (plain !== geometry) geometry.dispose()
    const list = this.pieces.get(finish) ?? []
    list.push(plain)
    this.pieces.set(finish, list)
  }

  box(finish: Finish, size: V3, position: V3, radius = 0.008, rotation: V3 = [0, 0, 0]) {
    this.add(finish, radius ? new RoundedBoxGeometry(...size, 1, radius) : new THREE.BoxGeometry(...size), position, rotation)
  }

  ellipsoid(finish: Finish, size: V3, position: V3) {
    this.add(finish, new THREE.SphereGeometry(1, 12, 8).scale(...size), position)
  }

  rod(finish: Finish, from: V3, to: V3, radius: number, topRadius = radius, segments = 8) {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const geometry = new THREE.CylinderGeometry(topRadius, radius, a.distanceTo(b), segments)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    geometry.applyQuaternion(quaternion)
    this.add(finish, geometry, a.add(b).multiplyScalar(0.5).toArray() as V3)
  }

  // An eight-sided plate with chamfered corners and a tapered waist.
  plate(finish: Finish, w: number, h: number, depth: number, position: V3, taper = 0.85, rotation: V3 = [0, 0, 0]) {
    const outline = new THREE.Shape()
    const cut = Math.min(w, h) * 0.16
    outline.moveTo(-w / 2 + cut, h / 2)
    outline.lineTo(w / 2 - cut, h / 2)
    outline.lineTo(w / 2, h / 2 - cut)
    outline.lineTo(w * taper / 2, -h / 2 + cut)
    outline.lineTo(w * taper / 2 - cut, -h / 2)
    outline.lineTo(-w * taper / 2 + cut, -h / 2)
    outline.lineTo(-w * taper / 2, -h / 2 + cut)
    outline.lineTo(-w / 2, h / 2 - cut)
    outline.closePath()
    const geometry = new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1, steps: 1, curveSegments: 1 })
    geometry.translate(0, 0, -depth / 2)
    this.add(finish, geometry, position, rotation)
  }

  finish(): Batch[] {
    return [...this.pieces].map(([finish, geometries]) => {
      const geometry = mergeGeometries(geometries)
      if (!geometry) throw new Error('Incompatible operative geometry')
      for (const piece of geometries) piece.dispose()
      geometry.rotateY(Math.PI / 2)
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      return { geometry, finish }
    })
  }
}

function bodyParts(): Batch[] {
  const p = new Parts()
  // Undersuit, pelvis, abdominal segments and plate carrier.
  p.ellipsoid('suit', [0.16, 0.23, 0.105], [0, 1.13, 0])
  p.box('suit', [0.25, 0.16, 0.18], [0, 0.84, 0], 0.035)
  p.box('rubber', [0.285, 0.055, 0.205], [0, 0.91, 0], 0.014)
  for (let i = 0; i < 3; i++) p.plate('armor', 0.225 - i * 0.013, 0.062, 0.045, [0, 1.035 - i * 0.06, 0.105])
  p.plate('edge', 0.35, 0.275, 0.075, [0, 1.235, 0.085])
  p.plate('armor', 0.332, 0.255, 0.085, [0, 1.238, 0.091])
  p.plate('webbing', 0.29, 0.21, 0.045, [0, 1.165, 0.145], 0.98)
  p.box('rubber', [0.125, 0.017, 0.006], [0, 1.317, 0.14], 0.002)
  for (let i = -2; i <= 2; i++) p.box('edge', [0.009, 0.008, 0.008], [i * 0.019, 1.317, 0.142], 0.001)
  // Shoulder straps, buckles, magazine pouches, and webbing loops.
  for (const side of [-1, 1]) {
    p.box('webbing', [0.05, 0.25, 0.028], [side * 0.122, 1.26, 0.155], 0.004, [0, 0, side * 0.065])
    p.box('edge', [0.057, 0.046, 0.017], [side * 0.125, 1.315, 0.176], 0.003)
    p.box('rubber', [0.031, 0.024, 0.021], [side * 0.125, 1.315, 0.18], 0.002)
    p.box('webbing', [0.072, 0.096, 0.045], [side * 0.182, 0.915, 0.043], 0.012)
    p.box('armor', [0.06, 0.022, 0.048], [side * 0.182, 0.955, 0.047], 0.004)
  }
  for (let i = -1; i <= 1; i++) {
    p.box('webbing', [0.079, 0.137, 0.068], [i * 0.087, 1.158, 0.193], 0.01)
    p.box('webbing', [0.076, 0.029, 0.072], [i * 0.087, 1.216, 0.194], 0.003)
    p.box('rubber', [0.012, 0.089, 0.005], [i * 0.087, 1.157, 0.229], 0)
    p.box('edge', [0.017, 0.012, 0.006], [i * 0.087, 1.13, 0.232], 0.002)
  }
  p.box('edge', [0.056, 0.04, 0.027], [0, 0.917, 0.126], 0.006)
  p.box('rubber', [0.035, 0.023, 0.029], [0, 0.917, 0.128], 0.003)
  // Collar, respirator helmet, ear protection and small inset optics.
  p.rod('suit', [0, 1.345, 0], [0, 1.435, 0], 0.057)
  for (const side of [-1, 1]) {
    p.box('armor', [0.045, 0.09, 0.19], [side * 0.09, 1.378, -0.005], 0.013, [0, 0, side * 0.12])
  }
  p.ellipsoid('armor', [0.108, 0.123, 0.112], [0, 1.498, -0.008])
  p.box('edge', [0.035, 0.032, 0.176], [0, 1.605, -0.005], 0.008)
  p.plate('rubber', 0.165, 0.107, 0.037, [0, 1.487, 0.09], 0.69)
  p.plate('armor', 0.11, 0.067, 0.042, [0, 1.441, 0.109], 0.65)
  p.box('edge', [0.175, 0.018, 0.033], [0, 1.535, 0.085], 0.005)
  for (const side of [-1, 1]) {
    p.rod('rubber', [side * 0.04, 1.505, 0.1], [side * 0.04, 1.505, 0.121], 0.019, 0.016, 12)
    p.rod('edge', [side * 0.04, 1.505, 0.121], [side * 0.04, 1.505, 0.126], 0.012, 0.012, 12)
    p.rod('optic', [side * 0.04, 1.505, 0.126], [side * 0.04, 1.505, 0.128], 0.007, 0.007, 12)
    p.rod('rubber', [side * 0.098, 1.49, 0], [side * 0.125, 1.49, 0], 0.049, 0.049, 12)
    p.rod('edge', [side * 0.125, 1.49, 0], [side * 0.13, 1.49, 0], 0.036, 0.03, 12)
    p.box('armor', [0.025, 0.057, 0.056], [side * 0.096, 1.432, 0.07], 0.01, [0, side * -0.35, side * 0.3])
    p.rod('edge', [side * 0.066, 1.445, 0.1], [side * 0.083, 1.39, 0.073], 0.008)
  }
  for (let i = -1; i <= 1; i++) p.box('rubber', [0.009, 0.025, 0.006], [i * 0.018, 1.444, 0.134], 0.002)
  // Back plate, compact radio pack and antenna.
  p.plate('armor', 0.29, 0.28, 0.055, [0, 1.2, -0.115])
  p.box('webbing', [0.19, 0.235, 0.085], [0, 1.19, -0.17], 0.02)
  p.box('armor', [0.16, 0.037, 0.089], [0, 1.29, -0.173], 0.006)
  for (let i = 0; i < 3; i++) p.box('rubber', [0.12, 0.014, 0.01], [0, 1.22 - i * 0.033, -0.217], 0.002)
  p.box('rubber', [0.061, 0.12, 0.056], [0.136, 1.287, -0.147], 0.01)
  p.rod('edge', [0.14, 1.33, -0.15], [0.149, 1.57, -0.17], 0.004, 0.0025)
  // Two bent arms support a rifle across the plate carrier.
  for (const side of [-1, 1]) {
    const shoulder: V3 = [side * 0.228, 1.297, 0]
    const elbow: V3 = [side * 0.293, 1.074, 0.034]
    const hand: V3 = side < 0 ? [-0.075, 1.038, 0.275] : [0.233, 0.986, 0.283]
    p.rod('suit', elbow, shoulder, 0.057, 0.068)
    p.ellipsoid('rubber', [0.059, 0.057, 0.058], elbow)
    p.ellipsoid('edge', [0.084, 0.07, 0.103], [side * 0.237, 1.294, 0])
    p.ellipsoid('armor', [0.082, 0.077, 0.103], [side * 0.24, 1.307, 0])
    p.plate('armor', 0.13, 0.065, 0.028, [side * 0.245, 1.277, 0.082], 0.82, [0, 0, side * -0.14])
    p.plate('armor', 0.092, 0.113, 0.045, [side * 0.282, 1.174, 0.048], 0.8, [0, side * 0.16, side * -0.22])
    p.rod('suit', elbow, hand, 0.044, 0.035)
    const wrist = new THREE.Vector3(...elbow).lerp(new THREE.Vector3(...hand), 0.82).toArray() as V3
    p.rod('armor', elbow, wrist, 0.057, 0.046, 8)
    p.rod('edge', wrist, hand, 0.041, 0.04, 8)
    p.box('rubber', [0.07, 0.075, 0.063], hand, 0.017, [0.15, 0.2, -0.4])
    p.box('armor', [0.061, 0.032, 0.026], [hand[0], hand[1] + 0.02, hand[2] + 0.032], 0.009, [0, 0, -0.4])
    for (let finger = 0; finger < 3; finger++) p.box('edge', [0.012, 0.023, 0.015], [hand[0] - 0.024 + finger * 0.021, hand[1] + 0.007, hand[2] + 0.046], 0.003)
    // Fasteners on the pauldrons and chest.
    for (const y of [1.274, 1.332]) p.ellipsoid('edge', [0.006, 0.006, 0.004], [side * 0.255, y, 0.094])
    p.ellipsoid('edge', [0.005, 0.005, 0.003], [side * 0.145, 1.34, 0.138])
  }
  p.box('optic', [0.015, 0.006, 0.004], [-0.079, 1.29, 0.14], 0.001)
  return p.finish()
}

function legParts(side: number): Batch[] {
  const p = new Parts()
  // Local origin is the hip; all leg armor follows the existing gait pivot.
  p.rod('suit', [0, -0.34, 0.005], [0, -0.035, 0], 0.069, 0.086)
  p.plate('armor', 0.124, 0.235, 0.051, [side * 0.009, -0.17, 0.062], 0.75, [-0.07, side * -0.09, side * -0.055])
  p.box('webbing', [0.035, 0.113, 0.085], [side * 0.077, -0.16, 0.003], 0.008)
  p.box('rubber', [0.154, 0.034, 0.151], [0, -0.11, 0], 0.01)
  p.box('webbing', [0.145, 0.025, 0.135], [0, -0.274, 0.003], 0.008)
  p.box('edge', [0.022, 0.023, 0.01], [side * 0.054, -0.274, 0.077], 0.002)
  p.plate('armor', 0.084, 0.16, 0.018, [side * 0.008, -0.175, 0.093], 0.7)
  p.box('rubber', [0.009, 0.107, 0.003], [side * 0.029, -0.175, 0.105], 0.001)
  p.ellipsoid('rubber', [0.068, 0.055, 0.062], [0, -0.363, 0.006])
  p.plate('edge', 0.118, 0.124, 0.04, [0, -0.365, 0.068])
  p.plate('armor', 0.103, 0.106, 0.045, [0, -0.362, 0.075])
  p.plate('rubber', 0.061, 0.052, 0.008, [0, -0.36, 0.101])
  p.plate('armor', 0.048, 0.04, 0.009, [0, -0.36, 0.106])
  for (const edge of [-1, 1]) p.ellipsoid('edge', [0.005, 0.005, 0.004], [edge * 0.039, -0.34, 0.101])
  p.rod('suit', [0, -0.693, -0.012], [0, -0.414, 0.003], 0.043, 0.06)
  p.plate('edge', 0.094, 0.226, 0.031, [0, -0.557, 0.038], 0.64, [0.075, 0, 0])
  p.plate('armor', 0.083, 0.213, 0.038, [0, -0.554, 0.043], 0.6, [0.075, 0, 0])
  p.box('rubber', [0.014, 0.154, 0.005], [side * 0.018, -0.553, 0.065], 0.002, [0.07, 0, 0])
  p.rod('edge', [side * 0.058, -0.455, -0.009], [side * 0.043, -0.645, -0.025], 0.012, 0.013)
  p.rod('rubber', [0, -0.713, -0.012], [0, -0.66, -0.012], 0.049, 0.049)
  p.box('rubber', [0.125, 0.052, 0.228], [0, -0.784, 0.036], 0.018)
  p.box('armor', [0.115, 0.081, 0.19], [0, -0.743, 0.03], 0.025)
  p.box('edge', [0.108, 0.036, 0.076], [0, -0.748, 0.11], 0.012)
  for (let i = 0; i < 3; i++) {
    p.box('rubber', [0.092, 0.013, 0.019], [0, -0.696 - i * 0.009, 0.015 + i * 0.028], 0.003)
    p.box('edge', [0.113, 0.011, 0.009], [0, -0.79, -0.035 + i * 0.076], 0.002)
  }
  return p.finish()
}

function rifleParts(): Batch[] {
  const p = new Parts()
  // Local rifle axis +X; the whole assembly is placed in a low-ready pose.
  p.box('armor', [0.253, 0.085, 0.062], [0, 0, 0], 0.009)
  p.box('edge', [0.221, 0.019, 0.054], [0.01, 0.052, 0], 0.003)
  p.box('rubber', [0.135, 0.071, 0.062], [-0.193, -0.008, 0], 0.013)
  p.box('edge', [0.02, 0.086, 0.068], [-0.257, -0.011, 0], 0.004)
  p.box('rubber', [0.061, 0.09, 0.044], [-0.064, -0.077, 0], 0.006, [0, 0, -0.27])
  p.box('armor', [0.072, 0.133, 0.042], [0.053, -0.095, 0], 0.007, [0, 0, 0.14])
  for (let i = 0; i < 3; i++) p.box('edge', [0.054, 0.008, 0.045], [0.05, -0.067 - i * 0.028, 0], 0.001)
  p.box('armor', [0.20, 0.071, 0.056], [0.198, 0.007, 0], 0.008)
  for (let i = 0; i < 5; i++) {
    p.box('rubber', [0.013, 0.025, 0.059], [0.124 + i * 0.033, 0.008, 0], 0.002)
    p.box('edge', [0.012, 0.012, 0.043], [0.113 + i * 0.036, 0.049, 0], 0.001)
  }
  p.rod('edge', [0.293, 0.009, 0], [0.46, 0.009, 0], 0.017, 0.015, 10)
  p.rod('armor', [0.455, 0.009, 0], [0.501, 0.009, 0], 0.024, 0.024, 10)
  p.rod('rubber', [0.501, 0.009, 0], [0.503, 0.009, 0], 0.015, 0.015, 10)
  p.box('rubber', [0.063, 0.033, 0.044], [-0.005, 0.074, 0], 0.004)
  p.rod('armor', [-0.064, 0.096, 0], [0.073, 0.096, 0], 0.027, 0.027, 12)
  p.rod('rubber', [0.073, 0.096, 0], [0.075, 0.096, 0], 0.021, 0.021, 12)
  const batches = p.finish()
  // Undo the bake, pose anatomically, then restore the mission convention.
  for (const batch of batches) {
    batch.geometry.rotateY(-Math.PI / 2).rotateZ(-0.48).rotateY(-0.16).translate(-0.018, 1.115, 0.258).rotateY(Math.PI / 2)
    batch.geometry.computeBoundingBox()
    batch.geometry.computeBoundingSphere()
  }
  return batches
}

// Fine surface breakup is generated once; no source images or random runtime state.
function surfaceTexture(fabric: boolean): THREE.DataTexture {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  const rng = mulberry32(fabric ? 8104 : 4197)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const weave = fabric ? ((x + (y % 4 < 2 ? 2 : 0)) % 4 < 2 ? 20 : -20) : 0
      const scratch = !fabric && y % 19 === 0 && x % 23 < 9 ? -40 : 0
      const value = Math.round(176 + rng() * 54 + weave + scratch)
      const index = (y * size + x) * 4
      data[index] = data[index + 1] = data[index + 2] = value
      data[index + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(fabric ? 5 : 3, fabric ? 5 : 3)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

export function createAgentResources(): AgentResources {
  const tint = (token: string, value: number) => new THREE.Color(token).multiplyScalar(value)
  const metalSurface = surfaceTexture(false)
  const fabricSurface = surfaceTexture(true)
  return {
    body: bodyParts(), leftLeg: legParts(-1), rightLeg: legParts(1), rifle: rifleParts(),
    materials: {
      armor: new THREE.MeshStandardMaterial({ color: new THREE.Color(PRINT_WHITE).lerp(new THREE.Color(AMBER), 0.055).multiplyScalar(0.075), roughness: 0.7, metalness: 0.32, map: metalSurface, roughnessMap: metalSurface, bumpMap: metalSurface, bumpScale: 0.0012 }),
      edge: new THREE.MeshStandardMaterial({ color: tint(PRINT_WHITE, 0.17), roughness: 0.6, metalness: 0.5, roughnessMap: metalSurface }),
      suit: new THREE.MeshStandardMaterial({ color: tint(PRINT_WHITE, 0.038), roughness: 1, metalness: 0, bumpMap: fabricSurface, bumpScale: 0.002 }),
      webbing: new THREE.MeshStandardMaterial({ color: new THREE.Color(GUN_IRON).lerp(new THREE.Color(AMBER), 0.4).multiplyScalar(0.14), roughness: 0.98, map: fabricSurface, metalness: 0, bumpMap: fabricSurface, bumpScale: 0.002 }),
      rubber: new THREE.MeshStandardMaterial({ color: new THREE.Color(BG).lerp(new THREE.Color(BODY_DEEP), 0.6), roughness: 0.92, metalness: 0.05 }),
    },
  }
}

export function addAgentModel(rig: THREE.Group, resources: AgentResources, optic: THREE.MeshStandardMaterial, armed: boolean) {
  function group(batches: Batch[], name: string): THREE.Group {
    const result = new THREE.Group()
    result.name = name
    for (const batch of batches) {
      const mesh = new THREE.Mesh(batch.geometry, batch.finish === 'optic' ? optic : resources.materials[batch.finish])
      mesh.name = `${name}-${batch.finish}`
      result.add(mesh)
    }
    return result
  }
  const body = group(resources.body, 'agent-body')
  const legL = group(resources.leftLeg, 'agent-leg-left')
  const legR = group(resources.rightLeg, 'agent-leg-right')
  legL.position.set(0, 0.81, 0.112)
  legR.position.set(0, 0.81, -0.112)
  rig.add(body, legL, legR)
  if (armed) rig.add(group(resources.rifle, 'agent-rifle'))
  return { legL, legR }
}
