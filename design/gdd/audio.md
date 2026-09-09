# Audio

> **Status**: Designed (pending independent `/design-review`)
> **Author**: extract from docs/game-design.md §15 (beds/settings §17; out of scope §18; backlog captions §19.6; click-through audio checks)
> **Last Updated**: 2026-09-08
> **Implements Pillar**: One corporate operating system; Violence has corporate consequences; Information is operational power
> **Living spec**: `docs/game-design.md` §15 — this file aliases it; do not fork rules
> **Runtime / credits**: `inspiration/audio/sfx/README.md` — sources, mastering, overlap caps. Do not copy those integers here.
> **Specialists (full)**: D2 extract — rules already live in the spec
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

Audio is the terminal’s ear: it confirms orders, marks danger, and prices violence. It does not narrate. Four channels (UI, combat, music, ambience) sit under a master, plus mute. Strategy music owns the four **Screens**; mission ambience (city hum plus weather rain) owns the district. Acknowledgements are a short selection click on the UI bus, not spoken operative dialogue. Weapon reports sit above UI. CorpSec uses quieter, narrower versions of the same firearm recordings. The alert-tension drone is synthesized so it can ramp with mission **Alert** (0–3) and release when the mission ends. Without this system the OS is a silent slideshow, danger has no sting, and violence has no body — a second, cinematic mix would also break **One corporate operating system**.

Rules stay in `docs/game-design.md` §15. Runtime details, credits, and overlap caps stay in the [audio README](../../inspiration/audio/sfx/README.md). Strategy-bed ownership is defined in [`strategyAudio.ts`](../../src/ui/strategyAudio.ts). This overview does not fork them.

## Player Fantasy

You sit the desk. The mix is the same corporate OS as the chrome: industrial bed on the four Screens, city hum on the district, rain only when the weather is wet. A click acknowledges a selection. Gunfire is a report, not a trailer. CorpSec is the same weapon, quieter and narrower. Danger is a sting and a tension drone that follows **Alert**, not a VO callout of every contact. Mute and the four channel levels are yours; they survive **New Operation**. The fantasy fails if operatives talk, if gunfire is spatialized like a shooter, if UI clicks sit on top of weapon reports, if rain plays on a dry mission, if Opening hour gets its own bed, if a late-loading click dumps as a delayed burst, or if payout plays a celebration sting.

This serves **One corporate operating system** (one mix, four channels, strategy bed on the four Screens), **Violence has corporate consequences** (audio prices violence; it does not celebrate it), and **Information is operational power** (cues mark danger; they do not narrate the board). Secondary: **Command, do not micromanage** (acknowledgements are a short selection click, not VO banter) and **The two layers feed each other** (strategy bed vs mission bed follow screen ownership). It does not own verb validity (Tactical), Alert derivation (Tactical: living CorpSec in Combat), Weather math (Tactical / ADR-0006), Settings chrome (Interface), or the settings slot (Persistence).

`creative-director` not spawned for Player Fantasy — D2 extract; tone locked by living spec §15 and pillar department tables. Review manually before production.

## Detailed Design

### Core Rules

1. **Alias.** Mix, beds, voices, mute, and out-of-scope VO/spatial live in `docs/game-design.md` §15. Unseeded presentation (gunshot playback-rate variation, mission-bed selection) lives in §17. Captions for audio cues are product backlog (§19.6), not a missing designed-in control. Click-through audio checks live in `docs/click-through.md`. CONTEXT.md owns names. This section names owners, buses, and lifetimes. Do not fork README overlap integers, compressor settings, or authored base gains.

2. **One mix, one OS.** Four channels under a master — UI, combat, music, ambience — plus mute. Do not split strategy music and mission ambience into sibling systems. Do not add a fifth “gameplay” bus.

3. **Internal module map (do not split).**

| Module | Owns in this system | Does not own |
|---|---|---|
| Mixer | Four channels, master, mute; UI below weapon reports; event rate limits and overlap caps; late-load drop; final compressor as a safety net | Settings chrome (Interface); settings slot (Persistence); Alert integer (Tactical) |
| Voices | Required one-shots; CorpSec quieter/narrower same firearms; synthesized alert-tension drone | What Select/Attack **mean** (Tactical); invoice pricing (Economy) |
| Strategy bed | One industrial loop on the four Screens (music). Same source while navigating World Network, Research, Brief, Assembly. Stops when leaving that group | Opening hour (Tactical / ADR-0007); Scan vs District (Interface) |
| Mission bed | City-hum loop (ambience): one of three clips, chosen at random when the bed starts | Contract, district, Opening hour, weather, Threat, Alert as keys — none of these pick the clip |
| Rain | Separate light and heavy recordings; crossfade as weather changes; silent when weather is none | Weather script and live weather (Tactical / ADR-0006); reduced-motion **visual** rain (Interface) |

4. **Purpose (lead).** Audio confirms orders, marks danger, and prices violence. It does not narrate. Hardened does not hide information by silencing the mix.

5. **Voices that must exist.** Weapon-specific gunshots, reload, blast, ability activation, confirmation, UI click, interaction progress, alert sting, objective-complete, death thud, operative-hit thump. Combat and UI one-shots and mission rain use committed CC0 clips: **20** one-shots and **two** rain loops. Sources, credits, licenses, mastering: audio README. The alert-tension drone is synthesized so it can ramp with Alert 0–3 and release when the mission ends.

6. **Bus routing.**

| Cue | Bus |
|---|---|
| Confirmation, UI click, interaction progress, objective-complete | UI |
| Gunshots (squad and CorpSec), reload, blast, ability activation, alert sting, death thud, operative-hit, alert-tension drone | Combat |
| Strategy industrial loop | Music |
| Mission city-hum; light/heavy rain | Ambience |

Acknowledgements are a short selection click on the **UI** bus. The alert sting is a dedicated warning cue on the **combat** bus. UI cues sit below weapon reports.

7. **Beds and lifetimes.**

| Bed | When it plays | When it stops | Channel |
|---|---|---|---|
| Strategy | Any of the four Screens | Leaving that group (Menu, Mission, Debrief are not Screens) | Music |
| Mission city-hum | Mission | Leaving the mission | Ambience |
| Rain | Mission, and only while live weather is light or heavy | Weather none, or leaving the mission | Ambience |

Opening hour does not get its own bed. Menu and Debrief take neither strategy nor mission bed. Pause is an overlay on a live mission: do not invent a pause-mute or a pause bed. A stop invalidates an in-flight decode so a late load cannot restart a departed screen’s loop.

8. **Unlock and failure.** Browser audio unlocks on first gesture (Interface Menu fiction). One-shots require a running context. Unavailable audio must not block the game (`ui/sound.ts` loads lazily and swallows failure).

9. **Persistence.** Levels persist with player settings, not the campaign. Mute and the four channel levels survive New Operation. Persistence owns the settings slot; Audio owns mix correctness.

10. **Determinism.** Mission outcomes are seeded. Gunshot playback-rate variation and mission-bed selection **may be unseeded**; they do not change outcomes (`docs/game-design.md` §17). Do not key the mission bed to contract, district, Opening hour, weather, or Threat to “fix” that.

11. **Player cannot.** Hear spoken operative dialogue. Hear a spatialized shooter mix. Get a second music language for “gameplay.” Keep rain on weather none. Keep a strategy bed into the mission, or a mission bed onto the four Screens. Replay late-loading one-shots as a delayed burst. Celebrate Debrief payout with a sting.

12. **Forbidden.** Spoken VO; spatial audio model (unless §18 is explicitly reopened); forking README overlap caps into this GDD; importing authored base gains or compressor numbers from code; a celebration sting on invoice or quiet replay; Opening hour bed; captions as a ship gate (backlog).

Specialist agents not consulted for Detailed Design — D2 extract. Review manually before production.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Mixer | Unavailable / locked (no gesture) / running | First gesture unlocks. Failure stays unavailable and does not block play |
| Mute | Off / On | On folds every channel to silence. Off restores the chosen levels |
| Channel levels | Player-set; persist in settings slot | Independent of campaign blob. New Operation keeps them |
| Strategy bed | Stopped / starting / playing | Start on enter four Screens. Same source across Screen nav. Stop on leave. In-flight decode discarded on stop |
| Mission bed | Stopped / starting / playing (clip A/B/C) | Start on enter mission; pick 1 of 3 unseeded. Stop on leave (Abort, result→Debrief, unmount). In-flight decode discarded on stop |
| Rain voice | Silent / light / heavy | Follows live weather. None → silent. Adjacent change crossfades. Stop with the mission bed |
| Alert tension | Silent (0) / ramped (1–3) | Follows Tactical **Alert**. 0 ramps to silence. Mission end releases. Do not tear down and rebuild on a 0→N rise inside the release tail |
| One-shot | Play / dropped (overlap, rate limit, context not running, decode late) | Drop is silence, not a queue |

### Interactions with Other Systems

Mix ownership is Audio. Do not live-query the running mission to pick a bed.

| Other system | In (Audio receives) | Out (Audio emits) | Audio owner |
|---|---|---|---|
| **Interface** | Phase (four Screens vs Menu/Mission/Debrief); first-gesture unlock; Settings slider/mute chrome; UI click / confirm / overlay open-close / authorize | Audible cues on the UI bus; strategy bed lifetime | Interface presents sliders. Audio mixes. No celebration sting on Debrief chrome |
| **Tactical mission** | Weapon id + side (squad/CorpSec); reload/blast/ability; Alert 0–3; live Weather; objective complete; death; operative hit; interact progress | Combat bus reports; alert sting; tension drone; mission bed + rain | Tactical owns Alert, Weather, verbs. Audio does not derive Alert from chrome |
| **Persistence** | Settings slot hydrate (levels + mute) | Mix applies staged levels | Persistence stores. Audio does not write the campaign blob |
| **World Network / Economy / Research / Roster** | — | — | No direct mix. Strategy bed is Screen-owned, not sector-owned |

**Sibling conflicts (do not silently resolve):**

1. **Settings slider numeric scale** (0–100 vs 0–1). Unnamed in §15. Do not import code percents (Open Question 1).
2. **Overlap / rate-limit integers.** Named in the audio README as runtime. Do not fork them into this GDD as design knobs (Open Question 2).
3. **Interface “Audio not extracted” footnotes.** Documentation drift after this file exists. Do not edit siblings in this pass.
4. **Reduced-motion rain.** Interface drops **visual** rain to minimum. Do not invent an Audio mute-rain rule from that sentence.

## Formulas

Do not fork. Canonical mix rules: `docs/game-design.md` §15, §17. Runtime overlap caps: audio README. Audio does **not** own `hit_chance`, `risk_index`, Alert derivation, or Weather script. Those stay on Tactical.

The `staged_gain` formula is defined as:

`staged_gain = 0 if muted else master × channel`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| muted | muted | bool | {false, true} | Mute switch. On zeroes every channel |
| master | master | float | 0–1 | Master stage factor after mute fold |
| channel | channel | float | 0–1 | One of UI, combat, music, ambience |

**Output Range:** 0 to 1 under normal play; mute is 0 regardless of sliders. Authored per-bus base levels (UI below combat) sit **under** this factor — do not import those bases here.
**Example:** mute on, master and combat at full → combat output 0. Mute off → chosen master × combat restored (click-through: unmuting restores the chosen levels).

The `rain_voice` formula is defined as:

`rain_voice(weather) = silent if weather = none; else the matching light or heavy recording`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| weather | weather | enum | {none, light, heavy} | Live mission Weather (Tactical) |

**Output Range:** Discrete three-state. Adjacent change **crossfades**. None is silent, not a third loop. Dry mission mounts no rain hiss.
**Example:** light → heavy at a weather front → crossfade to the heavy recording; a later none fades rain out. Brief weather is Tactical truth; Audio follows **live** weather.

The `alert_tension` formula is defined as:

`alert_tension = silent if Alert = 0 or mission has ended; else a synthesized drone ramped to Alert`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Alert | Alert | int | 0–3 | HUD Alert; living CorpSec in Combat (Tactical). Not Awareness, not Threat |
| mission | — | enum | {live, ended} | Mission end releases the drone |

**Output Range:** Discrete follow of 0–3. 0 ramps to silence. Do not import oscillator frequencies or gain tables from code.
**Example:** Alert 0 → silent drone. Alert rises to 2 → drone ramps up on the combat bus. Result banner / Debrief / Abort → release.

The `mission_bed_pick` formula is defined as:

`mission_bed_pick ∈ {clip A, clip B, clip C}` unseeded at mission-bed start

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| clip | mission_bed_pick | enum | 3 committed city-hum clips | Chosen at random when the mission bed **starts** |

**Output Range:** One of three. **Not** keyed to contract, district, Opening hour, weather, or Threat. Unseeded; does not change outcomes (§17).
**Example:** Two deploys of the same authored contract may hum different city clips. Weather still only drives rain, not this pick.

**Named, not specified:** overlap caps, gunshot-admission headroom, per-event rate limits, late-load drop window, playback-rate jitter magnitude, compressor settings, authored base gains. Those are README / implementation. Do not paste them into the registry.

**Constants, not curves:** 20 one-shots; 2 rain loops; 3 mission-bed clips; 4 channels + master + mute; Alert domain 0–3 (Tactical-owned integer).

`systems-designer` not consulted — D2 extract. Review manually before production.

## Edge Cases

- **If mute is on:** every channel is silent, including beds, rain, drone, and one-shots. Chosen levels are kept. Unmute restores them.
- **If audio is unavailable or the context is not running:** drop one-shots; do not block play; do not queue them.
- **If a one-shot’s decode is late:** drop it. Do not play earlier clicks or gunfire as a delayed burst.
- **If overlap caps or rate limits are hit:** drop the new one-shot. Gunfire must leave room for impacts and warnings (README runtime; do not fork the integers here).
- **If two Screens are navigated (World Network → Research → Brief → Assembly):** the **same** strategy source keeps playing. Do not restart per Screen.
- **If the director leaves the four Screens for Menu, Mission, or Debrief:** stop the strategy bed; discard in-flight strategy decode.
- **If the director leaves the mission (Abort, result → Debrief, unmount) while a bed or rain is still loading:** fade/stop; discard in-flight decode; a late load must not restart the departed mission’s loop.
- **If weather is none:** rain is silent. Do not keep a near-audible hiss as a design rule (implementation may hold a silent node; the player hears nothing).
- **If weather changes adjacent (light ↔ heavy, or to/from none):** crossfade; no click, gap, or abrupt level jump (click-through).
- **If Opening hour is dusk vs night:** no extra bed. Lighting is Tactical / ADR-0007.
- **If Alert is 0:** tension drone is silent (ramp to silence). If Alert rises during a release tail: do not stack a second drone layer.
- **If CorpSec fires the same weapon as the squad:** play the CorpSec variant (quieter, narrower), not the squad clip and not a different weapon identity.
- **If gunshot playback rate varies:** presentation-only; weapon identity and cadence remain. Unseeded. Does not change hit_chance or the sim.
- **If Debrief or quiet replay shows the invoice:** no celebration sting. Quiet banner copy is Interface; Audio stays paperwork-quiet.
- **If Abort is armed:** no mission-end sting. Confirm discards the mission; stop the mission bed as on any leave.
- **If New Operation is confirmed:** campaign erases; mute and channel levels survive (Persistence settings slot).
- **If reduced motion is on:** Interface drops visual rain to minimum. Audio still follows live weather unless a later living-spec sentence says otherwise — do not invent a link.
- **If captions backlog is requested as a ship gate:** product backlog (§19.6), not a missing AC.
- **If spoken VO or spatial audio is proposed:** out of scope unless §18 is explicitly reopened.

`systems-designer` not consulted for Edge Cases — D2 extract. Review manually before production.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | Interface | Phase, unlock, Settings chrome, UI events | Four Screens vs Menu/Mission/Debrief; first gesture; slider/mute chrome; UI click/confirm. Interface does not mix |
| Hard, upstream | Tactical mission | Combat and mission events | Weapon+side, Alert 0–3, live Weather, objective, death, hit, interact, ability, blast, reload. Tactical does not mix |
| Hard, upstream | Persistence and validation | Settings slot | Hydrate mute + four channel levels. Not the campaign blob |
| Soft, none | World Network, Economy, Research, Roster | — | No bed keyed to sector, payout, program, or dossier |

Bidirectional intent: Interface already lists Audio as mix owner (soft, downstream). Tactical already lists mix ownership as Audio. Persistence already lists audio in the settings slot. This file lists Interface and Tactical as hard upstream, Persistence as hard upstream for the slot. Do not edit sibling files in this pass.

**Not dependencies:** `hit_chance` (Tactical); collateral CR (Economy); Opening hour lighting (Tactical); palette tokens (Interface / engineering contract).

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §15, §17, and the audio README for runtime caps. This GDD does not add ranges. Changing a knob requires checking the living spec and the README, not this pointer. Do not add Hz tables, compressor ratios, or overlap integers here.

| Knob | Owner | Too high / too low |
|---|---|---|
| Four channels + master + mute | §15 | A fifth “gameplay” bus; mute that discards stored levels |
| UI below weapon reports | §15 | UI clicks masking gunfire; combat so loud the OS vanishes |
| Required voice set | §15 | Missing alert sting or operative-hit; extra VO lines |
| CorpSec quieter/narrower same firearm | §15 | CorpSec as a different weapon; CorpSec as loud as squad |
| Strategy bed = four Screens only | §15 / `strategyAudio.ts` | Restart per Screen; bed into Menu/Mission/Debrief |
| Mission bed = 1 of 3 unseeded | §15 / §17 | Keying to contract/weather/Opening hour/Threat |
| Rain follows live weather; silent on none | §15 / ADR-0006 | Rain on a dry mission; a third “drizzle” loop |
| Alert-tension follows Alert 0–3 | §15 | Drone keyed to Threat or Awareness; stacked layers on re-ramp |
| Unseeded jitter / bed pick | §17 | Seeding them into the mission RNG; letting them change outcomes |
| Overlap caps / rate limits / late-load drop | README runtime | Forking integers into this GDD; unlimited stacking; delayed bursts |
| Captions | §19.6 backlog | Treating absence as a GDD fail |

**Interacts:** mute folds `staged_gain`; weather drives `rain_voice` only (not `mission_bed_pick`); Alert drives `alert_tension` only (not music). Difficulty must not silence the mix as an information lever.

## Visual/Audio Requirements

This **is** the audio system. Spectacle remains neon + terminal chrome (Interface / §14). Night and rain host it; they are not it. Audio prices violence; it does not celebrate it.

| Event | Audio | Visual owner | Priority |
|---|---|---|---|
| Selection / order | Short UI-bus acknowledgement click — not VO | Interface rings / routes | High |
| Menu / Settings / authorize | UI click / confirm | Interface chrome | High |
| Gunfire | Weapon-specific report on combat bus; CorpSec quieter/narrower | Tracers / muzzle (Tactical / Interface) | High |
| Reload / blast / ability | Combat bus; ability is not an order confirm | HUD / VFX | High |
| Alert / suspicion | Alert sting + tension drone on combat bus | HUD Alert, cones, markers | High |
| Operative hit / death | Thump / thud on combat bus | Red flash / pips | High |
| Objective complete | UI-bus objective cue | Amber → green | Med |
| Weather front | Rain crossfade; no new bed | HUD Weather; Comm log | High |
| Four Screens | Strategy industrial loop (music) | One OS chrome | High |
| Mission | City-hum (ambience), 1 of 3 | District | High |
| Debrief / quiet replay | No celebration sting | Invoice chrome | High |
| Abort armed | No mission-end sting | Pause two-step | High |

No spoken operative dialogue. No spatial audio model. No second musical language. No Opening hour bed. No external art pipeline (audio clips are the committed CC0 set + synthesized drone, not an open asset firehose).

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:audio` to produce per-asset descriptions from this section. (This project’s audio set is the committed CC0 clips in `inspiration/audio/`; do not treat asset-spec as permission to add spoken VO or an external music pipeline.)

## UI Requirements

Screens and HUD belong to Interface. This GDD only requires that Settings expose master, UI, combat, music, ambience, and mute; that each control affects its channel; that unmuting restores chosen levels; and that those settings survive reload and New Operation. No Audio-owned screen. Captions are backlog, not a Settings row.

| Information | Display location | Update | Condition |
|---|---|---|---|
| Master / UI / combat / music / ambience / mute | Settings overlay (Interface) | Player | Persist in settings slot, not campaign |
| Unlock | First gesture (Menu or any) | Once per context | Must not block play if audio fails |

**📌 UX Flag — Audio**: Settings volume chrome is Interface. In Phase 4 (Pre-Production), run `/ux-design` for Settings (audio block) **before** writing epics. Stories that reference sliders should cite `design/ux/settings.md` (or the Interface UX spec), not this GDD directly.

## Acceptance Criteria

Living spec §15 plus `docs/click-through.md` Audio changes. Criteria are independently verifiable without the rest of this GDD. Open Questions are not ACs. Do not invent product performance budgets. Do not convert §20 playtest tasks into pass/fail gates. Do not re-own Tactical Alert math or Interface layout ACs except where the mix is the observable.

`qa-lead` not consulted — D2 extract. Review manually before production.

### Mixer and settings

1. **GIVEN** Settings with relevant sounds playing, **WHEN** master, UI, combat, music, ambience, and mute are each exercised, **THEN** each control affects its channel, mute silences all channels, and unmuting restores the chosen levels.
2. **GIVEN** mute and channel levels changed from defaults, **WHEN** the session reloads, **THEN** those audio settings match. **WHEN** New Operation is confirmed, **THEN** they still match (Persistence settings slot).
3. **GIVEN** audio unavailable, **WHEN** the game is played, **THEN** play is not blocked.

### Voices and buses

4. **GIVEN** a live mission, **WHEN** selection, UI click, confirmation, interaction progress, objective-complete, reload, blast, ability, alert sting, death, operative hit, and each weapon gunshot (squad and CorpSec) are exercised, **THEN** each required voice exists, weapon identities remain distinct, CorpSec gunfire sits below squad gunfire, interface cues stay below weapon reports, and impacts/warnings remain readable during overlapping fire.
5. **GIVEN** overlapping gunfire, **WHEN** the mix is inspected, **THEN** stacking remains bounded and finished one-shot sources disconnect. Exact cap integers are README runtime, not this AC’s pass numbers.

### Beds, rain, Alert

6. **GIVEN** navigation World Network → Research → Brief → Assembly, **WHEN** the strategy bed is heard, **THEN** the same source keeps playing and it is the industrial loop on music. **WHEN** the director enters Menu, Mission, or Debrief, **THEN** that bed stops.
7. **GIVEN** a mission start, **WHEN** the mission bed starts, **THEN** it is one of the three city-hum clips, not keyed to contract, district, Opening hour, weather, or Threat, and it stops on leave.
8. **GIVEN** live weather none, light, and heavy (including a scripted front), **WHEN** rain is heard across a full loop and the transitions, **THEN** none is silent, light and heavy are the matching recordings, transitions do not click or gap, and leaving the mission while rain is loading or playing does not restart rain after departure.
9. **GIVEN** Alert 0 then a rise into 1–3 then mission end, **WHEN** the tension drone is heard, **THEN** it is silent at 0, ramps with Alert, sits on the combat bus, and releases when the mission ends without a stacked second layer.

### Late load, determinism, out of scope

10. **GIVEN** a cold cache, **WHEN** UI or combat fires before clips are decoded, **THEN** earlier events do not replay as a delayed burst. Console shows no loading/decoding failure that still plays late.
11. **GIVEN** two deploys of the same seeded contract, **WHEN** mission-bed clip and gunshot playback-rate jitter are compared, **THEN** they may differ, and the sim outcome (hits, weather script, Opening hour) does not.
12. **GIVEN** Debrief (including quiet replay) or Abort-armed pause, **WHEN** the mix is heard, **THEN** there is no celebration sting and no mission-end sting on Abort arm.
13. **GIVEN** the shipping mix, **WHEN** spoken VO or a spatial-panned shooter model is listened for, **THEN** neither is present.

**Flagged — not Audio pass/fail:** Tactical Alert derivation; Weather script timing; Interface 1280×720 clipping; captions backlog; README overlap integers as product budgets; §20 playtest thresholds.

## Open Questions

| # | Question | Owner | Do not |
|---|---|---|---|
| 1 | Settings slider numeric scale (percent vs 0–1) | Interface Settings chrome / Persistence slot | Import 0–100 from code into this GDD |
| 2 | Overlap cap / rate-limit / late-load window integers | audio README runtime | Fork them here as design knobs |

Living spec §19 closed questions stay closed. Spoken VO and spatial audio stay out of scope unless reopened. Captions for audio cues stay product backlog (§19.6).
