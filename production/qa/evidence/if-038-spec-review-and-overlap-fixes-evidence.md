# Test Evidence: IF-038 Spec-review findings — label in name, Debrief Balance and invoice, no overlapping boxes

> **Story**: `production/epics/interface/story-038-spec-review-and-overlap-fixes.md`
> **Story Type**: UI
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of IF-038 on the final Sprint 11 build. Cases: `production/qa/test-cases/if-038-spec-review-and-overlap-fixes-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/if-038/results.md`. Scripted checks: R1 probe re-run on HEAD (`sprint-011-head-2026-10-24/r1-probe/run.log`, 152/152 PASS) and, for the shared surfaces, R2/R3/R4 (`sprint-011-head-2026-10-24/r2-sweep/`, `r3-focus/`, `r4-playtest-sweep/`).

**Acceptance criteria covered**: AC-1, AC-2, AC-3

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN every surface WHEN each button's or slider's first visible line with letters (more than one character) is compared with its accessible name THEN it appears there as whole words (WCAG 2.5.3): UNDERSTOOD ×3, `n UNREAD`, RECRUIT ×2, Item slots, DEPLOY TEAM, OPEN RESEARCH, BALANCE DATA, AUTHORIZE PROJECT, RESET ALL, the Quality segments, EXPORT JSON and SKIP TUTORIAL now start with their visible label. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-038/results.md` |
| AC-2 | GIVEN the Debrief WHEN Balance is open THEN Escape closes it and focus returns to BALANCE DATA; the invoice is a named scroll region (`Mission invoice`) with the P-15 cut-edge fade; the CAMPAIGN FAILED banner is `role="status"`. | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-038/results.md` |
| AC-3 | GIVEN every surface at 1280×720 and four text scales WHEN positioned boxes with text are compared THEN none covers another: the Brief recon readouts and target callout share one column on panel ground; the World Network inset tag clears both steppers; the HUD toasts clear the weapons bar and the comms panel gives back width as the weapons bar grows (also at ≤1360 px). The screen write-failure notice prints Red Hot words on a red frame (no amber: amber is money only). | PASS | Observed values per case in `sprint-011-head-2026-10-24/if-038/results.md` |

**Story verdict (Phase 5)**: PASS WITH NOTES

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/if-038/if-038-02-influence-note.png` | if 038 02 influence note | see results.md |
| 2 | `sprint-011-head-2026-10-24/if-038/if-038-04-roster-empty.png` | if 038 04 roster empty | see results.md |
| 3 | `sprint-011-head-2026-10-24/if-038/if-038-08-debrief-note.png` | if 038 08 debrief note | see results.md |
| 4 | `sprint-011-head-2026-10-24/if-038/if-038-09-balance-data.png` | if 038 09 balance data | see results.md |
| 5 | `sprint-011-head-2026-10-24/if-038/if-038-15-fade-off.png` | if 038 15 fade off | see results.md |
| 6 | `sprint-011-head-2026-10-24/if-038/if-038-15-fade-on.png` | if 038 15 fade on | see results.md |
| 7 | `sprint-011-head-2026-10-24/if-038/if-038-16-failed-banner.png` | if 038 16 failed banner | see results.md |
| 8 | `sprint-011-head-2026-10-24/if-038/if-038-17-brief-125-recon.png` | if 038 17 brief 125 recon | see results.md |
| 9 | `sprint-011-head-2026-10-24/if-038/if-038-18-brief-recon-100.png` | if 038 18 brief recon 100 | see results.md |
| 10 | `sprint-011-head-2026-10-24/if-038/if-038-18-brief-recon-110.png` | if 038 18 brief recon 110 | see results.md |
| 11 | `sprint-011-head-2026-10-24/if-038/if-038-18-brief-recon-125.png` | if 038 18 brief recon 125 | see results.md |
| 12 | `sprint-011-head-2026-10-24/if-038/if-038-18-brief-recon-90.png` | if 038 18 brief recon 90 | see results.md |
| 13 | `sprint-011-head-2026-10-24/if-038/if-038-19-inset-100.png` | if 038 19 inset 100 | see results.md |
| 14 | `sprint-011-head-2026-10-24/if-038/if-038-19-inset-110.png` | if 038 19 inset 110 | see results.md |
| 15 | `sprint-011-head-2026-10-24/if-038/if-038-19-inset-125.png` | if 038 19 inset 125 | see results.md |
| 16 | `sprint-011-head-2026-10-24/if-038/if-038-19-inset-90.png` | if 038 19 inset 90 | see results.md |
| 17 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1280-100.png` | if 038 22 comms 1280 100 | see results.md |
| 18 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1280-110.png` | if 038 22 comms 1280 110 | see results.md |
| 19 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1280-125.png` | if 038 22 comms 1280 125 | see results.md |
| 20 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1280-90.png` | if 038 22 comms 1280 90 | see results.md |
| 21 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1360-100.png` | if 038 22 comms 1360 100 | see results.md |
| 22 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1360-110.png` | if 038 22 comms 1360 110 | see results.md |
| 23 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1360-125.png` | if 038 22 comms 1360 125 | see results.md |
| 24 | `sprint-011-head-2026-10-24/if-038/if-038-22-comms-1360-90.png` | if 038 22 comms 1360 90 | see results.md |
| 25 | `sprint-011-head-2026-10-24/if-038/if-038-23-write-fail-card.png` | if 038 23 write fail card | see results.md |
| 26 | `sprint-011-head-2026-10-24/if-038/if-038-23-write-fail-research.png` | if 038 23 write fail research | see results.md |
| 27 | `sprint-011-head-2026-10-24/if-038/if-038-23-write-fail-world.png` | if 038 23 write fail world | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/if-038/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |

*Template: `.claude/docs/templates/test-evidence.md`*
