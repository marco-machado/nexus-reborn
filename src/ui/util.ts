// Shared pure helpers: number formatting and the seeded hash/rng pair.
export function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
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
