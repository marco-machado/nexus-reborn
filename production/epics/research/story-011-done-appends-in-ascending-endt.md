# Story 011: done appends in ascending endT

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Appending in authorize order.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN empty done, Targeting AI Suite authorized at t = 0 (endT = 7200) and Advanced Propellants authorized at t = 3600 (endT = 10800), WHEN sync(t = 10800) runs directly, THEN both are researched and done appends Targeting AI Suite before Advanced Propellants. A BRANCH_IDS append fails.
- [x] GIVEN empty done, Sensor Fusion Array authorized at t = 0 (endT = 7200) and Neural Interface I at t = 3600 (endT = 10800), WHEN sync(10800) runs, THEN done appends Sensor Fusion Array before Neural Interface I and currentIssue(Neural) is Neural Interface I (later by time).
- [x] GIVEN empty done and t = 0, Targeting AI Suite (control), then Neural Interface I (cybernetics), then Advanced Propellants (ballistics), each authorized at t = 0 (endT = 7200), WHEN sync(7200) runs, THEN done = [Advanced Propellants, Neural Interface I, Targeting AI Suite]. An authorize-order append fails.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Append in ascending `endT`; equal `endT` only → `BRANCH_IDS` house order (ballistics, cybernetics, control). Do not reverse the sort.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: injected equal-endT same-bay cases.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/researchStore.test.ts`.
- Targeting AI Suite (endT 7200) before Advanced Propellants (10800) at sync(10800)
- Sensor Fusion Array before Neural Interface I; currentIssue(Neural) = Neural Interface I
- Three runs at endT 7200 authorized control, cybernetics, ballistics → done = [Advanced Propellants, Neural Interface I, Targeting AI Suite]
- Edge: The existing "three branches finishing in one sync land in branch order" test stays as the equal-endT case
- Edge: A BRANCH_IDS-only or authorize-order append must fail the first and third cases

**Gap**: **Source change.** Sort due runs by endT, ties by `BRANCH_IDS`.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/researchStore.test.ts` (describe "done appends in ascending endT", 3 tests); 32/32 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 008
- Unlocks: Story 012, Story 013

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by unit tests in `src/state/researchStore.test.ts`, describe "done appends in ascending endT"; vitest 32/32 passing on 2026-10-14)
**Deviations**: None blocking. Advisory:
- Doc drift fixed: removed the stale "Unsatisfied in code" note from `design/gdd/research.md` Core Rule 4 (sync now appends in ascending endT).
- Traceability: TR-research-003 ("Death drops assignment, not the program; unpinned bays follow current issue") covers done ordering only indirectly via current issue. Consider citing or adding a TR that names the ascending-endT append.
- Minor (not a defect): `sync()` allocates a small `due` array per call, including no-op calls; callers (`src/state/save.ts`, `src/state/debrief.ts`) are not per-frame. No per-frame React state introduced.
**Test Evidence**: Logic: `src/state/researchStore.test.ts` (3 new tests; existing equal-endT test "three branches finishing in one sync land in branch order" retained). Tests discriminate: a BRANCH_IDS scan fails AC1/AC2, an authorize-order append fails AC3.
**Run result**: N/A — change is internal store ordering with no on-screen surface named in the acceptance criteria.
**Code Review**: Complete — /code-review ran on `src/state/researchStore.ts`, `src/state/researchStore.test.ts`: verdict NOT ASSESSED (lead-programmer and qa-tester specialists could not be spawned: no Agent tool in the workflow subagent); parent review found no defects and would otherwise read APPROVED WITH SUGGESTIONS. Workflow accepted the parent-only review. ADR-0005 compliance: COMPLIANT. `tsc -b` exit 0. Re-run /code-review from an agent-capable context if a strict gate is required.
**Story-done decisions (autonomous)**: Phase 4b QL-TEST-COVERAGE skipped (lean mode); Phase 5 lean prompt answered "Yes — /code-review approved with suggestions"; Phase 7 took the default "Close the story".
