# World Network

> **Status**: In Design
> **Author**: extract from docs/game-design.md §5
> **Last Updated**: 2026-09-07
> **Implements Pillar**: Information is operational power; The two layers feed each other
> **Living spec**: `docs/game-design.md` §5 — this file aliases it; do not fork rules
> **Owners (2026-09-07)**: Credits = Economy; Influence wallet+spends = World Network; Tax emit = World Network → Economy; generated contract instances = Economy; Intel access resource = World Network

## Overview

The World Network is the director’s job between missions: six open sectors (Antarctica locked), a Scan of cities and contracts, and **strategic time** as a spendable resource — pause included. It is not the district and not a globe. **Control**, **Unrest**, **Tax yield**, and **Garrison condition** print per sector; there is no defense rating and no standing bar. **Influence** is a wallet spent on Stabilize, Lobby, and Expedite, not an average of Control ([ADR-0008](../architecture/adr-0008-influence-is-a-wallet.md)). **Intel** is earned in the field and spent on access and foresight. Strategic time and tactical time are independent clocks: the network does not tick in the field; a win spends ETA as catch-up, a loss spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Mission results write back only at debrief. Without this system the player has no board to read and no two-layer loop — only a contract list.

Rules and numbers stay in `docs/game-design.md` §5. This overview does not fork them.

## Player Fantasy

You sit the desk. You do not walk the street. The fantasy is competent remote command: Focus a sector, read Control, Unrest, Tax yield, and Garrison condition, and spend a few numbered Influence actions — or none. A good order is small and timed. Pause is a spend; the same strategic clock finishes laboratories, heals the roster, and pays Tax yield. After the debrief invoice, the Scan must look different: unrest, control, ownership, intel. If the first minute is only clicking a contract marker, this fantasy has failed.

This serves **Information is operational power** and **The two layers feed each other**. It does not own the invoice line items (Economy) or the five verbs (Tactical).

## Detailed Design

### Core Rules

1. **Alias.** Tables, bases, awards, bands, and formulas live in `docs/game-design.md` §5. This section names owners, states, and DTO edges.
2. **Two clocks.** World Network owns **strategic time**. It runs on the four Screens (World Network, Research, Brief, Assembly). Menu, mission, and debrief do not run it. Tactical time is independent. Opening hour is not derived from strategic now ([ADR-0001](../architecture/adr-0001-two-clocks.md), [ADR-0007](../architecture/adr-0007-opening-hour.md)).
3. **Advancement.** Only two paths: continuous Screen ticking; a **win** debrief spends contract ETA as whole strategic days. A **loss** spends none. A quiet-replay win still spends ETA. Both paths are the same time-ordered catch-up. Timeline scrub is Review, not an advancement path.
4. **Catch-up.** Fire one next due at its timestamp. Rearm from the due timestamp, not from “now.” Equal timestamps use a fixed collision order (current sim: expiry → World Event → contract generation → staged spend → pressure → Tax yield). Do not author a new order here; do not bulk-apply “N hours of effects” at the jump instant. Debrief: mission write-back at frozen `t0`, **then** ETA jump.
5. **Sectors.** Six open. Antarctica locked at every intel level. Four printed numbers only: Control, Unrest, Tax yield, Garrison condition. No defense rating, no standing bar, no NETWORK THREAT.
6. **Influence.** World Network owns the wallet **and** Stabilize / Lobby / Expedite. Opening 0. Income arrives on the debrief outcome DTO; this GDD applies it. Economy does not keep a second Influence ledger. No trickle from Control ([ADR-0008](../architecture/adr-0008-influence-is-a-wallet.md)).
7. **Intel.** World Network owns level + progress as an access resource: gates, Event forecast unlock (intel 2+), authored/generated intel gates, Expedite waiver of a **generated** gate. Earn-on-win / clean bonus / loss=0 / quiet=0 apply from the outcome DTO. Does not own Risk index math (Tactical / Brief). Store placement on `campaignStore` today is a later ADR, not a second owner.
8. **Tax.** World Network **computes** Tax yield and **emits** Credits amount + sector + tick time into Economy. Only Nexus-held sectors pay. Contested does not. Economy owns the Credits ledger.
9. **Ownership.** City holders; sector color = majority; ties = Contested. Win/loss flip at debrief or seizure event; a flip re-clients Economy’s market via a hook.
10. **Contracts on Scan.** Economy owns instances, Reward, expiry math. World Network presents. Locked generated offers do not appear. Expedite is a World Network verb on Economy records.
11. **Deploy / debrief cut.** Snapshot DTO at deploy; outcome DTO at debrief; abort = no debrief ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). World Network must not query live Roster or the running mission.
12. **Forbidden.** Influence index, standing bar, tax from non-Nexus, defense rating, NETWORK THREAT.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Strategic clock | Paused / Running; speed 1×–8× (default 2×) | Player Pause/speed on Screens; frozen in field; win debrief → ETA catch-up; loss → none |
| Timeline | Live / Review | Scrub without mutating live; not an advancement path |
| Sector | Open / Locked (Antarctica) | Never unlocks |
| Focus | One of six open | Select / step; opens on Europe |
| Garrison | Secure / Strained / Critical | Derived from Control bands (§5) |
| Unrest pressure | Off / On | On while unrest above pressure threshold |
| Crisis | Out / In | Enter/clear per §5 hysteresis; Feed events; not campaign fail |
| Sector color | Holder / Contested / Unknown | Majority of city holders; tie → Contested |
| City | Holder ∈ HOLDERS | Seizure event; debrief win → Nexus; debrief loss of Nexus city → default holder |
| Influence action | Disabled / Ready / Active (staged) | Spend debit + cooldown; Stabilize/Lobby stage on clock; Expedite instant |
| Intel | Level N, progress 0–99; foresight off (&lt;2) / on (2+) | Debrief awards; 100 progress → next level |
| Contract on Scan | Economy record, WN view | Economy + WN hooks (riot/raid/seizure/crisis/Expedite) |
| Mission coupling | Strategy / Deployed / Debrief apply-once / Abort discarded | Deploy copies snapshot; field does not tick WN; debrief applies once; abort writes nothing |

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **Economy** | Contract records, Reward, quiet/pay flags | Tax emit; garrison→Threat input; Expedite/priority/re-client/withdraw/post hooks; Scan list | Economy owns instances/payouts/Credits; WN owns clock/board/hooks |
| **Research** | — | Strategic `t` after tick or ETA jump | Research `sync(t)` |
| **Roster / Assembly** | Outcome DTO: deadIds, survivorHp, kia names (emitted, not queried live) | Strategic `t`; squad is not WN state | Roster owns bodies; WN posts KIA Feed |
| **Tactical** | Snapshot DTO at deploy | Outcome DTO at debrief | Neither side live-queries the other |
| **Interface** | Focus, clock, Feed, four readouts, action enablement | Input: Focus, Pause, speed, spends, contract select | Presentation only |
| **Persistence** | — | Strategy autosave of WN blob; mission/debrief not saved | [ADR-0002](../architecture/adr-0002-unsaved-mission.md) |

**Snapshot DTO (deploy, frozen):** sector id; Control; Unrest. Tactical derives extras. Do not pass live store handles.

**Outcome DTO (debrief, apply once):** won; quietReplay; civiliansHit; mission/city/sector identity; kia names from Roster. World Network uses these for Control/Unrest shove, ownership flip, Influence award, Intel award, Feed, generated removal. Economy uses won/quiet/civiliansHit/Reward for Credits. World Network does not compute collateral.

Quiet replay: 0 Influence, 0 Intel, no Control/Unrest shove; ETA still catch-up so Tax still emits ([ADR-0004](../architecture/adr-0004-quiet-replay.md)).

§5 text that is **not** World Network: unrest extras (Tactical); Risk index math (Tactical/Brief); generated Threat from garrison (Economy consumes the label); Credits landing on the account (Economy); labs/injuries/recruitment formulas (Research/Roster); contract Reward/expiry (Economy §9).

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §5.

The `tax_yield` formula (World Network computes; Economy deposits) is defined as:

`tax_yield = round(base × Control/100 × strain)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| base | base | int | sector table in §5 | Sector tax base (CR / 24h at 100 Control, no strain) |
| Control | Control | float | §5 | Sector control percent |
| strain | strain | float | 0.25–1.0 | 1 at unrest ≤ 60; else 1 − 0.02 per unrest point above 60, floored at 0.25 |
| tax_yield | tax_yield | int | ≥ 0 | Credits that tick would pay |

**Output Range:** Printed for every open sector; **paid** only if Nexus-held. Contested does not pay.
**Example:** See §5 opening table (North America 4,080 CR / 24h at opening Control/Unrest).

The `risk_index` formula is **not** owned here. Alias §5; Tactical/Brief compute; World Network only gates display at intel 2+.

Intel awards, Influence costs, garrison bands, unrest clamp, crisis hysteresis: alias §5. Do not copy code-only Control/Unrest mission deltas into this file.

## Edge Cases

- **If the director is in the field**: strategic time does not tick. No catch-up until a **win** debrief. A loss spends no ETA.
- **If Abort**: no debrief; World Network writes nothing ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)).
- **If quiet replay win**: 0 Influence, 0 Intel, no Control/Unrest/ownership shove; ETA catch-up still runs so Tax ticks may emit ([ADR-0004](../architecture/adr-0004-quiet-replay.md)).
- **If Timeline is in Review**: live board does not change. Scrub is not an advancement path.
- **If two dues share a timestamp**: use the existing collision order; do not invent a new table in this extract.
- **If Influence cannot be afforded or is on cooldown**: action disabled; spend is a no-op.
- **If Expedite has no generated target**: blocked.
- **If Antarctica**: locked at every intel level; no survey, no Focus cycle, no actions.
- **If sector is Contested**: Tax figure may print; it does not pay.
- **If unrest is in crisis**: not a campaign fail; recoverable per §5.
- **If World Network would read the running mission or live roster**: forbidden. Use snapshot/outcome DTOs only.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, downstream | Economy and contracts | Tax emit in; contract instances out | Credits ledger is Economy; WN does not hold it |
| Hard, downstream | Research | Strategic `t` | Labs catch up; WN does not own project formulas |
| Hard, downstream | Roster and Assembly | Strategic `t`; KIA names on outcome DTO | No live roster query |
| Hard, downstream | Tactical mission | Snapshot at deploy; outcome at debrief | No live mission query |
| Soft, downstream | Interface | Presentation | Focus, clock, Feed, spends |
| Hard, downstream | Persistence and validation | Strategy autosave | Mission/debrief excluded |
| Hard, upstream | — | Foundation | None |

Economy, Roster, and Tactical template GDDs are not extracted yet. Interfaces above are vs the living spec and are provisional until those files exist.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §5 (and `src/game/forecast.ts` / `worldStore` for implementation). This GDD does not add ranges. Changing a knob requires checking the living spec dependencies, not this pointer.

| Knob | Owner | Too high / too low |
|---|---|---|
| Clock speeds 1/2/4/8× | §5 | If pause/speed do not change what the director *does*, the clock fantasy is copy |
| Influence costs/effects/cooldowns | §5 | Unaffordable forever vs free spam |
| Tax bases / strain | §5 | Trickle vs replacing the generated market |
| Unrest pressure / crisis thresholds | §5 | Crisis unreachable vs always-on |
| Event interval 15–45 min | §5 | Dead board vs unreadable Feed |
| Intel awards and gates | §5 | Authored spine unreachable vs no gate |

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. World Network requires the Scan to read as a flat projection (not a globe), sector color = majority holder, crisis as red hatch/stroke, Feed as a record. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. No second visual language for “the map.”

## UI Requirements

Focus, Scan, sector readout (four numbers), clock/Pause/speed, Timeline, Influence actions, Feed, contract list. Screens and HUD belong to Interface. This GDD only requires that Control/Unrest/Tax/Garrison and Influence spends are visible and actionable (pillar 2 veto: undecorated numbers).

## Acceptance Criteria

- **GIVEN** the four Screens, **WHEN** strategic time is running, **THEN** the World Network clock ticks; **GIVEN** mission or debrief, **WHEN** wall-clock advances, **THEN** strategic time does not.
- **GIVEN** a win debrief, **WHEN** ETA is spent, **THEN** catch-up equals continuous ticking across the same span (events, staged Influence, Tax emit). **GIVEN** a loss, **THEN** ETA is not spent.
- **GIVEN** Abort, **THEN** no World Network write-back.
- **GIVEN** a quiet-replay win, **THEN** Influence and Intel do not change and Control/Unrest/ownership do not shove; ETA still catch-up.
- **GIVEN** Review time, **WHEN** the Timeline is scrubbed, **THEN** live sector state is unchanged.
- **GIVEN** a Nexus-held sector, **WHEN** a Tax due fires, **THEN** Economy receives the emitted Credits. **GIVEN** Contested, **THEN** no pay.
- **GIVEN** Influence below an action’s cost or on cooldown, **WHEN** the director activates it, **THEN** the spend is refused and the wallet is unchanged.
- **GIVEN** intel &lt; 2, **THEN** Event forecast is locked. **GIVEN** intel 2+, **THEN** forecast uses the same weights as the generator.
- **GIVEN** Antarctica, **THEN** no survey data at any intel level.
- **GIVEN** deploy, **THEN** Tactical receives a snapshot DTO and World Network does not read `world.ts` live. **GIVEN** debrief, **THEN** write-back applies once from the outcome DTO.

## Open Questions

- Collision order and “rearm from due `t`” are load-bearing in code and unnamed as a table in §5. Named here as a constraint; do not fork a new table until the living spec does.
- Mission-result Control/Unrest integer deltas are qualitative in §5 and numeric in code. Do not copy code numbers into this extract.
- `campaignStore` still holds intel progress in code. GDD owner is World Network; store move is a later ADR.
- Generated market physically sits in `worldStore` while Economy owns instances. Keep that split explicit in the Economy extract.
