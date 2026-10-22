# Frame-time pass, working notes (2026-10-22)

Working notes, appended as the pass goes. The final record will be `README.md` in this folder.

## Scope note: no `src/` edits by the performance analyst

The performance-analyst role does not implement optimizations and does not edit existing source without the user's own approval; an agent message is not that approval. So this pass does not change `src/` in the repo. Instead:
- profiling and the baseline are done on the repo tree at HEAD `979b855`;
- each candidate fix is prototyped in a **scratch copy** of the repo (outside the project) and measured with the same harness on port 4215;
- the measured patch is handed over for the owning programmer to apply after the user approves it.

## Setup facts (verified)

- Two displays are attached: built-in Liquid Retina XDR (120 Hz) and an LG ULTRAWIDE (`system_profiler SPDisplaysDataType`). The Chrome for Testing window lands on either, run to run. Baseline runs 1-3 and the profiling runs had p50 6.2 ms (160 Hz class); the blank-page reference runs had p50 8.3 ms (120 Hz). **Only compare runs with the same p50.** `lib.mjs` must stay unchanged, so the window position is not pinned.
- Baseline (`baseline/perf-run1..3.json`, HEAD 979b855, dev server :4215): world p95 6.8 / 6.6 / 6.6, mission 6.5 / 6.5 / 6.4, brief max 37.6 / 37.4 / 36.8, mission-entry long task 260 / 265 / 259 ms, world-return long task 149 / 153 / 153 ms.

## Finding 1: steady World Network p95 is the browser's rAF jitter floor, not game work

Evidence:
- CDP trace, 5 s of World Network at 8X (`world-steady`): renderer main thread busy 392 ms of 5017 ms (7.8 %), GPU process main 104 ms (2.1 %), compositor 85 ms. Task p95 0.44 ms, p99 1.88 ms.
- rAF deltas alternate late/early (e.g. `5.8 6.7 5.8 6.8`), pairs summing to ~2 vsync intervals: that is timestamp jitter, not missed frames.
- In-page conditions, World Network, 6 s windows x 2 (`jitter.mjs`, 160 Hz): 8X p95 6.7; clock **paused** (no store ticks, no React commits, no globe redraws) p95 6.7 / 6.7; globe canvas hidden 6.7 / 6.7; marker layer hidden 6.6 / 6.7; paused + canvas hidden 6.7 / 6.8.
- An **empty `data:` page** in the same browser (120 Hz window): p95 9.1 / 9.2 / 9.2, p99 9.3 / 9.4 / 9.3 (`blank.mjs`). The 2026-10-22 reprofile's World Network p95 at 120 Hz was 9.1 / 9.2 / 9.7.

Conclusion: at 120 Hz an empty page measures p95 9.1-9.2 ms with this harness. A World Network p95 of <= 9.0 ms in every run is below what an empty page reaches, so no game change can deliver it. Mission is the same story (main thread 28.5 % busy, GPU 24.3 % in `mission-steady`, still under one vsync per frame).

What the clock does cause: 1-3 frames over 1.5 vsync per 6 s at 8X, 0 when paused. They do not move p95. Cause seen in the trace: occasional whole-`WorldMap` React commits of ~18 ms (dev build), about 2/3 of it `jsxDEV` (React dev-only element creation).

## Finding 2: Brief 33-37 ms frame = the click that mounts the Brief

- Trace task 32.1 ms, `EventHandler::handleMouseReleaseEvent` -> React commit. CPU inside: `jsxDEV` 8.7 ms self (dev-only), `scrollHeight` forced layout 4.1 ms (`bits.tsx:54-87`, ScrollBox measuring), `buildTacticalMap` 4.7 ms inclusive (`briefMap.ts:50`: `generateCity` + `findPath` run during render), DOM removal of the World Network tree.
- The Assembly (team) 25 ms max is the same pattern on ACCEPT CONTRACT (23 ms task).

## Finding 3: mission-entry 260-300 ms = first `RenderPipeline.render()` building every node material

- Trace task 303.6 ms, r3f `loop` -> `Effects.tsx:41` 259 ms inclusive. Self time in three/webgpu node builder (`build`, `analyze`, `getDataFromNode`, `_getChildren`, `getNodeType`) plus GC 17 ms. Units' `createAgentResources` ~18 ms. The preceding 26.9 ms task is `buildCity` (`CityView.tsx:26`).

## Finding 4: Debrief -> World Network return 150-160 ms = Earth texture upload + shader link

- Trace task 157.6 ms, globe r3f `loop` first render: `texSubImage2D` 127.5 ms self (incl. `ImageDecoder` 27.9 ms decode and `CommandBufferProxyImpl::WaitForToken` 84.9 ms), `getProgramInfoLog` 21.8 ms (sync shader link wait).
- `public/textures/earth/blue-marble.jpg` is 5400 x 2700 (2.3 MB JPEG, ~58 MB RGBA). The globe `<Canvas>` remounts on each World Network entry, so the upload repeats every return.

## Wasted React work seen (cheap, not frame-limiting)

- `ScreenStats` (`Nav.tsx:22`) subscribes to `t` and re-renders at 20 Hz with 4 `NavGlyph` even in the World variant, which does not show `t`.
- `WorldScan.operations` (`WorldMap.tsx:331`) depends on `sectors`, which changes every tick, so `GlobeView` and the r3f `<Canvas>` re-render at 20 Hz (1228 renders in ~64 s).

## Candidate fixes (to prototype in the scratch copy and measure)

1. Return spike: decode the Earth image off the main thread before first use (e.g. `await image.decode()` in the loader path, or `ImageBitmapLoader` with matching flip/colour-space). Visual no-op if orientation and colour space match; must be checked by screenshot.
2. Brief frame: memoise / defer `buildTacticalMap` out of the click commit; check the ScrollBox `scrollHeight` read.
3. Mission entry: `renderer.compileAsync(scene, camera)` before the first `pipeline.render()`; expected to move, not remove, the node-build CPU. Load moment; lowest priority.
