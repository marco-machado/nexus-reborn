# Story 020: Generated instances leave the market, or are held when hidden

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`, `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0003: Authored and generated contracts are the same kind of work  
**Secondary ADRs**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Deleting a Locked-hidden instance to hide it.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a generated contract that is fulfilled, WHEN the market is read, THEN that instance is gone.
- [ ] GIVEN a generated contract that is expired, Credits C CR, WHEN the market is read, THEN that instance is gone, no invoice is built, and Credits stay C CR.
- [ ] GIVEN a generated contract that is raid-withdrawn, WHEN Economy instances are read, THEN that instance is gone, no invoice is built, and Credits are unchanged.
- [ ] GIVEN a generated contract that is Locked-hidden by the intel gate, WHEN Economy instances are read, THEN the instance exists and keeps its stamped Reward and ETA days.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Economy holds the instance and does not own a hide rule; World Network Core Rule 10 hides locked generated offers on the Scan.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009: failed generated contract.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 018, Story 019
- Unlocks: None
