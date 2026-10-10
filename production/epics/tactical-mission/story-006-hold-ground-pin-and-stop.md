# Story 006: Hold Ground pins and parks the path; Stop clears pathing and keeps stance bits

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0016: Tactical sim contract  
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: MEDIUM
**Engine Notes**: ADR-0016 Knowledge Risk: sim uses no three.js APIs; geometry/camera MEDIUM. CameraRig / GameCanvas import from `three/webgpu` (r185) — no OrbitControls, no physics addon, no `THREE.Clock` as game clock. Verify against `docs/engine-reference/web/VERSION.md` before touching `src/scene/`.

**Control Manifest Rules (this layer)**:
- Required: Stop is not a sixth verb; five verbs plus Stop.
- Forbidden: Never let separation shove a Hold Ground operative off its tile.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **4.** **GIVEN** a selected living operative walking a path, **WHEN** Hold Ground is set, **THEN** the operative is pinned on the current tile, the active path is parked (restored on release), and separation does not shove them off that tile.
- [ ] **6.** **GIVEN** a selected living operative with a path, an Explicit target, Hold Ground on, and Hold Fire on, **WHEN** Stop is issued, **THEN** pathing (including any parked Hold Ground path), chase, and targeting are cleared, and Hold Ground and Hold Fire stance bits stay on.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Hold Ground parks the active path and restores it on release.
- Stop clears pathing (including any parked Hold Ground path), chase, and targeting; Hold Ground and Hold Fire bits stay on; release after Stop does not resume the walk (GDD OQ8 resolved).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: Move.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 005
- Unlocks: None
