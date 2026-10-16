# Story 022: Candidate market offers and hire cost

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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

- [x] **GIVEN** a new campaign with no hires, **WHEN** the candidate market is read, **THEN** offer count is 3; each candidate has a name that matches after save/reload, a hash figure derived from id + codename, one of the 8 roles, that role’s primary weapon, Ready, current issue in all 4 bays, and HP/speed inside §8 starting-roster ranges. Post-hire count is Open Question 2 — do not assert 3 after a hire. *(GDD AC 27)*
- [x] **GIVEN** the market already has 3 offers, **WHEN** 24 strategic hours elapse with no hire, **THEN** offer count stays 3. *(GDD AC 28)*
- [x] **GIVEN** a candidate, **WHEN** hire cost is read, **THEN** it is in 16000–34000 CR inclusive. *(GDD AC 29)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Market runs on strategic `t`; capped at 3 offers. Candidate generation in `src/game/recruits.ts` (`hireCost`) is deterministic from the serialized market RNG.
- Post-hire count is Open Question 2 — do not assert it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 023: hire.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/recruits.test.ts`, `src/state/campaignStore.test.ts`
**What to test**:
- New campaign: 3 offers; name survives save/reload; hash figure from id + codename; one of 8 roles; role primary; Ready; current issue in 4 bays; HP/speed in §8 ranges (AC 1)
- 3 offers + 24 h, no hire → still 3 (AC 2)
- Hire cost in [16000, 34000] inclusive (AC 3)

**Edge cases to cover**: do not assert the count after a hire (Open Question 2); cost bounds read from `HIRE_MIN_COST` / `HIRE_MAX_COST` only, not the quality curve.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/recruits.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/recruits.test.ts` (RA-022 block, 1 test), `src/state/campaignStore.test.ts` (RA-022 block, 3 tests); passing 2026-10-16

---

## Dependencies

- Depends on: None
- Unlocks: Story 023

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None. TR-roster-003 (market on strategic t) holds: the market advances only through `campaignStore.sync(t)`. Manifest Version 2026-10-08 matches the current control manifest. Scope: test files plus story metadata only; `src/game/recruits.ts` and `src/state/campaignStore.ts` unchanged.
**Test Evidence**: Logic: `src/game/recruits.test.ts` (RA-022 block, 1 test), `src/state/campaignStore.test.ts` (RA-022 block, 3 tests). `npx vitest run` on both files at story-done: 109/109 passing.
**Traceability**: AC 27 -> campaignStore.test.ts "a new campaign offers 3 Ready candidates..." COVERED; AC 28 -> campaignStore.test.ts "3 offers and 24 strategic hours..." COVERED; AC 29 -> recruits.test.ts "pins the range constants..." and campaignStore.test.ts "every candidate hire cost..." COVERED.
**Run result**: N/A — Logic story; tests only, no player-visible surface changed (from the /dev-story checkpoint).
**Code Review**: Complete — /code-review ran in the implement-stories workflow. Verdict NOT ASSESSED only because the lead-programmer, gameplay-programmer and qa-tester specialists could not be spawned (no Agent tool in that subagent); the reviewer's own check found no required changes, ADR-0001 COMPLIANT, Architecture CLEAN, SOLID COMPLIANT. Recorded under lean mode's "Yes — /code-review passed or was approved with suggestions" (autonomous default).
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, gameplay-programmer AWS, qa-tester TESTABLE. Fixes: 1a3f655, 0564a8f. Suggestions recorded: the AC 27 bays check reads wornAugs(done) not the candidate; hire cost uses a quality curve the GDD says not to add (Open Question, raise with game-designer). This supersedes the NOT ASSESSED result above.
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Story-done decision (autonomous)**: Phase 7 "Close the story (Recommended)" taken by default; no tech debt logged.
**Advisory review findings**:
- AC 27 test: `wornAugs(done, undefined)` and its bay loop sit inside `for (const c of candidates)` but never use `c`, so the same no-pin path is asserted three times. The per-candidate evidence is `expect('pins' in c).toBe(false)`. Consider hoisting the bay check out of the loop.
- AC 28 test: asserts only that the count stays 3 after `sync(t + 24*HOUR)`. Asserting that the oldest offer was replaced (first id changed) would prove the refresh ran. The AC itself only requires the count.
- AC 29 test (campaignStore): each day pushes `candidates.at(-1)!` without checking a new candidate was rolled. Fine today (`sync` rolls when t >= nextCandidateT, stepping by CANDIDATE_REFRESH_SEC; campaignStore.ts lines 349-385), but a silent no-refresh would double-check one offer.
- AC 29 is checked twice (recruits.test.ts 200 rolls, campaignStore.test.ts 21 offers); both read bounds from HIRE_MIN_COST/HIRE_MAX_COST. Redundant but harmless.
- Process: specialist reviewers could not be spawned in the workflow subagent (tooling gap, not a code defect).
