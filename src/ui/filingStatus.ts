// Pure filing-status copy (P-19, P-11, TR-persistence-009, ADR-0022). The
// status comes from Persistence's session store; Interface only maps it to a
// sentence and never infers durability from navigation.
import type { FilingStatus } from '../state/saveStatusStore'

/** The sentence Debrief shows while the applied invoice is not durable. */
export const UNFILED_LINE = 'INVOICE UNFILED // COMMITS ON NEXT SCREEN'

/**
 * The sentence shown while a campaign write or New Operation erase was
 * swallowed. One generic sentence for every reason (ADR-0022 allows it);
 * adopted in the Debrief UX spec (design/ux/debrief.md, 2026-10-23).
 */
export const WRITE_FAILED_LINE = 'SAVE FAILED // CAMPAIGN NOT FILED'

/**
 * The Debrief filing-status sentence for a Persistence status, or null when
 * none is shown. `unfiled` and `write-failed` print a sentence (not a hue).
 * `filed` removes it, the P-19 filed state.
 * @param status `useSaveStatusStore((s) => s.status)`.
 */
export function debriefFilingLine(status: FilingStatus): string | null {
  if (status === 'unfiled') return UNFILED_LINE
  if (status === 'write-failed') return WRITE_FAILED_LINE
  return null
}

/**
 * The Screen write-failure advisory (P-11) for a Persistence status, or null.
 * Only `write-failed` shows it: an unfiled invoice on a Screen is about to be
 * filed by that Screen's autosave, and filed needs no notice.
 * @param status `useSaveStatusStore((s) => s.status)`.
 */
export function screenWriteFailureLine(status: FilingStatus): string | null {
  return status === 'write-failed' ? WRITE_FAILED_LINE : null
}
