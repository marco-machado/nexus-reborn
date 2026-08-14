// Shared UI helpers: number and time formatting, the seeded hash/rng pair, and
// the click-handler wrapper every screen uses so audio and the action stay
// together. Pure functions except act(), which fires the UI cue.
import { uiClick } from './sound'

export function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Wrap a click handler so the UI cue fires before the action — the pattern
// every screen's on* handler used to repeat.
export function act(fn: () => void): () => void {
  return () => {
    uiClick()
    fn()
  }
}

// M:SS, for short durations (mean times on the balance dashboard).
export function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return Math.floor(s / 60) + ':' + pad2(s % 60)
}

// H M / M, for spans that stretch to hours (research durations).
export function spanLabel(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? h + 'H ' + pad2(m) + 'M' : m + 'M'
}

// M / H, for how long ago something happened (world map contract log).
export function agoLabel(sec: number): string {
  const m = Math.round(sec / 60)
  return m < 90 ? m + 'M' : (m / 60).toFixed(1) + 'H'
}

// Current time in UTC, HH:MM:SS (main menu clock).
export function utcNow(): string {
  const d = new Date()
  return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes()) + ':' + pad2(d.getUTCSeconds())
}

export function hashOf(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rngFrom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}
