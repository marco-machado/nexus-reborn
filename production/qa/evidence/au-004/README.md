# AU-004 listening evidence — rain and alert-tension drone

Story: `production/epics/audio/story-004-rain-follows-live-weather-and-alert-tension-drone.md`.
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" step 3.

## Status

- Automated evidence: `src/game/audio.test.ts`, describe "rain voice and alert-tension drone (AU-004)" (7 tests, mocked Web Audio graph), plus the existing "weather none does not start a rain source" and "weather light / heavy pick the matching loop" tests.
- Listening: **not run** — this note was prepared by an unattended run with no audio output. The user listens; the audio-director signs off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | (fill in) |
| Mixer | Default player levels (master, UI, combat, music, ambience at 100%), mute off |
| Browser / OS | (fill in) |
| Reduced motion | Run once off, once on (rain audio must not change) |

## Scenarios

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Dry mission (weather none), listen a full city-hum loop | No rain hiss at all | | not run |
| 2 | Light-rain mission, listen a full rain loop | Light recording; loop seam has no click or gap | | not run |
| 3 | Heavy-rain mission, listen a full rain loop | Heavy recording; loop seam has no click or gap | | not run |
| 4 | Glass Veil, scripted front at 22:16:38 (heavy → light) | Heavy loop crossfades to the light loop; rain keeps playing, no click, no gap, no abrupt level change | | not run |
| 4b | Hollow Crown, scripted front at 22:17:08 (light → none) | Light rain fades out to dry (city hum only), no click, no gap, no abrupt level change | | not run |
| 5 | Abort while rain is still loading (cold cache), and again while it plays | Rain fades and never restarts after departure | | not run |
| 6 | Alert 0 → contact raises Alert to 1, 2, 3 | Silent at 0; drone ramps up with each level, on the combat channel (combat slider moves it) | | not run |
| 7 | Mission end (result banner / Debrief / Abort) at Alert ≥ 1 | Drone releases to silence | | not run |
| 8 | Alert rises again inside the release tail (next mission or re-ramp) | One drone layer, no doubled/thicker drone | | not run |

## Sign-off

- Audio-director: (pending)
