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
import { SAVE_KEY, startNewOperation, validateSave, writeSave } from './save'
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

// AU-001 / audio GDD `staged_gain` and TR-audio-001: master, four channels and
// mute live in the settings slot. Literals pinned from the GDD.
describe('mixer through the settings store (AU-001)', () => {
  const CHANNELS = ['ui', 'combat', 'music', 'ambience'] as const
  const VOL_KEY = {
    master: 'masterVol',
    ui: 'uiVol',
    combat: 'combatVol',
    music: 'musicVol',
    ambience: 'ambienceVol',
  } as const

  async function flushAudio() {
    for (let i = 0; i < 5; i++) await Promise.resolve()
    return import('../game/audio')
  }

  it('staged_gain: master 0.5 × combat 0.8 is 0.4, 0 when muted', () => {
    expect(stagedGain(50, 80, false)).toBeCloseTo(0.4, 10)
    expect(stagedGain(50, 80, true)).toBe(0)
  })

  it('combat factor reads 0.4; mute zeroes it and keeps stored 0.5 / 0.8; unmute restores 0.4', async () => {
    const s = useSettingsStore.getState()
    s.setVolume('master', 50)
    s.setVolume('combat', 80)
    let audio = await flushAudio()
    // Master and mute apply once, at the master stage.
    expect(audio.playerFactor('combat')).toBeCloseTo(0.4, 10)
    expect(audio.getAudioLevels().combat).toBeCloseTo(0.8, 10)

    s.setMuted(true)
    audio = await flushAudio()
    expect(audio.playerFactor('combat')).toBe(0)
    for (const bus of CHANNELS) expect(audio.playerFactor(bus)).toBe(0)
    // Mute zeroes only the master node; channel nodes keep their own levels.
    const muted = audio.getAudioLevels()
    expect(muted.master).toBe(0)
    expect(muted.ui).toBeCloseTo(1, 10)
    expect(muted.combat).toBeCloseTo(0.8, 10)
    expect(muted.music).toBeCloseTo(1, 10)
    expect(muted.ambience).toBeCloseTo(1, 10)
    expect(useSettingsStore.getState().masterVol).toBe(50)
    expect(useSettingsStore.getState().combatVol).toBe(80)
    expect(stored()).toMatchObject({ masterVol: 50, combatVol: 80, muted: true })

    s.setMuted(false)
    audio = await flushAudio()
    expect(audio.playerFactor('combat')).toBeCloseTo(0.4, 10)
  })

  it('each channel control changes only its own bus and no other stored level', async () => {
    const s = useSettingsStore.getState()
    s.setVolume('master', 60)
    for (const ch of CHANNELS) s.setVolume(ch, 70)
    for (const ch of CHANNELS) {
      const before = { ...useSettingsStore.getState() }
      const audioBefore = (await flushAudio()).getAudioLevels()
      useSettingsStore.getState().setVolume(ch, 20)
      const after = useSettingsStore.getState()
      const audioAfter = (await flushAudio()).getAudioLevels()
      expect(after[VOL_KEY[ch]]).toBe(20)
      expect(audioAfter[ch]).toBeCloseTo(0.2, 10)
      for (const other of ['master', ...CHANNELS] as const) {
        if (other === ch) continue
        expect(after[VOL_KEY[other]]).toBe(before[VOL_KEY[other]])
        expect(audioAfter[other]).toBeCloseTo(audioBefore[other], 10)
      }
      useSettingsStore.getState().setVolume(ch, 70)
    }
  })

  it('master scales all four buses once', async () => {
    const s = useSettingsStore.getState()
    s.setVolume('ui', 100)
    s.setVolume('combat', 80)
    s.setVolume('music', 50)
    s.setVolume('ambience', 0)
    s.setVolume('master', 50)
    const audio = await flushAudio()
    expect(audio.playerFactor('ui')).toBeCloseTo(0.5, 10)
    expect(audio.playerFactor('combat')).toBeCloseTo(0.4, 10)
    expect(audio.playerFactor('music')).toBeCloseTo(0.25, 10)
    expect(audio.playerFactor('ambience')).toBe(0)
  })

  it('silencing combat while keeping UI is valid', async () => {
    const s = useSettingsStore.getState()
    s.setVolume('combat', 0)
    s.setVolume('ui', 100)
    const audio = await flushAudio()
    expect(audio.playerFactor('combat')).toBe(0)
    expect(audio.playerFactor('ui')).toBe(1)
    expect(useSettingsStore.getState().combatVol).toBe(0)
  })

  it('master, four channels and mute survive reload, New Operation, and a second reload', () => {
    const s = useSettingsStore.getState()
    s.setVolume('master', 45)
    s.setVolume('ui', 15)
    s.setVolume('combat', 25)
    s.setVolume('music', 35)
    s.setVolume('ambience', 55)
    s.setMuted(true)
    const expected = { masterVol: 45, uiVol: 15, combatVol: 25, musicVol: 35, ambienceVol: 55, muted: true }

    const reload = (): void => {
      useSettingsStore.setState(defaultSettings())
      initSettings(storage)
    }
    reload()
    expect(useSettingsStore.getState()).toMatchObject(expected)

    // New Operation erases the campaign slot only, in the same storage.
    const shared = Object.assign(storage, { removeItem: (k: string) => void storage.data.delete(k) })
    storage.setItem(SAVE_KEY, '{"version":10,"campaign":"seeded"}')
    expect(storage.getItem(SAVE_KEY)).not.toBeNull()
    startNewOperation(shared)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(storage.getItem(SETTINGS_KEY)).not.toBeNull()
    expect(stored()).toMatchObject(expected)
    reload()
    expect(useSettingsStore.getState()).toMatchObject(expected)
  })

  it('never writes mixer values into the campaign blob', () => {
    const shared = Object.assign(storage, { removeItem: (k: string) => void storage.data.delete(k) })
    const s = useSettingsStore.getState()
    s.setVolume('master', 45)
    s.setVolume('ui', 15)
    s.setVolume('combat', 25)
    s.setVolume('music', 35)
    s.setVolume('ambience', 55)
    s.setMuted(true)
    const mixer = /masterVol|combatVol|uiVol|musicVol|ambienceVol|"muted"/
    const checkBlob = (): void => {
      const raw = storage.getItem(SAVE_KEY)
      expect(raw).not.toBeNull()
      expect(validateSave(JSON.parse(raw as string))).toBe(true)
      expect(raw).not.toMatch(mixer)
      // The settings blob, by contrast, does hold the mixer.
      expect(storage.getItem(SETTINGS_KEY)).toMatch(mixer)
    }

    // A real campaign blob written through save.ts while the mixer is set.
    expect(writeSave(shared)).toBe(true)
    checkBlob()

    // And again after New Operation resets the campaign and it is re-filed.
    startNewOperation(shared)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(writeSave(shared)).toBe(true)
    checkBlob()
  })
})
