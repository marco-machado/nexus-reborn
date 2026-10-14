## Retrospective: Sprint 3 (closed early)
Period: 2026-11-06 -- 2026-11-19 (planned window). Development ran 2026-10-14 00:55 -- 01:31 (about 0.6 h of active work). QA sign-off ran 09:45 -- 09:49. Retro run 2026-10-14, 23 days before the window opens.
Generated: 2026-10-14

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-003.md`, `production/retrospectives/retro-sprint-2-2026-10-13.md`, `production/qa/qa-signoff-sprint-003-2026-10-14.md`, `production/qa/smoke-2026-10-14.md`, the Completion Notes in the 10 story files, `git log` and `git show --stat` for `e590509..a2bbf60`, `grep -w` of `src/` and `scripts/`, and the Claude Code session logs for this project.

**Input check**: sprint plan FOUND, sprint-status.yaml FOUND, previous retro FOUND, QA sign-off FOUND, story Completion Notes FOUND, git history FOUND. Per-story actual time ABSENT (no story records it), so Estimation Accuracy is sprint-level only. No milestone file exists. I did not re-run the test suite; the 838/838 figure is the QA sign-off's.

**How active time is measured**: same method as the sprint 2 retro. Union of message timestamps across every session in this project; a gap over 15 minutes is idle (a 30-minute gap gives the same total). Only sessions from 2026-10-13 23:44 onward were counted. That window holds three segments: 23:44--00:08 (24 min, sprint 2 close-out and sprint 3 planning, not development), **00:55--01:31 (36 min, development, review and smoke)**, and 09:45--09:49 (4 min, QA sign-off). The development figure runs to the smoke report's file time (01:31); the last code commit is 01:21, so 26 min is the lower bound. Work outside a Claude session is not counted.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks | 10 | 10 | 0 |
| Completion Rate | -- | 100% (10/10 done) | -- |
| Effort (estimate sheet-days) | 8.0 | 8.0 completed | 0 |
| Active development time | 8.0 days available | 0.4--0.6 h | -- |
| Bugs Found | -- | 0 filed (see below) | -- |
| Bugs Fixed | -- | 0 filed; 3 review findings fixed | -- |
| Unplanned Tasks Added | -- | 0 stories | -- |
| Commits | -- | 12 story and review commits | -- |

Planned = 5 Must Have (4.0 d) + 4 Should Have (3.0) + 1 Nice to Have (1.0). "Actual" effort is the sum of the estimates of stories marked done. Commits run from `e590509` (EC-001) to `a2bbf60` (review suggestions): 10 story commits, `1ce9061` (review findings) and `a2bbf60` (review suggestions). Around them: the plan (`d64ab31`), the QA plan back-fill (`c220045`), one added EC-003 criterion (`91d2392`) and one tooling commit (`6839a5b`, "Let workflows invoke dev-story").

**Bugs**: `production/qa/bugs/` does not exist and the QA sign-off reports none. Code review did find three behaviour gaps, fixed in the same sprint and recorded in the Completion Notes: `addCredits(Infinity)` set Credits to Infinity (EC-001); `hireOperative` accepted a non-positive cost (EC-001); `authorizeResearch` could start research on a non-positive or non-finite cost (EC-002). They are fixes, not filed bugs.

**Unplanned work**: no story was added to `sprint-status.yaml`. Beyond the stories: `1ce9061` touched 15 files (ADR-0013 amendment, control manifest, architecture registry, story files, `appStore.ts` +9 lines); `a2bbf60` changed `src/state/researchStore.ts` (3 lines) and its test.

**Source changes**: 9 of 10 stories changed only `src/state/appStore.test.ts` (plus `worldStore.test.ts` for EC-009). EC-002 is the only story with a source change in its own commit: `src/state/appStore.ts` (13 lines) and `src/ui/Research.tsx` (10 lines), with 133 test lines.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Active dev time | Throughput |
|--------|---------|-----------|------|-----------------|------------|
| 1 | 12.0 sheet-days | 14.0 sheet-days | 117% | 5.8 h (7.7 h with 30-min gaps) | 1.8--2.4 sheet-days / h |
| 2 | 8.5 sheet-days | 8.5 sheet-days | 100% | 2.7 h | 3.1 sheet-days / h |
| 3 (current) | 8.0 sheet-days | 8.0 sheet-days | 100% | 0.4--0.6 h | 13--20 sheet-days / h |

**Trend**: Increasing, steeply. Throughput rose from 3.1 to about 13 or more sheet-days per active hour (8.0 / 0.6 h = 13.3; 8.0 / 0.43 h = 18.5).
Completion rate is again not a velocity measure: all scope finished. At 13 sheet-days per hour one sheet-day took under 5 minutes. Against an 8-hour day the plan was about 100× larger than the work (64 h of window against about 0.6 h). The plan's own calibrated forecast was 2.6 h, so it was still about 4× high.

### What Went Well
- All 10 stories are Complete, including the Nice to Have. QA sign-off is **APPROVED** (not "with conditions") with no S1/S2 bugs; the smoke check is PASS WITH WARNINGS.
- The suite grew from 770 tests (42 files) to 838 (43 files), +68, all passing at `a2bbf60` per the sign-off. Every Economy story has an executed test in `src/state/appStore.test.ts`.
- Code review (lead-programmer and qa-tester per story) found real gaps, not style points: the `Infinity` credit, the two non-positive-cost paths, and EC-001 AC3's untested research/hire half. All were fixed before the sign-off.
- Sprint 2's retro was acted on at plan time: `sprint-003.md` carries a calibration note and tells the reader to check each story against existing code. That check was accurate: it found nine stories whose behaviour already existed.
- No story was blocked (every `blocker` in `sprint-status.yaml` is empty) and no dependency sat outside the sprint.
- Technical debt markers remain 0 TODO, 0 FIXME, 0 HACK.

### What Went Poorly
- The estimates were again far larger than the work, and the gap widened (about 25× in sprint 2, about 100× in sprint 3) even though the plan was recalibrated. The calibration note adjusted the total by throughput but left every story at its original 0.5--1.0 d; `estimate_days` in `sprint-status.yaml` is unchanged from the plan.
- Nine of 10 stories were verification only. The Completion Notes say so directly for EC-006 ("this story added tests only"), EC-009, EC-012, and by "Only `src/state/appStore.test.ts` changed" for EC-003 and EC-005. They were estimated as implementation work (4.0 + 3.0 + 1.0 days for ~0.6 h).
- A spec/code mismatch surfaced and is not closed: `design/gdd/research.md` Core Rule 3 places the research action in `researchStore.ts`, but EC-002 put `authorizeResearch` in `appStore.ts` to avoid an import cycle. ADR-0013 was amended; the GDD line "needs a design decision" (EC-002 Completion Notes).
- Sprint 3 QA artifacts are uncommitted again. `git status` shows five untracked entries: the smoke report and its evidence folder, and the QA plan, strategy and sign-off. This is the same pattern sprint 2's retro named. The smoke check itself ran against a committed HEAD (`a2bbf60`), so the sign-off does not depend on the tree.
- The sprint plan's Definition of Done checkboxes in `production/sprints/sprint-003.md` are still unticked except "QA plan exists", although the yaml, stories and sign-off show them met. The two records disagree.
- QA read assertions in full for six stories only. For EC-001, 002, 003 and 007 it matched tests to criteria by title (medium confidence).

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None. Every `blocker` field in `sprint-status.yaml` is empty and no story had `status: blocked`. | -- | -- | -- |

### Estimation Accuracy

Per-story actual time: **NOT ASSESSED -- NO DATA**. The ten story commits (`e590509`..`a79bed1`) landed between 00:58:38 and 01:00:22, about 100 seconds apart, so commit times cannot separate one story's effort from another's. I did not check how that batch was run. No story file or yaml entry records actual time (`grep` for "actual hours" / "actual time" in the sprint, yaml and epic files finds nothing).

| Level | Estimated | Actual | Variance | Likely Cause |
|-------|-----------|--------|----------|--------------|
| Sprint total | 8.0 sheet-days (64 h at 8 h/day) | 0.4--0.6 h | about 100--150× over | 9 of 10 stories were tests for behaviour that already existed |
| Only story with a source change (EC-002) | 1.0 sheet-day | not measurable | -- | Adds 13 lines of `appStore.ts` and 10 of `Research.tsx`; the largest test block (133 lines) |
| Sprint 3 plan's own forecast | 2.6 h | 0.4--0.6 h | about 4--6× over | Calibrated on the total only |

**Overall estimation accuracy**: not computable per story. At sprint level the estimate is off by two orders of magnitude, and the sprint 2 figure (about 25×) shows the same direction.

[Analysis: estimates are consistently over. Verification-only stories drive it, and the plan correctly predicted they would be common but did not lower their estimates. Re-basing in hours, with a sub-hour size for "tests and evidence only", would describe this work.]

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| None | -- | 0 | -- | -- |

Nothing carries out of sprint 3. The Economy epic has stories outside this sprint (for example stories 015, 018 and 019 have unticked criteria); they were never in scope.

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable, clean (counted with `grep -w` over `src/` and `scripts/`)
- Concerns: the `research.md` Core Rule 3 mismatch above (a doc/code divergence rather than a code marker); EC-008's story file still points to `src/game/contracts.ts` while the authored rewards live in `src/game/data.ts` (`MISSIONS`); the smoke check logged one 181 ms World Network frame (1 of 8,332), against a 50 ms World max on 2026-10-13, cause not investigated.

### Previous Action Items Follow-Up

| Action Item (from Sprint 2) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Commit or branch the globe work and sprint 2 QA artifacts; give the globe a story and Scan-filtering unit coverage | Partly done | Globe committed (`e0a978b`) and sprint 2 QA recorded (`c02ea45`, `0c9d679`). I did not find a globe story or check Scan-filtering coverage. The same untracked-QA-artifacts pattern recurred for sprint 3. |
| 2. Check whether behaviour already exists when estimating; estimate verification-only stories smaller | Partly done | `sprint-003.md` has the note and the check was right (9 of 10 test-only), but story estimates in `sprint-status.yaml` were not lowered. |
| 3. Record actual time per story at close-out, in hours | Not Started | Carried from sprint 1 and sprint 2, third time open. No story records it. |
| 4. Decide the WN-018 failed-state copy and the TR-world-network-009 registry text | Done for the copy | Marco accepted `REQUIRES INTEL LVL 1` as intended (sprint 2 sign-off, condition 1). I did not check the TR-world-network-009 registry text. |
| 5. Close the sprint 2 QA sign-off conditions and file the `taxPaid` bug | Done, by fixing | `c039d6c` edited the evidence sign-off rows, WN-014's criteria and the sign-off conditions. `47c8986` ("Keep the session-only taxPaid key off the World Network store") changed `worldStore.ts` and its test, so no bug was filed. I did not re-check the saved state. |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Commit the five untracked sprint 3 QA artifacts (smoke report and evidence, QA plan, strategy, sign-off) before any new sprint starts. | Marco | High | Before `/sprint-plan new` |
| 2 | Record actual time per story or per batch in `sprint-status.yaml` at `/story-done`, in minutes. If stories run as a batch, record the batch window. Third carry; if it stays open, drop it and keep the session-log method. | Marco | High | Sprint 4 start |
| 3 | Re-base estimates in hours and set a size for "tests and evidence only" stories (for example 0.1 d). Decide whether to start sprint 4 now: 23 days of the sprint 3 window are empty. | Marco | High | At sprint 4 planning |
| 4 | Decide `research.md` Core Rule 3 vs `authorizeResearch` in `appStore.ts`: amend the GDD line or move the action. Fix the stale `contracts.ts` pointer in the EC-008 story at the same time. | Marco | Med | 2026-10-21 |
| 5 | Tick the Definition of Done boxes in `sprint-003.md`; read the full assertions for EC-001, 002, 003, 007 (QA follow-up); file `/bug-report` if the 181 ms frame recurs. | Marco | Low | 2026-10-24 |

### Process Improvements
- Give the sprint plan one source of truth for completion. The yaml, the story files and the sign-off agree; the plan's Definition of Done does not. Either tick it at `/team-qa` or drop it from the plan.
- Re-estimate from the story's own check, not only from the total. When `/story-readiness` finds the behaviour already exists, change `estimate_days` for that story then. Two sprints of recalibrating the total have not closed the gap.

### Summary
Sprint 3 delivered all 10 Economy stories in about 0.6 active hours, with 838 passing tests, a QA sign-off of APPROVED and no filed bugs. Review earned its time: it found three real input-handling gaps in code that already shipped. The plan was still about 100× the work, because nine stories only added tests for existing behaviour and their estimates were never lowered. The most important change is to size and track in hours per story, so that the next plan describes the work and the 23-day empty window is a decision, not a surprise.
