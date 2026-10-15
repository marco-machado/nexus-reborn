import { describe, expect, it } from 'vitest'
import { UNFILED_LINE, debriefFilingLine } from './filingStatus'

describe('debriefFilingLine (P-19, PV-017)', () => {
  it('unfiled prints the unfiled sentence', () => {
    expect(debriefFilingLine('unfiled')).toBe(UNFILED_LINE)
    expect(UNFILED_LINE.length).toBeGreaterThan(0)
  })

  it('filed removes the unfiled sentence (not a colour swap)', () => {
    expect(debriefFilingLine('filed')).toBeNull()
  })

  it('write-failed prints nothing here (Story 018 owns that copy)', () => {
    expect(debriefFilingLine('write-failed')).toBeNull()
  })
})
