# Mission runtime

## World access and mission snapshots

`src/game/runtime.ts` holds the live `WorldApi` and the camera ground footprint. `setWorld` on mission mount, `getWorld()` everywhere else. Per-frame data (unit positions, tracers, camera pose) stays out of React state.

Two-tier:

- Fast, per-frame: `getWorld()` inside `useFrame` or a rAF loop.
- Slow, ~5Hz: `world.ts` pushes squad rows, resources, clock, civilian-hit count, and active objective progress into `missionStore` every `SYNC_INTERVAL` (0.2s). Startup also seeds the HUD; logs, weather fronts, and objective transitions write when their events occur rather than waiting for that interval. HUD components subscribe to the store. The canvas minimap reads the live world on its own throttled loop; imperative HUD controls call the world directly.

`MissionScreen` calls `freezeDeploy` (`src/state/deployFreeze.ts`) once: it reads the live stores and clones the four ADR-0009 slices (`wn`, `economy`, `research`, `roster`) plus `mods` and `district` into `DeployParams` (`src/game/deploy.ts`), then passes them to `createWorld` and resets `missionStore`. `world.ts` defers every store write to the first tick (`startup()`).

`createWorld` reads no strategy store (`worldStore`, `campaignStore`, `researchStore`) and has no `getState()` fallback for the slices. Research and bay pins are resolved at freeze: the Roster slice carries each operative's ordered `appliedIds` (for `squadWeapon`), final `maxHp` / `speed`, items and mass tier. Unslotted projects (Ballistics) apply to the whole squad. Slotted projects apply only if worn. `outcome.quietReplay` is the Economy slice boolean. Tests and headless tools pass an explicit freeze (`headlessDeploy`). Research and pins cannot change a mission already running. A weather front retunes live sight and noise; it does not re-sample research. Orders also read `missionStore.live`, `paused`, and `result`. The sim writes `missionStore`, `appStore` (the debrief outcome), and `tutorialStore` (`noteTutorial` / `fireTutorialHint`).

## Related state and clocks

Before changing mission tick, clocks, or persistence, read [Strategy time and state](strategy-time-state.md). It defines mission catch-up and opening-frame behavior as well as store lifetimes.
