# IF-013 — Four-row orientation card and the sector-panel Influence moment — Manual test cases

**Story**: `production/epics/interface/story-013-four-row-orientation-card-and-sector-panel-influence-moment.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/if-013/manual/` | **Gate**: BLOCKING (qa-lead sign-off on screenshots + click-through note)
**Scope**: QA plan `production/qa/qa-plan-sprint-010-2026-10-22.md` § Manual QA Checklist → IF-013, plus the optional WN-020 Scan look (§ WN-020 / EC-023 spot-check; QA session item 1).
**Governing spec**: story ACs; `design/gdd/world-network.md` Core Rule 13 and the Opening desk AC; `design/gdd/interface.md` AC27; TR-interface-002.
**Covered by automated tests, not repeated here**: the START HERE selector pick logic and tie order, the `influenceRefusal === null` trigger, and the `markSeen` guard (`src/ui/worldOnboard.test.ts`, `src/state/tutorialStore.test.ts`). These cases verify the live screens.

## AC map

| AC | Text (short) | Cases |
|----|--------------|-------|
| AC1 (AC27) | Four rows, no Influence/Research row; START HERE = highest-Chance open contract; Pause/Clock speed = strategic time; Nexus-held Tax stated | IF013-01, -02, -03 |
| AC2 (WN Opening desk) | UNDERSTOOD marks `hint-worldmap` once; card never returns in that campaign | IF013-05, -06, -07 |
| AC3 | Influence 0: Stabilize/Lobby unaffordable reason, Expedite no-target reason, no teaching panel | IF013-08, -09 |
| AC4 | Clean win (+8), moment unseen: one panel names action, cost, effect; dismiss marks seen; never returns, including after spend and recovery | IF013-11, -13, -14, -15, (-16 optional) |
| AC5 | Antarctica focused: no panel (`locked-sector`) | IF013-17 |
| AC6 (TR-interface-002) | Card and teaching panel at 1280x720 × 90/100/110/125: nothing clips or truncates | IF013-04, -10, -12 |
| WN-020 (optional) | Intel 1: Rust Haven selectable, Glass Veil / Hollow Crown REQUIRES INTEL LVL 2; intel 2: all selectable | IF013-20, -21 |
| Observations (spec silent / owner ruling pending) | Fire-then-refocus; leaving with the note up | IF013-18, -19 |

## Common setup

- Start the server: `npm run dev -- --strictPort --port 4200`. Confirm it listens on 4200 before starting.
- Browser: headless `npx playwright-cli` only (never the in-app pane, never the user's Chrome). `open http://localhost:4200/`, then `resize 1280 720`. Confirm with `eval "() => [innerWidth, innerHeight]"` → `[1280, 720]`. Re-check after every `reload`.
- Record console and page errors for the whole session. Any `pageerror` or console `error` is a failure of the case in which it appears.
- Screenshots: `screenshot` to `production/qa/evidence/if-013/manual/<case-id>-<scale>.png`. Do not overwrite the dev-story captures in `production/qa/evidence/if-013/`.
- Store handles for `eval` (the same imports `capture.mjs` uses):
  ```js
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  const { useSettingsStore } = await import('/src/state/settingsStore.ts')
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useAppStore } = await import('/src/state/appStore.ts')
  ```
- **Fresh New Operation (FNO)**: `localStorage.clear()`, `reload`, wait 1.2 s, click `<< NEW OPERATION >>` on the Menu (confirm the erase prompt if one shows). World Network opens with the orientation card up. This is a real click; `capture.mjs` `fresh()` does the same through `save.startNewOperation()` + `goto('world')`, which is acceptable if the click path fails for an unrelated reason (record which was used).
- **Text scale**: `useSettingsStore.getState().setTextScale(n)` for n in 90 / 100 / 110 / 125, then wait 350 ms (harness assist, as in `capture.mjs` `setScale`). One case may instead set it through the Settings overlay to show the real path; record which.
- **Clip check**: reuse `clippedSel(sel)` from `capture.mjs` verbatim (pasted into `eval`). It flags a box whose scroll size exceeds its client size, a button whose text range leaves its padding box, and any box outside the 1280x720 viewport. Empty result = no clip. Also open each screenshot and look; a visual cut-off fails the case even if the check returns empty.
- **Clean-win fixture**: `useWorldStore.setState({ influence: 8 })` — the value a first clean win awards (WN Opening desk AC). This is the `capture.mjs` step 4 fixture. IF013-16 is the optional real-win path.
- **Seen count**: `useTutorialStore.getState().seen.filter(id => id === '<id>').length`.

Harness assists used anywhere below are named in the step. UNDERSTOOD buttons and the Influence action buttons are always real clicks.

---

## Test Case: IF013-01 — Card holds exactly four rows, in order, and no Influence or Research row (AC1)

**Preconditions**: FNO. Text scale 100. Card up (`.wm-onboard` present).
**Steps**:
1. `eval` the row titles: `[...document.querySelectorAll('.wm-onboard-row')].map(r => r.querySelector('b')?.textContent)`.
2. `eval` the card text: `document.querySelector('.wm-onboard').textContent`.
3. Screenshot `IF013-01-100.png`.
**Expected Result**: Titles are exactly `THE JOB`, `START HERE`, `STRATEGIC TIME`, `THE FOUR NUMBERS`, in that order. No title contains INFLUENCE or RESEARCH. The card text does not tell the player to "click the marker" (Core Rule 13).
**Pass Criteria**: Title array equals the four strings above (length 4, exact order); `/INFLUENCE|RESEARCH/` matches no title; `/marker/i` does not match the card text.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-02 — START HERE names the highest-Chance open contract: NEON GARDEN, 87% (AC1)

**Preconditions**: As IF013-01. Intel level 1 (`useCampaignStore.getState().intelLevel === 1`).
**Steps**:
1. Read the START HERE row text (`.wm-onboard-row[data-row="start"] span`).
2. In OPEN CONTRACTS, read every row: codename, whether it is locked (`.wm-op.locked` / `aria-disabled`), and its Chance chip.
3. From step 2, pick the unlocked row with the highest Chance by hand.
**Expected Result**: START HERE reads `Start with NEON GARDEN in OSLO, the open contract with the highest Chance (87%).` NEON GARDEN is the seeded EC-023 offer. In the Scan it is unlocked and its Chance chip reads 87%, which is the highest Chance among unlocked rows (Rust Haven is unlocked and lower; Glass Veil and Hollow Crown are locked and are not candidates even if their Chance is higher).
**Pass Criteria**: The named codename, city and Chance in START HERE equal the step-3 pick and its Scan chip exactly; the pick is NEON GARDEN / OSLO / 87%. Any mismatch between START HERE and the Scan fails (closes code-review finding 5: the harness checks only the sentence shape).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-03 — STRATEGIC TIME names Pause/Clock speed; Nexus-held Tax is stated; four number lines (AC1)

**Preconditions**: As IF013-01.
**Steps**:
1. Read the STRATEGIC TIME row.
2. Read THE JOB row.
3. Count the lines in THE FOUR NUMBERS (`.wm-onboard-row[data-row="numbers"] .wm-onboard-lines > span`) and read them.
**Expected Result**: STRATEGIC TIME contains `Pause and Clock speed control strategic time`. THE JOB states that only a Nexus-held sector pays Tax. THE FOUR NUMBERS has four lines starting CONTROL, UNREST, TAX YIELD, GARRISON CONDITION.
**Pass Criteria**: All three statements hold; the line count is exactly 4.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-04 — Card does not clip at 90 / 100 / 110 / 125 (AC6)

**Preconditions**: FNO, card up. Reuses `capture.mjs` step 1 selectors.
**Steps**:
1. For each scale in 90, 100, 110, 125: set the scale (harness assist), wait 350 ms.
2. Run `clippedSel` on `.wm-onboard-row b`, `.wm-onboard-row > span`, `.wm-onboard-lines > span`, `.wm-onboard`, `.wm-onboard .hud-btn`.
3. Screenshot `IF013-04-<scale>.png` and open it.
**Expected Result**: At every scale all four rows, every number line and the UNDERSTOOD button are fully visible inside the card and the viewport; no ellipsis, no cut glyphs, no scrollbar hiding a row.
**Pass Criteria**: `clippedSel` returns an empty list for all five selectors at all four scales, and visual inspection of the four PNGs finds no cut-off text.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-05 — UNDERSTOOD dismisses and marks `hint-worldmap` exactly once (AC2)

**Preconditions**: FNO, card up, text scale 100. Seen count for `hint-worldmap` is 0.
**Steps**:
1. Read the `hint-worldmap` seen count.
2. Click UNDERSTOOD (`button[aria-label="Dismiss the orientation"]`).
3. Wait 300 ms. Check `.wm-onboard` and read the seen count.
4. Read `useAppStore.getState().phase`.
**Expected Result**: Before: 0. After: the card is gone, the count is 1, and the phase is still `world` (overlay, no phase change).
**Pass Criteria**: Count goes 0 → 1; `.wm-onboard` absent; phase `world`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-06 — Card does not return after leaving World Network or after a reload (AC2)

**Preconditions**: IF013-05 just passed (card dismissed in this campaign).
**Steps**:
1. Click the top nav to Research, then back to World Network. Check `.wm-onboard`.
2. Wait at least 1 s (autosave delay is 500 ms). `eval` `localStorage.getItem('nexus-save-v1')` and confirm it contains `hint-worldmap`.
3. `reload`. Re-check the viewport is 1280x720. On the Menu click CONTINUE (`aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"`).
4. Check `.wm-onboard` and the `hint-worldmap` seen count.
**Expected Result**: The card is absent after the nav round trip and after reload + Continue. The saved blob holds `hint-worldmap`; after hydrate the seen-set holds it once.
**Pass Criteria**: `.wm-onboard` absent at step 1 and step 4; blob contains `hint-worldmap`; count is exactly 1 after reload. (The dev-story harness checked nav only; the reload is new coverage.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-07 — A new campaign shows the card again (AC2 boundary: "in that campaign")

**Preconditions**: IF013-06 done (save holds `hint-worldmap`).
**Steps**:
1. Go to the Menu. Click NEW OPERATION, then CONFIRM // ERASE SAVE?.
2. Check `.wm-onboard` and the `hint-worldmap` seen count.
**Expected Result**: The new campaign opens World Network with the card up; the seen count is 0 (New Operation resets the tutorial store).
**Pass Criteria**: Card present and count 0. If the card does not appear, record it against Core Rule 13 ("first visit") as a finding.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-08 — Influence 0, Europe focused: owner reasons on all three actions, no teaching panel (AC3)

**Preconditions**: FNO, card dismissed with UNDERSTOOD, text scale 100. `influence === 0`, `selected === 'eu'`, `hint-influence` unseen.
**Steps**:
1. Read each `.wm-act`: name, `.wm-act-status` text, `disabled`.
2. Check `.wm-moment` and `.wm-inset`.
3. Screenshot `IF013-08-100.png`.
**Expected Result**: Stabilize, Lobby and Expedite all read UNAFFORDABLE and are disabled. Expedite reads UNAFFORDABLE, not NO TARGET, because the seeded NEON GARDEN offer sits in Europe; the owner reports no-target before cost, so a target exists here. No teaching panel; the sector inset is shown. Status text is visible (not colour-only).
**Pass Criteria**: 3 actions, each UNAFFORDABLE and disabled; `.wm-moment` absent; `.wm-inset` present. (Known spec drift: the AC text expects Expedite NO TARGET on the opening focus; see IF013-09 and Concerns.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-09 — Influence 0, North America focused: Expedite shows its no-target reason (AC3)

**Preconditions**: As IF013-08.
**Steps**:
1. Click the NORTH AMERICA row in the left sector list (real click; the harness used `select('na')`).
2. Read the three `.wm-act` rows and check `.wm-moment`.
3. Screenshot `IF013-09-100.png`. Click EUROPE to restore focus.
**Expected Result**: Stabilize and Lobby read UNAFFORDABLE, Expedite reads NO TARGET; all disabled; no teaching panel.
**Pass Criteria**: Status triple is exactly UNAFFORDABLE / UNAFFORDABLE / NO TARGET; all disabled; `.wm-moment` absent.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-10 — Influence-0 sector panel does not clip at 90 / 100 / 110 / 125 (AC6 support)

**Preconditions**: As IF013-08 (Europe, Influence 0). Reuses `capture.mjs` step 3.
**Steps**:
1. For each scale: set it, wait 350 ms.
2. Run `clippedSel` on `.wm-act-name`, `.wm-act-status`, `.wm-right`; `eval` `.wm-right` `scrollHeight - clientHeight`.
3. Screenshot `IF013-10-<scale>.png` and open it.
**Expected Result**: Action names and reasons are fully readable at every scale; the right column does not overflow.
**Pass Criteria**: Empty clip lists and overflow ≤ 0 at all four scales; no visual cut-off.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-11 — Clean-win fixture: one teaching panel names the affordable action, cost and effect (AC4)

**Preconditions**: As IF013-08, scale 100, Europe focused, `hint-influence` unseen. Apply the clean-win fixture (`influence: 8`, harness assist; `capture.mjs` step 4).
**Steps**:
1. Wait 400 ms. Count `.wm-moment` elements and read the panel text.
2. Read the three `.wm-act` rows.
3. Read the `hint-influence` seen count.
4. Screenshot `IF013-11-100.png`.
**Expected Result**: Exactly one panel. Title `INFLUENCE // 1 STABILIZE`; body `Affordable now: 8 PTS for -12 UNREST OVER 6H on the focused sector. Field wins earn the points to spend.` The effect matches what the 1 STABILIZE button prints. Stabilize reads CLEAR and is enabled; Lobby and Expedite read UNAFFORDABLE. The panel takes the sector inset's slot; OPEN CONTRACTS still shows its list. `hint-influence` count is 1 (marked on firing, as implemented).
**Pass Criteria**: `.wm-moment` count = 1; title and body strings as above; status triple CLEAR / UNAFFORDABLE / UNAFFORDABLE with Stabilize enabled; seen count 1.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-12 — Teaching panel does not clip at 90 / 100 / 110 / 125 (AC6)

**Preconditions**: IF013-11 state (panel up). Reuses `capture.mjs` step 4.
**Steps**:
1. For each scale: set it, wait 350 ms.
2. Run `clippedSel` on `.wm-moment-title`, `.wm-moment-body`, `.wm-moment-btn`, `.wm-moment`, `.wm-right`; read `.wm-right` overflow; read `.wm-ops` bottom and height.
3. Screenshot `IF013-12-<scale>.png` and open it.
**Expected Result**: Title, body and UNDERSTOOD button fully visible at every scale; OPEN CONTRACTS stays on screen with a usable list.
**Pass Criteria**: Empty clip lists, overflow ≤ 0, `.wm-ops` bottom ≤ 720 and height > 60 px at all four scales; no visual cut-off.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-13 — Dismiss closes the panel; `hint-influence` stays seen once (AC4)

**Preconditions**: IF013-11 state, scale 100.
**Steps**:
1. Click UNDERSTOOD on the panel (`button[aria-label="Dismiss the Influence note"]`).
2. Wait 300 ms. Check `.wm-moment`, `.wm-inset`, and the `hint-influence` seen count.
**Expected Result**: Panel gone, inset back, count still 1 (dismiss is a no-op mark).
**Pass Criteria**: `.wm-moment` absent; `.wm-inset` present; count exactly 1.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-14 — Never returns after Influence is spent and recovers (AC4)

**Preconditions**: IF013-13 done, Europe focused, Influence 8.
**Steps**:
1. Click 1 STABILIZE (real spend). Read `influence` (expect 0) and check `.wm-moment`.
2. Apply `useWorldStore.setState({ influence: 20 })` (harness assist: recovery).
3. Focus each open sector in turn from the left list (Europe, Africa, Asia, Oceania, North America, South America), checking `.wm-moment` on each.
4. Top nav to Research and back. Check `.wm-moment`.
**Expected Result**: The spend succeeds and lowers Influence by 8. No teaching panel appears at any point, on any sector, though at least one action is now affordable.
**Pass Criteria**: Influence drops by 8 at step 1; `.wm-moment` absent at every check in steps 1, 3 and 4; `hint-influence` count stays 1. (Step 1 uses a real spend; the harness set 0 directly.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-15 — Never returns after reload (AC4 persistence)

**Preconditions**: IF013-14 done (Influence 20, `hint-influence` seen).
**Steps**:
1. Wait at least 1 s. `eval` `localStorage.getItem('nexus-save-v1')`; confirm it contains `hint-influence`.
2. `reload`; confirm 1280x720; click CONTINUE.
3. Read `influence` (affordable, ≥ 8) and check `.wm-moment` and `.wm-onboard`.
4. Read the seen-set.
**Expected Result**: After reload the campaign still holds enough Influence to afford an action, yet neither the teaching panel nor the orientation card shows. The seen-set holds `hint-worldmap` and `hint-influence` once each.
**Pass Criteria**: Blob contains `hint-influence`; `.wm-moment` and `.wm-onboard` absent; each id count exactly 1. (New coverage: code-review finding 6.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-16 (optional) — Real clean first win fires the moment (AC4, no fixture)

**Preconditions**: FNO, card dismissed, `hint-influence` unseen. Run only if session time allows; otherwise mark N/A (IF013-11 with the fixture is the stated evidence).
**Steps**:
1. Select NEON GARDEN, go through Brief and Assembly, deploy, win the mission cleanly (no casualties), and continue from Debrief to World Network.
2. Read `influence`. Focus Europe if not focused. Check `.wm-moment`.
**Expected Result**: Influence reads 8 after the clean win; one teaching panel names the first affordable action, its cost and effect, as in IF013-11.
**Pass Criteria**: `influence === 8`; `.wm-moment` count 1; title names an action whose button reads CLEAR.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-17 — Antarctica focused: no actions, no teaching panel (AC5)

**Preconditions**: FNO, card dismissed, `hint-influence` unseen. Clean-win fixture `influence: 8`, then `useWorldStore.getState().select('an')` in the same `eval` (harness assist; the Antarctica button is inert). Reuses `capture.mjs` step 6.
**Steps**:
1. For each scale 90 / 100 / 110 / 125: set it, wait 350 ms, count `.wm-act`, check `.wm-moment`, read the `hint-influence` count; screenshot `IF013-17-<scale>.png`.
2. At scale 100, click EUROPE in the left list. Wait 400 ms. Check `.wm-moment` and the count.
**Expected Result**: Antarctica shows no Influence actions and no panel at any scale; the moment stays unseen. Refocusing Europe from the same state fires it once.
**Pass Criteria**: Step 1: `.wm-act` count 0, `.wm-moment` absent, count 0 at all four scales. Step 2: `.wm-moment` count 1, `hint-influence` count 1.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-18 (observation) — Panel fired, then focus moves to Antarctica before dismiss

**Preconditions**: IF013-17 step 2 state (panel up on Europe).
**Steps**:
1. Without dismissing, set `select('an')` (harness assist). Read the panel text and `.wm-act` count; screenshot `IF013-18-100.png`.
**Expected Result**: Spec is silent. Record what shows: whether the panel stays up saying "on the focused sector" while Antarctica (no actions) is focused.
**Pass Criteria**: Observation only; no pass/fail. Log the result against code-review finding 1 for ux/owner review, not as a bug.
**Actual Result**:
**Pass/Fail**: N/A (observation)

## Test Case: IF013-19 (observation) — Leaving World Network with the panel up consumes the lesson

**Preconditions**: FNO, card dismissed, fixture `influence: 8`, Europe focused, panel up (not dismissed).
**Steps**:
1. Top nav to Research and back to World Network. Check `.wm-moment` and the `hint-influence` count.
**Expected Result**: As implemented (mark on firing) the panel does not return and the count is 1. The AC reads "dismiss marks it seen"; the owner ruling is pending.
**Pass Criteria**: Observation only. Record the result for the owner wording ruling (story Deviations, code-review finding 2).
**Actual Result**:
**Pass/Fail**: N/A (observation)

## Test Case: IF013-20 (optional, WN-020) — Scan at intel 1: Rust Haven selectable; Glass Veil and Hollow Crown locked

**Preconditions**: FNO, card dismissed. `intelLevel === 1`. No contract selected (`useAppStore.getState().missionId === null`).
**Steps**:
1. In OPEN CONTRACTS read the RUST HAVEN, GLASS VEIL and HOLLOW CROWN rows: subtitle text, lock glyph, `aria-disabled`, `aria-label`.
2. Click GLASS VEIL, then HOLLOW CROWN; read `missionId` after each.
3. Click RUST HAVEN; read `missionId`.
4. Screenshot `IF013-20-100.png`.
**Expected Result**: Glass Veil and Hollow Crown show the lock glyph and `REQUIRES INTEL LVL 2`, `aria-disabled="true"`, label `<CODENAME> // LOCKED // REQUIRES INTEL LVL 2`; clicking them does nothing. Rust Haven shows its type and city and selects.
**Pass Criteria**: Both locked rows print `REQUIRES INTEL LVL 2`; `missionId` stays `null` after step 2; `missionId` equals Rust Haven's id after step 3.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF013-21 (optional, WN-020) — Scan at intel 2: all three selectable

**Preconditions**: IF013-20 state. Apply `useCampaignStore.setState({ intelLevel: 2 })` (harness assist).
**Steps**:
1. Read the three rows as in IF013-20 step 1.
2. Click GLASS VEIL, read `missionId`; click HOLLOW CROWN, read `missionId`.
3. Screenshot `IF013-21-100.png`.
**Expected Result**: No row prints `REQUIRES INTEL LVL`; none is `aria-disabled`; each click selects that contract.
**Pass Criteria**: Zero locked rows among the three; `missionId` matches the clicked contract after each click.
**Actual Result**:
**Pass/Fail**:

---

## Session close

- Record any console or page errors seen during the session (none = pass for all cases above).
- Stop the dev server; confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` empty). Close the playwright-cli session.
- Update `production/qa/evidence/if-013/README.md` click-through note with the manual run (screens exercised, harness assists used).
