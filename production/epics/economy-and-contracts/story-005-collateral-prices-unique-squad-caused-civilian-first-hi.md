# Story 005: Collateral prices unique squad-caused civilian first-hits

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
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Pricing anything in `src/game/` (no `reward`, `bonus`, collateral or payout from Tactical).
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a non-quiet win, Reward 85,000 CR and 2 unique civilians each first-hit by the squad, WHEN Economy prices from the outcome DTO, THEN Collateral = 10,000 CR.
- [x] GIVEN the same civilian hit twice by the squad and no other squad civilian hits, THEN Collateral = 5,000 CR.
- [x] GIVEN civilian harm caused only by CorpSec, THEN Collateral = 0 CR.
- [x] GIVEN one unique squad-caused civilian first-hit that is not a death, THEN Collateral = 5,000 CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `priceOutcome(result: MissionResult, economy: EconomySlice): MissionOutcome` is pure, lives with the Credits ledger and `COLLATERAL_FINE` in `src/state/appStore.ts`, and reads no store.
- Tactical counts unique squad-caused civilian first hits as `civiliansHit` (N); Economy prices it. Read the priced fields; never derive collateral on the fly from `reward × civiliansHit`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: clamps and sanitising.
- Story 007: net payout arithmetic.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- Reward 85,000 CR with civiliansHit 2 gives Collateral 10,000
- civiliansHit 1 (a repeat hit on one civilian is still 1 at the DTO) gives 5,000
- civiliansHit 0 (CorpSec-only harm, which Tactical never counts) gives 0
- One non-fatal first-hit gives 5,000

**Edge cases**:
- Reward smaller than the fine
- Reward 0
- Count must be read from the outcome, never derived from `reward × civiliansHit`

**Existing coverage**: Partly present: `mission outcome payout` > 'fines per civilian hit, capped at the reward'. Unique-hit counting itself is Tactical's (`tactical-mission` story 010), so assert the priced fields only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts` — `priceOutcome` table tests. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts`, describe "Collateral prices unique squad-caused civilian first-hits (EC-005)"

---

## Dependencies

- Depends on: None
- Unlocks: Story 006, Story 007

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by `src/state/appStore.test.ts`, describe "Collateral prices unique squad-caused civilian first-hits (EC-005)"; 8 tests run and passed under vitest at story-done, including the reward-below-fine, reward-0 and no-derive-from-reward edge cases)
**Deviations**: None. Only `src/state/appStore.test.ts` changed for this story; `priceOutcome`, `collateralFine` and `COLLATERAL_FINE` already lived in `src/state/appStore.ts`, and `src/game/` prices nothing (it only counts `civiliansHit`). Manifest version 2026-10-08 matches the current control manifest.
**Test Evidence**: Logic: test file at `src/state/appStore.test.ts`
**Run result**: N/A — test-only Logic story; no player-visible surface changed
**Code Review**: Done 2026-10-14 — lead-programmer: APPROVED WITH SUGGESTIONS, no blocking findings (commits 6839a5b..a79bed1). qa-tester: ADEQUATE. Advisory: the hit-twice and non-fatal rows share N = 1, since unique-hit counting is Tactical's.
**Gates**: QL-TEST-COVERAGE skipped — Lean mode.
