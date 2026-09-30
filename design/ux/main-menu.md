# UX Spec: Main Menu

> **Status**: In Design
> **Author**: user + ux-designer
> **Last Updated**: 2026-09-29
> **Journey Phase(s)**: unknown — no journey map
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at the Main Menu wanting to get back to the desk: resume their saved campaign, or start a new one, and know for certain which the game will do before committing.

The Menu is the entry surface of the secure-system fiction (not one of the four Screens). It does three jobs:

1. **Route**: Continue opens the World Network for the saved campaign; New Operation starts another Campaign.
2. **Protect**: New Operation erases the saved campaign, so it is a two-step action and never one click (Interface Rule 8, P-01).
3. **Inform**: it tells never-started apart from an unreadable or invalid save (Persistence Rule 8), so a player with a broken save is not silently treated as new.

Settings is reachable from here. Settings, Difficulty and the telemetry toggle survive New Operation.

Failure if this screen is missing or hard to use: a returning player can erase their campaign by accident, or can't tell that a corrupt save was dropped.

Sources: `design/gdd/interface.md` Rule 9 (Menu), `design/gdd/persistence-and-validation.md` Rules 7–8, P-01.

---

## Player Context on Arrival

- **First encounter**: every app launch. The Menu is `appStore.phase = 'menu'`, the initial phase (`src/state/appStore.ts:78`). A save-load reset also sets phase to menu (`src/state/save.ts:746`).
- **Immediately before**: nothing in-game on a cold start. A returning player was last on a Screen, or on a mission or Debrief that never reached a save.
- **Emotional state**: calm and unhurried. No time pressure and no strategic clock (the Menu does not run it, ADR-0001). The player is often a returner checking that their campaign is intact, so reassurance matters more than speed.
- **Voluntary**: yes. The player launched the game; no game event sends them here.
- **Journey phase**: not mapped (no `design/player-journey.md`). It is the first touchpoint of every session.
- **Audio**: nothing has played yet. Browsers block audio until the first gesture, so the first click unlocks it (Interface Rule 9).

---

## Navigation Position

This screen lives at: [app boot] → Menu (`phase = 'menu'`). It is the root. It is not one of the four Screens and does not run the strategic clock. Settings opens as a modal overlay on top of it (P-05). Alternate entry paths: none confirmed. As built, the Menu is reached only at app launch or reload.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| App launch / page reload | Initial phase | Saved campaign blob (valid, invalid, or absent), persisted Settings |
| Return from a session (pause / campaign-end / Debrief) | Not built; GDD silent | Unconfirmed → Open Question |

| Exit Destination | Trigger | Notes |
|---|---|---|
| World Network (saved campaign) | Continue (only with a valid blob) | Always opens World Network, never Brief or Assembly. A selected contract is restored but not resumed. Nothing is erased. |
| World Network (new Campaign) | New Operation, confirmed (two-step when a save exists; one step when none) | Irreversible: erases the campaign blob. Settings, Difficulty and telemetry toggle survive. |
| Settings overlay | Settings button | Not an exit; returns to the Menu with focus restored. |

No exit is reversible once confirmed. Closing the tab is the only other exit.

---

## Layout Specification

### Information Hierarchy

Decision: Continue is hidden (not disabled) when there is no valid save; the status line carries the reason.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | Primary actions: Continue (valid save only), New Operation | Always (Continue conditional) | Continue hidden without a valid save. Without Continue, New Operation is the sole primary action. |
| 2 | Save status line: `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | Always | Text, not color alone. The unreadable case is amber or red plus a text label. Never silent. |
| 3 | New Operation confirmation: armed label `CONFIRM // ERASE SAVE?` and write-failure message | After first press / on erase failure | Failure text persists until dismissed or the next action. |
| 4 | Settings | Always | Secondary action. |
| 5 | Identity: NEXUS REBORN wordmark, tagline | Always | Not a decision input. |
| 6 | Fiction chrome: boot lines, UTC clock, footer | Always | Decorative. Never carries state. Hidden from assistive tech (aria-hidden or non-focusable). |

Discoverable, not shown up front: none. The Menu has nothing hidden behind interaction except the armed and failure states.

### Layout Zones

Decision: Arrangement B — centered stack with a fixed message slot.

| Zone | Contents | Notes |
|---|---|---|
| Z1 Header (top) | Boot lines (left), UTC clock (right) | Decorative chrome, aria-hidden. Clock ticks 1 Hz, so it is not a live region. |
| Z2 Identity (center, upper) | Rule, NEXUS REBORN wordmark, tagline, rule | Wordmark is the h1. |
| Z3 Save status (center) | One status line: `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | Sits directly above the actions. Always present, so the layout is stable. Announced to assistive tech (role=status). |
| Z4 Actions (center) | Continue (conditional), New Operation, Settings, stacked vertically | Continue is first when present. Continue is the primary CTA when present; otherwise New Operation is. |
| Z5 Message slot (center, below actions) | Armed hint and erase-failure text | Fixed height, reserved even when empty, so nothing shifts when a message appears. Live region (role=alert for failure). |
| Z6 Footer (bottom) | Version/build, warning line, user line | Decorative chrome, aria-hidden. |
| Overlay | Settings panel | Modal, focus trap (P-05). Dims the whole screen. |

At 1280×720 everything fits with no scroll. Below that the layout keeps its minimum size and scrolls; it does not compress (Interface Rule 6). Z5 wraps its text and never truncates.

### Component Inventory

Decisions: the 3 s arm window stays (P-01 forbids shortening it); a failed storage erase warns and continues into the new campaign.

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Z1 | Boot lines | Text block | `SYS:GN-7A // BOOT SEQUENCE COMPLETE`, `PRT:ON \| SEC:LVL 3 \| UPLINK EU-4 STRONG`, `AWAITING OPERATOR_` (blinking cursor) | No | P-14 |
| Z1 | UTC clock | Text | `HH:MM:SS UTC`, 1 Hz | No | P-14 |
| Z2 | Wordmark, tagline | Heading, text | NEXUS / REBORN; `CORPORATE GEOSTRATEGIC COMMAND INTERFACE` | No | none |
| Z3 | Save status line | Status text | `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | No | P-14 (new variant, see below) |
| Z4 | Continue | Primary button | `<< CONTINUE >>`; present only with a valid save | Yes | P-04 |
| Z4 | New Operation | Armable button | No save: `<< NEW OPERATION >>` (one step). Save present: `NEW OPERATION` → armed `CONFIRM // ERASE SAVE?` (3 s window) | Yes | P-01 |
| Z4 | Settings | Secondary button | `SETTINGS` | Yes | P-04 |
| Z5 | Message slot | Live region | Armed hint; erase-failure warning | No | P-11 |
| Overlay | Settings panel | Modal | Audio, controls, accessibility | Yes | P-05, P-13 |
| Z6 | Footer | Text | Version/build, warning, user | No | P-14 |

New or unresolved patterns:

- **Save status line**: not in the library. Flag for a P-14 variant or a new pattern.
- **Armed hint line in a message slot**: extends P-01.
- **Failed-erase behavior**: a failed erase warns and the new campaign starts anyway. The Menu is left on start, so Z5 cannot show that warning. The warning must be carried to the World Network (Feed line or banner), a cross-spec dependency that needs an owner. Logged as an Open Question.

### ASCII Wireframe

Default state: valid save, Continue present; 1280×720.

```
+----------------------------------------------------------------------+
| Z1  SYS:GN-7A // BOOT SEQUENCE COMPLETE                  14:02:31 UTC |
|     PRT:ON | SEC:LVL 3 | UPLINK EU-4 STRONG                          |
|     AWAITING OPERATOR_                                               |
|                                                                      |
|                     ------------------------                         |
| Z2                         NEXUS                                     |
|                            REBORN                                    |
|              CORPORATE GEOSTRATEGIC COMMAND INTERFACE               |
|                     ------------------------                         |
|                                                                      |
| Z3               CAMPAIGN ON FILE                                    |
|                                                                      |
| Z4              [ << CONTINUE >> ]      <- primary CTA               |
|                 [   NEW OPERATION   ]                               |
|                 [     SETTINGS      ]                               |
|                                                                      |
| Z5        (reserved, fixed height; armed hint / erase warning)       |
|                                                                      |
| Z6  VER 7.2.1 // BUILD ...   UNAUTHORIZED ACCESS ...   USER: ...    |
+----------------------------------------------------------------------+

Armed:   [ CONFIRM // ERASE SAVE? ]   Z5: PRESS AGAIN WITHIN 3 S TO ERASE
No save: Z3 NO CAMPAIGN ON FILE; Continue absent; [ << NEW OPERATION >> ] is primary
Invalid: Z3 SAVE UNREADABLE // DROPPED; Continue absent; [ << NEW OPERATION >> ] is primary
Settings open: modal overlay over the whole screen, focus trapped
```

The primary CTA is the first button in the stack in every state. The armed hint states "3 S" as text; the disarm itself is silent, matching P-01.

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default (valid save) | Valid blob | Z3 `CAMPAIGN ON FILE`. Continue present and primary. New Operation secondary (amber). |
| Empty (never started) | No blob | Z3 `NO CAMPAIGN ON FILE`. Continue absent. `<< NEW OPERATION >>` primary, one step. |
| Error (invalid save) | Blob present but unreadable/invalid | Z3 `SAVE UNREADABLE // DROPPED`, text label plus amber/red. Otherwise as Empty. Blob dropped (Persistence Rule 8). |
| Armed | First New Operation press, save present | Button relabels `CONFIRM // ERASE SAVE?` with non-color double-line frame; Z5 shows hint; disarms after 3 s; accessible label updates. |
| Erase failed | Confirmed erase, storage throws | Warn and continue into the new campaign; warning carried to World Network (Open Question). |
| Settings open | Settings pressed | Modal overlay, focus trapped; cancels the armed state; focus returns to Settings button on close. |
| Loading | none | Save read is synchronous at mount. |
| Platform variant | none | Desktop only. |

Audio starts locked until the first click; there is no visible indicator (by decision).

---

## Interaction Map

Input: keyboard and mouse only; no gamepad. Decisions: Escape disarms New Operation; initial focus lands on the primary CTA.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Page | First gesture | First click anywhere | none visible | Audio unlocks |
| Page load | Initial focus | — | P-04 focus marker on primary CTA | Focus on Continue if present, else New Operation |
| Continue | Activate | Click; Enter/Space | Press state, click sound | `continueOperation()` → `phase='world'` |
| New Operation (no save) | Activate | Click; Enter/Space | Press state, click sound | `startNewOperation()` → World Network, fresh campaign |
| New Operation (save), step 1 | Activate | Click; Enter/Space | Relabel `CONFIRM // ERASE SAVE?`, double-line frame, Z5 hint, accessible label updates | Armed; 3 s timer starts |
| New Operation, step 2 | Activate while armed | Click; Enter/Space | Press state | Erase blob, reset in memory, `phase='world'`; on storage failure warn and continue |
| New Operation, disarm | Timeout, Settings opened, or Esc | Passive / Esc | Label reverts, hint clears | Disarmed; next press re-arms |
| Settings | Activate | Click; Enter/Space | Press state | Modal opens, focus moves in, armed state cancelled |
| Settings panel | Close / Esc | Click; Esc | Panel closes | Focus returns to Settings button |
| Focus order | Tab / Shift+Tab | Keyboard | P-04 marker | Continue (if present) → New Operation → Settings |
| Wordmark, header, footer | none | none | none | Not focusable |

Dependency: all navigation targets the World Network, which has no UX spec yet.

---

## Events Fired

Deliberate: the Menu fires no analytics events. Telemetry is local, opt-in, and read only by the Balance overlay.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| First click (audio unlock) | none | — |
| Continue | none (state change: `phase='world'`) | — |
| New Operation, no save | State change: campaign reset (**persistent**) | Fresh campaign data |
| New Operation, step 1 (arm) | none | — |
| New Operation, step 2 (confirm) | State change: campaign blob erased (**persistent**), in-memory reset | Erase result (ok / storage failed) |
| Disarm (timeout / Esc / Settings) | none | — |
| Settings open / close | none | — |

Architecture flags:

- The erase and reset write persistent state (save data). `startNewOperation` in `src/state/save.ts` owns it; the UI must not touch storage.
- The UI needs the erase outcome to show the failure warning. `startNewOperation` currently returns `void` and swallows the storage error, so it must report the outcome. Implementation change; logged as an Open Question.

---

## Transitions & Animations

Motion is limited to print, scan, tick and blink (art bible §7.4). Enter and exit are deliberate instant cuts: a terminal cuts, it does not fade.

| Element | Transition | Reduced motion |
|---|---|---|
| Screen enter | Instant cut. Nothing is loading. | Same |
| Screen exit (to World Network) | Instant cut | Same |
| Grid background, scan bar | Looping scan sweep (decorative) | Removed |
| `AWAITING OPERATOR_` cursor | Blink | Frozen, solid |
| UTC clock | Tick, 1 Hz | Same (a value, not an animation) |
| New Operation armed | Instant relabel and static double-line frame. No pulse. | Same |
| Z5 message | Instant print, no fade | Same |
| Settings overlay | Instant open and close | Same |
| Button press | Immediate press state | Same |

No motion-sickness risk: the only motion is the scan sweep and the cursor blink, both covered by the existing reduced-motion setting (Interface Rule 14).

---

## Data Requirements

The Menu owns no game state. Nothing here is time-sensitive except the decorative clock.

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Save validity (valid / absent / invalid) | Persistence (`readSave`, `hasValidSave`) | Read | `hasValidSave` returns a boolean, so absent and invalid look the same today. The spec needs three states. **Gap.** |
| Erase outcome (ok / storage failed) | Persistence (`startNewOperation`) | Read | Currently `void` and swallowed. **Gap** (see Events Fired). |
| Campaign reset (World, Research, Roster, Credits, Tutorial) | Persistence plus World Network, Research, Campaign, Tutorial stores | Write | Owned by `startNewOperation`; the UI only calls it. **Persistent state.** |
| Continue (`phase='world'`) | App store | Write | Selected-contract restore is done by hydration, not the Menu. |
| Settings, Difficulty, telemetry toggle | Settings store | Read (Settings panel writes) | Survive New Operation. |
| Reduced motion / high contrast | Settings store | Read | Drives the animation rules. |
| UTC time | Browser clock | Read | 1 Hz, decorative. |
| Version / build string | Static | Read | Hard-coded in the footer (`VER 7.2.1 // BUILD 2087.05.14`); fiction text, not real build data. |

Architecture concerns (the spec defines what the UI needs, not how it is delivered):

- **Three-state save read**: the UI must tell "absent" from "invalid". Persistence owns the API shape.
- **Erase outcome**: the UI must receive whether the storage erase succeeded.

---

## Accessibility

Tier: Standard (`design/accessibility-requirements.md`). Full keyboard travel across every panel is Backlog; only the committed set is required.

| Area | Requirement for the Menu |
|---|---|
| Keyboard path | Tab order: Continue (if present) → New Operation → Settings. Enter/Space activate. Initial focus on the primary CTA. Esc disarms New Operation and closes Settings. |
| Focus visibility | P-04 focus marker on every button, visible in high contrast. |
| Settings modal | Focus trap on open, focus restored to the Settings button on close (P-05). |
| Accessible labels | Contextual labels on all three buttons. The armed state is announced through the New Operation label (P-01). |
| Live regions | Z3 `role=status`. Z5 `role=alert` for the erase-failure warning, polite for the armed hint. Clock and chrome are not live. |
| Color independence | Save-status states are told apart by text. The armed state has a text relabel plus the double-line frame. The invalid-save state has a text label, not just amber or red. |
| Text scale | 90 / 100 / 110 / 125% with no clipping at 1280×720. Overflow scrolls; panels never compress. Z5 wraps. |
| Contrast | High-contrast mode remaps CSS variables only. Dim chrome (footer, boot lines) must stay readable in it. |
| Reduced motion | Scan sweep removed, cursor frozen (see Transitions & Animations). |
| Screen reader | Wordmark is the h1. Decorative chrome and rules are aria-hidden. |
| Backlog | Full keyboard travel across all panels. |

Notes:

- Contrast of the dim footer and boot lines is unmeasured. Flagged as a check for `/ux-review`, not a claim.
- Versus the built code: `aria-label`s on the three buttons already exist; live regions and initial focus are new requirements.

---

## Localization Considerations

Scope: English only for now. No localization plan exists in the GDDs; the flags below apply if that changes. A 40% expansion (English → German/French) is the test.

| Element | Longest text | Layout-critical? | 40% expansion risk |
|---|---|---|---|
| Continue button | `<< CONTINUE >>` (15 chars) | Yes, single-line button | Low |
| New Operation button | `CONFIRM // ERASE SAVE?` (22 chars) | Yes, single-line button | **HIGH PRIORITY** (~31 chars) |
| Save status line (Z3) | `SAVE UNREADABLE // DROPPED` (26 chars) | Single line | **HIGH PRIORITY** (~36 chars) |
| Message slot (Z5) | Armed hint / erase warning | No, wraps | Low. Fixed slot holds two lines minimum so longer warnings never resize the layout. |
| Tagline | `CORPORATE GEOSTRATEGIC COMMAND INTERFACE` (40 chars) | Single line under the wordmark | **HIGH PRIORITY** (~56 chars) |
| Footer | Three lines (version, warning, user) | Row of three | Medium; the row can overflow |
| Wordmark | `NEXUS REBORN` | Proper noun | Not translated |

Numbers and formats: the UTC clock is `HH:MM:SS` and locale-independent; version and build strings are fixed; the Menu has no currencies or dates.

---

## Acceptance Criteria

- [ ] **Performance.** The Menu is interactive within 1 s of page load, with the primary CTA focused.
- [ ] **Valid save.** Z3 reads `CAMPAIGN ON FILE`. Continue is present and first in Tab order. Activating it opens the World Network.
- [ ] **Never started.** With no save, Z3 reads `NO CAMPAIGN ON FILE`. Continue is absent, and `<< NEW OPERATION >>` starts a campaign in one activation.
- [ ] **Invalid save.** With a corrupted save, Z3 reads `SAVE UNREADABLE // DROPPED`, told apart from the never-started case by text. Continue is absent.
- [ ] **Two-step erase.** With a valid save, the first New Operation activation shows `CONFIRM // ERASE SAVE?` and the double-line frame, and the save is intact. The second activation within 3 s erases it and opens the World Network.
- [ ] **Disarm.** The armed state clears after 3 s, on Esc, and when Settings opens. No erase happens in any of them.
- [ ] **Erase failure.** When storage refuses the erase, the player sees a visible warning and the new campaign starts. The old save is not reported as erased.
- [ ] **Settings survive.** After New Operation, Settings, Difficulty and the telemetry toggle keep their values.
- [ ] **Keyboard.** Tab reaches Continue (if present), New Operation, Settings, in that order. Every button works with Enter and Space. Focus is visible in high contrast.
- [ ] **Settings modal.** Focus is trapped while open and returns to the Settings button on close.
- [ ] **Layout.** At 1280×720 and at 125% text scale, nothing is clipped or truncated, and the layout does not shift when Z5 shows a message.
- [ ] **Reduced motion.** The scan sweep is gone and the cursor is solid.

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Player journey map missing: `design/player-journey.md` does not exist, so arrival context is assumed. Template: `skill_view('project-templates', file_path='templates/player-journey.md')`. | ux-designer | Open |
| 2 | Return routes to the Menu: nothing in code or GDDs returns the player to the Menu from pause, campaign-end or Debrief. Intended (Menu at launch only) or a gap? | game-designer | Open |
| 3 | Erase-failure warning carriage: after warn-and-continue, the warning must show on the World Network (Feed line or banner). That screen has no UX spec and no owner. | ux-designer / Persistence | Open; implementation dependency |
| 4 | Erase outcome API: `startNewOperation` returns `void` and swallows the storage error; the UI needs the outcome. | Persistence | Open; implementation dependency |
| 5 | Three-state save read: `hasValidSave` returns a boolean; the UI needs absent vs. invalid. | Persistence | Open; implementation dependency |
| 6 | Pattern library: add the save-status line (P-14 variant or new pattern) and the armed-hint line (extends P-01). | ux-designer | Open |
| 7 | Escape disarms and initial focus on the primary CTA are new versus the built code; Interface Rule 14 and P-01 do not mention Escape, so the GDD/pattern wording needs an update. | ux-designer / game-designer | Open |
| 8 | Contrast of dim chrome (footer, boot lines), including high-contrast mode, is unmeasured. Check in `/ux-review`. | qa / ux-review | Open |
| 9 | Accessibility tier: defined (Standard). | — | Closed |
