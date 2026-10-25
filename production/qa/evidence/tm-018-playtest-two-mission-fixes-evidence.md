# Test Evidence: TM-018 Playtest 2 mission fixes — no destroy soft-lock, legible grenades and devices, camera taught

> **Story**: `production/epics/tactical-mission/story-018-playtest-two-mission-fixes.md`
> **Story Type**: Logic (AC-2/AC-3 visual parts)
> **Date**: 2026-10-24 (runs into 2026-10-25)
> **Tester**: Claude, /team-qa sprint (autonomous): qa-tester agents ran the cases headless in Chrome for Testing
> **Build / Commit**: HEAD `131a5c1` (last `src/` change `ab9935c`); the only uncommitted `src/` changes are three test files that the app never imports

---

## What Was Tested

Every acceptance criterion of TM-018 on the final Sprint 11 build. Cases: `production/qa/test-cases/tm-018-playtest-two-mission-fixes-cases.md`. Results, with observed values for each case: `sprint-011-head-2026-10-24/tm-018/results.md`.

**Acceptance criteria covered**: AC-1, AC-2, AC-3

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN a required destroy objective that is active, no hostile in sight, and a free-fire operative in weapon range and line of sight of one of its devices WHEN the sim runs THEN the operative takes the device up as a target and gunfire reduces it; an optional destroy's device and a Hold Fire operative are never auto-targeted; Attack on a Device is still a no-op (AC 5d). | PASS | Observed values per case in `sprint-011-head-2026-10-24/tm-018/results.md` |
| AC-2 | GIVEN a destroyed device WHEN it renders THEN its emissive core is hidden (it collapses and goes dark), so it does not read as live from the play camera. | PASS | Observed values per case in `sprint-011-head-2026-10-24/tm-018/results.md` |
| AC-3 | GIVEN grenade targeting armed WHEN the pointer moves over the ground THEN a Red Hot ring of the real blast radius (`GRENADE_RADIUS`, 3.5 m) follows it; the ITEMS tutorial step names the grenade key and says the blast hurts everyone inside the ring, the squad included; the MOVEMENT step names the pan keys, the wheel zoom and the recenter key. | PASS | Observed values per case in `sprint-011-head-2026-10-24/tm-018/results.md` |

**Story verdict (Phase 5)**: PASS; lead sign-off open

---

## Screenshots / Video

Every file listed below is on disk. All captures are 1280×720 unless the file name gives another size.

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `sprint-011-head-2026-10-24/tm-018/hint-grenade-2.png` | hint grenade 2 | see results.md |
| 2 | `sprint-011-head-2026-10-24/tm-018/hint-grenade.png` | hint grenade | see results.md |
| 3 | `sprint-011-head-2026-10-24/tm-018/relay-dead.png` | relay dead | see results.md |
| 4 | `sprint-011-head-2026-10-24/tm-018/relay-live.png` | relay live | see results.md |
| 5 | `sprint-011-head-2026-10-24/tm-018/relay-other-d2-dead.png` | relay other d2 dead | see results.md |
| 6 | `sprint-011-head-2026-10-24/tm-018/relay-other-d2.png` | relay other d2 | see results.md |
| 7 | `sprint-011-head-2026-10-24/tm-018/relay-other-d3-alive.png` | relay other d3 alive | see results.md |
| 8 | `sprint-011-head-2026-10-24/tm-018/relay-other-d3.png` | relay other d3 | see results.md |
| 9 | `sprint-011-head-2026-10-24/tm-018/ring-a.png` | ring a | see results.md |
| 10 | `sprint-011-head-2026-10-24/tm-018/ring-b.png` | ring b | see results.md |
| 11 | `sprint-011-head-2026-10-24/tm-018/ring-radius.png` | ring radius | see results.md |
| 12 | `sprint-011-head-2026-10-24/tm-018/s0-brief.png` | s0 brief | see results.md |
| 13 | `sprint-011-head-2026-10-24/tm-018/s0-world.png` | s0 world | see results.md |
| 14 | `sprint-011-head-2026-10-24/tm-018/tut-1.png` | tut 1 | see results.md |
| 15 | `sprint-011-head-2026-10-24/tm-018/tut-2.png` | tut 2 | see results.md |
| 16 | `sprint-011-head-2026-10-24/tm-018/tut-6.png` | tut 6 | see results.md |
| 17 | `sprint-011-head-2026-10-24/tm-018/zoom-in.png` | zoom in | see results.md |
| 18 | `sprint-011-head-2026-10-24/tm-018/zoom-out.png` | zoom out | see results.md |

---

## Test Conditions

- **Game state at start**: New Operation (localStorage cleared), with states set through the app's own stores as each case's Preconditions name them. Assists are listed in results.md.
- **Platform / hardware**: macOS (Darwin 25.5), headless Chrome for Testing 1247 (playwright-core), viewport 1280×720 unless the case says otherwise; `npm run dev` on port 4200, restarted before the runs of record
- **Framerate during test**: not measured (layout, colour and DOM checks only). The frame budget is the smoke check's item 8.

---

## Observations

See the Notes section of `sprint-011-head-2026-10-24/tm-018/results.md`. None of them is an acceptance-criterion failure.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (lead-programmer / designer) | lead-programmer agent (Claude), on the owner's instruction | 2026-10-25 | [x] Approved — AC-1 code and tests reviewed; AC-2 core mesh `visible:false` on the next frame and no glow in `relay-dead.png`; AC-3 ring 3.5 m within 1.5 px and follows the pointer; untouched between `131a5c1` and `93c58e0` |

*Template: `.claude/docs/templates/test-evidence.md`*
