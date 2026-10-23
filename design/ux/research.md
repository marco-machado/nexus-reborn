# UX Spec: Research

> **Status**: Approved (/ux-review design/ux/research.md 2026-10-23)
> **Author**: Claude (delegated by owner /goal 2026-10-23) + ux-designer
> **Last Updated**: 2026-10-23
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at Research wanting to **decide which project to fund next, see what it will change for the next deployment, and know what the three laboratories are doing while strategic time runs**. The sentence the screen must make true is: "I authorize the program; I know what each project costs, how long it runs and what it changes, and when I cannot start one I am told why."

Research is one of the four Screens (Interface Rule 10) and the Hook beat of the session arc (`design/gdd/game-pillars.md`, emotional arc: "Reinvest or hold time"). Credits fund it, the strategic clock finishes it, and effects land on the **next** deployment, never on a squad in the field (Research Overview). It does four jobs:

1. **Survey**: three branches (Ballistics, Cybernetics, Control Systems), seven projects each, 21 in total, each in one of four states: locked, available, in progress, researched.
2. **Inspect**: selecting a project shows its branch, laboratory, tier, run time, funding, description, prerequisites and projected benefit. **Selecting never spends.** Every benefit line is generated from the effect data the mission applies (`benefitOf`, `src/game/research.ts`), so the panel cannot promise a change the game does not make.
3. **Commit**: one Authorize on the inspected project is a spend (P-02). No second confirm, no cancel, no undo (Research UI Requirements).
4. **Watch**: three laboratory rows show idle or the running project, its percentage and `H:MM:SS REMAINING` (P-22).

**Failure if this screen is missing or hard to use**: Credits have nowhere to go that changes a later firefight, and the two-layer loop is only a contract picker plus an invoice (Research Overview). The fantasy also fails if authorization reads as a browse, or if a refused Authorize does not say why. No Research-specific playtest finding was in the inputs read for this spec; none is cited.

**Pillars served**: *The two layers feed each other* (Credits from missions become weapons, HP and speed on the next deploy); *Information is operational power* (cost, time, prerequisites and effect are printed numbers, never prose); *One corporate operating system* (Research is "another room of the same terminal", Research GDD Visual/Audio); *Command, do not micromanage* (the player authorizes the program, never kits a hero; no current-issue or pin controls live here).

Sources: `design/gdd/research.md` (Overview, Core Rules 3–5, UI Requirements, Acceptance Criteria), `design/gdd/interface.md` (Screens table row "Research", Rules 10, 13, 14, AC 8, AC 19), `design/ux/interaction-patterns.md` P-02, P-03, P-04, P-06, P-14, P-15, P-22; code read 2026-10-23: `src/ui/Research.tsx`, `researchAuth.ts`, `RemainingLabel.tsx`, `remainingPaint.ts`, `src/state/researchStore.ts`, `src/game/research.ts`, `src/state/appStore.ts` (`authorizeResearch`), `src/ui/ui.css` `.rs-*`. Updated for story `production/epics/interface/story-037-screen-specs-committed-tier-deltas.md` (commit 52be089): no `text-overflow: ellipsis` remains in `src/ui/ui.css` (text wraps), node labels are one `<text>` with `<tspan dy="1.05em">` lines, a researched node draws a check glyph (`.rs-node-done`), reduced motion stops the overlay fade. Evidence: `production/qa/evidence/screens-2026-10-23/` (`sweep-output.txt`, `sweep-research.json`, `research-{90,100,110,125,hc}.png`, `README.md`).

---

## Player Context on Arrival

Research is `appStore.phase = 'research'`, reached only by the nav tab (Menu → World Network → Research). It is unreachable during Mission (Research UI Requirements; session phases route Mission → Debrief). Arrival situations:

| Arrival | What the player was just doing | Assumed state | What they most need |
|---|---|---|---|
| **First visit, opening desk** | Read the first Debrief, whose one-shot prompt names the Research tab and the cheapest available project (Interface Rule 13) | Curious, holding Credits (opening 128,450 CR, Research GDD Tuning Knobs) with no mental model of the tree | Six projects open, none running, what each costs and does, and that one click on Authorize spends |
| **Return after a win** | Read the invoice, then hopped here | Appetite to reinvest | Credits as paid out, any lab that finished during the win-ETA catch-up already shown as researched (completions are silent, Open Question 18) |
| **Mid-campaign hop** | Checked the board or Assembly | Calm, planning | The labs and their remaining time, a running clock, no re-teaching |
| **Late program / failed campaign** | Finishing the tree, or after `CAMPAIGN FAILED` | Completion, or wary | All states legible when most nodes are researched; Research stays usable on a failed campaign (World Network spec, States) |

- **Voluntary**: yes. Nothing forces a visit; a lab keeps running on every Screen.
- **Time pressure**: soft. The strategic clock runs here (the shared `ScreenChrome` starts it, `src/ui/Nav.tsx`), so countdowns advance with no input. Pause and speed are **not** on this screen (Open Question 12).
- **Attention load**: low. At most three labs tick; the rest is static reading.
- **Audio**: the strategy bed and UI click only. No completion sting (Sound Standards).
- **Journey phase**: not mapped (no `design/player-journey.md`). Rows above come from the GDDs.

---

## Navigation Position

This screen lives at: [app boot] → Menu → World Network → **Research** (`phase = 'research'`). It is one of the four Screens, peer to World Network, Brief and Assembly through the shared nav (P-06). Its tab is never locked; only Brief gates (`NO CONTRACT SELECTED`, `src/ui/Nav.tsx`, `navTabGate`). Overlays: Settings and Balance (P-05) from their own entry points. This screen has no overlay of its own: no first-visit card, no modal, no toast.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| World Network / Brief / Assembly | Nav tab | Live state: `done`, `labs`, Credits, strategic `t`. Selected project is **not** carried (Open Question 11) |
| Menu → Continue | Continue, then nav tab | Hydrated labs: `hydrate` calls `sync(savedT)`, which stamps `lastSyncT`, so remaining paints at once (`researchStore.ts` comment) |
| Menu → New Operation | New Operation, then nav tab | `done` empty, all labs idle, `lastSyncT` null until the first clock sync, so no remaining label exists yet |
| Debrief → return | Returns to World Network, then nav tab | Win ETA applied, then `sync(t)`: finished projects are already researched |

| Exit Destination | Trigger | Notes |
|---|---|---|
| World Network / Assembly | Nav tab | Labs keep running; the clock continues on the destination Screen |
| Brief | Nav tab, only if a contract is selected | Otherwise locked with `LOCKED` and `NO CONTRACT SELECTED` as visible text |
| Mission | Not directly | Reached via Brief → Assembly → Deploy. The field does not tick labs; an in-field authorize is refused by the store (`appStore.authorizeResearch`) |
| Menu | Not built | Reached only by reload |

No exit is destructive. Leaving never cancels a running project, never refunds, never loses a spend. Research exports no cancel, stop or abort-project action (Research AC).

---

## Layout Specification

### ASCII Wireframe

1280×720, text scale 100%, opening desk (nothing researched, no lab running, Advanced Propellants selected). Figures are placeholders; the legend note is abbreviated. Zone sizes are from the CSS clamps and the 100% screenshot (`research-100.png`).

```
+----------------------------------------------------------------------------------------------------+
| RESEARCH         0000.00.00 00:00:00 | CREDITS 000,000 CR | INFLUENCE 0 | INTEL 1 | ROSTER 8 / 8 |
| CORPORATE R&D NETWORK // ADVANCING TOMORROW                                                        |
+-----------------------+------------------------------------------+-------------------------------+
| DIVISION OVERVIEW 0/21| BALLISTICS   CYBERNETICS   CONTROL SYS.  | TITLE              [AVAILABLE]|
| PROJECTS COMPLETE   0 |                                          | [art]  BRANCH             NAME|
| PROJECTS RUNNING  0/3 |   (N)  (N)      (N)  (N)      (N)  (N)    | [art]  LABORATORY         NAME|
| READY TO AUTHORIZE  6 |                                          | [art]  TIER                  1|
| COMMITTED CREDITS 0 CR|   (N)  (N)      (N)  (N)      (N)  (N)    | [art]  RUN TIME             2H|
| AVAILABLE CREDITS     |                                          | [art]  FUNDING    16,000 CR   |
|            128,450 CR |   (N)  (N)      (N)  (N)      (N)  (N)    | DESCRIPTION                   |
|                       |                                          | blurb text, scrolls           |
| LABORATORY STATUS     |      (N)           (N)           (N)     | PREREQS          BENEFIT      |
| BALLISTICS LAB   IDLE |                                          | NONE / names     +12% DAMAGE  |
| NO PROJECT AUTHORIZED |                                          |                               |
| CYBERNETICS LAB  IDLE |                                          |                               |
| NO PROJECT AUTHORIZED |                                          | [ AUTHORIZE PROJECT ]         |
| SYSTEMS LAB      IDLE |RESEARCHED  IN PROGRESS  AVAILABLE  LOCKED| COMMITS 16,000 CR // 2H IN LAB|
| NO PROJECT AUTHORIZED | ONE PROJECT PER LAB // RUN ON WORLD TIME |                               |
+-----------------------+------------------------------------------+-------------------------------+
| WORLD NETWORK | [RESEARCH] | BRIEF LOCKED // NO CONTRACT SELECTED | ASSEMBLY                     |
+----------------------------------------------------------------------------------------------------+
```

`(N)` is one hexagonal node (glyph, one or two label lines, lock mark when locked, check mark when researched). Each branch is two nodes wide for three tiers, then one centered capstone (`ROW_Y`, `COL_X` in `Research.tsx`). A running lab replaces its `IDLE` row with percentage, project name, a bar and `H:MM:SS REMAINING`.

### Layout Zones

**Arrangements considered** (autonomous mode picked the shipped one; logged in `production/session-logs/decision-log.md`):

| Option | Description | For | Against |
|---|---|---|---|
| **A — Left status, center tree, right detail (chosen)** | Overview and labs left, three branch columns center, project detail and Authorize right | Shipped and tuned to the 1280×720 floor. The thing inspected and the spend that acts on it share one column; the Authorize button is pinned at the foot where the eye leaves the spec | Side columns widen with text scale, so the tree plate narrows at 125% |
| B — Detail below the tree | Tree full width, detail strip beneath | More room for the tree | Detail and Authorize would sit far from the node just picked, and a strip cannot hold the spec, two boxes and a button at 720p |
| C — One project list, no tree | Three sorted lists | Easy keyboard scan | Loses the prerequisite structure that makes locked nodes legible (Research GDD: "an unreadable lock tree" is the named failure) |

**Chosen zones (A)**, from `.rs-main` (`grid-template-columns`, gap 10 px) at 1280 and the screenshots:

| Zone | Size at 1280×720, 100% / 125% | Contents | Why here |
|---|---|---|---|
| **Header** | full width | Title, subtitle, clock chip (date and time), Credits, Influence, Intel, Roster | Shared by the four Screens. Research shows a clock chip; World Network does not (Open Question 12) |
| **Left: status** | `clamp(218px×scale, 17vw, 258px×scale)` = 218 / 272.5 px | DIVISION OVERVIEW (five rows), LABORATORY STATUS (three rows) | Orientation and what is running, read before choosing |
| **Center: tree** | remainder: ≈692 / ≈599 px (read from screenshots) | Three branch columns (head plus one scaled SVG each), legend row | The survey. Prerequisite links are drawn between nodes |
| **Right: detail** | `clamp(286px×scale, 25vw, 350px×scale)` = 320 / 357.5 px | Title and state chip; scrolling spec; pinned Authorize and its reason line | Inspect, then commit, in one column |
| **Nav** | full width | P-06 four tabs | Shared chrome |

**Spec deltas from the shipped screen** (each is an Open Question, none silently assumed):

- **State cues on the tree.** Every node state has a non-colour cue: lock mark (locked), 2 px stroke plus rising fill (in progress), check mark (researched, `.rs-node-done`, added in IF-037), and the word on the selected node's chip. Available is the baseline hexagon with no mark. Closed in Open Question 3.
- **Node labels and text scale (decision, Claude (delegated, 2026-10-23)).** The tree is fixed geometry. A node label is one `<text>` whose lines are `<tspan dy="1.05em">` (the pitch grows with the type) and follows the text scale only up to 110%: `.rs-node-label { font-size: calc(10.6px * min(var(--text-scale), 1.1)) }`. At 125% node labels stay at their 110% size. The detail panel prints the full project name at every scale (its title wraps; nothing is truncated), so no name depends on a node label being legible. Closed in Open Question 7.
- **Single owner per figure.** Credits print in the header and again as AVAILABLE CREDITS; the complete count prints in the panel title and as PROJECTS COMPLETE (Open Question 13).
- **Clock state.** The header shows the time but not whether the clock runs (Open Question 12).

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks (its Gaps list names the **Research node graph**).

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Header | Clock chip, Credits, Influence, Intel, Roster | Stat chips ×5 | `date time`, `CREDITS n CR` (amber, money only), `INFLUENCE n`, `INTEL n`, `ROSTER n / cap` | No | P-14 |
| Left | DIVISION OVERVIEW | Panel, five key-value rows | Title figure `done / 21`; PROJECTS COMPLETE, PROJECTS RUNNING `n / 3`, READY TO AUTHORIZE, COMMITTED CREDITS, AVAILABLE CREDITS | No | P-14. Not in any GDD (Open Question 13) |
| Left | LABORATORY STATUS rows ×3 | Idle row (not interactive) or running button | Idle: lab name, `IDLE`, `NO PROJECT AUTHORIZED`. Running: lab name, `n%`, project name, fill bar, `H:MM:SS REMAINING` | Running rows: select that project | P-22, P-14, P-04 (focus) |
| Center | Branch head ×3 | Heading | Branch name, `// <subtitle>` | No | P-14 |
| Center | Hex node ×21 | `role="button"` SVG group, `aria-pressed` | Glyph; label (one `<text>`, one or two `<tspan dy="1.05em">` lines, scale capped at 110%); lock mark when locked; check mark when researched (`aria-hidden`); selection ring; rising fill when running | Yes: select (inspect only) | New: **Research node graph** (flagged for the library, Open Question 24); P-04 for selection and focus; P-02 "inspect" surface |
| Center | Prerequisite links | Decorative lines | Dim, open (teal), live (dashed, running) | No | none. Meaning is also printed in PREREQUISITES |
| Center | Legend | Key + note | `RESEARCHED`, `IN PROGRESS`, `AVAILABLE`, `LOCKED` swatches; `ONE PROJECT PER LAB // PROJECTS RUN ON WORLD TIME` | No | P-14 |
| Right | Detail header | Title and state chip | Full project title (`nodeTitle`) at every text scale; a title wider than the panel wraps and the chip drops to its own line (`.panel-head` wraps; no ellipsis). Chip `RESEARCHED` / `IN PROGRESS` / `AVAILABLE` / `LOCKED` | No | P-14 |
| Right | Spec block | Art plus key-value rows | `BRANCH`, `LABORATORY`, `TIER`, `RUN TIME nH`, `FUNDING n CR` (amber), `AUG BAY` (slotted projects only: home bay, Research GDD UI Requirements) | No | P-14 |
| Right | DESCRIPTION, PREREQUISITES, PROJECTED BENEFIT | Boxes in a scrolling list | Blurb; each prerequisite with a check (met) or lock glyph (unmet), or `NONE`; per effect a signed line and a scope line | No (list scrolls) | P-14, P-15 |
| Right | PROGRESS block | Readout, active project only | `PROGRESS`, `n%`, `H:MM:SS REMAINING`, fill bar | No | P-22 (see Open Question 6) |
| Right | Authorize | Button, amber spend face | `AUTHORIZE PROJECT`. Disabled unless available, lab idle and Credits sufficient | Yes: spend | P-02, P-03 |
| Right | Reason line | Static text under the button | `COMMITS n CR // nH IN <LAB>`, `RUNNING IN <LAB>`, an eligibility cause, `INSUFFICIENT CREDITS // n CR SHORT`, or the refusal text | No | P-03, P-02 copy surfaces |
| Nav | Four-Screen tabs | Tab bar | Research selected (`aria-current="page"`); Brief locked until a contract is selected | Yes | P-06 |

### Information Hierarchy

Ranked by "what the player needs first to choose a project", with the decision that **the selected project's cost, effect and reason outrank the status counts**.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | Selected project: title, state, FUNDING, RUN TIME, PROJECTED BENEFIT | Always | The decision. Benefit is generated from effect data |
| 2 | Authorize and its reason line | Always | The only spend. A disabled button always has its reason beside it (P-03) |
| 3 | Credits against cost | Always | Header chip; AVAILABLE CREDITS in the overview (duplicate, Open Question 13) |
| 4 | The tree: every project's state and prerequisites | Always | Survey. State by word in the legend, glyph and tone on the node |
| 5 | Laboratory rows: what runs, `n%`, remaining | Always | Time is the cost of waiting |
| 6 | Prerequisites box | Always | Names every unmet prerequisite |
| 7 | Overview counts | Always | READY TO AUTHORIZE is the one actionable count |
| 8 | Legend and note | Always | Teaches the four states and one-project-per-lab |

**Discoverable, not up front**: which slotted bay a project fills (`AUG BAY`, scope `WORN`); Chance gain from completed research is Brief's to label, not this screen's (Research Core Rule 11).

---

## States & Variants

Research is fully synchronous: there is no async load, no loading state and no network error. The only error surface is the Authorize refusal text.

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Opening desk** | New Operation | `0 / 21`, `0 / 3` running, READY 6 (two per branch), COMMITTED 0 CR, AVAILABLE = header Credits. Three idle labs. Advanced Propellants selected, Authorize enabled, `COMMITS 16,000 CR // 2H IN BALLISTICS LAB` (measured, `sweep-research.json`) |
| **Node: locked** | Any prerequisite unresearched | Lock mark on the node, lock glyph in the detail art, chip `LOCKED`, node name in `aria-label` ends `LOCKED`. Selectable for inspection |
| **Node: available** | Every prerequisite researched, not running | Teal hex and glyph, chip `AVAILABLE`. A busy sibling lab does **not** retag it (Research Core Rule 5) |
| **Node: in progress** | Lab took the project | 2 px teal stroke, rising fill, white label, chip `IN PROGRESS`. Lab row switches to running. Link into it draws live |
| **Node: researched** | `sync(t)` saw `t ≥ endT` | Green hex, glyph and label **plus a check mark** at the node's upper-right corner (`.rs-node-done`, `aria-hidden`; the lock mark's position), chip `RESEARCHED`. The check is the non-colour cue. Terminal. Dependents become available and do not auto-start. Not exercised by the sweep (opening desk has none) |
| **Node: selected / focused** | Click, Enter, Space / Tab | Selected: dashed ring, `aria-pressed="true"`. Focused: see Open Questions 1 and 2 |
| **Lab: idle** | No run in that branch | `IDLE`, `NO PROJECT AUTHORIZED`; not interactive |
| **Lab: running, before first sync** | `lastSyncT` is not the current `t` | Name and `n%` and bar paint; the `REMAINING` label is **absent**, never `0` and never a dash (P-22) |
| **Lab: running, after sync** | `lastSyncT === t` | `H:MM:SS REMAINING` painted, rounded up to whole seconds, so a positive remainder never reads `0:00:00`. 50,400 s reads `14:00:00` (format decided 2026-10-19, Interface Screens row) |
| **Authorize: ready** | Available, lab idle, Credits ≥ cost | Enabled; reason `COMMITS n CR // nH IN <LAB>` |
| **Authorize: locked** | Unmet prerequisites | Disabled; reason `LOCKED: REQUIRES <A> AND <B>.` naming **every** unmet prerequisite. An inspect surface: it never says Credits did not change |
| **Authorize: lab not idle** | Same-branch lab running another project | Disabled; reason `LAB NOT IDLE: THE <LAB> IS RUNNING <PROJECT>.` Appended after any prerequisite cause, separated by `;` |
| **Authorize: unaffordable** | Credits < cost, otherwise eligible | Disabled; reason `INSUFFICIENT CREDITS // n CR SHORT`. When a project is also ineligible only the eligibility text prints (Open Question 14) |
| **Authorize: active** | Selected project is running | Disabled; reason `RUNNING IN <LAB>` |
| **Authorize: researched** | Selected project done | Disabled; reason `ALREADY RESEARCHED.` |
| **Refused attempt / mismatch undo** | `authorizeResearch` returns `ok: false` | The reason line is replaced by the returned text, upper-cased, and holds until the next attempt or until `labs` or `done` changes. Text always ends by saying Credits did not change; the mismatch path also says the lab was not occupied. Not reachable by a disabled button, so only the debit-mismatch path can raise it from the UI |
| **Program complete (21 / 21)** | All researched | READY 0, all labs idle, every node researched, Authorize disabled with `ALREADY RESEARCHED.`. No Feed line yet (Open Question 18) |
| **Failed campaign** | Empty living roster | Research stays usable; no banner on this screen |
| **Clock paused (set on World Network)** | `worldStore.paused` | Countdowns and fills hold still; Research prints no word saying why (Open Question 12) |
| **Text scale 90 / 100 / 110 / 125%** | Settings | Sweep (`sweep-output.txt`, `sweep-research.json` `clips`): 0 clipped, truncated, spilled or overlapping text at all four scales, on the opening desk. No ellipsis exists in `ui.css`: a title or lab project name wider than its box wraps. Left and right columns widen, the tree plate narrows; the detail spec scrolls. Node labels follow the scale up to 110% and stay at that size at 125% (Layout, decision); the detail title prints the full name at every scale |
| **High contrast / reduced motion** | Settings | CSS variables remap only. Reduced motion freezes the in-progress hex pulse and the live link flow (`:root.s-reduce-motion .rs-node.active .rs-hex`, `.rs-link.live`) and stops the fade of an overlay opened over this screen (Settings and Balance print at once: `.hud-menu-wrap` is in the same rule). Sweep: 0 low-contrast HTML runs in high contrast |
| **Window below 1280×720** | Resize | Minimum layout kept; page scrolls. **Not exercised** (sweep README) |

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` `platform.primary_input`). Gamepad: **None**; touch: **None** (ADR-0017). Hover is not a state (library Overview, art bible §7.4); as built, hover styles exist (Open Question 4). Focus is P-04 (as built differs, Open Question 1). Pointer, Enter and Space activate every button; Space is `preventDefault`-ed on nodes. Every activation calls `uiClick` through `act()`. No new key binding is invented. Full keyboard travel across every panel is **Backlog** and is not promoted.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Hex node | Select for inspection | Click; Enter or Space on a focused node | Ring moves; detail panel retargets in the same frame; click sound | Local view state only (`setSelected`). **No spend, no store write** |
| Running lab row | Select that lab's project | Click; Enter or Space | Same | Same. Idle rows are not interactive |
| Authorize | Spend | Click; Enter or Space (native button) | Credits (header and overview), node state, lab row, counts and reason line all change in the same frame; click sound | `appStore.authorizeResearch(node, t)`: refuse before `start()` on ineligible or short; else `start()` then `spendCredits(cost)` once; post-spend re-read, undo on mismatch (ADR-0013). Single step, no confirm, no undo (P-02) |
| Authorize, disabled | — | — | Nothing; the reason beside it already says why | The click cannot occur |
| Detail list | Scroll | Wheel or drag the scrollbar | Fade at the cut edge while content lies below (P-15) | None. Keyboard scrolling is Backlog |
| Nav tab Research / World Network / Assembly | Go | Click; Enter or Space | Click sound | `goto(phase)`; the clock continues |
| Nav tab Brief | Go, or locked | Click only when a contract is selected | Locked tab shows `LOCKED` and `NO CONTRACT SELECTED` as text | `goto('brief')` |
| Escape | — | Esc | None on this screen (no handler in `Research.tsx`) | Nothing. A search of `src/` for Escape handlers (2026-10-23) finds only Settings, Balance and the market (their own overlays, which close first), remap capture, and the mission pause key in `src/scene/Input.tsx`, which acts only when a mission world exists (`getWorld()`); none is attached to this screen. It never confirms a spend. Whether a world object lingers after a mission and lets that key act here is **not verified** (Open Question 16) |

**Spec-vs-built discrepancies are listed once, under Open Questions.**

---

## Data Requirements

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Project catalog: names, glyphs, grid cell, prerequisites, cost, hours, blurb, effects, AUG bay | Research, static (`src/game/research.ts`, living spec §7) | Read | CONTRACT FILE. The UI copies none of the §7 tables |
| Benefit line and scope | Research (`benefitOf`, `benefitIsGain`) | Read | Generated from the effect the mission applies |
| `done`, `labs` (project id, `startedT`, `endT`), `lastSyncT` | Research (`useResearchStore`) | Read; written only by `start` and `sync` | CONTRACT FILE |
| Project state | Research (`nodeState`) | Read | Derived, never stored |
| Eligibility text | Research (`eligibilityText`) | Read | State explanation only; never mentions Credits |
| Remaining | Research oracle `remaining()`; paint gate `paintedRemaining`; format `remainingHms` | Read | Not a 0–1 fraction |
| Progress percentage and fill | As built: `runProgress` in the store module | Read | Contradicts Research UI Requirements (Open Question 6) |
| Credits | Economy (`appStore.credits`) | Read; **Write** only through `authorizeResearch` → `spendCredits` | UI never overdraws (ADR-0013) |
| Strategic `t` | World Network (`worldStore.t`) | Read | The clock is started by `ScreenChrome` and ticks on all four Screens |
| Influence, Intel, Roster count | World Network / `campaignStore` | Read | Shared header |
| Selected project, last refusal text | The Research component (`useState`) | Own view state | Not game state, not persisted, lost on leaving the screen |
| Laboratories in the save | Persistence (strategy autosave includes labs and `done`) | Not touched by the UI | Research GDD Interactions |

**Update triggers and missing values.** The stores always hold a value on this screen; there is no path that supplies "missing", so the P-14 dim em dash has no case here. The one deliberate absence is the remaining label.

| Data | Updates when | If missing |
|---|---|---|
| `done`, `labs`, node states, counts, READY, COMMITTED | A successful authorize; `sync(t)` finds `t ≥ endT` | Cannot be missing |
| Remaining label | Every `sync(t)` (`lastSyncT === t`) | Label absent: before first sync, when not active, when `t ≥ endT` |
| Percentage and fill | Every strategic `t` change (the clock batches `tick`; Nav.tsx comment says up to 20 Hz) | Paints from `t` even before sync |
| Credits (header, AVAILABLE) | Spend, Tax deposit, Debrief, hire | Cannot be missing |
| Header clock chip (date and time) | Every strategic `t` change | Cannot be missing while the screen runs |
| Influence, Intel, Roster (header) | The owning screens' events (Influence spend, Debrief award, hire); this screen never writes them | Shared header, not owned by this screen: the World Network spec's rule applies if an owner supplies nothing (`design/ux/world-network.md`, Data Requirements). Research adds no case |
| Selected project (`useState`) | Click or Enter or Space on a node; click or Enter or Space on a running lab row | Cannot be missing: it starts on the first catalog project (Advanced Propellants) every visit (Open Question 11) |
| Catalog fields (name, glyph, blurb, cost, hours, effects, bay) | Static; never changes at run time | Cannot be missing; `AUG BAY` is absent by rule for unslotted projects, `NONE` prints for no prerequisites, and no catalog entry has an empty `effects` list (searched `src/game/research.ts` 2026-10-23), so the benefit box always has a line |
| Reason line | State or Credits change; refusal text on a refused attempt | Always has text: a state sentence, the cost, or the refusal |
| Unknown lab project id (corrupt save) | — | `nodeById` throws; the screen has no guard. Whether hydration validates ids is not verified (Open Question 19) |

Real-time: `HexFill`, `LabRow` and `ProgressBlock` each subscribe to `worldStore.t`, so a strategic tick re-renders up to three hex fills, three lab rows and one progress block, not the tree (`Research.tsx`). Not profiled. No UI-owned game state is introduced by this spec.

---

## Events Fired

Deliberate: Research fires **no analytics events**. Telemetry is local, opt-in and written only at the Debrief boundary (`src/state/telemetry.ts`, ADR-0015); nothing on this screen calls it. The table lists state changes instead.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Select a node or a running lab row | none (view state in the component) | Project id. Never a spend |
| Authorize, accepted | State change (**persistent**, next autosave): lab occupied (`start`), Credits debited once (`spendCredits`) | Project id, `startedT`, `endT = startedT + hours × 3600`, cost. Owners: `researchStore`, `appStore` |
| Authorize, refused | none; reason text replaced | Ledger and labs unchanged |
| Lab reaches `endT` | State change by the clock: `sync(t)` appends to `done`, frees the lab | No payout, no `addCredits`. **No completion event or surface exists** (Open Question 18) |
| Nav tab | State change: `phase` | Destination |
| Any activation | UI click via the audio event system | `uiClick`. No spend confirmation voice exists in `sound.ts` (Open Question 10) |

Architecture flag: the World Network Feed line owed when the 21st project completes needs an emitting Research event that is named nowhere (World Network spec Open Question 7). This spec does not invent one.

---

## Transitions & Animations

Law (art bible §7.4): the terminal prints, scans, ticks and blinks; nothing bounces, pops, slides or glows. Nothing exceeds 500 ms except a tick tracking a real value. On Research, at most one idle motion (Animation Standards).

| Moment | Spec | Reduced motion |
|---|---|---|
| **Screen enter** | Panel frames snap in ≤150 ms. Content is present from the first frame: the clock is running and a countdown must not be delayed by a print. No row print on the tree or labs | Same; no frame animation |
| **Screen exit** | Cut | Same |
| **Select a node** | Detail panel retargets in the same frame (≤100 ms from input). Ring moves with no tween | Same |
| **Authorize accepted** | Credits, node state, lab row, counts and reason line change in one frame. No pulse, no sting | Same |
| **Rising fill, percentage, remaining** | Discrete steps matched to `t`, linear. Never an eased tween toward a value the sim does not hold | Static figure; the number stays |
| **Hover** | None. Hover is not a state | — |
| **Overlay opened over this screen** | Settings or Balance from their own entry points | Prints at once (the frame snap is ≤150 ms); as built the fade (`.hud-menu-wrap` animation) is removed under reduced motion (IF-037). The overlay is P-05 and is specified in `design/ux/settings.md`, not here | No fade; the overlay is present on the first frame |
| **Idle loops** | **One**: the selected node's breathe (P-04). In-progress is carried by a static 2 px stroke, the fill, the word and the numeral. As built, an in-progress hex pulses (1.9 s) and a live link flows (1.4 s): up to six loops with three labs running (Open Question 5) | Selection is the closed double ring; no other loop runs. As built the pulse and flow already freeze under reduced motion |
| **Completion** | State change in one frame, final state first. No banner, no sting | Same |

Motion budget: one idle motion; no red-cadence motion. As built, the hex stroke and fill changes use a 0.12 s transition and the Authorize face a 0.15 s filter transition, both ≤150 ms.

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017, `project.yaml`), so those blocks are dropped. An item is ticked only when the Interaction Map above specifies it.

**Keyboard**
- [x] Every action activates with Enter and Space: nodes, running lab rows, Authorize, nav tabs.
- [x] Node selection is Enter or Space (Interface Rule 14, AC 19); Authorize has its own Enter or Space (P-04, P-02).
- [x] No timing pressure; no hold input.
- [x] Esc: no behavior on this screen; never confirms a spend (the Escape section of the library).
- [ ] Focus is visible on every control as P-04 corner brackets. **Not met for nodes as built** (Open Question 1).
- [x] No keyboard trap: Research has no overlay.
- [x] Tab order is specified in Accessibility → Focus order and was measured on the running build.
- [x] Reaching Authorize by keyboard costs Tab presses: after selecting node k of 21 the player passes the remaining nodes (21 − k stops) before Authorize. Arrow-key travel in the tree is Backlog and is not promoted (Open Question 23).

**Mouse**
- [x] Every action is a single click.
- [x] No information appears only on hover. The long node name is in the detail title and the `aria-label`, not a tooltip.
- [x] No right-click, double-click or drag.
- [x] Hit-target sizes: the sweep measured **26** pointer targets (21 nodes, Authorize, 4 nav tabs) and **0 under 24×24 CSS px** at 90, 100, 110 and 125% (`sweep-research.json`: `targets: 26`, `underTargets: []`).

| Target (1280×720, 100%) | Size | Meets 24×24? |
|---|---|---|
| Hex node | ≈92×64 (hexagon drawn at 92×64 user units; screenshot, ±2 px) | Yes |
| Authorize | ≈297×40 (screenshot, ±2 px) | Yes |
| Nav tab | ≈306×34 (screenshot, ±2 px) | Yes |
| Running lab row | **Not measured** (no lab was running in the sweep). Full row width, three text lines plus a bar by construction | Expected yes; unverified |

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). No Backlog row (color-vision presets, tactical-HUD screen-reader pass, audio captions, full keyboard travel) is promoted.

| Committed row | How Research satisfies it |
|---|---|
| Critical state never by color alone | Lock: lock mark on the node, `LOCKED` in the chip, `aria-label`. In progress: 2 px stroke, rising fill, `IN PROGRESS` in chip and legend, `n%` and remaining numerals. Selection: `aria-pressed`, dashed ring. Prerequisite met or unmet: check or lock glyph, not hue alone. Benefit sign: `+` or `−` in the line, teal or red only reinforces. Authorize disabled: reason text. Researched: a check mark on the node (`.rs-node-done`) as well as green, so researched and available differ by shape, not hue and tone alone (Open Question 3, closed; art bible §4.5 measures cyan against green at 1.09:1 by luminance, which is why shape is required). The grayscale view itself was not run (Open Question 16) |
| Text legible at 1280×720 | Sweep at 100% (`sweep-output.txt`): 85 HTML runs and 42 SVG text runs (one per `<tspan>` label line), **0 under 10 px**, **0 under 4.5:1** in default mode, 0 Ink Dim or Ink Faint runs; 0 HTML runs under 4.5:1 in high contrast. SVG runs are not re-measured in high contrast by the sweep (Open Question 16). The 12 px readout floor (art bible §7.5) is **not** met by several figures (Open Question 8). No text is cut by an ellipsis: none exists in `ui.css` |
| Text scale 90 / 100 / 110 / 125% | Sweep `clips`: `[]` at all four scales (the check covers clipping, ellipsis truncation, spill, sideways scroll, panel overlap and a visible text line drawn over another, IF-037). Detail list scrolls (P-15). Node labels follow the scale to 110% and hold there at 125% (decision, Layout); the full name is always in the detail title. The sweep's size reading is taken at 100% only, so rendered node-label size at 90, 110 and 125% is **not measured** (Open Question 16) |
| High-contrast mode | Variable remap only; `hcLow: []` (HTML runs) |
| Full keyboard operability of the committed set | Research node select (Enter, Space) and Authorize (native button): met |
| Contextual accessible labels | Node `NAME // BRANCH // STATE`; running lab `<LAB> RUNNING <PROJECT> // n%`; Authorize `AUTHORIZE <PROJECT> // <reason line>`; nav `LABEL // LOCKED // <condition>` with `aria-current="page"` |
| Two-step destructive confirms | None occur. Authorize is single-step by library decision (P-02): bounded, recoverable by play |
| One-shot advisories | None on this screen (the Research prompt is Debrief's, Interface Rule 13) |
| Reduced motion | Pulse and link flow freeze today (`.s-reduce-motion`), and an overlay opened over the screen prints with no fade (IF-037); spec target is no loop except selection (Open Question 5) |
| Consistent one-OS chrome | Same panels, chips, nav and palette as the other Screens |

### Focus order

Tab follows DOM order. It orders the stops that exist; it does not promote full keyboard travel. Measured on the running build 2026-10-23 (opening desk, 1280×720, `sweep-research.json` `tab`):

1. **Left**: running lab rows (buttons) come first in the DOM when a lab runs; idle rows are not stops. **Not measured** (no lab ran in the sweep; order inferred from `Research.tsx`).
2. **Tree**: 21 nodes, branch by branch (Ballistics, Cybernetics, Control Systems), each in the catalog order tier by tier, left then right: Advanced Propellants, Barrel Wear Coating, Hypervelocity Core, Caseless Ammo Feed, Rail Stabilization, Smart Fragmentation, Tungsten Sabot; then Neural Interface I … Neural Cache Array; then Targeting AI Suite … Adaptive Command AI. Locked nodes **are** stops (they are inspectable).
3. **Authorize**: a stop only while enabled (disabled buttons are skipped). Its reason line is part of its accessible name.
4. **Nav**: World Network, Research, Brief (a stop with `aria-disabled="true"` and the name `BRIEF // LOCKED // NO CONTRACT SELECTED`), Assembly.

Nothing takes initial focus; the first Tab lands on the first stop. Shift+Tab reverses. The detail panel is not announced or focused when a node is selected (Open Question 17).

### Contrast

Requirement (art bible §7.5): body and readout text ≥4.5:1 composited against its panel; Ink Dim only at ≥18.66 px bold or ≥24 px; Ink Faint never carries text; non-text state strokes ≥3:1 and, for state-bearing strokes, ≥2 px or double-line.

Measured 2026-10-23 (`sweep-research.json`, after IF-036 and IF-037): `low: []` (HTML, default), `svgLow: []` (SVG, default), `hcLow: []` (HTML, high contrast), `dim: []`, `faint: []`. At the opening desk every HTML text run meets 4.5:1 in default and high contrast, and every SVG text run meets it in default. **Not recorded**: SVG text in high contrast (the sweep reports only HTML runs there), any state beyond the opening desk (running, researched or locked selections, refusal text, researched and in-progress node label inks), and non-text stroke contrast (hex strokes, selection ring, focus stroke; Open Question 16).

Per-ink statement (the sweep records failures, not each passing ratio, so the ratios below are the World Network spec's measurements of the same tokens on the same `--bg-panel` over Void, 2026-10-23; they were **not re-measured on Research**):

| Ink | Ratio (default) | Used on Research for | Status here |
|---|---|---|---|
| Print White | 17.98:1 | In-progress node label, branch head | Meets 4.5:1 |
| Teal | 14.10:1 | READY TO AUTHORIZE figure, available chip, benefit gain line, running `n%` | Meets |
| Signal teal (`--cyan`) | 9.78–11.43:1 | Panel titles, box labels, lab names | Meets |
| Ledger Amber | 13.39:1 | Credits, FUNDING, COMMITTED and AVAILABLE CREDITS, `PROJECTS RUNNING` (role is Open Question 9) | Meets |
| Ink | 12.27–13.04:1 (high contrast 16.63–17.67:1) | Locked and available node labels, key-value labels, descriptions, disabled reason line | Meets |
| Red Hot | 6.90:1 | Brief lock condition in the nav. The negative benefit line uses the `.red` class; that it resolves to Red Hot is not verified, and none is on screen at the opening desk | Meets (nav); benefit line unverified |
| Green (`--green`), amber-hot (`--amber-hot`), researched label (green at 0.85 alpha) | **Not measured as a ratio** | `0 / 21`, `PROJECTS COMPLETE`, `NONE` (green) and the enabled reason line (amber-hot) are on screen at the opening desk and pass the sweep's 4.5:1 check; the researched node label is not on screen there | Floor met only where on screen; researched label unverified |
| Ink Dim | 4.29–4.48:1 | No text on Research (sweep `dim: []`). Used only for the lock mark and the locked art glyph, which are not text | Not used for text; banned below 18.66 px bold |
| Ink Faint | 2.21:1 | None | Never carries text |

The 4.5:1 floor is binding for every ink in every state; a row marked "unverified" is a measurement to take, not an exemption.

Color roles (art bible §4.2): teal = selection and live state; Ledger Amber = money only; Nominal Green = complete or verified; red = danger. As built, `PROJECTS RUNNING n / 3` prints amber, which is not money (Open Question 9).

Screen-reader considerations:
- Nodes are `role="button"` with `aria-pressed` inside an SVG that has no label; the branch is in each node's name.
- The reason line is static text, not a live region; acceptance, refusal and completion are not announced (Open Question 17).
- The remaining label is intentionally not a live region (it changes every second).
- Decorative: glyphs and the lock mark are `aria-hidden`; the fill bar has no role and the percentage and remaining numerals carry the value.

---

## Localization Considerations

Scope: English only. No localization system or plan exists in the GDDs and every string on this screen is a literal in `src/ui/Research.tsx`, `researchAuth.ts`, `researchStore.ts` and `appStore.ts` (Open Question 20). The flags apply if that changes. The test is 40% expansion. Rule: expanded text wraps or scrolls; it never clips, truncates or shrinks type (Interface Rule 6).

**How the limits were derived.** Box widths are from `sweep-research.json` `textBoxes` at 100%. Monospace advance is taken as **0.6 em plus the CSS `letter-spacing`**, which matches the measured inline widths (for example `BALLISTICS LAB`, 14 characters at 10 px, measures 104 px: 0.74 em, `0.14em` tracking). Untracked text uses the ~0.62 em assumption. Limit = box width ÷ (font px × advance), rounded down. The 125% column uses the CSS clamps (left column ×1.25, right column +37.5 px) and linear type growth; **derived, not measured**. Where a run was blockified by flex its `w` is its container's inner width.

| Element | Box at 1280, 100% | Size, advance | Max chars / line (100% / 125%) | Longest English text | Risk at +40% |
|---|---|---|---|---|---|
| Left panel title (`DIVISION OVERVIEW` + `0 / 21`) | ≈198 px head, 136 + 48 + 8 used | 10 px, 0.8 em | 17 with the figure / 17 | `DIVISION OVERVIEW` (17) | Medium. At the limit in English. Since IF-037 the head wraps (`.panel-head { flex-wrap: wrap }`, `.panel-title { overflow-wrap: break-word }`): the figure drops to a second line, then the title wraps. No truncation |
| Overview label (alone) | ≈195 px row (screenshot) | 11 px, 0.685 em (measured) | 25 / 25 | `READY TO AUTHORIZE` (18) | Medium (~25, at the limit). Figure drops under its label, as `128,450 CR` already does at 100% |
| Overview figure | same row | 13 px bold | ≈22 / 22 | `128,450 CR` (10) | Low |
| Lab row project name | 177 px | 10.5 px, 0.68 em, wraps (`overflow-wrap: break-word`) | 24 / 24 | `NEURAL ACCELERATOR MK II` (24) | **HIGH PRIORITY**. At the limit in English; wraps to a second line, so three running rows grow taller. Fit of three tall rows at 125% is not measured (Open Question 16) |
| Lab remaining label | 177 px | 10 px, 0.7 em, `nowrap` | 25 / 25 | `14:00:00 REMAINING` (18) | Medium |
| Branch subtitle | 205 px | 10 px, 0.74 em | 27 / 20 | `// HUMAN AUGMENTATION` (21) | Medium. Already wraps at 125% in English (`research-125.png`) |
| Detail title + chip | ≈318 px head | 10 px, 0.8 em; chip 0.74 em | ≈24 with an `IN PROGRESS` chip at 100%; ≈21 at 125% | `NEURAL ACCELERATOR MK II` (24) | Medium. Derived: 24-char title plus `IN PROGRESS` chip fills ≈317 of 318 px at 100% and exceeds the 357 px column at 125%; the head wraps (chip to its own line, then the title), so the full name always prints. Not rendered (Open Question 15) |
| Spec row (label + value) | ≈169 px | 10 px, 0.68 em, value `nowrap`, gap 8 | `LABORATORY` + 14 chars / + 14 | `LABORATORY` + `CYBERNETICS LAB` (15) | **HIGH PRIORITY**. Derived 178 px against 169 px in English at 100% (Open Question 15) |
| Description (sentence case) | 276 px | 10 px, 0.62 em | 44 / 40 | Longest blurb ≈93 chars | Low; wraps inside the scrolling list |
| Prerequisite name | 99 px text column | 10 px, 0.66 em | 15 / 15 | `RAIL STABILIZATION` (18) | Medium. Wraps; rows grow |
| Benefit line | 133 px | 10.5 px, 0.66 em | 19 / 18 | `-15% RELOAD TIME` (16) | Medium (~22). Wraps |
| Benefit scope | 133 px | 10 px, 0.7 em | 19 / 18 | `WORN // ALL SQUAD WEAPONS` (25) | Medium. Already wraps in English |
| Authorize label | 276 px inner | 14 px, 0.84 em | 23 / 21 | `AUTHORIZE PROJECT` (17) | Medium (~24). Wraps |
| Reason line | 298 px | 10 px, 0.74 em | 40 / 36 | `COMMITS 16,000 CR // 2H IN BALLISTICS LAB` (41, wraps now); worst case about 126 characters (two unmet prerequisites plus a busy lab) | **HIGH PRIORITY**. The line sits outside the scrolling list, so growth squeezes the list (Open Question 15) |
| Node label, per line | 92-unit hexagon; ≈78 units wide at line 1, ≈62 at line 2 (geometry) | 10.6 units × min(scale, 1.1), 0.65 em; line pitch 1.05 em | ≈11 line 1, ≈9 line 2 at 100%; ≈10 / ≈8 at 110% and 125% (size capped) | `HYPERVELOCITY`, `STABILIZATION`, `FRAGMENTATION`, `SENSOR FUSION` (13) | **HIGH PRIORITY**. English lines of 13 characters reach the hexagon outline in `research-100.png` and `research-125.png` (screenshot reading, not measured; the sweep checks text against text, not text against its own hexagon). Lines cannot wrap further. The full name is always in the detail title and the `aria-label`. Hex label text is "do-not-invent" (Interface), so any shortening for a locale needs the owner (Open Question 16) |
| Legend note | ≈670 px plate (derived) | 10 px, 0.74 em | 90 / 62 | `ONE PROJECT PER LAB // PROJECTS RUN ON WORLD TIME` (49) | Low; wraps |
| Header subtitle | ≈633 px before the chips (derived) | 10 px, 0.9 em | ≈70 / not computed | `CORPORATE R&D NETWORK // ADVANCING TOMORROW` (44) | Low at 100% |
| Nav locked condition | 306 px | 10 px | See `design/ux/world-network.md` (42 / 33) | `NO CONTRACT SELECTED` (20) | Low |
| Project names, branch names, weapon names | — | — | — | Proper nouns | Not translated. Hex labels carry `full` names only where abbreviated (`nodeTitle`) |

Numbers and formats: Credits use thousands separators and `CR` (`fmt`, `toLocaleString('en-US')`); remaining is `H:MM:SS`; run time is `nH`; percentages are integers with `%`. A future locale needs these chosen deliberately, not inherited from the browser.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. The GDD's own ACs (cost and refuse sequence, `endT`, `sync` ordering, formulas, deploy cut) stay in `design/gdd/research.md` and are not repeated.

**Performance / responsiveness**
- [ ] **Response budget.** Selecting a node, pressing Authorize and changing screens update every affected readout within 100 ms of the input (the next painted frame). Test: record a performance trace at 1280×720 and read input-to-paint. No numeric open-time budget exists for this screen and none is invented here (Open Question 25).
- [ ] **Tick stays light.** With three labs running and the clock at 8× (set on World Network) the screen stays interactive: a node click and the Authorize press respond within the same budget while countdowns advance.

**Core purpose**
- [ ] **Opening desk.** On a New Operation: three branches of seven nodes; header and AVAILABLE CREDITS read `128,450 CR`; `0 / 21` complete, `0 / 3` running, 6 ready, 0 CR committed; three labs read `IDLE` and `NO PROJECT AUTHORIZED`; Advanced Propellants selected with `AUTHORIZE PROJECT` enabled and `COMMITS 16,000 CR // 2H IN BALLISTICS LAB`.
- [ ] **Select is not spend.** Clicking, or pressing Enter or Space on, any of the 21 nodes changes the detail panel and nothing else: Credits, labs and counts are unchanged.
- [ ] **Authorize is one step.** On an enabled Authorize, one click or one Enter or Space starts the project with no confirm: Credits fall by exactly the listed cost in the same frame (header and AVAILABLE CREDITS), the node reads `IN PROGRESS`, the lab row shows the project and its percentage, `PROJECTS RUNNING` rises by one, `COMMITTED CREDITS` equals the cost, and Authorize is disabled with `RUNNING IN <LAB>`. No Cancel, Stop or undo control exists anywhere.
- [ ] **Remaining time.** Once the first clock sync after start has run, the lab row and the PROGRESS block read `H:MM:SS REMAINING` and the figure falls with the clock; a 2 h project reads about `2:00:00` at start, a 14 h project `14:00:00`. The label is absent, not `0`, before the first sync, and never reads `0:00:00`.
- [ ] **Completion.** When the clock passes a project's end, its node reads `RESEARCHED`, its lab reads `IDLE`, Credits are unchanged, and each project that needed only it now reads `AVAILABLE` (not `IN PROGRESS`).
- [ ] **One project per lab.** While a lab runs a project, every other project in that branch that is otherwise eligible stays `AVAILABLE` but its Authorize is disabled with `LAB NOT IDLE` and the running project's name. Another branch's lab is unaffected; all three can run at once.

**Disabled reasons (P-03)**
- [ ] **Reason beside the control.** For each disabled case the reason is visible without focus or hover and names the actual cause: a locked project lists **every** unmet prerequisite by name; a busy lab names its project; an unaffordable project reads `INSUFFICIENT CREDITS // n CR SHORT` with the right shortfall; a researched project reads `ALREADY RESEARCHED`. None of these inspect texts says Credits did not change.
- [ ] **Refused attempt.** No UI input reaches this case (a disabled Authorize cannot be pressed); test it with a harness that makes the Credits debit leave the balance unchanged and then presses an enabled Authorize. If an authorize attempt is refused, the reason line shows the refusal text containing `CREDITS DID NOT CHANGE` (case-insensitive) and, if the lab was not occupied, `THE LAB WAS NOT OCCUPIED`; Credits and labs are unchanged; the text holds until the next attempt or a change in labs or `done`, and stays visible even though Authorize is disabled.

**Navigation**
- [ ] **Nav and exits.** Research shows the selected frame and `aria-current="page"`. Brief shows `LOCKED` and `NO CONTRACT SELECTED` as visible text with no contract selected. Going to World Network or Assembly and back keeps running labs, their remaining time, Credits and every project state. (As built the selected node resets to the first project on return; this changes if Open Question 11 is decided otherwise.)
- [ ] **The clock runs here.** With a running lab and an unpaused clock, the remaining time falls while the tester touches nothing on this screen.

**Accessibility and layout** (per Standard tier)
- [ ] **Layout.** At 1280×720 and text scale 90 / 100 / 110 / 125%, no text is clipped or truncated (no ellipsis anywhere, none cut by a box), no box overlaps another, and no text line is drawn over another line (node label lines included); overflow scrolls and is reachable. A long project title or lab project name wraps onto a further line. (Sweep 2026-10-23: 0 at all four scales, opening desk.)
- [ ] **Node labels and text scale.** Node label type grows from 90% to 110% and is the same size at 125% as at 110%. At every scale, selecting any node prints its full project name in the detail panel title, unshortened.
- [ ] **Contrast and size.** At 100% every text run (HTML and SVG) is at least 10 px and at least 4.5:1 as rendered, in default and in high contrast, in every node state (locked, available, in progress, researched) and on refusal text. (Sweep: 85 HTML and 42 SVG runs, 0 failures at the opening desk; the other states and SVG in high contrast are not yet measured.)
- [ ] **Keyboard and focus.** Every node, running lab row, Authorize (while enabled) and nav tab is reachable by Tab and operable with Enter and Space; the focused control shows four corner brackets around it in default and high contrast; the Tab order is: running lab rows (top to bottom), the 21 nodes branch by branch (Ballistics, Cybernetics, Control Systems), Authorize, then World Network, Research, Brief, Assembly. (Brackets on nodes not met as built, Open Question 1.)
- [ ] **Non-color cues.** In a grayscale view a tester can tell locked (lock mark), available (plain hexagon), in progress (2 px stroke and rising fill) and researched (check mark) nodes apart, and selected from unselected, without the legend colors.
- [ ] **Hit targets.** At 1280×720 and 100%, every pointer target, running lab rows included, is at least 24×24 CSS px measured on the element box (sweep: 26 targets, 0 under; running lab rows not yet measured).
- [ ] **Motion.** With reduced motion on, nothing on the screen loops, and Settings or Balance opened over the screen appears with no fade. With it off, at most one idle motion runs with three labs running. (As built there are up to six, Open Question 5.)

---

## Open Questions

Items are as-built deltas or unknowns recorded while reading the shipped screen (`src/ui/Research.tsx`, `ui.css` `.rs-*`, `researchStore.ts`, `appStore.ts`, 2026-10-23) against the library, art bible, accessibility tier and GDDs. They are inputs to implementation stories, not defects: no GDD AC fails on them unless stated, and none was filed as a bug by this skill. Resolutions marked "proposed" are recommendations awaiting owner decision.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **As-built delta, node focus marker.** P-04: focus is corner brackets. The shared bracket rule draws on `::after` of `button, a, [tabindex]` (`src/index.css`); nodes are SVG groups, and the only focus rule written for them is `.rs-node:focus-visible .rs-hex` (a 2-unit dashed teal stroke) with `.rs-node:focus { outline: none }`. Whether the brackets render on an SVG group was **not verified in a browser**. Proposed: brackets drawn around the node, kept in high contrast | ui-programmer / ux-designer | Open |
| 2 | **As-built delta, selection marker.** P-04 and art bible §7.5: selection is a closed double ring, state strokes ≥2 px or double-line, breathing slowly, static double ring under reduced motion. As built `.rs-hex-ring` is a single dashed stroke of width 1 in cyan, with no breathe. Proposed: closed double ring ≥2 px, one slow breathe | ui-programmer / art-director | Open |
| 3 | **As-built delta, "researched" has no shape cue on the node.** Researched is green stroke, fill and label; available is teal. Art bible §4.5 gives cyan against green 1.09:1 by luminance and requires a shape for cyan meaning. The only checkmarks were in the PREREQUISITES box. **Resolved in IF-037 (commit 52be089): a researched node draws a check glyph (`.rs-node-done`, `aria-hidden`) at the lock mark's position, besides green.** The grayscale view was not run and no researched node was on screen in the sweep (Open Question 16) | art-director / ux-designer | Closed 2026-10-23; code: IF-037 |
| 4 | **As-built delta, hover.** Hover is not a state (library Overview, art bible §7.4). As built: `.rs-node:hover .rs-hex` recolours the stroke, `.rs-lab.live:hover` tints the row and `.cta:hover` adds a glow and an ink change to Authorize (the last rule is shared with other screens' `.cta`) | ui-programmer / art-director | Open |
| 5 | **As-built delta, idle motion.** Interface and Animation Standards: at most one idle motion on Research. As built an in-progress hex pulses (`rs-node-pulse`, 1.9 s, infinite) and each live link flows (`route-flow`, 1.4 s, infinite): up to three plus three with three labs running. Both freeze under reduced motion. In-progress already has a stroke, a fill, a word and a numeral. Proposed: delete both loops; the selected node's breathe is the one idle motion | ux-designer / art-director | Open |
| 6 | **As-built delta, stored progress fraction.** Research UI Requirements calls the store's `runProgress` "a violation to remove" and P-22 says "Do not revive `runProgress`". As built `HexFill`, `LabRow` and `ProgressBlock` use it for the fill and an `n%` numeral, painted from `t` even before sync, when the remaining label is absent. P-22 allows a render-time fill beside the remaining numeral; it does not mention a percentage. Decide: derive the fill from `remaining` and the catalog hours, and keep or drop `n%`. The format `H:MM:SS` itself is **closed** (Interface Screens row, 2026-10-19); the `remainingHms` code comment still says "pending" | game-designer / ui-programmer | Open |
| 7 | **Node labels at larger text scales.** Before IF-037 the line pitch was a fixed 11 units while the type grew with the text scale, so the two label lines overlapped at 110% and 125% (the sweep's new text-overlap check found 22 Research overlaps at 125% before the fix). **Decision, Claude (delegated, 2026-10-23):** the tree stays fixed geometry; a label is one `<text>` with `<tspan dy="1.05em">` lines, and follows the text scale only up to 110% (`.rs-node-label { font-size: calc(10.6px * min(var(--text-scale), 1.1)) }`); the detail panel prints the full project name at every scale. Sweep after the fix: 0 clip, truncation or text overlap at 90 / 100 / 110 / 125. Residual, not a reopening: English lines of 13 characters reach the hexagon outline (screenshots, not measured; tracked in Open Question 16). The rejected alternatives (hex and plate grow and the tree scrolls; labels outside the hexagon) stay available if the owner overrides | ux-designer / art-director | Closed 2026-10-23 (decision); code: IF-037 |
| 8 | **As-built delta, readout size.** Art bible §7.5 and P-14: readouts ≥12 px, 10 px only for tertiary labels. The sweep proves the 10 px floor, not 12 px. As built at 100%: `FUNDING` and `RUN TIME` values 10 px, benefit line 10.5 px, remaining label 10 px, header Credits chip 10 px; overview figures 13 px and `n%` 19 px comply. Proposed readout list for this screen: header Credits, FUNDING, RUN TIME, benefit line, remaining, `n%`, overview figures | ui-programmer / art-director | Open |
| 9 | **As-built delta, colour role.** `PROJECTS RUNNING n / 3` prints in the amber class; amber is money only (art bible §4.2, Interface Rule 4). Money rows (FUNDING, COMMITTED, AVAILABLE, the enabled reason line) are correct. Proposed: teal, as READY TO AUTHORIZE | ui-programmer | Open |
| 10 | **No spend confirmation sound.** Sound Standards: "Spend succeeds (P-02): Confirmation". `sound.ts` exports only `uiClick` (plus beds and unlock) and Authorize calls `act()`, so only the click plays. World Network's spec assumes the same sound for Influence | audio-director / ui-programmer | Open |
| 11 | **As-built behavior, selection does not persist and defaults to the first project.** `useState(NODES[0].id)` resets on every visit, so the screen always opens on Advanced Propellants, even when it is researched. The Debrief prompt names the **cheapest available** project (Interface Rule 13); in the opening data that is Barrel Wear Coating (14,000 CR), not Advanced Propellants (16,000 CR). Whether to open on the prompted, first-available, running or last-viewed project is undecided. The Acceptance Criteria record the as-built reset | game-designer / ux-designer | Open |
| 12 | **Clock state is not shown on Research.** The header prints a date and time chip only (`ClockChip`); no `PAUSED` or `nX`, and no control. A player who paused on World Network sees frozen countdowns with no stated cause. P-20 puts clock state in words. Options: a word in the clock chip; or accept and rely on the World Network transport. World Network's header shows no clock at all | ux-designer / game-designer | Open |
| 13 | **DIVISION OVERVIEW is in no GDD.** The Research GDD and Interface row name branch inspect, states, occupancy, remaining, home bay and cost against Credits; none names the overview. It repeats Credits (header) and the complete count (title figure and PROJECTS COMPLETE). `COMMITTED CREDITS` sums the cost of running projects, which are already debited, and it falls on completion though no Credit returns; its meaning to a player is untested. Keep, cut, or relabel | game-designer / ux-designer | Open |
| 14 | **Unaffordable and ineligible together.** Research UI Requirements and P-03: affordability wins the control and the eligibility text "still displays beneath it". As built, when any eligibility cause exists the reason line prints only that cause; the shortfall prints only when the project is otherwise eligible. Whether both lines print is undecided | ux-designer / game-designer | Open |
| 15 | **Long-text exposure not measured.** (a) The reason line sits outside the scrolling list; worst English text is about 126 characters (about four lines at 100%), and a refusal adds the project name and the credits sentence. (b) ~~`.panel-title` truncates with an ellipsis~~: **closed by IF-037**, the panel head wraps, so `NEURAL ACCELERATOR MK II` with an `IN PROGRESS` chip (≈317 of 318 px at 100% by derivation, over the column at 125%) drops the chip to a second line instead of truncating; not rendered. (c) The spec row `LABORATORY` + `CYBERNETICS LAB` derives to 178 px against 169 px at 100%, and the value is still `white-space: nowrap` (`.rs-spec .kv b`); not rendered with a Cybernetics project selected. (a) and (c) derived from box widths and the advance assumption; none rendered | qa-lead | Open (a, c); (b) closed 2026-10-23 |
| 16 | **Sweep covers the opening desk at 100% only for size and ink.** `sweep-research.json` was taken with Advanced Propellants selected, nothing researched or running; sizes and ratios are read at 100%, clip and overlap at all four scales. Not measured: running lab rows (hit size, and whether three taller, wrapping rows fit the left column without a scroll box at 125%), the PROGRESS block, locked, researched and active selections, the Cybernetics and Control selections (Open Question 15c), refusal text, the researched check glyph and a grayscale view of all four node states, non-text stroke contrast, the ink of researched and in-progress node labels, SVG text in high contrast, rendered node-label size at 90 / 110 / 125%, node-label lines against their own hexagon outline, and whether a mission world lingering after a mission lets the pause key act on this screen. Window below 1280×720 and above it also not exercised | qa-lead | Open |
| 17 | **Focus and announcements around Authorize (not verified).** Authorize becomes disabled while focused after a successful start, and the detail panel changes without a live region, so acceptance, refusal and completion are visual only. Selecting a node does not move focus or announce the detail panel. Whether the browser drops focus when a focused button disables was not tested. Proposed: no new live region is promoted by this spec; record the finding and the focus behavior to test | accessibility-specialist | Open |
| 18 | **Completions are silent.** No per-project completion beat exists (Interface Open Question 10) and the 21st-project Feed line has no emitting event (World Network spec Open Question 7; Research UI Requirements obligation 2). A lab that finishes on another Screen is discovered only by the node state, counts and lab row | game-designer / systems-designer | Open |
| 19 | **Corrupt lab id.** `nodeById` throws on an unknown id and `LabRow` and `BranchColumn` do not guard it. Whether save hydration rejects unknown lab ids was not verified | persistence owner | Open (non-blocking) |
| 20 | `.claude/rules/ui-code.md` asks for gamepad support and a localization system. ADR-0017 forbids gamepad and touch and no localization system exists; this spec follows ADR-0017 and `project.yaml`, as `design/ux/world-network.md` Open Question 13 does | owner | Open (rule file) |
| 21 | Player journey map missing: `design/player-journey.md` does not exist; arrival situations come from the GDDs. No Research playtest finding was provided | game-designer | Open (non-blocking) |
| 22 | **Credits against cost at the point of action.** P-02: cost prints beside the header Credits at the point of action. As built the cost prints in the reason line under Authorize and Credits sit in the header and the overview, three zones apart. Decide whether the balance also prints beside the button (this also resolves the duplicate in Question 13) | ux-designer | Open |
| 23 | **Keyboard cost of the tree.** Reaching Authorize after selecting node k of 21 takes 21 − k further node stops, then Authorize (no arrow travel). Full keyboard travel is Backlog (§19.6) and is not promoted by this spec; recorded so the cost is visible | owner | Open (Backlog) |
| 24 | **Library gap: Research node graph.** `design/ux/interaction-patterns.md` (Gaps) lists the Research node graph as not yet a pattern and says a spec must add one before inventing behavior. This spec uses only existing patterns for it (P-04 selection and focus, P-02 inspect, P-03 reasons, P-22 remaining) plus the layout and state cues above; the hex-node component is **flagged for addition** to the library as its own pattern (states, marks, label sizing rule, focus). P-24 (Scan marker and Focus selection) and P-25 (Inline moment note) were checked and do not apply: node selection is not World Network Focus, and Research shows no moment note | ux-designer | Open (library addition) |
| 25 | **No numeric open-time budget.** The Interface GDD forbids inventing one; the Response-budget criterion holds the ≤100 ms input-to-paint budget only. As on World Network (its Open Question 18), a number is to come from a profile | performance-analyst | Open |
