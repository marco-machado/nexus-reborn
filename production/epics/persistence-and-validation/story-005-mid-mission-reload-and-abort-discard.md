# Story 005: Mid-mission reload and Abort discard

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: mid-mission persistence / resume.
- Forbidden: a campaign write on Abort.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a Screen snapshot S that held selected contract C and squad assignment, then a mission in progress, WHEN the origin is reloaded before Debrief, THEN Continue returns strategic / roster state from S including C (Brief can be entered for C without re-selecting it); Continue opens the World Network; the mission is not resumed; there is no Debrief outcome.
- [ ] GIVEN snapshot S, telemetry off, a mission in progress, WHEN the director Aborts from pause and later reloads + Continue, THEN Credits, Influence, Intel, roster, sectors, labs, `contractsWon`, and campaign banners equal S; no Debrief ran; the aborted mission is not restored.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- The mission and its Debrief outcome are memory only; reload before Debrief returns the last Screen snapshot S including selected contract C.
- Abort is a discard, not a reload: no Debrief runs and no campaign write occurs. Abort in-session landing is GDD Open Question 8 — do not pick Menu vs last Screen here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: abort telemetry row.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`, `src/state/missionStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004
- Unlocks: None
