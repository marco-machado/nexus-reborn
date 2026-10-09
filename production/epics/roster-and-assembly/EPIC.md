# Epic: Roster and Assembly

> **Layer**: Feature
> **GDD**: design/gdd/roster-and-assembly.md
> **Architecture Module**: Roster — `campaignStore` roster (operatives, wear/`appliedIds`, mass gate, fail flags)
> **Status**: Ready
> **Stories**: 25 — see the Stories table below

## Overview

The roster is the house’s living operatives — cap eight, campaign starts full — and **Assembly** is where the director inspects dossiers, assigns **one to four Ready** operatives to Squad bays, wears or pins augmentation bays, fills Item slots, and passes the **deployment mass gate**. Inspection and assignment are separate; at least one operative stays assigned while the player edits. Empty squad bays do not block deploy; every assigned operative must be Ready; a selected contract and mass **over 400 kg** still refuse. A kill is permanent (KIA at debrief). Injury recovery and the candidate market run on **strategic time**; a win’s ETA catch-up can finish recovery in the same debrief ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Quiet replay still applies roster ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)). Worn blueprints and experience are sampled at deploy, not mid-mission ([ADR-0005](../../docs/architecture/adr-0005-blueprint-assignment.md), [ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)). Without this system the director has no personnel choice, research has nowhere to land on a later firefight, and a kill is not a campaign cost.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001: Two clocks, never both](../../../docs/architecture/adr-0001-two-clocks.md) | Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none. | LOW |
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0004: A won contract does not pay twice](../../../docs/architecture/adr-0004-quiet-replay.md) | A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full. | LOW |
| [ADR-0005: Research is a program; bays wear blueprints](../../../docs/architecture/adr-0005-blueprint-assignment.md) | Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay. | LOW |
| [ADR-0009: Partitioned deploy snapshot](../../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md) | Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create. | LOW |
| [ADR-0019: Deploy gate](../../../docs/architecture/adr-0019-deploy-gate.md) | Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg. | LOW |
| [ADR-0020: Campaign fail flags](../../../docs/architecture/adr-0020-campaign-fail-flags.md) | campaignFailed and campaignWon are two booleans; a completed campaign survives a roster wipe. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-roster-001 | Deploy gate requires 1–4 Ready operatives; empty bays are legal; squad mass must be ≤ 400 kg | ADR-0019 ✅ |
| TR-roster-002 | Wear, Experience, items, mass, and mass tier freeze when the mission is created | ADR-0002, ADR-0005, ADR-0009 ✅ |
| TR-roster-003 | Injury recovery and the candidate market run on strategic t; a win ETA can finish recovery | ADR-0001 ✅ |
| TR-roster-004 | Quiet replay still applies KIA, injury, and Experience | ADR-0004 ✅ |
| TR-roster-005 | Roster slice owns resolved wear and ordered appliedIds; Research slice is the unslotted set only | ADR-0009 ✅ |
| TR-roster-006 | Abort writes no roster; debrief applies roster once | ADR-0002 ✅ |
| TR-roster-007 | An empty incomplete roster fails the campaign; a completed campaign stays complete after a wipe | ADR-0020 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/roster-and-assembly.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Operative mass reference values | Logic | Ready | ADR-0019 |
| 002 | Item-slot and pool mass terms | Logic | Ready | ADR-0019 |
| 003 | Squad mass sum and mass gate | Logic | Ready | ADR-0019 |
| 004 | Mass tier: light and standard bands | Logic | Ready | ADR-0019, ADR-0009 |
| 005 | Mass tier heavy band and the 400 kg limit | Logic | Ready | ADR-0019 |
| 006 | canDeploy allows one to four Ready operatives | Logic | Ready | ADR-0019 |
| 007 | canDeploy refusals: no contract, none assigned, not Ready | Logic | Ready | ADR-0019 |
| 008 | Assembly assign and unassign edits | Logic | Ready | ADR-0019 |
| 009 | Assembly opens without auto-assign; Injured dossier is inspect-only | UI | Ready | ADR-0019 |
| 010 | New campaign roster: eight living, Raven Injured | Logic | Ready | ADR-0001 |
| 011 | Role kits resolve from the operative role | Logic | Ready | ADR-0009 |
| 012 | injuryRecoverySec helper values | Logic | Ready | ADR-0001 |
| 013 | Debrief classifies survivors as Ready, Injured, or KIA | Logic | Ready | ADR-0002, ADR-0021 |
| 014 | KIA removes the operative from the living roster | Integration | Ready | ADR-0002, ADR-0005 |
| 015 | Experience award and deploy sampling | Logic | Ready | ADR-0009, ADR-0002 |
| 016 | Injury recovery on strategic sync | Logic | Ready | ADR-0001, ADR-0018 |
| 017 | Win ETA catch-up of injury downtime | Logic | Ready | ADR-0001 |
| 018 | Loss and quiet-replay debrief roster apply | Integration | Ready | ADR-0004, ADR-0001 |
| 019 | Abort writes no roster; debrief applies roster once | Integration | Ready | ADR-0002, ADR-0021 |
| 020 | Deploy freeze of the Roster slice | Integration | Ready | ADR-0009, ADR-0002 |
| 021 | Augmentation bay wear resolution | Logic | Ready | ADR-0005, ADR-0009 |
| 022 | Candidate market offers and hire cost | Logic | Ready | ADR-0001 |
| 023 | Hire refusals and success | Logic | Ready | ADR-0013 |
| 024 | Campaign fail on empty roster | Logic | Ready | ADR-0020 |
| 025 | Roster save and reload | Integration | Ready | ADR-0011 |

## Next Step

Run `/story-readiness production/epics/roster-and-assembly/story-001-operative-mass-reference-values.md`, then `/dev-story`. Work through stories in order — each story’s `Depends on:` field names what must be DONE first.
