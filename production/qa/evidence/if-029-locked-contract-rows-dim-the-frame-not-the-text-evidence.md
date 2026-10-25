# Test Evidence: IF-029 Locked contract rows dim the frame, not the text, and their reason prints in Red Hot

> **Story**: `production/epics/interface/story-029-locked-contract-rows-dim-the-frame-not-the-text.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-029 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-029-locked-contract-rows-dim-the-frame-not-the-text-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-029/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a locked OPEN CONTRACTS row (intel-locked, and failed campaign) in default and high-contrast modes WHEN it renders THEN every text run in the row has effective opacity 1 and is ≥4.5:1 as rendered (the reason in Red Hot; codename, `TYPE // CITY` and chips in Ink or brighter), and the row still reads as locked through its dimmed frame, the lock glyph and the reason text. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-029/results.md` |
| AC-2 | GIVEN a locked row and an open row viewed in grayscale WHEN compared THEN the locked row is told apart by its lock glyph (≥3:1 non-text floor) and reason text, and it keeps `aria-disabled`. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-029/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-029/tc05-default.png` | tc05 default | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-029/tc05-hc.png` | tc05 hc | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-029/tc06-as.png` | tc06 as | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-029/tc06-eu.png` | tc06 eu | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-029/tc06-na.png` | tc06 na | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-029/tc07-as-default.png` | tc07 as default | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-029/tc07-as-hc.png` | tc07 as hc | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-029/tc08-failed-default-as.png` | tc08 failed default as | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-029/tc08-failed-default-eu.png` | tc08 failed default eu | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-029/tc08-failed-default-na.png` | tc08 failed default na | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-029/tc09-failed-hc-as.png` | tc09 failed hc as | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-029/tc09-failed-hc-eu.png` | tc09 failed hc eu | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-029/tc09-failed-hc-na.png` | tc09 failed hc na | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-029/tc10-gray-as.png` | tc10 gray as | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-029/tc10-gray-eu-scrolled.png` | tc10 gray eu scrolled | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-029/tc10-gray-eu.png` | tc10 gray eu | see results.md |
| 17 | `sprint-011-head-2026-10-24/if-029/tc10-gray-na.png` | tc10 gray na | see results.md |
| 18 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-default-as.png` | tc11 glyph default as | see results.md |
| 19 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-default-eu.png` | tc11 glyph default eu | see results.md |
| 20 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-gray-as.png` | tc11 glyph gray as | see results.md |
| 21 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-gray-eu.png` | tc11 glyph gray eu | see results.md |
| 22 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-hc-as.png` | tc11 glyph hc as | see results.md |
| 23 | `sprint-011-head-2026-10-24/if-029/tc11-glyph-hc-eu.png` | tc11 glyph hc eu | see results.md |
| 24 | `sprint-011-head-2026-10-24/r1-probe/if-029-grayscale-locked-vs-open.png` | if 029 grayscale locked vs open | see results.md |
| 25 | `sprint-011-head-2026-10-24/r1-probe/if-029-locked-default.png` | if 029 locked default | see results.md |
| 26 | `sprint-011-head-2026-10-24/r1-probe/if-029-locked-hc.png` | if 029 locked hc | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-029/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
