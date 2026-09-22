# Interface

> **Status**: Approved (independent `/design-review`, full pass 3, 2026-09-16; D2 alias reconciliation only)
> **Author**: extract from docs/game-design.md §12, §13, §14 (session rules §4; Settings/Quality/UX §17, §20)
> **Last Updated**: 2026-09-16
> **Implements Pillar**: One corporate operating system; Information is operational power; Command, do not micromanage
> **Living spec**: `docs/game-design.md` §12, §13, §14 — this file aliases them; do not fork rules
> **Specialists (full)**: game-designer, systems-designer, ux-designer, ui-programmer, economy-designer, qa-lead, gameplay-programmer, audio-director, lead-programmer, performance-analyst; senior synthesis: creative-director. Full pass 3: APPROVED for the current D2 document. Unresolved flow decisions and implementation/runtime verification remain separate; see [review log](reviews/interface-review-log.md).
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08
> **Wear / invoice / persist dual-homes**: Interface presents. It does not price, shove sectors, grade roster, or commit the campaign blob.

## Overview

The interface is the game’s character: a secure corporate OS wrapped around a readable tactical picture, not a HUD pasted on a shooter. Every surface is a module of the same terminal — near-black, teal, amber, red — so Menu, the four **Screens** (World Network, Research, Brief, Assembly), the Mission HUD, and **Debrief** are rooms of one building, not two visual languages ([pillar 5](game-pillars.md)). The director never walks the street; they read, authorize, and issue a few orders through this OS. DOM sits around and over the 3D scene. Critical state is never color alone. Text must remain legible at **1280×720**; clipping or truncation at that size is a bug. Chrome cannot bury **Select / Move / Attack / Hold Ground / Hold Fire**. Debrief is the invoice beat: Interface **presents**; Economy **prices**; World Network **applies** sector/unrest/ownership/Influence/Intel; Roster **grades** KIA/injury; Persistence **commits once**. Without this system the director has no terminal, the five verbs drown in spectacle, and the two-layer loop is unreadable.

Rules stay in `docs/game-design.md` §12, §13, §14. This overview does not fork them.

## Player Fantasy

You sit the desk. The terminal is the character, not a skin over a shooter. You read one OS: Scan and district are different surfaces of the same world; Brief, Assembly, Research, and the HUD are different rooms of one building. Teal is live state. Amber is focus and authorization. Red is danger and failure. You never need a second visual language to “play.” A good order is small and timed because the board is visible — cones, patrols, the minimap with up = up — and Hardened does not hide that map. Pause prints the same bindings the input uses. Abort is a two-step discard, not a checkpoint. Debrief is paperwork: `REPLAY // FEE ALREADY COLLECTED` when the fee is already collected; collateral is a line item, not a splash. The fantasy fails if chrome buries the five verbs, if “gameplay” looks like a different product from “menu,” if critical state is color alone, if 1280×720 clips, or if the mission can be saved from the pause modal.

This serves **One corporate operating system**, **Information is operational power**, and **Command, do not micromanage**. Secondary: **Violence has corporate consequences** (invoice chrome) and **The two layers feed each other** (header Credits / Influence / Intel / Roster / strategic clock on the four Screens; HUD collateral is a count Economy will price). It does not own Credits or collateral pricing (Economy), sector shove (World Network), verb validity (Tactical), roster KIA/injury (Roster), campaign commit (Persistence), or mix buses (Audio).

## Detailed Design

### Core Rules

1. **Alias.** Surfaces, principles, minimap, pause, tutorial, accessibility, default bindings, and art direction live in `docs/game-design.md` §12, §13, §14. Session flow lives in §4. Settings / Quality / telemetry chrome live in §17. UX acceptance lives in §20. CONTEXT.md owns names. This section names owners, states, and DTO edges. Do not fork those tables. Do not invent hex, remap codes beyond §13, or performance budgets.

2. **One system, one wrap.** Screens, HUD, controls, and art rules are **one Presentation wrap**. Do not split them into sibling systems. Art is not a runtime system. Audio is the next index row — mix ownership is Audio.

3. **Internal module map (do not split).**

| Module | Owns in this system | Does not own |
|---|---|---|
| Screens | Menu fiction; four Screens shared header + nav; Brief lock; Assembly reachability; Debrief invoice chrome; campaign banners on World Network; first-visit overlay | Strategic clock math (World Network); Credits ledger (Economy); research graph (Research); roster/mass gate (Roster); campaign blob (Persistence) |
| HUD | District clock, live Weather, Alert, Credits, live Collateral **count**, squad cards, objectives, Comm log, drawn weapons, ability bar, item counts, grenade control, minimap, pause chrome, result banner, first-mission toasts | Verb validity and camera pose (Tactical); collateral CR (Economy); Alert derivation (Tactical: living CorpSec in Combat) |
| Controls | Default bindings; one remap table read by pause, tutorial, and handlers; reserved pause / operative slots / mouse | What Select/Move/Attack/stances **mean** (Tactical) |
| Art / Spectacle | Palette language; no external art; unit chrome language; Quality vs building ghosting | Mixer (Audio); `tokens.ts` / `index.css` as the implementation pair (engineering contract, not a second palette) |

4. **One OS (lead).** Every screen is a module of the same terminal. Near-black ground. Teal = selection and live state. Amber = focus, authorization, and the active objective. Red = danger, locks, damage, and failure. Green = completion. Small monospace uppercase labels; primary values larger than their labels. Thin technical borders, scanlines, vignette, radar sweeps, data chips, coordinate labels, barcodes. **No second visual language for “gameplay” versus “menu.”**

5. **DOM around and over the 3D scene.** The Scan is a flat projection, not a globe. The District is the mission layout, not the Scan. Minimap up = screen up (shared camera yaw — Tactical owns the pose; Interface presents that orientation).

6. **Readability floor.** Text must remain legible at 1280×720. Clipping or truncation at that size is a bug. Smaller windows keep the minimum layout and **scroll**; they do not compress panels. Critical state is **never color alone**. Building ghosting survives every Quality tier because it is readability, not spectacle.

7. **Typical use.** Menu (Continue or New Operation) → World Network (job between missions) → Research and/or Assembly from nav → select contract → Brief unlocks → Assembly → Deploy → Mission HUD (five verbs) → result banner → Debrief invoice → World Network (selected contract cleared) or authored-contract Brief Replay. Quiet replay still debriefs ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)).

8. **Player cannot.** Rotate or tilt the camera in play. Mid-mission save from pause. One-click New Operation or one-click Abort. Hide the minimap as Difficulty. Treat Debrief as a Screen. Treat Menu / Mission / Debrief as one of the four Screens. Paste a shooter HUD over the district. Load `public/` art. Speak as an operative.

9. **Surfaces (presentation only).**

| Surface | CONTEXT name | What Interface presents | What it does not decide |
|---|---|---|---|
| **Menu** | not a Screen | Secure-system fiction; audio unlock on first gesture; Continue iff valid campaign blob; distinguish never-started from invalid/unreadable; New Operation two-step erase with failed-write feedback; Settings | Validity and durable-write result (Persistence) |
| **World Network** | Screen | Job between missions: Scan, Focus, four printed numbers, clock, Timeline, Feed, Credits, Influence, Intel, Roster, open contracts, campaign-complete / campaign-failed banners; first visit one-shot overlay teaches the clock as a resource, Influence enablement and paid-versus-printed Tax alongside panel groups and the Research tab; Live/Review distinction and spend refusal reasons | Control / Unrest / Tax / Influence math (World Network); contract instances (Economy) |
| **Research** | Screen | Three branches; project states locked / available / active / researched; occupancy; remaining time; home bay; authorization as a **spend**, not a browse | Cost refuse (Economy); `sync(t)` (Research) |
| **Brief** | Screen | Plan. The map **must be the District**. Locked on the nav until a contract is selected. Intel &lt; 2: Chance percentage. Intel 2+: **Risk index** bands replace that percentage on the Brief; the World Network still prints Chance | `missionChance` / `risk_index` math (Tactical/Brief compute; World Network only gates intel 2+) |
| **Assembly** | Screen | Inspect, assign 1–4, wear or pin bays, research-adjusted stats from what is worn, two Item slots, 400 kg gate; hire cost versus Credits, full-roster and unaffordable refusal reasons. Reachable between contracts; **Deploy is refused** without a selected contract | Mass math and Ready/Injured (Roster); hire refuse (Economy) |
| **Mission HUD** | not a Screen | District clock, live Weather, Alert, Credits, live Collateral count, squad cards (health, magazine, selection, stances), objectives, Comm log, drawn weapons, ability bar, item counts, grenade control, minimap, pause, result banner, first-mission tutorial toasts | Five-verb validity (Tactical); 2.5 s of Tactical elapsed time from result → Debrief (not guaranteed visible banner duration; see Rule 18) |
| **Debrief** | not a Screen | The invoice, including zero-valued money rows. Owners apply once in memory; Interface shows that it is **unfiled** until a successful next-Screen autosave. Quiet replay names the zero and still shows roster and ETA | Pricing (Economy); sector shove (World Network); KIA/injury (Roster); durable commit (Persistence) |
| **Settings** | overlay | Audio, remaps, accessibility, Quality, Difficulty, telemetry. Persists separately from the campaign so New Operation keeps preferences | Settings slot ownership (Persistence); mix correctness (Audio); Hardened extras (Tactical) |
| **Balance** | overlay | Opt-in dashboard of telemetry records. `win_rate` from Persistence. Abort **count** beside it. Export local JSON. Clear two-step | `win_rate` formula (Persistence). `abort_rate` is named, not specified — do not invent |

10. **Four Screens.** Shared header: title, subtitle, Credits, Influence, Intel, Roster, strategic clock. Shared nav: World Network, Research, Brief, Assembly. Strategic time runs here ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Menu, mission, and Debrief do **not** run it. Accepting a contract is free and goes straight to Assembly — no buy-in, no second confirm. Returning from Debrief to the World Network **clears** the selected contract; for an authored contract, Replay is the path back into that Brief without reselecting; generated contracts have no Replay control.

11. **Minimap.** A tactical instrument, not a decoration. Shares the camera’s yaw so up is up. Shows buildings, roads, Extraction and checkpoints, the active-objective pulse, CorpSec patrol/suspicious/combat, sight cones for suspicious and combat CorpSec, civilians, operatives, and the camera’s ground footprint. **Three zoom levels.** Click and drag steers the camera. **Difficulty must not strip this information.** Zoom magnitudes for those three levels are unnamed in the living spec — do not invent them.

12. **Pause and Abort.** Space or Escape opens a modal pause: the sim and the camera freeze, every remappable binding prints from the **same table** the input uses, focus is trapped, Resume returns, Settings stays inside the freeze, and Abort is a **two-step confirmation with a three-second arming window**: first activation arms, a second while armed confirms immediately, and timeout disarms without discarding. Confirmation discards the mission without a Debrief ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)). Abort chrome is Interface; discard is Persistence + ADR-0002.

13. **Tutorial and advisories.** The first mission teaches with dismissible HUD toasts — Select, Move, Attack, stances, role ability, items, weapon swap, Extraction — that name the **current** bindings and advance on action or dismiss. Skip Tutorial marks all steps seen. Toasts **never block input** and **never pause the sim**. One-shot advisories fire **at most once per campaign**: an operative under 35% with med kits in stock; the first combat Alert; a role ability left ready for a minute; a valid deployment in Roster’s **heavy mass tier**. The last is the existing heavy-tier speed lesson (`src/game/world.ts` startup / `hint-overweight`), not a deployment beyond the refused mass gate; the living §12 “over the mass gate” wording conflates those conditions. A weather front writes a Comm-log line (Tactical emits; HUD prints).

14. **Accessibility (designed-in).** Contextual accessible labels on major controls. Research project nodes select for inspection on pointer activation, Enter or Space; authorization uses the separate Authorize control. Timeline: arrows, Home, End. Pause and Settings trap and restore focus (including nested Settings return). Remappable controls, with pause, operative slots, and mouse **reserved**. Reduced motion: decorative sweeps gone, looping pulses frozen, rain at minimum. High contrast: brighter ink, stronger frames. Text scale **90 / 100 / 110 / 125%**; screens scroll rather than clip. Product backlog (not open design, not a ninth system): full keyboard travel across every panel, color-vision presets, captions for audio cues, screen-reader pass on the tactical HUD (`docs/game-design.md` §19.6).

15. **Controls.** Defaults in §13. Every keyboard action **except pause and the operative slots** can be remapped. Pause menu, tutorial, and input handlers read **one table**, so a remap renames itself everywhere at once. Mouse actions are reserved (not remapped).

    Camera (input only; pose is Tactical): W/Up pan forward; S/Down back; A/Left; D/Right; F recenter on the living squad; `=` / Numpad `+` zoom in; `-` / Numpad `-` zoom out; wheel zoom; minimap click or drag steers.

    Squad: 1–4 / Numpad 1–4 select slot; 0 / backtick / Numpad 0 select all living; Backspace clear selection; X Stop; H Hold Ground; C Hold Fire; V swap weapon; Space / Escape Pause.

    Abilities and items: Q role ability for the selection; E / M med kit on the lowest-health selected operative; R power cell finishes the selected operative’s ability cooldown; G arm or cancel grenade targeting.

    Mouse: left click operative Select; Shift+left add/remove; left drag box select; Shift+left drag add box; left click bare ground clear; right click ground Move; right click hostile Attack; double-click squad card center camera on that operative.

16. **Art constraint.** **No external art assets.** Textures, portraits, figures, icons, unit geometry, the Scan, and UI decoration are generated in code. An external pipeline is a deliberate change of project, not a polish pass. Units are assembled from simple geometry. Operatives: cool armor, personal accent colors, slot tags, health pips, selection rings, route feedback. CorpSec: dark coats, red visors, rings, garrison marks, alert and suspicion markers. Hits flash; operatives flash red, everyone else amber, with a brief flinch. Effects stay sparse and informative. Bloom is emissive only; Quality may drop it. Neon stays readable at dusk and night. Opening hour lights dusk or night and is frozen ([ADR-0007](../../docs/architecture/adr-0007-opening-hour.md)); the HUD clock still ticks; the sky does not.

17. **Quality.** Auto / High / Medium / Low is a **player setting** in the settings slot, not a design lever. Using Quality to hide building ghosting or the minimap violates pillar 2.

18. **Debrief cut.** One partitioned outcome; Interface lists rows. Economy prices all five money lines (Reward, optional bonus, Collateral count and CR, net payout, new balance — [Economy UI Requirements](economy-and-contracts.md#ui-requirements)), **including zeros**. Reward is the stored contract fee even on Loss or quiet replay; it is not the amount paid. Interface passes through owner-supplied values; new balance may include Tax catch-up, which is not a sixth money row. World Network applies sector/unrest/ownership/Influence/Intel. Roster applies KIA/injury/Experience. Persistence commits once on the next Screen. **Abort = no Debrief = Interface never builds the invoice.** Quiet banner copy: `REPLAY // FEE ALREADY COLLECTED`. All five money rows remain visible on Loss, quiet replay and a clean Win (Open Question 1 is closed by Economy).

    **Durability is separate from apply-once.** Present Persistence’s never-started / invalid-unreadable / valid outcomes on Menu; Debrief’s in-memory invoice is visibly **unfiled** before leaving or reloading. A successful World Network-return or Brief-Replay autosave ends that unfiled state. A failed write must not read as successful filing or durable New Operation erase. Copy/layout stay `/ux-design`; Persistence supplies the status and owns storage. These are requirements from [Persistence UI Requirements](persistence-and-validation.md#ui-requirements), not a claim that current code exposes those outcomes. No save verb or Debrief autosave is added.

    **Result timing is Tactical-owned.** The existing delay is 2.5 seconds of accepted Tactical elapsed time after result detection (`src/game/world.ts` `maybeOutcome`), not a minimum wall-clock display duration. Pause stops that time; catch-up may cross both result and Debrief boundaries before another browser paint. Interface neither adds a DOM timer nor drops catch-up time. Result-phase input/pause and when the outcome becomes final remain Tactical/UI follow-up; this alias does not approve freezing the outcome or changing input behavior.

19. **Forbidden.** Second visual language; shooter HUD; `public/` art; color-only critical state; clipping at 1280×720; compressing panels instead of scroll; hiding minimap as Difficulty; Quality as a design lever; mid-mission save; one-click Abort or New Operation; Debrief as a Screen; Menu/Mission/Debrief as one of the four Screens; new verbs in chrome; spoken VO; forking `mass_gate`, `injury_hp_frac`, `win_rate`, or `risk_index`; inventing `abort_rate`; inventing minimap zoom metres; copying weapon / research / sector tables.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Session phase | Menu / four Screens / Mission / Debrief | Menu → World Network (Continue or New Operation). Screens ↔ via nav (Brief locked until a contract is selected). Assembly Deploy → Mission. Win/Loss → result state → 2.5 s of Tactical elapsed time → Debrief (Rule 18; no minimum visible duration). Debrief → World Network (clears selected contract) or authored-contract Brief Replay. Abort from pause → discard, no Debrief; in-session landing is Open Question 8, not hydrate |
| Brief nav | Locked / Unlocked | Unlocks when a contract is selected. Locks again after Debrief → World Network |
| Assembly Deploy | Enabled / Refused | Refused without a selected contract, with zero assigned, with any assigned Injured, or with `squad_mass` &gt; 400 kg (Roster owns the gate; Interface shows the reason) |
| Strategic header clock | Running / Paused; speed 1× / 2× / 4× / 8× | Only on the four Screens. World Network owns the clock; Interface presents Pause and Clock speed |
| Mission pause | Live / Paused (modal) | Space/Escape. Sim and camera freeze. Settings nested inside. Resume returns. Abort arms a second activation for up to 3 real seconds; timeout disarms |
| Abort confirm | Idle / Armed / Confirmed | First activation → Armed, no discard. Second activation while Armed → Confirmed immediately, no Debrief or campaign write. Timeout → Idle while still paused; the next activation only re-arms. Disarming without confirmation does not discard |
| New Operation | Idle / Armed / Confirmed | Two-step erase. Armed does not erase. Settings survive confirm |
| Remap table | Defaults / player remaps | One table. Pause, tutorial, and handlers read it. Pause, slots 1–4, and mouse reserved |
| Tutorial | Unseen steps / seen / skipped | First mission toasts. Advance on action or dismiss. Skip Tutorial marks all seen. Persists with campaign (Persistence) |
| Advisories | Unfired / fired (once per campaign) | Under 35% HP + med kits; first combat Alert; ability-ready minute (see formula/source distinction); valid heavy-tier deployment, not an over-limit deployment |
| Text scale | 90 / 100 / 110 / 125% | Settings slot. Screens scroll rather than clip |
| Motion / contrast | Default / reduced motion / high contrast | Settings. Reduced motion freezes decorative loops and drops rain to minimum |
| Quality | Auto / High / Medium / Low | Settings. Ghosting remains. Bloom may drop |
| Difficulty chrome | Standard / Hardened | Settings; survives New Operation. Must not strip minimap |
| Overlay | None / Settings / Balance / pause / toasts | Settings and Balance overlay the current phase. Toasts never block, never pause |
| Invoice | None / Building at Debrief / Applied once in memory | Abort: never built. All five priced money rows, including zeros. Quiet: banner names the zero |
| Filing status | Unfiled / durably filed; failed write remains unfiled | Debrief is unfiled. Successful next-Screen autosave (World Network or Brief Replay) files it. Failure is visibly not success; Persistence supplies outcomes |
| Menu campaign state | Never-started / invalid-unreadable / valid | Continue absent for the first two, present for valid. Distinct reason for invalid-unreadable; New Operation write failure is not a durable-erase success |
| Telemetry | Recording off/on; retained log empty/nonempty | Off stops appends, not retention. Clear empties the log; New Operation preserves it. Entry-point policy is Open Question 9 |

### Interactions with Other Systems

Presentation only. Do not live-query the running mission to price or shove. Do not call chrome “the Snapshot DTO.”

| Other system | In (Interface receives) | Out (Interface emits) | Interface owner |
|---|---|---|---|
| **World Network** | Focus, four printed numbers with Tax payment eligibility, Feed, Timeline Live/Review state, Influence enablement and refusal reasons, first-visit teaching requirements, Intel level (Chance vs Risk chrome), campaign banners, Scan list | Focus, Pause, Clock speed, Influence spends, contract select | WN owns board and clock. Locked generated offers **do not appear** (WN Core Rule 10) — do not invent a second hide rule |
| **Economy** | Credits header; overdraft-disabled authorize; invoice money lines; quiet flag | Select contract (free); Abort (no invoice) | Economy prices. Interface does not debit |
| **Research** | States, occupancy, home bay | Authorize (a spend) | Research owns graph and `sync(t)` |
| **Roster / Assembly** | Dossier, bays, mass/tier, gate reason, candidates with hire cost/affordability/full-roster refusal, debrief roster lines | Assign / inspect / pin / Item slots / hire / Deploy | Roster owns bodies and `mass_gate`. Interface shows the refusal |
| **Tactical mission** | HUD data: tactical clock, Weather, Alert, live Collateral **count**, squad cards, objectives, Comm log, minimap contents, result, Tactical-owned 2.5 s elapsed delay (Rule 18) | Input: Select / Move / Attack / Stop / stances / camera pan-zoom / pause / Abort confirm / Q / items / grenade / swap | Tactical owns verbs, pose, counts. Interface owns chrome. Hardened must not strip minimap **presentation** of Tactical data |
| **Persistence** | Menu validity/reason; invoice filing and write-failure outcomes; Settings slot; retained telemetry records for Balance | Continue / New Operation two-step / Settings writes / telemetry export and Clear two-step / Replay vs World Network return | Abort confirm chrome is Interface; discard rule is Persistence + ADR-0002 |
| **Audio** ([GDD](audio.md)) | — | UI click, confirmation, pause, authorize, overlay open/close | Four channels under a master. UI cues sit below weapon reports. Strategy bed owns the four Screens. Mix is Audio |

**Sibling conflicts (do not silently resolve):**

1. **Zero-value invoice rows — closed.** Economy requires all five priced money rows, including zeros, and stored Reward on Loss/quiet replay. Interface follows that contract (Open Question 1); conditional row hiding in current code is implementation drift, not an open policy.
2. **`win_rate` at `won + lost = 0`.** Persistence GDD Open Question 2. Interface presents Balance; do not invent hide / 0 / “—”.
3. **`abort_rate`.** Named beside win rate. No denominator. Do not invent (Open Question 3).
4. **Telemetry log vs New Operation.** Persistence OQ 1 closed: log survives; Clear is the erase ([ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md)).
5. **Reload on Debrief vs telemetry row.** Persistence OQ 7 closed: accepted mismatch — session log, not a campaign transaction ([ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md)).
6. **Worn ids dual-home.** Research vs Roster. Assembly chrome shows what Roster/Research already resolved. Do not invent a third cut.
7. **Stale sibling footnotes** (“Interface not extracted yet”) are documentation drift after this file exists.
8. **Abort landing.** Persistence owns discard, not the in-session destination. Its Open Question 8 remains Interface / living-spec work; current `src/ui/Hud.tsx` routes to World Network, which resumes normal Screen clock/autosave behavior. That source fact does not close the parked design question.
9. **Balance access.** Retention is settled; access while recording is disabled is not. Persistence’s never-enabled clean-origin AC says Balance is not offered; current Settings/Debrief entry points are unconditional. Preserve that distinction as Open Question 9 rather than silently changing either policy or code.

## Formulas

Do not fork. Canonical chrome numbers: `docs/game-design.md` §12, §13, §4, §17. Interface does **not** own `hit_chance`, `risk_index`, `collateral`, `net_payout`, `tax_yield`, `mass_gate`, `injuryRecoverySec`, or `win_rate`. Those stay on their source GDDs / registry. `abort_rate` is named, not specified.

The Abort confirmation window is defined as:

`arming window = 3 real seconds`, two-step; this is an expiry, not a minimum hold.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| arming window | — | int | 3 s | Real-time timeout scheduled by the first activation, independent of the frozen Tactical clock |
| steps | — | enum | {idle, armed, confirmed} | First activation arms; second while armed confirms immediately; expiry disarms |

**Output Range:** Discrete. Armed does not discard. Confirmed discards without Debrief or campaign write. Timeout returns to Idle while remaining paused. No explicit Cancel button is required: letting the window expire cancels the armed confirmation. Resuming instead leaves pause without discarding the mission. The exact ordering of a click and timeout delivered together is the existing event ordering, not a new equality guarantee.
**Example:** Pause → Abort → second activation after 1 s, before expiry → confirm immediately. Alternatively, let the 3 s timeout disarm → mission still paused; another activation only re-arms. Campaign state is unchanged by arming, expiry, or confirmed Abort.

The `text_scale` formula is defined as:

`text_scale ∈ {0.90, 1.00, 1.10, 1.25}`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| text scale | text_scale | float | {0.90, 1.00, 1.10, 1.25} | Settings discrete steps (90 / 100 / 110 / 125%) |

**Output Range:** Discrete four-step set. Not a continuous slider. At every step, 1280×720 must not clip or truncate; overflow **scrolls**.
**Example:** 125% at 1280×720 → same minimum layout, scroll to reach overflow; panels are not compressed.

The `ability_ready_advisory` formula is defined as:

`ability_ready_advisory fires once per campaign when a role ability has been left ready for ≥ 60 s`

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| ready time | t_ready | float | ≥ 0 s | Time the role ability has been ready unused |
| threshold | 60 | int | 60 | “A minute” in §12 |
| fired | — | bool | once per campaign | One-shot |

**Output Range:** At most one fire per campaign. Toasts never pause the sim and never block input.
**Example:** Ability ready for 60 s, advisory unseen → one toast. Later missions in the same campaign do not repeat it.

**Source distinction, not a new behavior:** the living-spec sentence above is the discovery-hint description. Current `src/game/world.ts` `checkHints` accumulates mission-local sampled Tactical time while any living operative has a ready ability, before the first nonempty ability order. `orderAbility` suppresses that check even when the attempted activation refuses. Pause contributes no ticks. This extract does not establish a per-operative continuous timer or successful-use-only suppression; reconciling that stronger reading is a gameplay/tutorial follow-up, not an approved behavior change.

**Named, not specified:** minimap **three** zoom levels — no metre table. Do not import code distances.

**Constants, not curves:** layout floor **1280×720**; Abort two-step; New Operation two-step; telemetry Clear two-step; result delay **2.5 s of Tactical elapsed time** (Rule 18; not a minimum visible banner duration); advisory HP **35%** (living spec §12 wording — do not silently equate to registry `injury_hp_frac` 0.35 without a living-spec sentence); heavy-tier advisory consumes Roster’s mass tier, not the separate `mass_limit_kg` **400** deployment gate.

**Not owned here:** `win_rate = won / (won + lost)` (Persistence; abort excluded). Chance clamp 35–95 and `risk_index` bands (Tactical). Clock speed 1×/2×/4×/8× (World Network). Alert 0–3 (Tactical). Camera zoom 44–115 m and 45°/55°/25° pose (Tactical).

## Edge Cases

- **If viewport is exactly 1280×720:** every surface must show without clipping or truncation. Overflow at text scale 125% scrolls; it does not compress.
- **If the viewport is smaller than 1280×720:** keep the minimum layout and scroll. Do not restyle into a mobile layout (out of scope).
- **If critical state would be color-only (selection, focus, injury/KIA, lock, objective, Alert, result):** add a non-color cue (label, pip, frame, copy). Color remains.
- **If Hardened is selected:** extra patrols/civilians come from Tactical. Minimap still shows cones, patrols, civilians, objective pulse. Stripping that information is a bug, not a difficulty lever.
- **If Quality is Low:** bloom may drop. Building ghosting **stays**. Minimap information **stays**.
- **If Brief has no selected contract:** Brief nav is locked. Assembly remains reachable. Deploy is refused.
- **If Brief is unlocked and Debrief returns to World Network:** selected contract clears; Brief locks; for an authored contract, Replay is the path back into that Brief without reselecting; generated contracts have no Replay control.
- **If Accept Contract is used:** go straight to Assembly. No buy-in. No second confirm. Accepting is free (Economy).
- **If Deploy is pressed with mass &gt; 400 kg, or zero assigned, or any assigned Injured, or no selected contract:** refuse; show the gate reason; do not start a mission.
- **If no valid campaign blob exists:** Continue is absent. Menu still offers New Operation and Settings. Present never-started distinctly from invalid/unreadable using Persistence’s outcome; do not imply the house never existed when a blob failed validation.
- **If Debrief has applied only in session memory:** show unfiled status before the director leaves or reloads. The first successful autosave on World Network return or Brief Replay files that result; a failed write remains visibly unfiled.
- **If New Operation or a next-Screen write fails:** show that durable erase/filing did not succeed. In-session New Operation may proceed, but the last successfully stored campaign may return after reload. Interface reports Persistence’s result; it does not retry by saving on Debrief.
- **If New Operation is activated once:** arm confirm; campaign unchanged. On confirm under successful storage conditions: erase campaign; Settings (including Difficulty, Quality, remaps, telemetry **toggle**) survive. Telemetry **log** survives. Clear is the erase.
- **If Abort is activated once:** arm the second activation for 3 real seconds; the mission remains paused. Confirming while armed discards immediately: no Debrief, invoice, or campaign write. If the timeout fires without confirmation, disarm and stay paused; another activation only re-arms. Landing after confirmation remains Open Question 8.
- **If a result is pending during a pause or long frame:** its delay follows Tactical elapsed time, not a separate UI timer. Paused time does not advance it; catch-up can produce result and outcome before a paint. Result-phase pause/input policy and finalization are owner follow-up, not permission to change the sim here.
- **If pause is open:** sim and camera freeze; remappable bindings print from the live table; focus trapped; Settings nested inside the freeze; nested Settings return restores pause focus (§20).
- **If a remap changes a bind:** pause, tutorial, and handlers all show the new bind. Pause, slots 1–4, and mouse cannot be remapped.
- **If the first-mission toast is on screen:** input still works; sim still runs. Dismiss or matching action advances. Skip Tutorial marks all steps seen.
- **If an advisory already fired this campaign:** it does not fire again.
- **If an otherwise-valid heavy-tier squad deploys and the heavy-tier advisory is unseen:** present the existing speed-penalty hint once. Over-limit Assembly refusal does not start a mission and is not this advisory trigger.
- **If a weather front hits:** Comm log prints the line; HUD Weather retunes. Interface does not re-sample Research.
- **If intel &lt; 2:** Brief shows Chance percentage; Event forecast and Risk index chrome stay gated. World Network still prints Chance. Tactical still **computes** both values.
- **If intel ≥ 2:** Brief replaces the percentage with Risk index **bands**. World Network still prints Chance. Do not cap or percent-label the index (Tactical/registry).
- **If quiet replay Debrief:** show `REPLAY // FEE ALREADY COLLECTED`. Roster and ETA lines still present. Present all five Economy-priced money rows, including zeros and stored Reward; do not treat displayed Reward as a new payout.
- **If telemetry is off:** append no new records. Previously retained records are not erased; Clear remains the erase and New Operation preserves the log. An empty log and a nonempty log with recording disabled are distinct states. Balance entry availability is Open Question 9; this retention rule does not resolve it.
- **If `won + lost = 0` on Balance:** do not invent a `win_rate` display (Open Question 2). Abort count may still sit beside it when abort records exist.
- **If two overlays would stack (pause + Settings, or toasts + pause):** Settings stays inside pause freeze. Toasts never block and never pause — they may remain visible but must not trap focus.
- **If reduced motion is on:** decorative sweeps gone; looping pulses frozen; rain at minimum (including a wet mission).
- **If the director clicks a locked generated contract:** it should not be on the Scan (World Network). Do not author a second “ghost locked row” rule here.
- **If color-vision backlog is requested as a ship gate:** it is product backlog, not a missing designed-in control. Do not fail the GDD for its absence.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Board and clock to present | Focus, Scan, four numbers, Tax payment eligibility, Feed, Timeline Live/Review, Pause/speed, spend refusal reasons, banners, first-visit teaching. Interface does not compute Tax or Influence |
| Hard, upstream | Economy and contracts | Credits and invoice numbers | Header Credits; overdraft disable; all five Debrief money lines including zeros. Interface does not price |
| Hard, upstream | Research | Program chrome | States, occupancy, home bay. Authorize is a spend |
| Hard, upstream | Roster and Assembly | Dossier and gate | Ready/Injured, mass/tier, wear/pin, hire affordability/full-roster refusal, Deploy reason |
| Hard, upstream | Tactical mission | HUD data and verbs | Five-verb input map; minimap contents; result state; 2.5 s of Tactical elapsed time before outcome (Rule 18). Chrome cannot bury verbs |
| Hard, upstream | Persistence and validation | Slots, validity and durability outcomes | Continue iff valid blob; never-started vs invalid reason; unfiled invoice and write-failure feedback; Settings slot; retained Balance records; New Operation / Clear two-step |
| Hard, downstream | Audio | Mix | UI bus clicks; strategy bed on the four Screens; [Audio GDD](audio.md) supplies mix requirements |

Bidirectional intent: every upstream GDD lists Interface as Hard downstream presentation. This file lists those six as hard upstream. Audio lists Interface as hard upstream for phase, unlock, Settings chrome and UI events; this file lists Audio as hard downstream.

**Not dependencies:** `hit_chance` (Tactical); `tax_yield` (World Network); hire 16,000–34,000 CR (Roster/registry).

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §12, §13, §16, §17. This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer. Do not add hex, autosave delay, or save-version integers.

| Knob | Owner | Too high / too low |
|---|---|---|
| Layout floor 1280×720 | §12 / §17 | Clipping is a bug; a second “mobile” layout is out of scope |
| Text scale {90,100,110,125}% | §12 | Continuous scale that clips; 125% that compresses panels |
| Abort confirm 3 s arming window, two-step | §12 / existing `PauseMenu.tsx` | One-click discard; confusing expiry with a mandatory hold |
| New Operation / telemetry Clear two-step chrome | Persistence / §4 / §17 | **Not an Interface retune** — Persistence owns erase/clear; Interface presents two-step |
| Result delay 2.5 s of Tactical elapsed time | Tactical §10 / Rule 18 | **Not an Interface knob** — no minimum-visible or independent UI timer guarantee |
| Tutorial toasts (non-blocking) | §12 | Modal tutorial that pauses the sim (forbidden) |
| Advisory under 35% HP / 60 s ability / heavy mass tier | §12 description; existing hint source; Roster mass tier | Spam every mission; confuse heavy-tier slowdown with forbidden over-limit deployment |
| Minimap three zooms | §12 | Unnamed metres — do not retune in this GDD |
| Quality / Difficulty vs information | §12 / pillar 2 | Hiding ghosting or minimap as a lever (forbidden). Slot values and New Operation survival are Persistence |
| Remap table (one table) | §13 | Pause/tutorial/handlers drifting apart; remapping pause or slots |

Palette tokens live in `src/index.css` **and** `src/ui/tokens.ts` together. That pair is an engineering contract (AGENTS.md), not a designer slider in this GDD.

## Visual/Audio Requirements

Presentation wrap is this system plus Audio. Spectacle is emissive city light (neon) and terminal chrome (scanlines, teal, amber, ink, monospace). Night and rain host it; they are not it.

| Event | Visual | Audio (owned by Audio; no new cue implied) | Priority |
|---|---|---|---|
| Selection / order | Rings, dashed routes, destination rings, click marks | Short UI-bus acknowledgement click — not VO | High |
| Authorization spend | Amber focus on the spend control | UI confirm | High |
| Overdraft / Deploy refuse | Disabled control + reason copy | No mandatory refusal sound; a disabled control need not emit an activation event | High |
| Alert / suspicion | Markers, cones, HUD Alert | Alert sting on combat bus (Audio) | High |
| Hit / stray fire | Operative flash red; others amber; brief flinch; colored tracers | Weapon reports above UI | High |
| Weather front | HUD Weather chip; Comm-log line | Rain crossfade (Audio); no new bed | Med |
| Objective complete | Amber active → green complete | Objective-complete cue | Med |
| Result / Debrief | Result banner then invoice | No celebration sting for payout | High |
| Quiet replay | `REPLAY // FEE ALREADY COLLECTED` | No fanfare | High |
| Pause / Abort armed | Modal; bindings list; two-step Abort | UI click; no mission-end sting on arm | High |

No spoken operative dialogue. No spatial audio model. No second visual language. No external art pipeline.

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:interface` to produce per-asset visual descriptions, dimensions, and generation prompts from this section. (This project forbids an external art pipeline; asset-spec would describe generated-in-code chrome, not imported art.)

## UI Requirements

This **is** the UI system. Screens and HUD belong here. Overlay set: Settings, Balance, pause, tutorial toasts.

| Information | Display location | Update | Condition |
|---|---|---|---|
| Credits, Influence, Intel, Roster, strategic clock | Four Screens header | On Screen tick / spend | Four Screens only |
| Control, Unrest, Tax yield, Garrison condition | World Network sector readout | Focus change / catch-up | Never defense rating or NETWORK THREAT; distinguish a printed Tax figure from Nexus-held eligibility to receive it |
| Live / Review, clock as resource, Influence state/reason | World Network Timeline, actions and first-visit overlay | Review pin / clock / owner-provided action state | Scan numbers stay live during Review; distinguish unaffordable, cooldown, no target and Antarctica refusals; first visit teaches Pause/speed, opening Influence and Tax payment eligibility ([World Network UI Requirements](world-network.md#ui-requirements)) |
| Chance % | World Network always; Brief if intel &lt; 2 | Contract / snapshot | Not a Risk index |
| Risk index bands | Brief if intel ≥ 2 | Actual deployment | Not a percentage; not on Scan as a substitute for Chance |
| Project states | Research | Authorize / `sync(t)` | Spend, not browse |
| Mass / tier / Deploy reason | Assembly | Assignment / items | Gate is Roster; heavy tier is distinct from over-limit refusal |
| Hire cost, affordability, roster-cap refusal | Assembly candidates | Candidate / Credits / roster state | Show cost against Credits and the reason hire is disabled: unaffordable or full roster ([Roster UI Requirements](roster-and-assembly.md#ui-requirements)) |
| Five-verb state | Mission HUD + pause bindings | Input | Chrome cannot bury verbs |
| Live Collateral **count** | Mission HUD | First squad-caused civilian hit | Economy prices CR later |
| Invoice rows | Debrief | Owners apply once in memory | All five priced money rows including zeros; Abort never builds it |
| Filing / write failure | Debrief; next Screen; New Operation feedback | Persistence outcome | Unfiled on Debrief; successful next-Screen autosave files it; a failed write is not filing/erase success |
| Continue and campaign validity reason | Menu | Hydrate | Continue iff valid; distinguish never-started from invalid/unreadable |
| Win rate, abort count, retained-record state | Balance | Read retained log; enabled appends or Clear change contents | Off stops appends, not retention. `win_rate` Persistence; `abort_rate` unspecified; access policy OQ9 |

**📌 UX Flag — Interface**: This system is the UX surface. In Phase 4 (Pre-Production), run `/ux-design` for Menu, World Network, Research, Brief, Assembly, Mission HUD, pause, Debrief, Settings, and Balance **before** writing epics. Stories that reference UI should cite `design/ux/[screen].md`, not this GDD directly.

## Acceptance Criteria

Living spec §20 UX plus click-through.md. Criteria are independently verifiable without the rest of this GDD. Open Questions are not ACs. Do not invent product performance budgets. Do not convert §20 playtest tasks (thresholds pending) into pass/fail gates. Do not re-own Tactical verb ACs or Persistence hydrate ACs except where chrome is the observable.

### One OS and layout

1. **GIVEN** every listed surface (Menu, World Network, Research, Brief, Assembly, Mission HUD, pause, Debrief, Settings) at 1280×720 and each text scale 90 / 100 / 110 / 125%, **WHEN** the surface is shown, **THEN** there is no clipping, no unintended overlap, and scrolled overflow remains reachable. Smaller-than-minimum windows scroll and do not compress panels.
2. **GIVEN** critical states selection, focus, injury/KIA, lock, objective, Alert, and result, **WHEN** each is shown, **THEN** each has a readable non-color cue in addition to teal/amber/red/green.
3. **GIVEN** Menu and Mission HUD captures, **WHEN** their styling is checked against living §12/§14, **THEN** both use the shared near-black ground, semantic teal/amber/red/green roles, monospace uppercase labels, primary values larger than labels, and technical borders. Record the observed elements and deviations; overall visual coherence is a recorded visual-review judgment, not an unnamed numeric gate.

### Screens and session chrome

4. **GIVEN** no selected contract, **WHEN** Brief navigation, Assembly navigation and Deploy are each exercised, **THEN** Brief cannot open, Assembly opens, and Deploy does not start a mission and shows the missing-contract reason.
5. **GIVEN** a selected unlocked contract and recorded seed/variant, Difficulty and relevant deployment inputs, **WHEN** Brief is opened and that same deployment is created, **THEN** Brief is reachable and its insertion, objectives, extraction, force/civilian counts, Opening hour and weather-front timing match the District. Record the compared inputs and fields; owner computation remains Brief/Tactical.
6. **GIVEN** Debrief returning to the World Network, **WHEN** the nav is read, **THEN** the selected contract is cleared and Brief is locked. For authored work, Replay returns directly without reselecting; the contract may also be selected again later. Generated work has no Replay control.
7. **GIVEN** intel &lt; 2 vs intel ≥ 2 on the same contract, **WHEN** Brief and World Network chrome are compared, **THEN** World Network still prints Chance; Brief shows Chance at intel &lt; 2 and Risk index **bands** (not a percentage) at intel ≥ 2.
8. **GIVEN** an available, unresearched project with prerequisites satisfied and its laboratory idle, **WHEN** Credits are below its listed cost, **THEN** Authorize is disabled and its unaffordable reason is visible. In a separate otherwise-identical affordable fixture, activating Authorize starts the project and shows Active rather than merely opening inspection; debit/start correctness stays Economy/Research.
9. **GIVEN** Menu with no valid campaign blob vs a valid blob, **WHEN** Continue is read, **THEN** Continue is absent vs present accordingly (Persistence owns validity).

### HUD, minimap, pause, tutorial

10. **GIVEN** a live mission on Standard and the same contract on Hardened, **WHEN** minimap contents are compared, **THEN** Hardened does not strip cones, patrols, civilians, or the objective pulse. Three zoom levels exist. Click/drag steers the camera. Minimap up = screen up.
11. **GIVEN** a live mission with no result yet, **WHEN** Space or Escape is pressed, **THEN** a modal pause freezes sim and camera, prints remappable bindings from the live table, traps focus, offers Resume, keeps Settings inside the freeze, and Abort is not a single click.
12. **GIVEN** a paused mission with Abort idle, **WHEN** it is activated once, **THEN** confirmation arms without discarding. A second activation before expiry confirms immediately, with no Debrief/invoice or campaign write. In a separate fixture, letting the three-real-second timeout execute without confirmation disarms and leaves the mission paused; the next activation only re-arms. Observe the Abort boundary before any later Screen tick/autosave; the landing choice is OQ8, not this criterion.
13. **GIVEN** the first mission with tutorial unseen, **WHEN** toasts for Select, Move, Attack, stances, role ability, items, weapon swap, and Extraction are shown, **THEN** they name current bindings, never block input, never pause the sim, and Skip Tutorial marks all steps seen.
14. **GIVEN** a weather front at its scripted tactical time, **WHEN** the front hits, **THEN** the Comm log prints a line and the HUD Weather chip matches live weather.

### Invoice and settings

15. **GIVEN** Tactical emits Win or Loss, **WHEN** result and outcome notifications are delivered, **THEN** Interface displays the result while still in Mission and enters Debrief on the outcome after Tactical’s 2.5 s elapsed-time delay. Test ordinary progressing time, paused time (delay does not progress), and a catch-up crossing both notifications before paint (Debrief may be the next painted surface). No minimum visible banner duration or separate UI timer is required. Abort emits no invoice; pricing is not checked here.
16. **GIVEN** a quiet replay finish, **WHEN** Debrief is shown, **THEN** the banner reads `REPLAY // FEE ALREADY COLLECTED`.
17. **GIVEN** recorded nondefault Settings (Difficulty, Quality, at least one remap, text scale, telemetry toggle) and a progressed campaign, **WHEN** New Operation is confirmed under successful storage conditions, **THEN** those Settings still match; campaign Credits, Intel, contractsWon, laboratories and tutorial-seen match Persistence’s canonical fresh-operation fixture. Do not duplicate opening values or call a failed durable erase successful (AC23).
18. **GIVEN** Pause then nested Settings then return, **WHEN** focus is observed, **THEN** focus restores to the pause modal (§20 nested Settings return).
19. **GIVEN** a focused Research project node, **WHEN** pointer activation, Enter and Space are exercised in separate fixtures, **THEN** each selects the project and displays its details without starting research or changing Credits or laboratory occupancy. **GIVEN** the selected available, unresearched project has satisfied prerequisites, an idle laboratory and sufficient Credits, **WHEN** its focused enabled Authorize control is activated by pointer, Enter or Space in separate fixtures, **THEN** each starts the project and presents its Active state; debit/start correctness remains Economy/Research. **GIVEN** the Timeline at a recorded live state, **WHEN** Left/Right, Home and End are exercised, **THEN** Left/Right move Review backward/forward within its window, Home selects the oldest point, and End returns Live; the Review action does not mutate live state. **GIVEN** Pause or Settings, **WHEN** Tab/Shift+Tab and close are exercised, **THEN** focus stays trapped while open and returns to the opening context when closed; nested Settings return satisfies AC18. These are separate observable checks, not a requirement for full keyboard travel across every panel.

### Click-through and flagged-not-Interface

20. **GIVEN** a click-through at 1280×720 following `docs/click-through.md`, **WHEN** the run is recorded, **THEN** the record names every unexercised screen or interaction. A partial run is not a pass of the unexercised set.

### Owner-provided presentation outcomes

21. **GIVEN** Persistence reports never-started, invalid/unreadable, and valid in separate Menu fixtures, **WHEN** Menu is displayed, **THEN** Continue is absent, absent, and present respectively; invalid/unreadable has a visible reason distinct from never-started. Interface does not validate the blob itself.
22. **GIVEN** an applied in-memory Debrief, **WHEN** it is displayed before any Screen return, **THEN** the invoice visibly reads as unfiled. After a successful next-Screen autosave, tested through World Network return and Brief Replay separately, filing status no longer reads unfiled. The success signal comes from Persistence, not merely navigation.
23. **GIVEN** Persistence reports a failed New Operation durable write or failed first Screen write after Debrief, **WHEN** the corresponding surface is shown, **THEN** it visibly reports failure rather than durable erase/filing success; an invoice remains unfiled. Use both World Network-return and Brief-Replay failure fixtures. Exact copy stays UX; storage failure/reload correctness stays Persistence.
24. **GIVEN** owner-supplied invoice fixtures for Loss, quiet replay and a clean non-quiet Win, **WHEN** Debrief renders them, **THEN** Reward, optional bonus, Collateral count/CR, net payout and new balance all appear and equal the supplied values, including zeros. Preserve stored Reward on Loss/quiet replay; identify it separately from paid net. A quiet Win fixture with Tax catch-up may have a higher new balance despite zero contract payout; do not add a sixth Tax money row or recalculate values.
25. **GIVEN** telemetry enabled with recorded history, **WHEN** recording is disabled, a mission finishes or Aborts, and recording is enabled again to inspect Balance, **THEN** the earlier records remain and the disabled interval added none. Successful Clear empties the log; New Operation does not. Test retained contents independently of the unresolved disabled-state entry policy (OQ9).
26. **GIVEN** an unseen heavy-tier advisory and an otherwise-valid heavy-tier deployment, **WHEN** the mission starts, **THEN** the existing speed-penalty hint appears once. A later valid deployment in the same campaign does not repeat it. An over-limit Assembly attempt is refused with its reason and never enters Mission; it is not the heavy-tier mission-hint trigger.
27. **GIVEN** World Network owner outputs, **WHEN** the sector readout, Timeline, Influence actions and first-visit overlay are inspected, **THEN** printed Tax is distinguishable from payment eligibility (opening Europe does not pay; opening North America does), Live/Review are distinguishable while Scan numbers remain live, and unavailable actions show their actual owner-reported reason (unaffordable, cooldown, no target, or locked sector). No Influence action is offered for Antarctica. First-visit teaching identifies Pause/Clock speed as control over strategic time, opening Influence as unaffordable rather than broken, and Nexus-held Tax eligibility—not only panel names. Do not recompute board rules in Interface.
28. **GIVEN** candidate offers with owner-reported costs, Credits and roster capacity, **WHEN** Assembly is shown in unaffordable and full-roster fixtures separately, **THEN** hire cost versus Credits is visible and hire is disabled with the matching reason. Overdraft and Deploy refusal retain disabled controls plus visible reasons; no refusal audio is required for either.

**Flagged — not Interface pass/fail:** Tactical five-verb validity and outcome-finalization changes; Economy CR math; World Network Control/Unrest; Persistence storage/validation correctness (its validity and durability feedback is Interface); `win_rate` at 0/0; `abort_rate`; unresolved Abort landing and disabled-state Balance access; §20 playtest thresholds; §20 performance budgets.

## Open Questions

| # | Question | Owner | Do not |
|---|---|---|---|
| 1 | Closed — all five priced money rows are visible, including zeros | [Economy UI Requirements](economy-and-contracts.md#ui-requirements) and its presentation ACs | Hide priced rows, zero stored Reward on Loss/quiet replay, or recalculate pricing here |
| 2 | `win_rate` chrome when `won + lost = 0` | Interface / Balance; Persistence OQ 2 | Invent hide / 0 / “—” |
| 3 | `abort_rate` expression and denominator | Interface / Balance; Persistence OQ 4 | Invent a formula |
| 4 | Closed — telemetry **log** vs New Operation | Persistence OQ 1; [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md) | Log survives; Clear is the erase |
| 5 | Closed — reload on Debrief vs an opt-in telemetry row | Persistence OQ 7; [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md) | Accepted mismatch (session log) |
| 6 | Minimap three zoom **metres** | Living spec §12 | Import code distances |
| 7 | Equating tutorial “under 35%” with registry `injury_hp_frac` 0.35 | Living spec §12 vs §8 | Silently merge the constants |
| 8 | Abort in-session landing after confirmation | Interface / living spec; Persistence OQ8 | Treat hydrate as the routing rule; silently choose Menu vs a Screen (current code goes to World Network) |
| 9 | Balance entry availability while recording is off, especially with retained history | Interface / Balance; Persistence never-enabled AC | Conflate access with retention; erase history or silently change the current unconditional entry points |

Living spec §19 closed questions stay closed. Accessibility backlog stays backlog.
