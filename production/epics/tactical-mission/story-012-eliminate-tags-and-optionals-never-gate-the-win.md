# Story 012: Eliminate counts tagged Units only; optionals never gate the win

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **15.** **GIVEN** an eliminate-tag required objective whose tag is garrison (street patrols untagged), **WHEN** every tagged Unit is dead and at least one untagged street patrol is still alive, **THEN** the eliminate objective completes and the required sequence can complete with that untagged patrol alive. Untagged street patrols do not gate eliminate.
- [x] **16.** **GIVEN** every required objective complete and every optional ignored or failed, **WHEN** the mission result is read, **THEN** the result is Win; optionals never gate the win; failing or ignoring an optional costs nothing to the win (bonus may be 0).
- [x] **R5-a.** *(Story criterion: the QA edge case for AC 15, so the eliminate test can fail.)* **GIVEN** an eliminate-tag required objective whose tag is garrison, **WHEN** every untagged street patrol is dead and at least one garrison-tagged Unit is still alive, **THEN** the eliminate objective is not complete and the required sequence does not complete.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Untagged street patrols do not gate eliminate.
- A Win with ignored or failed optionals may carry bonus 0.
- Performance: no performance impact expected — the eliminate-tag check is the existing scan of the unit list in objectiveMet (src/game/world.ts:1615); the story counts only tagged Units and adds no new scan. No new per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: Loss and abort.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-012 — Eliminate counts tagged Units only; optionals never gate the win (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 15: garrison-tagged eliminate completes when every garrison Unit is dead and an untagged street patrol lives; the required sequence completes
- AC 16: all required done, every optional failed or ignored → result Win
**Edge cases**: a tagged Unit still alive → objective not complete
**Mutation check**: count every enemy for eliminate → AC 15 fails
**Estimated test count**: ~3

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts` (TM-012 block: AC 15, AC R5-a, AC 16)

---

## Dependencies

- Depends on: None
- Unlocks: Story 013

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (AC 15, AC 16, R5-a), all covered by unit tests in `src/game/world.test.ts`; none deferred
**Deviations**: None blocking. Advisory: the story's TR-ID `TR-tactical-010` reads "Win or Loss shows a HUD result then debriefs after 2.5 s; abort emits no outcome DTO" in `docs/architecture/tr-registry.yaml`; ACs 15/16 come from the GDD win rules, not that HUD/debrief text, so the TR reference is loose (no code contradiction).
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (TM-012 block; /code-review re-ran `npx vitest run src/game/world.test.ts -t "TM-012"`: 3 passed, 149 skipped)
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Engine specialist findings CLEAN; Testability TESTABLE; ADR-0016 COMPLIANT (tests set enemy holdFire directly and do not stamp the orderHoldFire defect); Architecture CLEAN; SOLID COMPLIANT. Review was read-only; option [A] logged as autonomous default, no edits made.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:1628 dropped `u.tag === def.tag &&` (eliminate counts every enemy) → "every garrison Unit dead with an untagged street patrol alive completes eliminate and the win (AC 15)" failed; restored (cmp match, test file green)
**Run result**: N/A — sim-only rule (objective completion); no new player-visible surface
**Story-done decisions (autonomous)**: Phase 7 close option "Close the story (Recommended)" taken as default; QL-TEST-COVERAGE and LP-CODE-REVIEW skipped — Lean mode.

**Code review advisory findings (follow-up candidates):**
- `src/game/world.test.ts:3734` (VERIFIED; lead-programmer, gameplay-programmer): the `muzzle` helper runs `u.patrol!.length = 0`, but `src/game/types.ts:86` declares `patrol?: Vec2[]`. If the seed or roster gives `untagged[0]` or `garrison[0]` no patrol, the test throws a TypeError instead of failing an assertion. Suggestion: `if (u.patrol) u.patrol.length = 0`.
- `src/game/world.test.ts:3851` (VERIFIED; qa-tester): the AC 16 test waits `warm(w, 1.5)` for an optional with `failSec: 1`; the real window is `d.failSec * mods.optFailMul` (`world.ts:295`; optFailMul 1 standard, 0.85 hardened, `missionParams.ts:101/109`). If the multiplier ever exceeds 1.5 the test fails on `failed: true` rather than on AC 16. Suggestion: derive the wait from optFailMul, or assert the multiplier.
- `src/game/world.test.ts:3821` (VERIFIED code path, behaviour not tested; qa-tester): AC 16 is tested only with optionals placed before the first required objective. An optional after the last required objective gets `companion === undefined` in activateRequired (`world.ts:1617-1619`) and stays pending; the win check `reqPtr >= requiredOrder.length` (`world.ts:1801`) ignores optionals, so it should still be a Win, but no test covers it. Suggestion: a case with `objectives: [...MISSION.objectives, optional]`.
- Story file Test Evidence line (VERIFIED): read "Not yet created"; updated here.
- The review did not run the mutation itself (read-only); the dev-story mutation check above covers it.
