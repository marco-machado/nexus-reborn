# Story 001: Operative mass reference values

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
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

- [x] **GIVEN** Mara with deployment max HP 124, primary 4.2 kg, sidearm 1.2 kg, no research/Experience/filled Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 73.9 kg. *(GDD AC 61)*
- [x] **GIVEN** Ghost / Dart / Torq under the same no-research/Experience/slots conditions, **WHEN** each `operative_mass` is computed, **THEN** Ghost is 69.3 kg, Dart is 66.3 kg, Torq is 76.6 kg. *(GDD AC 62)*
- [x] **GIVEN** `H ≤ 90` and pistol + pistol (1.2 + 1.2 kg) with empty Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 62.4 kg (plating term 0). *(GDD AC 63)*
- [x] **GIVEN** Mara as in AC 61 with 1 med-kit slot and 1 power-cell slot, **WHEN** `operative_mass` is computed, **THEN** it is 87.9 kg. *(GDD AC 64)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `operativeMassKg` lives in `src/game/mass.ts` (ADR-0019 mass authority); kilogram functions stay there, never in `world.ts` or `src/scene`.
- Plating term is zero at `H ≤ 90`; the reference values in the ACs are oracles — do not restate the §6 magnitudes in code comments as a second source.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: pool and Item-slot mass terms.
- Story 003: squad sum and `mass_gate_ok`.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/mass.test.ts`
**What to test** (`operative_mass = 60 + Wprimary + Wsidearm + 0.25 × max(0, H − 90) + 8m + 6c`):
- Mara (H 124, 4.2 + 1.2 kg, no research/Experience/slots) → 73.9 kg (AC 1)
- Ghost 69.3, Dart 66.3, Torq 76.6 under the same conditions (AC 2)
- H ≤ 90, pistol + pistol, empty slots → 62.4 kg, plating 0 (AC 3)
- Mara + 1 med kit + 1 power cell → 87.9 kg (AC 4)

**Edge cases to cover**: H exactly 90 (plating 0, never negative); H 91 (+0.25); values read from the authored roster, not restated literals where the data is the source.
**Estimated test count**: ~5 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/mass.test.ts` (`operativeMassKg reference values (TR-roster-001)` block); `npx vitest run src/game/mass.test.ts` passed 18/18 on 2026-10-15

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 003, Story 015

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (AC 61, 62, 63, 64), plus the H 90 / H 91 edge cases; none deferred
**Deviations**:
- ADVISORY (traceability): the story names `TR-roster-001`, but `docs/architecture/tr-registry.yaml:350-353` defines TR-roster-001 as "Deploy gate requires 1–4 Ready operatives; empty bays are legal; squad mass must be ≤ 400 kg", not operative-mass reference values. No TR entry for operative mass exists. Owner to confirm the right TR ID or add one; the `(TR-roster-001)` label in the test describe block follows whatever is decided.
- ADVISORY (scope): AC 64 (item-slot mass) overlaps Story 002's item-slot terms; already implemented in `src/game/mass.ts`, so it is only tested here.
- ADR-0019 Decision: COMPLIANT. `src/game/mass.ts` owns operativeMassKg/squadMassKg/massTier/MASS_LIMIT_KG; nothing added to `world.ts` or `src/scene`; no CLAUDE.md guardrail breached. `src/game/mass.ts` unchanged by this story.
**Test Evidence**: Logic: test file at `src/game/mass.test.ts` (present; 18/18 passed in this workflow's run)
**Run result**: N/A — pure `src/game` logic with no player-visible surface changed; the Assembly mass readout is unchanged (from /dev-story checkpoint)
**Code Review**: Complete — /code-review ran in this workflow on `src/game/mass.ts` and `src/game/mass.test.ts` and returned "Verdict: NOT ASSESSED": the engine-specialist and qa-tester reviews could not be spawned (no Agent tool in the unattended subagent; no `web-specialist` definition in `.claude/agents/`). The reviewer's own pass found no code defects. QL-TEST-COVERAGE skipped — Lean mode.
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, gameplay-programmer APPROVED, qa-tester TESTABLE. Fixes: no fix needed. Suggestions recorded: doc comments on mass.ts exports; exact float sum at 340 kg could be built from integer tenths. This supersedes the NOT ASSESSED result above.
**Code review advisory findings**:
- Review coverage, not a code defect: Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; re-run /code-review where agents can be spawned.
- Traceability: TR-roster-001 mismatch (see Deviations).
- Duplicate tests in `src/game/mass.test.ts`: the reference-values block repeats 73.9 kg for Mara (existing 'sums base, both weapon slots...' test) and 87.9 kg with med + cell (existing 'adds the authored item masses' test); the older H<90 'featherweight' test overlaps the AC 63 clamp check. Harmless; older duplicates could be folded together.
- The AC 61 test asserts data literals (maxHp 124, primary 4.2 kg, sidearm 1.2 kg) as drift guards, which also pins `src/game/data.ts` (CONTRACT FILE): a rebalance of those weapons breaks this test as well as the oracle.
**Autonomous decisions**: Phase 5 lean prompt answered "Yes — /code-review ran" (with the result above); Phase 7 took the recommended "Close the story" option; no tech-debt rows logged.

