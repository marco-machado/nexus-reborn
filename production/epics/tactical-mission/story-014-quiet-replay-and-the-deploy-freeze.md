# Story 014: Quiet replay outcome and the deploy freeze

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-011`, `TR-tactical-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0004: A won contract does not pay twice; ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create; quietReplay is the frozen Economy-slice boolean.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: Four slices on `DeployParams` at create; `quietReplay` on the outcome is the Economy-slice boolean.
- Forbidden: `createWorld` must not read `researchStore`, `campaignStore`, or `worldStore`; never restamp `quietReplay` from live `contractsWon` in `maybeOutcome`, `setOutcome`, or `reportMission` (GDD OQ4 implementation debt).
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **19.** **GIVEN** an already-won authored contract replayed to a finish, **WHEN** the mission ends, **THEN** it is still a real mission that enters debrief; Tactical still emits an outcome DTO with `quietReplay` true (frozen Economy-slice boolean). Economy/World Network zero currencies and sector shoves — do not re-own those zeros here.
- [ ] **20a.** **GIVEN** a created mission with sampled research / wear / Experience, **WHEN** later research completes or wear/pins change, **THEN** on-ground weapons, HP, speed, and the Research slice stay at the sampled freeze.
- [ ] **20b.** **GIVEN** that mission, **WHEN** a weather front hits, **THEN** sight/noise retune and Research is not re-sampled.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Economy / World Network own the zeroed currencies and sector shoves — do not re-own them here.
- A weather front retunes sight/noise without re-sampling Research.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: abort.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013
- Unlocks: None
