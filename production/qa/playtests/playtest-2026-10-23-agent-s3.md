# Playtest Report

> `/playtest-report analyze production/qa/playtests/agent-2026-10-23-s3/notes.md`, 2026-10-23.
> Decisions in the routing below: Claude, delegated by the owner's /goal 2026-10-23.

## Session Info
- **Date**: 2026-10-23
- **Build**: `ad176af` (TM-018 and IF-038 in), `npm run dev` on localhost:4200
- **Duration**: about 31 minutes of tester time (510 harness commands); four missions
- **Tester**: agent tester, session 3 (fresh general-purpose agent; never read code, specs or docs)
- **Platform**: PC browser, headless Chrome for Testing 1280×720
- **Input Method**: KB+M through the harness (fixed: pause ownership, no time leak between commands)
- **Session Type**: First time — new player through several contracts

**Method caveat.** The harness holds the mission between commands and lets about 120 ms pass per input. The game itself refuses every order while its pause is open (`missionKeyAnswers`, `src/ui/pauseMenuModel.ts:27`), so a human must unpause and then press select and E in real time; 120 ms per key is faster than a human. The three deaths below therefore over-state nothing: at 3, 7 and 13 HP the operative died inside the two key presses a human would also need.

## Test Focus
New player from New Operation through four contracts: onboarding, Brief, Assembly, Research, hiring, Influence, mission verbs, results.

## First Impressions (First 5 minutes)
- **Understood the goal?** Partially — the card's job and first contract were clear; no overall win condition was stated.
- **Understood the controls?** Yes for the basics (the mission tutorial).
- **Emotional response**: Intrigued
- **Notes**: "the presentation is strong … but the strategic numbers were opaque from minute one."

## Gameplay Flow
### What worked well
- Screen flow world → brief → assembly → mission → debrief → world, fast and deliberate.
- Brief informative; KIT line understood.
- Research the clearest system: cost, time, exact benefit, auto-slotted augments; the idle-lab debrief nudge.
- Abilities meaningful once found (Pulse Scan, Overdrive, Field Stim, Deadeye; R recharges an ability with a cell).
- Grenade red ring and collateral counter with its invoice line.

### Pain points
- Burst damage: front operative dies in about 2 game-seconds (Dart 66→3→0, Torq 84→7→0, Zenith 79→41→13→0); CASUALTY RISK fires once per campaign and after the first death; nothing holds the sim — Severity: High
- Sector ownership unreadable: North America at Control 86 / Unrest 8 reads "CONTESTED // NOT NEXUS-HELD" while Europe at 37 / 89 reads Nexus-held; the card defines Control as "how much of the sector Nexus holds" — High
- Friendly fire taught at tutorial step 6/9, which appeared in mission 2 after two throws near the squad — High
- Active objective not shown in the 3D view; 1–2 minutes of hunting per objective, two power cells wasted on scenery — Medium
- Deploy's world-time cost hidden: "ETA 2D" read as travel, the first trip lost the only paying sector, the Debrief did not say so — Medium
- The world slides into crisis whatever the player does; a Stabilize changed nothing visible — Medium
- Weapons Tight (C) walked the squad into fire without returning it; Zenith died — Medium
- Item slots start empty, click-to-cycle unlabelled — Low
- Ability bar icons numbered 1–4 clash with operative keys 1–4 — Low
- 45-second hold was dead time after the wave died — Low

### Confusion points
- Ownership vs Control: unresolved across the whole session (High).
- Finding objectives: 1–2 minutes each, solved by zooming the minimap crop.
- Grenade friendly fire: learned after the fact.
- REPLAY MISSION shown after mission 2 only, unexplained.

### Moments of delight
- Relay explosion in the rain; North America turning green after Rust Haven; saving the medic at 1 HP; mission 4's clean grenade on three guards.

## Bugs Encountered
| # | Description | Severity | Reproducible | Status |
|---|-------------|----------|-------------|--------|
| 1 | Brief dossier prints `COLLATERAL TOLERANCE: LOW (10%)` for every contract while the notes say MODERATE on compounds; no percentage tolerance exists (collateral is 5,000 CR per hit, capped at Reward) | S3 | Yes | Fix in IF-039 (Brief OQ7) |
| 2 | "ABILITY READY" advisory at second 0 of mission 2 (carried from mission 1's idle timer) | S4 | Seen once | Polish backlog |
| 3 | Med kit pressed for a dying operative applied to another (most wounded selected) | — | By design | Not a bug (`tactical-mission.md`: E heals the most wounded selected) |
| 4 | ALERT 0 while the log read "THREAT LEVEL ELEVATED" | S4 | Seen once | Polish backlog |
| 5 | Grenade spent with no "GRENADE DETONATED" log line | S4 | Seen once | Polish backlog |
| 6 | No notice when research completes | — | Design | Research spec OQ18 (completions are silent); Polish |
| 7 | REPLAY MISSION after mission 2 only | — | By design | Replay is offered on authored contracts (ADR-0004); copy to explain in Polish |

## Feature-Specific Feedback
| Feature | Understood purpose? | Engaging? | Suggestion |
|---|---|---|---|
| World map / strategy | Partially | Partially | Explain ownership; "while you were away" |
| Contract brief | Yes | Yes | Reconcile CHANCE with RISK INDEX; state days spent |
| Team prep | Yes | Partially | Slot tooltip or pre-filled slots |
| Selecting, moving, camera | Yes | Yes | — |
| Attacking | Yes | Partially | Reaction window |
| Abilities | Partially | Yes | Teach Q early |
| Items / grenades | Partially | Yes | Friendly fire and R before the first fight |
| Objectives | Partially | Partially | 3D markers |
| Results | Yes | Partially | Cost of a KIA; sector change |
| Research | Yes | Yes | Completion notice |
| Hiring | Yes | Partially | — |
| Influence | Partially | No | Show each action's effect |

## Quantitative Data
- **Deaths**: 3 operatives (Dart, Torq, Zenith), each at the front, each in about 2 game-seconds; 1 civilian.
- **Missions**: 4 played, 4 won (Neon Garden 1:12, Rust Haven 1:58, Crimson Ledger 1:16, Cold Anthem 0:42); optionals 0 of 2.
- **Economy**: 128,450 → 96,312 CR; 8 projects researched; 1 hire (32,000 CR, killed the next mission); 3 Influence actions.
- **Features discovered vs missed**: missed both optional objectives; found R and Q late.

## Overall Assessment
- **Would play again?** Yes, cautiously — "mission 4 showed it is fun when it is readable."
- **Difficulty**: Too Hard in the firefight spikes, Too Easy to complete (4 of 4 won); the strategic layer felt unwinnable.
- **Pacing**: Missions too short (42 s to 2 min); strategy screens good.
- **Session length preference**: Longer.

## Top 3 Priorities from this session
1. Make ownership and what happened while away readable.
2. A reaction window, and friendly fire / Q / R taught before the first fight.
3. Every objective drawn in the 3D view, optional ones too.

## Action Routing
- **Design changes**: casualty hold (TM-019); ownership readout and the card's Control line (WN-022); grenade friendly-fire hint at first arming (TM-021); objective markers in the 3D view (TM-020).
- **Balance adjustments**: world drift — measured with no player action, 4 of 6 sectors reach crisis by strategic day 6 and Control floors at 4% (WN-021, against `design/difficulty-curve.md` "arc toward ease").
- **Bug reports**: 1 → IF-039; 2, 4, 5 → Polish backlog (`production/milestones/polish.md`).
- **Polish items**: ETA as world time spent (IF-039); slot hint (IF-039); ability bar numerals; research completion notice; Weapons Tight wording; KIA cost on the Debrief; dead-time hold.

## Creative Director Assessment
See `production/qa/playtests/fun-hypothesis-2026-10-23.md` (CD-PLAYTEST over sessions 2–4 together).
