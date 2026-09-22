# Economy and contracts

> **Status**: Approved
> **Author**: extract from docs/game-design.md §6, §9, §11
> **Last Updated**: 2026-09-12 (independent /design-review APPROVED)
> **Implements Pillar**: Violence has corporate consequences; The two layers feed each other
> **Living spec**: `docs/game-design.md` §6, §9, §11 — this file aliases them; do not fork rules
> **Owners (2026-09-07)**: Credits = Economy; contract instances / Reward / expiry / collateral / net payout = Economy; Influence wallet+spends = World Network; Tax emit = World Network → Economy; Intel access resource = World Network
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-07
> **Independent /design-review**: 2026-09-12 APPROVED

## Overview

Economy and contracts is the house ledger and the work itself: **Credits** pay research and candidates; **Influence** is not kept here (World Network owns that wallet). The director accepts deniable work — three authored contracts as the campaign spine, a generated market as ongoing demand — at no up-front cost, then collects a **net payout** at debrief: Reward plus optional bonuses minus **collateral**. Collateral prices unique civilian hits by the squad. A quiet replay of already-won authored work pays no fee ([ADR-0004](../architecture/adr-0004-quiet-replay.md)). Authored and generated take the same path ([ADR-0003](../architecture/adr-0003-one-contract-kind.md)). Tax yield is received from World Network, not computed here ([ADR-0008](../architecture/adr-0008-influence-is-a-wallet.md)). Debrief applies the invoice once ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)); a win spends ETA so Tax can still tick ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Without this system the research gap has no market, violence has no invoice, and the World Network is only a contract picker.

Rules and numbers stay in `docs/game-design.md` §6, §9, §11. This overview does not fork them.

## Player Fantasy

You authorize the work. You read the invoice. The fantasy is corporate cost made legible at debrief: Reward, optional bonus, Collateral, net payout, new balance — the money lines living spec §10 reports. A unique civilian hit by the squad is a line item — first hit, not stacked, not CorpSec’s, never above Reward, never debt on a Loss. Accepting is free. A quiet replay prints `REPLAY // FEE ALREADY COLLECTED`. The authored three are the campaign spine. The generated market is ongoing demand that funds the research gap (pillar 4): same path as authored work, no buy-in, not a storefront and not a second campaign. After the program completes and the roster sits at cap, Credits are intentionally inert — post-cap Credits read as score, nothing more (living spec §19 #10); the market keeps running, nothing is owed to spend them down. Tax is a trickle. Credits do not convert to Influence. Economy prices; Interface presents; World Network applies sector/unrest; Persistence applies once. The fantasy fails if accept costs Credits, if the debrief is a loot drop instead of those invoice lines, or if authored and generated take different pipelines.

`new_balance` is the Credits ledger after this debrief’s Economy writes. It is not required to equal Reward + optional − Collateral. A quiet-replay win still spends ETA, so Tax may deposit on the same apply; the invoice still lists net payout **0 CR** and does not grow a Tax money line. The director reconciles the account from net payout plus Tax deposits, not by treating quiet work as a pay stub.

This serves **Violence has corporate consequences** and **The two layers feed each other**. It does not own Scan, Focus, or Influence spends (World Network) or the five verbs (Tactical).

## Detailed Design

### Core Rules

1. **Alias.** Tables, authored spine, generated Reward/expiry, collateral unit, and the 203,000 CR / 779,000 CR gap live in `docs/game-design.md` §6, §9, §11. This section names owners, states, and DTO edges. Do not copy those tables here. Do not copy §11 beat-by-beat tactics; spine identity, fees, optionals, intel/ETA, and one-line problem stay here.

2. **Two currencies, no convert.** Credits buy research and candidates. Influence buys Stabilize / Lobby / Expedite. Opening Credits **128,450**. Opening Influence **0** is World Network. Economy does not keep a second Influence ledger. Intel is World Network’s access resource.

3. **Credits ledger.** Economy owns the account. Deposits: net contract payout at debrief; Tax yield **emitted** by World Network (Credits + sector + tick time) and **deposited** here. World Network emits only for Nexus-held sectors; Contested does not emit. Economy deposits the emitted amount and does not recompute eligibility. Spends: research authorization and hiring. Balance may hit 0; it never goes negative. Post-cap disposition (living spec §19 #10): once the program is authorized-complete and the roster sits at hire cap, Credits are intentionally inert — no new spend is owed, and deposits keep reading as score.

4. **Overdraft refuse.** Research and hiring cannot overdraw. Authorization refuses; the account is unchanged. Exact-balance spend is allowed (account → 0). Zero and negative spends are ignored. Tax and payouts ignore non-positive amounts.

5. **One contract kind** ([ADR-0003](../architecture/adr-0003-one-contract-kind.md)). Authored and generated are the same work: brief → assembly → mission → debrief. Economy owns instances, Reward, expiry math, collateral, net payout. Generated records physically sit in `worldStore.contracts`; that is placement, not a second owner. Authored three stay replayable; generated leave the market on fulfill, fail, expiry, or raid withdraw.

6. **Accept is free.** Selecting a contract spends no Credits. Intel gates **access** (World Network); Economy does not charge a retainer.

7. **Net payout (Economy prices).** Loss and quiet replay pay **0** Credits (no debt), including optional bonuses. Else `Reward + optional_bonus − collateral`. Collateral: **5,000 CR** per unique civilian first **squad-caused hit** (not death, not stack, not CorpSec). Cap at Reward. Optional bonus sits on top of Reward (outside the cap). Quiet replay zeros the **whole** net ([ADR-0004](../architecture/adr-0004-quiet-replay.md)). `net_payout = 0` does not zero the stored Reward field on the outcome DTO. Illegal counts (`N < 0`, negative bonus) are refused as 0 — they never credit the ledger. A **pyrrhic win** (living spec §10: tiebreak Win that empties the roster on an incomplete campaign) still pays the **full** net payout; Interface prints the `PYRRHIC` note on the invoice, and banner precedence is World Network's, not a pricing rule.

8. **Quiet vs loss-retry.** Authored unwon (including a loss retry) still pays in full. Authored already won is quiet: 0 CR / 0 Inf / 0 Intel, no control/unrest shove; KIA / injury / XP / ETA still apply. Generated has no quiet replay.

9. **ETA is not a Credits spend.** A **win** debrief spends contract ETA as strategic days, including quiet replay. A **loss** spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Economy does not run the clock. Tax still ticks on a quiet-replay win because ETA catch-up still runs. Economy stamps ETA days on the slice. **Authored** ETAs are the §9 table (Glass Veil **2** / Hollow Crown **4** / Rust Haven **3**). **Generated** ETA is threat-mapped at creation: Moderate **2** / High **3** / Severe **4** (`CONTRACT_ETA_DAYS` in `src/game/contracts.ts`). That map is not the authored table — authored Severe (Glass Veil) is 2 days; generated Severe is 4. World Network spends the stamped days on a win.

10. **Debrief cut.** One partitioned **deploy snapshot** (four named slices; this GDD owns the Economy slice; no live store handles); outcome DTO at debrief; apply once ([ADR-0002](../architecture/adr-0002-unsaved-mission.md), [ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)). Economy prices the five §10 money lines **including zeros**; Interface presents them as an invoice, not a loot drop; World Network applies sector/unrest/ownership/Influence/Intel from the same outcome DTO; Persistence applies once. **Abort = no debrief = Economy writes nothing.** Do not live-query the running mission or roster to price. Economy does **not** emit a live collateral **CR** figure. Live HUD collateral is Interface presenting Tactical’s unique squad first-hit **count**. Economy prices CR only from the outcome DTO at debrief.

    Apply order for Credits this debrief: (1) `net_payout` (may be 0); (2) deposit each Tax amount WN emits during this apply. `new_balance` is the ledger after both. Tax is **not** a sixth invoice money line. The five lines do not have to sum: `new_balance − credits_before = net_payout + tax_deposits`.

11. **Generated market (Economy instance, WN clock/hooks).** Up to 3 open. New roll every 2–6 strategic hours when below target. Sector pick weighted toward high unrest / low control lives in §9 — do not fork the weights here. Threat from garrison (Secure→Moderate / Strained→High / Critical→Severe). Reward **clamp** 30,000–95,000 CR on a 500 CR grid, stamped at creation — do not recalculate when tags change. The 30,000 floor never binds (Moderate, u=0, P=1 → 30,500). Reachable stamps are discrete 500-grid values, not every amount from 30,500 to 95,000. Expire 24–48h (priority 8–16). Types: seizure / extraction / sabotage / riot-linked suppression. **Sable Enterprises** is not in the generated client pool (§19.2). World Network: Expedite, re-client, raid withdraw, riot post, Scan. Economy: Reward, expiry timestamps, generated ETA days, payout, leave-market.

12. **Influence income is not this ledger.** +6 win / +2 clean arrives **on the outcome DTO**; World Network applies it. Economy must not award Influence.

13. **Authored spine (identity only).** Glass Veil / Hollow Crown / Rust Haven: campaign-complete mark when all three have been won. They stay replayable. One-line problems: checkpoint read-and-commit; compound escort; yard invert. Sequences, geometry, weather, Opening hour belong to Tactical. Do not invent a generated optional-bonus table; bonus is whatever Tactical reports complete against the frozen Economy-slice defs (authored Hollow Crown **+9,000 CR**, Rust Haven **+6,000 CR**; generated work may report the same defs when Tactical completes them).

14. **Forbidden.** Currency convert; second Influence wallet; Intel as an Economy resource; tax from non-Nexus; Economy computing Tax yield; accept fee; full-fee quiet replay; collateral debt; overdraw; a second “story” pipeline; mid-mission Credits writes; pricing from live sim; live collateral **CR** on the HUD; shop / owned gear / account level / consumable store; hiding priced invoice zeros; restamping `quietReplay` or Reward from live `contractsWon`; zeroing outcome `reward` because `net_payout` is 0.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Credits account | Opening 128,450; In-credit (≥0); Zero. Never overdrawn | Win debrief → +net payout; WN Tax emit → deposit; research/hire authorize → debit; overdraft / zero-neg spend → no-op; abort → no write |
| Authored contract | Unwon; Won; Quiet (replay of Won) | Always replayable. Unwon win → Won + full invoice. Won deploy → Quiet. Loss of Unwon stays Unwon (full pay on later first win). Quiet win: 0 fee; ETA still. Intel lock is WN access, not an Economy instance state |
| Generated contract | Rolled; Locked-hidden (intel gate); Offered; Expired; Fulfilled; Failed | Roll when below target (or riot suppression post). Locked-hidden ↔ Offered via intel / Expedite (WN). Expire → leave market, no invoice. Win → Fulfilled, leave market. Loss → Failed, leave market, 0 pay. Raid withdraw leaves market with no invoice. Abort leaves the record where it was |
| Invoice | None; Building at debrief; Applied once | Abort: never built. Debrief: Economy prices all five money lines including zeros; Interface lists them; apply-once. Quiet banner: `REPLAY // FEE ALREADY COLLECTED` |
| Overdraft refuse | Affordable / Refused | Research or hire with cost > Credits → Refused, no debit. Exact balance spend allowed (→ Zero) |

**Locked-hidden:** Economy still holds the instance. Scan visibility is World Network Core Rule 10 (locked generated do not appear). Economy does not hide records and does not own a second hide rule.

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | Tax emit (Credits+sector+tick); garrison→Threat; Expedite/re-client/withdraw/post/expiry-fire on Economy records; Scan list | Contract instances, Reward, quiet/pay flags, expiry, stamped ETA days | Economy owns instances/payouts/Credits; WN owns clock/board/hooks/Influence/Intel |
| **Research** | Authorize request + cost | Refuse or debit; lab start is Research | Economy owns the Credits check; Research owns project formulas / `sync(t)` |
| **Roster / Assembly** | Hire request + candidate cost | Refuse or debit | Roster owns bodies and hire table; Economy only the Credits refuse |
| **Tactical** | Economy slice of the deploy snapshot (frozen Reward, bonus defs, quietReplay, contract id, ETA days) | Outcome DTO at debrief (`civiliansHit` unique squad-caused, won, bonus, stored Reward) | Neither live-queries the other. Tactical counts hits; Economy prices CR only at debrief |
| **Interface** | Invoice rows (all five money lines including zeros), Credits header, overdraft-disabled authorize | Select contract (free); Abort (no debrief) | Presentation only. Must present priced zeros; must not hide them. Live collateral **count** is Tactical → Interface, not an Economy CR output |
| **Persistence** | — | Credits; generated records; `contractsWon` | Strategy autosave. Mission + debrief not saved ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). Apply once |

Research, Roster and Assembly, Tactical mission, Persistence and validation, and Interface GDDs exist. Edges above vs those files + living spec + World Network GDD.

**Deploy snapshot (partitioned, frozen):** one snapshot, four named slices ([ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)). This GDD owns the Economy slice. Do not pass live store handles. Do not call any slice “the Snapshot DTO.”

- **Economy slice:** contract id; authored vs generated; Reward; optional bonus defs; ETA days (authored §9 table, or generated `CONTRACT_ETA_DAYS`; World Network spends later); `quietReplay` from authored `contractsWon` (boolean at create; do not restamp from live `contractsWon`).
- **World Network slice:** sector id; Control; Unrest — defined in the World Network GDD. Not an Economy schema.
- **Research slice / Roster slice:** unslotted set and resolved wear / `appliedIds` — not Economy schema.

**Outcome DTO (debrief, apply once):** `won`; `quietReplay` (frozen from the Economy slice; do not restamp from live `contractsWon`); `civiliansHit` (unique squad-caused first hits); `reward` (stored contract Reward from the Economy slice — including on Loss and quiet replay); `bonus` (completed optionals). `net_payout = 0` must not zero `reward`. Abort is **absence of an outcome**, not a field. World Network also reads this DTO for Control/Unrest/ownership/Influence/Intel/Feed/generated removal. World Network does **not** compute collateral.

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §6, §9, §11.

Economy owns four live formulas: `collateral`, `net_payout`, `generated_reward`, `new_balance`. Opening Credits, authored Rewards/optionals, authored and generated ETA days, expiry windows, and market cadence are constants or ranges, not formulas. `tax_yield` is World Network; Economy only deposits the emitted amount. Authored chance and Risk index are not Economy. Influence +6 / +2 is World Network.

The `collateral` formula is defined as:

`N = max(0, floor(civiliansHit))`

`collateral = min(Reward, 5000 × N)`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Reward | Reward | int | authored table, or generated clamp 30,000–95,000 on a 500 CR grid (discrete stamps; min 30,500) | Stored contract fee on the outcome DTO, before Collateral and before optional bonus. Not zeroed on Loss |
| unique squad first-hits (raw) | civiliansHit | number | any | Outcome count before clamp |
| unique squad first-hits | N | int | ≥ 0 (unbounded; Tactical count) | `max(0, floor(civiliansHit))`. Negative or non-integer input becomes 0. Does not stack repeats. CorpSec-caused hits are not this count. Pricing still `min(Reward, 5000 × N)` if N exceeds deployment civilian count |
| unit fine | 5000 | int | 5000 | Credits per unique squad first-hit (§6) |
| collateral | collateral | int | 0–Reward | Invoice deduction. Ledger debit only when `net_payout` applies |

**Output Range:** Always 0–Reward after the N clamp. Not necessarily a multiple of 5,000 once capped. Loss still prices this line from stored Reward and N; it does not apply it as a ledger debit (see `net_payout`).
**Example:** Glass Veil Reward 85,000 CR, N=2 → collateral = 10,000 CR. N=17 → 85,000 CR. N=18 → still 85,000 CR. civiliansHit = −1 → N=0 → collateral = 0 CR.

The `net_payout` formula is defined as:

`optional_bonus = max(0, completed_bonus)`

`net_payout = 0` if quiet replay or not a Win;

`net_payout = Reward + optional_bonus − collateral` if Win and not quiet replay.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| Win | won | bool | true/false | Every required objective complete |
| quiet replay | quiet | bool | true/false | Frozen Economy-slice flag: this authored contract is already won |
| Reward | Reward | int | same as collateral | Stored contract fee (not zeroed when net is 0) |
| completed bonus (raw) | completed_bonus | number | any | Sum of completed optional bonus defs from the frozen Economy slice |
| optional bonus | optional_bonus | int | ≥ 0 | `max(0, completed_bonus)`. 0 if ignored/failed. Do not invent a generated table; Tactical reports complete against frozen defs (Hollow Crown +9,000; Rust Haven +6,000; generated may report the same defs) |
| collateral | collateral | int | 0–Reward | From `collateral` |
| net payout | net_payout | int | ≥ 0 | Credits deposited on debrief from the contract fee |

**Output Range:** Always ≥ 0 after clamps. Collateral caps at Reward, so optionals can still pay after the fee is zeroed. Quiet replay pays 0 including optionals. Abort never evaluates this (no debrief). Zero net does not clear `reward` or skip invoice pricing. Negative `completed_bonus` becomes 0; it never credits extra or debits the ledger.
**Example:** One contract, one evaluation. Glass Veil win, N=2, no optional: Reward 85,000 − collateral 10,000 = **75,000 CR**. Hollow Crown win, N=13, optional complete: collateral = 62,000, net_payout = **9,000 CR**. Rust Haven win, opening Standard, optional ignored, N=8: collateral = 40,000, net_payout = **1,000 CR**. (N=9 zeros the fee only with unrest > 20 or Hardened extra civilians — not opening Standard. Cap-at-Reward remains AC-13.) The three-authored-contract clean pass **203,000 CR** (85k+62k+9k+41k+6k) is §6 gap arithmetic, not a `net_payout` output.

The `generated_reward` formula is defined as:

`generated_reward = clamp(500 × round(B × (0.9 + 0.3u) × P / 500), 30000, 95000)`

`round` is JavaScript `Math.round`: halves of **positive** values used here round **toward +∞** (0.5 → 1). Do not use banker's half-even. Source: `rollReward` in `src/game/contracts.ts`.

Evaluated **once at offer creation**. Stamps Reward. Do not recalculate when Priority, Expedite, Unrest, Control, or other tags change later. Authored Rewards are not this formula.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| threat base | B | int | {34000, 52000, 70000} | Moderate / High / Severe |
| jitter | u | float | [0, 1) | Seeded draw at creation |
| initial priority premium | P | float | {1, 1.4} | 1.4 if the offer is **initially** priority, else 1 |
| generated reward | generated_reward | int | discrete 500 CR grid; min 30500, max 95000; not every grid point in between | Stored Reward |

**Output Range:** Clamp expression is 30,000–95,000 CR, snapped to a 500 CR grid. The 30,000 floor never binds (Moderate u=0 P=1 → 30,500). The reachable set is discrete 500-grid stamps, not the continuous interval 30,500–95,000 CR: 41,500 / 42,000 / 42,500 do not occur. Severe + initial P=1.4 saturates at 95,000 for most u. Same Threat uses the same calculation in every sector; offers are not identical.
**Example:** High, u=0.5, P=1 → **54,500 CR**. Same with initial priority P=1.4 → **76,500 CR**. Moderate, u=0.75, P=1 → raw 38,250 → `Math.round` **38,500 CR** (banker's half-even would be 38,000 — forbidden).

The `new_balance` formula is defined as:

`new_balance = credits_before + net_payout + tax_deposits`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| credits before | credits_before | int | ≥ 0 | Credits ledger at the start of this debrief apply |
| net payout | net_payout | int | ≥ 0 | From `net_payout` |
| tax deposits | tax_deposits | int | ≥ 0 | Sum of WN-emitted Tax amounts Economy deposits during this apply. 0 if World Network apply is not run, or every emit is ≤ 0. WN does not claim `tax_yield ≥ 0` until §5 names a Control floor; this ledger still ignores non-positive emits |
| new balance | new_balance | int | ≥ 0 | Credits after this debrief’s Economy writes |

**Output Range:** Always ≥ 0. Tax is not a sixth invoice money line. The five listed lines are Reward, optional bonus, Collateral, net payout, new balance. Identity: `new_balance − credits_before = net_payout + tax_deposits`. They are not required to equal Reward + optional − Collateral.
**Example:** Quiet-replay win, credits_before 128,450, net_payout 0, tax_deposits 1,000 → new_balance **129,450 CR**. Invoice still lists net payout **0 CR**.

**Generated ETA (constant table, not a formula).** Stamped at offer creation from Threat. Source: `CONTRACT_ETA_DAYS` in `src/game/contracts.ts`. Authored ETAs are the §9 table, not this map.

| Threat | Generated ETA days |
|--------|-------------------:|
| Moderate | 2 |
| High | 3 |
| Severe | 4 |

Authored: Glass Veil (Severe) **2** days; Hollow Crown (High) **4** days; Rust Haven (Moderate) **3** days — `docs/game-design.md` §9 / `src/game/data.ts`.

## Edge Cases

- **If Abort:** no debrief. No invoice is built. Credits unchanged. Contract records stay in the state they had at deploy (authored Unwon stays Unwon; generated stays Offered if it was Offered). No `net_payout`. No ETA, so this mission does not cause Tax catch-up.
- **If Loss:** `net_payout = 0` (optionals unpaid). Outcome `reward` stays the stored contract Reward. Collateral still prices for the invoice line from that Reward and N; it does not debit. Authored remains payable on a later first win. Generated leaves the market. Loss spends no ETA.
- **If quiet replay (already won):** contract fee 0; optionals also unpaid. Outcome `reward` stays the stored contract Reward. Debrief still runs (`REPLAY // FEE ALREADY COLLECTED`). Invoice still lists the five money lines including zeros. KIA / injury / XP apply. A **win** still spends ETA, so Tax may still deposit via catch-up. Influence/Intel/Control/Unrest are WN, not this ledger. `new_balance` may rise by `tax_deposits` while `net_payout` stays 0.
- **If collateral would exceed Reward:** `collateral = Reward`. Win net = optional_bonus only (or 0 if no optional). Never negative Credits.
- **If civiliansHit < 0 or is non-integer:** `N = max(0, floor(civiliansHit))`. Negative never produces negative collateral or inflated `net_payout`.
- **If completed_bonus < 0:** `optional_bonus = 0`. Negative never debits or credits the ledger.
- **If the same civilian is multi-hit:** first squad hit bills once. Repeats do not stack. Death is not required.
- **If CorpSec-caused hits:** not Collateral. Do not increment N.
- **If overdraft (research or hire):** authorization refuses. Credits unchanged.
- **If generated expiry:** unaccepted offer leaves the market unpaid. No invoice. Credits unchanged. Strategic clock does not tick in the field, so expiry does not fire mid-mission.
- **If Expedite (WN verb on Economy records):** waive intel gate; add 24 strategic hours of expiry. Do **not** reroll Reward. Do **not** apply P=1.4 after the fact. No generated target → spend blocked (WN). Economy stores the mutated record.
- **If tax emit deposit:** Economy deposits the emitted amount only. Do not recompute `tax_yield` or ownership. Amount 0 → no deposit. Quiet-replay win can still receive deposits because ETA catch-up may fire WN ticks.
- **If optional fail or ignore:** bonus for that objective is 0. Win is ungated. No extra Credit penalty.
- **If campaign complete vs quiet replay:** winning all three authored marks complete; they stay replayable. The **first** win of each pays `net_payout`. Every later win of those three is quiet. Generated work still pays. A completed campaign is not failed by a later roster wipe.
- **If locked generated:** Economy still holds the instance. Scan presentation is World Network Core Rule 10 (do not appear). Economy does not implement a second hide.
- **If two money events share a debrief:** price Credits from the outcome DTO once (`net_payout`); then deposit Tax emits; WN applies Influence/Intel/sectors from the same DTO; Persistence commits once. Economy does not award Influence.
- **If live `contractsWon` changes after the Economy slice is created:** do not restamp `quietReplay` or Reward. Price from the frozen slice.
- **If mission is running:** Economy writes nothing. Credits stay at the pre-deploy value until debrief or Abort (Abort still writes nothing).

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Tax emit in; clock/hooks on contract records; Scan | Credits ledger is Economy; WN does not hold it. Influence/Intel are WN |
| Hard, downstream | Research | Credits authorize | Labs catch up on WN `t`; Economy does not own project formulas |
| Hard, downstream | Roster and Assembly | Credits authorize hire | No live roster query |
| Hard, downstream | Tactical mission | Economy slice of deploy snapshot; outcome at debrief | No live mission query. Tactical unique-hit **count** may feed HUD; Economy does not price that count until debrief |
| Hard, downstream | Interface | Presentation | Invoice including zeros, Credits header, overdraft disable. Live collateral count is Tactical → Interface |
| Hard, downstream | Persistence and validation | Strategy autosave | Mission/debrief excluded |

This GDD lists World Network as upstream (Tax, clock, board). World Network lists Economy as downstream (Tax emit in; contract instances out). Bidirectional: Economy owns instances/payouts; WN owns clock/board/hooks. Research, Roster, Tactical, Persistence, and Interface GDDs exist and list Economy.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §6, §9, §11 (and `src/game/contracts.ts` / `appStore` for implementation). This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer. Do not duplicate World Network tax-base knobs here.

| Knob | Owner | Too high / too low |
|---|---|---|
| Opening Credits 128,450 | §6 | Opening already funds the program vs opening is already broke |
| Collateral unit 5,000 CR | §6 | Harmless stray fire vs one hit zeros every invoice |
| Authored Rewards / optionals | §9, §11 | Authored pass funds research (kills generated market) vs spine feels unpaid |
| Research total 779,000 CR (gap statement) | §7 / Research (not an Economy retune) | Gap is authored replay vs gap is unreachable |
| Generated Reward clamp 30–95k / 500 grid / B / P (30k floor never binds) | §9 | Market replaces authored spine vs market cannot fund the gap |
| Generated cap 3 / roll 2–6h / expiry 24–48h | §9 | Dead market vs unreadable Scan |
| Generated ETA Moderate 2 / High 3 / Severe 4 | `contracts.ts` (unnamed in §9) | Generated Severe catch-up dwarfs Glass Veil vs generated work spends no strategy time |
| Tax bases / strain | §5 / World Network | Trickle vs replacing the generated market — **not an Economy knob** |

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Economy requires the debrief to read as an **invoice**: Reward, optional bonus, Collateral, net payout, new balance — the money lines living spec §10 reports, **including when a line is 0**; quiet banner `REPLAY // FEE ALREADY COLLECTED`. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. Audio prices violence; it does not celebrate payouts. No second visual language for a storefront.

## UI Requirements

Credits header on strategy screens. Overdraft: research/hire authorization disabled when cost > Credits. Economy always prices these debrief money lines from the outcome DTO, including zeros: Reward (stored contract fee, including on Loss and quiet replay), optional bonus, Collateral (count and CR), net payout, new balance — the invoice fields in living spec §10. Interface **must present** those priced lines as an invoice. Do not hide zero-value money rows (Loss, quiet replay, N=0). Quiet banner `REPLAY // FEE ALREADY COLLECTED` is Interface copy and still prints. Brief “collateral tolerance” chrome is Interface / living spec §9 — not an Economy free band or percent budget. Accepting a contract is one free select — no buy-in confirm. Screens and HUD belong to Interface. Mission HUD collateral is a **count** of unique squad first-hits (Tactical → Interface). Economy does not supply live CR for that chip.

## Acceptance Criteria

- **GIVEN** a new campaign, **WHEN** the Credits ledger is first read, **THEN** it is **128,450 CR**.
- **GIVEN** Credits **C ≥ 0**, **WHEN** a debrief payout, Tax deposit, research spend, or hire **succeeds**, **THEN** Credits after the write are **≥ 0**.
- **GIVEN** Credits **15,999 CR** and a project listed at **16,000 CR**, **WHEN** research is authorized, **THEN** the authorization is refused, Credits stay **15,999 CR**, and the project does not start.
- **GIVEN** Credits **15,999 CR** and a candidate listed at **16,000 CR**, **WHEN** hire is authorized, **THEN** the authorization is refused, Credits stay **15,999 CR**, and the roster is unchanged.
- **GIVEN** Influence **I** and Intel **J**, and Economy apply only (World Network apply not run), **WHEN** Economy applies a payout, Tax deposit, research debit, or hire debit, **THEN** Influence is still **I** and Intel is still **J**.
- **GIVEN** Credits **16,000 CR** and a project listed at **16,000 CR**, **WHEN** research is authorized, **THEN** the authorization succeeds and Credits **= 0 CR**.
- **GIVEN** Credits equal to a candidate’s hire cost **16,000 CR**, **WHEN** hire is authorized, **THEN** the authorization succeeds and Credits **= 0 CR**.
- **GIVEN** Credits **128,450 CR**, **WHEN** a spend of **0 CR** or of **−1 CR** is requested, **THEN** Credits stay **128,450 CR** and no research or hire starts.
- **GIVEN** Credits **128,450 CR**, **WHEN** an authored or generated contract is accepted, **THEN** Credits stay **128,450 CR**.
- **GIVEN** an authored contract **or** a generated contract, **WHEN** it is accepted and played to finish, **THEN** both use Brief → Assembly → Mission → Debrief.
- **GIVEN** Glass Veil already won, **WHEN** the director returns to the World Network, **THEN** Glass Veil remains selectable.
- **GIVEN** a generated contract that is fulfilled, **WHEN** the market is read, **THEN** that instance is gone.
- **GIVEN** a generated contract that is failed, **WHEN** debrief has applied (World Network apply not run), **THEN** `net_payout = 0 CR`, that instance is gone, and Credits are unchanged by the contract fee.
- **GIVEN** a generated contract that is expired, Credits **C CR**, **WHEN** the market is read, **THEN** that instance is gone, no invoice is built, and Credits stay **C CR**.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, **2** unique civilians each first-hit by the squad, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 10,000 CR**.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, the **same** civilian hit twice by the squad and no other squad civilian hits, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 5,000 CR**.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, civilian harm caused **only** by CorpSec, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 0 CR**.
- **GIVEN** a non-quiet win, Reward **41,000 CR**, **9** unique squad first-hits, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 41,000 CR**.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, one unique squad-caused civilian first-hit that is not a death, and no other squad civilian hits, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 5,000 CR**.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, civiliansHit **−1**, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** Collateral **= 0 CR** and `net_payout` is not increased by a negative fine.
- **GIVEN** a loss, stored Reward **85,000 CR**, **2** unique squad first-hits, optional bonus **0 CR**, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** `reward` **= 85,000 CR**, Collateral **= 10,000 CR**, `net_payout = 0 CR`, and Credits are unchanged by the contract fee.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, optional bonus **0 CR**, Collateral **10,000 CR**, **WHEN** debrief applies (World Network apply not run), **THEN** `net_payout = 75,000 CR`.
- **GIVEN** a non-quiet win, Reward **41,000 CR**, Collateral **41,000 CR**, optional complete **+6,000 CR**, **WHEN** debrief applies (World Network apply not run), **THEN** `net_payout = 6,000 CR`.
- **GIVEN** a non-quiet win, Reward **85,000 CR**, completed_bonus **−1,000 CR**, Collateral **0 CR**, **WHEN** Economy prices from the outcome DTO (World Network apply not run), **THEN** `optional_bonus = 0 CR` and `net_payout = 85,000 CR`.
- **GIVEN** a quiet-replay win, Reward **62,000 CR**, optional complete **+9,000 CR**, any Collateral, **WHEN** debrief applies (World Network apply not run), **THEN** `net_payout = 0 CR` including optionals and outcome `reward` **= 62,000 CR**.
- **GIVEN** a new High generated offer, `u = 0.5`, not initially priority, **WHEN** it is created, **THEN** Reward **= 54,500 CR**.
- **GIVEN** a new High generated offer, `u = 0.5`, initially priority, **WHEN** it is created, **THEN** Reward **= 76,500 CR**.
- **GIVEN** a new Moderate generated offer, `u = 0`, not initially priority, **WHEN** it is created, **THEN** Reward **= 30,500 CR**.
- **GIVEN** a new Moderate generated offer, `u = 0.75`, not initially priority, **WHEN** it is created, **THEN** Reward **= 38,500 CR**.
- **GIVEN** an existing generated offer with Reward **R**, **WHEN** Expedite waives its intel gate and adds **24** strategic hours of expiry, **THEN** Reward is still **R**.
- **GIVEN** a generated Reward **R** stamped at creation, **WHEN** sector Unrest or Control changes, **THEN** Reward is still **R**.
- **GIVEN** Glass Veil already won, **WHEN** a quiet-replay **win** debriefs (World Network apply not run), **THEN** contract fee is **0 CR** (including optionals).
- **GIVEN** Glass Veil not yet won after a loss, Credits **128,450 CR**, **WHEN** the loss-retry is won with **0** unique squad civilian hits **and World Network apply is not run**, **THEN** Credits **= 213,450 CR**.
- **GIVEN** a generated (not authored) win, Reward **54,500 CR**, **0** unique squad civilian hits, optional bonus **0 CR**, and World Network apply is not run, **WHEN** debrief applies, **THEN** Credits increase by **54,500 CR**.
- **GIVEN** a mission in progress on a generated contract that is Offered, Credits **C CR**, **WHEN** Abort is confirmed, **THEN** there is no debrief, no invoice is built, Credits stay **C CR**, and the generated record remains Offered.
- **GIVEN** a mission in progress on Glass Veil Unwon, Credits **C CR**, **WHEN** Abort is confirmed, **THEN** there is no debrief, no invoice is built, Credits stay **C CR**, and Glass Veil remains Unwon.
- **GIVEN** Credits **128,450 CR**, a non-quiet win with `net_payout` **75,000 CR** already applied once (World Network apply not run), **WHEN** the same outcome is applied again, **THEN** Credits **= 203,450 CR**.
- **GIVEN** World Network emits Tax amount **A CR** and **A > 0**, **WHEN** Economy deposits, **THEN** Credits increase by **A CR**.
- **GIVEN** World Network emits Tax amount **A ≤ 0**, **WHEN** Economy deposits, **THEN** Credits are unchanged.
- **GIVEN** a quiet-replay **win**, Credits **128,450 CR**, World Network apply not run, **WHEN** Economy applies, **THEN** `net_payout = 0 CR` and Credits **= 128,450 CR**.
- **GIVEN** Credits **128,450 CR**, `net_payout = 0 CR` already applied, **WHEN** Economy deposits Tax **1,000 CR**, **THEN** Credits **= 129,450 CR** and `new_balance = 129,450 CR`.
- **GIVEN** Economy Credits write only (World Network apply not run), **WHEN** a first non-quiet win payout is applied, **THEN** Influence stays **0**.
- **GIVEN** Economy slice created with `quietReplay` **false** and Reward **R**, **WHEN** live `contractsWon` later includes that contract before apply, **THEN** Economy prices using frozen `quietReplay` **false** and Reward **R** (no restamp).
- **GIVEN** 3 generated instances in Offered or Locked-hidden, **WHEN** a generation due fires, **THEN** the generated instance count stays **3**.
- **GIVEN** 2 generated instances in Offered or Locked-hidden, **WHEN** a generation due fires, **THEN** the generated instance count is **3**.
- **GIVEN** a generated offer is created, **WHEN** client is read, **THEN** client is not Sable Enterprises.
- **GIVEN** a generated contract that is raid-withdrawn, **WHEN** Economy instances are read, **THEN** that instance is gone, no invoice is built, and Credits are unchanged.
- **GIVEN** exactly two authored contracts won, **WHEN** campaign-complete is read, **THEN** it is false.
- **GIVEN** Glass Veil, Hollow Crown, and Rust Haven have all been won, **WHEN** campaign-complete is read, **THEN** it is true.
- **GIVEN** Glass Veil, Hollow Crown, and Rust Haven have all been won, **WHEN** instances are read, **THEN** all three remain selectable.
- **GIVEN** Glass Veil already won as part of campaign-complete, **WHEN** a later win of Glass Veil debriefs (World Network apply not run), **THEN** `net_payout = 0 CR`.
- **GIVEN** campaign-complete is true, a generated win, Reward **54,500 CR**, **0** unique squad civilian hits, optional bonus **0 CR**, World Network apply not run, **WHEN** debrief applies, **THEN** Credits increase by **54,500 CR**.
- **GIVEN** a new Moderate generated offer, **WHEN** it is created, **THEN** ETA **= 2** days.
- **GIVEN** a new High generated offer, **WHEN** it is created, **THEN** ETA **= 3** days.
- **GIVEN** a new Severe generated offer, **WHEN** it is created, **THEN** ETA **= 4** days.
- **GIVEN** Glass Veil, **WHEN** its ETA is read, **THEN** ETA **= 2** days (authored table, not the generated threat map).
- **GIVEN** Hollow Crown, **WHEN** its ETA is read, **THEN** ETA **= 4** days (authored table, not generated High **3**).
- **GIVEN** Rust Haven, **WHEN** its ETA is read, **THEN** ETA **= 3** days (authored table, not generated Moderate **2**).
- **GIVEN** Economy has priced Reward **0 CR**, optional bonus **0 CR**, Collateral **0 CR**, net payout **0 CR**, new balance **C**, **WHEN** Interface builds the invoice, **THEN** those five lines are present (not omitted).
- **GIVEN** a loss, stored Reward **85,000 CR**, Collateral **10,000 CR**, optional bonus **0 CR**, `net_payout = 0 CR`, new balance **C**, **WHEN** Interface builds the invoice, **THEN** Reward **85,000 CR** is present (not omitted) and all five money lines are present.
- **GIVEN** a quiet-replay win, stored Reward **62,000 CR**, optional bonus **0 CR**, Collateral **0 CR**, `net_payout = 0 CR`, new balance **C**, **WHEN** Interface builds the invoice, **THEN** Reward **62,000 CR** is present (not omitted) and all five money lines are present.
- **GIVEN** a non-quiet win, N=0, Collateral **0 CR**, **WHEN** Interface builds the invoice, **THEN** the Collateral **0 CR** line is present (not omitted).
- **GIVEN** Credits **C CR** at deploy, **WHEN** the mission is still running, **THEN** Credits stay **C CR**.

## Closed Questions

| # | Question | Resolution |
|---|---|---|
| 1 | Locked generated “do not appear” vs OPEN CONTRACTS | Closed. World Network Core Rule 10: locked generated do not appear. Economy holds the instance and does not own a hide rule. |
| 2 | Generated market physically sits in `worldStore` | Closed. Owner = Economy; home = `worldStore.contracts` ([ADR-0012](../architecture/adr-0012-store-placement.md)). Do not move. |
| 3 | Hide/show of zero-value invoice rows | Closed for Economy. This GDD requires Interface to present all five priced money lines including zeros (Loss, quiet replay, N=0). Interface GDD Open Question 1 is Closed on the same rule. Do not fork a second show-rule here. |
