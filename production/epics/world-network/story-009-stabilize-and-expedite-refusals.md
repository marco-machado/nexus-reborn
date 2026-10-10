# Story 009: Stabilize and Expedite refusals

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Expedite writing Intel.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN Influence 7, WHEN Stabilize (cost 8) is activated, THEN the spend is refused and Influence stays 7.
- [ ] GIVEN Influence ≥ 8 and Stabilize on cooldown, WHEN Stabilize is activated, THEN the spend is refused and Influence is unchanged.
- [ ] GIVEN no generated target, WHEN Expedite is activated, THEN it is blocked and Influence is unchanged.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- A refused spend must not mutate Influence, cooldown or staged spends, and must not call `setState` for a no-op.
- Expedite does not write Intel (ADR-0012).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: what an accepted Stabilize does over time.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/influence.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 008
- Unlocks: Story 010
