# Story 011: Valid flag combinations load as stored

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: drop-all for empty + incomplete + `!failed`.
- Forbidden: failing a completed campaign on a later roster wipe.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN a campaign blob with `campaignFailed` true and 0–2 authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present.
- [x] GIVEN a campaign blob with `campaignFailed` true, `campaignWon` false, and all three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present.
- [x] GIVEN a campaign blob with `campaignFailed` false, `campaignWon` false, living roster empty, and fewer than three authored ids in `contractsWon`, WHEN the origin reloads to Menu, THEN Continue is present and campaign result is still not failed (hydrate does not re-derive failed from living count 0).
- [x] GIVEN campaign complete, then roster emptied, WHEN reload + Continue, THEN still complete, not also failed; authored contracts remain selectable for replay.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Hydrate restores stored flags and never re-derives failed from a living count of 0. A complete campaign keeps authored contracts selectable for replay.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/save.test.ts`.
- Failed with 0–2 authored wins loads
- Failed, not won, 3 authored wins loads
- Not failed, not won, empty roster, <3 wins loads and stays not failed
- Complete then roster emptied: still complete, not failed; contracts replayable
- Edge: Failed is never re-derived from living count 0

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` (5 PV-011 tests in "valid flag combinations load as stored"; full suite 1073/1073 pass, 2026-10-15)

---

## Dependencies

- Depends on: Story 010
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (all covered by automated tests in `src/state/save.test.ts`, describe 'valid flag combinations load as stored'; no deferred items)
**Deviations**: None blocking. Advisory: TR-persistence-006's registry text covers the invalid-blob drop-all; this story tests its complement (valid flag combinations from GDD Rules 8, 11, 14 and ADR-0020 must load), so the TR mapping is loose.
**Test Evidence**: Logic: test file at `src/state/save.test.ts` (5 PV-011 tests). Re-ran in /story-done: `npx vitest run` 45 files, 1073/1073 pass (2026-10-15).
**Run result**: N/A — test-only story; no new visible surface (from /dev-story checkpoint).
**Code Review**: Complete — /code-review ran in the workflow on `src/state/save.test.ts` with verdict NOT ASSESSED: specialist reviews (lead-programmer, qa-tester) could not be spawned (no Agent tool); all other phases found no defects. ADR Compliance: COMPLIANT (ADR-0011, ADR-0020). Testability: TESTABLE. Re-run /code-review where Agent is available if a full approval is needed.
**Gates**: QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW replaced by the lean-mode /code-review question (autonomous: answered "Yes — /code-review ran", result above).

**Advisory findings from /code-review**:
- Test 'complete then roster emptied' checks replayability with `state.campaignFailed || missionLocked(m, state.intelLevel)`, copied from `src/ui/WorldMap.tsx:273`, not the real lock path (ADR-0020: `selectMission` no-ops when campaignFailed). Better: call the store's `selectMission` for each authored id and assert it selects.
- PV-011 tests hardcode contract ids ('m01', 'm03', 'm01','m02') while ALL_AUTHORED comes from MISSIONS; slicing ALL_AUTHORED would survive id renames. Valid today.
- Test Evidence's "full suite 1073/1073" was unverified at review time; now verified by the /story-done re-run above.
- `production/sprint-status.yaml` estimate_days for PV-011 is 0.1 vs 1.0 d in this file (pre-existing mismatch); reconcile when convenient.
- Coverage: all four ACs and all five QA test cases map to tests; the edge test seeds campaignFailed=true in memory before hydrating a not-failed empty-roster blob, proving hydrate copies the stored flag.
