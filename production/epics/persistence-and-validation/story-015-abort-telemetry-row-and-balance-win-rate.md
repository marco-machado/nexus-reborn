# Story 015: Abort telemetry row and Balance win rate

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0015: Telemetry never leaves the machine  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: aborts in the win-rate denominator.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN telemetry on, snapshot S, WHEN Abort from pause, THEN campaign still equals S; abort count increases by 1; that row is `aborted` plus duration, mission id, seed, deployed roles — not a full combat invoice.
- [x] GIVEN telemetry records: 2 won, 1 lost, 3 aborted, WHEN Balance is opened, THEN win rate is 2 / (2 + 1); abort count is 3; aborts are not in the win-rate denominator.
- [x] GIVEN telemetry records: 0 won, 2 lost, WHEN Balance is opened, THEN win rate is 0.0.
- [x] GIVEN telemetry records: 0 won, 0 lost, 3 aborted, WHEN Balance is opened, THEN abort count is 3 and the win-rate slot shows the no-data marker; no 0, NaN, or Infinity appears anywhere in Balance.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Abort row: `aborted` + duration, mission id, seed, deployed roles — no combat invoice; the campaign stays S.
- Win rate = won / (won + lost); when the denominator is 0 Balance shows a no-data marker (copy is Interface), never 0, NaN, or Infinity. `abort_rate` is GDD Open Question 4 — do not invent it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/telemetry.test.ts`.
- Abort: campaign = S; abort count +1; row is `aborted` + duration, mission id, seed, roles
- 2 won, 1 lost, 3 aborted: win rate 2/3, abort count 3
- 0 won, 2 lost: win rate 0.0
- 0 won, 0 lost, 3 aborted: no-data marker; no 0, NaN or Infinity in Balance
- Edge: `win_rate = won / (won + lost)`, aborts excluded (GDD Formulas)

**Gap**: **Source change.** With 0 won + 0 lost Balance shows `0%`; the GDD and AC4 require a no-data marker.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/telemetry.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/telemetry.test.ts` describe "abort telemetry row and Balance win rate (PV-015)" (7 tests; 1118/1118 suite pass under vitest, 2026-10-15). Balance look: `production/qa/evidence/story-015-abort-telemetry-row-and-balance-win-rate/01-balance-abort-only-no-data.jpg`

---

## Dependencies

- Depends on: Story 013
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (no deferred items)
- AC1: `src/state/telemetry.test.ts` › "AC1: Abort from pause with telemetry on leaves the campaign at S and appends one thin aborted row" — COVERED
- AC2: `src/state/telemetry.test.ts` › "AC2: 2 won, 1 lost, 3 aborted: win rate 2 / (2 + 1), abort count 3" (+ "formula: win_rate = won / (won + lost)…") — COVERED
- AC3: `src/state/telemetry.test.ts` › "AC3: 0 won, 2 lost: win rate is 0.0" — COVERED
- AC4: `src/state/telemetry.test.ts` › two "AC4: …" tests + `production/qa/evidence/story-015-abort-telemetry-row-and-balance-win-rate/01-balance-abort-only-no-data.jpg` (opened: MISSIONS 3, ABORTS 3, every other stat `--`, no 0/NaN/Infinity) — COVERED
**Deviations**: None blocking. Advisory:
- GDD line 126 ("abort count and abort rate sit beside win rate… Alias the name") vs. removal of the ABORT RATE row and `BalanceAggregate.abortRate`. Removal matches the GDD Forbidden rule (line 74, "inventing an `abort_rate` denominator") and Open Question 4. Whether a named, unvalued `abort_rate` slot should still appear is an open design question for the owner, not a defect.
- ADR-0015 Key Interfaces text still says "`aggregate.abortRate` in code is not a GDD rule"; that field no longer exists. Doc touch-up suggested; not an ADR violation.
**Test Evidence**: Logic: `src/state/telemetry.test.ts` (describe "abort telemetry row and Balance win rate (PV-015)", 7 tests). Re-run at story-done: `npx vitest run src/state/telemetry.test.ts` 31/31 pass. Full-suite "1118/1118" claim not re-verified at story-done. Run result: OBSERVED — screenshot above.
**Code Review**: Complete — /code-review ran in this workflow on src/state/telemetry.ts, src/ui/balanceStats.ts, src/ui/Balance.tsx, src/state/telemetry.test.ts and the evidence JPG. Verdict: NOT ASSESSED (specialist reviews lead-programmer, ui-programmer, qa-tester could not be spawned: no Agent tool in that subagent). Inline review found nothing that must change: ADR-0015 and ADR-0002 COMPLIANT, `tsc -b` and eslint clean, telemetry tests 31/31. Re-run /code-review where specialists can be spawned to get an assessed verdict. (Lean-mode prompt answered unattended with this result.)
**Advisory findings from /code-review**:
- Pre-existing: `loadRecords` (src/state/telemetry.ts ~line 126) checks only `missionId` and `outcome`; a tampered/partial won or lost row without `durationSec` or `payout` would make `aggregate` produce NaN for mean duration/payout, shown in Balance. The new `FinishedRecord`/`AbortRecord` split makes a per-shape guard easy to add later.
- Standards: exported `balanceStatRows` (src/ui/balanceStats.ts) has a file header but no doc comment; ~60 lines, mostly row data (data excluded from the 40-line limit).
- Cleanup: OPERATIVES KIA and TOTAL FINES tone uses `agg.kiaTotal > 0` / `agg.totalFines > 0` rather than the `decided` check used for the value; gating the tone on `decided` would make it explicit (both totals are 0 when nothing is decided, so `--` never renders red today).
- Evidence screenshot was taken at ~800px wide: the panel is cut off on the right ("LOCAL ONLY // 3/60 REC…") and a horizontal scrollbar shows. AC4 stats are fully visible. Whether this overflow predates the story is unverified; worth a check against the no-horizontal-scroll expectation.
- Positive: `MissionRecord` union makes the thin abort row a type-level guarantee; `recordAbort` copies `squadRoles`; `balanceStatRows` makes the zero-denominator rule testable without a DOM; legacy abort rows with zeroed combat fields are covered by a test.
**Gates skipped**: QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW: lean-mode prompt (see Code Review).
**Autonomous decisions**: Phase 7 "Close the story (Recommended)" taken unattended (verdict COMPLETE WITH NOTES).
