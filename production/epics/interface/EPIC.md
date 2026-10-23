# Epic: Interface

> **Layer**: Presentation
> **GDD**: design/gdd/interface.md
> **Architecture Module**: Interface — `src/ui/`, `src/scene/` (phase router, DOM, HUD, tokens, canvas host)
> **Status**: Ready
> **Stories**: 36 — see the Stories table below

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
| 013 | [Four-row orientation card and the sector-panel Influence moment](story-013-four-row-orientation-card-and-sector-panel-influence-moment.md) | UI | Ready | ADR-0017 |
| 014 | [First-Debrief Research prompt](story-014-first-debrief-research-prompt.md) | Integration | Ready | ADR-0017 |
| 015 | [Brief KIT line from objective kinds](story-015-brief-kit-line-from-objective-kinds.md) | UI | Ready | ADR-0017 |
| 016 | [Failed-campaign banner reads ROSTER EMPTY // NO CONTRACT CAN BE TAKEN](story-016-failed-campaign-banner-reads-no-contract-can-be-taken.md) | UI | Complete | ADR-0017 |
| 017 | [Failed-campaign contract rows read CAMPAIGN LOST](story-017-failed-campaign-contract-rows-read-campaign-lost.md) | UI | Complete | ADR-0017 |
| 018 | [First-visit card is not aria-modal](story-018-first-visit-card-is-not-aria-modal.md) | UI | Complete | ADR-0017 |
| 019 | [Using the clock dismisses the first-visit card for the campaign](story-019-using-the-clock-dismisses-the-first-visit-card.md) | Integration | Complete | ADR-0017 |
| 020 | [STRAINED Garrison prints in the notice tone, not amber](story-020-strained-garrison-prints-in-the-notice-tone.md) | UI | Complete | ADR-0017 |
| 021 | [Unrest ink and bar follow its state](story-021-unrest-ink-and-bar-follow-its-state.md) | UI | Complete | ADR-0017 |
| 022 | [Empty Feed prints -- CHANNEL OPEN --](story-022-empty-feed-prints-channel-open.md) | UI | Complete | ADR-0017 |
| 023 | [Remove the duplicate left INFLUENCE panel](story-023-remove-the-duplicate-left-influence-panel.md) | UI | Complete | ADR-0017 |
| 024 | [RESOURCE POOL becomes INTEL](story-024-resource-pool-becomes-intel.md) | UI | Complete | ADR-0017 |
| 025 | [Each Influence action prints its effect as visible text](story-025-each-influence-action-prints-its-effect.md) | UI | Complete | ADR-0017 |
| 026 | [World Network type meets the size floors](story-026-world-network-type-meets-the-size-floors.md) | UI | Complete | ADR-0017 |
| 027 | [Ink Dim text on the World Network moves to Ink](story-027-ink-dim-text-on-the-world-network-moves-to-ink.md) | UI | Complete | ADR-0017 |
| 028 | [Feed times and the Timeline axis move off Ink Faint](story-028-feed-times-and-timeline-axis-move-off-ink-faint.md) | UI | Complete | ADR-0017 |
| 029 | [Locked contract rows dim the frame, not the text, and their reason prints in Red Hot](story-029-locked-contract-rows-dim-the-frame-not-the-text.md) | UI | Complete | ADR-0017 |
| 030 | [Idle nav tab labels reach 4.5:1 in both modes](story-030-idle-nav-tab-labels-reach-4-5-in-both-modes.md) | UI | Complete | ADR-0017 |
| 031 | [Feed rows have a 24 px hit area](story-031-feed-rows-have-a-24-px-hit-area.md) | UI | Complete | ADR-0017 |
| 032 | [Timeline track has a 24 px hit area](story-032-timeline-track-has-a-24-px-hit-area.md) | UI | Complete | ADR-0017 |
| 033 | [Speed buttons have a 24 px hit area](story-033-speed-buttons-have-a-24-px-hit-area.md) | UI | Complete | ADR-0017 |
| 034 | [Inset steppers have a 24 px hit area](story-034-inset-steppers-have-a-24-px-hit-area.md) | UI | Complete | ADR-0017 |
| 035 | [Remaining World Network pointer targets meet 24×24](story-035-remaining-world-network-pointer-targets-meet-24-px.md) | UI | Complete | ADR-0017 |
| 036 | [Every surface meets the Standard-tier type, ink and target floors](story-036-every-surface-meets-the-standard-tier-floors.md) | UI | Complete | ADR-0017 |

GDD AC24 (invoice money lines) is covered by economy-and-contracts story 022; the Research remaining label by research story 009.

Stories 013–015 (2026-10-22) implement the approved `design/difficulty-curve.md` changes; see `docs/architecture/change-impact-2026-10-21-interface.md` for the story notes.

Stories 016–035 (2026-10-23) implement the World Network UX spec's as-built deltas (`design/ux/world-network.md`, Open Questions 2–6, 8, 17, 20, 21, with the owner's 2026-10-23 rulings). IF-031 to IF-035 trace to no TR yet (hit-target size, `TR-interface-???`).

## Next Step

Run `/story-readiness` on Story 001, then `/dev-story` in dependency order (001 → 002/003/004/005/006/007/010/012; 008 → 009 → 010/011).
