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

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Abort discards the mission with no debrief and no outcome; Credits, roster, sectors, labs unchanged.
- Abort telemetry (when enabled) is at most a thin, local, non-campaign record written outside `src/game/`.
- Same-step wipe vs required-complete tiebreak (TR-tactical-012) is resolved in the living spec; do not retune it here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: Win conditions.
- Story 014: quiet replay outcome.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

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
