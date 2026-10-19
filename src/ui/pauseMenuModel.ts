// Pure decisions behind the mission pause modal (IF-008, TR-interface-006,
// ADR-0017). The Hud, scene/Input.tsx and PauseMenu call these, and the tests
// call the same functions, so the gates under test are the gates that run.
import { BINDINGS, BINDING_GROUPS } from '../game/bindings'
import type { Binding, BindingId } from '../game/bindings'

/** The slice of missionStore the pause gates read. */
export interface PauseGateState {
  paused: boolean
  result: 'none' | 'won' | 'lost'
}

/**
 * The pause modal shows only on a paused mission with no result yet: once the
 * mission is won or lost the result banner owns the centre and no Abort is
 * offered.
 */
export function pauseMenuShown(ms: PauseGateState): boolean {
  return ms.paused && ms.result === 'none'
}

/**
 * Whether a squad/ability key answers in the current state. While paused, or
 * once a result is in, only the pause key (Space / Esc) answers; every other
 * action would land on a squad the player cannot see behind the panel.
 */
export function missionKeyAnswers(id: BindingId, ms: PauseGateState): boolean {
  if (id === 'pause') return true
  return !ms.paused && ms.result === 'none'
}

/** What scene/Input.tsx reads off `document.activeElement` for the Space gate. */
export interface FocusedControl {
  /** Upper-case tag name, as `Element.tagName` reports it. */
  tag: string
  /** Inside a `[role="dialog"]`. */
  inDialog: boolean
}

const SPACE_OWNING_TAGS: ReadonlySet<string> = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])

/**
 * A focused form control inside a dialog owns Space: a button fires, a slider
 * or checkbox keeps it, and the pause toggle stays out of it. Toggling pause
 * there would unpause the mission behind Settings and unmount it (BUG-0001).
 * Escape is never owned, so it still closes the menu from anywhere.
 */
export function dialogControlOwnsKey(code: string, focus: FocusedControl | null): boolean {
  return code === 'Space' && focus !== null && focus.inDialog && SPACE_OWNING_TAGS.has(focus.tag)
}

/** One heading and its rows, as the pause menu prints them. */
export interface PauseBindingGroup {
  group: Binding['group']
  title: string
  rows: ReadonlyArray<{ id: BindingId; keys: readonly string[]; label: string }>
}

/**
 * The control table the pause menu prints, read from the live `BINDINGS`
 * table at call time, so a remap made in Settings shows on return with no
 * edit here. Empty groups are dropped.
 */
export function pauseBindingGroups(): PauseBindingGroup[] {
  const out: PauseBindingGroup[] = []
  for (const g of BINDING_GROUPS) {
    const rows = BINDINGS.filter((b) => b.group === g.group).map((b) => ({
      id: b.id,
      keys: [...b.keys],
      label: b.label,
    }))
    if (rows.length > 0) out.push({ group: g.group, title: g.title, rows })
  }
  return out
}
