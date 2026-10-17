# AU-007 listening evidence — no celebration sting, spoken VO, or spatial shooter mix

Story: `production/epics/audio/story-007-no-celebration-sting-vo-or-spatial-mix.md` (TR-audio-004).
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" steps 2 and 4.

## Status

- Automated evidence (2026-10-17, run on revision `5594e65` with the AU-007 test not yet committed; replace with the commit that adds `src/game/audio.noCelebration.test.ts` once it lands):
  - `src/game/audio.noCelebration.test.ts` (6 tests, advisory; both audio bridges, `missionSfx` and `ui/sound`, replaced with spies; real sim, real Debrief apply, real Abort arm):
    - A paid win, a quiet-replay win, and a loss each reach an outcome with no alert sting. Only the paid-win test also asserts that any `threatLevel` call is `threatLevel(0)` (it does not check other cues such as `objectiveChime`, or that `threatLevel(0)` is called at all), and only the paid-win test asserts `phase === 'debrief'`. Calling `applyDebrief` on each requests no audio at all; this checks the store action, not the Debrief component's mount effect (`src/ui/index.tsx`) or the MissionScreen unmount cleanup (`src/ui/MissionScreen.tsx`), which no test mounts.
    - Arming Abort, letting the 3 s window lapse, and re-arming request no audio from the arm controller (`src/ui/abortArm.ts` imports nothing, so this checks that the controller is pure; the Pause menu's click handler, which plays one `uiClick` per press, is not run). Calling `abortMission` returns to the World Network with no outcome and requests no audio itself. In the app, the confirm also unmounts MissionScreen, whose cleanup calls `threatLevel(0)` and `stopMissionBed()`; that bed stop has no automated coverage, and scenario 5 below is its only evidence.
    - The mission bridge exposes exactly the reference cue set (ability, agent hit, alert sting, blast, confirm, death, gunshot, interact tick, objective, reload, threat level, weather bed): there is no payout, mission-end or spoken cue to call.
  - No code change was needed: the shipping code already has no celebration sting, no mission-end sting on Abort, no VO and no panner.
- Smoke grep (2026-10-17, not a suite test): `rg -n "PannerNode|StereoPannerNode|THREE\.Audio|PositionalAudio|AudioListener|createPanner|createStereoPanner|speechSynthesis|SpeechSynthesisUtterance" src` returned no matches (exit 1). The shipped clip folder `inspiration/audio/sfx/` holds no voice or celebration clip (ability, agent-hit, alert-sting, blast, confirm, death, 10 gun files, interact, objective, two rain loops, reload, ui-click).
- Browser probe (one-off observation, no script or log retained in this folder; 2026-10-17, dev server on port 4200, Claude desktop in-app browser, no audio output listened to): with `createPanner`, `createStereoPanner` and `speechSynthesis.speak` wrapped, the page imported `src/game/audio.ts` and fired every `sfx` cue (all 10 gunshot files, threat level 2, heavy rain), then started the strategy and mission beds for 2.5 s. Counts: 17 buffer sources started, 0 panner nodes, 0 stereo panners, 0 speech utterances. Console: only Vite HMR WebSocket reconnect errors. The local save (`nexus-save-v1`) was not modified; no mission or Debrief was entered.
- Listening: **not run** — this note was prepared by an unattended run with no audio output. The user listens; the audio-director signs off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | (fill in) |
| Mixer | Reference mix: default player levels (master, UI, combat, music, ambience at 100 %), mute off. |
| Browser / OS | (fill in) |
| Output device / volume | (fill in; headphones recommended for the panning check) |

## Screens exercised

- Mission (any contract) → Pause menu (Abort arm, lapse, confirm).
- Debrief after a paid win, after a loss, and after a quiet replay (replay of a won contract).
- World Network after an Abort confirm.

## Scenarios

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Win a contract, reach Debrief (paid) | No celebration or payout sting; mission bed stops as on any leave; only the selection click when acknowledging | | not run |
| 2 | Lose a contract (squad eliminated), reach Debrief | No sting | | not run |
| 3 | Win a replay of a won contract (quiet replay), reach Debrief | Paperwork-quiet: no sting, no payout cue | | not run |
| 4 | Pause, press ABORT once (armed), wait 3 s for it to lapse | One UI click per press; no mission-end sting on arm | | not run |
| 5 | Pause, press ABORT twice (confirm) | One UI click per press; mission bed stops as on any leave; no sting | | not run |
| 6 | Any mission with overlapping fire, on headphones | No spoken VO anywhere; gunfire is not panned left/right by shooter position | | not run |

## Sign-off

- Audio-director: (pending)
