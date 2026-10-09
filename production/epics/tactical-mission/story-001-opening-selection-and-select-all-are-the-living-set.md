# Story 001: Opening selection and Select-all are the living set

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
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
- Required: One system, one seed, unsaved lifetime; five verbs on the custom TypeScript sim.
- Forbidden: Never split the tactical system into sibling systems.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **1a.** **GIVEN** a just-opened mission with at least one living operative and at least one dead operative, **WHEN** the mission starts, **THEN** the opening selection is exactly the living set.
- [ ] **1b.** **GIVEN** that mission, **WHEN** Select-all (0 / backtick) is issued, **THEN** selection is exactly the living set.
- [ ] **1d.** **GIVEN** keys 1–4, **WHEN** the slot is dead, **THEN** it is not selected; **WHEN** the slot is living, **THEN** that slot is selected.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Dead operatives are never a valid recipient: the opening selection, Select-all (0 / backtick), and slot keys 1–4 filter to the living set.
- Keys resolve through the one remap table (`src/game/bindings.ts`); this story asserts the sim-side selection result, not key chrome.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: dead-id and empty-selection no-ops.

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

- Depends on: None
- Unlocks: Story 002, Story 003
