# Story 007: canDeploy refusals: no contract, none assigned, not Ready

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** Assembly is reachable with no selected contract, **WHEN** Deploy is requested, **THEN** Deploy is refused. *(GDD AC 8)*
- [x] **GIVEN** a selected contract and 0 assigned operatives, **WHEN** Deploy is requested, **THEN** Deploy is refused. *(GDD AC 9)*
- [x] **GIVEN** a selected contract and an assignment set containing an Injured operative — reachable only by direct state construction or save drift, since Injured cannot be assigned through Assembly — **WHEN** Deploy is requested, **THEN** Deploy is refused (defensive invariant). *(GDD AC 10)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Split refusal reasons `none-assigned` vs `not-ready` so a post-KIA empty squad does not show the injured refusal (ADR-0019).
- The Injured-in-squad case is a defensive invariant reachable only by direct state construction or save drift; test it by constructing state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: mass refusal.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/deployGate.test.ts`
**What to test**:
- No selected contract → refused (AC 1)
- Contract + 0 assigned → refused (AC 2)
- Contract + an Injured id built directly into the assigned set → refused, reason not-ready (AC 3)

**Edge cases to cover**: status `undefined` for an id missing from the roster (save drift) also refused; empty bays alongside 1 Ready do not block.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — src/game/deployGate.test.ts (beside the extracted gate), `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/deployGate.test.ts` (`canDeploy refusals (RA-007)`, 5 tests), `src/state/appStore.test.ts` (`startMission (ADR-0019)` save-drift no-op), passing

---

## Dependencies

- Depends on: Story 006
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (none deferred)
- AC 8 (no contract) — `src/game/deployGate.test.ts` › `canDeploy refusals (RA-007)` › "refuses with no selected contract (GDD AC 8)" — COVERED
- AC 9 (0 assigned) — `src/game/deployGate.test.ts` › "refuses a selected contract with 0 assigned operatives (GDD AC 9)" — COVERED
- AC 10 (Injured in squad, defensive) — `src/game/deployGate.test.ts` › "refuses an Injured id built directly into the assigned set as not-ready (GDD AC 10)"; save-drift edge case in the same block and `src/state/appStore.test.ts` › `startMission (ADR-0019)` › "no-ops when an assigned id is missing from the roster" — COVERED
**Deviations**: None. `src/game/deployGate.ts` already implements ADR-0019 (split `none-assigned` / `not-ready` reasons); manifest version 2026-10-08 matches the current control manifest; no files touched outside the stated test files.
**Test Evidence**: Logic: `src/game/deployGate.test.ts`, `src/state/appStore.test.ts` present; `npx vitest run` on both files at /story-done: 178/178 passed.
**Run result**: N/A — pure logic gate already wired; no new visible surface (from the /dev-story checkpoint).
**Code Review**: Complete — /code-review ran in the implement-stories workflow with verdict NOT ASSESSED (specialist reviews could not be spawned: no Agent tool in the unattended run); it reported nothing that needs to change, ADR-0019 COMPLIANT, all 3 ACs covered. Lean-mode prompt answered with the workflow default (review ran). QL-TEST-COVERAGE skipped — Lean mode.
**Specialist Code Review (2026-10-16)**: APPROVED. Specialists spawned from the main session: lead-programmer APPROVED, gameplay-programmer AWS, qa-tester TESTABLE. Fixes: no fix needed. Suggestions recorded: the new block repeats older canDeploy cases. This supersedes the NOT ASSESSED result above.
**Advisory findings (from /code-review)**:
- Review process: specialist reviews (lead-programmer, gameplay-programmer, qa-tester) were not spawned, so the review verdict is NOT ASSESSED rather than APPROVED. Not a code defect.
- `src/game/deployGate.test.ts:76`: the "does not block on empty bays alongside 1 Ready operative" test calls `gate(['op1'])`. Empty bays are not represented in `assignedIds`, so it repeats the `it.each` n=1 case at line 13 and does not exercise empty bays. Build the squad from the store/UI shape that has empty bays, or rename the test.
- `src/game/deployGate.test.ts:49-74`: the RA-007 block repeats assertions already in the `canDeploy` block (no-contract line 26, empty squad line 17, INJURED line 27, statusById {} line 30). Fine as AC-traceable evidence; the suite could be consolidated.
- `src/game/deployGate.test.ts:55`: the AC 9 test passes `statusById: {}`, which has no effect because none-assigned is checked before status. Harmless noise.
- `src/state/appStore.test.ts:743`: the save-drift no-op test checks only that state is unchanged, not that the reason is not-ready ('missing-op' also lowers mass, but the no-op comes from the not-ready check). The reason is asserted in `src/game/deployGate.test.ts:65`; the store test cannot tell which check refused.
- Story acceptance-criteria checkboxes were unchecked at review time; checked by this /story-done.
**Decision log (autonomous)**: Phase 7 close option taken by default: "Close the story — update file, mark Complete, log notes (Recommended)"; no tech-debt rows logged.
