# Sprint 9 re-run test cases (R1 to R10): BUG-0001 and BUG-0002 verification and regression

- **Scope**: `production/qa/qa-strategy-sprint-009-2026-10-19-r2.md`, "Re-run scope", rows R1 to R10.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4 (re-run). qa.level: standard. Executor: Claude. Sign-off: qa-lead.
- **Bugs verified**: `production/qa/bugs/BUG-0001.md` (R1, R2, R3), `production/qa/bugs/BUG-0002.md` (R4, R5, R6).
- **Consistent with** (not edited): `if-008-pause-two-step-abort-cases.md` (TC-01, TC-04, TC-05, TC-06), `if-005-research-authorize-focus-return-cases.md` (TC-06), `if-001-surface-fit-1280x720-cases.md` (AC20 check, qa-lead's "IF-001 TC-05").

| Row | Story | Story type | Evidence location | Gate |
|---|---|---|---|---|
| R1, R2, R3 | IF-008 (AC11, AC12) | Integration | `production/qa/evidence/team-qa-2026-10-19-s9-r2/if-008/` | BLOCKING |
| R4, R5, R6 | IF-005 (AC18, AC19) | UI | `.../team-qa-2026-10-19-s9-r2/if-005/` | BLOCKING |
| R7 | IF-001 (AC1, AC20) | UI | `.../team-qa-2026-10-19-s9-r2/if-001/` plus `production/qa/evidence/if-001/README.md` | BLOCKING |
| R8 | IF-006, IF-007 | UI | `.../team-qa-2026-10-19-s9-r2/if-006/`, `.../if-007/` | BLOCKING (regression of signed stories) |
| R9 | AU-001 | Integration | `.../team-qa-2026-10-19-s9-r2/au-001/` | BLOCKING |
| R10 | all Logic/Integration | automated suite | `.../team-qa-2026-10-19-s9-r2/suite/` | BLOCKING |

## Run setup (once, before R1-a)

1. Record `git rev-parse HEAD` and `git status --short src/`. The expected HEAD is `e410b9d` or a later docs-only commit. If `git log --oneline e410b9d..HEAD -- src/` prints anything, record it and re-run R10 last.
2. `npm run dev -- --strictPort` (port 4200). Confirm `lsof -iTCP:4200 -sTCP:LISTEN` shows one listener.
3. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9-r2/{if-008,if-005,if-001,if-006,if-007,au-001,suite}`. Do not write into `bug-0001-fix-2026-10-19/`, `bug-0002-fix-2026-10-19/`, `team-qa-2026-10-19-s9/` or any signed story folder. Every retained script writes beside itself (`OUT` = its own directory), so run **copies** in the new folder, never the originals.
4. Browser: headless Chrome for Testing, temporary context, viewport exactly 1280x720 (`SWEEP_URL=http://localhost:4200/`). Each script must log its viewport; record it.
5. Named harness assists (allowed; every other input is real keyboard or pointer):
   - A1: `localStorage.clear()` for a fresh profile.
   - A2: reaching a live Glass Veil (m01) mission on Standard through the app store (Team Deploy, then `useAppStore.getState().startMission()`), as in BUG-0001's environment and the IF-007 capture.
   - A3: reading state only: `useMissionStore.getState()` (`paused`, `result`), `runtime.getWorld().t` (sim time), `document.activeElement` (tag, `aria-label`, whether inside `[role="dialog"]` and which dialog), the list of mounted `[role="dialog"]` `aria-label`s, `localStorage['nexus-settings-v1']`.
   - A4: `document.activeElement.blur()` to put focus on the body (used only in R2-c; record that it was used).
   - Write nothing to game state beyond A1/A2.
6. Before trusting any copied author script, open it and confirm that (a) its Space/Tab/Escape/Enter are `page.keyboard.press` (real input), not `dispatchEvent` or store calls, and (b) the assist list in its header matches A1 to A3. Record the result in the first case that uses it.
7. After the last case: stop the dev server and confirm that `lsof -iTCP:4200 -sTCP:LISTEN` prints nothing.

Recording state "S" below means: `{paused, dialogs, t, focused label, focused value}` via A3.

---

## R1: BUG-0001 TC-06, Space on each volume slider in Settings over pause (IF-008 AC11)

Script for R1 and R3: `cp production/qa/evidence/bug-0001-fix-2026-10-19/probe.mjs production/qa/evidence/team-qa-2026-10-19-s9-r2/if-008/probe.mjs`, unedited. Run it and tee to `probe-run.log`; it writes `probe-output.txt` and `probe-*.png`. Run-setup step 6 applies. If the script cannot drive one of the five sliders, drive that slider by hand with the same steps and record "manual" in Actual.

Shared preconditions for R1-a to R1-e: fresh profile (A1), live Glass Veil Standard mission with no result (A2), `paused:false`. Press Escape: "Mission paused" opens. Activate "Open settings" with Enter: dialogs = `["Settings"]`, `paused:true`.

### R1-a: MASTER slider

**Preconditions**: Shared, Settings open over pause.
**Steps**:
1. Press Tab until the focused element's `aria-label` is `MASTER volume` (`input[type=range]`).
2. Record S. Capture `probe-06a-slider-focused.png` (MASTER).
3. Press Space.
4. Wait 1 s. Record S again. Capture after-Space image.

**Expected Result**: `paused` stays `true`; dialogs stay `["Settings"]`; `t` is unchanged; focus is still `MASTER volume`. Value unchanged (recorded, not a criterion).
**Pass Criteria**: All four hold. Any one false = FAIL, reopen BUG-0001.
**Actual Result**:
**Pass/Fail**:

### R1-b: UI CUES slider

**Preconditions**: As R1-a.
**Steps**: As R1-a, with focus on `UI CUES volume`.
**Expected Result**: As R1-a, for `UI CUES volume`.
**Pass Criteria**: As R1-a.
**Actual Result**:
**Pass/Fail**:

### R1-c: COMBAT slider

**Preconditions**: As R1-a.
**Steps**: As R1-a, with focus on `COMBAT volume`.
**Expected Result**: As R1-a, for `COMBAT volume`.
**Pass Criteria**: As R1-a.
**Actual Result**:
**Pass/Fail**:

### R1-d: MUSIC slider

**Preconditions**: As R1-a.
**Steps**: As R1-a, with focus on `MUSIC volume`.
**Expected Result**: As R1-a, for `MUSIC volume`.
**Pass Criteria**: As R1-a.
**Actual Result**:
**Pass/Fail**:

### R1-e: AMBIENCE slider

**Preconditions**: As R1-a.
**Steps**: As R1-a, with focus on `AMBIENCE volume`.
**Expected Result**: As R1-a, for `AMBIENCE volume`.
**Pass Criteria**: As R1-a.
**Actual Result**:
**Pass/Fail**:

---

## R2: Space regression set (IF-008 AC11, IF-005 AC19)

Script: a new probe, `production/qa/evidence/team-qa-2026-10-19-s9-r2/if-008/space-probe.mjs`, written by the executor in the same style as the copied probe (A1 to A4 only). Outputs: `space-probe-output.txt`, `space-NN-*.png`. Each sub-case starts from a fresh page load, A1, A2.

### R2-a1: Space on the focused MUTE button in Settings over pause toggles MUTE only

**Preconditions**: Live mission, Escape, "Open settings". `MUTE // OFF`.
**Steps**:
1. Press Tab until focus is the button with `aria-label` `MUTE // OFF`. Record S and `muted` from `nexus-settings-v1`.
2. Press Space. Wait 1 s. Record S and `muted`.
3. Press Space again. Wait 1 s. Record S and `muted`.

**Expected Result**: After step 2 the label is `MUTE // ON`, `paused:true`, dialogs `["Settings"]`, `t` unchanged, focus on MUTE. After step 3 the label is `MUTE // OFF` with the same pause/dialog/time/focus state.
**Pass Criteria**: MUTE toggles on each Space; pause, dialog, sim time and focus never change.
**Actual Result**:
**Pass/Fail**:

### R2-a2: Space on the focused RESUME button resumes exactly once

**Preconditions**: Live mission, Escape pressed, pause modal open.
**Steps**:
1. Press Tab until focus is the RESUME button. Record S.
2. Press Space. Wait 1 s. Record S.

**Expected Result**: `paused:false`, dialogs `[]`, `t` advanced. The pause modal does not re-open (the button owns Space, so the global pause toggle does not also fire).
**Pass Criteria**: Unpaused, no dialog mounted, sim time increased.
**Actual Result**:
**Pass/Fail**:

### R2-b: Space with nothing focused in a live mission pauses

**Preconditions**: Live mission, not paused, no dialog. `document.activeElement` is `BODY` or the canvas (record which). If focus is on a HUD control, click an empty area of the 3D view first and record it.
**Steps**:
1. Record S.
2. Press Space. Wait 500 ms. Record S. Wait 1 s. Record `t`.

**Expected Result**: `paused:true`, dialogs `["Mission paused"]`, `t` unchanged between the two reads after Space.
**Pass Criteria**: Space pauses and the sim time freezes.
**Actual Result**:
**Pass/Fail**:

### R2-c: Space with no dialog control focused while paused resumes

**Preconditions**: State at the end of R2-b (paused, pause modal open).
**Steps**:
1. Click the "MISSION PAUSED" panel title (non-interactive text). Read `document.activeElement`. If it is still a control, apply A4 and record "A4 used".
2. Confirm `document.activeElement` is `BODY` (not inside `[role="dialog"]`). Record S.
3. Press Space. Wait 1 s. Record S.

**Expected Result**: `paused:false`, dialogs `[]`, `t` advanced (`dialogControlOwnsKey` returns false with no focused dialog control, so the pause toggle answers).
**Pass Criteria**: Unpaused and the sim time increased.
**Actual Result**:
**Pass/Fail**:

### R2-d: Escape from a focused slider closes Settings back to the pause modal

**Preconditions**: Live mission, Escape, "Open settings".
**Steps**:
1. Press Tab until focus is `MUSIC volume`. Record S.
2. Press Escape. Wait 500 ms. Record S.

**Expected Result**: dialogs `["Mission paused"]`, `paused:true`, `t` unchanged, focus inside the pause modal (as IF-008-TC-05 / IF-005 AC18). Escape is never owned by a dialog control.
**Pass Criteria**: Settings closed, still paused, focus inside "Mission paused".
**Actual Result**:
**Pass/Fail**:

### R2-e: Abort armed, then Space on a Settings control does not confirm the Abort

**Preconditions**: Live mission, Escape, pause modal open, Abort shows `ABORT`.
**Steps**:
1. Activate Abort once (Enter on the `Abort mission` button). Record that it reads `CONFIRM?` and the phase is `mission`.
2. Within 1 s, activate "Open settings" (Enter). Record S.
3. Press Tab until focus is `MASTER volume`. Press Space. Then Tab to `MUTE // OFF` and press Space. Record S, `appStore.phase` and `missionStore` outcome after each.
4. Press Escape to close Settings. Read the Abort button label at once and again 4 s later. Do not press it. Restore MUTE to OFF by pointer if needed.

**Expected Result**: Through steps 2 to 4 the phase stays `mission`, outcome stays `null`, `paused:true`, no `nexus-save-v1` write is caused by the abort path. Space never confirms the Abort. Step 4's label is recorded only: whether a pending arm survives Settings is open design question IF-008 advisory 3, not a pass criterion.
**Pass Criteria**: No abort occurs and the mission stays paused. The step 4 label is written in Actual either way.
**Actual Result**:
**Pass/Fail**:

---

## R3: IF-008 TC-01, TC-04, TC-05 re-run (same run as R1)

Source: the R1 probe run in `production/qa/evidence/team-qa-2026-10-19-s9-r2/if-008/probe-output.txt`. Compare with `production/qa/evidence/team-qa-2026-10-19-s9/if-008/probe-output.txt` (team-qa run).

### R3-a: TC-01, Space pauses, sim and camera freeze, Resume works

**Preconditions**: Live mission, no result.
**Steps**:
1. Find the `TC-01` lines (Space opens pause, sim time frozen, camera focus and footprint frozen, still paused after pan keys and drag, Resume unpauses and sim advances, pan control moves camera when live).
2. Open `probe-01-space-pause.png`.

**Expected Result**: All `TC-01` lines read PASS, matching the team-qa run. Capture shows "Mission paused".
**Pass Criteria**: Every TC-01 line PASS.
**Actual Result**:
**Pass/Fail**:

### R3-b: TC-04, lapse disarms, still paused, next press only re-arms

**Preconditions**: Paused, Abort idle.
**Steps**:
1. Find the three `TC-04` lines.
2. Open `probe-04-rearmed-after-lapse.png`.

**Expected Result**: `first press arms` (`CONFIRM?`, phase `mission`); `lapse disarms, still paused` (`ABORT`, `paused:true`); `next press after the lapse only re-arms` with `at0` and `at500` both `["CONFIRM?","mission",null]`.
**Pass Criteria**: 3 of 3 PASS.
**Actual Result**:
**Pass/Fail**:

### R3-c: TC-05, Settings inside the freeze; close focuses pause

**Preconditions**: Paused.
**Steps**:
1. Find the two `TC-05` lines.

**Expected Result**: `Settings open inside the freeze` with two equal `t` values; `close returns to pause with focus inside it` with `focusInPause:true`.
**Pass Criteria**: 2 of 2 PASS.
**Actual Result**:
**Pass/Fail**:

### R3-d: Probe hygiene

**Steps**: Read the last line of `probe-output.txt`.
**Expected Result**: `ALL PASS` (the script prints `FAILS: n, errors m` otherwise), 0 page and 0 console errors. Vite HMR WebSocket errors, if any, are copied verbatim into Actual and judged separately.
**Pass Criteria**: `ALL PASS`.
**Actual Result**:
**Pass/Fail**:

---

## R4: BUG-0002 verification, focus returns to Menu SETTINGS (IF-005 AC19)

Scripts, both copied unedited into `production/qa/evidence/team-qa-2026-10-19-s9-r2/if-005/`:
- `probe-teamqa.mjs` <- `production/qa/evidence/team-qa-2026-10-19-s9/if-005/probe.mjs` (the probe that found the bug; Tab only).
- `probe.mjs` <- `production/qa/evidence/bug-0002-fix-2026-10-19/if-005-menu/probe.mjs` (adds the Shift+Tab trap).

Both print `ALL PASS` on success, or `FAILS: n`. The strategy's "`FAILS: 0`" is read as `ALL PASS` (the scripts never print `FAILS: 0`).

### R4-a: Original team-qa probe passes at HEAD

**Preconditions**: Fresh profile (A1), Menu loaded, no dialog.
**Steps**:
1. Run `probe-teamqa.mjs`; tee `probe-teamqa-run.log`. Rename its output to `probe-teamqa-output.txt` after the run if the two probes share an output name (record it).

**Expected Result**: Both close lines (Escape, CLOSE (Enter)) read PASS with label `OPEN SETTINGS // AUDIO, CONTROLS AND ACCESSIBILITY`; `errors: []`; last line `ALL PASS`.
**Pass Criteria**: `ALL PASS`.
**Actual Result**:
**Pass/Fail**:

### R4-b: Close by Escape returns focus to SETTINGS; Tab and Shift+Tab trapped

**Preconditions**: Fresh profile, Menu loaded.
**Steps**:
1. Run `probe.mjs`; tee `probe-run.log`.
2. Read the four `Menu Settings (Escape)` lines.
3. Open `probe-01-menu-after-settings-close.png`.

**Expected Result**: `opens with focus inside` (`CLOSE`, `inSettings:true`); `Tab stays trapped over 30 presses`; `Shift+Tab stays trapped over 30 presses`; `closes and focus returns to the opening control` with `tag:"BUTTON"`, `isBody:false`, label `OPEN SETTINGS // ...`. The capture shows the focus brackets on SETTINGS.
**Pass Criteria**: 4 of 4 PASS and the focus ring is visible on SETTINGS.
**Actual Result**:
**Pass/Fail**:

### R4-c: Close by CLOSE (Enter) returns focus to SETTINGS; Tab and Shift+Tab trapped

**Preconditions**: As R4-b (same run).
**Steps**:
1. Read the four `Menu Settings (CLOSE (Enter))` lines and the last two lines.

**Expected Result**: As R4-b for the CLOSE path; `errors: []`; `ALL PASS`.
**Pass Criteria**: 4 of 4 PASS and `ALL PASS`.
**Actual Result**:
**Pass/Fail**:

### R4-d: Pointer open, Escape close (manual, not in either probe)

**Preconditions**: Fresh profile, Menu loaded.
**Steps**:
1. Pointer-click the Menu SETTINGS button.
2. Press Escape. Read `document.activeElement`.

**Expected Result**: Focus is on `OPEN SETTINGS // ...`, not `BODY`.
**Pass Criteria**: Focused label matches `/^OPEN SETTINGS/`.
**Actual Result**:
**Pass/Fail**:

---

## R5: Tab reachability of the Menu from the document start (IF-005, record either way)

Run by hand in the same browser setup (or a small `tab-probe.mjs` in `if-005/`); output `tab-probe-output.txt`.

### R5-a: Fresh load, Tab from the document start

**Preconditions**: Fresh profile (A1), no save, Menu loaded, no click made. `document.activeElement` is `BODY` (record).
**Steps**:
1. Press Tab up to 20 times. After each press record the focused `aria-label` (or text).
2. Repeat with a valid save present (Continue offered) only if R8's IF-006 run leaves one; otherwise record "no-save only".

**Expected Result**: Within 20 presses the Menu buttons are reached in DOM order: CONTINUE (only when offered), the New Operation button, then `OPEN SETTINGS // ...`. First mount does not move focus by itself (the new effect fires only on an open-to-closed edge).
**Pass Criteria**: Recorded. Pass if every Menu button is reached in order within 20 presses; otherwise record the order seen and raise it under CONCERNS (not a BUG-0002 reopen).
**Actual Result**:
**Pass/Fail**:

### R5-b: After a close, Tab and Shift+Tab move between Menu buttons

**Preconditions**: State after R4-b-style close: focus on SETTINGS.
**Steps**:
1. Press Shift+Tab. Record focus.
2. Press Tab. Record focus.
3. Click an empty area of the Menu background, confirm `BODY`, then Tab up to 20 times and record as R5-a.

**Expected Result**: Step 1 lands on the previous Menu button (New Operation); step 2 returns to SETTINGS; step 3 reaches the Menu buttons again.
**Pass Criteria**: Recorded. Pass if all three hold.
**Actual Result**:
**Pass/Fail**:

---

## R6: IF-005 smoke capture, pause path unaffected (AC18, AC19)

Script: `cp production/qa/evidence/if-005/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9-r2/if-005/capture.mjs`. First run `diff production/qa/evidence/if-005/capture.mjs production/qa/evidence/bug-0002-fix-2026-10-19/if-005-smoke/capture.mjs` and record the result (expected: no output). Run against port 4200; tee `capture-run.log`.

### R6-a: AC18 nested Settings close returns focus to the pause modal

**Preconditions**: Live mission via the script's own assists (read its header; record them).
**Steps**:
1. Find `AC18 pause modal open, focus inside` and `AC18 nested Settings close: focus restored to the pause modal`.
2. Open `06-settings-over-pause.png` and `07-pause-focus-after-settings.png`.

**Expected Result**: Both lines PASS; capture 07 shows focus on the pause modal.
**Pass Criteria**: 2 of 2 PASS.
**Actual Result**:
**Pass/Fail**:

### R6-b: AC19 pause trap and pause close

**Steps**:
1. Find `AC19 Pause: Tab stays trapped over 8 presses`, `AC19 Pause: Shift+Tab stays trapped over 8 presses`, `AC19 Settings: Tab/Shift+Tab stay trapped`, `AC19 Pause close: focus returns to the opening control`.
2. Open `05-pause-focus.png`.

**Expected Result**: All four PASS; pause close focus is `Pause and open the menu`.
**Pass Criteria**: 4 of 4 PASS.
**Actual Result**:
**Pass/Fail**:

### R6-c: Whole transcript

**Steps**: Read every line and the last line of `capture-output.txt`; count PASS lines.
**Expected Result**: No FAIL line, last line `ALL PASS`, no page or console errors. AC8 and the remaining AC19 lines (node, Authorize, Timeline) also PASS, as in IF-005-TC-01 to TC-05.
**Pass Criteria**: `ALL PASS`.
**Actual Result**:
**Pass/Fail**:

---

## R7: IF-001 AC20 record amendment and sweep re-run

### R7-a: README amendment present (AC20)

**Preconditions**: The amendment to `production/qa/evidence/if-001/README.md`, "Browser coverage", has been applied (qa-lead-review "AC20 check"; sign-off condition 2). This case verifies it; it does not apply it.
**Steps**:
1. `git diff production/qa/evidence/if-001/README.md` (or `git log -p -1` on it). Read the Exercised and Not exercised lists.
2. Search the two lists for: (i) the step 2 World Network chrome wording checks, naming SECTORS, Scan (ORBITAL SCAN), OPEN CONTRACTS, CLOCK SPEED, Pause/Resume, TIMELINE, FEED, TIME CODE, Control key, and the absence of VIEW SECTOR INTEL / GAME SPEED / WORLD CLOCK; (ii) the step 3 Glass Veil Brief weather line; (iii) the borderline items "Opening North America tax yield 4,080 CR / 24h" and "Influence is a point wallet".
3. If (ii) is under Exercised, confirm it cites a capture that exists and shows `WEATHER: HEAVY RAIN → LIGHT RAIN 22:16:38`.
4. Confirm no other line in the README changed.

**Expected Result**: (i) and (ii) each appear in exactly one list; (iii) is named; any Exercised citation points at an existing capture showing the line.
**Pass Criteria**: (i) and (ii) present; (ii)'s citation valid if under Exercised; diff limited to "Browser coverage". (iii) missing = CONCERN, not FAIL.
**Actual Result**:
**Pass/Fail**:

### R7-b: Sweep at HEAD, 40 runs clean

**Preconditions**: `cp production/qa/evidence/if-001/sweep.mjs production/qa/evidence/team-qa-2026-10-19-s9-r2/if-001/`. Record the seeded-or-played Debrief fixture from the script header (as IF-001 shared precondition 3).
**Steps**:
1. `SWEEP_URL=http://localhost:4200/ node .../team-qa-2026-10-19-s9-r2/if-001/sweep.mjs | tee .../if-001/run.log`. Record the exit code.
2. Find `<surface> @<scale>%: ok` for menu, settings, world-network, research, brief, assembly, mission-hud, pause, pause-settings, debrief at 90, 100, 110, 125.
3. Total clip and overlap findings in `sweep-result.json`.
4. Open `menu-1280x720-scale125.png`, `pause-1280x720-scale125.png`, `pause-settings-1280x720-scale125.png` and `settings-1280x720-scale125.png`; check that the focus ring (new on Menu SETTINGS after close, if the sweep closes Settings) and focused-control outlines do not clip or overlap text.

**Expected Result**: 40 `ok` lines; 0 clips; 0 overlaps (declared overlays excepted); `ALL SURFACES CLEAN`; exit 0; console errors 0 (copy any `THREE.WebGLRenderer: Context Lost.` lines verbatim, record only).
**Pass Criteria**: 40/40 `ok`, 0 clips, 0 undeclared overlaps, exit 0.
**Actual Result**:
**Pass/Fail**:

### R7-c: AC20 re-tick gate

**Steps**: Confirm R7-a and R7-b both PASS before AC20 in `story-001-...md` is re-ticked. Read the AC20 box state now and record it.
**Expected Result**: AC20 is unticked until R7-a and R7-b pass (strategy Blocker 3).
**Pass Criteria**: Box state matches the R7-a/R7-b outcome at sign-off.
**Actual Result**:
**Pass/Fail**:

---

## R8: Menu and toast regression (IF-006, IF-007)

### R8-a: IF-006 capture at HEAD

**Preconditions**: `cp production/qa/evidence/if-006/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9-r2/if-006/`. Its header names its assists (localStorage seeding, settings store for text scale/telemetry).
**Steps**:
1. Run with `SWEEP_URL=http://localhost:4200/`; tee `run.log`.
2. Compare PASS lines with `production/qa/evidence/if-006/capture-output.txt` (13 PASS lines there).
3. Open `01` to `05` captures at 125%.

**Expected Result**: Same PASS lines as the signed run, `PASS no page or console errors`, last line `ALL PASS`. No Menu button shows a focus ring on first mount (the new effect only fires on Settings close).
**Pass Criteria**: `ALL PASS` with the same set of PASS lines.
**Actual Result**:
**Pass/Fail**:

### R8-b: IF-007 capture at HEAD

**Preconditions**: `cp production/qa/evidence/if-007/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9-r2/if-007/`. Its default port is 4217; pass `SWEEP_URL=http://localhost:4200/`.
**Steps**:
1. Run; tee `run.log`.
2. Count PASS lines; compare with `production/qa/evidence/if-007/capture-output.txt`.

**Expected Result**: 27 check lines PASS as before (the signed transcript has 28 lines containing "PASS", one of them `ALL PASS`), `errors: []`, `ALL PASS`.
**Pass Criteria**: `ALL PASS` with the same PASS set.
**Actual Result**:
**Pass/Fail**:

### R8-c: Space with a tutorial toast on screen

**Preconditions**: Fresh profile (A1), live Glass Veil mission (A2), tutorial toast 1/9 visible (`role="status"`), not paused. Part of `space-probe.mjs` (R2) or a separate step; capture `space-toast-*.png`.
**Steps**:
1. Ensure focus is `BODY` or the canvas (click empty 3D view if needed). Record S and the toast title.
2. Press Space. Wait 500 ms. Record S and whether the toast is still shown. Capture.
3. Press Space. Wait 1 s. Record S and the toast title.
4. Tab until focus is the `Dismiss tutorial step ...` button. Record S. Press Space. Wait 1 s. Record S and the toast title.

**Expected Result**: Step 2: `paused:true`, "Mission paused" open, toast step unchanged (not advanced by Space). Step 3: `paused:false`, `t` advances, same toast step. Step 4: recorded only. The toast is `role="status"`, not a dialog, so `dialogControlOwnsKey` is false and Space is expected to toggle pause rather than dismiss the toast; this was already so before the fix (button-only guard also required a dialog). No spec line rules on it.
**Pass Criteria**: Steps 2 and 3 hold. Step 4 written in Actual either way; if it pauses instead of dismissing, record as an observation for the design owner, not a defect.
**Actual Result**:
**Pass/Fail**:

---

## R9: AU-001 Settings persistence through the Menu close path

Evidence: `production/qa/evidence/team-qa-2026-10-19-s9-r2/au-001/` (`persist-output.txt`, `persist-NN-*.png`). Steps follow smoke item 8 (`production/qa/smoke-2026-10-19-sprint-009.md`).

### R9-a: Set MUSIC 40 and MUTE ON from the Menu, close, reload, values persist

**Preconditions**: Fresh profile (A1), Menu loaded, defaults `musicVol:100`, `muted:false`. Record `nexus-settings-v1` (may be absent).
**Steps**:
1. Pointer-click Menu SETTINGS. Settings opens.
2. Tab to `MUSIC volume`. Press ArrowLeft 12 times (step 5: 100 to 40). Read the on-screen value next to MUSIC.
3. Tab to `MUTE // OFF`. Press Space (or Enter). Confirm the label reads `MUTE // ON`.
4. Press Escape. Read `document.activeElement`.
5. Read `nexus-settings-v1`.
6. Reload the page. Open Settings by pointer. Read MUSIC value and MUTE label. Capture.

**Expected Result**: Step 2 shows 40. Step 4 focus is `OPEN SETTINGS // ...`. Step 5 has `musicVol:40`, `muted:true`. Step 6 shows MUSIC 40 and `MUTE // ON`.
**Pass Criteria**: Storage and UI both show 40 / ON after reload, and focus returned on close.
**Actual Result**:
**Pass/Fail**:

### R9-b: Restore defaults and close with CLOSE

**Preconditions**: State after R9-a step 6 (Settings open after reload).
**Steps**:
1. Tab to `MUSIC volume`; press ArrowRight 12 times (to 100). Tab to `MUTE // ON`; press Space (to OFF).
2. Activate CLOSE with Enter. Read `document.activeElement`.
3. Read `nexus-settings-v1`. Reload, open Settings, read MUSIC and MUTE.

**Expected Result**: Focus on `OPEN SETTINGS // ...` after CLOSE. Storage `musicVol:100`, `muted:false`. After reload: MUSIC 100, `MUTE // OFF`.
**Pass Criteria**: Values restored in storage and UI; focus returned on close.
**Actual Result**:
**Pass/Fail**:

---

## R10: Automated suite at HEAD (all Logic/Integration stories)

**Preconditions**: Run setup step 1 recorded. No uncommitted `src/` changes.
**Steps**:
1. `npm run test 2>&1 | tee production/qa/evidence/team-qa-2026-10-19-s9-r2/suite/vitest.log`. Record the file count, test count and exit code.
2. Confirm `src/ui/abortArm.test.ts` includes and passes "BUG-0001: Space on a focused Settings slider, opened from pause, keeps the freeze".
3. `npm run lint 2>&1 | tee .../suite/lint.log`; record exit code.
4. After all other cases, `git log --oneline <HEAD recorded in setup>..HEAD -- src/`. If it prints anything, repeat steps 1 to 3 and record both runs.

**Expected Result**: Exit 0; 60 files, 1,539 tests (or the new totals if tests were added, recorded); the BUG-0001 test passes; lint exit 0.
**Pass Criteria**: Suite green at the HEAD the sign-off cites, lint clean.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

None to start. R2-e step 4 (Abort arm surviving Settings) and R8-c step 4 (Space on a focused toast dismiss button) are recorded observations for open design questions, not pass criteria. If R1, R2-a to R2-d, R3 or R4 fails, reopen the bug via `/bug-report` and qa-lead sets the severity.
