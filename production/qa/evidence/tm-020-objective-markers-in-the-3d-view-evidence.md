# Test Evidence: TM-020 Active objectives are marked in the 3D view

> **Story**: `production/epics/tactical-mission/story-020-objective-markers-in-the-3d-view.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of TM-020 on the final Sprint 11 build. Cases: `production/qa/test-cases/tm-020-objective-markers-in-the-3d-view-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/tm-020/results.md`.

**Acceptance criteria covered**: AC-1

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN an active, unfinished objective (required or optional, any kind but extract) WHEN the mission renders THEN a VIP Ice ground ring sits on its zone (its own zone, else its landmark, else the checkpoint) or, for a destroy, on each living device of its tag; required objectives also get a light beam; extraction keeps the city's own ring; done, failed and inactive objectives get none. The sim's zone check, the minimap and the markers use the same zone rule. Reduced motion stops the ring pulse. | PASS | Observed values per case in `sprint-011-head-2026-10-24/tm-020/results.md` |

**Story verdict (Phase 5)**: PASS (all 8 cases); lead sign-off open

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/tm-020/tm-020-01-required-gate.png` | tm 020 01 required gate | see results.md |
| 2 | `sprint-011-head-2026-10-24/tm-020/tm-020-02-console-required.png` | tm 020 02 console required | see results.md |
| 3 | `sprint-011-head-2026-10-24/tm-020/tm-020-02-server-optional.png` | tm 020 02 server optional | see results.md |
| 4 | `sprint-011-head-2026-10-24/tm-020/tm-020-03-relays-2.png` | tm 020 03 relays 2 | see results.md |
| 5 | `sprint-011-head-2026-10-24/tm-020/tm-020-03-relays-3.png` | tm 020 03 relays 3 | see results.md |
| 6 | `sprint-011-head-2026-10-24/tm-020/tm-020-04-after.png` | tm 020 04 after | see results.md |
| 7 | `sprint-011-head-2026-10-24/tm-020/tm-020-04-before.png` | tm 020 04 before | see results.md |
| 8 | `sprint-011-head-2026-10-24/tm-020/tm-020-05-server-failed.png` | tm 020 05 server failed | see results.md |
| 9 | `sprint-011-head-2026-10-24/tm-020/tm-020-06-extraction-only.png` | tm 020 06 extraction only | see results.md |
| 10 | `sprint-011-head-2026-10-24/tm-020/tm-020-06-extraction-start.png` | tm 020 06 extraction start | see results.md |
| 11 | `sprint-011-head-2026-10-24/tm-020/tm-020-07-reduced.png` | tm 020 07 reduced | see results.md |
| 12 | `sprint-011-head-2026-10-24/tm-020/tm-020-08-minimap-hc1-crop.png` | tm 020 08 minimap hc1 crop | see results.md |
| 13 | `sprint-011-head-2026-10-24/tm-020/tm-020-08-minimap-hc1.png` | tm 020 08 minimap hc1 | see results.md |
| 14 | `sprint-011-head-2026-10-24/tm-020/tm-020-08-minimap-hc2-crop.png` | tm 020 08 minimap hc2 crop | see results.md |
| 15 | `sprint-011-head-2026-10-24/tm-020/tm-020-08-minimap-hc2.png` | tm 020 08 minimap hc2 | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/tm-020/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |
| QA lead | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
