// CONTRACT FILE. Deployment-time mission parameters. Pure TypeScript: the
// brief and MissionScreen both compute the same numbers here, so briefing
// counts match the deployed city, and world.ts never reads worldStore.
// Sector values come from a snapshot taken at deployment.
import type { DistrictSpec, MissionDef, Weather } from './types'
import type { SectorState } from '../state/worldStore'

export interface MissionMods {
  // Added street patrols beyond the archetype's base set.
  enemyExtra: number
  enemyHpMul: number
  // Garrison members upgraded to elite archetypes (game/data.ts): officers
  // radio the garrison in, heavies soak damage. Threat sets both.
  officerCount: number
  heavyCount: number
  civilianCount: number
  // Scales ENEMY_VISION for this mission.
  visionMul: number
  // Scales weaponNoise radii.
  noiseMul: number
  rain: Weather
}

// Used when no sector snapshot exists (tests, headless world construction).
export const NEUTRAL_SECTOR: SectorState = { control: 50, unrest: 10 }

const THREAT_EXTRA: Record<MissionDef['threat'], number> = {
  MODERATE: 0,
  HIGH: 2,
  SEVERE: 3,
}

const THREAT_HP_MUL: Record<MissionDef['threat'], number> = {
  MODERATE: 1.0,
  HIGH: 1.1,
  SEVERE: 1.2,
}

const THREAT_OFFICERS: Record<MissionDef['threat'], number> = {
  MODERATE: 0,
  HIGH: 0,
  SEVERE: 1,
}

const THREAT_HEAVIES: Record<MissionDef['threat'], number> = {
  MODERATE: 0,
  HIGH: 1,
  SEVERE: 1,
}

// Base bystander density per layout family; sector unrest adds to it.
const CIVILIANS: Record<DistrictSpec['archetype'], number> = {
  checkpoint: 22,
  compound: 14,
  industrial: 8,
}

export function defaultDistrict(m: MissionDef): DistrictSpec {
  return m.variants[0] ?? { archetype: 'checkpoint', seed: m.seed }
}

// Layout for this deployment: the first variant, or the next one once the
// contract has been won so a replay shows the other authored layout.
export function missionVariant(m: MissionDef, replay: boolean): DistrictSpec {
  const variants = m.variants.length > 0 ? m.variants : [defaultDistrict(m)]
  return variants[replay ? 1 % variants.length : 0]
}

export function missionMods(m: MissionDef, sector: SectorState = NEUTRAL_SECTOR): MissionMods {
  let enemyExtra = THREAT_EXTRA[m.threat]
  let enemyHpMul = THREAT_HP_MUL[m.threat]
  let civilianCount = CIVILIANS[defaultDistrict(m).archetype]
  // Restless streets are crowded and reinforced; a well-held district is
  // well-garrisoned.
  if (sector.unrest > 20) {
    civilianCount += 6
    enemyExtra += 1
  }
  if (sector.control > 60) enemyHpMul += 0.05
  let visionMul = 1
  let noiseMul = 1
  if (m.weather === 'heavy') {
    visionMul = 0.8
    noiseMul = 0.85
  } else if (m.weather === 'light') {
    visionMul = 0.9
    noiseMul = 0.95
  }
  return {
    enemyExtra,
    enemyHpMul,
    officerCount: THREAT_OFFICERS[m.threat],
    heavyCount: THREAT_HEAVIES[m.threat],
    civilianCount,
    visionMul,
    noiseMul,
    rain: m.weather,
  }
}

// Projected success chance in percent, derived so it moves with research and
// with the same modifiers the deployed city gets. Clamped to 35..95.
export function missionChance(
  m: MissionDef,
  mods: MissionMods,
  researchedCount: number,
): number {
  const base = m.threat === 'MODERATE' ? 82 : m.threat === 'HIGH' ? 68 : 58
  let chance = base
  chance -= mods.enemyExtra * 3
  chance -= Math.round((mods.enemyHpMul - 1) * 50)
  chance -= mods.heavyCount * 2 + mods.officerCount * 3
  // Rain shortens guard sight, which favors the squad.
  chance += Math.round((1 - mods.visionMul) * 25)
  chance += researchedCount * 2
  return Math.max(35, Math.min(95, Math.round(chance)))
}

export const WEATHER_LABEL: Record<Weather, string> = {
  heavy: 'HEAVY RAIN',
  light: 'LIGHT RAIN',
  none: 'CLEAR',
}
