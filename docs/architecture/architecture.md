# Nexus Reborn — Master Architecture

## Document Status
- Version: 1.0
- Last Updated: 2026-09-11
- Engine: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
- Review mode: full
- GDDs Covered: `design/gdd/game-concept.md`, `game-pillars.md`, `systems-index.md`, `world-network.md`, `economy-and-contracts.md`, `research.md`, `persistence-and-validation.md`, `roster-and-assembly.md`, `tactical-mission.md`, `interface.md`, `audio.md` (living spec remains `docs/game-design.md`)
- ADRs Referenced: ADR-0001 … ADR-0020 (all Accepted)
- TR baseline: 64 requirements in `docs/architecture/tr-registry.yaml` (architecture-review 2026-09-11: 64 covered, 0 gaps)
- Technical Director Sign-Off: 2026-09-11 — APPROVED WITH CONDITIONS
- Lead Programmer Feasibility: REVISED
- TD-ARCHITECTURE: CONCERNS (API Boundaries abbreviated) → revised 2026-09-11 → APPROVED WITH CONDITIONS (QQ-01 budgets; QQ-02 implement ADR-0009/0019)
- LP-FEASIBILITY: CONCERNS → REVISED 2026-09-11

## Engine Knowledge Gap Summary

Engine pin is post-cutoff (LLM training ≈ May 2025; three.js r185 published 2026-07-01; React 19.2.0 published 2025-10-01). **HIGH RISK** recommendations in this document are stamped against `docs/engine-reference/web/` and must not be implemented from training-data defaults.

### HIGH RISK
- **Rendering / WebGPU**: `WebGPURenderer` from `three/webgpu`, `await renderer.init()` then sync `render()` (r181). Do not use `WebGLRenderer`, `renderAsync()`, or `waitForGPU()`. r185 premultiplied-alpha change: opaque scene clear unless compositing over HTML.
- **r3f 9.6.1**: mission root is `createRoot` + one `configure`/`render` per canvas. Stock `<Canvas>` races `WebGPURenderer.init` (r3f#3782).
- **Post / TSL**: class is `RenderPipeline` (not `PostProcessing`, r183). Bloom is emissive-only MRT via `three/tsl` + `BloomNode`. No GLSL `ShaderMaterial` / `onBeforeCompile` on the WebGPU path.
- **React 19.2**: do not add `<Activity>` or `useEffectEvent` unless a story requires them. No RSC.

### MEDIUM RISK
- **Geometry / camera**: `PerspectiveCamera` imported from `three/webgpu` (pose is ADR-0016; canvas/frame loop is ADR-0010).
- **TSL node materials** in `architectureRenderer.ts` / `cityMaterials.ts`.

### LOW RISK
- Custom TypeScript sim (`src/game/`), citygen (`src/world/`), Zustand stores, `localStorage` envelopes, DOM UI, Web Audio (not `THREE.Audio`).

### GDD systems that touch HIGH/MEDIUM
- Interface → Rendering → HIGH (ADR-0010, ADR-0017)
- Tactical mission → Geometry/camera → MEDIUM; scene submit is Interface/Platform HIGH
- Audio → Web Audio → LOW (forbidden: `THREE.Audio` / `PannerNode`)
- World Network, Economy, Research, Persistence, Roster → no three.js APIs → LOW

Game clocks (`src/ui/clock.ts`, mission clock strings) are **not** `THREE.Clock` / `THREE.Timer`.

## System Layer Map

Brownfield map of the shipping cut. The eight GDD systems keep their `design/gdd/systems-index.md` layers. Platform is the web stack — not a ninth GDD system. Persistence stays Core (schema sink that depends on Feature roster); it is not Foundation save/load in the template sense. Envelope writer is still `save.ts`.

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTATION                                            │
│  Interface — DOM screens, HUD, tokens, phase router      │
│  Audio — four buses + master/mute, strategy/mission beds │
├──────────────────────────────────────────────────────────┤
│  FEATURE                                                 │
│  Roster and Assembly — 1–4 Ready, wear, deploy gate      │
│  Tactical mission — five verbs, citygen, fire lane       │
├──────────────────────────────────────────────────────────┤
│  CORE                                                    │
│  Economy and contracts — Credits, contract instances     │
│  Research — one program; blueprints, not locker          │
│  Persistence and validation — three envelopes, hydrate   │
├──────────────────────────────────────────────────────────┤
│  FOUNDATION                                              │
│  World Network — two clocks, sectors, Intel, Influence   │
├──────────────────────────────────────────────────────────┤
│  PLATFORM                                                │
│  Desktop browser · localStorage · React 19.2.8 · Vite    │
│  6.4.3 · three.js r185 WebGPU · r3f 9.6.1 createRoot     │
└──────────────────────────────────────────────────────────┘
```

| GDD system | Layer | Exclusive owner | Code home |
|---|---|---|---|
| World Network | Foundation | Strategic `t`, sectors, Intel, Influence wallet, Tax yield *amount* | `worldStore` + `campaignStore.intel*` |
| Economy and contracts | Core | Credits ledger, authored+generated contract instances, invoice math | `appStore.credits`, `worldStore.contracts*` |
| Research | Core | Laboratories, program, unslotted set; not resolved wear | `researchStore` |
| Persistence and validation | Core | Three envelopes, all-or-nothing hydrate, `save.ts` writer | `src/state/save.ts` |
| Roster and Assembly | Feature | Operatives, wear/`appliedIds`, mass gate, fail flags | `campaignStore` roster |
| Tactical mission | Feature | Sim, citygen, weather script, Opening hour, fire lane | `src/game/`, `src/world/citygen.ts` |
| Interface | Presentation | Screens, HUD, bindings, palette | `src/ui/`, `src/scene/` canvas |
| Audio | Presentation | Mixer, beds, SFX; no VO/spatial | `src/game/audio.ts`, `src/ui/sound.ts` |

Code folders are not 1:1 with GDD systems: `src/game/` is pure sim (no React, no three.js); `src/world/` owns road geometry and the walk grid; `src/state/` holds Zustand stores and the campaign blob; `src/scene/` is three.js under r3f; `src/ui/` is DOM screens and the mission HUD.

### Engine awareness (Core and Foundation)

World Network, Economy, Research, and Persistence call **no** three.js / r3f APIs. Knowledge risk for those four is LOW.

Presentation + Platform **do** touch HIGH RISK domains:

- ⚠️ `WebGPURenderer` + `await init()` + r3f `createRoot` — three.js r185 / r3f 9.6.1 (post-cutoff, HIGH). Verified: `docs/engine-reference/web/modules/webgpu.md`, `modules/r3f.md`. Behaviour confirmed: yes (in-repo `GameCanvas.tsx`). Do not use stock `<Canvas>` or `WebGLRenderer`.
- ⚠️ `RenderPipeline` (not `PostProcessing`) + TSL `pass`/`mrt`/`bloom` — r183/r185, HIGH. Verified: `modules/tsl.md`. Behaviour confirmed: yes (`Effects.tsx`).
- ⚠️ r185 premultiplied alpha — opaque scene clear. Verified: `breaking-changes.md`.
- Camera pose (Feature / Tactical) is MEDIUM: `PerspectiveCamera` via `three/webgpu`. Canvas/frame loop is ADR-0010 (HIGH); pose is ADR-0016.

Do not add or drop GDD systems. Do not move Persistence to Foundation.

## Module Ownership

Owner is the GDD system, not the Zustand filename (ADR-0012). `createWorld` does not read live stores (ADR-0009). Main-thread only — no worker or thread boundary.

### Platform

| Module | Owns | Exposes | Consumes | Engine APIs |
|---|---|---|---|---|
| Web stack | Pins, `localStorage`, canvas element | Renderer after `init()`, storage keys | — | ⚠️ `WebGPURenderer` r185 HIGH; r3f `createRoot` HIGH; `localStorage` LOW |

### Foundation

| Module | Owns | Exposes | Consumes | Engine APIs |
|---|---|---|---|---|
| World Network | Strategic `t`, sectors, Influence wallet, Intel (`campaignStore`), Tax *amount*, World Events, Review cursor | `tick` / `advanceDays`, spends, intel, tax deposit. `advanceFlow` is module-private (ADR-0018) | Outcome DTO at debrief (control/unrest/intel/Influence); generated catch-up stays inside private `advanceFlow` | None |

### Core

| Module | Owns | Exposes | Consumes | Engine APIs |
|---|---|---|---|---|
| Economy | Credits (`appStore`), generated instances + RNG (`worldStore`), invoice/`net_payout`, Economy deploy slice | `spendCredits`/`addCredits`, contract list, priced invoice | Tax deposit (does not recompute); `civiliansHit` from Tactical | None |
| Research | Labs, one program, unslotted completed set | `sync(t)`, Research deploy slice (unslotted only) | Economy debit; strategic `t` | None |
| Persistence | Three envelopes; all-or-nothing hydrate; `save.ts` only campaign writer | Load / New Operation / Screen autosave | Store fields; never a running mission | `localStorage` + JSON LOW |

### Feature

| Module | Owns | Exposes | Consumes | Engine APIs |
|---|---|---|---|---|
| Roster | Operatives, resolved wear/`appliedIds`, mass gate, fail flags | `canDeploy`, Roster deploy slice | Research blueprints; hire Credits; debrief KIA/injury/XP | None |
| Tactical | `WorldApi` sim, citygen 96×96, weather script, Opening hour, five verbs, fire lane, tactical clock | Orders, `getWorld()`, outcome counts | Four `DeployParams` slices at create — no live stores | Sim: none. ⚠️ CameraRig `PerspectiveCamera` `three/webgpu` MEDIUM |

### Presentation

| Module | Owns | Exposes | Consumes | Engine APIs |
|---|---|---|---|---|
| Interface | Phase router, DOM, HUD, tokens, one remap table, canvas host | Screens; bindings | Stores + imperative `getWorld()` | ⚠️ `createRoot` + `WebGPURenderer.init` HIGH; `RenderPipeline`/TSL HIGH; React 19.2 HIGH (no `<Activity>`) |
| Audio | Four buses + master/mute (settings slot), beds, SFX | Play/mute | Phase; live weather for rain | Web Audio LOW. Forbidden: `THREE.Audio` / `PannerNode` |

```
Platform ─────────────────────────────────────────────┐
  localStorage ← Persistence                          │
  WebGPU/r3f  ← Interface (canvas)                    │
                                                      ▼
Presentation: Interface ← Audio
       │ reads
Feature: Roster ──deploy gate──► Tactical (frozen slices)
       ▲ wear                         │ outcome counts
Core: Research    Economy ◄───────────┘ civiliansHit / net_payout
       │ sync(t)     ▲ tax deposit
Foundation: World Network (t, Intel, Influence, sectors)
```

HIGH RISK APIs (verified against engine-reference; behaviour confirmed in-repo):

```
⚠️  WebGPURenderer.init() / render() — three.js r185 HIGH
    Verified: docs/engine-reference/web/modules/webgpu.md — yes
⚠️  r3f createRoot (not <Canvas>) — r3f 9.6.1 HIGH
    Verified: docs/engine-reference/web/modules/r3f.md — yes
⚠️  RenderPipeline + TSL pass/mrt/bloom — r183/r185 HIGH
    Verified: docs/engine-reference/web/modules/tsl.md — yes
⚠️  PerspectiveCamera from three/webgpu — MEDIUM
    Verified: ADR-0016; modules/r3f.md — yes
```

## Data Flow

Main-thread only. No worker, SharedArrayBuffer, or thread-crossing flow.

### 1. Frame update (mission)

Synchronous r3f `useFrame` + shared `WorldApi`. Per-frame poses are **not** React state.

```
Input (bindings / scene Input)
  → WorldTicker useFrame priority 0: getWorld().tick(dt) if live && !paused
  → CameraRig / Units / CityView useFrame: read world, mutate Object3D
  → Effects useFrame priority 1: RenderPipeline.render()   ⚠️ HIGH (r185)
```

| Data | Producer | Consumer | Mechanism |
|---|---|---|---|
| `dt` | r3f frame | `world.tick` | sync call |
| unit poses, weather, clock | Tactical `WorldApi` | scene + HUD | shared state, imperative read |
| GPU submit | Effects | canvas | sync `pipeline.render()` |

Quality governor may write settings for **next** mission; it does not tear down the live pipeline (ADR-0010).

### 2. Event / signal path

No global event bus. Coupling is Zustand `getState`/`subscribe` plus explicit DTOs.

| Data | Producer | Consumer | Mechanism |
|---|---|---|---|
| orders (five verbs) | Interface | Tactical `WorldApi` | sync call |
| phase | `appStore` | screens, Audio beds | Zustand |
| strategic `t` | World Network `tick` / `advanceDays` | Research `sync(t)`, Roster dues, Economy generation | sync; private `advanceFlow` is not a public API |
| outcome DTO | Tactical at win/loss | Debrief → Economy, WN, Roster | one-shot apply (ADR-0002) |
| Review cursor | Interface slider | World Map view | `worldStore.review` — not a clock (ADR-0014) |

### 3. Save / load

| Data | Producer | Consumer | Mechanism |
|---|---|---|---|
| campaign blob | `save.ts` `writeSave` | `readSave` / `hydrateSave` | `localStorage` JSON |
| settings mixer | settings store | Audio, Quality | separate slot |
| telemetry ≤60 | debrief/abort if opt-in | Balance export | third slot; never leaves machine |

Rules: four Screens autosave; mission and debrief do **not**. Debrief mutates stores in memory; the next Screen is the first durable campaign write. Invalid campaign blob is dropped whole. Abort writes nothing to campaign.

### 4. Initialisation order

```
1. initializeSaveSystem → hydrate settings; campaign all-or-nothing → menu
2. Research + Roster sync(t) to saved t (no offline hours)
3. Screen clock may start (four Screens only)
4. Deploy: Roster canDeploy → startMission → createWorld(DeployParams)
5. GameCanvas: createRoot + await WebGPURenderer.init()   ⚠️ HIGH
6. WorldTicker / scene / Effects mount; first tick is opening-frame remainder
```

Hydrate never lands in a running mission. `createWorld` does not read live stores.

## API Boundaries

Contracts programmers implement against. Engine types appear only on the canvas host. ⚠️ HIGH where noted.

Code still lags two Accepted ADRs: `DeployParams` in `world.ts` is `{ mods, district, loadout }` (ADR-0009 names four slices); Team Deploy still `goto('mission')` (ADR-0019 names `canDeploy` + `startMission` no-op). The boundaries below are the ADR contracts, not the lag.

### Tactical — `WorldApi` (`src/game/types.ts`)

No three.js types. Callers: Interface / scene. Invariant: no live Zustand inside `tick` / orders.

```ts
interface WorldApi {
  city: CityData
  mission: MissionDef
  units: Unit[]
  tracers: Tracer[]
  booms: Boom[]
  time: number
  weather: Weather
  vision: number
  scanUntil: number
  tick(dt: number): void
  orderMove(ids: string[], dest: Vec2): void
  orderAttack(ids: string[], targetId: string): void
  orderStop(ids: string[]): void          // not a sixth verb
  orderHold(ids: string[], hold: boolean): void
  orderHoldFire(ids: string[], hold: boolean): void
  orderSwapWeapon(ids: string[]): void
  orderAbility(ids: string[]): void
  orderUseMed(ids: string[]): boolean
  orderUseCell(ids: string[]): boolean
  orderGrenade(agentId: string, target: Vec2): boolean
  unit(id: string): Unit | undefined
}
getWorld(): WorldApi | null   // runtime.ts; scene reads imperatively
```

Kit methods are not verbs (ADR-0016). Guarantee: deterministic from mission seed; fire-lane first Unit; pause freezes `tick`.

### Deploy freeze — ADR-0009

Composer (`MissionScreen`) clones four slices; `createWorld` must not `getState()`.

```ts
interface DeployParams {
  wn: { sector: SectorId; control: number; unrest: number }
  economy: { id: string; generated: boolean; reward: number; bonusDefs: readonly number[]; etaDays: number; quietReplay: boolean }
  research: readonly string[]           // unslotted completed ids only
  roster: { ids; wear; appliedIds; items; massKg; massTier; maxHp; speed }
  mods: MissionMods
  district?: DistrictSpec
}
createWorld(mission, operatives, deploy): WorldApi
```

Invariant: resolved wear lives only on `roster`. `quietReplay` is the Economy-slice boolean.

### Deploy gate — ADR-0019

```ts
canDeploy({
  missionSelected: boolean
  assignedIds: readonly string[]
  statusById: Readonly<Record<string, 'READY' | 'INJURED' | …>>
  massKg: number
}): {
  ok: boolean
  reason: 'no-contract' | 'none-assigned' | 'not-ready' | 'over-mass' | null
  overKg: number   // massKg - MASS_LIMIT_KG; may be ≤ 0 when ok
}

startMission(): void   // appStore; no-op unless canDeploy.ok
```

Empty bays legal. Mass `>` 400 refuses; `===` 400 allowed. `goto('mission')` is not a public start API. Tactical does not re-own the gate.

### Outcome DTO — ADR-0002 / ADR-0009

Tactical counts; Economy prices. `quietReplay` is the frozen Economy-slice boolean — not a live `contractsWon` restamp.

```ts
interface MissionOutcome {
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number      // Tactical count; Economy prices collateral
  reward: number
  bonus: number
  deadIds: string[]
  survivorHp: Record<string, number>
  quietReplay: boolean      // required; Economy slice at create
  telemetry?: MissionTelemetry
}
```

Abort emits no outcome DTO. `setOutcome` / `maybeOutcome` / `reportMission` must not call `isQuietReplay`.

### Economy / persistence

```ts
spendCredits(amount): void     // refuse amount <= 0 or amount > credits
addCredits(amount): void       // ignore non-positive
writeSave() / readSave() / hydrateSave() / initializeSaveSystem()
startNewOperation()            // does not reset settings or telemetry
```

Campaign blob omits a running mission. Invalid blob → drop-all. `save.ts` is the only campaign writer.

### Canvas host — ⚠️ HIGH (r185 / r3f 9.6.1)

Not a TypeScript interface. Invariants: `three/webgpu` `WebGPURenderer`, `await init()`, r3f `createRoot` (not `<Canvas>`), `RenderPipeline` GPU submit at `useFrame` priority 1, opaque clear. No `THREE.Timer` as game clock. No React 19.2 `<Activity>` / `useEffectEvent`.

Verified: `docs/engine-reference/web/modules/webgpu.md`, `modules/r3f.md`, `modules/tsl.md`. Behaviour confirmed in `GameCanvas.tsx` / `Effects.tsx`.

## ADR Audit

All 20 ADRs are **Accepted**. None are Proposed. None conflict with the layer or ownership map in this document.

| ADR | Engine Compat | Version | GDD Linkage | Conflicts | Valid |
|---|---|---|---|---|---|
| 0001 Two clocks | ✅ | ✅ | ✅ living spec | None | ✅ |
| 0002 Unsaved mission | ✅ | ✅ | ✅ | None | ✅ |
| 0003 One contract kind | ✅ | ✅ | ✅ | None | ✅ |
| 0004 Quiet replay | ✅ | ✅ | ✅ | None | ✅ |
| 0005 Blueprint assignment | ✅ | ✅ | ✅ | None | ✅ |
| 0006 Weather script | ✅ | ✅ | ✅ | None | ✅ |
| 0007 Opening hour | ✅ | ✅ | ✅ | None | ✅ |
| 0008 Influence is a wallet | ✅ | ✅ | ✅ | None | ✅ |
| 0009 Partitioned deploy snapshot | ✅ | ✅ | ✅ TR | None | ✅ |
| 0010 Mission renderer / frame loop | ✅ post-cutoff APIs flagged | ✅ | ✅ TR | None | ✅ |
| 0011 Campaign persistence envelope | ✅ | ✅ | ✅ TR | None | ✅ |
| 0012 Store placement | ✅ | ✅ | ✅ TR | None | ✅ |
| 0013 Credits never overdraw | ✅ | ✅ | ✅ TR | None | ✅ |
| 0014 Timeline Review is a view | ✅ | ✅ | ✅ TR | None | ✅ |
| 0015 Telemetry never leaves the machine | ✅ | ✅ | ✅ TR | None | ✅ |
| 0016 Tactical sim contract | ✅ Geometry MEDIUM | ✅ | ✅ TR | None | ✅ |
| 0017 One OS / input / audio mixer | ✅ | ✅ | ✅ TR | None | ✅ |
| 0018 Catch-up collision order | ✅ | ✅ | ✅ TR | None | ✅ |
| 0019 Deploy gate | ✅ | ✅ | ✅ TR | None | ✅ |
| 0020 Campaign fail flags | ✅ | ✅ | ✅ TR | None | ✅ |

0001–0008 link `docs/game-design.md`, not `TR-*` ids. Still valid for the pinned engine.

### Traceability

64 / 64 covered, 0 partial, 0 gaps (`docs/architecture/tr-registry.yaml`; architecture-review 2026-09-11). No Required New ADR from uncovered TRs.

This document synthesizes existing ADRs. It does not mint a new Foundation decision.

Hygiene (not new ADRs): `docs/technical-preferences.md` ADR log stops at 0008; Forbidden Patterns still empty; performance budgets PENDING (`docs/game-design.md` §20).

## Required ADRs

**Must have before coding starts (Foundation & Core):** none. The shipping cut exists; Foundation and Core ADRs are Accepted.

**Should have before the relevant system is built:** none outstanding for TR coverage.

**Can defer:**
- Numeric performance budgets (GDD §20 still pending) — prefs, not a new ADR
- Prefs ADR-log + forbidden-pattern sync with ADR-0010 / ADR-0017
- Extract `canDeploy` / four-slice `DeployParams` — implement Accepted ADRs, do not re-decide

## Architecture Principles

1. **Two clocks, never both** — strategic `t` and tactical time do not share a ticker (ADR-0001, ADR-0018).
2. **Commit on the ground** — mission is memory-only; debrief applies once; abort writes nothing (ADR-0002, ADR-0011).
3. **Owner is the GDD system, not the Zustand file** — Intel on `campaignStore`, generated contracts on `worldStore`, Credits on `appStore` (ADR-0012).
4. **Per-frame data stays out of React** — scene reads `getWorld()`; GPU submit is `RenderPipeline` at `useFrame` priority 1 (ADR-0010). ⚠️ HIGH.
5. **One corporate OS** — dual palette, no `public/` art, one remap table, four audio buses; no VO/spatial (ADR-0017).

## Open Questions

| ID | Summary | Priority | Resolution Path |
|---|---|---|---|
| QQ-01 | Performance budgets still PENDING in prefs / GDD §20 | Medium | Prefs update after §20; not a new ADR |
| QQ-02 | `DeployParams` / `startMission` code lags ADR-0009 / ADR-0019 | High | Implementation stories; do not re-decide |
| QQ-03 | Stub vs keep `docs/game-design.md` after D2 extracts | Low | Design process; not architecture |
| QQ-04 | Hire-on-failed (Roster OQ1) | Low | Roster GDD; not ADR-0020 |
