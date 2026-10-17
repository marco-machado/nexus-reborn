// Chance vs Risk chrome and World Network owner readouts (Interface AC7,
// AC27). Pure presentation: every value here arrives from its owner
// (missionChance, missionRisk, worldStore.influenceRefusal, taxEligible);
// this module only decides which one a surface prints and in what words. It
// recomputes no board rule.
import type { RiskBand } from '../game/forecast'
import type { InfluenceRefusal } from '../state/worldStore'
import type { SectorId } from '../game/types'
import { INFLUENCE_ACTION_ORDER } from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import { sectorDef } from '../game/atlas'

export interface OddsReadout {
  label: string
  value: string
  tone: 'teal' | 'red'
}

// Brief odds line. Intel < 2 prints the Chance percentage; intel 2+ replaces
// it with the Risk index and its band, never a percentage and never a cap.
export function briefOdds(
  intelLevel: number,
  chance: number,
  risk: { index: number; band: RiskBand },
): OddsReadout {
  if (intelLevel < 2) return { label: 'PROJECTED SUCCESS', value: chance + '%', tone: 'teal' }
  return {
    label: 'RISK INDEX',
    value: risk.index + ' // ' + risk.band,
    tone: risk.band === 'HIGH' || risk.band === 'SEVERE' ? 'red' : 'teal',
  }
}

// World Network contract chrome prints Chance at every intel level; the
// Risk index is a Brief surface only.
export function worldChance(chance: number): string {
  return 'CHANCE ' + chance + '%'
}

// The words an Influence action prints for the owner's refusal. Cooldown
// carries the hours left; the rest name the cause, so a disabled action at
// the opening 0 points reads as unaffordable, not broken.
export function influenceStatus(
  refusal: InfluenceRefusal | null,
  active: boolean,
  coolHours: number,
): string {
  if (active) return 'ACTIVE'
  switch (refusal) {
    case 'locked-sector':
      return 'SECTOR LOCKED'
    case 'cooldown':
      return 'COOLDOWN ' + coolHours + 'H'
    case 'no-target':
      return 'NO TARGET'
    case 'unaffordable':
      return 'UNAFFORDABLE'
    case null:
      return 'CLEAR'
  }
}

// The Influence actions a sector offers: none for a locked sector
// (Antarctica), the full numbered set otherwise.
export function influenceActionsFor(sector: SectorId): readonly InfluenceActionId[] {
  return sectorDef(sector).locked ? [] : INFLUENCE_ACTION_ORDER
}

export interface TaxEligibilityReadout {
  text: string
  tone: 'teal' | 'amber'
}

// The printed Tax yield is a figure; whether it pays is the owner's
// eligibility (Nexus-held). The line names the cause in words, so the two are
// never told apart by colour alone.
export function taxEligibilityLine(eligible: boolean): TaxEligibilityReadout {
  return eligible
    ? { text: 'YES // NEXUS-HELD', tone: 'teal' }
    : { text: 'NO // NOT NEXUS-HELD', tone: 'amber' }
}
