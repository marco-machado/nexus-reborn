# PV-017 click-through: Debrief filing status reads unfiled until the next Screen

**Date**: 2026-10-15 · **Revision**: e3d576d + uncommitted PV-017 working tree · **Build**: `npm run dev -- --strictPort` on localhost:4200 · **Viewport**: 1280x720 (playwright-cli, Chromium)

**Setup**: fresh browser profile. The Debrief was reached by seeding through the Vite dev module graph: `startNewOperation()`, `selectMission('m01')`, `startMission()`, `freezeDeploy(...)`, `setOutcome(settleOutcome({ won: true, ... }))`. The Debrief screen's own `applyDebrief` ran the apply, so `lastAppliedKey` rose and `save.ts` marked the status. No status was set by hand. No mission was played.

**Screens exercised**: Debrief → Brief (Replay), Debrief → World Network (Return), reload → Menu → Continue → World Network. Partial run: click-through steps 5 (Debrief inspect) and 6 (layout) only.

| Step | Result | Evidence |
|---|---|---|
| Debrief after a paid win | `saveStatusStore.status = 'unfiled'`. `INVOICE UNFILED // COMMITS ON NEXT SCREEN` shows between the invoice and the actions as a `role="status"` sentence. No page scroll. Card bottom is at 667px of 720. | `01-debrief-unfiled-1280x720.png` |
| REPLAY MISSION → Brief | After the Brief autosave: `status = 'filed'`, `missionId = m01` in memory and in the blob, blob Credits 222,387 (post-apply) | `02-replay-to-brief-filed-1280x720.png` |
| Re-seed Debrief → RETURN TO WORLD NETWORK | After the World Network autosave: `status = 'filed'`, selection none in memory and in the blob, blob Credits 222,387 | `03-world-network-return-filed-1280x720.png` |
| Reload → Menu → Continue | Menu `status = 'filed'`. After Continue: World Network, Credits 222,387 (post-apply, not doubled), `status = 'filed'` | `04-reload-continue-not-unfiled-1280x720.png` |

Console: two `favicon.ico` 404s, a three.js `THREE.Clock` deprecation warning and a WebGL context-lost log. None of them comes from this change.

Paid-win and quiet-replay unfiled, Abort never marking unfiled, and the status transitions are covered by automated tests in `src/state/save.test.ts`: `Debrief filing status reads unfiled until the next Screen` and `saveStatusStore transitions (ADR-0022)`.

Copy note: the Debrief UX spec does not yet name the filing sentence. `INVOICE UNFILED // COMMITS ON NEXT SCREEN` is a placeholder pending `/ux-design`. Filed is shown by removing the sentence, which P-19 allows.

Server stopped afterwards. `lsof -iTCP:4200 -sTCP:LISTEN` returned no listener.
