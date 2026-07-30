// CONTRACT FILE. Every key and mouse binding the mission accepts. The scene
// handlers and the pause menu both read this list, so the printed table cannot
// drift from what the handlers do.
//
// Two rules keep it that way. One entry per action, never one per key: 0 and
// backtick are a single row. And no key string is written outside this file:
// handlers ask bindingFor for the action and switch on its id.
//
// The settings screen may remap most keyboard rows: applyOverrides swaps the
// codes and printed keys in place and rebuilds the code lookup, so every
// consumer of this table (handlers, pause menu, tutorial) follows the player's
// keys with no edit of its own. Two rows stay fixed: pause, because
// scene/Input.tsx guards on the Space literal for focused dialog buttons, and
// selectSlot, because the slot is the digit the pressed code ends in.

export type BindingGroup = 'camera' | 'squad' | 'abilities' | 'mouse'

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
  | 'swapWeapon'
  | 'useAbility'
  | 'useMed'
  | 'useCell'
  | 'grenade'
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
  { id: 'swapWeapon', group: 'squad', codes: ['KeyV'], keys: ['V'], label: 'Swap weapon' },
  // Escape is the key players reach for to leave a game, so it opens the menu
  // and clearing the selection moved to Backspace. Both keys are one action:
  // the menu is what the paused state looks like.
  { id: 'pause', group: 'squad', codes: ['Space', 'Escape'], keys: ['Space', 'Esc'], label: 'Pause menu' },

  /* abilities, handled in src/scene/Input.tsx */
  { id: 'useAbility', group: 'abilities', codes: ['KeyQ'], keys: ['Q'], label: 'Use role ability' },
  // The med kit keeps M as an alias: it was the med stim key before the items
  // became squad-pooled consumables on E and R.
  { id: 'useMed', group: 'abilities', codes: ['KeyE', 'KeyM'], keys: ['E', 'M'], label: 'Use med kit' },
  { id: 'useCell', group: 'abilities', codes: ['KeyR'], keys: ['R'], label: 'Use power cell' },
  { id: 'grenade', group: 'abilities', codes: ['KeyG'], keys: ['G'], label: 'Arm / cancel grenade' },

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
  { group: 'abilities', title: 'ABILITIES' },
  { group: 'mouse', title: 'MOUSE' },
]

/* ------------------------------ remapping ------------------------------- */

// User overrides, keyed by action id. A listed action runs on exactly the
// codes given; an absent action keeps its authored defaults.
export type BindingOverrides = Partial<Record<BindingId, string[]>>

// The authored table, snapshotted before any override lands.
const DEFAULTS = new Map<BindingId, { codes: string[]; keys: string[] }>(
  BINDINGS.map((b) => [b.id, { codes: [...b.codes], keys: [...b.keys] }]),
)

// Pause and selectSlot stay fixed (see the header); mouse rows and the wheel
// carry no codes to replace.
export function remappable(b: Binding): boolean {
  return b.codes.length > 0 && b.id !== 'pause' && b.id !== 'selectSlot'
}

export function defaultCodes(id: BindingId): string[] {
  return [...(DEFAULTS.get(id)?.codes ?? [])]
}

// Codes no override may claim: the fixed rows keep them forever.
const RESERVED_CODES = new Set(
  BINDINGS.filter((b) => !remappable(b)).flatMap((b) => b.codes),
)

// What the menus print for a captured code.
const CODE_LABEL: Record<string, string> = {
  Space: 'Space',
  Escape: 'Esc',
  Backspace: 'Backspace',
  Backquote: '`',
  Equal: '=',
  Minus: '-',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  NumpadAdd: 'Num +',
  NumpadSubtract: 'Num -',
  Tab: 'Tab',
  Enter: 'Enter',
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6)
  return CODE_LABEL[code] ?? code
}

// Structural filter plus conflict rejection. An entry survives only when it
// names a remappable action, holds 1..4 unique non-empty codes, claims no
// reserved code, and collides with neither another surviving override nor the
// still-standing default of an action it does not replace. Dropping an entry
// restores that action's defaults, so the check runs to a fixpoint.
export function sanitizeOverrides(raw: unknown): BindingOverrides {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const record = raw as Record<string, unknown>
  const out: BindingOverrides = {}
  for (const b of BINDINGS) {
    if (!remappable(b)) continue
    const codes = record[b.id]
    if (!Array.isArray(codes) || codes.length === 0 || codes.length > 4) continue
    if (!codes.every((c): c is string => typeof c === 'string' && c.length > 0 && c.length <= 32)) {
      continue
    }
    if (new Set(codes).size !== codes.length) continue
    if (codes.some((c) => RESERVED_CODES.has(c))) continue
    out[b.id] = [...codes]
  }
  for (let pass = 0; pass < BINDINGS.length; pass++) {
    // Standing defaults claim first: an override never steals a key an
    // un-overridden action still runs on. Then the overrides claim in table
    // order, and the first one that collides is dropped, which restores its
    // own defaults for the next pass.
    const claimed = new Set(RESERVED_CODES)
    for (const b of BINDINGS) {
      if (out[b.id]) continue
      for (const c of DEFAULTS.get(b.id)?.codes ?? []) claimed.add(c)
    }
    let dropped: BindingId | null = null
    for (const b of BINDINGS) {
      const codes = out[b.id]
      if (!codes) continue
      if (codes.some((c) => claimed.has(c))) {
        dropped = b.id
        break
      }
      for (const c of codes) claimed.add(c)
    }
    if (!dropped) break
    delete out[dropped]
  }
  return out
}

// First claim on a code wins. Two actions on one key is the bug this module
// exists to stop, so dev builds say which pair collided instead of leaving one
// of them silently dead.
const BY_CODE = new Map<string, Binding>()

function rebuildByCode(): void {
  BY_CODE.clear()
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
}

// Swaps the live table onto the given overrides (sanitized first) and returns
// what survived. Passing an empty object restores every authored default.
export function applyOverrides(raw: unknown): BindingOverrides {
  const clean = sanitizeOverrides(raw)
  for (const b of BINDINGS) {
    const d = DEFAULTS.get(b.id)
    if (!d) continue
    const codes = clean[b.id]
    if (codes) {
      b.codes = [...codes]
      b.keys = codes.map(keyLabel)
    } else {
      b.codes = [...d.codes]
      b.keys = [...d.keys]
    }
  }
  rebuildByCode()
  return clean
}

rebuildByCode()

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
