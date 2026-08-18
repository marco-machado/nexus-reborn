# Nexus Reborn

The player is the Operations Director of Nexus Global: they read a corporate world, fund research, accept contracts, and command a four-operative strike team. This glossary is the language of that world. It is not a ruleset.

## The house

**Operations Director**:
The player. They fund programs, accept work, choose personnel, and issue orders. They never walk the street.
_Avoid_: Commander, hero, avatar, player character

**Nexus Global**:
The player house. It holds cities, issues internal directives, and still takes paid work from rivals.
_Avoid_: The company, the faction, the player team

**Strike Team 04**:
The house name for the tactical asset the director deploys.
_Avoid_: Party, fireteam, platoon

**Campaign**:
One persisted playthrough, from first login until it is marked complete or failed. A campaign is complete when all three authored contracts have been won. It is failed when the roster is empty and the campaign is not already complete. It cannot be both.
_Avoid_: Save, playthrough, run, profile

**New Operation**:
The menu action that erases the current campaign and starts another. Settings survive it. A mission in progress does not.
_Avoid_: New game, new campaign, reset — except as informal speech for this action

## Time

**Strategic time**:
The clock of the World Network and the laboratories. It does not run during a mission. After a win, the contract's ETA is spent here so labs, injuries, and recruitment catch up.
_Avoid_: World time, campaign time, game time

**Tactical time**:
The independent clock of one mission. Every mission opens at the same authored hour. The World Network does not tick while the team is in the field.
_Avoid_: Mission timer (that is an objective limit), world time

**Review time**:
A historical point on the World Network's 24-hour timeline. Scrubbing it does not change live state.
_Avoid_: Playback, rewind

**ETA**:
The strategic days a won contract costs, including a quiet replay. A loss spends none.
_Avoid_: Duration, mission length

## The World Network

**World Network**:
The director's job between missions: sectors, ownership, contracts, the strategic clock, the feed, credits, influence, roster, and intel.
_Avoid_: World, world map, strategy layer, overworld, network (alone)

**Sector**:
A continental theatre with its own control, unrest, garrison condition, and generated-contract market. Six sectors are open. Antarctica is locked at every intel level.
_Avoid_: Continent, region, zone, territory

**City**:
A named settlement with a corporate holder. A sector's color is the holder of the most of its cities; a tie is Contested.
_Avoid_: District (that is the mission layout), node, tile

**District**:
The 96 × 96 metre layout the squad deploys into. Three layout families exist: checkpoint, compound, and industrial.
_Avoid_: City (the strategic place), level, map, arena

**Corporation**:
A named house that can hold cities, commission work, or both. The city holders are Stratos Industries, Nexus Global, Helix Corp, and Omnicorp.
_Avoid_: Faction, team, color

**Holder**:
The corporation that currently owns a city. Contested and Unknown are map states, not holders. Sable Enterprises is a client house, not a holder.
_Avoid_: Owner, occupier

**Client**:
The house paying for a contract. An outside client is never paired with a Nexus-held city. Work Nexus signs itself is an Internal directive.
_Avoid_: Employer, contractor, issuer

**Client house**:
A corporation that commissions work and never holds cities. Sable Enterprises is the only one. It has no map color and never enters the generated-client pool.
_Avoid_: Peer corporation, holder

**Internal directive**:
A contract Nexus Global signs against a city it already holds. A sector held entirely by Nexus can post only these.
_Avoid_: Self-contract, house job

**Contested**:
A sector-color state: no single corporation holds the most cities.
_Avoid_: Warzone, disputed

**Unknown**:
An unsurveyed map state. Not a corporation.
_Avoid_: Fog, unexplored

**Control**:
How firmly the current order holds a sector, as a percentage. A mission win raises it. A loss lowers it.
_Avoid_: Ownership (that is city holders), influence, influence index

**Unrest**:
How unstable a sector is. High unrest weights world events toward that sector, adds street patrols and civilians to its missions, and can open Crisis.
_Avoid_: Chaos, heat, threat

**Unrest pressure**:
The decay that starts when unrest is above 60: the sector loses control on a clock, and its tax yield falls.
_Avoid_: Crisis (that is the higher band), bleed

**Crisis**:
A sector whose unrest is at 85 or above. It reads red, event frequency doubles, and its open generated contracts gain Priority. It clears once unrest falls under 70.
_Avoid_: Collapse, fail state, unrest pressure

**Garrison condition**:
A sector readout — Secure, Strained, or Critical — that helps set generated-contract Threat. It is not the tactical Garrison.
_Avoid_: Garrison (alone), defense

**World Event**:
A dated change on the strategic clock: riot, blackout, CorpSec raid, trade agreement, or seizure, plus contract, crisis, influence, and KIA notices.
_Avoid_: News, incident, log line

**Feed**:
The World Network log of World Events. It is a record, not a verb.
_Avoid_: Chat, news ticker, event list

**Event forecast**:
At intel 2+, the chance of each World Event category landing in the focused sector over the next six strategic hours.
_Avoid_: Prediction, horoscope, threat forecast

**Ownership**:
Which Holder has each city. A mission win hands the mission city to Nexus Global. A loss of a Nexus-held city returns it to its default holder. A flip re-clients that sector's open generated contracts.
_Avoid_: Control (that is the sector percentage), capture

## Currencies and intel

**Credits**:
The spendable currency for research and recruits. Successful contracts add their net payout. Failed contracts pay nothing. Authorization refuses an overdraw; it does not borrow.
_Avoid_: Money, cash, gold, CR as a concept name (CR is the unit)

**Influence**:
Spendable points for sector actions. They do not convert to or from Credits.
_Avoid_: Influence index, reputation, favor

**Influence index**:
The weighted average Control of the open sectors. Above 55 it trickles Influence. It is a readout, not a wallet.
_Avoid_: Influence, control, global control

**Influence action**:
A numbered sector spend with a cooldown: Stabilize (cuts unrest), Lobby (raises control), or Expedite (waives a generated contract's intel gate and extends its expiry).
_Avoid_: Policy, edict, button

**Intel**:
An earned level, filled by progress, that gates contracts and unlocks the Event forecast and the Risk index. A contract win awards progress. A Clean win awards more. A loss awards nothing.
_Avoid_: XP, rank, clearance (except as fiction on the login)

**Risk index**:
Low / Guarded / High / Severe, computed from the live deployment — patrols, garrison, civilians, toughness, and the clearer weather on the weather script — and shown on the brief at intel 2+ in place of a raw success percentage.
_Avoid_: Threat, threat level, difficulty, chance

**Threat**:
The contract band Moderate / High / Severe. It sets extra street patrols, enemy toughness, and which elites appear.
_Avoid_: Risk index, difficulty, alert, network threat level

**Network threat level**:
The World Network banner Nominal / Guarded / Elevated / Severe, taken from the worst open-sector unrest. It is not contract Threat and not the mission Alert.
_Avoid_: Threat, risk index, alert

## Contracts

**Contract**:
Work with a client, a city, a type, a threat, a reward, and an ETA. Accepting it is free. Authored and generated contracts are the same kind of work.
_Avoid_: Operation, mission (the deployment), job, gig, quest

**Authored contract**:
One of the three campaign-spine contracts: Glass Veil, Hollow Crown, Rust Haven. Winning all three marks the campaign complete. They stay replayable.
_Avoid_: Main mission, story mission, operation (except as flavor in briefing copy)

**Generated contract**:
Market work rolled from sector state. The network keeps a small open set. Offers expire. A fulfilled or failed generated contract leaves the market.
_Avoid_: Side mission, filler, random mission, procedural mission

**Priority**:
A tag on a generated contract: shorter expiry, and often a premium. Crisis and some riots apply it. Expedite can apply it by waiving the intel gate.
_Avoid_: Urgent, flagged

**Type**:
The job family of a contract: seizure, extraction, sabotage, or suppression. Type chooses the District family and the objective set.
_Avoid_: Mode, genre

**Reward**:
The contract fee in Credits, before Collateral and before any optional-objective bonus.
_Avoid_: Payout (that is the net after collateral and bonus), gold

**Brief**:
The translation of a contract into an operational plan. Its city, insertion, target, extraction, patrols, and counts must be the District that will be deployed.
_Avoid_: Cutscene, briefing room, dossier (the assembly page is the operative dossier)

**Replay**:
Running a contract again after success or failure. After a win, an authored contract rotates to its other District layout.
_Avoid_: New Game Plus, grind

**Quiet replay**:
A replay of a contract already won. It pays no Credits, Influence, or Intel, and does not move control or unrest. It is still a real mission: KIA, injury, experience, and ETA apply. The debrief names that zero: the fee was already collected.
_Avoid_: Practice, sandbox, diminished payout (the invoice is zero, not reduced)

## Research

**Research**:
The program that changes the next deployment. Unslotted projects apply to the whole squad. Slotted projects apply only to operatives who wear them. Effects are sampled when the mission is created and cannot change a team already on the ground.
_Avoid_: Loadout, skill tree, tech tree, upgrades (alone), locker

**Branch**:
One of three research columns: Ballistics, Cybernetics, or Control Systems. Each branch is one Laboratory.
_Avoid_: Tree, path, school

**Laboratory**:
The one active Project slot for a Branch. Three projects may run at once only if they are in different branches.
_Avoid_: Queue, bench, workshop

**Project**:
One research node: a credit cost, a strategic-time duration, prerequisites, and effects. Credits are spent the moment authorization succeeds. A project may be unslotted (always on) or tagged to one augmentation bay.
_Avoid_: Node, upgrade, card, tech, implant

**Unslotted project**:
A project with no bay tag. All of Ballistics. Its effects apply to the whole squad.
_Avoid_: Global upgrade, gun mod (as a separate system)

**Slotted project**:
A project tagged to Neural, Chest, Arms, or Legs. Cybernetics and Control Systems. Worn per operative.
_Avoid_: Implant, item, unlock (the research already happened)

**Augmentation bay**:
One of four seats on an operative — Neural, Chest, Arms, or Legs — that can wear one completed slotted project whose pattern belongs to that bay. The project is a blueprint: every operative may wear the same one. Death drops that operative's assignment, not the program.
_Avoid_: Implant (as a unique item), locker, label (the old meaning), slot, squad bay

**Stock issue**:
An empty augmentation bay. That operative wears no slotted project there.
_Avoid_: Unequipped, naked, default (current issue is the default)

**Current issue**:
The latest completed slotted project in a bay. Unpinned bays wear this, including on new hires.
_Avoid_: Latest, maxed, default loadout

**Pin**:
A bay setting that holds stock issue or an older completed project when a newer one finishes. Unpinned bays wear current issue.
_Avoid_: Lock, favorite, freeze, equip

## Roster and assembly

**Operative**:
A named person on the Roster. They have a role, health, speed, a primary weapon, a sidearm, and four augmentation bays. A kill is permanent.
_Avoid_: Agent, unit (that is any body in the District), soldier, merc, character

**Roster**:
The campaign's living operatives, capped at eight. The dead are gone. The injured cannot be assigned until strategic time finishes their recovery.
_Avoid_: Squad (that is the four), bench, team, pool

**Squad**:
The four operatives assigned to the current contract. Every mission deploys exactly four. Inspection and assignment are separate; at least one operative stays assigned while the player edits.
_Avoid_: Roster, party, loadout

**Squad bay**:
One of the four assignment seats on Assembly. A KIA leaves a bay empty. Deploy is disabled until all four are filled.
_Avoid_: Augmentation bay, slot, slot 1–4 (those are in-mission selection keys)

**Role**:
The operative's kit: Assault, Recon, Infiltrator, Demolitions, Sniper, Tech, Support, or Medic. Every role has one active and one passive.
_Avoid_: Class, job, specialist

**Role ability**:
The role's active (fired for the current selection) or its always-on passive.
_Avoid_: Skill, spell, power, ultimate

**Candidate**:
A procedural operative offered for Credits. The market shows three at a time and refreshes on the same strategic clock injuries recover on.
_Avoid_: Recruit (the act of hiring), applicant, merc

**Ready**:
An operative who can be assigned.
_Avoid_: Available, healthy, active

**Injured**:
A survivor who ended a mission below the injury threshold. They leave the squad at debrief and cannot be assigned until their downtime elapses.
_Avoid_: Wounded, downed, disabled

**KIA**:
An operative killed in a mission, removed from the Roster for good.
_Avoid_: Dead (as a roster state), casualty (the debrief count), wiped

**Experience**:
A point awarded to each survivor at debrief. Each point raises that operative's maximum health and speed on the next deployment, sampled the same way Research is.
_Avoid_: XP as a concept name, level, rank

**Assembly**:
The screen where the director inspects operatives, fills the four Squad bays, fills Item slots, and passes the mass gate.
_Avoid_: Team select, loadout screen, locker, barracks

**Deployment mass**:
The squad's carried weight. It is a real gate: over the limit, deploy is refused. It also sets a squad-wide speed tier.
_Avoid_: Weight, encumbrance, cargo

**Mass tier**:
The squad-wide speed band set by Deployment mass at deploy time: light, standard, or heavy.
_Avoid_: Weight class, mobility

**Item**:
A med kit or a power cell. Items are squad-shared pools, fixed at deployment. A med kit heals. A power cell finishes an ability cooldown or arms a Grenade.
_Avoid_: Consumable, equipment, inventory, loot

**Item slot**:
One of two extra seats on an operative at Assembly. A filled slot adds that Item to the mission pools and to Deployment mass.
_Avoid_: Loadout, inventory slot, augmentation bay

## The mission

**Mission**:
The tactical deployment that executes a Contract. It ends in a Win, a Loss, or an Abort. A mission in progress is not part of the campaign save.
_Avoid_: Contract, operation, night, level, match

**Insertion**:
The southern landmark where the squad enters the District.
_Avoid_: Spawn, start

**Extraction**:
The southern landmark the squad must reach to finish an extract objective. The extract completes when every surviving operative is inside its radius.
_Avoid_: Exit, evac (except as flavor)

**Landmark**:
A named zone in the District — insertion, extraction, target, and archetype extras — that objectives resolve against. Authored data names landmarks; it does not carry coordinates.
_Avoid_: Marker, waypoint, POI

**Weather**:
Rain on the mission: heavy, light, or none. It shortens CorpSec sight and quiets weapons. It does not change accuracy or movement. The brief prints the opening weather and any coming change.
_Avoid_: Rain as a separate system, climate

**Weather script**:
The determined weather for one mission, fixed when the mission is created: opening weather plus at most one adjacent change at a tactical time. Authored contracts carry an explicit script. Generated contracts roll one, including no change. The same contract seed produces the same script.
_Avoid_: Forecast (the brief is stating a fact), live weather roll, climate

**Difficulty**:
The player's Standard or Hardened setting. Hardened adds street patrols and civilians. It does not hide minimap information. It survives New Operation.
_Avoid_: Threat, risk index, hardened as a contract band

**Alert**:
The mission HUD level taken from how many living CorpSec are in Combat. It is not Awareness and not contract Threat.
_Avoid_: Alarm, wanted, threat

**Awareness**:
Per-CorpSec certainty, from none to a confirmed target. Sight and hearing raise it. Combat does not fall straight back to Patrol.
_Avoid_: Alert, detection, stealth meter

**Comm log**:
The in-mission record of orders, failures, and system lines. Empty or invalid item use reports here and spends nothing.
_Avoid_: Chat, radio, console

**Debrief**:
The invoice after a finished mission. It applies payout, sector movement, intel, influence, and roster changes exactly once, then returns the director to the World Network — or to the Brief to Replay. A quiet replay still debriefs: roster and ETA apply; currencies and sector do not.
_Avoid_: Results screen, score, post-game

**Abort**:
Leaving a mission without a Debrief. The mission is discarded. Strategic time does not advance. Roster and sector do not change.
_Avoid_: Resign, quit, surrender, lose

**Win**:
Every required Objective is complete. Optional objectives do not gate it.
_Avoid_: Success, extract (that is one objective kind)

**Loss**:
No living operatives remain, a required escort VIP dies, or a required time limit expires. A lost contract pays nothing.
_Avoid_: Fail (except as flavor), wipe (that is one cause), abort

**Clean win**:
A Win in which the squad hit no Civilian. It awards extra Intel and extra Influence.
_Avoid_: Perfect, no-kill, ghost

**Collateral**:
The Credits deducted from a successful contract for each unique Civilian the squad hit. Repeated hits to the same civilian do not stack. CorpSec-caused harm does not count. Deductions cannot exceed the Reward. A Loss already pays zero, so collateral cannot create debt.
_Avoid_: Fine (alone), penalty, murder count

## Opposition and bystanders

**CorpSec**:
Armed corporate security. They are the opposing force. They patrol, investigate, and fight. They are not a corporation on the map.
_Avoid_: Enemy, hostile (except as a click target), guard (except as flavor), cop

**CorpSec state**:
Patrol (authored route), Suspicious (last seen or heard point, then a scan), or Combat (pursue and fire).
_Avoid_: AI state, alert state, stance

**Archetype**:
A CorpSec build: Trooper, Heavy, Marksman, or Officer. Threat sets how many elites appear. The Officer radios nearby guards onto the squad unless stopped.
_Avoid_: Class, type, elite (alone)

**Garrison**:
The tagged CorpSec force bound to an eliminate objective, usually posted on the objective. Street patrols are not the Garrison unless they carry the tag.
_Avoid_: Garrison condition, defenders, bosses

**Street patrol**:
A CorpSec unit walking an authored route outside the Garrison. Killing them is optional unless they threaten the team or carry an eliminate tag.
_Avoid_: Patrol (the CorpSec state), wanderer, extra

**Civilian**:
A bystander in the District. They wander when calm and flee from nearby gunfire. They exist to complicate fire lanes and to price Collateral.
_Avoid_: NPC, extra, crowd

**VIP**:
A fragile escort body. A dead VIP voids every unfinished escort. A required escort VIP dying is a Loss.
_Avoid_: Asset (except as briefing flavor), hostage, target (that is a landmark)

**Device**:
A tagged object an eliminate-style destroy objective must reduce to nothing.
_Avoid_: Prop, objective item, bomb (except as flavor)

**Unit**:
Any living or targetable body in the District: operative, CorpSec, civilian, VIP, or device. A missed round hits the first Unit in the fire lane.
_Avoid_: Actor, entity, pawn, agent

## Orders and combat

**Select**:
Choosing which living operatives will receive the next order. The dead are never valid recipients.
_Avoid_: Focus, target (that is a hostile)

**Move**:
An order to walk to ground. It clears an Explicit target and releases Hold Ground. Operatives stop to engage visible hostiles when weapons are free, then resume.
_Avoid_: Path, walk, go

**Attack**:
An order that sets an Explicit target. It overrides Hold Fire. Hold Ground prevents the chase but keeps the target.
_Avoid_: Fire, shoot, engage (except as flavor)

**Stop**:
An order that clears pathing and targeting. Hold Ground and Hold Fire stay.
_Avoid_: Cancel, halt, idle

**Hold Ground**:
A stance that pins the operative. An active path is parked and restored on release. Separation will not shove them off their tile. They may still fire.
_Avoid_: Hold (alone), overwatch, wait, stance (as a generic)

**Hold Fire**:
A stance that clears automatic targets. The operative will not auto-acquire. A later Attack still fires.
_Avoid_: Cease fire (except as flavor), weapons hold, passive

**Stance**:
Hold Ground or Hold Fire. These two are the whole stance language.
_Avoid_: Posture, unit stance (idle, moving, dead — those are not orders)

**Explicit target**:
A hostile assigned by Attack. It is not an automatically acquired target.
_Avoid_: Soft target, aggro

**Fire lane**:
The path of a round out to weapon range. A miss continues down the lane. The first Unit before cover is hit, regardless of faction. Cover stops the lane.
_Avoid_: Bullet, projectile path, stray (the hit is still a hit)

**Primary**:
The operative's main weapon. Research applies to both slots.
_Avoid_: Gun, loadout

**Sidearm**:
The operative's second weapon. Each slot keeps its own magazine. Swapping cancels an in-progress reload of the stowed weapon.
_Avoid_: Pistol (that is one weapon), secondary

**Drawn weapon**:
The slot that currently fires, makes noise, and paints tracers. After a swap it cannot fire until it is ready.
_Avoid_: Active gun, equipped

**Grenade**:
A thrown blast that spends one power cell, must land on nearby pavement within range, and shares a squad cooldown.
_Avoid_: Frag (that is the Demolitions active), explosive (alone)

## Objectives

**Objective**:
A named step in the mission. Required objectives are strictly sequential. The mission is won when every required objective is complete.
_Avoid_: Goal, task, quest step

**Optional objective**:
An objective that activates with the required objective it precedes, never blocks the sequence, and pays a bonus on top of the Reward. Ignoring or failing it costs nothing.
_Avoid_: Side objective, bonus (the pay is the bonus), optional (alone)

**Tagged enemy**:
A CorpSec unit bound to an eliminate objective. When none remain, that objective completes.
_Avoid_: Marked (the Recon passive), named enemy, boss

**Reach zone**:
Completes when any living operative enters the radius.
_Avoid_: Touch, arrive

**Eliminate tag**:
Completes when no living Unit with the tag remains.
_Avoid_: Kill all, exterminate

**Extract**:
Completes when every surviving operative is inside the Extraction radius.
_Avoid_: Escape, evac

**Interact**:
A channel at a point for a duration. It advances only while a living operative stands in the zone. An empty zone pauses; it does not reset.
_Avoid_: Hack, use, hold (that is Hold Ground)

**Escort**:
Completes when every VIP is alive and inside the target zone. A dead VIP voids every unfinished escort.
_Avoid_: Rescue, walk

**Destroy**:
Completes when no Device with the tag remains. An optional destroy whose device dies to non-squad fire fails rather than completing.
_Avoid_: Sabotage (that is a contract Type), bomb

**Defend**:
Completes when the hold timer at the zone reaches zero. A wave of CorpSec can spawn when it activates. An empty zone pauses the timer; it does not reset.
_Avoid_: Hold (the stance), survive

**Time limit**:
A countdown from an objective's activation. Expiry fails an optional objective and is a Loss on a required one.
_Avoid_: Tactical time, mission timer, ETA
