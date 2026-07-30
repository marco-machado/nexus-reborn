// Procedural city generator. Deterministic from the district seed, dispatched
// over three archetypes:
// - checkpoint: a 7-wide north-south avenue feeds a walled checkpoint plaza in
//   the north (Glass Veil). This is the original layout, unchanged.
// - compound: a walled detention compound between the first two cross streets
//   in the east, one gated entry and one breachable side entry. The side flank
//   comes from seed parity, so the two authored variants mirror each other.
// - industrial: a fenced relay yard between the first two cross streets, two
//   gates, two sub-yards holding the device spawns, wider streets. The
//   sub-yard split axis comes from seed parity.
// Shared for every archetype: cross streets, block fill with setback and alley
// rules, props, lights, the flood-fill connectivity guarantee (extended over
// every landmark, vip, device and wave entry), and the south insertion.
// Walls and fences are emitted as low buildings, so the minimap, the brief map
// and the occlusion pass pick them up with no extra plumbing.
// Neon side encoding (shared with the renderer): 0 faces +z, 1 faces +x,
// 2 faces -z, 3 faces -x.
import type {
  BuildingData,
  CityData,
  DistrictSpec,
  EnemySpawn,
  LightData,
  MissionDef,
  PropData,
  RoadRect,
  Vec2,
  WeaponId,
  Zone,
} from '../game/types'
import { CITY_SIZE } from '../game/types'

const NEON_COLORS = ['#ff2f6d', '#00e5ff', '#ffb300', '#7c4dff', '#39ff6a', '#ff5c2a']

const AVE = { x0: 45, x1: 52, z0: 8, z1: 94 }
const PLAZA = { x0: 39, x1: 57, z0: 8, z1: 20 }
const GATE_Z = 19
const CHECKPOINT = { x: 48, z: 14, r: 6 }
const EXTRACTION = { x: 48, z: 88, r: 4 }

// Paved widths and the open margins that keep buildings off the kerb.
const SETBACK = 2
const ALLEY_W = 4
const MIN_SIDE = 4

// Generation knobs the mission modifiers feed (game/missionParams.ts).
export interface GenParams {
  enemyExtra: number
  civilianCount: number
}

const DEFAULT_GEN: GenParams = { enemyExtra: 0, civilianCount: 22 }

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

export function generateCity(
  mission: MissionDef,
  spec?: DistrictSpec,
  gen?: Partial<GenParams>,
): CityData {
  const district = spec ?? mission.variants[0] ?? { archetype: 'checkpoint' as const, seed: mission.seed }
  const arch = district.archetype
  const g: GenParams = { ...DEFAULT_GEN, ...gen }
  const size = CITY_SIZE
  const rnd = mulberry32(district.seed)
  const ri = (a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1))
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]

  const streetW = arch === 'industrial' ? 8 : 7
  const vroadW = arch === 'industrial' ? 7 : 6

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

  // Street plan. Cross streets sit streetW apart with 13 to 17 cells of block
  // between them; the guard leaves the southern band deep enough to build on.
  const hStreets: HSpan[] = []
  let hz = ri(23, 26)
  while (hz + streetW <= 84) {
    hStreets.push({ z0: hz, z1: hz + streetW })
    hz += streetW + ri(13, 17)
  }
  const firstHz = hStreets[0].z0
  // Secondary verticals flanking the avenue. The compound owns the east
  // quarter, so that archetype keeps only the west one.
  const vSecondary: VSpan[] = []
  const vSeeds: Array<[number, number]> = arch === 'compound' ? [[19, 23]] : [
    [19, 23],
    [69, 73],
  ]
  for (const [a, b] of vSeeds) {
    const c = ri(a, b)
    vSecondary.push({ x0: c, x1: c + vroadW, z0: firstHz, z1: 94 })
  }
  const avenue: VSpan = { x0: AVE.x0, x1: AVE.x1, z0: AVE.z0, z1: AVE.z1 }
  const roadRects: RoadRect[] = [
    ...hStreets.map((s) => ({ x0: 2, z0: s.z0, x1: 94, z1: s.z1 })),
    ...[avenue, ...vSecondary].map((v) => ({ x0: v.x0, z0: v.z0, x1: v.x1, z1: v.z1 })),
  ]

  // Road mask, used for sampling civilian and patrol positions and by nothing
  // else. The plaza is walkable but not a road.
  const road = new Uint8Array(size * size)
  for (const r of roadRects) {
    for (let z = r.z0; z < r.z1; z++) for (let x = r.x0; x < r.x1; x++) road[idx(x, z)] = 1
  }

  const buildings: BuildingData[] = []
  const props: PropData[] = []
  const alleys: AlleyRect[] = []

  // Special-zone footprint the block fill must keep clear, inflated so the
  // walls keep a paved apron. Empty for the checkpoint archetype.
  const reserved: AlleyRect[] = []

  // The walled band the archetype owns, between the first two cross streets.
  const band0 = { z0: hStreets[0].z1 + 1, z1: (hStreets[1]?.z0 ?? 50) - 1 }
  const CMP = arch === 'compound' ? { x0: 58, z0: band0.z0, x1: 92, z1: band0.z1 } : null
  const YARD = arch === 'industrial' ? { x0: 54, z0: band0.z0, x1: 90, z1: band0.z1 } : null
  if (CMP) reserved.push({ x0: CMP.x0 - 1, z0: CMP.z0 - 1, x1: CMP.x1 + 1, z1: CMP.z1 + 1 })
  if (YARD) reserved.push({ x0: YARD.x0 - 1, z0: YARD.z0 - 1, x1: YARD.x1 + 1, z1: YARD.z1 + 1 })
  const inReserved = (x0: number, z0: number, x1: number, z1: number): boolean =>
    reserved.some((r) => x0 < r.x1 && x1 > r.x0 && z0 < r.z1 && z1 > r.z0)

  // Towers cap at 26 so mid-map high-rises rarely wall off the squad from the
  // south-east camera; the north wall strip keeps its taller skyline. The
  // industrial district stays low and boxy.
  const heightFor = (kind: BuildingData['kind']): number => {
    if (arch === 'industrial') {
      return kind === 'tower' ? ri(10, 14) : kind === 'slab' ? ri(9, 14) : kind === 'block' ? ri(6, 10) : ri(4, 7)
    }
    return kind === 'tower' ? ri(16, 26) : kind === 'slab' ? ri(12, 20) : kind === 'block' ? ri(8, 16) : ri(5, 9)
  }

  const kindFor = (north: boolean): BuildingData['kind'] => {
    const t = rnd()
    if (arch === 'industrial') return t < 0.5 ? 'industrial' : t < 0.85 ? 'block' : 'slab'
    if (north) return t < 0.4 ? 'tower' : t < 0.65 ? 'slab' : t < 0.9 ? 'block' : 'industrial'
    return t < 0.12 ? 'tower' : t < 0.32 ? 'slab' : t < 0.7 ? 'block' : 'industrial'
  }

  interface AxisSplit {
    segs: Array<[number, number]>
    gaps: Array<[number, number]>
  }

  // Cuts one axis of a block into footprints parted by alleys. Cuts run in
  // order and each alley is clamped to leave MIN_SIDE for the footprint before
  // it, for the one after, and for every cut still to come, so segments and
  // alleys never overlap and never leave the block. A cut with no room left
  // ends the split, which is the only way the caller's count is not met.
  const splitAxis = (a0: number, a1: number, n: number): AxisSplit => {
    const len = a1 - a0
    const segs: Array<[number, number]> = []
    const gaps: Array<[number, number]> = []
    let s = a0
    for (let i = 1; i < n; i++) {
      const gGap = ALLEY_W + (rnd() < 0.35 ? 1 : 0)
      const lo = s + MIN_SIDE
      const hi = a1 - MIN_SIDE - gGap - (n - 1 - i) * (ALLEY_W + MIN_SIDE)
      if (hi < lo) break
      const want = a0 + Math.round((len * i) / n) + ri(-2, 2) - (gGap >> 1)
      const gs = Math.max(lo, Math.min(hi, want))
      segs.push([s, gs])
      gaps.push([gs, gs + gGap])
      s = gs + gGap
    }
    if (a1 - s >= MIN_SIDE) segs.push([s, a1])
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
    // Inset first: no footprint reaches a block edge, so the paved margin left
    // behind adds to whatever street or alley runs alongside.
    const ix0 = x0 + SETBACK
    const iz0 = z0 + SETBACK
    const ix1 = x1 - SETBACK
    const iz1 = z1 - SETBACK
    const w = ix1 - ix0
    const d = iz1 - iz0
    if (w < MIN_SIDE || d < MIN_SIDE) return
    let nx = Math.max(1, Math.min(3, Math.round(w / ri(9, 12))))
    let nz = Math.max(1, Math.min(2, Math.round(d / ri(9, 12))))
    while (nx * nz > 4) {
      if (nx > nz) nx -= 1
      else nz -= 1
    }
    const sx = splitAxis(ix0, ix1, nx)
    const sz = splitAxis(iz0, iz1, nz)
    for (const [gx0, gx1] of sx.gaps) alleys.push({ x0: gx0, z0: iz0, x1: gx1, z1: iz1 })
    for (const [gz0, gz1] of sz.gaps) alleys.push({ x0: ix0, z0: gz0, x1: ix1, z1: gz1 })
    // A block may lose a footprint to an empty lot, but never its last one:
    // the skip needs something already standing or another candidate behind it.
    const planned = sx.segs.length * sz.segs.length
    let seen = 0
    let placed = 0
    for (const [bz0, bz1] of sz.segs) {
      for (const [bx0, bx1] of sx.segs) {
        seen++
        // The reserved check draws no random numbers, so archetypes without a
        // reserved zone keep the original stream untouched.
        if (inReserved(bx0, bz0, bx1, bz1)) continue
        if (rnd() < 0.1 && (placed > 0 || seen < planned)) continue
        const bw = bx1 - bx0
        const bd = bz1 - bz0
        const north = (bz0 + bz1) / 2 < 48
        let kind = kindFor(north)
        if (kind === 'tower' && Math.min(bw, bd) < 5) kind = 'slab'
        const b: BuildingData = { x: bx0, z: bz0, w: bw, d: bd, h: heightFor(kind), kind, tint: rnd() }
        const sides: Array<0 | 1 | 2 | 3> = []
        if (bz1 === iz1 && sS) sides.push(0)
        if (bx1 === ix1 && sE) sides.push(1)
        if (bz0 === iz0 && sN) sides.push(2)
        if (bx0 === ix0 && sW) sides.push(3)
        if (sides.length > 0 && rnd() < 0.35) {
          b.neon = { side: pick(sides), color: pick(NEON_COLORS), h: 0.25 + rnd() * 0.45 }
        }
        buildings.push(b)
        blockRect(bx0, bz0, bx1, bz1)
        placed++
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
  // blocks. Band 0 flanks the plaza (checkpoint) or the bare avenue.
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
        ? arch === 'checkpoint'
          ? [{ x0: PLAZA.x0, x1: PLAZA.x1, z0: band.z0, z1: band.z1 }]
          : [{ x0: AVE.x0, x1: AVE.x1, z0: band.z0, z1: band.z1 }]
        : [avenue, ...vSecondary].sort((p, q) => p.x0 - q.x0)
    let cx = 2
    for (const v of act) {
      fillBlock(cx, band.z0, v.x0, band.z1, band.streetN, band.streetS, true, cx !== 2)
      cx = v.x1
    }
    fillBlock(cx, band.z0, 94, band.z1, band.streetN, band.streetS, false, true)
  }

  // Wall or fence segment, emitted as a low building so every map surface and
  // the occlusion pass see it without extra plumbing.
  const pushWall = (wx0: number, wz0: number, wx1: number, wz1: number, h: number): void => {
    if (wx1 <= wx0 || wz1 <= wz0) return
    buildings.push({ x: wx0, z: wz0, w: wx1 - wx0, d: wz1 - wz0, h, kind: 'industrial', tint: 0.5 })
    blockRect(wx0, wz0, wx1, wz1)
  }

  const landmarks: Record<string, Zone> = {}
  const vips: Vec2[] = []
  const devices: Array<{ pos: Vec2; tag: string }> = []
  let target: Zone = { ...CHECKPOINT }

  /* ------------------------- archetype special zones ----------------------- */

  if (arch === 'checkpoint') {
    // Checkpoint gate: two pillars flanking the avenue plus barriers with
    // 1-cell gaps across the avenue mouth of the plaza.
    for (const px of [AVE.x0 - 1, AVE.x1]) {
      props.push({ x: px + 0.5, z: GATE_Z + 0.5, kind: 'pillar', rot: 0, blocking: true })
      walk[idx(px, GATE_Z)] = 0
    }
    for (let bx = AVE.x0; bx < AVE.x1; bx += 2) {
      props.push({ x: bx + 0.5, z: GATE_Z + 0.5, kind: 'barrier', rot: 0, blocking: true })
      walk[idx(bx, GATE_Z)] = 0
    }
    landmarks.gate = { x: AVE.x0 + 3.5, z: GATE_Z + 0.5, r: 4 }
  } else if (CMP) {
    // Detention compound. Wall row sits just inside the rect; the south gate
    // opens onto the second cross street, the side entry flank flips with the
    // seed so the two authored variants mirror each other.
    const wallZ = CMP.z1 - 1
    const gx0 = CMP.x0 + 12
    const gx1 = gx0 + 4
    const sideWest = district.seed % 2 === 0
    const sideX = sideWest ? CMP.x0 : CMP.x1 - 1
    const mid = (CMP.z0 + CMP.z1) >> 1
    pushWall(CMP.x0, CMP.z0, CMP.x1, CMP.z0 + 1, 3)
    pushWall(CMP.x0, wallZ, gx0, CMP.z1, 3)
    pushWall(gx1, wallZ, CMP.x1, CMP.z1, 3)
    const westSegs: Array<[number, number]> = sideWest
      ? [
          [CMP.z0 + 1, mid - 1],
          [mid + 1, wallZ],
        ]
      : [[CMP.z0 + 1, wallZ]]
    const eastSegs: Array<[number, number]> = sideWest
      ? [[CMP.z0 + 1, wallZ]]
      : [
          [CMP.z0 + 1, mid - 1],
          [mid + 1, wallZ],
        ]
    for (const [a, b] of westSegs) pushWall(CMP.x0, a, CMP.x0 + 1, b, 3)
    for (const [a, b] of eastSegs) pushWall(CMP.x1 - 1, a, CMP.x1, b, 3)
    // Gate pillars on the wall stubs flanking the opening.
    for (const px of [gx0 - 1, gx1]) {
      props.push({ x: px + 0.5, z: wallZ + 0.5, kind: 'pillar', rot: 0, blocking: true })
    }
    // Cell blocks along the north side, a records hut by the server corner.
    const cellA = { x: CMP.x0 + 4, z: CMP.z0 + 2, w: 8, d: 4 }
    const cellB = { x: CMP.x0 + 18, z: CMP.z0 + 2, w: 8, d: 4 }
    const hut = { x: CMP.x1 - 7, z: CMP.z1 - 6, w: 5, d: 3 }
    for (const c of [cellA, cellB, hut]) {
      buildings.push({ ...c, h: ri(6, 8), kind: 'block', tint: rnd() })
      blockRect(c.x, c.z, c.x + c.w, c.z + c.d)
    }
    // Crates as breach cover by the side entry, inside the wall.
    const crateX = sideWest ? CMP.x0 + 2 : CMP.x1 - 3
    props.push({ x: crateX + 0.5, z: mid - 1.5, kind: 'crate', rot: rnd() * Math.PI, blocking: false })
    props.push({ x: crateX + 0.5, z: mid + 1.5, kind: 'crate', rot: rnd() * Math.PI, blocking: false })

    target = { x: (CMP.x0 + CMP.x1) / 2, z: (CMP.z0 + CMP.z1) / 2, r: 7 }
    landmarks.gate = { x: gx0 + 2, z: CMP.z1 + 0.5, r: 3.5 }
    landmarks.console = { x: cellA.x + cellA.w + 3, z: CMP.z0 + 4, r: 2 }
    landmarks.server = { x: hut.x - 2, z: hut.z + 1.5, r: 2 }
    landmarks['side-entry'] = { x: sideX + 0.5, z: mid, r: 2.5 }
    vips.push({ x: cellA.x + cellA.w + 2.5, z: CMP.z0 + 4.5 })
  } else if (YARD) {
    // Fenced relay yard: two gates, an inner fence splitting it into the two
    // sub-yards that hold the device spawns. Split axis flips with the seed:
    // even seeds split east-west, odd seeds split north-south.
    const wallZ0 = YARD.z0
    const wallZ1 = YARD.z1 - 1
    const gA0 = YARD.x0 + 4 // south gate, near the avenue approach
    const gA1 = gA0 + 4
    const gB0 = YARD.x1 - 10 // north gate
    const gB1 = gB0 + 4
    pushWall(YARD.x0, wallZ0, gB0, wallZ0 + 1, 2.2)
    pushWall(gB1, wallZ0, YARD.x1, wallZ0 + 1, 2.2)
    pushWall(YARD.x0, wallZ1, gA0, YARD.z1, 2.2)
    pushWall(gA1, wallZ1, YARD.x1, YARD.z1, 2.2)
    pushWall(YARD.x0, wallZ0 + 1, YARD.x0 + 1, wallZ1, 2.2)
    pushWall(YARD.x1 - 1, wallZ0 + 1, YARD.x1, wallZ1, 2.2)

    const splitVertical = district.seed % 2 === 0
    let aCenter: Vec2
    let bCenter: Vec2
    if (splitVertical) {
      const xm = (YARD.x0 + YARD.x1) >> 1
      const zm = (YARD.z0 + YARD.z1) >> 1
      pushWall(xm, wallZ0 + 1, xm + 1, zm - 2, 2.2)
      pushWall(xm, zm + 2, xm + 1, wallZ1, 2.2)
      aCenter = { x: (YARD.x0 + xm) / 2, z: zm }
      bCenter = { x: (xm + YARD.x1) / 2, z: zm }
    } else {
      const zm = (YARD.z0 + YARD.z1) >> 1
      const xm = (YARD.x0 + YARD.x1) >> 1
      pushWall(YARD.x0 + 1, zm, xm - 2, zm + 1, 2.2)
      pushWall(xm + 2, zm, YARD.x1 - 1, zm + 1, 2.2)
      aCenter = { x: xm, z: (zm + YARD.z1) / 2 } // south sub-yard, nearer insertion
      bCenter = { x: xm, z: (YARD.z0 + zm) / 2 }
    }

    target = { x: (YARD.x0 + YARD.x1) / 2, z: (YARD.z0 + YARD.z1) / 2, r: 8 }
    landmarks['yard-a'] = { x: aCenter.x, z: aCenter.z, r: 6 }
    landmarks['yard-b'] = { x: bCenter.x, z: bCenter.z, r: 6 }
    landmarks.gate = { x: gA0 + 2, z: YARD.z1 + 0.5, r: 3.5 }
    landmarks['waveEntry-a'] = { x: gA0 + 2, z: hStreets[1] ? hStreets[1].z0 + 1.5 : YARD.z1 + 2, r: 1 }
    landmarks['waveEntry-b'] = { x: gB0 + 2, z: hStreets[0].z1 - 1.5, r: 1 }

    devices.push({ pos: { x: aCenter.x - 4, z: aCenter.z - 2 }, tag: 'relay' })
    devices.push({ pos: { x: aCenter.x + 4, z: aCenter.z + 2 }, tag: 'relay' })
    devices.push({ pos: { x: bCenter.x, z: bCenter.z }, tag: 'relay' })
    devices.push({ pos: { x: bCenter.x + 5, z: bCenter.z + 3 }, tag: 'transformer' })

    // Crates as fighting cover for the burn, kept off the device spots.
    let yardCrates = 0
    for (let guard = 0; guard < 40 && yardCrates < 8; guard++) {
      const cx = ri(YARD.x0 + 2, YARD.x1 - 3)
      const cz = ri(YARD.z0 + 2, YARD.z1 - 3)
      if (walk[idx(cx, cz)] !== 1) continue
      if (devices.some((d) => Math.abs(d.pos.x - cx) < 2 && Math.abs(d.pos.z - cz) < 2)) continue
      const blocking = rnd() < 0.5
      props.push({ x: cx + 0.5, z: cz + 0.5, kind: 'crate', rot: rnd() * Math.PI, blocking })
      if (blocking) walk[idx(cx, cz)] = 0
      yardCrates++
    }
  }

  /* ------------------------------ shared props ----------------------------- */

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
  // checkpoint core open. Checkpoint archetype only: there is no plaza else.
  if (arch === 'checkpoint') {
    let crates = 0
    for (let guard = 0; guard < 80 && crates < 10; guard++) {
      const cx = ri(PLAZA.x0 + 1, PLAZA.x1 - 2)
      const cz = ri(PLAZA.z0 + 1, PLAZA.z1 - 2)
      if (cx >= AVE.x0 && cx < AVE.x1 && cz >= 15) continue
      if (walk[idx(cx, cz)] !== 1) continue
      const blocking = rnd() < 0.5
      props.push({ x: cx + 0.5, z: cz + 0.5, kind: 'crate', rot: rnd() * Math.PI, blocking })
      if (blocking) walk[idx(cx, cz)] = 0
      crates++
    }
  }

  // Dumpsters and crates in alleys. A dumpster is longer than it is wide, so
  // it lies along the alley: unrotated it runs north-south, which suits an
  // alley narrower across x than across z.
  for (const a of alleys) {
    if (props.length > 200) break
    if (rnd() < 0.6) {
      const dx = ri(a.x0, a.x1 - 1)
      const dz = ri(a.z0, a.z1 - 1)
      if (dx >= 2 && dz >= 2 && dx < 94 && dz < 94 && walk[idx(dx, dz)] === 1) {
        const rot = a.x1 - a.x0 <= a.z1 - a.z0 ? 0 : Math.PI / 2
        props.push({ x: dx + 0.5, z: dz + 0.5, kind: 'dumpster', rot, blocking: true })
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

  /* -------------------------------- enemies -------------------------------- */

  const enemies: EnemySpawn[] = []
  const pad = (n: number): string => String(n).padStart(2, '0')

  // Random walkable point inside a rect, with a center fallback.
  const zonePoint = (x0: number, z0: number, x1: number, z1: number): Vec2 => {
    for (let i = 0; i < 24; i++) {
      const px = ri(x0 + 1, x1 - 2)
      const pz = ri(z0 + 1, z1 - 2)
      if (walk[idx(px, pz)] === 1) return { x: px + 0.5, z: pz + 0.5 }
    }
    return { x: (x0 + x1) / 2, z: (z0 + z1) / 2 }
  }

  // Street patrols shared by every archetype: the first walks the avenue,
  // later ones walk successive cross streets. Extra patrols from the mission
  // modifiers run through the same body, continuing the numbering.
  const addStreetPatrols = (count: number, firstName: number): void => {
    for (let k = 0; k < count; k++) {
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
      enemies.push({ pos: { ...patrol[0] }, patrol, weapon, name: 'CORPSEC-' + pad(firstName + k) })
    }
  }

  const garrisonWeapons: WeaponId[] = ['assault', 'smg', 'smg', 'assault', 'smg', 'assault']

  if (arch === 'checkpoint') {
    const plazaPoint = (): Vec2 => {
      for (let i = 0; i < 24; i++) {
        const px = ri(PLAZA.x0 + 1, PLAZA.x1 - 2)
        const pz = ri(PLAZA.z0 + 1, PLAZA.z1 - 2)
        if (walk[idx(px, pz)] === 1) return { x: px + 0.5, z: pz + 0.5 }
      }
      return { x: 48.5, z: 12.5 }
    }
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
    addStreetPatrols(5, 8)
    addStreetPatrols(g.enemyExtra, 13)
  } else if (CMP) {
    // Compound garrison, patrolling inside the walls. Not an objective: a
    // stealth-leaning route through the side entry can bypass most of it.
    for (let i = 0; i < 6; i++) {
      const pos = zonePoint(CMP.x0 + 1, CMP.z0 + 1, CMP.x1 - 1, CMP.z1 - 1)
      const patrol: Vec2[] = [pos]
      const extra = ri(1, 3)
      for (let k = 0; k < extra; k++) patrol.push(zonePoint(CMP.x0 + 1, CMP.z0 + 1, CMP.x1 - 1, CMP.z1 - 1))
      enemies.push({ pos: { ...pos }, patrol, weapon: garrisonWeapons[i], tag: 'garrison', name: 'CORPSEC-0' + (i + 1) })
    }
    addStreetPatrols(4, 7)
    addStreetPatrols(g.enemyExtra, 11)
  } else if (YARD) {
    // Yard guards, plus a lighter street presence: MODERATE ground.
    const yardWeapons: WeaponId[] = ['smg', 'assault', 'smg', 'pistol']
    for (let i = 0; i < 4; i++) {
      const pos = zonePoint(YARD.x0 + 1, YARD.z0 + 1, YARD.x1 - 1, YARD.z1 - 1)
      const patrol: Vec2[] = [pos]
      const extra = ri(1, 2)
      for (let k = 0; k < extra; k++) patrol.push(zonePoint(YARD.x0 + 1, YARD.z0 + 1, YARD.x1 - 1, YARD.z1 - 1))
      enemies.push({ pos: { ...pos }, patrol, weapon: yardWeapons[i], tag: 'garrison', name: 'CORPSEC-0' + (i + 1) })
    }
    addStreetPatrols(3, 5)
    addStreetPatrols(g.enemyExtra, 8)
  }

  const spawnAgents: Vec2[] = [
    { x: 46.5, z: 88.5 },
    { x: 47.5, z: 88.5 },
    { x: 48.5, z: 88.5 },
    { x: 49.5, z: 88.5 },
  ]

  // Civilians on street cells in the south two-thirds, away from the target.
  // The count comes from the mission modifiers.
  const civilians: Vec2[] = []
  const candidates: number[] = []
  for (let z = 34; z < 92; z++) {
    for (let x = 2; x < 94; x++) {
      const i = idx(x, z)
      if (road[i] !== 1 || walk[i] !== 1) continue
      const dx = x + 0.5 - target.x
      const dz = z + 0.5 - target.z
      if (dx * dx + dz * dz > 400) candidates.push(i)
    }
  }
  for (let want = g.civilianCount; want > 0 && candidates.length > 0; want--) {
    const j = Math.floor(rnd() * candidates.length)
    const i = candidates[j]
    candidates[j] = candidates[candidates.length - 1]
    candidates.pop()
    civilians.push({ x: (i % size) + 0.5, z: Math.floor(i / size) + 0.5 })
  }

  // Connectivity guarantee. Flood fill from the first spawn, carve straight
  // L corridors to anything that ended up sealed, then snap every unit point
  // to the nearest reachable cell. Extends over every landmark, vip, device
  // and wave entry point.
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
  ensure({ x: target.x, z: target.z })
  ensure({ x: EXTRACTION.x, z: EXTRACTION.z })
  for (const key of Object.keys(landmarks)) ensure(landmarks[key])
  for (const v of vips) ensure(v)
  for (const d of devices) ensure(d.pos)
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
  for (let i = 0; i < vips.length; i++) vips[i] = snap(vips[i])
  for (const d of devices) d.pos = snap(d.pos)

  // Keep the south rim low so the default south-east camera never has tall
  // foreground towers between the eye and the insertion zone.
  for (const b of buildings) {
    if (b.z + b.d > 82) b.h = Math.min(b.h, 7)
    else if (b.z + b.d > 70) b.h = Math.min(b.h, 14)
  }

  landmarks.insertion = { x: spawnAgents[0].x, z: spawnAgents[0].z, r: 4 }
  landmarks.extraction = { ...EXTRACTION }
  landmarks.target = { ...target }

  return {
    size,
    archetype: arch,
    walk,
    buildings,
    props,
    lights,
    roadRects,
    roadsH: hStreets.map((s) => s.z0 + Math.floor(streetW / 2)),
    roadsV: [
      AVE.x0 + Math.floor((AVE.x1 - AVE.x0) / 2),
      ...vSecondary.map((v) => v.x0 + Math.floor(vroadW / 2)),
    ].sort((a, b) => a - b),
    spawnAgents,
    enemies,
    civilians,
    vips,
    devices,
    landmarks,
    extraction: { ...EXTRACTION },
    checkpoint: { ...target },
  }
}
