# Story 016: Injury recovery on strategic sync

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
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Forbidden: catch-up running before debrief write-back.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** Injured with `recoverAtT = T`, **WHEN** a strategy Screen tick (including Assembly) reaches `t ≥ T`, **THEN** the operative is Ready and the cleared Squad bay stays empty. *(GDD AC 40)*
- [x] **GIVEN** an Injured operative whose recovery completes, **WHEN** they become Ready, **THEN** the Squad bay cleared at injury stays empty. *(GDD AC 22)*
- [x] **GIVEN** Injured with `recoverAtT = T` and a candidate due at T with market count N just before that sync, **WHEN** `sync(T)`, **THEN** the operative is Ready and market count is `min(3, N + 1)`. Both dues complete in that sync; apply order is unspecified. *(GDD AC 78)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `campaignStore.sync(t)` runs after `t` advances (ADR-0018), from any strategy Screen tick including Assembly.
- Recovery sets Ready but never re-fills the bay cleared at injury.
- Recovery and a due candidate in the same sync both complete; apply order is unspecified — do not assert one.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 022: market cadence itself.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`
**What to test**:
- `sync(t ≥ T)` with `recoverAtT = T` → Ready; bay stays empty (AC 1, AC 2)
- Recovery and a candidate due both at T → Ready and market `min(3, N + 1)` (AC 3)

**Edge cases to cover**: `sync(T − 1)` still Injured; two Injured with the same T both recover.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` › `injury recovery on strategic sync (RA-016)` (5 tests incl. 4-case it.each); `npx vitest run src/state/campaignStore.test.ts` 78/78 passed 2026-10-16

---

## Dependencies

- Depends on: Story 010, Story 013
- Unlocks: Story 017

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred)

| Criterion | Test | Status |
|-----------|------|--------|
| AC 40: strategy Screen tick (Assembly) reaching t >= T → Ready, bay stays empty | `src/state/campaignStore.test.ts` › "a strategy Screen tick reaching t >= T sets Ready and leaves the cleared bay empty (AC 40)" | COVERED |
| AC 22: recovered operative Ready, cleared bay stays empty | `src/state/campaignStore.test.ts` › "a recovered operative becomes Ready but the bay cleared at injury stays empty (AC 22)" | COVERED |
| AC 78: recovery + candidate due at T → Ready and market min(3, N + 1) | `src/state/campaignStore.test.ts` › "recovery and a candidate due both at T complete in one sync ... (AC 78)" (N = 0..3) | COVERED |
| Edge: sync(T − 1) still Injured | "sync(T - 1) leaves the operative Injured ..." | COVERED |
| Edge: two Injured with the same T both recover | "two Injured operatives with the same T both recover in one sync" | COVERED |

**Deviations**: None. Implementation (`campaignStore.sync`, src/state/campaignStore.ts) was already in place; this story added tests only. Scope: only `src/state/campaignStore.test.ts` changed. Manifest version matches (2026-10-08).
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts` (78/78 passed in this run).
**Run result**: N/A — Logic story; recovery behaviour already in `sync()`, no new visible surface (from /dev-story checkpoint).
**Code Review**: Complete with caveat — `/code-review` ran on src/state/campaignStore.test.ts, src/state/campaignStore.ts, src/ui/clock.ts and returned **NOT ASSESSED**: the inline review found nothing blocking (ADR-0001, ADR-0018 compliant; standards and architecture clean), but the lead-programmer and qa-tester specialist reviews were never spawned (no Agent tool in the workflow subagent). Lean mode: LP-CODE-REVIEW and QL-TEST-COVERAGE gates skipped.
**Specialist Code Review (2026-10-16)**: APPROVED. Specialists spawned from the main session: lead-programmer APPROVED, qa-tester TESTABLE. Fixes: 0564a8f. Suggestions recorded: none. This supersedes the NOT ASSESSED result above.
**Unattended decisions** (workflow run, defaults taken): Phase 5 lean prompt answered "/code-review ran" with the result above; Phase 7 took "Close the story (Recommended)".

**Advisory findings from /code-review** (not blocking):
- The review is incomplete because the lead-programmer and qa-tester reviews were never spawned. Re-run `/code-review` from a context that can spawn agents if an APPROVED verdict is needed.
- RA-016 AC 22 / AC 40 tests: the `squad` equals `['op1','op3']` assertion can never fail through `sync`, because `campaignStore.sync` (src/state/campaignStore.ts:331-367) never touches appStore. It is weak evidence that the bay stays empty, but it matches the AC as written.
- src/state/campaignStore.test.ts:1088-1091: the describe comment mentions "the debrief catch-up" path (advanceDays then sync), but no RA-016 test exercises it. No AC requires it here; it is a coverage note (RA-017 covers win-ETA catch-up).
- src/state/campaignStore.test.ts:31 imports `startWorldClock` from `../ui/clock`, so a state-layer test depends on the UI layer. Acceptable because it is test-only and drives the real strategy Screen tick for AC 40.
- The seeded op5 (INJURED, recoverAtT 24h) also recovers in every RA-016 sync because T = 30h. The tests only assert on op2/op4, but the file does not call out this side effect.
- Positive: the AC 78 it.each covers N = 0..3, including the full pool, and asserts no apply order. The AC 40 test runs the real `startWorldClock` with an injected ClockFrames fake under phase `team` (Assembly). Both edge cases are covered.
