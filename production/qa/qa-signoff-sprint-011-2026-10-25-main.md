## QA Sign-Off Report: Sprint 11 (re-run on main `93c58e0`)
**Date**: 2026-10-25
**Drafted by**: qa-lead (Phase 6, /team-qa sprint re-run, autonomous). Written by the orchestrator. The verdict was checked against the rules and agrees.
**Supersedes**: this verdict replaces the NOT APPROVED verdict in `production/qa/qa-signoff-sprint-011-2026-10-25.md` (build `131a5c1`). That report's per-story rows, observations and process notes still hold for stories nothing has touched since.

**Build**: main `93c58e0`. **qa.level**: full. **team.size**: studio.
**Scope**: the same 30 stories: IF-016..IF-039, TM-018..TM-021, WN-021, WN-022.
**What changed since `131a5c1`**: only the four bug fixes in src: `src/game/data.ts`, `src/game/contracts.ts`, `src/ui/ui.css`, `src/ui/campaignBanner.ts`, `src/ui/WorldMap.tsx`. Tests changed too: `briefNotes.test.ts`, `campaignBanner.test.ts` and the 3 TM-021 test files.
**Smoke check**: PASS (`production/qa/smoke-2026-10-24-sprint-011.md`, run on `131a5c1`). There is no smoke report for `93c58e0`. The re-run below covers the same ground on `93c58e0`: the test suite, lint, build and every scripted sweep.
**Automated on `93c58e0`**: `npm test` passed 1678/1678 on three runs in a row (`npm-test-run1..3.txt`). `npm run lint` exited 0. `npm run build` exited 0 ("built in 1.81s").
**Scripted runs on `93c58e0`** (all under `production/qa/evidence/sprint-011-main-2026-10-25/`; headless Chrome for Testing at 1280x720; dev server on 4200 freshly started; no src edits during any run):
- R1 probe (`r1-probe/`): 152/152 PASS, with no console or page errors.
- R2 screens sweep (`r2-sweep/`): every surface scored 0 on every count (clip, small text, contrast). No page errors.
- R3 focus: the first run (`r3-focus/`) got 15/16. The one FAIL was the known ordering defect in the script, not a game defect. The script was fixed. The re-run (`r3-focus-fixed/`) got 16/16.
- R4 playtest sweep (`r4-playtest-sweep/`): all 12 surfaces scored 0 on every count. No page errors.

### Test Coverage Summary
Rows marked "carried" come unchanged from the `131a5c1` sign-off. The per-story results are in `production/qa/evidence/sprint-011-head-2026-10-24/<story>/results.md`. R1–R4 and the full suite were also re-run on `93c58e0`, and all of them passed.

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| IF-016 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-017 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-018 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-019 | Integration | Unit tests 29/29 + R1 | Browser walked (carried) | PASS WITH NOTES |
| IF-020 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-021 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-022 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-023 | UI | R1 | Walked, including the played win in TC-10 (carried) | PASS WITH NOTES |
| IF-024 | UI | R1 | Walked, screenshots (carried) | PASS |
| IF-025 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-026 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-027 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-028 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-029 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-030 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-031 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-032 | UI | R1 | Walked, including a real drag (carried) | PASS WITH NOTES |
| IF-033 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-034 | UI | R1 | Walked, including Enter/Space (carried) | PASS WITH NOTES |
| IF-035 | UI | R1 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-036 | UI | R2 / R4 at 0 | AC-1 carried. AC-2 TC-036-22 re-walked (`w11-bug0011/`): every `.ts-stats` label, MOBILITY included, is one line box with no overflow at 90/100/110/125, in default and high contrast | PASS |
| IF-037 | UI | R2 at 0; R3 16/16 | AC-2 and AC-3 carried. AC-1 TC-037-03 re-walked (`w13-bug0013/`): labels render at 9.632/10.621/11.683/11.683 px against an expected 9.559/10.621/11.683/11.683 ±0.2; overlap 0, clipping 0, no horizontal scroll | PASS WITH NOTES |
| IF-038 | UI | R2 / R3 / R4 | Walked, screenshots (carried) | PASS WITH NOTES |
| IF-039 | UI | R4 at 0; `briefNotes.test.ts` green | AC-2..AC-5 carried. AC-1 TC-02 re-walked (`w10-bug0010/`): the m03 Brief and the generated SABOTAGE `gc7518e2d3` Brief both print "EVERY CIVILIAN HIT IS BILLED."; no overrun at 100 or 125 | PASS WITH NOTES |
| WN-022 | UI | Unit tests (WN-022 describe, 4) | Walked, screenshots (carried) | PASS WITH NOTES |
| TM-018 | Logic | AC-1 tests green (in the 1678) | AC-2 and AC-3 captured and measured (carried) | PASS. The lead sign-off row is still unchecked |
| TM-019 | Logic | Tests green (in the 1678) | None needed | PASS |
| TM-020 | Visual/Feel | Unit tests 3/3 (in the 1678) | 8/8 cases PASS (carried) | PASS on cases. **The art lead and QA lead sign-offs have not been given** |
| TM-021 | Logic | AC-1 and no-route tests, plus the AC-2 nobody-selected test; green in the 1678 | None needed | PASS |
| WN-021 | Logic | Tests green (in the 1678) | None needed | PASS |

All 30 stories have executed evidence: either a test that ran or a manual case that was walked. No story FAILs.

### Bugs Found
| ID | Story | Severity | Status |
|---|---|---|---|
| BUG-0010 | IF-039: Brief notes missing `EVERY CIVILIAN HIT IS BILLED.` | S3-Medium | Verified Fixed (2026-10-25, build `93c58e0`) |
| BUG-0011 | IF-036: Assembly `MOBILITY` breaks mid-word | S3-Medium | Verified Fixed (2026-10-25, build `93c58e0`) |
| BUG-0013 | IF-037: Research node labels too small at 125% | S3-Medium | Verified Fixed (2026-10-25, build `93c58e0`) |
| BUG-0012 | None (World Network banner, not a story FAIL): CAMPAIGN FAILED banner always read `0 / 3` | S3-Medium | Verified Fixed (2026-10-25, build `93c58e0`) |
| BUG-0008 | Carried (Audio): strategy music restarts before the clip ends | S3-Medium | Open. The owner deferred it to Polish |

No new bugs were filed in this re-run. Open S1: 0. Open S2: 0. Open S3: 1.

### Verdict: APPROVED WITH CONDITIONS

The NOT APPROVED checks come first, and none applies. No S1 or S2 bug is open. No story FAILs: the three failures from the last cycle (IF-036, IF-037, IF-039) were re-walked on `93c58e0` and now PASS. The precondition holds: all 30 stories have executed evidence, and the smoke check on file is PASS. Full APPROVED is ruled out because one S3 bug (BUG-0008) is still open, several stories PASS WITH NOTES, and the TM-020 and TM-018 sign-offs have not been given.

### Conditions
1. **TM-020 (Visual/Feel)**: record the art lead's and the QA lead's sign-off in `production/qa/evidence/tm-020-objective-markers-in-the-3d-view-evidence.md` (rows 71–72, both unchecked). Until then the story is not Done.
2. **TM-018 (Logic)**: check the lead sign-off row in `production/qa/evidence/tm-018-playtest-two-mission-fixes-evidence.md` (row 76, unchecked).
3. **Close the four fixed bugs**: run `/bug-report close` for BUG-0010, BUG-0011, BUG-0012 and BUG-0013, then run `/bug-triage` to refresh the open count.
4. **BUG-0008**: may stay deferred to Polish, as the owner decided.

### Next Step
Resolve conditions before advancing. S3/S4 bugs may be deferred to polish. Per CLAUDE.md, Sprint 11 then closes this way: QA sign-off, then `/retrospective`, then `/sprint-plan new`. `/gate-check` is not run for a sprint, only for a stage change.

### Observations for the owner (carried from the `131a5c1` sign-off)
These are not defects. Each one is a question for the owner or UX.
- **Influence moment note**: at 1280x720 it sits below the fold of the sector panel, so a player sees it only by scrolling (`if-026`, `if-034`, `if-035` results).
- **Globe-marker hover tips** never draw, because `.globe-marker:hover .tip` sets no opacity (`src/ui/ui.css`). The spec does not rely on the tips.
- **Review-mode NOW** prints in Ink, not teal (`if-028`).
- **Crisis Unrest bar** ends in `--red` `#e04b3c`, not Red Hot (`if-021`).
- **Recruitment Market portrait**: the `.pp-live` blink keeps running under reduced motion (`if-037`).
- **Antarctica Garrison** reads CRITICAL for a locked sector with no cities (`wn-022`).
- **Print White**: the token value differs from the spec value, (226,246,238) against (232,251,242) (`if-020`).
- **NEON GARDEN at 125%**: 7 px of the row frame can never be seen; all of its text is reachable (`if-025`).

### Process notes
- The ordering defect in R3 is fixed (prior advisory condition 4). In `production/qa/evidence/screens-2026-10-23/focus.mjs`, `SURFACES.debrief({ unseeResearchHint: true })` now clears the seen hint after `fresh()`. The re-run (`r3-focus-fixed/`) got 16/16, including "after UNDERSTOOD focus is on RETURN TO WORLD NETWORK". The first R3 run's 15/16 is kept in `r3-focus/`.
- The four bugs were set to Verified Fixed from the tests that ran and Claude's headless walks of their reproduction steps on `93c58e0`; each bug file carries a `**Verified by**:` line.
- No `/smoke-check` report exists for `93c58e0`. The suite, lint, build and R1–R4 re-runs on `93c58e0` cover the same ground.
- Cleanup: the dev server is stopped and port 4200 has no listener. No Chrome for Testing process is running. The in-app browser pane is closed.

### Conditions status (2026-10-25, after this report)
1. TM-020: art-director and qa-lead agents reviewed the evidence on the owner's instruction and both approved; rows signed in the evidence doc.
2. TM-018: lead-programmer agent reviewed and approved; row signed.
3. BUG-0010 to BUG-0013: Closed with closure records; `/bug-triage` refreshed (`production/qa/bug-triage-2026-10-25.md`, 1 open: BUG-0008).
4. BUG-0008: stays deferred to Polish.

All conditions are met. Sprint 11 can close: `/retrospective`, then `/sprint-plan new`.

Reviewer follow-ups (not blocking):
- TM-018 story AC-2 still carries the old wording; update it to the owner's measurable form (also the evidence doc's AC-2 row). The story's QA section should point at the headless scripts in `sprint-011-head-2026-10-24/tm-018/`.
- TM-020 story Test Evidence line says "No signed ... evidence (gap)" and points at the 2026-10-23 captures; the cases file names other paths, and its TM-020-07 expected opacity ranges are wrong (its own formula gives [0.36, 0.90] and [0.22, 0.55]).
- No unit test covers `failed` objective rows for markers (only TM-020-05 does).
- Art: bright white ellipses (likely wet-ground highlights) overlap hero shapes at full contrast in several mission captures, against art bible §3.4; optional rings can be half hidden by buildings (Hollow Crown server findability untested); destroy objectives pulse the zone on the minimap while 3D rings sit on the devices (design question).
