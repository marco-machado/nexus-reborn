# Test Evidence: IF-020 STRAINED Garrison prints in the notice tone, not amber

> **Story**: `production/epics/interface/story-020-strained-garrison-prints-in-the-notice-tone.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-020 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-020-strained-garrison-prints-in-the-notice-tone-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-020/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a focused sector WHEN Garrison is `SECURE` / `STRAINED` / `CRITICAL` THEN the word prints in teal / the Print White notice tone / Red Hot respectively, and the amber class is never used for Garrison. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-020/results.md` |
| AC-2 | GIVEN the World Network viewed in grayscale WHEN Garrison is `SECURE`, `STRAINED` or `CRITICAL` THEN the word alone tells the state, and Credits still print in Ledger Amber. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-020/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-020/antarctica-south-pole.png` | antarctica south pole | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-020/garrison-control-34.png` | garrison control 34 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-020/garrison-control-35.png` | garrison control 35 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-020/garrison-control-54.png` | garrison control 54 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-020/garrison-control-55.png` | garrison control 55 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-020/grayscale-critical-slot.png` | grayscale critical slot | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-020/grayscale-critical.png` | grayscale critical | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-020/grayscale-secure-slot.png` | grayscale secure slot | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-020/grayscale-secure.png` | grayscale secure | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-020/grayscale-strained-slot.png` | grayscale strained slot | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-020/grayscale-strained.png` | grayscale strained | see results.md |
| 12 | `sprint-011-head-2026-10-24/r1-probe/if-020-grayscale-strained.png` | if 020 grayscale strained | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-020/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
