## Smoke Check Report
**Date**: 2026-10-22
**Sprint**: Sprint 10 (closed); re-run at HEAD after the frame-time commits
**Build**: `1b49726`
**Engine**: Web (React 19.2.8 + Vite 6.4.3 + three.js r185)
**QA Plan**: `production/qa/qa-plan-sprint-010-2026-10-22.md`
**Argument**: sprint

**Why this run:** gate blocker 1 asks for a smoke check at HEAD. Three code commits landed after the Sprint 10 smoke (`production/qa/smoke-2026-10-22-sprint-010.md`, build `74d3268`):
- `ed624d0`: Earth texture as a cached ImageBitmap; Brief tactical-map cache with idle warm-up; World Network re-render cuts.
- `1b49726`: mission scene-pass precompile, with the mission clock held until it finishes.
- Docs-only commits.

### Environment
- **Config coherence** (`project-coherence.sh`): 2 MATCH, 0 DIFFERS. 2 NOT CHECKED: no Web binary on PATH, and the project-file checks exist for Godot only.
- **Tests:** 63 `*.test.ts(x)` files under `src/` (vitest).
- **CI:** configured (`.github/workflows/tests.yml`).
- **Smoke list:** none at `production/qa/smoke-tests.md` or `tests/smoke/`. Checklist source: the QA plan's Smoke Test Scope.

---

### Automated Tests

**Status**: PASS (1627 tests, 1627 passing)
- Ran `commands.test` (`npm run test`) under a 900 s alarm: 65 of 65 files, 1,627 of 1,627 tests, exit 0.
- `npm run lint`: exit 0.
- `npm run build`: exit 0.

---

### Test Coverage

| Story | Type | Test File | Coverage Status |
|-------|------|-----------|----------------|
| WN-020 Rust Haven opens at intel 1 | Logic | `src/game/data.test.ts`, `src/state/campaignStore.test.ts` (+ appStore, save) | COVERED |
| EC-023 Moderate offer seeded at New Operation | Logic | `src/game/contracts.test.ts`, `src/state/worldStore.test.ts` (+ save, appStore) | COVERED |
| IF-013 Four-row card + Influence moment | UI | `src/ui/worldOnboard.test.ts`; `production/qa/evidence/if-013-evidence.md` | MANUAL |
| IF-014 First-Debrief Research prompt | Integration | `src/ui/debriefResearch.test.ts`; `production/qa/evidence/if-014/` | COVERED |
| IF-015 Brief KIT line | UI | `src/ui/kitLine.test.ts`; `production/qa/evidence/if-015-evidence.md` | MANUAL |

**Summary**: 3 covered, 2 manual, 0 missing, 0 expected.

---

### Manual Smoke Checks

Every check was run by Claude this session. Clicks were made in the in-app browser against `preview_start dev` on port 4200. Harnesses ran in headless Chrome for Testing at 1280×720. Evidence is in `production/qa/evidence/smoke-2026-10-22-head/`.

- [x] **Build launched this session** — yes.
- [x] **1. Launch to the Menu** — PASS.
  - The Menu shows NEW OPERATION and SETTINGS.
  - The only console error is the Vite HMR websocket (`ws://localhost:4200/`), a dev-server message with no game cause.
- [x] **2. New Operation (real click)** — PASS.
  - Glass Veil and Hollow Crown show `REQUIRES INTEL LVL 2`; Rust Haven is open (82%).
  - One seeded offer, NEON GARDEN (Oslo, SABOTAGE, 87%, expiry 35H). Feed reads "OPEN CONTRACT NEON GARDEN POSTED IN OSLO", 4 unread.
- [x] **3. Orientation card** — PASS.
  - Four rows: THE JOB, START HERE (names NEON GARDEN, 87%), STRATEGIC TIME, THE FOUR NUMBERS.
  - UNDERSTOOD dismissed it.
- [~] **4. Seeded offer end to end** — PASS with named assists.
  - By hand: Scan → NEON GARDEN → Brief (tactical map and KIT lines drawn) → ACCEPT → Assembly → DEPLOY → mission.
  - In the mission: the scene drew, and the HUD directives equal the Brief's (REACH THE RELAY YARD, DROP THE BACKUP TRANSFORMER optional, DESTROY THE THREE FUEL RELAYS, EXTRACT THE SQUAD). The mission clock advanced (18:27:05 → 18:27:12), so the R4 precompile hold released.
  - The seeded offer was not played to Debrief by hand; it was aborted.
  - The win-to-Debrief path ran in the sweep: Rust Haven, sim-assisted, mission won. `if-014/capture.mjs` (ALL PASS) covers the first-Debrief Research prompt.
- [x] **Abort from the pause menu** — PASS.
  - Two clicks on Abort mission inside the 3 s window returned to World Network, and the globe drew on return.
  - A first attempt left the phase at `mission`. A page query ran between its two clicks, so the second click most likely fell outside the 3 s window. This was not reproduced.
- [x] **5. Save / reload** — PASS.
  - After the abort, a reload offered CONTINUE SAVED OPERATION. Continuing gave phase `world`, credits 128,450, and the contract still selected.
  - The globe showed "ACQUIRING EARTH IMAGERY", then the Earth, after a fresh load. This is the R1 bitmap path.
  - A v10 blob with its own market was not driven by hand; `save.test.ts` covers it in the 1,627.
- [x] **6. Brief KIT lines match the mission on a generated contract** — PASS. `if-015/capture.mjs` with `SWEEP_OUT` gave ALL PASS: 86 checks, including the parent-box checks. The deployed generated SABOTAGE mission lists the same kinds and HUD labels as its Brief.
- [x] **Sweep** (`sweep/sweep.mjs`, copied from `sprint-010-sweep-perf-2026-10-22`) — ALL SURFACES CLEAN.
  - 9 surfaces × 90/100/110/125 at 1280×720, plus the 1100×650 sub-minimum. Mission won, 0 console errors.
  - The renderer log has two `THREE.WebGLRenderer: Context Lost.` lines. The Sprint 10 sweep at `74d3268` has the same two.
- [x] **IF-013 capture** (`if-013/capture.mjs`) — ALL PASS, 0 console errors.
- [x] **7. Frame spikes on World Network** — PASS.
  - Source: the R4 after-runs on the same code as HEAD (`production/qa/evidence/frame-time-pass-2026-10-22/r4/`, after-2 and after-3 at 120 Hz).
  - World Network p95 9.3 / 9.2 ms. World-return task 139 / 137 ms, against the Sprint 10 baseline of 216.5 ms.
  - No new spike. The mission-entry task is 241–253 ms, against 256–269 before R4.
  - World Network p95 is closed on the owner's 2026-10-22 ruling (sign-off condition 5).

---

### Missing Test Evidence

All Logic and Integration stories have test coverage.

---

### Verdict: PASS WITH WARNINGS

Warnings:
1. Item 4: the seeded offer was taken to deploy by hand but not played to Debrief. The win-to-Debrief path is sim-assisted, in the sweep on Rust Haven. Whether a new player can win the seeded offer remains the owner's EC-023 playtest (due 2026-10-28).
2. The first abort attempt did not leave the mission. It was attributed to the 3 s confirm window and not reproduced.

Not a gate-check result. Dev server stopped (`preview_stop`).
