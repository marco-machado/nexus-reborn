# Story 005: Mass tier heavy band and the 400 kg limit

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
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** `squad_mass = 380` kg, **WHEN** mass tier is sampled, **THEN** delta is 0 m/s (not heavy) and Deploy is allowed (other gates passing). *(GDD AC 55)*
- [ ] **GIVEN** `squad_mass = 380.1` kg, **WHEN** mass tier is sampled, **THEN** delta is −0.15 m/s and Deploy is allowed (other gates passing). *(GDD AC 56)*
- [ ] **GIVEN** `squad_mass = 400` kg, a selected contract, and 1–4 distinct assigned operatives who are all Ready, **WHEN** Deploy is requested, **THEN** Deploy is allowed and `mass_tier_delta = −0.15` m/s. *(GDD AC 51)*
- [ ] **GIVEN** `squad_mass = 400.1` kg, **WHEN** Deploy is requested, **THEN** Deploy is refused and the button names the overage (0.1 kg). *(GDD AC 52)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Heavy tier (> 380) is not the gate; the 400 kg hard refuse is.
- The refusal names the overage in kg (400.1 → 0.1 kg). Copy/placement is Interface; the gate returns enough data (`massKg − MASS_LIMIT_KG`) to name it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: lighter bands.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/mass.test.ts`, `src/game/deployGate.test.ts`
**What to test**:
- 380 → 0, not heavy, Deploy allowed (AC 1)
- 380.1 → −0.15, Deploy allowed (AC 2)
- 400 with contract and 1–4 distinct Ready → Deploy allowed, delta −0.15 (AC 3)
- 400.1 → refused, `overKg` = 0.1 (rounded to 1 dp) and the label names it (AC 4)

**Edge cases to cover**: one body over 400 kg alone still refused (GDD "always deploying 1 Ready"); refusal reason is over-mass, not empty bays.
**Estimated test count**: ~5 unit tests (+1 label test if the string is extracted)

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/mass.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, Story 004
- Unlocks: None
