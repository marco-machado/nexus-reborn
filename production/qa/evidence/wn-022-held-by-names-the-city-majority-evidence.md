# Test Evidence: WN-022 HELD BY names the city majority; the card stops saying Control is ownership

> **Story**: `production/epics/world-network/story-022-held-by-names-the-city-majority.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of WN-022 on the final Sprint 11 build. Cases: `production/qa/test-cases/wn-022-held-by-names-the-city-majority-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/wn-022/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a sector panel WHEN it prints THEN a HELD BY row before TAX YIELD names the majority holder and the count (`NEXUS GLOBAL // 2 OF 3 CITIES`, teal; another corp in the default tone), or `CONTESTED // CITIES SPLIT 1-1-1` when no corp holds a majority; the words carry the state, not the colour. | PASS | Observed values per case in `sprint-011-head-2026-10-24/wn-022/results.md` |
| AC-2 | GIVEN the orientation card WHEN it is read THEN THE JOB says a sector pays when Nexus holds most of its cities and a win hands the mission city to Nexus, and the CONTROL line says Control is the order kept in the sector, not who holds it (pointing at HELD BY). | PASS | Observed values per case in `sprint-011-head-2026-10-24/wn-022/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/wn-022/wn-022-an.png` | wn 022 an | see results.md |
| 2 | `sprint-011-head-2026-10-24/wn-022/wn-022-card-100.png` | wn 022 card 100 | see results.md |
| 3 | `sprint-011-head-2026-10-24/wn-022/wn-022-card-110.png` | wn 022 card 110 | see results.md |
| 4 | `sprint-011-head-2026-10-24/wn-022/wn-022-card-125.png` | wn 022 card 125 | see results.md |
| 5 | `sprint-011-head-2026-10-24/wn-022/wn-022-card-90.png` | wn 022 card 90 | see results.md |
| 6 | `sprint-011-head-2026-10-24/wn-022/wn-022-card-hc.png` | wn 022 card hc | see results.md |
| 7 | `sprint-011-head-2026-10-24/wn-022/wn-022-contested-sa.png` | wn 022 contested sa | see results.md |
| 8 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-contested-row.png` | wn 022 gray contested row | see results.md |
| 9 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-contested.png` | wn 022 gray contested | see results.md |
| 10 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-nexus-row.png` | wn 022 gray nexus row | see results.md |
| 11 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-nexus.png` | wn 022 gray nexus | see results.md |
| 12 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-other-row.png` | wn 022 gray other row | see results.md |
| 13 | `sprint-011-head-2026-10-24/wn-022/wn-022-gray-other.png` | wn 022 gray other | see results.md |
| 14 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-na-100.png` | wn 022 held na 100 | see results.md |
| 15 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-na-110.png` | wn 022 held na 110 | see results.md |
| 16 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-na-125.png` | wn 022 held na 125 | see results.md |
| 17 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-na-90.png` | wn 022 held na 90 | see results.md |
| 18 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-na-hc.png` | wn 022 held na hc | see results.md |
| 19 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-oc-100.png` | wn 022 held oc 100 | see results.md |
| 20 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-oc-110.png` | wn 022 held oc 110 | see results.md |
| 21 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-oc-125.png` | wn 022 held oc 125 | see results.md |
| 22 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-oc-90.png` | wn 022 held oc 90 | see results.md |
| 23 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-oc-hc.png` | wn 022 held oc hc | see results.md |
| 24 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-sa-100.png` | wn 022 held sa 100 | see results.md |
| 25 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-sa-110.png` | wn 022 held sa 110 | see results.md |
| 26 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-sa-125.png` | wn 022 held sa 125 | see results.md |
| 27 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-sa-90.png` | wn 022 held sa 90 | see results.md |
| 28 | `sprint-011-head-2026-10-24/wn-022/wn-022-held-sa-hc.png` | wn 022 held sa hc | see results.md |
| 29 | `sprint-011-head-2026-10-24/wn-022/wn-022-nexus-na.png` | wn 022 nexus na | see results.md |
| 30 | `sprint-011-head-2026-10-24/wn-022/wn-022-other-eu.png` | wn 022 other eu | see results.md |
| 31 | `sprint-011-head-2026-10-24/wn-022/wn-022-other-oc.png` | wn 022 other oc | see results.md |
| 32 | `sprint-011-head-2026-10-24/wn-022/wn-022-owner-not-control.png` | wn 022 owner not control | see results.md |
| 33 | `sprint-011-head-2026-10-24/wn-022/wn-022-row-order-na.png` | wn 022 row order na | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/wn-022/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
