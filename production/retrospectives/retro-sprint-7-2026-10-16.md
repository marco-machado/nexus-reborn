## Retrospective: Sprint 7 (closed early)
Period: 2026-10-15 -- 2026-10-28 (planned window). Work ran 2026-10-15 17:42 -- 2026-10-16 11:39: plan 17:42, QA plan 22:57, story commits 23:17 -- 01:31 (23 stories), specialist review and test-hardening commits 02:29 -- 02:47, smoke and QA sign-off 04:31 -- 11:39. Closed with 12 days of the window ahead of it, for the fourth sprint running.
Generated: 2026-10-16

Sources: `production/sprint-status.yaml`, `production/sprints/sprint-007.md`, `production/retrospectives/retro-sprint-6-2026-10-15.md`, `production/qa/qa-signoff-sprint-007-2026-10-16-r2.md` (and the superseded `…-2026-10-16.md`), `production/qa/smoke-2026-10-16-sprint-007.md` and `…-quick.md`, `production/qa/tautological-tests-2026-10-16.md`, `git log 7718077^..HEAD` (48 commits) with `git diff --name-only` per commit, `grep -rE "TODO|FIXME|HACK" src scripts`, `.claude/docs/templates/sprint-plan.md`.

**Input check**: sprint plan FOUND, sprint-status.yaml FOUND, previous retro FOUND, QA sign-off FOUND, smoke reports FOUND, tautological-test sweep FOUND, git history FOUND. Per-story actual time ABSENT, so Estimation Accuracy uses commit intervals as a proxy. `production/qa/bugs/` does not exist (no bug records, not a verified-clean register). Session logs were not read; active time is NOT ASSESSED.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 23 in the yaml and the plan's tables; the plan's prose says 22 | 23 done | 0 (plan prose is off by one) |
| Completion Rate | -- | 100% (23/23 done) | -- |
| Effort (estimate sheet-days) | 3.8 | 3.8 completed | 0 |
| Retro tasks (R-1 to R-7) | 7 | 4 done or already done (R-1, R-2, R-5, R-7 partly), 3 not started (R-3, R-4, R-6) | -3 |
| Story commit window | 8 days available | 134 min for 23 stories (23:17 -- 01:31); review and hardening 18 min more (02:29 -- 02:47) | -- |
| Bugs Found | -- | 0 filed. Review and the test sweep found 4 blocking story issues and 24 tautological-test findings; none filed as bugs | -- |
| Bugs Fixed | -- | 0 filed. Blocking findings in RA-005, 008, 011, 019 fixed; sweep findings fixed or deleted | -- |
| Unplanned Tasks Added | -- | 0 stories. Unplanned: specialist review fixes, tautological sweep, a second smoke and a second sign-off | -- |
| Commits | -- | 48 (`7718077^..HEAD`): 23 story, 21 review and test hardening, plan, QA plan, AC top-up (R-2), CLAUDE.md commit rule | -- |

**Tests**: 1,146 (Sprint 6 close) to 1,278 (+132), 50 files; `npm run build` and `npm run lint` exit 0 (smoke, at `cfd2066`).

**Source changes**: the plan expected every story except RA-009 to be test-only. At story time 21 of 23 were: RA-011 changed `abilities.ts` and `world.ts`; RA-017 added `remainingDowntimeSec` and `injuryLineHours` to `campaignStore.ts` (a CONTRACT FILE, additive) and `index.tsx`. Specialist review then forced four more: RA-005 (`deployRefusal.ts`, `index.tsx`), RA-008 (`assemblyRows.ts`, `index.tsx`), RA-019 (`missionLifecycle.ts`, `Hud.tsx`, `MissionScreen.tsx`), and a comment-only edit to `debrief.ts` for RA-009. Counting final state, the test-only forecast was right for 18 of 23 stories (RA-009 excluded from the comment-only edit).

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 5 | 5.1 sheet-days | 5.1 sheet-days | 100% | 91--97 min | 3.2--3.4 sheet-days / h |
| 6 | 4.2 sheet-days | 4.2 sheet-days | 100% | 101 min (17 stories) + PV-018 | ~2.2 sheet-days / h |
| 7 (current) | 3.8 sheet-days | 3.8 sheet-days | 100% | 134 min (23 stories) | ~1.7 sheet-days / h |

**Trend**: Stable on completion, decreasing on throughput for the third sprint running.
Every sprint since Sprint 2 completes 100% of a plan that keeps shrinking. Sprint 7 held 23 stories (more than the 18 of Sprint 6) at 0.17 d average, so the sheet-day estimate is not measuring the work. Story count per hour (10.3 per hour) is a steadier signal than sheet-days.

### What Went Well
- All 23 stories done and the Roster and Assembly epic closed. The QA verdict is APPROVED WITH CONDITIONS with no S1 to S4 bug and no failed story. Suite +132 tests to 1,278, build and lint clean.
- **R-1 was met.** `f74ddd6` made `implement-stories` spawn code-review specialists, and the 23 stories were re-reviewed from the main session: 12 APPROVED, 11 APPROVED WITH SUGGESTIONS (10 in `b5bebe2`, RA-009 in `cfd2066`), none CHANGES REQUIRED. That is the Sprint 5 and 6 gap, closed. The review found real defects: blocking changes in RA-005, 008, 011 and 019, each fixed and re-reviewed.
- **The tautological-test sweep** (`tautological-tests-2026-10-16.md`) read the whole Sprint 7 test diff and scanned all 47 older test files. It found 24 tests that could not fail, and proved the fixes by breaking the source and watching the new tests fail. Examples: `MASS_LIMIT_KG = 399.9` left the old gate tests green; swapping the assault and recon kits left the old RA-011 tests green. Row 22 is the one it could not independently re-fail, and it says so.
- **R-2 paid off.** The AC top-up (`f5e1a56`) landed before RA-014, and no story stopped at `/story-readiness` for too few criteria.
- Manual QA drove the mission through the sim's own order calls and the real Pause/Abort UI rather than store seeding. RA-009 was checked at 100% and 125% text scale with 0 clipped elements.
- Smoke item 8 passed: World Network p95 at most 9.0 ms and max at most 25.0 ms over 4 runs, Assembly p95 at most 8.8 ms over 2 runs, 0 frames over 50 ms.
- Debt markers stay at zero.

### What Went Poorly
- **Review was run after the stories closed, not inside them.** `implement-stories` closed 22 of 23 stories with `/code-review: NOT ASSESSED`, and `f74ddd6` fixed the workflow at 02:29, after the stories were done. The specialists then found four blocking issues and the sweep found 24 vacuous tests, all of which had passed `/story-done` and a green suite. Passing meant "exists and passes": the QA sign-off still says so in condition 3.
- **The QA gate ran twice.** The first full smoke (`smoke-2026-10-16-sprint-007.md`, 04:31) was NOT ASSESSED because item 4's injury half and item 8's frame check did not run. The first sign-off (11:35) was NOT ASSESSED for that reason, and a second smoke (`-quick`, 11:38) and sign-off (`-r2`, 11:39) repeated the run. The injury path cannot be reached naturally: a win's 2-day ETA catch-up covers the 48 h maximum recovery, so INJ-03 is shown on a labelled fixture only (QA condition 6).
- **RA-025's review gap stayed open.** `b5bebe2` records a specialist verdict for 22 stories including RA-025, but the sign-off still lists `/code-review` on `src/state/save.test.ts` as NOT ASSESSED (condition 2) and the session checkpoint says the same. The two records disagree and I did not resolve which is current.
- **Three of seven retro tasks were not started.** R-3 (World Network frame spike: `/bug-report` plus a trace) is now carried four times. R-4 (Sprint 5 QA conditions) has no conditions update in `qa-signoff-sprint-005-2026-10-15.md`. R-6 (template) left `## Definition of Done` in `.claude/docs/templates/sprint-plan.md` and the Sprint 7 checklist is unticked again, the fifth sprint running.
- **The plan carried stale or wrong facts.** R-5 listed the Sprint 6 QA conditions as open, but the Sprint 6 sign-off already had a "Conditions Update — 2026-10-15" resolving all three, written before the plan. The prose said 22 stories while the tables and yaml held 23.
- **Condition 5 left an unverified evidence claim.** RA-021's named `research.test.ts` evidence is deferred to research Stories 013 to 015 and was not verified by QA.
- **The sign-off, smoke reports and QA test cases are untracked.** `git status` at session start lists `qa-signoff-sprint-007-2026-10-16*.md`, the smoke reports, the QA strategy, and `ra-013`/`ra-009` cases and evidence as untracked. They are not in history.

### Blockers Encountered

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| None recorded (no story `status: blocked` in `sprint-status.yaml`) | -- | -- | -- |

The smoke gap above delayed the sign-off but blocked no story.

### Estimation Accuracy

| Task | Estimated | Actual (commit interval) | Variance | Likely Cause |
|------|-----------|--------------------------|----------|--------------|
| RA-001 to RA-008, RA-010 (test-only) | 0.1--0.2 d each | 4--8 min each | far under | Rules already in `mass.ts`, `deployGate.ts`, `campaignStore.ts`; the story was a test |
| RA-011 role kits | 0.1 d, "test-only" | 6 min, source change to `abilities.ts` and `world.ts` | scope grew | The kit did not resolve from the operative role yet |
| RA-017 win ETA catch-up | 0.2 d, "test-only" | 7 min, two helpers added to a CONTRACT FILE | scope grew | The rule lived inline in `sync`; the test needed a callable helper |
| RA-009 Assembly (UI) | 0.3 d | 7 min; screenshots and click-through done separately | NOT ASSESSED | Active time not measured |
| RA-005, 008, 019 review fixes | not estimated | 02:29 -- 02:36 | unplanned | Blocking findings found only after the stories closed |

**Overall estimation accuracy**: NOT ASSESSED. Commit intervals of 4--8 min against 0.1--0.3 d estimates put no story within +/-20%, but intervals are not effort. The usable signal is the source-vs-test forecast: right for 21 of 23 at story time and 18 of 23 after review.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| World Network frame spike (`/bug-report` + trace) (R-3) | Sprint 4 | 4 | Not started; the sprint closed in hours, before its 2026-10-21 deadline | Close on purpose with a reason: smoke item 8 measured p95 at most 9 ms and max at most 25 ms over 4 runs, no 181/206/250 ms spike, or file the bug |
| Definition of Done checklist decision (R-6) | Sprint 3 | 5 | Not started | Decide in the template now |
| Sprint 5 QA conditions (R-4) | Sprint 5 | 2 | Not started | Close or waive with a conditions update |
| Sprint 7 QA conditions 1 to 6 | Sprint 7 | 0 | New | Close, accept, or waive (action 3) |

No stories carried over.

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: Stable (at zero)
- Debt lives outside comments. Open: the specialist suggestions left open in the 11 APPROVED WITH SUGGESTIONS stories (not itemised here), `remainingDowntimeSec` duplicating the rule inline in `sync` (RA-017 advisory), TR-roster-006 not matching RA-025's scope (re-map, docs only), and the Sprint 6 suggestions (detached-anchor Export in Firefox, no render test for Balance/Debrief wiring, `startNewOperation` at about 60 lines, Escape closing Balance instead of disarming). `/tech-debt` was not run.

### Previous Action Items Follow-Up

| Action Item (from Sprint 6) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Specialist review on every source-changing story (R-1) | Done, late | `f74ddd6` + main-session reviews of all 23. Done after the stories closed, not before RA-001. The six Sprint 5 Research stories and PV-016/017 were not part of this commit set; PV-016/017 had their review on 2026-10-15. Research stories not checked |
| 2. World Network frame spike (R-3) | Not Started | Fourth carry; deadline 2026-10-21 still ahead. Smoke item 8 gives new frame data |
| 3. Close Sprint 5 QA conditions (R-4) | Not Started | No conditions update in the Sprint 5 sign-off |
| 4. Fix the sprint-plan template (R-6) | Not Started | DoD section still at line 55 of the template; evidence-path rule not written |
| 5. P-01 hint and Sectors clipping (R-7) | Done (P-01), partly (clipping) | `3803f76` added the hint slot to Menu New Operation and Pause Abort. `784f22d` made four Screens scroll at 1280x720. The Sectors panel at 125% text scale was not re-checked by me |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Make the specialist-review step block `/story-done`: a source-changing or test-adding story cannot close on `/code-review: NOT ASSESSED`. Add a mutation check ("break the source, watch the test fail") to the Logic-story done criteria, since a green suite and a passing review missed 24 vacuous tests. Done = a story commit cannot record NOT ASSESSED without a stated waiver. | Marco | High | Before the next sprint's first story |
| 2 | Close the Sprint 7 QA conditions: lead sign-off on `ra-013-evidence.md` rows, `/code-review` on `src/state/save.test.ts` (reconcile with the `b5bebe2` record), re-map TR-roster-006, confirm research Stories 013 to 015 cover RA-021, accept or walk C-8. | Marco | High | 2026-10-22 |
| 3 | R-3 on purpose: close the frame-spike item with the smoke item 8 numbers and a reason, or file `BUG-0001` with a tagged trace. Stop carrying it. | Marco | High | 2026-10-21 |
| 4 | R-4 and R-6 in one pass: write the Sprint 5 conditions update, and drop the Definition of Done section from the sprint-plan template (or have `/team-qa` tick it) plus name evidence paths as `production/qa/evidence/<story-slug>/`. | Marco | Med | 2026-10-24 |
| 5 | Commit the Sprint 7 QA record (sign-off, smoke reports, strategy, `ra-009`/`ra-013` cases and evidence) and make the plan's story count come from `sprint-status.yaml`, not prose. | Marco | Low | At `/sprint-plan new` |

### Process Improvements
- Run specialist review inside the story, before `/story-done`, instead of as a batch afterwards. Sprint 7 shows what batching costs: four blocking fixes and 24 vacuous tests were found only after all 23 stories had closed.
- Run the full smoke scope once. Two items could not run in the first pass (an unreachable natural injury path, and the frame check), which produced two smoke reports and two sign-offs. State up front which smoke items need a labelled fixture, so a fixture run counts as PASS WITH NOTES in the first report.
- Stop carrying items that have no deadline pressure. R-3 and R-6 have been carried for four and five sprints because each sprint closes in hours. Either give them a story with an acceptance test, or close them with a written reason.

### Summary
A clean delivery sprint: 23 of 23 stories, 132 new tests, no bugs filed, and the Roster and Assembly epic closed with QA APPROVED WITH CONDITIONS. R-1 finally ran and proved its worth, finding four blocking issues, and the mutation-checked test sweep showed that a green suite had been passing 24 tests that could not fail. The cost is that both checks ran after the stories closed, and three older retro items (R-3, R-4, R-6) went untouched again. The single most important change is to put specialist review and a "break it, watch it fail" check inside each story's done criteria, before the story commit.
