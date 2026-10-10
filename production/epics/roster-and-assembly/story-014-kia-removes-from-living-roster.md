# Story 014: KIA removes the operative from the living roster

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Forbidden: more than one worn project per bay.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** operative X living and assigned, **WHEN** debrief applies X in `deadIds`, **THEN** X is absent from the living roster (no Dead state), X’s Squad bay is empty, X is listed under KIA, and kia names include X. *(GDD AC 15)*
- [ ] **GIVEN** X is KIA, **WHEN** the Research program is read, **THEN** completed projects stay researched. *(GDD AC 16)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- No Dead roster state: KIA are filtered out of `operatives`, bay cleared, listed under KIA.
- Research program is untouched by a death — see research epic Story 015 (death keeps the program); reference, do not duplicate.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic Stories 014–016 (appliedNodeIds/pins from the Research side).
- Story 024: empty roster campaign fail.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013
- Unlocks: Story 024
