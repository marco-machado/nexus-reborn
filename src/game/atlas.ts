// CONTRACT FILE. Corporations, sectors, the territory polygons of the Scan,
// and the cities that carry ownership. Cities use latitude/longitude; the
// atlas projection and globe share the same geographic source of truth.
import type { SectorId } from './types'
import { mulberry32 } from './rng'
import { SCAN_TERRITORIES } from './scanTerritories'
import { projectGeo, SCAN_H, SCAN_W, SECTOR_FOCUS } from './geography'
import type { GeoPoint } from './geography'
export { SCAN_H, SCAN_W } from './geography'

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
  // Kept on the def; not used for income, standing, or generated pay.
  weight: number
  control: number
  unrest: number
  assets: number
  forcesBase: number
  // Tax yield Credits at 100% Control over 24 strategic hours.
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
    yieldBase: 6000,
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
    yieldBase: 4200,
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
    yieldBase: 3980,
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
    yieldBase: 5100,
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
    yieldBase: 8400,
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
    yieldBase: 2200,
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

export const TERRITORIES: TerritoryDef[] = SCAN_TERRITORIES

/* --------------------------------- cities --------------------------------- */

export interface CityDef {
  id: string
  name: string
  sector: SectorId
  lat: number
  lon: number
  x: number
  y: number
  corp: CorpId
}

// Fictional names retain their established real-world anchors (Boston, Paris,
// Shanghai, Tokyo, Hong Kong). Pacifica and Lagos use their actual city sites.
const CITY_LOCATIONS: Omit<CityDef, 'x' | 'y'>[] = [
  { id: 'nb', name: 'NEW BOSTON', sector: 'na', lat: 42.3601, lon: -71.0589, corp: 'nexus' },
  { id: 'pc', name: 'PACIFICA', sector: 'na', lat: 37.6138, lon: -122.4869, corp: 'nexus' },
  { id: 'dt', name: 'DETROIT SPRAWL', sector: 'na', lat: 42.3314, lon: -83.0458, corp: 'stratos' },
  { id: 'bg', name: 'BOGOTA', sector: 'sa', lat: 4.7110, lon: -74.0721, corp: 'nexus' },
  { id: 'sp', name: 'SAO PAULO', sector: 'sa', lat: -23.5505, lon: -46.6333, corp: 'stratos' },
  { id: 'lm', name: 'LIMA', sector: 'sa', lat: -12.0464, lon: -77.0428, corp: 'omni' },
  { id: 'ln', name: 'LONDON', sector: 'eu', lat: 51.5074, lon: -0.1278, corp: 'helix' },
  { id: 'nc', name: 'NEW CARTHAGE', sector: 'eu', lat: 48.8566, lon: 2.3522, corp: 'helix' },
  { id: 'os', name: 'OSLO', sector: 'eu', lat: 59.9139, lon: 10.7522, corp: 'omni' },
  { id: 'cr', name: 'CAIRO', sector: 'af', lat: 30.0444, lon: 31.2357, corp: 'omni' },
  { id: 'lg', name: 'LAGOS', sector: 'af', lat: 6.4551, lon: 3.3841, corp: 'omni' },
  { id: 'jb', name: 'JOHANNESBURG', sector: 'af', lat: -26.2041, lon: 28.0473, corp: 'helix' },
  { id: 'sg', name: 'SHINGANG', sector: 'as', lat: 31.2304, lon: 121.4737, corp: 'helix' },
  { id: 'kt', name: 'KITARU', sector: 'as', lat: 35.6762, lon: 139.6503, corp: 'helix' },
  { id: 'nk', name: 'NEO KOWLOON', sector: 'as', lat: 22.3193, lon: 114.1694, corp: 'stratos' },
  { id: 'sy', name: 'SYDNEY', sector: 'oc', lat: -33.8688, lon: 151.2093, corp: 'stratos' },
  { id: 'pr', name: 'PERTH', sector: 'oc', lat: -31.9523, lon: 115.8613, corp: 'stratos' },
  { id: 'ak', name: 'AUCKLAND', sector: 'oc', lat: -36.8485, lon: 174.7633, corp: 'nexus' },
]
export const CITIES: CityDef[] = CITY_LOCATIONS.map((city) => ({ ...city, ...projectGeo(city) }))

export const CITIES_BY_SECTOR: Record<string, CityDef[]> = {}
for (const c of CITIES) (CITIES_BY_SECTOR[c.sector] ??= []).push(c)

const CITY_BY_ID: Record<string, CityDef> = {}
for (const c of CITIES) CITY_BY_ID[c.id] = c

export function cityById(id: string): CityDef {
  return CITY_BY_ID[id]
}

// Percent of the Scan, the unit mission markers and generated jitter use.
export function scanPos(x: number, y: number): { x: number; y: number } {
  return { x: (x / SCAN_W) * 100, y: (y / SCAN_H) * 100 }
}

export function cityScanPos(id: string): { x: number; y: number } {
  const c = cityById(id)
  return scanPos(c.x, c.y)
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

/* ------------------------------ Scan geometry ----------------------------- */

export function yOfLat(lat: number): number {
  return projectGeo({ lat, lon: 0 }).y
}

// Clamp the graticule to the visible projection.
export function graticuleY(lat: number): number {
  const y = yOfLat(lat)
  return y < 0 ? 0 : y > SCAN_H ? SCAN_H : y
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

const TERRITORY_POLYGONS = TERRITORIES.map((territory) => ({
  sector: territory.sector,
  points: parsePts(territory.pts),
}))

export function sectorAtGeo(location: GeoPoint): SectorId | null {
  const { x, y } = projectGeo(location)
  return TERRITORY_POLYGONS.find((territory) => pointInPoly(territory.points, x, y))?.sector ?? null
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
// same Scan. Denser near the named cities, thin everywhere else.
function buildLights(): Light[] {
  const rng = mulberry32(0x5ec7043)
  const out: Light[] = []
  for (const t of TERRITORIES) {
    if (t.sector === 'an') continue
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
  const dir = my < SCAN_H / 2 ? -1 : 1
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

// Unwrap dateline fragments for local silhouettes. Both the bounds and the
// displayed polygons use these same shapes, so eastern Siberia and the
// Aleutians are retained rather than being clipped out of the sidebar icons.
export const SECTOR_SHAPES: Record<string, TerritoryDef[]> = {}
for (const sector of SECTORS) {
  SECTOR_SHAPES[sector.id] = TERRITORIES.filter((t) => t.sector === sector.id).map((t) => {
    const points = parsePts(t.pts)
    const offset = sector.id === 'na' && points.every(([x]) => x > 900) ? -SCAN_W
      : (sector.id === 'as' || sector.id === 'oc') && points.every(([x]) => x < 100) ? SCAN_W : 0
    return offset === 0 ? t : { ...t, pts: points.map(([x, y]) => `${x + offset},${y}`).join(' ') }
  })
}

function sectorBox(id: SectorId, aspect = INSET_ASPECT): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const t of SECTOR_SHAPES[id]) {
    const [a, b, c, d] = bbox(parsePts(t.pts))
    x0 = Math.min(x0, a)
    y0 = Math.min(y0, b)
    x1 = Math.max(x1, c)
    y1 = Math.max(y1, d)
  }
  if (!isFinite(x0)) return [0, 0, SCAN_W, SCAN_H]
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
  if (w / h < aspect) w = h * aspect
  else h = w / aspect
  return [cx - w / 2, cy - h / 2, w, h]
}

export const SECTOR_VIEW: Record<string, string> = {}
// Square silhouettes for sector rows; the existing readout inset stays wide.
export const SECTOR_GLYPH_VIEW: Record<string, string> = {}
export const SECTOR_COORD: Record<string, string> = {}

for (const s of SECTORS) {
  SECTOR_GLYPH_VIEW[s.id] = sectorBox(s.id, 1).map((v) => v.toFixed(1)).join(' ')
  const [x, y, w, h] = sectorBox(s.id)
  SECTOR_VIEW[s.id] = `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
  const { lat, lon } = SECTOR_FOCUS[s.id]
  SECTOR_COORD[s.id] =
    Math.abs(lat).toFixed(2) + (lat >= 0 ? 'N ' : 'S ') + Math.abs(lon).toFixed(2) + (lon >= 0 ? 'E' : 'W')
}
