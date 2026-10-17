import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MISSIONS } from '../game/data'
import { settleOutcome, useAppStore } from '../state/appStore'
import { missionLocked, useCampaignStore } from '../state/campaignStore'
import { applyDebrief } from '../state/debrief'
import { freezeDeploy } from '../state/deployFreeze'
import { startAutosave, startNewOperation } from '../state/save'
import type { SaveStorage } from '../state/save'
import { useSaveStatusStore } from '../state/saveStatusStore'
import { resolveMission } from '../state/worldStore'
import {
  UNFILED_LINE,
  WRITE_FAILED_LINE,
  debriefFilingLine,
  screenWriteFailureLine,
} from './filingStatus'

describe('debriefFilingLine (P-19, PV-017)', () => {
  it('unfiled prints the unfiled sentence', () => {
    expect(debriefFilingLine('unfiled')).toBe(UNFILED_LINE)
    expect(UNFILED_LINE.length).toBeGreaterThan(0)
  })

  it('filed removes the unfiled sentence (not a colour swap)', () => {
    expect(debriefFilingLine('filed')).toBeNull()
  })

  it('write-failed prints the failure sentence, never the filed state (PV-018)', () => {
    expect(debriefFilingLine('write-failed')).toBe(WRITE_FAILED_LINE)
    expect(WRITE_FAILED_LINE).not.toBe(UNFILED_LINE)
  })
})

describe('screenWriteFailureLine (P-11, PV-018)', () => {
  it('only write-failed shows the Screen advisory', () => {
    expect(screenWriteFailureLine('write-failed')).toBe(WRITE_FAILED_LINE)
    expect(screenWriteFailureLine('unfiled')).toBeNull()
    expect(screenWriteFailureLine('filed')).toBeNull()
  })
})

// IF-010 (Interface AC22, AC23; ADR-0022). The Debrief and Screen lines are
// driven through Persistence's real seams: an applied Debrief, the autosave
// timer and a storage that can be made to throw. Navigation alone never clears
// unfiled; only the write the autosave reports does.
describe('IF-010: filing status read through Persistence', () => {
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
  let C: string
  const status = () => useSaveStatusStore.getState().status
  const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' })

  beforeEach(() => {
    vi.useFakeTimers()
    storage = new MemoryStorage()
    startNewOperation(storage)
    stopAutosave = startAutosave(storage)
    C = MISSIONS.find((m) => m.id !== 'm01' && !missionLocked(m, 2))!.id
    useCampaignStore.setState({ intelLevel: 2, contractsWon: ['m01'] })
    useAppStore.getState().selectMission(C)
    useAppStore.getState().goto('team')
    vi.advanceTimersByTime(500)
    expect(status()).toBe('filed')
  })

  afterEach(() => {
    stopAutosave?.()
    stopAutosave = null
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  // Deploy and apply a won Debrief the way the Debrief screen does.
  function applyDebriefWin(): void {
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
        kills: 2,
        casualties: 0,
        timeSec: 180,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [],
        survivorHp: {},
        quietReplay: false,
      }),
    )
    applyDebrief(C)
  }

  function failWrites(): void {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw quota()
    })
    vi.spyOn(storage, 'removeItem').mockImplementation(() => {
      throw quota()
    })
  }

  const exits: [string, () => void][] = [
    ['World Network return', () => useAppStore.getState().returnFromDebrief()],
    ['Brief Replay', () => useAppStore.getState().goto('brief')],
  ]

  it('AC22: an applied in-memory Debrief reads unfiled before any Screen return', () => {
    applyDebriefWin()
    expect(useAppStore.getState().phase).toBe('debrief')
    expect(debriefFilingLine(status())).toBe(UNFILED_LINE)
    // Interface never saves on Debrief: time on Debrief does not file it.
    vi.advanceTimersByTime(5_000)
    expect(debriefFilingLine(status())).toBe(UNFILED_LINE)
  })

  it.each(exits)('AC22 %s: unfiled until the Screen autosave lands, then filed', (_label, leave) => {
    applyDebriefWin()
    leave()
    // Navigation is not the success signal.
    expect(status()).toBe('unfiled')
    vi.advanceTimersByTime(500)
    expect(status()).toBe('filed')
    expect(debriefFilingLine(status())).toBeNull()
    expect(screenWriteFailureLine(status())).toBeNull()
  })

  it.each(exits)('AC23 %s: the first Screen write fails; the Screen shows failure and the invoice is not filed', (_label, leave) => {
    applyDebriefWin()
    failWrites()
    leave()
    vi.advanceTimersByTime(500)
    expect(status()).toBe('write-failed')
    expect(screenWriteFailureLine(status())).toBe(WRITE_FAILED_LINE)
    expect(debriefFilingLine(status())).toBe(WRITE_FAILED_LINE)
    expect(debriefFilingLine(status())).not.toBeNull()
  })

  it('AC23: a failed New Operation erase shows failure on the World Network, not an erased/filed house', () => {
    failWrites()
    startNewOperation(storage)
    expect(useAppStore.getState().phase).toBe('world')
    expect(screenWriteFailureLine(status())).toBe(WRITE_FAILED_LINE)
    vi.advanceTimersByTime(1_000)
    expect(screenWriteFailureLine(status())).toBe(WRITE_FAILED_LINE)
  })
})
