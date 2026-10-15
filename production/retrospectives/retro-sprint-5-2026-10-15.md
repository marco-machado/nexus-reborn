## Retrospective: Sprint 5 (closed early)
Period: 2026-10-15 -- 2026-10-28 (planned window). Work ran 2026-10-14 21:48 -- 2026-10-15 00:25: planning and ADR-0021 clean-up 21:48 -- 22:04, story commits 22:29 -- 00:00, smoke 00:10, QA sign-off 00:25. Closed with the whole window ahead of it, for the second sprint running.
Generated: 2026-10-15

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-005.md`, `production/retrospectives/retro-sprint-4-2026-10-14.md`, `production/qa/qa-signoff-sprint-005-2026-10-15.md`, `production/qa/smoke-2026-10-15-sprint-005.md`, the 20 Research story files, `git log` and `git show --stat` for `5eba690..4997e27`, `grep -w` of `src/` and `scripts/`, and the Claude Code session logs for this project.

**Input check**: sprint plan FOUND, sprint-status.yaml FOUND, previous retro FOUND, QA sign-off FOUND, smoke report FOUND, story files FOUND, git history FOUND. Per-story actual time ABSENT (the yaml field was dropped on purpose, see Previous Action Items), so Estimation Accuracy is a commit-interval proxy. `production/qa/bugs/` does not exist. I did not re-run the suite for this retro: 1,045/1,045 is from the smoke run (`f2c2cc7`); only docs were committed after it.

**How time is measured**: same two readings as the sprint 4 retro.
- *Commit window*: first story commit 22:29 to last story commit 00:00 = 91 min (97 min from the 22:23 workflow start). Twenty story commits landed in it, with a stop and resume at RS-017 inside it.
- *Main-session active time*: message-timestamp union, gaps over 15 min treated as idle, from 2026-10-14 20:41 (after the sprint 4 retro commit) to 00:30: 1.3 h (1.9 h at a 30 min gap). That also holds the Sprint 5 plan, QA plan, the ADR-0021 fix, the smoke run, the QA sign-off and this retro's own set-up, so it is not comparable to a development-only figure. The main session logged almost nothing between 22:26 and 23:43 while the stories landed, which fits the stories running in the `implement-stories` workflow.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 20 | 20 | 0 |
| Completion Rate | -- | 100% (20/20 done) | -- |
| Effort (estimate sheet-days) | 5.1 | 5.1 completed | 0 |
| Retro tasks (R-1, R-3, R-5) | 3 | 2 done, 1 not started | -1 |
| Story commit window | 8 days available | 91--97 min | -- |
| Bugs Found | -- | 0 filed | -- |
| Bugs Fixed | -- | 0 filed; 1 ADR drift fixed (`d6e5c62`) | -- |
| Unplanned Tasks Added | -- | 0 stories; 3 unplanned changes (below) | -- |
| Commits | -- | 27 (`5eba690..4997e27`): 20 story, 1 acceptance-criterion add, plan, QA plan, review record, ADR fix, smoke, sign-off | -- |

Planned = 6 Must Have (1.2 d) + 6 Should Have (2.0 d) + 8 Nice to Have (1.9 d) = 5.1 d, plus 0.7 d of retro tasks, 2.2 d under the 8 d available line.

**Bugs**: none on file; the sign-off reports none. That is "no bug records", not a verified-clean register.

**Unplanned work** (none was a story in `sprint-status.yaml`): `d6e5c62` stored `collateral` and `netPayout` on the priced outcome (ADR-0021 drift found by the EC-022 review; 13 files, +9 tests) together with the review's suggestions; `0bb7c15` added a third acceptance criterion to RS-017 after `/story-readiness` stopped the workflow on it; `706089e` carried a 6-line source change in `src/state/debrief.ts` for RS-010, a story the plan could not size.

**Source changes**: 14 of 20 stories changed only test files. Six changed source in their own commits: RS-003 (`appStore.ts`, 20 lines), RS-005 (`appStore.ts` 44, `researchStore.ts` 29, `Research.tsx` 26, `research.ts` 1), RS-006 (`appStore.ts` 12), RS-009 (7 files: `remainingPaint.ts`, `RemainingLabel.tsx`, `researchStore.ts`, `research.ts`, `save.ts`, `Research.tsx`, `ui.css`), RS-010 (`debrief.ts` 6) and RS-011 (`researchStore.ts` 24). The suite grew from 921 tests (sprint 4 close) to 930 (ADR-0021 fix) to 1,045: +124 over the two steps.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Active dev time | Throughput |
|--------|---------|-----------|------|-----------------|------------|
| 1 | 12.0 sheet-days | 14.0 sheet-days | 117% | 5.8 h (7.7 h with 30-min gaps) | 1.8--2.4 sheet-days / h |
| 2 | 8.5 sheet-days | 8.5 sheet-days | 100% | 2.7 h | 3.1 sheet-days / h |
| 3 | 8.0 sheet-days | 8.0 sheet-days | 100% | 0.4--0.6 h | 13--20 sheet-days / h |
| 4 | 6.7 sheet-days | 6.7 sheet-days | 100% | 77--83 min commit window | 4.9--5.2 sheet-days / h |
| 5 (current) | 5.1 sheet-days | 5.1 sheet-days | 100% | 91--97 min commit window | 3.2--3.4 sheet-days / h |

**Trend**: Lower than sprint 4 (about a third), by the same commit-window method, so the two are comparable. Likely cause: 6 of 20 stories needed source changes (3 of 12 in sprint 4), one of them a 7-file UI story, and the RS-017 stop and resume sits inside the window. Sprint 3's figure used a different method and is a direction only. Completion rate is again not a velocity measure: all scope finished.

### What Went Well
- All 20 stories Complete, including all 8 Nice to Have, and the Research epic is closed. QA sign-off is APPROVED WITH CONDITIONS with no S1/S2 bugs; smoke passed 9/9 in headed Chrome; 1,045 tests pass.
- The planning code check worked: all 11 stories sized "probably test-only" were test-only, all five stories marked "source change" needed one (RS-003, 005, 006, 009, 011), and RS-012 (conditional on RS-011) needed none. The two "unknown" stories split: RS-020 test-only, RS-010 a 6-line source fix.
- The readiness gate earned its place: `/story-readiness` stopped RS-017 for having 2 acceptance criteria where an Integration story needs 3, and the fix took one commit (`0bb7c15`) before the run resumed at the next commit.
- The EC-022 review follow-up landed first (`d6e5c62`): stored collateral and net payout now match ADR-0021, with the helper `isPaid` and 9 tests, before any Research story started.
- Both Sprint 4 QA conditions closed: condition 2 by the specialist review (`57e0c94`), condition 1 by the smoke run's real loss Debrief (`4997e27`). The authorize-home question (R-5) was decided and written into `research.md` and the stories before RS-002 began.
- The smoke run found nothing wrong but proved more than the unit tests could: the remaining label disappears when `t` moves without a sync and returns after the clock's next sync (`probe-remaining.json`), and a forced mid-mission completion left all four agents' stats unchanged.

### What Went Poorly
- **Specialist code review did not run on the Research stories.** The workflow's subagent has no Agent tool, so `/code-review` returned NOT ASSESSED for the specialist gate. I read the Code Review notes of RS-002, 006, 009, 012, 013, 016 and 017 and each says so; a text match finds the same language in all 20 story files, but I did not read the other 13 in full. This is the same gap as EC-022, which needed a separate re-run to close. The six source-changing stories (RS-003, 005, 006, 009, 010, 011) are the ones that most need it.
- **RS-009's manual evidence is thinner than the plan said.** The QA plan asked for Playwright screenshots at 1280x720 in `production/qa/evidence/sprint-005/`; the two screenshots sit in `production/qa/evidence/rs-009/` at 800x450 scale, and two of the four manual lines are covered by a static-markup test rather than the live run. The sign-off lists the sign-off and format conditions but not the scale or the location.
- **The frame spike recurred a third time and still has no bug file.** One 250 ms World Network frame in this smoke run (181 ms sprint 3, 206 ms sprint 4). The windows differ, so it is not a trend, but the retro-4 action to file a report is not started and its deadline is 2026-10-21.
- Actual time per story remains unrecorded; the yaml field was dropped, so this retro only has commit gaps.
- The sprint plan's Definition of Done is unticked again (0 of 9 in `sprint-005.md`, 0 of 9 in `sprint-004.md`).
- The two 8-minute stories (RS-005, RS-009) and the 3--6 minute rest sit far below any day-based estimate, so the plan is still sized in days for work measured in minutes.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None: no story has `status: blocked` or a `blocker` value in `production/sprint-status.yaml` | -- | -- | -- |
| (Friction, not a blocker) RS-017 stopped at readiness: 2 acceptance criteria, 3 required for Integration | Under 10 min between the stop and RS-017's commit (23:42 -> 23:48, not measured as work time) | Third criterion added (`0bb7c15`), workflow resumed | `/create-stories` should check the Integration minimum when it writes stories |

### Estimation Accuracy

Per-story actual time is ABSENT, so accuracy against the sheet cannot be computed (0 of 20 verifiable). Commit-to-commit gaps are the nearest proxy:

| Task | Estimated | Commit gap (proxy) | Variance | Likely Cause |
|------|-----------|--------------------|----------|--------------|
| RS-005 Refusal text | 0.5 d | about 8 min (4 source files, +100 lines) | far over | Largest source story, still minutes |
| RS-009 Remaining label | 0.5 d | about 8 min (7 files, UI, 2 screenshots) | far over | New oracle, store field, label and CSS in one commit |
| RS-003 Authorize undo | 0.5 d | about 5 min | far over | One 20-line change in `appStore.ts` |
| RS-001 Catalog and gap | 0.1 d | about 6 min from the workflow start | not comparable | Tests only; a day-based 0.1 d size cannot be checked against minutes |
| RS-017 Freeze (stopped at readiness) | 0.2 d | 5--6 min after resume | not meaningful | Test-only; the stop is the delay |

**Overall estimation accuracy**: NOT ASSESSED -- NO DATA for the within +/- 20% measure.

[Analysis: the planning rule (check `src/`, size test-only work at 0.1 d) predicted which stories needed code very well, so keep it. What it cannot do is convert days to time: even the 0.5 d source stories took about 8 minutes of commit time. Sizing in days still has no tie to the measured work, and nobody records the per-story time that would fix it.]

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| None | -- | 0 | -- | -- |

Nothing carries out of sprint 5. Retro task R-3 (frame-spike bug report and profile, due 2026-10-21) was a retro task, not a story; it carries as an action item below. The Research epic has no Ready story left (20 of 20 Complete).

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable, clean (counted with `grep -w` over `src/` and `scripts/`)
- Concerns: the World Network frame spike (cause unknown, one frame each time); RS-009's `H:MM:SS` paint format hard-coded ahead of a Research screen spec (`design/ux/interaction-patterns.md` P-22 says not to); two `rs-remaining` elements share one test id; the Chance UI for RS-020 has never been checked on screen; `/code-review` specialist gate not run on any Research story.

### Previous Action Items Follow-Up

| Action Item (from Sprint 4) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Close the two Sprint 4 QA conditions (real Debrief walk; EC-022 specialist review) | Done | Condition 2 by the specialist re-run (`57e0c94`, then the fixes in `d6e5c62`); condition 1 by this sprint's smoke run (`4997e27`). |
| 2. Decide the time-tracking carry; drop the yaml field and use commit intervals | Done | Dropped in `sprint-005.md`; this retro uses commit intervals and the session logs. Per-story minutes still do not exist. |
| 3. File `/bug-report` and `/perf-profile` for the World Network frame spike (due 2026-10-21) | Not Started | Deadline not reached. `production/qa/bugs/` does not exist; the spike recurred at 250 ms. |
| 4. Plan Sprint 5 from a different epic with a code check and 0.1 d sizing | Done | Research, 20 stories, checked against `src/`; the call held (see What Went Well). |
| 5. Clear the carried doc items: Rule 3 home, EC-008 pointer, Definition of Done | Partly done | Rule 3 and the EC-008 pointer fixed in `0b12769`. Definition of Done: 0 of 9 ticked in both `sprint-004.md` and `sprint-005.md`. |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Run the specialist `/code-review` from the main session on the six source-changing Research stories (RS-003, 005, 006, 009, 010, 011), or change `implement-stories` so its review step can spawn agents. Re-record each story's verdict. | Marco | High | Before Sprint 6's first story |
| 2 | File `/bug-report` and run `/perf-profile` on the World Network screen for the 181 / 206 / 250 ms single-frame spike, with a trace (not a full-loop run). Second carry. | Marco | High | 2026-10-21 |
| 3 | Close the Sprint 5 QA conditions: lead-programmer sign-off on `rs-009-evidence.md`; decide the remaining-time format against P-22 and write the Research screen spec line; give the two `rs-remaining` elements unique test ids; re-take the RS-009 screenshots at 1280x720 in `production/qa/evidence/sprint-005/`. | Marco | Med | 2026-10-22 |
| 4 | Plan Sprint 6 from a remaining epic (Persistence 18, Roster 23, Tactical 16, Interface 10, Audio 7 Ready stories). Check each story against `src/`, add an on-screen RS-020 Chance check to the smoke scope, and decide whether `/create-stories` enforces the Integration minimum of 3 acceptance criteria. | Marco | High | At `/sprint-plan new` |
| 5 | Drop the Definition of Done checklist from the sprint plan template, or tick it at `/team-qa`. Third sprint it is unticked. | Marco | Low | 2026-10-24 |

### Process Improvements
- Keep code review in the main session. A workflow subagent cannot spawn the specialists, so its `/code-review` can never exceed NOT ASSESSED; either run the review step from the main session or accept in the plan that review is a separate pass.
- Record the story's evidence against the plan's own lines at `/story-done`. RS-009 closed with its manual lines covered by a different test and screenshots in another folder at another scale; a plan-vs-evidence check there would have surfaced it before sign-off.

### Summary
Sprint 5 delivered all 20 Research stories, closing the epic, in about 91--97 minutes of commits with 1,045 tests passing and a QA sign-off of APPROVED WITH CONDITIONS. The planning code check and the readiness gate both worked. The weak spots are review and evidence: the specialist code review never ran on any Research story, RS-009's screenshots are thinner than planned, and the frame spike still has no bug file. The most important change is to run code review where it can spawn specialists, starting with the six stories that changed source.
