// Grid pathfinding over the CityData walk grid: A* (8-way, no diagonal corner
// cutting), DDA line of sight, path straightening, nearest-walkable spiral.
// Cells: index cz * size + cx, walkable when walk[i] === 1. World coords map to
// cells via floor; cell centers sit at (cx + 0.5, cz + 0.5).
import type { Vec2 } from './types'

export interface WalkGrid {
  size: number
  walk: Uint8Array
}

const SQRT2 = Math.SQRT2
const DX = [1, -1, 0, 0, 1, 1, -1, -1]
const DZ = [0, 0, 1, -1, 1, -1, 1, -1]
const COST = [1, 1, 1, 1, SQRT2, SQRT2, SQRT2, SQRT2]

// Scratch buffers reused across searches; generation stamps avoid clearing.
let cap = 0
let gScore = new Float64Array(0)
let fScore = new Float64Array(0)
let cameFrom = new Int32Array(0)
let openGen = new Int32Array(0)
let closedGen = new Int32Array(0)
let gen = 0
const heap: number[] = []
const cellPath: number[] = []

function ensure(size: number): void {
  const n = size * size
  if (n <= cap) return
  cap = n
  gScore = new Float64Array(n)
  fScore = new Float64Array(n)
  cameFrom = new Int32Array(n)
  openGen = new Int32Array(n)
  closedGen = new Int32Array(n)
}

function cellWalkable(grid: WalkGrid, cx: number, cz: number): boolean {
  return (
    cx >= 0 &&
    cz >= 0 &&
    cx < grid.size &&
    cz < grid.size &&
    grid.walk[cz * grid.size + cx] === 1
  )
}

function octile(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx)
  const dz = Math.abs(az - bz)
  return dx > dz ? dx + (SQRT2 - 1) * dz : dz + (SQRT2 - 1) * dx
}

function heapPush(n: number): void {
  heap.push(n)
  let i = heap.length - 1
  while (i > 0) {
    const p = (i - 1) >> 1
    if (fScore[heap[p]] <= fScore[heap[i]]) break
    const t = heap[p]
    heap[p] = heap[i]
    heap[i] = t
    i = p
  }
}

function heapPop(): number {
  const top = heap[0]
  const last = heap.pop()
  if (last !== undefined && heap.length > 0) {
    heap[0] = last
    let i = 0
    const n = heap.length
    for (;;) {
      const l = 2 * i + 1
      const r = l + 1
      let m = i
      if (l < n && fScore[heap[l]] < fScore[heap[m]]) m = l
      if (r < n && fScore[heap[r]] < fScore[heap[m]]) m = r
      if (m === i) break
      const t = heap[m]
      heap[m] = heap[i]
      heap[i] = t
      i = m
    }
  }
  return top
}

// True when the segment a-b crosses no blocked cell (DDA voxel traversal).
// Exact corner crossings require both side cells open, matching the A* rule
// that forbids cutting diagonal corners.
export function hasLos(grid: WalkGrid, a: Vec2, b: Vec2): boolean {
  const size = grid.size
  const walk = grid.walk
  let cx = Math.floor(a.x)
  let cz = Math.floor(a.z)
  const ex = Math.floor(b.x)
  const ez = Math.floor(b.z)
  if (cx < 0 || cz < 0 || cx >= size || cz >= size) return false
  if (ex < 0 || ez < 0 || ex >= size || ez >= size) return false
  if (walk[cz * size + cx] !== 1) return false
  const dx = b.x - a.x
  const dz = b.z - a.z
  const stepX = dx > 0 ? 1 : -1
  const stepZ = dz > 0 ? 1 : -1
  const tdx = dx === 0 ? Infinity : Math.abs(1 / dx)
  const tdz = dz === 0 ? Infinity : Math.abs(1 / dz)
  let tmx = dx === 0 ? Infinity : (dx > 0 ? cx + 1 - a.x : a.x - cx) * tdx
  let tmz = dz === 0 ? Infinity : (dz > 0 ? cz + 1 - a.z : a.z - cz) * tdz
  let guard = 4 * size
  while ((cx !== ex || cz !== ez) && guard-- > 0) {
    if (tmx < tmz) {
      tmx += tdx
      cx += stepX
    } else if (tmz < tmx) {
      tmz += tdz
      cz += stepZ
    } else {
      if (!cellWalkable(grid, cx + stepX, cz) || !cellWalkable(grid, cx, cz + stepZ)) {
        return false
      }
      tmx += tdx
      tmz += tdz
      cx += stepX
      cz += stepZ
    }
    if (cx < 0 || cz < 0 || cx >= size || cz >= size) return false
    if (walk[cz * size + cx] !== 1) return false
  }
  return true
}

// Nearest walkable cell center via expanding ring search. Scans one ring past
// the first hit because a nearer cell can sit in the next Chebyshev ring.
export function nearestWalkable(grid: WalkGrid, p: Vec2): Vec2 | null {
  const size = grid.size
  const cx0 = Math.min(size - 1, Math.max(0, Math.floor(p.x)))
  const cz0 = Math.min(size - 1, Math.max(0, Math.floor(p.z)))
  if (cellWalkable(grid, cx0, cz0)) return { x: cx0 + 0.5, z: cz0 + 0.5 }
  let bestX = 0
  let bestZ = 0
  let bestD = Infinity
  let foundR = -1
  for (let r = 1; r < size; r++) {
    if (foundR !== -1 && r > foundR + 1) break
    for (let dz = -r; dz <= r; dz++) {
      const az = cz0 + dz
      if (az < 0 || az >= size) continue
      const step = Math.abs(dz) === r ? 1 : 2 * r
      for (let dx = -r; dx <= r; dx += step) {
        const ax = cx0 + dx
        if (ax < 0 || ax >= size) continue
        if (grid.walk[az * size + ax] !== 1) continue
        const wx = ax + 0.5
        const wz = az + 0.5
        const ddx = wx - p.x
        const ddz = wz - p.z
        const d = ddx * ddx + ddz * ddz
        if (d < bestD) {
          bestD = d
          bestX = wx
          bestZ = wz
        }
      }
    }
    if (bestD < Infinity && foundR === -1) foundR = r
  }
  return bestD < Infinity ? { x: bestX, z: bestZ } : null
}

// Drops intermediate waypoints that the previous kept point can already see.
export function straightenPath(grid: WalkGrid, start: Vec2, path: Vec2[]): Vec2[] {
  if (path.length <= 1) return path
  const out: Vec2[] = []
  let anchor = start
  let i = 0
  while (i < path.length) {
    let j = path.length - 1
    while (j > i && !hasLos(grid, anchor, path[j])) j--
    const wp = path[j]
    out.push(wp)
    anchor = wp
    i = j + 1
  }
  return out
}

// A* from start to dest, returning straightened world waypoints. Unwalkable
// destinations snap to the nearest walkable cell; unreachable ones fall back
// to the closest approach the search found. Empty array means no move.
export function findPath(grid: WalkGrid, start: Vec2, dest: Vec2): Vec2[] {
  const size = grid.size
  const walk = grid.walk
  ensure(size)

  let sx = Math.floor(start.x)
  let sz = Math.floor(start.z)
  if (!cellWalkable(grid, sx, sz)) {
    const s = nearestWalkable(grid, start)
    if (s === null) return []
    sx = Math.floor(s.x)
    sz = Math.floor(s.z)
  }
  let endX = dest.x
  let endZ = dest.z
  if (!cellWalkable(grid, Math.floor(endX), Math.floor(endZ))) {
    const n = nearestWalkable(grid, dest)
    if (n === null) return []
    endX = n.x
    endZ = n.z
  }
  const ex = Math.floor(endX)
  const ez = Math.floor(endZ)
  if (sx === ex && sz === ez) return [{ x: endX, z: endZ }]

  gen += 1
  heap.length = 0
  const startN = sz * size + sx
  const goalN = ez * size + ex
  gScore[startN] = 0
  fScore[startN] = octile(sx, sz, ex, ez)
  cameFrom[startN] = -1
  openGen[startN] = gen
  heapPush(startN)
  let bestN = startN
  let bestH = octile(sx, sz, ex, ez)
  let found = false

  while (heap.length > 0) {
    const n = heapPop()
    if (closedGen[n] === gen) continue
    closedGen[n] = gen
    if (n === goalN) {
      found = true
      bestN = n
      break
    }
    const cx = n % size
    const cz = (n - cx) / size
    const h = octile(cx, cz, ex, ez)
    if (h < bestH) {
      bestH = h
      bestN = n
    }
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k]
      const nz = cz + DZ[k]
      if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue
      const nn = nz * size + nx
      if (walk[nn] !== 1 || closedGen[nn] === gen) continue
      if (k >= 4 && (walk[cz * size + nx] !== 1 || walk[nz * size + cx] !== 1)) continue
      const ng = gScore[n] + COST[k]
      if (openGen[nn] !== gen || ng < gScore[nn]) {
        openGen[nn] = gen
        gScore[nn] = ng
        // Tiny heuristic weight breaks ties toward straighter paths.
        fScore[nn] = ng + octile(nx, nz, ex, ez) * 1.0008
        cameFrom[nn] = n
        heapPush(nn)
      }
    }
  }

  cellPath.length = 0
  let n = found ? goalN : bestN
  while (n !== -1) {
    cellPath.push(n)
    n = cameFrom[n]
  }
  const out: Vec2[] = []
  for (let i = cellPath.length - 2; i >= 0; i--) {
    const c = cellPath[i]
    const cx = c % size
    out.push({ x: cx + 0.5, z: (c - cx) / size + 0.5 })
  }
  if (out.length === 0) return out
  if (found) out[out.length - 1] = { x: endX, z: endZ }
  return straightenPath(grid, start, out)
}
