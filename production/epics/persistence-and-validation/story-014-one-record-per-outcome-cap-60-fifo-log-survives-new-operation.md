# Story 014: One record per outcome; cap 60 FIFO; log survives New Operation

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0015: Telemetry never leaves the machine  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `removeItem(TELEMETRY_KEY)` on New Operation.
- Forbidden: persist middleware on `TELEMETRY_KEY`.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN telemetry on, N records, a mission that reaches Debrief, WHEN the invoice applies, THEN Balance count is N+1 (not N+2), and the new row’s outcome is won or lost (not aborted).
- [ ] GIVEN telemetry on and 60 records with a recorded oldest row identity (outcome, mission id, duration), WHEN another Debrief or Abort is logged, THEN Balance still shows 60 records (does not become 61) and that recorded oldest row is gone.
- [ ] GIVEN telemetry on, snapshot S, records present, WHEN New Operation is confirmed, THEN the campaign equals a new Operation and the telemetry toggle and log still match the pre-erase values.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `appendRecord` is FIFO at `TELEMETRY_CAP = 60`. The Debrief record is written once, inside `applyDebrief`.

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
