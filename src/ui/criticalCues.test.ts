import { describe, expect, it } from 'vitest'
import { healthCue, objectiveCue } from './criticalCues'

describe('critical-state cues (IF-002)', () => {
  it('objective state: done > failed > active > pending', () => {
    expect(objectiveCue({ done: true, failed: true, active: true })).toBe('done')
    expect(objectiveCue({ done: false, failed: true, active: true })).toBe('failed')
    expect(objectiveCue({ done: false, active: true })).toBe('active')
    expect(objectiveCue({ done: false, active: false })).toBe('pending')
  })

  it('health: KIA when dead, injured under 30% of max, ok otherwise', () => {
    expect(healthCue(50, 100, true)).toBe('kia')
    expect(healthCue(29, 100, false)).toBe('injured')
    expect(healthCue(30, 100, false)).toBe('ok')
    expect(healthCue(100, 100, false)).toBe('ok')
    expect(healthCue(0, 0, false)).toBe('ok')
  })
})
