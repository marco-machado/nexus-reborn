# Story 017: Win ETA catch-up of injury downtime

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** injury stamped at `t0` with D, and a win catch-up at `t1`, **WHEN** remaining downtime is computed, **THEN** it equals `max(0, t0 + D − t1)`. *(GDD AC 72)*
- [ ] **GIVEN** `t0 = 0`, `D = 108000`, and a win with `t1 = 172800`, **WHEN** remaining downtime is computed, **THEN** it is 0, the operative is Ready, the Squad bay stays empty, and the injury line still reports 30 hours. *(GDD AC 73)*
- [ ] **GIVEN** Injured with original `D = 108000` s, **WHEN** the debrief injury line is read (including after a win ETA catch-up), **THEN** it reports 30 hours, not remaining downtime. *(GDD AC 60)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Injury stamped at frozen `t0`; a win then advances to `t1` via `advanceDays`; remaining = `max(0, t0 + D − t1)`.
- The debrief injury line reports the original D in hours, not remaining downtime.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 018: loss and quiet-replay paths.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013, Story 016
- Unlocks: Story 018
