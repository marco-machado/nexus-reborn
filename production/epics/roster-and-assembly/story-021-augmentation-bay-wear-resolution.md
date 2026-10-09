# Story 021: Augmentation bay wear resolution

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: more than one worn project per bay.
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** any operative, **WHEN** augmentation bays are listed, **THEN** there are 4 bays and each bay wears at most 1 completed slotted project that belongs to that bay. *(GDD AC 35)*
- [ ] **GIVEN** unpinned bays (including a new hire), **WHEN** wear is resolved, **THEN** each unpinned bay wears current issue. *(GDD AC 36)*
- [ ] **GIVEN** a bay pinned to stock issue or an older completed project, **WHEN** a new same-bay project completes, **THEN** the pinned bay is unchanged and unpinned bays wear current issue. *(GDD AC 37)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Four bays, at most one completed slotted project each, belonging to that bay. Unpinned wears current issue; a pinned bay keeps its pin when a new same-bay project completes.
- Resolution reuses `appliedNodeIds(done, pins)`; covered from the Research side by research epic Stories 013–015 — this story asserts the Roster-side view, do not duplicate the function.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic Stories 014–015: `appliedNodeIds` and pin edges.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
