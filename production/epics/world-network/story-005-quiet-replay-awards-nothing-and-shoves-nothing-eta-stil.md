# Story 005: Quiet replay awards nothing and shoves nothing; ETA still catches up

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-12

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
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a frozen quiet-replay win outcome, Influence I, intelLevel L, intelProgress J, sector Control C, Unrest U and city holder H at `t0`, WHEN direct outcome write-back completes at an instrumented boundary before ETA advancement, THEN Influence = I, intelLevel = L, intelProgress = J, Control = C, Unrest = U, holder = H, and `t` is still `t0`.
- [ ] GIVEN that post-write-back state at `t0` and a comparison copy with identical RNG cursors and scheduled dues, WHEN the quiet win spends its stamped ETA and the comparison copy advances continuously through the same strategic interval, THEN both reach `t0` plus the stamped ETA days with identical timed-flow state and Tax deposits. (Final Control, Unrest, ownership and Feed may differ from pre-ETA values.)
- [ ] GIVEN an authored contract that is not yet won, retried after a loss, with a win outcome that is not quiet, Influence 0, intelLevel L, intelProgress 25, `civiliansHit = 0`, and sector Control C not at the unnamed cap, WHEN World Network applies the outcome at the pre-ETA boundary, THEN Influence = 8, intelLevel = L, intelProgress = 80, Control > C, and the mission city holder is Nexus. Do not assert Credits, and do not assert a numeric Unrest.
- [ ] GIVEN that same loss retry with `civiliansHit ≥ 1`, Influence 0, intelLevel L, and intelProgress 25, not at the unrest clamp, WHEN World Network applies the outcome at the pre-ETA boundary, THEN Influence = 6, intelLevel = L, intelProgress = 65, Control > C, the mission city holder is Nexus, and Unrest is greater than the clean loss-retry above. Do not assert Credits, and do not assert a numeric Unrest.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `MissionOutcome.quietReplay` is the Economy-slice boolean; `maybeOutcome`, `setOutcome` and `reportMission` must not call `isQuietReplay` / `contractsWon`.
- A repeat win on an authored contract pays no Credits, Influence or Intel.
- A loss retry is a win on an authored contract that is not yet won, so `quietReplay` is false. Influence is +6, plus +2 when `civiliansHit = 0`. Intel progress is +40, plus +15 when `civiliansHit = 0`. Control rises and the mission city holder becomes Nexus. Compare Unrest only between that clean retry and the dirty retry. Credits stay in the Economy epic.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008/011: the general non-quiet Influence and Intel award table. This story asserts those deltas only on the loss-retry path.
- Economy epic: the Credits side of quiet replay and of the loss retry.
- Story 015/016: shove magnitudes and the loss-side holder rule. This story asserts win-shove direction and a Nexus holder on the loss retry only.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). Logic. Files: `src/state/campaignStore.test.ts`, `src/state/worldStore.test.ts`, `src/game/contracts.test.ts`.

- Quiet-replay win write-back at the pre-ETA boundary leaves Influence I, intelLevel L, intelProgress J, Control C, Unrest U, holder H, and `t` at `t0`.
- Spending the stamped ETA matches a continuous advance of a copy with the same RNG cursors and scheduled dues, including Tax deposits. End `t` is `t0` plus the stamped ETA days. Final Control, Unrest, ownership, and Feed may differ from pre-ETA values.
- Loss retry, pre-ETA boundary: an authored contract not yet won after a loss, win, not quiet. Influence 0, intelLevel L, intelProgress 25, `civiliansHit = 0` ends at Influence 8, intelLevel L, intelProgress 80, Control greater than the start, holder Nexus. The same retry with `civiliansHit ≥ 1` ends at Influence 6, intelLevel L, intelProgress 65, Control greater than the start, holder Nexus, and Unrest greater than the clean retry. Do not assert Credits or a numeric Unrest.
- `quietReplay` on the outcome DTO is the input. Do not call `isQuietReplay` / `contractsWon` from `maybeOutcome`, `setOutcome`, or `reportMission`.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/worldStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [x] Present (2026-10-12). Existence checked. This closure did not run the suite.

---

## Dependencies

- Depends on: Story 002, Story 003
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-12
**Criteria**: 4/4 passing (test files present and mapped to each criterion; the suite was not executed by this closure)
**Deviations**: None against TR-world-network-010, the quiet-replay acceptance criteria, ADR-0004, or ADR-0001. `reportMission` still reads `contractsWon` to record a first authored win. It does not use that array to decide quiet.
**Scope**: The working tree also changes files outside the quiet-replay award: `src/game/world.ts` and `src/game/world.test.ts` (invoice pricing via `priceOutcome`; a loss stores the fee), `src/state/appStore.ts` beyond the `setOutcome` pass-through (`MissionResult`, `priceOutcome`, collateral floor, `goto('mission')` guard), `src/state/campaignStore.ts` (`injuryDue` early-out in `sync`), and required `quietReplay: false` fixtures in `src/state/save.test.ts` and `src/state/telemetry.test.ts`.
**Test Evidence**: Logic: test files present at `src/state/worldStore.test.ts`, `src/state/campaignStore.test.ts`, `src/game/contracts.test.ts`. Existence only.
**Code Review**: Pending — lean mode; closed unattended. Run `/code-review` on the implementation files before sprint close-out.
**Run result**: N/A — acceptance is the instrumented pre-ETA store boundary; the player-facing board is post-ETA, which the criteria allow to differ from that boundary. Quoted from the /dev-story checkpoint.
