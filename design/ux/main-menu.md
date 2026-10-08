# UX Spec: Main Menu

> **Status**: Approved (/ux-review design/ux/main-menu.md 2026-10-08)
> **Author**: user + ux-designer
> **Last Updated**: 2026-10-08
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at the Main Menu wanting to get back to the desk: resume their saved campaign, or start a new one, and know for certain which the game will do before committing.

The Menu is the entry surface of the secure-system fiction (not one of the four Screens). It does three jobs:

1. **Route**: Continue opens the World Network for the saved campaign; New Operation starts another Campaign.
2. **Protect**: New Operation never fires in one click, including when no blob remains (living spec §4 rule 1, Interface forbidden list, Persistence UI). When a valid blob exists, the second step erases it (Interface Rule 8, P-01). When the blob is absent or already dropped, the second step starts a Campaign and does not claim an erase.
3. **Inform**: it tells never-started apart from an unreadable or invalid save (Persistence Rule 8), so a player with a broken save is not silently treated as new.

Settings is reachable from here. The settings slot survives New Operation: audio, remaps, accessibility, Quality, Difficulty, and the telemetry toggle.

Failure if this screen is missing or hard to use: a returning player can erase their campaign by accident, or can't tell that a corrupt save was dropped.

Sources: `design/gdd/interface.md` Rule 9 (Menu), `design/gdd/persistence-and-validation.md` Rules 7–8, P-01.

---

## Player Context on Arrival

- **First encounter**: every app launch. The Menu is `appStore.phase = 'menu'`, the initial phase (`src/state/appStore.ts:78`). A save-load reset also sets phase to menu (`src/state/save.ts:746`).
- **Immediately before**: nothing in-game on a cold start. A returning player was last on a Screen, or on a mission or Debrief that never reached a save.
- **Emotional state**: calm and unhurried. No time pressure and no strategic clock (the Menu does not run it, ADR-0001). The player is often a returner checking that their campaign is intact, so reassurance matters more than speed.
- **Voluntary**: yes. The player launched the game; no game event sends them here.
- **Journey phase**: not mapped (no `design/player-journey.md`). It is the first touchpoint of every session.
- **Audio**: nothing has played yet. Browsers block audio until the first gesture, so the first click, Enter, or Space unlocks it (Interface Rule 9). There is no visible indicator. That gesture is not consumed: the focused control still activates. If audio cannot start, the Menu stays interactive (Audio UI Requirements).

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
| World Network (new Campaign) | New Operation, confirmed (always two-step) | Second step erases a valid blob, or starts a Campaign when none remains. Settings slot survives: audio, remaps, accessibility, Quality, Difficulty, telemetry toggle. A refused erase still enters the new campaign and shows the erase-failure contract; it does not claim the save was erased. |
| Settings overlay | Settings button | Not an exit; returns to the Menu with focus restored. |

No exit is reversible once confirmed. Closing the tab is the only other exit.

---

## Layout Specification

### Information Hierarchy

Decision: Continue is hidden (not disabled) when there is no valid save; the status line carries the reason.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | Primary actions: Continue (valid save only), New Operation | Always (Continue conditional) | Continue hidden without a valid save. Without Continue, New Operation is the sole primary action. |
| 2 | Save status line: `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | Always | Text, not color alone. The unreadable case has a text label; red may reinforce, never alone. Amber is not used. Never silent. P-19. |
| 3 | New Operation confirmation: armed label and hint | After first press | Valid blob: `CONFIRM // ERASE SAVE?`. Absent or dropped blob: `CONFIRM // NEW OPERATION?`. The write-failure warning is not shown here. |
| 4 | Settings | Always | Secondary action. |
| 5 | Identity: NEXUS REBORN wordmark, tagline | Always | Not a decision input. |
| 6 | Fiction chrome: boot lines, UTC clock, footer | Always | Decorative. Never carries state, including no standing-cost ticker. Hidden from assistive tech (aria-hidden or non-focusable). Text is ≥10 px at 100% scale and ≥4.5:1 on Void. |

Discoverable, not shown up front: none. The Menu has nothing hidden behind interaction except the armed state.

Decision: fiction chrome never carries game state. Art bible §2.1's standing-cost ticker is withdrawn; Credits stay on the World Network.

### Layout Zones

Decision: Arrangement B — centered stack with a fixed message slot.

| Zone | Contents | Notes |
|---|---|---|
| Z1 Header (top) | Boot lines (left), UTC clock (right) | Decorative chrome, aria-hidden. Clock ticks 1 Hz, so it is not a live region. |
| Z2 Identity (center, upper) | Rule, NEXUS REBORN wordmark, tagline, rule | Wordmark is the h1. |
| Z3 Save status (center) | One status line: `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | Sits directly above the actions. Always present, so the layout is stable. Announced to assistive tech (role=status). The text is inserted after the region mounts, so the initial line is announced, not only a later change. |
| Z4 Actions (center) | Continue (conditional), New Operation, Settings, stacked vertically | Continue is first when present. Continue is the primary CTA when present; otherwise New Operation is. |
| Z5 Message slot (center, below actions) | Armed hint | Fixed height, reserved even when empty, so nothing shifts when a message appears. Polite live region. Erase-failure is not shown here. |
| Z6 Footer (bottom) | Version/build, warning line, user line | Decorative chrome, aria-hidden. |
| Overlay | Settings panel | Modal, focus trap (P-05). Dims the whole screen. |

At 1280×720 everything fits with no scroll. Below that the layout keeps its minimum size and scrolls; it does not compress (Interface Rule 6). Z5 wraps its text and never truncates.

### Component Inventory

Decisions: New Operation is always two-step, including when no blob remains. The 3 s arm window stays (P-01 forbids shortening it). A failed storage erase warns and continues into the new campaign.

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Z1 | Boot lines | Text block | `SYS:GN-7A // BOOT SEQUENCE COMPLETE`, `PRT:ON \| SEC:LVL 3 \| UPLINK EU-4 STRONG`, `AWAITING OPERATOR_` (static underscore, not a blink) | No | none |
| Z1 | UTC clock | Text | `HH:MM:SS UTC`, 1 Hz | No | none |
| Z2 | Wordmark, tagline | Heading, text | NEXUS / REBORN; `CORPORATE GEOSTRATEGIC COMMAND INTERFACE` | No | none |
| Z3 | Save status line | Status text | `CAMPAIGN ON FILE` / `NO CAMPAIGN ON FILE` / `SAVE UNREADABLE // DROPPED` | No | P-19 (copy is this spec; not a P-14 readout) |
| Z4 | Continue | Primary button | `<< CONTINUE >>`; present only with a valid save | Yes | P-04 (focus). Continue is absent, not a P-03 disabled control. |
| Z4 | New Operation | Armable button | Always two-step. Primary idle: `<< NEW OPERATION >>`. Secondary idle: `NEW OPERATION`. Armed, valid blob: `CONFIRM // ERASE SAVE?`. Armed, no blob: `CONFIRM // NEW OPERATION?`. 3 s window either way. No hue assigned | Yes | P-01 |
| Z4 | Settings | Secondary button | `SETTINGS` | Yes | P-04 (focus) |
| Z5 | Message slot | Live region | Armed hint only: `PRESS AGAIN WITHIN 3 S TO ERASE` or `PRESS AGAIN WITHIN 3 S TO START` | No | P-01 extension (not P-11) |
| Overlay | Settings panel | Modal | Audio, remaps, accessibility, Quality, Difficulty, telemetry toggle | Yes | P-05, P-13 |
| Z6 | Footer | Text | Version/build, warning, user | No | none |

New or unresolved patterns:

- **Save status line**: P-19. Not a new pattern. Not a P-14 readout — P-14 is a numeric chip and value. Copy stays in this spec.
- **Armed hint line in a message slot**: extends P-01. Not a P-11 toast. P-11 is a dismissible `role="status"` toast; Z5 is a reserved slot.
- **Fiction chrome** (boot lines, clock, footer): no pattern. Not P-14.
- **Button face**: recorded in the pattern library Standard controls table. Focus is P-04. Press is the §7.4 ink-step. Not a numbered pattern.
- **Erase-failure pair**: not a new pattern. P-11 is the immediate channel; P-16 is the record. Contract below.

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
| Z5        (reserved, fixed height; armed hint)                       |
|                                                                      |
| Z6  VER 7.2.1 // BUILD ...   UNAUTHORIZED ACCESS ...   USER: ...    |
+----------------------------------------------------------------------+

Armed, valid save: [ CONFIRM // ERASE SAVE? ]   Z5: PRESS AGAIN WITHIN 3 S TO ERASE
Armed, no blob:    [ CONFIRM // NEW OPERATION? ]   Z5: PRESS AGAIN WITHIN 3 S TO START
No save: Z3 NO CAMPAIGN ON FILE; Continue absent; [ << NEW OPERATION >> ] is primary; still two-step
Invalid: Z3 SAVE UNREADABLE // DROPPED; Continue absent; [ << NEW OPERATION >> ] is primary; still two-step; armed label does not say erase
Settings open: modal overlay over the whole screen, focus trapped
```

The underscore after `AWAITING OPERATOR` is static. The grid scan is one pass on open, not a loop, and is not drawn in this frame. The primary CTA is the first button in the stack in every state. The armed hint states "3 S" as text; the disarm itself is silent, matching P-01.

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| Default (valid save) | Valid blob | Z3 `CAMPAIGN ON FILE`. Continue present and primary. New Operation secondary. No hue is assigned; do not use Ledger Amber. |
| Empty (never started) | No blob | Z3 `NO CAMPAIGN ON FILE`. Continue absent. `<< NEW OPERATION >>` primary. Still two-step: armed label `CONFIRM // NEW OPERATION?`. |
| Error (invalid save) | Blob present but unreadable/invalid | Z3 `SAVE UNREADABLE // DROPPED`, text label; red may reinforce, never alone. Otherwise as Empty, including the two-step and the non-erase armed label. Blob dropped (Persistence Rule 8). |
| Armed | First New Operation press | Valid blob: `CONFIRM // ERASE SAVE?` and hint `PRESS AGAIN WITHIN 3 S TO ERASE`. No blob: `CONFIRM // NEW OPERATION?` and hint `PRESS AGAIN WITHIN 3 S TO START`. Non-color double-line frame either way. Disarms after 3 s. Accessible label updates. |
| Erase failed | Confirmed erase, storage throws | New campaign starts. Warning is not on this screen. World Network shows the erase-failure contract below. |
| Settings open | Settings pressed | Modal overlay, focus trapped; cancels the armed state; focus returns to Settings button on close. |
| Loading | none | Save read is synchronous at mount. |
| Platform variant | none | Desktop only. Keyboard and mouse. No gamepad. No touch. |

Audio starts locked until the first gesture (click, Enter, or Space). There is no visible indicator (by decision). The gesture is not consumed. If audio cannot start, the Menu stays interactive.

### Erase-failure contract

Hosted on the World Network, not on the Menu. P-19: a failed write reads as failure, never as a durable erase. Copy is `ERASE FAILED // SAVE NOT ERASED`.

This is not a new pattern. P-11 is used because P-16 sends immediate attention there. It is not a tutorial toast and not a combat Alert. The hold matches the alert-toast timing so the failure can be read.

- **Immediate channel (P-11)**: a dismissible toast, `role="status"` (not `role="alert"`). Prints in one frame. Holds at least 3 s, then collapses, unless dismissed sooner. Dismiss control accessible label: `DISMISS`. Does not block input. Does not pause the strategic clock. Red may reinforce the word FAILED; the words carry the state. Amber is not used.
- **Record (P-16)**: the same copy prints as a Feed line and stays until the player scrolls it away. The Feed line is the record, not the immediate channel.
- Neither channel says the save was erased. The in-session desk is the new campaign.

Zone coordinates inside the World Network are Open Question 3. The copy, the two channels, and the timing above are closed.

---

## Interaction Map

Input: keyboard and mouse only; no gamepad. Decisions: New Operation is always two-step; Escape disarms it; initial focus lands on the primary CTA. The unlocking gesture is not consumed.

Press state, every button: the border ink-steps for the activation, ≤150 ms (art bible §7.4). No glow, no scale, no hue change. Hover is not a state: no hover glow (P-04). P-04 brackets are focus, not press. No Menu button is disabled; Continue is absent instead (P-03 When NOT to Use). Storage failure is the erase-failure contract, not a button error state.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Page | First gesture | First click, Enter, or Space | none visible | Audio unlocks if it can. The gesture is not consumed: the focused control still activates. |
| Page | Audio cannot start | Unlock throws, or the context never starts | none visible | Menu stays interactive. Play is not blocked. |
| Page load | Initial focus | — | P-04 focus marker on primary CTA | Focus on Continue if present, else New Operation |
| Continue | Activate | Click; Enter/Space | Ink-step press, UI click | `continueOperation()` → `phase='world'` |
| New Operation (no blob), step 1 | Activate | Click; Enter/Space | Relabel `CONFIRM // NEW OPERATION?`, double-line frame, Z5 start hint, accessible label updates, UI click | Armed; 3 s timer starts. Nothing is written. |
| New Operation (no blob), step 2 | Activate while armed | Click; Enter/Space | Ink-step press. No extra sting | `startNewOperation()` → World Network, fresh campaign. No erase claim. |
| New Operation (valid save), step 1 | Activate | Click; Enter/Space | Relabel `CONFIRM // ERASE SAVE?`, double-line frame, Z5 erase hint, accessible label updates, UI click | Armed; 3 s timer starts. Blob unchanged. |
| New Operation (valid save), step 2 | Activate while armed | Click; Enter/Space | Ink-step press. No extra sting | Erase blob, reset in memory, `phase='world'`; on storage failure show the erase-failure contract and continue |
| New Operation, disarm | Timeout, Settings opened, or Esc | Passive / Esc | Label reverts, hint clears. No sound | Disarmed; next press re-arms. No erase and no new campaign. |
| Settings | Activate | Click; Enter/Space | Ink-step press, UI click | Modal opens, focus moves in, armed state cancelled |
| Settings panel | Close / Esc | Click; Esc | Panel closes, UI click | Focus returns to Settings button |
| Focus order | Tab / Shift+Tab | Keyboard | P-04 marker | Continue (if present) → New Operation → Settings |
| Wordmark, header, footer | none | none | none | Not focusable |

Dependency: all navigation targets the World Network, which has no UX spec yet. That spec must host the erase-failure contract. It does not get to change the copy, the channels, or the timing.

---

## Events Fired

Deliberate: the Menu fires no analytics events. Telemetry is local, opt-in, and read only by the Balance overlay.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| First gesture (audio unlock) | none | Gesture is not consumed. |
| Audio cannot start | none | Menu stays interactive. |
| Continue | none (state change: `phase='world'`) | — |
| New Operation, no blob, step 1 (arm) | none | — |
| New Operation, no blob, step 2 (confirm) | State change: campaign reset (**persistent**) | Fresh campaign data. No blob to erase. |
| New Operation, valid save, step 1 (arm) | none | — |
| New Operation, valid save, step 2 (confirm) | State change: campaign blob erased (**persistent**), in-memory reset | Erase result (ok / storage failed). Storage failed shows the erase-failure contract; it is not a durable erase. |
| Disarm (timeout / Esc / Settings) | none | — |
| Settings open / close | none | — |

Architecture flags:

- The erase and reset write persistent state (save data). `startNewOperation` in `src/state/save.ts` owns it; the UI must not touch storage.
- The UI needs the erase outcome to show the failure warning. `startNewOperation` currently returns `void` and swallows the storage error, so it must report the outcome. Implementation change; logged as an Open Question.

---

## Transitions & Animations

Motion follows art bible §7.4: print, a single scan pass, and tick. Blink is not used. The Menu is a low-pressure surface (states 2–3): at most one idle motion, and this screen has no idle loop. Enter and exit are instant cuts. A terminal cuts; it does not fade. The grid scan is a separate one-pass reveal, not the enter transition, and it does not gate input.

| Element | Transition | Reduced motion |
|---|---|---|
| Screen enter | Instant cut. Nothing is loading. Input is live immediately. | Same |
| Screen exit (to World Network) | Instant cut | Same |
| Grid scan | One pass, ≤400 ms, once per open. Not a loop. Does not block input. | Absent. Content is already there. |
| `AWAITING OPERATOR` underscore | Static. Not a blink. | Same |
| UTC clock | Tick, 1 Hz. A value, not an animation. | Same |
| New Operation armed | Instant relabel and static double-line frame. No pulse. | Same |
| Z5 message | Instant print, no fade | Same |
| Settings overlay | Instant open and close | Same |
| Button press | Ink-step of the border, ≤150 ms. No glow, no scale, no hue change. | Same |

No motion-sickness risk: the only motions are one scan pass on open and the clock tick. Both have a static fallback. Reduced motion removes the scan (Interface Rule 14). There is no idle loop.

---

## Data Requirements

The Menu owns no game state. Nothing here is time-sensitive except the decorative clock.

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Save validity (valid / absent / invalid) | Persistence (`readSave`, `hasValidSave`) | Read | `hasValidSave` returns a boolean, so absent and invalid look the same today. The spec needs three states. **Gap.** Null: absent and invalid are the two non-valid lines above; the line is never blank. |
| Erase outcome (ok / storage failed) | Persistence (`startNewOperation`) | Read | Currently `void` and swallowed. **Gap** (see Events Fired). Storage failed shows the erase-failure contract. Ok shows no warning. |
| Campaign reset (World, Research, Roster, Credits, Tutorial) | Persistence plus World Network, Research, Campaign, Tutorial stores | Write | Owned by `startNewOperation`; the UI only calls it. **Persistent state.** |
| Continue (`phase='world'`) | App store | Write | Selected-contract restore is done by hydration, not the Menu. |
| Settings slot (audio, remaps, accessibility, Quality, Difficulty, telemetry toggle) | Settings store | Read (Settings panel writes) | Survives New Operation. |
| Reduced motion / high contrast | Settings store | Read | Drives the animation rules. |
| UTC time | Browser clock | Read | 1 Hz, decorative. Always present. |
| Version / build string | Static | Read | Hard-coded in the footer (`VER 7.2.1 // BUILD 2087.05.14`); fiction text, not real build data. Always present. |

Architecture concerns (the spec defines what the UI needs, not how it is delivered):

- **Three-state save read**: the UI must tell "absent" from "invalid". Persistence owns the API shape.
- **Erase outcome**: the UI must receive whether the storage erase succeeded.

---

## Accessibility

Tier: Standard (`design/accessibility-requirements.md`). Full keyboard travel across every panel is Backlog; only the committed set is required.

| Area | Requirement for the Menu |
|---|---|
| Keyboard path | Tab order: Continue (if present) → New Operation → Settings. Enter/Space activate. Initial focus on the primary CTA. Esc disarms New Operation and closes Settings. The first Enter or Space unlocks audio and still activates the focused control. |
| Focus visibility | P-04 focus marker on every button, visible in high contrast. |
| Settings modal | Focus trap on open, focus restored to the Settings button on close (P-05). |
| Accessible labels | Contextual labels on all three buttons. The armed state is announced through the New Operation label (P-01). |
| Live regions | Z3 `role=status`. Its text is inserted after the region mounts, so the initial line is announced. Z5 is polite for the armed hint. Erase-failure is a P-11 `role=status` toast on the World Network, not `role=alert`, and not Z5. Clock and chrome are not live. |
| Color independence | Save-status states are told apart by text. The armed state has a text relabel plus the double-line frame. The invalid-save state has a text label; red may reinforce, never alone. The erase-failure copy carries the failure; red may reinforce FAILED, never alone. Amber is not used on this screen. |
| Text scale | 90 / 100 / 110 / 125% with no clipping at 1280×720. Overflow scrolls; panels never compress. Z5 wraps. Decorative text is ≥10 px at 100% scale. |
| Contrast | Body and decorative text ≥4.5:1 on Void `#04070a` at the rendered size. Ink Dim `#5d7d75` is 4.48:1 on Void and is not used for Menu text (art bible §7.5 allows it only at ≥18.66 px bold or ≥24 px). Use Telemetry Ink `#b8d8cf` (13.23:1) or lighter. High-contrast mode remaps CSS variables only; high-contrast Ink Dim `#9dc3b8` is 10.51:1 and passes. Ink Faint is structure only, never text. |
| Reduced motion | The one-pass scan does not run. The underscore is already static. |
| Screen reader | Wordmark is the h1. Decorative chrome and rules are aria-hidden. |
| Backlog | Full keyboard travel across all panels. |

Notes:

- Contrast checked 2026-10-05 against `src/index.css` on Void `#04070a`. Default Ink Dim fails the body floor at boot and footer sizes (built footer is 9.5 px). This spec requires a passing pair and ≥10 px at 100% scale. It does not keep that built chrome.
- Versus the built code: `aria-label`s on the three buttons already exist; live regions and initial focus are new requirements. The built empty state starts a campaign in one activation; this spec requires two. The built scan bar loops and the built cursor blinks; this spec does not.

---

## Localization Considerations

Scope: English only for now. No localization plan exists in the GDDs; the flags below apply if that changes. A 40% expansion (English → German/French) is the test.

Accommodation, if localized: expanded text wraps. It does not clip, truncate, or shrink type. At 1280×720, overflow scrolls rather than compressing a panel (Interface Rule 6). Single-line buttons may grow to two lines. The tagline wraps under the wordmark. The footer row wraps. Z5 already holds two lines.

| Element | Longest text | Layout-critical? | 40% expansion risk |
|---|---|---|---|
| Continue button | `<< CONTINUE >>` (14 chars) | Yes, single-line button | Low. Wraps to two lines if needed; does not clip. |
| New Operation button | `CONFIRM // NEW OPERATION?` (25 chars); erase arm is `CONFIRM // ERASE SAVE?` (22) | Yes, single-line button | **HIGH PRIORITY** (~35 chars). Wraps to two lines; does not clip or shrink. |
| Save status line (Z3) | `SAVE UNREADABLE // DROPPED` (26 chars) | Single line | **HIGH PRIORITY** (~36 chars). Wraps; does not clip. |
| Message slot (Z5) | `PRESS AGAIN WITHIN 3 S TO ERASE` / `PRESS AGAIN WITHIN 3 S TO START` | No, wraps | Low. Fixed slot holds two lines minimum so a 40% expansion never resizes the layout. |
| Tagline | `CORPORATE GEOSTRATEGIC COMMAND INTERFACE` (40 chars) | Single line under the wordmark | **HIGH PRIORITY** (~56 chars). Wraps under the wordmark; does not clip. |
| Footer | Three lines (version, warning, user) | Row of three | Medium. The row wraps; it does not clip. |
| Erase-failure copy | `ERASE FAILED // SAVE NOT ERASED` (31 chars) | No. Not on this screen | Low. World Network toast and Feed line wrap it; they do not truncate it. |
| Wordmark | `NEXUS REBORN` | Proper noun | Not translated |

Numbers and formats: the UTC clock is `HH:MM:SS` and locale-independent; version and build strings are fixed; the Menu has no currencies or dates.

---

## Acceptance Criteria

- [ ] **Performance.** The Menu is interactive within 1 s of page load, with the primary CTA focused. The grid scan does not delay that.
- [ ] **Valid save.** Z3 reads `CAMPAIGN ON FILE`. Continue is present and first in Tab order. Activating it opens the World Network.
- [ ] **Never started.** With no save, Z3 reads `NO CAMPAIGN ON FILE`. Continue is absent. The first `<< NEW OPERATION >>` activation shows `CONFIRM // NEW OPERATION?` and the double-line frame, and does not start a campaign. The second activation within 3 s starts one.
- [ ] **Invalid save.** With a corrupted save, Z3 reads `SAVE UNREADABLE // DROPPED`, told apart from the never-started case by text. Continue is absent. New Operation still takes two activations, and the armed label does not say erase.
- [ ] **Two-step erase.** With a valid save, the first New Operation activation shows `CONFIRM // ERASE SAVE?` and the double-line frame, and the save is intact. The second activation within 3 s erases it and opens the World Network.
- [ ] **Disarm.** The armed state clears after 3 s, on Esc, and when Settings opens. No erase happens, and no campaign starts.
- [ ] **Erase failure** (verified on the World Network; its host zone waits on Open Question 3, the behavior below does not). When storage refuses the erase, the new campaign starts and the World Network shows `ERASE FAILED // SAVE NOT ERASED` in two places: a dismissible status toast that appears in one frame, holds at least 3 seconds unless dismissed, then collapses, and does not block input; and a Feed line with the same text that stays until scrolled away. Neither says the save was erased. The strategic clock is not paused.
- [ ] **Settings survive.** After New Operation, audio, remaps, accessibility, Quality, Difficulty, and the telemetry toggle keep their values.
- [ ] **Keyboard.** Tab reaches Continue (if present), New Operation, Settings, in that order. Every button works with Enter and Space. Focus is visible in high contrast. The first Enter or Space unlocks audio and still activates the focused control. If audio cannot start, the Menu stays interactive.
- [ ] **Settings modal.** Focus is trapped while open and returns to the Settings button on close.
- [ ] **Layout.** At 1280×720 and at each text scale 90 / 100 / 110 / 125%, nothing is clipped or truncated, and the layout does not shift when Z5 shows a message.
- [ ] **Dim chrome.** At 100% text scale, boot lines, the UTC clock, and the footer are at least 10 px and at least 4.5:1 against Void `#04070a`. They are not Ink Dim `#5d7d75`.
- [ ] **Motion.** On open, the grid scan runs once, for at most 400 ms, and does not repeat. It does not block input. The underscore after `AWAITING OPERATOR` is static. With reduced motion, that scan does not run.

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017).

**Keyboard**
- [x] Every interactive element is reachable by Tab / Shift+Tab: Continue (if present) → New Operation → Settings.
- [x] Every action activates with Enter and Space, including both New Operation steps.
- [x] Esc disarms New Operation and closes Settings.
- [x] Initial focus lands on the primary CTA.
- [x] Focus is always visible (P-04), including in high contrast.
- [x] No keyboard trap outside the Settings modal; the modal trap releases on close or Esc and restores focus (P-05).
- [x] The audio-unlock gesture (Enter or Space) is not consumed.

**Mouse**
- [x] Every action is a single click on a full-width button; no precision target.
- [x] No information is shown only on hover; hover is not a state (P-04).
- [x] No right-click, drag, or double-click is required. The two-step confirm is two separate clicks within 3 s.
- [x] The audio-unlock click is not consumed.

No item is unticked.

---

## Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Player journey map missing: `design/player-journey.md` does not exist, so arrival context is assumed. Non-blocking for this spec: the Menu is the first touchpoint of every session regardless of journey phase. | ux-designer | Open |
| 2 | Return routes to the Menu: nothing in code or GDDs returns the player to the Menu from pause, campaign-end or Debrief. Intended (Menu at launch only) or a gap? | game-designer | Open |
| 3 | World Network has no UX spec. It must host the erase-failure contract in this spec (copy, P-11 toast, P-16 line). Zone coordinates inside that screen are for `/ux-design` World Network. | ux-designer | Open (host only; contract closed) |
| 4 | Erase outcome API: `startNewOperation` returns `void` and swallows the storage error; the UI needs the outcome. | Persistence | Open; implementation dependency |
| 5 | Three-state save read: `hasValidSave` returns a boolean; the UI needs absent vs. invalid. | Persistence | Open; implementation dependency |
| 6 | Pattern library: armed-hint slot is P-01 (not P-11). Button face is recorded in the library Standard controls table (focus P-04; press is the §7.4 ink-step). Save status is P-19. Fiction chrome still has no pattern, by decision. | — | Closed 2026-10-05 |
| 7 | Escape disarms on the Menu. P-01 and the pattern library Escape section already say this (pattern half closed). Interface Rule 14 still does not, so the GDD wording needs an update. Initial focus on the primary CTA is new versus the built code. | ux-designer / game-designer | Open (GDD only) |
| 8 | Contrast of dim chrome. Default Ink Dim `#5d7d75` on Void is 4.48:1 and fails at boot/footer sizes. Spec requires ≥4.5:1 and ≥10 px at 100% scale, Telemetry Ink `#b8d8cf` or lighter. High-contrast Ink Dim passes at 10.51:1. | — | Closed 2026-10-05 |
| 9 | Accessibility tier: defined (Standard). | — | Closed |
