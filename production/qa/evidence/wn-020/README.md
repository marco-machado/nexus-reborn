# WN-020 evidence — Rust Haven opens at intel 1; Glass Veil and Hollow Crown at 2

**Date:** 2026-10-22 · **Revision:** ffd0806 + uncommitted WN-020 change (`src/game/data.ts` `intelReq`: m01 1→2, m03 2→1; test fixtures). Captured during `/story-done`.
**Environment:** `npm run dev -- --strictPort` (4200), headless Chromium via `playwright-cli` 0.1.22, viewport 1280×720. Server stopped afterwards; port 4200 has no listener. Console: 0 errors in the run (1 pre-existing `THREE.Clock` deprecation warning).

| Capture | How it was reached | What it shows |
|---|---|---|
| `wn-020-intel1-na-scan-1280x720.png` | Menu → NEW OPERATION (fresh campaign, intel 1) → UNDERSTOOD (orientation) → Focus North America | Header INTEL 1. Globe markers: GLASS VEIL "NEW CARTHAGE · LOCKED", HOLLOW CROWN "SHINGANG · LOCKED" (both `disabled`, aria "REQUIRES INTEL LVL 2"), RUST HAVEN open "82% CHANCE / ETA 3D". OPEN CONTRACTS (NA) 1/1: RUST HAVEN, CHANCE 82%, ETA 3D. |
| `wn-020-intel2-eu-scan-1280x720.png` | Same campaign; `nexus-save-v1` `campaign.intelLevel` set to 2 in localStorage, reload → CONTINUE SAVED OPERATION (Europe focus from the save) | Header INTEL 2. All three authored markers read OPEN CONTRACT (GLASS VEIL "NEW CARTHAGE · SEIZURE", HOLLOW CROWN "SHINGANG · EXTRACTION", RUST HAVEN "DETROIT SPRAWL · SABOTAGE"). OPEN CONTRACTS (EU) 1/1: GLASS VEIL, CHANCE 36%, ETA 2D. |

Accessibility snapshot at intel 1 (before the screenshot): `button "GLASS VEIL // LOCKED // REQUIRES INTEL LVL 2" [disabled]`, `button "HOLLOW CROWN // LOCKED // REQUIRES INTEL LVL 2" [disabled]`, `button "OPEN CONTRACT RUST HAVEN // SABOTAGE // DETROIT SPRAWL"`. At intel 2 all three are `button "OPEN CONTRACT …"`.

Not changed: the Scan lock chrome itself (World Network story 014 owns it); intel awards and `INTEL_PROGRESS`.
