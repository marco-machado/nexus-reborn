// Procedural city generator. Deterministic from mission.seed.
// Layout: a 5-wide north-south avenue feeds a walled checkpoint plaza in the
// north. 5-wide cross streets and 4-wide secondary vertical roads cut the rest
// into blocks packed with buildings. Walkable cells: streets, plaza and the
// 2- to 3-wide alleys left between building footprints.
// Neon side encoding (shared with the renderer): 0 faces +z, 1 faces +x,
// 2 faces -z, 3 faces -x.
import type {
  BuildingData,
  CityData,
  EnemySpawn,
  LightData,
  MissionDef,
  PropData,
  Vec2,
  WeaponId,
} from '../game/types'
import { CITY_SIZE } from '../game/types'

const NEON_COLORS = ['#ff2f6d', '#00e5ff', '#ffb300', '#7c4dff', '#39ff6a', '#ff5c2a']

const AVE = { x0: 46, x1: 51, z0: 8, z1: 94 }
const PLAZA = { x0: 41, x1: 55, z0: 8, z1: 20 }
const GATE_Z = 19
const CHECKPOINT = { x: 48, z: 14, r: 6 }
const EXTRACTION = { x: 48, z: 88, r: 4 }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface VSpan {
  x0: number
  x1: number
  z0: number
  z1: number
}

interface HSpan {
  z0: number
  z1: number
}

interface AlleyRect {
  x0: number
  z0: number
  x1: number
  z1: number
}

export function generateCity(mission: MissionDef): CityData {
  const size = CITY_SIZE
  const rnd = mulberry32(mission.seed)
  const ri = (a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1))
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]

  const walk = new Uint8Array(size * size).fill(1)
  const idx = (x: number, z: number): number => z * size + x
  const blockRect = (x0: number, z0: number, x1: number, z1: number): void => {
    for (let z = Math.max(0, z0); z < Math.min(size, z1); z++)
      for (let x = Math.max(0, x0); x < Math.min(size, x1); x++) walk[idx(x, z)] = 0
  }

  // Border ring, 2 cells.
  blockRect(0, 0, size, 2)
  blockRect(0, size - 2, size, size)
  blockRect(0, 0, 2, size)
  blockRect(size - 2, 0, size, size)

  // Street plan.
  const hStreets: HSpan[] = []
  let hz = ri(24, 27)
  while (hz + 5 <= 90) {
    hStreets.push({ z0: hz, z1: hz + 5 })
    hz += ri(13, 19)
  }
  const firstHz = hStreets[0].z0
  const vSecondary: VSpan[] = []
  for (const [a, b] of [
    [13, 18],
    [27, 34],
    [60, 68],
    [77, 84],
  ]) {
    const c = ri(a, b)
    vSecondary.push({ x0: c - 1, x1: c + 3, z0: firstHz, z1: 94 })
  }
  const avenue: VSpan = { x0: AVE.x0, x1: AVE.x1, z0: AVE.z0, z1: AVE.z1 }

  // Road mask, used for sampling civilian and patrol positions and by nothing
  // else. The plaza is walkable but not a road.
  const road = new Uint8Array(size * size)
  const paintRoad = (x0: number, z0: number, x1: number, z1: number): void => {
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) road[idx(x, z)] = 1
  }
  for (const st of hStreets) paintRoad(2, st.z0, 94, st.z1)
  for (const v of [avenue, ...vSecondary]) paintRoad(v.x0, v.z0, v.x1, v.z1)

  const buildings: BuildingData[] = []
  const props: PropData[] = []
  const alleys: AlleyRect[] = []

  // Towers cap at 26 so mid-map high-rises rarely wall off the squad from the
  // south-east camera; the north wall strip keeps its taller skyline.
  const heightFor = (kind: BuildingData['kind']): number =>
    kind === 'tower' ? ri(16, 26) : kind === 'slab' ? ri(12, 20) : kind === 'block' ? ri(8, 16) : ri(5, 9)

  const kindFor = (north: boolean): BuildingData['kind'] => {
    const t = rnd()
    if (north) return t < 0.4 ? 'tower' : t < 0.65 ? 'slab' : t < 0.9 ? 'block' : 'industrial'
    return t < 0.12 ? 'tower' : t < 0.32 ? 'slab' : t < 0.7 ? 'block' : 'industrial'
  }

  interface AxisSplit {
    segs: Array<[number, number]>
    gaps: Array<[number, number]>
  }

  const splitAxis = (a0: number, a1: number, n: number): AxisSplit => {
    if (n <= 1) return { segs: [[a0, a1]], gaps: [] }
    const cuts: number[] = [a0]
    const len = a1 - a0
    for (let i = 1; i < n; i++) cuts.push(a0 + Math.round((len * i) / n) + ri(-1, 1))
    cuts.push(a1)
    const segs: Array<[number, number]> = []
    const gaps: Array<[number, number]> = []
    for (let i = 0; i < n; i++) {
      let s = cuts[i]
      const e = cuts[i + 1]
      if (i > 0 && e - s > 4 && rnd() < 0.75) {
        const g = e - s > 6 ? 3 : 2
        gaps.push([s, s + g])
        s += g
      }
      if (e - s >= 3) segs.push([s, e])
    }
    return { segs, gaps }
  }

  const fillBlock = (
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    sN: boolean,
    sS: boolean,
    sE: boolean,
    sW: boolean,
  ): void => {
    const w = x1 - x0
    const d = z1 - z0
    if (w < 4 || d < 4) return
    let nx = Math.max(1, Math.min(3, Math.round(w / ri(9, 14))))
    let nz = Math.max(1, Math.min(2, Math.round(d / ri(8, 12))))
    if (nx * nz < 2) {
      if (w >= 9) nx = 2
      else if (d >= 9) nz = 2
    }
    while (nx * nz > 5) {
      if (nx > nz) nx -= 1
      else nz -= 1
    }
    const sx = splitAxis(x0, x1, nx)
    const sz = splitAxis(z0, z1, nz)
    for (const [gx0, gx1] of sx.gaps) alleys.push({ x0: gx0, z0, x1: gx1, z1 })
    for (const [gz0, gz1] of sz.gaps) alleys.push({ x0, z0: gz0, x1, z1: gz1 })
    for (const [bz0, bz1] of sz.segs) {
      for (const [bx0, bx1] of sx.segs) {
        const bw = bx1 - bx0
        const bd = bz1 - bz0
        const north = (bz0 + bz1) / 2 < 48
        let kind = kindFor(north)
        if (kind === 'tower' && Math.min(bw, bd) < 5) kind = 'slab'
        const b: BuildingData = { x: bx0, z: bz0, w: bw, d: bd, h: heightFor(kind), kind, tint: rnd() }
        const sides: Array<0 | 1 | 2 | 3> = []
        if (bz1 === z1 && sS) sides.push(0)
        if (bx1 === x1 && sE) sides.push(1)
        if (bz0 === z0 && sN) sides.push(2)
        if (bx0 === x0 && sW) sides.push(3)
        if (sides.length > 0 && rnd() < 0.35) {
          b.neon = { side: pick(sides), color: pick(NEON_COLORS), h: 0.25 + rnd() * 0.45 }
        }
        buildings.push(b)
        blockRect(bx0, bz0, bx1, bz1)
      }
    }
  }

  // North wall strip behind the checkpoint, solid row of tall buildings.
  let wx = 2
  while (wx < 90) {
    let bw = ri(8, 14)
    if (94 - wx - bw < 6) bw = 94 - wx
    const kind: BuildingData['kind'] = rnd() < 0.5 ? 'tower' : 'slab'
    const b: BuildingData = {
      x: wx,
      z: 2,
      w: bw,
      d: 6,
      h: kind === 'tower' ? ri(20, 32) : ri(14, 20),
      kind,
      tint: rnd(),
    }
    if (wx + bw > 38 && wx < 58 && rnd() < 0.6) {
      b.neon = { side: 0, color: pick(NEON_COLORS), h: 0.3 + rnd() * 0.35 }
    }
    buildings.push(b)
    blockRect(wx, 2, wx + bw, 8)
    wx += bw
  }

  // Bands between the wall, the plaza and the cross streets, filled with
  // blocks. Band 0 flanks the plaza, later bands sit between cross streets.
  interface Band {
    z0: number
    z1: number
    streetN: boolean
    streetS: boolean
  }
  const bands: Band[] = [{ z0: 8, z1: firstHz, streetN: false, streetS: true }]
  for (let i = 0; i < hStreets.length; i++) {
    bands.push({
      z0: hStreets[i].z1,
      z1: i + 1 < hStreets.length ? hStreets[i + 1].z0 : 94,
      streetN: true,
      streetS: i + 1 < hStreets.length,
    })
  }
  for (const band of bands) {
    const act: VSpan[] =
      band.z0 < firstHz
        ? [{ x0: PLAZA.x0, x1: PLAZA.x1, z0: band.z0, z1: band.z1 }]
        : [avenue, ...vSecondary].sort((p, q) => p.x0 - q.x0)
    let cx = 2
    for (const v of act) {
      fillBlock(cx, band.z0, v.x0, band.z1, band.streetN, band.streetS, true, cx !== 2)
      cx = v.x1
    }
    fillBlock(cx, band.z0, 94, band.z1, band.streetN, band.streetS, false, true)
  }

  // Checkpoint gate: two pillars flanking the avenue plus barriers with 1-cell
  // gaps across the avenue mouth of the plaza.
  for (const px of [45, 51]) {
    props.push({ x: px + 0.5, z: GATE_Z + 0.5, kind: 'pillar', rot: 0, blocking: true })
    walk[idx(px, GATE_Z)] = 0
  }
  for (const bx of [46, 48, 50]) {
    props.push({ x: bx + 0.5, z: GATE_Z + 0.5, kind: 'barrier', rot: 0, blocking: true })
    walk[idx(bx, GATE_Z)] = 0
  }

  // Parked cars along road edges. A car occupies 4 cells along its axis. Cars
  // never sit on cells belonging to a crossing street, so no street can be
  // severed by parking.
  let carCount = 0
  const tryCar = (sx: number, sz: number, alongX: boolean): void => {
    if (carCount >= 44) return
    for (let k = 0; k < 4; k++) {
      const cx = alongX ? sx + k : sx
      const cz = alongX ? sz : sz + k
      if (cx < 2 || cz < 2 || cx >= 94 || cz >= 94) return
      if (walk[idx(cx, cz)] !== 1) return
      if (cz > 82 && cx > 42 && cx < 54) return
      if (cz <= PLAZA.z1 + 2) return
      if (alongX) {
        for (const v of [avenue, ...vSecondary]) {
          if (cx >= v.x0 && cx < v.x1 && cz >= v.z0 && cz < v.z1) return
        }
      } else {
        for (const st of hStreets) if (cz >= st.z0 && cz < st.z1) return
      }
    }
    for (let k = 0; k < 4; k++) {
      if (alongX) walk[idx(sx + k, sz)] = 0
      else walk[idx(sx, sz + k)] = 0
    }
    props.push({
      x: alongX ? sx + 2 : sx + 0.5,
      z: alongX ? sz + 0.5 : sz + 2,
      kind: 'car',
      rot: alongX ? Math.PI / 2 : 0,
      blocking: true,
    })
    carCount++
  }
  for (const st of hStreets) {
    for (const row of [st.z0, st.z1 - 1]) {
      let x = ri(4, 9)
      while (x < 88) {
        if (rnd() < 0.5) tryCar(x, row, true)
        x += ri(9, 16)
      }
    }
  }
  for (const v of vSecondary) {
    for (const col of [v.x0, v.x1 - 1]) {
      let z = v.z0 + ri(2, 6)
      while (z < 88) {
        if (rnd() < 0.45) tryCar(col, z, false)
        z += ri(9, 16)
      }
    }
  }
  for (const col of [AVE.x0, AVE.x1 - 1]) {
    let z = 26
    while (z < 78) {
      if (rnd() < 0.4) tryCar(col, z, false)
      z += ri(10, 16)
    }
  }

  // Crates scattered across the plaza edges, keeping the gate lane and the
  // checkpoint core open.
  let crates = 0
  for (let guard = 0; guard < 80 && crates < 10; guard++) {
    const cx = ri(PLAZA.x0 + 1, PLAZA.x1 - 2)
    const cz = ri(PLAZA.z0 + 1, PLAZA.z1 - 2)
    if (cx >= 46 && cx <= 50 && cz >= 15) continue
    if (walk[idx(cx, cz)] !== 1) continue
    const blocking = rnd() < 0.5
    props.push({ x: cx + 0.5, z: cz + 0.5, kind: 'crate', rot: rnd() * Math.PI, blocking })
    if (blocking) walk[idx(cx, cz)] = 0
    crates++
  }

  // Dumpsters and crates in alleys.
  for (const a of alleys) {
    if (props.length > 200) break
    if (rnd() < 0.6) {
      const dx = ri(a.x0, a.x1 - 1)
      const dz = ri(a.z0, a.z1 - 1)
      if (dx >= 2 && dz >= 2 && dx < 94 && dz < 94 && walk[idx(dx, dz)] === 1) {
        props.push({ x: dx + 0.5, z: dz + 0.5, kind: 'dumpster', rot: a.x1 - a.x0 <= 3 ? 0 : Math.PI / 2, blocking: true })
        walk[idx(dx, dz)] = 0
      }
    }
    if (rnd() < 0.5) {
      const dx = ri(a.x0, a.x1 - 1)
      const dz = ri(a.z0, a.z1 - 1)
      if (dx >= 2 && dz >= 2 && dx < 94 && dz < 94 && walk[idx(dx, dz)] === 1) {
        const blocking = rnd() < 0.4
        props.push({ x: dx + 0.5, z: dz + 0.5, kind: 'crate', rot: rnd() * Math.PI, blocking })
        if (blocking) walk[idx(dx, dz)] = 0
      }
    }
  }

  // Lights. Street lamps along road edges, one neon light per neon banner.
  const capList = <T>(arr: T[], cap: number): T[] => {
    if (arr.length <= cap || cap <= 0) return arr.slice(0, Math.max(0, cap))
    const out: T[] = []
    const step = arr.length / cap
    for (let i = 0; i < cap; i++) out.push(arr[Math.floor(i * step)])
    return out
  }
  const streetLights: LightData[] = []
  for (const st of hStreets) {
    let x = ri(5, 9)
    let side = rnd() < 0.5
    while (x < 92) {
      streetLights.push({ x: x + 0.5, z: side ? st.z0 + 0.35 : st.z1 - 0.35, kind: 'street', color: '#ffb46b' })
      side = !side
      x += ri(9, 12)
    }
  }
  for (const v of vSecondary) {
    let z = v.z0 + 2
    let side = rnd() < 0.5
    while (z < 92) {
      streetLights.push({ x: side ? v.x0 + 0.35 : v.x1 - 0.35, z: z + 0.5, kind: 'street', color: '#ffb46b' })
      side = !side
      z += ri(9, 12)
    }
  }
  let az = 10
  let aside = false
  while (az < 92) {
    streetLights.push({ x: aside ? AVE.x0 + 0.35 : AVE.x1 - 0.35, z: az + 0.5, kind: 'street', color: '#ffb46b' })
    aside = !aside
    az += ri(9, 12)
  }
  const lights: LightData[] = capList(streetLights, 70)
  const neonLights: LightData[] = []
  for (const b of buildings) {
    if (!b.neon) continue
    const n = b.neon
    const p =
      n.side === 0
        ? { x: b.x + b.w / 2, z: b.z + b.d + 0.5 }
        : n.side === 1
          ? { x: b.x + b.w + 0.5, z: b.z + b.d / 2 }
          : n.side === 2
            ? { x: b.x + b.w / 2, z: b.z - 0.5 }
            : { x: b.x - 0.5, z: b.z + b.d / 2 }
    neonLights.push({ x: p.x, z: p.z, kind: 'neon', color: n.color })
  }
  lights.push(...capList(neonLights, 120 - lights.length))

  // Garrison around the plaza plus street patrols along mid-city roads.
  const enemies: EnemySpawn[] = []
  const plazaPoint = (): Vec2 => {
    for (let i = 0; i < 24; i++) {
      const px = ri(PLAZA.x0 + 1, PLAZA.x1 - 2)
      const pz = ri(PLAZA.z0 + 1, PLAZA.z1 - 2)
      if (walk[idx(px, pz)] === 1) return { x: px + 0.5, z: pz + 0.5 }
    }
    return { x: 48.5, z: 12.5 }
  }
  const garrisonWeapons: WeaponId[] = ['assault', 'smg', 'smg', 'assault', 'smg', 'assault']
  for (let i = 0; i < 6; i++) {
    const pos = plazaPoint()
    const patrol: Vec2[] = [pos]
    const extra = ri(1, 3)
    for (let k = 0; k < extra; k++) patrol.push(plazaPoint())
    enemies.push({ pos: { ...pos }, patrol, weapon: garrisonWeapons[i], tag: 'garrison', name: 'CORPSEC-0' + (i + 1) })
  }
  enemies.push({
    pos: { x: 42.5, z: 9.5 },
    patrol: [
      { x: 42.5, z: 9.5 },
      { x: 44.5, z: 10.5 },
    ],
    weapon: 'longrifle',
    tag: 'garrison',
    hp: 80,
    name: 'CORPSEC-07',
  })
  for (let k = 0; k < 5; k++) {
    const weapon: WeaponId = rnd() < 0.55 ? 'smg' : 'pistol'
    const patrol: Vec2[] = []
    if (k === 0) {
      const zStart = ri(34, 44)
      const n = ri(3, 4)
      for (let p = 0; p < n; p++) patrol.push({ x: 48.5, z: Math.min(86, zStart + p * ri(7, 10)) })
    } else {
      const st = hStreets[(k - 1) % hStreets.length]
      const zc = st.z0 + 1.5
      let px = ri(8, 40) + (k % 2 === 0 ? 34 : 0)
      const n = ri(3, 5)
      for (let p = 0; p < n; p++) {
        patrol.push({ x: Math.min(91, px) + 0.5, z: zc })
        px += ri(6, 10)
      }
    }
    enemies.push({ pos: { ...patrol[0] }, patrol, weapon, name: 'CORPSEC-' + String(8 + k).padStart(2, '0') })
  }

  const spawnAgents: Vec2[] = [
    { x: 46.5, z: 88.5 },
    { x: 47.5, z: 88.5 },
    { x: 48.5, z: 88.5 },
    { x: 49.5, z: 88.5 },
  ]

  // Civilians on street cells in the south two-thirds, away from the
  // checkpoint.
  const civilians: Vec2[] = []
  const candidates: number[] = []
  for (let z = 34; z < 92; z++) {
    for (let x = 2; x < 94; x++) {
      const i = idx(x, z)
      if (road[i] !== 1 || walk[i] !== 1) continue
      const dx = x + 0.5 - CHECKPOINT.x
      const dz = z + 0.5 - CHECKPOINT.z
      if (dx * dx + dz * dz > 400) candidates.push(i)
    }
  }
  for (let want = 22; want > 0 && candidates.length > 0; want--) {
    const j = Math.floor(rnd() * candidates.length)
    const i = candidates[j]
    candidates[j] = candidates[candidates.length - 1]
    candidates.pop()
    civilians.push({ x: (i % size) + 0.5, z: Math.floor(i / size) + 0.5 })
  }

  // Connectivity guarantee. Flood fill from the first spawn, carve straight
  // L corridors to anything that ended up sealed, then snap every unit point
  // to the nearest reachable cell.
  const reach = new Uint8Array(size * size)
  const queue = new Int32Array(size * size)
  const spawnCx = Math.floor(spawnAgents[0].x)
  const spawnCz = Math.floor(spawnAgents[0].z)
  const flood = (): void => {
    reach.fill(0)
    let head = 0
    let tail = 0
    const s = idx(spawnCx, spawnCz)
    walk[s] = 1
    reach[s] = 1
    queue[tail++] = s
    while (head < tail) {
      const c = queue[head++]
      const cx = c % size
      const cz = (c / size) | 0
      if (cx > 0 && walk[c - 1] === 1 && reach[c - 1] === 0) {
        reach[c - 1] = 1
        queue[tail++] = c - 1
      }
      if (cx < size - 1 && walk[c + 1] === 1 && reach[c + 1] === 0) {
        reach[c + 1] = 1
        queue[tail++] = c + 1
      }
      if (cz > 0 && walk[c - size] === 1 && reach[c - size] === 0) {
        reach[c - size] = 1
        queue[tail++] = c - size
      }
      if (cz < size - 1 && walk[c + size] === 1 && reach[c + size] === 0) {
        reach[c + size] = 1
        queue[tail++] = c + size
      }
    }
  }
  const carve = (tx: number, tz: number): void => {
    const zStep = tz >= spawnCz ? 1 : -1
    for (let z = spawnCz; z !== tz + zStep; z += zStep) {
      for (const dx of [0, 1]) {
        const x = Math.max(2, Math.min(93, spawnCx + dx))
        if (z >= 2 && z <= 93) walk[idx(x, z)] = 1
      }
    }
    const xStep = tx >= spawnCx ? 1 : -1
    for (let x = spawnCx; x !== tx + xStep; x += xStep) {
      for (const dz of [0, 1]) {
        const z = Math.max(2, Math.min(93, tz + dz))
        if (x >= 2 && x <= 93) walk[idx(x, z)] = 1
      }
    }
  }
  const ensure = (p: Vec2): void => {
    const cx = Math.max(2, Math.min(93, Math.floor(p.x)))
    const cz = Math.max(2, Math.min(93, Math.floor(p.z)))
    if (reach[idx(cx, cz)] === 1) return
    carve(cx, cz)
    flood()
  }
  flood()
  ensure({ x: CHECKPOINT.x, z: CHECKPOINT.z })
  ensure({ x: EXTRACTION.x, z: EXTRACTION.z })
  for (const e of enemies) {
    ensure(e.pos)
    for (const p of e.patrol) ensure(p)
  }

  const snap = (p: Vec2): Vec2 => {
    const cx = Math.max(2, Math.min(93, Math.floor(p.x)))
    const cz = Math.max(2, Math.min(93, Math.floor(p.z)))
    if (reach[idx(cx, cz)] === 1) return { x: cx + 0.5, z: cz + 0.5 }
    for (let radius = 1; radius <= 12; radius++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue
          const nx = cx + dx
          const nz = cz + dz
          if (nx < 2 || nz < 2 || nx > 93 || nz > 93) continue
          if (reach[idx(nx, nz)] === 1) return { x: nx + 0.5, z: nz + 0.5 }
        }
      }
    }
    return { x: cx + 0.5, z: cz + 0.5 }
  }
  for (const e of enemies) {
    e.pos = snap(e.pos)
    e.patrol = e.patrol.map(snap)
  }
  for (let i = 0; i < spawnAgents.length; i++) spawnAgents[i] = snap(spawnAgents[i])
  for (let i = 0; i < civilians.length; i++) civilians[i] = snap(civilians[i])

  // Keep the south rim low so the default south-east camera never has tall
  // foreground towers between the eye and the insertion zone.
  for (const b of buildings) {
    if (b.z + b.d > 82) b.h = Math.min(b.h, 7)
    else if (b.z + b.d > 70) b.h = Math.min(b.h, 14)
  }

  return {
    size,
    walk,
    buildings,
    props,
    lights,
    roadsH: hStreets.map((s) => s.z0 + 2),
    roadsV: [48, ...vSecondary.map((v) => v.x0 + 1)].sort((a, b) => a - b),
    spawnAgents,
    enemies,
    civilians,
    extraction: { ...EXTRACTION },
    checkpoint: { ...CHECKPOINT },
  }
}
