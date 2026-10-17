// Pure copy for the Menu's Z3 save-status line (design/ux/main-menu.md Z3,
// Persistence Rule 8). Interface reads the three-state report from Persistence
// (state/save.ts menuSaveStatus) and never validates the blob itself. The line
// is text, so never-started and unreadable differ without colour.
import type { CampaignSlotStatus } from '../state/save'

export const SAVE_LINE_VALID = 'CAMPAIGN ON FILE'
export const SAVE_LINE_NEVER_STARTED = 'NO CAMPAIGN ON FILE'
export const SAVE_LINE_INVALID = 'SAVE UNREADABLE // DROPPED'

/** Z3 text for one Persistence report. */
export function menuSaveLine(status: CampaignSlotStatus): string {
  if (status === 'valid') return SAVE_LINE_VALID
  return status === 'invalid' ? SAVE_LINE_INVALID : SAVE_LINE_NEVER_STARTED
}

/** Continue is offered only for a valid blob. */
export function continueOffered(status: CampaignSlotStatus): boolean {
  return status === 'valid'
}
