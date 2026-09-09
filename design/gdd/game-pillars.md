# Game Pillars: Nexus Reborn

## Document Status
- **Version**: 1.0
- **Last Updated**: 2026-09-07
- **Approved By**: pending — extracted from living spec; CD-SYSTEMS CONCERNS 2026-09-07
- **Status**: Draft
- **Source**: `docs/game-design.md` §2. Living spec remains source of truth.

---

## Core Fantasy

The player is the Operations Director of Nexus Global. Remote command, not heroics. They never walk the street. They read a hostile corporate world, spend a few consequential orders, and live with the corporate cost of every stray round.

---

## Target MDA Aesthetics

| Rank | Aesthetic | How Our Game Delivers It |
| ---- | ---- | ---- |
| 1 | Fantasy | Director identity; terminal as the character |
| 2 | Challenge | Tempo and position; five verbs; readable board |
| 3 | Discovery | Unrest, control, cones, objectives as operational power |
| 4 | Sensation | Neon + terminal chrome as Spectacle |
| 5 | Narrative | Paperwork only — brief, feed, invoice |
| N/A | Fellowship, Expression, Submission | Out of scope or would undo commitment |

---

## The Pillars

Each pillar can kill a proposal. If a pillar never does, it is copy, not design. Living spec does not rank a conflict-winner; all five may veto. Escalate irreconcilable conflicts rather than inventing a ranking.

### Pillar 1: Command, do not micromanage

**One-Sentence Definition**: The player selects groups, places them, and sets stances; operatives acquire visible targets on their own when weapons are free. The skill is tempo and position, not issuing every shot.

**Target Aesthetics Served**: Challenge, Fantasy

**Design Test**: If we're debating per-bullet click combat vs placement-and-stance, this pillar says we choose placement-and-stance.

#### What This Means for Each Department

| Department | This Pillar Says... | Example |
| ---- | ---- | ---- |
| **Game Design** | Five verbs are the protected core: Select, Move, Attack, Hold Ground, Hold Fire | Tactical GDD leads with verbs, not citygen |
| **Art** | Selection rings, routes, and stance feedback over hero poses | Operatives are geometry with pips, not star models |
| **Audio** | Acknowledgements are short selection clicks, not VO banter | No spoken operative dialogue |
| **Narrative** | No player-as-operative story | Paperwork, not cutscenes |
| **Engineering** | Automatic acquisition when weapons are free | Do not require a click per round |

#### Serving This Pillar
- Operatives fire on visible hostiles without a click per shot
- Empty squad bays do not block deployment; 1–4 Ready is valid

#### Violating This Pillar
- Per-bullet click combat
- Forcing the player to babysit idle operatives who can already see a target

---

### Pillar 2: Information is operational power

**One-Sentence Definition**: The player is rewarded for reading the board: unrest, control, patrols, sight cones, objective zones, weapon state, camera coverage. A good order is a small order made at the right time.

**Target Aesthetics Served**: Discovery, Challenge

**Design Test**: If we're debating hiding the minimap as a difficulty lever vs adding patrols, this pillar says we add patrols and keep the map.

#### What This Means for Each Department

| Department | This Pillar Says... | Example |
| ---- | ---- | ---- |
| **Game Design** | Hardened lengthens confirmation and adds patrols; it does not hide information | `DIFFICULTY_FX` |
| **Art** | Cones, rings, garrison marks, objective pulses must read | Building ghosting survives every quality tier |
| **Audio** | Cues mark danger; they do not narrate the board | Alert sting, not VO callouts of every contact |
| **Narrative** | Brief tells the truth about weather and Opening hour | ADR-0006 |
| **Engineering** | Brief and deployment agree on insertion, objectives, counts, weather | Click-through names unexercised screens |

#### Serving This Pillar
- Sight cones and CorpSec states are visible
- Intel gates forecast and Risk index rather than hiding the Scan

#### Violating This Pillar
- Hiding the minimap as a difficulty lever
- Hiding the board only to pad the mission
- Undecorated numbers the player cannot act on

---

### Pillar 3: Violence has corporate consequences

**One-Sentence Definition**: Combat is fast and noisy. Missed shots continue downrange and hit whoever is in the lane. A civilian struck by the squad is a line item on the invoice, not flavor text.

**Target Aesthetics Served**: Challenge, Fantasy

**Design Test**: If we're debating harmless stray fire vs pricing squad-caused civilian hits, this pillar says we price them.

#### What This Means for Each Department

| Department | This Pillar Says... | Example |
| ---- | ---- | ---- |
| **Game Design** | Collateral is deducted; CorpSec-caused harm is not the player's invoice | Living spec §6, §20 |
| **Art** | Hits flash; civilians stay readable in the lane | Sparse informative VFX |
| **Audio** | Audio prices violence; it does not celebrate it | Weapon reports above UI; no cheering |
| **Narrative** | Debrief is the invoice beat | Interface presents; Economy prices; World Network applies sector/unrest |
| **Engineering** | Debrief applies payout once | ADR-0002, ADR-0004 |

#### Serving This Pillar
- Quiet replay still costs roster and ETA
- First squad-caused civilian hit is observable in fixtures

#### Violating This Pillar
- Harmless stray fire
- Collateral that is narrated but not priced
- Making CorpSec-caused civilian harm the player's collateral

---

### Pillar 4: The two layers feed each other

**One-Sentence Definition**: Credits fund research. Research changes the next deployment. Mission results move the sectors. Ownership decides who collects Tax yield. The strategic clock is the same clock that finishes laboratories, heals the roster, and pays that yield.

**Target Aesthetics Served**: Fantasy, Challenge, Discovery

**Design Test**: If we're debating a World Network that is only a contract picker vs a win that moves control/unrest/intel, this pillar says the win must change the network.

#### What This Means for Each Department

| Department | This Pillar Says... | Example |
| ---- | ---- | ---- |
| **Game Design** | Two clocks; debrief spends ETA on a win only | ADR-0001 |
| **Art** | Scan and district are different surfaces of one world | Scan is not a globe |
| **Audio** | Strategy bed vs mission bed follow screen ownership | `strategyAudio.ts` |
| **Narrative** | Invoice includes sector movement, not only credits | Debrief write-back |
| **Engineering** | Deploy snapshot; live World Network must not query the running mission | ADR-0002 |

#### Serving This Pillar
- Research changes weapons, HP, speed, mass on a later deploy
- Tax yield from Nexus-held sectors only (ADR-0008)

#### Violating This Pillar
- A World Network that is only a contract picker
- Research that does not change a later firefight
- A win that leaves the World Network looking as it did before

---

### Pillar 5: One corporate operating system

**One-Sentence Definition**: Every surface is a module of the same secure terminal: near-black, teal, amber, red. Brief, assembly, research, the World Network, the HUD, and the debrief are different rooms of one building.

**Target Aesthetics Served**: Sensation, Fantasy

**Design Test**: If we're debating a second visual language for “gameplay” versus “menu,” this pillar says we refuse it.

#### What This Means for Each Department

| Department | This Pillar Says... | Example |
| ---- | ---- | ---- |
| **Game Design** | Screens are rooms of one OS, not modes of two games | Menu → World → Research → Brief → Assembly → Mission → Debrief |
| **Art** | Palette from `src/index.css` and `src/ui/tokens.ts` | No external art pipeline |
| **Audio** | Four channels under a master; strategy bed owns the four Screens | One industrial loop |
| **Narrative** | Same paperwork voice everywhere | Uppercase terminal copy |
| **Engineering** | Shared tokens; TS/SVG/canvas colours from `tokens.ts` | AGENTS.md palette guardrail |

#### Serving This Pillar
- Thin technical borders, monospace uppercase, scanlines
- HUD is the same terminal as the Scan

#### Violating This Pillar
- A game-UI that breaks character
- A second visual language for “gameplay” versus “menu”

---

## Anti-Pillars (What This Game Is NOT)

- **NOT a hero shooter / stealth sim / click-every-shot RTS**: would undo Command
- **NOT a character drama**: no cutscenes, dialogue trees, relationship tracks
- **NOT an equipment locker**: no owned inventory, consumable shop, account level
- **NOT multiplayer or mobile**: keyboard and mouse, desktop browser
- **NOT mid-mission save and resume**: commitment is the cut (ADR-0002)
- **NOT an external art pipeline**: one hand drew this world
- **NOT spoken VO or a spatial audio model**: unless explicitly reopened

---

## Pillar Conflict Resolution

Living spec does not rank a winner. Process:

1. Identify which pillars are in tension
2. Prefer a partial serve of the lower-stakes pillar if the veto text of another still holds
3. If two vetoes collide, escalate rather than silently picking a favorite
4. Document the decision in the relevant GDD or ADR
5. Do not reopen §19 closed questions to break a tie

---

## Player Motivation Alignment

| Need | Which Pillar Serves It | How |
| ---- | ---- | ---- |
| **Autonomy** | Command; Information | Choose when to order, what to read, whether to trip awareness |
| **Competence** | Command; Information | Tempo, position, a small order at the right time |
| **Relatedness** | One OS / house identity only | Minimal; no companion drama by anti-pillar |

Relatedness is intentionally thin. Do not add relationship tracks to “fix” SDT coverage.

---

## Emotional Arc

### Session Emotional Arc

| Phase | Target Emotion | Pillar(s) Driving It | Mechanics Delivering It |
| ---- | ---- | ---- | ---- |
| Opening | Cold procedural focus | One OS, Information | World Network, feed, clock |
| Rising | Tension from reading | Information, Command | Brief, assembly, cones |
| Climax | Fast noisy violence | Command, Violence | Mission five verbs |
| Resolution | Invoice, not celebration | Violence, Two layers | Debrief apply-once |
| Hook | Reinvest or hold time | Two layers | Research, generated market |

### Long-Term Emotional Progression

Authored spine → campaign complete mark. Generated market funds the research gap. Quiet replay after a win. Roster permanence. A completed campaign stays complete after a roster wipe.

---

## Reference Games

| Reference | What We Take From It | What We Do Differently | Which Pillar It Validates |
| ---- | ---- | ---- | ---- |
| Syndicate | Remote corporate tactics | Two clocks; priced collateral; unsaved mission | Fantasy / Two layers |
| Living GDD | Terminal chrome, neon Spectacle | No external art | One OS |

---

## Pillar Validation Checklist

- [x] **Count**: 5 pillars
- [x] **Falsifiable**: each has veto text
- [x] **Constraining**: each names what it kills
- [x] **Cross-departmental**: department tables filled from living spec
- [x] **Design-tested**: each has a concrete test
- [x] **Anti-pillars defined**: yes
- [ ] **Priority-ranked**: living spec does not rank; do not invent
- [x] **MDA-aligned**: top aesthetics mapped
- [x] **SDT coverage**: Autonomy and Competence core; Relatedness minimal by design
- [x] **Core fantasy served**: yes

---

## Next Steps

- [ ] Keep these vetoes in every D2 extract's Player Fantasy
- [ ] World Network extract next
- [ ] `/design-review` in a **fresh session** after extracts, not this session
