# Story 013: Telemetry opt-in default and no network egress

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
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `fetch`, `sendBeacon`, WebSocket, cookies, or an analytics SDK in `telemetry.ts` or Balance export.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a new origin (no settings blob) and a finished mission with telemetry never enabled, WHEN Settings is opened, THEN telemetry is off, the log is empty, and no Balance entry point is present on Settings or Debrief.
- [ ] GIVEN telemetry on with at least one record, WHEN the toggle is turned off, THEN the records remain, a Balance entry point is present, and Export and Clear work. WHEN Clear is confirmed, THEN the Balance entry point is gone.
- [ ] GIVEN telemetry on or off, WHEN Debrief apply, Abort, Balance view, Export, or Clear runs, THEN no telemetry network request is emitted. UI click / SFX fetches are out of scope.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Settings boolean `telemetry` defaults false; off makes `recordMissionOutcome` / `recordAbort` no-ops but keeps existing records. The Balance entry point shows only while records exist.
- UI click / SFX fetches are out of scope for the egress check.

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

- Depends on: None
- Unlocks: Story 014, Story 015, Story 016
