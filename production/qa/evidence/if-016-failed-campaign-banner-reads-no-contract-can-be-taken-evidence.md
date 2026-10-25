# Test Evidence: IF-016 Failed-campaign banner reads ROSTER EMPTY // NO CONTRACT CAN BE TAKEN

> **Story**: `production/epics/interface/story-016-failed-campaign-banner-reads-no-contract-can-be-taken.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-016 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-016-failed-campaign-banner-reads-no-contract-can-be-taken-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-016/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a failed campaign (empty living roster, campaign incomplete) WHEN the World Network shows THEN the `CAMPAIGN FAILED` banner's secondary line reads exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`, and `NETWORK COMMAND SUSPENDED` appears nowhere in `src/`. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-016/results.md` |
| AC-2 | GIVEN a completed campaign (three authored wins) WHEN the World Network shows THEN the `CAMPAIGN COMPLETE` banner, its secondary line and the `n / 3` count are unchanged. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-016/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-016/if-016-complete-1280x720.png` | if 016 complete 1280x720 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-016/if-016-failed-1280x720.png` | if 016 failed 1280x720 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-016/if-016-failed-real-path-1280x720.png` | if 016 failed real path 1280x720 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-016/if-016-failed-real-path-variant-b-1280x720.png` | if 016 failed real path variant b 1280x720 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-016/if-016-failed-scale-100-1280x720.png` | if 016 failed scale 100 1280x720 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-016/if-016-failed-scale-110-1280x720.png` | if 016 failed scale 110 1280x720 | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-016/if-016-failed-scale-125-1280x720.png` | if 016 failed scale 125 1280x720 | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-016/if-016-failed-scale-90-1280x720.png` | if 016 failed scale 90 1280x720 | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-complete-1280x720.png` | if 016 complete 1280x720 | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-1280x720.png` | if 016 failed 1280x720 | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-real-path-1280x720.png` | if 016 failed real path 1280x720 | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-real-path-variant-b-1280x720.png` | if 016 failed real path variant b 1280x720 | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-scale-100-1280x720.png` | if 016 failed scale 100 1280x720 | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-scale-110-1280x720.png` | if 016 failed scale 110 1280x720 | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-scale-125-1280x720.png` | if 016 failed scale 125 1280x720 | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-016/run-1/if-016-failed-scale-90-1280x720.png` | if 016 failed scale 90 1280x720 | see results.md |
| 17 | `sprint-011-head-2026-10-24/r1-probe/if-016-017-failed.png` | if 016 017 failed | see results.md |
| 18 | `sprint-011-head-2026-10-24/r1-probe/if-016-complete.png` | if 016 complete | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-016/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
