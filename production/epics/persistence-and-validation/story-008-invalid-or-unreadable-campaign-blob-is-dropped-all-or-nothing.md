# Story 008: Invalid or unreadable campaign blob is dropped all-or-nothing

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: half-loading a campaign blob.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [x] GIVEN the campaign blob is replaced with non-JSON text via test inject (not a named storage key), WHEN the origin reloads to Menu, THEN Continue is absent and Menu state is invalid/unreadable, distinct from never-started. Copy stays Interface.
- [x] GIVEN the campaign blob is JSON that fails campaign schema, WHEN the origin reloads to Menu, THEN Continue is absent, Screens are not entered, and Menu state is invalid/unreadable, distinct from never-started.
- [x] GIVEN a non-JSON or schema-failing campaign blob, WHEN the origin reloads and the director starts from the Menu, THEN no value from that blob is applied: strategy, roster and laboratories are at the New Operation defaults (no half-load). (GDD Edge Cases: "If the campaign blob is unreadable or invalid".)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Non-JSON or schema-failing blobs yield no campaign: Continue absent, Screens not entered, and the Menu reports invalid/unreadable — distinct from never-started.
- Inject the bad blob via a test harness, not a named storage key. Hydrate drop-alls on non-finite or negative Credits (ADR-0013) rather than clamping.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: flag-combination validation.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Logic.*

**Automated**: `src/state/save.test.ts`.
- Non-JSON blob: Continue absent; state invalid/unreadable, distinct from never-started
- Schema-failing JSON: same, and no Screen entered
- Edge: No half-load: strategy, roster, labs all default

**Gap**: **Source change** (with PV-001): Menu state invalid/unreadable.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/save.test.ts` (4 PV-008 tests; 40/40 in file pass under vitest, 2026-10-15)

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 009, Story 010

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (AC-1, AC-2, AC-3 covered by `src/state/save.test.ts`; AC-1 also observed in the dev server per the /dev-story Run result)
**Deviations**: None blocking. ADR-0011 and ADR-0013 compliant (whole blob validated before hydrate; non-finite or negative Credits drop the blob).
**Test Evidence**: Logic: `src/state/save.test.ts` — present; ran `npx vitest run src/state/save.test.ts`: 40/40 passed.
**Code Review**: Complete — /code-review returned NOT ASSESSED (specialist and qa-tester sub-reviews could not be spawned: no Agent tool in the unattended subagent); the reviewer's own pass found no required changes ("APPROVED WITH SUGGESTIONS" with specialists). Lean mode: answered "Yes — /code-review passed or was approved with suggestions" (workflow default).
**Run result**: OBSERVED — dev server on :4200, non-JSON blob injected and page reloaded: Menu data-save-status="invalid", no Continue, blob removed (no screenshot retained; Logic story).
**Gates skipped**: QL-TEST-COVERAGE skipped — Lean mode.
**Autonomous decisions**: Phase 5 lean code-review prompt answered from the workflow's /code-review result; Phase 7 took "Close the story (Recommended)".

**Advisory findings from /code-review (follow-up recommended):**
- `src/state/save.test.ts` "no half-load" test (~line 1002): the corrupted field (`tutorial.seen`) is the first one `validateSave` checks (`src/state/save.ts:425`) and the first section `hydrateSave` applies, so a section-by-section loader would fail before applying anything and the test cannot catch a half-load. Corrupt a field validated last (a late world or campaign field). AC-3 is met by the code (whole-blob validation before hydrate) but its test is weak.
- Same test: `expectNoHalfLoad` runs after `startNewOperation(storage)`, which resets every store, so those assertions hold regardless of the loader; only the "before New Operation" block discriminates, and it omits the tutorial section.
- "non-JSON blob" test: comment "A clean origin reads differently from the dropped blob" precedes `expect(menuSaveStatus(new MemoryStorage())).toBe('invalid')`, asserting the opposite. `menuSaveStatus` depends on the module-global `droppedAtBoot` flag (`src/state/save.ts:862-868`), intended; rewrite the comment to say the flag is kept until New Operation clears it.
- "schema-failing JSON" test: the loop asserting phase is not world/research/brief/team is redundant after `expect(app.phase).toBe('menu')`; likewise `not.toBe('never-started')` repeats `toBe('invalid')`.
- `src/ui/index.tsx:146-150`: an invalid save is exposed only via `data-save-status` and absent Continue. GDD line 216 suggests a visible invalid-blob reason, but the GDD and AC say "copy stays Interface"; raise with the owner if no Interface/UX story covers it.
- Review process: lead-programmer, ui-programmer and qa-tester sub-reviews were not spawned (no Agent tool); findings above were checked by the reviewer against code and a test run.
