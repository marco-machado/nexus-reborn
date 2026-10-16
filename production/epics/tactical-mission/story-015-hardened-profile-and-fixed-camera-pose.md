# Story 015: Hardened profile keeps minimap data; camera pose is fixed

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-009`, `TR-tactical-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0016: Tactical sim contract  
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: MEDIUM
**Engine Notes**: ADR-0016 Knowledge Risk: sim uses no three.js APIs; geometry/camera MEDIUM. CameraRig / GameCanvas import from `three/webgpu` (r185) — no OrbitControls, no physics addon, no `THREE.Clock` as game clock. Verify against `docs/engine-reference/web/VERSION.md` before touching `src/scene/`.

**Control Manifest Rules (this layer)**:
- Required: Hardened is discrete `DIFFICULTY_FX`; camera fixed 45° yaw / 55° elevation / 25° FOV, zoom 44–115 m; minimap shares `CAMERA_YAW`.
- Forbidden: Never Hardened-as-hidden-minimap; no OrbitControls; no rotate or tilt in play.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **21.** **GIVEN** the same contract on Standard vs Hardened, **WHEN** extras and minimap data are read, **THEN** Hardened applies +2 street patrols, +6 civilians, sight-confirm ×1.15, CorpSec accuracy ×1.1, +1 m vision after weather, optional time-limit ×0.85; Standard matches the authored baseline; Hardened does not hide minimap cones or patrols (Tactical still emits them). Minimap chrome is Interface presentation of that data.
- [ ] **22.** **GIVEN** a live mission, **WHEN** camera and minimap orientation are read, **THEN** the camera does not rotate or tilt in play (fixed 45° yaw, 55° elevation); minimap up is screen up (shared yaw). Not a HUD-clipping check.
- [ ] **R5-a.** *(GDD rule 19: Control does not add CorpSec HP.)* **GIVEN** the same contract in sectors with different Control values, on Standard and on Hardened, **WHEN** CorpSec units are created, **THEN** their HP does not change with Control.
- [ ] **R5-b.** *(GDD Formulas: accuracy `a`.)* **GIVEN** a Hardened mission, **WHEN** a CorpSec unit's hit chance is evaluated at half range with zero jitter (`d/r = 0.5`, `u = 0.5`), **THEN** it uses `a = 0.495` (0.45 × 1.1) and the chance is 31.68%. Depends on the TM-011 hit-chance seam.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Standard matches the authored baseline.
- Minimap chrome is Interface presentation; HUD clipping is not checked here.
- CameraRig `useFrame` priority 0 after WorldTicker (ADR-0016 Verification).
- Performance: no performance impact expected — the Hardened profile is a static table read at mission build (src/game/missionParams.ts:103), and the camera pose is constants (src/scene/CameraRig.tsx:14, CAMERA_YAW). The new camera test reads constants only. No per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic: minimap chrome and HUD clipping.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-015 — Hardened profile keeps minimap data; camera pose is fixed (Integration)
**Test file**: `src/game/missionParams.test.ts`, `src/game/world.test.ts`, a new `src/scene/cameraPose.test.ts` (constants only; no WebGPU in Node)
**What to test**:
- AC 21: Hardened vs Standard on one contract: +2 street patrols, +6 civilians, sight-confirm ×1.15, CorpSec accuracy ×1.1, +1 m vision after weather, optional time limit ×0.85 (Hollow Crown 90 s → 76.5 s); Standard equals the authored baseline; minimap cones and patrols still emitted
- AC 22: camera yaw 45° and elevation 55° are constants; minimap yaw equals camera yaw
**Extra criteria (R-5)** (promoted to acceptance criteria R5-a onward, 2026-10-16): Control does not add CorpSec HP on Hardened; Hardened accuracy `a` = 0.495 feeds the hit chance (TM-011)
**Manual**: camera does not move after input (screenshot pair)
**Mutation check**: change the Hardened optional mul to 0.9 → AC 21 fails
**Estimated test count**: ~6

**Manual half:**

#### TM-015 — Fixed camera (visual half of AC 22)
**Verification method**: Manual step-through in the in-app browser at 1280x720
**Who must sign off**: qa-lead
**Evidence to capture**: screenshots before and after mouse drag, wheel and arrow keys, saved to `production/qa/evidence/tm-015/`
- [ ] Camera angle unchanged after drag, wheel and arrow input
- [ ] Minimap "up" points the same way as screen up
- [ ] On Hardened, the minimap still shows patrol cones

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts` — must exist and pass, OR a playtest doc.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
