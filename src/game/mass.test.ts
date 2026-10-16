import { describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, WEAPONS, operativeById } from './data'
import {
  emptyLoadout,
  HEAVY_MASS_KG,
  ITEM_MASS_KG,
  LIGHT_MASS_KG,
  LOADOUT_SLOTS,
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
import type { OperativeLoadout, SquadLoadout } from './mass'
import type { OperativeDef } from './types'
import { rosterSlice } from './deploy'
import { canDeploy } from './deployGate'

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

// Story RA-002: Item-slot and pool mass terms (GDD AC 46, 47, 48, 65).
describe('item-slot and pool mass terms (TR-roster-001)', () => {
  // Body, rig, both weapons and plating: everything but the Item slots.
  function bodyKg(op: OperativeDef): number {
    return (
      60 +
      WEAPONS[op.weapon].massKg +
      WEAPONS[op.sidearm].massKg +
      Math.max(0, op.maxHp - 90) * 0.25
    )
  }

  it('adds 0 kg for base and role-granted mission pools (AC 46)', () => {
    // The medic, support and tech roles grant mission pool stock in world.ts;
    // none of it reaches the kilogram sum.
    for (const id of ['op6', 'op7', 'op8']) {
      const op = operativeById(id)
      expect(operativeMassKg(op, 0, emptyLoadout())).toBeCloseTo(bodyKg(op), 10)
      const unpooled: OperativeDef = { ...op, role: 'assault' }
      expect(operativeMassKg(op, 0)).toBeCloseTo(operativeMassKg(unpooled, 0), 10)
    }
    // Empty Item slots contribute no pool stock either.
    expect(loadoutPools(['op6', 'op7', 'op8'].map(operativeById))).toEqual({ med: 0, cell: 0 })
  })

  it('weighs Item slots at 8m + 6c kg for every m + c <= 2 (AC 47)', () => {
    const cases: Array<[OperativeLoadout, number, number]> = [
      [[null, null], 0, 0],
      [['med', null], 1, 0],
      [[null, 'cell'], 0, 1],
      [['med', 'med'], 2, 0],
      [['med', 'cell'], 1, 1],
      [['cell', 'cell'], 0, 2],
    ]
    for (const [items, m, c] of cases) {
      expect(operativeMassKg(OP1, 0, items) - bodyKg(OP1)).toBeCloseTo(8 * m + 6 * c, 10)
    }
  })

  it('keeps both slots occupied when m + c = 2 and offers no third slot (AC 48)', () => {
    const full: SquadLoadout = { op1: ['med', 'cell'] }
    expect(LOADOUT_SLOTS).toBe(2)
    expect(operativeItems(full, 'op1')).toEqual(['med', 'cell'])
    expect(loadoutPools([OP1], full)).toEqual({ med: 1, cell: 1 })
    expect(squadMassKg([OP1], 0, full)).toBeCloseTo(73.9 + 14, 10)
  })

  it('adds 0 kg and 0 Item-slot pools for an unassigned operative (AC 65)', () => {
    const squad = ['op1'].map(operativeById)
    // op7 has a full loadout entry but is not in the squad.
    const loadout: SquadLoadout = { op1: [null, null], op7: ['med', 'cell'] }
    expect(squadMassKg(squad, 0, loadout)).toBeCloseTo(73.9, 10)
    expect(loadoutPools(squad, loadout)).toEqual({ med: 0, cell: 0 })
  })
})

// Story RA-004: Mass tier light and standard bands (GDD AC 53, 54, 70, 71).
describe('mass tier light and standard bands (TR-roster-002)', () => {
  const deployAt = (massKg: number) =>
    canDeploy({
      missionSelected: true,
      assignedIds: ['op1'],
      statusById: { op1: 'READY' },
      massKg,
    })
  const delta = (kg: number) => tierSpeedDelta(massTier(kg))

  it('samples +0.15 m/s once for the whole default four at 286.1 kg (AC 70)', () => {
    const squad = DEFAULT_SQUAD.map(operativeById)
    const slice = rosterSlice(squad, [], {}, {})
    expect(slice.massKg).toBeCloseTo(286.1, 10)
    expect(slice.massTier).toBe('light')
    expect(delta(slice.massKg)).toBe(0.15)
    // One squad-wide adjustment: every body gets exactly +0.15, not a
    // per-operative figure and not applied twice.
    for (const op of squad) {
      expect(slice.speed[op.id]).toBeCloseTo(op.speed + 0.15, 10)
    }
  })

  it('maps any mass to exactly one of +0.15, 0 or -0.15 m/s (AC 71)', () => {
    const sweep: Array<[number, number]> = [
      [0, 0.15],
      [286.1, 0.15],
      [340, 0.15],
      [340.1, 0],
      [360, 0],
      [380, 0],
      [380.1, -0.15],
      [400, -0.15],
    ]
    for (const [kg, expected] of sweep) {
      const d = delta(kg)
      expect([0.15, 0, -0.15]).toContain(d)
      expect(d).toBe(expected)
    }
  })

  it('gives +0.15 m/s at exactly 340 kg and allows Deploy (AC 53)', () => {
    expect(massTier(340)).toBe('light')
    expect(delta(340)).toBe(0.15)
    expect(deployAt(340).ok).toBe(true)
  })

  it('gives 0 m/s at 340.1 kg and allows Deploy (AC 54)', () => {
    expect(massTier(340.1)).toBe('standard')
    expect(delta(340.1)).toBe(0)
    expect(deployAt(340.1).ok).toBe(true)
  })

  it('reads a computed four-body sum of 340 kg as light', () => {
    // Ghost, Dart, Torq and Slate with three med+med pairs and one cell+cell:
    // 66.3 + 63.3 + 76.6 + 64.8 bodies plus 60 kg of items, summed by the
    // model rather than written as a literal.
    const squad = ['op2', 'op3', 'op4', 'op6'].map(operativeById)
    const loadout: SquadLoadout = {
      op2: ['med', 'med'],
      op3: ['med', 'med'],
      op4: ['med', 'med'],
      op6: ['cell', 'cell'],
    }
    const kg = squadMassKg(squad, 0, loadout)
    expect(kg).toBe(340)
    expect(massTier(kg)).toBe('light')
    expect(rosterSlice(squad, [], {}, loadout).massTier).toBe('light')
  })

  it('applies no epsilon: a hair over 340 kg is standard', () => {
    expect(massTier(340.0000001)).toBe('standard')
    expect(massTier(340 + Number.EPSILON * 340)).toBe('standard')
  })
})

// Story RA-005: Mass tier heavy band and the 400 kg limit (GDD AC 51, 52, 55, 56).
describe('mass tier heavy band and the 400 kg limit (TR-roster-001)', () => {
  const deployAt = (massKg: number, assignedIds: readonly string[] = ['op1']) =>
    canDeploy({
      missionSelected: true,
      assignedIds,
      statusById: Object.fromEntries(assignedIds.map((id) => [id, 'READY' as const])),
      massKg,
    })
  const delta = (kg: number) => tierSpeedDelta(massTier(kg))

  it('gives 0 m/s at exactly 380 kg, not heavy, and allows Deploy (AC 55)', () => {
    expect(massTier(380)).toBe('standard')
    expect(delta(380)).toBe(0)
    expect(deployAt(380).ok).toBe(true)
  })

  it('gives -0.15 m/s at 380.1 kg and allows Deploy (AC 56)', () => {
    expect(massTier(380.1)).toBe('heavy')
    expect(delta(380.1)).toBe(-0.15)
    expect(deployAt(380.1).ok).toBe(true)
  })

  it.each([1, 2, 3, 4])(
    'allows Deploy at exactly 400 kg with %i distinct Ready operatives, delta -0.15 (AC 51)',
    (n) => {
      const ids = ['op1', 'op2', 'op3', 'op4'].slice(0, n)
      expect(deployAt(MASS_LIMIT_KG, ids)).toEqual({ ok: true, reason: null, overKg: 0 })
      expect(delta(MASS_LIMIT_KG)).toBe(-0.15)
    },
  )

  it('refuses Deploy at 400.1 kg as over-mass and names a 0.1 kg overage (AC 52)', () => {
    const g = deployAt(400.1)
    expect(g.ok).toBe(false)
    expect(g.reason).toBe('over-mass')
    expect(g.overKg).toBeCloseTo(0.1, 10)
    // The Team screen's refusal copy formats overKg to one decimal.
    expect(g.overKg.toFixed(1)).toBe('0.1')
  })

  it('refuses one Ready body over 400 kg alone as over-mass, not as an empty Squad', () => {
    const kg = operativeMassKg(OP1, 1400)
    expect(kg).toBeGreaterThan(MASS_LIMIT_KG)
    const g = deployAt(kg)
    expect(g.ok).toBe(false)
    expect(g.reason).toBe('over-mass')
    expect(g.overKg).toBeCloseTo(kg - MASS_LIMIT_KG, 10)
  })
})
