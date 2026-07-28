// CONTRACT FILE. Every key and mouse binding the mission accepts. The scene
// handlers and the pause menu both read this list, so the printed table cannot
// drift from what the handlers do.
//
// Two rules keep it that way. One entry per action, never one per key: 0 and
// backtick are a single row. And no key string is written outside this file:
// handlers ask bindingFor for the action and switch on its id.

export type BindingGroup = 'camera' | 'squad' | 'mouse'

// Stable ids the handlers switch on. A union rather than a bare string so a
// typo in a handler is a type error instead of a case that never fires.
export type BindingId =
  | 'panForward'
  | 'panBack'
  | 'panLeft'
  | 'panRight'
  | 'recenter'
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomWheel'
  | 'selectSlot'
  | 'selectAll'
  | 'clearSelection'
  | 'stop'
  | 'holdGround'
  | 'holdFire'
  | 'pause'
  | 'pickSelect'
  | 'boxSelect'
  | 'addSelect'
  | 'clearGround'
  | 'moveOrder'
  | 'attackOrder'
  | 'minimapSteer'

export interface Binding {
  id: BindingId
  group: BindingGroup
  // KeyboardEvent.code values that trigger the action. Empty for mouse rows.
  codes: string[]
  // What the menu prints for the keys, in reading order.
  keys: string[]
  // What the menu prints for the action.
  label: string
}

export const BINDINGS: Binding[] = [
  /* camera, handled in src/scene/CameraRig.tsx */
  { id: 'panForward', group: 'camera', codes: ['KeyW', 'ArrowUp'], keys: ['W', 'Up'], label: 'Pan forward' },
  { id: 'panBack', group: 'camera', codes: ['KeyS', 'ArrowDown'], keys: ['S', 'Down'], label: 'Pan back' },
  { id: 'panLeft', group: 'camera', codes: ['KeyA', 'ArrowLeft'], keys: ['A', 'Left'], label: 'Pan left' },
  { id: 'panRight', group: 'camera', codes: ['KeyD', 'ArrowRight'], keys: ['D', 'Right'], label: 'Pan right' },
  { id: 'recenter', group: 'camera', codes: ['KeyF'], keys: ['F'], label: 'Recenter on the squad' },
  { id: 'zoomIn', group: 'camera', codes: ['Equal', 'NumpadAdd'], keys: ['=', '+'], label: 'Zoom in' },
  { id: 'zoomOut', group: 'camera', codes: ['Minus', 'NumpadSubtract'], keys: ['-', '_'], label: 'Zoom out' },
  { id: 'zoomWheel', group: 'camera', codes: [], keys: ['Wheel'], label: 'Zoom' },

  /* squad, handled in src/scene/Input.tsx */
  // The slot is the digit the pressed code ends in, so the number row and the
  // keypad stay one action and one printed row.
  {
    id: 'selectSlot',
    group: 'squad',
    codes: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'],
    keys: ['1-4'],
    label: 'Select that operative',
  },
  {
    id: 'selectAll',
    group: 'squad',
    codes: ['Digit0', 'Backquote', 'Numpad0'],
    keys: ['0', '`'],
    label: 'Select the living squad',
  },
  { id: 'clearSelection', group: 'squad', codes: ['Backspace'], keys: ['Backspace'], label: 'Clear the selection' },
  { id: 'stop', group: 'squad', codes: ['KeyX'], keys: ['X'], label: 'Stop and drop orders' },
  { id: 'holdGround', group: 'squad', codes: ['KeyH'], keys: ['H'], label: 'Hold position' },
  { id: 'holdFire', group: 'squad', codes: ['KeyC'], keys: ['C'], label: 'Hold fire' },
  // Escape is the key players reach for to leave a game, so it opens the menu
  // and clearing the selection moved to Backspace. Both keys are one action:
  // the menu is what the paused state looks like.
  { id: 'pause', group: 'squad', codes: ['Space', 'Escape'], keys: ['Space', 'Esc'], label: 'Pause menu' },

  /* mouse, handled in src/scene/Input.tsx and src/ui/Minimap.tsx */
  { id: 'pickSelect', group: 'mouse', codes: [], keys: ['Left click'], label: 'Select an operative' },
  { id: 'boxSelect', group: 'mouse', codes: [], keys: ['Left drag'], label: 'Box select operatives' },
  { id: 'addSelect', group: 'mouse', codes: [], keys: ['Shift', 'Left'], label: 'Add to the selection' },
  { id: 'clearGround', group: 'mouse', codes: [], keys: ['Left click'], label: 'Clear on bare ground' },
  { id: 'moveOrder', group: 'mouse', codes: [], keys: ['Right click'], label: 'Move order' },
  { id: 'attackOrder', group: 'mouse', codes: [], keys: ['Right click'], label: 'Attack a hostile' },
  { id: 'minimapSteer', group: 'mouse', codes: [], keys: ['Minimap'], label: 'Steer the camera' },
]

// Print order and headings for the menu. A new action needs no edit here; a
// new group does.
export const BINDING_GROUPS: ReadonlyArray<{ group: BindingGroup; title: string }> = [
  { group: 'camera', title: 'CAMERA' },
  { group: 'squad', title: 'SQUAD' },
  { group: 'mouse', title: 'MOUSE' },
]

// First claim on a code wins. Two actions on one key is the bug this module
// exists to stop, so dev builds say which pair collided instead of leaving one
// of them silently dead.
const BY_CODE = new Map<string, Binding>()
for (const b of BINDINGS) {
  for (const code of b.codes) {
    const prev = BY_CODE.get(code)
    if (prev) {
      if (import.meta.env.DEV) {
        console.error('[bindings] ' + code + ' is claimed by both ' + prev.id + ' and ' + b.id)
      }
      continue
    }
    BY_CODE.set(code, b)
  }
}

// Some environments deliver synthetic key events with an empty code. These are
// the characters whose code cannot be spelled from the character itself.
const CHAR_CODES: Record<string, string> = {
  ' ': 'Space',
  '`': 'Backquote',
  '~': 'Backquote',
  '=': 'Equal',
  '+': 'Equal',
  '-': 'Minus',
  _: 'Minus',
}

// The one convention every handler matches on: the physical code, so the
// bindings survive a non-Latin layout, with the character as the fallback.
export function codeOf(e: KeyboardEvent): string {
  if (e.code) return e.code
  const k = e.key
  // Escape, Backspace and the arrows already name their own code.
  if (k.length !== 1) return k
  const c = k.toLowerCase()
  if (c >= 'a' && c <= 'z') return 'Key' + c.toUpperCase()
  if (c >= '0' && c <= '9') return 'Digit' + c
  return CHAR_CODES[k] ?? ''
}

export function bindingFor(code: string): Binding | undefined {
  return BY_CODE.get(code)
}
