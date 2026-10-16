# Story 013: Loss conditions; abort emits no outcome DTO

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-010`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0015: Telemetry never leaves the machine; ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: A mission is memory only; Tactical emits `MissionResult` echoing `deploy.economy.applyKey`.
- Forbidden: Never a Tactical-side apply guard or key; `src/game` has no value import of `telemetry.ts` and no `recordAbort` call.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **17.** **GIVEN** a live mission, **WHEN** (a) no living operatives remain, or (b) a required escort VIP dies, or (c) a required objective timer expires, **THEN** the result is Loss.
- [ ] **18.** **GIVEN** a mission in progress, **WHEN** Abort is confirmed, **THEN** there is no debrief, Tactical emits no outcome DTO, Credits / roster / sectors / labs are unchanged, and the result is not Loss. **GIVEN** abort telemetry enabled, **THEN** at most a thin telemetry record is appended and that record is not a campaign write. **GIVEN** telemetry disabled, **THEN** no telemetry record.
- [ ] **R5-a.** *(GDD Edge Case: same-step tiebreak.)* **GIVEN** a live mission, **WHEN** the last operative dies in the same step that the last required objective completes, **THEN** the result is Win, and the dead still grade KIA at debrief. A required VIP death or required time-limit expiry in that same step is still Loss.
- [ ] **R5-b.** *(GDD Edge Case: If Loss.)* **GIVEN** a mission that ends in Loss, **WHEN** Tactical emits the outcome, **THEN** it emits the outcome DTO with `won=false`, `civiliansHit`, and the ids of the completed optional objectives.
- [ ] **R5-c.** *(GDD Edge Case: optional timer.)* **GIVEN** a live mission with an optional objective on a time limit, **WHEN** that timer expires, **THEN** only that optional fails, the result is not Loss, and the required sequence is not gated.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Abort discards the mission with no debrief and no outcome; Credits, roster, sectors, labs unchanged.
- Abort telemetry (when enabled) is at most a thin, local, non-campaign record written outside `src/game/`.
- Same-step wipe vs required-complete tiebreak (TR-tactical-012) is resolved in the living spec; do not retune it here.
- Performance: no performance impact expected — loss and abort are mission-end events, not per-frame work; abort emits nothing and writes no campaign state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: Win conditions.
- Story 014: quiet replay outcome.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-013 — Loss conditions; abort emits no outcome DTO (Integration)
**Test file**: `src/game/world.test.ts`, `src/state/appStore.test.ts`
**What to test**:
- AC 17: Loss on (a) wipe, (b) required VIP death, (c) required timer expiry — one test each, reading `won === false`
- AC 18: Abort → no outcome DTO, no Debrief phase, Credits / roster / sectors / labs unchanged, not a Loss; telemetry on → at most one thin record, not a campaign write; telemetry off → none
**Extra criteria (R-5)** (promoted to acceptance criteria R5-a onward, 2026-10-16): same-step wipe and required completion → Win (GDD tiebreak); Loss still emits `civiliansHit` and completed optional ids; optional timer expiry fails only that optional
**Mutation check**: let abort call the outcome emitter → AC 18 fails
**Estimated test count**: ~6

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/world.test.ts`, `src/state/appStore.test.ts`, `src/state/telemetry.test.ts` — must exist and pass, OR a playtest doc.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 012
- Unlocks: Story 014
