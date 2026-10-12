# Test Evidence: IF-009 Result display, Debrief entry delay, quiet replay banner

> **Story**: `production/epics/interface/story-009-result-display-debrief-entry-delay-and-quiet-replay-ban.md`
> **Story Type**: UI
> **Date**: 2026-10-12
> **Tester**: Claude (headless Chrome, /team-qa sprint, MC-2)
> **Build / Commit**: 879bb68

---

## What Was Tested

This was a live spot check of the existing captures `if-009/01–06` after the later `src/ui` commits (27fd76f, f777b18, 96b9b05). Glass Veil was played to a win, then aborted, then replayed to a loss. The run used only store actions the buttons call and public `WorldApi` orders. It checked:
- the in-mission result banners;
- the Debrief entry delay, including while paused;
- the quiet-replay Debrief for won and lost;
- the two-step Abort.

**Acceptance criteria covered**: AC15, AC16

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC15 | The result displays while still in Mission, and Debrief opens after the 2.5 s Tactical delay. The delay does not progress while paused. Abort emits no invoice. | PASS | The won and lost banners showed with phase `mission`. Sim time stayed frozen over 4 s paused. The won-path delay measured 2.49 s of sim time (one frame of sampling). Abort: no Debrief, and the key, credits and `contractsWon` stayed unchanged. The catch-up case is covered by `src/game/world.test.ts` (AC15 block). |
| AC16 | A quiet-replay Debrief reads `REPLAY // FEE ALREADY COLLECTED`. | PASS | Won (fixture) and lost (live replay) both read it, with PAYOUT 0 CR. |

---

## Screenshots / Video

The references `if-009/01–06` are unchanged because there was no visible diff. This run's captures are kept alongside them:

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `if-009/mc2-2026-10-12/mc2-01-mission-result-won-1280x720.png` | Live win banner, objectives ticked, phase mission | AC15 |
| 2 | `if-009/mc2-2026-10-12/mc2-02-mission-result-lost-1280x720.png` | Live squad-eliminated banner | AC15 |
| 3 | `if-009/mc2-2026-10-12/mc2-03-debrief-quiet-replay-won-1280x720.png` | Quiet-replay won Debrief | AC16 |
| 4 | `if-009/mc2-2026-10-12/mc2-04-debrief-quiet-replay-lost-1280x720.png` | Quiet-replay lost Debrief (mid row-stagger) | AC16 |
| 5 | `if-009/mc2-2026-10-12/mc2-05-pause-menu-abort-1280x720.png` | Pause menu, Abort armed (`CONFIRM?`) | AC15 (abort) |
| 6 | `if-009/mc2-2026-10-12/mc2-06-after-abort-world-1280x720.png` | After the confirmed abort | AC15 (abort) |
| 7 | `if-009/mc2-2026-10-12/mc2-won-debrief-1280x720.png` | First-clear Debrief, CONTRACT FULFILLED | AC15 |

---

## Test Conditions

- **Game state at start**: New Operation in a fresh context. Contract m01 (Glass Veil, seed 20870514) with the default squad.
- **Platform / hardware**: macOS, headless Chrome for Testing, 1280×720
- **Framerate during test**: not measured in this run (the smoke-2026-10-12 sample was a steady 60 fps)
- **Any special setup required**: The order script is in the IF009-TC01 Actual Result. The README fixture was used for the quiet-replay won Debrief only.

---

## Observations

- A quiet-replay win pays 0 CR, but credits still rose by about 4,000 CR. That is tax yield from the win ETA catch-up (`src/state/debrief.ts:56` advances ETA on any win). This is consistent with WN-002 and the GDD, which waive only the fee, so it is not a bug. A designer may want to confirm that a replay should cost and yield ETA days.
- The lost-run delay sample was invalid because of a harness sampling glitch. Pause holding the phase at `mission` was observed live, and the unit tests assert the exact 2.5 s.
- The old reference 01 was staged at mission start. This run's capture is a real win.
- `appStore.outcome` still holds the previous mission's outcome during a new mission (it was seen on the replay). It isn't read in Mission and the apply key guards it. It is noted only.

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead (art-director / designer) | | | [ ] Approved |
