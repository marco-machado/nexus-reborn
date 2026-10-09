# Story 011: done appends in ascending endT

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Appending in authorize order.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN empty done, Targeting AI Suite authorized at t = 0 (endT = 7200) and Advanced Propellants authorized at t = 3600 (endT = 10800), WHEN sync(t = 10800) runs directly, THEN both are researched and done appends Targeting AI Suite before Advanced Propellants. A BRANCH_IDS append fails.
- [ ] GIVEN empty done, Sensor Fusion Array authorized at t = 0 (endT = 7200) and Neural Interface I at t = 3600 (endT = 10800), WHEN sync(10800) runs, THEN done appends Sensor Fusion Array before Neural Interface I and currentIssue(Neural) is Neural Interface I (later by time).
- [ ] GIVEN empty done and t = 0, Targeting AI Suite (control), then Neural Interface I (cybernetics), then Advanced Propellants (ballistics), each authorized at t = 0 (endT = 7200), WHEN sync(7200) runs, THEN done = [Advanced Propellants, Neural Interface I, Targeting AI Suite]. An authorize-order append fails.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Append in ascending `endT`; equal `endT` only → `BRANCH_IDS` house order (ballistics, cybernetics, control). Do not reverse the sort.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: injected equal-endT same-bay cases.

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

- Depends on: Story 008
- Unlocks: Story 012, Story 013
