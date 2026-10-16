# Sprint 8 — 2026-10-16 to 2026-10-28

## Sprint Goal

Land the Tactical mission rules: orders and stances behave at their edges, the same seed builds the same mission, weather and opening hour change only what the GDD allows, hits and civilian counts follow the fire lane, and the mission ends with the right outcome (or none, on abort).

## Capacity

- Total days: 9 working days (one person, Fri 16 Oct through Wed 28 Oct)
- Buffer (20%): 1.8 days
- Available: 7.2 days
- Stories: Must Have 1.4 d, Should Have 1.2 d, Nice to Have 0.9 d = 3.5 d. Retro tasks (below) 1.3 d. Total 4.8 d, 2.4 d under the available line.
- Dates: Sprint 7 closed on 2026-10-16 (QA sign-off, retro), inside the 2026-10-15 -- 2026-10-28 window it shared with Sprints 4--6. Sprint 8 starts today and keeps the 2026-10-28 end. Move the dates if that is not intended.
- Velocity (retro sprint 7, `production/retrospectives/retro-sprint-7-2026-10-16.md`): 3.8/3.8 sheet-days (100%), 23 stories in a 134 min commit window, about 1.7 sheet-days per hour, decreasing for the third sprint. Sheet-days do not measure the work; the useful signals are stories per hour (about 10) and the source-vs-test forecast (right for 18 of 23 after review).
- Sizing rule (kept from Sprints 5--7): test-only stories are 0.1--0.2 d, Integration stories 0.3 d, stories that need a source change 0.5 d. The epic's own estimates (0.5--1.0 d) are written for a green-field build. File-level look below, not `/story-readiness`; re-size there.
- Story count (retro 7, action 5): 16, counted from the story files' `Status: Ready` lines and written to `production/sprint-status.yaml`; the tables below hold the same 16.
- Epic choice (autonomous, logged): Tactical mission is the last Feature-layer epic (Roster and Assembly closed in Sprint 7). It has 16 Ready stories (TM-017 Complete since 2026-10-10). Interface (10 Ready) and Audio (7 Ready) are Presentation and stay out.
- Story granularity: the balanced range is 6--10; this plan holds all 16 Ready stories. Sprint 7 held 23 on the same velocity, and splitting the order/stance chain (001--006) or the outcome chain (012--014) across sprints would leave rules half-covered. If the sprint runs long, cut from the Nice to Have tail first. Logged deviation from the configured range.
- No milestone is defined — planning against the story backlog alone. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT skipped — Lean mode.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 8; chosen automatically in autonomous mode, option [A]).

### Code check at planning (2026-10-16)

| Story | What `src/` has | Size |
|---|---|---|
| 001, 002 | Selection and order recipients in `world.ts` and the HUD; Select-all appears in 3 source files with 1 test line | 001 may need a test seam; 002 probably test-only |
| 003--006 | Hold Ground / Hold Fire in 7 source files (36 / 16 test lines); `ACQUIRE_INTERVAL` auto-acquire at `world.ts` L89; Stop in 3 files | Probably test-only |
| 007 | Seeded mission build (`citygen.ts`, `rng.ts`, `missionParams.ts`); brief and deploy read the same params | Integration, probably test-only |
| 008, 009 | Weather in 14 source files (64 test lines); `riskWeather` and the risk chance in `missionParams.ts` ~L169--298; opening hour in 7 files | Probably test-only; 009's risk formula needs a check against the GDD |
| 010 | `civiliansHit` in 9 files, 160 test lines (TM-017 shared it) | Probably test-only |
| 011 | Hit chance is inline at `world.ts` ~L852 (`0.78 - d/range*0.28 ± 0.05`, clamped 0.05--0.95) | Probably a source change (extract the formula to test it) |
| 012--014 | Eliminate tags in 5 files; quiet replay in 13 files (185 test lines); abort/no-outcome tested in RA-019 | 013 Integration; 012, 014 probably test-only |
| 015 | Hardened profile in 4 files (41 test lines); camera in 18 files | Integration, probably test-only |
| 016 | Grenade in 8 files (43 test lines) | Probably test-only |

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| TM-001 | Opening selection and Select-all are the living set | gameplay-programmer | 0.2 | None | Per story file |
| TM-002 | Dead ids, empty selection, and Attack on a Device are no-ops | gameplay-programmer | 0.1 | TM-001 | Per story file |
| TM-003 | Move clears target and Hold Ground; stop-to-engage on the path | gameplay-programmer | 0.2 | TM-001 | Per story file |
| TM-004 | Idle auto-acquire and Attack under Hold Ground and Hold Fire | gameplay-programmer | 0.2 | TM-003 | Per story file |
| TM-005 | Hold Fire clears automatic targets but keeps a standing Explicit | gameplay-programmer | 0.2 | TM-004 | Per story file |
| TM-006 | Hold Ground pins and parks the path; Stop clears pathing and keeps stance bits | gameplay-programmer | 0.2 | TM-005 | Per story file |
| TM-007 | Same seed builds the same mission; brief and deploy agree | gameplay-programmer | 0.3 | None (R-5 first) | Per story file |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| TM-008 | Weather retunes CorpSec sight and weapon noise only | gameplay-programmer | 0.2 | TM-007 | Per story file |
| TM-009 | Opening hour changes no sight, noise, or risk; risk index formula | gameplay-programmer | 0.2 | TM-007 | Per story file |
| TM-010 | civiliansHit counts unique squad-caused civilian first-hits | gameplay-programmer | 0.1 | None | Per story file |
| TM-011 | Cover interrupts the fire lane; hit chance formula | gameplay-programmer | 0.5 | TM-010 | Per story file |
| TM-012 | Eliminate counts tagged Units only; optionals never gate the win | gameplay-programmer | 0.2 | None | Per story file |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| TM-013 | Loss conditions; abort emits no outcome DTO | gameplay-programmer | 0.3 | TM-012 (R-5 first) | Per story file |
| TM-014 | Quiet replay outcome and the deploy freeze | gameplay-programmer | 0.2 | TM-013 | Per story file |
| TM-015 | Hardened profile keeps minimap data; camera pose is fixed | gameplay-programmer | 0.3 | None (R-5 first) | Per story file |
| TM-016 | Grenade confirm spends one power cell; refusal spends nothing | gameplay-programmer | 0.1 | None | Per story file |

### Retro tasks (not stories; not in `sprint-status.yaml`)

| ID | Task | Owner | Est. Days | Deadline | Done when |
|----|------|-------|-----------|----------|-----------|
| R-1 | Make specialist review and a mutation check part of each story, before `/story-done`: a source-changing or test-adding story cannot close on `/code-review: NOT ASSESSED` without a written waiver, and each Logic story records one "break the source, watch the test fail" check. Retro 7, action 1 | Marco | 0.4 | Before TM-001 | `/story-done` (or `implement-stories`) refuses NOT ASSESSED without a waiver; the rule is written in the skill |
| R-2 | Close the Sprint 7 QA conditions: lead sign-off on `ra-013-evidence.md`, `/code-review` on `src/state/save.test.ts` (reconcile with `b5bebe2`), re-map TR-roster-006, confirm research Stories 013--015 cover RA-021, accept or walk C-8, assess C-6 against the tautological sweep. Retro 7, action 2 | Marco | 0.3 | 2026-10-22 | Conditions update in `qa-signoff-sprint-007-2026-10-16-r2.md` |
| R-3 | World Network frame spike: close it with the Sprint 7 smoke item 8 numbers (p95 at most 9.0 ms, max at most 25.0 ms, 0 frames over 50 ms in 4 runs) and a written reason, or file `BUG-0001` with a tagged trace. Fifth carry; stop carrying it. Retro 7, action 3 | Marco | 0.1 | 2026-10-21 | Closure reason written, or `production/qa/bugs/BUG-0001.md` exists |
| R-4 | One pass: write the Sprint 5 QA conditions update; drop the Definition of Done section from `.claude/docs/templates/sprint-plan.md` or have `/team-qa` tick it; write the evidence path rule (`production/qa/evidence/<story-slug>/`). Retro 7, action 4 | Marco | 0.3 | 2026-10-24 | Conditions update in `qa-signoff-sprint-005-2026-10-15.md`; decision written into the template |
| R-5 | AC top-up for the three Integration stories with 2 criteria (TM-007, TM-013, TM-015), from the GDD Edge Cases, or `/story-readiness` stops them | Marco | 0.2 | Before TM-007 | TM-007, 013, 015 each have 3+ criteria |
| R-6 | Take the story count from `sprint-status.yaml`, not prose. Retro 7, action 5 | Marco | 0 | At planning | Done in this plan (16 in both) |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 23 Sprint 7 stories (RA-001 to RA-025, minus RA-003 and RA-006) are `done` in `production/sprint-status.yaml`. Open retro items are carried as R-1 to R-5 above. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Review and test quality checks again run after stories close (Sprint 7: 4 blocking fixes and 24 vacuous tests found after close) | High | Medium | R-1 before TM-001; no story closes on NOT ASSESSED without a waiver |
| Tests written against `world.ts` constants instead of GDD literals (the Sprint 7 sweep's main pattern) | Medium | Medium | R-1 mutation check; pin GDD values in tests |
| TM-011's hit chance is inline in `world.ts`; extracting it could change the RNG call order and break determinism | Medium | High | Keep the `rng()` call count and order unchanged; run the same-seed test (TM-007) after the change |
| Three Integration stories stop at readiness for too few criteria (TM-007, 013, 015 have 2) | High | Low | R-5 top-up before TM-007 |
| `world.ts` is 2,445 lines and most stories touch it; the file-level look may miss source changes (Sprint 7 missed 5 of 23) | Medium | Medium | Re-size at `/story-readiness`; cut Nice to Have first |
| 16 stories is above the balanced range | Low | Low | Dependency order; cut Nice to Have first |

## Dependencies on External Factors

- R-1 (review gate) before TM-001 and R-5 (AC top-up) before TM-007.
- `/qa-plan sprint` before implementation begins.

## Definition of Done for this Sprint

R-4 decides whether this checklist stays in the template. Until then it is kept as the skill writes it.

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-008-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
