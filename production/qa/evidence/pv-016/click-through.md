# PV-016 click-through: Balance Export and two-step Clear

**Date**: 2026-10-15 · **Build**: `npm run dev` on localhost:4200 · **Viewport**: 1280x720 (playwright-cli, Chromium)

**Setup**: fresh origin; seeded two local telemetry records (one won, one aborted) under `nexus-telemetry-v1`, plus a non-telemetry sentinel key `__pv016_probe`.

**Screens exercised**: Main menu → Settings → Balance dashboard.

| Step | Result | Evidence |
|---|---|---|
| Open Balance with 2 records | Aggregates, share bars, EXPORT JSON / CLEAR / CLOSE all visible; no clipping | `01-balance-two-records-1280x720.png` |
| EXPORT JSON | Browser saved `nexus-balance.json` (version 1, both records). Request log: 0 requests to any origin other than localhost:4200, no POST/PUT | — |
| CLEAR once | Button reads `CONFIRM // ERASE RECORDS?` (amber); header still `2/60 RECORDS`; storage still holds 2 records | `02-clear-armed-records-remain-1280x720.png` |
| Confirm | Header `0/60 RECORDS`, empty-state copy, Export/Clear disabled; `nexus-telemetry-v1` = `{"version":1,"records":[]}`; `__pv016_probe` unchanged | `03-clear-confirmed-balance-empty-1280x720.png` |

Console: only a pre-existing `favicon.ico` 404.

Campaign-blob safety on the real `nexus-save-v1` key is covered by the automated test `Balance Export and two-step Clear (PV-016) > AC3` in `src/state/telemetry.test.ts`.
