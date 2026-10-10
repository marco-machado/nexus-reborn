# Story 003: Settings envelope survives New Operation and reload

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
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: settings fields inside the campaign blob.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN Settings recorded as Difficulty D, Quality Q, telemetry toggle T, audio A, remap R, WHEN New Operation is confirmed, THEN Settings still equal D, Q, T, A, R.
- [ ] GIVEN Settings recorded as Difficulty D, Quality Q, telemetry toggle T, audio A, remap R (no campaign required), WHEN the origin is fully reloaded, THEN Settings still equal D, Q, T, A, R with Continue not required to hydrate Settings.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Settings (Difficulty, Quality, telemetry toggle, audio, remaps) live in their own envelope, hydrated by `initSettings` before `initializeSaveSystem`; Continue is not required to hydrate them.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009: settings garbage fallback.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/settingsStore.test.ts`, `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 009
