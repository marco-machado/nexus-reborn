# TM-007 Manual cases: Brief matches the deployed mission (AC 8, smoke path a)

**Story**: `production/epics/tactical-mission/story-007-same-seed-same-mission-and-brief-agrees.md`
**Story type**: Integration. **Gate**: BLOCKING (automated tests carry the gate; this is the manual smoke path from the QA plan).
**Output location**: this file; results go in the Actual Result / Pass/Fail fields.
**Contract under test**: Glass Veil (m01), Intel 1, has a weather front HEAVY -> LIGHT.
**Environment**: dev server on port 4200, in-app browser (`mcp__Claude_Browser__*`), fresh profile, NEW OPERATION.
**Reading the world** (browser console / evaluate): `const w=(await import('/src/game/runtime.ts')).getWorld()`. Mission clock and weather-front time are read from the mission store and the world's weather script; record the exact expression used in each Actual Result.
**Method for all cases**: first record the Brief screen text for Glass Veil (screenshot kept in `production/qa/evidence/tm-007/`), then deploy without changing squad, difficulty or sector, then read the live world. Any mismatch is a Tactical/brief bug (AC 8), not a coverage sample.

---

## Test Case: TM-007-M1 - Insertion point
**Precondition**: New Operation, Intel 1, Glass Veil selected, Standard difficulty, nothing in contractsWon.
**Steps**:
  1. Open the Brief for Glass Veil; note the insertion point shown (text and map marker).
  2. Deploy the squad.
  3. In the console read the insertion/spawn position from `w` (the city insertion landmark and where the squad stands at sim time ~0).
**Expected Result**: The deployed insertion is the same location the Brief names and marks.
**Pass Criteria**: Brief insertion and world insertion are the same tile/landmark; any difference is FAIL.
Actual Result:
Pass/Fail:

## Test Case: TM-007-M2 - Sequential objectives
**Precondition**: As M1.
**Steps**:
  1. On the Brief, list the objectives in order, with required/optional flags.
  2. Deploy.
  3. Read `w.mission.objectives` and list id/type/order and required flags.
  4. Compare to `w.city.landmarks` for each objective's location against the Brief map markers.
**Expected Result**: Same number of objectives, same order, same required/optional flags, same locations as the Brief.
**Pass Criteria**: Every objective matches on count, order, flag and location; any difference is FAIL.
Actual Result:
Pass/Fail:

## Test Case: TM-007-M3 - Extraction
**Precondition**: As M1.
**Steps**:
  1. On the Brief, note the extraction point (text and map marker).
  2. Deploy.
  3. Read `w.city.extraction` (and the extraction landmark in `w.city.landmarks`).
**Expected Result**: The live extraction is the location the Brief marks.
**Pass Criteria**: Brief extraction and `w.city.extraction` are the same tile/landmark; any difference is FAIL.
Actual Result:
Pass/Fail:

## Test Case: TM-007-M4 - Force and civilian counts
**Precondition**: As M1.
**Steps**:
  1. On the Brief, note the CorpSec force count (including street patrols) and the civilian count.
  2. Deploy and, at sim time ~0, count `w.units` grouped by kind (CorpSec force, street patrol if a separate kind, civilians); exclude the player's operatives.
**Expected Result**: Live counts equal the Brief figures.
**Pass Criteria**: Force count and civilian count each equal the Brief value; any difference is FAIL.
Actual Result:
Pass/Fail:

## Test Case: TM-007-M5 - Opening hour
**Precondition**: As M1.
**Steps**:
  1. On the Brief, note the Opening hour / start time shown.
  2. Deploy and read the HUD clock within the first seconds; also read the mission store clock and the sim time `w.time`.
  3. Subtract the sim time from the HUD clock to get the opening time.
**Expected Result**: Opening time derived from the HUD/store equals the Brief Opening hour (to the displayed precision).
**Pass Criteria**: Brief Opening hour equals the HUD clock minus elapsed sim time at display precision; any difference is FAIL. Note: the front-weather brief label has no Opening hour (story advisory 7); if the Brief omits it, mark N/A and raise as an observation, not a defect.
Actual Result:
Pass/Fail:

## Test Case: TM-007-M6 - Weather-front timing
**Precondition**: As M1; Glass Veil's script is HEAVY -> LIGHT.
**Steps**:
  1. On the Brief, note the weather label: opening intensity, the front's clock time and the target intensity.
  2. Deploy and read the world weather script (opening intensity, front time, target intensity).
  3. Compare the front time against the Brief clock time using the Opening hour from M5.
  4. Optional: advance the sim until the front time passes and confirm weather changes HEAVY -> LIGHT once, at that time.
**Expected Result**: World weather starts HEAVY, has one front to LIGHT, at the time the Brief states.
**Pass Criteria**: Opening intensity, front intensity and front time all equal the Brief; any difference is FAIL.
Actual Result:
Pass/Fail:

---

## Execution record (2026-10-16, Sprint 8 /team-qa, Claude in the in-app browser, HEAD 2d49bc7)

Glass Veil from a fresh New Operation. Brief values read from the Brief screen text and its 96×96 tactical-map SVG; live values from `getWorld()` and `useMissionStore` after deploy.

| Case | Brief | Deployed | Result |
|---|---|---|---|
| Insertion | INS marker at (48, 88), Route Alpha starts (47.5, 88.5) | agents spawn (46.5–49.5, 88.5); `landmarks.insertion` (46.5, 88.5) r 4 | PASS |
| Objectives | PRIMARY reach the checkpoint gate; SECONDARY eliminate the CorpSec garrison; TERTIARY extract the squad | ob1 reach-zone, ob2 eliminate-tag garrison, ob3 extract; none optional; same order | PASS |
| Extraction | ring (48, 88) r 4.4, Route Omega ends (47, 88) | `city.extraction` (48, 88) r 4 | PASS |
| Counts | civilians 22, patrol contacts 08, garrison 07 | civilians 22, untagged enemies 8, garrison-tagged 7 | PASS |
| Opening hour | not printed on the Brief (story advisory) | `mission.openingHour` 80048 s = 22:14:08; HUD clock 22:14:08 at deploy | N/A (observation) |
| Weather front | HEAVY RAIN → LIGHT RAIN 22:16:38 | starts `heavy`; front `atSec` 150 → light; at sim t 150.0 the log reads "22:16:38 WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED." and weather became `light` | PASS |

Overall: PASS. The Brief does not state the Opening hour, so that field was compared through the front time (22:14:08 + 150 s = 22:16:38).
