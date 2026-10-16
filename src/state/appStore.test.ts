import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COLLATERAL_FINE,
  INITIAL_CREDITS,
  collateralFine,
  isPaid,
  netPayout,
  priceOutcome,
  settleOutcome,
  useAppStore,
} from './appStore'
import type { MissionOutcome, MissionResult } from './appStore'
import { DEFAULT_SQUAD, MISSIONS, ROSTER, operativeById } from '../game/data'
import { BRANCH_IDS, NODES, nodeById, nodeTitle, nodesOfBranch, wornNode } from '../game/research'
import { INFLUENCE_ACTIONS, TAX_INTERVAL_SEC } from '../game/influence'
import {
  initialCampaignData,
  liveOperativeById,
  remainingDowntimeSec,
  useCampaignStore,
} from './campaignStore'
import { eligibilityText, labsRunning, nodeState, useResearchStore } from './researchStore'
import { DAY, initialOwner, resolveMission, sectorReadout, useWorldStore } from './worldStore'
import { CITIES_BY_SECTOR } from '../game/atlas'
import { sectorClient } from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import { applyDebrief } from './debrief'
import { SAVE_KEY, captureSave, readSave, startAutosave, validateSave } from './save'
import type { SaveStorage } from './save'
import { assignedMassKg } from '../game/deployGate'
import { ARMOR_KG_PER_HP, MASS_LIMIT_KG } from '../game/mass'
import { xpBonus } from '../game/experience'
import { economySlice } from '../game/deploy'
import { freezeDeploy } from './deployFreeze'
import { createWorld } from '../game/world'
import { useMissionStore } from './missionStore'
import { abortMission, composeMission, teardownMission } from './missionLifecycle'
import { useSettingsStore } from './settingsStore'
import { loadRecords } from './telemetry'
import { getWorld, setWorld } from '../game/runtime'
import { visibleContracts } from '../game/contracts'

// World-store boot snapshot for the economy integration suite, captured at
// module load before any test moves the singleton.
const w0 = useWorldStore.getState()
const worldBoot = structuredClone({
  t: w0.t,
  speed: w0.speed,
  paused: w0.paused,
  sectors: w0.sectors,
  owner: w0.owner,
  events: w0.events,
  unread: w0.unread,
  selected: w0.selected,
  review: w0.review,
  nextEventT: w0.nextEventT,
  rngState: w0.rngState,
  contracts: w0.contracts,
  contractRngState: w0.contractRngState,
  nextContractT: w0.nextContractT,
  influence: w0.influence,
  nextTaxT: w0.nextTaxT,
  spends: w0.spends,
  cooldowns: w0.cooldowns,
  crisis: w0.crisis,
  pressure: w0.pressure,
})

// Captured at module load, before any test mutates the singleton.
const bootState = useAppStore.getState()
const boot = {
  phase: bootState.phase,
  missionId: bootState.missionId,
  squad: [...bootState.squad],
  credits: bootState.credits,
  outcome: bootState.outcome,
}

const START_CREDITS = 128450

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return settleOutcome({
    applyKey: 1,
    won: true,
    kills: 6,
    casualties: 1,
    timeSec: 412,
    civiliansHit: 0,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
    ...over,
  })
}

beforeEach(() => {
  useAppStore.setState({
    phase: 'menu',
    missionId: null,
    squad: [...DEFAULT_SQUAD],
    loadout: {},
    credits: START_CREDITS,
    outcome: null,
    deploySerial: 0,
    lastAppliedKey: 0,
  })
  useCampaignStore.setState(initialCampaignData())
})

describe('initial state', () => {
  it('boots on the menu with the default squad, starting credits and no outcome', () => {
    expect(boot).toEqual({
      phase: 'menu',
      missionId: null,
      squad: DEFAULT_SQUAD,
      credits: START_CREDITS,
      outcome: null,
    })
  })

  it('copies the default squad instead of sharing the array', () => {
    expect(bootState.squad).not.toBe(DEFAULT_SQUAD)
  })
})

describe('setLoadout', () => {
  it('fills one slot and leaves the other empty', () => {
    useAppStore.getState().setLoadout('op1', 0, 'med')
    expect(useAppStore.getState().loadout).toEqual({ op1: ['med', null] })
    useAppStore.getState().setLoadout('op1', 1, 'cell')
    expect(useAppStore.getState().loadout).toEqual({ op1: ['med', 'cell'] })
  })

  it('clears a slot back to empty without touching other operatives', () => {
    useAppStore.getState().setLoadout('op1', 0, 'med')
    useAppStore.getState().setLoadout('op2', 0, 'cell')
    useAppStore.getState().setLoadout('op1', 0, null)
    expect(useAppStore.getState().loadout).toEqual({
      op1: [null, null],
      op2: ['cell', null],
    })
  })

  it('fills both slots when m + c = 2 and refuses neither fill (RA-002, AC 48)', () => {
    useAppStore.getState().setLoadout('op1', 0, 'med')
    useAppStore.getState().setLoadout('op1', 1, 'med')
    expect(useAppStore.getState().loadout.op1).toEqual(['med', 'med'])
    // A third item has no slot to land in; the two filled slots stay put.
    useAppStore.getState().setLoadout('op1', 2, 'cell')
    expect(useAppStore.getState().loadout.op1).toEqual(['med', 'med'])
  })

  it('ignores an out-of-range slot index', () => {
    useAppStore.getState().setLoadout('op1', 2, 'med')
    useAppStore.getState().setLoadout('op1', -1, 'med')
    expect(useAppStore.getState().loadout).toEqual({})
  })
})

describe('screen flow', () => {
  it('goto changes only the phase', () => {
    useAppStore.getState().goto('world')
    const s = useAppStore.getState()
    expect(s.phase).toBe('world')
    expect(s.missionId).toBeNull()
    expect(s.squad).toEqual(DEFAULT_SQUAD)
    expect(s.credits).toBe(START_CREDITS)
  })

  it('refuses the mission phase so Deploy stays on startMission', () => {
    useAppStore.getState().goto('mission')
    expect(useAppStore.getState().phase).toBe('menu')
    expect(useAppStore.getState().missionId).toBeNull()
  })

  it('selectMission stores the mission and moves to the brief', () => {
    useAppStore.getState().selectMission('m01')
    const s = useAppStore.getState()
    expect(s.missionId).toBe('m01')
    expect(s.phase).toBe('brief')
  })

  it('returnFromDebrief opens the World Network and clears the selected contract', () => {
    useAppStore.getState().selectMission('m01')
    useAppStore.getState().setOutcome(outcome())
    expect(useAppStore.getState().phase).toBe('debrief')
    expect(useAppStore.getState().missionId).toBe('m01')
    useAppStore.getState().returnFromDebrief()
    const s = useAppStore.getState()
    expect(s.phase).toBe('world')
    expect(s.missionId).toBeNull()
  })

  it('Replay keeps the selected contract when leaving debrief for the Brief', () => {
    useAppStore.getState().selectMission('m01')
    useAppStore.getState().setOutcome(outcome())
    useAppStore.getState().goto('brief')
    const s = useAppStore.getState()
    expect(s.phase).toBe('brief')
    expect(s.missionId).toBe('m01')
  })

  it('refuses an intel-locked mission until the campaign reaches its requirement', () => {
    useAppStore.getState().selectMission('m02')
    expect(useAppStore.getState().missionId).toBeNull()
    expect(useAppStore.getState().phase).toBe('menu')

    useCampaignStore.setState({ intelLevel: 2 })
    useAppStore.getState().selectMission('m02')
    expect(useAppStore.getState().missionId).toBe('m02')
    expect(useAppStore.getState().phase).toBe('brief')
  })
})

describe('selectMission campaign flags (WN-018)', () => {
  it('stays selectable for all three authored contracts once the campaign is complete', () => {
    for (const m of MISSIONS) {
      useCampaignStore.getState().reportMission(m.id, outcome({ casualties: 0 }), 0)
    }
    expect(useCampaignStore.getState().campaignWon).toBe(true)
    // Intel gates are not under test here; lift them so only the flags decide.
    useCampaignStore.setState({ intelLevel: 3 })
    for (const m of MISSIONS) {
      useAppStore.setState({ phase: 'world', missionId: null })
      useAppStore.getState().selectMission(m.id)
      expect(useAppStore.getState().missionId).toBe(m.id)
      expect(useAppStore.getState().phase).toBe('brief')
    }
  })

  it('is a no-op once the campaign has failed', () => {
    useCampaignStore.setState({ intelLevel: 3, campaignWon: false, campaignFailed: true })
    useAppStore.setState({ phase: 'world', missionId: null })
    for (const m of MISSIONS) {
      useAppStore.getState().selectMission(m.id)
      expect(useAppStore.getState().missionId).toBeNull()
      expect(useAppStore.getState().phase).toBe('world')
    }
  })
})

describe('squad selection', () => {
  it('removes an operative already in the squad', () => {
    useAppStore.getState().toggleOperative('op2')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
  })

  it('keeps the last operative in the squad', () => {
    useAppStore.setState({ squad: ['op1'] })
    useAppStore.getState().toggleOperative('op1')
    expect(useAppStore.getState().squad).toEqual(['op1'])
  })

  it('adds an operative while the squad is below four', () => {
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'] })
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op6'])
  })

  it('refuses to assign an injured operative', () => {
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'] })
    useAppStore.getState().toggleOperative('op5')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('refuses a fifth operative', () => {
    useAppStore.getState().toggleOperative('op5')
    expect(useAppStore.getState().squad).toEqual(DEFAULT_SQUAD)
  })
})

describe('credits', () => {
  it('spendCredits deducts an affordable amount', () => {
    useAppStore.getState().spendCredits(16000)
    expect(useAppStore.getState().credits).toBe(START_CREDITS - 16000)
  })

  it('allows spending down to exactly zero', () => {
    useAppStore.getState().spendCredits(START_CREDITS)
    expect(useAppStore.getState().credits).toBe(0)
  })

  it('rejects an overdraw', () => {
    useAppStore.getState().spendCredits(START_CREDITS + 1)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('ignores zero and negative amounts', () => {
    useAppStore.getState().spendCredits(0)
    useAppStore.getState().spendCredits(-500)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('addCredits deposits income and ignores non-positive amounts', () => {
    useAppStore.getState().addCredits(4080)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 4080)
    useAppStore.getState().addCredits(0)
    useAppStore.getState().addCredits(-10)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 4080)
  })
})

describe('hireOperative', () => {
  function openBay(): void {
    // The campaign starts at the cap; a loss opens the bay a hire fills.
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
  }

  it('deducts the candidate fee and signs the candidate', () => {
    openBay()
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.getState().hireOperative(candidate.id)
    expect(useAppStore.getState().credits).toBe(START_CREDITS - candidate.cost)
    expect(
      useCampaignStore.getState().operatives.some((o) => o.id === candidate.id),
    ).toBe(true)
  })

  it('blocks the hire at the roster cap without charging', () => {
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.getState().hireOperative(candidate.id)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useCampaignStore.getState().candidates[0]).toEqual(candidate)
  })

  it('blocks an overdraw without touching the roster', () => {
    openBay()
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: candidate.cost - 1 })
    useAppStore.getState().hireOperative(candidate.id)
    expect(useAppStore.getState().credits).toBe(candidate.cost - 1)
    expect(
      useCampaignStore.getState().operatives.some((o) => o.id === candidate.id),
    ).toBe(false)
  })

  it('ignores an unknown candidate id', () => {
    openBay()
    useAppStore.getState().hireOperative('ghost-id')
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })
})

describe('mission outcome payout', () => {
  it('fines per civilian hit, capped at the reward', () => {
    expect(collateralFine(outcome({ civiliansHit: 2 }))).toBe(2 * COLLATERAL_FINE)
    expect(collateralFine(outcome({ civiliansHit: 100 }))).toBe(85000)
  })

  it('floors the civilian count and treats a negative or non-finite count as none', () => {
    expect(collateralFine(outcome({ civiliansHit: 2.7 }))).toBe(2 * COLLATERAL_FINE)
    expect(collateralFine(outcome({ civiliansHit: -3 }))).toBe(0)
    expect(netPayout(outcome({ civiliansHit: -3 }))).toBe(85000)
    expect(collateralFine(outcome({ civiliansHit: Number.NaN }))).toBe(0)
    expect(collateralFine(outcome({ civiliansHit: Number.POSITIVE_INFINITY }))).toBe(0)
    expect(netPayout(outcome({ civiliansHit: Number.NaN }))).toBe(85000)
  })

  it('prices the contract fee on a loss and the bonus from completed optional ids', () => {
    const priced = priceOutcome(
      {
        applyKey: 4,
        won: false,
        kills: 1,
        casualties: 2,
        timeSec: 10,
        civiliansHit: 1.9,
        completedOptionalIds: ['hc-opt', 'hc-opt', 'missing', 'bad', 'neg'],
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      },
      { reward: 85000.9, bonusDefs: { 'hc-opt': 9000, bad: Number.NaN, neg: -5 } },
    )
    expect(priced.reward).toBe(85000)
    expect(priced.bonus).toBe(9000)
    expect(priced.quietReplay).toBe(false)
    expect(priced.applyKey).toBe(4)
    expect(netPayout(priced)).toBe(0)
    expect(collateralFine(priced)).toBe(COLLATERAL_FINE)
  })

  it('keeps the fee on a quiet win and pays nothing', () => {
    const priced = priceOutcome(
      {
        applyKey: 2,
        won: true,
        kills: 0,
        casualties: 0,
        timeSec: 1,
        civiliansHit: 0,
        completedOptionalIds: ['hc-opt'],
        deadIds: [],
        survivorHp: {},
        quietReplay: true,
      },
      { reward: 85000, bonusDefs: { 'hc-opt': 9000 } },
    )
    expect(priced.reward).toBe(85000)
    expect(priced.bonus).toBe(9000)
    expect(netPayout(priced)).toBe(0)
  })

  it('netPayout pays reward minus fine on a win and nothing on a loss', () => {
    expect(netPayout(outcome({ civiliansHit: 1 }))).toBe(85000 - COLLATERAL_FINE)
    expect(netPayout(outcome({ won: false }))).toBe(0)
  })

  it('setOutcome stores the outcome and moves to debrief without moving Credits', () => {
    const o = outcome({ civiliansHit: 2 })
    useAppStore.getState().setOutcome(o)
    const s = useAppStore.getState()
    expect(s.credits).toBe(START_CREDITS)
    expect(s.outcome).toBe(o)
    expect(s.phase).toBe('debrief')
    expect(s.lastAppliedKey).toBe(0)
  })

  it('a win drowned in collateral pays zero, never a debt', () => {
    expect(netPayout(outcome({ civiliansHit: 40 }))).toBe(0)
  })

  it('a loss leaves credits untouched but still reaches debrief', () => {
    const o = outcome({ won: false })
    useAppStore.getState().setOutcome(o)
    const s = useAppStore.getState()
    expect(s.credits).toBe(START_CREDITS)
    expect(s.outcome).toBe(o)
    expect(s.phase).toBe('debrief')
  })
})

describe('economy integration', () => {
  beforeEach(() => {
    useWorldStore.setState(structuredClone(worldBoot))
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  function assertSolvent(): void {
    expect(useAppStore.getState().credits).toBeGreaterThanOrEqual(0)
    expect(useWorldStore.getState().influence).toBeGreaterThanOrEqual(0)
  }

  it('runs one campaign beat across the stores without the balance going negative', () => {
    const m01 = MISSIONS[0]
    useAppStore.getState().selectMission(m01.id)
    expect(useAppStore.getState().phase).toBe('brief')

    // Win 1, two bystanders on the bill: the fee lands minus the fines.
    const first = outcome({ civiliansHit: 2, reward: m01.reward })
    useAppStore.getState().setOutcome(first)
    expect(netPayout(first)).toBe(m01.reward - 2 * COLLATERAL_FINE)
    // The Debrief deposit (applyDebrief makes it under the apply-once key).
    useAppStore.getState().addCredits(netPayout(first))
    expect(useAppStore.getState().credits).toBe(
      START_CREDITS + m01.reward - 2 * COLLATERAL_FINE,
    )
    assertSolvent()

    // The debrief boundary: campaign intel, then the world consequences.
    useCampaignStore.getState().reportMission(m01.id, first, 0)
    expect(useCampaignStore.getState().intelProgress).toBe(25 + 40)
    useWorldStore.getState().applyMissionResult(m01.id, first, [])
    const eu = useWorldStore.getState().sectors.eu
    expect(eu.control).toBe(worldBoot.sectors.eu.control + 4)
    expect(eu.unrest).toBe(worldBoot.sectors.eu.unrest - 2)
    expect(useWorldStore.getState().influence).toBe(6)

    // Win 2 is a quiet replay: invoice stays still, Raven still dies.
    const creditsAfterFirst = useAppStore.getState().credits
    const intelAfterFirst = useCampaignStore.getState().intelProgress
    const second = outcome({
      civiliansHit: 0,
      reward: m01.reward,
      deadIds: ['op5'],
      quietReplay: true,
    })
    useAppStore.getState().setOutcome(second)
    expect(second.quietReplay).toBe(true)
    expect(netPayout(second)).toBe(0)
    expect(useAppStore.getState().credits).toBe(creditsAfterFirst)
    useCampaignStore.getState().reportMission(m01.id, second, 0)
    useWorldStore.getState().applyMissionResult(m01.id, second, ['RAVEN'])
    expect(useWorldStore.getState().influence).toBe(6)
    expect(useCampaignStore.getState().intelProgress).toBe(intelAfterFirst)
    expect(useCampaignStore.getState().operatives.some((o) => o.id === 'op5')).toBe(false)
    assertSolvent()

    // Research: the screen clears the fee first, then the lab takes the job.
    const node = nodeById('b-propellants')
    const beforeResearch = useAppStore.getState().credits
    useAppStore.getState().spendCredits(node.cost)
    expect(useAppStore.getState().credits).toBe(beforeResearch - node.cost)
    expect(useResearchStore.getState().start(node, 0)).toBe(true)
    assertSolvent()

    // Hire: the vacated bay is refilled for the candidate fee.
    const candidate = useCampaignStore.getState().candidates[0]
    const beforeHire = useAppStore.getState().credits
    useAppStore.getState().hireOperative(candidate.id)
    expect(useAppStore.getState().credits).toBe(beforeHire - candidate.cost)
    expect(useCampaignStore.getState().operatives.some((o) => o.id === candidate.id)).toBe(true)
    assertSolvent()

    // Influence spend: stabilize costs its points and arms the cooldown.
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    expect(useWorldStore.getState().influence).toBe(14 - INFLUENCE_ACTIONS.stabilize.cost)
    assertSolvent()
  })

  it('refuses every unaffordable spend without touching a balance', () => {
    useAppStore.setState({ credits: 10000 })
    useWorldStore.setState({ influence: INFLUENCE_ACTIONS.stabilize.cost - 1 })

    // Research past the balance: the guard in spendCredits holds the line.
    useAppStore.getState().spendCredits(nodeById('b-propellants').cost)
    expect(useAppStore.getState().credits).toBe(10000)

    // Every candidate fee starts above 10,000 CR: the hire is refused whole.
    const rosterBefore = useCampaignStore.getState().operatives.length
    for (const c of useCampaignStore.getState().candidates) {
      expect(c.cost).toBeGreaterThan(10000)
      useAppStore.getState().hireOperative(c.id)
    }
    expect(useAppStore.getState().credits).toBe(10000)
    expect(useCampaignStore.getState().operatives).toHaveLength(rosterBefore)

    // One point short of stabilize: the spend is a no-op.
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    expect(useWorldStore.getState().influence).toBe(INFLUENCE_ACTIONS.stabilize.cost - 1)
    expect(useWorldStore.getState().spends).toHaveLength(0)

    // A lost contract pays nothing and cannot pull the account down.
    useAppStore.getState().setOutcome(outcome({ won: false, reward: 0 }))
    expect(useAppStore.getState().credits).toBe(10000)
    assertSolvent()
  })
})

describe('applyDebrief apply-once (ADR-0021)', () => {
  const T0 = 3 * 3600
  // Every data field of the four strategic stores the Debrief can touch.
  const data = (s: object) =>
    structuredClone(Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')))
  const snapshot = () => ({
    app: data(useAppStore.getState()),
    world: data(useWorldStore.getState()),
    campaign: data(useCampaignStore.getState()),
    research: data(useResearchStore.getState()),
  })

  beforeEach(() => {
    useWorldStore.setState({ ...structuredClone(worldBoot), t: T0 })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', squad: ['op1', 'op2', 'op4'] })
  })

  // Wraps the owner mutators so a test can count calls and see the key each
  // one ran under. Restored by the caller.
  function spyOwners() {
    const app = useAppStore.getState()
    const campaign = useCampaignStore.getState()
    const world = useWorldStore.getState()
    const research = useResearchStore.getState()
    const log: { name: string; key: number }[] = []
    const note = (name: string) => log.push({ name, key: useAppStore.getState().lastAppliedKey })
    useAppStore.setState({
      addCredits: (n) => (note('addCredits'), app.addCredits(n)),
    })
    useCampaignStore.setState({
      reportMission: (...a) => (note('reportMission'), campaign.reportMission(...a)),
      sync: (t) => (note('campaign.sync'), campaign.sync(t)),
    })
    useWorldStore.setState({
      applyMissionResult: (...a) => (note('applyMissionResult'), world.applyMissionResult(...a)),
      advanceDays: (d) => (note('advanceDays'), world.advanceDays(d)),
    })
    useResearchStore.setState({ sync: (t) => (note('research.sync'), research.sync(t)) })
    const restore = () => {
      useAppStore.setState({ addCredits: app.addCredits })
      useCampaignStore.setState({ reportMission: campaign.reportMission, sync: campaign.sync })
      useWorldStore.setState({
        applyMissionResult: world.applyMissionResult,
        advanceDays: world.advanceDays,
      })
      useResearchStore.setState({ sync: research.sync })
    }
    return { log, restore }
  }

  it('claims the key first, then runs every owner once in the ADR order', () => {
    useAppStore.getState().setOutcome(outcome({ applyKey: 1, deadIds: ['op4'] }))
    // Tax off the ETA span so the deposit list is just the payout.
    useWorldStore.setState({ nextTaxT: 1e12 })
    const { log, restore } = spyOwners()
    try {
      applyDebrief('m01')
    } finally {
      restore()
    }
    expect(log.map((c) => c.name)).toEqual([
      'addCredits',
      'reportMission',
      'applyMissionResult',
      'advanceDays',
      'research.sync',
      'campaign.sync',
    ])
    // lastAppliedKey was already set when the first owner mutator ran.
    for (const c of log) expect(c.key).toBe(1)
    const s = useAppStore.getState()
    expect(s.lastAppliedKey).toBe(1)
    expect(s.squad).not.toContain('op4')
    expect(useWorldStore.getState().t).toBe(T0 + MISSIONS[0].etaDays * DAY)
  })

  it('pyrrhic win (WN-018): pays the full net payout, grades a Win and fails the campaign', () => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    const pyrrhic = outcome({ applyKey: 1, casualties: ids.length, deadIds: ids })
    useAppStore.getState().setOutcome(pyrrhic)
    // Tax off the ETA span so the deposit is just the payout.
    useWorldStore.setState({ nextTaxT: 1e12 })
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(START_CREDITS + netPayout(pyrrhic))
    expect(useAppStore.getState().outcome?.won).toBe(true)
    const c = useCampaignStore.getState()
    expect(c.operatives).toEqual([])
    expect(c.contractsWon).toEqual(['m01'])
    expect(c.campaignFailed).toBe(true)
    expect(c.campaignWon).toBe(false)
  })

  it('re-entering with the same key leaves every store equal to the post-apply snapshot', () => {
    useAppStore.getState().setOutcome(outcome({ applyKey: 1, civiliansHit: 1 }))
    applyDebrief('m01')
    const S = snapshot()
    // The apply moved Credits (payout plus any ETA Tax), Intel and the clock.
    expect(useAppStore.getState().credits).toBeGreaterThanOrEqual(
      START_CREDITS + 85000 - COLLATERAL_FINE,
    )
    expect(useWorldStore.getState().t).toBeGreaterThan(T0)

    const { log, restore } = spyOwners()
    try {
      applyDebrief('m01')
      applyDebrief('m01')
    } finally {
      restore()
    }
    expect(log).toEqual([])
    expect(snapshot()).toEqual(S)
  })

  it('a stray older or equal key applies nothing', () => {
    useAppStore.setState({ lastAppliedKey: 5 })
    for (const applyKey of [3, 5]) {
      useAppStore.getState().setOutcome(outcome({ applyKey }))
      const before = snapshot()
      const { log, restore } = spyOwners()
      try {
        applyDebrief('m01')
      } finally {
        restore()
      }
      expect(log).toEqual([])
      expect(snapshot()).toEqual(before)
      expect(useAppStore.getState().credits).toBe(START_CREDITS)
    }
  })

  it('Credits sit under the same key: one deposit per key, a higher key applies', () => {
    const o = outcome({ applyKey: 1, won: true })
    useAppStore.getState().setOutcome(o)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    useWorldStore.setState({ nextTaxT: 1e12 })
    // Pin every timed flow off the ETA span so only the payout moves Credits.
    useWorldStore.setState({ nextEventT: 1e12, nextContractT: 1e12 })
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 85000)
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 85000)

    useAppStore.getState().setOutcome(outcome({ applyKey: 2, won: true, quietReplay: false }))
    applyDebrief('m01')
    expect(useAppStore.getState().lastAppliedKey).toBe(2)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 2 * 85000)
  })

  it('does nothing without an outcome', () => {
    useAppStore.setState({ outcome: null })
    const before = snapshot()
    applyDebrief('m01')
    expect(snapshot()).toEqual(before)
  })
})

describe('startMission (ADR-0019)', () => {
  const data = (s: object) =>
    structuredClone(Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function')))
  const snapshot = () => ({
    app: data(useAppStore.getState()),
    world: data(useWorldStore.getState()),
    campaign: data(useCampaignStore.getState()),
    research: data(useResearchStore.getState()),
  })
  // AC 5: a refused start changes nothing at all.
  const expectNoOp = () => {
    const before = snapshot()
    useAppStore.getState().startMission()
    expect(snapshot()).toEqual(before)
  }

  beforeEach(() => {
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id })
    useResearchStore.setState({ done: [] })
  })

  it('enters the mission with a contract and a Ready squad', () => {
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
  })

  it('no-ops with no contract selected', () => {
    useAppStore.setState({ missionId: null })
    expectNoOp()
  })

  it('no-ops when the selected contract no longer resolves', () => {
    useAppStore.setState({ missionId: 'gone-contract' })
    expectNoOp()
  })

  it('no-ops when an assigned operative is not Ready', () => {
    const id = DEFAULT_SQUAD[0]
    const c = useCampaignStore.getState()
    useCampaignStore.setState({
      roster: { ...c.roster, [id]: { ...c.roster[id], status: 'INJURED' } },
    })
    expectNoOp()
  })

  it('no-ops when an assigned id is missing from the roster (save drift, RA-007)', () => {
    useAppStore.setState({ squad: [DEFAULT_SQUAD[0], 'missing-op'] })
    expectNoOp()
  })

  it('no-ops with zero assigned operatives (AC 6)', () => {
    useAppStore.setState({ squad: [] })
    expectNoOp()
  })

  it('no-ops just over the mass limit and deploys just under it, counting Experience HP', () => {
    // Size one operative's maxHp so armor puts the squad 0.25 kg either side of
    // the limit (exactly 400 kg is pinned in deployGate.test.ts, free of float sums).
    const c = useCampaignStore.getState()
    const id = DEFAULT_SQUAD[0]
    const xp = c.roster[id].xp
    const others = c.operatives.filter((o) => DEFAULT_SQUAD.includes(o.id) && o.id !== id)
    const base = assignedMassKg(others, [], c.roster, {})
    const self = c.operatives.find((o) => o.id === id)!
    const atZeroArmor = assignedMassKg([{ ...self, maxHp: 90 }], [], c.roster, {})
    const xpHp = xpBonus(xp).maxHp
    const setHp = (extraKg: number) =>
      useCampaignStore.setState({
        operatives: c.operatives.map((o) =>
          o.id === id ? { ...o, maxHp: 90 - xpHp + (MASS_LIMIT_KG - base - atZeroArmor + extraKg) / ARMOR_KG_PER_HP } : o,
        ),
      })
    setHp(0.25)
    expectNoOp()
    setHp(-0.25)
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
  })
})

describe('Credits ledger (EC-001)', () => {
  // North America at Control 17 / Unrest 61 yields exactly 1,000 CR per Tax
  // tick (round(6000 × 0.17 × 0.98)); it is the only Nexus-held sector at
  // boot, so one tick deposits exactly that through worldStore's depositTax.
  // The pressure timer is pinned so Unrest 61 cannot decay Control mid-span.
  function taxOf1000At(nextTaxT: number, t: number): void {
    const sectors = structuredClone(worldBoot.sectors)
    sectors.na = { ...sectors.na, control: 17, unrest: 61 }
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      t,
      sectors,
      nextEventT: 1e12,
      nextContractT: 1e12,
      nextTaxT,
      pressure: { na: 1e12 },
    })
    expect(sectorReadout('na', sectors.na).taxYield).toBe(1000)
  }

  beforeEach(() => {
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  it('a new campaign reads 128,450 CR', () => {
    expect(INITIAL_CREDITS).toBe(128450)
    expect(bootState.credits).toBe(INITIAL_CREDITS)
  })

  it('a Tax deposit of 1,000 CR onto 0 CR leaves 1,000 CR', () => {
    taxOf1000At(TAX_INTERVAL_SEC, TAX_INTERVAL_SEC - 1)
    useAppStore.setState({ credits: 0 })
    useWorldStore.getState().tick(0.01)
    expect(useWorldStore.getState().nextTaxT).toBe(2 * TAX_INTERVAL_SEC)
    expect(useAppStore.getState().credits).toBe(1000)
  })

  it('a deposit of A > 0 adds exactly A, including 1 CR', () => {
    useAppStore.setState({ credits: 0 })
    useAppStore.getState().addCredits(1000)
    expect(useAppStore.getState().credits).toBe(1000)
    useAppStore.getState().addCredits(1)
    expect(useAppStore.getState().credits).toBe(1001)
  })

  it('a deposit of A <= 0 or a non-finite A is an identity no-op', () => {
    const before = useAppStore.getState()
    for (const a of [0, -0, -1, -1000, NaN, Infinity, -Infinity]) {
      useAppStore.getState().addCredits(a)
      expect(useAppStore.getState()).toBe(before)
    }
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('a spend of 0 CR or -1 CR keeps 128,450 CR and starts no research or hire', () => {
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    const campaign = useCampaignStore.getState()
    for (const a of [0, -1, NaN]) {
      useAppStore.getState().spendCredits(a)
      // Refusal is an identity no-op (ADR-0013): no new state object at all.
      expect(useAppStore.getState()).toBe(app)
    }
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useResearchStore.getState()).toBe(research)
    expect(useCampaignStore.getState()).toBe(campaign)
  })

  it('a 0 CR or -1 CR research or hire cost starts neither and keeps 128,450 CR', () => {
    // Open a roster bay (the campaign boots at the cap).
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    const project = nodeById('b-propellants')
    for (const cost of [0, -1]) {
      expect(useAppStore.getState().authorizeResearch({ ...project, cost }, 0).ok).toBe(false)
      expect(useResearchStore.getState().labs.ballistics).toBeNull()

      const candidates = useCampaignStore.getState().candidates.slice()
      candidates[0] = { ...candidates[0], cost }
      useCampaignStore.setState({ candidates })
      const roster = useCampaignStore.getState().roster
      useAppStore.getState().hireOperative(candidates[0].id)
      expect(useCampaignStore.getState().roster).toBe(roster)
      expect(useAppStore.getState().credits).toBe(START_CREDITS)
    }
  })

  it('a spend of exactly the balance leaves 0 CR', () => {
    useAppStore.getState().spendCredits(START_CREDITS)
    expect(useAppStore.getState().credits).toBe(0)
  })

  it('after a net_payout = 0 apply, a Tax deposit of 1,000 CR gives 129,450 CR', () => {
    // Quiet-replay win of m01 (ETA 2 days) from T0 = 3 h: one Tax tick falls
    // inside the ETA span (T0 + 1.5 d), the next (T0 + 2.5 d) does not.
    const T0 = 3 * 3600
    taxOf1000At(T0 + 1.5 * DAY, T0)
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', squad: ['op1', 'op2', 'op4'] })
    const quiet = outcome({ applyKey: 1, won: true, quietReplay: true, civiliansHit: 0 })
    useAppStore.getState().setOutcome(quiet)
    expect(netPayout(quiet)).toBe(0)
    expect(useAppStore.getState().credits).toBe(128450)

    applyDebrief('m01')

    expect(useWorldStore.getState().t).toBe(T0 + MISSIONS[0].etaDays * DAY)
    expect(useWorldStore.getState().nextTaxT).toBe(T0 + 2.5 * DAY)
    // new_balance = credits_before + net_payout + tax_deposits.
    expect(useAppStore.getState().credits).toBe(129450)
  })
})

describe('Economy keeps no Influence or Intel ledger (EC-003)', () => {
  // The Economy apply path in isolation (TR-economy-002, ADR-0008): pricing
  // plus the Credits writes applyDebrief makes, never worldStore's
  // applyMissionResult. Influence is World Network's; Intel is the campaign's.
  // Intel has no level cap in campaignStore, so "maximum" is the highest
  // contract requirement — the level that unlocks every contract.
  const INTEL_TOP = Math.max(...MISSIONS.map((m) => m.intelReq))
  const SEEDS: ReadonlyArray<[influence: number, level: number, progress: number]> = [
    [0, 0, 0],
    [7, 1, 40],
    [1_000_000, INTEL_TOP, 99],
  ]
  const pricing = { reward: 85000, bonusDefs: { opt: 12000 } }

  function result(over: Partial<MissionResult> = {}): MissionResult {
    return {
      applyKey: 1,
      won: true,
      kills: 6,
      casualties: 0,
      timeSec: 412,
      civiliansHit: 0,
      completedOptionalIds: ['opt'],
      deadIds: [],
      survivorHp: {},
      quietReplay: false,
      ...over,
    }
  }

  // Economy's half of applyDebrief: price, store, deposit net_payout.
  function economyApply(r: MissionResult): void {
    useAppStore.setState({ phase: 'debrief', missionId: 'm01' })
    useAppStore.getState().setOutcome(priceOutcome(r, pricing))
    const o = useAppStore.getState().outcome
    if (!o) throw new Error('setOutcome stored no outcome')
    useAppStore.getState().addCredits(netPayout(o))
  }

  function seed(influence: number, intelLevel: number, intelProgress: number): void {
    useWorldStore.setState({ ...structuredClone(worldBoot), influence })
    useCampaignStore.setState({ intelLevel, intelProgress })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  }

  function expectUnchanged(influence: number, intelLevel: number, intelProgress: number): void {
    expect(useWorldStore.getState().influence).toBe(influence)
    expect(useCampaignStore.getState().intelLevel).toBe(intelLevel)
    expect(useCampaignStore.getState().intelProgress).toBe(intelProgress)
  }

  it('payout, Tax deposit, research debit and hire debit leave Influence I and Intel J', () => {
    for (const [I, L, P] of SEEDS) {
      // The campaign starts at the roster cap; a loss report opens the bay
      // the hire fills. Seed after it, so only Economy writes follow.
      useAppStore.setState({ credits: START_CREDITS, lastAppliedKey: 0 })
      useCampaignStore.setState(initialCampaignData())
      useCampaignStore
        .getState()
        .reportMission('m01', outcome({ won: false, casualties: 1, deadIds: ['op1'] }), 0)
      seed(I, L, P)
      const world = useWorldStore.getState()

      economyApply(result())
      expect(useAppStore.getState().credits).toBe(START_CREDITS + 85000 + 12000)
      useAppStore.getState().addCredits(1000) // a Tax deposit
      useAppStore.getState().spendCredits(nodeById('b-propellants').cost) // research debit
      const candidate = useCampaignStore.getState().candidates[0]
      useAppStore.getState().hireOperative(candidate.id) // hire debit
      expect(useCampaignStore.getState().operatives.some((o) => o.id === candidate.id)).toBe(
        true,
      )
      expect(useAppStore.getState().credits).toBe(
        START_CREDITS + 97000 + 1000 - nodeById('b-propellants').cost - candidate.cost,
      )

      expectUnchanged(I, L, P)
      // Economy writes never touch the World Network store at all.
      expect(useWorldStore.getState()).toBe(world)
    }
  })

  it('a first non-quiet win payout applied by Economy alone leaves Influence 0', () => {
    seed(0, 0, 0)
    expect(useCampaignStore.getState().contractsWon).not.toContain('m01')
    economyApply(result({ quietReplay: false }))
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 97000)
    expect(useWorldStore.getState().influence).toBe(0)
    expect(Object.keys(useAppStore.getState())).not.toContain('influence')
    expect(Object.keys(useAppStore.getState())).not.toContain('intel')
  })

  it('a loss then a quiet-replay win (net_payout 0) leaves Influence, Intel and Credits unchanged', () => {
    for (const [I, L, P] of SEEDS) {
      useAppStore.setState({ credits: START_CREDITS, lastAppliedKey: 0 })
      seed(I, L, P)
      const world = useWorldStore.getState()
      const campaign = useCampaignStore.getState()

      economyApply(result({ applyKey: 1, won: false, casualties: 2 }))
      let o = useAppStore.getState().outcome
      expect(o?.reward).toBe(85000) // the fee is stored on a loss...
      expect(o && netPayout(o)).toBe(0) // ...and pays nothing
      expect(useAppStore.getState().credits).toBe(START_CREDITS)

      economyApply(result({ applyKey: 2, won: true, quietReplay: true }))
      o = useAppStore.getState().outcome
      expect(o?.reward).toBe(85000)
      expect(o?.bonus).toBe(12000)
      expect(o && netPayout(o)).toBe(0)
      expect(useAppStore.getState().credits).toBe(START_CREDITS)

      expectUnchanged(I, L, P)
      expect(useWorldStore.getState()).toBe(world)
      expect(useCampaignStore.getState()).toBe(campaign)
    }
  })
})

describe('Collateral prices unique squad-caused civilian first-hits (EC-005)', () => {
  // TR-economy-007: Tactical counts unique squad first-hits as civiliansHit
  // (N); Economy prices collateral = min(Reward, 5000 × N) from the outcome
  // DTO. Unique-hit counting is Tactical's, so these assert priced fields only.
  function priced(civiliansHit: number, reward = 85000, won = true): MissionOutcome {
    return priceOutcome(
      {
        applyKey: 1,
        won,
        kills: 4,
        casualties: 0,
        timeSec: 300,
        civiliansHit,
        completedOptionalIds: [],
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      },
      { reward, bonusDefs: {} },
    )
  }

  const TABLE: ReadonlyArray<[label: string, n: number, reward: number, collateral: number]> = [
    ['two unique squad first-hits on an 85,000 CR win', 2, 85000, 10000],
    ['one civilian hit twice by the squad (N = 1 at the DTO)', 1, 85000, 5000],
    ['CorpSec-only harm (Tactical never counts it, N = 0)', 0, 85000, 0],
    ['one non-fatal squad first-hit', 1, 85000, 5000],
    ['reward smaller than the fine', 1, 3000, 3000],
    ['reward 0', 2, 0, 0],
  ]

  for (const [label, n, reward, expected] of TABLE) {
    it(`prices ${label} at ${expected} CR`, () => {
      const o = priced(n, reward)
      expect(o.civiliansHit).toBe(n)
      expect(o.reward).toBe(reward)
      expect(collateralFine(o)).toBe(expected)
    })
  }

  it('reads the count from the outcome, not from reward × civiliansHit', () => {
    // Below the cap, collateral depends on N alone: the same N on two
    // different Rewards prices the same fine.
    expect(collateralFine(priced(2, 85000))).toBe(2 * COLLATERAL_FINE)
    expect(collateralFine(priced(2, 30500))).toBe(2 * COLLATERAL_FINE)
    expect(collateralFine(priced(0, 95000))).toBe(0)
  })

  it('net payout on the 85,000 CR / N = 2 win deducts exactly 10,000 CR', () => {
    expect(netPayout(priced(2))).toBe(75000)
  })
})

describe('Collateral clamps and input sanitising (EC-006)', () => {
  // TR-economy-007 / ADR-0021: N = max(0, floor(civiliansHit)), non-finite → 0;
  // collateral = min(reward, N × COLLATERAL_FINE). A negative or non-finite
  // input never raises net_payout, and every priced field is a finite integer.
  function priced(
    civiliansHit: number,
    over: { reward?: number; bonusDefs?: Record<string, number>; optional?: string[] } = {},
  ): MissionOutcome {
    return priceOutcome(
      {
        applyKey: 1,
        won: true,
        kills: 3,
        casualties: 0,
        timeSec: 240,
        civiliansHit,
        completedOptionalIds: over.optional ?? [],
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      },
      { reward: over.reward ?? 85000, bonusDefs: over.bonusDefs ?? {} },
    )
  }

  function expectFiniteIntegers(o: MissionOutcome): void {
    for (const v of [o.reward, o.bonus, collateralFine(o), netPayout(o)]) {
      expect(Number.isFinite(v)).toBe(true)
      expect(Number.isInteger(v)).toBe(true)
    }
  }

  it('caps collateral at Reward: 9 first-hits on a 41,000 CR win price 41,000 CR', () => {
    const o = priced(9, { reward: 41000 })
    expect(collateralFine(o)).toBe(41000)
    expect(netPayout(o)).toBe(0)
    expectFiniteIntegers(o)
  })

  it('civiliansHit −1 prices 0 CR and does not raise net_payout', () => {
    const o = priced(-1)
    expect(collateralFine(o)).toBe(0)
    expect(netPayout(o)).toBe(85000)
    expect(netPayout(o)).toBeLessThanOrEqual(netPayout(priced(0)))
    expectFiniteIntegers(o)
  })

  it('civiliansHit 2.7 floors to N = 2: 10,000 CR on an 85,000 CR Reward', () => {
    const o = priced(2.7)
    expect(collateralFine(o)).toBe(10000)
    expect(netPayout(o)).toBe(75000)
    expectFiniteIntegers(o)
  })

  it('civiliansHit NaN and a NaN bonus def price 0 collateral, 0 bonus, 85,000 CR net', () => {
    const o = priced(Number.NaN, { optional: ['opt'], bonusDefs: { opt: Number.NaN } })
    expect(collateralFine(o)).toBe(0)
    expect(o.bonus).toBe(0)
    expect(netPayout(o)).toBe(85000)
    expectFiniteIntegers(o)
  })

  it('treats ±Infinity civiliansHit as N = 0', () => {
    for (const n of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const o = priced(n)
      expect(collateralFine(o)).toBe(0)
      expect(netPayout(o)).toBe(85000)
      expectFiniteIntegers(o)
    }
  })

  it('an Infinity bonus def prices 0 and cannot raise net_payout', () => {
    const o = priced(0, { optional: ['opt'], bonusDefs: { opt: Number.POSITIVE_INFINITY } })
    expect(o.bonus).toBe(0)
    expect(netPayout(o)).toBe(85000)
    expectFiniteIntegers(o)
  })

  it('a non-integer Reward prices as integers, with the cap applied to the floored Reward', () => {
    const o = priced(20, { reward: 41000.6 })
    expect(o.reward).toBe(41000)
    expect(collateralFine(o)).toBe(41000)
    expect(netPayout(o)).toBe(0)
    expectFiniteIntegers(o)
    const small = priced(1.5, { reward: 85000.4 })
    expect(small.reward).toBe(85000)
    expect(collateralFine(small)).toBe(COLLATERAL_FINE)
    expect(netPayout(small)).toBe(80000)
    expectFiniteIntegers(small)
  })

  it('a non-finite Reward prices 0 and pays nothing', () => {
    for (const r of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const o = priced(2, { reward: r })
      expect(o.reward).toBe(0)
      expect(collateralFine(o)).toBe(0)
      expect(netPayout(o)).toBe(0)
      expectFiniteIntegers(o)
    }
  })
})

describe('Net payout: reward plus optional bonus minus collateral (EC-007)', () => {
  // TR-economy-011 / TR-economy-007 / ADR-0021: bonus = sum of bonusDefs over
  // unique completedOptionalIds (unknown, negative, non-finite → 0);
  // netPayout = (won && !quietReplay) ? reward + bonus − collateral : 0.
  function priced(over: {
    reward: number
    civiliansHit?: number
    bonusDefs?: Record<string, number>
    optional?: string[]
  }): MissionOutcome {
    return priceOutcome(
      {
        applyKey: 1,
        won: true,
        kills: 4,
        casualties: 0,
        timeSec: 300,
        civiliansHit: over.civiliansHit ?? 0,
        completedOptionalIds: over.optional ?? [],
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      },
      { reward: over.reward, bonusDefs: over.bonusDefs ?? {} },
    )
  }

  it('Reward 85,000, bonus 0, Collateral 10,000 pays 75,000 CR', () => {
    const o = priced({ reward: 85000, civiliansHit: 2 })
    expect(o.bonus).toBe(0)
    expect(collateralFine(o)).toBe(10000)
    expect(netPayout(o)).toBe(75000)
  })

  it('Reward 41,000, Collateral 41,000, optional +6,000 pays 6,000 CR', () => {
    const o = priced({
      reward: 41000,
      civiliansHit: 9,
      optional: ['rh-opt'],
      bonusDefs: { 'rh-opt': 6000 },
    })
    expect(collateralFine(o)).toBe(41000)
    expect(o.bonus).toBe(6000)
    expect(netPayout(o)).toBe(6000)
  })

  it('a −1,000 bonus def prices 0 and net_payout stays 85,000 CR', () => {
    const o = priced({ reward: 85000, optional: ['neg'], bonusDefs: { neg: -1000 } })
    expect(collateralFine(o)).toBe(0)
    expect(o.bonus).toBe(0)
    expect(netPayout(o)).toBe(85000)
  })

  it('a duplicate completed optional id counts once', () => {
    const o = priced({ reward: 85000, optional: ['opt', 'opt', 'opt'], bonusDefs: { opt: 6000 } })
    expect(o.bonus).toBe(6000)
    expect(netPayout(o)).toBe(91000)
  })

  it('an unknown optional id prices 0', () => {
    const o = priced({ reward: 85000, optional: ['opt', 'ghost'], bonusDefs: { opt: 6000 } })
    expect(o.bonus).toBe(6000)
    expect(netPayout(o)).toBe(91000)
  })

  it('collateral beyond reward plus bonus never drives net_payout below 0', () => {
    for (const hits of [9, 20, 1000]) {
      const o = priced({ reward: 41000, civiliansHit: hits })
      expect(netPayout(o)).toBeGreaterThanOrEqual(0)
      expect(netPayout(o)).toBe(0)
    }
    const withBonus = priced({
      reward: 41000,
      civiliansHit: 1000,
      optional: ['opt'],
      bonusDefs: { opt: 6000 },
    })
    expect(netPayout(withBonus)).toBe(6000)
  })
})

describe('Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win (EC-008)', () => {
  // TR-economy-007 / TR-economy-011 / ADR-0021. Reward and bonus defs come
  // from the authored mission data through the same Economy slice the deploy
  // composer freezes; expectations are the GDD figures, not re-derived.
  const mission = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id)
    if (!m) throw new Error('missing authored mission ' + id)
    return m
  }

  function priceAuthored(
    id: string,
    over: { civiliansHit: number; optional?: string[]; deadIds?: string[] },
  ): MissionOutcome {
    const economy = economySlice(mission(id), false, false, 1)
    return priceOutcome(
      {
        applyKey: 1,
        won: true,
        kills: 4,
        casualties: over.deadIds?.length ?? 0,
        timeSec: 300,
        civiliansHit: over.civiliansHit,
        completedOptionalIds: over.optional ?? [],
        deadIds: over.deadIds ?? [],
        survivorHp: {},
        quietReplay: economy.quietReplay,
      },
      economy,
    )
  }

  it('Hollow Crown: Reward 62,000, 13 hits, optional +9,000 gives Collateral 62,000 and net 9,000 CR', () => {
    const hc = mission('m02')
    expect(hc.codename).toBe('HOLLOW CROWN')
    const optional = hc.objectives.filter((o) => o.optional).map((o) => o.id)
    const o = priceAuthored('m02', { civiliansHit: 13, optional })
    expect(o.reward).toBe(62000)
    expect(o.bonus).toBe(9000)
    expect(collateralFine(o)).toBe(62000)
    expect(netPayout(o)).toBe(9000)
  })

  it('Rust Haven at opening Standard: Reward 41,000, 8 hits, optional ignored gives Collateral 40,000 and net 1,000 CR', () => {
    const rh = mission('m03')
    expect(rh.codename).toBe('RUST HAVEN')
    const o = priceAuthored('m03', { civiliansHit: 8 })
    expect(o.reward).toBe(41000)
    expect(o.bonus).toBe(0)
    expect(collateralFine(o)).toBe(40000)
    expect(netPayout(o)).toBe(1000)
  })

  describe('pyrrhic win', () => {
    beforeEach(() => {
      useWorldStore.setState({ ...structuredClone(worldBoot), t: 3 * 3600, nextTaxT: 1e12 })
      useResearchStore.setState({
        done: [],
        labs: { ballistics: null, cybernetics: null, control: null },
      })
      useAppStore.setState({ phase: 'debrief', missionId: 'm01', squad: ['op1', 'op2', 'op4'] })
    })

    it('non-quiet tiebreak Win that empties the roster, Reward 85,000, N = 0 pays the full 85,000 CR', () => {
      const ids = useCampaignStore.getState().operatives.map((op) => op.id)
      expect(ids).toEqual(ROSTER.map((op) => op.id))
      expect(useCampaignStore.getState().contractsWon).toEqual([])
      const o = priceAuthored('m01', { civiliansHit: 0, deadIds: ids })
      expect(o.quietReplay).toBe(false)
      expect(o.reward).toBe(85000)
      expect(netPayout(o)).toBe(85000)

      useAppStore.getState().setOutcome(o)
      applyDebrief('m01')
      expect(useAppStore.getState().credits).toBe(START_CREDITS + 85000)
      const c = useCampaignStore.getState()
      expect(c.operatives).toEqual([])
      expect(c.campaignWon).toBe(false)
      expect(c.campaignFailed).toBe(true)
    })
  })
})

describe('Credits never overdraw (EC-002)', () => {
  // ADR-0013 / TR-economy-001. b-propellants is a 16,000 CR root project
  // (no prerequisites), so only the balance can refuse it here.
  const PROJECT = nodeById('b-propellants')
  const PRICE = 16000

  beforeEach(() => {
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  // Opens a roster bay (the campaign boots at the cap) and lists the first
  // candidate at exactly 16,000 CR.
  function candidateAt16000(): string {
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    const candidates = useCampaignStore.getState().candidates.slice()
    candidates[0] = { ...candidates[0], cost: PRICE }
    useCampaignStore.setState({ candidates })
    return candidates[0].id
  }

  it('a non-positive or non-finite listed cost is refused before start()', () => {
    useAppStore.setState({ credits: PRICE })
    for (const cost of [0, -1, NaN, Infinity]) {
      expect(useAppStore.getState().authorizeResearch({ ...PROJECT, cost }, 0).ok).toBe(false)
      expect(useResearchStore.getState().labs.ballistics).toBeNull()
      expect(useAppStore.getState().credits).toBe(PRICE)
    }
  })

  it('the research project under test is listed at 16,000 CR', () => {
    expect(PROJECT.cost).toBe(PRICE)
    expect(PROJECT.needs).toEqual([])
  })

  it('at 15,999 CR a 16,000 CR project is refused: Credits, research and occupancy unchanged', () => {
    useAppStore.setState({ credits: 15999 })
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    let wakes = 0
    const unsubApp = useAppStore.subscribe(() => wakes++)
    const unsubResearch = useResearchStore.subscribe(() => wakes++)

    expect(useAppStore.getState().authorizeResearch(PROJECT, 0).ok).toBe(false)

    unsubApp()
    unsubResearch()
    expect(useAppStore.getState().credits).toBe(15999)
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
    expect(useResearchStore.getState().done).toEqual([])
    // Identity no-op: no new state object, no subscriber wake.
    expect(useAppStore.getState()).toBe(app)
    expect(useResearchStore.getState()).toBe(research)
    expect(wakes).toBe(0)
  })

  it('at 15,999 CR a 16,000 CR candidate is refused: Credits and roster unchanged', () => {
    const id = candidateAt16000()
    useAppStore.setState({ credits: 15999 })
    const app = useAppStore.getState()
    const campaign = useCampaignStore.getState()
    let wakes = 0
    const unsubApp = useAppStore.subscribe(() => wakes++)
    const unsubCampaign = useCampaignStore.subscribe(() => wakes++)

    useAppStore.getState().hireOperative(id)

    unsubApp()
    unsubCampaign()
    expect(useAppStore.getState().credits).toBe(15999)
    expect(useCampaignStore.getState()).toBe(campaign)
    expect(useCampaignStore.getState().operatives.some((o) => o.id === id)).toBe(false)
    expect(useAppStore.getState()).toBe(app)
    expect(wakes).toBe(0)
  })

  it('at exactly 16,000 CR the 16,000 CR project starts and Credits = 0', () => {
    useAppStore.setState({ credits: PRICE })
    expect(useAppStore.getState().authorizeResearch(PROJECT, 100).ok).toBe(true)
    expect(useAppStore.getState().credits).toBe(0)
    expect(useResearchStore.getState().labs.ballistics).toEqual({
      id: PROJECT.id,
      startedT: 100,
      endT: 100 + PROJECT.hours * 3600,
    })
  })

  it('at exactly 16,000 CR the 16,000 CR candidate is hired and Credits = 0', () => {
    const id = candidateAt16000()
    useAppStore.setState({ credits: PRICE })
    useAppStore.getState().hireOperative(id)
    expect(useAppStore.getState().credits).toBe(0)
    expect(useCampaignStore.getState().operatives.some((o) => o.id === id)).toBe(true)
    expect(useCampaignStore.getState().candidates.some((c) => c.id === id)).toBe(false)
  })

  it('checks, starts, then spends: a lab that refuses the project bills nothing', () => {
    // Funds are there, but the ballistics lab is busy, so start() refuses.
    // Spend-then-start would have charged 16,000 CR for nothing.
    useAppStore.setState({ credits: PRICE })
    useResearchStore.setState({
      labs: { ballistics: { id: 'b-coating', startedT: 0, endT: 1e9 }, cybernetics: null, control: null },
    })
    const labs = useResearchStore.getState().labs
    expect(useAppStore.getState().authorizeResearch(PROJECT, 0).ok).toBe(false)
    expect(useAppStore.getState().credits).toBe(PRICE)
    expect(useResearchStore.getState().labs).toBe(labs)
  })

  it('hydrate drops a save whose Credits are negative or non-finite, never clamping to 0', () => {
    const valid = captureSave()
    expect(validateSave(valid)).toBe(true)
    for (const credits of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const bad = structuredClone(valid)
      bad.app.credits = credits
      expect(validateSave(bad)).toBe(false)
      // readSave drops the whole blob (no campaign), it does not repair it.
      const data = new Map([[SAVE_KEY, JSON.stringify(bad)]])
      if (!Number.isFinite(credits)) {
        // JSON cannot carry NaN/Infinity; they serialise to null.
        expect(JSON.parse(data.get(SAVE_KEY)!).app.credits).toBeNull()
      }
      const storage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      }
      expect(readSave(storage)).toBeNull()
      expect(data.has(SAVE_KEY)).toBe(false)
    }
    // Exactly 0 CR is a legal balance and survives.
    const zero = structuredClone(valid)
    zero.app.credits = 0
    expect(validateSave(zero)).toBe(true)
  })
})

describe('A loss pays nothing; a failed generated contract leaves the market (EC-009)', () => {
  // TR-economy-004 / TR-economy-008 / ADR-0021 / ADR-0003: reward is stored on
  // a loss so the invoice can print it; netPayout is 0 unless won and not
  // quiet; a generated contract that is fulfilled or failed leaves the market.
  const authored = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id)
    if (!m) throw new Error('missing authored mission ' + id)
    return m
  }

  function lossResult(over: Partial<MissionResult> = {}): MissionResult {
    return {
      applyKey: 1,
      won: false,
      kills: 2,
      casualties: 1,
      timeSec: 240,
      civiliansHit: 0,
      completedOptionalIds: [],
      deadIds: [],
      survivorHp: {},
      quietReplay: false,
      ...over,
    }
  }

  function generated(seed: number): GeneratedContract {
    return {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: 0,
      expiresAtT: 1e9,
      sector: 'eu',
      cityId: CITIES_BY_SECTOR.eu[0].id,
      district: 5,
      type: 'SEIZURE',
      client: sectorClient('eu', initialOwner()),
      threat: 'HIGH',
      reward: 50000,
      seed,
      priority: false,
      expedited: false,
    }
  }

  beforeEach(() => {
    useWorldStore.setState({ ...structuredClone(worldBoot), nextTaxT: 1e12, nextEventT: 1e12 })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  it('loss, Reward 85,000, 2 hits, bonus 0: reward 85,000, Collateral 10,000, net 0, Credits unchanged', () => {
    const m = authored('m01')
    const economy = economySlice(m, false, false, 1)
    expect(economy.reward).toBe(85000)
    const o = priceOutcome(lossResult({ civiliansHit: 2 }), economy)
    expect(o.reward).toBe(85000)
    expect(o.bonus).toBe(0)
    expect(collateralFine(o)).toBe(10000)
    expect(netPayout(o)).toBe(0)

    useAppStore.setState({ phase: 'mission', missionId: 'm01' })
    useAppStore.getState().setOutcome(o)
    applyDebrief('m01')
    expect(useAppStore.getState().lastAppliedKey).toBe(1)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('loss, Reward 62,000 with the optional complete (+9,000): net 0, Credits unchanged', () => {
    const m = authored('m02')
    const optional = m.objectives.filter((o) => o.optional).map((o) => o.id)
    const economy = economySlice(m, false, false, 1)
    expect(economy.reward).toBe(62000)
    const o = priceOutcome(lossResult({ completedOptionalIds: optional }), economy)
    expect(o.reward).toBe(62000)
    expect(o.bonus).toBe(9000)
    expect(netPayout(o)).toBe(0)

    useAppStore.setState({ phase: 'mission', missionId: 'm02' })
    useAppStore.getState().setOutcome(o)
    applyDebrief('m02')
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('failed generated contract: net 0, the instance is gone after debrief, Credits unchanged', () => {
    const c = generated(41)
    const keep = { ...generated(42), sector: 'af' as const, cityId: CITIES_BY_SECTOR.af[0].id }
    useWorldStore.setState({ contracts: [c, keep], nextContractT: Number.MAX_SAFE_INTEGER })
    const mission = resolveMission(c.id)
    if (!mission) throw new Error('generated contract did not resolve')
    const economy = economySlice(mission, true, false, 1)
    expect(economy.reward).toBe(50000)
    const o = priceOutcome(lossResult({ civiliansHit: 1 }), economy)
    expect(o.reward).toBe(50000)
    expect(netPayout(o)).toBe(0)

    useAppStore.setState({ phase: 'mission', missionId: c.id })
    useAppStore.getState().setOutcome(o)
    applyDebrief(c.id)
    const contracts = useWorldStore.getState().contracts
    expect(contracts.some((x) => x.id === c.id)).toBe(false)
    expect(contracts.map((x) => x.id)).toEqual([keep.id])
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })

  it('a loss on an authored contract keeps the record selectable', () => {
    useAppStore.setState({ phase: 'mission', missionId: 'm01' })
    useAppStore
      .getState()
      .setOutcome(priceOutcome(lossResult(), economySlice(authored('m01'), false, false, 1)))
    applyDebrief('m01')
    useAppStore.getState().returnFromDebrief()
    expect(resolveMission('m01')?.id).toBe('m01')
    useAppStore.getState().selectMission('m01')
    expect(useAppStore.getState().missionId).toBe('m01')
    expect(useAppStore.getState().phase).toBe('brief')
  })
})

describe('Quiet replay pays no fee, optionals included (EC-010)', () => {
  // TR-economy-004 / TR-economy-005 / ADR-0004 / ADR-0009: quietness is the
  // frozen Economy-slice boolean. A quiet win stores the fee and pays 0 CR,
  // bonus and Collateral included; nothing on the outcome path re-reads
  // contractsWon to decide it.
  const authored = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id)
    if (!m) throw new Error('missing authored mission ' + id)
    return m
  }

  function winResult(over: Partial<MissionResult> = {}): MissionResult {
    return {
      applyKey: 1,
      won: true,
      kills: 5,
      casualties: 0,
      timeSec: 300,
      civiliansHit: 0,
      completedOptionalIds: [],
      deadIds: [],
      survivorHp: {},
      quietReplay: true,
      ...over,
    }
  }

  function debrief(missionId: string, o: MissionOutcome): void {
    useAppStore.setState({ phase: 'mission', missionId })
    useAppStore.getState().setOutcome(o)
    applyDebrief(missionId)
  }

  beforeEach(() => {
    useWorldStore.setState({ ...structuredClone(worldBoot), nextTaxT: 1e12, nextEventT: 1e12 })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  it('quiet win, Reward 62,000, optional +9,000: net_payout 0 and reward 62,000', () => {
    const m = authored('m02')
    const optional = m.objectives.filter((o) => o.optional).map((o) => o.id)
    const economy = economySlice(m, false, true, 1)
    expect(economy.quietReplay).toBe(true)
    const o = priceOutcome(winResult({ completedOptionalIds: optional }), economy)
    expect(o.reward).toBe(62000)
    expect(o.bonus).toBe(9000)
    expect(o.quietReplay).toBe(true)
    expect(netPayout(o)).toBe(0)
  })

  it('quiet win with any Collateral still nets 0', () => {
    const m = authored('m02')
    const optional = m.objectives.filter((o) => o.optional).map((o) => o.id)
    const economy = economySlice(m, false, true, 1)
    for (const hits of [0, 1, 3, 50]) {
      const o = priceOutcome(winResult({ civiliansHit: hits, completedOptionalIds: optional }), economy)
      expect(o.reward).toBe(62000)
      expect(netPayout(o)).toBe(0)
    }
  })

  it('Glass Veil already won: a quiet-replay win debriefs with contract fee 0 CR', () => {
    useCampaignStore.setState({ contractsWon: ['m01'] })
    const m = authored('m01')
    const squad = DEFAULT_SQUAD.map(operativeById)
    const deploy = freezeDeploy(m, squad, 1)
    expect(deploy.economy.quietReplay).toBe(true)
    const o = priceOutcome(winResult({ quietReplay: deploy.economy.quietReplay }), deploy.economy)
    expect(o.reward).toBe(85000)
    expect(netPayout(o)).toBe(0)
    debrief('m01', o)
    expect(useAppStore.getState().lastAppliedKey).toBe(1)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01'])
  })

  it('quiet win at 128,450 CR leaves Credits 128,450 CR after Economy applies', () => {
    expect(useAppStore.getState().credits).toBe(128450)
    const m = authored('m02')
    const optional = m.objectives.filter((o) => o.optional).map((o) => o.id)
    const o = priceOutcome(
      winResult({ civiliansHit: 2, completedOptionalIds: optional }),
      economySlice(m, false, true, 1),
    )
    debrief('m02', o)
    expect(useAppStore.getState().credits).toBe(128450)
  })

  it('slice frozen with quietReplay false and Reward R is not restamped when contractsWon later includes the contract', () => {
    const m = authored('m01')
    const squad = DEFAULT_SQUAD.map(operativeById)
    const deploy = freezeDeploy(m, squad, 1)
    expect(deploy.economy.quietReplay).toBe(false)
    const R = deploy.economy.reward
    expect(R).toBe(85000)
    // Live record changes between deploy and apply.
    useCampaignStore.setState({ contractsWon: ['m01'] })
    expect(deploy.economy.quietReplay).toBe(false)
    const o = priceOutcome(winResult({ quietReplay: deploy.economy.quietReplay }), deploy.economy)
    expect(o.quietReplay).toBe(false)
    expect(o.reward).toBe(R)
    debrief('m01', o)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + R)
  })

  it('setOutcome and reportMission take quietness from the outcome, not contractsWon', () => {
    // Record says won, outcome says not quiet: full pay and the Intel award.
    useCampaignStore.setState({ contractsWon: ['m01'] })
    const before = useCampaignStore.getState()
    const paid = priceOutcome(winResult({ quietReplay: false }), economySlice(authored('m01'), false, false, 1))
    debrief('m01', paid)
    expect(useAppStore.getState().outcome?.quietReplay).toBe(false)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 85000)
    const after = useCampaignStore.getState()
    expect([after.intelLevel, after.intelProgress]).not.toEqual([before.intelLevel, before.intelProgress])

    // Record empty, outcome says quiet: no pay and no Intel.
    useAppStore.setState({ credits: START_CREDITS, lastAppliedKey: 0 })
    useCampaignStore.setState(initialCampaignData())
    const fresh = useCampaignStore.getState()
    const quiet = priceOutcome(winResult({ quietReplay: true }), economySlice(authored('m01'), false, true, 1))
    debrief('m01', quiet)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    const c = useCampaignStore.getState()
    expect([c.intelLevel, c.intelProgress]).toEqual([fresh.intelLevel, fresh.intelProgress])
  })
})

describe('Debrief Credits apply once; no Credits move during a mission (EC-012)', () => {
  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      // Pin every timed flow off the ETA span so only the payout moves Credits.
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: 1e12,
    })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', squad: ['op1', 'op2', 'op4'] })
  })

  it('AC 1: a 75,000 CR net payout applied twice under key K lands once (203,450 CR)', () => {
    const o = outcome({ applyKey: 7, reward: 75000, bonus: 0, civiliansHit: 0 })
    expect(netPayout(o)).toBe(75000)
    useAppStore.getState().setOutcome(o)
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(203450)
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(203450)
    expect(useAppStore.getState().lastAppliedKey).toBe(7)
  })

  it('AC 2: an outcome re-carrying key K is a no-op; a higher key applies', () => {
    useAppStore.getState().setOutcome(outcome({ applyKey: 3, reward: 75000 }))
    applyDebrief('m01')
    const afterFirst = useAppStore.getState().credits
    expect(afterFirst).toBe(START_CREDITS + 75000)

    // A fresh outcome object, same key K: still nothing.
    useAppStore.getState().setOutcome(outcome({ applyKey: 3, reward: 75000 }))
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(afterFirst)

    useAppStore.getState().setOutcome(outcome({ applyKey: 4, reward: 75000 }))
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(afterFirst + 75000)
    expect(useAppStore.getState().lastAppliedKey).toBe(4)
  })

  it('Tax deposited during the ETA catch-up is single-shot under the same key', () => {
    // Tax back on: the win's ETA span crosses Tax ticks.
    useWorldStore.setState({ nextTaxT: worldBoot.nextTaxT })
    useAppStore.getState().setOutcome(outcome({ applyKey: 1, reward: 75000 }))
    applyDebrief('m01')
    const afterFirst = useAppStore.getState().credits
    const influence = useWorldStore.getState().influence
    // Strictly greater: at least one Tax tick landed inside the ETA span.
    expect(afterFirst).toBeGreaterThan(START_CREDITS + 75000)
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(afterFirst)
    expect(useWorldStore.getState().influence).toBe(influence)
  })

  it('AC 3: Credits at deploy stay put while the mission runs', () => {
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
    const C = useAppStore.getState().credits

    // The MissionScreen composer: mint the key, freeze the deploy, build the world.
    const mission = { ...MISSIONS[0], objectives: [] }
    const ops = useAppStore.getState().squad.map(liveOperativeById)
    const applyKey = useAppStore.getState().deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const w = createWorld(mission, ops, freezeDeploy(mission, ops, applyKey))
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)

    // Two minutes of sim time in MAX_DT frames, checking Credits every frame.
    while (w.time < 120) {
      w.tick(0.05)
      expect(useAppStore.getState().credits).toBe(C)
    }
    expect(useMissionStore.getState().result).toBe('none')
    expect(useAppStore.getState().phase).toBe('mission')
    expect(useAppStore.getState().outcome).toBeNull()
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    // applyDebrief with no outcome yet moves nothing either.
    applyDebrief(MISSIONS[0].id)
    expect(useAppStore.getState().credits).toBe(C)
    useMissionStore.getState().reset()
  })
})

describe('Wins pay in full: loss-retry, generated and post-campaign (EC-011)', () => {
  // TR-economy-004 / TR-economy-008 / ADR-0004 / ADR-0021: only a repeat win
  // of an authored contract is quiet. A retry after a loss, any generated win,
  // and a generated win after campaign-complete all pay net_payout in full via
  // applyDebrief -> addCredits. World Network apply is stubbed out per the GDD
  // ACs ("World Network apply not run").
  const AUTHORED_IDS = MISSIONS.map((m) => m.id)
  const authored = (id: string) => {
    const m = MISSIONS.find((x) => x.id === id)
    if (!m) throw new Error('missing authored mission ' + id)
    return m
  }

  function winResult(over: Partial<MissionResult> = {}): MissionResult {
    return {
      applyKey: 1,
      won: true,
      kills: 5,
      casualties: 0,
      timeSec: 300,
      civiliansHit: 0,
      completedOptionalIds: [],
      deadIds: [],
      survivorHp: {},
      quietReplay: false,
      ...over,
    }
  }

  function generated(seed: number, reward: number): GeneratedContract {
    return {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: 0,
      expiresAtT: 1e9,
      sector: 'eu',
      cityId: CITIES_BY_SECTOR.eu[0].id,
      district: 5,
      type: 'SEIZURE',
      client: sectorClient('eu', initialOwner()),
      threat: 'HIGH',
      reward,
      seed,
      priority: false,
      expedited: false,
    }
  }

  // Freeze, price and debrief one win the way MissionScreen + Debrief do,
  // with World Network apply stubbed out. Returns the priced outcome.
  function deployAndWin(missionId: string, applyKey: number, over: Partial<MissionResult> = {}) {
    const mission = resolveMission(missionId)
    if (!mission) throw new Error('mission did not resolve ' + missionId)
    const deploy = freezeDeploy(mission, DEFAULT_SQUAD.map(operativeById), applyKey)
    const o = priceOutcome(
      winResult({ applyKey, quietReplay: deploy.economy.quietReplay, ...over }),
      deploy.economy,
    )
    const world = useWorldStore.getState()
    let worldApplies = 0
    useWorldStore.setState({ applyMissionResult: () => void (worldApplies += 1) })
    try {
      useAppStore.setState({ phase: 'mission', missionId })
      useAppStore.getState().setOutcome(o)
      applyDebrief(missionId)
    } finally {
      useWorldStore.setState({ applyMissionResult: world.applyMissionResult })
    }
    expect(worldApplies).toBe(1)
    return { o, deploy }
  }

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      // Timed flows off the ETA span so only the payout moves Credits.
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
  })

  it('AC 1: Glass Veil retry win after a loss at 128,450 CR lands 213,450 CR', () => {
    // The earlier loss: pays nothing and does not mark the contract won.
    const loss = priceOutcome(
      winResult({ won: false, quietReplay: false }),
      economySlice(authored('m01'), false, false, 1),
    )
    useAppStore.setState({ phase: 'mission', missionId: 'm01' })
    useAppStore.getState().setOutcome(loss)
    applyDebrief('m01')
    expect(useAppStore.getState().credits).toBe(128450)
    expect(useCampaignStore.getState().contractsWon).not.toContain('m01')

    const { o, deploy } = deployAndWin('m01', 2)
    expect(deploy.economy.quietReplay).toBe(false)
    expect(o.reward).toBe(85000)
    expect(netPayout(o)).toBe(85000)
    expect(useAppStore.getState().credits).toBe(213450)
    expect(useAppStore.getState().lastAppliedKey).toBe(2)
    expect(useCampaignStore.getState().contractsWon).toContain('m01')
  })

  it('AC 2: a generated win, Reward 54,500 CR, 0 hits, bonus 0 adds 54,500 CR', () => {
    const c = generated(51, 54500)
    useWorldStore.setState({ contracts: [c] })
    const { o, deploy } = deployAndWin(c.id, 1)
    expect(deploy.economy.generated).toBe(true)
    expect(deploy.economy.quietReplay).toBe(false)
    expect(o.reward).toBe(54500)
    expect(o.bonus).toBe(0)
    expect(netPayout(o)).toBe(54500)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 54500)
  })

  it('AC 3: after campaign-complete a generated win still adds 54,500 CR', () => {
    useCampaignStore.setState({ contractsWon: [...AUTHORED_IDS], campaignWon: true })
    const c = generated(52, 54500)
    useWorldStore.setState({ contracts: [c] })
    const { o, deploy } = deployAndWin(c.id, 1)
    expect(deploy.economy.quietReplay).toBe(false)
    expect(netPayout(o)).toBe(54500)
    expect(useAppStore.getState().credits).toBe(START_CREDITS + 54500)
    expect(useCampaignStore.getState().campaignWon).toBe(true)
  })

  it('AC 4: Glass Veil won as part of campaign-complete: a later win nets 0 CR, reward still reported', () => {
    // Reach campaign-complete through the real report path.
    for (const [i, id] of AUTHORED_IDS.entries()) deployAndWin(id, i + 1)
    expect(useCampaignStore.getState().campaignWon).toBe(true)
    const before = useAppStore.getState().credits

    const { o, deploy } = deployAndWin('m01', AUTHORED_IDS.length + 1)
    expect(deploy.economy.quietReplay).toBe(true)
    expect(o.reward).toBe(85000)
    expect(netPayout(o)).toBe(0)
    expect(useAppStore.getState().credits).toBe(before)
    expect(useAppStore.getState().lastAppliedKey).toBe(AUTHORED_IDS.length + 1)
  })

  it('setOutcome alone never moves Credits on a paying win', () => {
    const o = priceOutcome(winResult(), economySlice(authored('m01'), false, false, 1))
    expect(netPayout(o)).toBe(85000)
    useAppStore.setState({ phase: 'mission', missionId: 'm01' })
    useAppStore.getState().setOutcome(o)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
  })
})

describe('Accepting a contract is free; one pipeline for both kinds (EC-004)', () => {
  // TR-economy-003 / ADR-0003 / ADR-0013: authored and generated contracts are
  // one kind of work. selectMission and ACCEPT CONTRACT (goto('team')) move no
  // Credits, and both kinds walk Brief -> Assembly -> Mission -> Debrief
  // through the same store actions. World Network apply is stubbed out.
  function generated(seed: number): GeneratedContract {
    return {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: 0,
      expiresAtT: 1e9,
      sector: 'eu',
      cityId: CITIES_BY_SECTOR.eu[0].id,
      district: 5,
      type: 'SEIZURE',
      client: sectorClient('eu', initialOwner()),
      // MODERATE needs Intel 1, the starting level; the Intel gate is out of scope.
      threat: 'MODERATE',
      reward: 54500,
      seed,
      priority: false,
      expedited: false,
    }
  }

  // Plays one contract from the World Network to Debrief using only the
  // public store actions the screens call, recording every phase entered.
  function playToWin(missionId: string, applyKey: number): string[] {
    const phases: string[] = []
    const unsub = useAppStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase) phases.push(s.phase)
    })
    const world = useWorldStore.getState()
    useWorldStore.setState({ applyMissionResult: () => {} })
    try {
      const app = useAppStore.getState()
      app.selectMission(missionId)
      useAppStore.getState().goto('team') // ACCEPT CONTRACT
      useAppStore.getState().startMission()
      const mission = resolveMission(missionId)
      if (!mission) throw new Error('mission did not resolve ' + missionId)
      const deploy = freezeDeploy(mission, DEFAULT_SQUAD.map(operativeById), applyKey)
      const o = priceOutcome(
        {
          applyKey,
          won: true,
          kills: 5,
          casualties: 0,
          timeSec: 300,
          civiliansHit: 0,
          completedOptionalIds: [],
          deadIds: [],
          survivorHp: {},
          quietReplay: deploy.economy.quietReplay,
        },
        deploy.economy,
      )
      useAppStore.getState().setOutcome(o)
      applyDebrief(missionId)
    } finally {
      unsub()
      useWorldStore.setState({ applyMissionResult: world.applyMissionResult })
    }
    return phases
  }

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    useAppStore.setState({ phase: 'world', missionId: null })
  })

  it('AC 1: accepting an authored contract leaves Credits at 128,450 CR', () => {
    useAppStore.getState().selectMission('m01')
    expect(useAppStore.getState().phase).toBe('brief')
    expect(useAppStore.getState().credits).toBe(128450)
    useAppStore.getState().goto('team')
    expect(useAppStore.getState().phase).toBe('team')
    expect(useAppStore.getState().credits).toBe(128450)
  })

  it('AC 1: accepting a generated contract leaves Credits at 128,450 CR', () => {
    const c = generated(41)
    useWorldStore.setState({ contracts: [c] })
    useAppStore.getState().selectMission(c.id)
    expect(useAppStore.getState().missionId).toBe(c.id)
    expect(useAppStore.getState().phase).toBe('brief')
    expect(useAppStore.getState().credits).toBe(128450)
    useAppStore.getState().goto('team')
    expect(useAppStore.getState().credits).toBe(128450)
  })

  it('edge: backing out of a Brief does not charge', () => {
    const c = generated(42)
    useWorldStore.setState({ contracts: [c] })
    for (const id of ['m01', c.id]) {
      useAppStore.getState().selectMission(id)
      useAppStore.getState().goto('world')
      expect(useAppStore.getState().phase).toBe('world')
      expect(useAppStore.getState().credits).toBe(128450)
    }
  })

  it('edge: entering the mission moves no Credits for either kind', () => {
    const c = generated(43)
    useWorldStore.setState({ contracts: [c] })
    for (const id of ['m01', c.id]) {
      useAppStore.setState({ phase: 'world', missionId: null })
      useAppStore.getState().selectMission(id)
      useAppStore.getState().goto('team')
      useAppStore.getState().startMission()
      expect(useAppStore.getState().phase).toBe('mission')
      expect(useAppStore.getState().credits).toBe(128450)
    }
  })

  it('AC 2: an authored win visits Brief, Assembly, Mission, Debrief in order', () => {
    expect(playToWin('m01', 1)).toEqual(['brief', 'team', 'mission', 'debrief'])
  })

  it('AC 2: a generated win visits the same four screens in the same order', () => {
    const c = generated(44)
    useWorldStore.setState({ contracts: [c] })
    expect(playToWin(c.id, 1)).toEqual(['brief', 'team', 'mission', 'debrief'])
  })

  it('AC 3: Glass Veil already won stays selectable from the World Network', () => {
    playToWin('m01', 1)
    expect(useCampaignStore.getState().contractsWon).toContain('m01')
    useAppStore.getState().returnFromDebrief()
    expect(useAppStore.getState().phase).toBe('world')
    expect(useAppStore.getState().missionId).toBeNull()
    const credits = useAppStore.getState().credits
    useAppStore.getState().selectMission('m01')
    expect(useAppStore.getState().missionId).toBe('m01')
    expect(useAppStore.getState().phase).toBe('brief')
    expect(useAppStore.getState().credits).toBe(credits)
  })
})

describe('Abort writes nothing to Economy (EC-013)', () => {
  // TR-economy-008 / TR-economy-006 / ADR-0002 / ADR-0021: a mission in
  // progress is memory only. Confirmed Abort (Hud onAbort -> goto('world'),
  // then MissionScreen teardown) builds no invoice, moves no Credits, leaves
  // the contract record where it was at deploy, and burns the apply-once key.
  function generated(seed: number): GeneratedContract {
    return {
      id: 'gc' + seed.toString(16).padStart(8, '0'),
      createdT: 0,
      expiresAtT: 1e12,
      sector: 'eu',
      cityId: CITIES_BY_SECTOR.eu[0].id,
      district: 5,
      type: 'SEIZURE',
      client: sectorClient('eu', initialOwner()),
      // MODERATE needs Intel 1, which the opening director holds: Offered.
      threat: 'MODERATE',
      reward: 41500,
      seed,
      priority: false,
      expedited: false,
    }
  }

  // Brief -> Assembly -> Deploy, then the MissionScreen composer: mint the
  // key, freeze the deploy, build and publish the world, run `seconds` of sim.
  function deployAndRun(missionId: string, seconds: number): number {
    useAppStore.setState({ phase: 'world', missionId: null })
    useAppStore.getState().selectMission(missionId)
    useAppStore.getState().goto('team')
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
    const mission = resolveMission(missionId)
    if (!mission) throw new Error('mission did not resolve ' + missionId)
    const ops = useAppStore.getState().squad.map(liveOperativeById)
    const applyKey = useAppStore.getState().deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const world = createWorld(mission, ops, freezeDeploy(mission, ops, applyKey))
    setWorld(world)
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)
    while (world.time < seconds) world.tick(0.05)
    expect(useMissionStore.getState().result).toBe('none')
    return applyKey
  }

  // Hud onAbort, then the MissionScreen effect cleanup.
  function confirmAbort(): void {
    useAppStore.getState().goto('world')
    setWorld(null)
    useMissionStore.getState().reset()
  }

  // Every Economy-visible field an abort must not touch.
  function ledger() {
    const app = useAppStore.getState()
    const w = useWorldStore.getState()
    const c = useCampaignStore.getState()
    return structuredClone({
      credits: app.credits,
      outcome: app.outcome,
      lastAppliedKey: app.lastAppliedKey,
      contracts: w.contracts,
      t: w.t,
      nextTaxT: w.nextTaxT,
      influence: w.influence,
      contractsWon: c.contractsWon,
      lastReport: c.lastReport,
    })
  }

  function expectNoDebrief(): void {
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    expect(getWorld()).toBeNull()
  }

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useCampaignStore.setState(initialCampaignData())
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    useAppStore.setState({
      phase: 'world',
      missionId: null,
      squad: [...DEFAULT_SQUAD],
      loadout: {},
      credits: START_CREDITS,
      outcome: null,
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    // A test that throws mid-mission must not leak its world into the next.
    setWorld(null)
    useMissionStore.getState().reset()
  })

  it('AC 1: Abort on an Offered generated contract: no invoice, Credits C, record still Offered', () => {
    const c = generated(61)
    useWorldStore.setState({ contracts: [c] })
    const intel = useCampaignStore.getState().intelLevel
    expect(visibleContracts(useWorldStore.getState().contracts, intel)).toEqual([c])
    const before = ledger()

    deployAndRun(c.id, 60)
    confirmAbort()

    expectNoDebrief()
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useWorldStore.getState().contracts).toEqual([c])
    expect(visibleContracts(useWorldStore.getState().contracts, intel)).toEqual([c])
    expect(ledger()).toEqual(before)
  })

  it('AC 2: Abort on Glass Veil Unwon: no invoice, Credits C, Glass Veil still Unwon', () => {
    expect(useCampaignStore.getState().contractsWon).not.toContain('m01')
    const before = ledger()

    deployAndRun('m01', 60)
    confirmAbort()

    expectNoDebrief()
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useCampaignStore.getState().contractsWon).not.toContain('m01')
    expect(ledger()).toEqual(before)
  })

  it('edge: Abort at t = 0 writes nothing either', () => {
    const before = ledger()
    deployAndRun('m01', 0)
    confirmAbort()
    expectNoDebrief()
    expect(ledger()).toEqual(before)
  })

  it('edge: Abort after hits taken writes nothing either', () => {
    const before = ledger()
    deployAndRun('m01', 120)
    const world = getWorld()
    if (!world) throw new Error('no live world')
    // The squad has been hit before the abort.
    const hurt = world.units.filter((u) => u.kind === 'agent' && u.hp < u.maxHp)
    expect(hurt.length).toBeGreaterThan(0)
    confirmAbort()
    expectNoDebrief()
    expect(ledger()).toEqual(before)
  })

  it('AC 3: a second Abort or teardown after Abort is a no-op: Credits, record and key unchanged, no ETA', () => {
    const c = generated(62)
    useWorldStore.setState({ contracts: [c] })
    const before = ledger()

    const key = deployAndRun(c.id, 120)
    confirmAbort()
    const afterAbort = ledger()
    expect(afterAbort).toEqual(before)

    // Abort confirmed again, then teardown again (a StrictMode double cleanup).
    useAppStore.getState().goto('world')
    confirmAbort()
    // A Debrief apply on the way back finds no invoice: nothing to file.
    applyDebrief(c.id)

    expectNoDebrief()
    expect(ledger()).toEqual(afterAbort)
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
    expect(useWorldStore.getState().contracts).toEqual([c])
    // The burned key is never applied and never re-minted by the abort path.
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    expect(useAppStore.getState().deploySerial).toBe(key)
    // No ETA: the strategic clock and the Tax schedule did not move.
    expect(useWorldStore.getState().t).toBe(before.t)
    expect(useWorldStore.getState().nextTaxT).toBe(before.nextTaxT)
  })

  it('AC 3: the next deploy after an abort mints a fresh key above the burned one', () => {
    const burned = deployAndRun('m01', 30)
    confirmAbort()
    const next = deployAndRun('m01', 0)
    expect(next).toBe(burned + 1)
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    confirmAbort()
  })
})

describe('priced outcome stores Collateral and net payout (ADR-0021 §4)', () => {
  const result: MissionResult = {
    applyKey: 1,
    won: true,
    kills: 0,
    casualties: 0,
    timeSec: 60,
    civiliansHit: 3,
    completedOptionalIds: ['opt'],
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
  }
  const pricing = { reward: 62000, bonusDefs: { opt: 9000 } }

  it('priceOutcome stores collateral and netPayout, and the helpers read them back', () => {
    const o = priceOutcome(result, pricing)
    expect(o.collateral).toBe(3 * COLLATERAL_FINE)
    expect(o.netPayout).toBe(62000 + 9000 - 3 * COLLATERAL_FINE)
    expect(collateralFine(o)).toBe(o.collateral)
    expect(netPayout(o)).toBe(o.netPayout)
  })

  it('helpers do not re-derive: a stored figure wins over the hit count', () => {
    const o = { ...priceOutcome(result, pricing), civiliansHit: 99 }
    expect(collateralFine(o)).toBe(3 * COLLATERAL_FINE)
  })

  it('a loss and a quiet replay store the priced Collateral and a zero payout', () => {
    for (const over of [{ won: false }, { quietReplay: true }, { won: false, quietReplay: true }]) {
      const o = priceOutcome({ ...result, ...over }, pricing)
      expect(o.collateral).toBe(3 * COLLATERAL_FINE)
      expect(o.netPayout).toBe(0)
    }
  })

  it('isPaid is a win that is not a quiet replay', () => {
    expect(isPaid({ won: true, quietReplay: false })).toBe(true)
    expect(isPaid({ won: false, quietReplay: false })).toBe(false)
    expect(isPaid({ won: true, quietReplay: true })).toBe(false)
    expect(isPaid({ won: false, quietReplay: true })).toBe(false)
  })

  it('settleOutcome prices non-finite reward and bonus as 0', () => {
    const o = settleOutcome({ ...outcome(), reward: Number.NaN, bonus: Number.POSITIVE_INFINITY })
    expect([o.reward, o.bonus, o.collateral, o.netPayout]).toEqual([0, 0, 0, 0])
  })
})

// RS-002 / TR-research-005: the production authorize command is
// appStore.authorizeResearch (owner decision R-5). Success is check, start(),
// then exactly one spendCredits(cost); Research keeps no Credits ledger.
describe('Authorize success: start, then one debit (RS-002)', () => {
  const PROPELLANTS = nodeById('b-propellants')
  const idle = () => ({ ballistics: null, cybernetics: null, control: null })

  beforeEach(() => {
    useResearchStore.setState({ done: [], labs: idle() })
  })

  // Wraps start / spendCredits / addCredits so a test can count calls and
  // their order. Restored by the caller.
  function spyAuthorize() {
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    const calls: string[] = []
    const spent: number[] = []
    useResearchStore.setState({
      start: (node, t) => (calls.push('start'), research.start(node, t)),
    })
    useAppStore.setState({
      spendCredits: (n) => (calls.push('spendCredits'), spent.push(n), app.spendCredits(n)),
      addCredits: (n) => (calls.push('addCredits'), app.addCredits(n)),
    })
    const restore = () => {
      useResearchStore.setState({ start: research.start })
      useAppStore.setState({ spendCredits: app.spendCredits, addCredits: app.addCredits })
    }
    return { calls, spent, restore }
  }

  it('each idle lab with one available root project: all three authorized run 3 labs, 1 active each', () => {
    const roots = BRANCH_IDS.map((b) => nodesOfBranch(b).find((n) => n.needs.length === 0)!)
    const total = roots.reduce((sum, n) => sum + n.cost, 0)
    useAppStore.setState({ credits: total })
    for (const n of roots) expect(nodeState(n, [], idle())).toBe('available')

    for (const n of roots) expect(useAppStore.getState().authorizeResearch(n, 0).ok).toBe(true)

    const { labs, done } = useResearchStore.getState()
    expect(labsRunning(labs)).toBe(3)
    for (const b of BRANCH_IDS) {
      const active = nodesOfBranch(b).filter((n) => nodeState(n, done, labs) === 'active')
      expect(active.map((n) => n.id)).toEqual([labs[b]!.id])
    }
    expect(useAppStore.getState().credits).toBe(0)
  })

  for (const C of [16000, 20000]) {
    it(`Advanced Propellants at 16,000 CR with C = ${C}: start once, spendCredits(16000) once, no addCredits, Credits = C - 16,000`, () => {
      expect(PROPELLANTS.cost).toBe(16000)
      useAppStore.setState({ credits: C })
      expect(nodeState(PROPELLANTS, [], idle())).toBe('available')
      const { calls, spent, restore } = spyAuthorize()
      let ok: boolean
      try {
        ok = useAppStore.getState().authorizeResearch(PROPELLANTS, 0).ok
      } finally {
        restore()
      }
      expect(ok).toBe(true)
      // start first, then exactly one debit; never spend-then-start.
      expect(calls).toEqual(['start', 'spendCredits'])
      expect(spent).toEqual([16000])
      const { labs, done } = useResearchStore.getState()
      expect(labs.ballistics?.id).toBe(PROPELLANTS.id)
      expect(nodeState(PROPELLANTS, done, labs)).toBe('active')
      expect(useAppStore.getState().credits).toBe(C - 16000)
    })
  }

  it('a non-positive or non-finite listed cost returns before start(): lab idle, project available, Credits unchanged', () => {
    useAppStore.setState({ credits: 20000 })
    for (const cost of [0, -16000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const { calls, restore } = spyAuthorize()
      let ok: boolean
      try {
        ok = useAppStore.getState().authorizeResearch({ ...PROPELLANTS, cost }, 0).ok
      } finally {
        restore()
      }
      expect(ok).toBe(false)
      expect(calls).toEqual([])
      const { labs, done } = useResearchStore.getState()
      expect(labs.ballistics).toBeNull()
      expect(nodeState(PROPELLANTS, done, labs)).toBe('available')
      expect(useAppStore.getState().credits).toBe(20000)
    }
  })
})

// RS-003 / TR-research-005 (ADR-0013, research.md Core Rule 3): authorize when
// Economy refuses, when start() refuses, and when the debit does not land.
describe('Authorize when Economy refuses or start() fails (RS-003)', () => {
  const PROPELLANTS = nodeById('b-propellants')
  const idle = () => ({ ballistics: null, cybernetics: null, control: null })

  beforeEach(() => {
    useResearchStore.setState({ done: [], labs: idle() })
  })

  // Wraps start / spendCredits / addCredits, records every call, and counts
  // app-store
  // notifications so any credits write — setState({ credits }) included — is
  // visible. `start` and `spend` override the real behaviour when given.
  function spyAuthorize(opts: { start?: boolean; spend?: 'noop' } = {}) {
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    const calls: string[] = []
    let appWrites = 0
    useResearchStore.setState({
      start: (node, t) => {
        calls.push('start')
        return opts.start === false ? false : research.start(node, t)
      },
    })
    useAppStore.setState({
      spendCredits: (n) => {
        calls.push('spendCredits')
        if (opts.spend !== 'noop') app.spendCredits(n)
      },
      addCredits: (n) => (calls.push('addCredits'), app.addCredits(n)),
    })
    // Patched after the setState above, so only authorize's own writes count.
    const unsub = useAppStore.subscribe(() => appWrites++)
    const restore = () => {
      unsub()
      useResearchStore.setState({ start: research.start })
      useAppStore.setState({ spendCredits: app.spendCredits, addCredits: app.addCredits })
    }
    return { calls, writes: () => appWrites, restore }
  }

  function authorize(opts: Parameters<typeof spyAuthorize>[0] = {}) {
    const spy = spyAuthorize(opts)
    let ok: boolean
    try {
      ok = useAppStore.getState().authorizeResearch(PROPELLANTS, 0).ok
    } finally {
      spy.restore()
    }
    return { ok, calls: spy.calls, writes: spy.writes() }
  }

  function expectIdleAndAvailable() {
    const { labs, done } = useResearchStore.getState()
    expect(labs).toEqual(idle())
    expect(nodeState(PROPELLANTS, done, labs)).toBe('available')
  }

  it('Economy refuses the 16,000 CR spend: start() not called, Ballistics idle, project available', () => {
    expect(PROPELLANTS.cost).toBe(16000)
    for (const C of [0, 15999]) {
      useAppStore.setState({ credits: C })
      expect(nodeState(PROPELLANTS, [], idle())).toBe('available')
      const { ok, calls, writes } = authorize()
      expect(ok).toBe(false)
      expect(calls).toEqual([])
      expect(writes).toBe(0)
      expectIdleAndAvailable()
      expect(useAppStore.getState().credits).toBe(C)
    }
  })

  it('start() true but the debit does not land: Credits re-read after spend, undo leaves lab idle, project available, Credits = C, no addCredits or credits write', () => {
    const C = 20000
    useAppStore.setState({ credits: C })
    let labsAfterStart: unknown = 'unset'
    const research = useResearchStore.getState()
    const { ok, calls, writes } = (() => {
      const spy = spyAuthorize({ spend: 'noop' })
      // Capture the occupancy start() really set, to prove start ran before
      // the undo (an early return that never called start() fails here).
      const wrapped = useResearchStore.getState().start
      useResearchStore.setState({
        start: (node, t) => {
          const r = wrapped(node, t)
          labsAfterStart = useResearchStore.getState().labs.ballistics
          return r
        },
      })
      let ok: boolean
      try {
        ok = useAppStore.getState().authorizeResearch(PROPELLANTS, 0).ok
      } finally {
        spy.restore()
        useResearchStore.setState({ start: research.start })
      }
      return { ok, calls: spy.calls, writes: spy.writes() }
    })()
    expect(ok).toBe(false)
    expect(calls[0]).toBe('start')
    expect(labsAfterStart).toMatchObject({ id: PROPELLANTS.id })
    expect(calls).toEqual(['start', 'spendCredits'])
    expect(calls).not.toContain('addCredits')
    // No app-store write at all: no setState({ credits }), no restore.
    expect(writes).toBe(0)
    expectIdleAndAvailable()
    expect(useAppStore.getState().credits).toBe(C)
  })

  it('the post-spend Credits read decides the outcome: same start() and one spendCredits, landed debit keeps the lab, a debit that did not land releases it', () => {
    // The only difference between the two runs is what Credits read after
    // spendCredits; without a post-spend re-read both would return true.
    useAppStore.setState({ credits: 20000 })
    const landed = authorize()
    expect(landed.calls).toEqual(['start', 'spendCredits'])
    expect(landed.ok).toBe(true)
    expect(useResearchStore.getState().labs.ballistics?.id).toBe(PROPELLANTS.id)
    expect(useAppStore.getState().credits).toBe(4000)

    useResearchStore.setState({ done: [], labs: idle() })
    useAppStore.setState({ credits: 20000 })
    const missed = authorize({ spend: 'noop' })
    expect(missed.calls).toEqual(['start', 'spendCredits'])
    expect(missed.ok).toBe(false)
    expectIdleAndAvailable()
    expect(useAppStore.getState().credits).toBe(20000)
  })

  it('the undo releases only the lab it took: other running labs are untouched', () => {
    const cyber = nodesOfBranch('cybernetics').find((n) => n.needs.length === 0)!
    useAppStore.setState({ credits: cyber.cost + PROPELLANTS.cost })
    expect(useAppStore.getState().authorizeResearch(cyber, 0).ok).toBe(true)
    const running = useResearchStore.getState().labs.cybernetics
    const { ok } = authorize({ spend: 'noop' })
    expect(ok).toBe(false)
    const { labs } = useResearchStore.getState()
    expect(labs.ballistics).toBeNull()
    expect(labs.cybernetics).toBe(running)
    expect(useAppStore.getState().credits).toBe(PROPELLANTS.cost)
  })

  it('start() returns false with Credits at least the cost: spendCredits not called, Credits unchanged, lab idle, project available', () => {
    for (const C of [16000, 20000]) {
      useAppStore.setState({ credits: C })
      const { ok, calls, writes } = authorize({ start: false })
      expect(ok).toBe(false)
      expect(calls).toEqual(['start'])
      expect(writes).toBe(0)
      expectIdleAndAvailable()
      expect(useAppStore.getState().credits).toBe(C)
    }
  })

  it('the undo is internal: no cancel / stop / abort / undo / refund API and no reason enum is exported', async () => {
    const forbidden = /cancel|stop|abort|undo|refund|release|reason/i
    const appMod = await import('./appStore')
    const researchMod = await import('./researchStore')
    for (const name of [
      ...Object.keys(appMod),
      ...Object.keys(researchMod),
      ...Object.keys(useAppStore.getState()),
      ...Object.keys(useResearchStore.getState()),
    ]) {
      expect(name).not.toMatch(forbidden)
    }
  })
})

// RS-005 / research.md UI Requirements: an ineligible authorize returns before
// start() and spendCredits, even with balance >= cost, and its refusal text
// names the actual cause plus a credits-unchanged phrase. Assertions are on
// substrings and index order, never whole sentences. Catalog titles are
// upper-case house style, so prerequisite names are matched case-insensitively;
// the catalog title itself is matched verbatim.
describe('Refusal text for locked, researched and busy-lab projects (RS-005)', () => {
  const PROPELLANTS = nodeById('b-propellants')
  const COATING = nodeById('b-coating')
  const HYPERVELOCITY = nodeById('b-hypervelocity')
  const SABOT = nodeById('b-sabot')
  const CREDITS_UNCHANGED = 'Credits did not change'
  const LAB_NOT_IDLE = 'lab not idle'
  const ALREADY_RESEARCHED = 'already researched'
  const idle = () => ({ ballistics: null, cybernetics: null, control: null })
  const running = (id: string) => ({ ...idle(), ballistics: { id, startedT: 0, endT: 7200 } })
  // Words that would imply a charge was attempted on the inspect surface.
  const CHARGE = /credit|charge|spend|spent|debit|bill|cost|\bCR\b/i

  beforeEach(() => {
    useResearchStore.setState({ done: [], labs: idle() })
  })

  // Records start / spendCredits / addCredits calls and app-store writes.
  function authorize(node: typeof PROPELLANTS) {
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    const calls: string[] = []
    let writes = 0
    useResearchStore.setState({ start: (n, t) => (calls.push('start'), research.start(n, t)) })
    useAppStore.setState({
      spendCredits: (n) => (calls.push('spendCredits'), app.spendCredits(n)),
      addCredits: (n) => (calls.push('addCredits'), app.addCredits(n)),
    })
    const unsub = useAppStore.subscribe(() => writes++)
    try {
      const r = useAppStore.getState().authorizeResearch(node, 0)
      return { ...r, calls, writes }
    } finally {
      unsub()
      useResearchStore.setState({ start: research.start })
      useAppStore.setState({ spendCredits: app.spendCredits, addCredits: app.addCredits })
    }
  }

  it('locked Hypervelocity Core on an idle lab: refused before start() and spendCredits even with balance >= cost; text names the title, Advanced Propellants, and Credits unchanged', () => {
    const C = HYPERVELOCITY.cost + 50000
    useAppStore.setState({ credits: C })
    expect(nodeState(HYPERVELOCITY, [], idle())).toBe('locked')

    const r = authorize(HYPERVELOCITY)

    expect(r.ok).toBe(false)
    expect(r.calls).toEqual([])
    expect(r.writes).toBe(0)
    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toBeNull()
    expect(nodeState(HYPERVELOCITY, done, labs)).toBe('locked')
    expect(useAppStore.getState().credits).toBe(C)
    expect(r.text).toContain(nodeTitle(HYPERVELOCITY))
    expect(r.text.toLowerCase()).toContain('advanced propellants')
    expect(r.text).toContain(CREDITS_UNCHANGED)
  })

  it('inspect of locked Hypervelocity Core names the locked state and Advanced Propellants and does not imply a charge', () => {
    const text = eligibilityText(HYPERVELOCITY, [], idle())!
    expect(text.toLowerCase()).toContain('locked')
    expect(text.toLowerCase()).toContain('advanced propellants')
    expect(text).not.toMatch(CHARGE)
  })

  it('Tungsten Sabot locked on a busy Ballistics lab: both prerequisites appear before the lab-not-idle phrase, plus title and Credits unchanged', () => {
    useResearchStore.setState({ done: [], labs: running(PROPELLANTS.id) })
    const C = SABOT.cost + 1000
    useAppStore.setState({ credits: C })
    expect(nodeState(SABOT, [], running(PROPELLANTS.id))).toBe('locked')

    const r = authorize(SABOT)

    expect(r.ok).toBe(false)
    expect(r.calls).toEqual([])
    expect(r.writes).toBe(0)
    expect(useResearchStore.getState().labs.ballistics?.id).toBe(PROPELLANTS.id)
    expect(useAppStore.getState().credits).toBe(C)
    expect(r.text).toContain(nodeTitle(SABOT))
    const lower = r.text.toLowerCase()
    const rail = lower.indexOf('rail stabilization')
    const frag = lower.indexOf('smart fragmentation')
    const busy = r.text.indexOf(LAB_NOT_IDLE)
    expect(rail).toBeGreaterThanOrEqual(0)
    expect(frag).toBeGreaterThanOrEqual(0)
    expect(busy).toBeGreaterThanOrEqual(0)
    expect(rail).toBeLessThan(busy)
    expect(frag).toBeLessThan(busy)
    expect(r.text).toContain(CREDITS_UNCHANGED)
  })

  it('researched Advanced Propellants on an idle lab: refused before start() and spendCredits, stays researched; text says already researched and Credits unchanged', () => {
    useResearchStore.setState({ done: [PROPELLANTS.id], labs: idle() })
    const C = PROPELLANTS.cost * 2
    useAppStore.setState({ credits: C })

    const r = authorize(PROPELLANTS)

    expect(r.ok).toBe(false)
    expect(r.calls).toEqual([])
    expect(r.writes).toBe(0)
    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toBeNull()
    expect(done).toEqual([PROPELLANTS.id])
    expect(nodeState(PROPELLANTS, done, labs)).toBe('researched')
    expect(useAppStore.getState().credits).toBe(C)
    expect(r.text).toContain(ALREADY_RESEARCHED)
    expect(r.text).toContain(CREDITS_UNCHANGED)
  })

  it('inspect of researched Advanced Propellants says already researched and does not imply a charge', () => {
    const text = eligibilityText(PROPELLANTS, [PROPELLANTS.id], idle())!
    expect(text).toContain(ALREADY_RESEARCHED)
    expect(text).not.toMatch(CHARGE)
  })

  it('available Barrel Wear Coating on a busy Ballistics lab: refused before start() and spendCredits, stays available, lab still runs Advanced Propellants; text says lab not idle and Credits unchanged', () => {
    useResearchStore.setState({ done: [], labs: running(PROPELLANTS.id) })
    const C = COATING.cost + 1000
    useAppStore.setState({ credits: C })
    const runBefore = useResearchStore.getState().labs.ballistics

    const r = authorize(COATING)

    expect(r.ok).toBe(false)
    expect(r.calls).toEqual([])
    expect(r.writes).toBe(0)
    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toBe(runBefore)
    expect(nodeState(COATING, done, labs)).toBe('available')
    expect(useAppStore.getState().credits).toBe(C)
    expect(r.text).toContain(LAB_NOT_IDLE)
    expect(r.text).toContain(CREDITS_UNCHANGED)
  })

  it('a debit that does not land: the undo text says Credits did not change and the lab was not occupied', () => {
    useAppStore.setState({ credits: 20000 })
    const app = useAppStore.getState()
    useAppStore.setState({ spendCredits: () => {} })
    let r: { ok: boolean; text: string }
    try {
      r = useAppStore.getState().authorizeResearch(PROPELLANTS, 0)
    } finally {
      useAppStore.setState({ spendCredits: app.spendCredits })
    }
    expect(r.ok).toBe(false)
    expect(r.text).toContain(CREDITS_UNCHANGED)
    expect(r.text).toContain('the lab was not occupied')
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
  })

  it('inspect text is null for an available project on an idle lab, and a successful authorize returns ok with empty text', () => {
    expect(eligibilityText(PROPELLANTS, [], idle())).toBeNull()
    useAppStore.setState({ credits: PROPELLANTS.cost })
    const r = authorize(PROPELLANTS)
    expect(r).toMatchObject({ ok: true, text: '' })
    expect(r.calls).toEqual(['start', 'spendCredits'])
  })
})

// RS-006 / TR-research-005 (research.md Core Rule 3, Edge Cases): a mission in
// progress (appStore.phase === 'mission', owner decision 2026-10-14) and an
// already-researched project are eligibility failures. Both return before
// start() and spendCredits even when the balance covers the cost.
describe('Other eligibility refusals; no cancel verb (RS-006)', () => {
  const PROPELLANTS = nodeById('b-propellants')
  const idle = () => ({ ballistics: null, cybernetics: null, control: null })

  beforeEach(() => {
    useResearchStore.setState({ done: [], labs: idle() })
  })

  // Records start / spendCredits / addCredits calls and app-store writes.
  function authorize(node: typeof PROPELLANTS) {
    const app = useAppStore.getState()
    const research = useResearchStore.getState()
    const calls: string[] = []
    let writes = 0
    useResearchStore.setState({ start: (n, t) => (calls.push('start'), research.start(n, t)) })
    useAppStore.setState({
      spendCredits: (n) => (calls.push('spendCredits'), app.spendCredits(n)),
      addCredits: (n) => (calls.push('addCredits'), app.addCredits(n)),
    })
    const unsub = useAppStore.subscribe(() => writes++)
    try {
      const r = useAppStore.getState().authorizeResearch(node, 0)
      return { ...r, calls, writes }
    } finally {
      unsub()
      useResearchStore.setState({ start: research.start })
      useAppStore.setState({ spendCredits: app.spendCredits, addCredits: app.addCredits })
    }
  }

  for (const C of [PROPELLANTS.cost, PROPELLANTS.cost * 4]) {
    it(`mission in progress, Advanced Propellants available, Credits ${C}: refused before start() and spendCredits, Ballistics idle, project available, Credits unchanged`, () => {
      useAppStore.setState({ phase: 'mission', credits: C })
      expect(nodeState(PROPELLANTS, [], idle())).toBe('available')

      const r = authorize(PROPELLANTS)

      expect(r.ok).toBe(false)
      expect(r.calls).toEqual([])
      expect(r.writes).toBe(0)
      const { labs, done } = useResearchStore.getState()
      expect(labs).toEqual(idle())
      expect(done).toEqual([])
      expect(nodeState(PROPELLANTS, done, labs)).toBe('available')
      expect(useAppStore.getState().credits).toBe(C)
      expect(useAppStore.getState().phase).toBe('mission')
      // In-field is not a Research-screen reason: no cause text beyond the
      // credits-unchanged phrase.
      expect(r.text).toBe('Credits did not change.')
    })
  }

  it('the in-field refusal is phase-scoped: the same authorize from the Research phase succeeds', () => {
    useAppStore.setState({ phase: 'research', credits: PROPELLANTS.cost })
    const r = authorize(PROPELLANTS)
    expect(r.ok).toBe(true)
    expect(r.calls).toEqual(['start', 'spendCredits'])
    expect(useResearchStore.getState().labs.ballistics?.id).toBe(PROPELLANTS.id)
  })

  it('all 21 projects researched: every re-authorize is refused before start() and spendCredits; labs idle, all researched, Credits unchanged', () => {
    expect(NODES).toHaveLength(21)
    const all = NODES.map((n) => n.id)
    useResearchStore.setState({ done: [...all], labs: idle() })
    const C = NODES.reduce((sum, n) => sum + n.cost, 0)
    useAppStore.setState({ phase: 'research', credits: C })

    for (const n of NODES) {
      const r = authorize(n)
      expect(r.ok).toBe(false)
      expect(r.calls).toEqual([])
      expect(r.writes).toBe(0)
      expect(r.text).toContain('already researched')
      expect(r.text).toContain('Credits did not change')
    }

    const { labs, done } = useResearchStore.getState()
    expect(labs).toEqual(idle())
    expect(done).toEqual(all)
    for (const n of NODES) expect(nodeState(n, done, labs)).toBe('researched')
    expect(useAppStore.getState().credits).toBe(C)
  })

  it('Research public API: no cancel, stop or abort-project export on the stores or their modules', async () => {
    const forbidden = /cancel|stop|abort/i
    const appMod = await import('./appStore')
    const researchMod = await import('./researchStore')
    for (const name of [
      ...Object.keys(researchMod),
      ...Object.keys(useResearchStore.getState()),
      // App-store research surface: authorize is the only Research verb.
      ...Object.keys(appMod),
      ...Object.keys(useAppStore.getState()),
    ]) {
      expect(name).not.toMatch(forbidden)
    }
  })
})

describe('Labs frozen in the field; loss and abort leave Research alone (RS-010)', () => {
  // TR-research-001 / TR-research-005 / ADR-0002 / ADR-0001: the World Network
  // does not tick in the field, so neither do the labs. A loss spends no ETA
  // and moves no Research state; Abort writes nothing. Neither refunds.
  const propellants = nodeById('b-propellants')
  const neural = nodeById('c-interface')
  const T0 = 5 * 3600
  const idleLabs = () => ({ ballistics: null, cybernetics: null, control: null })

  // Authorize on the World Network at T0 through the production command.
  function authorize(node: (typeof NODES)[number]): void {
    const r = useAppStore.getState().authorizeResearch(node, useWorldStore.getState().t)
    expect(r.ok).toBe(true)
  }

  // Brief -> Assembly -> Deploy, then the MissionScreen composer, then
  // `seconds` of tactical sim driven through the world tick (src/game/world.ts).
  function deployAndRun(missionId: string, seconds: number) {
    useAppStore.getState().selectMission(missionId)
    useAppStore.getState().goto('team')
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
    const mission = resolveMission(missionId)
    if (!mission) throw new Error('mission did not resolve ' + missionId)
    const ops = useAppStore.getState().squad.map(liveOperativeById)
    const applyKey = useAppStore.getState().deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const deploy = freezeDeploy(mission, ops, applyKey)
    const world = createWorld(mission, ops, deploy)
    setWorld(world)
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)
    while (world.time < seconds) world.tick(0.05)
    return { world, deploy, applyKey }
  }

  // Counts addCredits calls by wrapping the store action (the same seam
  // applyDebrief and the Hud read through getState()). Restored by the caller.
  function countAddCredits() {
    const app = useAppStore.getState()
    const calls: number[] = []
    useAppStore.setState({ addCredits: (n) => (calls.push(n), app.addCredits(n)) })
    return { calls, restore: () => useAppStore.setState({ addCredits: app.addCredits }) }
  }

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      t: T0,
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useCampaignStore.setState(initialCampaignData())
    useResearchStore.setState({ done: [], labs: idleLabs() })
    useAppStore.setState({
      phase: 'world',
      missionId: null,
      squad: [...DEFAULT_SQUAD],
      loadout: {},
      credits: START_CREDITS,
      outcome: null,
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    setWorld(null)
    useMissionStore.getState().reset()
  })

  it('AC 1: Advanced Propellants active, 120 s of tactical time: startedT / endT unchanged, not researched', () => {
    authorize(propellants)
    const run = structuredClone(useResearchStore.getState().labs.ballistics)
    expect(run).toEqual({
      id: 'b-propellants',
      startedT: T0,
      endT: T0 + propellants.hours * 3600,
    })

    const { world } = deployAndRun('m01', 120)
    expect(world.time).toBeGreaterThanOrEqual(120)
    expect(useAppStore.getState().phase).toBe('mission')

    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toEqual(run)
    expect(done).toEqual([])
    expect(nodeState(propellants, done, labs)).toBe('active')
    // The strategic clock did not move under the tactical one (ADR-0001).
    expect(useWorldStore.getState().t).toBe(T0)
    setWorld(null)
  })

  it('AC 1 edge: even tactical time past endT does not complete the project in the field', () => {
    // A 2 h project started 60 s before deploy; the sim runs 120 s.
    useWorldStore.setState({ t: T0 })
    useResearchStore.setState({
      done: [],
      labs: { ...idleLabs(), ballistics: { id: 'b-propellants', startedT: T0 - 7200 + 60, endT: T0 + 60 } },
    })
    deployAndRun('m01', 120)
    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toEqual({ id: 'b-propellants', startedT: T0 - 7200 + 60, endT: T0 + 60 })
    expect(done).toEqual([])
    setWorld(null)
  })

  it('AC 2: Advanced Propellants active at deploy, a loss debriefs: t unchanged, still active, no addCredits', () => {
    authorize(propellants)
    const run = structuredClone(useResearchStore.getState().labs.ballistics)
    const creditsAtDeploy = useAppStore.getState().credits
    expect(creditsAtDeploy).toBe(START_CREDITS - propellants.cost)

    const { deploy, applyKey } = deployAndRun('m01', 30)
    const loss = priceOutcome(
      {
        applyKey,
        won: false,
        kills: 1,
        casualties: 1,
        timeSec: 30,
        civiliansHit: 0,
        completedOptionalIds: [],
        deadIds: [],
        survivorHp: {},
        quietReplay: deploy.economy.quietReplay,
      },
      deploy.economy,
    )
    const { calls, restore } = countAddCredits()
    try {
      useAppStore.getState().setOutcome(loss)
      applyDebrief('m01')
    } finally {
      restore()
      setWorld(null)
    }

    expect(useAppStore.getState().lastAppliedKey).toBe(applyKey)
    expect(useWorldStore.getState().t).toBe(T0)
    const { labs, done } = useResearchStore.getState()
    expect(labs.ballistics).toEqual(run)
    expect(done).toEqual([])
    expect(nodeState(propellants, done, labs)).toBe('active')
    expect(calls).toEqual([])
    expect(useAppStore.getState().credits).toBe(creditsAtDeploy)
  })

  it('AC 3: Propellants researched, Neural Interface I active, Abort confirmed: done unchanged, still active, no refund, no addCredits', () => {
    useResearchStore.setState({ done: ['b-propellants'], labs: idleLabs() })
    authorize(neural)
    const run = structuredClone(useResearchStore.getState().labs.cybernetics)
    expect(run?.id).toBe('c-interface')
    const creditsAtDeploy = useAppStore.getState().credits
    expect(creditsAtDeploy).toBe(START_CREDITS - neural.cost)

    deployAndRun('m01', 60)
    const { calls, restore } = countAddCredits()
    try {
      // Hud onAbort, then the MissionScreen effect cleanup.
      useAppStore.getState().goto('world')
      setWorld(null)
      useMissionStore.getState().reset()
    } finally {
      restore()
    }

    expect(useAppStore.getState().phase).toBe('world')
    expect(useAppStore.getState().outcome).toBeNull()
    const { labs, done } = useResearchStore.getState()
    expect(done).toEqual(['b-propellants'])
    expect(labs.cybernetics).toEqual(run)
    expect(nodeState(neural, done, labs)).toBe('active')
    expect(calls).toEqual([])
    expect(useAppStore.getState().credits).toBe(creditsAtDeploy)
    expect(useWorldStore.getState().t).toBe(T0)
  })
})

describe('Death drops the assignment, not the program (RS-015)', () => {
  // TR-research-003 / ADR-0005: a KIA operative leaves the roster with her
  // pins; Research `done` is untouched, and unpinned bays (new hires
  // included) still follow current issue.
  const T0 = 4 * 3600

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      t: T0,
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useCampaignStore.setState(initialCampaignData())
    useResearchStore.setState({
      done: ['c-interface'],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', squad: ['op1', 'op2', 'op4'] })
  })

  for (const won of [true, false]) {
    it(`Neural Interface I worn by Mara, Mara KIA at a ${won ? 'win' : 'loss'} debrief: Neural Interface I stays researched`, () => {
      const mara = useCampaignStore.getState().operatives.find((o) => o.id === 'op1')
      expect(mara?.codename).toBe('MARA')
      useCampaignStore.getState().setBay('op1', 'NEURAL', 'c-interface')
      const pins = useCampaignStore.getState().roster.op1.pins
      expect(wornNode(useResearchStore.getState().done, pins, 'NEURAL')?.id).toBe('c-interface')

      useAppStore.getState().setOutcome(outcome({ applyKey: 1, won, deadIds: ['op1'] }))
      applyDebrief('m01')

      const c = useCampaignStore.getState()
      expect(c.lastReport?.kia).toEqual([{ id: 'op1', codename: 'MARA' }])
      expect(c.operatives.some((o) => o.id === 'op1')).toBe(false)
      expect(c.roster.op1).toBeUndefined()
      expect(useAppStore.getState().squad).not.toContain('op1')

      const { done } = useResearchStore.getState()
      expect(done).toEqual(['c-interface'])
      expect(nodeState(nodeById('c-interface'), done, useResearchStore.getState().labs)).toBe(
        'researched',
      )
      // The blueprint is still worn by a surviving, unpinned operative.
      const op2 = c.roster.op2
      expect(op2.pins.NEURAL).toBeUndefined()
      expect(wornNode(done, op2.pins, 'NEURAL')?.id).toBe('c-interface')
    })
  }

  it('a new hire after the KIA is unpinned and wears current issue', () => {
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'c-interface')
    useAppStore.getState().setOutcome(outcome({ applyKey: 1, won: false, deadIds: ['op1'] }))
    applyDebrief('m01')
    const candidate = useCampaignStore.getState().candidates[0]
    expect(candidate).toBeDefined()
    if (!candidate) throw new Error('no hire candidate')
    expect(useCampaignStore.getState().acceptHire(candidate.id)).toBe(true)
    const entry = useCampaignStore.getState().roster[candidate.id]
    expect(entry.pins).toEqual({})
    expect(wornNode(useResearchStore.getState().done, entry.pins, 'NEURAL')?.id).toBe('c-interface')
  })
})

// RA-019 (TR-roster-006, GDD AC 12/13/14; ADR-0002, ADR-0021): a mission is
// memory only. Abort discards it and writes no roster; Tactical time never
// touches roster, downtime or the candidate market; the Debrief apply writes
// the roster once per apply-once key, and that key outlives the Screen
// autosave because it is session memory, never part of the blob.
describe('Abort writes no roster; debrief applies roster once (RA-019)', () => {
  const MISSION_ID = MISSIONS[0].id
  // Empty objectives: ticking never ends the mission, so it stays in progress.
  const BARE = { ...MISSIONS[0], objectives: [] }
  const T0 = 2 * 3600

  // Everything the Roster owns: living operatives, condition, Experience,
  // recovery clocks, the candidate market and its cursor, and the last report.
  const rosterState = () => {
    const c = useCampaignStore.getState()
    return structuredClone({
      operatives: c.operatives,
      roster: c.roster,
      candidates: c.candidates,
      recruitRngState: c.recruitRngState,
      nextCandidateT: c.nextCandidateT,
      lastReport: c.lastReport,
      campaignFailed: c.campaignFailed,
    })
  }

  // Team Deploy, then the real MissionScreen composer (composeMission).
  function deploy(squad: string[] = [...DEFAULT_SQUAD]): { world: ReturnType<typeof createWorld>; applyKey: number } {
    useAppStore.setState({ phase: 'team', missionId: MISSION_ID, squad })
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
    return composeMission(BARE, useAppStore.getState().squad)
  }

  // The real Hud onAbort (abortMission, after the P-01 confirm), then the
  // real MissionScreen cleanup (teardownMission).
  function confirmAbort(): void {
    abortMission(MISSION_ID)
    teardownMission()
  }

  beforeEach(() => {
    useWorldStore.setState({
      ...structuredClone(worldBoot),
      t: T0,
      nextTaxT: 1e12,
      nextEventT: 1e12,
      nextContractT: Number.MAX_SAFE_INTEGER,
    })
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
    })
    setWorld(null)
    useMissionStore.getState().reset()
  })

  afterEach(() => {
    setWorld(null)
    useMissionStore.getState().reset()
  })

  it('AC 1: Abort mid-mission opens no debrief and leaves the roster deep-equal to R, no Experience awarded', () => {
    const R = rosterState()
    const { world } = deploy()
    while (world.time < 60) world.tick(0.05)
    expect(useMissionStore.getState().result).toBe('none')
    confirmAbort()

    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    expect(app.lastAppliedKey).toBe(0)
    expect(getWorld()).toBeNull()
    expect(rosterState()).toEqual(R)
    // Abort awards no Experience: every surviving deployed operative keeps its xp.
    for (const id of DEFAULT_SQUAD) expect(useCampaignStore.getState().roster[id].xp).toBe(R.roster[id].xp)
    // Nothing applies afterwards either: there is no outcome to apply.
    applyDebrief(MISSION_ID)
    expect(rosterState()).toEqual(R)
  })

  it('Abort appends one telemetry abort row with the mission id, time, seed and squad roles', () => {
    const mem = new Map<string, string>()
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
    vi.stubGlobal('window', { localStorage: storage })
    const telemetryBefore = useSettingsStore.getState().telemetry
    useSettingsStore.setState({ telemetry: true })
    try {
      const { world } = deploy(['op1', 'op3'])
      for (let i = 0; i < 20; i++) world.tick(0.05)
      const time = world.time
      expect(time).toBeGreaterThan(0)
      confirmAbort()
      const rows = loadRecords(storage)
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        missionId: MISSION_ID,
        outcome: 'aborted',
        durationSec: time,
        seed: BARE.seed,
        squadRoles: ['assault', 'infiltrator'],
      })
    } finally {
      useSettingsStore.setState({ telemetry: telemetryBefore })
      vi.unstubAllGlobals()
    }
  })

  it('AC 2: the same outcome applied twice writes KIA, injury and Experience once', () => {
    useAppStore.setState({ phase: 'debrief', missionId: MISSION_ID, squad: [...DEFAULT_SQUAD] })
    const o = outcome({
      applyKey: 1,
      won: false,
      reward: 0,
      casualties: 1,
      deadIds: ['op4'],
      survivorHp: { op1: 0.2, op2: 1, op3: 0.9 },
    })
    useAppStore.getState().setOutcome(o)
    const campaign = useCampaignStore.getState()
    let reports = 0
    useCampaignStore.setState({
      reportMission: (...a) => (reports++, campaign.reportMission(...a)),
    })
    try {
      applyDebrief(MISSION_ID)
      const once = rosterState()
      const squadOnce = [...useAppStore.getState().squad]
      // The first apply really wrote the roster.
      expect(once.operatives.some((op) => op.id === 'op4')).toBe(false)
      expect(once.roster.op1.status).toBe('INJURED')
      expect([once.roster.op1.xp, once.roster.op2.xp, once.roster.op3.xp]).toEqual([1, 1, 1])

      // Debrief re-mount, and the very same DTO handed back in again.
      applyDebrief(MISSION_ID)
      useAppStore.getState().setOutcome(structuredClone(o))
      applyDebrief(MISSION_ID)

      expect(reports).toBe(1)
      const after = rosterState()
      expect(after).toEqual(once)
      expect(after.lastReport?.kia).toEqual([{ id: 'op4', codename: 'TORQ' }])
      expect(after.lastReport?.injured.map((i) => i.id)).toEqual(['op1'])
      expect([after.roster.op1.xp, after.roster.op2.xp, after.roster.op3.xp]).toEqual([1, 1, 1])
      expect(useAppStore.getState().squad).toEqual(squadOnce)
    } finally {
      useCampaignStore.setState({ reportMission: campaign.reportMission })
    }
  })

  it('AC 3: Tactical time leaves the living roster, Injured downtime and the market unchanged', () => {
    // op5 opens Injured with a running recovery clock; it sits out the deploy.
    const before = useCampaignStore.getState()
    expect(before.roster.op5.status).toBe('INJURED')
    const R = rosterState()
    const downtime = remainingDowntimeSec(before.roster.op5.recoverAtT, useWorldStore.getState().t)
    expect(downtime).toBeGreaterThan(0)

    const { world } = deploy()
    // Three minutes of sim time in MAX_DT frames, checking every second.
    let nextCheck = 0
    while (world.time < 180) {
      world.tick(0.05)
      if (world.time >= nextCheck) {
        nextCheck += 1
        expect(rosterState()).toEqual(R)
        const c = useCampaignStore.getState()
        expect(remainingDowntimeSec(c.roster.op5.recoverAtT, useWorldStore.getState().t)).toBe(downtime)
      }
    }
    expect(useMissionStore.getState().result).toBe('none')
    expect(useAppStore.getState().phase).toBe('mission')
    expect(useWorldStore.getState().t).toBe(T0)
    confirmAbort()
    expect(rosterState()).toEqual(R)
  })

  it('ADR-0021: a stale lower applyKey is rejected, and the next deploy\'s higher key applies', () => {
    const first = deploy()
    expect(first.applyKey).toBe(useAppStore.getState().deploySerial)
    teardownMission()
    useAppStore.setState({ phase: 'debrief', squad: [...DEFAULT_SQUAD] })
    useAppStore.getState().setOutcome(
      outcome({ applyKey: first.applyKey, casualties: 1, deadIds: ['op4'], survivorHp: { op1: 0.2 } }),
    )
    applyDebrief(MISSION_ID)
    expect(useAppStore.getState().lastAppliedKey).toBe(first.applyKey)
    const applied = rosterState()
    expect(applied.roster.op4).toBeUndefined()

    // A second deploy mints a strictly higher key.
    const second = deploy([...useAppStore.getState().squad])
    expect(second.applyKey).toBe(first.applyKey + 1)
    teardownMission()

    // A stale outcome carrying a lower key (or the same one) writes nothing.
    useAppStore.setState({ phase: 'debrief' })
    useAppStore.getState().setOutcome(
      outcome({ applyKey: first.applyKey - 1, casualties: 1, deadIds: ['op2'], survivorHp: {} }),
    )
    applyDebrief(MISSION_ID)
    expect(useAppStore.getState().lastAppliedKey).toBe(first.applyKey)
    expect(rosterState()).toEqual(applied)

    // The next deploy's higher key applies.
    useAppStore.getState().setOutcome(
      outcome({ applyKey: second.applyKey, casualties: 1, deadIds: ['op2'], survivorHp: {} }),
    )
    applyDebrief(MISSION_ID)
    expect(useAppStore.getState().lastAppliedKey).toBe(second.applyKey)
    expect(rosterState().roster.op2).toBeUndefined()
  })

  it('Edge: the apply-once key survives the Screen autosave, so a re-apply after it writes nothing', () => {
    const blobs: string[] = []
    const storage: SaveStorage = {
      getItem: () => blobs.at(-1) ?? null,
      setItem: (_key, value) => void blobs.push(value),
      removeItem: () => void (blobs.length = 0),
    }
    vi.useFakeTimers()
    const stop = startAutosave(storage)
    try {
      // Fresh subscription: startAutosave would ignore `storage` if a leftover
      // one were still running, so nothing may have been written yet.
      expect(blobs).toHaveLength(0)
      useAppStore.setState({ phase: 'debrief', missionId: MISSION_ID, squad: [...DEFAULT_SQUAD] })
      useAppStore.getState().setOutcome(
        outcome({ applyKey: 3, casualties: 1, deadIds: ['op2'], survivorHp: { op1: 0.3 } }),
      )
      applyDebrief(MISSION_ID)
      // Debrief never autosaves.
      vi.advanceTimersByTime(1000)
      expect(blobs).toHaveLength(0)

      useAppStore.getState().returnFromDebrief()
      vi.advanceTimersByTime(1000)
      expect(blobs.length).toBeGreaterThan(0)
      const applied = rosterState()

      // The key is session memory: the flush keeps it and never persists it.
      expect(useAppStore.getState().lastAppliedKey).toBe(3)
      const blob = JSON.parse(blobs.at(-1)!) as { app: Record<string, unknown> }
      expect(blob.app).not.toHaveProperty('lastAppliedKey')
      expect(blob.app).not.toHaveProperty('deploySerial')

      // A stray re-apply of the stored outcome after the autosave is a no-op.
      expect(useAppStore.getState().outcome?.applyKey).toBe(3)
      applyDebrief(MISSION_ID)
      expect(rosterState()).toEqual(applied)
      expect(applied.roster.op2).toBeUndefined()
      expect(applied.roster.op1.xp).toBe(1)
    } finally {
      stop()
      vi.useRealTimers()
    }
  })
})
