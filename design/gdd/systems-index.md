# Systems Index: Nexus Reborn

> **Status**: Draft
> **Created**: 2026-09-07
> **Last Updated**: 2026-09-08 (Audio D2 extract)
> **Source Concept**: `design/gdd/game-concept.md` (extract from `docs/game-design.md` §§1–4)
> **Technical Director Review (TD-SYSTEM-BOUNDARY)**: CONCERNS (accepted) 2026-09-07
> **Producer Review (PR-SCOPE)**: OPTIMISTIC 2026-09-07
> **Creative Director Review (CD-SYSTEMS)**: CONCERNS 2026-09-07

---

## Overview

Nexus Reborn is a remote-command tactics game: the Operations Director reads the World Network, funds one research program, accepts deniable contracts, and issues a few orders to a squad of one to four operatives. The living specification is `docs/game-design.md`; this index is the Aesir map of that spec so pipeline skills can see systems, layers, priorities, and status tokens.

This is a brownfield index of the shipping cut. All eight systems are already specified and implemented. Rows are not new scope. Template GDD files under `design/gdd/` will be extracts that alias living-spec sections; they must not become a second ruleset.

---

## Systems Enumeration

| # | System Name | Layer | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|-------|----------|----------|--------|------------|------------|
| 1 | World Network | Foundation | Core | MVP | Designed | design/gdd/world-network.md | — |
| 2 | Economy and contracts | Core | Economy | MVP | Approved | design/gdd/economy-and-contracts.md | World Network |
| 3 | Research | Core | Progression | MVP | Designed | design/gdd/research.md | World Network, Economy and contracts |
| 4 | Persistence and validation | Core | Persistence | MVP | Designed | design/gdd/persistence-and-validation.md | World Network, Economy and contracts, Research, Roster and Assembly |
| 5 | Roster and Assembly | Feature | Gameplay | MVP | Designed | design/gdd/roster-and-assembly.md | World Network, Economy and contracts, Research |
| 6 | Tactical mission | Feature | Gameplay | MVP | Designed | design/gdd/tactical-mission.md | World Network, Economy and contracts, Research, Roster and Assembly |
| 7 | Interface | Presentation | UI | MVP | Designed | design/gdd/interface.md | World Network, Economy and contracts, Research, Roster and Assembly, Tactical mission, Persistence and validation |
| 8 | Audio | Presentation | Audio | MVP | Designed | design/gdd/audio.md | Interface, Tactical mission |

Status tokens are exact: `Not Started`, `In Progress`, `In Review`, `Designed`, `Approved`, `Needs Revision`. `Designed` means `design/gdd/<system>.md` exists with the eight required headings (D2 alias of the living spec). Do not mark `Approved` until independent `/design-review` passes.

---

## Categories

| Category | Description | Typical Systems |
|----------|-------------|-----------------|
| **Core** | Foundation systems everything depends on | World Network |
| **Gameplay** | The systems that make the game fun | Roster and Assembly, Tactical mission |
| **Progression** | How the player grows over time | Research |
| **Economy** | Resource creation and consumption | Economy and contracts |
| **Persistence** | Save state and continuity | Persistence and validation |
| **UI** | Player-facing information displays | Interface |
| **Audio** | Sound and music systems | Audio |

Narrative, Meta, and unused template categories are omitted. Accessibility backlog in `docs/game-design.md` §19 is not a system.

---

> **Creative Director Note (MVP):** The eight systems deliver the Operations Director fantasy; do not add or drop rows. Binding extract gaps: (1) exclusive owners for Credits / Influence / intel so World Network is not only a contract picker; (2) Tactical GDD must lead with Select / Move / Attack / Hold Ground / Hold Fire so chrome cannot bury command; (3) Debrief is the invoice beat — Interface presents, Economy prices, World Network applies sector/unrest, Persistence applies once.

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Required for the core loop. Without these, the director fantasy cannot be tested. | Shipping cut already in `src/` | Extract FIRST |
| **Vertical Slice** | Unused — no unbuilt slice distinct from MVP | — | — |
| **Alpha** | Unused — mechanical scope is already complete | — | — |
| **Full Vision** | Unused — would falsify live systems as optional | — | — |

All eight systems are MVP. Product-tier cuts do not apply. Documentation depth uses the stop-ladder below.

---

## Documentation stop-ladder

Not product tiers. The playable game remains shippable at every stop because `docs/game-design.md` stays source of truth.

| Depth | Deliverable | Why stop here |
|-------|-------------|---------------|
| D1 | This index + `design/gdd/game-concept.md` + `design/gdd/game-pillars.md` | Unblocks `/design-system` and later extracts |
| D2 | Thin pointer GDDs for all eight systems: eight required headings alias living-spec sections; no rule rewrite | Aesir skills and `/gate-check` can see MVP files |
| D3 | Deepen Tactical mission and Interface only if a skill still cannot operate | Size bottlenecks; optional |

Under time pressure, stop at D2. Do not drop a system from this index.

---

## Dependency Map

Design and extract from top to bottom. Systems at the top are foundations.

### Foundation Layer (no dependencies)

1. World Network — two clocks, sectors, intel; the director's job between missions

### Core Layer (depends on foundation)

1. Economy and contracts — depends on: World Network
2. Research — depends on: World Network, Economy and contracts
3. Persistence and validation — depends on: World Network, Economy and contracts, Research, Roster and Assembly

### Feature Layer (depends on core)

1. Roster and Assembly — depends on: World Network, Economy and contracts, Research
2. Tactical mission — depends on: World Network, Economy and contracts, Research, Roster and Assembly

### Presentation Layer (depends on features)

1. Interface — depends on: all gameplay systems plus persistence
2. Audio — depends on: Interface, Tactical mission

### Polish Layer (depends on everything)

None.

Persistence is Core but lists Roster (Feature) as a dependency: schema sink, not a behavior cycle. Envelope can be sketched after World Network; freeze the roster blob after the Roster GDD.

---

## Recommended Design Order

Extract template GDDs in this order. Independent systems at the same layer can proceed in parallel only after their dependencies have heading-complete files.

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | World Network | MVP | Foundation | game-designer | M |
| 2 | Economy and contracts | MVP | Core | game-designer, economy-designer | M |
| 3 | Research | MVP | Core | game-designer | M |
| 4 | Roster and Assembly | MVP | Feature | game-designer | M |
| 5 | Persistence and validation | MVP | Core | game-designer | S |
| 6 | Tactical mission | MVP | Feature | game-designer, systems-designer | L |
| 7 | Interface | MVP | Presentation | ux-designer, ui-programmer | L |
| 8 | Audio | MVP | Presentation | audio-director, sound-designer | S |

Effort: S = 1 session, M = 2–3 sessions, L = 4+ sessions. These are extract/retrofit sessions, not implementation. Prefer D2 heading-alias passes over full re-authoring.

Also required before `/design-system`: `design/gdd/game-concept.md` and `design/gdd/game-pillars.md` from living spec §§1–4 and §2.

---

## Circular Dependencies

- World Network ↔ Economy and contracts ↔ Tactical mission: mission results change the network; contracts consume sector state. **Resolution:** deploy takes a snapshot; debrief is the only campaign write-back (ADR-0001, ADR-0002). Do not re-own that protocol per GDD.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|------------------|------------|
| Tactical mission | Scope | Citygen, combat, weather, Opening hour, and objectives share one seed and unsaved lifetime | Internal module map in the GDD; do not split the system |
| Interface | Scope | Screens, HUD, controls, and art rules are one Presentation wrap | Internal module map; art is not a runtime system |
| World Network | Design | Sectors, clock, events, Influence actions, and intel are one strategy job | Name exclusive owners vs Economy for Credits, Influence, intel |
| Persistence and validation | Technical | Core layer depends on Feature roster blob | Envelope early; freeze schema after Roster extract |
| Economy and contracts | Design | Credits, Influence, and intel are dual-homed across stores | Exclusive owners in Dependencies; no new systems |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 8 |
| Design docs started | 8 |
| Design docs reviewed | 1 |
| Design docs approved | 1 |
| MVP systems designed | 8/8 template-path files; 8/8 living-spec |
| Vertical Slice systems designed | 0/0 |

---

## Next Steps

- [x] Extract `design/gdd/game-concept.md` and `design/gdd/game-pillars.md` (D1 remainder)
- [x] World Network + Economy and contracts D2 extracts (`design/gdd/world-network.md`, `design/gdd/economy-and-contracts.md`)
- [x] Research D2 extract (`design/gdd/research.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [x] Roster and Assembly D2 extract (`design/gdd/roster-and-assembly.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [x] Persistence and validation D2 extract (`design/gdd/persistence-and-validation.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [x] Tactical mission D2 extract (`design/gdd/tactical-mission.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [x] Interface D2 extract (`design/gdd/interface.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [x] Audio D2 extract (`design/gdd/audio.md`) — CD-GDD-ALIGN APPROVED; pending independent `/design-review`
- [ ] Run `/design-review` on each completed template GDD (fresh session each)
- [ ] Run `/setup-engine` — technical preferences still unconfigured
- [ ] Run `/gate-check systems-design` — D2 MVP files now exist
- [ ] Do not regenerate `docs/game-design.md`; alias it until a later stub decision
