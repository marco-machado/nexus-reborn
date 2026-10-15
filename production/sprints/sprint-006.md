# Sprint 6 — 2026-10-15 to 2026-10-28

## Sprint Goal

Close the Persistence and validation epic: Continue restores exactly the last Screen, a bad or contradictory blob is dropped all-or-nothing with a distinct Menu state, Settings and telemetry survive New Operation, and a Debrief reads unfiled until the next Screen's autosave lands.

## Capacity

- Total days: 10 working days (one person, Thu 15 Oct through Wed 28 Oct)
- Buffer (20%): 2 days
- Available: 8 days
- Stories: Must Have 1.6 d, Should Have 1.1 d, Nice to Have 1.5 d = 4.2 d. Retro tasks (below) 1.2 d. Total 5.4 d, 2.6 d under the available line.
- Dates: Sprint 5 closed on 2026-10-15 at 00:25, before its 2026-10-15 -- 2026-10-28 window. Sprint 6 takes that window, as Sprint 5 took Sprint 4's. Move the dates if that is not intended.
- Velocity (retro sprint 5, `production/retrospectives/retro-sprint-5-2026-10-15.md`): 5.1/5.1 sheet-days in a 91--97 min story commit window, about 3.3 sheet-days per hour (Sprint 4 about 5 per hour, same method). 14 of 20 stories were test-only; the 6 source stories took 5--8 min of commit time each.
- Sizing rule (kept from Sprint 5; it predicted all 11 "test-only" calls right): every story below was checked against `src/` at planning. Test-only stories are 0.1--0.2 d; stories that need a source change are 0.5 d. File-level look, not `/story-readiness`; re-check there.
- Time tracking: no per-story time field. Actual time comes from commit intervals and the session logs in the retro.
- Epic choice: Persistence and validation is the last Core-layer epic (18 Ready). World Network, Economy and contracts, and Research are Complete. All 18 stories are planned so the epic closes with this sprint, as you asked for Research. Roster, Tactical, Interface and Audio stay out.
- Story granularity: balanced range is 6--10; this plan holds 18 (the whole epic). Twelve look test-only. If the sprint runs long, cut from the Nice to Have tail first.
- No milestone is defined. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT skipped — Lean mode.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 6 yet). Add an on-screen RS-020 Chance check to its smoke scope (retro sprint 5, action 4).

### Code check at planning (2026-10-15)

| Story | What `src/` has | Size |
|---|---|---|
| 001 | CONTINUE SAVED button and `readSave` exist; `save.ts` ~L711 treats invalid or unavailable storage as **no campaign**, so there is no distinct invalid/unreadable Menu state | Source change |
| 002 | New Operation arms a confirm with a 3 s timeout (`src/ui/index.tsx` ~L147-208) | Probably test-only |
| 003 | Settings persist under their own key (`src/state/settingsStore.ts`) | Probably test-only |
| 004 | Save round-trip tests in `src/state/save.test.ts` ("lived-in roster") | Probably test-only |
| 005 | Mission is not saved; abort writes nothing (Sprint 4 EC-013) | Probably test-only |
| 006 | Apply-once key (ADR-0021, `src/state/debrief.ts`) | Probably test-only |
| 007 | `writeSave` on Screen entry (`src/state/save.ts` ~L559) | Probably test-only |
| 008 | Drop-all on non-JSON and schema failure exists; Menu reason missing (shares 001's change) | Source change |
| 009 | Settings and telemetry use separate keys with their own fallback | Probably test-only |
| 010 | `save.ts` ~L496-497 rejects both flags true and a win flag that disagrees with the three authored wins | Probably test-only |
| 011 | Same validator; valid combinations load | Probably test-only |
| 012 | Hydrate calls `researchStore.sync` / `campaignStore.sync` at the saved `t` (`save.ts` ~L755); RNG states live in the blob | Probably test-only |
| 013 | Telemetry toggle and local log (`src/state/telemetry.ts`, `Settings.tsx`) | Probably test-only |
| 014 | `TELEMETRY_CAP = 60`, FIFO append (`telemetry.ts`) | Probably test-only |
| 015 | `aborted` rows exist in `telemetry.ts` | Probably test-only |
| 016 | Balance EXPORT (data URL) and a two-step CLEAR with 3 s timeout (`src/ui/Balance.tsx`) | Test-only plus UI screenshots |
| 017 | No "unfiled" state anywhere in `src/` | Source change, UI |
| 018 | `writeSave` catches the throw, but nothing reports filed/unfiled (depends on 017) | Source change |

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| PV-001 | Menu Continue: never-started vs valid save | gameplay-programmer | 0.5 | R-4 | Per story file |
| PV-008 | Invalid or unreadable campaign blob is dropped all-or-nothing | gameplay-programmer | 0.5 | PV-001 | Per story file |
| PV-002 | New Operation: two-step erase of the house | gameplay-programmer | 0.2 | PV-001, R-4 | Per story file |
| PV-004 | Continue restores the last Screen snapshot | gameplay-programmer | 0.2 | PV-001 | Per story file |
| PV-010 | Contradictory campaign flags drop the blob | gameplay-programmer | 0.1 | PV-008 | Per story file |
| PV-011 | Valid flag combinations load as stored | gameplay-programmer | 0.1 | PV-010 | Per story file |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| PV-003 | Settings envelope survives New Operation and reload | gameplay-programmer | 0.1 | PV-002, R-4 | Per story file |
| PV-005 | Mid-mission reload and Abort discard | gameplay-programmer | 0.2 | PV-004, R-4 | Per story file |
| PV-006 | Debrief applies once in session memory | gameplay-programmer | 0.2 | PV-004, R-4 | Per story file |
| PV-007 | Next-Screen autosave durably commits the Debrief result | gameplay-programmer | 0.2 | PV-006 | Per story file |
| PV-009 | Settings and telemetry garbage fall back independently | gameplay-programmer | 0.1 | PV-008 | Per story file |
| PV-012 | Hydrate syncs to saved t; RNG streams continue | gameplay-programmer | 0.2 | PV-004 | Per story file |
| PV-013 | Telemetry opt-in default and no network egress | gameplay-programmer | 0.1 | None | Per story file |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| PV-014 | One record per outcome, cap 60 FIFO, log survives New Operation | gameplay-programmer | 0.1 | PV-013 | Per story file |
| PV-015 | Abort telemetry row and Balance win rate | gameplay-programmer | 0.1 | PV-013 | Per story file |
| PV-016 | Balance Export and two-step Clear | ui-programmer | 0.3 | PV-013 | Per story file |
| PV-017 | Debrief filing status reads unfiled until the next Screen | ui-programmer | 0.5 | PV-007 | Per story file |
| PV-018 | Write failure never reports filed | gameplay-programmer | 0.5 | PV-002, PV-007, PV-017, R-4 | Per story file |

### Retro tasks (not stories; not in `sprint-status.yaml`)

| ID | Task | Owner | Est. Days | Deadline | Done when |
|----|------|-------|-----------|----------|-----------|
| R-1 | Re-run the specialist `/code-review` from the main session on RS-003, 005, 006, 009, 010, 011 (the workflow subagent cannot spawn specialists), and decide how `implement-stories` reviews this sprint | Marco | 0.3 | Before PV-001 | Each story's Code Review line carries a specialist verdict |
| R-2 | `/bug-report` and `/perf-profile` with a trace for the World Network single-frame spike (181 / 206 / 250 ms) | Marco | 0.3 | 2026-10-21 | `production/qa/bugs/BUG-0001.md` exists with the trace attached |
| R-3 | Close the Sprint 5 QA conditions: RS-009 lead sign-off; decide the remaining-time format against P-22; unique `rs-remaining` test ids; retake RS-009 screenshots at 1280x720 in `production/qa/evidence/sprint-005/` | Marco | 0.3 | 2026-10-22 | Sprint 5 sign-off conditions 1--2 ticked |
| R-4 | Six Integration stories have only 2 acceptance criteria (PV-001, 002, 003, 005, 006, 018); `/story-readiness` will stop each one, as it stopped RS-017. Add a third criterion to each (**done 2026-10-15**), and decide whether `/create-stories` should enforce the minimum (open) | Marco | 0.2 | Before PV-001 | Each of the six has 3+ criteria ✔ |
| R-5 | Drop the Definition of Done checklist from the sprint plan template, or tick it at `/team-qa` | Marco | 0.1 | 2026-10-24 | Decision written into the template or this plan |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 20 Sprint 5 stories (RS-001 to RS-020) are Complete in `production/sprint-status.yaml` and their story files. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Six Integration stories stop at readiness for too few acceptance criteria | Closed 2026-10-15 | — | R-4 top-up done: each now has 3 criteria taken from the GDD Edge Cases |
| PV-001 / PV-008 add a Menu state and touch `src/state/save.ts` (a CONTRACT FILE) and the save envelope | Medium | High | Read the contract header and ADR-0011 first; the save round-trip tests must stay green |
| PV-017 / PV-018 introduce a filed/unfiled status the GDD says current code does not expose; the copy and layout belong to `/ux-design` | Medium | Medium | Settle the Debrief copy at readiness; screenshots at 1280x720 for the UI stories |
| Code review again ends NOT ASSESSED inside the workflow | High | Medium | R-1 decides; otherwise run `/code-review` in the main session after the run |
| 18 stories is about twice the balanced range | Medium | Low | Dependency order; cut Nice to Have first |

## Dependencies on External Factors

- R-4 (acceptance criteria top-up) before the first story; R-1 before the first story.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-006-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
