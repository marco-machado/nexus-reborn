# Story 015: Abort telemetry row and Balance win rate

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0015: Telemetry never leaves the machine  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: aborts in the win-rate denominator.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN telemetry on, snapshot S, WHEN Abort from pause, THEN campaign still equals S; abort count increases by 1; that row is `aborted` plus duration, mission id, seed, deployed roles — not a full combat invoice.
- [ ] GIVEN telemetry records: 2 won, 1 lost, 3 aborted, WHEN Balance is opened, THEN win rate is 2 / (2 + 1); abort count is 3; aborts are not in the win-rate denominator.
- [ ] GIVEN telemetry records: 0 won, 2 lost, WHEN Balance is opened, THEN win rate is 0.0.
- [ ] GIVEN telemetry records: 0 won, 0 lost, 3 aborted, WHEN Balance is opened, THEN abort count is 3 and the win-rate slot shows the no-data marker; no 0, NaN, or Infinity appears anywhere in Balance.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Abort row: `aborted` + duration, mission id, seed, deployed roles — no combat invoice; the campaign stays S.
- Win rate = won / (won + lost); when the denominator is 0 Balance shows a no-data marker (copy is Interface), never 0, NaN, or Infinity. `abort_rate` is GDD Open Question 4 — do not invent it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/telemetry.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013
- Unlocks: None
