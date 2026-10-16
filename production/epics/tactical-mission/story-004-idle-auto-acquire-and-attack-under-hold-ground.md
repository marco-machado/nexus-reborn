# Story 004: Idle auto-acquire and Attack under Hold Ground and Hold Fire

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
- Required: Five verbs plus auto-acquire.
- Forbidden: Never null a standing Explicit target on Hold Fire.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **2d.** **GIVEN** an idle (no path) living operative, Hold Fire off, weapons-free, with a visible in-range CorpSec, **WHEN** no new order is issued, **THEN** they auto-acquire and fire. Hold Ground and Stopped with no walking path behave the same.
- [ ] **3.** **GIVEN** a selected living operative with Hold Fire on and Hold Ground on, **WHEN** Attack is issued on a living hostile out of range, **THEN** the Explicit target is set, Hold Fire stays on, Hold Ground prevents the chase while keeping that target, and the explicit shot still fires when later in range and LOS.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Idle, Hold Ground, and Stopped-with-no-path operatives auto-acquire the same way when Hold Fire is off.
- Attack out of range under Hold Ground keeps the target without chasing; the explicit shot fires once in range and LOS.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: Hold Fire toggling.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-004 — Idle auto-acquire and Attack under Hold Ground and Hold Fire (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 2d: idle operative, Hold Fire off, weapons free, visible in-range CorpSec → acquires and fires with no order; repeat for Hold Ground on and for Stopped
- AC 3: Hold Fire and Hold Ground on, Attack an out-of-range hostile → `targetId` set, `holdFire` still true, position unchanged (no chase), and the shot fires once the hostile walks into range and LOS
**Edge cases**: target dies before entering range; hostile out of LOS but in range (no shot)
**Mutation check**: make Hold Ground chase anyway → AC 3 position assertion fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 005
