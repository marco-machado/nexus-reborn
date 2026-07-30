import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SQUAD, ROSTER } from '../game/data'
import { CANDIDATE_REFRESH_SEC } from '../game/recruits'
import {
  CONTRACT_MIN_SEC,
  INITIAL_CONTRACT_RNG,
} from '../game/contracts'
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
import type { SaveStorage, SaveV4 } from './save'
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

// A v4 blob without the generated contract market, as a real v3 save held.
function downgradeToV3(save: SaveV4): Record<string, unknown> {
  const blob = structuredClone(save) as unknown as Record<string, unknown>
  blob.version = 3
  const world = blob.world as Record<string, unknown>
  delete world.contracts
  delete world.contractRngState
  delete world.nextContractT
  return blob
}

// Older blobs never carried the live roster: strip the v3 campaign fields so
// the synthetic downgrade matches what a real v1/v2 save held.
function downgradeToV2(save: SaveV4): Record<string, unknown> {
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

    const invalid = structuredClone(save) as SaveV4
    invalid.campaign.contractsWon = ['unknown']
    expect(validateSave(invalid)).toBe(false)
  })

  it('rejects roster tampering: unknown squad ids, roster/operative mismatch', () => {
    const save = captureSave()

    const badSquad = structuredClone(save) as SaveV4
    badSquad.app.squad = ['op99']
    expect(validateSave(badSquad)).toBe(false)

    const badRoster = structuredClone(save) as SaveV4
    delete badRoster.campaign.roster.op1
    expect(validateSave(badRoster)).toBe(false)

    const badCandidate = structuredClone(save) as SaveV4
    badCandidate.campaign.candidates[0].cost = 1
    expect(validateSave(badCandidate)).toBe(false)
  })

  it('accepts a fully wiped roster so a lost campaign can rebuild', () => {
    const wiped = structuredClone(captureSave()) as SaveV4
    wiped.campaign.operatives = []
    wiped.campaign.roster = {}
    wiped.app.squad = []
    wiped.app.loadout = {}
    expect(validateSave(wiped)).toBe(true)
  })

  it('rejects malformed loadouts: unknown ids, wrong lengths, unknown items', () => {
    const save = captureSave()

    const badOp = structuredClone(save) as SaveV4
    badOp.app.loadout = { op99: ['med', null] } as SaveV4['app']['loadout']
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
    expect(loaded?.version).toBe(4)
    expect(loaded?.app.loadout).toEqual({})
    expect(loaded?.campaign.operatives).toEqual(initialCampaignData().operatives)
    expect(loaded?.world.contracts).toEqual([])
    expect(loaded?.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
  })

  it('upgrades a v2 blob by seeding the default roster and candidate market', () => {
    useWorldStore.setState({ t: 5000 })
    const v2 = downgradeToV2(captureSave())
    storage.setItem(SAVE_KEY, JSON.stringify(v2))

    const loaded = readSave(storage)
    expect(loaded).not.toBeNull()
    if (!loaded) return
    const seeded = initialCampaignData()
    expect(loaded.version).toBe(4)
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
    expect(loaded.version).toBe(4)
    expect(loaded.world.contracts).toEqual([])
    expect(loaded.world.contractRngState).toBe(INITIAL_CONTRACT_RNG)
    expect(loaded.world.nextContractT).toBe(9000 + CONTRACT_MIN_SEC)
  })

  it('rejects tampered generated contracts', () => {
    useWorldStore.setState({ nextEventT: 1e12, t: 7199 })
    useWorldStore.getState().tick(1)
    const save = captureSave()
    expect(save.world.contracts.length).toBeGreaterThan(0)
    expect(validateSave(save)).toBe(true)

    const badReward = structuredClone(save) as SaveV4
    badReward.world.contracts[0].reward = 1
    expect(validateSave(badReward)).toBe(false)

    const badClient = structuredClone(save) as SaveV4
    ;(badClient.world.contracts[0] as unknown as Record<string, unknown>).client = 'sable'
    expect(validateSave(badClient)).toBe(false)
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
    expect(campaign.candidates).toEqual(expected.campaign.candidates)
    expect(campaign.recruitRngState).toBe(expected.campaign.recruitRngState)
    expect(campaign.nextCandidateT).toBe(expected.campaign.nextCandidateT)
    expect(useAppStore.getState().credits).toBe(expected.app.credits)
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
    })
    expect(useWorldStore.getState()).toMatchObject({
      t: 0,
      speed: 2,
      paused: false,
    })
    expect(useResearchStore.getState().done).toEqual([])
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
