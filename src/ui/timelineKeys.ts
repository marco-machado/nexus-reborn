// Timeline keyboard model (IF-005, TR-interface-007): Left/Right step Review
// one hour back/forward within the 24 h window, Home selects the oldest point,
// End returns Live. Pure: returns the next Review pin, null meaning Live, or
// undefined for a key the Timeline does not handle. Review is a view; nothing
// here touches the live world clock (ADR-0014).
import { DAY } from '../state/worldStore'

export const REVIEW_STEP_SEC = 3600

export function reviewKey(
  key: string,
  now: number,
  review: number | null,
): number | null | undefined {
  const at = review ?? now
  const step = (sec: number): number | null => {
    const next = at + sec
    return next >= now ? null : Math.max(now - DAY, next)
  }
  if (key === 'ArrowLeft') return step(-REVIEW_STEP_SEC)
  if (key === 'ArrowRight') return step(REVIEW_STEP_SEC)
  if (key === 'Home') return now - DAY
  if (key === 'End') return null
  return undefined
}
