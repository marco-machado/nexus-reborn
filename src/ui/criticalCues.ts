// Non-colour cues for the HUD's critical states (IF-002, living §12: critical
// state is never colour alone). Pure helpers: the HUD picks the printed word,
// mark and frame from these, and hue only reinforces them.
import type { ObjectiveUi } from '../state/missionStore'

/** Below this share of max health a living operative's card prints INJURED. */
export const INJURED_HP_FRACTION = 0.3

/** Objective row state; each one draws a distinct mark (box, triangle, check, cross). */
export type ObjectiveCue = 'done' | 'failed' | 'active' | 'pending'

/** Done wins over failed, failed over active; the rest are pending. */
export function objectiveCue(o: Pick<ObjectiveUi, 'done' | 'failed' | 'active'>): ObjectiveCue {
  if (o.done) return 'done'
  if (o.failed) return 'failed'
  if (o.active) return 'active'
  return 'pending'
}

/** Printed token beside the active objective's label (VIP Ice plus this word). */
export const ACTIVE_OBJECTIVE_TOKEN = 'ACTIVE'

/** Squad-card health status: KIA, injured (pips low plus a word) or nominal. */
export type HealthCue = 'kia' | 'injured' | 'ok'

/** KIA when dead; injured under INJURED_HP_FRACTION of max (a unit with no
 *  max HP reads ok, not injured); ok otherwise. */
export function healthCue(hp: number, maxHp: number, dead: boolean): HealthCue {
  if (dead) return 'kia'
  if (maxHp > 0 && hp / maxHp < INJURED_HP_FRACTION) return 'injured'
  return 'ok'
}
