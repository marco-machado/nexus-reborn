## Retrospective: Sprint 9 (Interface and Audio, final sprint)
Period: 2026-10-17 -- 2026-10-28 (retrospective taken 2026-10-19, after the QA sign-off)
Generated: 2026-10-19

Sources: `production/sprints/sprint-009.md`, `production/sprint-status.yaml`, `git log 89a5196..HEAD` (35 commits), `production/qa/qa-signoff-sprint-009-2026-10-19.md` (NOT APPROVED) and `-r2.md` (APPROVED WITH CONDITIONS), `production/qa/bugs/`, `production/retrospectives/retro-sprint-8-2026-10-16.md`.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 17 | 17 `done` | 0 |
| Completion Rate | -- | 100% (8/8 Must, 6/6 Should, 3/3 Nice) | -- |
| Effort (sheet-days) | 5.5 | 5.5 | 0 |
| Retro tasks (R-1 to R-7) | 7 | 3 done (R-1, R-2, R-3); 4 not started, none past deadline yet | -- |
| Bugs Found | -- | 3 (BUG-0001 S3, BUG-0002 S3, BUG-0003 S4), all by `/team-qa` | -- |
| Bugs Fixed | -- | 2 (BUG-0001, BUG-0002: fixed, verified, closed); BUG-0003 open S4/P3 | -- |
| Unplanned Tasks Added | -- | 4: the two bug fixes; IF-002 rework (two art-director review rounds, 0548369, and the focus-bracket fix, 9272df9); a second `/team-qa` cycle | -- |
| Commits | -- | 35 since the plan commit (89a5196) | -- |

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 7 | 3.8 sheet-days | 3.8 sheet-days | 100% | 134 min (23 stories) | 10.3 stories / h (reviews outside the window) |
| 8 | 3.5 sheet-days | 3.5 sheet-days | 100% | 235 min (16 stories) | ~4.1 stories / h |
| 9 (current) | 5.5 sheet-days | 5.5 sheet-days | 100% | 177 min (17 stories, IF-001 01:38 to AU-007 04:35 on 10-17) | ~5.8 stories / h, ~1.9 sheet-days / h |

**Trend**: completion stable at 100%; throughput up for the first time in four sprints.
The window is comparable with Sprint 8 (in-story review on both). It covers the automated part only: the four Visual/Feel stories were committed In Review (7e076da) and closed on 10-18 and 10-19 after the user's listening pass and lead sign-offs, about 16 to 21 hours later.

### What Went Well
- R-1 landed before the first story (2c67e1b), and two more workflow fixes followed mid-run (8b7816e up to three fix rounds; 7e076da commit sign-off stories as In Review). The 17-story run finished in 177 min with no recorded resume, against about 4 resumes in Sprint 8.
- R-2 topped up the five short stories in the plan commit, and the plan recorded a readiness row per story (retro 8 action 2). No story stopped at `/story-readiness`.
- R-3 closed on its sixth carry (0c49390), with the frame data in the smoke record.
- QA found real defects and the loop closed the same day: NOT APPROVED at 11:16, both P1 fixes by 11:32, re-run APPROVED WITH CONDITIONS at 13:58, bugs verified and closed by 13:59.
- The re-run reused the retained probe scripts (copied into a new evidence folder), so the second QA cycle cost one session, not a rewrite.
- TODO/FIXME/HACK stayed at zero.

### What Went Poorly
- **Three stories closed with ticked criteria that QA then failed.** IF-008 AC11 (BUG-0001) was predicted by the story's own review as advisory 4, found by code trace and never run. IF-005 AC19 (BUG-0002) was ticked on evidence that exercised only Settings opened from pause, not from the Menu. IF-001 AC20 was ticked on a click-through record that omitted two steps. Cost: one NOT APPROVED cycle, two unplanned fixes and a second QA run.
- **The 1280×720 capture rule slipped again.** The plan named it as the top risk (TM-015). AU-002, AU-004 and AU-007 screenshots are 800×788 or 800×600 from the in-app pane; the user accepted them as staging evidence only.
- **Visual/Feel rework.** IF-002 needed two art-director review rounds and a focus-bracket fix on 10-18 after it was first committed.
- **Retro tasks R-4, R-5, R-6 and R-7 have not started.** R-4 (Sprint 7 conditions) and R-5 (Sprint 5 conditions, template DoD, evidence-path rule) are on their third and fourth carries. There is no later sprint.

### Blockers Encountered

No story was `blocked` in `production/sprint-status.yaml`.

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| Visual/Feel stories (IF-002, AU-002, AU-004, AU-007) waiting on a person's listening pass and sign-off | ~16 to 21 h (In Review 10-17 04:18; closed 10-18 19:22 to 10-19 01:22) | User listened and signed; stories closed | Expected by the plan (risk row); schedule the sign-off session up front, as done |
| First `/team-qa` NOT APPROVED (IF-005 AC19 failed with no documented workaround) | ~2.7 h (11:16 to 13:58 on 10-19) | BUG-0001 and BUG-0002 fixed; IF-001 record amended; re-run | Action 1 below |

### Estimation Accuracy

Sheet-days do not measure the work (retro 8); every story closed inside its sheet estimate in the automated window. The useful signals:

| Task | Estimated | Actual | Variance | Likely Cause |
|------|-----------|--------|----------|--------------|
| IF-002 | 0.4 d | Run-time plus two review rounds and a fix on 10-18 | Over | Visual/Feel acceptance is a lead judgement; the code check at planning said "may need source changes" |
| IF-005 / IF-008 / IF-001 | 0.3 / 0.3 / 0.5 d | Plus a bug fix or record amendment and a QA re-run each | Over | Evidence that missed an entry point or a step, not sizing |

**Overall estimation accuracy**: NOT ASSESSED — NO DATA on per-story actual effort; the sheet totals match by construction (5.5/5.5).
The planning rule (0.2--0.5 d per UI story, evidence as the cost driver) held for the automated part. The overrun sits in evidence completeness and human sign-off, not in code.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| Stories | -- | 0 | All 17 `done` | -- |
| R-4 Sprint 7 QA conditions | Sprint 7 | 3 | Not started | Complete or drop in writing by 2026-10-22 |
| R-5 Sprint 5 conditions, template DoD, evidence-path rule | Sprint 5/6 | 4 | Not started | Complete or drop in writing by 2026-10-24 |
| R-6 GDD Open Question 3 (gunfire vs Devices) | Sprint 8 | 1 | Not started; no `design/gdd` commit on it | Decide by 2026-10-28 |
| R-7 TM-002 / TM-008 criteria boxes | Sprint 8 | 1 | Not started; boxes still `[ ]` (TM-002 1c/1e/5d, TM-008 9a/9b/9c) | Tick or write why by 2026-10-21 |

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: stable at zero (`grep -rnw` over `src/**/*.ts(x)`).
- Debt outside comments, from the QA sign-offs: weak (cannot-fail) asserts in 7 Sprint 9 stories' reviews, not logged; IF-008 camera-freeze has no failing-capable test; BUG-0002's regression check is manual only (no DOM test environment); the BUG-0001 guard makes Space owned by any focused INPUT/SELECT/TEXTAREA in a dialog, untested for future fields. `/tech-debt` was not run.

### Previous Action Items Follow-Up

| Action Item (from Sprint 8) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Port session-script fixes into `implement-stories.js` | Done | 2c67e1b, extended by 8b7816e and 7e076da |
| 2. Readiness verdict per story at planning; top up short stories | Done | Plan readiness table; top-ups in 89a5196 |
| 3. Close R-3; decide R-2 and R-4 the same way | Partly | R-3 closed (0c49390). The old R-2/R-4 are now R-4/R-5, not started |
| 4. Game-designer decision on OQ3 | Not Started | R-6, due 2026-10-28 |
| 5. Tick TM-002 and TM-008 boxes | Not Started | R-7, due 2026-10-21 |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Before `/story-done` ticks a criterion, its evidence must cover every entry point and step the criterion names (e.g. Settings from Menu and from pause), and any review advisory that predicts a criterion failure must be run, not traced. Done = the rule is in the story-done checklist or the dev-story brief. | Marco | High | Before the next story is closed |
| 2 | Close R-4, R-5, R-6 and R-7 by their deadlines, or drop each in writing. Done = none is open at sprint end. | Marco | High | 2026-10-21 to 2026-10-28 |
| 3 | Get rulings on the open design questions: Space on a focused toast Dismiss button, the toast count (9 built vs 8 in the spec), the IF-001 AC1 overlay list, BUG-0003 placement. Done = each answered in the GDD, or a bug filed. | Marco (game-designer / ux-designer) | Med | 2026-10-28 |
| 4 | Capture Visual/Feel sign-off screenshots with headless Playwright at 1280×720, never the in-app pane. Done = the next sign-off's captures are 1280×720. | Marco | Med | Next Visual/Feel sign-off |

### Process Improvements
- Treat a review advisory that names a criterion as a test to run before close, not a note.
- Write evidence per entry point: one capture or probe row for each way a screen opens.

### Summary
A good sprint by output: all 17 stories done, throughput back up, and the workflow fixes from retro 8 removed the resumes. The cost moved to evidence completeness: three ticked criteria failed in QA and needed a second cycle the same day. The single most important change is action 1: a criterion is ticked only on evidence that covers every path it names.
