import { describe, it, expect } from 'vitest'
import type { Vec2 } from './types'
import type { WalkGrid } from './pathfind'
import { findPath, hasLos, nearestWalkable, straightenPath } from './pathfind'

// Builds a square WalkGrid from ASCII rows: '.' walkable, '#' blocked.
// Row index is z, character index is x, matching walk[z * size + x].
function grid(rows: string[]): WalkGrid {
  const size = rows.length
  const walk = new Uint8Array(size * size)
  rows.forEach((row, z) => {
    if (row.length !== size) throw new Error('grid rows must be square')
    for (let x = 0; x < size; x++) walk[z * size + x] = row[x] === '#' ? 0 : 1
  })
  return { size, walk }
}

function open(size: number): WalkGrid {
  return { size, walk: new Uint8Array(size * size).fill(1) }
}

function cellOf(g: WalkGrid, p: Vec2): number {
  return Math.floor(p.z) * g.size + Math.floor(p.x)
}

// Samples the segment a-b finely and reports whether every sampled point lies
// in a walkable cell. Independent of hasLos, so it can cross-check it.
function segmentWalkable(g: WalkGrid, a: Vec2, b: Vec2): boolean {
  const steps = 256
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    const x = a.x + (b.x - a.x) * t
    const z = a.z + (b.z - a.z) * t
    if (g.walk[Math.floor(z) * g.size + Math.floor(x)] !== 1) return false
  }
  return true
}

function polylineLength(start: Vec2, path: Vec2[]): number {
  let len = 0
  let prev = start
  for (const p of path) {
    len += Math.hypot(p.x - prev.x, p.z - prev.z)
    prev = p
  }
  return len
}

describe('findPath', () => {
  it('returns a single straightened waypoint at the exact dest across open ground', () => {
    const g = open(8)
    const res = findPath(g, { x: 1.5, z: 1.5 }, { x: 6.5, z: 6.25 })
    expect(res).toEqual([{ x: 6.5, z: 6.25 }])
  })

  it('detours around a wall and ends at the exact dest', () => {
    const g = grid([
      '........',
      '....#...',
      '....#...',
      '....#...',
      '....#...',
      '....#...',
      '....#...',
      '........',
    ])
    const start = { x: 2.5, z: 3.5 }
    const dest = { x: 6.5, z: 3.5 }
    const res = findPath(g, start, dest)
    expect(res.length).toBeGreaterThan(1)
    expect(res[res.length - 1]).toEqual(dest)
    for (const p of res) expect(g.walk[cellOf(g, p)]).toBe(1)
    let prev = start
    for (const p of res) {
      expect(segmentWalkable(g, prev, p)).toBe(true)
      prev = p
    }
    // The straight line is 4 long; the route must go around the wall.
    expect(polylineLength(start, res)).toBeGreaterThan(4.5)
  })

  it('returns [] when the grid has no walkable cell at all', () => {
    const g = grid(['#####', '#####', '#####', '#####', '#####'])
    expect(findPath(g, { x: 2.5, z: 2.5 }, { x: 0.5, z: 0.5 })).toEqual([])
  })

  it('returns [] when the start is sealed inside a one-cell pocket', () => {
    const g = grid(['.....', '.###.', '.#.#.', '.###.', '.....'])
    expect(findPath(g, { x: 2.5, z: 2.5 }, { x: 0.5, z: 0.5 })).toEqual([])
  })

  it('falls back to the closest approach when the dest is sealed off', () => {
    const g = grid(['.....', '.###.', '.#.#.', '.###.', '.....'])
    const dest = { x: 2.5, z: 2.5 }
    const res = findPath(g, { x: 0.5, z: 0.5 }, dest)
    expect(res.length).toBeGreaterThan(0)
    const last = res[res.length - 1]
    expect(last).not.toEqual(dest)
    expect(g.walk[cellOf(g, last)]).toBe(1)
    // Closest reachable centers sit exactly 2 away from the pocket center.
    expect(Math.hypot(last.x - dest.x, last.z - dest.z)).toBeCloseTo(2, 10)
  })

  it('returns just the dest when start and dest share a cell', () => {
    const g = open(4)
    const res = findPath(g, { x: 2.2, z: 2.8 }, { x: 2.7, z: 2.1 })
    expect(res).toEqual([{ x: 2.7, z: 2.1 }])
  })

  it('snaps an unwalkable dest to the nearest walkable cell center', () => {
    const g = grid(['......', '......', '......', '...#..', '......', '......'])
    const res = findPath(g, { x: 0.5, z: 0.5 }, { x: 3.6, z: 3.5 })
    expect(res.length).toBeGreaterThan(0)
    expect(res[res.length - 1]).toEqual({ x: 4.5, z: 3.5 })
  })

  it('keeps corners in an L corridor and never cuts through blocked cells', () => {
    const g = grid([
      '#######',
      '#.....#',
      '#####.#',
      '#####.#',
      '#####.#',
      '#.....#',
      '#######',
    ])
    const start = { x: 1.5, z: 1.5 }
    const dest = { x: 1.5, z: 5.5 }
    const res = findPath(g, start, dest)
    expect(res.length).toBeGreaterThanOrEqual(2)
    expect(res[res.length - 1]).toEqual(dest)
    for (const p of res) expect(g.walk[cellOf(g, p)]).toBe(1)
    let prev = start
    for (const p of res) {
      expect(segmentWalkable(g, prev, p)).toBe(true)
      prev = p
    }
  })
})

describe('hasLos', () => {
  it('is true across open space, straight and diagonal', () => {
    const g = open(6)
    expect(hasLos(g, { x: 0.5, z: 0.5 }, { x: 5.5, z: 5.4 })).toBe(true)
    expect(hasLos(g, { x: 0.5, z: 2.5 }, { x: 5.5, z: 2.5 })).toBe(true)
    expect(hasLos(g, { x: 0.5, z: 0.5 }, { x: 5.5, z: 5.5 })).toBe(true)
  })

  it('is blocked by a wall between the endpoints', () => {
    const g = grid(['...#..', '...#..', '...#..', '...#..', '...#..', '...#..'])
    expect(hasLos(g, { x: 1.5, z: 2.5 }, { x: 4.5, z: 2.5 })).toBe(false)
    // Same side of the wall stays clear.
    expect(hasLos(g, { x: 1.5, z: 2.5 }, { x: 2.5, z: 4.5 })).toBe(true)
  })

  it('is false from a blocked cell or out of bounds', () => {
    const g = grid(['....', '.#..', '....', '....'])
    expect(hasLos(g, { x: 1.5, z: 1.5 }, { x: 3.5, z: 3.5 })).toBe(false)
    expect(hasLos(g, { x: 0.5, z: 0.5 }, { x: 9.5, z: 0.5 })).toBe(false)
    expect(hasLos(g, { x: -1.5, z: 0.5 }, { x: 2.5, z: 0.5 })).toBe(false)
  })

  it('refuses an exact corner crossing when a side cell is blocked', () => {
    const g = grid(['....', '..#.', '.#..', '....'])
    expect(hasLos(g, { x: 1.5, z: 1.5 }, { x: 2.5, z: 2.5 })).toBe(false)
    const clear = open(4)
    expect(hasLos(clear, { x: 1.5, z: 1.5 }, { x: 2.5, z: 2.5 })).toBe(true)
  })
})

describe('nearestWalkable', () => {
  it('returns the containing cell center when the point is walkable', () => {
    const g = open(6)
    expect(nearestWalkable(g, { x: 2.3, z: 2.7 })).toEqual({ x: 2.5, z: 2.5 })
  })

  it('returns the nearest walkable center when the point is blocked', () => {
    const g = grid(['......', '......', '..#...', '......', '......', '......'])
    expect(nearestWalkable(g, { x: 2.9, z: 2.5 })).toEqual({ x: 3.5, z: 2.5 })
  })

  it('returns null when nothing is walkable', () => {
    const g = grid(['#####', '#####', '#####', '#####', '#####'])
    expect(nearestWalkable(g, { x: 2.5, z: 2.5 })).toBeNull()
  })

  it('clamps points outside the grid to the border cell', () => {
    const g = open(6)
    expect(nearestWalkable(g, { x: -3, z: -4 })).toEqual({ x: 0.5, z: 0.5 })
  })

  it('prefers a nearer cell one ring past the first hit', () => {
    const rows = Array.from({ length: 12 }, () => '#'.repeat(12).split(''))
    rows[7][7] = '.' // ring 1 from (6,6), center distance ~1.76 to p
    rows[6][4] = '.' // ring 2, center distance 1.55 to p
    const g = grid(rows.map((r) => r.join('')))
    expect(nearestWalkable(g, { x: 6.05, z: 6.5 })).toEqual({ x: 4.5, z: 6.5 })
  })
})

describe('straightenPath', () => {
  it('drops redundant waypoints but keeps corners around a wall', () => {
    const g = grid(['...', '##.', '...'])
    const start = { x: 0.5, z: 0.5 }
    const path: Vec2[] = [
      { x: 1.5, z: 0.5 },
      { x: 2.5, z: 0.5 },
      { x: 2.5, z: 1.5 },
      { x: 2.5, z: 2.5 },
      { x: 1.5, z: 2.5 },
      { x: 0.5, z: 2.5 },
    ]
    const res = straightenPath(g, start, path)
    expect(res).toEqual([
      { x: 2.5, z: 0.5 },
      { x: 2.5, z: 2.5 },
      { x: 0.5, z: 2.5 },
    ])
    let prev = start
    for (const p of res) {
      expect(segmentWalkable(g, prev, p)).toBe(true)
      prev = p
    }
  })

  it('returns short paths unchanged', () => {
    const g = open(4)
    const single: Vec2[] = [{ x: 2.5, z: 2.5 }]
    expect(straightenPath(g, { x: 0.5, z: 0.5 }, single)).toEqual(single)
    expect(straightenPath(g, { x: 0.5, z: 0.5 }, [])).toEqual([])
  })
})
