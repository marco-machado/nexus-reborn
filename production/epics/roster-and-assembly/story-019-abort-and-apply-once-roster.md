# Story 019: Abort writes no roster; debrief applies roster once

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
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
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** a mission in progress and living roster R, **WHEN** Abort is confirmed, **THEN** there is no debrief and roster state is still R. *(GDD AC 12)*
- [ ] **GIVEN** a debrief that already applied the outcome DTO once, **WHEN** the same outcome is applied again, **THEN** those roster writes occur only once. *(GDD AC 13)*
- [ ] **GIVEN** a deployed mission, **WHEN** tactical time advances, **THEN** living roster, Injured remaining downtime, and the candidate market are unchanged until debrief or Abort. *(GDD AC 14)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Abort discards the mission and writes nothing. Tactical time never touches roster, downtime, or market.
- Roster writes sit inside the single `applyDebrief` transaction guarded by the deploy-minted apply-once key (ADR-0021); no Tactical-side guard.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013
- Unlocks: None
