# UX Spec: Settings

> **Status**: Approved (/ux-review design/ux/settings.md 2026-10-23)
> **Author**: Claude (delegated by owner /goal 2026-10-23) + ux-designer
> **Last Updated**: 2026-10-23 (brought current with IF-037, commit 52be089: focus restore from Pause and Balance, `.btn.sel` selected state, overlay fade under reduced motion, ellipsis rules removed, latest sweep and focus probe)
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player opens Settings wanting to **make the game fit their ears, eyes, hands and machine, once, and trust it stays that way**. The sentence the overlay must make true is: "I changed it, I can see it changed, and it will still be changed tomorrow."

Settings is an overlay, not a Screen (Interface Screens table). It hosts every Committed accessibility control of the Standard tier that is a player setting. It does six jobs:

1. **Hear**: Master, UI CUES, COMBAT, MUSIC and AMBIENCE sliders and MUTE. Mute keeps the chosen levels (Audio GDD).
2. **See**: TEXT SCALE 90 / 100 / 110 / 125%, HIGH CONTRAST, REDUCED MOTION.
3. **Control**: the remap table. Every keyboard action except pause and operative slots 1–4 can be rebound; the mouse is reserved (Interface Rule 15).
4. **Tune**: DIFFICULTY (Standard / Hardened) and QUALITY (Auto / High / Medium / Low). Neither is a design lever that may hide information (Interface Rules 11, 17).
5. **Consent**: the TELEMETRY toggle (local only, nothing transmitted) and the entry to Balance once a log exists.
6. **Persist**: settings live in their own slot, outside the campaign save, so New Operation keeps them (Interface AC 17).

**Failure if this overlay is missing or hard to use**: a player who cannot read 10 px text, cannot bear motion, or whose keys collide with their keyboard has no recourse, and the Standard tier's Committed rows (text scale, high contrast, reduced motion, remap, focus trap and restore) have no home. **No playtest finding about Settings was provided to this spec**; none is cited.

**Pillars served** (inference from the pillar names in `design/ux/world-network.md`; no pillar file was re-read): *One corporate operating system* (Settings reuses the pause menu chrome, `.hud-menu-*`); *Information is operational power* (Difficulty and Quality must not remove information).

Sources: `src/ui/Settings.tsx`, `src/ui/PauseMenu.tsx`, `src/ui/Balance.tsx`, `src/ui/modalFocus.ts`, `src/ui/index.tsx` (`MainMenu`), `src/state/settingsStore.ts`, `src/game/bindings.ts`, `src/ui/ui.css` (`.set-*`, `.hud-menu-*`, `.btn.sel`); story `production/epics/interface/story-037-screen-specs-committed-tier-deltas.md`; `design/gdd/interface.md` Screens table, Rules 12, 14, 15, 17, state-table rows (Remap table, Text scale, Motion / contrast, Quality, Difficulty chrome), ACs 11, 17, 18, 19; `design/gdd/audio.md` (mixer); `design/gdd/persistence-and-validation.md` (settings slot); `design/ux/main-menu.md`; `design/ux/hud.md`; `design/ux/interaction-patterns.md` P-01, P-03, P-04, P-05, P-13, P-15, P-19, Escape; `design/accessibility-requirements.md`; measurement run `production/qa/evidence/screens-2026-10-23/` (`sweep-output.txt`, `sweep-settings.json`, `settings-{90,100,110,125,hc}.png`, `focus-output.txt` with its harness `focus.mjs`, README). Platform and input from `project.yaml` `platform` (targets `Desktop browser (1280×720 minimum)`, primary input `Keyboard/Mouse`, gamepad `None`, touch `None`).

---

## Player Context on Arrival

Settings has two openers. Both mount the same component, `SettingsPanel`, in a `.hud-menu-wrap` (`role="dialog" aria-modal="true" aria-label="Settings"`).

| Arrival | What the player was just doing | Assumed emotional state | What they most need |
|---|---|---|---|
| **From the Menu** (`phase = 'menu'`) | Looking at the Menu; no campaign yet or about to Continue | Unhurried; often a first-time player fixing sound, text size or keys before playing | Audio and the accessibility controls visible without scrolling; every change visible at once |
| **From Pause, mid-mission** (`phase = 'mission'`, `missionStore.paused`) | Fighting; pressed Escape, then SETTINGS | Interrupted, possibly stressed; wants one quick fix (a key that fights them, a loud channel) and to be back in the same frozen mission | A fast path in and out; the sim stays frozen; closing returns to the Pause menu with focus on its SETTINGS control, not to the fight; honest words about what applies now vs next mission |

- **Voluntary**: yes. Nothing sends the player here.
- **Time pressure**: none. On Menu no clock runs. From Pause the sim and camera are frozen and Settings leaves `missionStore.paused` untouched (file header, `Settings.tsx`).
- **Attention load**: low and wide. About 40 controls, none live. The player is reading, not reacting.
- **Audio**: Menu has unlocked audio on the first click (`index.tsx`), so toggles and buttons play the UI click through `uiClick`. As built the volume sliders play no cue (Open Question 15).
- **Pause-specific facts (code read, not run)**: Quality applies from the next mission (the row says so while `missionStore.live`); Difficulty is read once at deploy (`deployFreeze.ts` `freezeDeploy`), so a change from Pause cannot reach the running mission. The Difficulty row says nothing about that (Open Question 9).
- **Journey phase**: not mapped. The arrivals above come from the code and GDDs, not a journey map.

---

## Navigation Position

This screen lives at: [any phase] → **Settings** (overlay). It is not one of the four Screens and not a phase: it never changes `appStore.phase` (ADR-0017: "Settings, Balance, pause, and tutorial toasts are overlays. They do not change `Phase`"; Interface state table: "Settings and Balance overlay the current phase"). Entry points are the Menu's SETTINGS button and the Pause menu's SETTINGS button (the Pause entry is itself inside the P-05 freeze, so the overlay stack is Pause → Settings → Balance). Overlays above it: Balance (`BALANCE DATA` → `OPEN`) replaces the Settings panel inside the same wrap. Entry points, verified by a search of `src` on 2026-10-23: `SettingsPanel` is imported only by `src/ui/index.tsx` (`MainMenu`) and `src/ui/PauseMenu.tsx`, so these two are the only openers. Balance has a second opener outside this stack (the Debrief's `BALANCE DATA`, `design/ux/debrief.md`); that path is the Debrief spec's and Balance's, not Settings'.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| Menu → SETTINGS | Click, Enter or Space on `SETTINGS` (accessible name `OPEN SETTINGS // AUDIO, CONTROLS AND ACCESSIBILITY`). Cancels an armed New Operation (`main-menu.md`) | Persisted settings, hydrated at boot (`initSettings`). Focus moves in: initial focus is `CLOSE` (`closeRef.focus()` on mount, code read) |
| Pause → SETTINGS | Click, Enter or Space on `SETTINGS` (name `Open settings`) | Live mission frozen; `paused` untouched; a pending Abort arm keeps its own 3 s timer (Open Question 19). Opening Pause itself still focuses `RESUME`; focus then moves into Settings on open (initial focus `CLOSE`, as from the Menu) |

| Exit Destination | Trigger | Notes |
|---|---|---|
| Menu (focus → the SETTINGS button) | `CLOSE`, or Escape when no capture and no Balance is open | Shipped (`index.tsx`, IF-005 AC19). Nothing is lost: every control already committed |
| Pause menu (focus → the SETTINGS control) | `CLOSE`, or Escape | Shipped (IF-037): P-05 focus returns to the invoking control and nested Settings returns to Pause; this also satisfies Interface AC 18 ("restores to the pause modal"). `PauseMenu.tsx` focuses `settingsRef` on the open-to-closed edge; first mount of Pause still focuses `RESUME`. Evidence: `focus-output.txt` ("closing Settings from Pause returns focus to SETTINGS", closed with Escape). Closing with the `CLOSE` button runs the same `onClose` (code read; not separately probed). Open Question 4 (closed) |
| Balance | `BALANCE DATA` → `OPEN` | Replaces the panel. Focus enters Balance and Tab is trapped in it (`useModalFocus`); Escape peels Balance first, through Settings' listener (Escape section), and on close focus returns to the `OPEN` control. Shipped (IF-037); `focus-output.txt` checks 3–5, from the Menu opener. Balance has no UX spec of its own (Open Question 5) |

No exit is destructive. There is no Apply or Cancel: every control commits the moment it is activated (`settingsStore.commit`), so closing never discards a choice. Clicking the dimmed backdrop does nothing (`.hud-menu-wrap` takes pointer events so the click cannot reach the Menu or the canvas); only `CLOSE` and Escape close.

---

## Layout Specification

**Measurement basis.** Measured on the running build after IF-036 and IF-037, 2026-10-23, at exactly 1280×720, **opened from the Menu**: `sweep-output.txt` and `sweep-settings.json` (every text box, real Tab order, clip / truncation / text-over-text scan at 90 / 100 / 110 / 125, target scan) and the five screenshots. Settings result in that sweep: 157 text runs, 57 targets, 37 tab stops; 0 runs under 10 px; 0 under 4.5:1 in default and in high contrast; 0 targets under 24×24; 0 clip at each scale. **Settings opened from Pause was not measured.** By code it is the same component in the same wrap class, so the layout should be identical, but that is an inference (Open Question 1).

### ASCII Wireframe

1280×720, text scale 100%, defaults, opened from the Menu. Panel 920×656 centered. The left column and the right column scroll together inside `.set-grid`; the right column's table also scrolls inside its own 380 px region. In `settings-100.png` PERFORMANCE and DATA are below the visible area.

```
+------------------------------------------------------------------------------------------+
| SETTINGS                                                       STORED ON THIS TERMINAL   |
+------------------------------------------------------------------------------------------+
| AUDIO                                 | CONTROLS                            [RESET ALL]   |
|  MASTER    [=========o]  100          | PAUSE, OPERATIVE SLOTS 1-4 AND THE MOUSE STAY FIXED.|
|  UI CUES   [=========o]  100          | CLICK REBIND, THEN PRESS THE NEW KEY; ESC CANCELS.  |
|  COMBAT    [=========o]  100          | [ notice slot: conflict / cannot be bound, red ]    |
|  MUSIC     [=========o]  100          | +- scroll region, max-height 380 px ------------+   |
|  AMBIENCE  [=========o]  100          | | CAMERA                                        |   |
|  MUTE  Silences every synth voice [OFF]| |  PAN FORWARD    [W][UP]      [REBIND] [RESET] |   |
| ACCESSIBILITY                         | |  ...                                          |   |
|  REDUCED MOTION  .............. [OFF] | |  ZOOM           [WHEEL]                [MOUSE]|   |
|  HIGH CONTRAST   .............. [OFF] | | SQUAD                                         |   |
|  TEXT SCALE  [90%][100%][110%][125%]  | |  SELECT THAT OPERATIVE [1-4]          [FIXED] |   |
| DIFFICULTY                            | |  ...                                          |   |
|  THREAT PROFILE  [STANDARD][HARDENED] | |  PAUSE MENU    [SPACE][ESC]           [FIXED] |   |
| - - - first view ends (100%) - - - - -| | ABILITIES                                     |   |
| PERFORMANCE                           | |  USE ROLE ABILITY ... GRENADE [REBIND][RESET] |   |
|  QUALITY  [AUTO][HIGH][MED][LOW]      | +-----------------------------------------------+   |
| DATA                                  |                                                     |
|  TELEMETRY: LOCAL ONLY ........ [OFF] |                                                     |
|  BALANCE DATA [OPEN]  (log nonempty)  |                                                     |
+------------------------------------------------------------------------------------------+
|                                        [ CLOSE ]                                          |
+------------------------------------------------------------------------------------------+
```

### Layout Zones

| Zone | Size at 1280×720, 100% | Contents | Why here |
|---|---|---|---|
| **Panel** | 920×656 (CSS `.settings-panel { width: 920px }`, `.hud-menu-panel { max-height: calc(100vh - 64px) }`; `settings-100.png` shows it at x 180–1100, y 32–688). Same size at all four scales | P-05 frame over a `rgba(2,6,8,0.72)` scrim | Shares the pause menu chrome (one OS); wide enough for the binding table |
| **Head** | full panel width | `SETTINGS`; right: `STORED ON THIS TERMINAL` (184 px) | Names the overlay and says where preferences live |
| **Left column** | 364 px (measured section-head width) | AUDIO, ACCESSIBILITY, DIFFICULTY, PERFORMANCE, DATA | Listening and reading first (inference). The two accessibility controls that gate every other screen (TEXT SCALE, HIGH CONTRAST) sit in the first view at all four scales |
| **Right column** | 510 px (measured) | CONTROLS head with RESET ALL, instruction note, notice slot, binding table | The table is the long object; it gets the wide column. 5fr : 7fr with a 24 px gap (CSS), 364 + 24 + 510 = 898 px |
| **Action bar** | full width, top border | `CLOSE` (99 px) | One exit, always visible below the scroll regions |

Scroll behavior (code and screenshots): `.set-grid` is `overflow: auto` (a plain scroller, not `ScrollBox`); `.set-bind-list` is `overflow-y: auto; max-height: 380px` inside it, so the right column has two nested scroll regions. No fade or scrollbar is visible in any of the five screenshots (the P-15 scrollbar appears on hover; the captures were not hovered). At 90% only the `PERFORMANCE` heading reaches the first view, at 110% and 125% the DIFFICULTY row is cut by the scroll edge (`settings-90/110/125.png`; read from the 90 and 125 captures, the 110 capture was not re-read after IF-037). In the 90, 125 and high-contrast captures the binding table is scrolled and its first visible row (`ZOOM`) is cut by the region's top edge; that is a scroll position, not a clip (`clips` is empty at every scale), and what caused the scroll was not recorded. Every `text-overflow: ellipsis` rule in `src/ui/ui.css` is gone (IF-037; a search of `src/ui` finds none), so no Settings text can be cut by an ellipsis; overflowing text wraps (`overflow-wrap: break-word`) or scrolls.

**Arrangements considered.** None chosen by this spec: the layout is as built (two columns, one scroll container). Open Question 16 asks whether ACCESSIBILITY should lead the left column.

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks.

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Frame | Settings overlay | Modal overlay | Dialog, scrim, focus trap, restore | Yes | P-05 |
| Head | Storage status | Static text | `STORED ON THIS TERMINAL`; failure variant proposed under States | No | P-19 (failure variant, Open Question 6) |
| Left | Section heads | Static labels | `AUDIO`, `ACCESSIBILITY`, `DIFFICULTY`, `PERFORMANCE`, `DATA`, `CONTROLS` | No | none |
| Left | Volume slider ×5 | Range 0–100, step 5, value printed | Label (`MASTER`, `UI CUES`, `COMBAT`, `MUSIC`, `AMBIENCE`), value; accessible name `<LABEL> volume` | Yes | P-13 slider |
| Left | Toggle ×4 | Button with `aria-pressed` | `MUTE`, `REDUCED MOTION`, `HIGH CONTRAST`, `TELEMETRY: LOCAL ONLY`; description line; `ON` / `OFF`; name `<NAME> // ON|OFF`. `ON` adds `.btn.sel` (closed 2 px teal frame, teal ink) | Yes | P-13 toggle |
| Left | Segmented ×3 | Buttons with `aria-pressed` | TEXT SCALE `90% 100% 110% 125%`; THREAT PROFILE `STANDARD HARDENED`; QUALITY `AUTO HIGH MED LOW`; descriptions. Selected segment: `.btn.sel`, a closed 2 px teal frame and teal ink; the others keep the 1 px hairline and Ink (IF-037 AC 3) | Yes | P-13 segmented; the visual selected cue is not yet written into P-13 (Open Question 24) |
| Left | Row descriptions | Static text | e.g. `Silences every synthesized voice`; Quality line is `Applies from the next mission` while a mission is live | No | none |
| Left | BALANCE DATA | Secondary button | `OPEN`; present only when the retained log is nonempty (Interface OQ 9, closed) | Yes | Standard button; opens a P-05 overlay |
| Right | Instruction note | Static text | `PAUSE, OPERATIVE SLOTS 1-4 AND THE MOUSE STAY FIXED. CLICK REBIND, THEN PRESS THE NEW KEY; ESC CANCELS.` | No | P-13 |
| Right | Binding row ×20 | Row | Action label; key chips; `REBIND` + `RESET`, or a `FIXED` / `MOUSE` chip. 17 rebindable, 3 reserved (`ZOOM` wheel `MOUSE`, `SELECT THAT OPERATIVE` `FIXED`, `PAUSE MENU` `FIXED`). The capturing `REBIND` uses `.btn.sel` and reads `PRESS KEY...`. Overridden key chips print in the amber chip tone (as built; Open Question 23) | Yes | P-13 remap, P-14 (chips), P-04 |
| Right | RESET ALL | Button | Disabled at defaults | Yes | P-13; reason text: Open Question 14 |
| Right | Conflict / rejection notice | Inline text in a red frame | `<KEY> IS CLAIMED BY: <ACTION>` or `THAT KEY CANNOT BE BOUND` | No | **New** (library has no remap-conflict pattern; Open Question 8) |
| Right | Binding scroll region | Scroll | Table, 380 px max | Scrolls | P-15 |
| Action bar | CLOSE | Primary button | `CLOSE` | Yes | Standard button |

The mouse group rows from `bindings.ts` (`Left click`, `Right click`, drag, minimap) are **not** listed in this table as built; the note says the mouse stays fixed, and the Pause menu prints them.

### Information Hierarchy

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | AUDIO sliders and MUTE | Always, first view | Most common reason to open (inference) |
| 2 | ACCESSIBILITY: text scale, contrast, motion | Always, first view at all four scales | Gates readability of everything else |
| 3 | The binding table with the instruction note | Always; table scrolls | Long object; the note says what is fixed before the player tries |
| 4 | Conflict / rejection notice | While capture is on and a key was refused | Sits between the note and the table so it is seen where the click happened |
| 5 | DIFFICULTY, QUALITY | Difficulty in first view at 100%; Quality below it | The "applies from the next mission" wording matters most from Pause |
| 6 | TELEMETRY, BALANCE DATA | Below the first view at 100% | Rarely needed |
| 7 | `STORED ON THIS TERMINAL` | Always | Reassurance; must not claim what did not happen |

**Discoverable, not up front**: Balance (only once a log exists); the reserved-key reasons (printed in the note and as chips).

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Loading** | None | No loading state exists: nothing here is fetched asynchronously. `initSettings` reads storage once at boot, and a search of `Settings.tsx` and `settingsStore.ts` finds no `async`, `await`, `Promise` or timer |
| **Timers / auto-dismiss** | None | Nothing on this overlay expires or dismisses itself. The only timers nearby are Pause's Abort arm (Open Question 19) and Balance's Clear arm, which are theirs |
| **Selected / ON / capturing look** | `aria-pressed="true"`, or capture on | `.btn.sel`: closed 2 px teal frame and teal ink; other buttons keep a 1 px hairline and Ink. The −1 px margin keeps the layout from shifting. Not amber (IF-037; `focus-output.txt`: class `btn set-scale-btn sel`, color `rgb(126, 240, 212)`, border `2px solid`) |
| **Default** | Open with no stored blob | Volumes 100, mute OFF, Standard, Reduced motion OFF, High contrast OFF, scale 100%, Quality AUTO, Telemetry OFF, no overrides; every RESET and RESET ALL disabled (`defaultSettings`) |
| **From Menu / from Pause** | Opener | Identical panel. From Pause the scene behind is frozen; the Quality row reads `Applies from the next mission` while `missionStore.live` |
| **Volume channel** | Slider | Printed value 0–100 in steps of 5; effect on the mixer at once (`setAudioLevels`). Master scales all four buses; each channel scales only its own |
| **Muted** | MUTE `ON` | Word `ON`. All voices silent; chosen levels kept; `OFF` restores them (`stagedGain`, Audio GDD) |
| **Text scale 90 / 100 / 110 / 125%** | Segment | Root class `s-text-N`; every font-size multiplies `--text-scale`. The panel stays 920×656; descriptions wrap; lists scroll. The panel reflows under the pointer on activation |
| **Reduced motion ON** | Toggle | Root class `s-reduce-motion`: decorative sweeps stop, loops freeze, rain at minimum density (row copy; Interface Rule 14). Static fallbacks per art bible §7.4. The overlay itself opens with no fade (`.hud-menu-wrap` is in the reduced-motion `animation: none` list; `focus-output.txt` check 13) |
| **High contrast ON** | Toggle | Root class `s-high-contrast`: ink and line variables remap only (`src/index.css`). Brackets, rings and words survive |
| **Difficulty Standard / Hardened** | Segment | Persists. Applies from the **next deploy** (code read: `freezeDeploy`); World Network Chance recomputes at once. Never strips the minimap (copy says so) |
| **Quality Auto / High / Medium / Low** | Segment | Persists. Applies from the next mission. AUTO may be replaced by a concrete tier by the in-mission frame governor (`GameCanvas.tsx` `FrameGovernor` calls `setQuality`); the row then shows the concrete tier pressed (Open Question 18) |
| **Telemetry ON / OFF** | Toggle | Local log on or off; nothing transmitted. Off stops appends but keeps retention (Interface state table) |
| **Balance entry present / absent** | Retained log nonempty / empty | `BALANCE DATA` row appears iff the log has at least one record, whatever the toggle reads (Interface OQ 9) |
| **Binding at default** | No override | Chips in the dim tone; `RESET` disabled |
| **Binding overridden** | A key was captured | One chip (all the action's keys are replaced by the captured one, code read); chip tone changes (as built amber, Open Question 23); `RESET` enabled; `RESET ALL` enabled |
| **Reserved row** | Pause, slots 1–4, wheel | `FIXED` or `MOUSE` chip, no `REBIND`. Shown as reserved, not as an error (P-13). Reserved codes: Space, Escape, Digit 1–4, Numpad 1–4 (`bindings.ts` `RESERVED_CODES`) |
| **Capture on** | `REBIND` | That button reads `PRESS KEY...` in the `.btn.sel` frame, accessible name `Press the new key for <ACTION>`; every keydown is swallowed (capture-phase document listener) |
| **Capture rejected: reserved or claimed key** | A key another action holds, including Space | Notice `<KEY> IS CLAIMED BY: <ACTION>` (e.g. `SPACE IS CLAIMED BY: PAUSE MENU`); capture stays on; nothing changes. No swap |
| **Capture rejected: unbindable key** | Tab, Shift, Control, Alt, Meta, or an empty code | Notice `THAT KEY CANNOT BE BOUND`; capture stays on |
| **Capture accepted** | A free key, or the action's own current key | Binding replaced; capture ends; notice clears |
| **Capture cancelled** | Escape, the same `REBIND` again, another `REBIND` (moves capture), any `RESET` / `RESET ALL` | Capture ends; Escape also clears the notice; not an error |
| **Balance open** | `OPEN` | `BalancePanel` replaces the Settings panel in the same wrap. Focus moves into Balance, Tab stays in it; Escape or Balance's close returns to Settings with focus on `OPEN` |
| **Storage unavailable or write refused** | `localStorage` absent, full or read-only | Settings still take effect for the session (`persist` swallows the error). **As built nothing says so and the head still reads `STORED ON THIS TERMINAL`**. Spec: the head label must not claim storage; proposed copy `NOT STORED // THIS SESSION ONLY`, a persistent inline label (P-19: failure reads as failure, red may reinforce, the words carry it). Needs the store to report failure; copy and channel are the owner's call (Open Question 6) |
| **Stored blob unreadable or wrong version** | Garbage, other version, no storage at boot | Every setting falls back to its default independently of the campaign (Persistence GDD); no notice (as built and per GDD). Overrides that collide are dropped on load (`sanitizeOverrides`), also without a notice (Open Question 11) |
| **Window below 1280×720** | Resize | Panel width is `min(920, 100vw − 64)` and height `100vh − 64` by CSS; behavior and clipping **not measured** (Open Question 2) |

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` `platform.primary_input`). Gamepad: **None**; touch: **None** (ADR-0017). Hover is not a state (art bible §7.4). Focus is P-04; native range inputs keep a 2 px teal frame because a form field has no `::after` (`src/index.css` comment). Pointer, Enter and Space activate every button. Every button activation plays `uiClick` through `ui/sound`. No key binding is invented here.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Volume slider | Set level | Drag or click the track; Left/Right/Up/Down by 5, Home, End (native range, step 5) | Printed value changes on each input; no click sound | `setVolume(channel, v)`; persists; mixer updated |
| Toggle (Mute, Reduced motion, High contrast, Telemetry) | Flip | Click; Enter/Space | Word `ON`/`OFF`, `aria-pressed` and the `.btn.sel` frame change in one frame; click | Setter; persists; root class or mixer updated |
| Segment (Text scale, Difficulty, Quality) | Choose | Click; Enter/Space. Each segment is its own Tab stop; no arrow-key travel in the group (full keyboard travel is Backlog) | `aria-pressed` and the `.btn.sel` frame move to the chosen segment; click | Setter; persists. Text scale reflows this panel at once |
| `REBIND` | Start capture | Click; Enter/Space | Label `PRESS KEY...`; notice slot clears | Capture on. A second activation cancels |
| Any key during capture | Bind | The key | Table updates in the same frame; chip tone and `RESET` change | Rules in States (reserved / claimed / unbindable / accepted). The key replaces all of the action's keys. No swap, no steal |
| Escape during capture | Cancel | Esc | Capture ends, notice clears | Settings stays open |
| `RESET` (row) | Restore one default | Click; Enter/Space. Disabled at default | Chip(s) return to defaults | `clearBindingOverride(id)`; ends capture |
| `RESET ALL` | Restore every default | Click; Enter/Space. Disabled at defaults | All rows return | `resetBindings()`; no confirm (a recoverable preference; Open Question 20) |
| `BALANCE DATA` → `OPEN` | Open Balance | Click; Enter/Space | Panel swaps; focus moves to Balance's first control | `balanceOpen`; Escape returns, focus back on `OPEN` |
| `CLOSE` | Close | Click; Enter/Space | Overlay leaves | `onClose`; focus returns to the opener's SETTINGS control (Menu or Pause) |
| Tab / Shift+Tab | Move | Keyboard | P-04 brackets | Settings trap wraps first ↔ last enabled `button` or `input` (code read). While Balance is shown, Settings' trap is idle (its panel is not rendered) and Balance's own trap (`useModalFocus`) holds Tab inside Balance |
| Escape | Close the top thing | Esc | As above | Order: capture → Balance → Settings (shipped; library Escape section). Consumed at document capture with `stopPropagation`, so the same press never also toggles Pause |
| Backdrop | Click | Pointer | None | Nothing (not a close) |
| Wheel over the grid or the table | Scroll | Wheel; scrollbar | P-15 scrollbar on hover | Moves the nearest scroller |

Notes: during capture the keyboard cannot leave the table by Tab (Tab is refused as unbindable); Escape is the way out. Space and Enter on a focused control belong to the control, not to Pause (`Input.tsx` `dialogControlOwnsKey`); the camera handler ignores keys while the mission is paused (`CameraRig.tsx`), so slider arrow keys work from Pause.

**Spec-vs-built discrepancies are listed once, under Open Questions.**

---

## Data Requirements

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| `masterVol`, `uiVol`, `combatVol`, `musicVol`, `ambienceVol` | `settingsStore` | Read; **Write** via `setVolume` | Integers 0–100; clamp and round on write and load |
| `muted` | `settingsStore` | Read; Write via `setMuted` | Folds into master only; levels kept |
| `difficulty` | `settingsStore` | Read; Write via `setDifficulty` | `standard` \| `hardened` |
| `reducedMotion`, `highContrast` | `settingsStore` | Read; Write | Stamped as root classes by `applyDom` |
| `textScale` | `settingsStore` | Read; Write | One of 90, 100, 110, 125 |
| `quality` | `settingsStore` | Read; Write (also written by the frame governor) | `auto` \| `high` \| `medium` \| `low` |
| `telemetry` | `settingsStore` | Read; Write | Boolean; opt-in; log is separate (`state/telemetry.ts`, ADR-0015) |
| `overrides` | `settingsStore` / `game/bindings` | Read; Write via `setBindingOverride`, `clearBindingOverride`, `resetBindings` | Map of action id → 1–4 `KeyboardEvent.code` strings. Sanitized on every write |
| Live binding table | `game/bindings` `BINDINGS`, `bindingFor` | Read | The table the handlers, the Pause menu and the tutorial also read: a remap renames itself everywhere |
| Binding groups, labels, `remappable()` | `game/bindings` | Read | Labels and print order are the module's |
| Key holder for the conflict notice | `game/bindings` `bindingFor(code)`, `keyLabel` | Read | Names the action that holds a key |
| Option sets | `settingsStore` `TEXT_SCALES`; `game/missionParams` `DIFFICULTIES`; `game/quality` `QUALITY_SETTINGS` | Read | The segments print exactly these sets; Settings adds only display words (`MED` for `medium`) |
| Row copy, head label, instruction note | Literal strings in `Settings.tsx` | Static | Not data; listed so every displayed element has a source |
| Capture target, notice string, Balance open flag | `Settings.tsx` local React state | Transient UI state | Not game state, not persisted; reset when the overlay closes (the component unmounts) |
| `missionStore.live` | `missionStore` | Read | Only to word the Quality row |
| Retained telemetry log (non-empty?) | `state/telemetry` via `useBalanceEntryVisible` | Read | Gates the Balance row |
| Envelope | Browser `localStorage`, key `nexus-settings-v1`, `{ version: 1, ...settings }` | Written by the store only | Separate from the campaign blob (ADR-0011; Persistence GDD) |

**UI owns no game state.** Capture mode, the notice string and the Balance flag are local React state. Everything the player chose lives in `settingsStore`; the UI requests changes through its actions.

**Update triggers and missing values.** "Missing" means unreadable or absent at load; nothing is fabricated at display time because every field has a defined default.

| Data | Updates when | If missing or invalid |
|---|---|---|
| Volumes | Slider input | Non-finite or non-number: 100; out of range: clamped to 0–100 and rounded |
| `muted`, `reducedMotion`, `highContrast`, `telemetry` | Toggle | Anything but `true` reads `false` |
| `difficulty`, `quality`, `textScale` | Segment; `quality` also by the governor | Not in the allowed set: `standard`, `auto`, 100 |
| `overrides` | Capture, `RESET`, `RESET ALL`, load | Structural filter, reserved-code filter and collision filter run to a fixpoint; offenders are dropped and their action reverts to defaults, silently |
| Whole blob | Boot (`initSettings`) | No storage, parse error, non-object or version ≠ 1: all defaults, no notice |
| Binding row labels and keys | Every override change | The module's authored label and keys |
| Balance row | Telemetry log changes | Absent when the log is empty |

Real-time: nothing on this overlay updates per frame. Setter calls are discrete.

---

## Events Fired

Deliberate: Settings fires **no analytics events**. Telemetry is local, opt-in and written only at the Debrief boundary (ADR-0015); nothing here calls it. The table lists state changes instead.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Slider, toggle, segment | State change (**persistent**): `settingsStore` setter, then `persist`, `applyDom`, `applyAudio` | The new value. Owner: `settingsStore` |
| Capture accepted, `RESET`, `RESET ALL` | State change (**persistent**): overrides replaced, live table swapped by `applyOverrides` | Action id → codes. Owner: `settingsStore` / `bindings` |
| Capture rejected | None (local notice string) | Key label and holder label |
| Open Balance | Local UI state | — |
| Any button activation | `uiClick` via the audio event system | No direct audio calls. Sliders emit none (Open Question 15) |
| Open / close | None | Focus restore only |

Architecture flags: the store alone writes storage; the UI never touches it. `persist` swallows write errors, so a failed write produces no event the UI can show (Open Question 6). The frame governor writes `quality` from the scene, outside Settings.

---

## Transitions & Animations

Law (art bible §7.4): print, scan, tick, blink; nothing bounces, pops, slides or glows; panel frames snap in ≤150 ms; nothing exceeds 500 ms except a tick tracking a real value.

| Moment | Spec | Reduced motion |
|---|---|---|
| **Open** | Instant open and close (`main-menu.md`); at most the library's ≤150 ms panel-frame snap. **As built** `.hud-menu-wrap` runs `fade-in 0.16s ease-out` (opacity), 10 ms over 150 ms; Open Question 7 | No fade. Shipped (IF-037): `.hud-menu-wrap` is in the `s-reduce-motion` `animation: none` list (`ui.css`); `focus-output.txt` check 13 reads `none` |
| **Close** | Cut | Same |
| **Toggle / segment press** | Ink-step ≤150 ms, then the state words and the `.btn.sel` frame change in one frame; no tween on the frame | Same |
| **Slider** | Thumb follows the pointer; printed number steps with the value | Same |
| **Text scale change** | The panel reflows in one frame; no tween is specified | Same |
| **Capture on / off** | Label swap in one frame | Same |
| **Notice** | Appears and clears in one frame; no pulse | Same |
| **Focus** | P-04 brackets snap, ≤150 ms (sliders: static 2 px frame) | Static |
| **Balance swap** | Cut | Same |

Panel chrome: P-05 says no drop shadow or glow separates panel from feed. **As built** `.hud-menu-panel` carries `box-shadow: 0 0 70px rgba(0,0,0,0.65)` (`ui.css`), and the shared `.btn:hover` adds a 12 px teal glow although hover is not a state. Open Question 7.

Motion budget: Settings adds no idle loop. The Menu behind it keeps its own motion (its blinking cursor is listed as exempt by the sweep).

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017; `project.yaml`), so those blocks are dropped. An item is ticked only when the Interaction Map above specifies it.

**Keyboard**
- [x] Every action activates with Enter and Space: toggles, segments, `REBIND`, `RESET`, `RESET ALL`, `OPEN`, `CLOSE`. Sliders use the native range keys.
- [x] The whole remap flow is keyboard-doable: Tab to `REBIND`, Enter, press the key; Escape cancels.
- [x] Esc behavior: capture first, then Balance, then Settings (Interaction Map). It never confirms anything.
- [x] Focus is visible on every control: P-04 brackets, in high contrast too; sliders keep a 2 px frame.
- [x] No keyboard trap beyond the P-05 modal trap, which releases on close. In capture mode Tab is refused and Escape is the exit.
- [x] Tab order is specified in Accessibility → Focus order (measured, Menu opener).
- [x] Focus returns to the opener on close: the Menu's SETTINGS button (shipped, IF-005 AC19) and the Pause menu's SETTINGS control (shipped, IF-037; `focus-output.txt`). Closing Balance returns focus to `OPEN` (IF-037; `focus-output.txt`).

**Mouse**
- [x] Every action is a single click. No drag, right-click or double-click is required; sliders also take a track click.
- [x] No information appears only on hover; the scrollbar is the one hover affordance (P-15). `title` text is not relied on.
- [x] Hit targets: the sweep counted **57 targets and 0 under 24×24 CSS px** at 100% from the Menu (`underTargets: []`). Heights were not recorded in the JSON; widths are measured (button text-box widths), heights come from CSS floors where one exists.

| Target (Menu opener, 1280×720, 100%) | Size | Meets 24×24? |
|---|---|---|
| Volume slider input | height 24 px (`.set-slider input`); width ≈226 px (derived: 364 − 84 − 34 − 20) | Yes |
| Toggle button | 71 px wide (`OFF`), `min-width: 52px`; height not recorded | Yes (sweep) |
| Text scale segments | 47, 59 (selected 100%), 57, 57 px wide; height not recorded. The selected box is 2 px wider (2 px frame), the −1 px margin keeps the layout | Yes (sweep) |
| Difficulty segments | 97 (selected `STANDARD`) and 95 px wide; height not recorded | Yes (sweep) |
| Quality segments | 59 (selected `AUTO`), 57, 47, 47 px wide; height not recorded | Yes (sweep) |
| `REBIND` / `RESET` | 66 / 58 px wide; `min-height: 24px` | Yes |
| `RESET ALL` | 94 px wide; `min-height: 24px` | Yes |
| `CLOSE` | 99 px wide; height not recorded | Yes (sweep) |
| All of the above at 90% | Only the `min-height: 24px` floors are guaranteed by CSS; the rest are **not measured** | Not verified |

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). This overlay hosts the accessibility controls, so it must satisfy the Committed rows itself and not only expose them. No Backlog row (color-vision presets, tactical-HUD screen-reader pass, audio captions, full keyboard travel) is promoted; **the Settings screen adds no caption row** (P-13).

| Committed row | How Settings satisfies it |
|---|---|
| Critical state never by color alone | Toggles: the word `ON` / `OFF`, `aria-pressed`, and the `.btn.sel` frame on `ON`. Selected segment of TEXT SCALE, DIFFICULTY and QUALITY: `aria-pressed` plus a closed 2 px frame against the others' 1 px hairline (shape weight, not hue; teal reinforces). Shipped IF-037; `focus-output.txt`; visible in `settings-100.png` and `settings-hc.png`. A grayscale check was not run (Acceptance Criteria, Non-color cues). Reserved rows: the word `FIXED` / `MOUSE`. Capture: the label `PRESS KEY...`, the `.btn.sel` frame and a printed notice. Remap refusal: printed sentence. An overridden binding is marked by its amber chip tone and an enabled `RESET`; customisation is not in the tier's critical-state list, so this is a role issue (amber), not a tier failure (Open Questions 14, 23) |
| Text legible at 1280×720; no clipping or truncation | Measured: **157 text runs, 0 under 10 px, 0 under 4.5:1** in default mode, and 0 under 4.5:1 in high contrast (`def.small`, `def.low`, `hcLow` empty; `sweep-output.txt`). Exempt per WCAG 1.4.3 and listed by the sweep: the inactive `RESET` ×17 and `RESET ALL`, and the Menu's blinking cursor behind the scrim. No `text-overflow: ellipsis` rule remains in `src/ui/ui.css`; the sweep's ellipsis and text-over-text checks found 0. Not exercised: the conflict notice, capture state, Balance row |
| Text scale 90 / 100 / 110 / 125% | Settings is itself a scale control and must hold at all four: **0 clip, truncation or text-over-text at each scale** (`clips` empty for 90, 100, 110, 125; Menu opener). Overflow scrolls inside `.set-grid` and `.set-bind-list`. Hidden-overflow cue: Open Question 17 |
| High-contrast mode | Root class remaps variables only. Brackets, ring, words survive (`settings-hc.png` shows the same layout with `HIGH CONTRAST` reading `ON`) |
| Full keyboard operability of the committed set ("pause and Settings focus trap and restore") | Trap and restore from both openers and for Balance inside Settings (P-05; shipped IF-037, `focus-output.txt` 13/13 ALL PASS, of which checks 1–6 and 13 concern Pause, Settings and Balance); every control reachable by Tab; remap by keyboard |
| Contextual accessible labels | Sliders `<CHANNEL> volume`; toggles `<NAME> // ON|OFF`; segments `Text scale 90%`, `Difficulty STANDARD`, `Render quality auto` (id, not the visible `MED`); `Rebind <action>`, `Press the new key for <action>`, `Reset <action> to its default key`, `Reset every control to its default key`; `Open the balance dashboard`; dialog `aria-label="Settings"` |
| Two-step destructive confirms | None apply. `RESET ALL` discards only preferences the player can redo (Open Question 20). Balance's Clear is Balance's |
| Reduced motion | The overlay opens with no fade when reduced motion is on (shipped IF-037; `focus-output.txt` check 13). Settings adds no idle loop |
| Consistent one-OS chrome | Shares `.hud-menu-*` with Pause. Selected state is teal, not amber (IF-037). Remaining deviations: the amber chip on an overridden binding, the panel box shadow, the shared `.btn:hover` glow, the 160 ms default fade (Open Questions 7, 23) |

### Focus order

Measured on the running build 2026-10-23 (Menu opener, defaults, from a blurred start, 37 stops). DOM order is the order below (code read); disabled buttons are not stops.

1. AUDIO: `MASTER volume`, `UI CUES volume`, `COMBAT volume`, `MUSIC volume`, `AMBIENCE volume`, `MUTE // OFF`.
2. ACCESSIBILITY: `REDUCED MOTION // OFF`, `HIGH CONTRAST // OFF`, `Text scale 90%`, `100%`, `110%`, `125%`.
3. `Difficulty STANDARD`, `Difficulty HARDENED`.
4. `Render quality auto`, `high`, `medium`, `low`.
5. `TELEMETRY: LOCAL ONLY // OFF`; then `Open the balance dashboard` when present (not present in the measured run).
6. CONTROLS: `RESET ALL` once enabled; then per row top to bottom `Rebind <action>` (then `Reset <action>` once that row is overridden): Pan forward, Pan back, Pan left, Pan right, Recenter on the squad, Zoom in, Zoom out, Select the living squad, Clear the selection, Stop and drop orders, Hold position, Hold fire, Swap weapon, Use role ability, Use med kit, Use power cell, Arm / cancel grenade.
7. `CLOSE`.

Reserved rows (`FIXED`, `MOUSE`) are not stops. Initial focus is `CLOSE`, so the first Tab wraps to `MASTER volume` and the first Shift+Tab goes to the last `Rebind`. Tab at `CLOSE` wraps to the first stop; Shift+Tab at the first stop wraps to `CLOSE`. The Pause opener's order was **not measured**; by code it is the same.

**Focus on open and close** (shipped; `focus-output.txt`, 2026-10-23):

| Moment | Focus goes to | Evidence |
|---|---|---|
| Pause opens | `RESUME` | Check 1 PASS |
| Settings opens (either opener) | `CLOSE` | Code read (`closeRef.focus()` on mount) |
| Settings closes, Menu opener | The Menu's SETTINGS button | Shipped IF-005 AC19 (code read, `settingsBtnRef`) |
| Settings closes, Pause opener | The Pause menu's SETTINGS control (`Open settings`) | Check 2 PASS (closed with Escape) |
| Balance opens | Balance's first control (`Export the telemetry records as JSON`) | Check 3 PASS (Menu opener) |
| Tab inside Balance | Stays in Balance | Check 4 PASS (8 Tab presses; full wrap not counted) |
| Balance closes | Settings' `OPEN` (`Open the balance dashboard`) | Check 5 PASS (closed with Escape) |

Not exercised: Balance from the Pause opener; Balance closed with its `CLOSE` button (same `onClose`, code read).

### Contrast

Requirement (art bible §7.5): text ≥4.5:1 composited on its panel; Ink Dim only at large sizes; Ink Faint never carries text; red text uses Red Hot; state strokes ≥3:1 and ≥2 px. Result for Settings, measured after IF-036 and IF-037: **no run fails in default or high contrast**, and no Ink Dim or Ink Faint text is used (`sweep-output.txt`). The panel background is `--bg-panel-solid` `#0a1412` (opaque), so the Menu behind cannot lower it.

| Ink on Settings | Token | Authored ratio (art bible §4.1, on Void Black `#04070a`) | Measured on this panel |
|---|---|---|---|
| Labels, descriptions, `OFF`, chips (`.dim` is now Ink) | Ink `#b8d8cf` | 13.2:1 | Not recorded per ink; every run ≥4.5:1 as rendered |
| Slider values, selected / `ON` / capturing button text and its 2 px frame | Beacon Teal `#7ef0d4` | 14.7:1 | Not recorded per ink; every run ≥4.5:1 as rendered. The `.btn.sel` frame uses the same token as its text, so it clears the 3:1 stroke floor by derivation, not by a separate measurement |
| Conflict notice | Red Hot `#ff6b55` (`.red`) | 7.2:1 | **Not measured** (not on screen in the sweep) |
| High-contrast mode | Ink remaps to `#e2f6ee` (`src/index.css`) | — | Every run ≥4.5:1 (`hcLow` empty) |

The authored ratios are against Void Black, not this panel, and are not restated as panel figures. **Not measured**: the red conflict notice and its 1 px `rgba(224,75,60,0.5)` frame (the words carry the refusal, so the frame is not a state stroke), the capture-state button, the Balance row.

Screen-reader considerations:

- The dialog is labeled `Settings` and is `aria-modal`; the Pause wrapper and the Menu wrapper both set it.
- Toggle names carry state (`MUTE // OFF`) and `aria-pressed` carries it again; P-13 requires both.
- The segment groups have no group role or label; each segment's name carries its context.
- The notice and the capture start are **not** live regions (no role or `aria-live` in `Settings.tsx`); P-13 says capture announces. Open Question 8.
- Disabled `RESET` buttons are not stops and print no reason (Open Question 14).
- Screen-reader output was not exercised in the sweep (README "Not exercised").

Color roles (art bible §4.2, Interface Rule 4): Ledger Amber is money and spend authorization only (the `.btn.amber` CSS comment says the same); selection and live state are teal; red is danger. Pressed segments, `ON` toggles and the capturing button now use `.btn.sel` (teal), IF-037. **As built** overridden key chips still use the amber chip tone (`Chip tone="amber"`, `Settings.tsx`). Open Question 23.

---

## Localization Considerations

Scope: English only. No localization system or plan exists in the GDDs; every string here is a literal in `src/ui/Settings.tsx`, plus labels owned by `game/bindings.ts` and `game/quality.ts`. The rule file `.claude/rules/ui-code.md` (gamepad, a localization system) is out of step with ADR-0017 and the project, the same flag as `world-network.md` Open Question 13. The test is 40% expansion (English → German / French). Rule for all rows: expanded text wraps or scrolls; it never clips, truncates or shrinks type (Interface Rule 6).

**How the limits were derived.** Box widths are the `w` values in `sweep-settings.json` `def.textBoxes` (1280×720, 100%, Menu opener). Assumption: advance per character = 0.62 em including letter-spacing, so 6.2 px at 10 px and 7.44 px at 12 px. Limit = width ÷ advance, rounded down. **The assumption is optimistic for this panel**: the CSS tracking is 0.08–0.14 em, and `settings-100.png` shows `Silences every synthesized voice` (32 chars) filling 218 px, which is ≈0.68 em. Real limits are about 9% lower than the table. The 125% column uses the same box width except for the segmented rows, whose description box shrinks because the buttons grow (read from `settings-125.png`, approximate). Above the limit a run wraps; it never clips.

| Element | Box at 1280 | Size | Max chars / line (100% / 125%) | Longest English text | Risk at +40% |
|---|---|---|---|---|---|
| Slider label | 84 px | 10 px | 13 / 10 | `AMBIENCE` (8) | Medium: ~11 wraps at 125% |
| Slider value | 34 px | 10 px | 5 / 4 | `100` (3) | Low |
| Toggle name | 218–281 px | 10 px | 35–45 / 28–36 | `TELEMETRY: LOCAL ONLY` (21) in 281 px | Low (~29 fits) |
| Toggle description | 218–281 px | 10 px | 35–45 / 28–36 | `Logs mission records on this terminal; nothing is transmitted` (61, 2 lines) | Medium: 3 lines |
| TEXT SCALE name / description | 124 px (≈85 at 125%) | 10 px | 20 / 11 | `TEXT SCALE` (10); description 47 chars, 3 lines at 100% (matches the screenshot), 6 at 125% | **HIGH PRIORITY**. Name wraps to two lines at 125% in English already |
| THREAT PROFILE description | 158 px | 10 px | 25 / ≈15 | 108 chars: 5–6 lines at 100% (screenshot shows 6), ~8 at 125% | **HIGH PRIORITY**. +40% is ~151 chars, 8–10 lines; the row grows and pushes QUALITY and DATA further below the first view |
| QUALITY description | 133 px | 10 px | 21 / ≈13 | `AUTO probes the renderer and steps down under load` (50), 3 lines | **HIGH PRIORITY**. Wraps to 4–5 |
| Segment label (button is content-sized) | 95 px per Difficulty button, 97 when selected (≈77 px of text) | 12 px | 10 | `STANDARD`, `HARDENED` (8) | **HIGH PRIORITY**. +40% is 11 chars: each button grows ≈22 px and takes the same from the description box beside it |
| Toggle button | 71 px (`min-width` 52) | 12 px | 8 | `OFF` (3) | Low |
| Binding action label | 190 px | 10 px | 30 / 24 | `Select the living squad` (23) | Medium. The screenshot wraps it at 125% although 23 ≤ 24, consistent with the 0.68 em caveat. +40% (32) wraps at 100% |
| Binding keys column | 150 px (flex-wrap) | 10 px | 24 / 19 per chip row | `BACKSPACE` chip 83 px; `SPACE` + `ESC` 95 px | Low for default keys. Rebound keys without a `CODE_LABEL` entry print the raw code (e.g. `BracketLeft`, 11 chars; Open Question 12) |
| `REBIND` + `RESET` | 66 + 6 + 58 = 130 of 150 px | 10 px | 6 and 5 chars | `REBIND`, `RESET` | **HIGH PRIORITY**. Only ~20 px of slack: +40% (8 and 7) overflows the fixed 150 px column. `PRESS KEY...` (12) is estimated to exceed the ~86 px left beside `RESET` (not measured, Open Question 2) |
| `FIXED` / `MOUSE` chip | 53 px | 10 px | 8 | `FIXED`, `MOUSE` (5) | Low (right-aligned in the 150 px column) |
| Instruction note | 510 px | 10 px | 82 / 66 | 118 chars: 2 lines at 100% (screenshot 2), 3 at 125% (screenshot 3) | Medium (3–4 lines) |
| Conflict notice | ≈494 px (510 less padding) | 10 px | 79 / 63 | Worst English ≈50 (`BACKSPACE IS CLAIMED BY: ARM / CANCEL GRENADE` is 45) | Medium: wraps at 125% (not measured) |
| Section heading | 364 / 506 px | 10 px | 58 / 47 | `ACCESSIBILITY` (13) | Low |
| `RESET ALL` | 94 px | 10 px | 15 | `RESET ALL` (9) | Medium (~13) |
| Panel status text | 184 px, row has free width | 10 px | one line | `STORED ON THIS TERMINAL` (23); proposed `NOT STORED // THIS SESSION ONLY` (31) | Low |
| `CLOSE` | 99 px | 10.5 px | 15 | `CLOSE` (5) | Low |
| Action labels, key names, difficulty / quality names | — | — | — | Authored in `bindings.ts` / `quality.ts` | Translatable. Printed key names come from `KeyboardEvent.code` (physical position, US names): `W` on a French layout prints for the physical `Z` key. Not a text-length issue; Open Question 12 |

Numbers and formats: volumes print as integers 0–100 (no separator); scale prints as an integer with `%`; nothing in this overlay is locale-formatted.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. Run each from **both** openers (Menu and Pause) unless stated; only the Menu opener has measured evidence.

**Performance / responsiveness**
- [ ] **Response.** Activating any toggle or segment, or moving a slider, updates its printed state and its effect (root class, mixer level, or the live binding table) before the next painted frame, with no Apply step. No numeric open-time budget exists for this overlay; the Interface GDD forbids inventing one (Open Question 25). The criterion gains the number when one is set.
- [ ] **Open and close.** With REDUCED MOTION `ON`, the overlay is fully shown in the first painted frame after activation (no fade). With it `OFF`, the overlay is fully opaque within 150 ms of activation. Closing removes it in one frame in both modes. (As built the second check fails by 10 ms: Open Question 7.)

**Core purpose**
- [ ] **Persistence.** Set Master 60, UI CUES 30, MUTE `ON`, TEXT SCALE 110%, HIGH CONTRAST `ON`, REDUCED MOTION `ON`, HARDENED, QUALITY `LOW`, TELEMETRY `ON`, and rebind Stop to a free key. Reload: every value matches. Confirm New Operation on the Menu: every value still matches.
- [ ] **Mute keeps levels.** With Master 60 and UI CUES 30, MUTE `ON` silences every voice; `OFF` restores Master 60 and UI CUES 30.
- [ ] **Channel scope.** With every slider at 100, UI CUES 0 silences the button click while music, ambience and combat sounds still play; Master 0 silences all four. Each other channel at 0 silences only its own sounds.
- [ ] **Remap, accepted.** Rebind Stop and drop orders to a free key (for example J): the row shows `J`, `RESET` is enabled, the Pause menu table and the in-mission handler use `J`, and the old key does nothing.
- [ ] **Remap, refused.** During capture, pressing a key another action holds shows `<KEY> IS CLAIMED BY: <ACTION>` and changes nothing; Space shows `SPACE IS CLAIMED BY: PAUSE MENU`; Tab shows `THAT KEY CANNOT BE BOUND`; capture stays on in all three.
- [ ] **Reserved rows.** Pause menu, Select that operative (1–4) and Zoom (wheel) show `FIXED` or `MOUSE` and have no `REBIND`.
- [ ] **Reset.** `RESET` restores one action; `RESET ALL` restores every action and is then disabled; both end capture.
- [ ] **Difficulty and Quality wording from Pause.** While a mission is live, the Quality row reads `Applies from the next mission` and the Difficulty row says its change applies from the next deploy.

**Navigation**
- [ ] **Escape order.** With capture on, Esc cancels capture and Settings stays open; a second Esc closes Settings. With Balance open, Esc closes Balance and Settings stays. From Pause, Esc closes Settings and the Pause menu is still showing with the mission frozen.
- [ ] **Focus trap and restore.** On open, focus is on `CLOSE`. Tab and Shift+Tab never leave the overlay (37 stops at defaults, ending at `CLOSE`). On close, by `CLOSE` or Escape, focus is on the SETTINGS control that opened it, from both openers; opening Pause itself still puts focus on `RESUME`.
- [ ] **Balance focus.** With at least one telemetry record, `OPEN` moves focus to a control inside Balance; repeated Tab and Shift+Tab never leave Balance; Escape or Balance's `CLOSE` returns to Settings with focus on `OPEN`.
- [ ] **No pause leak.** From Pause, pressing Space on a focused slider or button does not toggle Pause, and binding a key does not toggle Pause.

**Empty / error states**
- [ ] **Storage refused.** With writes to `localStorage` refused, every setting still takes effect for the session and the head no longer reads `STORED ON THIS TERMINAL` (it reads the failure copy chosen under Open Question 6).
- [ ] **Unreadable blob.** With a corrupt stored blob, Settings opens with all defaults and the campaign is unaffected.
- [ ] **Balance entry.** `BALANCE DATA` is present only when the retained log has at least one record, with TELEMETRY on or off.

**Accessibility and layout** (per Standard tier)
- [ ] **Layout.** At 1280×720 and text scale 90, 100, 110 and 125%, no text is clipped or cut by an ellipsis, no text line is drawn over another, no box overlaps another, nothing scrolls sideways, and every control is reachable by scrolling. This passed from the Menu at all four scales (sweep, 0 clips); from Pause it is untested.
- [ ] **Text and contrast.** Every text run is at least 10 px and 4.5:1 in default and high contrast. Exempt: disabled controls only (the `RESET` buttons and `RESET ALL` while every binding is at its default), per WCAG 1.4.3.
- [ ] **Hit targets.** At 1280×720 and 100%, every pointer target is at least 24×24 CSS px (measure the element box).
- [ ] **Non-color cues.** In grayscale, a tester can tell the pressed segment of TEXT SCALE, DIFFICULTY and QUALITY from the others (it has the heavier 2 px closed frame), and an `ON` toggle from an `OFF` one (word and frame). No selected, `ON` or capturing control is amber. A tester can also tell an overridden binding from a default one (as built the non-color cue is its enabled, undimmed `RESET`; Open Questions 14, 23).
- [ ] **Labels.** Every control has the accessible name listed in the Accessibility table.

---

## Open Questions

Items marked **As-built delta** record where the shipped overlay (`Settings.tsx`, `PauseMenu.tsx`, `Balance.tsx`, `modalFocus.ts`, `ui.css`, `settingsStore.ts`, `bindings.ts`, read 2026-10-23 after IF-037) differs from this spec. They are inputs to implementation stories, not defects: no Committed tier row fails on them unless stated, and none was filed as a bug. Closed rows keep their text for the record, as in `design/ux/world-network.md`. "Code read" means read in source and not run.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **Settings opened from Pause was not measured** for layout, Tab order, clips, targets or contrast. The component is shared, so the result is expected to match; that is an inference. Focus from Pause *was* exercised (`focus-output.txt` checks 1–2) | qa-lead | Open |
| 2 | **Not measured**: the capture state (`PRESS KEY...` against ~86 px beside `RESET`), the conflict notice (fit at 125%, text contrast, frame stroke), Balance row present, hit-target heights at 90%, per-ink ratios on this panel, windows below 1280×720, screen-reader output, a grayscale check of the selected cues | qa-lead | Open |
| 3 | **As-built delta, selected state was amber and color-only.** Pressed segments, `ON` toggles and the capturing button used `.btn.amber`; Ledger Amber is money only and the pressed segment had no non-color cue. **Fixed by IF-037**: they use `.btn.sel`, a closed 2 px teal frame with teal ink (`ui.css`; `focus-output.txt` check 6). The overridden key chip, which IF-037 did not change, moves to Open Question 23 | ui-programmer / art-director | Closed 2026-10-23 (code: IF-037) |
| 4 | **As-built delta, focus return from Pause.** `PauseMenu.tsx` focused `RESUME` when Settings closed; spec says the invoking SETTINGS control (P-05). **Fixed by IF-037**: closing Settings refocuses SETTINGS; opening Pause still focuses `RESUME` (`focus-output.txt` checks 1–2) | ui-programmer | Closed 2026-10-23 (code: IF-037) |
| 5 | **Balance flow.** Focus was lost on Balance open and close and Tab was not trapped. **Fixed by IF-037**: `BalancePanel` uses `useModalFocus` (focus in, Tab trapped), Escape still peels Balance through Settings, and closing refocuses `OPEN` (`focus-output.txt` checks 3–5, Menu opener). **Still open**: Balance has no UX spec of its own (its layout, the win-rate no-data marker, Export, Clear); Balance from the Pause opener was not exercised. Balance opened from the Debrief has no Escape handler (`useModalFocus` is called without `onEscape`), which is the Debrief spec's Open Question 13, not this spec's | ux-designer | Open (Balance spec) |
| 6 | **Storage failure is silent.** `persist` swallows write errors and `browserStorage()` returns null when `localStorage` throws; the head keeps reading `STORED ON THIS TERMINAL`. Spec position: it must not claim storage; proposed copy `NOT STORED // THIS SESSION ONLY` as a persistent inline label (P-19). Copy, channel (label vs toast) and the store signal that reports failure are the owner's call | owner / ui-programmer | Open |
| 7 | **As-built delta, overlay chrome.** (a) Reduced motion: the fade is now stopped (`.hud-menu-wrap` in the `s-reduce-motion` list, IF-037; `focus-output.txt` check 13), **closed**. (b) Still open: `.hud-menu-panel` has a `0 0 70px` box shadow (P-05 and art bible §7.1 forbid one); with reduced motion off, `.hud-menu-wrap` runs `fade-in 0.16s`, 10 ms over the 150 ms frame snap and not the "instant open and close" of `main-menu.md`; the shared `.btn:hover` adds a 12 px glow although hover is not a state (Standard controls table). These touch the shared Pause chrome | ui-programmer / art-director | Open (b); (a) closed 2026-10-23 |
| 8 | **As-built delta, announcements.** Neither the capture start nor the conflict notice is a live region; only the focused button's `aria-label` changes. P-13 requires capture to announce. The conflict notice is also a library gap (a **New** component): add a pattern before implementation invents behavior | ux-designer / ui-programmer | Open |
| 9 | **As-built delta, Difficulty row has no timing note.** The mission reads Difficulty once at deploy (`freezeDeploy`), so a change from Pause cannot reach the running mission; only the Quality row says "from the next mission". Also the row copy lists patrols, confirm, shots, sight and windows but not `extraCivilians: 6` (`DIFFICULTY_FX.hardened`); whether the omission is intended is not stated anywhere I read | game-designer / ui-programmer | Open |
| 10 | **Rebinding replaces every key of an action with the one captured** (`setBindingOverride(id, [code])`): Pan forward `W` + `Up` becomes one key, and there is no way to add a second. Decide: single-key rebind (as built) or add / replace per key | owner | Open |
| 11 | **Silent override reversion (code read, not run).** `RESET` on one action restores its defaults; if another action was rebound onto one of those keys, `sanitizeOverrides` drops that other override without telling the player. The same filter drops colliding overrides on load. Decide: block, warn, or accept | owner / systems-designer | Open |
| 12 | **Key labels.** Codes without a `CODE_LABEL` entry print raw (`BracketLeft`, `Semicolon`); labels follow the physical US-layout position, not the keycap on other layouts (`keyLabel`, `codeOf`). Not measured on a non-US layout | ui-programmer | Open |
| 13 | **Held key (suspected, code read, not run).** The capture listener does not test `e.repeat`; holding Enter on `REBIND` may bind Enter. Enter is not reserved | ui-programmer | Open |
| 14 | **P-03 and disabled resets.** 17 `RESET` buttons and `RESET ALL` are disabled at defaults with no printed reason, and are not tab stops. Options: absent until a binding changes; one shared line; record a library exemption. A modified binding is otherwise told only by its chip tone and the enabled `RESET` | ux-designer | Open |
| 15 | **No audible preview on the volume sliders** (`VolumeRow` has no `uiClick`). Whether a cue on release is wanted is an Audio decision; the Audio GDD names no such cue | audio owner | Open |
| 16 | **Section order.** Spec keeps AUDIO first. Recommendation to consider: lead with ACCESSIBILITY, since a player who cannot read the screen needs it first. It is already in the first view at all four scales | owner | Open |
| 17 | **Hidden overflow.** At 1280×720 and 100% PERFORMANCE and DATA (Quality, Telemetry, Balance) are below the first view with no visible cue in the captures; the grid is a plain scroller, not `ScrollBox`, so P-15's fade is absent, and the right column nests a second scroller. Options: P-15 fade, collapse the descriptions, or shorten the Difficulty copy | ux-designer / ui-programmer | Open |
| 18 | **Quality AUTO is overwritten by the governor.** After a sustained-slow mission `setQuality(next)` stores a concrete tier; Settings then shows that tier pressed, not AUTO, and the only notice is a Comm-log line in the mission. Whether AUTO is ever restored, and whether Settings should say a tier was set automatically, is not stated anywhere I read | owner / performance-analyst | Open |
| 19 | **Pause opener and Abort.** Opening Settings swaps the Pause panel but `PauseMenu` stays mounted, so (code read, not run) a pending Abort arm and its 3 s timer are not cancelled by opening Settings. Whether a lapse while Settings is open is acceptable was not checked | ux-designer | Open (minor) |
| 20 | **`RESET ALL` has no confirm.** P-13 specifies a reset-all and no confirm; it discards only the player's own remaps. Left single-step; flagging because remaps cost effort to redo | owner | Open (minor) |
| 21 | **No journey map and no Settings playtest on record**; arrivals come from code and GDD | game-designer | Open (non-blocking) |
| 22 | **Rule file out of step.** `.claude/rules/ui-code.md` asks for gamepad support and a localization system; ADR-0017 forbids gamepad and no localization system exists. This spec follows ADR-0017 and `project.yaml`, as `world-network.md` and `main-menu.md` do | owner | Open (rule file) |
| 23 | **As-built delta, overridden key chip is amber.** `Settings.tsx` prints an overridden binding's chips with `Chip tone="amber"`; Ledger Amber is money only (Interface Rule 4; art bible §4.2). A customised binding is not on the tier's critical-state list, and its enabled `RESET` is a non-color cue, so this is a color-role deviation, not a tier failure. Which tone (and whether a printed token such as a mark beside the chip) marks a customised binding is art-director's call; the spec only rules out amber | art-director / ui-programmer | Open |
| 24 | **Library follow-up, P-13 selected cue.** P-13 specifies `aria-pressed` for the active segment and says amber does not mark `ON`, but names no visual selected cue. This spec adopts the shipped `.btn.sel` (closed 2 px teal frame, teal ink) for the selected segment, an `ON` toggle and the capturing `REBIND`. Add that line to P-13 so other specs do not invent a second cue. This spec does not edit the library | ux-designer | Open (library) |
| 25 | **No numeric open-time budget.** The Interface GDD (Rule 1, AC preamble) forbids inventing product performance budgets, so the Response criterion has no number. Whoever sets UI response budgets adds it | performance-analyst | Open |
