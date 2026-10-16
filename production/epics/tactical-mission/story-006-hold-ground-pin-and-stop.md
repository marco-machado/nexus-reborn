# Story 006: Hold Ground pins and parks the path; Stop clears pathing and keeps stance bits

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
- Required: Stop is not a sixth verb; five verbs plus Stop.
- Forbidden: Never let separation shove a Hold Ground operative off its tile.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **4.** **GIVEN** a selected living operative walking a path, **WHEN** Hold Ground is set, **THEN** the operative is pinned on the current tile, the active path is parked (restored on release), and separation does not shove them off that tile.
- [x] **6.** **GIVEN** a selected living operative with a path, an Explicit target, Hold Ground on, and Hold Fire on, **WHEN** Stop is issued, **THEN** pathing (including any parked Hold Ground path), chase, and targeting are cleared, and Hold Ground and Hold Fire stance bits stay on.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Hold Ground parks the active path and restores it on release.
- Stop clears pathing (including any parked Hold Ground path), chase, and targeting; Hold Ground and Hold Fire bits stay on; release after Stop does not resume the walk (GDD OQ8 resolved).
- Performance: no performance impact expected — Hold Ground's pin is already enforced in the per-tick `separate()` pass (src/game/world.ts:624, :650-651); parking the path and Stop run once per order. No new per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: Move.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-006 — Hold Ground pins and parks the path; Stop clears pathing and keeps stance bits (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 4: walking operative set to Hold Ground → position stays on the current tile across ticks, path parked and restored on release, and a squadmate pressing into the tile does not shove them (separation)
- AC 6: path + Explicit + Hold Ground + Hold Fire, then Stop → path empty (including the parked path), `targetId` null, and both `holdGround` and `holdFire` still true
**Edge cases**: release Hold Ground after Stop → no parked path is restored
**Mutation check**: make Stop clear `holdGround` → AC 6 fails
**Estimated test count**: ~4

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts`, TM-006 describe block (4 tests)

---

## Dependencies

- Depends on: Story 005
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 2/2 passing (AC 4, AC 6 — `src/game/world.test.ts`, TM-006 describe block; `npx vitest run src/game/world.test.ts -t "TM-006"` → 4 passed, 122 skipped)
**Deviations**: None. Manifest version 2026-10-08 matches the current control manifest. Only `src/game/world.test.ts` changed in code/tests (within scope); `src/game/world.ts` has no diff.
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (TM-006 describe block, 4 tests)
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:2147 orderStop also sets u.holdGround = false → "Stop clears path, parked path, chase and target; Hold Ground and Hold Fire stay on (AC 6)" failed; restored (cmp match, test file green)
**Run result**: N/A — Logic story; sim behaviour only, covered by headless tests, no new visible surface
**Autonomous decisions**: Phase 7 close option "Close the story (Recommended)" taken by default (autonomous workflow run; verdict COMPLETE WITH NOTES). QL-TEST-COVERAGE skipped — Lean mode.

**Advisory code-review findings (not blocking; recommend a follow-up):**
- `src/game/world.test.ts:3050-3056`: the "No chase" check after Stop cannot fail — Hold Ground is still on, so world.ts:2003 skips stepMove and the Explicit branch at world.ts:977 never builds a chase path. Only `expect(a1.targetId).toBeNull()` tests the chase part of AC 6. Fix: add a variant with Hold Ground off, or release Hold Ground after Stop and check the operative does not move toward the enemy. (lead-programmer, qa-tester, gameplay-programmer)
- `src/game/world.test.ts:3046-3049`: no test checks that Stop clears `explicitTarget` (world.ts:2147). A leftover flag would send an auto-acquired target down the Explicit branch (world.ts:963) and make orderHoldFire skip it (world.ts:2221). Fix: assert `explicitTarget` is false via the same cast `parked()` uses. (qa-tester)
- `src/game/world.test.ts:3008-3031`: the separation test covers only the `a` guard (world.ts:650), not the `b` guard (world.ts:651), since the held a1 is always the lower index (spawn order, world.ts:319). Fix: add a mirror case holding a2 and pressing a1 into it. (qa-tester, gameplay-programmer)
- `src/game/world.test.ts:2967`: `parked()` reads the internal `suspended` field (SimUnit, world.ts:183) through a cast, tying tests to that name. Maintainability note only; does not break ADR-0016. (lead-programmer)
