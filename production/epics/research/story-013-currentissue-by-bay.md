# Story 013: currentIssue by bay

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`, `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Returning a Ballistics project as a bay issue.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Advanced Propellants researched, WHEN currentIssue is read for any bay, THEN Advanced Propellants is not returned (Ballistics is unslotted).
- [ ] GIVEN done = [Neural Interface I, Neural Accelerator Mk II], THEN currentIssue(Neural) is Neural Accelerator Mk II; GIVEN done = [Neural Accelerator Mk II, Neural Interface I], THEN Neural Interface I.
- [ ] GIVEN empty done, WHEN currentIssue is read for each bay, THEN each is none.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Bays are Neural, Chest, Arms, Legs; current issue is the latest completed project in that bay by `done` order.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 014: wear resolution.

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

- Depends on: Story 011
- Unlocks: Story 014
