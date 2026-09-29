# Interaction Pattern Library

> **Status**: In Design (batches 1–3 written; all Interface GDD surfaces covered; pending `/ux-review`)
> **Author**: user + ux-designer
> **Last Updated**: 2026-09-29
> **Template**: Interaction Pattern Library
> **Sources**: `design/gdd/interface.md` Rules 4–19; UI Requirements of all eight system GDDs; `design/art/art-bible.md` §7.1–7.5; `design/accessibility-requirements.md` (Standard tier); `src/ui/PauseMenu.tsx`

---

## Overview

One terminal, one interaction language (Interface Rule 4). Input is keyboard + mouse only; the layout floor is 1280×720 at text scale 90–125%; reduced motion and high contrast are honored (`accessibility-requirements.md`, Standard tier). Patterns here bind every screen spec. Critical state never rides on color alone. Motion is print / scan / tick / blink only (art bible §7.4). No new hex: palette changes touch `src/index.css` and `src/ui/tokens.ts` only.

---

## Pattern Catalog

| # | Pattern | Category | Status |
|---|---|---|---|
| P-01 | Two-step arm-to-confirm | Modal / Destructive | Batch 1 |
| P-02 | Single-step spend authorization | Input | Batch 1 |
| P-03 | Disabled control + reason | Feedback | Batch 1 |
| P-04 | Selection / focus marker | Feedback | Batch 1 |
| P-05 | Modal overlay with focus trap | Overlay | Batch 1 |
| P-06 | Locked nav tab | Navigation | Batch 1 |
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

---

## Patterns

### P-01 Two-step arm-to-confirm

**Category**: Modal / Destructive
**Used In**: Pause → Abort; Menu → New Operation; Balance → Clear

**Description**: Irreversible discard or erase takes two activations. The first arms; the second, while armed, confirms immediately. Timeout disarms without discarding.

**Specification**:
- First activation arms: the control relabels and shows a non-color armed state (label text plus a ≥2 px double-line frame; red may reinforce, never carries alone).
- Second activation while armed confirms immediately.
- Timeout disarms; the next activation only re-arms. No timing pressure is placed on the player.
- Library default arming window is 3 real seconds (the Abort value, Interface Rule 12). Screen specs may not shorten it.
- Accessibility: keyboard-activatable both steps; armed state announced in the control's accessible label.

**When to Use**: irreversible discard or erase.
**When NOT to Use**: spends (see P-02).

### P-02 Single-step spend authorization

**Category**: Input
**Used In**: Research Authorize; Assembly Hire; World Network Influence spends

**Description**: One activation spends. There is deliberately no second confirm: the listed cost prints against header Credits at the moment of the click, and the consequence is bounded and recoverable by play. A confirm would turn the command into a browse (Research UI Requirements).

**Specification**:
- Cost prints beside the header Credits value at the point of action; amber marks authorization.
- A refused attempt states the actual cause plus "Credits did not change" (Research copy contract).
- No cancel, stop or undo control exists after a spend.

**When to Use**: spends with bounded, play-recoverable consequence.
**When NOT to Use**: destructive discard (use P-01).

### P-03 Disabled control + reason

**Category**: Feedback
**Used In**: Deploy; Hire; Research Authorize; Influence spends; Brief nav

**Description**: A disabled control always prints its reason adjacent to it. Dimming alone never explains a refusal (art bible §7.5 #9).

**Specification**:
- Reason names the actual cause: unaffordable, cooldown, no target, full roster, mass over limit (overage named), lab not idle, already researched, etc.
- When several causes apply, affordability wins the control and eligibility text still displays beneath it (Research UI Requirements).
- An action not yet available reads as "later", not "broken" (World Network: Influence at opening 0).
- Reason text meets the 4.5:1 body-text floor.

**When to Use**: any control that can be refused.
**When NOT to Use**: controls that are absent by rule (locked generated offers do not appear at all — World Network Rule 10).

### P-04 Selection / focus marker

**Category**: Feedback
**Used In**: squad cards; operatives; Research nodes; list rows; Timeline

**Description**: Selection and keyboard focus are distinct, non-color-backed markers.

**Specification**:
- Selection: closed double ring; multi-select distinguishable from single-select; legible at 24 px figure scale.
- Focus: corner brackets. State-bearing strokes ≥2 px (or double-line) and ≥3:1 against the panel; Ink Faint is banned from state strokes.
- Selection breathes slowly; reduced-motion fallback is the static closed double ring.
- Research nodes select on pointer, Enter or Space; Authorize is a separate control (P-02). Timeline moves with arrows, Home and End.

**When to Use**: any selectable or focusable element.
**When NOT to Use**: hover-only feedback — no hover glow (art bible §7.4).

### P-05 Modal overlay with focus trap

**Category**: Overlay
**Used In**: Pause; Settings; Balance; Settings nested inside Pause

**Description**: An overlay that takes focus, freezes what must freeze, and restores state on close.

**Specification**:
- Focus is trapped while open and restored to the invoking control on close; nested Settings returns to Pause.
- In a mission the sim and camera freeze; the feed stays visible behind a translucent panel. No drop shadow or glow separates panel from feed (art bible §7.1).
- Pause opens with Space or Escape; Escape closes overlays.
- Tutorial toasts are not modal: they never block input or pause the sim.

**When to Use**: pause, settings, opt-in dashboards.
**When NOT to Use**: advisories and toasts.

### P-06 Locked nav tab

**Category**: Navigation
**Used In**: shared four-Screen nav (Brief locked until a contract is selected)

**Description**: A tab that cannot be entered shows why.

**Specification**:
- Lock glyph plus the word LOCKED plus the unlock condition; never merely dimmed (see P-03).
- Nav holds exactly World Network, Research, Brief, Assembly. Menu, Mission and Debrief are not Screens and carry no nav.

**When to Use**: any Screen gated on state.
**When NOT to Use**: hiding a gated Screen entirely.

### P-07 Order confirmation

**Category**: Feedback
**Used In**: Mission — Move, Attack, Stop, Hold Ground / Hold Fire

**Description**: An issued order is acknowledged at once and stays legible until it resolves. Sources: art bible §7.5 #2–3; Interface Rule 15 (mouse).

**Specification**:
- Click mark + destination ring + dashed route, acknowledged ≤100 ms from input.
- Issued-not-yet-arrived is visibly distinct from arrived. Queued orders carry an ordinal mark (tick or sequence bracket).
- Right click on ground = Move; right click on a hostile = Attack.
- No entrance animation on order marks: final state first (§7.5). Never color-only.

**When to Use**: any order the director issues to an operative.
**When NOT to Use**: deciding whether a verb is valid — Tactical owns verb validity.

### P-08 Targeting reticle

**Category**: Input
**Used In**: Mission — explicit Attack target; grenade targeting (G arms / cancels)

**Description**: Targeting states use distinct reticle shapes so the two modes can never be confused.

**Specification**:
- The explicit-target reticle and the grenade reticle are different shapes, both non-color-backed, strokes ≥2 px (§7.5 #4).
- G arms and cancels grenade targeting (Interface Rule 15). Escape is bound to Pause (`src/game/bindings.ts:96`); whether Escape also cancels targeting is Open Question 4.
- First frame ≤100 ms after the state change; no print animation on targeting.

**When to Use**: any mode where the next click picks a target.
**When NOT to Use**: plain Move orders (see P-07).

### P-09 Squad card

**Category**: Data Display
**Used In**: Mission HUD squad panel

**Description**: One card per operative that carries health, magazine, selection and stance without hover.

**Specification**:
- Health pips plus a numeral; magazine count; selection marker (P-04).
- Stance bits (Hold Ground / Hold Fire) are a persistent glance marker readable at 24 px without hover, carried by shape, word or pip — never a new hue (§7.5 #5).
- Injured and KIA are pip + glyph + text; the KIA skull uses solid treatment (§7.3). A status glyph is never the sole carrier.
- Slots 1–4 select and are reserved from remap. Double-click centers the camera on that operative.

**When to Use**: per-operative live status.
**When NOT to Use**: dossier detail on Assembly (that is a record surface, not a live card).

### P-10 Minimap

**Category**: Data Display / Input
**Used In**: Mission HUD

**Description**: A tactical instrument that shares the camera yaw. Source: Interface Rule 11.

**Specification**:
- Up = screen up. Three zoom levels; magnitudes are Tactical-owned and not named here.
- Click or drag steers the camera.
- Shows buildings, roads, Extraction and checkpoints, objective pulse, CorpSec patrol / suspicious / combat with cones, civilians, operatives and the camera footprint.
- Difficulty and Quality never strip this information. Suspicious and combat markers are separable at a glance at 720p (§7.5 #6).

**When to Use**: the one live map of the District.
**When NOT to Use**: the Brief map (the District on the Brief screen is a separate surface).

### P-11 Toast and advisory

**Category**: Feedback
**Used In**: tutorial toasts; one-shot advisories; alert toast

**Description**: Non-modal messages over the HUD. Sources: Interface Rule 13; art bible §2.8, §7.5; `src/ui/TutorialToasts.tsx`.

**Specification**:
- Toasts are `role="status"` and dismissible. They never block input and never pause the sim.
- Tutorial toasts name the current bindings from the remap table and advance on action or dismiss; Skip Tutorial marks every step seen.
- An advisory fires at most once per campaign, is labeled `ADVISORY // <title>`, and its dismiss control has an accessible label.
- Alert toast: red-leaded, prints in one frame, holds ≥3 s, then collapses. Two concurrent alarms escalate the edge glow rather than adding boxes.
- A toast is never the sole channel: HUD Alert state and the minimap persist (§7.5 #7).

**When to Use**: teaching, one-shot advice, alarm onset.
**When NOT to Use**: anything that needs a decision (use a modal, P-05).

### P-12 Ability slot with cooldown

**Category**: Data Display
**Used In**: Mission HUD ability bar and item counts

**Description**: A slot that shows readiness and cost without using color for either. Source: art bible §7.3.

**Specification**:
- Cooldown is an ink sweep across the glyph plus a numeral; cost is amber text beside it. Color never encodes cooldown or cost.
- Shows the key label read from the remap table (Q = role ability). Item counts are numerals.
- Icons are outline by default; solid is reserved for identification-critical marks.
- Reduced motion: the ink sweep falls back to the numeral alone.

**When to Use**: role abilities and consumable items.
**When NOT to Use**: spends against Credits (see P-02).

### P-13 Settings controls

**Category**: Input
**Used In**: Settings overlay

**Description**: The four control shapes Settings uses. Sources: Interface Rules 14–15; `src/ui/Settings.tsx`.

**Specification**:
- Slider: range input 0–100 in steps of 5 with the numeric value printed beside it; accessible label `<channel> volume`.
- Toggle: button with `aria-pressed`, an ON/OFF text label and accessible label `<name> // ON|OFF`. Amber may mark ON; the word carries the state.
- Segmented choice (text scale, Difficulty, Quality): `aria-pressed` on the active option, the value printed on it. Text scale is the discrete set 90 / 100 / 110 / 125%, never a continuous slider.
- Remap: a capture mode that Escape cancels; a reset control per binding and a reset-all control. Pause, slots 1–4 and the mouse are reserved and shown as reserved.

**When to Use**: any preference that persists in the settings slot.
**When NOT to Use**: campaign actions (those are spends or discards — P-02, P-01).

### P-14 Data readout (chip and value)

**Category**: Data Display
**Used In**: shared header; Mission HUD; sector readout; Debrief invoice

**Description**: A number is the content. Sources: art bible §7.2, §7.5.

**Specification**:
- Monospace, tabular, right-aligned, zero-padded to fixed width; value larger than its label; unit suffix (`CR`, `m`, `s`, `%`) dim and same size. `k` / `M` abbreviations are banned.
- A chip carries a tone (teal / amber / red / green / dim) plus a text token, never the tone alone.
- Live values print in their semantic hue; settled records print in Print White (`PRINT_WHITE`, `src/ui/tokens.ts`).
- Readouts ≥12 px at 100% scale, absolute floor 10 px for tertiary labels; everything scales with text scale.

**When to Use**: any figure the player reads.
**When NOT to Use**: emphasis by weight or italics — promote the ink tier instead (§7.2).

### P-15 Scrollable panel

**Category**: Layout
**Used In**: every panel that can overflow (Comm log, lists, Settings)

**Description**: Overflow scrolls; panels never compress. Sources: Interface Rule 6, AC 1; `ScrollBox` in `src/ui/bits.tsx`.

**Specification**:
- Holds at 1280×720 and text scales 90 / 100 / 110 / 125%.
- One shared affordance: a scrollbar that shows on hover, and a fade over the cut edge while content lies below. The fade is `aria-hidden` and decorative; scrolled overflow stays reachable.

**When to Use**: any panel whose content can exceed its box.
**When NOT to Use**: shrinking type or compressing a panel to fit.

### P-16 Comm log / Feed line

**Category**: Feedback
**Used In**: Mission HUD Comm log; World Network Feed

**Description**: Lines print in reading order in a scrollable log; never a toast. Sources: Interface AC 14; `src/ui/Hud.tsx`.

**Specification**:
- Scrollable (P-15). An empty channel prints `-- CHANNEL OPEN --`.
- A weather front writes a line; Tactical emits, HUD prints.
- The log is never the sole channel for a critical event (P-11; §7.5 #7).

**When to Use**: a running record of events.
**When NOT to Use**: anything needing immediate attention (use P-11 or a marker).

### P-17 Timeline: Live vs Review

**Category**: Navigation / Input
**Used In**: World Network Timeline

**Description**: A view over history, not a clock. Sources: World Network Rule 14; ADR-0014; Interface Rule 14.

**Specification**:
- Live and Review are distinguishable by a non-color cue (form: Open Question 7).
- Scrubbing writes only the review pin. The Scan's four numbers stay live in Review; Feed, TimeCode and the handle follow the pin.
- Keyboard: arrows, Home, End.
- Review is never presented as a third clock.

**When to Use**: reading past Feed state.
**When NOT to Use**: advancing time (strategic time advances only by Screen ticking or a win debrief).

### P-18 Result banner and invoice row

**Category**: Data Display
**Used In**: Mission result banner; Debrief

**Description**: The result and the invoice are records. Sources: Interface Rule 18, ACs 15–16, 24; art bible §7.4.

**Specification**:
- Result banner appears while still in Mission, inside an `aria-live="polite"` region; no minimum visible duration (Debrief follows 2.5 s of Tactical elapsed time).
- Invoice: all five priced money rows always print, zeros included, on Loss and quiet replay too. Stored Reward is labeled separately from net payout. Quiet banner reads `REPLAY // FEE ALREADY COLLECTED`.
- Rows print top-to-bottom in reading order (record surface, print allowed); money counts in amber; reduced-motion fallback is a static right-aligned `CR` column.

**When to Use**: end-of-mission outcome and pricing.
**When NOT to Use**: live counts (Collateral is a count in the HUD; CR appears only at Debrief).

### P-19 Filing status

**Category**: Feedback
**Used In**: Debrief; Menu; New Operation

**Description**: Durability is shown, never assumed. Sources: Interface Rule 18, ACs 21–23; Persistence UI Requirements.

**Specification**:
- Debrief invoice reads as unfiled until a successful next-Screen autosave (World Network return or Brief Replay); the success signal comes from Persistence, not navigation.
- A failed write visibly reads as failure — never as filed or as a durable erase — and the invoice stays unfiled.
- Menu distinguishes never-started from invalid/unreadable with a visible reason; Continue is absent in both, present only for a valid blob.
- Exact copy stays in the screen specs.

**When to Use**: any surface whose result depends on a durable write.
**When NOT to Use**: adding a save verb — none exists.

---

## Gaps & Patterns Needed

Not yet catalogued: none required by the current Interface GDD surfaces. Candidates that may appear in the screen specs: Scan marker / Focus selection on World Network; Brief map (the District); Assembly bays and dossier; candidate market; Research node graph; first-visit overlay. Add them when the screen spec that uses them is written.

---

## Open Questions

1. Should a disabled control (P-03) stay focusable with its reason reachable from the keyboard, or be skipped in tab order with the reason as static text? Undecided; owner: Settings / Assembly specs.
2. The 3 s window is the library default for P-01 (decided 2026-09-29). Interface Rule 12 specifies it only for Abort; New Operation and Balance Clear inherit it by this library and the Interface GDD does not yet say so.
3. No `design/player-journey.md` exists; patterns were derived from GDD/art-bible rules, not journey phases.
4. Does Escape cancel grenade targeting before it opens Pause, or does it always open Pause? The GDD is silent; owner: Mission HUD spec with Tactical.
5. P-12's reduced-motion fallback (numeral alone, no ink sweep) is inferred from art bible §7.4/§7.5 ("every motion-backed cue names its static fallback"), not stated for ability slots. Confirm in the Mission HUD spec.
6. The Interface GDD (AC 22) requires the unfiled state to change once Persistence reports a successful autosave, but does not say what it changes to. Owner: Debrief spec.
7. P-17: the non-color Live/Review cue is required (AC 27) but its form (label, glyph or both) is undecided. Owner: World Network spec.
