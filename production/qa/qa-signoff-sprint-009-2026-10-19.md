## QA Sign-Off Report: Sprint 9 — Interface and Audio (final sprint)
**Date**: 2026-10-19
**QA Level**: standard
**Scope**: 17 stories, all `done`:
- 1 Logic: AU-006.
- 4 Integration: IF-008, AU-001, AU-003, AU-005.
- 8 UI: IF-001, 003, 004, 005, 006, 007, 010, 012.
- 4 Visual/Feel: IF-002, AU-002, AU-004, AU-007.

**Strategy**: `production/qa/qa-strategy-sprint-009-2026-10-19.md`
**Plan**: `production/qa/qa-plan-sprint-009-2026-10-17.md` (reused, not rewritten)
**Smoke Check**: PASS at HEAD 0dcb87c (`production/qa/smoke-2026-10-19-sprint-009.md`).
- 1,538/1,538 tests in 60 files; lint and build exit 0; 9/9 plan items.
- User rulings recorded there: frame p95 "treat 9.2 ms as a pass", and the AU-001/AU-003 listening pass is "pass".
- No `src/` commits since the smoke check.

**Run**: `/team-qa sprint`, automation autonomous, team.size individual.
- Claude ran Phase 5 in headless Chrome for Testing at exactly 1280x720 (`production/qa/evidence/team-qa-2026-10-19-s9/README.md`).
- qa-lead reviewed the evidence and made the rulings (`production/qa/evidence/team-qa-2026-10-19-s9/qa-lead-review.md`).
- qa-lead drafted this report. The orchestrator checked the verdict against the verdict rules, agrees, and wrote the file.

### Test Coverage Summary

For Logic and Integration rows, "Pass" means the story's test file ran in the full suite (1,538/1,538).

| Story | Type | Auto Test | Manual QA | Result |
|-------|------|-----------|-----------|--------|
| AU-006 | Logic | Pass; mutation check recorded | Not required | PASS |
| AU-001 | Integration | Pass | Listening pass: the user ruled "pass" (smoke item 7) | PASS WITH NOTES: Completion Notes still say "DEFERRED" / "pending" (hygiene) |
| AU-003 | Integration | Pass | Listening pass: the user ruled "pass" (smoke item 7) | PASS WITH NOTES: Completion Notes still say "DEFERRED" / "pending" (hygiene) |
| AU-005 | Integration | Pass | Cold-cache probe (advisory): TC-01 to TC-05 all pass. No delayed burst, stale cues dropped, play not blocked when audio is unavailable, 0 errors | PASS |
| IF-008 | Integration | Pass (`abortArm.test.ts`) | Retained capture re-run: all pass. Probe TC-01, TC-04, TC-05 pass. **TC-06 fails** | **FAIL**: AC11, BUG-0001. **A workaround is documented**: the labels note under Summary in `production/qa/bugs/BUG-0001.md` ("change the volume with the pointer or the arrow keys"), confirmed in `qa-lead-review.md` "BUG-0001 labels". AC11 stays unticked until the fix |
| IF-001 | UI | Not required. Automated sweep 40/40 `ok` | 125% visual review passes; 0 clips or overlaps; all surfaces clean. R2 accepts the scroll-edge rows | **FAIL**: the AC20 record is incomplete. Two click-through items appear in neither list: the step 2 chrome wording checks and the step 3 Brief weather line. This is not a product defect and no bug was filed. **No workaround applies** because nothing is broken for the player. The fix, amending the README, is documented in `qa-lead-review.md` "AC20 check". The story signs on that edit with no re-run. AC20 stays unticked until then |
| IF-003 | UI | Not required | Retained capture re-run: identical to the signed-off original | PASS WITH NOTES: R8 says the seed is enough; a variant row is advisory |
| IF-004 | UI | Unit test for SECTOR LOCKED, accepted under R1 | Retained capture re-run: transcript identical apart from decimals | PASS WITH NOTES: R1 and R2 accepted |
| IF-005 | UI | Not required | Smoke transcript 31/31 pass. Menu-Settings probe: 4 pass, 2 fail (focus ends on the page body, 2/2 on two runs) | **FAIL**: AC19, BUG-0002. **No workaround is documented**: `production/qa/bugs/BUG-0002.md` names none. Both that file and review R4 say it was **not verified** whether Tab from the start of the page reaches the Menu buttons again. R3 accepts IN PROGRESS as Active. AC19 stays unticked |
| IF-006 | UI | Not required | Re-run plus probe: all pass on AC9, AC17, AC21 and AC25 | PASS WITH NOTES: Balance text wraps at 125% (cosmetic, not filed) |
| IF-007 | UI | Not required | Smoke 27/27 plus probe: all pass | PASS WITH NOTES: R5 (Extraction and Directives are outside "name bindings") and R6 (9th toast accepted for QA; the doc drift goes to game-designer). Tick AC10, AC13, AC14 |
| IF-010 | UI | Not required | AC22 and AC23 met | PASS WITH NOTES: BUG-0003 linked (it belongs to IF-001 AC1) |
| IF-012 | UI | Not required | Retained capture plus probe TC-06/07: all pass | PASS. Tick AC26, AC28 |
| IF-002 | Visual/Feel | Not required (the story cites `src/ui/criticalCues.test.ts`) | Lead sign-off: Marco Machado, PASS, 2026-10-18. Not re-walked this cycle. The last `src/` commit is 9272df9 (2026-10-18 20:01). That commit also re-captured the IF-002 evidence, so the signed captures match the current `src/` | PASS |
| AU-002 | Visual/Feel | Not required | Lead sign-off approved 2026-10-18. Not re-walked. No audio source changed since | PASS WITH NOTES: screenshots are 800x788 or 800x600 (in-app pane), not the plan's 1280x720. **Waiting on a user ruling** |
| AU-004 | Visual/Feel | Not required | Lead sign-off approved 2026-10-18. Not re-walked. No audio source changed since | PASS WITH NOTES: screenshots are 800x788 or 800x600, not 1280x720. **Waiting on a user ruling** |
| AU-007 | Visual/Feel | Not required | Lead sign-off approved 2026-10-19. Not re-walked. No audio source changed since | PASS WITH NOTES: screenshots are 800x788 or 800x600, not 1280x720. **Waiting on a user ruling** |

### Bugs Found

No in-scope bugs were on file at Phase 1, because `production/qa/bugs/` did not exist. All three bugs below were filed in Phase 5.

| ID | Story | Severity | Status |
|----|-------|----------|--------|
| BUG-0001 | IF-008 (AC11): Space on a focused Settings volume slider, with Settings opened from pause, unpauses the mission and closes Settings | S3-Medium / P1-Fix this sprint | Open |
| BUG-0002 | IF-005 (AC19): closing Settings opened from the Menu leaves focus on `document.body` | S3-Medium / P1-Fix this sprint | Open |
| BUG-0003 | IF-010 / IF-001 (AC1): the `SAVE FAILED // CAMPAIGN NOT FILED` notice covers text on the first-visit orientation card | S4-Low / P3-Backlog | Open |

### Verdict: NOT APPROVED

**How the rules were applied, in order**

1. **NOT APPROVED, first test: any open S1/S2 bug in scope.** Not triggered. None was on file at Phase 1, and the Phase 5 bugs are S3, S3 and S4.
2. **NOT APPROVED, second test: any story that FAILs without a documented workaround.** **Triggered.**
   - IF-008 FAILs, but BUG-0001.md documents a workaround (pointer or arrow keys), so it does not trigger the rule. "Press Space again to re-pause" is recovery after the fact, not a workaround.
   - **IF-005 FAILs with no documented workaround.** BUG-0002.md names none, and the possible one (Tab from the start of the page) was not verified. **This decides the verdict.**
   - IF-001 FAILs on an incomplete AC20 record. A workaround does not apply because nothing is broken for the player. Read literally, the rule catches it too, but the verdict does not depend on it.
   - **Result: NOT APPROVED.** The order rule stops here. The steps below are shown only for the record.
3. **Precondition (executed evidence for every story).** Met.
   - All Logic and Integration tests ran (1,538/1,538).
   - Every UI story's cases were walked or re-run this cycle.
   - The Visual/Feel stories have lead sign-offs from 2026-10-18 and 2026-10-19; they were not re-walked.
   - The smoke check is PASS, and no story is BLOCKED or unexecuted. NOT ASSESSED therefore does not apply. It would rank below NOT APPROVED anyway.
4. **APPROVED / APPROVED WITH CONDITIONS.** Cannot be reached, because three stories FAIL.

Orchestrator check: I re-applied the rules to the same evidence and confirmed two facts. `grep -i workaround production/qa/bugs/BUG-0002.md` returns nothing. `git show --stat 9272df9` lists the `production/qa/evidence/if-002/` captures. I agree with NOT APPROVED. One correction to the draft: the AC20 record is `production/qa/evidence/if-001/README.md`, not the run README. Condition 2 below uses the corrected path.

**Conditions**

Must be fixed before the build moves on:
1. **BUG-0002 / IF-005 AC19.**
   - Return focus to the Menu's SETTINGS button when Settings closes. Route this to the programmer who owns `src/ui/`.
   - Verify with `/bug-report verify BUG-0002`: re-run `production/qa/evidence/team-qa-2026-10-19-s9/if-005/probe.mjs` and expect `FAILS: 0`; re-run `production/qa/evidence/smoke-2026-10-19/if-005/capture.mjs` and confirm AC18 still passes.
   - Then re-tick AC19 and re-sign IF-005.
2. **IF-001 AC20.**
   - Amend `production/qa/evidence/if-001/README.md`, "Browser coverage" → "Not exercised" (line 78): add the step 2 chrome wording checks and the step 3 Brief weather line. Item 2 can instead go under "Exercised", citing the capture.
   - Then re-tick AC20. IF-001 signs with no re-run.

Required this sprint (P1 in the final sprint), but not a verdict blocker on its own:

3. **BUG-0001 / IF-008 AC11.**
   - Fix the Space guard in `src/scene/Input.tsx` and add a regression test.
   - Re-run IF-008 TC-06 on all five volume sliders; only MASTER was tested.
   - Confirm that Space still activates a focused dialog button and still toggles pause when nothing is focused.
   - Then re-tick AC11.

Waiting on a user decision (not decided here):

4. **AU-002, AU-004, AU-007 screenshots.** They are 800x788 or 800x600 (in-app pane), not the plan's 1280x720. The strategy recommends accepting them as staging evidence. The user rules.

Can be deferred, or follow-ups (not blocking):
- **BUG-0003** (S4 / P3): goes to ux-designer for the notice placement, or to game-designer to declare the notice an overlay in IF-001 AC1 and the GDD.
- **AU-001 / AU-003 Completion Notes**: replace "DEFERRED" / "pending" with the user's listening "pass".
- **TR-audio-004 is mapped to the wrong story**: its registry text matches AU-007, and nothing describes AU-002. Goes to technical-director.
- **Weak (cannot-fail) asserts** were found in 7 stories' reviews and are not logged as tech debt. Goes to lead-programmer.
- **IF-001 AC1's declared-overlay list** omits the first-visit orientation card and the Recruitment Market. Goes to game-designer.
- **Toast count**: AC13 and the GDD list 8 toasts, but the build has 9 (R6). Goes to game-designer.
- **IF-006**: Balance text wraps at 125% (cosmetic, not filed).
- **AC box rulings, not yet applied to the story files**: untick IF-008 AC11, IF-005 AC19 and IF-001 AC20; tick IF-007 AC10/13/14 and IF-012 AC26/28.

### Next Step

The verdict-rule guidance for NOT APPROVED reads: "Resolve S1/S2 bugs and re-run `/team-qa` or targeted manual QA before advancing." No S1 or S2 bug is open. This verdict comes from IF-005 failing without a documented workaround.

1. Clear conditions 1 and 2, and condition 3 as P1.
2. Run targeted manual QA:
   - IF-005: `probe.mjs` plus the smoke `capture.mjs`.
   - IF-008: TC-06 on all five sliders.
   - IF-001: re-sign on the README amendment.
3. Get the user's ruling on condition 4.
4. Re-issue this sign-off.

After that, the sprint closes in the project's order: QA sign-off, then `/retrospective`, then `/sprint-plan new`. Run `/gate-check` only if closing Sprint 9 also moves the project to a new stage.
