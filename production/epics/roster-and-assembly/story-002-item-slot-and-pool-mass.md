# Story 002: Item-slot and pool mass terms

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** base and role-granted mission pools, **WHEN** `operative_mass` is computed, **THEN** those pools add 0 kg. *(GDD AC 46)*
- [ ] **GIVEN** explicit Item slots with m med kits and c power cells and `m + c ≤ 2`, **WHEN** `operative_mass` is computed, **THEN** slot mass = `8m + 6c` kg. *(GDD AC 47)*
- [ ] **GIVEN** `m + c = 2`, **WHEN** slots are filled, **THEN** both slots stay occupied and neither fill is refused. *(GDD AC 48)*
- [ ] **GIVEN** an unassigned operative, **WHEN** squad mass terms are computed, **THEN** that body adds 0 kg and 0 mission Item-slot pools. *(GDD AC 65)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Base and role-granted pools add no Deployment mass; only explicit Item slots do (ADR-0019).
- Two Item slots per operative; filling the second slot is never refused.
- An unassigned body contributes neither mass nor mission pools.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 020: item pools frozen at create.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003, Story 020
