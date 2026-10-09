# Story 011: Valid flag combinations load as stored

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
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: drop-all for empty + incomplete + `!failed`.
- Forbidden: failing a completed campaign on a later roster wipe.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a campaign blob with `campaignFailed` true and 0–2 authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present.
- [ ] GIVEN a campaign blob with `campaignFailed` true, `campaignWon` false, and all three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present.
- [ ] GIVEN a campaign blob with `campaignFailed` false, `campaignWon` false, living roster empty, and fewer than three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present and campaign result is still not failed (hydrate does not re-derive failed from living count 0).
- [ ] GIVEN campaign complete, then roster emptied, WHEN reload + Continue, THEN still complete, not also failed; authored contracts remain selectable for replay.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Hydrate restores stored flags and never re-derives failed from a living count of 0. A complete campaign keeps authored contracts selectable for replay.

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
- Logic: test file beside the module — `src/state/save.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 010
- Unlocks: None
