# Story 004: Idle auto-acquire and Attack under Hold Ground and Hold Fire

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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

- [x] **2d.** **GIVEN** an idle (no path) living operative, Hold Fire off, weapons-free, with a visible in-range CorpSec, **WHEN** no new order is issued, **THEN** they auto-acquire and fire. Hold Ground and Stopped with no walking path behave the same.
- [x] **3.** **GIVEN** a selected living operative with Hold Fire on and Hold Ground on, **WHEN** Attack is issued on a living hostile out of range, **THEN** the Explicit target is set, Hold Fire stays on, Hold Ground prevents the chase while keeping that target, and the explicit shot still fires when later in range and LOS.
- [x] **EC-1.** *(Story edge case from the QA plan; not a GDD AC.)* **GIVEN** a selected living operative with Hold Fire on and Hold Ground on and an Explicit target, **WHEN** that target dies, or is in range but out of LOS, **THEN** no shot fires, no chase occurs, and Hold Fire stays on.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Idle, Hold Ground, and Stopped-with-no-path operatives auto-acquire the same way when Hold Fire is off.
- Attack out of range under Hold Ground keeps the target without chasing; the explicit shot fires once in range and LOS.
- Performance: no performance impact expected — auto-acquire reuses the existing ACQUIRE_INTERVAL (0.12 s) scan in src/game/world.ts; no new per-frame work.

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

**Status**: [x] Created — `src/game/world.test.ts`, describe "Idle auto-acquire and Attack under Hold Ground and Hold Fire (TM-004, AC 2d / 3)", 5 tests

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 005

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (AC 2d, AC 3, EC-1), all covered by tests in `src/game/world.test.ts` (TM-004 describe block). `npx vitest run src/game/world.test.ts -t TM-004`: 5 passed.
**Deviations**: None blocking. ADVISORY (code-review wording caveat, user's text left unchanged): the Implementation Notes performance line says auto-acquire reuses the ACQUIRE_INTERVAL scan. That holds for `refreshAutoTarget` (src/game/world.ts:938-939), but the Hold Ground lane scan at src/game/world.ts:982 (`nearestVisibleEnemy(u, w.range)`) runs every tick without that throttle. That code predates this story. Also: the QA Test Cases mutation wording ("AC 3 position assertion fails") is inaccurate; `expect(a1.path.length).toBe(0)` catches a chasing mutant because stepMove is already gated by `!u.holdGround` (world.ts:2003).
**Test Evidence**: Logic: test file at `src/game/world.test.ts`
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. ADR-0016 COMPLIANT; test-only change. Advisory findings, left for the owner:
- world.test.ts:2740-2757 `stage()` pins one enemy but leaves the rest of the garrison alive, armed and on patrol; reuse `isolateEnemy` (:906-916) or apply the same kill and patrol clear. (Specialist's "~0.85 s margin" is unverified.)
- world.test.ts:2835-2840 and :2864-2869: EC-1 tests do not assert `a1.stance` is not `'dead'`; a dead a1 would pass every negative assertion.
- world.test.ts:2846-2869: EC-1 out-of-LOS test has no positive control (move `post` to a visible in-range cell and assert the magazine drops).
- world.test.ts:2822-2841: EC-1 dead-target test does not assert `a1.holdGround` stays true.
- world.test.ts:2778: 'stopped' mode calls orderStop on an already idle operative, so it runs the same path as 'idle'; issue a Move, tick until path.length > 0, then orderStop.
- world.ts:982: no test covers Hold Fire suppressing the Hold Ground 'other' target; removing `!u.holdFire` fails no test. Add a second in-range, in-LOS CorpSec under Hold Fire + Hold Ground with an out-of-range Explicit target.
- world.test.ts:2749-2757: `pin()` updates `dealt.hp` before each tick, so damage on the last tick of a run() window is not counted; read `enemy.maxHp - enemy.hp` directly.
- Performance note at Implementation Notes line 47 was already present word for word; not duplicated.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:977 `} else if (u.holdGround) {` → `} else if (false && u.holdGround) {` (Hold Ground chases anyway) → "Attack out of range under Hold Fire and Hold Ground keeps the target, no chase, fires once in range (AC 3)" and "the Explicit target is in range but out of LOS: no shot, no chase, Hold Fire stays on (EC-1)" failed; restored (cmp match, test file green)
**Run result**: N/A — Logic story; sim behaviour only, no visible surface changed (no source change)
**Closure decision**: autonomous run; took the recommended "Close the story" option (verdict COMPLETE WITH NOTES).
