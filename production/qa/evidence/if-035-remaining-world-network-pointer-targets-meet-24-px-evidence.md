# Test Evidence: IF-035 Remaining World Network pointer targets meet 24×24

> **Story**: `production/epics/interface/story-035-remaining-world-network-pointer-targets-meet-24-px.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-035 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-035-remaining-world-network-pointer-targets-meet-24-px-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-035/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the World Network at 1280×720, text scale 100% WHEN Pause/Resume, `n UNREAD`, `> GO LIVE`, the Scan view controls (zoom, HOME, FOCUS SECTOR, SOUTH POLE, LABELS), the imagery credit link, `UNDERSTOOD` on the first-visit card and on the Influence moment note, and the four nav tabs are measured THEN each hit area is ≥24×24 CSS px, or meets a WCAG 2.2 SC 2.5.8 exception (spacing, equivalent, inline) named in the evidence with its measurement. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-035/results.md` |
| AC-2 | GIVEN the enlarged targets WHEN measured THEN no hit area overlaps a neighbouring target (transport row, globe toolbar, nav). | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-035/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-02.png` | if 035 IF035 02 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-03.png` | if 035 IF035 03 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-07.png` | if 035 IF035 07 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-08.png` | if 035 IF035 08 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-09.png` | if 035 IF035 09 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-10-locked.png` | if 035 IF035 10 locked | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-10-open.png` | if 035 IF035 10 open | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-12.png` | if 035 IF035 12 | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-15.png` | if 035 IF035 15 | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-035/if-035-IF035-17-note-scrolled.png` | if 035 IF035 17 note scrolled | see results.md |
| 11 | `sprint-011-head-2026-10-24/r1-probe/if-031-035-targets.png` | if 031 035 targets | see results.md |
| 12 | `sprint-011-head-2026-10-24/r1-probe/if-035-influence-note.png` | if 035 influence note | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-035/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
