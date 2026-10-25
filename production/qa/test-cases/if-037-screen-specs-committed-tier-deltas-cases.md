# Test Cases: IF-037 — The five screen specs' committed-tier deltas are fixed

**Story**: `production/epics/interface/story-037-screen-specs-committed-tier-deltas.md`
**Story Type**: UI | **Output location**: `production/qa/evidence/sprint-011-head-2026-10-24/` | **Gate level**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Source**: the story's three Acceptance Criteria and its QA Test Cases; `production/qa/qa-strategy-sprint-011-2026-10-24.md` sections 4–6.
**Scripts**: R2 = `production/qa/evidence/screens-2026-10-23/sweep.mjs`; R3 = `production/qa/evidence/screens-2026-10-23/focus.mjs`. Run both unchanged. A FAIL is a finding for `/bug-report`, not a reason to edit a script. Hand-walk measurement code goes in a scratch file, never in the committed scripts.

## Common preconditions (every case)

- `npm run dev` serving on port 4200 at HEAD `131a5c1`.
- Headless Chrome for Testing (no visible window), viewport exactly 1280x720, driven by playwright-core the same way R2/R3 do it.
- Fresh state: `localStorage.clear()`, reload, `save.startNewOperation()`. First-visit hints `hint-worldmap`, `hint-influence` and `hint-debrief-research` are marked seen unless the case says otherwise. These are the harness assists named in the R2/R3 headers.
- Surfaces are reached the way the R2 `SURFACES` table reaches them: Menu, Settings (menu SETTINGS button), Research (`goto('research')`), Brief (`selectMission('m03')`), Assembly (`goto('team')`), Debrief (`setOutcome(settleOutcome(won))`), Mission HUD (`startMission`, then 6 s), Pause (Escape in the mission), Balance (Settings > OPEN, with one telemetry record seeded), World (`goto('world')`).
- Text scale and high contrast are set through `useSettingsStore` (`setTextScale`, `setHighContrast`); reduced motion through `setReducedMotion(true)`.
- Zero page errors in the run. A page error fails the case it happened in.
- After the run: stop the dev server, confirm nothing listens on port 4200, and close the browser.

Coverage legend: **Covered by R2/R3 check: `<name>`** = the check of that name in the script's output decides Pass/Fail. **Hand-walk** = no script check asserts it; measure it as the steps say.

---

## AC-1 — No clipping, truncation, text overlap or sideways scroll at 90 / 100 / 110 / 125

> GIVEN every surface at 1280x720 and text scales 90 / 100 / 110 / 125 WHEN measured THEN no text is cut by an ellipsis, no text line is drawn over another (visible parts only), and nothing else clips, spills or scrolls sideways (every `text-overflow: ellipsis` rule removed; Brief COMMS entries wrap; Research node labels use an em line pitch and follow the text scale up to 110% inside the fixed tree).

### TC-037-01 — Screen surfaces clean at all four scales

**Coverage**: Covered by R2 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (the `clipped('body')` pass: `truncated`, `textoverlap`, `hscroll`, `cut`, `clip`, `spill`, `overlap`, `boxoverlap` entries)
**AC covered**: AC-1 (ellipsis, text over text, clip, spill, sideways scroll inside scroll containers)
**Preconditions**: Common preconditions.
**Steps**:
1. Run `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/r2/ node production/qa/evidence/screens-2026-10-23/sweep.mjs` (all surfaces: menu, settings, research, brief, team, debrief, mission, pause, balance, world).
2. Open the written `sweep-output.txt`.
3. For each of Menu, Research, Brief, Assembly (`team`), Debrief, Mission HUD and World, read the four `clip @<scale>` lines.
4. Confirm the file ends `no page errors` and that no surface reads `NOT MEASURED`.

**Expected Result**: Every `clip @90/100/110/125` line reads `0` for all seven surfaces; no `NOT MEASURED` line; `no page errors`.
**Actual Result**:
**Pass/Fail**:

### TC-037-02 — Brief COMMS entries wrap instead of being cut

**Coverage**: Covered by R2 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` on surface `brief` (`truncated` and `textoverlap` entries)
**AC covered**: AC-1 (Brief COMMS entries wrap; the pre-fix COMMS overlap was found at 90%)
**Preconditions**: Common preconditions. R2 run from TC-037-01 complete.
**Steps**:
1. In `sweep-output.txt`, read the `## brief` block's four `clip @<scale>` lines.
2. Search the `## brief` block for any `truncated`, `textoverlap` or `clip` entry naming a COMMS element.
3. Open `brief-100.png` and `brief-90.png` (or the scale captures written) and look at the COMMS column.

**Expected Result**: All four counts are `0`; no entry names a COMMS element; in the captures every COMMS entry is shown in full on one or more lines, with no `…` and no line drawn over another.
**Actual Result**:
**Pass/Fail**:

### TC-037-03 — Research node labels: em line pitch, scale follows to 110% then caps

**Coverage**: Hand-walk (R2 `textoverlap` catches overlapping labels, but no R2/R3 check measures the label font size per scale or the `dy` unit)
**AC covered**: AC-1 (Research node labels use an em line pitch and follow the text scale up to 110% inside the fixed tree)
**Preconditions**: Common preconditions. Research screen open (`goto('research')`).
**Steps**:
1. At text scale 100, read for every `.rs-node-label` the computed `font-size` and the rendered size (`font-size` × the screen scale from `getScreenCTM()`, as R2 measures SVG text). Record the value for one reference label.
2. Read the `dy` attribute of every `tspan` after the first inside each `.rs-node-label`.
3. Set text scale 90, 110 and 125 in turn; after each, wait 300 ms and repeat step 1 for the same reference label.
4. At each scale, run R2's `clipped('body')` helper on the Research screen (scratch copy) and count `textoverlap` entries that name a node label.
5. At 125, read the bounding box of every `.rs-node` and confirm each label's box stays inside the tree's SVG viewBox on screen.

**Expected Result**: Every non-first `tspan` `dy` ends in `em`. The reference label's rendered size is 0.9×, 1.0×, 1.1× and 1.1× its 100% size at 90 / 100 / 110 / 125 (±0.1 px). `textoverlap` entries naming node labels = 0 at all four scales. No label box leaves the tree's SVG box at 125.
**Actual Result**:
**Pass/Fail**:

### TC-037-04 — Overlay dialogs (Settings from menu, Pause, Settings from Pause, Balance) clean at all four scales

**Coverage**: Hand-walk (R2's `clipped()` skips every element inside `.hud-menu-wrap` as a declared overlay. Settings, the Pause menu, Settings from Pause and Balance all render inside `.hud-menu-wrap` (`src/ui/index.tsx` 271, 1810; `src/ui/PauseMenu.tsx` 86, 93), so their `clip @<scale>` counts of 0 in R2 do not measure the dialogs' own text)
**AC covered**: AC-1 (every surface: the four overlay dialogs)
**Preconditions**: Common preconditions. A scratch copy of R2's `HELPERS` with `.hud-menu-wrap` removed from the `overlay()` selector (the copy only; the committed script stays unchanged).
**Steps**:
1. Open Settings from the Menu.
2. For each scale 90, 100, 110, 125: set the scale, wait 300 ms, install the scratch helpers, run `clipped('.hud-menu-wrap')`, and record the entries.
3. Scroll every scrollable region in the dialog (`overflow-y: auto|scroll`) to its end and repeat step 2 at 125.
4. Repeat steps 2–3 for: the Pause menu (mission, then Escape); Settings opened from Pause (`button[aria-label="Open settings"]`); Balance (Settings > OPEN with one seeded record).
5. Capture each dialog at 125 to the output folder.

**Expected Result**: `clipped('.hud-menu-wrap')` returns an empty list for all four dialogs at all four scales, before and after scrolling. In particular no `truncated`, `textoverlap`, `hscroll`, `cut`, `clip` or `spill` entry.
**Actual Result**:
**Pass/Fail**:

### TC-037-05 — Recruitment Market overlay clean at all four scales

**Coverage**: Hand-walk (the Recruitment Market is not an R2 surface)
**AC covered**: AC-1 (every surface: the Recruitment Market)
**Preconditions**: Common preconditions. Assembly open (`selectMission('m03')`, `goto('team')`), market opened by the RECRUIT control (`button[aria-label*="OPEN THE RECRUITMENT MARKET"]`).
**Steps**:
1. For each scale 90, 100, 110, 125: set the scale, wait 300 ms, install R2's helpers (scratch copy), run `clipped('.ts-recruit-overlay')`, record the entries.
2. Scroll the market's list to its end and repeat step 1 at 125.
3. Capture the market at 125.

**Expected Result**: Empty list at every scale, before and after scrolling. Every recruit's name, role and price is drawn in full, with no `…` in the capture.
**Actual Result**:
**Pass/Fail**:

### TC-037-06 — No page-level sideways scroll on any surface

**Coverage**: Hand-walk (R2's `hscroll` entry only tests elements whose `overflow-y` is `auto` or `scroll`; the document itself is not tested)
**AC covered**: AC-1 (nothing scrolls sideways)
**Preconditions**: Common preconditions.
**Steps**:
1. For each surface Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause, Balance, World, and the Recruitment Market: open it.
2. At each scale 90, 100, 110, 125: read `document.documentElement.scrollWidth`, `document.body.scrollWidth` and `window.scrollX` after `window.scrollTo(10000, 0)`.

**Expected Result**: For every surface at every scale, both `scrollWidth` values are ≤ 1280 and `window.scrollX` is 0 after the scroll attempt.
**Actual Result**:
**Pass/Fail**:

### TC-037-07 — Every `text-overflow: ellipsis` rule removed from source

**Coverage**: Hand-walk (static check; one command)
**AC covered**: AC-1 (every `text-overflow: ellipsis` rule removed)
**Preconditions**: Working tree at HEAD `131a5c1` for `src/` (the uncommitted changes in the tree are test files only).
**Steps**:
1. Run `rg -n "text-overflow" src`.
2. Run `rg -n "textOverflow" src`.

**Expected Result**: Both commands print nothing (exit code 1).
**Actual Result**:
**Pass/Fail**:

---

## AC-2 — Focus enters, is trapped, Escape closes the market, focus returns to the opener

> GIVEN the Settings opened from Pause, the Balance dashboard and the Recruitment Market WHEN opened, tabbed through and closed THEN focus enters the dialog, Tab stays inside, Escape closes the market, and focus returns to the control that opened each (SETTINGS, OPEN, RECRUIT); after the Debrief Research note's UNDERSTOOD, focus lands on RETURN TO WORLD NETWORK.

### TC-037-08 — Settings from Pause: focus enters and Tab stays inside

**Coverage**: Hand-walk (R3 checks only `Pause opens with focus on RESUME` and the return to SETTINGS; no R3 check asserts focus inside Settings or the Tab trap there)
**AC covered**: AC-2 (Settings from Pause: focus enters, Tab stays inside)
**Preconditions**: Common preconditions. Mission running on m03 (`selectMission('m03')`, `goto('team')`, `startMission`, wait 6 s), then paused (`setPaused(true)`).
**Steps**:
1. Confirm focus is on RESUME.
2. Activate `button[aria-label="Open settings"]` with Enter (keyboard).
3. Wait 400 ms; record `document.activeElement` and whether it is inside `.hud-menu-wrap[aria-label="Settings"]`.
4. Press Tab 30 times; after each press record whether the active element is inside the Settings dialog.
5. Press Shift+Tab 30 times; record the same after each press.

**Expected Result**: After step 3 the active element is inside the Settings dialog (not `body`, not the Pause menu). After every one of the 60 presses in steps 4–5 the active element is inside the Settings dialog.
**Actual Result**:
**Pass/Fail**:

### TC-037-09 — Settings from Pause: closing returns focus to SETTINGS

**Coverage**: Covered by R3 check: `closing Settings from Pause returns focus to SETTINGS` (precondition check: `Pause opens with focus on RESUME`)
**AC covered**: AC-2 (focus returns to SETTINGS)
**Preconditions**: Common preconditions.
**Steps**:
1. Run `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/r3/ node production/qa/evidence/screens-2026-10-23/focus.mjs`.
2. Open the written `focus-output.txt`; read the lines `Pause opens with focus on RESUME` and `closing Settings from Pause returns focus to SETTINGS`.

**Expected Result**: Both lines start `PASS`; the second reads `// Open settings`.
**Actual Result**:
**Pass/Fail**:

### TC-037-10 — Balance dashboard: focus enters, Tab stays inside, closing returns focus to OPEN

**Coverage**: Covered by R3 check: `Balance takes focus inside its panel`, `Tab stays inside Balance`, `closing Balance returns focus to its OPEN control`
**AC covered**: AC-2 (Balance: focus enters, Tab trap, focus returns to OPEN)
**Preconditions**: Common preconditions. R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the three named lines.

**Expected Result**: All three start `PASS`; the third reads `// Open the balance dashboard`.
**Actual Result**:
**Pass/Fail**:

### TC-037-11 — Recruitment Market: focus enters, Tab stays inside, Escape closes, focus returns to RECRUIT

**Coverage**: Covered by R3 check: `Recruitment Market takes focus`, `Tab stays inside the Recruitment Market`, `Escape closes the Recruitment Market`, `focus returns to the RECRUIT control`
**AC covered**: AC-2 (market: focus enters, Tab trap, Escape closes, focus returns to RECRUIT)
**Preconditions**: Common preconditions. R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the four named lines.

**Expected Result**: All four start `PASS`; the last names `OPEN THE RECRUITMENT MARKET`.
**Actual Result**:
**Pass/Fail**:

### TC-037-12 — Debrief Research note: UNDERSTOOD moves focus to RETURN TO WORLD NETWORK

**Coverage**: Covered by R3 check: `after UNDERSTOOD focus is on RETURN TO WORLD NETWORK`
**AC covered**: AC-2 (Debrief note's UNDERSTOOD → RETURN TO WORLD NETWORK)
**Preconditions**: Common preconditions, except `hint-debrief-research` is not marked seen (R3 sets this). R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the named line.
2. Confirm the line `Debrief research note shows on the first Debrief` does not appear (it only prints, as FAIL, when the note is missing).

**Expected Result**: The line starts `PASS` and reads `// RETURN TO WORLD NETWORK`; no `Debrief research note shows on the first Debrief` line.
**Actual Result**:
**Pass/Fail**:

### TC-037-13 — Mouse open and on-screen close also return focus to the opener

**Coverage**: Hand-walk (R3 opens with keyboard and closes with Escape only; the AC says "closed" without naming the key, and ADR-0017 is keyboard and mouse)
**AC covered**: AC-2 (focus returns to SETTINGS / OPEN / RECRUIT when closed by the dialog's own close control)
**Preconditions**: Common preconditions.
**Steps**:
1. Mission paused (as TC-037-08). Click `button[aria-label="Open settings"]` with the mouse. Wait 400 ms. Activate the Settings dialog's own close/back control with Enter. Record the active element.
2. Menu > SETTINGS with one telemetry record seeded. Click OPEN (`button[aria-label="Open the balance dashboard"]`). Wait 400 ms. Activate Balance's CLOSE control with Enter. Record the active element.
3. Assembly on m03. Click the RECRUIT control (`button[aria-label*="OPEN THE RECRUITMENT MARKET"]`). Wait 400 ms. Record whether focus is inside `.ts-recruit`. Activate `CLOSE THE RECRUITMENT MARKET` with Enter. Record the active element and whether `.ts-recruit` is gone.

**Expected Result**: Step 1 active element is `Open settings`. Step 2 is `Open the balance dashboard`. Step 3: focus inside `.ts-recruit` after opening; after closing `.ts-recruit` is absent and the active element's label contains `OPEN THE RECRUITMENT MARKET`.
**Actual Result**:
**Pass/Fail**:

---

## AC-3 — Reduced motion and never colour alone

> GIVEN reduced motion WHEN an overlay opens THEN it prints with no fade; a researched Research node carries a check glyph besides green; a selected Settings segment or ON toggle is framed (2 px teal), not marked by amber hue; Debrief invoice rows print by a ≤120 ms fade with no travel.

### TC-037-14 — Reduced motion: Settings overlay from the Menu prints with no fade

**Coverage**: Covered by R3 check: `reduced motion: the overlay has no fade-in`
**AC covered**: AC-3 (overlay prints with no fade; Settings from the Menu)
**Preconditions**: Common preconditions. R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the named line.

**Expected Result**: The line starts `PASS` and reads `// none`.
**Actual Result**:
**Pass/Fail**:

### TC-037-15 — Reduced motion: every other overlay prints with no fade

**Coverage**: Hand-walk (R3 tests only the Settings overlay opened from the Menu)
**AC covered**: AC-3 (overlay prints with no fade: Pause, Settings from Pause, Balance, Recruitment Market, World Network first-visit card)
**Preconditions**: Common preconditions. `setReducedMotion(true)` before each overlay is opened; confirm `document.documentElement.classList.contains('s-reduce-motion')`.
**Steps**:
1. Mission on m03, press Escape. Within 50 ms, read on the Pause `.hud-menu-wrap` and every descendant: `getAnimations()` and computed `animationName`; also its computed `opacity`.
2. From Pause, open Settings; repeat step 1's reads on the Settings `.hud-menu-wrap`.
3. Menu > Settings > OPEN (one record seeded); repeat on the Balance `.hud-menu-wrap`.
4. Assembly > RECRUIT; repeat on `.ts-recruit-overlay` and `.ts-recruit`.
5. World Network with `hint-worldmap` not seen; repeat on `.wm-onboard-wrap`.

**Expected Result**: For each overlay root and panel: computed `animationName` is `none` (or no opacity/transform animation is listed by `getAnimations()`), and computed `opacity` is `1` on the first read.
**Actual Result**:
**Pass/Fail**:

### TC-037-16 — Researched Research node draws the check glyph

**Coverage**: Covered by R3 check: `every researched node draws the check glyph`
**AC covered**: AC-3 (researched node carries a check glyph)
**Preconditions**: Common preconditions. R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the named line.

**Expected Result**: The line starts `PASS`; the JSON detail is a non-empty array of `true` only.
**Actual Result**:
**Pass/Fail**:

### TC-037-17 — Check glyph is shown under reduced motion and besides green, legible in grayscale

**Coverage**: Hand-walk (R3 checks the glyph element exists with reduced motion off; it does not read its colour, run it under reduced motion, or test the non-colour cue)
**AC covered**: AC-3 (GIVEN reduced motion; check glyph besides green, i.e. not colour alone)
**Preconditions**: Common preconditions. `setReducedMotion(true)`. Research state seeded with `b-propellants` done (as R3 does), then `goto('research')`.
**Steps**:
1. For every `.rs-node.researched`, confirm a child `.rs-node-done` exists, is visible (non-zero bounding box) and record its computed `color`.
2. Read the computed value of `--green` on `:root`.
3. For a node that is not researched, confirm it has no `.rs-node-done`.
4. Apply `filter: grayscale(1)` to `document.documentElement` and capture the researched node and one unresearched neighbour.

**Expected Result**: Every researched node has a visible `.rs-node-done` whose `color` equals the `--green` value; no unresearched node has one; in the grayscale capture the researched node is told apart from its neighbour by the check glyph.
**Actual Result**:
**Pass/Fail**:

### TC-037-18 — Selected text-scale segment is framed 2 px teal, not amber

**Coverage**: Covered by R3 check: `selected segment is framed teal, not amber`
**AC covered**: AC-3 (selected Settings segment framed 2 px teal, not amber)
**Preconditions**: Common preconditions. R3 run from TC-037-09 complete.
**Steps**:
1. In `focus-output.txt`, read the named line.

**Expected Result**: The line starts `PASS`; detail shows `cls` containing `sel`, `color` `rgb(126, 240, 212)`, `border` `2px solid`.
**Actual Result**:
**Pass/Fail**:

### TC-037-19 — Every other selected segment and every ON toggle is framed 2 px teal, not amber

**Coverage**: Hand-walk (R3 reads only the text-scale segment, with reduced motion off; ON toggles and the Difficulty and Quality segments are not checked)
**AC covered**: AC-3 (selected segment or ON toggle framed 2 px teal, not amber hue)
**Preconditions**: Common preconditions. `setReducedMotion(true)` (this turns the Reduced motion toggle ON, so at least one ON toggle exists). Menu > SETTINGS open.
**Steps**:
1. For every `.set-scale-btn[aria-pressed="true"]` (text scale, Difficulty, Quality) read `className`, computed `color`, `borderTopWidth`, `borderTopStyle`, `borderTopColor`.
2. For every `.set-toggle-btn` read its on/off state (`aria-pressed` or label) and the same computed values.
3. Read the same values for one unselected segment and one OFF toggle.
4. Capture the Settings panel with `filter: grayscale(1)`.

**Expected Result**: Every selected segment and every ON toggle: `className` contains `sel` and not `amber`; `color` and `borderTopColor` `rgb(126, 240, 212)`; border `2px solid`. Unselected segments and OFF toggles have no `sel` class and a border that is not `2px solid rgb(126, 240, 212)`. In the grayscale capture the selected/ON controls are told apart by the frame.
**Actual Result**:
**Pass/Fail**:

### TC-037-20 — Reduced motion: Debrief invoice rows print by a ≤120 ms fade with no travel

**Coverage**: Hand-walk (no R2/R3 check reads the invoice row animation)
**AC covered**: AC-3 (Debrief invoice rows print by a ≤120 ms fade with no travel)
**Preconditions**: Common preconditions. `setReducedMotion(true)`. Debrief reached as R2's `debrief` surface does (won outcome via `settleOutcome`).
**Steps**:
1. As soon as `.db-filing` appears, for each `.db-row` read `getAnimations()`: name, `effect.getTiming().duration`, and `effect.getKeyframes()`.
2. For the first three rows, record `getBoundingClientRect()` at the first read and again after every animation has finished.
3. Record each row's computed `opacity` after the animations finish.

**Expected Result**: Every `.db-row` animation is `row-in` with duration ≤ 120 ms; its keyframes change only `opacity` (no `transform`, `top`, `left`, `translate`); each row's rect `x`/`y` is identical (±0.5 px) at start and end; final `opacity` is `1`.
**Actual Result**:
**Pass/Fail**:

---

## Coverage summary

| AC | Cases | R2 | R3 | Hand-walk |
|---|---|---|---|---|
| AC-1 | TC-037-01 to 07 | 01, 02 | — | 03, 04, 05, 06, 07 |
| AC-2 | TC-037-08 to 13 | — | 09, 10, 11, 12 | 08, 13 |
| AC-3 | TC-037-14 to 20 | — | 14, 16, 18 | 15, 17, 19, 20 |
