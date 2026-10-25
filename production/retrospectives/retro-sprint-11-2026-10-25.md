## Retrospective: Sprint 11 (World Network to its UX spec)
Period: 2026-10-23 -- 2026-10-28 planned (all 24 sprint-status stories `done` on 2026-10-23; QA APPROVED WITH CONDITIONS and all conditions met on 2026-10-25)
Generated: 2026-10-25

Sources: `production/sprints/sprint-011.md`, `production/sprint-status.yaml`, `git log 8605d32..HEAD` (26 commits after the plan commit), `production/qa/qa-signoff-sprint-011-2026-10-25.md` (NOT APPROVED, build `131a5c1`), `production/qa/qa-signoff-sprint-011-2026-10-25-main.md` (APPROVED WITH CONDITIONS, build `93c58e0`), `production/qa/bugs/BUG-0008.md` and `BUG-0010` to `BUG-0013`, `production/qa/bug-triage-2026-10-25.md`, `ROADMAP.md`, `production/session-logs/decision-log.md`, `production/retrospectives/retro-sprint-10-2026-10-22.md`.

Inputs: FOUND — sprint plan, sprint-status.yaml, both QA sign-offs, bug files, triage, git log, retro 10, roadmap. ABSENT — per-story actual effort (never recorded), so Estimation Accuracy is `NOT ASSESSED — NO DATA`.

### Metrics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Tasks (stories in the plan) | 20 (IF-016 to IF-035) | 20 `done`, plus 4 added (IF-036 to IF-038, TM-018) = 24 `done` | +4 |
| Stories in QA scope | -- | 30 (the 24, plus IF-039, TM-019, TM-020, TM-021, WN-021, WN-022 from `2c73542`) | +6 beyond the sheet |
| Completion Rate | -- | 100% of the 20 planned (14/14 Must, 4/4 Should, 2/2 Nice to Have); 24/24 in the yaml | -- |
| Effort (sheet-days) | 3.2 committed (3.8 with Nice to Have) | 5.8 done (3.8 planned + 2.0 added) | +2.6 vs committed, +2.0 vs the full plan |
| Bugs Found | -- | 4 new (BUG-0010 to BUG-0013, all S3-Medium), all found by QA, none by a story's own review | -- |
| Bugs Fixed | -- | 4 (each in its own worktree, merged; Verified Fixed, Closed 2026-10-25) | -- |
| Open bugs at close | -- | 1 (BUG-0008, S3, Audio; deferred to Polish by the owner). Open S1: 0. Open S2: 0 | -- |
| Unplanned Tasks Added | -- | 4 stories in the yaml (2.0 sheet-days); 6 more stories in the build but not in the plan or yaml; 4 bug fixes; 4 TM-021 tests; production-build perf run and budgets; 5 screen UX specs written and approved; agent playtests 2--4 | -- |
| QA cycles | 1 | 2 (NOT APPROVED, then APPROVED WITH CONDITIONS 47 min after) | +1 |
| Commits | -- | 26 after the plan commit `8605d32` (10 on 10-23, 5 on 10-24, 11 on 10-25) | -- |
| Source churn | -- | `src/`: 56 files, +2,018 / -672 (`git diff --shortstat 8605d32..HEAD -- src`) | -- |
| Tests | -- | 1,627 at `90a2b6f` (Sprint 10 close) to 1,678 at `93c58e0`, all passing three runs in a row | +51 |

Discrepancy, yaml against plan: the plan and `sprint-status.yaml` agree on 24 stories (`updated: 2026-10-23`). The 6 extra stories QA covered (IF-039, TM-019 to TM-021, WN-021, WN-022) are in neither. They shipped in `2c73542` (playtest 3--4 fixes); Claude added them to QA scope because no other QA cycle owned them, and the owner had no view. `ROADMAP.md` says "all 24 stories".

### Velocity Trend

| Sprint | Planned | Completed | Rate | Story commit window | Throughput |
|--------|---------|-----------|------|---------------------|------------|
| 9 | 5.5 sheet-days | 5.5 sheet-days | 100% | 177 min (17 stories) | ~5.8 stories / h |
| 10 | 2.1 sheet-days | 2.1 sheet-days | 100% | 102 min (5 stories) | ~2.9 stories / h |
| 11 (current) | 3.8 sheet-days (3.2 committed) | 5.8 sheet-days (3.8 planned + 2.0 added) | 100% of plan; 153% of plan counting additions | `05c7bd7` 02:26 to `ad176af` 04:02 on 10-23 = 96 min, 24 stories in 4 commits | Not comparable: 20 of the 24 landed in one commit (`05c7bd7`), so a per-story rate cannot be read from it |

**Trend**: completion stable at 100% of what the plan named; scope per sprint grew.
The 20 planned stories landed 43 min after the QA plan commit, on day 1 of 4. What moved the end date was added work and the second QA cycle, not the planned stories.

### What Went Well
- **The sprint goal was met on day 1.** All 20 planned stories, including both Nice to Have, were `done` on 2026-10-23 against a window to 2026-10-28; the final scripted runs show R1 152/152, R2 and R4 every surface at 0 clip / small-text / contrast counts, R3 16/16.
- **The QA loop was short and the evidence rule held.** All 30 stories have executed evidence (a test that ran or a case that was walked); captures were headless at 1280×720 (retro 9 action 4); `npm test` passed three times in a row on both builds. The NOT APPROVED at `ae4ca69` (00:26) to the APPROVED WITH CONDITIONS re-run at `3d6eb28` (01:13) took 47 min, with the four fixes (`aa90ae9` to `bc0bfbd`) landed in between. Each bug file carries a `Verified by` line.
- **TM-021's new tests were mutation-checked** (4 tests, each seen failing before passing).
- **The open performance gap from Sprint 10 closed.** The owner set the memory ceiling (192 MB heap) and load-time budget (mission entry 5 s, menu ready 1 s); the production build measured 69.2 MB, 4,364 ms and 52 ms; RISK-0003 closed (`ab1cf1e`). World Network p95 measured 7.3 ms in the profile run and 9.1 ms in the smoke check.
- **Gate-blocker work moved.** Five screen UX specs drafted and approved, Standard-tier floors applied to every surface (IF-036), agent playtests 2--4 and the fun hypothesis written, smoke at HEAD PASS, a Polish milestone and a risk register (RISK-0001 to 0005) created. All as recorded in `ROADMAP.md`; `/gate-check` was not re-run here.
- **Retro 10's dated items got entries.** Actions 1, 4 and 5 are done (see follow-up).
- **TODO / FIXME / HACK stayed at zero.**

### What Went Poorly
- **Three stories marked done failed QA: the retro 9 pattern again.** IF-036 and IF-037 were `done` in the yaml on 2026-10-23; IF-039 shipped in `2c73542` the same day. QA found IF-036 AC-2 (Assembly `MOBILITY` broke mid-word, BUG-0011), IF-037 AC-1 (Research node labels too small at 125%, BUG-0013) and IF-039 AC-1 (Brief notes missing `EVERY CIVILIAN HIT IS BILLED.`, BUG-0010). The result was a NOT APPROVED, a second QA cycle (Sprint 10 had one) and four worktrees. I did not verify whether each criterion was ticked before QA; the yaml shows `done`.
- **The planned risk came true, one story later.** The plan rated "IF-026 surfaces clipping on Research, Brief or Assembly at 125%" Medium/High. Those surfaces failed at 125% (BUG-0011, BUG-0013), in IF-036/IF-037 rather than IF-026, and QA found them rather than the stories' own checks.
- **A fourth bug had no story at all.** BUG-0012 (the CAMPAIGN FAILED banner always read `0 / 3`) belonged to no story failure; it surfaced in QA, not at IF-016/IF-017, which changed that banner's copy.
- **Scope grew unlogged.** 24 became 30 in QA scope. The 2.0 sheet-days of added stories were recorded in the plan; the other 6 stories were not recorded in the plan or the yaml. Sprint 11's own PR-SPRINT was CONCERNS at 3.8 d against 3.2 d before any of this.
- **Standing items from retro 10 still have no recorded outcome.** The audio listening pass has two due dates in two files (`ROADMAP.md`: 2026-10-23, moved from the 24th by the owner; `decision-log.md:275` and the Sprint 10 sign-off: 2026-10-24). I found no record that it was done in `ROADMAP.md` "Done recently", the Sprint 11 sign-offs or the decision log. The human playtest (due 2026-10-28) has not happened: playtests 2--4 are agent runs, and `CD-PLAYTEST` already notes that every timing finding so far comes from agents.
- **Code review was skipped for six stories.** `ROADMAP.md` "After that" item 5 says `/code-review` of the playtest 3--4 fixes (WN-021, WN-022, TM-019 to TM-021, IF-039) was not run. Those six are in the build and in QA scope.
- **QA tooling cost a cycle step.** The R3 focus script had an ordering defect (`focus.mjs`, step 4), so the first run read 15/16 on a script fault, not a game fault. Fixed and re-run 16/16.
- **Roadmap header went stale.** The Sprint line in `ROADMAP.md` still read "NOT APPROVED" while the Next step said APPROVED WITH CONDITIONS. Corrected in this turn.

### Blockers Encountered

No story was `blocked` in `production/sprint-status.yaml`.

| Blocker | Duration | Resolution | Prevention |
|---------|----------|------------|------------|
| QA verdict NOT APPROVED at `131a5c1` (3 story FAILs, 4 S3 bugs) | 47 min from `ae4ca69` (00:26 on 10-25) to the re-run `3d6eb28` (01:13); fixes at 00:36--00:43 | Four fixes in separate worktrees, merged to `main`; failing cases re-walked on `93c58e0`; bugs Verified Fixed and Closed | Action 1 |
| R3 focus script ordering defect read as a failure (15/16) | Not recorded | `focus.mjs` clears the seen hint after `fresh()`; re-run 16/16 (`r3-focus-fixed/`) | Fixed in the script |
| TM-020 and TM-018 sign-off rows unchecked at the sign-off | Same day | Art-director and qa-lead agents (TM-020) and lead-programmer agent (TM-018) reviewed on the owner's instruction and approved; rows signed | None needed |

### Estimation Accuracy

Per-story actual effort is not recorded, so a variance table would be invented. The only clock data is commit-to-commit: plan commit `8605d32` 01:39, QA plan `bb17de2` 01:43, the 20 stories in `05c7bd7` 02:26, IF-036 `d40bff5` 02:47, IF-037 `52be089` 03:20, IF-038 and TM-018 `ad176af` 04:02.

| Task | Estimated | Actual | Variance | Likely Cause |
|------|-----------|--------|----------|--------------|
| All 24 stories | 3.8 + 2.0 added = 5.8 d | NOT ASSESSED — NO DATA | -- | -- |

**Overall estimation accuracy**: NOT ASSESSED — NO DATA on per-story effort. The sheet recorded 5.8 days of stories that landed in about 2 h 23 min of commits after the plan, a third retro (8, 10, 11) in which sheet-days do not measure the work. Time went to QA evidence, the four fixes and the owner rulings, none of which the sheet estimates.

### Carryover Analysis

| Task | Original Sprint | Times Carried | Reason | Action |
|------|----------------|---------------|--------|--------|
| Stories | -- | 0 | All 24 `done` | -- |
| Human playtest of the EC-023 offer, with a hand-played mission (the only player-timing check not made by an agent) | 10 | 2 | Needs a person; due 2026-10-28 | Action 3 |
| Audio listening pass and BUG-0008 (S3, Audio, Open) | 9 | Not tracked | Needs a person; pass due 10-23 or 10-24 (two files disagree); BUG-0008 deferred to Polish | Action 3 |
| World Network p95 re-profile (also sets the open-time budget the spec leaves blank) | 10 | 1 | Dated 2026-10-28, "unless World Network code changes before then" | Action 3 |
| `/code-review` of WN-021, WN-022, TM-019, TM-020, TM-021, IF-039 | 11 | 0 | Not run | Action 2 |
| Eight owner observations from the Sprint 11 sign-off (Influence note below the fold, Review NOW in Ink, crisis bar `--red`, `.pp-live` blink under reduced motion, Antarctica Garrison CRITICAL, Print White value, globe-marker tips, NEON GARDEN 7 px) | 11 | 0 | Questions for the owner or UX, in `ROADMAP.md` item 2a | Owner decides; not an action here |
| TR registration for hit targets (IF-031 to IF-035 waiver), world event weights (WN-021), objective markers (TM-020) | 11 | 0 | Waived for the sprint; belongs to `/architecture-review` | Next `/architecture-review` |

### Technical Debt Status
- Current TODO count: 0 (previous: 0)
- Current FIXME count: 0 (previous: 0)
- Current HACK count: 0 (previous: 0)
- Trend: stable at zero (`grep -rw` over `src`).
- Debt outside comments: `docs/tech-debt-register.md` exists (10 items, TD-001 to TD-010, all Open, last updated 2026-10-10, all from World Network and TM-017 reviews). Nothing from Sprints 9 to 11 is in it. Not in the register, as far as I can tell from that file: the reviewer follow-ups at the foot of the main sign-off (TM-018 AC-2 wording, TM-020 evidence paths and expected opacity ranges, no unit test for `failed` objective rows on markers, art overlaps against art bible §3.4); the test harness imports the page's module URLs only partly (the Vite `?t=` stamp split the fixture's tutorial store in session 4, `ROADMAP.md` item 6); the three TR waivers above; Sprint 9's weak asserts and the manual-only BUG-0002 check (from retro 9). Retros 9 and 10 said no register existed; that was wrong, and this retro corrects it.

### Previous Action Items Follow-Up

| Action Item (from Sprint 10) | Status | Notes |
|-------------------------------|--------|-------|
| 1. Put the four IF-015 coverage gaps in the next QA plan; widen clip probes to the container | Done for the gaps; probe widening not verified | The four gaps ran as Brief cases H5--H8, all PASS (`evidence/sprint-011-head-2026-10-24/carried-brief/results.md`). I did not check whether the probe selector lists include the parent box; the R2 and R4 sweeps check clip, overlap and contrast on every surface |
| 2. Playtest whether a new player can win the EC-023 offer | Not Started (a person) | Agent playtests 2--4 ran (`playtest-2026-10-23-agent-s{2,3,4}.md`); the human session is dated 2026-10-28 |
| 3. Date the standing smoke warnings | Partly | The dates and rulings were recorded (decision log, roadmap). The audio pass has two dates in two files and no recorded outcome; the p95 re-profile and the hand-played mission are dated 2026-10-28; BUG-0008 deferred to Polish |
| 4. `npm test` three times in a row before the next sprint's first story | Done | Recorded in `ROADMAP.md` "Done recently" (green ×3 before the first story); three runs again on both QA builds |
| 5. Correct the IF-015 README probe count; rule on the toast count | Done | README now 58 (`979b855`); first-mission toast count set to nine (`2f1569b`) |

### Action Items for Next Iteration

| # | Action | Owner | Priority | Deadline |
|---|--------|-------|----------|----------|
| 1 | For a UI story that changes type, ink or layout, run its cases at all four text scales (90 / 100 / 110 / 125) on every surface its CSS touches before ticking it done, not at QA. Done = `story-done` names the four scales for such stories, and Sprint 12's QA finds no scale-only FAIL. | qa-lead | High | Before Sprint 12's first story |
| 2 | Run `/code-review` on WN-021, WN-022, TM-019, TM-020, TM-021 and IF-039. Done = a verdict file per story or one for the group; findings filed or answered. | lead-programmer | High | 2026-10-28 |
| 3 | Close the person-only items: the human EC-023 playtest with a hand-played mission, the audio listening pass (state whether it happened and when; settle the 10-23 / 10-24 date) and the World Network p95 re-profile. Done = a playtest report by a person; the audio outcome and BUG-0008 updated; the p95 and open-time budget recorded. | Marco | High | 2026-10-28 |
| 4 | Give every story in a build a sprint row before QA scope is set. Done = `sprint-status.yaml` and the plan list IF-039, TM-019 to TM-021, WN-021 and WN-022 (or state why they sit outside), and `/sprint-plan new` starts from a yaml that matches the build. | producer | Med | Before `/sprint-plan new` |
| 5 | Add the Sprint 9 to 11 debt listed above to `docs/tech-debt-register.md` (`/tech-debt`). Done = the register (last updated 2026-10-10) lists the reviewer follow-ups, the harness import issue and the TR waivers. | Marco | Low | 2026-10-28 |

### Process Improvements
- Move the four-scale check from QA to `story-done` for UI type and layout stories: three of this sprint's four bugs were scale or layout failures that passed the stories' own checks.
- Put a story row in the plan the moment a commit adds a feature, so QA scope is read from the yaml and not decided at sign-off.

### Summary
A good sprint on delivery: the goal was met on day 1 and every planned story is done, with 1,678 tests, clean sweeps and no open S1 or S2. It cost a second QA cycle, because three stories marked done failed on text scale or copy, the same pattern as retro 9. The single most important change is action 1: the four-scale check belongs in the story, not in QA. No `/gate-check` is run (the stage does not change); Sprint 12 planning follows via `/sprint-plan new`.
