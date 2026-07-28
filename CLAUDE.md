# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # vite dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # eslint (flat config, typescript-eslint + react-hooks)
npm run preview   # serve dist/
```

There is no test suite. `npm run lint` and `npm run build` are the checks; run both before calling work done.

## What this is

A browser remake of Syndicate: React 19 + Vite for the DOM screens, react-three-fiber on the three.js WebGPU renderer for the mission scene, zustand for state. `inspiration/*.png` are the art reference the screens are matched against. `ui-ux-improvements.md` is a per-screen backlog written against commit f2ec775, partly worked through.

## Layer split

Four layers, and the boundaries are load-bearing:

- `src/game/` simulation and static data. Pure TypeScript, no React, no three.js. `world.ts` is the whole mission sim (units, movement, combat, enemy FSM, civilians, objectives). Routing lives in `pathfind.ts` (A* on the walk grid, DDA line of sight, straightening); `atlas.ts` holds the world map plate.
- `src/world/citygen.ts` procedural city, deterministic from `mission.seed`. Owns road geometry and the walk grid.
- `src/scene/` three.js rendering under r3f. Reads the world imperatively every frame.
- `src/ui/` DOM screens and the mission HUD. Reads the world through stores, at a low rate.

`src/App.tsx` routes on `appStore.phase`: menu -> world -> research -> brief -> team -> mission -> debrief.

Files whose header comment starts `CONTRACT FILE` carry cross-layer agreements (types, static data, the research tree, the world atlas, key bindings, the four stores, the runtime holder, the screen router, the mission screen). Read the header before changing one.

## How the scene reaches the world

`src/game/runtime.ts` holds the live `WorldApi` and the camera ground footprint in module variables. `setWorld` on mission mount, `getWorld()` everywhere else. This is deliberate: per-frame data (unit positions, tracers, camera pose) never goes through React state or a store.

The two-tier rule:

- Fast, per-frame: read `getWorld()` inside `useFrame` or a rAF loop.
- Slow, ~5Hz: `world.ts` pushes squad rows, objectives, clock and log into `missionStore` every `SYNC_INTERVAL` (0.2s); HUD components subscribe there.

`missionStore` is reset by `MissionScreen` right after `createWorld`, so `world.ts` defers every store write to the first tick (`startup()`).

Four stores: `appStore` (screen flow, squad, credits), `missionStore` (in-mission HUD), `worldStore` (strategic clock, sector control, events feed; the world map and research screens write it through `ui/clock.ts`), `researchStore` (completed projects, what each lab is running).

## Simulation timing

`world.tick(rawDt)` clamps to `MAX_CATCHUP` (5s) and then runs whole `MAX_DT` (0.05s) steps until the delta is spent, rather than dropping the remainder. `worldStore` exports its own `MAX_DT` (0.25s) for the strategy clock; the two names are unrelated. Frames arrive seconds apart while WebGPU pipelines compile, and discarding the excess froze the mission clock. During the first world second it takes one step per frame so the opening is not simulated off screen. Keep both behaviours if you touch `tick`.

## Research and the strategy clock

`ui/clock.ts` (`useWorldClock`) is the only thing that advances world time. Both the world map and research screens mount it; it runs on rAF batched to 20Hz and calls `researchStore.sync`, so labs finish on the same clock that moves the world.

`game/research.ts` carries each node's effects as data, so the screen's benefit lines and the change the mission applies come from one place.

`world.ts` reads `useResearchStore.getState().done` once inside `createWorld` (`crewBonus`, `squadWeapon`), so research never changes a mission already running. It is the only store state the sim reads: `world.ts` also writes `missionStore` (log, squad, objectives, alert, clock, result) and `appStore` (the debrief outcome), but reads nothing back from either.

## three.js conventions

- Import from `three/webgpu`, never `three`. Node material syntax comes from `three/tsl`, addons from `three/addons/...`.
- `GameCanvas.tsx` drives the r3f root through `createRoot` by hand instead of `<Canvas>`. The stock Canvas re-runs `configure()` on every commit, which races the async `WebGPURenderer.init` and produces "Invalid hook call" (pmndrs/react-three-fiber#3782). Do not swap it back for `<Canvas>`.
- Bloom is emissive-only: `Effects.tsx` renders through an MRT emissive target, so anything that should glow needs an emissive material rather than a light.
- The per-frame path allocates nothing. `Units.tsx`, `Fx.tsx` and `Rain.tsx` preallocate pools and buffers and mutate them in place; keep new effects to that pattern.

## Geometry and determinism

- Ground plane is XZ, +Y up, 1 unit = 1 meter. The city is `CITY_SIZE` (96) square, cell `(cx,cz)` spans `[cx, cx+1)`, cell centers sit at `+0.5`. Helpers: `cellIndex`, `isWalkable` in `game/types.ts`.
- `CAMERA_YAW` (PI/4) is fixed and shared: the camera rig orbits at it and the minimap turns by it, so up on the panel is up on screen.
- `citygen.ts` is the single source of road geometry. `scene/textures.ts` and `ui/Minimap.tsx` paint from `city.roadRects`; do not re-derive widths.
- `game/bindings.ts` is the only place a mission key string appears. Scene handlers ask `bindingFor` for an action and switch on its id; the pause menu prints the same list, so the table cannot drift from the handlers. DOM screens keep their own keyboard handling outside it (Enter and Space on research nodes, Tab in the pause menu, arrows and Home/End on the world map timeline); those keys do not belong in the mission table. One mission literal survives: `scene/Input.tsx:143` checks `code === 'Space'` to let a focused dialog button take the press, and that guard goes stale if the pause action is ever moved off Space.
- Randomness is always seeded. `mulberry32` from `game/rng.ts` for world and city, `hashOf`/`rngFrom` in `ui/util.ts` for portraits and figures, so an operative always renders the same face.

## No external assets

Everything is generated in code: WebAudio synthesis (`game/audio.ts`), CanvasTexture builders (`scene/textures.ts`), SVG portraits and figures (`ui/portrait.tsx`, `ui/figure.tsx`), UI glyphs (`ui/bits.tsx`). Keep it that way rather than adding files under a public/ dir.

`ui/sound.ts` loads the audio module lazily and swallows failure on purpose; it must not import `game/audio.ts` at typecheck time.

## Styling

`src/index.css` holds the design tokens (`--teal`, `--amber`, `--ink`, ...); `src/ui/ui.css` holds screen styles. Canvas-drawn UI (the minimap) hardcodes hexes that mirror those tokens, so a palette change needs both.

Screens are checked at 1280x720; content clipping and truncation at that size counts as a bug.

## Commits

Imperative subject line, then a body that says what changed by file, why, and what was verified (lint, build, the click-through). Reference issues with `Closes #N`.
