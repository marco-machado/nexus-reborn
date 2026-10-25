# Test Evidence: IF-027 Ink Dim text on the World Network moves to Ink

> **Story**: `production/epics/interface/story-027-ink-dim-text-on-the-world-network-moves-to-ink.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-027 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-027-ink-dim-text-on-the-world-network-moves-to-ink-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-027/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the World Network in default mode WHEN every text run that used Ink Dim (spec Contrast table) is measured as rendered THEN it uses Ink and reaches ≥4.5:1; no World Network text run renders in Ink Dim. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-027/results.md` |
| AC-2 | GIVEN Research, Brief and Assembly WHEN rendered THEN their text colours are unchanged: `--ink-dim` is unchanged in `src/index.css` and `src/ui/tokens.ts`, and any `.dim` / `.chip.dim` change is scoped to World Network selectors. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-027/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-027/if-027-influence-disabled.png` | if 027 influence disabled | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-027/if-027-influence-note.png` | if 027 influence note | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-027/if-027-ink-runs-intel2.png` | if 027 ink runs intel2 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-027/if-027-ink-runs-opening.png` | if 027 ink runs opening | see results.md |
| 5 | `sprint-011-head-2026-10-24/r1-probe/state-crisis.png` | state crisis | see results.md |
| 6 | `sprint-011-head-2026-10-24/r1-probe/state-failed.png` | state failed | see results.md |
| 7 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-critical.png` | state garrison critical | see results.md |
| 8 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-secure.png` | state garrison secure | see results.md |
| 9 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-strained.png` | state garrison strained | see results.md |
| 10 | `sprint-011-head-2026-10-24/r1-probe/state-influence-note.png` | state influence note | see results.md |
| 11 | `sprint-011-head-2026-10-24/r1-probe/state-intel2.png` | state intel2 | see results.md |
| 12 | `sprint-011-head-2026-10-24/r1-probe/state-opening-card.png` | state opening card | see results.md |
| 13 | `sprint-011-head-2026-10-24/r1-probe/state-opening.png` | state opening | see results.md |
| 14 | `sprint-011-head-2026-10-24/r1-probe/state-pressure.png` | state pressure | see results.md |
| 15 | `sprint-011-head-2026-10-24/r1-probe/state-review.png` | state review | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-027/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
