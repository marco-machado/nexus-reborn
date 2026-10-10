# Story 007: Minimap, weather chip, and tutorial toasts in the mission HUD

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0010: Mission renderer and frame loop  
**Secondary ADRs**: ADR-0017: One OS / input / audio mixer; ADR-0006: Weather is a script, not a roll mid-fight
**ADR Decision Summary**: WebGPURenderer + await init() + r3f createRoot; one RenderPipeline submit; per-frame data stays out of React.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH
**Engine Notes**: Post-cutoff APIs in play: `WebGPURenderer` from `three/webgpu` (r185), r3f 9.6.1 `createRoot` + `extend(THREE)`, `RenderPipeline`. Read `docs/engine-reference/web/VERSION.md` first; do not invent APIs.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Per-frame unit data stays out of React state; HUD subscribes at `SYNC_INTERVAL` 0.2s; minimap reads `getWorld()` ~10Hz.
- Required: Camera yaw `CAMERA_YAW = π/4`; minimap uses the same yaw.
- Forbidden: per-frame unit poses in React state; stock r3f `<Canvas>`.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC10) GIVEN a live mission on Standard and the same contract on Hardened, WHEN minimap contents are compared, THEN Hardened does not strip cones, patrols, civilians, or the objective pulse. Three zoom levels exist. Click/drag steers the camera. Minimap up = screen up.
- [ ] (AC13) GIVEN the first mission with tutorial unseen, WHEN toasts for Select, Move, Attack, stances, role ability, items, weapon swap, and Extraction are shown, THEN they name current bindings, never block input, never pause the sim, and Skip Tutorial marks all steps seen.
- [ ] (AC14) GIVEN a weather front at its scripted tactical time, WHEN the front hits, THEN the Comm log prints a line and the HUD Weather chip matches live weather.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Hardened Difficulty does not strip minimap content; three zoom levels; click/drag steers the camera; minimap up = screen up.
- Tutorial toasts read current bindings from `BINDINGS`, never block input, never pause the sim.
- Weather chip and Comm log line read live weather from the world.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: pause modal.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: None
