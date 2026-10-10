# Story 009: A loss pays nothing; a failed generated contract leaves the market

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-004`, `TR-economy-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key  
**Secondary ADRs**: ADR-0003: Authored and generated contracts are the same kind of work
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Removing the stored Reward from a loss outcome.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a loss, stored Reward 85,000 CR, 2 unique squad first-hits and optional bonus 0 CR, THEN `reward = 85,000 CR`, Collateral = 10,000 CR, `net_payout = 0 CR`, and Credits are unchanged by the contract fee.
- [ ] GIVEN a loss, stored Reward 62,000 CR and optional objective complete (+9,000 CR), THEN `net_payout = 0 CR` and Credits are unchanged by the contract.
- [ ] GIVEN a failed generated contract, WHEN debrief has applied, THEN `net_payout = 0 CR`, that instance is gone, and Credits are unchanged by the contract fee.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `reward = economy.reward` is also stored on loss, so the invoice can print it; `netPayout` is 0 unless won and not quiet.
- A generated contract that is fulfilled or failed leaves the market.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 020: other generated lifecycle exits.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 007
- Unlocks: Story 022
