# IF-024 — RESOURCE POOL becomes INTEL — Manual test cases

**Story**: `production/epics/interface/story-024-resource-pool-becomes-intel.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/sprint-011/` (R1 probe output + PNGs at 1280x720); hand-walk captures go next to them | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: HEAD `131a5c1`
**Scope**: story `## QA Test Cases` (AC-1 `bottom-intel-panel` and its Edge cases; AC-2 guard); QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` § Manual QA Checklist → IF-024 (AC-1, AC-2); QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 6 (IF-024: R1, status E, refresh via R1).
**Out of scope**: the left INFLUENCE panel (IF-023). Type size, contrast and target size of the panel are IF-026 / IF-027 / IF-035 and are not re-checked here.

## Common setup

- `npm run dev -- --strictPort` on http://localhost:4200. Headless Chrome for Testing via `npx playwright-cli` (never the user's Chrome), viewport exactly 1280x720.
- Fixture `opening` as in `production/qa/evidence/sprint-011/probe.mjs` (`STATES.opening`): `fresh()` (load, `localStorage.clear()`, reload, `save.startNewOperation()`, `appStore.goto('world')`), then `dismissCard()` (`tutorialStore.markSeen('hint-worldmap')`), then `pause()`. The clock is paused so nothing moves between reads.
- Text scale via `useSettingsStore.getState().setTextScale(n)` (probe `setScale`), n in 90 / 100 / 110 / 125; wait ~250 ms after each change.
- Intel state via `useCampaignStore` (`/src/state/campaignStore.ts`): `setState({ intelLevel, intelProgress })` to seed, `getState().awardIntel(points)` to level up through the real `addIntel` path.
- Read the panel as the probe does: `document.querySelector('.wm-intel-panel').innerText.replace(/\s+/g, ' ').trim()`. Read the header Intel from the `.wm-resource` element whose text contains `INTEL` (`src/ui/Nav.tsx:45`; text reads `INTEL<level>`, e.g. `INTEL1`).
- New Operation defaults (`src/game/data.ts`): intel level 1, progress 25.
- Probe check names below are the `check(story, name)` labels as printed in `probe-output.txt` (`PASS <story> <name>`). The R1 re-run on HEAD supplies the Actual Result for probe-covered cases; the recorded run in `probe-output.txt` dates from 2026-10-23 (`ad176af`) and is stale against HEAD (strategy § 1).

## AC map

| AC | Cases |
|---|---|
| AC-1 — `INTEL` title, level, `n / 100` text, no Credits/Influence/Roster, nothing clips at 90/100/110/125 | IF-024-01, -02, -03, -04, -05, -09 |
| AC-1 Edge — progress 0 prints `0 / 100` | IF-024-06 |
| AC-2 (guard) — after a level-up progress wraps below 100 and level equals header Intel; header Intel unchanged | IF-024-07, -08, -06 (boundary) |

---

## Test Case: IF-024-01 — INTEL panel text at four scales (New Operation)

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-024 scale 90: INTEL panel`, `IF-024 scale 100: INTEL panel`, `IF-024 scale 110: INTEL panel`, `IF-024 scale 125: INTEL panel`
**Preconditions**: Common setup, fixture `opening`. Intel level 1, progress 25 (New Operation defaults).
**Steps**:
1. Set text scale 90; wait 250 ms.
2. Read the `.wm-intel-panel` text (normalized as in Common setup).
3. Repeat steps 1-2 at 100, 110 and 125.
4. Set text scale back to 100.
**Expected Result**: At each scale the panel text is exactly `INTEL LEVEL 1 PROGRESS 25 / 100` (matches `/^INTEL LEVEL 1 PROGRESS \d+ \/ 100$/` with the number 25), and contains none of `CREDITS`, `INFLUENCE`, `ROSTER`.
**Pass Criteria**: 4 of 4 scales print the exact string; 0 of 4 contain CREDITS, INFLUENCE or ROSTER.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-02 — Nothing clips on the World Network at four scales

**AC covered**: AC-1 ("nothing clips")
**Coverage**: Covered by R1 probe check: `IF-026 world network scale 90: nothing clips`, `... scale 100 ...`, `... scale 110 ...`, `... scale 125 ...` (run in the same loop as IF-024-01; `__probe.clipped('.screen')`)
**Preconditions**: Same as IF-024-01, in the same loop.
**Steps**:
1. At each of 90 / 100 / 110 / 125, run the probe clip helper over `.screen`.
2. Capture `if-023-024-world-<scale>.png` at 1280x720.
3. Open each PNG and look at the bottom-right INTEL panel: title, LEVEL row, PROGRESS row, bar.
**Expected Result**: The clip helper returns 0 elements at each scale. In each PNG the INTEL title, `LEVEL 1`, `PROGRESS 25 / 100` and the bar are fully visible, with no ellipsis, no cut glyphs, and nothing under a neighbouring panel or off the viewport edge.
**Pass Criteria**: clip count = 0 at 4 of 4 scales, and 4 of 4 PNGs show all four panel elements whole.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-03 — Panel title is INTEL; no RESOURCE POOL anywhere

**AC covered**: AC-1 (story Pass condition: "the panel title is `INTEL` and no `RESOURCE POOL` remains")
**Coverage**: Hand-walk. The probe asserts the panel's text starts with `INTEL` but does not search the rest of the screen or the source for `RESOURCE POOL`.
**Preconditions**: Common setup, fixture `opening`, text scale 100.
**Steps**:
1. Read `.wm-intel-panel .panel-title` text (or the panel's first heading line).
2. Evaluate `document.body.innerText.toUpperCase().includes('RESOURCE POOL')`.
3. Run `rg -n "RESOURCE POOL" src` in the project root.
**Expected Result**: Step 1 reads `INTEL`. Step 2 returns `false`. Step 3 prints no matches.
**Pass Criteria**: title = `INTEL`; page search = false; `rg` match count = 0.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-04 — INTEL is the bottom strip's fourth panel

**AC covered**: AC-1 (story Setup/Verify: "read the bottom strip's fourth panel")
**Coverage**: Hand-walk. The probe selects the panel by class (`.wm-intel-panel`), not by position.
**Preconditions**: Common setup, fixture `opening`, text scale 100.
**Steps**:
1. List the panel titles of the direct children of `.wm-bottom`, in DOM order.
2. Read the bounding boxes of those four panels and order them left to right by `x`.
3. Visually confirm on the 100% capture that INTEL sits bottom-right.
**Expected Result**: DOM order and left-to-right order are both `TIME CODE`, `TIMELINE`, `FEED`, `INTEL`; `.wm-bottom` has exactly 4 panels; INTEL is the right-most.
**Pass Criteria**: 4 panels; the fourth (by DOM and by `x`) is titled `INTEL`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-05 — Header still prints Credits, Influence, Intel, Roster

**AC covered**: AC-1 (removed values still reachable elsewhere); AC-1 Edge "the header Intel is unchanged"
**Coverage**: Covered by R1 probe check: `IF-023 scale 90: left column holds SECTORS only; header prints Influence` (and the 100 / 110 / 125 variants; their detail line lists the four header readouts). Confirm the detail line by eye; the check itself only asserts INFLUENCE.
**Preconditions**: Common setup, fixture `opening`, each of the four scales (same loop as IF-024-01).
**Steps**:
1. At each scale read the text of every `.wm-resource` element in order.
**Expected Result**: Four header readouts, in order: `CREDITS128,450 CR`, `INFLUENCE0 PTS`, `INTEL1`, `ROSTER8 / 8` (New Operation values). Intel's header form is the bare level (no progress), as in `src/ui/Nav.tsx:45`.
**Pass Criteria**: 4 of 4 scales list exactly these four readouts; the INTEL readout equals `INTEL1`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-06 — Progress 0 prints `0 / 100` (exact-100 wrap boundary)

**AC covered**: AC-1 Edge ("progress 0 prints `0 / 100`"); AC-2 (wrap at exactly 100)
**Coverage**: Hand-walk. The probe never renders progress 0 (its fixtures run at 25 and 15).
**Preconditions**: Common setup, fixture `opening`, text scale 100.
**Steps**:
1. `useCampaignStore.setState({ intelLevel: 1, intelProgress: 0 })`; wait 200 ms; read the panel text and the header Intel; capture `if-024-progress-0.png`.
2. `useCampaignStore.setState({ intelLevel: 1, intelProgress: 75 })`, then `useCampaignStore.getState().awardIntel(25)`; wait 200 ms.
3. Read the panel text, the header Intel, and `useCampaignStore.getState()` `intelLevel` / `intelProgress`; capture `if-024-wrap-exact-100.png`.
**Expected Result**: Step 1 panel = `INTEL LEVEL 1 PROGRESS 0 / 100`; header `INTEL1`; the bar renders empty with no error. Step 3 store = level 2, progress 0; panel = `INTEL LEVEL 2 PROGRESS 0 / 100` (never `100 / 100`); header `INTEL2`.
**Pass Criteria**: both panel strings match exactly; header level equals panel level in both; no `100 / 100` appears.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-07 — Single level-up wraps progress and matches header

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `IF-024 level and progress agree with the header`. Read the detail line for the exact values below: the check passes on any level whose digit is a substring of the header and any progress < 100, and calls `awardIntel?.(25)` with optional chaining, so it would also pass with no level-up at all. Record PASS only if the detail line shows the exact values in Expected Result.
**Preconditions**: Common setup, fixture `opening` (intel level 1), text scale 100.
**Steps**:
1. `useCampaignStore.setState({ intelProgress: 90 })`.
2. `useCampaignStore.getState().awardIntel(25)`; wait 200 ms.
3. Read the panel text and the header Intel readout.
**Expected Result**: Panel = `INTEL LEVEL 2 PROGRESS 15 / 100`; header Intel readout = `INTEL2`.
**Pass Criteria**: panel string and header string match exactly (level 2 in both, progress 15).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-08 — Multi-level award wraps with no cap

**AC covered**: AC-2; AC-1 Edge ("after a level-up the progress wraps below 100 (`addIntel`, no cap)")
**Coverage**: Hand-walk. The probe only crosses one level.
**Preconditions**: Common setup, fixture `opening`, text scale 100.
**Steps**:
1. `useCampaignStore.setState({ intelLevel: 1, intelProgress: 90 })`.
2. `useCampaignStore.getState().awardIntel(250)`; wait 200 ms.
3. Read the panel text, the header Intel, and the store values; capture `if-024-multi-level.png`.
**Expected Result**: 90 + 250 = 340 wraps three times: store level 4, progress 40. Panel = `INTEL LEVEL 4 PROGRESS 40 / 100`; header = `INTEL4`.
**Pass Criteria**: store, panel and header all read level 4; panel progress = 40 (< 100).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-024-09 — Level-up state and a two-digit level do not clip at four scales

**AC covered**: AC-1 ("nothing clips") applied to the post-level-up state (AC-2)
**Coverage**: Hand-walk. The probe clip pass runs only at level 1 / progress 25; the `intel2` fixture is swept for type size and contrast (IF-026 / IF-027), not at four scales.
**Preconditions**: Common setup, fixture `opening`.
**Steps**:
1. `useCampaignStore.setState({ intelLevel: 2, intelProgress: 15 })`.
2. For each scale 90 / 100 / 110 / 125: set the scale, wait 250 ms, run `__probe.clipped('.screen')`, read the panel text, capture `if-024-level2-<scale>.png`.
3. `useCampaignStore.setState({ intelLevel: 10, intelProgress: 99 })` and repeat step 2 (captures `if-024-level10-<scale>.png`).
4. Set scale back to 100.
**Expected Result**: Clip count 0 at every scale for both states. Panel reads `INTEL LEVEL 2 PROGRESS 15 / 100` and `INTEL LEVEL 10 PROGRESS 99 / 100` respectively; in each PNG the title, both rows and the bar are whole.
**Pass Criteria**: 8 of 8 captures with clip count 0 and the exact panel string.
**Actual Result**:
**Pass/Fail**:

---

## Close-out

- Stop the dev server; confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` empty). Close the headless browser.
- Record AC-1 and AC-2 results separately (story AC-2 instruction) in the evidence README.
