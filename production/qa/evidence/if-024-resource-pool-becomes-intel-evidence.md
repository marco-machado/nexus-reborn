# Test Evidence: IF-024 RESOURCE POOL becomes INTEL

> **Story**: `production/epics/interface/story-024-resource-pool-becomes-intel.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-024 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-024-resource-pool-becomes-intel-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-024/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the bottom strip at 1280×720 and text scales 90 / 100 / 110 / 125 WHEN it renders THEN the panel titled `INTEL` prints the intel level and progress as `n / 100` text, prints no Credits, Influence or Roster, and nothing clips. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-024/results.md` |
| AC-2 | GIVEN an intel level-up WHEN the INTEL panel renders THEN its progress wraps below 100 and its level matches the header Intel. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-024/results.md` |

**Story verdict (Phase 5)**: PASS

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-024/if-024-level10-100.png` | if 024 level10 100 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-024/if-024-level10-110.png` | if 024 level10 110 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-024/if-024-level10-125.png` | if 024 level10 125 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-024/if-024-level10-90.png` | if 024 level10 90 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-024/if-024-level2-100.png` | if 024 level2 100 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-024/if-024-level2-110.png` | if 024 level2 110 | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-024/if-024-level2-125.png` | if 024 level2 125 | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-024/if-024-level2-90.png` | if 024 level2 90 | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-024/if-024-multi-level.png` | if 024 multi level | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-024/if-024-progress-0.png` | if 024 progress 0 | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-024/if-024-strip-100.png` | if 024 strip 100 | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-024/if-024-world-100.png` | if 024 world 100 | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-024/if-024-world-110.png` | if 024 world 110 | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-024/if-024-world-125.png` | if 024 world 125 | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-024/if-024-world-90.png` | if 024 world 90 | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-024/if-024-wrap-exact-100.png` | if 024 wrap exact 100 | see results.md |
| 17 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-100.png` | if 023 024 world 100 | see results.md |
| 18 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-110.png` | if 023 024 world 110 | see results.md |
| 19 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-125.png` | if 023 024 world 125 | see results.md |
| 20 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-90.png` | if 023 024 world 90 | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-024/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
