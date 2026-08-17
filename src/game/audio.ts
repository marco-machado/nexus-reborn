// Procedural WebAudio SFX. No assets: every voice is synthesized on the fly
// from a shared noise buffer and short oscillator envelopes. All entry points
// are safe to call when audio is unavailable (construction failure, no ctx).
import type { WeaponId } from './types'

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
let noise: AudioBuffer | null = null
let failed = false
const lastAt: Record<string, number> = {}

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
    return { c: ctx, ui: uiGain, combat: combatGain, music: musicGain, ambience: ambienceGain }
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

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (noise) return noise
  const len = c.sampleRate
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  noise = buf
  return buf
}

interface BurstOpts {
  dur: number
  type: BiquadFilterType
  freq: number
  q: number
  gain: number
  freqEnd?: number
  at?: number
}

function burst(live: Live, out: GainNode, o: BurstOpts): void {
  const t0 = live.c.currentTime + (o.at ?? 0)
  const src = live.c.createBufferSource()
  src.buffer = noiseBuffer(live.c)
  src.loop = true
  src.playbackRate.value = 0.85 + Math.random() * 0.3
  const flt = live.c.createBiquadFilter()
  flt.type = o.type
  flt.Q.value = o.q
  flt.frequency.setValueAtTime(o.freq, t0)
  if (o.freqEnd !== undefined) {
    flt.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), t0 + o.dur)
  }
  const g = live.c.createGain()
  g.gain.setValueAtTime(o.gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + o.dur)
  src.connect(flt).connect(g).connect(out)
  src.start(t0, Math.random() * 0.9)
  src.stop(t0 + o.dur + 0.05)
}

interface ToneOpts {
  dur: number
  type: OscillatorType
  f0: number
  f1?: number
  gain: number
  at?: number
}

function tone(live: Live, out: GainNode, o: ToneOpts): void {
  const t0 = live.c.currentTime + (o.at ?? 0)
  const osc = live.c.createOscillator()
  osc.type = o.type
  osc.frequency.setValueAtTime(o.f0, t0)
  if (o.f1 !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur)
  }
  const g = live.c.createGain()
  g.gain.setValueAtTime(o.gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + o.dur)
  osc.connect(g).connect(out)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.03)
}

interface GunVoice {
  noise: BurstOpts
  punch: ToneOpts
  sub?: ToneOpts
}

const GUNS: Record<WeaponId, GunVoice> = {
  assault: {
    noise: { dur: 0.09, type: 'bandpass', freq: 1700, q: 0.9, gain: 0.5, freqEnd: 480 },
    punch: { dur: 0.05, type: 'square', f0: 330, f1: 95, gain: 0.3 },
  },
  smg: {
    noise: { dur: 0.05, type: 'bandpass', freq: 2500, q: 1.1, gain: 0.34, freqEnd: 900 },
    punch: { dur: 0.03, type: 'triangle', f0: 520, f1: 170, gain: 0.2 },
  },
  pistol: {
    noise: { dur: 0.07, type: 'bandpass', freq: 1500, q: 0.9, gain: 0.42, freqEnd: 420 },
    punch: { dur: 0.045, type: 'square', f0: 400, f1: 120, gain: 0.26 },
  },
  longrifle: {
    noise: { dur: 0.3, type: 'lowpass', freq: 700, q: 0.7, gain: 0.95, freqEnd: 120 },
    punch: { dur: 0.06, type: 'square', f0: 260, f1: 70, gain: 0.4 },
    sub: { dur: 0.28, type: 'sine', f0: 110, f1: 34, gain: 0.5 },
  },
  shotgun: {
    noise: { dur: 0.2, type: 'lowpass', freq: 520, q: 0.6, gain: 0.85, freqEnd: 110 },
    punch: { dur: 0.07, type: 'square', f0: 210, f1: 60, gain: 0.42 },
    sub: { dur: 0.18, type: 'sine', f0: 95, f1: 40, gain: 0.4 },
  },
}

export const sfx = {
  gunshot(weaponId: WeaponId): void {
    const live = gate('shot-' + weaponId, 0.025)
    if (!live) return
    const v = GUNS[weaponId] ?? GUNS.pistol
    burst(live, live.combat, v.noise)
    tone(live, live.combat, v.punch)
    if (v.sub) tone(live, live.combat, v.sub)
  },

  reload(): void {
    const live = gate('reload', 0.15)
    if (!live) return
    burst(live, live.combat, { dur: 0.025, type: 'bandpass', freq: 2800, q: 3, gain: 0.22 })
    burst(live, live.combat, { dur: 0.03, type: 'bandpass', freq: 2100, q: 3, gain: 0.26, at: 0.11 })
    tone(live, live.combat, { dur: 0.05, type: 'square', f0: 240, f1: 130, gain: 0.12, at: 0.11 })
  },

  confirmBlip(): void {
    const live = gate('blip', 0.05)
    if (!live) return
    tone(live, live.ui, { dur: 0.07, type: 'square', f0: 960, f1: 1280, gain: 0.16 })
  },

  alertSting(): void {
    const live = gate('alert', 0.25)
    if (!live) return
    tone(live, live.combat, { dur: 0.3, type: 'sawtooth', f0: 480, f1: 190, gain: 0.2 })
    tone(live, live.combat, { dur: 0.3, type: 'sawtooth', f0: 604, f1: 240, gain: 0.13 })
  },

  objectiveChime(): void {
    const live = gate('objective', 0.25)
    if (!live) return
    tone(live, live.ui, { dur: 0.14, type: 'sine', f0: 660, gain: 0.22 })
    tone(live, live.ui, { dur: 0.16, type: 'sine', f0: 880, gain: 0.22, at: 0.09 })
    tone(live, live.ui, { dur: 0.3, type: 'sine', f0: 1320, gain: 0.18, at: 0.18 })
  },

  deathThud(): void {
    const live = gate('thud', 0.06)
    if (!live) return
    tone(live, live.combat, { dur: 0.3, type: 'sine', f0: 130, f1: 38, gain: 0.5 })
    burst(live, live.combat, { dur: 0.12, type: 'lowpass', freq: 260, q: 0.7, gain: 0.3 })
  },

  blast(): void {
    const live = gate('blast', 0.12)
    if (!live) return
    burst(live, live.combat, { dur: 0.42, type: 'lowpass', freq: 620, q: 0.55, gain: 1, freqEnd: 80 })
    tone(live, live.combat, { dur: 0.45, type: 'sine', f0: 105, f1: 28, gain: 0.62 })
    burst(live, live.combat, { dur: 0.12, type: 'bandpass', freq: 1800, q: 0.8, gain: 0.34, at: 0.025 })
  },

  // Role ability activation: a short rising double blip, brighter than the
  // order confirm so an ability firing reads as its own event.
  abilityCue(): void {
    const live = gate('ability', 0.12)
    if (!live) return
    tone(live, live.combat, { dur: 0.09, type: 'square', f0: 620, f1: 990, gain: 0.16 })
    tone(live, live.combat, { dur: 0.12, type: 'sine', f0: 1240, f1: 1560, gain: 0.12, at: 0.06 })
  },

  uiClick(): void {
    const live = gate('ui', 0.03)
    if (!live) return
    tone(live, live.ui, { dur: 0.02, type: 'square', f0: 1500, f1: 900, gain: 0.12 })
  },

  // One short data blip per second of interact channel progress.
  interactTick(): void {
    const live = gate('interact', 0.2)
    if (!live) return
    tone(live, live.ui, { dur: 0.05, type: 'square', f0: 1180, f1: 1420, gain: 0.14 })
  },

  // A round landing on one of ours: a dull body thump under the gunshot, so a
  // wounded operative registers without watching the health bar.
  agentHit(): void {
    const live = gate('agenthit', 0.12)
    if (!live) return
    tone(live, live.combat, { dur: 0.12, type: 'sine', f0: 180, f1: 55, gain: 0.3 })
    burst(live, live.combat, { dur: 0.06, type: 'lowpass', freq: 420, q: 0.8, gain: 0.18 })
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
}

// Looping beds. Strategy rides the music stage (a low industrial drone);
// mission rides ambience (rain hiss + city hum). Built lazily, torn down on
// stop. Safe with no AudioContext: ensure() returns null and these no-op.
interface Bed {
  oscs: OscillatorNode[]
  srcs: AudioBufferSourceNode[]
  gain: GainNode
}

let strategyBed: Bed | null = null
let missionBed: Bed | null = null
const BED_FADE = 0.45

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
  strategyBed = { oscs: [osc1, osc2], srcs: [], gain }
}

export function stopStrategyBed(): void {
  stopBed(strategyBed)
  strategyBed = null
}

export function startMissionBed(): void {
  if (missionBed) return
  const live = ensure()
  if (!live) return
  const now = live.c.currentTime
  const gain = live.c.createGain()
  gain.gain.value = 0.0001
  gain.connect(live.ambience)
  const rain = live.c.createBufferSource()
  rain.buffer = noiseBuffer(live.c)
  rain.loop = true
  const rainFlt = live.c.createBiquadFilter()
  rainFlt.type = 'highpass'
  rainFlt.frequency.value = 1400
  rainFlt.Q.value = 0.5
  const rainGain = live.c.createGain()
  rainGain.gain.value = 0.22
  rain.connect(rainFlt).connect(rainGain).connect(gain)
  const hum = live.c.createOscillator()
  hum.type = 'sine'
  hum.frequency.value = 62
  const humFlt = live.c.createBiquadFilter()
  humFlt.type = 'lowpass'
  humFlt.frequency.value = 140
  const humGain = live.c.createGain()
  humGain.gain.value = 0.05
  hum.connect(humFlt).connect(humGain).connect(gain)
  rain.start(now)
  hum.start(now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.7)
  missionBed = { oscs: [hum], srcs: [rain], gain }
}

export function stopMissionBed(): void {
  stopBed(missionBed)
  missionBed = null
}
