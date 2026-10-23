# Playtest Report

> `/playtest-report analyze production/qa/playtests/agent-2026-10-23-s4/notes.md`, 2026-10-23.
> Decisions in the routing below: Claude, delegated by the owner's /goal 2026-10-23.

## Session Info
- **Date**: 2026-10-23
- **Build**: `123e323`, `npm run dev` on localhost:4200
- **Duration**: about 42 minutes of tester time (890 harness commands, 322 captures); six mission attempts
- **Tester**: agent tester, session 4 (fresh general-purpose agent, briefed as an experienced strategy/tactics player; never read code, specs or docs)
- **Platform**: PC browser, headless Chrome for Testing 1280×720
- **Input Method**: KB+M through the harness
- **Session Type**: Targeted — mid-game systems and the difficulty of Hollow Crown and Glass Veil, from a mid-campaign save

**Save.** The harness `fixture` command: New Operation, then Neon Garden won, Intel 2 at 20/100, 141,000 CR, Influence 14, three projects researched, every tutorial and hint marked seen.

**Harness artifact (verified 2026-10-23).** The "seen" set did not reach the game: the page loaded `save.ts` and `tutorialStore.ts` with a Vite `?t=` stamp, and the fixture's imports without it reached a second store instance. So the tester saw the FIRST UPLINK card (which pointed at the already-won Neon Garden) and tutorial 1/9 on a continued save. Those two observations are artifacts, not game bugs. The harness is fixed to import the URLs the page loaded.

**Method caveat.** As session 3: the game refuses orders while paused, the harness lets about 120 ms pass per input.

## Test Focus
Picking up a save; the authored High and Severe contracts; Influence, Research and hiring between missions; difficulty from contract to contract.

## First Impressions (picking up the save)
- **Understood the goal?** Partially — resources yes, story position and strategic numbers no.
- **Understood the controls?** Yes.
- **Emotional response**: Disoriented (partly the fixture artifact above).
- **Notes**: "CAMPAIGN COMPLETE 3/3" after the second mission was the first sign that Glass Veil was the finale.

## Gameplay Flow
### What worked well
- The officer RADIO CALL advisory and "THE CALL NEVER WENT OUT" — the best moment of the session.
- Distinct, readable kits (Overdrive, Frag Charge, Deadeye, Field Stim, Suppression Sweep).
- Research trade-offs: competing augmentation bays; max HP 124 → 170 felt.
- Brief dossier; Debrief collateral line (−5,000 per civilian).
- Mass bands on Assembly.

### Pain points
- Abort returns the roster and the contract as they were at deploy; with REPLAY on authored debriefs, death can be undone — Severity: High as felt; see routing (accepted design)
- Time-to-kill: 40–80% HP to dead in 2–3 s; CASUALTY RISK too late; no damage-direction cue — High
- Strategic layer: every 2–4-day ETA jump left 4–5 sectors in crisis; North America 68% → 4% after a win there; Lobby +8 did not show on the number over 14 world hours — High
- Control does not mean ownership (Asia 67% Stratos; Africa 4% Nexus-held) — High
- Interactables (consoles, server) unmarked; the optional server never found — High
- Silent order failures: a move order ignored with no feedback (15 s of a 90 s escort); Frag Charge "NO TARGET FOR THE CHARGE" four times with hostiles under the cursor; Attack walks the squad out of cover — Medium
- DEPLOY TEAM sits where Research's AUTHORIZE is and deploys on one click — Medium
- ETA not presented as world time spent — Medium
- Assembly does not name the target contract — Medium
- Priority contracts below the fold in OPEN CONTRACTS — Medium
- Campaign end is a banner only — Medium

### Confusion points
- Ownership vs Control: unresolved (High).
- What drives the world's slide and whether Influence works: unresolved (High).
- Frag Charge targeting rule: unresolved.
- Where the console and server are: about 2 minutes per objective; server never found.

### Moments of delight
- Killing the officer inside the radio delay; Frag Charge "CHARGE OUT. HEADS DOWN." on a cluster; Mara's max HP after research.

## Bugs Encountered
| # | Description | Severity | Reproducible | Status |
|---|-------------|----------|-------------|--------|
| 1 | FIRST UPLINK card and tutorial 1/9 on a continued save | — | Harness artifact | Harness fixed; not a game bug |
| 2 | Brief `COLLATERAL TOLERANCE: LOW (10%)` vs notes MODERATE | S3 | Yes | IF-039 |
| 3 | Two required objectives labelled TERTIARY (four-step contracts) | S4 | Yes | IF-039 (Brief OQ11) |
| 4 | Two recruits named V. LINDQVIST; callsign LYNX reused | S4 | Seen | Polish backlog |
| 5 | Completed authored contracts stay listed | — | By design | ADR-0004 quiet replay; Polish copy ("FULFILLED // REPLAY") |
| 6 | LOW GARDEN notes "Three minutes" with no timer before the cordon objective activates | S4 | Yes | Polish (copy: the window opens at the gate) |
| 7 | Move order silently ignored; Frag Charge "NO TARGET" with hostiles under the cursor | S3 | Seen | Polish backlog, to reproduce |

## Feature-Specific Feedback
| Feature | Understood? | Engaging? |
|---|---|---|
| World map / strategic layer | Partially | No |
| Influence | Partially | No |
| Contract briefing | Yes | Yes |
| Team preparation | Yes | Partially |
| Mission controls and verbs | Partially | Partially |
| Mission objectives | Partially | Partially |
| Results screen | Yes | Partially (no KIA cost) |
| Research | Yes | Yes |
| Spending / hiring | Yes | Partially |

## Quantitative Data
- **Missions**: Hollow Crown won 1:08 (1 KIA); Glass Veil won 0:55 (2 KIA, 3 civilians); Cold Lantern won 0:55 (0 KIA, 2 civilians); Ashen Ledger won 1:13 (0 KIA, 1 civilian); Low Garden aborted (3 dead, undone by Abort); Low Garden won 1:13 (2 KIA, 1 civilian).
- **Deaths**: 5 permanent (Dart, Slate, Vex, Torq, Raven); all crossing open ground towards a gate; holding behind cover was "nearly lossless".
- **Economy**: 141,000 → 142,416 CR; research 3/21 → 15/21; 2 hires.

## Overall Assessment
- **Would play again?** Maybe — "the squad core is good, but the world map gives me no lever that works."
- **Difficulty**: Hollow Crown about right; Glass Veil too hard in its swings; Cold Lantern and Ashen Ledger about right; Low Garden too hard. Difficulty did not rise with tier; it swung on open ground vs cover.
- **Pacing**: Missions about one minute — "a burst of chaos, not a tactics puzzle".
- **Session length preference**: Longer missions.

## Top 3 Priorities from this session
1. Make losses stick (Abort, Replay, KIA cost on the Debrief).
2. Make the strategic layer readable (Control definition, drift and its causes, Influence effects, the days a deploy spends).
3. Make combat readable within human reaction time (reaction window, objective markers, invalid-order feedback, ability ranges).

## Action Routing
- **Design changes**: casualty hold (TM-019); objective markers (TM-020); ownership readout and Control copy (WN-022).
- **Balance adjustments**: world drift and seizure rate (WN-021). With the drift fixed, Lobby's +8 and Stabilize's −12 become visible on the numbers.
- **Accepted design, not changed**: Abort escapes every ledger. `docs/game-design.md` §19 #8 (closed), `design/gdd/game-concept.md:202`, cross-review 2026-10-07 3c ("scout-and-abort … accepted"). Reopening it is the owner's call; logged for the creative director (fun-hypothesis doc) and the owner.
- **Bug reports**: 2, 3 → IF-039; 4, 6, 7 → Polish backlog.
- **Polish items**: DEPLOY confirm or placement; Assembly names the contract; priority contracts above the fold; campaign end beat; KIA cost line; damage-direction cue; ability range rings; invalid-order feedback.

## Creative Director Assessment
See `production/qa/playtests/fun-hypothesis-2026-10-23.md` (CD-PLAYTEST over sessions 2–4 together).
