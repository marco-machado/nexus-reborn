import { describe, expect, it } from 'vitest'
import { MISSIONS } from './data'
import { mulberry32 } from './rng'
import {
  DIFFICULTY_FX,
  adjacentWeather,
  clearerWeather,
  missionClockAt,
  missionMods,
  riskWeather,
  rollWeatherFront,
  weatherAt,
  weatherNote,
} from './missionParams'

describe('difficulty modifiers', () => {
  it('HARDENED adds patrols and civilians; STANDARD matches the authored baseline', () => {
    const mission = MISSIONS[0]
    const standard = missionMods(mission)
    const hardened = missionMods(mission, undefined, 'hardened')
    expect(hardened.enemyExtra - standard.enemyExtra).toBe(DIFFICULTY_FX.hardened.extraPatrol)
    expect(hardened.civilianCount - standard.civilianCount).toBe(
      DIFFICULTY_FX.hardened.extraCivilians,
    )
    expect(DIFFICULTY_FX.hardened.extraPatrol).toBeGreaterThan(0)
    expect(DIFFICULTY_FX.hardened.extraCivilians).toBeGreaterThan(0)
    expect(missionMods(mission, undefined, 'standard')).toEqual(standard)
  })
})

describe('weather script', () => {
  it('keeps adjacent steps and treats clearer weather as the worse fight', () => {
    expect(adjacentWeather('heavy')).toEqual(['light'])
    expect(adjacentWeather('none')).toEqual(['light'])
    expect(adjacentWeather('light')).toEqual(['none', 'heavy'])
    expect(clearerWeather('heavy', 'light')).toBe('light')
    expect(riskWeather(MISSIONS[0])).toBe('light')
    expect(weatherAt(MISSIONS[0], 149)).toBe('heavy')
    expect(weatherAt(MISSIONS[0], 150)).toBe('light')
    expect(missionClockAt(150)).toBe('22:16:38')
    expect(weatherNote('heavy', { to: 'light', atSec: 150 })).toBe(
      'HEAVY RAIN. FRONT CLEARS 22:16:38.',
    )
  })

  it('rolls a front about two times in five on a seeded stream', () => {
    let fronts = 0
    const n = 200
    for (let i = 0; i < n; i++) {
      const rng = mulberry32((i + 1) * 0x9e3779b9)
      if (rollWeatherFront(rng, 'light')) fronts += 1
    }
    expect(fronts / n).toBeGreaterThan(0.25)
    expect(fronts / n).toBeLessThan(0.55)
  })
})
