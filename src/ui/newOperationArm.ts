// Pure Menu decision for the two-step New Operation erase (PV-002,
// TR-persistence-002, ADR-0011). The arm itself is Menu-local UI state: it
// never touches the campaign blob, and it is lost when the arm lapses or the
// director leaves the Menu, so only a confirm reaches startNewOperation.

/** How long an armed New Operation waits for its confirm before lapsing. */
export const NEW_OPERATION_ARM_MS = 3000

/** What one press of the New Operation control does. */
export type NewOperationPress = 'arm' | 'confirm'

/**
 * Decide what a press of New Operation does. With a valid save on file the
 * first press only arms a confirm; the press while armed confirms. With no
 * save (never-started or a dropped blob) there is nothing to erase, so the
 * press starts at once.
 */
export function pressNewOperation(canContinue: boolean, armed: boolean): NewOperationPress {
  return canContinue && !armed ? 'arm' : 'confirm'
}

/** P-01 armed hint with a save on file: the confirm erases it (main-menu.md Z5). */
export const NEW_OPERATION_ERASE_HINT = 'PRESS AGAIN WITHIN 3 S TO ERASE'

/** P-01 armed hint on a clean origin: nothing to erase, the confirm starts (main-menu.md Z5). */
export const NEW_OPERATION_START_HINT = 'PRESS AGAIN WITHIN 3 S TO START'

/**
 * Text for the Menu's P-01 message slot (Z5). Empty while idle, so a disarm
 * clears the slot silently; armed, it names the window and the consequence.
 */
export function newOperationArmHint(canContinue: boolean, armed: boolean): string {
  if (!armed) return ''
  return canContinue ? NEW_OPERATION_ERASE_HINT : NEW_OPERATION_START_HINT
}
