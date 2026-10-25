# Test Evidence: IF-025 Each Influence action prints its effect as visible text

> **Story**: `production/epics/interface/story-025-each-influence-action-prints-its-effect.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-025 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-025-each-influence-action-prints-its-effect-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-025/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the focused sector's three Influence actions WHEN rendered THEN each prints its effect (the `actionEffect` text) as static visible text on its own line under the button, not only in `title` / `aria-label`, without clipping at 1280×720 and text scales 90 / 100 / 110 / 125. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-025/results.md` |
| AC-2 | GIVEN an action that is disabled (`UNAFFORDABLE`, `COOLDOWN nH`, `NO TARGET`, `SECTOR LOCKED`) or `ACTIVE` WHEN rendered THEN its effect line still shows and never overlaps the status word. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-025/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-025/if-025-tc02-100.png` | if 025 tc02 100 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-100-expedite.png` | if 025 tc03 100 expedite | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-100-lobby.png` | if 025 tc03 100 lobby | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-100-stabilize.png` | if 025 tc03 100 stabilize | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-110-expedite.png` | if 025 tc03 110 expedite | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-110-lobby.png` | if 025 tc03 110 lobby | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-110-stabilize.png` | if 025 tc03 110 stabilize | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-125-expedite.png` | if 025 tc03 125 expedite | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-125-lobby.png` | if 025 tc03 125 lobby | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-125-stabilize.png` | if 025 tc03 125 stabilize | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-90-expedite.png` | if 025 tc03 90 expedite | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-90-lobby.png` | if 025 tc03 90 lobby | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-025/if-025-tc03-90-stabilize.png` | if 025 tc03 90 stabilize | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-100-expedite.png` | if 025 tc04 100 expedite | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-100-lobby.png` | if 025 tc04 100 lobby | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-100-stabilize.png` | if 025 tc04 100 stabilize | see results.md |
| 17 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-110-expedite.png` | if 025 tc04 110 expedite | see results.md |
| 18 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-110-lobby.png` | if 025 tc04 110 lobby | see results.md |
| 19 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-110-stabilize.png` | if 025 tc04 110 stabilize | see results.md |
| 20 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-125-expedite.png` | if 025 tc04 125 expedite | see results.md |
| 21 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-125-lobby.png` | if 025 tc04 125 lobby | see results.md |
| 22 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-125-stabilize.png` | if 025 tc04 125 stabilize | see results.md |
| 23 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-90-expedite.png` | if 025 tc04 90 expedite | see results.md |
| 24 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-90-lobby.png` | if 025 tc04 90 lobby | see results.md |
| 25 | `sprint-011-head-2026-10-24/if-025/if-025-tc04-90-stabilize.png` | if 025 tc04 90 stabilize | see results.md |
| 26 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-100-expedite.png` | if 025 tc05 100 expedite | see results.md |
| 27 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-100-lobby.png` | if 025 tc05 100 lobby | see results.md |
| 28 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-100-stabilize.png` | if 025 tc05 100 stabilize | see results.md |
| 29 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-110-expedite.png` | if 025 tc05 110 expedite | see results.md |
| 30 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-110-lobby.png` | if 025 tc05 110 lobby | see results.md |
| 31 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-110-stabilize.png` | if 025 tc05 110 stabilize | see results.md |
| 32 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-125-expedite.png` | if 025 tc05 125 expedite | see results.md |
| 33 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-125-lobby.png` | if 025 tc05 125 lobby | see results.md |
| 34 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-125-stabilize.png` | if 025 tc05 125 stabilize | see results.md |
| 35 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-90-expedite.png` | if 025 tc05 90 expedite | see results.md |
| 36 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-90-lobby.png` | if 025 tc05 90 lobby | see results.md |
| 37 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-90-stabilize.png` | if 025 tc05 90 stabilize | see results.md |
| 38 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-grayscale-expedite.png` | if 025 tc05 grayscale expedite | see results.md |
| 39 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-grayscale-lobby.png` | if 025 tc05 grayscale lobby | see results.md |
| 40 | `sprint-011-head-2026-10-24/if-025/if-025-tc05-grayscale-stabilize.png` | if 025 tc05 grayscale stabilize | see results.md |
| 41 | `sprint-011-head-2026-10-24/if-025/if-025-tc06-100.png` | if 025 tc06 100 | see results.md |
| 42 | `sprint-011-head-2026-10-24/if-025/if-025-tc06-110.png` | if 025 tc06 110 | see results.md |
| 43 | `sprint-011-head-2026-10-24/if-025/if-025-tc06-125.png` | if 025 tc06 125 | see results.md |
| 44 | `sprint-011-head-2026-10-24/if-025/if-025-tc06-90.png` | if 025 tc06 90 | see results.md |
| 45 | `sprint-011-head-2026-10-24/if-025/if-025-tc07-ops-end.png` | if 025 tc07 ops end | see results.md |
| 46 | `sprint-011-head-2026-10-24/if-025/if-025-tc07-sector-end.png` | if 025 tc07 sector end | see results.md |
| 47 | `sprint-011-head-2026-10-24/if-025/if-025-tc07-top.png` | if 025 tc07 top | see results.md |
| 48 | `sprint-011-head-2026-10-24/if-025/if-025-tc08-100.png` | if 025 tc08 100 | see results.md |
| 49 | `sprint-011-head-2026-10-24/if-025/if-025-tc08-125.png` | if 025 tc08 125 | see results.md |
| 50 | `sprint-011-head-2026-10-24/r1-probe/if-025-actions-100.png` | if 025 actions 100 | see results.md |
| 51 | `sprint-011-head-2026-10-24/r1-probe/if-025-actions-110.png` | if 025 actions 110 | see results.md |
| 52 | `sprint-011-head-2026-10-24/r1-probe/if-025-actions-125.png` | if 025 actions 125 | see results.md |
| 53 | `sprint-011-head-2026-10-24/r1-probe/if-025-actions-90.png` | if 025 actions 90 | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-025/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
