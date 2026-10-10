# Story 018: Loss and quiet-replay debrief roster apply

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0004: A won contract does not pay twice  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: quiet replay skipping roster writes.
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** a quiet-replay win with `deadIds`, living `f` in (0, 0.35), and survivors, **WHEN** debrief applies, **THEN** KIA, injury (bay clear + D), Experience +1 per survivor, and ETA `t1` catch-up all still apply. *(GDD AC 74)*
- [ ] **GIVEN** a loss debrief that recorded injury at `t0` with duration D, **WHEN** that debrief finishes, **THEN** no ETA `t1` jump runs and remaining downtime is still D. *(GDD AC 24)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Quiet replay zeros payout only; KIA, injury, Experience and the ETA catch-up still apply (ADR-0004).
- A loss spends no strategic days: no `t1` jump, downtime stays D.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 013, Story 015, Story 017
- Unlocks: None
