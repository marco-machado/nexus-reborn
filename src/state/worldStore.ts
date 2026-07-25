// CONTRACT FILE. Strategic layer state: the world clock, per sector control
// and unrest, city ownership, and the events feed that moves them. The world
// map screen drives tick() while it is mounted; nothing else writes here.
import { create } from 'zustand'
import { mulberry32 } from '../game/rng'
import { CITIES, CITIES_BY_SECTOR, HOLDERS, OPEN_SECTORS, SECTORS, sectorDef } from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { CORPS } from '../game/atlas'
import type { SectorId } from '../game/types'

export const DAY = 86400
// World start: 2087.05.14 14:32:17 UTC. t counts world seconds from there.
export const BASE_YEAR = 2087
export const BASE_MONTH = 4
export const BASE_DAY = 14
export const BASE_SEC = 14 * 3600 + 32 * 60 + 17
// World seconds per real second at 1X.
export const TIME_SCALE = 60
export const SPEEDS = [1, 2, 4, 8]
// Longest real frame the clock will honour, so a backgrounded tab does not
// fast forward the world on return.
export const MAX_DT = 0.25

const EVENT_MIN = 900
const EVENT_SPAN = 1800
const MAX_EVENTS = 40

function p2(n: number): string {
  return String(n).padStart(2, '0')
}

export interface Stamp {
  date: string
  clock: string
}

export function stamp(t: number): Stamp {
  const total = BASE_SEC + Math.floor(t)
  const days = Math.floor(total / DAY)
  const rem = total - days * DAY
  const d = new Date(Date.UTC(BASE_YEAR, BASE_MONTH, BASE_DAY + days))
  return {
    date: d.getUTCFullYear() + '.' + p2(d.getUTCMonth() + 1) + '.' + p2(d.getUTCDate()),
    clock: p2(Math.floor(rem / 3600)) + ':' + p2(Math.floor(rem / 60) % 60) + ':' + p2(rem % 60),
  }
}

export function hhmm(t: number): string {
  const total = BASE_SEC + Math.floor(t)
  const rem = ((total % DAY) + DAY) % DAY
  return p2(Math.floor(rem / 3600)) + ':' + p2(Math.floor(rem / 60) % 60)
}

/* --------------------------------- events --------------------------------- */

export type EventKind = 'riot' | 'seizure' | 'trade' | 'raid' | 'blackout'
export type EventTone = 'red' | 'green' | 'amber' | 'dim'

export interface WorldEvent {
  id: number
  t: number
  sector: SectorId
  kind: EventKind
  tone: EventTone
  text: string
}

export interface SectorState {
  control: number
  unrest: number
}

const SEED_EVENTS: WorldEvent[] = [
  {
    id: 1,
    t: -2717,
    sector: 'eu',
    kind: 'trade',
    tone: 'dim',
    text: 'HELIX CORP SECURES TRADE AGREEMENT IN OSLO',
  },
  {
    id: 2,
    t: -1277,
    sector: 'sa',
    kind: 'seizure',
    tone: 'green',
    text: 'NEXUS GLOBAL TAKES CONTROL OF BOGOTA',
  },
  {
    id: 3,
    t: -257,
    sector: 'af',
    kind: 'riot',
    tone: 'red',
    text: 'RIOTS REPORTED IN CAIRO',
  },
]

const TONE: Record<EventKind, EventTone> = {
  riot: 'red',
  seizure: 'green',
  trade: 'dim',
  raid: 'amber',
  blackout: 'dim',
}

const rng = mulberry32(0x2087051)

function pick<T>(items: T[]): T {
  return items[Math.floor(rng() * items.length) % items.length]
}

function span(lo: number, hi: number): number {
  return lo + rng() * (hi - lo)
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// Unrest pulls events toward a sector and toward the violent kinds.
function rollSector(sectors: Record<string, SectorState>): SectorId {
  let total = 0
  const weights = OPEN_SECTORS.map((id) => {
    const w = 1 + sectors[id].unrest / 8
    total += w
    return w
  })
  let r = rng() * total
  for (let i = 0; i < OPEN_SECTORS.length; i++) {
    r -= weights[i]
    if (r <= 0) return OPEN_SECTORS[i]
  }
  return OPEN_SECTORS[OPEN_SECTORS.length - 1]
}

function rollKind(state: SectorState): EventKind {
  const heat = state.unrest / 40
  const table: Array<[EventKind, number]> = [
    ['riot', 0.1 + heat],
    ['blackout', 0.12 + heat * 0.4],
    ['raid', 0.18 + heat * 0.5],
    ['trade', 0.3 - heat * 0.3],
    ['seizure', 0.22 - heat * 0.1],
  ]
  let total = 0
  for (const [, w] of table) total += Math.max(0.02, w)
  let r = rng() * total
  for (const [kind, w] of table) {
    r -= Math.max(0.02, w)
    if (r <= 0) return kind
  }
  return 'trade'
}

interface Rolled {
  event: WorldEvent
  state: SectorState
  flip: { city: string; corp: CorpId } | null
}

const LINES: Record<EventKind, string[]> = {
  riot: ['RIOTS REPORTED IN ', 'CIVIL UNREST SPREADS THROUGH ', 'STRIKE COLUMNS BLOCK '],
  blackout: ['GRID BLACKOUT ACROSS ', 'DATA RELAYS DOWN IN ', 'TRANSIT NETWORK STALLED IN '],
  raid: ['CORPSEC RAID SWEEPS ', 'CURFEW ENFORCED IN ', 'CORPSEC RETAKES THE DOCKS IN '],
  trade: [' SECURES TRADE AGREEMENT IN ', ' OPENS A FREE PORT IN ', ' BUYS THE UTILITY GRID IN '],
  seizure: [' TAKES CONTROL OF ', ' SEIZES THE COUNCIL IN ', ' ANNEXES THE HOLDINGS OF '],
}

function rollEvent(
  id: number,
  t: number,
  sectors: Record<string, SectorState>,
  owner: Record<string, CorpId>,
): Rolled {
  const sector = rollSector(sectors)
  const prev = sectors[sector]
  const kind = rollKind(prev)
  const cities = CITIES_BY_SECTOR[sector] ?? []
  const city = cities.length ? pick(cities) : null
  const where = city ? city.name : sectorDef(sector).name
  const line = pick(LINES[kind])
  let control = prev.control
  let unrest = prev.unrest
  let flip: { city: string; corp: CorpId } | null = null
  let text = ''

  switch (kind) {
    case 'riot':
      unrest += span(3, 8)
      control -= span(1, 3)
      text = line + where
      break
    case 'blackout':
      unrest += span(1, 3)
      text = line + where
      break
    case 'raid':
      unrest -= span(2, 5)
      control += span(0, 2)
      text = line + where
      break
    case 'trade': {
      control += span(1, 3)
      unrest -= span(0, 2)
      // The holder of the city is the one signing.
      const corp = city ? (owner[city.id] ?? city.corp) : pick(HOLDERS)
      text = CORPS[corp].name + line + where
      break
    }
    case 'seizure': {
      // A takeover only reads as one if the city changes hands.
      const holder = city ? (owner[city.id] ?? city.corp) : null
      const rivals = HOLDERS.filter((c) => c !== holder)
      const corp = pick(rivals)
      control += span(0, 2)
      unrest += span(0, 3)
      if (city) flip = { city: city.id, corp }
      text = CORPS[corp].name + line + where
      break
    }
  }

  return {
    event: { id, t, sector, kind, tone: TONE[kind], text },
    state: { control: clamp(control, 4, 96), unrest: clamp(unrest, 2, 74) },
    flip,
  }
}

/* --------------------------------- store ---------------------------------- */

interface WorldStoreState {
  t: number
  speed: number
  paused: boolean
  sectors: Record<string, SectorState>
  owner: Record<string, CorpId>
  events: WorldEvent[]
  unread: number
  selected: SectorId
  // World time the feed is pinned to, or null when it follows the clock.
  review: number | null
  nextEventT: number
  tick: (dt: number) => void
  setSpeed: (speed: number) => void
  togglePause: () => void
  select: (id: SectorId) => void
  stepSector: (dir: number) => void
  setReview: (t: number | null) => void
  markRead: () => void
}

function initialSectors(): Record<string, SectorState> {
  const out: Record<string, SectorState> = {}
  for (const s of SECTORS) out[s.id] = { control: s.control, unrest: s.unrest }
  return out
}

function initialOwner(): Record<string, CorpId> {
  const out: Record<string, CorpId> = {}
  for (const c of CITIES) out[c.id] = c.corp
  return out
}

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  t: 0,
  speed: 2,
  paused: false,
  sectors: initialSectors(),
  owner: initialOwner(),
  events: SEED_EVENTS,
  unread: SEED_EVENTS.length,
  selected: 'eu',
  review: null,
  nextEventT: EVENT_MIN + EVENT_SPAN * 0.4,

  tick: (dt) => {
    const s = get()
    if (s.paused) return
    const t = s.t + dt * s.speed * TIME_SCALE
    if (t < s.nextEventT) {
      // Reviewing more than a day back is off the timeline; snap to live.
      if (s.review !== null && s.review < t - DAY) set({ t, review: null })
      else set({ t })
      return
    }

    const rolled = rollEvent(
      s.events[s.events.length - 1].id + 1,
      s.nextEventT,
      s.sectors,
      s.owner,
    )
    const events = s.events.concat(rolled.event)
    const owner = rolled.flip ? { ...s.owner, [rolled.flip.city]: rolled.flip.corp } : s.owner
    set({
      t,
      sectors: { ...s.sectors, [rolled.event.sector]: rolled.state },
      owner,
      events: events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events,
      unread: s.unread + 1,
      review: s.review !== null && s.review < t - DAY ? null : s.review,
      nextEventT: s.nextEventT + EVENT_MIN + rng() * EVENT_SPAN,
    })
  },

  setSpeed: (speed) => set({ speed, paused: false }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  select: (id) => set({ selected: id }),
  stepSector: (dir) =>
    set((s) => {
      const i = OPEN_SECTORS.indexOf(s.selected)
      const n = OPEN_SECTORS.length
      return { selected: OPEN_SECTORS[(i + dir + n) % n] }
    }),
  setReview: (t) => set({ review: t }),
  markRead: () => set({ unread: 0 }),
}))

/* -------------------------------- selectors ------------------------------- */

export function globalInfluence(sectors: Record<string, SectorState>): number {
  let sum = 0
  let weight = 0
  for (const s of SECTORS) {
    if (s.locked) continue
    sum += sectors[s.id].control * s.weight
    weight += s.weight
  }
  return weight > 0 ? sum / weight : 0
}

export type ThreatLevel = 'NOMINAL' | 'GUARDED' | 'ELEVATED' | 'SEVERE'

export function threatLevel(sectors: Record<string, SectorState>): ThreatLevel {
  let worst = 0
  for (const s of SECTORS) {
    if (s.locked) continue
    worst = Math.max(worst, sectors[s.id].unrest)
  }
  if (worst >= 45) return 'SEVERE'
  if (worst >= 25) return 'ELEVATED'
  if (worst >= 15) return 'GUARDED'
  return 'NOMINAL'
}

export interface SectorReadout {
  control: number
  unrest: number
  taxYield: number
  influenceIncome: number
  blackMarket: number
  garrison: 'SECURE' | 'STRAINED' | 'CRITICAL'
  forces: number
  assets: number
  defense: number
}

export function sectorReadout(id: SectorId, state: SectorState): SectorReadout {
  const def = sectorDef(id)
  const control = state.control
  const unrest = state.unrest
  return {
    control,
    unrest,
    taxYield: (def.yieldBase * control) / 100,
    influenceIncome: control * 0.0198,
    blackMarket: -unrest * 0.01,
    garrison: control >= 55 ? 'SECURE' : control >= 35 ? 'STRAINED' : 'CRITICAL',
    forces: Math.round((def.forcesBase * control) / 100),
    assets: def.assets,
    defense: clamp(Math.round(control - unrest / 2 + 21), 0, 100),
  }
}

