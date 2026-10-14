## Retrospective: Sprint 4 (closed early)
Period: 2026-10-15 -- 2026-10-28 (planned window). Work ran 2026-10-14: first story commit 14:28, last story commit 15:45, code-review fixes 18:50, owner decision and QA 20:35 -- 20:38. Closed one day before the window opens.
Generated: 2026-10-14

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-004.md`, `production/retrospectives/retro-sprint-3-2026-10-14.md`, `production/qa/qa-signoff-sprint-004-2026-10-14.md`, `production/qa/smoke-2026-10-14-sprint-004.md`, the 12 story files, `git log` / `git show --stat` for `35e3098..4d0b65b`, `grep -w` of `src/` and `scripts/`, and the Claude Code session logs for this project.

**Input check**: sprint plan FOUND, sprint-status.yaml FOUND, previous retro FOUND, QA sign-off FOUND, smoke report FOUND, story files FOUND, git history FOUND. Per-story actual time ABSENT (no story or yaml field records it), so Estimation Accuracy is a commit-interval proxy, not hours worked. No milestone file; `production/qa/bugs/` does not exist. I did not re-run the suite for this retro: 921/921 is from the QA sign-off run earlier today.

**How time is measured**: two readings, neither is hours worked per story.
- *Commit window*: first story commit 14:28 to last story commit 15:45 = 77 min (83 min if counted from the first logged session activity at 14:22). Twelve story commits landed in it. The main session logged almost nothing in that window, which fits the stories running in the `implement-stories` workflow; I did not verify that.
- *Main-session active time*: union of message timestamps in this project's session logs after 2026-10-14 01:31, gaps over 15 min treated as idle: 1.8 h (2.4 h at a 30 min gap). That span also holds the sprint 3 QA sign-off, planning, the code-review fixes, the smoke run, the owner decision and Sprint 4 QA, so it is not comparable to the development-only figures for sprints 1--3.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks | 12 | 12 | 0 |
| Completion Rate | -- | 100% (12/12 done) | -- |
| Effort (estimate sheet-days) | 6.7 | 6.7 completed | 0 |
| Story commit window | 10 days available | 77 min | -- |
| Bugs Found | -- | 0 filed (see below) | -- |
| Bugs Fixed | -- | 0 filed; 4 review findings fixed on EC-013; 1 owner decision implemented on EC-022 | -- |
| Unplanned Tasks Added | -- | 0 stories; 2 unplanned changes (below) | -- |
| Commits | -- | 17 (`35e3098..4d0b65b`): 12 story, 1 acceptance-criterion add, 1 review fix, 1 owner-decision change, 2 QA artifact | -- |

Planned = 5 Must Have (1.9 d) + 5 Should Have (3.0 d) + 2 Nice to Have (1.8 d) = 6.7 d, 1.3 d under the 8 d available line.

**Bugs**: none on file and none filed; the sign-off reports none. Review and QA did find work: `/code-review` on EC-013 found a `0 == 0` apply-key assertion, an unproven "abort after hits taken" edge, possible world leaks between tests and an overstated "none deferred" note, all fixed in `499ee72`. For EC-022 the review raised an owner question, below.

**Unplanned work**: no story added after the plan. Two changes were not in it: `15a374e` added a third acceptance criterion to EC-013, and `c85960c` implemented the owner's answer to the EC-022 question (muted `NOT APPLIED` tag on unpaid Collateral and bonus; `src/ui/debriefInvoice.ts` +21 lines, one CSS line, 3 tests, Economy GDD Closed Question 4 and an Interface GDD pointer), then the EC-022 screenshots were re-taken.

**Source changes**: 9 of 12 stories changed only test files. Three changed source in their own commits: EC-014 (`src/game/contracts.ts`, 29 changed lines: the Reward stamp), EC-018 (`contracts.ts`, 20 lines) and EC-022 (`src/ui/debriefInvoice.ts` 76, `src/ui/index.tsx` 38). The suite grew from 838 tests (43 files) to 921 (44 files), +83.

### Velocity Trend

| Sprint | Planned | Completed | Rate | Active dev time | Throughput |
|--------|---------|-----------|------|-----------------|------------|
| 1 | 12.0 sheet-days | 14.0 sheet-days | 117% | 5.8 h (7.7 h with 30-min gaps) | 1.8--2.4 sheet-days / h |
| 2 | 8.5 sheet-days | 8.5 sheet-days | 100% | 2.7 h | 3.1 sheet-days / h |
| 3 | 8.0 sheet-days | 8.0 sheet-days | 100% | 0.4--0.6 h | 13--20 sheet-days / h |
| 4 (current) | 6.7 sheet-days | 6.7 sheet-days | 100% | 77--83 min commit window | 4.9--5.2 sheet-days / h |

**Trend**: Lower than sprint 3, still far above sprints 1--2. The sprint 3 and sprint 4 figures use different methods (session-log segment vs commit window), so the drop from 13+ to about 5 is a direction, not a measurement.
Likely cause: sprint 4 had real code, two source stories among the generated-contract set and a UI story with screenshots, where sprint 3 was nearly all tests. Completion rate is again not a velocity measure: all scope finished, a day before its window.

### What Went Well
- All 12 stories Complete, including both Nice to Have. All 22 stories in the Economy and contracts epic are now Complete. QA sign-off is APPROVED WITH CONDITIONS (no S1/S2); the smoke check passed 9/9 items in a real browser run.
- The plan's calls held for the UI story: the QA plan flagged EC-022 as a code change, not a test-only story, because all four acceptance criteria failed on the old code. It was one of the three stories with source changes.
- Code review earned its time again: EC-013's weak assertions and leaking test state were found and fixed before sign-off (`499ee72`).
- The EC-022 presentation question went to the owner, was answered, and landed with code, tests, GDD wording (Closed Question 4) and recaptured evidence in one change, with the full suite, lint and build green.
- Manual checks were run by Claude, not handed to the user: the smoke run drove Menu, World Network, Brief, Assembly, Mission and Debrief in headed Chrome and the EC-022 screenshots were re-taken the same way (CLAUDE.md "Do It Yourself").

### What Went Poorly
- The Debrief evidence went stale within hours. EC-022 closed COMPLETE WITH NOTES at 15:45 with its owner question open; the owner decision landed at 20:35 (`c85960c`). The smoke report and four EC-022 screenshots predate it, so the QA sign-off carries a condition: no real mission has been walked to Debrief on the final build.
- Actual time per story is still not recorded. This is the fourth sprint with the action open.
- The World Network frame spike recurred: 181 ms in the sprint 3 smoke, 206 ms (1 frame) in sprint 4. The sprint 3 retro said to file a bug report if it recurred; none is filed and the cause is unknown. Perf run 1 also logged one 4.4 s Mission frame that did not repeat; its cause was not found either.
- EC-022's specialist code reviews (ui-programmer, lead-programmer, qa-tester) could not run because the workflow subagent had no Agent tool; the story's review verdict is NOT ASSESSED and lead-programmer sign-off on the evidence is pending.
- The sprint plan's Definition of Done is unticked again (9 of 9 unticked in `sprint-004.md`, as in sprint 3).

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None: no story has `status: blocked` or a `blocker` value in `production/sprint-status.yaml` | -- | -- | -- |
| (Friction, not a blocker) EC-022: GDD silent on whether Collateral and bonus show priced values or 0 on unpaid outcomes | Logged 15:45, decided 20:35 (about 4.8 h elapsed; not measured as work time) | Owner chose priced, muted, `NOT APPLIED` | Ask presentation questions at `/story-readiness`, before the story closes |

### Estimation Accuracy

Per-story actual time is ABSENT, so accuracy against the sheet cannot be computed (0 of 12 verifiable). Commit-to-commit gaps are the nearest proxy:

| Task | Estimated | Commit gap (proxy) | Variance | Likely Cause |
|------|-----------|--------------------|----------|--------------|
| EC-022 Invoice five money lines | 1.5 d | about 7 min (includes the row-builder extraction, tests and four screenshots) | far over | Estimate sized for a UI rework; the work was one pure builder and a 38-line screen change |
| EC-011 Wins pay in full | 1.0 d | about 5 min | far over | Behaviour already existed; tests only |
| EC-004 Accepting is free | 1.0 d | about 7 min | far over | Tests only |
| EC-013 Abort writes nothing | 1.0 d | about 6 min, plus a 17 min gap around the added third criterion | far over | Tests only; the criterion add was the real work |
| EC-014 Generated Reward stamp | 0.3 d | not measured (first story, no prior commit) | unknown | Needed a source change (29 lines); the plan had expected "probably test-only" |

**Overall estimation accuracy**: NOT ASSESSED -- NO DATA for the within +/- 20% measure.

[Analysis: estimates are still consistently over, and the sprint 4 plan lowered only the seven generated-contract stories (0.2--0.3 d) while keeping 1.0--1.5 d on EC-004, 011, 013 and 022 without a code check. Of the seven it lowered, two (EC-014, EC-018) did need source changes, so the "probably test-only" read was right for 5 of 7. Sizing from a code look at planning works; sizing in days does not describe stories that take minutes.]

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| None | -- | 0 | -- | -- |

Nothing carries out of sprint 4. The Economy and contracts epic has no Ready story left (22 of 22 Complete). QA conditions 1 and 2 (below) are follow-ups, not carried stories.

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable, clean (counted with `grep -w` over `src/` and `scripts/`)
- Concerns: the 206 ms World Network frame and the unreproduced 4.4 s Mission frame (causes unknown); `design/gdd/research.md` Core Rule 3 still names `src/state/researchStore.ts` as home of the authorize command while sprint 3 EC-002 put the billing in `appStore.authorizeResearch` (I did not re-check the code this retro); EC-008's story still points to `src/game/contracts.ts` for authored rewards, which live in `src/game/data.ts`.

### Previous Action Items Follow-Up

| Action Item (from Sprint 3) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Commit the five untracked sprint 3 QA artifacts before the next sprint | Done | `755eac8`, before Sprint 4 planning. The pattern recurred in a smaller way: the sprint 4 smoke report and evidence were untracked until `1ebb680`. |
| 2. Record actual time per story or batch in minutes at `/story-done`; drop it if still open | Not Started | Fourth carry. No time field exists in `sprint-status.yaml`. The retro's own rule says to drop it now. |
| 3. Re-base estimates in hours; size "tests and evidence only" stories; decide whether to start sprint 4 now | Partly done | Sprint 4 started the next day (decision made). Seven estimates were lowered to 0.2--0.3 d; still in days, no hour sizing, four stories kept sheet estimates. |
| 4. Decide `research.md` Core Rule 3 vs `authorizeResearch`; fix the stale EC-008 pointer (due 2026-10-21) | Not Started | Deadline not reached. The rule text and the EC-008 pointer are both unchanged. |
| 5. Tick sprint 3 Definition of Done; read assertions for EC-001/002/003/007; file `/bug-report` if the 181 ms frame recurs (due 2026-10-24) | Not Started | Sprint 3 DoD: 1 of 9 ticked. The frame recurred as 206 ms; no bug filed. |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Close the two Sprint 4 QA conditions: walk one real mission to Debrief (loss and quiet replay) on the current build, and re-run `/code-review` on EC-022 where specialists can spawn, or record a lead-programmer waiver. | Marco | High | Before the first Sprint 5 story that touches Debrief |
| 2 | Decide the time-tracking carry: drop the per-story yaml field and use commit intervals plus the session-log method in each retro. Say so in the next sprint plan. | Marco | High | At `/sprint-plan new` |
| 3 | File `/bug-report` for the World Network frame spike (181 ms sprint 3, 206 ms sprint 4) and run `/perf-profile` on the World Network screen; note the 4.4 s Mission frame in the same report. | Marco | Med | 2026-10-21 |
| 4 | Plan Sprint 5 from a different epic (Economy and contracts has no Ready story left). At planning, check each story against `src/` and size test-only stories at 0.1 d and source stories separately. | Marco | High | At `/sprint-plan new` |
| 5 | Clear the carried doc items: `research.md` Core Rule 3 vs `authorizeResearch`, the EC-008 pointer, and tick or drop the Definition of Done in `sprint-004.md`. | Marco | Low | 2026-10-24 |

### Process Improvements
- Ask the owner presentation questions at `/story-readiness`. EC-022's acceptance criteria were silent on how unpaid lines read, which surfaced at code review, after the story closed, and cost a second change, a GDD edit and new evidence.
- Do not sign off QA on a smoke report that predates a behaviour change. Either re-run the Debrief smoke path after `c85960c`-style changes or order the work so the owner decision lands before `/smoke-check`.

### Summary
Sprint 4 delivered all 12 Economy stories on the day before its window opened: 921 tests passing, smoke 9/9 and a QA sign-off of APPROVED WITH CONDITIONS with no filed bugs. The epic is now complete (22 of 22). The weak spots are tracking and evidence: no per-story time for the fourth sprint, a recurring 200 ms World Network frame with no bug filed, and Debrief evidence that a late owner decision made stale. The most important change is to settle presentation rules before a story closes, and to pick the next epic with a code check on every story.
