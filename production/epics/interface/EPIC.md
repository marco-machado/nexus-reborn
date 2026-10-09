# Epic: Interface

> **Layer**: Presentation
> **GDD**: design/gdd/interface.md
> **Architecture Module**: Interface — `src/ui/`, `src/scene/` (phase router, DOM, HUD, tokens, canvas host)
> **Status**: Ready
> **Stories**: 12 — see the Stories table below

## Overview

The interface is the game’s character: a secure corporate OS wrapped around a readable tactical picture, not a HUD pasted on a shooter. Every surface is a module of the same terminal — near-black, teal, amber, red — so Menu, the four **Screens** (World Network, Research, Brief, Assembly), the Mission HUD, and **Debrief** are rooms of one building, not two visual languages ([pillar 5](game-pillars.md)). The director never walks the street; they read, authorize, and issue a few orders through this OS. DOM sits around and over the 3D scene. Critical state is never color alone. Text must remain legible at **1280×720**; clipping or truncation at that size is a bug. Chrome cannot bury **Select / Move / Attack / Hold Ground / Hold Fire**. Debrief is the invoice beat: Interface **presents**; Economy **prices**; World Network **applies** sector/unrest/ownership/Influence/Intel; Roster **grades** KIA/injury; Persistence **commits once**. Without this system the director has no terminal, the five verbs drown in spectacle, and the two-layer loop is unreadable.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0010: Mission renderer and frame loop](../../../docs/architecture/adr-0010-mission-renderer-and-frame-loop.md) | WebGPURenderer + await init() + r3f createRoot; one RenderPipeline submit; per-frame data stays out of React. | HIGH |
| [ADR-0017: One OS / input / audio mixer](../../../docs/architecture/adr-0017-one-os-input-audio-mixer.md) | One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only. | LOW |
| [ADR-0020: Campaign fail flags](../../../docs/architecture/adr-0020-campaign-fail-flags.md) | campaignFailed and campaignWon are two booleans; a completed campaign survives a roster wipe. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-interface-001 | One corporate OS; palette from index.css and tokens.ts; no public/ art; DOM around the 3D scene | ADR-0017 ✅ |
| TR-interface-002 | 1280×720 must not clip or truncate; critical state is never color-only; Quality is not a design lever | ADR-0010, ADR-0017 ✅ |
| TR-interface-003 | Session phase router is Menu, four Screens, Mission, and Debrief | ADR-0017 ✅ |
| TR-interface-004 | Per-frame unit data stays out of React state; the scene reads the world imperatively | ADR-0010 ✅ |
| TR-interface-005 | Mission canvas uses WebGPURenderer, await init(), and r3f createRoot — not stock Canvas | ADR-0010 ✅ |
| TR-interface-006 | Pause Abort is two-step; there is no mid-mission save chrome | ADR-0002 ✅ |
| TR-interface-007 | One remap table; pause, operative slots, and mouse are reserved; keyboard and mouse, desktop only | ADR-0017 ✅ |
| TR-interface-008 | A pyrrhic win (same-step wipe-Win on an incomplete campaign) pays the full win outcome; the CAMPAIGN FAILED banner takes precedence and the invoice notes PYRRHIC — SQUAD LOST // CAMPAIGN FAILED | ADR-0020 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/interface.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [Every surface fits 1280×720 at every text scale](story-001-every-surface-fits-1280-720-at-every-text-scale.md) | UI | Ready | ADR-0017 |
| 002 | [Critical state has non-color cues; one OS styling](story-002-critical-state-has-non-color-cues-one-os-styling.md) | Visual/Feel | Ready | ADR-0017 |
| 003 | [Contract navigation gates Brief, Assembly, and Deploy](story-003-contract-navigation-gates-brief-assembly-and-deploy.md) | UI | Ready | ADR-0017 |
| 004 | [Chance vs Risk bands and World Network owner readouts](story-004-chance-vs-risk-bands-and-world-network-owner-readouts.md) | UI | Ready | ADR-0017 |
| 005 | [Research Authorize, keyboard activation, and focus return](story-005-research-authorize-keyboard-activation-and-focus-return.md) | UI | Ready | ADR-0017 |
| 006 | [Menu Continue, New Operation, and telemetry persistence chrome](story-006-menu-continue-new-operation-and-telemetry-persistence-c.md) | UI | Ready | ADR-0017 |
| 007 | [Minimap, weather chip, and tutorial toasts in the mission HUD](story-007-minimap-weather-chip-and-tutorial-toasts-in-the-mission.md) | UI | Ready | ADR-0010 |
| 008 | [Pause modal and two-step Abort](story-008-pause-modal-and-two-step-abort.md) | Integration | Ready | ADR-0002 |
| 009 | [Result display, Debrief entry delay, and quiet replay banner](story-009-result-display-debrief-entry-delay-and-quiet-replay-ban.md) | Integration | Ready | ADR-0002 |
| 010 | [Debrief filing status and write-failure indicators](story-010-debrief-filing-status-and-write-failure-indicators.md) | UI | Ready | ADR-0002 |
| 011 | [Pyrrhic win banner and failed-campaign Debrief actions](story-011-pyrrhic-win-banner-and-failed-campaign-debrief-actions.md) | UI | Ready | ADR-0020 |
| 012 | [Assembly hire refusals and heavy-tier hint](story-012-assembly-hire-refusals-and-heavy-tier-hint.md) | UI | Ready | ADR-0017 |

GDD AC24 (invoice money lines) is covered by economy-and-contracts story 022; the Research remaining label by research story 009.

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | [Every surface fits 1280×720 at every text scale](story-001-every-surface-fits-1280-720-at-every-text-scale.md) | UI | Ready | ADR-0017 |
| 002 | [Critical state has non-color cues; one OS styling](story-002-critical-state-has-non-color-cues-one-os-styling.md) | Visual/Feel | Ready | ADR-0017 |
| 003 | [Contract navigation gates Brief, Assembly, and Deploy](story-003-contract-navigation-gates-brief-assembly-and-deploy.md) | UI | Ready | ADR-0017 |
| 004 | [Chance vs Risk bands and World Network owner readouts](story-004-chance-vs-risk-bands-and-world-network-owner-readouts.md) | UI | Ready | ADR-0017 |
| 005 | [Research Authorize, keyboard activation, and focus return](story-005-research-authorize-keyboard-activation-and-focus-return.md) | UI | Ready | ADR-0017 |
| 006 | [Menu Continue, New Operation, and telemetry persistence chrome](story-006-menu-continue-new-operation-and-telemetry-persistence-c.md) | UI | Ready | ADR-0017 |
| 007 | [Minimap, weather chip, and tutorial toasts in the mission HUD](story-007-minimap-weather-chip-and-tutorial-toasts-in-the-mission.md) | UI | Ready | ADR-0010 |
| 008 | [Pause modal and two-step Abort](story-008-pause-modal-and-two-step-abort.md) | Integration | Ready | ADR-0002 |
| 009 | [Result display, Debrief entry delay, and quiet replay banner](story-009-result-display-debrief-entry-delay-and-quiet-replay-ban.md) | Integration | Ready | ADR-0002 |
| 010 | [Debrief filing status and write-failure indicators](story-010-debrief-filing-status-and-write-failure-indicators.md) | UI | Ready | ADR-0002 |
| 011 | [Pyrrhic win banner and failed-campaign Debrief actions](story-011-pyrrhic-win-banner-and-failed-campaign-debrief-actions.md) | UI | Ready | ADR-0020 |
| 012 | [Assembly hire refusals and heavy-tier hint](story-012-assembly-hire-refusals-and-heavy-tier-hint.md) | UI | Ready | ADR-0017 |

GDD AC24 (invoice money lines) is covered by economy-and-contracts story 022; the Research remaining label by research story 009.

## Next Step

Run `/story-readiness` on Story 001, then `/dev-story` in dependency order (001 → 002/003/004/005/006/007/010/012; 008 → 009 → 010/011).
