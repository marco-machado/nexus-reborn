# IF-008 manual test cases: pause modal and two-step Abort

- **Story**: `production/epics/interface/story-008-pause-modal-and-two-step-abort.md` (AC11, AC12, EC-remap)
- **Story type**: Integration (documented playtest). **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/if-008/` (re-run plus probe). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9/if-008 && cp production/qa/evidence/if-008/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9/if-008/`. Do not edit the copy.
3. `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-008/capture.mjs | tee production/qa/evidence/team-qa-2026-10-19-s9/if-008/capture-output.txt`. Confirm that the viewport is 1280x720.
4. `git status --short production/qa/evidence/if-008/` prints nothing.
5. The retained script's transcript shows Escape only. It has no Space-opens-pause line, no camera-freeze line, no re-arm-after-lapse line and no Space-on-slider check. Those run as a new probe, `production/qa/evidence/team-qa-2026-10-19-s9/if-008/probe.mjs`: headless Chromium, 1280x720, `SWEEP_URL`, real keyboard and pointer input. It writes `probe-output.txt` and `probe-NN-*.png` beside itself. To read state, use `missionStore.getState()` and `runtime.getWorld()` (`docs/mission-playbook.md`, "Driving it from the browser"). Write nothing to state.
6. Fixture: Glass Veil (`m01`), Standard, on a fresh campaign, live with no result.
7. After the last case, stop the dev server and confirm that port 4200 has no listener.

---

## IF-008-TC-01: Escape and Space open pause, the sim and camera freeze, and Resume works

**ACs**: AC11
**Preconditions**: A live mission with no result (`"outcome":null,"paused":false,"result":"none"`).
**Steps**:
1. Re-run: read `Escape opens pause modal`, `sim frozen while paused` and `pause stays in mission phase`. Open `01-pause-open.png`.
2. Probe: unpause. Press Space. Read `paused` and the dialog name. Capture `probe-01-space-pause.png`.
3. Probe: while paused, record the camera position and focus. Press the camera pan keys and drag the main view. After 1 s, read the camera position and the sim time again.
4. Probe: activate Resume. After 1 s, read `paused` and the sim time.

**Expected Result**: Escape and Space each open `"dialog":"Mission paused"` with `"paused":true`. The sim time does not change while paused (today `t=4.39... -> 4.39...`). The camera position and focus do not change while paused (AC11: "freezes sim and camera"). After Resume, `paused` is false and the sim time advances.
**Pass Criteria**: Both keys pause, the sim time and the camera are unchanged while paused, and Resume restarts the sim.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-02: Pause prints the bindings from the live table, and the Pause bind is not remappable

**ACs**: AC11, EC-remap
**Steps**:
1. Read `bindings table printed`, `Pause / slots shown FIXED in Settings`, `Settings returns to pause menu` and `remap shows on return`.
2. Open `04-settings-from-pause.png` and `05-pause-after-remap.png`. Find the Pause row, the operative slot 1 to 4 rows and the mouse rows.

**Expected Result**: The bindings table prints rows (today `rows=27`). Pause and slots 1 to 4 show FIXED. The mouse rows offer no remap control (EC-remap: "Pause, operative slots 1–4 and mouse are not offered for remap"). After the remap, the transcript reads `rebound=true keys=Z`, and capture 05 shows the new key in the pause list.
**Pass Criteria**: The remapped key shows on return, and Pause, slots 1 to 4 and mouse have no remap control.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-03: The first Abort arms and discards nothing, and a second press within 3 s aborts

**ACs**: AC12
**Preconditions**: Paused, with Abort idle.
**Steps**:
1. Read `first Abort press arms, nothing discarded`. Open `02-abort-armed.png`.
2. Read `confirm aborts to World Network, no outcome, no save write`. Open `06-after-abort-confirm.png`.

**Expected Result**: When armed, the transcript reads `"abort":"CONFIRM?"`, `"hint":"PRESS AGAIN WITHIN 3 S TO ABORT MISSION"`, `"paused":true` and `"outcome":null`. After confirming, it reads `"phase":"world"` and `"outcome":null`, with no Debrief phase. `saveKeys` has no key except `nexus-settings-v1`, which comes from TC-02's remap, so there was no campaign write (AC12: "no Debrief/invoice or campaign write").
**Pass Criteria**: Arming changes no state, and confirming lands on World Network with a null outcome and no campaign key written.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-04: Without confirmation, 3 s disarms, the mission stays paused, and the next press only re-arms

**ACs**: AC12
**Steps**:
1. Read `lapse disarms, still paused`. Open `03-abort-lapsed-still-paused.png`.
2. Probe: after the lapse, press Abort once. Read the state at once, and again 500 ms later.

**Expected Result**: After the lapse, the transcript reads `"abort":"ABORT"`, `"hint":""` and `"paused":true`. In the probe, the next press shows `"abort":"CONFIRM?"`, the phase is still `mission` and the outcome is null (AC12: "the next activation only re-arms").
**Pass Criteria**: The lapse disarms and stays paused, and the next press arms without aborting.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-05: Settings opened from pause stays inside the freeze, and closing it focuses pause

**ACs**: AC11 (focus return cross-checks IF-005 AC18)
**Steps**:
1. Read `Settings opens inside the freeze` and `Settings returns to pause menu`.
2. Probe: after Settings closes, read `document.activeElement` and confirm that it is inside the pause modal.

**Expected Result**: With Settings open, the transcript reads `"dialog":"Settings"`, `"paused":true`, and the same `time` as the pause line. After close, it reads `"dialog":"Mission paused"`, and focus is inside the pause modal.
**Pass Criteria**: The sim time does not change while Settings is open, and focus returns to pause.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-06 (PROBE): Space on a focused volume slider in Settings-over-pause

**ACs**: AC11
**Preconditions**: A live mission, paused. A code trace (never run) claims that this input unpauses the mission and unmounts Settings.
**Steps**:
1. Probe: press Escape to pause. Activate Settings in the pause modal.
2. Press Tab until `document.activeElement` is a volume slider (`input[type=range]`). Record its label and value.
3. Read `paused`, the dialog name and the sim time. Capture `probe-06a-slider-focused.png`.
4. Press Space.
5. After 1 s, read `paused`, the dialog name, the sim time and `document.activeElement` again. Capture `probe-06b-after-space.png`.

**Expected Result**: AC11 holds: "keeps Settings inside the freeze". After Space, `paused` is still true, the Settings dialog is still mounted, the sim time is unchanged and focus is still in Settings.
**Pass Criteria**: `paused === true`, Settings is open and the sim time is unchanged after Space. If this fails, file the bug through `/bug-report` as the next free `production/qa/bugs/BUG-NNNN.md` (the folder was empty or missing on 2026-10-19). Attach both captures and `probe-output.txt`. qa-lead sets the severity.
**Actual Result**:
**Pass/Fail**:

## IF-008-TC-07: Run hygiene

**Steps**: Read `no console errors` and the last line of the transcript, and the error count in `probe-output.txt`.
**Expected Result**: `PASS no console errors` and `ALL PASS`. The probe has 0 page errors and 0 console errors.
**Pass Criteria**: 0 errors.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

None. If TC-06 fails, that is a defect against AC11, not a ruling.
