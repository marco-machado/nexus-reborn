# ADR-0015: Telemetry never leaves the machine

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-10

Opt-in local mission records. Cap 60, oldest out. The log is not a campaign transaction and does not leave the origin.

Numbered 0015 because ADR-0013 (Credits never overdraw) and ADR-0014 (Timeline Review is a view) landed on disk while this decision was in review.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Persistence / Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md`. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/engine-reference/web/breaking-changes.md`; `docs/engine-reference/web/deprecated-apis.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `docs/architecture/adr-0011-campaign-persistence-envelope.md`; `src/state/telemetry.ts`; `src/ui/Balance.tsx` |
| **Post-Cutoff APIs Used** | None — `localStorage` + JSON + settings toggle + `data:` download. Not an engine API. |
| **Verification Required** | Toggle default off. `telemetry.ts` and Balance export perform no `fetch` / `sendBeacon` / WebSocket / cookie write. Cap stays 60 (FIFO). New Operation does not clear `TELEMETRY_KEY`. Garbage telemetry yields empty log. `src/game` has no value import of `telemetry.ts` and no `recordMissionOutcome` / `recordAbort` call (a type-only `MissionTelemetry` import in `world.ts` is allowed). |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0011 (Accepted — three envelopes; debrief/abort may write telemetry while campaign skip), ADR-0002 (Accepted — settings/telemetry split from campaign) |
| **Enables** | Stories that would otherwise add a beacon, default the log on, exceed 60, or erase the log on New Operation |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not own `win_rate` at 0/0 (Persistence OQ2) or `abort_rate` denominator (Persistence OQ4 / Interface). Does not change the campaign-blob writer. Independent of ADR-0013 (Credits) and ADR-0014 (Timeline Review). |

## Context

### Problem Statement

ADR-0011 named the telemetry envelope and allowed debrief/abort writes while the campaign blob is skipped. It left opt-in, cap 60, privacy, eviction, New Operation vs the log, and reload-on-Debrief vs a row unspecified. Without this ADR, stories can add a network beacon, default the log on, grow past 60, or treat New Operation as a log wipe.

### Constraints

- Desktop web, single-player, no cloud / accounts / leaderboards (`docs/game-design.md` §18).
- Three storage envelopes already decided (ADR-0011). This ADR does not merge keys or add a fourth.
- `save.ts` remains the only campaign-blob writer. `startNewOperation` erases the campaign envelope only.
- `src/game/` stays pure. Persistence I/O lives in `src/state/`.
- Do not promote storage key strings or inner version integers into GDD rules.
- Do not invent `abort_rate` or `win_rate` at 0/0.

### Requirements

- Telemetry is opt-in, local, off by default, never leaves the machine (TR-persistence-008).
- Cap 60; the log does not become 61.
- Enabled debrief appends one full record; enabled Abort appends a thin record.
- Export is a local JSON download. Clear is two-step (Interface chrome; Persistence empties the log).
- New Operation does not reset the telemetry **toggle**. This ADR also keeps the **log**.

## Decision

Stamp existing `src/state/telemetry.ts`. Telemetry is a **local session log**, not a campaign ledger and not a network product.

### Privacy — never leaves the machine

Records stay on the origin. No `fetch`, `sendBeacon`, WebSocket, cookies, analytics SDK, or upload from `telemetry.ts` or from Balance export. Export is a local JSON file (`data:` URL download in `Balance.tsx`). The player copying that file off-box is not a game network channel. UI click / SFX `fetch` and Vite HMR are not telemetry channels.

Cookies remain forbidden (ADR-0011): they would leave the machine.

### Opt-in

Settings envelope boolean `telemetry`, default **false**. Off → `recordMissionOutcome` and `recordAbort` are no-ops. Toggle survives New Operation.

### Cap and eviction

`TELEMETRY_CAP` is 60. `appendRecord` is FIFO: oldest row leaves when the 61st would be added. Balance never shows 61 records. This closes Persistence GDD Open Question 3.

### Envelope and New Operation

`TELEMETRY_KEY` holds `{ version, records }`. Not a campaign-blob field. Not a Zustand store. Do not attach `zustand/middleware` persist to the log.

New Operation does **not** `removeItem(TELEMETRY_KEY)`. The log survives campaign erase. Two-step Clear (`clearRecords`) is how the log dies. This closes Persistence GDD Open Question 1.

Wrong version, unreadable JSON, or a non-array `records` yields an **empty log**, not a half-read one. Independent of campaign drop-all.

### Write timing

Enabled telemetry appends at debrief (one full record from `MissionOutcome.telemetry`) or abort (thin: `aborted`, duration, mission id, seed, deployed roles). Campaign skip on mission/debrief is not a global persist ban (ADR-0011).

Telemetry is not transactional with the campaign blob. Reload while still on Debrief restores the last Screen snapshot and may leave a telemetry row for an outcome the campaign rolled back. That mismatch is accepted. Abort still appends immediately (no campaign write). This closes Persistence GDD Open Question 7.

Writer swallows quota / security throws. They must not throw through Debrief or Abort.

### Mission coupling

`world.ts` accumulates plain numeric counters and hands them once as `MissionOutcome.telemetry`. `src/game` may type-import `MissionTelemetry`. It must not value-import `telemetry.ts` or call `record*`.

### Architecture Diagram

```
settings.telemetry (default off)  →  gate on recordMissionOutcome / recordAbort

world.ts counters → MissionOutcome.telemetry → debrief recordMissionOutcome
Abort click → recordAbort (thin)

localStorage TELEMETRY_KEY  { version, records[0..60) FIFO }
  New Operation  →  does not touch this key
  Clear (two-step) →  empty log, campaign blob unchanged
  Export →  local JSON download; no upload

Balance reads loadRecords / aggregate  (win_rate = won/(won+lost); aborts excluded)
```

### Key Interfaces

Implementation facts (not GDD knobs): `TELEMETRY_KEY` / `TELEMETRY_VERSION` / `TELEMETRY_CAP`; `MissionTelemetry`; `MissionRecord`; `recordMissionOutcome`; `recordAbort`; `appendRecord`; `loadRecords`; `saveRecords`; `clearRecords`; `exportJson`; `aggregate`. `aggregate.abortRate` in code is not a GDD rule.

## Alternatives Considered

### Alternative 1: Remote collector / analytics SDK

- **Description**: POST / beacon records to an app origin or third party.
- **Pros**: Studio dashboards without Export.
- **Cons**: Leaves the machine; contradicts §17 / §18 / pillar privacy.
- **Rejection Reason**: TR-persistence-008 is local-only.

### Alternative 2: Fold records into the campaign blob

- **Description**: One `SAVE_KEY`; New Operation wipes the log with the house.
- **Pros**: One read path; Balance always matches this Operation.
- **Cons**: Contradicts ADR-0011 three envelopes; mixes session log with campaign hydrate/drop-all.
- **Rejection Reason**: Envelope split already Accepted; Clear is the log erase.

### Alternative 3: Refuse the 61st append (keep all 60)

- **Description**: Hard ceiling; newest mission never logs once full.
- **Pros**: Oldest sessions preserved.
- **Cons**: Balance freezes on old Operations; a lived-in desk stops recording.
- **Rejection Reason**: FIFO matches shipped `appendRecord` and keeps the dashboard current.

## Consequences

### Positive

- Closes TR-persistence-008.
- Closes Persistence GDD OQ1 (log survives), OQ3 (FIFO), OQ7 (accepted mismatch).
- New Operation cannot reset the desk's telemetry preference or its log.
- Stories cannot treat Balance as a network product.

### Negative

- Reload on Debrief can show a Balance row the campaign rolled back.
- Balance `win_rate` can mix records across Operations until Clear.
- Three envelopes share one origin quota; a full origin silently drops an append.
- FIFO discards the oldest row with no player prompt.

### Risks

- Chromium treats `data:` as an opaque origin, so `<a download>` is not same-origin-guaranteed. Mitigation: 60-record JSON is small; stamp-as-is. `Blob` + `URL.createObjectURL` (then revoke) is a later reliability fix, not this ADR. Firefox may need the `<a>` attached before `.click()`.
- Unsynchronized read-modify-write; multi-tab last-write-wins can drop a row (same residual as ADR-0011).
- One origin quota across campaign/settings/telemetry — swallowed, so a full origin looks like a successful debrief with no new row.
- A later story adding `sendBeacon` "for crash reports" would violate this ADR. Mitigation: forbid network in `telemetry.ts` and Balance export.
- Type-only `MissionTelemetry` import in `world.ts` can look like a layer break in grep. Mitigation: ban value imports and `record*` from `src/game`, not the type.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| persistence-and-validation.md | TR-persistence-008 Telemetry opt-in, local, cap 60, never leaves the machine | Opt-in default off; localStorage only; FIFO cap 60; no network channel |
| persistence-and-validation.md | Enabled debrief = one full record; Abort = thin record | `recordMissionOutcome` / `recordAbort` |
| persistence-and-validation.md | Export local JSON; Clear two-step | `exportJson` download; `clearRecords`; campaign blob untouched |
| persistence-and-validation.md | `win_rate = won / (won + lost)`; aborts excluded | `aggregate.winRate`; abort count beside it |
| interface.md | Balance is opt-in dashboard; Export local; Clear two-step | Presentation remains Interface; this ADR owns the log policy |
| docs/game-design.md §17 | Opt-in, local, off by default, never leaves the machine | Stamped |

## Performance Implications

- **CPU**: stringify at most 60 records on debrief/abort/export, not per frame.
- **Memory**: bounded log.
- **Load Time**: Balance reads localStorage on open, not at boot hydrate.
- **Network**: none for this envelope.

## Migration Plan

Stamp existing `telemetry.ts` / `settingsStore.ts` / `Balance.tsx`. Do not merge keys. Do not clear the log from `startNewOperation`. Do not add analytics. Do not change FIFO. Update Persistence GDD OQ1 / OQ3 / OQ7 and Interface sibling notes 4–5 to match.

## Validation Criteria

- New origin: telemetry off; Balance has no records after a finished mission.
- Toggle off: Debrief and Abort write no row.
- Toggle on: one debrief → exactly one new row (not two); Abort → thin `aborted` row; campaign unchanged.
- 60 records + another append → still 60; oldest gone.
- New Operation: toggle and log unchanged; campaign erased.
- Clear confirm: log empty; campaign blob unchanged.
- Export: local JSON download; `telemetry.ts` and Balance export issue no `fetch` / `sendBeacon`.
- Garbage `TELEMETRY_KEY`: empty log; campaign hydrate unaffected.
- `src/game` has no value import of `telemetry.ts`.

## Related Decisions

- [ADR-0002](adr-0002-unsaved-mission.md) — unsaved mission; settings/telemetry split
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — campaign envelope; this ADR fills the telemetry policy it deferred
- [ADR-0013](adr-0013-credits-never-overdraw.md) — Credits ledger; different domain, adjacent number only
- [ADR-0014](adr-0014-timeline-review-is-a-view.md) — Timeline pin; not a telemetry concern
