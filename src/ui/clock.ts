// Strategic time, driven by whichever Screen is mounted. It only
// advances here, and research projects run on the same clock, so the tick that
// moves the World Network is also what finishes them.
import { useEffect } from 'react'
import { MAX_DT, useWorldStore } from '../state/worldStore'
import { useResearchStore } from '../state/researchStore'
import { useCampaignStore } from '../state/campaignStore'

// Batched to 20Hz so the clock, the Timeline and the lab bars repaint smoothly
// without a render every frame.
export const CLOCK_BATCH_SEC = 0.05

/** Frame scheduling the clock runs on; rAF in the browser, a fake in tests. */
export interface ClockFrames {
  now: () => number
  request: (cb: (now: number) => void) => number
  cancel: (id: number) => void
}

/** What one delivered batch drives: the world tick, then the two syncs at the new t. */
export interface ClockSinks {
  tick: (dt: number) => void
  syncResearch: (t: number) => void
  syncCampaign: (t: number) => void
}

const rafFrames: ClockFrames = {
  now: () => performance.now(),
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
}

/**
 * Starts the strategic clock loop and returns its stop function. Each frame
 * admits at most `MAX_DT` wall seconds (a caller-side stall clamp, not
 * catch-up), accumulates, and delivers to `tick` once the batch reaches
 * `CLOCK_BATCH_SEC`.
 */
export function startWorldClock(sinks: ClockSinks, frames: ClockFrames = rafFrames): () => void {
  let raf = 0
  let last = frames.now()
  let acc = 0
  const step = (now: number) => {
    raf = frames.request(step)
    acc += Math.min(MAX_DT, (now - last) / 1000)
    last = now
    if (acc < CLOCK_BATCH_SEC) return
    sinks.tick(acc)
    acc = 0
    const t = useWorldStore.getState().t
    sinks.syncResearch(t)
    sinks.syncCampaign(t)
  }
  raf = frames.request(step)
  return () => frames.cancel(raf)
}

/** Runs the strategic clock while the calling Screen is mounted (ScreenChrome). */
export function useWorldClock(): void {
  const tick = useWorldStore((s) => s.tick)
  const syncResearch = useResearchStore((s) => s.sync)
  const syncCampaign = useCampaignStore((s) => s.sync)
  useEffect(
    () => startWorldClock({ tick, syncResearch, syncCampaign }),
    [tick, syncCampaign, syncResearch],
  )
}
