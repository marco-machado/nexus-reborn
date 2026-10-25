# UX Spec: Assembly

> **Status**: Approved (/ux-review design/ux/assembly.md 2026-10-23)
> **Author**: Claude (delegated by owner /goal 2026-10-23) + ux-designer
> **Last Updated**: 2026-10-23 (IF-039: deploy line names the contract and the days a win spends; slot-cycle hint)
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at Assembly wanting to **choose who walks the street and know that squad can deploy, or exactly why it cannot**. The sentence the screen must make true is: "I see who is Ready, I send one to four of them, I see what they weigh and how fast that makes them, and the Deploy button tells me its own reason."

Assembly is the `phase = 'team'` Screen, one of the four (Interface Rule 10), and the last room before the field (Interface Rule 7: Brief → **Assembly** → Deploy → Mission). It does six jobs:

1. **Inspect**: read a dossier (codename, civilian name as an identity line, role, Ready or Injured, specialty line, the role's one active and one passive, four augmentation bays, weapons). Inspecting never assigns (Roster Core Rule 3).
2. **Assign**: put one to four Ready operatives in the four Squad bays. An empty bay is a command, not a fail (Roster Core Rule 2).
3. **Wear / pin**: per operative, per bay, choose current issue (AUTO), a pinned older completed project, or STOCK ISSUE (ADR-0005).
4. **Load**: fill two Item slots per operative (med kit, power cell); each explicit slot adds mass.
5. **Weigh and deploy**: read Deployment mass against the 400 kg gate and the light / standard / heavy tier, then Deploy, or read the one reason it is refused.
6. **Hire**: open the Recruitment Market, read cost against Credits, and sign a candidate when Credits and roster cap allow.

**Failure if this screen is missing or hard to use**: the director has no personnel choice, Research has nowhere to land on a later firefight, and a kill is not a campaign cost (Roster GDD Overview). The fantasy fails if every bay must be filled, if wear reads as owned hardware, if dossiers become character drama, or if the room looks like a second game (Roster Player Fantasy).

**Player evidence**: the 2026-10-19 playtest names the Assembly step in its test focus but records **no Assembly-specific finding** (searched: the only roster note is that attrition "matters a lot"). Two related findings bear on this screen: abilities were "no idea what tf are abilities and how to use them" (High), and the tester did not know where grenades come from (power cells, which are filled here). Both are inputs to the ROLE PROTOCOL block and the Item slots (Open Questions 9, 11). No Assembly playtest exists.

**Pillars served**: *Command, do not micromanage* (one to four, empty bays legal); *The two layers feed each other* (what Research finished is what the bays wear; what the last mission did sets who is Ready); *Information is operational power* (mass, tier and the gate reason are undecorated numbers and words); *One corporate operating system* (same chrome as the other three Screens).

Sources: `design/gdd/roster-and-assembly.md` (Core Rules 2–4, 11–13, 17–19; UI Requirements; ACs 1–10, 27–33, 51–56), `design/gdd/interface.md` (Screens row, Deploy state row, advisory rule), ADR-0019 (deploy gate), `design/ux/interaction-patterns.md` P-02, P-03, P-04, P-05, P-06, P-14, P-15, P-20.

---

## Player Context on Arrival

| Arrival | What the player was just doing | Assumed emotional state | What they most need |
|---|---|---|---|
| **Accept Contract from Brief** | Read the Brief and pressed ACCEPT CONTRACT (free, no confirm; `goto('team')`) | Committed, wants to go | The previous squad already assigned, mass and tier read at a glance, an enabled DEPLOY or one reason it is not |
| **Nav hop, no contract selected** | Checking the roster, hiring, wearing blueprints between contracts | Calm, planning | Everything editable; DEPLOY visibly refused with `NO CONTRACT SELECTED`, not broken |
| **After a loss, KIA or new injury** | Read the Debrief casualty rows | Stung; "who do I have left?" | The cleared bays shown as empty, nothing auto-assigned, who is Injured and that they cannot be assigned, the market |
| **Empty roster** | Lost every operative on an incomplete campaign | Cornered | The one way back (the market) and its real state, not a dead end |
| **Veteran squad near the gate** | Experience and research have raised max HP, so plating mass has risen | Optimizing | Which change moved mass past 340 / 380 / 400 kg, and what it costs in speed |

- **Voluntary**: yes between contracts. With a selected contract, Assembly is the required step before Deploy.
- **Time pressure**: none for the player. Strategic time runs on this Screen (`ScreenChrome` starts the world clock): injury recovery and the 24-hour candidate cadence advance while the player reads. Nothing is a real-time threat. The Recruitment Market's `NEXT IN ~nH` line changes while it is open (as built, the panel subscribes to world time).
- **Attention load**: low. One screen of state, no live systems except the header clock chip and the hire countdown.
- **Audio**: UI click on inspect, assign, unassign, pin, item, hire and Deploy through the audio event system (as built `act()` calls `uiClick`). No fanfare for hire, KIA or deploy (Roster Audio).
- **Journey phase**: not mapped (no `design/player-journey.md`). Arrivals above come from the GDD and code, not a journey map.

---

## Navigation Position

This screen lives at: [app boot] → Menu → World Network → (Brief →) **Assembly** (`phase = 'team'`). It is one of the four Screens, peer to World Network, Research and Brief through the shared nav (P-06). Its tab is never locked: `navTabGate` gates only Brief (`src/ui/navGates.ts`). Overlays on this screen: the Recruitment Market (a P-05 modal overlay for focus, trap, Escape and restore; its candidate-card body is not yet a library pattern, library gap, Open Question 21). Settings and Balance are reached from their own entry points, not from here.

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| Brief → ACCEPT CONTRACT | `goto('team')` | Selected contract (`missionId`), current squad and Item slots, live roster, Credits |
| Nav tab from World Network / Research / Brief | Click | Same; contract may be null (Deploy then refused) |
| Debrief → World Network → nav | Indirect | Squad with the dead and the newly injured removed and the dead's loadout deleted (`state/debrief.ts`); nothing auto-assigned; selected contract cleared |
| Menu → Continue | Indirect, via World Network | Squad and loadout restored from the blob (`save.ts` carries `app.squad` and `app.loadout`); the dossier focus is view state and is not saved |

| Exit Destination | Trigger | Notes |
|---|---|---|
| Mission | DEPLOY TEAM, only while `canDeploy` is ok (`startMission`) | Freezes the Roster slice (squad, worn blueprints, Item slots, mass and tier). Nothing edited later reaches the squad on the ground (ADR-0002, ADR-0005) |
| World Network / Research / Brief | Nav tab | Strategic clock keeps running on the destination Screen. Edits are kept; none is lost by leaving |
| Menu | Not built | Reached only by reload |

No exit is destructive. Hire is the only spend and is single-step (P-02). Escape closes the Recruitment Market while it is open and returns focus to the RECRUIT control (`useModalFocus`, `src/ui/modalFocus.ts`; focus probe, 2026-10-23). With the market closed Escape does nothing on this screen (the only Escape handlers in `src/` outside tests are `modalFocus.ts` and `Settings.tsx`; `pause` in `bindings.ts` is read by the Mission only; searched 2026-10-23).

---

## Layout Specification

### ASCII Wireframe

1280×720, text scale 100%, default campaign (8 / 8 on file, Raven Injured, default squad of four, contract selected). Figures are placeholders.

```
+----------------------------------------------------------------------------------------------------+
| ASSEMBLY                          [DATE TIME][CREDITS 000,000 CR][INFLUENCE 0][INTEL 1][ROSTER 8 / 8]|
| STRIKE TEAM 04  [SELECT UP TO FOUR OPERATIVES] [4 / 4 ASSIGNED]                                    |
+--------------------+---------------+---------------+---------------+---------------+--------------+
| ROSTER DATABASE    | 01      |||| | 02      |||| | 03      |||| | 04      |||| | 01 MARA / ASSAULT|
|        8 / 8 ON FILE|             |               |               |               | CONDITION: READY |
| [01 MARA   READY -]|   [figure]    |   [figure]    |   [figure]    |   [figure]    | D. TORRES        |
| [02 GHOST  READY -]|               |               |               |               | specialty line   |
| [03 DART   READY -]| MARA          | GHOST         | DART          | TORQ          | [HLTH][STAM][FOC]|
| [04 TORQ   READY -]| CONDITION READY| ...          | ...           | ...           | ROLE PROTOCOL    |
| [05 RAVEN INJURED+]| NEURAL 94%    |               |               |               |  ACT name + text |
| [06 SLATE  READY +]| ...           |               |               |               |  PSV name + text |
| [07 VEX    READY +]| - SELECTED -  |  (empty bay:  |               |               | AUGMENTATIONS x4 |
| [08 KESTREL READY+]|               |  EMPTY BAY //  |               |               |  [NEURAL STOCK..]|
| [RECRUIT + (8/8)]  |               |  AWAITING)    |               |               | LOADOUT | ITEM   |
| ROSTER SYNC  AGO   |               |               |               |               |  PRIMARY| SLOTS  |
+--------------------+---------------+---------------+---------------+---------------+  SECONDARY| [+][+]|
| [role: ASSAULT   ] [role: RECON    ] [role: INFILT.  ] [role: DEMOLI.]| DEPLOYMENT MASS | [DEPLOY   ]|
|  ACT / PSV names    ...                                               | 286.1 KG        |  [TEAM >> ]|
| (empty = EMPTY SLOT)                                                  | / 400.0 KG LIMIT| reason line|
|                                                                       | LIGHT LOAD //..|            |
+----------------------------------------------------------------------------------------------------+
| [WORLD NETWORK]        [RESEARCH]        [BRIEF]        [ASSEMBLY]                                 |
+----------------------------------------------------------------------------------------------------+
```

Recruitment Market (overlay over the whole screen, `position: absolute; inset: 0`): header `RECRUITMENT MARKET`, `ROSTER n / 8 // CREDITS n CR`, `CLOSE`; three candidate cards (portrait, codename, civilian name, role, `MAX HP`, `SPEED`, primary weapon, `COST n CR // CREDITS n CR`, `HIRE // n CR`, reason line); footer `ONE NEW CANDIDATE EVERY 24 WORLD HOURS // NEXT IN ~nH WORLD TIME`. The overlay is `role="dialog"` `aria-modal="true"` named `RECRUITMENT MARKET`; its dimmed backdrop covers the whole screen. Its layout, text and targets are **not captured by the sweep** (the sweep reads the default state with the market closed; Open Question 14). The focus probe covers its focus behavior only.

### Layout Zones

**Arrangements considered** (autonomous mode picked the recommendation; none was approved by the owner):

| Option | Description | For | Against |
|---|---|---|---|
| **A: Roster / four bays / dossier, with a deploy strip below (chosen)** | Shipped grid | Matches the GDD's "inspect and assign are separate": the list is where you read and assign, the bays are where the squad is, the strip is where the gate is. Mass and Deploy sit beside the squad they judge | Right column overflows at every scale (see below); a full roster of eight overflows the left list at 100% and up |
| B: Two panes, squad strip on top, roster and dossier below | Squad is one row of cards | More list room | Loses the four large "glass bays" the GDD and Visual section call for; bay figures shrink |
| C: Dossier as a modal over a roster list | Inspect opens a modal | Max room | Inspect-then-assign becomes modal juggling; fails Command pillar's low-friction swap |

**Chosen zones (A)**, from the shipped CSS and the 1280×720 captures (`production/qa/evidence/screens-2026-10-23/team-*.png`; sizes read off the images are marked approx.):

| Zone | Size at 1280×720, 100% | Contents | Why here |
|---|---|---|---|
| **Header** | full width, approx. 70 px; at 125% wraps to two rows (approx. +34 px) | Title `ASSEMBLY`, `STRIKE TEAM 04`, two chips (`SELECT UP TO FOUR OPERATIVES`, `n / 4 ASSIGNED`), then right: clock chip, Credits, Influence, Intel, Roster | Shared four-Screen header |
| **Left: ROSTER DATABASE** | `clamp(228px × scale, 19vw, 300px × scale)`, 243 px at 100% (measured 15 → 259 in the capture) | Eight rows (index, codename, role, status word, `+`/`−` key), RECRUIT button, `ROSTER SYNC` line, scroll box | The list is where inspection and assignment start |
| **Center: four bays** | remainder, approx. 165 px each | Per bay: slot number, figure, codename, CONDITION word, four readings, `- SELECTED -` tag; or `EMPTY BAY` | The squad is the object of the screen; the figures are the player's anchor |
| **Right: dossier** | `clamp(278px × scale, 23vw, 350px × scale)`, 294 px at 100% | Identity, four stat tiles, ROLE PROTOCOL, AUGMENTATIONS, LOADOUT, ITEM SLOTS, scroll box | Reading and editing the one focused operative |
| **Bottom strip** | full width, approx. 111 px at 100%, approx. 138 px at 125% | Four role cells (or `EMPTY SLOT`), DEPLOYMENT MASS box (190–250 px), DEPLOY column (240–320 px) | Mass, tier and the gate sit next to the button they govern |
| **Nav** | full width, approx. 34 px high | P-06 tabs | Shared chrome |
| **Overlay** | whole screen | Recruitment Market, up to 880 px wide | Hire is a side errand, not a fifth zone |

**Layout facts measured or read off captures (2026-10-23, after IF-037)**: the sweep's clip check (`sweep-team.json`, `clips`, empty at 90 / 100 / 110 / 125%) reports no clipped, truncated (no `text-overflow: ellipsis` remains in `src/ui/ui.css`), spilled or sideways-scrolled text, no visible text line drawn over another, and no overlapping panels, in the default state with the market closed. The right dossier column **overflows and scrolls at all four scales** (scrolled state visible in the 90, 110, 125 and high-contrast captures; at 100% LEGS, LOADOUT and ITEM SLOTS lie below the fold unscrolled). The left roster list overflows at 100% and up: the RECRUIT button sits under the scroll fade at 100%, 110% and 125%. At 125% the header and strip grow and the three-column row loses approx. 63 px of height (455 → 392, from the captures). The CSS comment "everything here is sized to clear the fold at 1280x720" is not true at 100% (Open Question 10).

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks (its Gaps list names "Assembly bays and dossier" and "candidate market").

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Header | Resource chips | Readouts | Clock `date time`, `CREDITS n CR` (amber), `INFLUENCE n`, `INTEL n`, `ROSTER n / 8` | No | P-14. The clock chip is not P-20: Assembly has no Pause or speed control (Open Question 6) |
| Header | Squad count chips | Readouts | `SELECT UP TO FOUR OPERATIVES`, `n / 4 ASSIGNED` | No | P-14 |
| Left | Roster row, body | Button | Index `01`–`08`, codename, role, `READY` / `INJURED` | Yes: inspect | P-04 (inspect marker and assigned frame), P-15 (list) |
| Left | Assign / unassign key | Button | `+` or `−`; disabled for Injured, full squad, or last assigned | Yes: edits squad | P-03 (reason is `title` only, Open Question 3), P-04 |
| Left | RECRUIT button | Button | `RECRUIT + (n/8)` | Yes: opens market | Standard secondary button |
| Left | ROSTER SYNC line | Decorative | `ROSTER SYNC` `00:12:44 AGO` is a hard-coded literal | No | none (Open Question 1) |
| Center | Filled bay | Button | Slot number, figure, codename, `CONDITION` word, four hash-derived readings, `- SELECTED -` when inspected | Yes: inspect | **New: Assembly bay**; P-04 |
| Center | Empty bay | Static | Number, `EMPTY BAY`, `AWAITING ASSIGNMENT` | No | **New**; not P-09 (the library says an empty bay is not a squad card) |
| Right | Dossier head | Title + readout | `nn MARA / ASSAULT`, `CONDITION: READY` | No | P-14 |
| Right | Identity block | Readout | Portrait, civilian name, specialty line | No | P-14 |
| Right | Stat tiles ×4 | Readouts | **Spec**: max HP and speed as numbers including worn research and Experience, plus Experience as a number (GDD). **As built**: `HLTH`, `STAMINA`, `FOCUS`, `MOBILITY` as derived percentages (as-built delta, Open Question 1) | No | P-14 |
| Right | ROLE PROTOCOL | Readout ×2 | `ACT` and `PSV`: name and description | No | P-14 |
| Right | Augmentation rows ×4 | Button each | Bay name, worn project or `STOCK ISSUE`, effect line or `NO PROJECT RESEARCHED` / `PINNED EMPTY`, `PIN` / `AUTO` chip; the name and effect lines wrap (no ellipsis) | Yes: cycles the pin; disabled when nothing is researched for that bay | **New: bay cycle** (library gap, Open Question 21); P-03 |
| Right | LOADOUT | Readout ×2 | `PRIMARY n/120`, `SECONDARY n/48`, silhouette, weapon name | No | P-14 |
| Right | Item slots ×2 | Button each | `MED KIT 8.0 KG`, `POWER CELL 6.0 KG` or `EMPTY SLOT 0.0 KG`; header `MED 8KG / CELL 6KG`; line `CARRIED: n KG`; hint `CLICK A SLOT TO CYCLE: EMPTY > MED KIT > POWER CELL` (IF-039: playtests 2 and 3 found the cycle by trial) | Yes: cycles empty → med kit → power cell | **New: slot cycle** |
| Bottom | Role cells ×4 | Readout | Role label, active name, passive name (names wrap, no ellipsis); or `EMPTY SLOT` | No | P-14 |
| Bottom | DEPLOYMENT MASS | Readout | Value in kg (one decimal), `/ 400.0 KG LIMIT`, segmented bar, tier sentence | No | P-14; bar never the sole carrier |
| Bottom | DEPLOY TEAM | Primary button + reason line | `DEPLOY TEAM >>`; below it `<CODENAME> // A WIN SPENDS n DAYS OF WORLD TIME` (the selected contract; IF-039, 2026-10-23), `CONFIRM AND DEPLOY STRIKE TEAM 04` only with no contract, or the refusal sentence | Yes, when enabled | Standard primary button; P-03 |
| Overlay | Recruitment Market | Modal overlay | Three candidate cards, `CLOSE`, 24-hour footer. `role="dialog"`, `aria-modal="true"`; focus enters on the first enabled control (as measured, `CLOSE`), Tab and Shift+Tab wrap inside, Escape closes, focus returns to the RECRUIT control that opened it | Yes | **P-05** for focus, trap, Escape and restore (as built, `useModalFocus`); **New: candidate market** for the card body (library gap, Open Question 21); P-02 (hire), P-03 (refusal) |
| Overlay | HIRE | Button | `HIRE // n CR`, amber (spend) | Yes | P-02, P-03 |
| Nav | Four-Screen tabs | Tab bar | Assembly selected | Yes | P-06 |

### Information Hierarchy

Ranked by what the player needs first when the screen opens with a contract selected.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | DEPLOY state and its reason | Always | Enabled, or disabled with a visible sentence beside it (P-03). The first failing check names it (order: no contract, none assigned, not Ready, over mass) |
| 2 | Who is assigned: the four bays | Always | Empty bays read as legal, not failed |
| 3 | Deployment mass, limit, tier with speed delta | Always | Words carry the tier (`LIGHT LOAD // +0.15 M/S`, `STANDARD LOAD`, `HEAVY LOAD // -0.15 M/S`). Overage is named in kg when over |
| 4 | Roster list with Ready / Injured | Always | Injured is the word plus the dashed disabled key; red wash reinforces |
| 5 | Focused dossier: identity, role kit | Always | Kit answers the playtest's "what are abilities" |
| 6 | Wear / pin and Item slots | Always, scroll | Below the fold at 100% (Open Question 10) |
| 7 | Header resources | Always | Credits matter only to hire |
| 8 | Recruitment Market | On request | Hire is the only spend; refusal reasons are words |

**Discoverable, not up front**: how the bay cycle works (AUTO → each completed project → STOCK), what an Item does, the 24-hour cadence.

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Default** | Arrival with a contract, default squad | Four bays filled, `4 / 4 ASSIGNED`, mass 286.1 KG, `LIGHT LOAD // +0.15 M/S`, DEPLOY enabled with `<CODENAME> // A WIN SPENDS n DAYS OF WORLD TIME` (IF-039; the 2026-10-23 measurement predates it and showed `CONFIRM AND DEPLOY STRIKE TEAM 04`) |
| **Assigned 4** | Four assigned | All unassigned `+` keys disabled (squad full). To bring in Slate the player must first unassign someone (Open Question 3) |
| **Assigned 2–3** | Unassign | Empty bays print `EMPTY BAY` / `AWAITING ASSIGNMENT`; the footer shows `EMPTY SLOT` cells; the later bays renumber upward (assignment is an ordered list) |
| **Assigned 1** | One left | That operative's `−` is disabled (the last assigned cannot be removed while editing, Roster Core Rule 3); reason is `title` only |
| **Assigned 0** | After KIA or injury cleared every bay | Four empty bays, four `EMPTY SLOT` cells, mass `0.0 KG`, DEPLOY refused `NO OPERATIVES ASSIGNED`. As built the tier line reads `LIGHT LOAD // +0.15 M/S` at 0.0 kg (`massTier(0)` is light), which is misleading (Open Question 7) |
| **Operative Ready** | Status | Word `READY` (teal) |
| **Operative Injured** | Debrief injury, or Raven's opening injury | Row wash, word `INJURED` (Red Hot), dashed disabled `+`. Dossier opens (inspection is allowed, Roster AC 23). Remaining downtime is **not printed** (Open Question 2) |
| **Injured operative assigned** | Not reachable through Assembly (state drift only) | DEPLOY refused `INJURED OPERATIVE ASSIGNED`; label `REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT` |
| **Inspected (focused) operative** | Click a row or bay | `focus` row marker, `- SELECTED -` on the bay (only if assigned), dossier swaps in the same frame. Not assigned. A focused unassigned operative has no bay marker and shows `--` as the slot number in the dossier head |
| **Augmentation bay: stock** | No project researched for that bay | Row reads `STOCK ISSUE` / `NO PROJECT RESEARCHED`, dashed, disabled, no chip |
| **Augmentation bay: researched** | At least one completed project in that bay | Row enabled; shows the worn project and effect line and a chip `AUTO` (current issue) or `PIN`. A click cycles AUTO → each completed project → `STOCK ISSUE` → AUTO |
| **Item slot empty / med kit / power cell** | Click cycles | `EMPTY SLOT 0.0 KG`, `MED KIT 8.0 KG`, `POWER CELL 6.0 KG`; header and footer mass update in the same frame. Slots belong to the inspected operative and count toward mass only while that operative is assigned |
| **Mass: light** | `mass ≤ 340` kg | `LIGHT LOAD // +0.15 M/S` (teal) |
| **Mass: standard** | `340 < mass ≤ 380` | `STANDARD LOAD` (Ink). No speed delta |
| **Mass: heavy** | `380 < mass ≤ 400` | `HEAVY LOAD // -0.15 M/S` (red as built). Deploy still enabled. The one-time hint `HEAVY LOADOUT` fires in the Mission on a valid heavy deployment, not here (Interface advisory rule; `world.ts`, `tutorial.ts`) |
| **Mass: over the limit** | `mass > 400` | Mass number red, bar red, DEPLOY disabled, sub-line `OFFLOAD n.n KG BEFORE DEPLOYMENT`, accessible name `DEPLOY TEAM // n.n KG OVER THE MASS LIMIT`. Exactly 400 kg is allowed |
| **Deploy: enabled** | Contract selected, 1–4 assigned, all Ready, mass ≤ 400 | `DEPLOY STRIKE TEAM 04`, sub-line `<CODENAME> // A WIN SPENDS n DAYS OF WORLD TIME` |
| **Deploy: refused, no contract** | `missionId` null | Sub-line `SELECT A CONTRACT ON THE WORLD NETWORK`; Brief tab also locked |
| **Deploy: refused, none assigned** | 0 assigned | `ASSIGN AT LEAST ONE READY OPERATIVE` |
| **Deploy: refused, not Ready** | Injured assigned | `REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT` |
| **Loading** | Screen enter | None. Every datum is already in memory (stores); nothing is fetched, so no loading state exists and none is needed |
| **Save write failure** | Persistence reports a failed autosave | The app-level P-11 notice `SAVE FAILED // CAMPAIGN NOT FILED` (`WriteFailureNotice`, mounted by `App.tsx` on all four Screens, `role="status"`, persistent, cleared by the next successful write) shows over this Screen. Assembly adds no copy of its own. Where it sits over the Assembly layout is not measured (Open Question 14) |
| **Recruitment Market: open** | RECRUIT (or `RECRUIT >>` on an empty roster) | Overlay with up to three cards; dimmed backdrop over the whole screen. Focus moves into the dialog (first enabled control; at 8 / 8 every HIRE is disabled, so `CLOSE` is the only stop and Tab cycles on it, by the code read: `STOPS` excludes disabled buttons). Tab and Shift+Tab wrap inside; Escape or `CLOSE` closes it and focus returns to the opener. Footer `NEXT IN ~nH WORLD TIME` |
| **Hire enabled** | Not failed, roster < 8, Credits ≥ cost | `HIRE // n CR` enabled (amber), reason slot reserved and blank |
| **Hire refused: campaign failed** | Failed flag | `CAMPAIGN FAILED // NO HIRES` |
| **Hire refused: roster full** | 8 / 8 (the default campaign opens here) | `ROSTER AT CAPACITY // 8 / 8` |
| **Hire refused: Credits** | Credits < cost | `INSUFFICIENT CREDITS // n CR SHORT`. Precedence as built: failed, then full, then Credits. Cost against Credits always prints as `COST n CR // CREDITS n CR` |
| **After a hire** | HIRE succeeds | Credits debit by the cost, a Ready operative with all bays on current issue joins the roster unassigned, the candidate leaves the market (count may drop below 3; backfill waits for the next 24-hour due, Roster OQ 2) |
| **Market empty** | No candidates | `NO CANDIDATES ON FILE`; `CLOSE` and Escape still work |
| **Empty roster** | Zero living operatives | Screen reduces to `ROSTER EMPTY`, `RECRUIT REPLACEMENTS TO REBUILD STRIKE TEAM 04`, a `RECRUIT >>` button; subtitle chip `NO OPERATIVES ON FILE`; nav stays. On an incomplete campaign this is also the failed state, where every hire is refused (Open Question 12) |
| **Campaign complete, roster wiped** | Complete, then zero living | Stays complete, not failed; hire is allowed |
| **Text scale 90 / 100 / 110 / 125%** | Settings | No clipping, truncation or text-over-text at 1280×720 in the default state (sweep); side columns widen (roster 243 → 285 px, dossier 294 → 347 px at 125%, from the captures); header and strip wrap and grow; lists scroll; augmentation, role-cell and tier text wrap (`overflow-wrap: break-word`, no ellipsis). The market at these scales is not measured (Open Question 14) |
| **High contrast / reduced motion** | Settings | CSS-variable remap only. This screen has no keyframe animation (no `animation` rule inside the `.ts-*` block, checked 2026-10-23), and the market overlay `.ts-recruit-overlay` carries none, so it prints in one frame at any setting and reduced motion removes nothing. (The `fade-in` that reduced motion stops is on `.hud-menu-wrap`, the Settings / Pause / Balance backdrop, `src/ui/ui.css`; the focus probe's reduced-motion check reads that element, not the market.) |
| **Window below 1280×720** | Resize | Minimum layout is kept and the page scrolls; panels do not compress |

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` platform). Gamepad: **None**; touch: **None** (ADR-0017). Pointer, Enter and Space activate every button. Focus is the P-04 corner brackets (global `button:focus-visible` rule, `src/index.css`; the bay restates it, `src/ui/ui.css`). **No key binding is invented here**; full keyboard travel across panels is Backlog. Hover is not a state per the art bible; as built, hover styles exist (Open Question 5).

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| Roster row body | Inspect | Click; Enter/Space | Inspect marker moves, dossier swaps in the same frame; click sound | View state only (`focusId`). **Does not assign** (AC 5) |
| `+` key | Assign a Ready operative | Click; Enter/Space | Next empty bay fills, row gets the assigned frame and `−`, mass, tier and gate update in the same frame | `toggleOperative(id)`. Refused (disabled) for Injured, squad of four |
| `−` key | Unassign | Click; Enter/Space | Bay empties, later bays renumber, mass updates | `toggleOperative(id)`. Refused (disabled) for the last assigned |
| Filled bay | Inspect | Click; Enter/Space | Same as a row body | View state |
| Empty bay | None | — | Not a control | — |
| Augmentation row | Cycle the wear / pin | Click; Enter/Space | Worn name and `AUTO` / `PIN` chip change, effect line changes, mass changes if max HP changes | `setBay(opId, slot, pin)`. Disabled when no project is completed for that bay |
| Item slot | Cycle empty → med kit → power cell → empty | Click; Enter/Space | Slot face, `CARRIED` line, DEPLOYMENT MASS and tier update in the same frame | `setLoadout(opId, slot, item)` |
| RECRUIT | Open the market | Click; Enter/Space | Overlay prints in one frame; focus moves into the dialog | View state (`recruitOpen`). The opener is remembered for restore |
| Tab / Shift+Tab (market open) | Move inside the market | Tab; Shift+Tab | Focus wraps from the last enabled control to the first and back; it never reaches the screen behind | `useModalFocus` trap (P-05) |
| HIRE | Sign a candidate | Click; Enter/Space | Credits debit, roster count and header chip update, card leaves | `hireOperative(id)`. Single step, no confirm, no undo (P-02). Refusal disables the button, so the click cannot occur |
| CLOSE, Escape | Close the market | Click; Enter/Space; Esc | Overlay leaves in one frame; focus returns to the RECRUIT control that opened it | View state. Escape is consumed by the market (`preventDefault`, `stopPropagation`) and never confirms or discards a hire. Verified in headless Chrome by keyboard activation of the opener (focus probe, 2026-10-23) |
| DEPLOY TEAM | Start the mission | Click; Enter/Space | Phase changes in one frame | `startMission()`, a no-op unless `canDeploy` is ok (ADR-0019). Disabled with the reason beside it otherwise |
| Roster list, dossier column | Scroll overflow | Wheel; drag scrollbar | Fade shows while content lies below | P-15. Keyboard scrolling of panels is Backlog |
| Nav tab Research / World Network | Go | Click | Click sound | `goto(phase)` |
| Nav tab Brief | Go, or locked | Click when a contract is selected | Locked tab shows lock glyph, `LOCKED`, `NO CONTRACT SELECTED` as text | `goto('brief')` |
| Escape, market closed | — | Esc | None on this screen | Not consumed; nothing is dismissed or confirmed |

Order of bays is the order of assignment: assigning appends; unassigning removes and shifts the rest up (code: `squad.filter`). The player cannot reorder the bays directly (inference: no control exists in the code read).

**Spec-vs-built discrepancies are listed once, under Open Questions.**

---

## Data Requirements

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Operatives, codename, role, civilian name, bio, base HP and speed, weapons | Roster (`campaignStore.operatives`) | Read | Authored in `src/game/data.ts`; candidates from `src/game/recruits.ts` |
| Status Ready / Injured, `recoverAtT`, Experience, pins | Roster (`campaignStore.roster`) | Read; Write via `setBay` | UI never edits status |
| Assigned squad (ordered ids) | `appStore.squad` | Read; Write via `toggleOperative` | Edit constraints (Ready only, ≤4, keep ≥1) live in the store |
| Item slots per operative | `appStore.loadout` | Read; Write via `setLoadout` | Saved in the blob (`save.ts`) |
| Completed projects, current issue, worn project, effects | Research (`researchStore.done`, `wornAugs`, `completedInBay`, `currentIssue`) | Read | Research owns identity; Assembly wears and pins |
| Deployment mass, tier, tier speed delta | Roster (`src/game/mass.ts`, `assignedMassKg`) | Read | UI never recomputes the formula; it calls the owner |
| Deploy gate: ok, reason, `overKg` | Roster (`src/game/deployGate.ts` `canDeploy`) | Read | Presentation only (`src/ui/deployRefusal.ts`) |
| Selected contract | `appStore.missionId` | Read | Null refuses Deploy |
| Candidates, cost, `nextCandidateT` | Roster (`campaignStore.candidates`) | Read; Write via `hireOperative` | Cost is the owner-listed fee (16,000–34,000 CR, Roster) |
| Credits | Economy (`appStore.credits`) | Read | Hire debits; never overdraws (ADR-0013) |
| Campaign failed flag | `campaignStore.campaignFailed` | Read | Hire refusal |
| Strategic `t` | World Network (`worldStore.t`) | Read | Header clock chip; hours to next candidate |
| Text scale, contrast, motion | Settings | Read | CSS variables |

UI-owned view state (not game state, not saved): the inspected operative (`focusId`) and whether the market is open (`recruitOpen`). **UI owns no game state.**

**Update triggers and missing values.** "Missing" means the owner supplied nothing; the UI should never fabricate a value (P-14).

| Data | Updates when | If missing |
|---|---|---|
| Squad, bays, mass, tier, gate | Assign, unassign, pin, Item slot, research completion, debrief | Mass is a sum over the assigned; with none assigned it is 0.0 and DEPLOY says why |
| Status | Debrief; strategic tick when `t ≥ recoverAtT` | As built the UI prints `INJURED` when a status is missing (`?? 'INJURED'`). Spec: dim em dash (P-14). Open Question 7 |
| Worn project / effect | Research completion (unpinned bays), pin | `STOCK ISSUE` with `NO PROJECT RESEARCHED` |
| Candidates | Hire, 24-hour due on the strategic clock | `NO CANDIDATES ON FILE` |
| Hours to next candidate | Strategic tick | Shows at least `~1H` |
| Credits, roster count, header | Hire, debrief, tax, spends | Owner always supplies |
| Selected contract | Brief select, debrief clears | `SELECT A CONTRACT ON THE WORLD NETWORK` |

Real-time: `t` advances at up to 20 Hz. The header clock chip subscribes on its own, so a tick re-renders one chip (code comment, `Nav.tsx`). Per-frame data stays out of React state (CLAUDE.md guardrail).

---

## Events Fired

Deliberate: Assembly fires **no analytics events**. Telemetry is local, opt-in and written at the Debrief boundary (`src/state/telemetry.ts`, ADR-0015); nothing here calls it. The table lists state changes.

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| Inspect | none (view state `focusId`) | Operative id |
| Assign / unassign | State change (**persistent** on the next autosave): `appStore.squad` | Operative id |
| Pin / unpin a bay | State change (**persistent**): `campaignStore.roster[id].pins` | Operative id, bay, pin |
| Item slot | State change (**persistent**): `appStore.loadout` | Operative id, slot, item |
| Hire | State change (**persistent**): roster, candidates, Credits | Candidate id, cost. Owners: Roster and Economy |
| Open / close market | none (view state) | — |
| Deploy | State change: `phase = 'mission'` after the freeze (ADR-0009) | Squad, wear, Item slots, mass, tier |
| Nav tab | State change: `phase` | Destination |
| Any activation | UI click through the audio event system | `uiClick` |

Architecture flags: no direct audio calls and no storage access from the UI. The sampled-at-deploy freeze means nothing here can change a squad on the ground.

---

## Transitions & Animations

Law (art bible §7.4): the terminal prints, scans, ticks and blinks; nothing bounces, slides or glows. Nothing exceeds 500 ms except a tick tracking a real value.

| Moment | Spec | Reduced motion |
|---|---|---|
| **Screen enter** | Panels present from the first frame. No print on the roster, bays or dossier (the clock runs; a reading must not be delayed). No Scan sweep (that belongs to the World Network and dossier cards; not specified here) | Same |
| **Screen exit** | Cut | Same |
| **Inspect** | Dossier swaps in one frame; border and background ink-step ≤150 ms (as built `transition 0.12s`) | Same |
| **Assign / unassign** | Bay fills or empties in one frame; mass, tier and gate update in the same frame. No travel, no fade | Same |
| **Pin / Item slot** | Face swaps in one frame; mass ticks as a discrete value | Static figure |
| **Mass over limit** | Red number, red bar and refusal sentence appear in one frame, final state first | Same |
| **Market open / close** | Prints and leaves in one frame (no animation on `.ts-recruit-overlay`, checked 2026-10-23); focus moves in on open and back to the opener on close | Same |
| **Hire** | Credits and roster chip change in one frame; no fanfare | Same |
| **Idle loops** | None as built, which is inside the "at most one idle motion on Assembly" budget (library Animation Standards). Spec: none | None |

---

## Input Method Completeness Checklist

Platform Target is keyboard and mouse. Gamepad and touch are out of scope (ADR-0017, `project.yaml`), so those blocks are dropped. An item is ticked only when the Interaction Map specifies it.

**Keyboard**
- [x] Every action activates with Enter and Space: roster rows and keys, bays, augmentation rows, Item slots, RECRUIT, HIRE, CLOSE, DEPLOY, nav tabs.
- [x] Tab order is specified in Accessibility → Focus order (measured against the running build 2026-10-23).
- [x] Focus is visible on every control: P-04 corner brackets, including in high contrast.
- [x] Esc behavior: closes the market and returns focus to RECRUIT (P-05, Escape section: top overlay only; never confirms a hire); with the market closed Esc does nothing (Interaction Map).
- [x] Focus trap and restore: the market traps Tab / Shift+Tab and restores focus to its opener (P-05; as built `useModalFocus`; focus probe 2026-10-23). The screen itself has no trap.
- [ ] Reordering bays has no keyboard or pointer control (by design as built; recorded as Open Question 13, not a defect).

**Mouse**
- [x] Every action is a single click.
- [x] No information appears only on hover. **Counter-case**: the reasons for the disabled `+` and `−` keys are `title` text only (Open Question 3).
- [x] No right-click, double-click or drag is required.
- [x] Hit targets, Screen in its default state: every counted target is at least **24×24 CSS px** (WCAG 2.2 SC 2.5.8, owner 2026-10-23, see `world-network.md` Open Question 21). The sweep counted 32 targets and reports none under 24 in width or height (`targets <24: 0`, `sweep-output.txt`).
- [ ] Hit targets, Recruitment Market (HIRE, CLOSE): **not measured**; the sweep reads the market closed. Recorded as Open Question 14; Acceptance Criteria carry the check.

| Target (1280×720, 100%) | Size | Meets 24×24? |
|---|---|---|
| Roster row body | approx. 195×41 (image) | Yes |
| Assign / unassign key | 26 wide (CSS, sweep) × approx. 41 | Yes (26 px is the narrowest) |
| RECRUIT button | 222 wide (sweep) × at least 34 (CSS padding 10 + 10 + one line, inferred) | Yes |
| Filled bay | approx. 165×455 (image) | Yes |
| Augmentation row | 272 wide (sweep) × approx. 34 (CSS, inferred) | Yes |
| Item slot | approx. 66×66 (image) | Yes |
| DEPLOY TEAM | approx. 280×78 (image) | Yes |
| Nav tab | approx. 307×34 (image) | Yes |
| HIRE, CLOSE (market) | **Not measured** (market closed in the sweep) | Unverified (Open Question 14) |

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). No Backlog row is promoted.

| Committed row | How Assembly satisfies it |
|---|---|
| Critical state never by color alone | Assigned: double frame **and** the `−` glyph vs `+`. Inspected: marker bar and `- SELECTED -` text. Injured: word `INJURED`, dashed disabled key, red wash only reinforces. Mass tier: the sentence (`LIGHT LOAD`, `STANDARD LOAD`, `HEAVY LOAD`). Over limit: red number **plus** `OFFLOAD n.n KG` and the disabled button. PIN vs AUTO: chip text. Empty bay: `EMPTY BAY`. Hire refusal: reason sentence. Clock: date and time text |
| Text legible at 1280×720 | Measured 2026-10-23 after IF-037 (`sweep-output.txt`, `## team`), default state, market closed: 224 text runs, 0 under 10 px, 0 under 4.5:1 in default and in high contrast, 0 Ink Dim or Ink Faint text, 0 clip / truncation / spill / visible text-over-text at 90 / 100 / 110 / 125%. Readouts at 12 px or larger as the library requires: not all (bay readings are 10–11 px; the spec accepts them as tertiary labels, 11 px values). Wrapping cases are in Localization. **Not measured**: the market and the non-default states (Open Question 14) |
| Text scale 90 / 100 / 110 / 125% | Side columns widen with scale; overflow scrolls (P-15); header, strip and sentences wrap. No `text-overflow: ellipsis` remains in `src/ui/ui.css`: augmentation, role-cell and tier text wrap (IF-037). The stat tiles sit 2 by 2 (BUG-0011, 2026-10-25): every tile label (`HLTH`, `STAMINA`, `FOCUS`, `MOBILITY`) is one line at all four scales, default and high contrast (measured: `MOBILITY` 46.2 / 51.4 / 56.5 / 64.2 px in a 119 / 119 / 125 / 146 px tile), and the dossier list still scrolls (Open Question 15, Closed) |
| High-contrast mode | CSS-variable remap; brackets, frames and words survive (capture `team-hc.png`); 0 runs under 4.5:1 in high contrast (sweep) |
| Full keyboard operability of the committed set | Enter/Space on every button; Tab reaches every enabled control (below). Overlay focus trap and restore (Interface AC 19, P-05): the Recruitment Market takes focus, traps Tab, closes on Escape and restores focus to RECRUIT (focus probe, 4 checks PASS) |
| Contextual accessible labels | Rows `READ THE DOSSIER ON <CODENAME> // <ROLE> // <STATUS>`; keys `ASSIGN|UNASSIGN <CODENAME> // STRIKE TEAM 04`; bays `BAY nn // <CODENAME> // READ THE DOSSIER`; augmentation `BAY <SLOT> // <WORN> // PINNED|CURRENT ISSUE`; Item slot `ITEM SLOT n // <ITEM|EMPTY> // CYCLE`; DEPLOY `DEPLOY STRIKE TEAM 04` or `DEPLOY TEAM // <reason>`; RECRUIT `OPEN THE RECRUITMENT MARKET // ROSTER n OF 8`; HIRE `HIRE <CODENAME> // n CR` plus ` // <reason>`; CLOSE `CLOSE THE RECRUITMENT MARKET`; market `role="dialog"` `aria-modal="true"` named `RECRUITMENT MARKET` |
| Two-step destructive confirms | None occur: nothing here is irreversible except the hire spend, which is single-step by library decision (P-02) |
| One-shot advisories, bounded | None on this screen. The heavy-tier hint fires in the Mission |
| Reduced motion | Nothing on this screen animates, the market overlay included (it has no fade), so nothing needs a fallback |
| Consistent one-OS chrome | Shared header and nav; same ink and glyph grammar |

### Focus order

Measured Tab order on the running build, 2026-10-23, default state (`sweep-team.json`, `tab`; the sweep truncates names at 50 characters, which is the harness, not the app). No control takes initial focus.

1. **Roster**: for each of Mara, Ghost, Dart, Torq: the row body then its `UNASSIGN` key; then the row bodies of Raven, Slate, Vex, Kestrel (their `+` keys are disabled and are not tab stops, so reasons that live only in `title` are unreachable by keyboard); then `OPEN THE RECRUITMENT MARKET`.
2. **Bays**: `BAY 01` to `BAY 04` (empty bays are not stops).
3. **Dossier**: augmentation rows when enabled (not stops in the measured state, nothing researched), then `ITEM SLOT 1`, `ITEM SLOT 2`.
4. **DEPLOY**: a stop only while enabled (disabled buttons drop out).
5. **Nav**: World Network, Research, Brief (a locked Brief stays a stop with its `LOCKED // NO CONTRACT SELECTED` name), Assembly.
6. **Market** (measured by the focus probe, `focus-output.txt`, 2026-10-23): on open, focus lands inside the dialog on `CLOSE THE RECRUITMENT MARKET` (the first enabled control in DOM order); after 12 Tab presses focus is still inside; Escape closes the dialog; focus returns to `OPEN THE RECRUITMENT MARKET // ROSTER 8 OF 8`. Order inside: `CLOSE`, then each enabled HIRE left to right (by the code read; disabled HIRE buttons are not stops, so at 8 / 8 `CLOSE` is the only stop). Not probed: the `RECRUIT >>` opener on the empty-roster screen (same component), and restore after a mouse click in browsers that do not focus a clicked button.

Shift+Tab reverses.

### Contrast

Requirement (art bible §7.5): body and readout text ≥4.5:1 composited on the panel; Ink Dim only at ≥18.66 px bold or ≥24 px; Ink Faint never carries text; semantic red text uses Red Hot. Floor specified: 4.5:1 for every text run, default and high contrast. Measured on the default state (latest sweep, after IF-037): 0 runs under 4.5:1 in either mode, 0 Ink Dim, 0 Ink Faint; the sweep records pass/fail against the floor, not each run's ratio. **Not measured**, because the sweep did not reach them: the over-limit state (`.ts-mass-num b.red` and `.ts-mass-tier.heavy` use `--red`, not `--red-hot`, so the 10 px heavy line is a risk against the art-bible rule), refused-Deploy sentences, `PIN` / `AUTO` chips with a project researched, filled Item slots, and the whole Recruitment Market (Open Question 14).

### Screen-reader notes

- Bay figures are `role="img"` labelled `OPERATIVE <CODENAME>`; inside a bay button the button's own label wins (inference, not tested with assistive tech).
- Mass, tier and the Deploy sentence are **not live regions**. A change that disables DEPLOY is conveyed only by the button's name. Spec: leave as is for Standard tier (P-11 is the immediate channel and nothing here is urgent); flagged in Open Question 3.
- The market is `aria-modal="true"`, which declares the screen behind it inert to assistive tech (not tested with assistive tech); keyboard focus is held inside by the trap. Market refusal reasons carry `role="status"` and are linked with `aria-describedby` (code); the cost line is plain text.
- The app-level save-failure notice is a persistent `role="status"` region (`WriteFailureNotice`).
- Fiction and decoration (`ROSTER SYNC`, barcodes, glyphs) are `aria-hidden` or text-only; the glyph SVGs are `aria-hidden`.

---

## Localization Considerations

Scope: English only. No localization system exists; every string is a literal in `src/ui/index.tsx`, `src/ui/deployRefusal.ts`, `src/ui/assemblyRows.ts`, `src/game/data.ts` and `src/game/abilities.ts` (same finding as `world-network.md` Open Question 13). The test is 40% expansion. Rule: expanded text wraps or scrolls; it never clips or truncates (Interface Rule 6).

**How the limits were derived.** Box widths are `textBoxes[].w` from `sweep-team.json` (1280×720, 100%) where the element is width-constrained by its container (grid and block boxes: roster name and role, augmentation lines, dossier identity, stat tiles, mass box, deploy column). Content-sized boxes (the panel title, the role-cell text, chips) give the per-character advance instead. Assumption: **advance = 0.6 em monospace + the element's CSS letter-spacing**. Checks against content-sized boxes: 13 characters in 85 px at 10 px (6.5 px per character, about the brief's 0.62–0.65 em) and 17 characters in 136 px at 10 px with 0.2 em tracking (8.0 px per character). Tracked labels therefore run 0.7–0.8 em, not 0.62; limits below use the tracking of each rule. Limits are characters per line at 100% and 125%; 125% boxes for side columns are estimated from the 125% capture (roster ≈137 px name column, dossier ≈223 px augmentation column); fixed-pixel columns (bays aside) are unchanged.

| Element | Box (100%) | Size | Max chars / line (100% / 125%) | Longest English | Risk at +40% |
|---|---|---|---|---|---|
| Roster role | 104 px (90 when Injured) | 10 px, 0.1 em | 14 / 15 | `TECH SPECIALIST` (15) | **HIGH**. Wraps in English at 100% (seen in `team-100.png`); +40% is about 21 |
| Roster name | 104 px | 12 px, 0.16 em | 11 / 12 | `KESTREL` (7) | Proper noun, not translated |
| Roster panel head | title 120 + right 104 in about 227 px | 10 px, 0.2 em | one line holds about 28 | `ROSTER DATABASE` + `8 / 8 ON FILE` (28) | **HIGH**. Wraps to two lines at 100% as built; fits at 90% |
| Dossier head | title 136 (17 chars) + right 126 in about 275 px | 10 px, 0.2 em | about 34 combined | `01 SLATE / TECH SPECIALIST` + `CONDITION: READY` (42) | **HIGH**. Over the limit in English (inferred; only Mara was captured) |
| Stat tile label | about 119 px (2 by 2 tiles, BUG-0011, 2026-10-25; was 50 px four across) | 10 px, 0.04 em | 7 / 7 | `MOBILITY` (8) | Low. One line at 90–125% (MOBILITY 64.2 px in a 146 px tile at 125); +40% is 11 |
| Augmentation / role-protocol name | 169 px, wraps (`overflow-wrap: break-word`; ellipsis removed in IF-037) | 10 px, 0.1 em | 24 / 25 | `STOCK ISSUE` (11); project titles not measured | Medium; a longer name wraps to a second line and grows the row |
| Augmentation / role description | 169 px, wraps | 10 px | 26 / 26 | `NO PROJECT RESEARCHED` (21) | Low (wraps); role-protocol text already runs 3 lines |
| Specialty line | 214 px, wraps | 10 px | 32 / 32 | `Frontline combat. Breach and clear.` (35) | Low (wraps); already 2 lines |
| Role cell name (strip) | about 132 px (inferred from the grid: 176 px cell minus padding, glyph, gap), wraps (`overflow-wrap: break-word`; ellipsis removed in IF-037) | 10 px, 0.14 em (names) / light (ability lines) | 17 / 16 | `TECH SPECIALIST` (15), `SUPPRESSION SWEEP` (17) | **HIGH**. `SUPPRESSION SWEEP` is predicted to wrap to two lines at 125% (inferred; Support was not in the captured squad), growing the strip (the strip already grows at 125%, from the captures); fit with Support in the squad is not measured |
| Mass tier line | 192 px | 10 px, 0.1 em | 27 / 21 | `LIGHT LOAD // +0.15 M/S` (23) | **HIGH**. Wraps at 125% as built (seen); +40% is about 32 |
| Mass limit line | 192 px, `nowrap` | 10 px, 0.12 em | 26 / 21 | `/ 400.0 KG LIMIT` (16) | Medium; `nowrap`, must wrap rather than clip |
| Deploy sub-line | 282 px | 10 px, 0.2 em | 35 / 28 | `<CODENAME> // A WIN SPENDS n DAYS OF WORLD TIME` (40 with a 7-letter codename and 1-digit days; IF-039), `CONFIRM AND DEPLOY STRIKE TEAM 04` (33), `REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT` (43) | **HIGH**. 2 of the 4 refusal sentences (43, 38) exceed 35 in English at 100% (inferred; refusals not captured); the default sentence wraps at 110% and 125% (seen) |
| `DEPLOY TEAM >>` | 280 px | 23 px | wraps to two lines by design | — | Low; two lines at every scale (seen) |
| RECRUIT button | 222 px | 12 px, 0.2 em | 23 / 22 | `RECRUIT + (8/8)` (15) | Medium |
| Header chips | content-sized, wrapping rows | 10 px, 0.2 em | no fixed box | `SELECT UP TO FOUR OPERATIVES` (28) | Medium; at 125% the squad chip and the roster chip already wrap (seen), growing the header |
| Market card ledger | about 256 px (computed: 880 px panel, 3 columns, padding) | 10 px, 0.12 em | about 35 | `COST 34,000 CR // CREDITS 128,450 CR` (36) | **HIGH** (not measured). Predicted to wrap in English |
| Market reason line | about 256 px | 10 px, 0.12 em | about 35 | `INSUFFICIENT CREDITS // 34,000 CR SHORT` (39) | **HIGH** (not measured). Predicted to wrap; its slot reserves one line (`min-height: 1.3em`), so a wrap grows the card |
| Market header line | flex remainder beside the title and `CLOSE` | 10 px, 0.14 em | not measured | `ROSTER 8 / 8 // CREDITS 128,450 CR` (34) | Medium (not measured); wraps |
| Codenames, civilian names, weapon names | — | — | — | Proper nouns | Not translated |
| Role labels, ability names, project titles | — | — | — | Authored strings in data files | Translated only through string tables that do not exist |

Numbers and formats: Credits use thousands separators with `CR`, no `k` / `M` (P-14); mass prints as `n.n KG` (one decimal); speed delta as `+0.15 M/S`; counts as `n / 8`, `n / 4`. The clock chip is `date time` from `stamp()`; none of these formats changes with locale. A future locale needs formats chosen deliberately.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. They are UX criteria; the Roster GDD's own ACs (formulas, injury, market math) are not repeated.

**Performance / responsiveness**
- [ ] **Response.** Assign, unassign, inspect, pin, Item slot, hire and Deploy refusal update every affected readout (bay, count chip, mass, tier, DEPLOY state and sentence, header Credits and Roster) within the next painted frame, and selection feedback is within the art bible §7.5 ≤100 ms of input. No numeric screen-open or hire-time budget exists; none is invented here.

**Core purpose**
- [ ] **Deploy gate.** With a contract selected and one, two, three or four Ready operatives assigned at 400 kg or less, DEPLOY is enabled. With no contract, with none assigned, with an Injured operative assigned (state construction only), or with mass over 400 kg, DEPLOY is disabled and a visible sentence names the cause (`SELECT A CONTRACT ON THE WORLD NETWORK`, `ASSIGN AT LEAST ONE READY OPERATIVE`, `REMOVE INJURED OPERATIVES BEFORE DEPLOYMENT`, `OFFLOAD n.n KG BEFORE DEPLOYMENT`). Exactly 400.0 kg is enabled; 400.1 kg is refused and names 0.1 KG.
- [ ] **Empty bays are legal.** With three of four bays empty, each prints `EMPTY BAY`; DEPLOY is enabled if the other checks pass; nothing calls an empty bay an error.
- [ ] **Dossier is paperwork.** The focused dossier shows, as text: codename, civilian name, role, `READY` or `INJURED`, the specialty line, the role's `ACT` and `PSV` names with descriptions, four augmentation bays, and both weapon names. It also shows the operative's max HP and speed as numbers that include what is worn and Experience, and Experience as a number (Roster UI Requirements; Interface "research-adjusted stats from what is worn"). As built these last three do not print: the stat tiles show derived percentages (Open Question 1, which owns the format and the fate of the fiction readings).
- [ ] **Inspect is not assign.** Clicking a row or bay changes the dossier and no bay; the assigned set and `n / 4 ASSIGNED` are unchanged.
- [ ] **Last operative.** With one assigned, that operative's `−` is disabled and the squad stays at one.
- [ ] **Injured.** An Injured row shows the word `INJURED` and a disabled `+`; its dossier opens; with a Ready operative free and a free bay, the Injured operative still cannot be assigned.
- [ ] **No auto-assign.** After a debrief that kills or injures an assigned operative, that bay is empty on the next visit and stays empty after recovery.
- [ ] **Mass and tier.** The default four read `286.1 KG`, `/ 400.0 KG LIMIT`, `LIGHT LOAD // +0.15 M/S`. Filling a med kit slot adds 8.0 kg and a power cell 6.0 kg to the assigned total in the same frame. At 340.0 kg the line reads LIGHT, at 340.1 STANDARD, at 380.0 STANDARD, at 380.1 `HEAVY LOAD // -0.15 M/S` with DEPLOY still enabled.
- [ ] **Wear / pin.** A bay with no completed project reads `STOCK ISSUE` / `NO PROJECT RESEARCHED` with no `PIN` / `AUTO` chip and cannot be cycled; once one is completed, the chip appears and a click cycles AUTO, each completed project, STOCK, AUTO.
- [ ] **Hire.** Each candidate card prints `COST n CR // CREDITS n CR`. At 8 / 8 every HIRE is disabled and reads `ROSTER AT CAPACITY // 8 / 8`; with Credits below cost it reads `INSUFFICIENT CREDITS // n CR SHORT` (n = the shortfall); on a failed campaign `CAMPAIGN FAILED // NO HIRES`. A successful hire debits exactly the printed cost, adds a Ready, unassigned operative, and removes that card.

**Navigation**
- [ ] **Reachable without a contract.** With no contract selected the Assembly tab opens, the Brief tab shows `LOCKED` and `NO CONTRACT SELECTED` as text, and DEPLOY is refused.
- [ ] **Edits survive nav.** Leave to World Network and return: the assigned squad, pins and Item slots are as left.

**Empty / error states**
- [ ] **Empty roster.** With zero living operatives the screen shows `ROSTER EMPTY` and a `RECRUIT >>` button; the nav still works.
- [ ] **Empty market.** With no candidates the market shows `NO CANDIDATES ON FILE`.

**Accessibility and layout** (per Standard tier)
- [ ] **Layout.** At 1280×720 and text scale 90 / 100 / 110 / 125%, with the market closed and with it open, no text is clipped, no text line is drawn over another, and the roster list and the dossier column scroll to reveal everything, including RECRUIT, the LEGS bay, LOADOUT and both Item slots. No string ends in an ellipsis and no word breaks mid-word. (As built, 2026-10-23: the closed-market default state passes everything except the mid-word `MOBILIT` / `Y` break; the market is unmeasured.)
- [ ] **Text and contrast.** No text run under 10 px; no text under 4.5:1 in default or high contrast, including the over-limit, heavy, refused and market states. (As built: the default state passes; the others are unmeasured.)
- [ ] **Focus and labels.** Every enabled control shows P-04 brackets when focused, in high contrast too; Tab order matches the Focus order above; every control carries the named accessible label.
- [ ] **Market focus.** Focus RECRUIT with Tab and press Enter: focus lands inside the market; twelve presses of Tab (and of Shift+Tab) leave focus inside it; Escape closes it and focus is back on RECRUIT. `CLOSE` does the same as Escape. The dialog element carries `aria-modal="true"`. Repeat from the empty-roster `RECRUIT >>`.
- [ ] **Non-color cues.** In grayscale a tester can tell assigned, inspected, Injured, over-limit, heavy and Ready apart by shape and words.
- [ ] **Hit targets.** At 1280×720 and 100% every pointer target has a hit area of at least 24×24 CSS px (measure the element box, not the glyph), including HIRE and CLOSE in the open market.
- [ ] **Motion.** No idle loop runs; opening the market shows it in one frame with no fade; with reduced motion on nothing changes.

---

## Open Questions

Items marked **As-built delta** record where the shipped screen (`TeamSelect` and `RecruitPanel` in `src/ui/index.tsx`, `src/ui/ui.css` `.ts-*`, `src/ui/assemblyRows.ts`, `src/ui/deployRefusal.ts`, read 2026-10-23) differs from this spec. They are inputs to implementation stories, not defects: no GDD AC fails on them unless stated.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **As-built delta, invented numbers.** The dossier's `HLTH`, `STAMINA`, `FOCUS`, `MOBILITY` percentages are derived (`FOCUS` is `78 + hash % 21`, not a game value), the four bay readings (`NEURAL`, `CHEST`, `ARMS`, `LEGS`) are hash-derived, and `ROSTER SYNC 00:12:44 AGO` is a literal. The Roster GDD asks for HP, speed, weapons and Experience as numeric deltas and the pillar vetoes decorated numbers. Experience is not shown at all. Spec: print real max HP and speed (worn research and Experience included, as `crewBonus` and `xpBonus` already compute them), Experience as `n XP`, and drop or mark fiction as `aria-hidden` | game-designer / art-director | Open |
| 2 | **As-built delta, Injured recovery.** `INJURED` does not say for how long. `remainingDowntimeSec` exists in `campaignStore`; the row and dossier do not print it. Whether to print it (and in what unit) is a design call; the GDD requires only that Injured is readable with a non-color cue (met) | game-designer | Open |
| 3 | **As-built delta, disabled-key reasons.** The `+` and `−` keys give their reason (`OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`, `STRIKE TEAM 04 IS FULL`, `STRIKE TEAM 04 NEEDS AT LEAST ONE OPERATIVE`) only in `title`, which P-03 says does not satisfy a visible reason, and a disabled key is not a tab stop. Spec: visible reason text. Also: at the default 4 / 4 every `+` is disabled, so swapping a member needs unassign first; whether to allow a one-click swap is the owner's call. And: no live region announces that DEPLOY became refused | ux-designer / ui-programmer | Open |
| 4 | **Recruitment Market overlay behavior.** When drafted, the market had no `aria-modal`, no focus trap or restore and no Escape handling. **Resolved by IF-037 (commit 52be089)**: `RecruitPanel` uses `useModalFocus` (`src/ui/modalFocus.ts`): focus enters the dialog, Tab is trapped, Escape closes it, focus returns to the RECRUIT control, and the dialog is `aria-modal="true"`. Escape follows the library's Escape section (top overlay only, never confirms a spend), so the market is a P-05 use. Evidence: `production/qa/evidence/screens-2026-10-23/focus-output.txt` (4 market checks PASS). The pattern gap for the card body moves to Open Question 21 | ux-designer | Closed 2026-10-23; code: IF-037 |
| 5 | **As-built delta, hover and glow.** Assembly controls carry hover styling and glow (`.ts-row:hover`, `.ts-bay:hover`, `.btn:hover` box-shadow, `.cta` drop-shadow, `.ts-bay.focus` outer box-shadow) although the art bible and library say hover is not a state and glow is banned. Visual style is the art-director's | art-director | Open |
| 6 | **As-built delta, no strategic transport.** Interface lists Pause and Clock speed on the four Screens (P-20). Assembly shows only a clock chip; the clock keeps running at whatever speed and pause state World Network left (inference from `worldStore` use). Hire cadence and injury recovery run here | game-designer / ux-designer | Open |
| 7 | **As-built delta, mass edge states.** At zero assigned the tier line reads `LIGHT LOAD // +0.15 M/S` at 0.0 kg. Heavy tier (legal, enabled) uses the same red as over-limit; the library reserves red for danger, and 10 px red text should use Red Hot (as built `--red`). The UI also prints `INJURED` when a status is missing. None of these states was captured | ux-designer / art-director | Open |
| 8 | **As-built delta, truncation.** When drafted, `.ts-aug-main b` and `.ts-role-main b, i` used `white-space: nowrap; text-overflow: ellipsis` (truncation by design, Interface Rule 6). **Resolved by IF-037**: every `text-overflow: ellipsis` rule is gone from `src/ui/ui.css`; these lines now wrap (`overflow-wrap: break-word`). The latest sweep reports 0 clip / truncation / visible text-over-text at 90 / 100 / 110 / 125% (default state). Longer strings now grow their row or strip instead (Localization) | ui-programmer | Closed 2026-10-23; code: IF-037 |
| 9 | **Kit and items need words.** The playtest says abilities and grenade sources were not understood. The Item slots show kg but not what a med kit or power cell does (a power cell arms grenades, Roster Core Rule 18). Spec: one static effect line per item kind. ROLE PROTOCOL exists and is above the fold | game-designer / ux-designer | Open |
| 10 | **As-built delta, the fold.** The dossier column overflows at all four scales and, at 100%, LEGS, LOADOUT and ITEM SLOTS lie below the fold; the roster list overflows from 100% and the RECRUIT button sits under the fade. Item slots change mass, so a Deploy-relevant control is off-screen by default. Options: reorder the dossier (Item slots above LOADOUT), shrink the specialty block, or move RECRUIT out of the scroll box. Not measured: how many scroll steps each needs | ux-designer | Open |
| 11 | **Item-slot persistence (Roster Open Question 3, owner Roster + Interface, target `/ux-design assembly`).** As built: `loadout` lives in `appStore`, is saved, survives Assembly visits and survives missions; it is cleared only for operatives who die (`debrief.ts`). Nothing consumes items between missions, so filled slots are a permanent free choice. Needs an owner ruling: keep, reset at deploy, or consume | owner / game-designer | Open |
| 12 | **Market rules as built.** (a) No backfill after a hire until the next 24-hour due (Roster OQ 2, open). (b) When three offers stand and a due elapses, `sync` drops the oldest offer and adds a new one, silently (Roster edge case says only "stay at 3"). (c) A win ETA spanning several intervals loops once per interval (Roster OQ 5). (d) On a failed campaign (which means an empty roster) every hire is refused `CAMPAIGN FAILED // NO HIRES`, so the empty-roster screen leads to a dead end (Roster OQ 1: do not import the code's no-op as policy) | game-designer / systems-designer | Open |
| 13 | **Bay order.** Bays are an ordered list; unassigning shifts later operatives up and renumbers them. No control reorders them. Whether bay number carries meaning in the field (slot keys 1–4 are reserved in the Mission) is not documented here; not verified | game-designer | Open |
| 14 | **Not measured.** The sweep (re-run after IF-037) captures the default state only (contract selected, four assigned, nothing researched, market closed); its target check covers width and height of those 32 targets. The focus probe covers the market's focus, trap, Escape and restore only. Still not captured: the Recruitment Market's text size, contrast, clip / overlap and HIRE / CLOSE target size at any scale; refused and over-mass DEPLOY states; heavy tier; Injured assigned; zero assigned; researched bays; filled Item slots; contrast of red states; Support in the squad; a focused Injured operative; the save-failure notice's position over this layout; behavior at 90–125% for those states | qa-lead | Open |
| 15 | **As-built delta, mid-word break.** `MOBILITY` broke as `MOBILIT` / `Y` at 100, 110 and 125% in English (`.ts-stats label { overflow-wrap: anywhere }` in a tile about 50 px wide; BUG-0011). **Closed 2026-10-25**: owner decision, give the tiles room. `.ts-stats` is now a 2 by 2 grid (`grid-template-columns: repeat(2, minmax(0, 1fr))`, `src/ui/ui.css`) and `overflow-wrap: anywhere` is removed from `.ts-stats label`; label copy unchanged. Measured at 1280x720, default and high contrast: every label is 1 line box at 90 / 100 / 110 / 125% (`MOBILITY` 46.2 / 51.4 / 56.5 / 64.2 px in a 119 / 119 / 125 / 146 px tile), no overflow; team sweep 0 clip / truncation / spill / overlap at every scale; the dossier list still scrolls (P-15). Evidence: `production/qa/evidence/bug-0011-fix-2026-10-25/` | ui-programmer / owner | Closed |
| 16 | **Captured focus marker.** Row 01 shows corner brackets in the captures; whether that is keyboard focus left by the harness's Tab walk or the inspect marker is not determined | qa-lead | Open |
| 17 | Player journey map missing: `design/player-journey.md` does not exist. Arrivals above come from the GDD and code | game-designer | Open (non-blocking) |
| 18 | `.claude/rules/ui-code.md` says to support gamepad and route text through a localization system. ADR-0017 forbids gamepad and touch and no localization system exists; this spec follows ADR-0017 and `project.yaml`, as `world-network.md` does | owner | Open (rule file) |
| 19 | **Header at 125%.** The header wraps to two rows and the strip grows, costing the three-column row about 63 px (read off captures, approximate). Whether to shorten the subtitle chips to hold one header row is untested | ux-designer | Open |
| 20 | Not decided anywhere: whether `STRIKE TEAM 04` (a literal) is a fixed fiction label or should vary; this spec keeps it as shipped | art-director | Open (minor) |
| 21 | **Library gap: Assembly patterns.** `design/ux/interaction-patterns.md` Gaps & Patterns Needed lists "Assembly bays and dossier" and "candidate market" as not yet patterns, and P-05's **Used In** line names Pause, Settings and Balance but not the Recruitment Market. This spec uses four behaviors the library lacks: the **Assembly bay** (filled / empty / inspected), the **bay cycle** (AUTO → each completed project → STOCK), the **Item slot cycle** (empty → med kit → power cell), and the **candidate market** card (ledger, HIRE, reserved reason slot, 24-hour footer). They are specified here, in the Component Inventory, States and Interaction Map. Flagged for addition to the library (and the Recruitment Market for P-05's Used In); the library is **not** edited by this spec | ux-designer | Open (library gap, non-blocking) |
