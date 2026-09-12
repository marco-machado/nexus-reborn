# ADR-0014: Timeline Review is a view, not a clock

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-10

Timeline Review is a session view cursor on `worldStore.review`. It is not a third strategic clock.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Timing |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `src/state/worldStore.ts`; `src/ui/WorldMap.tsx`; `src/ui/clock.ts`; `src/state/save.ts` |
| **Post-Cutoff APIs Used** | None — Review is a Zustand session field and DOM slider, not an engine API |
| **Verification Required** | `setReview` does not write `t`. Live sectors/owners/Influence/Tax/contracts keep advancing on `t` while Review is on. Hydrate and New Operation force `review: null`. `advanceDays` clears Review. Tick snaps Review older than a day to Live (not while Pause). Game clocks are not `THREE.Timer`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Accepted — two advancement paths), ADR-0011 (Accepted — scrub not in campaign blob) |
| **Enables** | Stories that would otherwise rewind `t` or persist Review as live |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0001; names the excluded third path. ADR-0011 lists the scrub as absent from the blob; this ADR owns Live/Review semantics. |

## Context

### Problem Statement

TR-world-network-011 is an ADR gap. Without a stamp, stories can treat Timeline scrub as a third strategic clock: rewind `t`, mutate the live board, or persist Review as live.

### Constraints

- Only two strategic advancement paths (ADR-0001): Screen ticking via `useWorldClock`; win-ETA `advanceDays`.
- Campaign blob writer is `save.ts` only (ADR-0011). Review scrub is not in the blob.
- Game clocks are not `THREE.Clock` / `THREE.Timer` (ADR-0010 forbidden pattern `three_timer_as_game_clock`).
- Brownfield: stamp `worldStore.review` as it exists. No new persist field. No historical Control reconstruction.

### Requirements

- Timeline scrub is Review, not an advancement path (`design/gdd/world-network.md` Core Rule 3, TR-world-network-011).
- GIVEN Review time, WHEN the Timeline is scrubbed, THEN live sector state is unchanged.
- Review scrub is not restored as live (`design/gdd/persistence-and-validation.md`).
- Rolling 24-hour window (`docs/game-design.md` §5).
- Interface presents Timeline; World Network owns Live/Review meaning.

## Decision

Timeline Review is a session view cursor, not a clock.

`worldStore.review: number | null`

- `null` = Live. TimeCode and Feed follow strategic `t`.
- `number` = Review pin (strategic seconds). TimeCode stamps that instant. Feed shows events with `e.t <= review` (still capped). Timeline handle sits in `[t - DAY, t]`.
- `setReview(t | null)` writes **only** `review`. It never writes `t`, never runs `advanceFlow`, never `sync(t)` labs/injuries, never emits Tax. It does **not** clamp; WorldMap Timeline writers (seek / nudge / Home / End) clamp to the 24h window or Live.
- While Review is on, `tick` still advances live `t` and the live board (unless Pause). Pause/speed are the strategic-clock transport, not Review.
- If `review < t - DAY`, tick snaps `review` to `null`. Pause returns before that snap.
- `advanceDays` (win ETA) sets `review: null`.
- `SaveV9.world` has no `review` field. `hydrateSave` and New Operation force `review: null`. Capture must not grow a persist field for it.
- The pin lives on the global world store, so it survives leaving World Network while ScreenChrome keeps ticking live `t` on Research/Brief/Assembly until snap, GO LIVE, `advanceDays`, or hydrate.

Scan four numbers, owners, Influence, Tax, contracts, and crisis stay **live** during Review. Review retargets TimeCode, the Timeline handle, and Feed only.

Homonym: `GameCanvas({ review?: ReviewScene })` is a DEV scene overlay (`diagnostics`), not `worldStore.review`. Do not pass the Timeline pin into the mission canvas.

Not this ADR: reconstructing historical Control/Unrest/owners from the Feed; moving `review` into React local state; treating Pause as Review.

### Architecture Diagram

```
useWorldClock (four Screens)
  → worldStore.tick → t + advanceFlow (live board, Tax, events)
                    ↘ snap review → null if review < t - DAY (skipped while Pause)

Timeline / TimeCode / Feed  (WorldMap, presentation)
  read  review ?? t     → display only
  write setReview       → review field only; never t; unclamped

save.ts captureSave     → omits review (even if setReview scheduled autosave)
hydrateSave             → review: null
advanceDays             → review: null
```

### Key Interfaces

- `WorldStoreState.review: number | null` — session pin; not in `SaveV9.world`.
- `setReview(t: number | null): void` — only writer of the pin. `null` = Live. Unclamped.
- Timeline slider (`WorldMap` `Timeline`): `role="slider"`, `aria-label="TIMELINE REVIEW"`, arrows ±1h, Home = `t - DAY`, End = Live, near-now seek (≈ 98.5%) = Live. Clamping lives here.
- GO LIVE control: `setReview(null)`.
- Feed: Live = recent events; Review = `events.filter(e => e.t <= review)` then existing cap.
- Do not call `setReview` from `src/game/` or the mission scene.
- Do not pass `worldStore.review` into `GameCanvas` `review` (different type: `ReviewScene`).

## Alternatives Considered

### Alternative 1: Reconstruct historical board from the Feed

- **Description**: Scrub rebuilds Control/Unrest/owners at that instant for Scan display.
- **Pros**: Review would show the board as it was.
- **Cons**: Live state must still not mutate; needs a second derived view or event-sourced board. Not in GDD. Extra scope.
- **Rejection Reason**: Stamp existing. GDD requires live sector state unchanged, not a reconstructed past board.

### Alternative 2: Third clock / rewind `t`

- **Description**: Scrub writes `worldStore.t` (or a parallel clock that `sync(t)` consumes).
- **Pros**: One time variable for UI and sim.
- **Cons**: Rewind or a third path. Labs, injuries, Tax, generated market would catch up or roll back. Contradicts ADR-0001.
- **Rejection Reason**: TR-world-network-011 exists to forbid this.

### Alternative 3: React-local Review pin

- **Description**: Keep Live/Review in WorldMap component state instead of `worldStore.review`.
- **Pros**: `useWorldStore.subscribe(scheduleAutosave)` would not see scrubs; the pin would die on unmount.
- **Cons**: TimeCode, Timeline, and Feed already share the store field; a local pin splits them or requires lifting. Leaving World Network would drop Review even while ScreenChrome keeps ticking, which is a different product than the stamped global pin.
- **Rejection Reason**: Stamp existing. Feed and TimeCode already share `worldStore.review`.

## Consequences

### Positive

- Closes TR-world-network-011.
- ADR-0001 stays two paths.
- Reload cannot restore a scrub as live (ADR-0011).

### Negative

- Review is not a true history of Control; the Scan stays live while the clock chrome says Review.
- Feed is a filtered live log, not a reconstructed past.
- The pin is global: leaving World Network does not clear Review.

### Risks

- A story writes `t` inside `setReview` or seeks by calling `advanceDays` backward. Mitigation: `setReview` is pin-only; no reverse `advanceDays`.
- Adding `review` to `SaveV9.world` makes Continue open in Review. Mitigation: field stays out of the blob; hydrate forces `null`.
- `setReview` notifies `useWorldStore.subscribe(scheduleAutosave)` so a scrub can flush the campaign blob. Mitigation: capture still omits `review`; do not add it to `SaveV9`.
- Confusing Pause with Review. Pause freezes `t` and also skips the day-old snap. A paused Review older than a day stays pinned until unpause, GO LIVE, `advanceDays`, or hydrate.
- `setReview` does not clamp; a future pin is possible if a caller bypasses Timeline writers. Mitigation: only WorldMap writers call it; tick only nulls pins older than a day, not future pins.
- Homonym: `GameCanvas({ review?: ReviewScene })` is DEV scene overlay, not the Timeline pin. Mitigation: do not pass `worldStore.review` into the mission canvas.
- Migrating the pin to `THREE.Timer`. r3f 9.6.1 still owns an internal `THREE.Clock` for `useFrame` dt. Mitigation: forbidden pattern `three_timer_as_game_clock`; do not migrate `useWorldClock` or this pin.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| world-network.md | TR-world-network-011 Timeline Review is not an advancement path | Names Review as a view cursor; `setReview` cannot advance or rewind `t` |
| world-network.md | Live / Review; scrub without mutating live | Live board continues on `t`; Scan numbers stay live |
| persistence-and-validation.md | Review-time scrub is not in the campaign blob | No `review` on `SaveV9.world`; hydrate forces Live |
| interface.md | Timeline chrome; arrows/Home/End | Presentation only; meaning owned here |

## Performance Implications

- **CPU**: Filter Feed on Review change; 20Hz clock already batches Screen paints.
- **Memory**: one `number | null` plus existing event list.
- **Load Time**: none (not persisted).
- **Network**: none.

## Migration Plan

Stamp existing `worldStore.review`, `WorldMap` Timeline/TimeCode/Feed, and `save.ts` hydrate `review: null`. Do not add `review` to `SaveV9`. Do not reconstruct historical sectors. Do not move the pin into React local state (Feed and TimeCode already share the store field).

## Validation Criteria

- `setReview` leaves `t`, sectors, owner, influence, contracts, nextTaxT unchanged.
- During Review, Feed rows have `e.t <= review`; Scan Control/Unrest still equal live store.
- Hydrate / New Operation → `review === null` even if the previous session was reviewing.
- `advanceDays` → `review === null`.
- Tick with `review < t - DAY` → `review === null` (skipped while Pause).
- Pause still freezes `t` while a Review pin may remain until GO LIVE, snap after unpause, `advanceDays`, or hydrate.
- No `THREE.Clock` / `THREE.Timer` in this path.
- Campaign blob after a scrub still has no `review` field.

## Related Decisions

- [ADR-0001](adr-0001-two-clocks.md) — two clocks; this names the excluded third path
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — scrub not in the campaign blob
- [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md) — game clocks are not `THREE.Timer`
- [ADR-0007](adr-0007-opening-hour.md) — tactical Opening hour is not Review
