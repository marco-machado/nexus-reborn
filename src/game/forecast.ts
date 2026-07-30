// Forecasting: the event weights the strategic generator rolls from, exposed
// as data so the intel forecast and the generator cannot drift, plus the
// mission risk readout the brief derives from the actual deployment build.
// Pure TypeScript; worldStore imports the weights, the screens the forecasts.
import { CRISIS_EVENT_WEIGHT_MUL } from './influence'
import type { SectorId } from './types'

/* ---------------------------- generator weights ---------------------------- */

// Event pacing: the next world event lands EVENT_MIN_SEC to
// EVENT_MIN_SEC + EVENT_SPAN_SEC world seconds after the last.
export const EVENT_MIN_SEC = 900
export const EVENT_SPAN_SEC = 1800

// The rollable event categories, in generator table order. KIA and contract
// lines are posted by their own flows and never rolled.
export const FORECAST_KINDS = ['riot', 'blackout', 'raid', 'trade', 'seizure'] as const
export type ForecastKind = (typeof FORECAST_KINDS)[number]

const KIND_WEIGHT_FLOOR = 0.02

// Unrest pulls the table toward the violent kinds. This is the table the
// generator draws from; the forecast reads the same rows.
export function kindWeights(unrest: number): Array<[ForecastKind, number]> {
  const heat = unrest / 40
  const table: Array<[ForecastKind, number]> = [
    ['riot', 0.1 + heat],
    ['blackout', 0.12 + heat * 0.4],
    ['raid', 0.18 + heat * 0.5],
    ['trade', 0.3 - heat * 0.3],
    ['seizure', 0.22 - heat * 0.1],
  ]
  return table.map(([kind, w]) => [kind, Math.max(KIND_WEIGHT_FLOOR, w)])
}

// Unrest pulls events toward a sector; a sector in crisis draws at double
// weight, which is what doubles its event frequency.
export function sectorEventWeight(unrest: number, crisis: boolean): number {
  const w = 1 + unrest / 8
  return crisis ? w * CRISIS_EVENT_WEIGHT_MUL : w
}

/* ------------------------------ event forecast ----------------------------- */

export const FORECAST_WINDOW_SEC = 6 * 3600

export interface SectorForecastInput {
  sector: SectorId
  unrest: number
  crisis: boolean
}

export interface EventRisk {
  kind: ForecastKind
  // Chance in percent that at least one event of this kind lands in the
  // sector inside the forecast window.
  chance: number
}

// Derived from the same weights the generator rolls: the expected event count
// over the window at the mean interval, the sector's share of the selection
// weight, and the kind's share of the sector table.
export function eventForecast(
  inputs: SectorForecastInput[],
  target: SectorId,
): EventRisk[] {
  const focus = inputs.find((i) => i.sector === target)
  if (!focus) return []
  let total = 0
  for (const i of inputs) total += sectorEventWeight(i.unrest, i.crisis)
  const pSector = total > 0 ? sectorEventWeight(focus.unrest, focus.crisis) / total : 0
  const events = FORECAST_WINDOW_SEC / (EVENT_MIN_SEC + EVENT_SPAN_SEC / 2)
  const table = kindWeights(focus.unrest)
  let kindTotal = 0
  for (const [, w] of table) kindTotal += w
  return table.map(([kind, w]) => {
    const p = pSector * (w / kindTotal)
    return { kind, chance: Math.round((1 - Math.pow(1 - p, events)) * 100) }
  })
}

/* ------------------------------- mission risk ------------------------------ */

export type RiskBand = 'LOW' | 'GUARDED' | 'HIGH' | 'SEVERE'

export interface MissionRiskInput {
  // Counts from the actual deployment build (ui/briefMap builds them from the
  // same city the squad will walk), never from authored estimates.
  patrols: number
  garrison: number
  civilians: number
}

export interface MissionRisk {
  index: number
  band: RiskBand
}

const RISK_GUARDED = 30
const RISK_HIGH = 50
const RISK_SEVERE = 75

// Armed contacts dominate, weighted by the deployment's enemy toughness;
// civilian exposure adds collateral risk; rain shortens guard sight and
// favors the squad.
export function missionRisk(
  counts: MissionRiskInput,
  mods: { enemyHpMul: number; visionMul: number },
): MissionRisk {
  const contacts = (counts.patrols * 4 + counts.garrison * 5) * mods.enemyHpMul
  const index = Math.round((contacts + counts.civilians * 0.5) * (0.7 + 0.3 * mods.visionMul))
  const band: RiskBand =
    index < RISK_GUARDED ? 'LOW'
    : index < RISK_HIGH ? 'GUARDED'
    : index < RISK_SEVERE ? 'HIGH'
    : 'SEVERE'
  return { index, band }
}
