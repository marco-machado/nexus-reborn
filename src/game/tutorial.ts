// Tutorial and contextual hint copy, as data. The mission toast layer and the
// world-map onboarding overlay render from these tables; the sim and the input
// layer report player actions as TutorialEvents. Every printed key comes from
// the live binding table through the KeyLookup, never from a literal, so a
// remapped control renames itself in every prompt.
import { BINDINGS } from './bindings'
import type { BindingId } from './bindings'

export type TutorialEvent =
  | 'select'
  | 'move'
  | 'attack'
  | 'hold'
  | 'ability'
  | 'item'
  | 'swap'
  | 'objective'
  | 'extract'

export type KeyLookup = (id: BindingId) => string

// The live keys for an action, as the menus print them. Reads the mutable
// table, so overrides show through.
export function bindingKeys(id: BindingId): string {
  const b = BINDINGS.find((x) => x.id === id)
  return b ? b.keys.join(' / ') : '?'
}

export interface TutorialStep {
  id: string
  event: TutorialEvent
  title: string
  body: (key: KeyLookup) => string
}

// First-mission prompt sequence. Steps advance in order: the first id not yet
// seen is the live step, and only its event moves the pointer.
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'tut-select',
    event: 'select',
    title: 'SELECTION',
    body: (k) =>
      'Click an operative or drag a box to select. ' +
      k('selectSlot') +
      ' picks a slot; ' +
      k('selectAll') +
      ' takes the living squad.',
  },
  {
    id: 'tut-move',
    event: 'move',
    title: 'MOVEMENT',
    body: (k) => k('moveOrder') + ' on open ground moves the selection there.',
  },
  {
    id: 'tut-attack',
    event: 'attack',
    title: 'ENGAGEMENT',
    body: (k) => k('attackOrder') + ' on a hostile orders the selection to engage it.',
  },
  {
    id: 'tut-hold',
    event: 'hold',
    title: 'STANCES',
    body: (k) =>
      k('holdGround') + ' holds position. ' + k('holdFire') + ' holds fire until ordered.',
  },
  {
    id: 'tut-ability',
    event: 'ability',
    title: 'ROLE ABILITY',
    body: (k) => k('useAbility') + " triggers the selected operatives' role abilities.",
  },
  {
    id: 'tut-item',
    event: 'item',
    title: 'ITEMS',
    body: (k) =>
      k('useMed') + ' spends a med kit; ' + k('useCell') + ' spends a power cell.',
  },
  {
    id: 'tut-swap',
    event: 'swap',
    title: 'WEAPON SWAP',
    body: (k) => k('swapWeapon') + ' swaps between primary and sidearm.',
  },
  {
    id: 'tut-objective',
    event: 'objective',
    title: 'DIRECTIVES',
    body: () =>
      'Work the active directive from the MISSION DIRECTIVES panel; the minimap marks its zone.',
  },
  {
    id: 'tut-extract',
    event: 'extract',
    title: 'EXTRACTION',
    body: () => 'After the final directive, return to the insertion zone to extract.',
  },
]

export const TUTORIAL_IDS: readonly string[] = TUTORIAL_STEPS.map((s) => s.id)

// The first step the player has not seen; null once the sequence is done.
export function currentStep(seen: readonly string[]): TutorialStep | null {
  return TUTORIAL_STEPS.find((s) => !seen.includes(s.id)) ?? null
}

// One-shot contextual hints. Each fires at most once per campaign: firing
// marks it seen, and seen ids persist with the save.
export type HintId = 'hint-lowhp' | 'hint-alert' | 'hint-ability-idle' | 'hint-overweight'

export const HINTS: Record<HintId, { title: string; body: (key: KeyLookup) => string }> = {
  'hint-lowhp': {
    title: 'CASUALTY RISK',
    body: (k) =>
      'An operative is below 35% health. ' +
      k('useMed') +
      ' spends a med kit on the most wounded selected operative.',
  },
  'hint-alert': {
    title: 'COMBAT ALERT',
    body: (k) =>
      'CorpSec is alerted. ' +
      k('holdGround') +
      ' holds position; ' +
      k('holdFire') +
      ' keeps weapons tight.',
  },
  'hint-ability-idle': {
    title: 'ABILITY READY',
    body: (k) =>
      'A role ability has sat ready for a minute. ' +
      k('useAbility') +
      ' fires it for the selection.',
  },
  'hint-overweight': {
    title: 'HEAVY LOADOUT',
    body: () =>
      'The squad deployed over the heavy mass line: every operative moves slower this mission.',
  },
}

export const HINT_IDS = Object.keys(HINTS) as HintId[]

// The world-map onboarding overlay shares the seen set but draws its own
// panel, so it carries an id here and no toast copy.
export const WORLD_ONBOARD_ID = 'hint-worldmap'

// Every id the seen set may hold; the save validator checks against this.
export const SEEN_IDS: readonly string[] = [...TUTORIAL_IDS, ...HINT_IDS, WORLD_ONBOARD_ID]
