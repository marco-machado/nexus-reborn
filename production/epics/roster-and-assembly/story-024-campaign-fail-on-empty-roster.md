# Story 024: Campaign fail on empty roster

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0020: Campaign fail flags  
**ADR Decision Summary**: campaignFailed and campaignWon are two booleans written in `reportMission`; a completed campaign survives a roster wipe.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: re-deriving campaignFailed from roster length on hydrate.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** campaign is not complete and living roster count reaches 0, **WHEN** campaign flags are read, **THEN** the campaign is failed-empty-roster, it is not also complete, and contracts are locked. *(GDD AC 38)*
- [x] **GIVEN** campaign already complete, **WHEN** living roster count reaches 0, **THEN** campaign stays complete and is not marked failed. *(GDD AC 39)*
- [x] **GIVEN** the director never hires and living roster count reaches 0 on an incomplete campaign, **WHEN** campaign flags are read, **THEN** the campaign is failed-empty-roster and is not also complete. *(GDD AC 77)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `isCampaignFailed(rosterSize, alreadyComplete)` = `rosterSize === 0 && !alreadyComplete`, evaluated in `reportMission` with this debrief’s `allWon`.
- Never re-derive fail from length on hydrate. Contracts lock via `selectMission` no-op when failed.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`
**What to test**:
- Incomplete campaign, living 0 → failed-empty-roster, not complete, contracts locked (AC 1)
- Already complete, living 0 → stays complete, not failed (AC 2)
- Never hired, living 0 on incomplete → failed, not complete (AC 3)

**Edge cases to cover**: one Injured operative counts as living. Existing WN-018/019 tests cover much of this; cite them in the story's evidence instead of duplicating.
**Estimated test count**: ~3 unit tests (some already exist)

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, describe "campaign fail on empty roster (RA-024)" (3 tests); edge case cited from WN-019 "one injured operative still counts as living as a crisis enters and clears"

---

## Dependencies

- Depends on: Story 014
- Unlocks: Story 025

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred)
- AC 38: `src/state/campaignStore.test.ts` RA-024 "an incomplete campaign at living 0 is failed, not complete, and locks contracts (AC 38)" — drives `reportMission` and the real `appStore.selectMission`. COVERED.
- AC 39: RA-024 "an already complete campaign at living 0 stays complete and is not failed (AC 39)"; also WN-018 "a completed campaign stays complete after a later roster wipe". COVERED.
- AC 77: RA-024 "a director who never hires and reaches living 0 on an incomplete campaign fails it (AC 77)"; overlaps WN-018 pyrrhic test. COVERED.
- Edge case (Injured counts as living): WN-019 "one injured operative still counts as living as a crisis enters and clears" (`src/state/campaignStore.test.ts`, ~lines 446-468). COVERED by existing test.
- `npx vitest run src/state/campaignStore.test.ts`: 90/90 passed (2026-10-16).
**Deviations**: None. Implementation verified against ADR-0020: `src/state/campaignStore.ts` `reportMission` calls `isCampaignFailed(operatives.length, allWon)` with this debrief's `allWon` and sets `campaignWon = allWon && !campaignFailed`; `src/state/appStore.ts` `selectMission` returns without change when `campaignFailed`; no hydrate re-derivation, no `CampaignStatus` enum. Scope: only the test file changed (plus story and sprint-status bookkeeping).
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts` (RA-024 block, 3 tests; WN-018/019 cited).
**Run result**: N/A — pure store logic; no change to anything a player sees (the existing fail banner and contract-lock UI are unchanged).
**Code Review**: Ran. `/code-review` verdict NOT ASSESSED — the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the workflow subagent). Own review: no Required Changes; ADR-0020 COMPLIANT, Standards 6/6, Architecture CLEAN, SOLID COMPLIANT; vitest 90/90, `tsc -b` and eslint clean. Lean mode: QL-TEST-COVERAGE skipped; LP-CODE-REVIEW answered "yes, /code-review ran" (autonomous default, logged).
**Specialist Code Review (2026-10-16)**: APPROVED. Specialists spawned from the main session: lead-programmer APPROVED, qa-tester TESTABLE. Fixes: no fix needed. Suggestions recorded: AC 39 and AC 77 largely duplicate WN-018. This supersedes the NOT ASSESSED result above.
**Advisory findings (from /code-review)**:
- Review gap (tooling): re-run `/code-review` from a context that can spawn agents if an APPROVED verdict is required.
- Possible duplicate test: the RA-024 AC 39 test nearly duplicates WN-018 "a completed campaign stays complete after a later roster wipe"; the AC 77 test overlaps WN-018's pyrrhic test and adds only the never-hired roster check. The QA Test Cases asked to cite WN-018/019 rather than duplicate. Consider dropping the AC 39 duplicate in a follow-up and citing WN-018.
- Story evidence: filled in by this close-out (test file recorded, criteria ticked, WN-019 cited for the Injured edge case).
- `production/sprint-status.yaml` lists `estimate_days: 0.1`; this file says `Estimate: 0.5 d`. Pre-existing mismatch, not changed here.
