# Story 019: Generated market cap, roll timer and client

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Counting only Offered instances toward the cap in this story.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN 3 generated instances in Offered or Locked-hidden, WHEN a generation due fires, THEN the instance count stays 3.
- [x] GIVEN 2 generated instances in Offered or Locked-hidden, WHEN a generation due fires, THEN the count is 3.
- [x] GIVEN a generated offer is created, WHEN client is read, THEN client is not Sable Enterprises.
- [x] GIVEN fewer than 3 generated instances are open, WHEN the roll timer is read after a roll, THEN the next roll is due 2–6 strategic hours later.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Contract generation is the third kind in the `advanceFlow` collision order; rearm from the due timestamp. Locked-hidden instances still count toward the cap (GDD Open Question in World Network: do not change here).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 020: how instances leave.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`

**What to test**:
- 3 open instances (Offered or Locked-hidden) stay 3 on a due roll; 2 become 3
- Client is never Sable Enterprises
- Next roll due 2-6 h after a roll while under 3

**Edge cases**: A Locked-hidden instance counts toward 3; both window ends; deterministic from `contractRngState`.

**Existing coverage / gap**: Cap is tested (`worldStore.test.ts` ~L398, L1457); no test mentions the Sable client.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/contracts.test.ts` (describe "generated offer client (story 019)"), `src/state/worldStore.test.ts` (describe "generated market cap and roll timer (story 019)"); 202/202 pass via vitest on 2026-10-14

---

## Dependencies

- Depends on: None
- Unlocks: Story 020

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by automated tests; none deferred)
- AC-1 (3 open stay 3): `src/state/worldStore.test.ts` — "3 open instances (one Locked-hidden) stay 3 when a generation due fires", "3 Locked-hidden instances still fill the cap"
- AC-2 (2 become 3): `src/state/worldStore.test.ts` — "2 open instances (one Locked-hidden) become 3 when a generation due fires"
- AC-3 (client not Sable): `src/game/contracts.test.ts` — "generated offer client (story 019)" block (5 tests)
- AC-4 (rearm 2–6 h): `src/state/worldStore.test.ts` — rearm-from-due, both-window-ends (256 cursors), determinism from `contractRngState`
**Deviations**: None. Tests only; no production code changed (behaviour already in `src/state/worldStore.ts`). Consistent with ADR-0012 (contracts on worldStore) and ADR-0018 (rearm from the due); Locked-hidden counts toward the cap as required.
**Scope**: Within stated test files.
**Test Evidence**: Logic: test files at `src/game/contracts.test.ts`, `src/state/worldStore.test.ts` (present; 202/202 pass, run during this workflow).
**Run result**: N/A — Logic story; no player-visible surface changed (tests only).
**Code Review**: Complete with exception — `/code-review` ran on both test files and returned "Verdict: NOT ASSESSED" solely because the Phase 7 specialist reviews (lead-programmer, qa-tester) could not be spawned (no Agent tool in the workflow subagent). No blocking defects found; ADR-0012 and ADR-0018 COMPLIANT. Recorded as a known process exception (lean mode; autonomous default). Re-run `/code-review` with Agent available for a full approval.
**QA gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Advisory findings from /code-review** (follow-up, non-blocking):
- `src/game/contracts.test.ts:1040-1050` ("an offer the store posts on a generation due is not signed by Sable"): does not reset the store; depends on state left by the earlier win-jump `advanceDays` test (~L947-991). `expect(posted.length).toBeGreaterThan(0)` can pass on leftover contracts; it also leaves `nextEventT`/`nextTaxT` = 1e12. Suggest starting from `structuredClone(snapshot)`/initial state and asserting `contracts.length` grew.
- `src/game/contracts.test.ts:1004-1010` (`expectNotSable`): `/sable/i` on briefing text is broader than the AC; `SABLE` is a recruit codename (`src/game/recruits.ts:40`). Prefer `/sable enterprises/i` or checking the client is in HOLDERS.
- `src/state/worldStore.test.ts` (`lastDraw` helper): reconstructs the rearm draw by undoing the mulberry32 increment (0x6d2b79f5); correct today (`src/game/rng.ts:6-12`, `worldStore.ts:678`) but coupled to the PRNG internals and draw order. Add a comment or rely on the range and determinism tests.
- Positive: Locked-hidden fixture checks `visibleContracts([c], INTEL_LEVEL)` is empty, so the Locked-hidden-counts edge case is shown, not assumed.
