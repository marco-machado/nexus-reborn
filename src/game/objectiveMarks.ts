// Where an objective sits on the ground, for every reader: the sim's zone
// checks, the minimap pulse and the 3D markers (TM-020). Pure TypeScript.
// Playtests 2-4 hunted 1-2 minutes per objective and never found the Hollow
// Crown server: only the extraction ring was drawn in the scene.
import type { CityData, ObjectiveDef, Unit, Zone } from './types'

/** The zone an objective is worked in: its own, its landmark's, else the checkpoint. */
export function objectiveZone(def: ObjectiveDef, city: CityData): Zone {
  if (def.zone) return def.zone
  if (def.landmark && city.landmarks[def.landmark]) return city.landmarks[def.landmark]
  return city.checkpoint
}

export interface ObjectiveMark {
  x: number
  z: number
  r: number
  optional: boolean
}

/** Smallest ring drawn around a single device. */
export const DEVICE_MARK_R = 1.2

/**
 * One ground mark per place the player must go now: the zone of each active
 * required or optional objective, or, for a destroy, a ring on each of its
 * living devices. Extraction is skipped (its ring is drawn by the city).
 */
export function objectiveMarks(
  defs: readonly ObjectiveDef[],
  rows: ReadonlyArray<{ id: string; active: boolean; done: boolean; failed?: boolean }>,
  units: readonly Unit[],
  city: CityData,
): ObjectiveMark[] {
  const marks: ObjectiveMark[] = []
  for (const row of rows) {
    if (!row.active || row.done || row.failed) continue
    const def = defs.find((d) => d.id === row.id)
    if (!def || def.kind === 'extract') continue
    const optional = def.optional === true
    if (def.kind === 'destroy') {
      for (const u of units) {
        if (u.kind === 'device' && u.tag === def.tag && u.stance !== 'dead') {
          marks.push({ x: u.pos.x, z: u.pos.z, r: DEVICE_MARK_R, optional })
        }
      }
      continue
    }
    const z = objectiveZone(def, city)
    marks.push({ x: z.x, z: z.z, r: z.r, optional })
  }
  return marks
}
