# World Network

> **Status**: Approved
> **Author**: extract from docs/game-design.md §5
> **Last Updated**: 2026-09-16 (header Status aligned to independent `/design-review` APPROVED 2026-09-14)
> **Independent `/design-review`**: 2026-09-14 APPROVED
> **Implements Pillar**: Information is operational power; The two layers feed each other
> **Living spec**: `docs/game-design.md` §4 (campaign end), §5 (board/clock), §6 (Influence income) — this file aliases them; do not fork rules
> **Owners (2026-09-07)**: Credits = Economy; Influence wallet+spends = World Network; Tax emit = World Network → Economy; generated contract instances = Economy; Intel access resource = World Network

## Overview

The World Network is the director’s job between missions: six open sectors (Antarctica locked), a Scan of cities and contracts, and **strategic time** as a spendable resource — pause included. It is not the district and not a globe. **Control**, **Unrest**, **Tax yield**, and **Garrison condition** print per sector; there is no defense rating and no standing bar. **Influence** is a wallet spent on Stabilize, Lobby, and Expedite, not an average of Control ([ADR-0008](../../docs/architecture/adr-0008-influence-is-a-wallet.md)). **Intel** is earned in the field and spent on access and foresight. Strategic time and tactical time are independent clocks: the network does not tick in the field; a win spends ETA as catch-up, a loss spends none ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Mission results write back only at debrief. Without this system the player has no board to read and no two-layer loop — only a contract list.

Rules and numbers stay in `docs/game-design.md` §4–6. This overview does not fork them.

## Player Fantasy

You sit the desk. You do not walk the street. The fantasy is competent remote command: Focus a sector, read Control, Unrest, Tax yield, and Garrison condition, and spend a few numbered Influence actions — or none. A good order is small and timed. Pause is a spend; the same strategic clock finishes laboratories, heals the roster, and pays Tax yield. A **non-quiet** debrief applies mission consequences at frozen `t0`; the returned Scan shows the live board **after** write-back and any **win** ETA catch-up, not an intermediate `t0` screen. A **quiet replay** awards 0 Influence and 0 Intel and applies no **direct** Control/Unrest/ownership shove. Its win still spends ETA, so scheduled effects may change the Scan ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)).

Opening is not a spend minute. Influence opens at **0**; intel opens at **1** with 25/100; Focus opens on **Europe** (Helix-held: Tax may print, it does not pay). The first minute is Focus, Pause/speed, four numbers, and Feed — not Stabilize / Lobby / Expedite, and not only the Glass Veil marker. If that minute is only clicking a contract marker, this fantasy has failed.

This serves **Information is operational power** and **The two layers feed each other**. It does not own the invoice line items (Economy) or the five verbs (Tactical).

## Detailed Design

### Core Rules

1. **Alias.** Tables, bases, awards, bands, and formulas live in `docs/game-design.md` §5. Influence **income** lives in §6. Campaign complete / fail lives in §4. This section names owners, states, and DTO edges. Do not copy those tables here.

2. **Two clocks.** World Network owns **strategic time**. It runs on the four Screens (World Network, Research, Brief, Assembly). Menu, mission, and debrief do not run it. Tactical time is independent. Opening hour is not derived from strategic now ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md), [ADR-0007](../../docs/architecture/adr-0007-opening-hour.md)).

3. **Advancement.** Only two paths: continuous Screen ticking; a **win** debrief spends contract ETA as whole strategic days. A **loss** spends none. A quiet-replay win still spends ETA. Both paths are the same time-ordered catch-up. Timeline scrub is Review, not an advancement path ([ADR-0014](../../docs/architecture/adr-0014-timeline-review-is-a-view.md)).

4. **Catch-up.** Fire one next due at its timestamp. Rearm from the due timestamp, not from “now.” Equal timestamps use the collision order owned by [ADR-0018](../../docs/architecture/adr-0018-catch-up-collision-order.md) (expiry → World Event → contract generation → staged spend → pressure → Tax yield). Do not author a new table here; do not bulk-apply “N hours of effects” at the jump instant. Debrief: mission write-back at frozen `t0`, **then** ETA jump. Screen `tick` and win-ETA `advanceDays` share `advanceFlow`.

5. **Sectors.** Six open. Antarctica locked at every intel level. Four printed numbers only: Control, Unrest, Tax yield, Garrison condition. No defense rating, no standing bar, no NETWORK THREAT. Focus opens on Europe. Tax **prints** for every open sector; it **pays** only if Nexus-held.

6. **Influence.** World Network owns the wallet **and** Stabilize / Lobby / Expedite. Opening **0**. Income is living spec §6: **+6** on a non-quiet win; **+2** more if that win is clean (`civiliansHit = 0`); nothing else; no trickle from Control ([ADR-0008](../../docs/architecture/adr-0008-influence-is-a-wallet.md)). Costs are §5: Stabilize **8**, Lobby **10**, Expedite **12**. One clean win is exactly one Stabilize; a dirty first win (+6) cannot afford any action. Economy does not keep a second Influence ledger. This GDD applies income from the outcome DTO.

7. **Intel.** World Network owns level + progress as an access resource: gates, Event forecast unlock (intel 2+), authored/generated intel gates, Expedite waiver of a **generated** gate. Opening intel **1**, progress **25/100**. Awards are §5: non-quiet win **+40**; clean **+15** more; loss **0**; quiet **0**. Each **100** progress becomes the next intel level (progress toward 100, then level++). Hollow Crown and Rust Haven require intel 2. Generated gates: moderate at 1, high at 2, severe at 3. Does not own Risk index math (Tactical / Brief). Zustand home is `campaignStore.intelLevel` / `intelProgress` — not a second owner ([ADR-0012](../../docs/architecture/adr-0012-store-placement.md)).

8. **Tax.** World Network **computes** Tax yield and **emits** Credits amount + sector + tick time into Economy. Only Nexus-held sectors pay. Contested does not. A non-Nexus majority does not. Opening paying tap is **North America** only. Economy owns the Credits ledger.

9. **Ownership.** City holders; sector color = majority; ties = Contested. Win/loss flip at debrief or seizure event; a flip re-clients Economy’s market via a hook. A win hands the mission city to Nexus. A loss of a Nexus-held city returns it to its **default** holder (Nexus-default cities are a no-op on that loss — §5).

10. **Contracts on Scan.** Economy owns instances, Reward, expiry math. World Network presents. Locked **generated** offers do not appear. Authored intel-locked offers may still appear locked. Expedite is a World Network verb on Economy records. **Chance** always prints on World Network contract chrome; Tactical computes `missionChance`; Brief at intel 2+ swaps that percentage for Risk index **bands** — Chance does not leave the Scan ([Interface](interface.md)). Chance is not the Scan job (Focus / four numbers / Pause are). `selectMission` no-ops when the campaign is failed ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)).

11. **Deploy / debrief cut.** **WN slice** at deploy; outcome DTO at debrief; abort = no debrief ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md), [ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md)). World Network must not query live Roster or the running mission. Do not call the WN slice “the Snapshot DTO.”

12. **Campaign end.** World Network posts banners; Roster writes flags; Interface presents; Persistence stores ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md), living spec §4). **Complete:** all three authored contracts won — banner, contracts stay selectable (mark, not a lock). **Failed:** empty living roster on an **incomplete** campaign — banner, `selectMission` no-op. A completed campaign stays complete after a roster wipe and is not also failed. The two flags cannot both be true. A same-step tiebreak **Win** that empties the roster on an incomplete campaign is a **pyrrhic win** (living spec §10): the mission is a Win, the campaign still fails here, and the CAMPAIGN FAILED banner takes precedence over the win invoice. Unrest crisis is not campaign fail.

13. **First-visit overlay.** World Network owns the **job taught** on first visit: panel groups, Research tab, Pause is a spend, Influence opens at 0, Tax pays only if Nexus-held, clock is a resource. Interface owns chrome. The overlay must not onboard “click the marker.”

14. **Forbidden.** Influence index, standing bar, tax from non-Nexus, defense rating, NETWORK THREAT, treating Review as a third clock, calling the WN slice “the Snapshot DTO.”

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Strategic clock | Paused / Running; speed 1×–8× (default 2×) | Player Pause/speed on Screens; frozen in field; win debrief → ETA catch-up; loss → none |
| Timeline | Live (`review = null`) / Review (pin) | Scrub writes the pin only; not an advancement path. Scan four numbers stay **live**. Feed / TimeCode / handle follow the pin ([ADR-0014](../../docs/architecture/adr-0014-timeline-review-is-a-view.md)) |
| Sector | Open / Locked (Antarctica) | Never unlocks |
| Focus | One of six open | Select / step; opens on Europe. Not the selected contract |
| Selected contract | none / selected / cleared-after-debrief | Contract select (Interface input). Debrief → World Network clears it. `selectMission` no-op if campaign failed |
| Garrison | Secure / Strained / Critical | Derived from Control bands (§5) |
| Unrest pressure | Off / On | On while unrest above pressure threshold |
| Crisis | Out / In | Enter/clear per §5 hysteresis; Feed events; not campaign fail |
| Campaign | Live / Complete / Failed-empty-roster | Complete = three authored wins. Failed = empty living roster while incomplete. Cannot both ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)) |
| Sector color | Holder / Contested / Unknown | Majority of city holders; tie → Contested. Unknown = Antarctica |
| City | Holder ∈ HOLDERS | Seizure event; debrief win → Nexus; debrief loss of Nexus city → default holder |
| Influence action | Disabled / Ready / Active (staged) / Cooldown | Disabled if unaffordable, Antarctica, or Expedite has no generated target. Stabilize/Lobby stage on clock after debit. Expedite is **instant** — it never occupies Active (staged). Cooldown after spend |
| Intel | Level N; progress toward 100, then level++. Foresight off (&lt;2) / on (2+) | Debrief awards. Opening 1 with 25/100 |
| Contract on Scan | Economy record, WN view | Economy + WN hooks (riot/raid/seizure/crisis/Expedite). Locked generated absent. Chance always printed |
| Mission coupling | Strategy / Deployed / Debrief apply-once / Abort discarded | Deploy copies the **WN slice**; field does not tick WN; debrief applies once; abort writes nothing |

**Influence enablement (alias §5 costs; do not retune):** Stabilize needs Influence ≥ 8 and not on cooldown; Lobby ≥ 10; Expedite ≥ 12 **and** a generated target. Opening 0 disables all three. Dirty +6 still disables all three. Clean +8 enables Stabilize only.

### Interactions with Other Systems

**Directions are relative to World Network:** In = received by World Network; Out = sent by World Network.

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **Economy** | Contract records, Reward, quiet/pay flags, stamped ETA days | Tax emit; garrison→Threat input; Expedite/priority/re-client/withdraw/post hooks | Economy owns instances/payouts/Credits; WN owns clock/board/hooks/Influence/Intel |
| **Research** | — | Strategic `t` after tick or ETA jump | Research `sync(t)` |
| **Roster / Assembly** | Outcome DTO: **kia names** only (emitted, not queried live); campaign flags for banners | Strategic `t` | Roster owns bodies, `deadIds`, `survivorHp`, and campaign flags; squad is not WN state; WN posts KIA Feed and banners |
| **Tactical** | Outcome DTO at debrief; `missionChance` for strategy presentation | **WN slice** at deploy | Tactical computes Chance; WN presents it. Neither side live-queries the other during the mission |
| **Interface** | Input: Focus, Pause, speed, spends, contract select | Focus, clock, Feed, four readouts, action enablement, **Chance**, campaign banners, first-visit overlay job, Review chrome, Scan list | Presentation only. Does not own flags, wallet, or clock |
| **Persistence** | Hydrated WN blob | WN blob for strategy autosave; mission/debrief not saved; Review pin not in the blob | [ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md), [ADR-0014](../../docs/architecture/adr-0014-timeline-review-is-a-view.md) |

**WN slice (deploy, frozen):** sector id; Control; Unrest. Tactical derives extras. Do not pass live store handles. Do not call this slice “the Snapshot DTO.” ([ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md))

**Outcome DTO (debrief, apply once):** won; quietReplay; civiliansHit; mission/city/sector identity; **kia names** from Roster. World Network uses these for Control/Unrest shove, ownership flip, Influence award, Intel award, Feed, generated removal. Economy uses won/quiet/civiliansHit/Reward for Credits. World Network does not compute collateral and does not read `deadIds` / `survivorHp`.

Quiet replay: 0 Influence, 0 Intel, no **direct** Control/Unrest/ownership shove at `t0`; ordinary ETA catch-up may still change the board and emit Tax ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)).

§5–6 text that is **not** World Network: unrest extras (Tactical); Risk index math (Tactical/Brief); generated Threat from garrison (Economy consumes the label); Credits landing on the account (Economy); labs/injuries/recruitment formulas (Research/Roster); contract Reward/expiry (Economy §9).

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §5–6. `round` is living spec §22: nearest-integer with half ties toward +∞, matching JavaScript `Math.round`. Do not use banker's half-even.

The `tax_yield` formula (World Network computes; Economy deposits) is defined as:

`tax_yield = round(base × Control/100 × strain)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| base | base | int | sector table in §5 | Sector tax base (CR / 24h at 100 Control, no strain) |
| Control | Control | float | unnamed in §5 (Open Question) | Sector control percent |
| strain | strain | float | formula floor 0.25; see note | 1 at unrest ≤ 60; else 1 − 0.02 per unrest point above 60, floored at 0.25 |
| tax_yield | tax_yield | int | unnamed while Control range is unnamed | Credits that tick would **print** |

**Output Range:** Printed for every open sector; **paid** only if Nexus-held. Contested and non-Nexus majority emit 0. Do not claim `tax_yield ≥ 0` until §5 names a Control floor. Economy deposits only emits **A > 0**; non-positive emits leave Credits unchanged.
**Strain note:** Unrest is clamped 2–96 in §5. At unrest 96, strain = 0.28. The 0.25 floor does not bind inside that clamp (Open Question — do not retune here).
**Example:** §5 opening table — North America 4,080 CR / 24h = `round(6000 × 68/100 × 1)`.

**Influence income** (apply from outcome DTO; alias §6): `+6` if `won && !quietReplay`; `+2` more if also `civiliansHit = 0`; else `0`. Opening wallet 0.

**Intel awards** (alias §5): `+40` if `won && !quietReplay`; `+15` more if also `civiliansHit = 0`; else `0`. Progress toward 100, then level++.

The `risk_index` formula is **not** owned here. Alias §5; Tactical/Brief compute; World Network only gates **Brief** display at intel 2+. World Network still prints **Chance** on Scan at every intel level.

Garrison bands, unrest clamp, crisis hysteresis, Influence **costs** / staging: alias §5. Do not copy code-only Control/Unrest mission deltas into this file. Qualitative shove: a non-quiet win raises Control and lowers Unrest; a loss does the opposite; civilian hits add Unrest; dirty-win **net** Unrest is unnamed until §5 names integers.

## Edge Cases

- **If the director is in the field**: strategic time does not tick. No catch-up until a **win** debrief. A loss spends no ETA.
- **If Abort**: no debrief; World Network writes nothing to `t`, sectors, owners, Influence, intelLevel, intelProgress, events, spends, nextTaxT ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)).
- **If quiet replay win**: 0 Influence, 0 Intel, no **direct** Control/Unrest/ownership shove at `t0`; ordinary ETA catch-up still runs, including scheduled World Events, spends, pressure, ownership changes, and Tax ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)). The returned Scan is the resulting live board, not a promise of unchanged pre-mission values.
- **If Timeline is in Review**: `setReview` does not write `t` and does not run `advanceFlow`. Scan Control / Unrest / owners / Influence / Tax / contracts / crisis stay **live**. Feed, TimeCode, and the Timeline handle follow the pin. Do not reconstruct historical Control ([ADR-0014](../../docs/architecture/adr-0014-timeline-review-is-a-view.md)).
- **If two dues share a timestamp**: use [ADR-0018](../../docs/architecture/adr-0018-catch-up-collision-order.md); do not invent a new table in this extract. Tax at equal `t` reads Control **after** pressure.
- **If Influence cannot be afforded or is on cooldown**: action disabled; spend is a no-op. Opening 0 disables all three. Dirty +6 still cannot Stabilize (8) / Lobby (10) / Expedite (12).
- **If Expedite has no generated target**: blocked. Expedite is instant — it never occupies Active (staged).
- **If Antarctica**: locked at every intel level; no Control / Unrest / Tax / Garrison print; no Focus cycle; no Stabilize / Lobby / Expedite; Scan land is Unknown.
- **If sector is Contested or non-Nexus majority**: Tax figure may print; it does not pay. Opening Europe (Helix) is this case.
- **If unrest is in crisis**: crisis entry/exit alone does not change campaign flags; crisis is recoverable per §5. An empty incomplete roster can still fail independently of crisis. Banner copy must not treat crisis hatch as CAMPAIGN FAILED.
- **If campaign failed**: CAMPAIGN FAILED banner; `selectMission` no-op; Focus / clock / Research remain World Network concerns (hire-on-failed is Roster OQ1 — do not resolve here). On a pyrrhic win (§10 tiebreak Win that emptied the roster), the failed banner is posted first and dominates the win invoice; Economy still pays.
- **If campaign complete**: CAMPAIGN COMPLETE banner; authored three stay selectable; quiet replay still applies.
- **If World Network would read the running mission or live roster**: forbidden. Use the WN slice / outcome DTO only. Outcome DTO for this owner is kia names, not `deadIds` / `survivorHp`.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, downstream | Economy and contracts | Tax emit to Economy; contract instances to World Network | Credits ledger is Economy; WN does not hold it. Influence/Intel are WN. GDD: `economy-and-contracts.md` (Approved) |
| Hard, downstream | Research | Strategic `t` | Labs catch up; WN does not own project formulas. GDD: `research.md` |
| Hard, downstream | Roster and Assembly | Strategic `t`; kia names on outcome DTO; campaign flags | No live roster query. GDD: `roster-and-assembly.md` |
| Hard, downstream | Tactical mission | WN slice to Tactical; extras derived there; outcome to World Network | Slice: sector id, Control, Unrest — not “the Snapshot DTO”. GDD: `tactical-mission.md` |
| Hard, downstream | Interface | Presentation | Focus, clock, Feed, spends, **Chance**, banners, overlay, Review chrome. GDD: `interface.md` |
| Hard, downstream | Persistence and validation | Strategy autosave | Mission/debrief excluded; Review pin not in the blob. GDD: `persistence-and-validation.md` |
| Hard, upstream | — | Foundation | None |

World Network lists Economy as downstream (Tax emit; contract instances). Economy lists World Network as upstream. Bidirectional on that cut. Research, Roster, Tactical, Persistence, and Interface GDDs exist and list World Network.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §5–6 (and `src/game/forecast.ts` / `worldStore` for implementation). This GDD does not add ranges. Changing a knob requires checking the living spec dependencies, not this pointer.

| Knob | Owner | Too high / too low |
|---|---|---|
| Clock speeds 1/2/4/8× | §5 | If pause/speed do not change what the director *does*, the clock fantasy is copy |
| Influence costs/effects/cooldowns | §5 | Unaffordable forever vs free spam |
| Influence income +6 / +2 | §6 | Dirty first win cannot spend; clean = exactly one Stabilize |
| Tax bases / strain | §5 | Trickle vs replacing the generated market |
| Unrest pressure / crisis thresholds | §5 | Crisis unreachable vs always-on |
| Event interval 15–45 min | §5 | Dead board vs unreadable Feed |
| Intel awards and gates | §5 | Authored spine unreachable vs no gate |

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. World Network requires the Scan to read as a flat projection (not a globe), sector color = majority holder, crisis as red hatch/stroke **plus** a non-color CRISIS mark (pillar 2: not color-only), Feed as a record. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. No second visual language for “the map.” Campaign banners live on this screen; crisis hatch is not those banners.

## UI Requirements

Screens and HUD belong to Interface. This GDD requires:

- Focus, Scan (flat projection), sector readout (four numbers), clock/Pause/speed on the four Screens, Timeline with a Live vs Review cue, Influence actions with disable reason (unaffordable / cooldown / no target / Antarctica), Feed, contract list.
- **Chance** always printed on World Network contract chrome. Brief Risk bands are not this surface.
- Tax **paid vs printed**: opening Europe may show a figure that does not pay; North America is the opening paying tap.
- Campaign-complete and campaign-failed banners (ADR-0020). Complete does not lock contracts; failed makes select a no-op.
- First-visit overlay teaches the desk job (Core Rule 13), not “click the marker.”
- Locked generated offers absent from Scan / OPEN CONTRACTS. Authored intel-locked may still appear locked.
- Control / Unrest / Tax / Garrison and Influence spends are visible and actionable when legal (pillar 2 veto: undecorated numbers). Disabled Influence at opening 0 must read as later, not as broken.

## Acceptance Criteria

### Clocks

- **GIVEN** phase ∈ {World Network, Research, Brief, Assembly}, speed **1×**, unpaused, and foreground frame delivery with no clamped gaps, **WHEN** the clock delivers a total of **1** accepted real second to `tick`, with no pending batching remainder at either observation, **THEN** strategic `t` increases by **60** seconds.
- **GIVEN** an unpaused Screen at **1×** with an empty caller accumulator, **WHEN** one rAF callback arrives after a **1**-second wall-clock gap, **THEN** the caller admits **0.25** seconds and the delivered tick advances `t` by **15** strategic seconds. This preserves the caller-side stall clamp in [ADR-0018](../../docs/architecture/adr-0018-catch-up-collision-order.md); it is not a clamp on raw `worldStore.tick` or an offline catch-up path.
- **GIVEN** phase ∈ {Menu, Mission, Debrief}, **WHEN** wall-clock advances, **THEN** strategic `t` is unchanged.
- **GIVEN** paused on a Screen, **WHEN** wall-clock advances, **THEN** strategic `t` is unchanged.

### Catch-up

- **GIVEN** a win debrief, **WHEN** contract ETA days are spent, **THEN** catch-up runs the same `advanceFlow` as Screen ticking: one due at its timestamp, rearm from that due `t`, equal timestamps in [ADR-0018](../../docs/architecture/adr-0018-catch-up-collision-order.md) order. Do not author a new order table here.
- **GIVEN** a loss debrief at `t0`, **WHEN** debrief finishes, **THEN** strategic `t` stays `t0` and that debrief emits no Tax from ETA.
- **GIVEN** a win at frozen `t0` with sector state S, **WHEN** debrief applies, **THEN** Control / Unrest / ownership / Influence / Intel write-back uses S at `t0`, and only after that write-back does ETA catch-up advance `t`.

### Abort and quiet replay

- **GIVEN** a mission in progress and World Network blob B (`t`, sectors, owners, Influence, intelLevel, intelProgress, events, spends, nextTaxT), **WHEN** Abort is confirmed, **THEN** there is no debrief and those fields still equal B.
- **GIVEN** a frozen quiet-replay win outcome, Influence **I**, intelLevel **L**, intelProgress **J**, sector Control **C**, Unrest **U**, and city holder **H** at `t0`, **WHEN** direct outcome write-back completes at an instrumented boundary **before ETA advancement**, **THEN** Influence = **I**, intelLevel = **L**, intelProgress = **J**, Control = **C**, Unrest = **U**, holder = **H**, and `t` is still `t0`.
- **GIVEN** that post-write-back state at `t0` and a comparison copy with identical RNG cursors and scheduled dues, **WHEN** the quiet win spends its stamped ETA and the comparison copy advances continuously through the same strategic interval, **THEN** both reach `t0` plus the stamped ETA days with identical timed-flow state and Tax deposits. Final Control, Unrest, ownership, and Feed may differ from their pre-ETA values.

### Review

- **GIVEN** Review time and live Control **C**, Unrest **U**, owners **O**, `t` **T**, **WHEN** the Timeline is scrubbed, **THEN** live **C**, **U**, **O**, and **T** are unchanged. Feed / TimeCode follow the pin. Scan four numbers stay live ([ADR-0014](../../docs/architecture/adr-0014-timeline-review-is-a-view.md)).

### Tax

- **GIVEN** a Nexus-held sector with printed `tax_yield` **A** CR (`A = round(base × Control/100 × strain)` per §5), **WHEN** a Tax due fires, **THEN** Economy is emitted **A** CR.
- **GIVEN** Contested, **WHEN** a Tax due fires, **THEN** emit **0**.
- **GIVEN** a non-Nexus majority holder, **WHEN** a Tax due fires, **THEN** emit **0**.
- **GIVEN** opening North America (Nexus, 68% Control, 12% Unrest), **WHEN** a Tax due fires, **THEN** emit **4,080** CR.
- **GIVEN** Focus on opening Europe, **WHEN** Tax yield is read, **THEN** a figure prints and that sector does not pay.

### Influence wallet and spends

- **GIVEN** a new campaign, **WHEN** Influence is read, **THEN** it is **0**.
- **GIVEN** Influence **0**, a non-quiet win, `civiliansHit ≥ 1`, **WHEN** World Network applies the outcome DTO, **THEN** Influence = **6**.
- **GIVEN** Influence **0**, a non-quiet win, `civiliansHit = 0`, **WHEN** World Network applies the outcome DTO, **THEN** Influence = **8**.
- **GIVEN** Influence **I**, a loss, **WHEN** World Network applies the outcome DTO, **THEN** Influence = **I**.
- **GIVEN** Influence **7**, **WHEN** Stabilize (cost **8**) is activated, **THEN** the spend is refused and Influence stays **7**.
- **GIVEN** Influence ≥ **8** and Stabilize on cooldown, **WHEN** Stabilize is activated, **THEN** the spend is refused and Influence is unchanged.
- **GIVEN** an open sector with Unrest **18**, Influence **8**, Stabilize off cooldown, and no other Unrest-changing effects during the interval, **WHEN** Stabilize is activated and **6** strategic hours elapse, **THEN** Influence immediately becomes **0**, Unrest falls by **2** at each hourly step to **6**, and the staged spend retires (§5).
- **GIVEN** an open sector with Unrest **12**, Influence **8**, Stabilize off cooldown, and no other Unrest-changing effects during the interval, **WHEN** Stabilize is activated and all six hourly steps complete, **THEN** Influence immediately becomes **0** and Unrest ends at **2**, not **0**, because each step respects the §5 clamp.
- **GIVEN** an open sector with Unrest **2**, Influence **8**, Stabilize off cooldown, and no other Unrest-changing effects during the interval, **WHEN** Stabilize is activated and all six hourly steps complete, **THEN** Influence immediately becomes **0**, Unrest stays **2**, and the staged spend retires. Interleaved World Events remain governed by the ordinary catch-up rules, not a guaranteed net reduction.
- **GIVEN** no generated target, **WHEN** Expedite is activated, **THEN** blocked and Influence is unchanged.

### Intel

- **GIVEN** intelProgress **25**, a non-quiet win, `civiliansHit ≥ 1`, **WHEN** World Network applies, **THEN** intelProgress = **65**.
- **GIVEN** intelProgress **25**, a non-quiet clean win, **WHEN** World Network applies, **THEN** intelProgress = **80**.
- **GIVEN** intelProgress **J**, a loss or quiet-replay win, **WHEN** World Network applies, **THEN** intelProgress = **J**.
- **GIVEN** intel **1**, **WHEN** the focused sector panel is read, **THEN** Event forecast is not shown.
- **GIVEN** intel **2+**, **WHEN** the focused sector panel is read, **THEN** Event forecast lists riot, blackout, raid, trade, and seizure chances for the next **6** strategic hours using the same weights the generator rolls (formulas stay in §5 / `forecast.ts` — do not copy).

### Board presentation

- **GIVEN** intel **1**, **WHEN** Scan, Focus cycle, and sector readout are read, **THEN** Antarctica prints no Control, Unrest, Tax yield, or Garrison condition; Focus never selects it; Stabilize / Lobby / Expedite are not offered for it; Scan land is Unknown.
- **GIVEN** intel **≥ 2**, **WHEN** those surfaces are read, **THEN** the same Antarctica holds.
- **GIVEN** intel &lt; 2 vs intel ≥ 2 on the same contract, **WHEN** World Network chrome is read, **THEN** Chance still prints. Risk index bands are Brief-only.
- **GIVEN** an unexpired generated instance whose required Intel is **greater than the director’s Intel level**, and whose gate is not Expedite-waived, **WHEN** Scan / OPEN CONTRACTS is read, **THEN** that instance is absent while Economy still holds its record.

### Deploy / debrief cut

- **GIVEN** deploy confirmed, **WHEN** the Tactical mission is created, **THEN** it receives the frozen WN slice `{sector id, Control, Unrest}` and no live World Network store handle. Do not call this slice “the Snapshot DTO.”
- **GIVEN** a fully applied Debrief serial **N**, captured post-apply strategic state **S**, and no intervening Screen tick or input, **WHEN** Debrief’s apply path is re-entered with the same serial **N**, **THEN** the existing `outcomeApplied` / `outcomeSerial` guard refuses a second apply: state still equals **S**, with no repeated mission write-back, ETA advancement, Tax/Credits deposit, Feed or market change, RNG/dues consumption, or Research/Roster synchronization. This is transaction-level apply-once, not idempotence of raw outcome mutators or a durable save on Debrief ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)).

### Shove direction (magnitudes unnamed in §5 — do not copy code)

- **GIVEN** a non-quiet win and sector Control **C** (not at an unnamed cap), **WHEN** World Network applies, **THEN** Control &gt; **C**.
- **GIVEN** a non-quiet loss and sector Control **C** (not at an unnamed floor), **WHEN** World Network applies, **THEN** Control &lt; **C**.
- **GIVEN** two otherwise identical non-quiet wins, `civiliansHit = 0` vs `N &gt; 0` (not at unrest clamp), **WHEN** World Network applies, **THEN** Unrest after **N** is greater than after **0**. Dirty-win **net** Unrest versus pre-mission U is unnamed until §5 names integers.
- **GIVEN** a non-quiet win, **WHEN** the mission city is read, **THEN** holder is Nexus.
- **GIVEN** a non-quiet loss of a Nexus-held city, **WHEN** the city is read, **THEN** holder is that city’s default holder.

### Opening desk and post-win Scan

- **GIVEN** New Operation on World Network, **WHEN** the first minute is observed without selecting a contract, **THEN** Focus can change among the six open sectors, four numbers print, Pause/speed change whether `t` advances, and contract select is not the only enabled verb.
- **GIVEN** a non-quiet win at frozen `t0`, **WHEN** direct outcome write-back completes at an instrumented boundary before ETA advancement, **THEN** the mission-result Feed event is appended at `t0`, and awards and sector effects follow the outcome rules. This is not a player-visible World Network screen.
- **GIVEN** a first clean non-quiet win starting with Influence **0**, **WHEN** full Debrief write-back and ETA finish and World Network is displayed before another Screen tick, with no other Influence spend or award, **THEN** the header visibly reads Influence **8** and Scan presents the resulting **post-ETA live board**. This does not require visible Intel progress or retention of the mission Feed event after catch-up.

### Campaign end

- **GIVEN** Glass Veil, Hollow Crown, and Rust Haven all won, **WHEN** World Network is shown, **THEN** the campaign-complete banner is posted and all three remain selectable (not locked).
- **GIVEN** campaign not complete and living roster count **0** after debrief, **WHEN** World Network is shown, **THEN** the campaign-failed banner is posted and contract select is a no-op.
- **GIVEN** a pyrrhic win (same-step tiebreak Win that empties the roster on an incomplete campaign), **WHEN** the debrief is shown, **THEN** the CAMPAIGN FAILED banner takes precedence, the invoice still prints the full net payout with the `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` note, and the mission grades a Win (living spec §10).
- **GIVEN** campaign already complete, **WHEN** living roster count reaches **0**, **THEN** the complete banner remains, the fail banner is not posted, and contracts are not locked.
- **GIVEN** an incomplete, non-failed campaign with at least one living operative, **WHEN** only sector crisis enters or clears, **THEN** campaign flags remain unchanged and no campaign-failed banner appears. Injured operatives still count as living.
- **GIVEN** a campaign that is still incomplete after debrief removes its last living operative, **WHEN** campaign flags are read, **THEN** failed is true and complete is false, regardless of sector crisis. The completed-campaign exception above still applies.

## Open Questions

- Collision order is owned by [ADR-0018](../../docs/architecture/adr-0018-catch-up-collision-order.md). §5 still has no table. Do not fork a new table in this extract until the living spec does.
- Mission-result Control/Unrest integer deltas are qualitative in §5 and numeric in code. Dirty-win **net** Unrest is unnamed. Do not copy code numbers into this extract.
- Control range is unnamed in §5 (code uses a silent 4–96 — do not promote that here). Until §5 names a floor, `tax_yield ≥ 0` is unproven.
- Strain floor 0.25 does not bind at unrest 2–96 (legal min 0.28). Do not retune the floor in this extract.
- `campaignStore` holds intel progress in code. GDD owner is World Network; Zustand home is stamped — do not move ([ADR-0012](../../docs/architecture/adr-0012-store-placement.md)).
- Generated market physically sits in `worldStore` while Economy owns instances. Split is stamped — do not move ([ADR-0012](../../docs/architecture/adr-0012-store-placement.md)).
- Living-spec follow-ups (not this file): Control clamp, strain-floor vs unrest max, Influence costs vs first-win income, intel-2 onboarding, Tax-vs-market once extra taps light, Influence cooldowns vs ETA burst. Alias those facts; do not invent numbers.
