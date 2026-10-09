# Epic: Audio

> **Layer**: Presentation
> **GDD**: design/gdd/audio.md
> **Architecture Module**: Audio — `src/game/audio.ts`, `src/ui/sound.ts` (four buses, beds, SFX)
> **Status**: Ready
> **Stories**: 7 — see the Stories table below

## Overview

Audio is the terminal’s ear: it confirms orders, marks danger, and prices violence. It does not narrate. Four channels (UI, combat, music, ambience) sit under a master, plus mute. Strategy music owns the four **Screens**; mission ambience (city hum plus weather rain) owns the district. Acknowledgements are a short selection click on the UI bus, not spoken operative dialogue. Weapon reports sit above UI in the authored/reference mix; player channel overrides take precedence. CorpSec uses quieter, narrower versions of the same firearm recordings. The alert-tension drone is synthesized so it can ramp with mission **Alert** (0–3) and release when the mission ends. Without this system the OS is a silent slideshow, danger has no sting, and violence has no body — a second, cinematic mix would also break **One corporate operating system**.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0006: Weather is a script, not a roll mid-fight](../../../docs/architecture/adr-0006-weather-script.md) | Weather is fixed at mission create: at most one adjacent-intensity change at a set tactical time. | LOW |
| [ADR-0011: Campaign persistence envelope](../../../docs/architecture/adr-0011-campaign-persistence-envelope.md) | Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob. | LOW |
| [ADR-0017: One OS / input / audio mixer](../../../docs/architecture/adr-0017-one-os-input-audio-mixer.md) | One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-audio-001 | Four channels plus master and mute live in the settings slot, not the campaign blob | ADR-0011, ADR-0017 ✅ |
| TR-audio-002 | Strategy bed owns the four Screens; mission bed owns the district; rain follows live weather | ADR-0006, ADR-0017 ✅ |
| TR-audio-003 | Unavailable or late audio must not block play or dump as a delayed burst; unseeded jitter must not change outcomes | ADR-0017 ✅ |
| TR-audio-004 | No spoken VO, no spatial shooter mix, and no payout celebration sting | ADR-0017 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/audio.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [Mixer: master, channels, mute, and settings persistence](story-001-mixer-master-channels-mute-and-settings-persistence.md) | Integration | Ready | ADR-0011 |
| 002 | [Voices, buses, and the reference mix](story-002-voices-buses-and-reference-mix.md) | Visual/Feel | Ready | ADR-0017 |
| 003 | [Strategy bed and mission city-hum lifetimes](story-003-strategy-bed-and-mission-city-hum-lifetimes.md) | Integration | Ready | ADR-0017 |
| 004 | [Rain follows live weather; Alert tension drone](story-004-rain-follows-live-weather-and-alert-tension-drone.md) | Visual/Feel | Ready | ADR-0017 |
| 005 | [Unavailable and late audio never block play or burst](story-005-unavailable-and-late-audio-never-burst.md) | Integration | Ready | ADR-0017 |
| 006 | [Presentation-only randomness does not change outcomes](story-006-presentation-jitter-does-not-change-outcomes.md) | Logic | Ready | ADR-0017 |
| 007 | [No celebration sting, spoken VO, or spatial shooter mix](story-007-no-celebration-sting-vo-or-spatial-mix.md) | Visual/Feel | Ready | ADR-0017 |

## Next Step

Run `/story-readiness` on Story 001, then implement in dependency order (001 → 003/005 → 002/004/006 → 007).
