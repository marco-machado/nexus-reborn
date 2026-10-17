# AU-002 listening evidence — voices, buses, and the reference mix

Story: `production/epics/audio/story-002-voices-buses-and-reference-mix.md`.
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" steps 2 and 4.

## Status

- Automated evidence (2026-10-17, revision `7e076da` + uncommitted AU-002 tests):
  - `src/game/audio.test.ts`, describe "voices, buses, and the reference mix (AU-002)" (4 tests, mocked Web Audio graph): 20 distinct one-shots; each cue alone starts exactly its own clip on its authored bus (UI: confirmation, click, interaction progress, objective; combat: reload, blast, ability, alert sting, death, operative hit, 10 gunshots); at default levels the UI bus gain is below the combat bus gain; a 40-shot two-sided burst stays bounded, still admits an operative hit and an alert sting, and finished shots disconnect and free their slot.
  - `src/game/audio.stings.test.ts`, describe "warning-sting requests (AU-002)" (4 tests, real sim, audio bridge spied): first combat contact requests one sting and raises the drone, a second contact requests none; an answered officer call requests its own sting; a Rust Haven defend wave requests a sting on entry; ordinary suspicion (a grenade heard, nobody seen) requests no sting, never raises the drone, and leaves HUD Alert at 0.
  - Existing: "clip playback" tests (CorpSec vs squad file per weapon, gun playback-rate jitter within ±3 %, overlap bound).
- Browser probe (2026-10-17, dev server, in-app Chromium pane, no audio output listened to): every one of the 20 cues fired alone started exactly one non-looping source with a decoded buffer (confirm 0.06 s, ui-click 0.02 s, interact 0.04 s, objective 0.54 s, reload 1.49 s, blast 1.78 s, ability 0.61 s, alert-sting 0.46 s, death 0.53 s, agent-hit 0.42 s; gun squad/CorpSec pairs assault 0.38, smg 0.22, pistol 0.36, longrifle 0.64, shotgun 0.48 s). A 40-request two-sided gun burst over 1.25 s peaked at 6 concurrent gun sources, 18 started in all, all 18 fired `ended` and none remained active. No decoding errors in the console (only Vite HMR websocket noise from the pane).
- Listening: **not run** — this note was prepared by an unattended run with no audio output. The user listens; the audio-director signs off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | (fill in) |
| Mixer | Reference mix: default player levels (master, UI, combat, music, ambience at 100 %), mute off. Not a player override. |
| Browser / OS | (fill in) |
| Output device / volume | (fill in) |

## Screens exercised

- Settings (Audio) — confirm the defaults above before listening.
- Mission (any contract; Glass Veil / Rust Haven for the scenarios below) — combat cues, HUD Alert, overlapping fire.
- Menu / Screens — UI click and confirmation.

## Scenarios — individual cues

| # | Cue | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Selection / confirmation | Present; short, sits below weapon reports | | not run |
| 2 | UI click | Present; unobtrusive | | not run |
| 3 | Interaction progress | One blip per second of channel; below weapon reports | | not run |
| 4 | Objective complete | Present; below weapon reports | | not run |
| 5 | Reload | Whole reload sequence audible | | not run |
| 6 | Blast | Readable impact | | not run |
| 7 | Ability | Distinct from an order confirm | | not run |
| 8 | Alert sting | Readable warning | | not run |
| 9 | Death | Readable | | not run |
| 10 | Operative hit | Readable under gunfire | | not run |
| 11–15 | Squad gunshots: assault, SMG, pistol, longrifle, shotgun | Five distinct weapon identities | | not run |
| 16–20 | CorpSec gunshots, same five | Same identity as the squad weapon, quieter and narrower | | not run |

## Scenarios — mix and warnings

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 21 | Recorded overlapping fire (squad vs CorpSec firefight, several weapons) | Weapon identities stay distinct; CorpSec below squad; operative hits and the alert sting stay readable; no runaway stacking | | not run |
| 22 | First combat contact | One alert sting; drone follows HUD Alert | | not run |
| 23 | Officer call answered (Glass Veil checkpoint officer, a patroller in range) | Its own alert sting with "REINFORCEMENT CALL OUT" | | not run |
| 24 | Defend wave (Rust Haven, after the relays drop) | Alert sting with "CORPSEC WAVE INBOUND" | | not run |
| 25 | Ordinary suspicion only ("Hostile patrol investigating", no contact) | No sting; drone stays silent while HUD Alert stays 0 | | not run |

## Sign-off

- Audio-director: (pending)
