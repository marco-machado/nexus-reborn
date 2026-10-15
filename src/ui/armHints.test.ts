import { describe, expect, it } from 'vitest'
import { ABORT_ARM_HINT, abortArmHint } from './abortArm'
import {
  NEW_OPERATION_ERASE_HINT,
  NEW_OPERATION_START_HINT,
  newOperationArmHint,
} from './newOperationArm'

// P-01: while armed a reserved slot prints a hint naming the window and the
// consequence; disarm clears it (design/ux/interaction-patterns.md P-01,
// design/ux/main-menu.md Z5).
describe('P-01 armed hint slot', () => {
  it('Menu New Operation prints the erase hint when a save is on file', () => {
    expect(newOperationArmHint(true, true)).toBe('PRESS AGAIN WITHIN 3 S TO ERASE')
    expect(NEW_OPERATION_ERASE_HINT).toBe('PRESS AGAIN WITHIN 3 S TO ERASE')
  })

  it('Menu New Operation prints the start hint on a clean origin', () => {
    expect(newOperationArmHint(false, true)).toBe('PRESS AGAIN WITHIN 3 S TO START')
    expect(NEW_OPERATION_START_HINT).toBe('PRESS AGAIN WITHIN 3 S TO START')
  })

  it('Menu slot is empty while idle, so disarm clears it', () => {
    expect(newOperationArmHint(true, false)).toBe('')
    expect(newOperationArmHint(false, false)).toBe('')
  })

  it('Pause Abort prints its hint only while armed', () => {
    expect(abortArmHint(true)).toBe(ABORT_ARM_HINT)
    expect(ABORT_ARM_HINT).toMatch(/^PRESS AGAIN WITHIN 3 S TO /)
    expect(abortArmHint(false)).toBe('')
  })
})
