# Story 013: currentIssue by bay

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`, `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Returning a Ballistics project as a bay issue.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Advanced Propellants researched, WHEN currentIssue is read for any bay, THEN Advanced Propellants is not returned (Ballistics is unslotted).
- [x] GIVEN done = [Neural Interface I, Neural Accelerator Mk II], THEN currentIssue(Neural) is Neural Accelerator Mk II; GIVEN done = [Neural Accelerator Mk II, Neural Interface I], THEN Neural Interface I.
- [x] GIVEN empty done, WHEN currentIssue is read for each bay, THEN each is none.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Bays are Neural, Chest, Arms, Legs; current issue is the latest completed project in that bay by `done` order.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 014: wear resolution.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/game/research.test.ts`.
- Advanced Propellants (unslotted) is never a current issue
- [Neural Interface I, Mk II] → Mk II; reversed → Neural Interface I
- Empty done → none in every bay

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/research.test.ts` (describe "currentIssue by bay", 3 tests); 982/982 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 011
- Unlocks: Story 014

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
- AC1 (Advanced Propellants never a bay issue): `src/game/research.test.ts`, "currentIssue by bay" > "never returns an unslotted Ballistics project for any bay". COVERED.
- AC2 (Neural done order): same describe, "issues the later Neural project by done order". COVERED.
- AC3 (empty done, none per bay): same describe, "returns none in every bay for an empty done". COVERED.
**Deviations**: None. Test-only story; `currentIssue` was already implemented in `src/game/research.ts`. The forbidden pattern "Returning a Ballistics project as a bay issue" is asserted against. ADR-0005 COMPLIANT (TR-research-002, TR-research-003). Manifest version 2026-10-08 matches the current manifest. All changes within scope (`src/game/research.test.ts`).
**Test Evidence**: Logic: `src/game/research.test.ts`. `npx vitest run src/game/research.test.ts` gave 45/45 passed at story-done; /code-review reported the full suite 982/982, `tsc -b` and eslint clean.
**Run result**: N/A. Test-only Logic story; no player-visible change (from the /dev-story checkpoint).
**Code Review**: Ran but did not pass. Lean mode answer: "Yes, /code-review ran". The result was "Verdict: NOT ASSESSED". No code defects were found, but the lead-programmer and qa-tester specialists could not be spawned (no Agent tool in the unattended subagent), so the skill could not approve. All 3 ACs covered and passing, ADR-0005 compliant. Re-run /code-review from a context that can spawn agents, or the owner can accept the self-review.
**QA gate**: QL-TEST-COVERAGE skipped (Lean mode).
**Advisory findings (from /code-review)**:
- Process: the Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; the reviewer checked the code inline and found no defects.
- Test overlap: the "issues the later Neural project by done order" and "returns none in every bay for an empty done" tests repeat assertions already in the `installedAugs` describe (the same c-interface/c-accelerator order pair and empty done). Harmless, and they call `currentIssue` directly as the story asks. Consider merging or noting the overlap.
- Coverage width: the Ballistics test checks only `b-propellants`, which is what the AC asks. Iterating `NODES.filter(n => n.branch === 'ballistics')` would enforce the ADR-0005 "Ballistics is unslotted" rule for every Ballistics node.
- Test data: `c-interface` and `c-accelerator` have augSlot 'NEURAL'; `b-propellants` has no augSlot (`src/game/research.ts`). No test passes trivially.
- ADR-0005 has no `## Decision`/`## Consequences` headings; the review read the decision from its summary line and Verification Required row.
- Standards: test-only, pure TypeScript in `src/game/`, no React/three.js imports, no per-frame work, no RNG use. CLAUDE.md layer and determinism guardrails hold.
**Unattended run decisions**: Phase 5 lean-mode prompt answered with "Yes — /code-review ran" (result recorded above). Phase 7 took the default "Close the story (Recommended)" because the verdict is COMPLETE WITH NOTES.
