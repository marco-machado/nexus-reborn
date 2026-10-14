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
import { DEFAULT_SQUAD, MISSIONS } from '../game/data'
import { nodeById } from '../game/research'
import { INFLUENCE_ACTIONS, TAX_INTERVAL_SEC } from '../game/influence'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { DAY, sectorReadout, useWorldStore } from './worldStore'
import { applyDebrief } from './debrief'
import { assignedMassKg } from '../game/deployGate'
import { ARMOR_KG_PER_HP, MASS_LIMIT_KG } from '../game/mass'
import { xpBonus } from '../game/experience'

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

  it('a deposit of A <= 0 or NaN is an identity no-op', () => {
    const before = useAppStore.getState()
    for (const a of [0, -0, -1, -1000, NaN, -Infinity]) {
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
