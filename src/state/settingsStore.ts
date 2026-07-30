// Player settings: audio levels, control overrides, and accessibility modes.
// Deliberately outside the campaign save: settings live under their own
// localStorage key with their own version guard, so NEW OPERATION never
// touches them. The store owns every side effect of a setting: it persists
// the blob, applies the binding overrides to the live table, stamps the
// accessibility classes on the document root, and pushes gain factors into
// the audio module through a lazy import that swallows failure the same way
// ui/sound.ts does.
import { create } from 'zustand'
import { applyOverrides, sanitizeOverrides } from '../game/bindings'
import type { BindingId, BindingOverrides } from '../game/bindings'
import { QUALITY_SETTINGS } from '../game/quality'
import type { QualitySetting } from '../game/quality'

export const SETTINGS_KEY = 'nexus-settings-v1'
export const SETTINGS_VERSION = 1 as const

export const TEXT_SCALES = [90, 100, 110, 125] as const
export type TextScale = (typeof TEXT_SCALES)[number]

export interface SettingsData {
  // Sliders, 0..100 integers.
  masterVol: number
  uiVol: number
  combatVol: number
  muted: boolean
  reducedMotion: boolean
  highContrast: boolean
  textScale: TextScale
  // Renderer quality tier, applied at mission mount (game/quality.ts). AUTO
  // resolves against the renderer backend and may be stepped down by the
  // frame-time governor, which persists the concrete tier here.
  quality: QualitySetting
  overrides: BindingOverrides
}

export function defaultSettings(): SettingsData {
  return {
    masterVol: 100,
    uiVol: 100,
    combatVol: 100,
    muted: false,
    reducedMotion: false,
    highContrast: false,
    textScale: 100,
    quality: 'auto',
    overrides: {},
  }
}

// The staging math the audio graph applies: master and channel sliders
// multiply, the mute switch zeroes everything. Returns the 0..1 factor a
// voice on that channel is scaled by (before the authored base level).
export function stagedGain(master: number, channel: number, muted: boolean): number {
  if (muted) return 0
  const m = Number.isFinite(master) ? Math.min(100, Math.max(0, master)) : 100
  const c = Number.isFinite(channel) ? Math.min(100, Math.max(0, channel)) : 100
  return (m / 100) * (c / 100)
}

export interface SettingsStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function browserStorage(): SettingsStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function clampVol(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(100, Math.max(0, Math.round(value)))
}

function sanitizeSettings(raw: unknown): SettingsData {
  const d = defaultSettings()
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return d
  const v = raw as Record<string, unknown>
  return {
    masterVol: clampVol(v.masterVol, d.masterVol),
    uiVol: clampVol(v.uiVol, d.uiVol),
    combatVol: clampVol(v.combatVol, d.combatVol),
    muted: v.muted === true,
    reducedMotion: v.reducedMotion === true,
    highContrast: v.highContrast === true,
    textScale: TEXT_SCALES.includes(v.textScale as TextScale)
      ? (v.textScale as TextScale)
      : d.textScale,
    quality: QUALITY_SETTINGS.includes(v.quality as QualitySetting)
      ? (v.quality as QualitySetting)
      : d.quality,
    overrides: sanitizeOverrides(v.overrides),
  }
}

// Version guard: a blob from another version (or garbage) yields defaults
// rather than a half-read state.
export function loadSettings(storage: SettingsStorage | null): SettingsData {
  if (!storage) return defaultSettings()
  try {
    const raw = storage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings()
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Record<string, unknown>).version !== SETTINGS_VERSION
    ) {
      return defaultSettings()
    }
    return sanitizeSettings(parsed)
  } catch {
    return defaultSettings()
  }
}

let settingsStorage: SettingsStorage | null = null

function persist(data: SettingsData): void {
  try {
    settingsStorage?.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, ...data }))
  } catch {
    // Read-only or full storage never blocks the setting taking effect.
  }
}

function applyDom(data: SettingsData): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('s-reduce-motion', data.reducedMotion)
  root.classList.toggle('s-high-contrast', data.highContrast)
  for (const scale of TEXT_SCALES) {
    root.classList.toggle('s-text-' + scale, data.textScale === scale)
  }
}

// Lazy and failure proof, like ui/sound.ts: the audio module may be absent or
// audio may be unavailable, and a settings change must never throw for it.
function applyAudio(data: SettingsData): void {
  try {
    void import('../game/audio').then(
      (m) =>
        m.setAudioLevels?.({
          master: stagedGain(data.masterVol, 100, data.muted),
          ui: stagedGain(100, data.uiVol, false),
          combat: stagedGain(100, data.combatVol, false),
        }),
      () => undefined,
    )
  } catch {
    // audio unavailable
  }
}

function dataOf(s: SettingsData): SettingsData {
  return {
    masterVol: s.masterVol,
    uiVol: s.uiVol,
    combatVol: s.combatVol,
    muted: s.muted,
    reducedMotion: s.reducedMotion,
    highContrast: s.highContrast,
    textScale: s.textScale,
    quality: s.quality,
    overrides: s.overrides,
  }
}

export type VolumeChannel = 'master' | 'ui' | 'combat'

export interface SettingsState extends SettingsData {
  setVolume: (channel: VolumeChannel, value: number) => void
  setMuted: (muted: boolean) => void
  setReducedMotion: (on: boolean) => void
  setHighContrast: (on: boolean) => void
  setTextScale: (scale: TextScale) => void
  setQuality: (quality: QualitySetting) => void
  setBindingOverride: (id: BindingId, codes: string[]) => void
  clearBindingOverride: (id: BindingId) => void
  resetBindings: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const commit = (partial: Partial<SettingsData>): void => {
    set(partial)
    const data = dataOf(get())
    persist(data)
    applyDom(data)
    applyAudio(data)
  }
  const commitOverrides = (raw: BindingOverrides): void => {
    // applyOverrides sanitizes and returns what survived; the store keeps
    // only that, so a rejected merge never rides along in the blob.
    commit({ overrides: applyOverrides(raw) })
  }
  return {
    ...defaultSettings(),
    setVolume: (channel, value) => {
      const v = clampVol(value, 100)
      if (channel === 'master') commit({ masterVol: v })
      else if (channel === 'ui') commit({ uiVol: v })
      else commit({ combatVol: v })
    },
    setMuted: (muted) => commit({ muted }),
    setReducedMotion: (on) => commit({ reducedMotion: on }),
    setHighContrast: (on) => commit({ highContrast: on }),
    setTextScale: (scale) => {
      if (TEXT_SCALES.includes(scale)) commit({ textScale: scale })
    },
    setQuality: (quality) => {
      if (QUALITY_SETTINGS.includes(quality)) commit({ quality })
    },
    setBindingOverride: (id, codes) => commitOverrides({ ...get().overrides, [id]: codes }),
    clearBindingOverride: (id) => {
      const next = { ...get().overrides }
      delete next[id]
      commitOverrides(next)
    },
    resetBindings: () => commitOverrides({}),
  }
})

// Boot entry point: loads the blob, seeds the store, and applies every side
// effect once. main.tsx calls it before the first render; tests inject a
// memory storage.
export function initSettings(storage: SettingsStorage | null = browserStorage()): void {
  settingsStorage = storage
  const data = loadSettings(storage)
  useSettingsStore.setState(data)
  data.overrides = applyOverrides(data.overrides)
  useSettingsStore.setState({ overrides: data.overrides })
  applyDom(data)
  applyAudio(data)
}
