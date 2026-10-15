# Story 013: Telemetry opt-in default and no network egress

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: `fetch`, `sendBeacon`, WebSocket, cookies, or an analytics SDK in `telemetry.ts` or Balance export.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN a new origin (no settings blob) and a finished mission with telemetry never enabled, WHEN Settings is opened, THEN telemetry is off, the log is empty, and no Balance entry point is present on Settings or Debrief.
- [x] GIVEN telemetry on with at least one record, WHEN the toggle is turned off, THEN the records remain, a Balance entry point is present, and Export and Clear work. WHEN Clear is confirmed, THEN the Balance entry point is gone.
- [x] GIVEN telemetry on or off, WHEN Debrief apply, Abort, Balance view, Export, or Clear runs, THEN no telemetry network request is emitted. UI click / SFX fetches are out of scope.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Settings boolean `telemetry` defaults false; off makes `recordMissionOutcome` / `recordAbort` no-ops but keeps existing records. The Balance entry point shows only while records exist.
- UI click / SFX fetches are out of scope for the egress check.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/telemetry.test.ts`.
- New origin: telemetry off, log empty, no Balance entry point
- Toggle off keeps records; Balance, Export, Clear work; Clear removes the entry point
- No network request from Debrief, Abort, Balance, Export or Clear
- Edge: Spy `fetch`/`sendBeacon`/`XMLHttpRequest` in the test

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/telemetry.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/telemetry.test.ts` (describes "telemetry opt-in default (PV-013 AC1)", "toggle off keeps the log (PV-013 AC2)", "no network egress (PV-013 AC3)")

---

## Dependencies

- Depends on: None
- Unlocks: Story 014, Story 015, Story 016

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing, each covered by an automated test in `src/state/telemetry.test.ts` (19/19 in the file pass under vitest, run during /story-done; the /code-review run reported 45 files, 1106 tests passing).
**Deviations**: None. ADR-0015 COMPLIANT: no `fetch`, `sendBeacon`, XHR, WebSocket or cookie calls in `src/state/telemetry.ts` or `src/ui/balanceGate.ts` (grep, re-run during /story-done); the log is still not a Zustand store.
**Scope**: `src/ui/balanceGate.ts` (new), `src/ui/Settings.tsx`, `src/ui/index.tsx` (Debrief) and `src/state/telemetry.ts` were touched. The story lists no file set; these are the Settings and Debrief entry points AC1/AC2 name, so they are in scope.
**Test Evidence**: Logic: `src/state/telemetry.test.ts`.
**Run result**: OBSERVED — retained in `production/qa/evidence/pv-013/` (dev server on port 4200, headless Chromium 1280x720, fresh context; server stopped, no listener on 4200 afterwards):
- `01-new-origin-telemetry-off-no-balance-row-1280x720.png`: new origin, Settings DATA section shows TELEMETRY: LOCAL ONLY OFF and no BALANCE DATA row; `nexus-telemetry-v1` absent.
- `02-telemetry-off-one-record-balance-row-1280x720.png`: one seeded record, telemetry still OFF, BALANCE DATA row with OPEN is present.
- `04-after-clear-no-balance-row-1280x720.png`: after Balance CLEAR then CONFIRM // ERASE RECORDS? then CLOSE, the BALANCE DATA row is gone; blob holds `{"version":1,"records":[]}`.
- No request left `http://localhost:4200` during the run. Two 404 console errors were logged for unidentified local resources (the response listener did not attribute them); not telemetry, out of scope.
- The Debrief entry point was not screenshotted; it uses the same `useBalanceEntryVisible` hook as Settings.
**Code Review**: Complete, with a caveat. /code-review returned "Verdict: NOT ASSESSED": the lead-programmer, ui-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the unattended run). The manual review found no defects; tests pass, `tsc -b` and eslint on the changed files print nothing; ADR-0015 COMPLIANT. Lean-mode prompt answered "Yes — /code-review passed or was approved with suggestions" (autonomous default).
**Advisory findings from /code-review**:
- Process: Phase 7 specialist reviews did not run. Option [A], re-run /code-review where specialists can be spawned, remains open.
- Test coverage of AC1/AC2: the Settings and Debrief entry point is checked through the pure `balanceEntryVisible` and a source regex on `balanceGate.ts`; no component test renders Settings.tsx or Debrief. Adequate for a Logic story; a component test would close the gap if UI regressions matter.
- `src/ui/balanceGate.ts` / `src/state/telemetry.ts:144-155`: the revision moves only on in-tab `saveRecords` / `clearRecords`; a write from another tab (`storage` event) does not refresh the gate until the next local write. ADR does not require multi-tab behaviour; low impact.
- `src/state/telemetry.ts:153`: the revision bumps on every save attempt, including injected test storage and failed writes; only effect is a redundant localStorage re-read. Harmless and commented.
- Standards: `useBalanceEntryVisible` has a file header comment but no JSDoc; pre-existing `loadRecords` / `saveRecords` / `clearRecords` use `//` comments, not doc comments. Minor.
- The story file's Test Evidence status and AC checkboxes were stale at review time; updated here.
- Scope note from the review: the relayed user request (GDD-sourced third AC on PV-008, PV-009, PV-017, then commit) was not part of this review or of /story-done; the orchestrator should confirm it separately.
**Gates**: QL-TEST-COVERAGE skipped (Lean mode). Manifest version matches (2026-10-08).
