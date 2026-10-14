import { beforeEach, describe, expect, it } from 'vitest'
import {
  COLLATERAL_FINE,
  INITIAL_CREDITS,
  collateralFine,
  netPayout,
  priceOutcome,
  useAppStore,
} from './appStore'
import type { MissionOutcome, MissionResult } from './appStore'
import { DEFAULT_SQUAD, MISSIONS, ROSTER, operativeById } from '../game/data'
import { nodeById } from '../game/research'
import { INFLUENCE_ACTIONS, TAX_INTERVAL_SEC } from '../game/influence'
import { initialCampaignData, liveOperativeById, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { DAY, initialOwner, resolveMission, sectorReadout, useWorldStore } from './worldStore'
import { CITIES_BY_SECTOR } from '../game/atlas'
import { sectorClient } from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import { applyDebrief } from './debrief'
import { SAVE_KEY, captureSave, readSave, validateSave } from './save'
import { assignedMassKg } from '../game/deployGate'
import { ARMOR_KG_PER_HP, MASS_LIMIT_KG } from '../game/mass'
import { xpBonus } from '../game/experience'
import { economySlice } from '../game/deploy'
import { freezeDeploy } from './deployFreeze'
import { createWorld } from '../game/world'
import { useMissionStore } from './missionStore'

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
  return {
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
  }
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
      expect(useAppStore.getState().authorizeResearch({ ...project, cost }, 0)).toBe(false)
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
      expect(useAppStore.getState().authorizeResearch({ ...PROJECT, cost }, 0)).toBe(false)
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

    expect(useAppStore.getState().authorizeResearch(PROJECT, 0)).toBe(false)

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
    expect(useAppStore.getState().authorizeResearch(PROJECT, 100)).toBe(true)
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
    expect(useAppStore.getState().authorizeResearch(PROJECT, 0)).toBe(false)
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
