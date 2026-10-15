import { describe, expect, it } from 'vitest'
import {
  UNFILED_LINE,
  WRITE_FAILED_LINE,
  debriefFilingLine,
  screenWriteFailureLine,
} from './filingStatus'

describe('debriefFilingLine (P-19, PV-017)', () => {
  it('unfiled prints the unfiled sentence', () => {
    expect(debriefFilingLine('unfiled')).toBe(UNFILED_LINE)
    expect(UNFILED_LINE.length).toBeGreaterThan(0)
  })

  it('filed removes the unfiled sentence (not a colour swap)', () => {
    expect(debriefFilingLine('filed')).toBeNull()
  })

  it('write-failed prints the failure sentence, never the filed state (PV-018)', () => {
    expect(debriefFilingLine('write-failed')).toBe(WRITE_FAILED_LINE)
    expect(WRITE_FAILED_LINE).not.toBe(UNFILED_LINE)
  })
})

describe('screenWriteFailureLine (P-11, PV-018)', () => {
  it('only write-failed shows the Screen advisory', () => {
    expect(screenWriteFailureLine('write-failed')).toBe(WRITE_FAILED_LINE)
    expect(screenWriteFailureLine('unfiled')).toBeNull()
    expect(screenWriteFailureLine('filed')).toBeNull()
  })
})
