# Story 008: Assembly assign and unassign edits

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

- [ ] **GIVEN** a squad with at least one assigned operative, **WHEN** a dossier is focused without an assign/unassign action, **THEN** the assigned set is unchanged. *(GDD AC 5)*
- [ ] **GIVEN** exactly 1 assigned operative, **WHEN** unassign of that operative is requested, **THEN** the unassign is refused and that operative remains assigned. *(GDD AC 6)*
- [ ] **GIVEN** Assembly editing, **WHEN** assign would exceed 4, assign the same operative twice, assign Injured, or assign KIA, **THEN** that assign is refused. *(GDD AC 75)*
- [ ] **GIVEN** X is KIA, **WHEN** assign X is requested, **THEN** assignment is refused. *(GDD AC 17)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Inspection ≠ assignment: focusing a dossier never toggles the squad.
- `toggleOperative` will not empty the last assigned bay — an edit constraint, not a post-KIA invariant.
- Refuse assign beyond 4, a duplicate, Injured, or KIA (absent from roster).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009: no auto-assign on open; Injured dossier presentation.

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

- Depends on: Story 006
- Unlocks: Story 009
