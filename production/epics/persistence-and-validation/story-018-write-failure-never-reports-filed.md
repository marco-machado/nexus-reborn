# Story 018: Write failure never reports filed

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0022: Durable-commit (filing) status  
**Secondary ADRs**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: A session-only status store, written only by save.ts, reports filed / unfiled / write-failed.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `getItem` read-back after `setItem`; classifying with `instanceof DOMException`.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN recorded campaign C0 and the next campaign-blob write is injected to throw (harness; not a named storage key), WHEN New Operation is confirmed, THEN the session does not throw; in-session desk matches new-Operation fixture F; the Interface write-failure indicator is present and the erase is not reported as filed; WHEN the origin reloads to Menu, THEN Continue loads C0.
- [ ] GIVEN snapshot S, Debrief applied in this session, and the next Screen campaign-blob write is injected to throw (harness; not a named storage key), WHEN the director returns to the World Network or Replays to Brief, THEN the session does not throw and filing-status does not read filed; WHEN reload then Continue, THEN named campaign fields equal S.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Storage throws swallow at the writer, which marks `write-failed` with a `quota` / `unavailable` / `unknown` reason; `write-failed` is sticky against `markUnfiled`.
- `startNewOperation` sets `filed` or `write-failed` after the in-memory reset. Inject the throw via harness, not a named storage key.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

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

- Depends on: Story 002, Story 007, Story 017
- Unlocks: None
