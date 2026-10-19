# IF-012 manual test cases: Assembly hire refusals and the heavy-tier hint

- **Story**: `production/epics/interface/story-012-assembly-hire-refusals-and-heavy-tier-hint.md` (AC26, AC28)
- **Story type**: UI. **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/if-012/` (re-run plus probe). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9/if-012 && cp production/qa/evidence/if-012/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9/if-012/`. Do not edit the copy.
3. `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-012/capture.mjs | tee production/qa/evidence/team-qa-2026-10-19-s9/if-012/capture-output.txt`. Confirm that the viewport is 1280x720.
4. `git status --short production/qa/evidence/if-012/` prints nothing.
5. The retained script checks the second heavy deployment in the log only, with no image, and it has no audio check. Those run as a new probe, `production/qa/evidence/team-qa-2026-10-19-s9/if-012/probe.mjs`: headless Chromium, 1280x720, `SWEEP_URL`. Its init script patches `AudioBufferSourceNode.prototype.start` to log `performance.now()` per call. Read `src/ui/sound.ts` first. If it exports a cue-request function, the probe also wraps that function and logs each cue id.
6. Fixture labels: record from the script how Credits (9,000 CR unaffordable, 500,000 CR otherwise), the full roster (8 / 8) and the over-limit and heavy squads are seeded.
7. After the last case, stop the dev server and confirm that port 4200 has no listener.

---

## IF-012-TC-01: An unaffordable hire shows cost against Credits and a disabled hire with the reason

**ACs**: AC28
**Steps**:
1. Read the three `unaffordable:` PASS lines and `unaffordable: nothing clipped at 1280x720`.
2. Open `01-unaffordable-hire-1280x720.png`.

**Expected Result**: Each candidate shows `COST <n> CR // CREDITS 9,000 CR` and `INSUFFICIENT CREDITS // <n> CR SHORT`, with `"disabled":true` and `"clipped":false` (AC28: "hire cost versus Credits is visible and hire is disabled with the matching reason").
**Pass Criteria**: 3 of 3 candidates show the ledger, the reason and a disabled HIRE, with nothing clipped.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-02: A full roster shows cost against Credits and a disabled hire with the capacity reason

**ACs**: AC28
**Steps**:
1. Read the `full roster:` lines.
2. Open `02-full-roster-hire-1280x720.png`.

**Expected Result**: Each candidate shows `COST <n> CR // CREDITS 500,000 CR` and `ROSTER AT CAPACITY // 8 / 8`, with HIRE disabled and nothing clipped.
**Pass Criteria**: 3 of 3 candidates show the ledger and the capacity reason.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-03: Control: an affordable hire with an open roster is enabled

**ACs**: AC28 (control)
**Steps**: Read `control: HIRE enabled with no reason text`. Open `03-hire-allowed-control-1280x720.png`.
**Expected Result**: `"why":""` and `"disabled":false` on all three candidates.
**Pass Criteria**: 3 of 3 candidates are enabled with no reason text.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-04: An over-limit deploy (> 400 kg) is refused, never enters Mission, and does not trigger the hint

**ACs**: AC26, AC28
**Steps**:
1. Read the four `over-limit:` lines.
2. Open `04-over-limit-deploy-refused-1280x720.png`.

**Expected Result**: The transcript reads `Deploy disabled`, then `OFFLOAD 30.1 KG BEFORE DEPLOYMENT`, then `DEPLOY TEAM // 30.1 KG OVER THE MASS LIMIT`, then `{"phase":"team","hints":[],"seen":false}`. The capture shows the visible reason next to the disabled Deploy (AC26: "refused with its reason and never enters Mission; it is not the heavy-tier mission-hint trigger").
**Pass Criteria**: The phase stays `team`, the hints list is empty, the advisory is not marked seen, and the reason is visible.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-05: A valid heavy-tier deploy shows the speed-penalty hint once

**ACs**: AC26
**Steps**:
1. Read `heavy tier shown in Assembly`, `heavy legal squad: Deploy enabled`, `Mission: one HEAVY LOADOUT advisory` and `Mission: advisory not clipped`.
2. Open `05-heavy-tier-advisory-in-mission-1280x720.png`. Record the sim time and the screen region where the advisory appears.

**Expected Result**: In Assembly the transcript reads `HEAVY LOAD // -0.15 M/S`. In Mission it reads `{"n":1,"text":"ADVISORY // HEAVY LOADOUT...every operative moves slower this mission."}` with `"clipped":false`.
**Pass Criteria**: Exactly 1 advisory, visible and not clipped.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-06 (probe): A later valid heavy deploy does not repeat the hint, with an image

**ACs**: AC26
**Preconditions**: The same campaign as TC-05, after the advisory was seen.
**Steps**:
1. Read the re-run line `second heavy deployment: Mission entered, advisory not repeated`.
2. Probe: deploy a second valid heavy-tier squad. At the sim time recorded in TC-05 (or later), capture `probe-06-second-heavy-deploy-no-advisory.png` with the TC-05 advisory region in frame.

**Expected Result**: The re-run reads `{"phase":"mission","hints":[],"toasts":0}`. The probe capture shows Mission with no advisory in that region (AC26: "A later valid deployment in the same campaign does not repeat it").
**Pass Criteria**: The phase is `mission`, the hints list is empty, and the image shows no advisory.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-07 (probe): Overdraft and Deploy refusals keep disabled controls and visible reasons, and request no refusal sound

**ACs**: AC28
**Preconditions**: The probe audio instrumentation from Run setup 5. Overdraft means the unaffordable hire (`INSUFFICIENT CREDITS // <n> CR SHORT`). If the story's Implementation Notes define Overdraft as a different surface, add that surface here.
**Steps**:
1. Probe: in the unaffordable fixture, click each disabled HIRE once. Wait 1 s.
2. Probe: in the over-limit fixture, click the disabled DEPLOY once. Wait 1 s.
3. Read the `start()` log and the cue log for the period from step 1 to the end of step 2. Capture `probe-07-refusals-1280x720.png`.

**Expected Result**: The controls stay disabled and the reasons stay visible after the clicks. The `start()` count in that period is 0, and the cue log has no refusal cue. If any start is logged, name its cue before calling it a failure. AC28 says "no refusal audio is required for either", so a refusal cue that is requested goes to qa-lead as a ruling.
**Pass Criteria**: The controls are disabled with reasons visible, and 0 refusal cues are requested.
**Actual Result**:
**Pass/Fail**:

## IF-012-TC-08: Run hygiene

**Steps**: Read the last two lines of `capture-output.txt` and the error count in `probe-output.txt`.
**Expected Result**: `PASS no console or page errors`, then `ALL PASS`. The probe has 0 page errors and 0 console errors.
**Pass Criteria**: 0 errors.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

None, unless TC-07 logs a refusal cue (see TC-07).

## AC boxes

- AC26: tick if TC-04, TC-05 and TC-06 pass, including the probe image. Otherwise record why: ____
- AC28: tick if TC-01, TC-02, TC-04 and TC-07 pass. Otherwise record why: ____
