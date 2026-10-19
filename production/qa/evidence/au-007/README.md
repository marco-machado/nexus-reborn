# AU-007 listening evidence — no celebration sting, spoken VO, or spatial shooter mix

Story: `production/epics/audio/story-007-no-celebration-sting-vo-or-spatial-mix.md` (TR-audio-004).
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" steps 2 and 4.

## Status

- Automated evidence (2026-10-17; `src/game/audio.noCelebration.test.ts` landed in `7a38fcd`):
  - `src/game/audio.noCelebration.test.ts` (6 tests, advisory; both audio bridges, `missionSfx` and `ui/sound`, replaced with spies; real sim, real Debrief apply, real Abort arm):
    - A paid win, a quiet-replay win, and a loss each reach an outcome with no alert sting. Only the paid-win test also asserts that any `threatLevel` call is `threatLevel(0)` (it does not check other cues such as `objectiveChime`, or that `threatLevel(0)` is called at all), and only the paid-win test asserts `phase === 'debrief'`. Calling `applyDebrief` on each requests no audio at all; this checks the store action, not the Debrief component's mount effect (`src/ui/index.tsx`) or the MissionScreen unmount cleanup (`src/ui/MissionScreen.tsx`), which no test mounts.
    - Arming Abort, letting the 3 s window lapse, and re-arming request no audio from the arm controller (`src/ui/abortArm.ts` imports nothing, so this checks that the controller is pure; the Pause menu's click handler, which plays one `uiClick` per press, is not run). Calling `abortMission` returns to the World Network with no outcome and requests no audio itself. In the app, the confirm also unmounts MissionScreen, whose cleanup calls `threatLevel(0)` and `stopMissionBed()`; that bed stop has no automated coverage, and scenario 5 below is its only evidence.
    - The mission bridge exposes exactly the reference cue set (ability, agent hit, alert sting, blast, confirm, death, gunshot, interact tick, objective, reload, threat level, weather bed): there is no payout, mission-end or spoken cue to call.
  - No code change was needed: the shipping code already has no celebration sting, no mission-end sting on Abort, no VO and no panner.
- Smoke grep (2026-10-17, not a suite test): `rg -n "PannerNode|StereoPannerNode|THREE\.Audio|PositionalAudio|AudioListener|createPanner|createStereoPanner|speechSynthesis|SpeechSynthesisUtterance" src` returned no matches (exit 1). The shipped clip folder `inspiration/audio/sfx/` holds no voice or celebration clip (ability, agent-hit, alert-sting, blast, confirm, death, 10 gun files, interact, objective, two rain loops, reload, ui-click).
- Browser probe (one-off observation, no script or log retained in this folder; 2026-10-17, dev server on port 4200, Claude desktop in-app browser, no audio output listened to): with `createPanner`, `createStereoPanner` and `speechSynthesis.speak` wrapped, the page imported `src/game/audio.ts` and fired every `sfx` cue (all 10 gunshot files, threat level 2, heavy rain), then started the strategy and mission beds for 2.5 s. Counts: 17 buffer sources started, 0 panner nodes, 0 stereo panners, 0 speech utterances. Console: only Vite HMR WebSocket reconnect errors. The local save (`nexus-save-v1`) was not modified; no mission or Debrief was entered.
- Listening: **run 2026-10-19** — the user listened on MacBook Pro speakers (rows 1–5) and headphones (row 6); Claude staged the scenarios in the dev build and recorded the results. All rows pass. Audio-director sign-off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | `7507649`, clean working tree (listening pass 2026-10-19) |
| Mixer | Reference mix: default player levels (master, UI, combat, music, ambience at 100 %), mute off (read from the settings store before the pass). |
| Browser / OS | Claude desktop in-app browser (Chromium 152), macOS (Darwin 25.5) |
| Output device / volume | MacBook Pro built-in speakers, 100 % system volume (rows 1–5); headphones (row 6) |

## Screens exercised

- Mission (any contract) → Pause menu (Abort arm, lapse, confirm).
- Debrief after a paid win, after a loss, and after a quiet replay (replay of a won contract).
- World Network after an Abort confirm.

## Scenarios

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Win a contract, reach Debrief (paid) | No celebration or payout sting; mission bed stops as on any leave; only the selection click when acknowledging | As expected (user, 2026-10-19). Glass Veil, paid (85,000 CR). Logged: objective chimes at 15.66 s (×2, same tick) and 17.21 s with the result `threatLevel(0)`; on Debrief at 20.76 s `threatLevel(0)` and both mission loops (bed, rain) stopped; nothing else until one `uiClick` on RETURN TO WORLD NETWORK at 32.12 s | pass |
| 2 | Lose a contract (squad eliminated), reach Debrief | No sting | As expected (user, 2026-10-19). Glass Veil, paid contract, "CONTRACT TERMINATED". Logged: result `threatLevel(0)` at 51.42 s; on Debrief at 52.98 s `threatLevel(0)` and both mission loops stopped; nothing else until one `uiClick` on RETURN at 63.59 s. Squad marked dead directly (see Staging), so no death thuds and Debrief shows 0 casualties | pass |
| 3 | Win a replay of a won contract (quiet replay), reach Debrief | Paperwork-quiet: no sting, no payout cue | As expected (user, 2026-10-19). Glass Veil after row 1's win, `outcome.quietReplay === true`, "REPLAY // FEE ALREADY COLLECTED", payout 0 CR. Logged: chimes at 57.45 s (×2) and 58.96 s with `threatLevel(0)`; on Debrief at 61.46 s `threatLevel(0)` and both loops stopped; one `uiClick` on RETURN at 71.32 s | pass |
| 4 | Pause, press ABORT once (armed), wait 3 s for it to lapse | One UI click per press; no mission-end sting on arm | As expected (user, 2026-10-19). Pause opened with the HUD PAUSE button, ABORT clicked once (button read CONFIRM?), lapsed after 3 s (button back to ABORT, hint cleared). Logged: `uiClick` at 97.76 s (PAUSE) and 99.98 s (ABORT), nothing else. A slow first attempt at row 5 (clicks 3.46 s apart) gave two more arm-and-lapse cycles, one `uiClick` each, nothing else | pass |
| 5 | Pause, press ABORT twice (confirm) | One UI click per press; mission bed stops as on any leave; no sting | As expected (user, 2026-10-19). Real Pause-menu buttons, clicks 20 ms apart. Logged: `uiClick` at 132.82 s and 132.84 s; at 132.86 s `threatLevel(0)`, both mission loops stopped, World Network bed started | pass |
| 6 | Any mission with overlapping fire, on headphones | No spoken VO anywhere; gunfire is not panned left/right by shooter position | As expected (user, headphones, 2026-10-19). Glass Veil: two operatives on each flank of the garrison (x = 36 and x = 60, camera on the garrison), ~11 s of fire (183.07–194.2 s): 71 gunshots (assault and SMG squad, longrifle CorpSec), 4 deaths, alert stings at 183.07 s (first contact) and 187.21 s (mid-fight; cause not recorded), drone 1→2→3→2→3→2. 0 `createPanner` / `createStereoPanner` calls and 0 `speechSynthesis.speak` calls over the whole session | pass |

## Staging

2026-10-19, dev server, Claude desktop in-app browser. Missions were entered through Team Deploy (`appStore.missionId = 'm01'`, `goto('team')`, then the "DEPLOY TEAM >>" button, the user gesture that unlocks audio). A watcher paused each new world on creation, put the squad on weapons tight and cleared every guard's patrol (hold ground); on the first deploy (row 2) it was not armed in time and the world was staged by hand at t = 7.8 s with Alert 0 and no sting logged. Every `sfx` method (including `uiClick`), `AudioBufferSourceNode` start/stop for loops longer than 8 s (the beds), `createPanner`, `createStereoPanner` and `speechSynthesis.speak` were wrapped to log call times (seconds from the start of logging; times above). Row 2: the squad's stance set to dead (no damage path, so no death thuds and no KIA); the save was restored and the page reloaded right after, before row 1. Rows 1 and 3: every guard's stance set to dead silently (no shots, no contact), then the squad moved to the checkpoint gate and to extraction. Rows 4 and 5 used the real HUD PAUSE and Pause-menu ABORT buttons. Row 6 was ended with `missionLifecycle.abortMission` (the Hud's abort path). The browser save (`nexus-save-v1`, `nexus-settings-v1`) was backed up before and restored after; byte-identical after reload both times. No console errors.

## Retained screenshots

Captured 2026-10-19 at revision `7507649` from the in-app browser, with the staging above:

- `01-debrief-paid-win.jpg` — row 1: Debrief "CONTRACT FULFILLED", payout +85,000 CR.
- `02-debrief-loss.jpg` — row 2: Debrief "CONTRACT TERMINATED", payout 0 CR.
- `03-debrief-quiet-replay.jpg` — row 3: Debrief "REPLAY // FEE ALREADY COLLECTED", payout 0 CR.
- `04-abort-armed.jpg` — row 4: Pause menu with the Abort button armed ("CONFIRM?", "PRESS AGAIN WITHIN 3 S TO ABORT MISSION").
- `05-abort-confirm-world-network.jpg` — row 5: World Network after the Abort confirm.

## Sign-off

- Audio-director: Marco Machado, 2026-10-19 — approved
