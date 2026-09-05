// Strategic time, driven by whichever Screen is mounted. It only
// advances here, and research projects run on the same clock, so the tick that
// moves the World Network is also what finishes them.
import { useEffect } from 'react'
import { MAX_DT, useWorldStore } from '../state/worldStore'
import { useResearchStore } from '../state/researchStore'
import { useCampaignStore } from '../state/campaignStore'

// Batched to 20Hz so the clock, the Timeline and the lab bars repaint smoothly
// without a render every frame.
export function useWorldClock(): void {
  const tick = useWorldStore((s) => s.tick)
  const syncResearch = useResearchStore((s) => s.sync)
  const syncCampaign = useCampaignStore((s) => s.sync)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const step = (now: number) => {
      raf = requestAnimationFrame(step)
      acc += Math.min(MAX_DT, (now - last) / 1000)
      last = now
      if (acc < 0.05) return
      tick(acc)
      acc = 0
      const t = useWorldStore.getState().t
      syncResearch(t)
      syncCampaign(t)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
    }
  }, [tick, syncCampaign, syncResearch])
}
