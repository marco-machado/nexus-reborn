# Story 016: Deploy sampling: Research slice is unslotted ids only

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-004`, `TR-research-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Reconstructing `appliedIds` in `createWorld` from unslotted ∪ wear.
- Forbidden: A silent live-store fallback.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Advanced Propellants researched and two operatives assigned, WHEN a mission is created, THEN both appliedNodeIds include Advanced Propellants.
- [ ] GIVEN Neural Interface I researched and two operatives Neural-unpinned, WHEN a mission is created, THEN both wear Neural Interface I (same id).
- [ ] GIVEN Advanced Propellants researched, Neural Interface I worn, Chest STOCK, WHEN a mission is created, THEN the Research slice has unslotted ids only (Advanced Propellants) and no pin-map field; Neural Interface I is on the Roster slice as resolved wear / appliedIds.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Research slice = completed unslotted ids only. `createWorld` does not read `researchStore`, never unions Research unslotted with Roster wear, never calls `appliedNodeIds` or `missionMods`.
- Clone, don't hold live `done` / roster references.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 017: freeze after create.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 014
- Unlocks: Story 017
