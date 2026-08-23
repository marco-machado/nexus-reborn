// CONTRACT FILE. Deployment-time mission parameters. Pure TypeScript: the
// brief and MissionScreen both compute the same numbers here, so briefing
// counts match the deployed city, and world.ts never reads worldStore.
// Sector values come from a snapshot taken at deployment. Difficulty is a
// player setting applied here (patrol count, civilian density, CorpSec
// sight/accuracy, and optional-objective windows).
import type { DistrictSpec, MissionDef, Weather, WeatherFront } from './types'
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
  // Metres added to CorpSec vision after weather. Stacks; does not replace rain.
  visionAdd: number
  // Scales SIGHT_NEAR_T / SIGHT_FAR_T. >1 lengthens confirm.
  sightConfirmMul: number
  // Scales ENEMY_ACC. >1 is cleaner CorpSec shooting.
  enemyAccMul: number
  // Scales optional-objective failSec. <1 tightens the window.
  optFailMul: number
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

// Player-facing difficulty. STANDARD is the authored baseline; HARDENED
// turns the readable knobs (patrols, civilians, confirm, accuracy, sight
// add-on, optional windows) without hiding minimap information.
export const DIFFICULTIES = ['standard', 'hardened'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export interface DifficultyFx {
  extraPatrol: number
  extraCivilians: number
  sightConfirmMul: number
  enemyAccMul: number
  visionAdd: number
  optFailMul: number
}

export const DIFFICULTY_FX: Record<Difficulty, DifficultyFx> = {
  standard: {
    extraPatrol: 0,
    extraCivilians: 0,
    sightConfirmMul: 1,
    enemyAccMul: 1,
    visionAdd: 0,
    optFailMul: 1,
  },
  hardened: {
    extraPatrol: 2,
    extraCivilians: 6,
    sightConfirmMul: 1.15,
    enemyAccMul: 1.1,
    visionAdd: 1,
    optFailMul: 0.85,
  },
}

export function missionMods(
  m: MissionDef,
  sector: SectorState = NEUTRAL_SECTOR,
  difficulty: Difficulty = 'standard',
): MissionMods {
  let enemyExtra = THREAT_EXTRA[m.threat]
  const enemyHpMul = THREAT_HP_MUL[m.threat]
  let civilianCount = CIVILIANS[defaultDistrict(m).archetype]
  // Restless streets are crowded and reinforced. Garrison condition already
  // covers a well-held district; Control does not add CorpSec hit points.
  if (sector.unrest > 20) {
    civilianCount += 6
    enemyExtra += 1
  }
  const fx = DIFFICULTY_FX[difficulty] ?? DIFFICULTY_FX.standard
  enemyExtra += fx.extraPatrol
  civilianCount += fx.extraCivilians
  const weather = weatherMul(m.weather)
  return {
    enemyExtra,
    enemyHpMul,
    officerCount: THREAT_OFFICERS[m.threat],
    heavyCount: THREAT_HEAVIES[m.threat],
    civilianCount,
    visionMul: weather.visionMul,
    visionAdd: fx.visionAdd,
    sightConfirmMul: fx.sightConfirmMul,
    enemyAccMul: fx.enemyAccMul,
    optFailMul: fx.optFailMul,
    noiseMul: weather.noiseMul,
    rain: m.weather,
  }
}

// Sight and noise for one intensity. Heavy rain is the largest sight cut.
export function weatherMul(weather: Weather): { visionMul: number; noiseMul: number } {
  if (weather === 'heavy') return { visionMul: 0.8, noiseMul: 0.85 }
  if (weather === 'light') return { visionMul: 0.9, noiseMul: 0.95 }
  return { visionMul: 1, noiseMul: 1 }
}

const WEATHER_ORDER: Weather[] = ['none', 'light', 'heavy']

export function adjacentWeather(weather: Weather): Weather[] {
  const i = WEATHER_ORDER.indexOf(weather)
  const out: Weather[] = []
  if (i > 0) out.push(WEATHER_ORDER[i - 1]!)
  if (i < WEATHER_ORDER.length - 1) out.push(WEATHER_ORDER[i + 1]!)
  return out
}

// The clearer night is the worse fight for the squad (guards see farther).
export function clearerWeather(a: Weather, b: Weather): Weather {
  return weatherMul(a).visionMul >= weatherMul(b).visionMul ? a : b
}

export function riskWeather(m: MissionDef): Weather {
  return m.weatherFront ? clearerWeather(m.weather, m.weatherFront.to) : m.weather
}

export function weatherAt(m: MissionDef, tSec: number): Weather {
  if (m.weatherFront && tSec >= m.weatherFront.atSec) return m.weatherFront.to
  return m.weather
}

// Night default and the authored Glass Veil / Hollow Crown stamp.
export const MISSION_CLOCK_BASE = 22 * 3600 + 14 * 60 + 8
// Legal openings: [18:00, 01:00). Dusk is [18:00, 20:00); the rest is night.
export const OPENING_HOUR_START = 18 * 3600
export const OPENING_WINDOW_SEC = 7 * 3600
export const DUSK_END = 20 * 3600
export const RUST_HAVEN_HOUR = 18 * 3600 + 14 * 60 + 8

export type MissionPeriod = 'dusk' | 'night'

export function wrapDaySec(sec: number): number {
  return ((Math.floor(sec) % 86400) + 86400) % 86400
}

export function missionPeriod(openingHour: number): MissionPeriod {
  const t = wrapDaySec(openingHour)
  return t >= OPENING_HOUR_START && t < DUSK_END ? 'dusk' : 'night'
}

export function formatClock(hourSec: number): string {
  const total = wrapDaySec(hourSec)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return pad(h) + ':' + pad(m) + ':' + pad(s)
}

// Front copy uses the mission's Opening hour so a brief time and the HUD
// clock mean the same second.
export function missionClockAt(atSec: number, openingHour = MISSION_CLOCK_BASE): string {
  return formatClock(openingHour + Math.max(0, Math.floor(atSec)))
}

export function rollOpeningHour(rng: () => number): number {
  const minutes = OPENING_WINDOW_SEC / 60
  const minute = Math.floor(rng() * minutes) % minutes
  return wrapDaySec(OPENING_HOUR_START + minute * 60)
}

export const FRONT_CHANCE = 0.4
export const FRONT_MIN_SEC = 90
export const FRONT_MAX_SEC = 240

export function rollWeatherFront(rng: () => number, opening: Weather): WeatherFront | undefined {
  if (rng() >= FRONT_CHANCE) return undefined
  const opts = adjacentWeather(opening)
  const to = opts[Math.floor(rng() * opts.length) % opts.length]!
  const span = FRONT_MAX_SEC - FRONT_MIN_SEC
  return { to, atSec: Math.round(FRONT_MIN_SEC + rng() * span) }
}

// Brief line for the player setting. Empty on STANDARD so the authored notes
// stay the only copy. Voice matches weatherNote: uppercase, corporate.
export function difficultyNote(difficulty: Difficulty): string {
  if (difficulty !== 'hardened') return ''
  return 'HARDENED PROFILE. GUARD SIGHT +1M. ACCURACY UP. CONFIRM SLOW. OPTIONAL WINDOWS TIGHT.'
}

export function clearWeatherNote(openingHour = MISSION_CLOCK_BASE): string {
  const period = missionPeriod(openingHour) === 'dusk' ? 'DUSK' : 'NIGHT'
  return 'CLEAR ' + period + '. GUARDS SEE AND HEAR AT FULL RANGE.'
}

export function weatherNote(
  weather: Weather,
  front?: WeatherFront,
  openingHour = MISSION_CLOCK_BASE,
): string {
  if (!front) {
    if (weather === 'heavy') return 'HEAVY RAIN. VISIBILITY REDUCED.'
    if (weather === 'light') return 'LIGHT RAIN. GUARD SIGHT MILDLY REDUCED.'
    return clearWeatherNote(openingHour)
  }
  const lifts = weatherMul(front.to).visionMul > weatherMul(weather).visionMul
  return (
    WEATHER_LABEL[weather] +
    '. FRONT ' +
    (lifts ? 'CLEARS' : 'ARRIVES') +
    ' ' +
    missionClockAt(front.atSec, openingHour) +
    '.'
  )
}

export function weatherBriefLabel(m: MissionDef): string {
  const hour = m.openingHour ?? MISSION_CLOCK_BASE
  if (!m.weatherFront) {
    if (m.weather === 'none') {
      const period = missionPeriod(hour) === 'dusk' ? 'CLEAR DUSK' : 'CLEAR NIGHT'
      return period + ' // ' + formatClock(hour)
    }
    return WEATHER_LABEL[m.weather] + ' // ' + formatClock(hour)
  }
  return (
    WEATHER_LABEL[m.weather] +
    ' → ' +
    WEATHER_LABEL[m.weatherFront.to] +
    ' ' +
    missionClockAt(m.weatherFront.atSec, hour)
  )
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
  // Hardened reach, accuracy, and tighter optional windows make the fight worse.
  chance -= Math.round(mods.visionAdd * 2)
  chance -= Math.round((mods.enemyAccMul - 1) * 20)
  chance -= Math.round((1 - mods.optFailMul) * 10)
  // Rain shortens guard sight, which favors the squad.
  chance += Math.round((1 - weatherMul(riskWeather(m)).visionMul) * 25)
  chance += researchedCount * 2
  return Math.max(35, Math.min(95, Math.round(chance)))
}

export const WEATHER_LABEL: Record<Weather, string> = {
  heavy: 'HEAVY RAIN',
  light: 'LIGHT RAIN',
  none: 'CLEAR',
}
