import { describe, expect, it } from 'vitest'
import { WEAPONS } from '../../src/game/data'
import {
  ARMOR_HP_FLOOR,
  ARMOR_KG_PER_HP,
  OPERATIVE_BASE_KG,
  operativeMassKg,
} from '../../src/game/mass'
import type { OperativeDef } from '../../src/game/types'

const operative: OperativeDef = {
  id: 'fixture',
  name: 'Fixture',
  codename: 'FIX',
  role: 'assault',
  maxHp: 100,
  speed: 1,
  weapon: 'assault',
  sidearm: 'pistol',
  accent: '#ffffff',
  status: 'READY',
  bio: 'fixture',
}

describe('weapon mass feeds deployment mass', () => {
  it('adds authored weapon kilograms to the operative base', () => {
    const kg = operativeMassKg(operative, 0)
    const expected =
      OPERATIVE_BASE_KG +
      WEAPONS.assault.massKg +
      WEAPONS.pistol.massKg +
      (operative.maxHp - ARMOR_HP_FLOOR) * ARMOR_KG_PER_HP
    expect(kg).toBe(expected)
    expect(WEAPONS.assault.massKg).toBeGreaterThan(0)
  })
})
