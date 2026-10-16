# Story 010: New campaign roster: eight living, Raven Injured

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a new campaign, **WHEN** the living roster is read, **THEN** living count = 8, each operative is Ready or Injured only, Raven is Injured, and the other 7 are Ready. *(GDD AC 34)*
- [x] **GIVEN** a new campaign, **WHEN** the living roster is first read, **THEN** Raven is Injured with remaining downtime = 86400 s (24 strategic hours). *(GDD AC 21)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Starting roster is eight living operatives, each Ready or Injured only; Raven starts Injured with 86400 s remaining on strategic `t`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 016: recovery on sync.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`
**What to test**:
- Living count 8; every status ∈ {Ready, Injured}; Raven Injured; other 7 Ready (AC 1)
- Raven remaining downtime 86400 s at first read (AC 2)

**Edge cases to cover**: New Operation after a lived-in campaign resets to the same eight (no carried-over hires or KIA).
**Estimated test count**: ~3 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, describe 'new campaign roster (RA-010)' (3 tests; file 52/52 pass)

---

## Dependencies

- Depends on: None
- Unlocks: Story 016

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 2/2 passing (none deferred)

| Criterion | Test | Status |
|-----------|------|--------|
| AC 34: eight living, Ready/Injured only, Raven Injured, other 7 Ready | `src/state/campaignStore.test.ts` :: new campaign roster (RA-010) › holds eight living operatives… | COVERED |
| AC 21: Raven downtime 86400 s at first read | `src/state/campaignStore.test.ts` :: new campaign roster (RA-010) › first read shows Raven with 86400 s… | COVERED |
| QA edge: New Operation after a lived-in campaign resets to the same eight | `src/state/campaignStore.test.ts` :: new campaign roster (RA-010) › New Operation after a lived-in campaign… | COVERED |

**Deviations**: None blocking. Advisory:
- Test-only story: `src/state/campaignStore.ts` (`initialCampaignData`, `INITIAL_INJURY_RECOVERY = 24 * HOUR`) and `src/state/save.ts` (`startNewOperation`) already met both ACs and are unchanged; only `src/state/campaignStore.test.ts` changed (+71 lines).
- Traceability: `TR-roster-003` (registry text "Injury recovery and the candidate market run on strategic t; a win ETA can finish recovery") covers recovery timing, not the opening roster. The ACs come straight from GDD ACs 34 and 21; a tidy-up, not a defect.
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts` (present; `npx vitest run src/state/campaignStore.test.ts` 52/52 pass, run during /story-done).
**Run result**: N/A — Logic story; starting roster state has no new surface (implementation pre-existed in initialCampaignData).
**Code Review**: Complete — `/code-review` ran in the implement-stories workflow on `src/state/campaignStore.test.ts`, `src/state/campaignStore.ts`, `src/state/save.ts`. Verdict: NOT ASSESSED, because the lead-programmer and qa-tester specialist reviews could not run (the workflow subagent had no Agent tool). No defects and no Required Changes found; otherwise APPROVED WITH SUGGESTIONS. ADR Compliance: COMPLIANT (ADR-0001). Tests 52/52 pass; `tsc -b` and eslint clean. Advisory findings:
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, qa-tester TESTABLE. Fixes: 0564a8f. Suggestions recorded: redundant READY-or-INJURED check in expectFreshRoster. This supersedes the NOT ASSESSED result above.
- The review was incomplete (the reason for NOT ASSESSED): the lead-programmer and qa-tester reviews were skipped. The testability check was done in place of them; both GDD ACs and the QA-plan edge case each map to a passing test.
- `src/state/campaignStore.test.ts`, RA-010 block: `startNewOperation` also resets worldStore, appStore, researchStore, tutorialStore and the save status, but the file's `beforeEach` resets only `useCampaignStore`. This is safe now because the describe is last in the file. A later describe appended after it would inherit those reset stores. Consider an `afterEach`, or a comment noting the dependency.
- `expectFreshRoster`: the `toContain(['READY','INJURED'])` check and the filter-length-7 check are implied by the per-operative `toBe` assertion. Harmless; kept to mirror the AC wording.
**Gates**: QL-TEST-COVERAGE skipped (Lean mode). LP-CODE-REVIEW lean prompt answered "Yes — /code-review passed or was approved with suggestions" (autonomous workflow, from the review result above).
**Close decision**: autonomous mode picked "Close the story (Recommended)" for verdict COMPLETE WITH NOTES.
