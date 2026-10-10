# Story 002: Dead ids, empty selection, and Attack on a Device are no-ops

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
- Required: Attack = living hostile; there is no Demolish verb.
- Forbidden: Never accept Attack-on-device (`orderAttack` rejects devices — code that accepts it is a defect).
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **1c.** **GIVEN** a dead id, **WHEN** an order names that id, **THEN** it is a no-op (dead never a valid recipient).
- [ ] **1e.** **GIVEN** empty selection, **WHEN** Move, Attack, or Q is issued, **THEN** the order is a no-op.
- [ ] **5d.** **GIVEN** a selected living operative, **WHEN** Attack is issued on a Device, **THEN** no Explicit target is set (no-op). Do not assert Device HP or a fire-lane-vs-charge channel (OQ3).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Orders naming a dead id, or issued with empty selection, change nothing.
- Do not assert Device HP or a fire-lane-vs-charge channel (GDD OQ3 — still open).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: selection sets.
- Story 005: Hold Fire and Attack.

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

- Depends on: Story 001
- Unlocks: None
