# IF-032 manual test cases: Timeline track has a 24 px hit area

- **Story**: `production/epics/interface/story-032-timeline-track-has-a-24-px-hit-area.md` (AC-1, AC-2 guard; story `## QA Test Cases` check `timeline-hit-area`)
- **Story type**: UI. **Gate**: BLOCKING (UI evidence: retained 1280x720 screenshot of each state touched). The real-drag gap itself is classed Advisory in the QA strategy (F9).
- **Output location**: the case results are recorded in this file. Evidence goes to `production/qa/evidence/sprint-011-head-2026-10-24/` (QA strategy section 4, rule 2), with IF-032 hand-walk captures named `if-032-*.png`.
- **Sources**: QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` line 35 (table) and line 151 (checklist); QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 5 F9/F10, section 6 IF-032 row and hand-walk addendum **H2**.
- **Build under test**: HEAD `131a5c1`. **Written**: 2026-10-24, Sprint 11, `/team-qa` phase 4. Executor: Claude. Sign-off: qa-lead.

## Execution mode

Headless Chrome for Testing at exactly 1280x720 against `npm run dev` on port 4200. No headed window.

- **R1 cases** are covered by the shared probe `production/qa/evidence/sprint-011/probe.mjs`, run unchanged on HEAD with `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/`. The case passes when the named check prints `PASS` in that run's `probe-output.txt`. The R1 IF-032 block runs on the probe fixture **`opening`** (`fresh()` → `dismissCard()` → `pause()`, then 14 seeded Feed events), at text scale 100.
- **Hand-walk cases** need a real pointer or key event, which R1 does not send (probe README "Not exercised": "Real pointer drag on the Timeline (hit-testing only)"). Run them from a throwaway node script in the session scratchpad that reuses `probe.mjs`'s launch code (`playwright-core` from the global `@playwright/cli`, same Chrome for Testing path, viewport 1280x720) and its fixture helpers, and drives `page.mouse.move/down/up` and `page.keyboard.press`. Do not edit `probe.mjs` (strategy section 4, rule 3).

### Hand-walk fixture: `timeline-live`

The probe's `opening` state, plus the clock assist from the probe's `review` fixture so the 24 h window is full:

1. `fresh()` (goto, `localStorage.clear()`, reload, `save.startNewOperation()`, `appStore.goto('world')`), then `dismissCard()` (`tutorialStore.markSeen('hint-worldmap')`), then `pause()` (`worldStore.setState({ paused: true })`).
2. `setScale(100)` (`settingsStore.setTextScale(100)`).
3. `worldStore.setState({ t: 30 * 3600, review: null })` (Live, `t` = 108000 s).
4. Wait 500 ms (orientation card fade settled; strategy section 4, rule 1).

### Reading the scrub value

On `.wm-tl-track` (`role="slider"`): `aria-valuenow` (hours relative to live, -24 to 0, one decimal) and `aria-valuetext` (`LIVE` when Live, otherwise the review time). In the store: `useWorldStore.getState().review` (`null` = Live) and `.t`. Track geometry `r` = `.wm-tl-track` `getBoundingClientRect()`; centre line `cy = r.top + r.height / 2`. Scrub maths (`src/ui/WorldMap.tsx` `seek`): `f = clamp01((clientX - r.left) / r.width)`; `f > 0.985` → Live, else `review = t - 86400 * (1 - f)`.

## Shared preconditions (run once, before any case)

1. `git -C /Users/machado/Projects/nexus-reborn rev-parse --short HEAD` prints `131a5c1` and `git status --short src/` prints nothing. Record the hash in every Actual Result.
2. The Chrome for Testing binary at `probe.mjs`'s default path exists, or `PROBE_CHROME` points to an installed one (record the path used).
3. `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing; then start `npm run dev -- --strictPort --port 4200` in the background and wait for the listener.
4. `production/qa/evidence/sprint-011-head-2026-10-24/` is used for all output. Committed files in `production/qa/evidence/sprint-011/` stay unchanged.
5. Every run records zero `pageerror` and zero console errors.

**Teardown (after the last case)**: stop the dev server; `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing; no Chrome for Testing process from the run remains.

---

## IF032-TC-01 — Slider hit area is at least 24 px high; drawn track stays 12 px

- **AC covered**: AC-1 (hit area ≥24 px; drawn track may stay 12 px)
- **Coverage**: Covered by R1 probe check: `IF-032 Timeline slider pointer hit area >= 24 px high`
- **Preconditions**: Shared preconditions; R1 fixture `opening`, text scale 100, 1280x720.
- **Steps**:
  1. Run `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011/probe.mjs`.
  2. Open the run's `probe-output.txt` and find the line for this check.
  3. Read the JSON detail `{"drawn":…,"hit":…}`.
- **Expected Result**: The line starts `PASS`. `hit` ≥ 24 (the ad176af run read 25). `drawn` = 12 (the drawn track was not enlarged to meet the AC). `if-031-035-targets.png` exists in the output folder at 1280x720.
- **Pass criteria**: `PASS` AND `hit >= 24` AND `drawn == 12`. Any other value fails; `drawn != 12` with `hit >= 24` is recorded as a deviation from the story's implementation note, not a pass.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-02 — Hit-test at +/-11 px from the centre line lands on the slider

- **AC covered**: AC-1 ("press the pointer 11 px above and below the track's centre line": hit-test half)
- **Coverage**: Covered by R1 probe check: `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` (the `up` and `down` fields)
- **Preconditions**: TC-01's R1 run completed.
- **Steps**:
  1. In the same `probe-output.txt`, find the line for this check.
  2. Read `up` and `down` in the JSON detail.
- **Expected Result**: `"up":true,"down":true`: `elementFromPoint` at `(r.left + r.width/2, cy - 11)` and `(…, cy + 11)` resolves inside `.wm-tl-track`.
- **Pass criteria**: both fields `true`. This case alone does not pass AC-1's "the pointer scrubs" clause; TC-03 and TC-04 must also pass.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-03 — Real drag from 11 px ABOVE the centre line changes the scrub value (H2)

- **AC covered**: AC-1 ("the pointer scrubs from both offsets"), QA strategy H2 / F9
- **Coverage**: Hand-walk
- **Preconditions**: Shared preconditions; fixture `timeline-live`; `aria-valuetext` reads `LIVE` and `review` is `null`. Record `t0 = useWorldStore.getState().t`.
- **Steps**:
  1. Read `r` for `.wm-tl-track`; record `r.top`, `r.height`, `r.left`, `r.width`, `cy`.
  2. `page.mouse.move(r.left + 0.25 * r.width, cy - 11)`.
  3. `page.mouse.down()`. Wait 100 ms. Read `aria-valuenow`, `aria-valuetext`, `review`.
  4. `page.mouse.move(r.left + 0.50 * r.width, cy - 11, { steps: 10 })`. Wait 100 ms. Read the same three values.
  5. `page.mouse.up()`. Wait 100 ms. Read the same three values and `t`.
  6. Capture `if-032-drag-above-review.png` at 1280x720.
- **Expected Result**:
  - After step 3: `review` = `t0 - 64800` (f = 0.25), `aria-valuenow` = -18 (±0.2), `aria-valuetext` is not `LIVE`.
  - After step 4: `review` = `t0 - 43200` (f = 0.50), `aria-valuenow` = -12 (±0.2), not `LIVE`.
  - After step 5: values unchanged from step 4 (release does not move the pin); `t` = `t0` (scrubbing never writes `t`, story implementation note / ADR-0014).
  - The capture shows the handle at about the track midpoint and the header date in review styling.
- **Pass criteria**: the scrub value changes on press (Live → -18) AND changes again on move (-18 → -12), each within ±0.2 h, AND `t == t0`. A press that leaves `aria-valuetext` at `LIVE` fails.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-04 — Real drag from 11 px BELOW the centre line changes the scrub value (H2)

- **AC covered**: AC-1 ("the pointer scrubs from both offsets"), QA strategy H2 / F9
- **Coverage**: Hand-walk
- **Preconditions**: Re-apply fixture `timeline-live` (Live, `review` null). Record `t0`.
- **Steps**:
  1. Read `r` and `cy` as in TC-03.
  2. `page.mouse.move(r.left + 0.75 * r.width, cy + 11)`.
  3. `page.mouse.down()`. Wait 100 ms. Read `aria-valuenow`, `aria-valuetext`, `review`.
  4. `page.mouse.move(r.left + 0.40 * r.width, cy + 11, { steps: 10 })`. Wait 100 ms. Read the same.
  5. `page.mouse.up()`. Wait 100 ms. Read the same and `t`.
  6. Capture `if-032-drag-below-review.png` at 1280x720.
- **Expected Result**:
  - After step 3: `review` = `t0 - 21600` (f = 0.75), `aria-valuenow` = -6 (±0.2), not `LIVE`.
  - After step 4: `review` = `t0 - 51840` (f = 0.40), `aria-valuenow` = -14.4 (±0.2), not `LIVE`.
  - After step 5: values unchanged from step 4; `t` = `t0`.
- **Pass criteria**: value changes on press (Live → -6) AND on move (-6 → -14.4), each within ±0.2 h, AND `t == t0`.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-05 — Control: a press outside the hit band does not scrub

- **AC covered**: AC-1 (control for TC-03/TC-04: shows the drag check can fail, so a pass there is caused by the band and not by some wider listener). Not a separate AC.
- **Coverage**: Hand-walk
- **Preconditions**: Re-apply fixture `timeline-live`. Record `t0`. From `src/ui/ui.css`, the band is `.wm-tl-track::before { inset: -7px -1px }` on a 12 px border-box track, so it spans about `r.top - 6` to `r.top + 18`; `cy ± 14` falls outside it.
- **Steps**:
  1. Read `r` and `cy`. Record `document.elementFromPoint(r.left + 0.25 * r.width, cy - 14)` and `(…, cy + 14)` (tag and class).
  2. `page.mouse.move(r.left + 0.25 * r.width, cy - 14)`, `down()`, `move(r.left + 0.5 * r.width, cy - 14, { steps: 10 })`, `up()`. Read `review`, `aria-valuetext`.
  3. Repeat step 2 at `cy + 14`.
- **Expected Result**: After steps 2 and 3, `review` is still `null` and `aria-valuetext` is `LIVE`. Step 1's elements are not inside `.wm-tl-track`.
- **Pass criteria**: `review === null` after both presses. If either press scrubs, record the element from step 1 and the measured band edges. That is a finding for qa-lead (the band is larger than designed, or something else scrubs), not an IF-032 AC failure.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-06 — Dragging past ~98.5% of the track returns Live

- **AC covered**: AC-1 edge case ("dragging past ~98.5% returns Live"); story implementation note
- **Coverage**: Hand-walk
- **Preconditions**: Re-apply fixture `timeline-live`. Record `t0`.
- **Steps**:
  1. Read `r` and `cy`. `page.mouse.move(r.left + 0.25 * r.width, cy - 11)`, `down()`. Confirm `aria-valuenow` ≈ -18.
  2. Holding the button, `move(r.left + 0.97 * r.width, cy - 11, { steps: 10 })`. Wait 100 ms. Read `review`, `aria-valuenow`, `aria-valuetext`.
  3. Holding, `move(r.left + 0.99 * r.width, cy - 11, { steps: 5 })`. Wait 100 ms. Read the same, and whether `.wm-live:not(.review)` is present.
  4. `up()`. Capture `if-032-drag-to-live.png`.
  5. Repeat steps 1 to 4 at `cy + 11`, but in step 3 move to `r.right + 20` (past the track's right end; `f` clamps to 1).
  6. Read `t`.
- **Expected Result**:
  - Step 2: still review (`review` not null, `aria-valuenow` ≈ -0.7, `aria-valuetext` not `LIVE`). This is the below-threshold side.
  - Step 3: `review === null`, `aria-valuetext` = `LIVE`, `aria-valuenow` = 0, the live indicator (`.wm-live` without `.review`) is shown and `> GO LIVE` is gone.
  - Step 5: same as step 3 from the lower offset and past the end.
  - Step 6: `t == t0`.
- **Pass criteria**: step 2 is not Live AND steps 3 and 5 are Live AND `t == t0`.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-07 — Left/Right/Home/End still scrub the focused slider

- **AC covered**: AC-2 ("the keys still scrub")
- **Coverage**: Hand-walk (R1 sends no key events. The `reviewKey` unit tests in `src/ui/researchInput.test.ts` cover the pure function only, not the `onKeyDown` wiring on the enlarged element.)
- **Preconditions**: Re-apply fixture `timeline-live`. Record `t0`.
- **Steps**:
  1. `page.focus('.wm-tl-track')` (focus without a pointer press, so nothing scrubs). Confirm `document.activeElement` is `.wm-tl-track` and `aria-valuetext` is `LIVE`.
  2. Press `ArrowLeft`. Read `aria-valuenow`.
  3. Press `ArrowLeft`. Read.
  4. Press `ArrowRight`. Read.
  5. Press `Home`. Read.
  6. Press `ArrowLeft`. Read.
  7. Press `End`. Read `aria-valuenow`, `aria-valuetext`.
  8. Press `ArrowRight`. Read.
  9. Read `t` and `document.activeElement`.
- **Expected Result**: valuenow after each step: 2 → -1; 3 → -2; 4 → -1; 5 → -24; 6 → -24 (clamped at the oldest point); 7 → 0 with `LIVE`; 8 → 0 with `LIVE` (stays Live). `t == t0`; focus is still on `.wm-tl-track`; the page did not scroll.
- **Pass criteria**: all eight readings match exactly AND `t == t0` AND focus is unchanged.
- **Actual Result**:
- **Pass/Fail**:

## IF032-TC-08 — Hit-testing each transport button's centre returns that button

- **AC covered**: AC-2 ("`elementFromPoint` at each transport button centre returns that button"); story edge case "the hit area does not steal the transport buttons' centres"
- **Coverage**: Covered by R1 probe check: `IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons` (the `transport` field). Corroborated by the R1 checks `IF-019 PAUSE under the card applies and dismisses it`, `IF-019 1X …`, `IF-019 2X …`, `IF-019 4X …`, `IF-019 8X …` (real Playwright clicks, which fail if another element covers the button).
- **Preconditions**: TC-01's R1 run completed.
- **Steps**:
  1. In `probe-output.txt`, read the `transport` field of the IF-032 check.
  2. Confirm all five IF-019 transport click lines print `PASS`.
  3. Hand step, because the probe's `transport` value comes from `.every()` and is also `true` when no `.wm-tbtn` exists: in the `timeline-live` fixture, run `document.querySelectorAll('.wm-tbtn').length` and, for each button, `document.elementFromPoint(centre)?.closest('.wm-tbtn') === button`.
- **Expected Result**: `"transport":true`; five IF-019 PASS lines; step 3 reports 5 buttons (PAUSE, 1X, 2X, 4X, 8X), each `true`.
- **Pass criteria**: all three steps as expected. A count other than 5 fails, even when the probe line passes.
- **Actual Result**:
- **Pass/Fail**:

---

## AC coverage map

| AC | Cases |
|---|---|
| AC-1: hit area ≥24 px; drawn track may stay 12 px | TC-01 (R1), TC-02 (R1, hit-test), TC-03 and TC-04 (real drag, H2), TC-05 (control) |
| AC-1 edge: dragging past ~98.5% returns Live | TC-06 |
| AC-2 guard: keys still scrub | TC-07 |
| AC-2 guard: `elementFromPoint` at each transport centre returns that button | TC-08 (R1 plus a count check) |

The story asks for AC-2 to be recorded separately. In the fresh run's README, record TC-07 and TC-08 under "IF-032 AC-2" and name the captures used (`if-031-035-targets.png`, `if-032-drag-above-review.png`, `if-032-drag-below-review.png`, `if-032-drag-to-live.png`). Strategy F10 asks for this mapping.
