# Story 015: Experience award and deploy sampling

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create; the running mission never reads live stores.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** S living survivors and K KIA at debrief, **WHEN** the outcome is applied once, **THEN** each survivor’s Experience increases by exactly 1 and each KIA is awarded 0. *(GDD AC 25)*
- [ ] **GIVEN** Experience awarded at debrief, **WHEN** the next mission is created, **THEN** that Experience is sampled into that deploy; later awards do not change an on-ground squad. *(GDD AC 26)*
- [ ] **GIVEN** an operative with deployment max HP `H0` and 1 Experience awarded at the prior debrief, **WHEN** the next mission is created, **THEN** `operative_mass` computes the plating term from `H0 + 2` and the sampled speed includes +0.05 m/s (magnitudes per living spec §6 — not restated here). *(GDD AC 44)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- +1 Experience per living survivor, 0 for KIA, once per apply.
- Experience is sampled into the Roster slice at create (`maxHp` / `speed` final values); `createWorld` does not re-run `xpBonus`. Magnitudes per living spec §6 (`src/game/experience.ts`).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 020: other freeze fields.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/experience.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013, Story 001
- Unlocks: Story 018, Story 020
