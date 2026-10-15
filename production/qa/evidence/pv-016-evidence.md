# Test Evidence: Balance Export and two-step Clear

> **Story**: `production/epics/persistence-and-validation/story-016-balance-export-and-two-step-clear.md`
> **Story Type**: UI
> **Date**: 2026-10-15
> **Tester**: Claude (Playwright, headed Chrome for Testing, 1280x720) — /team-qa sprint
> **Build / Commit**: `02491cf`

---

## What Was Tested

Balance Export and the two-step Clear. Export was run from two telemetry records produced by played missions (not seeded), and the downloaded file was opened and checked field by field. Clear arm / lapse / confirm was walked in the Sprint 6 smoke run and in the story's click-through.

**Acceptance criteria covered**: AC1, AC2, AC3, AC4

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC1 | GIVEN at least one telemetry record, WHEN Export JSON is used, THEN a local JSON file downloads and the action does not upload to an app origin. | PASS | `nexus-balance.json` downloaded; 0 network requests during Export (team-qa M-1) |
| AC2 | Clear once arms; records remain | PASS | Smoke s7 and `02-clear-armed-records-remain` |
| AC3 | Confirm empties Balance; campaign blob untouched | PASS | Smoke s7 and `03-clear-confirmed-balance-empty` |
| AC4 | GIVEN telemetry on and a non-abort Debrief, WHEN JSON is exported, THEN that record includes outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles. | PASS | Every field present in both won records of `m1-nexus-balance-export.json` |

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `pv-016/01-balance-two-records-1280x720.png` | Balance with two records | AC1 |
| 2 | `pv-016/02-clear-armed-records-remain-1280x720.png` | Clear armed, 2/60 still listed | AC2 |
| 3 | `pv-016/03-clear-confirmed-balance-empty-1280x720.png` | Empty Balance after confirm | AC3 |
| 4 | `pv-016/m1-01-balance-played-records-1280x720.png` | Balance with two played-mission records | AC1, AC4 |
| 5 | `pv-016/m1-nexus-balance-export.json` | The exported file | AC4 |

---

## Test Conditions

- **Game state at start**: clean origin, telemetry turned on through the Settings toggle, New Operation, two GLASS VEIL wins (one paid, one quiet replay)
- **Platform / hardware**: macOS (Darwin 25.5.0), Chrome for Testing, 1280x720, dev server
- **Framerate during test**: not measured this pass
- **Any special setup required**: missions played by the sim-order bot in god mode with extra ticks (harness assist)

---

## Observations

- ADR-0015 names `Balance.tsx` for Export; the code is in `src/ui/balanceActions.ts` (noted in the story already).

---

## Sign-Off

Lead-programmer sign-off **waived** by Marco Machado (project owner), 2026-10-15: a UI story is closed by its retained screenshots (template above), and the QA plan's sign-off request is withdrawn for this story. No sign-off row is kept, because every row here is treated as required.
