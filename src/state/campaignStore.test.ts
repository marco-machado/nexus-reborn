import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionOutcome } from './appStore'
import {
  initialCampaignData,
  missionLocked,
  useCampaignStore,
} from './campaignStore'
import { missionById } from '../game/data'

const HOUR = 3600

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return {
    won: true,
    kills: 7,
    casualties: 0,
    timeSec: 420,
    civiliansHit: 0,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    ...over,
  }
}

beforeEach(() => {
  useCampaignStore.setState(initialCampaignData())
})

describe('campaign initialization and intel', () => {
  it('starts at intel 1/25 with Raven recovering at 24 world hours', () => {
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(1)
    expect(state.intelProgress).toBe(25)
    expect(state.roster.op5).toEqual({ status: 'INJURED', recoverAtT: 24 * HOUR })
    expect(state.roster.op1).toEqual({ status: 'READY', recoverAtT: null })
  })

  it('rolls each 100 intel progress into another level', () => {
    useCampaignStore.getState().awardIntel(275)
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(4)
    expect(state.intelProgress).toBe(0)
    expect(missionLocked(missionById('m02'), state.intelLevel)).toBe(false)
  })

  it('awards clean-contract intel on wins only', () => {
    useCampaignStore.getState().reportMission('m01', outcome(), 0)
    let state = useCampaignStore.getState()
    expect(state.intelProgress).toBe(80)
    expect(state.contractsWon).toEqual(['m01'])

    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ won: false, reward: 0, civiliansHit: 0 }),
      0,
    )
    state = useCampaignStore.getState()
    expect(state.intelProgress).toBe(80)
    expect(state.contractsWon).toEqual(['m01'])
    expect(state.outcomeApplied).toBe(2)

    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 1 }), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(20)
    expect(useCampaignStore.getState().intelLevel).toBe(2)
  })
})

describe('mission record and recovery pressure', () => {
  it('injures dead operatives for 36 hours and recovers them on the world clock', () => {
    const worldT = 9000
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 2, deadIds: ['op1', 'op2'] }), worldT)
    expect(useCampaignStore.getState().roster.op1).toEqual({
      status: 'INJURED',
      recoverAtT: worldT + 36 * HOUR,
    })
    useCampaignStore.getState().sync(worldT + 36 * HOUR - 1)
    expect(useCampaignStore.getState().roster.op1.status).toBe('INJURED')
    useCampaignStore.getState().sync(worldT + 36 * HOUR)
    expect(useCampaignStore.getState().roster.op1).toEqual({
      status: 'READY',
      recoverAtT: null,
    })
  })

  it('records unique first wins in order and completes the campaign after all three', () => {
    useCampaignStore.getState().reportMission('m02', outcome({ civiliansHit: 1 }), 0)
    useCampaignStore.getState().reportMission('m02', outcome({ civiliansHit: 1 }), 0)
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 1 }), 0)
    useCampaignStore.getState().reportMission('m03', outcome({ civiliansHit: 1 }), 0)
    const state = useCampaignStore.getState()
    expect(state.contractsWon).toEqual(['m02', 'm01', 'm03'])
    expect(state.campaignWon).toBe(true)
  })
})
