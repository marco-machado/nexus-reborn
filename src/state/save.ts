// Versioned campaign persistence. Tactical mission state is intentionally not
// serializable: autosave only commits stable strategy/debrief transitions.
import { CITIES, HOLDERS, SECTORS } from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { BRANCH_IDS, NODES } from '../game/research'
import { DEFAULT_SQUAD, MISSIONS, ROSTER } from '../game/data'
import { LOADOUT_SLOTS } from '../game/mass'
import type { SquadLoadout } from '../game/mass'
import type { SectorId } from '../game/types'
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
const SAVE_VERSION = 2 as const
const AUTOSAVE_DELAY = 500
const INITIAL_NEXT_EVENT_T = 900 + 1800 * 0.4

const INITIAL_EVENTS: WorldEvent[] = useWorldStore
  .getState()
  .events.map((event) => ({ ...event }))

export interface SaveV2 {
  version: 2
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
    roster: Record<string, CampaignRosterEntry>
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
const ROSTER_IDS = new Set(ROSTER.map((operative) => operative.id))
const RESEARCH_IDS = new Set(NODES.map((node) => node.id))
const SECTOR_IDS = new Set<string>(SECTORS.map((sector) => sector.id))
const CITY_IDS = new Set(CITIES.map((city) => city.id))
const EVENT_KINDS = new Set<EventKind>(['riot', 'seizure', 'trade', 'raid', 'blackout'])
const EVENT_TONES = new Set<EventTone>(['red', 'green', 'amber', 'dim'])

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

function validLoadout(value: unknown): value is SquadLoadout {
  if (!isObject(value)) return false
  return Object.entries(value).every(
    ([id, items]) =>
      ROSTER_IDS.has(id) &&
      Array.isArray(items) &&
      items.length === LOADOUT_SLOTS &&
      items.every((item) => item === null || item === 'med' || item === 'cell'),
  )
}

function validRoster(value: unknown): value is Record<string, CampaignRosterEntry> {
  if (!isObject(value) || !hasExactKeys(value, [...ROSTER_IDS])) return false
  return Object.values(value).every((entry) => {
    if (!isObject(entry) || (entry.status !== 'READY' && entry.status !== 'INJURED')) return false
    if (entry.recoverAtT !== null && !finite(entry.recoverAtT)) return false
    return entry.status === 'READY' ? entry.recoverAtT === null : entry.recoverAtT !== null
  })
}

export function validateSave(value: unknown): value is SaveV2 {
  if (!isObject(value) || value.version !== SAVE_VERSION) return false
  const app = value.app
  const world = value.world
  const research = value.research
  const campaign = value.campaign
  if (!isObject(app) || !isObject(world) || !isObject(research) || !isObject(campaign)) {
    return false
  }

  if (
    !finite(app.credits) ||
    app.credits < 0 ||
    !validIdList(app.squad, ROSTER_IDS, 4) ||
    !validLoadout(app.loadout) ||
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
    !validRoster(campaign.roster) ||
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

export function captureSave(): SaveV2 {
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
      roster: structuredClone(campaign.roster),
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

// A v1 blob is a v2 blob without app.loadout. Upgrading before validation
// keeps old campaigns loading instead of discarding them on the version check.
function upgraded(value: unknown): unknown {
  if (
    isObject(value) &&
    value.version === 1 &&
    isObject(value.app) &&
    !('loadout' in value.app)
  ) {
    return { ...value, version: SAVE_VERSION, app: { ...value.app, loadout: {} } }
  }
  return value
}

export function readSave(storage: SaveStorage | null = browserStorage()): SaveV2 | null {
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

export function hydrateSave(save: SaveV2): void {
  useCampaignStore.setState({
    intelLevel: save.campaign.intelLevel,
    intelProgress: save.campaign.intelProgress,
    roster: structuredClone(save.campaign.roster),
    contractsWon: [...save.campaign.contractsWon],
    outcomeApplied: 0,
    campaignWon: save.campaign.campaignWon,
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
