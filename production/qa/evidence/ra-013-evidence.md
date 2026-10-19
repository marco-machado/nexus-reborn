# Test Evidence: Injury presentation and RA-009 re-run (Sprint 7 QA)

> **Stories**: `production/epics/roster-and-assembly/story-013-*.md`, `story-016-*.md`, `story-009-assembly-opens-without-auto-assign-injured-dossier.md`
> **Story Type**: UI (presentation of Logic/Integration rules)
> **Date**: 2026-10-16
> **Tester**: Claude (in-app browser, `/team-qa sprint`)
> **Build / Commit**: `cfd2066`, clean tree, Vite dev server

## What Was Tested

The Debrief's Injured line and the Assembly presentation of an injured operative through recovery (RA-013 classification at `INJURY_HP_FRAC` 0.35, RA-016 recovery on strategic sync, RA-009 AC 1/AC 2), plus a frame-time reading on World Network and Assembly. Case-by-case results: `production/qa/test-cases/ra-013-injury-presentation-cases.md` and `ra-009-assembly-opens-without-auto-assign-injured-dossier-cases.md` (Execution Record sections).

## Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|---|---|---|
| RA-013 | Survivor ending ≤ 0.35 of max HP is Injured with recovery hours | PASS | Sim win: MARA f 0.294 → `18H RECOVERY` |
| RA-013 | Survivor above 0.35 stays Ready | PASS | TORQ f 0.559 |
| RA-016 | Injured flips to READY when strategic time passes recovery, including on Assembly | PASS | GHOST at t 98,799 vs `recoverAtT` 98,743 |
| RA-009 AC 1 | Assembly opens with all bays empty after the debrief | PASS | constructed fixture |
| RA-009 AC 2 | Injured dossier inspectable, assign key disabled with tooltip | PASS | constructed fixture |

## Screenshots

| # | Filename | What It Shows | Criterion |
|---|---|---|---|
| 1 | `ra-013/01-debrief-sim-win-injured-mara-18h.jpg` | Debrief after a sim win: KIA GHOST, DART; INJURED // MARA 18H RECOVERY (captured at 800x600; the viewport emulation had been cleared) | RA-013 |
| 2 | `ra-013/02-assembly-fixture-raven-injured-dossier.jpg` | Constructed fixture: Assembly, RAVEN dossier CONDITION: INJURED, Injured rows greyed | RA-009 AC 2 |
| 3 | `ra-013/03-assembly-fixture-empty-bays-125pct.jpg` | Constructed fixture: 0/4 assigned, 4 empty bays, Deploy subline ASSIGN AT LEAST ONE READY OPERATIVE, 125% text scale | RA-009 AC 1, clipping |

## Test Conditions

- Fresh New Operation each run; fixture rows labelled "constructed fixture".
- macOS, Vite dev server on port 4200, viewport 1280x720 emulated.
- Frame time: p95 ≤ 9 ms on both screens, 0 frames over 50 ms.
- Text scale set through `useSettingsStore.setTextScale` (the action the Settings buttons call).

## Observations

- RA9-02's precondition in the case file needs a contract selected. After RETURN TO WORLD NETWORK the contract is cleared, and the refusal correctly reads NO CONTRACT SELECTED (ADR-0019 order).
- A Glass Veil win's 2-day ETA always covers the maximum 48 h recovery, so a winner's injury is never visible in Assembly after a win on that contract. This follows from ADR-0018 catch-up and is not a defect.

## Sign-Off

| Role | Name | Date | Signature |
|---|---|---|---|
| QA tester | Marco Machado | 2026-10-19 | [x] Approved |
| Story owner (ui-programmer, lean mode) | Marco Machado | 2026-10-19 | [x] Approved |

Signed with the Assembly injury presentation accepted on its labelled fixture (Sprint 7 C-8, owner ruling 2026-10-19: no natural path reaches it after a win).
