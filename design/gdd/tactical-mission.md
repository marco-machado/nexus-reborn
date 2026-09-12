# Tactical Mission

> **Status**: Designed (pending independent `/design-review`)
> **Author**: extract from docs/game-design.md §10, §11, §16
> **Last Updated**: 2026-09-10 (ADR-0009 wear owner + quietReplay stamp)
> **Implements Pillar**: Command, do not micromanage; Information is operational power; Violence has corporate consequences
> **Living spec**: `docs/game-design.md` §10, §11, §16 — this file aliases them; do not fork rules
> **Specialists (full)**: creative-director (fantasy); game-designer (rules); systems-designer (formulas/edges/knobs); qa-lead (acceptance)
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08
> **Wear owner**: Roster slice owns resolved wear and ordered `appliedIds`; Research slice is unslotted only ([ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)).

## Overview

The tactical mission is the director’s command language on the street they never walk: **Select / Move / Attack / Hold Ground / Hold Fire** (plus Stop). Tempo and position, not every shot; operatives acquire visible targets when weapons are free. One seed builds the district, weather script, Opening hour, CorpSec, civilians, fire lanes, and seven objective kinds, and that lifetime is unsaved ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)) — citygen is infrastructure under the verbs, not the lead. Tactical time does not tick the World Network ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Weather is a determined script the brief tells the truth about ([ADR-0006](../architecture/adr-0006-weather-script.md)); Opening hour lights dusk or night and is frozen for the deployment ([ADR-0007](../architecture/adr-0007-opening-hour.md)). Hardened vs Standard changes the fight (patrols, civilians, confirmation, accuracy, a metre of vision, optional windows); it does not hide the minimap. Missed rounds continue; the first Unit in the fire lane is hit. Win or loss still debriefs, including quiet replay ([ADR-0004](../architecture/adr-0004-quiet-replay.md)); debrief is the only campaign write-back. Glass Veil, Hollow Crown, and Rust Haven are authored tactical problems, not reskins. Without this system the director has no orders, chrome or citygen would lead, and violence would be flavor instead of a board the invoice can price.

Rules stay in `docs/game-design.md` §10, §11, §16. This overview does not fork them.

## Player Fantasy

You spend a few orders. You do not fire the shot. Select, Move, Attack, Hold Ground, Hold Fire — five verbs plus Stop. Tempo and position; operatives acquire visible targets when weapons are free. You do not click every round. Read cones, patrols, civilians, the weather script, Opening hour. Hardened lengthens confirmation and adds patrols; it does not hide the minimap. Missed rounds continue; the first Unit in the fire lane is hit. Squad-caused civilian hits become invoice line items — Economy prices them. District, weather, Opening hour, and objectives share one seed and an unsaved lifetime; tactical time does not tick the World Network. Quiet replay still debriefs. Glass Veil, Hollow Crown, Rust Haven are tactical problems, not reskins. The fantasy fails if chrome or citygen leads, if idle operatives who can already see a target need babysitting, if stray fire is invisible, or if the mission can be checkpointed.

This serves **Command, do not micromanage**, **Information is operational power**, and **Violence has corporate consequences**. Secondary: **The two layers feed each other** (deploy snapshot; debrief is the only campaign write-back) and **One corporate operating system** (HUD is the same terminal; chrome must not bury the five verbs). It does not own Credits or collateral pricing (Economy), sector shove (World Network), roster KIA/injury (Roster applies from the outcome DTO), HUD chrome (Interface), audio mix (Audio), or mid-mission save (forbidden, [ADR-0002](../architecture/adr-0002-unsaved-mission.md)).

## Detailed Design

### Core Rules

1. **Alias.** District families, weapon rows, authored weather/hour stamps, combat and Risk formulas, and §11 beat-by-beat walkthroughs live in `docs/game-design.md` §10, §11, §16. This section names owners, verbs, states, and DTO edges. CONTEXT.md owns names. Do not fork those tables. Do not invent formulas.

2. **One system, one seed, unsaved lifetime.** Citygen, combat, weather script, Opening hour, and objectives share **one mission seed** and **one unsaved mission**. Abort discards the whole thing ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). Do not split these into multiple systems. The internal module map below is inside this GDD, not a license to extract sibling systems.

3. **Internal module map (do not split).**

| Module | Owns in this system | Does not own |
|---|---|---|
| District / seed | 96 × 96 m District; three families (checkpoint / compound / industrial); southern Insertion; seed rebuilds the same District, Weather script, and Opening hour | Scan / City (World Network); authored base garrison/patrol/civilian **table** (living spec §10) |
| Verbs / stances | Select, Move, Attack, Hold Ground, Hold Fire; Stop as command language; Explicit target; eight-direction 1 m walk grid; camera pose rules | Role kit rows (Roster); remap table (Interface) |
| Opposition / civilians / combat | CorpSec states and archetypes; street patrols vs Garrison; civilians in the Fire lane; Fire lane / cover; real-time resolve after placement | Collateral price (Economy); Control HP (none — Control does not add CorpSec HP) |
| Objectives / win-loss | Seven kinds; required sequence; optional activation; Win / Loss / Abort; HUD result then 2.5 s to Debrief | Optional **fees** (Economy); sector shove / Intel / Influence (World Network) |
| Weather script | Opening Weather plus at most one adjacent change at a tactical time; front retunes sight/noise; Brief tells the truth ([ADR-0006](../architecture/adr-0006-weather-script.md)) | Re-sample of Research; accuracy; movement; 4.5 m omni notice |
| Opening hour | Per-mission tactical start hour; lighting frozen dusk/night; independent of strategic now and of Weather ([ADR-0001](../architecture/adr-0001-two-clocks.md), [ADR-0007](../architecture/adr-0007-opening-hour.md)) | Sight, noise, Risk index |
| Difficulty extras | Standard vs Hardened discrete profiles (`DIFFICULTY_FX`); extra street patrols/civilians, confirmation, accuracy, +1 m vision, tighter optional windows | Hiding the minimap; free-range tuning; Threat (contract band) |

4. **Five verbs (lead).** The mission opens with every living operative selected. The dead are never valid order recipients. These five are the protected core (`design/gdd/game-pillars.md` Pillar 1):
   - **Select.** Choose which living operatives receive the next order.
   - **Move.** Walk to ground. Clears Explicit target and **releases Hold Ground**. Along the route, operatives stop to engage visible CorpSec when weapons are free, then resume.
   - **Attack.** Sets an Explicit target. **Overrides Hold Fire.** Hold Ground prevents the chase but keeps the target.
   - **Hold Ground.** Stance. Pins the operative. An active path is parked and restored on release. Separation will not shove them off their tile. They may still fire.
   - **Hold Fire.** Stance. Clears automatic targets. The operative will not auto-acquire. A later Attack still fires.

5. **Stop is command language, not a sixth verb.** Stop clears pathing and targeting. Hold Ground and Hold Fire stay. New verbs need a pillar reason. The living spec’s command language is these five plus the ability key; Stop sits in that language without becoming a new fantasy verb.

6. **Kit is not a new verb.** **Q** fires actives of the **current selection**. Tactical **executes**; Roster **owns the kit**. Power cells arm Grenades (same pool). Empty or invalid item use reports on the Comm log and spends nothing. Empty grenade cells or a running squad grenade cooldown **disable the control**. Drawn-weapon swap is kit, not a stance.

7. **Typical use.** Deploy → every living operative selected → read cones, street patrols, civilians, Weather, and the active Objective → spend few orders (Select / Move / Attack / Hold Ground / Hold Fire, and Stop as needed) → Win or Loss → Debrief. Quiet replay is still a real mission ([ADR-0004](../architecture/adr-0004-quiet-replay.md)).

8. **Player cannot.** Click every shot. Rotate or tilt the camera in play. Mid-mission save or resume. Change Research or wear on a squad already on the ground. Hide the minimap as Difficulty. Live-query the World Network, Credits, or the live Roster. Write campaign state on Abort. Gate a Win on an optional Objective. Treat street patrols as the Garrison unless they carry the eliminate tag.

9. **District / seed.** Every mission is a deterministic **96 × 96 m** District. Three layout families share one generator, one southern Insertion, and the same connectivity guarantees. The seed rebuilds the same District. Shared landmarks: Insertion and Extraction on the south; a central north-south avenue; walkable routes from Insertion to objective landmarks, CorpSec, street-patrol paths, and Extraction. Authored data names landmarks; it does not carry coordinates the generator owns. **Do not copy the §10 archetype count table.**

10. **Movement.** Eight-direction pathfinding on a one-metre walk grid. No diagonal corner cutting. Paths straighten when line of sight allows. Blocked clicks snap to the nearest walkable cell. Units slide on a valid axis when a step is blocked, and living bodies separate so they do not overlap. There is no rigid-body physics.

11. **Camera.** Fixed 45° yaw, 55° elevation, 25° field of view. Zoom 44–115 m. No rotate/tilt in play. Minimap up = screen up. That shared orientation is load-bearing. Pan and recenter are camera steering, not verbs.

12. **Opposition.** CorpSec states: **patrol** (authored route), **suspicious** (last seen or heard point, then a scan), **combat** (pursue and fire). Combat does not fall straight back to patrol. Archetypes: Trooper, Heavy, Marksman, Officer. Threat sets the elite mix (pointer §10 — do not copy HP/speed rows). Officer radio: **4 s / 22 m**; killing or calming the Officer inside the delay cancels the call. Vision: **14 / 12.6 / 11.2 m** (clear / light rain / heavy rain), **110°** cone, **4.5 m** omnidirectional notice **weather-invariant**. Vision needs clear grid line of sight. Ranges follow **live** Weather: when a front hits, sight and weapon noise retune. Hearing: gunshots through walls; sound alone raises Awareness only to **85%** (investigation, not fire). Civilians wander; gunfire within **10 m** makes them flee for **5 s** after the latest nearby shot. They exist for Fire lanes and the invoice. Placement that makes Collateral feel arbitrary is a content bug.

13. **Combat.** Real-time after placement and targeting. A missed round continues down the Fire lane to weapon range. The **first Unit** in that lane before cover is hit, regardless of side. Cover stops the lane. Tracers, Comm log, and Debrief must make this readable. Hit-chance and weapon rows stay in §10 / Formulas — do not copy them here.

14. **Objectives.** Seven kinds: Reach zone, Eliminate tag, Extract, Interact, Escort, Destroy, Defend. Required objectives are strictly sequential. An optional Objective activates with the required Objective it precedes, never blocks the sequence, never gates Win. Ignoring or failing an optional costs nothing (bonus unpaid). Interact and Defend advance only while a living operative stands in the zone; empty pauses, does not reset. A dead VIP voids every unfinished Escort. An optional Destroy whose Device dies to non-squad fire **fails** rather than completing. Time limit from activation: expiry fails an optional and is a **Loss** on a required one.

15. **Win / Loss / Abort.** **Win:** every required Objective complete. **Loss:** no living operatives remain; a required Escort VIP dies; or a required time limit expires. The HUD shows the result immediately; after **2.5 s** the game enters Debrief. **Abort:** no Debrief, no campaign write. Clean win is `civiliansHit = 0` on a Win (World Network awards; Economy prices Collateral from the same count).

16. **Authored three (tactical problems owned here).** Economy owns fees. Do not copy §11 prose beyond one-line problems and sequence names.
    - **Glass Veil** — checkpoint read-and-commit. Reach the checkpoint gate → Eliminate the seven-Garrison (untagged street patrols optional) → Extract south.
    - **Hollow Crown** — compound escort. Reach the compound gate → *(optional)* pull the detention server → Override the cell-block locks → Walk the freed VIP to Extraction alive → Extract the Squad.
    - **Rust Haven** — yard invert. Reach the relay yard → *(optional)* destroy the backup transformer → Destroy the three fuel relays → Defend/hold the yard → Extract.
    Generated contracts reuse families and the objective vocabulary; they do not replace these three as the campaign’s argument.

17. **Weather script.** Rain is heavy, light, or none. It shortens CorpSec sight and quiets weapons. It does not change accuracy, movement, or the 4.5 m omni notice. Script is fixed at mission create: opening Weather plus **at most one** adjacent change at one tactical time. Same seed → same script. Authored contracts carry an explicit script (pointer §10 / ADR-0006 — **do not copy the authored table**). Generated contracts roll one, including no change. Brief prints opening and coming change. Comm log fires when the front hits. Risk index uses the **clearer** Weather on the script; notes still print both. A front retunes sight/noise; it does **not** re-sample Research.

18. **Opening hour.** Tactical clock start for this mission. Lighting derives from it and is **frozen** for the deployment: the HUD clock still ticks; the sky does not. Independent of strategic now and of Weather. Does not change sight, noise, or Risk. Legal hours: **18:00 inclusive–01:00 exclusive**. Dusk **[18:00, 20:00)**; else night. No morning, afternoon, or noon. Neon still reads at dusk. Authored stamps stay in §10 / ADR-0007 — **do not copy that table**.

19. **Difficulty extras.** Player setting: **Standard** (authored baseline) or **Hardened**. Hardened adds street patrols and civilians, lengthens sight confirmation, raises CorpSec accuracy, adds **+1 m** vision after Weather, and tightens optional windows. It does **not** hide minimap information. Supported **discrete** profiles, not free ranges. Values: `DIFFICULTY_FX` in `src/game/missionParams.ts` and the §16 table — pointer only; do not retune here. Threat extras and Unrest extras (above 20: **+6 civilians** and **+1 street patrol**) are **Tactical-derived** from the World Network snapshot; World Network does not simulate the District. Control does not add CorpSec hit points.

20. **Two clocks / deploy cut.** World Network owns **strategic time**; this system owns **tactical time**. The network does not tick in the field. A Win Debrief spends ETA; a Loss spends none ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Partitioned snapshot at deploy; outcome DTO at Debrief; Abort = no write. Neither side live-queries the other.

21. **Forbidden.** Second ruleset; copied weapon / district-archetype / authored weather-hour tables; §11 walkthroughs; new verbs without a pillar reason; click-per-shot; rotatable tactical camera; mid-mission save; live World Network / Credits / Roster queries; splitting District, combat, Weather, Opening hour, or objectives into other systems; hiding minimap as Difficulty; free-range Difficulty; Weather re-sampling Research; Opening hour changing sight/noise/Risk; Control adding CorpSec HP; optional gating Win; Abort Debrief; code-only constants (noiseMul, Alert bands, THREAT_EXTRA) silently promoted into this GDD.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Mission coupling | Strategy / Deployed (memory only) / Result shown / Debrief apply-once / Abort discarded | Deploy copies the partitioned snapshot and starts tactical time. Field does not tick World Network, labs, injuries, or the candidate market. Win or Loss → HUD result → 2.5 s → Debrief (outcome DTO once). Abort → discard, no outcome, no campaign write ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)) |
| Tactical clock | Running / Paused (in-mission pause) | Independent of strategic time. Opening hour is the start stamp; HUD ticks; lighting does not. Pause freezes tactical time |
| Selection | Empty / one or more living operatives | Opens with **every living operative** selected. Dead never join. Click / shift / box / keys 1–4 / select-all living / clear — input map is Interface; validity is this rule |
| Pathing | No path / walking / parked (Hold Ground) | **Move** writes a path, clears Explicit target, releases Hold Ground. **Stop** clears path and target; stances stay. **Hold Ground** parks the path and restores it on release |
| Explicit target | None / assigned by Attack | **Attack** sets it and overrides Hold Fire. **Move** and **Stop** clear it. Hold Ground keeps it but prevents chase. Hold Fire (living spec) clears **automatic** targets; a later Attack still fires. *Flag:* code also drops a standing Explicit target when Hold Fire is turned on — do not silently promote that into this GDD |
| Hold Ground | Off / On | Toggle on selection. Move releases it. Stop does not. Separation will not shove a held operative off their tile. Fire still allowed |
| Hold Fire | Off / On | Toggle on selection. Clears auto-acquire. Attack overrides (fires through). Stop does not clear it |
| Operative body | Living / dead (invalid order recipient) | HP to 0 in the District → dead, never a valid recipient. Debrief grades KIA / injury from the outcome DTO (Roster) |
| Drawn weapon | Primary / Sidearm; Ready / Drawing / Reloading | V swaps the selection. Drawing cannot fire for 0.5 s. Each slot keeps its magazine; swap cancels in-progress reload of the stowed weapon |
| CorpSec | patrol / suspicious / combat | Sight and hearing raise Awareness. Combat does not fall straight to patrol. After six seconds without sight → suspicious investigation. Officer radio 4 s / 22 m unless cancelled |
| Civilian | calm wander / flee | Gunfire within 10 m → flee 5 s after the latest nearby shot, at +50% speed. A direct hit forces a flee from the shooter |
| Weather | heavy / light / none; script static or one front | Front at a fixed tactical time, adjacent intensity only. Live sight/noise retune; accuracy/movement/omni notice do not |
| Opening hour | dusk / night (derived, frozen) | Set at create. Legal 18:00 inclusive–01:00 exclusive; dusk [18:00, 20:00). HUD clock ticks; sky does not |
| Objective | inactive / active / complete / failed | Required strictly sequential. Optional activates with the required it precedes. Interact/Defend pause on empty, do not reset |
| Mission result | none / Win / Loss | Win: every required complete. Loss: no living operatives; required escort VIP dies; required time limit expires. Optionals never gate Win |
| Difficulty | Standard / Hardened | Player setting. Survives New Operation. Discrete profiles only |

### Interactions with Other Systems

Partitioned **deploy snapshot**, frozen at mission create. Do not pass live store handles. Do not call any one slice “the Snapshot DTO.” Abort is **absence of an outcome**, not a field.

| Other system | In (Tactical receives) | Out (Tactical emits) | Interface owner |
|---|---|---|---|
| **World Network** | **WN slice:** sector id; Control; Unrest. Intel 2+ only **gates display** of Risk index | **Outcome:** `won`; `quietReplay`; `civiliansHit`; mission/city/sector identity. Tactical **derives** Unrest extras (above 20: +6 civilians +1 street patrol) and Threat extras. Risk index math is Tactical/Brief; WN does not compute it | Neither live-queries the other. WN applies Control/Unrest/ownership/Influence/Intel/Feed after Debrief. Tactical does not shove sectors |
| **Economy** | **Economy slice:** contract id; authored vs generated; Reward; optional bonus **defs**; ETA days (WN spends later); `quietReplay` from authored `contractsWon` | **Outcome:** `civiliansHit` (unique squad-caused first hits); `won`; completed optionals (`bonus` amounts are priced by Economy from defs + completion); `reward` | Tactical **counts**; Economy **prices** Collateral and net payout. No live Credits writes. Quiet replay still Debriefs ([ADR-0004](../architecture/adr-0004-quiet-replay.md)) |
| **Research** | **Research slice** frozen at create: completed **unslotted** set | — (applies the freeze; does not complete labs) | Weather front does **not** re-sample Research. Completions after freeze apply to the **next** deploy. Wear / `appliedIds` are on the Roster slice ([ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)) |
| **Roster / Assembly** | **Roster slice:** assigned ids (1–4); **resolved wear**; ordered **`appliedIds`**; Item slots of the assigned; mass (squad kg + Mass tier); sampled HP/speed | **Outcome Roster fields:** `deadIds`; `survivorHp` (end fraction, survivors only); kia names resolved at Debrief t0; new injuries are Roster-graded from `survivorHp` | Q fires actives of current selection; Tactical **executes**, Roster **owns kit**. Power cells arm Grenades (same pool). Empty/invalid item use → Comm log, spend nothing. Tactical copies `appliedIds` and sampled HP/speed; it does not union or re-run `appliedNodeIds` |
| **Persistence** | — | Nothing live. Mission is memory only. Outcome payload (including telemetry counters) is emitted at Debrief; Persistence commits campaign once on the next Screen. Enabled Abort may append a **thin** telemetry record — not a campaign write | No mid-mission save. Seed is not a resume checkpoint |
| **Interface** (not extracted) | Input: Select / Move / Attack / Stop / stances / camera pan-zoom / pause / Abort confirm chrome / Q / items / grenade / swap | HUD: tactical clock, Weather chip, Alert, live Collateral count, squad cards, objectives, Comm log, minimap (up = screen up), result banner, 2.5 s then Debrief | Presentation only. Difficulty must not strip minimap. Brief geometry, Opening hour, and weather-front timing must match this District |
| **Audio** (not extracted) | — | Order confirms, danger, weapon reports, weather rain, mission bed start/stop | Mix ownership is Audio. Tactical does not own channels |

**Outcome DTO — fields Tactical owns (apply once at Debrief):** `won`; `civiliansHit`; completed optionals (Economy prices `bonus`); `deadIds`; `survivorHp`; `timeSec` (tactical elapsed); mission identity needed by WN/Economy. `quietReplay` is stamped from the Economy slice (already-won authored), not from a live query mid-mission. *Flag:* current code restamps `quietReplay` from live `contractsWon` at outcome time — extract keeps the frozen-slice rule.

**Risk index:** Tactical/Brief compute from the **actual** deployment (street patrols, Garrison, civilians, Threat HP multiplier, clearer scripted Weather). World Network only gates the Brief display at intel 2+. Formula stays in living spec §5 / Formulas.

**Sibling conflicts (do not silently resolve):**

1. **Worn ids.** Research slice = unslotted set. Roster slice = resolved wear + ordered `appliedIds` + sampled HP/speed ([ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)). Tactical does not union in the sim.
2. **Experience magnitudes.** Research GDD Formulas cites +2 HP / +0.05 m/s as Roster-owned; Roster GDD forbids forking §8-absent magnitudes. Tactical samples HP/speed from the Roster slice only.
3. **Attack vs Device.** Living spec Attack = living hostile. Code accepts devices as Explicit targets for slow demolition. Extract aliases living spec; Destroy / Fire lane still let gunfire reduce Devices. Do not add a “Demolish” verb.
4. **Hold Fire vs Explicit target.** Living spec: clears automatic targets; later Attack still fires. Code also nulls a standing Explicit target when Hold Fire is turned on. Extract aliases living spec.
5. **Stale sibling footnotes** (World Network / Economy / Roster “Tactical not extracted yet”) are documentation drift, not rule forks.

**Forbidden (interactions).** Live-query World Network, Credits, laboratories, or Roster during the mission. Mid-mission Research re-sample. Campaign write on Abort. Optional gating Win. Economy computing `civiliansHit`. World Network computing Collateral or Risk index. Persistence saving the running mission. Copying weapon / archetype / authored weather-hour tables into this GDD. Splitting the internal module map into new systems.

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §10, §16, and §5 (`risk_index`). Weapon rows and `DIFFICULTY_FX` stay discrete authored tables in those sections — do not reprint them here.

Tactical owns `hit_chance`, `risk_index` (compute), and the **count** `N`. Economy owns `collateral` / `net_payout` (do not re-price). World Network owns `tax_yield` and only **gates** `risk_index` display at intel 2+. Roster owns injury/mass/XP. `missionChance` is a code-owned Chance readout, not a living-spec formula.

The `hit_chance` formula is defined as:

`hit_chance = clamp((0.78 − 0.28 × d/r + (u − 0.5) × 0.1) × a, 0.05, 0.95)`

A valid shot has `0 ≤ d ≤ r` (`r` > 0). A separate seeded draw resolves the hit against this chance. An armed Deadeye shot bypasses that **roll** (not the chance expression). Weapon spread shapes the **miss path**, not this roll. Source: §10; `tryFire` in `src/game/world.ts`.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| distance | d | float | 0–r m | Target distance |
| weapon range | r | float | authored weapon table (§10; do not copy rows) | Drawn weapon range, metres |
| jitter draw | u | float | [0, 1) | Seeded draw; jitter (u−0.5)×0.1 ∈ [−0.05, 0.05) |
| accuracy | a | float | {1.0, 0.45, 0.495} | 1.0 operatives; 0.45 Standard CorpSec; 0.495 Hardened CorpSec (§10). Hardened 0.495 = 0.45 × §16 acc mul 1.1 |
| hit chance | hit_chance | float | 0.05–0.95 | Probability the aimed shot hits the intended target |

**Output Range:** Clamped to 0.05–0.95. Rain does not enter this expression. Operative `a` is not Difficulty-scaled.
**Example (§10):** Half range, zero jitter (d/r = 0.5, u = 0.5): operative **64%**; Standard CorpSec **28.8%**. Derived from the same expression: Hardened CorpSec `a=0.495` → **31.68%** (not a separately authored percentage).

The `risk_index` formula is defined as:

`risk_index = round(((4p + 5g) × h + 0.5c) × (0.7 + 0.3v))`

Tactical/Brief compute from the **actual deployment** counts. World Network only gates the intel-2+ brief (percentage hidden; bands shown). `v` is the **clearer** scripted weather, not live weather after a front, and not Opening hour. Source: §5; `missionRisk` in `src/game/forecast.ts`.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| street patrols | p | int | ≥ 0 | Deployment street-patrol count |
| garrison | g | int | ≥ 0 | Deployment garrison count |
| civilians | c | int | ≥ 0 | Deployment civilian count |
| Threat HP mul | h | float | {1.0, 1.1, 1.2} | Moderate / High / Severe |
| clearer weather sight mul | v | float | {1.0, 0.9, 0.8} | none / light / heavy (clearer of opening and any front) |
| risk index | risk_index | int | ≥ 0, **not** capped at 100 | Dimensionless index, **not** a percentage |

**Bands:** Low < 30; Guarded [30, 50); High [50, 75); Severe ≥ 75.
**Output Range:** Uncapped integer. Not a percent. Opening hour does not change `v` or this index.
**Example (§5):** p=8, g=7, c=22, h=1.2, v=0.9 → **89**, Severe.

The `civilian_first_hits` count (Tactical counts; Economy prices) is defined as:

`N = number of unique civilian units first-hit by the squad this deployment`

Hit, not death. First squad-caused hit only. Repeats do not stack. CorpSec-caused hits do not increment `N`. Grenade damage applied by a squad throw **does** increment `N` (squad-caused). Do not re-price: `collateral = min(Reward, 5000 × N)` stays Economy.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| unique squad first-hits | N | int | ≥ 0 | Count handed on the outcome DTO as `civiliansHit` |

**Output Range:** Unbounded nonnegative integer. Loss/abort do not re-price it here.
**Example:** Two different civilians each first-hit by the squad → N=2. Same civilian hit twice → N=1. CorpSec-only civilian harm → N=0.

The `guard_vision` formula (alias of §10 distances + §16 add) is defined as:

`guard_vision = 14 × v_live + visionAdd`

`v_live` is **live** weather (front retunes). Same multipliers as risk’s `v`, different sample: live vs clearer-script. Omni notice is **not** this formula: 4.5 m, weather-invariant. Rain does not change accuracy or movement.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| clear sight | 14 | float | 14 | Metres, clear weather (§10) |
| live weather mul | v_live | float | {1.0, 0.9, 0.8} | none / light / heavy |
| vision add | visionAdd | float | {0, 1} | 0 Standard; +1 m Hardened **after** weather (§16) |
| guard vision | guard_vision | float | 11.2–15 | Cone range, metres |

**Output Range:** Standard 14 / 12.6 / 11.2 m. Hardened adds 1 m after weather (light Hardened 13.6 m). Cone 110°.
**Example (§10):** Light rain Standard **12.6 m**; heavy **11.2 m**. Hardened +1 m after that weather.

The `grenade_damage` formula is defined as linear falloff between the two §10 endpoints, LoS only:

`grenade_damage = 70 − 35 × min(1, d / 3.5)` for a living unit with LoS and d ≤ 3.5 m; else no blast damage.

Throw: spends one power cell; pavement snap ≤ 2.5 m; land ≤ 18 m; 24 m noise; 4 s **squad** cooldown. Empty cells or a running cooldown disable the control.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| distance from blast | d | float | 0–3.5 m in-blast | Metres from detonation |
| centre / edge | 70 / 35 | float | 70, 35 | Authored damage at centre and 3.5 m edge |
| grenade damage | grenade_damage | float | 35–70 in-blast | Applied per LoS body |

**Output Range:** 70 at centre, 35 at 3.5 m; 0 outside radius or without LoS.
**Example (§10):** Centre 70; edge 3.5 m → 35.

CorpSec combat multipliers (§10; not a curve):

`corpsec_damage = 0.7 × weapon_damage`

`corpsec_cooldown = 1.75 × authored_cooldown`

Operatives deal full weapon damage and use authored cooldown. Magazines reload from an unlimited reserve.

**Optional window (§16 discrete):** `optional_window = authored_failSec × optFailMul` with optFailMul ∈ {1.0, 0.85}. Example: Hollow Crown 90 s → **76.5 s** on Hardened. Not a continuous range.

**Chance readout — not a living-spec formula.** Alias function `missionChance` in `src/game/missionParams.ts`. §9 names inputs (threat, clearer weather, unrest, completed research) and clamp 35–95; §16 points at the function. Intel < 2 shows this percentage; intel 2+ shows `risk_index` instead. **Do not** promote code bases or per-mod deltas into this GDD.

**Do not copy:** weapon table; `DIFFICULTY_FX` as continuous ranges; threat-extra tables (§10 names them only); unrest extras are named in §5/§10 (+6 civilians and +1 street patrol above unrest 20). Control does not add CorpSec HP. `weaponNoise` expression and rain `noiseMul` magnitudes are code-owned — §10 only: rain quiets weapons; louder weapons shout farther.

**Not owned:** `tax_yield` (World Network); `collateral` / `net_payout` (Economy); `injuryRecoverySec` / `mass_gate` / `mass_tier` (Roster); `endT` / current-issue identity (Research).

## Edge Cases

- **If Abort:** discard the mission with no debrief ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). No outcome DTO. Credits, roster, sectors, labs unchanged. Not a Loss.
- **If Win:** every required objective complete. Optionals do not gate the win. HUD result, then debrief after 2.5 s.
- **If Loss:** no living operatives remain; **or** a required escort VIP dies; **or** a required time limit expires. `net_payout` is Economy (0); Tactical still emits the outcome DTO with won=false.
- **If wipe and required-complete would both be eligible in the same step:** living spec does not name a tiebreak — do not invent one (Open Question 5).
- **If quiet replay still wins:** debrief **runs**. Banner `REPLAY // FEE ALREADY COLLECTED`. Roster/ETA still print. Currency and sector lines unpaid (Economy / World Network). Not an Abort.
- **If a shot misses the intended target:** the round continues along the fire lane to weapon range. The first Unit in that lane before cover is hit, regardless of side (operatives, civilians, other CorpSec all legal).
- **If that continued miss first-hits a civilian and the shooter is squad:** increment `N` once for that civilian. Tracers / comm log / debrief must make the stray readable.
- **If CorpSec-caused civilian hit or death:** do **not** increment `N`. Pillar veto: CorpSec harm is not the player’s collateral.
- **If cover is on the lane before a body:** cover stops the lane. The body behind cover is not the stray victim.
- **If Hold Ground vs explicit Attack:** Hold Ground prevents the chase but **keeps** the target. The operative may still fire. A Move clears Explicit target and releases Hold Ground. Stop clears pathing and targeting; Hold Ground and Hold Fire stay.
- **If Hold Fire vs explicit Attack:** Hold Fire clears automatic targets and blocks auto-acquire. A later explicit Attack still fires (overrides Hold Fire).
- **If the officer is killed (or calmed, e.g. EM burst) inside 4 s of entering combat:** the radio call is cancelled. After the delay, every CorpSec within 22 m not already fighting is put on the squad’s last seen position at investigation-level awareness (sound-alone cap 85% still applies to the call’s awareness).
- **If an optional destroy’s device dies to non-squad fire:** the optional **fails**, it does not complete.
- **If the interact or defend zone is empty:** the channel/hold **pauses**; it does **not** reset.
- **If a VIP dies:** every **unfinished** escort is voided (optional escort fails; required escort is a Loss). Completed escorts stay complete.
- **If a required timer expires:** Loss. If an optional timer expires: that optional fails; the required sequence is ungated.
- **If a weather front hits:** live sight and weapon **noise** retune. Accuracy, movement, omni 4.5 m notice, and research do **not** change. Comm log + HUD chip follow. `risk_index` does **not** retune (it used clearer scripted weather at brief).
- **If Opening hour is dusk vs night:** lighting/sky only. Opening hour does **not** change sight, noise, or `risk_index`. Independent of strategic time and of the weather script.
- **If Hardened:** apply discrete `DIFFICULTY_FX` (§16). It does **not** hide the minimap.
- **If there are no living order recipients:** the dead are never valid order recipients. 0 / backtick picks everyone **living**. Clicking a hostile does not clear selection.
- **If grenade cells are empty or squad grenade cooldown is running:** the control is disabled. No throw, no spend.
- **If two shots resolve in the same step:** each has its own chance roll and, on miss, its own lane. No combined hit pool.
- **If one grenade overlaps several bodies:** each LoS unit in 3.5 m is damaged; `N` increments once per unique civilian first-hit by that squad throw.
- **If the same civilian is multi-hit by the squad:** first hit bills `N` once; repeats do not stack; death is not required.
- **If unrest > 20:** +6 civilians and +1 street patrol on that sector’s missions. Control does **not** add CorpSec HP.
- **If intel < 2:** brief shows the Chance readout (`missionChance`), not `risk_index`. If intel 2+: `risk_index` bands replace the percentage. World Network gates that display; Tactical still computes the index.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Snapshot in; extras derived; outcome out | WN slice: sector id, Control, Unrest. Tactical derives unrest extras and Threat extras. Outcome: `won`, `quietReplay`, `civiliansHit`, identity |
| Hard, upstream | Economy and contracts | Snapshot in; counts out | Economy slice: contract id, Reward, bonus defs, `quietReplay`. Tactical counts `N` / completed optionals; Economy prices |
| Hard, upstream | Research | Freeze in | Unslotted completed set. Worn ids dual-home — Open Question 1. Front does not re-sample |
| Hard, upstream | Roster and Assembly | Freeze in; roster fields out | Roster slice: 1–4, resolved wear, items, mass/tier, sampled HP/speed. Outcome: `deadIds`, `survivorHp` |
| Hard, downstream | Persistence and validation | Unsaved lifetime | Mission memory only. Abort = no campaign write. Debrief apply-once; durable on next Screen |
| Soft, downstream | Interface | Presentation | Five-verb input, HUD, minimap, brief/deploy agreement. Not extracted |
| Soft, downstream | Audio | Mix | Order confirms, danger, weapon reports, rain, mission bed. Not extracted |

World Network, Economy, Research, Roster, and Persistence already list Tactical. Bidirectional on those five. Interface and Audio template GDDs are not extracted; edges vs living spec §12–15.

**Not dependencies:** `tax_yield` math (World Network); `net_payout` / `collateral` price (Economy); mass gate (Roster); Credits ledger.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §10, §16, and §5 (`risk_index`). This GDD does not add safe ranges. Discrete tables (`DIFFICULTY_FX`, weapon rows) are authored values, not validated continuous ranges. Changing a knob requires checking brief/live agreement and living-spec dependencies, not this pointer. Do not duplicate Economy collateral/Reward knobs or Roster mass/injury knobs.

| Knob | Owner | Too high / too low |
|---|---|---|
| `hit_chance` clamp 0.05–0.95 and terms 0.78 / 0.28 / 0.1 | §10 | Always-hit (clamp floor unused / a too high) vs never-hit; spread must not become the hit roll |
| Accuracy `a` 1.0 / 0.45 / 0.495 | §10; Hardened via §16 ×1.1 | CorpSec as accurate as operatives vs harmless fire (pillar 3 dies) |
| Weapon table (damage/range/delay/mag/reload/spread) | §10 discrete | Do not treat rows as continuous ranges; do not copy the table into this GDD |
| CorpSec 70% damage and 1.75× cooldown | §10 | Parity with operatives vs unkillable garrison |
| Guard sight 14 / 12.6 / 11.2 m; omni 4.5 m | §10 | Rain that changes accuracy or movement is out of spec; omni that scales with rain breaks the invariant |
| Hardened vision +1 m after weather | §16 discrete | Replacing rain instead of stacking; using this to hide information |
| Sight-confirm ×1.15 Hardened; ~0.45 s / ~1.7 s | §16 / §10 | Instant fire vs confirmation that pads the mission (pillar 2) |
| Extra patrols +2 / extra civilians +6 Hardened | §16 discrete | Standard≠baseline vs Hardened that hides the minimap (vetoed) |
| Optional time ×0.85 (90 s → 76.5 s) | §16 discrete | Window unused vs optional that gates the win |
| Unrest extras +6 civ / +1 street patrol above 20 | §5 / §10 | Control adding CorpSec HP is out of spec |
| Threat extras / elite mix | §10 names only; do not copy code tables | Moderate that already fields elites vs Severe that does not |
| Grenade 70→35 at 3.5 m, 18 m throw, 2.5 m snap, 24 m noise, 4 s squad CD, 1 cell | §10 | Empty-cell throws vs grenade as the primary weapon |
| Officer radio 4 s / 22 m | §10 | Instant map-wide combat vs a call that never matters |
| Civilian flee 10 m / 5 s / +50% speed | §10 | Decorative civilians vs lanes the player cannot read |
| `risk_index` weights 4/5/0.5, bands 30/50/75, `h` 1.0/1.1/1.2, `v` 1.0/0.9/0.8 | §5 | Treating the index as a percent or capping at 100; using Opening hour or live front as `v` |
| Chance readout clamp 35–95 | §9 names clamp; expression is `missionChance` (code) | Do not retune by pasting code bases into this GDD |
| Collateral 5,000 CR × `N` | Economy §6 | **Not a Tactical knob** — Tactical only counts `N` |
| Injury 0.35 / mass 400 kg / squad 1–4 / XP +1 | Roster registry | **Not Tactical knobs** — consume snapshot/outcome only |

**Interacts:** Hardened acc mul × `hit_chance` `a`; Hardened visionAdd × live `guard_vision`; unrest extras + Hardened extras + archetype bases → `p`/`c` into `risk_index`; clearer-script `v` into `risk_index` (not live front); `N` → Economy `collateral`. Difficulty must turn readable knobs (sight confirm, accuracy/cooldown, patrols, garrison mix, civilians, optional pressure) — not the minimap.

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Tactical requires the **five verbs** to read on the district: selection rings, routes, destination rings, stance feedback. Operatives are geometry with pips, not star models. CorpSec: rings, garrison marks, alert and suspicion markers, sight cones for suspicious and combat. Hits flash; operatives flash red, everyone else amber, with a brief flinch. Missed rounds must paint a readable fire lane (colored tracers); if stray fire is invisible, pillar 3 is broken. Building ghosting survives every quality tier (readability, not spectacle). Rain is two-layer camera-following when wet; a clear mission mounts no rain. Opening hour lights dusk or night; neon still reads; the sky does not change mid-fight.

Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. No second visual language for “gameplay.” No external art assets.

Audio confirms orders, marks danger, and prices violence. It does not narrate. Acknowledgements are a short selection click. Weapon reports sit above UI. Rain follows weather and is silent when none. Spoken VO and spatial audio are out of scope. Mix ownership is the Audio system.

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:tactical-mission` to produce per-asset visual descriptions, dimensions, and generation prompts from this section. (This project forbids an external art pipeline; asset-spec would describe generated-in-code geometry, not imported art.)

## UI Requirements

Screens and HUD belong to Interface. This GDD only requires that the five verbs remain the command language (chrome cannot bury them), that cones / patrols / garrison marks / objective pulses / weather chip / Opening hour clock are visible (pillar 2: Hardened does not hide the minimap), that stray fire is readable in tracers and the comm log, and that critical selection / injury / KIA / lock / objective / alert / result states have a non-color cue. Brief and deployment must agree on insertion, objectives, extraction, force/civilian counts, Opening hour, and weather-front timing. Debrief is the invoice beat — Interface presents; Economy prices; World Network applies sector/unrest; Persistence applies once.

**📌 UX Flag — Tactical Mission**: This system has UI requirements. In Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for Mission HUD, minimap, pause, result banner, and Brief-vs-deploy surfaces **before** writing epics. Stories that reference UI should cite `design/ux/[screen].md`, not this GDD directly.

## Acceptance Criteria

Living spec §20 Mission + Squad (tactical parts). Criteria are independently verifiable without the rest of this GDD. Existing automated checks sit next to `src/game/` and `src/world/` (`world.test.ts`, `missionParams.test.ts`, `forecast.test.ts`, `citygen.test.ts`). Open Questions are not ACs. Do not invent product performance budgets. Do not convert §20 playtest tasks (thresholds pending) into pass/fail gates. HUD clipping at 1280×720 is Interface, not Tactical.

### Command verbs

1. **GIVEN** a just-opened mission with at least one living operative and at least one dead operative, **WHEN** the mission starts, then Select-all (0 / backtick) is issued, then an order names the dead id, **THEN** the opening selection is exactly the living set, Select-all is exactly the living set, the dead id is never a valid order recipient (no-op), and keys 1–4 select a slot only if that operative is living.
2. **GIVEN** a selected living operative with an Explicit target and Hold Ground on, weapons free, **WHEN** Move is issued to walkable ground, **THEN** the Explicit target is cleared, Hold Ground is released, and along the route the operative stops to engage visible CorpSec when weapons are free, then resumes.
3. **GIVEN** a selected living operative with Hold Fire on and Hold Ground on, **WHEN** Attack is issued on a living hostile out of range, **THEN** the Explicit target is set and Hold Fire is overridden so the explicit shot still fires when in range and LOS, and Hold Ground prevents the chase while keeping that target.
4. **GIVEN** a selected living operative walking a path, **WHEN** Hold Ground is set, **THEN** the operative is pinned on the current tile, the active path is parked (restored on release), separation does not shove them off that tile, and they may still fire.
5. **GIVEN** a selected living operative who would auto-acquire a visible CorpSec in range, **WHEN** Hold Fire is set, then a later Attack is issued on a living hostile, **THEN** automatic targets are cleared and the operative does not auto-acquire, and the later explicit Attack still fires.
6. **GIVEN** a selected living operative with a path, an Explicit target, Hold Ground on, and Hold Fire on, **WHEN** Stop is issued, **THEN** pathing and targeting are cleared, and Hold Ground and Hold Fire stay on.

### Seed, brief, weather, Opening hour

7. **GIVEN** the same mission seed, **WHEN** the district, weather script, and Opening hour are built twice, **THEN** both builds match: same district, same weather script, same Opening hour.
8. **GIVEN** a selected contract’s brief and the deployed mission from that seed, **WHEN** insertion, sequential objectives, extraction, force/civilian counts, Opening hour, and weather-front timing are compared, **THEN** brief and deploy agree on all six. A mismatch is a Tactical/brief bug, not a sample of generated coverage.
9. **GIVEN** live weather none vs light vs heavy, then a scripted front at its fixed tactical time, **WHEN** CorpSec sight, weapon noise, accuracy, movement, and the 4.5 m omnidirectional notice radius are read before and after the front, **THEN** rain shortens CorpSec sight (14 / 12.6 / 11.2 m) and quiets weapons only; accuracy, movement, and notice radius are unchanged; the front retunes live sight and weapon noise; the comm log fires when the front hits.
10. **GIVEN** two deployments that differ only by Opening hour (dusk vs night) with the same weather script, **WHEN** CorpSec sight, weapon noise, and `risk_index` are computed, **THEN** sight, noise, and risk are unchanged; lighting is frozen from Opening hour (HUD clock still ticks; sky does not). Opening hour is independent of strategic time and of the weather script.

### Fire lane and collateral count (Tactical count, not Credits)

Tactical owns unique squad-caused civilian first-hits (`civiliansHit`). Economy prices Credits from that count — do not re-own `collateral` CR here.

11. **GIVEN** a fire-lane fixture where a squad miss continues into a civilian before cover, **WHEN** that first squad-caused civilian hit resolves, **THEN** `civiliansHit` increases by 1 (first hit, not death).
12. **GIVEN** that same civilian already counted, **WHEN** the squad hits them again, **THEN** `civiliansHit` does not increase.
13. **GIVEN** civilian harm caused only by CorpSec, **WHEN** those hits resolve, **THEN** `civiliansHit` stays 0 (telemetry may still record CorpSec-caused hits separately).
14. **GIVEN** cover between shooter and a Unit on the lane, **WHEN** a miss continues down the fire lane, **THEN** cover interrupts the lane and that Unit is not hit.

### Objectives, win, loss, abort, quiet replay, freeze

15. **GIVEN** an eliminate-tag required objective whose tag is garrison (street patrols untagged), **WHEN** every tagged Unit is dead and at least one untagged street patrol is still alive, **THEN** the eliminate objective completes and the required sequence can complete with that untagged patrol alive. Untagged street patrols do not gate eliminate.
16. **GIVEN** every required objective complete and every optional ignored or failed, **WHEN** the mission result is read, **THEN** the result is Win; optionals never gate the win; failing or ignoring an optional costs nothing to the win (bonus may be 0).
17. **GIVEN** a live mission, **WHEN** (a) no living operatives remain, or (b) a required escort VIP dies, or (c) a required objective timer expires, **THEN** the result is Loss.
18. **GIVEN** a mission in progress, **WHEN** Abort is confirmed, **THEN** there is no debrief, Tactical does not emit an outcome DTO, and there is no campaign write.
19. **GIVEN** an already-won authored contract replayed to a finish, **WHEN** the mission ends, **THEN** it is still a real mission that enters debrief; Tactical still emits an outcome DTO with `quietReplay` true. Economy/World Network zero currencies and sector shoves — do not re-own those zeros here.
20. **GIVEN** a mission already created (research, wear, Experience sampled), **WHEN** later research completes, wear/pins change, or a weather front hits, **THEN** on-ground weapons, HP, speed, and the Research slice stay at the sampled freeze; the weather front retunes sight/noise only and does not re-sample research.

### Difficulty and camera

21. **GIVEN** the same contract on Standard vs Hardened, **WHEN** extras and minimap data are read, **THEN** Hardened applies +2 street patrols, +6 civilians, sight-confirm ×1.15, CorpSec accuracy ×1.1, +1 m vision after weather, optional time-limit ×0.85; Standard matches the authored baseline; Hardened does not hide minimap cones or patrols (Tactical still emits them). Minimap chrome is Interface presentation of that data.
22. **GIVEN** a live mission, **WHEN** camera and minimap orientation are read, **THEN** the camera does not rotate or tilt in play (fixed 45° yaw, 55° elevation); minimap up is screen up (shared yaw). Not a HUD-clipping check.

### Grenade

23. **GIVEN** a living selected thrower, at least one power cell, grenade cooldown idle, and a confirmed land within 18 m that snaps onto pavement within 2.5 m, **WHEN** the grenade is confirmed, **THEN** one power cell is spent and the blast resolves (70 damage at centre falling to 35 at 3.5 m edge, LOS only).
24. **GIVEN** empty power cells, or a running squad grenade cooldown, **WHEN** a grenade confirm is requested, **THEN** the control is disabled or the throw is refused, and nothing is spent (cells and cooldown unchanged).

### Formulas

25. **GIVEN** `hit_chance = clamp((0.78 − 0.28 × d/r + (u − 0.5) × 0.1) × a, 0.05, 0.95)` with `d/r = 0.5` (half range) and zero jitter `u = 0.5`, **WHEN** chance is evaluated for an operative (`a = 1.0`) and for Standard CorpSec (`a = 0.45`), **THEN** chance is 64% and 28.8% respectively. Logic unit/fixture only — do not invent a playtest. Hardened CorpSec uses `a = 0.495` (0.45 × 1.1); Deadeye bypasses the hit roll.
26. **GIVEN** `risk_index = round(((4p + 5g) × h + 0.5c) × (0.7 + 0.3v))` with `p = 8`, `g = 7`, `c = 22`, `h = 1.2`, `v = 0.9`, **WHEN** `missionRisk` is evaluated, **THEN** index is 89 and band is Severe (≥ 75). Intel < 2 Chance readout vs intel 2+ Risk index is Interface/Brief presentation — Tactical still computes both `missionChance` and `missionRisk` regardless of intel.

### Flagged — not Tactical pass/fail

- **1–4 Ready deploy and mass gate (340 / 380 / 400 kg):** Roster and Assembly. Do not re-own.
- **Chance vs Risk index chrome:** Interface/Brief. Tactical still computes.
- **HUD clipping / truncation at 1280×720:** Interface (§20 UX).
- **Quiet banner copy `REPLAY // FEE ALREADY COLLECTED` and currency lines as not paid:** Interface presents; Economy/World Network zero; Tactical only emits the DTO.
- **§20 playtest tasks (Discovery, Role decisions, Collateral interview, Session experience):** observation only. Participant counts, time limits, intervention rate, and pass thresholds are pending — do not convert into gates.
- **§20 performance validation:** targets pending. No product-level budget or release gate.

## Open Questions

1. **Worn slotted ids.** Resolved by [ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md): Research slice = unslotted only; Roster owns resolved wear and ordered `appliedIds`. Implementation still samples inside `createWorld` today — migrate to the composer.
2. **Hold Fire vs standing Explicit target.** Living spec: clears automatic targets; later Attack still fires. Code also nulls a standing Explicit target when Hold Fire turns on. Extract aliases living spec. Owner: living spec vs `world.ts` — treat as a defect in one of them; do not fork here.
3. **Attack vs Device.** Living spec Attack = living hostile. Code accepts devices as Explicit targets. Extract aliases living spec. Do not add a Demolish verb. Owner: living spec vs `world.ts`.
4. **`quietReplay` stamp.** Frozen on the Economy slice as a boolean at create ([ADR-0009](../architecture/adr-0009-partitioned-deploy-snapshot.md)). Code still restamps from live `contractsWon` at outcome time (`maybeOutcome`, `setOutcome`, `reportMission`) — implementation debt, not an open owner cut.
5. **Same-step wipe vs required-complete.** Living spec does not name a tiebreak. Do not invent one. Owner: living spec §10 if it should name it.
6. **`missionChance` expression.** §16 points at `missionParams.ts`; clamp 35–95 is named. Do not promote code bases into this GDD. Owner: living spec if Chance should become a named formula.
7. **Sight-confirm interpolation** between ~0.45 s and ~1.7 s, **weaponNoise / rain noiseMul** magnitudes, and **threat-extra numeric tables** are code-owned. §10 names the behaviors. Do not copy code constants here.

---
