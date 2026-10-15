# Sprint 7 — 2026-10-15 to 2026-10-28

## Sprint Goal

Land the Roster and Assembly rules: the deploy gate and mass tiers hold at their boundaries, Assembly never auto-assigns or assigns an Injured operative, debrief turns end HP into Ready, Injured or KIA with recovery on strategic time, and an empty roster fails an incomplete campaign.

## Capacity

- Total days: 10 working days (one person, Thu 15 Oct through Wed 28 Oct)
- Buffer (20%): 2 days
- Available: 8 days
- Stories: Must Have 0.9 d, Should Have 1.2 d, Nice to Have 1.7 d = 3.8 d. Retro tasks (below) 1.7 d. Total 5.5 d, 2.5 d under the available line.
- Dates: Sprint 6 closed on 2026-10-15 (QA sign-off, retro), inside its own 2026-10-15 -- 2026-10-28 window. Sprint 7 reuses that window, as Sprints 4--6 did. Move the dates if that is not intended.
- Velocity (retro sprint 6, `production/retrospectives/retro-sprint-6-2026-10-15.md`): 4.2/4.2 sheet-days (100%) in a 101 min commit window for 17 stories, about 2.2 sheet-days per hour. Sheet-day estimates no longer measure the work; the useful signal is the source-vs-test forecast (right for 14 of 18).
- Sizing rule (kept from Sprints 5--6): test-only stories are 0.1--0.2 d; stories that need a source change are 0.5 d. Every story below was checked against `src/` at planning: Roster rules are already largely in code (`mass.ts`, `deployGate.ts`, `experience.ts`, `recruits.ts`, `campaignStore.ts`), and the epic's own estimates (0.5--1.0 d) are written for a green-field build. File-level look, not `/story-readiness`; re-check there.
- Epic choice (autonomous, logged): Roster and Assembly is the next epic by layer order (Feature; Core is closed). It has 22 Ready stories (RA-003 and RA-006 are Complete from Sprint 1). Tactical mission (16), Interface (10) and Audio (7) stay out.
- Story granularity: balanced range is 6--10; this plan holds all 22 Ready stories. Sprints 5 and 6 held 20 and 18 on the same velocity, and splitting an epic across sprints would leave the debrief, injury and hire rules half-covered. If the sprint runs long, cut from the Nice to Have tail first. Logged deviation from the configured range.
- No milestone is defined. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT skipped — Lean mode.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 7 yet; chosen automatically in autonomous mode, option [A]).

### Code check at planning (2026-10-15)

| Story | What `src/` has | Size |
|---|---|---|
| 001, 002, 004, 005 | `mass.ts` (`squadMassKg`, `massTier`) with 13 tests in `mass.test.ts`; overage label `'… KG OVER THE MASS LIMIT'` at `src/ui/index.tsx` ~L1084 | Probably test-only |
| 007, 008 | `canDeploy` in `deployGate.ts` (7 tests); assign/unassign in `src/ui/index.tsx` ~L1140--1182 (Injured row reads `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`) | Probably test-only |
| 009 | Assembly UI; no-auto-assign and Injured inspect-only need an on-screen check | UI, screenshots |
| 010, 011, 012 | New-campaign roster and `INITIAL_INJURY_RECOVERY` in `campaignStore.ts` ~L139; `injuryRecoverySec` at L60 | Probably test-only |
| 013, 014, 015 | Injury and KIA applied in `campaignStore.ts` ~L247--286; `experience.ts` has 2 tests | Probably test-only |
| 016, 017 | Recovery on sync at `campaignStore.ts` ~L169 | Probably test-only |
| 018, 019, 020 | `applyDebrief` in `src/state/debrief.ts`; `deployFreeze.ts` | Probably test-only |
| 021 | Wear resolution in the Research/Roster slices | Probably test-only |
| 022, 023 | `recruits.ts` (`hireCost`, 6 tests); hire path `campaignStore.ts` ~L292 | Probably test-only |
| 024 | `isCampaignFailed` (`campaignStore.ts` ~L278) | Probably test-only |
| 025 | `save.ts` validates operatives, roster, loadout and candidates | Probably test-only; 1 AC |

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RA-001 | Operative mass reference values | gameplay-programmer | 0.1 | None | Per story file |
| RA-002 | Item-slot and pool mass terms | gameplay-programmer | 0.1 | RA-001 | Per story file |
| RA-004 | Mass tier: light and standard bands | gameplay-programmer | 0.1 | RA-003 (Complete) | Per story file |
| RA-005 | Mass tier heavy band and the 400 kg limit | gameplay-programmer | 0.2 | RA-004 | Per story file |
| RA-007 | canDeploy refusals: no contract, none assigned, not Ready | gameplay-programmer | 0.1 | RA-006 (Complete) | Per story file |
| RA-008 | Assembly assign and unassign edits | gameplay-programmer | 0.2 | RA-006 (Complete) | Per story file |
| RA-010 | New campaign roster: eight living, Raven Injured | gameplay-programmer | 0.1 | None | Per story file |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RA-011 | Role kits resolve from the operative role | gameplay-programmer | 0.1 | None | Per story file |
| RA-012 | injuryRecoverySec helper values | gameplay-programmer | 0.1 | None | Per story file |
| RA-013 | Debrief classifies survivors as Ready, Injured, or KIA | gameplay-programmer | 0.2 | RA-012 | Per story file |
| RA-014 | KIA removes the operative from the living roster | gameplay-programmer | 0.2 | RA-013 | Per story file |
| RA-015 | Experience award and deploy sampling | gameplay-programmer | 0.2 | RA-013, RA-001 | Per story file |
| RA-016 | Injury recovery on strategic sync | gameplay-programmer | 0.1 | RA-010, RA-013 | Per story file |
| RA-017 | Win ETA catch-up of injury downtime | gameplay-programmer | 0.2 | RA-013, RA-016 | Per story file |
| RA-024 | Campaign fail on empty roster | gameplay-programmer | 0.1 | RA-014 | Per story file |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| RA-009 | Assembly opens without auto-assign; Injured dossier is inspect-only | ui-programmer | 0.3 | RA-008 | Per story file |
| RA-018 | Loss and quiet-replay debrief roster apply | gameplay-programmer | 0.2 | RA-013, RA-015, RA-017 | Per story file |
| RA-019 | Abort writes no roster; debrief applies roster once | gameplay-programmer | 0.2 | RA-013 | Per story file |
| RA-020 | Deploy freeze of the Roster slice | gameplay-programmer | 0.2 | RA-002, RA-015 | Per story file |
| RA-021 | Augmentation bay wear resolution | gameplay-programmer | 0.1 | None | Per story file |
| RA-022 | Candidate market offers and hire cost | gameplay-programmer | 0.2 | None | Per story file |
| RA-023 | Hire refusals and success | gameplay-programmer | 0.2 | RA-022 | Per story file |
| RA-025 | Roster save and reload | gameplay-programmer | 0.3 | RA-023, RA-024 | Per story file |

### Retro tasks (not stories; not in `sprint-status.yaml`)

| ID | Task | Owner | Est. Days | Deadline | Done when |
|----|------|-------|-----------|----------|-----------|
| R-1 | Make specialist review part of every source-changing story: change `implement-stories` so `/code-review` runs from the main session with lead-programmer, ui-programmer and qa-tester, or run it after each workflow run. Include the six Sprint 5 Research stories (RS-003, 005, 006, 009, 010, 011) and PV-016/017 (Sprint 6 QA condition 3). Retro 6, action 1 | Marco | 0.4 | Before RA-001 | No story commit says `/code-review: NOT ASSESSED`; each named story's Code Review line carries a specialist verdict |
| R-2 | AC top-up for the three Integration stories under 3 criteria (RA-014 has 2, RA-018 has 2, RA-025 has 1), or `/story-readiness` stops them as it stopped RS-017. Add 3rd+ criteria from the GDD Edge Cases. Decide whether `/create-stories` should enforce the minimum (open since Sprint 6) | Marco | 0.2 | Before RA-014 | RA-014, 018, 025 each have 3+ criteria |
| R-3 | World Network frame spike (181 / 206 / 250 ms): `/bug-report` with a tagged trace, or close the item on purpose with a reason. Third carry. Retro 6, action 2 | Marco | 0.3 | 2026-10-21 | `production/qa/bugs/BUG-0001.md` exists with the trace, or the closure reason is written |
| R-4 | Close or waive the Sprint 5 QA conditions (RS-009 lead sign-off; remaining-time format vs P-22; unique `rs-remaining` test ids; RS-009 screenshots at 1280x720) and write a conditions update into that sign-off. Retro 6, action 3 | Marco | 0.3 | 2026-10-22 | Conditions update in `qa-signoff-sprint-005-2026-10-15.md` |
| R-5 | Close the Sprint 6 QA conditions: PV-018 notice placement via `/ux-design` (or accept the current placement in writing); lead-programmer sign-off rows for PV-016 and PV-017 (or waive); PV-016/017 code review (shared with R-1) | Marco | 0.2 | 2026-10-24 | Conditions 1--3 of `qa-signoff-sprint-006-2026-10-15.md` ticked or waived |
| R-6 | Fix the sprint-plan template in one pass: drop the Definition of Done checklist or have `/team-qa` tick it (fourth carry), and name evidence paths as `production/qa/evidence/<story-slug>/` so QA plans match what stories write. Retro 6, action 4 | Marco | 0.2 | 2026-10-24 | Decision written into the template or this plan |
| R-7 | Schedule or start the two QA follow-ups: the P-01 armed hint on Menu New Operation (and Pause Abort if missing), and the Sectors panel clipping at 125% text scale. Retro 6, action 5 | Marco | 0.1 | At sprint start (schedule) | Each is a story, a bug, or fixed |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 18 Sprint 6 stories (PV-001 to PV-018) are Complete in `production/sprint-status.yaml` and their story files. Open retro items are carried as R-1 to R-7 above. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Code review again ends NOT ASSESSED (Sprint 5 and 6 both did; the first real review found 3 required changes after QA) | High | Medium | R-1 before RA-001; do not close a source-changing story on NOT ASSESSED |
| Three Integration stories stop at readiness for too few acceptance criteria (RA-014: 2, RA-018: 2, RA-025: 1) | High | Low | R-2 top-up before RA-014 |
| Several rules need a source change the file-level look missed (Sprint 6 missed 4 of 18) | Medium | Medium | Re-size at `/story-readiness`; cut Nice to Have first |
| RA-009 (Assembly) is a UI story; overlay or row placement unreviewed until QA (Sprint 6's write-failure notice took three tries) | Medium | Medium | Placement probe at 1280x720 and 125% text scale at story time |
| `campaignStore.ts` and `save.ts` are CONTRACT FILEs; roster rules touch both and the save round-trip tests | Medium | High | Read the contract headers and ADR-0020 first; keep `save.test.ts` green |
| 22 stories is about twice the balanced range | Medium | Low | Dependency order; cut Nice to Have first |

## Dependencies on External Factors

- R-1 (specialist review) and R-2 (AC top-up) before the stories they gate.
- `/qa-plan sprint` before implementation begins.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-007-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
