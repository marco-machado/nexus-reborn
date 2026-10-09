# Story 007: Next Screen autosave durably commits the Debrief result

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0001: Two clocks, never both; ADR-0018: Catch-up collision order
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Required: four Screens autosave; Mission and Debrief do not.
- Forbidden: serializing the ADR-0009 freeze, `deploySerial`, or `lastAppliedKey` into the campaign blob.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN snapshot S, Debrief has applied payout, sector, Intel, Influence, and roster in this session, and the director has returned to the World Network, WHEN reload then Continue, THEN those named campaign fields equal the post-apply values exactly once (not S, not doubled) and selected contract is none.
- [ ] GIVEN snapshot S that held selected contract C, then Debrief applied in this session, WHEN the director Replays to Brief, THEN selected contract is still C.
- [ ] GIVEN that Brief visit after apply, WHEN the origin is reloaded, THEN Continue restores the named post-apply campaign values (not S) exactly once and selected contract is still C.
- [ ] GIVEN snapshot S, a quiet-replay win applied in this session (roster + ETA catch-up; no contract payout, Intel, Influence, or direct Control / Unrest change), and the director has returned to the World Network or Replayed to Brief, WHEN reload then Continue, THEN strategic `t`, laboratories, injuries, Tax deposits, and roster equal the post-apply values (not S); Intel, Influence, and `contractsWon` equal S; Credits equal S plus Tax deposits from that catch-up (not a contract payout).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- The first durable write of the applied result is the World Network return or Brief Replay autosave. World Network return clears selected contract; Brief Replay keeps C.
- Quiet replay: roster + ETA catch-up only (no payout, Intel, Influence, `contractsWon`); Tax deposits from the catch-up persist via the same autosave.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 017: filing status.
- Story 018: write failure.

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

- Depends on: Story 006
- Unlocks: Story 017, Story 018
