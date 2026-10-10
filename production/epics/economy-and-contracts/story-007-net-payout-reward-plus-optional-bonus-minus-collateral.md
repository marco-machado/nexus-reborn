# Story 007: Net payout: reward plus optional bonus minus collateral

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a non-quiet win, Reward 85,000 CR, optional bonus 0 CR, Collateral 10,000 CR, WHEN debrief applies, THEN `net_payout = 75,000 CR`.
- [ ] GIVEN Reward 41,000 CR, Collateral 41,000 CR and optional complete +6,000 CR, THEN `net_payout = 6,000 CR`.
- [ ] GIVEN Reward 85,000 CR, completed_bonus −1,000 CR and Collateral 0 CR, THEN `optional_bonus = 0 CR` and `net_payout = 85,000 CR`.

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 005, Story 006
- Unlocks: Story 008
