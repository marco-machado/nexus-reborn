import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionOutcome } from './appStore'
import {
  INJURY_HP_FRAC,
  INJURY_RECOVERY_MAX,
  INJURY_RECOVERY_MIN,
  initialCampaignData,
  injuryRecoverySec,
  liveOperativeById,
  missionLocked,
  useCampaignStore,
} from './campaignStore'
import { ROSTER, missionById } from '../game/data'
import { CANDIDATE_POOL, CANDIDATE_REFRESH_SEC, ROSTER_CAP } from '../game/recruits'

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
    survivorHp: {},
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

  it('seeds the live roster from the authored eight and a full candidate pool', () => {
    const state = useCampaignStore.getState()
    expect(state.operatives.map((o) => o.id)).toEqual(ROSTER.map((o) => o.id))
    expect(state.candidates).toHaveLength(CANDIDATE_POOL)
    expect(state.nextCandidateT).toBe(CANDIDATE_REFRESH_SEC)
    // Reproducible market: two fresh campaigns hold the same candidates.
    expect(initialCampaignData().candidates).toEqual(state.candidates)
    expect(liveOperativeById('op1').codename).toBe('MARA')
    expect(() => liveOperativeById('nope')).toThrow()
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

describe('permanent death', () => {
  it('removes a killed operative from the roster for good and names the loss', () => {
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 9000)
    const state = useCampaignStore.getState()
    expect(state.operatives.some((o) => o.id === 'op1')).toBe(false)
    expect(state.roster.op1).toBeUndefined()
    expect(state.lastReport).toEqual({
      kia: [{ id: 'op1', codename: 'MARA' }],
      injured: [],
    })
    // No recovery ever brings a KIA back.
    useCampaignStore.getState().sync(9000 + 1000 * HOUR)
    expect(useCampaignStore.getState().roster.op1).toBeUndefined()
    expect(() => liveOperativeById('op1')).toThrow()
  })
})

describe('graded injury recovery', () => {
  it('scales downtime from 12 hours at the threshold to 48 hours at near-death', () => {
    expect(injuryRecoverySec(INJURY_HP_FRAC)).toBe(INJURY_RECOVERY_MIN)
    expect(injuryRecoverySec(0)).toBe(INJURY_RECOVERY_MAX)
    const mid = injuryRecoverySec(INJURY_HP_FRAC / 2)
    expect(mid).toBeGreaterThan(INJURY_RECOVERY_MIN)
    expect(mid).toBeLessThan(INJURY_RECOVERY_MAX)
    // Deeper damage never recovers faster.
    expect(injuryRecoverySec(0.1)).toBeGreaterThan(injuryRecoverySec(0.2))
  })

  it('injures survivors below the threshold and recovers them on the world clock', () => {
    const worldT = 9000
    useCampaignStore
      .getState()
      .reportMission(
        'm01',
        outcome({ survivorHp: { op1: 0.2, op2: 0.9, op3: INJURY_HP_FRAC } }),
        worldT,
      )
    const state = useCampaignStore.getState()
    const downtime = injuryRecoverySec(0.2)
    expect(state.roster.op1).toEqual({ status: 'INJURED', recoverAtT: worldT + downtime })
    expect(state.roster.op2).toEqual({ status: 'READY', recoverAtT: null })
    expect(state.roster.op3).toEqual({ status: 'READY', recoverAtT: null })
    expect(state.lastReport?.injured).toEqual([
      { id: 'op1', codename: 'MARA', downtimeSec: downtime },
    ])

    useCampaignStore.getState().sync(worldT + downtime - 1)
    expect(useCampaignStore.getState().roster.op1.status).toBe('INJURED')
    useCampaignStore.getState().sync(worldT + downtime)
    expect(useCampaignStore.getState().roster.op1).toEqual({
      status: 'READY',
      recoverAtT: null,
    })
  })
})

describe('recruitment market', () => {
  it('accepts a hire onto the roster and refuses past the cap', () => {
    // Clear a bay first so the cap check is reachable from a full roster.
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    const candidate = useCampaignStore.getState().candidates[0]
    expect(useCampaignStore.getState().acceptHire(candidate.id)).toBe(true)
    let state = useCampaignStore.getState()
    expect(state.operatives).toHaveLength(ROSTER_CAP)
    expect(state.operatives.at(-1)?.id).toBe(candidate.id)
    expect(state.roster[candidate.id]).toEqual({ status: 'READY', recoverAtT: null })
    expect(state.candidates.some((c) => c.id === candidate.id)).toBe(false)

    // At the cap, and for unknown ids, nothing moves.
    const second = useCampaignStore.getState().candidates[0]
    expect(useCampaignStore.getState().acceptHire(second.id)).toBe(false)
    expect(useCampaignStore.getState().acceptHire('ghost-id')).toBe(false)
    state = useCampaignStore.getState()
    expect(state.operatives).toHaveLength(ROSTER_CAP)
    expect(state.candidates.some((c) => c.id === second.id)).toBe(true)
  })

  it('refreshes one candidate per 24 world hours, replacing the oldest at the pool cap', () => {
    const before = useCampaignStore.getState().candidates
    useCampaignStore.getState().sync(CANDIDATE_REFRESH_SEC)
    const after = useCampaignStore.getState()
    expect(after.candidates).toHaveLength(CANDIDATE_POOL)
    expect(after.candidates.slice(0, -1)).toEqual(before.slice(1))
    expect(after.candidates.at(-1)).not.toEqual(before.at(-1))
    expect(after.nextCandidateT).toBe(2 * CANDIDATE_REFRESH_SEC)
  })

  it('catches up whole skipped intervals exactly as continuous ticking would', () => {
    useCampaignStore.getState().sync(3 * CANDIDATE_REFRESH_SEC)
    const jumped = useCampaignStore.getState()

    useCampaignStore.setState(initialCampaignData())
    useCampaignStore.getState().sync(CANDIDATE_REFRESH_SEC)
    useCampaignStore.getState().sync(2 * CANDIDATE_REFRESH_SEC)
    useCampaignStore.getState().sync(3 * CANDIDATE_REFRESH_SEC)
    const ticked = useCampaignStore.getState()

    expect(jumped.candidates).toEqual(ticked.candidates)
    expect(jumped.recruitRngState).toBe(ticked.recruitRngState)
    expect(jumped.nextCandidateT).toBe(ticked.nextCandidateT)
  })

  it('grows a hired-down pool back instead of replacing', () => {
    const first = useCampaignStore.getState().candidates[0]
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    useCampaignStore.getState().acceptHire(first.id)
    expect(useCampaignStore.getState().candidates).toHaveLength(CANDIDATE_POOL - 1)
    useCampaignStore.getState().sync(CANDIDATE_REFRESH_SEC)
    expect(useCampaignStore.getState().candidates).toHaveLength(CANDIDATE_POOL)
  })
})

describe('mission record', () => {
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
