# Playtest Report

> `/playtest-report analyze production/qa/playtests/agent-2026-10-23-s2/notes.md`, 2026-10-23.
> Decisions in the routing below: Claude, delegated by the owner's /goal 2026-10-23.

## Session Info
- **Date**: 2026-10-23
- **Build**: `d40bff5` working tree (Sprint 11 complete), `npm run dev` on localhost:4200
- **Duration**: about 45 minutes of tester time; one mission, 13 game-minutes in the mission
- **Tester**: agent tester, session 2 (fresh general-purpose agent; never read code, specs or docs; saw only screenshots and on-screen text)
- **Platform**: PC browser, headless Chrome for Testing 1280×720
- **Input Method**: KB+M through the harness (`production/qa/playtests/harness/`)
- **Session Type**: First time — new-player experience

**Method caveat.** An agent is not a human. The harness holds the mission pause between commands and lets about 120 ms of mission time pass per input, so the tester thinks with the sim frozen and acts in short bursts. The session's harness also had two defects, both fixed after it: the PAUSE overlay never showed in captures, and the hold leaked time between commands. Findings that depend on reaction time are therefore weighed against session 3 and 4, which ran on the fixed harness.

## Test Focus
New-player flow from New Operation through the first contract and beyond: orientation, Brief, Assembly, Research, the first mission's verbs and objectives, extraction.

## First Impressions (First 5 minutes)
- **Understood the goal?** Yes — "FIRST UPLINK" said what the job is and which contract to start with.
- **Understood the controls?** Partially — the mission tutorial taught select, move, engage, stances, abilities, items, directives and extraction; it did not teach camera pan and zoom, nor that grenades hurt the squad.
- **Emotional response**: Intrigued, then Frustrated
- **Notes**: strong atmosphere; the mission turned against the tester through their own grenades, not enemy action.

## Gameplay Flow
### What worked well
- World Network four-number readout, globe pins, orientation card, clock controls.
- Brief: reward, objectives, threat and KIT hint readable.
- Research: three labs, tier-1 costs and 2-hour duration understood at once.
- Mission HUD: squad panel, comm log, directives, ability bar, minimap; patrols die in seconds and fights read clearly.
- Med kit on E picking the most wounded selected operative.

### Pain points
- Grenade had no blast-radius preview and no warning that it hurts the squad; three throws near the squad killed Dart — Severity: High
- Camera pan/zoom not taught; found after about 25 minutes — Medium
- Item slots start empty; click cycles empty → med kit → power cell with no label — Medium
- Strategic clock running behind the orientation card — Low (owner ruling 2026-10-22: the clock runs under the card)
- Tutorial step 5 burns role abilities with no target — Medium
- Minimap opens too zoomed in to show the objective — Low

### Confusion points
- Camera control: about 25 minutes, found by accident.
- Which glowing cube is which relay, and how to damage one: about 20 minutes, never solved.
- Item slot cycling: about 3 attempts.
- Leaving the mission: about 15 attempts, never solved (harness defect: the PAUSE overlay did not render in captures).

### Moments of delight
- The globe with contract pins; the first patrol dropping instantly; "OBJECTIVE COMPLETE: REACH THE RELAY YARD" on crossing the fence.

## Bugs Encountered
| # | Description | Severity | Reproducible | Status |
|---|-------------|----------|-------------|--------|
| 1 | Destroy soft-lock: with no power cells and no hostile in sight, gunfire could not reduce the last relay; no fail state, no extraction | S2 | Yes | Fixed in TM-018 (free fire works a required objective device) |
| 2 | Destroyed relays keep their glowing core and read as live | S3 | Yes | Fixed in TM-018 |
| 3 | PAUSE overlay present in page text but not in captures; ABORT unreachable | — | Harness | Harness defect, fixed 2026-10-23 (captures hide the overlay only while the harness holds; the player's pause stays visible) |

## Feature-Specific Feedback
### World Network
- **Understood purpose?** Yes — **Found engaging?** Partially — **Suggestions**: pause the clock under the card (owner already ruled it runs).
### Brief
- **Understood purpose?** Yes — **Found engaging?** Yes — **Suggestions**: "GUNFIRE WORKS, SLOWLY" must be true (fixed in TM-018).
### Assembly
- **Understood purpose?** Partially — **Found engaging?** Partially — **Suggestions**: say that a click cycles the slot.
### Mission verbs
- **Understood purpose?** Partially — **Found engaging?** Partially — **Suggestions**: blast ring and friendly-fire warning before the first throw; teach the camera.
### Research
- **Understood purpose?** Yes — **Found engaging?** Yes — **Suggestions**: none.

## Quantitative Data
- **Deaths**: 1 operative (Dart), killed by the squad's own grenade; 1 civilian hit by a grenade.
- **Time per area**: about 15 minutes to the first deploy; 13 game-minutes in the mission, most of it stuck on the last relay.
- **Items used**: 5 power cells, 6 med kits.
- **Features discovered vs missed**: missed camera keys (until the pause list), optional objective, abort.

## Overall Assessment
- **Would play again?** Maybe (session ended in a soft-lock)
- **Difficulty**: Too Easy against CorpSec; the danger was self-inflicted
- **Pacing**: Good to the mission; stalled in it
- **Session length preference**: n/a

## Top 3 Priorities from this session
1. Destroy soft-lock (fixed, TM-018).
2. Grenade blast radius and friendly fire visible before the first throw (ring fixed in TM-018; the warning still reaches some players too late — see session 3, TM-021).
3. Teach the camera (fixed in TM-018's MOVEMENT step).

## Action Routing
- **Design changes**: none open from this session alone.
- **Balance adjustments**: none.
- **Bug reports**: 1 and 2 fixed in `production/epics/tactical-mission/story-018-playtest-two-mission-fixes.md`.
- **Polish items**: item-slot cycle hint (IF-039); tutorial step 5 burning abilities; minimap opening zoom.

## Creative Director Assessment
See `production/qa/playtests/fun-hypothesis-2026-10-23.md` (CD-PLAYTEST over sessions 2–4 together).
