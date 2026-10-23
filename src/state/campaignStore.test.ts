import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settleOutcome, useAppStore, type MissionOutcome } from './appStore'
import * as campaignModule from './campaignStore'
import {
  INJURY_HP_FRAC,
  INJURY_RECOVERY_MAX,
  INJURY_RECOVERY_MIN,
  initialCampaignData,
  injuryLineHours,
  injuryRecoverySec,
  isCampaignFailed,
  liveOperativeById,
  missionLocked,
  remainingDowntimeSec,
  useCampaignStore,
} from './campaignStore'
import { applyDebrief } from './debrief'
import { freezeDeploy } from './deployFreeze'
import { abortMission, teardownMission } from './missionLifecycle'
import { nodeState, useResearchStore } from './researchStore'
import { captureSave, hydrateSave, startNewOperation, type SaveStorage, type SaveV10 } from './save'
import { useWorldStore } from './worldStore'
import { ROSTER, missionById } from '../game/data'
import { canDeploy } from '../game/deployGate'
import { emptyLoadout } from '../game/mass'
import {
  appliedNodeIds,
  currentIssue,
  nodeById,
  wornAugs,
} from '../game/research'
import {
  CANDIDATE_POOL,
  CANDIDATE_REFRESH_SEC,
  HIRE_MAX_COST,
  HIRE_MIN_COST,
  ROSTER_CAP,
} from '../game/recruits'
import { CLOCK_BATCH_SEC, startWorldClock } from '../ui/clock'
import { hashOf } from '../ui/util'

const HOUR = 3600

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return settleOutcome({
    applyKey: 1,
    won: true,
    kills: 7,
    casualties: 0,
    timeSec: 420,
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
  useCampaignStore.setState(initialCampaignData())
})

describe('campaign initialization and intel', () => {
  it('starts at intel 1/25 with Raven recovering at 24 world hours', () => {
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(1)
    expect(state.intelProgress).toBe(25)
    expect(state.roster.op5).toEqual({ status: 'INJURED', recoverAtT: 24 * HOUR, xp: 0, pins: {} })
    expect(state.roster.op1).toEqual({ status: 'READY', recoverAtT: null, xp: 0, pins: {} })
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

  it('WN-020: at intel 1 only Rust Haven is open; at intel 2 all three are', () => {
    expect(useCampaignStore.getState().intelLevel).toBe(1)
    expect(missionLocked(missionById('m03'), 1)).toBe(false)
    expect(missionLocked(missionById('m01'), 1)).toBe(true)
    expect(missionLocked(missionById('m02'), 1)).toBe(true)
    for (const id of ['m01', 'm02', 'm03']) expect(missionLocked(missionById(id), 2)).toBe(false)
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

    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ civiliansHit: 1, quietReplay: true }),
      0,
    )
    expect(useCampaignStore.getState().intelProgress).toBe(80)
    expect(useCampaignStore.getState().intelLevel).toBe(1)
  })

  it('a first win after a loss still awards intel', () => {
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ won: false, reward: 0, civiliansHit: 0 }),
      0,
    )
    useCampaignStore.getState().reportMission('m01', outcome(), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(80)
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01'])
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
      kia: [{ id: 'op1', codename: 'MARA', xp: 0 }],
      injured: [],
      xp: [],
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

  it('injures survivors below the threshold and recovers them on Strategic time', () => {
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
    expect(state.roster.op1).toEqual({
      status: 'INJURED',
      recoverAtT: worldT + downtime,
      xp: 1,
      pins: {},
    })
    expect(state.roster.op2).toEqual({ status: 'READY', recoverAtT: null, xp: 1, pins: {} })
    expect(state.roster.op3).toEqual({ status: 'READY', recoverAtT: null, xp: 1, pins: {} })
    expect(state.lastReport?.injured).toEqual([
      { id: 'op1', codename: 'MARA', downtimeSec: downtime },
    ])

    useCampaignStore.getState().sync(worldT + downtime - 1)
    expect(useCampaignStore.getState().roster.op1.status).toBe('INJURED')
    useCampaignStore.getState().sync(worldT + downtime)
    expect(useCampaignStore.getState().roster.op1).toEqual({
      status: 'READY',
      recoverAtT: null,
      xp: 1,
      pins: {},
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
    expect(state.roster[candidate.id]).toEqual({ status: 'READY', recoverAtT: null, xp: 0, pins: {} })
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
    expect(state.campaignFailed).toBe(false)
  })
})

describe('operative experience', () => {
  it('awards a point to each survivor named in survivorHp', () => {
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ survivorHp: { op1: 0.9, op2: 0.8 } }),
      0,
    )
    const state = useCampaignStore.getState()
    expect(state.roster.op1.xp).toBe(1)
    expect(state.roster.op2.xp).toBe(1)
    expect(state.roster.op3.xp).toBe(0)
    expect(state.lastReport?.xp).toEqual([
      { id: 'op1', codename: 'MARA', gained: 1, total: 1 },
      { id: 'op2', codename: 'GHOST', gained: 1, total: 1 },
    ])
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ survivorHp: { op1: 1 } }),
      0,
    )
    expect(useCampaignStore.getState().roster.op1.xp).toBe(2)
  })
})

describe('campaign fail state', () => {
  it('fails when the last operative dies and refuses a later hire', () => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ won: false, reward: 0, casualties: ids.length, deadIds: ids }),
      0,
    )
    const failed = useCampaignStore.getState()
    expect(failed.operatives).toEqual([])
    expect(failed.campaignFailed).toBe(true)
    expect(failed.campaignWon).toBe(false)
    expect(failed.acceptHire(failed.candidates[0].id)).toBe(false)
    expect(useCampaignStore.getState().operatives).toEqual([])
  })

  it('a fresh campaign is not failed, and a win is never also failed', () => {
    expect(useCampaignStore.getState().campaignFailed).toBe(false)
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 1 }), 0)
    useCampaignStore.getState().reportMission('m02', outcome({ civiliansHit: 1 }), 0)
    useCampaignStore.getState().reportMission('m03', outcome({ civiliansHit: 1 }), 0)
    const state = useCampaignStore.getState()
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
  })
})

describe('campaign flags (WN-018)', () => {
  const wipe = () => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    return { casualties: ids.length, deadIds: ids }
  }
  // ADR-0020: the two flags are never both true, checked after every report.
  const report = (id: string, over: Partial<MissionOutcome> = {}) => {
    useCampaignStore.getState().reportMission(id, outcome(over), 0)
    const { campaignWon, campaignFailed } = useCampaignStore.getState()
    expect(campaignWon && campaignFailed).toBe(false)
  }

  it('a same-step Win that empties an incomplete roster fails the campaign (pyrrhic)', () => {
    const size = useCampaignStore.getState().operatives.length
    report('m01', wipe())
    const state = useCampaignStore.getState()
    expect(state.contractsWon).toEqual(['m01'])
    expect(state.lastReport?.kia).toHaveLength(size)
    expect(state.campaignFailed).toBe(true)
    expect(state.campaignWon).toBe(false)
  })

  it('a completed campaign stays complete after a later roster wipe', () => {
    for (const id of ['m01', 'm02', 'm03']) report(id, { civiliansHit: 1 })
    report('m01', { won: false, reward: 0, ...wipe() })
    const state = useCampaignStore.getState()
    expect(state.operatives).toEqual([])
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
  })

  it('the last authored win that also wipes the roster is complete, not failed', () => {
    report('m01', { civiliansHit: 1 })
    report('m02', { civiliansHit: 1 })
    report('m03', wipe())
    const state = useCampaignStore.getState()
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
  })

  it('exports no CampaignStatus enum', () => {
    expect('CampaignStatus' in campaignModule).toBe(false)
  })
})

describe('campaign flag edge cases (WN-019)', () => {
  // Crisis helpers move the World Network clock, sectors and timers; restore
  // the whole store around each test so nothing leaks into later describes.
  const resetWorld = () => useWorldStore.setState(useWorldStore.getInitialState(), true)
  beforeEach(resetWorld)
  afterEach(resetWorld)

  const ids = () => useCampaignStore.getState().operatives.map((o) => o.id)
  const flags = () => {
    const { campaignWon, campaignFailed } = useCampaignStore.getState()
    return { campaignWon, campaignFailed }
  }
  // Pushes eu into crisis through the real debrief path.
  const enterCrisis = () => {
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 40, unrest: 80 } },
    })
    useWorldStore
      .getState()
      .applyMissionResult('m01', outcome({ won: false, reward: 0, civiliansHit: 9 }))
    expect(useWorldStore.getState().crisis).toContain('eu')
  }
  // Clears a standing eu crisis through a staged stabilize spend.
  const clearCrisis = () => {
    useWorldStore.setState({
      nextEventT: 1e12,
      nextContractT: 1e12,
      nextTaxT: 1e12,
      influence: 20,
      crisis: ['eu'],
      sectors: { ...useWorldStore.getState().sectors, eu: { control: 40, unrest: 71 } },
      pressure: { eu: 1e12 },
    })
    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    useWorldStore.setState({ t: 7 * HOUR - 1 })
    useWorldStore.getState().tick(0.01)
    expect(useWorldStore.getState().crisis).toEqual([])
  }

  it('isCampaignFailed is rosterSize 0 and not already complete', () => {
    expect(isCampaignFailed(0, false)).toBe(true)
    expect(isCampaignFailed(0, true)).toBe(false)
    expect(isCampaignFailed(1, false)).toBe(false)
    expect(isCampaignFailed(1, true)).toBe(false)
  })

  it('a complete campaign whose living roster reaches 0 keeps its contracts selectable', () => {
    // Flags after the wipe are WN-018's "stays complete after a later roster
    // wipe"; this covers the lock, through the action that applies it.
    for (const id of ['m01', 'm02', 'm03']) {
      useCampaignStore.getState().reportMission(id, outcome({ civiliansHit: 1 }), 0)
    }
    useCampaignStore.getState().reportMission(
      'm02',
      outcome({ won: false, reward: 0, casualties: ids().length, deadIds: ids() }),
      0,
    )
    expect(useCampaignStore.getState().operatives).toEqual([])
    // Intel gates are not under test; lift them so only the flags decide.
    useCampaignStore.setState({ intelLevel: 3 })
    for (const id of ['m01', 'm02', 'm03']) {
      useAppStore.setState({ phase: 'world', missionId: null })
      useAppStore.getState().selectMission(id)
      expect(useAppStore.getState().missionId).toBe(id)
      expect(useAppStore.getState().phase).toBe('brief')
    }
  })

  it('a wipe fails on this debrief allWon even when the stored campaignWon reads true', () => {
    // Inconsistent seed: stored campaignWon true, no authored wins. Passing the
    // stored flag would keep the campaign alive; this debrief's allWon fails it.
    useCampaignStore.setState({ campaignWon: true, contractsWon: [] })
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ won: false, reward: 0, casualties: ids().length, deadIds: ids() }),
      0,
    )
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: true })
  })

  it('sector crisis entering or clearing leaves the flags alone with a living operative', () => {
    const before = flags()
    enterCrisis()
    expect(flags()).toEqual(before)
    clearCrisis()
    expect(flags()).toEqual(before)
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: false })
  })

  it('one injured operative still counts as living as a crisis enters and clears', () => {
    const [keep, ...rest] = ids()
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({
        won: false,
        reward: 0,
        casualties: rest.length,
        deadIds: rest,
        survivorHp: { [keep]: INJURY_HP_FRAC / 2 },
      }),
      0,
    )
    const state = useCampaignStore.getState()
    expect(state.operatives.map((o) => o.id)).toEqual([keep])
    expect(state.roster[keep].status).toBe('INJURED')
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: false })
    enterCrisis()
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: false })
    clearCrisis()
    expect(useCampaignStore.getState().operatives.map((o) => o.id)).toEqual([keep])
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: false })
  })

  it('removing the last living operative on an incomplete campaign fails it during crisis', () => {
    enterCrisis()
    useCampaignStore.getState().reportMission(
      'm02',
      outcome({ won: false, reward: 0, casualties: ids().length, deadIds: ids() }),
      0,
    )
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: true })
  })

  it('generated wins do not mark the campaign complete', () => {
    for (const id of ['m01', 'm02']) {
      useCampaignStore.getState().reportMission(id, outcome({ civiliansHit: 1 }), 0)
    }
    useCampaignStore.getState().reportMission('gen-1', outcome({ civiliansHit: 1 }), 0)
    const state = useCampaignStore.getState()
    expect(state.contractsWon).toEqual(['m01', 'm02'])
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: false })
  })
})

describe('augmentation bays', () => {
  it('pins a bay to stock or a project and unpins back to current issue', () => {
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'STOCK')
    expect(useCampaignStore.getState().roster.op1.pins.NEURAL).toBe('STOCK')
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'c-interface')
    expect(useCampaignStore.getState().roster.op1.pins.NEURAL).toBe('c-interface')
    useCampaignStore.getState().setBay('op1', 'NEURAL', null)
    expect(useCampaignStore.getState().roster.op1.pins.NEURAL).toBeUndefined()
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'b-propellants')
    expect(useCampaignStore.getState().roster.op1.pins.NEURAL).toBeUndefined()
  })
})

describe('quietReplay flag is the intel award input', () => {
  it('quietReplay false on an already-won contract — reportMission still awards intel', () => {
    useCampaignStore.setState({ contractsWon: ['m01'], intelLevel: 1, intelProgress: 25 })
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ quietReplay: false, civiliansHit: 0 }),
      0,
    )
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(1)
    expect(state.intelProgress).toBe(80)
    expect(state.contractsWon).toEqual(['m01'])
  })

  it('quietReplay true on a contract not yet won — reportMission awards no intel', () => {
    useCampaignStore.setState({ contractsWon: [], intelLevel: 1, intelProgress: 25 })
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ quietReplay: true, civiliansHit: 0 }),
      0,
    )
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(1)
    expect(state.intelProgress).toBe(25)
    expect(state.contractsWon).toEqual(['m01'])
  })
})

describe('World Network intel progress awards (WN-011)', () => {
  const seed = (progress: number) =>
    useCampaignStore.setState({ intelLevel: 1, intelProgress: progress })

  it('a non-quiet win with a civilian hit awards 40: 25 -> 65', () => {
    seed(25)
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 1 }), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(65)
  })

  it('more than one civilian hit still awards 40: 25 -> 65', () => {
    seed(25)
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 3 }), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(65)
  })

  it('a non-quiet clean win awards 55: 25 -> 80', () => {
    seed(25)
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 0 }), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(80)
  })

  it('a loss leaves intelProgress unchanged, including J = 0', () => {
    for (const j of [0, 25]) {
      seed(j)
      useCampaignStore.getState().reportMission(
        'm01',
        outcome({ won: false, reward: 0, civiliansHit: 0 }),
        0,
      )
      expect(useCampaignStore.getState().intelProgress).toBe(j)
      expect(useCampaignStore.getState().intelLevel).toBe(1)
    }
  })

  it('a quiet-replay win leaves intelProgress unchanged', () => {
    seed(25)
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ quietReplay: true, civiliansHit: 0 }),
      0,
    )
    expect(useCampaignStore.getState().intelProgress).toBe(25)
  })

  it('writes Intel on campaignStore only', () => {
    seed(25)
    const worldBefore = useWorldStore.getState()
    const appBefore = useAppStore.getState()
    useCampaignStore.getState().reportMission('m01', outcome(), 0)
    expect(useCampaignStore.getState().intelProgress).toBe(80)
    expect(useWorldStore.getState()).toBe(worldBefore)
    expect(useAppStore.getState()).toBe(appBefore)
    expect('intelProgress' in useWorldStore.getState()).toBe(false)
    expect('intelProgress' in useAppStore.getState()).toBe(false)
  })
})

describe('campaign complete from the three authored wins (EC-021)', () => {
  const AUTHORED = ['m01', 'm02', 'm03'] as const

  it('names Glass Veil, Hollow Crown and Rust Haven as the three authored contracts', () => {
    expect(AUTHORED.map((id) => missionById(id).codename)).toEqual([
      'GLASS VEIL',
      'HOLLOW CROWN',
      'RUST HAVEN',
    ])
  })

  it('exactly two authored wins leave campaign-complete false', () => {
    // Every pair of the three: none completes the campaign on its own.
    for (const [a, b] of [['m01', 'm02'], ['m01', 'm03'], ['m02', 'm03']]) {
      useCampaignStore.setState(initialCampaignData())
      useCampaignStore.getState().reportMission(a, outcome(), 0)
      useCampaignStore.getState().reportMission(b, outcome(), 0)
      const state = useCampaignStore.getState()
      expect(state.contractsWon).toEqual([a, b])
      expect(state.campaignWon).toBe(false)
    }
  })

  it('the same contract won twice counts once', () => {
    useCampaignStore.getState().reportMission('m01', outcome(), 0)
    useCampaignStore.getState().reportMission('m01', outcome({ quietReplay: true }), 0)
    useCampaignStore.getState().reportMission('m02', outcome(), 0)
    const state = useCampaignStore.getState()
    expect(state.contractsWon).toEqual(['m01', 'm02'])
    expect(state.campaignWon).toBe(false)
  })

  it('Glass Veil, Hollow Crown and Rust Haven all won marks campaign-complete true', () => {
    for (const id of AUTHORED) {
      useCampaignStore.getState().reportMission(id, outcome(), 0)
    }
    const state = useCampaignStore.getState()
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
  })

  it('all three won leaves all three selectable with a living roster', () => {
    for (const id of AUTHORED) {
      useCampaignStore.getState().reportMission(id, outcome(), 0)
    }
    expect(useCampaignStore.getState().campaignWon).toBe(true)
    expect(useCampaignStore.getState().operatives.length).toBeGreaterThan(0)
    // Intel gates are not under test; lift them so only completion decides.
    useCampaignStore.setState({ intelLevel: 3 })
    for (const id of AUTHORED) {
      expect(missionLocked(missionById(id), useCampaignStore.getState().intelLevel)).toBe(false)
      useAppStore.setState({ phase: 'world', missionId: null })
      useAppStore.getState().selectMission(id)
      expect(useAppStore.getState().missionId).toBe(id)
      expect(useAppStore.getState().phase).toBe('brief')
    }
  })
})

// RA-008 (TR-roster-001, GDD AC 5/6/17/75): Assembly edits go through
// appStore.toggleOperative only; the dossier focus is TeamSelect-local view
// state (src/ui/index.tsx row body → setFocusId) and never writes the squad.
describe('Assembly assign and unassign edits (RA-008)', () => {
  beforeEach(() => {
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'] })
  })

  // AC 5 (dossier focus never edits the squad) is tested against the real
  // Assembly click handlers in src/ui/assemblyRows.test.ts.

  it('refuses to unassign the only assigned operative, who stays assigned (AC 6)', () => {
    useAppStore.setState({ squad: ['op2'] })
    useAppStore.getState().toggleOperative('op2')
    expect(useAppStore.getState().squad).toEqual(['op2'])
  })

  it('unassigns one of two assigned operatives', () => {
    useAppStore.setState({ squad: ['op1', 'op2'] })
    useAppStore.getState().toggleOperative('op1')
    expect(useAppStore.getState().squad).toEqual(['op2'])
  })

  it('refuses an assign that would exceed four (AC 75)', () => {
    // op6 is Ready, so only the four-bay cap can refuse this assign.
    expect(useCampaignStore.getState().roster.op6.status).toBe('READY')
    useAppStore.setState({ squad: ['op1', 'op2', 'op3', 'op4'] })
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op4'])
  })

  // toggleOperative is the only squad writer, so a second assign of the same
  // operative cannot be requested: the same key on an assigned row unassigns.
  it('never assigns the same operative twice: the assign key on an assigned row unassigns (AC 75)', () => {
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op6'])
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('refuses to assign an Injured operative (AC 75)', () => {
    expect(useCampaignStore.getState().roster.op5.status).toBe('INJURED')
    useAppStore.getState().toggleOperative('op5')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('refuses to assign a KIA operative (AC 17, AC 75)', () => {
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op6'] }), 0)
    expect(useCampaignStore.getState().roster.op6).toBeUndefined()
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('assigns a Ready operative into an empty bay after a KIA wipe', () => {
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    useAppStore.setState({ squad: [] })
    useAppStore.getState().toggleOperative('op1')
    expect(useAppStore.getState().squad).toEqual([])
    expect(useCampaignStore.getState().roster.op7.status).toBe('READY')
    useAppStore.getState().toggleOperative('op7')
    expect(useAppStore.getState().squad).toEqual(['op7'])
  })
})

describe('new campaign roster (RA-010)', () => {
  const RAVEN = 'op5'

  // In-memory slot so startNewOperation can erase without a browser.
  function memoryStorage(): SaveStorage {
    const data = new Map<string, string>()
    return {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
    }
  }

  function expectFreshRoster(): void {
    const { operatives, roster } = useCampaignStore.getState()
    expect(operatives).toHaveLength(8)
    expect(Object.keys(roster)).toHaveLength(8)
    expect(operatives.map((o) => o.id)).toEqual(ROSTER.map((o) => o.id))
    expect(operatives.find((o) => o.id === RAVEN)?.codename).toBe('RAVEN')
    for (const op of operatives) {
      expect(['READY', 'INJURED']).toContain(roster[op.id].status)
      expect(roster[op.id].status).toBe(op.id === RAVEN ? 'INJURED' : 'READY')
      expect(roster[op.id].xp).toBe(0)
    }
    expect(Object.values(roster).filter((e) => e.status === 'READY')).toHaveLength(7)
  }

  it('holds eight living operatives, Raven Injured and the other seven Ready (AC 34)', () => {
    startNewOperation(memoryStorage())
    expectFreshRoster()
  })

  it('first read shows Raven with 86400 s of strategic downtime remaining (AC 21)', () => {
    startNewOperation(memoryStorage())
    const t = useWorldStore.getState().t
    expect(t).toBe(0)
    const raven = useCampaignStore.getState().roster[RAVEN]
    expect(raven.recoverAtT).not.toBeNull()
    expect((raven.recoverAtT as number) - t).toBe(86400)
    // A sync at the campaign's first instant recovers nothing.
    useCampaignStore.getState().sync(t)
    expect(useCampaignStore.getState().roster[RAVEN].status).toBe('INJURED')
    useCampaignStore.getState().sync(t + 86400 - 1)
    expect(useCampaignStore.getState().roster[RAVEN].status).toBe('INJURED')
  })

  it('New Operation after a lived-in campaign resets to the same eight', () => {
    startNewOperation(memoryStorage())
    const opening = useCampaignStore.getState().candidates
    const hire = opening[0]
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ casualties: 1, deadIds: ['op1'], survivorHp: { op2: 0.1 } }),
      9000,
    )
    // GHOST ended at f = 0.1: Injured for 135771 s from t0 = 9000.
    expect(useCampaignStore.getState().roster.op2).toMatchObject({
      status: 'INJURED',
      recoverAtT: 9000 + 135771,
    })
    expect(useCampaignStore.getState().acceptHire(hire.id)).toBe(true)
    useCampaignStore.getState().sync(9000 + 200 * HOUR)
    const lived = useCampaignStore.getState()
    expect(lived.roster.op1).toBeUndefined()
    expect(lived.roster[hire.id]).toBeDefined()
    expect(lived.roster[RAVEN].status).toBe('READY')
    // 200 h of refreshes moved the market off the opening three offers.
    expect(lived.candidates.map((c) => c.id)).not.toContain(hire.id)
    expect(lived.nextCandidateT).toBeGreaterThan(86400)

    startNewOperation(memoryStorage())
    expectFreshRoster()
    const state = useCampaignStore.getState()
    expect(state.roster[hire.id]).toBeUndefined()
    expect(state.roster[RAVEN].recoverAtT).toBe(86400)
    expect(state.lastReport).toBeNull()
    // The market is back to the opening three offers and the first 24 h refresh.
    expect(state.candidates).toHaveLength(3)
    expect(state.candidates).toEqual(opening)
    expect(state.candidates[0].id).toBe(hire.id)
    expect(state.nextCandidateT).toBe(86400)
  })
})

// RA-012 (TR-roster-003, GDD AC 57/58/59): injuryRecoverySec is
// round(43200 + (1 - clamp(f, 0, 0.35) / 0.35) * 129600). The helper may be
// evaluated anywhere in that range; the injury rule only calls it for a
// survivor with 0 < f < 0.35.
describe('injuryRecoverySec helper values (RA-012)', () => {
  it('returns 108000 s at living f = 0.175 (AC 57)', () => {
    expect(injuryRecoverySec(0.175)).toBe(108000)
  })

  it('returns 172800 s at f = 0, and the injury rule never invokes it for a KIA (AC 58)', () => {
    expect(injuryRecoverySec(0)).toBe(172800)
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'], survivorHp: {} }), 9000)
    const state = useCampaignStore.getState()
    expect(state.roster.op1).toBeUndefined()
    expect(state.lastReport?.kia).toEqual([{ id: 'op1', codename: 'MARA', xp: 0 }])
    expect(state.lastReport?.injured).toEqual([])
  })

  it('returns 43200 s at f = 0.35, and the injury rule applies no injury there (AC 59)', () => {
    expect(injuryRecoverySec(0.35)).toBe(43200)
    useCampaignStore
      .getState()
      .reportMission('m01', outcome({ survivorHp: { op1: 0.35 } }), 9000)
    const state = useCampaignStore.getState()
    expect(state.roster.op1).toEqual({ status: 'READY', recoverAtT: null, xp: 1, pins: {} })
    expect(state.lastReport?.injured).toEqual([])
  })

  it('returns the rounded literals at non-midpoint f: 0.2 -> 98743 s, 0.1 -> 135771 s (AC 57)', () => {
    // 43200 + (1 - 0.2 / 0.35) * 129600 = 98742.86; 43200 + (1 - 0.1 / 0.35) * 129600 = 135771.43.
    expect(injuryRecoverySec(0.2)).toBe(98743)
    expect(injuryRecoverySec(0.1)).toBe(135771)
  })

  it('clamps f below 0 and above 0.35 and always returns an integer', () => {
    expect(injuryRecoverySec(-0.5)).toBe(172800)
    expect(injuryRecoverySec(0.9)).toBe(43200)
    expect(injuryRecoverySec(1)).toBe(43200)
    for (const f of [0.01, 0.1, 0.123, 0.2, 0.3333, 0.349]) {
      expect(Number.isInteger(injuryRecoverySec(f))).toBe(true)
    }
  })
})

describe('debrief classifies survivors as Ready, Injured, or KIA (RA-013)', () => {
  // A loss spends no ETA, so the classification is read at the frozen t0
  // without the win catch-up (RA-017) moving any recovery clock.
  const T0 = 5 * HOUR
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
  }
  beforeEach(() => {
    resetStores()
    useWorldStore.setState({ t: T0 })
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'], lastAppliedKey: 0 })
  })
  afterEach(resetStores)

  const debrief = (over: Partial<MissionOutcome>) => {
    useAppStore.setState({ outcome: outcome({ won: false, reward: 0, ...over }) })
    applyDebrief('m01')
  }

  it('f = 0.35 stays Ready and keeps its bay; no downtime is computed (AC 18)', () => {
    debrief({ survivorHp: { op1: 0.35, op2: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.roster.op1.status).toBe('READY')
    expect(state.roster.op1.recoverAtT).toBeNull()
    expect(state.lastReport?.injured).toEqual([])
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('f above 0.35 keeps the bay and stays Ready', () => {
    debrief({ survivorHp: { op1: 0.36, op2: 0.8, op3: 1 } })
    const { roster } = useCampaignStore.getState()
    for (const id of ['op1', 'op2', 'op3']) expect(roster[id].status).toBe('READY')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('0 < f < 0.35 is Injured at t0 + injuryRecoverySec(f), bay emptied, unassignable (AC 19)', () => {
    const f = 0.2
    debrief({ survivorHp: { op1: f, op2: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    // round(43200 + (1 - 0.2 / 0.35) * 129600) = 98743 s.
    const D = 98743
    expect(state.roster.op1.status).toBe('INJURED')
    expect(state.roster.op1.recoverAtT).toBe(T0 + D)
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: D }])
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
    useAppStore.getState().toggleOperative('op1')
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
  })

  it('f = 0.349, just under the threshold, is Injured at t0 + 43570 (AC 19)', () => {
    // round(43200 + (1 - 0.349 / 0.35) * 129600) = round(43570.29) = 43570 s.
    debrief({ survivorHp: { op1: 0.349, op2: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.roster.op1.status).toBe('INJURED')
    expect(state.roster.op1.recoverAtT).toBe(T0 + 43570)
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: 43570 }])
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
  })

  it('the last assigned operative newly Injured leaves every bay empty', () => {
    useAppStore.setState({ squad: ['op1'] })
    debrief({ survivorHp: { op1: 0.01 } })
    expect(useCampaignStore.getState().roster.op1.status).toBe('INJURED')
    expect(useAppStore.getState().squad).toEqual([])
  })

  it('end HP 0 is KIA, not Injured; survivorHp lists survivors only (AC 20)', () => {
    debrief({ casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    // survivorHp omitting the dead is the sim's job; world.test.ts covers it.
    expect(state.roster.op2).toBeUndefined()
    expect(state.operatives.some((o) => o.id === 'op2')).toBe(false)
    expect(state.lastReport?.kia.map((k) => k.id)).toEqual(['op2'])
    expect(state.lastReport?.injured).toEqual([])
    expect(state.lastReport?.xp.map((x) => x.id)).toEqual(['op1', 'op3'])
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3'])
  })

  it('an id listed as both dead and injured is KIA only (AC 76)', () => {
    debrief({ casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op2: 0.1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.lastReport?.kia.map((k) => k.id)).toEqual(['op2'])
    expect(state.lastReport?.injured).toEqual([])
    expect(state.lastReport?.xp.some((x) => x.id === 'op2')).toBe(false)
    expect(state.roster.op2).toBeUndefined()
    expect(state.operatives.some((o) => o.id === 'op2')).toBe(false)
  })
})

// RA-014 (TR-roster-006, GDD AC 15/16 + Edge Cases): a KIA at the Debrief
// apply leaves the living roster with no Dead state, empties its Squad bay,
// earns no Experience, and reaches World Network only as a codename.
describe('KIA removes the operative from the living roster (RA-014)', () => {
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
  }
  beforeEach(() => {
    resetStores()
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'], lastAppliedKey: 0, missionId: 'm01' })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    resetStores()
  })

  const debrief = (over: Partial<MissionOutcome>) => {
    useAppStore.setState({ outcome: outcome({ won: false, reward: 0, ...over }) })
    applyDebrief('m01')
  }
  const kiaEvents = () => useWorldStore.getState().events.filter((e) => e.kind === 'kia')

  it('drops X from the living roster with no Dead state, empties its bay, lists it under KIA (AC 15)', () => {
    useAppStore.setState({ loadout: { op2: emptyLoadout() } })
    debrief({ casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.operatives.map((o) => o.id)).not.toContain('op2')
    expect(state.roster.op2).toBeUndefined()
    // No Dead state anywhere: every remaining entry is READY or INJURED.
    for (const entry of Object.values(state.roster)) {
      expect(['READY', 'INJURED']).toContain(entry.status)
    }
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3'])
    expect(useAppStore.getState().loadout.op2).toBeUndefined()
    expect(state.lastReport?.kia).toEqual([{ id: 'op2', codename: 'GHOST', xp: 0 }])
    const events = kiaEvents()
    expect(events).toHaveLength(1)
    expect(events[0].text).toContain('GHOST')
  })

  it('the last assigned dying with Ready left leaves the bay empty, auto-assigns nobody, and Deploy needs one Ready (Edge Cases)', () => {
    useAppStore.setState({ squad: ['op1'] })
    debrief({ casualties: 1, deadIds: ['op1'], survivorHp: {} })
    const { roster } = useCampaignStore.getState()
    expect(Object.values(roster).some((e) => e.status === 'READY')).toBe(true)
    expect(useAppStore.getState().squad).toEqual([])

    // Assembly reads the same empty Squad; the gate refuses as none-assigned.
    const gate = canDeploy({
      missionSelected: true,
      assignedIds: useAppStore.getState().squad,
      statusById: {},
      massKg: 0,
    })
    expect(gate).toMatchObject({ ok: false, reason: 'none-assigned' })
    useAppStore.setState({ phase: 'team' })
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('team')

    // The player assigns a Ready operative by hand; the dead one cannot return.
    useAppStore.getState().toggleOperative('op1')
    expect(useAppStore.getState().squad).toEqual([])
    useAppStore.getState().toggleOperative('op2')
    expect(useAppStore.getState().squad).toEqual(['op2'])
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
  })

  it('X in deadIds receives 0 Experience while survivors earn theirs (Edge Cases)', () => {
    // op2 is listed as dead and as a survivor: the death wins, so no award.
    debrief({ won: true, reward: 85000, casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op2: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.lastReport?.xp.map((x) => x.id)).toEqual(['op1', 'op3'])
    expect(state.lastReport?.xp.some((x) => x.id === 'op2')).toBe(false)
    expect(state.lastReport?.kia).toEqual([{ id: 'op2', codename: 'GHOST', xp: 0 }])
    expect(state.lastReport?.injured).toEqual([])
    expect(state.roster.op2).toBeUndefined()
    expect(state.operatives.some((o) => o.id === 'op2')).toBe(false)
    expect(state.roster.op1.xp).toBe(1)
    expect(state.roster.op3.xp).toBe(1)
  })

  it('World Network reads the kia names only and never queries the live Roster (Edge Cases)', () => {
    const spy = vi.spyOn(useCampaignStore, 'getState')
    // deadIds names op2 (GHOST) but the kia list says ZZZ: the feed must print
    // the list it was given, not a codename looked up from the dead id.
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0, deadIds: ['op2'] }), ['ZZZ'])
    expect(spy).not.toHaveBeenCalled()
    const events = kiaEvents()
    expect(events).toHaveLength(1)
    expect(events[0].text).toContain('ZZZ')
    expect(events[0].text).not.toContain('GHOST')
    // No roster codename reaches the feed line.
    for (const op of ROSTER) {
      expect(events[0].text).not.toContain(op.codename)
    }
  })
})

describe('Experience award and deploy sampling (RA-015)', () => {
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
    useResearchStore.setState(useResearchStore.getInitialState(), true)
  }
  beforeEach(() => {
    resetStores()
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'], lastAppliedKey: 0, missionId: 'm01' })
  })
  afterEach(resetStores)

  const debrief = (over: Partial<MissionOutcome>) => {
    const key = useAppStore.getState().lastAppliedKey + 1
    useAppStore.setState({ outcome: outcome({ applyKey: key, ...over }) })
    applyDebrief('m01')
  }
  const ops = (ids: readonly string[]) => ids.map((id) => liveOperativeById(id))
  const freeze = (ids: readonly string[]) => freezeDeploy(missionById('m01'), ops(ids), 1)

  it('each survivor gains exactly 1 Experience and each KIA 0, applied once (AC 25)', () => {
    debrief({ casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op3: 0.6 } })
    const state = useCampaignStore.getState()
    expect(state.roster.op1.xp).toBe(1)
    expect(state.roster.op3.xp).toBe(1)
    expect(state.roster.op2).toBeUndefined()
    expect(state.lastReport?.xp).toEqual([
      { id: 'op1', codename: 'MARA', gained: 1, total: 1 },
      { id: 'op3', codename: 'DART', gained: 1, total: 1 },
    ])
    // A second apply of the same outcome is refused by the apply-once key.
    applyDebrief('m01')
    expect(useCampaignStore.getState().roster.op1.xp).toBe(1)
    expect(useCampaignStore.getState().roster.op3.xp).toBe(1)
  })

  it('a quiet replay still awards survivors +1; an Abort awards none (Edge Cases)', () => {
    debrief({ survivorHp: { op1: 1 } })
    debrief({ quietReplay: true, reward: 0, survivorHp: { op1: 1 } })
    expect(useCampaignStore.getState().roster.op1.xp).toBe(2)

    // The applied outcome stays in the store; the next mission is aborted
    // through the real Hud sequence (abortMission, then MissionScreen cleanup).
    const keyBefore = useAppStore.getState().lastAppliedKey
    expect(keyBefore).toBe(2)
    expect(useAppStore.getState().outcome).not.toBeNull()
    useAppStore.setState({ phase: 'mission' })
    abortMission('m01')
    teardownMission()
    expect(useAppStore.getState().phase).toBe('world')
    // A stray apply after the Abort finds only the already-applied key.
    applyDebrief('m01')
    expect(useCampaignStore.getState().roster.op1.xp).toBe(2)
    expect(useAppStore.getState().lastAppliedKey).toBe(2)
  })

  it('awarded Experience is sampled into the next deploy; a later award leaves the on-ground squad unchanged (AC 26)', () => {
    debrief({ survivorHp: { op1: 1 } })
    const deploy = freeze(['op1'])
    const hp = deploy.roster.maxHp.op1
    const speed = deploy.roster.speed.op1
    const kg = deploy.roster.massKg

    debrief({ survivorHp: { op1: 1 } })
    expect(useCampaignStore.getState().roster.op1.xp).toBe(2)
    expect(deploy.roster.maxHp.op1).toBe(hp)
    expect(deploy.roster.speed.op1).toBe(speed)
    expect(deploy.roster.massKg).toBe(kg)
    // The next create samples the new total.
    // Mara: 124 HP + 2 per point (living spec §6), so 126 after one award, 128 after two.
    expect(hp).toBe(126)
    expect(freeze(['op1']).roster.maxHp.op1).toBe(128)
  })

  it('1 Experience puts H0 + 2 into the plating term and adds +0.05 m/s (AC 44)', () => {
    const before = freeze(['op1'])
    debrief({ survivorHp: { op1: 1 } })
    const after = freeze(['op1'])

    // Mara, no research or items (AC 61): H0 124, 73.9 kg, 4.6 m/s + 0.15 light tier.
    expect(before.roster.maxHp.op1).toBe(124)
    expect(before.roster.massKg).toBeCloseTo(73.9, 9)
    expect(before.roster.speed.op1).toBeCloseTo(4.75, 9)
    // H0 + 2 = 126 puts 0.25 kg/HP x 2 = 0.5 kg more plating on; speed gains 0.05.
    expect(after.roster.maxHp.op1).toBe(126)
    expect(after.roster.massKg).toBeCloseTo(74.4, 9)
    expect(after.roster.massTier).toBe('light')
    expect(after.roster.speed.op1).toBeCloseTo(4.8, 9)
  })
})

// RA-016 (TR-roster-003, GDD AC 22/40/78): Injury recovery runs on strategic
// t through campaignStore.sync(t). These tests drive it from a strategy Screen
// tick (the world clock) and from direct sync calls; the win catch-up sync
// inside the Debrief apply is covered by RA-017 and RA-018. Recovery sets
// Ready and never refills the Squad bay cleared at injury.
describe('injury recovery on strategic sync (RA-016)', () => {
  // f = 0.175 at t0 = 0 is D = 108000 s, so recovery is due at T = 30 h.
  const T = 30 * HOUR
  let key = 0
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
  }
  // Injures through the real path: a lost debrief at t0 = 0 (a loss spends no
  // ETA, so no catch-up sync runs), which also clears the injured bays.
  const injure = (...ids: string[]) => {
    key += 1
    const survivorHp = Object.fromEntries(
      useAppStore.getState().squad.map((id) => [id, ids.includes(id) ? 0.175 : 1]),
    )
    useAppStore.setState({ outcome: outcome({ applyKey: key, won: false, reward: 0, survivorHp }) })
    applyDebrief('m01')
  }
  beforeEach(() => {
    resetStores()
    key = 0
    useWorldStore.setState({ t: 0 })
    useAppStore.setState({ squad: ['op1', 'op2', 'op3', 'op4'], lastAppliedKey: 0, phase: 'team' })
    injure('op2')
    // Keep the market quiet unless a test schedules it, so only recovery moves.
    useCampaignStore.setState({ nextCandidateT: 10 * T })
    // The debrief recorded the injury at T and cleared op2's bay.
    expect(useCampaignStore.getState().roster.op2).toMatchObject({ status: 'INJURED', recoverAtT: 108000 })
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
    useAppStore.setState({ phase: 'team' })
  })
  afterEach(resetStores)

  it('a strategy Screen tick reaching t >= T sets Ready and leaves the cleared bay empty (AC 40)', () => {
    useWorldStore.setState({ t: T - 1, paused: false, speed: 1 })
    let wall = 0
    let pending: ((now: number) => void) | null = null
    const stop = startWorldClock(
      {
        tick: (dt) => useWorldStore.getState().tick(dt),
        syncResearch: (t) => useResearchStore.getState().sync(t),
        syncCampaign: (t) => useCampaignStore.getState().sync(t),
      },
      {
        now: () => wall,
        request: (cb) => {
          pending = cb
          return 1
        },
        cancel: () => {
          pending = null
        },
      },
    )
    // One 50 ms batch at TIME_SCALE 60 moves strategic t by 3 s, past T.
    wall += CLOCK_BATCH_SEC * 1000
    const cb = pending as ((now: number) => void) | null
    cb?.(wall)
    stop()
    expect(useWorldStore.getState().t).toBeGreaterThanOrEqual(T)
    const entry = useCampaignStore.getState().roster.op2
    expect(entry.status).toBe('READY')
    expect(entry.recoverAtT).toBeNull()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
  })

  it('a recovered operative becomes Ready but the bay cleared at injury stays empty (AC 22)', () => {
    useCampaignStore.getState().sync(T + HOUR)
    expect(useCampaignStore.getState().roster.op2.status).toBe('READY')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
    expect(useAppStore.getState().squad).not.toContain('op2')
    // Ready again, so the player may assign them back by hand.
    useAppStore.getState().toggleOperative('op2')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4', 'op2'])
  })

  it('sync(T - 1) leaves the operative Injured with recoverAtT unchanged (Edge Cases)', () => {
    useCampaignStore.getState().sync(T - 1)
    const entry = useCampaignStore.getState().roster.op2
    expect(entry.status).toBe('INJURED')
    expect(entry.recoverAtT).toBe(T)
  })

  it('two Injured operatives with the same T both recover in one sync (Edge Cases)', () => {
    injure('op4')
    expect(useCampaignStore.getState().roster.op4).toMatchObject({ status: 'INJURED', recoverAtT: 108000 })
    useCampaignStore.getState().sync(T)
    const { roster } = useCampaignStore.getState()
    expect(roster.op2.status).toBe('READY')
    expect(roster.op4.status).toBe('READY')
    expect(roster.op2.recoverAtT).toBeNull()
    expect(roster.op4.recoverAtT).toBeNull()
  })

  it.each([0, 1, 2, 3])(
    'recovery and a candidate due both at T complete in one sync: Ready and market min(3, N + 1) for N = %i (AC 78)',
    (n) => {
      const pool = useCampaignStore.getState().candidates.slice(0, n)
      useCampaignStore.setState({ candidates: pool, nextCandidateT: T })
      useCampaignStore.getState().sync(T)
      const state = useCampaignStore.getState()
      expect(state.roster.op2.status).toBe('READY')
      expect(state.candidates).toHaveLength(Math.min(CANDIDATE_POOL, n + 1))
      expect(state.nextCandidateT).toBe(T + CANDIDATE_REFRESH_SEC)
    },
  )
})

// RA-017 (TR-roster-003, GDD AC 60/72/73): a win's ETA catch-up moves strategic
// t from the frozen t0 to t1, and the recovery clock catches up in the same
// apply. Remaining downtime is max(0, t0 + D - t1); the debrief injury line
// still reports the original D.
describe('win ETA catch-up of injury downtime (RA-017)', () => {
  const DAY = 24 * HOUR
  // f = 0.175 sits halfway down the injury band: 12 h + 0.5 * 36 h = 30 h.
  const F_30H = 0.175
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
  }
  beforeEach(() => {
    resetStores()
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'], lastAppliedKey: 0 })
  })
  afterEach(resetStores)

  // [t0, D, t1, remaining]: remaining is max(0, t0 + D - t1) worked by hand.
  it.each([
    [0, 108000, 172800, 0],
    [0, 108000, 100000, 8000],
    [5 * HOUR, 48 * HOUR, 20 * HOUR, 33 * HOUR],
    [5 * HOUR, 12 * HOUR, 17 * HOUR, 0],
    [5 * HOUR, 12 * HOUR, 17 * HOUR - 1, 1],
  ])(
    'remaining downtime after catch-up equals max(0, t0 + D - t1) for t0 %i, D %i, t1 %i (AC 72)',
    (t0, D, t1, expected) => {
      useCampaignStore.setState((state) => ({
        roster: { ...state.roster, op1: { ...state.roster.op1, status: 'INJURED', recoverAtT: t0 + D } },
      }))
      useCampaignStore.getState().sync(t1)
      const entry = useCampaignStore.getState().roster.op1
      expect(remainingDowntimeSec(entry.recoverAtT, t1)).toBe(expected)
      expect(entry.status).toBe(expected > 0 ? 'INJURED' : 'READY')
    },
  )

  it('t1 short of t0 + D leaves positive remaining and the operative Injured (Edge Cases)', () => {
    // Injured at t0 = 0 with f = 0.175 (D = 108000), then caught up to t1 = 100000.
    useCampaignStore.getState().reportMission('m01', outcome({ survivorHp: { op1: F_30H } }), 0)
    useCampaignStore.getState().sync(100000)
    const entry = useCampaignStore.getState().roster.op1
    expect(entry.status).toBe('INJURED')
    expect(entry.recoverAtT).toBe(108000)
    expect(remainingDowntimeSec(entry.recoverAtT, 100000)).toBe(8000)
    expect(remainingDowntimeSec(108000, 100000)).toBe(8000)
    expect(remainingDowntimeSec(null, 100000)).toBe(0)
    expect(remainingDowntimeSec(108000, 108000)).toBe(0)
    expect(remainingDowntimeSec(108000, 200000)).toBe(0)
  })

  it('t0 0, D 108000, win to t1 172800: remaining 0, Ready, bay empty, line 30 h (AC 73)', () => {
    expect(injuryRecoverySec(F_30H)).toBe(108000)
    expect(missionById('m01').etaDays).toBe(2)
    useWorldStore.setState({ t: 0 })
    useAppStore.setState({ outcome: outcome({ survivorHp: { op1: F_30H, op2: 1, op3: 1 } }) })
    applyDebrief('m01')
    const t1 = useWorldStore.getState().t
    expect(t1).toBe(2 * DAY)
    expect(t1).toBe(172800)
    const state = useCampaignStore.getState()
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: 108000 }])
    expect(remainingDowntimeSec(state.roster.op1.recoverAtT, t1)).toBe(0)
    expect(state.roster.op1.status).toBe('READY')
    expect(state.roster.op1.recoverAtT).toBeNull()
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
    expect(injuryLineHours(state.lastReport!.injured[0].downtimeSec)).toBe(30)
  })

  it('the injury line reports the original D in hours, not remaining downtime (AC 60)', () => {
    // A win from t0 = 0: the ETA catch-up to t1 = 172800 finishes recovery, so
    // remaining is 0, yet the line still reads the original 108000 s as 30 h.
    useWorldStore.setState({ t: 0 })
    useAppStore.setState({ outcome: outcome({ survivorHp: { op1: F_30H, op2: 1, op3: 1 } }) })
    applyDebrief('m01')
    expect(useWorldStore.getState().t).toBe(172800)
    const report = useCampaignStore.getState().lastReport!
    expect(report.injured[0].downtimeSec).toBe(108000)
    expect(injuryLineHours(report.injured[0].downtimeSec)).toBe(30)
    expect(remainingDowntimeSec(useCampaignStore.getState().roster.op1.recoverAtT, 172800)).toBe(0)
    expect(injuryLineHours(108000)).toBe(30)
    // Mid-recovery, remaining is 8000 s (3 h rounded up) but the line stays 30 h.
    expect(remainingDowntimeSec(108000, 100000)).toBe(8000)
    expect(injuryLineHours(108000)).not.toBe(injuryLineHours(8000))
  })

  it('a D that is not a whole number of hours rounds the line up (Edge Cases)', () => {
    expect(injuryLineHours(12 * HOUR)).toBe(12)
    expect(injuryLineHours(12 * HOUR + 1)).toBe(13)
    expect(injuryLineHours(108000 - 1)).toBe(30)
    // f = 0.2 gives D = 98743 s, 27.43 h, which the line prints as 28 h.
    const D = injuryRecoverySec(0.2)
    expect(D).toBe(98743)
    expect(injuryLineHours(D)).toBe(28)
  })
})

describe('campaign fail on empty roster (RA-024)', () => {
  // "Campaign fail state" and WN-018/WN-019 above already cover the flag
  // invariants, the stays-complete wipe and the Injured-counts-as-living edge;
  // these pin the story's three criteria end to end, including the lock.
  const resetApp = () => useAppStore.setState(useAppStore.getInitialState(), true)
  beforeEach(resetApp)
  afterEach(resetApp)

  const wipe = (missionId: string, won = false) => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    useCampaignStore.getState().reportMission(
      missionId,
      outcome({ won, reward: won ? 85000 : 0, casualties: ids.length, deadIds: ids }),
      0,
    )
  }
  const flags = () => {
    const { campaignWon, campaignFailed } = useCampaignStore.getState()
    return { campaignWon, campaignFailed }
  }
  // Tries every authored contract through the real selection action.
  const selectable = () =>
    ['m01', 'm02', 'm03'].filter((id) => {
      useAppStore.setState({ phase: 'world', missionId: null })
      useAppStore.getState().selectMission(id)
      return useAppStore.getState().phase === 'brief' && useAppStore.getState().missionId === id
    })

  it('an incomplete campaign at living 0 is failed, not complete, and locks contracts (AC 38)', () => {
    useCampaignStore.getState().reportMission('m01', outcome({ civiliansHit: 1 }), 0)
    // Intel gates are not under test; lift them so only the fail flag decides.
    useCampaignStore.setState({ intelLevel: 3 })
    expect(selectable()).toEqual(['m01', 'm02', 'm03'])
    wipe('m02')
    expect(useCampaignStore.getState().operatives).toEqual([])
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: true })
    expect(selectable()).toEqual([])
    expect(useAppStore.getState()).toMatchObject({ phase: 'world', missionId: null })
  })

  it('an already complete campaign at living 0 stays complete and is not failed (AC 39)', () => {
    for (const id of ['m01', 'm02', 'm03']) {
      useCampaignStore.getState().reportMission(id, outcome({ civiliansHit: 1 }), 0)
    }
    expect(flags()).toEqual({ campaignWon: true, campaignFailed: false })
    wipe('m01')
    expect(useCampaignStore.getState().operatives).toEqual([])
    expect(flags()).toEqual({ campaignWon: true, campaignFailed: false })
  })

  it('a director who never hires and reaches living 0 on an incomplete campaign fails it (AC 77)', () => {
    const starting = initialCampaignData().operatives.map((o) => o.id)
    expect(useCampaignStore.getState().operatives.map((o) => o.id)).toEqual(starting)
    wipe('m01', true)
    const state = useCampaignStore.getState()
    expect(state.operatives).toEqual([])
    expect(state.contractsWon).toEqual(['m01'])
    expect(flags()).toEqual({ campaignWon: false, campaignFailed: true })
  })
})

// RA-018 (TR-roster-004, GDD AC 24/74 + Edge Cases "If Loss", "win ETA
// finishes recovery", Persistence rule 10 / WN-011): quiet replay zeros the
// payout only (ADR-0004); the roster apply at t0 runs on every debrief, and
// only a win (quiet replay included) spends ETA to t1 (ADR-0001).
describe('loss and quiet-replay debrief roster apply (RA-018)', () => {
  const DAY = 24 * HOUR
  const T0 = 5 * HOUR
  // f = 0.175 is 30 h of downtime; f = 0.01 sits near the 48 h maximum.
  const F_30H = 0.175
  const F_DEEP = 0.01
  const resetStores = () => {
    useWorldStore.setState(useWorldStore.getInitialState(), true)
    useAppStore.setState(useAppStore.getInitialState(), true)
  }
  beforeEach(() => {
    resetStores()
    useWorldStore.setState({ t: T0 })
    useAppStore.setState({ squad: ['op1', 'op2', 'op3', 'op4'], lastAppliedKey: 0 })
  })
  afterEach(resetStores)

  const debrief = (missionId: string, over: Partial<MissionOutcome>) => {
    useAppStore.setState({ outcome: outcome(over) })
    applyDebrief(missionId)
    return useCampaignStore.getState()
  }

  it('a quiet-replay win still applies KIA, injury, +1 Experience and the t1 catch-up (AC 74)', () => {
    useCampaignStore.setState({ contractsWon: ['m01'] })
    const D = 108000 // f = 0.175: 30 h
    const state = debrief('m01', {
      quietReplay: true,
      casualties: 1,
      deadIds: ['op4'],
      survivorHp: { op1: F_30H, op2: 1, op3: 0.5 },
    })
    const t1 = useWorldStore.getState().t
    expect(t1).toBe(T0 + missionById('m01').etaDays * DAY)
    // KIA: gone from the living roster and its loadout.
    expect(state.operatives.some((o) => o.id === 'op4')).toBe(false)
    expect(state.roster.op4).toBeUndefined()
    expect(state.lastReport?.kia).toEqual([{ id: 'op4', codename: 'TORQ', xp: 0 }])
    expect(useAppStore.getState().loadout.op4).toBeUndefined()
    // Injury recorded at t0 with D, bay cleared, then caught up at t1.
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: D }])
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
    expect(state.roster.op1).toMatchObject({ status: 'READY', recoverAtT: null })
    // Experience +1 per survivor, none for the KIA.
    expect(state.lastReport?.xp.map((x) => [x.id, x.gained])).toEqual([
      ['op1', 1],
      ['op2', 1],
      ['op3', 1],
    ])
    expect([state.roster.op1.xp, state.roster.op2.xp, state.roster.op3.xp]).toEqual([1, 1, 1])
  })

  it('a loss that records injury at t0 runs no t1 jump; remaining downtime is still D (AC 24)', () => {
    // f = 0.175 is D = 108000 s (30 h).
    const D = 108000
    const state = debrief('m01', {
      won: false,
      reward: 0,
      survivorHp: { op1: F_30H, op2: 1 },
    })
    expect(useWorldStore.getState().t).toBe(T0)
    expect(state.roster.op1).toMatchObject({ status: 'INJURED', recoverAtT: T0 + D })
    expect(remainingDowntimeSec(state.roster.op1.recoverAtT, useWorldStore.getState().t)).toBe(D)
    // The loss still clears the injured bay and awards +1 Experience to each survivor.
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3', 'op4'])
    expect(state.roster.op1.xp).toBe(1)
    expect(state.roster.op2.xp).toBe(1)
    expect(state.lastReport?.xp).toEqual([
      { id: 'op1', codename: 'MARA', gained: 1, total: 1 },
      { id: 'op2', codename: 'GHOST', gained: 1, total: 1 },
    ])
  })

  it('a loss with deadIds and survivors still applies KIA, injury and +1 Experience at t0 (Edge Cases: If Loss)', () => {
    const D = 108000 // f = 0.175: 30 h
    const state = debrief('m02', {
      won: false,
      reward: 0,
      casualties: 2,
      deadIds: ['op3', 'op4'],
      survivorHp: { op1: F_30H, op2: 0.9 },
    })
    expect(useWorldStore.getState().t).toBe(T0)
    expect(state.operatives.map((o) => o.id)).not.toContain('op3')
    expect(state.operatives.map((o) => o.id)).not.toContain('op4')
    expect(state.lastReport?.kia.map((k) => k.id)).toEqual(['op3', 'op4'])
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: D }])
    expect(state.roster.op1).toMatchObject({ status: 'INJURED', recoverAtT: T0 + D, xp: 1 })
    expect(state.roster.op2).toMatchObject({ status: 'READY', xp: 1 })
    expect(state.lastReport?.xp.map((x) => x.id)).toEqual(['op1', 'op2'])
    expect(useAppStore.getState().squad).toEqual(['op2'])
  })

  it.each([
    ['a paid win', false],
    ['a quiet-replay win', true],
  ])(
    '%s whose ETA reaches t0 + D for every injury clears them all; bays stay empty; lines keep D (Edge Cases)',
    (_label, quietReplay) => {
      if (quietReplay) useCampaignStore.setState({ contractsWon: ['m01'] })
      // D at f = 0.175 is 108000 s (30 h); at f = 0.01 it is 169097 s (47 h).
      const dMara = 108000
      const dGhost = 169097
      const state = debrief('m01', {
        quietReplay,
        survivorHp: { op1: F_30H, op2: F_DEEP, op3: 1, op4: 1 },
      })
      const t1 = useWorldStore.getState().t
      expect(t1).toBeGreaterThanOrEqual(T0 + Math.max(dMara, dGhost))
      for (const id of ['op1', 'op2']) {
        expect(state.roster[id]).toMatchObject({ status: 'READY', recoverAtT: null })
        expect(remainingDowntimeSec(state.roster[id].recoverAtT, t1)).toBe(0)
      }
      expect(useAppStore.getState().squad).toEqual(['op3', 'op4'])
      expect(state.lastReport?.injured).toEqual([
        { id: 'op1', codename: 'MARA', downtimeSec: dMara },
        { id: 'op2', codename: 'GHOST', downtimeSec: dGhost },
      ])
      expect(state.lastReport!.injured.map((i) => injuryLineHours(i.downtimeSec))).toEqual([30, 47])
    },
  )

  it('a quiet-replay win applies roster and ETA catch-up and awards no intel (Persistence rule 10; WN-011)', () => {
    useCampaignStore.setState({ contractsWon: ['m01'], intelLevel: 2, intelProgress: 25 })
    const state = debrief('m01', {
      quietReplay: true,
      civiliansHit: 0,
      survivorHp: { op1: F_30H, op2: 1 },
    })
    expect(state.intelLevel).toBe(2)
    expect(state.intelProgress).toBe(25)
    expect(useWorldStore.getState().t).toBe(T0 + missionById('m01').etaDays * DAY)
    expect(state.roster.op1).toMatchObject({ status: 'READY', recoverAtT: null, xp: 1 })
    expect(state.roster.op2.xp).toBe(1)
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3', 'op4'])
  })
})

// RA-021: the Roster-side view of bay wear. Resolution itself is
// `wornNode`/`appliedNodeIds` (research epic Stories 013-015); these tests read
// it through the live stores the way Assembly and the deploy freeze do: the
// Research slice's completed set plus each operative's pins on the Roster slice.
describe('augmentation bay wear resolution (RA-021)', () => {
  beforeEach(() => {
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
      lastSyncT: null,
    })
  })

  // Completes a project through the lab: start at the last sync, sync to endT.
  function complete(id: string) {
    const node = nodeById(id)
    const t = useResearchStore.getState().lastSyncT ?? 0
    expect(useResearchStore.getState().start(node, t)).toBe(true)
    useResearchStore.getState().sync(useResearchStore.getState().labs[node.branch]!.endT)
    expect(useResearchStore.getState().done.at(-1)).toBe(id)
  }

  function wearOf(opId: string) {
    const done = useResearchStore.getState().done
    return wornAugs(done, useCampaignStore.getState().roster[opId].pins)
  }

  it('lists 4 bays per operative, each wearing at most 1 completed project of that bay (AC 35)', () => {
    // Two NEURAL, two CHEST, one ARMS completed; LEGS has none.
    for (const id of ['c-interface', 'k-sensor', 'c-synaptic', 'c-pain', 'k-targeting']) complete(id)
    useCampaignStore.getState().setBay('op2', 'NEURAL', 'c-interface')
    useCampaignStore.getState().setBay('op3', 'CHEST', 'STOCK')
    // A pin that names another bay's project (only reachable through a bad
    // save; setBay refuses it) still never puts a foreign project in the bay.
    const op4 = useCampaignStore.getState().roster.op4
    useCampaignStore.setState({
      roster: { ...useCampaignStore.getState().roster, op4: { ...op4, pins: { ARMS: 'c-pain' } } },
    })
    const done = useResearchStore.getState().done
    for (const op of useCampaignStore.getState().operatives) {
      const bays = wearOf(op.id)
      expect(bays.map((b) => b.slot)).toEqual(['NEURAL', 'CHEST', 'ARMS', 'LEGS'])
      for (const bay of bays) {
        if (bay.node === null) continue
        expect(bay.node.augSlot).toBe(bay.slot)
        expect(done).toContain(bay.node.id)
      }
      const pins = useCampaignStore.getState().roster[op.id].pins
      const slotted = appliedNodeIds(done, pins).filter((id) => nodeById(id).augSlot)
      expect(slotted.length).toBeLessThanOrEqual(4)
      expect(new Set(slotted.map((id) => nodeById(id).augSlot)).size).toBe(slotted.length)
    }
    expect(wearOf('op4').find((b) => b.slot === 'ARMS')?.node?.id).toBe('k-targeting')
    expect(wearOf('op1').find((b) => b.slot === 'LEGS')?.node).toBeNull()
  })

  it('unpinned bays, including a new hire, wear current issue (AC 36)', () => {
    for (const id of ['c-interface', 'k-sensor', 'c-synaptic', 'k-targeting']) complete(id)
    // Free a roster place so the hire is accepted.
    useCampaignStore.getState().reportMission('m01', outcome({ casualties: 1, deadIds: ['op1'] }), 0)
    const candidate = useCampaignStore.getState().candidates[0]
    expect(useCampaignStore.getState().acceptHire(candidate.id)).toBe(true)
    expect(useCampaignStore.getState().roster[candidate.id].pins).toEqual({})

    const done = useResearchStore.getState().done
    for (const op of useCampaignStore.getState().operatives) {
      for (const bay of wearOf(op.id)) {
        expect(bay.pinned).toBe(false)
        expect(bay.node).toBe(currentIssue(done, bay.slot))
      }
    }
    const hire = wearOf(candidate.id)
    expect(hire.map((b) => b.node?.id ?? null)).toEqual(['k-sensor', 'c-synaptic', 'k-targeting', null])
  })

  it('a new same-bay completion leaves pinned bays alone and moves unpinned ones (AC 37)', () => {
    complete('c-interface')
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'STOCK')
    useCampaignStore.getState().setBay('op2', 'NEURAL', 'c-interface')
    const neural = (opId: string) => wearOf(opId).find((b) => b.slot === 'NEURAL')!
    expect(neural('op1')).toMatchObject({ node: null, pinned: true })
    expect(neural('op2').node?.id).toBe('c-interface')
    expect(neural('op3').node?.id).toBe('c-interface')

    complete('k-sensor')

    // Stock pin and older-project pin are unchanged; the unpinned bay updates.
    expect(useCampaignStore.getState().roster.op1.pins).toEqual({ NEURAL: 'STOCK' })
    expect(useCampaignStore.getState().roster.op2.pins).toEqual({ NEURAL: 'c-interface' })
    expect(neural('op1')).toMatchObject({ node: null, pinned: true })
    expect(neural('op2')).toMatchObject({ pinned: true })
    expect(neural('op2').node?.id).toBe('c-interface')
    for (const op of useCampaignStore.getState().operatives) {
      if (op.id === 'op1' || op.id === 'op2') continue
      expect(neural(op.id)).toMatchObject({ pinned: false })
      expect(neural(op.id).node?.id).toBe('k-sensor')
    }

    // The program stays researched whatever an operative wears.
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['c-interface', 'k-sensor'])
    expect(nodeState(nodeById('c-interface'), s.done, s.labs)).toBe('researched')
    expect(nodeState(nodeById('k-sensor'), s.done, s.labs)).toBe('researched')
    expect(appliedNodeIds(s.done, useCampaignStore.getState().roster.op1.pins)).toEqual([])
    expect(appliedNodeIds(s.done, useCampaignStore.getState().roster.op2.pins)).toEqual(['c-interface'])
    expect(appliedNodeIds(s.done, useCampaignStore.getState().roster.op3.pins)).toEqual(['k-sensor'])
  })
})

// RA-022 (TR-roster-003, GDD AC 27/28/29): the candidate market on a new
// campaign. Post-hire count is Open Question 2 and is deliberately not asserted.
describe('candidate market offers and hire cost (RA-022)', () => {
  function memoryStorage(): SaveStorage {
    const data = new Map<string, string>()
    return {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
    }
  }

  it('a new campaign offers 3 Ready candidates on the role kit, current issue and §8 envelopes, stable across save/reload (AC 27)', () => {
    startNewOperation(memoryStorage())
    const { candidates } = useCampaignStore.getState()
    expect(candidates).toHaveLength(3)

    const roles = new Set(ROSTER.map((o) => o.role))
    expect(roles.size).toBe(8)
    const roleWeapon = new Map(ROSTER.map((o) => [o.role, o.weapon]))
    // §8 starting-roster ranges: HP 92-132, speed 4.2-5.6 m/s.
    const [hpMin, hpMax, speedMin, speedMax] = [92, 132, 4.2, 5.6]
    // A new campaign has no completed projects, so current issue is stock in
    // every bay, and a candidate carries no pins to override it.
    expect(useResearchStore.getState().done).toEqual([])
    const bays = wornAugs(useResearchStore.getState().done, undefined)
    expect(bays.map((b) => [b.node, b.pinned])).toEqual([
      [null, false],
      [null, false],
      [null, false],
      [null, false],
    ])
    for (const c of candidates) {
      expect(roles.has(c.role)).toBe(true)
      expect(c.weapon).toBe(roleWeapon.get(c.role))
      expect(c.status).toBe('READY')
      expect(c.maxHp).toBeGreaterThanOrEqual(hpMin)
      expect(c.maxHp).toBeLessThanOrEqual(hpMax)
      expect(c.speed).toBeGreaterThanOrEqual(speedMin)
      expect(c.speed).toBeLessThanOrEqual(speedMax)
      expect('pins' in c).toBe(false)
    }

    // The figure hash is a pure function of id + codename (ui/portrait.tsx);
    // name, id and codename survive a save/reload, so name and figure match.
    const before = candidates.map((c) => ({
      name: c.name,
      figure: hashOf(c.id + ':' + c.codename),
    }))
    const reloaded = JSON.parse(JSON.stringify(captureSave())) as SaveV10
    useCampaignStore.setState(initialCampaignData())
    useCampaignStore.setState({ candidates: [] })
    hydrateSave(reloaded)
    const after = useCampaignStore.getState().candidates.map((c) => ({
      name: c.name,
      figure: hashOf(c.id + ':' + c.codename),
    }))
    expect(after).toEqual(before)
  })

  it('3 offers and 24 strategic hours with no hire still holds 3 offers (AC 28)', () => {
    startNewOperation(memoryStorage())
    const t = useWorldStore.getState().t
    expect(t).toBe(0)
    const opening = useCampaignStore.getState().candidates.map((c) => c.id)
    expect(opening).toHaveLength(3)
    expect(useCampaignStore.getState().nextCandidateT).toBe(86400)
    useCampaignStore.getState().sync(t + 24 * HOUR)
    const after = useCampaignStore.getState()
    expect(after.candidates).toHaveLength(3)
    // The refresh fired: the oldest offer dropped, a new one appended, next due at 48 h.
    const ids = after.candidates.map((c) => c.id)
    expect(ids).not.toContain(opening[0])
    expect(ids.slice(0, 2)).toEqual(opening.slice(1))
    expect(opening).not.toContain(ids[2])
    expect(after.nextCandidateT).toBe(172800)
  })

  it('every candidate hire cost is inside 16000–34000 CR inclusive (AC 29)', () => {
    expect(HIRE_MIN_COST).toBe(16000)
    expect(HIRE_MAX_COST).toBe(34000)
    startNewOperation(memoryStorage())
    // The opening offers plus 20 days of refreshes.
    const seen = [...useCampaignStore.getState().candidates]
    for (let day = 1; day <= 20; day++) {
      useCampaignStore.getState().sync(day * 24 * HOUR)
      const rolled = useCampaignStore.getState().candidates.at(-1)!
      // Each daily sync rolled a candidate not seen before.
      expect(seen.map((c) => c.id)).not.toContain(rolled.id)
      seen.push(rolled)
    }
    expect(new Set(seen.map((c) => c.id)).size).toBe(23)
    for (const c of seen) {
      expect(c.cost).toBeGreaterThanOrEqual(HIRE_MIN_COST)
      expect(c.cost).toBeLessThanOrEqual(HIRE_MAX_COST)
    }
  })
})

// RA-023 (GDD AC 30/31/32/33, ADR-0013): hire refusals and success through
// the authorize path, appStore.hireOperative. Refusals are identity no-ops on
// both Credits and the roster. Post-hire offer count and backfill are Open
// Question 2 and are deliberately not asserted.
describe('hire refusals and success (RA-023)', () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState(), true)
    useResearchStore.setState({
      done: [],
      labs: { ballistics: null, cybernetics: null, control: null },
      lastSyncT: null,
    })
  })

  // Frees one roster place by losing `opId` on a debrief.
  function lose(opId: string) {
    useCampaignStore.getState().reportMission('m01', outcome({ casualties: 1, deadIds: [opId] }), 0)
  }

  function snapshot() {
    const c = useCampaignStore.getState()
    return {
      credits: useAppStore.getState().credits,
      operatives: c.operatives,
      roster: c.roster,
      candidates: c.candidates,
    }
  }

  it('living 8: hire is refused, living stays 8, Credits unchanged (AC 30)', () => {
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: candidate.cost * 4 })
    expect(useCampaignStore.getState().operatives).toHaveLength(ROSTER_CAP)
    const before = snapshot()

    useAppStore.getState().hireOperative(candidate.id)

    expect(snapshot()).toEqual(before)
    expect(useCampaignStore.getState().operatives).toHaveLength(8)
    expect(useAppStore.getState().credits).toBe(candidate.cost * 4)
  })

  it('Credits 1 below the hire cost: roster unchanged and nothing debited (AC 31)', () => {
    lose('op1')
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: candidate.cost - 1 })
    const before = snapshot()

    useAppStore.getState().hireOperative(candidate.id)

    expect(snapshot()).toEqual(before)
    expect(useCampaignStore.getState().operatives).toHaveLength(7)
    expect(useAppStore.getState().credits).toBe(candidate.cost - 1)
  })

  it('Credits 0: roster unchanged and Credits stay 0, never negative (AC 31)', () => {
    lose('op1')
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: 0 })
    const before = snapshot()

    useAppStore.getState().hireOperative(candidate.id)

    expect(snapshot()).toEqual(before)
    expect(useAppStore.getState().credits).toBe(0)
  })

  it('living 7, success: living +1, the hire is Ready with 4 unpinned bays on current issue (AC 32)', () => {
    useResearchStore.setState({ done: ['c-interface', 'k-sensor', 'c-synaptic', 'k-targeting'] })
    lose('op1')
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: candidate.cost + 500 })

    useAppStore.getState().hireOperative(candidate.id)

    const c = useCampaignStore.getState()
    expect(c.operatives).toHaveLength(8)
    expect(c.operatives.some((o) => o.id === candidate.id)).toBe(true)
    expect(c.roster[candidate.id]).toEqual({ status: 'READY', recoverAtT: null, xp: 0, pins: {} })
    const done = useResearchStore.getState().done
    const bays = wornAugs(done, c.roster[candidate.id].pins)
    // Current issue for this done set: newest per bay, LEGS still stock.
    expect(bays.map((b) => [b.slot, b.node?.id ?? null, b.pinned])).toEqual([
      ['NEURAL', 'k-sensor', false],
      ['CHEST', 'c-synaptic', false],
      ['ARMS', 'k-targeting', false],
      ['LEGS', null, false],
    ])
    expect(useAppStore.getState().credits).toBe(500)
  })

  it('Credits exactly equal to the hire cost: hire succeeds and Credits reach 0 (edge case)', () => {
    lose('op1')
    const candidate = useCampaignStore.getState().candidates[0]
    useAppStore.setState({ credits: candidate.cost })

    useAppStore.getState().hireOperative(candidate.id)

    expect(useCampaignStore.getState().operatives).toHaveLength(8)
    expect(useCampaignStore.getState().roster[candidate.id]?.status).toBe('READY')
    expect(useAppStore.getState().credits).toBe(0)
  })

  it('7 living incl. an Assault + an Assault candidate: 8 living, both Assault ids, hired id leaves the offers (AC 33)', () => {
    lose('op8')
    const living = useCampaignStore.getState().operatives
    expect(living).toHaveLength(7)
    expect(useCampaignStore.getState().campaignFailed).toBe(false)
    const incumbent = living.find((o) => o.role === 'assault')!
    expect(incumbent).toBeDefined()

    const base = useCampaignStore.getState().candidates[0]
    const assault = { ...base, id: base.id + '-assault', role: 'assault' as const, weapon: 'assault' as const }
    expect(living.some((o) => o.id === assault.id)).toBe(false)
    const others = useCampaignStore.getState().candidates.slice(1).map((o) => o.id)
    expect(others).toHaveLength(2)
    useCampaignStore.setState({
      candidates: [assault, ...useCampaignStore.getState().candidates.slice(1)],
    })
    useAppStore.setState({ credits: assault.cost })

    useAppStore.getState().hireOperative(assault.id)

    const c = useCampaignStore.getState()
    expect(c.operatives).toHaveLength(8)
    const ids = c.operatives.map((o) => o.id)
    expect(ids).toContain(incumbent.id)
    expect(ids).toContain(assault.id)
    expect(c.operatives.filter((o) => o.role === 'assault').map((o) => o.id)).toEqual(
      expect.arrayContaining([incumbent.id, assault.id]),
    )
    expect(c.candidates.some((o) => o.id === assault.id)).toBe(false)
    // The two offers not hired are still on the market.
    for (const id of others) expect(c.candidates.map((o) => o.id)).toContain(id)
  })
})
