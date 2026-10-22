# Frame-time pass (2026-10-22)

Profile of World Network, Brief, mission and the two load spikes at HEAD `979b855`, to find what the frame-time numbers are made of. `NOTES.md` has the working notes.

## What this pass did and did not do

- **Done:** 3 baseline runs, a CDP trace profile of one full loop, React commit/render counts per phase, a World Network jitter experiment, an empty-page rAF reference, and lint/build/test on the tree.
- **Not done: no `src/` change, so there are no after runs.** The performance-analyst role recommends and assigns. It does not implement optimizations, and it does not edit existing source without the user's own approval. An agent instruction does not count as that approval. `after/` holds the unchanged harness copies, ready for the run once a fix lands. Because no fix was applied, nothing below has a measured "after" effect.
- `git status`: only the untracked evidence folders. `src/` is unchanged.

## Setup

- Repo at HEAD `979b855`, `npm run dev -- --strictPort --port 4215`, `SMOKE_URL=http://localhost:4215/`. The server was stopped afterwards. No listener on 4215 or 4200, and no Chrome for Testing or vite process left (`lsof`, `pgrep`).
- Harness: `baseline/perf.mjs` and `baseline/lib.mjs`, copied unchanged from `../wn-p95-reprofile-2026-10-22/`. Headed Chrome for Testing (chromium-1247), 1280×720.
- **Two displays are attached:** the built-in Liquid Retina XDR and an LG ULTRAWIDE (`system_profiler SPDisplaysDataType`). The test window opened at a 160 Hz-class rate (p50 6.2 ms) for the baseline and profiling runs, and at 120 Hz (p50 8.3 ms) for the empty-page reference. The earlier reprofile runs were also at 120 Hz. So **today's baseline numbers cannot be compared with the 120 Hz runs in `../wn-p95-reprofile-2026-10-22/`.** `lib.mjs` must stay unchanged, so the window position is not pinned. Any after run has to be checked for the same p50 before it is compared.

## Baseline (3 runs, back to back; ms)

| Run | Phase | n | p50 | p95 | p99 | max | >50 ms |
|---|---|---|---|---|---|---|---|
| 1 | world | 8336 | 6.2 | 6.8 | 7.0 | 150.0 | 1 |
| 1 | brief | 113 | 6.3 | 6.4 | 25.0 | 37.6 | 0 |
| 1 | team | 134 | 6.3 | 6.7 | 6.9 | 25.0 | 0 |
| 1 | mission | 12124 | 6.3 | 6.5 | 6.9 | 281.3 | 1 |
| 1 | debrief | 621 | 6.2 | 6.7 | 6.9 | 7.0 | 0 |
| 2 | world | 8337 | 6.2 | 6.6 | 7.0 | 156.3 | 1 |
| 2 | brief | 113 | 6.2 | 6.7 | 25.0 | 37.4 | 0 |
| 2 | team | 134 | 6.2 | 6.6 | 7.0 | 25.1 | 0 |
| 2 | mission | 12182 | 6.2 | 6.5 | 6.9 | 293.9 | 1 |
| 2 | debrief | 617 | 6.2 | 6.5 | 6.9 | 12.5 | 0 |
| 3 | world | 8345 | 6.2 | 6.6 | 6.9 | 156.2 | 1 |
| 3 | brief | 115 | 6.3 | 6.7 | 18.7 | 36.8 | 0 |
| 3 | team | 134 | 6.2 | 6.5 | 7.0 | 25.0 | 0 |
| 3 | mission | 12352 | 6.3 | 6.4 | 6.9 | 287.5 | 1 |
| 3 | debrief | 619 | 6.2 | 6.6 | 7.0 | 7.0 | 0 |

Long tasks (phase, ms): run 1 `?` 179, `?` 156, mission 260, world 149; run 2 `?` 169, `?` 164, mission 265, world 153; run 3 `?` 162, `?` 153, mission 259, world 153. All three runs: mission won, ETA 3 days, 0 errors. The one world frame over 50 ms in each run is the Debrief → World Network return. The one mission frame over 50 ms is mission entry.

After runs: none (see above).

## Causes found

### 1. Steady World Network (and mission) p95 is the browser's rAF jitter floor, not game work

- **Trace, 5 s of World Network at 8X** (`profiling/profile.mjs`, `threads.cjs`, `an.cjs`):
  - renderer main thread busy 392 of 5017 ms (7.8 %), task p95 0.44 ms, p99 1.88 ms;
  - GPU process main thread 104 ms (2.1 %);
  - compositor 85 ms (1.7 %).
- **rAF deltas alternate late and early**, for example `5.8 6.7 5.8 6.8`, and the median late-plus-next pair is about 2 vsync intervals (12.9 ms). The times are jittered, but no frames are dropped.
- **World Network conditions** (`profiling/jitter.mjs`, 6 s windows, two passes, 160 Hz), p95 in ms:

  | Condition | p95 |
  |---|---|
  | 8X | 6.7 |
  | Clock paused (no store ticks, no React commits, no globe redraws) | 6.7 / 6.7 |
  | Globe canvas hidden | 6.7 / 6.7 |
  | Marker layer hidden | 6.6 / 6.7 |
  | Paused and canvas hidden | 6.7 / 6.8 |

  Switching the game's work off does not move p95. The first 8X window, right after New Operation, read 8.3, and its repeat read 6.7.
- **Empty `data:` page in the same browser** at 120 Hz (`profiling/blank.mjs`): p95 9.1 / 9.2 / 9.2 ms, p99 9.3 / 9.4 / 9.3 ms. The 120 Hz reprofile's World Network p95 was 9.1 / 9.2 / 9.7 ms.
- **Mission trace** (5 s mid-mission): main thread 28.5 % busy, GPU process 24.3 %. Per-frame work is well under one vsync interval.

**Conclusion.** With this harness, an empty page at 120 Hz measures p95 9.1–9.2 ms. A World Network p95 of ≤ 9.0 ms in every run is below what an empty page reaches. No game-side change can deliver it, so no fix is proposed for target (1). The run-3 9.7 ms in the reprofile was not reproduced here. That reprofile had the in-app browser pane open on :4200 during its runs, and this pass did not test whether that matters.

The game clock does cost something real at 8X: 1–3 frames over 1.5 vsync per 6 s window, against 0 with the clock paused. These dropped frames do not move p95. The trace shows the cause: occasional whole-`WorldMap` React commits of about 18 ms on the dev build. In one of them, 11.7 ms was `jsxDEV` self time, which is React's development-only element creation.

### 2. Brief 33–37 ms frame = the click commit that mounts the Brief

- Trace task 32.1 ms (`EventHandler::handleMouseReleaseEvent` → React commit). CPU inside it:
  - `jsxDEV` 8.7 ms self (dev build only);
  - forced layout through `scrollHeight` 4.1 ms (`useScrollEdge` / `ScrollBox`, `src/ui/bits.tsx` ~lines 39–60);
  - `buildTacticalMap` 4.7 ms inclusive (`src/ui/briefMap.ts:50`; runs `generateCity` and `findPath` during the commit);
  - `MissionBrief` render 16.3 ms inclusive (`src/ui/index.tsx:498`);
  - unmounting the World Network DOM.
- In the baseline runs, the Brief p99 of 25.0 ms is the second-longest Brief frame (n = 113), so p99 and max are both the transition.
- The Assembly max of 25 ms is the same pattern on ACCEPT CONTRACT (23.0 ms task).
- React commits in Brief: 17 for the whole phase. The phase has no steady re-render problem.

### 3. Mission-entry spike = first `RenderPipeline.render()` builds every node material

- Trace task 303.6 ms: r3f `loop` → `Effects.tsx:41` (`pipeline.render()`), 258.8 ms inclusive.
- Most of the self time is in the three/webgpu node builder (`build`, `getDataFromNode`, `_getChildren`, `analyze`, `getNodeType`), plus 17.5 ms of GC. `createAgentResources` (`src/scene/agentModel.ts:323`) adds about 18 ms.
- The task just before it (26.9 ms) is `buildCity` (`src/scene/CityView.tsx:26`).

### 4. Debrief → World Network return spike = Earth texture upload plus shader link

- Trace task 157.6 ms, the globe's first r3f render:
  - `texSubImage2D` 127.5 ms self, which includes `ImageDecoder::DecodeFrameBufferAtIndex` 27.9 ms (JPEG decode on the main thread) and `CommandBufferProxyImpl::WaitForToken` 84.9 ms (waiting on the GPU process);
  - `getProgramInfoLog` 21.8 ms (synchronous shader link wait).
- `public/textures/earth/blue-marble.jpg` is 5400×2700 (2.3 MB JPEG). The globe `<Canvas>` (`src/ui/WorldGlobe.tsx`) remounts on every World Network entry, so decode and upload repeat on every return. The untagged `?` long tasks of 153–179 ms at app start are probably the same first upload. That has not been confirmed by a trace.

### Wasted React work (seen, not frame-limiting)

- `ScreenStats` (`src/ui/Nav.tsx:22`) subscribes to `t` and re-renders at 20 Hz, with 4 `NavGlyph`, even in the World variant, which never shows `t`.
- `WorldScan`'s `operations` memo (`src/ui/WorldMap.tsx:331`) depends on `sectors`, which changes every tick. So `GlobeView` and the r3f `<Canvas>` re-render at the 20 Hz clock rate: 1228 renders in about 64 s of World Network.
- `FeedRow` rendered 14,553 times in the same window (about 12 per commit).

## Recommendations (not applied; owner implements after the user approves)

| # | Target | Change | Expected effect | Owner |
|---|---|---|---|---|
| R1 | Return spike, and probably the start-up `?` task | Decode the Earth image off the main thread before first upload (`image.decode()` before handing it to the texture, or `ImageBitmapLoader`/`createImageBitmap` with matching flip and colour space). Keep the decoded source across World Network mounts. | Removes the ~28 ms decode from the frame. The ~85 ms GPU upload stays unless the GL context outlives the screen. Must be checked by screenshot for orientation and colour. | ui-programmer (WorldGlobe) |
| R2 | Brief frame | Take `buildTacticalMap` out of the click commit (memoise per mission id, or compute when the contract is selected). Check whether `useScrollEdge` can read `scrollHeight` after paint (rAF) rather than in the layout effect. | Up to ~4.7 ms + ~4.1 ms off a 32 ms task. At 120 Hz the frame drops one vsync only if the total falls under 25 ms, so this may not show in max. | ui-programmer |
| R3 | 8X dropped frames | Stop `ScreenStats` (World variant) subscribing to `t`. Key `operations` on the values the globe shows, not the whole `sectors` object. Find what triggers the whole-`WorldMap` commits. | Fewer 20 Hz re-renders and fewer 1–3-per-6 s dropped frames. No p95 change is expected (see cause 1). | ui-programmer |
| R4 | Mission entry | `renderer.compileAsync(scene, camera)` before the first `pipeline.render()`. Check that it exists in r185 first (VERSION.md: HIGH knowledge risk). | Moves GPU pipeline creation off the first frame. The CPU node build probably stays in one task. Load moment, lowest priority. | engine-programmer |

## Considered and not made

- **Lowering World Network p95 toward 9.0 at 120 Hz:** not achievable game-side (cause 1).
- **Smaller Earth texture, or fewer mip levels:** visible change. This is an option for the owner only.
- **Keeping the globe GL context alive across phases:** would remove the repeat upload, but it is an architectural change (GPU memory held during missions, context-loss handling). It needs a technical-director decision.
- **Disabling `checkShaderErrors`:** the link work still blocks at first draw, so the gain is uncertain and error reporting is lost. Not recommended without a measurement.

## Not measured

- **Production build:** the harness imports `/src/...` from the dev server, so it cannot run against `vite preview`. The dev-only `jsxDEV` share (about 9–12 ms in the commits above) is not in shipped frames, but this pass did not measure shipped frames.
- **Draw calls and memory:** not sampled.
- **Effect of any fix:** not measured, because no fix was applied.
- **The startup `?` long tasks:** not traced.
- Raw traces (about 700 MB) are kept only in the session scratchpad, not here.

## lint / build / test (unchanged tree, HEAD 979b855)

- `npm run lint`: exit 0, no output after `eslint .`.
- `npm run build`: exit 0, `✓ built in 1.86s`.
- `npm test`: `Test Files  65 passed (65)`, `Tests  1627 passed (1627)`.

## Files

- `baseline/perf.mjs`, `baseline/lib.mjs`: unchanged harness. `baseline/perf-run{1,2,3}.json` and `.log`: the baseline runs.
- `after/perf.mjs`, `after/lib.mjs`: unchanged harness, not run.
- `profiling/profile.mjs`: the traced loop and React commit counter. `jitter.mjs`: the World Network conditions. `blank.mjs`: the empty-page reference. `an.cjs` and `threads.cjs`: the trace analyzers.
- `NOTES.md`: working notes.
