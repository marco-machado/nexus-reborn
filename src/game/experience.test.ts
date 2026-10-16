import { describe, expect, it } from 'vitest'
import { XP_PER_SURVIVE, xpBonus } from './experience'

// Living spec §6 / GDD roster-and-assembly rule 10: each point is +2 max HP and
// +0.05 m/s. Expected values are those literals, never XP_HP_PER / XP_SPEED_PER.
describe('xpBonus', () => {
  it('scales health and speed from whole experience points', () => {
    expect(xpBonus(0)).toEqual({ maxHp: 0, speed: 0 })
    expect(XP_PER_SURVIVE).toBe(1)
    expect(xpBonus(XP_PER_SURVIVE)).toEqual({ maxHp: 2, speed: 0.05 })
    expect(xpBonus(3).maxHp).toBe(6)
    expect(xpBonus(3).speed).toBeCloseTo(0.15, 10)
  })

  it('floors and clamps garbage to zero', () => {
    expect(xpBonus(1.9)).toEqual({ maxHp: 2, speed: 0.05 })
    expect(xpBonus(-4)).toEqual({ maxHp: 0, speed: 0 })
    expect(xpBonus(Number.NaN)).toEqual({ maxHp: 0, speed: 0 })
  })
})
