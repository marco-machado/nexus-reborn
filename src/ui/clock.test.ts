import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CLOCK_BATCH_SEC, startWorldClock } from './clock'
import type { ClockFrames, ClockSinks } from './clock'
import { MAX_DT, TIME_SCALE, useWorldStore } from '../state/worldStore'
import clockSrc from './clock.ts?raw'
import indexSrc from './index.tsx?raw'
import navSrc from './Nav.tsx?raw'
import worldMapSrc from './WorldMap.tsx?raw'
import researchSrc from './Research.tsx?raw'
import missionScreenSrc from './MissionScreen.tsx?raw'

// A hand-driven rAF: frame(ms) advances wall time and fires the pending callback.
function fakeFrames(start = 0) {
  let wall = start
  let pending: ((now: number) => void) | null = null
  let nextId = 1
  const frames: ClockFrames = {
    now: () => wall,
    request: (cb) => {
      pending = cb
      return nextId++
    },
    cancel: () => {
      pending = null
    },
  }
  return {
    frames,
    frame(ms: number) {
      wall += ms
      const cb = pending
      pending = null
      cb?.(wall)
    },
    get pending() {
      return pending !== null
    },
  }
}

const s0 = structuredClone({
  t: useWorldStore.getState().t,
  nextEventT: useWorldStore.getState().nextEventT,
  nextContractT: useWorldStore.getState().nextContractT,
  nextTaxT: useWorldStore.getState().nextTaxT,
})

function sinks(): ClockSinks & { ticks: number[] } {
  const ticks: number[] = []
  return {
    ticks,
    tick: (dt) => {
      ticks.push(dt)
      useWorldStore.getState().tick(dt)
    },
    syncResearch: vi.fn(),
    syncCampaign: vi.fn(),
  }
}

beforeEach(() => {
  useWorldStore.setState({ ...s0, speed: 1, paused: false, review: null })
})

describe('useWorldClock loop (startWorldClock)', () => {
  it('1 accepted real second at 1x delivered in unclamped frames advances t by 60', () => {
    const f = fakeFrames()
    const s = sinks()
    const stop = startWorldClock(s, f.frames)
    // 20 frames of 50ms: each reaches the batch, so no remainder is pending.
    for (let i = 0; i < 20; i++) f.frame(50)
    stop()
    const delivered = s.ticks.reduce((a, b) => a + b, 0)
    expect(delivered).toBeCloseTo(1, 9)
    expect(useWorldStore.getState().t).toBeCloseTo(60, 6)
    expect(TIME_SCALE).toBe(60)
  })

  it('one rAF after a 1s wall gap admits MAX_DT (0.25s) and advances t by 15', () => {
    const f = fakeFrames()
    const s = sinks()
    const advanceDays = vi.spyOn(useWorldStore.getState(), 'advanceDays')
    const stop = startWorldClock(s, f.frames)
    f.frame(1000)
    stop()
    expect(MAX_DT).toBe(0.25)
    expect(s.ticks).toEqual([MAX_DT])
    expect(useWorldStore.getState().t).toBeCloseTo(15, 9)
    // The stall clamp is not catch-up: no day jump, no bulk dues.
    expect(advanceDays).not.toHaveBeenCalled()
    advanceDays.mockRestore()
  })

  it('syncs research and campaign at the new t after each delivered batch', () => {
    const f = fakeFrames()
    const s = sinks()
    const stop = startWorldClock(s, f.frames)
    f.frame(50)
    stop()
    const t = useWorldStore.getState().t
    expect(s.syncResearch).toHaveBeenCalledWith(t)
    expect(s.syncCampaign).toHaveBeenCalledWith(t)
  })

  it('holds sub-batch frames until the 20Hz batch fills', () => {
    const f = fakeFrames()
    const s = sinks()
    const stop = startWorldClock(s, f.frames)
    f.frame(20)
    f.frame(20)
    expect(s.ticks).toHaveLength(0)
    f.frame(20)
    stop()
    expect(s.ticks).toHaveLength(1)
    expect(s.ticks[0]).toBeGreaterThanOrEqual(CLOCK_BATCH_SEC)
  })

  it('paused on a Screen: wall-clock advance leaves t unchanged', () => {
    useWorldStore.getState().togglePause()
    const f = fakeFrames()
    const stop = startWorldClock(sinks(), f.frames)
    for (let i = 0; i < 40; i++) f.frame(50)
    stop()
    expect(useWorldStore.getState().t).toBe(s0.t)
  })

  it('unmounted (stopped): wall-clock advance leaves t unchanged', () => {
    const f = fakeFrames()
    const stop = startWorldClock(sinks(), f.frames)
    stop()
    expect(f.pending).toBe(false)
    f.frame(5000)
    expect(useWorldStore.getState().t).toBe(s0.t)
  })
})

// Menu, Mission and Debrief must not mount ScreenChrome (which mounts the
// clock); the four Screens must. Read from source, since tests run without a DOM.
describe('the strategic clock mounts only on the four Screens', () => {
  const index = indexSrc
  // Body of `export function Name()` up to the next top-level function.
  const body = (name: string) => {
    const start = index.indexOf(`export function ${name}(`)
    expect(start).toBeGreaterThanOrEqual(0)
    const rest = index.slice(start + 1)
    const next = rest.search(/\n(export )?function /)
    return next < 0 ? rest : rest.slice(0, next)
  }

  it('ScreenChrome is what mounts useWorldClock', () => {
    expect(navSrc).toMatch(/export function ScreenChrome[\s\S]*?useWorldClock\(\)/)
  })

  it('Brief and Assembly mount ScreenChrome; World Network and Research do too', () => {
    expect(body('MissionBrief')).toContain('<ScreenChrome')
    expect(body('TeamSelect')).toContain('<ScreenChrome')
    expect(worldMapSrc).toContain('<ScreenChrome')
    expect(researchSrc).toContain('<ScreenChrome')
  })

  it('Menu, Mission and Debrief mount neither ScreenChrome nor the clock', () => {
    for (const b of [body('MainMenu'), body('Debrief'), missionScreenSrc]) {
      expect(b).not.toContain('ScreenChrome')
      expect(b).not.toContain('useWorldClock')
    }
  })

  it('the clock is rAF-driven, not THREE.Clock / THREE.Timer / useFrame', () => {
    const clock = clockSrc
    expect(clock).toContain('requestAnimationFrame')
    expect(clock).not.toMatch(/from 'three'|useFrame|setAnimationLoop|THREE\./)
  })
})
