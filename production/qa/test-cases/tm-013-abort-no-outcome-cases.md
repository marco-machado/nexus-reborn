# TM-013 Manual cases: Abort emits no outcome (AC 18, smoke path b)

**Story**: `production/epics/tactical-mission/story-013-loss-conditions-and-abort-emits-no-outcome.md`
**Story type**: Integration. **Gate**: BLOCKING (automated tests carry the gate; this is the manual smoke path from the QA plan).
**Output location**: this file; screenshots in `production/qa/evidence/tm-013/`.
**Environment**: dev server on port 4200, in-app browser (`mcp__Claude_Browser__*`).
**Abort gesture**: Pause -> ABORT -> CONFIRM? (confirm within 3 s).
**Snapshot step used by every case**: before deploying, record Credits, roster (operative names/ids, count), operative state (hp, injuries), won contracts, and sector influence from the World Network screen and the campaign/world stores via console. Record the exact expressions used.

---

## Test Case: TM-013-A1 - Abort returns to the World Network, no Debrief
**Precondition**: Fresh profile, NEW OPERATION, on the World Network; snapshot taken.
**Steps**:
  1. Select a contract, continue through Research/Brief/Team, deploy.
  2. Let the mission run about 10 s of tactical time.
  3. Open Pause, click ABORT, click CONFIRM? within 3 s.
  4. Read the app phase (`appStore.phase`) and watch the screens shown.
**Expected Result**: Phase goes mission -> world. The Debrief screen is never displayed.
**Pass Criteria**: Final phase is `world`, phase never equals `debrief` during the abort, World Network is visible.
Actual Result:
Pass/Fail:

## Test Case: TM-013-A2 - Credits, roster and operatives unchanged
**Precondition**: As A1; snapshot taken before deploy.
**Steps**:
  1. Deploy, then (optionally) take damage or kill a civilian before aborting so a write would be visible.
  2. Abort as in A1.
  3. Re-read Credits, roster and operative state.
**Expected Result**: All values identical to the snapshot; no KIA or injury grading applied.
**Pass Criteria**: Credits, roster membership and count, and every operative's state equal the snapshot.
Actual Result:
Pass/Fail:

## Test Case: TM-013-A3 - Won contracts and influence unchanged
**Precondition**: As A1; snapshot of won contracts and sector influence/unrest taken.
**Steps**:
  1. Deploy and abort as in A1.
  2. Re-read won contracts and sector influence on the World Network.
**Expected Result**: No contract marked won, no influence or sector change.
**Pass Criteria**: Won contracts and sector values equal the snapshot.
Actual Result:
Pass/Fail:

## Test Case: TM-013-A4 - Abort is not a Loss
**Precondition**: As A1.
**Steps**:
  1. Deploy.
  2. Open Pause and ABORT, and CONFIRM? within 3 s.
  3. Check that no Loss/failed-mission result was recorded: no Debrief, no "failed" mark on the contract, the contract is still selectable.
  4. Read the mission store `result` after the abort. Note: the story advisory says this read happens after teardown reset it to `none`, so it cannot prove "not a Loss" by itself; rely on step 3 as the primary evidence.
**Expected Result**: No Loss recorded; the contract is attempted again as new.
**Pass Criteria**: Contract shows no loss/win state and can be redeployed from its original state.
Actual Result:
Pass/Fail:

## Test Case: TM-013-A5 - CONFIRM? timeout does not abort
**Precondition**: Mission running; snapshot taken.
**Steps**:
  1. Open Pause, click ABORT, and wait longer than 3 s without confirming.
  2. Observe the button state, then close Pause.
**Expected Result**: The mission is still live and ABORT is back to its unarmed state; nothing changed.
**Pass Criteria**: Phase is still `mission`, the world keeps ticking after resume, and a second ABORT needs a new two-step confirm.
Actual Result:
Pass/Fail:

## Test Case: TM-013-A6 - Redeploy after abort is clean
**Precondition**: A1 completed (aborted once).
**Steps**:
  1. From the World Network, deploy the same contract again.
  2. Check the mission begins at sim time ~0, with fresh units and objectives, and finish or abort again.
**Expected Result**: New mission starts normally; no state leaks from the aborted one.
**Pass Criteria**: Sim time starts near 0, all objectives incomplete, operatives at the snapshot state.
Actual Result:
Pass/Fail:

---

## Execution record (2026-10-16, Sprint 8 /team-qa, Claude in the in-app browser, HEAD 2d49bc7)

Glass Veil, fresh New Operation. Abort driven by the pause menu's "Abort mission" button (two clicks 120 ms apart; the first arms it to "CONFIRM?").

| Case | Observed | Result |
|---|---|---|
| A1 no Debrief | phase subscription saw only `world`; `debrief` never entered | PASS |
| A2/A3 state unchanged | Run 1 (strategic clock running): every field equal except Asia Control/Unrest, moved by a "STRIKE COLUMNS BLOCK SHINGANG" world event while the World Network clock ran after return. Run 2 (strategic clock paused first): credits, roster, operatives and statuses, contractsWon, campaignFailed, Influence, sectors, contracts, event count, research and strategic `t` all identical | PASS |
| A4 not a Loss | mission `result` `none`; `campaignFailed` false; the contract is still open and redeployable | PASS |
| A5 3 s confirm window | first click shows "CONFIRM?"; after 3.5 s the button reads "ABORT", mission still live, state unchanged | PASS |
| A6 clean redeploy | redeployed Glass Veil: sim t from 0, full HP (124/110/98/132), objectives reset, civiliansHit 0 | PASS |

Overall: PASS.
