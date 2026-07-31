# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # vite dev server on :5173
npm run build     # tsc -b && vite build
npm run lint      # eslint (flat config, typescript-eslint + react-hooks)
npm run test      # vitest, colocated src/**/*.test.ts
npm run preview   # serve dist/
```

`npm run lint`, `npm run test` and `npm run build` are the automated checks; run all three before calling code work done. Tests sit next to their module (`src/game/world.test.ts` tests `src/game/world.ts`) and cover the pure layers: `src/game/`, `src/world/`, `src/state/`. Scene and DOM screens are unchecked by automation, so do the manual click-through below when a change can affect rendering, screen flow, input, or persisted state.

### Manual click-through

Run `npm run dev`, open the app at exactly 1280x720, and keep the browser console visible. Use a clean browser profile if the check must not alter an existing local save.

1. Load the main menu, open and close Settings, then start a New Operation or Continue a saved one.
2. On the world map, pause and resume the clock, change speed, open Research from the bottom navigation, inspect a project, and return to the world map.
3. Select an unlocked contract, proceed through the mission brief and team assembly, and deploy a valid squad.
4. In the mission, select an operative, issue a move order, use the minimap, pause, open and close Settings, and resume. Confirm the canvas, HUD, minimap, and input remain live without console errors.
5. Finish the mission and inspect the debrief. Continue back to the world map; after a win, confirm the contract ETA advanced world time and research, injuries, and recruitment caught up to the new time.
6. On every visited screen, check for clipping, unintended overlap, unreadable text, and broken focus or keyboard navigation at 1280x720.

A full click-through means completing all six steps. If only a smaller smoke test was run, name the exact screens and interactions in the handoff or commit body rather than calling it a full click-through.

## What this is

A browser remake of Syndicate: React 19 + Vite for the DOM screens, react-three-fiber on the three.js WebGPU renderer for the mission scene, zustand for state. `inspiration/*.png` are the art reference the screens are matched against.

## Layer split

Four layers, and the boundaries are load-bearing:

- `src/game/` simulation and static data. Pure TypeScript, no React, no three.js. `world.ts` is the whole mission sim (units, movement, combat, enemy FSM, civilians, objectives). Routing lives in `pathfind.ts` (A* on the walk grid, DDA line of sight, straightening); `atlas.ts` holds the world map plate.
- `src/world/citygen.ts` procedural city, deterministic from `mission.seed`. Owns road geometry and the walk grid.
- `src/scene/` three.js rendering under r3f. Reads the world imperatively every frame.
- `src/ui/` DOM screens and the mission HUD. Display state generally comes through stores at a low rate; the canvas minimap reads the live world on its own throttled loop, and imperative HUD controls call the live world directly.

`src/App.tsx` routes on `appStore.phase`: menu -> world -> research -> brief -> team -> mission -> debrief.

Files whose header comment starts `CONTRACT FILE` carry cross-layer agreements. This currently covers shared types and static/gameplay data (abilities, contracts, mission parameters, recruitment, research, the world atlas, and key bindings), the cross-layer stores (`appStore`, `campaignStore`, `missionStore`, `researchStore`, and `worldStore`), the runtime holder, the screen router, and the mission lifecycle. Read the header before changing one. Because the set grows with the architecture, discover the authoritative list with `rg -l '^// CONTRACT FILE' src` instead of relying only on this summary.

## How the scene reaches the world

`src/game/runtime.ts` holds the live `WorldApi` and the camera ground footprint in module variables. `setWorld` on mission mount, `getWorld()` everywhere else. This is deliberate: per-frame data (unit positions, tracers, camera pose) never goes through React state or a store.

The two-tier rule:

- Fast, per-frame: read `getWorld()` inside `useFrame` or a rAF loop.
- Slow, ~5Hz: `world.ts` pushes squad rows, objectives, clock and log into `missionStore` every `SYNC_INTERVAL` (0.2s); HUD components subscribe there.

`missionStore` is reset by `MissionScreen` right after `createWorld`, so `world.ts` defers every store write to the first tick (`startup()`).

Seven Zustand stores divide state by lifetime and update rate:

- `appStore`: screen flow, selected mission and squad, loadout, credits, and the latest outcome.
- `missionStore`: transient in-mission HUD, selection, pause state, objectives, and log.
- `worldStore`: strategic clock, sector control, events, and contract market.
- `researchStore`: completed projects and running labs.
- `campaignStore`: intel, contract history, live roster, injuries, and recruitment.
- `tutorialStore`: persisted campaign tutorial progress and transient hint toasts.
- `settingsStore`: separately persisted audio, controls, accessibility, telemetry, and renderer quality settings.

The versioned campaign save composes app, world, research, campaign, and tutorial state. Settings and local telemetry use separate storage lifecycles.

## Simulation timing

`world.tick(rawDt)` clamps to `MAX_CATCHUP` (5s) and then runs whole `MAX_DT` (0.05s) steps until the delta is spent, rather than dropping the remainder. `worldStore` exports its own `MAX_DT` (0.25s) for the strategy clock; the two names are unrelated. Frames arrive seconds apart while WebGPU pipelines compile, and discarding the excess froze the mission clock. During the first world second it takes one step per frame so the opening is not simulated off screen. Keep both behaviours if you touch `tick`.

## Research and the strategy clock

World time has two authoritative advancement paths:

- Continuous strategy time: the world map and research screens mount `ui/clock.ts` (`useWorldClock`). It runs on rAF batched to 20Hz, ticks `worldStore`, then calls both `researchStore.sync(t)` and `campaignStore.sync(t)`.
- Contract ETA jumps: after a won mission, the debrief in `ui/index.tsx` calls `worldStore.advanceDays(etaDays)`, then immediately synchronizes both research and campaign state to the advanced time.

Preserve both paths. Any new way to advance `worldStore.t` must also catch up research labs, injury recovery, and recruitment at the resulting time.

`game/research.ts` carries each node's effects as data, so the screen's benefit lines and the change the mission applies come from one place.

`world.ts` reads `useResearchStore.getState().done` once inside `createWorld` (`crewBonus`, `squadWeapon`), so research never changes a mission already running. It is the only store state whose value the simulation consumes. The simulation writes `missionStore` (log, squad, objectives, alert, clock, result), `appStore` (the debrief outcome), and `tutorialStore` through `noteTutorial`/`fireTutorialHint`; it does not consume values returned from those stores.

## three.js conventions

- Import from `three/webgpu`, never `three`. Node material syntax comes from `three/tsl`, addons from `three/addons/...`.
- `GameCanvas.tsx` drives the r3f root through `createRoot` by hand instead of `<Canvas>`. The stock Canvas re-runs `configure()` on every commit, which races the async `WebGPURenderer.init` and produces "Invalid hook call" (pmndrs/react-three-fiber#3782). Do not swap it back for `<Canvas>`.
- Bloom is emissive-only: `Effects.tsx` renders through an MRT emissive target, so anything that should glow needs an emissive material rather than a light.
- Hot per-frame rendering should avoid steady-state allocation. `Units.tsx`, `Fx.tsx` and `Rain.tsx` preallocate their main pools and buffers and mutate them in place, although bounded event-driven or first-use allocations still exist. Do not add allocations that occur for every unit or effect on every frame; reuse temporary vectors, objects, arrays, and buffers. Keep any event-driven allocation bounded and explain why it is safe.

## Geometry and determinism

- Ground plane is XZ, +Y up, 1 unit = 1 meter. The city is `CITY_SIZE` (96) square, cell `(cx,cz)` spans `[cx, cx+1)`, cell centers sit at `+0.5`. Helpers: `cellIndex`, `isWalkable` in `game/types.ts`.
- `CAMERA_YAW` (PI/4) is fixed and shared: the camera rig orbits at it and the minimap turns by it, so up on the panel is up on screen.
- `citygen.ts` is the single source of road geometry. `scene/textures.ts` and `ui/Minimap.tsx` paint from `city.roadRects`; do not re-derive widths.
- `game/bindings.ts` is the only place a mission key string appears. Scene handlers ask `bindingFor` for an action and switch on its id; the pause menu prints the same list, so the table cannot drift from the handlers. DOM screens keep their own keyboard handling outside it (Enter and Space on research nodes, Tab in the pause menu, arrows and Home/End on the world map timeline); those keys do not belong in the mission table. One mission literal survives: `scene/Input.tsx:143` checks `code === 'Space'` to let a focused dialog button take the press, and that guard goes stale if the pause action is ever moved off Space.
- Gameplay, campaign, and procedural-content randomness is always seeded. Use `mulberry32` from `game/rng.ts` for simulation and campaign generation and `hashOf`/`rngFrom` in `ui/util.ts` for stable portraits and figures, so the same seed and operative identity reproduce the same result. Presentation-only rain and audio variation may use `Math.random()` and need not be replay-stable; do not introduce unseeded randomness into simulation, city generation, campaign state, portraits, or generated maps.

## No external assets

Everything is generated in code: WebAudio synthesis (`game/audio.ts`), CanvasTexture builders (`scene/textures.ts`), SVG portraits and figures (`ui/portrait.tsx`, `ui/figure.tsx`), UI glyphs (`ui/bits.tsx`). Keep it that way rather than adding files under a public/ dir.

`ui/sound.ts` loads the audio module lazily and swallows failure on purpose; it must not import `game/audio.ts` at typecheck time.

## Styling

`src/index.css` holds the design tokens (`--teal`, `--amber`, `--ink`, ...); `src/ui/ui.css` holds screen styles. Canvas-drawn UI (the minimap) hardcodes hexes that mirror those tokens, so a palette change needs both.

Screens are checked at 1280x720; content clipping and truncation at that size counts as a bug.

## Commits

Imperative subject line, then a body that says what changed by file, why, and what was verified (lint, build, the click-through). Reference issues with `Closes #N`.
