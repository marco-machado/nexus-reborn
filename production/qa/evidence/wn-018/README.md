# WN-018 evidence — Campaign complete and failed banners

**Date:** 2026-10-13 · **Revision:** dd463c9 + uncommitted WN-018 tests (`src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`); no `src/ui` or `src/game` change.
**Environment:** `npm run dev -- --strictPort` (port 4200), headless Chromium (Playwright chromium-1247), viewport 1280×720, fresh context per capture (clean save). Partial click-through: World Network only (steps 2 and 6), plus one contract click per fixture. Server stopped; port 4200 has no listener.

Fixtures are seeded through `campaignStore.reportMission` (no flags set by hand), then the orientation modal is dismissed.

| Image | Seeding | Observed |
|---|---|---|
| `wn-018-complete-1280x720.png` | m01, m02, m03 won, intel 3 | `CAMPAIGN COMPLETE`, 3 / 3, flags won=true failed=false. Glass Veil is not locked; clicking it moves to the Brief. Banner unclipped. |
| `wn-018-failed-1280x720.png` | m01 lost, whole roster KIA | `CAMPAIGN FAILED`, 0 / 3, won=false failed=true, roster 0 / 8. Glass Veil is locked; clicking it leaves phase `world`, `missionId` null. |

Console: no errors in either capture.

**Pyrrhic Debrief:** Debrief code is unchanged since IF-011 (96b9b05). Regression evidence stays in `production/qa/evidence/if-011/` (`if-011-pyrrhic-win-1280x720.png`) and `src/ui/debriefFlags.test.ts`. No second banner implementation was added.
