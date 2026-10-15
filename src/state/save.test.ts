import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SQUAD, ROSTER } from '../game/data'
import { CANDIDATE_REFRESH_SEC } from '../game/recruits'
import {
  CONTRACT_MIN_SEC,
  INITIAL_CONTRACT_RNG,
} from '../game/contracts'
import {
  PRESSURE_INTERVAL_SEC,
  TAX_INTERVAL_SEC,
} from '../game/influence'
import { nodeById } from '../game/research'
import { settleOutcome, useAppStore } from './appStore'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import {
  SAVE_KEY,
  captureSave,
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
import { useTutorialStore } from './tutorialStore'
import { useWorldStore } from './worldStore'

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
    expect(expected.world.contracts).toHaveLength(2)
    expect(writeSave(storage)).toBe(true)

    startNewOperation()
    expect(useWorldStore.getState().contracts).toEqual([])
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
