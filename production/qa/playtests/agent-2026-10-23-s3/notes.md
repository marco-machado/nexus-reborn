# Playtest session 3 — Nexus Reborn — first-time player notes

## Log

- [T+0] Main menu. "NO CAMPAIGN ON FILE", "<< NEW OPERATION >>", "SETTINGS". Strong corporate-terminal flavour ("UNAUTHORIZED ACCESS IS A CLASS-1 CORPORATE OFFENSE"). Clear first action: NEW OPERATION.
- [T+1] New Operation -> straight into WORLD NETWORK with an orientation modal ("FIRST UPLINK"). Modal is good: tells me the job (keep sectors Nexus-held, tax), says "Start with NEON GARDEN in OSLO". BUT: the strategic clock kept running behind the modal at 2X — it said "Pause while you read" yet the time went 14:32 -> 14:44 while I read. Low-severity: modal should pause the clock.
- Screen is dense: credits 128,450, influence 0, intel 1, roster 8/8, sectors 6/7. Globe with contracts as labelled diamonds — looks great. Stabilize/Lobby/Expedite cost influence points (8P/10P/12P) all UNAFFORDABLE (I have 0P). Paused the clock with the pause button.
- "OPEN CONTRACTS 1 / 2" in the Europe panel confused me slightly: globe shows 4 contracts (Rust Haven, Neon Garden, Glass Veil, Hollow Crown). I guess panel = focused sector only.
- [T+3] Clicked NEON GARDEN on globe -> BRIEF screen. Very atmospheric (recon feed, tactical minimap, dossier). Reward 37,000 CR, threat MODERATE, collateral tolerance LOW (10%).
  - Objective list order is odd: PRIMARY, OPTIONAL (+6,000), SECONDARY, TERTIARY. Optional sits between primary and secondary. Primary is just "REACH THE RELAY YARD"? Feels like the real job is secondary (destroy relays).
  - "KIT: POWER CELLS ARM GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY" — I parse it as: grenades (need power cells) destroy relays fast, shooting works slowly. Terse but useful.
  - Client is HELIX CORP, who also holds Europe (our rival?). Slightly confusing who I'm working against.
- [T+5] ACCEPT CONTRACT -> ASSEMBLY. 4 operatives pre-assigned (Mara Assault, Ghost Recon, Dart Infiltrator, Torq Demolitions). Raven (Sniper) INJURED. Slate/Vex/Kestrel available on the bench.
  - Item slots start EMPTY. Learned by trial: clicking an empty slot cycles EMPTY -> MED KIT -> POWER CELL -> ... No tooltip on hover explaining what a med kit or power cell does, and nothing tells me "click to cycle". Medium: the brief told me grenades need power cells, and if I hadn't clicked around I'd have deployed with no cells.
  - Gave Mara/Ghost/Dart MED+CELL, Torq CELL+CELL. Deployment mass 340/400 -> "STANDARD LOAD" (lost the "LIGHT LOAD +0.15 m/s" bonus). Nice tradeoff, clearly shown.
  - Annoyance: the operative detail panel on the right has its own scroll; the loadout is below the fold and the scroll offset changes between operatives, so the slot buttons move.
- [T+8] RESEARCH screen: 3 labs, 21 projects, tier-1 costs 15-18k and run 2h world time. Clear tree, clear "PROJECTED BENEFIT" (e.g. +12% damage RFC-27). Authorized ADVANCED PROPELLANTS, NEURAL INTERFACE I, TARGETING AI SUITE (49,000 CR committed, 79,450 left). Understood purpose immediately. Note: clicktext "RESEARCH" from Assembly hit "NO PROJECT RESEARCHED" text instead of the tab (harness thing, not a game bug).
- [T+12] Ran world clock at 8X (~42 game-min per 5 real s) for ~3h so the 3 projects finished. NO feed item / toast announced "research complete" — I had to go back to RESEARCH to find out (Low-Medium). Authorized BARREL WEAR COATING (14k). Credits 65,450.
  - Research augmentations auto-slotted on operatives ("NEURAL INTERFACE I -8% FIRE DELAY  AUTO"). Nice, zero friction.
  - Harness note: my first loop of research clicks failed due to my shell quoting, not the game.
- [T+15] MISSION Neon Garden loads. Rainy isometric district, looks good. Mission auto-paused with TUTORIAL 1/9 (selection: click / drag box / 1-4 / 0 or ` for whole squad). Tutorial 2/9: right-click moves, WASD pans, wheel zooms, F recenters. Clear.
  - The objective "REACH THE RELAY YARD" is NOT marked on the 3D view nor obviously on the minimap. I had to zoom the minimap out and guess a cluster of icons/red dots to the east, then pan with D to find a fenced yard with glowing cyan boxes (the relays?). Medium: a waypoint marker for the active objective would save a minute of hunting.
- [T+20] First contact. Squad walked toward the yard; patrol investigated, firefight. Ordered engage on a hostile in the yard. In ~8 game seconds: Ghost 110->44, Dart 98->66->3->0. DART FLATLINED before I could react: I pressed 3 then E (med kit) and the log said "AGENT DOWN. K. PARK FLATLINED." then "MED KIT: NO WOUNDED OPERATIVE SELECTED." Damage feels very fast for a pausable game; the "CASUALTY RISK: below 35% health" advisory popped up AFTER Dart was already dead. HIGH: time-to-kill vs reaction window. I was using `wait 2000`-`3000` chunks, which in hindsight is too long — but the game never auto-paused on heavy damage.
  - ALERT counter at top stayed "0" while the comm log said "THREAT LEVEL ELEVATED" and an advisory said "CORPSEC IS ALERTED". Went to 1 only after the death. Confusing.
  - RELAY-01 got destroyed (by gunfire I think) while fighting — nice feedback in the log.
  - Med kit on Ghost: log "+50 HP" but squad card still showed 34/110 right after (maybe she took more hits at the same time?).
- [T+26] Grenades: select Torq, G = "ARM / CANCEL GRENADE", left-click target. First throw at a relay detonated short (killed a hostile; relay intact) — no visible range indicator told me it was out of range. Moved the squad in, gunfire/grenade took RELAY-03 and RELAY-02 -> "OBJECTIVE COMPLETE: DESTROY THE THREE FUEL RELAYS" + "EXTRACTION WINDOW OPEN. RETURN TO THE INSERTION ZONE."
  - Note: "REACH THE RELAY YARD" completed only when the grenade went off, well after my squad was at the fence.
  - OPTIONAL "DROP THE BACKUP TRANSFORMER (+6,000)": could not find it. Not marked on the map or minimap; "far yard" is vague. I threw two grenades at a small glowing cyan object near the yard (wasted 2 power cells, it is still there — apparently scenery). No hover tooltips on objects in the world. Medium.
  - Keys 1-4 select operatives, but the ability bar also shows icons labelled 1-4 (Overdrive, Pulse Scan, Ghost Veil, Frag Charge). I pressed 4 expecting Frag Charge and it selected Torq instead. The bar header says "Q / G" — Q = role ability of the selected operative. Confusing number labels (Medium).
  - Pressing F changed the camera framing a lot (seems to rotate/zoom too?); hard to keep orientation.
  - Giving up on the optional, extracting.
- [T+30] Extraction: insertion ring found by left-clicking the gear icon on the minimap (camera jumps). First right-click into the ring did nothing (maybe I hit a non-walkable white patch?), second worked. Right-click on minimap does NOT move units.
  - Advisory "A ROLE ABILITY HAS SAT READY FOR A MINUTE. Q FIRES IT FOR THE SELECTION." — that's how I learned Q. Too late in the mission to matter; the tutorial was still on step 4/9 at mission end because steps only advance on actions.
- MISSION 1 RESULT: CONTRACT FULFILLED. Eliminations 6, casualties 1 (DART KIA), XP +1 each survivor, collateral 0, mission time 1:12 (!), contract 37,000, optional 0, "CONTRACT ETA +2 DAYS ELAPSED", payout +37,000, balance 106,619 CR. "INVOICE UNFILED // COMMITS ON NEXT SCREEN".
  - Debrief is readable. But: losing Dart carries no stated cost (no replacement fee, no "roster 7/8" line, no sector Control/Unrest change shown). The cost of violence = just a red name. Mission lasted 72 seconds of game time — the whole fight was a blur.
  - Research nudge in debrief ("SYSTEMS LAB is idle... 16,000 CR starts SENSOR FUSION ARRAY") — helpful.
- [T+33] Back on WORLD NETWORK: date jumped 05.14 -> 05.16 (the "ETA 2D" on the contract = 2 days pass when you deploy; I did NOT understand that from the brief). In those 2 days the world went to hell: SOUTH AMERICA CRISIS (control 41%->4%, unrest 96%), Africa 16%/64% "UNREST PRESSURE", Europe unrest 18->42%, and NEXUS GLOBAL NOW HOLDS 0 SECTORS ("OMNICORP TAKES NEW BOSTON" in the feed -> North America CONTESTED). So my tax income is gone. HIGH-impact surprise: nothing warned me before deploying that a 2-day trip could cost me my only paying sector, and nothing in the debrief told me.
  - CONFUSION: North America shows CONTROL 75% but "NORTH AMERICA // CONTESTED", "TAX PAID NO // NOT NEXUS-HELD". The orientation said Control = "how much of the sector Nexus holds". 75% held but not held? I don't understand what flips ownership.
  - Influence went 0 -> 8 PTS (from the win). A tip box explained "Field wins earn the points to spend." Spent 8P on STABILIZE Africa (-12 unrest over 6h), since it is "UNREST PRESSURE" but not yet crisis and 8P won't save South America. Lobby (+8 control, 10P) — what I actually wanted for N. America — unaffordable.
  - Globe: clicking Africa in the list left the globe showing South America for a while (animation lag?). Minor.
  - Roster 7/8 after Dart's death. Intel progress 25 -> 80/100.
- [T+37] Research: Barrel Wear Coating had finished during the 2 days. Authorized HYPERVELOCITY CORE (30k, 4h) and SENSOR FUSION ARRAY (16k). Credits 60,619 — with 0 sectors I have no income, so I'm nervous about spending.
- Assembly: Raven healed to READY. RECRUIT opens a "RECRUITMENT MARKET": 3 candidates 21.5k-31.5k CR, "ONE NEW CANDIDATE EVERY 24 WORLD HOURS". Clear. Didn't hire (no income).
  - Survivors' item slots were refilled automatically (med kits/cells I used are back) — consumables seem free. Fine, but then why carry less? Only the mass limit.
  - Put KESTREL (Medic: FIELD STIM heals most wounded within 8m by 40, passive regen 1HP/s within 6m) in Dart's slot, gave her 2 med kits.
- [T+40] Contract 2: RUST HAVEN, Detroit Sprawl (North America), Sabotage, client STRATOS, target an OMNICORP yard (Omnicorp took New Boston — so I hope a win here helps get N. America back; nothing explicitly says so). 41,000 CR, chance 90%, ETA 3D. New wrinkle: "HOLD THE YARD FOR THE BURN — HOLD THE ZONE FOR 45 S" with a CorpSec response wave. Objective list has two "TERTIARY" lines (hold, extract). "CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE."
- [T+50] MISSION 2 (Rust Haven), live notes: tutorial resumed at 4/9 (carried over); "ABILITY READY — sat ready for a minute" advisory fired at second 0 of the new mission (stale carry-over, Low bug). Same yard layout as mission 1 basically.
  - Used Ghost PULSE SCAN (2 then Q) — marks hostiles in red briefly ("SCAN FEED LOST" later). Good.
  - Approached in 1-1.5 s steps this time. Grenade at a relay: killed a hostile next to it but the relay survived; 2nd grenade destroyed RELAY-02, RELAY-01 popped too. Mara OVERDRIVE (1 then Q) + focus fire killed 4 quickly. Felt good.
  - Then Torq went 84 -> 7 -> dead within ~2 game-seconds while I moved the squad deeper into the yard. Again "MED KIT: NO WOUNDED OPERATIVE SELECTED" because he died between my look and my key press. Second mission, second KIA, same pattern.
  - Only AFTER that did TUTORIAL 6/9 say: "G ARMS A GRENADE ... ITS BLAST HURTS EVERYONE INSIDE THE RED RING, YOUR SQUAD INCLUDED." I'd thrown two grenades near my own squad; Torq dropped 134->123 right after his first throw. I very likely killed my own demolitions expert. HIGH: friendly-fire rule must be taught BEFORE the first grenade, not at step 6/9 after the fact. Also relays seem to explode when destroyed (big fireball) — unclear if that hurts my people.
  - "CORPSEC WAVE INBOUND. HOLD THE ZONE." — hold zone is not drawn on the ground; only a timer (0:45) and progress bar in the directives panel. I guessed "inside the yard" and pressed H (status changes MOVE -> HOLD on the cards, nice).
- [T+60] Hold: after ~18:14:42 nothing happened for 30+ s; the "CorpSec wave" was 3-4 guys that died early. The 45 s hold was dead time (Low). Kestrel's passive regen capped at half health (50/100) as described.
  - Optional transformer, attempt 2: grenade (this time the hover showed a RED RING blast radius — great, I wish I'd seen that in mission 1; it only appears while hovering after G) on the remaining glowing box: nothing. Walked Mara to it and pressed R: "POWER CELL: NO ABILITY COOLDOWN RUNNING" -> so R = spend a cell to refresh an ability cooldown. Still no idea where/what the backup transformer is. 0/2 on optionals.
  - Extraction click failed again the first time: after left-clicking the minimap the camera glides to the new spot, so my right-click landed on old coordinates. (Partly harness timing, but the camera glide after a minimap click is long.)
- MISSION 2 RESULT: CONTRACT FULFILLED. Elims 9, casualties 1 (TORQ KIA), XP: Mara 2, Ghost 2, Kestrel 1. Collateral 0. Mission time 1:58. 41,000 CR, optional 0, "+3 DAYS ELAPSED", balance 117,543 CR.
  - New on this debrief: a "REPLAY MISSION" button (wasn't on debrief 1). Tempting to replay to save Torq — but it wasn't explained (does it rewind the payout? the 3 days?). Did not use it.
- [T+68] World after mission 2 (date 05.19): NORTH AMERICA is back to NEXUS GLOBAL (84%, tax 5,043/24h, "TAX PAID YES"), Nexus holds 2 sectors (N. America + Oceania). Intel LEVEL 2 -> EVENT FORECAST appears (RIOT 8% BLKOUT 6% RAID 8% ...), Glass Veil unlocked. But Africa went to CRISIS (5%/93%) despite my 8P Stabilize; S. America still crisis. Influence +8 again -> spent STABILIZE on OCEANIA (Nexus-held, unrest 59%).
  - Satisfying moment: seeing N. America flip back to green after Rust Haven. The link "win in sector -> control" finally clicked, though nothing on the brief or debrief said "this contract affects N. America control".
  - Research: 6/21 done. Authorized THREAT PREDICTION (+12 max HP, 31k) and SYNAPTIC ENHANCEMENT (17k). Recruitment market had 3 NEW candidates (old ones gone). Hired ZENITH (Demolitions, 126 HP) for 32,000. Credits now 37,543. Roster 7/8.
- Contract 3: CRIMSON LEDGER, London, SUPPRESSION, PRIORITY, 47,500 CR, chance 93%, expiry 6h, ETA 2D. Mixed signals: "THREAT RATING MODERATE", "CHANCE 93%", but "RISK INDEX 71 // HIGH" and "EXPECT HARD CONTACT". Civilian density MODERATE, collateral tolerance LOW. Odd: client is HELIX CORP (holds Europe) asking me to restore order for them; does winning raise Helix's hold or mine?
- [T+80] MISSION 3 (Crimson Ledger, London, Suppression) live notes:
  - Plaza full of civilians (dark silhouettes) mixed with hostiles (red rim). My squad, on FREE fire, caused "CIVILIAN HIT. COLLATERAL COUNT 1" within 25 s. A COLLATERAL 1 counter appeared top-right. Good feedback.
  - Tried C (WEAPONS TIGHT) to protect civilians. Big mistake: the squad got shot to pieces without firing back while walking. ZENITH (the guy I just paid 32,000 for) went 79 -> 41 -> 13 -> dead in ~3 seconds. Pressed 4 then E for a med kit: log said "MED KIT APPLIED TO GHOST" — not the selected operative (Zenith had just died, maybe the kit went to the next-most-wounded?). Confusing.
  - Kestrel 58 -> 21 -> 1 in about one second. Two med kits + field stim + R (POWER CELL SPENT. KESTREL ABILITY CHARGED — now I understand R!) saved her. Mara grenade on the gate cluster killed 2. Retreat behind cover, then a calm push. Alert back to 0.
  - "REACH THE CHECKPOINT GATE" did not complete when standing under the big red CORPSEC arch. Only by zooming the minimap crop did I notice a small white diamond-in-a-circle marker a bit to the side. Standing in that circle completed REACH + PUT DOWN THE ARMED CORDON at the same moment (cordon was already dead). ~2 min of confusion. Medium: the objective circle should be drawn in the 3D world, like the extraction ring is.
- MISSION 3 RESULT: CONTRACT FULFILLED, "PAYMENT ADJUSTED". Elims 13, casualties 1 (ZENITH KIA, hired 1 mission ago for 32,000), collateral 1 -> COLLATERAL PENALTY -5,000 CR (shown in red). Mission time 1:16. 47,500 -> payout 42,500. Balance 84,807.
  - Collateral cost IS clear here (red number + penalty line). Casualty cost is still not: Zenith's 32k is not mentioned. No REPLAY MISSION button this time (it appeared only after mission 2 — inconsistent; maybe depends on something I can't see).
  - Three missions, three dead operatives, each in ~2 game-seconds of burst damage. The operatives I lose are always whoever is at the front.
- [T+88] World 05.21 after mission 3: S. America, Africa, ASIA all CRISIS (4% control). Europe CONTESTED, 51%/69%, "UNREST PRESSURE". Influence only +6 this time (6 PTS) -> Stabilize (8P) now unaffordable everywhere. Feed: "HELIX CORP SEIZES THE COUNCIL IN LONDON" (my client).
  - HIGH CONFUSION: NORTH AMERICA is "CONTESTED / NOT NEXUS-HELD" again with CONTROL 86% and UNREST 8% — the best numbers on the board. Feed shows no event for N. America. The orientation said Control = how much Nexus holds. So what decides ownership? I cannot plan around a rule I can't see. Control key says NEXUS GLOBAL 1 (only Oceania).
  - The Oceania Stabilize I bought (−12 unrest over 6h) — Oceania unrest went 59% -> 63% over 2 days anyway. Feels like influence spending is a drop in the ocean; no feedback that it did anything.
  - Overall the world collapses ~every trip no matter what I do; I don't see any lever that helps except winning in a sector.
- [T+92] Research REFLEX BOOSTER (28k). Credits 56,807. Added RAVEN (Sniper; DEADEYE next shot can't miss + double dmg; +15% range) in Zenith's slot, MED+CELL.
- Contract 4: COLD ANTHEM, London, EXTRACTION, "DIRECTIVE: INTERNAL" (no client), 36,000 CR, chance 95%, but "RISK INDEX 60 // HIGH". Objectives: reach compound gate, override cell block locks ("AN OPERATIVE HOLDS THE CONSOLE FOR 5 S"), extract the asset alive, extract squad.
  - TEXT BUG: dossier says "COLLATERAL TOLERANCE: LOW (10%)" but the mission notes say "COLLATERAL TOLERANCE MODERATE." Contradiction on the same screen.
  - "CHANCE 95%" next to "RISK INDEX 60 // HIGH" is still confusing — after 3 missions with a death each, "95% chance" feels like it measures "contract completes", not "everyone comes home".
- [T+100] MISSION 4 (Cold Anthem, London, Extraction): cleanest run. Advanced in 1-1.5 s steps, focus-fired a flanker, Mara grenade on a 3-man cluster at the gate (well clear of my squad, red ring checked), Raven DEADEYE, Kestrel stim. Gate reached; the console was the small glowing figure by the gate pillar, found via the minimap marker again. "UPLINK OPEN" -> 5 s hold -> "ASSET SECURED. KEEP THE ESCORT ALIVE." The asset followed the squad automatically to the pad. Easy, 42 s.
  - Grenade: the comm log never printed "GRENADE DETONATED" this time, though a cell was spent (R count 04 -> 03) and enemies died. Minor log inconsistency.
- MISSION 4 RESULT: CONTRACT FULFILLED. Elims 10, casualties 0, collateral 0, time 0:42, 36,000 CR. Balance 96,312. XP: Mara 4, Ghost 4, Kestrel 3, Raven 1. (XP has no visible effect anywhere I looked — no level, no perk.)
- [T+104] World 05.23: Europe, Oceania now CRISIS too; only N. America isn't (and it is "CONTESTED, NOT NEXUS-HELD" at 86% control). Europe meanwhile shows "NEXUS GLOBAL / NEXUS-HELD" at 37% control. Ownership seems unrelated to the Control number. Intel LEVEL 3. Influence 14 -> spent LOBBY Europe (+8 control). Stopping the session here.

## Final report

### First 5 minutes
- Goal: Partially. The orientation modal ("THE JOB": keep sectors Nexus-held to earn Tax; "START HERE": Neon Garden) gave me a clear first action. The bigger goal (win what? by when?) was never stated.
- Controls: Yes for the basics. The mission tutorial (click/box select, 1-4, 0, right-click move/attack, WASD, wheel, F) is clear and the game pauses for it.
- Emotional response: **Intrigued** — the presentation (globe, terminal UI, rainy iso city) is strong and the brief-to-mission flow made sense, but the strategic numbers were opaque from minute one.

### What worked well
- Presentation and flow: world -> brief -> assembly -> mission -> debrief -> world is smooth, fast to load, and every screen looks deliberate.
- The brief is informative (reward, threat, weather, civilian density, collateral tolerance, objectives, a "KIT" hint about grenades).
- Research is easy to read: three labs, cost, time, exact benefit ("+12% DAMAGE RFC-27"), auto-slotted augments. The debrief nudge about an idle lab was useful.
- The harness pause model plus short waits made the tactics readable. Pulse Scan, Overdrive, Field Stim, Deadeye and R (power cell recharges an ability) each felt meaningful once found.
- Grenade red-ring preview while aiming is good; so is the COLLATERAL counter and the -5,000 CR penalty line.
- The escort mission (4) was the most satisfying: clear steps, automatic asset follow.
- Seeing North America flip to Nexus after winning Rust Haven was the one moment where the strategic layer "clicked".

### Pain points (severity)
- **High — burst damage / casualty every mission.** Missions 1-3 each lost one operative, each going from healthy to FLATLINED in about 2 game-seconds (Dart 98->66->3->0; Torq 84->7->0; Zenith 79->41->13->0). The "CASUALTY RISK" advisory arrived after the death, and the med kit key arrived after it twice ("MED KIT: NO WOUNDED OPERATIVE SELECTED"). Nothing auto-pauses when an operative crosses low health.
- **High — sector ownership is incomprehensible.** North America at 86% control / 8-11% unrest is "CONTESTED // NOT NEXUS-HELD", while Europe at 37% / 89% is "NEXUS-HELD". The orientation says Control = how much Nexus holds. Nothing in the feed explains the flips. I could not plan.
- **High — friendly fire taught too late.** Tutorial 6/9 ("ITS BLAST HURTS EVERYONE INSIDE THE RED RING, YOUR SQUAD INCLUDED") appeared in mission 2, after I had thrown grenades near my own people, likely killing Torq. Teach this before the first grenade throw.
- **Medium — objectives not marked in the 3D world.** Relay yard, checkpoint circle, console and the optional "backup transformer" are only a small white diamond on the minimap. The extraction ring is drawn on the ground; objectives should be too. I never found a transformer in 2 tries and wasted 2+ power cells on scenery.
- **Medium — time cost of deploying is hidden.** "ETA 2D/3D" means 2-3 world days pass. In the first trip I lost my only paying sector and South America fell into crisis, and the debrief did not say so. Show "while you were away" on return.
- **Medium — the world collapses no matter what.** By day 9, five of six sectors were in crisis. Influence actions (8-10P, about one per win) did not visibly help (Oceania unrest went up after Stabilize).
- **Medium — Weapons Tight (C) is a trap.** I used it to protect civilians and my squad walked into fire without shooting back; that is when Zenith died.
- **Low — item slots start empty** and you fill them by clicking to cycle EMPTY->MED->CELL, with no tooltip. Easy to deploy without power cells.
- **Low — number keys:** 1-4 select operatives, but the ability bar labels abilities 1-4 too. Q fires the selected operative's ability; the label is confusing.
- **Low — 45 s "hold the yard" was dead time** after the wave died in 10 s.
- **Low — the strategic clock kept running under the orientation modal** that tells you to pause.

### Confusion points
- Where the relay yard / checkpoint objective was: about 1-2 min each; resolved by zooming the minimap and spotting the diamond.
- What R does: learned only from the error "POWER CELL: NO ABILITY COOLDOWN RUNNING" in mission 2.
- What Control/ownership means: unresolved after 4 missions.
- Why "CHANCE 95%" sits next to "RISK INDEX 60 // HIGH": unresolved.
- REPLAY MISSION appeared on debrief 2 only; I did not know what it would rewind, so I didn't use it.
- Client logic: I worked for Helix in Oslo (Helix holds Europe) and then for Helix in London; it is unclear whose control those wins raise.

### Moments of delight
- The first relay fireball in the rain.
- The N. America flip to green after Rust Haven.
- Kestrel at 1 HP saved by med kit + R-recharged stim + retreat behind a building in mission 3.
- Mission 4's clean grenade on a 3-man cluster at the gate.

### Bugs (as seen)
1. Brief for Cold Anthem: "COLLATERAL TOLERANCE: LOW (10%)" in the dossier vs "COLLATERAL TOLERANCE MODERATE." in the mission notes.
2. Mission 2 started with the advisory "A ROLE ABILITY HAS SAT READY FOR A MINUTE" at second 0 (carried over from mission 1).
3. Mission 3: pressed 4 (Zenith) then E; Zenith flatlined in the same instant and the log said "MED KIT APPLIED TO GHOST" (not the selected operative).
4. The ALERT counter showed 0 while the log said "THREAT LEVEL ELEVATED" / an advisory said "CORPSEC IS ALERTED" (mission 1).
5. Mission 4: a grenade was spent (cell count dropped, enemies died) but no "GRENADE DETONATED" log line.
6. N. America CONTESTED/not held at 86% control while Europe is held at 37% (may be design, but it reads as a bug).
7. No feed or toast when research completes.

### Per feature
| Feature | Understood purpose? | Engaging? | Suggestion |
|---|---|---|---|
| World map / strategic layer | Partially | Partially | Explain ownership rules; add a "while you were away" summary after each deploy; show which sector a contract affects and by how much. |
| Contract briefing | Yes | Yes | Order objectives Primary/Secondary/Tertiary/Optional; reconcile CHANCE vs RISK; show the world-time cost ("3 days pass") prominently. |
| Team preparation (Assembly) | Yes | Partially | Pre-fill items or add a tooltip for click-to-cycle; keep the loadout always visible (no inner scroll). |
| Mission controls: selecting/moving/camera | Yes | Yes | The minimap click glides the camera slowly; F also changes the framing a lot. |
| Mission: attacking | Yes | Partially | TTK is too short for the reaction window; auto-pause or slow-mo on an operative below 35%. |
| Mission: abilities (Q) | Partially | Yes | Teach Q in the tutorial early; drop the 1-4 labels on the ability icons. |
| Mission: items/grenades (E/R/G) | Partially | Yes | Teach friendly fire and R before mission 1's first grenade; show grenade range. |
| Mission objectives | Partially | Partially | World-space markers for every objective, including optionals. |
| Results screen | Yes | Partially | Add the cost of a KIA (hire value, roster), sector control/unrest change, influence earned and days elapsed with consequences. |
| Research | Yes | Yes | Notify on completion. |
| Hiring | Yes | Partially | Hiring for 32k and losing the hire next mission with no comment stings; show it on the debrief. |
| Influence (Stabilize/Lobby/Expedite) | Partially | No | Show the effect afterwards; at 6-14 points per win against 90% unrest it feels pointless. |

### Information
- Enemies: hostiles have a red rim and Pulse Scan marks them, but in crowded plazas (London) civilians and hostiles are hard to tell apart at default zoom.
- Objectives: poor in-world, OK on the directives panel.
- Squad health: the cards are clear, but health drops faster than I can read them.
- Threats: the ALERT meter and comm log help, but they come after the fact.
- Orders: few, meaningful orders in calm moments (move, focus, ability). In firefights it turns into frantic micromanagement (select 3, E, select 4, Q...) and I still lost people.
- Cost of violence: collateral is clear (counter + penalty line). Casualties are just a red name. The world-time and sector consequences are not shown at all.

### Difficulty
**Too hard in the tactical spikes, too easy in completion.** All 4 contracts were fulfilled (100% win rate), but 3 of 4 cost an operative to sudden burst damage. The one flawless run (mission 4) came only after I learned to move in 1 s steps and grenade from range. Optionals: 0/2 (couldn't find the target). The strategic layer feels unwinnable: 5/6 sectors in crisis by day 9 despite 4 wins.

### Would I play again?
Yes, cautiously. The look, the brief-and-deploy rhythm and the ability kit are appealing, and mission 4 showed the game is fun when it is readable. I'd stop if the world map keeps collapsing for reasons I can't see.

### Top 3 priorities
1. Make ownership/Control rules legible and show what happened while the squad was deployed (and which sector a contract moves).
2. Give a reaction window: auto-pause or slow-mo on low HP or first contact, and/or a longer time-to-kill. Teach friendly fire, R and Q before mission 1's first fight.
3. Draw every objective (including optionals and consoles) in the 3D world, not only as a minimap diamond.

### Counts
- Missions played 4, won 4, lost 0 (optionals 0/2).
- Operatives lost 3 (Dart, Torq, Zenith). Hired 1 (Zenith, 32,000 CR).
- Research completed/started: 8 complete, 1 running. Influence spent: 3 actions (Stabilize Africa, Stabilize Oceania, Lobby Europe).
- Credits: 128,450 -> 96,312 (after ~182k research + 32k hire).
- Harness commands: about 510.
