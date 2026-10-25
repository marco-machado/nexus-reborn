## QA Sign-Off Report: Sprint 11
**Date**: 2026-10-25 (cycle run 2026-10-24 to 2026-10-25)
**Drafted by**: qa-lead (Phase 6, /team-qa sprint, autonomous). Written by the orchestrator. The verdict was checked against the rules and agrees.

**Build**: HEAD `131a5c1` (final sprint build). **qa.level**: full.
**Scope**: 30 stories: Sprint 11's 24 plus 6 that shipped in `2c73542`: TM-019, TM-020, TM-021, IF-039, WN-021 and WN-022. Claude added the 6 because they are in this build and no other QA cycle owns them; the owner had no view ("fuck if i know", 2026-10-24).
**Smoke check**: PASS (`production/qa/smoke-2026-10-24-sprint-011.md`).
**Automated**: `npm test` 1668/1668 on three runs in a row: 1664 existing tests plus 4 new TM-021 tests written this cycle, each seen failing under mutation. `tsc -b` clean. `npm run lint` clean and `npm run build` PASS ("built in 1.77s"), both re-run 2026-10-25 on the working tree.
**Scripted runs on HEAD** (`production/qa/evidence/sprint-011-head-2026-10-24/README.md`):
- R1: 152/152.
- R2: all 10 surfaces at 0; World Network alone also 0.
- R4: all 12 surfaces at 0.
- R3: 15/16. The one FAIL is an ordering defect in the script `focus.mjs`, not in the game. The check it skipped was walked by hand: IF-037 TC-12 PASS.

**Plan / strategy / cases**: `production/qa/qa-plan-sprint-011-2026-10-24.md`, `production/qa/qa-strategy-sprint-011-2026-10-24.md`, `production/qa/test-cases/`.

### Test Coverage Summary
Per-story results: `production/qa/evidence/sprint-011-head-2026-10-24/<story>/results.md`. Evidence docs: `production/qa/evidence/<story>-evidence.md`.

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| IF-016 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-017 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-018 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-019 | Integration | Unit tests 29/29 + R1 | Browser walked | PASS WITH NOTES |
| IF-020 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-021 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-022 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-023 | UI | R1 | Walked, incl. played-win TC-10 | PASS WITH NOTES |
| IF-024 | UI | R1 | Walked, screenshots | PASS |
| IF-025 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-026 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-027 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-028 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-029 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-030 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-031 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-032 | UI | R1 | Walked, incl. real drag | PASS WITH NOTES |
| IF-033 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-034 | UI | R1 | Walked, incl. Enter/Space | PASS WITH NOTES |
| IF-035 | UI | R1 | Walked, screenshots | PASS WITH NOTES |
| IF-036 | UI | R2 / R4 | Walked. AC-1 counts all 0; AC-2 FAIL | **FAIL** (BUG-0011) |
| IF-037 | UI | R2 / R3 15/16 (script defect) | Walked. AC-1 TC-037-03 FAIL; AC-2, AC-3 PASS | **FAIL** (BUG-0013) |
| IF-038 | UI | R2 / R3 / R4 | Walked, screenshots | PASS WITH NOTES |
| IF-039 | UI | R4 (layout) | Walked. AC-1 TC-02 FAIL; AC-2..AC-5 PASS | **FAIL** (BUG-0010) |
| WN-022 | UI | Unit tests (WN-022 describe, 4) | Walked, screenshots | PASS WITH NOTES |
| TM-018 | Logic | AC-1 tests green | AC-2, AC-3 captured and measured | PASS. Lead sign-off row unchecked |
| TM-019 | Logic | Tests present, green (in the 1668) | None needed | PASS |
| TM-020 | Visual/Feel | Unit tests 3/3 | 8/8 cases PASS | PASS on cases. **Art lead and QA lead sign-off not given** |
| TM-021 | Logic | AC-1 and the no-route line: 4 tests added this cycle (`src/game/tutorial.test.ts`, `src/state/tutorialStore.test.ts`, `src/game/world.noRoute.test.ts`), green and mutation-checked; AC-2 nobody-selected test already existed | None needed | PASS |
| WN-021 | Logic | Tests present, green (in the 1668) | None needed | PASS |

Carried Sprint 10 QA condition 4 (Brief H5–H8): all PASS (`production/qa/evidence/sprint-011-head-2026-10-24/carried-brief/results.md`).

Every one of the 30 stories has executed evidence: either a test that ran or a manual case that was walked.

### Bugs Found
| ID | Story | Severity | Status |
|---|---|---|---|
| BUG-0010 | IF-039: Brief notes for Rust Haven and industrial generated contracts lack `EVERY CIVILIAN HIT IS BILLED.` | S3-Medium (P1-Fix this sprint) | Open |
| BUG-0011 | IF-036: Assembly `MOBILITY` breaks mid-word at text scale 100/110/125 | S3-Medium (P2-Fix soon) | Open |
| BUG-0013 | IF-037: Research node labels render 10.03 px at 125% against 11.68 expected, smaller than at 100% | S3-Medium (P2-Fix soon) | Open |
| BUG-0012 | None (World Network; existed before this sprint; not a story FAIL): CAMPAIGN FAILED banner always reads `0 / 3`, spec says `n / 3` | S3-Medium (P3-Backlog) | Open |
| BUG-0008 | Carried from Phase 1 (Audio): strategy music restarts before the clip ends | S3-Medium (P3-Backlog; owner deferred it to Polish) | Open |

Open S1: 0. Open S2: 0. Open S3: 5.

### Verdict: NOT APPROVED

Three stories FAIL with no documented workaround: IF-036 (BUG-0011), IF-037 (BUG-0013) and IF-039 (BUG-0010). Under the first rule in the order, that decides the verdict. No S1 or S2 bug is open; severity alone would have given APPROVED WITH CONDITIONS, but a story FAIL with no workaround outranks that.

**Conditions** (must be met before this build advances):
1. Fix BUG-0010, BUG-0011 and BUG-0013, then re-walk the failing cases on the new HEAD:
   - IF-039 AC-1 TC-02
   - IF-036 AC-2 (TC-036-22) at text scales 100, 110 and 125
   - IF-037 AC-1 TC-037-03

   The alternative is for the owner to record a documented workaround or accept the FAIL, story by story.
2. TM-020 (Visual/Feel): record the art lead's and the QA lead's sign-off in `production/qa/evidence/tm-020-objective-markers-in-the-3d-view-evidence.md`. Without it the story is not Done.
3. TM-018: check its lead sign-off row in `production/qa/evidence/tm-018-playtest-two-mission-fixes-evidence.md`.
4. Advisory: fix the ordering defect in `production/qa/evidence/screens-2026-10-23/focus.mjs` step 4 so R3 runs 16/16 on its own.
5. BUG-0012 (P3) and BUG-0008 (deferred by the owner to Polish) may stay deferred.

### Next Step
Resolve S1/S2 bugs and re-run /team-qa or targeted manual QA before advancing. There are no open S1/S2 bugs. What blocks this build is the three FAILed stories (IF-036, IF-037, IF-039). Once their bugs are fixed, a targeted manual QA pass on their failing cases is enough to re-decide the verdict. TM-020 and TM-018 also need their sign-offs. Per CLAUDE.md, the sprint closes with QA sign-off, then `/retrospective`, then `/sprint-plan new`; `/gate-check` is not run for a sprint.

### Observations for the owner
These are not defects. Each one is a question for the owner or UX.
- **Influence moment note**: at 1280x720 the note sits below the fold of the sector panel since WN-022 added the HELD BY row. A first-time player sees it only by scrolling, and a refocus drops it for good. P-25 does not require it to be in view (`if-026/results.md`, `if-034/results.md` N1, `if-035/results.md`).
- **Globe-marker hover tips** never draw: `.globe-marker:hover .tip` sets no opacity (`src/ui/ui.css:4541`). The spec does not rely on tips (`design/ux/world-network.md:391`).
- **Review-mode NOW** prints in Ink, not teal (`if-028/results.md`).
- **Crisis Unrest bar** ends in `--red` `#e04b3c`, not Red Hot; the value text is Red Hot (`if-021/results.md`).
- **Recruitment Market portrait**: the `.pp-live` blink continues under reduced motion. The comment at `src/ui/ui.css:4018` treats live blinks as information (`if-037/results.md`).
- **Antarctica Garrison** reads CRITICAL for a locked sector with no cities (`wn-022/results.md`).
- **Print White**: the story and `design/ux/world-network.md:449` give (232,251,242), but the token is (226,246,238) (`if-020/results.md`).
- **NEON GARDEN at 125%**: the row is 101 px in a 94 px OPEN CONTRACTS list, so 7 px of its frame can never be seen with the rest of the row. Its text is all reachable (`if-025/results.md`).

### Process notes
- Claude's mutation edits during the run caused an HMR reload and a duplicate store module on the dev server. Those runs were voided (`void-dup-store/`, `r1-probe-void-hmr/` under the HEAD evidence folder); all runs of record come from a restarted server.
- QA-lead rulings applied during Phase 5 are recorded at the foot of the results files: IF-025 TC-07, IF-026 TC-10, IF-027 TC-05, IF-039 TC-08.
- Cleanup: the dev server Claude started on 4200 is stopped, and no listener remains on 4200. No Chrome for Testing process is left. The in-app browser pane is closed.
