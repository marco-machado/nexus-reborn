# Story 016: Generated ETA by threat band

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Reading ETA from live threat after creation.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a new Moderate generated offer, WHEN it is created, THEN ETA = 2 days.
- [ ] GIVEN a new High generated offer, THEN ETA = 3 days.
- [ ] GIVEN a new Severe generated offer, THEN ETA = 4 days.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `etaDays` is stamped on the Economy slice at deploy and is what a win spends as strategic days.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 017: authored ETAs.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 017
