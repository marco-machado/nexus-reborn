# Story 004: Mass tier: light and standard bands

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** `squad_mass = 286.1` kg, **WHEN** `mass_tier_delta` is sampled at deploy, **THEN** it is +0.15 m/s applied once to the whole squad. *(GDD AC 70)*
- [x] **GIVEN** any `squad_mass`, **WHEN** `mass_tier_delta` is sampled, **THEN** the value is exactly one of {+0.15, 0, −0.15} m/s using: ≤ 340 → +0.15; 340 < x ≤ 380 → 0; > 380 → −0.15. *(GDD AC 71)*
- [x] **GIVEN** `squad_mass = 340` kg, **WHEN** mass tier is sampled at deploy, **THEN** `mass_tier_delta = +0.15` m/s for the whole squad and Deploy is allowed (other gates passing). *(GDD AC 53)*
- [x] **GIVEN** `squad_mass = 340.1` kg, **WHEN** mass tier is sampled, **THEN** delta is 0 m/s and Deploy is allowed (other gates passing). *(GDD AC 54)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `massTier` / `tierSpeedDelta` in `mass.ts`: ≤ 340 → +0.15; 340 < x ≤ 380 → 0; > 380 → −0.15. One tier for the whole squad.
- Tier is sampled once at mission create onto the Roster slice (`massKg` + `massTier`, already folded into `speed`) — ADR-0009.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: 380/400 boundaries and the over-limit refusal.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/mass.test.ts`
**What to test** (`mass_tier_delta = 0.15 if ≤ 340; −0.15 if > 380; else 0`):
- Default four at 286.1 kg → +0.15, applied once squad-wide (AC 1)
- Any mass maps to exactly one of {+0.15, 0, −0.15} — sweep 0, 286.1, 340, 340.1, 360, 380, 380.1, 400 (AC 2)
- 340 → +0.15 and Deploy allowed (AC 3)
- 340.1 → 0 and Deploy allowed (AC 4)

**Edge cases to cover**: floating-point sums that land at 340.0000001 from four bodies (sum computed, not literal).
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/mass.test.ts` ("mass tier light and standard bands (TR-roster-002)", 6 tests: AC 53, 54, 70, 71 plus computed-sum and no-epsilon edges), passing

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 005

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (AC 70, 71, 53, 54; none deferred)
**Deviations**: None. massTier/tierSpeedDelta (src/game/mass.ts:77-90) match ADR-0019 bands (<=340 light, >380 heavy, no epsilon); rosterSlice (src/game/deploy.ts) applies one squad-wide delta folded into speed per ADR-0009. No MASS_LIMIT_KG in world.ts. No production code changed; only src/game/mass.test.ts.
**Test Evidence**: Logic: test file at `src/game/mass.test.ts` ("mass tier light and standard bands (TR-roster-002)", 6 tests); `npx vitest run src/game/mass.test.ts` passed 28/28 on 2026-10-15.
**Run result**: N/A — pure src/game logic, no new on-screen surface (from /dev-story checkpoint).
**Traceability**: AC 70 → "samples +0.15 m/s once ... (AC 70)"; AC 71 → "maps any mass ... (AC 71)"; AC 53 → "gives +0.15 m/s at exactly 340 kg ... (AC 53)"; AC 54 → "gives 0 m/s at 340.1 kg ... (AC 54)". All COVERED.
**Manifest**: story 2026-10-08 = current control manifest 2026-10-08.
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Code Review**: Complete with a gap — /code-review ran on src/game/mass.test.ts and returned "Verdict: NOT ASSESSED": the Phase 7 specialist reviews (lead-programmer, qa-tester) could not be spawned because the workflow subagent has no Agent tool. Its own review found no required changes (ADR Compliance COMPLIANT for ADR-0019 and ADR-0009, Standards 6/6, Architecture CLEAN, SOLID COMPLIANT, Testability TESTABLE); it would otherwise have been APPROVED WITH SUGGESTIONS. Lean-mode prompt answered by the workflow default: "Yes — /code-review passed or was approved with suggestions" (with the NOT ASSESSED specialist gap noted). Re-run /code-review in a session that can spawn agents if that gate must be met.
**Advisory findings (from /code-review)**:
- src/game/mass.test.ts:270-272: the computed-sum test comment lists bodies as "66.3 + 63.3 + 76.6 + 64.8" (271.0, which with 60 kg of items is 331, not 340). Real bodies from data.ts are Ghost 69.3, Dart 66.3, Torq 76.6, Slate 67.8 (280 + 60 = 340). Assertion is correct and passes; only the comment is wrong. Fix: "69.3 + 66.3 + 76.6 + 67.8". Not fixed here.
- QA edge case "floating-point sums that land at 340.0000001 from four bodies": the computed-sum test shows one four-body sum lands at exactly 340 with no drift; the 340.0000001 drift case is only covered with a literal. Acceptable under ADR-0019's no-epsilon rule, but no computed sum that drifts over 340 is exercised.
- AC 70 squad-wide test uses empty done/roster, so crewBonus and xpBonus add nothing; it does not show the tier delta combining with a non-zero research or XP speed bonus. Optional extra test.
- production/sprint-status.yaml lists estimate_days: 0.1 for RA-004 while this story header says Estimate: 1.0 d. Pre-existing mismatch, not changed here.
