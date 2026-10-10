# Story 002: New Operation: two-step erase of the house

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: one storage key for campaign + settings + telemetry.
- Forbidden: clearing `TELEMETRY_KEY` or the telemetry toggle on New Operation.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN Menu with Continue and recorded Credits / Intel / roster, WHEN the director activates New Operation once, THEN the control arms a confirm, the campaign blob is unchanged, and Continue still loads the same Credits / Intel / roster.
- [ ] GIVEN New Operation armed and a parallel clean-origin New Operation fixture F, WHEN the director confirms, THEN Credits, Intel, `contractsWon`, laboratories, and tutorial-seen equal F (Economy / World Network / Research / Roster opening desk — do not copy integers here), and the prior campaign cannot be restored.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- First activation only arms a confirm; the campaign blob is untouched until confirm.
- Confirm resets every campaign store to the opening desk and erases the campaign envelope only; compare against a clean-origin New Operation fixture F rather than literal integers. `initializeSaveSystem` stays idempotent.
- `deploySerial` and `lastAppliedKey` reset with New Operation (ADR-0021).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: settings survival.
- Story 018: write failure during the erase.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003, Story 014, Story 018
