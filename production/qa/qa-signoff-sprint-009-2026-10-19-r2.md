## QA Sign-Off Report: Sprint 9 (re-run)
**Date**: 2026-10-19
**QA Level**: standard. **Build**: `main` at e410b9d.
**Strategy**: `production/qa/qa-strategy-sprint-009-2026-10-19-r2.md`. **Prior sign-off** (the source for carried rows and follow-ups): `production/qa/qa-signoff-sprint-009-2026-10-19.md` (NOT APPROVED).
**Cases**: `production/qa/test-cases/sprint-009-r2-rerun-cases.md`. **Plan**: `production/qa/qa-plan-sprint-009-2026-10-17.md` (reused).
**Run**: `/team-qa sprint`, automation autonomous, team.size individual. Claude ran Phase 5 headless at 1280x720. qa-lead drafted this report. The orchestrator checked the verdict against the verdict rules, agrees, and wrote the file.

**Smoke Check**: PASS WITH WARNINGS.
- Source report `production/qa/smoke-2026-10-19-sprint-009.md` passed at 0dcb87c.
- 4 `src/` files changed since then (1c5faf0, e410b9d). At e410b9d: vitest 1,539/1,539 in 60 files, eslint reports no errors, and the build completes.
- The manual smoke items (listening, frame p95) were not re-run. The standing user rulings still apply.

**Run evidence**: `production/qa/evidence/team-qa-2026-10-19-s9-r2/README.md`. Rows R1–R10 were run in headless Chrome at 1280x720 with real input. All passed, with 0 console or page errors.

**User rulings this cycle**: AU-002/AU-004/AU-007 screenshots at 800x788 / 800x600 accepted as staging evidence. Record edits approved: the IF-001 AC20 README amendment and the AC box rulings.

### Test Coverage Summary

For Logic and Integration rows, "Pass" means the story's tests ran green in the full suite (1,539/1,539 at e410b9d). "Carry" means the signed evidence from the earlier run stands, because no file in the 4-file diff reaches that story.

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| AU-006 | Logic | Pass | Not required | PASS |
| AU-001 | Integration | Pass | R9: MUSIC 40 and MUTE ON persist across reload; focus returns to SETTINGS. Listening pass carried (user ruling "pass") | PASS WITH NOTES: Completion Notes still say "DEFERRED"/"pending" (hygiene) |
| AU-003 | Integration | Pass | Carry: listening ruled "pass" by the user | PASS WITH NOTES: same stale Completion Notes |
| AU-005 | Integration | Pass | Carry: cold-cache probe TC-01 to TC-05 pass | PASS |
| IF-008 | Integration | Pass (`abortArm.test.ts`, includes the BUG-0001 regression test) | R1/R3: TC-01/04/05 pass, TC-06 passes on all 5 sliders (35 checks). R2-a/b/c/d Space regression set: all pass | PASS WITH NOTES: BUG-0001 repro passes, but `/bug-report verify` has not been run. AC11 ticked; re-verification passed |
| IF-001 | UI | Advisory sweep (R7): ALL SURFACES CLEAN, 44 ok / 0 not ok | AC20 record amended (`production/qa/evidence/if-001/README.md`, Browser coverage) | PASS WITH NOTES: BUG-0003 (AC1, S4) open. AC20 ticked |
| IF-002 | Visual/Feel | Not required | Carry: lead sign-off, Marco Machado, PASS, 2026-10-18 | PASS |
| IF-003 | UI | Not required | Carry: capture identical to the signed original | PASS WITH NOTES: R8 says the seed is enough; a variant row is advisory |
| IF-004 | UI | Not required | Carry: transcript identical | PASS WITH NOTES: R1 and R2 accepted |
| IF-005 | UI | Not required | R4: original and fix-copy probes ALL PASS. R4-d pointer-open PASS. R5: Tab from the page start reaches BEGIN NEW OPERATION and OPEN SETTINGS, also after a close. R6 smoke capture: 31 PASS, including AC18 and AC19 | PASS WITH NOTES: BUG-0002 repro passes, but `/bug-report verify` has not been run. AC19 ticked |
| IF-006 | UI | Not required | R8: capture, 12 PASS | PASS WITH NOTES: Balance text wraps at 125% (cosmetic, not filed) |
| IF-007 | UI | Not required | R8: capture, 27 PASS. R8-c steps 2–3 PASS | PASS WITH NOTES: AC10/13/14 ticked; R5 and R6 rulings carried; Space on the toast's Dismiss button is an open design question (observation below) |
| IF-010 | UI | Not required | Carry: AC22 and AC23 met | PASS WITH NOTES: BUG-0003 linked |
| IF-012 | UI | Not required | Carry: capture plus probe TC-06/07 pass | PASS. AC26/28 ticked |
| AU-002 | Visual/Feel | Not required | Carry: audio-director sign-off, 2026-10-18 | PASS WITH NOTES: 800x788 / 800x600 screenshots accepted as staging evidence (user ruling this cycle) |
| AU-004 | Visual/Feel | Not required | Carry: audio-director sign-off, 2026-10-18 | PASS WITH NOTES: same ruling |
| AU-007 | Visual/Feel | Not required | Carry: audio-director sign-off, 2026-10-19 | PASS WITH NOTES: same ruling |

**Observation, not a bug.** When focus is on a tutorial toast's "Dismiss tutorial step" button, Space pauses the mission instead of dismissing the toast (`production/qa/evidence/team-qa-2026-10-19-s9-r2/toast/probe-output.txt`, R8-c step 4). The case had no pass criterion, and the cases author found no spec ruling for it. It is a design question, not a defect, so it goes to game-designer and ux-designer for a ruling. If they rule that Space should dismiss the toast, file it then.

### Bugs Found

No S1 or S2 bugs. No new bugs were filed in this re-run.

| ID | Story | Severity | Status |
|---|---|---|---|
| BUG-0001 | IF-008 (AC11) | S3-Medium / P1 | Fixed (awaiting QA verification). QA re-run passed its repro (R1, R2); `/bug-report verify` not yet run |
| BUG-0002 | IF-005 (AC19) | S3-Medium / P1 | Fixed (awaiting QA verification). QA re-run passed its repro (R4, R5, R6); `/bug-report verify` not yet run |
| BUG-0003 | IF-010 / IF-001 (AC1) | S4-Low / P3 | Open (backlog) |

### Verdict: APPROVED WITH CONDITIONS

**Verdict reasoning (the rules, in order)**
1. **NOT APPROVED, open S1/S2 bug?** No. The bugs on file are S3, S3 and S4, and none was filed in Phase 5.
2. **NOT APPROVED, a story that FAILs without a documented workaround?** No. None of the 17 stories fails. The three earlier FAILs are cleared: IF-008 (TC-06 on 5/5 sliders), IF-005 (probes pass; Tab reachability confirmed), IF-001 (AC20 record amended; sweep clean).
3. **Precondition, executed evidence for every story?** Met. Logic and Integration tests ran (1,539/1,539). IF-001, IF-005, IF-006, IF-007, IF-008 and AU-001 were re-walked at e410b9d. The carried stories have walked or signed evidence from this cycle, and no file in the diff reaches them. Smoke is PASS WITH WARNINGS, not UNKNOWN or NOT ASSESSED, so NOT ASSESSED does not apply.
4. **APPROVED vs APPROVED WITH CONDITIONS.** Three S3/S4 bugs are still open by file status, and PASS WITH NOTES items are documented. That makes it APPROVED WITH CONDITIONS.

**Conditions**
1. **Verify, then close, BUG-0001 and BUG-0002.** Run `/bug-report verify BUG-0001` and `/bug-report verify BUG-0002`, citing the r2 runs as the manual verification (`if-008/`, `extra/`, `if-005-orig/`, `if-005-menu/`, `if-005-smoke/` at build e410b9d), then `/bug-report close` for each.
2. **BUG-0003 (S4/P3)** may be deferred to polish. Route it to ux-designer for the notice placement, or to game-designer to declare the notice an overlay in IF-001 AC1.
3. **Follow-ups carried from the prior sign-off** (not blocking): AU-001/AU-003 stale Completion Notes; TR-audio-004 mapped to the wrong story → technical-director; weak asserts in 7 stories → lead-programmer; the IF-001 AC1 overlay list and the toast count (9 in the build vs 8 in the spec) → game-designer; IF-006 Balance text wrap at 125%; open design questions IF-008 advisory 3, the AU-005 freshness window, AU-003 AC3 wording.
4. **New design question**: Space on a focused toast Dismiss button pauses the mission instead of dismissing the toast → game-designer / ux-designer.
5. **Smoke warning**: the frame p95 and listening items were not re-measured at e410b9d. This is a judgement call: the diff touches no render loop or audio code. To measure it, re-run `smoke-2026-10-14/perf.mjs`.

### Next Step
"Resolve conditions before advancing. S3/S4 bugs may be deferred to polish."
- Clear condition 1 first (verify and close the two bugs).
- The sprint then closes in the project's order: QA sign-off → `/retrospective` → `/sprint-plan new`.
- Run `/gate-check` only if closing Sprint 9 also moves the project to a new stage.
