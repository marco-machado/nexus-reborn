# Research

> **Status**: Approved (2026-09-22 independent full review: pass 2 NEEDS REVISION → mechanical patch → spot-check exit APPROVED; see review log)
> **Author**: extract from docs/game-design.md §7
> **Last Updated**: 2026-09-22 (second pass: paint-AC arithmetic fix, fundability predicate 15 wins, invariant wording + failsafe, authorize module home, Unsatisfied labels for sort gap and remaining seam, pins-row narrowing, canonical copy substrings; plus first pass: equal-endT pin right closed at §7 source, read primitive + single-writer invariant, oracle seam + lastSyncT, fire-delay alias, copy-contract split, one-click justification, AC rewrites)
> **Implements Pillar**: The two layers feed each other
> **Living spec**: `docs/game-design.md` §7 — this file aliases it; do not fork rules. §7 now defines the equal-`endT` tie itself: house order decides current issue, and the tie non-issue counts as an older completed project, so it is pinnable. Alias that sentence.
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

Research is the house program that changes the next squad: **Credits** authorize a project; **strategic time** finishes it; effects land on the **next** deployment, not on a squad already in the field. Three laboratories — Ballistics, Cybernetics, Control Systems — seven projects each, twenty-one total. One active project per lab. Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted blueprints: a bay wears at most one completed project; every operative may wear the same one ([ADR-0005](../../docs/architecture/adr-0005-blueprint-assignment.md)). Credits debit the moment authorization succeeds; Economy owns the refuse. Laboratories catch up on World Network `t` after a Screen tick or a **win** ETA jump; a loss spends none ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Sampled at deploy. Without this system Credits have nowhere to go that changes a later firefight, and the two-layer loop is only a contract picker plus an invoice.

Rules and numbers stay in `docs/game-design.md` §7. This overview does not fork them.

## Player Fantasy

You authorize the program. You do not kit a hero. Inspect a branch. Commit Credits to one project in that laboratory — one active per lab. Credits debit when authorization succeeds; Economy refuses the overdraft. Then let strategic time run: laboratories catch up on World Network `t` after a Screen tick or a **win** ETA; a loss spends none. Effects sample at the **next** deploy, never on a squad already in the field. Unslotted Ballistics lands squad-wide. Slotted Cybernetics and Control Systems are house blueprints: a bay wears at most one completed project; every operative may wear the same one; unpinned bays follow current issue. When `endT` values differ, that issue is the later-by-time completion in that bay. Among same-bay completions that share an `endT`, house order decides current issue, and the non-issue project of that tie counts as an older completed project — it is pinnable (§7), though it is never older by time. A pin holds stock issue, an earlier-by-time completion, or an equal-`endT` house-order non-issue. Death drops assignment, not the program. Three laboratories, not three games — another room of the same terminal. Research names the home bay; Assembly wears it. Not a locker.

This serves **The two layers feed each other** and **Command, do not micromanage**. It does not own the Credits ledger (Economy) or the five verbs (Tactical). The fantasy fails if authorization is a browse, if effects land in the field, if a finished project does not change a later firefight, or if wear is owned hardware that dies with the body.

## Detailed Design

### Core Rules

1. **Alias.** Cost, time, requires, effect, and home-bay rows stay in `docs/game-design.md` §7. This section names owners, states, and DTO edges. Do not copy the 21-row tables. §7 now defines the equal-`endT` tie itself: house order (ballistics, cybernetics, control) decides current issue, and the tie non-issue counts as an older completed project, so it is pinnable. Alias that sentence; do not fork it. The `done` insertion sort and `BRANCH_IDS` remain this file's rule.

2. **One program.** Three branches, seven projects each, twenty-one total. One laboratory per branch. One active project per lab. Three may run at once only in different branches. Three labs of one OS, not three games. Not a locker.

3. **Authorize.** Listed §7 cost rides the request. Eligibility (available, idle lab, not already researched, not in the field) is Research. Eligibility failure, including in-field, returns before `start()` and before `spendCredits`, even when balance ≥ listed cost, emits no spend, and does not call `start()`. Refuse a non-positive listed cost before `start()` — Research's refuse gates the command; Economy's zero/negative ignore is unreachable defense behind it, and the refuse needs no cause text because the §7 catalog is all-positive. Required sequence ([ADR-0013](../../docs/architecture/adr-0013-credits-never-overdraw.md)): re-read Credits; if listed cost > Credits, return without calling `start()`; else call `start(node, t)` once. Call `spendCredits(listed cost)` only if that `start()` returns true, and call it once. If `start()` returns false, do not call `spendCredits`; Credits are unchanged. **Unsatisfied:** the current implementation performs pre-check, `start()`, `spendCredits` only — no post-spend re-read, undo, or sentence. Closing that gap is a separate target, like the other Unsatisfied rows. Every Credits read in this sequence is a `getState()` read on the app store at command time; a selector or render-snapshot value is not a read. The sequence is sound only under the single-writer invariant: the authorize command is synchronous and is the only writer, other than its own `spendCredits` call, between its pre-spend and post-spend reads; if the command ever awaits, this protocol is void and must be redesigned before use. After a `start()` that returns true, every return path ends in exactly one of two states: a verified landed debit, or the undo below; a return between a true `start()` and a called `spendCredits` is forbidden. In the same command, re-read Credits after a `spendCredits` that was called. The debit landed only if that read equals the pre-spend read minus the listed cost. Otherwise the undo restores the research store to its pre-`start()` occupancy state: lab idle, project available, no residue — before return. Behavior is unspecified if the single-writer invariant is broken (a wrong-size debit is out of contract; the undo is forbidden from repairing the ledger). That undo is internal to authorize, not a Cancel API, and must not call `addCredits`. It must not `setState({ credits })`. Do not invent a Credits restore. On a landed debit, do not call `addCredits` and do not call `spendCredits` again; the post-command read equals the pre-spend read minus the listed cost. A mismatch undo shows visible text: Credits did not change, and the lab was not occupied. No reason enum. Visible even if Authorize is disabled. That sentence is in this file. It is not an `interface.md` edit. Do not invert to spend-then-start (charges a refused lab). The production authorize command lives in the research store module (`src/state/researchStore.ts`) as a store action; the screen calls it and does not inline the sequence. `researchStore` has no Credits field. Interface may disable authorize when short; that chrome is not this check. Overdraft refuse, exact-balance, zero/negative ignore, and the ledger live in Economy / ADR-0013. Abort, cancel, loss, death, and completion do not call `addCredits`. Do not invent a completion payout.

4. **Strategic `t`.** World Network owns the clock. Research `sync(t)` after a Screen tick or a **win** ETA jump (quiet replay included). A **loss** spends none ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Mission does not tick laboratories. Research does not own Pause or speed. When one `sync(t)` completes two or more labs, append those ids to `done` in ascending `endT`. **Unsatisfied in code:** the current `sync` appends multi-completions in `BRANCH_IDS` order regardless of `endT`, which fails the differing-`endT` ACs below until fixed. Ids that share an `endT` break that tie in `BRANCH_IDS` order: ballistics, then cybernetics, then control. That tie-break is house order, not authorize order, and not later-by-time. Do not reverse the sort. When `endT` values differ, `currentIssue` is the later-by-time same-bay id — the last same-bay id in that ascending-`endT` `done`. That one is latest. An equal `endT` is not latest. House order decides current issue only among same-bay completions that share an `endT`. A project on another bay is not displaced and is not the pin. On a Neural tie, Control issues by house order. Do not call that result latest. Do not call the Cybernetics project older by time. The tie non-issue is pinnable: §7 counts an equal-`endT` house-order non-issue as an older completed project. Do not call Neural Interface I older by time. Not a §7 table. Do not add current-issue controls to the Research screen. Naming which blueprint became current issue is an unsatisfied downstream obligation (UI Requirements). This file does not claim Assembly already names that winner.

5. **Project states.** locked / available / active / researched (living spec §12). Prerequisites gate research, not wear. Lab-busy does **not** retag a sibling `available`. No fifth state. No cancel. Researched is terminal.

6. **Program cost.** **779,000 CR**. Branches: Ballistics **248,000** / Cybernetics **261,000** / Control Systems **270,000**. Per-project rows stay in §7.

7. **Unslotted / slotted** ([ADR-0005](../../docs/architecture/adr-0005-blueprint-assignment.md)). Ballistics is unslotted and squad-wide. Cybernetics and Control Systems are slotted blueprints: every operative may wear the same completed project. Research names the home bay; Assembly wears it.

8. **Bays.** Neural, Chest, Arms, Legs. A bay wears at most one completed slotted project that belongs to it. Wear applies all of that project’s effects to that operative only. Unpinned bays, including new hires, wear **current issue**. A pin holds stock issue, an earlier-by-time completed project, or an equal-`endT` house-order non-issue — §7 counts the non-issue of that tie as an older completed project, so it is pinnable, though it is never older by time. A new completion updates unpinned bays only. Death drops that operative’s assignment, not the program. Assembly owns pin/wear; Research owns home bay and current-issue identity. Do not add current-issue controls to the Research screen.

9. **Sample.** Unslotted apply to the whole squad. Slotted apply only to who wears them. Effects stack in completion order among what actually applies. Sampled when the mission is created. Cannot change a squad already on the ground. Experience is Roster, not Research.

10. **Deploy cut.** One partitioned snapshot; no live store handles ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md), [ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md)). **Research slice:** completed **unslotted** set only (Ballistics, `done` order). Pins and **resolved wear** are Roster-owned and are not fields of this slice. The composer runs `appliedNodeIds` at freeze and stores ordered `appliedIds` on the Roster slice. Do not extend the World Network snapshot schema. Tactical applies the freeze. Abort = no debrief = program unchanged (that mission does not jump `t`). Completions after this freeze apply to the **next** deploy.

11. **Chance.** Authored chance uses completed research — the full completed program count, not the worn set (`missionChance` oracle: `src/game/missionParams.ts`). A squad wearing stock in every bay still gains chance when the lab completes; Brief labels it as program completion, not worn gear. Tactical / Brief owns the math. Research only exposes the completed set. Research does not compute chance, Risk index, or Event forecast.

12. **Forbidden.** Locker; unique implants; more than one active project per lab; mid-mission re-sample; labs ticking in the field; second clock; a Credits field on Research; spend-then-start; occupying a lab when the debit does not land; appending a multi-complete batch in `BRANCH_IDS` order when `endT` values differ; calling an equal-`endT` house-order result latest or older-by-time; forking §7's equal-`endT` pin rule; publishing remaining **0**, including a formula result of **0** when `t ≥ endT`; the screen painting remaining before `sync(t)` for that same `t`; the screen painting **0**; aliasing §7 latest or older-by-time onto an equal `endT` (§7’s “counts as an older completed project” pin fiction is the sanctioned exception); `spendCredits` when `start()` returns false; a second `spendCredits` after a landed debit; `setState({ credits })` except Economy hydrate; completion `addCredits` or a completion payout; a cancel, stop, or abort-project export, including one that returns a refusal; claiming Assembly already names current issue as a second label; Experience as Research; chance/Risk/forecast math; prerequisites gating wear; death destroying the program; new completion updating pinned bays; copying the §7 tables; a Research-owned 0–1 progress fraction. Overdraw and refund-on-abort are Economy / ADR-0013, not a second Research ledger.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Project | locked / available / active / researched | locked → available when every listed prerequisite is researched. available → active when authorize succeeds. active → researched when `sync(t)` sees completion. researched is terminal. No reverse. |
| Laboratory | idle / running one project | idle → running on successful authorize. Occupied lab: further authorize is a no-op (Credits unchanged). running → idle when that project is researched. Frozen in the field. |
| Current issue (per slotted bay) | none / later-by-time completion, or house-order issue on an equal `endT` | Advances when a slotted project for that bay becomes researched. When `endT` values differ, latest is the later-by-time same-bay id (last after ascending-`endT` insertion). An equal `endT` uses `BRANCH_IDS` house order only among same-bay completions. A project on another bay is not displaced and is not the pin. That tie is not latest and not older-by-time. §7 counts the tie non-issue as an older completed project, so it is pinnable. Unslotted Ballistics has no current issue. New completion updates unpinned bays only. |
| Pin vs unpinned | Unpinned / Pinned to stock / Pinned to an earlier-by-time completion or an equal-`endT` house-order non-issue | Roster-owned. Research names the edge only. §7 counts the equal-`endT` tie non-issue as an older completed project, so it is pinnable; it is never older by time. |
| Authorization | Occupancy ok / no-op | Eligibility failure (busy lab, missing prereqs, already researched, or in the field) or a non-positive listed cost → return before `start()` and before `spendCredits`; `start()` is not called; no spend emitted, even when balance ≥ cost. Listed cost > Credits → return without calling `start()`. Call `spendCredits` only if `start()` returns true, and call it once. If `start()` returns false, do not call `spendCredits`; Credits are unchanged. After a called `spendCredits`, re-read Credits in the same command — every read is a `getState()` read on the app store at command time, under the single-writer invariant (Core Rule 3). The debit landed only if that read equals the pre-spend read minus the listed cost. Otherwise the undo restores the pre-`start()` occupancy state (lab idle, project available, no residue) before return; a return between a true `start()` and a called `spendCredits` is forbidden. That undo is internal to authorize, must not call `addCredits`, must not `setState({ credits })`, and is not a Cancel API. On a landed debit, do not call `addCredits` and do not call `spendCredits` again. A mismatch undo shows visible text: Credits did not change, and the lab was not occupied. The sequence is Unsatisfied in code (Core Rule 3). Economy Affordable/Refused is the ledger ([ADR-0013](../../docs/architecture/adr-0013-credits-never-overdraw.md)). |
| Deploy sample | Strategy live / Frozen at mission create | Research slice frozen at create. Later `sync(t)` does not rewrite this freeze. |
| Mission coupling | Strategy / Deployed / Debrief catch-up / Abort discarded | Field does not tick labs. Win (including quiet): ETA then `sync(t)`. Loss: no ETA. Abort: no research write, no refund; labs already running continue on Screens. |

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | Strategic `t` after Screen tick or **win** ETA | — | WN owns clocks and ETA. Research `sync(t)`. |
| **Economy** | Refuse or debit of listed cost | Occupancy `start()`, then listed cost | Economy owns Credits / `spendCredits`. Research `start` is occupancy only; no Credits field ([ADR-0013](../../docs/architecture/adr-0013-credits-never-overdraw.md)). |
| **Roster / Assembly** | Pins; hire; death drops assignment | Current issue; completed program; home bay | Roster owns bodies/pins/wear and the deploy freeze of resolved wear + `appliedIds` ([ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md)). §7 counts an equal-`endT` house-order non-issue as an older completed project, so it is pinnable — alias that; do not fork. Unsatisfied downstream obligation: living spec §7 shows worn project or stock issue, plus whether the bay is pinned — not a second current-issue name. This file does not claim that naming is already delivered. Closing it in `roster-and-assembly.md` is a separate target. |
| **Tactical** | — | **Research slice** at deploy (unslotted ids only) | Neither live-queries the other. Wear / `appliedIds` ride the Roster slice. |
| **Interface** | Authorize (a spend) | States, occupancy, remaining strategic time, home bay | Presentation only. `progress` is not a Research output. Resolved 2026-09-22: the Interface `progress` rows were struck. Do not add a 0–1 fraction. |
| **Persistence** | — | Laboratories (`done` + lab runs) | Strategy autosave includes laboratories; mission excluded. Pins on the roster blob. |

Roster, Tactical, Persistence, and Interface GDDs exist (`roster-and-assembly.md`, `tactical-mission.md`, `persistence-and-validation.md`, `interface.md`). Pin/wear and `appliedIds` freeze: Roster GDD + [ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md). Edges vs those files + living spec + World Network / Economy GDDs.

## Formulas

Do not fork. Canonical project rows: `docs/game-design.md` §7. §7 percents alias to multipliers (`+12%` → `1.12`; `−10%` → `0.9`). §7 “fire delay” is the `cooldown` field of the fold below. §7 same-field effects are homogeneous — all multipliers or all adds for any one field — so the fold’s applied order is deterministic; the fold is not commutative if that §7 invariant ever breaks. Weapon-table bases are not Research-owned. `program_cost = 248,000 + 261,000 + 270,000 = 779,000 CR` is a checksum constant, not a curve.

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

The `remaining` readout is defined as:

`remaining = none` when the project is not active or when `t ≥ endT`; otherwise `endT − t`

No clamp. Do not use `max(0, endT − t)`.

**Seam:** the oracle is an exported pure `remaining(run, t)` in the game layer (`src/game/research.ts`, beside `squadWeapon` / `crewBonus`); it is not a component render. `sync(t)` stamps `lastSyncT` on the store. The screen paints remaining only when `lastSyncT === t`. Hydration from a save counts as `sync` at the loaded `t`; initialization from a new campaign is not hydration — the screen waits for the first sync. **Unsatisfied in code:** neither `remaining` nor `lastSyncT` exists yet; the current screen inlines `endT − t` and clamps at zero. **Variables:** `endT` and `t` as above. Not a 0–1 fraction. Not catalog hours.
**Output Range:** Strategic seconds strictly greater than 0, or none. Never **0**. `none` deliberately collapses three cases — not active, researched, and active-but-past-`endT`-before-sync; callers do not distinguish them. A formula-oracle query is allowed before `sync(t)` and is not a screen paint. At `t = 7200` and `t = 7201` before `sync`, with the project still active and `endT = 7200`, that query returns none, not **0**. The Research screen paints remaining only after `sync(t)` for that same `t`, verified by the `lastSyncT` stamp. When `t < endT` that paint is `endT − t`, rounded **up** to whole display seconds; a positive remainder never paints as **0** — that is a display rule, not a formula clamp. The screen does not paint remaining before that `sync`. Same `t` as the header clock, in the same frame. After `sync` applies completion, the project is researched and remaining is none.
**Example:** Active, `endT = 7200`, `t = 1000`, formula query after `sync(1000)` → **6200**. Active, `endT = 7200`, formula-oracle query at `t = 7200` before `sync(7200)` → none, not **0**. This query is allowed and is not a screen paint. Active, `endT = 7200`, formula-oracle query at `t = 7201` before `sync(7201)` → none, not **0**. Not a screen paint. Researched → none.

The `appliedNodeIds` formula is defined as:

`appliedNodeIds = unslotted completed ids ∪ worn slotted id per bay` (preserving `done` order)

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| completed program | done | ordered list | completion order | Researched ids |
| pins | pins | map bay → stock or completed id | Roster-owned; missing = unpinned | STOCK → none; a §7-legal pin (earlier-by-time completion or equal-`endT` tie non-issue, still in `done` and matching bay) → that id; any other value, including current issue or a tie winner, falls through to `currentIssue` |
| worn slotted id | worn | id or none | at most one per bay | stock → none; valid pin → that id; else `currentIssue` |
| applied ids | appliedNodeIds | ordered list | subset of done | What actually applies to one operative at deploy |

**Output Range:** Subset of `done`. Unslotted Ballistics always included when completed. At most one slotted id per bay. Computed at freeze by the composer; frozen onto the **Roster** slice as `appliedIds` ([ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md)). Not a Research-slice field.
**Example:** `done` = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II]. Unpinned → [Advanced Propellants, Neural Accelerator Mk II]. Pin Neural stock → [Advanced Propellants]. Pin Neural to Neural Interface I → [Advanced Propellants, Neural Interface I].

The `currentIssue` formula is defined as:

`currentIssue(done, bay) = last completed slotted project for that bay in done order, else none`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| completed program | done | ordered list | completion order | Researched ids |
| bay | bay | enum | Neural, Chest, Arms, Legs | Home bay |
| current issue | currentIssue | project or none | that bay’s completed set, or none | Last same-bay id in `done`. When `endT` values differ, that last id is latest (later by time). An equal-`endT` last id is `BRANCH_IDS` house order, not latest and not older-by-time. `done` appends by ascending `endT`; equal `endT` uses `BRANCH_IDS` |

**Output Range:** None, or exactly one completed slotted project for that bay. Unslotted Ballistics has no current issue. An equal-`endT` result is house order, not latest.
**Example:** `done` = [Neural Interface I, Neural Accelerator Mk II] with a later Mk II `endT` → Neural Accelerator Mk II, latest by time. Equal-`endT` `done` = [Neural Interface I, Sensor Fusion Array] → Sensor Fusion Array by house order, same bay only. Do not call Neural Interface I older by time; it is pinnable as the tie non-issue (§7).

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

**Output Range:** Not clamped. Magazine integer via `round` — half-up toward +∞ (`Math.round`); other fields float. Empty applied → base. Sampled at deploy. Tactical `hit_chance` still requires r > 0; a folded range ≤ 0 is not a valid shot. Do not invent a floor here.
**Example:** Advanced Propellants then Tungsten Sabot on assault damage: weapon-table base × `1.12` × `1.15`. Caseless Ammo Feed on SMG magazine: `round(smg weapon-table magazine + 10)`. Read those bases from the weapon-table owner at sample time. Do not paste them.

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

**Output Range:** Not clamped. Empty → (0, 0). The ≥ 0 ranges describe authored §7 values — crew adds are positive by design — not a clamp. Experience is Roster, not this formula. Sampled at deploy. Unclamped crew adds stack with Roster Experience; do not invent a cap here.
**Example:** Pain Inhibitor → maxHp 14, speed 0. Synaptic Enhancement + Neural Cache Array → maxHp 18, speed 0.55.

**Not owned:** `tax_yield` (World Network); `collateral` / `net_payout` (Economy); authored chance / Risk index (Tactical / Brief); mass (Roster); experience +2 HP / +0.05 m/s (Roster).

## Edge Cases

- **If the director never authorizes any project:** `done` stays empty; every bay’s `currentIssue` is none; `appliedNodeIds` is empty; `squadWeapon` is the weapon-table base; `crewBonus` is (0, 0); all labs idle; no program Credits spent.
- **If a bay stays pinned to stock issue while later slotted projects for that bay complete:** that bay wears none; `currentIssue` still advances; unpinned bays wear the new current issue; the program stays researched; no refund; completed unslotted Ballistics still apply.
- **If all four bays on an operative are pinned to stock and Ballistics projects are researched:** `appliedNodeIds` is only those unslotted ids in `done` order.
- **If all three 14h caps are authorized while each lab is idle and each cap’s prerequisites are researched:** all three labs run concurrently; each successful authorize debits that listed cost; each completes independently at its `endT` (`hours 14` → +50400).
- **If `sync(t)` sees `t` equal to a running lab’s `endT`:** that project becomes researched; that lab becomes idle. Completes at equality. Remaining for that project is none, not **0**, including a formula-oracle query at that `t` before this `sync`. That query is allowed and is not a screen paint.
- **If `sync(t)` sees `t` less than a running lab’s `endT`:** the project stays active; `done` unchanged. Remaining, painted after `sync(t)` for that same `t`, is `endT − t`. Not clamped. Not **0**. The screen does not paint remaining before that `sync`. A formula-oracle query before that `sync` is allowed and is not a screen paint.
- **If a win ETA jump (quiet replay included) advances `t` so multiple labs have `t ≥ endT`:** every such lab completes in that one `sync(t)`. Ids append in ascending `endT`. Equal `endT` values break the tie in `BRANCH_IDS` house order (ballistics, cybernetics, control), not later-by-time. Research does not serialize one-due-at-a-time like World Network catch-up. Labs still short of `endT` stay running. A later Cybernetics `endT` becomes current issue over an earlier Control `endT` on the same bay. That later timer is latest. Do not author seconds per ETA day. Do not arrange that jump in an acceptance criterion.
- **If two labs share the same `endT` and `sync(t)` sees `t ≥` that instant:** both complete; both ids enter `done` in `BRANCH_IDS` order, not by which lab was authorized first. The later `BRANCH_IDS` lab may be the one authorized first; append order does not follow that command. Do not reverse the sort. House order applies only among same-bay completions. Same-tick Neural: Neural Interface I (cybernetics) then Sensor Fusion Array (control) → `currentIssue(Neural)` is Sensor Fusion Array by house order. Targeting AI Suite does not share that bay, so it does not displace Neural Interface I and is not the pin. Do not call Neural Interface I older by time; it is pinnable as the tie non-issue (§7). Neural Cache Array then Adaptive Command AI → Adaptive Command AI by house order, not because Control is later by time.
- **If two or more completed slotted projects share a bay:** unpinned wear is `currentIssue` only (last in `done` order). `appliedNodeIds` includes at most one slotted id for that bay unless pinned to another completed same-bay project. On an equal `endT`, house order decides current issue only among same-bay completions. Do not call the non-issue older by time; §7 counts it as an older completed project, so it is pinnable.
- **If a bay is pinned to an earlier-by-time completed project or an equal-`endT` house-order non-issue, and another same-bay project completes:** the pin still wears the pinned id; `currentIssue` advances; unpinned bays wear the new current issue; prerequisites do not gate that wear.
- **If a lab is running and a sibling in that branch already has its prerequisites researched:** the sibling stays `available`; authorize of the sibling returns before `start()` and before `spendCredits`; `start()` is not called; Credits unchanged.
- **If a project becomes researched and is the listed prerequisite of another:** the dependent becomes `available` if every listed prerequisite is now researched. It does not auto-start. Completion does not call `addCredits`. Do not invent a completion payout.
- **If a mission is created while labs are still running:** the Research slice freezes completed unslotted ids only. Resolved wear and ordered `appliedIds` freeze on the Roster slice. Later `sync(t)` does not rewrite that freeze. Completions after the freeze apply on the next deploy. The field does not tick labs and cannot authorize. An in-field authorize returns before `start()` and before `spendCredits`.
- **If `appliedNodeIds` is empty:** `squadWeapon` is the weapon-table base; `crewBonus` is (0, 0). Neither formula clamps.
- **If a pin names stock issue:** worn for that bay is none; `currentIssue` is not applied on that bay.
- **If a pin names an id that is not in `done`, whose home bay is not that bay, or that §7 does not allow (current issue or a tie winner):** worn falls through to `currentIssue` (none if that bay has no slotted completion). Roster must not persist such a pin; the fall-through is load defense.
- **If the mission aborts:** no debrief, no refund, that mission does not jump `t`; already-running labs continue on Screens; `done` unchanged by the abort. Abort does not call `addCredits`.
- **If all 21 projects are researched:** every project is `researched` (terminal); all labs idle; further authorize returns before `start()` and before `spendCredits`; Credits unchanged; `currentIssue` per slotted bay is the last completion for that bay in `done` order. When those completions shared an `endT`, that last id is house order, not latest.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Strategic `t` | Research `sync(t)`. WN does not own project formulas |
| Hard, upstream | Economy and contracts | Credits authorize | Economy owns refuse/debit. Research owns start, occupancy, graph, effects |
| Hard, downstream | Roster and Assembly | Pins/wear in; current issue / home bay out | Roster freeze owns resolved wear + `appliedIds` ([ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md)). Current-issue naming on the dossier is an unsatisfied obligation, not a delivered Assembly claim |
| Hard, downstream | Tactical mission | Research slice at deploy (unslotted only) | No live query |
| Hard, downstream | Interface | Presentation | Research screen. States, occupancy, remaining, home bay. Not `progress` |
| Hard, downstream | Persistence and validation | Laboratories blob | Strategy autosave; mission excluded. Pins on roster blob |

This GDD lists World Network and Economy as upstream. World Network lists Research as hard downstream (`t`). Economy lists Research as hard downstream (Credits authorize). Roster, Tactical, and Persistence list Research. Bidirectional on those five. The Interface edge is not bidirectional for `progress`: this file forbids a Research-owned 0–1 progress fraction and does not output `progress`. Resolved 2026-09-22: the Interface rows no longer list `progress`. Do not add a 0–1 fraction here.

Roster GDD: `design/gdd/roster-and-assembly.md`. Tactical: `design/gdd/tactical-mission.md`. Persistence: `design/gdd/persistence-and-validation.md`. Interface: `design/gdd/interface.md`.

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

Research screen: branch inspect; project states locked / available / active / researched; laboratory occupancy; remaining time; home bay on slotted projects; each project’s listed §7 cost against the header Credits. Authorization is one spend. Interface may disable when cost > Credits ([ADR-0013](../../docs/architecture/adr-0013-credits-never-overdraw.md)); that disable is not the Research guard. Unaffordable reason stays Interface AC8. When a project is both unaffordable and ineligible, the affordability disable wins the control and the composed eligibility text (if any) still displays beneath it. The Research screen is unreachable during Mission (session phases route Mission → Debrief); the in-field exclusion in Core Rule 3 is store-level defense, not screen copy. Screens and HUD belong to Interface.

A formula-oracle query of remaining is allowed before `sync(t)` and is not a screen paint; the oracle is the exported pure `remaining(run, t)` in `src/game/research.ts` (Formulas). The Research screen paints remaining only after `sync(t)` for that same `t`, gated on the store’s `lastSyncT === t`. For an active project with `t < endT`, that paint is `endT − t` strategic seconds rounded up to whole display seconds, the same `t` as the header clock in the same frame, labeled remaining and not the §7 duration. No clamp; a positive remainder never paints **0** — the ceil is a display rule, not a formula clamp. The screen does not paint remaining before that `sync`. When the project is not active, or when `t ≥ endT`, the formula returns none, including a formula-oracle query before `sync` at `t = endT` and `t > endT`. Non-active projects show no countdown. `progress` is not a Research output. A 0–1 fraction is banned as Research-owned data or API — the store module’s `runProgress` is a violation to remove. A presentation-derived fill computed at render time from `remaining` is allowed; it must not be stored on or exported by Research. Paint format (raw seconds vs H:MM:SS) is an Interface decision; flag the 50,400-second magnitude so it is not left to code. Resolved 2026-09-22: `design/gdd/interface.md` no longer lists `progress` on either Research row.

Every authorize the director can attempt on this screen either spends or shows visible text for the actual cause — for every reachable attempt; the `start()`-false path is an invariant-violation detector under Core Rule 3, not a player-reachable outcome. Canonical assertable substrings for the ACs: “Credits did not change”, “the lab was not occupied”, “lab not idle”, “already researched”. The copy contract has three distinct surfaces. **Inspect** of a non-authorizable node shows a state explanation only — locked with every unmet prerequisite named, lab not idle, or already researched — and never implies a charge was attempted. **Authorize attempt** of an ineligible project shows that same cause text plus a credits-unchanged sentence, since a spend was attempted and refused. **Mismatch undo** is an error-state surface: an inline message in the project detail panel that says Credits did not change and the lab was not occupied, replaces the composed state text, persists until the next authorize attempt or state change, and is visible even if Authorize is disabled. No reason enum. These sentences are satisfied in this file; they do not require an `interface.md` edit. In-field is not a reason on this screen. Eligibility causes display in eligibility order: missing prerequisites, then lab not idle, then already researched; the §7 catalog bounds each text at two prerequisites.

Screen action set: project-node inspect plus one Authorize on the inspected project. No Cancel, Stop, or Abort-project control. No second confirm — deliberately. A single activation is the weight-of-command affordance the pillars price: the director sees the listed §7 cost against header Credits at the moment of the click, the consequence is bounded (a spent budget and a busy lab — recoverable by play, never by undo), and there is no destructive discard to guard against; Mission Abort is a different action on a different screen and keeps its two-step. One confirm would make the program a browse, which the Player Fantasy section forbids. Mission Abort is not this control. Research exports no cancel, stop, or abort-project method. Do not add a method that returns a refusal. No-cancel is not a defect.

Do not add current-issue or pin controls here. §7 now counts an equal-`endT` house-order non-issue as an older completed project, so the pin right is closed at the source — alias it; do not fork. `roster-and-assembly.md` needs no edit to stay consistent: its “older completed project” pin wording reads through §7. Unsatisfied downstream obligations, required before UI implementation: (1) the assembly dossier names current issue beyond worn-or-stock plus a pin flag — `roster-and-assembly.md` and `interface.md` were not edited to deliver that second name, including when `BRANCH_IDS` house order decided an equal-`endT` tie; (2) a research-completion surfacing beat (World Network Feed line or Screen banner) — no artifact announces a completion today, and Research is the Hook beat of the session arc. House order decides current issue only among same-bay completions that share an `endT`. A project on another bay is not displaced and is not the pin. Closing either obligation is a separate target. Not a locker.

## Acceptance Criteria

- **GIVEN** a new campaign, **WHEN** the Research program is listed, **THEN** there are **3** laboratories, **7** projects each, **21** total.
- **GIVEN** each lab idle and one **available** project per branch, **WHEN** all three are authorized, **THEN** exactly **3** labs run, **1** active each.
- **GIVEN** the production authorize command is invoked for **available** Advanced Propellants on an idle Ballistics lab while Economy will refuse the **16,000 CR** spend, **WHEN** that command returns, ignoring any disabled control, **THEN** `start()` is not called, Ballistics stays idle, and the project stays **available**.
- **GIVEN** Advanced Propellants **available**, Ballistics idle, listed cost **16,000 CR**, pre-spend Credits **C ≥ 16,000**, `start()` returns true, and `spendCredits` leaves the post-spend Credits read equal to **C**, which is unequal to **C − 16,000**, **WHEN** the production authorize command returns, **THEN** `start()` was called before that return, `spendCredits` was called once, Credits are re-read in that same command after `spendCredits`, the lab is idle, the project is **available**, Credits still equal **C**, and `addCredits` was not called. `setState({ credits })` was not called. An early return that never called `start()` is not a pass. The undo is internal to authorize, not a Cancel API. The visible sentence says Credits did not change and the lab was not occupied. No reason enum. That sentence is visible even if Authorize is disabled. It does not require an `interface.md` edit.
- **GIVEN** Advanced Propellants **available**, Ballistics idle, listed cost **16,000 CR**, and Credits at least that cost, **WHEN** the production authorize command calls `start()` and that call returns false, **THEN** `spendCredits` is not called, Credits are unchanged, the lab stays idle, and the project stays **available**.
- **GIVEN** Advanced Propellants **available**, Ballistics idle, listed cost **16,000 CR**, pre-spend Credits **C ≥ 16,000** (both the exact-balance and the surplus boundary), and `start()` returns true, **WHEN** the production authorize command returns, **THEN** `start()` was called once, `spendCredits(16000)` was called once, `addCredits` was not called, a second `spendCredits` was not called, the project is **active**, the lab is running, and the post-command Credits read equals **C − 16,000**.
- **GIVEN** Advanced Propellants **available**, Ballistics idle, and a non-positive listed cost, **WHEN** the production authorize command is invoked, **THEN** it returns before `start()`, `start()` is not called, Ballistics stays idle, the project stays **available**, Credits are unchanged, and `addCredits` was not called.
- **GIVEN** Advanced Propellants authorized at **t = 0**, **WHEN** the lab run is read, **THEN** `endT = 7200`.
- **GIVEN** Advanced Propellants authorized at **t = 1000**, **WHEN** the lab run is read, **THEN** `endT = 8200`.
- **GIVEN** a running lab with `endT = 7200`, **WHEN** `sync(t = 7199)` runs, **THEN** the project stays **active**.
- **GIVEN** a running lab with `endT = 7200`, **WHEN** `sync(t = 7200)` runs, **THEN** it is **researched** and that lab is idle. Completion does not call `addCredits`. Credits are unchanged by that completion. No completion payout is defined.
- **GIVEN** a running lab with `endT = 7200` and strategic `t = 1000`, **WHEN** remaining time is read after `sync(1000)`, **THEN** it is **6200** strategic seconds, labeled remaining, not the catalog duration. **GIVEN** that project is **researched**, **WHEN** remaining time is read, **THEN** there is no countdown.
- **GIVEN** a project still **active** with `endT = 7200`, **WHEN** the remaining function is queried at `t = 7200` and at any `t > 7200` before the matching `sync`, **THEN** it returns none, not **0**. This query is allowed and is not a screen paint.
- **GIVEN** the Research screen is rendered with an active 2h project (`startedT = 0`, `endT = 7200`) at `t = 7199` before any `sync` call (`lastSyncT` unset or older), **WHEN** the DOM is queried by the remaining label’s test selector, **THEN** no remaining label exists; **WHEN** `sync(7199)` runs and the DOM is re-queried, **THEN** the remaining label reads **1** (`endT − t`, rounded up to whole display seconds — the near-`endT` case that a floor or round would paint as **0**) and `lastSyncT === 7199`. Paint format (raw seconds vs H:MM:SS) is an Interface decision; the assertion targets the label’s numeric value under that stated format. This does not forbid the formula-oracle queries above.
- **GIVEN** Hypervelocity Core (4h) authorized at **t = 0**, **WHEN** the lab run is read, **THEN** `endT = 14400`.
- **GIVEN** Advanced Propellants **active** at deploy, **WHEN** a **loss** debriefs, **THEN** strategic `t` is unchanged and the project stays **active**. Loss does not call `addCredits`.
- **GIVEN** Advanced Propellants **active**, **WHEN** tactical time advances **120 s**, **THEN** `startedT` / `endT` are unchanged and it is not **researched**.
- **GIVEN** Advanced Propellants started at **T0** (`endT = T0 + 7200`), **WHEN** strategic `t` advances by at least **7200** and Research `sync` runs at that `t`, **THEN** Advanced Propellants is **researched**. A quiet-replay win may cause that advance. Strategic seconds per ETA day are not defined in this file, in `world-network.md`, or in living spec §9.
- **GIVEN** Advanced Propellants is not **researched**, **WHEN** states are read, **THEN** Hypervelocity Core is **locked**.
- **GIVEN** Hypervelocity Core **locked** and Ballistics idle, **WHEN** it is authorized, **THEN** eligibility returns before `start()` and before `spendCredits` even if balance ≥ listed cost, `start()` is not called, Ballistics stays idle, it stays **locked**, Research emits no spend, Credits are unchanged, and the refusal text contains the catalog title, the string **Advanced Propellants** (the unmet prerequisite), and a credits-unchanged phrase. **WHEN** it is inspected, **THEN** the detail text names the locked state and the unmet prerequisite, and does not imply a charge was attempted. No reason enum.
- **GIVEN** Ballistics running Advanced Propellants, and Tungsten Sabot **locked** with Rail Stabilization and Smart Fragmentation both unmet, **WHEN** Tungsten Sabot is authorized, **THEN** eligibility returns before `start()` and before `spendCredits`, Credits are unchanged, and the refusal text contains the catalog title, the strings **Rail Stabilization** and **Smart Fragmentation** at text indices before the lab-not-idle phrase, and a credits-unchanged phrase. No reason enum. This sentence does not require an `interface.md` edit.
- **GIVEN** Advanced Propellants becomes **researched** (Hypervelocity Core’s only prerequisite), **WHEN** that completion applies, **THEN** Hypervelocity Core is **available** and not **active**. Completion does not call `addCredits`.
- **GIVEN** Ballistics running Advanced Propellants and Barrel Wear Coating’s prerequisites met, **WHEN** states are read, **THEN** Barrel Wear Coating stays **available**.
- **GIVEN** the Research screen, **WHEN** its actions are enumerated, **THEN** the action set is project-node inspect plus one Authorize on the inspected project. There is no Cancel, Stop, or Abort-project control, and Authorize has no second confirm. Mission Abort is not this control.
- **GIVEN** Research’s public API, **WHEN** its exports are enumerated, **THEN** there is no cancel, stop, or abort-project export. Do not add a method that returns a refusal.
- **GIVEN** Advanced Propellants **researched** and Ballistics idle, **WHEN** it is authorized, **THEN** eligibility returns before `start()` and before `spendCredits`, `start()` is not called, it stays **researched**, Ballistics stays idle, Research emits no spend, Credits are unchanged, and the refusal text contains an already-researched phrase and a credits-unchanged phrase. **WHEN** it is inspected, **THEN** the detail text says the project is already researched and does not imply a charge was attempted. No reason enum.
- **GIVEN** §7 cost rows, **WHEN** branch and program costs are summed, **THEN** **248,000 / 261,000 / 270,000 / 779,000 CR**.
- **GIVEN** Advanced Propellants **researched** and two operatives assigned, **WHEN** a mission is created, **THEN** both `appliedNodeIds` include Advanced Propellants.
- **GIVEN** Neural Interface I **researched** and two operatives Neural-unpinned, **WHEN** a mission is created, **THEN** both wear Neural Interface I (same id).
- **GIVEN** Advanced Propellants **researched**, **WHEN** `currentIssue` is read for any bay, **THEN** Advanced Propellants is not returned.
- **GIVEN** an operative, **WHEN** bays are listed, **THEN** they are Neural, Chest, Arms, Legs, at most **1** completed slotted project per bay.
- **GIVEN** Neural Interface I then Neural Accelerator Mk II **researched**, Neural unpinned, **WHEN** `appliedNodeIds` is computed, **THEN** the Neural id is Mk II only.
- **GIVEN** Neural Interface I **researched** and worn by Mara, **WHEN** Mara is KIA at debrief, **THEN** Neural Interface I stays **researched**.
- **GIVEN** Neural pinned to Neural Interface I, **WHEN** Mk II becomes **researched**, **THEN** `currentIssue(Neural)` is Mk II and the pinned bay still wears Neural Interface I. Mk II is later by time. Neural Interface I is an earlier-by-time pin, not an equal-`endT` house-order case.
- **GIVEN** a mission already created, **WHEN** later research completes or a pin changes, **THEN** that mission’s weapons, crew bonuses, and Research slice are unchanged.
- **GIVEN** `appliedNodeIds` = [Advanced Propellants, Tungsten Sabot], **WHEN** `squadWeapon(assault)` is sampled, **THEN** damage **= assault weapon-table base × 1.12 × 1.15**. Read the base from the weapon-table owner at sample time. Do not paste it.
- **GIVEN** Caseless Ammo Feed is the only applied magazine effect, **WHEN** `squadWeapon(smg)` is sampled, **THEN** magazine **= round(smg weapon-table magazine + 10)**. Do not paste the table base or the sum.
- **GIVEN** `appliedNodeIds` empty, **WHEN** weapons and `crewBonus` are sampled, **THEN** each weapon field equals that weapon’s table base, read from the weapon-table owner and not pasted here, and `crewBonus` is **(0, 0)**.
- **GIVEN** `appliedNodeIds` = [Pain Inhibitor], **WHEN** `crewBonus` is computed, **THEN** maxHp **14**, speed **0**.
- **GIVEN** `appliedNodeIds` = [Synaptic Enhancement, Neural Cache Array], **WHEN** `crewBonus` is computed, **THEN** maxHp **18**, speed **0.55**.
- **GIVEN** Experience bonuses on a survivor, **WHEN** `crewBonus` is computed from `appliedNodeIds`, **THEN** Experience **+2 HP / +0.05 m/s** are not included.
- **GIVEN** Advanced Propellants **researched**, Neural Interface I worn, Chest **STOCK**, **WHEN** a mission is created, **THEN** the Research slice has unslotted ids only (Advanced Propellants) and **no pin-map field**; Neural Interface I is on the Roster slice as resolved wear / `appliedIds`.
- **GIVEN** a mission created while Neural Interface I is **active**, so it is absent from that create’s Roster resolved wear and `appliedIds`, **WHEN** it later becomes **researched** before that mission ends, **THEN** those frozen Roster fields still omit it. Do not use the Research slice as proof: a slotted project is absent there regardless of timing.
- **GIVEN** a mission in progress and Advanced Propellants **available**, **WHEN** it is authorized, **THEN** eligibility returns before `start()` and before `spendCredits`, `start()` is not called, Ballistics stays idle, the project stays **available**, Research emits no spend, and Credits are unchanged. In-field is not a Research-screen refusal reason.
- **GIVEN** Advanced Propellants **researched**, Neural Interface I **active**, **WHEN** Abort is confirmed, **THEN** `done` still has Advanced Propellants only, Neural Interface I stays **active**, no research refund, and Abort does not call `addCredits`.
- **GIVEN** `done` = [Advanced Propellants, Neural Interface I] as the completed-set export and Neural pinned **STOCK**, **WHEN** strategy presentation evaluates Chance, **THEN** Tactical/Brief `missionChance` receives `researchedCount = 2` from the full completed program, not the worn or unslotted-only count (oracle: `src/game/missionParams.ts`, living spec §9).
- **GIVEN** fixed deployment patrol, garrison, and civilian counts, enemy toughness, and clearer-weather visibility, **WHEN** `done` changes from empty to [Advanced Propellants, Neural Interface I], **THEN** Tactical/Brief `missionRisk` returns the same Risk index and band; completed Research is not an input (oracle: `design/gdd/tactical-mission.md` `risk_index`, `src/game/forecast.ts`, living spec §5).
- **GIVEN** Research’s public API, **WHEN** its exports and returned state are enumerated, **THEN** it exposes no Chance, Risk-index, or Event-forecast computation or number. Those computations remain with their existing owners.
- **GIVEN** Ballistics running Advanced Propellants and Barrel Wear Coating **available**, **WHEN** Barrel Wear Coating is authorized, **THEN** eligibility returns before `start()` and before `spendCredits`, `start()` is not called, Ballistics still runs only Advanced Propellants, Barrel Wear Coating stays **available**, Research emits no spend, Credits are unchanged, and the refusal text contains a lab-not-idle phrase and a credits-unchanged phrase. No reason enum.
- **GIVEN** `done` = [Advanced Propellants, Neural Interface I, Neural Accelerator Mk II], Neural unpinned, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants, Neural Accelerator Mk II].
- **GIVEN** the same `done` and Neural **STOCK**, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants] only.
- **GIVEN** the same `done` and Neural pinned to Neural Interface I, **WHEN** `appliedNodeIds` is computed, **THEN** [Advanced Propellants, Neural Interface I].
- **GIVEN** `done` = [Neural Interface I, Neural Accelerator Mk II], **WHEN** `currentIssue(Neural)` is read, **THEN** Neural Accelerator Mk II.
- **GIVEN** `done` = [Neural Accelerator Mk II, Neural Interface I], **WHEN** `currentIssue(Neural)` is read, **THEN** Neural Interface I.
- **GIVEN** empty `done`, **WHEN** `currentIssue` is read for each bay, **THEN** each is none.
- **GIVEN** each lab idle and all three 14h caps **available**, **WHEN** all three are authorized, **THEN** all three run and each `endT = startedT + 50400`.
- **GIVEN** empty `done`, Targeting AI Suite authorized at **t = 0** (`endT = 0 + 2 × 3600 = 7200`) and Advanced Propellants authorized at **t = 3600** (`endT = 3600 + 2 × 3600 = 10800`), **WHEN** `sync(t = 10800)` runs directly, **THEN** both are **researched** and `done` appends Targeting AI Suite before Advanced Propellants. A `BRANCH_IDS` append (ballistics before control) fails.
- **GIVEN** empty `done`, Sensor Fusion Array authorized at **t = 0** (`endT = 0 + 2 × 3600 = 7200`) and Neural Interface I authorized at **t = 3600** (`endT = 3600 + 2 × 3600 = 10800`), **WHEN** `sync(t = 10800)` runs directly, **THEN** both are **researched**, `done` appends Sensor Fusion Array before Neural Interface I, and `currentIssue(Neural)` is Neural Interface I. That result is later by time, not house order. A `BRANCH_IDS` append fails.
- **GIVEN** empty `done` and strategic `t` still **0**, Targeting AI Suite (control) authorized first, then Neural Interface I (cybernetics), then Advanced Propellants (ballistics), each at **t = 0** so each `endT = 0 + 2 × 3600 = 7200`, **WHEN** `sync(t = 7200)` runs, **THEN** `done` = [Advanced Propellants, Neural Interface I, Targeting AI Suite]. The later `BRANCH_IDS` lab was authorized first. An authorize-order append fails. Not a sort change.
- **GIVEN** Neural Cache Array (cybernetics, earlier `BRANCH_IDS`) and Adaptive Command AI (control, later `BRANCH_IDS`) are injected active runs — set directly via the store fixture, not produced by production authorize — at campaign `t = 0`, both with the same `startedT = S` and `endT = S + 14 × 3600`, and the recorded authorize order lists Adaptive Command AI before Neural Cache Array, **WHEN** `sync(t = S + 50400)` runs directly, **THEN** `done` appends Neural Cache Array before Adaptive Command AI and `currentIssue(Neural)` is Adaptive Command AI by house order, not because Control is later by time. An authorize-order append, which would place Adaptive Command AI first, fails. Not a sort change.
- **GIVEN** Neural Interface I and Sensor Fusion Array both **active**, both authorized at **t = 0** so both `endT = 0 + 2 × 3600 = 7200`, with Sensor Fusion Array (control, later `BRANCH_IDS`) authorized before Neural Interface I, **WHEN** `sync(t = 7200)` runs and `currentIssue(Neural)` is read, **THEN** `done` appends Neural Interface I before Sensor Fusion Array and `currentIssue(Neural)` is Sensor Fusion Array by house order. An authorize-order append fails. Not a sort change.
- **GIVEN** Neural Interface I **researched** and Neural pin names an id not in `done` or wrong bay, **WHEN** worn Neural is resolved, **THEN** it falls through to Neural Interface I.
- **GIVEN** all **21** projects **researched**, **WHEN** any is authorized again, **THEN** eligibility returns before `start()` and before `spendCredits`, `start()` is not called, every lab stays idle, every project stays **researched**, Credits unchanged.
- **GIVEN** the §7 cost rows and the §6 Credits rows (opening **128,450 CR**, one clean authored pass **203,000 CR**), **WHEN** the program gap is computed, **THEN** it is **447,550 CR** (779,000 − 128,450 − 203,000; derived constant, not registered in living spec §6). **GIVEN** minimum-reward generated offers — `rollReward` at u = 0, P = 1, zero collateral → **30,500 CR** each (oracle: living spec §9 reward formula) — **WHEN** **15** such wins are applied, **THEN** they fund the gap (15 × 30,500 = 457,500 ≥ 447,550). Fundability pacing ownership stays Economy / World Network; this AC pins the predicate only.

Fixture rules (not ACs): unit tests may construct states not reachable via production authorize (injected active runs set directly via the store fixture); no AC is arranged via a win ETA jump; seconds per ETA day are not authored in any fixture; “No reason enum” clauses are static source checks (no exported reason enum or type), not runtime assertions.

## Open Questions

- **`done` insertion when two labs complete in one `sync(t)`** — **Closed.** Append in ascending `endT`. Equal `endT` only: `BRANCH_IDS` house order (ballistics, then cybernetics, then control), not authorize order, not later-by-time. Do not reverse the sort. A later timer is current issue even if its lab sorts after the earlier timer. An equal `endT` is not latest. Equal-`endT` Neural: Neural Interface I then Sensor Fusion Array → Sensor Fusion Array issues by house order. Do not call Neural Interface I older by time. §7 counts the tie non-issue as an older completed project, so it is pinnable — alias that sentence. House order applies only among same-bay completions. Not a §7 table. Naming that winner on the assembly dossier is an unsatisfied downstream obligation (UI Requirements), not a delivered claim.
- **Pin/wear edge** — Roster GDD (`roster-and-assembly.md`) + [ADR-0009](../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md). Research slice is unslotted only. The equal-`endT` pin right is closed at §7 source (the tie non-issue counts as an older completed project and is pinnable). Dossier naming of current issue beyond worn-or-stock plus a pin flag remains unsatisfied (UI Requirements). Do not add current-issue controls here. Do not edit `roster-and-assembly.md` from this batch.
- **Which completed nodes enter authored chance** — living spec says “completed research”; mapping is Tactical / Brief (`tactical-mission.md`). Research exposes the completed set only.
- **Research-screen chrome** — remaining is none when the project is not active or when `t ≥ endT`; otherwise `endT − t`, no clamp. A formula-oracle query before `sync(t)` is allowed and is not a screen paint; at equality and after `endT` it returns none, not **0**. The screen paints remaining only after `sync(t)` for that same `t` and must not paint **0**. `progress` is not a Research output; the `interface.md` rows that listed it were struck (Resolved 2026-09-22, above). Unaffordable authorize-disable is Interface AC8. Refusal text is composed in UI Requirements above. Hex labels are do-not-invent (Interface). Chrome is not the Credits guard ([ADR-0013](../../docs/architecture/adr-0013-credits-never-overdraw.md)).
- **Store placement** (`researchStore` vs campaign blob for pins) — implementation; GDD owners stay Research vs Roster. Later ADR if a move is needed.
