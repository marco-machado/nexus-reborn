// Pure Debrief filing-status line (P-19, TR-persistence-009, ADR-0022). The
// status comes from Persistence's session store; Interface only maps it to a
// sentence and never infers durability from navigation.
import type { FilingStatus } from '../state/saveStatusStore'

/** The sentence Debrief shows while the applied invoice is not durable. */
export const UNFILED_LINE = 'INVOICE UNFILED // COMMITS ON NEXT SCREEN'

/**
 * The Debrief filing-status sentence for a Persistence status, or null when
 * none is shown. `unfiled` prints a sentence (not a hue). `filed` removes it,
 * the P-19 filed state. `write-failed` copy belongs to Story 018 and prints
 * nothing here.
 * @param status `useSaveStatusStore((s) => s.status)`.
 */
export function debriefFilingLine(status: FilingStatus): string | null {
  return status === 'unfiled' ? UNFILED_LINE : null
}
