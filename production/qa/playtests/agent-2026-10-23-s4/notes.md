# Playtest session 4 — mid-game (agent tester)

Date: 2026-10-23. Harness port 4441. 1280x720.

## Log

- [00] Main menu: "CAMPAIGN ON FILE" + "<< CONTINUE >>". Clear that a save exists. Pressing Continue.
- [01] World Network loaded. 141,000 CR, 14 influence, Intel 2 (20/100), roster 8/8. Date 2087.05.14 14:32. Clock was RUNNING at 2X on load, behind an orientation modal titled "FIRST UPLINK" — on a continued save, this felt odd (I'm not on my first uplink). It also told me "Start with NEON GARDEN" as if I'm new. Minor. Paused the clock (pause button bottom-left), which closed/hid the modal; the UNDERSTOOD click then timed out (modal already gone). ~13 strategic minutes passed between load and pause.
- [02] Sector ownership: only NORTH AMERICA is Nexus-held (68% control, 4,080 CR/24H). Europe "CONTROL 62%" but owner HELIX CORP; Oceania "CONTROL 73%" owner STRATOS. The orientation text says "CONTROL: how much of the sector Nexus holds" — so how can Helix own a sector where Nexus holds 62%? CONFUSING (Medium): I can't tell whether Control is Nexus's share or the owner's grip. Feed says "NEXUS GLOBAL TAKES BOGOTA" but South America is "CONTESTED", 41%.
- [03] Contracts are listed per focused sector (Open Contracts panel changes with the focused sector). Globe shows all four: RUST HAVEN (Detroit, sabotage), HOLLOW CROWN (Shingang/Asia, extraction, 61%, ETA 4D), NEON GARDEN (Oslo, sabotage, 93%, expiry 35H), GLASS VEIL (New Carthage/Europe, seizure, 42%, ETA 2D). Neither Hollow Crown nor Glass Veil seems locked. "clicktext GLASS VEIL" failed (label not clickable by text?), but clicking the card worked.
- [04] HOLLOW CROWN brief: reward 62,000 CR, threat HIGH, risk index 66. Objectives: gate -> (optional) detention server +9,000 CR (wipe starts 90 s after gate falls) -> override cell locks -> extract asset alive -> extract squad. Good, clear brief. BUG/inconsistency: dossier says "COLLATERAL TOLERANCE: LOW (10%)" but Mission Notes say "COLLATERAL TOLERANCE MODERATE." Also two objectives labelled "TERTIARY".
- [05] Research screen: 3/21 done (Adv. Propellants, Barrel Wear Coating, Neural Interface I), 3 labs IDLE. Augments go in "AUG BAY" slots (Neural/Chest/Arms/Legs) — Reflex Booster and Targeting AI both want ARMS, so they'd compete. Nice tradeoff once I noticed it. I picked Caseless Ammo (26k), Synaptic Enhancement (17k), Targeting AI (18k).
- [06] **MISTAKE + UX ISSUE (High)**: I was on ASSEMBLY, ran `clicktext RESEARCH` (did not navigate — maybe matched other text), then clicked where the AUTHORIZE PROJECT button sits on the Research screen (1105,608). On Assembly that spot is the huge DEPLOY TEAM button. The game deployed me straight into HOLLOW CROWN with no confirmation, even though I had never pressed ACCEPT CONTRACT on the brief (I had only opened the brief). So: no research authorized, Raven still injured, default squad Mara/Ghost/Dart/Torq. The DEPLOY button has no "are you sure", and shares screen position with Research's AUTHORIZE button. Partly my fault, but a one-click irreversible deploy is risky. I'll play the mission as is.
- [07] Mission load: "ESTABLISHING SQUAD LINK" black screen for a few seconds. Then a tutorial "TUTORIAL 1/9 // SELECTION" — on a mid-campaign save, again. Skipping it.

### Mission 1 — HOLLOW CROWN (Shingang, extraction) — WON, 1 KIA
- [08] Couldn't find the compound at first: no world marker for "REACH THE COMPOUND GATE". Used the minimap (blue pin + red dots cluster) and clicked it to steer the camera. Found the walled compound with two glowing gate pillars. ~2 min of looking.
- [09] Camera: wheel zoom direction felt inconsistent (wheel +400 zoomed out a little, wheel +500 later zoomed IN); `-`/`=` keys zoom in small steps; zoom range is narrow, I never got a view of the whole compound + route. W/S/A/D pan, but the view seemed to jump around between screenshots (it kept recentering?). Pressing SPACE opened the full pause menu (key list) — fine, but I expected Space = quick pause.
- [10] Engagement: selected all (0), right-clicked the guard outside the gate. Alert went 0->2, two kills. Then right-clicked the gate guard: within ~2 s of game time DART went from 87/98 to FLATLINED, and TORQ dropped 132 -> 29. Very fast lethality; I had no time to react between two `wait 2000`s. The "CASUALTY RISK" advisory appeared after the death, not before. Felt harsh, and partly my fault (I charged the gate with everyone bunched, no cover use). Med kit (4 then E) worked: "+50 HP". Mara's OVERDRIVE (1, Q) worked. After that, the garrison went down fast: 9 eliminations total; Alert dropped back to 0 within ~10 s.
- [11] Objectives: no on-map labels for the cell-block console or the detention server. I found the cell console only by guessing a glowing pedestal was "something"; right-clicking it with Ghost printed "UPLINK OPEN: OVERRIDE THE CELL BLOCK LOCKS" and completed after ~5 s. I NEVER found the detention server (optional, +9,000 CR, 90 s wipe timer). Clicking an objective line does not move the camera. (High: interactables are not readable on the map.)
- [12] My first move order to the pad did nothing (clicked a spot that was probably not walkable; no feedback at all — no "can't go there" cursor or log line). Second order worked ("ADVANCING"). The asset followed on its own; extraction completed automatically when all reached the pad: "MISSION COMPLETE. EXTRACTION CONFIRMED."
- [13] Mission time 1:08. Very short for a "HIGH" threat contract; the whole garrison died in ~10 s of firefight.
- [14] DEBRIEF: CONTRACT FULFILLED, 9 eliminations, 1 casualty (DART KIA), collateral 0, payout +62,000, optional bonus 0, "CONTRACT ETA +4 DAYS ELAPSED", balance 219,832 CR. Clear and readable. I did NOT know beforehand that deploying advances the world clock by the contract ETA (4 days) — my labs sat idle for 4 days because of the accidental deploy. The brief's "ETA 4D" did not tell me it was a time cost. (Medium: should be explicit on the brief / deploy button.)
- [15] "REPLAY MISSION" button on the debrief of a campaign mission, with "INVOICE UNFILED // COMMITS ON NEXT SCREEN": lets me undo Dart's death. Tempting; I chose not to, to play honestly. Note for design: this undercuts permadeath weight. The research nag ("SYSTEMS LAB is idle ... AUTHORIZE it before the next deploy") is useful.

### Between missions 1 and 2
- [16] Back on World Network at 2087.05.18 (4 days later). Shock: SOUTH AMERICA 5%/83% CRISIS, EUROPE 11%/95% CRISIS, AFRICA 6%/91% CRISIS (Africa owner flipped Omnicorp->Helix), Oceania 53%/64% "UNREST PRESSURE", Asia now "CONTESTED". 40 unread feed items (riots, raids, "PRIORITY CONTRACT [REQUIRES INTEL LVL 3] POSTED IN CAIRO" then "CORPSEC RAID WITHDRAWS CONTRACT"). Influence 14->22, Intel progress 20->75/100. Neon Garden and Rust Haven expired while I was away. I had no warning that a 4-day mission would let three continents slide into crisis. Feels punishing and opaque: I don't know if I caused it or it's the world's drift. (High for readability.)
- [17] BUG?: HOLLOW CROWN is still posted in Asia ("CHANCE 61%, ETA 4D") right after I fulfilled it. Either it's repeatable (not stated) or the completed contract wasn't removed.
- [18] Authorized research: Caseless Ammo (4h), Synaptic Enhancement (2h), Targeting AI (2h) — 61,000 CR committed; 158,832 left.
- [19] Recruitment market (Assembly > RECRUIT): 3 candidates — ONYX recon 31.5k, LYNX recon 31k, EMBER tech 23.5k. No infiltrator to replace Dart. "ONE NEW CANDIDATE EVERY 24 WORLD HOURS". Price per head ~ half a contract — meaningful. The market modal stayed open after `clicktext CLOSE` (had to click the CLOSE button itself), and bottom nav clicks did nothing while it was open (expected for a modal).
- [20] Bench: Slate (tech: EM BURST — hostiles within 8 m can't fire for 4 s; passive cooldowns 15% faster), Vex (support: suppression half-speed 6 s; reload aura), Kestrel (medic: +40 HP stim, regen aura; armed only with pistols), Raven (sniper). Good, distinct kits.
- [21] GLASS VEIL brief: SEVERE, risk 96, reward 85,000, client SABLE ENTERPRISES. Primary reach checkpoint gate, secondary ELIMINATE THE CORPSEC GARRISON (7 garrison + 9 patrols, 28 civilians), collateral LOW (10%). This one is consistent (both lines say LOW). Chance 39% on the world map — I don't know what "CHANCE" measures or what raises it.
- [22] Influence: STABILIZE (8P) + LOBBY (10P) on Europe -> 4P left. Ran clock at 8X for ~5 world hours (8x ~ 1 world hour per 8 real seconds). Result: Glass Veil CHANCE 39% -> 45%; Europe unrest 95 -> 91 but CONTROL 11 -> 9 (went DOWN with Lobby active). Africa got worse (96% unrest). Influence felt like a drop in the bucket against the crisis drift, but it did move the contract chance, which is the readable payoff. Feed showed "CONTRACT BROKEN HARBOR EXPIRED // OFFER RESCINDED" for a contract I never saw.
- [23] Research finished during the wait (6/21). Augments auto-install on ALL operatives ("AUTO"), e.g. Vex also shows Neural Interface I + Synaptic + Targeting AI. Authorized Pain Inhibitor (chest, +14 HP — competes with Synaptic's chest slot), Hypervelocity Core, Swarm Coordination (legs). 72,832 CR left. Research feels meaningful in cost (each ~1/3 of a contract), but the benefits are small % numbers I can't feel in a 1-minute mission.
- [24] Assembly: squad Mara/Raven/Slate/Vex. Item slots: clicking an empty slot adds a MED KIT (8 kg), clicking again... (I gave Mara 2 med kits, others 1). Deployment mass 323/400 "LIGHT LOAD +0.15 M/S". Assembly never shows WHICH contract I'm deploying to — I had to open BRIEF to confirm it's GLASS VEIL. (Medium.)

### Mission 2 — GLASS VEIL (New Carthage, seizure) — WON, 2 KIA, collateral 3
- [25] ACCEPT CONTRACT on the brief jumps to Assembly; DEPLOY started the mission (no tutorial this time — good). Items bar showed E 08 / R 02 (I had added 5 med kits; there seem to be defaults too).
- [26] Minimap "−" first click zoomed IN, second zoomed out; left-clicking the minimap did NOT steer the camera this time (it did in mission 1). Panned with WASD instead.
- [27] Patrol pairs: focus-fire attack orders worked well, 5 hostiles down in ~10 s, Vex's SUPPRESSION SWEEP and med kits used. But Mara took 126 -> 76 in ~3 s at the first contact.
- [28] Moving up the market street: "CIVILIAN HIT. COLLATERAL COUNT 1 / CIVILIAN DOWN. KILLED BY STRAY FIRE." — my own squad's fire while walking (operatives fire freely). Slate went 73 -> 17 in about 3 s from one hostile I hadn't even seen.
- [29] At the checkpoint (big "CORPSEC" gate with red barriers): "ADVISORY // RADIO CALL — AN OFFICER IS CALLING IN YOUR POSITION. DROP THE OFFICER IN THE NEXT FEW SECONDS". Loved this — clear, urgent, readable (officer has an icon above him). Focus-fired him: "OFFICER DOWN. THE CALL NEVER WENT OUT." Good moment.
- [30] But in the same 1 s: "AGENT DOWN. R. VOLKOV FLATLINED" (Vex 46/118 -> 0). Then Slate 46/104: I pressed 3+E to heal her and the log said "AGENT DOWN. J. SATO FLATLINED" then "MED KIT: NO WOUNDED OPERATIVE SELECTED" — she died in the ~0.3 s between my look and my keypress. Operatives at ~40% HP die before a human can react; the CASUALTY RISK advisory threshold (35%) is far too late given the damage rate. (High: lethality vs. reaction time.)
- [31] Mara reached the gate, garrison dropped quickly after; "EXTRACTION WINDOW OPEN. RETURN TO THE INSERTION ZONE." Walked back, mission auto-completed.
- [32] DEBRIEF: CONTRACT FULFILLED // PAYMENT ADJUSTED. 16 eliminations, 2 casualties (SLATE, VEX), collateral 3, mission time 0:55 (!), value 85,000, COLLATERAL PENALTY -15,000, payout +70,000, balance 150,952. "+2 DAYS ELAPSED". The cost of collateral is clear (5k per civilian). The cost of losing 2 operatives is NOT shown in money terms (replacing them costs ~25-31k each at the market, plus research augments). A "replacement cost" or "roster strength" line would make losses bite on this screen.
- [33] Two "SEVERE/HIGH" missions each lasted about 1 minute of game time. They feel like a burst of chaos, not a tactics puzzle: almost no time to set up; the important decisions happen in 2-3 seconds.

### After mission 2 — "CAMPAIGN COMPLETE"
- [34] World Network now shows a banner: "CAMPAIGN COMPLETE — ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE 3/3". Surprise: I had no idea the campaign was only 3 authored contracts, or that Glass Veil was the finale — no "final contract" framing on its brief, no ending beat beyond a banner. Anticlimactic. (Medium.) Glass Veil (51%), Hollow Crown and Rust Haven still appear on the globe after being fulfilled.
- [35] Intel reached LEVEL 3; two PRIORITY contracts appeared in Africa: COLD LANTERN (Johannesburg, suppression, 49%, ETA 4D, EXPIRY 8H, 95,000 CR, risk 99) and FERAL CIRCUIT (Lagos, 51%, EXPIRY 6H). Cold Lantern's district stats are identical to Glass Veil's (29 blocks, 7 streets, 28 civilians, 9 patrols, 7 garrison, routes 75/74 m) — generated template; I expect the same map.
- [36] I clicked the pause button right after returning and it STARTED the clock at 8X (it had been paused); ~2 world hours ran before I noticed. My mistake, but the play/pause icon state is easy to misread.
- [37] Research: 9/21. Tier 3 projects are 8H and 44-46k: Subdermal Weave (+22 HP chest), EM Hardening (+16 HP legs), Rail Stabilization (-15% spread). Authorized Subdermal + EM Hardening (91k). They can't finish before the 6-8H contract expiry, so they won't help this mission — research timing vs contract expiry is a real tension (good).
- [38] Market refreshed: Onyx & Lynx gone; ZENITH (demolitions, M6 Breacher, 32k), CINDER (sniper, 22.5k), EMBER still there. Hired CINDER (no confirmation dialog; fine). Squad: Mara, Torq, Raven, Cinder; med kits on everyone; mass 343.8 -> "STANDARD LOAD" (lost the +0.15 m/s light bonus — nice, readable tradeoff).
- [39] Influence: STABILIZE Africa (8P), 2P left. Chance didn't change immediately.

### Mission 3 — COLD LANTERN (Johannesburg, suppression, PRIORITY) — WON, 0 KIA, collateral 2
- [40] Operatives started with higher HP (Mara 142, Torq 148, Raven 108) — research (Pain Inhibitor etc.) visibly paid off. Map layout differs from Glass Veil even though the brief stats were identical; same objective structure (gate -> cordon -> extract) and same big "CORPSEC" gate.
- [41] "HOSTILE PATROL INVESTIGATING" at 0 s. First attack order -> 1 kill, but then "CIVILIAN DOWN. KILLED BY STRAY FIRE" at 3 s. Collateral feels hard to control: I can't see firing lines or who's in them before I order fire; the only tool is C (hold fire).
- [42] Learned from mission 2: used X (stop) + H (hold position) to stop the squad walking into the open after attack orders, let them come to me, used Mara OVERDRIVE and Torq's FRAG CHARGE ("CHARGE OUT. HEADS DOWN.") on a cluster near the gate: 4 kills in ~1 s. "THE CALL WENT OUT. NO ONE ANSWERED." — the officer got his call out but nothing came; unclear why (all the nearby guards already dead?). Torq 148 -> 56 in 1.5 s at first contact again; med kits (E with whole squad selected heals the most wounded) are the key verb.
- [43] At the gate the objective didn't complete until I walked THROUGH the barrier; then "REACH THE CHECKPOINT GATE" and "PUT DOWN THE ARMED CORDON" completed in the same second (I had already killed the cordon). Fine.
- [44] DEBRIEF: 16 eliminations, 0 casualties, collateral 2, MISSION TIME 0:55, value 95,000, penalty -10,000, payout +85,000, "+4 DAYS ELAPSED", balance 135,429. Experience lines "+1 XP (3)" — I never saw XP on operative cards or any level/perk, so XP's purpose is unknown to me. No REPLAY MISSION button this time (it was there on the two authored contracts).
- [45] Difficulty felt right THIS time because I played defensively (stop/hold/focus/heal), and better research HP. My mission 2 losses now feel more like my fault (advancing into the open), though the reaction window is still brutally short.

### Between missions 3 and 4
- [46] Back at 2087.05.24: North America (my only tax sector) now CONTROL 50 / UNREST 84 "UNREST PRESSURE", garrison STRAINED, tax fell 4,080 -> 1,543 CR/24H. Oceania collapsed to CRISIS (6%/95%). Asia changed owner to STRATOS. Every 4-day contract lets the world slide; I never see what is driving it or what I could have done. Influence regen is ~+8-10 per mission; actions cost 8-12, so I can afford ~1 action per mission vs. 5 sectors in crisis. Influence feels like a token gesture. (High: strategic layer feels like it's happening TO me.)
- [47] Stabilized North America (8P -> 0P). Research 11/21: authorized Rail Stabilization (44k, 8h), Reflex Booster (28k), Sensor Fusion Array (16k). Threat Prediction shows "LOCKED: REQUIRES SENSOR FUSION ARRAY" — clear.
- [48] No operatives came back injured from Cold Lantern even though Torq/Mara were hit hard — healing between missions seems instant (or the 4-day ETA covers it). Fine, but then "INJURED" status barely matters.
- [49] Picked ASHEN LEDGER (Lagos, generated extraction, 76,000, SEVERE 84, "NINETY SECONDS ON THE ESCORT"). Same LOW(10%)/MODERATE collateral contradiction as Hollow Crown. Swapped Cinder for KESTREL (medic). Max HP now Mara 168, Torq 174, Raven 134, Kestrel 138 — research made a real difference.

### Mission 4 — ASHEN LEDGER (Lagos, generated extraction) — WON, 0 KIA, collateral 1
- [50] First move order -> stray-fire civilian death within 4 s again ("CIVILIAN DOWN. KILLED BY STRAY FIRE"). 7 hostiles converged. I stopped (X) and held (H) behind a car: 5 kills, zero damage taken. Holding position is clearly the strongest tactic; advancing is what kills operatives.
- [51] Compound: Torq's FRAG CHARGE (cursor over the cluster, 3+Q) killed 3 at once; Raven's DEADEYE; Kestrel's FIELD STIM (+40 HP to Torq). Abilities felt good and readable in the log.
- [52] One hostile kept standing with a red ring at the gate and my squad wouldn't kill him for ~6 s; Torq kept losing HP (148 -> 42) — I could not tell who was shooting him. Moving into the gate fixed it.
- [53] Console found faster this time (a glowing marker inside the compound); "UPLINK OPEN" -> 5 s -> "ASSET SECURED". Escort timer 1:29 shown on the objective line — good.
- [54] BUG/UX: my first move order to the pad (right-click on open ground at the pad edge after steering the camera via minimap) was silently ignored — no voice line, no path line; squad stood still for ~15 s of the 90 s escort timer. Second right-click inside the pad circle got "COPY THAT". (Medium-High: silent order failure.)
- [55] DEBRIEF: 11 eliminations, 0 casualties, collateral 1 (-5,000), mission time 1:13, payout +71,000, balance 122,831. +4 DAYS ELAPSED.
- [56] World at 2087.05.28: NORTH AMERICA 50% -> 9% CONTROL, 96% UNREST, CRISIS, tax 154 CR/24H — despite my STABILIZE there. AFRICA is now "NEXUS GLOBAL // TAX PAID YES" at 4% control / 96% unrest (I won two contracts there). So Control is NOT "how much Nexus holds" as the orientation text says — Asia is 67% control but owned by Stratos. I genuinely cannot model the strategic layer. (High confusion.) Influence 6P: every action "UNAFFORDABLE".
- [57] Feed: "CONTRACT LOW CIRCUIT EXPIRED", "PALE HARBOR EXPIRED" — contracts appear and vanish during the 4-day jumps; I never saw them. New priority contracts: LOW GARDEN (New Boston, NA, 6H expiry), ASHEN ACCORD (Cairo), CRIMSON GARDEN (Lagos).

### Between 4 and 5
- [58] Research 14/21. Neural Accelerator MK II (48k, 8h, -12% fire delay, +0.15 speed, NEURAL) vs Threat Prediction (31k, +12 HP, also NEURAL) — same bay, so I picked one. Tier 4 projects (Tungsten Sabot 76k/14h, Neural Cache 80k/14h) are visible and locked — clear goals.
- [59] Market: HALLOW (assault), LYNX "V. LINDQVIST" (recon), UMBRA "V. LINDQVIST" (infiltrator). BUG: two candidates share the exact same name V. LINDQVIST; and the callsign LYNX was reused for a different person (earlier LYNX was Y. MBEKI). Hired UMBRA (23k).
- [60] The world-map contract list only shows ~1 card; the second (LOW GARDEN) was hidden below and needed a wheel scroll inside the panel — easy to miss priority contracts. (Medium.)

### Mission 5 — LOW GARDEN (New Boston, priority suppression) — ABORTED after 3 KIA
- [61] Squad Mara/Torq/Kestrel/Umbra, HP 170/176/140/152. Brief mentioned "THREE MINUTES" but no timer appeared in the objectives panel.
- [62] Tried C (weapons tight) while advancing: worked — no stray-fire deaths while moving, and the squad didn't shoot until I gave orders. But my targeted attack still produced "CIVILIAN HIT. COLLATERAL COUNT 1". Note the text dump of the HUD contains the whole pause-menu key list even when it isn't visible (harness detail, not a game issue).
- [63] Big plaza full of civilians before the CORPSEC gate. Held position, killed a patrol of 4 cleanly. Then advanced ~10 m toward the gate: KESTREL 86/140 -> FLATLINED in ~3 s; UMBRA 112/152 -> FLATLINED in ~2 s (while I was ordering the officer kill, which worked: "OFFICER DOWN. THE CALL NEVER WENT OUT"); TORQ died 10 s later despite 3 med kits (each +50). Torq's FRAG CHARGE said "NO TARGET FOR THE CHARGE" three times — with the cursor on enemies. I don't know its range or targeting rule; worked twice before, failed three times here. (High: ability targeting unexplained.)
- [64] I could rarely see WHO was shooting my operatives. Hostiles in the gate area blend with the gate's red lights; no damage-direction indicator; the squad-card HP drops are the only signal.
- [65] Mara alone at 102 HP, so I opened the pause menu -> ABORT -> "CONFIRM? PRESS AGAIN WITHIN 3 S TO ABORT MISSION" (no word on consequences). Confirmed.
- [66] **BUG / EXPLOIT (Critical): ABORT undid the whole mission.** Returned straight to World Network (no debrief), date still 2087.05.28 21:27, credits unchanged, LOW GARDEN still open, and TORQ, KESTREL and UMBRA are back on the roster as READY. Abort = free undo of deaths. Combined with REPLAY MISSION on debriefs, permadeath has no teeth. I'm going to retry it once (honestly, as a player who just found this would) and note it as a retry.

### Mission 5 (retry after abort) — LOW GARDEN — WON, 2 KIA (Torq, Raven), collateral 1
- [67] Retry with Mara/Torq/Kestrel/Raven. Map/spawns identical to the aborted run (deterministic) — so the abort genuinely acts as a free scout + undo.
- [68] Raven died at HOLD position, ~3 s from 129 HP, while I was trying Torq's charge ("NO TARGET FOR THE CHARGE" again with the cursor on a hostile ~15 m away). Then my "attack the officer" order made the squad WALK toward him into the plaza (attack = approach). Got "REINFORCEMENT CALL OUT. GUARDS CONVERGING." and Torq died (176 max HP, 2 med kits + 1 stim). Mara + Kestrel then cleaned up ~8 hostiles from cover behind a car.
- [69] Debrief: 14 eliminations, 2 KIA (TORQ, RAVEN), collateral 1 (-5,000), time 1:13, payout +90,000, balance 142,416. No REPLAY button (generated contract). Losing Torq hurts: he had 3 XP and was my demolitions; the market has no demolitions now.
- [70] Of 6 mission attempts, the losses always came in the same pattern: approaching a gate/compound across open ground, 2-4 operatives firing at one of mine, death in 2-3 s. Holding behind cars was nearly lossless. That's a learnable rule (good), but the game never teaches it and nothing on screen marks cover or enemy lines of fire.

### After mission 5
- [71] World 2087.06.01: winning LOW GARDEN in New Boston did not lift North America at all — CONTROL 9% -> 4%, tax 85 CR/24H. Influence back to 12P, Intel LEVEL 4. Roster 5/8.
- [72] Research 15/21. Tier 4 Neural Cache Array correctly refused: "INSUFFICIENT CREDITS // 10,584 CR SHORT" — clear. Authorized Smart Fragmentation + Threat Prediction.
- [73] Influence test: LOBBY on North America ("+8 CONTROL OVER 12H", 10P) and ran the clock 8X for 14 world hours (06.01 21:27 -> 06.02 11:25). Result: CONTROL stayed at 4%, UNREST 92 -> 96%. LOBBY now "COOLDOWN 23H". The promised +8 never showed on the number. Either drift silently eats it or it doesn't work — as a player I can't tell which, and either way the action felt wasted. (High for strategic layer.)
- [74] Stopped here (5 missions + 1 aborted attempt).

## Final report

### Picking up the save
Partly. The top bar (141,000 CR, 14 influence, Intel 2, roster 8/8) and the sector list gave me a fast read of my resources. But the save opened behind a "FIRST UPLINK" orientation modal with the clock already running at 2X, and that modal told me to "start with NEON GARDEN" as if this were a new game. Nothing said how far the campaign had got: I only found out it had 3 authored contracts when the "CAMPAIGN COMPLETE 3/3" banner appeared after my second mission. One word: **Disoriented.** I could see my resources but not where the story stood or what the strategic numbers meant.

### What worked well
- Contract briefs: the recon feed, objectives with "KIT" hints, reward, risk index and collateral tolerance make a clear dossier.
- Squad kits are distinct and readable in the log: Overdrive, Frag Charge ("CHARGE OUT. HEADS DOWN."), Deadeye, Field Stim, Suppression Sweep, med kits on E.
- The officer radio-call advisory ("DROP THE OFFICER IN THE NEXT FEW SECONDS") is the best moment in the game: urgent, readable, and it rewards you ("THE CALL NEVER WENT OUT").
- Research tradeoffs feel real: aug bays compete (Synaptic vs Pain Inhibitor on CHEST, Neural Accel vs Threat Prediction on NEURAL), tier-3/4 costs are about a contract's worth, and the benefit showed up as visibly higher max HP (Mara 124 -> 170).
- The debrief clearly shows collateral cost (-5,000 per civilian) and KIA names.
- Mass/load bands on Assembly (LIGHT +0.15 m/s vs STANDARD) are a small, readable tradeoff.

### Pain points
- **Critical:** ABORT from the pause menu undoes the whole mission. 3 KIA came back READY, the date and credits were unchanged, and the contract was still open. Together with REPLAY MISSION on the debrief, operative death costs nothing.
- **High:** lethality is too fast for the reaction window. Operatives die from about 40-80% HP in 2-3 seconds. The CASUALTY RISK advisory comes too late. I had no damage-direction cue, so I often couldn't tell who was shooting.
- **High:** the strategic layer is opaque and runs away. Every 2-4 day contract ETA (time skipped on deploy) let 4-5 sectors slide into CRISIS. LOBBY "+8 control" did nothing visible over 14 hours. Influence income is about 1 action per mission against 5 sectors in crisis.
- **High:** "CONTROL" contradicts the orientation text ("how much of the sector Nexus holds"): Asia at 67% is Stratos-owned, Africa at 4% is Nexus-held.
- **High:** interactable objectives (cell console, detention server) have no labels on the map. I never found the optional detention server.
- **Medium-High:** move orders sometimes fail silently (no voice line, no path line). One cost 15 s of a 90 s escort timer.
- **Medium-High:** Frag Charge said "NO TARGET FOR THE CHARGE" 4 times with the cursor on hostiles. Its range and targeting rule are never explained.
- **Medium:** an attack order makes the squad walk toward the target, out of cover. That move killed several operatives.
- **Medium:** DEPLOY TEAM deploys with no confirmation, and it sits where AUTHORIZE PROJECT sits on the Research screen. My first deploy was an accident. It happened without pressing ACCEPT CONTRACT, with idle labs and an injured sniper on the bench.
- **Medium:** the contract ETA is a time cost (the "+4 DAYS ELAPSED" skip) that isn't explained before deploy.
- **Medium:** Assembly never names the contract you're about to deploy to.
- **Medium:** the campaign ending was an anticlimax: a banner, with no finale framing on GLASS VEIL.
- **Medium:** priority contracts are hidden below the fold in the Open Contracts panel, so they need a scroll.
- **Low:** mouse-wheel zoom direction feels inconsistent, and the zoom range is narrow. Minimap click steered the camera in some missions but not others.
- **Low:** XP (+1 per mission) has no visible use.

### Confusion points
- Finding the compound gate in mission 1 took about 2 minutes. I got out by using the minimap.
- Finding the cell console took about 1 minute. I right-clicked a glowing pedestal on a guess.
- Control vs ownership: I never resolved it.
- Why the world collapsed: never resolved.
- What "CHANCE %" on contracts means: never explained. It rose 39 -> 45% after Stabilize/Lobby, which was the only readable payoff of influence.
- What happens on ABORT: the confirm says only "PRESS AGAIN WITHIN 3 S TO ABORT MISSION".

### Moments of delight
- Officer radio call and the kill that stops it.
- A Frag Charge on a cluster at the compound: 3-4 kills in 1 second.
- Holding behind a car and watching a 7-man patrol fold.
- Max HP visibly rising after research.

### Bugs (as seen)
1. ABORT reverts the mission and resurrects the dead (see above).
2. Completed contracts (HOLLOW CROWN, GLASS VEIL, RUST HAVEN) stay on the globe and in the sector lists as open, with rising CHANCE.
3. Collateral tolerance contradiction on extraction briefs: "LOW (10%)" in the dossier vs "COLLATERAL TOLERANCE MODERATE" in the mission notes (Hollow Crown, Ashen Ledger). Two objectives are both labelled "TERTIARY".
4. Recruit market: two candidates both named "V. LINDQVIST"; callsign LYNX reused for a different person.
5. LOBBY's "+8 CONTROL OVER 12H" had no visible effect (4% -> 4% over 14 h).
6. The "FIRST UPLINK" orientation and "TUTORIAL 1/9" appear on a continued mid-campaign save, and the world clock runs (2X) behind the modal.
7. Move orders sometimes ignored silently. Frag Charge reports "NO TARGET" with hostiles under the cursor.
8. LOW GARDEN's brief says "THREE MINUTES" but no timer appeared in the mission.

### Per feature
| Feature | Understood purpose? | Engaging? | Suggestion |
|---|---|---|---|
| World map / strategic layer | Partially | No | Show per-sector drift (arrow and rate), what caused each change, and a forecast of what a 4-day deploy will do. Fix the Control definition. |
| Influence | Partially | No | Make effects show on the number, raise income or lower cost, and show "+8 pending" on the sector. |
| Contract briefing | Yes | Yes | Say "deploying skips N days". Fix the collateral contradiction. Mark the finale. Explain CHANCE. |
| Team preparation | Yes | Partially | Name the contract on Assembly. Add a deploy confirmation that lists idle labs and injured bench. Make item slots more varied than med kits. |
| Mission controls / verbs | Partially | Partially | Feedback for invalid move orders. Explain ability range and targeting with a range ring. Add an attack-in-place option. Make Space a quick pause. |
| Mission objectives | Partially | Partially | World-space markers for consoles, servers and pads. Click an objective to jump the camera. |
| Results screen | Yes | Partially | Show the cost of KIA (replacement cost, lost XP, augments). Remove REPLAY for campaign missions, or label it as a save-scum. |
| Research | Yes | Yes | Good. Maybe show the effect in a mission preview ("Mara 124 -> 146 HP"). |
| Spending / hiring | Yes | Partially | Candidates are fine. Losses don't sting because ABORT and REPLAY exist and healing is instant. |

### Information during missions
- Enemies are mostly visible (red rings), but in gate areas they blend with the red lights.
- Squad health is very clear on the cards.
- Objectives are clear in text and unclear in space.
- Threat is the big gap: there is no indication of who is shooting whom, no lines of fire, and no cover readout.
- I gave few orders (stop, hold, focus, ability, heal), which felt right. But each order mattered within a 2-3 s window, which made it feel like twitch play, not a few meaningful orders.
- The results screen made collateral cost clear: 5k per civilian. It did change my play: I used C (weapons tight) while moving in mission 5, which stopped stray-fire deaths while advancing.
- Casualties had no economic line, so they changed my play only because I wanted to keep my favourites.

### Difficulty per mission
- **HOLLOW CROWN** (authored, HIGH): about right / slightly harsh. Won in 1:08 with 1 KIA (Dart died in about 2 s while the squad was bunched at the gate). Partly my fault.
- **GLASS VEIL** (authored finale, SEVERE): too hard in its swings. Won in 0:55 with 2 KIA (Slate and Vex died within 1 s of each other, one between my look and my heal) and 3 collateral (-15k). I understood the cause only afterwards (advancing in the open).
- **COLD LANTERN** (priority, SEVERE): about right. 0 KIA, collateral 2, 0:55. I held position and focus-fired, with better HP from research.
- **ASHEN LEDGER** (generated extraction, SEVERE): about right. 0 KIA, collateral 1, 1:13. One silent move-order failure.
- **LOW GARDEN** (priority suppression, SEVERE 99): too hard. First attempt: 3 KIA, then aborted. Retry: won with 2 KIA (Torq, Raven), collateral 1. Deaths happened even at HOLD.
- Did difficulty rise fairly? Not really. It swings with whether you approach across open ground, not with contract tier. Research HP scaled me up faster than the authored curve. All missions lasted about 1 minute, so there's little room for difficulty to build.
- Failures: I understood them in hindsight (open ground, attack orders that advance), but the game did not tell me in time.

### Would I play again?
Maybe. The squad layer has a real core: abilities, the officer call, holding cover. The research choices are satisfying. But the strategic layer felt like watching the world burn with no lever that worked. With missions about 1 minute long and losses undoable, the mid-game lacks tension and meaning. I'd come back if the world map explained itself and losses stuck.

### Top 3 priorities to fix
1. Make losses permanent and meaningful: ABORT should not revert the mission (it should count as a failure with KIA kept), remove or cost REPLAY on the campaign, and put KIA cost on the debrief.
2. Make the strategic layer legible and controllable: a correct Control definition, visible drift and causes, influence effects shown on the numbers (LOBBY seemed to do nothing), and a warning about how many days a deploy skips.
3. Make combat readable within a human reaction window: damage-direction and line-of-fire cues, an earlier casualty warning (or slower time-to-kill), world markers for objectives and consoles, feedback for invalid orders, and ability range rings.

### Counts
- Missions played: 6 attempts (5 completed, 1 aborted). Won 5, lost 0, aborted 1 (LOW GARDEN first try, 3 KIA reverted by the abort).
- Operatives lost (permanent): 5. Dart (Hollow Crown), Slate and Vex (Glass Veil), Torq and Raven (Low Garden retry). Plus 3 deaths undone by the abort (Torq, Kestrel, Umbra).
- Hired: Cinder (22.5k) and Umbra (23k).
- Research: 3/21 -> 15/21 (+2 running).
- Credits: 141,000 -> 142,416 at the end (about 383k earned, the rest spent on research and hires).
- Harness commands: about 890 logged actions. 322 screenshots.
