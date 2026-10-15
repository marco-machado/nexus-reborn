// Gate for the Balance entry point on Settings and Debrief: shown only while
// the local telemetry log holds records (state/telemetry.ts
// balanceEntryVisible). Re-reads storage only when the log revision moves, so
// a Debrief append or a confirmed Clear updates the gate without polling.
import { useMemo, useSyncExternalStore } from 'react'
import {
  balanceEntryVisible,
  loadRecords,
  subscribeTelemetry,
  telemetryRevision,
} from '../state/telemetry'

export function useBalanceEntryVisible(): boolean {
  const rev = useSyncExternalStore(subscribeTelemetry, telemetryRevision, telemetryRevision)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- rev invalidates the storage read
  return useMemo(() => balanceEntryVisible(loadRecords()), [rev])
}
