# Story 005: Hold Fire clears automatic targets but keeps a standing Explicit

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
- Required: Living spec wins (GDD OQ2 resolved by ADR-0016): standing Explicit stays; later Attack fires through; Hold Fire bit stays.
- Forbidden: `orderHoldFire` must not null a standing Explicit target — code that does is a defect vs spec.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **5.** **GIVEN** a selected living operative who would auto-acquire a visible CorpSec in range, **WHEN** Hold Fire is set, **THEN** automatic targets are cleared and the operative does not auto-acquire.
- [ ] **5b.** **GIVEN** Hold Fire still on, **WHEN** a later Attack is issued on a living hostile, **THEN** the explicit Attack still fires through and the Hold Fire bit stays on.
- [ ] **5c.** **GIVEN** a selected living operative with a standing Explicit target on a living hostile, **WHEN** Hold Fire is turned on, **THEN** that Explicit target is not nulled (automatic targets may clear; the standing Explicit remains).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Hold Fire clears automatic targets only.
- A later Attack fires through Hold Fire without clearing the bit.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: Attack under Hold Ground.

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

- Depends on: Story 004
- Unlocks: Story 006
