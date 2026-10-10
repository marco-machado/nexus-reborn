# Story 006: Debrief applies once in session memory

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: a durable campaign write at Debrief.
- Forbidden: per-owner last-applied keys or a UI-side apply guard.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN snapshot S on a Screen, then a finished mission whose Debrief has applied in this session, WHEN the origin is reloaded while still on Debrief, THEN Continue restores S, not the invoice mutations.
- [ ] GIVEN a Debrief that has already applied payout, sector, Intel, Influence, and roster, WHEN Debrief stays open, THEN those campaign values do not change again, and telemetry (if on) still has exactly one record for that outcome.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `applyDebrief` is the only apply path, gated by `outcome.applyKey > lastAppliedKey` (ADR-0021); a still-open Debrief never re-applies.
- Reload while on Debrief restores S; the invoice mutations were never durable (accepted escape, living spec §19 #8). Telemetry records once inside `applyDebrief`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: the next-Screen durable commit.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/appStore.test.ts`, `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004
- Unlocks: Story 007, Story 014, Story 017
