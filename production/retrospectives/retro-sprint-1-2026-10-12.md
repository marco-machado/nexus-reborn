## Retrospective: Sprint 1 (interim, closed early)
Period: 2026-10-09 -- 2026-10-22 (retro run 2026-10-12, day 4 of 14; 10 days remain)
Generated: 2026-10-12 (revised 2026-10-13: the first version used calendar days of commits as actual time)

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-001.md`, `production/qa/qa-signoff-sprint-001-2026-10-12.md`, `git log --since=2026-10-09` commit timestamps, `grep` of `src/`, and the Claude Code session logs for this project (`~/.claude/projects/-Users-machado-Projects-nexus-reborn/*.jsonl`).

**How active time is measured**: the union of user/assistant message timestamps across every session in this project. Any gap over 15 minutes counts as idle; 30-minute gaps are given alongside. The development window runs from 2026-10-09 23:37 to the last story commit (IF-011, 2026-10-12 15:00), with QA and the retro excluded. Work done outside a session is not counted.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks | 10 | 12 | +2 |
| Completion Rate | -- | 100% (12/12 done) | -- |
| Effort (estimate sheet-days) | 12.0 | 14.0 | +2.0 |
| Active development time | 8.0 days available | 5.8 h (7.7 h with 30-min gaps) | -- |
| Bugs Found | -- | 0 | -- |
| Bugs Fixed | -- | 0 | -- |
| Unplanned Tasks Added | -- | 2 (TM-017, IF-009) | -- |
| Commits | -- | 30 (19 on 10-10, 11 on 10-12) | -- |

Planned = 5 Must (7.0 d) + 1 Should (1.0) + 2 Nice (2.0) + RA-006 and IF-011 (2.0). Commits include non-sprint tooling and docs.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Active dev time | Throughput |
|--------|---------|-----------|------|-----------------|------------|
| 1 (current) | 12.0 sheet-days | 14.0 sheet-days | 117% | 5.8 h (7.7 h) | 1.8–2.4 sheet-days / h |

**Trend**: NOT ASSESSED -- NO DATA (no earlier sprint to compare).
Sprint 1 finished all planned scope, plus 2 unplanned stories, in 5.8–7.7 active hours against a 10-working-day plan. That pace is about 25–33 minutes per sheet-day.

### What Went Well
- All 12 stories reached Complete; QA sign-off is APPROVED WITH CONDITIONS with no S1/S2 bugs, and all 3 conditions closed the same day.
- 705/705 tests passed across 41 files at 879bb68; the smoke check passed.
- Nice-to-Have items (WN-015, WN-016, RA-006, IF-011) landed, though the plan said they would be cut first.
- The QA cycle caught real drift (documentation drift C2-C4; IF-011 evidence re-taken for fix C1) before sign-off.
- Technical debt markers: 0 TODO, 0 FIXME, 0 HACK in `src/`.

### What Went Poorly
- Estimates were far too high: the sprint was sized at 12.0 sheet-days (14.0 delivered) and took 5.8–7.7 active hours. Against an 8-hour day that is roughly 15–19× over. The plan itself notes estimates were "uncalibrated" (added 2026-10-10 from Type and AC count).
- IF-011 was first carried to sprint 2 behind IF-009, then both were pulled back the same day. The cross-sprint dependency was avoidable churn.
- `sprint-status.yaml` omitted IF-009 after it was pulled in, so status tooling under-counted until `/sprint-plan update` fixed it.
- IF-009's estimate was TBD when pulled in.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| IF-011 depended on IF-009, which sat outside the sprint | <1 day | IF-009 pulled into sprint 1 (2026-10-12) | Pull in story dependencies when planning, or check `/story-readiness` dependencies first |

### Estimation Accuracy

| Task | Estimated | Actual | Variance | Likely Cause |
|------|-----------|--------|----------|--------------|
Per-story actuals are **approximate**. Each is the time from the previous commit, or the session start, to the story's commit, assuming the stories were worked one at a time.

| Task | Estimated | Actual (approx.) | Variance | Likely Cause |
|------|-----------|------------------|----------|--------------|
| WN-015 (most overestimated) | 1.0 sheet-day | ~2 min | ~240× | Committed 2 min after WN-016; probably done alongside it |
| WN-004 + WN-003 | 3.5 sheet-days | ~18 min | ~90× | One commit for both. Unreliable: 17 min of the time is a separate 03:41–03:58 session |
| WN-001 | 1.0 | ~31 min | ~15× | |
| WN-006 | 1.0 | ~37 min | ~13× | |
| IF-009 (least overestimated) | 1.0 | ~50 min | ~10× | Estimate was TBD when pulled in |
| Sprint total | 14.0 sheet-days | 5.8–7.7 h | ~15–19× at 8 h/day | Estimates were uncalibrated (added 2026-10-10 from Type and AC count) |

**Overall estimation accuracy**: 0 of 12 stories were within ±20% of their estimate. Every story was over by roughly 10× or more.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| IF-011 | Sprint 1 | 1 (reverted) | Blocked on IF-009 | Pulled back into sprint 1 and completed |

Nothing carries into sprint 2.

### Technical Debt Status
- Current TODO count: 0 (previous: NOT ASSESSED -- NO DATA)
- Current FIXME count: 0 (previous: NOT ASSESSED -- NO DATA)
- Current HACK count: 0 (previous: NOT ASSESSED -- NO DATA)
- Trend: no baseline; currently clean
- Concern: `applyMissionResult` leaks a session-only `taxPaid: 0` key (`src/state/worldStore.ts:913`), candidate S4 bug, not yet filed.

### Previous Action Items Follow-Up
No earlier retrospective; nothing to follow up.

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Plan sprint 2 with `/sprint-plan new`, sizing from this sprint's pace (not the uncalibrated per-story estimates) | Marco | High | 2026-10-15 |
| 2 | Record actual days per story (for example an `actual_days` line in each story's close-out) so estimation accuracy can be measured | Marco | Med | Sprint 2 start |
| 3 | At plan time, pull any story's unplanned dependency into the same sprint and give it a real estimate | Marco | Med | Sprint 2 planning |
| 4 | File the `taxPaid: 0` key leak with `/bug-report` | Marco | Low | 2026-10-22 |

### Process Improvements
- Re-calibrate estimates from observed throughput: sprint 1 delivered 14.0 sheet-days in 5.8–7.7 active hours (1.8–2.4 sheet-days per hour).
- Keep `sprint-status.yaml` in step with the plan whenever a story is pulled in (run `/sprint-plan update` the same session).

### Summary
Sprint 1 was a clean, fast sprint: every planned and unplanned story is done, tests are green, and QA signed off with no bugs. The most important change is estimation: the plan was about 15–19× the work (14.0 sheet-days in 5.8–7.7 active hours), so sprint 2 should be planned from measured pace in hours, and actual effort should be recorded to make that possible.
