import { describe, expect, it } from 'vitest'
import { layoutPlateMarks } from './plateMarks'
import type { PlateMark } from './plateMarks'

const REF_W = 646
const REF_H = 336

function mark(partial: Partial<PlateMark> & Pick<PlateMark, 'id' | 'codename' | 'mapPos'>): PlateMark {
  return { locked: false, authored: false, ...partial }
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(((a.x - b.x) / 100) * REF_W, ((a.y - b.y) / 100) * REF_H)
}

describe('layoutPlateMarks', () => {
  it('keeps an authored pin on its map position and hangs the label below', () => {
    const [out] = layoutPlateMarks([
      mark({ id: 'm01', codename: 'GLASS VEIL', mapPos: { x: 48, y: 30 }, authored: true }),
    ])
    expect(out.pin).toEqual({ x: 48, y: 30 })
    expect(out.side).toBe('below')
  })

  it('does not move the authored pin when a generated contract lands on it', () => {
    const rust = mark({
      id: 'm03',
      codename: 'RUST HAVEN',
      mapPos: { x: 22, y: 34 },
      locked: true,
      authored: true,
    })
    const ledger = mark({
      id: 'g-ledger',
      codename: 'VIOLET LEDGER',
      mapPos: { x: 22, y: 34 },
    })
    const out = layoutPlateMarks([rust, ledger])
    expect(out[0].pin).toEqual({ x: 22, y: 34 })
    expect(dist(out[0].pin, out[1].pin)).toBeGreaterThanOrEqual(28)
  })

  it('flips a far-east label off the control key and keeps it on the plate', () => {
    const [out] = layoutPlateMarks([
      mark({ id: 'g-accord', codename: 'VIOLET ACCORD', mapPos: { x: 92, y: 72 } }),
    ])
    expect(out.side === 'left' || out.side === 'above').toBe(true)
    expect(out.pin.x).toBeGreaterThanOrEqual(3)
    expect(out.pin.x).toBeLessThanOrEqual(97)
    expect(out.pin.y).toBeGreaterThanOrEqual(6)
    expect(out.pin.y).toBeLessThanOrEqual(94)
  })

  it('hangs two stacked North America names on different sides', () => {
    const out = layoutPlateMarks([
      mark({
        id: 'm03',
        codename: 'RUST HAVEN',
        mapPos: { x: 22, y: 34 },
        locked: true,
        authored: true,
      }),
      mark({
        id: 'g-ledger',
        codename: 'VIOLET LEDGER',
        mapPos: { x: 23, y: 35 },
      }),
    ])
    expect(out[0].side).not.toBe(out[1].side)
    expect(dist(out[0].pin, out[1].pin)).toBeGreaterThanOrEqual(28)
  })
})
