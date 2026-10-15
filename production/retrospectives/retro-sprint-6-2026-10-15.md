## Retrospective: Sprint 6 (closed early)
Period: 2026-10-15 -- 2026-10-28 (planned window). Work ran 2026-10-15 01:04 -- 16:44: plan 01:04, QA plan 01:11, story commits 01:19 -- 03:00 (17 stories) and 11:05 (PV-018), smoke 15:29, QA sign-off and review fixes 16:43. Closed with the whole window ahead of it, for the third sprint running.
Generated: 2026-10-15

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-006.md`, `production/retrospectives/retro-sprint-5-2026-10-15.md`, `production/qa/qa-signoff-sprint-006-2026-10-15.md`, `production/qa/smoke-2026-10-15-sprint-006.md`, `production/qa/qa-strategy-sprint-006-2026-10-15.md`, `git log` and `git show --name-only` for `75ad98e..2815d41`, `grep -rE "TODO|FIXME|HACK" src scripts`.

**Input check**: sprint plan FOUND, sprint-status.yaml FOUND, previous retro FOUND, QA sign-off FOUND, smoke report FOUND, git history FOUND. Per-story actual time ABSENT, so Estimation Accuracy uses commit intervals as a proxy. Main-session active time NOT ASSESSED: unlike the Sprint 5 retro, I did not read the session logs; only commit timestamps are used. `production/qa/bugs/` does not exist.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 18 | 18 | 0 |
| Completion Rate | -- | 100% (18/18 done) | -- |
| Effort (estimate sheet-days) | 4.2 | 4.2 completed | 0 |
| Retro tasks (R-1 to R-5) | 5 | 1 done (R-4, its enforcement half still open), 4 not started | -4 |
| Story commit window | 8 days available | 101 min for 17 stories (01:19 -- 03:00); PV-018 at 11:05 after a break | -- |
| Bugs Found | -- | 0 filed | -- |
| Bugs Fixed | -- | 0 filed; 3 required review changes fixed after close (`db927b2`) | -- |
| Unplanned Tasks Added | -- | 0 stories; 1 unplanned change set (`db927b2`) | -- |
| Commits | -- | 25 (`75ad98e..2815d41`): 18 story, plan, QA plan, AC top-up, smoke, review fixes, QA record, next-step fix | -- |

**Bugs**: none on file. That is "no bug records", not a verified-clean register. QA's one PASS WITH NOTES (PV-018 banner over the Feed) and the re-run code review's three required changes were fixed in `db927b2` instead of filed.

**Source changes**: 10 of 18 stories changed only tests. Eight changed source: PV-001 (`save.ts`, `index.tsx`), PV-002 (`index.tsx`, new `newOperationArm.ts`), PV-004 (`save.ts`), PV-013 (`telemetry.ts`, `Settings.tsx`, new `balanceGate.ts`, `index.tsx`), PV-015 (`telemetry.ts`, `Balance.tsx`, new `balanceStats.ts`), PV-016 (`Balance.tsx`, new `balanceActions.ts`), PV-017 (`save.ts`, new `saveStatusStore.ts`, new `filingStatus.ts`, `index.tsx`, `ui.css`), PV-018 (`App.tsx`, `save.ts`, new `WriteFailureNotice.tsx`, `filingStatus.ts`, `ui.css`). The suite grew from 1,045 tests (Sprint 5 close) to 1,146 (+101).

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 4 | 6.7 sheet-days | 6.7 sheet-days | 100% | 77--83 min | 4.9--5.2 sheet-days / h |
| 5 | 5.1 sheet-days | 5.1 sheet-days | 100% | 91--97 min | 3.2--3.4 sheet-days / h |
| 6 (current) | 4.2 sheet-days | 4.2 sheet-days | 100% | 101 min (17 stories, 3.7 d) + PV-018 | ~2.2 sheet-days / h (17 stories) |

**Trend**: Stable on completion, decreasing on throughput.
Every sprint since Sprint 2 completes 100% of a plan that keeps shrinking, and sheet-days per hour fell for the second sprint running. The sheet-day estimates no longer measure the work: whole sprints finish in under two hours of commits.

### What Went Well
- All 18 stories done and the Persistence and validation epic closed, which finishes the Core layer (World Network, Economy and contracts, Research, Persistence).
- The suite grew by 101 tests to 1,146, and build, lint and the full suite stayed green through every commit checked (smoke and after `db927b2`).
- R-4 paid off: the AC top-up (`629624f`) went in before PV-001, and no story stopped at `/story-readiness` for too few acceptance criteria (Sprint 5 stopped at RS-017).
- Manual QA ran through played missions and the real Settings UI, not store seeding. That cleared a smoke false alarm (telemetry "lost" after reload was the smoke harness's `setState`) and produced the first played quiet-replay Debrief evidence.
- Sprint 5 retro action 4 was met: the on-screen RS-020 Chance check went into the Sprint 6 smoke scope and passed.

### What Went Poorly
- **Code review again ran without specialists.** 17 of the 18 story commits record a `/code-review` verdict, and all 17 say NOT ASSESSED ("specialist agents unavailable" or "could not be spawned"). None records a specialist verdict. When the specialists were run from the main session for QA condition 3 (PV-016/017 only), the verdict was CHANGES REQUIRED. The three required changes were the P-01 armed hint missing on Balance Clear, the Debrief status live region silent on arrival, and an overclaiming watcher test. They reached QA sign-off unseen. This is the Sprint 5 risk ("Code review again ends NOT ASSESSED", rated High) coming true, with R-1 not started.
- **Four of five retro tasks were not started.** R-2 (World Network frame spike: `/bug-report` plus a trace) is on its third carry. R-5 (Definition of Done checklist) is on its fourth: the Sprint 6 checklist is unticked again. R-3 (Sprint 5 QA conditions) is untouched, and the Sprint 5 sign-off has no conditions update.
- **The plan's source-change forecast missed.** It expected source changes in PV-001, 008, 015, 017 and 018. PV-008 was tests-only, and PV-002, 004, 013 and 016 changed source unforecast.
- **UI placement went unreviewed until QA.** The write-failure notice covered Feed rows at 1280x720. The first fix (41vh) failed at 125% text scale, and the second (31vh) needed a 24-case probe. A placement check at story time would have caught it.
- **The QA plan named a path the stories never used.** It named `production/qa/evidence/sprint-006/`, but every story wrote to `pv-NNN/`, and QA had to record the deviation.
- **A template step misdirected the close-out.** The `/team-qa` template's "run `/gate-check`" was repeated without checking. Gate checks here are for stage transitions only, and that is now a rule in `CLAUDE.md`.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None recorded | -- | No story had `status: blocked` in `sprint-status.yaml` | -- |

### Estimation Accuracy

| Task | Estimated | Actual (commit interval) | Variance | Likely Cause |
|------|-----------|--------------------------|----------|--------------|
| PV-008 invalid blob drop | 0.5 d, "source change" | 5 min, tests only (`301e180`) | far under | PV-001's Menu-state change (`7ee062a`) delivered the source half |
| PV-016 Export and Clear | 0.3 d, "test-only + screenshots" | 6 min, plus a new `balanceActions.ts` | far under, but scope grew | Testing in Node needed the actions pulled out of the component |
| PV-018 write failure | 0.5 d | Committed 8 h after PV-017, across a break | NOT ASSESSED | Active time not measured |

**Overall estimation accuracy**: NOT ASSESSED. Commit intervals of 4--9 min against 0.1--0.5 d estimates leave no story within +/-20%, but the intervals are not effort. The useful signal is the source-vs-test forecast, which was right for 14 of 18 stories (PV-002, 004, 013 and 016 changed source unforecast; PV-008 did not as forecast).

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| World Network frame spike: `/bug-report` + `/perf-profile` with a trace (R-2) | Sprint 4 | 3 | Not started; every sprint closed in hours, before its deadline came up | Do it as Sprint 7's first task, or drop it on purpose |
| Definition of Done checklist decision (R-5) | Sprint 3 | 4 | Not started | Decide in the template now (action 4) |
| Sprint 5 QA conditions (R-3) | Sprint 5 | 1 | Not started | Close or waive (action 3) |
| Specialist code review of the six source-changing Research stories (R-1) | Sprint 5 | 1 | Not started; Sprint 6 hit the same gap | Fold into action 1 |

No stories carried over.

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable (at zero)
- Debt is recorded elsewhere, not in comments: the review's suggestions are open. They are the detached-anchor Export in Firefox (ADR-0015 risk), no render test for the Balance and Debrief wiring, `startNewOperation` at about 60 lines, and Escape closing the Balance panel instead of only disarming. Also open: the P-01 armed hint missing on Menu New Operation, the Sectors panel clipping at 125% text scale, and placeholder copy pending `/ux-design` (filing status, write-failure notice, Clear hint).

### Previous Action Items Follow-Up

| Action Item (from Sprint 5) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Specialist `/code-review` on RS-003, 005, 006, 009, 010, 011, or let `implement-stories` spawn specialists | Not Started | Sprint 6 repeated the gap: all 17 recorded reviews say NOT ASSESSED. Specialists did run from the main session today for PV-016/017 and found required changes |
| 2. `/bug-report` + `/perf-profile` for the World Network spike | Not Started | Deadline 2026-10-21 still ahead; third carry. The smoke frame data was untagged after reloads |
| 3. Close Sprint 5 QA conditions | Not Started | No conditions update in `qa-signoff-sprint-005-2026-10-15.md` |
| 4. Plan Sprint 6 from a remaining epic; RS-020 Chance in smoke; decide AC-minimum enforcement in `/create-stories` | Done (enforcement open) | Persistence planned; RS-020 check passed in smoke; AC top-up done, enforcement not decided |
| 5. Drop or tick the Definition of Done checklist | Not Started | Fourth sprint unticked |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Make specialist review part of every source-changing story: either change `implement-stories` so `/code-review` runs from the main session with lead-programmer, ui-programmer and qa-tester, or run that review after each workflow run. Include the six Research stories from Sprint 5. Done = no story commit says `/code-review: NOT ASSESSED`. | Marco | High | Before Sprint 7's first story |
| 2 | World Network frame spike: `/bug-report` with a tagged trace, or close the item on purpose with a reason. | Marco | High | 2026-10-21 |
| 3 | Close or waive the Sprint 5 QA conditions (RS-009 sign-off, P-22 remaining-time format, unique `rs-remaining` test ids, RS-009 screenshots) and write a conditions update into that sign-off. | Marco | Med | 2026-10-22 |
| 4 | Fix the sprint-plan template in one pass: drop the Definition of Done checklist or have `/team-qa` tick it, and name evidence paths as `production/qa/evidence/<story-slug>/` so QA plans match what stories write. | Marco | Low | 2026-10-24 |
| 5 | Start or schedule the two follow-ups found in QA: the P-01 armed hint on Menu New Operation (and Pause Abort if missing), and the Sectors panel clipping at 125% text scale. | Marco | Med | At `/sprint-plan new` |

### Process Improvements
- Add one placement check for any new overlay to `/story-done` for UI stories: a probe at 1280x720 and 125% text scale. The write-failure notice needed three tries after QA, and a check at story time would have needed one.
- Stop trusting skill-template "next step" lines over the project's own sequence. A sprint closes with QA sign-off, then `/retrospective`, then `/sprint-plan new`; `/gate-check` is only for stage changes (now in `CLAUDE.md`).

### Summary
A clean delivery sprint: 18 of 18 stories, the Core layer finished, 101 new tests, and no bugs filed. The weak spot is review, not delivery: specialist code review was skipped again, as in Sprint 5, and the first time it ran it found three required changes after QA had signed off. Four of five retro actions also went untouched. The one change that matters most for Sprint 7 is to make specialist review a step that cannot end NOT ASSESSED before a story closes.
