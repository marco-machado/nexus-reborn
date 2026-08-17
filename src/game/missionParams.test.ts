import { describe, expect, it } from 'vitest'
import { MISSIONS } from './data'
import { DIFFICULTY_FX, missionMods } from './missionParams'

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
