# Game Concept: Nexus Reborn

*Created: 2026-09-07*
*Status: Draft*
*Source: `docs/game-design.md` §§1–4, §18. Living spec remains source of truth.*

---

## Elevator Pitch

> It's a real-time squad tactics game with a strategic management layer where you are the Operations Director of Nexus Global: you read a corporate world, fund research, accept deniable contracts, and issue a few orders to one to four operatives in neon districts.

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Real-time squad tactics with a strategic management layer |
| **Platform** | Desktop browser, 1280×720 minimum |
| **Target Audience** | Not authored in the living spec |
| **Player Count** | Single-player |
| **Session Length** | Plan on the World Network → brief → assembly → mission → debrief |
| **Monetization** | None |
| **Estimated Scope** | Shipping cut already in `src/`; documentation extract in progress |
| **Comparable Titles** | Syndicate (inspiration). Not XCOM-style per-shot micromanagement |

---

## Core Fantasy

The player is the Operations Director. Remote command, not heroics. They never walk the street. They read a situation, spend a few consequential orders, and live with the corporate cost of every stray round.

Login is `OPS_DIRECTOR`. Organization is Nexus Global. Clearance is Executive. Tactical asset is Strike Team 04. The player funds programs, accepts work, chooses personnel, and issues battlefield orders. They are not an operative.

---

## Unique Hook

It's like Syndicate, AND ALSO every shot can change both the firefight and the contract invoice — stray fire is priced, a mission in progress is not saved, and the World Network is a job with its own clock, not a contract picker.

---

## Player Experience Analysis (MDA Framework)

Derived from the living spec; not a new ranking exercise.

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Fantasy** (make-believe) | 1 | Operations Director; never an operative; terminal as character |
| **Challenge** (mastery) | 2 | Tempo and position; read cones, patrols, civilians; five verbs |
| **Discovery** | 3 | Unrest, control, sight cones, objectives, weapon state — information is power |
| **Sensation** | 4 | Spectacle is neon and terminal chrome; night and rain host it, they are not it |
| **Narrative** | 5 | Paperwork only: brief, feed, dossiers, abstracts, comm log, debrief invoice |
| **Fellowship** | N/A | Single-player; no social layer |
| **Expression** | N/A | No locker, cosmetics, or creation tools |
| **Submission** | N/A | Commitment on the ground; not a comfort sandbox |

### Key Dynamics (Emergent player behaviors)

- Read the board before spending an order.
- Choose whether to trip awareness.
- Accept that a clean firefight can still print collateral.
- Spend strategic time or hold it; leaving the network paused is a decision.
- Replay authored work for the other district knowing the invoice is quiet.

### Core Mechanics (Systems we build)

1. World Network — two clocks, sectors, intel, influence spends
2. Economy and contracts — authored spine + generated market; collateral invoice
3. Research — one program; bays wear blueprints
4. Roster and Assembly — 1–4 Ready operatives; mass gate
5. Tactical mission — Select / Move / Attack / Hold Ground / Hold Fire
6. Persistence — campaign save; mission is memory-only
7. Interface and Audio — one corporate operating system

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** | Which contract, which 1–4, when to spend time, whether to trip awareness | Core |
| **Competence** | Reading the board; a small order at the right time | Core |
| **Relatedness** | Minimal — no companion drama; house identity only | Minimal |

### Player Type Appeal (Bartle Taxonomy)

- [x] **Achievers** — authored campaign mark; research program complete
- [x] **Explorers** — reading sectors, patrols, cones, generated market
- [ ] **Socializers** — out of scope
- [ ] **Killers/Competitors** — out of scope

### Flow State Design

- **Onboarding curve**: in-game tutorial, pause help, current bindings; playtest tasks in living spec §20 are pending thresholds
- **Difficulty scaling**: Standard vs Hardened player setting, not a hidden board
- **Feedback clarity**: invoice, comm log, HUD states with non-color cues
- **Recovery from failure**: abort discards the mission; loss retry still pays; no mid-mission resume

---

## Core Loop

### Moment-to-Moment (30 seconds)

Select. Move or Hold Ground. Choose whether to trip awareness. Engage by placement or by Attack.

### Short-Term (5-15 minutes)

Read street patrols, cones, civilians, and the objective. Complete the active objective. Repeat through extraction.

### Session-Level (30-120 minutes)

Monitor the World Network. Spend or hold time. Fund research. Take a contract. Pick one to four. Execute. Collect the invoice, less collateral. Reinvest.

### Long-Term Progression

Research program (779,000 CR). Authored contracts for campaign complete. Generated market funds the research gap. Quiet replay after a win.

### Retention Hooks

- **Curiosity**: generated market, Event forecast, Risk index, intel gates
- **Investment**: roster permanence (KIA), laboratories, sector ownership
- **Social**: none
- **Mastery**: Hardened profile; cleaner invoices; better placement

---

## Game Pillars

Canonical veto text lives in `design/gdd/game-pillars.md`. Summary:

1. **Command, do not micromanage** — tempo and position, not every shot
2. **Information is operational power** — a good order is small and timed
3. **Violence has corporate consequences** — stray fire is a line item
4. **The two layers feed each other** — the win must change the network
5. **One corporate operating system** — one terminal, not two visual languages

### Anti-Pillars (What This Game Is NOT)

- **NOT** a hero shooter, stealth sim, or click-every-shot RTS
- **NOT** a character drama (no cutscenes, dialogue trees, relationship tracks)
- **NOT** an equipment locker (no owned inventory, consumable shop, account level)
- **NOT** multiplayer or mobile
- **NOT** mid-mission save and resume
- **NOT** an external art pipeline

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| Syndicate | Remote corporate tactics; deniable squad in a city | Browser 3D; two clocks; priced collateral; unsaved mission | Names the fantasy |
| Living GDD §14–15 | Terminal chrome; neon as Spectacle | No external art assets; CC0 one-shots | Production constraint |

**Non-game inspirations**: Late-1980s / 1990s cyberpunk strategy vocabulary, rebuilt as a crisp modern terminal. Cold, procedural, corporate. Violence is logged, not celebrated.

---

## Target Player Profile

Not authored in the living spec. Product table is the constraint: keyboard and mouse, desktop browser, 1280×720.

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | React 19 + Vite + react-three-fiber + three.js 0.185 WebGPU (WebGL2 fallback). `/setup-engine` still pending |
| **Key Technical Challenges** | Deterministic citygen and mission seed; two clocks; unsaved mission vs strategy autosave |
| **Art Style** | 3D isometric; geometry assembled in code; no external art assets |
| **Art Pipeline Complexity** | Low by constraint — generated in code |
| **Audio Needs** | Moderate — UI/combat/music/ambience; rain follows weather |
| **Networking** | None |
| **Content Volume** | Three authored contracts, generated market, eight starting operatives, five weapons, twenty-one research projects |
| **Procedural Systems** | District from mission seed; generated contracts; weather script; Opening hour |

---

## Risks and Open Questions

### Design Risks

- World Network used only as a contract picker (pillar 4 veto)
- Five-verb command language buried under citygen chrome (pillar 1 veto)
- Dual-homed Credits / Influence / intel making the two-layer loop unreadable

### Technical Risks

- Engine prefs and `docs/engine-reference/` still missing
- Product-level performance budgets in GDD §20 are pending approval

### Market Risks

- Not authored. Monetization is none.

### Scope Risks

- Splitting the living spec into template GDDs that drift into a second ruleset
- Review-mode `full` multiplying extract sessions

### Open Questions

- Living spec §19 closed questions stay closed
- Accessibility backlog is product backlog, not a ninth system
- Stub vs keep `docs/game-design.md` after D2 extracts — not decided

---

## MVP Definition

**Core hypothesis**: Remote command is fun when information is visible, orders are few, and violence prints on the invoice.

**Required for MVP** (already in the shipping cut; all eight systems):

1. World Network with two clocks
2. Contracts (authored + generated) and debrief invoice
3. Tactical five-verb mission
4. Unsaved mission / debrief apply-once
5. Research program and roster 1–4
6. One terminal UI + audio

**Explicitly NOT in MVP** (defer / out of scope):

- Mid-mission resume
- External art pipeline
- Spoken VO / spatial audio
- Full accessibility backlog (§19)

### Scope Tiers (if budget/time shrinks)

Documentation stop-ladder, not product cuts. See `design/gdd/systems-index.md`.

| Tier | Content | Features | Timeline |
| ---- | ---- | ---- | ---- |
| **D1** | Concept + pillars + systems index | Unblocks extracts | This session |
| **D2** | Thin pointer GDDs for 8 systems | Skills can see MVP files | Subsequent sessions |
| **D3** | Deepen Tactical + Interface | Only if skills still fail | Optional |

---

## Next Steps

- [x] Systems index written (`/map-systems`)
- [ ] `/setup-engine`
- [ ] D2 extracts in design order, starting with World Network
- [ ] `/design-review` in a **fresh session** after each GDD
- [ ] Do not rewrite `docs/game-design.md`
