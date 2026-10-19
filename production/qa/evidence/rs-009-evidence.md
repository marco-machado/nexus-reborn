# RS-009 evidence: remaining time label appears only after sync

**Date**: 2026-10-14 | **Viewport**: 1280x720 (Browser pane, `npm run dev`; screenshots saved at 800x450 scale)

## Screens exercised

- Main menu → CONTINUE (saved dev operation) → World Network → RESEARCH tab.
- Research: selected the researched project ADV. PROPELLANTS, then selected HYPERVELOCITY CORE and authorized it.

## Observed

| File | What it shows |
|---|---|
| `rs-009/01-researched-no-countdown-1280x720.jpg` | Researched project selected, all labs idle: no remaining label anywhere. |
| `rs-009/02-active-remaining-label-1280x720.jpg` | HYPERVELOCITY CORE running: lab row shows `3:55:17 REMAINING`, detail Progress block shows `3:55:17 REMAINING`. Nothing clipped. |

DOM query just after authorizing: two `[data-testid=rs-remaining]` nodes, text `3:59:00 REMAINING`, `data-remaining-sec="14340"`, and neither overflows its box.

## Covered by automated tests, not by the screenshots

- No label at t = 7199 before sync, label reads 1 after `sync(7199)`, and `lastSyncT === 7199`. See `src/ui/remainingLabel.test.ts`, which renders the label to static markup and queries the test selector. A live clock syncs every 50 ms batch, so the pre-sync frame cannot be held on screen.

## Resolved 2026-10-19

- Paint format `H:MM:SS` confirmed by the owner (P-22), recorded in `design/gdd/interface.md` (Research row).
- Lead-programmer sign-off: Marco Machado, 2026-10-19, [x] Approved.
- The two nodes sharing `data-testid="rs-remaining"` are intended (one `RemainingLabel` component in two places); recorded in story RS-009 Completion Notes.
