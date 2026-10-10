# Story 003: Debrief writes back at frozen t0, then ETA; apply-once

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 2.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-004`, `TR-world-network-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Mint, rewrite or persist the apply key outside the `MissionScreen` composer.
- Forbidden: Per-owner last-applied keys or a Credits-only guard.
- Forbidden: Any UI component calling `reportMission`, `applyMissionResult`, `addCredits` or `advanceDays` for a Debrief result.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a win at frozen `t0` with sector state S, WHEN debrief applies, THEN Control / Unrest / ownership / Influence / Intel write-back uses S at `t0`, and only after that write-back does ETA catch-up advance `t`.
- [ ] GIVEN a fully applied Debrief serial N, captured post-apply strategic state S, and no intervening Screen tick or input, WHEN Debrief's apply path is re-entered with the same serial N, THEN the apply-once key refuses a second apply: state still equals S, with no repeated mission write-back, ETA advancement, Tax/Credits deposit, Feed or market change, RNG/dues consumption, or Research/Roster synchronization.
- [ ] GIVEN a stray older apply key (≤ `lastAppliedKey`), WHEN `applyDebrief` receives its outcome, THEN nothing is applied.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `applyDebrief(missionId)` is the only caller of the Debrief owner mutators. Order: return if no outcome or key already applied; set `lastAppliedKey` first; record telemetry; `addCredits(netPayout)`; `campaignStore.reportMission`; `worldStore.applyMissionResult` at frozen `t0`; squad and loadout cleanup; on a win `advanceDays(ETA)` then Research and Roster `sync(t)`.
- Debrief calls `applyDebrief` from `useLayoutEffect` and holds no guard of its own; `campaignStore.outcomeApplied` and `appStore.outcomeSerial` are deleted.
- A key applies iff `outcome.applyKey > lastAppliedKey`. `deploySerial` / `lastAppliedKey` are session-only and never enter the campaign blob.
- The GDD notes the old `outcomeApplied` guard did not cover Credits; ADR-0021 supersedes it — verify Credits are covered by the single key.
- Catch-up must not run before write-back.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015/016: the sector/city write-back magnitudes.
- Story 017: what the Scan shows after the apply.

---

## QA Test Cases

**Test file path**: `src/state/appStore.test.ts` and `src/state/worldStore.test.ts` (apply-order spy; same key leaves a deep-equal snapshot)

**What to test**:
- A win at frozen `t0` with sector state S writes Control, Unrest, ownership, Influence, and Intel from S at `t0`. ETA catch-up advances `t` only after that write-back.
- Re-entering apply with the same debrief serial N, and no Screen tick or input in between, leaves state equal to the post-apply snapshot S. No second mission write-back, ETA advancement, Tax or Credits deposit, Feed or market change, RNG or dues consumption, or Research or Roster sync.
- An older apply key (`≤ lastAppliedKey`) applies nothing.

**Edge cases to cover**:
- `applyDebrief` sets `lastAppliedKey` first. A key applies only when `outcome.applyKey > lastAppliedKey`.
- Order: `worldStore.applyMissionResult` at frozen `t0`, then `advanceDays(ETA)` only on a win.
- Assert Credits do not move on the second apply. That is not proof the Economy mutator is itself idempotent.
- Quiet-replay ETA behavior is Story 005, not this story.

*No formula in the Formulas section. This story asserts order and a single apply, not Influence or Intel award integers.*

**Estimated test count**: ~5 integration tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/appStore.test.ts` and `src/state/worldStore.test.ts` — apply order spy; re-entry with same key leaves a deep-equal state snapshot. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 015, Story 016, Story 017
