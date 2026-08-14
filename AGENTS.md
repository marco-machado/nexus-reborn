# Nexus Reborn

Browser game inspired by Syndicate: React 19 + Vite for the DOM screens, react-three-fiber on the three.js WebGPU renderer for the mission scene, zustand for state. `inspiration/*.png` are the art reference the screens are matched against.

Design: [`docs/game-design.md`](docs/game-design.md) — economy, contracts, research tree, or mission rules. Code wins when they disagree.

## Done

Scripts live in `package.json`. Run `npm run lint`, `npm run test`, and `npm run build` before calling code work done. Tests sit next to their module and cover `src/game/`, `src/world/`, `src/state/`.

Click-through: [`docs/click-through.md`](docs/click-through.md) — rendering, screen flow, input, or persisted state. Name the screens actually exercised if the run is partial.

## Layers

Boundaries are load-bearing:

- `src/game/` — simulation and static data. Pure TypeScript, no React, no three.js. `world.ts` is the mission sim; `pathfind.ts` is routing; `atlas.ts` is the world map plate. Deploy mass, mission variants, abilities, and quality live in sibling modules.
- `src/world/citygen.ts` — procedural city, deterministic from `mission.seed`. Owns road geometry and the walk grid.
- `src/state/` — Zustand stores and the versioned campaign save.
- `src/scene/` — three.js under r3f. Reads the world imperatively every frame.
- `src/ui/` — DOM screens and the mission HUD.

`src/App.tsx` routes on `appStore.phase`: menu → world → research → brief → team → mission → debrief. Settings, Balance, pause, and tutorial toasts are overlays on the current phase.

Contracts: files whose header starts `CONTRACT FILE` — shared types, static data, stores, runtime, router, mission lifecycle. Discover with `rg -l '^// CONTRACT FILE' src`. Read the header before changing one.

## World access

`src/game/runtime.ts` holds the live `WorldApi` and the camera ground footprint. `setWorld` on mission mount, `getWorld()` everywhere else. Per-frame data (unit positions, tracers, camera pose) stays out of React state.

Two-tier:

- Fast, per-frame: `getWorld()` inside `useFrame` or a rAF loop.
- Slow, ~5Hz: `world.ts` pushes squad rows, objectives, clock, and log into `missionStore` every `SYNC_INTERVAL` (0.2s). HUD components subscribe there. The canvas minimap reads the live world on its own throttled loop; imperative HUD controls call the world directly.

`MissionScreen` snapshots sector, replay, and loadout into `createWorld`, then resets `missionStore`. `world.ts` defers every store write to the first tick (`startup()`).

`createWorld` reads `researchStore.done` once (`crewBonus`, `squadWeapon`), so research cannot change a mission already running. Orders also read `missionStore.live`, `paused`, and `result`. The sim writes `missionStore`, `appStore` (the debrief outcome), and `tutorialStore` (`noteTutorial` / `fireTutorialHint`).

Seven stores, split by lifetime and rate: `appStore` (flow, squad, outcome), `missionStore` (HUD, pause), `worldStore` (clock, sectors, contracts), `researchStore`, `campaignStore` (roster, injuries, recruits), `tutorialStore`, `settingsStore`. The campaign save composes app, world, research, campaign, and tutorial. Settings and telemetry persist separately.

## Time

`world.tick(rawDt)` clamps to `MAX_CATCHUP` (5s) and spends the remainder in whole `MAX_DT` (0.05s) steps. `worldStore` exports its own `MAX_DT` (0.25s) for the strategy clock; the two names are unrelated. Frames arrive seconds apart while WebGPU pipelines compile, and dropping the remainder froze the mission clock. During the first world second it takes one step per frame so the opening is not simulated off screen. Keep both behaviours if you touch `tick`.

World time has two advancement paths:

- Continuous: world map and research mount `ui/clock.ts` (`useWorldClock`). rAF batched to 20Hz, ticks `worldStore`, then `researchStore.sync(t)` and `campaignStore.sync(t)`.
- Contract ETA: after a win, the debrief calls `worldStore.advanceDays(etaDays)`, then syncs research and campaign to the new time.

Any new way to advance `worldStore.t` must catch up research labs, injury recovery, and recruitment at the resulting time.

`game/research.ts` carries each node's effects as data, so the screen's benefit lines and the change the mission applies come from one place.

## Scene

- Import from `three/webgpu`, node materials from `three/tsl`, addons from `three/addons/...`.
- `GameCanvas.tsx` drives the r3f root through `createRoot`. The stock `<Canvas>` re-runs `configure()` on every commit, which races `WebGPURenderer.init` (pmndrs/react-three-fiber#3782).
- Bloom is emissive-only (`Effects.tsx` MRT emissive target): anything that should glow uses an emissive material.
- `GameCanvas` resolves the quality tier once per mission from `settingsStore` via `game/quality.ts`.
- Hot per-frame rendering reuses preallocated pools and buffers (`Units.tsx`, `Fx.tsx`, `Rain.tsx`). Event-driven allocation stays bounded.

## Geometry and determinism

- Ground plane is XZ, +Y up, 1 unit = 1 meter. The city is `CITY_SIZE` (96) square; cell `(cx,cz)` spans `[cx, cx+1)`; centers sit at `+0.5`. Helpers: `cellIndex`, `isWalkable` in `game/types.ts`.
- `CAMERA_YAW` (`PI/4`) is shared: the camera rig orbits at it and the minimap turns by it, so up on the panel is up on screen.
- `citygen.ts` is the source of road geometry. `scene/textures.ts` and `ui/Minimap.tsx` paint from `city.roadRects`.
- `game/bindings.ts` is the only place a mission key string appears. Scene handlers switch on `bindingFor`; the pause menu prints the same table. DOM screens keep their own keys (Enter/Space on research nodes, Tab in the pause menu, arrows and Home/End on the world map timeline). The one mission-side exception is `Input.tsx` letting a focused dialog button keep Space.
- Gameplay, campaign, and procedural content use seeded RNG: `mulberry32` from `game/rng.ts` for simulation and campaign generation, `hashOf` / `rngFrom` in `ui/util.ts` for portraits and figures. Presentation-only rain and audio may use `Math.random()`.

## Assets and styling

Everything is generated in code: WebAudio (`game/audio.ts`), CanvasTextures (`scene/textures.ts`), SVG portraits and figures (`ui/portrait.tsx`, `ui/figure.tsx`), UI glyphs (`ui/bits.tsx`). Add no files under a `public/` dir.

`ui/sound.ts` loads the audio module lazily and swallows failure; it must not import `game/audio.ts` at typecheck time.

`src/index.css` holds the design tokens (`--teal`, `--amber`, `--ink`, …); `src/ui/ui.css` holds screen styles. The minimap hardcodes hexes that mirror those tokens, so a palette change needs both. Screens are checked at 1280×720; clipping or truncation at that size is a bug.

## Commits

Imperative subject line, then a body that says what changed by file, why, and what was verified (lint, build, the click-through). Reference issues with `Closes #N`.
