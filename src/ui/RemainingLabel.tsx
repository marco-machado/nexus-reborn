// Research remaining label (P-22). Pure props so a test can render it without
// the stores; the Research screen passes world t and researchStore.lastSyncT.
// Renders nothing — no 0, no dash — when paintedRemaining() returns none.
import { paintedRemaining, remainingHms } from './remainingPaint'

export const REMAINING_TEST_ID = 'rs-remaining'

export function RemainingLabel(props: {
  run: { readonly endT: number } | null
  t: number
  lastSyncT: number | null
  className?: string
}) {
  const sec = paintedRemaining(props.run, props.t, props.lastSyncT)
  if (sec === null) return null
  return (
    <span
      className={'rs-remaining' + (props.className ? ' ' + props.className : '')}
      data-testid={REMAINING_TEST_ID}
      data-remaining-sec={sec}
    >
      {remainingHms(sec)} REMAINING
    </span>
  )
}
