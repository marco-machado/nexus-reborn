# Story 007: Net payout: reward plus optional bonus minus collateral

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-011`, `TR-economy-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Reading bonus values from Tactical or from live `mission.reward`.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a non-quiet win, Reward 85,000 CR, optional bonus 0 CR, Collateral 10,000 CR, WHEN debrief applies, THEN `net_payout = 75,000 CR`.
- [x] GIVEN Reward 41,000 CR, Collateral 41,000 CR and optional complete +6,000 CR, THEN `net_payout = 6,000 CR`.
- [x] GIVEN Reward 85,000 CR, completed_bonus −1,000 CR and Collateral 0 CR, THEN `optional_bonus = 0 CR` and `net_payout = 85,000 CR`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `bonus` = sum of `economy.bonusDefs[id]` over unique `completedOptionalIds`; unknown ids and non-finite or negative values price 0.
- `netPayout = (won && !quietReplay) ? reward + bonus − collateral : 0`.
- Tactical emits completed optional objective ids only; Economy prices the bonus from frozen Economy-slice defs.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: worked contract examples.
- Story 009/010: loss and quiet pricing.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- Reward 85,000, bonus 0, Collateral 10,000 gives 75,000
- Reward 41,000, Collateral 41,000, optional +6,000 gives 6,000
- Bonus def −1,000 prices 0 and `netPayout` stays 85,000

**Edge cases**:
- Duplicate completed optional ids count once
- Unknown optional id prices 0
- Collateral larger than reward plus bonus never goes below 0 (`netPayout` clamp)

**Existing coverage**: Partly present: 'netPayout pays reward minus fine on a win and nothing on a loss', 'a win drowned in collateral pays zero'. Check the +6,000 and negative-bonus cases.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts`, describe "Net payout: reward plus optional bonus minus collateral (EC-007)" (6 tests)

---

## Dependencies

- Depends on: Story 005, Story 006
- Unlocks: Story 008

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all auto-verified by unit tests; `npx vitest run src/state/appStore.test.ts -t EC-007` ran 6 passed)
**Deviations**: None. `priceOutcome` / `netPayout` in `src/state/appStore.ts` match the Implementation Notes; collateral is clamped to reward in `collateralFine`, so `netPayout` never drops below the bonus.
**Test Evidence**: Logic: `src/state/appStore.test.ts`, describe "Net payout: reward plus optional bonus minus collateral (EC-007)" (6 tests, incl. duplicate id, unknown id, collateral clamp edge cases)
**Run result**: N/A — pure pricing logic; Debrief already renders netPayout, no new surface
**Code Review**: Done 2026-10-14 — lead-programmer: APPROVED WITH SUGGESTIONS, no blocking findings (commits 6839a5b..a79bed1). qa-tester: ADEQUATE. Advisory: AC1 is tested on the pure functions, not through `applyDebrief`.
**Advisory**: QL-TEST-COVERAGE skipped — Lean mode.
