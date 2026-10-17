// Destination-nav gates for the four Screens (IF-003, TR-interface-003).
// Presentation only: Brief opens only while a selected contract resolves;
// World Network, Research and Assembly are always reachable. The reason text
// is the one Deploy also gives for the same cause (deployRefusal.ts).
import { resolveMission } from '../state/worldStore'
import type { NavKind } from './bits'

/** Shown on the locked BRIEF tab and by Deploy when no contract is selected. */
export const BRIEF_LOCK_REASON = 'NO CONTRACT SELECTED'

export interface NavTabGate {
  /** The tab can be activated from another screen. */
  open: boolean
  /** Not the current screen and not open: render the locked treatment. */
  locked: boolean
  /** Why the tab is locked, or undefined when it is not. */
  reason: string | undefined
}

/**
 * Brief is reachable while the selected contract id is a live offer or still
 * resolves (an authored contract, or a generated one still held by the World
 * Network). A null id, or an id that no longer resolves, locks it.
 */
export function briefReachable(
  missionId: string | null,
  contracts: readonly { id: string }[],
): boolean {
  return (
    missionId != null &&
    (contracts.some((c) => c.id === missionId) || resolveMission(missionId) != null)
  )
}

/** Gate for one nav tab. Only BRIEF is ever gated. */
export function navTabGate(tab: NavKind, current: NavKind, briefOpen: boolean): NavTabGate {
  const open = tab === 'brief' ? briefOpen : true
  const locked = !open && tab !== current
  return { open, locked, reason: locked ? BRIEF_LOCK_REASON : undefined }
}
