# Sprint 5 — 2026-10-15 to 2026-10-28

## Sprint Goal

Close the Research epic: one billed start per authorize with refusals before any spend, completions in ascending endT with a house order on ties, bay issue and pins, and deploy sampling frozen at mission create.

## Capacity

- Total days: 10 working days (one person, Thu 15 Oct through Wed 28 Oct)
- Buffer (20%): 2 days
- Available: 8 days
- Stories: Must Have 1.2 d, Should Have 2.0 d, Nice to Have 1.9 d = 5.1 d. Retro tasks (below) 0.7 d. Total 5.8 d, 2.2 d under the available line.
- Dates: Sprint 4 closed on 2026-10-14, before its 2026-10-15 -- 2026-10-28 window opened. Sprint 5 takes that window. Move the dates if that is not intended.
- Velocity (retro sprint 4, `production/retrospectives/retro-sprint-4-2026-10-14.md`): 6.7/6.7 sheet-days in a 77--83 min story commit window, about 5 sheet-days per hour (sprint 3: 13--20 per hour, measured differently). Test-only stories took 4--7 min each against 1.0--1.5 d estimates.
- Sizing rule (retro action 4): every story below was checked against `src/` at planning. Test-only stories are 0.1 d; stories that need a source change keep a larger size. This is a file-level look, not `/story-readiness`; re-check at readiness and change `estimate_days` in `production/sprint-status.yaml` there.
- Time tracking (retro action 2): the per-story time field is dropped. Actual time is measured in the retro from commit intervals and the session logs. No story records minutes.
- Epic choice: Economy and contracts (22/22) and World Network (19/19) are Complete. Research is the Core-layer epic that builds on the Credits ledger (20 Ready). All 20 stories are planned, so the epic closes with this sprint. Persistence, Roster, Tactical, Interface and Audio stay out.
- Story granularity: balanced range is 6--10; this plan holds 20 at your request (the whole Research epic). Twelve of the 20 look test-only at 0.1--0.2 d. If the sprint runs long, cut from the Nice to Have tail first.
- No milestone is defined. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT skipped — Lean mode.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 5 yet).

### Code check at planning (2026-10-14)

| Story | What `src/` has | Size |
|---|---|---|
| 001 | `NODES` in `src/game/research.ts`; "authored program sums" and tree-integrity tests in `research.test.ts` | Probably test-only |
| 002 | `appStore.authorizeResearch`: cost check, `start()`, one `spendCredits`; covered by sprint 3 EC-002 tests | Small change: the GDD's post-spend re-read is not there |
| 003 | No post-spend re-read, no undo (GDD Core Rule 3 marks this **Unsatisfied**) | Source change |
| 004 | `nodeState()` in `src/state/researchStore.ts`; no test names it | Probably test-only |
| 005 | Eligibility lives inside `start()`; refusal copy only in `src/ui/Research.tsx` sub-lines | Source change |
| 006 | No in-mission check in `start()` or `authorizeResearch` | Source change |
| 007 | `start()` sets `endT = t + hours × 3600`; tested ("takes a free lab and schedules the end") | Probably test-only |
| 008 | `sync()` completes and frees labs; 7 sync tests; no payout path | Probably test-only |
| 010 | No research write in the mission path found by name | Unknown; integration test needed |
| 011 | `sync()` appends in branch order (`BRANCH_IDS`), not ascending `endT` | Source change |
| 009 | No exported `remaining(run, t)` in `src/game/research.ts` (the GDD seam); UI label behaviour unchecked | Source change, UI |
| 012 | Equal-`endT` tie-break depends on the RS-011 reorder | Source change |
| 013 | `currentIssue()` exists (last completed in the bay) | Probably test-only |
| 014 | `appliedNodeIds()` exists; one test in `research.test.ts` covers unpinned, STOCK and pinned | Probably test-only |
| 015 | Pins, `wornNode()` and `wornAugs()` exist; KIA-keeps-research not checked | Probably test-only |
| 016 | `src/game/deploy.ts`: `researchSlice()` keeps unslotted ids; `appliedIds` per operative | Probably test-only |
| 017 | Deploy snapshot is cut at create (ADR-0009); freeze after later completions not checked | Probably test-only |
| 018 | `squadWeapon()` exists with 7 tests | Probably test-only |
| 019 | `crewBonus()` exists with 3 tests | Probably test-only |
| 020 | Research exports no Chance code by name; `missionChance` input not checked | Unknown; integration test needed |

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RS-001 | Program catalog, costs and fundability gap | gameplay-programmer | 0.1 | None | Per story file (TR-research-002) |
| RS-004 | Prerequisite states: locked, available, active | gameplay-programmer | 0.1 | None | Per story file (TR-research-002) |
| RS-007 | Lab endT from authorize time and duration | gameplay-programmer | 0.1 | RS-002 | Per story file (TR-research-001) |
| RS-008 | sync(t) completes projects; completion pays nothing | gameplay-programmer | 0.1 | RS-007 | Per story file (TR-research-001) |
| RS-002 | Authorize success: start, then one debit | gameplay-programmer | 0.3 | Retro task R-5 (Core Rule 3 home decided) | Per story file (TR-research-005) |
| RS-003 | Authorize when Economy refuses or start() fails | gameplay-programmer | 0.5 | RS-002 | Per story file (TR-research-005) |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RS-005 | Refusal text for locked, researched and busy-lab projects | gameplay-programmer | 0.5 | RS-003, RS-004 | Per story file (TR-research-005) |
| RS-006 | Other eligibility refusals; no cancel verb | gameplay-programmer | 0.5 | RS-003 | Per story file (TR-research-005) |
| RS-011 | done appends in ascending endT | gameplay-programmer | 0.5 | RS-008 | Per story file (TR-research-003) |
| RS-012 | Equal-endT house order within a bay | gameplay-programmer | 0.3 | RS-011 | Per story file (TR-research-003) |
| RS-013 | currentIssue by bay | gameplay-programmer | 0.1 | RS-011 | Per story file (TR-research-002, 003) |
| RS-014 | appliedNodeIds for unpinned, stock and pinned bays | gameplay-programmer | 0.1 | RS-013 | Per story file (TR-research-002, 004) |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RS-010 | Labs frozen in the field; loss and abort leave Research alone | gameplay-programmer | 0.3 | RS-008 | Per story file (TR-research-001, TR-research-005) |
| RS-009 | Remaining time label appears only after sync | ui-programmer | 0.5 | RS-008 | Per story file (TR-research-001) |
| RS-015 | Pin and bay edges; death keeps the program | gameplay-programmer | 0.2 | RS-014 | Per story file (TR-research-002, 003) |
| RS-016 | Deploy sampling: Research slice is unslotted ids only | gameplay-programmer | 0.2 | RS-014 | Per story file (TR-research-004, 002) |
| RS-017 | Completions after the deploy freeze apply next deploy only | gameplay-programmer | 0.2 | RS-016 | Per story file (TR-research-006) |
| RS-018 | Weapon sampling from applied ids | gameplay-programmer | 0.1 | RS-014 | Per story file (TR-research-002) |
| RS-019 | crewBonus from applied ids | gameplay-programmer | 0.1 | RS-014 | Per story file (TR-research-002) |
| RS-020 | Research exposes the completed set only | gameplay-programmer | 0.3 | RS-008 | Per story file (TR-research-004) |

### Retro tasks (not stories; not in `sprint-status.yaml`)

| ID | Task | Owner | Est. Days | Deadline | Done when |
|----|------|-------|-----------|----------|-----------|
| R-1 | Close the Sprint 4 QA conditions: walk one real mission to Debrief (loss and quiet replay) on the current build; re-run `/code-review` on EC-022 where specialists can spawn, or record a lead-programmer waiver | Marco | 0.2 | Before any Debrief-touching story (none planned here) | Evidence in `production/qa/evidence/`, sign-off conditions 1--2 ticked |
| R-3 | `/bug-report` for the World Network frame spike (181 ms sprint 3, 206 ms sprint 4) and `/perf-profile` on World Network; note the 4.4 s Mission frame | Marco | 0.3 | 2026-10-21 | `production/qa/bugs/BUG-0001.md` exists with the profile attached |
| R-5 | Decide `research.md` Core Rule 3 vs `appStore.authorizeResearch` (the GDD names `src/state/researchStore.ts` as the home); fix the EC-008 `contracts.ts` pointer; tick or drop the Sprint 4 Definition of Done | Marco | 0.2 | Before RS-002 starts (Rule 3); others 2026-10-24 | GDD or code agrees on the home; pointer fixed |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 12 Sprint 4 stories (EC-004, 011, 013--022) are Complete in `production/sprint-status.yaml` and their story files. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Core Rule 3 home conflict (GDD says `researchStore.ts`, code is `appStore.authorizeResearch`) blocks RS-002/003 | High | Medium | R-5 first; the decision is the owner's |
| Post-spend re-read and undo (RS-003) touches the Credits ledger contract (ADR-0013) | Medium | Medium | Read ADR-0013 and the `appStore.ts` contract header before changing it |
| RS-011 changes `sync()` ordering, which `done` order feeds (current issue, applied ids in later stories) | Medium | Medium | Keep the existing "branch order" test as the equal-endT case; full suite must stay green |
| Estimates still over for test-only work | High | Low | 0.1 d sizes; re-check at `/story-readiness` |
| 20 stories is twice the balanced range; one late source change (RS-011/012 ordering) ripples into 013--019 | Medium | Medium | Implement in dependency order; cut from the Nice to Have tail first |
| RS-009 is the only UI story: needs retained 1280x720 screenshots of the Research screen | Medium | Low | Capture in the same pass as the story, as for EC-022 |

## Dependencies on External Factors

- Owner decision on research.md Core Rule 3 (R-5) before RS-002.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-005-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
