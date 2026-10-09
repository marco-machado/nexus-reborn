# Story 003: Move clears target and Hold Ground; stop-to-engage on the path

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
- Required: Five verbs plus auto-acquire; operatives acquire visible targets when weapons are free.
- Forbidden: No physics engine; routing stays in `src/game/pathfind.ts`.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **2.** **GIVEN** a selected living operative with an Explicit target and Hold Ground on, **WHEN** Move is issued to walkable ground, **THEN** the Explicit target is cleared and Hold Ground is released.
- [ ] **2b.** **GIVEN** a Move path that passes a visible in-range CorpSec, Hold Fire off, weapons-free (not drawing, not reloading, magazine > 0, cooldown idle), **WHEN** the operative reaches LOS, **THEN** they stop, engage, then resume the path.
- [ ] **2c.** **GIVEN** a selected living operative walking a Move path with Hold Fire on, **WHEN** they pass a visible in-range CorpSec, **THEN** they do not stop-to-engage; the path continues.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Weapons-free means not drawing, not reloading, magazine > 0, cooldown idle.
- Move to walkable ground clears the Explicit target and releases Hold Ground; Hold Fire suppresses stop-to-engage only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: idle auto-acquire and Attack under Hold Ground.
- Story 006: Hold Ground pin and Stop.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`, `src/game/pathfind.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 004
