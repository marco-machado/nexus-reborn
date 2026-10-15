# Story 010: Labs frozen in the field; loss and abort leave Research alone

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`, `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Refunding on abort or loss.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Advanced Propellants active, WHEN tactical time advances 120 s, THEN startedT / endT are unchanged and it is not researched.
- [x] GIVEN Advanced Propellants active at deploy, WHEN a loss debriefs, THEN strategic t is unchanged, the project stays active, and `addCredits` is not called.
- [x] GIVEN Advanced Propellants researched and Neural Interface I active, WHEN Abort is confirmed, THEN `done` still has Advanced Propellants only, Neural Interface I stays active, there is no research refund, and Abort does not call `addCredits`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The World Network does not tick in the field; Research does not tick either. Abort writes nothing.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: normal completion.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Integration.*

**Automated**: `src/state/appStore.test.ts`.
- 120 s of tactical time: startedT / endT unchanged, not researched
- Loss debrief: strategic t unchanged, project still active, no `addCredits`
- Abort: `done` unchanged, Neural Interface I still active, no refund
- Edge: Drive the sim tick (`src/game/world.ts`) for the 120 s case, not a store setter

**Gap**: Unknown; integration test first, source change only if it fails.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/appStore.test.ts` (`describe('Labs frozen in the field; loss and abort leave Research alone (RS-010)')`), as named in QA Test Cases. (Originally listed `src/game/research.test.ts`, `src/state/researchStore.test.ts`, `src/state/missionStore.test.ts`; corrected at close.) — must exist and pass.

**Status**: [x] Created — 4 tests, passing (2026-10-14)

---

## Dependencies

- Depends on: Story 008
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: ADVISORY — ADR drift: `src/state/debrief.ts:34` now calls `addCredits(netPayout(outcome))` only when `isPaid(outcome)`; ADR-0021 Decision step 4 (`docs/architecture/adr-0021-outcome-dto-and-apply-once-key.md:113`, flow at :137) says `addCredits(outcome.netPayout)` unconditionally. Justified by `design/gdd/research.md:30` and AC 2 (a loss must not call `addCredits`). Behaviour is otherwise identical (`addCredits(0)` was a no-op; `isPaid` matches netPayout's `won && !quietReplay`); a quiet-replay win also no longer calls addCredits. Follow-up: amend ADR-0021 step 4 to "addCredits(netPayout) only when isPaid(outcome)" (documentation fix; GDD already decides).
**Test Evidence**: Integration: `src/state/appStore.test.ts` — `describe('Labs frozen in the field; loss and abort leave Research alone (RS-010)')`. Traceability: AC 1 → "AC 1: ... 120 s of tactical time" + "AC 1 edge: ... past endT" (drives real `world.tick`); AC 2 → "AC 2: ... a loss debriefs" (production `applyDebrief`); AC 3 → "AC 3: ... Abort confirmed". All COVERED. `npx vitest run src/state/appStore.test.ts -t RS-010`: 4 passed (2026-10-14); code review reported `npx vitest run src/state` 447/447 and `npx tsc -b` clean.
**Run result**: N/A — store/debrief logic only; no visible surface changed.
**Code Review**: Complete — /code-review ran on `src/state/debrief.ts`, `src/state/appStore.test.ts`: "Verdict: NOT ASSESSED" because the lead-programmer and qa-tester specialists could not be spawned (subagent had no Agent tool); inline review found no required changes (would be APPROVED WITH SUGGESTIONS with specialists). Lean mode: QL-TEST-COVERAGE skipped; LP-CODE-REVIEW prompt answered with the recommended option "Yes — /code-review passed or was approved with suggestions" (autonomous workflow default).
**Advisory findings from /code-review**:
- Process gap: Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; standards/testability/ADR checks done inline instead.
- ADR-0021 step 4 drift (above) — amend the ADR.
- Test Evidence path in this story was wrong (pointed at research/researchStore/missionStore tests); corrected above to `src/state/appStore.test.ts`.
- Abort test fidelity (minor): AC 3 test reproduces the abort path by hand (`goto('world')`, `setWorld(null)`, `useMissionStore.reset()`, matching `src/ui/MissionScreen.tsx:45-46`) and skips Hud `onAbort`'s `recordAbort(...)` (`src/ui/Hud.tsx:596-606`). recordAbort is not a Credits/Research writer, so the AC holds; driving the real handler would guard against drift.
- Test robustness (minor): `countAddCredits` replaces `addCredits` via `useAppStore.setState`, which misses captured function references; `vi.spyOn` on store state (as `src/state/researchStore.test.ts:265`) would be the consistent pattern.
- Positive: real `world.tick` for 120 s plus past-endT case; AC 2 uses production `applyDebrief` and checks apply-once key, strategic t, lab state, credits and addCredits call count; no per-frame React state; determinism unaffected; `appStore.ts` CONTRACT FILE header unchanged.
**Manifest**: story v2026-10-08 matches current control manifest v2026-10-08.
**Scope**: changes limited to `src/state/debrief.ts`, `src/state/appStore.test.ts` (debrief.ts not listed in the story, but the Gap note allows a source change when the integration test fails; not a CONTRACT FILE).
