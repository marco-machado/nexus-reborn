// CONTRACT FILE. Strategic atlas for the world map: corporations, continental
// sectors, the territory polygons of the plate, and the cities that carry
// ownership. The plate is a stylised 1000x520 projection; latitude on it is
// lat = 80 - 0.269 * y, so the graticule labels line up with the landmasses.
import type { SectorId } from './types'
import { mulberry32 } from './rng'

/* ------------------------------ corporations ------------------------------ */

export type CorpId = 'stratos' | 'nexus' | 'helix' | 'omni' | 'contested' | 'unknown'

export interface CorpDef {
  id: CorpId
  name: string
  color: string
}

export const CORPS: Record<CorpId, CorpDef> = {
  stratos: { id: 'stratos', name: 'STRATOS INDUSTRIES', color: '#59d6c9' },
  nexus: { id: 'nexus', name: 'NEXUS GLOBAL', color: '#7de08a' },
  helix: { id: 'helix', name: 'HELIX CORP', color: '#f0b445' },
  omni: { id: 'omni', name: 'OMNICORP', color: '#5d7d75' },
  contested: { id: 'contested', name: 'CONTESTED', color: '#e04b3c' },
  unknown: { id: 'unknown', name: 'UNKNOWN', color: '#35504a' },
}

// Corporations that can hold a city. CONTESTED and UNKNOWN are map states.
export const HOLDERS: CorpId[] = ['stratos', 'nexus', 'helix', 'omni']

export const KEY_ORDER: CorpId[] = ['stratos', 'nexus', 'helix', 'omni', 'contested', 'unknown']

/* -------------------------------- sectors --------------------------------- */

export interface SectorDef {
  id: SectorId
  name: string
  title: string
  glyph: string
  // Share of global influence.
  weight: number
  control: number
  unrest: number
  assets: number
  // Garrison and weekly tax yield at full control; both scale with control.
  forcesBase: number
  yieldBase: number
  locked: boolean
}

export const SECTORS: SectorDef[] = [
  {
    id: 'na',
    name: 'NORTH AMERICA',
    title: 'NORTH AMERICAN SECTOR',
    glyph: '1,4 6,1 12,2 16,5 14,8 10,9 8,13 5,10 2,7',
    weight: 1.15,
    control: 68,
    unrest: 12,
    assets: 31,
    forcesBase: 38800,
    yieldBase: 6.0,
    locked: false,
  },
  {
    id: 'sa',
    name: 'SOUTH AMERICA',
    title: 'SOUTH AMERICAN SECTOR',
    glyph: '8,1 12,3 13,7 10,13 7,15 6,9 5,4',
    weight: 0.85,
    control: 41,
    unrest: 24,
    assets: 17,
    forcesBase: 34600,
    yieldBase: 4.2,
    locked: false,
  },
  {
    id: 'eu',
    name: 'EUROPE',
    title: 'EUROPEAN SECTOR',
    glyph: '2,8 5,4 9,1 13,3 16,6 12,9 8,10 4,11',
    weight: 1.2,
    control: 62,
    unrest: 18,
    assets: 23,
    forcesBase: 29758,
    yieldBase: 3.98,
    locked: false,
  },
  {
    id: 'af',
    name: 'AFRICA',
    title: 'AFRICAN SECTOR',
    glyph: '4,2 10,1 14,4 13,9 9,15 6,10 3,6',
    weight: 0.9,
    control: 37,
    unrest: 28,
    assets: 14,
    forcesBase: 56700,
    yieldBase: 5.1,
    locked: false,
  },
  {
    id: 'as',
    name: 'ASIA',
    title: 'ASIAN SECTOR',
    glyph: '1,6 6,2 13,1 20,3 21,6 16,9 11,12 6,9',
    weight: 1.35,
    control: 55,
    unrest: 16,
    assets: 29,
    forcesBase: 74500,
    yieldBase: 8.4,
    locked: false,
  },
  {
    id: 'oc',
    name: 'OCEANIA',
    title: 'OCEANIC SECTOR',
    glyph: '3,6 8,3 14,4 17,8 13,12 6,11',
    weight: 0.55,
    control: 73,
    unrest: 9,
    assets: 11,
    forcesBase: 13400,
    yieldBase: 2.2,
    locked: false,
  },
  {
    id: 'an',
    name: 'ANTARCTICA',
    title: 'ANTARCTIC SECTOR',
    glyph: '2,10 6,7 12,6 18,8 20,12 14,14 6,13',
    weight: 0,
    control: 0,
    unrest: 0,
    assets: 0,
    forcesBase: 0,
    yieldBase: 0,
    locked: true,
  },
]

export const SECTOR_IDS: SectorId[] = SECTORS.map((s) => s.id)
export const OPEN_SECTORS: SectorId[] = SECTORS.filter((s) => !s.locked).map((s) => s.id)

const SECTOR_BY_ID: Record<string, SectorDef> = {}
for (const s of SECTORS) SECTOR_BY_ID[s.id] = s

export function sectorDef(id: SectorId): SectorDef {
  return SECTOR_BY_ID[id]
}

/* ------------------------------- territories ------------------------------ */

export interface TerritoryDef {
  id: string
  // null for landmasses no corporation has surveyed.
  sector: SectorId | null
  pts: string
}

export const TERRITORIES: TerritoryDef[] = [
  {
    id: 'na',
    sector: 'na',
    pts: '40,78 92,54 148,66 205,92 252,88 302,104 344,118 332,148 300,158 286,184 280,214 256,224 232,236 216,252 200,236 176,206 150,176 120,140 86,118 56,100',
  },
  { id: 'gl', sector: 'na', pts: '300,56 342,44 366,72 342,98 306,88' },
  {
    id: 'sa',
    sector: 'sa',
    pts: '286,268 320,262 352,284 396,308 406,338 386,378 356,418 330,458 312,490 300,470 294,430 284,388 274,344 270,304',
  },
  {
    id: 'eu',
    sector: 'eu',
    pts: '470,158 488,138 504,124 518,112 540,94 562,78 586,88 612,104 642,120 652,140 630,154 600,164 574,174 552,180 528,178 506,180 488,182 476,176',
  },
  { id: 'uk', sector: 'eu', pts: '484,106 500,98 506,118 492,126 482,118' },
  {
    id: 'af',
    sector: 'af',
    pts: '478,196 512,186 546,190 586,200 612,216 640,264 630,300 602,330 586,368 570,404 556,428 540,404 526,368 514,330 504,300 490,264 478,230',
  },
  {
    id: 'as',
    sector: 'as',
    pts: '652,138 664,110 700,84 762,64 832,58 902,58 962,70 976,90 950,114 920,130 890,150 862,170 840,190 820,206 800,216 786,240 770,256 750,240 736,262 720,282 706,254 694,228 670,214 648,208 630,194 626,174 636,154',
  },
  { id: 'ar', sector: 'as', pts: '606,204 640,202 658,234 636,256 612,242' },
  { id: 'jp', sector: 'as', pts: '898,140 914,134 920,152 908,170 896,158' },
  { id: 'id1', sector: 'as', pts: '780,286 812,292 824,304 800,308 776,296' },
  { id: 'id2', sector: 'as', pts: '836,300 862,306 852,318 830,312' },
  {
    id: 'au',
    sector: 'oc',
    pts: '814,368 846,348 882,344 912,364 926,394 916,424 890,440 858,434 834,418 818,394',
  },
  { id: 'nz', sector: 'oc', pts: '940,440 962,450 954,472 938,458' },
  {
    id: 'an',
    sector: 'an',
    pts: '60,508 200,498 400,492 600,496 800,492 950,500 950,518 60,518',
  },
]

/* --------------------------------- cities --------------------------------- */

export interface CityDef {
  id: string
  name: string
  sector: SectorId
  x: number
  y: number
  corp: CorpId
}

export const CITIES: CityDef[] = [
  { id: 'nb', name: 'NEW BOSTON', sector: 'na', x: 272, y: 148, corp: 'nexus' },
  { id: 'pc', name: 'PACIFICA', sector: 'na', x: 155, y: 172, corp: 'nexus' },
  { id: 'dt', name: 'DETROIT SPRAWL', sector: 'na', x: 220, y: 177, corp: 'stratos' },
  { id: 'bg', name: 'BOGOTA', sector: 'sa', x: 298, y: 288, corp: 'nexus' },
  { id: 'sp', name: 'SAO PAULO', sector: 'sa', x: 380, y: 372, corp: 'stratos' },
  { id: 'lm', name: 'LIMA', sector: 'sa', x: 312, y: 340, corp: 'omni' },
  { id: 'ln', name: 'LONDON', sector: 'eu', x: 494, y: 114, corp: 'helix' },
  { id: 'nc', name: 'NEW CARTHAGE', sector: 'eu', x: 506, y: 134, corp: 'helix' },
  { id: 'os', name: 'OSLO', sector: 'eu', x: 540, y: 120, corp: 'omni' },
  { id: 'cr', name: 'CAIRO', sector: 'af', x: 590, y: 204, corp: 'omni' },
  { id: 'lg', name: 'LAGOS', sector: 'af', x: 516, y: 284, corp: 'omni' },
  { id: 'jb', name: 'JOHANNESBURG', sector: 'af', x: 556, y: 404, corp: 'helix' },
  { id: 'sg', name: 'SHINGANG', sector: 'as', x: 830, y: 150, corp: 'helix' },
  { id: 'kt', name: 'KITARU', sector: 'as', x: 906, y: 152, corp: 'helix' },
  { id: 'nk', name: 'NEO KOWLOON', sector: 'as', x: 712, y: 242, corp: 'stratos' },
  { id: 'sy', name: 'SYDNEY', sector: 'oc', x: 903, y: 400, corp: 'stratos' },
  { id: 'pr', name: 'PERTH', sector: 'oc', x: 838, y: 392, corp: 'stratos' },
  { id: 'ak', name: 'AUCKLAND', sector: 'oc', x: 950, y: 456, corp: 'nexus' },
]

export const CITIES_BY_SECTOR: Record<string, CityDef[]> = {}
for (const c of CITIES) (CITIES_BY_SECTOR[c.sector] ??= []).push(c)

const CITY_BY_ID: Record<string, CityDef> = {}
for (const c of CITIES) CITY_BY_ID[c.id] = c

export function cityById(id: string): CityDef {
  return CITY_BY_ID[id]
}

// Percent of the plate, the unit mission markers and generated jitter use.
export function platePos(x: number, y: number): { x: number; y: number } {
  return { x: (x / PLATE_W) * 100, y: (y / PLATE_H) * 100 }
}

export function cityPlatePos(id: string): { x: number; y: number } {
  const c = cityById(id)
  return platePos(c.x, c.y)
}

// The corporation holding most cities in a sector. A tie reads as contested,
// which is how the control key colours it.
export function sectorCorp(sector: SectorId, owner: Record<string, CorpId>): CorpId {
  const cities = CITIES_BY_SECTOR[sector]
  if (!cities || cities.length === 0) return 'unknown'
  const count: Partial<Record<CorpId, number>> = {}
  for (const c of cities) {
    const corp = owner[c.id] ?? c.corp
    count[corp] = (count[corp] ?? 0) + 1
  }
  let best: CorpId = 'unknown'
  let bestN = 0
  let tied = false
  for (const corp of HOLDERS) {
    const n = count[corp] ?? 0
    if (n > bestN) {
      best = corp
      bestN = n
      tied = false
    } else if (n === bestN && n > 0) {
      tied = true
    }
  }
  return tied ? 'contested' : best
}

/* ------------------------------ plate geometry ---------------------------- */

export const PLATE_W = 1000
export const PLATE_H = 520

// lat = LAT_TOP - LAT_PER_PX * y, fitted so the landmasses sit near their real
// latitudes. Inverted here to place the graticule.
const LAT_TOP = 80
const LAT_PER_PX = 0.269

export function yOfLat(lat: number): number {
  return (LAT_TOP - lat) / LAT_PER_PX
}

// Drawing helper: -60 sits a fraction of a pixel past the plate edge.
export function graticuleY(lat: number): number {
  const y = yOfLat(lat)
  return y < 0 ? 0 : y > PLATE_H ? PLATE_H : y
}

export const LAT_LINES = [60, 30, 0, -30, -60]
export const LON_LINES = [100, 200, 300, 400, 500, 600, 700, 800, 900]

function parsePts(s: string): number[][] {
  return s.split(' ').map((p) => {
    const [x, y] = p.split(',')
    return [Number(x), Number(y)]
  })
}

function pointInPoly(poly: number[][], x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

function bbox(poly: number[][]): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of poly) {
    if (x < x0) x0 = x
    if (y < y0) y0 = y
    if (x > x1) x1 = x
    if (y > y1) y1 = y
  }
  return [x0, y0, x1, y1]
}

function area(poly: number[][]): number {
  let a = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1])
  }
  return Math.abs(a / 2)
}

/* ------------------------------- city lights ------------------------------ */

export interface Light {
  x: number
  y: number
  r: number
  sector: SectorId | null
}

// Scattered settlement glow over the land, seeded so every session draws the
// same plate. Denser near the named cities, thin everywhere else.
function buildLights(): Light[] {
  const rng = mulberry32(0x5ec7043)
  const out: Light[] = []
  for (const t of TERRITORIES) {
    const poly = parsePts(t.pts)
    const [x0, y0, x1, y1] = bbox(poly)
    const want = Math.max(2, Math.min(26, Math.round(area(poly) / 1500)))
    let tries = 0
    let made = 0
    while (made < want && tries < want * 60) {
      tries++
      const x = x0 + rng() * (x1 - x0)
      const y = y0 + rng() * (y1 - y0)
      if (!pointInPoly(poly, x, y)) continue
      made++
      out.push({ x, y, r: 0.5 + rng() * 0.7, sector: t.sector })
    }
  }
  for (const c of CITIES) {
    const n = 5 + Math.floor(rng() * 4)
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2
      const d = 3 + rng() * 11
      out.push({
        x: c.x + Math.cos(a) * d,
        y: c.y + Math.sin(a) * d * 0.7,
        r: 0.6 + rng() * 0.8,
        sector: c.sector,
      })
    }
  }
  return out
}

export const LIGHTS: Light[] = buildLights()

export const LIGHTS_BY_SECTOR: Record<string, Light[]> = {}
for (const l of LIGHTS) (LIGHTS_BY_SECTOR[l.sector ?? 'none'] ??= []).push(l)

/* --------------------------------- traffic -------------------------------- */

export interface Arc {
  d: string
  hot: boolean
}

const LINKS: Array<[string, string, boolean]> = [
  ['dt', 'nb', false],
  ['pc', 'bg', false],
  ['nb', 'ln', true],
  ['ln', 'os', false],
  ['nc', 'cr', false],
  ['os', 'sg', false],
  ['bg', 'sp', false],
  ['lg', 'sp', false],
  ['cr', 'nk', false],
  ['kt', 'nk', false],
  ['sg', 'sy', false],
  ['ak', 'sy', false],
  ['jb', 'lg', false],
  ['nc', 'sg', true],
]

// Great circle stand in: a quadratic that bulges away from the equator.
function arcPath(a: CityDef, b: CityDef): string {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  const dist = Math.hypot(b.x - a.x, b.y - a.y)
  const lift = Math.min(90, dist * 0.24)
  const dir = my < PLATE_H / 2 ? -1 : 1
  return `M${a.x},${a.y} Q${mx},${(my + dir * lift).toFixed(1)} ${b.x},${b.y}`
}

export const ARCS: Arc[] = LINKS.map(([a, b, hot]) => ({
  d: arcPath(CITY_BY_ID[a], CITY_BY_ID[b]),
  hot,
}))

/* ------------------------------- sector views ----------------------------- */

// Bounding box of a sector's territories, padded and widened to the inset's
// aspect so every sector fills the frame the same way.
const INSET_ASPECT = 2.5

function sectorBox(id: SectorId): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const t of TERRITORIES) {
    if (t.sector !== id) continue
    const [a, b, c, d] = bbox(parsePts(t.pts))
    x0 = Math.min(x0, a)
    y0 = Math.min(y0, b)
    x1 = Math.max(x1, c)
    y1 = Math.max(y1, d)
  }
  if (!isFinite(x0)) return [0, 0, PLATE_W, PLATE_H]
  const padX = (x1 - x0) * 0.1 + 6
  const padY = (y1 - y0) * 0.1 + 6
  x0 -= padX
  x1 += padX
  y0 -= padY
  y1 += padY
  let w = x1 - x0
  let h = y1 - y0
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  if (w / h < INSET_ASPECT) w = h * INSET_ASPECT
  else h = w / INSET_ASPECT
  return [cx - w / 2, cy - h / 2, w, h]
}

export const SECTOR_VIEW: Record<string, string> = {}
export const SECTOR_COORD: Record<string, string> = {}

for (const s of SECTORS) {
  const [x, y, w, h] = sectorBox(s.id)
  SECTOR_VIEW[s.id] = `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
  const lat = LAT_TOP - LAT_PER_PX * (y + h / 2)
  const lon = (x + w / 2 - PLATE_W / 2) * 0.36
  SECTOR_COORD[s.id] =
    Math.abs(lat).toFixed(2) + (lat >= 0 ? 'N ' : 'S ') + Math.abs(lon).toFixed(2) + (lon >= 0 ? 'E' : 'W')
}
