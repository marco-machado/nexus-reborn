# Test Evidence: IF-023 Remove the duplicate left INFLUENCE panel

> **Story**: `production/epics/interface/story-023-remove-the-duplicate-left-influence-panel.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-023 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-023-remove-the-duplicate-left-influence-panel-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-023/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the World Network at 1280×720 and text scales 90 / 100 / 110 / 125 WHEN it renders THEN the left column holds SECTORS only (no INFLUENCE panel), the header still prints Influence, and nothing clips. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-023/results.md` |
| AC-2 | GIVEN an Influence spend or a Debrief award WHEN the World Network shows THEN the header Influence carries the new value in the same frame, so no Influence figure is lost with the panel. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-023/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-023/if-023-banner-complete-125.png` | if 023 banner complete 125 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-023/if-023-banner-failed-125.png` | if 023 banner failed 125 | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-023/if-023-card-100.png` | if 023 card 100 | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-023/if-023-card-110.png` | if 023 card 110 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-023/if-023-card-125.png` | if 023 card 125 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-023/if-023-card-90.png` | if 023 card 90 | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-023/if-023-played-a1-world-start.png` | if 023 played a1 world start | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-023/if-023-played-a2-world-start.png` | if 023 played a2 world start | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-023/if-023-sectors-scrolled-100.png` | if 023 sectors scrolled 100 | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-023/if-023-sectors-scrolled-110.png` | if 023 sectors scrolled 110 | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-023/if-023-sectors-scrolled-125.png` | if 023 sectors scrolled 125 | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-023/if-023-sectors-scrolled-90.png` | if 023 sectors scrolled 90 | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-023/if-023-seeded-debrief.png` | if 023 seeded debrief | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-023/if-023-seeded-return-first-frame.png` | if 023 seeded return first frame | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-023/if-023-spend-active.png` | if 023 spend active | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-023/tc10/if-023-debrief-award.png` | if 023 debrief award | see results.md |
| 17 | `sprint-011-head-2026-10-24/if-023/tc10/if-023-return-award.png` | if 023 return award | see results.md |
| 18 | `sprint-011-head-2026-10-24/if-023/tc10/tc10-mission-start.png` | tc10 mission start | see results.md |
| 19 | `sprint-011-head-2026-10-24/if-023/tc10/tc10-world-start.png` | tc10 world start | see results.md |
| 20 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-100.png` | if 023 024 world 100 | see results.md |
| 21 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-110.png` | if 023 024 world 110 | see results.md |
| 22 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-125.png` | if 023 024 world 125 | see results.md |
| 23 | `sprint-011-head-2026-10-24/r1-probe/if-023-024-world-90.png` | if 023 024 world 90 | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-023/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
