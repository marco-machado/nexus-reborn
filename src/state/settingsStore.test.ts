import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyOverrides, bindingFor } from '../game/bindings'
import {
  SETTINGS_KEY,
  SETTINGS_VERSION,
  defaultSettings,
  initSettings,
  loadSettings,
  stagedGain,
  useSettingsStore,
} from './settingsStore'
import type { SettingsStorage } from './settingsStore'

class MemoryStorage implements SettingsStorage {
  data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  initSettings(storage)
})

afterEach(() => {
  initSettings(null)
  applyOverrides({})
})

function stored(): Record<string, unknown> {
  const raw = storage.getItem(SETTINGS_KEY)
  expect(raw).not.toBeNull()
  return JSON.parse(raw as string) as Record<string, unknown>
}

describe('volume staging', () => {
  it('multiplies master and channel and zeroes on mute', () => {
    expect(stagedGain(100, 100, false)).toBe(1)
    expect(stagedGain(50, 50, false)).toBe(0.25)
    expect(stagedGain(0, 100, false)).toBe(0)
    expect(stagedGain(100, 0, false)).toBe(0)
    expect(stagedGain(100, 100, true)).toBe(0)
    expect(stagedGain(80, 25, false)).toBeCloseTo(0.2)
  })

  it('clamps out-of-range and non-finite inputs', () => {
    expect(stagedGain(200, 100, false)).toBe(1)
    expect(stagedGain(-10, 100, false)).toBe(0)
    expect(stagedGain(Number.NaN, 100, false)).toBe(1)
  })
})

describe('persistence', () => {
  it('writes a versioned blob on every change and reads it back', () => {
    useSettingsStore.getState().setVolume('master', 40)
    useSettingsStore.getState().setMuted(true)
    useSettingsStore.getState().setTextScale(125)
    expect(stored()).toMatchObject({
      version: SETTINGS_VERSION,
      masterVol: 40,
      muted: true,
      textScale: 125,
    })
    const loaded = loadSettings(storage)
    expect(loaded.masterVol).toBe(40)
    expect(loaded.muted).toBe(true)
    expect(loaded.textScale).toBe(125)
  })

  it('rounds and clamps slider values', () => {
    useSettingsStore.getState().setVolume('ui', 33.4)
    expect(useSettingsStore.getState().uiVol).toBe(33)
    useSettingsStore.getState().setVolume('ui', 250)
    expect(useSettingsStore.getState().uiVol).toBe(100)
    useSettingsStore.getState().setVolume('ui', -5)
    expect(useSettingsStore.getState().uiVol).toBe(0)
  })

  it('rejects a wrong version, garbage, and bad fields', () => {
    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 99, masterVol: 10, muted: true }),
    )
    expect(loadSettings(storage)).toEqual(defaultSettings())

    storage.setItem(SETTINGS_KEY, '{not-json')
    expect(loadSettings(storage)).toEqual(defaultSettings())

    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        version: SETTINGS_VERSION,
        masterVol: 'loud',
        uiVol: 260,
        textScale: 300,
        muted: 'yes',
        overrides: { pause: ['KeyP'] },
      }),
    )
    const cleaned = loadSettings(storage)
    expect(cleaned.masterVol).toBe(100)
    expect(cleaned.uiVol).toBe(100)
    expect(cleaned.textScale).toBe(100)
    expect(cleaned.muted).toBe(false)
    expect(cleaned.overrides).toEqual({})
  })

  it('survives a missing storage surface', () => {
    expect(loadSettings(null)).toEqual(defaultSettings())
    initSettings(null)
    // Changes still land in memory with nothing to write to.
    useSettingsStore.getState().setVolume('combat', 10)
    expect(useSettingsStore.getState().combatVol).toBe(10)
  })
})

describe('binding overrides through the store', () => {
  it('applies, merges, and persists overrides onto the live table', () => {
    useSettingsStore.getState().setBindingOverride('holdGround', ['KeyJ'])
    expect(bindingFor('KeyJ')?.id).toBe('holdGround')
    expect(bindingFor('KeyH')).toBeUndefined()
    useSettingsStore.getState().setBindingOverride('stop', ['KeyH'])
    expect(bindingFor('KeyH')?.id).toBe('stop')
    expect(stored().overrides).toEqual({ stop: ['KeyH'], holdGround: ['KeyJ'] })
    // Boot from the same blob reproduces the table.
    applyOverrides({})
    initSettings(storage)
    expect(bindingFor('KeyJ')?.id).toBe('holdGround')
    expect(bindingFor('KeyH')?.id).toBe('stop')
  })

  it('rejects a conflicting override instead of storing it', () => {
    useSettingsStore.getState().setBindingOverride('stop', ['KeyH'])
    expect(useSettingsStore.getState().overrides).toEqual({})
    expect(bindingFor('KeyH')?.id).toBe('holdGround')
  })

  it('resets a single action and the whole table', () => {
    useSettingsStore.getState().setBindingOverride('holdGround', ['KeyJ'])
    useSettingsStore.getState().setBindingOverride('swapWeapon', ['KeyT'])
    useSettingsStore.getState().clearBindingOverride('holdGround')
    expect(bindingFor('KeyH')?.id).toBe('holdGround')
    expect(bindingFor('KeyT')?.id).toBe('swapWeapon')
    useSettingsStore.getState().resetBindings()
    expect(useSettingsStore.getState().overrides).toEqual({})
    expect(bindingFor('KeyV')?.id).toBe('swapWeapon')
    expect(bindingFor('KeyT')).toBeUndefined()
  })
})

describe('render quality setting', () => {
  it('defaults to AUTO, persists a change, and sanitizes garbage', () => {
    expect(defaultSettings().quality).toBe('auto')
    useSettingsStore.getState().setQuality('low')
    expect(stored()).toMatchObject({ quality: 'low' })
    expect(loadSettings(storage).quality).toBe('low')

    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: SETTINGS_VERSION, quality: 'ultra' }),
    )
    expect(loadSettings(storage).quality).toBe('auto')

    // An invalid runtime value is refused without touching the stored choice.
    useSettingsStore.getState().setQuality('ultra' as never)
    expect(useSettingsStore.getState().quality).toBe('low')
  })
})
