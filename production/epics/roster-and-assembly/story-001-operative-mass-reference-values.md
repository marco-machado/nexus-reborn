# Story 001: Operative mass reference values

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

- [ ] **GIVEN** Mara with deployment max HP 124, primary 4.2 kg, sidearm 1.2 kg, no research/Experience/filled Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 73.9 kg. *(GDD AC 61)*
- [ ] **GIVEN** Ghost / Dart / Torq under the same no-research/Experience/slots conditions, **WHEN** each `operative_mass` is computed, **THEN** Ghost is 69.3 kg, Dart is 66.3 kg, Torq is 76.6 kg. *(GDD AC 62)*
- [ ] **GIVEN** `H ≤ 90` and pistol + pistol (1.2 + 1.2 kg) with empty Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 62.4 kg (plating term 0). *(GDD AC 63)*
- [ ] **GIVEN** Mara as in AC 61 with 1 med-kit slot and 1 power-cell slot, **WHEN** `operative_mass` is computed, **THEN** it is 87.9 kg. *(GDD AC 64)*

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 003, Story 015
