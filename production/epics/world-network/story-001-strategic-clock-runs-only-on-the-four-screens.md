# Story 001: Strategic clock runs only on the four Screens

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-001`, `TR-world-network-012`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: A single shared clock that ages the world during a firefight, or a pause that hides that cost (ADR-0001).
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN phase ∈ {World Network, Research, Brief, Assembly}, speed 1×, unpaused, foreground frame delivery with no clamped gaps, WHEN the clock delivers a total of 1 accepted real second to `tick` (no pending batching remainder at either observation), THEN strategic `t` increases by 60 seconds.
- [ ] GIVEN an unpaused Screen at 1× with an empty caller accumulator, WHEN one rAF callback arrives after a 1-second wall-clock gap, THEN the caller admits 0.25 seconds and the delivered tick advances `t` by 15 strategic seconds. (Caller-side stall clamp per ADR-0018; not a clamp on raw `worldStore.tick`.)
- [ ] GIVEN phase ∈ {Menu, Mission, Debrief}, WHEN wall-clock advances, THEN strategic `t` is unchanged.
- [ ] GIVEN paused on a Screen, WHEN wall-clock advances, THEN strategic `t` is unchanged.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `useWorldClock` is rAF-driven — not `THREE.Timer`, r3f `useFrame` or `setAnimationLoop`.
- `ScreenChrome` stays unmounted on menu / mission / debrief, so no clock runs there.
- The rAF clamp to `worldStore` `MAX_DT` (0.25 s wall) is a caller-side stall clamp, not offline-hour catch-up, and must stay distinct from it.
- Keep `advanceFlow` on the main thread.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: ETA catch-up after a win.
- Story 006: Timeline Review scrubbing.

---

## QA Test Cases

**Test file path**: `src/state/worldStore.test.ts` (tick, pause, phase gating); `src/ui/clock.test.ts` (beside `useWorldClock` in `src/ui/clock.ts`)

**What to test**:
- On World Network, Research, Brief, or Assembly, at 1×, unpaused, with no clamped gaps and no pending remainder, 1 accepted real second delivered to `tick` increases strategic `t` by 60 seconds.
- One rAF callback after a 1-second wall gap, empty accumulator, 1×, admits 0.25 seconds and advances `t` by 15 strategic seconds. That clamp is on the caller, not on raw `worldStore.tick`.
- Menu, Mission, and Debrief leave `t` unchanged when wall-clock advances.
- Pause on a Screen leaves `t` unchanged.

**Edge cases to cover**:
- In the field (Mission): no strategic tick and no catch-up.
- A 1-second stall must not call `advanceDays` or bulk-apply an hour of dues.
- Game clocks are not `THREE.Clock` or `THREE.Timer`.

*No Formulas-section expression. Rates are the Acceptance Criteria: 60 strategic seconds per accepted real second, and a 0.25s stall admission that yields 15 strategic seconds.*

**Estimated test count**: ~6 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts` (tick/pause/phase gating); clock-hook coverage as a unit test beside `useWorldClock`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 006
