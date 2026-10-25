# Test Evidence: IF-026 World Network type meets the size floors

> **Story**: `production/epics/interface/story-026-world-network-type-meets-the-size-floors.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-026 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-026-world-network-type-meets-the-size-floors-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-026/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN the World Network at 1280×720, text scale 100%, in each state (opening desk; focused sector at each Garrison state; pressure; crisis; Review; failed campaign; first-visit card showing; Influence moment note showing) WHEN the computed font-size of every visible text node is measured THEN every run is ≥10 px, and these readout runs are ≥12 px: header resource values, sector names, CONTROL and UNREST values (rows and panel), TAX YIELD, TAX PAID and GARRISON values, contract codenames, the CLOCK SPEED value, the time code. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-026/results.md` |
| AC-2 | GIVEN text scale 125 after the size change WHEN the World Network, Research, Brief and Assembly render at 1280×720 THEN nothing clips (overflow scrolls, P-15), including the shared header resources. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-026/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-026/tc13-intel2.png` | tc13 intel2 | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-026/tc13-review.png` | tc13 review | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-026/tc14-opening-globe.png` | tc14 opening globe | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-026/tc19-brief-threat-125.png` | tc19 brief threat 125 | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-026/tc22-brief-125-scroll0.png` | tc22 brief 125 scroll0 | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-026/tc22-brief-125-scroll1.png` | tc22 brief 125 scroll1 | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-026/tc22-team-125-scroll0.png` | tc22 team 125 scroll0 | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-026/tc22-team-125-scroll1.png` | tc22 team 125 scroll1 | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-026/tc22-world-125-scroll0.png` | tc22 world 125 scroll0 | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-026/tc22-world-125-scroll1.png` | tc22 world 125 scroll1 | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-026/tc22-world-125-scroll2.png` | tc22 world 125 scroll2 | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-026/tc22-world-125-scroll3.png` | tc22 world 125 scroll3 | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-026/tc23-map-125.png` | tc23 map 125 | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-026/triage/influence-note-up.png` | influence note up | see results.md |
| 15 | `sprint-011-head-2026-10-24/r1-probe/if-026-brief-125.png` | if 026 brief 125 | see results.md |
| 16 | `sprint-011-head-2026-10-24/r1-probe/if-026-research-125.png` | if 026 research 125 | see results.md |
| 17 | `sprint-011-head-2026-10-24/r1-probe/if-026-review-100.png` | if 026 review 100 | see results.md |
| 18 | `sprint-011-head-2026-10-24/r1-probe/if-026-review-110.png` | if 026 review 110 | see results.md |
| 19 | `sprint-011-head-2026-10-24/r1-probe/if-026-review-125.png` | if 026 review 125 | see results.md |
| 20 | `sprint-011-head-2026-10-24/r1-probe/if-026-review-90.png` | if 026 review 90 | see results.md |
| 21 | `sprint-011-head-2026-10-24/r1-probe/if-026-team-125.png` | if 026 team 125 | see results.md |
| 22 | `sprint-011-head-2026-10-24/r1-probe/if-026-world-125.png` | if 026 world 125 | see results.md |
| 23 | `sprint-011-head-2026-10-24/r1-probe/state-crisis.png` | state crisis | see results.md |
| 24 | `sprint-011-head-2026-10-24/r1-probe/state-failed.png` | state failed | see results.md |
| 25 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-critical.png` | state garrison critical | see results.md |
| 26 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-secure.png` | state garrison secure | see results.md |
| 27 | `sprint-011-head-2026-10-24/r1-probe/state-garrison-strained.png` | state garrison strained | see results.md |
| 28 | `sprint-011-head-2026-10-24/r1-probe/state-influence-note.png` | state influence note | see results.md |
| 29 | `sprint-011-head-2026-10-24/r1-probe/state-intel2.png` | state intel2 | see results.md |
| 30 | `sprint-011-head-2026-10-24/r1-probe/state-opening-card.png` | state opening card | see results.md |
| 31 | `sprint-011-head-2026-10-24/r1-probe/state-opening.png` | state opening | see results.md |
| 32 | `sprint-011-head-2026-10-24/r1-probe/state-pressure.png` | state pressure | see results.md |
| 33 | `sprint-011-head-2026-10-24/r1-probe/state-review.png` | state review | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-026/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
