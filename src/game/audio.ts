// Procedural WebAudio SFX. No assets: every voice is synthesized on the fly
// from a shared noise buffer and short oscillator envelopes. All entry points
// are safe to call when audio is unavailable (construction failure, no ctx).
import type { WeaponId } from './types'

type AcCtor = typeof AudioContext

interface Live {
  c: AudioContext
  m: GainNode
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let failed = false
const lastAt: Record<string, number> = {}

function ensure(): Live | null {
  if (failed) return null
  if (ctx && master) return { c: ctx, m: master }
  try {
    const g = globalThis as { AudioContext?: AcCtor; webkitAudioContext?: AcCtor }
    const AC = g.AudioContext ?? g.webkitAudioContext
    if (!AC) {
      failed = true
      return null
    }
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.25
    master.connect(ctx.destination)
    return { c: ctx, m: master }
  } catch {
    failed = true
    ctx = null
    master = null
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

function burst(live: Live, o: BurstOpts): void {
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
  src.connect(flt).connect(g).connect(live.m)
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

function tone(live: Live, o: ToneOpts): void {
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
  osc.connect(g).connect(live.m)
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
    burst(live, v.noise)
    tone(live, v.punch)
    if (v.sub) tone(live, v.sub)
  },

  reload(): void {
    const live = gate('reload', 0.15)
    if (!live) return
    burst(live, { dur: 0.025, type: 'bandpass', freq: 2800, q: 3, gain: 0.22 })
    burst(live, { dur: 0.03, type: 'bandpass', freq: 2100, q: 3, gain: 0.26, at: 0.11 })
    tone(live, { dur: 0.05, type: 'square', f0: 240, f1: 130, gain: 0.12, at: 0.11 })
  },

  confirmBlip(): void {
    const live = gate('blip', 0.05)
    if (!live) return
    tone(live, { dur: 0.07, type: 'square', f0: 960, f1: 1280, gain: 0.16 })
  },

  alertSting(): void {
    const live = gate('alert', 0.25)
    if (!live) return
    tone(live, { dur: 0.3, type: 'sawtooth', f0: 480, f1: 190, gain: 0.2 })
    tone(live, { dur: 0.3, type: 'sawtooth', f0: 604, f1: 240, gain: 0.13 })
  },

  objectiveChime(): void {
    const live = gate('objective', 0.25)
    if (!live) return
    tone(live, { dur: 0.14, type: 'sine', f0: 660, gain: 0.22 })
    tone(live, { dur: 0.16, type: 'sine', f0: 880, gain: 0.22, at: 0.09 })
    tone(live, { dur: 0.3, type: 'sine', f0: 1320, gain: 0.18, at: 0.18 })
  },

  deathThud(): void {
    const live = gate('thud', 0.06)
    if (!live) return
    tone(live, { dur: 0.3, type: 'sine', f0: 130, f1: 38, gain: 0.5 })
    burst(live, { dur: 0.12, type: 'lowpass', freq: 260, q: 0.7, gain: 0.3 })
  },

  blast(): void {
    const live = gate('blast', 0.12)
    if (!live) return
    burst(live, { dur: 0.42, type: 'lowpass', freq: 620, q: 0.55, gain: 1, freqEnd: 80 })
    tone(live, { dur: 0.45, type: 'sine', f0: 105, f1: 28, gain: 0.62 })
    burst(live, { dur: 0.12, type: 'bandpass', freq: 1800, q: 0.8, gain: 0.34, at: 0.025 })
  },

  // Role ability activation: a short rising double blip, brighter than the
  // order confirm so an ability firing reads as its own event.
  abilityCue(): void {
    const live = gate('ability', 0.12)
    if (!live) return
    tone(live, { dur: 0.09, type: 'square', f0: 620, f1: 990, gain: 0.16 })
    tone(live, { dur: 0.12, type: 'sine', f0: 1240, f1: 1560, gain: 0.12, at: 0.06 })
  },

  uiClick(): void {
    const live = gate('ui', 0.03)
    if (!live) return
    tone(live, { dur: 0.02, type: 'square', f0: 1500, f1: 900, gain: 0.12 })
  },

  // One short data blip per second of interact channel progress.
  interactTick(): void {
    const live = gate('interact', 0.2)
    if (!live) return
    tone(live, { dur: 0.05, type: 'square', f0: 1180, f1: 1420, gain: 0.14 })
  },
}
