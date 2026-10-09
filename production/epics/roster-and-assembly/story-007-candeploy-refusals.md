# Story 007: canDeploy refusals: no contract, none assigned, not Ready

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
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

- [ ] **GIVEN** Assembly is reachable with no selected contract, **WHEN** Deploy is requested, **THEN** Deploy is refused. *(GDD AC 8)*
- [ ] **GIVEN** a selected contract and 0 assigned operatives, **WHEN** Deploy is requested, **THEN** Deploy is refused. *(GDD AC 9)*
- [ ] **GIVEN** a selected contract and an assignment set containing an Injured operative — reachable only by direct state construction or save drift, since Injured cannot be assigned through Assembly — **WHEN** Deploy is requested, **THEN** Deploy is refused (defensive invariant). *(GDD AC 10)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Split refusal reasons `none-assigned` vs `not-ready` so a post-KIA empty squad does not show the injured refusal (ADR-0019).
- The Injured-in-squad case is a defensive invariant reachable only by direct state construction or save drift; test it by constructing state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: mass refusal.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — src/game/deployGate.test.ts (beside the extracted gate), `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 006
- Unlocks: None
