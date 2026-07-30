import { describe, expect, it } from 'vitest'
import {
  PROBE_GRACE_SEC,
  PROBE_HOLD_SEC,
  QUALITY_SETTINGS,
  TIER_PARAMS,
  createFrameProbe,
  getMissionTier,
  resolveTier,
  setMissionTier,
  stepDownTier,
} from './quality'

describe('tier table', () => {
  it('HIGH is the pre-tier renderer configuration', () => {
    expect(TIER_PARAMS.high).toEqual({ dprMax: 1.75, rainMul: 1, bloom: true })
  })

  it('MEDIUM caps the pixel ratio at 1.25, halves rain, and keeps bloom', () => {
    expect(TIER_PARAMS.medium).toEqual({ dprMax: 1.25, rainMul: 0.5, bloom: true })
  })

  it('LOW pins the pixel ratio to 1, runs minimal rain, and drops bloom', () => {
    expect(TIER_PARAMS.low.dprMax).toBe(1)
    expect(TIER_PARAMS.low.bloom).toBe(false)
    expect(TIER_PARAMS.low.rainMul).toBeGreaterThan(0)
    expect(TIER_PARAMS.low.rainMul).toBeLessThanOrEqual(0.2)
  })

  it('lists every setting the panel offers', () => {
    expect(QUALITY_SETTINGS).toEqual(['auto', 'high', 'medium', 'low'])
  })
})

describe('resolveTier', () => {
  it('AUTO maps a WebGPU backend to HIGH and the WebGL2 fallback to MEDIUM', () => {
    expect(resolveTier('auto', true)).toBe('high')
    expect(resolveTier('auto', false)).toBe('medium')
  })

  it('passes an explicit tier through untouched, whatever the backend', () => {
    expect(resolveTier('high', false)).toBe('high')
    expect(resolveTier('medium', true)).toBe('medium')
    expect(resolveTier('low', true)).toBe('low')
  })
})

describe('stepDownTier', () => {
  it('walks high to medium to low and stops', () => {
    expect(stepDownTier('high')).toBe('medium')
    expect(stepDownTier('medium')).toBe('low')
    expect(stepDownTier('low')).toBeNull()
  })
})

describe('frame probe', () => {
  function run(probe: { sample(dt: number): boolean }, dtSec: number, seconds: number): number {
    let fires = 0
    for (let t = 0; t < seconds; t += dtSec) if (probe.sample(dtSec)) fires += 1
    return fires
  }

  it('never fires on steady 60fps frames', () => {
    expect(run(createFrameProbe(), 1 / 60, 120)).toBe(0)
  })

  it('fires exactly once on sustained slow frames, after grace and hold', () => {
    const probe = createFrameProbe()
    // 33ms frames: the average settles above 28ms and holds there.
    expect(run(probe, 0.033, PROBE_GRACE_SEC + PROBE_HOLD_SEC + 5)).toBe(1)
    // Once fired, the probe stays quiet no matter what follows.
    expect(run(probe, 0.033, 30)).toBe(0)
  })

  it('ignores a single long hitch among fast frames', () => {
    const probe = createFrameProbe()
    expect(run(probe, 1 / 60, PROBE_GRACE_SEC + 2)).toBe(0)
    // One two-second stall, then fast frames again: no step down.
    expect(probe.sample(2)).toBe(false)
    expect(run(probe, 1 / 60, 30)).toBe(0)
  })

  it('resets the hold when the frame rate recovers before the window closes', () => {
    const probe = createFrameProbe()
    run(probe, 1 / 60, PROBE_GRACE_SEC + 1)
    // Slow for most of the hold window, then recover: the hold must restart.
    expect(run(probe, 0.033, PROBE_HOLD_SEC - 1)).toBe(0)
    expect(run(probe, 1 / 60, 20)).toBe(0)
    // Now hold the slowness long enough and it fires.
    expect(run(probe, 0.04, PROBE_HOLD_SEC + 6)).toBe(1)
  })

  it('discards non-finite and non-positive deltas', () => {
    const probe = createFrameProbe()
    expect(probe.sample(Number.NaN)).toBe(false)
    expect(probe.sample(-1)).toBe(false)
    expect(probe.sample(0)).toBe(false)
  })
})

describe('mission tier holder', () => {
  it('round-trips the mounted tier', () => {
    const before = getMissionTier()
    setMissionTier('low')
    expect(getMissionTier()).toBe('low')
    setMissionTier(before)
  })
})
