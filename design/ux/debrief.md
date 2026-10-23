# UX Spec: Debrief

> **Status**: In Review
> **Author**: Claude (delegated by owner /goal 2026-10-23) + ux-designer
> **Last Updated**: 2026-10-23
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at the Debrief wanting to **read what the mission just cost and paid, and then leave**. The sentence the surface must make true is: "I know whether I won, what I was paid and what it cost me, who I lost, whether my result is safe, and what I can do next."

The Debrief is the invoice beat of the session loop (Interface Rule 7: ... Mission → result banner → **Debrief** → World Network, or authored-contract Replay to Brief). It is **not a Screen** (Interface Rule 8, Rule 19; ADR-0017): it has no shared header and no nav, and it does not run the strategic clock. It is one centered card. It does five jobs:

1. **Settle**: print the five Economy-priced money lines — contract value, collateral penalty, optional bonus, payout, account balance — on every outcome, zeros included (Interface Rule 18, AC 24). Economy prices; the Debrief only lists.
2. **Account**: say what the mission did to the people: eliminations, squad casualties, who was killed, who is injured and for how long, experience gained, collateral count, mission time, and the ETA days a win spends.
3. **Warn**: say that the result is in memory only until Persistence files it (unfiled), and say when a write failed (Interface AC 22, AC 23; ADR-0022).
4. **Route**: one way out on every Debrief (World Network), a second (Replay) only for authored contracts on a campaign that has not failed, a third (OPEN RESEARCH) only while the first-Debrief prompt is up.
5. **Teach once**: on the first Debrief of a campaign where a project is affordable, one note names the Research tab and the cheapest project (Interface Rule 13, AC 32).

**Failure if this surface is missing or hard to use**: the player has no record of what a mission cost, cannot tell a paid win from a zero-pay replay, and cannot tell that a result is not yet durable. No Debrief-specific playtest finding was provided or found for this spec; none is invented. The first-Debrief prompt exists because `design/difficulty-curve.md` (approved 2026-10-21) moved Research teaching here from the orientation card.

**Pillars served**: *Information is operational power* (the invoice lists owner-supplied figures, undecorated; nothing is recomputed); *One corporate operating system* (the card uses the shared palette, mono type and corner brackets, art bible §7).

Sources: `design/gdd/interface.md` (Screens row "Debrief", Rules 7, 13, 18, 19, ACs 6, 15, 16, 22, 23, 24, 29, 30, 32), `design/gdd/economy-and-contracts.md` (invoice rows), `design/gdd/persistence-and-validation.md` (filing), `design/ux/interaction-patterns.md` P-04, P-05, P-11, P-14, P-15, P-18, P-19, P-21, `design/accessibility-requirements.md`, art bible §4.2, §7.2, §7.4, §7.5; stories IF-009, IF-010, IF-011, IF-014.

---

## Player Context on Arrival

The Debrief is `appStore.phase = 'debrief'`, entered only by `appStore.setOutcome` from the mission sim. It has four arrival situations (a fifth, a loss that fails the campaign, is a variant of the second).

| Arrival | What the player was just doing | Assumed emotional state (inference, no playtest) | What they most need |
|---|---|---|---|
| **Won (authored or generated)** | Watched the result banner in the Mission for 2.5 s of Tactical time | Relief, appetite | The payout and the new balance, then who paid for it |
| **Lost** | Watched the squad die or the objective fail | Stung | A plain statement that nothing was paid and what did not apply, without a second punishment line |
| **Pyrrhic win** (Win, roster emptied, campaign incomplete) | Won with the last operative dying | Mixed: a win that ended the campaign | The campaign failure first and dominant, the payout unchanged, no false way back into the contract |
| **Quiet replay** (a replay of an already-won authored contract) | Replayed for practice or roster work | Calm, deliberate | That no fee is owed (`REPLAY // FEE ALREADY COLLECTED`), that the stored reward is not a payment, and that the win still spends ETA days |

- **Voluntary**: no. The player cannot choose to skip it; the Mission hands over after the outcome is final.
- **Time pressure**: none. The strategic clock does not run here (Interface Rule 10), nothing expires, and the card has no timer.
- **Attention load**: low. One card, one scroller, two or three buttons, at most one note.
- **Audio**: the strategic bed is unchanged. The Debrief calls the UI click through `act()` and nothing else (verified: no other audio call in the `Debrief` component). No payout, result or invoice sting (Sound Standards; IF-011 manifest rule "Forbidden: payout celebration sting").
- **Journey phase**: not mapped (no `design/player-journey.md`).

---

## Navigation Position

This surface lives at: [app boot] → Menu → World Network → … → Brief → Assembly → Deploy → Mission → **Debrief** (`phase = 'debrief'`). It is not one of the four Screens (Interface Rule 8: "Treat Debrief as a Screen" is forbidden), so it has no nav tab and no shared header: `App.tsx` renders `<Debrief />` alone, and the Credits figure appears only as the ACCOUNT BALANCE row. The write-failure notice (P-11) is **not** mounted here (`App.tsx` mounts it on world, research, brief and team only); the Debrief carries its own filing line instead. Overlays on this surface: the Balance dashboard (opened from BALANCE DATA, `role="dialog"`; its own spec). The Research prompt is an inline note, not an overlay.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| Mission, win or loss | Sim reports the outcome 2.5 s of Tactical elapsed time after the result (`OUTCOME_DELAY = 2.5`, `src/game/world.ts:93`); `setOutcome` stores the priced outcome and sets `phase = 'debrief'` | Result, kills, casualties, time, collateral hits, the Economy-priced reward / bonus / collateral / net payout, apply-once key, KIA ids, survivor HP. Credits are **not** yet paid at entry; the Debrief applies them (see Data Requirements) |
| Mission, quiet replay | Same; `outcome.quietReplay` | Stored reward and priced lines, `netPayout 0` |
| Reload / Continue | Never | A Debrief is never restored: the outcome is not in the blob (`save.ts`, "running mission and its Debrief outcome are never restored"). Reloading on a Debrief loses the unfiled result and returns the last durable campaign; this is accepted (Interface Closed Q5, ADR-0011) |
| Mission, Abort | Never | Abort writes nothing and emits no invoice (Interface Rule 12, AC 12) |

| Exit Destination | Trigger | Notes |
|---|---|---|
| World Network | `RETURN TO WORLD NETWORK` → `returnFromDebrief()` | Present on every Debrief and the **only** exit on a failed campaign. Sets `phase = 'world'` and `missionId = null`, so the contract is cleared and Brief locks |
| Brief (Replay) | `REPLAY MISSION` → `goto('brief')` | Authored contract on a campaign that has not failed only (`debriefFlags.replay`). `missionId` is kept, so Brief opens on the same contract. Generated contracts are spent by their debrief and have no Replay |
| Research | `OPEN RESEARCH` on the prompt → `returnFromDebrief('research')` | Prompt only. Clears `missionId` like the World Network exit (Brief locks); `phase` becomes `research`, not a new value |
| Balance overlay | `BALANCE DATA` | Not an exit. Offered only while the local telemetry log holds at least one record (ADR-0015; Interface Rule 9 "Balance access") |
| Menu | Not built | No return to the Menu from Debrief (`main-menu.md` Open Question 2) |
| Closing the tab | — | Loses the applied-but-unfiled result: the campaign blob is not written on Debrief (ADR-0002, ADR-0011) |

Both exits that file the result (World Network, Replay) are the **trigger** for Persistence's autosave on the next Screen. The Debrief never writes and never retries a save (Interface AC 23).

---

## Layout Specification

### ASCII Wireframe

1280×720, text scale 100%, a won authored contract with no casualties (the measured variant). The card is 640 px wide (`min(640px, 90vw)`), centered; content width 566 px. The banner slot and the Research note are collapsed here. Figures are placeholders.

```
+------------------------------------------------------------------------------+   1280 x 720
|                                                                              |
|          +--[ CAMPAIGN FAILED ]--- (failed campaigns only, first child) -+     |
|          | OPERATIONAL DEBRIEF // STRIKE TEAM 04 // CH 7A                |     |
|          | CONTRACT                          (42 px; wraps to two lines) |     |
|          | FULFILLED                                                     |     |
|          | EXTRACTION CONFIRMED // PAYMENT RELEASED                      |     |
|          |---------------------------------------------------------------|     |
|          | > TARGET ............................ DISTRICT 00 // CITY    |     |
|          | > ELIMINATIONS ...................................... 0       |     |
|          | > SQUAD CASUALTIES .................................. 0       |     |
|          | > KILLED IN ACTION ........... CODENAME   (only if any)       |     |
|          | > INJURED // CODENAME ......... 00H RECOVERY (one per injury) |     |
|          | > EXPERIENCE // CODENAME ...... +00 XP (000) (one per op)     |     |
|          | > COLLATERAL ........................................ 0       |     |
|          | > MISSION TIME .................................. 0:00       |     |
|          | > CONTRACT VALUE ............................. 00,000 CR     |     |
|          | > COLLATERAL PENALTY ........................... 0 CR       |     |
|          | > OPTIONAL BONUS ............................... 0 CR       |     |
|          | > CONTRACT ETA ............................ +0 DAYS ELAPSED  |     |
|          | > PAYOUT ..................................... +00,000 CR    |     |
|          | > NOTE ......... PYRRHIC -- SQUAD LOST // CAMPAIGN FAILED     |     |
|          | > ACCOUNT BALANCE ........................... 000,000 CR     |     |
|          |---------------------------------------------------------------|     |
|          | INVOICE UNFILED // COMMITS ON NEXT SCREEN   (status, live)    |     |
|          | [ RESEARCH // PROJECT   [OPEN RESEARCH][UNDERSTOOD]  body ]   |     |
|          | [ RETURN TO WORLD NETWORK ] [ REPLAY MISSION ] [BALANCE DATA] |     |
|          | ||||||||||||||||||||||||||||| (barcode, aria-hidden)         |     |
|          +---------------------------------------------------------------+     |
+------------------------------------------------------------------------------+
```

`KILLED IN ACTION`, `INJURED`, `EXPERIENCE` rows exist only when Roster's report has them; `CONTRACT ETA` only on a win; `NOTE` only on a pyrrhic win; `REPLAY MISSION` and `BALANCE DATA` only when their conditions hold; the Research note only while the prompt is up.

### Layout Zones

**Arrangements considered** (autonomous mode picked the recommendation; this is the shipped layout, kept):

| Option | Description | For | Against |
|---|---|---|---|
| **A — One centered card, scrolling invoice (chosen)** | Banner, tag, title, subtitle, scrolling rows, status, note, actions in a column | Already shipped and measured clean at 90 / 100 / 110 / 125%; one reading path; the actions never scroll away (`.db-card > :not(.db-rows) { flex-shrink: 0 }`) | At 125% with a banner, a note and extra rows the invoice scrolls inside the card and its last lines (payout, balance) fall below the fold (see Open Question 8) |
| B — Two columns: invoice left, people and actions right | Money apart from casualties | Shorter rows | Needs width the 640 px card does not use; a second reading path for one record; no evidence it is wanted |
| C — Full-width ledger | Table across the screen | Room for 20 rows | A second visual language next to the other surfaces; the Debrief is deliberately small (art bible §4.3, "terminal interiors") |

**Chosen zones (A)**, from the shipped CSS (`.db-*` in `src/ui/ui.css`) and the 2026-10-23 sweep:

| Zone | Size at 1280×720 | Contents | Why here |
|---|---|---|---|
| **Card** | 640 px wide, 566 px content; height 590 / 616 / 648 / 682 px at 90 / 100 / 110 / 125% (read from the screenshots); `max-height: 100%` | Everything below | One record |
| **Failed banner** | content width, ≈64 px at 1280 (inference from type 42 px, padding 8 px) | `CAMPAIGN FAILED` | First child, first read; a record, not a modal |
| **Tag and title block** | tag 10 px; title 42 px, two lines for both English titles | Tag, result title, subtitle | The result before the numbers |
| **Invoice** | scrolls (`overflow-y: auto`) when the card hits its max height | The `.db-rows` region, a focusable scroller labeled `Mission invoice` | Rows are the content |
| **Filing line** | one 10 px line; the slot keeps `min-height` so the card does not jump | Unfiled or write-failed sentence | Sits under the invoice it describes |
| **Research note** | variable | One-shot prompt | Between status and actions; never inside the status, never above the banner |
| **Actions** | one row; each button `flex: 1` (278 px wide with two, ≈182 px with three, the latter read from a pre-IF-036 screenshot) | Return, Replay, Balance | Last, because the next step comes after reading |

**Spec deltas from the shipped surface** (each is an Open Question, none is silently assumed): the title glow, the hero size and the title not scaling with text scale (OQ 5); row print timing (OQ 6); money / state colors (OQ 3, 4); the missing scroll fade (OQ 8); the banner's `role="alert"` (OQ 12).

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks.

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Card | Campaign-failed banner | Status record | `CAMPAIGN FAILED`, red on a red-tinted fill with a red border. Shown for **any** failed campaign, win or loss | No (programmatic focus on mount) | P-21 grammar (words carry state); P-21 lists World Network only, so this use is **New**. As built `role="alert"` + `tabIndex=-1` + focus on mount, P-21 says `role="status"` (OQ 12) |
| Card | Tag | Label | `OPERATIONAL DEBRIEF // STRIKE TEAM 04 // CH 7A` (fiction chrome, text) | No | none |
| Card | Result title | `h1` | `CONTRACT FULFILLED` (teal), `CONTRACT TERMINATED` (red), or on a quiet replay `REPLAY // FEE ALREADY COLLECTED` in the same win / loss color | No | P-18 |
| Card | Subtitle | Text | Win: `EXTRACTION CONFIRMED // PAYMENT RELEASED`, or `// PAYMENT ADJUSTED` when a collateral fine applies. Loss: `SQUAD LINK LOST // PAYMENT WITHHELD`. Quiet: `EXTRACTION CONFIRMED // NO FEE` or `SQUAD LINK LOST // NO FEE` | No | P-18 |
| Invoice | Invoice region | Scroller | The rows below, in this order | Yes — focusable (`tabIndex=0`), `role="region"`, `aria-label="Mission invoice"` | P-15, P-04 (bracket set drawn on the box itself) |
| Invoice | Count rows | Label + value | `TARGET` (`DISTRICT nn // CITY`), `ELIMINATIONS`, `SQUAD CASUALTIES` (red above 0, teal at 0), `KILLED IN ACTION` (codenames, comma-joined), `INJURED // <codename>` (`nH RECOVERY`), `EXPERIENCE // <codename>` (`+n XP (total)`), `COLLATERAL` (count, red above 0), `MISSION TIME` (`m:ss`) | No | P-14 |
| Invoice | Money rows | Label + value | `CONTRACT VALUE`, `COLLATERAL PENALTY`, `OPTIONAL BONUS`, then (win only) `CONTRACT ETA` (`+n DAYS ELAPSED`), `PAYOUT`, (pyrrhic only) `NOTE`, `ACCOUNT BALANCE`. All five money lines print on every outcome. On a loss or quiet replay, `COLLATERAL PENALTY` and `OPTIONAL BONUS` keep their priced values, print dim and carry ` — NOT APPLIED` | No | P-14, P-18 |
| Card | Filing line | Live status | `INVOICE UNFILED // COMMITS ON NEXT SCREEN`, or `SAVE FAILED // CAMPAIGN NOT FILED`, or empty (filed). Always mounted, `role="status"` | No | P-19 |
| Card | Research prompt | Inline note | Title `RESEARCH // <project>`; body sentence naming the lab, cost, hours and the RESEARCH tab; `OPEN RESEARCH`, `UNDERSTOOD` | Yes — two buttons | **New** (library gap: P-23 is the World Network card only; P-11 is the toast). `role="note"` |
| Actions | RETURN TO WORLD NETWORK | Button | — | Yes | Standard button, P-04 focus |
| Actions | REPLAY MISSION | Button | Teal face (the instruction color, spends nothing) | Yes | Standard button |
| Actions | BALANCE DATA | Button | Opens the Balance dashboard | Yes | Standard button; overlay is P-05 (its own spec) |
| Card | Barcode | Decorative | Fiction chrome | No — `aria-hidden` | none |

### Information Hierarchy

Ranked by what the player needs first.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 0 | Campaign-failed banner | Failed campaign only | First and visually dominant (Rule 18, AC 29); the result title is not allowed above it |
| 1 | Result title and subtitle | Always | The result in words, so it is not the hue alone |
| 2 | PAYOUT and ACCOUNT BALANCE | Always | The point of the invoice; as built they are the **last** rows, so at 125% with extras they are the first to fall below the fold (OQ 8) |
| 3 | The other three money lines | Always, zeros included | `NOT APPLIED` marks the unpaid pair |
| 4 | Casualties: KIA, injured, experience | When the report has them | Red for KIA and casualties |
| 5 | Filing status | Unfiled, or failed | Words, not hue |
| 6 | Counts: target, eliminations, collateral, time | Always | Settled record |
| 7 | Research prompt | First Debrief with an affordable project | Teaches once; below the invoice and the status, above the actions |
| 8 | Actions | Always | Return is always present |

**Discoverable, not up front**: Balance (only while records exist). Nothing on this surface is hover-only.

---

## States & Variants

Measured 2026-10-23 for the **won** variant only (see "Measured" below). Every other variant is described from code and earlier retained evidence and was **not** measured in the sweep; earlier evidence (`production/qa/evidence/if-010`, `if-011`, `if-014`) pre-dates IF-036's type and ink changes and, for IF-011, pre-dates the five-money-line rows.

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Won** | `outcome.won`, not quiet | Teal `CONTRACT FULFILLED`; ETA row; `PAYOUT +n CR` (teal) |
| **Lost** | `!outcome.won` | Red `CONTRACT TERMINATED`, subtitle `... PAYMENT WITHHELD`; no ETA row (a loss spends none); `PAYOUT 0 CR` (red); `COLLATERAL PENALTY` and `OPTIONAL BONUS` dim with `NOT APPLIED`; `CONTRACT VALUE` still prints the stored reward |
| **Pyrrhic win** | `outcome.won && campaignFailed` (post-apply, owner-supplied) | `CAMPAIGN FAILED` banner first; the invoice reads as a win with the payout unchanged; `NOTE ... PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` between PAYOUT and ACCOUNT BALANCE; **no Replay** (IF-011, AC 29) |
| **Failed campaign, loss** | A loss that empties the roster on an incomplete campaign | Banner; no pyrrhic note (win only); no Replay; RETURN is the only exit (AC 30) |
| **Quiet replay** | `outcome.quietReplay` | Title `REPLAY // FEE ALREADY COLLECTED` replaces the result title; the win / loss word moves to the subtitle (`... // NO FEE`); the stored reward prints on `CONTRACT VALUE` and is not a payment; `PAYOUT 0 CR`; the pair is `NOT APPLIED`; ETA still prints on a win; ACCOUNT BALANCE can still rise by Tax caught up by the ETA (not a sixth money row, Interface Rule 18). Quiet replay and pyrrhic are independent: both can hold, with `CAMPAIGN FAILED` first |
| **Authored vs generated** | `isGeneratedMissionId` | Generated: no `REPLAY MISSION` |
| **Filing: unfiled** | `saveStatusStore.status === 'unfiled'` (a Debrief applied) | `INVOICE UNFILED // COMMITS ON NEXT SCREEN`. Present in the first painted frame: the apply runs in `useLayoutEffect` and `save.ts` raises unfiled in a store subscription before paint (IF-010; code read) |
| **Filing: filed** | `status === 'filed'` | The sentence is removed; the slot keeps its height. P-19 allows removal as the filed state and leaves the word to this spec: **this spec adopts removal, no filed word**. It is not reachable on a live Debrief: autosave refuses in the `debrief` phase (`save.ts:863, 870`), so the file happens on the next Screen. Only fixtures show it (Open Question 1) |
| **Filing: write failed** | `status === 'write-failed'` (sticky; `markUnfiled` is a no-op while failed) | `SAVE FAILED // CAMPAIGN NOT FILED` in the same slot. The invoice stays unfiled. One sentence covers every reason (ADR-0022). The first-Screen failure after leaving surfaces on that Screen as the P-11 notice with the same words (IF-010 evidence `04`, `05`) |
| **Research prompt showing** | First Debrief of a campaign, apply landed, the id unseen, and the cheapest project (idle lab, `eligibilityText` null, cost ≤ post-payout Credits, finite cost > 0) exists | One note under the filing line; stays until `UNDERSTOOD`, `OPEN RESEARCH`, or the Debrief is left. Marked seen on show (accepted deviation, IF-014); memory only until the next Screen autosave, so a reload on this Debrief shows it again |
| **Research prompt absent** | Already seen, no affordable project, or nothing eligible | No note; the id stays unfired when nothing qualified |
| **Prompt on a failed campaign** | Same rule | Shown under the banner and below the invoice. Its copy says "AUTHORIZE it before the next deploy" though deploy is refused on a failed campaign (OQ 9) |
| **Balance visible** | Telemetry log holds ≥1 record | Third button |
| **No outcome** (harness only) | `outcome === null` | Count rows print `--` / `--:--`; only PAYOUT `0 CR` and ACCOUNT BALANCE print; no crash. Not reachable in play |
| **Missing or non-finite money** | Owner supplied a non-finite figure | `-- CR`, never `NaN CR` (`debriefInvoice.ts`) |
| **Zero-valued money rows** | Any outcome with a zero | Row stays, value prints `0 CR` (+ `NOT APPLIED` on the unpaid pair); never dropped (EC-022) |
| **Long invoice** | KIA, injury and experience rows add up to roughly two rows per operative | The invoice scrolls inside the card (P-15); banner, title and actions stay on screen |
| **Text scale 90 / 100 / 110 / 125%** | Settings | Measured (won): no clipping at all four; the card grows from 590 to 682 px high; the two-up buttons wrap `RETURN TO WORLD NETWORK` onto two lines at 110 and 125% (it fits one line at 90 and 100%); the 42 px title does not scale (OQ 5) |
| **High contrast** | Settings | CSS variables remap only; measured on the won variant, no text under 4.5:1 |
| **Reduced motion** | Settings | Rows are present at once (`.s-reduce-motion .db-row { animation: none; opacity: 1 }`) |
| **Window below 1280×720** | Resize | Minimum layout kept, page scrolls (Interface Rule 6); not measured here |

**Measured** (`production/qa/evidence/screens-2026-10-23/sweep-debrief.json`, 1280×720, after IF-036, won Debrief on Rust Haven): 39 text runs, none under 10 px, none under 4.5:1 in default or high contrast, no Ink Dim or Ink Faint text, 3 pointer targets and none under 24×24, clips `[]` at 90 / 100 / 110 / 125. The measured Debrief printed no KIA, INJURED or EXPERIENCE rows and no Research note; why is not recorded.

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` `platform.primary_input`). Gamepad: **None**; touch: **None** (ADR-0017 forbids both). Hover is not a state (art bible §7.4); no tooltip carries information. Focus is the P-04 bracket set (global rule `:where(button, a, [tabindex]):focus-visible`, `src/index.css:89`; the invoice region draws its own set on the box). Pointer, Enter and Space activate every button (native `<button>`). **No new key binding is invented here.** Esc has no behavior on the Debrief (no handler in the Debrief code). Every activation plays the UI click through `act()`; no other sound.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Banner (failed) | Focus on mount | Automatic | Focus lands on the banner (`tabIndex=-1`, not a Tab stop) so a screen reader starts on the failure; the ring shows only for `:focus-visible` | None |
| Invoice region | Scroll | Wheel; when focused, arrow keys / PageUp / PageDown (native scroller behavior, inference, not tested) | Rows move; brackets show on focus | None. Overflow is reachable |
| `RETURN TO WORLD NETWORK` | Leave | Click; Enter/Space | Click sound; phase cut | `returnFromDebrief()` → `world`, `missionId = null` |
| `REPLAY MISSION` | Replay | Click; Enter/Space | Click sound; phase cut | `goto('brief')`, `missionId` kept. Absent on generated or failed |
| `OPEN RESEARCH` | Go to Research | Click; Enter/Space | Click sound | `returnFromDebrief('research')` |
| `UNDERSTOOD` | Dismiss prompt | Click; Enter/Space | Note leaves in one frame | `markSeen(hint-debrief-research)` (a no-op repeat), note unmounts. Focus is not moved (falls to the page; OQ 11) |
| `BALANCE DATA` | Open Balance | Click; Enter/Space | Overlay opens | `balanceOpen = true`; overlay owns its close |
| Escape | — | Esc | None | Not handled on the Debrief; with Balance open, Esc closing it is **not verified** (OQ 13) |

**Spec-vs-built discrepancies are listed once, under Open Questions**, not repeated per row.

---

## Data Requirements

UI owns no game state. Every figure is read from an owner; the Debrief's only write is the `applyDebrief` call, which runs the apply-once transaction owned by the strategic stores (ADR-0021).

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Won, kills, casualties, time, civilian hits, quiet flag, KIA ids, survivor HP | Tactical → `appStore.outcome` | Read | One outcome, stored by `setOutcome` |
| Reward, optional bonus, collateral (CR), net payout | **Economy** (priced once at settlement, `settleOutcome`, ADR-0021 §4) | Read | The Debrief never prices. `collateralFine` and `netPayout` read the stored fields |
| Net payout deposit, account balance | **Economy** (`appStore.credits` via `addCredits`, only for a paid win) | Read; deposit is made by `applyDebrief` | Balance may include Tax caught up by the ETA; not itemized |
| Applied-once key | `appStore.outcome.applyKey`, `appStore.lastAppliedKey` | Read; `applyDebrief` writes the key | A key applies iff `applyKey > lastAppliedKey`; claimed before any owner mutation, so a repeat or StrictMode double mount is a no-op |
| Sector, unrest, ownership, Influence, Intel, win-ETA catch-up | **World Network** (`applyMissionResult`, then `advanceDays(etaDays)` on a win) | Applied in the transaction; **not displayed** | The Debrief shows none of these (OQ 14) |
| KIA, injury, experience, campaign-failed flag | **Roster** (`campaignStore.reportMission` → `lastReport`, `campaignFailed`) | Read | Pyrrhic = `won && campaignFailed`; never derived from roster length or `deadIds` |
| Target district and city, ETA days | Contract record via `resolveMission(missionId)` | Read | |
| Filing status, reason | **Persistence** (`saveStatusStore`, ADR-0022) | Read only (primitive selector on `status`; `reason` is not read) | Interface never writes it |
| First-Debrief seen id | `tutorialStore.seen` | Read; **Write** (`markSeen`) | Persists with the seen set on the next Screen autosave |
| Cheapest available project | Research graph + `researchStore.done`, `.labs`, post-payout Credits | Read | `eligibilityText` is the one eligibility rule (ADR-0013) |
| Telemetry log presence | `telemetry.ts` (`loadRecords`) | Read | Gates BALANCE DATA |
| Text scale, reduced motion, high contrast | `settingsStore` | Read (CSS classes) | |

**Update triggers and missing values.** "Missing" means the owner supplied nothing; the UI never fabricates a figure it was not given (P-14).

| Data | Updates when | If missing |
|---|---|---|
| All outcome-derived rows | Once, on entry: `applyDebrief` runs in `useLayoutEffect` and the store updates before the first paint | Count rows `--`; time `--:--`; money rows print only PAYOUT `0 CR` and ACCOUNT BALANCE (as built plain `--`, not the dim em dash P-14 asks for; OQ 16) |
| Account balance | Once, after the deposit and any Tax caught up | `-- CR` if non-finite |
| Target, ETA | Entry | `--`; ETA row omitted |
| KIA / injured / experience rows | Once, when Roster's report lands | Rows absent (no row, not a zero) |
| Pyrrhic and banner state | Once, post-apply | No banner |
| Filing status | Persistence transitions: `unfiled` on apply; `write-failed` or `filed` only from `save.ts` writes | Line empty |
| Research prompt | Once, post-apply, when the id is unseen | Not shown, id unfired |
| Balance entry | Telemetry write or clear | Button absent |

**Division of labor** (Interface Rule 18): Interface presents. Economy prices all five money lines. World Network applies sector, unrest, ownership, Influence and Intel. Roster grades KIA, injury and experience. Persistence commits once, on the next Screen. Abort never builds an invoice.

Real-time: nothing on this surface updates per frame. The only timed element is the row print (Transitions).

---

## Events Fired

Telemetry is local, opt-in and written **only at the Debrief boundary**: `applyDebrief` (`src/state/debrief.ts`) calls `recordMissionOutcome(missionId, outcome)` first in its transaction, before Credits, the campaign report and the World Network write-back (ADR-0015). The Debrief **component** fires no analytics event and calls no telemetry function itself. The call does nothing unless the TELEMETRY setting is on and the outcome carries a telemetry payload.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Debrief entry (mount, once per apply key) | `recordMissionOutcome` → one appended record in localStorage key `nexus-telemetry-v1`, version 1, FIFO cap 60 records, never sent anywhere | `FinishedRecord`: `at` (Date.now()), `missionId`, `outcome` (`'won'` / `'lost'`), `durationSec`, `kills`, `kia` (count of `deadIds`), `civiliansHit`, `reward`, `bonus`, `fine` (the stored collateral on a win, 0 on a loss), `payout` (net payout), plus the sim counters (`seed`, `firstContactSec`, `objectiveTimes`, `shotsByWeapon`, `damageByWeapon`, `damageDealt`, `damageTaken`, `civilianHitsBySquad`, `civilianHitsByCorpsec`, `medUsed`, `cellUsed`, `abilityUsesByRole`, `squadRoles`). No record on an Abort-free path other than this; Abort writes its own thin `aborted` row from the Mission (`recordAbort`), never from here |
| Debrief entry | State changes by owners, once: `lastAppliedKey`, Credits, Roster report, World Network write-back, squad cleanup, win-ETA catch-up; `saveStatusStore` → `unfiled` | See Data Requirements. Owners, not the UI |
| `RETURN TO WORLD NETWORK` | State change: `phase = 'world'`, `missionId = null` | None |
| `REPLAY MISSION` | State change: `phase = 'brief'` | None |
| `OPEN RESEARCH` | State change: `phase = 'research'`, `missionId = null`; the prompt id is already marked | None |
| Prompt shown / `UNDERSTOOD` | State change (persistent on the next Screen autosave): `tutorialStore.seen` gains `hint-debrief-research` | The id |
| `BALANCE DATA` | State change: overlay open | None |
| Any activation | UI click through the audio event system (`uiClick` via `act()`) | None |

Architecture flags:

- Reload on a Debrief loses the campaign result but keeps the telemetry row: a session log, not a campaign transaction. Accepted (Interface Closed Q5, ADR-0015).
- On a quiet-replay **win**, the record's `fine` is the stored collateral (`outcome.won ? collateralFine : 0`) although that fine is not debited, while `payout` is 0 and the invoice tags the fine `NOT APPLIED`. Read from code; flagged for analytics (OQ 17).
- The Debrief fires no event for Replay-vs-Return choice. A UX metric for it would need the analytics-engineer to name one; none is invented here.

---

## Transitions & Animations

Law (art bible §7.4): the terminal prints, scans, ticks and blinks; nothing bounces, pops, slides or glows. Nothing exceeds 500 ms except a tick tracking a real value. At the Debrief's pressure state at most one idle motion; this surface has **none**.

| Moment | Spec | Reduced motion |
|---|---|---|
| **Result display, then entry** | The result shows in the Mission (HUD banner) first. The Debrief follows 2.5 s of Tactical elapsed time later (IF-009, AC 15). Pause stops that time; a catch-up may cross the result and the Debrief before any paint, so the Debrief can be the next painted surface. No minimum visible banner duration, no UI timer | Same |
| **Card enter** | The card is present from the first frame; no outro, no fly-in (as built: none) | Same |
| **Invoice print** | Rows print top to bottom at ~110 ms per row (`index * 110 ms`), each in one step or a fade of ≤120 ms, no travel (art bible §7.4). As built: 400 ms ease-out with a 6 px slide, rows start at opacity 0; the 11 rows of the measured variant finish at about 1.5 s, and a long invoice takes longer (OQ 6). The buttons and status are usable from the first frame; rows are in the DOM from the first frame (opacity does not hide them from assistive tech) | Rows present at once, static column |
| **Money** | No tick animation on the figures: the balance is already post-payout at first paint. A ledger tick would animate toward a number the store already holds | Static figure (same) |
| **Filing line** | Appears in one frame with the apply (before first paint); changes in one frame on write failure | Same |
| **Banner** | In one frame; no pulse, no sting, no shake (ADR-0017; Interface Rule 18) | Same |
| **Research note** | Appears in one frame; leaves in one frame | Same |
| **Exit** | Cut; phase changes in one frame | Same |
| **Sound** | UI click on each button only. No payout, result, invoice or banner sting; no per-row or per-digit tick (Sound Standards; Interface "No celebration sting for payout") | Same |
| **Idle loops** | None. (The page-level `.crt-overlay` is global and not assessed here) | None |

Motion budget: zero idle motions; one finite print on entry. Nothing here can cause discomfort: no flash, no travel beyond 6 px (as built), nothing above 3 Hz.

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017; `project.yaml` `gamepad_support: None`, `touch_support: None`), so the gamepad and touch blocks are dropped. An item is ticked only when the Interaction Map specifies it.

**Keyboard**
- [x] Every action activates with Enter and Space: Return, Replay, Open Research, Understood, Balance Data (native buttons).
- [x] The invoice region is a tab stop so overflow can be scrolled by keyboard (focusable scroller).
- [x] Esc: no Debrief behavior; it never confirms or discards anything (nothing on this surface is destructive). Esc inside the Balance overlay opened from here is not verified (OQ 13).
- [x] Focus is visible on every control: P-04 brackets, including in high contrast.
- [x] No keyboard trap on the Debrief itself.
- [x] Tab order is specified in Accessibility → Focus order (measured for the won variant, 2026-10-23).
- [ ] After `UNDERSTOOD`, focus returns to a defined control. **Fails as built** (focus falls to the page; OQ 11).

**Mouse**
- [x] Every action is a single click. No double-click, right-click or drag.
- [x] No information appears only on hover; hover is not a state. (As built, `.btn:hover` draws a color and glow change on every button; OQ 7.)
- [x] Hit-target sizes: every pointer target is at least **24×24 CSS px** (WCAG 2.2 SC 2.5.8 AA, owner decision recorded in `world-network.md` Open Question 21).

| Target (1280×720, 100%) | Size | Meets 24×24? |
|---|---|---|
| `RETURN TO WORLD NETWORK` | 278 wide (sweep); about 36 high (read from the screenshot, not an element measurement) | Yes |
| `REPLAY MISSION` | same | Yes |
| Invoice region (tab stop) | 566 wide, content high | Yes (inference: the sweep counted 3 targets with none under 24×24, and the Tab list has three stops) |
| `BALANCE DATA`, three-up Return and Replay | not measured; about 182 wide in a pre-IF-036 screenshot | Expected yes by width; height not measured |
| `OPEN RESEARCH`, `UNDERSTOOD` | not measured; CSS gives `min-height: 24px` (`.hud-btn`) | Likely; **not measured** (OQ 15) |

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). No Backlog row (color-vision presets, tactical-HUD screen-reader pass, audio captions, full keyboard travel) is promoted.

| Committed row | How the Debrief satisfies it |
|---|---|
| Critical state never by color alone | Result: the title words and the subtitle words (`CONTRACT FULFILLED` / `TERMINATED`, `PAYMENT RELEASED` / `WITHHELD`), not teal vs red. Campaign failure: the words `CAMPAIGN FAILED` and, on a pyrrhic win, the `NOTE` row. Quiet replay: the title words and `NOT APPLIED` tags. Filing: the sentences `INVOICE UNFILED ...` and `SAVE FAILED ...`, and the removal of the sentence when filed. Casualties: the value and the `KILLED IN ACTION` row, not the red alone. Focus: brackets |
| Text legible at 1280×720 | Measured (won): no text under 10 px; no clipping at 90 / 100 / 110 / 125%. Readout values 15 px, row labels 12.5 px, tag, subtitle and status 10 px (at 100%) |
| Text scale 90 / 100 / 110 / 125% | Row, tag, subtitle, status, button and prompt sizes scale with `--text-scale`; the card absorbs growth by scrolling the invoice, never by compressing. The 42 px title and banner use a `clamp()` in px and **do not scale** (OQ 5) |
| High-contrast mode | CSS-variable remap only; measured clean on the won variant (`hcLow: []`) |
| Full keyboard operability of the committed set | Native buttons; focusable invoice; Enter/Space |
| Contextual accessible labels | Invoice region `Mission invoice`; Return and Replay use their visible text. `OPEN RESEARCH`, `UNDERSTOOD` and `BALANCE DATA` carry aria-labels that do **not** begin with their visible text (`Open the Research tab`, `Dismiss the Research prompt`, `Open the balance dashboard over the local mission log`; WCAG 2.5.3, OQ 12). Spec: the name starts with the visible text |
| Two-step destructive confirms | None occur on this surface |
| One-shot advisories, bounded | The Research prompt fires once per campaign, never blocks input |
| Reduced motion | Rows present at once; no other motion |
| Consistent one-OS chrome | Same palette, mono type and bracket corners as the Screens; no second visual language |

### Focus order

Measured on the running build, 2026-10-23 (won, authored, no prompt, no Balance): the sweep's real Tab order is **1. `Mission invoice` region, 2. `RETURN TO WORLD NETWORK`, 3. `REPLAY MISSION`**. No control takes initial focus. The other variants follow the DOM order and are **not measured** (inference from the JSX):

- Failed campaign: the banner takes programmatic focus on mount (not a Tab stop). Tab then goes region → `RETURN TO WORLD NETWORK` (no Replay).
- With the prompt: region → `OPEN RESEARCH` → `UNDERSTOOD` → `RETURN TO WORLD NETWORK` → `REPLAY MISSION` → `BALANCE DATA`.
- Shift+Tab reverses. The decorative barcode and the banner are not stops.

### Contrast

Requirement (art bible §7.5): body and readout text ≥4.5:1 composited against its panel; Ink Dim only at ≥18.66 px bold or ≥24 px; Ink Faint never carries text; semantic red text uses Red Hot. The sweep reports **pass/fail only** (per-run ratios are not recorded in the JSON): for the won variant, `low`, `hcLow`, `dim` and `faint` are all empty, so every one of the 39 runs meets 4.5:1 in default and high-contrast modes. The Ledger Amber, teal, Print White and Ink values used here are the same inks measured in `world-network.md` (Amber 13.39:1, teal 14.10:1, Print White 17.98:1, Ink 12.27–13.04:1, Red Hot 6.90:1). Not measured: red-tinted banner fill under `CAMPAIGN FAILED`, the Research note's tinted fill, the dim `NOT APPLIED` rows, the write-failed sentence (OQ 15).

Screen-reader considerations:

- The filing line is an always-mounted `role="status"`; the unfiled text is inserted into it by the apply before first paint. Whether a screen reader announces text inserted that early is **not verified**. The write-failure sentence on the next Screen is that Screen's own live region.
- The banner is `role="alert"` and focused on mount; P-21 says `role="status"` (OQ 12).
- The invoice is a labeled region of `div` rows: no list, table or description-list semantics (read from code); the `>` prefix is in the label text; the dotted leader is `aria-hidden`. A screen-reader pass was not run (Backlog row for the HUD; none for DOM chrome).
- The title is an `h1`; the barcode and tag are fiction chrome (the tag is read as text; it carries no state).

Color roles (art bible §4.2, Interface Rule 4): teal = selection and live state; Ledger Amber = money only; red = danger, KIA and failure; Print White = settled records. **As-built deviations are Open Questions 3 and 4.**

---

## Localization Considerations

Scope: English only. No localization system or plan exists in the GDDs; every string on this surface is a literal in `src/ui/*.ts(x)`. The flags apply if that changes (see Open Question 19). Test: 40% expansion. Rule for all rows: expanded text wraps; it never clips, truncates or shrinks type (Interface Rule 6).

**How the limits were derived.** Box widths are from the 2026-10-23 sweep and CSS: card content 566 px at 1280; the two-up buttons 278 px (sweep); text widths of known strings. Two advance assumptions are shown. **(a)** The requested ~0.62 em (glyph plus tracking). **(b)** The advance measured on this build: the mono glyph is 0.60 em and each rule adds its tracking, so 0.70 em for rows (`> TARGET` is 70 px for 8 chars at 12.5 px), 0.69 em for 15 px values (`85,000 CR` is 93 px), 0.78 em for the 42 px title, 0.80 em for buttons, 0.84–0.90 em for the 10 px tag, status and subtitle (tracking 0.24–0.30 em; checked against the 100% screenshot). Assumption (a) **overstates** capacity for tracked text: the sweep and screenshots show `RETURN TO WORLD NETWORK` wrapping at 110 and 125% where (a) says it fits. Use (b) as the limit and treat (a) as the optimistic bound. Limits are characters per line at text scale 100% / 125%; above them the run wraps to a further line.

| Element | Box at 1280 | Size (100%) | Max chars/line (a: 0.62 em) | Max chars/line (b: measured) | Longest English | Risk at +40% |
|---|---|---|---|---|---|---|
| Tag | 566 | 10 px | 91 / 73 | 65 / 52 | 46 | Low at 100% (64), wraps at 125% |
| Result title | 566 | 42 px, not scaled | 21 | 17 | `CONTRACT FULFILLED` 18, `REPLAY // FEE ALREADY COLLECTED` 31 | Wraps already in English (by word); a longer word than 17 chars cannot break (**HIGH PRIORITY**: no `overflow-wrap` on `.db-title`; read from CSS) |
| Banner | 540 (566 − padding − border) | 42 px, not scaled | 25 | 16 | `CAMPAIGN FAILED` 15 | **HIGH PRIORITY**: fits one line only up to 16; `overflow-wrap: anywhere` prevents clipping but breaks mid-word |
| Subtitle | 566 | 10 px | 91 / 73 | 62 / 50 | `EXTRACTION CONFIRMED // PAYMENT RELEASED` 40 | Medium (56): wraps at 125% |
| Row label | flex: none, 70–176 px | 12.5 px | — | up to 61 / 49 before it alone fills the row | `> COLLATERAL PENALTY` 20; `> EXPERIENCE // KESTREL` 23 | Low (32), but the label never wraps: a label wider than the row pushes the value out |
| Row value, `TARGET` | 476 | 15 px | 51 / 41 | 46 / 35 | `DISTRICT 03 // DETROIT SPRAWL` 29 | Medium (41): wraps at 125%. District and city names are proper nouns |
| Row value, `COLLATERAL PENALTY` unpaid | 370 | 15 px | 40 / 32 | 35 / 25 | `-15,000 CR — NOT APPLIED` 24 | **HIGH PRIORITY**: 34 wraps at 100% and 125%. Not measured (loss variant) |
| Row value, `NOTE` | 494 | 15 px | 53 / 42 | 47 / 37 | `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` 38 | **HIGH PRIORITY**: over the 125% limit in English. Computed, not measured |
| Row value, `KILLED IN ACTION` | 389 | 15 px | 42 / 33 | 37 / 27 | Up to 4 codenames, longest 7 chars: 34 | **HIGH PRIORITY** at 125% in English worst case. Computed |
| Row value, `CONTRACT ETA` | 424 | 15 px | 45 / 36 | 41 / 32 | `+3 DAYS ELAPSED` 15 | Low |
| Filing line | 566 | 10 px | 91 / 73 | 67 / 53 | `INVOICE UNFILED // COMMITS ON NEXT SCREEN` 41 | Medium (57): wraps at 125%. The slot is `min-height`, so it grows without clipping |
| Button, two-up | 236 text width (278 − padding − border) | 12 px | 31 / 25 | 24 / 19 | `RETURN TO WORLD NETWORK` 23 | **HIGH PRIORITY**: already wraps at 110 and 125% in English (measured) |
| Button, three-up | ≈140 text width (≈182 box, pre-IF-036 screenshot) | 12 px | 18 / 15 | 14 / 11 | `RETURN TO WORLD NETWORK` 23, `REPLAY MISSION` 14 | **HIGH PRIORITY**: Return wraps already; not measured |
| Research prompt body | 540 | 10.5 px | 83 / 66 | 80 / 64 (0.64 em, 0.04 em tracking) | About 140 chars of sentence | Medium: three lines at 125% in English (screenshot, pre-IF-036); grows, never clips |
| Research prompt title | flex-wrap with the buttons | 10 px | — | 0.78 em tracking 0.18 em | `RESEARCH // BARREL WEAR COATING` 31 | Medium; the buttons wrap below it |
| Codenames, districts, cities, project names | — | — | — | — | Proper nouns | Not translated |

Numbers and formats: Credits use `toLocaleString('en-US')` thousands separators with a `CR` suffix, no `k` or `M` (P-14); the sign is part of the value (`+85,000 CR`, `-5,000 CR`); mission time is `m:ss`; ETA is `+n DAYS ELAPSED`. These are locale-independent today because they are pinned to `en-US`. A future locale would need them chosen deliberately.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. They are UX criteria; pricing, apply-once, sector and Roster rules stay in their own GDDs.

**Performance / responsiveness**
- [ ] **First painted frame.** On entering the Debrief after a paid win, the first painted frame already shows the post-payout `ACCOUNT BALANCE` (never the pre-payout balance) and, with autosave running, the unfiled sentence. Pressing any button changes the surface by the next painted frame. No numeric open-time budget exists for the Debrief and none is invented here; the response budget in art bible §7.5 (≤100 ms from input for urgent state) is the only number in scope.
- [ ] **Entry timing.** The Debrief appears 2.5 s of Tactical time after the result, not wall-clock: paused time does not count toward it. A mission Abort never opens a Debrief.

**Core purpose**
- [ ] **Five money lines, zeros included.** For a won authored contract, a lost contract and a quiet replay, the invoice shows `CONTRACT VALUE`, `COLLATERAL PENALTY`, `OPTIONAL BONUS`, `PAYOUT` and `ACCOUNT BALANCE` in that relative order, each with a `CR` value, including `0 CR`. On the loss and the quiet replay, `CONTRACT VALUE` shows the stored reward, `PAYOUT` shows `0 CR`, and `COLLATERAL PENALTY` and `OPTIONAL BONUS` end with `— NOT APPLIED`.
- [ ] **Result in words.** The title reads `CONTRACT FULFILLED` or `CONTRACT TERMINATED`, and the subtitle names the outcome (`PAYMENT RELEASED`, `PAYMENT ADJUSTED`, `PAYMENT WITHHELD`). A quiet replay's title reads exactly `REPLAY // FEE ALREADY COLLECTED`, and a win still shows `CONTRACT ETA`.
- [ ] **Pyrrhic and failed campaign.** For a pyrrhic win, `CAMPAIGN FAILED` is the first element in the card, the `NOTE` row reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`, and `PAYOUT` equals the same win's payout without the failure. For a non-pyrrhic win, neither appears. For a loss that empties the roster, the banner shows and the note does not. In both failed fixtures there is no `REPLAY MISSION` and `RETURN TO WORLD NETWORK` is present.
- [ ] **Replay rule.** `REPLAY MISSION` is present for an authored contract on a campaign that has not failed, and absent for a generated contract. Activating it opens Brief on the same contract.
- [ ] **Unfiled, then not.** An applied Debrief reads `INVOICE UNFILED // COMMITS ON NEXT SCREEN` before any exit. After a successful write on the next Screen, reached once through World Network return and once through Replay, the unfiled sentence is gone because Persistence reported success, not because the player navigated.
- [ ] **Write failure.** With the first Screen write failing, the surface reached by each exit shows `SAVE FAILED // CAMPAIGN NOT FILED`, and nothing on it says the result was saved or filed. With a write already failed before the Debrief opens, the Debrief's own status line reads `SAVE FAILED // CAMPAIGN NOT FILED`.
- [ ] **First-Debrief Research prompt.** On the first Debrief of a campaign with an affordable, eligible project, exactly one note names the RESEARCH tab and the cheapest such project, below the invoice and below the failed banner when one shows; `OPEN RESEARCH` opens Research with Brief locked; no later Debrief in that campaign shows it; with no affordable project, none shows.

**Navigation**
- [ ] **Return clears the contract.** After `RETURN TO WORLD NETWORK`, no contract is selected and Brief reads locked with `NO CONTRACT SELECTED`.
- [ ] **Keyboard only.** With the keyboard only, a tester can Tab to every button on the Debrief in the order stated in Focus order, activate each with Enter and Space, and scroll a long invoice from the focused region.

**Accessibility and layout** (per Standard tier)
- [ ] **Layout.** At 1280×720 and text scale 90 / 100 / 110 / 125%, on the won, lost, quiet-replay, pyrrhic and failed-loss variants, with and without the Research note and with KIA, injury and experience rows present, no text is clipped or truncated, no box overlaps another, and every row, including `PAYOUT` and `ACCOUNT BALANCE`, is reachable by scrolling the invoice while the banner, title and buttons stay on screen. (Only the won variant has been measured, 2026-10-23.)
- [ ] **Text and contrast.** Every text run is at least 10 px at 100% and at least 4.5:1 in default and high-contrast modes, on every variant.
- [ ] **Non-color cues.** A tester viewing the Debrief in grayscale can tell won from lost, paid from unpaid, failed from not failed, and unfiled from failed-write, by words alone.
- [ ] **Focus and labels.** Every button shows the bracket focus marker, including in high contrast; each button's accessible name begins with its visible text; the invoice region is named `Mission invoice`.
- [ ] **Hit targets.** At 1280×720 and 100% scale, every button is at least 24×24 CSS px (measure the element box).
- [ ] **Motion and sound.** With reduced motion on, all invoice rows are visible at once. With it off, rows print top to bottom, in reading order, with no idle loop. The only sound is the UI click on a button; no sound plays on entry, on a payout or on a banner.

---

## Open Questions

Items marked **As-built delta** record where the shipped Debrief (`src/ui/index.tsx` `Debrief`, `debriefFlags.ts`, `debriefInvoice.ts`, `filingStatus.ts`, `debriefResearch.ts`, `ui.css` `.db-*`, read 2026-10-23) differs from this spec. They are inputs to implementation stories, not defects: no GDD AC fails on them unless stated, and none was filed as a bug by this skill.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **The filed label.** P-19 leaves the filed word to this spec. This spec adopts **removal of the sentence** (as built; P-19 accepts it) and no filed word. The filed state is unreachable on a live Debrief (autosave refuses in the `debrief` phase; the file happens on the next Screen), so a word could never be read there. Confirm | owner | Open |
| 2 | **Write-failure copy.** `SAVE FAILED // CAMPAIGN NOT FILED` is placeholder copy in `filingStatus.ts` ("pending /ux-design"). This spec adopts it as written: it names the failure and says the campaign is not filed. Confirm | owner | Open |
| 3 | **As-built delta, filing line color.** `.db-filing` prints in Ledger Amber for both unfiled and failed, but amber is money only (Interface Rule 4; art bible §4.2) and a failed write is not a price. Spec: unfiled in the Print White notice tone, failed in Red Hot; the words carry the state either way. Art-director to confirm the tones | art-director / ui-programmer | Open |
| 4 | **As-built delta, value colors.** Built: `CONTRACT ETA` and `INJURED` rows amber (neither is money); `PAYOUT` and a paid `OPTIONAL BONUS` teal (teal is selection and live state; art bible §4.2 puts payouts in amber); a paid `COLLATERAL PENALTY` red; a **zero** payout red, including on a quiet-replay win that is not a danger; `SQUAD CASUALTIES 0` teal; settled counts in white. Spec direction (art bible §4.2, P-14): money values amber with `CR`, settled counts Print White, red only for KIA, casualties above 0 and failure. Not decided here | art-director | Open |
| 5 | **As-built delta, hero title.** The title carries a 24 px `text-shadow` glow (art bible §7.4 bans glow); it is 42 px at 1280 against a hero scale of 22–38 px (§7.2, which names "the debrief invoice total" as the hero, not the result title); the title and banner sizes use `clamp()` in px and do not follow `--text-scale` (measured: the title is the same size at 90 and 125%) | art-director | Open |
| 6 | **As-built delta, row print.** Rows run a 400 ms ease-out with a 6 px slide, from opacity 0, at 110 ms steps. Art bible §7.4: one step or a ≤120 ms fade, no travel. For 11 rows the last finishes at about 1.5 s; the money lines come last | ui-programmer / art-director | Open |
| 7 | **As-built delta, hover.** `.btn:hover` changes color, border and draws a box-shadow glow on every button here. "Hover is not a state" and hover glow is banned (art bible §7.4). `.btn` is shared, so the fix is outside the Debrief | ui-programmer / art-director | Open |
| 8 | **As-built delta, invoice scroller.** With a banner, a note or extra rows at 125% the invoice scrolls inside the card and `PAYOUT` and `ACCOUNT BALANCE` fall below the fold (IF-014 evidence `01-…-125` and `06-…-125`, pre-IF-036, not re-measured; IF-011 completion note says the same). `.db-rows` has no cut-edge fade (P-15 requires an always-on `aria-hidden` fade while content lies below). Spec: add the P-15 fade; whether the two lines that matter most should print earlier is a design question | ui-programmer / game-designer | Open |
| 9 | **Research prompt on a failed campaign.** The prompt still shows and says "AUTHORIZE it before the next deploy" although `selectMission` and deploy are refused on a failed campaign (IF-014 advisory 1). Keep, suppress on `campaignFailed`, or branch the copy | owner | Open (owner ruling pending since IF-014) |
| 10 | **Prompt is marked on show, not on dismiss.** AC 32 says dismiss marks it fired; the code marks on show (IF-014 Implementation Note G), so leaving the Debrief with the note up consumes the lesson. Accepted in IF-014; confirm it stays | owner | Accepted in IF-014; confirm |
| 11 | **As-built delta, focus after `UNDERSTOOD`.** The focused button unmounts and focus falls to the page (IF-014 advisory 11). Spec: move focus to `RETURN TO WORLD NETWORK`. Also open: whether the Debrief should take initial focus on a primary action at all (as built: none, except the failed banner) | ux-designer / ui-programmer | Open |
| 12 | **As-built delta, accessible names and banner role.** Three aria-labels do not start with their visible text (`OPEN RESEARCH`, `UNDERSTOOD`, `BALANCE DATA`; WCAG 2.5.3). The banner is `role="alert"` and takes focus; P-21 says `role="status"` and lists World Network only, so the Debrief use is a **library gap** (as is the Research prompt, which is neither P-23 nor P-11). Add both to the library or record the role difference | ux-designer | Open |
| 13 | **Balance overlay opened from the Debrief.** It is `role="dialog" aria-modal="true"`. In `src/ui`, Esc handling for it exists only in `Settings.tsx`; `Balance.tsx` has none, and no focus trap or restore was found. Not tested. The overlay's own spec owns the answer | ux-designer | Open |
| 14 | **The Debrief shows nothing World Network changed.** Influence, Intel, Control, Unrest and ownership are applied in the transaction but only visible on World Network. No GDD requires rows for them (the Debrief lists the five money lines plus Roster lines). Whether the "what changed?" read belongs here is a game-designer question; not a defect | game-designer | Open |
| 15 | **Not measured.** The 2026-10-23 sweep covered the won variant only: lost, quiet replay, pyrrhic, failed-loss, `NOT APPLIED` rows, KIA / injured / experience rows, the Research note, the write-failed line, the three-up button row and the Balance overlay, at 90 / 100 / 110 / 125% and in high contrast. Contrast of the banner fill and the note fill is unmeasured. Screen-reader output was not exercised. Existing evidence for those variants pre-dates IF-036. Why the measured Debrief printed no KIA, injured or experience rows was not determined | qa-lead | Open |
| 16 | **As-built delta, P-14 formats.** Missing values print plain `--` and `--:--` rather than a dim em dash; counts and mission time are not zero-padded to a fixed width (`2`, `3:00`) as P-14 asks | ui-programmer | Open (minor) |
| 17 | **Telemetry `fine` on a quiet-replay win.** The record stores the priced collateral (`outcome.won ? collateralFine : 0`) although the invoice tags it `NOT APPLIED` and `payout` is 0. Read from `telemetry.ts`; whether analytics should treat it as unapplied is not decided | analytics-engineer | Open (low) |
| 18 | **Player journey map missing**: `design/player-journey.md` does not exist; arrival situations come from the GDD and story records. No Debrief-specific playtest finding was found | game-designer | Open (non-blocking) |
| 19 | **Rule file out of step.** `.claude/rules/ui-code.md` says to support gamepad and route all text through a localization system. ADR-0017 forbids gamepad and touch and no localization system exists (same call as `world-network.md` Open Question 13). This spec follows ADR-0017 and `project.yaml` | owner | Open (rule file) |
| 20 | **No numeric Debrief open-time budget.** The Interface GDD forbids inventing one; the Response criterion states none. A World Network p95 re-profile is dated 2026-10-28 (`world-network.md` Open Question 18); whether it covers the Debrief is not stated | performance-analyst | Open |
