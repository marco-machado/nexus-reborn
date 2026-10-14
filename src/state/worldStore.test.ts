import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DAY,
  MAX_DT,
  TIME_SCALE,
  hhmm,
  initialOwner,
  resolveMission,
  sectorReadout,
  stamp,
  useWorldStore,
} from './worldStore'
import { CITIES, CITIES_BY_SECTOR, HOLDERS, OPEN_SECTORS, SECTORS, sectorCorp } from '../game/atlas'
import { INITIAL_CREDITS, useAppStore } from './appStore'
import {
  CONTRACT_EXPIRY_MIN_SEC,
  CONTRACT_INTEL_REQ,
  CONTRACT_MIN_SEC,
  CONTRACT_SPAN_SEC,
  CONTRACT_TARGET,
  PRIORITY_EXPIRY_MIN_SEC,
  PRIORITY_EXPIRY_SPAN_SEC,
  contractMission,
  generatedReward,
  sectorClient,
  visibleContracts,
} from '../game/contracts'
import type { ContractThreat, GeneratedContract } from '../game/contracts'
import {
  EXPEDITE_EXTENSION_SEC,
  INFLUENCE_ACTIONS,
  CONTROL_MAX,
  INFLUENCE_CLEAN_PTS,
  INFLUENCE_WIN_PTS,
  PRESSURE_CONTROL_DROP_MAX,
  PRESSURE_CONTROL_DROP_MIN,
  PRESSURE_INTERVAL_SEC,
  TAX_INTERVAL_SEC,
  UNREST_MAX,
  UNREST_MIN,
  cooldownKey,
  taxYieldCredits,
} from '../game/influence'
import { FORECAST_KINDS, kindWeights } from '../game/forecast'
import type { SectorId } from '../game/types'
import type { MissionOutcome } from './appStore'
import type { SectorState } from './worldStore'
import { applyDebrief } from './debrief'
import { useMissionStore } from './missionStore'
import { useResearchStore } from './researchStore'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { INTEL_LEVEL } from '../game/data'
import { mulberryStep } from '../game/rng'

const KINDS = ['riot', 'seizure', 'trade', 'raid', 'blackout']
// Event pacing constants mirrored from the source: next event lands between
// EVENT_MIN and EVENT_MIN + EVENT_SPAN world seconds after the last.
const EVENT_MIN = 900
const EVENT_SPAN = 1800

// Data snapshot captured at module load, before any test mutates the singleton.
// The module-level rng cannot be reset, so event tests assert structure and
// bounds, never exact rolled values.
const s0 = useWorldStore.getState()
const snapshot = structuredClone({
  t: s0.t,
  speed: s0.speed,
  paused: s0.paused,
  sectors: s0.sectors,
  owner: s0.owner,
  events: s0.events,
  unread: s0.unread,
  selected: s0.selected,
  review: s0.review,
  nextEventT: s0.nextEventT,
  rngState: s0.rngState,
  contracts: s0.contracts,
  contractRngState: s0.contractRngState,
  nextContractT: s0.nextContractT,
  influence: s0.influence,
  nextTaxT: s0.nextTaxT,
  spends: s0.spends,
  cooldowns: s0.cooldowns,
  crisis: s0.crisis,
  pressure: s0.pressure,
})

beforeEach(() => {
  useWorldStore.setState(structuredClone(snapshot))
  useAppStore.setState({ credits: INITIAL_CREDITS })
  // applyDebrief syncs the labs to the post-ETA clock; start each test idle.
  useResearchStore.setState({ done: [], labs: { ballistics: null, cybernetics: null, control: null } })
})

// Every field the timed flow moves, for jump-vs-continuous parity checks.
function flowSnapshot() {
  const s = useWorldStore.getState()
  return structuredClone({
    t: s.t,
    sectors: s.sectors,
    owner: s.owner,
    events: s.events,
    nextEventT: s.nextEventT,
    rngState: s.rngState,
    contracts: s.contracts,
    contractRngState: s.contractRngState,
    nextContractT: s.nextContractT,
    influence: s.influence,
    nextTaxT: s.nextTaxT,
    spends: s.spends,
    cooldowns: s.cooldowns,
    crisis: s.crisis,
    pressure: s.pressure,
  })
}

// Pins every timed flow except the one under test far off the clock.
function pinFlows(): void {
  useWorldStore.setState({
    nextEventT: 1e12,
    nextContractT: 1e12,
    nextTaxT: 1e12,
  })
}

// Crosses the strategic clock to `t` in one small tick.
function crossTo(t: number): void {
  useWorldStore.setState({ t: t - 1 })
  useWorldStore.getState().tick(0.01)
}

// Forces one event: pins t onto the pending event time, then ticks past it.
function forceEvent(): void {
  const s = useWorldStore.getState()
  useWorldStore.setState({ t: s.nextEventT })
  useWorldStore.getState().tick(0.001)
}

describe('initial state', () => {
  it('boots at t=0, speed 2x, unpaused, on the european sector', () => {
    expect(snapshot.t).toBe(0)
    expect(snapshot.speed).toBe(2)
    expect(snapshot.paused).toBe(false)
    expect(snapshot.selected).toBe('eu')
    expect(snapshot.review).toBeNull()
  })

  it('seeds three unread events and sector/city state from the atlas', () => {
    expect(snapshot.events).toHaveLength(3)
    expect(snapshot.unread).toBe(3)
    for (const s of SECTORS) {
      expect(snapshot.sectors[s.id]).toEqual({ control: s.control, unrest: s.unrest })
    }
    for (const c of CITIES) expect(snapshot.owner[c.id]).toBe(c.corp)
  })
})

describe('clock advance', () => {
  it('advances t by dt * speed * TIME_SCALE', () => {
    useWorldStore.getState().tick(0.1)
    expect(useWorldStore.getState().t).toBeCloseTo(0.1 * 2 * TIME_SCALE, 9)
  })

  it('one clamped frame at top speed advances MAX_DT * 8 * TIME_SCALE world seconds', () => {
    expect(MAX_DT).toBe(0.25)
    useWorldStore.getState().setSpeed(8)
    useWorldStore.getState().tick(MAX_DT)
    expect(useWorldStore.getState().t).toBeCloseTo(MAX_DT * 8 * TIME_SCALE, 9)
  })

  it('tick itself applies no clamp; the MAX_DT cap lives in the caller (ui/clock.ts)', () => {
    useWorldStore.getState().setSpeed(1)
    useWorldStore.getState().tick(10)
    expect(useWorldStore.getState().t).toBeCloseTo(10 * TIME_SCALE, 9)
  })

  it('a paused tick changes nothing', () => {
    useWorldStore.getState().togglePause()
    useWorldStore.getState().tick(1)
    const s = useWorldStore.getState()
    expect(s.paused).toBe(true)
    expect(s.t).toBe(0)
    expect(s.events).toHaveLength(3)
  })

  it('1 accepted real second at 1x, delivered in 20Hz batches, advances t by 60', () => {
    useWorldStore.getState().setSpeed(1)
    for (let i = 0; i < 20; i++) useWorldStore.getState().tick(0.05)
    expect(useWorldStore.getState().t).toBeCloseTo(60, 9)
  })

  it('a MAX_DT stall admission at 1x advances t by 15', () => {
    useWorldStore.getState().setSpeed(1)
    useWorldStore.getState().tick(MAX_DT)
    expect(useWorldStore.getState().t).toBeCloseTo(15, 9)
  })

  it('the store owns no timer: wall-clock advance with no caller (Menu, Mission, Debrief) leaves t unchanged', () => {
    vi.useFakeTimers()
    try {
      vi.advanceTimersByTime(60_000)
      expect(useWorldStore.getState().t).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('paused: repeated ticks across wall-clock time leave t unchanged', () => {
    useWorldStore.getState().togglePause()
    for (let i = 0; i < 20; i++) useWorldStore.getState().tick(0.05)
    expect(useWorldStore.getState().t).toBe(0)
  })

  it('setSpeed also unpauses', () => {
    useWorldStore.getState().togglePause()
    useWorldStore.getState().setSpeed(4)
    const s = useWorldStore.getState()
    expect(s.speed).toBe(4)
    expect(s.paused).toBe(false)
  })
})

describe('events feed', () => {
  it('replays the same event exactly when state and rngState are restored', () => {
    forceEvent()
    const firstState = useWorldStore.getState()
    const first = structuredClone({
      events: firstState.events,
      sectors: firstState.sectors,
      owner: firstState.owner,
      nextEventT: firstState.nextEventT,
      rngState: firstState.rngState,
      contracts: firstState.contracts,
      contractRngState: firstState.contractRngState,
    })
    useWorldStore.setState(structuredClone(snapshot))
    forceEvent()
    const second = useWorldStore.getState()
    expect(second.events[3]).toEqual(first.events[3])
    expect(second.sectors).toEqual(first.sectors)
    expect(second.owner).toEqual(first.owner)
    expect(second.nextEventT).toBe(first.nextEventT)
    expect(second.rngState).toBe(first.rngState)
    expect(second.contracts).toEqual(first.contracts)
    expect(second.contractRngState).toBe(first.contractRngState)
  })

  it('crossing nextEventT appends the rolled event and reschedules the next', () => {
    const before = useWorldStore.getState()
    const eventT = before.nextEventT
    useWorldStore.setState({ t: eventT - 1 })
    useWorldStore.getState().tick(0.2)
    const s = useWorldStore.getState()
    // A riot roll may append a linked contract line after the event itself.
    expect(s.events.length).toBeGreaterThanOrEqual(4)
    const ev = s.events[3]
    expect(ev.id).toBe(4)
    expect(ev.t).toBe(eventT)
    expect(OPEN_SECTORS).toContain(ev.sector)
    expect(KINDS).toContain(ev.kind)
    expect(ev.text.length).toBeGreaterThan(0)
    expect(s.unread).toBeGreaterThanOrEqual(4)
    expect(s.nextEventT).toBeGreaterThanOrEqual(eventT + EVENT_MIN)
    expect(s.nextEventT).toBeLessThan(eventT + EVENT_MIN + EVENT_SPAN)
  })

  it('the feed caps at 40 events and keeps the newest with consecutive ids', () => {
    for (let i = 0; i < 50; i++) forceEvent()
    const events = useWorldStore.getState().events
    expect(events).toHaveLength(40)
    // 3 seed events + 50 rolls plus interleaved contract lines; ids stay
    // consecutive and only the newest 40 survive.
    expect(events[39].id).toBeGreaterThanOrEqual(53)
    for (let i = 1; i < events.length; i++) expect(events[i].id).toBe(events[i - 1].id + 1)
  })

  it('sector control and unrest stay inside their clamps through many events', () => {
    for (let i = 0; i < 50; i++) forceEvent()
    const sectors = useWorldStore.getState().sectors
    for (const id of OPEN_SECTORS) {
      expect(sectors[id].control).toBeGreaterThanOrEqual(4)
      expect(sectors[id].control).toBeLessThanOrEqual(96)
      expect(sectors[id].unrest).toBeGreaterThanOrEqual(2)
      expect(sectors[id].unrest).toBeLessThanOrEqual(UNREST_MAX)
    }
    // The feed moved at least one sector off its atlas start.
    const moved = SECTORS.some(
      (s) => sectors[s.id].control !== s.control || sectors[s.id].unrest !== s.unrest,
    )
    expect(moved).toBe(true)
  })

  it('city ownership only ever names a holding corporation', () => {
    for (let i = 0; i < 50; i++) forceEvent()
    for (const corp of Object.values(useWorldStore.getState().owner)) {
      expect(HOLDERS).toContain(corp)
    }
  })

  it('unread counts events until markRead clears it', () => {
    forceEvent()
    expect(useWorldStore.getState().unread).toBeGreaterThanOrEqual(4)
    useWorldStore.getState().markRead()
    expect(useWorldStore.getState().unread).toBe(0)
  })
})

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return {
    applyKey: 1,
    won: true,
    kills: 7,
    casualties: 0,
    timeSec: 300,
    civiliansHit: 0,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
    ...over,
  }
}

// A hand-built record for hook tests: far expiry, client matching the
// sector's dominant holder, so only the code under test moves it.
function craft(
  sector: SectorId,
  seed: number,
  threat: ContractThreat = 'HIGH',
): GeneratedContract {
  return {
    id: 'gc' + seed.toString(16).padStart(8, '0'),
    createdT: 0,
    expiresAtT: 1e9,
    sector,
    cityId: CITIES_BY_SECTOR[sector][0].id,
    district: 5,
    type: 'SEIZURE',
    client: sectorClient(sector, initialOwner()),
    threat,
    reward: 50000,
    seed,
    priority: false,
    expedited: false,
  }
}

describe('generated contracts', () => {
  // Crosses the pending generation check with events pinned off.
  function forceGeneration(): void {
    const s = useWorldStore.getState()
    useWorldStore.setState({ nextEventT: 1e12, t: s.nextContractT - 1 })
    useWorldStore.getState().tick(1)
  }

  it('rolls a contract when the clock crosses nextContractT and posts the offer', () => {
    const checkT = useWorldStore.getState().nextContractT
    forceGeneration()
    const s = useWorldStore.getState()
    expect(s.contracts).toHaveLength(1)
    const c = s.contracts[0]
    expect(c.createdT).toBe(checkT)
    expect(OPEN_SECTORS).toContain(c.sector)
    expect(CITIES_BY_SECTOR[c.sector].some((city) => city.id === c.cityId)).toBe(true)
    expect(c.expiresAtT - c.createdT).toBeGreaterThanOrEqual(CONTRACT_EXPIRY_MIN_SEC)
    expect(c.expiresAtT - c.createdT).toBeLessThanOrEqual(2 * CONTRACT_EXPIRY_MIN_SEC)
    expect(c.priority).toBe(false)
    expect(s.events.at(-1)).toMatchObject({ kind: 'contract', sector: c.sector })
    expect(s.events.at(-1)?.text).toContain('POSTED')
    expect(s.nextContractT).toBeGreaterThanOrEqual(checkT + CONTRACT_MIN_SEC)
    expect(s.nextContractT).toBeLessThan(checkT + CONTRACT_MIN_SEC + CONTRACT_SPAN_SEC)
  })

  it('generated-contract Threat follows Garrison condition', () => {
    const sectors: Record<string, SectorState> = {}
    for (const id of OPEN_SECTORS) sectors[id] = { control: 20, unrest: 10 }
    useWorldStore.setState({ sectors, nextEventT: 1e12, nextTaxT: 1e12 })
    forceGeneration()
    expect(useWorldStore.getState().contracts[0].threat).toBe('SEVERE')
  })

  it('reproduces the same contract from a restored rng cursor', () => {
    forceGeneration()
    const first = structuredClone({
      contracts: useWorldStore.getState().contracts,
      contractRngState: useWorldStore.getState().contractRngState,
      nextContractT: useWorldStore.getState().nextContractT,
    })
    useWorldStore.setState(structuredClone(snapshot))
    forceGeneration()
    const second = useWorldStore.getState()
    expect(second.contracts).toEqual(first.contracts)
    expect(second.contractRngState).toBe(first.contractRngState)
    expect(second.nextContractT).toBe(first.nextContractT)
  })

  it('stamps the posted offer with a Reward from its threat band (story 014)', () => {
    forceGeneration()
    const c = useWorldStore.getState().contracts[0]
    expect(Number.isInteger(c.reward)).toBe(true)
    expect(c.reward % 500).toBe(0)
    expect(c.reward).toBeGreaterThanOrEqual(generatedReward(c.threat, 0, c.priority))
    expect(c.reward).toBeLessThanOrEqual(generatedReward(c.threat, 1 - 2 ** -32, c.priority))
  })

  it('keeps at most three contracts open across repeated generation checks', () => {
    for (let i = 0; i < 12; i++) forceGeneration()
    const s = useWorldStore.getState()
    expect(s.contracts.length).toBeGreaterThanOrEqual(1)
    expect(s.contracts.length).toBeLessThanOrEqual(CONTRACT_TARGET)
  })

  it('expires an unaccepted offer and posts the rescission to the feed', () => {
    forceGeneration()
    const c = useWorldStore.getState().contracts[0]
    useWorldStore.setState({
      t: c.expiresAtT - 1,
      nextEventT: 1e12,
      nextContractT: 1e12,
    })
    useWorldStore.getState().tick(1)
    const s = useWorldStore.getState()
    expect(s.contracts).toHaveLength(0)
    expect(s.events.at(-1)).toMatchObject({ kind: 'contract', sector: c.sector, tone: 'dim' })
    expect(s.events.at(-1)?.text).toContain('EXPIRED')
  })

  it('a riot can spawn a linked priority suppression contract in its sector', () => {
    useWorldStore.setState({ nextContractT: Number.MAX_SAFE_INTEGER })
    let c: GeneratedContract | null = null
    for (let i = 0; i < 400 && !c; i++) {
      forceEvent()
      c = useWorldStore.getState().contracts[0] ?? null
    }
    expect(c).not.toBeNull()
    if (!c) return
    expect(c.priority).toBe(true)
    expect(c.type).toBe('SUPPRESSION')
    expect(c.expiresAtT - c.createdT).toBeGreaterThanOrEqual(PRIORITY_EXPIRY_MIN_SEC)
    expect(c.expiresAtT - c.createdT).toBeLessThanOrEqual(
      PRIORITY_EXPIRY_MIN_SEC + PRIORITY_EXPIRY_SPAN_SEC,
    )
    const line = useWorldStore
      .getState()
      .events.find((e) => e.text.startsWith('PRIORITY CONTRACT'))
    expect(line?.sector).toBe(c.sector)
  })

  it('a corpsec raid can withdraw an open contract from its sector', () => {
    useWorldStore.setState({
      nextContractT: Number.MAX_SAFE_INTEGER,
      contracts: [craft('eu', 1), craft('af', 2), craft('as', 3)],
    })
    let withdrew = false
    for (let i = 0; i < 600 && !withdrew; i++) {
      forceEvent()
      withdrew = useWorldStore.getState().contracts.length < 3
    }
    expect(withdrew).toBe(true)
    expect(
      useWorldStore.getState().events.some((e) => e.text.includes('WITHDRAWS CONTRACT')),
    ).toBe(true)
  })

  it('open contracts always name the sector dominant holder as client', () => {
    useWorldStore.setState({
      nextContractT: Number.MAX_SAFE_INTEGER,
      contracts: [craft('eu', 11), craft('af', 12), craft('as', 13)],
    })
    for (let i = 0; i < 200; i++) forceEvent()
    const s = useWorldStore.getState()
    for (const c of s.contracts) {
      expect(c.client).toBe(sectorClient(c.sector, s.owner))
      if (c.client !== 'nexus') expect(s.owner[c.cityId]).not.toBe('nexus')
    }
  })

  it('a generated debrief moves the sector like an authored one and spends the contract', () => {
    const c = craft('eu', 21)
    useWorldStore.setState({ contracts: [c], nextContractT: Number.MAX_SAFE_INTEGER })
    const before = structuredClone(useWorldStore.getState().sectors.eu)
    useWorldStore.getState().applyMissionResult(c.id, outcome())
    const after = useWorldStore.getState()
    expect(after.contracts).toHaveLength(0)
    expect(after.sectors.eu.control).toBeGreaterThan(before.control)
    expect(after.sectors.eu.unrest).toBeLessThan(before.unrest)
    expect(after.events.at(-2)?.tone).toBe('green')
    expect(after.events.at(-2)?.text).toContain('STRIKE TEAM 04 OPENS')
    expect(after.events.at(-1)?.text).toContain('TAKES')
    expect(after.events.at(-1)?.text).not.toContain('TAKES CONTROL OF')
  })

  it('a failed generated contract also leaves the market (EC-009)', () => {
    // ADR-0003: a generated contract that is fulfilled or failed leaves the market.
    const failed = craft('eu', 31)
    const other = craft('af', 32)
    useWorldStore.setState({ contracts: [failed, other], nextContractT: Number.MAX_SAFE_INTEGER })
    useWorldStore.getState().applyMissionResult(failed.id, outcome({ won: false }))
    const after = useWorldStore.getState()
    expect(after.contracts.map((c) => c.id)).toEqual([other.id])
    expect(after.events.find((e) => e.text.includes('WITHDRAWS FROM'))?.tone).toBe('red')
    // Still resolvable for the debrief that is showing it.
    expect(resolveMission(failed.id)?.id).toBe(failed.id)
  })

  it('resolveMission finds authored, open generated, and just-fulfilled missions', () => {
    expect(resolveMission('m01')?.codename).toBe('GLASS VEIL')
    expect(resolveMission('zz')).toBeNull()
    const c = craft('af', 22)
    useWorldStore.setState({ contracts: [c], nextContractT: Number.MAX_SAFE_INTEGER })
    const def = resolveMission(c.id)
    expect(def?.id).toBe(c.id)
    expect(def?.sector).toBe('af')
    // Fulfilled: gone from the market, still resolvable for the debrief.
    useWorldStore.getState().applyMissionResult(c.id, outcome())
    expect(useWorldStore.getState().contracts).toHaveLength(0)
    expect(resolveMission(c.id)?.id).toBe(c.id)
  })

  it('advanceDays lands exactly where continuous ticking would', () => {
    useWorldStore.getState().advanceDays(2)
    const jump = flowSnapshot()
    const jumpCredits = useAppStore.getState().credits

    useWorldStore.setState(structuredClone(snapshot))
    useAppStore.setState({ credits: INITIAL_CREDITS })
    // 0.25s frames at speed 2 advance exactly 30 world seconds each.
    for (let i = 0; i < (2 * DAY) / 30; i++) useWorldStore.getState().tick(0.25)
    expect(flowSnapshot()).toEqual(jump)
    expect(useAppStore.getState().credits).toBe(jumpCredits)
  })

  it('day jumps replay staged spends, pressure, crisis and tax yield identically', () => {
    // High unrest arms decay and can cross into crisis; the pending spend
    // steps hourly; Tax yield checks every 24 hours: all of it must land
    // identically whether the two days pass in one jump or in frames.
    const staged = () => {
      useWorldStore.setState(structuredClone(snapshot))
      useWorldStore.setState({
        influence: 30,
        sectors: {
          ...useWorldStore.getState().sectors,
          af: { control: 30, unrest: 82 },
        },
      })
      useWorldStore.getState().spendInfluence('eu', 'stabilize')
      useWorldStore.getState().spendInfluence('sa', 'lobby')
    }

    staged()
    const credits0 = useAppStore.getState().credits
    useWorldStore.getState().advanceDays(2)
    const jump = flowSnapshot()
    const jumpCredits = useAppStore.getState().credits
    expect(jump.spends).toEqual([])
    expect(jumpCredits).toBeGreaterThan(credits0)

    staged()
    useAppStore.setState({ credits: INITIAL_CREDITS })
    for (let i = 0; i < (2 * DAY) / 30; i++) useWorldStore.getState().tick(0.25)
    expect(flowSnapshot()).toEqual(jump)
    expect(useAppStore.getState().credits).toBe(jumpCredits)
  })
})

describe('mission results', () => {

  it('a Glass Veil win raises control, lowers unrest, and posts a green event', () => {
    const state = useWorldStore.getState()
    const before = structuredClone({
      sectors: state.sectors,
      owner: state.owner,
      unread: state.unread,
    })
    useWorldStore.getState().applyMissionResult('m01', outcome())
    const after = useWorldStore.getState()
    expect(after.sectors.eu.control).toBe(before.sectors.eu.control + 4)
    expect(after.sectors.eu.unrest).toBe(before.sectors.eu.unrest - 4)
    expect(before.owner.nc).toBe('helix')
    expect(after.owner.nc).toBe('nexus')
    expect(after.events.at(-2)).toMatchObject({
      sector: 'eu',
      tone: 'green',
      text: 'STRIKE TEAM 04 OPENS DISTRICT 07 IN NEW CARTHAGE',
    })
    expect(after.events.at(-1)).toMatchObject({
      sector: 'eu',
      kind: 'seizure',
      tone: 'green',
      text: 'NEXUS GLOBAL TAKES NEW CARTHAGE',
    })
    expect(after.unread).toBe(before.unread + 2)
  })

  it('posts a red KIA feed event naming the operatives lost', () => {
    const before = useWorldStore.getState()
    const unread = before.unread
    const lastId = before.events.at(-1)?.id ?? 0
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ casualties: 2, deadIds: ['op1', 'op2'] }), [
        'MARA',
        'GHOST',
      ])
    const after = useWorldStore.getState()
    expect(after.events.at(-1)).toMatchObject({
      id: lastId + 3,
      sector: 'eu',
      kind: 'kia',
      tone: 'red',
      text: 'OPERATIVES MARA, GHOST KIA IN NEW CARTHAGE',
    })
    // Ownership flip lands before the loss line; both stay green.
    expect(after.events.at(-2)?.tone).toBe('green')
    expect(after.unread).toBe(unread + 3)
  })

  it('a debrief write-back leaves no session-only taxPaid key on the store', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome())
    expect('taxPaid' in useWorldStore.getState()).toBe(false)
  })

  it('a second Glass Veil win on a fresh start still hands New Carthage to Nexus', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome())
    const first = useWorldStore.getState().owner.nc
    useWorldStore.setState(structuredClone(snapshot))
    useWorldStore.getState().applyMissionResult('m01', outcome())
    expect(first).toBe('nexus')
    expect(useWorldStore.getState().owner.nc).toBe('nexus')
  })

  it('a loss of a Nexus-held city returns it to the atlas default', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome())
    expect(useWorldStore.getState().owner.nc).toBe('nexus')
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useWorldStore.getState().owner.nc).toBe('helix')
  })

  it('a quiet replay does not move control, unrest, ownership, or influence', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome())
    const afterWin = useWorldStore.getState()
    const eu = { ...afterWin.sectors.eu }
    const influence = afterWin.influence
    useWorldStore.getState().applyMissionResult(
      'm01',
      outcome({ quietReplay: true, civiliansHit: 0 }),
    )
    const replayWin = useWorldStore.getState()
    expect(replayWin.sectors.eu).toEqual(eu)
    expect(replayWin.owner.nc).toBe('nexus')
    expect(replayWin.influence).toBe(influence)
    useWorldStore.getState().applyMissionResult(
      'm01',
      outcome({ won: false, reward: 0, quietReplay: true }),
    )
    const replayLoss = useWorldStore.getState()
    expect(replayLoss.sectors.eu).toEqual(eu)
    expect(replayLoss.owner.nc).toBe('nexus')
    expect(replayLoss.influence).toBe(influence)
  })

  it('a quiet-replay win leaves a rival-held city with its holder', () => {
    expect(useWorldStore.getState().owner.nc).toBe('helix')
    const lastId = useWorldStore.getState().events.at(-1)?.id ?? 0
    useWorldStore.getState().applyMissionResult('m01', outcome({ quietReplay: true }))
    const after = useWorldStore.getState()
    expect(after.owner.nc).toBe('helix')
    const added = after.events.filter((e) => e.id > lastId)
    expect(added.some((e) => e.text.includes(' TAKES '))).toBe(false)
  })

  it('a loss of a Nexus-default city is a no-op on its holder', () => {
    const record = { ...craft('na', 0x516), cityId: 'nb' }
    useWorldStore.setState({ contracts: [record] })
    const before = useWorldStore.getState()
    expect(before.owner.nb).toBe('nexus')
    const na = { ...before.sectors.na }
    const lastId = before.events.at(-1)?.id ?? 0
    useWorldStore
      .getState()
      .applyMissionResult(record.id, outcome({ won: false, reward: 0 }))
    const after = useWorldStore.getState()
    expect(after.owner.nb).toBe('nexus')
    const added = after.events.filter((e) => e.id > lastId)
    expect(added[0]?.text).toBe('STRIKE TEAM 04 WITHDRAWS FROM DISTRICT 05 IN NEW BOSTON')
    expect(added.some((e) => e.text.includes(' TAKES '))).toBe(false)
    // The loss still shoves the sector; only the holder stays put.
    expect(after.sectors.na.control).toBeLessThan(na.control)
  })

  // Direction-only checks (TR-world-network-013). Magnitudes are unnamed in
  // GDD section 5, so these assert relations, never deltas. Start mid-range
  // so neither the cap nor the floor can hide a shove.
  function midEu(): void {
    const eu = useWorldStore.getState().sectors.eu
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, eu: { ...eu, control: 50, unrest: 50 } },
    })
  }

  it('a non-quiet win leaves control higher than it was', () => {
    midEu()
    const before = useWorldStore.getState().sectors.eu.control
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: true }))
    expect(useWorldStore.getState().sectors.eu.control).toBeGreaterThan(before)
  })

  it('a non-quiet loss leaves control lower than it was', () => {
    midEu()
    const before = useWorldStore.getState().sectors.eu.control
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useWorldStore.getState().sectors.eu.control).toBeLessThan(before)
  })

  it('civilian hits leave unrest higher than an otherwise identical clean win', () => {
    midEu()
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 0 }))
    const clean = useWorldStore.getState().sectors.eu.unrest

    useWorldStore.setState(structuredClone(snapshot))
    midEu()
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 3 }))
    const dirty = useWorldStore.getState().sectors.eu.unrest

    expect(dirty).toBeGreaterThan(clean)
  })

  it('a single loss reads as one operative', () => {
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ casualties: 1, deadIds: ['op1'] }), ['MARA'])
    expect(useWorldStore.getState().events.at(-1)?.text).toBe(
      'OPERATIVE MARA KIA IN NEW CARTHAGE',
    )
  })

  it('a loss raises unrest and civilian hits add at most five more unrest', () => {
    const before = useWorldStore.getState().sectors.eu
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0, civiliansHit: 99 }))
    const after = useWorldStore.getState()
    expect(after.sectors.eu.control).toBe(before.control - 1)
    expect(after.sectors.eu.unrest).toBe(before.unrest + 4 + 5)
    expect(after.events.at(-1)?.tone).toBe('red')
  })
})

describe('influence economy', () => {
  it('a contract win pays +6 points, +2 more for clean work, a loss nothing', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 0 }))
    expect(useWorldStore.getState().influence).toBe(
      INFLUENCE_WIN_PTS + INFLUENCE_CLEAN_PTS,
    )
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ civiliansHit: 2, quietReplay: true }))
    expect(useWorldStore.getState().influence).toBe(
      INFLUENCE_WIN_PTS + INFLUENCE_CLEAN_PTS,
    )
    const before = useWorldStore.getState().influence
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useWorldStore.getState().influence).toBe(before)
  })

  it('a new campaign reads Influence 0', () => {
    expect(useWorldStore.getState().influence).toBe(0)
  })

  it('a non-quiet win with civilians hit pays 6, however many were hit', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 1 }))
    expect(useWorldStore.getState().influence).toBe(6)
    useWorldStore.setState({ influence: 0 })
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 2 }))
    expect(useWorldStore.getState().influence).toBe(6)
  })

  it('a non-quiet clean win pays 8', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 0 }))
    expect(useWorldStore.getState().influence).toBe(8)
  })

  it('income is a delta on the existing balance', () => {
    useWorldStore.setState({ influence: 3 })
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 1 }))
    expect(useWorldStore.getState().influence).toBe(9)
  })

  it('a loss leaves Influence unchanged, including at 0', () => {
    useWorldStore.setState({ influence: 5 })
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useWorldStore.getState().influence).toBe(5)
    useWorldStore.setState({ influence: 0 })
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useWorldStore.getState().influence).toBe(0)
  })

  it('does not drip Influence from Control', () => {
    pinFlows()
    useWorldStore.setState({ nextTaxT: TAX_INTERVAL_SEC, influence: 0 })
    crossTo(TAX_INTERVAL_SEC)
    expect(useWorldStore.getState().influence).toBe(0)
    crossTo(2 * TAX_INTERVAL_SEC)
    expect(useWorldStore.getState().influence).toBe(0)
  })

  it('stabilize costs 8 points, arms the sector cooldown, and posts a feed line', () => {
    pinFlows()
    useWorldStore.setState({ influence: 20 })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    expect('taxPaid' in useWorldStore.getState()).toBe(false)
    const s = useWorldStore.getState()
    expect(s.influence).toBe(20 - INFLUENCE_ACTIONS.stabilize.cost)
    expect(s.cooldowns[cooldownKey('eu', 'stabilize')]).toBe(
      s.t + INFLUENCE_ACTIONS.stabilize.cooldownSec,
    )
    expect(s.spends).toEqual([
      {
        action: 'stabilize',
        sector: 'eu',
        nextT: s.t + INFLUENCE_ACTIONS.stabilize.stepSec,
        remaining: INFLUENCE_ACTIONS.stabilize.steps,
      },
    ])
    expect(s.events.at(-1)).toMatchObject({ kind: 'influence', sector: 'eu', tone: 'amber' })
  })

  it('stabilize applies -12 unrest staged over six world hours', () => {
    pinFlows()
    useWorldStore.setState({ influence: 20 })
    const unrest0 = useWorldStore.getState().sectors.eu.unrest
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    // Two hours in: two steps landed, four remain.
    crossTo(2 * 3600)
    let s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(unrest0 - 4)
    expect(s.spends[0].remaining).toBe(4)
    // Past the sixth hour the spend is spent in full and retired.
    crossTo(7 * 3600)
    s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(unrest0 - 12)
    expect(s.spends).toEqual([])
  })

  it('lobby applies +8 control staged over twelve world hours', () => {
    pinFlows()
    useWorldStore.setState({ influence: 20 })
    const control0 = useWorldStore.getState().sectors.sa.control
    useWorldStore.getState().spendInfluence('sa', 'lobby')
    expect(useWorldStore.getState().influence).toBe(20 - INFLUENCE_ACTIONS.lobby.cost)
    crossTo(13 * 3600)
    const s = useWorldStore.getState()
    expect(s.sectors.sa.control).toBe(control0 + 8)
    expect(s.spends).toEqual([])
  })

  it('refuses a spend when unaffordable and while the sector action cools down', () => {
    pinFlows()
    useWorldStore.setState({ influence: 5 })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    expect(useWorldStore.getState().spends).toEqual([])
    expect(useWorldStore.getState().influence).toBe(5)
    // Fund it, spend it, refund it: the cooldown alone must block the rerun.
    useWorldStore.setState({ influence: 20 })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    useWorldStore.setState({ influence: 20 })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    const s = useWorldStore.getState()
    expect(s.influence).toBe(20)
    expect(s.spends).toHaveLength(1)
    // A different sector is its own cooldown track.
    useWorldStore.getState().spendInfluence('af', 'stabilize')
    expect(useWorldStore.getState().spends).toHaveLength(2)
  })

  it('expedite waives the lowest intel gate, extends expiry 24h, then retargets', () => {
    pinFlows()
    const low = craft('eu', 31, 'MODERATE')
    const high = craft('eu', 32, 'SEVERE')
    const elsewhere = craft('af', 33, 'MODERATE')
    useWorldStore.setState({ influence: 30, contracts: [high, low, elsewhere] })
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    let s = useWorldStore.getState()
    expect(s.influence).toBe(30 - INFLUENCE_ACTIONS.expedite.cost)
    const first = s.contracts.find((c) => c.id === low.id)
    expect(first).toMatchObject({
      expedited: true,
      expiresAtT: low.expiresAtT + EXPEDITE_EXTENSION_SEC,
    })
    expect(s.contracts.find((c) => c.id === high.id)?.expedited).toBe(false)
    expect(s.contracts.find((c) => c.id === elsewhere.id)?.expedited).toBe(false)
    if (first) expect(contractMission(first).intelReq).toBe(1)
    expect(CONTRACT_INTEL_REQ[high.threat]).toBe(3)
    // Off cooldown, the next spend targets the remaining gated offer.
    useWorldStore.setState({ cooldowns: {} })
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    s = useWorldStore.getState()
    const second = s.contracts.find((c) => c.id === high.id)
    expect(second?.expedited).toBe(true)
    if (second) expect(contractMission(second).intelReq).toBe(1)
    // Nothing left to expedite in the sector: the spend is refused.
    useWorldStore.setState({ cooldowns: {}, influence: 30 })
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    expect(useWorldStore.getState().influence).toBe(30)
  })
})

describe('generated Reward immutability (story 015)', () => {
  const R = 73500

  it('Expedite waives the gate and adds 24 h of expiry but leaves Reward at R', () => {
    pinFlows()
    const offer = { ...craft('eu', 41, 'SEVERE'), reward: R }
    useWorldStore.setState({ influence: 30, contracts: [offer] })
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    const after = useWorldStore.getState().contracts.find((c) => c.id === offer.id)
    expect(after).toMatchObject({
      expedited: true,
      expiresAtT: offer.expiresAtT + EXPEDITE_EXTENSION_SEC,
      reward: R,
    })
    if (after) expect(contractMission(after).intelReq).toBe(1)
  })

  it('a later Unrest or Control change leaves Reward at R', () => {
    pinFlows()
    // nc is a Helix city that Glass Veil hands to Nexus, so the win also
    // re-clients this offer to the sector's new majority holder.
    const offer = { ...craft('eu', 42, 'HIGH'), cityId: 'nc', client: 'helix' as const, reward: R }
    const other = { ...craft('af', 43, 'MODERATE'), reward: 41000 }
    useWorldStore.setState({ influence: 40, contracts: [offer, other] })
    const before = structuredClone(useWorldStore.getState().sectors.eu)
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    useWorldStore.getState().spendInfluence('eu', 'lobby')
    crossTo(13 * 3600)
    useWorldStore.getState().applyMissionResult('m01', outcome())
    const s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).not.toBe(before.unrest)
    expect(s.sectors.eu.control).not.toBe(before.control)
    expect(s.owner.nc).toBe('nexus')
    const moved = s.contracts.find((c) => c.id === offer.id)
    expect(moved?.client).not.toBe('helix')
    expect(moved?.reward).toBe(R)
    expect(s.contracts.find((c) => c.id === other.id)?.reward).toBe(41000)
  })
})

describe('Expedite expiry extension (story 018)', () => {
  beforeEach(() => {
    useCampaignStore.setState(initialCampaignData())
  })

  it('moves expiry from E to exactly E + 24 strategic hours and writes no Intel', () => {
    pinFlows()
    for (const priority of [false, true]) {
      const t = useWorldStore.getState().t
      const E = t + (priority ? 9 : 30) * 3600
      const offer = { ...craft('eu', priority ? 52 : 51, 'HIGH'), priority, expiresAtT: E }
      useCampaignStore.setState({ intelLevel: 1, intelProgress: 3 })
      useWorldStore.setState({ influence: 30, cooldowns: {}, contracts: [offer] })
      useWorldStore.getState().spendInfluence('eu', 'expedite')
      const after = useWorldStore.getState().contracts.find((c) => c.id === offer.id)
      expect(after?.expedited).toBe(true)
      expect(after?.expiresAtT).toBe(E + 24 * 3600)
      expect(after?.createdT).toBe(offer.createdT)
      const c = useCampaignStore.getState()
      expect({ intelLevel: c.intelLevel, intelProgress: c.intelProgress }).toEqual({
        intelLevel: 1,
        intelProgress: 3,
      })
    }
  })
})

describe('stabilize and expedite refusals', () => {
  beforeEach(() => {
    useCampaignStore.setState(initialCampaignData())
  })

  // A refused spend must leave the whole store untouched: same state object,
  // and no subscriber notified.
  function expectNoOp(run: () => void): void {
    const before = useWorldStore.getState()
    const listener = vi.fn()
    const unsubscribe = useWorldStore.subscribe(listener)
    try {
      run()
    } finally {
      unsubscribe()
    }
    expect(listener).not.toHaveBeenCalled()
    expect(useWorldStore.getState()).toBe(before)
  }

  it('refuses Stabilize at Influence 7 and keeps 7', () => {
    pinFlows()
    useWorldStore.setState({ influence: 7 })
    expectNoOp(() => useWorldStore.getState().spendInfluence('eu', 'stabilize'))
    const s = useWorldStore.getState()
    expect(s.influence).toBe(7)
    expect(s.spends).toEqual([])
    expect(s.cooldowns).toEqual({})
  })

  it('refuses Stabilize at the opening Influence 0', () => {
    pinFlows()
    expectNoOp(() => useWorldStore.getState().spendInfluence('eu', 'stabilize'))
    expect(useWorldStore.getState().influence).toBe(0)
  })

  it('refuses Stabilize on cooldown at Influence 8 and above, changing nothing', () => {
    pinFlows()
    for (const influence of [8, 20]) {
      const readyAtT = useWorldStore.getState().t + 3600
      const cooldowns = { [cooldownKey('eu', 'stabilize')]: readyAtT }
      useWorldStore.setState({ influence, cooldowns, spends: [] })
      expectNoOp(() => useWorldStore.getState().spendInfluence('eu', 'stabilize'))
      const s = useWorldStore.getState()
      expect(s.influence).toBe(influence)
      expect(s.cooldowns).toEqual(cooldowns)
      expect(s.spends).toEqual([])
    }
  })

  it('refuses Expedite with no generated target and keeps Influence', () => {
    pinFlows()
    useWorldStore.setState({ influence: 30, contracts: [] })
    expectNoOp(() => useWorldStore.getState().spendInfluence('eu', 'expedite'))
    const s = useWorldStore.getState()
    expect(s.influence).toBe(30)
    expect(s.cooldowns).toEqual({})
    expect(s.spends).toEqual([])
  })

  it('refuses Expedite when the only offers are in another sector', () => {
    pinFlows()
    const elsewhere = craft('af', 41, 'MODERATE')
    useWorldStore.setState({ influence: 30, contracts: [elsewhere] })
    expectNoOp(() => useWorldStore.getState().spendInfluence('eu', 'expedite'))
    expect(useWorldStore.getState().influence).toBe(30)
  })

  it('Expedite never occupies the staged-spend slot or writes Intel', () => {
    pinFlows()
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 5 })
    useWorldStore.setState({ influence: 30, contracts: [craft('eu', 42, 'MODERATE')] })
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    const s = useWorldStore.getState()
    expect(s.influence).toBe(30 - INFLUENCE_ACTIONS.expedite.cost)
    expect(s.spends).toEqual([])
    const c = useCampaignStore.getState()
    expect({ intelLevel: c.intelLevel, intelProgress: c.intelProgress }).toEqual({
      intelLevel: 2,
      intelProgress: 5,
    })
  })
})

describe('unrest pressure and crisis', () => {
  it('a sector pushed above 60 unrest arms a decay timer through a mission result', () => {
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 60, unrest: 58 } },
    })
    // A dirty loss adds 4 + up-to-5 unrest in eu: 58 -> 67, over the mark.
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0, civiliansHit: 9 }))
    const s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(67)
    expect(s.pressure.eu).toBe(s.t + PRESSURE_INTERVAL_SEC)
  })

  it('decays 1-2 control every 6 world hours while unrest holds high', () => {
    pinFlows()
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 60, unrest: 70 } },
      pressure: { eu: 3600 },
    })
    crossTo(3600)
    let s = useWorldStore.getState()
    const drop = 60 - s.sectors.eu.control
    expect(drop).toBeGreaterThanOrEqual(PRESSURE_CONTROL_DROP_MIN)
    expect(drop).toBeLessThanOrEqual(PRESSURE_CONTROL_DROP_MAX)
    expect(s.pressure.eu).toBe(3600 + PRESSURE_INTERVAL_SEC)
    // The next interval decays again off the rearmed timer.
    crossTo(3600 + PRESSURE_INTERVAL_SEC)
    s = useWorldStore.getState()
    expect(60 - s.sectors.eu.control).toBeGreaterThanOrEqual(2 * PRESSURE_CONTROL_DROP_MIN)
    expect(60 - s.sectors.eu.control).toBeLessThanOrEqual(2 * PRESSURE_CONTROL_DROP_MAX)
  })

  it('unrest pressure lowers the tax yield readout', () => {
    const calm = sectorReadout('eu', { control: 60, unrest: 40 })
    const strained = sectorReadout('eu', { control: 60, unrest: 75 })
    expect(strained.taxYield).toBeLessThan(calm.taxYield)
  })

  it('crisis enters at 85+, posts a red event, and tags open contracts priority', () => {
    const open = craft('eu', 41)
    useWorldStore.setState({
      contracts: [open],
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 40, unrest: 80 } },
    })
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0, civiliansHit: 9 }))
    const s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(89)
    expect(s.crisis).toContain('eu')
    expect(s.contracts[0].priority).toBe(true)
    const line = s.events.find((e) => e.kind === 'crisis')
    expect(line).toMatchObject({ sector: 'eu', tone: 'red' })
    expect(line?.text).toContain('CRISIS')
  })

  it('crisis clears with a green event once unrest falls under 70', () => {
    pinFlows()
    useWorldStore.setState({
      influence: 20,
      crisis: ['eu'],
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 40, unrest: 71 } },
      pressure: { eu: 1e12 },
    })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    crossTo(7 * 3600)
    const s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(59)
    expect(s.crisis).toEqual([])
    expect(s.events.at(-1)).toMatchObject({ kind: 'crisis', sector: 'eu', tone: 'green' })
    // Back under the pressure mark too: the decay timer disarmed.
    expect(s.pressure.eu).toBeUndefined()
  })

  it('a sector in crisis draws events at roughly double weight', () => {
    const even: Record<string, SectorState> = {}
    for (const sec of SECTORS) even[sec.id] = { control: 50, unrest: 40 }
    useWorldStore.setState({ nextContractT: 1e12, nextTaxT: 1e12 })
    const share = (crisis: SectorId[]): number => {
      let eu = 0
      let total = 0
      for (let i = 0; i < 400; i++) {
        // Refreeze the sector state so the weights stay fixed while the rng
        // cursor advances; crisis is pinned rather than derived.
        useWorldStore.setState({ sectors: structuredClone(even), crisis: [...crisis] })
        const before = useWorldStore.getState().events.at(-1)?.id ?? 0
        forceEvent()
        for (const e of useWorldStore.getState().events) {
          if (e.id <= before) continue
          if (!(FORECAST_KINDS as readonly string[]).includes(e.kind)) continue
          total++
          if (e.sector === 'eu') eu++
        }
      }
      return eu / total
    }
    useWorldStore.setState({ rngState: 0x1234 })
    const flat = share([])
    useWorldStore.setState(structuredClone(snapshot))
    useWorldStore.setState({ nextContractT: 1e12, nextTaxT: 1e12, rngState: 0x1234 })
    const doubled = share(['eu'])
    // Equal weights put eu at 1/6 of events; a doubled eu takes 2/7.
    expect(flat).toBeGreaterThan(1 / 6 - 0.05)
    expect(flat).toBeLessThan(1 / 6 + 0.05)
    expect(doubled).toBeGreaterThan(2 / 7 - 0.05)
    expect(doubled).toBeLessThan(2 / 7 + 0.05)
  })
})

describe('forecast weights match the generator', () => {
  it('rolled kind frequencies track kindWeights at pinned unrest', () => {
    const pinned: Record<string, SectorState> = {}
    for (const sec of SECTORS) pinned[sec.id] = { control: 50, unrest: 40 }
    useWorldStore.setState({ nextContractT: 1e12, nextTaxT: 1e12 })
    const counts: Record<string, number> = {}
    let total = 0
    for (let i = 0; i < 600; i++) {
      useWorldStore.setState({ sectors: structuredClone(pinned), crisis: [] })
      const before = useWorldStore.getState().events.at(-1)?.id ?? 0
      forceEvent()
      for (const e of useWorldStore.getState().events) {
        if (e.id <= before) continue
        if (!(FORECAST_KINDS as readonly string[]).includes(e.kind)) continue
        counts[e.kind] = (counts[e.kind] ?? 0) + 1
        total++
      }
    }
    const table = kindWeights(40)
    let weightTotal = 0
    for (const [, w] of table) weightTotal += w
    for (const [kind, w] of table) {
      const expected = w / weightTotal
      const observed = (counts[kind] ?? 0) / total
      expect(Math.abs(observed - expected)).toBeLessThan(0.05)
    }
  })
})

describe('review pin', () => {
  it('a review older than a day snaps back to live', () => {
    useWorldStore.setState({ t: DAY, review: 0, nextEventT: 1e9 })
    useWorldStore.getState().tick(0.1)
    expect(useWorldStore.getState().review).toBeNull()
  })

  it('a recent review survives the tick', () => {
    useWorldStore.setState({ t: 100, review: 50, nextEventT: 1e9 })
    useWorldStore.getState().tick(0.1)
    expect(useWorldStore.getState().review).toBe(50)
  })

  it('the snap boundary is strict: exactly one day behind is kept, one second further snaps', () => {
    pinFlows()
    const dt = 0.1
    const { speed } = useWorldStore.getState()
    const t0 = 2 * DAY
    const t1 = t0 + dt * speed * TIME_SCALE
    useWorldStore.setState({ t: t0, review: t1 - DAY })
    useWorldStore.getState().tick(dt)
    expect(useWorldStore.getState().t).toBe(t1)
    expect(useWorldStore.getState().review).toBe(t1 - DAY)

    useWorldStore.setState({ t: t0, review: t1 - DAY - 1 })
    useWorldStore.getState().tick(dt)
    expect(useWorldStore.getState().review).toBeNull()
  })

  it('a paused tick neither advances t nor snaps a stale review', () => {
    pinFlows()
    useWorldStore.setState({ t: 3 * DAY, review: 0, paused: true })
    useWorldStore.getState().tick(10)
    const s = useWorldStore.getState()
    expect(s.t).toBe(3 * DAY)
    expect(s.review).toBe(0)
  })

  it('setReview writes only the pin: t, sectors, owners and the flows stay live', () => {
    pinFlows()
    useWorldStore.setState({ t: 5000 })
    const before = flowSnapshot()
    useWorldStore.getState().setReview(1234)
    expect(useWorldStore.getState().review).toBe(1234)
    expect(flowSnapshot()).toEqual(before)
  })

  it('setReview does not deposit Tax even with Tax overdue', () => {
    const credits = useAppStore.getState().credits
    useWorldStore.setState({
      t: 10 * TAX_INTERVAL_SEC,
      nextTaxT: TAX_INTERVAL_SEC,
      nextEventT: 1e12,
      nextContractT: 1e12,
    })
    useWorldStore.getState().setReview(5)
    expect(useAppStore.getState().credits).toBe(credits)
    expect(useWorldStore.getState().nextTaxT).toBe(TAX_INTERVAL_SEC)
    // Control: the same overdue state does pay out once the clock ticks.
    useWorldStore.getState().tick(0.01)
    expect(useAppStore.getState().credits).toBeGreaterThan(credits)
  })

  it('setReview does not clamp: past and future pins are stored as given', () => {
    useWorldStore.setState({ t: 1000 })
    useWorldStore.getState().setReview(1000 + 10 * DAY)
    expect(useWorldStore.getState().review).toBe(1000 + 10 * DAY)
    useWorldStore.getState().setReview(-5)
    expect(useWorldStore.getState().review).toBe(-5)
    useWorldStore.getState().setReview(null)
    expect(useWorldStore.getState().review).toBeNull()
  })

  it('the live board keeps running while a review is pinned: overdue Tax pays out', () => {
    const credits = useAppStore.getState().credits
    const t = 10 * TAX_INTERVAL_SEC
    useWorldStore.setState({
      t,
      review: t - 1,
      nextTaxT: TAX_INTERVAL_SEC,
      nextEventT: 1e12,
      nextContractT: 1e12,
    })
    useWorldStore.getState().tick(0.01)
    const s = useWorldStore.getState()
    expect(s.t).toBeGreaterThan(t)
    expect(s.nextTaxT).toBeGreaterThan(TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBeGreaterThan(credits)
    expect(s.review).toBe(t - 1)
  })

  it('advanceDays forces the review back to live, even a pin still fresh at the new t', () => {
    pinFlows()
    // After the jump t is 100 + DAY, so this pin is inside the 24h window and
    // the tick snap rule alone would keep it.
    useWorldStore.setState({ t: 100, review: 100 + DAY - 1 })
    useWorldStore.getState().advanceDays(1)
    expect(useWorldStore.getState().review).toBeNull()
  })
})

describe('sector selection', () => {
  it('select stores the sector', () => {
    useWorldStore.getState().select('af')
    expect(useWorldStore.getState().selected).toBe('af')
  })

  it('stepSector walks the open sectors and wraps both ways', () => {
    // eu sits at index 2 of the open list.
    useWorldStore.getState().stepSector(1)
    expect(useWorldStore.getState().selected).toBe(OPEN_SECTORS[3])
    useWorldStore.setState({ selected: OPEN_SECTORS[0] })
    useWorldStore.getState().stepSector(-1)
    expect(useWorldStore.getState().selected).toBe(OPEN_SECTORS[OPEN_SECTORS.length - 1])
  })
})

describe('tax yield', () => {
  const opening: Record<string, number> = {
    na: 4080,
    sa: 1722,
    eu: 2468,
    af: 1887,
    as: 4620,
    oc: 1606,
  }

  it('prints the opening table in Credits, not billions', () => {
    const sectors = useWorldStore.getState().sectors
    for (const id of OPEN_SECTORS) {
      const read = sectorReadout(id, sectors[id])
      expect(read.taxYield).toBe(opening[id])
      expect(read.garrison).toBe(
        sectors[id].control >= 55 ? 'SECURE' : sectors[id].control >= 35 ? 'STRAINED' : 'CRITICAL',
      )
    }
  })

  it('opening collection is North America only', () => {
    pinFlows()
    useWorldStore.setState({ nextTaxT: TAX_INTERVAL_SEC })
    const before = useAppStore.getState().credits
    expect(sectorCorp('na', useWorldStore.getState().owner)).toBe('nexus')
    expect(sectorCorp('sa', useWorldStore.getState().owner)).toBe('contested')
    expect(sectorCorp('as', useWorldStore.getState().owner)).toBe('helix')
    crossTo(TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBe(before + opening.na)
    expect(useWorldStore.getState().nextTaxT).toBe(2 * TAX_INTERVAL_SEC)
  })

  it('a Contested or rival sector shows Tax yield and pays nothing', () => {
    const sa = sectorReadout('sa', useWorldStore.getState().sectors.sa)
    const as = sectorReadout('as', useWorldStore.getState().sectors.as)
    expect(sa.taxYield).toBe(opening.sa)
    expect(as.taxYield).toBe(opening.as)
  })

  it('a quiet replay ETA still collects Tax yield; a loss spends none', () => {
    pinFlows()
    useWorldStore.setState({ nextTaxT: TAX_INTERVAL_SEC })
    const before = useAppStore.getState().credits
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ quietReplay: true, civiliansHit: 0 }))
    expect(useWorldStore.getState().influence).toBe(0)
    expect(useAppStore.getState().credits).toBe(before)
    useWorldStore.getState().advanceDays(2)
    expect(useAppStore.getState().credits).toBe(before + 2 * opening.na)

    useWorldStore.setState(structuredClone(snapshot))
    useAppStore.setState({ credits: INITIAL_CREDITS })
    pinFlows()
    useWorldStore.setState({ nextTaxT: TAX_INTERVAL_SEC })
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    expect(useAppStore.getState().credits).toBe(INITIAL_CREDITS)
    expect(useWorldStore.getState().t).toBe(0)
    expect(useWorldStore.getState().nextTaxT).toBe(TAX_INTERVAL_SEC)
  })

  it('Glass Veil and Hollow Crown contest their sectors; Rust Haven deepens North America', () => {
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 0 }))
    expect(sectorCorp('eu', useWorldStore.getState().owner)).toBe('contested')
    useWorldStore.getState().applyMissionResult('m02', outcome({ civiliansHit: 0 }))
    expect(sectorCorp('as', useWorldStore.getState().owner)).toBe('contested')
    expect(sectorCorp('na', useWorldStore.getState().owner)).toBe('nexus')
    useWorldStore.getState().applyMissionResult('m03', outcome({ civiliansHit: 0 }))
    expect(sectorCorp('na', useWorldStore.getState().owner)).toBe('nexus')
  })

  it('taking a second city in a rival sector starts that tap; losing majority stops it', () => {
    pinFlows()
    useWorldStore.getState().applyMissionResult('m01', outcome({ civiliansHit: 0 }))
    expect(sectorCorp('eu', useWorldStore.getState().owner)).toBe('contested')
    const owner = { ...useWorldStore.getState().owner, ln: 'nexus' as const }
    useWorldStore.setState({ owner, nextTaxT: TAX_INTERVAL_SEC })
    expect(sectorCorp('eu', owner)).toBe('nexus')
    const na = sectorReadout('na', useWorldStore.getState().sectors.na).taxYield
    const eu = sectorReadout('eu', useWorldStore.getState().sectors.eu).taxYield
    const before = useAppStore.getState().credits
    crossTo(TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBe(before + na + eu)

    useWorldStore.setState({
      owner: { ...useWorldStore.getState().owner, ln: 'helix' },
      nextTaxT: 2 * TAX_INTERVAL_SEC,
    })
    expect(sectorCorp('eu', useWorldStore.getState().owner)).toBe('contested')
    const mid = useAppStore.getState().credits
    const na2 = sectorReadout('na', useWorldStore.getState().sectors.na).taxYield
    crossTo(2 * TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBe(mid + na2)
  })
})

describe('tax yield emits only from Nexus-held sectors (WN-007)', () => {
  type Corp = ReturnType<typeof sectorCorp>

  // Pays one Tax due with `id` as the only sector that could pay: every other
  // city is Helix, and the sector's cities take `holder` (one corp for all, a
  // per-city list, or null for the opening owners). `state` is set directly,
  // so no pressure timer is armed and the due sees exactly that state.
  // Returns the Credits delta.
  function payOnce(
    id: SectorId,
    holder: Corp | readonly Corp[] | null,
    state?: { control: number; unrest: number },
  ): number {
    pinFlows()
    const owner: Record<string, Corp> = {}
    for (const c of CITIES) owner[c.id] = 'helix'
    CITIES_BY_SECTOR[id].forEach((c, i) => {
      owner[c.id] =
        holder === null ? initialOwner()[c.id] : typeof holder === 'string' ? holder : holder[i]
    })
    useWorldStore.setState({
      owner,
      nextTaxT: TAX_INTERVAL_SEC,
      ...(state ? { sectors: { ...useWorldStore.getState().sectors, [id]: state } } : {}),
    })
    const before = useAppStore.getState().credits
    crossTo(TAX_INTERVAL_SEC)
    return useAppStore.getState().credits - before
  }

  it('opening North America (Nexus, 68% Control, 12% Unrest) emits 4,080 CR', () => {
    expect(useWorldStore.getState().sectors.na).toEqual({ control: 68, unrest: 12 })
    expect(payOnce('na', null)).toBe(4080)
  })

  // [control, unrest, strain]: flat to 60, 1 - 0.02/pt above it, 0.28 at the
  // unrest cap (the 0.25 floor does not bind).
  it.each<[number, number, number]>([
    [100, 2, 1],
    [100, 60, 1],
    [100, 61, 0.98],
    [100, 70, 0.8],
    [50, 80, 0.6],
    [68, 96, 0.28],
  ])(
    'a Nexus-held sector at %i Control / %i Unrest emits round(base x Control/100 x %f)',
    (control, unrest, strain) => {
      for (const id of OPEN_SECTORS) {
        const base = SECTORS.find((s) => s.id === id)!.yieldBase
        const printed = sectorReadout(id, { control, unrest }).taxYield
        expect(printed, id).toBe(Math.round(base * (control / 100) * strain))
        expect(payOnce(id, 'nexus', { control, unrest }), id).toBe(printed)
      }
    },
  )

  it('Contested and non-Nexus holders print a figure and emit 0, for every open sector', () => {
    for (const id of OPEN_SECTORS) {
      const printed = sectorReadout(id, useWorldStore.getState().sectors[id]).taxYield
      expect(printed, id).toBeGreaterThan(0)
      expect(CITIES_BY_SECTOR[id], id).toHaveLength(3)
      // Opening holder, unchanged: pays only if that holder is Nexus.
      const opening = sectorCorp(id, initialOwner())
      expect(payOnce(id, null), id).toBe(opening === 'nexus' ? printed : 0)
      // Non-Nexus majority holders.
      expect(payOnce(id, 'helix'), id).toBe(0)
      expect(payOnce(id, 'stratos'), id).toBe(0)
      expect(payOnce(id, ['nexus', 'helix', 'helix']), id).toBe(0)
      // A 2-of-3 Nexus majority pays.
      expect(payOnce(id, ['nexus', 'nexus', 'helix']), id).toBe(printed)
      // Contested: a 1-1-1 split has no majority.
      const split = ['nexus', 'helix', 'stratos'] as const
      const owner: Record<string, Corp> = {}
      CITIES_BY_SECTOR[id].forEach((c, i) => (owner[c.id] = split[i]))
      expect(sectorCorp(id, owner), id).toBe('contested')
      expect(payOnce(id, split), id).toBe(0)
    }
  })

  it('a due with no Nexus-held sector leaves Credits unchanged and still rearms', () => {
    pinFlows()
    const owner: Record<string, Corp> = {}
    for (const c of CITIES) owner[c.id] = 'helix'
    useWorldStore.setState({ owner, nextTaxT: TAX_INTERVAL_SEC })
    crossTo(TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBe(INITIAL_CREDITS)
    expect(useWorldStore.getState().nextTaxT).toBe(2 * TAX_INTERVAL_SEC)
  })
})

describe('clock formatting', () => {
  it('stamp(0) prints the world start', () => {
    expect(stamp(0)).toEqual({ date: '2087.05.14', clock: '14:32:17' })
  })

  it('stamp rolls the date across midnight', () => {
    const BASE_SEC = 14 * 3600 + 32 * 60 + 17
    expect(stamp(DAY - BASE_SEC + 5)).toEqual({ date: '2087.05.15', clock: '00:00:05' })
  })

  it('hhmm handles the seeded negative timestamps', () => {
    expect(hhmm(0)).toBe('14:32')
    expect(hhmm(-137)).toBe('14:30')
  })
})

// ADR-0018: tick() and advanceDays() share one private advanceFlow. These pin
// the collision order at a shared timestamp, rearm-from-due, and that a loss
// debrief spends no ETA. The order is read off behaviour, never a second table.
describe('catch-up collision order (ADR-0018)', () => {
  // Credits a Tax collection pays on the given sector states.
  const taxOn = (sectors: Record<string, SectorState>) =>
    OPEN_SECTORS.filter((id) => sectorCorp(id, useWorldStore.getState().owner) === 'nexus')
      .reduce((sum, id) => sum + sectorReadout(id, sectors[id]).taxYield, 0)

  // Expiry, World Event and contract generation all due at T = 10000 with the
  // market full: only an expiry first leaves the generation check room.
  const T = 10_000
  function stageMarketCollision(): void {
    pinFlows()
    const full = Array.from({ length: CONTRACT_TARGET }, (_, i) => craft('eu', 0x100 + i))
    full[0] = { ...full[0], expiresAtT: T }
    useWorldStore.setState({
      t: T - 1,
      contracts: full,
      nextEventT: T,
      nextContractT: T,
    })
  }

  it('expiry, then World Event, then contract generation at one timestamp', () => {
    stageMarketCollision()
    const before = useWorldStore.getState().events.length
    useWorldStore.getState().tick(0.01)
    const s = useWorldStore.getState()
    const fresh = s.events.slice(before)
    expect(fresh.every((e) => e.t === T)).toBe(true)
    expect(fresh[0].text).toMatch(/EXPIRED/)
    // The riot at T took the slot the expiry freed (riot hook rolled a
    // priority contract), so the generation check after it found the market
    // full: it rescheduled without rolling. Any other order changes the feed.
    expect(fresh.map((e) => e.kind)).toEqual(['contract', 'riot', 'contract'])
    expect(fresh[2].text).toMatch(/^PRIORITY CONTRACT .* POSTED IN /)
    expect(fresh.some((e) => /^OPEN CONTRACT/.test(e.text))).toBe(false)
    expect(s.contracts).toHaveLength(CONTRACT_TARGET)
    expect(s.contracts.filter((c) => c.createdT === T)).toHaveLength(1)
    expect(s.nextContractT).toBeGreaterThan(T)
    expect(s.nextEventT).toBeGreaterThan(T)
  })

  it('a staged spend at T lands before pressure: decay re-checks the new unrest', () => {
    pinFlows()
    const T2 = TAX_INTERVAL_SEC
    useWorldStore.setState({
      t: T2 - 1,
      sectors: { ...useWorldStore.getState().sectors, na: { control: 50, unrest: 61 } },
      spends: [{ action: 'stabilize', sector: 'na', nextT: T2, remaining: 1 }],
      pressure: { na: T2 },
      nextTaxT: T2,
    })
    const credits0 = useAppStore.getState().credits
    useWorldStore.getState().tick(0.01)
    const s = useWorldStore.getState()
    // Stabilize took unrest to 59, under the pressure threshold, so the decay
    // timer due at the same T was dropped before it could fire.
    expect(s.sectors.na).toEqual({ control: 50, unrest: 59 })
    expect(s.pressure.na).toBeUndefined()
    expect(s.spends).toEqual([])
    expect(useAppStore.getState().credits).toBe(credits0 + taxOn(s.sectors))
    expect(s.nextTaxT).toBe(2 * T2)
  })

  it('Tax yield at T reads Control after pressure at T', () => {
    pinFlows()
    const T2 = TAX_INTERVAL_SEC
    useWorldStore.setState({
      t: T2 - 1,
      sectors: { ...useWorldStore.getState().sectors, na: { control: 50, unrest: 70 } },
      pressure: { na: T2 },
      nextTaxT: T2,
    })
    const credits0 = useAppStore.getState().credits
    useWorldStore.getState().tick(0.01)
    const s = useWorldStore.getState()
    const drop = 50 - s.sectors.na.control
    expect(drop).toBeGreaterThanOrEqual(PRESSURE_CONTROL_DROP_MIN)
    expect(drop).toBeLessThanOrEqual(PRESSURE_CONTROL_DROP_MAX)
    const paid = useAppStore.getState().credits - credits0
    expect(paid).toBe(taxOn(s.sectors))
    expect(paid).not.toBe(taxYieldCredits(6000, 50, 70))
    expect(s.pressure.na).toBe(T2 + PRESSURE_INTERVAL_SEC)
  })

  it('the equal-timestamp market collision lands identically by jump and by frames', () => {
    stageMarketCollision()
    useWorldStore.getState().advanceDays(1)
    const jump = flowSnapshot()
    const jumpCredits = useAppStore.getState().credits

    useWorldStore.setState(structuredClone(snapshot))
    useAppStore.setState({ credits: INITIAL_CREDITS })
    stageMarketCollision()
    for (let i = 0; i < DAY / 30; i++) useWorldStore.getState().tick(0.25)
    expect(flowSnapshot()).toEqual(jump)
    expect(useAppStore.getState().credits).toBe(jumpCredits)
  })

  // Starts off a due boundary so a rearm from the jump time would show.
  const T0 = 1000
  function stageRearm(): void {
    pinFlows()
    useWorldStore.setState({
      t: T0,
      sectors: { ...useWorldStore.getState().sectors, na: { control: 50, unrest: 70 } },
      spends: [{ action: 'lobby', sector: 'eu', nextT: 5400, remaining: 100 }],
      pressure: { na: 3600 },
      nextTaxT: TAX_INTERVAL_SEC,
    })
  }

  it('an ETA jump fires each due at its timestamp and rearms from that due t', () => {
    stageRearm()
    const eu0 = useWorldStore.getState().sectors.eu.control
    const credits0 = useAppStore.getState().credits
    useWorldStore.getState().advanceDays(1)
    const s = useWorldStore.getState()
    const end = T0 + DAY
    expect(s.t).toBe(end)
    // Tax due at 86400 fired once and rearmed from 86400, not from the jump t.
    expect(s.nextTaxT).toBe(2 * TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBeGreaterThan(credits0)
    // Pressure due 3600, 25200, 46800, 68400: four steps, next at 90000.
    expect(s.pressure.na).toBe(3600 + 4 * PRESSURE_INTERVAL_SEC)
    expect(s.pressure.na).not.toBe(end + PRESSURE_INTERVAL_SEC)
    const drop = 50 - s.sectors.na.control
    expect(drop).toBeGreaterThanOrEqual(4 * PRESSURE_CONTROL_DROP_MIN)
    expect(drop).toBeLessThanOrEqual(4 * PRESSURE_CONTROL_DROP_MAX)
    // Lobby steps every 5400s from 5400: 16 land by 87400, the 17th is pending.
    expect(s.spends).toEqual([
      { action: 'lobby', sector: 'eu', nextT: 17 * 5400, remaining: 84 },
    ])
    expect(s.sectors.eu.control).toBe(eu0 + 16)
  })

  it('advanceDays and a run of ticks fire the same mixed dues in the same order', () => {
    stageRearm()
    useWorldStore.setState({ nextEventT: 2000, nextContractT: 2500 })
    useWorldStore.getState().advanceDays(1)
    const jump = flowSnapshot()
    const jumpCredits = useAppStore.getState().credits

    useWorldStore.setState(structuredClone(snapshot))
    useAppStore.setState({ credits: INITIAL_CREDITS })
    stageRearm()
    useWorldStore.setState({ nextEventT: 2000, nextContractT: 2500 })
    for (let i = 0; i < DAY / 30; i++) useWorldStore.getState().tick(0.25)
    expect(flowSnapshot()).toEqual(jump)
    expect(useAppStore.getState().credits).toBe(jumpCredits)
  })

  it('a loss debrief at t0 leaves strategic t at t0 and emits no Tax from ETA', () => {
    const t0 = 5 * 3600
    useWorldStore.setState({ t: t0, nextTaxT: t0 + 60 })
    const before = flowSnapshot()
    const credits0 = useAppStore.getState().credits
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0 }))
    const s = useWorldStore.getState()
    expect(s.t).toBe(t0)
    expect(s.nextTaxT).toBe(before.nextTaxT)
    expect(s.nextEventT).toBe(before.nextEventT)
    expect(s.nextContractT).toBe(before.nextContractT)
    expect(useAppStore.getState().credits).toBe(credits0)
  })
})

describe('Debrief write-back at frozen t0, then ETA (ADR-0001, ADR-0021)', () => {
  const T0 = 5 * 3600
  const data = (s: object) =>
    structuredClone(Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')))
  const intel = () => {
    const c = useCampaignStore.getState()
    return { intelLevel: c.intelLevel, intelProgress: c.intelProgress }
  }

  beforeEach(() => {
    useCampaignStore.setState(initialCampaignData())
    useAppStore.setState({
      phase: 'debrief',
      missionId: 'm01',
      outcome: null,
      loadout: {},
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    useWorldStore.setState({ t: T0, nextTaxT: T0 + 60 })
  })

  // Runs applyDebrief with spies on the World Network write-back and the ETA
  // jump, recording the order and the board each one saw on entry.
  function applyWithSpies(o: MissionOutcome) {
    const world = useWorldStore.getState()
    const origApply = world.applyMissionResult
    const origAdvance = world.advanceDays
    const calls: {
      name: string
      t: number
      flow: ReturnType<typeof flowSnapshot>
      intel: ReturnType<typeof intel>
    }[] = []
    const record = (name: string) =>
      calls.push({ name, t: useWorldStore.getState().t, flow: flowSnapshot(), intel: intel() })
    useWorldStore.setState({
      applyMissionResult: (...args) => {
        record('applyMissionResult')
        origApply(...args)
      },
      advanceDays: (days) => {
        record('advanceDays')
        origAdvance(days)
      },
    })
    try {
      useAppStore.setState({ outcome: o })
      applyDebrief('m01')
    } finally {
      useWorldStore.setState({ applyMissionResult: origApply, advanceDays: origAdvance })
    }
    return calls
  }

  it('a win writes Control, Unrest, ownership, Influence and Intel from S at t0, then the ETA advances t', () => {
    const o = outcome({ civiliansHit: 1 })
    const S = data(useWorldStore.getState())
    // The write-back the same mutators make on S at t0, with no clock move.
    useCampaignStore.getState().reportMission('m01', o, T0)
    useWorldStore.getState().applyMissionResult('m01', o, [])
    const expected = flowSnapshot()
    const expectedIntel = intel()
    expect(expected.sectors.eu).not.toEqual((S as { sectors: Record<string, SectorState> }).sectors.eu)

    useWorldStore.setState(structuredClone(S))
    useCampaignStore.setState(initialCampaignData())
    const flowS = flowSnapshot()
    const calls = applyWithSpies(o)

    expect(calls.map((c) => c.name)).toEqual(['applyMissionResult', 'advanceDays'])
    expect(calls[0].t).toBe(T0)
    // Nothing before the write-back touched the board: it still reads S.
    expect(calls[0].flow).toEqual(flowS)
    // On entry to the ETA jump the board is exactly S written back at t0.
    expect(calls[1].t).toBe(T0)
    expect(calls[1].flow).toEqual(expected)
    expect(calls[1].intel).toEqual(expectedIntel)
    // That board carries the mission-result Feed line stamped at t0 and the
    // moved sector (WN-017), not just equality with the reference run.
    const sector = resolveMission('m01')!.sector
    expect(
      calls[1].flow.events.some(
        (e) => e.t === T0 && e.sector === sector && e.kind === 'seizure' && e.tone === 'green',
      ),
    ).toBe(true)
    expect(calls[1].flow.sectors[sector].control).toBeGreaterThan(flowS.sectors[sector].control)
    expect(calls[1].flow.sectors[sector].unrest).toBeLessThan(flowS.sectors[sector].unrest)
    // Only after that does catch-up move the clock.
    const eta = resolveMission('m01')?.etaDays ?? 0
    expect(eta).toBeGreaterThan(0)
    expect(useWorldStore.getState().t).toBe(T0 + eta * DAY)
  })

  it('a loss writes back at t0 and spends no ETA', () => {
    const calls = applyWithSpies(outcome({ won: false }))
    expect(calls.map((c) => c.name)).toEqual(['applyMissionResult'])
    expect(calls[0].t).toBe(T0)
    expect(useWorldStore.getState().t).toBe(T0)
  })
})

describe('Opening desk and post-win Scan (WN-017)', () => {
  const T0 = 5 * 3600

  beforeEach(() => {
    useCampaignStore.setState(initialCampaignData())
    useAppStore.setState({
      phase: 'debrief',
      missionId: 'm01',
      outcome: null,
      loadout: {},
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    useWorldStore.setState({ ...structuredClone(snapshot), t: T0, nextTaxT: T0 + 3600 * 24 * 30 })
    useMissionStore.getState().reset()
  })

  // Store half of the opening minute. "Four numbers print" and "contract select
  // is not the only enabled verb" are DOM checks, covered by the retained
  // click-through evidence (production/qa/evidence/wn-017/), not here.
  it('opening desk on a fresh board: Focus walks the six open sectors, Pause holds t, speed scales the advance', () => {
    useAppStore.setState({ phase: 'world', missionId: null })
    pinFlows()
    const w = () => useWorldStore.getState()
    expect(OPEN_SECTORS.length).toBe(6)
    const seen: string[] = []
    for (let i = 0; i < OPEN_SECTORS.length; i += 1) {
      seen.push(w().selected)
      w().stepSector(1)
    }
    expect(new Set(seen)).toEqual(new Set(OPEN_SECTORS))
    expect(w().selected).toBe(seen[0])
    const t = w().t
    w().togglePause()
    w().tick(1)
    expect(w().t).toBe(t)
    w().togglePause()
    w().setSpeed(1)
    w().tick(1)
    const slow = w().t - t
    expect(slow).toBeGreaterThan(0)
    w().setSpeed(8)
    const t2 = w().t
    w().tick(1)
    expect(w().t - t2).toBe(slow * 8)
  })

  it('a first clean win from Influence 0 reads 8 after write-back and ETA, on the live post-ETA board', () => {
    expect(useWorldStore.getState().influence).toBe(0)
    useAppStore.setState({ outcome: outcome({ civiliansHit: 0 }) })
    applyDebrief('m01')
    const eta = resolveMission('m01')?.etaDays ?? 0
    expect(eta).toBeGreaterThan(0)
    const s = useWorldStore.getState()
    expect(s.t).toBe(T0 + eta * DAY)
    expect(s.review).toBeNull()
    // The AC reads the literal header value: 6 for the win plus 2 clean.
    expect(s.influence).toBe(8)
    expect(s.spends).toEqual([])
  })

  it('the apply reads the outcome DTO, not the running mission store', () => {
    // The mission store says collateral; the DTO says clean. The DTO wins.
    useMissionStore.getState().setCiviliansHit(3)
    useMissionStore.getState().setResult('lost')
    useAppStore.setState({ outcome: outcome({ civiliansHit: 0, won: true }) })
    applyDebrief('m01')
    expect(useWorldStore.getState().influence).toBe(INFLUENCE_WIN_PTS + INFLUENCE_CLEAN_PTS)
  })

  it('a second apply of the same key changes nothing (ADR-0021)', () => {
    useAppStore.setState({ outcome: outcome({ civiliansHit: 0 }) })
    applyDebrief('m01')
    const world = flowSnapshot()
    const credits = useAppStore.getState().credits
    const key = useAppStore.getState().lastAppliedKey
    applyDebrief('m01')
    expect(flowSnapshot()).toEqual(world)
    expect(useAppStore.getState().credits).toBe(credits)
    expect(useAppStore.getState().lastAppliedKey).toBe(key)
  })
})

describe('Quiet replay awards nothing; ETA still catches up', () => {
  const T0 = 5 * 3600

  beforeEach(() => {
    useCampaignStore.setState(initialCampaignData())
    useAppStore.setState({
      phase: 'debrief',
      missionId: 'm01',
      outcome: null,
      loadout: {},
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    useWorldStore.setState({ t: T0, nextTaxT: T0 + 60 })
  })

  function applyWithBoundary(o: MissionOutcome) {
    const world = useWorldStore.getState()
    const origApply = world.applyMissionResult
    const origAdvance = world.advanceDays
    const calls: {
      name: string
      t: number
      flow: ReturnType<typeof flowSnapshot>
      intel: { intelLevel: number; intelProgress: number }
      credits: number
    }[] = []
    const record = (name: string) => {
      const c = useCampaignStore.getState()
      calls.push({
        name,
        t: useWorldStore.getState().t,
        flow: flowSnapshot(),
        intel: { intelLevel: c.intelLevel, intelProgress: c.intelProgress },
        credits: useAppStore.getState().credits,
      })
    }
    useWorldStore.setState({
      applyMissionResult: (missionId: string, result: MissionOutcome, kia?: string[]) => {
        record('applyMissionResult')
        origApply(missionId, result, kia)
      },
      advanceDays: (days: number) => {
        record('advanceDays')
        origAdvance(days)
      },
    })
    try {
      useAppStore.setState({ outcome: o })
      applyDebrief('m01')
    } finally {
      useWorldStore.setState({ applyMissionResult: origApply, advanceDays: origAdvance })
    }
    return calls
  }

  function advanceBoundary(calls: ReturnType<typeof applyWithBoundary>) {
    const boundary = calls.find((c) => c.name === 'advanceDays')
    expect(boundary).toBeDefined()
    if (!boundary) throw new Error('advanceDays was not called')
    return boundary
  }

  function armQuietBoard() {
    const world = useWorldStore.getState()
    const eu = world.sectors.eu
    useWorldStore.setState({ influence: 11 })
    useCampaignStore.setState({ intelLevel: 3, intelProgress: 17 })
    return { control: eu.control, unrest: eu.unrest, holder: world.owner.nc }
  }

  function armLossRetryBoard() {
    const world = useWorldStore.getState()
    useWorldStore.setState({
      influence: 0,
      owner: { ...world.owner, nc: 'helix' },
      sectors: {
        ...world.sectors,
        eu: { ...world.sectors.eu, unrest: 40 },
      },
    })
    expect(useWorldStore.getState().sectors.eu.control).toBeLessThan(CONTROL_MAX)
    expect(useWorldStore.getState().owner.nc).not.toBe('nexus')
  }

  it('quiet-replay win write-back before ETA — Influence, Intel, Control, Unrest, holder and t stay at t0', () => {
    const board = armQuietBoard()
    const calls = applyWithBoundary(
      outcome({ won: true, quietReplay: true, civiliansHit: 0, applyKey: 1 }),
    )
    const boundary = advanceBoundary(calls)
    expect(boundary.t).toBe(T0)
    expect(boundary.flow.influence).toBe(11)
    expect(boundary.intel).toEqual({ intelLevel: 3, intelProgress: 17 })
    expect(boundary.flow.sectors.eu.control).toBe(board.control)
    expect(boundary.flow.sectors.eu.unrest).toBe(board.unrest)
    expect(boundary.flow.owner.nc).toBe(board.holder)
  })

  it('quiet-replay ETA catch-up — matches continuous ticking, including Tax deposits', () => {
    armQuietBoard()
    const calls = applyWithBoundary(
      outcome({ won: true, quietReplay: true, civiliansHit: 0, applyKey: 1 }),
    )
    const boundary = advanceBoundary(calls)
    expect(boundary.t).toBe(T0)
    const jump = flowSnapshot()
    const jumpCredits = useAppStore.getState().credits
    const eta = resolveMission('m01')?.etaDays ?? 0
    expect(eta).toBe(2)
    expect(jump.t).toBe(T0 + eta * DAY)

    useWorldStore.setState(structuredClone(boundary.flow))
    useWorldStore.setState({ paused: false, speed: 2 })
    useAppStore.setState({ credits: boundary.credits })
    expect(useWorldStore.getState().speed).toBe(2)
    for (let i = 0; i < (eta * DAY) / 30; i++) useWorldStore.getState().tick(0.25)

    expect(flowSnapshot()).toEqual(jump)
    expect(useAppStore.getState().credits).toBe(jumpCredits)
  })

  it('loss retry with civiliansHit 0 — Influence 8, Intel 80, Control rises, holder Nexus before ETA', () => {
    armLossRetryBoard()
    const startControl = useWorldStore.getState().sectors.eu.control
    const calls = applyWithBoundary(
      outcome({ won: true, quietReplay: false, civiliansHit: 0, applyKey: 1 }),
    )
    const boundary = advanceBoundary(calls)
    expect(boundary.t).toBe(T0)
    expect(boundary.flow.influence).toBe(8)
    expect(boundary.intel).toEqual({ intelLevel: 1, intelProgress: 80 })
    expect(boundary.flow.sectors.eu.control).toBeGreaterThan(startControl)
    expect(boundary.flow.owner.nc).toBe('nexus')
  })

  it('loss retry with civiliansHit >= 1 — Influence 6, Intel 65, Control rises, holder Nexus, Unrest above the clean retry', () => {
    armLossRetryBoard()
    const start = {
      flow: flowSnapshot(),
      control: useWorldStore.getState().sectors.eu.control,
      credits: useAppStore.getState().credits,
      lastAppliedKey: useAppStore.getState().lastAppliedKey,
      campaign: structuredClone({
        intelLevel: useCampaignStore.getState().intelLevel,
        intelProgress: useCampaignStore.getState().intelProgress,
        operatives: useCampaignStore.getState().operatives,
        roster: useCampaignStore.getState().roster,
        candidates: useCampaignStore.getState().candidates,
        recruitRngState: useCampaignStore.getState().recruitRngState,
        nextCandidateT: useCampaignStore.getState().nextCandidateT,
        contractsWon: useCampaignStore.getState().contractsWon,
        campaignWon: useCampaignStore.getState().campaignWon,
        campaignFailed: useCampaignStore.getState().campaignFailed,
        lastReport: useCampaignStore.getState().lastReport,
      }),
    }
    const clean = advanceBoundary(
      applyWithBoundary(outcome({ won: true, quietReplay: false, civiliansHit: 0, applyKey: 1 })),
    )
    useWorldStore.setState(structuredClone(start.flow))
    useCampaignStore.setState(structuredClone(start.campaign))
    useAppStore.setState({
      lastAppliedKey: start.lastAppliedKey,
      outcome: null,
      credits: start.credits,
    })
    const dirty = advanceBoundary(
      applyWithBoundary(outcome({ won: true, quietReplay: false, civiliansHit: 1, applyKey: 1 })),
    )
    expect(dirty.t).toBe(T0)
    expect(dirty.flow.influence).toBe(6)
    expect(dirty.intel).toEqual({ intelLevel: 1, intelProgress: 65 })
    expect(dirty.flow.sectors.eu.control).toBeGreaterThan(start.control)
    expect(dirty.flow.owner.nc).toBe('nexus')
    expect(dirty.flow.sectors.eu.unrest).toBeGreaterThan(clean.flow.sectors.eu.unrest)
  })

  it('setOutcome with quietReplay false on an already-won contract — leaves the flag false', () => {
    useCampaignStore.setState({ contractsWon: ['m01'] })
    const o = outcome({ quietReplay: false })
    useAppStore.getState().setOutcome(o)
    expect(o.quietReplay).toBe(false)
    expect(useAppStore.getState().outcome?.quietReplay).toBe(false)
  })
})

describe('stabilize staged effect over six hourly steps', () => {
  const STAB = INFLUENCE_ACTIONS.stabilize
  const HOUR = STAB.stepSec

  // Open sector at the given Unrest, Influence 8, off cooldown, every other
  // timed flow pinned away so nothing else can move Unrest. Returns the
  // activation instant.
  function activate(unrest: number): number {
    pinFlows()
    const prev = useWorldStore.getState().sectors.eu
    useWorldStore.setState({
      influence: STAB.cost,
      contracts: [],
      cooldowns: {},
      spends: [],
      sectors: { ...useWorldStore.getState().sectors, eu: { ...prev, unrest } },
    })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    return useWorldStore.getState().t
  }

  const unrestOf = () => useWorldStore.getState().sectors.eu.unrest

  it('uses the GDD values: six steps of -2 every world hour, clamped at 2-96', () => {
    expect(STAB.steps).toBe(6)
    expect(STAB.unrestDelta).toBe(-2)
    expect(STAB.stepSec).toBe(3600)
    expect(UNREST_MAX).toBe(96)
    expect(UNREST_MIN).toBe(2)
  })

  it('Unrest 18, Influence 8: wallet empties at once, Unrest falls 2 per hour to 6', () => {
    const t0 = activate(18)
    // Right after activation: Influence spent, Unrest untouched, not a -12.
    let s = useWorldStore.getState()
    expect(s.influence).toBe(0)
    expect(s.sectors.eu.unrest).toBe(18)
    expect(s.spends).toHaveLength(1)
    expect(s.spends[0].remaining).toBe(STAB.steps)
    for (let step = 1; step <= STAB.steps; step++) {
      crossTo(t0 + step * HOUR)
      s = useWorldStore.getState()
      expect(s.sectors.eu.unrest).toBe(18 - 2 * step)
    }
    expect(unrestOf()).toBe(6)
    expect(s.spends).toEqual([])
    expect(s.influence).toBe(0)
  })

  it('Unrest 12 ends at 2, not 0, because each step respects the clamp', () => {
    const t0 = activate(12)
    expect(useWorldStore.getState().influence).toBe(0)
    expect(unrestOf()).toBe(12)
    crossTo(t0 + STAB.steps * HOUR)
    expect(unrestOf()).toBe(UNREST_MIN)
    expect(useWorldStore.getState().spends).toEqual([])
  })

  it('Unrest 2 stays 2, Influence stays 0, and the spend retires', () => {
    const t0 = activate(2)
    expect(useWorldStore.getState().influence).toBe(0)
    expect(unrestOf()).toBe(2)
    crossTo(t0 + STAB.steps * HOUR)
    const s = useWorldStore.getState()
    expect(s.sectors.eu.unrest).toBe(UNREST_MIN)
    expect(s.influence).toBe(0)
    expect(s.spends).toEqual([])
  })

  it('six hours via tick and via advanceDays reach the same Unrest', () => {
    const span = STAB.steps * HOUR
    activate(18)
    useWorldStore.getState().advanceDays(span / DAY)
    const jump = flowSnapshot()
    expect(jump.sectors.eu.unrest).toBe(6)
    expect(jump.spends).toEqual([])

    // Same start in frames: 0.25s frames at speed 2 advance exactly 30 world
    // seconds each, so every hourly step lands on its own boundary.
    useWorldStore.setState(structuredClone(snapshot))
    activate(18)
    for (let i = 0; i < span / 30; i++) useWorldStore.getState().tick(0.25)
    expect(flowSnapshot()).toEqual(jump)
  })
})

// Story 019 (TR-economy-006): the generation checkpoint caps the market at
// CONTRACT_TARGET counting every open record — a Locked-hidden offer (Intel
// above the director's level) still holds its slot — and rearms 2-6 world
// hours from the due timestamp. The client check lives in contracts.test.ts.
describe('generated market cap and roll timer (story 019)', () => {
  const T = 10_000

  // One open offer the director cannot see at the starting Intel level.
  function lockedHidden(seed: number): GeneratedContract {
    const c = craft('af', seed, 'SEVERE')
    expect(visibleContracts([c], INTEL_LEVEL)).toEqual([])
    return c
  }

  // Stages the market and fires exactly one generation due at T.
  function fireGenerationDue(contracts: GeneratedContract[], contractRngState?: number): void {
    pinFlows()
    useWorldStore.setState({
      contracts,
      nextContractT: T,
      ...(contractRngState === undefined ? {} : { contractRngState }),
    })
    crossTo(T)
  }

  // The schedule draw is the last step on the market cursor: undo the
  // mulberry increment to read back the value the rearm used.
  function lastDraw(state: number): number {
    return mulberryStep((state - 0x6d2b79f5) >>> 0)[0]
  }

  it('3 open instances (one Locked-hidden) stay 3 when a generation due fires', () => {
    const open = [craft('eu', 0x101), craft('eu', 0x102, 'MODERATE'), lockedHidden(0x103)]
    fireGenerationDue(open)
    const s = useWorldStore.getState()
    expect(s.contracts).toHaveLength(CONTRACT_TARGET)
    expect(s.contracts).toEqual(open)
    expect(s.events.some((e) => e.t === T && /^OPEN CONTRACT/.test(e.text))).toBe(false)
  })

  it('3 Locked-hidden instances still fill the cap', () => {
    const open = [lockedHidden(0x111), lockedHidden(0x112), lockedHidden(0x113)]
    fireGenerationDue(open)
    expect(useWorldStore.getState().contracts).toEqual(open)
  })

  it('2 open instances (one Locked-hidden) become 3 when a generation due fires', () => {
    const open = [craft('eu', 0x121), lockedHidden(0x122)]
    fireGenerationDue(open)
    const s = useWorldStore.getState()
    expect(s.contracts).toHaveLength(CONTRACT_TARGET)
    expect(s.contracts.slice(0, 2)).toEqual(open)
    expect(s.contracts[2].createdT).toBe(T)
    expect(s.events.filter((e) => e.t === T && /^OPEN CONTRACT .* POSTED IN /.test(e.text))).toHaveLength(1)
  })

  it('after a roll under the cap the next roll is due 2-6 strategic hours later, rearmed from the due', () => {
    fireGenerationDue([craft('eu', 0x131)])
    const s = useWorldStore.getState()
    expect(s.contracts).toHaveLength(2)
    const gap = s.nextContractT - T
    expect(gap).toBeGreaterThanOrEqual(2 * 3600)
    expect(gap).toBeLessThan(6 * 3600)
    expect(gap).toBe(CONTRACT_MIN_SEC + lastDraw(s.contractRngState) * CONTRACT_SPAN_SEC)
  })

  it('the rearm window reaches both ends across market cursors and never leaves 2-6 h', () => {
    let lo = Infinity
    let hi = -Infinity
    for (let i = 0; i < 256; i++) {
      useWorldStore.setState(structuredClone(snapshot))
      fireGenerationDue([], (0x9e3779b9 * (i + 1)) >>> 0)
      const s = useWorldStore.getState()
      expect(s.contracts).toHaveLength(1)
      const gap = s.nextContractT - T
      expect(gap).toBeGreaterThanOrEqual(CONTRACT_MIN_SEC)
      expect(gap).toBeLessThan(CONTRACT_MIN_SEC + CONTRACT_SPAN_SEC)
      lo = Math.min(lo, gap)
      hi = Math.max(hi, gap)
    }
    expect(lo).toBeLessThan(CONTRACT_MIN_SEC + 0.05 * CONTRACT_SPAN_SEC)
    expect(hi).toBeGreaterThan(CONTRACT_MIN_SEC + 0.95 * CONTRACT_SPAN_SEC)
  })

  it('the roll and rearm are deterministic from contractRngState', () => {
    fireGenerationDue([craft('eu', 0x141)], 0xc0ffee)
    const first = structuredClone({
      contracts: useWorldStore.getState().contracts,
      contractRngState: useWorldStore.getState().contractRngState,
      nextContractT: useWorldStore.getState().nextContractT,
    })
    useWorldStore.setState(structuredClone(snapshot))
    fireGenerationDue([craft('eu', 0x141)], 0xc0ffee)
    const second = useWorldStore.getState()
    expect(second.contracts).toEqual(first.contracts)
    expect(second.contractRngState).toBe(first.contractRngState)
    expect(second.nextContractT).toBe(first.nextContractT)
  })
})
