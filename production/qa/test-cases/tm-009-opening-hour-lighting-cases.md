# TM-009 Manual cases: Opening hour is presentation (AC 10 manual half), evidence review

**Story**: `production/epics/tactical-mission/story-009-opening-hour-is-presentation-and-risk-index.md`
**Story type**: Visual/Feel. **Gate**: BLOCKING; evidence is retained screenshots plus qa-lead sign-off (not yet recorded in the README).
**Output location**: `production/qa/evidence/tm-009/`
**Method**: Evidence review. Open the files below; do not re-capture. Files: `01-night-open-1280x720.png`, `02-night-plus30s-1280x720.png`, `03-dusk-open-1280x720.png`, `README.md`, `capture.json`.

---

## Test Case: TM-009-E1 - HUD clock differs 30+ s apart
**Precondition**: Evidence folder present with the files above.
**Steps**:
  1. Open `01-night-open-1280x720.png` and read the HUD clock.
  2. Open `02-night-plus30s-1280x720.png` and read the HUD clock.
  3. In `capture.json` compare `nightA.simTime` and `nightB.simTime`.
**Expected Result**: Clocks differ; sim times are at least 30 s apart (README states 22:14:10 at 2.28 s and 22:14:43 at 35.40 s).
**Pass Criteria**: The two HUD clocks differ AND `nightB.simTime - nightA.simTime` >= 30.
Actual Result:
Pass/Fail:

## Test Case: TM-009-E2 - Clock matches the expected value
**Precondition**: As E1.
**Steps**:
  1. In `capture.json` compare `hudClock` with `expectedClock` for `nightA`, `nightB` and `dusk`.
  2. Check `openingHour` + `simTime` is consistent with `hudClock` (nightA: 80048 s = 22:14:08, + 2.28 s).
**Expected Result**: `hudClock` equals `expectedClock` in all three records.
**Pass Criteria**: Three of three records equal.
Actual Result:
Pass/Fail:

## Test Case: TM-009-E3 - Sky colour the same in both night shots
**Precondition**: As E1.
**Steps**:
  1. View 01 and 02 side by side at the same zoom.
  2. Compare the sky/ground colour grade and the lamp glows.
**Expected Result**: Same cool blue night grade in both; no visible colour shift. (Units and the alert advisory may differ.)
**Pass Criteria**: Reviewer sees no grade difference in sky or ground tone. The README notes this was by eye with no pixel diff; if a reviewer disputes it, FAIL pending a pixel comparison.
Actual Result:
Pass/Fail:

## Test Case: TM-009-E4 - Light direction the same in both night shots
**Precondition**: As E1.
**Steps**:
  1. View 01 and 02 side by side.
  2. Compare the direction of shadows on the same static structures.
**Expected Result**: Shadows fall in the same direction in both.
**Pass Criteria**: Shadow direction on at least one fixed structure is identical in 01 and 02.
Actual Result:
Pass/Fail:

## Test Case: TM-009-E5 - Dusk and night lighting differ at open
**Precondition**: As E1.
**Steps**:
  1. View `01-night-open-1280x720.png` and `03-dusk-open-1280x720.png`.
  2. In `capture.json` confirm `nightA.period` is `night` and `dusk.period` is `dusk`.
  3. Compare overall grade and brightness.
**Expected Result**: Dusk (RUST HAVEN, 18:14:08) is warmer and brighter than night (GLASS VEIL, 22:14:08).
**Pass Criteria**: Periods read `night` and `dusk`, and the grades are visibly different. Caveat: the missions also differ in city and weather (heavy vs none); the same-script comparison is covered by the automated tests, so note the caveat in Actual Result.
Actual Result:
Pass/Fail:

## Test Case: TM-009-E6 - Evidence completeness and sign-off
**Precondition**: As E1.
**Steps**:
  1. Confirm all five files exist and screenshots are 1280x720.
  2. Check `capture.json` `errs` holds only `favicon.ico` 404s.
  3. Check the README for a qa-lead sign-off line.
**Expected Result**: Files complete, no other console errors, qa-lead sign-off recorded.
**Pass Criteria**: Files and errs conditions hold. The sign-off line is currently absent (README: "not recorded here"); mark FAIL on this item until qa-lead signs.
Actual Result:
Pass/Fail:

---

## Execution record (2026-10-16, Sprint 8 /team-qa)

Evidence review by qa-lead of `production/qa/evidence/tm-009/` (all three PNGs opened; 1280×720 by `sips`).

| Case | Result |
|---|---|
| E1 clock differs, 30+ s apart | PASS — 22:14:10 vs 22:14:43; sim gap 33.12 s |
| E2 clock matches expected | PASS — `hudClock` equals `expectedClock` in all three records |
| E3 sky colour same | PASS — same night grade, lamp glows, rain overlay (by eye) |
| E4 light direction same | PASS — shadows identical in direction and shape |
| E5 dusk vs night differ | PASS — warmer grey-beige dusk vs blue-teal night; different missions and weather (caveat) |
| E6 evidence complete and signed | PASS — sign-off recorded in the README and the QA plan |

Overall: PASS. QA sign-off (qa-lead, 2026-10-16) recorded.
