# Story 008: Invalid or unreadable campaign blob is dropped all-or-nothing

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: half-loading a campaign blob.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN the campaign blob is replaced with non-JSON text via test inject (not a named storage key), WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started. Copy stays Interface.
- [ ] GIVEN the campaign blob is JSON that fails campaign schema, WHEN the origin reloads to Menu, THEN Continue is absent, Screens are not entered, and Menu state is invalid/unreadable, distinct from never-started.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Non-JSON or schema-failing blobs yield no campaign: Continue absent, Screens not entered, and the Menu reports invalid/unreadable — distinct from never-started.
- Inject the bad blob via a test harness, not a named storage key. Hydrate drop-alls on non-finite or negative Credits (ADR-0013) rather than clamping.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: flag-combination validation.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 009, Story 010
