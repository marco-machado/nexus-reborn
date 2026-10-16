# Story 015: Hardened profile keeps minimap data; camera pose is fixed

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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

- [x] **21.** **GIVEN** the same contract on Standard vs Hardened, **WHEN** extras and minimap data are read, **THEN** Hardened applies +2 street patrols, +6 civilians, sight-confirm ×1.15, CorpSec accuracy ×1.1, +1 m vision after weather, optional time-limit ×0.85; Standard matches the authored baseline; Hardened does not hide minimap cones or patrols (Tactical still emits them). Minimap chrome is Interface presentation of that data.
- [x] **22.** **GIVEN** a live mission, **WHEN** camera and minimap orientation are read, **THEN** the camera does not rotate or tilt in play (fixed 45° yaw, 55° elevation); minimap up is screen up (shared yaw). Not a HUD-clipping check.
- [x] **R5-a.** *(GDD rule 19: Control does not add CorpSec HP.)* **GIVEN** the same contract in sectors with different Control values, on Standard and on Hardened, **WHEN** CorpSec units are created, **THEN** their HP does not change with Control.
- [x] **R5-b.** *(GDD Formulas: accuracy `a`.)* **GIVEN** a Hardened mission, **WHEN** a CorpSec unit's hit chance is evaluated at half range with zero jitter (`d/r = 0.5`, `u = 0.5`), **THEN** it uses `a = 0.495` (0.45 × 1.1) and the chance is 31.68%. Depends on the TM-011 hit-chance seam.

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
- [x] Camera angle unchanged after drag, wheel and arrow input (one pair per input: 01→02 drag, 02→03 wheel, 03→04 arrows)
- [x] Minimap "up" points the same way as screen up (01, 04)
- [x] On Hardened, the minimap still shows patrol cones (05, 05b; difficulty shown in 06)

Evidence: `production/qa/evidence/tm-015/README.md` (1280x720, Playwright, 2026-10-16). qa-lead sign-off: **recorded 2026-10-16** (see Completion Notes).

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts` — must exist and pass, OR a playtest doc.

**Status**: [x] Created — `src/game/missionParams.test.ts` (AC 21: Hardened profile table and mods), `src/game/world.test.ts` (AC 21: +2 patrols, +6 civilians, cones and patrols still emitted, +1 m sight, sight-confirm ×1.15 measured in the sim, optional window 90 s → 76.5 s; R5-a; R5-b), `src/scene/cameraPose.test.ts` (AC 22: pose literals read from `CameraRig.tsx` source, minimap shares `CAMERA_YAW`); manual half: `production/qa/evidence/tm-015/README.md` (qa-lead signed off 2026-10-16)

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 4/4 passing (AC 21, AC 22, R5-a, R5-b); none deferred
**Deviations**: None. ADR-0016 compliant: the pose constants stay local to `src/scene/CameraRig.tsx` (an earlier `src/scene/cameraPose.ts` module was removed in the review fix pass because ADR-0016 forbids a CameraPose module); no production source changed against HEAD.
**Test Evidence**: Integration: `src/game/missionParams.test.ts`, `src/game/world.test.ts`, `src/scene/cameraPose.test.ts` (11 TM-015 tests passing, 2026-10-16); manual half of AC 22: `production/qa/evidence/tm-015/` (README.md, 01–06, 05b, capture.json, capture.mjs; 1280x720, headless Playwright)
**QA Sign-off**: QA sign-off (qa-lead, 2026-10-16): TM-015 manual evidence production/qa/evidence/tm-015/ accepted — 1280x720 before/after pairs for drag (01→02), wheel (02→03) and arrows (03→04) show yaw and elevation unchanged (footprint bearings -45/-135 and ratios 1.3675/0.8129 held), with only zoom or pan changing; minimap up matches screen up (01); Hardened is confirmed active (06, vision 12.2 vs 11.2) and the minimap still draws patrol cones after Pulse Scan (05/05b).
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Engine specialists CLEAN; Testability GAPS (advisory); ADR-0016 COMPLIANT; Architecture CLEAN; SOLID COMPLIANT. An earlier review in workflow wf_8782c3ca-7cd returned CHANGES REQUIRED (CameraPose module vs ADR-0016, untested sight-confirm ×1.15, 800x600 evidence); the fix pass resolved all three.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/missionParams.ts:109 hardened optFailMul 0.85 → 0.9 → "Hollow Crown optional window: 90 s on Standard, 76.5 s on Hardened (AC 21)" (and the missionParams Hardened profile tests) failed; restored (cmp match, test file green). Fix pass: removing `* mods.sightConfirmMul` at src/game/world.ts:1163 made "Hardened stretches sight-confirm time by ×1.15 in the sim (AC 21)" fail; restored.
**Run result**: OBSERVED — production/qa/evidence/tm-015/ (signed off by qa-lead above)
**Story-done decisions (autonomous)**: Phase 7 "Close the story (Recommended)" taken as default; QL-TEST-COVERAGE skipped — Lean mode; no tech-debt rows logged.

**Code review advisory findings (follow-up candidates):**
- `src/game/world.test.ts:1848` (VERIFIED): the R5-b test computes `0.45 * mods.enemyAccMul` from a literal and calls `hitChance`, so it does not show the sim fires with 0.495; the wiring is pinned by the TM-011 source check at `world.test.ts:3861` (`tryFire(e, tgt, ENEMY_ACC * mods.enemyAccMul)`).
- `src/scene/cameraPose.test.ts:43-48` (VERIFIED): the minimap test recomputes the rotation in the test instead of calling `turnX`/`turnZ` (`src/ui/Minimap.tsx:55-60`, not exported); only the three `toContain` checks bind it to Minimap.tsx.
- `src/scene/cameraPose.test.ts:19-20` (VERIFIED): `rigSrc.match(...)` returns null when nothing matches, so `toHaveLength(1)` throws a matcher error instead of a clear failure; use `(… ?? []).length`.
- `src/scene/cameraPose.test.ts` (VERIFIED): pose checks are exact source-text matches; a reformat or the ADR-0016 hoist of `ELEV`/`MIN_DIST`/`MAX_DIST`/fov would break them with no behaviour change. `useFrame(…, 0)` priority (`CameraRig.tsx:231`) is not pinned.
- `src/game/world.test.ts` AC 21 patrols test (VERIFIED): `routed(hard) >= routed(std)` also passes when equal, so it does not prove the 2 extra patrols have routes.
- `src/game/world.test.ts` `certaintyAfter` (VERIFIED): `find(...)!` and `g.patrol!.length = 0` throw a TypeError instead of failing an assertion if the trooper or its route is missing; the sight-confirm source pin duplicates the measured 1.15 ratio.
- `src/game/missionParams.test.ts` (VERIFIED): the profile-knobs test picks Hollow Crown by `MISSIONS[1]` without asserting its codename.
- QA (qa-lead, advisory): `capture.json` field `conesDrawn` counts living enemies, not rendered cones.

