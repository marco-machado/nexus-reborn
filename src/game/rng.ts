// Seeded PRNG factory (mulberry32). One instance per world keeps runs
// reproducible from mission.seed.

export type Rng = () => number

export function mulberryStep(state: number): [value: number, nextState: number] {
  const nextState = (state + 0x6d2b79f5) >>> 0
  let t = nextState
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, nextState]
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return function next(): number {
    const [value, nextState] = mulberryStep(state)
    state = nextState
    return value
  }
}
