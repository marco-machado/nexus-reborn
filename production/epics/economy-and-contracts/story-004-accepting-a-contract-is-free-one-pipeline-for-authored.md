# Story 004: Accepting a contract is free; one pipeline for authored and generated work

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0003: Authored and generated contracts are the same kind of work  
**Secondary ADRs**: ADR-0013: Credits never overdraw
**ADR Decision Summary**: One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A second “story” pipeline for authored work.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN Credits 128,450 CR, WHEN an authored or generated contract is accepted, THEN Credits stay 128,450 CR.
- [x] GIVEN an authored contract accepted and played to a Win, THEN the Screens visited are Brief, Assembly, Mission, Debrief in that order; GIVEN a generated contract, THEN the same four in the same order.
- [x] GIVEN Glass Veil already won, WHEN the director returns to the World Network, THEN Glass Veil remains selectable.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Authored and generated contracts are the same kind of work; type chooses the district family and objective set for both.
- `selectMission` does not debit Credits. Do not persist `committedFunds()` as a second ledger.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 021: campaign-complete flag.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Integration.*

**Test file**: `src/state/appStore.test.ts`

**What to test**:
- Accepting an authored or generated contract leaves Credits at 128,450 CR
- Screens visited end Brief, Assembly, Mission, Debrief in order for both kinds
- A won Glass Veil stays selectable

**Edge cases**: Backing out of a Brief does not charge; no second pipeline for authored work.

**Existing coverage / gap**: `selectMission` is ~L180 of `appStore.ts`; no test by that name today.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — Integration test beside `src/state/appStore.ts` / `src/game/contracts.test.ts` driving `selectMission` and the phase sequence. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts` (EC-004 block, 7 tests)

The edge case "no second pipeline for authored work" is covered indirectly: the two AC 2 tests assert identical phase sequences (`brief`, `team`, `mission`, `debrief`) for the authored and generated contract. Scope: these are store-level tests driving `appStore` actions; `setOutcome` stands in for the sim's mission end, and the screen components in `src/App.tsx` are not driven.

Run-and-observe evidence for AC 3: `production/qa/evidence/ec-004/` (World Network with `contractsWon: ['m01']`, Glass Veil listed unlocked; selecting it opens its Brief with Credits unchanged).

---

## Dependencies

- Depends on: None
- Unlocks: Story 021

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None. No production code changed; the diff is tests and story metadata only.
**Test Evidence**: Integration: `src/state/appStore.test.ts` (describe "Accepting a contract is free; one pipeline for both kinds (EC-004)", 7 tests). Ran `npx vitest run src/state/appStore.test.ts` during /story-done: 119/119 passed. Retained screenshots: `production/qa/evidence/ec-004/01-world-network-glass-veil-won-selectable.jpg`, `production/qa/evidence/ec-004/02-glass-veil-brief-opens-credits-unchanged.jpg`.
**Run result**: OBSERVED — dev server on port 4200, existing save backed up, `campaign.contractsWon` set to `['m01']`, CONTINUE: World Network OPEN CONTRACTS lists Glass Veil as `wm-op` with no `aria-disabled`; clicking it opened the Glass Veil Brief, Credits stayed 97,450 CR. Original save restored afterwards; server stopped.
**Code Review**: Ran /code-review on `src/state/appStore.test.ts` — Verdict NOT ASSESSED (lead-programmer and qa-tester specialist reviews could not be spawned: no Agent tool in the workflow subagent). Testability and ADR checks found no blocking defects; ADR-0003 and ADR-0013 COMPLIANT. Re-run /code-review where Agent is available for a full APPROVED verdict. (Lean mode: LP-CODE-REVIEW and QL-TEST-COVERAGE gates skipped.)
**Advisory findings (from /code-review)**:
- Process: specialist reviews (lead-programmer, qa-tester) were not run.
- AC 3 (test ~L2085): the test shows `selectMission('m01')` works at store level after a win; the UI list (`src/ui/WorldMap.tsx` `opsFor` L113, row lock L928) has no `contractsWon` filter, but no test pins that. Consider a small test of `opsFor` or of the list.
- `playToWin` calls `setOutcome` without driving the `mission` phase through the sim; "one pipeline" is shown through store actions, not the screen components in `src/App.tsx` (scope noted in Test Evidence).
- `playToWin` duplicates most of the EC-011 `deployAndWin` helper (~L1840-L1868); a shared module-level helper would remove it.
- The "entering the mission" and "backing out" loops add a generated contract via `useWorldStore.setState({ contracts: [c] })` without removing it; the describe-level `beforeEach` resets the world store, so isolation holds (hygiene remark only).
- The QA edge case "no second pipeline for authored work" is covered only indirectly by the identical AC 2 sequences (now stated in Test Evidence).
**Decisions logged (autonomous run)**: Phase 5 lean code-review prompt answered "Yes — /code-review ran" with the result above; Phase 7 took the recommended "Close the story".

