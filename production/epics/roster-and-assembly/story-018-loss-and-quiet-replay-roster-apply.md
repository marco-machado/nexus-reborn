# Story 018: Loss and quiet-replay debrief roster apply

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0004: A won contract does not pay twice  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: quiet replay skipping roster writes.
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a quiet-replay win with `deadIds`, living `f` in (0, 0.35), and survivors, **WHEN** debrief applies, **THEN** KIA, injury (bay clear + D), Experience +1 per survivor, and ETA `t1` catch-up all still apply. *(GDD AC 74)*
- [x] **GIVEN** a loss debrief that recorded injury at `t0` with duration D, **WHEN** that debrief finishes, **THEN** no ETA `t1` jump runs and remaining downtime is still D. *(GDD AC 24)*
- [x] **GIVEN** a loss debrief with `deadIds` and survivors, **WHEN** debrief applies at `t0`, **THEN** KIA, injury and Experience +1 per survivor still apply at `t0`. *(GDD Edge Cases: If Loss; added by R-2)*
- [x] **GIVEN** a win (including quiet replay) whose ETA catch-up reaches `t1 ≥ t0 + D` for every injury recorded at that debrief, **WHEN** debrief finishes, **THEN** every such operative is Ready with remaining downtime 0, their Squad bays stay empty, and the injury line still reports the original D in hours. *(GDD Edge Cases: win ETA finishes recovery; added by R-2)*
- [x] **GIVEN** a quiet-replay win, **WHEN** debrief applies, **THEN** roster and ETA catch-up apply and no intel is awarded. *(Persistence GDD rule 10; World Network WN-011; added by R-2)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Quiet replay zeros payout only; KIA, injury, Experience and the ETA catch-up still apply (ADR-0004).
- A loss spends no strategic days: no `t1` jump, downtime stays D.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`
**What to test**:
- Quiet-replay win with `deadIds`, injured survivor, other survivors → KIA, injury (bay clear + D), +1 Experience each, ETA t1 catch-up (AC 1)
- Loss with injury at t0 → no t1 jump; remaining downtime still D (AC 2)

**Proposed criteria for R-2**: loss still applies KIA and Experience at t0; quiet replay awards no intel (already covered by WN-011, cite); a win's ETA ≥ max D clears every injury from that debrief.
**Estimated test count**: ~4 integration tests

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` describe "loss and quiet-replay debrief roster apply (RA-018)" (6 tests incl. it.each); no appStore.test.ts change needed

---

## Dependencies

- Depends on: Story 013, Story 015, Story 017
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 5/5 passing (none deferred) — all covered by `src/state/campaignStore.test.ts` describe "loss and quiet-replay debrief roster apply (RA-018)": AC 74 → "a quiet-replay win still applies KIA, injury, +1 Experience and the t1 catch-up"; AC 24 → "a loss that records injury at t0 runs no t1 jump"; If Loss → "a loss with deadIds and survivors still applies KIA, injury and +1 Experience at t0"; win ETA finishes recovery → it.each (paid win, quiet-replay win); no intel → "a quiet-replay win applies roster and ETA catch-up and awards no intel". `npx vitest run src/state/campaignStore.test.ts -t RA-018`: 6 passed (run 2026-10-16 during /story-done).
**Deviations**: None. GDD rules 8–10, Debrief clock order and Edge Cases (If Loss, win ETA finishes recovery, If quiet replay) match the tested behaviour; ADR-0004 (quiet replay zeros payout only) and ADR-0001 (win spends ETA, loss spends none) hold. Manifest version 2026-10-08 matches current. Scope: test-only change in `src/state/campaignStore.test.ts`; no `src/state/appStore.test.ts` change needed.
**Test Evidence**: Integration: `src/state/campaignStore.test.ts` (6 tests). Run result: N/A — store-level debrief logic, no screen changed (from /dev-story checkpoint).
**Code Review**: Ran — `/code-review` on `src/state/campaignStore.test.ts` returned "Verdict: NOT ASSESSED" because the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the unattended subagent); inline review found no required changes. Lean mode: recorded as "Yes — /code-review ran", with the NOT ASSESSED result noted. Re-run /code-review from a session that can spawn agents if formal approval is needed. QL-TEST-COVERAGE skipped — Lean mode.
**Advisory findings (from /code-review)**:
- Process gap: Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; verdict NOT ASSESSED rather than APPROVED.
- Verified then: `-t RA-018` 6 passed; `npx tsc -b` and `npx eslint src/state/campaignStore.test.ts` exit 0.
- ADR compliance checked against code: `src/state/debrief.ts` gates credits on `isPaid()` and runs `advanceDays(etaDays)` only `if (outcome.won)`; `src/state/campaignStore.ts` reportMission gives intelAward 0 on quietReplay.
- The no-intel test is non-vacuous: a paid win with civiliansHit 0 would award MISSION_INTEL + CLEAN_INTEL.
- Fragile margin: the it.each ETA test relies on m01 etaDays 2 (48 h) and F_DEEP = 0.01 sitting near the 48 h max D; if injury tuning or m01's ETA changes, the `t1 >= T0 + max(D)` precondition could fail. Consider deriving the fraction from the ETA or asserting the precondition with a clearer message.
- Minor coverage gap: the If Loss test does not check that dead operatives' loadout is removed (`useAppStore.getState().loadout.op3/op4`); the quiet-replay KIA test checks it for op4.
