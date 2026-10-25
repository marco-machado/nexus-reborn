# IF-017 — Failed-campaign contract rows read CAMPAIGN LOST — Manual test cases

**Story**: `production/epics/interface/story-017-failed-campaign-contract-rows-read-campaign-lost.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/if-017/` (fresh HEAD run; the R1 probe writes to its dated `PROBE_OUT` folder, `production/qa/evidence/sprint-011-head-2026-10-24/` per the strategy) | **Gate**: BLOCKING (UI: a retained screenshot of each state touched)
**Build under test**: HEAD `131a5c1` (last `src/` change `ab9935c`)
**Sources**: story Acceptance Criteria and `## QA Test Cases` (qa-lead, QL-STORY-READY 2026-10-23); `production/qa/qa-plan-sprint-011-2026-10-23.md` Manual QA Checklist → IF-017; `production/qa/qa-strategy-sprint-011-2026-10-24.md` §6 (IF-017 row: "R1, E, smoke item 5 passed at HEAD").
**Supporting automated test (not re-run here)**: `lockReason(campaignFailed, intelReq)` in `src/ui/worldChrome.test.ts`. It feeds both the OPEN CONTRACTS rows (`src/ui/WorldMap.tsx` ~:1027) and the Scan markers (`src/ui/WorldMap.tsx` ~:342 → `src/ui/WorldGlobe.tsx` ~:439/453).

## Acceptance criteria → cases

| AC | Text (short) | Cases |
|---|---|---|
| AC-1 | Failed campaign: every row's visible reason and `aria-label` cause read `CAMPAIGN LOST`, as the Scan markers do; never `REQUIRES INTEL LVL n` | IF-017-01, -02, -03, -04 |
| AC-1 edge | A row that is both intel-locked and campaign-lost reads `CAMPAIGN LOST` | IF-017-02 |
| AC-2 (guard a) | Not failed: an intel-locked row still reads `REQUIRES INTEL LVL n` | IF-017-07, -08 |
| AC-2 (guard b) | Failed: clicking a locked row leaves the phase on the World Network | IF-017-05, -06 |

AC-2 is recorded separately from AC-1, as the story's QA Test Cases require.

## Common setup

- Run `npm run dev` (port 4200). Use headless Chrome for Testing through `playwright-cli` / `playwright-core`, viewport exactly **1280x720**. Never use the owner's Chrome.
- **Fixture: `failed`** (R1 probe `STATES.failed`, `production/qa/evidence/sprint-011/probe.mjs`):
  1. `fresh()`: load the URL, `localStorage.clear()`, reload, `save.startNewOperation()`, `useAppStore.getState().goto('world')`.
  2. `dismissCard()`: `useTutorialStore.getState().markSeen('hint-worldmap')`.
  3. `pause()`: `useWorldStore.setState({ paused: true })`.
  4. `useCampaignStore.setState({ campaignFailed: true })`. Wait 500 ms.
- **Fixture: `opening`** (R1 probe `STATES.opening`): steps 1-3 above, without the flag. Intel level is 1.
- Focus a sector the way the probe does: `useWorldStore.setState({ selected: '<id>' })`, then wait 150 ms.
- Authored contracts at HEAD (`src/game/data.ts`): `m01` GLASS VEIL (sector `eu`, intelReq 2), `m02` HOLLOW CROWN (`as`, intelReq 2), `m03` RUST HAVEN (`na`, intelReq 1). At intel 1, GLASS VEIL and HOLLOW CROWN are intel-locked and RUST HAVEN is open.
- DOM read points:
  - Row: `.wm-op`. Its visible reason is `.wm-op-main i`, and it carries `aria-label` and `aria-disabled`.
  - Generated / priority chip: `.wm-op-meta .chip`.
  - Scan marker: `.globe-marker.contract`. Its tooltip reason is `.tip i`, and it carries `aria-label`.
  - Phase: `useAppStore.getState().phase`.
- Teardown: stop the dev server, confirm nothing listens on port 4200, close the browser.

---

## Test Case: IF-017-01 — Failed: the open authored row (North America) reads CAMPAIGN LOST

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-017 failed: every row in na reads CAMPAIGN LOST`
**Preconditions**: Fixture `failed`. Focus `na`.
**Steps**:
1. List every `.wm-op` in OPEN CONTRACTS. For each one, record the `.wm-op-main i` text and the `aria-label`.
2. Confirm that the RUST HAVEN row is in the list (it is open when the campaign has not failed).
3. Note any row that has a generated or priority chip.
**Expected Result**: The list has at least one row. Every row's visible reason is exactly `CAMPAIGN LOST`, and every `aria-label` ends `// LOCKED // CAMPAIGN LOST` (for example `RUST HAVEN // LOCKED // CAMPAIGN LOST`). No row text or label contains `REQUIRES INTEL LVL`.
**Pass Criteria**: The row count is at least 1, and the number of rows that break the expected text is 0. (The probe passes a sector with no rows, so the count must be checked.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-02 — Failed: intel-locked authored rows (Europe, Asia) read CAMPAIGN LOST, not REQUIRES INTEL LVL 2

**AC covered**: AC-1 (edge: both intel-locked and campaign-lost)
**Coverage**: Covered by R1 probe checks: `IF-017 failed: every row in eu reads CAMPAIGN LOST` and `IF-017 failed: every row in as reads CAMPAIGN LOST`
**Preconditions**: Fixture `failed`. Intel level 1, so GLASS VEIL and HOLLOW CROWN are also intel-locked.
**Steps**:
1. Focus `eu`. Record `.wm-op-main i` and `aria-label` for every `.wm-op`.
2. Confirm that the GLASS VEIL row is present.
3. Focus `as`. Repeat step 1, and confirm that the HOLLOW CROWN row is present.
**Expected Result**: GLASS VEIL reads `CAMPAIGN LOST` with `aria-label` `GLASS VEIL // LOCKED // CAMPAIGN LOST`. HOLLOW CROWN reads `CAMPAIGN LOST` with `aria-label` `HOLLOW CROWN // LOCKED // CAMPAIGN LOST`. Every other row in both sectors reads the same way. `REQUIRES INTEL LVL 2` appears nowhere in either list.
**Pass Criteria**: Both named rows are present, both sectors have at least 1 row, and 0 rows break the expected text.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-03 — Failed: rows in the remaining sectors, including generated rows, read CAMPAIGN LOST

**AC covered**: AC-1 ("every contract row"; the story's Setup names "an open or generated row")
**Coverage**: Hand-walk. R1 reads only `eu`, `na` and `as`, and it does not tell generated rows from authored ones.
**Preconditions**: Fixture `failed`.
**Steps**:
1. Focus each of `sa`, `af` and `oc` in turn. For each sector, record the row count, `.wm-op-main i`, `aria-label` and any `.wm-op-meta .chip` text. If the sector shows the empty state (`NO CONTRACTS POSTED IN …`), record that instead.
2. From IF-017-01 and IF-017-02 plus step 1, name at least one row that has a `GENERATED` or `PRIORITY` chip.
3. Do not try `an` (Antarctica). It is not an open sector, which is WN-013's scope.
4. Capture `if-017-failed-generated-row.png` with a sector that holds a generated row in focus.
**Expected Result**: Every row in every sector reads `CAMPAIGN LOST`, and every `aria-label` ends `// LOCKED // CAMPAIGN LOST`. This includes generated and priority rows. At least one generated row exists in the fixture.
**Pass Criteria**: 0 rows break the expected text across all six open sectors, and at least one row that was checked carries a generated or priority chip. If the fresh fixture has no generated row in any sector, mark the case **Fail-fixture** (not a product fail), write "no generated row in fixture" under Actual Result, and raise it to qa-lead.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-04 — Failed: the Scan markers still read CAMPAIGN LOST and agree with the rows

**AC covered**: AC-1 ("as the Scan markers already do"; the pass condition "the markers still read `CAMPAIGN LOST`")
**Coverage**: Hand-walk. R1 has no marker check. Smoke item 5 (`production/qa/smoke-2026-10-24-sprint-011.md`) read the markers at `ca6d51e`; HEAD's `src/` is the same tree.
**Preconditions**: Fixture `failed`. The globe has loaded: `.globe-status` is absent, so the status is not `ACQUIRING EARTH IMAGERY` or `RESTORING ORBITAL VIEW`.
**Steps**:
1. List every `.globe-marker.contract` and record its `aria-label` and `aria-disabled`. Read the DOM; markers that are not projected keep their `hidden` attribute, and their labels can still be read.
2. Read the `.tip i` text inside each contract marker.
3. Bring one visible marker into view (GLASS VEIL in `eu` is the default focus) and hover it. Capture `if-017-failed-marker-tip.png` with its tooltip showing.
4. Compare each marker's cause with the row of the same codename from IF-017-01 and IF-017-02.
**Expected Result**: Every contract marker has `aria-label` `<codename> // LOCKED // CAMPAIGN LOST`, `aria-disabled="true"`, and `.tip i` = `CAMPAIGN LOST`. Each marker's cause matches the cause on its row.
- When the campaign has failed, the code filters generated contracts out of the marker set, so only the authored markers (GLASS VEIL, HOLLOW CROWN, RUST HAVEN) are expected here (`src/ui/WorldMap.tsx` ~:337).
- Record that set. This case does not judge it.
**Pass Criteria**: At least 1 contract marker is present. 0 markers read anything other than `CAMPAIGN LOST`. 0 marker/row pairs disagree.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-05 — Failed: clicking a locked row leaves the phase on the World Network

**AC covered**: AC-2 (guard b)
**Coverage**: Covered by R1 probe check: `IF-017 failed: clicking a row stays on the World Network`
**Preconditions**: Fixture `failed`. Focus `as` (the last sector R1 focuses before it clicks).
**Steps**:
1. Click the first `.wm-op`. The probe uses `{ force: true }`.
2. Wait 200 ms. Read `useAppStore.getState().phase`.
3. Capture `if-016-017-failed.png`. This is the probe's capture, with the failed banner and the rows in view.
**Expected Result**: The phase is `world`. No Brief opens.
**Pass Criteria**: `phase === 'world'`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-06 — Failed: every locked row, clicked normally, opens nothing and selects no mission

**AC covered**: AC-2 (guard b). This case widens R1's single forced click to every row, to a real pointer click, and to the mission selection.
**Coverage**: Hand-walk
**Preconditions**: Fixture `failed`. Before step 1, record the selected mission in `useAppStore`.
**Steps**:
1. In `eu`, `na` and `as`, click every `.wm-op` with a normal (not forced) pointer click at the centre of the row. After each click, wait 200 ms and read `phase` and the selected mission.
2. Read `aria-disabled` on each row.
3. Tab to one locked row. Confirm that it takes focus, because rows stay tab stops (story Implementation Notes). Then press Enter, and then Space. Read `phase` after each key.
**Expected Result**: After every click and key press, the phase is still `world`, and the selected mission is the same as before step 1. Every row has `aria-disabled="true"`. The locked row takes focus.
**Pass Criteria**: 0 interactions change `phase` or the selected mission, every row has `aria-disabled="true"`, and the focused element is the row.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-07 — Not failed: the intel-locked row in Europe still reads REQUIRES INTEL LVL n

**AC covered**: AC-2 (guard a, regression)
**Coverage**: Covered by R1 probe check: `IF-017 not failed: intel-locked rows read REQUIRES INTEL LVL n`
**Preconditions**: Fixture `opening` (`campaignFailed` false, intel 1). Focus `eu`.
**Steps**:
1. List the `.wm-op.locked .wm-op-main i` texts.
**Expected Result**: There is at least one locked row, and every locked row matches `^REQUIRES INTEL LVL \d$`. At `ad176af` the reading was `["REQUIRES INTEL LVL 2"]`.
**Pass Criteria**: The locked-row count is at least 1, and every text matches the pattern. No row reads `CAMPAIGN LOST`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-017-08 — Not failed: locked rows' aria-label, Asia, the open row and the markers

**AC covered**: AC-2 (guard a). This case widens R1, which reads only visible text and only in `eu`.
**Coverage**: Hand-walk
**Preconditions**: Fixture `opening` (`campaignFailed` false, intel 1).
**Steps**:
1. Focus `eu`. Read GLASS VEIL's `.wm-op-main i` and `aria-label`.
2. Focus `as`. Read HOLLOW CROWN's `.wm-op-main i` and `aria-label`.
3. Focus `na`. Read RUST HAVEN's `aria-label` and `aria-disabled`.
4. Read every `.globe-marker.contract` `aria-label`.
5. Capture `if-017-not-failed-locked-row.png` with `eu` in focus.
**Expected Result**:
- GLASS VEIL and HOLLOW CROWN each read `REQUIRES INTEL LVL 2`. Their `aria-label`s are `GLASS VEIL // LOCKED // REQUIRES INTEL LVL 2` and `HOLLOW CROWN // LOCKED // REQUIRES INTEL LVL 2`.
- RUST HAVEN is unlocked. Its `aria-label` starts `OPEN CONTRACT RUST HAVEN`, and it has no `aria-disabled`.
- The locked authored markers read `… // LOCKED // REQUIRES INTEL LVL 2`.
- `CAMPAIGN LOST` appears nowhere on the screen.
**Pass Criteria**: All four reads match exactly, and the number of `CAMPAIGN LOST` matches in `.screen` text and `aria-label`s is 0.
**Actual Result**:
**Pass/Fail**:

---

## Evidence checklist (for `production/qa/evidence/if-017/README.md`)

- Name the commit under test (`131a5c1`) and state "final sprint build".
- Paste the R1 IF-017 lines: 5 checks (`eu`, `na`, `as`, click, not failed). The run's verdict must be ALL PASS with 0 console or page errors.
- Captures: `if-016-017-failed.png` (R1), `if-017-failed-generated-row.png`, `if-017-failed-marker-tip.png`, `if-017-not-failed-locked-row.png`, all at 1280x720.
- Record AC-1 and AC-2 results on separate lines.
