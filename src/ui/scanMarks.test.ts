import { describe, expect, it } from 'vitest'
import { layoutScanMarks, visibleScanMarks } from './scanMarks'
import type { ScanMark } from './scanMarks'

const REF_W = 646
const REF_H = 336

function mark(partial: Partial<ScanMark> & Pick<ScanMark, 'id' | 'codename' | 'mapPos'>): ScanMark {
  return { locked: false, authored: false, ...partial }
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(((a.x - b.x) / 100) * REF_W, ((a.y - b.y) / 100) * REF_H)
}

describe('layoutScanMarks', () => {
  it('keeps an authored pin on its map position and hangs the label below', () => {
    const [out] = layoutScanMarks([
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
    const out = layoutScanMarks([rust, ledger])
    expect(out[0].pin).toEqual({ x: 22, y: 34 })
    expect(dist(out[0].pin, out[1].pin)).toBeGreaterThanOrEqual(28)
  })

  it('flips a far-east label off the control key and keeps it on the Scan', () => {
    const [out] = layoutScanMarks([
      mark({ id: 'g-accord', codename: 'VIOLET ACCORD', mapPos: { x: 92, y: 72 } }),
    ])
    expect(out.side === 'left' || out.side === 'above').toBe(true)
    expect(out.pin.x).toBeGreaterThanOrEqual(3)
    expect(out.pin.x).toBeLessThanOrEqual(97)
    expect(out.pin.y).toBeGreaterThanOrEqual(6)
    expect(out.pin.y).toBeLessThanOrEqual(94)
  })

  it('keeps authored contracts on the Scan when they are intel-gated and drops locked generated ones', () => {
    const out = visibleScanMarks([
      mark({ id: 'm01', codename: 'GLASS VEIL', mapPos: { x: 48, y: 30 }, authored: true }),
      mark({
        id: 'm02',
        codename: 'HOLLOW CROWN',
        mapPos: { x: 74, y: 38 },
        locked: true,
        authored: true,
      }),
      mark({
        id: 'g-curtain',
        codename: 'FERAL CURTAIN',
        mapPos: { x: 60, y: 28 },
        locked: true,
      }),
      mark({
        id: 'g-harbor',
        codename: 'IRON HARBOR',
        mapPos: { x: 40, y: 40 },
        locked: false,
      }),
    ])
    expect(out.map((m) => m.id)).toEqual(['m01', 'm02', 'g-harbor'])
  })

  it('hangs two stacked North America names on different sides', () => {
    const out = layoutScanMarks([
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
