# AU-004 listening evidence — rain and alert-tension drone

Story: `production/epics/audio/story-004-rain-follows-live-weather-and-alert-tension-drone.md`.
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" step 3.

## Status

- Automated evidence: `src/game/audio.test.ts`, describe "rain voice and alert-tension drone (AU-004)" (7 tests, mocked Web Audio graph), plus the existing "weather none does not start a rain source" and "weather light / heavy pick the matching loop" tests.
- Listening: **run 2026-10-18** — the user listened on MacBook Pro speakers; Claude staged the scenarios in the dev build and recorded the results. All rows pass. Audio-director sign-off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | Working tree between `95ea3a1` and `299032a` (listening pass 2026-10-18); the commits in that range change only `src/index.css`, `src/ui/ui.css` and IF-002 evidence, no audio code or clips |
| Mixer | Default player levels (master, UI, combat, music, ambience at 100%), mute off |
| Browser / OS | Claude desktop in-app browser (Chromium 152), macOS (Darwin 25.5) |
| Output device / volume | MacBook Pro built-in speakers, 100 % system volume |
| Reduced motion | Off for the pass; switched on for 10 s during heavy rain (row 3) and off again — rain audio unchanged |

## Scenarios

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Dry mission (weather none), listen a full city-hum loop | No rain hiss at all | As expected (user, 2026-10-18). Rust Haven, 35 s unpaused (a full 31 s city-hum loop); weather "none"; no rain call | pass |
| 2 | Light-rain mission, listen a full rain loop | Light recording; loop seam has no click or gap | As expected (user, 2026-10-18). Glass Veil after the front: 30 s of light rain (a full 27 s loop) | pass |
| 3 | Heavy-rain mission, listen a full rain loop | Heavy recording; loop seam has no click or gap | As expected (user, 2026-10-18). Glass Veil: 30 s of heavy rain (a full 26 s loop); reduced motion on for 10 s then off, no change in rain | pass |
| 4 | Glass Veil, scripted front at 22:16:38 (heavy → light) | Heavy loop crossfades to the light loop; rain keeps playing, no click, no gap, no abrupt level change | As expected (user, 2026-10-18). Mission clock set to 145 s; front fired at t=150.0 (heavy → light) with "WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED." | pass |
| 4b | Hollow Crown, scripted front at 22:17:08 (light → none) | Light rain fades out to dry (city hum only), no click, no gap, no abrupt level change | As expected (user, 2026-10-18). Mission clock set to 175 s; front fired at t=180.0 (light → none) | pass |
| 5 | Abort while rain is still loading (cold cache), and again while it plays | Rain fades and never restarts after departure | As expected (user, 2026-10-18). (a) Fresh page load (cold decode cache), Glass Veil deployed and aborted the moment the world existed: no rain in the 9 s after. (b) Abort during light rain: rain faded, nothing re-requested rain in the 8 s after | pass |
| 6 | Alert 0 → contact raises Alert to 1, 2, 3 | Silent at 0; drone ramps up with each level, on the combat channel (combat slider moves it) | As expected (user, 2026-10-18). Rust Haven: guards marked alerted 1 / 3 / 6 (the real Alert rule) — drone calls 1, 2, 3 at t=45.4, 50.4, 55.4, ~5 s each; at Alert 3 the combat slider went to 30 for 5 s and back to 100, drone followed | pass |
| 7 | Mission end (result banner / Debrief / Abort) at Alert ≥ 1 | Drone releases to silence | As expected (user, 2026-10-18). Abort at Alert 3: drone release call (0), silence | pass |
| 8 | Alert rises again inside the release tail (next mission or re-ramp) | One drone layer, no doubled/thicker drone | As expected (user, 2026-10-18). Same mission: Alert 3 → 0 at t=69.4 and back to 3 at t=69.8, inside the 0.9 s release tail; one drone layer. Not re-tested across a mission boundary | pass |

## Staging

2026-10-18, dev server, in-app browser. Missions were entered through Team Deploy and paused on creation with the squad on weapons tight and every guard's patrol cleared (hold ground), so no contact happened (no stings were logged). Scenarios were driven from the page console: Alert by setting guards' `alerted` flag, the combat slider and reduced motion through the settings store, fronts by setting the mission clock 5 s before the authored front time (skipping the wait), aborts through `abortMission` (the Hud's abort path). `sfx.threatLevel`, `sfx.weatherBed` and `sfx.alertSting` were wrapped to log call times (times above). No audio or decoding errors in the console. The browser save was backed up before and restored after (byte-identical).

## Retained screenshots

Captured 2026-10-18 at revision `299032a` from the in-app browser while the mission ran (weather chip and HUD Alert in the top bar, comm log bottom left), with the same staging as above:

- `04a-glass-veil-heavy-before-front.jpg` / `04b-glass-veil-light-after-front.jpg` — row 4: chip HEAVY RAIN at t=147.5, then LIGHT RAIN after the front at t=150 with "WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED." in the comm log.
- `04c-hollow-crown-light-before-front.jpg` / `04d-hollow-crown-clear-after-front.jpg` — row 4b: chip LIGHT RAIN at t=177.5, then CLEAR after the front at t=180 with the same log line.
- `06a-alert-1.jpg`, `06b-alert-2.jpg`, `06c-alert-3.jpg` — row 6: HUD Alert 1, 2, 3 in Rust Haven (1, 3 and 6 guards alerted), nobody in combat.

The browser save was backed up before and restored after (byte-identical).

## Sign-off

- Audio-director: Marco Machado, 2026-10-18 — approved
