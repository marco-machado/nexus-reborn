# Story 014: appliedNodeIds for unpinned, stock and pinned bays

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`, `TR-research-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Putting resolved worn ids on the Research slice.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Neural Interface I then Neural Accelerator Mk II researched and Neural unpinned, WHEN appliedNodeIds is computed, THEN the Neural id is Mk II only.
- [x] GIVEN done = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II] and Neural unpinned, THEN [Advanced Propellants, Neural Accelerator Mk II].
- [x] GIVEN the same done and Neural STOCK, THEN [Advanced Propellants] only.
- [x] GIVEN the same done and Neural pinned to Neural Interface I, THEN [Advanced Propellants, Neural Interface I].

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The composer runs `appliedNodeIds(done, pins)` at freeze; resolved wear has one owner — the Roster slice. Pins are roster content, not a research field.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: pin edge cases.
- Story 016: deploy freeze.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/game/research.test.ts`.
- Neural unpinned after Interface I then Mk II → Mk II only
- [Propellants, Interface I, Mk II] unpinned → [Propellants, Mk II]
- Neural STOCK → [Propellants]
- Neural pinned to Interface I → [Propellants, Interface I]
- Edge: Output keeps `done` order
- Edge: All four bays STOCK → unslotted ids only (GDD edge case)

**Gap**: Probably test-only; split into the four AC cases.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/research.test.ts` (describe "appliedNodeIds for unpinned, stock and pinned bays", 6 tests); 988/988 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 013
- Unlocks: Story 015, Story 016

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by unit tests; none deferred)
**Deviations**: None
**Test Evidence**: Logic: `src/game/research.test.ts`, describe "appliedNodeIds for unpinned, stock and pinned bays" (6 tests: AC1-AC4 plus both QA edge cases). `npx vitest run src/game/research.test.ts` 51/51 passing at story-done; full suite 988/988 and `npx tsc -b --noEmit` clean per code review.
**Run result**: N/A — test-only story; `appliedNodeIds` in `src/game/research.ts` already existed and no player-visible surface changed.
**Code Review**: Complete — `/code-review` ran on `src/game/research.test.ts` with verdict NOT ASSESSED: the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in the unattended workflow). The reviewer checked the change directly and found no defects. Lean mode: LP-CODE-REVIEW and QL-TEST-COVERAGE gates skipped.
**Traceability**:

| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: Interface I then Mk II, Neural unpinned → Mk II only | research.test.ts::wears only Mk II in an unpinned Neural bay after Interface I then Mk II | COVERED |
| AC-2: [Propellants, Interface I, Mk II] unpinned → [Propellants, Mk II] | research.test.ts::applies Propellants and Mk II with Neural unpinned | COVERED |
| AC-3: Neural STOCK → [Propellants] | research.test.ts::applies Propellants only with Neural STOCK | COVERED |
| AC-4: Neural pinned to Interface I → [Propellants, Interface I] | research.test.ts::applies Propellants and Interface I with Neural pinned to Interface I | COVERED |

**Advisory findings (from /code-review)**:
- Review gap (process only): Phase 7 specialist reviews did not run (no Agent tool), so the review verdict is NOT ASSESSED rather than APPROVED. Substance checked directly: vitest 988/988, tsc clean.
- Fixture realism (`src/game/research.test.ts:256-300`): the done lists cannot occur in play — `src/game/research.ts:258` has c-accelerator requiring c-reflex, and `:229` has c-reflex requiring c-interface, yet fixtures use done = [b-propellants, c-interface, c-accelerator] without c-reflex, and the order test uses [c-accelerator, b-propellants, c-interface]. This matches AC2-4 verbatim and `appliedNodeIds` does not check prerequisites, so not a bug. Follow-up suggestion: a comment marking the fixtures as deliberately synthetic.
- ADR compliance: COMPLIANT with ADR-0005 (unpinned bays follow current issue; pins hold stock or an older completed project) and ADR-0009 (`appliedNodeIds(done, pins)` returns ids in done order; resolved wear stays off the Research slice). Diff is test-only.
- Coverage: all 4 ACs and both QA edge cases (done order kept; all four bays STOCK → unslotted ids only) map one-to-one to the 6 new tests; edge tests assert each fixture id's augSlot first, so catalog changes fail loudly.
- Bookkeeping: estimate mismatch — `production/sprint-status.yaml` and `production/sprints/sprint-005.md` give 0.1 d; this file's header says 1.0 d. Left both values as-is (the sprint plan's 0.1 d is the sprint's planning figure); owner may align the header.
