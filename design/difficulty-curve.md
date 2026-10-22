# Difficulty Curve: Nexus Reborn

> **Status**: Approved (proposals approved by the project owner 2026-10-21; implementation pending)
> **Author**: game-designer / systems-designer. Drafted 2026-10-21 from the living spec, the GDDs, and the shipped numbers in `src/game/`. Every "current" value below was read from source at `bd8ec17`; every "proposed" value was approved on 2026-10-21 and is not yet implemented.
> **Decision**: 2026-10-21, project owner: the four proposals (Intel-gate swap, seeded MODERATE market offer, four-row overlay, Brief KIT line) and the lever table's Proposed column are approved. Implementation path: `/propagate-design-change design/gdd/world-network.md` and `design/gdd/interface.md`, then stories. The lever table and Open Questions record what each approval changes.
> **Last Updated**: 2026-10-21
> **Links To**: `design/gdd/game-concept.md`, `design/gdd/game-pillars.md`
> **Relevant GDDs**: `design/gdd/tactical-mission.md`, `design/gdd/economy-and-contracts.md`, `design/gdd/world-network.md`, `design/gdd/roster-and-assembly.md`, `design/gdd/research.md`
> **Evidence**: `production/qa/playtests/playtest-2026-10-19-marco.md` (difficulty "Too Hard — high from the beginning, there isn't a curve at all")
> **Living spec**: `docs/game-design.md` §16 (Difficulty and balance), §19 #8, #9, #11 (closed). This document proposes a curve; it does not reopen §19.

---

## Difficulty Philosophy

Nexus Reborn is **accessible entry, opt-in depth, and an authored arc toward ease**. The living spec already fixes the shape of the long game: "the house becomes unstoppable: squad power grows uncapped while garrisons improve and threat extras retire with Control … late-campaign ease is the fantasy, not a defect" (`docs/game-design.md` §19 #11). Hardened is the opt-in depth, and it turns readable knobs rather than hiding the board (§16; Pillar 2). What this document adds is the front of the arc: the challenge of the first hour must be **reading**, not surviving. The player's advantages are "information, quality, and pause" (§16); a new director who has not yet learned to read cones, Control, Unrest and the Chance figure has none of those advantages and faces CorpSec's "numbers, coverage, and propagation" bare.

What the player is permitted to feel: **confused for one Screen, never for one contract.** They may be surprised by a consequence they could have read (an officer radio call, a stray round into a civilian, an Injured return) and should be able to name the cause on the Debrief invoice. They may not be surprised by an outcome they could not have read. Frustration is acceptable when it is priced and legible (a 5,000 CR collateral line, a 30-hour injury, a KIA codename); it is a defect when its cause is a number the player was never taught. The acceptable cost of failure is the one the spec already prices: credits, roster, time. Abort, reload and quit are free escapes by decision (§19 #8), so the design never needs to soften a loss further; it needs to make the loss readable.

**Diagnosis the curve must fix.** The simulation already contains a ramp. On Standard, with no research and sectors at their opening values, the Chance readout (`missionChance`, `src/game/missionParams.ts:283`) reads:

| Authored contract | Threat | Chance, no research | Chance, all 21 projects | Opens at Intel |
|---|---|---:|---:|---:|
| RUST HAVEN (Detroit Sprawl) | MODERATE | 82 | 95 | 2 |
| HOLLOW CROWN (Shingang) | HIGH | 55 | 95 | 2 |
| GLASS VEIL (New Carthage) | SEVERE | 36 | 78 | 1 |

(Computed by running `missionMods` and `missionChance` against `MISSIONS` with `NEUTRAL_SECTOR`; the Europe sector opens at unrest 18, so the "unrest above 20" extras do not apply on the first deploy.)

The only contract open at Intel 1 is the hardest one the campaign owns. A new director is handed a Severe checkpoint: 6 plaza garrison plus an 80-HP longrifle marksman, 5 base street patrols plus 3 Severe extras, CorpSec health ×1.2, one heavy, one officer with a radio, and 22 civilians at "collateral tolerance low". The orientation overlay's START HERE row ("take a contract when a sector needs it", `src/ui/WorldMap.tsx:660–724`) and the Glass Veil marker both point at it. Generated MODERATE work does open at Intel 1, but the first market roll lands two strategic hours in (`INITIAL_NEXT_CONTRACT_T`, `src/state/worldStore.ts:94`) and nothing tells the player to wait for it. The tester's verdict, "high from the beginning", is the curve working backwards.

---

## Difficulty Axes

| Axis | Description | Primary Systems | Player Control? |
|------|-------------|----------------|-----------------|
| **Knowledge (strategic)** | The cost of not knowing what Control, Unrest, Tax yield, Intel, Chance and the Feed mean, and which contract to take first. The 2026-10-19 playtest found this axis dominant: "I don't even know what that is." | World Network, Brief, Interface | Partially. The one-shot overlay and the Brief are the only teachers; nothing is taught in context yet. |
| **Knowledge (tactical)** | Not knowing the five verbs plus Q and G, sight confirmation, the officer radio, where grenades come from (power cells), or that the cell-lock override is an interact objective an operative must hold. | Tactical mission, tutorial toasts | Yes once taught; the nine toasts cover verbs but the playtest missed abilities, items and extraction mechanics. |
| **Reading the board** | Sight cones, patrol routes, awareness states, civilian lanes, weather. Certainty takes 0.45 s near and 1.7 s at cone edge (`SIGHT_NEAR_T`, `SIGHT_FAR_T`); the squad can still break off a half sighting. This is the skill the game is about (Pillar 2). | Tactical mission, minimap | Yes. Pause, Pulse Scan, the recon passive and rain all help; Hardened lengthens confirmation by ×1.15 but never hides the board. |
| **Numbers pressure** | CorpSec count and toughness per contract: threat extras (+0/+2/+3 patrols), HP ×1.0/1.1/1.2, heavy and officer upgrades, unrest adders (+1 patrol, +6 civilians above 20). CorpSec fire at 45% accuracy, 70% damage and 1.75× cooldown (`ENEMY_ACC`, `ENEMY_DMG_MUL`, `ENEMY_CD_MUL`). | Mission parameters, World Network | Partially. Threat is chosen by picking the contract; Control retires generated-threat extras over time. Not controllable inside a mission. |
| **Collateral pressure** | 22 civilians on a checkpoint, 14 on a compound, 8 on an industrial yard. Each unique squad-caused first hit costs 5,000 CR, capped at the reward, and forfeits the clean bonus (+2 Influence, +15 Intel). | Tactical mission, Economy | Yes: Hold Fire, per-target Attack, lane discipline, grenade placement. |
| **Time pressure** | Rare and always announced: Rust Haven's 45-second hold against a five-unit wave; Hollow Crown's 90-second server wipe on an optional (76.5 s on Hardened). The sim pauses at any time. | Tactical mission objectives | Yes. Pause is unconditional; the optional can be skipped. |
| **Resource pressure** | 128,450 CR opening credits against a 779,000 CR research program; hires 16,000 to 34,000 CR; Tax a trickle (4,080 CR/24 h from North America at opening). Grenades draw on a contested pool of power cells (base 2 med, 1 cell). | Economy, Research, Roster, Assembly | Yes: contract choice, optionals, loadout slots, research order. |
| **Attrition** | KIA is permanent. A survivor under 35% HP returns Injured for 12 to 48 strategic hours. Losing every operative is CAMPAIGN FAILED. This is the one axis the playtest reported as landing exactly as intended ("losing someone matters a lot"). | Roster, Campaign | Yes, by play; and by decision the player may abort or reload for free (§19 #8). |
| **Decision complexity** | Contract × squad × loadout × research order × Influence spend, all on one clock. | World Network, Assembly, Research | Yes through sequencing: the curve must introduce one layer per contract. |

Execution difficulty (precision and timing of inputs) is deliberately absent. Pillar 1: the skill is "tempo and position, not issuing every shot".

---

## Difficulty Curve Overview

Durations are in contracts and strategic days, not real minutes: no playtest has recorded session time yet (see Validation Checklist). Levels are relative to this game. 10 is Hardened Glass Veil with no research and high unrest; 1 is the Menu.

**Current arc** (as shipped at `bd8ec17`):

| Phase | Duration | Level | Primary challenge | Introduced | Observed state (playtest 2026-10-19) |
|---|---|---:|---|---|---|
| World Network, first minute | 1 Screen | 6 | Knowledge (strategic) | Nine-row overlay, four sector numbers, Feed, Influence, Research tab, clock | "Confused". Globe opened away from Europe. |
| First contract: Glass Veil | 1 contract, 2-day ETA | 8 | Numbers + collateral + tactical knowledge at once | Every verb, abilities, items, officer radio, heavy, marksman, 22 civilians, weather front | "Too Hard — high from the beginning". Abilities and grenade source never discovered. |
| Market work to Intel 2 | 1 to 2 generated MODERATE contracts | 4 | Reading the board | Generated contracts, Expedite target, Tax tick | Not reached in the playtest. |
| Hollow Crown / Rust Haven | 2 contracts, 4 + 3 days | 5 to 6 | Time pressure, escort | Timed optional, VIP escort, hold wave, destroy objectives | Not reached. |
| Post-spine sandbox | Open | 3, falling | Resource pressure | Hardened opt-in, research completion, roster growth | Not reached. |

**Approved arc** (the change set is in Balancing Levers; nothing in §19 moves):

| Phase | Duration | Level (1-10) | Primary Challenge Type | New Systems Introduced | Target Player State |
|-------|----------|------------------------|----------------------|----------------------|---------------------|
| 0. Menu, Settings | 1 Screen | 1 | None | Text scale, Hardened toggle, quality | Oriented. Knows Hardened exists and is not the default. |
| 1. World Network, first minute | 1 Screen, clock paused | 2 | Knowledge (strategic), narrowed to four numbers | Focus, Pause/speed, Control / Unrest / Tax / Intel, Feed. Not Influence, not Research. | "Cold procedural focus" (pillars Emotional Arc). Knows which sector pays and which contract is open. |
| 2. First contract: a MODERATE | 1 contract, 2 to 3 days | 3 to 4 | Tactical knowledge, one layer at a time | Select, Move, Attack, stances, Hold Fire, extraction. Abilities and items are present but not needed. | Learning with a safety margin: Chance about 80. First Debrief invoice read: fee, Tax catch-up, Influence +6 or +8. |
| 3. Market work | 1 to 2 generated MODERATE, Tax ticks between | 4 | Reading the board; first Influence spend | Research tab (first 2-hour project), Stabilize or Lobby, candidate hires, injury clock if a loss | Competent. Predicts a patrol route and is right. Reaches Intel 2. |
| 4. Hollow Crown (HIGH) | 1 contract, 4 days | 5 to 6 | Time pressure + escort | Timed optional (90 s), VIP escort, bypassable garrison, heavy | Tense, strategizing. First optional decision: take the 9,000 CR or protect the asset. |
| 5. Rust Haven (MODERATE, dusk) | 1 contract, 3 days | 5 | Kit knowledge + hold wave | Destroy objectives and the power-cell pool, 45-second hold, full-range vision (no rain) | Planning a loadout for the job: cells for relays, Demolitions on the squad. |
| 6. Glass Veil (SEVERE) | 1 contract, 2 days | 7 to 8 | Numbers + collateral | Officer radio, marksman, 22 civilians, weather front mid-mission | The spike. Everything learned is tested. Rain is the ally the Brief promised. |
| 7. Post-spine sandbox | Open | 4, falling toward 2 | Resource pressure (447,550 CR research gap) | Hardened opt-in, Experience and mass tier, crisis sectors, priority contracts | "The house becomes unstoppable". Hardened is the only climb left and is chosen, not imposed. |

Phase order between 4 and 5 is the player's: both open at Intel 2 and neither is required before the other. The table lists Hollow Crown first because its optional is timed and announced, which teaches time pressure before Rust Haven's hold does.

---

## Onboarding Ramp

### What the Player Knows at Each Stage

| Time | What the Player Knows | What They Do Not Know Yet |
|------|-----------------------|--------------------------|
| Menu | They direct a corporation from a terminal (Pillar 5 chrome does this unaided). | Everything mechanical. |
| World Network, 0 to 1 min | Four numbers per sector; Pause and speed; which sector pays Tax; one contract is open and its Chance. | Influence actions, Research, generated contracts, Intel levels. |
| First Brief | Threat, reward, Chance, objectives in order, weather, civilian count, collateral tolerance, which kit the objectives need. | Risk index (Intel 2), officer radio, how the sector moves on a win. |
| First mission, 0 to 2 min | Select, Move, Attack, the Alert sting, Pause. | Abilities, items, weapon swap, stances. |
| First mission, 2 to 6 min | Hold Fire and Hold Ground, extraction zone. Has made one decision that cost something (a shot, a route). | Whether a cleaner route existed. |
| First Debrief | The invoice: fee, collateral if any, Tax catch-up for the ETA, Influence, Intel progress, sector shift, roster state. | How to spend Influence; what Research changes. |
| Second contract chosen | Reads Chance against Threat and picks. Has opened the Research tab and started a 2-hour project. | Hardened; the mass gate; crisis sectors. |

### Mechanic Introduction Sequence

| Mechanic | Introduced At | Introduction Method | Stakes at Introduction |
|----------|--------------|--------------------|-----------------------|
| Focus, Pause/speed, four numbers, Feed | World Network minute one | Overlay reduced to THE JOB and START HERE plus one row per number, each number labelled on the readout itself (art bible §7.3/§7.5) | None, clock paused |
| Contract selection by Threat and Chance | World Network, after the overlay | START HERE names the open MODERATE contract and its Chance; the Glass Veil marker is visible but reads SEVERE and its Chance | Low, reversible until Deploy |
| Brief: objectives, weather, counts, required kit | First Brief | Brief adds a KIT line per objective kind (destroy: power cells arm grenades, gunfire works slowly; interact: an operative holds the console for N s; escort: the asset must reach the pad alive; defend: hold N s) | Low, back to World Network is one visible control |
| Select, Move | Mission, first 30 s | Toasts 1 and 2 | None until the first cone |
| Attack, Hold Fire, Hold Ground | Mission, first contact | Toasts 3 and 4; Alert advisory on the first combat state | Low on a MODERATE (82 Chance) |
| Role ability (Q), Items (G, med kit) | Mission, when the first cooldown is ready or HP drops | Toast 5 and 6, ABILITY READY advisory after 60 s idle, CASUALTY RISK under 35% | Low; a missed Q keeps its cooldown but costs nothing else |
| Weapon swap, Directives, Extraction | Mission mid to end | Toasts 7 to 9 | Low |
| Research | After the first Debrief | Overlay row 9 moves to a first-Debrief prompt naming the RESEARCH tab and the cheapest available project, e.g. "The BALLISTICS LAB is idle. 14,000 CR starts BARREL WEAR COATING in 2 hours." "Available" means `eligibilityText` null **and** cost ≤ Credits after the payout (decided 2026-10-22, IF-014); when nothing qualifies the prompt waits, unfired, for a later Debrief. | Low, 2-hour project, cheap |
| Influence | After the first win (6 or 8 points) | Sector panel prints what a Stabilize costs and does, at the moment it becomes affordable | Low |
| Timed optional | Hollow Crown | Brief note and in-mission timer | Moderate, 9,000 CR optional only |
| Hold wave, destroy kit | Rust Haven | Brief KIT line; wave announced in the briefing text | Moderate |
| Officer radio, marksman, collateral at scale | Glass Veil | Brief threat extras; the 22-civilian count | High, by design |
| Hardened | Settings, any time | Settings copy states the six knobs | Player's choice |

### The First Failure

The intended first failure is **a stray round into a civilian on a MODERATE contract**, not a KIA on a Severe one. It is caused by firing down a lane with a fleeing civilian in it; the sim logs `CIVILIAN HIT. COLLATERAL COUNT 1.` the moment it happens (`src/game/world.ts:739`) and the Debrief prices it at 5,000 CR with the clean bonus gone. The player learns Hold Fire and lane discipline. Retry is the next contract; the cost is one line on one invoice. Cause and effect are bridged twice: the alert log line during the mission and the invoice row after it.

The second first failure, which the current build makes the actual first one, is **an Injured return**: a survivor under 35% HP sits out 12 to 48 strategic hours. This should land on the second or third contract, when a 24-hour ETA jump no longer hides it (win-erases-wounds applies only to the authored ETAs, which are longer than the maximum recovery).

KIA should not be reachable before the player has seen both of the above, except by choice. On a MODERATE, with CorpSec at 45% accuracy and 70% damage, a KIA requires standing in two or three cones at once; that is a readable mistake. On Severe Glass Veil as the first contract, a KIA is not readable because the officer radio and the marksman have not been introduced.

### When the Player First Feels Competent

The moment is **the first prediction that comes true**: the player pauses, reads a patrol's route and its cone, moves the squad to the flank, resumes, and the patrol walks past without a sighting. On a MODERATE contract with 3 base patrols this is available within the first two minutes of the first mission. The game confirms it the way it already does: no Alert sting, the awareness bar bleeding back down (`AWARE_DECAY` 0.22/s), and the objective pulse still live. The Debrief seals it with a clean-win line (+2 Influence, +15 Intel).

This must happen on contract one. The current build cannot deliver it on contract one because 8 patrols plus a 7-strong plaza garrison with a 26 m longrifle leave no quiet flank for a player who does not yet read cones.

---

## Difficulty Spikes and Valleys

| Name | Location in Game | Type | Purpose | Recovery Design |
|------|-----------------|------|---------|-----------------|
| The four numbers | World Network, minute one | Knowledge wall (currently a spike; should be a step) | Teach Control / Unrest / Tax / Intel as actionable values | Labelled readout, overlay cut to the numbers, clock paused until the first unpause |
| First contact | First mission, first patrol | Step | Teach cones and Hold Fire with margin | 82 Chance; patrols of 3 on the industrial archetype |
| First invoice | First Debrief | Valley | Reward the read: fee, Tax catch-up, Influence, sector shift | ETA jump pays Tax and heals; first Research project affordable |
| Market work | 1 to 2 generated MODERATE | Valley | Practice the loop; reach Intel 2; first Influence spend | Low stakes; Stabilize affordable after one clean win |
| The server timer | Hollow Crown optional | Spike (time) | First clock inside a mission; optional, so declinable | 9,000 CR bonus either way; VIP escort is the required path |
| The hold | Rust Haven objective 4 | Spike (numbers, 45 s) | First forced engagement; tests stances and position | Announced in the Brief; wave is 5 units at Moderate HP; extraction immediately after |
| The checkpoint | Glass Veil | Spike (all axes) | Culmination: officer radio, marksman, heavy, 22 civilians, weather front mid-mission | 85,000 CR, the largest fee; rain front clears at T+150 s so the second half is harder, not easier: tell the player in the Brief, which it already does |
| First loss (Injured or KIA) | Whenever it lands | Spike (attrition) | Make roster permanence real | Hire market (3 candidates, one new per 24 h); injury clock visible on the roster |
| Campaign complete | All three authored won | Valley, then plateau | "The house becomes unstoppable" | Hardened is the only remaining climb; quiet replay is free practice |
| CAMPAIGN FAILED | Roster empty before completion | Floor | The only unrecoverable state | Debrief offers no Replay; New Operation. Hire-on-failed is open (Roster OQ1). |

---

## Balancing Levers

"Current" is what `src/game/` applies at `bd8ec17`. "Proposed" was approved by the project owner on 2026-10-21 and lands through `/propagate-design-change` on the owning GDD, then stories; until then the game runs the Current column. Ranges are proposed operating ranges, not validated ones: §16 says the Hardened profile is a discrete supported setting and this document does not change that.

| Lever | Phase(s) | Effect | Current Setting | Proposed (approved 2026-10-21) | Tuning Range | Owner / Notes |
|-------|----------|--------|----------------|----------|-------------|-------|
| Authored Intel gates (`intelReq`) | 2, 4 to 6 | Which authored contract a new director can take first | Glass Veil 1; Hollow Crown 2; Rust Haven 2 | Rust Haven 1; Hollow Crown 2; Glass Veil 2 | 1 to 3 | `data.ts`; `world-network.md:41`. Makes the only Intel-1 authored contract the MODERATE one (Chance 82). Campaign completion is unchanged (all three). |
| First market roll (`INITIAL_NEXT_CONTRACT_T`) | 1 to 2 | When the first generated contract appears | 2 strategic hours | 0 (one MODERATE offer seeded at New Operation in a Secure sector) | 0 to 2 h | `worldStore.ts:94`, `contracts.ts`. Gives START HERE a second low-threat target without touching the authored spine. Must keep the market deterministic from `INITIAL_CONTRACT_RNG`. |
| Intel per win (`MISSION_INTEL`, `CLEAN_INTEL`) | 3 | How many wins reach Intel 2 | 40 + 15 clean, from 25/100 | Unchanged; see Open Questions | 40 to 50 | `campaignStore.ts:24`. Two wins reach Intel 2 today (one clean win stops at 80). With Rust Haven at Intel 1 that is Rust Haven plus one market contract, which is the intended Phase 3. |
| Threat extras (`THREAT_EXTRA`) | 2 to 6 | Street patrols added by threat | 0 / 2 / 3 | Unchanged | 0 to 4 | `missionParams.ts:37`. The ramp 82 / 55 / 36 is right; it is the order that is wrong. |
| CorpSec HP multiplier (`THREAT_HP_MUL`) | 2 to 6 | Toughness; also pushes a 60-HP trooper above grenade centre damage at Severe (72 HP) | 1.0 / 1.1 / 1.2 | Unchanged | 1.0 to 1.25 | `missionParams.ts:43` |
| Base civilians per archetype (`CIVILIANS`) | 2 to 6 | Collateral exposure | checkpoint 22, compound 14, industrial 8 | Unchanged | 6 to 28 | `missionParams.ts:62`. The order industrial → compound → checkpoint is the intended collateral ramp. |
| Unrest adders | 2 to 7 | +1 patrol, +6 civilians above unrest 20 | Threshold 20 | Unchanged; Europe opens at 18 | 20 to 30 | `missionParams.ts:140`. See Cross-System: two riot events can tip the first authored contract over 20 before the first deploy. |
| CorpSec accuracy / damage / cooldown | All | Lethality | 0.45 / 0.70 / 1.75 | Unchanged | 0.40 to 0.50 / 0.6 to 0.8 / 1.5 to 2.0 | `world.ts:84–86`. Hardened ×1.1 on accuracy only. |
| Sight confirmation (`SIGHT_NEAR_T`, `SIGHT_FAR_T`) | All | Time to break off a half sighting | 0.45 s / 1.7 s | Unchanged | 0.4 to 0.6 / 1.5 to 2.2 | `world.ts:66–67`. Hardened ×1.15. Infiltrator passive 25% slower. |
| Guard vision (`ENEMY_VISION`) | All | 14 m clear; 12.6 light rain; 11.2 heavy | 14 m | Unchanged | 12 to 16 | `types.ts:364`. Rain is Glass Veil's ally and the reason a Severe contract is workable (`game-design.md:733`). |
| Grenade damage (`GRENADE_DAMAGE_CENTER/EDGE`) | 5 to 6 | Whether a grenade kills a trooper | 70 / 35, radius 3.5 m | Review in `/balance-check tactical-mission` | 60 to 90 centre | `world.ts:107–108`. Kills a 60-HP trooper only near centre at Moderate; never a Severe trooper (72) or a heavy. Playtest: "it should kill those guys". |
| Starting item pool | 2 to 6 | Grenades and heals available | 2 med, 1 cell (+1 cell Tech, +2 med Medic, +1 med Support, +1 per slot) | Unchanged; Brief states required kit | 1 to 3 cells | `world.ts:303`, `mass.ts`. The pool is the right pressure; its invisibility is the defect. |
| Collateral fine (`COLLATERAL_FINE`) | All | Price per unique squad-caused civilian hit, capped at reward | 5,000 CR | Unchanged | 3,000 to 8,000 | `appStore.ts:72`; ADR-0021 §4 |
| Injury recovery | All | Downtime for a survivor under 35% HP | 12 to 48 strategic hours | Unchanged | 12 to 72 h | `campaignStore.ts:31`. Authored ETAs (48 to 96 h) exceed the maximum: win-erases-wounds by decision. |
| Research bonus to Chance | 3 to 7 | +2 per completed project | +2 × count, cap 95 | Unchanged | 1 to 3 | `missionParams.ts:299`. Full program lifts Glass Veil from 36 to 78. |
| Experience | 7 | +2 max HP, +0.05 m/s per survived mission, uncapped; mass gate at 400 kg is the brake | As stated | Unchanged (§19 #8, #11) | n/a | `experience.ts`, `mass.ts` |
| Hardened profile (`DIFFICULTY_FX`) | 7 | +2 patrols, +6 civilians, confirm ×1.15, accuracy ×1.1, +1 m vision, optional window ×0.85 | As stated | Unchanged | Discrete profile only (§16) | `missionParams.ts:94`. Hardened Glass Veil at no research reads 35, the floor. |
| Overlay density | 1 | Rows a new director reads before the first unpause | 9 rows | 4 rows (THE JOB, START HERE, STRATEGIC TIME, the four numbers); Influence and Research move to the moment they first matter | 3 to 5 | `interface.md`, `world-network.md` Core Rule 13. Design change; needs `/propagate-design-change`. |

---

## Player Skill Assumptions

| Skill | Introduced In | Expected Mastered By | Taught By | First Hard Test |
|-------|--------------|---------------------|-----------|-----------------|
| Reading Control / Unrest / Tax / Intel | World Network minute one | Phase 3 | Labelled readout; overlay rows; Feed lines that name the number they moved | Choosing a sector to Stabilize (Phase 3) |
| Choosing a contract by Threat and Chance | World Network, first pick | Phase 3 | START HERE naming the open MODERATE and its Chance; Brief header | Deciding when Glass Veil is worth taking (Phase 6) |
| Select, Move, Stop | First mission, 0 to 30 s | First mission | Toasts 1 and 2 | Hollow Crown escort (Phase 4) |
| Hold Fire and per-target Attack | First mission, first contact | Phase 3 | Toasts 3 and 4; the first `CIVILIAN HIT` log line | Glass Veil market blocks, 22 civilians (Phase 6) |
| Reading cones and awareness | First mission | Phase 3 | Visible cones, awareness bar, Alert advisory, Pulse Scan | Glass Veil officer radio (Phase 6) |
| Abilities (Q) | First mission, first cooldown ready | Phase 4 | Toast 5; ABILITY READY advisory; Team screen dossier | Hollow Crown server timer (EM Burst or Ghost Veil buy the 4-second channel) |
| Items (G grenade, med kit) and the cell pool | First mission, first low-HP or first destroy objective | Phase 5 | Toast 6; CASUALTY RISK advisory; Brief KIT line | Rust Haven three relays (Phase 5) |
| Loadout and mass | Assembly, second contract | Phase 5 | Mass readout, tier line, HEAVY LOADOUT advisory | Rust Haven with Demolitions plus cells (Phase 5); the 400 kg gate much later |
| Research sequencing | First Debrief | Phase 7 | First-Debrief prompt; benefit lines generated from effects | The 447,550 CR gap after the spine |
| Influence spends | After the first win | Phase 4 | Sector panel printing cost and effect when affordable | Pulling a sector out of crisis (Phase 7) |
| Timed objectives | Hollow Crown optional | Phase 6 | Brief note; in-mission timer | Hardened Hollow Crown, 76.5 s |
| Escort | Hollow Crown | Phase 6 | VIP follow and the console channel; Brief states a body must hold the console | None later in the authored spine; generated extraction contracts |
| Accepting a loss honestly | First Injured return | Phase 7 | Roster clock; Debrief injury line | First KIA |

Undocumented knowledge walls found in the playtest, each now listed above with a teacher: abilities, grenade source, extraction console, Influence actions, per-24 h income. Two remain code-only and need GDD text: the officer radio (taught by nothing before Glass Veil) and the extraction console rule (BUG: the asset frees early; see playtest bug 1).

---

## Accessibility Considerations

### What Can Be Adjusted

| Adjustment | Method | Effect on Experience | Tradeoff |
|-----------|--------|---------------------|----------|
| Hardened | Settings; survives New Operation | +2 patrols, +6 civilians, confirm ×1.15, accuracy ×1.1, +1 m vision, optional windows ×0.85. Raises numbers and collateral pressure; never hides information. | Hardened Glass Veil with no research reads the 35 floor. Hardened is depth, not the default. |
| Tactical pause and strategic speed | Space/Escape; 1× to 8× clock | Removes all time pressure from reading; the 45 s hold and 90 s timer run only while unpaused | None; Pillar 1 and §16 list pause as a player advantage |
| Text scale | 90 / 100 / 110 / 125%; surfaces scroll, never compress | Readability at 1280×720 | None (IF-001) |
| High contrast, reduced motion | Settings | Readability of cones, rings, and the Alert state | None |
| Squad size | Assembly, 1 to 4 | Fewer bodies, fewer lanes, same contract | §19 #9: contracts do not scale; solo is legal, not supported |
| Quiet replay | Debrief after a win | Free practice on the other authored layout | Pays nothing; still costs roster and ETA |

### What Cannot Be Adjusted (and Why)

| Fixed Element | Why It Cannot Change | Design Reasoning |
|--------------|---------------------|-----------------|
| Minimap, cones, CorpSec states | Pillar 2 veto; `accessibility-requirements.md:64` | Information is the player's advantage; difficulty adds patrols, never darkness |
| KIA permanence and CAMPAIGN FAILED | §19 #8; Roster GDD | Attrition is the one axis that landed as intended; without it a loss costs nothing |
| Unsaved mission | ADR-0002; anti-pillar | Commitment is the cut. Abort and reload remain free escapes by decision. |
| Collateral pricing | Pillar 3 | Violence has corporate consequences; the fine is the lesson |
| Contract scaling with squad size | §19 #9 | Squad size is a player choice, not a difficulty slider |
| A third difficulty profile | §16: "supported discrete profiles, not validated ranges" | An Easy profile is not needed if the first contract is MODERATE; revisit only if playtests 2 and 3 still read "too hard" on the proposed arc |

---

## Cross-System Difficulty Interactions

| System A | System B | Combined Effect | Intended? |
|----------|----------|----------------|-----------|
| Intel gates (authored) | Chance readout | The only Intel-1 authored contract is the Severe one; the curve runs 36 → 55 → 82 in the order the player is allowed to take it | No. Fix via the Intel-gate lever. |
| Intel gates | Generated market | Generated MODERATE work needs Intel 1 but the first roll is 2 strategic hours in; a paused clock never produces it | No. Seed one MODERATE offer at New Operation. |
| Intel awards | Authored spine | One clean win reaches 80/100; the player must win twice before Hollow Crown or Rust Haven open; after a Glass Veil-first win the Scan can show "nothing open but a quiet Glass Veil" (`world-network.md:281`) | Partial. Intended as a market push; a wall when the first win was the Severe one. |
| Unrest threshold (20) | Europe opening unrest (18) | Two riot or raid events before the first deploy tip Glass Veil to 4 extras and 28 civilians; the Brief shows the live counts but a new player cannot read why they rose | Partial. Fine on contract six; wrong on contract one. The Intel-gate change removes the exposure. |
| Heavy rain | Severe threat | Glass Veil's 11.2 m vision is the only reason a Severe checkpoint is workable at no research; the front clears to light rain at T+150 s, so the second half is harder | Yes, and the Brief says so. |
| Officer radio | 22 civilians | A 22 m convergence onto the squad's last position pushes fire into the market blocks; collateral and awareness compound | Yes on Glass Veil; it must not be the first mission. |
| Power cells | Grenades and ability recharge | One shared pool; a Tech adds a cell, the Demolitions Frag Charge does not consume one. A destroy contract with no cells planned is slow gunfire ("GUNFIRE WORKS, SLOWLY") | Yes as pressure; No as a surprise. Brief KIT line fixes the surprise. |
| Grenade damage (70) | Severe HP ×1.2 (72) and heavies (100 × 0.85 taken) | A centred grenade never kills a Severe trooper or any heavy | Unverified intent. Route to `/balance-check tactical-mission`. |
| Experience | Mass gate | Each survived mission adds 2 HP and 0.5 kg of armour mass per operative; the 400 kg gate bites after roughly 57 wins from the default squad | Yes (§19 #8): the slow brake. |
| Abort / reload | Attrition | Free escape from every ledger; scout-and-abort dominates taking a loss | Yes, accepted (§19 #8). The curve does not depend on it. |
| Win-erases-wounds | Authored ETAs | Any authored win heals every injury; injuries bite only on losses and on generated 2-day ETAs | Yes, intended mercy. |
| Hardened optional multiplier | Hollow Crown server | 90 s becomes 76.5 s; EM Burst (4 s) or Ghost Veil (6 s) still buy the channel | Yes. |
| Tax yield | Sector ownership | Only Nexus-held sectors pay; Europe's 2,468 CR/24 h prints but does not deposit. The playtest did not notice any income | Yes by design; No in presentation. Interface GDD change (readout labels). |
| Research count | Chance | Every project is +2 Chance regardless of relevance, and worn gear is not checked | Partial. Accepted simplification (`research.md:46`). |
| CAMPAIGN FAILED | Hire market | Whether a director with no operatives can hire is open (Roster OQ1) | Open. |

---

## Validation Checklist

Playtests 2 and 3 (gate blocker 2) should run on the proposed arc or, if it is not approved, on the current build with the tester told to wait for a MODERATE market contract before deploying. Record session time per phase; no playtest has yet.

### Onboarding (World Network, 0 to 5 min)
- [ ] Tester states, unprompted, which sector pays Tax and roughly how much per 24 h
- [ ] Tester reads Control and Unrest as two different things and names one action each number suggests
- [ ] Tester identifies the open contract with the highest Chance before deploying
- [ ] Globe opens on Europe (`world-network.md:21`; playtest bug 3 closed)
- [ ] Zero rows of the overlay are described as "I don't know what that is"

### First contract (proposed: MODERATE)
- [ ] First deploy has Chance 70 or higher on the Brief
- [ ] Tester moves the squad around at least one patrol without a sighting (first competence moment) and says so
- [ ] Tester uses Hold Fire at least once before the first civilian hit, or has no civilian hit
- [ ] Zero KIA on the first contract for a tester who does not choose Glass Veil
- [ ] Tester can state what the Debrief invoice paid and what it cost, line by line

### Market work and Intel 2
- [ ] Tester starts a Research project before the second deploy without being told the tab exists
- [ ] Tester spends Influence once by the third Debrief and can say what it did
- [ ] Intel 2 reached by the third win at the latest

### Hollow Crown and Rust Haven
- [ ] Tester knows before deploying that Rust Haven relays want power cells and plans the loadout
- [ ] Tester decides on the server optional deliberately (takes it or declines it, with a reason)
- [ ] Tester fires an ability on purpose at least once per contract
- [ ] A loss on either, if it happens, is explained by the tester without prompting

### Glass Veil
- [ ] Tester calls Glass Veil the hard one before deploying, from Threat and Chance alone
- [ ] Tester notices the weather front changing the fight and says whether the Brief warned them
- [ ] An officer radio convergence is noticed as such ("they all came at once") at least once in three sessions
- [ ] A KIA or Injured return here is accepted as fair by the tester

### Post-spine
- [ ] Tester with the campaign complete chooses whether to turn on Hardened and can say what it changes
- [ ] No tester reports a difficulty complaint on a single axis in two of three sessions (frustration is distributed)

### Accessibility
- [ ] Hardened leaves every minimap channel intact (regression: `accessibility-requirements.md:64`)
- [ ] Text scale 125% reaches every Brief line including the KIT line without compression
- [ ] Pause during the 45 s hold and the 90 s server timer freezes both

---

## Open Questions

| Question | Owner | Deadline | Resolution |
|----------|-------|----------|-----------|
| Approve the Intel-gate swap (Rust Haven 1, Glass Veil 2) or an alternative first contract? Changing `intelReq` touches `data.ts` (contract file), `world-network.md:41` and the campaign save validator. | project owner, game-designer | Before playtest 2 | **Approved 2026-10-21**: Rust Haven `intelReq` 1, Hollow Crown 2, Glass Veil 2. Implement via `/propagate-design-change design/gdd/world-network.md`; check the save validator and the Scan lock text. |
| Seed one MODERATE generated contract at New Operation, or keep the 2-hour first roll and teach the wait? | game-designer, gameplay-programmer | Before playtest 2 | **Approved 2026-10-21**: seed one MODERATE offer in a Secure sector at New Operation; first timed roll unchanged after it. Must stay deterministic from `INITIAL_CONTRACT_RNG`; economy GDD market rules need the one-line addition. |
| Should one clean win reach Intel 2 (raise `MISSION_INTEL` to 50 or opening progress to 45), or is two wins the intended Phase 3 length? Links to `world-network.md:281` (intel stall). | game-designer | Before playtest 3 | Unresolved |
| Grenade centre damage 70 against Severe troopers at 72 HP and heavies: intended or an oversight? | systems-designer via `/balance-check tactical-mission` | Sprint close | Unresolved |
| Overlay cut from nine rows to four: which rows move to in-context prompts, and where does Research first appear? | ux-designer, game-designer via `/propagate-design-change design/gdd/world-network.md` and `interface.md` | Before playtest 2 | **Approved 2026-10-21**: four rows (THE JOB, START HERE, STRATEGIC TIME, the four numbers). Influence appears on the sector panel when first affordable; Research appears as a first-Debrief prompt. Row copy is the UX spec's to write. |
| Brief KIT line: a new Brief section (`interface.md`) or a note line per objective in `data.ts`? | game-designer, ui-programmer | Before playtest 2 | **Approved 2026-10-21** as a Brief requirement. Placement (section vs per-objective note) is the UX spec's call; the data must come from the objective kinds, not hand-written notes, so generated contracts carry it too. **Copy corrected same day after TD-CHANGE-IMPACT:** devices die through the ordinary damage path, so destroy reads "power cells arm grenades, the fast tool; gunfire works, slowly" (not a requirement); the console is the interact objective, escort reads "the asset must reach the pad alive". Owner confirmed the four strings 2026-10-22. |
| Officer radio is taught by nothing before Glass Veil. Brief threat-extras text, or a one-shot advisory on the first radio call? | game-designer | Before playtest 3 | Unresolved |
| Does any tester still read "too hard" with a MODERATE first contract? If yes in two of three sessions, reopen the question of a third profile (which §16 currently excludes). | game-designer, creative-director | After playtest 3 | Unresolved |
| Hire on CAMPAIGN FAILED (Roster OQ1): a recoverable floor would change the attrition axis. | game-designer | Not blocking the gate | Carried from `roster-and-assembly.md` |
