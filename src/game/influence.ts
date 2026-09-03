// Influence economy and unrest pressure balance data. Pure data and small
// helpers: worldStore runs the timed flows, the world map renders the actions,
// and every number a designer would tune lives here.
import type { SectorId } from './types'

/* --------------------------------- earning -------------------------------- */

// A fulfilled contract pays influence points beside its fee; a clean win
// (zero civilians hit by the squad) pays a premium. Nothing else: there is
// no Control trickle and no influence index.
export const INFLUENCE_WIN_PTS = 6
export const INFLUENCE_CLEAN_PTS = 2
// Nexus-held sectors pay Tax yield on this clock. Missed ticks catch up with
// World Events, so a contract ETA jump collects them.
export const TAX_INTERVAL_SEC = 24 * 3600

/* -------------------------------- spending -------------------------------- */

export type InfluenceActionId = 'stabilize' | 'lobby' | 'expedite'

export interface InfluenceActionDef {
  id: InfluenceActionId
  // Position in the numbered action list on the sector panel.
  num: number
  name: string
  cost: number
  cooldownSec: number
  // Staged application: `steps` applications of the per-step deltas, one
  // every `stepSec`, starting one step after the spend. Zero steps means the
  // action applies instantly (expedite).
  steps: number
  stepSec: number
  unrestDelta: number
  controlDelta: number
}

// STABILIZE: -12 unrest over 6 world hours. LOBBY: +8 control over 12 world
// hours. EXPEDITE: the sector's lowest-intel-gate open generated contract
// loses its intel requirement and gains 24 world hours of expiry.
export const INFLUENCE_ACTIONS: Record<InfluenceActionId, InfluenceActionDef> = {
  stabilize: {
    id: 'stabilize', num: 1, name: 'STABILIZE',
    cost: 8, cooldownSec: 24 * 3600,
    steps: 6, stepSec: 3600, unrestDelta: -2, controlDelta: 0,
  },
  lobby: {
    id: 'lobby', num: 2, name: 'LOBBY',
    cost: 10, cooldownSec: 36 * 3600,
    steps: 8, stepSec: 5400, unrestDelta: 0, controlDelta: 1,
  },
  expedite: {
    id: 'expedite', num: 3, name: 'EXPEDITE',
    cost: 12, cooldownSec: 24 * 3600,
    steps: 0, stepSec: 0, unrestDelta: 0, controlDelta: 0,
  },
}

export const INFLUENCE_ACTION_ORDER: InfluenceActionId[] = ['stabilize', 'lobby', 'expedite']

export const EXPEDITE_EXTENSION_SEC = 24 * 3600

// A staged spend still applying: `remaining` steps left, the next one at
// `nextT` on the strategic clock. Serialized as-is by the versioned save.
export interface PendingSpend {
  action: 'stabilize' | 'lobby'
  sector: SectorId
  nextT: number
  remaining: number
}

// Cooldown record key: cooldowns are per sector, per action.
export function cooldownKey(sector: SectorId, action: InfluenceActionId): string {
  return sector + ':' + action
}

/* ---------------------------- unrest pressure ------------------------------ */

// A sector holding above the threshold decays: every interval it loses 1-2
// control, and its tax yield readout falls with the strain.
export const PRESSURE_UNREST_MIN = 60
export const PRESSURE_INTERVAL_SEC = 6 * 3600
export const PRESSURE_CONTROL_DROP_MIN = 1
export const PRESSURE_CONTROL_DROP_MAX = 2
// Tax yield loses this fraction per unrest point above the threshold, floored.
export const PRESSURE_TAX_PENALTY = 0.02
export const PRESSURE_TAX_FLOOR = 0.25

// The strain factor unrest pressure puts on a sector's tax yield readout.
export function taxStrain(unrest: number): number {
  if (unrest <= PRESSURE_UNREST_MIN) return 1
  return Math.max(PRESSURE_TAX_FLOOR, 1 - (unrest - PRESSURE_UNREST_MIN) * PRESSURE_TAX_PENALTY)
}

// Credits one 24-hour tick would pay from this sector's Control and Unrest.
// The Scan prints this figure for every open sector; only a Nexus-held
// sector actually deposits it.
export function taxYieldCredits(base: number, control: number, unrest: number): number {
  return Math.round(base * (control / 100) * taxStrain(unrest))
}

// Crisis: entered at the high mark, cleared under the low mark. In crisis the
// sector draws events at double weight and its open generated contracts carry
// the priority tag.
export const CRISIS_UNREST_ENTER = 85
export const CRISIS_UNREST_EXIT = 70
export const CRISIS_EVENT_WEIGHT_MUL = 2

/* --------------------------------- bounds --------------------------------- */

// Sector state clamps, shared by the event flow, mission results and the save
// validator. Unrest must be able to cross the crisis mark.
export const CONTROL_MIN = 4
export const CONTROL_MAX = 96
export const UNREST_MIN = 2
export const UNREST_MAX = 96
