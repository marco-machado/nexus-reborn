# IF-004 manual test cases: Chance vs Risk bands and World Network owner readouts

- **Story**: `production/epics/interface/story-004-chance-vs-risk-bands-and-world-network-owner-readouts.md` (AC7, AC27)
- **Story type**: UI. **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/if-004/` (re-run). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. `mkdir -p production/qa/evidence/team-qa-2026-10-19-s9/if-004 && cp production/qa/evidence/if-004/capture.mjs production/qa/evidence/team-qa-2026-10-19-s9/if-004/`. Do not edit the copy.
3. Confirm that the script sets a 1280x720 viewport.
4. `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/team-qa-2026-10-19-s9/if-004/capture.mjs | tee production/qa/evidence/team-qa-2026-10-19-s9/if-004/capture-output.txt`
5. `git status --short production/qa/evidence/if-004/` prints nothing. If it prints anything, restore the folder and record a CONCERN.
6. Fixture labels: the contract is Glass Veil on a fresh campaign. Read the script and record how intel 1 and intel 2, the Influence points and the Stabilize cooldown are set (played or seeded).
7. After the last case, stop the dev server and confirm that port 4200 has no listener.

---

## IF-004-TC-01: The first-visit overlay teaches strategic time, Influence and Tax eligibility

**ACs**: AC27
**Preconditions**: Run setup done. This is the first World Network visit.
**Steps**:
1. Read the `onboarding text:` line and the `overflow (onboard):` line.
2. Open `01-first-visit-overlay.png`.

**Expected Result**: The text contains `Pause and Clock speed control strategic time`. It contains `Stabilize and Lobby read UNAFFORDABLE at first` and `they are not broken`. It also contains `only a Nexus-held sector pays it`. The overflow line reads `overflow (onboard): []`. AC27 requires the overlay to identify "Pause/Clock speed as control over strategic time, opening Influence as unaffordable rather than broken, and Nexus-held Tax eligibility—not only panel names".
**Pass Criteria**: All three teaching points are present, there is no overflow, and the overlay is visible in the capture.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-02: Printed Tax is distinguishable from Tax payment

**ACs**: AC27
**Preconditions**: TC-01 run, with the overlay dismissed.
**Steps**:
1. Read the `EU readout:` and `NA readout:` lines.
2. Open `02-europe-tax-not-paying-unaffordable.png` and `03-north-america-tax-pays.png`.

**Expected Result**: Europe prints a `TAX YIELD ... CR / 24H` figure together with `TAX PAID NO // NOT NEXUS-HELD`. North America prints `TAX YIELD 4,080 CR / 24H` and `TAX PAID YES // NEXUS-HELD` (AC27: "opening Europe does not pay; opening North America does").
**Pass Criteria**: Europe shows yield with `TAX PAID NO`, and North America shows `4,080 CR / 24H` with `TAX PAID YES`.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-03: Unavailable Influence actions show the owner's reason

**ACs**: AC27
**Preconditions**: TC-02 run.
**Steps**:
1. Read `EU actions (0 pts):`, `EU actions (cooldown/no target):` and `overflow (actions):`.
2. Open `02-...png` and `04-europe-cooldown-no-target.png`.
3. Run `rg -n "SECTOR LOCKED" src` and record which test file and test name assert the locked-sector reason.

**Expected Result**: At 0 points, the lines read `1 STABILIZE // 8 PTS // -12 UNREST OVER 6H // UNAFFORDABLE` and `2 LOBBY // 10 PTS // +8 CONTROL OVER 12H // UNAFFORDABLE`, both with `"disabled":true`. Expedite reads `... // NO TARGET` with `"disabled":true`. After the cooldown, the line reads `1 STABILIZE // ... // COOLDOWN 24H` with `"disabled":true`. The overflow line reads `[]`. No UI capture covers the locked-sector reason (see Rulings).
**Pass Criteria**: The unaffordable, cooldown and no-target reasons are printed on disabled actions, and the locked-sector evidence is recorded.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-04: Antarctica has no Influence action

**ACs**: AC27
**Preconditions**: TC-03 run.
**Steps**:
1. Read `Antarctica list aria:`, `after clicking Antarctica, selected=`, `AN actions (forced focus):` and `AN readout:`.
2. Open `05-antarctica-no-influence-action.png`.

**Expected Result**: The lines read `ANTARCTICA // NO SURVEY DATA aria-disabled=true` and `after clicking Antarctica, selected=eu`. They also read `AN actions (forced focus): []` (AC27: "No Influence action is offered for Antarctica").
**Pass Criteria**: 0 Influence actions for Antarctica, and the click does not focus it.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-05: Timeline Live and Review are distinguishable and the Scan numbers stay live

**ACs**: AC27
**Preconditions**: TC-04 run.
**Steps**:
1. Open `06-timeline-live.png` and `07-timeline-review-numbers-live.png` and compare the Timeline cue.
2. Read `timeline cue (review, paused):`, `clock advanced while pinned:` and `NA Control/Unrest moved while Review pinned:`.

**Expected Result**: The Review cue reads `REVIEW -<n>H > GO LIVE` (today: `REVIEW -6.0H > GO LIVE`), and capture 06 shows the Live state without that cue. The transcript reads `pin still set: true`, then `NA Control/Unrest moved while Review pinned: true; pin held: true` (AC27: "Live/Review are distinguishable while Scan numbers remain live").
**Pass Criteria**: Live and Review look different, and the North America numbers change while Review stays pinned.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-06: World Network prints Chance at both intel levels, and Brief switches from Chance to Risk index

**ACs**: AC7
**Preconditions**: TC-05 run. The same contract (Glass Veil) is used at intel 1 and at intel 2.
**Steps**:
1. Read the `intel 1 World Network ...`, `intel 1 Brief stats:`, `intel 2 World Network ...` and `intel 2 Brief stats:` lines, and both `overflow (brief):` lines.
2. Open `08-world-network-intel-1-chance.png`, `09-brief-intel-1.png`, `10-world-network-intel-2-chance.png` and `11-brief-intel-2.png`.

**Expected Result**: World Network reads `["CHANCE <n>%"]` at intel 1 and at intel 2. The intel 1 Brief has `"PROJECTED SUCCESS":"<n>%"` (the Brief's Chance readout). The intel 2 Brief has `"RISK INDEX":"<n> // <BAND>"` (today: `89 // SEVERE`). It has no `PROJECTED SUCCESS` key, no `%` in the value and no cap label (AC7: "Risk index bands (not a percentage) at intel ≥ 2"). Both overflow lines read `[]`.
**Pass Criteria**: All four AC7 readouts match. The intel 2 Brief has no percent and no cap label.
**Actual Result**:
**Pass/Fail**:

## IF-004-TC-07: The CIVILIANS row at the top of the intel 2 Brief tactical-stats scroll box

**ACs**: AC7 (layout observation; AC1 owns clipping)
**Preconditions**: TC-06 run.
**Steps**:
1. Open `11-brief-intel-2.png` at 100% zoom. Inspect the top edge of the tactical-stats scroll box.
2. Record whether the CIVILIANS row is cut at the top, and how much of it shows.

**Expected Result**: The row is either fully visible or cut only by the scroll position, and it is reachable by scrolling. The transcript's `overflow (brief): []` covers overflow, not where the scroll starts.
**Pass Criteria**: Record the observation. Pass or fail waits for the qa-lead ruling below.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. AC27 "locked sector". No UI fixture shows a SECTOR LOCKED reason. Is the unit test found in TC-03 step 3 acceptable evidence for that reason?
2. At intel 2, the top CIVILIANS row is half cut at the top of the Brief tactical-stats scroll box (TC-07). Is that acceptable as a scroll position, or is it an AC1 clipping defect?
