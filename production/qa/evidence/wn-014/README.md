# WN-014 evidence — Scan hides contracts above the director's Intel; Chance still prints

**Date:** 2026-10-13 · **Revision:** 'd325e6f + uncommitted `src/game/contracts.ts` (`contractIntelReq`, `visibleContracts`) + `src/ui/WorldMap.tsx` (`opsFor` and the sector inset use `visibleContracts`; read-side only). Re-run after the review refactor with identical results. Partial click-through: World Network only (steps 2 and 6).
**Environment:** `npm run dev -- --strictPort` (4200), headless Chromium (Playwright chromium-1247), 1280×720, fresh context per intel level (New Operation → save seeded → reload → Continue → dismiss orientation → focus North America). Driver: `drive.mjs`. Server stopped; port 4200 has no listener. Console: no errors in any run.

Seeded generated contracts in `world.contracts` (all unexpired): `gc-high` (HIGH, req 2), `gc-severe` (SEVERE, req 3), `gc-sev-exp` (SEVERE, expedited, gate waived → req 1).

| Intel | OPEN CONTRACTS rows (NA) | Chance | `world.contracts` in save |
|---|---|---|---|
| 1 | RUST HAVEN (authored, locked), BROKEN LEDGER (= `gc-sev-exp`, waived). `gc-high`, `gc-severe` absent | 82%, 35% | all 3 ids present |
| 2 | RUST HAVEN, IRON VESPER (= `gc-high`, req = intel, shown), BROKEN LEDGER. `gc-severe` absent | 82%, 57%, 35% | all 3 ids present |
| 3 | RUST HAVEN, IRON VESPER ×2, BROKEN LEDGER | 82%, 57%, 39%, 35% | all 3 ids present |

- Chance prints at intel 1 and ≥2 and is the same for the same contract (BROKEN LEDGER 35% at all three levels). Risk bands are not on World Network.
- Scan markers follow the same list (marker count 4 / 5 / 6 at intel 1 / 2 / 3, incl. authored).
- Screenshots: `wn-014-intel{1,2,3}-na-1280x720.png`. No clipping; the EXPIRY chip shows the seeded 250000H value, which is an artefact of the seed's far-future `expiresAtT`.
- Not changed: the 3-offer cap (out of scope).
- Checks: `tsc -b` clean, `npm run lint` clean, `vitest` 752 passed (5 new in `src/game/contracts.test.ts`, "intel visibility (WN-014)").
