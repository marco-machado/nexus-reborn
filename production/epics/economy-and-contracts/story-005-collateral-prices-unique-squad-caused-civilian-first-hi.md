# Story 005: Collateral prices unique squad-caused civilian first-hits

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
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Pricing anything in `src/game/` (no `reward`, `bonus`, collateral or payout from Tactical).
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a non-quiet win, Reward 85,000 CR and 2 unique civilians each first-hit by the squad, WHEN Economy prices from the outcome DTO, THEN Collateral = 10,000 CR.
- [ ] GIVEN the same civilian hit twice by the squad and no other squad civilian hits, THEN Collateral = 5,000 CR.
- [ ] GIVEN civilian harm caused only by CorpSec, THEN Collateral = 0 CR.
- [ ] GIVEN one unique squad-caused civilian first-hit that is not a death, THEN Collateral = 5,000 CR.

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts` — `priceOutcome` table tests. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 006, Story 007
