# Story 006: Collateral clamps and input sanitising

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a non-quiet win, Reward 41,000 CR and 9 unique squad first-hits, THEN Collateral = 41,000 CR (capped at Reward).
- [ ] GIVEN civiliansHit −1, THEN Collateral = 0 CR and `net_payout` is not increased by a negative fine.
- [ ] GIVEN civiliansHit 2.7, THEN N = 2 and Collateral = 10,000 CR (Reward 85,000 CR).
- [ ] GIVEN civiliansHit NaN and completed_bonus NaN, THEN Collateral = 0 CR, `optional_bonus = 0 CR`, and `net_payout = 85,000 CR`.

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 005
- Unlocks: Story 007
