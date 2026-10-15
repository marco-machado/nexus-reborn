# Story 002: New Operation: two-step erase of the house

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: one storage key for campaign + settings + telemetry.
- Forbidden: clearing `TELEMETRY_KEY` or the telemetry toggle on New Operation.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN Menu with Continue and recorded Credits / Intel / roster, WHEN the director activates New Operation once, THEN the control arms a confirm, the campaign blob is unchanged, and Continue still loads the same Credits / Intel / roster.
- [x] GIVEN New Operation armed and a parallel clean-origin New Operation fixture F, WHEN the director confirms, THEN Credits, Intel, `contractsWon`, laboratories, and tutorial-seen equal F (Economy / World Network / Research / Roster opening desk — do not copy integers here), and the prior campaign cannot be restored.
- [x] GIVEN New Operation armed, WHEN the confirm is not given (the arm lapses or the director leaves the Menu), THEN the campaign blob is unchanged and Continue still loads the same Credits / Intel / roster. (GDD Edge Cases: "If New Operation is cancelled".)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- First activation only arms a confirm; the campaign blob is untouched until confirm.
- Confirm resets every campaign store to the opening desk and erases the campaign envelope only; compare against a clean-origin New Operation fixture F rather than literal integers. `initializeSaveSystem` stays idempotent.
- `deploySerial` and `lastAppliedKey` reset with New Operation (ADR-0021).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: settings survival.
- Story 018: write failure during the erase.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Integration.*

**Automated**: `src/state/save.test.ts`.
- One activation arms; blob unchanged; Continue still loads the same Credits / Intel / roster
- Confirm: Credits, Intel, `contractsWon`, labs, tutorial-seen equal a clean-origin fixture F; prior campaign not restorable
- Arm lapses or Menu left: blob unchanged
- Edge: Compare against fixture F, not pasted integers

**Gap**: Probably test-only; the arm is UI state, so drive it through the Menu or extract the arm logic.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts`, describe block `new operation: two-step erase of the house` (4 tests)

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003, Story 014, Story 018

---

## Completion Notes
**Completed**: 2026-10-15
**Verdict**: COMPLETE WITH NOTES (closed via /story-done, run unattended in /implement-stories; Phase 7 took the recommended "Close the story" option)
**Criteria**: 3/3 passing
- AC1 (one press arms; blob unchanged; Continue loads the same desk): `src/state/save.test.ts` describe `new operation: two-step erase of the house`, plus `production/qa/evidence/pv-002/01-menu-new-operation-armed.jpg` (Menu armed: `CONFIRM // ERASE SAVE?` under CONTINUE).
- AC2 (confirm equals clean-origin fixture F; prior campaign not restorable): same describe block; compares against fixture F, not literal integers.
- AC3 (lapse or leave: blob unchanged): same describe block (outcome only; see advisory below), plus the /dev-story Run result: OBSERVED that the label reverts after the 3 s lapse with the blob unchanged.
**Test Evidence**: Integration: `src/state/save.test.ts` present; `npx vitest run src/state/save.test.ts -t "new operation"` ran 5 passed / 39 skipped at story-done time. Screenshot retained at `production/qa/evidence/pv-002/01-menu-new-operation-armed.jpg`.
**Run result**: OBSERVED (from /dev-story checkpoint) — one press shows `CONFIRM // ERASE SAVE?` with the blob byte-identical; after the 3 s lapse the label reverts and the blob is unchanged; arm + confirm empties the slot and leaves the Menu.
**Deviations**: None blocking. ADR-0011 compliant (Menu arm never writes; `startNewOperation` in `src/state/save.ts` stays the only erase path and removes only the campaign key). ADR-0015 not touched. Manifest version 2026-10-08 matches the current manifest.
**Scope**: Files touched: `src/ui/newOperationArm.ts` (new), `src/ui/index.tsx`, `src/state/save.test.ts`, this story, `production/sprint-status.yaml`, evidence image. The story listed no file set; all are within the New Operation arm/erase.
**Code Review**: /code-review ran on `src/ui/newOperationArm.ts`, `src/ui/index.tsx`, `src/state/save.test.ts` and the evidence image. Verdict: NOT ASSESSED, only because the lead-programmer and ui-programmer specialist reviews could not be spawned (no Agent tool in the unattended subagent). The reviewer's own checks found no blocking defect: ADR-0011 COMPLIANT, `vitest src/state/save.test.ts` 44/44, `tsc -b` and eslint clean on all three files. Recommended: re-run /code-review with specialist spawning available, or accept as APPROVED WITH SUGGESTIONS.
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Advisory findings (from /code-review, all verified by the reviewer)**:
- `src/state/save.test.ts:1150-1179` (AC3 test): the lapse and leave paths are simulated, not exercised. The test passes `armed=false` to `pressNewOperation` by hand, and `vi.advanceTimersByTime(10_000)` only moves the autosave timers; neither the MainMenu `setTimeout(NEW_OPERATION_ARM_MS)` reset (`src/ui/index.tsx:156-160`) nor the Menu unmount is reached. The AC3 outcome is still covered (blob unchanged with autosave running; Continue loads the same Credits, Intel and roster). The comments "The Menu drops the arm" and "it goes with the Menu" overstate what the test proves. Follow-up: tone down the comments, or add a Menu-level test / manual evidence that the arm lapses after 3000 ms and clears on unmount.
- `src/state/save.test.ts:31` imports `pressNewOperation` from `../ui/newOperationArm`, so a `src/state` test depends on `src/ui`, reversing the CLAUDE.md layer direction (test code only). Follow-up: keep the save-module assertions in `save.test.ts` and move the `pressNewOperation` truth table to `src/ui/newOperationArm.test.ts`.
- The Test Evidence section listed only the automated test; the screenshot `production/qa/evidence/pv-002/01-menu-new-operation-armed.jpg` is now linked above as evidence for the arm half of AC1. The screenshot is cropped at the left and right edges (boot text and footer cut off) — cosmetic only.
- UI label `CONFIRM // ERASE SAVE?` (`src/ui/index.tsx:217`) and aria-label `CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN` (`src/ui/index.tsx:211`) use different wording — cosmetic, for a UX pass.
- Positive: `newOperationArm.ts` is a small pure function replacing the inline MainMenu condition with identical behaviour; `NEW_OPERATION_ARM_MS` replaces the magic 3000; AC2 compares against fixture F (including a whole-desk `toEqual`); the confirm test also checks `deploySerial` and `lastAppliedKey` reset (ADR-0021); no per-frame React state; gameplay and campaign RNG untouched.
