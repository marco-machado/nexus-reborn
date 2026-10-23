# Story 021: World drift settles, and the Debrief and Feed show what the player moved

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/world-network.md` (event generator; Influence spends; Debrief write-back)
**Requirement**: `TR-world-network-013` (result direction, now printed on the Debrief). The event kind weights have no registered requirement: `TR-world-network-???` (warning; register at the next `/architecture-review`).
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtests 3 and 4 (`production/qa/playtests/playtest-2026-10-23-agent-s3.md`, `-s4.md`): with no player action 4 of 6 sectors reached crisis by strategic day 6, North America went 68% → 4% Control after a win there, and a Stabilize or Lobby changed nothing the tester could see. CD-PLAYTEST 2026-10-23 asked for numeric criteria, a world that still presses (Pillar 4), and a line showing what the player moved.

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: The Debrief is the only boundary that applies results, once; the sector reading before and after is taken around that apply.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)
**Engine**: React 19.2.8 + Vite 6.4.3 | **Risk**: LOW | **Engine Notes**: pure TypeScript and Zustand; no scene change.

**Control Manifest Rules (this layer)**:
- Required: deterministic world RNG (no new draw; the weights change, the cursor does not).
- Forbidden: UI owning world state (the Debrief reads a store the Debrief apply writes).

---

## Acceptance Criteria

- [x] GIVEN a new campaign and no player action WHEN the strategic clock runs 20 days on 20 RNG cursors THEN at most one sector is in crisis by day 6 on every cursor and fewer than 0.5 sectors a day are in crisis on average; North America stays Nexus-held through day 10 on at least 15 of 20 cursors; and some sector still passes 40 Unrest on at least 15 cursors (the world keeps pressing).
- [x] GIVEN a sector in crisis at 90 Unrest WHEN a Stabilize runs THEN the sector leaves crisis within two strategic days.
- [x] GIVEN a Stabilize or Lobby WHEN its last staged step lands THEN the Feed posts `STABILIZATION COMPLETE IN <SECTOR> // UNREST NOW n%` or `LOBBYING COMPLETE IN <SECTOR> // CONTROL NOW n%`.
- [x] GIVEN a filed win or loss WHEN the Debrief prints THEN it shows the mission sector's Control and Unrest before and after the result, and for a win the sector after the ETA days and any holder change.

---

## Implementation Notes

- `src/game/forecast.ts`: kind weights `riot 0.3 + heat×0.6`, `blackout 0.12 + heat×0.25`, `raid 0.18 + heat×1.5`, `trade 0.3 − heat×0.1`, `seizure 0.008` (flat); `KIND_WEIGHT_FLOOR` 0.005. Unrest now draws raids (which cool it) faster than riots, so drift mean-reverts near 30; a city flips about every two months.
- `src/state/worldStore.ts` `applySpendSteps`: the completion line on the last step.
- `src/state/debrief.ts`: `SectorReading`, `SectorMove`, `useDebriefMoveStore`; `applyDebrief` reads the sector before and after `applyMissionResult` and after the ETA. `src/ui/debriefWorld.ts` `sectorMoveRows`.

---

## QA Test Cases

- **AC-1, AC-2, AC-3**: `src/state/worldStore.test.ts` describe "world drift settles and Influence moves it (WN-021)" (five tests). Mutation-checked: the previous weights fail three of them.
- **AC-4**: `src/ui/debriefWorld.test.ts` "a win prints the result move, then the sector after the ETA days, naming a holder change", "a loss prints the drop in red and no ETA row", "no move, no rows". Sweep `production/qa/evidence/playtest-fixes-2026-10-23/` Debrief at four text scales and high contrast: 0 failures.

---

## Test Evidence

**Story Type**: Logic
**Status**: [x] Created — tests above; vitest 1664/1664 at `2c73542`.

---

## Dependencies

- Depends on: none
- Unlocks: a human playtest of the strategic layer

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE
**Criteria**: 4/4
**Decision**: Claude, delegated by the owner's /goal 2026-10-23. The thresholds in AC-1 are Claude's reading of CD-PLAYTEST's "at most 1–2 sectors in crisis by day 6", not owner numbers.
**Not done**: `/code-review` not run on this story. No human has played the retuned drift.
