import { beforeEach, describe, expect, it } from 'vitest'
import { COLLATERAL_FINE, collateralFine, netPayout, useAppStore } from './appStore'
import type { MissionOutcome } from './appStore'
import { DEFAULT_SQUAD, MISSIONS } from '../game/data'
import { nodeById } from '../game/research'
import { INFLUENCE_ACTIONS } from '../game/influence'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { useWorldStore } from './worldStore'

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
    won: true,
    kills: 6,
    casualties: 1,
    timeSec: 412,
    civiliansHit: 0,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
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
    outcomeSerial: 0,
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

  it('netPayout pays reward minus fine on a win and nothing on a loss', () => {
    expect(netPayout(outcome({ civiliansHit: 1 }))).toBe(85000 - COLLATERAL_FINE)
    expect(netPayout(outcome({ won: false }))).toBe(0)
  })

  it('setOutcome banks the win, stores the outcome and moves to debrief', () => {
    const o = outcome({ civiliansHit: 2 })
    useAppStore.getState().setOutcome(o)
    const s = useAppStore.getState()
    expect(s.credits).toBe(START_CREDITS + 85000 - 2 * COLLATERAL_FINE)
    expect(s.outcome).toBe(o)
    expect(s.phase).toBe('debrief')
    expect(s.outcomeSerial).toBe(1)
  })

  it('a win drowned in collateral pays zero, never a debt', () => {
    useAppStore.getState().setOutcome(outcome({ civiliansHit: 40 }))
    expect(useAppStore.getState().credits).toBe(START_CREDITS)
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
    const second = outcome({ civiliansHit: 0, reward: m01.reward, deadIds: ['op5'] })
    useAppStore.getState().setOutcome(second)
    expect(second.quietReplay).toBe(true)
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
