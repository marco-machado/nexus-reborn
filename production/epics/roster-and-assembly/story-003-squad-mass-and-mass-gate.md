# Story 003: Squad mass sum and mass gate

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
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

- [ ] **GIVEN** assigned Mara, Ghost, Dart, Torq with no research/Experience/filled Item slots, **WHEN** `squad_mass` is computed, **THEN** it is 286.1 kg. *(GDD AC 66)*
- [ ] **GIVEN** those 4 assigned plus unassigned living roster members, **WHEN** `squad_mass` is computed, **THEN** unassigned add 0 kg (still 286.1 kg). *(GDD AC 67)*
- [ ] **GIVEN** `squad_mass = 286.1` kg, **WHEN** `mass_gate_ok` is computed, **THEN** it is true. *(GDD AC 68)*
- [ ] **GIVEN** `squad_mass ≤ 400` kg, **WHEN** `mass_gate_ok` is computed, **THEN** it is true; **GIVEN** `squad_mass > 400` kg, **THEN** it is false. *(GDD AC 69)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `squadMassKg(assigned, …)` sums assigned operatives only. `mass_gate_ok` is `massKg <= MASS_LIMIT_KG` (400): equal allowed, no epsilon.
- `createWorld` never reads `MASS_LIMIT_KG`; Tactical must not re-check or relax the gate.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004/005: mass tier bands.
- Story 006/007: full four-check `canDeploy`.

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

- Depends on: Story 001, Story 002
- Unlocks: Story 004, Story 005, Story 006
