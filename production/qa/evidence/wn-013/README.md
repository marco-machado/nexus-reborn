# WN-013 evidence — Antarctica hidden, Focus cycle skips it, Focus Tax figure prints

**Date:** 2026-10-13 · **Revision:** ba89be2, working tree clean of `src/` changes (story/sprint-status edits only). No code change: existing behaviour satisfies all three criteria.
**Environment:** `npm run dev -- --strictPort` (port 4200), headless Chromium (Playwright chromium-1247), 1280×720, fresh context per intel level (clean save). Partial click-through: World Network only (steps 2 and 6). Server stopped; port 4200 has no listener.

| Image | Seeding | Observed |
|---|---|---|
| `wn-013-intel1-europe-1280x720.png` | intel 1, Europe focused | Sector list shows `ANTARCTICA / NO SURVEY DATA` with a lock, no Control/Unrest/Tax/Garrison. Control key: `UNKNOWN 1` (Antarctica land is Unknown; its polygon is not drawn as a sector). Europe prints `TAX YIELD 2,468 CR / 24H`; Europe is Helix-held, so it does not pay. Event forecast reads `REQUIRES INTEL LVL 2`. Nothing clipped. |
| `wn-013-intel2-europe-1280x720.png` | intel 2, Europe focused | Same Antarctica row and Unknown key. Event forecast prints. Nothing clipped. |

Focus cycle (`stepSector(+1)` x8 from Europe), intel 1 and 2: `eu, af, as, oc, na, sa, eu, af, as` — six open sectors, Antarctica never selected.
Clicking the Antarctica row (forced) leaves `selected` on `eu`; the right panel never renders Antarctica, so Stabilize / Lobby / Expedite are never offered for it.
Console: no errors in either run.
