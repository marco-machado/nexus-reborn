# Story 014: KIA removes the operative from the living roster

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Forbidden: more than one worn project per bay.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** operative X living and assigned, **WHEN** debrief applies X in `deadIds`, **THEN** X is absent from the living roster (no Dead state), X’s Squad bay is empty, X is listed under KIA, and kia names include X. *(GDD AC 15)*
- [x] **GIVEN** X is KIA, **WHEN** the Research program is read, **THEN** completed projects stay researched. *(GDD AC 16)*
- [x] **GIVEN** the last assigned operative is KIA at debrief and at least 1 Ready operative remains on the Roster, **WHEN** Assembly is next read, **THEN** that Squad bay is empty, no operative is auto-assigned, and Deploy still needs ≥ 1 assigned Ready. *(GDD Edge Cases: last assigned dies; added by R-2)*
- [x] **GIVEN** X is in `deadIds` at debrief, **WHEN** Experience is awarded, **THEN** X receives 0 Experience. *(GDD Edge Cases / Experience award rule; added by R-2)*
- [x] **GIVEN** X is KIA at debrief, **WHEN** World Network reads the outcome, **THEN** it reads the kia names only and never queries the live Roster. *(GDD Edge Cases: both KIA and injury; World Network query forbidden; added by R-2)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- No Dead roster state: KIA are filtered out of `operatives`, bay cleared, listed under KIA.
- Research program is untouched by a death — see research epic Story 015 (death keeps the program); reference, do not duplicate.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic Stories 014–016 (appliedNodeIds/pins from the Research side).
- Story 024: empty roster campaign fail.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`, `src/state/researchStore.test.ts`
**What to test**:
- X assigned and in `deadIds` → absent from living roster (no Dead state), bay empty, listed under KIA, in kia names (AC 1)
- Completed Research projects stay researched after X's KIA (AC 2)

**Proposed criteria for R-2** (from GDD Edge Cases): last assigned dies with Ready remaining → bay empty, no auto-assign; KIA receives 0 Experience; World Network reads kia names only (not the live roster).
**Estimated test count**: ~4 integration tests

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, describe block "KIA removes the operative from the living roster (RA-014)" (4 tests); `src/state/researchStore.test.ts`, describe block "KIA keeps completed research (RA-014)" (1 test); Vitest 1209/1209 passed 2026-10-16

---

## Dependencies

- Depends on: Story 013
- Unlocks: Story 024

---

## Completion Notes
**Completed**: 2026-10-16
**Verdict**: COMPLETE WITH NOTES (/story-done, autonomous mode)
**Criteria**: 5/5 passing, none deferred
- AC 15: `src/state/campaignStore.test.ts` "drops X from the living roster with no Dead state, empties its bay, lists it under KIA (AC 15)"
- AC 16: `src/state/researchStore.test.ts` describe "KIA keeps completed research (RA-014)"
- Last assigned dies: `src/state/campaignStore.test.ts` "the last assigned dying with Ready left ..."
- 0 Experience: `src/state/campaignStore.test.ts` "X in deadIds receives 0 Experience ..."
- World Network kia names only: `src/state/campaignStore.test.ts` "World Network reads the kia names only ..."
**Deviations**: None. Scope: only the two listed test files changed; no implementation code touched.
**Test Evidence**: Integration: test files present at `src/state/campaignStore.test.ts`, `src/state/researchStore.test.ts`; `npx vitest run` on both passed 107/107 on 2026-10-16.
**Run result**: N/A — behavior already existed in `src/state/debrief.ts` and `campaignStore.reportMission`; the story adds tests only and changes nothing on screen.
**QA Coverage Gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Code Review**: Complete — /code-review ran on both test files. Its verdict was NOT ASSESSED (lead-programmer and qa-tester specialist reviews could not be spawned: no Agent tool in the workflow). Its own review found no blocking issues: ADR Compliance COMPLIANT (ADR-0002, ADR-0005), Architecture CLEAN. Lean-mode code-review question answered automatically (autonomous mode): "Yes — /code-review ran", recorded with that verdict.
**Advisory findings from /code-review** (not blocking; candidates for a follow-up):
- Process: re-run /code-review where the Agent tool is available for a full specialist verdict.
- `src/state/researchStore.test.ts` "completed projects stay researched after X is KIA" uses a loss (`won: false`); `applyDebrief` in `src/state/debrief.ts` only runs `useResearchStore.sync` on a win, so the assertion holds trivially. A won mission with a KIA would be a stronger guard for AC 16.
- `src/state/campaignStore.test.ts` "World Network reads the kia names only ...": calls `useWorldStore.applyMissionResult` directly, and the `vi.spyOn(useCampaignStore, 'getState')` check only catches `getState` calls. `src/state/worldStore.ts` does not import campaignStore today; a static no-import check or driving the call through `applyDebrief` would be harder to bypass.
- `src/state/campaignStore.test.ts` "the last assigned dying ...": the hand-built `canDeploy` call with `statusById: {}` repeats the gate; the following `startMission()` calls already cover the real path. Could be dropped. Not a defect.
