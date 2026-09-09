# Persistence and validation

> **Status**: Designed (pending independent `/design-review`)
> **Author**: extract from docs/game-design.md §17, §20
> **Last Updated**: 2026-09-08
> **Implements Pillar**: Violence has corporate consequences; The two layers feed each other; One corporate operating system
> **Living spec**: `docs/game-design.md` §17, §4 session/end, §20 campaign sentence — this file aliases them; do not fork rules
> **Specialists (full)**: creative-director (fantasy); systems-designer (rules/formulas/edges); gameplay-programmer (feasibility FEASIBLE); qa-lead (acceptance)
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

Persistence and validation is the house’s memory and the commitment cut: a **versioned local campaign blob** holds the World Network, laboratories, roster, tutorial progress, and campaign result; a **mission in progress is memory only** ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). **Settings** and **telemetry** live in their own slots so **New Operation** does not reset the player’s preferences. The four Screens autosave without a ceremony. Mission and Debrief do not. Debrief is the only boundary that applies payout, sector movement, intel, influence, and roster, and it applies them **once**; Persistence **commits** that result — it does not price Credits, shove Control, or tick labs. Menu: **Continue** when a valid campaign blob exists; **New Operation** is a two-step erase of the house. Without this system the director could checkpoint the street, the invoice could print twice, and a reload would not return the same desk.

Rules stay in `docs/game-design.md` §17. This overview does not fork them.

## Player Fantasy

You Continue the desk. You do not checkpoint the street. The campaign save is versioned and local: World Network, laboratories, roster, tutorial progress, campaign result. Four Screens autosave without a ceremony. A mission in progress is MEMORY ONLY; Abort discards it — no debrief, no invoice. Debrief is the only boundary that applies payout, sector movement, intel, influence, roster — once. Menu: Continue when a save exists; New Operation is a two-step erase of the house. Settings and telemetry live in their own slots; Difficulty survives. Telemetry is opt-in, local, off by default, never leaves the machine. Balance is a dashboard; export is local JSON; Clear is two-step. Schema and autosave are the OS; the player should not notice a save verb.

This serves **Violence has corporate consequences**, **The two layers feed each other**, and **One corporate operating system**. Secondary: **Command, do not micromanage** (no save-slot micromanagement). It does not own invoice line items (Economy), sector math (World Network), or the five verbs (Tactical). The fantasy fails if the mission can be resumed, if Abort writes campaign state, if New Operation wipes Settings, telemetry toggle, or Difficulty, if debrief applies twice, if mission or debrief autosave, or if telemetry leaves the machine.

## Detailed Design

### Core Rules

1. **Alias.** Session writes, slots, hydrate, determinism, and telemetry live in `docs/game-design.md` §17 and §4. This section names owners, states, and DTO edges. Do not copy Combat, Interface chrome, playtest tasks, or performance budgets. Do not promote save-version integers, autosave delay, or storage key names into rules.

2. **Platform.** Desktop web. Keyboard and mouse. Minimum 1280×720. No mobile or touch. Single-player. No networking. Out of scope: cloud saves, accounts, leaderboards, mid-mission save and resume (`docs/game-design.md` §18). Mid-mission persistence is the cut, not a stack limit ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)).

3. **Schema sink, not a second sim.** Persistence commits the campaign blob. It does not price Credits, apply Control / Unrest / ownership / Influence / Intel, or tick laboratories. Owners stay Economy, World Network, Research, Roster.

4. **Three slots.**
   - **Campaign blob** — versioned, local. World Network, laboratories, roster, tutorial progress, campaign result.
   - **Settings slot** — audio, remaps, accessibility, quality, difficulty, telemetry toggle.
   - **Telemetry slot** — records.
   Settings and telemetry are not fields of the campaign blob. New Operation does not reset preferences. Whether the telemetry **log** survives New Operation is Open Question 1.

5. **Campaign blob (by design content; owners unchanged).**
   - Economy: Credits; generated contract records; authored `contractsWon`.
   - World Network: Strategic time `t`, Clock speed, Pause, sectors, holders, Feed / events, unread, next Event due, World Event RNG, generated-market RNG, next generated-contract due, Influence wallet, Tax-due cursor, Influence spends and cooldowns, crisis, unrest pressure.
   - Research: laboratories (`done` + lab runs). Pins are Roster, not this slice.
   - Roster (already frozen): living roster, pins, Experience, injuries, candidates, candidate-market RNG, next candidate due, campaign complete / fail flags.
   - Screen strategy state: squad assignment (Four Screens autosave).
   - Tutorial progress (seen steps / one-shot advisories).
   - Campaign result (complete / failed; cannot be both).
   **Item slots / loadout across Assembly visits:** Roster Open Question 3 — do **not** freeze here.

6. **Not in the campaign blob.** Running mission. Debrief outcome / apply serials. Settings. Telemetry log. Review-time scrub. Selected contract after Debrief returns to the World Network. `missionStore` HUD/pause.

7. **Continue / New Operation.** Menu offers **Continue** when a valid campaign blob exists. **Continue** opens the World Network for that campaign; it does not resume a mission. **New Operation** is a two-step erase of the campaign blob and starts another Campaign. Settings survive. A mission in progress does not.

8. **Invalid blob.** Unreadable or invalid campaign blob is no campaign. Continue unavailable. Do not half-load. Drop the whole blob. Settings garbage must not leak this policy (settings may fall back to defaults; campaign restore is all-or-nothing).

9. **Four Screens autosave.** World Network, Research, Brief, Assembly autosave the campaign blob. Mission and Debrief do **not**. Abort discards the mission. No mid-mission resume ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)).

10. **In-memory apply vs durable commit.** Debrief applies payout, sector, intel, influence, and roster **once in session memory**. Debrief is not a Screen autosave. The first **durable** campaign write of that result is the next Screen autosave (return to the World Network). Reload while still on Debrief restores the last Screen snapshot (pre-mission). A second apply of the same outcome does not run.

11. **Hydrate.** Restore World Network / Economy / laboratories / roster / tutorial. Session phase is **menu**. Mission id and debrief outcome are not restored. After hydrate, Research and Roster `sync(t)` to the **saved** Strategic time — the same `t`, not wall-clock. Reload does not grant offline hours. Advancement remains Screen ticking and a **win** ETA only ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Storage throw on write must not throw through Debrief or New Operation.

12. **Debrief apply-once (owners).** Debrief is the only campaign write-back of payout, sector, intel, influence, and roster. Interface presents; Economy prices Credits; World Network applies sector / unrest / ownership / Influence / Intel; Roster applies KIA / injury / Experience / flags; Persistence **commits once** (durable on the next Screen). Abort = no debrief = **no campaign write**. Telemetry may still append a thin abort record if enabled.

13. **Selected contract.** Returning from Debrief to the World Network clears the selected contract; that clear is what persists. Replay is the only path back into that Brief.

14. **Campaign end (persist, do not re-own).** Winning all three authored contracts marks the Campaign complete (replayable, not a lock). Empty roster fails an **incomplete** Campaign. A completed Campaign stays complete after a roster wipe. Cannot be both. Persistence stores the flags. World Network posts banners. Roster detects empty roster.

15. **Determinism.** Missions and districts are deterministic from the mission seed (weather script, Opening hour). Portraits and figures use stable hashes. World Event stream and candidate market use **serialized random state** so a reload continues the same sequence. Presentation-only rain particles, gunshot playback-rate variation, and mission-bed selection **may** be unseeded; they do not change outcomes; Persistence does not store them. Mission seed is Tactical; Persistence does not serialize a running mission.

16. **Quality.** Auto / High / Medium / Low is a **player setting** in the settings slot, not a design lever. Building ghosting by tier is Interface / rendering — not owned here.

17. **Telemetry.** Opt-in, local, **off by default**, never leaves the machine. When enabled, each debrief appends **one** record (**cap 60**) covering outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles. Abort writes a thin record: `aborted`, duration, mission id, seed, deployed roles. Balance dashboard aggregates. Export is a local JSON download. Clear is a two-step confirm. Further playstyle signals are backlog (`docs/game-design.md` §19.7), not open design.

18. **Forbidden.** Mid-mission save / resume; cloud / account / leaderboard; half-load; second apply of one debrief; campaign write on Abort; hydrating into mission or debrief; Quality as a design lever; offline hours on reload; storage keys / save-version integers / autosave delay as GDD rules; pricing Credits / applying Control–Unrest / ticking labs here; resolving Item-slot persistence or hire-on-failed-campaign; copying §12 chrome or §20 playtest / UX / performance; inventing FIFO eviction or an `abort_rate` denominator; forking `injuryRecoverySec`, `mass_gate`, hire 16,000–34,000 CR, or `roster_cap` 8.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Campaign blob | absent / valid / invalid | Valid exists → Continue offered. Invalid or unreadable → treat as absent; Continue unavailable; do not half-load. New Operation (two-step) → erase blob, start another Campaign. Four Screens → autosave. Mission / Debrief → no campaign write |
| Settings slot | present (independent) | Survives New Operation and campaign erase. Not in the campaign blob |
| Telemetry toggle | off (default) / on | Settings slot. Opt-in. Off → no records appended |
| Telemetry log | empty / records (cap 60) | Enabled debrief → append one full record. Enabled Abort → append thin record. Clear (two-step) → empty. New Operation vs log: Open Question 1. Eviction at cap: Open Question 3 |
| Session phase on hydrate | menu | Restore strategy / roster / research / tutorial. Mission and debrief outcome **not** restored. Continue → World Network, never the field |
| Mission coupling | Strategy / Deployed / Debrief apply-once (memory) / Abort discarded | Screens autosave. Field is memory only. Debrief: owners apply once in memory; durable commit on next Screen. Abort: no campaign write; thin telemetry only if enabled |
| Selected contract | none / selected / cleared-after-debrief | Screens may hold a selection (autosave). Debrief → World Network clears it. Replay is the only path back into that Brief |
| Timeline | Live / Review | Review scrub does not mutate live state and is **not** in the campaign blob |
| Campaign result | live / complete / failed-empty-roster | Complete = all three authored won. Failed = living roster empty **and** not already complete. Cannot be both. Flags persist |
| RNG streams | serialized in campaign blob | Hydrate continues World Event stream and candidate market. Mission seed is not a resume checkpoint (mission not saved) |

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | WN blob to commit (incl. `t`, Pause, Clock speed, sectors, Influence, Intel access resource, Event RNG, Tax-due cursor, spends) | Hydrated WN blob; `sync(t)` after hydrate at saved `t` | WN owns clocks, board, Influence, Intel, Event stream. Persistence stores. Persistence does not apply Control / Unrest |
| **Economy** | Credits; generated records; `contractsWon`; priced `net_payout` already applied by Economy | Hydrated Credits and market records | Economy prices and owns the ledger. Persistence commits once. Persistence does not price |
| **Research** | Laboratories (`done` + lab runs) | Hydrated laboratories; `sync(t)` to saved `t` | Research owns program and `sync(t)`. Pins on roster blob. Persistence does not tick labs |
| **Roster / Assembly** | Frozen roster blob; squad assignment as Screen state | Hydrated roster; `sync(t)` to saved `t` | Roster owns bodies / pins / injuries / candidates / flags. Item-slot persistence remains Roster OQ 3 |
| **Tactical** | — | Nothing live. Mission is memory only | Neither live-queries the other. Abort = no campaign write |
| **Interface** | Continue / New Operation (two-step) / Settings / telemetry export and clear (two-step) / Replay vs World Network return | Slot contents for presentation; Continue enabled iff valid campaign blob | Presentation only. Abort confirm chrome is Interface; discard rule is this system + ADR-0002 |

**Apply-once (debrief):** one outcome DTO. Abort is **absence of an outcome**, not a campaign field. Telemetry abort record is **not** a campaign write.

## Formulas

Do not fork. Canonical telemetry sentence: `docs/game-design.md` §17. Persistence owns **win_rate** only among ratios. `abort_rate` is named, not defined.

The `win_rate` formula is defined as:

`win_rate = won / (won + lost)`

Abort is **excluded** from the denominator.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| wins | won | int | ≥ 0 | Debrief records whose outcome is Win |
| losses | lost | int | ≥ 0 | Debrief records whose outcome is Loss |
| win rate | win_rate | float | (0, 1] when denominator > 0 | Balance dashboard ratio |

**Output Range:** Defined only when `won + lost > 0`. Living spec is silent at zero decided missions — do not invent hide / 0 / undefined (Open Question 2). Abort records do not enter `won` or `lost`.
**Example:** `won = 3`, `lost = 1`, two abort records → `win_rate = 3 / 4`. Abort count 2 sits beside it; `abort_rate` is not computed here.

**Named, not specified:** `abort_rate` — living spec: abort count and abort rate sit beside win rate. No expression, no denominator. Alias the name. Do not invent (Open Question 4).

**Constant, not a curve:** telemetry record cap **60** (`docs/game-design.md` §17). Eviction at the cap is **not** authored. Do not import FIFO from code (Open Question 3).

**Not owned here:** `tax_yield` (World Network); `collateral` / `net_payout` (Economy); `endT` / `appliedNodeIds` / `currentIssue` (Research); `injuryRecoverySec` / `remaining_downtime` / `operative_mass` / `squad_mass` / `mass_gate` / `mass_tier` (Roster); hire 16,000–34,000 CR and `roster_cap` 8 (Roster / registry); Control / Unrest / Intel awards / ETA (World Network); authored chance / Risk index (Tactical / Brief).

## Edge Cases

- **If no valid campaign blob exists:** Continue is unavailable. Menu still offers New Operation and Settings.
- **If the campaign blob is unreadable or invalid:** treat as no campaign. Continue unavailable. Do not half-load strategy, roster, or laboratories. Drop the whole blob.
- **If New Operation is confirmed (two-step):** campaign blob erased; another Campaign starts. Settings survive. Mission in progress does not. Telemetry **toggle** is a preference (survives). Telemetry **log**: Open Question 1.
- **If New Operation is cancelled:** campaign blob unchanged.
- **If the director is on a Screen (World Network, Research, Brief, Assembly):** campaign blob autosaves. Strategic time may run (World Network owns the clock).
- **If the director is in a mission:** campaign blob does not write. Mission is memory only. No mid-mission resume.
- **If the director is on Debrief:** campaign blob does not autosave. Owners have applied once in session memory. Reload on Debrief restores the last Screen snapshot (pre-mission). A second apply of the same outcome does not run.
- **If Debrief returns to the World Network:** selected contract is cleared; that clear persists; the applied result is now eligible for Screen autosave.
- **If Abort is confirmed:** no debrief; no campaign write; roster / Credits / sector / intel / influence / laboratories unchanged. If telemetry is on: append the thin abort record. If telemetry is off: no record.
- **If hydrate runs:** strategy / roster / research / tutorial restore; phase is menu; mission id and outcome are not restored; Research and Roster `sync(t)` to saved Strategic time (no offline hours).
- **If Timeline is in Review at save time:** Review scrub is not live state and is not restored as live.
- **If World Event stream and candidate market were mid-sequence:** serialized RNG restores; the next Event / candidate is the same as if the session had not reloaded.
- **If portraits / figures are shown after reload:** stable hashes; they do not re-roll.
- **If rain particles, gunshot playback-rate, or mission-bed differ after reload:** allowed; they do not change outcomes.
- **If all three authored contracts have been won:** campaign complete persists; contracts stay replayable; not a lock.
- **If living roster reaches 0 and the Campaign is incomplete:** failed persists; World Network banner and contract lock (Roster + WN). Persistence stores the flag.
- **If living roster reaches 0 after the Campaign is complete:** complete stays complete; not also failed.
- **If telemetry is off:** no debrief record and no abort record. Toggle remains off across New Operation (settings slot).
- **If telemetry is on and a debrief completes:** append one full record. Cap 60. Behavior at 61 is Open Question 3.
- **If telemetry Clear is confirmed (two-step):** log empty. Campaign blob unchanged.
- **If telemetry Export is used:** local JSON download. Records never leave the machine by design (no network channel).
- **If Quality is changed:** settings slot only. Not a design lever. Not a campaign blob field.
- **If Difficulty is changed:** settings slot; survives New Operation.
- **If Persistence would price Credits, apply Control / Unrest, or tick labs:** forbidden. Owners already did that, or will on `sync(t)`.
- **If write storage throws:** do not throw through Debrief or New Operation. In-memory reset of New Operation still proceeds.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | WN blob in; hydrate out | `t`, Pause, Clock speed, sectors, Influence, Intel, Event RNG. Persistence does not apply Control / Unrest |
| Hard, upstream | Economy and contracts | Credits, generated records, `contractsWon` | Economy prices. Persistence commits. Mission/debrief excluded |
| Hard, upstream | Research | Laboratories blob | `done` + lab runs. Pins on roster blob. `sync(t)` at saved `t` |
| Hard, upstream | Roster and Assembly | Roster blob; squad assignment | Living roster, pins, Experience, injuries, candidates, campaign flags. Item slots not frozen here |
| Hard, downstream | Tactical mission | Unsaved lifetime | Mission is memory only. Abort = no campaign write |
| Soft, downstream | Interface | Presentation | Continue, New Operation two-step, Settings, Balance, Export, Clear two-step |
| — | Audio | None | Mixer values live in the settings slot; mix correctness is Audio |

World Network, Economy, Research, and Roster already list Persistence as hard downstream (strategy autosave; mission/debrief excluded). Bidirectional on those four. Tactical and Interface template GDDs are not extracted yet; edges vs living spec.

**Not dependencies:** `tax_yield` math (World Network); `net_payout` (Economy); mass gate (Roster); five verbs (Tactical).

## Tuning Knobs

All knobs are owned by `docs/game-design.md` §17 (and §4 session rules). This GDD does not add ranges. Changing a knob requires checking the living spec, not this pointer. Do not add save-version integers, storage keys, or autosave delay.

| Knob | Owner | Too high / too low |
|---|---|---|
| Telemetry record cap 60 | §17 | Unbounded log vs dashboard that never retains a session |
| Telemetry default off | §17 | On-by-default is not opt-in |
| New Operation two-step | §4 | One-step erase is accidental wipe |
| Telemetry Clear two-step | §17 | One-step clear is accidental wipe |
| Quality Auto/High/Medium/Low | §17 as a **setting** | Using Quality as a design lever (hiding ghosting) is Interface / pillar 2 — not this table |
| Difficulty in settings slot | §16 / CONTEXT.md | Survives New Operation; hiding minimap is not a persist knob |

Opening Credits, hire costs, mass gate, and lab hours are not Persistence knobs.

## Visual/Audio Requirements

Presentation wrap is Interface / Audio. Persistence requires Menu Continue / New Operation and Balance to read as another room of the same terminal: near-black, teal, amber, red; thin technical borders; monospace uppercase. New Operation and telemetry Clear are paperwork confirms, not a game-over splash. Autosave has no ceremony and no save-slot UI. Palette and chrome: pillar 5 / `docs/game-design.md` §12–15. Audio follows screen ownership. No second visual language for “the save screen.”

## UI Requirements

Menu: Continue iff a valid campaign blob exists; New Operation behind a two-step erase. Settings: audio, remaps, accessibility, quality, difficulty, telemetry toggle — independent of the campaign blob. Balance: opt-in dashboard; win rate from `win_rate`; abort count beside it; Export local JSON; Clear two-step. Screens and HUD belong to Interface. This GDD only requires that Continue is absent when there is no campaign, that New Operation cannot fire in one click, and that Balance does not exist unless telemetry is a player choice (pillar 2: undecorated numbers; pillar 5: one OS).

## Acceptance Criteria

- **GIVEN** a clean origin with no campaign blob, **WHEN** the Menu loads, **THEN** Continue is absent and New Operation is the start action.
- **GIVEN** a campaign that reached a Screen so a valid local save exists, **WHEN** the origin is reloaded to the Menu, **THEN** Continue is present and opens the World Network for that campaign (not a new one, not a mission).
- **GIVEN** Menu with Continue and recorded Credits / Intel / roster, **WHEN** the director activates New Operation once, **THEN** the control arms a confirm, the campaign blob is unchanged, and Continue still loads the same Credits / Intel / roster.
- **GIVEN** New Operation armed, **WHEN** the director confirms, **THEN** the campaign is a new Operation (opening Credits, Intel, empty `contractsWon`, labs unset, tutorial unseen) and the prior campaign cannot be restored.
- **GIVEN** Settings changed from defaults (Difficulty, Quality, telemetry toggle, audio, at least one remap), **WHEN** New Operation is confirmed, **THEN** those setting groups still match the pre-erase values.
- **GIVEN** those setting values, **WHEN** the origin is fully reloaded, **THEN** Settings still show them with no Continue required.
- **GIVEN** a lived-in campaign on a Screen, **WHEN** reload then Continue, **THEN** World Network, laboratories, roster, tutorial-seen, and campaign result match the last Screen visit (not the opening Operation).
- **GIVEN** a Screen snapshot S, then a mission in progress, **WHEN** the origin is reloaded before Debrief, **THEN** Continue returns strategic / roster state from S; the mission is not resumed; Brief is locked; there is no Debrief outcome.
- **GIVEN** snapshot S on a Screen, then a finished mission whose Debrief has applied in this session, **WHEN** the origin is reloaded while still on Debrief, **THEN** Continue restores S, not the invoice mutations.
- **GIVEN** that invoice applied and the director has returned to the World Network, **WHEN** reload then Continue, **THEN** the applied campaign result is present exactly once (not pre-mission, not doubled).
- **GIVEN** a Debrief that has already applied payout, sector, Intel, Influence, and roster, **WHEN** Debrief stays open or the invoice re-renders, **THEN** those campaign values do not change again, and telemetry (if on) still has exactly one record for that outcome.
- **GIVEN** snapshot S, telemetry off, a mission in progress, **WHEN** the director Aborts from pause and later reloads + Continue, **THEN** Credits, Influence, Intel, roster, sectors, labs, `contractsWon`, and campaign banners equal S; no Debrief ran; the aborted mission is not restored.
- **GIVEN** the campaign storage entry is replaced with non-JSON or otherwise invalid data, **WHEN** the origin is reloaded, **THEN** Menu has no Continue and no partial World Network / roster / labs load occurs.
- **GIVEN** recorded post-Screen Credits, Influence, Intel, strategic clock, Clock speed, Pause, sector Control / Unrest / ownership, open generated contracts, research done + active labs, roster, candidates, squad assignment, **WHEN** reload + Continue, **THEN** each recorded value matches; Focus / Review-time / selected contract / mission / Debrief are not restored.
- **GIVEN** an authored contract already won, **WHEN** reload + Continue, then that contract is won again, **THEN** the win flag is still present (`REPLAY // FEE ALREADY COLLECTED` or equivalent). Award amounts are Economy / World Network.
- **GIVEN** campaign not complete, roster emptied by KIA, World Network shows campaign failed and contracts locked, **WHEN** reload + Continue, **THEN** still failed (not complete), roster empty, contracts still locked.
- **GIVEN** campaign complete, then roster emptied, **WHEN** reload + Continue, **THEN** still complete, not also failed; authored contracts remain selectable for replay.
- **GIVEN** a campaign whose Feed already differs from a fresh Operation, **WHEN** reload + Continue and the same strategic wait elapses at the same Clock speed, **THEN** the next rolled Event matches the recorded continuation, not a New Operation opening sequence.
- **GIVEN** recorded candidate identities / costs at a known strategic time, **WHEN** reload + Continue, **THEN** the market matches that list; the next refresh continues that market, not the opening pool.
- **GIVEN** a new origin (no settings blob), **WHEN** Settings and Balance are opened after a finished mission with no telemetry change, **THEN** telemetry is off and Balance has no mission records.
- **GIVEN** telemetry on, N records, a mission that reaches Debrief, **WHEN** the invoice applies, **THEN** Balance count is N+1 (not N+2), and the new row’s outcome is won or lost (not aborted).
- **GIVEN** telemetry on and 60 records, **WHEN** another Debrief or Abort is logged, **THEN** Balance still shows 60 records (does not become 61).
- **GIVEN** telemetry on, snapshot S, **WHEN** Abort from pause, **THEN** campaign still equals S; abort count increases by 1; that row is `aborted` plus duration, mission id, seed, deployed roles — not a full combat invoice.
- **GIVEN** telemetry records: 2 won, 1 lost, 3 aborted, **WHEN** Balance is opened, **THEN** win rate is 2 / (2 + 1); abort count is 3; aborts are not in the win-rate denominator.
- **GIVEN** at least one telemetry record, **WHEN** Export JSON is used, **THEN** a local JSON file downloads and the action does not upload to an app origin.
- **GIVEN** records present, **WHEN** Clear is activated once, **THEN** records remain and the control arms a confirm. **WHEN** confirmed, **THEN** Balance is empty and the campaign blob is untouched.
- **GIVEN** telemetry on and a non-abort Debrief, **WHEN** JSON is exported, **THEN** that record includes outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles.

Do not treat quiet-replay payouts, mass gate, clipping, playtest thresholds, or performance budgets as Persistence criteria. Do not pass/fail telemetry-log survival across New Operation until Open Question 1 is closed. Do not pass/fail which row leaves at cap 60 until Open Question 3 is closed. “Never leaves the machine” is proxied by no network request on Debrief, Abort, Balance, Export, or Clear.

## Open Questions

1. **Telemetry log vs New Operation.** Toggle is a preference and survives. §17 gives telemetry its own slot “so New Operation does not reset the player’s preferences.” CONTEXT.md New Operation names Settings only. Do **not** decide whether the log survives campaign erase. Owner: Persistence extract; resolve with Interface / Balance if a player-facing rule is needed.
2. **`win_rate` when `won + lost = 0`.** Living spec silent. Do not invent hide / 0 / undefined. Owner: Interface / Balance.
3. **Cap 60 eviction.** Living spec: capped at 60. FIFO is code. Do not author eviction. Owner: Persistence; leave unnamed until the living spec does.
4. **`abort_rate` formula.** Named beside win rate. No denominator. Do not invent. Owner: Interface / Balance.
5. **Item-slot persistence across Assembly visits** — Roster Open Question 3. Do not resolve.
6. **Hire-on-failed-campaign** — Roster + World Network Open Question 1. Do not resolve.
7. **Reload on Debrief vs telemetry row.** Apply-once is not durable until a Screen autosaves; an opt-in telemetry row may exist for an outcome the campaign rolled back. Unspecified. Do not pass/fail either way. Owner: Persistence + Interface.

---

📌 **UX Flag — Persistence and validation**: This system has UI requirements (Menu Continue / New Operation, Settings slot, Balance export/clear). In Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for those screens **before** writing epics. Stories that reference UI should cite `design/ux/[screen].md`, not the GDD directly.
