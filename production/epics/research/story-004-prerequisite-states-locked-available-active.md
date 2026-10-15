# Story 004: Prerequisite states: locked, available, active

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Marking a project locked because its lab is busy.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Advanced Propellants is not researched, WHEN states are read, THEN Hypervelocity Core is locked.
- [x] GIVEN Advanced Propellants becomes researched (Hypervelocity Core's only prerequisite), WHEN that completion applies, THEN Hypervelocity Core is available and not active, and completion does not call `addCredits`.
- [x] GIVEN Ballistics running Advanced Propellants and Barrel Wear Coating's prerequisites met, WHEN states are read, THEN Barrel Wear Coating stays available.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- State is derived from `done`, the active runs and the catalog prerequisites; lab occupancy does not make a project locked.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: refusal text.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/researchStore.test.ts`.
- Hypervelocity Core locked while Advanced Propellants unresearched
- After Advanced Propellants completes via `sync`: Hypervelocity Core available, not active; no `addCredits`
- Barrel Wear Coating stays available while Ballistics runs Advanced Propellants
- Edge: A node with two prerequisites stays locked with one done

**Gap (closed 2026-10-14)**: `nodeState` is now tested under `describe('nodeState')` in `src/state/researchStore.test.ts`; the change was test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/researchStore.test.ts`, `describe('nodeState')` (5 tests; file passes 20/20 under `vitest run`, 2026-10-14). No `src/game/research.test.ts` change was needed: `nodeState` lives in `src/state/researchStore.ts`.

---

## Dependencies

- Depends on: None
- Unlocks: Story 005

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by automated tests; none deferred)
**Deviations**: None. Advisory notes:
- TR-research-002's current registry text ("Ballistics is unslotted and squad-wide; slotted bays wear one blueprint; effects sample at deploy") does not describe prerequisite states; the story's ACs come from `design/gdd/research.md`. Owner follow-up: point the story at the TR that covers node states, or extend the registry entry.
- `docs/architecture/adr-0005-blueprint-assignment.md` has no `## Decision` or `## Consequences` heading (headings: Status, Date, Engine Compatibility, ADR Dependencies, GDD Requirements Addressed), so the ADR constraints check had nothing to read. It does not cover node states and this change touches only tests, so there is no drift. Owner follow-up: bring the ADR up to the template.
- Manifest version matches (2026-10-08). Scope: only `src/state/researchStore.test.ts` changed in code; the forbidden pattern (locking a project because its lab is busy) is covered by the Barrel Wear Coating test.
**Test Evidence**: Logic: `src/state/researchStore.test.ts` (`describe('nodeState')`); `vitest run src/state/researchStore.test.ts` passed 20/20 when /story-done ran on 2026-10-14.
**Run result**: N/A — logic-only selector test; nothing new on screen (from the /dev-story checkpoint).
**Code Review**: Ran (/code-review, lean mode). Verdict NOT ASSESSED: the lead-programmer and qa-tester specialist reviews could not be started because the unattended workflow subagent had no Agent tool. The reviewer's own pass found no defects and no required changes (`vitest` 20/20, `tsc -b` and `eslint` clean on the test file). Advisory suggestions:
- `src/state/researchStore.test.ts:185`: `vi.spyOn(useAppStore.getState(), 'addCredits')` spies on the state object current at that moment; if the store state object is replaced before sync, the spy would miss calls. The credits-unchanged assertion covers this (low risk). Consider asserting only on credits, or spying on the store's `setState`.
- `src/state/researchStore.test.ts:164`: `stateOf(node: typeof hyper)` could take `ResearchNode` from `../game/research`. Line 190 `not.toBe('active')` is redundant after `toBe('available')`; kept because the AC is worded that way.
- ADR-0005 does not match the ADR template (see Deviations).
- Story file checkboxes, Test Evidence status and QA gap note were stale; updated by this /story-done.
**Process notes (unattended run)**: Phase 7 close prompt took the recommended option "Close the story"; QL-TEST-COVERAGE skipped (lean mode).
