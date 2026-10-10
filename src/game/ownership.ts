// City-ownership outcomes. A completed mission flips the district's holder
// through this table: a win hands the city to Nexus; a loss of a Nexus-held
// city returns it to the atlas default (GDD World Network Core Rule 9), so a
// Nexus-default city stays Nexus — a no-op. The atlas test pins every
// default to one of HOLDERS, so the owner-map invariant stays intact — Glass
// Veil's client, Sable, is not a city holder.
import { CITIES, cityById } from './atlas'
import type { CorpId } from './atlas'

/** Atlas city id for a mission's city name, or null when no city matches. */
export function cityIdByName(name: string): string | null {
  return CITIES.find((c) => c.name === name)?.id ?? null
}

/**
 * Holder of `cityId` after a non-quiet debrief. `current` is the city's entry
 * in the owner map. A result equal to `current` means no flip. The
 * quiet-replay gate lives in the caller.
 */
export function nextCityHolder(cityId: string, current: CorpId, won: boolean): CorpId {
  if (won) return 'nexus'
  if (current !== 'nexus') return current
  return cityById(cityId).corp
}
