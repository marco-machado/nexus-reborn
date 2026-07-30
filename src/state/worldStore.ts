// CONTRACT FILE. Strategic layer state: the world clock, per sector control
// and unrest, city ownership, the events feed that moves them, the generated
// contract market the feed feeds, the spendable influence resource, and the
// unrest pressure/crisis flow. The world map screen drives tick() while it is
// mounted; nothing else writes here.
import { create } from 'zustand'
import { mulberryStep } from '../game/rng'
import { MISSIONS } from '../game/data'
import {
  CITIES,
  CITIES_BY_SECTOR,
  HOLDERS,
  OPEN_SECTORS,
  SECTORS,
  cityById,
  sectorDef,
} from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { CORPS } from '../game/atlas'
import {
  CONTRACT_MIN_SEC,
  CONTRACT_SPAN_SEC,
  CONTRACT_TARGET,
  INITIAL_CONTRACT_RNG,
  contractMission,
  contractMissionById,
  isGeneratedMissionId,
  rollContract,
  rollSuppressionContract,
  sectorClient,
} from '../game/contracts'
import type {
  ContractSectorInput,
  GeneratedContract,
  RolledContract,
} from '../game/contracts'
import { expediteTarget } from '../game/contracts'
import {
  CONTROL_MAX,
  CONTROL_MIN,
  CRISIS_UNREST_ENTER,
  CRISIS_UNREST_EXIT,
  EXPEDITE_EXTENSION_SEC,
  INFLUENCE_ACTIONS,
  INFLUENCE_CLEAN_PTS,
  INFLUENCE_WIN_PTS,
  PRESSURE_CONTROL_DROP_MAX,
  PRESSURE_CONTROL_DROP_MIN,
  PRESSURE_INTERVAL_SEC,
  PRESSURE_UNREST_MIN,
  TRICKLE_INDEX_MIN,
  TRICKLE_INTERVAL_SEC,
  TRICKLE_PTS,
  UNREST_MAX,
  UNREST_MIN,
  cooldownKey,
  taxStrain,
} from '../game/influence'
import type { InfluenceActionId, PendingSpend } from '../game/influence'
import {
  EVENT_MIN_SEC,
  EVENT_SPAN_SEC,
  kindWeights,
  sectorEventWeight,
} from '../game/forecast'
import type { MissionDef, SectorId } from '../game/types'
import type { MissionOutcome } from './appStore'

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

// Event pacing lives in game/forecast.ts beside the weights, so the intel
// forecast reads the same numbers the generator rolls from.
const EVENT_MIN = EVENT_MIN_SEC
const EVENT_SPAN = EVENT_SPAN_SEC
const MAX_EVENTS = 40
export const INITIAL_WORLD_RNG = 0x2087051
// First contract-generation check, one minimum interval after world start.
export const INITIAL_NEXT_CONTRACT_T = CONTRACT_MIN_SEC

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

export type EventKind =
  | 'riot' | 'seizure' | 'trade' | 'raid' | 'blackout' | 'kia' | 'contract'
  | 'crisis' | 'influence'
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
  kia: 'red',
  contract: 'green',
  crisis: 'red',
  influence: 'amber',
}

// Odds that a rolled world event touches the contract market, kept beside the
// event tables so the definitions and their market effects read together. A
// riot may spawn a linked suppression contract in its sector; a CorpSec raid
// may withdraw an open generated contract; a seizure that flips a city always
// re-clients the sector's open contracts when the dominant holder changed.
const EVENT_CONTRACT_FX = { riot: 0.45, raid: 0.35, seizure: 1 } as const

interface RngCursor {
  state: number
}

function nextRandom(rng: RngCursor): number {
  const [value, nextState] = mulberryStep(rng.state)
  rng.state = nextState
  return value
}

function pick<T>(items: T[], rng: RngCursor): T {
  return items[Math.floor(nextRandom(rng) * items.length) % items.length]
}

function span(lo: number, hi: number, rng: RngCursor): number {
  return lo + nextRandom(rng) * (hi - lo)
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// Unrest pulls events toward a sector and toward the violent kinds; a sector
// in crisis draws at double weight. Both weight tables live in game/forecast
// so the intel forecast derives from exactly what is rolled here.
function rollSector(
  sectors: Record<string, SectorState>,
  crisis: SectorId[],
  rng: RngCursor,
): SectorId {
  let total = 0
  const weights = OPEN_SECTORS.map((id) => {
    const w = sectorEventWeight(sectors[id].unrest, crisis.includes(id))
    total += w
    return w
  })
  let r = nextRandom(rng) * total
  for (let i = 0; i < OPEN_SECTORS.length; i++) {
    r -= weights[i]
    if (r <= 0) return OPEN_SECTORS[i]
  }
  return OPEN_SECTORS[OPEN_SECTORS.length - 1]
}

function rollKind(state: SectorState, rng: RngCursor): EventKind {
  const table = kindWeights(state.unrest)
  let total = 0
  for (const [, w] of table) total += w
  let r = nextRandom(rng) * total
  for (const [kind, w] of table) {
    r -= w
    if (r <= 0) return kind
  }
  return 'trade'
}

interface Rolled {
  event: WorldEvent
  state: SectorState
  flip: { city: string; corp: CorpId } | null
  rngState: number
}

const LINES: Record<EventKind, string[]> = {
  riot: ['RIOTS REPORTED IN ', 'CIVIL UNREST SPREADS THROUGH ', 'STRIKE COLUMNS BLOCK '],
  blackout: ['GRID BLACKOUT ACROSS ', 'DATA RELAYS DOWN IN ', 'TRANSIT NETWORK STALLED IN '],
  raid: ['CORPSEC RAID SWEEPS ', 'CURFEW ENFORCED IN ', 'CORPSEC RETAKES THE DOCKS IN '],
  trade: [' SECURES TRADE AGREEMENT IN ', ' OPENS A FREE PORT IN ', ' BUYS THE UTILITY GRID IN '],
  seizure: [' TAKES CONTROL OF ', ' SEIZES THE COUNCIL IN ', ' ANNEXES THE HOLDINGS OF '],
  // Never rolled: KIA events are posted by applyMissionResult alone, contract
  // events by the market flow, crisis lines by the pressure flow, and
  // influence lines by the spend actions.
  kia: [],
  contract: [],
  crisis: [],
  influence: [],
}

function rollEvent(
  id: number,
  t: number,
  sectors: Record<string, SectorState>,
  owner: Record<string, CorpId>,
  crisis: SectorId[],
  rngState: number,
): Rolled {
  const rng = { state: rngState }
  const sector = rollSector(sectors, crisis, rng)
  const prev = sectors[sector]
  const kind = rollKind(prev, rng)
  const cities = CITIES_BY_SECTOR[sector] ?? []
  const city = cities.length ? pick(cities, rng) : null
  const where = city ? city.name : sectorDef(sector).name
  const line = pick(LINES[kind], rng)
  let control = prev.control
  let unrest = prev.unrest
  let flip: { city: string; corp: CorpId } | null = null
  let text = ''

  switch (kind) {
    case 'riot':
      unrest += span(3, 8, rng)
      control -= span(1, 3, rng)
      text = line + where
      break
    case 'blackout':
      unrest += span(1, 3, rng)
      text = line + where
      break
    case 'raid':
      unrest -= span(2, 5, rng)
      control += span(0, 2, rng)
      text = line + where
      break
    case 'trade': {
      control += span(1, 3, rng)
      unrest -= span(0, 2, rng)
      // The holder of the city is the one signing.
      const corp = city ? (owner[city.id] ?? city.corp) : pick(HOLDERS, rng)
      text = CORPS[corp].name + line + where
      break
    }
    case 'seizure': {
      // A takeover only reads as one if the city changes hands.
      const holder = city ? (owner[city.id] ?? city.corp) : null
      const rivals = HOLDERS.filter((c) => c !== holder)
      const corp = pick(rivals, rng)
      control += span(0, 2, rng)
      unrest += span(0, 3, rng)
      if (city) flip = { city: city.id, corp }
      text = CORPS[corp].name + line + where
      break
    }
  }

  return {
    event: { id, t, sector, kind, tone: TONE[kind], text },
    state: {
      control: clamp(control, CONTROL_MIN, CONTROL_MAX),
      unrest: clamp(unrest, UNREST_MIN, UNREST_MAX),
    },
    flip,
    rngState: rng.state,
  }
}

/* ------------------------------- world flow -------------------------------- */

// The timed world processes as one mutable working set, so tick() and
// advanceDays() run the identical catch-up and a contract ETA jump lands
// exactly where continuous ticking would have.
interface WorldFlow {
  sectors: Record<string, SectorState>
  owner: Record<string, CorpId>
  events: WorldEvent[]
  unread: number
  nextEventT: number
  rngState: number
  contracts: GeneratedContract[]
  contractRngState: number
  nextContractT: number
  influence: number
  nextTrickleT: number
  spends: PendingSpend[]
  crisis: SectorId[]
  // Next decay check per sector holding above the pressure threshold; a
  // sector at or under it carries no entry.
  pressure: Record<string, number>
}

function flowOf(s: WorldStoreState): WorldFlow {
  return {
    sectors: s.sectors,
    owner: s.owner,
    events: s.events,
    unread: s.unread,
    nextEventT: s.nextEventT,
    rngState: s.rngState,
    contracts: s.contracts,
    contractRngState: s.contractRngState,
    nextContractT: s.nextContractT,
    influence: s.influence,
    nextTrickleT: s.nextTrickleT,
    spends: s.spends,
    crisis: s.crisis,
    pressure: s.pressure,
  }
}

function nextEventId(f: WorldFlow): number {
  return (f.events[f.events.length - 1]?.id ?? 0) + 1
}

function appendEvent(f: WorldFlow, event: WorldEvent): void {
  const events = f.events.concat(event)
  f.events = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events
  f.unread = Math.min(MAX_EVENTS, f.unread + 1)
}

function postContractEvent(
  f: WorldFlow,
  t: number,
  sector: SectorId,
  tone: EventTone,
  text: string,
): void {
  appendEvent(f, { id: nextEventId(f), t, sector, kind: 'contract', tone, text })
}

// Snapshot of every open sector as contract-generation input: the readout the
// world map shows (defense, garrison) plus the atlas weight and the corp
// holding the most cities, so generated work derives from what the player sees.
function contractInputs(
  sectors: Record<string, SectorState>,
  owner: Record<string, CorpId>,
): ContractSectorInput[] {
  return OPEN_SECTORS.map((id) => {
    const def = sectorDef(id)
    const read = sectorReadout(id, sectors[id])
    return {
      sector: id,
      control: read.control,
      unrest: read.unrest,
      defense: read.defense,
      garrison: read.garrison,
      weight: def.weight,
      client: sectorClient(id, owner),
    }
  })
}

// One contract whose id does not collide with an open one, advancing the
// contract cursor deterministically either way.
function freshContract(
  f: WorldFlow,
  roll: (state: number) => RolledContract,
): GeneratedContract {
  let rolled = roll(f.contractRngState)
  for (let tries = 0; tries < 8 && f.contracts.some((c) => c.id === rolled.contract.id); tries++) {
    rolled = roll(rolled.state)
  }
  f.contractRngState = rolled.state
  return rolled.contract
}

// World events touch the contract market with the odds in EVENT_CONTRACT_FX.
// Contract rolls step the contract cursor, never the event stream, so the
// market leaves the event sequence itself unchanged.
function applyContractHooks(f: WorldFlow, event: WorldEvent, flipped: boolean): void {
  if (event.kind === 'riot') {
    const rng = { state: f.contractRngState }
    const roll = nextRandom(rng)
    f.contractRngState = rng.state
    if (roll < EVENT_CONTRACT_FX.riot && f.contracts.length < CONTRACT_TARGET) {
      const input = contractInputs(f.sectors, f.owner).find((i) => i.sector === event.sector)
      if (!input) return
      const contract = freshContract(f, (state) =>
        rollSuppressionContract(input, event.t, state),
      )
      f.contracts = [...f.contracts, contract]
      postContractEvent(
        f,
        event.t,
        event.sector,
        'amber',
        'PRIORITY CONTRACT ' +
          contractMission(contract).codename +
          ' POSTED IN ' +
          cityById(contract.cityId).name,
      )
    }
  } else if (event.kind === 'raid') {
    const open = f.contracts.filter((c) => c.sector === event.sector)
    if (open.length === 0) return
    const rng = { state: f.contractRngState }
    if (nextRandom(rng) < EVENT_CONTRACT_FX.raid) {
      const victim = open[Math.floor(nextRandom(rng) * open.length) % open.length]
      f.contracts = f.contracts.filter((c) => c.id !== victim.id)
      postContractEvent(
        f,
        event.t,
        event.sector,
        'amber',
        'CORPSEC RAID WITHDRAWS CONTRACT ' + contractMission(victim).codename,
      )
    }
    f.contractRngState = rng.state
  } else if (event.kind === 'seizure' && flipped && EVENT_CONTRACT_FX.seizure > 0) {
    const client = sectorClient(event.sector, f.owner)
    for (const c of f.contracts) {
      if (c.sector !== event.sector || c.client === client) continue
      f.contracts = f.contracts.map((x) => (x.id === c.id ? { ...x, client } : x))
      postContractEvent(
        f,
        event.t,
        event.sector,
        'dim',
        'CONTRACT ' + contractMission(c).codename + ' RE-CLIENTED TO ' + CORPS[client].name,
      )
    }
  }
}

// Re-checks pressure timers and crisis state after anything moved a sector's
// unrest, at time t: a sector over the threshold gets a decay timer, a sector
// back under loses it; the crisis marks post their own feed lines, and a
// sector entering crisis promotes its open generated contracts to priority.
function settlePressure(f: WorldFlow, t: number): void {
  for (const id of OPEN_SECTORS) {
    const unrest = f.sectors[id].unrest
    const timed = f.pressure[id] !== undefined
    if (unrest > PRESSURE_UNREST_MIN && !timed) {
      f.pressure = { ...f.pressure, [id]: t + PRESSURE_INTERVAL_SEC }
    } else if (unrest <= PRESSURE_UNREST_MIN && timed) {
      const pressure = { ...f.pressure }
      delete pressure[id]
      f.pressure = pressure
    }
    const inCrisis = f.crisis.includes(id)
    if (!inCrisis && unrest >= CRISIS_UNREST_ENTER) {
      f.crisis = [...f.crisis, id]
      f.contracts = f.contracts.map((c) =>
        c.sector === id && !c.priority ? { ...c, priority: true } : c,
      )
      appendEvent(f, {
        id: nextEventId(f), t, sector: id, kind: 'crisis', tone: 'red',
        text: sectorDef(id).name + ' ENTERS CRISIS // GARRISONS OVERWHELMED',
      })
    } else if (inCrisis && unrest < CRISIS_UNREST_EXIT) {
      f.crisis = f.crisis.filter((s) => s !== id)
      appendEvent(f, {
        id: nextEventId(f), t, sector: id, kind: 'crisis', tone: 'green',
        text: sectorDef(id).name + ' CRISIS CONTAINED // UNREST SUBSIDING',
      })
    }
  }
}

// Applies every staged influence spend step due at t and drops finished ones.
function applySpendSteps(f: WorldFlow, t: number): void {
  const spends: PendingSpend[] = []
  for (const s of f.spends) {
    if (s.nextT > t) {
      spends.push(s)
      continue
    }
    const def = INFLUENCE_ACTIONS[s.action]
    const prev = f.sectors[s.sector]
    f.sectors = {
      ...f.sectors,
      [s.sector]: {
        control: clamp(prev.control + def.controlDelta, CONTROL_MIN, CONTROL_MAX),
        unrest: clamp(prev.unrest + def.unrestDelta, UNREST_MIN, UNREST_MAX),
      },
    }
    if (s.remaining > 1) {
      spends.push({ ...s, nextT: s.nextT + def.stepSec, remaining: s.remaining - 1 })
    }
  }
  f.spends = spends
}

// One decay step for every sector whose pressure timer is due at t: control
// drops 1-2 off the main event rng cursor and the timer rearms.
function applyPressure(f: WorldFlow, t: number): void {
  for (const id of OPEN_SECTORS) {
    const at = f.pressure[id]
    if (at === undefined || at > t) continue
    const rng = { state: f.rngState }
    const drop =
      PRESSURE_CONTROL_DROP_MIN +
      Math.floor(
        nextRandom(rng) * (PRESSURE_CONTROL_DROP_MAX - PRESSURE_CONTROL_DROP_MIN + 1),
      )
    f.rngState = rng.state
    const prev = f.sectors[id]
    f.sectors = {
      ...f.sectors,
      [id]: { ...prev, control: clamp(prev.control - drop, CONTROL_MIN, CONTROL_MAX) },
    }
    f.pressure = { ...f.pressure, [id]: at + PRESSURE_INTERVAL_SEC }
  }
}

// Advances every timed world process (event rolls, contract expiry, contract
// generation, staged influence spends, unrest decay, the influence trickle)
// to time t in timestamp order. Returns whether anything moved.
function advanceFlow(f: WorldFlow, t: number): boolean {
  let changed = false
  for (;;) {
    let expireT = Infinity
    for (const c of f.contracts) if (c.expiresAtT < expireT) expireT = c.expiresAtT
    let spendT = Infinity
    for (const s of f.spends) if (s.nextT < spendT) spendT = s.nextT
    let pressT = Infinity
    for (const id of OPEN_SECTORS) {
      const at = f.pressure[id]
      if (at !== undefined && at < pressT) pressT = at
    }
    const stepT = Math.min(
      f.nextEventT, f.nextContractT, expireT, spendT, pressT, f.nextTrickleT,
    )
    if (stepT > t) return changed
    changed = true
    if (expireT === stepT) {
      const due = f.contracts.filter((c) => c.expiresAtT <= stepT)
      f.contracts = f.contracts.filter((c) => c.expiresAtT > stepT)
      for (const c of due) {
        postContractEvent(
          f,
          c.expiresAtT,
          c.sector,
          'dim',
          'CONTRACT ' + contractMission(c).codename + ' EXPIRED // OFFER RESCINDED',
        )
      }
    } else if (f.nextEventT === stepT) {
      const rolled = rollEvent(
        nextEventId(f), f.nextEventT, f.sectors, f.owner, f.crisis, f.rngState,
      )
      f.sectors = { ...f.sectors, [rolled.event.sector]: rolled.state }
      if (rolled.flip) f.owner = { ...f.owner, [rolled.flip.city]: rolled.flip.corp }
      appendEvent(f, rolled.event)
      const scheduleRng = { state: rolled.rngState }
      f.nextEventT += EVENT_MIN + nextRandom(scheduleRng) * EVENT_SPAN
      f.rngState = scheduleRng.state
      applyContractHooks(f, rolled.event, rolled.flip !== null)
      settlePressure(f, stepT)
    } else if (f.nextContractT === stepT) {
      // Generation checkpoint: below target, roll one contract; either way,
      // schedule the next check 2-6 world hours out.
      const rng = { state: f.contractRngState }
      if (f.contracts.length < CONTRACT_TARGET) {
        const inputs = contractInputs(f.sectors, f.owner)
        const contract = freshContract(f, (state) =>
          rollContract(inputs, f.nextContractT, state),
        )
        f.contracts = [...f.contracts, contract]
        postContractEvent(
          f,
          f.nextContractT,
          contract.sector,
          'green',
          'OPEN CONTRACT ' +
            contractMission(contract).codename +
            ' POSTED IN ' +
            cityById(contract.cityId).name,
        )
        rng.state = f.contractRngState
      }
      f.nextContractT += CONTRACT_MIN_SEC + nextRandom(rng) * CONTRACT_SPAN_SEC
      f.contractRngState = rng.state
    } else if (spendT === stepT) {
      applySpendSteps(f, stepT)
      settlePressure(f, stepT)
    } else if (pressT === stepT) {
      applyPressure(f, stepT)
    } else {
      // Influence trickle: the network pays while the index holds high.
      if (globalInfluence(f.sectors) > TRICKLE_INDEX_MIN) f.influence += TRICKLE_PTS
      f.nextTrickleT += TRICKLE_INTERVAL_SEC
    }
  }
}

/* --------------------------------- store ---------------------------------- */

export interface WorldStoreState {
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
  rngState: number
  // The generated contract market: open records, its own serialized rng
  // cursor, and the next generation check on the strategic clock.
  contracts: GeneratedContract[]
  contractRngState: number
  nextContractT: number
  // The spendable influence resource: the point balance, the next trickle
  // check, staged spends still applying, and per-sector action cooldowns
  // (readyAtT keyed by cooldownKey). The influence index shown beside it is
  // always derived (globalInfluence), never stored.
  influence: number
  nextTrickleT: number
  spends: PendingSpend[]
  cooldowns: Record<string, number>
  // Unrest pressure: sectors in crisis, and the next decay check for each
  // sector holding above the pressure threshold.
  crisis: SectorId[]
  pressure: Record<string, number>
  tick: (dt: number) => void
  advanceDays: (days: number) => void
  // `kia` carries the codenames of operatives lost in the mission; the feed
  // posts a red loss line for them alongside the result event.
  applyMissionResult: (missionId: string, outcome: MissionOutcome, kia?: string[]) => void
  // Spends influence points on a numbered sector action. A blocked spend
  // (unaffordable, cooling down, or expedite without a target) is a no-op.
  spendInfluence: (sector: SectorId, action: InfluenceActionId) => void
  setSpeed: (speed: number) => void
  togglePause: () => void
  select: (id: SectorId) => void
  stepSector: (dir: number) => void
  setReview: (t: number | null) => void
  markRead: () => void
}

export function initialSectors(): Record<string, SectorState> {
  const out: Record<string, SectorState> = {}
  for (const s of SECTORS) out[s.id] = { control: s.control, unrest: s.unrest }
  return out
}

export function initialOwner(): Record<string, CorpId> {
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
  rngState: INITIAL_WORLD_RNG,
  contracts: [],
  contractRngState: INITIAL_CONTRACT_RNG,
  nextContractT: INITIAL_NEXT_CONTRACT_T,
  influence: 0,
  nextTrickleT: TRICKLE_INTERVAL_SEC,
  spends: [],
  cooldowns: {},
  crisis: [],
  pressure: {},

  tick: (dt) => {
    const s = get()
    if (s.paused) return
    const t = s.t + dt * s.speed * TIME_SCALE
    // Reviewing more than a day back is off the timeline; snap to live.
    const review = s.review !== null && s.review < t - DAY ? null : s.review
    const flow = flowOf(s)
    if (!advanceFlow(flow, t)) {
      set(review !== s.review ? { t, review } : { t })
      return
    }
    set({ t, review, ...flow })
  },

  // Contract ETA cost: jumps the clock forward whole days and replays every
  // event, contract expiry and contract roll the skipped time would have
  // produced, so sectors, ownership, the market and both rng streams land
  // exactly where continuous ticking would have put them. Labs and injuries
  // catch up through their own sync(t) on the next clock.
  advanceDays: (days) =>
    set((s) => {
      if (!Number.isFinite(days) || days <= 0) return s
      const t = s.t + days * DAY
      const flow = flowOf(s)
      advanceFlow(flow, t)
      return { t, review: null, ...flow }
    }),

  applyMissionResult: (missionId, outcome, kia) =>
    set((state) => {
      const record = state.contracts.find((c) => c.id === missionId) ?? null
      const mission: MissionDef | undefined = record
        ? contractMission(record)
        : (MISSIONS.find((m) => m.id === missionId) ?? contractMissionById(missionId))
      if (!mission) return state
      // Authored ids carry their campaign index; generated work varies the
      // deltas off its rolled seed instead.
      const missionIndex = isGeneratedMissionId(mission.id)
        ? mission.seed % 3
        : Math.max(0, Number.parseInt(mission.id.slice(1), 10) - 1)
      const previous = state.sectors[mission.sector]
      const collateral = Math.min(5, Math.max(0, outcome.civiliansHit))
      const controlDelta = outcome.won ? 4 + (missionIndex % 3) : -(1 + (missionIndex % 2))
      const unrestDelta = outcome.won
        ? -(3 + ((missionIndex + 1) % 3)) + collateral
        : 4 + (missionIndex % 4) + collateral
      const sector = {
        control: clamp(previous.control + controlDelta, CONTROL_MIN, CONTROL_MAX),
        unrest: clamp(previous.unrest + unrestDelta, UNREST_MIN, UNREST_MAX),
      }
      // Authored Milestone 1 missions change sector pressure only. Glass Veil's
      // client, Sable Enterprises, is not a city holder, so there is no valid
      // ownership target until holder-corp seizure contracts arrive.
      const event: WorldEvent = {
        id: (state.events[state.events.length - 1]?.id ?? 0) + 1,
        t: state.t,
        sector: mission.sector,
        kind: outcome.won ? 'seizure' : 'riot',
        tone: outcome.won ? 'green' : 'red',
        text: outcome.won
          ? `STRIKE TEAM 04 OPENS ${mission.district} IN ${mission.city}`
          : `STRIKE TEAM 04 WITHDRAWS FROM ${mission.district} IN ${mission.city}`,
      }
      let events = [...state.events, event]
      let added = 1
      if (kia && kia.length > 0) {
        events = [
          ...events,
          {
            id: event.id + 1,
            t: state.t,
            sector: mission.sector,
            kind: 'kia' as const,
            tone: TONE.kia,
            text:
              (kia.length === 1 ? 'OPERATIVE ' : 'OPERATIVES ') +
              kia.join(', ') +
              ` KIA IN ${mission.city}`,
          },
        ]
        added += 1
      }
      // A win pays influence points beside the fee, clean work a premium; and
      // the unrest move may arm or clear pressure timers or flip crisis, so
      // the result settles through the same helper the timed flow uses. The
      // fulfilled generated contract leaves the market first, won or lost.
      const f = flowOf(state)
      f.sectors = { ...state.sectors, [mission.sector]: sector }
      f.events = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events
      f.unread = state.unread + added
      f.contracts = record
        ? state.contracts.filter((c) => c.id !== missionId)
        : state.contracts
      f.influence = outcome.won
        ? state.influence +
          INFLUENCE_WIN_PTS +
          (outcome.civiliansHit === 0 ? INFLUENCE_CLEAN_PTS : 0)
        : state.influence
      settlePressure(f, state.t)
      return { ...f }
    }),

  spendInfluence: (sector, action) =>
    set((s) => {
      const def = INFLUENCE_ACTIONS[action]
      if (s.influence < def.cost) return s
      const key = cooldownKey(sector, action)
      if ((s.cooldowns[key] ?? -Infinity) > s.t) return s
      const f = flowOf(s)
      if (action === 'expedite') {
        const target = expediteTarget(s.contracts, sector)
        if (!target) return s
        f.contracts = s.contracts.map((c) =>
          c.id === target.id
            ? { ...c, expedited: true, expiresAtT: c.expiresAtT + EXPEDITE_EXTENSION_SEC }
            : c,
        )
        appendEvent(f, {
          id: nextEventId(f), t: s.t, sector, kind: 'influence', tone: 'amber',
          text:
            'CONTRACT ' + contractMission(target).codename + ' EXPEDITED // INTEL GATE WAIVED',
        })
      } else {
        f.spends = [
          ...s.spends,
          { action, sector, nextT: s.t + def.stepSec, remaining: def.steps },
        ]
        appendEvent(f, {
          id: nextEventId(f), t: s.t, sector, kind: 'influence', tone: 'amber',
          text:
            action === 'stabilize'
              ? 'STABILIZATION ASSETS DEPLOYED IN ' + sectorDef(sector).name
              : 'LOBBYING CAMPAIGN OPENED IN ' + sectorDef(sector).name,
        })
      }
      f.influence = s.influence - def.cost
      return { ...f, cooldowns: { ...s.cooldowns, [key]: s.t + def.cooldownSec } }
    }),

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

/* ------------------------------ mission lookup ----------------------------- */

// Authored missions plus open generated contracts, plus the last derived
// mission for a contract that just left the store: the debrief renders after
// applyMissionResult removed the fulfilled record.
export function resolveMission(id: string): MissionDef | null {
  const authored = MISSIONS.find((m) => m.id === id)
  if (authored) return authored
  const record = useWorldStore.getState().contracts.find((c) => c.id === id)
  if (record) return contractMission(record)
  return contractMissionById(id) ?? null
}

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
    // Unrest pressure strains the yield: past the threshold the readout falls
    // with every point of unrest (game/influence.ts).
    taxYield: ((def.yieldBase * control) / 100) * taxStrain(unrest),
    influenceIncome: control * 0.0198,
    blackMarket: -unrest * 0.01,
    garrison: control >= 55 ? 'SECURE' : control >= 35 ? 'STRAINED' : 'CRITICAL',
    forces: Math.round((def.forcesBase * control) / 100),
    assets: def.assets,
    defense: clamp(Math.round(control - unrest / 2 + 21), 0, 100),
  }
}
