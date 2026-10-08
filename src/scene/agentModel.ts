// Human operative and localized augmentations built from pooled geometry. Author in anatomical coordinates
// (+Z forward), then bake +X forward to preserve the mission's heading and gait.
import * as THREE from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { AMBER, BG, BODY_DEEP, GUN_IRON, PRINT_WHITE, SKIN, SKIN_SHADOW } from '../ui/tokens'
import { mulberry32 } from '../game/rng'

type V3 = [number, number, number]
type Finish = 'armor' | 'edge' | 'suit' | 'webbing' | 'rubber' | 'skin' | 'skinShadow' | 'optic'
// Center and elliptical radii of an anatomical cross-section.
type Section = [x: number, y: number, z: number, width: number, depth: number]
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

  // A continuous surface through body cross-sections; cloth folds change the
  // silhouette instead of leaving cylinders and exposed spherical joints.
  loft(finish: Finish, sections: Section[], folds = 0, segments = 20, sculpt?: (point: V3) => V3) {
    const positions: number[] = []
    const uv: number[] = []
    const indices: number[] = []
    for (let row = 0; row < sections.length; row++) {
      const [x, y, z, width, depth] = sections[row]
      const before = sections[Math.max(0, row - 1)]
      const after = sections[Math.min(sections.length - 1, row + 1)]
      const tangent = new THREE.Vector3(after[0] - before[0], after[1] - before[1], after[2] - before[2]).normalize()
      const horizontal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 0, 1)).normalize()
      const forward = new THREE.Vector3().crossVectors(horizontal, tangent).normalize()
      for (let column = 0; column < segments; column++) {
        const angle = column / segments * Math.PI * 2
        const fold = folds * Math.sin(row * 2.3 + angle * 3) * Math.sin(angle * 2 + row)
        const a = Math.cos(angle) * (width + fold)
        const b = Math.sin(angle) * (depth + fold)
        const point: V3 = [x + horizontal.x * a + forward.x * b, y + horizontal.y * a + forward.y * b, z + horizontal.z * a + forward.z * b]
        positions.push(...(sculpt ? sculpt(point) : point))
        uv.push(column / segments, row / (sections.length - 1))
        if (row < sections.length - 1) {
          const a = row * segments + column
          const b = row * segments + (column + 1) % segments
          indices.push(a, a + segments, b, b, a + segments, b + segments)
        }
      }
    }
    for (const row of [0, sections.length - 1]) {
      const center = positions.length / 3
      positions.push(...sections[row].slice(0, 3))
      uv.push(0.5, row === 0 ? 0 : 1)
      for (let column = 0; column < segments; column++) {
        const a = row * segments + column
        const b = row * segments + (column + 1) % segments
        indices.push(...(row === 0 ? [center, a, b] : [center, b, a]))
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    this.add(finish, geometry, [0, 0, 0])
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
  // Human rib cage, waist, hips and sloping trapezius under a combat shirt.
  p.loft('suit', [
    [0, 0.77, 0, 0.12, 0.079], [0, 0.82, 0, 0.19, 0.102],
    [0, 0.851, 0, 0.178, 0.104],
    [0, 0.89, 0, 0.145, 0.101], [0, 0.96, 0, 0.125, 0.095],
    [0, 1.05, 0, 0.14, 0.1], [0, 1.16, 0, 0.177, 0.11],
    [0, 1.25, -0.005, 0.189, 0.106], [0, 1.30, -0.005, 0.178, 0.096],
    [0, 1.34, 0, 0.128, 0.071], [0, 1.365, 0, 0.047, 0.046],
  ], 0.003)
  for (const side of [-1, 1]) p.ellipsoid('suit', [0.09, 0.086, 0.086], [side * 0.084, 0.828, -0.018])
  p.loft('webbing', [[0, 0.891, 0, 0.147, 0.104], [0, 0.92, 0, 0.14, 0.104]])
  p.box('edge', [0.045, 0.03, 0.012], [0, 0.907, 0.108], 0.004)
  p.box('rubber', [0.026, 0.017, 0.014], [0, 0.907, 0.11], 0.002)
  // A fabric carrier wraps the ribs; hard plates protect only the vital area.
  p.plate('webbing', 0.325, 0.30, 0.06, [0, 1.173, 0.10], 0.84)
  p.plate('armor', 0.257, 0.23, 0.025, [0, 1.215, 0.137], 0.8)
  p.plate('webbing', 0.285, 0.285, 0.055, [0, 1.18, -0.106], 0.8)
  for (const side of [-1, 1]) {
    p.box('webbing', [0.043, 0.19, 0.025], [side * 0.111, 1.28, 0.102], 0.007, [-0.2, 0, side * -0.09])
    p.box('webbing', [0.044, 0.022, 0.16], [side * 0.105, 1.352, -0.004], 0.009)
    p.box('edge', [0.039, 0.027, 0.012], [side * 0.111, 1.305, 0.131], 0.003)
    p.box('rubber', [0.024, 0.012, 0.016], [side * 0.111, 1.305, 0.134], 0.002)
    p.box('webbing', [0.065, 0.094, 0.054], [side * 0.151, 0.923, 0.044], 0.015)
    p.box('webbing', [0.061, 0.023, 0.055], [side * 0.151, 0.963, 0.048], 0.006)
  }
  for (let i = -1; i <= 1; i++) {
    p.box('webbing', [0.077, 0.108, 0.056], [i * 0.083, 1.122, 0.17], 0.014)
    p.box('webbing', [0.074, 0.025, 0.059], [i * 0.083, 1.168, 0.173], 0.007)
    p.box('rubber', [0.014, 0.059, 0.004], [i * 0.083, 1.123, 0.199], 0.002)
  }
  p.box('webbing', [0.186, 0.216, 0.075], [0, 1.175, -0.17], 0.025)
  for (const y of [1.13, 1.20]) p.box('webbing', [0.17, 0.02, 0.013], [0, y, -0.209], 0.005)
  p.box('rubber', [0.046, 0.097, 0.043], [0.12, 1.264, -0.137], 0.007)
  p.rod('edge', [0.12, 1.303, -0.145], [0.132, 1.531, -0.156], 0.003, 0.002)

  // Neck, jaw, cheekbones and nose stay visible below an open-face helmet.
  p.loft('skin', [[0, 1.342, 0, 0.046, 0.043], [0, 1.397, 0, 0.043, 0.042], [0, 1.447, 0, 0.049, 0.046]])
  p.loft('suit', [[0, 1.33, 0, 0.059, 0.055], [0, 1.382, 0, 0.05, 0.046]])
  p.loft('skin', [
    [0, 1.412, 0.022, 0.031, 0.040], [0, 1.426, 0.017, 0.047, 0.055],
    [0, 1.454, 0.006, 0.064, 0.069], [0, 1.475, 0, 0.068, 0.077], [0, 1.493, 0, 0.072, 0.078],
    [0, 1.522, -0.004, 0.074, 0.078], [0, 1.55, -0.006, 0.073, 0.08],
    [0, 1.588, -0.009, 0.069, 0.078], [0, 1.62, -0.013, 0.05, 0.056],
    [0, 1.637, -0.013, 0.012, 0.019],
  ], 0, 48, ([x, y, z]) => {
    if (z <= 0) return [x, y, z]
    // Broad facial plane with a continuous nose bridge, tip and brow ridge.
    const face = Math.exp(-Math.pow((y - 1.495) / 0.073, 4))
    const flatten = Math.min(0.014, Math.abs(x) * 0.23) * face
    const nose = 0.025 * Math.exp(-Math.pow(x / 0.014, 2) - Math.pow((y - 1.484) / 0.024, 2))
    const brow = 0.004 * Math.exp(-Math.pow((y - 1.535) / 0.009, 2))
    return [x, y, z + flatten + nose + brow]
  })
  p.ellipsoid('skinShadow', [0.018, 0.0017, 0.002], [0, 1.453, 0.076])
  p.ellipsoid('skin', [0.018, 0.002, 0.003], [0, 1.449, 0.075])
  for (const side of [-1, 1]) {
    p.ellipsoid('skin', [0.012, 0.023, 0.016], [side * 0.074, 1.496, -0.007])
    p.ellipsoid('skinShadow', [0.005, 0.013, 0.008], [side * 0.083, 1.496, -0.001])
    // Web chin strap follows the jaw instead of replacing it with a respirator.
    p.rod('rubber', [side * 0.076, 1.52, 0.008], [side * 0.055, 1.433, 0.034], 0.005)
    p.rod('rubber', [side * 0.055, 1.433, 0.034], [side * 0.023, 1.416, 0.042], 0.003)
  }
  p.ellipsoid('skinShadow', [0.018, 0.007, 0.008], [0.032, 1.517, 0.077])
  p.ellipsoid('edge', [0.011, 0.0028, 0.003], [0.032, 1.517, 0.082])
  p.ellipsoid('rubber', [0.0032, 0.003, 0.002], [0.032, 1.517, 0.084])
  p.rod('skinShadow', [0.016, 1.531, 0.083], [0.048, 1.532, 0.076], 0.004)
  p.loft('armor', [
    [0, 1.551, -0.017, 0.088, 0.096], [0, 1.585, -0.014, 0.086, 0.097],
    [0, 1.615, -0.014, 0.075, 0.082], [0, 1.64, -0.014, 0.055, 0.060],
    [0, 1.653, -0.014, 0.015, 0.021],
  ], 0, 24, ([x, y, z]) => {
    const rearCoverage = Math.max(0, Math.min(1, (0.042 - z) / 0.12))
    const lowerRim = Math.max(0, (1.615 - y) / 0.064)
    return [x, y - 0.064 * rearCoverage * lowerRim, z]
  })
  for (const side of [-1, 1]) {
    p.box('armor', [0.017, 0.045, 0.062], [side * 0.083, 1.539, -0.029], 0.007, [0, 0, side * 0.1])
    p.box('edge', [0.018, 0.009, 0.051], [side * 0.086, 1.565, -0.023], 0.003)
  }
  p.box('rubber', [0.162, 0.012, 0.033], [0, 1.554, 0.061], 0.005)
  p.box('webbing', [0.028, 0.018, 0.105], [0, 1.645, -0.023], 0.006)
  // One implanted optic and a temple interface; the other eye remains human.
  p.plate('armor', 0.038, 0.065, 0.014, [-0.067, 1.507, 0.037], 0.75, [0, -0.55, 0])
  p.rod('edge', [-0.034, 1.519, 0.071], [-0.034, 1.519, 0.091], 0.017, 0.017, 12)
  p.rod('rubber', [-0.034, 1.519, 0.091], [-0.034, 1.519, 0.095], 0.012, 0.012, 12)
  p.rod('optic', [-0.034, 1.519, 0.095], [-0.034, 1.519, 0.098], 0.006, 0.006, 12)
  p.rod('edge', [-0.048, 1.519, 0.081], [-0.077, 1.531, 0.021], 0.006)
  p.box('rubber', [0.023, 0.061, 0.051], [0.091, 1.508, -0.016], 0.014)
  p.rod('rubber', [0.098, 1.486, 0.006], [0.066, 1.45, 0.068], 0.003)
  p.ellipsoid('rubber', [0.012, 0.006, 0.006], [0.057, 1.449, 0.071])

  // Soft deltoids, upper arms and bent sleeves join into a natural shoulder line.
  for (const side of [-1, 1]) {
    const elbow: V3 = [side * 0.247, 1.077, 0.055]
    const hand: V3 = side < 0 ? [-0.075, 1.038, 0.275] : [0.233, 0.986, 0.283]
    p.loft('suit', [
      [elbow[0], elbow[1] - 0.022, elbow[2], 0.05, 0.053],
      [side * 0.251, 1.12, 0.034, 0.058, 0.059],
      [side * 0.239, 1.19, 0.014, 0.067, 0.066],
      [side * 0.213, 1.266, 0, 0.074, 0.069],
      [side * 0.18, 1.311, -0.008, 0.051, 0.056],
    ], 0.004, 16)
    const forearm: Section[] = []
    for (const [t, radius] of [[0, 0.048], [0.2, 0.055], [0.45, 0.05], [0.72, 0.041], [0.9, 0.033], [1, 0.032]]) {
      const point = new THREE.Vector3(...elbow).lerp(new THREE.Vector3(...hand), t)
      forearm.push([point.x, point.y, point.z, radius, radius * 0.92])
    }
    // A single augmented forearm breaks the symmetry without mechanizing the body.
    p.loft(side > 0 ? 'armor' : 'suit', forearm, side > 0 ? 0 : 0.003, 16)
    p.plate('armor', 0.09, 0.105, 0.025, [side * 0.257, 1.252, 0.053], 0.86, [0.04, side * 0.6, side * -0.32])
    p.plate('webbing', 0.072, 0.075, 0.017, [side * 0.257, 1.079, 0.013], 0.85, [0.2, side * 0.4, 0])
    p.rod('webbing', [side * 0.28, 1.148, 0.061], [side * 0.269, 1.18, 0.071], 0.004)
    p.rod('webbing', [side * 0.26, 1.20, 0.074], [side * 0.243, 1.22, 0.075], 0.003)
    for (const y of [1.229, 1.275]) p.ellipsoid('edge', [0.004, 0.004, 0.003], [side * 0.259, y, 0.07])
    if (side > 0) {
      p.rod('edge', [0.274, 1.063, 0.10], [0.261, 1.003, 0.233], 0.007, 0.006)
      p.box('optic', [0.019, 0.006, 0.012], [0.257, 1.032, 0.186], 0.002)
    }
    p.ellipsoid('rubber', [0.035, 0.037, 0.031], hand)
    for (let finger = 0; finger < 4; finger++) {
      p.ellipsoid('rubber', [0.007, 0.025, 0.014], [hand[0] - 0.023 + finger * 0.015, hand[1] - 0.007, hand[2] + 0.023])
    }
    p.ellipsoid('rubber', [0.011, 0.022, 0.012], [hand[0] - side * 0.027, hand[1] + 0.013, hand[2] + 0.012])
  }
  return p.finish()
}

function legParts(side: number): Batch[] {
  const p = new Parts()
  // Continuous trousers cover thighs, knees and calves. The hip remains the
  // mission gait pivot; stance widens a little toward each planted foot.
  const x = side * 0.028
  const z = side * 0.017
  p.loft('suit', [
    [x, -0.68, z - 0.02, 0.05, 0.057], [x, -0.63, z - 0.02, 0.061, 0.065],
    [x, -0.58, z - 0.015, 0.057, 0.065], [x * 0.85, -0.51, 0, 0.067, 0.074],
    [x * 0.75, -0.44, 0.009, 0.065, 0.07], [x * 0.6, -0.385, 0.022, 0.059, 0.063], [x * 0.6, -0.358, 0.025, 0.063, 0.068], [x * 0.6, -0.34, 0.019, 0.058, 0.065],
    [x * 0.5, -0.31, 0.014, 0.069, 0.073], [x * 0.35, -0.23, 0, 0.079, 0.087],
    [x * 0.2, -0.14, 0, 0.087, 0.098], [0, -0.06, 0, 0.092, 0.102],
    [0, 0.019, 0, 0.081, 0.090], [0, 0.06, 0, 0.066, 0.082],
  ], 0.004, 20)
  p.box('webbing', [0.045, 0.135, 0.095], [side * 0.081, -0.18, 0.009], 0.017)
  p.box('webbing', [0.047, 0.032, 0.098], [side * 0.081, -0.124, 0.012], 0.009)
  p.plate('rubber', 0.095, 0.099, 0.018, [x * 0.6, -0.37, 0.074], 0.83)
  p.plate('armor', 0.077, 0.079, 0.017, [x * 0.6, -0.369, 0.086], 0.79)
  p.plate('armor', 0.055, 0.14, 0.012, [x, -0.522, 0.068], 0.65, [0.09, 0, 0])
  // Leather boot shafts disappear under the gathered trouser cuffs.
  p.loft('rubber', [[x, -0.767, z - 0.015, 0.054, 0.068], [x, -0.715, z - 0.02, 0.05, 0.06], [x, -0.65, z - 0.02, 0.048, 0.052], [x, -0.626, z - 0.02, 0.05, 0.055]], 0, 16)
  p.box('rubber', [0.124, 0.033, 0.217], [x, -0.7935, z + 0.032], 0.014)
  p.ellipsoid('rubber', [0.059, 0.046, 0.096], [x, -0.752, z + 0.032])
  p.ellipsoid('rubber', [0.054, 0.032, 0.057], [x, -0.763, z + 0.079])
  for (let i = 0; i < 4; i++) {
    const y = -0.702 - i * 0.009
    const front = z + 0.033 + i * 0.014
    p.rod('webbing', [x - 0.023, y, front], [x + 0.023, y - 0.007, front + 0.014], 0.0025, 0.0025, 5)
    p.rod('webbing', [x + 0.023, y, front], [x - 0.023, y - 0.007, front + 0.014], 0.0025, 0.0025, 5)
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
      suit: new THREE.MeshStandardMaterial({ color: new THREE.Color(PRINT_WHITE).lerp(new THREE.Color(AMBER), 0.075).multiplyScalar(0.065), roughness: 1, metalness: 0, bumpMap: fabricSurface, bumpScale: 0.002 }),
      webbing: new THREE.MeshStandardMaterial({ color: new THREE.Color(GUN_IRON).lerp(new THREE.Color(AMBER), 0.4).multiplyScalar(0.14), roughness: 0.98, map: fabricSurface, metalness: 0, bumpMap: fabricSurface, bumpScale: 0.002 }),
      skin: new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.88, metalness: 0 }),
      skinShadow: new THREE.MeshStandardMaterial({ color: SKIN_SHADOW, roughness: 1, metalness: 0 }),
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
  legL.position.set(0, 0.81, 0.1)
  legR.position.set(0, 0.81, -0.1)
  rig.add(body, legL, legR)
  if (armed) rig.add(group(resources.rifle, 'agent-rifle'))
  return { legL, legR }
}
