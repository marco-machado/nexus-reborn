# Story 012: Eliminate counts tagged Units only; optionals never gate the win

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-010`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0016: Tactical sim contract  
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: MEDIUM
**Engine Notes**: ADR-0016 Knowledge Risk: sim uses no three.js APIs; geometry/camera MEDIUM. CameraRig / GameCanvas import from `three/webgpu` (r185) — no OrbitControls, no physics addon, no `THREE.Clock` as game clock. Verify against `docs/engine-reference/web/VERSION.md` before touching `src/scene/`.

**Control Manifest Rules (this layer)**:
- Required: One system, one seed: objectives belong to the tactical system.
- Forbidden: Never split objectives into a sibling system.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **15.** **GIVEN** an eliminate-tag required objective whose tag is garrison (street patrols untagged), **WHEN** every tagged Unit is dead and at least one untagged street patrol is still alive, **THEN** the eliminate objective completes and the required sequence can complete with that untagged patrol alive. Untagged street patrols do not gate eliminate.
- [ ] **16.** **GIVEN** every required objective complete and every optional ignored or failed, **WHEN** the mission result is read, **THEN** the result is Win; optionals never gate the win; failing or ignoring an optional costs nothing to the win (bonus may be 0).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Untagged street patrols do not gate eliminate.
- A Win with ignored or failed optionals may carry bonus 0.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: Loss and abort.

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
- Unlocks: Story 013
