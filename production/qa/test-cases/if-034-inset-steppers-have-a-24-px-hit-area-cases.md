# IF-034 — Inset steppers have a 24 px hit area — Manual test cases

**Story**: `production/epics/interface/story-034-inset-steppers-have-a-24-px-hit-area.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/if-034/` (retained PNGs + click-through `README.md`), shared probe output in `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING (UI)
**Build under test**: HEAD `131a5c1`
**Sources**: story `## Acceptance Criteria` (AC-1, AC-2 guard) and `## QA Test Cases`; QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` (line 37, line 153); QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` §5 F1/F10, §6 IF-034 row and hand-walk **H2b**.
**Executor**: Claude, headless Chrome for Testing via `npx playwright-cli` (or the probe's playwright-core), viewport exactly 1280x720, against `npm run dev` on port 4200. Never the user's Chrome. Stop the dev server afterwards and confirm nothing listens on 4200.

## What the R1 probe covers, and what it does not

Read from `production/qa/evidence/sprint-011/probe.mjs` at HEAD:

| Probe check (exact name) | Fixture | AC |
|---|---|---|
| `IF-034 inset steppers each >= 24x24` (probe.mjs:853) | `opening`, text scale 100 (block "IF-031 to IF-035: hit targets at 100%") | AC-1 size |
| `IF-034 steppers absent while the Influence note is up` (probe.mjs:897) | `influence-note` | AC-2 absence |

The probe **does not** activate the steppers at all: no click on `.wm-inset-chev`, no `Enter`, no `Space`, and no assertion on `selected` or on Antarctica (`grep -i "antar\|'Enter'\|'Space'"` in probe.mjs returns nothing; the only `keyboard.press` calls are Tab / Shift+Tab / Escape for IF-018). So every activation and skip-Antarctica case below is a **Hand-walk**, click included, not only the keyboard (H2b). The last recorded probe values (`probe-output.txt:144`, at `ad176af`, stale vs HEAD per strategy F1) were `w 24, h 30` for both steppers.

Supporting unit test (not a substitute for the browser walk): `src/state/worldStore.test.ts:1365` "stepSector walks the open sectors and wraps both ways".

## Common setup (all cases)

- `npm run dev` on port 4200; headless 1280x720.
- Fixtures, named as in probe.mjs `STATES` (state set through the stores, a named harness assist):
  - **`opening`**: `fresh()` (localStorage clear, `save.startNewOperation()`, `goto('world')`), `dismissCard()` (`markSeen('hint-worldmap')`), `pause()`. Focused sector at start: `eu` (`worldStore.ts:867`). Influence 0, so the Influence moment note does not fire.
  - **`influence-note`**: as `opening`, then `useWorldStore.setState({ influence: 8, selected: 'na' })`.
- Text scale 100: `useSettingsStore.getState().setTextScale(100)`.
- Open-sector cycle (`OPEN_SECTORS`, `src/game/atlas.ts:148`, Antarctica `an` is `locked: true`): `na NORTH AMERICA` → `sa SOUTH AMERICA` → `eu EUROPE` → `af AFRICA` → `as ASIA` → `oc OCEANIA` → wraps to `na`.
- Read the focused sector two ways after every activation: `useWorldStore.getState().selected` and the `.wm-inset-tag` text (`<SECTOR NAME> // <CORP NAME>`).
- Selectors: previous = `.wm-inset-chev.l` / `[aria-label="FOCUS PREVIOUS SECTOR"]`; next = `.wm-inset-chev.r` / `[aria-label="FOCUS NEXT SECTOR"]`.
- Record "Antarctica seen" as: `selected === 'an'` or the tag contains `ANTARCTICA`, at any step.

---

## Test Case: IF-034-01 — Both steppers measure at least 24x24 CSS px

**AC covered**: AC-1
**Covered by R1 probe check**: `IF-034 inset steppers each >= 24x24`
**Preconditions**: Fixture `opening`; text scale 100; Influence note not showing; HEAD `131a5c1`.
**Steps**:
1. Run R1 (`PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011/probe.mjs`) on HEAD.
2. Read the `IF-034 inset steppers each >= 24x24` line in the fresh `probe-output.txt`.
3. Record both `w` and `h` values in `production/qa/evidence/if-034/README.md`; name the shared capture `if-031-035-targets.png` as this state's screenshot (strategy F10).
**Expected Result**: The line reads `PASS`; exactly two boxes; each `w >= 24` and `h >= 24`.
**Pass Criteria**: PASS line present on a HEAD run, and both recorded boxes are ≥24 in both dimensions.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-02 — The whole 24x24 area hits the stepper in every open sector

**AC covered**: AC-1 (the hit area, not only the box: the spec says the hit area carries the size)
**Hand-walk** (the probe measures `getBoundingClientRect` only; nothing hit-tests the steppers, and the inset tag sits between them)
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. For each stepper, take its bounding box and sample `document.elementFromPoint` on a grid at 1 px pitch over a 24x24 square centred on the box centre.
2. Count samples whose `closest('.wm-inset-chev')` is that stepper.
3. Set `selected` in turn to `na`, `sa`, `af`, `as`, `oc` (longest tag: `NORTH AMERICA // ...`) and repeat steps 1-2 in each.
4. Capture `if-034-hit-area-na.png` (longest tag) and `if-034-hit-area-eu.png`.
**Expected Result**: In all six sectors, every sample in each 24x24 square resolves to its own stepper (no tag, SVG or panel element covers any part).
**Pass Criteria**: 576 of 576 samples hit, for each stepper, in each of the six open sectors.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-03 — Click NEXT steps through the open sectors and skips Antarctica

**AC covered**: AC-2 (click; skips Antarctica)
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Real pointer click (`page.mouse.click`) at the centre of `FOCUS NEXT SECTOR`.
2. Read `selected` and the tag.
3. Repeat steps 1-2 until six clicks are done.
**Expected Result**: Sequence after each click: `af`, `as`, `oc`, `na`, `sa`, `eu`. The wrap goes `oc` → `na`. Antarctica never seen. Tag name matches `selected` each time.
**Pass Criteria**: All six readings equal the expected sequence, and Antarctica is seen 0 times.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-04 — Click PREVIOUS steps backwards and skips Antarctica

**AC covered**: AC-2 (click; skips Antarctica)
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Real pointer click at the centre of `FOCUS PREVIOUS SECTOR`.
2. Read `selected` and the tag.
3. Repeat steps 1-2 until six clicks are done.
**Expected Result**: Sequence: `sa`, `na`, `oc`, `as`, `af`, `eu`. The wrap goes `na` → `oc`. Antarctica never seen.
**Pass Criteria**: All six readings equal the expected sequence, and Antarctica is seen 0 times.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-05 — A click near the edge of the enlarged area still steps

**AC covered**: AC-1 + AC-2 (the enlarged area is live, not only measured)
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Take the `FOCUS NEXT SECTOR` box. Real pointer click at (`x + 1`, `y + 1`) relative to the box (top-left corner, 1 px inside).
2. Read `selected`.
3. Reset `selected` to `eu`. Take the `FOCUS PREVIOUS SECTOR` box; click at (`x + w - 2`, `y + h - 2`) (bottom-right corner, 1 px inside).
4. Read `selected`.
**Expected Result**: Step 2 reads `af`; step 4 reads `sa`.
**Pass Criteria**: Both readings match.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-06 — Enter on a focused NEXT stepper steps and skips Antarctica

**AC covered**: AC-2 (Enter) — strategy H2b
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Focus `FOCUS NEXT SECTOR` (`page.focus('[aria-label="FOCUS NEXT SECTOR"]')`; named harness assist). Confirm `document.activeElement` is that button.
2. `page.keyboard.press('Enter')`.
3. Read `selected`, the tag, and whether `document.activeElement` is still the NEXT stepper.
4. Repeat steps 2-3 until six presses are done, without refocusing.
5. If focus left the stepper at any press: record it, then refocus before each remaining press and finish the six. Report the focus loss as a CONCERN (not a fail of this AC).
**Expected Result**: Sequence: `af`, `as`, `oc`, `na`, `sa`, `eu`. Antarctica never seen.
**Pass Criteria**: All six readings equal the expected sequence, and Antarctica is seen 0 times.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-07 — Enter on a focused PREVIOUS stepper steps and skips Antarctica

**AC covered**: AC-2 (Enter) — H2b
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Focus `FOCUS PREVIOUS SECTOR`; confirm it is `document.activeElement`.
2. Press `Enter`; read `selected`, the tag, and the focused element.
3. Repeat until six presses are done (focus-loss handling as IF-034-06 step 5).
**Expected Result**: Sequence: `sa`, `na`, `oc`, `as`, `af`, `eu`. Antarctica never seen.
**Pass Criteria**: All six readings equal the expected sequence, and Antarctica is seen 0 times.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-08 — Space on a focused NEXT stepper steps and skips Antarctica

**AC covered**: AC-2 (Space) — H2b
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Focus `FOCUS NEXT SECTOR`; confirm it is `document.activeElement`.
2. `page.keyboard.press('Space')` (keydown + keyup; a button fires on keyup).
3. Read `selected`, the tag, and the focused element.
4. Repeat until six presses are done (focus-loss handling as IF-034-06 step 5).
**Expected Result**: Sequence: `af`, `as`, `oc`, `na`, `sa`, `eu`. Each press steps exactly once (no double step). Page does not scroll (`window.scrollY` stays 0). Antarctica never seen.
**Pass Criteria**: All six readings equal the expected sequence, Antarctica seen 0 times, `scrollY === 0` throughout.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-09 — Space on a focused PREVIOUS stepper steps and skips Antarctica

**AC covered**: AC-2 (Space) — H2b
**Hand-walk**
**Preconditions**: Fixture `opening`; text scale 100; focused `eu`.
**Steps**:
1. Focus `FOCUS PREVIOUS SECTOR`; confirm it is `document.activeElement`.
2. Press `Space`; read `selected`, the tag, and the focused element.
3. Repeat until six presses are done (focus-loss handling as IF-034-06 step 5).
4. Capture `if-034-keyboard-focus.png` with the PREVIOUS stepper focused.
**Expected Result**: Sequence: `sa`, `na`, `oc`, `as`, `af`, `eu`. One step per press. `scrollY` stays 0. Antarctica never seen.
**Pass Criteria**: All six readings equal the expected sequence, Antarctica seen 0 times, `scrollY === 0` throughout.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-10 — Steppers absent while the Influence moment note replaces the inset

**AC covered**: AC-2 (absence)
**Covered by R1 probe check**: `IF-034 steppers absent while the Influence note is up`
**Preconditions**: Fixture `influence-note` (`influence: 8, selected: 'na'`); text scale 100.
**Steps**:
1. Run R1 on HEAD (same run as IF-034-01).
2. Read the `IF-034 steppers absent while the Influence note is up` line and the `IF-035 Influence note UNDERSTOOD >= 24x24` line beside it (proves the note is actually up).
3. Name `if-035-influence-note.png` as this state's screenshot in the IF-034 README.
**Expected Result**: Both lines `PASS`; stepper list `[]`; exactly one `.wm-moment-btn`.
**Pass Criteria**: Both PASS lines present on a HEAD run.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-11 — Under the Influence note the steppers are gone from the DOM and the keyboard

**AC covered**: AC-2 (absence, beyond visibility)
**Hand-walk** (the probe's `boxes()` filters on visibility; it does not show the buttons are unmounted or out of the Tab order)
**Preconditions**: Fixture `influence-note`; text scale 100; `.wm-moment` with `role="note"` present.
**Steps**:
1. Count `document.querySelectorAll('[aria-label="FOCUS PREVIOUS SECTOR"], [aria-label="FOCUS NEXT SECTOR"]').length`.
2. Focus the note's `UNDERSTOOD` (`.wm-moment-btn`), then press `Tab` 40 times, recording each `document.activeElement`'s `aria-label`/text; then `Shift+Tab` 40 times from the same start.
3. Read `selected` at the end.
**Expected Result**: Count is 0. No Tab or Shift+Tab stop is a stepper. `selected` is still `na` (Tabbing stepped nothing).
**Pass Criteria**: Count 0, zero stepper stops in 80 Tab stops, `selected === 'na'`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-034-12 — Steppers return after the note is dismissed, still 24x24 and still stepping

**AC covered**: AC-1 + AC-2 (guard on the state after the note)
**Hand-walk**
**Preconditions**: Fixture `influence-note`; text scale 100.
**Steps**:
1. Real pointer click on the note's `UNDERSTOOD`.
2. Count the two steppers and measure their boxes.
3. Press `Enter` on a focused `FOCUS NEXT SECTOR` once; read `selected`.
4. Capture `if-034-after-note.png`.
**Expected Result**: Note gone; two steppers present, each ≥24x24; one `Enter` moves `na` → `sa`.
**Pass Criteria**: Two boxes each ≥24 in both dimensions and `selected === 'sa'` after the press.
**Note**: the return of the inset after dismissal follows from `src/ui/WorldMap.tsx:962` (`moment.shown === null && <SectorInset>`); no AC states it. If the steppers do not return, log it as a design question for the owner, not as an IF-034 defect.
**Actual Result**:
**Pass/Fail**:

---

## AC coverage

| AC | Cases |
|---|---|
| AC-1 ≥24x24 at 1280x720, 100% | IF-034-01 (probe), 02, 05, 12 |
| AC-2 click steps, skips Antarctica | IF-034-03, 04, 05 |
| AC-2 Enter steps, skips Antarctica | IF-034-06, 07, 12 |
| AC-2 Space steps, skips Antarctica | IF-034-08, 09 |
| AC-2 steppers absent under the Influence note | IF-034-10 (probe), 11 |

README for `production/qa/evidence/if-034/` must list each case ID with its result, the measured boxes, the six-step sequences as read, and the captures: `if-031-035-targets.png`, `if-035-influence-note.png` (shared, from R1), `if-034-hit-area-na.png`, `if-034-hit-area-eu.png`, `if-034-keyboard-focus.png`, `if-034-after-note.png`.
