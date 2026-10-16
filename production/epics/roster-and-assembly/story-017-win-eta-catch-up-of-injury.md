# Story 017: Win ETA catch-up of injury downtime

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

- [x] **GIVEN** injury stamped at `t0` with D, and a win catch-up at `t1`, **WHEN** remaining downtime is computed, **THEN** it equals `max(0, t0 + D − t1)`. *(GDD AC 72)*
- [x] **GIVEN** `t0 = 0`, `D = 108000`, and a win with `t1 = 172800`, **WHEN** remaining downtime is computed, **THEN** it is 0, the operative is Ready, the Squad bay stays empty, and the injury line still reports 30 hours. *(GDD AC 73)*
- [x] **GIVEN** Injured with original `D = 108000` s, **WHEN** the debrief injury line is read (including after a win ETA catch-up), **THEN** it reports 30 hours, not remaining downtime. *(GDD AC 60)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Injury stamped at frozen `t0`; a win then advances to `t1` via `advanceDays`; remaining = `max(0, t0 + D − t1)`.
- The debrief injury line reports the original D in hours, not remaining downtime.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 018: loss and quiet-replay paths.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts` (+ label helper test if extracted)
**What to test** (`remaining_downtime = max(0, t0 + D − t1)`):
- Remaining equals the formula (AC 1)
- t0 0, D 108000, t1 172800 → 0, Ready, bay empty, injury line 30 h (AC 2)
- Injury line reports original D in hours (ceil), not remaining (AC 3)

**Edge cases to cover**: t1 < t0 + D leaves positive remaining; D not a multiple of 3600 rounds the line up.
**Estimated test count**: ~4 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` (RA-017 block, 9 tests)

---

## Dependencies

- Depends on: Story 013, Story 016
- Unlocks: Story 018

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred)
- AC 72: `src/state/campaignStore.test.ts` RA-017 `it.each` (5 cases) + "t1 short of t0 + D" edge-case test. COVERED.
- AC 73: `src/state/campaignStore.test.ts` "t0 0, D 108000, win to t1 172800" (via `applyDebrief('m01')`) + retained screenshot `production/qa/evidence/ra-017/01-debrief-win-catch-up-injury-30h.jpg`. COVERED.
- AC 60: `src/state/campaignStore.test.ts` "the injury line reports the original D in hours" + "a D that is not a whole number of hours rounds the line up" + the same screenshot. COVERED.
- `npx vitest run src/state/campaignStore.test.ts`: 87/87 passed (2026-10-16).
**Deviations**: None blocking. Advisory:
- Scope: `src/ui/index.tsx` touched (Debrief injury line now calls `injuryLineHours`; same `Math.ceil(D/3600)` output). The story lists no files-to-modify; the change serves AC 60, so it is in scope.
- `src/state/campaignStore.ts:73` `remainingDowntimeSec` is a production export used only by tests; `sync` repeats the rule inline (`entry.recoverAtT !== null && t >= entry.recoverAtT`). Behaviour matches today; the two copies could drift. Suggest `sync` call the helper, or note the helper exists to express AC 72.
- RA-017 `it.each` (AC 72) calls `sync(t1)` directly rather than the win and `advanceDays` path; that path is covered only by the AC 73 test via `applyDebrief('m01')`. Acceptable for the formula check.
- `production/sprint-status.yaml` lists `estimate_days: 0.2`; this file says `Estimate: 0.5 d`. Pre-existing mismatch, not changed here.
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts` (RA-017 block, 9 tests). Retained screenshot `production/qa/evidence/ra-017/01-debrief-win-catch-up-injury-30h.jpg`.
**Run result**: OBSERVED — dev server (port 4200) in the in-app browser; store state set from the console (world t 0, squad op1-op3, mission m01, won outcome with op1 HP 0.175) and the Debrief opened. It shows "INJURED // MARA 30H RECOVERY" and "CONTRACT ETA +2 DAYS ELAPSED"; the store read back t = 172800, op1 READY with `recoverAtT` null, squad [op2, op3]. Server stopped; no listener left on 4200. Image: `production/qa/evidence/ra-017/01-debrief-win-catch-up-injury-30h.jpg`.
**Code Review**: Ran (/code-review, this workflow) on `src/state/campaignStore.ts`, `src/ui/index.tsx`, `src/state/campaignStore.test.ts`. Verdict NOT ASSESSED: the lead-programmer, ui-programmer and qa-tester specialist reviews could not be started (no Agent tool in that subagent). The reviewer's own pass found nothing that must be fixed: ADR-0001 COMPLIANT, 87/87 tests pass, `tsc -b` clean. To get an approval, re-run /code-review where agents can be started. Advisory findings are listed under Deviations above.
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, ui-programmer AWS, qa-tester TESTABLE. Fixes: 1a3f655, 0564a8f. Suggestions recorded: remainingDowntimeSec is test-only and sync repeats the rule inline (drift risk); the Debrief 'H RECOVERY' string is covered only by screenshot. This supersedes the NOT ASSESSED result above.
**Gates**: QL-TEST-COVERAGE skipped (lean mode). LP-CODE-REVIEW skipped (lean mode); lean-mode question answered from the workflow: "Yes — /code-review ran" with the NOT ASSESSED result above.
**Unattended decisions**: Phase 7 close option taken by default ("Close the story", recommended) under autonomous mode; tech debt not logged to `docs/tech-debt-register.md`.
