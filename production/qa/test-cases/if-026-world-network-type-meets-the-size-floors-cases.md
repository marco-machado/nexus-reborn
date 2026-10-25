# IF-026 manual test cases: World Network type meets the size floors

- **Story**: `production/epics/interface/story-026-world-network-type-meets-the-size-floors.md` (AC-1; AC-2 guard)
- **Sources**: the story's Acceptance Criteria and `## QA Test Cases`; `production/qa/qa-plan-sprint-011-2026-10-23.md`, IF-026 Manual QA Checklist (AC-2 guard: 125% on four Screens) and Per-system coverage targets ("Screen-wide checks re-run on the final sprint build"); `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-026: "E, R1 on HEAD (BLOCKING refresh)").
- **Story type**: UI. **Evidence location**: `production/qa/evidence/` (story evidence: `production/qa/evidence/sprint-011/`, story map `README.md`). **Gate**: BLOCKING.
- **Build under test**: HEAD `131a5c1`. Screen-wide story: every case is measured on this build. The existing `probe-output.txt` is dated `2026-10-23T06:57:38Z` (built at `ad176af`) and is not evidence for HEAD.
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude, headless. Sign-off: qa-lead.

## Execution mode

- **R1** = one fresh run of `production/qa/evidence/sprint-011/probe.mjs` on HEAD. Cases marked "Covered by R1 probe check: `<name>`" pass on the named PASS line of that run. Read the detail after `//` too, not only the PASS/FAIL word.
- **Hand-walk** = Claude drives the same headless page (same fixtures, same helpers `window.__probe.*` installed by the probe's `HELPERS`) and records the values by hand or by a one-off `page.evaluate`. These cases cover what the probe does not assert.
- Viewport exactly 1280x720, headless Chrome for Testing via `playwright-cli` / `playwright-core` (never the user's Chrome). Dev server `npm run dev` on port 4200; `PROBE_URL=http://localhost:4200/`.

### Fixtures (named from `probe.mjs`)

All state is set through the stores, as the probe header names: `fresh()` = `localStorage.clear()`, reload, `save.startNewOperation()`, `appStore.goto('world')`. `dismissCard()` = `tutorialStore.markSeen('hint-worldmap')`. `pause()` = `worldStore.setState({ paused: true })`. `sector(id, patch, crisis)` patches one sector, selects it, and adds it to or removes it from `crisis`. `setScale(n)` = `settingsStore.setTextScale(n)`.

| Fixture key (`STATES`) | Set-up |
|---|---|
| `opening-card` | `fresh()`, `pause()` (first-visit card showing) |
| `opening` | `fresh()`, `dismissCard()`, `pause()` |
| `garrison-secure` | `opening`, `sector('eu', { control: 60 })` |
| `garrison-strained` | `opening`, `sector('eu', { control: 45 })` |
| `garrison-critical` | `opening`, `sector('eu', { control: 20 })` |
| `pressure` | `opening`, `sector('eu', { unrest: 61 })` |
| `crisis` | `opening`, `sector('eu', { unrest: 80 }, true)` |
| `review` | `opening`, `worldStore.setState({ t: 30*3600 })`, `setReview(30*3600 - 6*3600)` |
| `failed` | `opening`, `campaignStore.setState({ campaignFailed: true })` |
| `influence-note` | `fresh()`, `dismissCard()`, `pause()`, `worldStore.setState({ influence: 8, selected: 'na' })` |
| `intel2` | `opening`, `campaignStore.setState({ intelLevel: 2 })` (extra state, intel 2+) |
| `onScreen(phase)` | `opening`, then Brief via `appStore.selectMission('m03')` (Rust Haven), Research / Assembly via `goto('research' / 'team')` |

Garrison thresholds per the story: SECURE Control ≥55, STRAINED 35–54, CRITICAL <35 (`worldStore.ts:1112`). Pressure is Unrest >60.

### Shared preconditions (record in TC-01 Actual)

1. `git rev-parse --short HEAD` prints `131a5c1`, and `git status --short src/` prints nothing (the tree under test is HEAD, not a dirty tree).
2. `npm run dev` is serving on port 4200 and `curl -s -o /dev/null -w '%{http_code}' http://localhost:4200/` prints `200`.
3. `PROBE_OUT` is set so the HEAD run does not overwrite the `ad176af` evidence unless qa-lead has chosen to replace it. Record the folder used.
4. R1 ran to completion: the last two lines of the output read `no console or page errors` and `ALL PASS`, and the exit code is 0.
5. After the session: the dev server is stopped, `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing, and the headless browser has exited.

### Readout selectors (probe `readoutSel`, mapped to the AC-1 list)

| AC-1 readout | Selector | Source |
|---|---|---|
| Header resource values (CREDITS, INFLUENCE, INTEL, ROSTER) | `.wm-resource b` | `src/ui/Nav.tsx` `ScreenStats` |
| Sector names | `.wm-sector-name` | `src/ui/WorldMap.tsx:921` |
| CONTROL and UNREST values, rows | `.wm-sector-reading b` | `WorldMap.tsx:926-927` |
| CONTROL and UNREST values, panel | `.wm-cu b` | `WorldMap.tsx:967` |
| TAX YIELD, TAX PAID, GARRISON values | `.wm-kv-readout` | `WorldMap.tsx:981-993` |
| Contract codenames | `.wm-op-main > b` | `WorldMap.tsx:1048` |
| CLOCK SPEED value | `.wm-speed b` | `WorldMap.tsx:644` |
| Time code | `.wm-date`, `.wm-clock` | `WorldMap.tsx:508-509` |

---

## IF-026-TC-01: Opening desk, first-visit card showing: size floors

**AC covered**: AC-1 (state: first-visit card showing)
**Coverage**: Covered by R1 probe checks: `opening-card: every text run >= 10 px` and `opening-card: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `opening-card`, text scale 100.
**Steps**:
1. In the R1 output, find the two `IF-026 opening-card:` lines.
2. Read the detail of each: the minimum size and run count, and the readout count and minimum.
3. Open `state-opening-card.png` from the R1 output folder and confirm the card is on screen and the World Network is behind it.

**Expected Result**: Both lines read PASS. The first detail reads `min <n>px over <k> runs` with n ≥ 10. The second reads `<m> readouts, min <r>px` with r ≥ 12 and m > 0. The PNG shows the first-visit card.
**Pass Criteria**: 2 PASS lines; n ≥ 10; r ≥ 12; card visible in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-02: Opening desk: size floors

**AC covered**: AC-1 (state: opening desk)
**Coverage**: Covered by R1 probe checks: `opening: every text run >= 10 px` and `opening: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `opening`, text scale 100.
**Steps**:
1. In the R1 output, find the two `IF-026 opening:` lines and read each detail.
2. Open `state-opening.png` and confirm the card is gone, Europe is focused, and one generated contract offer (with its `EXPIRY` chip) is listed.

**Expected Result**: Both lines PASS; minimum run ≥10 px; readouts minimum ≥12 px over more than 0 readouts. PNG shows the opening desk without the card.
**Pass Criteria**: 2 PASS lines; min ≥ 10; readout min ≥ 12; PNG matches the state.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-03: Focused sector at SECURE: size floors

**AC covered**: AC-1 (state: focused sector, Garrison SECURE)
**Coverage**: Covered by R1 probe checks: `garrison-secure: every text run >= 10 px` and `garrison-secure: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `garrison-secure` (eu Control 60).
**Steps**:
1. In the R1 output, find the two `IF-026 garrison-secure:` lines and read each detail.
2. Open `state-garrison-secure.png` and read the GARRISON value in the focused-sector panel.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. The panel's GARRISON value reads `SECURE`.
**Pass Criteria**: 2 PASS lines; GARRISON reads SECURE in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-04: Focused sector at STRAINED: size floors

**AC covered**: AC-1 (state: focused sector, Garrison STRAINED)
**Coverage**: Covered by R1 probe checks: `garrison-strained: every text run >= 10 px` and `garrison-strained: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `garrison-strained` (eu Control 45).
**Steps**:
1. In the R1 output, find the two `IF-026 garrison-strained:` lines and read each detail.
2. Open `state-garrison-strained.png` and read the GARRISON value.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. GARRISON reads `STRAINED`.
**Pass Criteria**: 2 PASS lines; GARRISON reads STRAINED in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-05: Focused sector at CRITICAL: size floors

**AC covered**: AC-1 (state: focused sector, Garrison CRITICAL)
**Coverage**: Covered by R1 probe checks: `garrison-critical: every text run >= 10 px` and `garrison-critical: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `garrison-critical` (eu Control 20).
**Steps**:
1. In the R1 output, find the two `IF-026 garrison-critical:` lines and read each detail.
2. Open `state-garrison-critical.png` and read the GARRISON value.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. GARRISON reads `CRITICAL`.
**Pass Criteria**: 2 PASS lines; GARRISON reads CRITICAL in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-06: Unrest pressure: size floors

**AC covered**: AC-1 (state: pressure)
**Coverage**: Covered by R1 probe checks: `pressure: every text run >= 10 px` and `pressure: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `pressure` (eu Unrest 61, not in crisis).
**Steps**:
1. In the R1 output, find the two `IF-026 pressure:` lines and read each detail.
2. Open `state-pressure.png` and find the `UNREST PRESSURE` warning on the Europe row.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. The run count is at least the `opening` count (the warning adds a run). The PNG shows `UNREST PRESSURE` on the row.
**Pass Criteria**: 2 PASS lines; `UNREST PRESSURE` visible in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-07: Crisis: size floors

**AC covered**: AC-1 (state: crisis)
**Coverage**: Covered by R1 probe checks: `crisis: every text run >= 10 px` and `crisis: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `crisis` (eu Unrest 80, eu in the crisis list).
**Steps**:
1. In the R1 output, find the two `IF-026 crisis:` lines and read each detail.
2. Open `state-crisis.png` and find the `CRISIS` warning on the Europe row and the `CRISIS` chip in the focused-sector panel.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. Both `CRISIS` runs are visible in the PNG.
**Pass Criteria**: 2 PASS lines; row warning and panel chip both visible.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-08: Review: size floors

**AC covered**: AC-1 (state: Review)
**Coverage**: Covered by R1 probe checks: `review: every text run >= 10 px` and `review: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `review` (t = 30 h, review pinned 6 h back).
**Steps**:
1. In the R1 output, find the two `IF-026 review:` lines and read each detail.
2. Open `state-review.png` and find `REVIEW -<ago>` and `> GO LIVE` in the bottom strip.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. The PNG shows `REVIEW -6H` (or the `agoLabel` form of 6 h) and `> GO LIVE`.
**Pass Criteria**: 2 PASS lines; both Review runs visible in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-09: Failed campaign: size floors

**AC covered**: AC-1 (state: failed campaign)
**Coverage**: Covered by R1 probe checks: `failed: every text run >= 10 px` and `failed: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `failed` (`campaignFailed: true`).
**Steps**:
1. In the R1 output, find the two `IF-026 failed:` lines and read each detail.
2. Open `state-failed.png` and find the failed-campaign banner lines and the `CAMPAIGN LOST` contract rows.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. Banner and `CAMPAIGN LOST` rows visible.
**Pass Criteria**: 2 PASS lines; banner visible in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-10: Influence moment note showing: size floors

**AC covered**: AC-1 (state: Influence moment note showing)
**Coverage**: Covered by R1 probe checks: `influence-note: every text run >= 10 px` and `influence-note: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `influence-note` (influence 8, `na` selected).
**Steps**:
1. In the R1 output, find the two `IF-026 influence-note:` lines and read each detail.
2. Open `state-influence-note.png` and find the Influence moment note and its `UNDERSTOOD` button.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. The note is visible.
**Pass Criteria**: 2 PASS lines; note visible in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-11: Intel 2+ extra state: forecast chips meet the floor

**AC covered**: AC-1 (edge case: forecast chips at intel 2+, recorded as an extra state)
**Coverage**: Covered by R1 probe checks: `intel2: every text run >= 10 px` and `intel2: readouts >= 12 px`
**Preconditions**: Shared preconditions 1 to 4. Fixture `intel2` (`intelLevel: 2`).
**Steps**:
1. In the R1 output, find the two `IF-026 intel2:` lines and read each detail.
2. Compare the run count with the `opening` run count.
3. Open `state-intel2.png` and find the event-forecast chips for the focused sector.

**Expected Result**: Both lines PASS with min ≥10 px and readout min ≥12 px. The run count is higher than `opening` (the forecast chips add runs). Forecast chips visible.
**Pass Criteria**: 2 PASS lines; intel2 run count > opening run count; chips visible.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-12: Each listed readout, by name, at its measured size in each state

**AC covered**: AC-1 (readout list ≥12 px; pass condition "the README lists the measured minimum per state and each listed readout with its measured size")
**Coverage**: Hand-walk. The probe prints only a readout count and minimum, and its readout check passes when a selector matches nothing.
**Preconditions**: Shared preconditions 1 to 3. Text scale 100. Probe `HELPERS` installed after each fixture.
**Steps**:
1. For each of the 11 fixtures in TC-01 to TC-11, enter the fixture, wait 500 ms, install the helpers.
2. For each selector in the Readout selectors table, run `document.querySelectorAll(sel)` filtered by `window.__probe.visible`, and record per selector: match count, the text of each match (first 20 characters), and `getComputedStyle(el).fontSize`.
3. Confirm each AC-1 readout has at least one visible match in each state where it appears: header CREDITS, INFLUENCE, INTEL, ROSTER (four `.wm-resource b`); sector names; CONTROL and UNREST in the rows and in the panel; TAX YIELD, TAX PAID, GARRISON; contract codenames; CLOCK SPEED; date and clock.
4. Record the minimum run size per state from TC-01 to TC-11.
5. Write the table (state x readout -> size) and the per-state minimum into the evidence README for HEAD.

**Expected Result**: Every listed readout is matched (count > 0) in every state it appears in, and every matched element computes ≥12 px. The README lists, for HEAD, the minimum per state and each readout with its size.
**Pass Criteria**: 0 listed readouts with 0 matches; 0 matched readouts below 11.95 px; README table present and states `131a5c1`.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-13: State-only runs are measured in their own state

**AC covered**: AC-1 (edge cases: `REVIEW -<ago>`, `> GO LIVE`, `CRISIS` and `UNREST PRESSURE` chips, banner lines, `EXPIRY` chip, forecast chips at intel 2+)
**Coverage**: Hand-walk. The probe measures every run in each state but does not assert that these runs were present.
**Preconditions**: Shared preconditions 1 to 3. Text scale 100.
**Steps**:
1. Enter `review`; from `window.__probe.runs('.screen')` find the run starting `REVIEW -` and the run `> GO LIVE`; record each size.
2. Enter `pressure`; find `UNREST PRESSURE` (row warning); record its size.
3. Enter `crisis`; find both `CRISIS` runs (row warning and panel chip); record sizes.
4. Enter `failed`; find every banner line run (including `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN` if shown) and the `CAMPAIGN LOST` row runs; record sizes.
5. Enter `opening`; find the `EXPIRY` chip run on the generated offer; record its size.
6. Enter `intel2`; find every forecast chip run; record sizes.

**Expected Result**: Every listed run is present in the run list of its state and is ≥10 px. None of them is missing from the list (a missing run means it was not measured).
**Pass Criteria**: All 6 groups found (count > 0 each); every recorded size ≥ 9.95 px.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-14: Fiction chrome and globe labels count; screen-reader-only text does not

**AC covered**: AC-1 (measurement rules: `aria-hidden` fiction chrome and DOM globe labels with LABELS on count; screen-reader-only text does not)
**Coverage**: Hand-walk.
**Preconditions**: Shared preconditions 1 to 3. Fixture `opening`, text scale 100.
**Steps**:
1. Confirm the globe has loaded: no `.globe-status` element reading `ACQUIRING ORBITAL VIEW`, `ACQUIRING EARTH IMAGERY` or `RESTORING ORBITAL VIEW` is visible. If one is, wait up to 10 s and record the wait.
2. Confirm the `LABELS` button in `.globe-toolbar` has `aria-pressed="true"` (default `showLabels` is true, `src/ui/WorldGlobe.tsx:370`).
3. List the visible `.globe-marker-label` elements and their computed font sizes. Confirm each one appears in `window.__probe.runs('.screen')`.
4. List visible text under `[aria-hidden="true"]` inside `.screen` (outside `svg`). Confirm each appears in the run list and record the smallest size.
5. List elements with a screen-reader-only clip (`clip: rect(0px, 0px, 0px, 0px)` or `clip-path: inset(50%)`). Confirm none appears in the run list.

**Expected Result**: The globe is ready and LABELS is on. Every globe label and every visible `aria-hidden` text run is in the measured set and is ≥10 px. No screen-reader-only text is in the set.
**Pass Criteria**: Globe ready; LABELS pressed; 0 globe labels or `aria-hidden` runs missing from the run list; all of them ≥ 9.95 px; 0 sr-only runs in the list.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-15: World Network does not clip at 90 / 100 / 110 / 125, opening and Review

**AC covered**: AC-1 (edge case: "re-check clipping at 125% in the README"); AC-2 (World Network at 125)
**Coverage**: Covered by R1 probe checks: `world network scale 90: nothing clips`, `world network scale 100: nothing clips`, `world network scale 110: nothing clips`, `world network scale 125: nothing clips`, `review at 90: nothing clips`, `review at 100: nothing clips`, `review at 110: nothing clips`, `review at 125: nothing clips`
**Preconditions**: Shared preconditions 1 to 4. Fixtures `opening` and `review`, each at four scales via `setScale`.
**Steps**:
1. In the R1 output, find the 8 lines named above.
2. Open `if-023-024-world-125.png` and `if-026-review-125.png` and look at the bottom strip (time code, `REVIEW -<ago>`, `> GO LIVE`), the header resources and every panel edge.

**Expected Result**: All 8 lines PASS with no detail. At 125 the PNGs show no text cut by a box, and the Review strip holds both Review runs.
**Pass Criteria**: 8 of 8 PASS; 0 cut text in the two PNGs.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-16: World Network at 125: no clip, nav labels not truncated

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `World Network at 125: nothing clips; nav labels not truncated`
**Preconditions**: Shared preconditions 1 to 4. `onScreen('world')`, `setScale(125)`.
**Steps**:
1. In the R1 output, find the line named above.
2. Open `if-026-world-125.png`; read the four nav tab labels and the four header resources (CREDITS, INFLUENCE, INTEL, ROSTER).

**Expected Result**: PASS with no detail (no `clip`, `cut`, `truncated`, `spill`, `hscroll`, `textoverlap`, `boxoverlap` or `overlap` entry and no truncated `.navtab-label`). The PNG shows all four nav labels and all four resources whole.
**Pass Criteria**: 1 PASS line; 4 nav labels and 4 resources readable in full in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-17: Research at 125: no clip, nav labels not truncated

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `Research at 125: nothing clips; nav labels not truncated`
**Preconditions**: Shared preconditions 1 to 4. `onScreen('research')`, `setScale(125)`.
**Steps**:
1. In the R1 output, find the line named above.
2. Open `if-026-research-125.png`; read the nav labels and the header chips (clock, CREDITS, INFLUENCE, INTEL, ROSTER).

**Expected Result**: PASS with no detail. Nav labels and header chips whole in the PNG.
**Pass Criteria**: 1 PASS line; 0 cut nav labels or header chips in the PNG.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-18: Brief (contract selected) at 125: no clip, nav labels not truncated

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `Brief at 125: nothing clips; nav labels not truncated`
**Preconditions**: Shared preconditions 1 to 4. `onScreen('brief')` (Rust Haven, `selectMission('m03')`), `setScale(125)`.
**Steps**:
1. In the R1 output, find the line named above.
2. Open `if-026-brief-125.png`; confirm the subtitle names Rust Haven; read the nav labels and header chips.

**Expected Result**: PASS with no detail. The Brief shows the selected contract; nav labels and header chips whole.
**Pass Criteria**: 1 PASS line; contract shown; 0 cut nav labels or header chips.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-19: BUG-0009 Brief threat box still clear at 125

**AC covered**: AC-2 (pass condition: "BUG-0009's Brief threat box still clear")
**Coverage**: Hand-walk. The probe's Brief clip pass covers `.screen` but does not name `.mb-threat`.
**Preconditions**: Shared preconditions 1 to 3. `onScreen('brief')` (Rust Haven, MODERATE), `setScale(125)`, helpers installed.
**Steps**:
1. Read the boxes of `.mb-threat`, `.mb-threat-main label`, `.mb-threat-main b`, `.mb-threat-blocks` and `.mb-threat-eta` with `getBoundingClientRect`.
2. Compute the intersection of `.mb-threat-main b` (`MODERATE`) with `.mb-threat-eta` and with `.mb-threat-blocks`, and of the label with both.
3. Check that all four boxes sit inside `.mb-threat` (±1 px).
4. Capture the threat box (element screenshot) into the evidence folder.

**Expected Result**: `MODERATE` and its label intersect neither the blocks nor `ETA RESPONSE: < 06:00`; all four parts are inside `.mb-threat`.
**Pass Criteria**: 0 intersections over 2 px; 4 of 4 parts inside the box; capture saved.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-20: Assembly at 125: no clip, nav labels not truncated

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `Assembly at 125: nothing clips; nav labels not truncated`
**Preconditions**: Shared preconditions 1 to 4. `onScreen('team')`, `setScale(125)`.
**Steps**:
1. In the R1 output, find the line named above.
2. Open `if-026-team-125.png`; read the nav labels and header chips.

**Expected Result**: PASS with no detail. Nav labels and header chips whole.
**Pass Criteria**: 1 PASS line; 0 cut nav labels or header chips.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-21: Shared header resources on four Screens at 125

**AC covered**: AC-2 ("including the shared header resources"; Implementation Notes: the header change shows on all four Screens)
**Coverage**: Hand-walk. The probe clip pass includes the header but does not report the header items by name.
**Preconditions**: Shared preconditions 1 to 3. Text scale 125. Each of `onScreen('world' | 'research' | 'brief' | 'team')`.
**Steps**:
1. On World Network, for each `.wm-resource`: record its box, its `scrollWidth`/`clientWidth`, and the box of its `small` label and `b` value. Confirm label and value are inside the `.wm-resource` box and inside `.screen-head`.
2. On Research, Brief and Assembly, do the same for each chip in `.screen-head-right` (clock, CREDITS, INFLUENCE, INTEL, ROSTER).
3. On each Screen, confirm no header item intersects `.screen-title`, the subtitle, or `.navtabs`.
4. On each Screen, confirm no header item has `scrollWidth > clientWidth + 1`.

**Expected Result**: On all four Screens every header item is whole, inside the header, and does not touch the title, subtitle or nav.
**Pass Criteria**: 4 Screens x every header item: 0 truncated, 0 outside the header, 0 intersections over 2 px.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-22: Overflow on the four Screens at 125 is reachable by scrolling

**AC covered**: AC-2 ("overflow scrolls, P-15"; "scrolled overflow reachable counts as not clipped")
**Coverage**: Hand-walk. The probe treats a scrolling box as not clipped but does not scroll it.
**Preconditions**: Shared preconditions 1 to 3. Text scale 125. Each of the four Screens via `onScreen`.
**Steps**:
1. On each Screen, list the visible elements under `.screen` whose computed `overflow-y` is `auto` or `scroll` and whose `scrollHeight > clientHeight + 1`.
2. For each, set `scrollTop = scrollHeight`, wait 150 ms, and confirm the last child's bottom is within the container's visible box (±1 px) and its last text is fully visible.
3. Run `window.__probe.clipped('.screen')` again at the scrolled position and record the result.
4. Capture each scrolled container at its end into the evidence folder.

**Expected Result**: Every overflowing panel scrolls to reveal its last item whole. No panel compresses or cuts content. The clip pass at the scrolled position returns an empty list.
**Pass Criteria**: For every scrolling container on 4 Screens: last item fully visible at scroll end; clip list empty.
**Actual Result**:
**Pass/Fail**:

## IF-026-TC-23: World Network map-area chrome at 125 (outside the probe's clip pass)

**AC covered**: AC-2 ("every panel of each Screen")
**Coverage**: Hand-walk. The probe's `clipped()` skips `.globe-view`, `.wm-map-wrap`, `.tip` and `.hud-menu-wrap` as declared overlays, so the map overlays (`.wm-ov` blocks such as `ORBITAL VIEW // SAT-16E // LIVE`, the globe toolbar, the inset steppers and tag) are not clip-checked.
**Preconditions**: Shared preconditions 1 to 3. Fixture `opening`, text scale 125.
**Steps**:
1. List visible text-holding elements under `.wm-map-wrap` (outside `canvas`).
2. For each, check `scrollWidth > clientWidth + 1` with `overflow` not visible, `text-overflow: ellipsis` active, and text cut by a non-scrolling ancestor (same rules as `clipped()`).
3. Check each `.wm-ov` block and `.globe-toolbar` against the others and against the `.wm-map-wrap` edges for intersection.
4. Capture the map area.

**Expected Result**: No map-area text is cut, ellipsised or spilled; no overlay block covers another or leaves the map area.
**Pass Criteria**: 0 cut / truncated / spilled runs; 0 intersections over 2 px between overlay blocks; capture saved.
**Actual Result**:
**Pass/Fail**:

---

## Coverage map

| AC | Cases |
|---|---|
| AC-1 (10 states + intel 2+, ≥10 px every run, ≥12 px readouts, README values) | TC-01 to TC-11 (R1), TC-12, TC-13, TC-14 (hand-walk), TC-15 (R1, clip re-check) |
| AC-2 (125% on four Screens, header resources, nav labels, BUG-0009) | TC-15 to TC-18, TC-20 (R1), TC-19, TC-21, TC-22, TC-23 (hand-walk) |
