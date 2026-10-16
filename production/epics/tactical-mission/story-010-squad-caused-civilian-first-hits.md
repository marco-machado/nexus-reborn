# Story 010: civiliansHit counts unique squad-caused civilian first-hits

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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

- [x] **11.** **GIVEN** a fire-lane fixture where a squad miss continues into a civilian before cover, **WHEN** that first squad-caused civilian hit resolves, **THEN** `civiliansHit` increases by 1 (first hit, not death).
- [x] **12.** **GIVEN** that same civilian already counted, **WHEN** the squad hits them again, **THEN** `civiliansHit` does not increase.
- [x] **13.** **GIVEN** civilian harm caused only by CorpSec, **WHEN** those hits resolve, **THEN** `civiliansHit` stays 0 (telemetry may still record CorpSec-caused hits separately).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- First hit, not death; one civilian counts once.
- CorpSec-caused hits never increment `civiliansHit` (telemetry may record them separately).
- Performance: no performance impact expected — civilian hits are counted per hit in applyDamage (src/game/world.ts:724-729) with one Set lookup, and only for civilians the squad hits. No per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: cover and the hit roll.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-010 — civiliansHit counts unique squad-caused civilian first-hits (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 11: squad miss into a civilian before cover → `civiliansHit` +1 (hit, not death)
- AC 12: same civilian hit again by the squad → no increase
- AC 13: CorpSec-only civilian harm → `civiliansHit` 0
**Edge cases**: two different civilians → 2; squad grenade on two civilians → +2, once each (GDD Edge Case); Loss still emits `N`
**Mutation check**: drop the "already counted" set → AC 12 fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts`, describe 'civiliansHit counts unique squad-caused civilian first-hits (TM-010, AC 11 / 12 / 13)', 5 tests

---

## Dependencies

- Depends on: None
- Unlocks: Story 011

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (AC 11, 12, 13 each covered by a named test in `src/game/world.test.ts`; none deferred). Run by /code-review: `npx vitest run src/game/world.test.ts -t TM-010` 5 passed. /story-done itself ran no tests.
**Deviations**: None. ADR-0016 COMPLIANT. Code root has no diff (`src/game/world.ts` unchanged); story change is 176 added test lines. Implementation Notes line reference corrected to world.ts:724-729.
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (TM-010 describe block, 5 tests: AC 11, AC 12, AC 13, grenade on two civilians, Loss still emits N)
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Suggestions not applied (autonomous run; recorded here).
Advisory findings (from /code-review, all verified, testability GAPS, none blocking):
- src/game/world.test.ts:3459-3471 + src/game/world.ts:715 (qa-tester): no TM-010 test kills a civilian; bystanders() sets hp = TOUGH (100000), so the death branch never runs. A mutation that also counts on death would pass. Suggested: a low-HP civilian killed by one squad hit → civiliansHit === 1 and exactly one 'COLLATERAL COUNT' line.
- src/game/world.ts:724-728 (qa-tester): no test has CorpSec hit a civilian first and the squad hit it afterward. If `billed.add` moved outside the agent check, such a civilian would never be billed and current tests would pass. Suggested: CorpSec hits X, squad then hits X, count is 1.
- src/game/world.test.ts:3561 (gameplay-programmer): QA plan edge case 'two different civilians → 2' via gunfire is not tested separately; only the grenade path has two civilians. Gunfire paths (world.ts:869 hit, :888 stray) tested with one civilian each. Low risk (shared applyDamage).
- src/game/world.test.ts:3555 (lead-programmer + gameplay-programmer): `?? 0` in the civilianHitsByCorpsec assertion is redundant; assert `out?.telemetry` defined first and drop `?? 0` for a clearer failure message.
- src/game/world.test.ts:3508-3509 (qa-tester): the `stance not dead` / `hp > 0` assertions only restate the TOUGH setup; civiliansHit === 1 does the work. Can stay as documentation.
- src/game/world.test.ts:3502-3504 (lead-programmer): AC 11 fixture asserts only hasLos(a1 → civ); nothing asserts the strike came from the stray path (relies on placement and world.ts:863-869). Low risk: enemy muzzled, both pinned.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:724 dropped `&& !billed.has(t.id)` (the already-counted guard) → 'the squad striking the same civilian again does not raise the count (AC 12)' and 'one squad grenade on two civilians counts 2, once each; a second blast adds nothing (edge cases)' failed; restored (cmp match, test file green 142/142)
**Run result**: N/A — Logic story; counter verified headless by vitest, HUD collateral readout unchanged (from /dev-story checkpoint).
**Autonomous decisions**: Phase 7 close option taken as the recommended default "Close the story — update file, mark Complete, log notes"; advisory findings not logged to docs/tech-debt-register.md. QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW not spawned — Lean mode; specialist /code-review verdict supplied by the workflow.
**Untested (advisory)**: none of AC 11-13; the edge cases above are recommended for a follow-up.
