// The deploy gate (ADR-0019): a selected contract, one to four assigned
// operatives, every one READY, and squad mass within the limit. Pure, so the
// Team screen and appStore.startMission ask the same question. Empty Squad
// bays do not block. Tactical never re-checks or relaxes this.
import type { OperativeDef } from './types'
import type { BayPins } from './research'
import { appliedNodeIds, crewBonus } from './research'
import { xpBonus } from './experience'
import { MASS_LIMIT_KG, massGateOk, squadMassKg } from './mass'
import type { SquadLoadout } from './mass'

/** Most operatives one deployment can field. */
export const MAX_SQUAD = 4

/** Why Deploy is refused, in the order the checks run. */
export type DeployRefusal = 'no-contract' | 'none-assigned' | 'not-ready' | 'over-mass'

/** Everything the gate reads. The caller resolves stores; the gate never does. */
export interface DeployGateInput {
  missionSelected: boolean
  assignedIds: readonly string[]
  statusById: Readonly<Record<string, 'READY' | 'INJURED' | undefined>>
  massKg: number
}

export interface DeployGate {
  ok: boolean
  /** Null exactly when `ok`. */
  reason: DeployRefusal | null
  /** `massKg - MASS_LIMIT_KG`; at or below 0 when mass passes. */
  overKg: number
}

/**
 * ADR-0019 deploy gate. The first failing check names the reason. A Squad
 * that is empty, over MAX_SQUAD or lists an operative twice has no valid
 * assignment and refuses as `none-assigned`; toggleOperative never builds the
 * last two, so only a post-KIA empty Squad reaches it in play.
 */
export function canDeploy({
  missionSelected,
  assignedIds,
  statusById,
  massKg,
}: DeployGateInput): DeployGate {
  const overKg = massKg - MASS_LIMIT_KG
  const refuse = (reason: DeployRefusal): DeployGate => ({ ok: false, reason, overKg })
  if (!missionSelected) return refuse('no-contract')
  const n = assignedIds.length
  if (n < 1 || n > MAX_SQUAD || new Set(assignedIds).size !== n) return refuse('none-assigned')
  if (!assignedIds.every((id) => statusById[id] === 'READY')) return refuse('not-ready')
  if (!massGateOk(massKg)) return refuse('over-mass')
  return { ok: true, reason: null, overKg }
}

/** Per-operative state the mass model reads: worn research and Experience. */
export type MassRoster = Readonly<Record<string, { pins: BayPins; xp: number } | undefined>>

/**
 * Squad mass as Assembly shows it and the gate checks it: each assigned
 * operative carries its research and Experience max-HP bonus as armor mass.
 */
export function assignedMassKg(
  ops: readonly OperativeDef[],
  done: readonly string[],
  roster: MassRoster,
  loadout: SquadLoadout,
): number {
  const hpBonus: Record<string, number> = {}
  for (const op of ops) {
    hpBonus[op.id] =
      crewBonus(appliedNodeIds(done, roster[op.id]?.pins)).maxHp +
      xpBonus(roster[op.id]?.xp ?? 0).maxHp
  }
  return squadMassKg(ops, hpBonus, loadout)
}
