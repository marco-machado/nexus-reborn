import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settleOutcome, useAppStore, type MissionOutcome } from './appStore'
import * as campaignModule from './campaignStore'
import {
  INJURY_HP_FRAC,
  INJURY_RECOVERY_MAX,
  INJURY_RECOVERY_MIN,
  initialCampaignData,
  injuryRecoverySec,
  isCampaignFailed,
  liveOperativeById,
  missionLocked,
  useCampaignStore,
} from './campaignStore'
import { applyDebrief } from './debrief'
import { startNewOperation, type SaveStorage } from './save'
import { useWorldStore } from './worldStore'
import { ROSTER, missionById } from '../game/data'
import { canDeploy } from '../game/deployGate'
import { emptyLoadout } from '../game/mass'
import { CANDIDATE_POOL, CANDIDATE_REFRESH_SEC, ROSTER_CAP } from '../game/recruits'

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
      kia: [{ id: 'op1', codename: 'MARA' }],
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

  it('focusing a dossier without an assign action leaves the assigned set unchanged (AC 5)', () => {
    const before = [...useAppStore.getState().squad]
    // What the dossier focus reads: live operative lookups and roster entries.
    for (const o of useCampaignStore.getState().operatives) {
      liveOperativeById(o.id)
      void useCampaignStore.getState().roster[o.id]
    }
    expect(useAppStore.getState().squad).toEqual(before)
    // The store exposes no focus action that could write the squad.
    expect(Object.keys(useAppStore.getState()).some((k) => /focus/i.test(k))).toBe(false)
  })

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
    useAppStore.setState({ squad: ['op1', 'op2', 'op3', 'op4'] })
    useAppStore.getState().toggleOperative('op6')
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op4'])
  })

  it('never assigns the same operative twice (AC 75)', () => {
    useAppStore.getState().toggleOperative('op6')
    useAppStore.getState().toggleOperative('op6')
    useAppStore.getState().toggleOperative('op6')
    const squad = useAppStore.getState().squad
    expect(squad.filter((id) => id === 'op6')).toHaveLength(1)
    expect(new Set(squad).size).toBe(squad.length)
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
    const hire = useCampaignStore.getState().candidates[0]
    useCampaignStore.getState().reportMission(
      'm01',
      outcome({ casualties: 1, deadIds: ['op1'], survivorHp: { op2: 0.1 } }),
      9000,
    )
    expect(useCampaignStore.getState().acceptHire(hire.id)).toBe(true)
    useCampaignStore.getState().sync(9000 + 200 * HOUR)
    const lived = useCampaignStore.getState()
    expect(lived.roster.op1).toBeUndefined()
    expect(lived.roster[hire.id]).toBeDefined()
    expect(lived.roster[RAVEN].status).toBe('READY')

    startNewOperation(memoryStorage())
    expectFreshRoster()
    const state = useCampaignStore.getState()
    expect(state.roster[hire.id]).toBeUndefined()
    expect(state.roster[RAVEN].recoverAtT).toBe(86400)
    expect(state.lastReport).toBeNull()
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
    expect(state.lastReport?.kia).toEqual([{ id: 'op1', codename: 'MARA' }])
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
    const D = injuryRecoverySec(f)
    expect(state.roster.op1.status).toBe('INJURED')
    expect(state.roster.op1.recoverAtT).toBe(T0 + D)
    expect(state.lastReport?.injured).toEqual([{ id: 'op1', codename: 'MARA', downtimeSec: D }])
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
    useAppStore.getState().toggleOperative('op1')
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
    expect(Object.keys(useAppStore.getState().outcome!.survivorHp)).toEqual(['op1', 'op3'])
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
    expect(state.lastReport?.kia).toEqual([{ id: 'op2', codename: 'GHOST' }])
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
    debrief({ won: true, reward: 85000, casualties: 1, deadIds: ['op2'], survivorHp: { op1: 1, op3: 1 } })
    const state = useCampaignStore.getState()
    expect(state.lastReport?.xp.map((x) => x.id)).toEqual(['op1', 'op3'])
    expect(state.lastReport?.xp.some((x) => x.id === 'op2')).toBe(false)
    expect(state.roster.op2).toBeUndefined()
    expect(state.roster.op1.xp).toBe(1)
  })

  it('World Network reads the kia names only and never queries the live Roster (Edge Cases)', () => {
    const spy = vi.spyOn(useCampaignStore, 'getState')
    useWorldStore.getState().applyMissionResult('m01', outcome({ won: false, reward: 0, deadIds: ['op2'] }), ['GHOST'])
    expect(spy).not.toHaveBeenCalled()
    const events = kiaEvents()
    expect(events).toHaveLength(1)
    expect(events[0].text).toContain('GHOST')
    // Every other roster codename stays out of the feed line.
    for (const op of ROSTER.filter((o) => o.id !== 'op2')) {
      expect(events[0].text).not.toContain(op.codename)
    }
  })
})
