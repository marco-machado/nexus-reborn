import { describe, it, expect } from 'vitest'
import { mulberry32 } from './rng'

function seq(seed: number, n: number): number[] {
  const rng = mulberry32(seed)
  return Array.from({ length: n }, () => rng())
}

describe('mulberry32', () => {
  it('produces the same sequence for the same seed', () => {
    expect(seq(1, 50)).toEqual(seq(1, 50))
    expect(seq(0xdeadbeef, 50)).toEqual(seq(0xdeadbeef, 50))
  })

  it('produces different sequences for different seeds', () => {
    expect(seq(1, 10)).not.toEqual(seq(2, 10))
    expect(seq(0, 10)).not.toEqual(seq(1, 10))
  })

  it('stays in [0, 1) across many draws, including seed 0 and negative seeds', () => {
    for (const seed of [0, 1, 42, -1, 0xdeadbeef]) {
      const values = seq(seed, 2000)
      expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
    }
  })

  it('does not collapse to a constant', () => {
    const values = seq(7, 100)
    expect(new Set(values).size).toBeGreaterThan(90)
  })

  it('keeps instances independent of each other', () => {
    const expected = seq(7, 10)
    const a = mulberry32(7)
    const b = mulberry32(1234)
    const interleaved: number[] = []
    for (let i = 0; i < 10; i++) {
      interleaved.push(a())
      b()
    }
    expect(interleaved).toEqual(expected)
  })
})
