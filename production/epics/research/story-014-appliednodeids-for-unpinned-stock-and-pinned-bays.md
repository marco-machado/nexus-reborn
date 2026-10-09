# Story 014: appliedNodeIds for unpinned, stock and pinned bays

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`, `TR-research-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Putting resolved worn ids on the Research slice.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Neural Interface I then Neural Accelerator Mk II researched and Neural unpinned, WHEN appliedNodeIds is computed, THEN the Neural id is Mk II only.
- [ ] GIVEN done = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II] and Neural unpinned, THEN [Advanced Propellants, Neural Accelerator Mk II].
- [ ] GIVEN the same done and Neural STOCK, THEN [Advanced Propellants] only.
- [ ] GIVEN the same done and Neural pinned to Neural Interface I, THEN [Advanced Propellants, Neural Interface I].

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The composer runs `appliedNodeIds(done, pins)` at freeze; resolved wear has one owner — the Roster slice. Pins are roster content, not a research field.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: pin edge cases.
- Story 016: deploy freeze.

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

- Depends on: Story 013
- Unlocks: Story 015, Story 016
