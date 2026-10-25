# IF-021 — Unrest ink and bar follow its state — Manual test cases

**Story**: `production/epics/interface/story-021-unrest-ink-and-bar-follow-its-state.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/sprint-011/` (probe OUT, `if-021-*.png`; the story's Status line names this folder) | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: HEAD `131a5c1`
**Sources**: story `## Acceptance Criteria` (AC-1, AC-2) and `## QA Test Cases` (`unrest-ink-states`); QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` § Manual QA Checklist → IF-021; QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 6 (IF-021: R1, five Unrest states).
**Automated coverage (supporting)**: `unrestTone` unit tests in `src/ui/worldChrome.test.ts`.

## Common setup

- `npm run dev` on port 4200. Headless Chrome for Testing through `playwright-cli` / `playwright-core`, viewport exactly 1280x720. Never the user's Chrome.
- State fixtures are the ones in `production/qa/evidence/sprint-011/probe.mjs`:
  - `STATES.opening`: `fresh()` (localStorage clear, `save.startNewOperation()`, `goto('world')`), `dismissCard()`, `pause()`.
  - `STATES.pressure`: `opening` + `sector('eu', { unrest: 61 })`.
  - `STATES.crisis`: `opening` + `sector('eu', { unrest: 80 }, true)`.
  - `sector(id, patch, crisis)` writes `useWorldStore.setState({ selected: id, sectors[id] patched, crisis list with/without id })`.
- R1 = one run of the probe: `PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011/probe.mjs`; it writes `probe-output.txt` and the PNGs. Cases marked "Covered by R1 probe check" pass when that line reads `PASS` in the HEAD run's `probe-output.txt`.
- Spec literals (probe constants): Ink `rgb(184, 216, 207)`, Print White `rgb(226, 246, 238)`, Red Hot `rgb(255, 107, 85)`. Pressure line `PRESSURE_UNREST_MIN = 60` (`src/game/influence.ts:80`); crisis enter 85 / exit 70 (`:104-105`).
- Contrast is the composited ratio as rendered (probe `window.__probe.runs`, over the panel `rgba(7, 16, 15, 0.92)` on Void `#04070a`).
- Selectors: row value = `.wm-sector.sel .wm-sector-reading` whose `span` reads `UNREST`, its `b`. Focus-panel value = `.wm-cu > div:nth-child(2) b`; Focus-panel bar = `.wm-cu > div:nth-child(2) .segbar`. Row chip = `.wm-sector.sel .wm-sector-warning`. Focus panel = `.wm-right`.

---

## Test Case: IF-021-01 — Calm Unrest 50 prints Ink, bar untoned

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (calm)
**Coverage**: Covered by R1 probe check: `IF-021 opening unrest 50: row and panel ink`
**Preconditions**: Dev server up on 4200; fixture `STATES.opening`, then `sector('eu', { unrest: 50 }, false)`; Europe focused, sector not in `crisis`, clock paused.
**Steps**:
1. Read the computed `color` of the row Unrest value and the Focus-panel Unrest value.
2. Read the Focus-panel Unrest bar's `className`.
3. Read the composited contrast ratio of both values.
4. Capture `if-021-opening-50.png` at 1280x720.
**Expected Result**: Both values `rgb(184, 216, 207)` (Ink). Bar class is `segbar mini` with no `red` / `notice` / `amber` / `green` tone. Both ratios ≥ 4.5:1.
**Pass Criteria**: Probe line reads `PASS` (row === Ink AND panel === Ink AND bar untoned AND both ratios ≥ 4.5).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-02 — Unrest exactly at the pressure line (60) is still calm

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (calm, boundary `≤ PRESSURE_UNREST_MIN`)
**Coverage**: Covered by R1 probe check: `IF-021 opening unrest 60: row and panel ink`
**Preconditions**: Fixture `STATES.opening`, then `sector('eu', { unrest: 60 }, false)`.
**Steps**:
1. Read the computed `color` of the row and Focus-panel Unrest values.
2. Read the Focus-panel bar's `className`.
3. Read both composited ratios.
4. Read the row's chip slot (`.wm-sector.sel .wm-sector-warning`).
5. Capture `if-021-opening-60.png`.
**Expected Result**: Both values Ink `rgb(184, 216, 207)`; bar untoned; both ratios ≥ 4.5:1; no `UNREST PRESSURE` chip (the row shows the Control bar instead).
**Pass Criteria**: Probe line reads `PASS`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-03 — Unrest 61 (past the line) prints Print White, bar takes the notice tone

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (pressure)
**Coverage**: Covered by R1 probe check: `IF-021 pressure unrest 61: row and panel ink`
**Preconditions**: Fixture `STATES.pressure` (Europe Unrest 61, not in `crisis`).
**Steps**:
1. Read the computed `color` of the row and Focus-panel Unrest values.
2. Read the Focus-panel bar's `className`.
3. Read both composited ratios.
4. Capture `if-021-pressure-61.png`.
**Expected Result**: Both values `rgb(226, 246, 238)` (Print White); bar class contains `notice`; both ratios ≥ 4.5:1.
**Pass Criteria**: Probe line reads `PASS`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-04 — `UNREST PRESSURE` chip sits on the row only

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (edge: the Focus panel changes tone only); AC-2 (chip on the sector row only)
**Coverage**: Covered by R1 probe check: `IF-021 pressure chip on the row only`
**Preconditions**: Fixture `STATES.pressure`.
**Steps**:
1. Read the text of `.wm-sector.sel .wm-sector-warning`.
2. Read whether the Focus-panel Unrest block (`.wm-cu > div:nth-child(2)`) contains `UNREST PRESSURE`.
**Expected Result**: Row chip text includes `UNREST PRESSURE`; the Focus-panel Unrest block does not contain it.
**Pass Criteria**: Probe line reads `PASS`. (The probe scopes "panel" to the Unrest block only; IF-021-07 checks the whole Focus panel.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-05 — Crisis at Unrest 80 prints Red Hot; crisis wins over pressure

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (crisis); AC-1 edge "crisis wins over pressure" (80 > 60, so pressure is also true)
**Coverage**: Covered by R1 probe check: `IF-021 crisis unrest 80: row and panel ink`
**Preconditions**: Fixture `STATES.crisis` (Europe Unrest 80, `eu` in `crisis`). 80 is under the crisis entry 85 and above exit 70, so this is also the hysteresis band of the QA case Setup ("back below the entry threshold").
**Steps**:
1. Read the computed `color` of the row and Focus-panel Unrest values.
2. Read the Focus-panel bar's `className`.
3. Read both composited ratios.
4. Capture `if-021-crisis-80.png`.
**Expected Result**: Both values `rgb(255, 107, 85)` (Red Hot); bar class contains `red` (not `notice`); both ratios ≥ 4.5:1.
**Pass Criteria**: Probe line reads `PASS`. The `CRISIS` chip is printed in this line's detail but not asserted by it; it is asserted in IF-021-07.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-06 — Crisis with Unrest back under the pressure line (40) stays Red Hot

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-2 (value and bar stay Red Hot under hysteresis)
**Coverage**: Covered by R1 probe check: `IF-021 crisis unrest 40: row and panel ink`
**Preconditions**: Fixture `STATES.crisis`, then `sector('eu', { unrest: 40 }, true)`; clock paused (the state is held by the fixture).
**Steps**:
1. Read the computed `color` of the row and Focus-panel Unrest values.
2. Read the Focus-panel bar's `className`.
3. Read both composited ratios.
4. Capture `if-021-crisis-40.png`.
**Expected Result**: Both values Red Hot `rgb(255, 107, 85)`; bar class contains `red`; both ratios ≥ 4.5:1. Neither value falls back to Ink.
**Pass Criteria**: Probe line reads `PASS`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-07 — Chips across all five states, whole Focus panel

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (pass condition: pressure chip on the row, `CRISIS` chip in crisis; edge: pressure chip on the row only, crisis wins over pressure); AC-2 (chip on the row only)
**Coverage**: Hand-walk (the probe asserts the pressure chip in the pressure state only, scopes "panel" to the Unrest block, and does not assert the `CRISIS` chip)
**Preconditions**: Dev server up; same headless page as R1 or a fresh one at 1280x720. Each state set as in IF-021-01 to -06 (Unrest 50, 60 calm; 61 pressure; 80, 40 crisis).
**Steps**:
1. For each of the five states, read:
   a. `document.querySelector('.wm-sector.sel .wm-sector-warning')?.textContent` and its `className`;
   b. `document.querySelector('.wm-sector.sel').getAttribute('aria-label')`;
   c. `document.querySelector('.wm-right').textContent.includes('UNREST PRESSURE')`;
   d. the Focus panel title-bar chip text (`.wm-right .chip`, first).
2. Record the five results in a table.
**Expected Result**:
- 50 and 60: no row warning chip; aria-label ends `UNREST 50%` / `UNREST 60%` with no suffix; Focus panel chip `FOCUS`.
- 61: row chip `UNREST PRESSURE` (class contains `notice`); aria-label ends `// UNREST PRESSURE`; Focus panel chip `FOCUS`.
- 80 and 40: row chip `CRISIS` (class contains `red`), never `UNREST PRESSURE`; aria-label ends `// CRISIS`; Focus panel chip `CRISIS`.
- Step 1c is `false` in all five states.
**Pass Criteria**: All 20 readings (4 x 5 states) match the expected values; `UNREST PRESSURE` appears in `.wm-right` 0 times.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-08 — Focus-panel bar fill follows the value's state

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (bar takes the matching tone); AC-2 (bar stays Red Hot state)
**Coverage**: Hand-walk (the probe checks the bar's class only; the QA case asks to read the bar's fill)
**Preconditions**: As IF-021-07, five states.
**Steps**:
1. For each state, read `getComputedStyle(document.querySelector('.wm-cu > div:nth-child(2) .segbar > i')).backgroundImage` and its inline `width`.
2. In the calm state, also read the same for the Control bar (`.wm-cu > div:nth-child(1) .segbar > i`).
3. Record the gradient end colour per state.
**Expected Result**:
- 50, 60: the untoned default fill, identical to the Control bar's fill; width `50%` / `60%`.
- 61: the notice gradient ending in Print White `rgb(226, 246, 238)`; width `61%`.
- 80, 40: the red gradient (`.segbar.red > i`); width `80%` / `40%`.
- The fill family is the same as the value's state in every row (calm/default, notice/Print White, crisis/red).
**Pass Criteria**: Each of the five fills is the gradient for its state's tone class, and width equals Unrest%. Record the exact red end colour (see CONCERNS: `.segbar.red` ends in `--red` `#e04b3c`, not Red Hot `#ff6b55`).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-021-09 — Antarctica prints no Unrest value, tone or chip

**Story type**: UI | **Output**: `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**AC covered**: AC-1 (edge: Antarctica prints none)
**Coverage**: Hand-walk (not in the probe)
**Preconditions**: Fixture `STATES.opening`; Europe focused. Antarctica's id is `an`.
**Steps**:
1. Read the Antarctica row (`.wm-sector` whose name reads `ANTARCTICA`): its text, any `.wm-sector-reading`, any `.wm-sector-warning`, its `aria-label`.
2. Without selecting it, force Antarctica into crisis at high Unrest: `useWorldStore.setState({ sectors: { ...s.sectors, an: { ...s.sectors.an, unrest: 90 } }, crisis: [...s.crisis, 'an'] })`. Repeat step 1.
3. Click the Antarctica row. Read `useWorldStore.getState().selected` and the Focus panel title.
4. Capture `if-021-antarctica.png`.
**Expected Result**: Before and after step 2, the row reads `ANTARCTICA` / `NO SURVEY DATA` with the lock glyph, no `UNREST` reading, no warning chip; aria-label `ANTARCTICA // NO SURVEY DATA`. After step 3, `selected` is still `eu` and the Focus panel still shows Europe.
**Pass Criteria**: 0 Unrest readings and 0 chips on the Antarctica row in both passes, and `selected !== 'an'` after the click.
**Actual Result**:
**Pass/Fail**:
