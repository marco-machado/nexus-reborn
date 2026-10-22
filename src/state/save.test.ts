import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyOverrides } from '../game/bindings'
import { DEFAULT_SQUAD, MISSIONS, ROSTER, missionById } from '../game/data'
import { CANDIDATE_REFRESH_SEC, INITIAL_RECRUIT_RNG } from '../game/recruits'
import {
  CONTRACT_MIN_SEC,
  CONTRACT_TARGET,
  INITIAL_CONTRACT_RNG,
} from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import {
  PRESSURE_INTERVAL_SEC,
  TAX_INTERVAL_SEC,
} from '../game/influence'
import { nodeById } from '../game/research'
import { settleOutcome, useAppStore } from './appStore'
import { applyDebrief } from './debrief'
import { initialCampaignData, missionLocked, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import {
  SAVE_KEY,
  captureSave,
  classifyWriteFailure,
  continueOperation,
  hydrateSave,
  inspectSave,
  loadCampaignAtBoot,
  menuSaveStatus,
  readSave,
  startAutosave,
  startNewOperation,
  validateSave,
  writeSave,
} from './save'
import type { SaveStorage, SaveV10 } from './save'
import { pressNewOperation } from '../ui/newOperationArm'
import { SETTINGS_KEY, defaultSettings, initSettings, useSettingsStore } from './settingsStore'
import { useTutorialStore } from './tutorialStore'
import { useSaveStatusStore } from './saveStatusStore'
import {
  UNFILED_LINE,
  WRITE_FAILED_LINE,
  debriefFilingLine,
  screenWriteFailureLine,
} from '../ui/filingStatus'
import { freezeDeploy } from './deployFreeze'
import { useMissionStore } from './missionStore'
import { TELEMETRY_KEY, aggregate, loadRecords, recordAbort } from './telemetry'
import {
  INITIAL_NEXT_CONTRACT_T,
  INITIAL_WORLD_RNG,
  TIME_SCALE,
  initialMarket,
  resolveMission,
  useWorldStore,
} from './worldStore'
import type { WorldEvent } from './worldStore'

class MemoryStorage implements SaveStorage {
  data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }
}

let storage: MemoryStorage
let stopAutosave: (() => void) | null = null

beforeEach(() => {
  storage = new MemoryStorage()
  startNewOperation(storage)
})

afterEach(() => {
  stopAutosave?.()
  stopAutosave = null
  vi.useRealTimers()
})

// A v10 blob without the Screen-held selected contract, as a real v9 save held.
function downgradeToV9(save: SaveV10): Record<string, unknown> {
  const blob = structuredClone(save) as unknown as Record<string, unknown>
  blob.version = 9
  delete (blob.app as Record<string, unknown>).missionId
  return blob
}

// A v9 blob with the trickle cursor, as a real v8 save held.
function downgradeToV8(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV9(save)
  blob.version = 8
  const world = blob.world as Record<string, unknown>
  world.nextTrickleT = world.nextTaxT
  delete world.nextTaxT
  return blob
}

// A v8 blob without bay pins, as a real v7 save held.
function downgradeToV7(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV8(save)
  blob.version = 7
  const campaign = blob.campaign as Record<string, unknown>
  const roster = campaign.roster as Record<string, Record<string, unknown>>
  for (const entry of Object.values(roster)) delete entry.pins
  return blob
}

// A v7 blob without campaignFailed or roster XP, as a real v6 save held.
function downgradeToV6(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV7(save)
  blob.version = 6
  const campaign = blob.campaign as Record<string, unknown>
  delete campaign.campaignFailed
  const roster = campaign.roster as Record<string, Record<string, unknown>>
  for (const entry of Object.values(roster)) delete entry.xp
  return blob
}

// A v6 blob without the tutorial section, as a real v5 save held.
function downgradeToV5(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV6(save)
  blob.version = 5
  delete blob.tutorial
  return blob
}

// A v5 blob without the influence economy or unrest pressure, as a real v4
// save held: no world influence fields and no expedited flag on contracts.
function downgradeToV4(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV5(save)
  blob.version = 4
  const world = blob.world as Record<string, unknown>
  delete world.influence
  delete world.nextTrickleT
  delete world.nextTaxT
  delete world.spends
  delete world.cooldowns
  delete world.crisis
  delete world.pressure
  world.contracts = (world.contracts as Record<string, unknown>[]).map((c) => {
    const copy = { ...c }
    delete copy.expedited
    return copy
  })
  return blob
}

// A v4 blob without the generated contract market, as a real v3 save held.
function downgradeToV3(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV4(save)
  blob.version = 3
  const world = blob.world as Record<string, unknown>
  delete world.contracts
  delete world.contractRngState
  delete world.nextContractT
  return blob
}

// Older blobs never carried the live roster: strip the v3 campaign fields so
// the synthetic downgrade matches what a real v1/v2 save held.
function downgradeToV2(save: SaveV10): Record<string, unknown> {
  const blob = downgradeToV3(save)
  blob.version = 2
  const campaign = blob.campaign as Record<string, unknown>
  delete campaign.operatives
  delete campaign.candidates
  delete campaign.recruitRngState
  delete campaign.nextCandidateT
  return blob
}

describe('save validation', () => {
  it('accepts a captured V3 campaign and rejects unknown ids', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const invalid = structuredClone(save) as SaveV10
    invalid.campaign.contractsWon = ['unknown']
    expect(validateSave(invalid)).toBe(false)
  })

  it('rejects roster tampering: unknown squad ids, roster/operative mismatch', () => {
    const save = captureSave()

    const badSquad = structuredClone(save) as SaveV10
    badSquad.app.squad = ['op99']
    expect(validateSave(badSquad)).toBe(false)

    const badRoster = structuredClone(save) as SaveV10
    delete badRoster.campaign.roster.op1
    expect(validateSave(badRoster)).toBe(false)

    const badCandidate = structuredClone(save) as SaveV10
    badCandidate.campaign.candidates[0].cost = 1
    expect(validateSave(badCandidate)).toBe(false)
  })

  it('accepts a fully wiped roster so a lost campaign can rebuild', () => {
    const wiped = structuredClone(captureSave()) as SaveV10
    wiped.campaign.operatives = []
    wiped.campaign.roster = {}
    wiped.app.squad = []
    wiped.app.loadout = {}
    expect(validateSave(wiped)).toBe(true)
  })

  it('rejects malformed loadouts: unknown ids, wrong lengths, unknown items', () => {
    const save = captureSave()

    const badOp = structuredClone(save) as SaveV10
    badOp.app.loadout = { op99: ['med', null] } as SaveV10['app']['loadout']
    expect(validateSave(badOp)).toBe(false)

    const badLength = structuredClone(save)
    ;(badLength.app.loadout as Record<string, unknown>).op1 = ['med']
    expect(validateSave(badLength)).toBe(false)

    const badItem = structuredClone(save)
    ;(badItem.app.loadout as Record<string, unknown>).op1 = ['med', 'frag']
    expect(validateSave(badItem)).toBe(false)
  })

  it('upgrades a v1 blob through the whole chain', () => {
    const v1 = downgradeToV2(captureSave())
    v1.version = 1
    delete (v1.app as Record<string, unknown>).loadout
    storage.setItem(SAVE_KEY, JSON.stringify(v1))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe(10)
    expect(loaded?.app.loadout).toEqual({})
    expect(loaded?.campaign.operatives).toEqual(initialCampaignData().operatives)
    expect(loaded?.world.contracts).toEqual([])
    expect(loaded?.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
    expect(loaded?.world.influence).toBe(0)
    expect(loaded?.world.crisis).toEqual([])
  })

  it('upgrades a v2 blob by seeding the default roster and candidate market', () => {
    useWorldStore.setState({ t: 5000 })
    const v2 = downgradeToV2(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v2))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    const seeded = initialCampaignData()
    expect(loaded.version).toBe(10)
    expect(loaded.campaign.operatives.map((o) => o.id)).toEqual(ROSTER.map((o) => o.id))
    expect(loaded.campaign.candidates).toEqual(seeded.candidates)
    expect(loaded.campaign.recruitRngState).toBe(seeded.recruitRngState)
    expect(loaded.campaign.nextCandidateT).toBe(5000 + CANDIDATE_REFRESH_SEC)
  })

  it('upgrades a v3 blob by starting an empty contract market on Strategic time', () => {
    useWorldStore.setState({ t: 9000 })
    const v3 = downgradeToV3(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v3))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    expect(loaded.world.contracts).toEqual([])
    expect(loaded.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
    expect(loaded.world.nextContractT).toBe(9000 + CONTRACT_MIN_SEC)
  })

  it('upgrades a v4 blob: zero points, unexpedited contracts, armed pressure timers', () => {
    // Two generated contracts on the clock, one sector already past the
    // pressure threshold, saved as a v4 blob.
    useWorldStore.setState({ nextEventT: 1e12, nextTaxT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    useWorldStore.setState({
      sectors: {
        ...useWorldStore.getState().sectors,
        af: { control: 30, unrest: 66 },
      },
    })
    const save = captureSave()
    expect(save.world.contracts.length).toBeGreaterThan(0)
    storage.setItem(SAVE_KEY, JSON.stringify(downgradeToV4(save)))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    expect(loaded.world.influence).toBe(0)
    expect(loaded.world.nextTaxT).toBe(loaded.world.t + TAX_INTERVAL_SEC)
    expect('nextTrickleT' in loaded.world).toBe(false)
    expect(loaded.world.spends).toEqual([])
    expect(loaded.world.cooldowns).toEqual({})
    expect(loaded.world.crisis).toEqual([])
    expect(loaded.world.pressure).toEqual({
      af: loaded.world.t + PRESSURE_INTERVAL_SEC,
    })
    expect(loaded.world.contracts.map((c) => c.expedited)).toEqual(
      save.world.contracts.map(() => false),
    )
    expect(loaded.world.contracts).toEqual(save.world.contracts)
  })

  it('upgrades a v5 blob in place with an empty tutorial history', () => {
    useTutorialStore.getState().skipTutorial()
    const v5 = downgradeToV5(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v5))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    // The pre-tutorial campaign starts the prompts from scratch.
    expect(loaded.tutorial.seen).toEqual([])
  })

  it('upgrades a v6 blob with campaignFailed false and zero XP', () => {
    const v6 = downgradeToV6(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v6))
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    expect(loaded.campaign.campaignFailed).toBe(false)
    expect(Object.values(loaded.campaign.roster).every((e) => e.xp === 0)).toBe(true)
    expect(Object.values(loaded.campaign.roster).every((e) => e.pins && Object.keys(e.pins).length === 0)).toBe(true)
  })

  it('upgrades a v7 blob with empty bay pins', () => {
    const v7 = downgradeToV7(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v7))
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    expect(Object.values(loaded.campaign.roster).every((e) => e.pins && Object.keys(e.pins).length === 0)).toBe(true)
  })

  it('upgrades a v8 blob: no trickle, Tax yield starts from the saved clock', () => {
    useWorldStore.setState({ t: 12000, influence: 4 })
    const v8 = downgradeToV8(captureSave())
    expect('nextTaxT' in (v8.world as object)).toBe(false)
    storage.setItem(SAVE_KEY, JSON.stringify(v8))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(10)
    expect(loaded.world.nextTaxT).toBe(12000 + TAX_INTERVAL_SEC)
    expect('nextTrickleT' in loaded.world).toBe(false)
    expect(loaded.world.influence).toBe(4)

    hydrateSave(loaded)
    const before = useAppStore.getState().credits
    useWorldStore.setState({
      nextEventT: 1e12,
      nextContractT: 1e12,
      t: loaded.world.nextTaxT - 1,
    })
    useWorldStore.getState().tick(1)
    expect(useWorldStore.getState().influence).toBe(4)
    expect(useAppStore.getState().credits).toBe(before + 4080)
  })

  it('rejects a blob that is both campaign-won and campaign-failed', () => {
    const save = captureSave()
    save.campaign.campaignWon = true
    save.campaign.campaignFailed = true
    save.campaign.contractsWon = ['m01', 'm02', 'm03']
    expect(validateSave(save)).toBe(false)
  })

  it('accepts an empty-roster incomplete blob that is not failed, and hydrate keeps it not failed', () => {
    const save = captureSave()
    save.campaign.operatives = []
    save.campaign.roster = {}
    save.app.squad = []
    save.campaign.contractsWon = ['m01']
    save.campaign.campaignWon = false
    save.campaign.campaignFailed = false
    expect(validateSave(save)).toBe(true)
    hydrateSave(save)
    const state = useCampaignStore.getState()
    expect(state.operatives).toEqual([])
    expect(state.campaignFailed).toBe(false)
    expect(state.campaignWon).toBe(false)
  })

  it('hydrate restores stored flags without re-deriving fail from the roster', () => {
    const save = captureSave()
    save.campaign.campaignFailed = true
    save.campaign.campaignWon = false
    expect(save.campaign.operatives.length).toBeGreaterThan(0)
    expect(validateSave(save)).toBe(true)
    hydrateSave(save)
    expect(useCampaignStore.getState().campaignFailed).toBe(true)
    expect(useCampaignStore.getState().operatives.length).toBeGreaterThan(0)
  })

  it('rejects a non-failed blob whose campaignWon disagrees with the authored wins', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)
    // Positive pair: all three authored wins with campaignWon true is valid.
    const complete = structuredClone(save)
    complete.campaign.contractsWon = ['m01', 'm02', 'm03']
    complete.campaign.campaignWon = true
    complete.campaign.campaignFailed = false
    expect(validateSave(complete)).toBe(true)
    save.campaign.contractsWon = ['m01']
    save.campaign.campaignWon = true
    save.campaign.campaignFailed = false
    expect(validateSave(save)).toBe(false)
  })

  it('a completed campaign with an empty roster round-trips complete and not failed', () => {
    for (const id of ['m01', 'm02', 'm03']) {
      useCampaignStore.getState().reportMission(
        id,
        settleOutcome({
          applyKey: 1, won: true, kills: 0, casualties: 0, timeSec: 10, civiliansHit: 1,
          reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false,
        }),
        0,
      )
    }
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 2, won: false, kills: 0, casualties: ids.length, timeSec: 10, civiliansHit: 0,
        reward: 0, bonus: 0, deadIds: ids, survivorHp: {}, quietReplay: false,
      }),
      0,
    )
    useAppStore.setState({ squad: [] })
    expect(writeSave(storage)).toBe(true)
    startNewOperation()
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)
    const state = useCampaignStore.getState()
    expect(state.operatives).toEqual([])
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
  })

  it('rejects tampered tutorial history', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const badId = structuredClone(save) as SaveV10
    badId.tutorial.seen = ['tut-select', 'not-a-real-id']
    expect(validateSave(badId)).toBe(false)

    const duplicate = structuredClone(save) as SaveV10
    duplicate.tutorial.seen = ['tut-select', 'tut-select']
    expect(validateSave(duplicate)).toBe(false)

    const missing = structuredClone(save) as unknown as Record<string, unknown>
    delete missing.tutorial
    expect(validateSave(missing)).toBe(false)

    const good = structuredClone(save) as SaveV10
    good.tutorial.seen = ['tut-select', 'hint-lowhp', 'hint-worldmap']
    expect(validateSave(good)).toBe(true)
  })

  it('rejects tampered generated contracts', () => {
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    const save = captureSave()
    expect(save.world.contracts.length).toBeGreaterThan(0)
    expect(validateSave(save)).toBe(true)

    const badReward = structuredClone(save) as SaveV10
    badReward.world.contracts[0].reward = 1
    expect(validateSave(badReward)).toBe(false)

    const badClient = structuredClone(save) as SaveV10
    ;(badClient.world.contracts[0] as unknown as Record<string, unknown>).client = 'sable'
    expect(validateSave(badClient)).toBe(false)
  })

  it('rejects tampered influence, spends, cooldowns, crisis, and pressure', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const badPoints = structuredClone(save) as SaveV10
    badPoints.world.influence = -3
    expect(validateSave(badPoints)).toBe(false)

    const badSpend = structuredClone(save) as SaveV10
    badSpend.world.spends = [
      { action: 'stabilize', sector: 'eu', nextT: 100, remaining: 99 },
    ]
    expect(validateSave(badSpend)).toBe(false)

    const badCooldown = structuredClone(save) as SaveV10
    badCooldown.world.cooldowns = { 'eu:bribe': 100 }
    expect(validateSave(badCooldown)).toBe(false)

    const badCrisis = structuredClone(save) as SaveV10
    badCrisis.world.crisis = ['an' as SaveV10['world']['crisis'][number]]
    expect(validateSave(badCrisis)).toBe(false)

    const badPressure = structuredClone(save) as SaveV10
    badPressure.world.pressure = { zz: 100 }
    expect(validateSave(badPressure)).toBe(false)

    const goodSpend = structuredClone(save) as SaveV10
    goodSpend.world.influence = 14
    goodSpend.world.spends = [
      { action: 'lobby', sector: 'sa', nextT: 6400, remaining: 3 },
    ]
    goodSpend.world.cooldowns = { 'sa:lobby': 90000 }
    goodSpend.world.crisis = ['af']
    goodSpend.world.pressure = { af: 5000 }
    expect(validateSave(goodSpend)).toBe(true)
  })

  it('discards malformed JSON and schema mismatches from storage', () => {
    storage.setItem(SAVE_KEY, '{bad-json')
    expect(readSave(storage)).toBeNull()
    expect(storage.getItem(SAVE_KEY)).toBeNull()

    storage.setItem(SAVE_KEY, JSON.stringify({ version: 2 }))
    expect(readSave(storage)).toBeNull()
    expect(storage.getItem(SAVE_KEY)).toBeNull()
  })
})

describe('review pin persistence', () => {
  it('the captured world carries no review key and the blob stays valid', () => {
    useWorldStore.setState({ review: 500 })
    const save = captureSave()
    expect('review' in save.world).toBe(false)
    expect(JSON.stringify(save)).not.toContain('"review"')
    expect(validateSave(save)).toBe(true)
  })

  it('hydrate forces review to null', () => {
    const save = captureSave()
    useWorldStore.setState({ review: 500 })
    hydrateSave(save)
    expect(useWorldStore.getState().review).toBeNull()
  })

  it('New Operation forces review to null', () => {
    useWorldStore.setState({ review: 500 })
    startNewOperation(null)
    expect(useWorldStore.getState().review).toBeNull()
  })
})

describe('save round trip', () => {
  it('restores all four stores while resetting transient view and outcome state', () => {
    useAppStore.setState({
      credits: 222333,
      squad: ['op1', 'op3', 'op6'],
      loadout: { op1: ['med', 'cell'], op3: [null, 'med'] },
    })
    useWorldStore.setState({ t: 1000, speed: 4, paused: true, selected: 'as', review: 500 })
    useWorldStore.getState().applyMissionResult('m01', settleOutcome({
      applyKey: 1,
      won: true,
      kills: 7,
      casualties: 0,
      timeSec: 300,
      civiliansHit: 1,
      reward: 85000,
      bonus: 0,
      deadIds: [],
      survivorHp: {},
      quietReplay: false,
    }))
    useResearchStore.getState().start(nodeById('b-propellants'), 1000)
    useCampaignStore.setState({
      intelLevel: 2,
      intelProgress: 35,
      contractsWon: ['m01'],
      campaignWon: false,
    })
    useWorldStore.setState({
      influence: 14,
      spends: [{ action: 'lobby', sector: 'sa', nextT: 6400, remaining: 3 }],
      cooldowns: { 'sa:lobby': 90000 },
      crisis: ['af'],
      pressure: { af: 5000 },
    })

    const expected = captureSave()
    expect(writeSave(storage)).toBe(true)

    startNewOperation()
    useAppStore.setState({ credits: 1, squad: [], loadout: {} })
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)

    const app = useAppStore.getState()
    const world = useWorldStore.getState()
    const research = useResearchStore.getState()
    const campaign = useCampaignStore.getState()
    expect(app).toMatchObject({
      phase: 'menu',
      missionId: null,
      credits: expected.app.credits,
      squad: expected.app.squad,
      loadout: { op1: ['med', 'cell'], op3: [null, 'med'] },
      outcome: null,
      deploySerial: 0,
      lastAppliedKey: 0,
    })
    expect(world).toMatchObject({
      t: expected.world.t,
      speed: expected.world.speed,
      paused: expected.world.paused,
      sectors: expected.world.sectors,
      owner: expected.world.owner,
      events: expected.world.events,
      unread: expected.world.unread,
      nextEventT: expected.world.nextEventT,
      rngState: expected.world.rngState,
      influence: 14,
      nextTaxT: expected.world.nextTaxT,
      spends: [{ action: 'lobby', sector: 'sa', nextT: 6400, remaining: 3 }],
      cooldowns: { 'sa:lobby': 90000 },
      crisis: ['af'],
      pressure: { af: 5000 },
      selected: 'eu',
      review: null,
    })
    expect(research.done).toEqual(expected.research.done)
    expect(research.labs).toEqual(expected.research.labs)
    expect(campaign).toMatchObject({
      intelLevel: expected.campaign.intelLevel,
      intelProgress: expected.campaign.intelProgress,
      operatives: expected.campaign.operatives,
      roster: expected.campaign.roster,
      candidates: expected.campaign.candidates,
      recruitRngState: expected.campaign.recruitRngState,
      nextCandidateT: expected.campaign.nextCandidateT,
      contractsWon: expected.campaign.contractsWon,
      campaignWon: expected.campaign.campaignWon,
      campaignFailed: expected.campaign.campaignFailed,
      lastReport: null,
    })
  })

  it('reproduces a lived-in roster exactly: a loss, an injury, and a hire', () => {
    // One KIA opens a bay, one survivor comes back hurt, and a candidate signs.
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 1,
        won: true,
        kills: 5,
        casualties: 1,
        timeSec: 500,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: ['op4'],
        survivorHp: { op1: 0.1, op2: 0.8, op3: 0.9 },
        quietReplay: false,
      }),
      2000,
    )
    useAppStore.setState({ squad: ['op2', 'op3'] })
    const hired = useCampaignStore.getState().candidates[1]
    useAppStore.getState().hireOperative(hired.id)

    const expected = captureSave()
    expect(validateSave(expected)).toBe(true)
    expect(writeSave(storage)).toBe(true)
    startNewOperation()

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)

    const campaign = useCampaignStore.getState()
    expect(campaign.operatives).toEqual(expected.campaign.operatives)
    expect(campaign.operatives.some((o) => o.id === 'op4')).toBe(false)
    expect(campaign.operatives.at(-1)?.id).toBe(hired.id)
    expect(campaign.roster).toEqual(expected.campaign.roster)
    expect(campaign.roster.op1.status).toBe('INJURED')
    expect(campaign.roster.op1.xp).toBe(1)
    expect(campaign.roster.op2.xp).toBe(1)
    expect(campaign.candidates).toEqual(expected.campaign.candidates)
    expect(campaign.recruitRngState).toBe(expected.campaign.recruitRngState)
    expect(campaign.nextCandidateT).toBe(expected.campaign.nextCandidateT)
    expect(useAppStore.getState().credits).toBe(expected.app.credits)
  })

  it('reloads a failed campaign as failed and not won', () => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 1,
        won: false,
        kills: 0,
        casualties: ids.length,
        timeSec: 10,
        civiliansHit: 0,
        reward: 0,
        bonus: 0,
        deadIds: ids,
        survivorHp: {},
        quietReplay: false,
      }),
      0,
    )
    useAppStore.setState({ squad: [] })
    expect(useCampaignStore.getState().campaignFailed).toBe(true)
    expect(useCampaignStore.getState().campaignWon).toBe(false)
    const expected = captureSave()
    expect(validateSave(expected)).toBe(true)
    expect(writeSave(storage)).toBe(true)
    startNewOperation()
    expect(useCampaignStore.getState().campaignFailed).toBe(false)
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)
    expect(useCampaignStore.getState().campaignFailed).toBe(true)
    expect(useCampaignStore.getState().campaignWon).toBe(false)
    expect(useCampaignStore.getState().operatives).toEqual([])
  })

  it('round-trips the tutorial seen set and gates hints across the reload', () => {
    useTutorialStore.getState().note('select')
    useTutorialStore.getState().fireHint('hint-alert')
    useTutorialStore.getState().markSeen('hint-worldmap')
    const expected = captureSave()
    expect(expected.tutorial.seen).toEqual(['tut-select', 'hint-alert', 'hint-worldmap'])
    expect(writeSave(storage)).toBe(true)

    startNewOperation()
    expect(useTutorialStore.getState().seen).toEqual([])
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)

    expect(useTutorialStore.getState().seen).toEqual(expected.tutorial.seen)
    expect(useTutorialStore.getState().hints).toEqual([])
    // The reloaded campaign still refuses a second firing.
    useTutorialStore.getState().fireHint('hint-alert')
    expect(useTutorialStore.getState().hints).toEqual([])
  })

  it('round-trips the open contract market so a reload reproduces it exactly', () => {
    // Generate two contracts on the strategic clock, then save and reload.
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    const mid = useWorldStore.getState()
    useWorldStore.setState({ t: mid.nextContractT - 1 })
    useWorldStore.getState().tick(1)
    const expected = captureSave()
    // The seeded opening offer (story 023) plus the two timed rolls.
    expect(expected.world.contracts).toHaveLength(3)
    expect(writeSave(storage)).toBe(true)

    startNewOperation()
    expect(useWorldStore.getState().contracts).toEqual(initialMarket().contracts)
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)

    const world = useWorldStore.getState()
    expect(world.contracts).toEqual(expected.world.contracts)
    expect(world.contractRngState).toBe(expected.world.contractRngState)
    expect(world.nextContractT).toBe(expected.world.nextContractT)
  })

  it('new operation clears the prior blob and restores campaign defaults', () => {
    useAppStore.setState({ credits: 999999, squad: [] })
    useCampaignStore.setState({ intelLevel: 4, intelProgress: 88, contractsWon: ['m01'] })
    useTutorialStore.getState().skipTutorial()
    expect(writeSave(storage)).toBe(true)
    expect(storage.getItem(SAVE_KEY)).not.toBeNull()

    startNewOperation(storage)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(useAppStore.getState()).toMatchObject({
      phase: 'world',
      credits: 128450,
      squad: DEFAULT_SQUAD,
      outcome: null,
    })
    expect(useCampaignStore.getState()).toMatchObject({
      intelLevel: 1,
      intelProgress: 25,
      contractsWon: [],
      campaignWon: false,
      campaignFailed: false,
    })
    expect(useWorldStore.getState()).toMatchObject({
      t: 0,
      speed: 2,
      paused: false,
    })
    expect(useResearchStore.getState().done).toEqual([])
    // The prompts return with the fresh campaign.
    expect(useTutorialStore.getState().seen).toEqual([])
  })
})

// Story 023 (TR-economy-006): New Operation seeds one Moderate offer through
// the same helper the store boots with; hydrate and the upgrade chain never
// seed, so an existing campaign keeps the market it saved.
describe('opening market offer: New Operation seeds, hydrate never does (story 023)', () => {
  it('startNewOperation opens the same seeded offer and Feed line as the store boot', () => {
    const market = initialMarket()
    const world = useWorldStore.getState()
    expect(world.contracts).toHaveLength(1)
    expect(world.contracts).toEqual(market.contracts)
    expect(world.contractRngState).toBe(market.contractRngState)
    expect(world.nextContractT).toBe(INITIAL_NEXT_CONTRACT_T)
    expect(world.events).toEqual(market.events)
    expect(world.unread).toBe(market.unread)
    expect(world.contracts[0].threat).toBe('MODERATE')
    expect(world.events.at(-1)?.contract?.id).toBe(world.contracts[0].id)
    // A second New Operation lands on the identical offer.
    startNewOperation(storage)
    expect(useWorldStore.getState().contracts).toEqual(market.contracts)
  })

  it('a v10 blob with its own market hydrates with no offer added', () => {
    // Take the market away from the opening state, save it, and reload.
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    const own = captureSave()
    expect(own.world.contracts).toHaveLength(2)
    expect(writeSave(storage)).toBe(true)

    // Reset in memory only (no storage: the blob stays), then reload it.
    startNewOperation()
    expect(useWorldStore.getState().contracts).toHaveLength(1)
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    hydrateSave(loaded)
    const world = useWorldStore.getState()
    expect(world.contracts).toEqual(own.world.contracts)
    expect(world.contractRngState).toBe(own.world.contractRngState)
    expect(world.events).toEqual(own.world.events)

    // An emptied market stays empty on reload: nothing re-seeds.
    useWorldStore.setState({ contracts: [] })
    const emptied = captureSave()
    storage.setItem(SAVE_KEY, JSON.stringify(emptied))
    startNewOperation()
    expect(useWorldStore.getState().contracts).toHaveLength(1)
    const reloaded = readSave(storage)
    if (!reloaded) throw new Error('blob did not read back')
    hydrateSave(reloaded)
    expect(useWorldStore.getState().contracts).toEqual([])
  })

  it('a v3 blob upgrades to an empty market, unseeded', () => {
    useWorldStore.setState({ t: 9000 })
    const v3 = downgradeToV3(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v3))
    const loaded = readSave(storage)
    expect(loaded?.world.contracts).toEqual([])
    expect(loaded?.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
    if (!loaded) return
    hydrateSave(loaded)
    expect(useWorldStore.getState().contracts).toEqual([])
  })
})

describe('autosave boundary', () => {
  it('coalesces continuous strategy changes and suspends tactical/debrief writes', () => {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    useWorldStore.setState({ t: 10 })
    useWorldStore.setState({ t: 20 })
    useWorldStore.setState({ t: 30 })
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    vi.advanceTimersByTime(500)
    expect(readSave(storage)?.world.t).toBe(30)

    const strategyBlob = storage.getItem(SAVE_KEY)
    useAppStore.setState({ phase: 'mission' })
    useWorldStore.setState({ t: 999 })
    vi.advanceTimersByTime(1000)
    expect(storage.getItem(SAVE_KEY)).toBe(strategyBlob)

    useAppStore.setState({ phase: 'debrief' })
    useCampaignStore.setState({ intelProgress: 99 })
    vi.advanceTimersByTime(1000)
    expect(storage.getItem(SAVE_KEY)).toBe(strategyBlob)

    useAppStore.setState({ phase: 'world' })
    vi.advanceTimersByTime(500)
    expect(readSave(storage)).toMatchObject({
      world: { t: 999 },
      campaign: { intelProgress: 99 },
    })
  })
})

// PV-001 (TR-persistence-001): the Menu reads one exported status, never copy.
describe('menu continue: never-started vs valid save', () => {
  // A lived-in campaign, as if the player reached a Screen and autosave ran.
  function playToScreen(): void {
    useAppStore.setState({ phase: 'world', credits: 123456, squad: ['op1', 'op3'] })
    useWorldStore.setState({ t: 4200, influence: 9 })
    useResearchStore.getState().start(nodeById('b-propellants'), 4200)
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 40, contractsWon: ['m01'] })
  }

  it('clean origin: Continue absent, state never-started (no invalid reason), New Operation offered', () => {
    const clean = new MemoryStorage()
    expect(loadCampaignAtBoot(clean)).toBe('never-started')
    expect(inspectSave(clean)).toEqual({ status: 'never-started', save: null })
    const status = menuSaveStatus(clean)
    expect(status).toBe('never-started')
    expect(status).not.toBe('invalid')
    // Continue is offered iff the status is valid; New Operation is always on.
    expect(status === 'valid').toBe(false)
  })

  it('unavailable storage reads as never-started, not invalid', () => {
    expect(loadCampaignAtBoot(null)).toBe('never-started')
    expect(menuSaveStatus(null)).toBe('never-started')
  })

  it('valid save: reload offers Continue, which opens the World Network for that campaign', () => {
    playToScreen()
    const expected = captureSave()
    expect(writeSave(storage)).toBe(true)

    // Reload: memory goes back to defaults, storage keeps the blob.
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(menuSaveStatus(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')

    continueOperation()
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.phase).not.toBe('brief')
    expect(app.phase).not.toBe('team')
    expect(app.phase).not.toBe('mission')
    // That campaign, not a new one.
    expect(captureSave()).toEqual(expected)
    expect(app.credits).toBe(123456)
  })

  it('Continue restores no mission id and no Debrief outcome; strategy, roster and labs come from the save', () => {
    playToScreen()
    const expected = captureSave()
    expect(writeSave(storage)).toBe(true)

    // After the save, the player went on to a mission and reached Debrief.
    useAppStore.setState({
      phase: 'debrief',
      missionId: 'm02',
      outcome: settleOutcome({
        applyKey: 3,
        won: true,
        kills: 4,
        casualties: 0,
        timeSec: 200,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      }),
    })

    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState()).toMatchObject({ phase: 'menu', missionId: null, outcome: null })

    continueOperation()
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.missionId).toBeNull()
    expect(app.outcome).toBeNull()
    const restored = captureSave()
    expect(restored.world).toEqual(expected.world)
    expect(restored.campaign).toEqual(expected.campaign)
    expect(restored.research).toEqual(expected.research)
    expect(restored.app).toEqual(expected.app)
  })

  it('a dropped bad blob stays distinct from never-started until New Operation', () => {
    storage.setItem(SAVE_KEY, '{not json')
    expect(loadCampaignAtBoot(storage)).toBe('invalid')
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(menuSaveStatus(storage)).toBe('invalid')
    startNewOperation(storage)
    expect(menuSaveStatus(storage)).toBe('never-started')
  })
})

// PV-008 (TR-persistence-006): a bad campaign blob is dropped whole.
describe('invalid or unreadable campaign blob: drop all-or-nothing', () => {
  // A lived-in campaign whose strategy, roster and labs all differ from the
  // New Operation desk, so any half-load would show in the stores.
  function livedInSave(): SaveV10 {
    useAppStore.setState({ phase: 'world', credits: 98765, squad: ['op1', 'op3'] })
    useWorldStore.setState({ t: 5100, influence: 7 })
    useResearchStore.getState().start(nodeById('b-propellants'), 5100)
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 55, contractsWon: ['m01'] })
    const roster = structuredClone(useCampaignStore.getState().roster)
    const firstId = Object.keys(roster)[0]
    roster[firstId] = { ...roster[firstId], xp: 40 }
    useCampaignStore.setState({ roster })
    return captureSave()
  }

  // An origin reload: memory starts at the New Operation desk on the Menu,
  // storage keeps whatever blob was on file.
  function reloadMemory(): void {
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
  }

  // The New Operation desk, captured from a clean origin.
  function newOperationFixture(): SaveV10 {
    startNewOperation(new MemoryStorage())
    return captureSave()
  }

  function expectNoHalfLoad(fixture: SaveV10): void {
    const now = captureSave()
    expect(now.world).toEqual(fixture.world)
    expect(now.campaign).toEqual(fixture.campaign)
    expect(now.research).toEqual(fixture.research)
    expect(now.app).toEqual(fixture.app)
    expect(now.tutorial).toEqual(fixture.tutorial)
  }

  it('non-JSON blob injected by the harness: Continue absent, state invalid, distinct from never-started', () => {
    livedInSave()
    expect(writeSave(storage)).toBe(true)
    // Harness inject: overwrite whatever key the module writes to.
    storage.setItem(SAVE_KEY, 'not a campaign {{{')

    reloadMemory()
    const status = loadCampaignAtBoot(storage)
    expect(status).toBe('invalid')
    expect(status).not.toBe('never-started')
    expect(menuSaveStatus(storage)).toBe('invalid')
    // Continue is offered iff the status is valid.
    expect(menuSaveStatus(storage) === 'valid').toBe(false)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(useAppStore.getState().phase).toBe('menu')

    // A clean origin reads differently from the dropped blob.
    expect(menuSaveStatus(new MemoryStorage())).toBe('invalid')
    startNewOperation(new MemoryStorage())
    expect(menuSaveStatus(new MemoryStorage())).toBe('never-started')
  })

  it('schema-failing JSON: Continue absent, no Screen entered, state invalid, distinct from never-started', () => {
    const save = livedInSave()
    const blob = structuredClone(save) as unknown as Record<string, unknown>
    // Valid JSON, wrong schema: an unknown tutorial id in the last section.
    ;(blob.tutorial as Record<string, unknown>).seen = ['not-a-hint']
    storage.setItem(SAVE_KEY, JSON.stringify(blob))

    reloadMemory()
    expect(loadCampaignAtBoot(storage)).toBe('invalid')
    expect(menuSaveStatus(storage)).toBe('invalid')
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    // Hydrate never ran: the director is still on the Menu, no Screen entered.
    const app = useAppStore.getState()
    expect(app.phase).toBe('menu')
    for (const screen of ['world', 'research', 'brief', 'team'] as const) {
      expect(app.phase).not.toBe(screen)
    }
  })

  it('no half-load: strategy, roster and laboratories stay at the New Operation defaults', () => {
    const fixture = newOperationFixture()
    const save = livedInSave()
    expect(save.app.credits).not.toBe(fixture.app.credits)
    expect(save.research.labs).not.toEqual(fixture.research.labs)

    // Every section is lived-in and valid except one late field, so a loader
    // that applied sections as it validated them would leave a trace.
    const bad = structuredClone(save) as unknown as Record<string, unknown>
    ;(bad.tutorial as Record<string, unknown>).seen = ['not-a-hint']
    const injects = ['{"version": 9, "world": ', JSON.stringify(bad)]

    for (const raw of injects) {
      storage.setItem(SAVE_KEY, raw)
      reloadMemory()
      expect(loadCampaignAtBoot(storage)).toBe('invalid')
      expect(useAppStore.getState().phase).toBe('menu')
      // The director starts from the Menu: New Operation is the only path.
      startNewOperation(storage)
      expectNoHalfLoad(fixture)
    }

    // Before New Operation, the reloaded Menu memory carries nothing either.
    storage.setItem(SAVE_KEY, JSON.stringify(bad))
    reloadMemory()
    loadCampaignAtBoot(storage)
    const now = captureSave()
    expect(now.world).toEqual(fixture.world)
    expect(now.campaign).toEqual(fixture.campaign)
    expect(now.research).toEqual(fixture.research)
    expect(now.app.credits).toBe(fixture.app.credits)
    expect(now.app.squad).toEqual(fixture.app.squad)
  })

  it('non-finite or negative Credits drop the whole blob rather than clamping (ADR-0013)', () => {
    const fixture = newOperationFixture()
    const save = livedInSave()
    const json = JSON.stringify(save)
    const marker = `"credits":${save.app.credits}`
    expect(json).toContain(marker)
    // 1e999 parses to Infinity: valid JSON, non-finite Credits.
    for (const credits of ['1e999', '-1', '-0.5']) {
      storage.setItem(SAVE_KEY, json.replace(marker, `"credits":${credits}`))
      reloadMemory()
      expect(loadCampaignAtBoot(storage)).toBe('invalid')
      expect(storage.getItem(SAVE_KEY)).toBeNull()
      expect(useAppStore.getState().credits).toBe(fixture.app.credits)
      expect(captureSave().research).toEqual(fixture.research)
    }
  })
})

// PV-010 (TR-persistence-006): contradictory campaign flags make the blob
// invalid, so boot drops it like any other bad blob (ADR-0011, ADR-0020).
describe('contradictory campaign flags drop the blob', () => {
  // A valid blob on file, then its flags rewritten before an origin reload.
  function reloadWithFlags(flags: {
    contractsWon: string[]
    campaignWon: boolean
    campaignFailed: boolean
  }): void {
    useAppStore.setState({ phase: 'world', credits: 4321 })
    const save = captureSave()
    expect(validateSave(save)).toBe(true)
    Object.assign(save.campaign, flags)
    storage.setItem(SAVE_KEY, JSON.stringify(save))
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
  }

  function expectDroppedToInvalidMenu(): void {
    const status = loadCampaignAtBoot(storage)
    expect(status).toBe('invalid')
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    const menu = menuSaveStatus(storage)
    expect(menu).toBe('invalid')
    // Continue is offered iff the Menu state is valid.
    expect(menu === 'valid').toBe(false)
    expect(useAppStore.getState().phase).toBe('menu')
    // Distinct from never-started: a clean origin boots to never-started.
    expect(menu).not.toBe('never-started')
    expect(loadCampaignAtBoot(new MemoryStorage())).toBe('never-started')
  }

  it('both campaignWon and campaignFailed true: Continue absent, Menu invalid', () => {
    reloadWithFlags({ contractsWon: ['m01', 'm02', 'm03'], campaignWon: true, campaignFailed: true })
    expectDroppedToInvalidMenu()
  })

  it('not failed, campaignWon true with fewer than three authored wins: Continue absent, Menu invalid', () => {
    for (const contractsWon of [[], ['m01'], ['m01', 'm03']]) {
      reloadWithFlags({ contractsWon, campaignWon: true, campaignFailed: false })
      expectDroppedToInvalidMenu()
    }
  })

  it('not failed, campaignWon false with all three authored wins: Continue absent, Menu invalid', () => {
    reloadWithFlags({ contractsWon: ['m01', 'm02', 'm03'], campaignWon: false, campaignFailed: false })
    expectDroppedToInvalidMenu()
  })
})

// PV-011 (TR-persistence-006): every valid flag combination survives an origin
// reload as stored. Hydrate restores the two booleans verbatim and never
// re-derives failed from a living count of 0 (ADR-0011, ADR-0020).
describe('valid flag combinations load as stored', () => {
  const ALL_AUTHORED = MISSIONS.map((m) => m.id)

  function winOutcome(applyKey: number) {
    return settleOutcome({
      applyKey, won: true, kills: 0, casualties: 0, timeSec: 10, civiliansHit: 0,
      reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false,
    })
  }

  function wipeOutcome(applyKey: number, deadIds: string[]) {
    return settleOutcome({
      applyKey, won: false, kills: 0, casualties: deadIds.length, timeSec: 10, civiliansHit: 0,
      reward: 0, bonus: 0, deadIds, survivorHp: {}, quietReplay: false,
    })
  }

  // A valid blob on file with these campaign fields, then an origin reload:
  // memory back to defaults, storage keeps the blob, boot runs on the Menu.
  function reloadWith(campaign: Partial<SaveV10['campaign']>, squad?: string[]): SaveV10 {
    useAppStore.setState({ phase: 'world', credits: 4321 })
    const save = captureSave()
    Object.assign(save.campaign, campaign)
    if (squad) save.app.squad = squad
    storage.setItem(SAVE_KEY, JSON.stringify(save))
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
    return save
  }

  function expectContinueOffered(): void {
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(storage.getItem(SAVE_KEY)).not.toBeNull()
    // Continue is offered iff the Menu state is valid.
    expect(menuSaveStatus(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')
  }

  it('failed with 0–2 authored wins: Continue present, loads as failed', () => {
    for (const contractsWon of [[], ['m01'], ['m01', 'm03']]) {
      const stored = reloadWith({ contractsWon, campaignWon: false, campaignFailed: true })
      expect(validateSave(stored)).toBe(true)
      expectContinueOffered()
      const state = useCampaignStore.getState()
      expect(state.campaignFailed).toBe(true)
      expect(state.campaignWon).toBe(false)
      expect(state.contractsWon).toEqual(contractsWon)
      continueOperation()
      expect(useAppStore.getState().phase).toBe('world')
    }
  })

  it('failed, not won, all three authored wins: Continue present, loads as failed and not won', () => {
    expect(ALL_AUTHORED).toHaveLength(3)
    const stored = reloadWith({ contractsWon: ALL_AUTHORED, campaignWon: false, campaignFailed: true })
    expect(validateSave(stored)).toBe(true)
    expectContinueOffered()
    const state = useCampaignStore.getState()
    expect(state.campaignFailed).toBe(true)
    expect(state.campaignWon).toBe(false)
    expect(state.contractsWon).toEqual(ALL_AUTHORED)
  })

  it('not failed, not won, empty roster, fewer than three wins: Continue present and still not failed', () => {
    for (const contractsWon of [[], ['m01'], ['m01', 'm02']]) {
      const stored = reloadWith(
        { contractsWon, campaignWon: false, campaignFailed: false, operatives: [], roster: {} },
        [],
      )
      expect(validateSave(stored)).toBe(true)
      expectContinueOffered()
      const state = useCampaignStore.getState()
      // Hydrate does not re-derive failed from a living count of 0.
      expect(state.operatives).toEqual([])
      expect(state.campaignFailed).toBe(false)
      expect(state.campaignWon).toBe(false)
      continueOperation()
      expect(useCampaignStore.getState().campaignFailed).toBe(false)
    }
  })

  it('complete then roster emptied: reload + Continue keeps it complete, not failed, contracts replayable', () => {
    let key = 1
    for (const id of ALL_AUTHORED) {
      useCampaignStore.getState().reportMission(id, winOutcome(key++), 0)
    }
    expect(useCampaignStore.getState().campaignWon).toBe(true)
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    expect(ids.length).toBeGreaterThan(0)
    useCampaignStore.getState().reportMission('m01', wipeOutcome(key++, ids), 0)
    useAppStore.setState({ phase: 'world', squad: [] })
    expect(useCampaignStore.getState()).toMatchObject({ campaignWon: true, campaignFailed: false })
    const expected = captureSave()
    expect(validateSave(expected)).toBe(true)
    expect(writeSave(storage)).toBe(true)

    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
    expectContinueOffered()
    continueOperation()
    expect(useAppStore.getState().phase).toBe('world')

    const state = useCampaignStore.getState()
    expect(state.operatives).toEqual([])
    expect(state.campaignWon).toBe(true)
    expect(state.campaignFailed).toBe(false)
    expect(captureSave().campaign).toEqual(expected.campaign)
    // The World Network locks authored contracts iff campaignFailed or the
    // intel gate (WorldMap.tsx): every authored contract stays selectable.
    for (const m of MISSIONS) {
      expect(state.campaignFailed || missionLocked(m, state.intelLevel)).toBe(false)
    }
  })

  it('edge: failed is never re-derived from a living count of 0 on hydrate', () => {
    const save = captureSave()
    save.campaign.operatives = []
    save.campaign.roster = {}
    save.app.squad = []
    save.campaign.contractsWon = []
    save.campaign.campaignWon = false
    save.campaign.campaignFailed = false
    expect(validateSave(save)).toBe(true)
    useCampaignStore.setState({ campaignFailed: true })
    hydrateSave(save)
    expect(useCampaignStore.getState().operatives).toEqual([])
    expect(useCampaignStore.getState().campaignFailed).toBe(false)
    // And a stored failed flag survives a non-empty roster unchanged.
    const failed = captureSave()
    failed.campaign.operatives = structuredClone(initialCampaignData().operatives)
    failed.campaign.roster = structuredClone(initialCampaignData().roster)
    failed.app.squad = [...DEFAULT_SQUAD]
    failed.campaign.campaignFailed = true
    expect(validateSave(failed)).toBe(true)
    hydrateSave(failed)
    expect(useCampaignStore.getState().operatives.length).toBeGreaterThan(0)
    expect(useCampaignStore.getState().campaignFailed).toBe(true)
  })
})

// PV-002 (TR-persistence-002): New Operation erases the house in two steps.
// The arm is Menu-local UI state, so the Menu's own decision (pressNewOperation)
// drives it here; only a 'confirm' reaches startNewOperation.
describe('new operation: two-step erase of the house', () => {
  // A lived-in campaign whose Credits, Intel, contracts, labs, roster and
  // tutorial progress all differ from the New Operation desk.
  function livedInCampaign(): SaveV10 {
    useAppStore.setState({ phase: 'world', credits: 77777, squad: ['op1', 'op3'] })
    useWorldStore.setState({ t: 3600, influence: 5 })
    useResearchStore.getState().start(nodeById('b-propellants'), 3600)
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 30, contractsWon: ['m01'] })
    const roster = structuredClone(useCampaignStore.getState().roster)
    const firstId = Object.keys(roster)[0]
    roster[firstId] = { ...roster[firstId], xp: 25 }
    useCampaignStore.setState({ roster })
    useTutorialStore.getState().skipTutorial()
    return captureSave()
  }

  // Origin reload onto the Menu: memory at the desk, storage keeps the blob.
  function reloadToMenu(): void {
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
    expect(loadCampaignAtBoot(storage)).toBe('valid')
  }

  // Fixture F: New Operation from a parallel clean origin.
  function cleanOriginFixture(): SaveV10 {
    const clean = new MemoryStorage()
    startNewOperation(clean)
    return captureSave()
  }

  // Continue loads the recorded Credits / Intel / roster, not a new desk.
  function expectContinueLoads(expected: SaveV10): void {
    reloadToMenu()
    continueOperation()
    const now = captureSave()
    expect(useAppStore.getState().phase).toBe('world')
    expect(now.app.credits).toBe(expected.app.credits)
    expect(now.campaign.intelLevel).toBe(expected.campaign.intelLevel)
    expect(now.campaign.intelProgress).toBe(expected.campaign.intelProgress)
    expect(now.campaign.roster).toEqual(expected.campaign.roster)
  }

  it('one activation only arms: the blob is unchanged and Continue still loads the same campaign', () => {
    const expected = livedInCampaign()
    expect(writeSave(storage)).toBe(true)
    const blob = storage.getItem(SAVE_KEY)
    reloadToMenu()
    const canContinue = menuSaveStatus(storage) === 'valid'
    expect(canContinue).toBe(true)

    // First press with a save on file arms; nothing reaches the save module.
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
    expect(menuSaveStatus(storage)).toBe('valid')

    expectContinueLoads(expected)
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
  })

  it('confirm: Credits, Intel, contractsWon, labs and tutorial-seen equal clean-origin fixture F; the prior campaign is gone', () => {
    const fixture = cleanOriginFixture()
    const lived = livedInCampaign()
    // Fixture and lived-in campaign differ on every compared field.
    expect(lived.app.credits).not.toBe(fixture.app.credits)
    expect(lived.campaign.intelLevel).not.toBe(fixture.campaign.intelLevel)
    expect(lived.campaign.contractsWon).not.toEqual(fixture.campaign.contractsWon)
    expect(lived.research.labs).not.toEqual(fixture.research.labs)
    expect(lived.tutorial).not.toEqual(fixture.tutorial)
    expect(writeSave(storage)).toBe(true)
    reloadToMenu()

    const canContinue = menuSaveStatus(storage) === 'valid'
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    expect(pressNewOperation(canContinue, true)).toBe('confirm')
    startNewOperation(storage)

    const now = captureSave()
    expect(now.app.credits).toBe(fixture.app.credits)
    expect(now.campaign.intelLevel).toBe(fixture.campaign.intelLevel)
    expect(now.campaign.intelProgress).toBe(fixture.campaign.intelProgress)
    expect(now.campaign.contractsWon).toEqual(fixture.campaign.contractsWon)
    expect(now.campaign.roster).toEqual(fixture.campaign.roster)
    expect(now.research.labs).toEqual(fixture.research.labs)
    expect(now.tutorial).toEqual(fixture.tutorial)
    // Whole desk, not only the named fields.
    expect(now).toEqual(fixture)
    expect(useAppStore.getState()).toMatchObject({ deploySerial: 0, lastAppliedKey: 0 })

    // Not restorable: the slot is empty and a reload offers no Continue.
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(readSave(storage)).toBeNull()
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('never-started')
    expect(menuSaveStatus(storage)).toBe('never-started')
    expect(captureSave().app.credits).toBe(fixture.app.credits)
  })

  it('no save on file: the single press starts at once (nothing to erase)', () => {
    expect(pressNewOperation(false, false)).toBe('confirm')
  })

  it('arm lapses or the director leaves the Menu: the blob is unchanged and Continue still loads the same campaign', () => {
    vi.useFakeTimers()
    const expected = livedInCampaign()
    expect(writeSave(storage)).toBe(true)
    const blob = storage.getItem(SAVE_KEY)
    reloadToMenu()
    stopAutosave = startAutosave(storage)
    const canContinue = menuSaveStatus(storage) === 'valid'

    // Lapse: armed, then the window passes with no confirm. The Menu drops
    // the arm, so the next press arms again rather than erasing.
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    vi.advanceTimersByTime(10_000)
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    expect(storage.getItem(SAVE_KEY)).toBe(blob)

    // Leave: armed, then the Menu unmounts with no confirm. The arm is
    // component state, so it goes with the Menu and nothing was written.
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    vi.advanceTimersByTime(10_000)
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
    stopAutosave()
    stopAutosave = null

    expectContinueLoads(expected)
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
  })
})

// PV-004 (TR-persistence-005): reload + Continue returns the last Screen
// snapshot, including a Screen-held selected contract (Persistence Rule 13).
describe('continue restores the last screen snapshot', () => {
  // Origin reload: memory returns to the opening Operation, storage keeps the
  // blob, boot hydrates it to the Menu, and the director presses Continue.
  function reloadAndContinue(): void {
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')
    continueOperation()
  }

  // Open two generated contracts on the strategic clock.
  function openGeneratedContracts(): void {
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    useWorldStore.setState({ t: useWorldStore.getState().nextContractT - 1 })
    useWorldStore.getState().tick(1)
    expect(useWorldStore.getState().contracts.length).toBeGreaterThan(0)
  }

  // A lived-in campaign: a won contract, a KIA, an injury, a hire, labs,
  // influence, market, tutorial progress, and moved sectors.
  function liveIn(): void {
    openGeneratedContracts()
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 1,
        won: true,
        kills: 5,
        casualties: 1,
        timeSec: 500,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: ['op4'],
        survivorHp: { op1: 0.1, op2: 0.8 },
        quietReplay: false,
      }),
      useWorldStore.getState().t,
    )
    useWorldStore.getState().applyMissionResult('m01', settleOutcome({
      applyKey: 1,
      won: true,
      kills: 5,
      casualties: 1,
      timeSec: 500,
      civiliansHit: 0,
      reward: 85000,
      bonus: 0,
      deadIds: ['op4'],
      survivorHp: {},
      quietReplay: false,
    }))
    const hired = useCampaignStore.getState().candidates[0]
    useAppStore.getState().hireOperative(hired.id)
    useResearchStore.getState().start(nodeById('b-propellants'), useWorldStore.getState().t)
    useTutorialStore.getState().note('select')
    useTutorialStore.getState().markSeen('hint-worldmap')
    useWorldStore.setState({
      speed: 4,
      paused: true,
      influence: 11,
      crisis: ['af'],
      pressure: { af: 9000 },
    })
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 60 })
    useAppStore.setState({ phase: 'world', credits: 301234, squad: ['op2', 'op3'] })
  }

  it('World Network, labs, roster, tutorial-seen and campaign result match the last Screen visit, not the opening Operation', () => {
    liveIn()
    const screen = captureSave()
    expect(writeSave(storage)).toBe(true)

    startNewOperation(null)
    const opening = captureSave()
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    continueOperation()

    const restored = captureSave()
    expect(useAppStore.getState().phase).toBe('world')
    expect(restored.world).toEqual(screen.world)
    expect(restored.research).toEqual(screen.research)
    expect(restored.campaign.operatives).toEqual(screen.campaign.operatives)
    expect(restored.campaign.roster).toEqual(screen.campaign.roster)
    expect(restored.tutorial.seen).toEqual(screen.tutorial.seen)
    expect(restored.campaign.contractsWon).toEqual(screen.campaign.contractsWon)
    expect(restored.campaign.campaignWon).toBe(screen.campaign.campaignWon)
    expect(restored.campaign.campaignFailed).toBe(screen.campaign.campaignFailed)
    // Not the opening Operation.
    expect(restored.world.t).not.toBe(opening.world.t)
    expect(restored.research.labs).not.toEqual(opening.research.labs)
    expect(restored.campaign.operatives).not.toEqual(opening.campaign.operatives)
    expect(restored.tutorial.seen).not.toEqual(opening.tutorial.seen)
    expect(restored.campaign.contractsWon).not.toEqual(opening.campaign.contractsWon)
  })

  it('restores each recorded value including selected contract C; Focus, Review-time, mission and Debrief are not restored', () => {
    liveIn()
    // The director picked C on the World Network and is on Brief (a Screen).
    useAppStore.getState().selectMission('m02')
    expect(useAppStore.getState()).toMatchObject({ phase: 'brief', missionId: 'm02' })
    useWorldStore.setState({ selected: 'as', review: 500 })
    const app = useAppStore.getState()
    const world = useWorldStore.getState()
    const research = useResearchStore.getState()
    const campaign = useCampaignStore.getState()
    const recorded = {
      credits: app.credits,
      squad: [...app.squad],
      missionId: app.missionId,
      influence: world.influence,
      t: world.t,
      speed: world.speed,
      paused: world.paused,
      sectors: structuredClone(world.sectors),
      owner: { ...world.owner },
      contracts: structuredClone(world.contracts),
      done: [...research.done],
      labs: structuredClone(research.labs),
      intelLevel: campaign.intelLevel,
      intelProgress: campaign.intelProgress,
      operatives: structuredClone(campaign.operatives),
      roster: structuredClone(campaign.roster),
      candidates: structuredClone(campaign.candidates),
    }
    expect(writeSave(storage)).toBe(true)

    // Then a mission ran and reached Debrief in memory only.
    useAppStore.setState({
      phase: 'debrief',
      outcome: settleOutcome({
        applyKey: 2,
        won: true,
        kills: 3,
        casualties: 0,
        timeSec: 100,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      }),
    })

    reloadAndContinue()

    const a = useAppStore.getState()
    const w = useWorldStore.getState()
    const r = useResearchStore.getState()
    const c = useCampaignStore.getState()
    expect(a.credits).toBe(recorded.credits)
    expect(a.squad).toEqual(recorded.squad)
    expect(a.missionId).toBe('m02')
    expect(w.influence).toBe(recorded.influence)
    expect(w.t).toBe(recorded.t)
    expect(w.speed).toBe(recorded.speed)
    expect(w.paused).toBe(recorded.paused)
    expect(w.sectors).toEqual(recorded.sectors)
    expect(w.owner).toEqual(recorded.owner)
    expect(w.contracts).toEqual(recorded.contracts)
    expect(r.done).toEqual(recorded.done)
    expect(r.labs).toEqual(recorded.labs)
    expect(c.intelLevel).toBe(recorded.intelLevel)
    expect(c.intelProgress).toBe(recorded.intelProgress)
    expect(c.operatives).toEqual(recorded.operatives)
    expect(c.roster).toEqual(recorded.roster)
    expect(c.candidates).toEqual(recorded.candidates)
    // Continue opens the World Network, not Brief, even with C selected.
    expect(a.phase).toBe('world')
    // Not restored: Focus, Review-time scrub, the mission, the Debrief outcome.
    expect(w.selected).toBe('eu')
    expect(w.review).toBeNull()
    expect(a.outcome).toBeNull()
    expect(c.lastReport).toBeNull()
    // Brief can be entered for C without re-selecting it.
    useAppStore.getState().goto('brief')
    expect(useAppStore.getState()).toMatchObject({ phase: 'brief', missionId: 'm02' })
  })

  it('restores a selected generated contract that is still open in the market', () => {
    liveIn()
    const generated = useWorldStore.getState().contracts[0]
    useAppStore.setState({ phase: 'brief', missionId: generated.id })
    expect(writeSave(storage)).toBe(true)

    reloadAndContinue()
    expect(useAppStore.getState()).toMatchObject({ phase: 'world', missionId: generated.id })
    expect(useWorldStore.getState().contracts.some((c) => c.id === generated.id)).toBe(true)
  })

  it('writes none for a selection that can no longer be resolved, and a blob holding one is invalid', () => {
    useAppStore.setState({ phase: 'world', missionId: 'gc-gone' })
    expect(captureSave().app.missionId).toBeNull()

    const bad = structuredClone(captureSave())
    bad.app.missionId = 'gc-gone'
    expect(validateSave(bad)).toBe(false)
    const notString = structuredClone(captureSave()) as unknown as { app: { missionId: unknown } }
    notString.app.missionId = 7
    expect(validateSave(notString)).toBe(false)
  })

  it('a v9 blob upgrades with no selected contract', () => {
    useAppStore.setState({ phase: 'brief', missionId: 'm01' })
    const v9 = downgradeToV9(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v9))
    reloadAndContinue()
    expect(useAppStore.getState()).toMatchObject({ phase: 'world', missionId: null })
  })

  it('an authored contract already won keeps its persisted win flag', () => {
    liveIn()
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01'])
    expect(writeSave(storage)).toBe(true)

    reloadAndContinue()
    const c = useCampaignStore.getState()
    expect(c.contractsWon).toEqual(['m01'])
    expect(c.campaignWon).toBe(false)
    expect(readSave(storage)?.campaign.contractsWon).toEqual(['m01'])
  })

  it('a failed campaign (roster emptied by KIA) stays failed, empty, and locked', () => {
    const ids = useCampaignStore.getState().operatives.map((o) => o.id)
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 1,
        won: false,
        kills: 0,
        casualties: ids.length,
        timeSec: 10,
        civiliansHit: 0,
        reward: 0,
        bonus: 0,
        deadIds: ids,
        survivorHp: {},
        quietReplay: false,
      }),
      0,
    )
    useAppStore.setState({ phase: 'world', squad: [] })
    expect(useCampaignStore.getState()).toMatchObject({ campaignFailed: true, campaignWon: false })
    expect(writeSave(storage)).toBe(true)

    reloadAndContinue()
    const c = useCampaignStore.getState()
    expect(c.campaignFailed).toBe(true)
    expect(c.campaignWon).toBe(false)
    expect(c.operatives).toEqual([])
    expect(Object.keys(c.roster)).toEqual([])
    // Contracts stay locked: selecting one is refused.
    useAppStore.getState().selectMission('m01')
    expect(useAppStore.getState()).toMatchObject({ phase: 'world', missionId: null })
  })
})

describe('settings slot holds Quality and Difficulty, not the campaign blob', () => {
  afterEach(() => {
    initSettings(null)
    useSettingsStore.setState(defaultSettings())
  })

  it('Q2 and D2 changed after a valid save come from the settings slot on reload and Continue', () => {
    initSettings(storage)
    useAppStore.setState({ phase: 'world', credits: 4242 })
    expect(writeSave(storage)).toBe(true)
    const blob = storage.getItem(SAVE_KEY)

    useSettingsStore.getState().setQuality('high')
    useSettingsStore.getState().setDifficulty('hardened')
    // Changing Settings never rewrites the campaign blob.
    expect(storage.getItem(SAVE_KEY)).toBe(blob)

    // Origin reload: settings before the save system, then Continue.
    useSettingsStore.setState(defaultSettings())
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
    initSettings(storage)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    continueOperation()

    expect(useAppStore.getState().credits).toBe(4242)
    expect(useSettingsStore.getState().quality).toBe('high')
    expect(useSettingsStore.getState().difficulty).toBe('hardened')
    expect(JSON.parse(storage.getItem(SETTINGS_KEY) as string)).toMatchObject({
      quality: 'high',
      difficulty: 'hardened',
    })
    const raw = storage.getItem(SAVE_KEY) as string
    expect(raw).not.toMatch(/"quality"|"difficulty"/)
    expect(captureSave()).not.toHaveProperty('app.quality')
    expect(captureSave()).not.toHaveProperty('app.difficulty')
  })
})

// PV-005 (TR-persistence-001, ADR-0002): a mission in progress is memory only.
// Reload before Debrief returns the last Screen snapshot S; Abort discards the
// mission without a Debrief and without a campaign write.
describe('mid-mission reload and Abort discard', () => {
  let C: string
  let S: string
  let writes: number

  // A lived-in Screen visit with selected contract C and a non-default squad,
  // flushed by autosave: the last Screen snapshot S.
  function reachScreenSnapshot(): void {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    useAppStore.setState({ phase: 'world', credits: 222333 })
    useWorldStore.setState({ t: 3600, influence: 7 })
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 35, contractsWon: ['m01'] })
    useResearchStore.getState().start(nodeById('b-propellants'), 3600)
    C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2))!.id
    useAppStore.getState().selectMission(C)
    useAppStore.getState().toggleOperative('op4')
    useAppStore.getState().toggleOperative('op6')
    useAppStore.getState().goto('team')
    vi.advanceTimersByTime(500)
    S = storage.getItem(SAVE_KEY) as string
    expect(S).not.toBeNull()
    expect(readSave(storage)?.app).toMatchObject({ missionId: C, squad: ['op1', 'op2', 'op3', 'op6'] })
    writes = 0
    const setItem = storage.setItem.bind(storage)
    storage.setItem = (key, value) => {
      if (key === SAVE_KEY) writes++
      setItem(key, value)
    }
  }

  // Team Deploy, then the MissionScreen composer: mint the apply-once key,
  // freeze the deploy, and bring the mission HUD live.
  function deploy(): void {
    useAppStore.getState().startMission()
    const app = useAppStore.getState()
    expect(app.phase).toBe('mission')
    const applyKey = app.deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const ops = useCampaignStore.getState().operatives.filter((o) => app.squad.includes(o.id))
    freezeDeploy(resolveMission(C)!, ops, applyKey)
    useMissionStore.getState().reset()
    useMissionStore.getState().setLive(true)
  }

  // The sim pushes HUD updates at a low rate for a long stretch of play.
  function runMission(seconds: number): void {
    for (let i = 1; i <= seconds; i++) {
      useMissionStore.getState().setClock(`0:${String(i % 60).padStart(2, '0')}`)
      useMissionStore.getState().setAlert(i % 3)
      useMissionStore.getState().setCiviliansHit(i % 2)
      vi.advanceTimersByTime(1000)
    }
  }

  // Origin reload: the page dies (autosave with it), memory returns to the
  // opening Operation, storage keeps the blob, boot hydrates to the Menu.
  function reloadAndContinue(): void {
    stopAutosave?.()
    stopAutosave = null
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState()).toMatchObject({ phase: 'menu', outcome: null })
    continueOperation()
  }

  afterEach(() => {
    useSettingsStore.setState(defaultSettings())
  })

  it('reload before Debrief: Continue returns S including C, opens the World Network, no mission, no outcome', () => {
    reachScreenSnapshot()
    const snapshot = JSON.parse(S) as SaveV10
    deploy()
    runMission(90)

    reloadAndContinue()
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.phase).not.toBe('mission')
    expect(app.outcome).toBeNull()
    expect(app.lastAppliedKey).toBe(0)
    expect(app.missionId).toBe(C)
    expect(app.squad).toEqual(['op1', 'op2', 'op3', 'op6'])
    const restored = captureSave()
    expect(restored.app).toEqual(snapshot.app)
    expect(restored.world).toEqual(snapshot.world)
    expect(restored.campaign).toEqual(snapshot.campaign)
    expect(restored.research).toEqual(snapshot.research)

    // Brief can be entered for C without re-selecting it.
    useAppStore.getState().goto('brief')
    expect(useAppStore.getState()).toMatchObject({ phase: 'brief', missionId: C })
  })

  it('Abort from pause with telemetry off, then reload + Continue: named fields equal S, no Debrief ran', () => {
    useSettingsStore.setState({ telemetry: false })
    reachScreenSnapshot()
    const snapshot = JSON.parse(S) as SaveV10
    deploy()
    runMission(45)

    // Hud pause-menu Abort: the telemetry row (a no-op while off), then out.
    useMissionStore.getState().setPaused(true)
    recordAbort(C, 45, 1234, ['assault'], storage)
    useAppStore.getState().goto('world')
    expect(storage.getItem(TELEMETRY_KEY)).toBeNull()
    expect(loadRecords(storage)).toEqual([])
    // No Debrief: no outcome stored, nothing applied.
    expect(useAppStore.getState().outcome).toBeNull()
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    vi.advanceTimersByTime(500)

    reloadAndContinue()
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    const restored = captureSave()
    expect(restored.app.credits).toBe(snapshot.app.credits)
    expect(restored.app.squad).toEqual(snapshot.app.squad)
    expect(restored.world.influence).toBe(snapshot.world.influence)
    expect(restored.world.sectors).toEqual(snapshot.world.sectors)
    expect(restored.world.owner).toEqual(snapshot.world.owner)
    expect(restored.campaign.intelLevel).toBe(snapshot.campaign.intelLevel)
    expect(restored.campaign.intelProgress).toBe(snapshot.campaign.intelProgress)
    expect(restored.campaign.operatives).toEqual(snapshot.campaign.operatives)
    expect(restored.campaign.roster).toEqual(snapshot.campaign.roster)
    expect(restored.research).toEqual(snapshot.research)
    expect(restored.campaign.contractsWon).toEqual(snapshot.campaign.contractsWon)
    expect(restored.campaign.campaignWon).toBe(snapshot.campaign.campaignWon)
    expect(restored.campaign.campaignFailed).toBe(snapshot.campaign.campaignFailed)
    // The aborted mission is not restored: the blob carries no mission state.
    expect(app.phase).not.toBe('mission')
    expect(storage.getItem(SAVE_KEY)).not.toMatch(/"phase"|"outcome"|"deploySerial"/)
  })

  it('the stored blob is unchanged from S for the whole mission: no write while in a mission', () => {
    reachScreenSnapshot()
    deploy()
    for (const seconds of [1, 30, 600]) {
      runMission(seconds)
      expect(storage.getItem(SAVE_KEY)).toBe(S)
    }
    // Store changes made while in the mission never reach the blob either.
    useWorldStore.setState({ t: 99999, influence: 500 })
    useCampaignStore.setState({ intelProgress: 99 })
    useAppStore.setState({ credits: 1 })
    vi.advanceTimersByTime(10_000)
    expect(storage.getItem(SAVE_KEY)).toBe(S)
    expect(writes).toBe(0)
  })
})

// PV-006 (TR-persistence-004, ADR-0021, ADR-0011): Debrief applies once in
// session memory. The invoice mutations are never durable while Debrief is
// open; a reload on Debrief returns the last Screen snapshot S.
describe('Debrief applies once in session memory', () => {
  let C: string
  let S: string
  let writes: number
  // The browser origin's localStorage, where applyDebrief's telemetry row lands.
  let browser: MemoryStorage

  beforeEach(() => {
    browser = new MemoryStorage()
    vi.stubGlobal('window', { localStorage: browser })
    useSettingsStore.setState({ telemetry: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useSettingsStore.setState(defaultSettings())
  })

  // A lived-in Screen visit with selected contract C, flushed by autosave: S.
  function reachScreenSnapshot(): void {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    useAppStore.setState({ phase: 'world', credits: 222333 })
    useWorldStore.setState({ t: 3600, influence: 7 })
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 35, contractsWon: ['m01'] })
    useResearchStore.getState().start(nodeById('b-propellants'), 3600)
    C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2))!.id
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
    vi.advanceTimersByTime(500)
    S = storage.getItem(SAVE_KEY) as string
    expect(S).not.toBeNull()
    writes = 0
    const setItem = storage.setItem.bind(storage)
    storage.setItem = (key, value) => {
      if (key === SAVE_KEY) writes++
      setItem(key, value)
    }
  }

  // Deploy, finish the mission with a paid win that kills one operative, and
  // run the Debrief apply exactly as the Debrief screen does on mount.
  function finishAndApplyDebrief(): void {
    useAppStore.getState().startMission()
    const app = useAppStore.getState()
    expect(app.phase).toBe('mission')
    const applyKey = app.deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const ops = useCampaignStore.getState().operatives.filter((o) => app.squad.includes(o.id))
    freezeDeploy(resolveMission(C)!, ops, applyKey)
    useAppStore.getState().setOutcome(
      settleOutcome({
        applyKey,
        won: true,
        kills: 5,
        casualties: 1,
        timeSec: 300,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [app.squad[0]],
        survivorHp: {},
        quietReplay: false,
        // The sim's telemetry payload, so the TELEMETRY-on apply writes a row.
        telemetry: {
          seed: 1,
          firstContactSec: 30,
          objectiveTimes: [{ id: 'ob1', atSec: 120 }],
          shotsByWeapon: { assault: 40, smg: 0, pistol: 0, longrifle: 0, shotgun: 0 },
          damageByWeapon: { assault: 400, smg: 0, pistol: 0, longrifle: 0, shotgun: 0 },
          damageDealt: 400,
          damageTaken: 120,
          civilianHitsBySquad: 0,
          civilianHitsByCorpsec: 0,
          medUsed: 0,
          cellUsed: 0,
          abilityUsesByRole: {},
          squadRoles: [],
        },
      }),
    )
    expect(useAppStore.getState().phase).toBe('debrief')
    applyDebrief(C)
    expect(useAppStore.getState().lastAppliedKey).toBe(applyKey)
  }

  // The campaign values the Debrief apply owns: payout, sector, Intel,
  // Influence, roster (plus the clock and labs the win catch-up moves).
  function appliedValues() {
    const save = captureSave()
    return structuredClone({
      credits: save.app.credits,
      squad: save.app.squad,
      t: save.world.t,
      influence: save.world.influence,
      sectors: save.world.sectors,
      owner: save.world.owner,
      intelLevel: save.campaign.intelLevel,
      intelProgress: save.campaign.intelProgress,
      contractsWon: save.campaign.contractsWon,
      operatives: save.campaign.operatives,
      roster: save.campaign.roster,
      research: save.research,
    })
  }

  it('reload while still on Debrief: Continue restores S, not the invoice mutations', () => {
    reachScreenSnapshot()
    const snapshot = JSON.parse(S) as SaveV10
    finishAndApplyDebrief()
    const invoice = appliedValues()
    // The apply really moved the campaign in memory.
    expect(invoice.credits).not.toBe(snapshot.app.credits)
    expect(invoice.contractsWon).toContain(C)
    // The player lingers on Debrief before the reload.
    vi.advanceTimersByTime(5_000)

    // Origin reload on Debrief: the page dies, storage keeps S.
    stopAutosave?.()
    stopAutosave = null
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    continueOperation()

    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    expect(app.lastAppliedKey).toBe(0)
    const restored = captureSave()
    expect(restored.app).toEqual(snapshot.app)
    expect(restored.world).toEqual(snapshot.world)
    expect(restored.campaign).toEqual(snapshot.campaign)
    expect(restored.research).toEqual(snapshot.research)
    expect(restored.app.credits).not.toBe(invoice.credits)
    expect(restored.campaign.contractsWon).not.toContain(C)
  })

  it('Debrief stays open: applied values do not change again and telemetry has exactly one record', () => {
    reachScreenSnapshot()
    finishAndApplyDebrief()
    const applied = appliedValues()
    expect(loadRecords(browser)).toHaveLength(1)

    // The Debrief screen re-renders / remounts and time passes.
    for (const ms of [16, 1000, 60_000]) {
      applyDebrief(C)
      vi.advanceTimersByTime(ms)
      expect(appliedValues()).toEqual(applied)
    }
    expect(useAppStore.getState().phase).toBe('debrief')
    const records = loadRecords(browser)
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ missionId: C, outcome: 'won' })
  })

  it('Debrief open for any length of time: the stored blob is unchanged from S; the next Screen writes first', () => {
    reachScreenSnapshot()
    finishAndApplyDebrief()
    for (const ms of [1, 500, 30_000, 3_600_000]) {
      vi.advanceTimersByTime(ms)
      expect(storage.getItem(SAVE_KEY)).toBe(S)
    }
    expect(writes).toBe(0)

    // Leaving Debrief for the World Network: the first durable write is the
    // Screen's, and it carries the applied values.
    const applied = appliedValues()
    useAppStore.getState().returnFromDebrief()
    vi.advanceTimersByTime(500)
    expect(writes).toBe(1)
    expect(readSave(storage)?.app.credits).toBe(applied.credits)
    expect(readSave(storage)?.campaign.contractsWon).toEqual(applied.contractsWon)
  })
})

// PV-007 (TR-persistence-004, ADR-0011, ADR-0021, ADR-0001, ADR-0018): the
// next Screen autosave durably commits the Debrief result. World Network
// return clears the selected contract; Brief Replay keeps it.
describe('Next Screen autosave durably commits the Debrief result', () => {
  let C: string
  let S: string

  afterEach(() => {
    useSettingsStore.setState(defaultSettings())
  })

  // A lived-in Screen visit with selected contract C and a lab running,
  // flushed by autosave: the last Screen snapshot S. `wonBefore` puts C in the
  // campaign record so the next win on it is a quiet replay.
  function reachScreenSnapshot(wonBefore: boolean): SaveV10 {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    useAppStore.setState({ phase: 'world', credits: 222333 })
    useWorldStore.setState({ t: 3600, influence: 7 })
    C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2) && (m.etaDays ?? 0) > 0)!.id
    useCampaignStore.setState({
      intelLevel: 2,
      intelProgress: 35,
      contractsWon: wonBefore ? ['m01', C] : ['m01'],
    })
    useResearchStore.getState().start(nodeById('b-propellants'), 3600)
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
    vi.advanceTimersByTime(500)
    S = storage.getItem(SAVE_KEY) as string
    expect(S).not.toBeNull()
    const snapshot = JSON.parse(S) as SaveV10
    expect(snapshot.app.missionId).toBe(C)
    return snapshot
  }

  // Deploy, finish a win on C, and run the Debrief apply as the Debrief screen
  // does on mount. A paid win kills one operative; a quiet replay wounds one.
  function finishAndApplyDebrief(quietReplay: boolean): void {
    useAppStore.getState().startMission()
    const app = useAppStore.getState()
    expect(app.phase).toBe('mission')
    const applyKey = app.deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const ops = useCampaignStore.getState().operatives.filter((o) => app.squad.includes(o.id))
    freezeDeploy(resolveMission(C)!, ops, applyKey)
    useAppStore.getState().setOutcome(
      settleOutcome({
        applyKey,
        won: true,
        kills: 5,
        casualties: quietReplay ? 0 : 1,
        timeSec: 300,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: quietReplay ? [] : [app.squad[0]],
        survivorHp: quietReplay ? { [app.squad[1]]: 0.1 } : {},
        quietReplay,
      }),
    )
    expect(useAppStore.getState().phase).toBe('debrief')
    applyDebrief(C)
    expect(useAppStore.getState().lastAppliedKey).toBe(applyKey)
  }

  // The campaign values the Debrief apply owns, as they stand in memory.
  function appliedValues() {
    const save = captureSave()
    return structuredClone({
      credits: save.app.credits,
      squad: save.app.squad,
      t: save.world.t,
      influence: save.world.influence,
      sectors: save.world.sectors,
      owner: save.world.owner,
      intelLevel: save.campaign.intelLevel,
      intelProgress: save.campaign.intelProgress,
      contractsWon: save.campaign.contractsWon,
      operatives: save.campaign.operatives,
      roster: save.campaign.roster,
      research: save.research,
    })
  }

  // Origin reload: the page dies (autosave with it), memory returns to the
  // opening Operation, storage keeps the blob, boot hydrates, Continue.
  function reloadAndContinue(): void {
    stopAutosave?.()
    stopAutosave = null
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')
    continueOperation()
    const app = useAppStore.getState()
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    expect(app.lastAppliedKey).toBe(0)
  }

  it('World Network return, reload, Continue: post-apply values exactly once, selected contract none', () => {
    const snapshot = reachScreenSnapshot(false)
    finishAndApplyDebrief(false)
    const applied = appliedValues()
    // The apply moved every named field away from S.
    expect(applied.credits).toBeGreaterThan(snapshot.app.credits)
    expect(applied.contractsWon).toEqual(['m01', C])
    expect(applied.operatives.length).toBe(snapshot.campaign.operatives.length - 1)
    expect(applied.t).toBeGreaterThan(snapshot.world.t)
    expect([applied.intelLevel, applied.intelProgress]).not.toEqual([
      snapshot.campaign.intelLevel,
      snapshot.campaign.intelProgress,
    ])

    // Debrief: RETURN TO WORLD NETWORK, then the Screen autosave flushes.
    useAppStore.getState().returnFromDebrief()
    vi.advanceTimersByTime(500)
    expect(storage.getItem(SAVE_KEY)).not.toBe(S)

    reloadAndContinue()
    expect(useAppStore.getState().missionId).toBeNull()
    // Exact equality: not S, and not doubled (a second apply would move
    // Credits, Intel, contractsWon and the clock again).
    expect(appliedValues()).toEqual(applied)
    expect(useAppStore.getState().credits).toBe(applied.credits)

    // Continue applied nothing further: staying on the World Network and
    // flushing again stores the same values.
    vi.advanceTimersByTime(5_000)
    expect(appliedValues()).toEqual(applied)
  })

  it('Replay to Brief after the apply: selected contract is still C', () => {
    reachScreenSnapshot(false)
    finishAndApplyDebrief(false)
    // Debrief: REPLAY MISSION.
    useAppStore.getState().goto('brief')
    expect(useAppStore.getState()).toMatchObject({ phase: 'brief', missionId: C })
    vi.advanceTimersByTime(500)
    expect(readSave(storage)?.app.missionId).toBe(C)
  })

  it('reload after that Brief visit: Continue restores post-apply values once and still C', () => {
    const snapshot = reachScreenSnapshot(false)
    finishAndApplyDebrief(false)
    const applied = appliedValues()
    useAppStore.getState().goto('brief')
    vi.advanceTimersByTime(500)

    reloadAndContinue()
    expect(useAppStore.getState().missionId).toBe(C)
    expect(appliedValues()).toEqual(applied)
    expect(useAppStore.getState().credits).toBe(applied.credits)
    expect(useAppStore.getState().credits).not.toBe(snapshot.app.credits)
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01', C])
  })

  it.each([
    ['World Network return', () => useAppStore.getState().returnFromDebrief(), null as string | null],
    ['Brief Replay', () => useAppStore.getState().goto('brief'), 'C'],
  ])(
    'quiet replay then %s, reload, Continue: t, labs, injuries, Tax and roster post-apply; Intel, Influence, contractsWon equal S',
    (_label, leave, selection) => {
      const snapshot = reachScreenSnapshot(true)
      const creditsBefore = useAppStore.getState().credits
      finishAndApplyDebrief(true)
      // A quiet replay pays no contract: every Credit the apply added is Tax
      // from the ETA catch-up.
      expect(useAppStore.getState().outcome?.quietReplay).toBe(true)
      const tax = useAppStore.getState().credits - creditsBefore
      expect(tax).toBeGreaterThan(0)
      const applied = appliedValues()
      expect(applied.t).toBeGreaterThan(snapshot.world.t)
      expect(applied.research).not.toEqual(snapshot.research)
      // Injuries catch up on the new clock: an operative INJURED in S whose
      // recovery falls inside the ETA is READY after the apply.
      const injuredId = Object.keys(snapshot.campaign.roster).find(
        (id) => snapshot.campaign.roster[id].status === 'INJURED',
      )
      expect(injuredId).toBeDefined()
      expect(snapshot.campaign.roster[injuredId!].recoverAtT).toBeLessThanOrEqual(applied.t)
      expect(applied.roster[injuredId!].status).toBe('READY')

      leave()
      vi.advanceTimersByTime(500)

      reloadAndContinue()
      expect(useAppStore.getState().missionId).toBe(selection === null ? null : C)
      const restored = captureSave()
      // Post-apply, not S.
      expect(restored.world.t).toBe(applied.t)
      expect(restored.research).toEqual(applied.research)
      expect(restored.campaign.roster).toEqual(applied.roster)
      expect(restored.campaign.operatives).toEqual(applied.operatives)
      expect(restored.campaign.roster[injuredId!].status).toBe('READY')
      // Equal S: a quiet replay moves no Intel, Influence or contract record.
      expect(restored.campaign.intelLevel).toBe(snapshot.campaign.intelLevel)
      expect(restored.campaign.intelProgress).toBe(snapshot.campaign.intelProgress)
      expect(restored.world.influence).toBe(snapshot.world.influence)
      expect(restored.campaign.contractsWon).toEqual(snapshot.campaign.contractsWon)
      // Credits are S plus the catch-up Tax, exactly: no contract payout.
      expect(restored.app.credits).toBe(snapshot.app.credits + tax)
    },
  )
})

// PV-017 (TR-persistence-009, ADR-0022): the Debrief invoice reads unfiled
// from the apply until a Screen autosave lands; a reload never reads unfiled.
describe('Debrief filing status reads unfiled until the next Screen', () => {
  let C: string

  const status = () => useSaveStatusStore.getState().status

  // A Screen visit holding selected contract C, flushed by autosave.
  function reachScreen(wonBefore: boolean): string {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    useAppStore.setState({ phase: 'world' })
    C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2) && (m.etaDays ?? 0) > 0)!.id
    useCampaignStore.setState({ intelLevel: 2, contractsWon: wonBefore ? ['m01', C] : ['m01'] })
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
    vi.advanceTimersByTime(500)
    const S = storage.getItem(SAVE_KEY) as string
    expect(S).not.toBeNull()
    expect(status()).toBe('filed')
    return S
  }

  // Deploy, win on C, and run the Debrief apply as the Debrief screen does.
  function applyWin(quietReplay: boolean): void {
    useAppStore.getState().startMission()
    const app = useAppStore.getState()
    const applyKey = app.deploySerial + 1
    useAppStore.setState({ deploySerial: applyKey })
    const ops = useCampaignStore.getState().operatives.filter((o) => app.squad.includes(o.id))
    freezeDeploy(resolveMission(C)!, ops, applyKey)
    useAppStore.getState().setOutcome(
      settleOutcome({
        applyKey,
        won: true,
        kills: 3,
        casualties: 0,
        timeSec: 200,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [],
        survivorHp: {},
        quietReplay,
      }),
    )
    expect(useAppStore.getState().phase).toBe('debrief')
    applyDebrief(C)
    expect(useAppStore.getState().lastAppliedKey).toBe(applyKey)
  }

  function reloadAndContinue(): void {
    stopAutosave?.()
    stopAutosave = null
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    continueOperation()
  }

  it.each([
    ['paid win', false],
    ['quiet replay', true],
  ])('AC1 %s: Debrief reads unfiled and stays unfiled while on Debrief', (_label, quiet) => {
    const S = reachScreen(quiet)
    applyWin(quiet)
    expect(useAppStore.getState().outcome?.quietReplay).toBe(quiet)
    expect(status()).toBe('unfiled')
    expect(debriefFilingLine(status())).toBe(UNFILED_LINE)
    // Debrief never autosaves, so nothing files the invoice while it shows.
    vi.advanceTimersByTime(5_000)
    expect(storage.getItem(SAVE_KEY)).toBe(S)
    expect(status()).toBe('unfiled')
  })

  it('AC1: Abort applies nothing and never marks unfiled', () => {
    reachScreen(false)
    useAppStore.getState().startMission()
    // Hud pause-menu Abort leaves the field with no Debrief.
    useAppStore.getState().goto('world')
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    expect(status()).toBe('filed')
    vi.advanceTimersByTime(500)
    expect(status()).toBe('filed')
  })

  it('AC2: World Network return files; reload then Continue is post-apply and not unfiled', () => {
    const S = reachScreen(false)
    applyWin(false)
    const applied = captureSave()
    useAppStore.getState().returnFromDebrief()
    // Navigation alone is not the success signal: still unfiled until the write.
    expect(status()).toBe('unfiled')
    vi.advanceTimersByTime(500)
    expect(storage.getItem(SAVE_KEY)).not.toBe(S)
    expect(status()).toBe('filed')
    expect(debriefFilingLine(status())).toBeNull()

    reloadAndContinue()
    expect(status()).toBe('filed')
    const restored = captureSave()
    expect(restored.app.credits).toBe(applied.app.credits)
    expect(restored.world.t).toBe(applied.world.t)
    expect(restored.campaign.contractsWon).toEqual(['m01', C])
  })

  it('AC3: Replay to Brief files in session and the selection is still C', () => {
    reachScreen(false)
    applyWin(false)
    expect(status()).toBe('unfiled')
    useAppStore.getState().goto('brief')
    vi.advanceTimersByTime(500)
    expect(status()).toBe('filed')
    expect(useAppStore.getState().missionId).toBe(C)
    expect(readSave(storage)?.app.missionId).toBe(C)
  })

  it('a second apply after hydrate (key back to 1) still marks unfiled', () => {
    reachScreen(false)
    applyWin(false)
    useAppStore.getState().returnFromDebrief()
    vi.advanceTimersByTime(500)
    reloadAndContinue()
    stopAutosave = startAutosave(storage)
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
    useAppStore.getState().selectMission(C)
    applyWin(false)
    expect(status()).toBe('unfiled')
  })

  it('a write that cannot happen never reports filed', () => {
    reachScreen(false)
    applyWin(false)
    expect(writeSave(null)).toBe(false)
    expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'unavailable' })
  })

  it('the status is not in the campaign blob and does not schedule a write', () => {
    reachScreen(false)
    expect(JSON.stringify(captureSave())).not.toMatch(/unfiled|write-failed/)
    const writes = vi.spyOn(storage, 'setItem')
    useSaveStatusStore.setState({ status: 'unfiled', reason: null })
    useSaveStatusStore.setState({ status: 'filed', reason: null })
    vi.advanceTimersByTime(1_000)
    expect(writes).not.toHaveBeenCalled()
  })

  // PV-018 (TR-persistence-009, ADR-0022): a swallowed campaign write or New
  // Operation erase never reports filed, and Continue restores the last
  // durable blob. The throw is injected through the storage seam the save
  // module was handed, not keyed on a storage key name.
  describe('write failure never reports filed', () => {
    const quotaError = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })

    // Every campaign write through the seam throws until the returned restore.
    function failWrites(): () => void {
      const set = vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw quotaError()
      })
      const remove = vi.spyOn(storage, 'removeItem').mockImplementation(() => {
        throw quotaError()
      })
      return () => {
        set.mockRestore()
        remove.mockRestore()
      }
    }

    function expectNamedFields(expected: SaveV10): void {
      const now = captureSave()
      expect(now.app.credits).toBe(expected.app.credits)
      expect(now.world.t).toBe(expected.world.t)
      expect(now.campaign.intelLevel).toBe(expected.campaign.intelLevel)
      expect(now.campaign.contractsWon).toEqual(expected.campaign.contractsWon)
      expect(now.campaign.roster).toEqual(expected.campaign.roster)
    }

    it('AC1: New Operation with the erase and writes failing keeps the desk at F, shows the failure, and reload loads C0', () => {
      const F = captureSave()
      const S = reachScreen(false)
      const C0 = JSON.parse(S) as SaveV10
      failWrites()

      expect(() => startNewOperation(storage)).not.toThrow()
      expect(captureSave()).toEqual(F)
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'quota' })
      expect(screenWriteFailureLine(status())).toBe(WRITE_FAILED_LINE)
      // The new house's autosave also throws: still not filed, C0 untouched.
      vi.advanceTimersByTime(1_000)
      expect(status()).toBe('write-failed')
      expect(storage.getItem(SAVE_KEY)).toBe(S)

      reloadAndContinue()
      expectNamedFields(C0)
    })

    it('a failed erase whose next Screen write lands truthfully files the new house (ADR-0022)', () => {
      reachScreen(false)
      vi.spyOn(storage, 'removeItem').mockImplementation(() => {
        throw quotaError()
      })
      startNewOperation(storage)
      expect(status()).toBe('write-failed')
      vi.advanceTimersByTime(500)
      expect(status()).toBe('filed')
      expect(readSave(storage)?.app.credits).toBe(captureSave().app.credits)
    })

    it.each([
      ['World Network return', () => useAppStore.getState().returnFromDebrief()],
      ['Replay to Brief', () => useAppStore.getState().goto('brief')],
    ])('AC2 %s: the first Screen write throws; not filed; reload then Continue equals S', (_label, leave) => {
      const S = reachScreen(false)
      applyWin(false)
      failWrites()

      expect(() => {
        leave()
        vi.advanceTimersByTime(500)
      }).not.toThrow()
      expect(status()).not.toBe('filed')
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'quota' })
      expect(storage.getItem(SAVE_KEY)).toBe(S)

      reloadAndContinue()
      expectNamedFields(JSON.parse(S) as SaveV10)
      // Hydrating the last durable blob is filed: that blob is on disk.
      expect(status()).toBe('filed')
    })

    it('AC3: writes keep throwing across World Network and Research; the first success files the post-apply campaign', () => {
      const S = reachScreen(false)
      applyWin(false)
      const applied = captureSave()
      const restore = failWrites()

      expect(() => {
        useAppStore.getState().returnFromDebrief()
        vi.advanceTimersByTime(500)
      }).not.toThrow()
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'quota' })
      expect(() => {
        useAppStore.getState().goto('research')
        vi.advanceTimersByTime(500)
      }).not.toThrow()
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'quota' })
      expect(storage.getItem(SAVE_KEY)).toBe(S)

      restore()
      useAppStore.getState().goto('world')
      vi.advanceTimersByTime(500)
      expect(status()).toBe('filed')
      expect(screenWriteFailureLine(status())).toBeNull()

      reloadAndContinue()
      expectNamedFields(applied)
    })

    it('a plain Screen autosave that throws, before any Debrief, is not filed', () => {
      const S = reachScreen(false)
      vi.spyOn(storage, 'setItem').mockImplementation(() => {
        throw Object.assign(new Error('denied'), { name: 'SecurityError' })
      })
      useAppStore.getState().goto('world')
      vi.advanceTimersByTime(500)
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'unavailable' })
      expect(storage.getItem(SAVE_KEY)).toBe(S)
    })

    it('a Debrief applied after an earlier failure keeps write-failed (sticky), never unfiled or filed', () => {
      reachScreen(false)
      const restore = failWrites()
      useAppStore.getState().goto('world')
      vi.advanceTimersByTime(500)
      expect(status()).toBe('write-failed')
      restore()
      applyWin(false)
      expect(status()).toBe('write-failed')
      expect(debriefFilingLine(status())).toBe(WRITE_FAILED_LINE)
    })

    it('no storage: writeSave and New Operation report write-failed / unavailable', () => {
      expect(writeSave(null)).toBe(false)
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'unavailable' })
      useSaveStatusStore.getState().reset()
      startNewOperation(null)
      expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'unavailable' })
    })

    it('classifies failures by name, totally', () => {
      const named = (name: string) => Object.assign(new Error('x'), { name })
      expect(classifyWriteFailure(named('QuotaExceededError'))).toBe('quota')
      expect(classifyWriteFailure(named('NS_ERROR_DOM_QUOTA_REACHED'))).toBe('quota')
      expect(classifyWriteFailure(named('SecurityError'))).toBe('unavailable')
      expect(classifyWriteFailure(new TypeError('cyclic'))).toBe('unknown')
      expect(classifyWriteFailure(null)).toBe('unknown')
      expect(classifyWriteFailure('boom')).toBe('unknown')
      expect(classifyWriteFailure({ name: 7 })).toBe('unknown')
    })
  })

  it('startAutosave twice installs one unfiled watcher', () => {
    vi.useFakeTimers()
    stopAutosave = startAutosave(storage)
    expect(startAutosave(storage)).toBe(stopAutosave)
    // Count watcher calls, not store sets: transition() drops a repeated
    // markUnfiled, so a second watcher would not show up as a second set.
    const markUnfiled = vi.spyOn(useSaveStatusStore.getState(), 'markUnfiled')
    useAppStore.setState({ lastAppliedKey: 1 })
    expect(markUnfiled).toHaveBeenCalledTimes(1)
    // A decrease (hydrate / New Operation reset) is ignored.
    useAppStore.setState({ lastAppliedKey: 0 })
    expect(markUnfiled).toHaveBeenCalledTimes(1)
    markUnfiled.mockRestore()
  })
})

describe('saveStatusStore transitions (ADR-0022)', () => {
  beforeEach(() => {
    useSaveStatusStore.getState().reset()
  })

  it('changes only on a transition', () => {
    const sets = vi.fn()
    const unsub = useSaveStatusStore.subscribe(sets)
    useSaveStatusStore.getState().markFiled()
    expect(sets).not.toHaveBeenCalled()
    useSaveStatusStore.getState().markUnfiled()
    useSaveStatusStore.getState().markUnfiled()
    expect(sets).toHaveBeenCalledTimes(1)
    useSaveStatusStore.getState().markWriteFailed('quota')
    useSaveStatusStore.getState().markWriteFailed('quota')
    expect(sets).toHaveBeenCalledTimes(2)
    unsub()
  })

  it('write-failed is sticky against markUnfiled; reason is set iff write-failed', () => {
    const store = useSaveStatusStore.getState()
    store.markUnfiled()
    expect(useSaveStatusStore.getState()).toMatchObject({ status: 'unfiled', reason: null })
    store.markWriteFailed('unknown')
    store.markUnfiled()
    expect(useSaveStatusStore.getState()).toMatchObject({ status: 'write-failed', reason: 'unknown' })
    store.markFiled()
    expect(useSaveStatusStore.getState()).toMatchObject({ status: 'filed', reason: null })
  })
})

// PV-009 (TR-persistence-006, ADR-0011, ADR-0015): settings and telemetry
// garbage fall back on their own slots; neither inherits the campaign
// drop-all policy, so a valid campaign blob still offers Continue.
describe('settings and telemetry garbage fall back independently', () => {
  afterEach(() => {
    initSettings(null)
    useSettingsStore.setState(defaultSettings())
    applyOverrides({})
  })

  // A lived-in campaign written to the campaign slot, with non-default
  // settings recorded beside it so a fallback to defaults is visible.
  function validCampaignOnFile(): SaveV10 {
    initSettings(storage)
    useSettingsStore.getState().setDifficulty('hardened')
    useSettingsStore.getState().setQuality('low')
    useSettingsStore.getState().setTelemetry(true)
    useAppStore.setState({ phase: 'world', credits: 77777, squad: ['op1', 'op3'] })
    useWorldStore.setState({ t: 3300, influence: 5 })
    useCampaignStore.setState({ intelLevel: 1, intelProgress: 20, contractsWon: ['m01'] })
    const save = captureSave()
    expect(writeSave(storage)).toBe(true)
    return save
  }

  // An origin reload: settings memory and bindings back to defaults, the
  // campaign desk back to New Operation on the Menu, storage untouched.
  // Settings boot before the campaign, as in main.tsx.
  function reloadOrigin(): void {
    useSettingsStore.setState(defaultSettings())
    applyOverrides({})
    startNewOperation(null)
    useAppStore.setState({ phase: 'menu' })
    initSettings(storage)
  }

  const badSettings = [
    ['non-JSON', 'settings {{{'],
    ['wrong version', JSON.stringify({ version: 999, difficulty: 'hardened', quality: 'low' })],
    ['non-object', JSON.stringify([1, 2, 3])],
  ] as const

  const badTelemetry = [
    ['non-JSON', 'telemetry {{{'],
    ['wrong version', JSON.stringify({ version: 999, records: [{ missionId: 'm01', outcome: 'won' }] })],
    ['non-array records', JSON.stringify({ version: 1, records: { missionId: 'm01', outcome: 'won' } })],
  ] as const

  it.each(badSettings)('valid campaign + %s settings: Continue present', (_label, raw) => {
    validCampaignOnFile()
    const blob = storage.getItem(SAVE_KEY)
    storage.setItem(SETTINGS_KEY, raw)

    reloadOrigin()
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(menuSaveStatus(storage)).toBe('valid')
    // The campaign slot is not dropped by the settings fallback.
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
  })

  it.each(badTelemetry)(
    'valid campaign + %s telemetry: Continue present, Balance has no mission records',
    (_label, raw) => {
      validCampaignOnFile()
      const blob = storage.getItem(SAVE_KEY)
      storage.setItem(TELEMETRY_KEY, raw)

      reloadOrigin()
      expect(loadCampaignAtBoot(storage)).toBe('valid')
      expect(menuSaveStatus(storage)).toBe('valid')
      expect(storage.getItem(SAVE_KEY)).toBe(blob)
      // Balance reads the log through loadRecords: an empty log, no rows.
      const records = loadRecords(storage)
      expect(records).toEqual([])
      expect(aggregate(records).missions).toBe(0)
      // Settings were valid: they hydrate as recorded, untouched by telemetry.
      expect(useSettingsStore.getState().difficulty).toBe('hardened')
    },
  )

  it.each(badSettings)(
    'valid campaign + %s settings: every Settings value is its default and Continue restores the campaign unchanged',
    (_label, raw) => {
      const expected = validCampaignOnFile()
      storage.setItem(SETTINGS_KEY, raw)

      reloadOrigin()
      // Settings fall back to their own defaults, not to the campaign.
      expect(useSettingsStore.getState()).toMatchObject(defaultSettings())
      expect(loadCampaignAtBoot(storage)).toBe('valid')
      continueOperation()

      expect(useAppStore.getState().phase).toBe('world')
      const restored = captureSave()
      expect(restored).toEqual(expected)
      expect(useAppStore.getState().credits).toBe(77777)
    },
  )
})

describe('hydrate syncs to saved t; RNG streams continue', () => {
  // Origin reload: memory returns to the opening Operation, storage keeps the
  // blob, boot hydrates it to the Menu, and the director presses Continue.
  function reloadAndContinue(): void {
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')
    continueOperation()
    expect(useAppStore.getState().phase).toBe('world')
  }

  // The Screen clock runs in fixed frames. Both sides of every comparison use
  // the same frame, the same Clock speed and the same frame count, so the
  // strategic wait is identical.
  const FRAME_SEC = 1 / 20
  const CLOCK_SPEED = 4
  const WAIT_SEC = 8 * 3600
  const WAIT_FRAMES = Math.ceil(WAIT_SEC / (FRAME_SEC * CLOCK_SPEED * TIME_SCALE))

  function runClock(): void {
    useWorldStore.setState({ speed: CLOCK_SPEED, paused: false })
    for (let i = 0; i < WAIT_FRAMES; i++) useWorldStore.getState().tick(FRAME_SEC)
  }

  // A campaign several world days in: the Feed, the generated market and the
  // candidate market have all moved off the opening Operation.
  function liveInDays(): void {
    useWorldStore.getState().advanceDays(3)
    useCampaignStore.getState().sync(useWorldStore.getState().t)
    useAppStore.setState({ phase: 'world' })
    const opening = initialCampaignData()
    expect(useWorldStore.getState().rngState).not.toBe(INITIAL_WORLD_RNG)
    expect(useWorldStore.getState().contractRngState).not.toBe(INITIAL_CONTRACT_RNG)
    expect(useCampaignStore.getState().recruitRngState).not.toBe(opening.recruitRngState)
  }

  // What a rolled Event or generated contract is, without its id or time.
  const eventIdentity = (e: WorldEvent) => ({ sector: e.sector, kind: e.kind, tone: e.tone, text: e.text })
  const contractIdentity = (c: GeneratedContract) => ({
    sector: c.sector,
    cityId: c.cityId,
    district: c.district,
    type: c.type,
    client: c.client,
    threat: c.threat,
    reward: c.reward,
    seed: c.seed,
  })

  function eventsAfter(lastId: number): WorldEvent[] {
    return useWorldStore.getState().events.filter((e) => e.id > lastId)
  }

  function contractsNotIn(ids: ReadonlySet<string>): GeneratedContract[] {
    return useWorldStore.getState().contracts.filter((c) => !ids.has(c.id))
  }

  it('reload + Continue with no Screen tick: t unchanged, no lab completes, no Tax, Feed, candidate or contract fires', () => {
    liveInDays()
    const T = useWorldStore.getState().t
    // Every process is armed one strategic second after the recorded t.
    expect(useResearchStore.getState().start(nodeById('b-propellants'), T - 3600)).toBe(true)
    const run = useResearchStore.getState().labs.ballistics!
    useResearchStore.setState({ labs: { ...useResearchStore.getState().labs, ballistics: { ...run, endT: T + 1 } } })
    useWorldStore.setState({
      paused: true,
      nextTaxT: T + 1,
      nextEventT: T + 1,
      nextContractT: T + 1,
      contracts: [],
    })
    useCampaignStore.setState({ nextCandidateT: T + 1 })
    const recorded = captureSave()
    const credits = useAppStore.getState().credits
    expect(writeSave(storage)).toBe(true)

    reloadAndContinue()

    const restored = captureSave()
    expect(useWorldStore.getState().t).toBe(T)
    // No laboratory completes: the run is still active and done is unchanged.
    expect(restored.research).toEqual(recorded.research)
    expect(useResearchStore.getState().labs.ballistics).toEqual({ ...run, endT: T + 1 })
    // The identity sync ran at the saved t, not a wall-clock t.
    expect(useResearchStore.getState().lastSyncT).toBe(T)
    // No Tax, Feed or generated-contract fire.
    expect(restored.world).toEqual(recorded.world)
    expect(useAppStore.getState().credits).toBe(credits)
    // No candidate refresh.
    expect(restored.campaign).toEqual(recorded.campaign)
    expect(restored).toEqual(recorded)

    // Control: one Screen second later every armed process does fire, so the
    // fixture really was due and only the reload granted nothing.
    useWorldStore.setState({ speed: 1, paused: false })
    useWorldStore.getState().tick(2 / TIME_SCALE)
    const t2 = useWorldStore.getState().t
    useResearchStore.getState().sync(t2)
    useCampaignStore.getState().sync(t2)
    expect(t2).toBeGreaterThan(T)
    expect(useWorldStore.getState().nextTaxT).toBeGreaterThan(T + 1)
    expect(useWorldStore.getState().nextEventT).toBeGreaterThan(T + 1)
    expect(useWorldStore.getState().nextContractT).toBeGreaterThan(T + 1)
    expect(useWorldStore.getState().contracts.length).toBe(1)
    expect(useResearchStore.getState().done).toContain(run.id)
    expect(useCampaignStore.getState().nextCandidateT).toBeGreaterThan(T + 1)
  })

  it('the next rolled Event after reload + Continue matches the recorded continuation, not the opening sequence', () => {
    liveInDays()
    expect(captureSave().world.events).not.toEqual(useWorldStore.getInitialState().events)
    expect(writeSave(storage)).toBe(true)
    const lastId = useWorldStore.getState().events.at(-1)!.id

    // The recorded continuation: the same campaign kept running in memory.
    runClock()
    const recorded = eventsAfter(lastId)
    expect(recorded.length).toBeGreaterThan(0)

    reloadAndContinue()
    expect(useWorldStore.getState().events.at(-1)!.id).toBe(lastId)
    runClock()
    const continued = eventsAfter(lastId)
    expect(continued).toEqual(recorded)

    // A New Operation over the same wait at the same Clock speed.
    startNewOperation(null)
    const openingLastId = useWorldStore.getState().events.at(-1)!.id
    runClock()
    const opening = eventsAfter(openingLastId)
    expect(opening.length).toBeGreaterThan(0)
    expect(continued.map(eventIdentity)).not.toEqual(opening.map(eventIdentity))
    expect(eventIdentity(continued[0])).not.toEqual(eventIdentity(opening[0]))
  })

  it('the candidate market matches the recorded list; the next refresh continues it, not the opening pool', () => {
    liveInDays()
    const recordedMarket = structuredClone(useCampaignStore.getState().candidates)
    const recordedT = useWorldStore.getState().t
    const refreshT = useCampaignStore.getState().nextCandidateT
    expect(writeSave(storage)).toBe(true)

    // The recorded continuation: the next refresh in memory.
    useCampaignStore.getState().sync(refreshT)
    const recordedNext = structuredClone(useCampaignStore.getState().candidates)
    expect(recordedNext).not.toEqual(recordedMarket)

    reloadAndContinue()
    expect(useWorldStore.getState().t).toBe(recordedT)
    expect(useCampaignStore.getState().candidates).toEqual(recordedMarket)
    expect(useCampaignStore.getState().nextCandidateT).toBe(refreshT)
    useCampaignStore.getState().sync(refreshT)
    expect(useCampaignStore.getState().candidates).toEqual(recordedNext)

    // Not the opening pool, nor the opening pool's first refresh.
    startNewOperation(null)
    const openingPool = structuredClone(useCampaignStore.getState().candidates)
    useCampaignStore.getState().sync(CANDIDATE_REFRESH_SEC)
    const openingNext = useCampaignStore.getState().candidates
    expect(recordedMarket).not.toEqual(openingPool)
    expect(recordedNext).not.toEqual(openingNext)
  })

  it('the next generated contract after reload + Continue matches the recorded continuation, not the opening sequence', () => {
    liveInDays()
    // Leave room in the market so the next generation checkpoint rolls.
    useWorldStore.setState({ contracts: useWorldStore.getState().contracts.slice(0, CONTRACT_TARGET - 1) })
    expect(writeSave(storage)).toBe(true)
    const heldIds = new Set(useWorldStore.getState().contracts.map((c) => c.id))

    runClock()
    const recorded = contractsNotIn(heldIds)
    expect(recorded.length).toBeGreaterThan(0)

    reloadAndContinue()
    runClock()
    const continued = contractsNotIn(heldIds)
    expect(continued).toEqual(recorded)

    // A New Operation over the same wait at the same Clock speed.
    startNewOperation(null)
    runClock()
    const opening = useWorldStore.getState().contracts
    expect(opening.length).toBeGreaterThan(0)
    expect(contractIdentity(continued[0])).not.toEqual(contractIdentity(opening[0]))
  })
})

describe('roster save and reload (RA-025)', () => {
  // An origin reload: memory returns to the opening Operation, storage keeps
  // the blob, boot hydrates it to the Menu, and the director presses Continue.
  function reloadAndContinue(): void {
    startNewOperation(null)
    expect(loadCampaignAtBoot(storage)).toBe('valid')
    expect(useAppStore.getState().phase).toBe('menu')
    continueOperation()
    expect(useAppStore.getState().phase).toBe('world')
  }

  // A roster with every saved field off its opening value: one KIA, one
  // Injured survivor, Experience, a hire, bay pins and filled Item slots.
  function livedInRoster(): void {
    useWorldStore.setState({ t: 2000 })
    useCampaignStore.getState().reportMission(
      'm01',
      settleOutcome({
        applyKey: 1,
        won: true,
        kills: 5,
        casualties: 1,
        timeSec: 500,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: ['op4'],
        survivorHp: { op1: 0.1, op2: 0.8, op3: 0.9 },
        quietReplay: false,
      }),
      2000,
    )
    useAppStore.setState({ phase: 'world', squad: ['op2', 'op3'] })
    const hired = useCampaignStore.getState().candidates[0]
    useAppStore.getState().hireOperative(hired.id)
    expect(useCampaignStore.getState().operatives.at(-1)?.id).toBe(hired.id)
    useCampaignStore.getState().setBay('op2', 'CHEST', 'c-synaptic')
    useCampaignStore.getState().setBay('op3', 'NEURAL', 'STOCK')
    useAppStore.setState({ loadout: { op2: ['med', 'cell'], op3: ['med', null] } })
  }

  it('AC1: roster, pins, Experience, injuries, candidates, Item slots and flags match the pre-save blob; no mission or debrief restored', () => {
    livedInRoster()
    const expected = captureSave()
    expect(validateSave(expected)).toBe(true)
    expect(expected.campaign.roster.op1.status).toBe('INJURED')
    expect(expected.campaign.roster.op2.pins).toEqual({ CHEST: 'c-synaptic' })
    expect(writeSave(storage)).toBe(true)

    // Memory holds a running mission, a Debrief outcome and a report. Hydrate
    // runs over them WITHOUT the New Operation wipe, so it must clear them.
    const savedMissionId = expected.app.missionId
    useAppStore.setState({
      phase: 'mission',
      missionId: 'm02',
      outcome: settleOutcome({
        applyKey: 2,
        won: false,
        kills: 1,
        casualties: 0,
        timeSec: 10,
        civiliansHit: 0,
        reward: 0,
        bonus: 0,
        deadIds: [],
        survivorHp: { op2: 1, op3: 1 },
        quietReplay: false,
      }),
    })
    useCampaignStore.setState({
      lastReport: { kia: [{ id: 'op4', codename: 'x' }], injured: [], xp: [] },
    })
    expect(useAppStore.getState().outcome).not.toBeNull()
    expect(useCampaignStore.getState().lastReport).not.toBeNull()

    const blob = readSave(storage)
    expect(blob).not.toBeNull()
    hydrateSave(blob!)
    const atMenu = useAppStore.getState()
    expect(atMenu.phase).toBe('menu')
    expect(atMenu.missionId).toBe(savedMissionId)
    expect(atMenu.outcome).toBeNull()
    expect(useCampaignStore.getState().lastReport).toBeNull()
    continueOperation()
    expect(useAppStore.getState().phase).toBe('world')

    const restored = captureSave()
    expect(restored.campaign.operatives).toEqual(expected.campaign.operatives)
    expect(restored.campaign.roster).toEqual(expected.campaign.roster)
    expect(restored.campaign.roster.op2.pins).toEqual({ CHEST: 'c-synaptic' })
    expect(restored.campaign.roster.op3.pins).toEqual({ NEURAL: 'STOCK' })
    expect(restored.campaign.roster.op1.xp).toBe(expected.campaign.roster.op1.xp)
    expect(restored.campaign.candidates).toEqual(expected.campaign.candidates)
    expect(restored.campaign.campaignWon).toBe(expected.campaign.campaignWon)
    expect(restored.campaign.campaignFailed).toBe(expected.campaign.campaignFailed)
    expect(restored.campaign.contractsWon).toEqual(expected.campaign.contractsWon)
    expect(restored.campaign).toEqual(expected.campaign)
    expect(restored.app.squad).toEqual(expected.app.squad)
    expect(restored.app.loadout).toEqual({ op2: ['med', 'cell'], op3: ['med', null] })
    expect(useAppStore.getState().outcome).toBeNull()
    expect(useCampaignStore.getState().lastReport).toBeNull()
  })

  it('AC1: a failed campaign is still failed (and not won) after reload', () => {
    livedInRoster()
    useCampaignStore.setState({ campaignFailed: true, campaignWon: false })
    const expected = captureSave()
    expect(expected.campaign.campaignFailed).toBe(true)
    expect(validateSave(expected)).toBe(true)
    expect(writeSave(storage)).toBe(true)

    reloadAndContinue()

    expect(useCampaignStore.getState().campaignFailed).toBe(true)
    expect(useCampaignStore.getState().campaignWon).toBe(false)
    expect(captureSave().campaign).toEqual(expected.campaign)
    // The wipe reset these, so only the blob can bring them back.
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01'])
    expect(useAppStore.getState().squad).toEqual(['op2', 'op3'])
    expect(useAppStore.getState().loadout).toEqual({ op2: ['med', 'cell'], op3: ['med', null] })
  })

  it('AC2: an Injured operative keeps its remaining downtime across reload + Continue with no Screen tick', () => {
    livedInRoster()
    const t = useWorldStore.getState().t
    const before = useCampaignStore.getState().roster.op1
    expect(before.status).toBe('INJURED')
    expect(before.recoverAtT).not.toBeNull()
    const remaining = before.recoverAtT! - t
    expect(remaining).toBeGreaterThan(0)
    expect(writeSave(storage)).toBe(true)

    // The wall clock jumps 48 h between write and reload; game time must not.
    vi.useFakeTimers()
    try {
      vi.setSystemTime(Date.now() + 48 * 3600 * 1000)
      reloadAndContinue()
    } finally {
      vi.useRealTimers()
    }

    const after = useCampaignStore.getState().roster.op1
    expect(useWorldStore.getState().t).toBe(t)
    expect(after.status).toBe('INJURED')
    expect(after.recoverAtT! - useWorldStore.getState().t).toBe(remaining)
    expect(after).toEqual(before)
  })

  it('AC3: a tampered roster (unknown squad id, 3 Item slots, unknown pin, pin in the wrong bay, INJURED without recoverAtT, negative XP) drops the whole blob', () => {
    startNewOperation(new MemoryStorage())
    const fixture = captureSave()
    startNewOperation(storage)
    livedInRoster()
    const save = captureSave()
    // Control: the untampered blob is valid, so each drop below is the tamper's.
    expect(validateSave(save)).toBe(true)

    const unknownSquad = structuredClone(save)
    unknownSquad.app.squad = ['op2', 'op99']
    const slotOverflow = structuredClone(save)
    ;(slotOverflow.app.loadout as Record<string, unknown>).op2 = ['med', 'cell', 'med']

    const unknownPin = structuredClone(save)
    unknownPin.campaign.roster.op2.pins = { CHEST: 'no-such-node' }
    const wrongBayPin = structuredClone(save)
    // k-sensor is a NEURAL project, pinned here under CHEST.
    wrongBayPin.campaign.roster.op2.pins = { CHEST: 'k-sensor' }
    const injuredNoRecovery = structuredClone(save)
    expect(injuredNoRecovery.campaign.roster.op1.status).toBe('INJURED')
    injuredNoRecovery.campaign.roster.op1.recoverAtT = null
    const negativeXp = structuredClone(save)
    negativeXp.campaign.roster.op1.xp = -1

    for (const [name, bad] of [
      ['unknown squad id', unknownSquad],
      ['3 Item slots', slotOverflow],
      ['unknown pin', unknownPin],
      ['pin in the wrong bay', wrongBayPin],
      ['INJURED without recoverAtT', injuredNoRecovery],
      ['negative XP', negativeXp],
    ] as const) {
      expect(validateSave(bad), name).toBe(false)
      storage.setItem(SAVE_KEY, JSON.stringify(bad))
      // Origin reload: memory starts at the New Operation desk on the Menu.
      startNewOperation(null)
      useAppStore.setState({ phase: 'menu' })
      expect(loadCampaignAtBoot(storage), name).toBe('invalid')
      expect(storage.getItem(SAVE_KEY), name).toBeNull()
      expect(useAppStore.getState().phase).toBe('menu')
      // Nothing half-loaded: every section is still the New Operation desk.
      const now = captureSave()
      expect(now.campaign).toEqual(fixture.campaign)
      expect(now.world).toEqual(fixture.world)
      expect(now.research).toEqual(fixture.research)
      expect(now.app).toEqual(fixture.app)
    }
  })

  it('AC4: the candidate market continues from the saved cursor at the next 24 h due, not the opening pool', () => {
    expect(CANDIDATE_REFRESH_SEC).toBe(24 * 3600)
    useWorldStore.getState().advanceDays(3)
    useCampaignStore.getState().sync(useWorldStore.getState().t)
    useAppStore.setState({ phase: 'world' })
    const recordedMarket = structuredClone(useCampaignStore.getState().candidates)
    const recordedCursor = useCampaignStore.getState().recruitRngState
    const due = useCampaignStore.getState().nextCandidateT
    expect(writeSave(storage)).toBe(true)

    // The recorded continuation: the same campaign kept running in memory.
    useCampaignStore.getState().sync(due)
    const recordedNext = structuredClone(useCampaignStore.getState().candidates)
    expect(recordedNext).not.toEqual(recordedMarket)

    reloadAndContinue()
    const market = useCampaignStore.getState().candidates
    // Names and hire figures read the same as before the reload.
    expect(market.map((c) => [c.name, c.codename, c.cost])).toEqual(
      recordedMarket.map((c) => [c.name, c.codename, c.cost]),
    )
    expect(market).toEqual(recordedMarket)
    expect(useCampaignStore.getState().recruitRngState).toBe(recordedCursor)
    expect(useCampaignStore.getState().nextCandidateT).toBe(due)

    useCampaignStore.getState().sync(due)
    expect(useCampaignStore.getState().candidates).toEqual(recordedNext)

    // The cursor advanced past the opening one: it was restored, not reseeded.
    expect(recordedCursor).not.toBe(INITIAL_RECRUIT_RNG)
    expect(useCampaignStore.getState().recruitRngState).not.toBe(INITIAL_RECRUIT_RNG)
  })
})

describe('WN-020: Glass Veil won before the gate moved', () => {
  // ADR-0020: `expectedWin` is the three authored ids, not the gate order. A
  // campaign that won Glass Veil at intel 1 (the pre-2026-10-21 opening
  // contract) still hydrates; the contract reads locked for new deploys and
  // the completion record is whatever the blob carried.
  it('a v10 blob at intel 1 with Glass Veil won validates, hydrates and stays incomplete', () => {
    const save = captureSave()
    save.campaign.intelLevel = 1
    save.campaign.contractsWon = ['m01']
    save.campaign.campaignWon = false
    save.campaign.campaignFailed = false
    expect(validateSave(save)).toBe(true)
    hydrateSave(save)
    const state = useCampaignStore.getState()
    expect(state.intelLevel).toBe(1)
    expect(state.contractsWon).toEqual(['m01'])
    expect(state.campaignWon).toBe(false)
    expect(missionLocked(missionById('m01'), state.intelLevel)).toBe(true)
    expect(missionLocked(missionById('m03'), state.intelLevel)).toBe(false)
    useAppStore.setState({ phase: 'world', missionId: null })
    useAppStore.getState().selectMission('m01')
    expect(useAppStore.getState().missionId).toBeNull()
  })

  it('a complete blob at intel 1 keeps campaignWon through hydrate', () => {
    const save = captureSave()
    save.campaign.intelLevel = 1
    save.campaign.contractsWon = ['m01', 'm02', 'm03']
    save.campaign.campaignWon = true
    save.campaign.campaignFailed = false
    expect(validateSave(save)).toBe(true)
    hydrateSave(save)
    expect(useCampaignStore.getState().campaignWon).toBe(true)
    expect(useCampaignStore.getState().contractsWon).toEqual(['m01', 'm02', 'm03'])
  })
})
