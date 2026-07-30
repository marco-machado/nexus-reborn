// Versioned campaign persistence. Tactical mission state is intentionally not
// serializable: autosave only commits stable strategy/debrief transitions.
import { CITIES, HOLDERS, SECTORS } from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { BRANCH_IDS, NODES } from '../game/research'
import { DEFAULT_SQUAD, MISSIONS, WEAPONS } from '../game/data'
import { LOADOUT_SLOTS } from '../game/mass'
import type { SquadLoadout } from '../game/mass'
import {
  CANDIDATE_POOL,
  CANDIDATE_REFRESH_SEC,
  HIRE_MAX_COST,
  HIRE_MIN_COST,
  ROSTER_CAP,
} from '../game/recruits'
import type { Candidate } from '../game/recruits'
import type { AgentRole, OperativeDef, SectorId } from '../game/types'
import { INITIAL_CREDITS, useAppStore } from './appStore'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import type { CampaignRosterEntry } from './campaignStore'
import { useResearchStore } from './researchStore'
import type { Labs } from './researchStore'
import {
  INITIAL_WORLD_RNG,
  SPEEDS,
  initialOwner,
  initialSectors,
  useWorldStore,
} from './worldStore'
import type { EventKind, EventTone, SectorState, WorldEvent } from './worldStore'

// The storage key never moves; the version field inside the blob is what is
// bumped, so old campaigns upgrade in place instead of being orphaned.
export const SAVE_KEY = 'nexus-save-v1'
const SAVE_VERSION = 3 as const
const AUTOSAVE_DELAY = 500
const INITIAL_NEXT_EVENT_T = 900 + 1800 * 0.4

const INITIAL_EVENTS: WorldEvent[] = useWorldStore
  .getState()
  .events.map((event) => ({ ...event }))

export interface SaveV3 {
  version: 3
  app: {
    credits: number
    squad: string[]
    loadout: SquadLoadout
  }
  world: {
    t: number
    speed: number
    paused: boolean
    sectors: Record<string, SectorState>
    owner: Record<string, CorpId>
    events: WorldEvent[]
    unread: number
    nextEventT: number
    rngState: number
  }
  research: {
    done: string[]
    labs: Labs
  }
  campaign: {
    intelLevel: number
    intelProgress: number
    operatives: OperativeDef[]
    roster: Record<string, CampaignRosterEntry>
    candidates: Candidate[]
    recruitRngState: number
    nextCandidateT: number
    contractsWon: string[]
    campaignWon: boolean
  }
}

export interface SaveStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function browserStorage(): SaveStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function integer(value: unknown): value is number {
  return finite(value) && Number.isInteger(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value)
  return actual.length === keys.length && keys.every((key) => key in value)
}

const MISSION_IDS = new Set(MISSIONS.map((mission) => mission.id))
const RESEARCH_IDS = new Set(NODES.map((node) => node.id))
const SECTOR_IDS = new Set<string>(SECTORS.map((sector) => sector.id))
const CITY_IDS = new Set(CITIES.map((city) => city.id))
const EVENT_KINDS = new Set<EventKind>(['riot', 'seizure', 'trade', 'raid', 'blackout', 'kia'])
const EVENT_TONES = new Set<EventTone>(['red', 'green', 'amber', 'dim'])
const WEAPON_IDS = new Set(Object.keys(WEAPONS))
const ROLES = new Set<AgentRole>([
  'assault', 'recon', 'infiltrator', 'demolitions', 'sniper', 'tech', 'support', 'medic',
])
const OPERATIVE_KEYS = [
  'id', 'name', 'codename', 'role', 'maxHp', 'speed',
  'weapon', 'sidearm', 'accent', 'status', 'bio',
] as const
const CANDIDATE_KEYS = [...OPERATIVE_KEYS, 'cost'] as const

function validIdList(value: unknown, allowed: Set<string>, max = allowed.size): value is string[] {
  if (!Array.isArray(value) || value.length > max) return false
  if (!value.every((id) => typeof id === 'string' && allowed.has(id))) return false
  return new Set(value).size === value.length
}

function validSectors(value: unknown): value is Record<string, SectorState> {
  if (!isObject(value) || !hasExactKeys(value, [...SECTOR_IDS])) return false
  return Object.values(value).every(
    (state) =>
      isObject(state) &&
      finite(state.control) &&
      state.control >= 0 &&
      state.control <= 96 &&
      finite(state.unrest) &&
      state.unrest >= 0 &&
      state.unrest <= 74,
  )
}

function validOwner(value: unknown): value is Record<string, CorpId> {
  if (!isObject(value) || !hasExactKeys(value, [...CITY_IDS])) return false
  return Object.values(value).every(
    (corp) => typeof corp === 'string' && (HOLDERS as readonly string[]).includes(corp),
  )
}

function validEvent(value: unknown): value is WorldEvent {
  if (!isObject(value)) return false
  return (
    integer(value.id) &&
    finite(value.t) &&
    typeof value.sector === 'string' &&
    SECTOR_IDS.has(value.sector) &&
    typeof value.kind === 'string' &&
    EVENT_KINDS.has(value.kind as EventKind) &&
    typeof value.tone === 'string' &&
    EVENT_TONES.has(value.tone as EventTone) &&
    typeof value.text === 'string' &&
    value.text.length > 0
  )
}

function validLabs(value: unknown): value is Labs {
  if (!isObject(value) || !hasExactKeys(value, BRANCH_IDS)) return false
  for (const branch of BRANCH_IDS) {
    const run = value[branch]
    if (run === null) continue
    if (
      !isObject(run) ||
      typeof run.id !== 'string' ||
      !RESEARCH_IDS.has(run.id) ||
      !finite(run.startedT) ||
      !finite(run.endT) ||
      run.endT < run.startedT
    ) {
      return false
    }
    if (NODES.find((node) => node.id === run.id)?.branch !== branch) return false
  }
  return true
}

function validLoadout(value: unknown, rosterIds: Set<string>): value is SquadLoadout {
  if (!isObject(value)) return false
  return Object.entries(value).every(
    ([id, items]) =>
      rosterIds.has(id) &&
      Array.isArray(items) &&
      items.length === LOADOUT_SLOTS &&
      items.every((item) => item === null || item === 'med' || item === 'cell'),
  )
}

function validOperativeCore(value: Record<string, unknown>): boolean {
  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    typeof value.codename === 'string' &&
    value.codename.length > 0 &&
    typeof value.role === 'string' &&
    ROLES.has(value.role as AgentRole) &&
    finite(value.maxHp) &&
    value.maxHp > 0 &&
    finite(value.speed) &&
    value.speed > 0 &&
    typeof value.weapon === 'string' &&
    WEAPON_IDS.has(value.weapon) &&
    typeof value.sidearm === 'string' &&
    WEAPON_IDS.has(value.sidearm) &&
    typeof value.accent === 'string' &&
    value.accent.length > 0 &&
    (value.status === 'READY' || value.status === 'INJURED' || value.status === 'ON MISSION') &&
    typeof value.bio === 'string'
  )
}

// A fully wiped campaign is a legal save: the market can rebuild the roster.
function validOperatives(value: unknown): value is OperativeDef[] {
  if (!Array.isArray(value) || value.length > ROSTER_CAP) return false
  if (
    !value.every(
      (op) => isObject(op) && hasExactKeys(op, OPERATIVE_KEYS) && validOperativeCore(op),
    )
  ) {
    return false
  }
  return new Set(value.map((op) => (op as OperativeDef).id)).size === value.length
}

function validCandidates(value: unknown, rosterIds: Set<string>): value is Candidate[] {
  if (!Array.isArray(value) || value.length > CANDIDATE_POOL) return false
  if (
    !value.every(
      (c) =>
        isObject(c) &&
        hasExactKeys(c, CANDIDATE_KEYS) &&
        validOperativeCore(c) &&
        finite(c.cost) &&
        c.cost >= HIRE_MIN_COST &&
        c.cost <= HIRE_MAX_COST,
    )
  ) {
    return false
  }
  const ids = value.map((c) => (c as Candidate).id)
  return new Set(ids).size === ids.length && ids.every((id) => !rosterIds.has(id))
}

function validRoster(
  value: unknown,
  rosterIds: Set<string>,
): value is Record<string, CampaignRosterEntry> {
  if (!isObject(value) || !hasExactKeys(value, [...rosterIds])) return false
  return Object.values(value).every((entry) => {
    if (!isObject(entry) || (entry.status !== 'READY' && entry.status !== 'INJURED')) return false
    if (entry.recoverAtT !== null && !finite(entry.recoverAtT)) return false
    return entry.status === 'READY' ? entry.recoverAtT === null : entry.recoverAtT !== null
  })
}

export function validateSave(value: unknown): value is SaveV3 {
  if (!isObject(value) || value.version !== SAVE_VERSION) return false
  const app = value.app
  const world = value.world
  const research = value.research
  const campaign = value.campaign
  if (!isObject(app) || !isObject(world) || !isObject(research) || !isObject(campaign)) {
    return false
  }

  // The live roster carries hires, so every roster-keyed check below runs
  // against the ids the blob itself declares, not static data.
  const operatives = campaign.operatives
  if (!validOperatives(operatives)) return false
  const rosterIds = new Set(operatives.map((operative) => operative.id))

  if (
    !finite(app.credits) ||
    app.credits < 0 ||
    !validIdList(app.squad, rosterIds, 4) ||
    !validLoadout(app.loadout, rosterIds) ||
    !finite(world.t) ||
    world.t < 0 ||
    !finite(world.speed) ||
    !SPEEDS.includes(world.speed) ||
    typeof world.paused !== 'boolean' ||
    !validSectors(world.sectors) ||
    !validOwner(world.owner) ||
    !Array.isArray(world.events) ||
    world.events.length === 0 ||
    world.events.length > 40 ||
    !world.events.every(validEvent) ||
    !integer(world.unread) ||
    world.unread < 0 ||
    !finite(world.nextEventT) ||
    !integer(world.rngState) ||
    world.rngState < 0 ||
    world.rngState > 0xffffffff ||
    !validIdList(research.done, RESEARCH_IDS) ||
    !validLabs(research.labs) ||
    !integer(campaign.intelLevel) ||
    campaign.intelLevel < 1 ||
    !integer(campaign.intelProgress) ||
    campaign.intelProgress < 0 ||
    campaign.intelProgress >= 100 ||
    !validRoster(campaign.roster, rosterIds) ||
    !validCandidates(campaign.candidates, rosterIds) ||
    !integer(campaign.recruitRngState) ||
    campaign.recruitRngState < 0 ||
    campaign.recruitRngState > 0xffffffff ||
    !finite(campaign.nextCandidateT) ||
    !validIdList(campaign.contractsWon, MISSION_IDS) ||
    typeof campaign.campaignWon !== 'boolean'
  ) {
    return false
  }

  const contractsWon = campaign.contractsWon as string[]
  const roster = campaign.roster as Record<string, CampaignRosterEntry>
  const expectedWin = MISSIONS.every((mission) => contractsWon.includes(mission.id))
  if (campaign.campaignWon !== expectedWin) return false
  return (app.squad as string[]).every((id) => roster[id].status === 'READY')
}

export function captureSave(): SaveV3 {
  const app = useAppStore.getState()
  const world = useWorldStore.getState()
  const research = useResearchStore.getState()
  const campaign = useCampaignStore.getState()
  return {
    version: SAVE_VERSION,
    app: {
      credits: app.credits,
      squad: [...app.squad],
      loadout: structuredClone(app.loadout),
    },
    world: {
      t: world.t,
      speed: world.speed,
      paused: world.paused,
      sectors: structuredClone(world.sectors),
      owner: { ...world.owner },
      events: world.events.map((event) => ({ ...event })),
      unread: world.unread,
      nextEventT: world.nextEventT,
      rngState: world.rngState,
    },
    research: {
      done: [...research.done],
      labs: structuredClone(research.labs),
    },
    campaign: {
      intelLevel: campaign.intelLevel,
      intelProgress: campaign.intelProgress,
      operatives: structuredClone(campaign.operatives),
      roster: structuredClone(campaign.roster),
      candidates: structuredClone(campaign.candidates),
      recruitRngState: campaign.recruitRngState,
      nextCandidateT: campaign.nextCandidateT,
      contractsWon: [...campaign.contractsWon],
      campaignWon: campaign.campaignWon,
    },
  }
}

export function writeSave(storage: SaveStorage | null = browserStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(captureSave()))
    return true
  } catch {
    return false
  }
}

// Version chain, applied before validation so old campaigns upgrade in place
// instead of being discarded on the version check. A v1 blob is a v2 blob
// without app.loadout; a v2 blob is a v3 blob without the live roster, which
// v2 kept as static data: the upgrade seeds the default roster, the initial
// candidate pool, and a first market refresh one interval after the saved
// world time.
function upgraded(value: unknown): unknown {
  let v = value
  if (isObject(v) && v.version === 1 && isObject(v.app) && !('loadout' in v.app)) {
    v = { ...v, version: 2, app: { ...v.app, loadout: {} } }
  }
  if (
    isObject(v) &&
    v.version === 2 &&
    isObject(v.campaign) &&
    !('operatives' in v.campaign)
  ) {
    const seeded = initialCampaignData()
    const worldT = isObject(v.world) && finite(v.world.t) ? v.world.t : 0
    v = {
      ...v,
      version: 3,
      campaign: {
        ...v.campaign,
        operatives: seeded.operatives,
        candidates: seeded.candidates,
        recruitRngState: seeded.recruitRngState,
        nextCandidateT: worldT + CANDIDATE_REFRESH_SEC,
      },
    }
  }
  return v
}

export function readSave(storage: SaveStorage | null = browserStorage()): SaveV3 | null {
  if (!storage) return null
  let raw: string | null = null
  try {
    raw = storage.getItem(SAVE_KEY)
    if (!raw) return null
    const value: unknown = upgraded(JSON.parse(raw))
    if (validateSave(value)) return value
  } catch {
    // Invalid or unavailable storage is treated as no campaign.
  }
  try {
    storage.removeItem(SAVE_KEY)
  } catch {
    // A read-only storage surface still must not block boot.
  }
  return null
}

export function hydrateSave(save: SaveV3): void {
  useCampaignStore.setState({
    intelLevel: save.campaign.intelLevel,
    intelProgress: save.campaign.intelProgress,
    operatives: structuredClone(save.campaign.operatives),
    roster: structuredClone(save.campaign.roster),
    candidates: structuredClone(save.campaign.candidates),
    recruitRngState: save.campaign.recruitRngState,
    nextCandidateT: save.campaign.nextCandidateT,
    contractsWon: [...save.campaign.contractsWon],
    outcomeApplied: 0,
    campaignWon: save.campaign.campaignWon,
    lastReport: null,
  })
  useWorldStore.setState({
    ...structuredClone(save.world),
    selected: 'eu' as SectorId,
    review: null,
  })
  useResearchStore.setState({
    done: [...save.research.done],
    labs: structuredClone(save.research.labs),
  })
  useAppStore.setState({
    phase: 'menu',
    missionId: null,
    squad: [...save.app.squad],
    loadout: structuredClone(save.app.loadout),
    credits: save.app.credits,
    outcome: null,
    outcomeSerial: 0,
  })
  useResearchStore.getState().sync(save.world.t)
  useCampaignStore.getState().sync(save.world.t)
}

export function hasValidSave(storage: SaveStorage | null = browserStorage()): boolean {
  return readSave(storage) !== null
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null
let unsubscribeAutosave: (() => void) | null = null
let autosaveStorage: SaveStorage | null = null

function cancelPendingAutosave(): void {
  if (autosaveTimer !== null) clearTimeout(autosaveTimer)
  autosaveTimer = null
}

function scheduleAutosave(): void {
  const phase = useAppStore.getState().phase
  if (phase === 'mission' || phase === 'debrief') return
  // The world clock writes at 20Hz. Keep the first pending flush so continuous
  // ticking still persists the latest snapshot every half second.
  if (autosaveTimer !== null) return
  autosaveTimer = setTimeout(() => {
    autosaveTimer = null
    const currentPhase = useAppStore.getState().phase
    if (currentPhase === 'mission' || currentPhase === 'debrief') return
    writeSave(autosaveStorage)
  }, AUTOSAVE_DELAY)
}

export function startAutosave(
  storage: SaveStorage | null = browserStorage(),
): () => void {
  if (unsubscribeAutosave) return unsubscribeAutosave
  autosaveStorage = storage
  const unsubscribers = [
    useAppStore.subscribe(scheduleAutosave),
    useWorldStore.subscribe(scheduleAutosave),
    useResearchStore.subscribe(scheduleAutosave),
    useCampaignStore.subscribe(scheduleAutosave),
  ]
  unsubscribeAutosave = () => {
    cancelPendingAutosave()
    for (const unsubscribe of unsubscribers) unsubscribe()
    unsubscribeAutosave = null
    autosaveStorage = null
  }
  return unsubscribeAutosave
}

let initialized = false
let loadedAtBoot = false

export function initializeSaveSystem(): boolean {
  if (initialized) return loadedAtBoot
  const save = readSave()
  if (save) hydrateSave(save)
  startAutosave()
  initialized = true
  loadedAtBoot = save !== null
  return loadedAtBoot
}

export function startNewOperation(storage: SaveStorage | null = browserStorage()): void {
  cancelPendingAutosave()
  try {
    storage?.removeItem(SAVE_KEY)
  } catch {
    // Resetting in memory is still useful when storage cannot be changed.
  }

  const campaign = initialCampaignData()
  useCampaignStore.setState(campaign)
  useWorldStore.setState({
    t: 0,
    speed: 2,
    paused: false,
    sectors: initialSectors(),
    owner: initialOwner(),
    events: INITIAL_EVENTS.map((event) => ({ ...event })),
    unread: INITIAL_EVENTS.length,
    selected: 'eu',
    review: null,
    nextEventT: INITIAL_NEXT_EVENT_T,
    rngState: INITIAL_WORLD_RNG,
  })
  useResearchStore.setState({
    done: [],
    labs: { ballistics: null, cybernetics: null, control: null },
  })
  useAppStore.setState({
    phase: 'world',
    missionId: null,
    squad: [...DEFAULT_SQUAD],
    loadout: {},
    credits: INITIAL_CREDITS,
    outcome: null,
    outcomeSerial: 0,
  })
}

export function continueOperation(): void {
  useAppStore.setState({ phase: 'world' })
}
