# IF-005 manual test cases: Research Authorize, keyboard activation and focus return

- **Story**: `production/epics/interface/story-005-research-authorize-keyboard-activation-and-focus-return.md` (AC8, AC18, AC19)
- **Story type**: UI. **Evidence**: `production/qa/evidence/smoke-2026-10-19/if-005/` (smoke re-run, reviewed here). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude (review). Sign-off: qa-lead.

## Execution mode

Review only. The Sprint 9 smoke check re-ran `capture.mjs` on today's tree. Its transcript reads `ALL PASS`. Review `capture-output.txt`, `run.log` and the 7 PNGs. No dev server is needed.

Shared preconditions:

1. `diff production/qa/evidence/if-005/capture.mjs production/qa/evidence/smoke-2026-10-19/if-005/capture.mjs` prints nothing.
2. Run the revision check from `if-001-surface-fit-1280x720-cases.md`, Shared precondition 2. Commits to `src/` after the smoke revision mean a fresh re-run into `production/qa/evidence/team-qa-2026-10-19-s9/if-005/`.
3. Fixture label: `fixture node b-propellants cost 16000`. The unaffordable fixture is one credit short, and the affordable twin is otherwise identical. Read the script and record how the Credits are seeded.

---

## IF-005-TC-01: Authorize is disabled and shows the unaffordable reason

**ACs**: AC8
**Preconditions**: Shared preconditions met. The project is available and unresearched, its prerequisites are met, its lab is idle and the Credits are below cost.
**Steps**:
1. Find the `AC8` lines in `capture-output.txt`.
2. Open `01-authorize-disabled-unaffordable.png`.

**Expected Result**: The transcript reads `PASS AC8 Authorize disabled when Credits below cost` and `PASS AC8 unaffordable reason visible // INSUFFICIENT CREDITS // 1 CR SHORT`. The capture shows that reason as visible text next to a disabled Authorize.
**Pass Criteria**: Authorize is disabled and the reason is visible in the capture.
**Actual Result**:
**Pass/Fail**:

## IF-005-TC-02: The affordable twin starts the project and shows Active

**ACs**: AC8
**Preconditions**: The affordable twin fixture.
**Steps**:
1. Find `AC19 Authorize pointer: starts the project` and `AC19 Authorize pointer: Active state shown`.
2. Open `03-authorize-active.png`.

**Expected Result**: The transcript reads `starts the project (lab occupied, debited)`, with `labs.ballistics.id` `b-propellants`, and `Active state shown // ADVANCED PROPELLANTS // BALLISTICS // IN PROGRESS`. The capture shows the in-progress state, not an inspection panel only (AC8: "starts the project and shows Active rather than merely opening inspection").
**Pass Criteria**: The lab is occupied and the Active state (printed `IN PROGRESS`) is visible.
**Actual Result**:
**Pass/Fail**:

## IF-005-TC-03: Node activation by pointer, Enter and Space only selects

**ACs**: AC19
**Preconditions**: A focused Research project node, in three separate fixtures.
**Steps**:
1. Find the six `AC19 node pointer|Enter|Space:` lines.
2. Open `02-node-focus-ring-selected.png`.

**Expected Result**: For each input, the transcript reads `selects and shows details` and `Credits and lab occupancy unchanged` (AC19: "without starting research or changing Credits or laboratory occupancy"). The capture shows a focus ring and the details panel.
**Pass Criteria**: 6 of 6 lines are PASS.
**Actual Result**:
**Pass/Fail**:

## IF-005-TC-04: Authorize by pointer, Enter and Space starts the project

**ACs**: AC19
**Preconditions**: The selected project is affordable and its lab is idle, in three separate fixtures.
**Steps**:
1. Find the nine `AC19 Authorize pointer|Enter|Space:` lines.
2. Compare the three `startedT` values.

**Expected Result**: For each input, the transcript reads `control enabled`, `starts the project (lab occupied, debited)` and `Active state shown // ... // IN PROGRESS`. The three `startedT` values differ, which confirms separate fixtures.
**Pass Criteria**: 9 of 9 lines are PASS, with 3 distinct `startedT` values.
**Actual Result**:
**Pass/Fail**:

## IF-005-TC-05: Timeline Left, Right, Home and End move Review without changing state

**ACs**: AC19
**Preconditions**: The Timeline is at a recorded live state.
**Steps**:
1. Find the `AC19 Left`, `Right`, `Home`, `End` and `Review keys` lines.
2. Open `04-timeline-review-left.png`.

**Expected Result**: The transcript reads `Left moves Review backward // review=<r> t=<t>` with r < t, and `Right moves Review forward (back to Live within a step)`. It reads `Home selects the oldest point // t-review=<window>`, `End returns Live`, `Review keys do not mutate Credits` and `Review keys do not rewind the live clock`. The capture shows the Review state after Left.
**Pass Criteria**: All six lines are PASS.
**Actual Result**:
**Pass/Fail**:

## IF-005-TC-06: Pause and Settings trap focus and return it, and nested Settings returns to pause

**ACs**: AC18, AC19
**Preconditions**: A live mission.
**Steps**:
1. Find the `AC18` lines, the `Pause: Tab` and `Pause: Shift+Tab` lines, `Settings: Tab/Shift+Tab`, and `Pause close`.
2. Open `05-pause-focus.png`, `06-settings-over-pause.png` and `07-pause-focus-after-settings.png`.
3. Look for a line where Settings opened outside pause (from Menu or World Network) is closed. Record "not exercised" if there is none.

**Expected Result**: The transcript reads `pause modal open, focus inside`, `Tab stays trapped over 8 presses` and `Shift+Tab stays trapped over 8 presses`. It reads `Settings: Tab/Shift+Tab stay trapped`. It reads `nested Settings close: focus restored to the pause modal`, which is AC18, and `Pause close: focus returns to the opening control`. Captures 05 and 07 show focus on the pause modal.
**Pass Criteria**: All listed lines are PASS. The finding from step 3 is recorded.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. AC8 and AC19 say "Active". The build prints `IN PROGRESS`. Confirm that `IN PROGRESS` is the accepted presentation of Active.
2. AC19 says "GIVEN Pause or Settings ... returns to the opening context when closed". The transcript covers Pause close and Settings nested in pause. It has no line for Settings opened alone from Menu or World Network. Is the nested case enough, or is a probe needed?
