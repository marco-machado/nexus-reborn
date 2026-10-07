# Interaction Pattern Library

> **Status**: Approved (/ux-review design/ux/interaction-patterns.md 2026-10-05)
> **Author**: user + ux-designer
> **Last Updated**: 2026-10-05
> **Platform Target**: Desktop browser, keyboard and mouse only, 1280×720 minimum. No gamepad. No touch.
> **Template**: Interaction Pattern Library
> **Sources**: `design/gdd/interface.md` Rules 4–19; UI Requirements of all eight system GDDs; `design/art/art-bible.md` §7.1–7.5; `design/accessibility-requirements.md` (Standard tier); `src/ui/PauseMenu.tsx`; `src/ui/WorldMap.tsx`; `src/ui/Nav.tsx`

---

## Overview

One terminal, one interaction language (Interface Rule 4). Input is keyboard + mouse only; the layout floor is 1280×720 at text scale 90–125%; reduced motion and high contrast are honored (`accessibility-requirements.md`, Standard tier). Patterns here bind every screen spec. Critical state never rides on color alone. Motion is print / scan / tick / blink only (art bible §7.4). No new hex: palette changes touch `src/index.css` and `src/ui/tokens.ts` only.

Contrast floors are inherited, not restated as new numbers: body and readout text ≥4.5:1 composited over the worst-case scene; state strokes ≥3:1 and ≥2 px (art bible §7.5). Hover is not a state on any pattern: no hover glow, no scale-pop (art bible §7.4). Backlog rows (full keyboard travel, color-vision presets, captions, tactical HUD screen reader) are not promoted by a pattern.

---

## Pattern Catalog

| # | Pattern | Category | Status |
|---|---|---|---|
| P-01 | Two-step arm-to-confirm | Modal / Destructive | Batch 1 |
| P-02 | Single-step spend authorization | Input | Batch 1 |
| P-03 | Disabled control + reason | Feedback | Batch 1 |
| P-04 | Selection / focus marker | Feedback | Batch 1 |
| P-05 | Modal overlay with focus trap | Overlay | Batch 1 |
| P-06 | Nav tab (locked, selected, idle) | Navigation | Batch 1 |
| P-07 | Order confirmation | Feedback | Batch 2 |
| P-08 | Targeting reticle | Input | Batch 2 |
| P-09 | Squad card | Data Display | Batch 2 |
| P-10 | Minimap | Data Display / Input | Batch 2 |
| P-11 | Toast and advisory | Feedback | Batch 2 |
| P-12 | Ability slot with cooldown | Data Display | Batch 2 |
| P-13 | Settings controls | Input | Batch 3 |
| P-14 | Data readout (chip and value) | Data Display | Batch 3 |
| P-15 | Scrollable panel | Layout | Batch 3 |
| P-16 | Comm log / Feed line | Feedback | Batch 3 |
| P-17 | Timeline: Live vs Review | Navigation / Input | Batch 3 |
| P-18 | Result banner and invoice row | Data Display | Batch 3 |
| P-19 | Filing status | Feedback | Batch 3 |
| P-20 | Strategic clock transport | Input | 2026-10-05 |
| P-21 | Campaign banner | Feedback | 2026-10-05 |
| P-22 | Research remaining readout | Data Display | 2026-10-05 |
| P-23 | First-visit overlay | Overlay | 2026-10-05 |

---

## Standard controls

These are specified here so a screen spec does not invent them. Unused controls stay unused.

| Control | Disposition |
|---|---|
| Button, primary | Not a numbered pattern. The primary face is the first action in the stack. Menu marks it with `<< LABEL >>`. Focus is P-04. Press is the art-bible §7.4 ink-step, ≤150 ms: no glow, no scale, no hue change. |
| Button, secondary | Same face rules, lower weight: the label without the primary chevrons. Not a second visual language. |
| Button, destructive | P-01. Not a red button. The armed label and the double-line frame carry the state. |
| Toggle | P-13. |
| Slider | P-13. Volume only. Text scale is not a slider. |
| Dropdown / select | Not used. Discrete choices are P-13 segmented controls. Do not add a dropdown. |
| List row | Not a separate pattern. A selectable row uses P-04. A running record uses P-16. Empty is that pattern's empty token, not a new list chrome. |
| Grid item | Not used. No inventory grid. A Research node is not a grid cell. |
| Modal | P-05. |
| Dialog / confirm | P-01. When it sits over a frozen surface, the overlay is P-05. No generic dialog. |
| Toast | P-11. |
| Tooltip | Not used. Identification does not depend on hover text (art bible). A `title` attribute does not satisfy a visible reason (P-03, P-06). |
| Progress bar | Not used as a stored meter. Research `progress` was struck. A render-time fill beside a remaining numeral is P-22, not a progress-bar pattern. |
| Input field | Not used. Remap is capture (P-13), not a text field. No player-name field. |
| Tab bar | P-06. Exactly four Screens. |
| Scroll | P-15. |

**Button states.** Default: label and hairline frame. Hover: not a state. Focus: P-04 corner brackets. Pressed: ink-step ≤150 ms, then the action. Disabled: P-03, or absent when the control must not exist (Continue with no valid save). Error: not a button face — a failed write is P-11 plus P-19.

**Button accessibility.** Pointer, Enter, or Space. Accessible name matches the visible label. Armed state is in that name (P-01). Contrast inherits §7.5.

**Button implementation.** Do not import a hover brightness or a scale tween. `src/ui/index.tsx` is the Menu reference; press motion is the §7.4 ink-step, not a new component spec.

---

## Patterns

### P-01 Two-step arm-to-confirm

**Category**: Modal / Destructive
**Used In**: Pause → Abort; Menu → New Operation; Balance → Clear

**Description**: Irreversible discard or erase takes two activations. The first arms; the second, while armed, confirms immediately. Timeout disarms without discarding.

**Specification**:
- First activation arms: the control relabels and shows a non-color armed state (label text plus a ≥2 px double-line frame; red may reinforce, never carries alone).
- Second activation while armed confirms immediately.
- Timeout disarms; the next activation only re-arms. No timing pressure is placed on the player. Expiry cancels the arm; it does not confirm.
- Escape disarms; it never confirms. Same outcome as timeout. See Escape.
- Library default arming window is 3 real seconds (the Abort value, Interface Rule 12). Screen specs may not shorten it. New Operation and Balance Clear use this same expiry. Living spec §12 names the three seconds for Abort; this library applies that expiry to every P-01 use so chrome does not invent a second duration.
- While armed, a reserved message slot prints a hint. The slot is not a toast and not P-11. The screen spec owns the sentence. The sentence must name the window and the consequence. Menu copy is `PRESS AGAIN WITHIN 3 S TO ERASE` or `PRESS AGAIN WITHIN 3 S TO START`. Abort and Balance Clear use the same slot; they may not omit it. Disarm clears the slot and is silent.

**States**: Idle, Armed, Confirmed. Hover is not a state. Focus is P-04. A discard that must not be offered is absent, not a disabled P-01. A failed write after confirm is P-19 and, when it needs immediate attention, P-11 — not a third confirm step.

**When to Use**: irreversible discard or erase.
**When NOT to Use**: spends (see P-02).

**Accessibility**: Both steps activate on pointer, Enter, or Space. The armed state is in the control's accessible label. The hint slot is a polite live region. The window is expiry-as-cancel, not a timed challenge. Contrast inherits §7.5.

**Implementation notes**: Schedule the 3 real seconds from the first activation. A frozen tactical clock does not extend it. Do not add a Cancel button; timeout and Escape are the disarm. Menu hint copy stays in `design/ux/main-menu.md`.

### P-02 Single-step spend authorization

**Category**: Input
**Used In**: Research Authorize; Assembly Hire; World Network Influence spends

**Description**: One activation spends. There is deliberately no second confirm: the listed cost prints against header Credits at the moment of the click, and the consequence is bounded and recoverable by play. A confirm would turn the command into a browse (Research UI Requirements).

**Specification**:
- An enabled spend activates on pointer, Enter, or Space. Selecting or focusing the node, candidate, or sector does not spend.
- Cost prints beside the header Credits value at the point of action; amber may mark authorization. The printed cost carries the state.
- No cancel, stop, or undo control exists after a successful spend.
- Copy has three surfaces. Do not collapse them into one refusal sentence.
  1. **Inspect** of a non-authorizable target: a state explanation only. Never print "Credits did not change". Never imply a charge was attempted. Research inspect names the locked state and every unmet prerequisite, or lab not idle, or already researched.
  2. **Refused attempt**: the actual cause plus "Credits did not change". Research eligibility order is missing prerequisites, then lab not idle, then already researched. Affordability still wins the control (P-03); eligibility text still displays beneath it.
  3. **Mismatch undo** (Research only): an inline error in the project detail. It says Credits did not change and the lab was not occupied, replaces the composed state text, persists until the next authorize attempt or state change, and stays visible even if Authorize is disabled. No reason enum. Hire and Influence do not invent this sentence.
- Exact Research substrings stay in `design/gdd/research.md`. This pattern names which surface gets which sentence.

**States**: Ready, Inspect-only, Refused attempt, Mismatch undo. Hover is not a state. Focus on the spend control is P-04 and is distinct from selecting the node. Disabled is P-03. Error is the mismatch-undo surface, not a dimmed button.

**When to Use**: spends with bounded, play-recoverable consequence.
**When NOT to Use**: destructive discard (use P-01).

**Accessibility**: The enabled control is a button. Pointer, Enter, and Space all spend. The accessible name includes the action and the printed cost. Refusal and inspect text are adjacent words, not color. Reason text meets the 4.5:1 floor (P-03).

**Implementation notes**: Interface AC 19. Do not add a cancel, stop, or abort-project method. A formula-oracle query of remaining is not a paint (P-22).

### P-03 Disabled control + reason

**Category**: Feedback
**Used In**: Deploy; Hire; Research Authorize; Influence spends; Brief nav

**Description**: A disabled control always prints its reason adjacent to it. Dimming alone never explains a refusal (art bible §7.5 #9).

**Specification**:
- Reason names the actual cause: unaffordable, cooldown, no target, full roster, mass over limit (overage named), lab not idle, already researched, missing contract, etc.
- When several causes apply, affordability wins the control and eligibility text still displays beneath it (Research UI Requirements).
- An action not yet available reads as "later", not "broken" (World Network: Influence at opening 0).
- Reason text meets the 4.5:1 body-text floor.
- The reason is visible without focusing the control. It is static text beside the control, not a tooltip and not only an accessible description.

**States**: Disabled plus visible reason. Hover is not a state. Focus: whether the control stays in tab order is not decided here. Full keyboard travel across every panel is backlog, so this pattern does not add a tab stop and does not forbid one a screen spec already has. Error is the reason text itself.

**When to Use**: any control that can be refused.
**When NOT to Use**: controls that are absent by rule (locked generated offers do not appear at all — World Network Rule 10). Continue with no valid save is absent, not disabled.

**Accessibility**: The word carries the refusal. Dimming may reinforce. Contrast of the reason is ≥4.5:1. Do not require the player to focus the control to learn why it refused.

**Implementation notes**: A `title` attribute or hover tip does not satisfy the visible reason. Brief's shipped lock tip is not this pattern; P-06 requires the word on the tab.

### P-04 Selection / focus marker

**Category**: Feedback
**Used In**: squad cards; operatives; Research nodes; list rows; Timeline

**Description**: Selection and keyboard focus are distinct, non-color-backed markers.

**Specification**:
- Selection: closed double ring; multi-select distinguishable from single-select; legible at 24 px figure scale.
- Focus: corner brackets. State-bearing strokes ≥2 px (or double-line) and ≥3:1 against the panel; Ink Faint is banned from state strokes.
- Selection breathes slowly; reduced-motion fallback is the static closed double ring.
- Research nodes select on pointer, Enter, or Space. That selection does not spend. Authorize is a separate control (P-02) and has its own Enter/Space.
- Timeline moves with arrows, Home, and End.
- A nav tab does not use this ring. Selected vs idle tabs are P-06.

**States**: Unselected, Selected, Focused. Hover is not a state. No hover glow. Disabled and error are not markers; they are P-03.

**When to Use**: any selectable or focusable element inside a screen.
**When NOT to Use**: hover-only feedback. Nav tab selection (P-06).

**Accessibility**: Selection and focus are shape, not hue. Signal Cyan may reinforce selection. Ledger Amber does not reinforce focus. Focus order is owned by the screen spec; this pattern is only the marker. High contrast keeps the brackets and the ring.

**Implementation notes**: Do not draw the ring with Ink Faint. Reduced motion freezes the breathe on the closed double ring.

### P-05 Modal overlay with focus trap

**Category**: Overlay
**Used In**: Pause; Settings; Balance; Settings nested inside Pause

**Description**: An overlay that takes focus, freezes what must freeze, and restores state on close.

**Specification**:
- Focus is trapped while open and restored to the invoking control on close; nested Settings returns to Pause.
- In a mission the sim and camera freeze; the feed stays visible behind a translucent panel. No drop shadow or glow separates panel from feed (art bible §7.1).
- Pause opens with Space or Escape. Escape is consumed by remap capture, then by the top overlay, before it toggles Pause. See Escape.
- Tutorial toasts are not modal: they never block input or pause the sim. The first-visit overlay (P-23) is not this pattern.

**States**: Closed, Open, Nested (Settings inside Pause). Hover is not a state. Focus is trapped. Error is not an overlay state; a failed write uses P-19. Disabled does not apply to the overlay itself.

**When to Use**: pause, settings, opt-in dashboards.
**When NOT to Use**: advisories and toasts. Teaching that must leave the clock usable (P-23).

**Accessibility**: Focus is trapped while open and restored on close. Tab and Shift+Tab stay inside. Escape closes the top overlay only (Escape section). Contextual labels on the controls inside.

**Implementation notes**: `src/ui/PauseMenu.tsx` and `src/ui/Settings.tsx`. Balance over Settings closes Balance and leaves Settings. Do not add a drop shadow.

### P-06 Nav tab (locked, selected, idle)

**Category**: Navigation
**Used In**: shared four-Screen nav (Brief locked until a contract is selected)

**Description**: The tab bar for the four Screens. A tab that cannot be entered shows why. The active Screen is distinguishable without color.

**Specification**:
- Nav holds exactly World Network, Research, Brief, Assembly. Menu, Mission, and Debrief are not Screens and carry no nav.
- **Idle unlocked**: the Screen name. No lock. No selected frame.
- **Selected**: the Screen name plus a closed frame, ≥2 px. Not P-04's selection ring. `aria-current="page"`. Teal may reinforce; the frame carries the state. A larger glyph may reinforce; it is not the sole cue.
- **Locked**: lock glyph plus the word `LOCKED` plus the unlock condition, as visible text on or adjacent to the tab. Never merely dimmed (see P-03). Never a `title` tooltip or a hover tip. Brief's condition is `NO CONTRACT SELECTED`.
- Pointer activates an unlocked tab that is not already selected. A locked tab does not navigate.
- Keyboard travel across the nav is backlog. Do not invent arrow-key tab switching in this pattern.

**States**: Idle, Selected, Locked. Hover is not a state. Focus, when a screen spec places it here, is P-04 brackets in addition to the tab state, not instead of the lock word. Error does not apply.

**When to Use**: the four-Screen nav, including any Screen gated on state.
**When NOT to Use**: hiding a gated Screen entirely. Using a tooltip as the lock reason.

**Accessibility**: Locked accessible name is `LABEL // LOCKED // <condition>`. Selected exposes `aria-current="page"`. The lock word and the selected frame are visible without hover. Contrast inherits §7.5.

**Implementation notes**: `src/ui/Nav.tsx`. The shipped Brief lock is a hover tip plus an accessible name. That tip does not satisfy this pattern; the word `LOCKED` and the condition must be visible. Do not treat Menu, Mission, or Debrief as tabs.

### P-07 Order confirmation

**Category**: Feedback
**Used In**: Mission — Move, Attack, Stop, Hold Ground / Hold Fire

**Description**: An issued order is acknowledged at once and stays legible until it resolves. Sources: art bible §7.5 #2–3; Interface Rule 15 (mouse).

**Specification**:
- Click mark + destination ring + dashed route, acknowledged ≤100 ms from input.
- Issued-not-yet-arrived is visibly distinct from arrived. Queued orders carry an ordinal mark (tick or sequence bracket).
- Right click on ground = Move; right click on a hostile = Attack.
- No entrance animation on order marks: final state first (§7.5). Never color-only.
- Stop, Hold Ground, and Hold Fire also acknowledge. Their keys are X, H, and C (Interface Rule 15). Do not invent keyboard Move or Attack.

**States**: Issued, Arrived, Queued. Hover is not a state. Focus does not apply to a ground order. Disabled and error are Tactical verb validity, not this chrome.

**When to Use**: any order the director issues to an operative.
**When NOT to Use**: deciding whether a verb is valid — Tactical owns verb validity.

**Accessibility**: Shape and the ordinal mark carry issued, arrived, and queued. Color may reinforce. Move and Attack are pointer orders. Stop and the two stances also have keys.

**Implementation notes**: Final state first. No entrance tween. Do not add a keyboard path for Move or Attack.

### P-08 Targeting reticle

**Category**: Input
**Used In**: Mission — explicit Attack target; grenade targeting (G arms / cancels)

**Description**: Targeting states use distinct reticle shapes so the two modes can never be confused.

**Specification**:
- The explicit-target reticle and the grenade reticle are different shapes, both non-color-backed, strokes ≥2 px (§7.5 #4).
- G arms and cancels grenade targeting and does not open Pause (Interface Rule 15). Escape does not cancel targeting in place: it opens Pause, and entering Pause clears targeting. See Escape.
- First frame ≤100 ms after the state change; no print animation on targeting.

**States**: None, Explicit target, Grenade armed. Hover is not a state. Focus does not apply. No-target and out-of-stock are P-03 on the grenade control, not a third reticle.

**When to Use**: any mode where the next click picks a target.
**When NOT to Use**: plain Move orders (see P-07).

**Accessibility**: Two shapes, strokes ≥2 px, not color alone. G is the grenade key and is remappable; the printed key label comes from the remap table.

**Implementation notes**: Entering Pause clears targeting (`setPaused` sets `grenadeTargeting: false`). Do not give Escape a second meaning that cancels targeting in place.

### P-09 Squad card

**Category**: Data Display
**Used In**: Mission HUD squad panel

**Description**: One card per operative that carries health, magazine, selection and stance without hover.

**Specification**:
- Health pips plus a numeral; magazine count; selection marker (P-04).
- Stance bits (Hold Ground / Hold Fire) are a persistent glance marker readable at 24 px without hover, carried by shape, word or pip — never a new hue (§7.5 #5).
- Injured and KIA are pip + glyph + text; the KIA skull uses solid treatment (§7.3). A status glyph is never the sole carrier.
- Slots 1–4 select and are reserved from remap. Double-click centers the camera on that operative.
- A dead slot is not selected. An empty Assembly bay is not this card.

**States**: Living, Injured, KIA, Selected. Hover is not a state. Focus is P-04 when the card is keyboard-focused. Disabled does not apply. Error does not apply; KIA is a status, not an error chrome.

**When to Use**: per-operative live status.
**When NOT to Use**: dossier detail on Assembly (that is a record surface, not a live card).

**Accessibility**: Health is pips plus a numeral. Injury and KIA are pip, glyph, and text. Stance is readable at 24 px without hover. Slots 1–4 are the keyboard select. Double-click center is pointer-only; `F` recenters the living squad. A single-operative center key is not added here (HUD open item).

**Implementation notes**: Do not introduce a hue for stance. Solid treatment is reserved for the KIA skull and other identification-critical marks.

### P-10 Minimap

**Category**: Data Display / Input
**Used In**: Mission HUD

**Description**: A tactical instrument that shares the camera yaw. Source: Interface Rule 11.

**Specification**:
- Up = screen up. Three zoom levels; magnitudes are Tactical-owned and not named here.
- Click or drag steers the camera.
- Shows buildings, roads, Extraction and checkpoints, objective pulse, CorpSec patrol / suspicious / combat with cones, civilians, operatives and the camera footprint.
- Difficulty and Quality never strip this information. Suspicious and combat markers are separable at a glance at 720p by shape, not by color alone (§7.5 #6).

**States**: The map is always present in a live mission. Hover is not a state. Zoom is a discrete level, not a hover reveal. Error does not apply. Disabled does not apply; Hardened does not disable it.

**When to Use**: the one live map of the District.
**When NOT to Use**: the Brief map (the District on the Brief screen is a separate surface).

**Accessibility**: Suspicious vs combat is shape, not hue. Keyboard camera keys cover drag-steer (W A S D and zoom keys). Click and drag remain pointer. Contrast of strokes inherits §7.5.

**Implementation notes**: Do not invent zoom metres. Do not hide cones, patrols, civilians, or the objective pulse for Difficulty or Quality.

### P-11 Toast and advisory

**Category**: Feedback
**Used In**: tutorial toasts; one-shot advisories; alert toast; non-Alert failure toast

**Description**: Non-modal messages over the HUD or, for a write failure, over the next Screen. Sources: Interface Rule 13; art bible §2.8, §7.5; `src/ui/TutorialToasts.tsx`.

**Specification**:
- Toasts are `role="status"` and dismissible. They never block input and never pause the sim or the strategic clock.
- Tutorial toasts name the current bindings from the remap table and advance on action or dismiss; Skip Tutorial marks every step seen.
- An advisory fires at most once per campaign, is labeled `ADVISORY // <title>`, and its dismiss control has an accessible label.
- Alert toast: red may reinforce, prints in one frame, holds ≥3 s, then collapses. The words carry the alarm. Two concurrent alarms escalate the edge glow rather than adding boxes.
- A non-Alert failure toast may use that same hold and `role="status"` without becoming an Alert and without `role="alert"`. Words carry the state. It is never the only channel: when a record exists, P-16 prints the same fact. Menu erase-failure is this case (`ERASE FAILED // SAVE NOT ERASED` on the World Network, not on the Menu).
- A toast is never the sole channel for combat Alert: HUD Alert state and the minimap persist (§7.5 #7).

**States**: Hidden, Tutorial, Advisory, Alert, Failure. Hover is not a state. Focus may rest on the dismiss control; the toast does not trap focus. Disabled does not apply. Error is the failure toast, not a modal.

**When to Use**: teaching, one-shot advice, alarm onset, a write failure that must be read immediately.
**When NOT to Use**: anything that needs a decision (use a modal, P-05). A P-01 armed hint. A running record (P-16).

**Accessibility**: `role="status"`, not `role="alert"`. Dismiss control has an accessible label (`DISMISS` when the screen spec does not name another). Words carry Alert and failure; red may reinforce. Screen-reader pass on the tactical HUD stays backlog. These labels are the committed set.

**Implementation notes**: `src/ui/TutorialToasts.tsx` for tutorial and advisory. Do not pause the sim. Do not stack a second alarm box. Do not play the alert sting for a failure toast (Sound Standards).

### P-12 Ability slot with cooldown

**Category**: Data Display
**Used In**: Mission HUD ability bar and item counts

**Description**: A slot that shows readiness and cost without using color for either. Source: art bible §7.3.

**Specification**:
- Cooldown is an ink sweep across the glyph plus a numeral; cost is amber text beside it. Color never encodes cooldown or cost.
- Shows the key label read from the remap table (Q = role ability). Item counts are numerals.
- Icons are outline by default; solid is reserved for identification-critical marks.
- Reduced motion: the ink sweep falls back to the numeral alone. Confirmed by approved `design/ux/hud.md` E11.

**States**: Ready, Cooling, Empty (count 0, with a P-03 reason when the control can be refused). Hover is not a state. Focus is P-04 if the slot is a button. Error does not apply.

**When to Use**: role abilities and consumable items.
**When NOT to Use**: spends against Credits (see P-02).

**Accessibility**: The numeral carries cooldown and the count. The key label is text from the remap table. Color never encodes either. Reduced motion keeps the numeral.

**Implementation notes**: Do not animate the sweep under reduced motion. Do not store cooldown as a color.

### P-13 Settings controls

**Category**: Input
**Used In**: Settings overlay

**Description**: The four control shapes Settings uses. Sources: Interface Rules 14–15; `src/ui/Settings.tsx`.

**Specification**:
- Slider: range input 0–100 in steps of 5 with the numeric value printed beside it; accessible label `<channel> volume`.
- Toggle: button with `aria-pressed`, an ON/OFF text label and accessible label `<name> // ON|OFF`. The word carries the state. Ledger Amber does not mark ON.
- Segmented choice (text scale, Difficulty, Quality): `aria-pressed` on the active option, the value printed on it. Text scale is the discrete set 90 / 100 / 110 / 125%, never a continuous slider.
- Remap: a capture mode that Escape cancels; a reset control per binding and a reset-all control. Pause, slots 1–4 and the mouse are reserved and shown as reserved.
- Mute preserves chosen levels and restores them on unmute (Audio UI Requirements). The toggle word carries mute. Do not add a caption row; captions are backlog.

**States**: Each control has its value printed. Hover is not a state. Focus is P-04. Reserved is shown as reserved, not as an error. Escape during capture cancels capture; that is not an error. Disabled does not replace reserved.

**When to Use**: any preference that persists in the settings slot.
**When NOT to Use**: campaign actions (those are spends or discards — P-02, P-01). A dropdown. A text field.

**Accessibility**: `aria-pressed` on toggles and the active segment. Slider exposes the numeric value. Remap capture announces capture, and Escape cancels it without closing Settings. Labels are contextual (`<channel> volume`, `<name> // ON|OFF`).

**Implementation notes**: `src/ui/Settings.tsx`. Escape during capture is step 1 of the Escape section. Text scale is never a slider.

### P-14 Data readout (chip and value)

**Category**: Data Display
**Used In**: shared header; Mission HUD; sector readout; Debrief invoice

**Description**: A number is the content. Sources: art bible §7.2, §7.5.

**Specification**:
- Monospace, tabular, right-aligned, zero-padded to fixed width; value larger than its label; unit suffix (`CR`, `m`, `s`, `%`) dim and same size. `k` / `M` abbreviations are banned.
- A chip's tone follows art bible §4.2: Signal Cyan informs, Ledger Amber is price only and carries `CR` when it is money, Alarm Red alarms, Nominal Green is terminal-chrome confirmation only and never the tactical feed, dim is empty. A chip always adds a text token. Never the tone alone.
- Live values print in their semantic hue; settled records print in Print White (`PRINT_WHITE`, `src/ui/tokens.ts`).
- Readouts ≥12 px at 100% scale, absolute floor 10 px for tertiary labels; everything scales with text scale.
- When the owner has not supplied a value, print a dim em dash, or the empty token the screen spec names. Never fabricate a 0. A 0 the owner supplied prints as 0. Research remaining before `sync` is not this dash — the label is absent (P-22).

**States**: Value, Empty (owner supplied nothing). Hover is not a state. Focus does not apply unless the screen spec makes the chip a control. Error is a missing owner value, shown as the dash, not as a thrown UI error.

**When to Use**: any figure the player reads.
**When NOT to Use**: emphasis by weight or italics — promote the ink tier instead (§7.2). A save-status sentence (that is P-19, not a numeric chip).

**Accessibility**: Tone plus a text token. Size floors above. Contrast inherits §7.5. The dash is text, not a blank.

**Implementation notes**: `PRINT_WHITE` in `src/ui/tokens.ts` for settled records. No `k` or `M`. Do not paint a placeholder 0.

### P-15 Scrollable panel

**Category**: Layout
**Used In**: every panel that can overflow (Comm log, lists, Settings)

**Description**: Overflow scrolls; panels never compress. Sources: Interface Rule 6, AC 1; `ScrollBox` in `src/ui/bits.tsx`.

**Specification**:
- Holds at 1280×720 and text scales 90 / 100 / 110 / 125%.
- One shared affordance: a scrollbar that shows on hover, and a fade over the cut edge while content lies below. The fade is `aria-hidden` and decorative; scrolled overflow stays reachable.
- The fade is always on while content lies below, so overflow is not a hover-only cue. The scrollbar-on-hover is the only hover affordance, and it is not a glow.

**States**: Fits, Overflow. Hover reveals the scrollbar only. Focus: controls inside use P-04. The panel does not require its own tab stop. Keyboard scrolling of every panel is backlog. Error does not apply.

**When to Use**: any panel whose content can exceed its box.
**When NOT to Use**: shrinking type or compressing a panel to fit.

**Accessibility**: The fade is `aria-hidden`. Overflow stays reachable by pointer (Interface AC 1). Full keyboard travel across every panel stays backlog. Do not hide overflow until hover.

**Implementation notes**: `ScrollBox` in `src/ui/bits.tsx`. Smaller-than-minimum windows scroll; they do not compress panels.

### P-16 Comm log / Feed line

**Category**: Feedback
**Used In**: Mission HUD Comm log; World Network Feed

**Description**: Lines print in reading order in a scrollable log; never a toast. Sources: Interface AC 14; `src/ui/Hud.tsx`.

**Specification**:
- Scrollable (P-15). An empty channel prints `-- CHANNEL OPEN --`.
- A weather front writes a line; Tactical emits, HUD prints.
- The log is never the sole channel for a critical event (P-11; §7.5 #7).
- A write-failure record uses the same line rules when the screen has a Feed. The toast is the immediate channel; the line is the record.

**States**: Empty (`-- CHANNEL OPEN --`), Lines present. Hover is not a state. Focus does not apply to a line unless the screen spec makes that line a control (World Network Feed focus is that spec's job; the line format is this pattern). Error is not a separate chrome; a failure line is a line.

**When to Use**: a running record of events.
**When NOT to Use**: anything needing immediate attention (use P-11 or a marker).

**Accessibility**: Empty state is the printed token, not a blank panel. New lines are not required to be a live region; P-11 is the immediate channel. Contrast inherits §7.5.

**Implementation notes**: `src/ui/Hud.tsx` prints the mission log. Tactical emits weather lines; the HUD does not invent them.

### P-17 Timeline: Live vs Review

**Category**: Navigation / Input
**Used In**: World Network Timeline

**Description**: A view over history, not a clock. Sources: World Network Rule 14; ADR-0014; Interface Rule 14; Interface AC 27.

**Specification**:
- Live and Review are distinguishable by words plus shape, not by hue.
- **Live**: the word `LIVE` plus a closed dot. The dot is not the sole carrier. Reduced motion: the dot is static; the word stays.
- **Review**: the word `REVIEW` plus the pin offset or pin time, and a return control whose visible label includes `GO LIVE`. No live dot. Hue may reinforce; the words carry the state.
- This is the shipped TimeCode form. Do not replace it with a color on the clock alone.
- Scrubbing writes only the review pin. The Scan's four numbers stay live in Review; Feed, TimeCode and the handle follow the pin.
- Keyboard: arrows, Home, End. Home selects the oldest point in the window. End returns Live. Left/Right move within the window. Review does not mutate live state.
- Review is never presented as a third clock.

**States**: Live, Review. Hover is not a state. Focus on the timeline control is P-04. Disabled does not apply. Error does not apply.

**When to Use**: reading past Feed state.
**When NOT to Use**: advancing time (strategic time advances only by Screen ticking or a win debrief).

**Accessibility**: Accessible value text is `LIVE` or the pin time. The return control's name includes REVIEWING and RETURN TO LIVE. Arrows, Home, and End are the committed keyboard set (Interface AC 19). The words `LIVE` and `REVIEW` are visible. Contrast inherits §7.5.

**Implementation notes**: `src/ui/WorldMap.tsx` TimeCode and Timeline. ADR-0014. Do not animate the live dot under reduced motion. Do not invent a second Live/Review glyph.

### P-18 Result banner and invoice row

**Category**: Data Display
**Used In**: Mission result banner; Debrief

**Description**: The result and the invoice are records. Sources: Interface Rule 18, ACs 15–16, 24; art bible §7.4.

**Specification**:
- Result banner appears while still in Mission, inside an `aria-live="polite"` region; no minimum visible duration (Debrief follows 2.5 s of Tactical elapsed time).
- Invoice: all five priced money rows always print, zeros included, on Loss and quiet replay too. Stored Reward is labeled separately from net payout. Quiet banner reads `REPLAY // FEE ALREADY COLLECTED`.
- Rows print top-to-bottom in reading order (record surface, print allowed); money counts in amber; reduced-motion fallback is a static right-aligned `CR` column.

**States**: No result, Banner showing, Invoice (filed state is P-19). Hover is not a state. Focus does not apply. Error does not hide a zero row. Abort builds no invoice.

**When to Use**: end-of-mission outcome and pricing.
**When NOT to Use**: live counts (Collateral is a count in the HUD; CR appears only at Debrief).

**Accessibility**: `aria-live="polite"` on the banner. The title is text (`CONTRACT FULFILLED`, `SQUAD ELIMINATED`, or the quiet banner). Zeros print. Amber may mark money; the `CR` column carries it. Reduced motion keeps the static column.

**Implementation notes**: Do not add a minimum visible duration or a celebration sting. Do not drop a zero row. Do not add a Tax money row.

### P-19 Filing status

**Category**: Feedback
**Used In**: Debrief; Menu; New Operation

**Description**: Durability is shown, never assumed. Sources: Interface Rule 18, ACs 21–23; Persistence UI Requirements.

**Specification**:
- Debrief invoice reads as unfiled until Persistence reports a successful next-Screen autosave (World Network return or Brief Replay). The success signal comes from Persistence, not navigation.
- After that success, the invoice no longer reads as unfiled. The filed label is owned by the Debrief spec. It must not be the unfiled sentence, and it must not be color alone. This library does not invent the word.
- A failed write visibly reads as failure — never as filed or as a durable erase — and the invoice stays unfiled.
- Menu distinguishes never-started from invalid/unreadable with a visible reason; Continue is absent in both, present only for a valid blob.
- Exact Menu copy stays in the Menu spec. Exact failure copy stays in the screen spec that hosts it.

**States**: Unfiled, Filed (Persistence has reported success), Failed write (still unfiled), Never-started, Invalid/unreadable, Valid. Hover is not a state. Focus does not apply to the status line. Continue absent is the control cue for the two bad Menu states, not a disabled button.

**When to Use**: any surface whose result depends on a durable write.
**When NOT to Use**: adding a save verb — none exists.

**Accessibility**: Each state is a visible sentence or the absence of Continue, not a hue. Red may reinforce failure. The filed state, once the Debrief spec names it, still needs a word or the removal of the unfiled sentence — not a color swap alone.

**Implementation notes**: Do not treat navigation as the success signal. Do not add a save verb or a Debrief autosave. Menu copy is in `design/ux/main-menu.md`.

### P-20 Strategic clock transport

**Category**: Input
**Used In**: the four Screens

**Description**: Pause and speed for the strategic clock. World Network owns the clock. Interface presents it. This is not mission pause.

**Specification**:
- Speeds are 1×, 2×, 4×, 8×. No other step.
- The readout prints the word `PAUSED` or `nX`. Red may mark paused. The word carries running. Ledger Amber does not mark a running clock.
- Pause control: play and pause shapes, `aria-pressed`, accessible name `RESUME STRATEGIC CLOCK` or `PAUSE STRATEGIC CLOCK`.
- Speed controls: four buttons labeled `1X` `2X` `4X` `8X`, `aria-pressed` on the active speed while not paused.
- Setting a speed while paused may select that speed. The readout stays `PAUSED` until resume.
- Menu, Mission, and Debrief do not run this clock. Mission pause is P-05 and does not change this speed.
- Review (P-17) does not advance this clock.
- Pointer activates. Do not invent a new key binding. Full keyboard travel is backlog.

**States**: Running at 1/2/4/8, Paused. Hover is not a state. Focus is P-04 when the control is focused. Disabled does not apply. Error does not apply.

**When to Use**: strategic time on the four Screens.
**When NOT to Use**: mission pause. A third clock. Review scrubbing.

**Accessibility**: The word `PAUSED` or `nX` is visible. Shapes distinguish pause from play. `aria-pressed` and the accessible names above. No new unbound key.

**Implementation notes**: `SPEEDS` in `src/state/worldStore.ts` is `[1, 2, 4, 8]`. `TimeControl` in `src/ui/WorldMap.tsx` is the reference. P-23 teaches this control. Do not add a tick sound per second.

### P-21 Campaign banner

**Category**: Feedback
**Used In**: World Network

**Description**: Campaign-complete and campaign-failed are records on the World Network, not toasts and not modals. Source: World Network UI Requirements; ADR-0020.

**Specification**:
- Complete: the word `CAMPAIGN COMPLETE` plus a sigil. Does not lock contracts. The network stays active.
- Failed: the word `CAMPAIGN FAILED` plus a sigil. The word carries the state; the sigil is not the sole carrier and is not color alone. Select is a no-op. The banner is the reason; do not add a second error dialog.
- `role="status"`. Not P-11. Not P-05.
- If both flags are set, Persistence treats the blob as invalid. This pattern does not draw a combined banner. Menu P-19 covers that blob.
- Secondary sentences stay in the World Network spec. The shipped lines may be used until that spec replaces them. The required words above may not be dropped.

**States**: None, Complete, Failed. Hover is not a state. Focus does not apply. Disabled does not apply. Error is the failed banner, not a toast.

**When to Use**: the two campaign-end records on the World Network.
**When NOT to Use**: a mission result (P-18). A write failure (P-11 plus P-16).

**Accessibility**: The words are visible. The sigil is `aria-hidden`. `role="status"`. Contrast inherits §7.5. No color-only distinction between complete and failed.

**Implementation notes**: `src/ui/WorldMap.tsx`. ADR-0020. No completion sting (Sound Standards). Do not lock contracts on complete.

### P-22 Research remaining readout

**Category**: Data Display
**Used In**: Research

**Description**: Remaining time is a numeral painted only after `sync`. It is not a stored progress fraction. Source: Research UI Requirements.

**Specification**:
- Paint only after `sync(t)` for that same `t` (`lastSyncT === t`). Before that, no remaining label exists. Do not print 0 as a placeholder.
- Active and `t < endT`: paint `endT − t` strategic seconds, rounded up to whole display seconds, labeled remaining, not the catalog duration. A positive remainder never paints 0. No clamp.
- Not active, or `t ≥ endT`: no countdown. Formula `none` is not a painted 0.
- `progress` is not a Research output. Do not store or export a 0–1 fraction. A fill computed at render from the painted remaining is allowed. The numeral is required beside it. The fill is never the sole carrier, and it is not a progress-bar pattern.
- Paint format (raw seconds vs `H:MM:SS`) is the Research screen spec's decision. The 50,400-second magnitude must be readable at 1280×720. Do not invent the format in code ahead of that spec.
- Figure rules are P-14: monospace, tabular, no `k` / `M`.

**States**: Absent (before sync, or not active), Remaining numeral. Hover is not a state. Focus does not apply. Error is a missing label before sync, not a 0.

**When to Use**: an active Research project after `sync`.
**When NOT to Use**: a stored progress API. A bar without the numeral. Painting the formula oracle before `sync`.

**Accessibility**: The numeral is the content. A fill may reinforce. Contrast and size follow P-14. Do not convey remaining by fill alone.

**Implementation notes**: `remaining()` in `src/game/research.ts`. A pre-sync oracle query is allowed and is not a screen paint. Do not revive `runProgress`.

### P-23 First-visit overlay

**Category**: Overlay
**Used In**: World Network, first visit

**Description**: One-shot teaching for the desk, not a mission toast and not a modal. Source: World Network UI Requirements; Interface AC 27.

**Specification**:
- Once per campaign. Teaches Pause and clock speed as control over strategic time, opening Influence as later rather than broken, and Nexus-held Tax eligibility as distinct from a printed Tax figure. Also names the panel groups and the Research tab. It does not say "click the marker."
- Does not spend, does not arm a confirm, and does not pause strategic time by being open. The clock control (P-20) stays usable.
- Does not trap focus. It is not P-05. It is not P-11 (that pattern is the HUD toast and the failure toast).
- Dismisses on an explicit dismiss or when the player uses the clock control it is teaching. It does not return.

**States**: Unseen, Showing, Dismissed. Hover is not a state. Focus is not trapped. Disabled does not apply. Error does not apply.

**When to Use**: the first World Network visit.
**When NOT to Use**: a mission tutorial (P-11). A confirm (P-01). A modal that freezes the clock (P-05).

**Accessibility**: Teaching sentences are visible text, not color. Dismiss has an accessible label. The overlay does not block the clock control. Captions stay backlog.

**Implementation notes**: Do not pause strategic time while it is open. Do not spend. Copy of the three lessons stays in the World Network spec; the lessons themselves are required.

---

## Animation Standards

Source: art bible §7.4–§7.5. Banned: bounce, overshoot, scale-pop, slide-and-fade panels, hover glow, parallax, spring, looping shimmer on idle chrome. Easing is linear or one hard ease-out. Nothing in the UI exceeds 500 ms except a tick that is tracking a real value.

| Motion | Duration | Easing | Applies to | Reduced motion |
|---|---|---|---|---|
| Urgent state, first frame | ≤100 ms from input or state change; final state first, no entrance | none | Order marks (P-07), reticles (P-08), selection, Alert, red toast and failure toast (P-11) | Same. No decoration follows |
| Bracket snap, focus ink-step | ≤150 ms | linear or one ease-out | Focus brackets (P-04), button press, panel frame drawing on | Static brackets. No travel |
| Print, record surfaces only | ~110 ms per row (`index * 110 ms`); row fade ≤120 ms; panel frame ≤150 ms | linear or one ease-out | Invoice rows (P-18), list and document panes | Static right-aligned column. Rows are present, not staggered |
| Scan | One pass, ≤400 ms, once per open. Never an idle loop | linear | Dossier, World Network Scan | Sweep absent. Content is already there |
| Tick | Discrete steps matched to the value. Never an eased tween toward a number the sim does not hold | linear | Money (`CR`), remaining time (P-22) | Static figure. The number stays |
| Blink / breathe | Alarm ~2 Hz. Selection breathes slow. Threat markers use their own cadence. Live dot uses its own cadence. Only permitted loops | n/a | Alert, selection (P-04), threat marks, Live dot (P-17) | Alarm → static hatch + edge glow + printed word. Selection → closed double ring. Threat → static marker. Live → static dot + word `LIVE` |
| Arm window | 3 real seconds. Not a motion | n/a | P-01 | Same window. Armed state is the double-line frame plus label, not a pulse |
| Alert toast hold | Prints in one frame, holds ≥3 s, then collapses | none | P-11 Alert and non-Alert failure toast | Same hold. No collapse animation required |

Print never runs on urgent state. At most one idle motion on Menu, Research, Assembly, and Debrief. In a mission, at most ~6 chrome readouts animate at once, and alarm is the only red-cadence motion.

## Sound Standards

Audio owns the clips and the mix. This table only names the event, the existing voice, and the bus. No new cue.

| Pattern event | Voice | Bus | Do not |
|---|---|---|---|
| Selection or issued order (P-04, P-07) | Short acknowledgement click | UI | No VO |
| Button / overlay activate, Pause open (P-05), clock transport (P-20) | UI click | UI | No tick per strategic second |
| Spend succeeds (P-02) | Confirmation | UI | No second confirm sting |
| Objective complete | Objective-complete | UI | — |
| Interaction progress | Interaction progress | UI | — |
| Disabled control activated (P-03) | None required | — | A disabled control need not emit an activation event |
| Abort arms (P-01) | UI click | UI | No mission-end sting on arm. Disarm is silent, including the hint slot clearing |
| Abort confirms | None specified here | — | No Debrief sting. Landing is not this table |
| Result banner, invoice, quiet replay (P-18) | None | — | No celebration sting. Ticks are silent, or one soft tick per ledger group — never per digit |
| Campaign banner (P-21) | None | — | No completion sting |
| Failure toast (P-11, not Alert) | None required | — | No alert sting |
| Alert toast onset (P-11) | One percussive red beat, plus the alert sting only when Tactical already requests it | Combat for the sting | Not every Alert rise emits a sting. Toast is never the only channel |
| Alert 1–3 held | Tension drone, follows HUD Alert | Combat | Do not stack a second layer |
| Weapon, reload, blast, ability, hit, death | Existing combat voices | Combat | UI stays under weapon reports in the reference mix |

Mute and a zero channel silence the bus. No cue bypasses that. Captions stay backlog.

## Escape

One key, consumed by the innermost owner. It never confirms a spend or a discard.

1. **Remap capture (P-13).** Escape cancels capture and does not close Settings. Shipped in `src/ui/Settings.tsx`.
2. **Top overlay only.** Balance over Settings: Escape closes Balance and leaves Settings. Settings inside Pause: Escape returns to Pause. Shipped for Balance; P-05 and Interface AC 18 for the nest.
3. **Armed confirm (P-01).** Escape disarms and does not discard. The hint slot clears. On Menu there is no parent overlay, so the screen stays. On Pause, Escape still closes the overlay (step 4); closing it disarms Abort and does not confirm. The 3 s timeout remains the other disarm. This is the Menu spec's rule, not current Menu code.
4. **Pause.** If nothing above consumed it, Space or Escape opens Pause. Escape also closes Pause from anywhere, including when a dialog button is focused. Space does not: a focused dialog button keeps Space. Shipped in `src/scene/Input.tsx`.
5. **Grenade targeting (P-08).** G arms and cancels, and does not open Pause. Escape does not cancel targeting in place. It opens Pause, and entering Pause clears targeting (`setPaused` already sets `grenadeTargeting: false`). No second Escape meaning.

## Gaps & Patterns Needed

Interface GDD interaction behaviors are covered by P-01–P-23 or by the Standard controls table. Layout of screens that do not have a UX spec yet is not a missing pattern.

Not yet their own patterns, and not required before the screen spec that uses them: Scan marker / Focus selection on World Network; Brief map (the District); Assembly bays and dossier; candidate market; Research node graph. Those specs must use P-03, P-04, P-14, and P-15 where they apply, and must add a pattern here before inventing a behavior this library does not have.

---

## Closed questions

1. **P-03 tab order.** Closed as a library decision, 2026-10-05. The reason is visible without focus. Whether a disabled control stays in tab order is backlog (full keyboard travel), not an open design question for this file.
2. **P-01 window.** Closed 2026-10-05. Every P-01 use gets the 3 real-second expiry. Interface Rule 12 now applies that Abort value to New Operation and telemetry Clear. Screen specs may not shorten it.
3. **No `design/player-journey.md`.** Patterns were derived from GDD and art-bible rules, not journey phases. Not a blocker for this library.
4. **Grenade targeting.** Closed 2026-09-30. Escape does not cancel grenade targeting in place. See Escape.
5. **P-12 reduced motion.** Closed 2026-10-05. Numeral alone, no ink sweep. Approved `design/ux/hud.md` E11.
6. **Filed label.** Closed as a library decision, 2026-10-05. After Persistence reports success, the invoice no longer reads unfiled. The Debrief spec owns the word. This file does not invent it (P-19).
7. **Live / Review form.** Closed 2026-10-05. Word `LIVE` plus a closed dot; word `REVIEW` plus pin offset and `GO LIVE`. See P-17.
