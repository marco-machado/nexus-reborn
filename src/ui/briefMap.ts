// Geometry for the two map panels on the mission brief.
//
// The tactical map is a projection of the district the mission actually
// builds: footprints, paved bands, the hostile ring and the patrol loops all
// come out of generateCity, and the two routes are A* paths over the same walk
// grid the squad will use. Coordinates stay in city cells, with map x on world
// x and map y on world z, so north (low z) is up.
//
// The recon feed above it is a stylised satellite frame rather than a
// projection, so its skyline is generated here from the mission seed.
import { findPath } from '../game/pathfind'
import { CITY_SIZE } from '../game/types'
import type { MissionDef, Vec2 } from '../game/types'
import { generateCity } from '../world/citygen'
import { rngFrom } from './util'

/* ------------------------------ tactical map ------------------------------ */

export interface MapRect {
  x: number
  y: number
  w: number
  h: number
}

export interface MapBuilding extends MapRect {
  // 0 for the lowest shed, 1 for the tallest tower. Drives the footprint tone
  // so a flat plan still carries the skyline.
  lit: number
}

export interface TacticalMap {
  size: number
  roads: MapRect[]
  buildings: MapBuilding[]
  // Padded octagon enclosing the garrison, wound clockwise.
  hostile: Vec2[]
  target: { x: number; z: number; r: number }
  insertion: Vec2
  extraction: Vec2
  routeAlpha: Vec2[]
  routeOmega: Vec2[]
  patrols: Vec2[][]
  counts: {
    blocks: number
    streets: number
    civilians: number
    patrols: number
    garrison: number
    alphaMetres: number
    omegaMetres: number
  }
}

// Axis aligned bounds of a point set, padded and clamped to the border ring.
function boundsOf(points: Vec2[], pad: number): MapRect {
  let x0 = Infinity
  let z0 = Infinity
  let x1 = -Infinity
  let z1 = -Infinity
  for (const p of points) {
    if (p.x < x0) x0 = p.x
    if (p.x > x1) x1 = p.x
    if (p.z < z0) z0 = p.z
    if (p.z > z1) z1 = p.z
  }
  const lo = 2
  const hi = CITY_SIZE - 2
  x0 = Math.max(lo, x0 - pad)
  z0 = Math.max(lo, z0 - pad)
  x1 = Math.min(hi, x1 + pad)
  z1 = Math.min(hi, z1 + pad)
  return { x: x0, y: z0, w: x1 - x0, h: z1 - z0 }
}

// Box with its corners cut back, so the zone reads as a marked area rather
// than another footprint.
function chamfered(r: MapRect): Vec2[] {
  const c = Math.min(r.w, r.h) * 0.28
  const x1 = r.x + r.w
  const z1 = r.y + r.h
  return [
    { x: r.x + c, z: r.y },
    { x: x1 - c, z: r.y },
    { x: x1, z: r.y + c },
    { x: x1, z: z1 - c },
    { x: x1 - c, z: z1 },
    { x: r.x + c, z: z1 },
    { x: r.x, z: z1 - c },
    { x: r.x, z: r.y + c },
  ]
}

// Shifts a route sideways by half a lane. Both legs of this contract run the
// same avenue in opposite directions, so drawn on their true centreline the
// second would vanish under the first. Each leg is offset to its own left,
// which puts them on opposite sides of a road wide enough to hold both.
function laneOffset(points: Vec2[], d: number): Vec2[] {
  if (points.length < 2) return points
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)]
    const b = points[Math.min(points.length - 1, i + 1)]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz) || 1
    return { x: p.x - (dz / len) * d, z: p.z + (dx / len) * d }
  })
}

export function buildTacticalMap(mission: MissionDef): TacticalMap {
  const city = generateCity(mission)
  const insertion = city.spawnAgents[0] ?? { x: CITY_SIZE / 2, z: CITY_SIZE - 8 }
  const target = city.checkpoint
  const extraction = city.extraction

  // Both legs start at their own origin, which findPath leaves out of the
  // waypoints it returns.
  const leg = (from: Vec2, to: Vec2): Vec2[] => [from, ...findPath(city, from, to)]

  const garrison = city.enemies.filter((e) => e.tag === 'garrison')
  const garrisonPoints: Vec2[] = []
  for (const e of garrison) {
    garrisonPoints.push(e.pos)
    for (const p of e.patrol) garrisonPoints.push(p)
  }
  const hostileBox =
    garrisonPoints.length > 0
      ? boundsOf(garrisonPoints, 4)
      : { x: target.x - target.r, y: target.z - target.r, w: target.r * 2, h: target.r * 2 }

  let low = Infinity
  let high = -Infinity
  for (const b of city.buildings) {
    if (b.h < low) low = b.h
    if (b.h > high) high = b.h
  }
  const span = high - low || 1

  const alpha = leg(insertion, { x: target.x, z: target.z })
  const omega = leg({ x: target.x, z: target.z }, { x: extraction.x, z: extraction.z })
  const patrols = city.enemies
    .filter((e) => e.tag !== 'garrison' && e.patrol.length > 1)
    .map((e) => e.patrol.map((p) => ({ x: p.x, z: p.z })))

  return {
    size: city.size,
    roads: city.roadRects.map((r) => ({ x: r.x0, y: r.z0, w: r.x1 - r.x0, h: r.z1 - r.z0 })),
    buildings: city.buildings.map((b) => ({
      x: b.x,
      y: b.z,
      w: b.w,
      h: b.d,
      lit: (b.h - low) / span,
    })),
    hostile: chamfered(hostileBox),
    target: { ...target },
    insertion,
    extraction: { x: extraction.x, z: extraction.z },
    routeAlpha: laneOffset(alpha, 1),
    routeOmega: laneOffset(omega, 1),
    // Garrison loops sit inside the hostile ring and would only clutter it, so
    // the drawn patrols are the ones that walk the streets between the routes.
    patrols,
    counts: {
      blocks: city.buildings.length,
      streets: city.roadsH.length + city.roadsV.length,
      civilians: city.civilians.length,
      patrols: patrols.length,
      garrison: garrison.length,
      alphaMetres: routeLength(alpha),
      omegaMetres: routeLength(omega),
    },
  }
}

export function pointsAttr(points: Vec2[]): string {
  return points.map((p) => p.x.toFixed(1) + ',' + p.z.toFixed(1)).join(' ')
}

// Walked distance along a route. One cell is one metre, so the sum is the
// distance the squad covers on the ground.
function routeLength(points: Vec2[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dz = points[i].z - points[i - 1].z
    total += Math.sqrt(dx * dx + dz * dz)
  }
  return Math.round(total)
}

/* ------------------------------- recon feed ------------------------------- */

export interface Pt {
  x: number
  y: number
}

export interface ReconBlock extends MapRect {
  // Lit windows on the front face, as top left corners.
  windows: Pt[]
}

// Recon frame, in the 960 x 360 user space the panel draws into. The target
// volume and the two route tags are placed by hand, so the skyline keeps clear
// of the band they occupy.
export const RECON_W = 960
export const RECON_H = 360
const RECON_DEPTH = { x: 14, y: -11 }
export const RECON_TARGET = { x: 430, y: 108, w: 100, h: 96 }

const TARGET_KEEPOUT = { x0: 404, x1: 566, y0: 82, y1: 222 }

function windowsFor(r: MapRect, rnd: () => number): Pt[] {
  const out: Pt[] = []
  for (let y = r.y + 5; y < r.y + r.h - 4; y += 7) {
    for (let x = r.x + 4; x < r.x + r.w - 5; x += 8) {
      if (rnd() < 0.42) out.push({ x, y })
    }
  }
  return out
}

export function buildReconBlocks(seed: number): ReconBlock[] {
  const rnd = rngFrom(seed >>> 0)
  const blocks: ReconBlock[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 9; col++) {
      if (rnd() < 0.13) continue
      const x = 12 + col * 105 + rnd() * 48
      const y = 38 + row * 78 + rnd() * 32
      // A quarter of the plots take a tower, which breaks up the roofline the
      // even grid would otherwise give.
      const tall = rnd() < 0.26
      const w = tall ? 60 + rnd() * 34 : 24 + rnd() * 34
      const h = tall ? 46 + rnd() * 34 : 18 + rnd() * 28
      if (
        x + w + RECON_DEPTH.x > TARGET_KEEPOUT.x0 &&
        x < TARGET_KEEPOUT.x1 &&
        y + h > TARGET_KEEPOUT.y0 &&
        y + RECON_DEPTH.y < TARGET_KEEPOUT.y1
      ) {
        continue
      }
      const rect = { x, y, w, h }
      blocks.push({ ...rect, windows: windowsFor(rect, rnd) })
    }
  }
  // Painted front to back, so a nearer block covers the one behind it.
  return blocks.sort((a, b) => a.y + a.h - (b.y + b.h))
}

export function targetWindows(seed: number): Pt[] {
  return windowsFor(RECON_TARGET, rngFrom((seed >>> 0) ^ 0x5bf03635))
}

// Roof and right face of an extruded block, so a footprint reads as a volume.
export function roofPoints(r: MapRect): string {
  const d = RECON_DEPTH
  return `${r.x},${r.y} ${r.x + d.x},${r.y + d.y} ${r.x + r.w + d.x},${r.y + d.y} ${r.x + r.w},${r.y}`
}

export function sidePoints(r: MapRect): string {
  const d = RECON_DEPTH
  const x1 = r.x + r.w
  return `${x1},${r.y} ${x1 + d.x},${r.y + d.y} ${x1 + d.x},${r.y + r.h + d.y} ${x1},${r.y + r.h}`
}

/* ------------------------------ callout sizing ----------------------------- */

// The UI is set in a monospace stack, so a run of text is its length times the
// glyph advance plus its tracking. Callout boxes are sized from this rather
// than from a guess, which is what used to let the label overflow its frame.
export function textWidth(text: string, size: number, tracking: number): number {
  return text.length * (size * 0.6 + tracking)
}
