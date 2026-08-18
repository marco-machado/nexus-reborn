import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SQUAD, ROSTER } from '../game/data'
import { CANDIDATE_REFRESH_SEC } from '../game/recruits'
import {
  CONTRACT_MIN_SEC,
  INITIAL_CONTRACT_RNG,
} from '../game/contracts'
import {
  PRESSURE_INTERVAL_SEC,
  TRICKLE_INTERVAL_SEC,
} from '../game/influence'
import { nodeById } from '../game/research'
import { useAppStore } from './appStore'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import {
  SAVE_KEY,
  captureSave,
  hydrateSave,
  readSave,
  startAutosave,
  startNewOperation,
  validateSave,
  writeSave,
} from './save'
import type { SaveStorage, SaveV8 } from './save'
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

// A v8 blob without bay pins, as a real v7 save held.
function downgradeToV7(save: SaveV8): Record<string, unknown> {
  const blob = structuredClone(save) as unknown as Record<string, unknown>
  blob.version = 7
  const campaign = blob.campaign as Record<string, unknown>
  const roster = campaign.roster as Record<string, Record<string, unknown>>
  for (const entry of Object.values(roster)) delete entry.pins
  return blob
}

// A v7 blob without campaignFailed or roster XP, as a real v6 save held.
function downgradeToV6(save: SaveV8): Record<string, unknown> {
  const blob = downgradeToV7(save)
  blob.version = 6
  const campaign = blob.campaign as Record<string, unknown>
  delete campaign.campaignFailed
  const roster = campaign.roster as Record<string, Record<string, unknown>>
  for (const entry of Object.values(roster)) delete entry.xp
  return blob
}

// A v6 blob without the tutorial section, as a real v5 save held.
function downgradeToV5(save: SaveV8): Record<string, unknown> {
  const blob = downgradeToV6(save)
  blob.version = 5
  delete blob.tutorial
  return blob
}

// A v5 blob without the influence economy or unrest pressure, as a real v4
// save held: no world influence fields and no expedited flag on contracts.
function downgradeToV4(save: SaveV8): Record<string, unknown> {
  const blob = downgradeToV5(save)
  blob.version = 4
  const world = blob.world as Record<string, unknown>
  delete world.influence
  delete world.nextTrickleT
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
function downgradeToV3(save: SaveV8): Record<string, unknown> {
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
function downgradeToV2(save: SaveV8): Record<string, unknown> {
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

    const invalid = structuredClone(save) as SaveV8
    invalid.campaign.contractsWon = ['unknown']
    expect(validateSave(invalid)).toBe(false)
  })

  it('rejects roster tampering: unknown squad ids, roster/operative mismatch', () => {
    const save = captureSave()

    const badSquad = structuredClone(save) as SaveV8
    badSquad.app.squad = ['op99']
    expect(validateSave(badSquad)).toBe(false)

    const badRoster = structuredClone(save) as SaveV8
    delete badRoster.campaign.roster.op1
    expect(validateSave(badRoster)).toBe(false)

    const badCandidate = structuredClone(save) as SaveV8
    badCandidate.campaign.candidates[0].cost = 1
    expect(validateSave(badCandidate)).toBe(false)
  })

  it('accepts a fully wiped roster so a lost campaign can rebuild', () => {
    const wiped = structuredClone(captureSave()) as SaveV8
    wiped.campaign.operatives = []
    wiped.campaign.roster = {}
    wiped.app.squad = []
    wiped.app.loadout = {}
    expect(validateSave(wiped)).toBe(true)
  })

  it('rejects malformed loadouts: unknown ids, wrong lengths, unknown items', () => {
    const save = captureSave()

    const badOp = structuredClone(save) as SaveV8
    badOp.app.loadout = { op99: ['med', null] } as SaveV8['app']['loadout']
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
    expect(loaded?.version).toBe(8)
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
    expect(loaded.version).toBe(8)
    expect(loaded.campaign.operatives.map((o) => o.id)).toEqual(ROSTER.map((o) => o.id))
    expect(loaded.campaign.candidates).toEqual(seeded.candidates)
    expect(loaded.campaign.recruitRngState).toBe(seeded.recruitRngState)
    expect(loaded.campaign.nextCandidateT).toBe(5000 + CANDIDATE_REFRESH_SEC)
  })

  it('upgrades a v3 blob by starting an empty contract market on the world clock', () => {
    useWorldStore.setState({ t: 9000 })
    const v3 = downgradeToV3(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v3))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(8)
    expect(loaded.world.contracts).toEqual([])
    expect(loaded.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
    expect(loaded.world.nextContractT).toBe(9000 + CONTRACT_MIN_SEC)
  })

  it('upgrades a v4 blob: zero points, unexpedited contracts, armed pressure timers', () => {
    // Two generated contracts on the clock, one sector already past the
    // pressure threshold, saved as a v4 blob.
    useWorldStore.setState({ nextEventT: 1e12, nextTrickleT: 1e12, t: 7199 })
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
    expect(loaded.version).toBe(8)
    expect(loaded.world.influence).toBe(0)
    expect(loaded.world.nextTrickleT).toBe(loaded.world.t + TRICKLE_INTERVAL_SEC)
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
    expect(loaded.version).toBe(8)
    // The pre-tutorial campaign starts the prompts from scratch.
    expect(loaded.tutorial.seen).toEqual([])
  })

  it('upgrades a v6 blob with campaignFailed false and zero XP', () => {
    const v6 = downgradeToV6(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v6))
    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    expect(loaded.version).toBe(8)
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
    expect(loaded.version).toBe(8)
    expect(Object.values(loaded.campaign.roster).every((e) => e.pins && Object.keys(e.pins).length === 0)).toBe(true)
  })

  it('rejects a blob that is both campaign-won and campaign-failed', () => {
    const save = captureSave()
    save.campaign.campaignWon = true
    save.campaign.campaignFailed = true
    save.campaign.contractsWon = ['m01', 'm02', 'm03']
    expect(validateSave(save)).toBe(false)
  })

  it('rejects tampered tutorial history', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const badId = structuredClone(save) as SaveV8
    badId.tutorial.seen = ['tut-select', 'not-a-real-id']
    expect(validateSave(badId)).toBe(false)

    const duplicate = structuredClone(save) as SaveV8
    duplicate.tutorial.seen = ['tut-select', 'tut-select']
    expect(validateSave(duplicate)).toBe(false)

    const missing = structuredClone(save) as unknown as Record<string, unknown>
    delete missing.tutorial
    expect(validateSave(missing)).toBe(false)

    const good = structuredClone(save) as SaveV8
    good.tutorial.seen = ['tut-select', 'hint-lowhp', 'hint-worldmap']
    expect(validateSave(good)).toBe(true)
  })

  it('rejects tampered generated contracts', () => {
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    const save = captureSave()
    expect(save.world.contracts.length).toBeGreaterThan(0)
    expect(validateSave(save)).toBe(true)

    const badReward = structuredClone(save) as SaveV8
    badReward.world.contracts[0].reward = 1
    expect(validateSave(badReward)).toBe(false)

    const badClient = structuredClone(save) as SaveV8
    ;(badClient.world.contracts[0] as unknown as Record<string, unknown>).client = 'sable'
    expect(validateSave(badClient)).toBe(false)
  })

  it('rejects tampered influence, spends, cooldowns, crisis, and pressure', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const badPoints = structuredClone(save) as SaveV8
    badPoints.world.influence = -3
    expect(validateSave(badPoints)).toBe(false)

    const badSpend = structuredClone(save) as SaveV8
    badSpend.world.spends = [
      { action: 'stabilize', sector: 'eu', nextT: 100, remaining: 99 },
    ]
    expect(validateSave(badSpend)).toBe(false)

    const badCooldown = structuredClone(save) as SaveV8
    badCooldown.world.cooldowns = { 'eu:bribe': 100 }
    expect(validateSave(badCooldown)).toBe(false)

    const badCrisis = structuredClone(save) as SaveV8
    badCrisis.world.crisis = ['an' as SaveV8['world']['crisis'][number]]
    expect(validateSave(badCrisis)).toBe(false)

    const badPressure = structuredClone(save) as SaveV8
    badPressure.world.pressure = { zz: 100 }
    expect(validateSave(badPressure)).toBe(false)

    const goodSpend = structuredClone(save) as SaveV8
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

describe('save round trip', () => {
  it('restores all four stores while resetting transient view and outcome state', () => {
    useAppStore.setState({
      credits: 222333,
      squad: ['op1', 'op3', 'op6'],
      loadout: { op1: ['med', 'cell'], op3: [null, 'med'] },
    })
    useWorldStore.setState({ t: 1000, speed: 4, paused: true, selected: 'as', review: 500 })
    useWorldStore.getState().applyMissionResult('m01', {
      won: true,
      kills: 7,
      casualties: 0,
      timeSec: 300,
      civiliansHit: 1,
      reward: 85000,
      bonus: 0,
      deadIds: [],
      survivorHp: {},
    })
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
      outcomeSerial: 0,
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
      nextTrickleT: expected.world.nextTrickleT,
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
      outcomeApplied: 0,
      lastReport: null,
    })
  })

  it('reproduces a lived-in roster exactly: a loss, an injury, and a hire', () => {
    // One KIA opens a bay, one survivor comes back hurt, and a candidate signs.
    useCampaignStore.getState().reportMission(
      'm01',
      {
        won: true,
        kills: 5,
        casualties: 1,
        timeSec: 500,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: ['op4'],
        survivorHp: { op1: 0.1, op2: 0.8, op3: 0.9 },
      },
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
      {
        won: false,
        kills: 0,
        casualties: ids.length,
        timeSec: 10,
        civiliansHit: 0,
        reward: 0,
        bonus: 0,
        deadIds: ids,
        survivorHp: {},
      },
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
