# Story 006: Debrief applies once in session memory

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: a durable campaign write at Debrief.
- Forbidden: per-owner last-applied keys or a UI-side apply guard.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN snapshot S on a Screen, then a finished mission whose Debrief has applied in this session, WHEN the origin is reloaded while still on Debrief, THEN Continue restores S, not the invoice mutations.
- [x] GIVEN a Debrief that has already applied payout, sector, Intel, Influence, and roster, WHEN Debrief stays open, THEN those campaign values do not change again, and telemetry (if on) still has exactly one record for that outcome.
- [x] GIVEN a Debrief that has applied in this session, WHEN Debrief stays open for any length of time, THEN the stored campaign blob is unchanged from S (Debrief does not autosave); the first durable write is the next Screen's. (GDD Edge Cases: "If the director is on Debrief".)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `applyDebrief` is the only apply path, gated by `outcome.applyKey > lastAppliedKey` (ADR-0021); a still-open Debrief never re-applies.
- Reload while on Debrief restores S; the invoice mutations were never durable (accepted escape, living spec §19 #8). Telemetry records once inside `applyDebrief`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: the next-Screen durable commit.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Integration.*

**Automated**: `src/state/save.test.ts`, `src/state/appStore.test.ts`.
- Reload on Debrief: Continue restores S, not the invoice
- Debrief open: values do not change again; telemetry has one record
- Blob unchanged while Debrief is open

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/appStore.test.ts`, `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` › `Debrief applies once in session memory` (3 tests, one per AC; 66/66 passing in this file). Implementation pre-existed in `src/state/debrief.ts` (`applyDebrief` key gate) and `src/state/save.ts` (`scheduleAutosave` debrief suspend); story was test-only.

---

## Dependencies

- Depends on: Story 004
- Unlocks: Story 007, Story 014, Story 017

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (all covered by automated tests; none deferred)
- AC1 — `src/state/save.test.ts` › `Debrief applies once in session memory` › "reload while still on Debrief: Continue restores S, not the invoice mutations" — COVERED
- AC2 — same describe › "Debrief stays open: applied values do not change again and telemetry has exactly one record" — COVERED
- AC3 — same describe › "Debrief open for any length of time: the stored blob is unchanged from S; the next Screen writes first" — COVERED
- Run at /story-done: `npx vitest run src/state/save.test.ts` → 1 file, 66/66 passed.
**Deviations**: None blocking. Implementation matches ADR-0021 (`outcome.applyKey > app.lastAppliedKey`, `src/state/debrief.ts:24`) and ADR-0011 / GDD "Mission and Debrief do not autosave" (phase guard in `scheduleAutosave`, `src/state/save.ts:825`, `:832`). Change is test-only; `src/state/debrief.ts` and `src/state/save.ts` unchanged. Advisory items from /code-review:
- Coverage suggestion (GDD Rule 10/13): AC3's "the first durable write is the next Screen's" is tested only on the World Network return path (`returnFromDebrief`). The GDD names Brief Replay as the other next-Screen commit; a Replay-path case would close that, though AC3 as written does not require it.
- Coverage suggestion (GDD Rule 17): the AC1 reload test does not assert that the telemetry row survives the campaign rollback. Adding `expect(loadRecords(browser)).toHaveLength(1)` after the reload would pin it.
- Test seam: `finishAndApplyDebrief` in `src/state/save.test.ts` mints the key by hand (`deploySerial + 1` via setState), then calls `freezeDeploy` and a hand-built `settleOutcome` payload, standing in for the MissionScreen composer (the only key minter per ADR-0021 §1). Acceptable for a state-layer integration test; the real composer path is not exercised.
- Bookkeeping: QA Test Cases / Test Evidence list `src/state/appStore.test.ts` as well, but only `src/state/save.test.ts` gained tests; all three ACs are covered there. `production/sprint-status.yaml` has `estimate_days: 0.2` while this header says 1.0 d — not reconciled here (owner to pick one).
- Manifest version 2026-10-08 matches the current control manifest.
**Test Evidence**: Integration: `src/state/save.test.ts` › `Debrief applies once in session memory` (3 tests)
**Run result**: N/A — store/persistence logic with no new visible surface; covered by integration tests (from the /dev-story checkpoint)
**Code Review**: Ran — /code-review verdict NOT ASSESSED: the specialist reviews (lead-programmer, qa-tester) could not be spawned (no Agent tool in the workflow subagent). The reviewer found no code defects: ADR Compliance COMPLIANT (ADR-0011, ADR-0021, ADR-0002), Architecture CLEAN, SOLID COMPLIANT, no Required Changes (would otherwise be APPROVED WITH SUGGESTIONS). `npx tsc -b` and `npx eslint src/state/save.test.ts` clean. Re-run /code-review from a context that can spawn agents if a specialist sign-off is required.
**Story-done decisions (autonomous)**: Phase 5 lean code-review prompt answered with the /code-review result above; Phase 7 took the default "Close the story (Recommended)". QL-TEST-COVERAGE skipped — Lean mode.
