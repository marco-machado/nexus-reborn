## Retrospective: Sprint 8 — Tactical mission rules
Period: 2026-10-16 -- 2026-10-28 (planned). All stories were done on 2026-10-16: the plan was committed at 13:39 and the QA record at 18:28.
Generated: 2026-10-16

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 16 | 16 | 0 |
| Completion Rate | -- | 100% | -- |
| Story Points / Effort Days | 3.5 sheet-days | 3.5 sheet-days | 0 |
| Retro tasks (R-1 to R-6) | 6 | 3 done (R-1, R-5, R-6) | -3 (R-2, R-3, R-4 not started) |
| Bugs Found | -- | 0 filed (`production/qa/bugs/` does not exist) | -- |
| Bugs Fixed | -- | 0 | -- |
| Unplanned Tasks Added | -- | 5 (listed below the table) | -- |
| Commits | -- | 23 (`187ab8c` to `37cbda1`) | -- |
| Tests | 1,278 (Sprint 7 close) | 1,395 in 51 files | +117 |

The 5 unplanned tasks:
- A third criterion for TM-011 and TM-012 (`3dda262`).
- The TM-015 review fix pass.
- qa-tester `maxTurns` raised from 10 to 20 (`b5f75d2`).
- Two edits to the implement-stories run script: a qa-tester retry and an `allowDirty` option.
- An accidental TM-011 re-review (`dc821ab`).

QA: smoke PASS (`smoke-2026-10-16-sprint-008.md`). Sign-off APPROVED WITH CONDITIONS (`qa-signoff-sprint-008-2026-10-16.md`), with no S1–S4 bug and no failed story.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 6 | 4.2 sheet-days | 4.2 sheet-days | 100% | 101 min (17 stories) + PV-018 | ~2.2 sheet-days / h |
| 7 | 3.8 sheet-days | 3.8 sheet-days | 100% | 134 min (23 stories) | ~1.7 sheet-days / h, 10.3 stories / h |
| 8 (current) | 3.5 sheet-days | 3.5 sheet-days | 100% | 235 min (16 stories, TM-001 13:52 to TM-016 17:47) | ~0.9 sheet-days / h, ~4.1 stories / h |

**Trend**: completion is stable at 100%; throughput fell for the fourth sprint running.
The wall-clock window now includes the in-story specialist review and mutation check that R-1 added, and four workflow stops waiting on a decision (listed under Blockers). Sprint 7 ran its reviews after the stories closed, outside its window. So stories per hour is not comparable across the R-1 change. The 235 min buys reviewed stories, where Sprint 7's 134 min did not.

### What Went Well
- **All 16 stories closed, and the Tactical mission epic is done.** It was the last Feature-layer epic. QA came back APPROVED WITH CONDITIONS with no bug and no failed story. The suite grew by 117 tests to 1,395, and build and lint are clean.
- **R-1 worked as designed.** Every story closed with a named specialist review (lead-programmer, qa-tester, plus gameplay-programmer on `src/game/`) and a recorded mutation check.
  - The gate stopped a real problem. TM-015's first review returned CHANGES REQUIRED: a new `CameraPose` module that ADR-0016 forbids, an untested sight-confirm ×1.15, and evidence captured at 800×600. The fix pass resolved all three before the story could close.
  - In Sprint 7 the same kinds of defects surfaced only after 23 stories had already closed.
- **The source-change forecast was right for 13 of 16 stories.** The code check at planning called TM-011 a source change (`hitChance` was extracted in `c643725`) and flagged TM-001's test seam (`9cec62f`). It missed TM-002, TM-003 and TM-005, whose source changes the QA plan's findings 1 and 2 had already named.
- **Smoke ran once and covered all 9 items.** The Sprint 7 improvement held: the plan named which items could use a labelled fixture. Items 4 and 7 ran on fixtures F1 and F2 and passed in the first report, so no second smoke or sign-off was needed. That run also produced the first frame numbers taken inside a mission, with 0 frames over 50 ms.

### What Went Poorly
- **qa-tester failed to return on the first attempt in most reviews.** It hit `maxTurns: 10` while running its own probe tests.
  - The run stopped at TM-007, TM-008 and TM-014 with review NOT ASSESSED.
  - A retry with a read-only prompt fixed TM-008 to TM-013 but not TM-014.
  - Raising `maxTurns` to 20 in `b5f75d2`, the same as lead-programmer, cleared it.
  - About 4 resumes and the qa-lead/user decisions between them account for much of the 235 min window.
- **Readiness caught 2-criterion Logic stories mid-run.** R-5 topped up only the three Integration stories. TM-011 and TM-012, both Logic stories with 2 criteria, stopped the run at readiness, and `3dda262` was written mid-sprint. Planning never ran `/story-readiness` across the sprint, which would have caught both before TM-001.
- **A workflow resume re-ran a story that was already closed.** Resume replays only the unchanged prefix of agent calls. TM-011's first qa-tester attempt had failed and was not cached, so the resume re-ran TM-011's review, story-done and commit. That produced the docs-only `dc821ab` and stopped on the dirty tree before reaching TM-014. A fresh run with an explicit story list and `allowDirty` was the recovery.
- **The workflow fixes exist only in this session's script.** `.claude/workflows/implement-stories.js` in the repo has neither the qa-tester retry nor `allowDirty`, so the next sprint's run starts without them.
- **Three Sprint 7 retro actions were not started**: R-2 (Sprint 7 QA conditions), R-3 (frame spike) and R-4 (Sprint 5 conditions and the template's Definition of Done). R-3 is now on its sixth carry.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| Dirty working tree stopped the run's preflight (uncommitted R-5 edits; later TM-014 work plus `qa-tester.md`) | 2 stops | Committed `4cfdba5`; later committed `b5f75d2` alone and ran fresh with `allowDirty` | Commit planning edits before the first run; put `allowDirty` in the repo workflow |
| qa-tester returned no findings (`maxTurns: 10`), review NOT ASSESSED | 3 stops (TM-007, TM-008, TM-014) | Retry with a read-only prompt, then `maxTurns: 20` (`b5f75d2`) | Kept by `b5f75d2`; port the retry to the repo workflow |
| TM-011 readiness: Logic story with 2 criteria (TM-012 likewise) | 1 stop | Third criterion for each (`3dda262`) | Run `/story-readiness` across all planned stories at planning |
| TM-015 review CHANGES REQUIRED, then manual evidence awaiting qa-lead sign-off | 1 stop | Fix pass in the run; qa-lead signed off the 1280×720 evidence; `/code-review` and `/story-done` closed it (`1f189ad`) | Brief dev-story with the ADR "do not add" lines and the plan's 1280×720 headless-capture rule |

No story had `status: blocked` in `production/sprint-status.yaml`.

### Estimation Accuracy

| Task | Estimated | Actual | Variance | Likely Cause |
|------|-----------|--------|----------|--------------|
| TM-015 | 0.3 d (sheet); 1.0 d (story file) | Heaviest story: review fix pass, 7 evidence shots, qa-lead sign-off | Under | Manual 1280×720 evidence and an ADR conflict that the sheet's "probably test-only" did not price |
| TM-016 | 0.1 d | ~4 min commit gap, one clean run | Over | Test-only, as forecast |

**Overall estimation accuracy**: NOT ASSESSED for the ±20% check. No per-story actual time was recorded, and commit gaps mix in the workflow stops, so they are not task times. The sheet's 3.5 d was done in about 4 wall-clock hours.

Sheet-days still do not measure the work, the same finding as Sprints 5–7. The useful forecasts are source change vs test-only (13 of 16 right) and "needs manual evidence", which was the real cost driver for TM-015.

### Carryover Analysis

No story carried over. The carried items are retro tasks:

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| R-3 World Network frame spike: close with numbers or file BUG-0001 | Sprint 3 (first noted) | 6 | Never scheduled against a story; the numbers now exist (Sprint 7 item 8 and Sprint 8 item 9: 0 frames over 50 ms in 13 runs) | Complete: write the closure at Sprint 9 planning |
| R-2 Sprint 7 QA conditions | Sprint 7 | 1 | Not started | Complete or explicitly drop each condition |
| R-4 Sprint 5 conditions update, template Definition of Done, evidence-path rule | Sprint 5 | 3 | Not started | Complete, or drop the parts nobody uses |

### Technical Debt Status
- TODO count: 0, as in Sprint 7.
- FIXME count: 0, as in Sprint 7.
- HACK count: 0, as in Sprint 7.
- Trend: stable at zero, counted with `grep -rnw` over `src/**/*.ts(x)`.
- Debt lives outside comments. Open items:
  - The advisory review findings recorded in each Sprint 8 story's Completion Notes. These are mostly test-strength items, for example R-5b in TM-015 recomputes the hit chance rather than reading the sim, and TM-011's seam test matches source text.
  - The `hitChance` constants are bare literals in `world.ts:201`.
  - TM-002 and TM-008 still have unticked acceptance-criteria boxes (QA condition 1).
- `/tech-debt` was not run.

### Previous Action Items Follow-Up

| Action Item (from Sprint 7) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Specialist review blocks `/story-done`; mutation check in Logic done criteria | Done | `36c8d82` (dev-story, story-done, implement-stories). It held in Sprint 8: TM-015 could not close on CHANGES REQUIRED |
| 2. Close the Sprint 7 QA conditions | Not Started | No conditions update in `qa-signoff-sprint-007-2026-10-16-r2.md` |
| 3. R-3 frame spike: close with numbers or file BUG-0001 | Not Started | Sixth carry. Sprint 8 smoke item 9 adds the in-mission numbers needed to close it |
| 4. Sprint 5 conditions update; template Definition of Done; evidence-path rule | Not Started | `.claude/docs/templates/sprint-plan.md` still has `## Definition of Done` (line 55) |
| 5. Commit the Sprint 7 QA record; story count from `sprint-status.yaml` | Done | `36a39e7`; the Sprint 8 plan takes its 16 from the yaml (R-6) |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Port the session-script fixes into `.claude/workflows/implement-stories.js`: one read-only qa-tester retry, the `allowDirty` option, and a note that resume replays only the unchanged prefix, so a resume after an uncached failure re-runs every later step. Done = the repo workflow has both options. | Marco | High | Before Sprint 9's first story |
| 2 | Run `/story-readiness` on every planned story during `/sprint-plan`, and top up any story under its type's criteria minimum before the run starts. Done = the Sprint 9 plan records a readiness verdict per story. | Marco | High | At `/sprint-plan new` |
| 3 | Close R-3 now: write the closure in the smoke record using Sprint 7 item 8 and Sprint 8 item 9 (0 frames over 50 ms in 13 runs), or file BUG-0001. Decide R-2 and R-4 the same way: do each condition or drop it in writing. Done = none of the three carries into Sprint 10. | Marco | High | At `/sprint-plan new` |
| 4 | Get a game-designer decision on GDD Open Question 3 (does gunfire damage Devices?). Smoke saw squad auto-fire destroy relay d2 while an explicit Attack on a Device is refused. Done = the GDD answers it, and a story or bug follows if the code disagrees. | Marco (game-designer) | Med | Before any Device story |
| 5 | QA condition 1: tick the TM-002 and TM-008 acceptance-criteria boxes, or record why not. | Marco | Low | 2026-10-21 |

### Process Improvements
- **Readiness at planning, not mid-run.** Both readiness stops in Sprints 7–8 were criteria-count gaps that one `/story-readiness` pass at planning would have found. Fold it into `/sprint-plan` for the whole sprint.
- **Keep workflow fixes in the repo.** A fix made to a session copy of a workflow is lost at the end of the session. Edit `.claude/workflows/` and commit, so the next run gets it.
- **Brief manual-evidence stories with the capture rule.** TM-015's first evidence was 800×600 from the in-app pane. The plan's 1280×720 requirement needs headless Playwright, so state that in the dev-story brief for any story with a manual half.

### Summary
A good sprint. All 16 stories and the last Feature-layer epic are closed, QA is APPROVED WITH CONDITIONS with no bugs, and the in-story review gate added in Sprint 7 caught a real ADR violation before close. The cost was wall-clock time lost to workflow stops: qa-tester turn limits, two readiness gaps and a resume that re-ran a closed story. The most important change is to move readiness checks to planning and commit the workflow fixes to the repo, so the next run does not stop for the same reasons.
