# Story 006: Collateral clamps and input sanitising

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Letting a negative or non-finite input raise `net_payout`.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a non-quiet win, Reward 41,000 CR and 9 unique squad first-hits, THEN Collateral = 41,000 CR (capped at Reward).
- [x] GIVEN civiliansHit −1, THEN Collateral = 0 CR and `net_payout` is not increased by a negative fine.
- [x] GIVEN civiliansHit 2.7, THEN N = 2 and Collateral = 10,000 CR (Reward 85,000 CR).
- [x] GIVEN civiliansHit NaN and completed_bonus NaN, THEN Collateral = 0 CR, `optional_bonus = 0 CR`, and `net_payout = 85,000 CR`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `N = max(0, floor(civiliansHit))`, non-finite → 0; `collateral = min(reward, N × COLLATERAL_FINE)`. All priced fields are finite integers.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: ordinary collateral.
- Story 007: bonus summation.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- Reward 41,000 with 9 hits gives Collateral 41,000 (capped)
- civiliansHit −1 gives 0 and `netPayout` is not raised
- civiliansHit 2.7 floors to 2: Collateral 10,000 at Reward 85,000
- civiliansHit NaN and a NaN bonus def: Collateral 0, bonus 0, `netPayout` 85,000

**Edge cases**:
- Infinity and −Infinity
- Non-integer Reward
- All priced fields are finite integers

**Existing coverage**: Mostly present: 'floors the civilian count and treats a negative or non-finite count as none'. Missing: the NaN bonus def and the finite-integer check.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts`, describe "Collateral clamps and input sanitising (EC-006)" (8 tests)

---

## Dependencies

- Depends on: Story 005
- Unlocks: Story 007

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by `src/state/appStore.test.ts`, describe "Collateral clamps and input sanitising (EC-006)"; 8/8 tests run and passed via `npx vitest run src/state/appStore.test.ts -t "EC-006"` on 2026-10-14)
**Deviations**: None. Implementation in `src/state/appStore.ts` already met TR-economy-007 / ADR-0021; this story added tests only. Edge cases (±Infinity count, Infinity bonus def, non-integer and non-finite Reward, finite-integer fields) also covered.
**Test Evidence**: Logic: test file at `src/state/appStore.test.ts`
**Run result**: N/A — pure pricing logic; no player-visible surface changed (from the /dev-story checkpoint)
**Code Review**: Done 2026-10-14 — lead-programmer: APPROVED WITH SUGGESTIONS, no blocking findings (commits 6839a5b..a79bed1). qa-tester: ADEQUATE. Advisory: `priceOutcome` passes a raw non-finite `civiliansHit` through to the stored outcome; the spec names only priced fields.
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
