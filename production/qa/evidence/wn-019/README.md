# WN-019 evidence — Campaign flag edge cases

**Date:** 2026-10-13 · **Revision:** uncommitted WN-019 changes on main (`src/state/campaignStore.ts` param rename; `src/state/campaignStore.test.ts`, `src/state/save.test.ts`, `src/ui/campaignBanner.ts` + test; `src/ui/WorldMap.tsx` uses `campaignBanner`).
**Environment:** `npm run dev -- --strictPort` (4200), headless Chromium (Playwright chromium_headless_shell-1247), 1280×720, fresh context per capture (clean save). Driver: `drive.mjs`. Fixtures go through `campaignStore.reportMission`; no flag is set by hand. Server stopped; port 4200 has no listener. Console: no errors.

| Image | Seeding | Observed |
|---|---|---|
| `wn-019-complete-then-wipe-1280x720.png` | m01, m02, m03 won, then a loss that kills the whole roster | `CAMPAIGN COMPLETE`, 3 / 3; no fail banner; Roster 0 / 8; Glass Veil is not locked. Banner unclipped. |
| `wn-019-incomplete-wipe-failed-1280x720.png` | m01 lost, whole roster KIA, no wins | `CAMPAIGN FAILED`, 0 / 3; no complete banner; Roster 0 / 8; Glass Veil shows the lock icon. Banner unclipped. |

**Observation (not WN-019):** on the failed screen the locked Glass Veil row reads `REQUIRES INTEL LVL 1` at Intel 1. The lock is the campaign-failed lock, not intel, so the wording is misleading. Banner and lock copy belong to WN-018.
