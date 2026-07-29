# Milestone 1 Implementation Plan: Close the Campaign Loop

Source: `GAME_DESIGN_DOCUMENT.md`, section 20, Milestone 1. This plan turns its five items into ordered work packages with file-level changes, acceptance criteria, and verification steps.

## Goals

1. Save and load: credits, world time, sectors, city ownership, research, intel, operative state.
2. Mission outcomes change the strategic world.
3. Award intel. Unlock Hollow Crown and Rust Haven.
4. Give the campaign an explicit success condition and recoverable failure pressure.
5. Prevent injured operatives from deploying.

## Non-goals

- New objective primitives, abilities, sidearms, usable items (Milestone 2 and 3).
- Full mission designs for Hollow Crown and Rust Haven (Milestone 2). This milestone authors placeholder objective sets only.
- Permanent operative death, experience, recruitment (Milestone 3).
- Influence spending, contract generation, difficulty modes, settings.

## Current state

- `src/state/appStore.ts:41` holds credits (start 128,450), squad, and outcome. `setOutcome` applies the net payout and moves to debrief. Nothing else consumes the outcome.
- `src/state/worldStore.ts` holds `t`, `sectors`, `owner`, `events`, `unread`, `nextEventT`. The event stream draws from a module-level `mulberry32(0x2087051)` closure at `worldStore.ts:108`. That closure state is not serializable.
- `src/state/researchStore.ts` holds `done` (ordered) and `labs` (three `LabRun` slots with `startedT`/`endT` on world time).
- `src/game/data.ts:6` hardcodes `INTEL_LEVEL = 1` and `INTEL_PROGRESS = 25` as constants. `MISSIONS` carries a static `locked` flag. `m02` and `m03` have empty `objectives`.
- `src/game/data.ts:80` marks Raven `INJURED` in the static `ROSTER`. `src/ui/index.tsx` renders the status but nothing enforces it. `appStore.toggleOperative` accepts any operative.
- No persistence exists anywhere. A page reload resets the campaign.

## Work packages

Do them in this order. WP6 (save) comes last so it serializes the final schema once.

### WP1: Campaign store

New file `src/state/campaignStore.ts` (a CONTRACT FILE). It owns campaign-meta state that no current store fits:

```ts
interface CampaignState {
  intelLevel: number            // start 1
  intelProgress: number         // 0..100, start 25
  roster: Record<string, { status: 'READY' | 'INJURED'; recoverAtT: number | null }>
  contractsWon: string[]        // mission ids, first-win order
  outcomeApplied: number        // counter guard, see WP2
  campaignWon: boolean
  awardIntel: (points: number) => void
  reportMission: (missionId: string, o: MissionOutcome, worldT: number) => void
  sync: (t: number) => void     // roster recovery on the world clock
}
```

- Seed `roster` from `ROSTER` statuses. Give Raven a `recoverAtT` of 24 world hours so the static injury heals.
- `sync(t)` flips `INJURED` to `READY` when `t >= recoverAtT`. Call it from `useWorldClock` in `src/ui/clock.ts`, next to the existing `researchStore.sync` call, so recovery runs on the same clock as research.
- `INTEL_LEVEL` and `INTEL_PROGRESS` in `data.ts` become initial values only. `src/ui/WorldMap.tsx:17` switches its readout to the store.

Estimate: half a day.

### WP2: Mission outcomes change the world

- Add `applyMissionResult(missionId, outcome)` to `worldStore`. Effects on the mission's sector (`MissionDef.sector`):
  - Win: control +4 to +6, unrest -3 to -5.
  - Loss: unrest +4 to +7, control -1 to -2.
  - Each civilian hit: unrest +1, capped at +5.
  - Push one authored `WorldEvent` to the feed (green tone on win, red on loss), for example `STRIKE TEAM 04 OPENS DISTRICT 07 IN NEW CARTHAGE`. Increment `unread`.
- No city ownership flip for Glass Veil: Sable Enterprises holds no cities, so a flip has no faction to receive it. Record this as a known limit; seizure flips for holder-corp clients can come with Milestone 2 missions.
- Call site: the boundary rule says `src/game/world.ts` writes `appStore` and reads nothing back, so the sim must not touch `worldStore`. Apply the effect from the Debrief screen (`src/ui/index.tsx`) on mount. Guard with `outcomeApplied` in `campaignStore` so a re-render or replay does not apply it twice: `setOutcome` bumps a counter, the debrief applies world effects only when the counter is new.
- The event values use fixed spans, not the module rng, so replays stay deterministic and the save problem in WP6 stays small.

Meets acceptance: a successful mission visibly changes at least two strategic values.

Estimate: half a day.

### WP3: Intel earning and contract unlocks

- Earn rules (two sources, per GDD section 21):
  1. Mission win: +40 progress.
  2. Clean contract (zero civilians hit by the squad): +15 progress.
  - 100 progress rolls into the next level. Award inside `campaignStore.reportMission`.
- Unlock rule: add `intelReq: number` to `MissionDef` in `src/game/types.ts` (`m01`: 1, `m02`: 2, `m03`: 2). Delete the static `locked` flag. Replace every `m.locked` read with a selector `missionLocked(m, intelLevel)`. Known read sites: `src/ui/WorldMap.tsx` (markers and operations list) and the brief entry path.
- `src/ui/Nav.tsx` locked tabs (Archives and friends) stay locked. The GDD wants two unlock uses for intel; the second use lands in Milestone 4 with the strategic screens. Record the gap in the doc header of `campaignStore`.
- Playability: author placeholder objective sets for `m02` and `m03` in `data.ts` with the three existing primitives (reach-zone, eliminate-tag, extract), plus real briefing and notes text. Milestone 2 replaces them with true extraction and sabotage designs. Without this, "unlock" produces a brief with no mission behind it and the WP4 win condition is unreachable.
- Risk to verify early: run `createWorld` against the `m02` (seed 20870601) and `m03` (seed 20870618) seeds. The generator guarantees connectivity for the m01 landmark set; confirm nothing in `world.ts` or `citygen.ts` assumes m01 specifically.

Estimate: one day, of which half is authoring and testing the two placeholder missions.

### WP4: Campaign success and failure pressure

- Success: when `contractsWon` contains all three mission ids, set `campaignWon` and show a campaign-complete banner on the World Network. One new component, styled like the existing event feed panels. The player can keep playing after it.
- Failure pressure, recoverable by design:
  1. A failed contract pays zero and raises sector unrest (WP2).
  2. An operative who dies in a mission returns as `INJURED` with `recoverAtT` = world time + 36 hours. Wire this in `reportMission` from `MissionOutcome`; extend `MissionOutcome` with `deadIds: string[]` and fill it in `world.ts` where casualties are counted.
  3. Injured operatives shrink the deployable pool (WP5). With fewer than four `READY` operatives, the player must advance world time until someone recovers. Time costs nothing else, so the pressure is real but never a dead end.
- No campaign game-over in this milestone. The GDD asks for pressure, not a fail state.

Estimate: half a day.

### WP5: Injury enforcement

- `appStore.toggleOperative` gains a guard: refuse to add an operative whose campaign status is `INJURED`. The store may read `useCampaignStore.getState()` inside the action; store-to-store reads inside actions are already the pattern (`world.ts` reads research the same way).
- Team screen (`src/ui/index.tsx`, roster rows near line 780): disable the assign control for injured rows and show the existing red `INJURED` status as the reason. Deploy stays disabled until four `READY` operatives fill the bays.
- Squad sanitation: after `reportMission` marks casualties injured, remove them from `appStore.squad` so the next team screen never opens with an invalid default.

Estimate: half a day.

### WP6: Save and load

New file `src/state/save.ts`.

- Schema, versioned:

```ts
interface SaveV1 {
  version: 1
  app: { credits: number; squad: string[] }
  world: {
    t: number; speed: number; paused: boolean
    sectors: Record<string, SectorState>
    owner: Record<string, CorpId>
    events: WorldEvent[]; unread: number; nextEventT: number
    rngState: number
  }
  research: { done: string[]; labs: Labs }
  campaign: {
    intelLevel: number; intelProgress: number
    roster: CampaignState['roster']
    contractsWon: string[]; campaignWon: boolean
  }
}
```

- The rng problem: the event stream must survive a reload, or loaded games drift from determinism. Change `src/game/rng.ts`: add a step-function form, `mulberryStep(state): [value, nextState]`, keep `mulberry32` as a wrapper over it. `worldStore` holds `rngState: number` in the store and steps it explicitly. This is the one change outside `src/state/`.
- Write path: subscribe to the four stores, debounce 500 ms, write one JSON blob to `localStorage` under `nexus-save-v1`. Suspend writes while `phase` is `mission` or `debrief`; the mission is memory-only today and stays that way. The debrief's world effects land in the stores, so the next strategy-screen write captures them.
- Read path: on boot, parse and validate the blob (check `version`, check ids against `MISSIONS`, `ROSTER`, and the research tree; discard on any mismatch). Main menu gains `CONTINUE` when a valid save exists and `NEW OPERATION`, which clears the save behind a confirm step, same two-step pattern as the pause-menu abort.
- Loading hydrates all four stores before any screen mounts. `review` and `selected` reset to defaults; they are view state, not campaign state.

Estimate: one day including the menu work and validation.

## File change summary

| File | Change |
|---|---|
| `src/state/campaignStore.ts` | New. Intel, roster condition, contract record, campaign result |
| `src/state/save.ts` | New. Serialize, validate, hydrate, autosave subscription |
| `src/state/appStore.ts` | `toggleOperative` injury guard; `MissionOutcome.deadIds` |
| `src/state/worldStore.ts` | `applyMissionResult`; move rng state into the store |
| `src/game/rng.ts` | Step-function rng with serializable state |
| `src/game/types.ts` | `MissionDef.intelReq`; drop `locked` |
| `src/game/data.ts` | Intel constants become seeds; placeholder objectives for m02/m03 |
| `src/game/world.ts` | Fill `deadIds` in the outcome it already builds |
| `src/ui/clock.ts` | Call `campaignStore.sync` beside `researchStore.sync` |
| `src/ui/index.tsx` | Debrief applies world effects; team screen injury lockout |
| `src/ui/WorldMap.tsx` | Dynamic lock state; live intel readout; campaign banner |
| `src/ui/Menu` (in `src/ui/index.tsx`) | `CONTINUE` and `NEW OPERATION` |

## Acceptance criteria

From GDD section 21, campaign loop, plus milestone specifics:

1. A reload reproduces credits, world time, sectors, ownership, the event feed, running labs, completed research, intel, roster condition, and contract record.
2. A won mission changes at least two strategic values and posts a feed event. A lost mission raises unrest.
3. Intel rises from two sources. Level 2 unlocks Hollow Crown and Rust Haven, and both are playable end to end.
4. Winning all three contracts shows the campaign-complete state.
5. An injured operative cannot be assigned or deployed, and recovers after their timer on the world clock.
6. Aborting a mission still discards it without saving mission state.

## Verification

The checks are `npm run lint`, `npm run build`, `npm test`, and this click-through:

1. New operation. Win Glass Veil with one civilian hit. Confirm the payout, the Europe control/unrest change, the feed event, and +40 intel.
2. Reload the page. Confirm `CONTINUE` restores everything from step 1, including a lab left running.
3. Lose a mission with casualties. Confirm zero payout, unrest rise, injured operatives blocked on the team screen, and squad auto-removal.
4. Advance world time past the recovery timer. Confirm the operative returns to `READY`.
5. Reach intel level 2. Confirm both locked contracts open and complete.
6. Win all three. Confirm the campaign banner.
7. `NEW OPERATION` after a confirm clears the save.

## Open decisions

1. Placeholder objectives for m02/m03 in this milestone: recommended yes, otherwise goals 3 and 4 cannot both land. Milestone 2 replaces them.
2. Casualty consequence: recommended injury with a 36-hour timer, no permadeath. Milestone 3 owns deeper consequences.
3. Intel's second unlock use: deferred to Milestone 4. The GDD acceptance line for intel is only half met in this milestone.
4. Save trigger: recommended debounced autosave on strategy screens only. An explicit save button is not planned.

## Estimate

About four developer days: WP1 through WP5 in two and a half days, WP6 in one day, and half a day for the full click-through and fixes.
