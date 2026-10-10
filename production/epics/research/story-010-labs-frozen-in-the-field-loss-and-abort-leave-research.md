# Story 010: Labs frozen in the field; loss and abort leave Research alone

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`, `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Refunding on abort or loss.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Advanced Propellants active, WHEN tactical time advances 120 s, THEN startedT / endT are unchanged and it is not researched.
- [ ] GIVEN Advanced Propellants active at deploy, WHEN a loss debriefs, THEN strategic t is unchanged, the project stays active, and `addCredits` is not called.
- [ ] GIVEN Advanced Propellants researched and Neural Interface I active, WHEN Abort is confirmed, THEN `done` still has Advanced Propellants only, Neural Interface I stays active, there is no research refund, and Abort does not call `addCredits`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The World Network does not tick in the field; Research does not tick either. Abort writes nothing.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: normal completion.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. `src/state/missionStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008
- Unlocks: None
