# Story 012: injuryRecoverySec helper values

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** living `f = 0.175`, **WHEN** `injuryRecoverySec` is computed, **THEN** `D = 108000` s. *(GDD AC 57)*
- [x] **GIVEN** the helper is evaluated at `f = 0`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 172800 s; the injury rule still does not invoke it because `f = 0` is KIA. *(GDD AC 58)*
- [x] **GIVEN** the helper is evaluated at `f = 0.35`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 43200 s; the injury rule does not invoke it and applies no new injury. *(GDD AC 59)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `injuryRecoverySec(f)` in `src/state/campaignStore.ts` is a helper; evaluating it at f = 0 or 0.35 is allowed even though the injury rule never invokes it there.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: when the injury rule invokes it.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`
**What to test** (`round(43200 + (1 − clamp(f, 0, 0.35) / 0.35) × 129600)`):
- f = 0.175 → 108000 (AC 1)
- f = 0 → 172800, and the injury rule does not call it for KIA (AC 2)
- f = 0.35 → 43200, and the injury rule applies no injury (AC 3)

**Edge cases to cover**: f < 0 and f > 0.35 clamp; result is an integer.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` (`describe('injuryRecoverySec helper values (RA-012)')`, 4 tests; file 56/56 passing on 2026-10-16)

---

## Dependencies

- Depends on: None
- Unlocks: Story 013

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred). AC 57, 58, 59 each covered by a unit test in `src/state/campaignStore.test.ts`; `npx vitest run src/state/campaignStore.test.ts` → 56/56 passed.
**Deviations**: None. Implementation in `src/state/campaignStore.ts` matches the GDD formula `round(43200 + (1 − clamp(f, 0, 0.35) / 0.35) × 129600)`; durations come from the `INJURY_RECOVERY_MIN`/`INJURY_RECOVERY_MAX`/`INJURY_HP_FRAC` constants. Only the test file changed (helper already existed); within scope.
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts`
**Run result**: N/A — pure helper with no player-visible surface change (from the /dev-story checkpoint).
**Code Review**: Complete — /code-review ran on `src/state/campaignStore.ts` and `src/state/campaignStore.test.ts` with verdict NOT ASSESSED (lead-programmer and qa-tester specialists could not be spawned); the reviewer found no blocking defects. ADR-0001 COMPLIANT, Standards 5/6, Architecture CLEAN, SOLID COMPLIANT. Re-run /code-review where specialists can be spawned for an APPROVED verdict. LP-CODE-REVIEW and QL-TEST-COVERAGE gates skipped — lean mode.
**Advisory findings from /code-review**:
- Process gap: specialist reviews (lead-programmer, qa-tester) did not run, hence NOT ASSESSED rather than APPROVED.
- Missing doc comment: exported `injuryRecoverySec` (`src/state/campaignStore.ts`) has no doc comment of its own; the comment above `INJURY_HP_FRAC` describes the scaling (Standards 5/6).
- Weak AC 58 check: the KIA non-invocation is shown indirectly (empty `lastReport.injured`, roster entry removed), not via a spy; adequate for the AC as worded, and a spy would not catch an intra-module call anyway.
- Edge case not covered: `injuryRecoverySec(NaN)` returns NaN (so `recoverAtT` could become NaN if `survivorHp` held NaN). Not required by the QA plan; hardening suggestion only.
- Overlapping tests: existing min/max endpoint tests (via constants) overlap the new RA-012 literal-value tests; both can stay.
**Autonomous decisions**: Phase 5 code-review question and Phase 7 close choice taken at their defaults; logged in `production/session-logs/decision-log.md`.
