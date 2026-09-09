# Economy and contracts

> **Status**: Approved
> **Author**: extract from docs/game-design.md §6, §9, §11
> **Last Updated**: 2026-09-08
> **Implements Pillar**: Violence has corporate consequences; The two layers feed each other
> **Living spec**: `docs/game-design.md` §6, §9, §11 — this file aliases them; do not fork rules
> **Owners (2026-09-07)**: Credits = Economy; contract instances / Reward / expiry / collateral / net payout = Economy; Influence wallet+spends = World Network; Tax emit = World Network → Economy; Intel access resource = World Network
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-07

## Overview

Economy and contracts is the house ledger and the work itself: **Credits** pay research and candidates; **Influence** is not kept here (World Network owns that wallet). The director accepts deniable work — three authored contracts as the campaign spine, a generated market as ongoing demand — at no up-front cost, then collects a **net payout** at debrief: Reward plus optional bonuses minus **collateral**. Collateral prices unique civilian hits by the squad. A quiet replay of already-won authored work pays no fee ([ADR-0004](../architecture/adr-0004-quiet-replay.md)). Authored and generated take the same path ([ADR-0003](../architecture/adr-0003-one-contract-kind.md)). Tax yield is received from World Network, not computed here ([ADR-0008](../architecture/adr-0008-influence-is-a-wallet.md)). Debrief applies the invoice once ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)); a win spends ETA so Tax can still tick ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Without this system the research gap has no market, violence has no invoice, and the World Network is only a contract picker.

Rules and numbers stay in `docs/game-design.md` §6, §9, §11. This overview does not fork them.

## Player Fantasy

You authorize the work. You read the invoice. The fantasy is corporate cost made legible at debrief: Reward, optional bonus, Collateral, net payout, new balance — the money lines living spec §10 reports. A unique civilian hit by the squad is a line item — first hit, not stacked, not CorpSec’s, never above Reward, never debt on a Loss. Accepting is free. A quiet replay prints `REPLAY // FEE ALREADY COLLECTED`. The authored three are the campaign spine. The generated market is ongoing demand that funds the research gap (pillar 4): same path as authored work, no buy-in, not a storefront and not a second campaign. Tax is a trickle. Credits do not convert to Influence. Economy prices; Interface presents; World Network applies sector/unrest; Persistence applies once. The fantasy fails if accept costs Credits, if the debrief is a loot drop instead of those invoice lines, or if authored and generated take different pipelines.

This serves **Violence has corporate consequences** and **The two layers feed each other**. It does not own Scan, Focus, or Influence spends (World Network) or the five verbs (Tactical).

## Detailed Design

### Core Rules

1. **Alias.** Tables, authored spine, generated Reward/expiry, collateral unit, and the 203,000 CR / 779,000 CR gap live in `docs/game-design.md` §6, §9, §11. This section names owners, states, and DTO edges. Do not copy those tables here. Do not copy §11 beat-by-beat tactics; spine identity, fees, optionals, intel/ETA, and one-line problem stay here.

2. **Two currencies, no convert.** Credits buy research and candidates. Influence buys Stabilize / Lobby / Expedite. Opening Credits **128,450**. Opening Influence **0** is World Network. Economy does not keep a second Influence ledger. Intel is World Network’s access resource.

3. **Credits ledger.** Economy owns the account. Deposits: net contract payout at debrief; Tax yield **emitted** by World Network (Credits + sector + tick time) and **deposited** here. World Network emits only for Nexus-held sectors; Contested does not emit. Economy deposits the emitted amount and does not recompute eligibility. Spends: research authorization and hiring. Balance may hit 0; it never goes negative.

4. **Overdraft refuse.** Research and hiring cannot overdraw. Authorization refuses; the account is unchanged. Exact-balance spend is allowed (account → 0). Zero and negative spends are ignored. Tax and payouts ignore non-positive amounts.

5. **One contract kind** ([ADR-0003](../architecture/adr-0003-one-contract-kind.md)). Authored and generated are the same work: brief → assembly → mission → debrief. Economy owns instances, Reward, expiry math, collateral, net payout. Generated records physically sit in `worldStore.contracts`; that is placement, not a second owner. Authored three stay replayable; generated leave the market on fulfill, fail, expiry, or raid withdraw.

6. **Accept is free.** Selecting a contract spends no Credits. Intel gates **access** (World Network); Economy does not charge a retainer.

7. **Net payout (Economy prices).** Loss and quiet replay pay **0** Credits (no debt), including optional bonuses. Else `Reward + optional_bonus − collateral`. Collateral: **5,000 CR** per unique civilian first **squad-caused hit** (not death, not stack, not CorpSec). Cap at Reward. Optional bonus sits on top of Reward (outside the cap). Quiet replay zeros the **whole** net ([ADR-0004](../architecture/adr-0004-quiet-replay.md)).

8. **Quiet vs loss-retry.** Authored unwon (including a loss retry) still pays in full. Authored already won is quiet: 0 CR / 0 Inf / 0 Intel, no control/unrest shove; KIA / injury / XP / ETA still apply. Generated has no quiet replay.

9. **ETA is not a Credits spend.** A **win** debrief spends contract ETA as strategic days, including quiet replay. A **loss** spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Economy does not run the clock. Tax still ticks on a quiet-replay win because ETA catch-up still runs.

10. **Debrief cut.** One partitioned **deploy snapshot** (two named slices; no live store handles); outcome DTO at debrief; apply once ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). Interface presents the invoice; Economy prices Credits; World Network applies sector/unrest/ownership/Influence/Intel from the same outcome DTO; Persistence applies once. **Abort = no debrief = Economy writes nothing.** Do not live-query the running mission or roster to price.

11. **Generated market (Economy instance, WN clock/hooks).** Up to 3 open. New roll every 2–6 strategic hours when below target. Sector pick weighted toward high unrest / low control lives in §9 — do not fork the weights here. Threat from garrison (Secure→Moderate / Strained→High / Critical→Severe). Reward **clamp** 30,000–95,000 CR on a 500 CR grid, stamped at creation — do not recalculate when tags change. The 30,000 floor never binds (Moderate, u=0, P=1 → 30,500). Reachable stamps are discrete 500-grid values, not every amount from 30,500 to 95,000. Expire 24–48h (priority 8–16). Types: seizure / extraction / sabotage / riot-linked suppression. **Sable Enterprises** is not in the generated client pool (§19.2). World Network: Expedite, re-client, raid withdraw, riot post, Scan. Economy: Reward, expiry timestamps, payout, leave-market.

12. **Influence income is not this ledger.** +6 win / +2 clean arrives **on the outcome DTO**; World Network applies it. Economy must not award Influence.

13. **Authored spine (identity only).** Glass Veil / Hollow Crown / Rust Haven: campaign-complete mark when all three have been won. They stay replayable. One-line problems: checkpoint read-and-commit; compound escort; yard invert. Sequences, geometry, weather, Opening hour belong to Tactical. Do not invent a generated optional-bonus table; bonus is whatever Tactical reports complete.

14. **Forbidden.** Currency convert; second Influence wallet; Intel as an Economy resource; tax from non-Nexus; Economy computing Tax yield; accept fee; full-fee quiet replay; collateral debt; overdraw; a second “story” pipeline; mid-mission Credits writes; pricing from live sim; shop / owned gear / account level / consumable store.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Credits account | Opening 128,450; In-credit (≥0); Zero. Never overdrawn | Win debrief → +net payout; WN Tax emit → deposit; research/hire authorize → debit; overdraft / zero-neg spend → no-op; abort → no write |
| Authored contract | Unwon; Won; Quiet (replay of Won) | Always replayable. Unwon win → Won + full invoice. Won deploy → Quiet. Loss of Unwon stays Unwon (full pay on later first win). Quiet win: 0 fee; ETA still. Intel lock is WN access, not an Economy instance state |
| Generated contract | Rolled; Locked-hidden (intel gate); Offered; Expired; Fulfilled; Failed | Roll when below target (or riot suppression post). Locked-hidden ↔ Offered via intel / Expedite (WN). Expire → leave market, no invoice. Win → Fulfilled, leave market. Loss → Failed, leave market, 0 pay. Raid withdraw leaves market with no invoice. Abort leaves the record where it was |
| Invoice | None; Building at debrief; Applied once | Abort: never built. Debrief: Interface lists rows; Economy prices money lines; apply-once. Quiet banner: `REPLAY // FEE ALREADY COLLECTED` |
| Overdraft refuse | Affordable / Refused | Research or hire with cost > Credits → Refused, no debit. Exact balance spend allowed (→ Zero) |

**Locked-hidden:** Economy still holds the instance. Scan visibility is World Network / Interface (see Open Questions). Economy does not hide records.

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | Tax emit (Credits+sector+tick); garrison→Threat; Expedite/re-client/withdraw/post/expiry-fire on Economy records; Scan list | Contract instances, Reward, quiet/pay flags, expiry | Economy owns instances/payouts/Credits; WN owns clock/board/hooks/Influence/Intel |
| **Research** | Authorize request + cost | Refuse or debit; lab start is Research | Economy owns the Credits check; Research owns project formulas / `sync(t)` |
| **Roster / Assembly** | Hire request + candidate cost | Refuse or debit | Roster owns bodies and hire table; Economy only the Credits refuse |
| **Tactical** | Economy slice of the deploy snapshot (frozen Reward, bonus defs, quietReplay, contract id) | Outcome DTO at debrief (`civiliansHit` unique squad-caused, won, bonus, Reward) | Neither live-queries the other. Tactical counts hits; Economy prices |
| **Interface** | Invoice rows, HUD collateral chip, Credits header, overdraft-disabled authorize | Select contract (free); Abort (no debrief) | Presentation only |
| **Persistence** | — | Credits; generated records; `contractsWon` | Strategy autosave. Mission + debrief not saved ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). Apply once |

Downstream Research / Roster / Tactical / Persistence / Interface GDDs are not extracted yet. Edges above vs living spec + World Network GDD; provisional until those files exist.

**Deploy snapshot (partitioned, frozen):** one snapshot, two named slices. Do not pass live store handles. Do not call either slice “the Snapshot DTO” as if it carried the other system’s fields.

- **Economy slice:** contract id; authored vs generated; Reward; optional bonus defs; ETA days (World Network spends later); `quietReplay` from authored `contractsWon`.
- **World Network slice:** sector id; Control; Unrest — defined in the World Network GDD. Not an Economy schema.

**Outcome DTO (debrief, apply once):** `won`; `quietReplay`; `civiliansHit` (unique squad-caused first hits); `reward`; `bonus` (completed optionals). Abort is **absence of an outcome**, not a field. World Network also reads this DTO for Control/Unrest/ownership/Influence/Intel/Feed/generated removal. World Network does **not** compute collateral.

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §6, §9, §11.

Economy owns three live formulas: `collateral`, `net_payout`, `generated_reward`. Opening Credits, authored Rewards/optionals, expiry windows, and market cadence are constants or ranges, not formulas. `tax_yield` is World Network; Economy only deposits the emitted amount. Authored chance and Risk index are not Economy. Influence +6 / +2 is World Network.

The `collateral` formula is defined as:

`collateral = min(Reward, 5000 × N)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Reward | Reward | int | authored table, or generated clamp 30,000–95,000 on a 500 CR grid (discrete stamps; min 30,500) | Contract fee, before Collateral and before optional bonus |
| unique squad first-hits | N | int | ≥ 0 | Unique civilians the squad first-hit this deployment (hit, not death) |
| unit fine | 5000 | int | 5000 | Credits per unique squad first-hit (§6) |
| collateral | collateral | int | 0–Reward | Deduction from a successful contract |

**Output Range:** Clamped to Reward so the fee cannot go negative. Not necessarily a multiple of 5,000 once capped. Loss does not apply this as a ledger debit (see `net_payout`).
**Example:** Glass Veil Reward 85,000 CR, N=2 → collateral = 10,000 CR. N=17 → 85,000 CR. N=18 → still 85,000 CR.

The `net_payout` formula is defined as:

`net_payout = 0` if quiet replay or not a Win;

`net_payout = Reward + optional_bonus − collateral` if Win and not quiet replay.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Win | won | bool | true/false | Every required objective complete |
| quiet replay | quiet | bool | true/false | This authored contract is already won |
| Reward | Reward | int | same as collateral | Contract fee |
| optional bonus | optional_bonus | int | ≥ 0 | Sum of completed optional bonuses; 0 if ignored/failed; no generated bonus table |
| collateral | collateral | int | 0–Reward | From `collateral` |
| net payout | net_payout | int | ≥ 0 | Credits deposited on debrief |

**Output Range:** Always ≥ 0. Collateral caps at Reward, so optionals can still pay after the fee is zeroed. Quiet replay pays 0 including optionals. Abort never evaluates this (no debrief).
**Example:** One contract, one evaluation. Glass Veil win, N=2, no optional: Reward 85,000 − collateral 10,000 = **75,000 CR**. Hollow Crown win, N=13, optional complete: collateral = 62,000, net_payout = **9,000 CR**. Rust Haven win, opening Standard, optional ignored, N=8: collateral = 40,000, net_payout = **1,000 CR**. (N=9 zeros the fee only with unrest > 20 or Hardened extra civilians — not opening Standard. Cap-at-Reward remains AC-13.) The three-authored-contract clean pass **203,000 CR** (85k+62k+9k+41k+6k) is §6 gap arithmetic, not a `net_payout` output.

The `generated_reward` formula is defined as:

`generated_reward = clamp(500 × round(B × (0.9 + 0.3u) × P / 500), 30000, 95000)`

Evaluated **once at offer creation**. Stamps Reward. Do not recalculate when Priority, Expedite, or other tags change later. Source: `rollReward` in `src/game/contracts.ts`. Authored Rewards are not this formula.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| threat base | B | int | {34000, 52000, 70000} | Moderate / High / Severe |
| jitter | u | float | [0, 1) | Seeded draw at creation |
| initial priority premium | P | float | {1, 1.4} | 1.4 if the offer is **initially** priority, else 1 |
| generated reward | generated_reward | int | discrete 500 CR grid; min 30500, max 95000; not every grid point in between | Stored Reward |

**Output Range:** Clamp expression is 30,000–95,000 CR, snapped to a 500 CR grid. The 30,000 floor never binds (Moderate u=0 P=1 → 30,500). The reachable set is discrete 500-grid stamps, not the continuous interval 30,500–95,000 CR: 41,500 / 42,000 / 42,500 do not occur. Severe + initial P=1.4 saturates at 95,000 for most u. Same Threat uses the same calculation in every sector; offers are not identical.
**Example:** High, u=0.5, P=1 → **54,500 CR**. Same with initial priority P=1.4 → **76,500 CR**.

## Edge Cases

- **If Abort:** no debrief. No invoice is built. Credits unchanged. Contract records stay in the state they had at deploy (generated stays Offered if it was Offered). No `net_payout`. No ETA, so this mission does not cause Tax catch-up.
- **If Loss:** `net_payout = 0` (optionals unpaid). Collateral cannot create debt. Authored remains payable on a later first win. Generated leaves the market. Loss spends no ETA.
- **If quiet replay (already won):** contract fee 0; optionals also unpaid. Debrief still runs (`REPLAY // FEE ALREADY COLLECTED`). KIA / injury / XP apply. A **win** still spends ETA, so Tax may still deposit via catch-up. Influence/Intel/Control/Unrest are WN, not this ledger.
- **If collateral would exceed Reward:** `collateral = Reward`. Win net = optional_bonus only (or 0 if no optional). Never negative Credits.
- **If the same civilian is multi-hit:** first squad hit bills once. Repeats do not stack. Death is not required.
- **If CorpSec-caused hits:** not Collateral. Do not increment N.
- **If overdraft (research or hire):** authorization refuses. Credits unchanged.
- **If generated expiry:** unaccepted offer leaves the market unpaid. Strategic clock does not tick in the field, so expiry does not fire mid-mission.
- **If Expedite (WN verb on Economy records):** waive intel gate; add 24 strategic hours of expiry. Do **not** reroll Reward. Do **not** apply P=1.4 after the fact. No generated target → spend blocked (WN). Economy stores the mutated record.
- **If tax emit deposit:** Economy deposits the emitted amount only. Do not recompute `tax_yield` or ownership. Amount 0 → no deposit. Quiet-replay win can still receive deposits because ETA catch-up may fire WN ticks.
- **If optional fail or ignore:** bonus for that objective is 0. Win is ungated. No extra Credit penalty.
- **If campaign complete vs quiet replay:** winning all three authored marks complete; they stay replayable. The **first** win of each pays `net_payout`. Every later win of those three is quiet. Generated work still pays. A completed campaign is not failed by a later roster wipe.
- **If locked generated:** Economy still holds the instance. Scan presentation is World Network / Interface.
- **If two money events share a debrief:** price Credits from the outcome DTO once; WN applies Influence/Intel/sectors from the same DTO; Persistence commits once. Economy does not award Influence.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Tax emit in; clock/hooks on contract records; Scan | Credits ledger is Economy; WN does not hold it. Influence/Intel are WN |
| Hard, downstream | Research | Credits authorize | Labs catch up on WN `t`; Economy does not own project formulas |
| Hard, downstream | Roster and Assembly | Credits authorize hire | No live roster query |
| Hard, downstream | Tactical mission | Economy slice of deploy snapshot; outcome at debrief | No live mission query |
| Soft, downstream | Interface | Presentation | Invoice, Credits header, overdraft disable |
| Hard, downstream | Persistence and validation | Strategy autosave | Mission/debrief excluded |

This GDD lists World Network as upstream (Tax, clock, board). World Network lists Economy as downstream (Tax emit in; contract instances out). Bidirectional: Economy owns instances/payouts; WN owns clock/board/hooks.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §6, §9, §11 (and `src/game/contracts.ts` / `appStore` for implementation). This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer. Do not duplicate World Network tax-base knobs here.

| Knob | Owner | Too high / too low |
|---|---|---|
| Opening Credits 128,450 | §6 | Opening already funds the program vs opening is already broke |
| Collateral unit 5,000 CR | §6 | Harmless stray fire vs one hit zeros every invoice |
| Authored Rewards / optionals | §9, §11 | Authored pass funds research (kills generated market) vs spine feels unpaid |
| Research total 779,000 CR (gap statement) | §6 / Research | Gap is authored replay vs gap is unreachable |
| Generated Reward clamp 30–95k / 500 grid / B / P (30k floor never binds) | §9 | Market replaces authored spine vs market cannot fund the gap |
| Generated cap 3 / roll 2–6h / expiry 24–48h | §9 | Dead market vs unreadable Scan |
| Tax bases / strain | §5 / World Network | Trickle vs replacing the generated market — **not an Economy knob** |

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Economy requires the debrief to read as an **invoice**: Reward, optional bonus, Collateral, net payout, new balance — the money lines living spec §10 reports; quiet banner `REPLAY // FEE ALREADY COLLECTED`. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. Audio prices violence; it does not celebrate payouts. No second visual language for a storefront.

## UI Requirements

Credits header on strategy screens. Overdraft: research/hire authorization disabled when cost > Credits. Economy prices these debrief money lines from the outcome DTO: Reward, optional bonus, Collateral (count and CR), net payout, new balance — the invoice fields in living spec §10. Interface presents them. This GDD does not authorize hiding those priced lines and does not invent an always-print-zeros rule; hide/show of zero-value rows is Interface, unspecified here. Quiet banner `REPLAY // FEE ALREADY COLLECTED` is Interface copy. Brief “collateral tolerance” chrome is Interface / living spec §9 — not an Economy free band or percent budget. Accepting a contract is one free select — no buy-in confirm. Screens and HUD belong to Interface.

## Acceptance Criteria

- **GIVEN** a new campaign, **WHEN** the Credits ledger is first read, **THEN** it is **128,450 CR**.
- **GIVEN** Credits **C**, **WHEN** Economy writes (debrief payout, Tax deposit, research spend, hire), **THEN** the ledger is **≥ 0** after the write.
- **GIVEN** Credits **15,999 CR** and a project listed at **16,000 CR**, **WHEN** research is authorized, **THEN** the authorization is refused, Credits stay **15,999 CR**, and the project does not start.
- **GIVEN** Credits below a candidate’s hire cost, **WHEN** hire is authorized, **THEN** the authorization is refused, Credits are unchanged, and the roster is unchanged.
- **GIVEN** Influence **I** and Intel **J**, and Economy apply only (World Network apply not run), **WHEN** Economy applies a payout, Tax deposit, research debit, or hire debit, **THEN** Influence is still **I** and Intel is still **J**.
- **GIVEN** Credits **16,000 CR** and a project listed at **16,000 CR**, **WHEN** research is authorized, **THEN** the authorization succeeds and Credits **= 0 CR**.
- **GIVEN** Credits equal to a candidate’s hire cost **H CR**, **WHEN** hire is authorized, **THEN** the authorization succeeds and Credits **= 0 CR**.
- **GIVEN** Credits **128,450 CR**, **WHEN** a spend of **0 CR** or of **−1 CR** is requested, **THEN** Credits stay **128,450 CR** and no research or hire starts.
- **GIVEN** Credits **128,450 CR**, **WHEN** an authored or generated contract is accepted, **THEN** Credits stay **128,450 CR**.
- **GIVEN** an authored contract **or** a generated contract, **WHEN** it is accepted and played to finish, **THEN** both use Brief → Assembly → Mission → Debrief.
- **GIVEN** Glass Veil already won, **WHEN** the director returns to the World Network, **THEN** Glass Veil remains selectable.
- **GIVEN** a generated contract that is fulfilled, failed, or expired, **WHEN** the market is read, **THEN** that instance is gone.
- **GIVEN** a win, Reward **85,000 CR**, **2** unique civilians each first-hit by the squad, **WHEN** debrief applies, **THEN** Collateral **= 10,000 CR**.
- **GIVEN** a win, Reward **85,000 CR**, the **same** civilian hit twice by the squad and no other squad civilian hits, **WHEN** debrief applies, **THEN** Collateral **= 5,000 CR**.
- **GIVEN** a win, Reward **85,000 CR**, civilian harm caused **only** by CorpSec, **WHEN** debrief applies, **THEN** Collateral **= 0 CR**.
- **GIVEN** a win, Reward **41,000 CR**, **9** unique squad first-hits, **WHEN** debrief applies, **THEN** Collateral **= 41,000 CR**.
- **GIVEN** a win, Reward **85,000 CR**, one unique squad-caused civilian first-hit that is not a death, and no other squad civilian hits, **WHEN** Economy prices from the outcome DTO, **THEN** Collateral **= 5,000 CR**.
- **GIVEN** a loss, any Reward / optional / civilian hits, **WHEN** debrief applies, **THEN** `net_payout = 0 CR` and Credits are unchanged by the contract fee.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, optional bonus **0 CR**, Collateral **10,000 CR**, **WHEN** debrief applies, **THEN** `net_payout = 75,000 CR`.
- **GIVEN** a non-quiet win, Reward **41,000 CR**, Collateral **41,000 CR**, optional complete **+6,000 CR**, **WHEN** debrief applies, **THEN** `net_payout = 6,000 CR`.
- **GIVEN** a quiet-replay win, Reward **62,000 CR**, optional complete **+9,000 CR**, any Collateral, **WHEN** debrief applies, **THEN** `net_payout = 0 CR` including optionals.
- **GIVEN** a new High generated offer, `u = 0.5`, not initially priority, **WHEN** it is created, **THEN** Reward **= 54,500 CR**.
- **GIVEN** a new High generated offer, `u = 0.5`, initially priority, **WHEN** it is created, **THEN** Reward **= 76,500 CR**.
- **GIVEN** an existing generated offer with Reward **R**, **WHEN** Expedite waives its intel gate and adds **24** strategic hours of expiry, **THEN** Reward is still **R**.
- **GIVEN** Glass Veil already won, **WHEN** a quiet-replay **win** debriefs, **THEN** contract fee is **0 CR** (including optionals).
- **GIVEN** Glass Veil not yet won after a loss, Credits **128,450 CR**, **WHEN** the loss-retry is won with **0** unique squad civilian hits **and World Network apply is not run**, **THEN** Credits **= 213,450 CR**.
- **GIVEN** a generated (not authored) win, Reward **54,500 CR**, **0** unique squad civilian hits, optional bonus **0 CR**, and World Network apply is not run, **WHEN** debrief applies, **THEN** Credits increase by **54,500 CR**.
- **GIVEN** a mission in progress on a generated contract that is Offered, Credits **C CR**, **WHEN** Abort is confirmed, **THEN** there is no debrief, no invoice is built, Credits stay **C CR**, and the generated record remains Offered.
- **GIVEN** a debrief that has already applied `net_payout` once, **WHEN** the same outcome is applied again, **THEN** Credits increase only once.
- **GIVEN** World Network emits Tax amount **A CR** and **A > 0**, **WHEN** Economy deposits, **THEN** Credits increase by **A CR**.
- **GIVEN** World Network emits Tax amount **A ≤ 0**, **WHEN** Economy deposits, **THEN** Credits are unchanged.
- **GIVEN** a quiet-replay **win**, Credits **128,450 CR**, and World Network emits Tax **1,000 CR** during that debrief, **WHEN** Economy applies, **THEN** `net_payout = 0 CR` and Credits **= 129,450 CR**.
- **GIVEN** Economy Credits write only (World Network apply not run), **WHEN** a first non-quiet win payout is applied, **THEN** Influence stays **0**.

## Open Questions

- Locked generated “do not appear” (World Network Core Rule 10) vs OPEN CONTRACTS list still showing locked generated in code. Economy holds the instance either way. Presentation split belongs to Interface / World Network — do not resolve a hide rule here.
- Generated market physically sits in `worldStore` while Economy owns instances. Keep that split explicit; store move is a later ADR.
- Loss outcome DTO may stamp `reward: 0` in code; `net_payout` is also 0 if `!won`. Alias the payout rule; do not copy a second Reward.
- Downstream Research / Roster / Tactical / Persistence / Interface template GDDs are not extracted yet. Interfaces here are vs the living spec and World Network GDD.
