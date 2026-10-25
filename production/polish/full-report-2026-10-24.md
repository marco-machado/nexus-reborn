## Performance Profile: Full
Generated: 2026-10-24 at HEAD ab1cf1e. `performance.enforce`: warn (violations are findings, not blockers).

**Inputs**: budgets FOUND for frame time (16.7 ms), hitches (50 ms) and draw calls (300): `project.yaml` performance.*, fixture in `docs/technical-preferences.md` § Performance Budgets. Memory ceiling ABSENT (`memory_ceiling_mb: null`). Load-time budget ABSENT (no key, no line in technical-preferences). Runtime data FOUND: `production/polish/perf-2026-10-23/perf.json` (run 2026-10-24 20:26 UTC, 140 s wall, headed Chrome for Testing, 1280×720, Apple M5 Pro, Rust Haven contract, mission won at sim time 74, `errs: []`). The config reader (`yaml-helper.sh`) failed again with "no python interpreter found", so budgets were read from `project.yaml` directly. The roadmap has the owner setting the memory ceiling and load-time budget before this report; neither is set, so those rows are NOT ASSESSED.

### Performance Budgets
| Metric | Budget | Measured at HEAD | Status |
|--------|--------|------------------|--------|
| Frame time (p95 per phase) | 16.7 ms (60 fps) | 7.2–7.3 ms in every phase (world 7.3, brief 7.2, team 7.2, mission 7.3, debrief 7.3) | OK (~56% headroom on the fixture) |
| Live-play hitches | no frame > 50 ms (load moments excluded) | live mission n 11997, p95 7.3, max 25 ms, 0 over 50 ms | OK |
| Draw calls | 300 | mission p50 71, p95 186, p99 192, max 224; debrief 182; world and menu 5 | OK (max 224, 76 under) |
| Memory | none set | heap max 117.1 MB (mission), world 76.5, debrief 69.7, startup 50.9, brief 43.3 | NOT ASSESSED — no budget (data FOUND) |
| Load time | none set | DOMContentLoaded 43 ms, load 44 ms, menu ready 68 ms, mission entry 4370 ms | NOT ASSESSED — no budget (data FOUND) |

Per-phase frames (ms): world n 8344, p50 6.2, p95 7.3, p99 7.7, max 170 · brief n 113, p95 7.2, p99 24.8, max 31 · team n 134, p95 7.2, max 31.3 · mission n 12262, p95 7.3, max 226.1 · debrief n 621, p95 7.3, max 18.8. Versus 2026-10-19 (9.2 ms p95): about 2 ms lower per phase, but the contract changed from Glass Veil to Rust Haven and the 10-19 draw-call and memory figures were never measured, so only frame time compares, and only per phase. Both runs are on a 120 Hz display, so p50 6.2–8.3 ms is near the display floor.

Warm dev server only: load and entry times here are not a production-build measurement. Heap is Chrome's `performance.memory`-style reading from one run; a second run in the roadmap note gave 93 MB at max, so the max varies by about 20 MB between runs.

### Hotspots Identified
| # | Location | Issue | Estimated Impact | Fix Effort |
|---|----------|-------|------------------|------------|
| 1 | Mission entry (frames at 438, 894, 963 ms into the phase: 87.5, 226.1, 50.6 ms; long tasks 50 and 225 ms) | Scene build and shader compile while the mission mounts; mission-entry total 4370 ms | Three over-50 ms frames per deploy; inside the first second, so excluded from the hitch rule | Unknown (needs a trace) |
| 2 | World Network at 94.8 s into the phase (frame 1898, 170 ms; 158 ms long task) | The Debrief → World Network ETA catch-up frame | One hitch per mission return; accepted as R-3 in Sprint 9 | — (accepted) |
| 3 | Startup (phase untagged `?`: frames of 219.4 and 162.5 ms; long tasks 197 and 148 ms) | App start and New Operation | Startup only | Unknown (needs a trace) |
| 4 | Mission heap (max 117.1 MB, last 62.2 MB) | Peak is transient: heap falls to 62 MB by the end of the phase | No budget to breach; peak is 54% above the settled value | Unknown |

Not run this profile (static scan, Phase 3): the 10-19 report scanned 14 `useFrame` bodies and found no per-frame allocations; no `src/scene/` code was re-scanned for this run, and nothing in this report claims it still holds at `ab1cf1e`.

### Optimization Recommendations (Priority Order)
None required: every set budget is met, and there is no violation to fix. Two investigations carry over from 2026-10-19:
1. **Trace the mission-entry hitch** — Record a Chrome performance trace across deploy to split city generation, geometry upload and shader/pipeline compile. Still 3 spikes (87.5, 226.1, 50.6 ms), up from 1 on 10-19 (358 ms), though the worst frame is smaller.
   - Location: mission mount (`src/scene/GameCanvas.tsx`, `src/scene/CityView.tsx`, `src/world/citygen.ts`)
   - Expected gain: unknown until traced
   - Risk: Low (measurement only)
   - Approach: Playwright `tracing` or a DevTools trace on the fixture.
2. **Run the same fixture on a production build** (`vite preview`) — the load-time budget the owner has yet to set should be measured there, not on the warm dev server.

### Quick Wins (< 1 hour each)
- Tag the startup phase in the perf script (frames still land under `?`; 10-19 quick win, not done).
- Log the renderer backend and quality tier in the perf script (10-19 quick win, not done).

### Requires Investigation
- Mission-entry and startup hitches (above).
- Run-to-run heap variance (117 MB vs 93 MB) before a memory ceiling is set from one number.

### Owner Decisions Needed
- Set `performance.memory_ceiling_mb` and a load-time budget (closes RISK-0003). Until then those two rows stay NOT ASSESSED.

Verdict: **COMPLETE** — performance profile generated (saved to `production/polish/full-report-2026-10-24.md`).
