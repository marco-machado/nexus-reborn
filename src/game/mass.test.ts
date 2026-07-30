import { describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, operativeById } from './data'
import {
  HEAVY_MASS_KG,
  ITEM_MASS_KG,
  LIGHT_MASS_KG,
  MASS_LIMIT_KG,
  TIER_SPEED_DELTA,
  loadoutPools,
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
