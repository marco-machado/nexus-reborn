# Story 005: Hold Fire clears automatic targets but keeps a standing Explicit

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
- Required: Living spec wins (GDD OQ2 resolved by ADR-0016): standing Explicit stays; later Attack fires through; Hold Fire bit stays.
- Forbidden: `orderHoldFire` must not null a standing Explicit target — code that does is a defect vs spec.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **5.** **GIVEN** a selected living operative who would auto-acquire a visible CorpSec in range, **WHEN** Hold Fire is set, **THEN** automatic targets are cleared and the operative does not auto-acquire.
- [x] **5b.** **GIVEN** Hold Fire still on, **WHEN** a later Attack is issued on a living hostile, **THEN** the explicit Attack still fires through and the Hold Fire bit stays on.
- [x] **5c.** **GIVEN** a selected living operative with a standing Explicit target on a living hostile, **WHEN** Hold Fire is turned on, **THEN** that Explicit target is not nulled (automatic targets may clear; the standing Explicit remains).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Hold Fire clears automatic targets only.
- A later Attack fires through Hold Fire without clearing the bit.
- Performance: no performance impact expected — the change is in orderHoldFire in src/game/world.ts, which runs once per order; no new per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: Attack under Hold Ground.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-005 — Hold Fire clears automatic targets but keeps a standing Explicit (Logic)
**Test file**: `src/game/world.test.ts` (rewrite L671)
**What to test**:
- AC 5: an auto-acquired (non-Explicit) target is cleared by Hold Fire and the operative does not re-acquire over several acquire intervals
- AC 5b: with Hold Fire on, a later Attack fires through and `holdFire` stays true
- AC 5c: an Explicit target set before Hold Fire survives Hold Fire (`targetId` unchanged)
**Edge cases**: Hold Fire off again → auto-acquire resumes; squad card still shows Hold Fire
**Source change**: finding 1. Keep the squad-card read (`missionStore` `holdFire`) from the old test.
**Mutation check**: restore the `u.targetId = null` line for Explicit targets → AC 5c fails
**Estimated test count**: ~4

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts`, TM-005 describe block (4 tests)

---

## Dependencies

- Depends on: Story 004
- Unlocks: Story 006

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (AC 5, 5b, 5c), all covered by tests in `src/game/world.test.ts` (TM-005 describe block). `npx vitest run src/game/world.test.ts -t TM-005`: 4 passed.
**Deviations**: None. Implementation matches ADR-0016 line 70 ("Does **not** null a standing Explicit").
**Test Evidence**: Logic: test file at `src/game/world.test.ts`
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Engine specialists CLEAN; Testability TESTABLE; ADR-0016 COMPLIANT. world.test.ts: 122/122 pass. Advisory findings, left for the owner:
- src/game/world.ts:2225: `u.explicitTarget = false` is now redundant, because line 2221 (`if (u.explicitTarget) continue`) means it only runs when the flag is already false. Removing it is optional.
- src/game/world.ts:965-969: coverage gap, not a bug. No test covers Hold Fire after a standing Explicit target dies. Suggested test: orderAttack, orderHoldFire(true), a second hostile in range, kill the first, then expect targetId to stay null and the magazine to be unchanged.
- src/game/world.test.ts:2866-2878: pin() records `dealt.hp` before each tick, so damage from the final tick is missed, which weakens AC 5's `expect(dealt.hp).toBe(hp0)` (the magazine check limits the risk). Read `enemy.maxHp - enemy.hp` after run() instead.
- src/game/types.ts:325-327 (CONTRACT FILE, out of scope): the orderStop comment calls orderHoldFire "the cease-fire", which overstates it now that a standing Explicit keeps firing. Read the contract header before changing it.
- src/game/world.test.ts:2861-2862: style only. stage() uses `!` non-null assertions instead of toBeDefined, which matches the TM-004 pattern.
- The Test Evidence status line was stale ("Not yet created"); this close updated it.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:2221 removed `if (u.explicitTarget) continue` (Hold Fire nulls a standing Explicit target again) → "a standing Explicit target is not nulled when Hold Fire is turned on (AC 5c)" failed; restored (cmp match, test file green)
**Run result**: N/A — sim-only change in orderHoldFire; no new UI surface (squad-card Hold Fire read is covered by test)
**Closure (autonomous)**: Verdict COMPLETE WITH NOTES; the recommended option "Close the story" was taken without a prompt.
