// City-ownership outcomes. A completed mission flips the district's holder
// through this table: a win hands the city to Nexus; a loss of a Nexus-held
// city returns it to the atlas default (or the first rival holder). The new
// holder is always one of HOLDERS so the owner-map invariant stays intact —
// Glass Veil's client, Sable, is not a city holder.
import { CITIES, HOLDERS, cityById } from './atlas'
import type { CorpId } from './atlas'

export function cityIdByName(name: string): string | null {
  return CITIES.find((c) => c.name === name)?.id ?? null
}

export function nextCityHolder(cityId: string, current: CorpId, won: boolean): CorpId {
  if (won) return 'nexus'
  if (current !== 'nexus') return current
  const authored = cityById(cityId).corp
  if (authored !== 'nexus' && (HOLDERS as readonly string[]).includes(authored)) {
    return authored
  }
  return HOLDERS.find((c) => c !== 'nexus') ?? 'stratos'
}
