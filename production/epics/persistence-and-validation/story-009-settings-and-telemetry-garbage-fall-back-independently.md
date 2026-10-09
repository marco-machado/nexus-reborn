# Story 009: Settings and telemetry garbage fall back independently

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: settings or telemetry inheriting the campaign drop-all policy.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a valid campaign blob and invalid settings data, WHEN the origin reloads, THEN Continue is present.
- [ ] GIVEN a valid campaign blob and invalid telemetry data, WHEN the origin reloads, THEN Continue is present and Balance has no mission records.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Invalid settings fall back to defaults; wrong-version, unreadable, or non-array telemetry yields an empty log. Neither affects Continue.

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
- Logic: test file beside the module — `src/state/save.test.ts`, `src/state/telemetry.test.ts`, `src/state/settingsStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008
- Unlocks: None
