// CONTRACT FILE. Procedural contract market: generated contracts rolled from
// sector state on the strategic clock. Rolls step an explicit rng cursor
// (mulberryStep) the same way worldStore's event rng does, and every rolled
// field lands in the serialized record, so a reload reproduces the same open
// contracts. contractMission derives the full playable MissionDef from a
// record alone; the mission pipeline (brief, team, sim, debrief) never
// distinguishes generated from authored work. Objective sequences pick a
// variant through sequenceVariant, hashed from the stored seed on a stream
// separate from the cosmetic rng, so re-derived missions keep their
// codename, weather, Opening hour, and map jitter.
import { mulberry32, mulberryStep } from './rng'
import { CITIES_BY_SECTOR, CORPS, HOLDERS, PLATE_H, PLATE_W, cityById } from './atlas'
import type { CorpId } from './atlas'
import type {
  DistrictArchetype,
  MissionDef,
  ObjectiveDef,
  SectorId,
  WaveSpec,
  Weather,
  WeatherFront,
} from './types'
import { rollOpeningHour, rollWeatherFront, weatherNote } from './missionParams'

/* -------------------------------- constants ------------------------------- */

// The market keeps at most this many generated contracts open at once.
export const CONTRACT_TARGET = 3
// A new contract lands 2-6 world hours after the last check when below target.
export const CONTRACT_MIN_SEC = 2 * 3600
export const CONTRACT_SPAN_SEC = 4 * 3600
// A regular offer stands for 24-48 world hours; a priority offer for 8-16.
export const CONTRACT_EXPIRY_MIN_SEC = 24 * 3600
export const CONTRACT_EXPIRY_SPAN_SEC = 24 * 3600
export const PRIORITY_EXPIRY_MIN_SEC = 8 * 3600
export const PRIORITY_EXPIRY_SPAN_SEC = 8 * 3600
export const CONTRACT_REWARD_MIN = 30000
export const CONTRACT_REWARD_MAX = 95000
// A riot-linked suppression contract pays a premium for speed.
export const PRIORITY_REWARD_MUL = 1.4
export const INITIAL_CONTRACT_RNG = 0x67c04a1

/* ---------------------------------- types --------------------------------- */

export type ContractType = 'SEIZURE' | 'EXTRACTION' | 'SABOTAGE' | 'SUPPRESSION'
export type ContractThreat = MissionDef['threat']
export type GarrisonState = 'SECURE' | 'STRAINED' | 'CRITICAL'

// The serialized record. Everything a MissionDef needs is derivable from these
// fields, so the save carries the record and never the derived mission.
export interface GeneratedContract {
  id: string
  createdT: number
  expiresAtT: number
  sector: SectorId
  cityId: string
  district: number
  type: ContractType
  client: CorpId
  threat: ContractThreat
  reward: number
  seed: number
  priority: boolean
  // Set by the EXPEDITE influence spend: the intel gate is waived and the
  // offer stands 24 more world hours.
  expedited: boolean
}

export const CONTRACT_KEYS = [
  'id', 'createdT', 'expiresAtT', 'sector', 'cityId', 'district',
  'type', 'client', 'threat', 'reward', 'seed', 'priority', 'expedited',
] as const

// Sector snapshot the caller derives from live world state (worldStore's
// sectorReadout plus the atlas weight and city ownership), so this module
// stays pure and never reads a store.
export interface ContractSectorInput {
  sector: SectorId
  control: number
  unrest: number
  defense: number
  garrison: GarrisonState
  weight: number
  client: CorpId
  // Live city holders at the time of the roll. This is an input snapshot, not
  // part of the serialized contract record.
  ownership: Readonly<Record<string, CorpId>>
}

export interface RolledContract {
  contract: GeneratedContract
  state: number
}

/* ------------------------------- rng cursor -------------------------------- */

interface RngCursor {
  state: number
}

function next(rng: RngCursor): number {
  const [value, nextState] = mulberryStep(rng.state)
  rng.state = nextState
  return value
}

function pick<T>(items: readonly T[], rng: RngCursor): T {
  return items[Math.floor(next(rng) * items.length) % items.length]
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/* ------------------------------- derivations ------------------------------- */

// The corporation holding the most cities in the sector signs the contract.
// Ties break in HOLDERS order so the client stays deterministic.
export function sectorClient(sector: SectorId, owner: Record<string, CorpId>): CorpId {
  const cities = CITIES_BY_SECTOR[sector] ?? []
  const count: Partial<Record<CorpId, number>> = {}
  for (const c of cities) {
    const corp = owner[c.id] ?? c.corp
    count[corp] = (count[corp] ?? 0) + 1
  }
  let best: CorpId = HOLDERS[0]
  let bestN = 0
  for (const corp of HOLDERS) {
    const n = count[corp] ?? 0
    if (n > bestN) {
      best = corp
      bestN = n
    }
  }
  return best
}

// Threat comes from the sector's defense rating and garrison condition: a
// well-defended, secure sector posts routine work, a crumbling one hard work.
export function contractThreat(defense: number, garrison: GarrisonState): ContractThreat {
  if (garrison === 'CRITICAL' || defense < 40) return 'SEVERE'
  if (garrison === 'STRAINED' || defense < 62) return 'HIGH'
  return 'MODERATE'
}

export const CONTRACT_INTEL_REQ: Record<ContractThreat, number> = {
  MODERATE: 1,
  HIGH: 2,
  SEVERE: 3,
}

const CONTRACT_ETA_DAYS: Record<ContractThreat, number> = {
  MODERATE: 2,
  HIGH: 3,
  SEVERE: 4,
}

const THREAT_REWARD: Record<ContractThreat, number> = {
  MODERATE: 34000,
  HIGH: 52000,
  SEVERE: 70000,
}

// Reward scales with threat and the sector's global influence weight, jittered
// on a 500 CR grid inside the 30,000-95,000 band.
function rollReward(
  threat: ContractThreat,
  weight: number,
  priority: boolean,
  rng: RngCursor,
): number {
  const base = THREAT_REWARD[threat] * (0.75 + weight * 0.35) * (0.9 + next(rng) * 0.3)
  const raw = priority ? base * PRIORITY_REWARD_MUL : base
  return clamp(
    Math.round(raw / 500) * 500,
    CONTRACT_REWARD_MIN,
    CONTRACT_REWARD_MAX,
  )
}

// High unrest and low control both pull generated work toward a sector.
function pickSector(inputs: ContractSectorInput[], rng: RngCursor): ContractSectorInput {
  let total = 0
  const weights = inputs.map((input) => {
    const w = 1 + input.unrest / 16 + (100 - input.control) / 60
    total += w
    return w
  })
  let r = next(rng) * total
  for (let i = 0; i < inputs.length; i++) {
    r -= weights[i]
    if (r <= 0) return inputs[i]
  }
  return inputs[inputs.length - 1]
}

/* --------------------------------- rolling --------------------------------- */

const REGULAR_TYPES: ContractType[] = ['SEIZURE', 'EXTRACTION', 'SABOTAGE']

function citiesForClient(
  sector: SectorId,
  client: CorpId,
  ownership: Readonly<Record<string, CorpId>>,
): {
  client: CorpId
  cities: (typeof CITIES_BY_SECTOR)[string]
} {
  const cities = CITIES_BY_SECTOR[sector] ?? []
  if (client === 'nexus') return { client, cities }
  const outsideCities = cities.filter(
    (city) => (ownership[city.id] ?? city.corp) !== 'nexus',
  )
  // An all-Nexus sector can only issue internal work, even if a stale caller
  // supplies an outside client.
  return outsideCities.length > 0
    ? { client, cities: outsideCities }
    : { client: 'nexus', cities }
}

function finishContract(
  input: ContractSectorInput,
  t: number,
  priority: boolean,
  rng: RngCursor,
): RolledContract {
  const type: ContractType = priority ? 'SUPPRESSION' : pick(REGULAR_TYPES, rng)
  const { client, cities } = citiesForClient(input.sector, input.client, input.ownership)
  const city = pick(cities, rng)
  const district = 2 + Math.floor(next(rng) * 28)
  const threat = contractThreat(input.defense, input.garrison)
  const reward = rollReward(threat, input.weight, priority, rng)
  const seed = Math.floor(next(rng) * 0x100000000) >>> 0
  const life = priority
    ? PRIORITY_EXPIRY_MIN_SEC + next(rng) * PRIORITY_EXPIRY_SPAN_SEC
    : CONTRACT_EXPIRY_MIN_SEC + next(rng) * CONTRACT_EXPIRY_SPAN_SEC
  return {
    contract: {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: t,
      expiresAtT: t + Math.round(life),
      sector: input.sector,
      cityId: city.id,
      district,
      type,
      client,
      threat,
      reward,
      seed,
      priority,
      expedited: false,
    },
    state: rng.state,
  }
}

// One market contract from the cursor: picks the sector by unrest/control
// weight, then derives every parameter from that sector's snapshot.
export function rollContract(
  inputs: ContractSectorInput[],
  t: number,
  state: number,
): RolledContract {
  const rng: RngCursor = { state }
  const input = pickSector(inputs, rng)
  return finishContract(input, t, false, rng)
}

// The record an EXPEDITE spend targets: the lowest-intel-gate open generated
// contract in the sector that is not already expedited. Ties break toward the
// oldest offer, then by id, so the target is deterministic.
export function expediteTarget(
  contracts: GeneratedContract[],
  sector: SectorId,
): GeneratedContract | null {
  let best: GeneratedContract | null = null
  for (const c of contracts) {
    if (c.sector !== sector || c.expedited) continue
    if (
      best === null ||
      CONTRACT_INTEL_REQ[c.threat] < CONTRACT_INTEL_REQ[best.threat] ||
      (CONTRACT_INTEL_REQ[c.threat] === CONTRACT_INTEL_REQ[best.threat] &&
        (c.createdT < best.createdT ||
          (c.createdT === best.createdT && c.id < best.id)))
    ) {
      best = c
    }
  }
  return best
}

// A riot-linked suppression contract: sector fixed by the event, premium
// reward, short expiry.
export function rollSuppressionContract(
  input: ContractSectorInput,
  t: number,
  state: number,
): RolledContract {
  const rng: RngCursor = { state }
  return finishContract(input, t, true, rng)
}

// Re-client an open offer after ownership moves. Internal work may stay in any
// city; outside work keeps its city unless that city is now Nexus-held. An
// all-Nexus sector refuses an outside client. The market rng only advances
// when a replacement city actually has to be selected.
export function reclientContract(
  contract: GeneratedContract,
  client: CorpId,
  ownership: Readonly<Record<string, CorpId>>,
  state: number,
): RolledContract {
  const rng: RngCursor = { state }
  const { client: resolvedClient, cities } = citiesForClient(
    contract.sector,
    client,
    ownership,
  )
  const currentCity = cityById(contract.cityId)
  const currentHolder = ownership[currentCity.id] ?? currentCity.corp
  const cityId =
    resolvedClient !== 'nexus' && currentHolder === 'nexus'
      ? pick(cities, rng).id
      : contract.cityId
  if (contract.client === resolvedClient && contract.cityId === cityId) {
    return { contract, state: rng.state }
  }
  return {
    contract: { ...contract, client: resolvedClient, cityId },
    state: rng.state,
  }
}

/* ----------------------------- mission derivation -------------------------- */

// Word pools chosen so no pair reproduces an authored codename.
const CODENAME_A = [
  'IRON', 'SILENT', 'CRIMSON', 'BROKEN', 'NEON', 'PALE',
  'COLD', 'FERAL', 'GILDED', 'LOW', 'VIOLET', 'ASHEN',
]
const CODENAME_B = [
  'LANTERN', 'CURTAIN', 'HARBOR', 'SIGNAL', 'GARDEN', 'ANTHEM',
  'LEDGER', 'MERIDIAN', 'CIRCUIT', 'VESPER', 'ACCORD', 'STATION',
]

const CONTRACT_ARCHETYPE: Record<ContractType, DistrictArchetype> = {
  SEIZURE: 'checkpoint',
  SUPPRESSION: 'checkpoint',
  EXTRACTION: 'compound',
  SABOTAGE: 'industrial',
}

const WEATHERS: Weather[] = ['heavy', 'light', 'none']

const DENSITY_NOTE: Record<DistrictArchetype, string> = {
  checkpoint: 'CIVILIAN DENSITY MODERATE. COLLATERAL TOLERANCE LOW.',
  compound: 'CIVILIAN DENSITY LOW. COLLATERAL TOLERANCE MODERATE.',
  industrial: 'CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.',
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Independent of the cosmetic stream (0x9e3779b9). Changing this mix would
// reshuffle existing saves' sequences, not their weather or map jitter.
const SEQUENCE_MIX = 0x51ed5e91
const SEQUENCE_COUNT = 3

export function sequenceVariant(seed: number, count = SEQUENCE_COUNT): number {
  return Math.floor(mulberry32((seed ^ SEQUENCE_MIX) >>> 0)() * count) % count
}

function briefingFor(c: GeneratedContract, city: string, district: string): string[] {
  const v = sequenceVariant(c.seed)
  const nexus = c.client === 'nexus'
  const client = nexus ? 'The board' : CORPS[c.client].name
  switch (c.type) {
    case 'SEIZURE':
      return [
        `CorpSec has sealed ${district} of ${city} behind a checkpoint on the main avenue.`,
        nexus
          ? 'The board orders the district opened before the next transfer window.'
          : `${client} wants the district opened before the next transfer window.`,
        'Insert on the south perimeter and push north to the gate.',
        v === 1
          ? 'Override the plaza locks. The garrison does not have to die.'
          : v === 2
            ? 'The checkpoint garrison holds the plaza. Three minutes. Expect armed response.'
            : 'The checkpoint garrison holds the plaza. Expect armed response.',
      ]
    case 'SUPPRESSION':
      return [
        `Riots have overrun ${district} of ${city} and the local garrison lost the streets.`,
        nexus
          ? 'The board authorizes a premium response to restore order before the exchanges open.'
          : `${client} is paying a premium to restore order before the exchanges open.`,
        v === 1
          ? 'Insert on the south perimeter and take the checkpoint plaza.'
          : 'Insert on the south perimeter and break the armed cordon at the checkpoint.',
        v === 1
          ? 'Seize the plaza control. Not every street patrol has to die.'
          : v === 2
            ? 'The cordon reads as CorpSec garrison on the grid. Three minutes. Expect hard contact.'
            : 'The cordon reads as CorpSec garrison on the grid. Expect hard contact.',
      ]
    case 'EXTRACTION':
      return [
        `A defecting specialist sits in a CorpSec detention compound in ${district}.`,
        nexus
          ? 'The board orders the asset moved before CorpSec transfers the block.'
          : `${client} means to move the asset before CorpSec transfers the block.`,
        'Breach the compound, override the cell block locks, and walk the asset out.',
        v === 1
          ? nexus
            ? 'The asset must arrive alive. Ninety seconds on the escort. Keep them clear of the crossfire.'
            : `${client} pays nothing for a body. Ninety seconds on the escort.`
          : v === 2
            ? 'The detention server starts a ninety-second wipe when the gate falls. Optional, extra fee.'
            : nexus
              ? 'The asset must arrive alive. Keep them clear of the crossfire.'
              : `${client} pays nothing for a body. Keep the asset clear of the crossfire.`,
      ]
    case 'SABOTAGE':
      return [
        nexus
          ? `The board has flagged a relay yard feeding the ${city} security grid.`
          : `${client} has flagged a relay yard feeding the ${city} security grid.`,
        `Three fuel relays sit behind the yard fence in ${district}.`,
        v === 1
          ? 'Drop the relays, then hold the yard while the burn takes the grid down.'
          : 'Drop the relays and withdraw before CorpSec closes the gates.',
        v === 1
          ? 'CorpSec will push a response wave through the gates. Withdraw once the burn holds.'
          : v === 2
            ? 'A backup transformer in the far yard is optional extra fee. The yard guard can be bypassed.'
            : 'The yard guard can be bypassed on the way in.',
      ]
  }
}

function notesFor(
  c: GeneratedContract,
  weather: Weather,
  front: WeatherFront | undefined,
  openingHour: number,
): string[] {
  const notes = [
    weatherNote(weather, front, openingHour),
    DENSITY_NOTE[CONTRACT_ARCHETYPE[c.type]],
    c.priority
      ? 'PRIORITY CONTRACT // PREMIUM FEE. OFFER EXPIRES EARLY.'
      : 'GENERATED CONTRACT // OFFER EXPIRES IF UNACCEPTED.',
  ]
  if (c.expedited) notes.push('EXPEDITED CONTRACT // INTEL GATE WAIVED.')
  return notes
}

// Copied from authored Rust Haven; generated sabotage variant 1 holds the
// same burn shape. Authored missions stay in data.ts.
const RELAY_BURN_WAVE: WaveSpec = {
  count: 5,
  weapons: ['smg', 'assault', 'smg', 'smg', 'assault'],
  entry: ['waveEntry-a', 'waveEntry-b'],
}

function objectivesFor(c: GeneratedContract): ObjectiveDef[] {
  const id = c.id
  const v = sequenceVariant(c.seed)
  switch (c.type) {
    case 'SEIZURE':
    case 'SUPPRESSION': {
      const kill: ObjectiveDef =
        c.type === 'SUPPRESSION'
          ? { id: id + '-o2', label: 'PUT DOWN THE ARMED CORDON', kind: 'eliminate-tag', tag: 'garrison' }
          : { id: id + '-o2', label: 'ELIMINATE THE CORPSEC GARRISON', kind: 'eliminate-tag', tag: 'garrison' }
      if (v === 2) kill.failSec = 180
      const mid: ObjectiveDef =
        v === 1
          ? {
              id: id + '-o2',
              label: c.type === 'SUPPRESSION' ? 'SEIZE THE PLAZA CONTROL' : 'OVERRIDE THE CHECKPOINT LOCKS',
              kind: 'interact',
              landmark: 'target',
              durationSec: 4,
            }
          : kill
      return [
        { id: id + '-o1', label: 'REACH THE CHECKPOINT GATE', kind: 'reach-zone' },
        mid,
        { id: id + '-o3', label: 'EXTRACT THE SQUAD', kind: 'extract' },
      ]
    }
    case 'EXTRACTION': {
      const objectives: ObjectiveDef[] = [
        { id: id + '-o1', label: 'REACH THE COMPOUND GATE', kind: 'reach-zone', landmark: 'gate' },
      ]
      if (v === 2) {
        objectives.push({
          id: id + '-opt',
          label: 'PULL THE DETENTION SERVER',
          kind: 'interact',
          landmark: 'server',
          durationSec: 4,
          optional: true,
          bonusReward: 9000,
          failSec: 90,
        })
      }
      const escort: ObjectiveDef = {
        id: id + '-o3',
        label: 'EXTRACT THE ASSET',
        kind: 'escort',
        landmark: 'extraction',
      }
      if (v === 1) escort.failSec = 90
      objectives.push(
        { id: id + '-o2', label: 'OVERRIDE THE CELL BLOCK LOCKS', kind: 'interact', landmark: 'console', durationSec: 5 },
        escort,
        { id: id + '-o4', label: 'EXTRACT THE SQUAD', kind: 'extract' },
      )
      return objectives
    }
    case 'SABOTAGE': {
      const objectives: ObjectiveDef[] = [
        { id: id + '-o1', label: 'REACH THE RELAY YARD', kind: 'reach-zone', landmark: 'yard-a' },
      ]
      if (v === 2) {
        objectives.push({
          id: id + '-opt',
          label: 'DROP THE BACKUP TRANSFORMER',
          kind: 'destroy',
          tag: 'transformer',
          optional: true,
          bonusReward: 6000,
        })
      }
      objectives.push({ id: id + '-o2', label: 'DESTROY THE THREE FUEL RELAYS', kind: 'destroy', tag: 'relay' })
      if (v === 1) {
        objectives.push({
          id: id + '-o3',
          label: 'HOLD THE YARD FOR THE BURN',
          kind: 'defend',
          landmark: 'target',
          durationSec: 45,
          wave: RELAY_BURN_WAVE,
        })
        objectives.push({ id: id + '-o4', label: 'EXTRACT THE SQUAD', kind: 'extract' })
      } else {
        objectives.push({ id: id + '-o3', label: 'EXTRACT THE SQUAD', kind: 'extract' })
      }
      return objectives
    }
  }
}

// Derived missions are cached per record so read sites keep a stable object
// identity (the brief memoizes its recon and tactical builds on it), plus a
// by-id map for read sites that outlive the record: the debrief renders after
// applyMissionResult removed the fulfilled contract from the store.
const missionCache = new WeakMap<GeneratedContract, MissionDef>()
const missionByContractId = new Map<string, MissionDef>()

export function contractMission(contract: GeneratedContract): MissionDef {
  const cached = missionCache.get(contract)
  if (cached) return cached
  // Cosmetic derivations (codename, weather, marker jitter) come from a
  // dedicated stream off the stored seed, so they are pure record functions.
  const rng = mulberry32((contract.seed ^ 0x9e3779b9) >>> 0)
  const codename =
    CODENAME_A[Math.floor(rng() * CODENAME_A.length) % CODENAME_A.length] +
    ' ' +
    CODENAME_B[Math.floor(rng() * CODENAME_B.length) % CODENAME_B.length]
  const weather = WEATHERS[Math.floor(rng() * WEATHERS.length) % WEATHERS.length]
  const weatherFront = rollWeatherFront(rng, weather)
  const city = cityById(contract.cityId)
  const mapPos = {
    x: clamp((city.x / PLATE_W) * 100 + (rng() - 0.5) * 6, 3, 97),
    y: clamp((city.y / PLATE_H) * 100 + (rng() - 0.5) * 6, 6, 94),
  }
  // After the existing cosmetic stream so weather, codename, and map jitter
  // stay put for seeds already in a campaign.
  const openingHour = rollOpeningHour(rng)
  const archetype = CONTRACT_ARCHETYPE[contract.type]
  const district = 'DISTRICT ' + pad2(contract.district)
  const def: MissionDef = {
    id: contract.id,
    codename,
    city: city.name,
    district,
    sector: contract.sector,
    type: contract.type,
    client: contract.client === 'nexus' ? 'INTERNAL' : CORPS[contract.client].name,
    threat: contract.threat,
    reward: contract.reward,
    etaDays: CONTRACT_ETA_DAYS[contract.threat],
    weather,
    weatherFront,
    openingHour,
    variants: [
      { archetype, seed: contract.seed },
      { archetype, seed: (contract.seed + 1) >>> 0 },
    ],
    seed: contract.seed,
    briefing: briefingFor(contract, city.name, district),
    notes: notesFor(contract, weather, weatherFront, openingHour),
    objectives: objectivesFor(contract),
    intelReq: contract.expedited ? 1 : CONTRACT_INTEL_REQ[contract.threat],
    mapPos,
  }
  missionCache.set(contract, def)
  missionByContractId.set(contract.id, def)
  return def
}

export function contractMissionById(id: string): MissionDef | undefined {
  return missionByContractId.get(id)
}

export function isGeneratedMissionId(id: string): boolean {
  return id.startsWith('gc')
}
