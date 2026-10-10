# Story 016: Injury recovery on strategic sync

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
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Forbidden: catch-up running before debrief write-back.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** Injured with `recoverAtT = T`, **WHEN** a strategy Screen tick (including Assembly) reaches `t ≥ T`, **THEN** the operative is Ready and the cleared Squad bay stays empty. *(GDD AC 40)*
- [ ] **GIVEN** an Injured operative whose recovery completes, **WHEN** they become Ready, **THEN** the Squad bay cleared at injury stays empty. *(GDD AC 22)*
- [ ] **GIVEN** Injured with `recoverAtT = T` and a candidate due at T with market count N just before that sync, **WHEN** `sync(T)`, **THEN** the operative is Ready and market count is `min(3, N + 1)`. Both dues complete in that sync; apply order is unspecified. *(GDD AC 78)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `campaignStore.sync(t)` runs after `t` advances (ADR-0018), from any strategy Screen tick including Assembly.
- Recovery sets Ready but never re-fills the bay cleared at injury.
- Recovery and a due candidate in the same sync both complete; apply order is unspecified — do not assert one.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 022: market cadence itself.

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

- Depends on: Story 010, Story 013
- Unlocks: Story 017
