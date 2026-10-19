# IF-006 manual test cases: Menu Continue, New Operation, and telemetry persistence

- **Story**: `production/epics/interface/story-006-menu-continue-new-operation-and-telemetry-persistence-c.md` (AC9, AC17, AC21, AC25)
- **Story type**: UI. **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/if-006/` (re-run plus probe). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9/if-006 && cp production/qa/evidence/if-006/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9/if-006/`. Do not edit the copy.
3. `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-006/capture.mjs | tee production/qa/evidence/team-qa-2026-10-19-s9/if-006/capture-output.txt`. Confirm that the viewport is 1280x720.
4. `git status --short production/qa/evidence/if-006/` prints nothing.
5. The retained script does not exercise these checks: confirming the New Operation erase, Settings surviving it, comparing against the canonical fresh-operation fixture, telemetry while recording is off, Clear, and the log surviving New Operation. TC-06 to TC-08 run as a new probe, `production/qa/evidence/team-qa-2026-10-19-s9/if-006/probe.mjs`. The probe uses headless Chromium at 1280x720 and `SWEEP_URL`. It writes `probe-output.txt` and `probe-NN-*.png` beside itself, and it labels every value it seeds (`SEEDED:` prefix). Use real clicks for Menu, Settings and Balance controls.
6. Canonical fixture: read Persistence's canonical fresh-operation values from source, not from this file. The candidates found by `rg` are `src/state/save.ts`, `src/state/campaignStore.ts`, `src/state/campaignStore.test.ts`, `src/state/save.test.ts` and `design/gdd/persistence-and-validation.md`. Record the `file:line` used. Do not copy its numbers into this file.
7. After the last case, stop the dev server and confirm that port 4200 has no listener.

---

## IF-006-TC-01: A never-started campaign has no Continue

**ACs**: AC9, AC21
**Preconditions**: Persistence reports never-started. Storage is cleared by the script.
**Steps**:
1. Read the `never-started` lines.
2. Open `01-menu-never-started-scale125.png`.

**Expected Result**: The transcript reads `PASS never-started: Continue absent` and `PASS never-started: line // NO CAMPAIGN ON FILE`. The capture shows no CONTINUE.
**Pass Criteria**: Continue is absent and the never-started line is visible.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-02: An invalid or unreadable save has no Continue and shows a distinct reason

**ACs**: AC21
**Preconditions**: Persistence reports invalid or unreadable (the script's corrupt blob fixture).
**Steps**:
1. Read the `unreadable` lines.
2. Open `02-menu-unreadable-scale125.png` next to capture 01.

**Expected Result**: The transcript reads `PASS unreadable: Continue absent` and `PASS unreadable: visible reason distinct // SAVE UNREADABLE // DROPPED`. The text differs from `NO CAMPAIGN ON FILE` (AC21: "invalid/unreadable has a visible reason distinct from never-started").
**Pass Criteria**: Continue is absent, and the visible reason differs from capture 01.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-03: A valid save shows Continue

**ACs**: AC9, AC21
**Preconditions**: Persistence reports valid.
**Steps**:
1. Read the `valid` lines.
2. Open `03-menu-valid-scale125.png`.

**Expected Result**: The transcript reads `PASS valid: Continue present` and `PASS valid: line // CAMPAIGN ON FILE`.
**Pass Criteria**: Continue is present.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-04: The first New Operation press arms and leaves the campaign unchanged

**ACs**: AC17
**Preconditions**: The valid fixture from TC-03.
**Steps**:
1. Read the `armed:` lines.
2. Open `04-menu-new-operation-armed-scale125.png`.

**Expected Result**: The transcript reads `PASS armed: first press arms, blob unchanged // CONFIRM // ERASE SAVE?` and `PASS armed: button says confirm`.
**Pass Criteria**: The blob is unchanged after one press, and the button shows the confirm state.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-05: The 3-second arming window disarms when it expires

**ACs**: AC17
**Preconditions**: TC-04 run.
**Steps**:
1. Read `armed: window expiry disarms`.
2. In `capture.mjs`, confirm that the wait before the check is longer than 3 s of real time, and record the wait.

**Expected Result**: The transcript reads `PASS armed: window expiry disarms`. After the wait, the button label no longer matches `CONFIRM`.
**Pass Criteria**: The line is PASS, and the wait is longer than 3 s.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-06 (probe): Confirmed New Operation keeps Settings and resets to the canonical fixture

**ACs**: AC17
**Preconditions**:
- SEEDED nondefault Settings: Difficulty, Quality, one remap (for example Hold `H` to `J`), text scale 125, and the telemetry toggle set to its non-default value. Read each default from `src/state/settingsStore.ts` first.
- SEEDED progressed campaign: Credits, Intel, contractsWon, laboratories and tutorial-seen all differ from the canonical fixture.
- Storage writes succeed.

**Steps**:
1. Record all five Settings values and the five campaign fields (`probe-output.txt`).
2. On Menu, click NEW OPERATION once, then click it again within 3 s.
3. Read the Settings and the five campaign fields again. Capture `probe-06-after-new-operation.png`.
4. Compare the Settings with step 1. Compare the campaign fields with the canonical fixture from Run setup 6.

**Expected Result**: All five Settings match step 1. Credits, Intel, contractsWon, laboratories and tutorial-seen equal the canonical fresh-operation fixture (AC17: "those Settings still match; campaign ... match Persistence's canonical fresh-operation fixture").
**Pass Criteria**: 5 of 5 Settings are unchanged, and 5 of 5 campaign fields equal the fixture.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-07 (probe): Turning recording off adds no record and keeps earlier records

**ACs**: AC25
**Preconditions**: Telemetry is enabled with N ≥ 1 records. They are played, or SEEDED the way `capture.mjs` seeds them (`saveRecords`). Glass Veil is available.
**Steps**:
1. Control: with recording on, enter Glass Veil, pause, and Abort twice within 3 s. Record the record count before and after. If an Abort adds no record, repeat with a finished mission and record which ending was used.
2. Record the count N and the record ids.
3. In Settings, turn telemetry recording off (real click).
4. Repeat the ending from step 1 (Abort or finish).
5. Turn recording back on. Open Balance, read the count and ids, and capture `probe-07-balance-after-disabled-interval.png`.

**Expected Result**: The step 1 ending adds exactly 1 record with recording on, so the check can tell the two cases apart. After step 5 the count still equals N and the ids equal those from step 2 (AC25: "the earlier records remain and the disabled interval added none").
**Pass Criteria**: The control adds 1 record, and the final count and ids equal N and the step 2 ids.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-08 (probe): New Operation keeps the log and a successful Clear empties it

**ACs**: AC25
**Preconditions**: TC-07 run. The log has N ≥ 1 records and storage writes succeed.
**Steps**:
1. Confirm New Operation (two presses within 3 s). Open Balance and read the count.
2. In Balance, activate Clear. Read the count and capture `probe-08-balance-cleared.png`.

**Expected Result**: After New Operation the count still equals N (AC25: "New Operation does not"). After Clear it is 0 (AC25: "Successful Clear empties the log").
**Pass Criteria**: The count is N after New Operation and 0 after Clear.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-09: Balance is reachable while recording is off and the log has records

**ACs**: AC25
**Preconditions**: The re-run fixture: recording off, log with records.
**Steps**:
1. Read `Balance entry reachable while recording off` and `recording is off in Balance view`.
2. Open the re-run's `05-balance-recording-off-scale125.png`. Find the control or label that shows recording off.
3. If capture 05 does not show the recording-off state in frame, the probe captures `probe-09-balance-recording-off.png` with that state visible.

**Expected Result**: Both lines are PASS. One retained capture visibly shows Balance open with recording off (OQ9: "Balance remains reachable while recording is disabled because the log is nonempty"). The old capture 05 did not show recording off, so the transcript line alone is not enough.
**Pass Criteria**: Both lines are PASS, and a capture shows recording off with Balance open.
**Actual Result**:
**Pass/Fail**:

## IF-006-TC-10: Run hygiene

**ACs**: all
**Steps**: Read the last two lines of `capture-output.txt` and the error count in `probe-output.txt`.
**Expected Result**: `PASS no page or console errors`, then `ALL PASS`. The probe reports 0 page errors and 0 console errors.
**Pass Criteria**: 0 errors in both runs.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

None.
