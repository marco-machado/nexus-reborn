# Story 004: Prerequisite states: locked, available, active

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Forbidden: Marking a project locked because its lab is busy.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Advanced Propellants is not researched, WHEN states are read, THEN Hypervelocity Core is locked.
- [ ] GIVEN Advanced Propellants becomes researched (Hypervelocity Core's only prerequisite), WHEN that completion applies, THEN Hypervelocity Core is available and not active, and completion does not call `addCredits`.
- [ ] GIVEN Ballistics running Advanced Propellants and Barrel Wear Coating's prerequisites met, WHEN states are read, THEN Barrel Wear Coating stays available.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- State is derived from `done`, the active runs and the catalog prerequisites; lab occupancy does not make a project locked.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: refusal text.

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

- Depends on: None
- Unlocks: Story 005
