# Research

> **Status**: Designed (pending independent `/design-review`)
> **Author**: extract from docs/game-design.md §7
> **Last Updated**: 2026-09-08
> **Implements Pillar**: The two layers feed each other
> **Living spec**: `docs/game-design.md` §7 — this file aliases it; do not fork rules
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

Research is the house program that changes the next squad: **Credits** authorize a project; **strategic time** finishes it; effects land on the **next** deployment, not on a squad already in the field. Three laboratories — Ballistics, Cybernetics, Control Systems — seven projects each, twenty-one total. One active project per lab. Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted blueprints: a bay wears at most one completed project; every operative may wear the same one ([ADR-0005](../architecture/adr-0005-blueprint-assignment.md)). Credits debit the moment authorization succeeds; Economy owns the refuse. Laboratories catch up on World Network `t` after a Screen tick or a **win** ETA jump; a loss spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Sampled at deploy. Without this system Credits have nowhere to go that changes a later firefight, and the two-layer loop is only a contract picker plus an invoice.

Rules and numbers stay in `docs/game-design.md` §7. This overview does not fork them.

## Player Fantasy

You authorize the program. You do not kit a hero. Inspect a branch. Commit Credits to one project in that laboratory — one active per lab. Credits debit when authorization succeeds; Economy refuses the overdraft. Then let strategic time run: laboratories catch up on World Network `t` after a Screen tick or a **win** ETA; a loss spends none. Effects sample at the **next** deploy, never on a squad already in the field. Unslotted Ballistics lands squad-wide. Slotted Cybernetics and Control Systems are house blueprints: a bay wears at most one completed project; every operative may wear the same one; unpinned bays follow current issue; pins hold stock or older. Death drops assignment, not the program. Three laboratories, not three games — another room of the same terminal. Research names the home bay; Assembly wears it. Not a locker.

This serves **The two layers feed each other** and **Command, do not micromanage**. It does not own the Credits ledger (Economy) or the five verbs (Tactical). The fantasy fails if authorization is a browse, if effects land in the field, if a finished project does not change a later firefight, or if wear is owned hardware that dies with the body.

## Detailed Design

### Core Rules

1. **Alias.** Cost, time, requires, effect, and home-bay rows stay in `docs/game-design.md` §7. This section names owners, states, and DTO edges. Do not copy the 21-row tables.

2. **One program.** Three branches, seven projects each, twenty-one total. One laboratory per branch. One active project per lab. Three may run at once only in different branches. Three labs of one OS, not three games. Not a locker.

3. **Authorize.** Research emits request + listed cost. Economy refuses or debits. Credits debit the moment authorization succeeds. Exact-balance spend is allowed. Zero and negative spends are ignored. Overdraft: refuse, Credits unchanged, lab does not start. No refund on abort, cancel, loss, or death. Research does not keep a Credits ledger.

4. **Strategic `t`.** World Network owns the clock. Research `sync(t)` after a Screen tick or a **win** ETA jump (quiet replay included). A **loss** spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Mission does not tick laboratories. Research does not own Pause or speed.

5. **Project states.** locked / available / active / researched (living spec §12). Prerequisites gate research, not wear. Lab-busy does **not** retag a sibling `available`. No fifth state. No cancel. Researched is terminal.

6. **Program cost.** **779,000 CR**. Branches: Ballistics **248,000** / Cybernetics **261,000** / Control Systems **270,000**. Per-project rows stay in §7.

7. **Unslotted / slotted** ([ADR-0005](../architecture/adr-0005-blueprint-assignment.md)). Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted blueprints: every operative may wear the same completed project. Research names the home bay; Assembly wears it.

8. **Bays.** Neural, Chest, Arms, Legs. A bay wears at most one completed slotted project that belongs to it. Wear applies all of that project’s effects to that operative only. Unpinned bays, including new hires, wear **current issue**. A pin holds stock issue or an older completed project. A new completion updates unpinned bays only. Death drops that operative’s assignment, not the program. Assembly owns pin/wear; Research owns home bay and current-issue identity.

9. **Sample.** Unslotted apply to the whole squad. Slotted apply only to who wears them. Effects stack in completion order among what actually applies. Sampled when the mission is created. Cannot change a squad already on the ground. Experience is Roster, not Research.

10. **Deploy cut.** One partitioned snapshot; no live store handles ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). **Research slice:** completed unslotted set + per-operative **resolved worn** slotted ids (at most one per bay). Pins are Roster-owned and are not fields of this slice. Do not extend the World Network snapshot schema. Tactical applies the freeze. Abort = no debrief = program unchanged (that mission does not jump `t`). Completions after this freeze apply to the **next** deploy.

11. **Chance.** Authored chance uses completed research. Tactical / Brief owns the math. Research only exposes the completed set. Research does not compute chance, Risk index, or Event forecast.

12. **Forbidden.** Locker; unique implants; more than one active project per lab; mid-mission re-sample; labs ticking in the field; second clock; second Credits ledger; overdraw; refund-on-abort; Experience as Research; chance/Risk/forecast math; prerequisites gating wear; death destroying the program; new completion updating pinned bays; copying the §7 tables.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Project | locked / available / active / researched | locked → available when every listed prerequisite is researched. available → active when authorize succeeds. active → researched when `sync(t)` sees completion. researched is terminal. No reverse. |
| Laboratory | idle / running one project | idle → running on successful authorize. Occupied lab: further authorize is a no-op (Credits unchanged). running → idle when that project is researched. Frozen in the field. |
| Current issue (per slotted bay) | none / latest completed in that bay | Advances when a slotted project for that bay becomes researched. Unslotted Ballistics has no current issue. New completion updates unpinned bays only. |
| Pin vs unpinned | Unpinned / Pinned to stock / Pinned to older completed | Roster-owned. Research names the edge only. |
| Authorization | Affordable / Refused | Economy: cost > Credits → Refused. Occupancy / missing prereqs / already-researched also leave Credits unchanged. |
| Deploy sample | Strategy live / Frozen at mission create | Research slice frozen at create. Later `sync(t)` does not rewrite this freeze. |
| Mission coupling | Strategy / Deployed / Debrief catch-up / Abort discarded | Field does not tick labs. Win (including quiet): ETA then `sync(t)`. Loss: no ETA. Abort: no research write, no refund; labs already running continue on Screens. |

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | Strategic `t` after Screen tick or **win** ETA | — | WN owns clocks and ETA. Research `sync(t)`. |
| **Economy** | Refuse or debit | Authorize request + cost | Economy owns Credits. Research owns start, occupancy, graph, effects, `sync(t)`. |
| **Roster / Assembly** | Pins; hire; death drops assignment | Current issue; completed program; home bay | Roster owns bodies/pins/wear. Provisional until Roster GDD. |
| **Tactical** | — | **Research slice** at deploy | Neither live-queries the other. |
| **Interface** | Authorize (a spend) | States, occupancy, progress, home bay | Presentation only. |
| **Persistence** | — | Laboratories (`done` + lab runs) | Strategy autosave includes laboratories; mission excluded. Pins on the roster blob. |

Roster / Tactical / Persistence / Interface template GDDs are not extracted yet. Edges vs living spec + World Network / Economy GDDs; pin/wear edge provisional until Roster exists.

## Formulas

Do not fork. Canonical project rows: `docs/game-design.md` §7. §7 percents alias to multipliers (`+12%` → `1.12`; `−10%` → `0.9`). Weapon-table bases are not Research-owned. `program_cost = 248,000 + 261,000 + 270,000 = 779,000 CR` is a checksum constant, not a curve.

The `endT` formula is defined as:

`endT = startedT + hours × 3600`

complete when `sync(t)` sees `t ≥ endT`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| start time | startedT | float | ≥ 0 | Strategic `t` at successful authorize |
| duration hours | hours | int | {2, 4, 8, 14} | §7 time by project |
| seconds per hour | 3600 | int | 3600 | Strategic seconds per listed hour |
| lab end | endT | float | startedT + {7200, 14400, 28800, 50400} | Instant the project becomes researched |
| sample time | t | float | ≥ 0 | World Network `t` passed to `sync(t)` |

**Output Range:** Discrete offset from `startedT` only. Completes at equality. Field does not tick labs; a loss spends no `t`.
**Example:** 2h Advanced Propellants authorized at `t = 0` → `endT = 7200`. Authorized at `t = 1000` → `endT = 8200`.

The `appliedNodeIds` formula is defined as:

`appliedNodeIds = unslotted completed ids ∪ worn slotted id per bay` (preserving `done` order)

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| completed program | done | ordered list | completion order | Researched ids |
| pins | pins | map bay → stock or completed id | Roster-owned; missing = unpinned | STOCK → none; older completed → that project if still done and matching bay |
| worn slotted id | worn | id or none | at most one per bay | stock → none; valid pin → that id; else `currentIssue` |
| applied ids | appliedNodeIds | ordered list | subset of done | What actually applies to one operative at deploy |

**Output Range:** Subset of `done`. Unslotted Ballistics always included when completed. At most one slotted id per bay. Frozen into the Research slice as resolved ids.
**Example:** `done` = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II]. Unpinned → [Advanced Propellants, Neural Accelerator Mk II]. Pin Neural stock → [Advanced Propellants]. Pin Neural to Neural Interface I → [Advanced Propellants, Neural Interface I].

The `currentIssue` formula is defined as:

`currentIssue(done, bay) = last completed slotted project for that bay in done order, else none`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| completed program | done | ordered list | completion order | Researched ids |
| bay | bay | enum | Neural, Chest, Arms, Legs | Home bay |
| current issue | currentIssue | project or none | that bay’s completed set, or none | Latest completion for the bay |

**Output Range:** None, or exactly one completed slotted project for that bay. Unslotted Ballistics has no current issue.
**Example:** `done` = [Neural Interface I, Neural Accelerator Mk II] → Neural Accelerator Mk II. Reverse `done` → Neural Interface I.

The `squadWeapon` formula is defined as:

`squadWeapon(id, applied)[field] = fold matching weapon effects in applied order: field = mul ? field × mul : field + add`; magazine `= round(v)`; start from weapon-table base

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| weapon id | id | enum | assault, smg, pistol, longrifle, shotgun | Weapon being sampled |
| applied nodes | applied | ordered list | from `appliedNodeIds` | What actually applies |
| base field | base | float/int | weapon table | Not Research-owned |
| multiplier | mul | float | §7 percent as `1 ± p/100` | Percent effects |
| add | add | float/int | §7 flat adds | When `mul` is absent |
| field | field | enum | damage, range, cooldown, magazine, reload, spread | Folded stat |

**Output Range:** Not clamped. Magazine integer via round; other fields float. Empty applied → base. Sampled at deploy.
**Example:** Assault base damage 11, Advanced Propellants then Tungsten Sabot: `11 × 1.12 × 1.15`. SMG magazine: `40 + 10 = 50`.

The `crewBonus` formula is defined as:

`crewBonus(applied) = (Σ add_maxHp, Σ add_speed)` over crew effects on applied nodes

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| applied nodes | applied | ordered list | from `appliedNodeIds` | What actually applies |
| max HP add | add_maxHp | int | §7 HP adds | Crew maxHp on a node |
| speed add | add_speed | float | §7 m/s adds | Crew speed on a node |
| crew max HP | maxHp | int | ≥ 0 | Sum |
| crew speed | speed | float | ≥ 0 | Sum |

**Output Range:** Not clamped. Empty → (0, 0). Experience is Roster, not this formula. Sampled at deploy.
**Example:** Pain Inhibitor → maxHp 14, speed 0. Synaptic Enhancement + Neural Cache Array → maxHp 18, speed 0.55.

**Not owned:** `tax_yield` (World Network); `collateral` / `net_payout` (Economy); authored chance / Risk index (Tactical / Brief); mass (Roster); experience +2 HP / +0.05 m/s (Roster).

## Edge Cases

- **If the director never authorizes any project:** `done` stays empty; every bay’s `currentIssue` is none; `appliedNodeIds` is empty; `squadWeapon` is the weapon-table base; `crewBonus` is (0, 0); all labs idle; no program Credits spent.
- **If a bay stays pinned to stock issue while later slotted projects for that bay complete:** that bay wears none; `currentIssue` still advances; unpinned bays wear the new current issue; the program stays researched; no refund; completed unslotted Ballistics still apply.
- **If all four bays on an operative are pinned to stock and Ballistics projects are researched:** `appliedNodeIds` is only those unslotted ids in `done` order.
- **If all three 14h caps are authorized while each lab is idle and each cap’s prerequisites are researched:** all three labs run concurrently; each successful authorize debits that listed cost; each completes independently at its `endT` (`hours 14` → +50400).
- **If `sync(t)` sees `t` equal to a running lab’s `endT`:** that project becomes researched; that lab becomes idle. Completes at equality.
- **If `sync(t)` sees `t` less than a running lab’s `endT`:** the project stays active; `done` unchanged.
- **If a win ETA jump (quiet replay included) advances `t` so multiple labs have `t ≥ endT`:** every such lab completes in that one `sync(t)`. Research does not serialize one-due-at-a-time like World Network catch-up. Labs still short of `endT` stay running.
- **If two labs share the same `endT` and `sync(t)` sees `t ≥` that instant:** both complete independently; both ids enter `done`.
- **If two or more completed slotted projects share a bay:** unpinned wear is `currentIssue` only (last in `done` order). `appliedNodeIds` includes at most one slotted id for that bay unless pinned to another completed same-bay project.
- **If a bay is pinned to an older completed project and a newer same-bay project completes:** the pin still wears the older id; `currentIssue` advances; unpinned bays wear the new current issue; prerequisites do not gate that older wear.
- **If a lab is running and a sibling in that branch already has its prerequisites researched:** the sibling stays `available`; authorize of the sibling is a no-op; Credits unchanged.
- **If a project becomes researched and is the listed prerequisite of another:** the dependent becomes `available` if every listed prerequisite is now researched. It does not auto-start.
- **If a mission is created while labs are still running:** the Research slice freezes completed unslotted ids plus resolved worn slotted ids. Later `sync(t)` does not rewrite that freeze. Completions after the freeze apply on the next deploy. The field does not tick labs and cannot authorize.
- **If `appliedNodeIds` is empty:** `squadWeapon` is the weapon-table base; `crewBonus` is (0, 0). Neither formula clamps.
- **If a pin names stock issue:** worn for that bay is none; `currentIssue` is not applied on that bay.
- **If a pin names an id that is not in `done` or whose home bay is not that bay:** worn falls through to `currentIssue` (none if that bay has no slotted completion).
- **If the mission aborts:** no debrief, no refund, that mission does not jump `t`; already-running labs continue on Screens; `done` unchanged by the abort.
- **If all 21 projects are researched:** every project is `researched` (terminal); all labs idle; further authorize is a no-op; Credits unchanged; `currentIssue` per slotted bay is the last completion for that bay in `done` order.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Strategic `t` | Research `sync(t)`. WN does not own project formulas |
| Hard, upstream | Economy and contracts | Credits authorize | Economy owns refuse/debit. Research owns start, occupancy, graph, effects |
| Hard, downstream | Roster and Assembly | Pins/wear in; current issue / home bay out | Provisional until Roster GDD |
| Hard, downstream | Tactical mission | Research slice at deploy | No live query |
| Soft, downstream | Interface | Presentation | Research screen |
| Hard, downstream | Persistence and validation | Laboratories blob | Strategy autosave; mission excluded. Pins on roster blob |

This GDD lists World Network and Economy as upstream. World Network lists Research as hard downstream (`t`). Economy lists Research as hard downstream (Credits authorize). Bidirectional on those two.

Roster, Tactical, Persistence, and Interface template GDDs are not extracted yet. Reverse mentions wait on those files.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §7 (and `src/game/research.ts` for implementation). This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer.

| Knob | Owner | Too high / too low |
|---|---|---|
| Program total 779,000 CR | §7 | Gap is authored replay vs program unreachable |
| Branch totals 248k / 261k / 270k | §7 | One lab funds the fantasy vs one lab *is* the program |
| Per-project cost | §7 | Opening 128,450 funds a cap vs first node is unaffordable |
| Project hours {2, 4, 8, 14} | §7 | Instant at 2× vs never finishes between contracts |
| Effect magnitudes (muls/adds) | §7 / `research.ts` | Research does not change a later firefight vs one node trivializes |
| Prerequisites | §7 | Isolated shopping list vs unreadable lock tree |
| One active project per lab | §7 rule, not a number | A queue would be craft-UI, not a program |

Opening Credits, generated-market Reward, and Tax bases fund the gap — Economy / World Network knobs, not this table.

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Research requires the Research screen to read as another room of the same terminal: near-black, teal, amber, red; thin technical borders; monospace uppercase. Three laboratories, not a skill tree and not a locker. Authorization is a spend, not a browse. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. Audio follows screen ownership (strategy bed on the four Screens). No second visual language for “the tree.”

## UI Requirements

Research screen: branch inspect; project states locked / available / active / researched; laboratory occupancy; remaining time; home bay on slotted projects. Authorization is one spend; overdraft disable when cost > Credits is Economy. Assembly dossier shows worn/pin bays — Roster / Interface, not this screen inventing a locker. Screens and HUD belong to Interface. This GDD only requires that a spend is distinguishable from a browse, and that current issue vs pin is readable at Assembly (pillar 2: undecorated numbers).

## Acceptance Criteria

- **GIVEN** a new campaign, **WHEN** the Research program is listed, **THEN** there are **3** laboratories, **7** projects each, **21** total.
- **GIVEN** each lab idle and one **available** project per branch, **WHEN** all three are authorized, **THEN** exactly **3** labs run, **1** active each.
- **GIVEN** Credits **15,999 CR**, Ballistics idle, Advanced Propellants **available** at **16,000 CR**, **WHEN** it is authorized, **THEN** Ballistics stays idle and the project stays **available**. Ledger refuse is Economy AC.
- **GIVEN** Credits **16,000 CR**, Ballistics idle, Advanced Propellants **available**, **WHEN** it is authorized, **THEN** it is **active**. Credits **= 0 CR** is Economy AC.
- **GIVEN** Advanced Propellants authorized at **t = 0**, **WHEN** the lab run is read, **THEN** `endT = 7200`.
- **GIVEN** Advanced Propellants authorized at **t = 1000**, **WHEN** the lab run is read, **THEN** `endT = 8200`.
- **GIVEN** a running lab with `endT = 7200`, **WHEN** `sync(t = 7199)` runs, **THEN** the project stays **active**.
- **GIVEN** a running lab with `endT = 7200`, **WHEN** `sync(t = 7200)` runs, **THEN** it is **researched** and that lab is idle.
- **GIVEN** Hypervelocity Core (4h) authorized at **t = 0**, **WHEN** the lab run is read, **THEN** `endT = 14400`.
- **GIVEN** Advanced Propellants **active** at deploy, **WHEN** a **loss** debriefs, **THEN** strategic `t` is unchanged and the project stays **active**.
- **GIVEN** Advanced Propellants **active**, **WHEN** tactical time advances **120 s**, **THEN** `startedT` / `endT` are unchanged and it is not **researched**.
- **GIVEN** Advanced Propellants started at **T0** (`endT = T0 + 7200`) and Glass Veil already won, **WHEN** a quiet-replay **win** spends ETA **2 days**, **THEN** Advanced Propellants is **researched**.
- **GIVEN** Advanced Propellants is not **researched**, **WHEN** states are read, **THEN** Hypervelocity Core is **locked**.
- **GIVEN** Hypervelocity Core **locked** and Ballistics idle, **WHEN** it is authorized, **THEN** Ballistics stays idle and it stays **locked**.
- **GIVEN** Advanced Propellants becomes **researched** (Hypervelocity Core’s only prerequisite), **WHEN** that completion applies, **THEN** Hypervelocity Core is **available** and not **active**.
- **GIVEN** Ballistics running Advanced Propellants and Barrel Wear Coating’s prerequisites met, **WHEN** states are read, **THEN** Barrel Wear Coating stays **available**.
- **GIVEN** Advanced Propellants **active**, **WHEN** any cancel is invoked, **THEN** it stays **active** and is not refunded.
- **GIVEN** Advanced Propellants **researched** and Ballistics idle, **WHEN** it is authorized again, **THEN** it stays **researched** and Ballistics stays idle.
- **GIVEN** §7 cost rows, **WHEN** branch and program costs are summed, **THEN** **248,000 / 261,000 / 270,000 / 779,000 CR**.
- **GIVEN** Advanced Propellants **researched** and two operatives assigned, **WHEN** a mission is created, **THEN** both `appliedNodeIds` include Advanced Propellants.
- **GIVEN** Neural Interface I **researched** and two operatives Neural-unpinned, **WHEN** a mission is created, **THEN** both wear Neural Interface I (same id).
- **GIVEN** Advanced Propellants **researched**, **WHEN** `currentIssue` is read for any bay, **THEN** Advanced Propellants is not returned.
- **GIVEN** an operative, **WHEN** bays are listed, **THEN** they are Neural, Chest, Arms, Legs, at most **1** completed slotted project per bay.
- **GIVEN** Neural Interface I then Neural Accelerator Mk II **researched**, Neural unpinned, **WHEN** `appliedNodeIds` is computed, **THEN** the Neural id is Mk II only.
- **GIVEN** Neural Interface I **researched** and worn by Mara, **WHEN** Mara is KIA at debrief, **THEN** Neural Interface I stays **researched**.
- **GIVEN** Neural pinned to Neural Interface I, **WHEN** Mk II becomes **researched**, **THEN** `currentIssue(Neural)` is Mk II and the pinned bay still wears Neural Interface I.
- **GIVEN** a mission already created, **WHEN** later research completes or a pin changes, **THEN** that mission’s weapons, crew bonuses, and Research slice are unchanged.
- **GIVEN** `appliedNodeIds` = [Advanced Propellants, Tungsten Sabot], **WHEN** `squadWeapon(assault)` is sampled, **THEN** damage **= 11 × 1.12 × 1.15**.
- **GIVEN** Caseless Ammo Feed applied, **WHEN** `squadWeapon(smg)` is sampled, **THEN** magazine **= 50**.
- **GIVEN** `appliedNodeIds` empty, **WHEN** weapons and `crewBonus` are sampled, **THEN** assault damage **11**, SMG magazine **40**, `crewBonus` **(0, 0)**.
- **GIVEN** `appliedNodeIds` = [Pain Inhibitor], **WHEN** `crewBonus` is computed, **THEN** maxHp **14**, speed **0**.
- **GIVEN** `appliedNodeIds` = [Synaptic Enhancement, Neural Cache Array], **WHEN** `crewBonus` is computed, **THEN** maxHp **18**, speed **0.55**.
- **GIVEN** Experience bonuses on a survivor, **WHEN** `crewBonus` is computed from `appliedNodeIds`, **THEN** Experience **+2 HP / +0.05 m/s** are not included.
- **GIVEN** Advanced Propellants **researched**, Neural Interface I worn, Chest **STOCK**, **WHEN** a mission is created, **THEN** the Research slice has unslotted ids + resolved worn slotted ids (Neural Interface I, no Chest id) and **no pin-map field**.
- **GIVEN** a mission created while Neural Interface I is **active**, **WHEN** it later becomes **researched** before that mission ends, **THEN** that freeze still excludes it.
- **GIVEN** a mission in progress and Advanced Propellants **available**, **WHEN** it is authorized, **THEN** Ballistics stays idle and the project stays **available**.
- **GIVEN** Advanced Propellants **researched**, Neural Interface I **active**, **WHEN** Abort is confirmed, **THEN** `done` still has Advanced Propellants only, Neural Interface I stays **active**, no research refund.
- **GIVEN** completed set **S**, **WHEN** chance / Risk / forecast is computed, **THEN** Research exposes **S** and does not return those numbers.
- **GIVEN** Ballistics running Advanced Propellants and Barrel Wear Coating **available**, **WHEN** Barrel Wear Coating is authorized, **THEN** Ballistics still runs only Advanced Propellants, Barrel Wear Coating stays **available**, Credits unchanged.
- **GIVEN** `done` = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II], Neural unpinned, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants, Neural Accelerator Mk II].
- **GIVEN** the same `done` and Neural **STOCK**, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants] only.
- **GIVEN** the same `done` and Neural pinned to Neural Interface I, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants, Neural Interface I].
- **GIVEN** `done` = [Neural Interface I, Neural Accelerator Mk II], **WHEN** `currentIssue(Neural)` is read, **THEN** Neural Accelerator Mk II.
- **GIVEN** `done` = [Neural Accelerator Mk II, Neural Interface I], **WHEN** `currentIssue(Neural)` is read, **THEN** Neural Interface I.
- **GIVEN** empty `done`, **WHEN** `currentIssue` is read for each bay, **THEN** each is none.
- **GIVEN** each lab idle and all three 14h caps **available**, **WHEN** all three are authorized, **THEN** all three run and each `endT = startedT + 50400`.
- **GIVEN** two labs with `endT` **10000** and **11000**, **WHEN** a win ETA jump makes **t = 12000** and one `sync(t)` runs, **THEN** both are **researched**.
- **GIVEN** two labs sharing the same `endT`, **WHEN** `sync(t)` sees `t ≥` that instant, **THEN** both become **researched**.
- **GIVEN** Neural Interface I **researched** and Neural pin names an id not in `done` or wrong bay, **WHEN** worn Neural is resolved, **THEN** it falls through to Neural Interface I.
- **GIVEN** all **21** projects **researched**, **WHEN** any is authorized again, **THEN** every lab stays idle, every project stays **researched**, Credits unchanged.

## Open Questions

- **`done` insertion when two labs complete in one `sync(t)`** — both become researched; stacking order follows `done`. Owner: Research (code today). Resolve when Roster / Tactical extracts need a frozen order. Do not invent a table here.
- **Pin/wear edge** — provisional until Roster GDD. Owner: Roster extract.
- **Which completed nodes enter authored chance** — living spec says “completed research”; mapping is Tactical / Brief. Owner: Tactical extract.
- **Research-screen chrome** (progress, authorize disable, hex labels) — Interface. Owner: Interface extract.
- **Store placement** (`researchStore` vs campaign blob for pins) — implementation; GDD owners stay Research vs Roster. Later ADR if a move is needed.
