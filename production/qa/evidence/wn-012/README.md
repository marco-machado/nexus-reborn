# WN-012 evidence — Event forecast gated on Intel level

**Date:** 2026-10-13 · **Revision:** 27eb039, no `src/` change (story/sprint-status edits only). Existing `SectorForecast` in `src/ui/WorldMap.tsx` already satisfies the criteria and reads `eventForecast` / `kindWeights` from `src/game/forecast.ts`; no weights are copied into the panel.
**Environment:** `npm run dev -- --strictPort` (port 4200), headless Chromium (Playwright chromium-1247), 1280×720, fresh context per intel level (New Operation, intel set in the save, reload, Continue). Partial click-through: World Network only (steps 2 and 6). Server stopped; port 4200 has no listener.

| Image | Seeding | Observed |
|---|---|---|
| `wn-012-intel1-1280x720.png` | intel 1, Europe focused | Event forecast shows no chances; the row reads `REQUIRES INTEL LVL 2`. |
| `wn-012-intel2-1280x720.png` | intel 2, Europe focused | RIOT 51%, BLKOUT 32%, RAID 41%, TRADE 19%, SEIZE 20%. No clipping or overflow. |

Intel 3 prints the same figures as intel 2. Console: no errors in any run.
Checks: `npm run lint` clean, `npm run build` ok, `vitest` forecast.test.ts + worldStore.test.ts 124 passed.
