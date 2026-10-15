// CONTRACT FILE. Durable-commit (filing) status of the campaign blob
// (ADR-0022, TR-persistence-009). Session-only: it is not in the campaign
// blob, it is not in the autosave subscription set, and a status change never
// schedules a write. `save.ts` is the only caller of the mutators; Interface
// reads `status` and `reason` with primitive selectors and never writes.
import { create } from 'zustand'

/** Whether the in-memory campaign is durable on this origin. */
export type FilingStatus = 'filed' | 'unfiled' | 'write-failed'
/** Coarse cause of a swallowed campaign write, for Interface copy. */
export type WriteFailReason = 'quota' | 'unavailable' | 'unknown'

/** Invariant: `reason !== null` iff `status === 'write-failed'`. */
export interface SaveStatusState {
  status: FilingStatus
  reason: WriteFailReason | null
}

export interface SaveStatusActions {
  /** A Debrief applied in memory. No-op while `write-failed` (sticky). */
  markUnfiled(): void
  /** A campaign `setItem` returned, a hydrate completed, or an erase succeeded. */
  markFiled(): void
  /** A campaign write was swallowed. */
  markWriteFailed(reason: WriteFailReason): void
  /** Back to `filed`, reason null. */
  reset(): void
}

export const useSaveStatusStore = create<SaveStatusState & SaveStatusActions>()((set, get) => {
  // The store changes only on a transition: a mutator that would not change
  // `status` or `reason` does not call `set`.
  const transition = (status: FilingStatus, reason: WriteFailReason | null): void => {
    const s = get()
    if (s.status === status && s.reason === reason) return
    set({ status, reason })
  }
  return {
    status: 'filed',
    reason: null,
    markUnfiled() {
      if (get().status === 'write-failed') return
      transition('unfiled', null)
    },
    markFiled() {
      transition('filed', null)
    },
    markWriteFailed(reason) {
      transition('write-failed', reason)
    },
    reset() {
      transition('filed', null)
    },
  }
})
