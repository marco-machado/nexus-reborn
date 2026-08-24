// Clip-backed one-shots and rain hiss. The alert-tension drone and the
// strategy / mission beds stay synthesized (beds until the #48 clip set).
// All entry points are safe to call when audio is unavailable.
import type { WeaponId, Weather } from './types'
import { getWorld } from './runtime'
import {
  CLIPS,
  gunClipUrl,
  ONE_SHOT_URLS,
  rainClipUrl,
  type GunSide,
} from './sfxClips'

export type { GunSide }
export { gunClipUrl }

type AcCtor = typeof AudioContext

interface Live {
  c: AudioContext
  // Channel gains: UI cues, combat voices, music, and ambience ride separate
  // stages under the master, so the settings sliders can weight them
  // independently.
  ui: GainNode
  combat: GainNode
  music: GainNode
  ambience: GainNode
}

// The authored output level a full master slider maps to.
const BASE_MASTER = 0.25

let ctx: AudioContext | null = null
let master: GainNode | null = null
let uiGain: GainNode | null = null
let combatGain: GainNode | null = null
let musicGain: GainNode | null = null
let ambienceGain: GainNode | null = null
let failed = false
const lastAt: Record<string, number> = {}

// Decode cache lives on the current context. A new context (tests, or a
// construction retry) drops both the buffers and in-flight fetches.
let decodeCtx: AudioContext | null = null
const decoded = new Map<string, AudioBuffer>()
const inflight = new Map<string, Promise<AudioBuffer | null>>()

function resetDecodeCache(c: AudioContext): void {
  if (decodeCtx === c) return
  decoded.clear()
  inflight.clear()
  decodeCtx = c
}

// Alert tension drone: two detuned saws through a lowpass, held while the
// mission alert level is up. Built lazily on the first nonzero level and kept
// for the life of the context, since stopped oscillators cannot restart;
// level 0 just ramps it silent. Tearing it down instead would let a level
// rise inside the release tail build a second layer over the audible first.
interface ThreatLayer {
  osc1: OscillatorNode
  osc2: OscillatorNode
  filter: BiquadFilterNode
  gain: GainNode
}
let threat: ThreatLayer | null = null
const THREAT_GAIN = [0, 0.045, 0.075, 0.11]
const THREAT_FREQ = [140, 220, 320, 460]
const THREAT_RAMP = 0.9

// Desired stage factors, 0..1 each. Held here so levels set before the
// context exists (or before audio is unlocked) land when it is built.
const levels = { master: 1, ui: 1, combat: 1, music: 1, ambience: 1 }

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
}

function applyLevels(): void {
  if (!master || !uiGain || !combatGain || !musicGain || !ambienceGain) return
  master.gain.value = BASE_MASTER * levels.master
  uiGain.gain.value = levels.ui
  combatGain.gain.value = levels.combat
  musicGain.gain.value = levels.music
  ambienceGain.gain.value = levels.ambience
}

// Settings entry point. Fractions 0..1 per stage; the mute switch is a master
// of 0. Safe to call with no context: values apply on construction.
export function setAudioLevels(next: {
  master?: number
  ui?: number
  combat?: number
  music?: number
  ambience?: number
}): void {
  if (next.master !== undefined) levels.master = clamp01(next.master)
  if (next.ui !== undefined) levels.ui = clamp01(next.ui)
  if (next.combat !== undefined) levels.combat = clamp01(next.combat)
  if (next.music !== undefined) levels.music = clamp01(next.music)
  if (next.ambience !== undefined) levels.ambience = clamp01(next.ambience)
  applyLevels()
}

// Readback for settings and tests. The mute switch is already folded into
// the staged factors the store pushes here.
export function getAudioLevels(): {
  master: number
  ui: number
  combat: number
  music: number
  ambience: number
} {
  return { ...levels }
}

function ensure(): Live | null {
  if (failed) return null
  if (ctx && uiGain && combatGain && musicGain && ambienceGain) {
    return { c: ctx, ui: uiGain, combat: combatGain, music: musicGain, ambience: ambienceGain }
  }
  try {
    const g = globalThis as { AudioContext?: AcCtor; webkitAudioContext?: AcCtor }
    const AC = g.AudioContext ?? g.webkitAudioContext
    if (!AC) {
      failed = true
      return null
    }
    ctx = new AC()
    resetDecodeCache(ctx)
    master = ctx.createGain()
    master.connect(ctx.destination)
    uiGain = ctx.createGain()
    uiGain.connect(master)
    combatGain = ctx.createGain()
    combatGain.connect(master)
    musicGain = ctx.createGain()
    musicGain.connect(master)
    ambienceGain = ctx.createGain()
    ambienceGain.connect(master)
    applyLevels()
    const live = { c: ctx, ui: uiGain, combat: combatGain, music: musicGain, ambience: ambienceGain }
    preloadOneShots(live)
    return live
  } catch {
    failed = true
    ctx = null
    master = null
    uiGain = null
    combatGain = null
    musicGain = null
    ambienceGain = null
    return null
  }
}

function decodeClip(live: Live, url: string): Promise<AudioBuffer | null> {
  const hit = decoded.get(url)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(url)
  if (pending) return pending
  const work = (async () => {
    try {
      const res = await fetch(url)
      const raw = await res.arrayBuffer()
      const buf = await live.c.decodeAudioData(raw)
      decoded.set(url, buf)
      return buf
    } catch {
      return null
    } finally {
      inflight.delete(url)
    }
  })()
  inflight.set(url, work)
  return work
}

function preloadOneShots(live: Live): void {
  for (const url of ONE_SHOT_URLS) void decodeClip(live, url)
}

function playOneShot(live: Live, dest: AudioNode, url: string): void {
  void decodeClip(live, url).then((buf) => {
    if (!buf || ctx !== live.c) return
    try {
      const src = live.c.createBufferSource()
      src.buffer = buf
      src.connect(dest)
      src.start(0)
    } catch {
      // fail silent
    }
  })
}

// Resume the context on a user gesture. Safe to call repeatedly.
export function unlockAudio(): void {
  const live = ensure()
  if (live && live.c.state === 'suspended') {
    live.c.resume().catch(() => undefined)
  }
}

// Per-voice rate limit so bursts of simultaneous events do not stack up.
function gate(key: string, minGap: number): Live | null {
  const live = ensure()
  if (!live) return null
  const now = live.c.currentTime
  const last = lastAt[key]
  if (last !== undefined && now - last < minGap) return null
  lastAt[key] = now
  return live
}

export const sfx = {
  gunshot(weaponId: WeaponId, side: GunSide = 'squad'): void {
    const live = gate('shot-' + side + '-' + weaponId, 0.025)
    if (!live) return
    playOneShot(live, live.combat, gunClipUrl(weaponId, side))
  },

  reload(): void {
    const live = gate('reload', 0.15)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.reload)
  },

  confirmBlip(): void {
    const live = gate('blip', 0.05)
    if (!live) return
    playOneShot(live, live.ui, CLIPS.confirm)
  },

  alertSting(): void {
    const live = gate('alert', 0.25)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.alertSting)
  },

  objectiveChime(): void {
    const live = gate('objective', 0.25)
    if (!live) return
    playOneShot(live, live.ui, CLIPS.objective)
  },

  deathThud(): void {
    const live = gate('thud', 0.06)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.death)
  },

  blast(): void {
    const live = gate('blast', 0.12)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.blast)
  },

  // Role ability activation: a short mark on combat so an ability firing
  // reads as its own event, not an order confirm.
  abilityCue(): void {
    const live = gate('ability', 0.12)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.ability)
  },

  uiClick(): void {
    const live = gate('ui', 0.03)
    if (!live) return
    playOneShot(live, live.ui, CLIPS.uiClick)
  },

  // One short data blip per second of interact channel progress.
  interactTick(): void {
    const live = gate('interact', 0.2)
    if (!live) return
    playOneShot(live, live.ui, CLIPS.interact)
  },

  // A round landing on one of ours: a dull body thump under the gunshot, so a
  // wounded operative registers without watching the health bar.
  agentHit(): void {
    const live = gate('agenthit', 0.12)
    if (!live) return
    playOneShot(live, live.combat, CLIPS.agentHit)
  },

  // Sets the tension drone to the mission alert level, 0..3. Level 0 ramps to
  // silence.
  threatLevel(level: number): void {
    const l = Math.max(0, Math.min(3, Math.floor(level)))
    if (l === 0 && !threat) return
    const live = ensure()
    if (!live) return
    const now = live.c.currentTime
    if (!threat) {
      const gain = live.c.createGain()
      // Plain assignments, not setValueAtTime: the ramp block below cancels
      // events at `now` and reads .value, which before the first render
      // quantum still reports the node defaults (gain 1, 350 Hz) — scheduled
      // values would be discarded and the drone would enter at full scale.
      gain.gain.value = 0.0001
      const filter = live.c.createBiquadFilter()
      filter.type = 'lowpass'
      filter.Q.value = 0.9
      filter.frequency.value = THREAT_FREQ[0]
      const osc1 = live.c.createOscillator()
      osc1.type = 'sawtooth'
      osc1.frequency.value = 55
      const osc2 = live.c.createOscillator()
      osc2.type = 'sawtooth'
      osc2.frequency.value = 55.7
      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain).connect(live.combat)
      osc1.start(now)
      osc2.start(now)
      threat = { osc1, osc2, filter, gain }
    }
    const t = threat
    t.gain.gain.cancelScheduledValues(now)
    t.gain.gain.setValueAtTime(Math.max(0.0001, t.gain.gain.value), now)
    t.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, THREAT_GAIN[l]), now + THREAT_RAMP)
    t.filter.frequency.cancelScheduledValues(now)
    t.filter.frequency.setValueAtTime(Math.max(20, t.filter.frequency.value), now)
    t.filter.frequency.exponentialRampToValueAtTime(THREAT_FREQ[l], now + THREAT_RAMP)
  },

  weatherBed(weather: Weather): void {
    setMissionBedWeather(weather)
  },
}

// Looping beds. Strategy rides the music stage (a low industrial drone);
// mission rides ambience (rain clips + synthesized city hum). Built lazily,
// torn down on stop. Safe with no AudioContext: ensure() returns null and
// these no-op.
interface RainVoice {
  kind: 'light' | 'heavy'
  src: AudioBufferSourceNode
  gain: GainNode
}

interface Bed {
  oscs: OscillatorNode[]
  srcs: AudioBufferSourceNode[]
  gain: GainNode
  rains: RainVoice[]
  rainWant: 'light' | 'heavy' | null
}

// Near-silent on a dry mission so a later front can ramp the hiss in.
export function missionRainGain(weather: Weather): number {
  if (weather === 'heavy') return 0.22
  if (weather === 'light') return 0.14
  return 0.0001
}

let strategyBed: Bed | null = null
let missionBed: Bed | null = null
const BED_FADE = 0.45
const RAIN_FADE = 0.4

function stopBed(bed: Bed | null): void {
  if (!bed || !ctx) return
  const now = ctx.currentTime
  bed.gain.gain.cancelScheduledValues(now)
  bed.gain.gain.setValueAtTime(Math.max(0.0001, bed.gain.gain.value), now)
  bed.gain.gain.exponentialRampToValueAtTime(0.0001, now + BED_FADE)
  for (const osc of bed.oscs) {
    try {
      osc.stop(now + BED_FADE + 0.05)
    } catch {
      // already stopped
    }
  }
  for (const src of bed.srcs) {
    try {
      src.stop(now + BED_FADE + 0.05)
    } catch {
      // already stopped
    }
  }
}

export function startStrategyBed(): void {
  if (strategyBed) return
  const live = ensure()
  if (!live) return
  const now = live.c.currentTime
  const gain = live.c.createGain()
  gain.gain.value = 0.0001
  gain.connect(live.music)
  const osc1 = live.c.createOscillator()
  osc1.type = 'sawtooth'
  osc1.frequency.value = 48
  const osc2 = live.c.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 72.4
  const filter = live.c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 180
  filter.Q.value = 0.7
  osc1.connect(filter)
  osc2.connect(filter)
  filter.connect(gain)
  osc1.start(now)
  osc2.start(now)
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.8)
  strategyBed = { oscs: [osc1, osc2], srcs: [], gain, rains: [], rainWant: null }
}

export function stopStrategyBed(): void {
  stopBed(strategyBed)
  strategyBed = null
}

function startRainVoice(live: Live, bed: Bed, kind: 'light' | 'heavy'): void {
  void decodeClip(live, rainClipUrl(kind)).then((buf) => {
    if (!buf || ctx !== live.c || missionBed !== bed) return
    if (bed.rainWant !== kind) return
    if (bed.rains.some((v) => v.kind === kind)) return
    try {
      const gain = live.c.createGain()
      gain.gain.value = 0.0001
      gain.connect(bed.gain)
      const src = live.c.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.connect(gain)
      const now = live.c.currentTime
      src.start(0)
      gain.gain.exponentialRampToValueAtTime(missionRainGain(kind), now + RAIN_FADE)
      bed.rains.push({ kind, src, gain })
      bed.srcs.push(src)
    } catch {
      // fail silent
    }
  })
}

function fadeOutRain(bed: Bed, keep: 'light' | 'heavy' | null): void {
  if (!ctx) return
  const now = ctx.currentTime
  for (const voice of bed.rains) {
    if (voice.kind === keep) continue
    const g = voice.gain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(0.0001, g.value), now)
    g.exponentialRampToValueAtTime(0.0001, now + RAIN_FADE)
    try {
      voice.src.stop(now + RAIN_FADE + 0.05)
    } catch {
      // already stopped
    }
  }
  bed.rains = keep ? bed.rains.filter((v) => v.kind === keep) : []
}

export function startMissionBed(): void {
  if (missionBed) return
  const live = ensure()
  if (!live) return
  const now = live.c.currentTime
  const gain = live.c.createGain()
  gain.gain.value = 0.0001
  gain.connect(live.ambience)
  const hum = live.c.createOscillator()
  hum.type = 'sine'
  hum.frequency.value = 62
  const humFlt = live.c.createBiquadFilter()
  humFlt.type = 'lowpass'
  humFlt.frequency.value = 140
  const humGain = live.c.createGain()
  humGain.gain.value = 0.05
  hum.connect(humFlt).connect(humGain).connect(gain)
  hum.start(now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.7)
  missionBed = { oscs: [hum], srcs: [], gain, rains: [], rainWant: null }
  const opening = getWorld()?.weather ?? 'none'
  setMissionBedWeather(opening)
}

export function setMissionBedWeather(weather: Weather): void {
  if (!missionBed || !ctx) return
  const live = ensure()
  if (!live) return
  const want: 'light' | 'heavy' | null = weather === 'none' ? null : weather
  const bed = missionBed
  bed.rainWant = want
  fadeOutRain(bed, want)
  if (!want) return
  const current = bed.rains.find((v) => v.kind === want)
  if (current) {
    const now = live.c.currentTime
    const g = current.gain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(0.0001, g.value), now)
    g.exponentialRampToValueAtTime(missionRainGain(want), now + RAIN_FADE)
    return
  }
  startRainVoice(live, bed, want)
}

export function stopMissionBed(): void {
  if (missionBed) missionBed.rainWant = null
  stopBed(missionBed)
  missionBed = null
}
