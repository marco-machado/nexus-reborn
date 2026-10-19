# IF-003 manual test cases: contract navigation gates Brief, Assembly and Deploy

- **Story**: `production/epics/interface/story-003-contract-navigation-gates-brief-assembly-and-deploy.md` (AC4, AC5, AC6)
- **Story type**: UI. **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/if-003/` (re-run). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9/if-003 && cp production/qa/evidence/if-003/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9/if-003/`. Do not edit the copy.
3. Confirm that the script sets a 1280x720 viewport (`grep -n 1280 .../capture.mjs`).
4. `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-003/capture.mjs | tee production/qa/evidence/team-qa-2026-10-19-s9/if-003/capture-output.txt`
5. `git status --short production/qa/evidence/if-003/` prints nothing, so the signed-off folder was not overwritten. If it prints anything, restore with `git checkout -- production/qa/evidence/if-003/` and record a CONCERN.
6. Fixture labels: the contract is Glass Veil (`m01`) on a fresh campaign (`docs/mission-playbook.md`, "Glass Veil (m01, SEVERE)"). The Debrief is labelled `authored, assist outcome` in the transcript. Read the script and record whether that outcome was played or seeded. Seeded evidence must say so (playbook, Rules of the run).
7. After the last case, stop the dev server and confirm that `lsof -iTCP:4200 -sTCP:LISTEN` prints nothing.

---

## IF-003-TC-01: With no contract, Brief is locked

**ACs**: AC4
**Preconditions**: Run setup 1 to 6 done. The campaign is fresh and the phase is `world`, with `missionId=null`.
**Steps**:
1. Read the `nav, no contract:` line in `capture-output.txt`.
2. Read the `click locked BRIEF ->` line.
3. Open `01-nav-no-contract-brief-locked.png`.

**Expected Result**: The BRIEF entry reads `"locked":true,"ariaDisabled":"true","aria":"BRIEF // LOCKED // NO CONTRACT SELECTED"`. The click line reads `click locked BRIEF -> phase=world`. The capture shows BRIEF visibly locked.
**Pass Criteria**: BRIEF is locked and clicking it leaves the phase at `world`.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-02: With no contract, Assembly is reachable

**ACs**: AC4
**Preconditions**: TC-01 run.
**Steps**:
1. Read the `click ASSEMBLY ->` line.
2. Open `02-assembly-reachable-no-contract.png`.

**Expected Result**: The line reads `click ASSEMBLY -> phase=team`. The capture shows the Assembly screen.
**Pass Criteria**: The phase is `team` after the click.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-03: With no contract, Deploy is refused with a visible reason and starts no mission

**ACs**: AC4
**Preconditions**: TC-02 run.
**Steps**:
1. Read the `deploy button aria-label:`, `deploy button text:` and `click DEPLOY (no contract) ->` lines.
2. Open `03-deploy-refusal-no-contract.png` and find the missing-contract reason in the rendered pixels.

**Expected Result**: The aria-label reads `DEPLOY TEAM // NO CONTRACT SELECTED`. The click line reads `click DEPLOY (no contract) -> phase=team`, so no mission starts. AC4 requires that Deploy "shows the missing-contract reason". The transcript prints the visible button text as `DEPLOY TEAM >>`, so the visible reason must be confirmed in the capture. An aria-label alone is not shown on screen.
**Pass Criteria**: The phase stays `team`, and capture 03 shows missing-contract text on screen. If that text is only in the aria-label, the case fails: file a bug.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-04: With a contract selected, Brief is open

**ACs**: AC5
**Preconditions**: TC-03 run.
**Steps**:
1. Read the `select Glass Veil ->` and `nav, with contract:` lines.
2. Open `04-nav-with-contract-brief-open.png`.

**Expected Result**: The select line reads `select Glass Veil -> phase=brief missionId=m01`. BRIEF reads `"locked":false,"ariaDisabled":null,"aria":"BRIEF"`.
**Pass Criteria**: Brief opens and is unlocked with `m01` selected.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-05: Brief matches the deployed mission

**ACs**: AC5
**Preconditions**: TC-04 run. The `Accept Contract -> phase=team` and `Deploy -> phase=mission` lines are present.
**Steps**:
1. Read the `| Field | Brief | Deployed mission |` table in `capture-output.txt`.
2. Compare the two cells of each row as strings. Do not recompute any value.
3. Open `05-deployed-mission.png`.

**Expected Result**: The two cells are equal in the Seed, Difficulty, Insertion, Extraction, Objectives, Garrison, Civilians, Opening hour and Weather / front rows. AC5 lists "insertion, objectives, extraction, force/civilian counts, Opening hour and weather-front timing". The compared inputs (seed, Difficulty) are recorded in the table. AC5 also says "recorded seed/variant". Record whether a variant appears anywhere in the output.
**Pass Criteria**: Every row matches across the two columns.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-06: Authored Debrief Replay returns to Brief without reselecting

**ACs**: AC6
**Preconditions**: TC-05 run. The Debrief is authored work on a non-failed campaign (fixture label per Run setup 6).
**Steps**:
1. Read the `REPLAY button count:` and `Replay ->` lines.
2. Open `06-debrief-authored-replay-offered.png` and `07-replay-returns-to-brief.png`.

**Expected Result**: The lines read `REPLAY button count: 1` and `Replay -> phase=brief missionId=m01`. No `phase=world` line falls between Debrief and Brief, so the contract was not reselected (AC6: "Replay returns directly without reselecting").
**Pass Criteria**: There is exactly 1 Replay control, and it lands in Brief with `m01` and no World Network step in between.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-07: Returning from Debrief to World Network clears the selection and locks Brief

**ACs**: AC6
**Preconditions**: TC-06 run.
**Steps**:
1. In `capture.mjs`, find the step that prints `Return ->`. Confirm that it activates Debrief's World Network return, not a Brief or nav control. Record the line number.
2. Read the `Return ->` and `nav after return:` lines.
3. Open `08-nav-after-debrief-return-brief-locked.png`.

**Expected Result**: The lines read `Return -> phase=world missionId=null`, and BRIEF reads `"locked":true,"ariaDisabled":"true","aria":"BRIEF // LOCKED // NO CONTRACT SELECTED"`.
**Pass Criteria**: The Return comes from Debrief, `missionId` is null and BRIEF is locked.
**Actual Result**:
**Pass/Fail**:

## IF-003-TC-08: Generated work offers no Replay

**ACs**: AC6
**Preconditions**: TC-07 run. A generated offer is on the board (the transcript prints `generated offer on the board: <id>`).
**Steps**:
1. Read the `generated Debrief REPLAY button count:` line.
2. Open `09-debrief-generated-no-replay.png`.
3. Read the `errors:` line.

**Expected Result**: The line reads `generated Debrief REPLAY button count: 0`, and the capture shows no Replay control. The errors line reads `errors: []`.
**Pass Criteria**: There are 0 Replay controls on the generated Debrief and 0 errors.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. AC5 says "recorded seed/variant". The Brief-vs-deployed table records the seed and Difficulty, but it has no variant row. Is that enough of a record for AC5, or must the variant be recorded? Apply this only if TC-05 confirms that no variant appears.
