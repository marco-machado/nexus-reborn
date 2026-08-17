import { describe, expect, it } from 'vitest'
import { XP_HP_PER, XP_PER_SURVIVE, XP_SPEED_PER, xpBonus } from './experience'

describe('xpBonus', () => {
  it('scales health and speed from whole experience points', () => {
    expect(xpBonus(0)).toEqual({ maxHp: 0, speed: 0 })
    expect(xpBonus(XP_PER_SURVIVE)).toEqual({
      maxHp: XP_HP_PER,
      speed: XP_SPEED_PER,
    })
    expect(xpBonus(3)).toEqual({ maxHp: 3 * XP_HP_PER, speed: 3 * XP_SPEED_PER })
  })

  it('floors and clamps garbage to zero', () => {
    expect(xpBonus(1.9)).toEqual({ maxHp: XP_HP_PER, speed: XP_SPEED_PER })
    expect(xpBonus(-4)).toEqual({ maxHp: 0, speed: 0 })
    expect(xpBonus(Number.NaN)).toEqual({ maxHp: 0, speed: 0 })
  })
})
