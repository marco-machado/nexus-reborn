# Story 012: injuryRecoverySec helper values

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** living `f = 0.175`, **WHEN** `injuryRecoverySec` is computed, **THEN** `D = 108000` s. *(GDD AC 57)*
- [ ] **GIVEN** the helper is evaluated at `f = 0`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 172800 s; the injury rule still does not invoke it because `f = 0` is KIA. *(GDD AC 58)*
- [ ] **GIVEN** the helper is evaluated at `f = 0.35`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 43200 s; the injury rule does not invoke it and applies no new injury. *(GDD AC 59)*

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 013
