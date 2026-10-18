# AU-002 listening evidence — voices, buses, and the reference mix

Story: `production/epics/audio/story-002-voices-buses-and-reference-mix.md`.
Click-through: [docs/click-through.md](../../../../docs/click-through.md#audio-changes), "Audio changes" steps 2 and 4.

## Status

- Automated evidence (2026-10-17, revision `7e076da` + uncommitted AU-002 tests):
  - `src/game/audio.test.ts`, describe "voices, buses, and the reference mix (AU-002)" (4 tests, mocked Web Audio graph): 20 distinct one-shots; each cue alone starts exactly its own clip on its authored bus (UI: confirmation, click, interaction progress, objective; combat: reload, blast, ability, alert sting, death, operative hit, 10 gunshots); at default levels the UI bus gain is below the combat bus gain; a 40-shot two-sided burst stays bounded, still admits an operative hit and an alert sting, and finished shots disconnect and free their slot.
  - `src/game/audio.stings.test.ts`, describe "warning-sting requests (AU-002)" (4 tests, real sim, audio bridge spied): first combat contact requests one sting and raises the drone, a second contact requests none; an answered officer call requests its own sting; a Rust Haven defend wave requests a sting on entry; ordinary suspicion (a grenade heard, nobody seen) requests no sting, never raises the drone, and leaves HUD Alert at 0.
  - Existing: "clip playback" tests (CorpSec vs squad file per weapon, gun playback-rate jitter within ±3 %, overlap bound).
- Browser probe (2026-10-17, dev server, in-app Chromium pane, no audio output listened to): every one of the 20 cues fired alone started exactly one non-looping source with a decoded buffer (confirm 0.06 s, ui-click 0.02 s, interact 0.04 s, objective 0.54 s, reload 1.49 s, blast 1.78 s, ability 0.61 s, alert-sting 0.46 s, death 0.53 s, agent-hit 0.42 s; gun squad/CorpSec pairs assault 0.38, smg 0.22, pistol 0.36, longrifle 0.64, shotgun 0.48 s). A 40-request two-sided gun burst over 1.25 s peaked at 6 concurrent gun sources, 18 started in all, all 18 fired `ended` and none remained active. No decoding errors in the console (only Vite HMR websocket noise from the pane).
- Listening: **run 2026-10-18** — the user listened on MacBook Pro speakers at the reference mix; Claude staged the cues and scenarios and recorded the results. All 25 rows pass. Audio-director sign-off below.

## Settings to record

| Field | Value |
| --- | --- |
| Revision | `0548369` (listening pass 2026-10-18) |
| Mixer | Reference mix: default player levels (master, UI, combat, music, ambience at 100 %), mute off. Not a player override. |
| Browser / OS | Claude desktop in-app browser (Chromium 152), macOS (Darwin 25.5) |
| Output device / volume | MacBook Pro built-in speakers, 100 % system volume |

## Screens exercised

- Settings (Audio) — confirm the defaults above before listening.
- Mission (any contract; Glass Veil / Rust Haven for the scenarios below) — combat cues, HUD Alert, overlapping fire.
- Menu / Screens — UI click and confirmation.

Staging (2026-10-18, dev server, in-app browser): rows 1–20 fired each cue through `sfx` from the page console on the Settings screen. Rows 21–25 ran in live Glass Veil / Rust Haven missions entered through Team Deploy; units were placed and ordered from the console with the same staging as `src/game/audio.stings.test.ts`, the mission paused between rows, and `sfx.alertSting` / `sfx.threatLevel` were wrapped to log call times (times above). A first Glass Veil attempt was discarded: a patroller reached the squad before staging and fired an unannounced first-contact sting. A second attempt at row 23 was discarded: the officer died before the call went out. The browser save was backed up before and restored after (byte-identical). No decoding errors in the console.

## Retained screenshots

Captured 2026-10-18 at revision `0548369` from the in-app browser while the mission ran (the comm log is bottom left, HUD Alert top centre), with the same staging as rows 23–25 above:

- `23-officer-call-sting.jpg` — Glass Veil: comm log shows "THREAT LEVEL ELEVATED." then "REINFORCEMENT CALL OUT. GUARDS CONVERGING."; Alert 3. Stings logged at t=2.2 (contact) and t=6.3 (call).
- `24-defend-wave-sting.jpg` — Rust Haven: comm log shows "CORPSEC WAVE INBOUND. HOLD THE ZONE."; Alert 2. One sting at t=1.3, none before the wave.
- `25-suspicion-no-sting.jpg` — Glass Veil: comm log shows "HOSTILE PATROL INVESTIGATING."; Alert 0; the patroller is suspicious, nobody is in combat, no sting.

The browser save was backed up before and restored after (byte-identical).

## Scenarios — individual cues

| # | Cue | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 1 | Selection / confirmation | Present; short, sits below weapon reports | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice). Selecting an operative in the scene plays no cue (`src/scene/Input.tsx`); only order confirmation does. User accepts this (2026-10-18). | pass |
| 2 | UI click | Present; unobtrusive | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 3 | Interaction progress | One blip per second of channel; below weapon reports | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 4 | Objective complete | Present; below weapon reports | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 5 | Reload | Whole reload sequence audible | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 6 | Blast | Readable impact | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 7 | Ability | Distinct from an order confirm | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 8 | Alert sting | Readable warning | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 9 | Death | Readable | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice) | pass |
| 10 | Operative hit | Readable under gunfire | As expected (user listened, 2026-10-18; cue played alone, ~3 s apart, played twice); "under gunfire" is checked in row 21 | pass (alone) |
| 11–15 | Squad gunshots: assault, SMG, pistol, longrifle, shotgun | Five distinct weapon identities | As expected (user listened, 2026-10-18; each weapon played alone, twice, ~1 s apart) | pass |
| 16–20 | CorpSec gunshots, same five | Same identity as the squad weapon, quieter and narrower | As expected (user listened, 2026-10-18; squad then CorpSec back to back per weapon) | pass |

## Scenarios — mix and warnings

| # | Scenario | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| 21 | Recorded overlapping fire (squad vs CorpSec firefight, several weapons) | Weapon identities stay distinct; CorpSec below squad; operative hits and the alert sting stay readable; no runaway stacking | As expected (user listened, 2026-10-18). Glass Veil: full squad (assault, 2× SMG, shotgun) vs the six-guard garrison, ~4 s of fire (t=19.9–23.6); drone 1→3→2→1→0; no extra sting on this later contact | pass |
| 22 | First combat contact | One alert sting; drone follows HUD Alert | As expected (user listened, 2026-10-18). Glass Veil: a1 engaged the officer; one sting at t=8.1 with "Threat level elevated."; drone rose to 3 and released at t=16 when combat ended | pass |
| 23 | Officer call answered (Glass Veil checkpoint officer, a patroller in range) | Its own alert sting plays; mission log shows "REINFORCEMENT CALL OUT. GUARDS CONVERGING." (text only, nothing spoken) | As expected (user listened, 2026-10-18). Glass Veil, fresh run: officer spotted a1 (contact sting t=1.4); a1 withdrew, a patroller was parked in radio range; second sting at t=5.5 with "REINFORCEMENT CALL OUT. GUARDS CONVERGING." | pass |
| 24 | Defend wave (Rust Haven, after the relays drop) | Alert sting plays; mission log shows "CORPSEC WAVE INBOUND. HOLD THE ZONE." (text only, nothing spoken) | As expected (user listened, 2026-10-18). Rust Haven: guards cleared, a1 at the relay yard, relays dropped; one sting at t=1.3 with "CORPSEC WAVE INBOUND. HOLD THE ZONE."; drone to 2 with HUD Alert 2; no sting before the wave | pass |
| 25 | Ordinary suspicion only (mission log shows "Hostile patrol investigating.", no contact) | No sting; drone stays silent while HUD Alert stays 0 | As expected (user listened, 2026-10-18). Glass Veil: grenade 10 m from a patroller 26 m from the squad; "Hostile patrol investigating."; suspicious ~2.5 s then patrol; no sting, drone silent, HUD Alert 0 | pass |

## Sign-off

- Audio-director: Marco Machado, 2026-10-18 — approved
