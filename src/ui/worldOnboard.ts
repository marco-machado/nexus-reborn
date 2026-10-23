// World Network first-visit orientation card and the sector-panel Influence
// moment (World Network Core Rule 13, Interface AC27). Pure presentation:
// the card rows are a fixed model, START HERE is chosen from Chance values
// the owner computed (missionChance, through the same list the Scan prints),
// and the Influence moment fires on the owner's refusal (worldStore
// .influenceRefusal). Nothing here recomputes a board rule.
import { INFLUENCE_ACTIONS, INFLUENCE_ACTION_ORDER } from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import type { SectorId } from '../game/types'
import { WORLD_ONBOARD_ID } from '../game/tutorial'

// One open contract as the Scan lists it: the owner's Chance, already
// derived, and whether the director can open it.
export interface StartHereCandidate {
  codename: string
  city: string
  chance: number
  locked: boolean
}

// The contract START HERE names: the highest-Chance open, unlocked offer.
// Ties keep list order (the authored spine lists before generated offers).
// Null when nothing is open.
export function startHere<T extends StartHereCandidate>(ops: readonly T[]): T | null {
  let best: T | null = null
  for (const op of ops) {
    if (op.locked) continue
    if (best === null || op.chance > best.chance) best = op
  }
  return best
}

export type OrientationRowId = 'job' | 'start' | 'time' | 'numbers'

export interface OrientationRow {
  id: OrientationRowId
  title: string
  // One paragraph; the four-numbers row carries one line per number.
  lines: string[]
}

export const ORIENTATION_ROW_TITLES: Record<OrientationRowId, string> = {
  job: 'THE JOB',
  start: 'START HERE',
  time: 'STRATEGIC TIME',
  numbers: 'THE FOUR NUMBERS',
}

// The START HERE sentence that names the contract. Null target prints the
// wait for the market instead; never "click the marker".
export function startHereLine(target: StartHereCandidate | null): string {
  if (target === null) {
    return 'No contract is open yet: keep the clock running and watch OPEN CONTRACTS for the next posting.'
  }
  return (
    'Start with ' +
    target.codename +
    ' in ' +
    target.city +
    ', the open contract with the highest Chance (' +
    target.chance +
    '%).'
  )
}

// The card, as four rows and nothing else (difficulty curve 2026-10-21: the
// nine-row card read as "too dense"). Influence is taught on the sector panel
// and Research on the first Debrief, so neither has a row here.
export function orientationRows(target: StartHereCandidate | null): OrientationRow[] {
  return [
    {
      id: 'job',
      title: ORIENTATION_ROW_TITLES.job,
      lines: [
        'You run the network from this desk. Every sector prints a Tax yield, but only a ' +
          'Nexus-held sector pays it: one where Nexus holds most of its cities. North America ' +
          'pays from the start, Europe does not. A win hands the mission city to Nexus.',
      ],
    },
    {
      id: 'start',
      title: ORIENTATION_ROW_TITLES.start,
      lines: [
        'Focus a sector and read its four numbers; Pause while you read. ' + startHereLine(target),
      ],
    },
    {
      id: 'time',
      title: ORIENTATION_ROW_TITLES.time,
      lines: [
        'Pause and Clock speed control strategic time: Pause stops it while you read, 1x to 8x ' +
          'runs it faster. The clock is a resource: labs, healing, Tax and contract expiry all ' +
          'run on it.',
      ],
    },
    {
      id: 'numbers',
      title: ORIENTATION_ROW_TITLES.numbers,
      lines: [
        'CONTROL: the order kept in the sector; a win raises it. It sets Tax yield and ' +
          'Garrison, not who holds the sector (HELD BY on the sector panel).',
        'UNREST: pressure against that hold; past the pressure line a crisis can break out.',
        'TAX YIELD: Credits per 24 strategic hours, paid only while Nexus-held.',
        'GARRISON CONDITION: SECURE, STRAINED or CRITICAL, read from Control.',
      ],
    },
  ]
}

// The Influence moment trigger: the first numbered action the owner refuses
// nothing on. `refusal` is worldStore.influenceRefusal bound to the focused
// sector, so Antarctica (locked-sector), cooldowns, Expedite with no target
// and the opening 0 points all stay silent. Never an `influence >= cost`
// compare.
export function influenceMoment(
  refusal: (action: InfluenceActionId) => string | null,
): InfluenceActionId | null {
  for (const action of INFLUENCE_ACTION_ORDER) {
    if (refusal(action) === null) return action
  }
  return null
}

// The note shows only on the sector it fired on. Its copy says "the focused
// sector", so a refocus hides it for good (owner ruling 2026-10-22, IF013-18);
// the id is already seen, so it never refires.
export function influenceMomentShown(
  fired: { action: InfluenceActionId; sector: SectorId } | null,
  sector: SectorId,
): InfluenceActionId | null {
  return fired !== null && fired.sector === sector ? fired.action : null
}

// The teaching panel's words for the affordable action: number, name, cost
// and the effect line the action button already prints.
export function influenceMomentCopy(
  action: InfluenceActionId,
  effect: string,
): { title: string; body: string } {
  const def = INFLUENCE_ACTIONS[action]
  return {
    title: 'INFLUENCE // ' + def.num + ' ' + def.name,
    body:
      'Affordable now: ' +
      def.cost +
      ' PTS for ' +
      effect +
      ' on the focused sector. Field wins earn the points to spend.',
  }
}

// Using the clock is the lesson the card teaches (P-23): Pause or any speed
// applies, then marks the card seen for the campaign, as UNDERSTOOD does.
// markSeen is the tutorial store's own guard, so repeats never duplicate.
export function clockUse(apply: () => void, markSeen: (id: string) => void): void {
  apply()
  markSeen(WORLD_ONBOARD_ID)
}
