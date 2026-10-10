# Story 011: Cover interrupts the fire lane; hit chance formula

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0016: Tactical sim contract  
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: MEDIUM
**Engine Notes**: ADR-0016 Knowledge Risk: sim uses no three.js APIs; geometry/camera MEDIUM. CameraRig / GameCanvas import from `three/webgpu` (r185) — no OrbitControls, no physics addon, no `THREE.Clock` as game clock. Verify against `docs/engine-reference/web/VERSION.md` before touching `src/scene/`.

**Control Manifest Rules (this layer)**:
- Required: The first Unit in the fire lane before cover is hit.
- Forbidden: No physics engine — the lane is resolved in the custom sim.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **14.** **GIVEN** cover between shooter and a Unit on the lane, **WHEN** a miss continues down the fire lane, **THEN** cover interrupts the lane and that Unit is not hit.
- [ ] **25.** **GIVEN** `hit_chance = clamp((0.78 − 0.28 × d/r + (u − 0.5) × 0.1) × a, 0.05, 0.95)` with `d/r = 0.5` (half range) and zero jitter `u = 0.5`, **WHEN** chance is evaluated for an operative (`a = 1.0`) and for Standard CorpSec (`a = 0.45`), **THEN** chance is 64% and 28.8% respectively. Logic unit/fixture only — do not invent a playtest. Hardened CorpSec uses `a = 0.495` (0.45 × 1.1); Deadeye bypasses the hit roll.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Hit chance test is a logic unit/fixture only; do not invent a playtest.
- Hardened CorpSec uses a = 0.495 (0.45 × 1.1); Deadeye bypasses the hit roll.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: civiliansHit counting.

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

- Depends on: Story 010
- Unlocks: None
