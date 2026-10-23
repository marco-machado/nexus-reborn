# UX Spec: World Network

> **Status**: In Review (written 2026-10-22; awaiting `/ux-review design/ux/world-network.md`)
> **Author**: user + ux-designer
> **Last Updated**: 2026-10-22
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at the World Network wanting to **read the board and decide how to spend strategic time**: which sector to look at, whether anything is worth an Influence spend, and which contract (if any) to take into a mission. The sentence the screen must make true is: "I sit the desk; I know what I am looking at, what it costs me to wait, and what I can do about it."

The World Network is the hub of the session loop (Interface Rule 7: Menu → **World Network** → Research / Assembly → select contract → Brief → Deploy → Mission → Debrief → World Network). It is one of the four Screens and the only one that carries the Scan, the Feed and the campaign-end banners. It does five jobs:

1. **Read**: Focus one of six open sectors and read the four printed numbers — Control, Unrest, Tax yield, Garrison condition — with Tax yield told apart from whether it is *paid* (Nexus-held only). Antarctica is locked and prints nothing.
2. **Spend**: the strategic clock is a resource (Pause and 1×–8× are spends, P-20), and Influence buys Stabilize, Lobby and Expedite (P-02). A good order is small and timed, or none.
3. **Choose**: OPEN CONTRACTS lists what Economy holds. Selecting one unlocks Brief. **Chance always prints here**; Risk bands are Brief-only.
4. **Record**: the Feed and Timeline say what happened and let the player scrub the past (Review) without touching live state; the campaign-complete and campaign-failed banners post here.
5. **Orient**: on the first visit a four-row card teaches the job, not "click the marker" (Core Rule 13, P-23). Influence is taught later, on the sector panel, the first time an action is affordable.

**Failure if this screen is missing or hard to use**: the player has no board to read and no two-layer loop, only a contract list (GDD Overview). Two playtests are on record. 2026-10-06 (vertical slice): a new player said "i did not know what to do, where to start." 2026-10-19: the nine-row orientation card read as "too dense", so the card is now fixed at four rows. A first minute spent only clicking a contract marker means the Player Fantasy has failed (GDD Player Fantasy).

**Pillars served**: *Information is operational power* (the four numbers are undecorated and actionable); *The two layers feed each other* (the board the player reads is the board the last mission wrote back to); *One corporate operating system* (the Scan, panels and Feed share the one visual language, art bible §7).

Sources: `design/gdd/world-network.md` (Overview, Player Fantasy, Core Rules 5–13, UI Requirements), `design/gdd/interface.md` Rule 9 and UI Requirements table, `design/difficulty-curve.md` (2026-10-21), `design/ux/interaction-patterns.md` P-02, P-03, P-04, P-06, P-14–P-17, P-20, P-21, P-23.

---

## Player Context on Arrival

The World Network is `appStore.phase = 'world'`. It has four arrival situations; the design must hold for all of them.

| Arrival | What the player was just doing | Assumed emotional state | What they most need |
|---|---|---|---|
| **First visit, New Operation** | Pressed New Operation twice on the Menu | Curious, unoriented, no mental model of the desk | The job in four rows, then a legal first move that is not "click a marker": Focus, read, Pause while reading |
| **Return from a win Debrief** | Read the invoice | Relief or appetite; asks "what changed?" | The post-write-back, post-ETA board (not an intermediate `t0` screen), Influence and Intel as awarded, any campaign banner |
| **Return from a loss Debrief or an Abort** | Lost, or discarded a mission | Stung, or wary of wasted time | The board unchanged by ETA (a loss spends none; Abort writes nothing), and no contract still selected after a Debrief |
| **Mid-campaign hop from Research / Brief / Assembly** | Spent or inspected something elsewhere | Calm, planning | The same Focus and selection they left, a running clock, no re-teaching |

- **Voluntary**: yes. It is the hub; the game never sends the player anywhere else between missions.
- **Time pressure**: soft and self-imposed. Strategic time runs on this Screen (Core Rule 2) at 1×–8× (default 2×) unless the player pauses, and Tax, labs, healing and contract expiry run on it. Nothing here is a real-time threat; Pause is always available and is itself a spend.
- **Attention load**: about seven live, unpaused systems share this screen (clock/speed, Focus and sector numbers, Feed, market expiry, Influence spends and cooldowns, Timeline, Event forecast at intel 2+). `world-network.md` Open Question D-10 is unclassified; this spec does not resolve it and designs for "readable when paused" first.
- **Audio**: Menu has already unlocked audio. UI clicks and the Influence-spend confirmation only; no tick per strategic second, no banner sting (Sound Standards).
- **Journey phase**: not mapped (no `design/player-journey.md`). Arrival situations above are derived from GDD and playtest records, not a journey map.

---

## Navigation Position

This screen lives at: [app boot] → Menu → **World Network** (`phase = 'world'`). It is one of the four Screens, peer to Research, Brief and Assembly through the shared nav (P-06), and it is the hub of the loop. Its tab is never locked: `navTabGate` gates only Brief (`NO CONTRACT SELECTED`); World Network, Research and Assembly are always reachable (`src/ui/navGates.ts`). Alternate entry paths: Debrief return and Abort return (see Entry & Exit Points). Overlays on this screen: the first-visit orientation card (P-23), Settings and Balance (P-05, reached from their own entry points), and the write-failure notice (P-11, P-19).

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| Menu → Continue | Continue (valid blob only) | Hydrated World Network blob: `t`, sectors, owners, Influence, Intel, events, spends, cooldowns. A selected contract is restored but not resumed (`main-menu.md`). The Review pin is **not** in the blob, so the screen opens Live |
| Menu → New Operation | Second step of the two-step confirm | Opening desk: Influence **0**; intel **1** at 25/100; Focus on **Europe** (Helix-held, Tax prints but does not pay); North America is the one paying tap; Rust Haven open (Moderate), Glass Veil and Hollow Crown locked; one seeded Moderate generated offer open in a Secure sector; first-visit orientation unseen |
| Debrief → return | Debrief's World Network exit (the only exit on a failed campaign) | Mission write-back applied once at frozen `t0`, then win-ETA catch-up; the board shown is the **post-ETA live board**. Selected contract cleared. A failed-write autosave surfaces as P-19 on the next Screen |
| Mission → Abort (confirmed) | Pause → two-step Abort (`abortMission` → `goto('world')`) | Nothing written: `t`, sectors, owners, Influence, Intel, events, spends and `nextTaxT` equal their pre-deploy values. No Debrief |
| Research / Brief / Assembly → World Network | Nav tab | Live state; Focus and selected contract unchanged |

| Exit Destination | Trigger | Notes |
|---|---|---|
| Research | Nav tab | Strategic clock keeps running on that Screen. No state lost |
| Assembly | Nav tab | Same |
| Brief | Selecting an open contract (OPEN CONTRACTS row or Scan marker), or the Brief nav tab while a contract is already selected | `selectMission` sets `missionId` **and** `phase = 'brief'` in one step (`src/state/appStore.ts:230`), so selecting a contract is also the navigation. It is a no-op when the campaign is failed or the contract is intel-locked |
| Mission (via Brief → Assembly → Deploy) | Not directly from here | Deploy copies the frozen WN slice `{sector id, Control, Unrest}`. The clock stops for the field |
| Menu | Not built | Reached only by reload; as in `main-menu.md` |

No exit from this screen is destructive. Leaving never spends Influence and never discards a staged spend (Stabilize / Lobby keep running on the clock). Closing the tab is the only way out that stops the clock mid-state; the strategy blob is autosaved on Screens (Persistence).

---

## Layout Specification

### ASCII Wireframe

1280×720, text scale 100%, opening desk (Influence 0, intel 1, Focus Europe, no banner). Figures are placeholders. The banner slot is collapsed here; when a campaign banner posts it takes ~42 px from the three-column row, not from the bottom strip.

```
+----------------------------------------------------------------------------------------------------+
| WORLD NETWORK                     CREDITS 000,000 CR | INFLUENCE 0 PTS | INTEL 1 | ROSTER 0 / 0    |
| NEXUS GLOBAL // GEOSTRATEGIC COMMAND INTERFACE                                                     |
+----------------------------------------------------------------------------------------------------+
|  [ banner slot: CAMPAIGN COMPLETE / CAMPAIGN FAILED -- absent unless posted ]                      |
+---------------------+--------------------------------------------+---------------------------------+
| SECTORS         6/7 | ORBITAL VIEW (fiction)    FOCUS EUROPE     | EUROPE                  [FOCUS] |
| [>] EUROPE          |                           HELIX            | [ sector inset ]  <   >         |
|     CONTROL 000%    |                                            | COORD  00.00N / 00.00E          |
|     UNREST  000%    |      S C A N                               | CONTROL 000%  [====    ]        |
|  NORTH AMERICA      |      sector fill = majority holder         | UNREST  000%  [==      ]        |
|     CONTROL 000%    |      contract markers (one button each)    | TAX YIELD 000 CR / 24H          |
|     UNREST  000%    |      CRISIS = hatch + word CRISIS          | TAX PAID  NO // NOT NEXUS-HELD  |
|  ... (4 more)       |                                            | GARRISON  SECURE|STRAINED|CRIT|
|  ANTARCTICA [lock]  |                                            | [1 STABILIZE 8P  NEED 8 PTS]    |
|     NO SURVEY DATA  | [-][+][HOME][FOCUS SECTOR][SOUTH POLE]     | [2 LOBBY 10P ..][3 EXPEDITE 12P]|
|                     | [LABELS]            CONTROL KEY  holders   | EVENT FORECAST  (intel 2+)      |
|                     |                                            +---------------------------------+
|                     |                                            | OPEN CONTRACTS             1/2  |
|                     |                                            | RUST HAVEN  TYPE // CITY        |
|                     |                                            |  CHANCE 00%  ETA 0D             |
+---------------------+--------------------------------------------+---------------------------------+
| TIME CODE   | TIMELINE  -----------------*--  -24H -12H -6H NOW  | FEED        3 UNREAD  | INTEL     |
| 0000-00-00  | [||] [1X] [2X] [4X] [8X]   CLOCK SPEED: 2X         | 00:00  event text  >  | LEVEL 1   |
| 00:00 UTC   |                                                    | 00:00  event text  >  | 25 / 100  |
| * LIVE      |                                                    | -- CHANNEL OPEN --    |           |
+-------------+----------------------------------------------------+-----------------------+-----------+
| [WORLD NETWORK]   RESEARCH   BRIEF [lock] LOCKED // NO CONTRACT SELECTED   ASSEMBLY               |
+----------------------------------------------------------------------------------------------------+
```

First-visit orientation card (P-23) sits over the Scan column, four rows, one `UNDERSTOOD` control; the clock transport stays visible and usable beside it.

### Layout Zones

**Arrangements considered** (autonomous mode picked the recommendation; logged in `production/session-logs/decision-log.md`):

| Option | Description | For | Against |
|---|---|---|---|
| **A — Three columns + bottom time strip (chosen)** | Sectors left, Scan center, Focus panel and OPEN CONTRACTS right, time strip along the bottom | Already the shipped grid and tuned to the 1280×720 floor (`src/ui/ui.css` `.wm-main`, `.wm-bottom`). The numbers and the action that acts on them share one column. Time controls sit with the Feed, the thing they change | The right column has no slack at 720p (a comment in `WorldMap.tsx` says so); anything added there compresses OPEN CONTRACTS |
| B — Scan full-bleed, panels floating over it | Art bible §7.1 "windows over a video wall" taken literally | Maximum Scan | Panels over a moving Scan fail the composited 4.5:1 text floor in the worst case; floating panels collide at 125% text scale |
| C — Scan top, a single readout strip below | Wide Scan, one horizontal readout | Good for a flat map | Four numbers, three actions, a forecast and a contract list do not fit one strip at 720p without truncation (a bug per Interface Rule 6) |

**Chosen zones (A)**, widths at 1280 from the shipped CSS clamps:

| Zone | Approx. size at 1280×720 | Contents | Why here |
|---|---|---|---|
| **Header** | full width, height not measured | Title, subtitle, four resources: Credits, Influence, Intel, Roster | The four Screens share it (Interface UI Requirements). First read, top-right |
| **Banner slot** | full width, 0 px when empty, ~42 px when posted | P-21 campaign banner | A record, not a toast. Posting pushes the row below it down rather than overlaying it |
| **Left column: SECTORS** | `clamp(228px, 20vw, 300px)` ≈ 256 px | Seven sector rows (six open, Antarctica locked), each a Focus control with Control, Unrest and a state chip | Focus is the first move on the opening desk; it must be reachable without the Scan |
| **Center: Scan** | remainder after columns and gaps (≈650–680 px; screen padding not measured) | The Scan, holder key, contract markers, view controls, fiction chrome | Spatial context and a second way to Focus and to open a contract |
| **Right column: Focus panel + OPEN CONTRACTS** | `clamp(280px, 24vw, 356px)` ≈ 307 px | Four numbers, Tax paid/printed, Influence actions with reasons, Event forecast; then contracts with Chance | Read the number, then act on it, in one column. Contracts last: they are a choice made after reading |
| **Bottom strip** | full width, 124 px | TIME CODE, TIMELINE with transport, FEED, INTEL | Time and history, one band |
| **Nav** | full width | P-06 four tabs | Shared chrome |
| **Overlay** | over the Scan column | First-visit card (P-23); Influence moment note replaces the sector inset while up | Does not cover the transport (the clock control is what it teaches) |

**Spec deltas from the shipped screen** (each is an Open Question for implementation, none is silently assumed):

- **Single owner per figure.** Credits, Influence, Intel level and Roster print once in the header. The left **INFLUENCE** panel and the bottom **RESOURCE POOL** repeat Credits, Influence and Roster that the header already shows; the pool's only unique content is the Intel progress bar. Influence additionally prints at the point of action, beside the three buttons (P-02 requires cost against the balance where the spend happens). Recommendation: delete the left INFLUENCE panel, giving SECTORS the full column so seven rows are more likely to fit without scrolling (fit at each text scale is **not measured**; P-15 scroll covers the rest); turn the pool into an **INTEL** panel (level and `n / 100`). Open Question 3.
- **The Scan is a globe**, by owner decision 2026-10-22 (Open Question 1).
- **Clock placement.** Interface UI Requirements lists the strategic clock in the four Screens' header. On World Network the header shows no clock (`ScreenStats`, `Nav.tsx`); the time code and transport live in the bottom strip beside the Timeline and Feed. This spec keeps the strip and treats it as this Screen's clock surface, because the transport belongs next to the things time changes.
- **Resource chips are not P-14 pairs.** The header prints `NavGlyph` icons beside values; the glyph is decorative and each value keeps a visible text label (`CREDITS`, `INFLUENCE`, `INTEL`, `ROSTER`).

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks (see Cross-Reference Check).

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Header | Resource readouts | Stat display ×4 | `CREDITS n CR` (amber, money only), `INFLUENCE n PTS`, `INTEL n`, `ROSTER n / cap` | No | P-14 |
| Banner | Campaign banner | Status record | `CAMPAIGN COMPLETE` or `CAMPAIGN FAILED`, sigil (`aria-hidden`), secondary line, `n / 3` count | No | P-21 |
| Left | SECTORS list | Scrollable list of buttons | Per open sector: glyph, name, `CONTROL n%`, `UNREST n%`, bar or `CRISIS` / `UNREST PRESSURE` chip. Antarctica: lock glyph, name, `NO SURVEY DATA` | Yes — Focus (`aria-pressed`) | P-15, P-04 (selection), P-03 for Antarctica (reason is the visible text) |
| Center | Scan | Spatial display | Sector fill = majority holder; Contested; Unknown (Antarctica); crisis hatch + word `CRISIS`; city marks | Yes — Focus by sector (as built: drag/zoom, markers) | New: **Scan marker / Focus selection** (library Gaps list) |
| Center | Contract markers | One button per Scan-visible contract | Label, open or locked; locked shows its requirement as text | Yes — select contract (→ Brief) | P-03 for locked; New with Scan |
| Center | View controls | Button group | `−` `+` zoom, `HOME`, `FOCUS SECTOR`, `SOUTH POLE`, `LABELS` (`aria-pressed`). Exists only because the Scan is a globe. Owner playtest 2026-10-19: the bar "should not exist" (Low; Polish: remove it) | Yes | Standard buttons; P-04 focus. **Not a required component**: this spec does not depend on it |
| Center | Control key | Legend | One row per holder: swatch + name + sector count | No | P-14. The name carries it, the swatch reinforces |
| Center | Fiction chrome | Decorative | `ORBITAL VIEW`, `SAT-16E // LIVE`, unrest sparkline, coordinates | No — `aria-hidden`, never carries state | none |
| Right | Focus panel header | Title + chip | Sector title; chip `FOCUS` or `CRISIS` | No | P-14 |
| Right | Sector inset | Decorative flat map with stepper | Flat sector outline, `<` `>` buttons named `FOCUS PREVIOUS SECTOR` / `FOCUS NEXT SECTOR` | Yes — step Focus | Standard buttons. Replaced by the Influence moment note while that is up |
| Right | Four numbers | Readouts | `CONTROL n%` + bar, `UNREST n%` + bar, `TAX YIELD n CR / 24H`, `TAX PAID` line, `GARRISON CONDITION` word | No | P-14 |
| Right | Influence actions ×3 | Buttons | `1 STABILIZE 8P`, `2 LOBBY 10P`, `3 EXPEDITE 12P`; status word beside each: `CLEAR`, `ACTIVE`, unaffordable / cooldown `nH` / no target / Antarctica | Yes — spend | P-02, P-03 |
| Right | Influence moment note | Note + dismiss | One teaching note, once per campaign, first time any action is affordable on the focused sector; `UNDERSTOOD` | Yes — dismiss | P-23 family; non-modal |
| Right | Event forecast | Readout | Intel < 2: `EVENT FORECAST` + the intel-gate text. Intel 2+: five chips (riot, blackout, raid, trade, seizure) with `n%` over the next 6 strategic hours | No | P-14 |
| Right | OPEN CONTRACTS | Scrollable list of buttons | Per row: codename, `TYPE // CITY`, chips `PRIORITY` / `GENERATED`, `CHANCE n%`, `ETA nD`, `EXPIRY nH` (generated only). Locked authored rows show the intel gate in text. Empty: `NO CONTRACTS POSTED IN <SECTOR>` | Yes — select (→ Brief) | P-15, P-03 |
| Bottom | TIME CODE | Readout | Date, `hh:mm UTC`; Live: `LIVE` + closed dot. Review: `REVIEW -<ago>` + `> GO LIVE` | Yes in Review (return) | P-17 |
| Bottom | TIMELINE | Slider | Track with event ticks, handle, axis `-24H -12H -6H NOW` | Yes — scrub (Review) | P-17, P-04 |
| Bottom | Strategic clock transport | Button group | Pause/Resume, `1X` `2X` `4X` `8X`, readout `CLOCK SPEED: PAUSED` or `nX` | Yes | P-20 |
| Bottom | FEED | Scrollable log of buttons | `hh:mm`, event text, chevron; click Focuses that sector and marks read. Header: `n UNREAD` button or `FEED CLEAR`. Empty token | Yes | P-16, P-15 |
| Bottom | INTEL panel (recommended; as built, RESOURCE POOL) | Readout | Level, `n / 100` progress | No | P-14 |
| Overlay | First-visit orientation card | Overlay | Four rows: THE JOB, START HERE, STRATEGIC TIME, THE FOUR NUMBERS; `UNDERSTOOD` | Yes — dismiss | P-23 |
| Overlay | Write-failure notice | Toast + Feed line | Persistence outcome | No | P-11, P-16, P-19 |
| Nav | Four-Screen tabs | Tab bar | World Network (selected), Research, Brief (locked until a contract is selected), Assembly | Yes | P-06 |

### Information Hierarchy

Ranked by "what the player needs first on the opening desk", with the decision that the **four numbers and the clock** outrank the contract list (Player Fantasy: "if that minute is only clicking a contract marker, this fantasy has failed").

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 0 | Campaign banner | Complete or Failed only | When posted it is first and dominant; it is a record, not a modal |
| 1 | Focused sector's four numbers and Tax paid vs printed | Always (not Antarctica) | The job. Undecorated, live in Review (ADR-0014) |
| 2 | Strategic clock state: `PAUSED` / `nX`, transport | Always | Time is a spend. The word carries running; red may mark paused, amber never marks a running clock (P-20) |
| 3 | Influence wallet and the three actions with their reasons | Always | Disabled at opening 0 must read as "later", not broken (P-03) |
| 4 | OPEN CONTRACTS with Chance | Always | Chance never leaves this screen; Risk bands are Brief-only |
| 5 | Scan: all six sectors' holders, crisis marks, contract markers | Always | Spatial context and a second Focus path |
| 6 | Feed and Timeline | Always | The record; Live vs Review distinction by words |
| 7 | Credits, Intel, Roster | Always | Header. Intel progress in the bottom-right panel |
| 8 | Event forecast | Intel 2+ (below that, the gate text) | Foresight is earned |
| 9 | First-visit card | First visit only | Teaches the job; yields the Scan column |
| 10 | Fiction chrome | Always, `aria-hidden` | `ORBITAL VIEW`, `SAT-16E // LIVE`, sparkline, coordinates. Never carries state. Text ≥10 px, ≥4.5:1 |

**Discoverable, not up front**: Influence mechanics (taught by the moment note on first affordability, not the card); Research (taught on the first Debrief); the Event forecast mechanics; Review (scrub the Timeline).

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Default (Live, running)** | Normal visit | Clock `nX` (default 2×), `LIVE` + closed dot, all panels populated |
| **Opening desk** | New Operation | Influence **0**: all three actions show `UNAFFORDABLE` beside the button (reads as later, not broken). Focus **Europe**: Tax prints, `TAX PAID NO // NOT NEXUS-HELD`. North America is the one paying tap. Intel 1: Event forecast shows the intel-2 gate text. OPEN CONTRACTS: Rust Haven open; Glass Veil and Hollow Crown locked with their intel gate as text; exactly one seeded Moderate generated offer. First-visit card showing |
| **First-visit card showing / dismissed** | First `phase='world'` of a campaign / `UNDERSTOOD` or use of the clock control | Card (P-23) over the Scan column; the clock keeps running underneath and the transport stays usable. Dismissal persists with the save through the tutorial seen set. Never returns in that campaign |
| **Paused** | Pause control | Readout `CLOCK SPEED: PAUSED` (red may reinforce, the word carries it); play glyph on the control (`RESUME STRATEGIC CLOCK`). Choosing a speed while paused selects it; readout stays `PAUSED` |
| **Running 1× / 2× / 4× / 8×** | Speed control | `aria-pressed` on the active speed button; readout `nX` |
| **Review** | Scrub the Timeline off NOW | `TIME CODE` reads `REVIEW -<ago>` plus `> GO LIVE`; no live dot; handle and Feed follow the pin; **Scan numbers, Influence, Tax and contracts stay live** (ADR-0014). Review is a view, not a third clock; the strategic clock keeps running |
| **Focus: open sector** | Click a sector row, Scan sector or marker, Feed row, stepper | Focus panel, inset, `FOCUS` chip, Scan title and the Influence actions retarget. `selected` is a Focus, never the selected contract |
| **Focus: Antarctica** | Cannot occur | Antarctica row is non-actionable (`aria-disabled`), reads `NO SURVEY DATA`, never enters the Focus cycle, prints no Control / Unrest / Tax / Garrison and offers no actions. Scan land is Unknown |
| **Influence action: Ready** | Affordable, off cooldown, target exists | Status `CLEAR`; enabled |
| **Influence action: Disabled** | Refusal from the owner | Status word beside the button: `UNAFFORDABLE`, `COOLDOWN nH`, `NO TARGET` (Expedite with no generated target), `SECTOR LOCKED`. The word is static text, not a tooltip (P-03) |
| **Influence action: Active (staged)** | Stabilize or Lobby after the debit | Status `ACTIVE` until the staged spend retires. Expedite is instant and never shows Active |
| **Sector under unrest pressure** | Unrest above the pressure line | Row chip `UNREST PRESSURE`; Unrest value prints in the notice tone |
| **Sector in crisis** | Crisis entered (hysteresis per living §5) | Row chip `CRISIS`, Focus-panel chip `CRISIS`, Scan red hatch **plus** the word `CRISIS`; Feed event. Not a campaign banner and never `CAMPAIGN FAILED` |
| **Intel 1 vs 2+** | Intel level | 1: Event forecast shows the gate text. 2+: five forecast chips for the next 6 strategic hours. Chance prints at every level; Risk bands never appear here |
| **Contested / non-Nexus sector** | Majority holder | Tax yield prints; `TAX PAID NO // NOT NEXUS-HELD` |
| **Campaign complete** | Three authored wins | `CAMPAIGN COMPLETE` banner, `n / 3`; all three contracts stay selectable; the network stays active |
| **Campaign failed** | Empty living roster on an incomplete campaign (incl. pyrrhic win return) | `CAMPAIGN FAILED` banner; every contract row and marker reads locked with the cause `CAMPAIGN LOST`; `selectMission` is a no-op; Focus, clock, Influence and Research remain usable. Debrief offers no Replay, so this is the only way back |
| **Contract list empty for the Focus** | Sector has no posted contract | `NO CONTRACTS POSTED IN <SECTOR>` and `SECTOR UNDER PASSIVE MONITORING` |
| **Feed empty** | No events in the window | Empty token (P-16). As built: `NO TRAFFIC IN THIS WINDOW`; library token is `-- CHANNEL OPEN --` (Open Question 5) |
| **Timeline with no events** | No event in the last 24 strategic hours | Track, handle and axis (`-24H -12H -6H NOW`) still print; no ticks |
| **Feed unread** | New events | Header button `n UNREAD`; clears on click, on a Feed row click, or `FEED CLEAR` when none |
| **Scan loading** | Lazy chunk, imagery load | Status line `ACQUIRING ORBITAL VIEW` / `ACQUIRING EARTH IMAGERY`; the rest of the desk is fully usable |
| **Scan recovering / failed** | WebGL context lost / render error | `RESTORING ORBITAL VIEW`; on render failure an alert with a retry button. **Every Scan job (Focus, open contract, read holders) must stay doable from the left column and OPEN CONTRACTS while the Scan is unavailable** |
| **Write failure** | Persistence reports a failed autosave | P-11 toast plus a P-16 line; inside the first-visit card the failure copy renders in the card (visual copy only; the fixed notice stays the live region). Never reads as filed |
| **Return from win Debrief** | Debrief exit | Header Influence/Intel show awarded values at once; board is the post-ETA live board; contract cleared; Brief tab locked |
| **Text scale 90 / 100 / 110 / 125%** | Settings | No clipping at 1280×720; overflow scrolls (P-15); panels never compress |
| **High contrast / reduced motion** | Settings | CSS variables remap only; decorative sweeps gone; loops static (see Accessibility) |
| **Window below 1280×720** | Resize | Minimum layout is kept and the page scrolls; panels do not compress |
| **Erase failed (hosted contract)** | New Operation confirmed while storage refused the erase | The new campaign starts and this screen shows the contract below. Never reads as a durable erase |

### Hosted contract: erase failure

Hosted here for `design/ux/main-menu.md` (its Open Question 3). Copy, channels and timing are closed in that spec and restated; the zone coordinates are this spec's decision.

- **Copy**: `ERASE FAILED // SAVE NOT ERASED`. Neither channel says the save was erased; the in-session desk is the new campaign.
- **Immediate channel (P-11)**: a dismissible toast, `role="status"`, printed in one frame, held ≥3 s unless dismissed, then collapsed; dismiss control labeled `DISMISS`; does not block input and does not pause the strategic clock; red may reinforce `FAILED`, the words carry it; no amber.
- **Zone**: a fixed notice region at the top of the Scan column, below the banner slot. It must never cover the header resources, the clock transport, the Timeline or the nav. While the first-visit card is up, the same copy renders inside the card and the fixed region stays the live region (as built, BUG-0003).
- **Record (P-16)**: the same copy prints as a Feed line and stays until scrolled away. The Feed line is the record, not the immediate channel. A successful next-Screen autosave files the state (P-19); this spec does not add a save verb.

### Feed lines owed by this spec

- **Research-program completion** (living spec §19 #10): one Feed line when the 21st project is researched. Milestone only: not a banner, not a payout, not a per-project beat (that stays Interface OQ10). Proposed copy: `RESEARCH PROGRAM COMPLETE // 21 / 21 PROJECTS`. It names no sector, so the row is not a Focus control. The emitting Research event is unnamed anywhere and is not invented here (Open Question 7).

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` `platform.primary_input`). Gamepad support: **None**; touch support: **None** (ADR-0017 forbids both). Hover is not a state on any control (art bible §7.4); the only hover affordance is the scrollbar (P-15). Focus is P-04 corner brackets. Pointer, Enter and Space activate every button. No new key binding is invented here; full keyboard travel across every panel is **Backlog** (accessibility tier) and is not promoted. Sound: every activation uses the existing UI click through the audio event system; no tick per strategic second.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Sector row | Focus a sector | Click; Enter/Space on focused row | Selection marker (P-04) moves, panels retarget in the same frame | `worldStore.select(id)`; Antarctica row ignores the input |
| Sector inset `<` `>` | Step Focus | Click; Enter/Space | Same | `stepSector(±1)`; skips Antarctica |
| Scan sector region / city marker | Focus that sector | Click | Same; Scan retargets view (cut under reduced motion) | `select(sector)` |
| Scan contract marker | Open a contract | Click; Enter/Space | Click sound | If open: `selectMission(id)` → Brief. If locked or campaign failed: nothing, and the marker's requirement text stays visible |
| Scan view controls | Zoom, HOME, FOCUS SECTOR, SOUTH POLE, LABELS | Click; globe: arrows rotate, `+` `-` zoom, Home resets | View changes only | No game state. HOME returns to the Focus sector |
| Influence action | Spend | Click; Enter/Space | Status word updates, header Influence debits in the same frame; click sound; a confirmation sound per Sound Standards | `spendInfluence(sector, action)`. Single step, no confirm, no undo (P-02). Refusal makes the button disabled with its word, so the click cannot occur |
| Influence moment note `UNDERSTOOD` | Dismiss | Click | Note leaves; inset returns | Marks the moment seen (persists on the next autosave) |
| OPEN CONTRACTS row | Select contract | Click; Enter/Space | Click sound | `selectMission(id)` → `phase='brief'`. Locked row or failed campaign: no-op, reason text already visible |
| TIME CODE `> GO LIVE` | Leave Review | Click; Enter/Space | Dot returns, words change in one frame | `setReview(null)` |
| Timeline track | Scrub | Pointer down/drag; Left/Right/Home/End on the focused slider | Handle and Feed follow the pin; `REVIEW` words appear | `setReview(t')`; drag past ~98.5% of the track returns Live. Never writes `t` (ADR-0014). Home = oldest point in the window; End = Live |
| Pause / Resume | Toggle strategic clock | Click; Enter/Space | Glyph and readout change in one frame | `togglePause()` |
| Speed `1X` `2X` `4X` `8X` | Set speed | Click; Enter/Space | `aria-pressed` moves | `setSpeed(n)`; while paused it selects only |
| Feed row | Focus that event's sector, mark read | Click; Enter/Space | Focus retargets; unread count drops | `markRead()`, `select(sector)` |
| `n UNREAD` | Mark all read | Click | Becomes `FEED CLEAR` | `markRead()` |
| Orientation card `UNDERSTOOD` | Dismiss | Click; Enter/Space | Card leaves | Marks `WORLD_ONBOARD_ID` seen. Using Pause or a speed also dismisses it (P-23) |
| Nav tab Research / Assembly | Go | Click | Click sound | `goto(phase)`; clock continues on the destination Screen |
| Nav tab Brief | Go, or locked | Click when a contract is selected; locked tab does nothing | Locked tab shows lock glyph, `LOCKED`, `NO CONTRACT SELECTED` as text | `goto('brief')` |
| Escape | — | Esc | None on this screen | Reaches the global handler: consumed by an open overlay first (Escape section); it never dismisses the first-visit card and never confirms a spend |

**Spec-vs-built discrepancies are listed once, under Open Questions**, not repeated per row.

---

## Data Requirements

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Control, Unrest per sector | World Network (`worldStore.sectors`) | Read | Live in Review. Unrest clamp and Control range are unnamed in §5 (GDD OQ); UI prints what the owner supplies |
| Tax yield (printed), Tax eligibility | World Network (formula) / owner holder | Read | `tax_yield = round(base × Control/100 × strain)`; the paid/not-paid line is the owner's eligibility (Nexus-held) |
| Garrison condition | World Network (derived from Control bands, §5) | Read | `SECURE` / `STRAINED` / `CRITICAL` as words |
| Holders (city, sector majority), Contested, Unknown | World Network (`worldStore.owner`) | Read | Sector color = majority; tie = Contested; Antarctica Unknown |
| Crisis list, unrest pressure | World Network | Read | Hysteresis owned by §5 |
| Influence wallet, action refusal reason, cooldown hours, staged spends | World Network (`worldStore.influence`, `influenceRefusal`, `cooldowns`, `spends`) | Read; **Write** via `spendInfluence` | UI words the owner's refusal, never recomputes it |
| Event forecast | World Network (`forecast.ts`, same weights as the generator) | Read | Intel 2+; next 6 strategic hours |
| Intel level and progress | World Network (Zustand home `campaignStore`, ADR-0012) | Read | Progress toward 100 |
| Credits | Economy (`appStore.credits`) | Read | UI never overdraws (ADR-0013) |
| Roster count and cap | Roster (`campaignStore.operatives`, `ROSTER_CAP`) | Read | Count only; no live roster query for squad state |
| Contract instances, Reward, expiry | Economy (records) via World Network (`worldStore.contracts`) | Read | Locked generated offers absent; authored intel-locked present as locked |
| Chance | Tactical computes `missionChance`; World Network presents | Read | Always printed |
| ETA days | Economy-stamped | Read | Shown as `ETA nD` |
| Selected contract | `appStore.missionId` | Read; **Write** via `selectMission` | No-op on failed campaign or locked contract |
| Strategic `t`, paused, speed, review pin | World Network (`worldStore`) | Read; Write via `togglePause`, `setSpeed`, `setReview` | Review writes the pin only |
| Events (Feed, Timeline ticks) | World Network (`worldStore.events`, `unread`) | Read; Write via `markRead` | Window: 24 strategic hours on the Timeline; the Feed shows the latest 14, reversed |
| Campaign flags and won count | Roster/World Network via `campaignStore` | Read | Banners |
| Difficulty, researched count | Settings; Research | Read | Inputs to Chance |
| Seen set | `tutorialStore` | Read; **Write** (`markSeen`) | Orientation, Influence moment |
| Save status | Persistence (`saveStatusStore`) | Read | Write-failure copy |
| Geography, outlines, Earth imagery | `src/game/geography.ts`, `sectorOutlines.ts`, `public/textures/earth/` | Read | The only `public/` art asset (CLAUDE.md) |

Real-time: `t` advances at up to 20 Hz. The UI keeps per-frame data out of React state: header and rows subscribe at hour or rounded-value resolution so a tick re-renders one chip, not the screen (as built; guardrail in CLAUDE.md). No UI-owned game state is introduced by this spec.

---

## Events Fired

Deliberate: the World Network fires **no analytics events**. Telemetry is local, opt-in and written only at the Debrief boundary (`src/state/telemetry.ts`, ADR-0015); nothing on this screen calls it. The table lists state changes instead.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Focus change (row, Scan, inset, Feed row) | none (state: `worldStore.selected`) | Sector id. Not a contract selection |
| Scan view controls, LABELS | none | View only |
| Influence spend | State change (**persistent**): wallet debit, staged spend or instant Expedite effect, cooldown, Feed event | Sector, action id, cost. Owner: `worldStore`. UI never edits the wallet |
| Select contract | State change: `missionId`, `phase='brief'` | Contract id. Owner: `appStore` |
| Pause / resume / speed | State change: `worldStore.paused`, `speed` | Whether either is carried in the strategy blob is **not verified** (Open Question 9) |
| Timeline scrub / GO LIVE | State change: review pin only (not persisted, ADR-0014) | Pin time or null |
| Mark read | State change: `unread` | — |
| Dismiss orientation / Influence note | State change (**persistent** via the tutorial seen set) | `WORLD_ONBOARD_ID` / `INFLUENCE_MOMENT_ID` |
| Nav tab | State change: `phase` | Destination |
| Any activation | UI click via the audio event system | `uiClick` (no direct audio calls) |

Architecture flags:

- Influence spends and dismissals write persistent campaign state; the UI requests them through store actions and never touches storage.
- The Feed's research-program completion line needs an emitting event from Research that is not named anywhere (cross-review W-02, Interface OQ10 scope). This spec does not invent one (Open Question 7).

---

## Transitions & Animations

Law (art bible §7.4): the terminal prints, scans, ticks and blinks; nothing bounces, pops, slides or glows. Nothing exceeds 500 ms except a tick tracking a real value.

| Moment | Spec | Reduced motion |
|---|---|---|
| **Screen enter** | Panel frames snap in ≤150 ms; the **Scan sweep** runs one pass, ≤400 ms, once per open, never as an idle loop. Content is present from the first frame; there is no row print on SECTORS, OPEN CONTRACTS or FEED because the clock is running and a reading must not be delayed | Sweep absent; content already there |
| **Screen exit** | Cut. Phase change is instant; no outro | Same |
| **Focus change** | Panels retarget in the same frame (urgent-state budget ≤100 ms). The Scan view retargets over ≤400 ms, linear or one ease-out (duration as built is **not measured**) | The view cuts (as built: `reducedMotion` jumps) |
| **Influence spend** | Status word and header Influence change in one frame, no tween: Influence is a wallet that debits at once and a meter easing toward a value the sim does not hold would lie | Same |
| **Credits (Tax lands)** | Ledger tick at readable pace, discrete steps matching the value | Static figure |
| **Clock transport** | Pressed state in one frame; no tick animation per strategic second | Same |
| **Timeline handle** | Moves in discrete steps with `t`; scrub follows the pointer | Same |
| **Review in/out** | Words and dot change in one frame | Same |
| **Crisis onset** | Chips, hatch and `CRISIS` word appear in one frame, final state first; the hatch is static | Same |
| **Campaign banner** | Posts in one frame; no sting, no pulse | Same |
| **First-visit card** | Appears in one frame; frame snap ≤150 ms; leaves in one frame | Same |
| **Idle loops (the only two permitted)** | `LIVE` dot (P-17) and the Focus selection breathe (P-04). Nothing else loops, and the Scan does not auto-rotate (`frameloop="demand"`) | Both static: dot present with the word `LIVE`; selection is the closed double ring |

Motion budget: at most two idle motions on this screen. No red-cadence loop. Motion that could cause discomfort is limited to the Scan view retarget, which the reduced-motion setting converts to a cut.

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017; `project.yaml` `gamepad_support: None`, `touch_support: None`), so the gamepad block (d-pad order, controller disconnect) and the touch block are dropped. An item is ticked only when the Interaction Map above specifies it.

**Keyboard**
- [x] Every action activates with Enter and Space: sector rows, inset steppers, Scan markers, Influence actions, contract rows, Feed rows, `n UNREAD`, `> GO LIVE`, transport, `UNDERSTOOD`, nav tabs.
- [x] The Timeline responds to Left/Right/Home/End (committed set, Interface AC 19). Home = oldest point in the window; End = Live.
- [x] Esc behavior: consumed by the innermost overlay; never confirms a spend; never dismisses the first-visit card (Interaction Map, Escape section of the library).
- [x] Focus is visible on every control: P-04 corner brackets, including in high contrast.
- [x] No keyboard trap: the first-visit card and the Influence note do not trap focus (P-23); Settings/Balance trap and restore (P-05).
- [ ] Tab order across panels is specified. **Not required at the Standard tier**: full keyboard travel across every panel is Backlog (`accessibility-requirements.md`) and this spec does not promote it. Native buttons are tab stops as built; their order is not a requirement here.
- [ ] Keyboard path to every Scan job. The Scan itself is pointer-first, but Focus is reachable via the sector rows and the inset steppers, and contracts via OPEN CONTRACTS, so no Scan job is keyboard-only-blocked. The globe region has arrow, `+`/`-` and Home keys as built; they are not a requirement.

**Mouse**
- [x] Every action is a single click.
- [x] No information appears only on hover; hover is not a state (the scrollbar is the one hover affordance, P-15). Marker tips and `title` text are not relied on.
- [x] No right-click, double-click or drag is required. Dragging the Timeline is an alternative to the keyboard path, not the only one. Globe drag is a view control, not a game verb.
- [ ] Hit-target sizes are specified. Sector rows are ≥46 px high as built (`.wm-sector` min-height); the Timeline track height, Scan marker target (16×16 px as built), the inset steppers and the speed buttons are **not specified or measured**. Listed as Open Question 11.

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). The table states how this screen satisfies each Committed row. No Backlog row (color-vision presets, tactical-HUD screen-reader pass, audio captions, full keyboard travel) is promoted.

| Committed row | How the World Network satisfies it |
|---|---|
| Critical state never by color alone | Selection: `aria-pressed` + P-04 marker. Focus: P-04 brackets. Lock: lock glyph + `LOCKED` / `NO SURVEY DATA` / requirement text. Crisis: hatch + the word `CRISIS` + chip. Unrest pressure: `UNREST PRESSURE` chip. Garrison: the word `SECURE` / `STRAINED` / `CRITICAL`. Tax: `YES // NEXUS-HELD` vs `NO // NOT NEXUS-HELD`. Clock: `PAUSED` / `nX`. Live vs Review: `LIVE` + dot vs `REVIEW -<ago>` + `> GO LIVE`. Holder on the Scan: sector fill **and** the Control key names and the focus title's holder name. Campaign: the words `CAMPAIGN COMPLETE` / `CAMPAIGN FAILED` |
| Text legible at 1280×720 | No clipping at 90 / 100 / 110 / 125%; overflow scrolls (P-15). Readouts ≥12 px, tertiary labels ≥10 px at 100% scale; fiction chrome ≥10 px |
| Text scale 90 / 100 / 110 / 125% | All sizes scale with `--text-scale`; the layout absorbs growth by scrolling the SECTORS list, OPEN CONTRACTS and the Feed, never by compressing a panel. The bottom strip is a fixed 124 px as built, so its content must scroll or wrap at 125% (**not measured**, Open Question 11) |
| High-contrast mode | CSS-variable remap only. Brackets, rings and words survive. Contrast of World-Network-specific tokens (`notice`, `red-dim`, `dim` chips) is **not measured** in this spec |
| Full keyboard operability of the committed set | Timeline arrows/Home/End; Enter/Space on every button; Settings/pause focus trap and restore |
| Contextual accessible labels | Sector buttons `NAME // CONTROL n% // UNREST n%` (+ crisis / pressure); locked `NAME // NO SURVEY DATA`; contracts `OPEN CONTRACT <code> // <type> // <city>` or `<code> // LOCKED // <gate>`; Influence `<num> <name> // <cost> PTS // <effect> // <status>`; transport `PAUSE STRATEGIC CLOCK` / `RESUME STRATEGIC CLOCK` / `CLOCK SPEED nX`; Timeline `role="slider"`, `aria-valuetext` = `LIVE` or the pin time; GO LIVE `REVIEWING <ago> BACK // RETURN TO LIVE`; nav locked `LABEL // LOCKED // <condition>` with `aria-current="page"` on the selected tab |
| Two-step destructive confirms | None occur on this screen. Influence spends are single-step by library decision (P-02): bounded, recoverable by play |
| One-shot advisories, bounded | Orientation card once per campaign; Influence moment note once per campaign. Neither blocks input or the clock |
| Reduced motion | Scan sweep absent; Scan view retarget cuts; `LIVE` dot static; Focus selection is the closed double ring; money tick static |
| Consistent one-OS chrome | Same palette and glyph grammar as every Screen; no second visual language for the map |

Screen-reader considerations for the non-text elements:

- The campaign banner is `role="status"` with an `aria-hidden` sigil (P-21).
- The Scan region is a labeled group; every marker is a button with a full label. Fiction chrome (`ORBITAL VIEW`, sparkline, coordinates) is `aria-hidden`.
- The fixed write-failure notice is the single live region for save failures.
- The clock readout and Feed are **not** live regions; P-11 is the immediate channel for anything urgent.
- A screen-reader pass on the tactical HUD is Backlog; this screen's DOM chrome is covered by the labels above.

Color roles (art bible §4.2, Interface Rule 4): teal = selection and live state; Ledger Amber = money only (Credits, prices, spend authorization); red = danger and failure; Print White = settled records and notices; Nominal Green = terminal-chrome confirmation only. **As-built deviations are Open Question 2.**

---

## Localization Considerations

Scope: English only. No localization system or plan exists in the GDDs, and every string on this screen is a literal in `src/ui/*.tsx`. The flags below apply if that changes (see Open Question 13). The test is 40% expansion (English → German / French). Rule for all rows: expanded text wraps or scrolls; it never clips, truncates or shrinks type (Interface Rule 6).

| Element | Longest text | Layout-critical? | 40% expansion risk |
|---|---|---|---|
| Influence action button | `1 STABILIZE 8P` + status `COOLDOWN nH` / `UNAFFORDABLE` in a ~290 px column | Yes, fixed-width button with two text runs | **HIGH PRIORITY**. Name and status must wrap onto two lines |
| `TAX PAID` value | `NO // NOT NEXUS-HELD` (20 chars) | Yes, beside a label in a ~290 px column | **HIGH PRIORITY** (~28 chars). Wraps under the label |
| `GARRISON CONDITION` label | 18 chars | Label + value on one row | **HIGH PRIORITY**. Label may wrap above the value |
| Sector row chip | `UNREST PRESSURE` (15 chars) in a ~256 px column | Yes | **HIGH PRIORITY**. Chip wraps inside the row; row height grows, list scrolls |
| Contract row chips | `PRIORITY` `GENERATED` `CHANCE nn%` `ETA nD` `EXPIRY nH` | Yes, a chip row | **HIGH PRIORITY**. Chips wrap onto a second line |
| Locked contract / marker reason | `REQUIRES INTEL LVL n`; `CAMPAIGN LOST` | Medium | Wraps |
| Empty list text | `NO CONTRACTS POSTED IN <SECTOR>` / `SECTOR UNDER PASSIVE MONITORING` | No | Low; wraps |
| Banner secondary line | `ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE` (~68 chars) | Banner has a fixed 42 px min-height | **HIGH PRIORITY** (~95 chars). Banner grows; it does not clip |
| Time code | `REVIEW -<ago>` + `> GO LIVE` in the 166 px TIME CODE panel | Yes, fixed bottom-strip height | **HIGH PRIORITY**. The panel body is `overflow: clip` as built, so growth would clip; needs wrap or scroll |
| Nav locked tab | `BRIEF` + `LOCKED` + `NO CONTRACT SELECTED` | Yes | Medium. Tab grows to two lines |
| Orientation card rows | Four rows of full sentences (THE JOB, START HERE, STRATEGIC TIME, THE FOUR NUMBERS with four lines) | No, but long | Medium. The card scrolls inside its own panel; it never pushes the `UNDERSTOOD` control off screen |
| Feed lines | `hh:mm` + event text + chevron | No, wraps | Low |
| Sector and corporation names, codenames, city names | Proper nouns | n/a | Not translated |

Numbers and formats: Credits use thousands separators with the `CR` suffix, no `k` / `M` (P-14); percentages print as integers with `%`; the clock is `HH:MM UTC` and the date is locale-independent (`stamp()`), so none changes with locale. Coordinates are decimal degrees with `N/S/E/W`. A future locale would need these formats chosen deliberately, not inherited from the browser.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. They are UX criteria; the GDD's own ACs (clocks, catch-up, Tax, Influence math, Intel awards, shove direction) stay in `design/gdd/world-network.md` and are not repeated.

**Performance / responsiveness**
- [ ] **Response budget.** Changing Focus, pressing Pause or a speed, spending Influence, or toggling Review updates every affected readout within the next painted frame (urgent-state budget ≤100 ms from input, art bible §7.5). No numeric open-time budget exists yet; one is to be set from the World Network p95 re-profile due 2026-10-28 (retro 10 action 3). Do not invent one.
- [ ] **Scan does not gate the desk.** While the Scan reads `ACQUIRING ORBITAL VIEW` or `RESTORING ORBITAL VIEW`, Focus, the four numbers, the clock, Influence actions and OPEN CONTRACTS are all usable.

**Core purpose**
- [ ] **Opening desk.** On a New Operation, the first screen shows: Focus on Europe; `INFLUENCE 0 PTS`; `INTEL 1`; all three Influence actions disabled with `UNAFFORDABLE` visible beside each; `TAX PAID NO // NOT NEXUS-HELD`; Rust Haven open with `CHANCE n%`; Glass Veil and Hollow Crown locked with their requirement as text; exactly one generated Moderate offer open; the orientation card showing.
- [ ] **The first minute is not "click a marker".** Without selecting a contract, a tester can change Focus among the six open sectors, read the four numbers, and change Pause/speed so that the time code advances or stops. Contract select is not the only enabled verb.
- [ ] **Paid vs printed.** Focus North America: `TAX PAID YES // NEXUS-HELD` and `4,080 CR / 24H` at the opening state. Focus Europe: a Tax figure prints and `TAX PAID NO // NOT NEXUS-HELD`. Color is not the only difference.
- [ ] **Influence reasons.** At Influence 7, Stabilize shows `UNAFFORDABLE` and a click changes nothing. After a first clean win (Influence 8), only Stabilize is enabled; Lobby and Expedite show their words. Expedite with no generated target shows `NO TARGET`. A spend takes one click, shows `ACTIVE` (not for Expedite), and debits the header in the same frame. No confirm or undo exists.
- [ ] **Chance everywhere on the Scan side.** Every open contract row and open marker shows `CHANCE n%` at intel 1 and at intel 2+. No Risk-index band appears on this screen.
- [ ] **Post-win return.** After a first clean win, the returned desk shows `INFLUENCE 8 PTS` immediately, Brief is locked with `NO CONTRACT SELECTED`, and no contract is selected.

**Navigation**
- [ ] **Select = go.** Clicking or Enter/Space on an open contract row or open marker opens Brief. A locked row, a locked marker, or any row on a failed campaign does nothing and its reason stays visible.
- [ ] **Nav.** World Network shows the selected frame and `aria-current="page"`. Brief shows lock glyph, `LOCKED` and `NO CONTRACT SELECTED` as visible text with no contract selected, and opens once one is.
- [ ] **Exits keep the desk.** Going to Research or Assembly and back keeps Focus, the clock running state, and any staged spend.

**Empty / error states**
- [ ] **Antarctica.** The row reads `NO SURVEY DATA`; it cannot be focused by click, inset stepper or Feed row; it prints no Control, Unrest, Tax or Garrison; no Influence action is offered for it.
- [ ] **Empty lists.** A sector with no contract shows `NO CONTRACTS POSTED IN <SECTOR>`. An empty Feed shows the library empty token (`-- CHANNEL OPEN --`), not a blank panel.
- [ ] **Erase failure.** After a refused erase on New Operation, `ERASE FAILED // SAVE NOT ERASED` appears as a dismissible `role="status"` toast (one frame, ≥3 s unless dismissed) and as a Feed line; it never says the save was erased, never covers the transport or header, and does not pause the clock.
- [ ] **Scan unavailable.** With the Scan failed, a tester can still Focus every open sector, read everything, and open every open contract.

**Review and clock**
- [ ] **Review is a view.** After scrubbing off NOW, the time code reads `REVIEW -<ago>` with `> GO LIVE`, no live dot; the four numbers, Influence, Credits and the contract list do not change because of the scrub; End or `> GO LIVE` returns to `LIVE` + dot. The strategic clock is unchanged by the scrub.
- [ ] **Clock words.** Paused shows `PAUSED` and the play glyph; running shows `nX` and `aria-pressed` on the active speed. Neither state is told apart by color alone.

**Teaching**
- [ ] **Orientation card.** Exactly four rows (THE JOB, START HERE, STRATEGIC TIME, THE FOUR NUMBERS); no Influence or Research row; START HERE names the open contract with the highest Chance; the clock transport is visible and usable while it is open; dismissing it (or using the clock) removes it for the rest of the campaign, including after a reload.
- [ ] **Influence note.** The first time any action is affordable on the focused sector, one note appears in the sector panel and not on the card; dismissing it removes it for the campaign.

**Banners**
- [ ] **Campaign banners.** Three authored wins show `CAMPAIGN COMPLETE` with all contracts still selectable. An empty living roster on an incomplete campaign shows `CAMPAIGN FAILED` with every contract locked as `CAMPAIGN LOST`. Entering or clearing a sector crisis never shows either banner.

**Accessibility and layout** (per Standard tier)
- [ ] **Layout.** At 1280×720 and text scale 90 / 100 / 110 / 125%, no text is clipped or truncated and no box overlaps another except declared overlays; overflow scrolls and is reachable.
- [ ] **Focus and labels.** Every control shows P-04 brackets when focused, in high contrast too; the Timeline moves with Left/Right/Home/End; every control in the Accessibility table has the named accessible label.
- [ ] **Non-color cues.** For selection, lock, crisis, unrest pressure, Garrison, Tax paid, paused and Review, a tester viewing the screen in grayscale can still tell the states apart.
- [ ] **Motion.** With reduced motion on, no Scan sweep runs, the `LIVE` dot and Focus selection are static, and the Scan view cuts instead of travelling. With it off, no more than two idle motions run.

---

## Open Questions

Items marked **As-built delta** record where the shipped screen (`src/ui/WorldMap.tsx`, `Nav.tsx`, `WorldGlobe.tsx`, read 2026-10-22) differs from this spec. They are inputs to implementation stories, not defects: no GDD AC fails on them unless stated, and none was filed as a bug by this skill.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **The Scan is a 3D globe; the design documents say it is not.** `design/gdd/world-network.md` (Visual/Audio, UI Requirements), `design/gdd/interface.md` Rule 5 and `game-pillars.md` (Art row: "Scan is not a globe") require a flat projection. Commit `e0a978b` ("Render the World Network Scan as a 3D globe") swapped it in; `production/session-logs/session-log.md` records "globe work (e0a978b) has no story or acceptance criteria". No document in `docs/game-design.md`, `design/gdd/`, the art bible or `docs/architecture/` records an approval. The owner's own 2026-10-19 playtest called the globe control bar unnecessary and BUG-0006 (globe home vs Focus) is an open "design question first". This spec is written at the requirement level (holder fill, crisis hatch + word, Focus path, marker buttons, all jobs doable without the Scan). **Owner decision 2026-10-22: the Scan is the 3D globe; the flat map is not restored.** The pillar, Interface Rule 5 and the World Network GDD (lines 13, 175, 181) were amended the same day to match | owner | **Closed 2026-10-22 (owner): globe** |
| 2 | **As-built delta, color roles.** `STRAINED` Garrison prints in the amber class (`WorldMap.tsx` garrison line) although Ledger Amber is money only (Interface Rule 4; art bible §4.2). Unrest always prints in the red class, even when calm, although red is danger. Spec: Garrison `SECURE` teal / `STRAINED` Print White notice / `CRITICAL` red; Unrest red only past the pressure line or in crisis. The words already carry state, so this is a role correction, not an accessibility failure | ui-programmer / art-director | Open |
| 3 | **As-built delta, duplicate resource panels.** The left INFLUENCE panel and the bottom RESOURCE POOL repeat Credits, Influence and Roster already in the header. Spec recommends deleting the left panel and turning the pool into INTEL (level + `n / 100`). Needs layout measurement at 1280×720 and 125% before commit | ux-designer / ui-programmer | Open (recommendation) |
| 4 | **As-built delta, first-visit card.** The card is `role="dialog" aria-modal="true"` with `autoFocus` on `UNDERSTOOD`. P-23 says it is not P-05, does not trap focus, and the clock control stays usable; session state records an owner ruling that the clock runs under it. Whether Tab is actually trapped was **not verified**. Also: it dismisses only on `UNDERSTOOD`, not on use of the clock control as P-23 describes | ui-programmer / ux-designer | Open |
| 5 | **As-built delta, Feed empty token.** Built `NO TRAFFIC IN THIS WINDOW`; library P-16 token is `-- CHANNEL OPEN --`. Either the library records the World Network variant or the string changes | ux-designer | Open |
| 6 | **As-built delta, failed-campaign reason.** Scan markers read `CAMPAIGN LOST` when the campaign is failed, but OPEN CONTRACTS rows show `REQUIRES INTEL LVL n` for the same locked state. P-03 requires the actual cause. Spec: `CAMPAIGN LOST` on both | ui-programmer | Open |
| 7 | **Research-program completion line has no emitting event.** Living spec §19 #10 requires the line; cross-review W-02 notes the edge is missing on both sides; no event name exists. Copy proposed above; the event is Research / World Network's to name, not this spec's | systems-designer / game-designer | Open |
| 8 | **As-built delta, Influence effect text.** The effect (`-2 UNREST OVER 6H` style) is in `title` and `aria-label` only. P-03 and the Standard controls table forbid relying on a tooltip. A static visible effect line needs space in a column the code says has none. Options: put the effect in the moment note and the inset slot, or shorten the row | ux-designer | Open |
| 9 | Whether `paused` and `speed` are in the strategy blob (so a Continue reopens paused or at the old speed) was not verified | persistence / world-network owners | Open |
| 10 | Player journey map missing: `design/player-journey.md` does not exist. Arrival situations in this spec come from the GDD and playtests. Also carried from the GDD: the screen's attention budget (about seven live systems; cross-review D-10) is unclassified | game-designer | Open (non-blocking) |
| 11 | **Not measured:** hit-target sizes for the Timeline track, speed buttons, inset steppers and Scan markers (16×16 px as built); SECTORS list fit at each text scale; bottom-strip content at 125% (fixed 124 px, `overflow: clip`); contrast of `notice`, `red-dim` and dim chips on their panels; Scan view-retarget duration. Each needs a measurement pass | qa-lead | Open |
| 12 | Fiction chrome `SAT-16E // LIVE` shows the word `LIVE` while the Timeline can be in Review. The Scan numbers are live in Review so the word is true, but it sits beside P-17's `LIVE`. Spec keeps it `aria-hidden`; consider dropping the word | art-director | Open (minor) |
| 13 | `.claude/rules/ui-code.md` says to support gamepad and route all text through a localization system. ADR-0017 forbids gamepad and touch and no localization system exists, and `main-menu.md` made the same call. This spec follows ADR-0017 and `project.yaml`. The rule file is out of step with the project | owner | Open (rule file) |
| 14 | `design/ux/main-menu.md` Open Question 3 (host for the erase-failure contract) is answered by the hosted-contract subsection under States & Variants | — | Closed by this spec once `/ux-review` approves; `main-menu.md` not edited |
| 15 | Library gap: **Scan marker / Focus selection** is listed as a missing pattern (interaction-patterns.md, Gaps). This spec uses it as a "New" component; a pattern entry must be added before implementation invents behavior | ux-designer | Open |
| 16 | Accessibility tier: defined (Standard) | — | Closed |
