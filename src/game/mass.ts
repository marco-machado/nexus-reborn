// Deployment mass model, every number in one place. The assembly screen and
// createWorld call the same functions, so the kilograms the player reads are
// the kilograms the mission applies.
//
// Per operative: OPERATIVE_BASE_KG for body and rig, the authored massKg of
// both weapon slots, ARMOR_KG_PER_HP for every max-HP point above
// ARMOR_HP_FLOOR (plating is where the extra health comes from), and the two
// loadout item slots. Research max-HP projects add mass through the same HP
// term: callers pass the worn-and-experience HP bonus per operative so
// the squad weighs what it fights at.
import type { OperativeDef } from './types'
import { WEAPONS } from './data'

export type LoadoutItemId = 'med' | 'cell'
// Two extra item slots per operative: MED KIT, POWER CELL or empty.
export type OperativeLoadout = [LoadoutItemId | null, LoadoutItemId | null]
// Keyed by operative id. A missing entry means both slots empty.
export type SquadLoadout = Record<string, OperativeLoadout>

export const LOADOUT_SLOTS = 2
export const ITEM_MASS_KG: Record<LoadoutItemId, number> = { med: 8, cell: 6 }
export const ITEM_LABEL: Record<LoadoutItemId, string> = { med: 'MED KIT', cell: 'POWER CELL' }

export const OPERATIVE_BASE_KG = 60
export const ARMOR_HP_FLOOR = 90
export const ARMOR_KG_PER_HP = 0.25
// The deploy button refuses a squad over this.
export const MASS_LIMIT_KG = 400
// At or under LIGHT the squad moves faster; over HEAVY it moves slower.
export const LIGHT_MASS_KG = 340
export const HEAVY_MASS_KG = 380
export const TIER_SPEED_DELTA = 0.15

export type MassTier = 'light' | 'standard' | 'heavy'

export function emptyLoadout(): OperativeLoadout {
  return [null, null]
}

export function operativeItems(
  loadout: SquadLoadout | undefined,
  opId: string,
): OperativeLoadout {
  const items = loadout?.[opId]
  return [items?.[0] ?? null, items?.[1] ?? null]
}

export function operativeMassKg(
  op: OperativeDef,
  maxHpBonus: number,
  items: OperativeLoadout = emptyLoadout(),
): number {
  let kg = OPERATIVE_BASE_KG + WEAPONS[op.weapon].massKg + WEAPONS[op.sidearm].massKg
  kg += Math.max(0, op.maxHp + maxHpBonus - ARMOR_HP_FLOOR) * ARMOR_KG_PER_HP
  for (const item of items) {
    if (item) kg += ITEM_MASS_KG[item]
  }
  return kg
}

export function squadMassKg(
  ops: readonly OperativeDef[],
  maxHpBonus: number | Readonly<Record<string, number>>,
  loadout?: SquadLoadout,
): number {
  return ops.reduce((sum, op) => {
    const bonus = typeof maxHpBonus === 'number' ? maxHpBonus : (maxHpBonus[op.id] ?? 0)
    return sum + operativeMassKg(op, bonus, operativeItems(loadout, op.id))
  }, 0)
}

export function massTier(kg: number): MassTier {
  if (kg <= LIGHT_MASS_KG) return 'light'
  if (kg > HEAVY_MASS_KG) return 'heavy'
  return 'standard'
}

// The whole squad shares one adjustment; per-operative deltas would punish
// the heavy roles twice, once in HP-mass and once in speed.
export function tierSpeedDelta(tier: MassTier): number {
  if (tier === 'light') return TIER_SPEED_DELTA
  if (tier === 'heavy') return -TIER_SPEED_DELTA
  return 0
}

// Extra med/cell stock the loadout adds to the mission item pools.
export function loadoutPools(
  ops: readonly OperativeDef[],
  loadout?: SquadLoadout,
): { med: number; cell: number } {
  const out = { med: 0, cell: 0 }
  for (const op of ops) {
    for (const item of operativeItems(loadout, op.id)) {
      if (item) out[item] += 1
    }
  }
  return out
}
