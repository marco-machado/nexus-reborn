# Story 011: Intel progress awards

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0004: A won contract does not pay twice
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Moving Intel onto `worldStore`.
- Forbidden: Adding an Intel field to the deploy slice.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN intelProgress 25, a non-quiet win, `civiliansHit ≥ 1`, WHEN World Network applies, THEN intelProgress = 65.
- [ ] GIVEN intelProgress 25, a non-quiet clean win, WHEN World Network applies, THEN intelProgress = 80.
- [ ] GIVEN intelProgress J, a loss or quiet-replay win, WHEN World Network applies, THEN intelProgress = J.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Intel owner is World Network; live home is `campaignStore.intelLevel` / `intelProgress`. Do not move it to `worldStore` or `appStore`; Intel is not a WN deploy-slice field.
- Expedite does not write Intel.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012/014: what Intel level gates.
- GDD Open Question (Intel-1 stall) is unresolved — do not tune numbers here.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 012, Story 014
