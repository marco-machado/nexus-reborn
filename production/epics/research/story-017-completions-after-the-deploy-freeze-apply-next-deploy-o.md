# Story 017: Completions after the deploy freeze apply next deploy only

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Reading live `researchStore` from the running mission.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN a mission already created, WHEN later research completes or a pin changes, THEN that mission's weapons, crew bonuses and Research slice are unchanged.
- [ ] GIVEN a mission created while Neural Interface I is active (so absent from that create's Roster resolved wear and appliedIds), WHEN it later becomes researched before that mission ends, THEN those frozen Roster fields still omit it. (Do not use the Research slice as proof: a slotted project is absent there regardless of timing.)

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Effects are sampled at deploy; the running mission must not read live stores after the copy.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 016: what is frozen.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/world.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 016
- Unlocks: None
