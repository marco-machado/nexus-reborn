## Performance Profile: Full
Generated: 2026-10-19 at HEAD 2a24060. `performance.enforce`: warn (violations are findings, not blockers).

**Inputs**: budgets FOUND (set by the owner during this run: `project.yaml` performance.*, fixture in `docs/technical-preferences.md` § Performance Budgets). Runtime frame data FOUND: `production/polish/perf-2026-10-19/perf.json` (one full loop, headed Chrome for Testing, 1280x720, Apple M5 Pro). Memory, load-time and draw-call measurements ABSENT at HEAD. Note: the config reader (`yaml-helper.sh get_effective_yaml_key`) failed with "no python interpreter found", so the budgets were read from `project.yaml` directly.

### Performance Budgets
| Metric | Budget | Measured at HEAD | Status |
|--------|--------|------------------|--------|
| Frame time (p95 per phase) | 16.7 ms (60 fps) | 9.2 ms in world, brief, mission, debrief; 9.0 team | OK (~45% headroom on the fixture) |
| Live-play hitches | no frame > 50 ms (load moments excluded) | live mission max 33.3 ms, 0 over 50 ms | OK |
| Memory | none set | not measured | NOT ASSESSED — no budget, no data |
| Load time | none set | not measured | NOT ASSESSED — no budget, no data |
| Draw calls | 300 | not measured at HEAD (city-architecture sample: 164) | NOT ASSESSED — no measurement at HEAD |

Per-phase frames (ms): world n 6264, p50 8.3, p95 9.2, p99 9.4, max 191.1 · brief n 87, p95 9.3, max 24.9 · team n 102, p95 9.0, max 16.7 · mission n 4541, p95 9.2, max 358.3 · debrief n 464, p95 9.2, max 9.3. The previous run at 0dcb87c (`production/qa/evidence/smoke-2026-10-19/perf/perf.json`) matches within 0.2 ms at p95; today's fixes changed nothing measurable. The rAF clock caps at 120 Hz on this display, so p50 8.3 ms is the display floor, not the game's cost.

### Hotspots Identified
| # | Location | Issue | Estimated Impact | Fix Effort |
|---|----------|-------|------------------|------------|
| 1 | Mission entry (mission frame 40, 684 ms in) | One 358 ms frame and a 325 ms long task while the mission scene builds | One visible hitch per deploy; outside live play, so it is excluded from the hitch rule | Unknown (needs a trace) |
| 2 | Debrief → World Network return | One 191 ms frame (184 ms long task) at the ETA catch-up | One hitch per mission return; accepted as R-3 in Sprint 9 | — (accepted) |
| 3 | App start / New Operation (phase not yet tagged) | 329, 226 and 56 ms frames | Startup only | Unknown (needs a trace) |

Static scan: 14 `useFrame` callbacks in 11 files (`src/scene/*`, `src/ui/WorldGlobe.tsx`). A pattern scan of their bodies (`new X`, `.map/.filter/.slice`, spreads, `Object.entries/keys`, `JSON.*`, `setState`) found no hits. Helper functions they call were not traced. The ADR-0010 `FrameGovernor` steps quality down after slow frames (`SLOW_FRAME_MS` 28, `src/game/quality.ts:46`).

### Optimization Recommendations (Priority Order)
None required: every set budget is met. The two below are investigations, not fixes.
1. **Trace the mission-entry hitch** — Record a Chrome performance trace across deploy to split city generation, geometry upload and shader/pipeline compile.
   - Location: mission mount (`src/scene/GameCanvas.tsx`, `src/scene/CityView.tsx`, `src/world/citygen.ts`)
   - Expected gain: unknown until traced
   - Risk: Low (measurement only)
   - Approach: Playwright `tracing` or a DevTools trace on the fixture; pre-compile or stage work behind the deploy transition if compile dominates.
2. **Measure memory and draw calls at HEAD** — Add `renderer.info.render.calls` sampling and a heap reading (`performance.measureUserAgentSpecificMemory` where available) to the perf script, so the 300 draw-call budget is checked and a memory budget can be set.

### Quick Wins (< 1 hour each)
- Tag the startup phase in the perf script (frames currently land under `?`).
- Log the renderer backend and quality tier in the perf script, so the fixture records them.

### Requires Investigation
- Mission-entry and startup hitches (above).
- Weaker hardware: the fixture is a high-end M5 Pro; no lower-end reference machine is defined.

Top 3 hotspots: mission entry (358 ms), Debrief → World catch-up (191 ms, accepted), startup (329 ms). Headroom: frame time ~45% (9.2 of 16.7 ms); hitches 33 of 50 ms; draw calls, memory and load time not assessed. Next: add draw-call and memory sampling, then re-run.

Verdict: **COMPLETE** — performance profile generated.
