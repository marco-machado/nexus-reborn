import { describe, it, expect } from 'vitest'
import type { CityData, DistrictArchetype, MissionDef, Vec2 } from '../game/types'
import { CITY_SIZE } from '../game/types'
import { MISSIONS } from '../game/data'
import { findPath, hasLos } from '../game/pathfind'
import { generateCity } from './citygen'

function makeMission(seed: number): MissionDef {
  return {
    id: 'm-test',
    codename: 'TESTBED',
    city: 'Testopolis',
    district: 'Grid Nine',
    sector: 'eu',
    type: 'strike',
    client: 'nobody',
    threat: 'MODERATE',
    reward: 1000,
    etaDays: 1,
    weather: 'none',
    openingHour: 22 * 3600 + 14 * 60 + 8,
    variants: [{ archetype: 'checkpoint', seed }],
    seed,
    briefing: [],
    notes: [],
    objectives: [],
    intelReq: 1,
    mapPos: { x: 0, y: 0 },
  }
}

function firstWalkDiff(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) return -2
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i
  return -1
}

// Cells occupied by blocking props. Cars span 4 cells along their axis
// (rot PI/2 lies along x, rot 0 along z, center 2 cells in); everything else
// blocks the single cell under its center.
function blockedPropCells(city: CityData): Set<number> {
  const cells = new Set<number>()
  const idx = (x: number, z: number): number => z * city.size + x
  for (const p of city.props) {
    if (!p.blocking) continue
    if (p.kind === 'car') {
      if (p.rot !== 0) {
        const sx = p.x - 2
        const z = Math.floor(p.z)
        for (let k = 0; k < 4; k++) cells.add(idx(sx + k, z))
      } else {
        const sz = p.z - 2
        const x = Math.floor(p.x)
        for (let k = 0; k < 4; k++) cells.add(idx(x, sz + k))
      }
    } else {
      cells.add(idx(Math.floor(p.x), Math.floor(p.z)))
    }
  }
  return cells
}

const SEEDS = [1, 7, 12345]

describe('generateCity', () => {
  it('is deterministic for a fixed seed: same roadRects and walk grid', () => {
    const a = generateCity(makeMission(12345))
    const b = generateCity(makeMission(12345))
    expect(a.roadRects).toEqual(b.roadRects)
    expect(firstWalkDiff(a.walk, b.walk)).toBe(-1)
  })

  it('produces different cities for different seeds', () => {
    const a = generateCity(makeMission(1))
    const b = generateCity(makeMission(2))
    const differs =
      firstWalkDiff(a.walk, b.walk) !== -1 ||
      JSON.stringify(a.roadRects) !== JSON.stringify(b.roadRects)
    expect(differs).toBe(true)
  })

  it('grid dimensions match CITY_SIZE', () => {
    const city = generateCity(makeMission(1))
    expect(city.size).toBe(CITY_SIZE)
    expect(city.walk.length).toBe(CITY_SIZE * CITY_SIZE)
  })

  it('every roadRect lies inside the city bounds', () => {
    for (const seed of SEEDS) {
      const city = generateCity(makeMission(seed))
      expect(city.roadRects.length).toBeGreaterThan(0)
      for (const r of city.roadRects) {
        expect(r.x0).toBeGreaterThanOrEqual(0)
        expect(r.z0).toBeGreaterThanOrEqual(0)
        expect(r.x1).toBeGreaterThan(r.x0)
        expect(r.z1).toBeGreaterThan(r.z0)
        expect(r.x1).toBeLessThanOrEqual(CITY_SIZE)
        expect(r.z1).toBeLessThanOrEqual(CITY_SIZE)
      }
    }
  })

  it('road cells are walkable unless a blocking prop occupies them', () => {
    for (const seed of SEEDS) {
      const city = generateCity(makeMission(seed))
      const propCells = blockedPropCells(city)
      const offenders: number[] = []
      let roadCells = 0
      for (const r of city.roadRects) {
        for (let z = r.z0; z < r.z1; z++) {
          for (let x = r.x0; x < r.x1; x++) {
            roadCells++
            const i = z * city.size + x
            if (city.walk[i] !== 1 && !propCells.has(i)) offenders.push(i)
          }
        }
      }
      expect(roadCells).toBeGreaterThan(0)
      expect(offenders).toEqual([])
    }
  })
})

// Validate visible obstacles as well as the simulation grid: the connectivity
// repair must not conceal an impassable wall behind a carved walkable cell.
function physicalGrid(city: CityData): { size: number; walk: Uint8Array } {
  const walk = city.walk.slice()
  for (const b of city.buildings) {
    for (let z = b.z; z < b.z + b.d; z++) {
      for (let x = b.x; x < b.x + b.w; x++) walk[z * city.size + x] = 0
    }
  }
  for (const i of blockedPropCells(city)) walk[i] = 0
  return { size: city.size, walk }
}

const GATE_SEEDS = [...new Set([
  ...Array.from({ length: 32 }, (_, i) => i + 1),
  12345,
  ...MISSIONS.flatMap((m) => m.variants.map((v) => v.seed)),
])]

function gateCity(archetype: DistrictArchetype, seed: number): CityData {
  return generateCity(makeMission(seed), { archetype, seed })
}

function pathLength(start: Vec2, path: Vec2[]): number {
  let length = 0
  let p = start
  for (const q of path) {
    length += Math.hypot(q.x - p.x, q.z - p.z)
    p = q
  }
  return length
}

describe('functional checkpoint passages', () => {
  it('takes every insertion operative through the checkpoint on the direct route, then into a connected onward street', () => {
    for (const seed of GATE_SEEDS) {
      const city = gateCity('checkpoint', seed)
      const grid = physicalGrid(city)
      const onward = { x: 48.5, z: 10.5 }
      const gate = city.landmarks.gate
      for (const start of city.spawnAgents) {
        const route = findPath(grid, start, onward)
        expect(route.at(-1), `seed ${seed}: onward destination`).toEqual(onward)
        const points = [start, ...route]
        const crossings: number[] = []
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1]
          const b = points[i]
          if (a.z <= gate.z || b.z > gate.z) continue
          const t = (gate.z - a.z) / (b.z - a.z)
          crossings.push(a.x + (b.x - a.x) * t)
        }
        expect(crossings, `seed ${seed}: direct gate crossing`).toHaveLength(1)
        expect(crossings[0]).toBeGreaterThanOrEqual(45)
        expect(crossings[0]).toBeLessThan(52)
      }

      const roads = new Uint8Array(city.size * city.size)
      for (const rect of city.roadRects) {
        for (let z = rect.z0; z < rect.z1; z++) {
          for (let x = rect.x0; x < rect.x1; x++) roads[z * city.size + x] = grid.walk[z * city.size + x]
        }
      }
      const roadGrid = { size: city.size, walk: roads }
      const start = city.spawnAgents[0]
      const direct = findPath(roadGrid, start, onward)
      expect(direct.at(-1)).toEqual(onward)
      // Closing the main crossing still leaves the longer eastern connection,
      // demonstrating both an onward loop and the gate's role on the avenue.
      for (let x = 45; x < 52; x++) roads[Math.floor(gate.z) * city.size + x] = 0
      const flank = findPath(roadGrid, start, onward)
      expect(flank.at(-1), `seed ${seed}: connected northern street`).toEqual(onward)
      expect(pathLength(start, flank) - pathLength(start, direct)).toBeGreaterThan(15)
    }
  })

  it('keeps all northern turn cells visibly open, with matching roads and deterministic buildings', () => {
    for (const seed of GATE_SEEDS) {
      const city = gateCity('checkpoint', seed)
      const cross = city.roadRects.find((r) => r.z0 === 8 && r.z1 === 14)
      expect(cross).toBeDefined()
      if (!cross) continue
      expect(city.roadsH).toContain((cross.z0 + cross.z1) / 2)
      const grid = physicalGrid(city)
      for (let z = cross.z0; z < cross.z1; z++) {
        for (let x = cross.x0; x < cross.x1; x++) {
          expect(city.walk[z * city.size + x], `seed ${seed}: road ${x},${z}`).toBe(1)
          expect(grid.walk[z * city.size + x], `seed ${seed}: geometry ${x},${z}`).toBe(1)
        }
      }
      const repeated = gateCity('checkpoint', seed)
      expect(repeated.buildings).toEqual(city.buildings)
      expect(repeated.roadRects).toEqual(city.roadRects)
      expect(repeated.walk).toEqual(city.walk)
    }
  })

  it('connects every compound gate and side entry to the objective interior without passing through rendered walls', () => {
    for (const seed of GATE_SEEDS) {
      const city = gateCity('compound', seed)
      const grid = physicalGrid(city)
      const gate = city.landmarks.gate
      const wallZ = Math.floor(gate.z) - 1
      const outside = { x: gate.x + 0.5, z: wallZ + 1.5 }
      const inside = { x: gate.x + 0.5, z: wallZ - 0.5 }
      expect(hasLos(grid, outside, inside), `seed ${seed}: compound gate`).toBe(true)
      expect(findPath(grid, city.spawnAgents[0], outside).at(-1)).toEqual(outside)
      expect(findPath(grid, inside, city.vips[0]).at(-1), `seed ${seed}: VIP interior`).toEqual(city.vips[0])
      const entry = city.landmarks['side-entry']
      const a = { x: entry.x - 1, z: entry.z + 0.5 }
      const b = { x: entry.x + 1, z: entry.z + 0.5 }
      expect(hasLos(grid, a, b), `seed ${seed}: side entry`).toBe(true)
      expect(findPath(grid, inside, entry).at(-1)).toEqual({ x: entry.x, z: entry.z })
    }
  })

  it('connects both industrial gates to their cross streets, each other, and the relay interiors', () => {
    for (const seed of GATE_SEEDS) {
      const city = gateCity('industrial', seed)
      const grid = physicalGrid(city)
      const fences = city.buildings.filter((b) => b.h === 2.2 && b.d === 1)
      const northZ = Math.min(...fences.map((b) => b.z))
      const southZ = Math.max(...fences.map((b) => b.z))
      const south = { x: city.landmarks.gate.x + 0.5, z: southZ - 0.5 }
      const north = { x: city.landmarks['waveEntry-b'].x + 0.5, z: northZ + 1.5 }
      for (const [inside, outside] of [
        [south, { x: south.x, z: southZ + 1.5 }],
        [north, { x: north.x, z: northZ - 0.5 }],
      ]) {
        expect(hasLos(grid, outside, inside), `seed ${seed}: industrial gate`).toBe(true)
        expect(findPath(grid, city.spawnAgents[0], outside).at(-1)).toEqual(outside)
        for (const device of city.devices) {
          expect(findPath(grid, inside, device.pos).at(-1), `seed ${seed}: ${device.tag}`).toEqual(device.pos)
        }
      }
      expect(findPath(grid, south, north).at(-1)).toEqual(north)
    }
  })

  it('keeps yard landmarks free of cover so connectivity never carves invisible passages through fences', () => {
    for (const seed of [...GATE_SEEDS, 238, 322, 480, 0, -1, -2147483648, 2147483647, 4294967295, 4294967296]) {
      const city = gateCity('industrial', seed)
      const grid = physicalGrid(city)
      expect(grid.walk, `seed ${seed}: rendered obstacles and walk grid`).toEqual(city.walk)
      for (const name of ['target', 'yard-a', 'yard-b']) {
        const p = city.landmarks[name]
        expect(grid.walk[Math.floor(p.z) * city.size + Math.floor(p.x)], `seed ${seed}: ${name}`).toBe(1)
      }
      const occupied = new Set(city.devices.map((d) => `${d.pos.x},${d.pos.z}`))
      expect(occupied.size, `seed ${seed}: distinct device positions`).toBe(city.devices.length)
    }
  })
})
