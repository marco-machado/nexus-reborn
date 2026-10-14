# Story 019: Campaign flag edge cases

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-13

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
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN campaign already complete, WHEN living roster count reaches 0, THEN the complete banner remains, the fail banner is not posted, and contracts are not locked.
- [x] GIVEN an incomplete, non-failed campaign with at least one living operative, WHEN only sector crisis enters or clears, THEN campaign flags remain unchanged and no campaign-failed banner appears. Injured operatives still count as living.
- [x] GIVEN a campaign still incomplete after debrief removes its last living operative, WHEN campaign flags are read, THEN failed is true and complete is false, regardless of sector crisis.

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

From `/qa-plan` sprint 2 (2026-10-12). Logic. Files: `src/state/campaignStore.test.ts`, `src/state/save.test.ts`.

- Campaign already complete, living roster reaches 0: complete stays, failed is not set, contracts stay unlocked.
- Crisis enter, and crisis clear, on an incomplete non-failed campaign with at least one living operative: flags unchanged, no campaign-failed. One injured operative still counts as living.
- Debrief removes the last living operative on an incomplete campaign: failed is true and complete is false, including during sector crisis.
- `isCampaignFailed` takes this debrief's `allWon`, not stored `campaignWon`.
- Hydrate restores stored flags. An empty operative list on a stored non-failed blob does not become failed.
- Both flags true is drop-all. Empty + incomplete + `!failed` is not drop-all. Generated wins do not set complete.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` (WN-019 block, 8 tests), `src/state/save.test.ts` (4 tests), `src/ui/campaignBanner.test.ts` (3 tests); visual: `production/qa/evidence/wn-019/`

---

## Dependencies

- Depends on: Story 018
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-13
**Criteria**: 3/3 passing, none deferred
**Deviations**: ADVISORY (scope): `src/ui/WorldMap.tsx` and new `src/ui/campaignBanner.ts` (+ test) are outside the story's files and touch Story 018's banner area. Added at the user's request after `/code-review` found the banner decision could not be unit-tested; behaviour unchanged, verified in browser. Implementation itself was already in place from WN-018; this story is a parameter rename plus tests.
**Test Evidence**: Logic: test files present at `src/state/campaignStore.test.ts`, `src/state/save.test.ts`; full suite last run 42 files / 770 tests passing, `npm run build` and `npm run lint` clean. Visual: `production/qa/evidence/wn-019/wn-019-complete-then-wipe-1280x720.png`, `wn-019-incomplete-wipe-failed-1280x720.png`.
**Code Review**: Complete — `/code-review` with lead-programmer and qa-tester: no blocking findings; 2 required and 4 suggested changes applied afterwards. Not re-run on the fixes.
**Open question**: TR-world-network-009's registry text ("Outcome DTO is applied once at debrief") does not describe campaign fail flags; the story cites it anyway. Fix the citation or registry entry in `/architecture-review`.
