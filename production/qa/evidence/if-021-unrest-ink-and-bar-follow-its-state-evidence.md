# Test Evidence: IF-021 Unrest ink and bar follow its state

> **Story**: `production/epics/interface/story-021-unrest-ink-and-bar-follow-its-state.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-021 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-021-unrest-ink-and-bar-follow-its-state-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-021/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a sector row and the Focus panel WHEN Unrest is calm (≤ `PRESSURE_UNREST_MIN`, not in crisis) / past the pressure line / in crisis THEN the Unrest value prints in Ink / the Print White notice tone / Red Hot respectively, each ≥4.5:1 as rendered, and the Focus-panel Unrest bar takes the matching tone. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-021/results.md` |
| AC-2 | GIVEN a sector in crisis whose Unrest has fallen back under the pressure line (hysteresis) WHEN rendered THEN the value and bar stay Red Hot (crisis wins over pressure), and the `UNREST PRESSURE` chip shows on the sector row only. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-021/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-021/if-021-antarctica.png` | if 021 antarctica | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-021/if-021-hw-calm-50.png` | if 021 hw calm 50 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-021/if-021-hw-calm-60.png` | if 021 hw calm 60 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-021/if-021-hw-crisis-40.png` | if 021 hw crisis 40 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-021/if-021-hw-crisis-80.png` | if 021 hw crisis 80 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-021/if-021-hw-pressure-61.png` | if 021 hw pressure 61 | see results.md |
| 7 | `sprint-011-head-2026-10-24/r1-probe/if-021-crisis-40.png` | if 021 crisis 40 | see results.md |
| 8 | `sprint-011-head-2026-10-24/r1-probe/if-021-crisis-80.png` | if 021 crisis 80 | see results.md |
| 9 | `sprint-011-head-2026-10-24/r1-probe/if-021-opening-50.png` | if 021 opening 50 | see results.md |
| 10 | `sprint-011-head-2026-10-24/r1-probe/if-021-opening-60.png` | if 021 opening 60 | see results.md |
| 11 | `sprint-011-head-2026-10-24/r1-probe/if-021-pressure-61.png` | if 021 pressure 61 | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-021/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
