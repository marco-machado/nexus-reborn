# Story 013: Abort writes nothing to Economy

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-008`, `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Mid-mission persistence or resume.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a mission in progress on a generated contract that is Offered, Credits C CR, WHEN Abort is confirmed, THEN there is no debrief, no invoice is built, Credits stay C CR, and the generated record remains Offered.
- [x] GIVEN a mission in progress on Glass Veil Unwon, Credits C CR, WHEN Abort is confirmed, THEN there is no debrief, no invoice is built, Credits stay C CR, and Glass Veil remains Unwon.
- [x] GIVEN a mission already aborted, Credits C CR, WHEN Abort is confirmed again or teardown runs, THEN Credits stay C CR, the contract record and the apply-once key are unchanged, the record is not marked `unfiled`, and no ETA is set, so there is no Tax catch-up. *(GDD Edge Cases: If Abort; If mission is running.)*

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- An aborted or torn-down deploy burns its key and never applies. Abort does not mark `unfiled`.
- No performance impact expected: abort is a one-shot lifecycle path with no per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 004 owns the World Network half of abort.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Integration.*

**Test file**: `src/state/missionStore.test.ts`, `src/state/appStore.test.ts`

**What to test**:
- Confirmed Abort on an Offered generated contract: no outcome, no invoice, Credits C, record still Offered
- Confirmed Abort on an Unwon Glass Veil: same, still Unwon
- Second Abort or teardown after Abort: Credits, record and apply-once key unchanged; no `unfiled`; no ETA

**Edge cases**: Abort at t = 0; Abort after hits taken; a second Abort is a no-op.

**Existing coverage / gap**: Extends `missionStore.test.ts` ~L228 "abort leaves the World Network blob unchanged".

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/missionStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts` (describe "Abort writes nothing to Economy (EC-013)"), `src/state/missionStore.test.ts:290`; 138/138 passing (`npx vitest run`, 2026-10-14)

---

## Dependencies

- Depends on: Story 012
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by integration tests; none deferred)
**Deviations**: None. ADR-0021 Decision 1 (aborted/torn-down deploy burns its key, never applies; keys only increase) pinned by lastAppliedKey==0, deploySerial==burned key, next key==burned+1. ADR-0002 and ADR-0012 consistent with the ledger() snapshot. ADR-0002 has no `## Decision` heading; its compliance rests on the story's decision summary.
**Test Evidence**: Integration: `src/state/appStore.test.ts` (EC-013 describe block), `src/state/missionStore.test.ts:290`. Both files run and pass, 138/138.
**Code Review**: Complete. /code-review verdict NOT ASSESSED only because the lead-programmer and qa-tester specialists could not be spawned (no Agent tool in the unattended run); every check it could run was clean, no required changes.
**Run result**: N/A — the story changes only Zustand store tests; no screen or rendered output is touched.
**Gates**: QL-TEST-COVERAGE skipped (lean mode). LP-CODE-REVIEW lean prompt answered "Yes — /code-review passed or was approved with suggestions" (autonomous default).

**Advisory findings (from /code-review)**:
- Review gap, not a defect: Phase 7 specialists (lead-programmer, qa-tester) were not spawned. Re-run /code-review where Agent is available if an APPROVED verdict is needed.
- AC 3 "not marked `unfiled`" holds only because nothing in src implements `unfiled` yet (`rg -i 'unfiled|saveStatus' src` is empty; useSaveStatusStore exists only in docs/registry/architecture.yaml:183). No test asserts save status. Untested clause: AC 3 (unfiled). Recommend an assertion once the save-status store lands.
- QA edge case "Abort after hits taken" is not proven: deployAndRun runs 60/120 s of sim but never asserts damage before abort. Suggest asserting e.g. unit HP below max.
- The confirmAbort helper mirrors src/ui/MissionScreen.tsx:43-50 (goto('world'), setWorld(null), missionStore.reset()) but skips the Hud onAbort recordAbort telemetry call (src/ui/Hud.tsx:596). Acceptable: telemetry is not an Economy field.
