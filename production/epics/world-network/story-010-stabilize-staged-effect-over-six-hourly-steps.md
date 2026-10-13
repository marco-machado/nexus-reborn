# Story 010: Stabilize staged effect over six hourly steps

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-13

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income  
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Bulk-applying all six steps at the activation instant.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN an open sector with Unrest 18, Influence 8, Stabilize off cooldown, and no other Unrest-changing effects, WHEN Stabilize is activated and 6 strategic hours elapse, THEN Influence is 0 immediately, Unrest falls by 2 at each hourly step to 6, and the staged spend retires.
- [x] GIVEN Unrest 12 under the same conditions, WHEN all six hourly steps complete, THEN Influence is 0 immediately and Unrest ends at 2, not 0, because each step respects the GDD §5 clamp.
- [x] GIVEN Unrest 2 under the same conditions, WHEN all six hourly steps complete, THEN Influence is 0, Unrest stays 2, and the staged spend retires. (Interleaved World Events follow ordinary catch-up rules; no guaranteed net reduction.)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Staged spends fire through `advanceFlow` in the collision order (expiry → World Event → contract generation → staged spend → pressure → Tax yield), rearming from the due timestamp.
- Clamp and per-step amounts are GDD §5 / code values; assert them in tests, don't re-derive.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009: refusals.
- Lobby is not covered by these acceptance criteria.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). Logic. File: `src/state/worldStore.test.ts`.

- Unrest 18, Influence 8, off cooldown, no other Unrest-changing effects: Influence is 0 immediately and Unrest is still 18. Then Unrest falls by 2 at each hourly step to 6, and the staged spend retires. Not a single −12 at activation.
- Unrest 12 under the same conditions ends at 2, not 0.
- Unrest 2 under the same conditions stays 2, Influence is 0, and the staged spend retires.
- Six hours via `tick` and via `advanceDays` reach the same Unrest. Both go through `advanceFlow`. Do not add a second collision table.
- Do not assert a net when a World Event is also scheduled. Do not retune the 2–96 clamp.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts` — advance six hours via `tick` and via `advanceDays`; both reach the same Unrest. — must exist and pass.

**Status**: [x] Created and passing — `src/state/worldStore.test.ts` (5 tests)

---

## Dependencies

- Depends on: Story 002, Story 009
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-13
**Criteria**: 3/3 passing, all covered by `describe('stabilize staged effect over six hourly steps')` in `src/state/worldStore.test.ts`.
**Deviations**: None. Stabilize in `worldStore.ts` already matched the criteria; this story added tests only. Parity test compares full `flowSnapshot()` for 720 frames of `tick` vs `advanceDays(0.25)`.
**Test Evidence**: Logic: test file at `src/state/worldStore.test.ts` (5 tests; suite 114/114 passed locally, exit 0). Run result: N/A — test-only Logic story.
**Code Review**: Complete — APPROVED WITH SUGGESTIONS (parity-test fix applied). Open suggestions: assert spend `nextT`/`remaining` countdown, a mid-run clamp case (Unrest 3).
