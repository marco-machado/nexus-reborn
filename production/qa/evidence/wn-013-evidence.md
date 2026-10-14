# Test Evidence: WN-013 Antarctica stays hidden; Focus cycle skips it; Focus Tax figure prints

> **Story**: `production/epics/world-network/story-013-antarctica-stays-hidden-focus-cycle-skips-it-focus-tax.md`
> **Story Type**: UI
> **Date**: 2026-10-13
> **Tester**: Claude (automated click-through via /team-qa, autonomous mode)
> **Build / Commit**: 41febe7

---

## What Was Tested

Antarctica's Scan row, its click target, the Focus cycle and the sector verbs, at Intel 1, 2 and 3. Also the Europe Tax figure, and whether Europe pays at the next Tax due.

**Acceptance criteria covered**: AC-1, AC-2, AC-3

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | Intel 1: Antarctica prints no Control, Unrest, Tax yield or Garrison condition; Focus never selects it; Stabilize/Lobby/Expedite not offered; Scan land Unknown | PASS | The row reads only `ANTARCTICA // NO SURVEY DATA` and is `aria-disabled="true"`. A forced click leaves `selected` on `eu`. Focus Next ×7 and Previous ×7 visit only af, as, oc, na, sa, eu. Antarctica is never selected, so its verbs are never offered. |
| AC-2 | Intel ≥ 2: same behaviour | PASS | Results are identical at Intel 2 and Intel 3. |
| AC-3 | Focus on opening Europe: a Tax figure prints and that sector does not pay | PASS | Europe (holder Helix) prints `TAX YIELD 2,468 CR / 24H`. Advancing past `nextTaxT` deposited 4,169 CR. That equals North America's post-advance yield (4,169 CR / 24H, visible in the WN-014 Intel 1 screenshot). North America is the only Nexus-held sector. Europe's 2,468 was not paid. |

No clipping at 1280×720.

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `wn-013/wn-013-intel1-europe-41febe7-1280x720.png` | Intel 1: Antarctica locked row, Europe focused with its Tax yield | AC-1, AC-3 |
| 2 | `wn-013/wn-013-intel2-europe-41febe7-1280x720.png` | Same at Intel 2 | AC-2 |
| 3 | `wn-013/wn-013-intel3-europe-41febe7-1280x720.png` | Same at Intel 3 | AC-2 |
| 4 | `wn-014/wn-014-intel1-na-41febe7-1280x720.png` | North America yield after the tax advance (4,169 CR) | AC-3 |

---

## Test Conditions

- **Game state at start**: New Operation on a cleared save (`localStorage.clear()`), orientation dismissed, clock paused. Intel seeded with `useCampaignStore.setState({ intelLevel })` (UI check only).
- **Platform / hardware**: macOS (Darwin 25.5), Playwright driving headed Chrome for Testing 1247, viewport 1280×720, dev server `vite --strictPort --port 4201` from a clean worktree of `41febe7` (the main checkout's globe work excluded).
- **Framerate during test**: not measured (smoke 2026-10-13 path 10 covers frame time).
- **Any special setup required**: driver `sprint-002-qa-2026-10-13/ui.mjs`; raw results `sprint-002-qa-2026-10-13/ui.json`. Console errors: none.

- **Tax step**: `useWorldStore.getState().advanceDays((nextTaxT - t + 1) / 86400)`, the store's own catch-up path. Credits were read from `useAppStore` before and after.

---

## Observations

- In the pre-advance readout North America's yield was 4,080. Its yield moved to 4,169 during the advance, because events changed Control and Unrest. The deposit matches the yield at payment time.

---

## Sign-Off

UI story: closed by the retained screenshots above; a lead sign-off is welcome but not required.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| qa-lead | Marco Machado | 2026-10-13 | [x] |

