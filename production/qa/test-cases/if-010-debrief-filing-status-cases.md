# IF-010 manual test cases: Debrief filing status and write-failure indicators

- **Story**: `production/epics/interface/story-010-debrief-filing-status-and-write-failure-indicators.md` (AC22, AC23)
- **Story type**: UI. **Evidence**: `production/qa/evidence/smoke-2026-10-19/if-010/` (smoke re-run, reviewed here). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude (review). Sign-off: qa-lead.

## Execution mode

Review only. The Sprint 9 smoke check re-ran `capture.mjs` on today's tree, and its transcript reads `ALL PASS`. Review `capture-output.txt`, `run.log` and the 7 PNGs. No dev server is needed.

Shared preconditions:

1. `diff production/qa/evidence/if-010/capture.mjs production/qa/evidence/smoke-2026-10-19/if-010/capture.mjs` prints nothing.
2. Run the revision check from `if-001-surface-fit-1280x720-cases.md`, Shared precondition 2.
3. Fixture labels: read the script header and record two things. First, how the Debrief is reached (played or seeded; seeded evidence must say so, per `docs/mission-playbook.md`, Rules of the run). Second, how the write failure is injected (the transcript reports `"reason":"quota"`).

---

## IF-010-TC-01: The invoice reads unfiled on Debrief before any Screen return

**ACs**: AC22
**Steps**:
1. Read `Debrief reads unfiled before any Screen return` and `unfiled line not clipped at 1280x720`.
2. Open `01-debrief-invoice-unfiled-1280x720.png`.

**Expected Result**: The transcript reads `"status":"unfiled"` and `"filing":"INVOICE UNFILED // COMMITS ON NEXT SCREEN"`, with `"filingClipped":false`. The capture shows that line in full.
**Pass Criteria**: The unfiled line is visible and not clipped.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-02: The World Network return reads filed only after the autosave

**ACs**: AC22
**Steps**:
1. Read `World Network reached; still unfiled until the write (navigation is not the signal)` and `World Network return: filed after autosave, no failure notice`.
2. Open `02-world-return-filed-1280x720.png`.

**Expected Result**: On arrival, the transcript reads `"phase":"world","status":"unfiled"`. After the write, it reads `"status":"filed"` and `"notice":null` (AC22: "The success signal comes from Persistence, not merely navigation").
**Pass Criteria**: The status is unfiled on arrival and filed only after the autosave.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-03: Brief Replay reads filed after the autosave

**ACs**: AC22
**Steps**:
1. Read `second Debrief unfiled` and `Brief Replay: filed after autosave, no failure notice`.
2. Open `03-brief-replay-filed-1280x720.png`.

**Expected Result**: The second Debrief is unfiled. Then the transcript reads `"phase":"brief","status":"filed"` and `"notice":null`. This is separate from TC-02, as AC22 requires.
**Pass Criteria**: The Brief Replay path reaches filed with no failure notice.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-04: A failed first Screen write on the World Network return keeps the invoice unfiled and shows the failure

**ACs**: AC23
**Steps**:
1. Read `World Network return write failure: notice shown, not filed`, `failure notice not clipped (world)` and `failure notice persists after the orientation is dismissed`.
2. Open `04-world-return-write-failed-1280x720.png`.

**Expected Result**: The transcript reads `"status":"write-failed"`, `"notice":"SAVE FAILED // CAMPAIGN NOT FILED"` and `"noticeClipped":false`. The status never reads `filed`.
**Pass Criteria**: The notice is visible, the status is not filed, and the notice stays after the orientation is dismissed.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-05: A failed first Screen write on Brief Replay keeps the invoice unfiled and shows the failure

**ACs**: AC23
**Steps**:
1. Read `Brief Replay write failure: notice shown, not filed` and `failure notice not clipped (brief)`.
2. Open `05-brief-replay-write-failed-1280x720.png`.

**Expected Result**: The transcript reads `"phase":"brief","status":"write-failed"` and `"notice":"SAVE FAILED // CAMPAIGN NOT FILED"`, with the notice not clipped.
**Pass Criteria**: The notice is visible and the status is not filed.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-06: A failed New Operation write shows the failure, not "erased"

**ACs**: AC23 (overlap observation for IF-001 AC1)
**Steps**:
1. Read `New Operation erase failure: World Network shows failure, not erased/filed`, `failure notice not clipped (new operation)` and `failure notice persists after the orientation is dismissed (new operation)`.
2. Open `06a-new-operation-write-failed-with-orientation-1280x720.png` and `06b-new-operation-write-failed-1280x720.png`.
3. In 06a, record which orientation-card text the `SAVE FAILED // CAMPAIGN NOT FILED` box covers, quoting the hidden words.

**Expected Result**: The transcript reads `"status":"write-failed"` and `"notice":"SAVE FAILED // CAMPAIGN NOT FILED"`. No erased or filed success copy appears in 06a or 06b (AC23: "visibly reports failure rather than durable erase/filing success"). The overlap in 06a is recorded for the ruling.
**Pass Criteria**: The failure notice is visible and no success copy appears. The 06a overlap is recorded, and its pass or fail waits for the ruling.
**Actual Result**:
**Pass/Fail**:

## IF-010-TC-07: Run hygiene

**Steps**: Read the last two lines of `capture-output.txt`.
**Expected Result**: `PASS no console or page errors`, then `ALL PASS`.
**Pass Criteria**: 0 errors.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. In capture 06a, the `SAVE FAILED // CAMPAIGN NOT FILED` box covers orientation-card text. IF-001 AC1 declares only Settings, Balance, pause and toasts as overlays, and the write-failure notice is not on that list. Is the overlap acceptable, and if so, should AC1's declared-overlay list be amended?
