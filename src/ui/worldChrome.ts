// Chance vs Risk chrome and World Network owner readouts (Interface AC7,
// AC27). Pure presentation: every value here arrives from its owner
// (missionChance, missionRisk, worldStore.influenceRefusal, taxEligible);
// this module only decides which one a surface prints and in what words. It
// recomputes no board rule.
import type { RiskBand } from '../game/forecast'
import type { EventTone, InfluenceRefusal } from '../state/worldStore'
import type { SectorId } from '../game/types'
import { INFLUENCE_ACTION_ORDER } from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import { CITIES_BY_SECTOR, CORPS, HOLDERS, sectorCorp, sectorDef } from '../game/atlas'
import type { CorpId } from '../game/atlas'

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
  tone: 'teal' | 'dim'
}

// The printed Tax yield is a figure; whether it pays is the owner's
// eligibility (Nexus-held). The line names the cause in words, so the two are
// never told apart by colour alone. Not paying is not a price and not an
// alarm (art bible §4.3), so it prints dim, not Ledger Amber.
export function taxEligibilityLine(eligible: boolean): TaxEligibilityReadout {
  return eligible
    ? { text: 'YES // NEXUS-HELD', tone: 'teal' }
    : { text: 'NO // NOT NEXUS-HELD', tone: 'dim' }
}

// The class a feed line and its timeline tick print in. The saved event tone
// 'amber' (raids, priority contracts, Influence spends) is neither price nor
// alarm, so it prints as a Print White notice: Ledger Amber is price only
// (living §12). The line's own words carry what happened.
export function eventToneClass(tone: EventTone): string {
  return tone === 'amber' ? 'notice' : tone
}

// Unrest ink by state (owner 2026-10-23, World Network UX spec Open Question
// 2): Ink when calm, the Print White notice tone past the pressure line, Red
// Hot in crisis; crisis wins. Red is danger, so calm Unrest is never red. The
// bar takes the same tone, with no tone (the default bar) when calm.
export interface UnrestTone {
  ink: 'ink' | 'notice' | 'red'
  bar: 'notice' | 'red' | undefined
}

export function unrestTone(inCrisis: boolean, pressure: boolean): UnrestTone {
  if (inCrisis) return { ink: 'red', bar: 'red' }
  if (pressure) return { ink: 'notice', bar: 'notice' }
  return { ink: 'ink', bar: undefined }
}

export function intelGate(level: number): string {
  return 'REQUIRES INTEL LVL ' + level
}

// Why a contract cannot be opened, in words (P-03: the actual cause). A
// failed campaign locks every contract, whatever its intel gate.
export function lockReason(campaignFailed: boolean, intelReq: number): string {
  return campaignFailed ? 'CAMPAIGN LOST' : intelGate(intelReq)
}

export interface HolderReadout {
  text: string
  tone: 'teal' | 'dim'
}

// Who holds the sector and why, in words (WN-022): ownership is the majority
// holder of the sector's cities, not Control, and playtests 3 and 4 could not
// tell the two apart ("86% control but not Nexus-held"). The rule is the
// owner's (atlas.sectorCorp); this only counts what it counts.
export function holderLine(sector: SectorId, owner: Record<string, CorpId>): HolderReadout {
  const cities = CITIES_BY_SECTOR[sector] ?? []
  const holder = sectorCorp(sector, owner)
  if (holder === 'unknown') return { text: 'UNKNOWN', tone: 'dim' }
  const total = cities.length
  if (holder === 'contested') {
    const split = HOLDERS.map((corp) => cities.filter((c) => (owner[c.id] ?? c.corp) === corp).length)
      .filter((n) => n > 0)
      .join('-')
    return { text: 'CONTESTED // CITIES SPLIT ' + split, tone: 'dim' }
  }
  const held = cities.filter((c) => (owner[c.id] ?? c.corp) === holder).length
  return {
    text: CORPS[holder].name + ' // ' + held + ' OF ' + total + ' CITIES',
    tone: holder === 'nexus' ? 'teal' : 'dim',
  }
}
