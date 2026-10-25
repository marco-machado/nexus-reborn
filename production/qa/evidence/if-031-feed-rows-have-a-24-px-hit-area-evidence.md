# Test Evidence: IF-031 Feed rows have a 24 px hit area

> **Story**: `production/epics/interface/story-031-feed-rows-have-a-24-px-hit-area.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-031 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-031-feed-rows-have-a-24-px-hit-area-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-031/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the Feed at 1280×720, text scale 100% WHEN each row's element box is measured THEN it is ≥24 px high. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-031/results.md` |
| AC-2 | GIVEN the taller rows and 14 events WHEN the Feed is used THEN it scrolls with the newest row reachable, rows do not overlap, and a row click still focuses its sector and marks the event read. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-031/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-031/if-031-feed-scrolled-bottom.png` | if 031 feed scrolled bottom | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-031/if-031-feed-top.png` | if 031 feed top | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-031/if-031-row-click-focused.png` | if 031 row click focused | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-031/if-031-wrapped-rows-1.png` | if 031 wrapped rows 1 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-031/if-031-wrapped-rows-2.png` | if 031 wrapped rows 2 | see results.md |
| 6 | `sprint-011-head-2026-10-24/r1-probe/if-031-035-targets.png` | if 031 035 targets | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-031/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
