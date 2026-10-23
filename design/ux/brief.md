# UX Spec: Brief

> **Status**: In Review
> **Author**: Claude (delegated by owner /goal 2026-10-23) + ux-designer
> **Last Updated**: 2026-10-23
> **Journey Phase(s)**: unknown — no journey map
> **Platform Target**: Desktop browser (1280×720 minimum). Keyboard and mouse. No gamepad. No touch.
> **Template**: UX Spec

---

## Purpose & Player Need

The player arrives at the Brief wanting to **read the plan before committing a squad**: what the job asks, what could go wrong, what it pays, and how the odds read at the intel level they have earned. The sentence the screen must make true is: "I know what this contract wants of me, what is waiting in that district, and what it pays, and I can say yes in one move."

The Brief is the second half of the contract choice (Interface Rule 7: Menu → World Network → select contract → **Brief** → Assembly → Deploy → Mission → Debrief). It is one of the four Screens. It does five jobs:

1. **Plan**: show the District the mission will actually build: the plotted city, the insertion route, the extraction route, the hostile ring and the patrol loops (Interface Screens table: "The map **must be the District**").
2. **Instruct**: print every objective in its tier, with a **KIT** line per objective kind, from the same objective list the sim runs, so the player learns what the objective needs before deploy (AC31).
3. **Price and rate**: Reward, optional bonuses, Threat rating, and the odds: **Chance %** at intel below 2, **Risk index band** at intel 2 and above (Interface AC7). The World Network prints Chance at every intel level; the Brief is the only surface that prints the Risk band.
4. **Agree**: everything the Brief prints about the deployment (objectives, routes, force and civilian counts, Opening hour, weather front) must match the District that Deploy creates (Interface AC5; ADR-0009).
5. **Commit**: one primary control, ACCEPT CONTRACT, goes straight to Assembly. No buy-in, no second confirm (Interface Rule 10, Edge Cases).

**Failure if this screen is missing or hard to use**: the player deploys blind. Playtest 2026-10-19 (recorded in story IF-015): the tester did not know the sabotage mission wanted grenades, where grenades came from, or that an operative had to hold the console. The same record notes a "useless info" complaint about Brief density (story IF-015, Out of Scope). A Brief that buries the objectives under identity art fails the first and feeds the second.

**Pillars served**: *Information is operational power* (the KIT line and the odds are the actionable content; ADR-0017 secondary note in IF-015: the Brief must agree with the deployed mission); *One corporate operating system* (the Brief is a "brief document" record surface in the same terminal language, art bible §7.4, §2.9 state 5).

Sources: `design/gdd/interface.md` (Screens table row Brief; Rules 4, 6, 7, 10; Edge Cases; UI Requirements; ACs 4, 5, 6, 7, 31), `design/difficulty-curve.md` (KIT copy, via IF-015), `design/ux/interaction-patterns.md` P-03, P-04, P-06, P-14, P-15, P-16, `design/accessibility-requirements.md`, `design/art/art-bible.md` §4, §7, `src/ui/index.tsx` `MissionBrief` and helpers, `src/ui/briefMap.ts`, `src/ui/kitLine.ts`, `src/ui/worldChrome.ts` (`briefOdds`), `src/ui/ui.css` `.mb-*`, `production/qa/evidence/screens-2026-10-23/` (`sweep-brief.json`, `brief-{90,100,110,125,hc}.png`, README).

---

## Player Context on Arrival

The Brief is `appStore.phase = 'brief'` with a resolvable `appStore.missionId`. It has four arrival situations.

| Arrival | What the player was just doing | Assumed emotional state | What they most need |
|---|---|---|---|
| **First contract, from the World Network** | Chose a contract off OPEN CONTRACTS or a Scan marker after reading the board | Curious, a little braced; has seen only `CHANCE n%` | The job in plain objectives, what the KIT line says each needs, and a clear yes |
| **Repeat contract / Replay (authored)** | Returned from a Debrief via Replay, or re-selected a contract already won | Familiar; wants to confirm what changed | The same plan, with any change in odds visible (the variant follows whether the contract is already won; as built `missionVariant(m, contractsWon.includes(m.id))`) |
| **Hop from Research or Assembly** (Brief tab, contract already selected) | Inspected a lab or the squad | Calm, planning | The same Brief, unchanged unless the world moved (see Open Question 9) |
| **Intel just rose** | Returned from a win that raised intel to 2 | Wants to see the new information | The odds line now reads RISK INDEX with a band, not a percentage |

- **Voluntary**: yes. Nothing forces a contract; the player can leave by nav at any time.
- **Time pressure**: soft. Strategic time runs on this Screen (Interface Rule 10; the header clock chip advanced between the measured captures), but the screen shows no Pause or speed control (as-built delta, Open Question 8). A generated offer carries an expiry on the World Network; what the Brief does if it expires while open is **not verified** (Open Question 9).
- **Attention load**: low and mostly static. The one live value is the header clock; Brief counts and odds are derived from live sector state (Open Question 9).
- **Audio**: menu has unlocked audio. UI click on activation only, through the audio event system; no sting on accept.
- **Journey phase**: not mapped (no `design/player-journey.md`).

---

## Navigation Position

This screen lives at: [app boot] → Menu → World Network → **Brief** (`phase = 'brief'`). It is one of the four Screens, peer to World Network, Research and Assembly through the shared nav (P-06). **Locked on the nav until a contract is selected**: `navTabGate` gates only Brief, reason text `NO CONTRACT SELECTED` (`src/ui/navGates.ts`; the same reason text Deploy gives). Brief is reachable while the selected id is a live offer or still resolves; a null or unresolved id locks it. Overlays on this screen: Settings and Balance (P-05, from their own entry points). The Brief has no overlay of its own: no first-visit card, no toast host (as built; none in `MissionBrief`).

---

## Entry & Exit Points

| Entry Source | Trigger | Player carries this context |
|---|---|---|
| World Network → contract | Click or Enter/Space on an OPEN CONTRACTS row or an open Scan marker | `selectMission` sets `missionId` and `phase = 'brief'` in one step (World Network spec). The Brief resolves the contract, then derives variant, modifiers, odds and the District plan |
| Research / Assembly → Brief | Nav tab, only while a contract is selected | Same contract; counts and odds re-derived from live state |
| Debrief → Replay (authored, non-failed campaign) | Debrief's Replay control | The authored contract, without reselecting (Interface Rule 10, AC6). Generated contracts have no Replay. The Replay code path was **not read** for this spec (Open Question 18) |
| Continue / New Operation | Not an entry | Continue lands on the World Network; a selected contract is restored but not resumed (`design/ux/world-network.md`) |

| Exit Destination | Trigger | Notes |
|---|---|---|
| Assembly | **ACCEPT CONTRACT** (`goto('team')`) | Free; no buy-in, no second confirm (Interface Rule 10). Verified in `MissionBrief` |
| World Network | Nav tab | Selected contract and Focus unchanged. This is the route back |
| Research / Assembly | Nav tab | Strategic clock keeps running on the destination Screen |
| World Network (forced) | The contract no longer resolves | As built: `if (!m) goto('world')` and the component returns nothing for that render (verified, `src/ui/index.tsx`). No message is printed (Open Question 9) |
| Mission | Not directly | Reached through Assembly → Deploy |

No exit from this screen is destructive: leaving the Brief never spends Credits, Influence or time and writes nothing. Accepting is free. Closing the tab is the only exit that stops the strategic clock mid-state.

---

## Layout Specification

### ASCII Wireframe

1280×720, text scale 100%, Rust Haven (authored, Moderate, intel 1, Standard difficulty). Figures are placeholders; shapes and proportions are measured from `brief-100.png` (±2 px).

```
+----------------------------------------------------------------------------------------------------+
| BRIEF                             [DATE TIME] [CREDITS 000,000 CR] [INFLUENCE 0] [INTEL 1] [ROSTER 0/0]|
| CODENAME // CITY                                                                                   |
+--------------------------------------------------------------------------+-------------------------+
| RECON FEED // SAT-7A                              hh:mm:ss | IR-MONO      | CONTRACT DOSSIER        |
| > briefing line 1 .........................   ALT / RNG / TRK  (decor)    | OPERATION:    [silhouette]|
| > briefing line 2 ... (4 lines, wrap)         ZOOM / MODE      (decor)    |  CODENAME      ID: XX-77 |
|        [ skyline art ]   +--TARGET BUILDING--+                            | LOCATION:                |
|  [INSERTION]---route a---> |  NAME  ID: D-03  |  <---route o---[EXTRACT]  | MISSION TYPE:            |
|   ROUTE ALPHA              +------------------+       ROUTE OMEGA          | CLIENT / DIRECTIVE:      |
+--------------------------------------------------------------------------+ [THREAT RATING  WORD ####]|
| TACTICAL MAP // CITY - DISTRICT 03                GRID REF: 77-2A | 96M SQ  |  ETA RESPONSE: < 06:00  |
| (empty)  CITY BLOCKS     35 | +--------+ |  INSERTION POINT                | REWARD:                 |
|          STREETS         06 | | plan   | |  EXTRACTION POINT               |  41,000 CR  CORP CREDITS|
|          CIVILIANS       08 | | (SVG)  | |  TARGET ZONE                    | OBJECTIVES:             |
|          PATROL CONTACTS 03 | |        | |  ROUTE ALPHA / OMEGA            |  PRIMARY: ...           |
|          GARRISON        04 | +--------+ |  HOSTILE ZONE                   |   KIT: ...  (per kind)  |
|          ROUTE ALPHA   61 M |  (rail scrolls ▼)  PATROL ROUTE               |  ... (scrolls)  ▼        |
|          ... WEATHER, ODDS (below the fold)                                 | COLLATERAL / NOTES (scroll)|
+--------------------------------------------------------------------------+-------------------------+
| COMMS LOG // CH 7A  |        <<  ACCEPT CONTRACT  >>                      | CONTRACT ID / CLEARANCE |
| [hh:mm:ss] 3 lines  |                                                      | ||||| barcode          |
+----------------------------------------------------------------------------------------------------+
| [WORLD NETWORK]        [RESEARCH]        [[ BRIEF ]]        [ASSEMBLY]                              |
+----------------------------------------------------------------------------------------------------+
```

### Layout Zones

**Arrangements considered** (autonomous pass; picks recorded by "Claude (delegated, 2026-10-23)"; not logged to `production/session-logs/decision-log.md`, since this task writes one file):

| Option | Description | For | Against |
|---|---|---|---|
| **A — Left stack (recon over plan) + right dossier + action bar (chosen, as built)** | Visual plan on the left, the contract record on the right, one primary action along the bottom | Shipped and tuned to 1280×720 (`.mb-main` grid: `minmax(0,1fr)` + `clamp(300px, 26vw, 380px)`); the map and the facts that annotate it sit side by side; the primary action is the largest target on screen (Fitts's Law) | The dossier column carries identity art, Threat, Reward, Objectives, Collateral and Notes in one scroll; at 100% the fourth objective is cut and at 125% only two objectives show before scrolling (Open Question 1) |
| B — Objectives and odds first, identity compressed | Same zones, dossier reordered: Threat, Reward, Objectives, odds; the portrait silhouette shrinks or goes | Puts the playtest's missing information (what each objective needs) above the fold | Changes the shipped layout; the silhouette and field block are the screen's "dossier" fiction (art direction call) |
| C — Single column document | Briefing, objectives, map as one scrolling page | Reads as a document; no competing columns | Plan and objectives are no longer visible together; the map falls below the fold; a larger change than the evidence supports |

Recommendation: A as shipped, with the hierarchy fix of B reached by ordering inside the dossier (Open Question 1). Not adopted; the owner decides.

**Chosen zones (A)**, from `brief-100.png` and the shipped CSS:

| Zone | Approx. size at 1280×720 | Contents | Why here |
|---|---|---|---|
| **Header** | full width, ≈68 px | `BRIEF` title (33.28 px), subtitle `CODENAME // CITY`, chips: strategic date/time, Credits (amber, money), Influence, Intel, Roster | Shared by the four Screens (Interface UI Requirements). Header carries a clock chip but no transport on this Screen |
| **Recon feed** | ≈906×283 | Panel title, wall-clock readout, SVG skyline art with routes and target, HTML overlay: briefing lines, decorative readouts (`aria-hidden`), target callout, two route tags | The first read: the fiction of the job. The recon frame's type is an HTML overlay at the 10 px floor and the text scale (IF-036) |
| **Tactical map** | ≈906×219 | Left: readout rail (a scrolling `ScrollBox`); centre: the square District plan (SVG); right: legend. Stats are right-aligned, capped at 168 px wide, which leaves about 170 px empty at the rail's left (screenshot) | The plan: counts, routes, weather and odds beside the map they describe |
| **Dossier** | ≈333×512 (`clamp(300px, 26vw, 380px)`) | One `ScrollBox`: fields (operation, location, type, client/directive) with silhouette and `ID`; Threat rating; Reward; OBJECTIVES with KIT lines; COLLATERAL TOLERANCE; MISSION NOTES | The contract record |
| **Action bar** | ≈1250×64 | Left: COMMS LOG (three lines). Centre: `<< ACCEPT CONTRACT >>`, ≈663×52. Right: `CONTRACT ID` and `CLEARANCE LEVEL` with a barcode | Primary action at the bottom of the reading path, nearest the nav |
| **Nav** | full width, ≈35 px | P-06 four tabs; Brief is the selected frame | Shared chrome |

Screen padding ≈15 px on each side. The two left panels split the column 1.3 : 1 (`.mb-recon { flex: 1.3 }`, `.mb-tac { flex: 1 }`; measured 283 : 219).

### Decisions recorded by Claude (delegated, 2026-10-23)

**D1. KIT line case: render UPPERCASE (keep `.mb-obj-kit { text-transform: uppercase }`). Data and accessible text stay sentence case.**

- The AC31 strings stay as `kitLine` returns them (sentence case, unit `s`), in the DOM and in the unit test. Only the rendered glyphs are uppercase, so AC31 holds at the data level and a screen reader reads the DOM text (inferred from how CSS `text-transform` behaves; not tested with a screen reader).
- Why uppercase: Interface Rule 4 sets "small monospace uppercase labels"; art bible §7.2 sets "engineering-label rather than prose". Every other running line on the Brief is uppercase: objective labels, MISSION NOTES, COMMS LOG, and the recon briefing, whose data is stored in sentence case (`Stratos has located...`, measured in `sweep-brief.json`) and rendered uppercase by `.mb-rbrief { text-transform: uppercase }`. KIT follows an existing precedent. A sentence-case KIT line would be the only lowercase text on the Brief, a second register of "prose" inside the instrument (Pillar 5, one OS).
- Cost accepted: all-caps lines read more slowly than mixed case. The longest KIT line is 62 characters and wraps to two lines at 100%; the same screen already prints four other running lines in caps. The playtest failure was absence of the information, not its casing.
- The unit prints `45 S` where the data says `45 s`. The screen already prints uppercase units (`61 M`, `1824M`), and no compass letter shares the line. Accepted.
- One correction travels with the decision: `.mb-obj-kit b { color: var(--amber) }` (`src/ui/ui.css:2105`) sets the `KIT:` tag in Ledger Amber, which is money only (Interface Rule 4; art bible §4.2). The tag renders in Signal Cyan, as the tier labels do (`.mb-obj b`). As-built delta, Open Question 6.

**D2. Tactical-map stats rail reads only when scrolled: scrolling is acceptable under P-15 for the reference counts, not for the odds row.**

- Observed (`brief-100.png`, `brief-90.png`): the rail shows CITY BLOCKS through ROUTE OMEGA and the `WEATHER` label; the value and the final odds row (PROJECTED SUCCESS or RISK INDEX) sit below a fade. `sweep-brief.json` reports 0 clips at every scale because overflow in a `ScrollBox` is scroll, not clip.
- P-15 allows overflow that scrolls, with the fade always on and the content reachable (Interface Rule 6 forbids clipping, not scrolling). The rail meets that. So reaching CITY BLOCKS, STREETS, CIVILIANS, PATROL CONTACTS, GARRISON, ROUTE ALPHA/OMEGA and WEATHER by scrolling is acceptable.
- It is not acceptable for the odds row. Chance versus Risk is the one readout that changes with intel (AC7) and the Brief's own decision input. Hiding it last, below the fold at 90, 100 and 110% (125% shows fewer rows still), makes the player scroll for the number the screen exists to show. **Spec: the odds row prints first in the rail** (a reorder of the existing rows; no new content and no layout change), so it is visible without scrolling at 1280×720 at every text scale.
- Observation for the owner: the rail scrolls vertically while ≈170 px at its left is empty (`.mb-tac-stat { max-width: 168px }`, right-aligned). A two-column stat grid would use that width instead of height. Not adopted here (Open Question 2).
- Limit of this decision: it answers the one rail gap named in the task. The Sprint 10 QA record itself was not read (Open Question 16).

### Component Inventory

"Pattern" is the library pattern in `design/ux/interaction-patterns.md`. "New" flags a behavior the library lacks.

| Zone | Component | Type | Content | Interactive | Pattern |
|---|---|---|---|---|---|
| Header | Title, subtitle | Text | `BRIEF`; `CODENAME // CITY` | No | none |
| Header | Resource chips | Stat display ×5 | Strategic date and time, `CREDITS n CR` (amber), `INFLUENCE n`, `INTEL n`, `ROSTER n / cap` | No | P-14 |
| Recon | Recon frame | Image (`role="img"`, labelled) | Infrared skyline, routes, target glow. Label: `Infrared satellite frame over <district>, <city>` | No | none (decorative art with a text equivalent) |
| Recon | Briefing | Text overlay | The contract's briefing lines, each prefixed `>` | No | P-16 (line format only) |
| Recon | Readouts | Decoration | `ALT`, `RNG`, `TRK`, `ZOOM`, `MODE` | No (`aria-hidden`) | none; never carries state |
| Recon | Callout, route tags | Text overlay | `TARGET BUILDING` / archetype name / `ID: D-nn // GRID 77-2A`; `INSERTION / ROUTE ALPHA`; `EXTRACTION / ROUTE OMEGA` | No | none |
| Tactical | Stats rail | Scrollable readout list | Counts, routes in metres, weather, odds (see D2) | Scroll only | P-14, P-15 |
| Tactical | District plan | Image (`role="img"`, labelled) | Roads, blocks, hostile ring, patrols, routes, target zone, devices, VIPs, landing zone, scale bar, north rose | No | none (Gaps list: Brief map; non-interactive so no behavior is invented). Not P-10 |
| Tactical | Legend | Key | Seven glyph rows (SVG `aria-hidden`, label in text) | No | P-14. Names carry meaning, glyph reinforces |
| Dossier | Fields | Readout ×4 | `OPERATION`, `LOCATION`, `MISSION TYPE`, `CLIENT` (or `DIRECTIVE` when the client is `INTERNAL`) | No | P-14 |
| Dossier | Silhouette | Decoration | Operative silhouette with `ID: <initials>-77` (`aria-hidden` art; ID is text) | No | none |
| Dossier | Threat rating | Readout | Word `MODERATE` / `HIGH` / `SEVERE`, 9-block gauge (4 / 6 / 8 filled), `ETA RESPONSE: < 06:00` | No | P-14 |
| Dossier | Reward | Readout | `n CR` (figure, `CR` in amber), `CORP CREDITS` | No | P-14 |
| Dossier | OBJECTIVES | List | Per objective: diamond glyph, tier word (`PRIMARY`, `SECONDARY`, `TERTIARY`, or `OPTIONAL`), label, `(+n CR)` for an optional bonus, then a `KIT:` line when the kind carries one | No | P-14 |
| Dossier | COLLATERAL TOLERANCE | Readout + meter | `LOW (10%)`, meter, axis 0–100% | No | P-14. Hard-coded (Open Question 7) |
| Dossier | MISSION NOTES | Text list | Hardened profile line (Hardened only), then the contract's notes | No | P-14 |
| Action | COMMS LOG | Static log | `COMMS LOG // CH 7A`, three timestamped lines (weather line is data, the other two are fixed text) | No | P-16 (line format only; no empty state, always three lines) |
| Action | **ACCEPT CONTRACT** | Button, primary | `<< ACCEPT CONTRACT >>`; name `ACCEPT CONTRACT <codename> // <reward> CR` | Yes | Standard control: primary button; focus P-04 |
| Action | Contract plate | Readout | `CONTRACT ID: 77A-<CODENAME>-2087`, `CLEARANCE LEVEL: EXECUTIVE`, barcode (`aria-hidden`) | No | P-14. ID is derived by string, level is a literal (Open Question 7) |
| Nav | Four-Screen tabs | Tab bar | Brief selected (`aria-current="page"`) | Yes | P-06 |

### Information Hierarchy

Ranked by "what the player needs to decide yes or no", with the decision that the **objectives with their KIT lines and the odds** outrank identity art. "As built" says where the shipped screen differs.

| Rank | Information | Visible when | Notes |
|---|---|---|---|
| 1 | Objectives, tier order, optional bonus, KIT line per kind | Always | The job and what it needs (AC31). As built, below Threat and Reward in the dossier scroll; the fourth row is cut at 100% for a four-objective contract (Open Question 1) |
| 2 | Odds: `PROJECTED SUCCESS n%` (intel < 2) or `RISK INDEX` with band (intel 2+) | Always | The one intel-dependent readout. As built, last row of the rail, below the fold at 90–110% (D2 moves it first) |
| 3 | Threat rating word and gauge; Reward | Always | Threat is a word plus a count of blocks, never colour alone |
| 4 | The District plan, route lengths, force and civilian counts, weather and its front | Always | Must equal the deployed District (Interface AC5) |
| 5 | Accept | Always | One control. Largest target |
| 6 | Briefing text and target callout | Always | Fiction that carries the job in a sentence |
| 7 | Mission notes (and the Hardened profile line) | Always | Tuning text |
| 8 | Collateral tolerance | Always | As built a literal, not a contract value (Open Question 7) |
| 9 | Comms log, contract plate, silhouette, recon readouts | Always | Chrome. Only the weather comms line is data |

**Discoverable, not up front**: nothing on the Brief is hidden behind an interaction except overflow that scrolls. The legend is always visible.

---

## States & Variants

| State / Variant | Trigger | What Changes |
|---|---|---|
| **Default (authored, Standard, intel 1)** | Select Rust Haven | All panels populated; odds `PROJECTED SUCCESS n%`; no Hardened line |
| **Authored contract** | m01 Glass Veil, m02 Hollow Crown, m03 Rust Haven | Authored objectives and notes. KIT lines by kind (below) |
| **Generated contract** | A World Network offer (types seen in IF-015 evidence: seizure, extraction, sabotage, suppression) | Same layout; codename, city, objectives, notes come from the generated mission; client may be `INTERNAL`, which relabels the field `DIRECTIVE:` |
| **Intel < 2** | Intel level 1 | Odds row `PROJECTED SUCCESS n%`; no Risk word, no band; Risk is computed but not shown |
| **Intel 2+** | Intel level 2 or more | Odds row `RISK INDEX <index> // <BAND>`, band one of `LOW`, `GUARDED`, `HIGH`, `SEVERE`; no `PROJECTED SUCCESS`. Tone teal for LOW and GUARDED, red for HIGH and SEVERE; the word carries the band. Whether the numeric index prints beside the band is Open Question 10 |
| **Threat level** | `m.threat` | `MODERATE` 4 blocks, `HIGH` 6, `SEVERE` 8 of 9. Word plus count; red is reinforcement. At 20.48 px the word sits on the same row as the gauge and ETA line |
| **Weather: clear** | No front, `none` | Rail `WEATHER`: `CLEAR DUSK // hh:mm:ss` or `CLEAR NIGHT // hh:mm:ss`; comms line `WEATHER: CLEAR DUSK. VISIBILITY FULL.` |
| **Weather: rain, no front** | `light` or `heavy` | Rail: `LIGHT RAIN // hh:mm:ss` or `HEAVY RAIN // hh:mm:ss`; comms `WEATHER: LIGHT RAIN. VISIBILITY REDUCED.` / `HEAVY RAIN. VISIBILITY LOW.` is the as-built fixed copy |
| **Weather front** | `m.weatherFront` | Rail `<FROM> → <TO> hh:mm:ss` (the front's clock time in the mission's opening hour); comms `WEATHER: <FROM> → <TO> hh:mm:ss.` Odds use the clearer of the two weathers (`riskWeather`) |
| **KIT: destroy** | An objective of kind destroy | `KIT: POWER CELLS ARM GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY` (rendered; data is sentence case) |
| **KIT: interact** | Kind interact | `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR N S`, N = `durationSec` as is (undefined reads 0) |
| **KIT: escort** | Kind escort | `KIT: THE ASSET MUST REACH THE PAD ALIVE` |
| **KIT: defend** | Kind defend | `KIT: HOLD THE ZONE FOR N S`, N = `durationSec` |
| **KIT: none** | reach-zone, eliminate-tag, extract | No KIT line and no extra row height. Glass Veil, SEIZURE and SUPPRESSION carry none (IF-015 traceability; unit test) |
| **Optional objective** | `o.optional` | Tier word `OPTIONAL:`, then `(+n CR)` when `bonusReward` is set |
| **Hardened** | Settings difficulty Hardened | MISSION NOTES gains first line `HARDENED PROFILE. GUARD SIGHT +1M. ACCURACY UP. CONFIRM SLOW. OPTIONAL WINDOWS TIGHT.` (exact copy: `difficultyNote` in `src/game/missionParams.ts`; verified). Counts and odds already include the Hardened modifiers |
| **Replay variant** | Contract already won | The variant follows `contractsWon` (as built); what differs visibly was not examined (Open Question 18) |
| **No contract / unresolved** | `missionId` null, or no longer resolves | Nav locks Brief with `LOCKED` and `NO CONTRACT SELECTED`. A stale `phase='brief'` returns to the World Network (as built, silently) |
| **Failed campaign / intel-locked contract** | Roster empty on an incomplete campaign; authored contract below its intel gate | **Cannot occur on this screen.** `selectMission` is a no-op in both cases (World Network spec) and the selected contract is cleared on Debrief return. `MissionBrief` reads no failed-campaign flag (verified: it reads `contractsWon` and `intelLevel` only). Debrief offers no Replay on a failed campaign, so no entry exists |
| **Text scale 90 / 100 / 110 / 125%** | Settings | No clipping at 1280×720 (sweep: 0 clips at all four). Overflow scrolls (P-15). At 125% the dossier shows OPERATION to REWARD and two objectives before the fade; legend labels wrap (screenshots). Defects seen: Open Questions 3, 4 |
| **High contrast / reduced motion** | Settings | CSS variables remap only; `hcLow` is 0. Reduced-motion behavior of the Brief's decorative sweeps is **not verified** (Open Question 14) |
| **Window below 1280×720** | Resize | Minimum layout kept; page scrolls; panels do not compress (Interface Rule 6). Not exercised in the sweep |

---

## Interaction Map

Mapping interactions for: **keyboard and mouse** (`project.yaml` `platform.primary_input`). Gamepad: **None**; touch: **None** (ADR-0017). Hover is not a state on any control (art bible §7.4); the only hover affordance is the scrollbar (P-15). Focus is P-04 corner brackets. Pointer, Enter and Space activate every button. No new key binding is invented. The Brief has one decision control; everything else is read-only.

| Component | Action | Input | Immediate feedback | Outcome |
|---|---|---|---|---|
| ACCEPT CONTRACT | Commit | Click; Enter/Space on the focused button | Click sound through `act()` (World Network pattern; the helper was not re-read), then the phase changes in the same commit | `goto('team')`. No cost, no confirm, no state written |
| Nav tab World Network / Research / Assembly | Go | Click; Enter/Space | Click sound | `goto(phase)`; clock continues on the destination |
| Nav tab Brief (current) | None | Click | None | `aria-current="page"`; no navigation (`onClick` absent on the current tab) |
| Stats rail | Scroll | Wheel, scrollbar; arrows when the region has focus | Fade clears at the end (P-15) | View only. As measured the region is a Tab stop (see Focus order) |
| Dossier | Scroll | Same | Same | View only |
| Recon frame, District plan, legend, silhouette, threat, reward, comms, contract plate | None | — | — | Non-interactive. No hover tips are relied on; each COMMS entry carries a `title` with its full text, which the spec does not rely on |
| Escape | — | Esc | None found on this screen | `MissionBrief` has no key handler (verified); whether a global handler acts here was not read |

There is deliberately no BACK button and no Cancel: the route back is the nav. **Spec-vs-built discrepancies are listed once, under Open Questions.**

---

## Data Requirements

The UI owns no game state. The Brief's only write is `goto('team')`. Everything printed is read or derived from an owner.

| Data | Source System | Read / Write | Notes |
|---|---|---|---|
| Selected contract id | `appStore.missionId` | Read | Resolved by `resolveMission` to the MissionDef (codename, city, district, type, client, threat, reward, objectives, briefing, notes, seed, sector, weather, front, opening hour) |
| Variant / archetype | `missionVariant(m, won)` | Read | `won` from `campaignStore.contractsWon` |
| Deployment modifiers | `missionMods(m, sector state, difficulty)` | Read | Reads **live** `worldStore.sectors[m.sector]` (Control, Unrest) and Settings difficulty. Brief comment: "computed live so the counts and the derived chance move with sector state and completed research" |
| Chance | `missionChance(m, mods, researched count)` (Tactical) | Read | Printed at intel < 2. Clamp 35–95 is Tactical's |
| Risk index and band | `missionRisk(counts, {enemyHpMul, visionMul})` (Tactical, `forecast.ts`) | Read | Printed at intel 2+. UI never computes a band |
| Intel level | `campaignStore.intelLevel` | Read | Chooses Chance or Risk in `briefOdds` |
| District plan and counts | `tacticalMapFor(m, spec, gen)` (`briefMap.ts`, from `generateCity` and A* over the walk grid) | Read | Pure and cached (16 entries); World Network warms the cache in idle time |
| Objectives and KIT | `m.objectives` through `kitLine(def)` | Read | A KIT line is a function of `kind` and, for interact and defend, `durationSec` alone (never mission id, type, codename or notes) |
| Weather, front, opening hour | MissionDef; `weatherBriefLabel`, `commsWeather`, `riskWeather` | Read | |
| Hardened note | `difficultyNote(difficulty)` | Read | Empty on Standard |
| Credits, Influence, Intel, Roster | `appStore`, `worldStore`, `campaignStore` | Read | Header chips |
| Strategic time | `worldStore.t` via `stamp()` | Read | Header clock chip; its own subscription |
| Recon header time | `useUtcClock()` → `utcNow()` | Read | Appears to be wall-clock UTC (inferred from the name; `utcNow` not read), not the strategic clock (Open Question 8) |

**Update triggers and missing values.** "Missing" means the owner supplied nothing; the UI never fabricates a 0 (P-14).

| Data | Updates when | If missing |
|---|---|---|
| Objectives, KIT, briefing, notes, codename | Contract selection only (static for a contract) | Unresolved contract: the Brief does not render and returns to the World Network |
| Counts, route metres, plan | `tacticalMapFor` key changes: contract, archetype, seed, or one of enemy-extra, civilian, officer, heavy counts | No separate empty state; the Brief renders only when the map, variant and modifiers all exist |
| Chance / Risk | Sector Control or Unrest changes, research completes, intel changes, difficulty changes | As built, no dash path: values exist whenever the Brief renders |
| Header chips | Spend, award, tick (clock chip only) | Not specified here; shared header |
| Weather lines | Contract selection | `commsWeather` always returns a line |

**Agreement with the deployed mission (ADR-0009, Interface AC5).** The Brief reads the same MissionDef objectives list the sim runs, the same variant, the same modifier function and the same city generator as Deploy, so objectives, KIT lines, routes, counts, Opening hour and front time agree **given equal inputs**. Deploy copies a frozen slice `{sector id, Control, Unrest}` at deploy time (`design/ux/world-network.md`, Entry & Exit Points) while the Brief reads live sector state, so inputs can differ between the two moments if the strategic clock moves (Open Question 9). Existing test seams named by grep, not read in full: `src/ui/kitLine.test.ts` ("the Brief agrees with the deployed mission"), `src/game/missionParams.test.ts` ("the brief side mirrors MissionBrief"), `src/state/contractNavigation.test.ts`.

Real-time: the Brief has one 20 Hz subscriber (the clock chip). Counts and odds re-derive on rounded input change, not per frame. Per-frame data stays out of React state (CLAUDE.md guardrail).

---

## Events Fired

Deliberate: the Brief fires **no analytics events**. Telemetry is local, opt-in and written at the Debrief boundary (`src/state/telemetry.ts`, ADR-0015); nothing here calls it. State changes:

| Player Action | Event Fired | Payload / Data |
|---|---|---|
| ACCEPT CONTRACT | State change: `phase = 'team'` | Selected contract id stays in `appStore`. No debit |
| Nav tab | State change: `phase` | Destination |
| Any activation | UI click via the audio event system (`act()`) | `uiClick` (no direct audio calls) |
| Scroll, read | none | — |

Architecture flags: the Brief requests a phase change only; it never edits the contract, the wallet or the sector (ui-code rule: UI owns no game state). Accept is free by rule (Economy, Interface Rule 10).

---

## Transitions & Animations

Law (art bible §7.4): the terminal prints, scans, ticks and blinks. The Brief is a "brief document" record surface (§7.4), so print is allowed here; §2.9 state 5 says chrome densifies and prints and only the amber payout figure ticks.

| Moment | Spec | Reduced motion |
|---|---|---|
| **Screen enter** | Panel frames snap ≤150 ms; contents are present from the first frame. The recon Scan sweep runs one pass ≤400 ms, once per open | Sweep absent; content already there |
| **Screen exit** | Cut | Same |
| **Reward figure** | Static, as built (`fmt(m.reward)`). Art bible §2.9 says the amber payout figure ticks at the Brief; the figure is a fixed contract fee, so a tick would count toward a value that does not move. Left as built; art-director decides (Open Question 13) | Static |
| **Accept press** | Ink-step ≤150 ms, then phase change; no glow, no scale | Same |
| **Odds readout** | Prints in the first frame; changes in one frame when its inputs change | Same |
| **Idle loops** | The Brief has decorative motion in CSS (`.mb-sweep`, `.mb-sil-scan`, route-flow `@keyframes route-flow-tac`, `.mb-target`). Their durations and loops were **not read**. Spec: at most one idle motion on the Brief, none on text, none while reduced motion is on (Open Question 14) | All static |

Motion budget: no red-cadence loop; nothing on the odds readout or objective text ever moves.

---

## Input Method Completeness Checklist

Platform Target: keyboard and mouse. Gamepad and touch are out of scope (ADR-0017; `project.yaml` `gamepad_support: None`, `touch_support: None`), so those blocks are dropped. An item is ticked only when the spec above states it.

**Keyboard**
- [x] The one decision control (ACCEPT CONTRACT) and every nav tab activate with Enter and Space (native buttons).
- [x] No Brief-specific key binding exists or is added.
- [x] Esc: no Brief handler (verified in `MissionBrief`); never confirms anything; a global handler was not read.
- [x] Focus is visible on every control: P-04 corner brackets, including in high contrast (shared button styles; not re-measured per control here).
- [x] No keyboard trap: no overlay on this screen.
- [x] Tab order is specified in Accessibility → Focus order (measured, `sweep-brief.json` `tab`).
- [x] Every job has a keyboard path: read (Tab to the two scroll regions and scroll), accept, leave by nav.

**Mouse**
- [x] Every action is a single click.
- [x] No information appears only on hover; the COMMS `title` tooltip is not relied on (see Open Question 3 for the truncation it hides).
- [x] No right-click, double-click or drag is required.
- [x] Hit-target sizes are specified, measured against WCAG 2.2 SC 2.5.8 (24×24 CSS px, owner 2026-10-23 per the World Network spec): the sweep counted **5 pointer targets and 0 under 24×24**.

| Target (as built, 1280×720, 100%) | Size | Meets 24×24? |
|---|---|---|
| ACCEPT CONTRACT | ≈663×52 (screenshot pixels, ±2) | Yes |
| Nav tabs (4) | ≈307×35 each (screenshot pixels, ±2) | Yes |
| Stats rail and dossier scroll regions | Region boxes, not pointer controls | Not counted by the sweep |

**Gamepad / touch**: not supported; no checklist.

---

## Accessibility

Tier: **Standard** (`design/accessibility-requirements.md`, committed 2026-09-23). No Backlog row (color-vision presets, tactical-HUD screen reader pass, audio captions, full keyboard travel) is promoted.

| Committed row | How the Brief satisfies it |
|---|---|
| Critical state never by color alone | Threat: the word `MODERATE`/`HIGH`/`SEVERE` plus the count of lit gauge blocks. Risk band: the word. Intel split: the label (`PROJECTED SUCCESS` vs `RISK INDEX`). Selected tab: closed frame + `aria-current`. Optional objective: the word `OPTIONAL:` and `(+n CR)`. Route Alpha vs Omega: names in the rail and legend, dashes and triangle shapes in the plan (colour reinforces). Hostile zone: hatch + `HOSTILE ZONE` in the legend |
| Text legible at 1280×720 | Sweep after IF-036: 142 text runs, 0 under 10 px, 0 under 4.5:1 in default and high contrast, 0 Ink Dim, 0 Ink Faint; 4 SVG text runs, 0 small, 0 low. Known gaps against the 12 px readout rule: Open Question 12 |
| Text scale 90 / 100 / 110 / 125% | `clips` is empty at all four. Overflow scrolls. Screenshots show defects the harness does not flag (Open Questions 3, 4). Three hero sizes do not follow `--text-scale` (Open Question 5) |
| High-contrast mode | CSS-variable remap only; `hcLow` 0. `brief-hc.png` read |
| Full keyboard operability of the committed set | Accept, nav, and the two scroll regions are reachable |
| Contextual accessible labels | ACCEPT: `ACCEPT CONTRACT <codename> // <reward> CR` (contains the visible words). Recon frame: `Infrared satellite frame over <district>, <city>`. District plan: `Tactical plan of <district> showing the insertion route to the target and the extraction route back to the landing zone`. Tabs: `LABEL`, or `LABEL // LOCKED // NO CONTRACT SELECTED` when locked |
| Two-step destructive confirms | None occur. Accept is a free, reversible step; nothing is spent or discarded |
| One-shot advisories | None |
| Reduced motion | Decorative loops must freeze; as-built fallback unverified (Open Question 14) |
| Consistent one-OS chrome | Same palette, panel and glyph grammar as every Screen. Colour-role deviations: Open Question 6 and 13 |

### Focus order

Measured on the running build (`sweep-brief.json` `tab`, Rust Haven, 2026-10-23). The as-built DOM order matches reading order, so it is adopted unchanged:

1. **Stats rail** (scroll region; accessible name is its concatenated text, `CITY BLOCKS35STREETS06CIVILIANS08PATROL CONTACTS03...`).
2. **Dossier** (scroll region; name `OPERATION:RUST HAVENLOCATION:DETROIT SPRAWLMISSION...`).
3. **ACCEPT CONTRACT**.
4. **Nav**: World Network, Research, Brief (current, `aria-current`), Assembly.

The recon frame, plan, legend, header chips and comms log are not stops. Whether any control takes initial focus on entry was **not measured**. Shift+Tab reverses. The two scroll regions are the only way to scroll by keyboard (arrows once a region has focus; browser behavior, not tested). They lack a purposeful accessible name (Open Question 12).

### Contrast

Requirement (art bible §7.5): body and readout text ≥4.5:1 composited against its panel; Ink Dim only at ≥18.66 px bold or ≥24 px; Ink Faint never carries text; red text uses Red Hot; non-text state strokes ≥3:1.

Measured: the sweep (`sweep-brief.json`) found no run under 4.5:1 in default or high-contrast mode. The Brief uses the same inks as the World Network (Ink `#b8d8cf`, Teal, Signal Cyan, Red Hot, Ledger Amber on `--bg-panel`), whose per-ink ratios were measured for `design/ux/world-network.md` (Ink 12.27–13.04:1, Red Hot 6.90:1, Teal 14.10:1, Amber 13.39:1); applying them to the Brief is an **inference** from shared tokens. How the harness composites text that sits on the SVG recon art, rather than on a panel fill, was **not determined** (Open Question 15). The recon art carries a scrim gradient (`mb-recon-scrim`).

Screen-reader considerations for non-text elements:

- The recon frame is `role="img"` with a label; the briefing, callout and route tags are an **HTML label overlay** that sits beside the image, not inside it, so they are plain DOM text and read. The decorative readouts are `aria-hidden`.
- The District plan is `role="img"` with a label; the rail beside it carries the counts as text, so nothing numeric lives only in the plan. Its SVG text (`TARGET ZONE`, `INS / EXT`, `20 M`, `N`) is inside the image role.
- The silhouette, barcode, legend glyphs and diamond objective glyphs are decorative. The gauge blocks are empty elements with no text alternative; the Threat word carries the level.
- Nothing on the Brief is a live region. Screen-reader output was **not exercised** (sweep README).

Color roles (art bible §4.2, Interface Rule 4): teal/cyan = selection, routes, live state; Ledger Amber = money only; red = danger and failure; Print White = settled fact. As-built deviations: Open Questions 6 and 13.

---

## Localization Considerations

Scope: English only. No localization system exists and every string on this screen is a literal in `src/ui/index.tsx` or a game-data string (Open Question 17). The test is 40% expansion. Rule for all rows: expanded text wraps or scrolls; it never clips, truncates or shrinks type (Interface Rule 6).

**How the limits were derived.** Box widths are `w` values from `sweep-brief.json` (1280×720, 100%). Characters per line = box width ÷ (font px × 0.62 em advance incl. tracking). **Assumption**: 0.62 em is the default; rows with wide tracking were calibrated from a measured run of the same screen (legend: 116 px for 16 characters = 7.25 px/char at 10 px, 0.725 em). The 125% column scales the font by 1.25 and keeps the box, unless the CSS scales the box. Rows whose box is shrink-to-fit (equal to its own text) have no measured limit and say so.

| Element | Box at 1280 | Size | Max chars / line (100% / 125%) | Longest English text | Risk at +40% |
|---|---|---|---|---|---|
| Recon briefing line | 561 px (`max-width: 62%`) | 10 px | 90 / 72 | ≈90 chars in line 1 (wraps at 100%) | **HIGH**: the frame is `overflow: hidden` with no scroll; at 125% the block reaches the readout column (Open Question 4) |
| Rail stat value | 168 px row | 13 px | 20 / 16 | `CLEAR DUSK // 18:14:08` (22); front `LIGHT RAIN → CLEAR 18:16:30` (≈27) | **HIGH**: wraps already in English, right-aligned; the rail scrolls |
| Legend label | 121 px (148 max row − 27 glyph) | 10 px, 0.12 em tracking | 16 / 13 | `EXTRACTION POINT` (16) | **HIGH**: at the limit; wraps at 110% and 125% (screenshots) |
| Dossier field label | 192 px | 10 px, 0.22 em | 23 / 18 | `MISSION TYPE:` (13) | Low |
| Dossier field value | 176 px (192 − 16 padding) | 12.5 px | 22 / 18 | `STRATOS INDUSTRIES` (18) | Medium: wraps at 125% (screenshot). Names are proper nouns; `MISSION TYPE` values translate |
| OPERATION value | 176 px | 17.92 px, not text-scaled | 15 / 15 | `HOLLOW CROWN` (12) | Medium; proper noun |
| Threat word | 122 px, no wrap (`flex: 1 0 auto`) | 20.48 px, not text-scaled | 8 / 8 | `MODERATE` (8) | Medium: at the limit; IF-015 recorded an overlap with the ETA line at 125% (not reproduced in `brief-125.png`) |
| Threat ETA line | 156 px, shrink-to-fit | 10 px | not measured | `ETA RESPONSE: < 06:00` (21) | Medium |
| Reward figure | nowrap; ≈165 px free beside `CORP CREDITS` | 29.44 px, not text-scaled | ≈7 digits and commas | `41,000` (6) | **HIGH** above 7 characters: `nowrap` overflows. Maximum reward not determined (Open Question 5) |
| Objective row | 279 px | 10.5 px | 39 / 31 | `OPTIONAL: DROP THE BACKUP TRANSFORMER (+6,000 CR)` (49) | Low: wraps; costs scroll |
| KIT line | 279 px | 10 px, uppercase | 43 / 34 | destroy line, 62 chars | Low: 2 lines now, 3 at +40%; costs scroll |
| Mission note | 295 px | 10 px | 46 / 37 | sentences, about 50–70 chars | Low: wraps |
| COMMS entry | 308 px text (cap `330px × scale`), `nowrap` + ellipsis | 10 px | 48 / 48 | `[23:40:45] WEATHER: CLEAR DUSK. VISIBILITY FULL.` (48) | **HIGH**: at the limit; truncated at 90% (screenshot); a front line `WEATHER: HEAVY RAIN → LIGHT RAIN 18:19:41.` is ≈53 with timestamp (inferred) |
| Contract plate line | 218 px | 10 px, 0.1 em | 30 / 24 | `CONTRACT ID: 77A-RUSTHAVEN-2087` (31) | Medium: id grows with the codename |
| ACCEPT label | button ≈663 px; text run ≈445 px for 21 chars (≈21 px/char, screenshot) | 23.04 px | ≈31 / not measured | `<< ACCEPT CONTRACT >>` (21) | Low |
| Nav tab label | tab ≈307 px | 11.5 px | not measured | `WORLD NETWORK` (13) | Low |
| Subtitle, header chips | shrink-to-fit (253 px equals the text) | 10 px | not measured | `RUST HAVEN // DETROIT SPRAWL` (28) | Unknown: header space is unmeasured |
| Codenames, cities, clients, districts | — | — | — | Proper nouns | Not translated |

Numbers and formats: Credits and Reward use thousands separators with the `CR` suffix, no `k` / `M` (P-14); percentages print as integers; clock times are `hh:mm:ss`; route lengths print as `n M`. A future locale would need these formats chosen deliberately. The arrow `→` in the weather front is a glyph, not text, and needs a font check per locale.

---

## Acceptance Criteria

Each criterion is checkable by a tester without the GDDs. They are UX criteria; the GDD's own ACs stay in `design/gdd/interface.md`.

**Performance / responsiveness**
- [ ] **Response.** Selecting a contract shows the Brief with every panel at final content in its first painted frame (no placeholder, no empty plan, no later fill-in), and ACCEPT CONTRACT changes the Screen within the next painted frame (urgent-state budget ≤100 ms from input, art bible §7.5). No numeric open-time budget exists yet; one is to be set from the World Network p95 re-profile due 2026-10-28 (retro 10 action 3, `design/ux/world-network.md` Open Question 18). Do not invent one.

**Core purpose**
- [ ] **Agreement with the deployed mission.** For a selected contract, record the Brief's objective labels in order (with tier words and any `(+n CR)`), the KIT lines, route lengths for Alpha and Omega, patrol, garrison and civilian counts, the weather and front time, and the opening-hour weather line. After Accept and Deploy with no change to sector state or settings, each equals what the mission HUD shows (objective panel, weather, clock). Name the inputs compared.
- [ ] **Odds by intel.** At intel 1 the Brief prints `PROJECTED SUCCESS n%` and no `RISK INDEX` and no band word. At intel 2 or more, the same contract prints `RISK INDEX` with one of `LOW`, `GUARDED`, `HIGH`, `SEVERE` and no `PROJECTED SUCCESS`. At both levels the World Network row for that contract prints `CHANCE n%`.
- [ ] **Odds are visible without scrolling.** At 1280×720 and 90, 100, 110 and 125%, the odds row is fully visible in the tactical-map rail with the rail scrolled to the top (decision D2).
- [ ] **KIT lines.** For Glass Veil, Hollow Crown, Rust Haven and one generated contract of each type: every destroy, interact, escort and defend objective has a KIT line with the matching copy (N from `durationSec`); Glass Veil, SEIZURE and SUPPRESSION show none; a reach, eliminate or extract objective shows none. The DOM text of each line is sentence case; the rendered line is uppercase (D1); the `KIT:` tag is not Ledger Amber.
- [ ] **Hardened line.** On Hardened, MISSION NOTES begins with the Hardened profile line; on Standard it does not.

**Navigation**
- [ ] **Accept.** One click, or Enter or Space on the focused control, opens Assembly. Credits, Influence and Intel are unchanged. No confirm appears.
- [ ] **Lock and stale route.** With no contract selected the Brief nav tab shows a lock glyph, `LOCKED` and `NO CONTRACT SELECTED` as visible text and does not navigate. After a contract is selected it opens.
- [ ] **Route back.** From the Brief, the World Network tab returns with the same Focus and the same selected contract.

**Empty / error states**
- [ ] **No clipping, no truncation.** At 1280×720 and text scale 90 / 100 / 110 / 125%, no text is cut off, ellipsized or hidden by a clipped box, and no label overlaps another, including COMMS LOG entries (no ellipsis at any scale) and the recon briefing against the readout column. The comms weather line for a weather-front contract is read in full.
- [ ] **Overflow is reachable.** The last objective, COLLATERAL TOLERANCE and the last MISSION NOTES line can be scrolled into view in the dossier at every scale, and the rail's last row in the rail.

**Accessibility and layout** (per Standard tier)
- [ ] **Focus and labels.** Tab visits the two scroll regions, ACCEPT, then the four nav tabs; each control shows P-04 brackets, in high contrast too; ACCEPT's accessible name contains `ACCEPT CONTRACT`; the recon frame and the plan have labels.
- [ ] **Non-color cues.** In grayscale a tester can tell Threat levels (word and block count), the odds mode (label), the selected tab, and Route Alpha from Route Omega (name and dash pattern) apart.
- [ ] **Hit targets.** At 1280×720 and 100% scale every pointer target is at least 24×24 CSS px (measure the element box).
- [ ] **Contrast.** At 100% in default and high contrast, no text run is under 4.5:1 and none is under 10 px (the sweep method).
- [ ] **Motion.** With reduced motion on, no decorative sweep, route flow or scan bar moves. With it off, no more than one idle motion runs on the Brief.

---

## Open Questions

Items marked **As-built delta** record where the shipped screen (`src/ui/index.tsx` `MissionBrief`, `src/ui/ui.css` `.mb-*`, read 2026-10-23, plus the 2026-10-23 sweep) differs from this spec. They are inputs to implementation stories, not defects: no GDD AC fails on them unless stated, and none was filed as a bug by this spec.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | **As-built delta, hierarchy.** OBJECTIVES (with KIT lines, the playtest's missing information) sit below the portrait fields, Threat and Reward in the dossier scroll. At 100% Rust Haven's fourth objective is cut and the fifth row, COLLATERAL and NOTES need scroll; at 125% the dossier shows two objectives before the fade (screenshots). Options: reorder inside the dossier so OBJECTIVES follows Threat; compress the portrait block; accept the scroll. Needs the owner and the art-director (the silhouette is dossier fiction). Same record as the "useless info" density note | owner / art-director | Open |
| 2 | **Rail layout option.** The stats rail scrolls vertically with about 170 px empty at its left (`max-width: 168px`, right-aligned). A two-column stat grid would remove most of the scroll. D2 only moves the odds row first | art-director / ui-programmer | Open |
| 3 | **As-built delta, COMMS truncation.** `.mb-comms span` is `nowrap` with `text-overflow: ellipsis`. `brief-90.png` shows `VISIBILITY FUL…`; `brief-100.png` fits exactly. `sweep-brief.json` reports 0 clips at 90%, so the harness did not flag it (cause not determined). Front lines such as `HEAVY RAIN → LIGHT RAIN` are likely to truncate at 100% (inferred from text length). The full text is in `title`, which does not satisfy a visible reason. Spec: entries wrap, never ellipsize (Interface Rule 6) | ui-programmer | Open (story input) |
| 4 | **As-built delta, recon overlay.** At 125% the briefing block (62% width, 4 lines wrapping to 7) overlaps the readout column: `MODE: IR-MONO` is partly covered (`brief-125.png`). The sweep checks panel overlap, not label overlap. The frame is `overflow: hidden` with no scroll, so more or longer briefing text clips rather than scrolls. At 100% the last briefing line also runs over the target building art | ui-programmer / art-director | Open (story input) |
| 5 | **As-built delta, text scale and size.** `OPERATION` (17.92 px), the Threat word (20.48 px) and the Reward figure (29.44 px) use `clamp()` on viewport width and do not follow `--text-scale` (verified in `ui.css`; `.mb-threat-main b`, `.mb-reward b`, `.field .value.big`). Reward is `nowrap`; the free width fits about 7 characters, and the maximum reward value was not determined (Economy not read) | ui-programmer / economy owner | Open |
| 6 | **As-built delta, colour roles.** `.mb-obj-kit b { color: var(--amber) }` makes the `KIT:` tag Ledger Amber (money only). `CLEARANCE LEVEL: EXECUTIVE` prints red (`b.red`), a decorative use of the danger hue. Rendered colour was not sampled. Spec: `KIT:` in Signal Cyan (D1); `EXECUTIVE` in Ink | ui-programmer / art-director | Open (story input) |
| 7 | **As-built delta, literals that read as data.** In `MissionBrief` JSX: `LOW (10%)` and the meter position (`left: '10%'`), `ETA RESPONSE: < 06:00`, `CLEARANCE LEVEL: EXECUTIVE`, `GRID REF: 77-2A`, the COMMS timestamps and the `INTEL:` and `LOCAL:` lines, the recon readouts. `CONTRACT ID` and `ID: <initials>-77` are derived by string. Whether Economy or Tactical supply a collateral tolerance, a response ETA or a clearance was not verified. Interface AC5 requires what the Brief states about the deployment to match it, so each needs a fiction-or-data ruling | game-designer / economy owner | Open |
| 8 | **As-built delta, clocks.** The header chip shows the strategic stamp and the clock runs on this Screen, but there is no Pause or speed transport and no `PAUSED` word (P-20 lists "the four Screens"). The recon panel header prints a second time (`hh:mm:ss | IR-MONO`), which appears to be wall-clock UTC (inferred from `useUtcClock`/`utcNow`; not read). Decide whether the Brief gets the transport and whether the recon time is fiction | ux-designer / owner | Open |
| 9 | **Brief drift and expiry.** Counts, Chance and Risk derive from live `worldStore.sectors`, while Deploy freezes `{sector, Control, Unrest}` at deploy time (ADR-0009, per the World Network spec), so the Brief the player read can differ from what deploys if sector state moves in between. No document says what the player is told. Also: a generated offer expiring while the Brief is open goes through `goto('world')` with no message; whether `resolveMission` returns null on expiry was not verified | systems-designer / world-network owner | Open |
| 10 | **Label and band wording.** The World Network prints `CHANCE n%`; the Brief prints `PROJECTED SUCCESS n%` for the same number. Interface calls it "Chance percentage". Whether the labels should match was not decided. At intel 2+ the Brief prints `RISK INDEX <index> // <BAND>`; the GDD says "bands" and not a percentage, and does not say whether the numeric index may print | game-designer | Open |
| 11 | **Objective tier words.** Tier words are assigned by position among non-optional objectives, capped at the third, so a contract with more than three mandatory objectives prints `TERTIARY` repeatedly (Rust Haven prints it twice, `brief-100.png`). What tiers mean for scoring was not verified | game-designer | Open |
| 12 | **As-built delta, readout size and tab stops.** Art bible §7.5 sets data and readout text ≥12 px. On the Brief, objective rows are 10.5 px, KIT lines, notes, briefing and the rail labels 10 px (all at the 10 px floor after IF-036). Which of these are readouts is a ruling; raising them costs more scroll in an already overflowing dossier. Separately, the two scroll regions are Tab stops with content-derived names; P-15 does not require a stop, and they are the only keyboard scroll. Decide whether they stay and what `aria-label` they take | art-director / accessibility-specialist | Open |
| 13 | **Reward figure and tokens.** Art bible §4.1 sets payouts in Amber Hot and §2.9 says the amber payout figure ticks at the Brief. As built the figure prints `#f2fff9` (a hex not in the palette; also `#e8fbf2` for field values and `#060b0a`, `ui.css` lines 1990, 1998, 2075) and does not tick. Token discipline (§8.9) and the tick need the art-director | art-director | Open |
| 14 | **Motion not read.** The Brief CSS has `.mb-sweep`, `.mb-sil-scan`, `@keyframes route-flow-tac` and `.mb-target` blocks whose durations, loops and reduced-motion fallbacks were not read. The idle-motion count on the Brief is unknown | ui-programmer / qa-lead | Open |
| 15 | **Contrast over art.** The sweep method for text over the SVG recon art (briefing, callout) was not determined from its README, so 4.5:1 there is reported as the sweep's result, not independently verified | qa-lead | Open |
| 16 | **Sprint 10 QA record not read.** D2 answers the rail gap named in the task from the 2026-10-23 screenshots only; other gaps in that record are not addressed here | qa-lead | Open |
| 17 | `.claude/rules/ui-code.md` asks for gamepad support and a localization system. ADR-0017 forbids gamepad and touch and no localization system exists (same call as the World Network and Menu specs). Every Brief string is a literal or game data. No `design/player-journey.md` exists either | owner | Open (rule file) |
| 18 | **Replay and variant.** The Replay entry's code path and what the Brief shows differently for an already-won contract (`missionVariant(m, contractsWon.includes(m.id))`) were not read | ui-programmer | Open |
| 19 | **No open-time budget.** The Interface GDD forbids inventing one. The World Network p95 re-profile due 2026-10-28 is to set it; the Response criterion gains the number then. Cold-cache path: opening a contract builds a city and two A* legs in the click unless World Network warmed the cache (`briefMap.ts` comment) | performance-analyst | Open (dated) |
| 20 | **Not exercised.** Windows below or above 1280×720, screen-reader output, a Brief for an intel-2+ contract and a Hardened contract (the measured capture is Rust Haven, intel 1), and a weather-front contract were not captured in the 2026-10-23 sweep. Their rows above come from code | qa-lead | Open |
| 21 | **KIT case.** Carried from IF-015 (advisory): render uppercase or sentence case. **Resolved as D1: uppercase; DOM and data stay sentence case; `KIT:` tag in Signal Cyan.** Owner may overrule | owner | Closed 2026-10-23 (delegated); code: tag colour only |
| 22 | **Stats rail reads only when scrolled.** **Resolved as D2: scrolling is acceptable under P-15 for the reference counts; the odds row moves first.** Owner confirmation of the reorder | owner | Closed 2026-10-23 (delegated); code: reorder rows |
| 23 | Accessibility tier: defined (Standard) | — | Closed |
| 24 | **GDD punctuation.** `design/gdd/interface.md` AC31 prints the destroy line "the fast tool, gunfire works slowly"; the Screens table, story IF-015 and `kitLine.ts` print "the fast tool; gunfire works, slowly". The code follows the Screens table. This spec does not edit the GDD | game-designer | Open |
