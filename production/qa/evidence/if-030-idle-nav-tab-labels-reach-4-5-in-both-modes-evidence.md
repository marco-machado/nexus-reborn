# Test Evidence: IF-030 Idle nav tab labels reach 4.5:1 in both modes

> **Story**: `production/epics/interface/story-030-idle-nav-tab-labels-reach-4-5-in-both-modes.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-030 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-030-idle-nav-tab-labels-reach-4-5-in-both-modes-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-030/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the nav on each of the four Screens WHEN the idle tab labels are measured in default and high-contrast modes against the nav's own composited background THEN each is ≥4.5:1. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-030/results.md` |
| AC-2 | GIVEN high-contrast mode WHEN the nav renders THEN the idle labels take the high-contrast remap (the as-built cause traced and recorded in the commit message), and the selected tab still carries `aria-current="page"`. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-030/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-030/if-030-brief-open-research-hc.png` | if 030 brief open research hc | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-030/if-030-brief-open-team-hc.png` | if 030 brief open team hc | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-030/if-030-brief-open-world-hc.png` | if 030 brief open world hc | see results.md |
| 4 | `sprint-011-head-2026-10-24/r1-probe/if-030-nav-brief-hc.png` | if 030 nav brief hc | see results.md |
| 5 | `sprint-011-head-2026-10-24/r1-probe/if-030-nav-research-hc.png` | if 030 nav research hc | see results.md |
| 6 | `sprint-011-head-2026-10-24/r1-probe/if-030-nav-team-hc.png` | if 030 nav team hc | see results.md |
| 7 | `sprint-011-head-2026-10-24/r1-probe/if-030-nav-world-hc.png` | if 030 nav world hc | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-030/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
