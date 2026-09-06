// Allocation-free city visibility classification. The renderer owns these
// buffers; camera/simulation data are inputs so cutaway coverage stays testable.
import { isWalkable } from '../game/types'
import type { CameraFootprint, CityData, Unit } from '../game/types'

export const GHOST_OPACITY = 0.16
export const CAMERA_GHOST_OPACITY = 0.45
export const GHOST_IN_RATE = 10
export const GHOST_OUT_RATE = 5
export const TIER_CLEAR = 0
export const TIER_CAMERA = 1
export const TIER_SQUAD = 2

const PROBE_Y = 1.4
const MAX_SQUAD_PROBES = 8
const PROBE_GRID = 6
const ROUTE_POINTS_PER_AGENT = 8
export const ROUTE_PROBE_CAPACITY = MAX_SQUAD_PROBES * ROUTE_POINTS_PER_AGENT

export interface OcclusionProbes {
  x: Float32Array
  z: Float32Array
  tier: Uint8Array
}

interface OcclusionSource {
  city: CityData
  units: ReadonlyArray<Pick<Unit, 'kind' | 'stance' | 'hp' | 'pos'>>
}

export function createOcclusionProbes(extraCapacity = 0): OcclusionProbes {
  const count = MAX_SQUAD_PROBES + PROBE_GRID * PROBE_GRID + extraCapacity
  return { x: new Float32Array(count), z: new Float32Array(count), tier: new Uint8Array(count) }
}

// The original 6x6 world-space quad interpolation, following up to eight
// living operatives. Blocked/off-map pavement probes do not fade buildings.
export function collectOcclusionProbes(
  probes: OcclusionProbes,
  source: OcclusionSource,
  view: CameraFootprint | null,
): number {
  let n = 0
  for (const u of source.units) {
    if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
    if (n >= MAX_SQUAD_PROBES) break
    probes.x[n] = u.pos.x
    probes.z[n] = u.pos.z
    probes.tier[n] = TIER_SQUAD
    n++
  }
  if (!view) return n
  for (let r = 0; r < PROBE_GRID; r++) {
    const fr = (r + 0.5) / PROBE_GRID
    const ax = view[0].x + (view[3].x - view[0].x) * fr
    const az = view[0].z + (view[3].z - view[0].z) * fr
    const bx = view[1].x + (view[2].x - view[1].x) * fr
    const bz = view[1].z + (view[2].z - view[1].z) * fr
    for (let c = 0; c < PROBE_GRID; c++) {
      const fc = (c + 0.5) / PROBE_GRID
      const x = ax + (bx - ax) * fc
      const z = az + (bz - az) * fc
      if (!isWalkable(source.city, x, z)) continue
      probes.x[n] = x
      probes.z[n] = z
      probes.tier[n] = TIER_CAMERA
      n++
    }
  }
  return n
}

// The broad street grid stays intact. Explicit routes add their destination
// first, followed by seven equal-distance samples along the remaining path.
// Current unit positions already have stronger squad probes; long straight
// segments need intermediate samples just as paths around corners do.
export function appendRouteProbes(
  probes: OcclusionProbes,
  units: ReadonlyArray<Pick<Unit, 'kind' | 'stance' | 'hp' | 'pos' | 'path'>>,
  count: number,
): number {
  const limit = Math.min(probes.x.length, probes.z.length, probes.tier.length, count + ROUTE_PROBE_CAPACITY)
  let n = count
  let routes = 0
  for (const unit of units) {
    if (n >= limit || routes >= MAX_SQUAD_PROBES) break
    if (unit.kind !== 'agent' || unit.stance === 'dead' || unit.hp <= 0 || unit.path.length === 0) continue
    routes++
    const path = unit.path
    const destination = path[path.length - 1]
    probes.x[n] = destination.x
    probes.z[n] = destination.z
    probes.tier[n++] = TIER_CAMERA

    let length = 0
    let px = unit.pos.x
    let pz = unit.pos.z
    for (const point of path) {
      length += Math.hypot(point.x - px, point.z - pz)
      px = point.x
      pz = point.z
    }
    if (length === 0) continue

    let segment = 0
    let covered = 0
    px = unit.pos.x
    pz = unit.pos.z
    let segmentLength = Math.hypot(path[0].x - px, path[0].z - pz)
    for (let sample = 1; sample < ROUTE_POINTS_PER_AGENT && n < limit; sample++) {
      const distance = length * sample / ROUTE_POINTS_PER_AGENT
      while (segment < path.length - 1 && covered + segmentLength < distance) {
        covered += segmentLength
        px = path[segment].x
        pz = path[segment].z
        segment++
        segmentLength = Math.hypot(path[segment].x - px, path[segment].z - pz)
      }
      const fraction = segmentLength > 0 ? (distance - covered) / segmentLength : 0
      probes.x[n] = px + (path[segment].x - px) * fraction
      probes.z[n] = pz + (path[segment].z - pz) * fraction
      probes.tier[n++] = TIER_CAMERA
    }
  }
  return n
}

// Segment-vs-AABB slab test with t clamped to [0, 1]. Independent lower and
// upper Y bounds also cover overhead signs without treating the passage as solid.
function segmentHitsBox(
  px: number,
  py: number,
  pz: number,
  dx: number,
  dy: number,
  dz: number,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
): boolean {
  let tmin = 0
  let tmax = 1
  if (dx !== 0) {
    const inv = 1 / dx
    let t1 = (x0 - px) * inv
    let t2 = (x1 - px) * inv
    if (t1 > t2) {
      const t = t1
      t1 = t2
      t2 = t
    }
    if (t1 > tmin) tmin = t1
    if (t2 < tmax) tmax = t2
    if (tmin > tmax) return false
  } else if (px < x0 || px > x1) {
    return false
  }
  if (dy !== 0) {
    const inv = 1 / dy
    let t1 = (y0 - py) * inv
    let t2 = (y1 - py) * inv
    if (t1 > t2) {
      const t = t1
      t1 = t2
      t2 = t
    }
    if (t1 > tmin) tmin = t1
    if (t2 < tmax) tmax = t2
    if (tmin > tmax) return false
  } else if (py < y0 || py > y1) {
    return false
  }
  if (dz !== 0) {
    const inv = 1 / dz
    let t1 = (z0 - pz) * inv
    let t2 = (z1 - pz) * inv
    if (t1 > t2) {
      const t = t1
      t1 = t2
      t2 = t
    }
    if (t1 > tmin) tmin = t1
    if (t2 < tmax) tmax = t2
    if (tmin > tmax) return false
  } else if (pz < z0 || pz > z1) {
    return false
  }
  return tmin < tmax
}

// Boxes pack [x0, y0, z0, x1, y1, z1] per occluder. A squad sightline wins
// over street visibility; every intersected occluder fades, including overlaps.
export function classifyOcclusion(
  boxes: Float32Array,
  occluded: Uint8Array,
  camera: { x: number; y: number; z: number },
  probes: OcclusionProbes,
  count: number,
): void {
  occluded.fill(TIER_CLEAR)
  const px = camera.x
  const py = camera.y
  const pz = camera.z
  for (let a = 0; a < count; a++) {
    const tier = probes.tier[a]
    const dx = probes.x[a] - px
    const dy = PROBE_Y - py
    const dz = probes.z[a] - pz
    for (let i = 0; i < occluded.length; i++) {
      if (occluded[i] >= tier) continue
      const o = i * 6
      if (segmentHitsBox(px, py, pz, dx, dy, dz, boxes[o], boxes[o + 1], boxes[o + 2], boxes[o + 3], boxes[o + 4], boxes[o + 5])) {
        occluded[i] = tier
      }
    }
  }
}

// Original opacity targets, exponential rates, and snap threshold. Return the
// dirty flag separately so instance ownership/swap logic stays in the renderer.
export function updateOcclusionFade(fade: Float32Array, tiers: Uint8Array, dt: number): boolean {
  const kIn = 1 - Math.exp(-GHOST_IN_RATE * dt)
  const kOut = 1 - Math.exp(-GHOST_OUT_RATE * dt)
  let dirty = false
  for (let i = 0; i < fade.length; i++) {
    const target = tiers[i] === TIER_SQUAD ? GHOST_OPACITY : tiers[i] === TIER_CAMERA ? CAMERA_GHOST_OPACITY : 1
    let f = fade[i]
    if (f !== target) {
      f += (target - f) * (target < f ? kIn : kOut)
      if (Math.abs(f - target) < 0.005) f = target
      fade[i] = f
      dirty = true
    }
  }
  return dirty
}
