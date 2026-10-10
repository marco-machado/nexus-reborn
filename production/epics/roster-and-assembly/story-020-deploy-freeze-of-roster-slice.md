# Story 020: Deploy freeze of the Roster slice

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
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
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** a mission already created (wear, unslotted research, Experience, item pools, mass, and mass tier sampled), **WHEN** wear, pins, items, assignment, or Experience later change on campaign, **THEN** the on-ground squad keeps the sampled freeze. *(GDD AC 11)*
- [ ] **GIVEN** mission created with sampled med-kit pool M and power-cell pool C, **WHEN** Assembly item slots later change, **THEN** snapshot pools remain M and C. *(GDD AC 45)*
- [ ] **GIVEN** an assigned operative with one med kit and one power cell in Item slots, **WHEN** the mission is created, **THEN** the sampled mission pools are base + role grants + 1 med kit + 1 power cell from those slots. *(GDD AC 49)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- The composer clones stores once at create into the Roster slice: ids, resolved wear, ordered `appliedIds`, `items`, `massKg`/`massTier`, sampled `maxHp`/`speed`.
- `roster.items` feeds `loadoutPools` only; pools = base + role grants + slot items.
- `createWorld` never reads `campaignStore`/`researchStore`; Research slice carries unslotted ids only (research epic Story 016).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic Story 016: Research slice contents.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/world.test.ts`, `src/game/missionParams.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002, Story 015
- Unlocks: None
