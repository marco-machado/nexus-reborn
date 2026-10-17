import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyOverrides, bindingFor } from '../game/bindings'
import {
  SETTINGS_KEY,
  SETTINGS_VERSION,
  TEXT_SCALES,
  defaultSettings,
  initSettings,
  loadSettings,
  stagedGain,
  useSettingsStore,
} from './settingsStore'
import { startNewOperation } from './save'
import type { SettingsStorage, TextScale } from './settingsStore'

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

describe('difficulty and bed levels', () => {
  it('persists HARDENED and the music/ambience sliders', () => {
    useSettingsStore.getState().setDifficulty('hardened')
    useSettingsStore.getState().setVolume('music', 40)
    useSettingsStore.getState().setVolume('ambience', 25)
    expect(stored()).toMatchObject({
      difficulty: 'hardened',
      musicVol: 40,
      ambienceVol: 25,
    })
    expect(loadSettings(storage).difficulty).toBe('hardened')
    expect(loadSettings(storage).musicVol).toBe(40)
    expect(loadSettings(storage).ambienceVol).toBe(25)

    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: SETTINGS_VERSION, difficulty: 'nightmare' }),
    )
    expect(loadSettings(storage).difficulty).toBe('standard')
  })

  it('keeps the chosen difficulty after NEW OPERATION', () => {
    useSettingsStore.getState().setDifficulty('hardened')
    startNewOperation()
    expect(useSettingsStore.getState().difficulty).toBe('hardened')
    initSettings(storage)
    expect(useSettingsStore.getState().difficulty).toBe('hardened')
  })

  it('pushes music and ambience sliders into the audio pipeline', async () => {
    await import('../game/audio')
    useSettingsStore.getState().setVolume('music', 40)
    useSettingsStore.getState().setVolume('ambience', 50)
    await Promise.resolve()
    const { getAudioLevels } = await import('../game/audio')
    expect(getAudioLevels().music).toBeCloseTo(0.4)
    expect(getAudioLevels().ambience).toBeCloseTo(0.5)
  })
})

describe('settings envelope survives New Operation and reload', () => {
  // Settings recorded as D, Q, T, A, R: every field differs from the default.
  function recordDQTAR(): void {
    const s = useSettingsStore.getState()
    s.setDifficulty('hardened')
    s.setQuality('low')
    s.setTelemetry(true)
    s.setVolume('master', 40)
    s.setVolume('music', 25)
    s.setMuted(true)
    s.setBindingOverride('holdGround', ['KeyJ'])
  }

  function expectDQTAR(): void {
    const s = useSettingsStore.getState()
    expect(s.difficulty).toBe('hardened')
    expect(s.quality).toBe('low')
    expect(s.telemetry).toBe(true)
    expect(s.masterVol).toBe(40)
    expect(s.musicVol).toBe(25)
    expect(s.muted).toBe(true)
    expect(s.overrides).toEqual({ holdGround: ['KeyJ'] })
    // Remap R is a binding override applied to the live table.
    expect(bindingFor('KeyJ')?.id).toBe('holdGround')
    expect(bindingFor('KeyH')).toBeUndefined()
  }

  it('keeps D, Q, T, A, R in memory and in the settings slot after New Operation', () => {
    recordDQTAR()
    const before = storage.getItem(SETTINGS_KEY)
    startNewOperation(null)
    expectDQTAR()
    expect(storage.getItem(SETTINGS_KEY)).toBe(before)
  })

  it('hydrates D, Q, T, A, R on a full origin reload with no campaign and no Continue', () => {
    recordDQTAR()
    // Origin reload: memory and the live binding table go back to defaults;
    // storage keeps only the settings slot (no campaign blob was ever written).
    useSettingsStore.setState(defaultSettings())
    applyOverrides({})
    expect(useSettingsStore.getState().difficulty).toBe('standard')
    initSettings(storage)
    expectDQTAR()
  })
})

// IF-001 / interface GDD Rule 14: the text-scale step set is exactly
// 90 / 100 / 110 / 125%. Pinned with literals, not TEXT_SCALES, so a change to
// the module constant fails here.
describe('text scale step set', () => {
  it('offers exactly 90, 100, 110 and 125 percent', () => {
    expect([...TEXT_SCALES]).toEqual([90, 100, 110, 125])
  })

  it('accepts each step and persists it', () => {
    for (const scale of [90, 100, 110, 125] as const) {
      useSettingsStore.getState().setTextScale(scale)
      expect(useSettingsStore.getState().textScale).toBe(scale)
      expect(stored().textScale).toBe(scale)
    }
  })

  it('rejects any value off the step set, in memory and on load', () => {
    useSettingsStore.getState().setTextScale(110)
    for (const bad of [80, 95, 105, 120, 150, 0.9, 1.25]) {
      useSettingsStore.getState().setTextScale(bad as TextScale)
      expect(useSettingsStore.getState().textScale).toBe(110)
      storage.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, textScale: bad }))
      expect(loadSettings(storage).textScale).toBe(100)
    }
  })
})
