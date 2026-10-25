# Test Evidence: IF-028 Feed times and the Timeline axis move off Ink Faint

> **Story**: `production/epics/interface/story-028-feed-times-and-timeline-axis-move-off-ink-faint.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-028 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-028-feed-times-and-timeline-axis-move-off-ink-faint-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-028/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the Feed and the Timeline in default mode WHEN measured as rendered THEN Feed times and the axis labels print in Ink at ≥4.5:1, and no text run on the screen uses Ink Faint. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-028/results.md` |
| AC-2 | GIVEN the Timeline and Feed WHEN rendered THEN the axis `NOW` stays teal, tone-coloured Feed lines keep their tone, and high contrast does not regress. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-028/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-028/if-028-axis-live.png` | if 028 axis live | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-028/if-028-axis-review.png` | if 028 axis review | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-028/if-028-feed-times-default.png` | if 028 feed times default | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-028/if-028-feed-tones-default.png` | if 028 feed tones default | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-028/if-028-hc-review.png` | if 028 hc review | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-028/if-028-hc.png` | if 028 hc | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-028/if-028-opening-card-sweep.png` | if 028 opening card sweep | see results.md |
| 8 | `sprint-011-head-2026-10-24/r1-probe/state-crisis.png` | state crisis | see results.md |
| 9 | `sprint-011-head-2026-10-24/r1-probe/state-failed.png` | state failed | see results.md |
| 10 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-critical.png` | state garrison critical | see results.md |
| 11 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-secure.png` | state garrison secure | see results.md |
| 12 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-strained.png` | state garrison strained | see results.md |
| 13 | `sprint-011-head-2026-10-24/r1-probe/state-influence-note.png` | state influence note | see results.md |
| 14 | `sprint-011-head-2026-10-24/r1-probe/state-intel2.png` | state intel2 | see results.md |
| 15 | `sprint-011-head-2026-10-24/r1-probe/state-opening-card.png` | state opening card | see results.md |
| 16 | `sprint-011-head-2026-10-24/r1-probe/state-opening.png` | state opening | see results.md |
| 17 | `sprint-011-head-2026-10-24/r1-probe/state-pressure.png` | state pressure | see results.md |
| 18 | `sprint-011-head-2026-10-24/r1-probe/state-review.png` | state review | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-028/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
