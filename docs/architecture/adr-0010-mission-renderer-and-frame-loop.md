# ADR-0010: Mission renderer and frame loop

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-11
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11

The mission canvas is `WebGPURenderer` + `await init()` + r3f `createRoot`. Per-frame poses stay out of React. Game clocks are not `THREE.Timer`.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Rendering |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md` |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `modules/webgpu.md`; `modules/r3f.md`; `modules/tsl.md`; `docs/agents/rendering-ui.md`; `docs/agents/mission-runtime.md` |
| **Post-Cutoff APIs Used** | `WebGPURenderer` from `three/webgpu` (r185); r3f 9.6.1 `createRoot` + `extend(THREE)`; `RenderPipeline` (r183 rename); `await renderer.init()` then sync `render()` (r181); TSL `pass` / `mrt` / `bloom` |
| **Verification Required** | Mission canvas uses `createRoot`, not stock `<Canvas>`. `gl` factory awaits `init()`. `src/scene/` imports `three/webgpu`. Per-frame unit data is not in React state. Game clocks are not `THREE.Timer`. Effects use `RenderPipeline`. Effects `useFrame` priority 1 is the only GPU submit. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | Scene/HUD stories that would otherwise invent a `<Canvas>` or put unit poses in React |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Must not migrate game clocks (ADR-0001). Scene reads `getWorld()`; must not live-read campaign stores (ADR-0009). Does not claim TR-tactical-008 (camera FOV / minimap pose) — Tactical owns pose; this ADR only stamps the runtime read/write helpers. |

## Context

### Problem Statement

The mission view sits on a post-cutoff WebGPU + r3f 9 stack. Training data defaults to `WebGLRenderer`, stock `<Canvas>`, and `THREE.Clock`. Without an ADR, stories will race `init()`, put per-frame poses in React, or migrate game clocks.

### Constraints

- Pinned three.js r185 / r3f 9.6.1 / React 19.2.8. Do not take npm latest (r186, r3f 9.7).
- `AGENTS.md`: `src/scene` reads the world imperatively every frame. Per-frame data stays out of React state.
- Opaque `Scene.background` (r185 premultiplied alpha).
- Quality numeric budgets in `docs/technical-preferences.md` are still PENDING — this ADR does not invent FPS targets.
- Opening-frame `world.tick` clamp and remainder catch-up already exist in `world.ts`. Do not drop either.

### Requirements

- `WebGPURenderer` + `await init()`; WebGL2 via that `init()`, not a second renderer class.
- r3f `createRoot`, not `<Canvas>` (r3f#3782).
- `useFrame`: tick the world, then mutate the scene from `getWorld()`.
- HUD may subscribe to a slow `missionStore` (`SYNC_INTERVAL` 0.2s); canvas units/minimap do not.
- Game clocks remain game clocks.

## Decision

Mission canvas is `src/scene/GameCanvas.tsx`. This ADR stamps that contract. It is not a rewrite.

1. **Renderer.** Import `three/webgpu`. `new THREE.WebGPURenderer(props); await renderer.init()`. Do not `renderAsync` / `waitForGPU`. Do not construct `WebGLRenderer` for this canvas. r3f `configure` default `alpha: true` is inherited — keep opaque `Scene.background` (`Atmosphere` `<color attach="background">`). Do not transparent-clear the mission canvas. Do not set `alpha: false` to “fix” blending.

2. **r3f root.** `createRoot(canvas)` + `root.configure({ gl: glFactory, events, ... })`. One root per canvas. StrictMode remount uses a `WeakMap` so `configure` is single-flight (r3f#3782). Do not mount stock `<Canvas>`. Do not mount drei `Canvas` / `View`. `frameloop` stays r3f default `'always'` — do not add a `configure` field and do not call `setAnimationLoop` in `GameCanvas`. Two-phase `configure`: boot `dpr: [1, 1.75]`, then post-init `tierDpr()`. Further `configure` must `await mount.ready` (ResizeObserver already does). Tone mapping: `ACESFilmicToneMapping`, exposure 1.1.

3. **JSX catalog.** `extend(THREE as never)` and the `ThreeToJSXElements` module augmentation stay as in `GameCanvas`. Do not import r3f 8 or unscoped `react-three-fiber`.

4. **Frame order.** `WorldTicker` `useFrame(..., 0)` is the first child in `SceneTree`. Tick-before-mutate is that mount order among priority 0 (stable sort). Do not add a frame coordinator or a unique WorldTicker priority. `WorldTicker` passes **raw** r3f `dt` into `world.tick(dt)` when `missionStore.live && !paused`. It must not `Math.min(dt, 0.05)` — that would kill post-warmup catch-up. Opening-frame clamp (`world.time < 1` → at most one `MAX_DT` step) and remainder catch-up after `t >= 1` are **owned by `world.ts`**. Scene components `useFrame` read `getWorld()` and write `object3D` / pooled buffers. Effects `useFrame(..., 1)` is load-bearing: r3f 9.6.1 disables auto `gl.render()` while any subscriber has `priority > 0`. `RenderPipeline.render()` is the only GPU submit. Do not also call `gl.render()` / `renderer.render()`. A second positive-priority subscriber must not render. Do not put unit positions, tracers, or camera pose into React state each frame.

5. **Two-tier HUD.** `world.ts` pushes squad rows / clock / collateral into `missionStore` on `SYNC_INTERVAL` (0.2s) and on events. That is the only React-visible mission stream. Canvas units and the minimap read `getWorld()` (minimap ~10Hz). `src/game/runtime.ts` also owns `setCameraFootprint` / `getCameraFootprint` / `setCameraFocus` / `getCameraFocus` / `panCameraTo` / `takeCameraPan`. Tactical still owns pose constants (TR-tactical-008 is not this ADR).

6. **Post.** `RenderPipeline` from `three/webgpu`. TSL `pass` / `mrt({ output, emissive })` from `three/tsl`; `bloom` from `three/addons/tsl/display/BloomNode.js`. Bloom is emissive-only. LOW tier drops bloom. Do not `new PostProcessing` (r185 still exports a `warnOnce` wrapper). Do not pull EffectComposer, `@react-three/postprocessing`, `AnamorphicNode`, or `ShaderMaterial` on this path.

7. **Quality.** Tier resolves once per mission in the gl factory once the backend is known (`resolveTier` / `setMissionTier`). AUTO → HIGH on WebGPU, MEDIUM on WebGL2. `FrameGovernor` may persist `stepDownTier` for the **next** mission (`createFrameProbe`: `SLOW_FRAME_MS` 28, 8s grace, 6s hold, 250ms hitch clamp). Do not tear the live `createRoot` pipeline mid-fight.

8. **Clocks.** `src/ui/clock.ts`, `missionStore.setClock`, and Opening hour are game clocks, not `THREE.Clock` / `THREE.Timer`. r3f’s internal `THREE.Clock.getDelta()` is frame delta only — do not migrate it to `THREE.Timer` and do not treat it as mission/UTC.

### Architecture Diagram

```
MissionScreen
  GameCanvas (DOM canvas)
    createRoot — glFactory: WebGPURenderer + await init()
      WorldTicker useFrame 0 (first child)
        → world.tick(rawDt)     // clamp/catch-up inside world.ts
      scene graph useFrame 0
        → getWorld() → object3D / pools
      Effects useFrame 1
        → RenderPipeline.render()   // only GPU submit
  Hud (DOM)
    missionStore ~5Hz (SYNC_INTERVAL in world.ts)
    minimap: getWorld() ~10Hz
```

### Key Interfaces

- `getWorld` / `setWorld` — `src/game/runtime.ts`. Live `WorldApi`, not React state.
- `WorldApi.tick(dt)` — `src/game/world.ts`. Owns `MAX_DT` / `MAX_CATCHUP`, opening-second clamp, remainder catch-up, and `SYNC_INTERVAL` HUD push. `WorldTicker` must not pre-clamp `dt`.
- Camera channels on `runtime.ts`: `setCameraFootprint` / `getCameraFootprint` / `setCameraFocus` / `getCameraFocus` / `panCameraTo` / `takeCameraPan`.
- Quality: `resolveTier` / `setMissionTier` / `getMissionTier` / `TIER_PARAMS` / `createFrameProbe` / `stepDownTier` in `src/game/quality.ts`.
- `createRoot` + async `glFactory` returning `THREE.WebGPURenderer`.
- `useFrame` priorities: ticker and scene 0 (WorldTicker first in `SceneTree`); pipeline 1.
- `missionStore` is HUD, not per-frame poses.

## Alternatives Considered

### Alternative 1: Stock r3f `<Canvas>` with an async `gl` factory

- **Description**: Use `<Canvas gl={glFactory}>` instead of `createRoot`.
- **Pros**: Less mount code; the usual r3f example.
- **Cons**: Stock `Canvas` re-runs `configure()` on commit and races `WebGPURenderer.init` (r3f#3782). Children can render against a torn-down dispatcher.
- **Rejection Reason**: Documented race on this pin. `GameCanvas` already exists to avoid it.

### Alternative 2: Imperative three.js, no r3f

- **Description**: Manual scene graph, no reconciler.
- **Pros**: No r3f mount edge cases.
- **Cons**: Rewrite of every `src/scene` component.
- **Rejection Reason**: YAGNI. The scene is already r3f.

## Consequences

### Positive

- Closes TR-interface-004 / TR-interface-005.
- Stops training-data `WebGLRenderer` / `<Canvas>` / `THREE.Clock` suggestions.

### Negative

- `createRoot` + `WeakMap` is more mount code than `<Canvas>`.
- Quality step-down is next-mission, not live.
- `as never` casts and module holders in CONTRACT `runtime.ts` / `quality.ts` stay; they are not “fixed” by this ADR.

### Risks

- r185 premultiplied alpha — opaque background already in `Atmosphere`. Do not transparent-clear.
- Effects `useFrame(..., 1)` is load-bearing. Removing the priority or also calling `gl.render()` double-submits and can wipe bloom.
- `WorldTicker` must remain the first priority-0 subscriber in `SceneTree`.
- Overlapping `configure` during `init` reintroduces #3782. Always `await mount.ready`.
- Do not bump to r3f 9.7 or three r186 in this ADR.
- `FrameGovernor` reads `settingsStore.getState()` in `useFrame` — settings slot, not the ADR-0009 campaign freeze.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| interface.md | TR-interface-004 Per-frame unit data stays out of React; scene reads the world imperatively | `getWorld()` + `useFrame`; `missionStore` is slow HUD (`SYNC_INTERVAL` in `world.ts`) |
| interface.md | TR-interface-005 Mission canvas: `WebGPURenderer` + `await init()` + r3f `createRoot` (not `<Canvas>`) | `GameCanvas` contract |

## Performance Implications

- **CPU**: one `world.tick` + imperative scene mutation per frame. No React reconciliation of unit poses.
- **Memory**: preallocated pools (`Units` / `Fx` / `Rain`). No per-frame React objects for poses.
- **Load Time**: WebGPU pipeline compile. Keep `world.tick` remainder catch-up after `t >= 1` and the opening-second one-step clamp.
- **Network**: none.

## Migration Plan

Document existing code. Stories must not reintroduce stock `<Canvas>`, `renderAsync`, `PostProcessing`, `gl.render()` beside `pipeline.render()`, per-frame pose state, `THREE.Timer` as mission/UTC, or live quality teardown mid-mission. No wholesale rewrite.

## Validation Criteria

- `GameCanvas` has no stock r3f `<Canvas>`.
- `glFactory` awaits `init()`.
- `src/scene` imports `three/webgpu`.
- No `useState` / React store of unit x/z per frame.
- Effects import `RenderPipeline` and submit only from `useFrame` priority 1.
- `WorldTicker` passes raw `dt`; clamp/catch-up tests still live in `world.ts`.
- Clock comments/tests still treat mission/UTC strings as game clocks.

## Related Decisions

- [ADR-0001](adr-0001-two-clocks.md) — two clocks; do not migrate to `THREE.Timer`
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — scene reads `getWorld()`, not campaign stores
- `docs/engine-reference/web/modules/webgpu.md`
- `docs/engine-reference/web/modules/r3f.md`
