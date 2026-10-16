# Story 019: Abort writes no roster; debrief applies roster once

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
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Forbidden: a Tactical-side apply guard or key (Tactical echoes the key it was given).
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a mission in progress and living roster R, **WHEN** Abort is confirmed, **THEN** there is no debrief and roster state is still R. *(GDD AC 12)*
- [x] **GIVEN** a debrief that already applied the outcome DTO once, **WHEN** the same outcome is applied again, **THEN** those roster writes occur only once. *(GDD AC 13)*
- [x] **GIVEN** a deployed mission, **WHEN** tactical time advances, **THEN** living roster, Injured remaining downtime, and the candidate market are unchanged until debrief or Abort. *(GDD AC 14)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Abort discards the mission and writes nothing. Tactical time never touches roster, downtime, or market.
- Roster writes sit inside the single `applyDebrief` transaction guarded by the deploy-minted apply-once key (ADR-0021); no Tactical-side guard.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/appStore.test.ts`, `src/state/save.test.ts`
**What to test**:
- Abort mid-mission → no debrief; roster equals R deep-equal (AC 1)
- Same outcome applied twice → roster writes once (KIA, injury, Experience counts) (AC 2)
- Tactical time advance → roster, Injured remaining downtime and candidate market unchanged until debrief/Abort (AC 3)

**Edge cases to cover**: Abort awards no Experience; apply-once key survives the Screen autosave (ADR-0021).
**Estimated test count**: ~4 integration tests

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts`, describe block "Abort writes no roster; debrief applies roster once (RA-019)" (4 tests); Vitest 1243/1243 passed 2026-10-16

---

## Dependencies

- Depends on: Story 013
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred) — all covered by `src/state/appStore.test.ts` describe "Abort writes no roster; debrief applies roster once (RA-019)": AC 12 → "AC 1: Abort mid-mission opens no debrief and leaves the roster deep-equal to R, no Experience awarded"; AC 13 → "AC 2: the same outcome applied twice writes KIA, injury and Experience once"; AC 14 → "AC 3: Tactical time leaves the living roster, Injured downtime and the market unchanged"; Edge (apply-once key survives Screen autosave) → "Edge: the apply-once key survives the Screen autosave, so a re-apply after it writes nothing". `npx vitest run src/state/appStore.test.ts -t RA-019`: 4 passed (run 2026-10-16 during /story-done).
**Deviations**: None. GDD AC 12/13/14 match the tested behaviour; ADR-0002 (abort writes no roster) and ADR-0021 (`applyDebrief` gated on `applyKey > lastAppliedKey`; autosave blob holds neither deploySerial nor lastAppliedKey) hold. Manifest version 2026-10-08 matches current. Scope: test-only change in `src/state/appStore.test.ts`.
**Story wording mismatch (advisory, not a missing test)**: QA Test Cases list `src/state/save.test.ts` and Required evidence names `src/state/campaignStore.test.ts`, but all RA-019 evidence, the autosave Edge case included, sits in `src/state/appStore.test.ts`. Neither of the other two files carries an RA-019 test.
**Test Evidence**: Integration: `src/state/appStore.test.ts` (4 tests). Run result: N/A — test-only Integration story; behaviour is store state with no new visible surface (from /dev-story checkpoint).
**Code Review**: Ran — `/code-review` on `src/state/appStore.test.ts` returned "Verdict: NOT ASSESSED" because the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the unattended subagent); inline review found nothing that must change; ADR Compliance: COMPLIANT (ADR-0002, ADR-0021). Lean mode: recorded as "Yes — /code-review ran", with the NOT ASSESSED result noted. Re-run /code-review where specialists can be spawned if the full verdict is needed (sprint retro R-1). QL-TEST-COVERAGE skipped — Lean mode.
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, qa-tester TESTABLE (first pass: tests hand-copied the Hud/MissionScreen paths). Fixes: e2a51ab (missionLifecycle.ts), 6b7c1a2; in-app deploy and abort click-through 2026-10-16, evidence production/qa/evidence/ra-019/. Suggestions recorded: name composeMission's return type. This supersedes the NOT ASSESSED result above.
**Advisory findings (from /code-review)**:
- Review gap: Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; verdict NOT ASSESSED rather than APPROVED. No code change needed.
- Verified then: `npx vitest run src/state` 615/615 passed (4 RA-019 tests included); `npx tsc -b` and `npx eslint src/state/appStore.test.ts` printed no errors.
- `deploy()` and `confirmAbort()` in the RA-019 describe copy the MissionScreen composer (`src/ui/MissionScreen.tsx:28-37`, key mint + freezeDeploy + setWorld) and the Hud onAbort/cleanup path (`src/ui/Hud.tsx:596-606`, goto('world')) by hand instead of running them. If either UI path changes, AC 1 and AC 3 can still pass while the real code drifts. Consider pulling the composer step into a shared helper.
- Edge test: `startAutosave` (`src/state/save.ts:863-866`) returns an already-running subscription and then ignores the injected storage. The test assumes no other test left autosave running; passes today, but the dependency is hidden. Assert `blobs` is empty right after `startAutosave`, or stop any leftover autosave first.
- Story wording mismatch on test file paths (recorded above).

