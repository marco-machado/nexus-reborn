# R1–R3 before/after (2026-10-22)

## What changed (uncommitted at the time of these runs)

**R1: Earth texture** (`src/ui/WorldGlobe.tsx`)
- The 5400×2700 Earth image now loads through `ImageBitmapLoader`, with `imageOrientation: 'flipY'` and `texture.flipY = false`. Previously it loaded through `TextureLoader`.
- The decoded bitmap stays in the r3f loader cache across World Network visits.

**R2: tactical map** (`src/ui/briefMap.ts`, `src/ui/index.tsx`, `src/ui/WorldMap.tsx`)
- `tacticalMapFor` caches `buildTacticalMap` by mission, layout and generation inputs (16 entries).
- World Network builds the maps for openable contracts in idle time, one per idle slot, so opening the Brief can skip the build.
- R2's second part, moving the scroll-fade read after paint, was not made. The read forces one layout that the browser needs before paint anyway, so moving it saves nothing.

**R3: re-renders** (`src/ui/Nav.tsx`, `src/ui/WorldMap.tsx`, `src/ui/WorldGlobe.tsx`)
- The header clock chip now subscribes to the clock on its own, so World Network's header no longer re-renders on each tick.
- WorldScan keeps the previous operations list while every field the globe shows is unchanged.
- The open handler is a stable `useCallback`, and `WorldGlobe` is wrapped in `memo`.

## Method

- **Script:** `perf.mjs` and `lib.mjs` copied from `../../wn-p95-reprofile-2026-10-22/`. This copy adds `TAG`, two World Network screenshots per run, and a per-phase `dropped` count (frames over 1.5 × p50).
- **Runs:** six, interleaved in one session: before-1, after-1, before-2, after-2, before-3, after-3. Each "before" run stashed the five `src/ui` files; each "after" run popped them back.
- **Server:** `preview_start dev` on port 4200, headed Chrome for Testing at 1280×720. The in-app pane was pointed at a static file, but its tab still reported `localhost:4200`.
- **before-1 is excluded.** It ran at about 160 Hz (p50 6.2 ms); every other run ran at 120 Hz (p50 8.3 ms).

## Results

All runs: exit 0, mission won, 0 errors. Lint, build and `npm test` (1,627 of 1,627) pass on the after tree.

| Phase | before-2 / before-3 | after-1 / after-2 / after-3 |
|---|---|---|
| World p95 | 9.2 / 9.9 | 9.3 / 9.8 / 9.9 |
| World dropped frames | 20 / 22 | 20 / 18 / 20 |
| Brief max | 24.2 / 25.0 | 32.5 / 33.3 / 33.3 |
| Mission p95 | 9.2 / 9.8 | 9.2 / 9.6 / 9.8 |
| World-return long task (ms) | 163 / 187 | 167 / 143 / 133 |
| Mission-entry long task (ms) | 276 / 264 | 265 / 266 / 265 |

**Reading**
- **World p95, mission p95, dropped frames:** no measurable change.
- **World-return task:** 175 ms mean before, 148 ms mean after, but the ranges overlap (163–187 against 133–167). With n = 2 before and 3 after, this is not a demonstrated improvement.
- **Brief max:** after reads 4 refreshes (~33 ms) where before-2/3 read 3 refreshes (~25 ms). The earlier reprofile on the unchanged tree also read 33.2–33.3 ms, so this is within run noise and is not shown to be a regression or an improvement. The idle warm build was not confirmed to have completed before the Brief click in these runs.

## Visual check (R1)

`before-2-world-first.png` and `after-2-world-first.png` were compared by eye, and `after-3-world-return.png` was viewed on its own. The globe's orientation and colours look the same. No pixel diff was taken because no image tool is installed.
