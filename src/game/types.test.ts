import { describe, it, expect } from 'vitest'
import type { CityData } from './types'
import {
  CITY_SIZE,
  CAMERA_YAW,
  ENEMY_VISION,
  VISION_HALF_ANGLE,
  NOTICE_RADIUS,
  cellIndex,
  isWalkable,
} from './types'

// Minimal CityData: only size and walk matter to the helpers under test.
function makeCity(size: number, walkable: Array<[number, number]>): CityData {
  const walk = new Uint8Array(size * size)
  for (const [cx, cz] of walkable) walk[cz * size + cx] = 1
  return {
    size,
    walk,
    buildings: [],
    props: [],
    lights: [],
    roadRects: [],
    roadsH: [],
    roadsV: [],
    spawnAgents: [],
    enemies: [],
    civilians: [],
    extraction: { x: 0, z: 0, r: 1 },
    checkpoint: { x: 0, z: 0, r: 1 },
  }
}

describe('cellIndex', () => {
  it('maps in-range cells row-major (cz * size + cx)', () => {
    expect(cellIndex(4, 0, 0)).toBe(0)
    expect(cellIndex(4, 3, 0)).toBe(3)
    expect(cellIndex(4, 0, 1)).toBe(4)
    expect(cellIndex(4, 3, 3)).toBe(15)
    expect(cellIndex(96, 95, 95)).toBe(96 * 96 - 1)
  })

  it('floors fractional coordinates into their cell', () => {
    expect(cellIndex(4, 2.99, 1.01)).toBe(cellIndex(4, 2, 1))
    expect(cellIndex(4, 0.5, 0.5)).toBe(0)
  })

  it('returns -1 outside the grid, including the far edge', () => {
    expect(cellIndex(4, -0.1, 1)).toBe(-1)
    expect(cellIndex(4, 1, -1)).toBe(-1)
    expect(cellIndex(4, 4, 1)).toBe(-1)
    expect(cellIndex(4, 1, 4)).toBe(-1)
    expect(cellIndex(4, 3.999, 3.999)).toBe(15)
  })
})

describe('isWalkable', () => {
  const city = makeCity(3, [
    [1, 1],
    [2, 0],
  ])

  it('is true on a walkable cell, anywhere inside the cell', () => {
    expect(isWalkable(city, 1, 1)).toBe(true)
    expect(isWalkable(city, 1.9, 1.9)).toBe(true)
    expect(isWalkable(city, 2.5, 0.5)).toBe(true)
  })

  it('is false on a blocked cell', () => {
    expect(isWalkable(city, 0, 0)).toBe(false)
    expect(isWalkable(city, 2, 2)).toBe(false)
  })

  it('is false outside the grid', () => {
    expect(isWalkable(city, -0.5, 1)).toBe(false)
    expect(isWalkable(city, 3, 1)).toBe(false)
    expect(isWalkable(city, 1, 3.2)).toBe(false)
  })
})

describe('constants', () => {
  it('pins the shared geometry values', () => {
    expect(CITY_SIZE).toBe(96)
    expect(CAMERA_YAW).toBe(Math.PI / 4)
  })

  it('keeps the vision model ordered', () => {
    expect(NOTICE_RADIUS).toBeGreaterThan(0)
    expect(ENEMY_VISION).toBeGreaterThan(NOTICE_RADIUS)
    expect(VISION_HALF_ANGLE).toBeGreaterThan(0)
    expect(VISION_HALF_ANGLE).toBeLessThan(Math.PI / 2)
  })
})
