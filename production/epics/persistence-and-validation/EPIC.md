# Epic: Persistence and validation

> **Layer**: Core
> **GDD**: design/gdd/persistence-and-validation.md
> **Architecture Module**: Persistence — `src/state/save.ts` (three envelopes, all-or-nothing hydrate)
> **Status**: Ready
> **Stories**: 18 — see the Stories table below

## Overview

Persistence and validation is the house’s memory and the commitment cut: a **versioned local campaign blob** holds the World Network, laboratories, roster, tutorial progress, and campaign result; a **mission in progress is memory only** ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)). **Settings** and **telemetry** live in their own slots so **New Operation** does not reset the player’s preferences. The four Screens autosave without a ceremony. Mission and Debrief do not. Debrief is the only boundary that applies payout, sector movement, intel, influence, and roster, and it applies them **once in session memory**; the first **durable** write is the next Screen (World Network return or Brief Replay). Persistence **commits** that result — it does not price Credits, shove Control, or tick labs. Reload while still on Debrief restores the last Screen snapshot — an accepted escape, like Abort (living spec §19 #8, recorded 2026-10-08). Menu: **Continue** when a valid campaign blob exists — it always opens the World Network, never the field and never the Screen left. **New Operation** is a two-step erase of the house. Without this system the director could checkpoint the street, the invoice could print twice, and a reload would not return the same desk.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001: Two clocks, never both](../../../docs/architecture/adr-0001-two-clocks.md) | Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none. | LOW |
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0011: Campaign persistence envelope](../../../docs/architecture/adr-0011-campaign-persistence-envelope.md) | Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob. | LOW |
| [ADR-0015: Telemetry never leaves the machine](../../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md) | Telemetry is opt-in, local, capped at 60 FIFO, with no network egress. | LOW |
| [ADR-0022: Durable-commit (filing) status](../../../docs/architecture/adr-0022-durable-commit-status.md) | A session-only status store, written only by save.ts, reports filed / unfiled / write-failed. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-persistence-001 | A mission in progress is memory-only; there is no mid-mission resume | ADR-0002 ✅ |
| TR-persistence-002 | Three slots — campaign blob, settings, telemetry; New Operation does not reset preferences | ADR-0011 ✅ |
| TR-persistence-003 | Four Screens autosave; mission and debrief do not | ADR-0002, ADR-0011 ✅ |
| TR-persistence-004 | Debrief applies once in session memory; durable commit is the next Screen autosave | ADR-0011 ✅ |
| TR-persistence-005 | Hydrate opens at menu; Research and Roster sync(t) to saved t; reload grants no offline hours | ADR-0001, ADR-0002, ADR-0011 ✅ |
| TR-persistence-006 | An invalid or unreadable campaign blob is dropped all-or-nothing; no half-load | ADR-0011 ✅ |
| TR-persistence-007 | World Event stream and candidate market serialize RNG across reload | ADR-0011 ✅ |
| TR-persistence-008 | Telemetry is opt-in, local, capped at 60 records, and never leaves the machine | ADR-0015 ✅ |
| TR-persistence-009 | Durable-commit status (unfiled / filed / write-failed) is observable to Interface; a swallowed write failure never reports filed | ADR-0022, ADR-0011 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/persistence-and-validation.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|

## Next Step

Run `/story-readiness` on Story 001, then `/dev-story` in dependency order. Persistence rules sit in the control manifest's Foundation Layer Rules (save/load), though this epic is Core.
