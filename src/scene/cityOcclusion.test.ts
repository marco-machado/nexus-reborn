import { describe, expect, it } from 'vitest'
import { PerspectiveCamera, Vector3 } from 'three/webgpu'
import { MISSIONS } from '../game/data'
import { CAMERA_YAW, isWalkable } from '../game/types'
import type { CameraFootprint, CityData, Unit, Vec2 } from '../game/types'
import { generateCity } from '../world/citygen'
import { findPath } from '../game/pathfind'
import {
  CAMERA_GHOST_OPACITY,
  GHOST_OPACITY,
  TIER_CAMERA,
  TIER_CLEAR,
  TIER_SQUAD,
  ROUTE_PROBE_CAPACITY,
  appendRouteProbes,
  classifyOcclusion,
  collectOcclusionProbes,
  createOcclusionProbes,
  updateOcclusionFade,
} from './cityOcclusion'

type ProbeUnit = Pick<Unit, 'kind' | 'stance' | 'hp' | 'pos'>
interface Source { city: CityData; units: ProbeUnit[] }

// Captured from the pre-architecture CityView implementation. Keep this oracle
// independent of the production collector/classifier: the refactor must retain
// its existing street and squad cutaway coverage, including Float32 rounding.
function legacyOcclusion(source: Source, view: CameraFootprint | null, camera: Vector3): Uint8Array {
  const PROBE_Y = 1.4
  const MAX_SQUAD_PROBES = 8
  const PROBE_GRID = 6
  const probeX = new Float32Array(MAX_SQUAD_PROBES + PROBE_GRID * PROBE_GRID)
  const probeZ = new Float32Array(probeX.length)
  const probeTier = new Uint8Array(probeX.length)
  const getCameraFootprint = () => view
  function segmentHitsBox(
    px: number,
    py: number,
    pz: number,
    dx: number,
    dy: number,
    dz: number,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    h: number,
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
      let t1 = (0 - py) * inv
      let t2 = (h - py) * inv
      if (t1 > t2) {
        const t = t1
        t1 = t2
        t2 = t
      }
      if (t1 > tmin) tmin = t1
      if (t2 < tmax) tmax = t2
      if (tmin > tmax) return false
    } else if (py < 0 || py > h) {
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

  function collectProbes(w: Source): number {
    let n = 0
    for (const u of w.units) {
      if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
      if (n >= MAX_SQUAD_PROBES) break
      probeX[n] = u.pos.x
      probeZ[n] = u.pos.z
      probeTier[n] = TIER_SQUAD
      n++
    }
    const view = getCameraFootprint()
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
        if (!isWalkable(w.city, x, z)) continue
        probeX[n] = x
        probeZ[n] = z
        probeTier[n] = TIER_CAMERA
        n++
      }
    }
    return n
  }

  const boxes = new Float32Array(source.city.buildings.flatMap((b) => [b.x, b.z, b.x + b.w, b.z + b.d, b.h]))
  const occ = new Uint8Array(source.city.buildings.length)
  const n = collectProbes(source)
  const px = camera.x
  const py = camera.y
  const pz = camera.z
  for (let a = 0; a < n; a++) {
    const tier = probeTier[a]
    const dx = probeX[a] - px
    const dy = PROBE_Y - py
    const dz = probeZ[a] - pz
    for (let i = 0; i < occ.length; i++) {
      if (occ[i] >= tier) continue
      const o = i * 5
      if (segmentHitsBox(px, py, pz, dx, dy, dz, boxes[o], boxes[o + 1], boxes[o + 2], boxes[o + 3], boxes[o + 4])) {
        occ[i] = tier
      }
    }
  }
  return occ
}

function agent(x: number, z: number, overrides: Partial<ProbeUnit> = {}): ProbeUnit {
  return { kind: 'agent', stance: 'idle', hp: 100, pos: { x, z }, ...overrides }
}

function openCity(): CityData {
  const city = generateCity(MISSIONS[0])
  return { ...city, buildings: [], walk: new Uint8Array(city.size * city.size).fill(1) }
}

function square(x: number, z: number, width: number): CameraFootprint {
  return [{ x, z }, { x: x + width, z }, { x: x + width, z: z + width }, { x, z: z + width }]
}

function pose(focus: Vec2, distance: number): { camera: Vector3; footprint: CameraFootprint } {
  const elevation = 55 * Math.PI / 180
  const camera = new PerspectiveCamera(25, 1280 / 720, 2, 400)
  camera.position.set(
    focus.x + Math.sin(CAMERA_YAW) * Math.cos(elevation) * distance,
    Math.sin(elevation) * distance,
    focus.z + Math.cos(CAMERA_YAW) * Math.cos(elevation) * distance,
  )
  camera.lookAt(focus.x, 0, focus.z)
  camera.updateMatrixWorld()
  const footprint = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([x, y]) => {
    const ray = new Vector3(x, y, -1).unproject(camera).sub(camera.position).normalize()
    const t = Math.min(-camera.position.y / ray.y, 500)
    return { x: camera.position.x + ray.x * t, z: camera.position.z + ray.z * t }
  }) as unknown as CameraFootprint
  return { camera: camera.position, footprint }
}

describe('city occlusion coverage', () => {
  it('matches the captured legacy pass for every mission variant, camera limits, and split squads', () => {
    let cameraHits = 0
    let squadHits = 0
    for (const mission of MISSIONS) {
      for (const variant of mission.variants) {
        const city = generateCity(mission, variant)
        const units = city.spawnAgents.map((p) => agent(p.x, p.z))
        units[1] = agent(city.checkpoint.x, city.checkpoint.z)
        units[2] = agent(city.spawnAgents[2].x, city.spawnAgents[2].z, { stance: 'dead' })
        const source = { city, units }
        const boxes = new Float32Array(city.buildings.flatMap((b) => [b.x, 0, b.z, b.x + b.w, b.h, b.z + b.d]))
        const occluded = new Uint8Array(city.buildings.length)
        const probes = createOcclusionProbes()
        const focuses = [
          { x: 48, z: 84 }, { x: 48, z: 48 }, city.checkpoint,
          { x: 4, z: 4 }, { x: 92, z: 92 },
        ]
        for (const distance of [44, 72, 115]) {
          for (const focus of focuses) {
            const { camera, footprint } = pose(focus, distance)
            for (const view of [footprint, null]) {
              const count = collectOcclusionProbes(probes, source, view)
              classifyOcclusion(boxes, occluded, camera, probes, count)
              expect(occluded, `${mission.id}/${variant.seed}/${distance}/${focus.x},${focus.z}`).toEqual(
                legacyOcclusion(source, view, camera),
              )
              cameraHits += occluded.filter((tier) => tier === TIER_CAMERA).length
              squadHits += occluded.filter((tier) => tier === TIER_SQUAD).length
            }
          }
        }
      }
    }
    expect(cameraHits).toBeGreaterThan(0)
    expect(squadHits).toBeGreaterThan(0)
  })

  it('retains all 36 camera probes alongside eight living agents and ignores dead/non-agent units', () => {
    const probes = createOcclusionProbes()
    const source = {
      city: openCity(),
      units: [
        agent(90, 90, { kind: 'enemy' }), agent(91, 91, { stance: 'dead' }), agent(92, 92, { hp: 0 }),
        ...Array.from({ length: 9 }, (_, i) => agent(i + 1, i + 2)),
      ],
    }
    const count = collectOcclusionProbes(probes, source, square(0, 0, 6))
    expect(count).toBe(44)
    expect([...probes.x.slice(0, 8)]).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect([...probes.tier.slice(0, 8)]).toEqual(Array(8).fill(TIER_SQUAD))
    expect([...probes.tier.slice(8, count)]).toEqual(Array(36).fill(TIER_CAMERA))
    expect([probes.x[8], probes.z[8], probes.x[43], probes.z[43]]).toEqual([0.5, 0.5, 5.5, 5.5])
  })

  it('drops blocked and off-map camera probes, while keeping an operative on a blocked cell', () => {
    const probes = createOcclusionProbes()
    const city = openCity()
    city.walk.fill(0)
    city.walk[0] = 1
    const source = { city, units: [agent(2.5, 2.5)] }
    const count = collectOcclusionProbes(probes, source, square(-3, -3, 6))
    expect(count).toBe(2)
    expect([...probes.x.slice(0, count)]).toEqual([2.5, 0.5])
    expect([...probes.z.slice(0, count)]).toEqual([2.5, 0.5])
    expect([...probes.tier.slice(0, count)]).toEqual([TIER_SQUAD, TIER_CAMERA])
  })

  it('gives squad sightlines priority, fades all overlapping buildings, and clears stale tiers', () => {
    const probes = createOcclusionProbes()
    const city = openCity()
    const source = { city, units: [agent(10, 0)] }
    const count = collectOcclusionProbes(probes, source, square(8, 0, 4))
    const boxes = new Float32Array([
      3, 0, -1, 7, 8, 2,
      4, 0, -1, 8, 8, 2,
      3, 0, 1, 7, 8, 3,
      20, 0, 20, 25, 8, 25,
    ])
    const occluded = new Uint8Array(4)
    classifyOcclusion(boxes, occluded, { x: 0, y: 10, z: 0 }, probes, count)
    expect([...occluded]).toEqual([TIER_SQUAD, TIER_SQUAD, TIER_CAMERA, TIER_CLEAR])
    const cleared = collectOcclusionProbes(probes, { city, units: [] }, null)
    classifyOcclusion(boxes, occluded, { x: 0, y: 10, z: 0 }, probes, cleared)
    expect([...occluded]).toEqual([TIER_CLEAR, TIER_CLEAR, TIER_CLEAR, TIER_CLEAR])
  })

  it('ghosts an overhead sign only when its actual elevated volume crosses a sightline', () => {
    const probes = createOcclusionProbes()
    const count = collectOcclusionProbes(probes, { city: openCity(), units: [agent(10, 0)] }, null)
    const boxes = new Float32Array([4, 5, -1, 6, 7, 1])
    const occluded = new Uint8Array(1)
    classifyOcclusion(boxes, occluded, { x: 0, y: 10, z: 0 }, probes, count)
    expect(occluded[0]).toBe(TIER_SQUAD)
    classifyOcclusion(boxes, occluded, { x: 0, y: 1.4, z: 0 }, probes, count)
    expect(occluded[0]).toBe(TIER_CLEAR)
    classifyOcclusion(boxes, occluded, { x: 0, y: 20, z: 0 }, probes, count)
    expect(occluded[0]).toBe(TIER_CLEAR)
  })

  it('ignores geometry behind the camera or beyond the probe and handles parallel rays', () => {
    const probes = createOcclusionProbes()
    const count = collectOcclusionProbes(probes, { city: openCity(), units: [agent(10, 0)] }, null)
    const boxes = new Float32Array([
      -5, 0, -1, -1, 4, 1,
      11, 0, -1, 15, 4, 1,
      3, 0, -1, 7, 4, 1,
      3, 0, 2, 7, 4, 4,
    ])
    const occluded = new Uint8Array(4)
    classifyOcclusion(boxes, occluded, { x: 0, y: 1.4, z: 0 }, probes, count)
    expect([...occluded]).toEqual([TIER_CLEAR, TIER_CLEAR, TIER_SQUAD, TIER_CLEAR])
  })
})

describe('city occlusion fading', () => {
  it('preserves both opacity targets, the incoming/outgoing easing, and full restoration', () => {
    const fade = new Float32Array([1, 1, 1])
    const tiers = new Uint8Array([TIER_SQUAD, TIER_CAMERA, TIER_CLEAR])
    expect(updateOcclusionFade(fade, tiers, 0.05)).toBe(true)
    expect(fade[0]).toBe(Math.fround(1 + (0.16 - 1) * (1 - Math.exp(-10 * 0.05))))
    expect(fade[1]).toBe(Math.fround(1 + (0.45 - 1) * (1 - Math.exp(-10 * 0.05))))
    expect(fade[2]).toBe(1)
    for (let i = 0; i < 40; i++) updateOcclusionFade(fade, tiers, 0.05)
    expect([...fade]).toEqual([Math.fround(GHOST_OPACITY), Math.fround(CAMERA_GHOST_OPACITY), 1])
    const before = fade.slice()
    tiers.fill(TIER_CLEAR)
    updateOcclusionFade(fade, tiers, 0.05)
    expect(fade[0]).toBe(Math.fround(before[0] + (1 - before[0]) * (1 - Math.exp(-5 * 0.05))))
    expect(fade[1]).toBe(Math.fround(before[1] + (1 - before[1]) * (1 - Math.exp(-5 * 0.05))))
    for (let i = 0; i < 40; i++) updateOcclusionFade(fade, tiers, 0.05)
    expect([...fade]).toEqual([1, 1, 1])
    expect(updateOcclusionFade(fade, tiers, 0.05)).toBe(false)
  })

  it('snaps within the original 0.005 tolerance, including a squad-to-camera transition', () => {
    const fade = new Float32Array([0.164, 0.446, 0.996])
    const tiers = new Uint8Array([TIER_SQUAD, TIER_CAMERA, TIER_CLEAR])
    updateOcclusionFade(fade, tiers, 0.001)
    expect([...fade]).toEqual([Math.fround(0.16), Math.fround(0.45), 1])
    tiers[0] = TIER_CAMERA
    const before = fade[0]
    updateOcclusionFade(fade, tiers, 0.05)
    expect(fade[0]).toBe(Math.fround(before + (0.45 - before) * (1 - Math.exp(-5 * 0.05))))
  })
})

describe('explicit route visibility', () => {
  it('preserves the original probe prefix and ignores dead, non-agent, and empty routes', () => {
    const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
    const path = [{ x: 12, z: 12 }]
    const units = [
      { ...agent(8, 8), path },
      { ...agent(1, 1, { kind: 'enemy' }), path },
      { ...agent(2, 2, { stance: 'dead' }), path },
      { ...agent(3, 3, { hp: 0 }), path },
      { ...agent(4, 4), path: [] },
    ]
    const count = collectOcclusionProbes(probes, { city: openCity(), units }, square(0, 0, 6))
    const prefix = { x: probes.x.slice(0, count), z: probes.z.slice(0, count), tier: probes.tier.slice(0, count) }
    const total = appendRouteProbes(probes, units, count)
    expect(total).toBe(count + 8)
    expect(probes.x.slice(0, count)).toEqual(prefix.x)
    expect(probes.z.slice(0, count)).toEqual(prefix.z)
    expect(probes.tier.slice(0, count)).toEqual(prefix.tier)
    expect([...probes.tier.slice(count, total)]).toEqual(Array(8).fill(TIER_CAMERA))
    expect([probes.x[count], probes.z[count]]).toEqual([12, 12])
  })

  it('samples distance along the whole route, including corners and long straight segments', () => {
    const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
    const unit = { ...agent(0, 0), path: [{ x: 0, z: 0 }, { x: 8, z: 0 }, { x: 8, z: 8 }] }
    expect(appendRouteProbes(probes, [unit], 0)).toBe(8)
    expect([...probes.x.slice(0, 8)]).toEqual([8, 2, 4, 6, 8, 8, 8, 8])
    expect([...probes.z.slice(0, 8)]).toEqual([8, 0, 0, 0, 0, 2, 4, 6])
    unit.path = [{ x: 16, z: 0 }]
    expect(appendRouteProbes(probes, [unit], 0)).toBe(8)
    expect([...probes.x.slice(0, 8)]).toEqual([16, 2, 4, 6, 8, 10, 12, 14])
    unit.path = [{ x: 0, z: 0 }, { x: 0, z: 0 }]
    expect(appendRouteProbes(probes, [unit], 0)).toBe(1)
    expect([probes.x[0], probes.z[0]]).toEqual([0, 0])
  })

  it('caps added coverage at eight routes and 64 samples, respecting smaller buffers', () => {
    const units = Array.from({ length: 9 }, (_, i) => ({ ...agent(i, 0), path: [{ x: i, z: 16 }] }))
    const source = { city: openCity(), units }
    const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
    const count = collectOcclusionProbes(probes, source, square(0, 0, 6))
    expect(count).toBe(44)
    expect(probes.x.length).toBe(108)
    expect(appendRouteProbes(probes, units, count)).toBe(count + 64)
    for (let i = 0; i < 8; i++) {
      expect([probes.x[count + i * 8], probes.z[count + i * 8]]).toEqual([i, 16])
    }
    const original = createOcclusionProbes()
    collectOcclusionProbes(original, source, square(0, 0, 6))
    expect(appendRouteProbes(original, units, count)).toBe(44)
    const small = createOcclusionProbes(2)
    collectOcclusionProbes(small, source, square(0, 0, 6))
    expect(appendRouteProbes(small, units, count)).toBe(46)
    expect([small.x[44], small.z[44]]).toEqual([0, 16])
  })

  it('reveals the missed Glass Veil destination at maximum zoom and returns to original coverage when the route clears', () => {
    const city = generateCity(MISSIONS[0])
    const start = { x: 48.5, z: 18.5 }
    const destination = { x: 74.5, z: 10.5 }
    const unit = { ...agent(start.x, start.z), path: findPath(city, start, destination) }
    expect(unit.path.at(-1)).toEqual(destination)
    const { camera, footprint } = pose({ x: 74, z: 11 }, 115)
    const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
    const source = { city, units: [unit] }
    const boxes = new Float32Array(city.buildings.flatMap((b) => [b.x, 0, b.z, b.x + b.w, b.h, b.z + b.d]))
    const tiers = new Uint8Array(city.buildings.length)
    const originalCount = collectOcclusionProbes(probes, source, footprint)
    classifyOcclusion(boxes, tiers, camera, probes, originalCount)
    const original = tiers.slice()
    const foreground = city.buildings.findIndex((b) => b.x === 79 && b.z === 10)
    expect(foreground).toBeGreaterThanOrEqual(0)
    expect(tiers[foreground]).toBe(TIER_CLEAR)
    const count = appendRouteProbes(probes, source.units, originalCount)
    classifyOcclusion(boxes, tiers, camera, probes, count)
    expect(tiers[foreground]).toBe(TIER_CAMERA)
    for (let i = 0; i < tiers.length; i++) {
      expect(tiers[i]).toBeGreaterThanOrEqual(original[i])
      if (original[i] === TIER_SQUAD) expect(tiers[i]).toBe(TIER_SQUAD)
    }
    unit.path = []
    const clearCount = collectOcclusionProbes(probes, source, footprint)
    expect(appendRouteProbes(probes, source.units, clearCount)).toBe(originalCount)
    classifyOcclusion(boxes, tiers, camera, probes, clearCount)
    expect(tiers).toEqual(original)
  })

  it('never weakens squad ghosting when the same building also hides a route', () => {
    const probes = createOcclusionProbes(ROUTE_PROBE_CAPACITY)
    const unit = { ...agent(10, 0), path: [{ x: 12, z: 0 }] }
    const source = { city: openCity(), units: [unit] }
    const count = collectOcclusionProbes(probes, source, null)
    const total = appendRouteProbes(probes, source.units, count)
    const tiers = new Uint8Array(1)
    classifyOcclusion(new Float32Array([3, 0, -1, 7, 8, 1]), tiers, { x: 0, y: 10, z: 0 }, probes, total)
    expect(tiers[0]).toBe(TIER_SQUAD)
  })
})
