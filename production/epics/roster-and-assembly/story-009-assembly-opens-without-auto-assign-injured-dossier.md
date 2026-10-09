# Story 009: Assembly opens without auto-assign; Injured dossier is inspect-only

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: UI
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** all 4 Squad bays empty after KIA or new injury and at least 1 Ready still on Roster, **WHEN** Assembly is opened, **THEN** all 4 bays stay empty (no auto-assign). *(GDD AC 7)*
- [ ] **GIVEN** an Injured dossier, **WHEN** it is focused, **THEN** inspection is allowed and assign is refused. *(GDD AC 23)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- A kill or new injury may empty all four bays; opening Assembly must not refill them.
- Injured dossier focus is allowed; its assign control is refused.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: store-level assign rules.
- Interface epic owns Assembly layout.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched (Assembly), in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008
- Unlocks: None
