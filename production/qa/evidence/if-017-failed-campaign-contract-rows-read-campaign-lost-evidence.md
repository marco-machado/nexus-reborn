# Test Evidence: IF-017 Failed-campaign contract rows read CAMPAIGN LOST

> **Story**: `production/epics/interface/story-017-failed-campaign-contract-rows-read-campaign-lost.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-017 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-017-failed-campaign-contract-rows-read-campaign-lost-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-017/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a failed campaign WHEN OPEN CONTRACTS is read THEN every contract row's visible lock reason and the cause in its `aria-label` read `CAMPAIGN LOST` (as the Scan markers already do), never `REQUIRES INTEL LVL n`. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-017/results.md` |
| AC-2 | GIVEN a campaign that has not failed WHEN an intel-locked row is read THEN it still reads `REQUIRES INTEL LVL n`, and clicking a locked row on a failed campaign leaves the phase on the World Network. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-017/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-017/if-017-failed-generated-row.png` | if 017 failed generated row | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-017/if-017-failed-marker-tip.png` | if 017 failed marker tip | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-017/if-017-not-failed-locked-row.png` | if 017 not failed locked row | see results.md |
| 4 | `sprint-011-head-2026-10-24/r1-probe/if-016-017-failed.png` | if 016 017 failed | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-017/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
