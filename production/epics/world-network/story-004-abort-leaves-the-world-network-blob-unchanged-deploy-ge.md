# Story 004: Abort leaves the World Network blob unchanged; deploy gets a frozen WN slice

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-10

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

- [x] GIVEN a mission in progress and World Network blob B (`t`, sectors, owners, Influence, intelLevel, intelProgress, events, spends, nextTaxT), WHEN Abort is confirmed, THEN there is no debrief and those fields still equal B.
- [x] GIVEN deploy confirmed, WHEN the Tactical mission is created, THEN it receives the frozen WN slice `{sector id, Control, Unrest}` and no live World Network store handle. (Do not call this slice “the Snapshot DTO”.)
- [x] GIVEN the running mission, WHEN it needs World Network data, THEN it reads only the cloned slice — `createWorld` does not read `worldStore`, `campaignStore` or `researchStore`.

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

**Test file path**: `src/state/missionStore.test.ts` (abort leaves a deep-equal World Network blob); `src/game/missionParams.test.ts` (frozen slice); `src/game/world.test.ts` (`createWorld` reads no stores)

**What to test**:
- Confirmed Abort produces no debrief. Blob B is unchanged: `t`, sectors, owners, Influence, intelLevel, intelProgress, events, spends, `nextTaxT`.
- Confirmed deploy gives the tactical mission only `{sector id, Control, Unrest}` and no live World Network store handle. Do not name that slice the Snapshot DTO.
- The running mission reads the cloned slice. `createWorld` does not read `worldStore`, `campaignStore`, or `researchStore`.

**Edge cases to cover**:
- Abort writes nothing to those fields.
- No silent `getState()` fallback inside `createWorld` for the deploy slices.
- Intel is not a World Network deploy-slice field. The slice stays sector id, Control, Unrest.

*No formula in the Formulas section. Test cases come from the acceptance criteria.*

**Estimated test count**: ~5 integration tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/missionParams.test.ts`, `src/game/world.test.ts` (no store reads), `src/state/missionStore.test.ts` (abort leaves a deep-equal WN blob). — must exist and pass.

**Status**: [x] Created and passing (2026-10-10)

---

## Dependencies

- Depends on: None
- Unlocks: Story 003

---

## Completion Notes
**Completed**: 2026-10-10
**Criteria**: 3/3 passing (all covered by integration tests; no deferred items)
- AC-1 abort leaves WN blob B unchanged, no debrief — `src/state/missionStore.test.ts` › "abort leaves the World Network blob unchanged"
- AC-2 deploy receives frozen `{sector, control, unrest}`, no live store handle — `src/game/missionParams.test.ts` › "deploy freeze: World Network slice"
- AC-3 `createWorld` reads none of worldStore / campaignStore / researchStore — `src/game/world.test.ts` › "deploy freeze: createWorld reads no strategy store" (getState spies, create through outcome)
**Deviations**: None against TR-world-network-008/009 or ADR-0009/0002. `src/game/world.ts` still writes `missionStore` / `appStore` (HUD sync and outcome), which the ADR permits.
**Scope**: Extra files touched beyond the story list, all supporting the `DeployParams` change: `src/game/experience.ts`, `src/game/mass.ts`, `src/game/contracts.test.ts`, `tools/city-review.tsx`, `docs/agents/mission-runtime.md`. New: `src/game/deploy.ts`, `src/state/deployFreeze.ts`.
**Test Evidence**: Integration: tests at `src/state/missionStore.test.ts`, `src/game/missionParams.test.ts`, `src/game/world.test.ts`. `npm run lint`, `npm run test` (39 files, 632 tests) and `npm run build` all passed 2026-10-10.
**Run result**: NOT VERIFIED — unattended run; no browser click-through of deploy → mission → Abort (docs/click-through.md). Advisory: do one before sprint close-out.
**Code Review**: Pending — lean mode; closed unattended, default "run /code-review before the sprint close-out" recorded.
