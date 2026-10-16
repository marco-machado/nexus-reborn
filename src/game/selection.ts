// Squad selection rules (GDD tactical-mission §4, AC 1a / 1b / 1d). Pure: the
// functions read the world's unit list and return the next selection; the
// caller (scene/Input.tsx) writes it to the mission store. The dead are never
// a valid recipient, so every rule here filters to the living set.
import type { Unit, WorldApi } from './types'

/** The parts of the world the selection rules read. */
export type SelectionWorld = Pick<WorldApi, 'units' | 'unit'>

/** A unit under the pointer: agents are selection targets, enemies are not. */
export interface SelectionPick {
  id: string
  agent: boolean
}

/** True for a unit that is still standing (not dead, HP above 0). */
export function isAlive(u: Unit | undefined): boolean {
  return !!u && u.stance !== 'dead' && u.hp > 0
}

/** True for a living squad operative: the only valid order recipient. */
export function isLivingAgent(u: Unit | undefined): boolean {
  return !!u && u.kind === 'agent' && isAlive(u)
}

/** Ids of every living operative, in squad order. */
export function livingAgentIds(w: SelectionWorld): string[] {
  const out: string[] = []
  for (const u of w.units) if (isLivingAgent(u)) out.push(u.id)
  return out
}

/** The selection a just-opened mission starts with: exactly the living set (AC 1a). */
export function openingSelection(w: SelectionWorld): string[] {
  return livingAgentIds(w)
}

/** Select-all (0 / backtick): exactly the living set (AC 1b). */
export function selectAll(w: SelectionWorld): string[] {
  return livingAgentIds(w)
}

/**
 * Slot key 1–4 (AC 1d): a living slot becomes the whole selection; a dead or
 * empty slot leaves `current` untouched (the same array is returned).
 */
export function selectSlot(w: SelectionWorld, slot: number, current: string[]): string[] {
  const id = 'a' + slot
  return isLivingAgent(w.unit(id)) ? [id] : current
}

/**
 * A left click without a drag. An agent replaces the selection (or toggles it
 * when `add`); a hostile is not a target but not bare ground either, so it
 * leaves the selection as it was; bare ground clears unless `add`.
 */
export function clickSelection(current: string[], pick: SelectionPick | null, add: boolean): string[] {
  if (pick) {
    if (!pick.agent) return current
    if (!add) return [pick.id]
    return current.includes(pick.id) ? current.filter((x) => x !== pick.id) : [...current, pick.id]
  }
  return add ? current : []
}
