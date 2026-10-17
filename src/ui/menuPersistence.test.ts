import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NODES } from '../game/research'
import { useResearchStore } from '../state/researchStore'
import { useAppStore } from '../state/appStore'
import { useCampaignStore } from '../state/campaignStore'
import {
  SAVE_KEY,
  captureSave,
  loadCampaignAtBoot,
  menuSaveStatus,
  startNewOperation,
  writeSave,
} from '../state/save'
import type { SaveStorage } from '../state/save'
import { initSettings, useSettingsStore } from '../state/settingsStore'
import {
  balanceEntryVisible,
  clearRecords,
  loadRecords,
  recordAbort,
  recordMissionOutcome,
  saveRecords,
} from '../state/telemetry'
import { settleOutcome } from '../state/appStore'
import type { AbortRecord } from '../state/telemetry'
import { useTutorialStore } from '../state/tutorialStore'
import {
  SAVE_LINE_INVALID,
  SAVE_LINE_NEVER_STARTED,
  SAVE_LINE_VALID,
  continueOffered,
  menuSaveLine,
} from './menuSaveLine'
import { MainMenu } from './index'
import { pressNewOperation } from './newOperationArm'

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

beforeEach(() => {
  storage = new MemoryStorage()
  initSettings(null)
  startNewOperation(storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// The real MainMenu markup for one storage fixture. Static render: the lazy
// useState reads menuSaveStatus() from window.localStorage, as in the browser.
function renderMenu(s: MemoryStorage): string {
  vi.stubGlobal('window', { localStorage: s })
  return renderToString(createElement(MainMenu))
}

function finishedOutcome() {
  return settleOutcome({
    applyKey: 1,
    won: true,
    kills: 3,
    casualties: 0,
    timeSec: 100,
    civiliansHit: 0,
    reward: 1000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
    telemetry: {
      seed: 20870514,
      firstContactSec: null,
      objectiveTimes: [],
      shotsByWeapon: {},
      damageByWeapon: {},
      damageDealt: 0,
      damageTaken: 0,
      civilianHitsBySquad: 0,
      civilianHitsByCorpsec: 0,
      medUsed: 0,
      cellUsed: 0,
      abilityUsesByRole: {},
      squadRoles: ['assault'],
    },
  })
}

function menuFor(s: MemoryStorage) {
  startNewOperation(null)
  useAppStore.setState({ phase: 'menu' })
  const status = loadCampaignAtBoot(s)
  return { status, line: menuSaveLine(status), continueShown: continueOffered(status) }
}

function abortRow(at: number): AbortRecord {
  return {
    at,
    missionId: 'm01',
    outcome: 'aborted',
    durationSec: 12,
    seed: 20870514,
    squadRoles: ['assault'],
  }
}

describe('Menu Continue and save line (AC9, AC21)', () => {
  it('never-started: Continue absent, line says no campaign', () => {
    storage.removeItem(SAVE_KEY)
    const m = menuFor(storage)
    expect(m.continueShown).toBe(false)
    expect(m.line).toBe(SAVE_LINE_NEVER_STARTED)
  })

  it('invalid blob: Continue absent, visible reason distinct from never-started', () => {
    storage.setItem(SAVE_KEY, '{not json')
    const m = menuFor(storage)
    expect(m.continueShown).toBe(false)
    expect(m.line).toBe(SAVE_LINE_INVALID)
    expect(m.line).not.toBe(SAVE_LINE_NEVER_STARTED)
    // The Menu reads menuSaveStatus(); the boot drop removed the blob, so only
    // the dropped-at-boot flag keeps this from reading as never-started.
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(menuSaveStatus(storage)).toBe('invalid')
  })

  it('valid blob: Continue present, line says on file', () => {
    expect(writeSave(storage)).toBe(true)
    const m = menuFor(storage)
    expect(m.continueShown).toBe(true)
    expect(m.line).toBe(SAVE_LINE_VALID)
    expect(menuSaveStatus(storage)).toBe('valid')
  })

  it('MainMenu markup: never-started has no Continue and says no campaign', () => {
    startNewOperation(null)
    loadCampaignAtBoot(storage)
    const html = renderMenu(storage)
    expect(html).not.toContain('CONTINUE SAVED OPERATION')
    expect(html).toContain('menu-save-line')
    expect(html).toContain(SAVE_LINE_NEVER_STARTED)
    expect(html).not.toContain('data-invalid')
    expect(html).toContain('data-save-status="never-started"')
  })

  it('MainMenu markup: invalid has no Continue, shows the reason and data-invalid', () => {
    storage.setItem(SAVE_KEY, '{not json')
    startNewOperation(null)
    loadCampaignAtBoot(storage)
    const html = renderMenu(storage)
    expect(html).not.toContain('CONTINUE SAVED OPERATION')
    expect(html).toContain(SAVE_LINE_INVALID)
    expect(html).toContain('data-invalid=""')
    expect(html).toContain('data-save-status="invalid"')
  })

  it('MainMenu markup: valid has the Continue button and the on-file line', () => {
    expect(writeSave(storage)).toBe(true)
    startNewOperation(null)
    loadCampaignAtBoot(storage)
    const html = renderMenu(storage)
    expect(html).toContain('CONTINUE SAVED OPERATION')
    expect(html).toContain(SAVE_LINE_VALID)
    expect(html).not.toContain('data-invalid')
    expect(html).toContain('data-save-status="valid"')
    expect(html).toContain('NEW OPERATION')
  })

  it('the three lines are all different', () => {
    expect(new Set([SAVE_LINE_VALID, SAVE_LINE_NEVER_STARTED, SAVE_LINE_INVALID]).size).toBe(3)
  })
})

describe('New Operation keeps Settings and resets the campaign (AC17)', () => {
  it('first press arms without touching the blob; confirm resets campaign, keeps Settings', () => {
    const fresh = captureSave()
    const s = useSettingsStore.getState()
    s.setDifficulty('hardened')
    s.setQuality('low')
    s.setTextScale(125)
    s.setTelemetry(true)
    s.setBindingOverride('holdGround', ['KeyJ'])
    const kept = {
      difficulty: 'hardened',
      quality: 'low',
      textScale: 125,
      telemetry: true,
      overrides: useSettingsStore.getState().overrides,
    }
    useAppStore.setState({ phase: 'world', credits: 77777 })
    useCampaignStore.setState({ intelLevel: 2, intelProgress: 30, contractsWon: ['m01'] })
    useTutorialStore.getState().skipTutorial()
    const lab = NODES.find((n) => n.needs.length === 0)
    if (!lab) throw new Error('no root research node')
    expect(useResearchStore.getState().start(lab, 0)).toBe(true)
    // The progressed campaign is observable and differs from fresh in every
    // field the confirm must erase.
    const progressed = captureSave()
    expect(progressed.app.credits).not.toBe(fresh.app.credits)
    expect(progressed.campaign.intelLevel).not.toBe(fresh.campaign.intelLevel)
    expect(progressed.campaign.intelProgress).not.toBe(fresh.campaign.intelProgress)
    expect(progressed.campaign.contractsWon).not.toEqual(fresh.campaign.contractsWon)
    expect(progressed.research.labs).not.toEqual(fresh.research.labs)
    expect(progressed.tutorial).not.toEqual(fresh.tutorial)
    expect(writeSave(storage)).toBe(true)
    const blob = storage.getItem(SAVE_KEY)

    const canContinue = menuFor(storage).continueShown
    expect(canContinue).toBe(true)
    expect(pressNewOperation(canContinue, false)).toBe('arm')
    expect(storage.getItem(SAVE_KEY)).toBe(blob)
    expect(pressNewOperation(canContinue, true)).toBe('confirm')
    startNewOperation(storage)

    const now = captureSave()
    expect(now.app.credits).toBe(fresh.app.credits)
    expect(now.campaign.intelLevel).toBe(fresh.campaign.intelLevel)
    expect(now.campaign.intelProgress).toBe(fresh.campaign.intelProgress)
    expect(now.campaign.contractsWon).toEqual(fresh.campaign.contractsWon)
    expect(now.research.labs).toEqual(fresh.research.labs)
    expect(now.tutorial).toEqual(fresh.tutorial)
    const after = useSettingsStore.getState()
    expect(after.difficulty).toBe(kept.difficulty)
    expect(after.quality).toBe(kept.quality)
    expect(after.textScale).toBe(kept.textScale)
    expect(after.telemetry).toBe(kept.telemetry)
    expect(after.overrides).toEqual(kept.overrides)
    expect(Object.keys(after.overrides)).toContain('holdGround')
  })
})

describe('telemetry persistence chrome (AC25)', () => {
  it('disabled interval adds no record; earlier records stay; Clear empties; New Operation keeps', () => {
    const settings = useSettingsStore.getState()
    settings.setTelemetry(true)
    saveRecords([abortRow(1), abortRow(2)], storage)

    settings.setTelemetry(false)
    recordAbort('m02', 5, 1, ['assault'], storage)
    expect(loadRecords(storage)).toHaveLength(2)
    recordMissionOutcome('m02', finishedOutcome(), storage)
    expect(loadRecords(storage)).toHaveLength(2)
    // Balance entry follows the log, not the toggle.
    expect(useSettingsStore.getState().telemetry).toBe(false)
    expect(balanceEntryVisible(loadRecords(storage))).toBe(true)

    settings.setTelemetry(true)
    expect(loadRecords(storage)).toHaveLength(2)
    expect(loadRecords(storage).map((r) => r.at)).toEqual([1, 2])

    startNewOperation(storage)
    expect(loadRecords(storage)).toHaveLength(2)
    expect(balanceEntryVisible(loadRecords(storage))).toBe(true)

    clearRecords(storage)
    expect(loadRecords(storage)).toHaveLength(0)
    expect(balanceEntryVisible(loadRecords(storage))).toBe(false)

    // Positive control: with recording on, the same calls do write, so the
    // disabled interval above is the toggle at work, not a dead recorder.
    expect(useSettingsStore.getState().telemetry).toBe(true)
    recordAbort('m02', 5, 1, ['assault'], storage)
    expect(loadRecords(storage)).toHaveLength(1)
    recordMissionOutcome('m02', finishedOutcome(), storage)
    expect(loadRecords(storage)).toHaveLength(2)
  })
})
