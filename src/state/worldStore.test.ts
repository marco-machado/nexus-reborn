import { beforeEach, describe, expect, it } from 'vitest'
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
  sectorClient,
} from '../game/contracts'
import type { ContractThreat, GeneratedContract } from '../game/contracts'
import {
  EXPEDITE_EXTENSION_SEC,
  INFLUENCE_ACTIONS,
  INFLUENCE_CLEAN_PTS,
  INFLUENCE_WIN_PTS,
  PRESSURE_CONTROL_DROP_MAX,
  PRESSURE_CONTROL_DROP_MIN,
  PRESSURE_INTERVAL_SEC,
  TAX_INTERVAL_SEC,
  UNREST_MAX,
  cooldownKey,
} from '../game/influence'
import { FORECAST_KINDS, kindWeights } from '../game/forecast'
import type { SectorId } from '../game/types'
import type { MissionOutcome } from './appStore'
import type { SectorState } from './worldStore'

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
    won: true,
    kills: 7,
    casualties: 0,
    timeSec: 300,
    civiliansHit: 0,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
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
