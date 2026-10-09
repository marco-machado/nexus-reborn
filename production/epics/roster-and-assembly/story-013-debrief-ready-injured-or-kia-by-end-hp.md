# Story 013: Debrief classifies survivors as Ready, Injured, or KIA

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Forbidden: a Tactical-side apply guard or key (Tactical echoes the key it was given).
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** a living survivor with `f = 0.35`, **WHEN** debrief applies, **THEN** that operative stays Ready and `injuryRecoverySec` is not invoked. *(GDD AC 18)*
- [ ] **GIVEN** a living survivor with `0 < f < 0.35`, **WHEN** debrief applies at `t0`, **THEN** they are Injured, their Squad bay is empty, they cannot be assigned, and `D = injuryRecoverySec(f)`. *(GDD AC 19)*
- [ ] **GIVEN** end HP = 0, **WHEN** debrief applies, **THEN** the operative is KIA not Injured, `injuryRecoverySec` is not invoked, and `survivorHp` lists survivors only. *(GDD AC 20)*
- [ ] **GIVEN** one operative id listed as both dead and injured on an outcome, **WHEN** debrief applies, **THEN** that id is KIA only. *(GDD AC 76)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Roster writes happen in `reportMission` inside the single apply-once Debrief transaction (ADR-0021 `applyDebrief`).
- `f = 0.35` stays Ready; `0 < f < 0.35` → Injured with `D = injuryRecoverySec(f)` and bay cleared; end HP 0 → KIA; an id in both dead and injured is KIA only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 014: KIA removal effects.
- Story 017: ETA catch-up of injuries.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 012
- Unlocks: Story 014, Story 015, Story 016, Story 017, Story 018, Story 019
