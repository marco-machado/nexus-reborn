// Screen write-failure advisory (P-11, Interface AC 23, ADR-0022). Shown on
// the strategy Screens while Persistence reports a swallowed campaign write or
// New Operation erase; it clears itself when the next write lands. Read-only.
// The live region stays mounted and empty so screen readers announce the
// sentence when it is inserted; a region mounted with its text is not read.
// Persistent, not dismissible: it is the Screen's only failure channel.
import { useSaveStatusStore } from '../state/saveStatusStore'
import { screenWriteFailureLine } from './filingStatus'

export function WriteFailureNotice() {
  const line = screenWriteFailureLine(useSaveStatusStore((s) => s.status))
  return (
    <div className="write-fail-region" role="status">
      {line && <div className="write-fail-notice corners">{line}</div>}
    </div>
  )
}
