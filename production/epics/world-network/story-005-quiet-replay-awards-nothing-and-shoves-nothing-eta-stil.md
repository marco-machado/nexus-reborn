# Story 005: Quiet replay awards nothing and shoves nothing; ETA still catches up

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-010`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0004: A won contract does not pay twice  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Calling `isQuietReplay` / `contractsWon` from the outcome path.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a frozen quiet-replay win outcome, Influence I, intelLevel L, intelProgress J, sector Control C, Unrest U and city holder H at `t0`, WHEN direct outcome write-back completes at an instrumented boundary before ETA advancement, THEN Influence = I, intelLevel = L, intelProgress = J, Control = C, Unrest = U, holder = H, and `t` is still `t0`.
- [ ] GIVEN that post-write-back state at `t0` and a comparison copy with identical RNG cursors and scheduled dues, WHEN the quiet win spends its stamped ETA and the comparison copy advances continuously through the same strategic interval, THEN both reach `t0` plus the stamped ETA days with identical timed-flow state and Tax deposits. (Final Control, Unrest, ownership and Feed may differ from pre-ETA values.)
- [ ] GIVEN a loss retry of a previously won authored contract, WHEN the outcome applies, THEN it pays in full (a retry after loss is not quiet).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `MissionOutcome.quietReplay` is the Economy-slice boolean; `maybeOutcome`, `setOutcome` and `reportMission` must not call `isQuietReplay` / `contractsWon`.
- A repeat win on an authored contract pays no Credits, Influence or Intel.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008/011: non-quiet Influence and Intel awards.
- Economy epic: the Credits side of quiet replay.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/worldStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002, Story 003
- Unlocks: None
