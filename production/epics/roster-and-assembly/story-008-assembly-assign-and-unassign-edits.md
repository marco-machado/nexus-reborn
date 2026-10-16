# Story 008: Assembly assign and unassign edits

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a squad with at least one assigned operative, **WHEN** a dossier is focused without an assign/unassign action, **THEN** the assigned set is unchanged. *(GDD AC 5)*
- [x] **GIVEN** exactly 1 assigned operative, **WHEN** unassign of that operative is requested, **THEN** the unassign is refused and that operative remains assigned. *(GDD AC 6)*
- [x] **GIVEN** Assembly editing, **WHEN** assign would exceed 4, assign the same operative twice, assign Injured, or assign KIA, **THEN** that assign is refused. *(GDD AC 75)*
- [x] **GIVEN** X is KIA, **WHEN** assign X is requested, **THEN** assignment is refused. *(GDD AC 17)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Inspection ≠ assignment: focusing a dossier never toggles the squad.
- `toggleOperative` will not empty the last assigned bay — an edit constraint, not a post-KIA invariant.
- Refuse assign beyond 4, a duplicate, Injured, or KIA (absent from roster).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009: no auto-assign on open; Injured dossier presentation.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: new `src/game/assembly.test.ts` (if the rule is extracted) or `src/state/campaignStore.test.ts`
**What to test**:
- Focusing a dossier does not change the assigned set (AC 1)
- Unassigning the only assigned operative is refused; they stay assigned (AC 2)
- Assign refused when it would exceed 4, duplicate, Injured, or KIA (AC 3)
- KIA X assign refused (AC 4)

**Edge cases to cover**: unassign with 2 assigned succeeds; assign into an empty bay after a KIA wipe succeeds for a Ready operative.
**Estimated test count**: ~6 unit tests
*Source change probable — see finding 1.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, "Assembly assign and unassign edits (RA-008)" (8 tests)

---

## Dependencies

- Depends on: Story 006
- Unlocks: Story 009

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 4/4 passing (none deferred)
- GDD AC 5 (focus leaves squad unchanged): `src/state/campaignStore.test.ts` › `Assembly assign and unassign edits (RA-008)` › "focusing a dossier without an assign action leaves the assigned set unchanged (AC 5)". COVERED. This is a proxy: focus is TeamSelect-local `useState` (`src/ui/index.tsx`), so the test checks only that no store write happens.
- GDD AC 6 (last operative unassign refused): "refuses to unassign the only assigned operative, who stays assigned (AC 6)". COVERED. Edge case: "unassigns one of two assigned operatives".
- GDD AC 75 (exceed 4 / duplicate / Injured / KIA refused): "refuses an assign that would exceed four", "never assigns the same operative twice", "refuses to assign an Injured operative", "refuses to assign a KIA operative (AC 17, AC 75)". COVERED.
- GDD AC 17 (KIA assign refused): "refuses to assign a KIA operative (AC 17, AC 75)". COVERED. Edge case: "assigns a Ready operative into an empty bay after a KIA wipe".
**Deviations**: None. This story is tests only. `toggleOperative` (`src/state/appStore.ts:235-244`) already enforced every rule (last-bay refusal, READY-only, `MAX_SQUAD` cap, toggle so duplicates are impossible), so the QA plan's "Source change probable" note did not apply. Manifest version 2026-10-08 matches the current control manifest. ADR-0019 forbidden patterns are not touched. The only file changed outside the story file and sprint status is the stated test file.
**Test Evidence**: Logic: `src/state/campaignStore.test.ts` is present. `npx vitest run src/state/campaignStore.test.ts` at /story-done: 49/49 passed.
**Run result**: N/A. Test-only story: no source or screen changed (from the /dev-story checkpoint).
**Code Review**: Complete. /code-review ran in the implement-stories workflow and returned NOT ASSESSED, because the specialist reviews (lead-programmer, qa-tester) could not be spawned: the unattended run has no Agent tool. Its own review found nothing that must change: ADR-0019 COMPLIANT, 8/8 RA-008 tests pass, `tsc -b` and eslint clean. With the specialist step waived, the verdict would be APPROVED WITH SUGGESTIONS. The lean-mode prompt was answered with the workflow default (review ran). QL-TEST-COVERAGE skipped: Lean mode.
**Specialist Code Review (2026-10-16)**: APPROVED WITH SUGGESTIONS. Specialists spawned from the main session: lead-programmer AWS, qa-tester GAPS (advisory only; first pass CHANGES REQUIRED / BLOCKING: AC 5 test could not fail). Fixes: f6a1d1a (assemblyRowHandlers + test); in-app click-through 2026-10-16, evidence production/qa/evidence/ra-008/. Suggestions recorded: no unit test pins which handler index.tsx binds to each control; covered by the click-through. This supersedes the NOT ASSESSED result above.
**Advisory findings (from /code-review)**:
- Review process: lead-programmer and qa-tester were not spawned, so the verdict is NOT ASSESSED rather than APPROVED. This is not a code defect. Re-run with Agent access, or accept the self-review.
- `src/state/campaignStore.test.ts:670` ("never assigns the same operative twice"): `toggleOperative` is a toggle, so the three calls are assign, unassign, reassign. The test does not check a refused duplicate assign. A duplicate cannot happen by construction (`appStore.ts:237` checks `squad.includes` first), so AC 75 holds. Clearer options: seed a squad, assign op6 once and assert it appears once, or add a comment that duplicates are structurally impossible.
- `src/state/campaignStore.test.ts:640` (AC 5 focus test): the test never touches the real focus path, which is TeamSelect-local `useState` (`src/ui/index.tsx:1013`, `setFocusId` at 1170/1247). The `/focus/i` key regex is a weak, fragile proxy: an unrelated future key such as `focusMode` would fail it. Drop it, or replace it with a UI test in story 009.
- `src/state/campaignStore.test.ts:663` (exceed-four) and `:687` (KIA): neither test asserts its precondition, for example that op6 is READY. Both pass for the right reason today, because op6 is READY in the seed data. A one-line precondition `expect` would stop them passing for the wrong reason if the seed changes.
- `src/state/campaignStore.test.ts:695` (KIA-wipe edge case): the squad is emptied by hand with `setState({ squad: [] })`. In the real flow that pruning is done by `applyDebrief` (`src/state/debrief.ts:45-52`). Driving the wipe through `applyDebrief` would test the real empty-bay state.
- Coverage overlap: `src/state/appStore.test.ts:235-262` ("squad selection") already covers the last-operative, Injured and fifth-bay refusals. The RA-008 block repeats them. This is harmless; the blocks could cross-reference each other or be merged.
- The story's AC checkboxes were unchecked and Status was In Progress at review time. Both were updated by this /story-done.
**Decision log (autonomous)**: Lean-mode code-review prompt answered "Yes, /code-review ran" (from the workflow input). Phase 7 took the default close option: "Close the story — update file, mark Complete, log notes (Recommended)". No tech-debt rows logged.
