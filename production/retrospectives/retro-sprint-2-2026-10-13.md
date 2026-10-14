## Retrospective: Sprint 2 (closed early)
Period: 2026-10-23 -- 2026-11-05 (planned window). Development ran 2026-10-12 23:31 -- 2026-10-13 21:04, in **about 2.7 hours of active work** across three sessions. Retro run 2026-10-13, before the window opens.
Generated: 2026-10-13 (revised the same day: the first version used calendar days as actual time)

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-002.md`, `production/retrospectives/retro-sprint-1-2026-10-12.md`, `production/qa/qa-signoff-sprint-002-2026-10-13.md`, the Completion Notes in the 11 story files, `git log` commit timestamps, `grep` of `src/` and `scripts/`, and the Claude Code session logs for this project (`~/.claude/projects/-Users-machado-Projects-nexus-reborn/*.jsonl`, 97 files).

**How active time is measured**: the union of user/assistant message timestamps from every session in this project. Any gap over 15 minutes counts as idle; a 30-minute gap gives the same total for sprint 2. This counts time with a Claude session running. Work done outside a session (reading, thinking, manual play) is not counted.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks | 11 | 11 | 0 |
| Completion Rate | -- | 100% (11/11 done) | -- |
| Effort (estimate sheet-days) | 8.5 | 8.5 completed | 0 |
| Active development time | 8.0 days available | 2.7 h | -- |
| Bugs Found | -- | 0 | -- |
| Bugs Fixed | -- | 0 | -- |
| Unplanned Tasks Added | -- | 0 stories (see Unplanned work below) | -- |
| Commits | -- | 13 (11 story commits, 1 sprint plan, 1 tooling) | -- |

Planned = 6 Must Have (4.0 d) + 4 Should Have (4.0) + 1 Nice to Have (0.5). "Actual" effort is the sum of the story estimates for stories marked done; per-story actual effort is not recorded (see Estimation Accuracy). Commits run from `2d027fa` (WN-008) to `41febe7` (WN-019).

**Unplanned work**: no story was added to `sprint-status.yaml`. Outside the sprint, there is uncommitted globe work in the working tree (`src/ui/WorldGlobe.tsx`, `WorldMap.tsx`, `src/game/atlas.ts`, `scanTerritories.ts`, `globeLabels.ts`, `geography.ts`, `sectorOutlines.ts`, `tokens.ts`, `ui.css`). It has no story ID or acceptance criteria. It is out of scope for the sprint 2 sign-off.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Active dev time | Throughput |
|--------|---------|-----------|------|-----------------|------------|
| 1 | 12.0 sheet-days | 14.0 sheet-days | 117% | 5.8 h (7.7 h with 30-min gaps) | 1.8–2.4 sheet-days / h |
| 2 (current) | 8.5 sheet-days | 8.5 sheet-days | 100% | 2.7 h | 3.1 sheet-days / h |

Sprint 1's development window runs from 2026-10-09 23:37 to its last story commit (IF-011, 2026-10-12 15:00), with QA and the retro excluded. The sprint 2 window is 2026-10-12 23:31 to 2026-10-13 21:04.

**Trend**: Increasing. Throughput rose from 1.8–2.4 to 3.1 sheet-days per active hour.
Completion rate (117% → 100%) is not a velocity measure here: both sprints finished all their scope within a few hours. A "sheet-day" is not a day of work. At sprint 2's pace one sheet-day took about 19 minutes. Against an 8-hour day, the plan was about 25× larger than the work it described.

### What Went Well
- All 11 stories are Complete. QA sign-off is APPROVED WITH CONDITIONS with no S1/S2 bugs and no bugs filed.
- The suite grew from 705 tests (sprint 1, 41 files) to 770 tests (42 files), and all 770 pass at `41febe7`. `npm run build` exits 0.
- Smoke check PASS at `41febe7` (10/10 critical paths). The QA cycle re-ran the tests and the UI click-through on a clean checkout of `41febe7`, so the result did not depend on the dirty working tree.
- Sprint 2 was planned using sprint 1's retro: `sprint-002.md` carries a calibration note and sizes the plan against measured pace. No story was blocked (every `blocker` in `sprint-status.yaml` is empty) and no dependency sat outside the sprint.
- Technical debt markers are still 0 TODO, 0 FIXME, 0 HACK.

### What Went Poorly
- The estimates were again far larger than the effort. The sprint was sized at 8.5 sheet-days against 8 available days, and it took 2.7 active hours, finishing 10 days before the window opens. The plan's calibration note predicted "about a day and a half" from sprint 1's "about 2 working days". Sprint 1 itself took 5.8–7.7 active hours, so the calibration started from a wrong baseline.
- Most stories were verification only. WN-008, 009, 010, 011, 013 and 018 each state in their Completion Notes that the behaviour already existed and the story added tests or evidence only (WN-019 was a parameter rename plus tests). They were estimated as implementation work.
- Uncommitted work accumulated during the sprint. At QA time the working tree held the globe work plus untracked QA evidence (`git status` showed 45 entries). The smoke report said "no source changes" but the tree had moved on after it was written. QA had to stop and ask which build to sign off on, and re-run the smoke build checks on a clean worktree.
- Story bookkeeping drifted: WN-014's file is marked Complete but its acceptance-criteria boxes are unticked, and the five evidence files' sign-off rows are unchecked.
- Two open questions stayed open at close: the failed-state copy `REQUIRES INTEL LVL 1` (WN-018) and the TR-world-network-009 registry text vs the story citation (`production/session-state/active.md`).
- Process note: the qa-tester subagent hit its turn limit before writing any test-case file and had to be resumed.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None recorded | -- | -- | -- |

No story has `status: blocked`. The one QA decision point (which build to sign off on) was resolved at the Phase 2 gate and is under What Went Poorly.

### Estimation Accuracy

Per-story actuals below are **approximate**. Each one is the time from the previous commit, or from the start of the session, to that story's commit, assuming the stories were worked one at a time.

| Task | Estimated | Actual (approx.) | Variance | Likely Cause |
|------|-----------|------------------|----------|--------------|
| WN-018 Campaign banners (most overestimated) | 1.0 sheet-day | ~6 min | ~80× | The banners and flags already existed from IF-011; tests and evidence only |
| WN-017 Opening desk (least overestimated) | 1.0 sheet-day | ~46 min | ~10× | Real click-through plus a new mission playbook doc |
| WN-005, WN-008 | 0.5 + 1.0 | ~4 min together | -- | Unreliable: both were committed 3–4 min after the first logged activity, so their work may come before the session logs |
| Sprint total | 8.5 sheet-days | 2.7 h | ~25× at 8 h/day | 6 of 11 stories were verification only (see What Went Poorly) |

**Overall estimation accuracy**: 0 of 11 stories were within ±20% of their estimate. Every estimate was over by roughly 10× to 80×.
The estimates are consistently over across story types. Verification-only stories (6–25 min each) are over by the most; stories with a real click-through or a source change (WN-014 ~11 min, WN-019 ~37 min, WN-017 ~46 min) by the least.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| None | -- | 0 | -- | -- |

Nothing carries out of sprint 2. Every story in `sprint-status.yaml` is done.

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable, clean (counted with `grep -w` over `src/` and `scripts/`)
- Concern: the globe work has no unit coverage for the Scan contract filtering that now lives in `WorldMap.tsx` (raised by the qa-lead in the sprint 2 strategy; I did not verify the coverage myself).

### Previous Action Items Follow-Up

| Action Item (from Sprint 1) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Plan sprint 2 with `/sprint-plan new`, sized from measured pace | Done, from the wrong baseline | Plan committed 2026-10-12 (`3ae6996`) with a calibration note. The note used sprint 1's retro figure of "about 2 working days", but sprint 1 measures 5.8–7.7 active hours. Sprint 2 took 2.7 h for 8.5 sheet-days. |
| 2. Record actual days per story so estimation accuracy can be measured | Not Started | `grep` for `actual_days` / "actual days" in the epics, yaml and sprint files finds nothing. This retro rebuilt approximate actuals from commit and session timestamps instead. |
| 3. At plan time, pull any story's unplanned dependency into the same sprint | Done | No sprint 2 story was blocked and no story depended on one outside the sprint. |
| 4. File the `taxPaid: 0` key leak with `/bug-report` | Not Started | `production/qa/bugs/` does not exist. `grep` finds `taxPaid: 0` at `src/state/worldStore.ts:376`; the sprint 1 retro cited line 913, and I did not re-check whether line 376 is the same leak. |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Commit or branch the globe work and the sprint 2 QA artifacts, so the next smoke check runs against a tree that matches a commit. Give the globe a story with acceptance criteria and unit coverage for its Scan filtering. | Marco | High | Before `/sprint-plan new` |
| 2 | When estimating, check whether the behaviour already exists. Plan verification-only stories (tests and evidence) at a smaller estimate than implementation stories. | Marco | High | At sprint 3 planning |
| 3 | Record actual time per story at close-out in hours, not days (carried from sprint 1, never started). Size sprint 3 against ~3 sheet-days per active hour, or re-base estimates in hours. | Marco | High | Sprint 3 start |
| 4 | Decide the WN-018 failed-state copy and the TR-world-network-009 registry text, then file a story or bug if either needs a change. | Marco | Med | 2026-10-20 |
| 5 | Close the QA sign-off conditions: review and tick the five evidence sign-off rows, tick WN-014's acceptance-criteria boxes, and file the `taxPaid` bug. | Marco | Low | 2026-10-22 |

### Process Improvements
- Run the smoke check against a commit, not the working tree, or record the tree state in the report. A "no source changes" line is only true at the moment it is written.
- Size the plan to the delivered pace. Two sprints in a row finished in under 8 active hours against a 10-working-day window. Either estimate in hours or shorten the window; a two-week window with sheet-day estimates does not describe this work.

### Summary
Sprint 2 delivered all 11 stories in about 2.7 active hours. It has 770 passing tests and a QA sign-off of APPROVED WITH CONDITIONS with no bugs. Throughput rose from 1.8–2.4 to 3.1 sheet-days per active hour. The estimates were about 25× the work, partly because most stories only added tests and evidence for behaviour that already existed. The most important change is planning: measure actual time in hours and size the next sprint from that, not from sheet-days or calendar spans.
