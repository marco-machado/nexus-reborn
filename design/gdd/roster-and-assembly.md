# Roster and Assembly

> **Status**: In Design
> **Author**: extract from docs/game-design.md §8
> **Last Updated**: 2026-09-08
> **Implements Pillar**: Command, do not micromanage; The two layers feed each other
> **Living spec**: `docs/game-design.md` §8 — this file aliases it; do not fork rules
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

The roster is the house’s living operatives — cap eight, campaign starts full — and **Assembly** is where the director inspects dossiers, assigns **one to four Ready** operatives to Squad bays, wears or pins augmentation bays, fills Item slots, and passes the **deployment mass gate**. Inspection and assignment are separate; at least one operative stays assigned while the player edits. Empty squad bays do not block deploy; every assigned operative must be Ready; a selected contract and mass **over 400 kg** still refuse. A kill is permanent (KIA at debrief). Injury recovery and the candidate market run on **strategic time**; a win’s ETA catch-up can finish recovery in the same debrief ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Quiet replay still applies roster ([ADR-0004](../architecture/adr-0004-quiet-replay.md)). Worn blueprints and experience are sampled at deploy, not mid-mission ([ADR-0005](../architecture/adr-0005-blueprint-assignment.md), [ADR-0002](../architecture/adr-0002-unsaved-mission.md)). Without this system the director has no personnel choice, research has nowhere to land on a later firefight, and a kill is not a campaign cost.

Rules and numbers stay in `docs/game-design.md` §8. This overview does not fork them.

## Player Fantasy

You assign who walks the street. You do not walk it. Assembly is the last room of the same terminal: inspect dossiers, assign one to four Ready operatives, wear or pin augmentation bays, fill Item slots, pass the mass gate. Empty Squad bays do not block; sending fewer than four is a command, not a fail. Inspection and assignment stay separate. Worn blueprints are house issue — current issue, pins, sampled at deploy — not a locker. Injury and hire run on the same strategic clock as the laboratories; a kill is permanent and the next assignment uses who is still Ready. Quiet replay still applies the roster. The fantasy fails if every bay must be filled, if wear is owned hardware, if dossiers become character drama, or if this room looks like a second game.

This serves **Command, do not micromanage** and **The two layers feed each other**. It does not own the five verbs (Tactical), the Credits refuse on hire (Economy), or the invoice (Economy).

## Detailed Design

### Core Rules

1. **Alias.** Starting-roster rows, role active/passive rows, authored weapon masses, injury duration, and per-operative mass live in `docs/game-design.md` §8. This section names owners, gates, and DTO edges. Do not copy those tables. CONTEXT.md owns names.

#### Deploy

2. **Squad.** Every mission deploys **one to four Ready** operatives. Empty Squad bays do not block. Sending fewer than four is a command, not a fail. Default four: Mara, Ghost, Dart, Torq (pointer to §8).

3. **Inspection ≠ assignment.** Focusing a dossier does not assign. While editing assignment, **at least one** operative stays assigned. That is an edit constraint, not a post-KIA invariant: a kill may leave bays empty, including all four.

4. **Deploy gate (all required).** (a) a selected contract; (b) at least one assigned operative; (c) every assigned operative **Ready**; (d) squad Deployment mass **not over** the §8 limit (exactly the limit is allowed; over refuses and the button names the overage). Assembly is reachable between contracts; Deploy is refused without a selected contract.

5. **Sample at mission create.** Worn slotted blueprints, unslotted research, Experience, item pools, and mass/speed tier freeze when the mission is created. They cannot change a squad already on the ground ([ADR-0002](../architecture/adr-0002-unsaved-mission.md), [ADR-0005](../architecture/adr-0005-blueprint-assignment.md)). Abort = no debrief = roster unchanged.

6. **Cut.** Partitioned deploy snapshot; no live store handles. World Network must not query live Roster or the running mission. Outcome DTO at debrief is the only roster write-back, applied once.

#### KIA / injury / hire

7. **KIA.** A kill is permanent. Debrief removes the operative, lists them under KIA, and emits names on the outcome DTO. World Network posts the red Feed line; Roster does not post Feed and does not keep a Dead roster state. Their Squad bay is empty. Death drops that operative’s bay assignment, not the research program.

8. **Injury.** A **living** survivor whose end HP is below the §8 threshold of maximum health returns **Injured**. A dead operative is KIA, not an injury at zero health. Newly injured leave the squad at debrief and cannot be assigned until strategic time finishes recovery. Recovery does not restore the cleared Squad assignment. Duration, bounds, and the injury line (original duration, rounded up to hours — not remaining downtime after ETA) stay in §8. Raven opens Injured on the §8 opening downtime.

9. **Injury vs ETA.** Debrief records injury and clears assignment at strategic `t0`. A **win** (quiet replay included) then spends ETA and catches up recovery at `t1` ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Remaining downtime is `max(0, t0 + D − t1)`. A **loss** spends no ETA.

10. **Experience.** Each survivor is awarded Experience at debrief, including quiet replay ([ADR-0004](../architecture/adr-0004-quiet-replay.md)). Bonuses apply on the **next** deployment, sampled with research. Magnitudes are not authored in §8 — do not fork code constants here. KIA receive none. Abort awards none.

11. **Hire.** Assembly offers **three** procedural candidates, one new candidate every **24 strategic hours** on the same clock injuries recover on. A candidate has a stable name, face, one of the eight roles, health and speed inside the authored starting-roster ranges (§8), and that role’s primary weapon. They arrive **Ready** on **current issue** in every bay. Cost is the §8 Credits range by quality. Roster owns the market and the body; **Economy owns the Credits refuse**. Hire is also refused on a full roster.

#### Roster

12. **Living eight.** Cap eight; the campaign starts full. The eight are a **starting roster, not a protected cast**. Living conditions are **Ready** or **Injured** only. The dead are gone.

13. **Wear / pin** ([ADR-0005](../architecture/adr-0005-blueprint-assignment.md)). Research owns the program, home bay, and current-issue identity. Assembly wears and pins. Four augmentation bays. A bay wears at most one completed slotted project that belongs to it. Blueprints, not instances. Unpinned bays, including new hires, wear current issue. A pin holds stock issue or an older completed project. A new completion updates unpinned bays only. Prerequisites gate research, not wear.

14. **Campaign fail.** An empty Roster fails an **incomplete** campaign. World Network posts the failure banner and locks contracts. A **completed** campaign stays complete after a roster wipe; it is not also marked failed.

15. **Clock and save.** Strategic time runs on Assembly. Injury recovery and the candidate market catch up after a Screen tick or a **win** ETA jump. Persistence saves the roster blob. Mission and debrief are not saved.

#### Roles

16. **Kit.** Every role has one active and one passive. Rows stay in §8. Q fires the actives of the **current selection**. A targeted active that finds no target reports on the comm log and **keeps** its cooldown. Tactical executes; this system owns the kit.

#### Items

17. **Pools, fixed at deploy.** Med kits and power cells are squad-shared, sampled at deployment. Base, role grants, and filled Item slots stay in §8. Base and role-granted pools do not add Deployment mass; explicit Item slots do.

18. **Use.** Med kit and power-cell effects stay in §8. Power cells also arm grenades (Tactical spends the same pool). Empty or invalid use reports on the comm log and spends nothing.

#### Mass

19. **Gate and tier.** Formulas stay in §8. Squad mass is the sum across the **assigned** operatives. Mass **over** the §8 limit blocks Deploy; **equal** is allowed. Mass also sets a squad-wide speed tier at deploy. The whole squad shares one tier.

#### Typical use

20. Select a contract (free). Open Assembly. Inspect without changing the squad. Assign one to four Ready. Wear or pin; fill Item slots. Read mass and tier. Deploy if rule 4 passes. Debrief applies KIA, injury, Experience once. A win’s ETA may finish recovery the same debrief. Hire if Credits and cap allow.

#### Player cannot

- Deploy with zero assigned, any assigned Injured, no selected contract, or mass over the §8 limit.
- Assign more than four, the same operative twice, Injured, or KIA.
- Unassign the last remaining assigned operative while editing.
- Treat empty Squad bays as a Deploy fail.
- Revive KIA, keep a Dead roster state, or destroy the research program on death.
- Treat a corpse as Injured at zero health.
- Assign Injured before recovery completes, or expect recovery to restore the old Squad bay.
- Hire on overdraw or a full roster. Roster does not keep a Credits ledger.
- Change wear, pins, items, assignment, or Experience mid-mission.
- Own unique implants / a locker / per-gun loadout.
- Have World Network live-query the roster or the running mission.
- Skip roster consequences on quiet replay, or write roster on Abort.
- Fail a completed campaign by wiping the roster.
- Copy §8 starting-roster or role tables into this GDD.
- Companion death beats, memorial copy, spoken VO / banter, relationship tracks, backstory dossiers, hiring-as-interview, or KIA as a living dossier. Dossiers are paperwork fields (codename, civilian name as an identity line, role, Ready|Injured, HP/speed/weapons, specialty as one operational line, bays, Experience as numeric deltas). KIA is a debrief line + Feed name + empty bay.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Operative | Ready / Injured; KIA = removed | Debrief t0: Ready → removed if `deadIds`; Ready → Injured if living and below §8 threshold. `sync(t)`: Injured → Ready when `t ≥ recoverAtT`. Loss: no ETA catch-up. Abort: no write |
| Squad bay (×4) | filled / empty | Assign/unassign in Assembly (cannot empty the last while editing). Debrief t0 empties on KIA or new injury. Empty does not block Deploy |
| Inspection | focused dossier / not | Select dossier. Does not assign |
| Assignment | unassigned / assigned | Ready only. Max four. Distinct operatives |
| Bay pin (×4 per body) | unpinned (current issue) / pinned stock / pinned older completed | Assembly cycle. New completion updates unpinned only. Hire: all unpinned. Death drops assignment, not the program |
| Item slots (×2 per body) | empty / med kit / power cell | Assembly. Frozen at deploy. Persistence across visits is an Open Question |
| Candidate market | 0–3 offers | One new every 24 strategic hours on the injury clock. Hire removes that offer. Post-hire backfill is an Open Question |
| Deploy gate | blocked / clear | Clear iff selected contract ∧ ≥1 assigned ∧ all assigned Ready ∧ mass not over §8 limit |
| Campaign | live / complete / failed-empty-roster | Complete = all three authored won. Failed = living roster empty **and** not already complete. Cannot be both. Hire-on-failed is an Open Question |
| Mission coupling | Strategy / Deployed / Debrief apply-once / Abort discarded | Deploy copies Roster slice; field does not tick injuries or the market; abort writes nothing |

**Debrief clock order:** (1) **t0** apply Roster from outcome DTO once — KIA, new injuries + bay clear, survivor Experience, kia names out, campaign flags. (2) If **win** (including quiet replay): ETA → **t1**; `sync(t1)` catches recovery and candidate refresh. (3) **Loss:** stop after t0. (4) **Abort:** skip 1–3.

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | Strategic `t` after Screen tick or win ETA | **kia names** on the outcome DTO (not a live query). Campaign fail/complete flags for banners | WN owns clocks/Feed banners. Roster owns bodies. `deadIds` / `survivorHp` stay Roster-owned |
| **Economy** | Refuse or debit on hire | Hire request + candidate cost | Roster owns bodies and the hire range. Economy owns the Credits refuse |
| **Research** | Current issue; completed program; home bay | Pins; wear; hire (unpinned); death drops assignment | Roster owns pins/wear/bodies. Research owns program and current-issue identity. Research deploy slice is the **unslotted set only** |
| **Tactical** | — | **Roster slice** of the partitioned snapshot | Neither live-queries the other |
| **Interface** | Assign / inspect / pin / item slots / hire / deploy | Dossier, bays, mass/tier, gate reason, market, debrief roster lines | Presentation only |
| **Persistence** | — | Living roster, pins, Experience, injuries, candidates, campaign flags | Strategy autosave. Mission + debrief not saved |

**Deploy snapshot — Roster slice (frozen):** assigned ids (1–4); **resolved wear** per assigned operative (at most one slotted project per bay); loadout (two Item slots of the assigned); mass (squad kg + tier); sampled HP/speed (body + unslotted + worn slotted + Experience; squad-wide mass-tier speed applied here). Do not pass live store handles. Do not put worn ids on the Research slice.

**Outcome DTO — Roster fields (apply once):** `deadIds`; `survivorHp` (end fraction, survivors only); kia names (resolved at t0); new injuries (id, original D). Abort is **absence of an outcome**. Economy does not read these fields. World Network reads **kia names** only.

Provisional: Research GDD is Overview-only. Persistence / Tactical / Interface GDDs are not extracted.

## Formulas

Do not fork. Canonical expressions and worked examples: `docs/game-design.md` §8.

Roster owns six live formulas: `injuryRecoverySec`, `operative_mass`, `squad_mass`, `mass_gate`, `mass_tier`, `remaining_downtime`. Hire cost is a **range constant**, not a formula. Experience award is a **named rule** without §8 magnitudes. `net_payout` and the Credits refuse are Economy.

The `injuryRecoverySec` formula is defined as:

`injuryRecoverySec = round(43200 + (1 − clamp(f, 0, 0.35) / 0.35) × 129600)`

Invoke only for a **living** survivor with end-health fraction `f` in `(0, 0.35)`. The helper clamps its input; the injury rule does not call it at or above 0.35, and a dead operative is **KIA**, not an injury with `f=0`. At `f ≥ 0.35`, no new injury is applied.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| end-health fraction | f | float | invoked on (0, 0.35); dead is not f=0 | Survivor HP / max HP at mission end |
| injury threshold | 0.35 | float | 0.35 | Fraction at or above which no new injury is applied (§8) |
| floor duration | 43200 | int | 43200 | Strategic seconds (12 h) just under the threshold |
| duration span | 129600 | int | 129600 | Extra strategic seconds toward near-death (12 h + 36 h = 48 h) |
| recovery duration | D | int | 43200–172800 when invoked | Strategic seconds until Ready; after `round` |

**Output Range:** Integer strategic seconds. When invoked on (0, 0.35): just under threshold → 12 h (43200 s); near-death → 48 h (172800 s). Not invoked for KIA or for `f ≥ 0.35`. The debrief injury line reports this **original** D, rounded up to hours — not remaining downtime after ETA.  
**Example:** At `f=0.175`, `D=108000` s (30 h). 12 h just under threshold; 48 h near-death.

The `operative_mass` formula is defined as:

`operative_mass = 60 + Wprimary + Wsidearm + 0.25 × max(0, H − 90) + 8m + 6c`

`m + c ≤ 2`. `H` is deployment max HP including worn research and Experience. Base and role-granted mission item pools do not add mass; only explicit Item slots do.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| base mass | 60 | float | 60 | kg per operative (§8) |
| primary weapon mass | Wprimary | float | {4.2, 3.1, 1.2, 6.8, 4.9} | Authored assault / SMG / pistol / longrifle / shotgun kg (§8) |
| sidearm mass | Wsidearm | float | {4.2, 3.1, 1.2, 6.8, 4.9} | Authored weapon mass, second slot (§8) |
| deployment max HP | H | float | body table in §8, plus worn research and Experience (magnitudes not in §8) | Sampled at deploy |
| plating floor | 90 | float | 90 | HP above this add plating mass |
| plating kg per HP | 0.25 | float | 0.25 | kg per max-HP point above 90 (§8) |
| slot med kits | m | int | ≥ 0; m+c ≤ 2 | Med kits in that operative’s two Item slots |
| slot power cells | c | int | ≥ 0; m+c ≤ 2 | Power cells in that operative’s two Item slots |
| med-kit slot mass | 8 | float | 8 | kg per explicit med-kit slot |
| cell slot mass | 6 | float | 6 | kg per explicit power-cell slot |
| operative mass | operative_mass | float | no named clamp in §8 | kg for one assigned body |

**Output Range:** No named clamp on the per-body sum in §8. Unassigned operatives are not in this term.  
**Example:** Default four, no research / Experience / filled Item slots = **286.1 kg** (see `squad_mass`).

The `squad_mass` formula is defined as:

`squad_mass = Σ operative_mass` over the assigned operatives (1–4).

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| per-body mass | operative_mass | float | from `operative_mass` | Mass of one assigned operative |
| assigned count | n | int | 1–4 | Assigned Ready operatives; empty bays add 0 |
| squad mass | squad_mass | float | no named clamp in §8 (gate is separate) | kg of the deploying squad |

**Output Range:** Sum of one to four assigned bodies. Unassigned roster members do not add.  
**Example:** Default four (Mara, Ghost, Dart, Torq), no research / Experience / items: Mara 73.9 + Ghost 69.3 + Dart 66.3 + Torq 76.6 = **286.1 kg**.

The `mass_gate` formula is defined as:

`mass_gate_ok = squad_mass ≤ 400`

Mass **over 400 kg** blocks Deploy; **exactly 400 kg** is allowed. The button names the overage.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| squad mass | squad_mass | float | from `squad_mass` | kg of assigned operatives |
| gate limit | 400 | float | 400 | kg; equal allowed, over refused (§8) |
| gate | mass_gate_ok | bool | true/false | true → mass does not block Deploy |

**Output Range:** Boolean. Other Deploy gates (selected contract, ≥1 assigned, all assigned Ready) are Core Rules, not this expression.  
**Example:** 286.1 kg allowed; 400 kg allowed; any mass over 400 kg refused.

The `mass_tier` formula is defined as:

`mass_tier_delta = 0.15 if squad_mass ≤ 340; −0.15 if squad_mass > 380; else 0`

Squad-wide, applied at deployment. CONTEXT names the bands light / standard / heavy.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| squad mass | squad_mass | float | from `squad_mass` | kg of assigned operatives |
| light ceiling | 340 | float | 340 | kg; at or under → +0.15 m/s |
| heavy floor | 380 | float | 380 | kg; over → −0.15 m/s |
| light/heavy delta | 0.15 | float | 0.15 | m/s; sign from the branch |
| mass-tier speed | mass_tier_delta | float | {−0.15, 0, +0.15} | m/s added to the whole squad at deploy |

**Output Range:** Exactly one of {+0.15, 0, −0.15} m/s. ≤340 inclusive; 380 exact is 0 (not heavy); >380 is −0.15. One tier for the whole squad, not per body.  
**Example:** Default four at 286.1 kg → ≤340 → **+0.15 m/s**. 400 kg is allowed and is >380 → **−0.15 m/s**.

The `remaining_downtime` formula is defined as:

`remaining_downtime = max(0, t0 + D − t1)`

Debrief records injury and clears assignment at strategic `t0`, with recovery `t0 + D`. A **win** (quiet replay included) then advances ETA and catches up at `t1`. A **loss** spends no ETA, so this catch-up is not applied at that debrief.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| injury stamp | t0 | int | strategic seconds | Time debrief records the injury |
| recovery duration | D | int | from `injuryRecoverySec` | Original duration, not display hours |
| post-ETA time | t1 | int | strategic seconds after win ETA | Catch-up instant; win only |
| remaining downtime | remaining_downtime | int | ≥ 0 | Strategic seconds still Injured after catch-up |

**Output Range:** ≥ 0. If `t1 ≥ t0 + D`, remaining is 0 (a win, including quiet replay, can finish recovery in the same debrief). Recovery does not restore the cleared Squad assignment. Loss: no `t1` jump at debrief.  
**Example:** Remaining can hit 0 on the same win debrief; the injury line still prints original D rounded up to hours.

**Hire — range constant, not a formula.** Cost is **16,000–34,000 CR** by quality (§8). Roster owns the range and the body; Economy owns the Credits refuse (overdraw) and does not own a second hire curve here. Full roster also refuses. Do not import the quality curve from `recruits.ts`.

**Experience award — named rule, not a magnitude formula.** Each survivor is awarded one Experience point at debrief (CONTEXT **Experience**), including quiet replay. KIA receive none. Abort awards none. Points apply on the **next** deployment, sampled with research. HP and speed **per point** are not authored in §8 — do not copy `XP_HP_PER` or `XP_SPEED_PER`.

**Not owned:** `net_payout` / Credits ledger / overdraft refuse (Economy); `tax_yield` (World Network); current-issue identity (Research); authored chance / Risk index (Tactical / Brief).

## Edge Cases

- **If living `f = 0.35` exactly**: no new injury; stays Ready; `injuryRecoverySec` is not invoked.
- **If living `f > 0.35`**: no new injury; bay not cleared; +1 Experience (next deploy).
- **If living `0 < f < 0.35`**: Injured at `t0`; `D = injuryRecoverySec`; bay cleared; cannot assign until recovery finishes.
- **If end HP is 0 / `f = 0`**: KIA, not Injured. `injuryRecoverySec` is not invoked. `survivorHp` is survivors only.
- **If `squad_mass = 340`**: `mass_tier_delta = +0.15` m/s. Gate allowed.
- **If `340 < squad_mass < 380`**: delta `0`. Gate allowed.
- **If `squad_mass = 380` exactly**: delta `0` (not heavy). Gate allowed.
- **If `squad_mass > 380` and `≤ 400`**: delta `−0.15` m/s. Gate allowed.
- **If `squad_mass = 400` exactly**: gate passes; delta `−0.15` m/s.
- **If `squad_mass > 400`**: Deploy refused; the button names the overage. Empty bays are not the reason.
- **If `H ≤ 90`**: plating term is 0. No negative mass.
- **If `m + c = 2`**: legal; slot mass `8m + 6c`; base/role pools still add 0 kg.
- **If an operative is unassigned**: 0 kg and 0 mission Item pools.
- **If one debrief lists both KIA and injury**: resolve per id. One body is never both; `deadIds` wins if both appear. World Network reads kia names only.
- **If the last assigned dies (Ready remain on Roster)**: that bay is empty. All four bays may be empty. No auto-assign. Next Deploy still needs ≥1 assigned Ready.
- **If the last assigned is newly Injured**: bay cleared; recovery does not restore it.
- **If a win’s ETA finishes recovery in the same debrief** (`t1 ≥ t0 + D`, including quiet replay): remaining `0`; Ready; assignment stays empty; injury line still prints original `D` in hours.
- **If Loss**: KIA/injury/XP at `t0`; no `t1` jump.
- **If Abort**: no debrief; roster writes nothing.
- **If quiet replay**: still KIA / injury / Experience; win still spends ETA.
- **If Credits equal hire cost and roster is not full**: hire succeeds; Credits → 0.
- **If Credits are 1 below hire cost**: Economy refuse; roster unchanged.
- **If roster is already 8**: hire refused; Credits unchanged.
- **If two roster dues share a timestamp**: apply each independently. Do not import World Network’s collision-order table.
- **If the market already has 3 offers and a 24 h due elapses**: stay at 3.
- **If a bay is pinned and a new same-bay project completes**: pinned bay unchanged; unpinned wear current issue; program stays researched.
- **If a new hire**: all four bays unpinned, Ready, current issue.
- **If Deploy with zero assigned, any assigned Injured, no selected contract, or mass > 400**: refused. Empty bays do not block.
- **If unassigning the last remaining assigned while editing**: refused.
- **If inspecting an Injured dossier**: allowed. Assign Injured is forbidden.
- **If a hire duplicates a living role**: not forbidden.
- **If living Roster reaches 0 and campaign is incomplete**: campaign fails; World Network banner and contract lock.
- **If living Roster reaches 0 after campaign complete**: stays complete; not also failed.
- **If always deploying 1 Ready**: legal. Light-tier cheese is allowed. If that body is still >400 kg, refuse as usual.
- **If never hiring**: legal. Empty incomplete Roster still fails.
- **If wiping the Roster after campaign complete**: complete stays complete.
- **If wear/pins/items/assignment/Experience change after mission create**: ignored for that squad.
- **If World Network would query live Roster or the running mission**: forbidden.

Open Questions (no outcome in this section): hire-on-failed-campaign; post-hire market backfill; Item-slot persistence across Assembly visits; hire quality curve; win ETA spanning more than one 24 h candidate interval.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | Strategic `t` after Screen tick or win ETA; Feed banners | Roster emits **kia names** on the outcome DTO. Squad is not World Network state. World Network must not live-query Roster. Campaign fail/complete flags for banners |
| Hard, upstream | Economy and contracts | Credits refuse on hire | Roster owns bodies and the 16,000–34,000 CR range. Economy owns the ledger debit/refuse. Exact-balance spend is Economy. Abort: both write nothing |
| Hard, upstream | Research | Program, home bay, current-issue identity | Roster owns pins/wear/bodies. Death drops assignment, not the program. New hires unpinned. Research deploy slice is the **unslotted set only**; resolved wear lives on the Roster slice. Research GDD is Overview-only — this edge is provisional |
| Hard, downstream | Tactical mission | Roster slice at deploy; outcome DTO at debrief | Neither live-queries the other. Tactical executes role actives and item use; this system owns the kit and frozen pools |
| Hard, downstream | Persistence and validation | Strategy autosave of the roster blob | Living roster, pins, Experience, injuries, candidates, campaign flags. Mission and debrief not saved ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)) |
| Soft, downstream | Interface | Presentation | Dossier, Squad bays, mass/tier, gate reason, candidate market, debrief roster lines |
| — | Audio | None | Screen beds belong to Interface |

**Not dependencies:** authored chance / Risk index (Tactical/Brief); Tax yield (World Network → Economy); `net_payout` (Economy).

Tactical / Persistence / Interface template GDDs are not extracted yet. Interfaces above are vs the living spec and are provisional until those files exist.

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §8. This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer. Do not add HP/speed-per-Experience or a hire quality curve.

| Knob | Owner | Too high / too low |
|---|---|---|
| Roster cap 8 | §8 | Cap 4 collapses replacement; cap 12 makes KIA cheap |
| Squad 1–4 assigned | §8 | Forcing 4 violates Command; 0 assigned is not a Deploy |
| Injury threshold 0.35 | §8 | 0.9 = everyone Injured; 0.05 = injury never happens |
| Injury D 12–48 h | §8 | Instant Ready undoes the clock; week-long downtime makes hire the only path |
| Candidate cadence 24 h / pool 3 | §8 | Instant refill undoes KIA; empty market forever after a wipe |
| Hire cost 16,000–34,000 CR | §8 (range); Economy refuse | Free hire ignores Credits; cost > opening Credits makes first replacement a research-or-hire bind. Do not add a quality curve here |
| Mass gate 400 kg | §8 | Gate below default four (286.1) blocks the opening squad; gate never binding makes mass flavor |
| Mass tier 340 / 380 / ±0.15 m/s | §8 | If light/heavy never fire, the readout is copy. Per-operative speed would punish heavy roles twice |
| Item slot masses 8 / 6 kg; m+c ≤ 2 | §8 | Slot mass 0 makes extra kits free; huge slot mass makes filling a trap vs the 400 kg gate |
| Experience: 1 point per survivor | CONTEXT / §8 award rule | Magnitudes per point are **not** a knob in this GDD |
| Role active CDs / effects | §8 tables | A role that does not change a tactical decision is unfinished — retune in §8, do not fork rows here |

**Interacts:** mass gate × HP plating × Experience × Item slots (all feed `operative_mass`). Injury D × win ETA (`remaining_downtime`). Hire range × Economy Credits. Candidate cadence × same clock as injury.

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Assembly is another room of the same terminal, not a locker and not a character screen. Palette and chrome: pillar 5 / living spec §12–15 (`src/index.css`, `src/ui/tokens.ts`). No `public/` art, no external pipeline, no second visual language for “the team.” In-mission operative chrome (rings, pips, routes, hit flash) is Tactical/Interface; this system owns identity only.

### Principles

- **Pillar 5 — One OS:** near-black / teal / amber / red; thin technical borders; monospace uppercase; shared header + nav with the other three Screens.
- **Pillar 1 — Command:** selection rings, slot tags, health pips — not star models, hero poses, or idle performances. Bay figures are cool armor geometry on a plinth.
- **Anti-pillars:** NOT locker UI. NOT character drama (no photoreal portraits, memorial shrines, interview staging).
- **Pillar 2:** mass kg, overage, and LIGHT / STANDARD / HEAVY must read as actionable copy — never color-only.
- **Pillar 3:** KIA is an empty bay + debrief/Feed name, not a death beat.
- **§12:** critical state never color alone; 1280×720 no clip; reduced motion keeps state readable.

### Style

- Operatives = angular cool armor + personal accent (visor/trim only).
- Dossier face = **stable hash figure** from operative id + codename. Same hash on reload. Not a character render.
- Focus = amber; live/assigned = teal; danger/Injured/mass-over = red.
- Motion: one-frame terminal refresh, border/chip/text swaps, disabled CTA. No particles, implant-surgery VFX, or launch cinematic.

### Event feedback

| Event | Visual | Non-color cue |
|---|---|---|
| Inspect dossier | Amber focus; paperwork fields swap; hash figure replaces in place | Focus ring / selected state |
| Assign Squad bay | Empty bay fills with hash figure, slot plaque, accent visor | Slot index 01–04 |
| Unassign | Bay returns to empty label | `EMPTY BAY` copy |
| Pin / wear bay | Worn name + `PIN` vs `AUTO` chip | Chip text |
| Fill Item slot | Glyph + label + kg; carried-kg line updates | Slot label EMPTY vs item name |
| Mass gate blocked | Mass number **red**; Deploy disabled; control **names the overage** | Disabled CTA + overage copy |
| Mass tier readout | LIGHT / STANDARD / HEAVY + speed delta beside kg | Tier sentence, not bar color alone |
| Hire | Hash bust + role/weapon/cost paperwork; roster row appears Ready | Market fields; no fanfare |
| Deploy | Amber authorization CTA | Enabled `DEPLOY TEAM` copy |
| KIA empty bay | That slot is empty. No portrait, no shrine | Empty-bay copy |
| Injured | Dim/red row wash; `INJURED` status; assign control dead | Status word + disabled assign |

Empty Squad bay is legal chrome, not a fail pose.

### Audio

No spoken VO, banter, or spatial model. Acknowledgements = short **UI click** on inspect/select/assign/unassign/pin/item/hire. Do **not** celebrate KIA, hire, or payout. Strategy industrial bed continues across the four Screens. Mixer/buses stay Interface/Audio.

## UI Requirements

Assembly is one of the four Screens. Shared header: title, Credits, Influence, Intel, Roster, strategic clock. Nav among World Network, Research, Brief, Assembly. Brief unlocks when a contract is selected. Accepting a contract goes straight to Assembly; Assembly remains reachable between contracts; Deploy is refused without a selected contract.

Must support: inspect a dossier (paperwork fields — codename, civilian name as an identity line, role, Ready|Injured, HP/speed/weapons, specialty as one operational line, four augmentation bays, Experience as numeric deltas — not a character sheet); assign 1–4 Ready to Squad bays (inspect does not assign; cannot empty the last assigned while editing); wear/pin four augmentation bays (current issue vs pin vs stock issue readable); two Item slots; Deployment mass readout + active mass tier (light / standard / heavy); Deploy gate with overage named when mass refuses; candidate market of 3; hire authorize disabled on overdraw or a full roster (Economy owns the Credits refuse). Injured is readable including a non-color cue. An empty Squad bay is not a fail state.

1280×720 without clipping or truncation. Keyboard+mouse. Pause, operative slots, and mouse are reserved from remap. Screens and HUD belong to Interface. This GDD only requires that Ready|Injured, Deployment mass and mass tier, Deploy gate reason, wear/pin, hire cost vs Credits, and empty-bay-as-command are visible and actionable (pillar 2 veto: undecorated numbers).

## Acceptance Criteria

Living spec §20 Squad plus this GDD. No invented product performance budgets. Open Questions are not ACs.

1. **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 1 assigned Ready operative (other Squad bays empty), **WHEN** Deploy is requested, **THEN** Deploy is allowed.
2. **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 2 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed.
3. **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 3 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed.
4. **GIVEN** a selected contract, `squad_mass ≤ 400` kg, and exactly 4 assigned Ready operatives, **WHEN** Deploy is requested, **THEN** Deploy is allowed.
5. **GIVEN** a squad with at least one assigned operative, **WHEN** a dossier is focused without an assign/unassign action, **THEN** the assigned set is unchanged.
6. **GIVEN** exactly 1 assigned operative, **WHEN** unassign of that operative is requested, **THEN** the unassign is refused and that operative remains assigned.
7. **GIVEN** all 4 Squad bays empty after KIA or new injury and at least 1 Ready still on Roster, **WHEN** Assembly is opened, **THEN** all 4 bays stay empty (no auto-assign).
8. **GIVEN** Assembly is reachable with no selected contract, **WHEN** Deploy is requested, **THEN** Deploy is refused.
9. **GIVEN** a selected contract and 0 assigned operatives, **WHEN** Deploy is requested, **THEN** Deploy is refused.
10. **GIVEN** a selected contract and at least one assigned Injured operative, **WHEN** Deploy is requested, **THEN** Deploy is refused.
11. **GIVEN** a mission already created (wear, unslotted research, Experience, item pools, mass, and mass tier sampled), **WHEN** wear, pins, items, assignment, or Experience later change on campaign, **THEN** the on-ground squad keeps the sampled freeze.
12. **GIVEN** a mission in progress and living roster R, **WHEN** Abort is confirmed, **THEN** there is no debrief and roster state is still R.
13. **GIVEN** a debrief that already applied the outcome DTO once, **WHEN** the same outcome is applied again, **THEN** those roster writes occur only once.
14. **GIVEN** a deployed mission, **WHEN** tactical time advances, **THEN** living roster, Injured remaining downtime, and the candidate market are unchanged until debrief or Abort.
15. **GIVEN** operative X living and assigned, **WHEN** debrief applies X in `deadIds`, **THEN** X is absent from the living roster (no Dead state), X’s Squad bay is empty, X is listed under KIA, and kia names include X.
16. **GIVEN** X is KIA, **WHEN** the Research program is read, **THEN** completed projects stay researched.
17. **GIVEN** X is KIA, **WHEN** assign X is requested, **THEN** assignment is refused.
18. **GIVEN** a living survivor with `f = 0.35`, **WHEN** debrief applies, **THEN** that operative stays Ready and `injuryRecoverySec` is not invoked.
19. **GIVEN** a living survivor with `0 < f < 0.35`, **WHEN** debrief applies at `t0`, **THEN** they are Injured, their Squad bay is empty, they cannot be assigned, and `D = injuryRecoverySec(f)`.
20. **GIVEN** end HP = 0, **WHEN** debrief applies, **THEN** the operative is KIA not Injured, `injuryRecoverySec` is not invoked, and `survivorHp` lists survivors only.
21. **GIVEN** a new campaign, **WHEN** the living roster is first read, **THEN** Raven is Injured with remaining downtime = 86400 s (24 strategic hours).
22. **GIVEN** an Injured operative whose recovery completes, **WHEN** they become Ready, **THEN** the Squad bay cleared at injury stays empty.
23. **GIVEN** an Injured dossier, **WHEN** it is focused, **THEN** inspection is allowed and assign is refused.
24. **GIVEN** a loss debrief that recorded injury at `t0` with duration D, **WHEN** that debrief finishes, **THEN** no ETA `t1` jump runs and remaining downtime is still D.
25. **GIVEN** S living survivors and K KIA at debrief, **WHEN** the outcome is applied once, **THEN** each survivor’s Experience increases by exactly 1 and each KIA is awarded 0.
26. **GIVEN** Experience awarded at debrief, **WHEN** the next mission is created, **THEN** that Experience is sampled into that deploy; later awards do not change an on-ground squad.
27. **GIVEN** Assembly, **WHEN** the candidate market is read, **THEN** there are exactly 3 candidates, each with a stable name, a face, one of the 8 roles, that role’s primary weapon, Ready, and current issue in every bay.
28. **GIVEN** the market already has 3 offers, **WHEN** 24 strategic hours elapse with no hire, **THEN** offer count stays 3.
29. **GIVEN** a candidate, **WHEN** hire cost is read, **THEN** it is in 16000–34000 CR inclusive.
30. **GIVEN** living roster count = 8, **WHEN** hire is authorized, **THEN** hire is refused, living count stays 8, and Credits are unchanged.
31. **GIVEN** Credits below that candidate’s hire cost, **WHEN** hire is authorized, **THEN** the living roster is unchanged.
32. **GIVEN** living count ≤ 7 and hire succeeds, **WHEN** the new body is read, **THEN** living count increased by 1, the hire is Ready, and all 4 bays are unpinned wearing current issue.
33. **GIVEN** a candidate whose role already exists on a living operative, **WHEN** hire succeeds, **THEN** the hire is allowed.
34. **GIVEN** a new campaign, **WHEN** the living roster is read, **THEN** living count = 8, each operative is Ready or Injured only, Raven is Injured, and the other 7 are Ready.
35. **GIVEN** any operative, **WHEN** augmentation bays are listed, **THEN** there are 4 bays and each bay wears at most 1 completed slotted project that belongs to that bay.
36. **GIVEN** unpinned bays (including a new hire), **WHEN** wear is resolved, **THEN** each unpinned bay wears current issue.
37. **GIVEN** a bay pinned to stock issue or an older completed project, **WHEN** a new same-bay project completes, **THEN** the pinned bay is unchanged and unpinned bays wear current issue.
38. **GIVEN** campaign is not complete and living roster count reaches 0, **WHEN** campaign flags are read, **THEN** the campaign is failed-empty-roster, it is not also complete, and contracts are locked.
39. **GIVEN** campaign already complete, **WHEN** living roster count reaches 0, **THEN** campaign stays complete and is not marked failed.
40. **GIVEN** Injured with `recoverAtT = T`, **WHEN** a strategy Screen tick (including Assembly) reaches `t ≥ T`, **THEN** the operative is Ready and the cleared Squad bay stays empty.
41. **GIVEN** living roster, pins, Experience, injuries, candidates, and campaign flags, **WHEN** strategy save and reload, **THEN** those values match the pre-save roster blob and running mission/debrief are not restored.
42. **GIVEN** each of the 8 roles, **WHEN** that role’s kit is read, **THEN** it has exactly 1 active and 1 passive. Do not assert §8 effect rows here.
43. **GIVEN** a current selection of living operatives, **WHEN** Q is pressed, **THEN** the actives of the current selection fire.
44. **GIVEN** a targeted active and no valid target, **WHEN** Q is pressed, **THEN** the comm log reports it and that active’s cooldown does not start.
45. **GIVEN** med-kit and power-cell pools sampled at mission create, **WHEN** the mission runs, **THEN** uses spend those sampled pools.
46. **GIVEN** base and role-granted mission pools, **WHEN** `operative_mass` is computed, **THEN** those pools add 0 kg.
47. **GIVEN** explicit Item slots with m med kits and c power cells and `m + c ≤ 2`, **WHEN** `operative_mass` is computed, **THEN** slot mass = `8m + 6c` kg.
48. **GIVEN** `m + c = 2`, **WHEN** slots are filled, **THEN** the fill is legal.
49. **GIVEN** empty or invalid med-kit or power-cell use, **WHEN** use is requested, **THEN** the comm log reports it and both pools are unchanged.
50. **GIVEN** a sampled power-cell pool of P, **WHEN** a grenade is armed, **THEN** that same pool becomes P − 1.
51. **GIVEN** `squad_mass = 400` kg, a selected contract, and ≥1 assigned Ready, **WHEN** Deploy is requested, **THEN** Deploy is allowed and `mass_tier_delta = −0.15` m/s.
52. **GIVEN** `squad_mass = 400.1` kg, **WHEN** Deploy is requested, **THEN** Deploy is refused and the button names the overage (0.1 kg).
53. **GIVEN** `squad_mass = 340` kg, **WHEN** mass tier is sampled at deploy, **THEN** `mass_tier_delta = +0.15` m/s for the whole squad and Deploy is allowed (other gates passing).
54. **GIVEN** `squad_mass = 340.1` kg, **WHEN** mass tier is sampled, **THEN** delta is 0 m/s and Deploy is allowed (other gates passing).
55. **GIVEN** `squad_mass = 380` kg, **WHEN** mass tier is sampled, **THEN** delta is 0 m/s (not heavy) and Deploy is allowed (other gates passing).
56. **GIVEN** `squad_mass = 380.1` kg, **WHEN** mass tier is sampled, **THEN** delta is −0.15 m/s and Deploy is allowed (other gates passing).
57. **GIVEN** living `f = 0.175`, **WHEN** `injuryRecoverySec` is computed, **THEN** `D = 108000` s.
58. **GIVEN** the helper is evaluated at `f = 0`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 172800 s; the injury rule still does not invoke it because `f = 0` is KIA.
59. **GIVEN** the helper is evaluated at `f = 0.35`, **WHEN** `injuryRecoverySec` is computed, **THEN** it returns 43200 s; the injury rule does not invoke it and applies no new injury.
60. **GIVEN** Injured with original `D = 108000` s, **WHEN** the debrief injury line is read (including after a win ETA catch-up), **THEN** it reports 30 hours, not remaining downtime.
61. **GIVEN** Mara with deployment max HP 124, primary 4.2 kg, sidearm 1.2 kg, no research/Experience/filled Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 73.9 kg.
62. **GIVEN** Ghost / Dart / Torq under the same no-research/Experience/slots conditions, **WHEN** each `operative_mass` is computed, **THEN** Ghost is 69.3 kg, Dart is 66.3 kg, Torq is 76.6 kg.
63. **GIVEN** `H ≤ 90` and pistol + pistol (1.2 + 1.2 kg) with empty Item slots, **WHEN** `operative_mass` is computed, **THEN** it is 62.4 kg (plating term 0).
64. **GIVEN** Mara as in AC 61 with 1 med-kit slot and 1 power-cell slot, **WHEN** `operative_mass` is computed, **THEN** it is 87.9 kg.
65. **GIVEN** an unassigned operative, **WHEN** squad mass terms are computed, **THEN** that body adds 0 kg and 0 mission Item-slot pools.
66. **GIVEN** assigned Mara, Ghost, Dart, Torq with no research/Experience/filled Item slots, **WHEN** `squad_mass` is computed, **THEN** it is 286.1 kg.
67. **GIVEN** those 4 assigned plus unassigned living roster members, **WHEN** `squad_mass` is computed, **THEN** unassigned add 0 kg (still 286.1 kg).
68. **GIVEN** `squad_mass = 286.1` kg, **WHEN** `mass_gate_ok` is computed, **THEN** it is true.
69. **GIVEN** `squad_mass ≤ 400` kg, **WHEN** `mass_gate_ok` is computed, **THEN** it is true; **GIVEN** `squad_mass > 400` kg, **THEN** it is false.
70. **GIVEN** `squad_mass = 286.1` kg, **WHEN** `mass_tier_delta` is sampled at deploy, **THEN** it is +0.15 m/s applied once to the whole squad.
71. **GIVEN** any `squad_mass`, **WHEN** `mass_tier_delta` is sampled, **THEN** the value is exactly one of {+0.15, 0, −0.15} m/s using: ≤ 340 → +0.15; 340 < x ≤ 380 → 0; > 380 → −0.15.
72. **GIVEN** injury stamped at `t0` with D, and a win catch-up at `t1`, **WHEN** remaining downtime is computed, **THEN** it equals `max(0, t0 + D − t1)`.
73. **GIVEN** `t0 = 0`, `D = 108000`, and a win with `t1 = 172800`, **WHEN** remaining downtime is computed, **THEN** it is 0, the operative is Ready, the Squad bay stays empty, and the injury line still reports 30 hours.
74. **GIVEN** a quiet-replay win with `deadIds`, living `f` in (0, 0.35), and survivors, **WHEN** debrief applies, **THEN** KIA, injury (bay clear + D), Experience +1 per survivor, and ETA `t1` catch-up all still apply.
75. **GIVEN** Assembly editing, **WHEN** assign would exceed 4, assign the same operative twice, assign Injured, or assign KIA, **THEN** that assign is refused.
76. **GIVEN** one operative id listed as both dead and injured on an outcome, **WHEN** debrief applies, **THEN** that id is KIA only.
77. **GIVEN** the director never hires, **WHEN** the campaign is played, **THEN** play remains legal; an empty incomplete living roster still fails per AC 38.
78. **GIVEN** an injury `recoverAtT` and a candidate due sharing the same strategic timestamp, **WHEN** `sync(t)` reaches that instant, **THEN** each due applies independently.

Not ACed here: Open Questions; HP/speed per Experience point; product performance budgets; §8 role effect/duration/range/CD rows (Tactical fixtures); Feed copy (World Network).

## Open Questions

Do not lock these from code. Alias §8 until a later stub decision.

| # | Question | Owner | Target |
|---|---|---|---|
| 1 | Hire-on-failed-campaign: is hire legal when the incomplete campaign has already failed-empty-roster? | Roster + World Network | After Persistence extract; do not import `acceptHire` no-op from code |
| 2 | Post-hire market backfill: does a hire immediately restore a third candidate, or wait for the next 24 h due? | Roster | After this GDD; do not invent |
| 3 | Item-slot persistence across Assembly visits (and across missions) | Roster + Interface | `/ux-design assembly`; freeze at deploy is already locked |
| 4 | Hire quality curve inside 16,000–34,000 CR (`hireCost` / 500 CR grid) | Roster + Economy | Do not extract `recruits.ts` unless living spec authors it |
| 5 | Win ETA spanning more than one 24 h candidate interval: one offer vs one-per-interval, still cap 3 | Roster + World Network (clock) | Same catch-up protocol as ADR-0001; do not invent a bulk table here |
| 6 | Experience HP/speed per point are not authored in §8 (`XP_HP_PER` / `XP_SPEED_PER` live in code) | Roster | Leave unauthored here; do not fork code constants |

Research GDD is Overview-only. The Research deploy slice = unslotted set (resolved wear on the Roster slice) is provisional until that GDD is filled. World Network Interactions still list `deadIds` / `survivorHp`; this GDD emits **kia names** only — reconcile on `/consistency-check`.
