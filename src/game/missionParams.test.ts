import { describe, expect, it } from 'vitest'
import { MISSIONS } from './data'
import { mulberry32 } from './rng'
import {
  DIFFICULTY_FX,
  DUSK_END,
  MISSION_CLOCK_BASE,
  OPENING_HOUR_START,
  OPENING_WINDOW_SEC,
  RUST_HAVEN_HOUR,
  adjacentWeather,
  clearerWeather,
  clearWeatherNote,
  missionClockAt,
  missionMods,
  missionPeriod,
  riskWeather,
  rollOpeningHour,
  rollWeatherFront,
  weatherAt,
  weatherBriefLabel,
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
    expect(missionClockAt(150, RUST_HAVEN_HOUR)).toBe('18:16:38')
    expect(weatherNote('heavy', { to: 'light', atSec: 150 }, RUST_HAVEN_HOUR)).toBe(
      'HEAVY RAIN. FRONT CLEARS 18:16:38.',
    )
  })

  it('names clear weather by period and keeps rain lines period-free', () => {
    expect(clearWeatherNote(MISSION_CLOCK_BASE)).toBe(
      'CLEAR NIGHT. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(clearWeatherNote(RUST_HAVEN_HOUR)).toBe(
      'CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(weatherNote('none', undefined, RUST_HAVEN_HOUR)).toBe(
      'CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(weatherNote('light')).toBe('LIGHT RAIN. GUARD SIGHT MILDLY REDUCED.')
    expect(weatherBriefLabel(MISSIONS[0])).toBe('HEAVY RAIN → LIGHT RAIN 22:16:38')
    expect(weatherBriefLabel(MISSIONS[2]!)).toBe('CLEAR DUSK // 18:14:08')
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

describe('opening hour', () => {
  it('treats [18:00, 20:00) as dusk and the rest of the window as night', () => {
    expect(missionPeriod(OPENING_HOUR_START)).toBe('dusk')
    expect(missionPeriod(RUST_HAVEN_HOUR)).toBe('dusk')
    expect(missionPeriod(DUSK_END - 1)).toBe('dusk')
    expect(missionPeriod(DUSK_END)).toBe('night')
    expect(missionPeriod(MISSION_CLOCK_BASE)).toBe('night')
    expect(missionPeriod(0)).toBe('night')
    expect(MISSIONS[0]?.openingHour).toBe(MISSION_CLOCK_BASE)
    expect(MISSIONS[1]?.openingHour).toBe(MISSION_CLOCK_BASE)
    expect(MISSIONS[2]?.openingHour).toBe(RUST_HAVEN_HOUR)
  })

  it('rolls a uniform minute inside the dusk-night window', () => {
    const n = 400
    let dusk = 0
    for (let i = 0; i < n; i++) {
      const rng = mulberry32((i + 1) * 0x9e3779b9)
      const hour = rollOpeningHour(rng)
      const wrapped = hour < OPENING_HOUR_START ? hour + 86400 : hour
      expect(wrapped).toBeGreaterThanOrEqual(OPENING_HOUR_START)
      expect(wrapped).toBeLessThan(OPENING_HOUR_START + OPENING_WINDOW_SEC)
      expect(hour % 60).toBe(0)
      if (missionPeriod(hour) === 'dusk') dusk += 1
    }
    expect(dusk / n).toBeGreaterThan(0.15)
    expect(dusk / n).toBeLessThan(0.45)
  })
})
