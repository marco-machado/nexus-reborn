# Story 012: Equal-endT house order within a bay

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
- Forbidden: Authorize-order append.
- Forbidden: Changing the sort.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Neural Cache Array (cybernetics) and Adaptive Command AI (control) as injected active runs set directly via the store fixture (not produced by production authorize), both with the same startedT = S and endT = S + 14 × 3600, with authorize order listing Adaptive Command AI first, WHEN sync(t = S + 50400) runs, THEN done appends Neural Cache Array before Adaptive Command AI and currentIssue(Neural) is Adaptive Command AI by house order.
- [x] GIVEN Neural Interface I and Sensor Fusion Array both active, both authorized at t = 0 (endT = 7200), with Sensor Fusion Array (control, later BRANCH_IDS) authorized first, WHEN sync(7200) runs and currentIssue(Neural) is read, THEN done appends Neural Interface I before Sensor Fusion Array and currentIssue(Neural) is Sensor Fusion Array by house order.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- An equal `endT` is not latest; a later timer is current issue even if its lab sorts after the earlier timer. House order applies only among same-bay completions.
- The tie non-issue counts as an older completed project and is pinnable (GDD §7). Naming the winner on the assembly dossier is an unsatisfied downstream obligation — do not add current-issue controls here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: ascending endT.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/researchStore.test.ts`; `src/game/research.test.ts`.
- Injected runs Neural Cache Array and Adaptive Command AI at the same endT: done appends Neural Cache Array first; currentIssue(Neural) = Adaptive Command AI
- Neural Interface I and Sensor Fusion Array at endT 7200, Sensor Fusion Array authorized first: done appends Neural Interface I first; currentIssue(Neural) = Sensor Fusion Array
- Edge: Fixture runs set directly on the store, not via production authorize (as the AC says)

**Gap**: **Source change** only if RS-011's tie-break does not already give house order.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/researchStore.test.ts`, `src/game/research.test.ts` (vitest: 2 files, 76 tests passed, 2026-10-14)

---

## Dependencies

- Depends on: Story 011
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 2/2 passing (none deferred)
- AC1: `src/state/researchStore.test.ts`, "injected Neural Cache Array and Adaptive Command AI" test. It injects runs through setState (startedT=S, endT=S+14h), calls sync(S+50400), and asserts done=['c-cache','k-adaptive'] and currentIssue(NEURAL)=k-adaptive. COVERED.
- AC2: `src/state/researchStore.test.ts`, "Sensor Fusion Array authorized first" test. It asserts both endT=7200, done=['c-interface','k-sensor'] and currentIssue=k-sensor. COVERED.
**Deviations**: None. No source change was needed because RS-011's stable sort over the BRANCH_IDS scan (`src/state/researchStore.ts`) already gives house order, as the story's QA Gap note expected. The forbidden patterns "Authorize-order append" and "Changing the sort" were not introduced. ADR-0005 COMPLIANT. Manifest version 2026-10-08 matches the current manifest.
**Test Evidence**: Logic: `src/state/researchStore.test.ts`, `src/game/research.test.ts`. The `npx vitest run` on both files gave 76/76 passed.
**Run result**: N/A. This is store/sim ordering logic only and no visible surface changed (from the /dev-story checkpoint).
**Code Review**: Ran but did not pass. Lean mode answer: "Yes, /code-review ran". The result was "Verdict: NOT ASSESSED". The lead-programmer and qa-tester specialists could not be spawned (no Agent tool in the unattended subagent), so the skill could not approve. Every other section passed: no Required Changes, ADR-0005 COMPLIANT, tests pass. The reviewer judged it would have been APPROVED WITH SUGGESTIONS. The default option is "[A] Fix what stopped the review, then re-run /code-review" where agents can be spawned.
**QA gate**: QL-TEST-COVERAGE skipped (Lean mode).
**Advisory findings (from /code-review)**:
- Process: the Phase 7 specialist reviews did not run. The equivalent checks were done inline: sync() in `src/state/researchStore.ts`, and currentIssue/wornNode in `src/game/research.ts`.
- `src/state/researchStore.test.ts` (AC1 fixture comment): "The key order records the authorize order" overstates what the fixture does. sync() walks BRANCH_IDS, not Object.keys(labs), so key order cannot change the result. Reword the comment. The AC2 test covers real authorize order.
- `src/state/researchStore.test.ts` (AC2 test): optionally assert `s.labs` equals `idle()` after sync(7200), to match the AC1 test.
- `src/game/research.test.ts` (new installedAugs case): good. It pins the BRANCH_IDS precondition (cybernetics before control) and checks that the tie non-issue stays pinnable through wornNode with pin {NEURAL:'c-interface'}.
- ADR-0005 has no `## Decision`/`## Consequences` headings. Its decision is in the preamble, and the review checked against that.
**Unattended run decisions**: Phase 5 lean-mode prompt answered with "Yes — /code-review ran" (result recorded above). Phase 7 took the default "Close the story (Recommended)" because the verdict is COMPLETE WITH NOTES.
