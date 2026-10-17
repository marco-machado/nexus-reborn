// Pause → Abort, the third P-01 two-step use (TR-interface-006, ADR-0002).
// Kept out of the component so the arm, its real-time window and the hint
// mapping all run without a DOM: PauseMenu drives the same controller the
// tests drive.

/** How long an armed Abort waits for its confirm before disarming (P-01: 3 real seconds). */
export const ABORT_ARM_MS = 3000

/** P-01 armed hint: names the window and the consequence. Placeholder copy pending /ux-design. */
export const ABORT_ARM_HINT = 'PRESS AGAIN WITHIN 3 S TO ABORT MISSION'

/** Text for the Pause menu's P-01 message slot; empty while idle, so a disarm clears it silently. */
export function abortArmHint(armed: boolean): string {
  return armed ? ABORT_ARM_HINT : ''
}

/** What one activation of the Abort control does. */
export type AbortPress = 'arm' | 'confirm'

/** The first activation only arms; an activation while armed confirms. */
export function pressAbort(armed: boolean): AbortPress {
  return armed ? 'confirm' : 'arm'
}

/** A Pause-menu Abort arm: one per open menu. */
export interface AbortArm {
  /** True between an arming press and its confirm or timeout. */
  readonly armed: boolean
  /**
   * One activation. Idle, it arms and starts the window; armed, it disarms
   * and returns 'confirm'. The caller discards the mission only on 'confirm',
   * so arming alone never touches the mission.
   */
  press(): AbortPress
  /** Drops a pending window without confirming (menu closed or unmounted). */
  disarm(): void
}

/**
 * Create the two-step Abort arm. The window runs on real time (`setTimeout`),
 * not on the Tactical clock, which is frozen while the menu is up; when it
 * lapses unconfirmed the arm returns to idle and the mission stays paused, so
 * the next press only re-arms. `onChange` reports every armed/idle flip so the
 * menu can paint the armed state and its hint.
 */
export function createAbortArm(onChange: (armed: boolean) => void = () => {}): AbortArm {
  let armed = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const clear = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }
  const set = (next: boolean): void => {
    if (armed === next) return
    armed = next
    onChange(next)
  }

  return {
    get armed() {
      return armed
    },
    press() {
      const what = pressAbort(armed)
      clear()
      if (what === 'confirm') {
        set(false)
      } else {
        set(true)
        timer = setTimeout(() => {
          timer = null
          set(false)
        }, ABORT_ARM_MS)
      }
      return what
    },
    disarm() {
      clear()
      set(false)
    },
  }
}
