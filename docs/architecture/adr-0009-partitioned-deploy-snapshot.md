# ADR-0009: Partitioned deploy snapshot

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-11
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11

The mission freeze is four named slices copied at create. Resolved wear has one owner: the Roster slice. The sim does not read live stores.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md` |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/engine-reference/web/breaking-changes.md`; `docs/engine-reference/web/deprecated-apis.md`; `docs/technical-preferences.md`; `docs/agents/mission-runtime.md`; `docs/agents/strategy-time-state.md` |
| **Post-Cutoff APIs Used** | None — this decision is a deploy DTO / store boundary, not an engine API |
| **Verification Required** | `createWorld` does not read `researchStore`, `campaignStore`, or `worldStore`. Four required slices exist on `DeployParams` at mission create. Resolved worn slotted ids and per-operative ordered `appliedIds` appear only on the Roster slice. `quietReplay` on the outcome is the Economy-slice boolean, not a live `contractsWon` restamp from `maybeOutcome`, `setOutcome`, or `reportMission`. `createWorld` does not call `missionMods` or `appliedNodeIds`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted — mission is memory-only; freeze exists), ADR-0005 (wear rules), ADR-0004 (`quietReplay` meaning) |
| **Enables** | Deploy DTO stories / `/create-epics` that would otherwise emit two wear schemas |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0002 / 0004 / 0005. Does not wait on the persistence-envelope or renderer/frame-loop ADRs. |

## Context

### Problem Statement

ADR-0002 froze a mission at create and forbade live store handles, but it never named the slices. Research GDD put resolved worn slotted ids on the Research slice; Roster GDD forbade that and put resolved wear on the Roster slice. Tactical already consumed Roster wear + Research unslotted and refused a third cut. Without one owner, later stories can ship two incompatible deploy DTOs.

### Constraints

- `src/game/` remains pure TypeScript (no React, no three.js). After this ADR it also must not **read** Zustand stores. Writes to `missionStore` / `appStore` / tutorial from the sim remain until a later ADR.
- Mission in progress is memory-only (ADR-0002). Abort is absence of an outcome.
- Do not call any one slice “the Snapshot DTO.”
- Do not invent a third wear home.
- Per-frame unit data stays out of React state.
- Do not migrate game clocks (`src/ui/clock.ts`, `missionStore.setClock`) to `THREE.Timer`.

### Requirements

- Name four slices: World Network, Economy, Research, Roster.
- Single owner of resolved worn slotted ids: Roster.
- Research slice is the completed unslotted set only.
- Freeze at mission create; Tactical applies the freeze; later lab completions apply to the next deploy only.
- One non-stacking `DeployParams` bag so extras, loadout, and HP/speed cannot be applied twice.

## Decision

At mission create the mission mount (`MissionScreen`) clones four plain-data slices and passes them into `createWorld` on `DeployParams`. After that copy, the running mission must not read live stores.

Copy means clone (`array.slice`, copy small records). Do not `Object.freeze()` live `getState()` arrays. Do not hold live `done` / `roster` / `loadout` references.

There is no umbrella type named `SnapshotDTO`.

### Four slices

1. **World Network slice (`wn`):** `sector` (`SectorId`); `control`; `unrest` (`SectorState` numbers). Intel is not a field. Risk-index math is Tactical/Brief; World Network only gates Brief display at intel 2+ from live strategy state **before** deploy.
2. **Economy slice (`economy`):** contract `id`; `generated` (boolean; authored is `false`); `reward`; optional bonus defs (`objectives[].bonusReward` of the frozen contract); `etaDays`; `quietReplay` sampled from authored `contractsWon` at create (**boolean, never `undefined`**). Tactical counts; Economy prices. Do not restamp `quietReplay` from live `contractsWon` in `maybeOutcome`, `setOutcome`, or `reportMission`.
3. **Research slice (`research`):** completed **unslotted** node ids only (Ballistics), preserving `researchStore.done` order, filtered. Pins are not fields of this slice. Completions after this freeze do not rewrite it.
4. **Roster slice (`roster`):** `ids` (assigned operative ids, 1–4); **resolved wear** per assigned operative (at most one slotted project id per `AugSlot`: `NEURAL` / `CHEST` / `ARMS` / `LEGS` — node ids, not `BayPins`; empty bay = omitted key); per-assigned ordered **`appliedIds`** (the result of `appliedNodeIds(done, pins)` at freeze, `done` order); `items` (`SquadLoadout` of the assigned); `massKg` + `massTier`; final sampled `maxHp` / `speed` per assigned operative (body + unslotted + worn slotted + Experience; mass-tier already in `speed`). Do not put worn ids on the Research slice.

### Apply path (single consumption rule)

The composer (outside `src/game/`) clones stores once and runs the existing pure `appliedNodeIds(done, pins)` **at freeze**. It stores:

- resolved wear ids on the Roster slice (ownership proof);
- that same function’s ordered `appliedIds` per assigned operative on the Roster slice;
- sampled `maxHp` / `speed` and `massKg` / `massTier` on the Roster slice.

`createWorld` iterates `operatives`, indexes roster maps by `op.id`, copies `roster.maxHp` / `roster.speed` onto units, and uses each operative’s Roster `appliedIds` for `squadWeapon` / weapon sampling. It does not re-run `crewBonus`, `xpBonus`, `tierSpeedDelta`, or `squadMassKg`. `roster.items` feeds `loadoutPools` only. It never unions Research unslotted with Roster wear, never calls `appliedNodeIds`, and never reads `researchStore` / `campaignStore`.

### `DeployParams` bag (single input path)

`DeployParams` **gains** required `wn`, `economy`, `research`, `roster`. It **keeps** `mods` and `district` as non-slice fields. It **deletes** `loadout` (items live on the Roster slice).

- **`mods`:** the composer still computes `missionMods(mission, wn-as-sector, difficulty)`. `createWorld` uses `deploy.mods` and never calls `missionMods`. No silent `deploy?.mods ?? missionMods(mission)` fallback once slices are required.
- **`district`:** `missionVariant(mission, economy.quietReplay)`. Not a second `contractsWon` read.
- Tests and headless tools pass explicit slices (empty research / empty wear is a valid constructed freeze). No `getState()` fallback inside `src/game` for these reads.

Abort still writes nothing. The debrief outcome DTO remains ADR-0002’s apply-once boundary; this ADR does not redesign outcome fields except to require `quietReplay` come from the frozen Economy slice as a boolean. Do not mutate the incoming outcome object to restamp it.

### Architecture Diagram

```
four Screens (live Zustand)
        |
        |  clone at mission create
        |  appliedNodeIds(done, pins) runs HERE
        v
 +------+------+-----------+------------------+
 | wn   | econ | research  | roster           |
 | id,  | id,  | unslotted | ids 1-4,         |
 | Ctl, | rew, | node ids  | wear, appliedIds,|
 | Unr  | quiet| only      | items, mass,     |
 |      | ETA  |           | sampled HP/speed |
 +------+------+-----------+------------------+
        |
        |  DeployParams { wn, economy, research, roster, mods, district }
        v
 src/game createWorld  -- no Zustand reads --
        |  uses roster.appliedIds; never unions; never missionMods()
        |  outcome DTO at debrief (ADR-0002)
        v
 campaign writes once; Abort = no DTO
```

### Key Interfaces

- **Composer** (`MissionScreen` mount, not `src/game/`): one-shot `getState()` → clone four slices → run `appliedNodeIds` per assigned operative → `createWorld(mission, operatives, deploy)`.
- **`DeployParams`:** `{ wn, economy, research, roster, mods, district }`. No `loadout`. No type named `SnapshotDTO`.
- **`wn`:** `{ sector: SectorId; control: number; unrest: number }`.
- **`economy`:** `{ id: string; generated: boolean; reward: number; bonusDefs: readonly number[]; etaDays: number; quietReplay: boolean }`.
- **`research`:** `readonly string[]` (unslotted completed ids, `done` order).
- **`roster`:** `{ ids: readonly string[]; wear: Readonly<Record<string, Partial<Record<AugSlot, string>>>>; appliedIds: Readonly<Record<string, readonly string[]>>; items: SquadLoadout; massKg: number; massTier: MassTier; maxHp: Readonly<Record<string, number>>; speed: Readonly<Record<string, number>> }`. Maps keyed by assigned `op.id`. Empty bay = omitted wear key (not `null`). `maxHp` / `speed` are **final** sampled totals (body + unslotted + worn slotted + Experience; mass-tier already in `speed`). Pins themselves are not on the freeze. Wear is not on the Research slice.
- **`createWorld` consumption:** iterates `operatives`; indexes `roster` maps by `op.id`; copies `roster.maxHp` / `roster.speed` onto units; does not re-run `crewBonus` / `xpBonus` / `tierSpeedDelta` / `squadMassKg`; uses `roster.appliedIds` only for `squadWeapon` / weapon sampling; uses `roster.items` only for `loadoutPools`. `OperativeDef.maxHp` / `speed` are catalog bases only.
- **`MissionOutcome.quietReplay`:** Economy-slice boolean. `maybeOutcome`, `setOutcome`, and `reportMission` must not call `isQuietReplay` / `contractsWon`. `Hud.tsx` may still live-call `isQuietReplay` on Screens; that is not the stamp source.

## Alternatives Considered

### Alternative 1: Research slice carries unslotted set + resolved worn ids

- **Description**: Research GDD rule 10 (pre-sync). Roster slice keeps bodies/items/mass without worn ids.
- **Pros**: Keeps wear next to the program that named the home bay.
- **Cons**: Wear is assignment on bodies (ADR-0005: Assembly wears it). Dual-homes ids vs Roster GDD. Tactical already consumed the other cut.
- **Rejection Reason**: Locked Alternative A; Tactical refuses a third cut; wear ownership is Roster.

### Alternative 2: One combined Snapshot DTO

- **Description**: Single blob with every field.
- **Pros**: One argument to `createWorld`.
- **Cons**: Economy and Tactical GDDs forbid calling any slice “the Snapshot DTO.” Hides owners.
- **Rejection Reason**: Erases the partition this ADR exists to name.

### Alternative 3: Reconstruct in `createWorld` from unslotted ∪ wear

- **Description**: Pass Research unslotted + Roster wear; sim unions (optionally filtering a frozen `done` sequence).
- **Pros**: Smaller Roster slice.
- **Cons**: Naive concat loses interleaved `done` order. Dual consumption vs sampled HP/speed. TD-ADR CONCERNS.
- **Rejection Reason**: Composer runs `appliedNodeIds` at freeze; Roster stores ordered `appliedIds`; sim never unions.

## Consequences

### Positive

- One deploy DTO shape for `/create-epics`.
- Layer law: sim no longer reads Zustand for deploy inputs.
- Closes TR-research-004 / TR-roster-005 / TR-economy-005; names TR-world-network-008 slices; freezes `quietReplay` (TR-tactical-011).
- Answers Tactical Open Question 1 (wear dual-home).

### Negative

- `createWorld`, `maybeOutcome`, `setOutcome`, `reportMission`, `MissionScreen`, and tests that inject via store `setState` need a migration.
- `src/game` still **writes** Zustand (`setOutcome`, HUD sync, tutorial) — out of this ADR.
- Research GDD, World Network “Snapshot DTO” wording, and Economy “two slices” must stay aligned with this cut (synced in the same pass as this ADR).

### Risks

- Callers forget a slice and tests still pass via silent live-store fallback — **forbid** that fallback inside `createWorld`.
- Zustand aliasing: freezing or retaining `getState()` arrays mutates or locks the live store. Clone first.
- Double-apply: `mods` / items / HP/speed have one owner each (`mods` composer-computed; items and sampled stats on Roster). `createWorld` does not re-derive them.
- Brief chance math needs the full completed program, not only unslotted — Brief is a Screen and may read live `researchStore` before deploy.
- `Hud.tsx` may still live-call `isQuietReplay` for collateral UI on Screens; that must not be treated as the stamp source.
- THREE.Clock / Timer confusion — not this ADR; do not migrate game clocks.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| world-network.md | TR-world-network-008 Deploy snapshot WN slice; no live store handles | Names `wn` (sector id, Control, Unrest) and forbids live queries from the sim |
| economy-and-contracts.md | TR-economy-005 Economy slice (Reward, bonus defs, `quietReplay`) | Names `economy` fields; `quietReplay` is a create-time boolean |
| research.md | TR-research-004 Research deploy-slice schema | Research slice = unslotted set only |
| roster-and-assembly.md | TR-roster-005 Roster slice owns resolved wear | Single owner of worn ids; also owns `appliedIds` and sampled HP/speed |
| tactical-mission.md | TR-tactical-011 `quietReplay` from frozen Economy slice | Forbids live `contractsWon` restamp on the three outcome paths |

## Performance Implications

- **CPU**: one clone at mission create (1–4 operatives, ≤21 research ids) plus `appliedNodeIds` per assigned operative. None per frame.
- **Memory**: four small plain objects for the unsaved mission lifetime.
- **Load Time**: none.
- **Network**: none.

## Migration Plan

1. Extend `DeployParams` with required `wn`, `economy`, `research`, `roster`; keep `mods` and `district`; delete `loadout`.
2. `MissionScreen` clones stores once, runs `appliedNodeIds` per assigned operative, computes `mods` from the cloned `wn`, computes `district` from `economy.quietReplay`.
3. `createWorld` uses only `deploy` values; delete `researchStore` / `campaignStore` reads from `world.ts`; do not call `missionMods` or `appliedNodeIds`.
4. `maybeOutcome` / `setOutcome` / `reportMission` copy the Economy-slice `quietReplay` boolean; remove live `contractsWon` restamp; do not mutate the outcome to restamp.
5. Tests and `tools/city-review.tsx` pass explicit slices.
6. GDD names aligned in the same pass as this ADR.

## Validation Criteria

- Unit: `createWorld` with no Zustand still applies weapons from `roster.appliedIds` and copies `roster.maxHp` / `roster.speed`; it does not call `crewBonus`, `xpBonus`, `tierSpeedDelta`, or `squadMassKg`.
- Unit: a slotted id on the Research slice is ignored for wear; wear and `appliedIds` come from the Roster slice.
- Unit: `outcome.quietReplay` stays the frozen Economy boolean even if `contractsWon` would disagree.
- Unit: `createWorld` does not call `missionMods` or `appliedNodeIds`.
- No mid-mission **or** construction-time store reads from `src/game/` for these slices.

## Related Decisions

- [ADR-0002](adr-0002-unsaved-mission.md) — unsaved mission
- [ADR-0004](adr-0004-quiet-replay.md) — quiet replay
- [ADR-0005](adr-0005-blueprint-assignment.md) — blueprint assignment
- `design/gdd/tactical-mission.md` Open Question 1 — answered here
