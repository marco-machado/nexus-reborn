import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SQUAD } from '../game/data'
import { nodeById } from '../game/research'
import { useAppStore } from './appStore'
import { useCampaignStore } from './campaignStore'
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
import type { SaveStorage, SaveV1 } from './save'
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

describe('save validation', () => {
  it('accepts a captured V1 campaign and rejects unknown ids', () => {
    const save = captureSave()
    expect(validateSave(save)).toBe(true)

    const invalid = structuredClone(save) as SaveV1
    invalid.campaign.contractsWon = ['unknown']
    expect(validateSave(invalid)).toBe(false)
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
    useAppStore.setState({ credits: 222333, squad: ['op1', 'op3', 'op6'] })
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
    useAppStore.setState({ credits: 1, squad: [] })
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
      roster: expected.campaign.roster,
      contractsWon: expected.campaign.contractsWon,
      campaignWon: expected.campaign.campaignWon,
      outcomeApplied: 0,
    })
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
