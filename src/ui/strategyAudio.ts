// The strategy bed belongs to the app's run of Screens, not to each Screen's
// clock hook. Navigating between them must leave the same source playing.
import { useAppStore } from '../state/appStore'
import type { Phase } from '../state/appStore'
import { startStrategyBed, stopStrategyBed } from './sound'

function usesStrategyBed(phase: Phase): boolean {
  return phase === 'world' || phase === 'research' || phase === 'brief' || phase === 'team'
}

export function bindStrategyBed(): () => void {
  let playing = usesStrategyBed(useAppStore.getState().phase)
  if (playing) startStrategyBed()
  const unsubscribe = useAppStore.subscribe(({ phase }) => {
    const next = usesStrategyBed(phase)
    if (next === playing) return
    playing = next
    if (playing) startStrategyBed()
    else stopStrategyBed()
  })
  return () => {
    unsubscribe()
    if (playing) stopStrategyBed()
  }
}
