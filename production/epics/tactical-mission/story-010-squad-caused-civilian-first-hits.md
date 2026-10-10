# Story 010: civiliansHit counts unique squad-caused civilian first-hits

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
- Required: A missed round continues down the fire lane; Tactical counts N (`civiliansHit` on `MissionResult`).
- Forbidden: Do not re-own `collateral` CR pricing — Economy prices Credits from the count.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **11.** **GIVEN** a fire-lane fixture where a squad miss continues into a civilian before cover, **WHEN** that first squad-caused civilian hit resolves, **THEN** `civiliansHit` increases by 1 (first hit, not death).
- [ ] **12.** **GIVEN** that same civilian already counted, **WHEN** the squad hits them again, **THEN** `civiliansHit` does not increase.
- [ ] **13.** **GIVEN** civilian harm caused only by CorpSec, **WHEN** those hits resolve, **THEN** `civiliansHit` stays 0 (telemetry may still record CorpSec-caused hits separately).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- First hit, not death; one civilian counts once.
- CorpSec-caused hits never increment `civiliansHit` (telemetry may record them separately).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: cover and the hit roll.

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
- Unlocks: Story 011
