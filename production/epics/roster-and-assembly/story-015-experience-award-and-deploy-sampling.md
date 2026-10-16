# Story 015: Experience award and deploy sampling

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create; the running mission never reads live stores.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** S living survivors and K KIA at debrief, **WHEN** the outcome is applied once, **THEN** each survivor’s Experience increases by exactly 1 and each KIA is awarded 0. *(GDD AC 25)*
- [x] **GIVEN** Experience awarded at debrief, **WHEN** the next mission is created, **THEN** that Experience is sampled into that deploy; later awards do not change an on-ground squad. *(GDD AC 26)*
- [x] **GIVEN** an operative with deployment max HP `H0` and 1 Experience awarded at the prior debrief, **WHEN** the next mission is created, **THEN** `operative_mass` computes the plating term from `H0 + 2` and the sampled speed includes +0.05 m/s (magnitudes per living spec §6 — not restated here). *(GDD AC 44)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- +1 Experience per living survivor, 0 for KIA, once per apply.
- Experience is sampled into the Roster slice at create (`maxHp` / `speed` final values); `createWorld` does not re-run `xpBonus`. Magnitudes per living spec §6 (`src/game/experience.ts`).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 020: other freeze fields.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`, deploy-freeze test
**What to test**:
- Each survivor +1 Experience, each KIA 0, applied once (AC 1)
- Experience sampled into the next deploy; a later award does not change an on-ground squad (AC 2)
- H0 + 2 enters the plating term and sampled speed includes +0.05 m/s (AC 3)

**Edge cases to cover**: quiet-replay survivors still +1; Abort awards none. Read magnitudes from `xpBonus`, do not copy `XP_HP_PER` / `XP_SPEED_PER`.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/experience.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` "Experience award and deploy sampling (RA-015)" (4 tests); `src/game/experience.test.ts` (existing)

---

## Dependencies

- Depends on: Story 013, Story 001
- Unlocks: Story 018, Story 020

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (GDD AC 25, 26, 44). All are covered by `src/state/campaignStore.test.ts` "Experience award and deploy sampling (RA-015)". `npx vitest run src/state/campaignStore.test.ts` gave 70/70 passed at /story-done.
**Deviations**: None. The implementation matches TR-roster-002, GDD Core Rules 5 and 10, and the Experience award rule, and reads magnitudes from `xpBonus` (`XP_HP_PER` = 2 and `XP_SPEED_PER` = 0.05 in `src/game/experience.ts` match the GDD's +2 max HP / +0.05 m/s). The story is on manifest 2026-10-08, which is current. Scope: only `src/state/campaignStore.test.ts` was changed.
**Test Evidence**: Logic. Test file at `src/state/campaignStore.test.ts` (4 RA-015 tests); `src/game/experience.test.ts` already existed.
**Run result**: N/A. Logic story; award and deploy sampling have no on-screen surface beyond the existing Debrief XP rows (from the /dev-story checkpoint).
**Code Review**: /code-review ran on `src/state/campaignStore.test.ts`. Verdict: NOT ASSESSED. The lead-programmer, gameplay-programmer and qa-tester specialists could not be spawned because the workflow subagent had no Agent tool. The reviewer found no defects in its own review. Lean mode: the LP-CODE-REVIEW gate and QL-TEST-COVERAGE were skipped. Recommend re-running /code-review where the Agent tool is available before sprint close-out.
**Advisory findings (from /code-review)**:
- Review gap: the specialists could not be spawned, so the verdict is NOT ASSESSED. The reviewer's own checks: vitest 70/70, `npx tsc -b` exited 0, eslint was clean on the test file.
- The Abort leg of "a quiet replay still awards survivors +1; an Abort awards none" sets `outcome: null` by hand, so it only shows that an empty outcome applies nothing (`src/state/debrief.ts:22-23`). It does not drive the real PauseMenu onAbort path (`src/ui/Hud.tsx:596-606`, `recordAbort` then `goto('world')`). A better test applies an outcome first, runs the Abort sequence with that stale outcome still in the store, then asserts that xp and `lastAppliedKey` are unchanged.
- AC 25 test: "each KIA is awarded 0" is shown only indirectly, through `roster.op2` being undefined and op2 missing from `lastReport.xp`. Acceptable as written.
- AC 44 test: the mass delta `bonus.maxHp * ARMOR_KG_PER_HP` holds only while op1's maxHp plus the crew bonus is above `ARMOR_HP_FLOOR` (`src/game/mass.ts:54`). A comment or a guard assertion would make that dependency visible.
- The test reads magnitudes from `xpBonus(1)`, not the GDD AC 44 literals, as the QA note intends. If a literal check on the constants is wanted, put it in `src/game/experience.test.ts`.
- Positive: the tests follow ADR-0009 (sampling via `freezeDeploy`, existing slice unchanged after a later award) and check the apply-once key. No ADR-0009 or ADR-0002 violation was found.
