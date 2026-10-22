## Retrospective: Sprint 10 (difficulty curve)
Period: 2026-10-22 -- 2026-10-28 planned (all five stories closed and QA signed off on 2026-10-22)
Generated: 2026-10-22

Sources: `production/sprints/sprint-010.md`, `production/sprint-status.yaml`, `git log ffd0806..HEAD` (10 commits after the plan commit), `production/qa/qa-signoff-sprint-010-2026-10-22.md` (APPROVED WITH CONDITIONS), `production/qa/bugs/BUG-0008.md` and `BUG-0009.md`, `production/session-logs/decision-log.md`, `production/retrospectives/retro-sprint-9-2026-10-19.md`.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories) | 5 | 5 `done` | 0 |
| Completion Rate | -- | 100% (3/3 Must, 2/2 Should) | -- |
| Effort (sheet-days) | 2.1 | 2.1 | 0 |
| Bugs Found | -- | 1 (BUG-0009, S3-Medium, found by IF-015 `/code-review` and `/story-done`, not by QA) | -- |
| Bugs Fixed | -- | 1 (BUG-0009 fixed in ea1960f, Verified Fixed on 74d3268, Closed) | -- |
| Unplanned Tasks Added | -- | 4: the BUG-0009 fix (ea1960f); the `audio.test.ts:1088` flake fix (e88a030); the IF-015 destroy-line match to the Screens table (c4122ce); the IF013-18 refocus fix (90a2b6f). Also the IF-014 TC01/TC07 case-text corrections in the QA close-out | -- |
| Commits | -- | 10 after the plan commit ffd0806 (357 files, +11,838 / -291, mostly retained evidence) | -- |
| Tests | -- | 1,540 at b366721 (Sprint 9 close) to 1,627 at 90a2b6f, all passing | +87 |

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 8 | 3.5 sheet-days | 3.5 sheet-days | 100% | 235 min (16 stories) | ~4.1 stories / h |
| 9 | 5.5 sheet-days | 5.5 sheet-days | 100% | 177 min (17 stories) | ~5.8 stories / h |
| 10 (current) | 2.1 sheet-days | 2.1 sheet-days | 100% | 102 min (5 stories, WN-020 00:49 to IF-015 02:32 on 10-22) | ~2.9 stories / h |

**Trend**: completion stable at 100%; throughput down, with a different mix.
Sprint 10 has five UI/Integration-heavy stories, each with its own retained capture set (IF-013, IF-014 and IF-015 hold 135 PNGs between them), against Sprint 9's 17 mostly small stories. The window is measured the same way as before (first story commit to last), so it excludes the QA cycle and the human rulings.

### What Went Well
- **Retro 9's cost did not recur.** No story was ticked and then failed in QA. Manual QA had 0 FAIL: IF-013 18 PASS / 1 BLOCKED / 2 OBSERVATION of 21, IF-014 12 PASS / 2 OBSERVATION of 14, IF-015 18 PASS of 18. There was one `/team-qa` cycle, not two. The story-done rule from retro 9 action 1 (b366721, `.claude/skills/story-done/SKILL.md:117`) is in place.
- **The one defect was caught before QA.** IF-015's text-scale probe at 125 surfaced the pre-existing Brief threat-box overlap (BUG-0009); it was fixed, re-captured at four scales and closed the same day (ea1960f to 74d3268).
- **1280×720 held.** All 135 PNGs checked (IF-013 and IF-014 manual QA, IF-015 evidence) are 1280×720. Retro 9 action 4 asked for this after three Sprint 9 captures came from the 800×600 in-app pane.
- **Day-1 decisions settled the open questions.** The EC-023 Feed line and the IF-014 "available means affordable" were answered yes before work started, and no story stalled on them. WN-020 and EC-023 landed in order, as planned.
- **QA conditions 2 and 3 were closed the same day**: the owner ruled on IF013-18 (hide on refocus, fixed in `src/ui/worldOnboard.ts` and `WorldMap.tsx`) and IF013-19 (keep on-fire marking); the IF-014 observations were case-text errors and the cases were corrected.
- TODO/FIXME/HACK stayed at zero.

### What Went Poorly
- **A flaky test blocked a clean verification run.** `src/game/audio.test.ts:1088` failed intermittently (`npm test` 1625/1626 during the BUG-0009 fix) and needed an unplanned fix (e88a030, moving the AU-005 module-load tests to `audio.moduleLoad.test.ts`). It had been failing without a recorded cause since Sprint 9's AU-006.
- **The BUG-0009 test gap.** The IF-015 clip probe (`capture.mjs`) checked only `.mb-obj` rows, the KIT spans and the objectives box, so it passed while the neighbouring threat box overlapped. The review, not the probe, found it.
- **Standing smoke warnings have no owner.** Mission play was sim-assisted; the World Network p95 (9.2 ms) passes only on an earlier user ruling; the audio listening pass was not re-run and belongs with BUG-0008 (S3, Open, not reproduced). These three were carried from the smoke check into the sign-off as "stand" and have no date.
- **Evidence text drifted from the evidence.** `production/qa/evidence/if-015/README.md` says "70 probes"; `capture-output.txt` has 59 lines containing PASS. Not corrected.
- **Copy rework risk was real.** IF-013 and IF-015 copy was written before `/ux-design`: the KIT line is rendered uppercase by `.mb-obj-kit` over the sentence-case spec string, and the GDD destroy line (`interface.md:369`) had to be matched to the Screens table (c4122ce). Gate blocker 4 (`/ux-design` World Network + Brief) was open at planning; not re-checked here.

### Blockers Encountered

No story was `blocked` in `production/sprint-status.yaml`.

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| Flaky `audio.test.ts:1088` failing the full suite during the BUG-0009 fix | Not recorded; fix landed 11:44, 17 min after the BUG-0009 fix (ea1960f, 11:27) | e88a030 moved the AU-005 module-load tests to their own file; `npm test` 1626/1626 | Action 4 |

### Estimation Accuracy

Per-story actual effort is not recorded, so a variance table would be invented. Commit-to-commit intervals are the only clock data: WN-020 23 min (from the plan commit), EC-023 31, IF-013 25, IF-014 25, IF-015 22. Against sheet estimates of 0.3 to 0.5 d that confirms retro 8: sheet-days do not measure the work.

| Task | Estimated | Actual | Variance | Likely Cause |
|------|-----------|--------|----------|--------------|
| All five stories | 0.3 / 0.5 / 0.5 / 0.4 / 0.4 d | NOT ASSESSED — NO DATA | -- | -- |

**Overall estimation accuracy**: NOT ASSESSED — NO DATA on per-story effort; the sheet totals match by construction (2.1/2.1).
What did cost time was outside the estimates: QA evidence and rulings (sign-off at 17:03, 15 h after the last story commit) and the four unplanned items above.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| Stories | -- | 0 | All 5 `done` | -- |
| IF-015 coverage gaps (tactical-map stats rail bottom row at scales other than m03/125; reclient/Expedite Brief to deploy; MODERATE generated contracts; other resolutions) | 10 | 1 | QA condition 4 | Carry into the next QA plan (action 1) |
| Smoke warnings 2--4 (sim-assisted mission play; World Network p95 on a ruling; audio listening) | 10 | Not tracked | Need a person | Decide with dates (action 3) |
| BUG-0008 (S3, Audio, Open, not reproduced) | 9 | Not tracked | Needs the audio listening pass | With action 3 |
| Can a new player win the EC-023 offer | 10 | 1 | Playtest question, not a story | Action 2 |

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: stable at zero (`rg -c` over `src`; retro 9 used `grep -rnw`, same result).
- Debt outside comments: the IF-015 coverage gaps above; Sprint 9's unlogged weak asserts in seven stories' reviews and the manual-only BUG-0002 check (from retro 9) are still not in a register. No `tech-debt` file exists at `production/tech-debt*`, `production/qa/tech-debt*` or `docs/tech-debt*`, and the session state says nothing was logged. `/tech-debt` has not been run.

### Previous Action Items Follow-Up

| Action Item (from Sprint 9) | Status | Notes |
|-------------------------------|--------|-------|
| 1. A criterion is ticked only on evidence covering every entry point; run predicted-failure advisories | Done | Rule in `.claude/skills/story-done/SKILL.md:117` (b366721). No ticked-then-failed criterion in Sprint 10 QA |
| 2. Close R-4, R-5, R-6, R-7 or drop in writing | Done | b366721 commit body records all four closed |
| 3. Rulings on open design questions | Partly | Toast Space, BUG-0003 and the IF-001 AC1 overlay list are in b366721. The toast count (9 built vs 8 in the spec): no ruling found by search; not confirmed either way |
| 4. Sign-off captures at 1280×720 with headless Playwright | Done | 135 PNGs checked, all 1280×720 |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | Put the four IF-015 coverage gaps (condition 4) in the next sprint's QA plan, and widen each new clip probe to the container around the new element, not only the element (BUG-0009). Done = the plan lists the four gaps as cases and the probe selector list includes the parent box. | qa-lead | High | When `/qa-plan` for the next sprint runs |
| 2 | Playtest whether a new player can win the seeded EC-023 offer. Done = a playtest report says yes/no with the player's route. | Marco | High | 2026-10-28 |
| 3 | Give the standing smoke warnings a decision: a date for the audio listening pass (with BUG-0008), and a written ruling that mission play stays sim-assisted or a plan to hand-play it. Done = each of the three has a date or a recorded ruling. | Marco | Med | 2026-10-28 |
| 4 | Quarantine-check the suite after any flaky-test fix: run `npm test` three times in a row and record the result in the fix commit. Done = e88a030's fix confirmed on three consecutive runs, or reopened. | lead-programmer | Med | Before the next sprint's first story |
| 5 | Correct the IF-015 README probe count (70 vs the 59 PASS lines in `capture-output.txt`) and rule on the toast count (9 vs 8). Done = README matches the output; the toast count answered in the GDD or a bug filed. | Marco | Low | 2026-10-28 |

### Process Improvements
- Widen UI clip probes to the neighbouring box, not just the new element: BUG-0009 was a pre-existing overlap that the new probe missed.
- Give every standing QA warning a date or a written ruling when the sign-off is written, so "stands" does not carry unowned into the next sprint.

### Summary
A good sprint: all five stories done and QA-signed the day they started, one defect caught by the story's own review, no second QA cycle, and retro 9's evidence rule held. This sprint closes gate blocker 3 only; blockers 1, 2 and 4 are outside it, so no `/gate-check` (the stage does not change). The single most important change is action 3: the three standing smoke warnings and BUG-0008 need dates, because the gate cannot pass while they sit unowned.
