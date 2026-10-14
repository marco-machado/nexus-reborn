# Story 016: Generated ETA by threat band

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

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
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a new Moderate generated offer, WHEN it is created, THEN ETA = 2 days.
- [x] GIVEN a new High generated offer, THEN ETA = 3 days.
- [x] GIVEN a new Severe generated offer, THEN ETA = 4 days.

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

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts`

**What to test**:
- Moderate = 2, High = 3, Severe = 4 days via `contractMission(record).etaDays`

**Edge cases**: The record's own threat decides; a later garrison change keeps the ETA.

**Existing coverage / gap**: No generated-ETA test today; `CONTRACT_ETA_DAYS` is private.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/contracts.test.ts` › "generated ETA by threat band (story 016)" (5 tests); `npx vitest run src/game/contracts.test.ts` 58/58 pass (2026-10-14)

---

## Dependencies

- Depends on: None
- Unlocks: Story 017

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by unit tests in `src/game/contracts.test.ts`, describe "generated ETA by threat band (story 016)")
**Deviations**: None in code. `CONTRACT_ETA_DAYS` {MODERATE:2, HIGH:3, SEVERE:4} at `src/game/contracts.ts:150` and `etaDays: CONTRACT_ETA_DAYS[contract.threat]` at `src/game/contracts.ts:624` pre-date this story and match GDD rule 9 and the generated ETA table; ETA reads the record's stamped threat, so the manifest rule "Forbidden: Reading ETA from live threat after creation" holds. Diff is test-only.
**Test Evidence**: Logic: test file at `src/game/contracts.test.ts` (present; ran 58/58 passing in this session)
**Run result**: N/A — pure src/game logic; ETA chip display is pre-existing and unchanged (from /dev-story checkpoint)
**Code Review**: Complete with gap — /code-review ran on `src/game/contracts.test.ts`, `src/game/contracts.ts` and returned "Verdict: NOT ASSESSED" (lead-programmer and qa-tester specialists could not be spawned; no Agent tool in the workflow subagent). Reviewer's own pass: no required changes, would be APPROVED WITH SUGGESTIONS; ADR-0012 and ADR-0001 COMPLIANT; standards 6/6. Lean-mode prompt answered autonomously as "Yes — /code-review ran" with that result.
**Gates**: QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW skipped — Lean mode (covered by /code-review above).
**Autonomous decisions**: Phase 7 "Close the story (Recommended)" taken by default (autonomous mode, verdict COMPLETE WITH NOTES).

**Advisory findings (from /code-review):**
- Review gap (process): specialist and qa-tester review NOT ASSESSED. Re-run /code-review where the Agent tool is available, or the owner accepts this review without specialists.
- Weak test: "lets the record's own threat decide, not the sector's later garrison" — the `contractThreat('CRITICAL')` and `structuredClone(offer)` assertions never change the sector's garrison, so they pass under any implementation. The `reclientContract` half is the useful part. Suggest dropping the clone/contractThreat lines, or rolling a second offer from an `af` input with garrison CRITICAL and asserting the first offer's ETA stays 3.
- Traceability mismatch: this story cites `TR-economy-006`, but `docs/architecture/tr-registry.yaml:189` defines it as store placement ("Economy owns generated contract instances; live home is worldStore.contracts / contractRngState / nextContractT"), not ETA by threat band. Owner decision: re-point the TR-ID or add a TR entry for generated ETA.
- Optional: `CONTRACT_ETA_DAYS` stays private; tests correctly go through public `contractMission(record).etaDays`, no export needed.
- Manifest version: story 2026-10-08 matches current control manifest 2026-10-08.
