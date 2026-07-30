import { beforeEach, describe, expect, it } from 'vitest'
import {
  DAY,
  MAX_DT,
  TIME_SCALE,
  hhmm,
  initialOwner,
  resolveMission,
  stamp,
  useWorldStore,
} from './worldStore'
import { CITIES, CITIES_BY_SECTOR, HOLDERS, OPEN_SECTORS, SECTORS } from '../game/atlas'
import {
  CONTRACT_EXPIRY_MIN_SEC,
  CONTRACT_MIN_SEC,
  CONTRACT_SPAN_SEC,
  CONTRACT_TARGET,
  PRIORITY_EXPIRY_MIN_SEC,
  PRIORITY_EXPIRY_SPAN_SEC,
  sectorClient,
} from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import type { SectorId } from '../game/types'
import type { MissionOutcome } from './appStore'

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
})

beforeEach(() => {
  useWorldStore.setState(structuredClone(snapshot))
})

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
      expect(sectors[id].unrest).toBeLessThanOrEqual(74)
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

describe('generated contracts', () => {
  // A hand-built record for hook tests: far expiry, client matching the
  // sector's dominant holder, so only the code under test moves it.
  function craft(sector: SectorId, seed: number): GeneratedContract {
    return {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: 0,
      expiresAtT: 1e9,
      sector,
      cityId: CITIES_BY_SECTOR[sector][0].id,
      district: 5,
      type: 'SEIZURE',
      client: sectorClient(sector, initialOwner()),
      threat: 'HIGH',
      reward: 50000,
      seed,
      priority: false,
    }
  }

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
    expect(after.events.at(-1)?.tone).toBe('green')
    expect(after.events.at(-1)?.text).toContain('STRIKE TEAM 04 OPENS')
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
    const jump = structuredClone({
      t: useWorldStore.getState().t,
      sectors: useWorldStore.getState().sectors,
      owner: useWorldStore.getState().owner,
      events: useWorldStore.getState().events,
      nextEventT: useWorldStore.getState().nextEventT,
      rngState: useWorldStore.getState().rngState,
      contracts: useWorldStore.getState().contracts,
      contractRngState: useWorldStore.getState().contractRngState,
      nextContractT: useWorldStore.getState().nextContractT,
    })

    useWorldStore.setState(structuredClone(snapshot))
    // 0.25s frames at speed 2 advance exactly 30 world seconds each.
    for (let i = 0; i < (2 * DAY) / 30; i++) useWorldStore.getState().tick(0.25)
    const cont = useWorldStore.getState()
    expect(cont.t).toBe(jump.t)
    expect(cont.sectors).toEqual(jump.sectors)
    expect(cont.owner).toEqual(jump.owner)
    expect(cont.events).toEqual(jump.events)
    expect(cont.nextEventT).toBe(jump.nextEventT)
    expect(cont.rngState).toBe(jump.rngState)
    expect(cont.contracts).toEqual(jump.contracts)
    expect(cont.contractRngState).toBe(jump.contractRngState)
    expect(cont.nextContractT).toBe(jump.nextContractT)
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
    expect(after.owner).toEqual(before.owner)
    expect(after.events.at(-1)).toMatchObject({
      sector: 'eu',
      tone: 'green',
      text: 'STRIKE TEAM 04 OPENS DISTRICT 07 IN NEW CARTHAGE',
    })
    expect(after.unread).toBe(before.unread + 1)
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
      id: lastId + 2,
      sector: 'eu',
      kind: 'kia',
      tone: 'red',
      text: 'OPERATIVES MARA, GHOST KIA IN NEW CARTHAGE',
    })
    // The result event still lands right before the loss line.
    expect(after.events.at(-2)?.tone).toBe('green')
    expect(after.unread).toBe(unread + 2)
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
