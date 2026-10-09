# Story 004: Abort leaves the World Network blob unchanged; deploy gets a frozen WN slice

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-008`, `TR-world-network-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: One combined Snapshot DTO or an umbrella `SnapshotDTO` type.
- Forbidden: A silent live-store fallback inside `createWorld`.
- Forbidden: Mid-mission persistence or resume.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a mission in progress and World Network blob B (`t`, sectors, owners, Influence, intelLevel, intelProgress, events, spends, nextTaxT), WHEN Abort is confirmed, THEN there is no debrief and those fields still equal B.
- [ ] GIVEN deploy confirmed, WHEN the Tactical mission is created, THEN it receives the frozen WN slice `{sector id, Control, Unrest}` and no live World Network store handle. (Do not call this slice “the Snapshot DTO”.)
- [ ] GIVEN the running mission, WHEN it needs World Network data, THEN it reads only the cloned slice — `createWorld` does not read `worldStore`, `campaignStore` or `researchStore`.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Clone four plain-data slices (World Network, Economy, Research, Roster) onto `DeployParams` at mission create. Copy means clone (`array.slice`, copy small records); do not `Object.freeze()` live `getState()` arrays or hold live references.
- `DeployParams` requires `wn`, `economy`, `research`, `roster`; keeps `mods` and `district`; deletes `loadout`.
- `createWorld` has no silent live-store / `getState()` fallback for the four slices.
- A mission in progress is memory only — abort discards it, no mid-mission resume, no campaign write. Abort never marks `unfiled`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: debrief apply-once.
- Roster / Research slices belong to their own epics.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts` (no store reads), `src/state/missionStore.test.ts` (abort leaves a deep-equal WN blob). — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 003
