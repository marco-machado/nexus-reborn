import { beforeEach, describe, expect, it } from 'vitest'
import { COLLATERAL_FINE, collateralFine, netPayout, useAppStore } from './appStore'
import type { MissionOutcome } from './appStore'
import { DEFAULT_SQUAD } from '../game/data'

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
  return { won: true, kills: 6, casualties: 1, timeSec: 412, civiliansHit: 0, reward: 85000, ...over }
}

beforeEach(() => {
  useAppStore.setState({
    phase: 'menu',
    missionId: null,
    squad: [...DEFAULT_SQUAD],
    credits: START_CREDITS,
    outcome: null,
  })
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
    useAppStore.getState().toggleOperative('op5')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op5'])
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
