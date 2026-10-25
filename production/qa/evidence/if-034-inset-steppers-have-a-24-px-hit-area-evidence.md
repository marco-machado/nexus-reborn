# Test Evidence: IF-034 Inset steppers have a 24 px hit area

> **Story**: `production/epics/interface/story-034-inset-steppers-have-a-24-px-hit-area.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-034 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-034-inset-steppers-have-a-24-px-hit-area-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-034/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the sector inset at 1280×720, text scale 100% WHEN `FOCUS PREVIOUS SECTOR` and `FOCUS NEXT SECTOR` are measured THEN each hit area is ≥24×24 CSS px. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-034/results.md` |
| AC-2 | GIVEN the enlarged steppers WHEN activated by click, Enter or Space THEN Focus steps and still skips Antarctica, and the steppers stay absent while the Influence moment note replaces the inset. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-034/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-034/if-034-after-note.png` | if 034 after note | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-034/if-034-hit-area-eu.png` | if 034 hit area eu | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-034/if-034-hit-area-na.png` | if 034 hit area na | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-034/if-034-keyboard-focus.png` | if 034 keyboard focus | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-034/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
