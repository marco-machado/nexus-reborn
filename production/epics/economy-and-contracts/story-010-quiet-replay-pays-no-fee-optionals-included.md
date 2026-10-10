# Story 010: Quiet replay pays no fee, optionals included

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-004`, `TR-economy-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0004: A won contract does not pay twice  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Unlimited full-fee authored replay.
- Forbidden: Restamping the slice from live stores.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a quiet-replay win, Reward 62,000 CR, optional complete +9,000 CR and any Collateral, THEN `net_payout = 0 CR` including optionals and outcome `reward = 62,000 CR`.
- [ ] GIVEN Glass Veil already won, WHEN a quiet-replay win debriefs, THEN contract fee is 0 CR.
- [ ] GIVEN a quiet-replay win at Credits 128,450 CR, WHEN Economy applies, THEN Credits = 128,450 CR.
- [ ] GIVEN an Economy slice created with `quietReplay` false and Reward R, WHEN live `contractsWon` later includes that contract before apply, THEN Economy prices with frozen `quietReplay` false and Reward R (no restamp).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `MissionOutcome.quietReplay` is the Economy-slice boolean; `maybeOutcome`, `setOutcome` and `reportMission` must not call `isQuietReplay` / `contractsWon`.
- The Economy slice is `{ id, generated, applyKey, reward, bonusDefs, etaDays, quietReplay }`, cloned once at deploy.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 005: Influence/Intel/Control side of quiet replay.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 007
- Unlocks: None
