import { describe, it, expect } from 'vitest'
import type { CityData, MissionDef } from '../game/types'
import { CITY_SIZE } from '../game/types'
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
