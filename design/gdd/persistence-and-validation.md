# Persistence and validation

> **Status**: Approved
> **Author**: extract from docs/game-design.md §17, §20
> **Last Updated**: 2026-09-16 (header Status aligned to independent `/design-review` APPROVED 2026-09-15)
> **Independent `/design-review`**: 2026-09-15 APPROVED
> **Implements Pillar**: Violence has corporate consequences; The two layers feed each other; One corporate operating system
> **Living spec**: `docs/game-design.md` §17, §4 session/end, §20 campaign sentence — this file aliases them; do not fork rules
> **Specialists (full)**: creative-director (fantasy); systems-designer (rules/formulas/edges); gameplay-programmer (feasibility FEASIBLE); qa-lead (acceptance)
> **Creative Director Review (CD-GDD-ALIGN)**: APPROVED 2026-09-08

## Overview

Persistence and validation is the house’s memory and the commitment cut: a **versioned local campaign blob** holds the World Network, laboratories, roster, tutorial progress, and campaign result; a **mission in progress is memory only** ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). **Settings** and **telemetry** live in their own slots so **New Operation** does not reset the player’s preferences. The four Screens autosave without a ceremony. Mission and Debrief do not. Debrief is the only boundary that applies payout, sector movement, intel, influence, and roster, and it applies them **once in session memory**; the first **durable** write is the next Screen (World Network return or Brief Replay). Persistence **commits** that result — it does not price Credits, shove Control, or tick labs. Reload while still on Debrief restores the last Screen snapshot. Menu: **Continue** when a valid campaign blob exists — it always opens the World Network, never the field and never the Screen left. **New Operation** is a two-step erase of the house. Without this system the director could checkpoint the street, the invoice could print twice, and a reload would not return the same desk.

Rules stay in `docs/game-design.md` §17. This overview does not fork them.

## Player Fantasy

You Continue the desk from the Menu. Continue always opens the World Network for that campaign. If the last Screen snapshot still held a selected contract, that selection restores so Brief can unlock — it does not resume Brief or Assembly. You do not checkpoint the street. The campaign save is versioned and local: World Network, laboratories, roster, tutorial progress, campaign result. Four Screens autosave without a ceremony. A mission in progress is MEMORY ONLY; Abort discards it — no debrief, no invoice. Debrief applies payout, sector, intel, influence, roster **once in this session**; that result is not durable until the next Screen autosave (World Network return or Brief Replay). Reload while still on Debrief restores the last Screen snapshot — the invoice you read did not file. There is no save verb and no Debrief autosave. Menu: Continue when a save exists; New Operation is a two-step erase of the house. Settings and telemetry live in their own slots; Difficulty survives. Telemetry is opt-in, local, off by default, never leaves the machine. Balance is a dashboard of the machine log (it can mix Operations and keep a row the desk unfiled); export is local JSON; Clear is two-step.

This serves **Violence has corporate consequences**, **The two layers feed each other**, and **One corporate operating system**. It does not own invoice line items (Economy), sector math (World Network), or the five verbs (Tactical). The fantasy fails if the mission can be resumed, if Continue opens Brief or Assembly instead of the World Network, if Abort writes campaign state, if New Operation wipes Settings, telemetry toggle, or Difficulty, if debrief applies twice, if mission or debrief autosave, if Continue drops a Screen-held selected contract, if Replay-to-Brief does not durable-commit the applied invoice, if reload-on-Debrief is presented as if the invoice filed, if a swallowed storage write is presented as erase or file, or if telemetry leaves the machine.

## Detailed Design

### Core Rules

1. **Alias.** Session writes, slots, hydrate, determinism, and telemetry live in `docs/game-design.md` §17 and §4. This section names owners, states, and DTO edges. Do not copy Combat, Interface chrome, playtest tasks, or performance budgets. Do not promote save-version integers, autosave delay, or storage key names into rules.

2. **Platform.** Desktop web. Keyboard and mouse. Minimum 1280×720. No mobile or touch. Single-player. No networking. Out of scope: cloud saves, accounts, leaderboards, mid-mission save and resume (`docs/game-design.md` §18). Mid-mission persistence is the cut, not a stack limit ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)).

3. **Schema sink, not a second sim.** Persistence commits the campaign blob. It does not price Credits, apply Control / Unrest / ownership / Influence / Intel, or tick laboratories. Owners stay Economy, World Network, Research, Roster.

4. **Three slots.**
   - **Campaign blob** — versioned, local. World Network, laboratories, roster, tutorial progress, campaign result.
   - **Settings slot** — audio, remaps, accessibility, quality, difficulty, telemetry toggle.
   - **Telemetry slot** — records.
   Settings and telemetry are not fields of the campaign blob. New Operation does not reset preferences. The telemetry **log** survives New Operation. Two-step Clear empties the log ([ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md)).

5. **Campaign blob (by design content; owners unchanged).**
   - Economy: Credits; generated contract records; authored `contractsWon`.
   - World Network: Strategic time `t`, Clock speed, Pause, sectors, holders, Feed / events, unread, next Event due, World Event RNG, generated-market RNG, next generated-contract due, Influence wallet, Intel access (level + progress), Tax-due cursor, Influence spends and cooldowns, crisis, unrest pressure.
   - Research: laboratories (`done` + lab runs). Pins are Roster, not this slice.
   - Roster (already frozen): living roster, pins, Experience, injuries, candidates, candidate-market RNG, next candidate due.
   - Screen strategy state: squad assignment; selected contract while a Screen still holds it (Four Screens autosave).
   - Tutorial progress (seen steps / one-shot advisories).
   - Campaign result: complete / failed flags (cannot be both). Persistence stores the flags; it does not re-derive them on hydrate ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)).
   **Item slots / loadout across Assembly visits:** Roster Open Question 3 — do **not** freeze here.

6. **Not in the campaign blob.** Running mission. Debrief outcome / apply serials. Settings. Telemetry log. Review-time scrub. Focus. `missionStore` HUD/pause. Selected contract is **in** the blob while a Screen holds it; after Debrief returns to the World Network the persisted value is **none** (Rule 13).

7. **Continue / New Operation.** Menu offers **Continue** when a valid campaign blob exists. **Continue** always opens the World Network for that campaign; it does not resume a mission and does not open Brief or Assembly even if a selected contract or squad assignment is in the blob. **New Operation** is a two-step erase of the campaign blob and starts another Campaign. Settings survive. A mission in progress does not.

8. **Invalid blob.** Unreadable or invalid campaign blob is no campaign. Continue unavailable. Do not half-load. Drop the whole blob. Settings garbage must not leak this policy (settings may fall back to defaults independently; campaign restore is all-or-nothing). Telemetry garbage yields an empty log; it does not drop a valid campaign ([ADR-0011](../../docs/architecture/adr-0011-campaign-persistence-envelope.md)). Both `campaignWon` and `campaignFailed` true is invalid — drop the whole campaign blob. A **non-failed** blob's `campaignWon` must match the three-authored record: `campaignWon` is true iff all three authored ids are in `contractsWon`; otherwise drop the whole blob. A **failed** blob may still list 0–2 authored wins. Do **not** drop-all empty living + incomplete + `!failed` (that re-derives fail on hydrate). Do **not** drop-all failed + three authored wins ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)).

9. **Four Screens autosave.** World Network, Research, Brief, Assembly autosave the campaign blob. Mission and Debrief do **not**. Abort discards the mission. No mid-mission resume ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). In-session Abort landing after confirm (Menu vs last Screen) is Open Question 8. Persistence owns discard only.

10. **In-memory apply vs durable commit.** Debrief applies payout, sector, intel, influence, and roster **once in session memory**. A quiet replay applies roster and ETA catch-up only (`t`, laboratories, injuries, Tax deposits — owners tick; Persistence does not). Debrief is not a Screen autosave and does not durable-write ([ADR-0002](../architecture/adr-0002-unsaved-mission.md)). The first **durable** campaign write of that result is the next Screen autosave: World Network return **or** Brief Replay (`docs/game-design.md` §4 session rules 8–9). The committed result is **whatever owners applied this Debrief**, including quiet-replay catch-up; it is not limited to the five dirty-mission names. Reload while still on Debrief restores the last Screen snapshot (pre-mission). A second apply of the same outcome does not run.

11. **Hydrate.** Restore World Network / Economy / laboratories / roster / tutorial / stored campaign complete and failed flags. Session phase is **menu**. Mission id and debrief outcome are not restored. Continue then opens the World Network (Rule 7). After hydrate, Research and Roster `sync(t)` to the **saved** Strategic time — the same `t`, not wall-clock. That `sync` is identity / idempotent: no offline hours, no second Tax / Feed / candidate / generated-contract fire, no re-complete of labs already in `done`. Do not re-derive campaign failed from living roster count 0 ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)). Advancement remains Screen ticking and a **win** ETA only ([ADR-0001](../architecture/adr-0001-two-clocks.md)). Storage throw on write must not throw through Debrief or New Operation. Continue / hydrate after a swallowed write restores the last successful durable campaign blob; a swallowed write is not filed.

12. **Debrief apply-once (owners).** Owners apply payout, sector, intel, influence, and roster **once in session memory**. A quiet replay: owners apply roster and ETA catch-up only. Interface presents; Economy prices Credits; World Network applies sector / unrest / ownership / Influence / Intel (and Tax deposits on catch-up); Roster applies KIA / injury / Experience / flags. Persistence does not apply those fields, does not tick labs, does not price Credits, and does not durable-write on Debrief. The durable commit is the next Screen autosave (World Network return or Brief Replay) — Rule 10 — of whatever owners applied. Abort = no debrief = **no campaign write**. Telemetry may still append a thin abort record if enabled.

13. **Selected contract.** Last Screen snapshot may hold a selection. Returning from Debrief to the World Network clears it; that **none** is what persists. Replay is the only path back into that Brief without re-selecting; Replay does **not** clear the selection, and Brief autosave is then the first durable write of the applied invoice. Hydrate from a Screen snapshot that still held a selection restores it; Brief is not locked by the reload. Focus is not in the blob.

14. **Campaign end (persist, do not re-own).** Winning all three authored contracts marks the Campaign complete (replayable, not a lock). Empty roster fails an **incomplete** Campaign. A completed Campaign stays complete after a roster wipe. Cannot be both. Persistence stores the flags and restores them on hydrate; it does not re-derive failed from living count 0 ([ADR-0020](../../docs/architecture/adr-0020-campaign-fail-flags.md)). World Network posts banners. Roster detects empty roster.

15. **Determinism.** Missions and districts are deterministic from the mission seed (weather script, Opening hour). Portraits and figures use stable hashes. World Event stream, candidate market, and generated-market use **serialized random state** so a reload continues the same sequences. Presentation-only rain particles, gunshot playback-rate variation, and mission-bed selection **may** be unseeded; they do not change outcomes; Persistence does not store them. Mission seed is Tactical; Persistence does not serialize a running mission.

16. **Quality.** Auto / High / Medium / Low is a **player setting** in the settings slot, not a design lever. Building ghosting by tier is Interface / rendering — not owned here.

17. **Telemetry.** Opt-in, local, **off by default**, never leaves the machine ([ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md)). When enabled, each debrief appends **one** record (**cap 60**, FIFO: oldest out at 61) covering outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles. Abort writes a thin record: `aborted`, duration, mission id, seed, deployed roles. The log survives New Operation. It is a session log, not a campaign transaction: reload on Debrief may keep a row the campaign rolled back. Balance dashboard aggregates. Export is a local JSON download. Clear is a two-step confirm. Further playstyle signals are backlog (`docs/game-design.md` §19.7), not open design.

18. **Forbidden.** Mid-mission save / resume; cloud / account / leaderboard; half-load; second apply of one debrief; campaign write on Abort; hydrating into mission or debrief; Quality as a design lever; offline hours on reload; storage keys / save-version integers / autosave delay as GDD rules; pricing Credits / applying Control–Unrest / ticking labs here; resolving Item-slot persistence or hire-on-failed-campaign; copying §12 chrome or §20 playtest / UX / performance; inventing an `abort_rate` denominator; inventing Abort land (Menu vs last Screen); network / beacon / analytics on the telemetry envelope; forking `injuryRecoverySec`, `mass_gate`, hire 16,000–34,000 CR, or `roster_cap` 8.

### States and Transitions

| Entity | States | Transitions |
|---|---|---|
| Campaign blob | absent / valid / invalid | Valid exists → Continue offered. Invalid or unreadable → treat as absent; Continue unavailable; do not half-load. Invalid includes both-flags-true and a non-failed blob whose `campaignWon` does not match the three-authored record. New Operation (two-step) → erase blob, start another Campaign. Four Screens → autosave. Mission / Debrief → no campaign write |
| Settings slot | present (independent) | Survives New Operation and campaign erase. Not in the campaign blob. Garbage falls back independently |
| Telemetry toggle | off (default) / on | Settings slot. Opt-in. Off → no records appended |
| Telemetry log | empty / records (cap 60, FIFO) | Enabled debrief → append one full record. Enabled Abort → append thin record. At 61 the oldest leaves. Clear (two-step) → empty. New Operation does not touch the log. Garbage → empty log, campaign blob untouched |
| Session phase on hydrate | menu | Restore strategy / roster / research / tutorial / stored flags. Mission and debrief outcome **not** restored. Continue → World Network, never the field, never the Screen left |
| Mission coupling | Strategy / Deployed / Debrief apply-once (memory) / Abort discarded | Screens autosave. Field is memory only. Debrief: owners apply once in memory (quiet replay: roster + ETA catch-up only); durable commit on next Screen (World Network or Brief Replay) of whatever owners applied. Abort: no campaign write; thin telemetry only if enabled. In-session land is Open Question 8 |
| Selected contract | none / selected / cleared-after-debrief | Screens autosave a selection. Mid-mission reload restores that Screen snapshot (selection included; Brief is not locked by the reload). Debrief → World Network clears it; that none persists. Debrief → Brief Replay does not clear; Brief autosave is the first durable write of the applied invoice |
| Timeline | Live / Review | Review scrub does not mutate live state and is **not** in the campaign blob |
| Campaign result | live / complete / failed-empty-roster | **Write-time** (Roster / World Network, not Persistence): complete = all three authored won; failed = living roster empty **and** not already complete; cannot be both. **Hydrate / validate:** restore stored `campaignWon` / `campaignFailed` only; do not re-derive failed from living count 0. Empty living + incomplete + `!failed` Continues. Failed + three authored wins Continues (Rule 8) |
| RNG streams | serialized in campaign blob | Hydrate continues World Event stream, candidate market, and generated-market. Mission seed is not a resume checkpoint (mission not saved) |

### Interactions with Other Systems

| Other system | In | Out | Interface owner |
|---|---|---|---|
| **World Network** | WN blob to commit (incl. `t`, Pause, Clock speed, sectors, Influence, Intel access resource, Event RNG, Tax-due cursor, spends) | Hydrated WN blob; `sync(t)` after hydrate at saved `t` (idempotent) | WN owns clocks, board, Influence, Intel, Event stream. Persistence stores. Persistence does not apply Control / Unrest |
| **Economy** | Credits; generated records; `contractsWon`; priced `net_payout` already applied by Economy | Hydrated Credits and market records | Economy prices and owns the ledger. Persistence durable-commits on the next Screen. Persistence does not price |
| **Research** | Laboratories (`done` + lab runs) | Hydrated laboratories; `sync(t)` to saved `t` (idempotent) | Research owns program and `sync(t)`. Pins on roster blob. Persistence does not tick labs |
| **Roster / Assembly** | Frozen roster blob; squad assignment as Screen state | Hydrated roster; `sync(t)` to saved `t` (idempotent) | Roster owns bodies / pins / injuries / candidates / flags. Item-slot persistence remains Roster OQ 3 |
| **Tactical** | — | Nothing live. Mission is memory only | Neither live-queries the other. Abort = no campaign write |
| **Interface** | Continue / New Operation (two-step) / Settings / telemetry export and clear (two-step) / Replay vs World Network return | Slot contents for presentation; Continue enabled iff valid campaign blob | Presentation only. Abort confirm chrome is Interface; discard rule is this system + ADR-0002. Filing-status, invalid-blob reason, write-fail reason, and Abort land chrome are Interface (land itself is Open Question 8) |
| **Audio** | Mute + four channel levels in the settings slot | Hydrated mixer values | Persistence stores. Audio owns mix correctness |

**Apply-once (debrief):** one outcome DTO. Abort is **absence of an outcome**, not a campaign field. Telemetry abort record is **not** a campaign write.

## Formulas

Do not fork. Canonical telemetry sentence: `docs/game-design.md` §17. Persistence owns **win_rate** only among ratios. `abort_rate` is named, not defined.

The `win_rate` formula is defined as:

`win_rate = won / (won + lost)`

Abort is **excluded** from the denominator.

**Variables:**

| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|-------------|
| wins | won | int | ≥ 0 | Debrief records in the **current telemetry log** (after FIFO) whose outcome is Win |
| losses | lost | int | ≥ 0 | Debrief records in the **current telemetry log** (after FIFO) whose outcome is Loss |
| win rate | win_rate | float | [0, 1] when denominator > 0 | Balance dashboard ratio |

**Output Range:** `[0, 1]` when `won + lost > 0`. `0` wins / `N` losses (`N ≥ 1`) is `0.0`. Living spec is silent at zero decided missions — do not invent hide / 0 / undefined (Open Question 2). An abort-only log is also denominator 0 (Open Question 2). Abort records do not enter `won` or `lost`.
**Example:** `won = 3`, `lost = 1`, two abort records → `win_rate = 3 / 4`. Abort count 2 sits beside it; `abort_rate` is not computed here. `won = 0`, `lost = 1` → `win_rate = 0.0`.

**Named, not specified:** `abort_rate` — living spec: abort count and abort rate sit beside win rate. No expression, no denominator. Alias the name. Do not invent (Open Question 4).

**Constant, not a curve:** telemetry record cap **60** (`docs/game-design.md` §17). At 61 the oldest record leaves (FIFO). [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md).

**Not owned here:** `tax_yield` (World Network); `collateral` / `net_payout` (Economy); `endT` / `appliedNodeIds` / `currentIssue` (Research); `injuryRecoverySec` / `remaining_downtime` / `operative_mass` / `squad_mass` / `mass_gate` / `mass_tier` (Roster); hire 16,000–34,000 CR and `roster_cap` 8 (Roster / registry); Control / Unrest / Intel awards / ETA (World Network); authored chance / Risk index (Tactical / Brief).

## Edge Cases

- **If no valid campaign blob exists:** Continue is unavailable. Menu still offers New Operation and Settings.
- **If the campaign blob is unreadable or invalid:** treat as no campaign. Continue unavailable. Do not half-load strategy, roster, or laboratories. Drop the whole blob.
- **If settings data is garbage:** fall back to settings defaults independently. A valid campaign still offers Continue.
- **If telemetry data is garbage:** the log is empty. A valid campaign still offers Continue.
- **If both campaign-complete and campaign-failed flags are true:** treat as invalid campaign blob; Continue unavailable; drop the whole blob.
- **If a non-failed blob's `campaignWon` does not match the three-authored record:** treat as invalid campaign blob; Continue unavailable; drop the whole blob. A failed blob with 0–2 authored wins is valid. Empty living + incomplete + `!failed` is not drop-all. Failed + three authored wins is not drop-all.
- **If New Operation is confirmed (two-step):** campaign blob erased; another Campaign starts. Settings survive. Mission in progress does not. Telemetry **toggle** is a preference (survives). Telemetry **log** survives. Clear is the erase.
- **If New Operation is cancelled:** campaign blob unchanged.
- **If the director is on a Screen (World Network, Research, Brief, Assembly):** campaign blob autosaves. Strategic time may run (World Network owns the clock).
- **If the director is in a mission:** campaign blob does not write. Mission is memory only. No mid-mission resume. Reload restores the last Screen snapshot S, including selected contract if S held one; Brief is not locked by the reload.
- **If the director is on Debrief:** campaign blob does not autosave. Owners have applied once in session memory. Reload on Debrief restores the last Screen snapshot (pre-mission). A second apply of the same outcome does not run. An opt-in telemetry row for that outcome may still exist (session log, not a campaign transaction).
- **If Debrief returns to the World Network:** selected contract is cleared; that none persists; the applied result is now eligible for Screen autosave.
- **If Debrief Replays to Brief:** selected contract remains; Brief autosave is the first durable write of the applied invoice. Reload then Continue restores the applied result (not pre-mission S) and still holds the selection.
- **If a quiet-replay win applied in this session:** owners applied roster + ETA catch-up only; the next Screen autosave durable-commits `t`, laboratories, injuries, Tax deposits, and roster. Persistence does not invent payouts.
- **If Abort is confirmed:** no debrief; no campaign write; roster / Credits / sector / intel / influence / laboratories unchanged. If telemetry is on: append the thin abort record. If telemetry is off: no record. In-session landing surface is Open Question 8.
- **If hydrate runs:** strategy / roster / research / tutorial / stored complete and failed flags restore; phase is menu; mission id and outcome are not restored; Research and Roster `sync(t)` to saved Strategic time (no offline hours, no second Tax / Feed / candidate / generated-contract / lab-complete fire). Failed is not recomputed from living count 0.
- **If Timeline is in Review at save time:** Review scrub is not live state and is not restored as live.
- **If World Event stream, candidate market, or generated-market were mid-sequence:** serialized RNG restores; the next Event / candidate / generated contract is the same as if the session had not reloaded.
- **If portraits / figures are shown after reload:** stable hashes; they do not re-roll.
- **If rain particles, gunshot playback-rate, or mission-bed differ after reload:** allowed; they do not change outcomes.
- **If all three authored contracts have been won:** campaign complete persists; contracts stay replayable; not a lock.
- **If living roster reaches 0 and the Campaign is incomplete:** failed persists; World Network banner and contract lock (Roster + WN). Persistence stores the flag.
- **If living roster reaches 0 after the Campaign is complete:** complete stays complete; not also failed.
- **If telemetry is off:** no debrief record and no abort record. Toggle remains off across New Operation (settings slot).
- **If telemetry is on and a debrief completes:** append one full record. Cap 60. At 61 the oldest record leaves.
- **If telemetry Clear is confirmed (two-step):** log empty. Campaign blob unchanged.
- **If telemetry Export is used:** local JSON download. Records never leave the machine by design (no network channel).
- **If Quality is changed:** settings slot only. Not a design lever. Not a campaign blob field.
- **If Difficulty is changed:** settings slot; survives New Operation.
- **If Persistence would price Credits, apply Control / Unrest, or tick labs:** forbidden. Owners already did that, or will on `sync(t)`.
- **If write storage throws:** do not throw through Debrief or New Operation. In-memory New Operation reset still proceeds in session; Continue / hydrate after that swallow restores the last successful durable campaign blob (the erased house can return). A swallowed first Screen persist after Debrief leaves the invoice unfiled. A swallowed write is not filed.

## Dependencies

| Direction | System | Nature | Data |
|---|---|---|---|
| Hard, upstream | World Network | WN blob in; hydrate out | `t`, Pause, Clock speed, sectors, Influence, Intel, Event RNG. Persistence does not apply Control / Unrest |
| Hard, upstream | Economy and contracts | Credits, generated records, `contractsWon` | Economy prices. Persistence durable-commits on the next Screen. Mission/debrief excluded |
| Hard, upstream | Research | Laboratories blob | `done` + lab runs. Pins on roster blob. `sync(t)` at saved `t` |
| Hard, upstream | Roster and Assembly | Roster blob; squad assignment | Living roster, pins, Experience, injuries, candidates, campaign flags. Item slots not frozen here |
| Hard, downstream | Tactical mission | Unsaved lifetime | Mission is memory only. Abort = no campaign write |
| Hard, downstream | Interface | Presentation | Continue, New Operation two-step, Settings, Balance, Export, Clear two-step; filing-status / invalid-blob / write-fail reasons |
| Hard, cycle | Audio | Settings-slot mixer values | Mute + four channel levels. Declared cycle (systems-index Circular Dependencies): Persistence stores; Audio owns mix correctness and reads this slot at hydrate — not a second owner |

World Network, Economy, Research, and Roster already list Persistence as hard downstream (strategy autosave; mission/debrief excluded). Bidirectional on those four. Tactical lists Persistence as hard upstream (unsaved lifetime); this file lists Tactical as hard downstream. Interface lists Persistence as hard upstream. Audio ↔ Persistence is a declared cycle (`Hard, cycle` both sides, per systems-index Circular Dependencies): Persistence stores the settings slot; Audio owns mix correctness and reads the slot at hydrate.

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

Presentation wrap is Interface / Audio. Persistence does not copy §12 palette or chrome. Menu Continue / New Operation and Balance must read as the same terminal (pillar 5). New Operation and telemetry Clear are paperwork confirms, not a game-over splash. Autosave has no ceremony and no save-slot UI. Audio follows screen ownership. No second visual language for “the save screen.”

## UI Requirements

Menu: Continue iff a valid campaign blob exists; New Operation behind a two-step erase. Settings: audio, remaps, accessibility, quality, difficulty, telemetry toggle — independent of the campaign blob. Balance: opt-in dashboard; win rate from `win_rate`; abort count beside it; Export local JSON; Clear two-step. Screens and HUD belong to Interface.

This GDD requires Interface to present these outcomes (copy and layout stay Interface / `/ux-design`; do not copy §12 chrome):

- Continue absent distinguishes never-started vs invalid / unreadable blob.
- Debrief invoice is not durable until the next Screen — the player can tell before they leave or reload.
- Abort confirmed = discarded, not checkpointed. Landing surface is Open Question 8.
- A swallowed storage write is not silent success.
- Continue is absent when there is no campaign; New Operation cannot fire in one click; Balance does not exist unless telemetry is a player choice (pillar 2: undecorated numbers; pillar 5: one OS).

## Acceptance Criteria

- **GIVEN** a clean origin with no campaign blob, **WHEN** the Menu loads, **THEN** Continue is absent, Menu state is never-started (no invalid-blob reason), and New Operation is offered. Copy stays Interface.
- **GIVEN** a campaign that reached a Screen so a valid local save exists, **WHEN** the origin is reloaded to the Menu, **THEN** Continue is present and opens the World Network for that campaign (not a new one, not a mission, not Brief, not Assembly).
- **GIVEN** Menu with Continue and recorded Credits / Intel / roster, **WHEN** the director activates New Operation once, **THEN** the control arms a confirm, the campaign blob is unchanged, and Continue still loads the same Credits / Intel / roster.
- **GIVEN** New Operation armed and a parallel clean-origin New Operation fixture F, **WHEN** the director confirms, **THEN** Credits, Intel, `contractsWon`, laboratories, and tutorial-seen equal F (Economy / World Network / Research / Roster opening desk — do not copy integers here), and the prior campaign cannot be restored.
- **GIVEN** Settings recorded as Difficulty D, Quality Q, telemetry toggle T, audio A, remap R, **WHEN** New Operation is confirmed, **THEN** Settings still equal D, Q, T, A, R.
- **GIVEN** Settings recorded as Difficulty D, Quality Q, telemetry toggle T, audio A, remap R (no campaign required), **WHEN** the origin is fully reloaded, **THEN** Settings still equal D, Q, T, A, R with Continue not required to hydrate Settings.
- **GIVEN** a lived-in campaign on a Screen, **WHEN** reload then Continue, **THEN** World Network, laboratories, roster, tutorial-seen, and campaign result match the last Screen visit (not the opening Operation).
- **GIVEN** a Screen snapshot S that held selected contract C and squad assignment, then a mission in progress, **WHEN** the origin is reloaded before Debrief, **THEN** Continue returns strategic / roster state from S including C (Brief is not locked by the reload); Continue opens the World Network; the mission is not resumed; there is no Debrief outcome.
- **GIVEN** snapshot S on a Screen, then a finished mission whose Debrief has applied in this session, **WHEN** the origin is reloaded while still on Debrief, **THEN** Continue restores S, not the invoice mutations.
- **GIVEN** snapshot S, Debrief has applied payout, sector, Intel, Influence, and roster in this session, and the director has returned to the World Network, **WHEN** reload then Continue, **THEN** those named campaign fields equal the post-apply values exactly once (not S, not doubled) and selected contract is none.
- **GIVEN** snapshot S that held selected contract C, then Debrief applied in this session, **WHEN** the director Replays to Brief, **THEN** selected contract is still C.
- **GIVEN** that Brief visit after apply, **WHEN** the origin is reloaded, **THEN** Continue restores the named post-apply campaign values (not S) exactly once and selected contract is still C.
- **GIVEN** a Debrief that has already applied payout, sector, Intel, Influence, and roster, **WHEN** Debrief stays open, **THEN** those campaign values do not change again, and telemetry (if on) still has exactly one record for that outcome.
- **GIVEN** snapshot S, telemetry off, a mission in progress, **WHEN** the director Aborts from pause and later reloads + Continue, **THEN** Credits, Influence, Intel, roster, sectors, labs, `contractsWon`, and campaign banners equal S; no Debrief ran; the aborted mission is not restored.
- **GIVEN** the campaign blob is replaced with non-JSON text via test inject (not a named storage key), **WHEN** the origin reloads to Menu, **THEN** Continue is absent and Menu state is invalid/unreadable, distinct from never-started. Copy stays Interface.
- **GIVEN** the campaign blob is JSON that fails campaign schema, **WHEN** the origin reloads to Menu, **THEN** Continue is absent, Screens are not entered, and Menu state is invalid/unreadable, distinct from never-started.
- **GIVEN** a valid campaign blob and invalid settings data, **WHEN** the origin reloads, **THEN** Continue is present.
- **GIVEN** a valid campaign blob and invalid telemetry data, **WHEN** the origin reloads, **THEN** Continue is present and Balance has no mission records.
- **GIVEN** a campaign blob with both complete and failed flags true, **WHEN** the origin reloads, **THEN** Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- **GIVEN** a campaign blob with `campaignFailed` false and `campaignWon` true but fewer than three authored ids in `contractsWon`, **WHEN** the origin reloads to Menu, **THEN** Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- **GIVEN** a campaign blob with `campaignFailed` false, `campaignWon` false, and all three authored ids in `contractsWon`, **WHEN** the origin reloads to Menu, **THEN** Continue is absent and Menu state is invalid/unreadable, distinct from never-started.
- **GIVEN** a campaign blob with `campaignFailed` true and 0–2 authored ids in `contractsWon`, **WHEN** the origin reloads to Menu, **THEN** Continue is present.
- **GIVEN** a campaign blob with `campaignFailed` true, `campaignWon` false, and all three authored ids in `contractsWon`, **WHEN** the origin reloads to Menu, **THEN** Continue is present.
- **GIVEN** a campaign blob with `campaignFailed` false, `campaignWon` false, living roster empty, and fewer than three authored ids in `contractsWon`, **WHEN** the origin reloads to Menu, **THEN** Continue is present and campaign result is still not failed (hydrate does not re-derive failed from living count 0).
- **GIVEN** recorded strategic `t` and laboratories / Tax-due / Event-due / candidate-due / generated-contract-due at that `t`, **WHEN** reload + Continue with no Screen tick, **THEN** `t` is unchanged; no laboratory completes; no Tax, Feed, candidate, or generated-contract fires (no offline hours; identity `sync(t)`).
- **GIVEN** recorded post-Screen Credits, Influence, Intel, strategic clock, Clock speed, Pause, sector Control / Unrest / ownership, open generated contracts, research done + active labs, roster, candidates, squad assignment, selected contract C, **WHEN** reload + Continue, **THEN** each recorded value matches including C; Focus / Review-time / mission / Debrief are not restored.
- **GIVEN** an authored contract already won, **WHEN** reload + Continue, **THEN** the persisted win flag is still present. Award amounts are Economy / World Network.
- **GIVEN** campaign not complete, roster emptied by KIA, World Network shows campaign failed and contracts locked, **WHEN** reload + Continue, **THEN** still failed (not complete), roster empty, contracts still locked.
- **GIVEN** campaign complete, then roster emptied, **WHEN** reload + Continue, **THEN** still complete, not also failed; authored contracts remain selectable for replay.
- **GIVEN** a campaign whose Feed already differs from a fresh Operation, **WHEN** reload + Continue and the same strategic wait elapses at the same Clock speed, **THEN** the next rolled Event matches the recorded continuation, not a New Operation opening sequence.
- **GIVEN** recorded candidate identities / costs at a known strategic time, **WHEN** reload + Continue, **THEN** the market matches that list; the next refresh continues that market, not the opening pool.
- **GIVEN** a campaign whose generated market already differs from a fresh Operation, **WHEN** reload + Continue and the same strategic wait elapses at the same Clock speed, **THEN** the next generated contract matches the recorded continuation, not a New Operation opening sequence.
- **GIVEN** a new origin (no settings blob) and a finished mission with telemetry never enabled, **WHEN** Settings is opened, **THEN** telemetry is off. **WHEN** Balance would be opened, **THEN** Balance is not offered.
- **GIVEN** telemetry on, N records, a mission that reaches Debrief, **WHEN** the invoice applies, **THEN** Balance count is N+1 (not N+2), and the new row’s outcome is won or lost (not aborted).
- **GIVEN** telemetry on and 60 records with a recorded oldest row identity (outcome, mission id, duration), **WHEN** another Debrief or Abort is logged, **THEN** Balance still shows 60 records (does not become 61) and that recorded oldest row is gone.
- **GIVEN** telemetry on, snapshot S, records present, **WHEN** New Operation is confirmed, **THEN** the campaign equals a new Operation and the telemetry toggle and log still match the pre-erase values.
- **GIVEN** telemetry on, snapshot S, **WHEN** Abort from pause, **THEN** campaign still equals S; abort count increases by 1; that row is `aborted` plus duration, mission id, seed, deployed roles — not a full combat invoice.
- **GIVEN** telemetry records: 2 won, 1 lost, 3 aborted, **WHEN** Balance is opened, **THEN** win rate is 2 / (2 + 1); abort count is 3; aborts are not in the win-rate denominator.
- **GIVEN** telemetry records: 0 won, 2 lost, **WHEN** Balance is opened, **THEN** win rate is 0.0.
- **GIVEN** telemetry records: 0 won, 0 lost, 3 aborted, **WHEN** Balance is opened, **THEN** abort count is 3 and win rate is unspecified (Open Question 2).
- **GIVEN** at least one telemetry record, **WHEN** Export JSON is used, **THEN** a local JSON file downloads and the action does not upload to an app origin.
- **GIVEN** records present, **WHEN** Clear is activated once, **THEN** records remain and the control arms a confirm.
- **GIVEN** records present and Clear armed, **WHEN** confirmed, **THEN** Balance is empty and the campaign blob is untouched.
- **GIVEN** telemetry on and a non-abort Debrief, **WHEN** JSON is exported, **THEN** that record includes outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles.
- **GIVEN** telemetry on or off, **WHEN** Debrief apply, Abort, Balance view, Export, or Clear runs, **THEN** no telemetry network request is emitted. UI click / SFX fetches are out of scope.
- **GIVEN** Debrief has applied in this session (payout, sector, Intel, Influence, and roster — or quiet-replay roster + ETA catch-up only) and the director has not entered a Screen, **WHEN** Debrief is shown, **THEN** an observable filing-status indicates the invoice is not durable (unfiled) without leaving Debrief. Copy and layout stay Interface.
- **GIVEN** that unfiled Debrief and a successful next-Screen autosave (World Network return or Brief Replay), **WHEN** reload then Continue, **THEN** named post-apply campaign fields persist (not S, not doubled) and filing-status is not still unfiled.
- **GIVEN** recorded campaign C0 and the next campaign-blob write is injected to throw (harness; not a named storage key), **WHEN** New Operation is confirmed, **THEN** the session does not throw; in-session desk matches new-Operation fixture F; the confirm is not presented as durable erase; **WHEN** the origin reloads to Menu, **THEN** Continue loads C0.
- **GIVEN** snapshot S, Debrief applied in this session, and the next Screen campaign-blob write is injected to throw (harness; not a named storage key), **WHEN** the director returns to the World Network or Replays to Brief, **THEN** the session does not throw and filing-status does not read filed; **WHEN** reload then Continue, **THEN** named campaign fields equal S.
- **GIVEN** snapshot S, a quiet-replay win applied in this session (roster + ETA catch-up; no contract payout, Intel, Influence, or direct Control / Unrest change), and the director has returned to the World Network or Replayed to Brief, **WHEN** reload then Continue, **THEN** strategic `t`, laboratories, injuries, Tax deposits, and roster equal the post-apply values (not S); Intel, Influence, and `contractsWon` equal S; Credits equal S plus Tax deposits from that catch-up (not a contract payout).

Do not treat quiet-replay payouts, mass gate, clipping, playtest thresholds, or performance budgets as Persistence criteria.

## Open Questions

1. **Closed — Telemetry log vs New Operation.** Log survives. Clear is the erase. [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md).
2. **`win_rate` when `won + lost = 0`.** Living spec silent. Includes an empty log and an abort-only log. Do not invent hide / 0 / undefined. Owner: Interface / Balance.
3. **Closed — Cap 60 eviction.** FIFO: oldest out at 61. [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md).
4. **`abort_rate` formula.** Named beside win rate. No denominator. Do not invent. Owner: Interface / Balance.
5. **Item-slot persistence across Assembly visits** — Roster Open Question 3. Do not resolve.
6. **Hire-on-failed-campaign** — Roster + World Network Open Question 1. Do not resolve.
7. **Closed — Reload on Debrief vs telemetry row.** Accepted mismatch: telemetry is a session log, not a campaign transaction. [ADR-0015](../../docs/architecture/adr-0015-telemetry-never-leaves-the-machine.md).
8. **Abort in-session landing after confirm.** Living spec silent. Persistence owns discard (no campaign write). Do not pick Menu vs last Screen here. Owner: Interface / living spec.

---

📌 **UX Flag — Persistence and validation**: Interface / `/ux-design` before epics, for Menu Continue / New Operation, Settings slot, Balance export/clear, **Debrief filing-status**, **Abort discard** (not land — Open Question 8), **invalid blob vs never-started**, and **write-fail**. Stories that reference UI should cite `design/ux/[screen].md`, not the GDD directly.
