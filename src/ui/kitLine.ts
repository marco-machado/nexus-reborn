// IF-015: the Brief KIT line from objective kinds (Interface AC31; Screens
// table, Brief; design/difficulty-curve.md, copy confirmed 2026-10-22).
// Pure: a KIT line is a function of `kind` and, for interact and defend, of
// `durationSec` exactly as the sim consumes it (world.ts reads durationSec
// unmodified for both; optFailMul applies only to an optional failSec). It is
// never keyed on mission id, contract type, codename or `notes`, so an
// authored and a generated objective of the same kind print the same line
// and the Brief agrees with the deployed mission by construction.
import type { ObjectiveDef } from '../game/types'

/** The destroy copy: devices die through the ordinary damage path, so cells are the fast tool, not a requirement. */
export const KIT_DESTROY = 'power cells arm grenades, the fast tool; gunfire works, slowly'
/** The escort copy: the objective completes when the asset is alive in the pad zone. */
export const KIT_ESCORT = 'the asset must reach the pad alive'

/** The interact copy for a hold of `sec` seconds; the console is the interact objective, not the escort. */
export function kitInteract(sec: number): string {
  return 'an operative holds the console for ' + sec + ' s'
}

/** The defend copy for a hold of `sec` seconds. */
export function kitDefend(sec: number): string {
  return 'hold the zone for ' + sec + ' s'
}

/**
 * The KIT line for one objective, or null when its kind carries none
 * (reach-zone, eliminate-tag, extract). A missing `durationSec` reads as 0,
 * which is what the sim holds for (world.ts `durationSec ?? 0`).
 */
export function kitLine(def: ObjectiveDef): string | null {
  switch (def.kind) {
    case 'destroy':
      return KIT_DESTROY
    case 'interact':
      return kitInteract(def.durationSec ?? 0)
    case 'escort':
      return KIT_ESCORT
    case 'defend':
      return kitDefend(def.durationSec ?? 0)
    default:
      return null
  }
}

/** The KIT lines of a whole objective list, in order, nulls dropped; empty when no objective carries one. */
export function kitLines(objectives: readonly ObjectiveDef[]): string[] {
  const out: string[] = []
  for (const def of objectives) {
    const line = kitLine(def)
    if (line !== null) out.push(line)
  }
  return out
}
