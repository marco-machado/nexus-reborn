# ADR-0020: Campaign fail flags

> **Engine specialist**: APPROVE 2026-09-11
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-11 (re-run; prior CONCERNS 2026-09-11 scoped as TR-roster-007, not blocking)
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11

An empty living roster fails an **incomplete** campaign. A **completed** campaign stays complete after a roster wipe and is not also marked failed. The two flags cannot both be true.

Hire-on-failed is Roster GDD OQ1 — not this TR. Save validation stamps current `save.ts`, not extra drop-alls.

## Status
Accepted

## Date
2026-09-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | State |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `docs/technical-preferences.md`; `design/gdd/roster-and-assembly.md`; `design/gdd/persistence-and-validation.md`; `src/state/campaignStore.ts`; `src/state/save.ts`; `src/state/appStore.ts`; `src/ui/WorldMap.tsx` |
| **Post-Cutoff APIs Used** | None — flags are Zustand booleans on the campaign blob, not an engine API |
| **Verification Required** | Empty incomplete → `campaignFailed`, not `campaignWon`, contracts locked. Empty after complete → `campaignWon` stays, not failed. Both true is an invalid save (drop-all). Injured still count as living. Generated wins do not mark complete. Hydrate restores stored flags and does not re-derive fail from `operatives.length === 0`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted — debrief apply-once) |
| **Enables** | Completes TR-roster-007 |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0004 (quiet replay still applies KIA), ADR-0011 (blob stores the flags), ADR-0019 (deploy gate). Unrest crisis is not campaign fail. Hire-on-failed is Roster OQ1 — not locked here. |

## Context

### Problem Statement

TR-roster-007 is an ADR gap. Without a stamp, stories can fail a completed campaign on a later roster wipe, allow both `campaignWon` and `campaignFailed`, treat Injured as empty, mark complete from generated wins, or re-derive fail on hydrate from `operatives.length === 0` (false-failing a completed wipe).

### Constraints

- Debrief applies roster once (ADR-0002). The apply-once guard is Debrief `outcomeApplied` vs `outcomeSerial`, not inside `reportMission`.
- Quiet replay still applies KIA and can empty the living roster (ADR-0004).
- Persistence stores the flags and does not re-own meaning (`persistence-and-validation.md` Core Rule 14).
- World Network posts banners and locks contracts. Roster detects empty living roster.
- Brownfield: stamp `isCampaignFailed` + two booleans. Do not change `SaveV9` to a `CampaignStatus` enum.
- Roster GDD OQ1 (hire-on-failed-campaign) is **not** this TR. Do not lock `acceptHire` from code.
- `Physics: None`. No engine APIs.

### Requirements

- Empty incomplete living roster → campaign failed-empty-roster, not also complete; contracts locked (AC 38).
- Campaign already complete + living count 0 → stays complete, not failed (AC 39).
- Cannot be both.
- Persistence stores both booleans. Hydrate restores them.
- Never hire is legal; empty incomplete still fails (AC 77).

## Decision

Stamp the existing two booleans. Do not introduce a `CampaignStatus` enum.

### Empty living roster

`campaignStore.operatives.length === 0`. Injured still count. KIA are removed (no Dead roster state). Zero assigned Squad bays is ADR-0019, not campaign fail.

### Formula

`isCampaignFailed(rosterSize, alreadyComplete)` lives in `src/state/campaignStore.ts`:

```
rosterSize === 0 && !alreadyComplete
```

At `reportMission` (the Roster write site), after KIA filter:

1. `allWon` = every authored `MISSIONS` id is in `contractsWon` **this apply** (first authored wins only). Generated contracts do not join the record and cannot mark complete.
2. `campaignFailed = isCampaignFailed(operatives.length, allWon)` — pass **this debrief's `allWon`**, not stored `campaignWon`, so completing the spine and wiping in the same apply stays complete (AC 39).
3. `campaignWon = allWon && !campaignFailed`.

### Cannot be both

`save.ts` drop-alls the campaign blob if `campaignFailed && campaignWon`. A **non-failed** blob's `campaignWon` must match the three-authored record. A **failed** blob may still list 0–2 authored wins. Do **not** add drop-all for empty+incomplete+`!failed` (that re-derives fail on hydrate). Do **not** add drop-all for failed+three authored wins in this stamp.

Hydrate copies stored `campaignWon` / `campaignFailed`. Never re-derive fail from `operatives.length === 0` (would false-fail a completed wipe). v6 upgrade defaulting `campaignFailed: false` is an upgrade path, not a live re-derive.

### Owners

| Owner | Role |
|-------|------|
| Roster | Detects empty living roster at debrief; writes both flags in `reportMission` |
| Persistence | Stores both booleans on the campaign blob (ADR-0011). Validates cannot-both. Does not re-own meaning |
| World Network | Posts CAMPAIGN FAILED / complete banners. Locks contracts: `selectMission` no-ops when `campaignFailed` |
| Interface | Presents banners. Does not own flags |

Flag writes stay in `reportMission`, invoked once from Debrief (ADR-0002). Do not add a second effect that sets `campaignFailed` from length. Do not attach zustand persist middleware to `campaignStore` (ADR-0011).

Unrest crisis is not campaign fail.

### Out of scope

- Hire-on-failed-campaign (Roster OQ1). Live `acceptHire` may no-op when failed; this ADR does not stamp or forbid that.
- Deploy gate 1–4 / mass 400 (ADR-0019).
- Credits, intel gates, generated market.

### Architecture Diagram

```
Debrief (ADR-0002 apply-once)
  reportMission(missionId, outcome, worldT)
    filter KIA → operatives.length
    allWon = every authored MISSIONS id in contractsWon (this apply)
    campaignFailed = isCampaignFailed(length, allWon)
    campaignWon    = allWon && !campaignFailed

Persistence
  captureSave copies both booleans
  hydrateSave restores stored flags  — never length===0 ⇒ failed
  both true → drop-all
  !failed && campaignWon !== three-authored → drop-all

World Network
  campaignFailed → banner + selectMission no-op
  campaignWon && !campaignFailed → complete banner (replayable, not a lock)
```

### Key Interfaces

- `isCampaignFailed(rosterSize: number, alreadyComplete: boolean): boolean` — `src/state/campaignStore.ts` only. Call as `isCampaignFailed(operatives.length, allWonThisDebrief)`.
- `campaignStore.campaignWon` / `campaignStore.campaignFailed` — booleans. Write access: `reportMission` and hydrate. Not a derived store field.
- `SaveV9.campaign.campaignWon` / `campaignFailed` — persist. Both true → invalid blob. Non-failed `campaignWon` iff all three authored ids are in `contractsWon`.
- `selectMission` no-ops when `campaignFailed` — contract lock.
- Do not export a `CampaignStatus` enum. Do not move `isCampaignFailed` into `src/ui` or `src/scene`.

## Alternatives Considered

### Alternative 1: Fail after complete

- **Description**: Empty living roster always sets `campaignFailed`, even if the spine is already won.
- **Pros**: One rule.
- **Cons**: Contradicts AC 39 and the pillar that a completed campaign stays complete after a wipe.
- **Rejection Reason**: TR-roster-007 is the exception for complete campaigns.

### Alternative 2: Single `CampaignStatus` enum

- **Description**: Replace two booleans with `playing | won | failed`.
- **Pros**: Cannot be both by construction.
- **Cons**: Changes `SaveV9`; every selector and the v6 upgrade path move.
- **Rejection Reason**: Brownfield stamp. Two booleans plus the save invariant already forbid both.

## Consequences

### Positive

- A wipe after the authored spine stays a win.
- Incomplete empty roster is a terminal fail, distinct from sector crisis.
- Hydrate cannot false-fail a completed wipe.

### Negative

- Two booleans need the save cannot-both invariant.
- Failed blobs may list leftover authored wins (0–2); readers must not treat that list as complete.

### Risks

- Passing stored `campaignWon` into `isCampaignFailed` on the completing debrief would fail a same-tick wipe. Mitigation: pass `allWon` from this apply.
- Re-deriving fail on hydrate from `length === 0` false-fails a completed wipe. Mitigation: restore stored flags.
- A second React effect that writes `campaignFailed` from length double-applies under StrictMode. Mitigation: only `reportMission` behind the Debrief guard (ADR-0002).
- React 19.2 `<Activity>` keeping World Network mounted across fail (ADR-0017).
- Treating unrest crisis as campaign fail.
- Stamping `acceptHire` no-op would close Roster OQ1. Left unstamped.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| roster-and-assembly.md | TR-roster-007: empty incomplete fails; complete stays complete after wipe | `isCampaignFailed(length, allWonThisDebrief)`; `campaignWon = allWon && !failed` |
| roster-and-assembly.md | Core Rule 14; AC 38–39, 77 | Same formula; never-hire still fails empty incomplete |
| persistence-and-validation.md | Campaign end persist, do not re-own; cannot be both | Blob stores both booleans; drop-all if both true; hydrate does not re-derive |
| world-network.md | Failure banner and contracts lock | WN presents; `selectMission` no-ops when failed |

## Performance Implications

- **CPU**: None claimed (two booleans at debrief).
- **Memory**: Two persisted booleans.
- **Load Time**: None.
- **Network**: None.

## Migration Plan

None for live flags. Stamp `isCampaignFailed` and the two booleans as they exist. Do not migrate to an enum. Optional follow-up test: complete-then-wipe (AC 39) if still missing from `campaignStore.test.ts`. Do not add hire-on-failed ACs here.

## Validation Criteria

- GIVEN campaign not complete and living roster reaches 0, THEN `campaignFailed` and not `campaignWon`; contracts locked (`selectMission` no-op) (AC 38).
- GIVEN campaign already complete, WHEN living roster reaches 0, THEN `campaignWon` stays and `campaignFailed` is false (AC 39).
- GIVEN both flags true in a blob, THEN campaign drop-all.
- GIVEN Injured remaining and no KIA emptying the list, THEN not failed.
- GIVEN generated wins only, THEN not `campaignWon`.
- Hydrate does not set `campaignFailed` from `operatives.length === 0`.
- `campaignStore.test.ts` already covers incomplete wipe → failed and complete → not also failed. Optional: complete-then-wipe.

## Related Decisions

- [ADR-0002](adr-0002-unsaved-mission.md) — debrief apply-once
- [ADR-0004](adr-0004-quiet-replay.md) — quiet replay still KIA
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — campaign blob
- [ADR-0017](adr-0017-one-os-input-audio-mixer.md) — no `<Activity>` for phase hide
- [ADR-0019](adr-0019-deploy-gate.md) — deploy gate; not these flags
