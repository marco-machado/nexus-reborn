# Story 016: Grenade confirm spends one power cell; refusal spends nothing

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
- Required: Five verbs plus auto-acquire on the custom sim; abilities live in sibling modules.
- Forbidden: No physics engine — blast resolves LOS only in the sim.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **23.** **GIVEN** a living selected thrower, at least one power cell, grenade cooldown idle, and a confirmed land within 18 m that snaps onto pavement within 2.5 m, **WHEN** the grenade is confirmed, **THEN** one power cell is spent and the blast resolves (70 damage at centre falling to 35 at 3.5 m edge, LOS only).
- [ ] **24.** **GIVEN** empty power cells, or a running squad grenade cooldown, **WHEN** a grenade confirm is requested, **THEN** the control is disabled or the throw is refused, and nothing is spent (cells and cooldown unchanged).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Land within 18 m snaps onto pavement within 2.5 m.
- Blast: 70 damage at centre falling to 35 at 3.5 m edge, LOS only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: Device handling remains OQ3.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/abilities.test.ts`, `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
