# Story 010: Contradictory campaign flags drop the blob

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
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: replacing the two booleans with a `CampaignStatus` enum.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a campaign blob with both complete and failed flags true, WHEN the origin reloads, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- [ ] GIVEN a campaign blob with `campaignFailed` false and `campaignWon` true but fewer than three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- [ ] GIVEN a campaign blob with `campaignFailed` false, `campaignWon` false, and all three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `save.ts` drop-alls if `campaignFailed && campaignWon`; a non-failed blob's `campaignWon` must match the three-authored `contractsWon` record.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: combinations that must still load.

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

- Depends on: Story 008
- Unlocks: Story 011
