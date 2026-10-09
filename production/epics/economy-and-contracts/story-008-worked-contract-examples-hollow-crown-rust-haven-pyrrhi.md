# Story 008: Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-007`, `TR-economy-011`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Docking pay for a squad wipe on a Win.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a non-quiet Hollow Crown win, Reward 62,000 CR, 13 unique squad first-hits and optional complete (+9,000 CR), THEN Collateral = 62,000 CR and `net_payout = 9,000 CR`.
- [ ] GIVEN a non-quiet Rust Haven win at opening Standard, Reward 41,000 CR, 8 unique squad first-hits and optional ignored, THEN Collateral = 40,000 CR and `net_payout = 1,000 CR`.
- [ ] GIVEN a pyrrhic win (tiebreak Win that empties the roster on an incomplete campaign), non-quiet, Reward 85,000 CR, N = 0, THEN `net_payout = 85,000 CR` (full pay).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Use the authored contract values from `src/game/contracts.ts`; assert the GDD figures, not re-derived constants.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: formula arithmetic.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 007
- Unlocks: None
