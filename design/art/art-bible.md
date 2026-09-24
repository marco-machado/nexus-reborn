# Nexus Reborn — Art Bible

> **Status**: Complete (all 9 sections) · Authored 2026-09-23
> **Review mode**: full · **Art Director Sign-Off (AD-ART-BIBLE)**: CONCERNS — all 8 items revised same day [2026-09-23]
> **Primary reference**: `inspiration/05-gameplay-ui.png`
> **Source concept**: `design/gdd/game-concept.md` · Engine/tech constraints: `docs/technical-preferences.md`

# Section 1 — Visual Identity Statement

**The one-line rule.** Everything on screen is a readout from one corporate terminal: the world and the HUD are a single continuous Nexus Global interface — cyan telemetry on near-black, wet neon for atmosphere only, red reserved for alarm, amber reserved for money — and any element that could not plausibly be rendered by the OS that runs the operation does not get drawn.

The approved reference (`inspiration/05-gameplay-ui.png`) fixes the target: a rain-soaked neon district at night, lit almost entirely in a narrow teal/cyan band, with red alarm accents and amber signage as the only saturated interruptions. The frame reads as one dense instrument panel — thin cyan hairline borders on translucent dark, monospace numerals, corner brackets, a wireframe minimap, operatives ringed in cyan on the ground — with no boundary you can point to where "the game" ends and "the interface" begins. That is not a styling choice; it is the game's thesis made visible. The player is the Operations Director: they never walk the street, they read a live feed and issue consequential orders.

## Principles

**1. One instrument, not two visual languages** *(serves Pillar 5 — one corporate operating system; secondary: Pillar 1)*
The mission world is not a stage the HUD floats over; it is data the terminal is displaying. Every panel, overlay, marker and world element shares one visual language: thin cyan hairlines, translucent near-black fills, monospace/technical typography, corner-bracket framing, dense numeric readouts, technical line-art silhouettes. *Design test:* when it is ambiguous whether a new element should read as diegetic world art or interface chrome, render it as terminal chrome — hairline cyan frame, translucent dark fill, monospace numerals — identical in language on both sides of the world/HUD boundary.

**2. Cyan informs, red alarms, gold costs** *(serves Pillar 2 — information is operational power; secondary: Pillar 3 — violence has corporate consequences)*
The world sits in a near-monochrome teal/cyan wash so that saturated color carries meaning, never decoration: cyan and its ring/border treatment mark operatives, selection, and actionable information; red appears only when the operation is in alarm or blood is about to be paid for; gold/amber appears only on credits, payouts, and corporate cost. Neon signage may glow amber as environment, but interface semantics never borrow it. *Design test:* when choosing a color for a new state, effect, or accent, cyan for anything that informs an order, red only for active alarm or threat-state change, gold/amber only for credits and monetary cost — a color needed for beauty or decoration is a color removed from meaning.

**3. The terminal points; the player reads** *(serves Pillar 1 — command, do not micromanage; secondary: Pillar 2)*
Visual hierarchy serves the Operations Director's one job: read the situation, issue few orders. The wet, reflective, rain-soaked district may be gorgeous, but light, fog, and reflections exist to establish depth and mood at a glance while the eye is always returned to the things the player commands — cyan-ringed operatives, the wireframe minimap, the objective block, the ALERT state. *Design test:* when a lighting or VFX choice is ambiguous between spectacle and legibility, choose the variant that keeps squad positions, lines of consequence, and threat direction readable at 1280×720 without zoom — drama is what restraint leaves visible.

# Section 2 — Mood & Atmosphere

Section 1 fixed the one instrument; this section tunes it per game state. Every state lives inside the same corporate terminal — near-black base (background luminance ~4–8%), teal/cyan telemetry band, red only for alarm, amber only for money — so mood is carried not by new palettes but by **contrast, luminance density, motion cadence, and which of §4.1's semantic inks gets the pixels** (the spent trio cyan/red/amber, plus the quarantined green/white and the ink tiers). The seven states below must each be identifiable from a single unlabeled frame in under two seconds; if two states could share a screenshot, one of them is wrong.

**Energy scale.** Energy is rated 1–10 as perceived screen urgency: number of simultaneously animating readouts, pulse rates, and feed motion. It is a production target for animation density and VFX cadence, not a difficulty setting.

**Time-of-day.** The mission-world feed (network map, tactical, debrief backdrop) is a night district under rain; terminal-interior states (menu, research, brief, roster) have no sky — their "time of day" is the light *of the display itself* and is specified as such.

---

**2.1 Menu — the machine before you.** The terminal is already running when you arrive; you are not welcomed, you are logged in. Cool, very low contrast, dim: hairline cyan at low duty cycle over near-black, no glow bloom, pre-dawn stillness of a facility that never closes. The mood-carrier is the boot/self-test log scrolling behind the menu options, joined by a slow amber ticker of standing campaign costs — money counting itself while you idle, the only warm pixels on screen. Design test: the menu must feel like arriving mid-shift at an occupied console, not like a title screen.

**2.2 Network/Strategy Map — the city as a ledger.** Omniscient, detached vigilance: the district rendered as a live wireframe obligation-grid, its dread ambient rather than acute. Cool, medium contrast — the highest ambient cyan density of any state — but motionless in time: the wireframe has no hour, only clock cadence. Adjectives do the work; spectacle does not. The mood-carrier is sector-ownership wash in cyan against amber contract nodes pulsing on the world clock: money breathing in the grid. Red is structurally absent here — an all-cyan map is the visual statement that, right now, nothing is on fire (yet).

**2.3 Research — sediment accumulating.** Patient, methodical mastery; the antiseptic calm of a clean instrument making steady progress. Cool, low contrast, flat — even panel luminance with no cast shadows or vignette, the display equivalent of fluorescent light at 3 a.m. The mood-carrier is horizontal progress bars filling in monospace against per-tick sample-analysis marks, with the amber cost line deducting in small, legible increments: knowledge here is purchased, and the interface shows the meter running.

**2.4 Mission Brief — reading your own liability.** Clipped, consequential tension; the tightening of commitment, the feeling of a document that becomes binding when you sign. Cool, medium-high contrast — brief chrome densifies (heavier hairline stacking, more simultaneous readouts) while behind the brief window the night feed shows rain still falling on the target district. The mood-carrier is the amber payout figure set at equal visual weight with the objective block, top of the frame: duty and price side by side, before a single shot is fired.

**2.5 Team/Roster Assembly — people as costed assets.** Careful, clerical intimacy with an undertow of melancholy: these are named individuals, and the ledger regards them as billable hours with injury clocks. Cool, medium contrast, camera brought close — the feed zooms to personnel scale. The mood-carrier is the dossier card: a cyan scan-line sweep reading each operative like an ID document, with amber salary and injury-clock lines printed down the side. The warmth of attachment is deliberately never given warm pixels; it is carried entirely by the data's specificity.

**2.6 Tactical Mission — controlled violence in the rain.** The peak: taut, hypervigilant discipline governing adrenaline. Cool-dominant but highest contrast in the game — deep night, rain-lashed streets, wet-ground reflections smearing amber signage, cyan operative rings cutting clean through the noise, red held back until the ALERT state spends it. The mood-carriers are the cyan-ringed squad on reflective ground and the minimap; the rain, fog, and neon are permitted their one theatrical moment here, and only in service of depth and threat legibility at 1280×720. Energy rides 8 and spikes to 10 on contact; the terminal never panics even when the player must.

**2.7 Debrief — the invoice as verdict.** Funereal reckoning; consequence lands as accounting, not drama. Cool, contrast drains to near-menu lows; the night feed recedes and blurs behind report chrome, and amber takes the largest pixel share of any state — still strictly on credits, payouts, and costs, the one moment the money language is allowed to dominate. Red reappears only for KIA lines and the `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` banner. The mood-carrier is the itemized invoice printing line-by-line in monospace: each deduction a small, precise, quiet damnation.

---

**2.8 Overlay modifiers.** Overlays modulate the host state's mood without replacing it.

- **Pause.** Time stops; the frame becomes a still from a live feed. Drop contrast ~30%, desaturate cyan slightly, dim ambient animation to zero, and frame the screen with a hairline `SUSPENDED` corner bracket. Nothing else changes — pause is an instrument state, not a menu.
- **Alert toasts.** Red is spent fast and withdrawn: a red-leaded hairline toast, top-right, prints in one percussive beat, holds ~3 seconds, and collapses. Toasts never stack into decoration; two concurrent alarms escalate the frame's red edge-glow instead of adding more boxes.

**2.9 Cross-state check.** Read the seven states as a pressure curve: menu 2 → map 3 → research 3 → roster 3 → brief 5 → tactical 8–10 → debrief 2. The campaign breathes; the terminal's composure does not change — only how hard it is working.

# Section 3 — Shape Language

Section 1 fixed the instrument's color and Section 2 its cadence; this section fixes its line work. Because every pixel is output from one corporate OS, shape obeys the same rule as color: the terminal renders geometry the way a plotting terminal renders it — straight runs, hard corners, few curves — and a silhouette that could not be drawn as a polyline does not belong on screen. **The base vocabulary is the hard-edged prism**: chamfered rectangular volumes, flat planes, thin extrusions, drawn as technical line-art over translucent near-black fills. Curvature is rationed to instruments — rings, reticles, gauge arcs — and to life: people and weather may curve; nothing the corporation built does. *Design test:* when a proposed form is ambiguous between an extruded prism and a sculpted organic volume, draw the prism; organic curvature is spent only on living things and rain.

## 3.1 Character Silhouettes

**Thumbnail rule** *(serves Principle 3 — the terminal points, the player reads; Pillar 1 — command, do not micromanage)*: every archetype is named from outline alone at ~24 px in the tactical feed, before rings, colors, or labels are consulted. Rings and labels *confirm*; they never *identify*. An operative misread at a glance is a wasted order, and wasted orders are the failure mode Pillar 1 forbids.

- **Operatives (Strike Team 04) — the clean wedge.** Tight vertical silhouette: squared shoulders tapering to boots, sealed helmet cut by a single visor band, one unbroken closed outline. Distinguishing trait: the visor band plus an outline with nothing sticking off it. Communicates: precision instruments, drilled competence, self-contained. These are the player's verbs made flesh.
- **Hostiles (CorpSec) — the standing slab.** Mass over height: broad shield-plate torso, wide stance, closed helmet; the outline reads as a door set on its edge. Hardened CorpSec simply adds slab — more armor mass, same grammar. Communicates: interchangeable institutional force. At thumbnail size all CorpSec is one shape, and that is the point — the opposition is a system, not a cast.
- **Civilians — the soft lump.** Rounded, stooped hooded-raincoat silhouette, asymmetric, no gear, no hard edges — the one deliberately *un*-resolved outline in the feed, as if the OS barely bothers to render them. Communicates: fragility and liability. Their softness is a cost warning: they are the pixels Pillar 3 invoices you for.
- **Corporate NPCs — the sealed column.** Slim tailored vertical rectangle: high collar, no tactical mass, a single gold trim hairline down the seal line. Distinguishing trait: closure — nothing about the silhouette opens, holds, or points a weapon. Communicates: money and authority of the ledger, not the street.

*Design test:* if two archetypes' silhouettes can be confused at 24 px, do not fix it with color or rings — widen the mass contrast (wedge vs slab vs lump vs column) until the outlines separate on their own.

## 3.2 Environment Geometry

**Angular dominates, absolutely** *(serves Principle 1 — one instrument; Pillar 5 — one corporate operating system)*. Three reasons, in priority order: (1) the fiction — the terminal renders the district as data, and data renders as wireframes, prisms, and planes, never as sculpted organic forms; (2) the meaning — Nexus' district is authored, zoned, surveilled space; hard chamfered geometry reads as institutional order imposed on people, a place designed *against* pedestrians; (3) the platform — 1280×720 in a browser on code-generated geometry: straight-edged prisms, flat roofs, and orthogonal streets are exactly what the pipeline draws cheaply and cleanly. The network map states this outright: the district *is* a wireframe obligation-grid.

Organic form appears only where life persists despite the grid — crowds, weather — and is rendered as sensor noise: simplified, low-contrast, never detailed. The rain gets its curves and even its theatrical moment (Section 2.6), but it only ever smears straight neon across straight streets. *Design test:* when a curved façade or rounded tower is proposed, redraw it as a chamfered prism with a broken-bevel corner; if the prism loses the idea, the idea was decoration.

Emotionally, the angular world is cold without being hostile: the city is not evil, it is *indifferent infrastructure* — and the player's soft, rounded civilians walking through it are the only organic shapes that matter.

## 3.3 UI Shape Grammar — Resolved

The question "does the UI echo the world, or is it a distinct HUD language?" has a third answer here, and Principle 1 forces it: **the world is already the UI's rendering.** There is no second language to echo and no HUD floating over a stage — the tactical feed is a viewport widget, the minimap a wireframe readout, the operative rings overlay elements drawn by the same renderer as the streets. The UI is not the *master* grammar; it is the *only* grammar, and the world borrows it.

The grammar, concretely *(serves Pillar 5; secondary Pillar 2)*: hairline-stroked (1 px cyan) hard-cornered rectangles with corner brackets; translucent near-black fills; monospace numerals; circles permitted only as instrument forms (reticles, operative rings, gauge arcs); no rounded panels, no bevels, no drop shadows, no skeuomorphic depth — depth is carried by the feed behind the chrome, never by the chrome itself. *Design test:* a new panel ships as a hairline rectangle with corner brackets and monospace readouts or it does not ship; if it needs a curve or a shadow to feel finished, it is finished in the wrong world.

## 3.4 Hero Shapes vs Supporting Shapes

**Hero shapes are the things the player can order, or must read in order to order** *(serves Principle 3; Pillar 2 — information is operational power)*: the operative wedge and its ground ring, objective markers, sight cones, threat/alarm markers, and the minimap. Hero shapes get closed, unbroken, high-contrast outlines and protected pixel real estate — nothing else is allowed to overlap them at full contrast.

**Supporting shapes are everything else**: architecture, props, signage, crowds, weather. They are drawn as open or broken line-art at reduced stroke contrast and are permitted — expected — to dissolve into fog and rain smear. Broken outline is the visual contract for "this is scenery; you cannot order it."

The hero/support contrast ratio *widens* along Section 2's pressure curve: at roster (3) the dossier card is the only hero shape; at tactical (8–10) the squad, cones, and markers are pushed to maximum separation from a dimmed, wireframe city. Same shapes, same grammar, different spend. *Design test:* if a prop draws the eye before the squad does, it is over-drawn — reduce its stroke contrast or break its outline; if an operative reads only because of its ring, the wedge silhouette has failed its 24 px test. The hierarchy of attention must equal the hierarchy of consequence: what recedes is what the player cannot command, and what glows clean is what a single order moves.

# Section 4 — Color System

Section 3 fixed the line work; this section fixes its ink. The palette is small by law, not by taste: Principle 2 spends saturated color on meaning, so every hue that survives here is load-bearing. The tokens below are already literals in `src/index.css` and become the constants of `src/ui/tokens.ts`; three.js materials and DOM chrome read the same values. Contrast figures are computed WCAG 2.1 relative-luminance ratios against Void Black — they are verification targets, not aspirations.

## 4.1 Primary Palette

| Token | Hex | Role | Contrast on #04070a |
|---|---|---|---|
| Void Black | `#04070a` | Global ground | — |
| Dead-Glass Panel | `#0a1412` | Panel/inset fill (solid variant of the translucent chrome) | — |
| Telemetry Ink | `#b8d8cf` | Body text, readouts | 13.2:1 |
| — Ink Dim | `#5d7d75` | Tertiary labels | 4.5:1 (4.15:1 on panels) |
| — Ink Faint | `#35504a` | Structure only, never text | — |
| Signal Cyan | `#59d6c9` | Inform: chrome hairlines, rings, selection, routes | 11.4:1 |
| Beacon Teal | `#7ef0d4` | Active/instrument emphasis | 14.7:1 |
| Ledger Amber | `#f0b445` | Money: credits, cost, tax, salary | 10.9:1 |
| — Amber Hot | `#ffd075` | Committed money: payouts, invoice, banner figures | — |
| Alarm Red | `#e04b3c` | Alarm: threat, damage, KIA, crisis | 5.0:1 |
| — Red Hot | `#ff6b55` | Active alarm, ALERT state; red text at the floor | 7.2:1 |
| Nominal Green | `#7de08a` | System nominal, verified, complete | 12.4:1 |
| Print White | `#e2f6ee` | Settled fact, record numerals; high-contrast ink | — |
| VIP Ice | `#9be8ff` | Objective/VIP mission marker — attaches to objective geometry, never to bodies (§5.2); also PARK's personal accent (§5.2.1) | — |

*Token note:* all values except Print White (`#e2f6ee`) already exist in `src/ui/tokens.ts`; Print White is adopted as a new constant, and per the workspace guardrails any palette change touches `src/index.css` and `tokens.ts` and nothing else.

**Meanings, in-world.** Void Black is not emptiness but shared darkness — the unlit street and the inside of the machine are one medium. Dead-Glass Panel is corporate glass at night: the OS surface you read through. Telemetry Ink is phosphor — data as the room's ambient light. Signal Cyan is the company's own light, and therefore the color of instruction: whatever the terminal wants acted on, it renders in its native ink. Ledger Amber exists because the district's commerce glows in sodium-vapor amber — the ledger simply prints in the color of the streetlights it taxes; money without amber would be money the city cannot see. Alarm Red is the one saturated color the terminal shares with street emergency systems and with the body; its scarcity *is* its meaning, which is why red is spent (§2.8) and withdrawn. Nominal Green is corporate test-pass green: the machine confirming itself, never the squad, never safety, never money. Print White is what the terminal prints when nothing is contested — no allegiance, no urgency, just the record.

## 4.2 Semantic Vocabulary

- **Cyan informs.** Selection, operative rings, sight cones, routes, scan sweeps, chrome frames. Cyan may never mean money or danger; if a cyan element begins to read as either, the element is wrong.
- **Red alarms.** Threat-state change, active contact, damage flashes, Alert, crisis hatch, KIA lines, the campaign-failed banner. Red never persists decoratively and never encodes mere ownership or preference (§4.3).
- **Amber costs.** Credits, payouts, collateral pricing, tax, salary, research spend. Environment amber (lamps, signage, §4.4) is weather; interface amber is price — the two never interchange tokens.
- **White records.** Settled numerals and labels of fact. White never marks a live state; live states pulse in a semantic hue.
- **Green confirms the machine.** Nominal/self-test/verified states in terminal chrome only. Green is quarantined away from the tactical feed and from all adjacency to red and cyan semantics (§4.5).

Grammar rules: a semantic hue may be promoted to its hot variant (amber→amber-hot on authorization; red→red-hot on active alarm), never demoted to a decorative tint — "less" of a meaning is expressed by ink tiers or opacity of chrome, never by diluting a semantic hue. Every semantic assignment above must survive the question *"why does the OS render it this way?"* — each answer is in-world, not aesthetic.

## 4.3 Per-Area Temperature Rules

**Network map — the ledger city.** No sky, no hour; temperature is structural. Ownership wash per the World Network GDD: Nexus-held sectors wash Signal Cyan; **non-Nexus-held sectors recede to the inert gray-teal concrete band (`#242e39`–`#374453`) with ownership printed as a label — never colored red**, because a lost sector is not an alarm, it is a line item, and red must stay purchasable by crisis alone. Contested renders as a neutral hatch on the same gray-teal. The single exception is crisis: red hatch + stroke **plus** the non-color CRISIS mark, as already specified.

**Mission districts — the street feed.** Temperature belongs to the opening hour, not to district identity. The night preset (key `#c2d8ee`, fog `#0a141f`) and the dusk preset (key `#e6c4a0`, sky `#c8ae92`) shift atmosphere luminance and warmth only. **The semantic layer is hour-invariant**: rings, cones, markers, Alert, and prices print identical hues at dusk and at 3 a.m. — an order typed at dusk must read identically at night.

**Terminal interiors — menu, research, brief, roster, debrief.** No sky at all; their temperature is the light of the display itself, carried by amber pixel share along §2's pressure curve, peaking at debrief. Research is the flattest: even panel luminance, no cast shadows (§2.3).

## 4.4 UI Palette vs World Palette

One OS, one set of literals: bg, panel, ink, cyan, red, and both semantic ambers are **the same hex on both sides of the world/HUD boundary** — DOM chrome and three.js materials read the same constants. Three explicit divergences:

1. **Environment amber.** The world owns `#ffb46b` sodium lamps and the warm dusk sky; these are weather, never price. Interface money is always `#f0b445`/`#ffd075`. If an emissive amber must be read as a number, it is re-tokened to the ledger amber.
2. **Atmospheric drift.** World color may pass through fog, bloom, and wet-ground smear, arriving desaturated or shifted; DOM tokens arrive exactly. Rule: anything read as a value — rings, markers, numerals, prices, Alert — is drawn post-atmosphere at exact token hue; only scenery may drift.
3. **The gray band.** Concrete materials, rain (`#a8c4d8`), and muzzle flash (`#ffd9a0`) exist only in the world render. The interface never grays out information: hierarchy in chrome is luminance tiers of ink, never desaturation of semantics.

*Design test:* sample any frame; every pixel that reads as a readout must match a token hex within fog/bloom tolerance. A mismatch means scenery has learned a semantic color.

## 4.5 Colorblind Safety

The near-monochrome design is the first defense — most of the frame already distinguishes by luminance and shape. The pairs that fail, with measured luminance-only separation (what a fully colorblind reader has left):

- **Cyan vs Ink — 1.16:1.** Indistinguishable by luminance alone. Cyan meaning must always be doubled by shape: ring, corner bracket, underline, or duty-cycle glow — never hue alone against ink text.
- **Cyan vs Green — 1.09:1.** Same failure; this is why Nominal Green is banned from the tactical feed and from all adjacency to cyan semantics (§4.2).
- **Amber vs Red — 2.16:1.** The riskiest semantic pair: protan/deutan readers see both as muddy brown-gold. Mandatory backups: **red moves, amber counts** — alarm pulses or bursts and hatches/edge-glow frames, money ticks in right-aligned monospace ledger columns with the `CR` suffix. Alarm additionally prints its word (`ALERT`/`CRISIS`); money always carries `CR`.
- **Red vs Green — 2.46:1.** The classic failure. Health/injury/KIA are never encoded green-vs-red: pip count + glyph + text token. This is the operational reason for Green's quarantine.

Required non-color cues (committed; restated and binding in §7.5): selection = closed double ring; focus = bracket set; injury/KIA = pip loss + glyph; lock/threat = marker shape + blink cadence; Alert = edge glow + printed word; sector crisis = hatch + CRISIS mark. **Motion is the third channel**: alarm pulses fast, money counts slow, selection breathes slow.

*Design test:* desaturate any screenshot — every semantic distinction must survive in grayscale. Where two states collapse, add shape or motion, never a new hue.

# Section 5 — Character Design Direction

Sections 1–4 fixed the instrument's color, cadence, line work, and ink; this section fixes its *people*. The governing fact is the fiction itself: on this terminal, a person is a record with legs. Operatives are costed assets, CorpSec is a liability clause, civilians are collateral line items, and executives are signatures. Every rule below is that fact made drawable. *Serves all five pillars, but the load-bearing one is Pillar 3 — violence has corporate consequences: the way a body is drawn is the way it gets invoiced.*

## 5.1 The Director Is Never Depicted

**The player has no character; the player has a console.** The Operations Director never appears on the street, in a briefing, or in a reflection — no avatar, no portrait, no silhouette in a doorway, no first-person hand, not even an empty chair rendered with sentimental care. The terminal *is* the director's body: their presence is expressed exclusively through the instrument states a terminal already owns — the selection ring, the route line, the cursor bracket, the scan sweep, the `SUSPENDED` pause frame (§2.8).

This is a hard prohibition, not a restraint. Any future feature that tempts a depiction of the director (a settings portrait, a debrief cutaway, a cameo) fails the bible unless it is re-authored as terminal output — a personnel file, a voice-print waveform, a signed authorization line. In-world justification: the OS does not render its operator, because the operator is not a subject the system surveils.

**Design consequence.** The director's "emotional register" is the terminal's composure (§2.9): calm chrome at every pressure level. The player's humanity is outsourced entirely to what they are looking *at* — the squad, the civilians, the invoice — which is exactly where the game wants the player's attention and guilt to live.

*Design test:* if a mockup contains any human figure that represents the player, delete the figure; ask instead what readout the terminal would print in that moment, and draw that.

## 5.2 Identification Rules per Character Type

Section 3.1 fixed four silhouettes (wedge / slab / lump / column) and the thumbnail rule: identity is read from outline at ~24 px; rings and labels confirm, never identify. This section adds the *second* reading — the one glance-detail that survives once the silhouette has done its work — and the rules for how individuals vary *within* a type.

**The two-channel contract.** Every character carries exactly two identification channels: (1) silhouette grammar — closed high-contrast outline per §3.4 hero treatment; (2) one type-specific secondary trait. No third channel exists, and the secondary trait must never be a *color* the semantic palette has already spent: red is alarm, amber is money, cyan is instruction, so affiliation and rank are carried by **mass and shape only**.

- **Operatives — trait: the visor band.** A single horizontal visor slit in the operative's personal accent, inside an otherwise sealed helmet on an unbroken closed outline. Per-operative individuality is rationed to small, hash-derived variation *inside* the fixed grammar — visor slant, crest presence, antenna, rig layout — so the wedge reads identically for all eight and the *person* reads at dossier distance (see portrait and figure implementations: jitter is derived deterministically from the operative id, so a figure renders the same way every session). Operatives are the only bodies permitted cyan adjacency (the selection ring) and the only bodies with personal accents.
- **CorpSec — trait: slab mass; rank = mass steps.** The standing slab is one grammar with a mass scale, not a wardrobe: standard CorpSec is the base slab; hardened units *add plate* (broader shield-torso, deeper stance); heavy/elite units add the shield itself as a separate slab volume. Rank never changes hue, never adds trim, never opens the helmet — the opposition is a system, not a cast (§3.1), and an elite must be readable as *more slab*, not as a different army. Threat state is carried by threat markers and alarm semantics (§4.2), never by CorpSec body color.
- **Civilians — trait: the broken outline.** No secondary trait, deliberately: soft, stooped, asymmetric, drawn at the lowest stroke contrast of any figure, no gear, no ring, no accent, no variant grammar. Individuality is *withheld by design* — the OS barely bothers to resolve them, and the player should feel the invoice before they feel the person. A civilian detail level approaching an operative's is a bible violation: it would advertise them as orderable, and they are not (§3.4 — broken outline means "you cannot order this").
- **Corporate NPCs — trait: the gold trim hairline.** The sealed column carries a single gold hairline down its seal line — the only place the money color is permitted on a body. No rank variance: an executive and a mid-manager are the same column, because to the ledger they are interchangeable authority. Corporate NPCs never carry devices, never point, never open; if a corporate body needs to read as *active* in a scene, the terminal frames it with a briefing/authority marker instead of animating the body.

Mission markers (`DEVICE` amber, `VIP` ice-blue) attach to objective geometry, never to body grammar — a marker may sit over a figure, but the figure's own two channels stay untouched.

*Design test:* strip rings, markers, and labels from any tactical frame. Every figure must still be typed by outline plus its one trait. Strip the traits: all four types must still separate by mass grammar alone at 24 px. If they don't, fix the silhouettes (§3.1) — never fix identification with a new color.

### 5.2.1 The Operative Accent Palette

The visor band's "personal accent" is a load-bearing identification channel, so its values are specified here, not left to taste. The palette is the eight operative accents already fixed in `src/game/data.ts` — hash-stable per operative id, so a figure renders the same accent every session:

| Operative | Codename | Accent |
|---|---|---|
| D. TORRES | MARA | `#f0b445` |
| L. FERNANDEZ | GHOST | `#7ef0d4` |
| K. PARK | DART | `#9be8ff` |
| M. IVANOVA | TORQ | `#ff9a6b` |
| A. OKAFOR | RAVEN | `#e04b3c` |
| J. SATO | SLATE | `#b9a7ff` |
| R. VOLKOV | VEX | `#8fd6a2` |
| N. DIALLO | KESTREL | `#f2e6c9` |

**Accents are non-semantic.** They exist only to link a street figure to its dossier file; they never encode state, health, threat, or interactability — those ride §4.2's semantic layer and §4.5's non-color cues. An accent appears on exactly two surfaces per operative: the visor band and the selection-ring treatment — never on routes, markers, or world geometry.

**Known collisions, and their policy.** Two accents coincide with semantic tokens: MARA's `#f0b445` is Ledger Amber and RAVEN's `#e04b3c` is Alarm Red. The policy is *shape and motion carry semantics, never the accent*: money always prints in a right-aligned `CR` column and alarm always prints its word plus pulse/edge-glow (§4.5, §7.5), so an amber visor can never be mistaken for a price and a red visor can never be mistaken for an alarm. Adding a ninth accent requires one that passes the grayscale test below and does not collide with a semantic token's luminance band.

*Design test:* render all eight wedges at 24 px in grayscale. Each accent must separate from the other seven by luminance (no two collapse into the same gray step). Second test: render any operative's accent next to its same-hue semantic token — the semantic element must still be identifiable by its shape/motion cue alone, accent stripped.

## 5.3 Expression and Pose Style

**Target: stiff — realistic proportion, zero caricature, zero facial performance.** On the stiff ↔ expressive / realistic ↔ exaggerated grid, Nexus Reborn sits hard in the stiff-realistic quadrant, one deliberate notch away from clinical. Bodies are drawn at credible human proportion (no heroic 8-head builds, no chibi compression) but posed as if plotted: operatives stand in drilled, economical readiness — weight settled, weapon carried across the body, nothing gesturing; CorpSec is planted mass; corporate NPCs are vertical stillness; civilians alone are allowed slump and asymmetry, because they are the only people not being rendered *as personnel*.

Faces do not emote because there are no faces: operatives and CorpSec wear sealed helmets with visor bands, and the dossier "face" is an angular bust of facets, rim light, and a serial number (portrait implementation). Expression is delegated to three places that can actually carry it:

1. **Posture deltas** — the one permitted expressiveness: a wounded operative's figure may carry a broken-stance variant; a civilian may flinch. Small, few degrees, no animation arcs.
2. **The data around the body** — the injury clock counting down, the status line printing `KIA`, the amber salary figure. The ledger is the emotional track; §2.5's "warmth never gets warm pixels" applies to every body on screen.
3. **The player's own inference** — which is the point. People as ledger entries means the terminal does not care so the player must; a weeping portrait would spend the game's most important feeling on the renderer's behalf.

Exaggeration is banned in all four types: no action-hero silhouettes, no squash-and-stretch, no comedic civilians. The one theatrical license in the game already belongs to the rain (§2.6); flesh gets none.

*Design test:* if a proposed pose could appear on a printed character poster, it is too expressive — redraw it at parade rest. If a proposed expression requires a face, it is impossible on this terminal; find the posture or the data line that carries it.

## 5.4 Detail and LOD Philosophy

**Silhouette-first LOD: detail is added inward, never outward.** A character's outer contour and its two identification channels (§5.2) are constant across every distance; LOD spends pixels only on *interior* reading, and the far view is always a strict subset of the near view. No LOD level may alter mass, outline closure, visor band, trim hairline, or broken-outline status — a figure that gains or loses identification traits as the camera moves is a bug, not a budget win.

**At tactical distance (~24 px): silhouette + one trait + ramp fills.** The figure renders as its outline over a flat armor-ramp fill (`ARMOR_LIT` / `ARMOR_MID` / `ARMOR_LOW` — three-step lit/mid/low shading, already literal in `src/ui/tokens.ts`) plus the visor band or trim line. Seams, pouches, rig pockets, crest, antenna, serial: none of it renders — at 24 px these are noise, and §3.4 forbids noise on hero shapes. The ramps encode *form lighting only*, never rank, health, or allegiance (rank is mass, health is pip+glyph+text per §4.5, allegiance is silhouette). Camera zoom within the tactical feed interpolates toward the roster level of detail but never exceeds it.

**At dossier distance: the full identity budget.** The roster card renders the figure (assembly-bay full-body on its plinth, weapon across the torso) and the portrait bust at full interior detail — seams, pouches, rig, crest, antenna, visor slit pair, facet lines, serial print. Because every one of these details is hash-derived from the operative id, near and far views agree by construction: the dossier is the same plotted figure with the interior lines enabled, and it renders identically every session, every campaign. Individuality lives *entirely* at this distance — which makes reading a dossier feel like access to a personnel file, not like meeting a person.

**Portraits are identity documents, not faces.** The code-drawn bust (angular helmet mass, rim-light path, accent visor, serial, ID-bar texture) is the operative's canonical likeness. It may gain data overlays (injury clock, status) but never gain humanity: no eyes behind the visor, no expression pass, no "awakened face" reveal. The visor band is the portrait's one warm accent and it is the same accent the 24 px figure carries — the thread that lets the player recognize the wedge on the street as the file on the desk.

**Determinism is the LOD contract for code-generated figures.** With no art assets to fall back on, the guarantee that id-hash geometry is stable across distance, session, and campaign replaces the traditional hand-authored turnaround sheet. Any new per-character variation (scars, rig layouts, armor trims) enters through the hash vocabulary only, inside the type's grammar, at dossier scale first and only then considered for tactical scale.

*Design test:* render one operative at 24 px and at dossier size side by side. The 24 px figure must be describable as "the dossier figure with its interior lines removed" — same contour, same visor, same ramp family. Any difference that isn't interior detail is a violation. Second test: render a full squad at 24 px and check each wedge still reads as its dossier *file* by accent alone — if two accents are confusable, spread the accent palette, never the silhouette.

# Section 6 — Environment Design Language

Sections 1–5 fixed the instrument's color, cadence, line work, ink, and people; this section fixes its *stage*. The governing fact is unchanged: the district is not a place the player visits but a feed the terminal renders, so every environment rule below answers the same question the OS asks about everything else — *what fact does this geometry print?* Streets carry the geography of consequence (fire lanes the invoice can price); buildings carry the corporation's self-portrait; props carry the verbs; and all of it is supporting-shape line-art (§3.4) whose legibility job ends where the squad's begins. The district is generated by `src/world/citygen.ts`, deterministic from `mission.seed` (96 × 96 m, three authored layout families), and because it is code, every rule in this section is a rule the generator can actually enforce. *Serves Pillar 5 — one corporate operating system; secondary: Pillar 2 — information is operational power, and Pillar 3 — violence has corporate consequences.*

## 6.1 Architectural Style — the Org Chart Made Masonry

**The Nexus Global district is a planned corporate grid, not a grown city.** Orthogonal cross streets on a fixed rhythm (13–17 cells of block between streets), one monumental north–south avenue (7 m paved) with a formal plaza at the north end, uniform 2 m setbacks, standard 4 m service alleys, a hard border ring. Nothing accretes, nothing leans, nothing was added by a thousand small owners — §3.2's curved-façade test never gets invoked because the city never proposes a curve. The architecture says exactly one thing about the culture that built it: **Nexus Global does not accumulate history; it executes zoning.** This is institutional order imposed on people (§3.2), drawn at city scale.

**Vertical grammar is the org chart.** The northern half faces the plaza with towers (40% tower probability, 16–26 m); the south is service blocks (12% towers, 5–16 m); the industrial family stays low and boxy (4–14 m). Money faces the plaza; logistics turns its back. The skyline itself prints the balance sheet, readable from the insertion point before a single order is issued.

**The three authored layout families are three statements of corporate control** — authored tactical problems, not reskins (Tactical GDD):
- **Checkpoint (Glass Veil) — throughput control.** A gate set in a public through-avenue, plaza as the honest commit space, the flanking cross street as the priced detour. Architecture as chokepoint: the corporation decides what may pass.
- **Compound (Hollow Crown) — the liability vault.** A walled detention compound with one gated entry and one breachable side flank; walls emitted as low buildings on the same data path as everything else, so minimap, brief map, and occlusion agree by construction. The corporation defends its records and its detainees — not its people.
- **Industrial (Rust Haven) — logistics as cage.** A fenced relay yard of sub-yards holding the device spawns, wider streets, low boxes. The working half of the ledger, unglamorous and unforgiving.

Each family must separate as a silhouette on the minimap and brief map at a glance, the way the four character types do at 24 px (§3.1) — same grammar, different mass and footprint.

**Age reads as budget, never as history.** The city is not old; it is *unevenly maintained*. Surface variation (§6.2), dark pool-lit ground floors, dead signage — all of it reads as deferred maintenance and allocation choices by a living owner, never as romantic decay. Ruins imply an event the ledger does not acknowledge.

*Design test:* point at any district feature and name the corporate function it serves — throughput, security, logistics, or image. A feature serving none is decoration and is cut. A proposed landmark that cannot be drawn as a chamfered prism (§3.2) is not architecture; it is set dressing.

## 6.2 Texture Philosophy — Variation Without Textures

The hard constraint is zero texture assets: no image textures, no normal or roughness maps, no baked decals, no canvas noise bakes. What painting spends on albedo, this world spends on **four code channels**:

1. **Procedural line work is the surface.** Floor-plate seams, panel joints, façade mullions, curb lines, service hatching — thin stroked geometry and edge highlights in the gray-teal concrete band (`#242e39`–`#374453`). Line density is authored **per surface class**: ground floors dense (where the corporation touches the street), tower shafts near-bare, industrial panels mid-density with hazard hatching only where equipment lives. Detail budget = stroke budget; density is a class property, never a per-surface painting decision.
2. **Ramp fills plus the hash tint.** Surfaces shade with flat three-step ramps (§5.4) inside the concrete band; per-building `tint` is a seed-derived hash that jitters value within the band. Tint never encodes allegiance, threat, or interactability — those are semantic facts (§4.2) and ride markers, never masonry.
3. **Light does the aging.** Sodium lamp pools (`#ffb46b`, ≤70 per district), neon banners smearing across wet ground, fog attenuation (night fog `#0a141f`). What PBR spends on grime maps, this world spends on a light's reach: a surface ages where light touches it and stays flat where it does not. Weather is the texture (§2.6, §4.4).
4. **The seed is the patina.** All variation parameters — banner sides and heights (0.25–0.7 of façade), alley cuts, empty lots, tint values — derive from `mulberry32(mission.seed)`. This extends §5.4's determinism contract from characters to the street: the same seed rebuilds the identical district every session, and the unsaved lifetime (ADR-0002) means there is no accumulated world state to diverge. Variation is a budgeted parameter list, not history.

**Signage policy.** Neon banners draw from a closed six-color weather set (`#ff2f6d #00e5ff #ffb300 #7c4dff #39ff6a #ff5c2a`), placed on upper façades — never at operative eye level, where identification happens (§5.2). Signage may drift through fog and bloom (§4.4 #2), but nothing readable is ever sampled from it: no state, price, or threat is encoded in a signage hue, and the semantic layer never borrows one. Four hues in the set sit near semantic tokens — `#ff2f6d` near Alarm Red, `#ffb300` near Ledger Amber, `#00e5ff` near Signal Cyan, `#39ff6a` near Nominal Green; their safety contract is placement height plus the §4.2 rule that every semantic prints in its exact token hue post-atmosphere. Cyan-near signage competes directly with the instruction color and is the strictest case: if upper-façade placement cannot keep it from reading against chrome cyan at a glance, it is swapped for another weather hue. Signage drifting toward any semantic token — red, amber, cyan, or green — is a bible violation.

*Design test:* desaturate and fog a tactical screenshot — every surface must still read by line density and ramp value alone. If variation disappears, it was living in a texture that does not exist.

## 6.3 Prop Density — Functional, Sparse, Blocking-Honest

Props are the environment's only orderable geometry — they shape fire lanes, define cover, and block movement — so density obeys function, not set dressing: **every prop is cover (crate, dumpster), a control point (barrier, pillar), or a landmark. There is no third category.**

- **Density follows the verbs.** Industrial yards run dense (relay clutter as cover); avenue and plaza run near-bare (the corporation keeps its parade ground clear); alleys carry the city's accumulated objects. The generator enforces a global cap (~200) and keeps insertion routes and device yards clear.
- **Blocking honesty** *(§4.5 non-color cues)*: a prop that blocks the walk grid renders with a solid dark base and closed outline; a passable prop keeps a broken, lighter treatment. Pathing must read from shape at 1280×720 without a tooltip — a crate the squad can walk through may not look like the crate it cannot.
- **Contrast discipline.** Props are supporting shapes (§3.4): closed enough to read as cover at a glance, never emissive, never in a semantic hue, never overlapping operative ring real estate. If a prop draws the eye before the squad does, break its outline or drop its stroke contrast.
- **Emissive street furniture is lights, not props.** Street lamps and one neon light per banner, district-wide light cap 120 — all of it weather (§4.4 #1), none of it information.
- **The network map carries zero dressed props.** The obligation-grid renders structures as line-work prisms only; density on the map is *data* density (contract nodes, ownership wash, crisis hatches). Physical props on the map would lie — the ledger does not itemize trash cans.

*Design test:* remove every prop that affects no verb, no fire lane, and no path. If the frame does not get visibly poorer, the props were decoration.

## 6.4 Environmental Storytelling — Everything Is Corporate Record

The district tells its stories as **system outputs**; the OS renders what its systems know — surveillance, maintenance, incident response, tax — and nothing else. Every storytelling lever below already exists in the simulation, so scenery never lies about the rules:

- **Population is the sector's mood.** Unrest above 20 adds +6 civilians and +1 street patrol to that sector's missions (Tactical derives from the World Network snapshot): the street literally gets busier and more watched as the sector seethes. Crowd density is the unrest readout before any HUD number prints. *Serves Pillar 2.*
- **The garrison is the corporation's answer.** Patrol routes, plaza posts, and gate checkpoints print who runs the block; Hardened adds patrols — the feed shows the raised security budget, not a difficulty menu.
- **Weather and hour are the operation's clock.** The determined weather script (ADR-0006) and the frozen Opening hour (ADR-0007) state in scenery exactly what the brief states in text — the brief must tell the truth about the district it shows.
- **The street keeps the minutes.** Hits flash, missed rounds paint readable fire lanes in tracers (Tactical GDD), and the aftermath of contact stays legible as record — the firefight is minuted, not forgotten.
- **Civilians in the fire lane are the invoice walking.** Their density and exposure are an environmental statement about what a corporate order costs, placed so collateral never feels arbitrary (a Tactical GDD content rule). *Serves Pillar 3.*

**The record rule:** point at any storytelling detail and name the corporate system that produced the fact — surveillance log, maintenance schedule, incident report, tax roll. A fact in no corporate system is authorial sentiment; the OS would not render it, and neither do we.

*Design test:* strip all HUD chrome from a tactical frame; a new player should still answer *who runs this block, how closely is it watched, and what happened here recently* from scenery alone. Second test: any scenery detail that could not appear in a corporate archive is cut — the terminal is not permitted unauthored decisions.

# Section 7 — UI/HUD Visual Direction

Sections 1–6 fixed the instrument's identity, cadence, line work, ink, people, and stage; this section fixes its *glass* — the panels, type, icons, and motion the player actually touches. Everything here is stated so the DOM layer (React, `src/ui/`) over the mission feed (r3f/three.js) can be built and reviewed against it without interpretation. The palette is Section 4's, read through `src/ui/tokens.ts`; nothing in this section introduces a new color, font file, or image asset. *Serves Pillar 5 — one corporate operating system; secondary: Pillar 2 — information is operational power.*

## 7.1 Diegetic vs Screen-Space — Resolved

**The framing of Sections 1 and 3 forces one answer: everything on screen is diegetic at the fiction level and screen-space at the implementation level, and the only thing we are not allowed to do is let the implementation boundary become visible.** There is no "game world with a HUD on it"; there is one terminal displaying a live feed, with chrome laid over the feed the way windows sit over a video wall. So: the 3D mission scene is *content* (a viewport widget), the DOM panels are *chrome*, and both are rendered by the same OS in the same language. The distinction the art must manage is not diegetic-vs-HUD; it is feed-vs-window — an administrative boundary, never a visual one.

In practice, for DOM panels over the 3D feed:

- **A panel is a window, not a layer of paint.** Hairline 1 px cyan rectangle with corner brackets (§3.3) over a translucent near-black fill (`--bg-panel`); the live feed stays visible and animating through it. A panel may dim *content* (pause, §2.8) but never erases the feed with an opaque slab except where legibility demands (`--bg-panel-solid`, insets only).
- **No separation devices.** No drop shadow, outer glow, border-radius, or gradient edge may distinguish DOM from canvas — if a panel needs a shadow to feel above the feed, it is finished in the wrong world (§3.3 design test). Depth is carried by translucency and ink tier alone.
- **World-anchored overlays are chrome, not world art.** Operative labels, objective markers, and threat callouts positioned over the feed are drawn by the same renderer rules as DOM chrome — exact token hues post-atmosphere (§4.4 #2), same glyph grammar (§7.3). An overlay that borrowed the world's fog or bloom drift would stop being readable as an order.
- **The feed never pauses for the chrome.** Panels open, print, and close over running footage; the only full-frame interrupt is SUSPENDED (§2.8).

*Design test:* screenshot any panel edge — nothing in it should let you locate the DOM/canvas boundary; you should only be able to locate the window's own hairline.

## 7.2 Typography Direction

**One font, already installed: the system monospace stack** (`--font-mono`: SF Mono / ui-monospace / Menlo / Cascadia Mono / Roboto Mono). **No new font assets, and the justification is the fiction itself:** this terminal does not ship a brand typeface — it renders in whatever mono the machine has, which is exactly what a corporate OS does. A licensed display font would be an authored art choice the OS would never make, and would break the S1 rule that nothing is drawn the OS could not render. Personality is therefore carried not by glyph design but by **size steps, tracking, weight discipline, and ink tier**.

- **Personality target:** instrument text — cool, dense, unsentimental, engineering-label rather than prose. Generous letter-spacing on labels (0.2–0.3 em; 0.4 em for the smallest corner tags), tight 0.04 em on body data. Labels read as engraved panel captions; readouts read as phosphor.
- **Weight: two, and nearly one.** Regular (400) is everything — body, readouts, labels. A single step up (500–600) is reserved for screen headers and the campaign-failed banner. Body text is never bolded; emphasis is expressed by promoting the ink tier (INK → TEAL → Print White, §4.1) or by tracking — never by weight, never by italics (no italic exists on a plotter).
- **Size hierarchy** (all values × `--text-scale` for the accessibility setting; layouts absorb growth, never clip at 1280×720):
  - 13 px — body text and primary readouts (the base).
  - 12 px — input fields, secondary rows.
  - 10 px — labels, annotations, list metadata.
  - 10 px floor — micro-labels: axis ticks, table column heads, corner tags. Nothing prints smaller; a string that cannot fit at 10 px gets shortened, not shrunk. *(Floor raised from a proposed 9.5 px on UX review: below 10 px the §7.5 contrast rules become unverifiable.)*
  - 16 px — panel/section titles (tracked 0.2 em).
  - clamp(17–25 px) — screen headers, tracked 0.3 em.
  - clamp(22–38 px) — the one hero scale: banner states and the debrief invoice total, nothing else.
  Keep a screen at ≤ 4 active size steps; hierarchy is mostly tracking + ink tier, so extra steps just add noise.
- **Numeral treatment.** Numerals are this game's primary content, not decoration. All figures set in the monospace (tabular by construction), right-aligned in ledger columns, zero-padded to fixed width (`04`, `07:31`) so live updates never jitter layout. Money carries the `CR` suffix and ticks digit-by-digit (§4.5: *red moves, amber counts*); settled records print in Print White, contested live values in their semantic hue. Unit suffixes (`CR`, `m`, `s`, `%`) render at the same size in dim ink — units whisper, values speak. Abbreviations (`k`, `M`) are banned: a ledger that rounds is a ledger that lies.

*Design test:* cover every string that is not a numeral. The state of the operation — money, clocks, threat, progress — must still be readable from figures alone.

## 7.3 Iconography Style

**Style: flat technical line-art, code-drawn — never illustrated, never image assets.** Icons are SVG glyphs built in the existing modules (`bits.tsx`, `researchGlyphs.tsx`) in `currentColor` on a 16×16 viewBox at a nominal 16 px (24 px permitted at dossier/roster scale; no other sizes, no non-uniform scaling). Stroke ~1–1.2 px at 16 px, hard corners, straight runs; curves are rationed to instrument circles (reticles, rings, gauge arcs) exactly as §3.3 rations them to panels. A proposed icon that needs more than ~40 path commands at 16 px is over-detailed — it is a drawing, not a label.

- **Two treatments, one family.** *Outline* (stroked, `fill: none`) is the default — it informs. *Solid* (filled silhouette with `INK_DEEP` cut-outs for interior detail) is rationed to identification-critical or state-critical marks — role badges, the KIA skull, the ALERT state. The two treatments never mix within one semantic row or column; treatment consistency is how a column of glyphs reads as a column.
- **Weapon icons: parts-catalog silhouettes.** Side profile only, level ground line, muzzle facing right consistently, drawn in `GUN_IRON` ink on dark. Each weapon renders its one distinguishing trait at full contrast (stock, barrel length, magazine, optic) and everything else at supporting contrast — a schematic from a procurement document, not an inventory render. No perspective, no shadow, no glow, no action pose.
- **Ability icons: instrument metaphors.** Grenade, stim, shield, dash, scan, flame render as schematic outline plus at most one solid accent element. An ability icon never encodes cooldown or cost in color — color is semantic (§4.2); cooldown is an ink sweep across the glyph plus a numeral, cost is amber text beside it.
- **Status icons: never the only carrier.** Status is always glyph + text token (+ pip where §4.5 requires it). A glyph alone may never be the sole encoding of health, KIA, lock, or threat — this is the colorblind contract restated in icon form. Red-hot solid treatment is reserved for KIA and active-alarm marks.
- **New icons enter as code in the glyph modules**, hash-deterministic where they depict procedurally varied things, and pass the same plotter test as everything else in §3.

*Design test:* print any icon set at 16 px in a single ink on paper. Every glyph must still be nameable — if it needs color or a tooltip to be identified, it is redrawn.

## 7.4 Animation Feel — Print, Scan, Tick

**The terminal never animates; it prints, scans, ticks, and blinks.** This is the governing rule for every transition in the DOM layer, and it replaces the standard game-UI vocabulary outright. **Banned:** bounce and overshoot easing, scale-pop, slide-and-fade panels, hover glow, parallax, spring physics, looping ambient shimmer on idle chrome. If a motion reads as "juicy game UI," it is a bible violation — the OS is composed at every pressure level (§2.9).

Permitted verbs, with cadence:

- **Print** — content appears in reading order as output, not as an entrance. List rows and invoice lines stagger top-to-bottom (~110 ms per row; `index * 110ms` is the established implementation), each row revealing in one step or a fast ≤120 ms fade — never a travel distance, never a scale. Panels do not fly or grow: the frame snaps or draws on (bracket snap-in or hairline trace, ≤150 ms) and its contents print inside it. **Print is confined to record surfaces** — debrief, research, brief documents, list panes; it never touches urgent state (see §7.5 response budgets).
- **Scan** — the single hairline sweep that reveals a region (the dossier card, §2.5; the World Network Scan). One pass, ≤400 ms, once per open — never looping on an idle screen. Scan is the only motion allowed to cross a whole panel.
- **Tick** — numerals count. Money counts at a readable ledger pace (per-keystroke clarity, never a slot-machine blur); research and progress meters advance in discrete increments matched to the simulation's tick rather than an eased tween — *a meter that eases toward a value the sim does not hold is lying*, and lying instruments are the one unforgivable animation sin here.
- **Blink/breathe** — the state channel, per §4.5: alarm pulses fast (~2 Hz), selection breathes slow, threat markers blink on their cadence. These are continuous instrument states, not transitions, and they are the only permitted loops. **Every motion-backed cue names its static fallback for reduced-motion (§7.5)**: alarm pulse → static hatch + edge glow + printed word; money tick → static right-aligned `CR` column; selection breathe → closed double ring.

**Cadence obeys the §2.9 pressure curve.** At states 2–3 (menu, research, roster, debrief): at most one idle motion on screen, everything else static — stillness *is* the mood. At 5 (brief): chrome densifies and prints, but only the amber payout figure ticks. At 8–10 (tactical): alarm and marker cadence run at full pulse rates, but the energy must come from the *world feed*; total simultaneously animating chrome readouts cap at ~6, no animation enters hero-shape protected real estate (§3.4), and alarm is the only red-cadence motion on screen — even at energy 10 the terminal's own cadence increases at most one step. The machine never panics.

**Durations and easing:** micro-interactions (bracket snap, focus underline, hover ink-step) ≤150 ms; prints and reveals ≤400 ms; scan sweeps ≤400 ms; nothing in the UI exceeds 500 ms except tick counters tracking real values. Easing is linear or one hard ease-out — two-step at most, no springs, no anticipation. Audio follows the same law: one percussive red beat per alert toast (§2.8); ticks are silent or one soft tick per ledger group — never per character, never a typing loop.

*Design test:* watch any UI motion and ask whether a plotter, a scanner, or a mechanical counter could have produced it. If the honest answer is "a game engine did," delete it.

## 7.5 Hard UX Constraints (binding)

The art direction above is conditional on these numbers. The ux-designer review verdict was *aligned-with-conditions*: the one-instrument direction supports few-timed-orders play, but several committed accessibility rows become unverifiable unless the constraints below are binding on every element this section specifies. Conflict resolutions adopted: the 10 px type floor supersedes the proposed 9.5 px; the response budgets and reduced-motion carve-outs below override the general print/plot metaphor wherever they collide.

**Protected interaction affordances** — each gets a defined, non-color-backed visual:

1. **Selection** — closed double ring (committed §14); distinguishable single vs multi-select; legible at 24 px figure scale and at max zoom-out.
2. **Order confirmation** — click mark + destination ring + dashed route; ≤100 ms acknowledgement of input.
3. **Order in-flight vs arrived** — issued-not-yet-arrived state distinct from settled; queued orders carry an unambiguous ordinal mark (tick or sequence bracket).
4. **Targeting** — explicit-target reticle and grenade reticle are distinct shapes, both non-color backed; reticle strokes ≥2 px.
5. **Stance bits** — Hold Ground / Hold Fire persistent per-operative glance markers readable at 24 px without hover, carried by shape/word/pip (never a new hue).
6. **Threat read** — CorpSec patrol/suspicious/combat marker shapes + blink cadence, sight cones, mirrored on minimap; suspicious vs combat separable at a glance at 720p.
7. **Alert escalation** — edge glow + printed word; two-alarm escalation per §2.8; toasts never the sole channel (HUD Alert state + minimap persist).
8. **Injury/KIA, focus, lock, objective, result** — pip+glyph+text, bracket set, marker shape, per the committed cue list restated in §4.5; binding on every element specified here.
9. **Refusal/disabled** — disabled control + reason copy; never stroke-dimming alone (§4.4: chrome never grays out information).

**Numeric constraints:**

- **Layout floor:** 1280×720, no clipping/truncation at text scale 90/100/110/125%.
- **Type sizes at 100% scale:** data/readout text ≥12 px; absolute floor 10 px for tertiary labels (which must then pass 4.5:1 per below); monospace tabular figures for all numerals; values larger than labels.
- **Stroke widths:** hairline = 1 CSS px, integer-snapped to the device pixel grid; any state-bearing stroke (selection ring, focus brackets, reticles, route, active panel border, crisis hatch) ≥2 px or double-line; hairlines never the sole carrier of a semantic or interactive distinction. Verify at DPR 1, not just Retina.
- **Contrast floors (composited, acceptance-tested):** body/readout text ≥4.5:1 against the composited panel over the worst-case scene (brightest night-preset reflection behind a HUD panel) — token hex on void is not the test. Ink Dim is permitted on panels only at ≥18.66 px bold or ≥24 px; below that, on-panel tertiary text uses full Ink (or a panel-safe Ink Dim token pair is defined). Semantic text on panels uses Hot variants where the base fails (Alarm Red on panels ≈ 4.67:1 fails normal-size text; Red Hot passes). All non-text state indicators (rings, brackets, hatches) ≥3:1 against panel — Ink Faint (2.14:1) is banned from state-bearing strokes and restricted to non-semantic grid/panel texture.
- **Panel fill:** minimum opacity floor (or local scrim) guaranteeing the composited text floor; verified as an acceptance test, not assumed from token hex.
- **Response-time budgets:** order acknowledgement ≤100 ms from input; threat/Alert/targeting first frame ≤100 ms from state change; zero entrance/print animation on red-state, targeting, or selection elements — final state first, decoration may follow; print/typewriter animation permitted only on record surfaces (debrief, research, brief); red toast prints in one frame, holds ≥3 s.
- **Motion budget:** named cap of ~6 simultaneously animating chrome readouts at tactical energy 10; no animation inside hero-shape protected real estate (§3.4); alarm is the only red-cadence motion.
- **Reduced-motion carve-out:** decorative loops freeze; semantic motion (alarm pulse, money tick, selection breathe) reduces to a distinct static state — static hatch, static edge glow, printed word, static `CR` column — never removal. Every motion-backed cue names its static fallback.
- **Token discipline:** no new hex in this section; palette changes touch `src/index.css` + `src/ui/tokens.ts` only.

*Design test:* run any tactical frame at DPR 1, 1280×720, grayscale, and reduced motion simultaneously. Every affordance in the protected list must still read, and every response budget must still hold.

# Section 8 — Asset Standards (Code-Generated Visual Content)

Sections 1–7 fixed the instrument's identity, cadence, line work, ink, people, stage, and glass; this section fixes how the drawing code itself is produced, named, budgeted, reviewed, and reused. Nexus Reborn ships zero art asset files — no `public/` directory, no image textures, no font files, no audio files — so every standard a normal art bible spends on file formats, resolution tiers, approval pipelines, and asset versioning is restated here as a standard on **code that draws**. §8.1–8.3 and §8.8–8.9 are the art-preference half (visual intent); §8.4–8.7 and §8.10 are the engine-constraint half (technical-artist). Where the two touch, this section says *what must be true* and the architecture control manifest says *how it is enforced*. *Serves Pillar 5 — one corporate operating system: an OS renders from one codebase of constants, and so do we.*

## 8.1 Where Visual Code Lives

One medium, one home. Visual code is grouped by its output medium, and a drawing may not live anywhere else:

- **Visual constants** — `src/ui/tokens.ts` is the single source for every hex and rgba any component draws, mirrored by the CSS custom properties in `src/index.css`. A palette change touches those two files and nothing else (§4.1, §7.5).
- **SVG glyphs (DOM iconography)** — `src/ui/glyph.tsx`, `bits.tsx`, `researchGlyphs.tsx`: React components in `currentColor` on a 16×16 viewBox (§7.3).
- **Procedural figures** — `src/ui/figure.tsx` (tactical figure, dossier full-body) and `src/ui/portrait.tsx` (dossier bust), with hash-derived variation from the operative id (§5.2, §5.4).
- **World materials and canvas textures** — `src/scene/cityMaterials.ts` and `src/scene/textures.ts`. Every `makeX()` factory returning a three.js material or CanvasTexture lives here; no other module constructs a texture.
- **World geometry** — `src/world/citygen.ts` (deterministic from `mission.seed`) with `src/scene/cityArchitecture.ts` and `architectureRenderer.ts` turning structure data into line-art (§6).

A visual that could plausibly live in two homes takes the home of its output: drawn by DOM/SVG → `src/ui`; drawn by the three.js feed → `src/scene`; computed as world data before rendering → `src/world`. New top-level visual directories are not opened without art-director and technical-director sign-off.

**Module naming** follows the existing convention: camelCase file names; a visual module is named for what it draws or the family it draws (`figure`, `portrait`, `researchGlyphs`, `cityMaterials`), never for a technique or a sequence — no `helpers2`, no `misc.tsx`. Test files sit beside their module.

## 8.2 Naming Generated Things

Names state **meaning and role, never value, technique, or first consumer**:

- **Tokens**: SCREAMING_SNAKE_CASE, named semantics-first — by role (`AMBER`, `INK_DEEP`, `GUN_IRON`), by ramp and step (`ARMOR_LIT` / `ARMOR_MID` / `ARMOR_LOW`), or by hue and alpha strength (`TEAL_A45`, `RED_A6`). Never name a token after its hex value, its component, or where it was first used: `TEAL_A45` may legitimately serve ten panels, while `AMBER_HEADER` would have stranded it there forever.
- **Glyph components**: PascalCase nouns named for what is depicted (role badge, KIA mark, weapon profile), one family per module. Solid versus outline treatment is a prop, not a component split (§7.3).
- **Material and texture factories**: `makeX()` — `makeGroundMaps`, `makeGlowTexture`, `makeArchitectureMaps`. The name names the output; parameters name the variation.
- **Figure parts and hash-varied traits**: camelCase, named per §5.2's trait vocabulary — `visorBand`, `trimLine`, `crest`, `rigLayout` — so bible, code, and review tests share one word per part.

## 8.3 Detail Tiers — the Resolution Ladder

Texture resolution tiers become **detail budgets per class**: a cap on the primitives a drawing may spend. Budgets are class properties (§6.2), never per-instance taste, and each lives as an exported constant in the module that enforces it — glyph budgets beside the glyph modules, geometry and light caps in the scene layer — never as an inline literal. This subsection is the index of those constants. Figures marked *provisional* await the §20 performance budget; the rest are already fixed by Sections 5–7.

- **SVG glyph classes** (path commands at 16 px, viewBox fixed): corner and micro marks ≤ 12; standard labels ≤ 24; identification and state marks (role badges, KIA, reticles) ≤ 40 — the §7.3 ceiling, hard. A glyph over budget is redrawn, not scaled; 24 px rendering is dossier/roster scale only. *(These govern SVG/DOM glyphs; 3D world-space geometry has its own budgets in §8.4 — the two media are never budgeted against each other.)*
- **Figure classes**: the 24 px tactical figure spends on outline + ramp fills + one trait, interior paths zero; dossier full-body and portrait carry the full interior budget. LOD is subtractive-only (§5.4): far = near minus interior, never a re-authored far variant.
- **Instrument circles (SVG)**: rings and reticle arcs are rationed to a fixed segment budget — direction: 32–48 segments for rings, fewer for arcs. *(3D world marker rings are budgeted separately in §8.4.)*
- **3D geometry classes** *(provisional until §20)*: prisms and boxes are hard-edged quads with zero smoothing segments; curve segments appear only on living things and rain (§3.2).
- **Lights**: ≤ 70 sodium lamps per district, ≤ 120 district-wide total (§6.2, §6.3) — fixed.
- **Props**: ≤ ~200 per district (§6.3) — fixed.

When §20 lands, its numbers supersede the provisional values here: budget constants are edited in their one home, snapshots regenerate (§8.8), and this table is updated in the same change.

## 8.4 Engine Geometry and Material Budgets

All numeric budgets in this subsection are **[PROVISIONAL — pending §20]** until performance budgets are ratified. Fixed constraints already in force (200-prop cap, 70/120 lights, 96×96 m districts, ~24 px figures, ≤4 type-size steps, ~6 animating readouts) are **not** provisional.

At tactical zoom every figure reads at roughly 24 px; geometry past the point of silhouette legibility is waste, not fidelity.

| Category (3D) | Triangle budget | Vertex budget | Notes |
|---|---|---|---|
| Building | ≤ 900 tris assembled | ≤ 600 verts | Built from the shared kit (stepped tower masses, inset commercial doors, structural bays, industrial ribs/shutters). Parapets, vents, conduits, signs stay inside the footprint/height envelope. Fades to one exterior shell — the shell, not the parts, is the persistent draw. |
| Prop (of the ~200 cap) | ≤ 150 tris | ≤ 100 verts | Simple dressing (bollards, barriers, crates) ≤ 48 tris. Props never block raycasts; the invisible ground plane and pick proxies own input. |
| Operative figure | ≤ 200 tris | ≤ 150 verts | Silhouette-first: pose must read at 24 px. Picking uses the unit pick proxy, never the figure mesh. |
| CorpSec figure | ≤ 200 tris | ≤ 150 verts | Silhouette-first; differentiated from operatives by mass grammar only (slab vs wedge; rank = mass steps) — never by palette or hue (§5.2). Picking uses the unit pick proxy, never the figure mesh. |
| Civilian | ≤ 120 tris | ≤ 90 verts | Lower than operatives; civilians never justify combat-grade detail. |
| Marker / ring (3D world-space) | ≤ 24 tris | ≤ 24 verts | Click markers, destination rings, route dashes. *(SVG glyph budgets are §8.3's, never this table's.)* |

SVG figure/portrait work goes through the shared helpers in `ui/figure.tsx`/`ui/glyph.tsx`; points are formatted, never hand-inlined. Every colour in TS/SVG or canvas paint imports from `tokens.ts` — no hex or rgba literals except neutral white/black tints.

Material-slot ceilings per category [PROVISIONAL — pending §20]:

- **Building:** ≤ 4 slots — façade, emission, roughness, sign. These are the shared canvases painted in `cityMaterials.ts`; new building parts must reuse them. World-space UVs keep the six-metre tile scale consistent across dimensions and setbacks.
- **Prop:** ≤ 2 slots. **Figures (operative/CorpSec/civilian):** ≤ 1 slot each, pooled per figure class — no per-unit material instances, and no faction palette split (§5.2: affiliation is mass and shape, never hue). **Markers/rings:** ≤ 1 slot.

TSL node material rules (WebGPU path):

- All scene materials are node materials from `three/tsl`. GLSL `ShaderMaterial` is **forbidden on the WebGPU path** — a material that needs custom behaviour is written as TSL nodes or it does not ship.
- Materials are shared and instanced-by-material; a new visual need is met by adding a node to an existing shared material or a new shared material, never by cloning per object.
- Glow is emissive-only: anything that should bloom gets an emissive material feeding the emissive MRT target. Neon density wishes are met with emissive materials, **not** extra lights (§8.10).

## 8.5 Render Memory and Draw-Call Discipline

- **Instancing/merging:** repeated boxes and planes are instanced by material (`architectureRenderer.ts` precedent). Every part has exactly one owner; when the owner fades, all solid parts vanish together and one shell replaces them — no floating roofs, signs, or conduits. New city geometry declares its instancing group at design time, not batched after the fact. Architectural meshes never raycast.
- **Draw calls:** [PROVISIONAL — pending §20] ceiling of 300 draw calls per district frame across ≤ 24 instanced batches per material family. Exceeding the batch ceiling is a generation-time error, not a runtime cost.
- **Allocation:** hot per-frame rendering (units, FX, rain) reuses preallocated pools and buffers; event-driven allocation stays bounded. No allocation in the frame loop.
- **Lights:** the fixed budget holds — 70 street lamps, 120 total lights per district. It is not a quality knob and not negotiable per seed; generators that exceed it are rejected at generation time, never dropped at runtime.
- **Textures:** CanvasTextures generated in code from tokens only. [PROVISIONAL — pending §20] ≤ 512×512 per canvas texture, shared atlas per material family, total runtime texture memory ceiling 64 MB.
- **DOM vs canvas layering:** DOM owns screens, menus, panels, and text; the canvas owns the world. World-anchored labels are canvas-rendered textures or pre-baked SVG — drei `Html` is forbidden in the scene. The ~6 simultaneously animating chrome readouts cap (§7.5) is fixed; a readout that must animate beyond that waits its turn or doesn't animate.

## 8.6 Build Constraints (Vite / TypeScript)

- **Zero asset files:** no `public/`, no imported binary textures, fonts, or audio from visual code. Everything visual is generated at runtime (CanvasTextures, SVG, TSL). Adding an asset file under `public/` breaks the constraint, not the rule.
- **No dynamic asset imports:** no `import()` of assets, no URL-constructed loads. If it can't be expressed as code, it doesn't ship.
- **Tree-shaking hygiene:** import from `three/webgpu`, node materials from `three/tsl`, addons from `three/addons/...` — deep, named imports only; no namespace imports that defeat shaking. New runtime dependencies require a lockfile entry and are limited to the approved set (react, react-dom, three/webgpu, @react-three/fiber, zustand, drei).
- **Deterministic seeds:** gameplay, campaign, and procedural generation use seeded RNG only — `mulberry32` for simulation/campaign, `hashOf`/`rngFrom` for portraits and figures. Architectural variation is deterministic and does not consume the simulation RNG. Only presentation-only rain and audio may use `Math.random()`. A given seed must produce identical geometry on every machine and every build.
- **Strict TypeScript:** visual generation code typechecks under the project's strict config with the shared helpers (`CITY_SIZE`, `cellIndex`, `isWalkable`); no `any` escapes in generators. The same build must render identically on WebGPU and WebGL2 within tier rules (§8.7) — which is exactly why WebGPU-only material paths are banned.

## 8.7 Quality Tiers — What Scales and What Never Does

Tiers are data (`game/quality.ts` — module to be created alongside the §20 performance budget; the [PROVISIONAL — pending §20] markers in §8.3/§8.4 land here), resolved once per mission mount, never per frame:

| Tier | DPR max | Rain | Bloom |
|---|---|---|---|
| High | 1.75 | ×1.0 | on |
| Medium | 1.25 | ×0.5 | on |
| Low | 1.0 | ×0.15 | off |

AUTO resolves WebGPU → high, WebGL2 fallback → medium. A frame governor (28 ms moving average after an 8 s grace, held 6 s) steps the persisted setting down one tier, never up mid-mission.

**Quality scales only:** render resolution (DPR), rain density, and bloom on/off. Nothing else.

**Never a tier casualty:** tactical readability — building ghosting, occlusion opacities (0.16 squad / 0.45 street) and probe coverage, pick proxies, markers and rings, figure silhouettes, the palette, the light budget, and all §8.4 geometry budgets. The WebGL2 fallback is a first-class target: every asset must read fully at Medium.

## 8.8 Review — What Replaces Art Approval

There are no files to approve, so approval attaches to **rendered output, deterministically reproduced**. The pipeline is deterministic precisely so that review can be evidence, not opinion:

- **Golden snapshots.** Every visual family — glyph set, figure at 24 px and at dossier distance, portrait, district at a fixed seed, minimap, panel chrome — renders at fixed inputs (fixed seed / operative id, 1280×720, DPR 1) into snapshot images kept for review. A visual change lands only with its snapshots regenerated deliberately; an unexplained snapshot diff is a bug, and a deliberate diff is the review artifact itself. Because id-hash and seed inputs are stable (§5.4, §6.2 #4), identical inputs must produce identical pixels — determinism is what makes the diff trustworthy.
- **Side-by-side distance tests.** The §5.4 design test is automated, not remembered: each operative renders at 24 px beside its dossier figure, and the test asserts far = near-with-interior-removed and that squad accents separate at 24 px.
- **Hostile-condition tests from §7.5.** Every review set includes grayscale (semantic survival per §4.5) and DPR 1 (hairline integrity) variants; red-state and reduced-motion frames show their static fallbacks.
- **The bible's design tests are the review checklist.** A reviewer's verdict cites the violated test by § number, not taste; taste arguments are settled by amending this bible, never in review comments.

## 8.9 Versioning and Reuse — Token Discipline for Drawn Values

The rule that already governs color extends to every drawn value: a hex, rgba, or budget literal never appears in drawing code — colors import from `tokens.ts`, budgets from their enforcing module (§8.3).

- **Share a token when meaning and role are identical.** The same amber price in the HUD and on a world marker is one token, because §4.4 requires exactly that: one set of literals across the world/HUD boundary.
- **Fork to a new token when meaning diverges, even if the values are today identical.** Environment amber (`#ffb46b`) and Ledger Amber (`#f0b445`) are the canonical pair — near hues, opposite meanings. When one surface's value wants to drift from a shared token, create a new named token; never nudge the shared one, which silently re-prices every other consumer.
- **A recurring strength becomes a token on its second use.** The `TEAL_A*` ladder exists because per-panel one-off alphas drift; a strength used twice is a strength with a name. A genuinely one-off, non-semantic value stays local to its module but still enters through a named local constant, not an inline literal.
- **Supersede in place; keep no variant graveyard.** A redrawn glyph replaces the old one in the same module — git history is the archive. No `V2`, `_old`, or deprecated-but-imported variants: dead visual code is deleted in the same change that lands its replacement, with the snapshot diff as the before/after record.
- **Version the rendered look, not the code path.** A change that alters what players see carries its regenerated snapshots and a note in this section; a pure refactor (rename, move) must come back pixel-identical in snapshots — that identity is the proof the refactor was safe.

## 8.10 Conflicts Resolved (stated, not buried)

1. **Bloom vs. the postprocessing ban.** Bloom *is* a postprocess. Resolved: bloom runs only through the project's own emissive-MRT pass in `Effects.tsx`; the `postprocessing`/`EffectComposer` packages stay banned, and any new screen-space effect must route through that same pass or be rejected. Art may not propose a second effect stack.
2. **Per-tier LOD vs. single geometry truth.** An LOD ladder would cut draw calls on Low, but doubles the geometry source of truth per building and risks silhouette pops at tactical zoom. Resolved against LOD: one geometry per building, scaled by §8.4 budgets. Revisit only if §20 budgets prove unreachable.
3. **Figure detail vs. the 24 px cap.** Portrait-grade detail is legitimate — but it lives in UI (DOM/SVG at native resolution, via `ui/portrait.tsx`). World figures stay capped at ~24 px; effort spent past silhouette legibility is spent twice.
4. **Neon richness vs. the 120-light cap.** More visible neon is welcome; more lights is not. The path is emissive materials read by the bloom pass, not additional light sources. A district generator that exceeds the light cap is a bug, not atmosphere.
5. **Glyph budget collision (art tiered ladder vs flat technical cap).** Resolved by medium: SVG/DOM glyphs follow §8.3's tiered ladder (12/24/40 path commands); 3D world-space marker/ring geometry follows §8.4's triangle/vertex table. Neither budget governs the other medium.

*Design test for the whole section:* pick any drawn pixel on screen and answer — which module drew it, which token or budget it spent, and which snapshot test catches it regressing? An answer that ends in *somewhere in the component* is a violation of this section.

# Section 9 — Reference Direction

Sections 1–8 fixed the instrument; this section fixes where its visual DNA is licensed from and where the game deliberately parts ways with each source. The rule for reading every entry below: a reference licenses a **technique**, never a look. Any single reference pushed past its stated scope produces a derivative frame, and a derivative frame is a failure of the one-instrument identity — the terminal's appearance must resolve as "Nexus Global's OS," not as "that game/film."

---

## 9.1 Primary Reference — `inspiration/05-gameplay-ui.png` (the approved frame)

The single user-approved image; every other entry below is subordinate to it. It establishes the target: a rain-soaked district at night rendered as one dense instrument panel — cyan-ringed operatives on reflective ground, thin hairline panels with corner brackets and stacked monospace readouts (squad link, comms log, weapon inventory, wireframe minimap), red held to the checkpoint's alarm signage, amber to street commerce.

**Draw specifically:** (1) the **wet-ground reflection logic** — neon and band lighting read twice, once at the source and once as a vertical smear on the ground plane; this is how the tactical feed gets depth without fog gimmicks or bloom-stacked skies. (2) The **ring-on-reflective-ground operative read** — the clean cyan circle cutting through visual noise is the frame's entire command language in one device. (3) The **HUD grammar**: hairline strokes, corner brackets, monospace numerals, panels that abut the frame edges rather than floating with shadows — exactly the grammar Section 3.3 codifies.

**Explicitly diverge from:** the frame's **render fidelity and photographic density**. It is a painted/rendered keyframe: painterly grime, photoreal material detail, soft shadows under props. This project is code-generated flat geometry — take its *lighting logic and panel grammar*, never its paint. Also tighten where it is loose: the reference spends red and amber more freely than Principle 2 allows (its checkpoint reds and warm signage approach atmosphere rather than semantics). The game's discipline is stricter — red alarms, amber costs, nothing else.

## 9.2 *Blade Runner 2049* (dir. Denis Villeneuve, dp. Roger Deakins) — rain as a luminous medium

**Draw specifically:** the film's rule that **rain and fog are only visible because light passes through them** — atmospheric volume is revealed by backlighting from practical sources (signage bands, headlight sweeps, single monolithic projections), never drawn as texture. Also the **band-lighting composition**: large frames built from a few wide horizontal/vertical light bands with vast darkness between them, so depth is stated in two or three luminance steps. This is the technique license for Sections 2.6 and 3.4's dissolve-into-fog supporting geometry.

**Explicitly diverge from:** its **teal-orange complementary warmth and monumental scale romance**. Deakins' frames are warm-hearted; the district must be cold and indifferent infrastructure (§3.2). No orange counter-warmth against the cyan — the only warm pixels in the game are amber money pixels. And none of the film's gigantism-for-awe: spectacle here is what restraint leaves visible (Principle 3).

## 9.3 *Alien* (1979) — the MU/TH/UR terminal: the machine's speaking voice

**Draw specifically:** the onboard computer's interface — **text is the entire UI**: all-caps monospace blocks on near-black, hierarchy produced purely by size, weight, and opacity tiers (directly ancestral to the Ink Dim / Ink Faint tiers of §4.1), with the machine's clipped, unpunctuated report cadence ("INTERFACE 2037 READY"). This licenses Section 7.2's typography direction and the boot-log/ticker mood-carriers of §2.1: the terminal speaks in terse status lines, never prose, and is never wrong or chatty.

**Explicitly diverge from:** the film's **green phosphor hue** (the terminal's ink is Signal Cyan/Telemetry Ink — green is quarantined to nominal-confirmation in §4.2), its **CRT skeuomorphism** — no curved-glass bulge, scanline overlay, flicker, or phosphor-glow filters; §3.3 bans simulated depth and the terminal is a modern readout, not an antique prop — and its **used-future grime**. The Nostromo is decaying; the Nexus terminal is clean, maintained, indifferent. Wear is not character here; composure is.

## 9.4 Technical-drawing convention (ISO 128 / patent-lineart drafting) — the meaning of line weights

**Draw specifically:** drafting's codified **line semantics**: hairline for structure and dimension, heavy closed outline for the object of record, **dashed line meaning "hidden edge — present but not visible,"** and **section hatching meaning "cut / not traversable."** This is the working license for §3.4's hero/support contract (broken outline = "you cannot order this") and §4.3's contested-sector hatch — the game inherits a century-old visual grammar that operators already read correctly, which is exactly what a corporate OS would use.

**Explicitly diverge from:** **blueprint aesthetics** — no cyan-on-blue paper ground (the ground is Void Black), no ornamental compass work, title blocks, or vintage drafting flourishes, and no sepia "old engineering document" grading. We take the grammar of the lines, not the nostalgia of the paper. The terminal draws like a plotter because it is a plotter, not because it is imitating one.

## 9.5 Swiss International Typographic Style (Josef Müller-Brockmann's grid) — data as layout discipline

**Draw specifically:** the **modular grid as the only compositional authority**: every panel's internal content aligns to shared column edges across the whole screen, and hierarchy is achieved exclusively through **size, weight, and alignment — never through boxes, rules, fills, or icons added for emphasis**. Also the discipline of **negative space inside dense frames**: information-dense does not mean cluttered; the grid's gutters carry the legibility. This licenses §7.4's readout stacking and §2's pressure curve (density changes *quantity* of grid cells, never their order).

**Explicitly diverge from:** its **paper-white ground and warm neutral palette** — inverted here: the grid lives on Void Black with cyan ink — and its art-school objectivity-as-neutrality posture. The terminal's grid is not neutral: it is authored by a corporation to make money legible first (§2.4's payout-at-equal-weight rule). The grid is a tool of the ledger, and nothing in the game pretends otherwise.

---

## 9.6 Named Anti-References (do not consult for direction)

- ***Cyberpunk 2077*** and genre-excess cyberpunk art generally — saturation as decoration, bloom-stacked skylines, yellow-*everything* branding. Directly violates Principle 2's spend discipline. Everything it does with color, this game does with scarcity.
- ***Ghost in the Shell* (1995) background cityscapes** — gorgeous, but painterly, warm-accented, and humanist; consulting it will pull the district toward art assets the pipeline cannot produce and a warmth the fiction forbids.
- **Gaussian-blur glassmorphism / Apple-style translucency (vibrancy, backdrop blur, rounded panels, drop shadows)** — the modern UI default. §3.3 bans it outright; translucency here is flat dark fill (Dead-Glass Panel), never blurred depth.

**Consolidation test for any future reference:** it may enter this section only by naming one technique no existing entry licenses, one color behavior consistent with §4, and one explicit divergence. If the only thing it adds is "the same aesthetic again," it is not additive — it is a second voice, and the terminal has exactly one.
