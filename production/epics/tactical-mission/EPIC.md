# Epic: Tactical mission

> **Layer**: Feature
> **GDD**: design/gdd/tactical-mission.md
> **Architecture Module**: Tactical — `src/game/`, `src/world/citygen.ts` (`WorldApi` sim, citygen, weather script, Opening hour)
> **Status**: Ready
> **Stories**: 16 — see the Stories table below

## Overview

The tactical mission is the director’s command language on the street they never walk: **Select / Move / Attack / Hold Ground / Hold Fire** (plus Stop). Tempo and position, not every shot; operatives acquire visible targets when weapons are free. One seed builds the district, weather script, Opening hour, CorpSec, civilians, fire lanes, and seven objective kinds, and that lifetime is unsaved ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)) — citygen is infrastructure under the verbs, not the lead. Tactical time does not tick the World Network ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Weather is a determined script the brief tells the truth about ([ADR-0006](../../docs/architecture/adr-0006-weather-script.md)); Opening hour lights dusk or night and is frozen for the deployment ([ADR-0007](../../docs/architecture/adr-0007-opening-hour.md)). Hardened vs Standard changes the fight (patrols, civilians, confirmation, accuracy, a metre of vision, optional windows); it does not hide the minimap. Missed rounds continue; the first Unit in the fire lane is hit. Win or loss still debriefs, including quiet replay ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)); debrief is the only campaign write-back. Glass Veil, Hollow Crown, and Rust Haven are authored tactical problems, not reskins. Without this system the director has no orders, chrome or citygen would lead, and violence would be flavor instead of a board the invoice can price.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001: Two clocks, never both](../../../docs/architecture/adr-0001-two-clocks.md) | Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none. | LOW |
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0006: Weather is a script, not a roll mid-fight](../../../docs/architecture/adr-0006-weather-script.md) | Weather is fixed at mission create: at most one adjacent-intensity change at a set tactical time. | LOW |
| [ADR-0007: Opening hour is per-mission, not the look](../../../docs/architecture/adr-0007-opening-hour.md) | Opening hour is presentation only, per mission, independent of strategic time and weather. | LOW |
| [ADR-0009: Partitioned deploy snapshot](../../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md) | Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create. | LOW |
| [ADR-0016: Tactical sim contract](../../../docs/architecture/adr-0016-tactical-sim-contract.md) | Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator. | MEDIUM |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-tactical-001 | District, weather script, Opening hour, and objectives share one seed and one unsaved lifetime | ADR-0002, ADR-0006, ADR-0007 ✅ |
| TR-tactical-002 | Five verbs plus auto-acquire; custom TypeScript sim with no physics engine | ADR-0016 ✅ |
| TR-tactical-003 | Weather is a determined script with at most one adjacent change; the brief tells the truth | ADR-0006 ✅ |
| TR-tactical-004 | Opening hour is per-mission; lighting is frozen; it does not change sight, noise, or risk | ADR-0007 ✅ |
| TR-tactical-005 | Tactical clock is independent of strategic time; in-mission pause freezes it | ADR-0001 ✅ |
| TR-tactical-006 | A missed round continues down the fire lane; the first Unit before cover is hit; Tactical counts N | ADR-0016 ✅ |
| TR-tactical-007 | Deterministic 96×96 m citygen and one-metre walk grid from the mission seed | ADR-0016 ✅ |
| TR-tactical-008 | Camera is fixed 45° yaw / 55° elevation / 25° FOV, zoom 44–115 m; no rotate or tilt; minimap up equals screen up | ADR-0016 ✅ |
| TR-tactical-009 | Hardened is a discrete profile; it must not hide minimap information | ADR-0016 ✅ |
| TR-tactical-010 | Win or Loss shows a HUD result then debriefs after 2.5 s; abort emits no outcome DTO | ADR-0002 ✅ |
| TR-tactical-011 | quietReplay is stamped from the frozen Economy slice, not live contractsWon | ADR-0009 ✅ |
| TR-tactical-012 | A Win and a total squad wipe in the same step resolve as the Win — required completion wins; deaths still grade KIA | ADR-0016 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/tactical-mission.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Opening selection and Select-all are the living set | Logic | Ready | ADR-0016 |
| 002 | Dead ids, empty selection, and Attack on a Device are no-ops | Logic | Ready | ADR-0016 |
| 003 | Move clears target and Hold Ground; stop-to-engage on the path | Logic | Ready | ADR-0016 |
| 004 | Idle auto-acquire and Attack under Hold Ground and Hold Fire | Logic | Ready | ADR-0016 |
| 005 | Hold Fire clears automatic targets but keeps a standing Explicit | Logic | Ready | ADR-0016 |
| 006 | Hold Ground pins and parks the path; Stop clears pathing and keeps stance bits | Logic | Ready | ADR-0016 |
| 007 | Same seed builds the same mission; brief and deploy agree | Integration | Ready | ADR-0006 |
| 008 | Weather retunes CorpSec sight and weapon noise only | Logic | Ready | ADR-0006 |
| 009 | Opening hour changes no sight, noise, or risk; risk index formula | Logic | Ready | ADR-0007 |
| 010 | civiliansHit counts unique squad-caused civilian first-hits | Logic | Ready | ADR-0016 |
| 011 | Cover interrupts the fire lane; hit chance formula | Logic | Ready | ADR-0016 |
| 012 | Eliminate counts tagged Units only; optionals never gate the win | Logic | Ready | ADR-0016 |
| 013 | Loss conditions; abort emits no outcome DTO | Integration | Ready | ADR-0002 |
| 014 | Quiet replay outcome and the deploy freeze | Logic | Ready | ADR-0009 |
| 015 | Hardened profile keeps minimap data; camera pose is fixed | Integration | Ready | ADR-0016 |
| 016 | Grenade confirm spends one power cell; refusal spends nothing | Logic | Ready | ADR-0016 |


## Next Step

Run `/story-readiness production/epics/tactical-mission/story-001-opening-selection-and-select-all-are-the-living-set.md`, then `/dev-story` on it. Stories 001–006 (command verbs) chain in order; 007, 010, 012, 015, and 016 have no in-epic dependencies.
