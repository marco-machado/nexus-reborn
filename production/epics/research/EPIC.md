# Epic: Research

> **Layer**: Core
> **GDD**: design/gdd/research.md
> **Architecture Module**: Research — `researchStore` (laboratories, program, unslotted set)
> **Status**: Ready
> **Stories**: 20 — see the Stories table below

## Overview

Research is the house program that changes the next squad: **Credits** authorize a project; **strategic time** finishes it; effects land on the **next** deployment, not on a squad already in the field. Three laboratories — Ballistics, Cybernetics, Control Systems — seven projects each, twenty-one total. One active project per lab. Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted blueprints: a bay wears at most one completed project; every operative may wear the same one ([ADR-0005](../../docs/architecture/adr-0005-blueprint-assignment.md)). Credits debit the moment authorization succeeds; Economy owns the refuse. Laboratories catch up on World Network `t` after a Screen tick or a **win** ETA jump; a loss spends none ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Sampled at deploy. Without this system Credits have nowhere to go that changes a later firefight, and the two-layer loop is only a contract picker plus an invoice.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001: Two clocks, never both](../../../docs/architecture/adr-0001-two-clocks.md) | Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none. | LOW |
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0005: Research is a program; bays wear blueprints](../../../docs/architecture/adr-0005-blueprint-assignment.md) | Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay. | LOW |
| [ADR-0009: Partitioned deploy snapshot](../../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md) | Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create. | LOW |
| [ADR-0013: Credits never overdraw](../../../docs/architecture/adr-0013-credits-never-overdraw.md) | Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-research-001 | Research sync(t) after Screen tick or win ETA; laboratories are frozen in the field | ADR-0001 ✅ |
| TR-research-002 | Ballistics is unslotted and squad-wide; slotted bays wear one blueprint; effects sample at deploy | ADR-0005 ✅ |
| TR-research-003 | Death drops assignment, not the program; unpinned bays follow current issue | ADR-0005 ✅ |
| TR-research-004 | Research deploy-slice is the completed unslotted set only; resolved wear is not on this slice | ADR-0009 ✅ |
| TR-research-005 | Authorize via Economy debit; Research has no Credits ledger; abort does not refund | ADR-0002, ADR-0013 ✅ |
| TR-research-006 | Completions after the deploy freeze apply on the next deploy only | ADR-0002, ADR-0005, ADR-0009 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/research.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Program catalog, costs and fundability gap | Logic | Ready | ADR-0005 |
| 002 | Authorize success: start, then one debit | Logic | Ready | ADR-0013 |
| 003 | Authorize when Economy refuses or start() fails | Logic | Ready | ADR-0013 |
| 004 | Prerequisite states: locked, available, active | Logic | Ready | ADR-0005 |
| 005 | Refusal text for locked, researched and busy-lab projects | Logic | Ready | ADR-0013 |
| 006 | Other eligibility refusals; no cancel verb | Logic | Ready | ADR-0013 |
| 007 | Lab endT from authorize time and duration | Logic | Ready | ADR-0001 |
| 008 | sync(t) completes projects; completion pays nothing | Logic | Ready | ADR-0001 |
| 009 | Remaining time label appears only after sync | UI | Ready | ADR-0001 |
| 010 | Labs frozen in the field; loss and abort leave Research alone | Integration | Ready | ADR-0002 |
| 011 | done appends in ascending endT | Logic | Ready | ADR-0005 |
| 012 | Equal-endT house order within a bay | Logic | Ready | ADR-0005 |
| 013 | currentIssue by bay | Logic | Ready | ADR-0005 |
| 014 | appliedNodeIds for unpinned, stock and pinned bays | Logic | Ready | ADR-0005 |
| 015 | Pin and bay edges; death keeps the program | Logic | Ready | ADR-0005 |
| 016 | Deploy sampling: Research slice is unslotted ids only | Integration | Ready | ADR-0009 |
| 017 | Completions after the deploy freeze apply next deploy only | Integration | Ready | ADR-0009 |
| 018 | Weapon sampling from applied ids | Logic | Ready | ADR-0005 |
| 019 | crewBonus from applied ids | Logic | Ready | ADR-0005 |
| 020 | Research exposes the completed set only | Integration | Ready | ADR-0009 |

## Next Step

Run `/story-readiness production/epics/research/story-001-*.md`, then `/dev-story`.
