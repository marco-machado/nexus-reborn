# Story 018: Weapon sampling from applied ids

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Pasting weapon-table values into tests.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN appliedNodeIds = [Advanced Propellants, Tungsten Sabot], WHEN squadWeapon(assault) is sampled, THEN damage = assault weapon-table base × 1.12 × 1.15. Read the base from the weapon-table owner at sample time; do not paste it.
- [x] GIVEN Caseless Ammo Feed is the only applied magazine effect, WHEN squadWeapon(smg) is sampled, THEN magazine = round(smg weapon-table magazine + 10). Do not paste the table base or the sum.
- [x] GIVEN appliedNodeIds empty, WHEN weapons are sampled, THEN each weapon field equals that weapon's table base, read from the weapon-table owner.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Read table bases from the owner module in the test; assert the multiplier relationship, not pasted constants.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 019: crewBonus.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/game/research.test.ts`.
- [Advanced Propellants, Tungsten Sabot] → assault damage = table base × 1.12 × 1.15
- Caseless Ammo Feed only → smg magazine = round(table magazine + 10)
- Empty applied → every field equals table base
- Edge: Read bases from the weapon table at test time; no pasted numbers
- Edge: Magazine rounds half-up

**Gap**: Probably test-only; check the exact AC values.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/research.test.ts` (describe "weapon sampling from applied ids (RS-018)", 3 tests); 1034/1034 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 014
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by unit tests in `src/game/research.test.ts`, describe "weapon sampling from applied ids (RS-018)")
**Deviations**: None blocking. Advisory items below.
**Test Evidence**: Logic: test file at `src/game/research.test.ts` (present; full suite 1034/1034 per the Test Evidence line and /code-review)
**Code Review**: Complete. /code-review ran on `src/game/research.test.ts`: "Verdict: NOT ASSESSED" for the specialist pass (lead-programmer, qa-tester could not run: no Agent tool in that subagent); own review found no blocking defects.
**QA gate**: QL-TEST-COVERAGE skipped (lean mode).
**Run result**: N/A, test-only Logic story; `squadWeapon` in `src/game/research.ts` unchanged, nothing new on screen.

Advisory findings from /code-review:
- Estimate drift: story said 0.5 d, `production/sprint-status.yaml` and `production/sprints/sprint-005.md` say 0.1. Aligned the story to 0.1 d (same direction as the RS-017 fix in 0bb7c15).
- QA edge case not covered: "Edge: Magazine rounds half-up" is never reached; Caseless adds integer 10 to an integer base, and no shipped node produces a fractional magazine. Testing it needs a fixture node or a "not reachable with shipped data" note. Not an acceptance criterion.
- Manifest rule "Forbidden: Pasting weapon-table values into tests" is broken by the pre-existing `describe('squadWeapon')` block in `src/game/research.test.ts` (literal values such as 11 * 1.12, 0.03 * 0.9, toBe(50), toBe(30), WEAPONS.assault.damage toBe(11)). Predates RS-018; outside this diff. The RS-018 tests read from WEAPONS.
- Test overlap: RS-018 cases repeat the existing "stacks every completed project" and "returns the base weapon for an empty done set" tests; consider merging when the pasted-value tests are fixed.
- Shared-reference return (existing code): `src/game/research.ts:477` returns `WEAPONS[id]` itself (`return out ?? base`) when no effect applies, so a mutating caller would corrupt the table. The RS-018 empty-ids test cannot catch this; an `expect(w).not.toBe(WEAPONS[id])` check or a frozen table would.

Decisions taken unattended (default options): lean-mode code-review question answered "Yes, /code-review ran" with the result above; Phase 7 "Close the story (Recommended)"; no tech-debt register entries written.
