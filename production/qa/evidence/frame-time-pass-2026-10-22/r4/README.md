# R4 before/after: mission-entry precompile (2026-10-22)

## What changed

`src/scene/Effects.tsx` now calls `scenePass.compileAsync(gl)` once at mount, using three r185's `PassNode.compileAsync`. That call compiles against the pass's own render target and MRT. Until it resolves, `pipeline.render()` is skipped.

The new `src/scene/sceneWarm.ts` holds a flag that `WorldTicker` in `src/scene/GameCanvas.tsx` reads. While the flag is clear, the ticker skips `tickIfLive`, so no mission time passes undrawn. No contract file was changed.

## Method

- **Script:** `perf.mjs` and `lib.mjs` from `../r1-r3/`, plus a mission screenshot 2 s after deploy.
- **Runs:** six, interleaved in one session: before-1, after-1, before-2, after-2, before-3, after-3. Each "before" run stashed `Effects.tsx` and `GameCanvas.tsx`.
- **Server:** `preview_start dev` on port 4200, headed Chrome for Testing at 1280×720.
- **Refresh rate:** before-1 to before-3 and after-1 ran at about 160 Hz (p50 6.2 ms). after-2 and after-3 ran at 120 Hz (p50 8.3 ms). The like-for-like comparison is the three before runs against after-1. after-2 and after-3 are listed for reference.

All runs: exit 0, mission won, 0 errors.

## Results

| Run | Hz | Mission max frame (ms) | Mission-entry long task (ms) | Mission frames > 50 ms | Mission p95 |
|---|---|---|---|---|---|
| before-1 | 160 | 287.6 | 266 | 1 | 6.9 |
| before-2 | 160 | 281.3 | 256 | 1 | 6.9 |
| before-3 | 160 | 293.9 | 269 | 1 | 6.9 |
| after-1 | 160 | 243.9 | 248 | 3 | 6.9 |
| after-2 | 120 | 234.1 | 241 | 3 | 9.3 |
| after-3 | 120 | 250.0 | 253 | 2 | 9.2 |

**Reading**
- **Largest frame:** about 40–50 ms shorter (282–294 ms down to 234–250 ms).
- **Mission-entry long task:** about 10–20 ms shorter (256–269 ms down to 241–253 ms).
- **Frames over 50 ms:** went from 1 to 2–3. Part of the cost moved into neighbouring frames instead of disappearing. This matches the expectation: material setup still runs on the main thread; only the GPU pipeline creation became async.
- **Not shown:** whether the extra frames over 50 ms fall inside the first second of mission entry. The budget excludes that second as a load moment, but the summary does not keep frame timestamps.
- **Unaffected:** mission p95.

## Visual check

`before-1-mission.png` and `after-1-mission.png` show the same frame: squad, HUD, lighting and bloom. The HUD clock reads 18:14:09 before and 18:14:08 after at the same wall time, which is consistent with the mission clock holding during the compile.
