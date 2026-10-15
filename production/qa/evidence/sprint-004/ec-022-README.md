# EC-022 evidence — Invoice prints all five money lines, zeros included

**Date:** 2026-10-14 · **Revision:** 1a77ace + uncommitted EC-022 working tree (`src/ui/debriefInvoice.ts`, `src/ui/debriefInvoice.test.ts`, `src/ui/index.tsx`)
**Environment:** `npm run dev -- --strictPort` (port 4200), headless Chrome (Playwright chromium_headless_shell-1247), viewport 1280×720, a fresh browser context for each capture (clean save).
**Partial click-through:** Debrief screen only (docs/click-through.md step 5, inspect the debrief). No mission was played. Afterwards the server was stopped and port 4200 had no listener.

## Fixture seeding

The script loads the app and imports `/src/state/appStore.ts` through the Vite dev module graph. It prices a `MissionResult` with Economy's `priceOutcome` (`bonusDefs: {}`), sets `missionId`, and calls `setOutcome` with `applyKey = lastAppliedKey + 1`. Debrief's own `applyDebrief` then runs.

| Fixture | Mission | Reward | Won | Quiet | N |
|---|---|---|---|---|---|
| `win-collateral0` | m01 | 85,000 | yes | no | 0 |
| `zero-priced-win` | m01 | 0 (priced) | yes | no | 0 |
| `loss` | m01 | 85,000 | no | no | 2 |
| `quiet-replay-win` | m02 | 62,000 | yes | yes | 0 |

## Observations (DOM text and screenshots)

| Fixture | CONTRACT VALUE | COLLATERAL PENALTY | OPTIONAL BONUS | PAYOUT | ACCOUNT BALANCE | Case |
|---|---|---|---|---|---|---|
| win-collateral0 | 85,000 CR | 0 CR | 0 CR | +85,000 CR | 222,387 CR | AC4 |
| zero-priced-win | 0 CR | 0 CR | 0 CR | 0 CR | 137,387 CR | AC1 |
| loss | 85,000 CR | -10,000 CR | 0 CR | 0 CR | 128,450 CR | AC2 |
| quiet-replay-win | 62,000 CR | 0 CR | 0 CR | 0 CR | 132,619 CR | AC3 |

- All four fixtures print all five money lines.
- On a win, the balance includes the Tax that the ETA catch-up deposited. This is allowed by GDD §10: `new_balance − credits_before = net_payout + tax_deposits`.
- None of the captures has a page scroll, `.db-rows` has no internal scroll, no label or value element is clipped (`scrollWidth ≤ clientWidth`), and `.db-card` ends at 648–662px. There were 0 console errors.
- Text scales 90/110/125 were not captured. IF-011 already covers how `.db-rows` scrolls at the larger scales.

## Files

`ec-022-<fixture>-1280x720.png`, 4 images. Lead-programmer sign-off: pending.

## Re-capture 2026-10-14 (after the NOT APPLIED rule, commit c85960c)

The four original captures predate the owner decision (Economy GDD Closed Question 4): on a loss or quiet replay, Collateral and optional bonus keep priced values, print dim and carry ` — NOT APPLIED`. Re-captured on `1ebb680` (clean tree) with the same fixture seeding (`setOutcome` on a priced `MissionResult`, fresh context each, 1280x720, headless Chrome for Testing, dev server stopped afterwards, port 4200 free). Two fixtures added where the priced lines are non-zero.

| Fixture | CONTRACT VALUE | COLLATERAL PENALTY | OPTIONAL BONUS | PAYOUT | ACCOUNT BALANCE |
|---|---|---|---|---|---|
| win-collateral0 | 85,000 CR | 0 CR | 0 CR | +85,000 CR | 222,387 CR |
| zero-priced-win | 0 CR | 0 CR | 0 CR | 0 CR | 137,387 CR |
| loss | 85,000 CR | -10,000 CR — NOT APPLIED | 0 CR — NOT APPLIED | 0 CR | 128,450 CR |
| quiet-replay-win | 62,000 CR | 0 CR — NOT APPLIED | 0 CR — NOT APPLIED | 0 CR | 132,619 CR |
| loss-priced-lines (N=3, optional +9,000) | 62,000 CR | -15,000 CR — NOT APPLIED | +9,000 CR — NOT APPLIED | 0 CR | 128,450 CR |
| quiet-replay-priced-lines (N=3, optional +9,000) | 62,000 CR | -15,000 CR — NOT APPLIED | +9,000 CR — NOT APPLIED | 0 CR | 132,619 CR |

- Tagged rows use `rgb(93, 125, 117)` (`--ink-dim`); paid-win rows keep their default tone. No label or value clipped, no page scroll, `.db-card` bottom 648–662 px. Console: only the known `favicon.ico` 404.
- Files: `ec-022-<fixture>-1280x720.png`, 6 images (4 replaced, `loss-priced-lines` and `quiet-replay-priced-lines` new).
- Lead-programmer sign-off: still pending (rows left unchecked).

## Re-capture 2026-10-14 (after the ADR-0021 fix: stored collateral / netPayout)

Same six fixtures and method as above, after `priceOutcome` started storing `collateral` and `netPayout` and the invoice builder was split into row helpers. DOM text is unchanged for all six fixtures; no clipping, no page scroll, only the known `favicon.ico` 404. Reduced motion: with `:root.s-reduce-motion` the last three `.db-row`s are at opacity 1 within 60 ms of entering Debrief (0 without it, still staggering). Dev server stopped afterwards; port 4200 free.
