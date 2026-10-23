# Playtest notes - session 2 (agent-2026-10-23-s2)

- [00:00] Menu: "NEXUS REBORN - CORPORATE GEOSTRATEGIC COMMAND INTERFACE", "NO CAMPAIGN ON FILE", buttons "<< NEW OPERATION >>" and "SETTINGS". Clear.
- [~1min] NEW OPERATION -> World Network screen. Orientation popup "FIRST UPLINK" explained Tax/Control/Unrest, told me to start with NEON GARDEN (87%). Clear and helpful. The strategic clock was RUNNING at 2X when I arrived (time moved 14:32->...), I paused it. Good that popup told me to pause, but clock runs behind a modal -> slight unfairness.
- Globe is pretty; clicked NEON GARDEN pin -> BRIEF screen. Briefing: reward 37,000 CR, primary reach relay yard, secondary destroy 3 fuel relays, tertiary extract, optional backup transformer +6,000 CR. Kit hint: "POWER CELLS ARM GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY". Credits 128,450; Influence 0; Intel 1; roster 8/8.
- [~5min] ASSEMBLY screen: a team of 4 (Mara Assault, Ghost Recon, Dart Infiltrator, Torq Demolitions) was pre-assigned. Item slots empty at first ("+ EMPTY SLOT") - I had to discover that clicking a slot CYCLES empty -> MED KIT -> POWER CELL -> empty (no label told me this; the header said "ITEM SLOTS MED 8KG / CELL 6KG"). Minor confusion ~3 attempts. Gave everyone a power cell + med kit (the briefing hinted power cells arm grenades). Right panel needs scrolling (mouse wheel) to reach loadout - not obvious.
- RESEARCH: 21 projects in 3 labs (Ballistics, Cybernetics, Systems), "ONE PROJECT PER LAB // PROJECTS RUN ON WORLD TIME". Authorized the three tier-1 projects (16k+15k+18k = 49,000 CR, each 2H) - credits 128,450 -> 79,450. Easy to understand. Projects do not progress while the clock is paused (expected).
- [~15min] MISSION 1 (Neon Garden, Oslo). Mission screen: tutorial toasts 1-9 (select/move/engage/stances/role ability/items/swap/directives/extraction), good. Controls: 1-4 select, 0 = whole squad, right-click move/engage, Q role ability (all selected, I wasted Overdrive/Pulse scan/Ghost veil while following tutorial step 5), G grenade targeting (uses power cell of the ACTIVE operative only), E med kit (auto-heals most wounded selected), H/C stances, V swap weapon.
- CAMERA CONFUSION (~6 attempts): wheel did not zoom; WASD/arrows did nothing; the squad walked off-screen. Eventually found that pressing F (or maybe clicking the minimap) re-centres on the squad - but with a lag of a few seconds, so I thought it hadn't worked. Nothing on screen told me how to pan/zoom. Medium-High pain.
- Minimap: starts zoomed in showing only the insertion corner; "-" button helps. Tutorial 8 said "the minimap marks its zone" but the target was off the minimap until I zoomed it out.
- Fighting: first patrol killed fine. Reaching the yard completed primary objective immediately and woke the guards; 6 hostiles neutralised in ~3 seconds, squad hurt (Torq 57/132).
- !!! FRIENDLY FIRE: I used G (grenade) on a glowing relay cube with my squad standing ~3-4 m away. No blast radius preview, no warning. First throw: Mara 103->42, Dart 59->8, Torq 95->50. Third throw (Torq, 4th time I used G) killed DART (K. Park, 58 HP) and left Torq 4/132, Mara 44, Ghost 34. I only "saw" this in the comm log: "AGENT DOWN. K. PARK FLATLINED." HIGH severity: a new player has no way to know the grenade hurts the squad and its radius. The briefing told me "POWER CELLS ARM GRENADES, THE FAST TOOL".
- Also unclear which glowing cubes are the relays: 4 cubes in yard, "DEVICE DESTROYED: RELAY-01" appeared once, but the cube I was aiming at still glows. No on-screen HP/label for the relays.
- [~25min] RELAY PUZZLE: Directive "DESTROY THE THREE FUEL RELAYS". 4 glowing cubes in the yard; only log message tells me which died: "DEVICE DESTROYED: RELAY-01", later "RELAY-03". Cubes never change appearance when destroyed, so I cannot tell which are done. Each relay seems to need ~2 grenades (first throw at a cube didn't destroy it). I wasted 5 power cells (one killed my own Dart). Cannot find any way to shoot a device: right-click on a cube = move order only ("RIGHT CLICK: ATTACK A HOSTILE"); squad stood next to cubes for 10+ s without firing. Briefing says "GUNFIRE WORKS, SLOWLY" but I could not make guns work on a relay -> relay-02 left undone. HIGH: key secondary objective unachievable without cells and no feedback why.
- The pause screen (click PAUSE) lists all controls: W/A/S/D pan, F recenter, +/- zoom, wheel zoom, X stop, H hold, C hold fire. I only found it after ~25 min. Wheel zoom didn't seem to work for me; "-" key did. Suggest showing control hints in first tutorial step.
- Enemy count seemed low and weak; hostiles died within seconds. Danger came from my own grenades, not from the enemy. Med kits (6) all spent by 11 min.
- [~45min] SOFT-LOCK on mission 1: after wasting all power cells (5 total), the remaining relay can't be destroyed. Right-click on a relay cube makes an operative say "ADVANCING" and walk onto it, then nothing happens (no shooting, ammo unchanged, 25 s waited). Extraction: standing in the insertion circle with the squad does not extract because "DESTROY THE THREE FUEL RELAYS" is still ACTIVE. Waited several game-minutes: no reinforcement, no timer, no fail. The minimap shows alive objectives as bright blue dots and destroyed ones dim, which was the only way I found to tell which cubes were alive.
- The pause overlay (controls list, RESUME/SETTINGS/ABORT) exists in the page text after clicking PAUSE but never renders on screen in the screenshots; I couldn't click ABORT (tried 5 times). Could be harness-related. So I have no in-game way to abandon the mission.

## Final report

Session ended early: Mission 1 (Neon Garden) became unwinnable and un-abandonable (soft-lock) at roughly game time 18:40 (13 minutes into the mission). I never reached a results screen, never played a second contract, never saw the strategic layer again after deploying.

### First 5 minutes
- Goal: Yes. Menu -> "NEW OPERATION" -> World Network with a "FIRST UPLINK" orientation card that said what the job is (hold sectors, Tax yield, four numbers) and told me which contract to start with (NEON GARDEN, 87%). Very good first-time onboarding.
- Controls: Partly. Mission tutorial (9 toasts) taught select/move/engage/stances/role ability/items/swap/directives/extraction. It did NOT tell me how to pan or zoom the camera, nor that grenades hurt my own squad.
- Emotional response: Intrigued, then frustrated. Strong atmosphere (HUD, rain, globe) but the mission turned on me through no enemy action.

### What worked well
- World Network screen: clear four-number readout, globe with contract pins, orientation card, clock controls with pause. Briefing screen is rich and readable (reward, objectives, threat, kit hints).
- Research tree: simple, understandable (3 labs, tier-1 projects 15k-18k CR, 2H each, runs on world time).
- Mission HUD: squad panel, comm log with plain barks, directive panel, ability bar with cooldowns, minimap (objective zone, bright/dim dots for alive/destroyed objectives).
- Gunfights vs CorpSec were quick and readable: patrols died in seconds.
- Med kit (E) automatically targeting the most wounded was a nice touch.

### Pain points
- HIGH: Grenade (G, power cell) has no blast-radius preview or warning and hurts the squad. Three throws with the squad 3-4 m away: first took Mara 103->42, Dart 59->8, Torq 95->50; a later one killed Dart outright and left Torq at 4/132. The briefing sold grenades as "THE FAST TOOL".
- HIGH: Relay objective soft-lock. Relays seem to need ~2 grenades each; glowing cubes look identical alive or destroyed; only the comm log ("DEVICE DESTROYED: RELAY-01") and the minimap (dim vs bright dots) show state. Once the 5 power cells were gone, nothing I tried could damage the last relay: right-click on it only makes the operative say "ADVANCING" and walk onto it; hold-position, hold-fire, weapon swap, standing adjacent 25 s, Q abilities all did nothing. The briefing line "GUNFIRE WORKS, SLOWLY" did not match my experience. With the relay directive still ACTIVE, standing in the insertion circle does not extract, and there is no fail timer, no reinforcement, no extraction override. Waited ~13 game minutes.
- HIGH: No visible way to abandon the mission. The pause overlay (controls list, RESUME / SETTINGS / ABORT) exists in the page text when I click PAUSE but never rendered in screenshots and I could not click ABORT (may be harness-related, cannot tell).
- MEDIUM: Camera. Wheel did not zoom for me; WASD/arrows did nothing in single taps; the squad walks off-screen. Found F (recenter, with a few seconds lag), "-" key (zoom out) and minimap click (pan, works only sometimes) by accident after ~25 min. Controls listed only in the pause overlay.
- MEDIUM: Item slots in Assembly start empty and clicking cycles empty -> med kit -> power cell -> empty with no label; right panel needs scrolling to find loadout.
- MEDIUM: The strategic clock was already running at 2x behind the orientation modal.
- MEDIUM: Tutorial step 5 ("Q triggers role abilities") makes you burn Overdrive / Pulse scan / Ghost veil with no target.
- LOW: Minimap starts too zoomed in to show the objective, although tutorial step 8 says it marks the zone.
- LOW: Civilian killed by my grenade; "COLLATERAL 1" appeared top-right with no explanation of the 10% tolerance.
- LOW: Operative HP in mission (124/124) differs from Assembly "92%" style stats; unclear relation.

### Confusion points
- Camera control: ~25 min (found by accident).
- Which cube is which relay and how to destroy it: ~20 min, never solved.
- Item slot cycling: ~3 attempts.
- Getting out of the mission: ~15 attempts, never solved.

### Moments of delight
- Orbital globe with contract pins and labels; the first patrol dying instantly to Ghost; "OBJECTIVE COMPLETE: REACH THE RELAY YARD" firing as soon as the squad crossed the fence.

### Bugs / oddities
- Pause overlay present in DOM text but not visible (possibly harness).
- Destroyed relays keep their glowing cube model.
- "G" ability only uses the ACTIVE operative's cell; the squad-wide cell counter (R 05) does not say whose cells remain.
- Right-click on a device is accepted ("ADVANCING") but produces no attack.
- Sim time passes a few seconds on every click (harness behaviour, may not be a game bug).

### Per feature (understood purpose / engaging / suggestion)
- World map / strategic layer: Yes / Yes / Keep the orientation card; start the clock paused.
- Contract briefing: Yes / Yes / Good. Make "GUNFIRE WORKS" claim true or explain the damage rate; warn about blast radius.
- Team preparation (Assembly): Partially / Partially / Label the slot cycle; show kit totals; show that a power cell is the only reliable way to hit a relay.
- Mission controls and verbs: Partially / Partially / Show camera controls and grenade radius. Overdrive/Frag charge never tested properly.
- Mission objectives: Partially / No / Show per-relay state and HP on the map; give a fallback when cells run out.
- Results screen: Not reached.
- Research: Yes / Partially / Could not see any result of the research (projects need world time, which never ran again).
- Spending / hiring: Only research tried (49,000 CR committed). Recruit button disabled at 8/8. Not explored further.

### Difficulty
Too hard in one specific way: the opposition was weak (6+ hostiles died in seconds, no squad member was lost to enemy fire), but the cell economy (5 cells for 3 relays needing ~2 each) plus unwarned friendly fire plus the lack of a fallback made the mission unwinnable. Soft-lock rather than a difficulty problem.

### Would I play again?
Yes, tentatively: the presentation and strategic framing are strong and the first minutes are well guided. But I would stop after one more soft-lock.

### Top 3 priorities
1. Remove the relay soft-lock: let guns damage relays (visible HP bar), or let extraction proceed without secondary directives, and give a visible abort/retreat button that always works.
2. Grenade safety: blast radius preview, friendly-fire warning, clearer per-operative cell stock; show relay alive/destroyed state in the world.
3. Camera and controls onboarding: show pan/zoom/recenter keys in tutorial step 1 and make wheel zoom and WASD work.

### Counts
Missions played: 1 (not finished) / won 0 / lost 0 / operatives lost 1 (Dart, to my own grenade). Harness commands used: about 230. Money: 128,450 CR at start, 79,450 CR after research (49,000 committed), no mission income received.
