# Story 008: sync(t) completes projects; completion pays nothing

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Any completion payout.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN a running lab with endT = 7200, WHEN sync(t = 7199) runs, THEN the project stays active.
- [ ] GIVEN endT = 7200, WHEN sync(t = 7200) runs, THEN it is researched and that lab is idle; completion does not call `addCredits` and Credits are unchanged.
- [ ] GIVEN Advanced Propellants started at T0 (endT = T0 + 7200), WHEN strategic t advances by at least 7200 and Research sync runs at that t, THEN it is researched. (A quiet-replay win may cause that advance.)

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Laboratories catch up on World Network `t` after a Screen tick or a win ETA jump via `sync(t)`; a loss spends none. No acceptance test is arranged through a win ETA jump.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: `endT`.
- Story 010: field freeze.

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

- Depends on: Story 007
- Unlocks: Story 009, Story 010, Story 011
