# IF-035 — Remaining World Network pointer targets meet 24×24 — Manual test cases

**Story**: `production/epics/interface/story-035-remaining-world-network-pointer-targets-meet-24-px.md`
**Story type**: UI | **Gate**: BLOCKING | **Evidence output**: `production/qa/evidence/sprint-011-head-2026-10-24/` (R1 output and hand-walk captures; never over the committed `production/qa/evidence/sprint-011/` outputs, per QA strategy §4 rule 2)
**Build under test**: HEAD `131a5c1` — the final sprint build. IF-035 is screen-wide: the QA plan's Definition of Done (`production/qa/qa-plan-sprint-011-2026-10-23.md` line 65) and QA strategy §2/§5 F1 require it measured on this build. The committed probe output (`sprint-011/probe-output.txt`, IF-035 lines 145, 150-152) is from `ad176af` and does not count as a pass here.
**Sources**: story Acceptance Criteria and `## QA Test Cases` (AC-1 `remaining-hit-targets`, AC-2 guard); QA plan line 38 and line 154; QA strategy §6 IF-035 row ("Every listed target >=24x24; `FEED CLEAR` N/A; four nav tabs; `UNDERSTOOD` x2", R1, BLOCKING refresh).
**Governing standard**: WCAG 2.2 SC 2.5.8 (AA, 24×24 CSS px), owner decision 2026-10-23; `design/ux/world-network.md` Open Question 21 and Input checklist.

## AC map

| AC | Text (short) | Cases |
|----|--------------|-------|
| AC-1 | At 1280×720, text scale 100%: Pause/Resume, `n UNREAD`, `> GO LIVE`, Scan view controls (zoom out, zoom in, HOME, FOCUS SECTOR, SOUTH POLE, LABELS), imagery credit link, `UNDERSTOOD` on the card and on the Influence note, the four nav tabs: each hit area ≥24×24 CSS px, or a named SC 2.5.8 exception with its measurement | IF035-01, -02, -03, -04, -05, -06, -07, -08, -09, -10, -11 |
| AC-1 edge cases | `FEED CLEAR` N/A (not interactive); view controls present (bar stays this sprint, owner 2026-10-23), so not N/A; Scan markers not measured | IF035-12, -13 |
| AC-2 (guard) | No enlarged hit area overlaps a neighbouring target (transport row, globe toolbar, nav) | IF035-14, -15, -16, -17 |
| Run record | R1 on HEAD, zero console/page errors, README names the commit | IF035-00, IF035-18 |

## Common setup (all cases)

- Server: `npm run dev` (Vite, port 4200 from `vite.config.ts`). Confirm a listener on 4200 before starting. At the end, stop it and confirm nothing listens on 4200.
- Browser: headless Chrome for Testing only, via `npx playwright-cli` or the R1 probe's `playwright-core` launch. Never the in-app pane, never the user's Chrome. Viewport exactly 1280×720; confirm `[innerWidth, innerHeight]` = `[1280, 720]` after every navigation or reload.
- Text scale 100%: after `fresh()` (localStorage cleared), confirm `useSettingsStore.getState().textScale === 100`, or set it with `setTextScale(100)`. High contrast off.
- Fixtures: the state names below are the `STATES` keys and helpers in `production/qa/evidence/sprint-011/probe.mjs` (`fresh()`, `enter(name)`, `onScreen(phase)`, `pause()`, `dismissCard()`). Hand-walks reproduce the same store calls through `eval`.
- Measurement: "box" = `getBoundingClientRect()` of the target element, rounded to 0.1 px (the probe's `box()` helper). Before reading a box, confirm the screen is settled: `document.getAnimations().filter(a => a.playState === 'running').length === 0` (QA strategy F2: the orientation card fade).
- Record console and page errors for the whole session. Any `pageerror` or console `error` fails the case in which it appears.
- Screenshots: `production/qa/evidence/sprint-011-head-2026-10-24/if-035-<case-id>.png`, 1280×720.

---

## Test Case: IF035-00 — R1 probe runs on HEAD
**Covered by**: precondition run for every "Covered by R1 probe check" case below
**AC covered**: AC-1 (run record)
**Preconditions**: Working tree at HEAD `131a5c1`, `git status` shows no change under `src/`. Dev server listening on 4200.
**Steps**:
  1. Run `git rev-parse --short HEAD`; record the value.
  2. Run `git status --porcelain -- src`; record the output.
  3. Run `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`.
  4. Record the exit code and the last two lines of the new `probe-output.txt`.
**Expected Result**: HEAD is `131a5c1`; step 2 prints nothing; the probe exits 0; the last two lines are `no console or page errors` and `ALL PASS`; the output and PNGs are in the new folder, and the committed `sprint-011/probe-output.txt` is unchanged (`git diff --quiet -- production/qa/evidence/sprint-011/` exits 0).
**Pass Criteria**: All four of: HEAD = `131a5c1`, clean `src/`, exit code 0, `ALL PASS` with `no console or page errors`.
**Actual Result**:
**Pass/Fail**:

---

## AC-1 — each target ≥24×24 at 1280×720, 100%

### Test Case: IF035-01 — Transport-row, Feed, toolbar, credit and nav targets on World Network (aggregate)
**Covered by R1 probe check**: `IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24`
**AC covered**: AC-1 (Pause, `n UNREAD`, six view controls, credit link, four nav tabs on World Network)
**Preconditions**: IF035-00 passed. Fixture: `opening` (fresh New Operation, card dismissed, paused) with 14 Feed events seeded and `unread: 3` (probe block "IF-031 to IF-035: hit targets at 100%").
**Steps**:
  1. Open the HEAD `probe-output.txt`.
  2. Find the line containing `IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24`.
  3. Read its status and its detail after `//`.
  4. Open `if-031-035-targets.png` from the HEAD output folder and confirm it shows the World Network at 1280×720 with the `3 UNREAD` control, the transport row, the globe toolbar and the credit link visible.
**Expected Result**: `PASS IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24 // 13 targets`. 13 = 1 Pause + 1 `n UNREAD` + 6 globe toolbar + 1 credit + 4 nav tabs.
**Pass Criteria**: Status is `PASS` **and** the detail reads exactly `13 targets`. A PASS with fewer than 13 is a FAIL of this case (the probe accepts `>= 9`, so a missing target can pass the probe; see IF035-02).
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-02 — Per-target measurements for the 13 World Network targets
**Hand-walk** (the R1 line prints only a count; the story's evidence must name each measured value)
**AC covered**: AC-1
**Preconditions**: Fixture `opening` with 14 seeded events and `unread: 3`, as IF035-01. Settled (no running animations). Viewport 1280×720, text scale 100%.
**Steps**:
  1. `eval` the box of each element, labelled by `aria-label` or text: `.wm-tbtn:first-child`, `.wm-unread`, each `.globe-toolbar button` (expect six), `.globe-credit`, each `.navtab` (expect four).
  2. Record the 13 rows (label, x, y, w, h) in the Actual Result.
  3. Confirm by label that every one of these is present: `RESUME STRATEGIC CLOCK` (paused), `3 UNREAD` (or its aria-label), `Zoom out`, `Zoom in`, `HOME`, `FOCUS SECTOR`, `SOUTH POLE`, `LABELS`, `EARTH IMAGERY · NASA`, `WORLD NETWORK`, `RESEARCH`, `BRIEF // LOCKED // ...`, `ASSEMBLY`.
  4. Capture `if-035-IF035-02.png`.
**Expected Result**: 13 rows, all named targets present, each `w >= 24` and `h >= 24`.
**Pass Criteria**: Every one of the 13 named targets is present and each has `w >= 24 && h >= 24`. Any target under 24 on either axis: run IF035-11 for it; this case passes only if IF035-11 passes for every such target.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-03 — Pause/Resume in both states
**Hand-walk** (R1 measures the button only while paused, label `RESUME STRATEGIC CLOCK`; the glyph and label change with state)
**AC covered**: AC-1 (Pause/Resume)
**Preconditions**: Fixture `opening` (card dismissed). Viewport 1280×720, text scale 100%.
**Steps**:
  1. Set `useWorldStore.setState({ paused: true })`; wait for settle.
  2. Read `aria-label` and box of `.wm-tbtn:first-child`.
  3. Set `useWorldStore.setState({ paused: false })`; wait for settle.
  4. Read `aria-label` and box of `.wm-tbtn:first-child` again.
  5. Set paused back to `true` (so nothing moves for the capture); capture `if-035-IF035-03.png`.
**Expected Result**: Step 2 label `RESUME STRATEGIC CLOCK`, step 4 label `PAUSE STRATEGIC CLOCK`; both boxes `w >= 24` and `h >= 24`.
**Pass Criteria**: Both labels as stated and both boxes ≥24×24.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-04 — `> GO LIVE` button in Review
**Covered by R1 probe check**: `IF-035 > GO LIVE button >= 24x24`
**AC covered**: AC-1 (`> GO LIVE`)
**Preconditions**: IF035-00 passed. Fixture: `review` (`opening`, then `t = 30 h` and `setReview(24 h)`, so Review is off NOW).
**Steps**:
  1. In the HEAD `probe-output.txt`, find the line containing `IF-035 > GO LIVE button >= 24x24`.
  2. Read status and the JSON box list.
  3. Open `state-review.png` from the HEAD output and confirm `> GO LIVE` is visible.
**Expected Result**: `PASS`, the JSON holds exactly one box (the whole `.wm-live.review` button) with `w >= 24` and `h >= 24` (at `ad176af` it read `w 93.9, h 24`).
**Pass Criteria**: Status `PASS`, exactly one box, `w >= 24 && h >= 24`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-05 — `UNDERSTOOD` on the first-visit orientation card
**Covered by R1 probe check**: `IF-035 card UNDERSTOOD >= 24x24`
**AC covered**: AC-1 (`UNDERSTOOD` on the card)
**Preconditions**: IF035-00 passed. Fixture: `opening-card` (fresh New Operation, card not dismissed, paused).
**Steps**:
  1. In the HEAD `probe-output.txt`, find the line containing `IF-035 card UNDERSTOOD >= 24x24`.
  2. Read status and the JSON box list.
  3. Open `state-opening-card.png` from the HEAD output and confirm the card is fully drawn (not mid-fade: text at full ink, not translucent).
**Expected Result**: `PASS`, exactly one `.wm-onboard .hud-btn` box, `w >= 24` and `h >= 24` (at `ad176af`: `w 140.1, h 26`).
**Pass Criteria**: Status `PASS`, exactly one box, ≥24×24, and the capture shows the settled card. If the capture shows the card mid-fade, mark FAIL-of-run and re-measure by hand per IF035-02's method with no running animations.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-06 — `UNDERSTOOD` on the Influence moment note
**Covered by R1 probe check**: `IF-035 Influence note UNDERSTOOD >= 24x24`
**AC covered**: AC-1 (`UNDERSTOOD` on the Influence note)
**Preconditions**: IF035-00 passed. Fixture: `influence-note` (fresh, card dismissed, paused, `influence: 8`, `selected: 'na'`: an action affordable for the first time).
**Steps**:
  1. In the HEAD `probe-output.txt`, find the line containing `IF-035 Influence note UNDERSTOOD >= 24x24`.
  2. Read status and the JSON box list.
  3. Open `if-035-influence-note.png` from the HEAD output and confirm the note with `UNDERSTOOD` is visible.
**Expected Result**: `PASS`, exactly one `.wm-moment-btn` box, `w >= 24` and `h >= 24` (at `ad176af`: `w 96.2, h 24`).
**Pass Criteria**: Status `PASS`, exactly one box, ≥24×24.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-07 — Nav tabs on Research
**Hand-walk** (R1's IF-035 check measures nav tabs on World Network only; the QA case requires all four Screens)
**AC covered**: AC-1 (four nav tabs)
**Preconditions**: Probe `onScreen('research')`: fixture `opening`, then `goto('research')`. Settled. 1280×720, 100%.
**Steps**:
  1. Read the box, `aria-label` and class of each visible `.navtab`.
  2. Capture `if-035-IF035-07.png`.
**Expected Result**: Four tabs (`WORLD NETWORK`, `RESEARCH` active, `BRIEF` locked, `ASSEMBLY`), each ≥24×24.
**Pass Criteria**: Exactly four tabs, each `w >= 24 && h >= 24`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-08 — Nav tabs on Assembly
**Hand-walk** (as IF035-07)
**AC covered**: AC-1 (four nav tabs)
**Preconditions**: Probe `onScreen('team')`: fixture `opening`, then `goto('team')`. Settled. 1280×720, 100%.
**Steps**:
  1. Read the box, `aria-label` and class of each visible `.navtab`.
  2. Capture `if-035-IF035-08.png`.
**Expected Result**: Four tabs, `ASSEMBLY` active, each ≥24×24.
**Pass Criteria**: Exactly four tabs, each `w >= 24 && h >= 24`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-09 — Nav tabs on Brief (Brief unlocked)
**Hand-walk** (as IF035-07)
**AC covered**: AC-1 (four nav tabs; "Brief locked and unlocked")
**Preconditions**: Probe `onScreen('brief')`: fixture `opening`, then `selectMission('m03')`. Settled. 1280×720, 100%.
**Steps**:
  1. Confirm `useAppStore.getState().phase === 'brief'` and `missionId === 'm03'`.
  2. Read the box, `aria-label` and class of each visible `.navtab`.
  3. Capture `if-035-IF035-09.png`.
**Expected Result**: Four tabs, `BRIEF` active (no `LOCKED`), each ≥24×24.
**Pass Criteria**: Exactly four tabs, each `w >= 24 && h >= 24`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-10 — Nav tabs with Brief locked vs unlocked, from World Network
**Hand-walk** (the locked tab renders a two-line layout — label, lock glyph, `LOCKED`, condition — so its box differs from the open tab's; R1 measures only the locked form)
**AC covered**: AC-1 (four nav tabs; "Brief locked and unlocked")
**Preconditions**: Fixture `opening` (no contract selected). 1280×720, 100%.
**Steps**:
  1. Confirm the `BRIEF` tab's `aria-label` starts `BRIEF // LOCKED //` and it carries `aria-disabled="true"`. Read the four `.navtab` boxes.
  2. Call `selectMission('m03')`, then `goto('world')`; wait for settle.
  3. Confirm the `BRIEF` tab's `aria-label` is `BRIEF` (no `LOCKED`). If it still reads locked, record that and the value of `useAppStore.getState().missionId`, and mark this step's unlocked measurement as covered by IF035-09 only.
  4. Read the four `.navtab` boxes again.
  5. Capture `if-035-IF035-10-locked.png` (after step 1) and `if-035-IF035-10-open.png` (after step 4).
**Expected Result**: In both states, four tabs, each ≥24×24.
**Pass Criteria**: Every tab box in steps 1 and 4 has `w >= 24 && h >= 24`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-11 — SC 2.5.8 exception test for any target under 24 px (conditional)
**Hand-walk** (run only if IF035-01 to -10 report a target under 24 px on either axis; otherwise record "Not triggered: no target under 24 px")
**AC covered**: AC-1 (exception path)
**Preconditions**: The failing target's fixture from the case that found it. 1280×720, 100%.
**Steps**:
  1. Measure the true hit area: scan `document.elementFromPoint` across a grid from 20 px outside the box to 20 px past it (1 px steps) and record the width and height of the region where `.closest(<target selector>)` returns the target (the method R1 uses for the Timeline, IF-032). If both are ≥24, record the hit area and stop: the target passes on hit area.
  2. Otherwise, spacing exception: draw a 24 px diameter circle centred on the target's box centre; for every other pointer target within 48 px (buttons, links, `[role=button]`, `[tabindex]`), compute whether the circle intersects that target's box or that target's own 24 px circle (if it is also undersized).
  3. Equivalent exception: name the other control on the same screen that performs the same function and meets 24×24 (record its selector and box).
  4. Inline exception: record whether the target sits in a sentence of running text.
  5. Read the HEAD evidence README for the target's named exception.
**Expected Result**: Either the hit area is ≥24×24, or one exception holds with its measurement, and the README names that exception and measurement. The story notes the credit link stands alone, so inline is not expected to apply to it.
**Pass Criteria**: Hit area ≥24×24, **or** (spacing circle intersects no target or circle, **or** an equivalent ≥24×24 control is named) **and** the README names the exception with the number. Anything else is a FAIL to file with `/bug-report`.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-12 — `FEED CLEAR` is not a pointer target (N/A record)
**Hand-walk** (R1 seeds `unread: 3`, so `FEED CLEAR` never renders in the probe)
**AC covered**: AC-1 edge case (`FEED CLEAR` recorded N/A)
**Preconditions**: Fixture `opening` with `useWorldStore.setState({ unread: 0 })`. Settled. 1280×720, 100%.
**Steps**:
  1. Find the element whose text is `FEED CLEAR`. Read `tagName`, `getAttribute('role')`, `tabIndex`, `onclick`, and `getComputedStyle(el).cursor`.
  2. Confirm no `.wm-unread` element exists.
  3. Press Tab through the Feed header region and confirm focus never lands on `FEED CLEAR`.
  4. Capture `if-035-IF035-12.png`.
**Expected Result**: `FEED CLEAR` is a `SPAN`, no role, `tabIndex` -1, no click handler, cursor not `pointer`; `.wm-unread` absent; never focused.
**Pass Criteria**: All of step 1's values as stated and steps 2-3 hold. Then record `FEED CLEAR: N/A (not interactive)` in the README. If it is focusable or clickable, it becomes a target: FAIL unless it measures ≥24×24.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-13 — View controls present (not N/A); Scan markers excluded
**Hand-walk** (R1's `>= 9` threshold would not catch a missing toolbar button)
**AC covered**: AC-1 edge case (view-control bar stays this sprint, owner 2026-10-23; Scan markers not measured)
**Preconditions**: Fixture `opening`. 1280×720, 100%.
**Steps**:
  1. Count visible `.globe-toolbar button` elements and read each label.
  2. Confirm the `.globe-credit` link is visible and is an `<a>` with an `href`.
  3. Confirm the set of measured selectors in IF035-02 does not include `[data-marker]` (Scan markers).
**Expected Result**: Six buttons — `Zoom out`, `Zoom in`, `HOME`, `FOCUS SECTOR`, `SOUTH POLE`, `LABELS`; credit link visible; no marker in the measured set.
**Pass Criteria**: Exactly those six labels and the credit link visible. If the toolbar is absent, FAIL (the owner kept it this sprint); do not record N/A.
**Actual Result**:
**Pass/Fail**:

---

## AC-2 (guard) — no enlarged hit area overlaps a neighbour

R1 has no box-overlap check for these groups. Its `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` line confirms only that each transport button's centre point hits that button; it is cited as supporting evidence in IF035-14, not as coverage. Record each result separately in the README under "IF-035 AC-2".

Overlap test used below: for every pair (A, B) in the group, the box intersection area is `max(0, min(A.right, B.right) - max(A.left, B.left)) × max(0, min(A.bottom, B.bottom) - max(A.top, B.top))`. Pairs whose intersection is above 0.5 px on both axes overlap. Then hit-test: `elementFromPoint` at each target's centre and at its four corners inset by 1 px must return that target (or a descendant of it).

### Test Case: IF035-14 — Transport row: Pause and 1X-8X do not overlap
**Hand-walk** (supporting: R1 `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons`)
**AC covered**: AC-2 (transport row)
**Preconditions**: Fixture `opening`, paused. 1280×720, 100%.
**Steps**:
  1. Read the boxes of all `.wm-tbtn` (expect five: Pause/Resume, 1X, 2X, 4X, 8X).
  2. Apply the overlap test to every pair.
  3. Hit-test each button's centre and four inset corners.
  4. Repeat steps 1-3 unpaused (`paused: false`), since the Pause glyph changes.
  5. Read the HEAD R1 line `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` and record its status.
**Expected Result**: Five buttons in both states; no pair overlaps; all 25 hit points return their own button in both states; R1 line PASS with `"transport":true`.
**Pass Criteria**: Zero overlapping pairs and zero hit-test misses in both states.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-15 — Globe toolbar buttons do not overlap each other or the credit link
**Hand-walk**
**AC covered**: AC-2 (globe toolbar)
**Preconditions**: Fixture `opening`. 1280×720, 100%.
**Steps**:
  1. Read the boxes of the six `.globe-toolbar button` elements and `.globe-credit`.
  2. Apply the overlap test to every pair among the seven.
  3. Hit-test each of the seven at centre and four inset corners.
  4. Toggle `LABELS` (click it), wait for settle, and repeat steps 1-3 (its `aria-pressed` state can restyle it). Click it again to restore.
  5. Capture `if-035-IF035-15.png`.
**Expected Result**: No pair overlaps; all hit points return their own control, in both `LABELS` states.
**Pass Criteria**: Zero overlapping pairs and zero hit-test misses in both states.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-16 — Nav tabs do not overlap, on all four Screens and with Brief locked/unlocked
**Hand-walk**
**AC covered**: AC-2 (nav)
**Preconditions**: The fixtures of IF035-02 (World Network, Brief locked), IF035-07 (Research), IF035-08 (Assembly), IF035-09 (Brief), and IF035-10 step 4 (World Network, Brief unlocked). 1280×720, 100%.
**Steps**:
  1. In each of the five states, read the four `.navtab` boxes.
  2. Apply the overlap test to every pair (6 pairs per state).
  3. Hit-test each tab at centre and four inset corners.
**Expected Result**: No overlap and no hit-test miss in any of the five states. The locked `BRIEF` tab's two-line layout does not push into `RESEARCH` or `ASSEMBLY`.
**Pass Criteria**: Zero overlapping pairs and zero misses across 30 pairs and 100 hit points.
**Actual Result**:
**Pass/Fail**:

### Test Case: IF035-17 — Other enlarged targets clear their neighbours
**Hand-walk** (the AC's parenthesis names three groups; these are the remaining targets the story enlarged)
**AC covered**: AC-2
**Preconditions**: As named per step. 1280×720, 100%.
**Steps**:
  1. Fixture `opening`, 14 events, `unread: 3`: read `.wm-unread` and every visible pointer target within 48 px of it (Feed rows `.wm-feed-line`, Feed header controls). Apply the overlap test and hit-test `.wm-unread`.
  2. Fixture `review`: read `.wm-live.review` and every visible pointer target within 48 px (Timeline `.wm-tl-track`, `.wm-tbtn`). Apply the overlap test and hit-test `.wm-live.review`.
  3. Fixture `influence-note`: read `.wm-moment-btn` and every visible pointer target within 48 px. Apply the overlap test and hit-test it.
  4. Fixture `opening-card`: read `.wm-onboard .hud-btn` and every pointer target inside `.wm-onboard`. Apply the overlap test and hit-test it. (Controls under the card are excluded: the card is a declared overlay.)
**Expected Result**: No overlap with any neighbour; each target's five hit points return the target.
**Pass Criteria**: Zero overlapping pairs and zero misses in all four steps.
**Actual Result**:
**Pass/Fail**:

---

## Run close

### Test Case: IF035-18 — Evidence README and teardown
**Hand-walk**
**AC covered**: AC-1 and AC-2 (evidence record)
**Preconditions**: IF035-00 to -17 executed.
**Steps**:
  1. Confirm the HEAD evidence README states the commit `131a5c1` and the words "final sprint build".
  2. Confirm it lists each AC-1 target with its measured box (from IF035-02 to -10), `FEED CLEAR: N/A (not interactive)`, Scan markers not measured, and any exception from IF035-11 with its measurement (or "none").
  3. Confirm AC-2's result is recorded separately from AC-1 (IF035-14 to -17).
  4. Confirm every capture named in these cases exists at 1280×720 (`sips -g pixelWidth -g pixelHeight` or equivalent).
  5. Close every browser and tab opened; stop the dev server; run `lsof -nP -iTCP:4200 -sTCP:LISTEN`.
**Expected Result**: README complete as listed; all captures 1280×720; `lsof` prints nothing.
**Pass Criteria**: All of steps 1-4 hold and step 5 prints nothing.
**Actual Result**:
**Pass/Fail**:

---

## Coverage summary

| Case | Mode | R1 check name |
|------|------|---------------|
| IF035-00 | Run | whole probe (`ALL PASS`, `no console or page errors`) |
| IF035-01 | Covered by R1 | `IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24` |
| IF035-02 | Hand-walk | — (R1 prints a count only) |
| IF035-03 | Hand-walk | — (R1 measures paused only) |
| IF035-04 | Covered by R1 | `IF-035 > GO LIVE button >= 24x24` |
| IF035-05 | Covered by R1 | `IF-035 card UNDERSTOOD >= 24x24` |
| IF035-06 | Covered by R1 | `IF-035 Influence note UNDERSTOOD >= 24x24` |
| IF035-07 to -10 | Hand-walk | — (R1's IF-035 nav measurement is World Network, Brief locked, only) |
| IF035-11 | Hand-walk, conditional | — |
| IF035-12, -13 | Hand-walk | — |
| IF035-14 | Hand-walk (supporting R1) | `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` |
| IF035-15 to -18 | Hand-walk | — |
