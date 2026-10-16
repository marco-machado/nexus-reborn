import { describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, WEAPONS, operativeById } from './data'
import {
  emptyLoadout,
  HEAVY_MASS_KG,
  ITEM_MASS_KG,
  LIGHT_MASS_KG,
  MASS_LIMIT_KG,
  TIER_SPEED_DELTA,
  loadoutPools,
  massGateOk,
  massTier,
  operativeItems,
  operativeMassKg,
  squadMassKg,
  tierSpeedDelta,
} from './mass'
import type { OperativeDef } from './types'

const OP1 = operativeById('op1')

describe('operativeMassKg', () => {
  it('sums base, both weapon slots and armor mass over the HP floor', () => {
    // 60 base + 4.2 assault + 1.2 pistol + (124 - 90) * 0.25 armor.
    expect(operativeMassKg(OP1, 0)).toBeCloseTo(73.9, 10)
  })

  it('counts research max-HP bonuses as armor mass', () => {
    expect(operativeMassKg(OP1, 14)).toBeCloseTo(73.9 + 14 * 0.25, 10)
  })

  it('adds the authored item masses for filled loadout slots', () => {
    expect(operativeMassKg(OP1, 0, ['med', 'cell'])).toBeCloseTo(
      73.9 + ITEM_MASS_KG.med + ITEM_MASS_KG.cell,
      10,
    )
    expect(operativeMassKg(OP1, 0, ['med', null])).toBeCloseTo(73.9 + ITEM_MASS_KG.med, 10)
  })

  it('charges no armor mass below the HP floor', () => {
    const featherweight: OperativeDef = { ...OP1, maxHp: 80 }
    expect(operativeMassKg(featherweight, 0)).toBeCloseTo(60 + 4.2 + 1.2, 10)
  })
})

// Story RA-001: GDD reference values (AC 61-64). Inputs come from the
// authored roster and weapon table; the expected kilograms are the GDD oracles.
describe('operativeMassKg reference values (TR-roster-001)', () => {
  it('weighs Mara at 73.9 kg with no research, Experience or items (AC 61)', () => {
    const mara = operativeById('op1')
    expect(mara.codename).toBe('MARA')
    expect(mara.maxHp).toBe(124)
    expect(WEAPONS[mara.weapon].massKg).toBe(4.2)
    expect(WEAPONS[mara.sidearm].massKg).toBe(1.2)
    expect(operativeMassKg(mara, 0, emptyLoadout())).toBeCloseTo(73.9, 10)
  })

  it('weighs Ghost 69.3, Dart 66.3 and Torq 76.6 kg under the same conditions (AC 62)', () => {
    const expected: Array<[string, string, number]> = [
      ['op2', 'GHOST', 69.3],
      ['op3', 'DART', 66.3],
      ['op4', 'TORQ', 76.6],
    ]
    for (const [id, codename, kg] of expected) {
      const op = operativeById(id)
      expect(op.codename).toBe(codename)
      expect(operativeMassKg(op, 0, emptyLoadout())).toBeCloseTo(kg, 10)
    }
  })

  it('weighs pistol + pistol at H <= 90 with empty slots at 62.4 kg, plating 0 (AC 63)', () => {
    const pistols: OperativeDef = { ...OP1, maxHp: 90, weapon: 'pistol', sidearm: 'pistol' }
    expect(operativeMassKg(pistols, 0, emptyLoadout())).toBeCloseTo(62.4, 10)
    // Well under the floor the plating term clamps at 0, never negative.
    expect(operativeMassKg({ ...pistols, maxHp: 40 }, 0)).toBeCloseTo(62.4, 10)
  })

  it('adds 0.25 kg of plating at H 91, one point over the floor', () => {
    const pistols: OperativeDef = { ...OP1, maxHp: 91, weapon: 'pistol', sidearm: 'pistol' }
    expect(operativeMassKg(pistols, 0)).toBeCloseTo(62.65, 10)
  })

  it('weighs Mara with one med kit and one power cell at 87.9 kg (AC 64)', () => {
    expect(operativeMassKg(operativeById('op1'), 0, ['med', 'cell'])).toBeCloseTo(87.9, 10)
  })
})

describe('squadMassKg', () => {
  it('sums the deployed operatives with their own loadouts', () => {
    const ops = DEFAULT_SQUAD.map(operativeById)
    // 73.9 + 69.3 + 66.3 + 76.6 by hand.
    expect(squadMassKg(ops, 0)).toBeCloseTo(286.1, 10)
    expect(squadMassKg(ops, 0, { op1: ['med', 'med'] })).toBeCloseTo(
      286.1 + 2 * ITEM_MASS_KG.med,
      10,
    )
  })

  it('adds nothing for living roster members left off the squad (AC 67)', () => {
    const ops = DEFAULT_SQUAD.map(operativeById)
    // A loadout entry for an unassigned operative must not leak into the sum.
    expect(squadMassKg(ops, 0, { op5: ['med', 'cell'] })).toBeCloseTo(286.1, 10)
  })
})

describe('massGateOk', () => {
  it('passes the default squad at 286.1 kg (AC 68)', () => {
    expect(massGateOk(squadMassKg(DEFAULT_SQUAD.map(operativeById), 0))).toBe(true)
  })

  it('allows exactly the limit and refuses anything over it (AC 69)', () => {
    expect(massGateOk(MASS_LIMIT_KG - 0.1)).toBe(true)
    expect(massGateOk(MASS_LIMIT_KG)).toBe(true)
    expect(massGateOk(MASS_LIMIT_KG + 0.1)).toBe(false)
  })
})

describe('mass tiers', () => {
  it('splits light, standard and heavy at the authored limits', () => {
    expect(massTier(LIGHT_MASS_KG)).toBe('light')
    expect(massTier(LIGHT_MASS_KG + 0.1)).toBe('standard')
    expect(massTier(HEAVY_MASS_KG)).toBe('standard')
    expect(massTier(HEAVY_MASS_KG + 0.1)).toBe('heavy')
  })

  it('maps each tier onto its squad speed delta', () => {
    expect(tierSpeedDelta('light')).toBe(TIER_SPEED_DELTA)
    expect(tierSpeedDelta('standard')).toBe(0)
    expect(tierSpeedDelta('heavy')).toBe(-TIER_SPEED_DELTA)
  })

  it('keeps the tier lines under the deploy limit', () => {
    expect(LIGHT_MASS_KG).toBeLessThan(HEAVY_MASS_KG)
    expect(HEAVY_MASS_KG).toBeLessThan(MASS_LIMIT_KG)
  })
})

describe('loadout helpers', () => {
  it('reads missing operatives and slots as empty', () => {
    expect(operativeItems(undefined, 'op1')).toEqual([null, null])
    expect(operativeItems({ op1: ['med', null] }, 'op1')).toEqual(['med', null])
    expect(operativeItems({ op1: ['med', null] }, 'op2')).toEqual([null, null])
  })

  it('counts only the deployed operatives into the item pools', () => {
    const ops = ['op1', 'op2'].map(operativeById)
    const pools = loadoutPools(ops, {
      op1: ['med', 'cell'],
      op2: ['med', null],
      op5: ['cell', 'cell'],
    })
    expect(pools).toEqual({ med: 2, cell: 1 })
  })
})
