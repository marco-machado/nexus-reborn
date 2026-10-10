# Story 022: Invoice prints all five money lines, zeros included

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Omitting a zero money line.
- Forbidden: Computing collateral in the component.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Economy has priced Reward 0, optional bonus 0, Collateral 0, net payout 0 and new balance C, WHEN Interface builds the invoice, THEN those five lines are present (not omitted).
- [ ] GIVEN a loss, stored Reward 85,000 CR, Collateral 10,000 CR, optional bonus 0, `net_payout = 0`, new balance C, THEN Reward 85,000 CR is present and all five money lines are present.
- [ ] GIVEN a quiet-replay win, stored Reward 62,000 CR, optional bonus 0, Collateral 0, `net_payout = 0`, new balance C, THEN Reward 62,000 CR is present and all five money lines are present.
- [ ] GIVEN a non-quiet win, N = 0, Collateral 0 CR, THEN the Collateral 0 CR line is present (not omitted).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Debrief renders the stored priced outcome (`MissionOutcome`); it prices nothing itself. Interface owns presentation, Economy owns the numbers.
- Do not fork a second show-rule for zero rows (GDD Closed Question 3).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic owns Debrief layout and copy.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008, Story 009, Story 010
- Unlocks: None
