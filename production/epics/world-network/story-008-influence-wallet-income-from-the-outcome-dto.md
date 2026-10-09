# Story 008: Influence wallet income from the outcome DTO

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income  
**Secondary ADRs**: ADR-0004: A won contract does not pay twice
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: An Influence index / standing bar derived from Control.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a new campaign, WHEN Influence is read, THEN it is 0.
- [ ] GIVEN Influence 0, a non-quiet win, `civiliansHit ≥ 1`, WHEN World Network applies the outcome DTO, THEN Influence = 6.
- [ ] GIVEN Influence 0, a non-quiet win, `civiliansHit = 0`, WHEN World Network applies the outcome DTO, THEN Influence = 8.
- [ ] GIVEN Influence I, a loss, WHEN World Network applies the outcome DTO, THEN Influence = I.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Influence is a spendable wallet — points, not an index or standing bar, and not an average of Control.
- Tax yield pays Nexus income; Influence never does.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009/010: spending Influence.

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

- Depends on: Story 003
- Unlocks: Story 009, Story 017
