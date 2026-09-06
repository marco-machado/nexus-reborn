# Strategy time and state

## Stores and persistence

Seven stores, split by lifetime and rate: `appStore` (flow, squad, outcome), `missionStore` (HUD, pause), `worldStore` (clock, sectors, contracts), `researchStore`, `campaignStore` (roster, injuries, recruits, bay pins), `tutorialStore`, `settingsStore`. The campaign save composes app, world, research, campaign, and tutorial. Settings and telemetry persist separately.

## Time and research effects

`world.tick(rawDt)` clamps to `MAX_CATCHUP` (5s) and consumes it in steps of at most `MAX_DT` (0.05s), including any shorter final remainder. `worldStore` exports its own `MAX_DT` (0.25s) for the strategy clock; the two names are unrelated. Frames arrive seconds apart while WebGPU pipelines compile, and dropping the remainder froze the mission clock. During the first world second it takes at most one step per frame so the opening is not simulated off screen. Keep both behaviours if you touch `tick`.

Strategic time has two advancement paths:

- Continuous: shared `ScreenChrome` in `ui/Nav.tsx` mounts `useWorldClock` from `ui/clock.ts` for all four Screens: World Network, Research, Brief, and Assembly. rAF batched to 20Hz ticks `worldStore`, then `researchStore.sync(t)` and `campaignStore.sync(t)`. Menu, mission, and debrief do not mount that chrome.
- Contract ETA: after a win, the debrief calls `worldStore.advanceDays(etaDays)`, then syncs research and campaign to the new time.

Any new way to advance `worldStore.t` must catch up research labs, injury recovery, recruitment, and Tax yield at the resulting time.

`game/research.ts` carries each node's effects as data, so the screen's benefit lines and the change the mission applies come from one place.

For mission startup, HUD synchronization, and research/pin snapshots, read [Mission runtime](mission-runtime.md).
