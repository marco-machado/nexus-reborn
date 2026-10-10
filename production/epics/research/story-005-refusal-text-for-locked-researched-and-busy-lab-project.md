# Story 005: Refusal text for locked, researched and busy-lab projects

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw  
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A reason enum or exported reason type.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Hypervelocity Core locked and Ballistics idle, WHEN it is authorized, THEN eligibility returns before `start()` and before `spendCredits` even if balance ≥ cost, Ballistics stays idle, it stays locked, Credits are unchanged, and the refusal text contains the catalog title, the string Advanced Propellants, and a credits-unchanged phrase; the inspected detail names the locked state and the unmet prerequisite and does not imply a charge was attempted.
- [ ] GIVEN Ballistics running Advanced Propellants and Tungsten Sabot locked with Rail Stabilization and Smart Fragmentation both unmet, WHEN Tungsten Sabot is authorized, THEN eligibility returns before `start()` and `spendCredits`, Credits are unchanged, and the refusal text contains the catalog title and both prerequisite names at text indices before the lab-not-idle phrase, and a credits-unchanged phrase.
- [ ] GIVEN Advanced Propellants researched and Ballistics idle, WHEN it is authorized, THEN eligibility returns before `start()` and `spendCredits`, it stays researched, Credits are unchanged, and the refusal text contains an already-researched phrase and a credits-unchanged phrase; the inspected detail says it is already researched.
- [ ] GIVEN Ballistics running Advanced Propellants and Barrel Wear Coating available, WHEN Barrel Wear Coating is authorized, THEN eligibility returns before `start()` and `spendCredits`, Barrel Wear Coating stays available, Credits are unchanged, and the refusal text contains a lab-not-idle phrase and a credits-unchanged phrase.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Eligibility is checked before `start()` and before `spendCredits`; Research emits no spend on a refusal.
- 'No reason enum' is a static source check (no exported reason enum or type), not a runtime assertion.
- The refusal sentence is composed per GDD UI Requirements; Interface owns paint, not the content rule.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: remaining eligibility cases.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, Story 004
- Unlocks: None
