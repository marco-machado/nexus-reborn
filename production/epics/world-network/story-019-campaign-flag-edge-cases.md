# Story 019: Campaign flag edge cases

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0020: Campaign fail flags  
**Secondary ADRs**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: Empty incomplete living roster sets campaignFailed; a completed campaign stays complete; the two flags cannot both be true.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Failing a completed campaign on a later roster wipe.
- Forbidden: Re-deriving the fail flag on hydrate.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN campaign already complete, WHEN living roster count reaches 0, THEN the complete banner remains, the fail banner is not posted, and contracts are not locked.
- [ ] GIVEN an incomplete, non-failed campaign with at least one living operative, WHEN only sector crisis enters or clears, THEN campaign flags remain unchanged and no campaign-failed banner appears. Injured operatives still count as living.
- [ ] GIVEN a campaign still incomplete after debrief removes its last living operative, WHEN campaign flags are read, THEN failed is true and complete is false, regardless of sector crisis.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `isCampaignFailed(rosterSize, alreadyComplete)` is `rosterSize === 0 && !alreadyComplete`. Pass this debrief's `allWon`, not stored `campaignWon`; `campaignWon = allWon && !campaignFailed`.
- Hydrate restores stored flags; never re-derive fail from `operatives.length === 0`.
- `save.ts` drop-alls if `campaignFailed && campaignWon`; a non-failed blob's `campaignWon` must match the three-authored record. Do not add a drop-all for empty+incomplete+`!failed`.
- Generated wins do not mark the campaign complete.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 018: banners and selection lock.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 018
- Unlocks: None
