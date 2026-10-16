# Story 021: Augmentation bay wear resolution

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints  
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: more than one worn project per bay.
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** any operative, **WHEN** augmentation bays are listed, **THEN** there are 4 bays and each bay wears at most 1 completed slotted project that belongs to that bay. *(GDD AC 35)*
- [x] **GIVEN** unpinned bays (including a new hire), **WHEN** wear is resolved, **THEN** each unpinned bay wears current issue. *(GDD AC 36)*
- [x] **GIVEN** a bay pinned to stock issue or an older completed project, **WHEN** a new same-bay project completes, **THEN** the pinned bay is unchanged and unpinned bays wear current issue. *(GDD AC 37)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Four bays, at most one completed slotted project each, belonging to that bay. Unpinned wears current issue; a pinned bay keeps its pin when a new same-bay project completes.
- Resolution reuses `appliedNodeIds(done, pins)`; covered from the Research side by research epic Stories 013–015 — this story asserts the Roster-side view, do not duplicate the function.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic Stories 014–015: `appliedNodeIds` and pin edges.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`, `src/state/researchStore.test.ts`
**What to test**:
- 4 bays; each wears ≤ 1 completed slotted project of that bay (AC 1)
- Unpinned bays (incl. new hire) wear current issue (AC 2)
- Pinned bay unchanged when a new same-bay project completes; unpinned bays update (AC 3)

**Edge cases to cover**: pin to stock issue vs pin to an older project; program stays researched.
**Estimated test count**: ~3 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, describe "augmentation bay wear resolution (RA-021)" (3 tests). `src/game/research.test.ts` / `src/state/researchStore.test.ts` not touched: resolution is covered by research Stories 013-015 (see Implementation Notes).

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (none deferred)

| Criterion | Test | Status |
|-----------|------|--------|
| AC 35: 4 bays, each wears at most 1 completed project of that bay | `src/state/campaignStore.test.ts` :: "lists 4 bays per operative, each wearing at most 1 completed project of that bay (AC 35)" | COVERED |
| AC 36: unpinned bays (incl. new hire) wear current issue | `src/state/campaignStore.test.ts` :: "unpinned bays, including a new hire, wear current issue (AC 36)" | COVERED |
| AC 37: pinned bay unchanged on new same-bay completion; unpinned bays update | `src/state/campaignStore.test.ts` :: "a new same-bay completion leaves pinned bays alone and moves unpinned ones (AC 37)" | COVERED |

**Deviations**: None. Scope: only `src/state/campaignStore.test.ts` changed (plus story and sprint-status bookkeeping); `appliedNodeIds`/`wornAugs` reused, not duplicated. Advisory: `docs/architecture/adr-0005-blueprint-assignment.md` has no `## Decision` / `## Consequences` sections, so the ADR constraints check used the story's ADR Decision Summary and the control manifest rules (one worn project per bay; no worn ids on the Research slice). Manifest version 2026-10-08 matches the current manifest.
**Test Evidence**: Logic: `src/state/campaignStore.test.ts` (describe "augmentation bay wear resolution (RA-021)"). `npx vitest run src/state/campaignStore.test.ts` passed 99/99 at close (2026-10-16).
**Run result**: N/A — Logic story; tests-only Roster-side view of existing wear resolution, no surface changed (from the /dev-story checkpoint).
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Code Review**: Complete — `/code-review` on `src/state/campaignStore.test.ts` returned "Verdict: NOT ASSESSED" solely because the lead-programmer and qa-tester specialist reviews could not run (no Agent tool in that subagent). Its own review found no blocking code defects; ADR-0005 COMPLIANT; tests 99/99. Recorded as a tooling gap, not a design decision. Lean-mode prompt answered in autonomous mode as "Yes — /code-review passed or was approved with suggestions" (closest option; formal approval pending a re-run from a session that can spawn agents).
**Specialist Code Review (2026-10-16)**: APPROVED. Specialists spawned from the main session: lead-programmer APPROVED, qa-tester TESTABLE. Fixes: 0564a8f. Suggestions recorded: AC 36 compares most bays against currentIssue(); the hire's literal ids carry the check. This supersedes the NOT ASSESSED result above.
**Advisory findings (from /code-review)**:
- Process gap: Phase 7 lead-programmer and qa-tester reviews not run (no Agent tool). Re-run `/code-review` from a session that can spawn agents if a formal APPROVED is needed.
- `src/state/campaignStore.test.ts:1518` — `expect(AUG_SLOTS).toHaveLength(4)` sits inside the per-operative loop and checks a constant. Assert once with the bays result (e.g. `expect(bays).toHaveLength(4)`).
- `src/state/campaignStore.test.ts:1481-1486` — the RA-021 describe resets `useResearchStore` in `beforeEach` with no `afterEach`; the file-level `beforeEach` (line 61) resets only `useCampaignStore`. No leak today (last describe in the file); consider a file-level research-store reset.
- Story Test Evidence and AC checkboxes were stale — flipped by this /story-done. The QA plan's `src/state/researchStore.test.ts` is intentionally untouched per Implementation Notes.
**Autonomous decisions**: Phase 5 lean code-review prompt → "Yes — passed/approved with suggestions" (see above); Phase 7 → "Close the story (Recommended)".
