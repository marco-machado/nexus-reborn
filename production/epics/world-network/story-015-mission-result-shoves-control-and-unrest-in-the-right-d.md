# Story 015: Mission result shoves Control and Unrest in the right direction

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-10

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-013` (shove direction); write-back timing is `TR-world-network-004` (Story 003)
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: The debrief is the only boundary that applies sector movement, and it applies it once (ADR-0002).
- Required: `applyDebrief` is the only caller of `worldStore.applyMissionResult`; it runs after `campaignStore.reportMission` and before any win `advanceDays(ETA)` (ADR-0021).
- Required: Apply the outcome at frozen `t0`; catch-up must not run before write-back (ADR-0018).
- Required: Read `won`, `quietReplay` and `civiliansHit` from the outcome DTO; World Network does not compute collateral and does not read `deadIds` / `survivorHp` (GDD §Outcome DTO).
- Forbidden: Writing sector effects anywhere but `applyMissionResult`.
- Forbidden: Any UI component calling `applyMissionResult` for a Debrief result (ADR-0021).
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a non-quiet win and sector Control C (not at an unnamed cap), WHEN World Network applies, THEN Control > C.
- [ ] GIVEN a non-quiet loss and sector Control C (not at an unnamed floor), WHEN World Network applies, THEN Control < C.
- [ ] GIVEN two otherwise identical non-quiet wins, `civiliansHit = 0` vs N > 0 (not at the unrest clamp), WHEN World Network applies, THEN Unrest after N is greater than after 0.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Assert direction only; magnitudes are unnamed in GDD §5. Do not copy code numbers into tests as requirements and do not promote the silent 4–96 Control range.
- Applied only through `worldStore.applyMissionResult` at frozen `t0`.
- Performance: no performance impact expected — one store write per debrief at frozen `t0`, outside the frame loop; no per-frame React state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 016: city holder.
- Story 005: quiet replay does not shove.

---

## QA Test Cases

**Test file path**: `src/state/worldStore.test.ts`

**What to test**:
- A non-quiet win, Control not at the unnamed cap, leaves Control greater than it was.
- A non-quiet loss, Control not at the unnamed floor, leaves Control less than it was.
- Two otherwise identical non-quiet wins, `civiliansHit = 0` versus `N > 0`, not at the unrest clamp: Unrest after N is greater than Unrest after 0.

**Edge cases to cover**:
- Magnitudes are unnamed in §5. Assert direction only. Do not copy code-only deltas into the test as expected integers.
- The cap and floor cases are excluded by the criteria. Do not invent the unnamed bounds.
- A quiet-replay win does no direct Control, Unrest, or ownership shove. That case is Story 005, not this story.

*No formula in the Formulas section. Dirty-win net Unrest versus pre-mission U is unnamed. Do not assert it.*

**Estimated test count**: ~3 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — 3 tests in `src/state/worldStore.test.ts`, passing

---

## Dependencies

- Depends on: Story 003
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-10
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None in this story. Advisory, pre-existing: tests at `src/state/worldStore.test.ts:537` and `:637` assert exact Control/Unrest deltas, against GDD §5's direction-only guidance — logged as TD-010.
**Test Evidence**: Logic: test file at `src/state/worldStore.test.ts` (3 direction-only tests; suite 91/91 passing)
**Code Review**: Complete — /code-review APPROVED WITH SUGGESTIONS; `midEu(): void` return type applied
