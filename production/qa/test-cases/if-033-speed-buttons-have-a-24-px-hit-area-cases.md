# IF-033 manual test cases: speed buttons have a 24 px hit area

- **Story**: `production/epics/interface/story-033-speed-buttons-have-a-24-px-hit-area.md` (AC-1, AC-2 guard)
- **Story type**: UI. **Output location**: `production/qa/evidence/` (see Run setup step 3 for the folder). **Gate**: BLOCKING (retained screenshot of each state touched).
- **Sources**: story `## Acceptance Criteria` and `## QA Test Cases` (check `speed-button-hit-area`); `production/qa/qa-plan-sprint-011-2026-10-23.md` line 152 ("1X–8X ≥24×24; no overlap; `aria-pressed` intact; Pause/Resume measured as an observation"); `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-033 row: R1, status E) and section 4 (R1 run rules).
- **Build under test**: HEAD `131a5c1`. Existing evidence (`sprint-011/probe-output.txt` line 143: 1X/2X/4X/8X each `w 30, h 24`) dates from `ad176af` and is stale for HEAD (strategy section 1).
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude, headless. Sign-off: qa-lead.

## What the R1 probe covers for this story, and what it does not

Read from `production/qa/evidence/sprint-011/probe.mjs` (the IF-031..035 block, ~lines 806-867):

| Item | R1 probe check | Covers |
|---|---|---|
| 1X-8X box ≥24×24 at 100% | `IF-033 1X-8X each >= 24x24` | AC-1 fully (count must be 4; `getBoundingClientRect` of each `.wm-tbtn` whose text ends in `X`) |
| Pointer at each transport button's centre lands on that button | `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` | Centre point only; the check is shared with the slider, so read its `"transport":true` field on its own |
| Each speed button applies its speed when clicked | `IF-019 1X under the card applies and dismisses it` (and 2X, 4X, 8X) | Store `speed` / `paused` only; does **not** read `aria-pressed` |
| Pause/Resume box | `IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24` | Paused state only (the fixture pauses, so the button is RESUME) |
| Neighbours do not overlap | none | The probe's `boxoverlap` test compares only `position: absolute/fixed` siblings; `.wm-tbtn` sits in a flex row (`.wm-transport { display: flex; gap: 4px; }`), so it is never compared |
| `aria-pressed` marks the active speed | none | `grep aria-pressed probe.mjs` returns nothing |
| Labels unchanged | none | — |

So AC-1 is probe-covered; AC-2 and the AC-1 edge cases are hand-walks.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. Headless Chrome for Testing (playwright-cli / Playwright, never the user's Chrome), viewport exactly **1280x720**. Confirm `window.innerWidth === 1280 && window.innerHeight === 720` before any measurement.
3. Evidence folder: `production/qa/evidence/sprint-011-head-2026-10-24/` (strategy section 4 step 2). Hand-walk captures and the hand-walk transcript go in its `if-033/` subfolder. Never write over `production/qa/evidence/sprint-011/`.
4. R1 run (shared with IF-016..035; run once, not per story): `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`. The script is not edited. A FAIL is filed with `/bug-report`, not fixed in the script.
5. **Fixture for the hand-walks** = R1's `opening` state plus its IF-031..035 setup, built through the stores exactly as `probe.mjs` does:
   - `localStorage.clear()`, reload, `save.startNewOperation()`, `useAppStore.getState().goto('world')`;
   - `useTutorialStore.getState().markSeen('hint-worldmap')` (orientation card dismissed);
   - `useWorldStore.setState({ paused: true })`;
   - seed 14 Feed events (`useWorldStore.setState({ events, unread: 3 })`, copies of `events[0]` with ids 9000+);
   - `useSettingsStore.getState().setTextScale(100)`; high contrast off.
   - Wait for the orientation card to be absent (`!document.querySelector('.wm-onboard-wrap')`) before measuring.
6. After the last case: stop the dev server, confirm `lsof -iTCP:4200 -sTCP:LISTEN` prints nothing, and close every test browser.

---

## IF-033-TC-01: 1X, 2X, 4X and 8X each measure ≥24×24 CSS px at 1280x720, text scale 100%

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-033 1X-8X each >= 24x24`
**Preconditions**: Run setup steps 1-4 done; R1 has finished and written `probe-output.txt` to the HEAD evidence folder. Fixture as R1 builds it (`opening`, paused, 14 Feed events, text scale 100%, 1280x720).
**Steps**:
1. In the new `probe-output.txt`, find the line starting `PASS IF-033 1X-8X each >= 24x24` or `FAIL IF-033 ...`.
2. Read the JSON after `//`. Confirm it has exactly four entries with `t` = `1X`, `2X`, `4X`, `8X`, in that order.
3. Record each entry's `w` and `h`.
4. Open `if-031-035-targets.png` in the HEAD evidence folder. Confirm it is 1280x720 and the transport row (Pause, 1X, 2X, 4X, 8X, `CLOCK SPEED: PAUSED`) is visible and not clipped.
5. Confirm the R1 run's summary reports zero console or page errors (strategy section 4 step 3).

**Expected Result**: The line reads `PASS`. Four entries, each `w >= 24` and `h >= 24` (at `ad176af` they were `w 30, h 24`). The capture shows the transport row whole.
**Pass Criteria**: PASS line present, 4 entries, min(w) ≥ 24 and min(h) ≥ 24, capture is 1280x720 and shows all five transport buttons, zero console/page errors.
**Actual Result**:
**Pass/Fail**:

## IF-033-TC-02: The whole 24×24 box takes the pointer, not only its centre

**AC covered**: AC-1 (story Context: "the hit area carries the size")
**Coverage**: Hand-walk (centre point only is covered by R1 probe check: `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons`)
**Preconditions**: Hand-walk fixture (Run setup step 5), paused, 1280x720, text scale 100%.
**Steps**:
1. In the R1 `probe-output.txt`, read the `IF-032 pointer hits the slider ...` line and record its `"transport"` value separately from `"up"` / `"down"`.
2. In the page, for each of the four speed buttons (`.wm-tbtn` whose trimmed text ends in `X`), read `getBoundingClientRect()`.
3. For each button, call `document.elementFromPoint(x, y)` at five points: the centre, and the four corners inset 1 px (`left+1, top+1`), (`right-1, top+1`), (`left+1, bottom-1`), (`right-1, bottom-1`). For each point record whether `.closest('.wm-tbtn')` is that same button.
4. Record the 20 results in the hand-walk transcript.

**Expected Result**: `"transport":true` in the R1 line. All 20 points (5 per button × 4 buttons) resolve to their own button; nothing (orientation card, Feed, Timeline, a neighbour) covers any part of the box.
**Pass Criteria**: R1 `"transport"` is `true` and 20/20 `elementFromPoint` hits return the button being tested.
**Actual Result**:
**Pass/Fail**:

## IF-033-TC-03: Neighbouring transport buttons do not overlap

**AC covered**: AC-2 (guard) — "neighbouring buttons do not overlap"; AC-1 edge case "neighbours do not overlap"
**Coverage**: Hand-walk (no R1 check compares flex-row siblings)
**Preconditions**: Hand-walk fixture, 1280x720, text scale 100%. Measure twice: once paused (Pause button shows the RESUME glyph) and once unpaused at 1X (Pause shows the PAUSE glyph), because the Pause button's content changes with state.
**Steps**:
1. Paused: read `getBoundingClientRect()` of all five `.wm-tbtn` in DOM order (Pause/Resume, 1X, 2X, 4X, 8X).
2. For each adjacent pair (Pause-1X, 1X-2X, 2X-4X, 4X-8X), compute `gap = next.left - prev.right`. For every pair of the five (10 pairs), compute the intersection `w = min(right) - max(left)`, `h = min(bottom) - max(top)`.
3. Click `1X` with a real pointer click (`page.mouse.click` at its centre). Wait 250 ms. Repeat steps 1-2.
4. Capture `if-033-transport-paused.png` and `if-033-transport-1x.png` (1280x720 full page) for the two states.

**Expected Result**: In both states every adjacent `gap >= 0` (the CSS gap is 4 px; at `ad176af` the speed buttons sat at x 236.75 / 270.75 / 304.75 / 338.75 with width 30, i.e. 4 px apart). No pair of the 10 has both `w > 0` and `h > 0`.
**Pass Criteria**: 8/8 adjacent gaps ≥ 0 and 0/20 pairwise intersections with positive area across the two states; both captures retained.
**Actual Result**:
**Pass/Fail**:

## IF-033-TC-04: `aria-pressed` marks the active speed when the enlarged buttons are used

**AC covered**: AC-2 (guard) — "`aria-pressed` still marks the active speed"; AC-1 edge case "`aria-pressed` ... unchanged"
**Coverage**: Hand-walk (R1 probe check `IF-019 <label> under the card applies and dismisses it` confirms the store speed changes on click but never reads `aria-pressed`)
**Preconditions**: Hand-walk fixture, 1280x720, text scale 100%, starting paused.
**Steps**:
1. Paused: read `aria-pressed` on all five `.wm-tbtn`, the class list of each (`on` present or not), `useWorldStore.getState()` `{ paused, speed }`, and the `.wm-speed b` text.
2. Click `1X` with a real pointer click at its centre. Wait 250 ms. Read the same four things.
3. Repeat step 2 for `2X`, `4X`, `8X`, in that order.
4. Click `2X` again (moving down from 8X), wait 250 ms, read the same four things.
5. Click the Pause button. Wait 250 ms. Read the same four things.
6. With keyboard only: focus `4X` (`locator.focus()`), press Space, wait 250 ms, read the same four things.

**Expected Result**:
- Step 1 (paused): Pause `aria-pressed="true"`; 1X/2X/4X/8X all `"false"`; readout `PAUSED`; store `paused: true`.
- Steps 2-4 and 6: exactly one speed button has `aria-pressed="true"` and class `on`, and it is the one just activated; the other three speed buttons and the Pause button read `"false"`; store `{ paused: false, speed: n }` matches; readout reads `nX`.
- Step 5: back to the step 1 pattern (Pause `"true"`, all speeds `"false"`, `PAUSED`).
- In every step the button with `aria-pressed="true"` is the same button that carries `on` (state is not colour-only: ADR-0017).
**Pass Criteria**: In all 7 readings, the count of `aria-pressed="true"` among the four speed buttons is 1 when unpaused and 0 when paused, the pressed button equals the store `speed`, and `aria-pressed` agrees with the `on` class on all five buttons.
**Actual Result**:
**Pass/Fail**:

## IF-033-TC-05: Visible labels and accessible names are unchanged

**AC covered**: AC-1 edge case ("`aria-pressed` and labels unchanged"); supports AC-2
**Coverage**: Hand-walk
**Preconditions**: Hand-walk fixture, 1280x720, text scale 100%. Baseline is the pre-Sprint-11 source, `git show 05c7bd7^:src/ui/WorldMap.tsx` (read 2026-10-24): speed buttons render text `{s}X` with `aria-label={'CLOCK SPEED ' + s + 'X'}` and `aria-pressed={!paused && speed === s}`; at that commit `.wm-tbtn` had `height: 20px`.
**Steps**:
1. For each of the four speed buttons read `textContent.trim()`, `getAttribute('aria-label')`, and the accessible name (Playwright `getByRole('button', { name })` or `page.accessibility.snapshot()`).
2. Confirm each visible text appears inside its accessible name (label-in-name, WCAG 2.5.3).
3. Confirm each label is on one line and not clipped: `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight` on each button.

**Expected Result**: Texts `1X`, `2X`, `4X`, `8X`; aria-labels `CLOCK SPEED 1X`, `CLOCK SPEED 2X`, `CLOCK SPEED 4X`, `CLOCK SPEED 8X`; accessible names equal the aria-labels; each text is contained in its name; no button clips its label.
**Pass Criteria**: 4/4 text values, 4/4 aria-labels and 4/4 accessible names match the strings above exactly, and 0 buttons clip.
**Actual Result**:
**Pass/Fail**:

## IF-033-TC-06 (observation): Pause/Resume measured in both states

**AC covered**: AC-1 edge case ("measure Pause/Resume and report it as an observation"). Not a pass/fail gate for IF-033; IF-035 owns Pause's size (story Implementation Notes).
**Coverage**: Hand-walk for the unpaused (PAUSE) state; the paused (RESUME) state is covered by R1 probe check: `IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24` (selector `.wm-tbtn:first-child`).
**Preconditions**: Hand-walk fixture, 1280x720, text scale 100%.
**Steps**:
1. In R1 `probe-output.txt`, read the `IF-035 pause, unread, ...` line. If PASS it prints only a target count; if FAIL it lists the undersized boxes. Record which.
2. Paused: read `aria-label` (expect `RESUME STRATEGIC CLOCK`), `aria-pressed`, and `getBoundingClientRect()` w × h of the first `.wm-tbtn`.
3. Click `1X`, wait 250 ms. Read the same: `aria-label` (expect `PAUSE STRATEGIC CLOCK`), `aria-pressed`, w × h.
4. Write both measurements into the evidence README as an IF-033 observation, with a pointer to IF-035.

**Expected Result**: Both states measured and recorded. Expected from the CSS at HEAD (`.wm-tbtn { min-width: 30px; height: 24px; }`, shared class) is ≥30 × 24 in both states; any value below 24 in either axis is reported to IF-035, not failed here.
**Pass Criteria**: Observation recorded with both states' aria-label, aria-pressed and w × h. (No pass/fail; leave Pass/Fail as "Observation".)
**Actual Result**:
**Pass/Fail**:

---

## AC coverage map

| AC | Cases |
|---|---|
| AC-1 (1X-8X ≥24×24 at 1280x720, 100%) | TC-01 (R1), TC-02 (hit area), TC-05 (labels), TC-06 (Pause observation) |
| AC-2 guard (no overlap; `aria-pressed` marks active speed) | TC-03 (overlap), TC-04 (`aria-pressed`) |

Per the story's QA Test Cases, record AC-2's result separately from AC-1 in the evidence README.
