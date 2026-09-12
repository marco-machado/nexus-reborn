# ADR-0011: Campaign persistence envelope

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-10

Three local storage envelopes hold the house. A mission in progress is not one of them. Invalid campaign data is dropped whole. Debrief applies in memory; the next Screen is the first durable write.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md`. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `docs/architecture/adr-0002-unsaved-mission.md` |
| **Post-Cutoff APIs Used** | None — `localStorage` + JSON + Zustand `getState` / `subscribe`, not an engine API |
| **Verification Required** | Campaign blob omits a running mission. Invalid campaign blob is not half-loaded. Settings survive New Operation. Debrief does not autosave the campaign; the next Screen does. Hydrate lands on menu and `sync(t)` research/roster to saved `t`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted — mission memory-only; settings/telemetry split), ADR-0001 (Accepted — hydrate `sync(t)` is not a third clock) |
| **Enables** | Stories that would otherwise invent a fourth envelope or a mid-debrief durable campaign write |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Cites ADR-0009 and ADR-0010 as must-not-contradict (both Accepted). Does not pick Intel store placement or generated-market Zustand owner. Does not serialize the ADR-0009 freeze. |

## Context

### Problem Statement

ADR-0002 forbade mid-mission save and split settings/telemetry from the campaign, but it never named the three-envelope schema, all-or-nothing hydrate, serialized strategy RNG, or debrief-in-memory vs next-Screen durable write. Without that envelope, stories can merge keys, half-load a corrupt blob, or persist the invoice twice.

### Constraints

- Desktop web, single-player, no cloud / accounts / leaderboards.
- Do not promote storage key strings, inner save-version integers, or autosave delay into GDD rules.
- `src/game/` stays pure. Persistence lives in `src/state/`.
- Mission freeze (ADR-0009) is memory. Do not write `DeployParams` into the campaign blob.
- Settings quality persist must not tear the live `createRoot` pipeline (ADR-0010).

### Requirements

- Three storage envelopes: campaign, settings, telemetry.
- Invalid campaign blob is drop-all; Continue unavailable.
- Hydrate to menu; `sync(t)` to saved strategic `t`; no offline hours.
- World Event and candidate / generated-market RNG streams live in the campaign blob (content, not a Zustand-home pick).
- Debrief applies once in memory; first durable campaign write of that result is the next Screen autosave.

## Decision

Persistence is three **storage envelopes**, not player-facing save slots, not one merged blob.

### Three envelopes

1. **Campaign blob** — versioned, local. World Network (including strategic `t`, Influence wallet, Tax cursor, Feed, crisis), Economy content (Credits, generated contract records, authored `contractsWon`), laboratories (`done` + lab runs), roster, tutorial progress, campaign result, strategy squad assignment, serialized World Event RNG and candidate / generated-market RNG. Pins are roster content, not a research field.
2. **Settings envelope** — audio, remaps, accessibility, quality, difficulty, telemetry **toggle**. Survives New Operation.
3. **Telemetry envelope** — records. Not fields of the campaign blob. Cap, opt-in policy, eviction, and whether the log survives New Operation are **not** decided here (TR-persistence-008 / Persistence OQ1).

Not in the campaign blob: running mission; debrief outcome / apply serials; settings; telemetry log; Timeline Review scrub; `missionStore` HUD/pause; selected contract after Debrief returns to the World Network; ADR-0009 `DeployParams` freeze.

Intel numbers and generated-market records may **appear** in the blob as content. This ADR does not assign `campaignStore` vs `worldStore` (store-placement ADR).

### Invalid blob

Unreadable or invalid campaign blob is no campaign. Drop the whole blob. Continue unavailable. Do not half-load. Settings or telemetry garbage falls back independently and must not inherit this drop-all policy.

### Hydrate

Restore strategy stores. Session phase is **menu**. Mission id and debrief outcome are not restored. Then `researchStore.sync(t)` and `campaignStore.sync(t)` to the **saved** strategic `t` — the same `t`, not wall-clock. Reload does not grant offline hours. Advancement remains Screen ticking and a win ETA only (ADR-0001). Continue opens the World Network; it never resumes a mission.

### When the campaign blob writes

Four Screens autosave the campaign blob. Mission and Debrief do **not**. Abort writes no campaign. Debrief owners apply payout / sector / intel / influence / roster **once in session memory**. The first **durable** campaign write of that result is the next Screen autosave (return to the World Network). Reload while still on Debrief restores the last Screen snapshot (pre-mission). A second apply of the same outcome does not run.

Campaign skip on mission/debrief is **not** a global persist ban: enabled telemetry may still append on debrief or abort to the telemetry envelope.

### Writer

`src/state/save.ts` is the only campaign-blob writer. Do not put `zustand/middleware` `persist` / `createJSONStorage` / `persist.rehydrate()` on the composed campaign stores — that would durable-commit the in-memory debrief apply and would write on every Screen tick.

Screen writes coalesce so persist is not 20Hz (`useWorldClock`). Do not promote `AUTOSAVE_DELAY` as a GDD rule.

Storage throws (`QuotaExceededError`, private-mode `SecurityError`) swallow at the writer. They must not throw through Debrief or New Operation. Quota is one origin across the three envelopes.

New Operation is a two-step erase of the **campaign** envelope only. Settings survive. Telemetry log vs erase remains OQ1.

`initializeSaveSystem` stays idempotent (React StrictMode). Boot order: `initSettings` then `initializeSaveSystem` then `createRoot`. The storage **key** never moves; bump the inner version so old campaigns upgrade in place.

Cookies, `sessionStorage`, IndexedDB, and OPFS are out. Cookies would leave the machine; `sessionStorage` dies with the tab and kills Continue.

### Architecture Diagram

```
localStorage (one origin, three envelopes)
  campaign blob     ← save.ts only; Screens coalesced autosave
  settings          ← settingsStore; survives New Operation
  telemetry         ← telemetry.ts; may write on debrief/abort

hydrate → menu
        → research.sync(saved t) + campaign.sync(saved t)
        → no mission, no outcome, no offline hours

Debrief: apply once in memory
      → next Screen autosave is first durable campaign write
```

### Key Interfaces

Implementation facts (not GDD knobs): `SAVE_KEY` / `SETTINGS_KEY` / `TELEMETRY_KEY`; inner versions; `captureSave` / `validateSave` / `readSave` / `hydrateSave` / `writeSave` (catch, no throw); `startAutosave`; `startNewOperation` (campaign key only); `initializeSaveSystem`. `app.loadout` is in the campaign blob today; Roster OQ3 (item-slot persistence) is not resolved by this ADR.

## Alternatives Considered

### Alternative 1: One storage key for campaign + settings + telemetry

- **Description**: Single blob; New Operation clears everything.
- **Pros**: One read path.
- **Cons**: New Operation wipes preferences and Difficulty.
- **Rejection Reason**: Contradicts ADR-0002.

### Alternative 2: Durable campaign write at debrief

- **Description**: Persist the invoice when debrief applies.
- **Pros**: Reload on Debrief keeps post-mission state.
- **Cons**: Debrief becomes a checkpoint; a second apply / reload path forks ADR-0002.
- **Rejection Reason**: GDD rule 10 — first durable write is the next Screen autosave.

## Consequences

### Positive

- Closes TR-persistence-002 / 004 / 006 / 007.
- New Operation cannot reset the desk’s preferences.
- Corrupt campaign data cannot boot a half-house.

### Negative

- Reload on Debrief loses the invoice if the director never returned to a Screen.
- Three envelopes share one origin quota.
- Telemetry privacy / cap / New Operation vs log remain open.

### Risks

- A fourth envelope or `zustand persist` on `worldStore` / `campaignStore` silently durable-commits debrief. Mitigation: `save.ts` is the only campaign writer; mission+debrief skip stays.
- Serializing the ADR-0009 freeze would make Abort a reload. Mitigation: freeze is memory-only.
- Settings `quality` persist must not rebuild the live WebGPU root (ADR-0010).
- Multi-tab last-write-wins on one origin is residual desktop-web risk, not a fourth slot.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| persistence-and-validation.md | TR-persistence-002 Three slots: campaign blob, settings, telemetry; New Operation does not reset prefs | Names three storage envelopes; New Operation erases campaign only |
| persistence-and-validation.md | TR-persistence-004 Debrief applies once in memory; durable commit is the next Screen autosave | Mission/debrief skip campaign write; next Screen persists the in-memory apply |
| persistence-and-validation.md | TR-persistence-006 Invalid/unreadable campaign blob is all-or-nothing | Drop the whole blob; no half-load |
| persistence-and-validation.md | TR-persistence-007 World Event stream and candidate market serialize RNG across reload | Those RNG streams live in the campaign blob |

## Performance Implications

- **CPU**: coalesced Screen writes, not 20Hz stringify.
- **Memory**: one campaign JSON blob; no mission in it.
- **Load Time**: hydrate before first paint (`initializeSaveSystem` before `createRoot`).
- **Network**: none. Cookies forbidden.

## Migration Plan

Stamp existing `save.ts` / `settingsStore.ts` / `telemetry.ts`. Do not merge keys. Do not autosave debrief. Do not add `zustand persist` middleware. Do not introduce IndexedDB.

## Validation Criteria

- `startNewOperation` does not clear settings.
- Hydrate with a truncated campaign JSON yields no campaign (Continue unavailable), settings intact.
- Phase `mission` or `debrief` leaves the campaign blob unchanged; returning to `world` persists in-memory debrief mutations.
- Hydrate forces `phase: menu` and `sync(t)` at saved `t`.
- Autosave of many Screen ticks coalesces (latest snapshot, not one write per tick).

## Related Decisions

- [ADR-0001](adr-0001-two-clocks.md) — hydrate `sync(t)` is not a third advancement path
- [ADR-0002](adr-0002-unsaved-mission.md) — unsaved mission; this ADR names the envelope
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — freeze is not serialized (Accepted)
- [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md) — settings quality persist ≠ live renderer rebuild (Accepted)
