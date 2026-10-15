// Pause → Abort, the third P-01 two-step use. Kept out of the component so the
// hint mapping runs without a DOM.

/** How long an armed Abort waits for its confirm before disarming (P-01: 3 real seconds). */
export const ABORT_ARM_MS = 3000

/** P-01 armed hint: names the window and the consequence. Placeholder copy pending /ux-design. */
export const ABORT_ARM_HINT = 'PRESS AGAIN WITHIN 3 S TO ABORT MISSION'

/** Text for the Pause menu's P-01 message slot; empty while idle, so a disarm clears it silently. */
export function abortArmHint(armed: boolean): string {
  return armed ? ABORT_ARM_HINT : ''
}
