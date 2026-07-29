# Milestone 2 Implementation Plan: Minimum Viable Content Set

Source: `GAME_DESIGN_DOCUMENT.md`, section 20, Milestone 2. This plan turns its five items into ordered work packages with file-level changes, acceptance criteria, and verification steps.

## Goals

1. Implement Hollow Crown as an extraction/rescue mission.
2. Implement Rust Haven as a sabotage mission.
3. Add objective primitives: interact/hack, escort/rescue, destroy/sabotage, defend for time, optional objective.
4. Author at least two tactical layouts or district archetypes per mission type.
5. Connect threat, chance, ETA, weather, and sector state to actual mission parameters.

## Non-goals

- Role abilities, sidearm switching, loadouts, deployment-mass limits (Milestone 3). The med stim and grenade shipped in `125ed6c` stay as they are.
- Contract generation, influence spending, event-driven operations (Milestone 4).
- Save/load, intel earning, campaign win state (Milestone 1). See the dependency note below.
- Difficulty modes, settings, tutorials, music (Milestone 5).

## Dependency on Milestone 1

Milestone 1 is planned (`MILESTONE_01_PLAN.md`) but not implemented: `src/game/data.ts` still carries the static `locked` flag and fixed intel constants. This milestone does not need Milestone 1 to build or test. Until the intel unlock lands, verification reaches m02 and m03 by setting `locked: false` in `data.ts` locally. If Milestone 1 lands first, its placeholder objective sets for m02/m03 are replaced by WP4 and WP5 here.

## Current state

- `ObjectiveKind` is `reach-zone | eliminate-tag | extract` (`src/game/types.ts:102`). `world.ts` runs objectives strictly sequentially through one `activeObjective` index (`src/game/world.ts:1013`). There is no optional, timed, or failable objective.
- `src/world/citygen.ts` hardcodes the Glass Veil layout: `AVE`, `PLAZA`, `GATE_Z`, `CHECKPOINT`, `EXTRACTION` constants at `citygen.ts:26`, a fixed north wall, the checkpoint gate, the garrison and five patrols. It reads nothing from the mission but `seed`. m02 and m03 would generate the same checkpoint district.
- `CityData` exposes exactly two landmarks, `extraction` and `checkpoint`. Read sites: `world.ts` (`zoneFor` fallback), `src/ui/Minimap.tsx:199`, `src/ui/briefMap.ts`, `src/scene/CityView.tsx:441` (extraction decal, checkpoint dressing, billboards), `src/scene/Atmosphere.tsx:26` (gate fog and lights).
- Units are `agent | enemy | civilian` only. There are no interactable points, no destructible devices, no friendly non-squad unit. Enemies target agents only (`seen`, `combatStep`).
- Rain is unconditional: `GameCanvas.tsx` always mounts `<Rain />`. `ENEMY_VISION` is a shared const that both the sim and the minimap cones read (`types.ts:240`). Weather changes nothing.
- `threat`, `chance`, `etaDays` are authored display fields on `MissionDef`. Sector `control`/`unrest` (`src/state/worldStore.ts`) never reach a mission.
- The sim boundary: `world.ts` reads `researchStore` once in `createWorld` and reads no other store. The strategic clock is stopped during missions.

## Work packages

Do them in this order. WP1 and WP2 are the engine work; WP3 wires parameters; WP4 and WP5 author the missions on top; WP6 finishes the surfaces.

### WP1: Objective engine

All in `src/game/types.ts` and `src/game/world.ts`, with HUD types in `src/state/missionStore.ts`.

New `ObjectiveKind` values and `ObjectiveDef` fields:

```ts
type ObjectiveKind =
  | 'reach-zone' | 'eliminate-tag' | 'extract'
  | 'interact'   // channel at a point for a duration
  | 'escort'     // bring a vip unit to a zone alive
  | 'destroy'    // reduce tagged device units to zero
  | 'defend'     // hold a zone for a duration against a spawned wave

interface ObjectiveDef {
  id: string
  label: string
  kind: ObjectiveKind
  tag?: string                       // eliminate-tag, destroy
  zone?: { x: number; z: number; r: number }
  landmark?: string                  // resolve zone from CityData.landmarks (WP2)
  durationSec?: number               // interact, defend
  optional?: boolean
  bonusReward?: number               // paid on optional completion
  wave?: WaveSpec                    // defend: spawn spec, see below
}
```

Sequencing model, the smallest change that supports optionals:

- Required objectives keep the current strict sequence and the `activeObjective` index.
- An optional objective becomes active together with the required objective it precedes in the list and stays active until done, failed, or mission end. It never blocks the sequence.
- Completing an optional adds `bonusReward` to the payout. `MissionOutcome` gains `bonus: number`; the debrief prints it as its own line.
- A required `escort` fails the mission if the vip dies. An optional objective that becomes impossible (vip dead, device already destroyed by CorpSec stray fire) is marked failed, logged, and skipped.

New simulation pieces:

- **Vip unit.** New `UnitKind` `'vip'`. Unarmed, 60 HP, walks at 4.0 m/s. Idle until a living agent comes within 3 m, then follows the nearest living agent with the existing path logic on a repath cadence. Enemies in combat treat vips as valid targets alongside agents (`seen` and `combatStep` widen from `kind === 'agent'`). Stray fire already hits any body. Vip hits are not billed as collateral; the `billed` set stays civilian-only.
- **Device unit.** New `UnitKind` `'device'`. Stationary, no weapon, no AI, 120 HP, tagged. `killUnit` on a device pushes a blast boom and a noise event, no death thud. `destroy` completes when no living device with the tag remains, the same shape as `eliminate-tag`. Devices take gunfire and grenade damage through the existing `applyDamage` path.
- **Interact.** `ObjectiveDef.zone` plus `durationSec`. Progress accrues while at least one living agent stands inside the zone radius; it pauses when the zone is empty and resumes where it left off, no reset. Progress is a mission-level value, not per agent. A comm line marks start and completion.
- **Defend.** On activation, start a countdown of `durationSec` and spawn the wave. Completion when the countdown reaches zero with at least one living agent inside the zone. Agents outside the zone pause the countdown, mirroring interact. `WaveSpec` is `{ count, weapons: WeaponId[], entry: Vec2[] }`; entry points come from the generator's landmark set so they are road cells with guaranteed connectivity. Spawned enemies enter in `combat` state with `lastSeenPos` at the zone center.

HUD sync: `ObjectiveUi` gains `progress?: number` (0..1 for interact/defend), `timer?: string`, `optional?: boolean`, `failed?: boolean`. `syncObjectives` fills them; the objective panel in `src/ui/Hud.tsx` renders a progress bar row, an `OPTIONAL` tag, and a struck-through failed row.

Estimate: two days, half of it the vip follow and defend wave behavior.

### WP2: District archetypes in the generator

`src/world/citygen.ts` becomes archetype-driven. `generateCity(mission)` keeps its signature but dispatches on a new `MissionDef.district: DistrictSpec`:

```ts
interface DistrictSpec {
  archetype: 'checkpoint' | 'compound' | 'industrial'
  seed: number
}
```

- **checkpoint** is the current generator, extracted as one archetype. Zero behavior change for Glass Veil; `mission.seed` moves into `district.seed`.
- **compound** (Hollow Crown): a walled interior compound in the north-east quarter with one gated entry and one breachable side entry, dense mid-rise blocks elsewhere, the vip spawn inside the compound. Two entries give the route choice the acceptance criteria require.
- **industrial** (Rust Haven): large industrial blocks and open yards, a fenced relay yard holding three device spawns spread across two sub-yards, sparse civilians, wider streets. Two yard gates give the route choice.

`CityData` generalizes its landmarks:

- Add `landmarks: Record<string, { x: number; z: number; r: number }>` with well-known keys: `insertion`, `extraction`, `target`, plus archetype extras (`gate`, `yard-a`, `yard-b`, `waveEntry-*`).
- Add `vips: Vec2[]` and `devices: Array<{ pos: Vec2; tag: string }>` beside `enemies` and `civilians`.
- Keep `extraction` and `checkpoint` as fields mirroring `landmarks.extraction` and `landmarks.target` so `Minimap.tsx`, `CityView.tsx`, `Atmosphere.tsx`, and `briefMap.ts` keep working, then point those read sites at `landmarks` in WP6. `world.ts` `zoneFor` resolves `ObjectiveDef.landmark` through the new record.

Shared infrastructure stays common across archetypes: the walk grid, setback and alley rules, prop and light placement, the flood-fill connectivity guarantee. The guarantee extends to every landmark, vip, device, and wave entry point.

Layout coverage, goal 4: each mission type lists two authored `DistrictSpec` variants on its `MissionDef` (`variants: DistrictSpec[]`, first entry is the default). A replay after a completed contract rotates to the next variant. Pairings: seizure gets checkpoint plus a checkpoint-seed variant with a rearranged plaza approach; extraction gets compound plus a second compound seed with the side entry on the opposite flank; sabotage gets industrial plus a second industrial seed with the yards split north/south. Every variant is click-through verified, since a seed change alone can produce a bad layout.

Estimate: three days. The two new archetypes are the bulk; the checkpoint extraction is mechanical.

### WP3: Mission parameters

New file `src/game/missionParams.ts`, pure TypeScript:

```ts
interface MissionMods {
  enemyExtra: number      // added patrol enemies
  enemyHpMul: number
  civilianCount: number
  visionMul: number       // scales ENEMY_VISION for this mission
  noiseMul: number        // scales weaponNoise radii
  rain: 'heavy' | 'light' | 'none'
}
function missionMods(m: MissionDef, sector: SectorState): MissionMods
function missionChance(m: MissionDef, mods: MissionMods, researchedCount: number): number
```

Wiring, each named value from goal 5:

- **Threat** sets the base: MODERATE `enemyExtra 0, hpMul 1.0`, HIGH `+2, 1.1`, SEVERE `+3, 1.2`. The generator consumes `enemyExtra` as additional street patrols and `civilianCount` in place of the fixed 22.
- **Sector state** adjusts it: unrest above 20 adds civilians and one patrol; control above 60 raises `enemyHpMul` by 0.05 (a well-held district is well-garrisoned). Values come from a snapshot taken at deployment.
- **Weather** becomes data: `MissionDef.weather: 'heavy' | 'light' | 'none'`. Heavy rain multiplies `visionMul` by 0.8 and `noiseMul` by 0.85; light rain 0.9/0.95. `Rain.tsx` reads the mission weather for streak density and mounts nothing on `none`. The HUD weather readout prints the real condition.
- **Chance** stops being authored. `missionChance` derives the display from threat, mods, and completed research count, clamped 35..95. The brief and the world map operations list show the derived number, so the value moves when research completes. The authored `chance` field is deleted.
- **ETA** costs world time: accepting the debrief of a completed contract advances `worldStore.t` by `etaDays` world days through a new `worldStore.advanceDays(n)`, applied from the debrief screen the same way Milestone 1 applies world effects there. Labs keep running across the jump, which is the point: a four-day contract can finish a research project.

Boundary rule: `world.ts` must not read `worldStore`. `MissionScreen` computes `MissionMods` at mount and passes it to `createWorld(mission, operatives, mods)`. The brief computes the same mods live for its counts, so briefing numbers match the deployed city.

Vision cones must not lie: the effective vision becomes `world.vision` on `WorldApi`, and `Minimap.tsx` draws cones from it instead of the `ENEMY_VISION` const. The const stays as the base value.

Estimate: one and a half days.

### WP4: Hollow Crown, extraction/rescue

`src/game/data.ts` m02. Compound archetype, threat HIGH, weather light rain, seed pair authored in WP2.

- Briefing and notes rewritten to match the real modifiers (rain light, civilian density low, collateral tolerance moderate, vip fragile).
- Objective sequence:
  1. `reach-zone` REACH THE COMPOUND GATE (landmark `gate`).
  2. `interact` OVERRIDE THE CELL BLOCK LOCKS, 5 s at the compound console.
  3. `escort` EXTRACT THE HELIX ASSET, vip to `extraction`, required; vip death loses the mission.
  4. `extract` EXTRACT THE SQUAD.
  - Optional, active with 2: `interact` PULL THE DETENTION SERVER, 4 s, `bonusReward` 9,000.
- Compound garrison of six tagged enemies plus four street patrols. The garrison is not an objective; the acceptance criteria want optional engagement, and a stealth-leaning route past the side entry must be viable.

Estimate: one day including tuning the vip walk against the garrison.

### WP5: Rust Haven, sabotage

`src/game/data.ts` m03. Industrial archetype, threat MODERATE, weather none, seed pair from WP2.

- Objective sequence:
  1. `reach-zone` REACH THE RELAY YARD (landmark `yard-a`).
  2. `destroy` DESTROY THE THREE FUEL RELAYS, tag `relay`, devices at 120 HP each; the grenade cell is the fast tool, gunfire the slow one.
  3. `defend` HOLD THE YARD FOR THE BURN, 45 s, wave of five CorpSec from two entry landmarks.
  4. `extract` EXTRACT THE SQUAD.
  - Optional, active with 2: `destroy` DROP THE BACKUP TRANSFORMER, tag `transformer`, one device, `bonusReward` 6,000.
- No rain: the mission verifies the weather wiring's off state and the clear-night visuals.

Estimate: one day.

### WP6: Surfaces

- `src/ui/briefMap.ts`: target zone and routes resolve from `landmarks`; device and vip markers on the tactical map; patrol overlays already generalize. The recon frame needs no change.
- `src/ui/index.tsx`: brief prints derived chance, weather, and the sector-adjusted counts; debrief prints the bonus line and the ETA time jump.
- `src/ui/Minimap.tsx`: icons for devices (square), vip (ring), defend zone (countdown ring), plus the existing zone pulse for the active objective; cones from `world.vision`.
- `src/ui/Hud.tsx`: objective rows with progress bars, optional tags, failed strikethrough.
- `src/scene/CityView.tsx`: device meshes (emissive so they read under bloom), compound wall and gate dressing, yard fencing; the checkpoint dressing becomes checkpoint-archetype-only. `src/scene/Units.tsx`: vip figure from the existing procedural unit builder, pooled like the rest; the per-frame no-allocation rule holds.
- `src/scene/Atmosphere.tsx`: gate fog keys off the archetype's `gate` landmark when present.
- `src/game/audio.ts`: interact progress tick, device blast reuses `sfx.blast`, a wave-incoming sting reusing the alert voice.

Estimate: two days.

## File change summary

| File | Change |
|---|---|
| `src/game/types.ts` | New objective kinds and fields; `UnitKind` vip and device; `DistrictSpec`; `MissionDef.weather`, `variants`, drop `chance`; `CityData.landmarks`, `vips`, `devices`; `WorldApi.vision` |
| `src/game/world.ts` | Optional/failable objectives, interact, escort, destroy, defend, wave spawns, vip follow, device damage, bonus payout, vision/noise multipliers |
| `src/game/missionParams.ts` | New. Mods from threat, sector, weather; derived chance |
| `src/game/data.ts` | m02 and m03 authored fully; weather and variants on all three missions |
| `src/game/audio.ts` | Interact tick, wave sting |
| `src/world/citygen.ts` | Archetype dispatch; compound and industrial generators; landmark record; connectivity over new points |
| `src/state/missionStore.ts` | `ObjectiveUi` progress, timer, optional, failed |
| `src/state/appStore.ts` | `MissionOutcome.bonus` |
| `src/state/worldStore.ts` | `advanceDays(n)` for the ETA cost |
| `src/ui/MissionScreen.tsx` | Compute `MissionMods`, pass to `createWorld` |
| `src/ui/Hud.tsx` | Objective row states |
| `src/ui/Minimap.tsx` | Device, vip, defend markers; cones from `world.vision` |
| `src/ui/briefMap.ts` | Landmark-driven target and markers |
| `src/ui/index.tsx` | Brief derived values; debrief bonus and time jump |
| `src/scene/CityView.tsx` | Archetype dressing, device meshes |
| `src/scene/Units.tsx` | Vip figure in the unit pool |
| `src/scene/Atmosphere.tsx` | Gate effects keyed to the landmark |
| `src/scene/Rain.tsx` | Density from mission weather, unmount on none |

## Acceptance criteria

From GDD section 21, mission content, plus milestone specifics:

1. Hollow Crown and Rust Haven are playable end to end, win and loss, with debrief payouts including bonus lines.
2. All five primitives function: interact channels and resumes, escort completes and fails, destroy counts devices, defend holds a countdown against a spawned wave, optional objectives pay bonuses and never block the sequence.
3. Each mission type has two verified layouts; a replay rotates to the second variant.
4. Every operation has at least one route choice, and at least one patrol or garrison can be bypassed rather than killed.
5. Mission notes correspond to active modifiers; the briefing map geometry and counts match the deployed city.
6. Heavy rain measurably shortens guard sight and shot noise, and the minimap cones show the shortened range.
7. Sector unrest and control at deployment change civilian and enemy numbers. Derived chance replaces the authored value everywhere it displayed.
8. Completing a contract advances the strategic clock by its ETA and running labs progress across the jump.

## Verification

`npm run lint`, `npm run build`, then this click-through:

1. Glass Veil regression: unchanged layout, objectives, payout. The brief now shows derived chance and heavy-rain modifiers.
2. Hollow Crown, both variants: breach via the gate on one run and the side entry on another; let the vip die once and confirm the loss; complete the optional server pull and confirm +9,000 in the debrief.
3. Rust Haven, both variants: destroy relays by grenade and by gunfire; step out of the yard mid-defend and confirm the countdown pauses; skip the optional transformer once and confirm no bonus.
4. Weather: confirm rain is absent in Rust Haven and that in Hollow Crown guards spot the squad at visibly shorter range than in a `none`-weather test build.
5. Sector coupling: raise Asia's unrest on the world map (let riots fire), deploy Hollow Crown, confirm more civilians than at low unrest.
6. ETA: start a 4 h research project, complete Rust Haven (ETA 3 days), confirm the project finished during the jump.
7. Determinism: replay the same variant twice, confirm identical city, spawns, and device positions.
8. 1280x720 pass on the brief, HUD objective rows, and minimap icons for both new missions.

## Open decisions

1. Vip death on a required escort: recommended mission loss, matching the client fiction. The alternative, payout-zero survival, weakens the primitive.
2. Defend countdown pause when the zone is empty: recommended pause, matching interact. The alternative, objective failure, is harsher than anything else in the game.
3. Deleting `MissionDef.chance` versus keeping it as a fallback: recommended delete, one source of truth. Milestone 1's save schema is not yet built, so no migration cost exists.
4. ETA advancing the world clock from the debrief: recommended yes, it is the only place ETA can matter before Milestone 4's contract economy. If rejected, ETA stays display-only and goal 5 is four fifths met.
5. Replay variant rotation versus a variant picker on the brief: recommended rotation, zero new UI. A picker fits Milestone 4's intel tooling better.

## Estimate

About ten and a half developer days: WP1 two, WP2 three, WP3 one and a half, WP4 and WP5 one each, WP6 two, plus one day for the full click-through and fixes.
