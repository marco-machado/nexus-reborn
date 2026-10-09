# Story 016: City holder after a win or a loss

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Writing the holder anywhere but the debrief apply.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a non-quiet win, WHEN the mission city is read, THEN holder is Nexus.
- [ ] GIVEN a non-quiet loss of a Nexus-held city, WHEN the city is read, THEN holder is that city's default holder.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Ownership logic lives with `src/game/ownership.ts`; the write is applied at debrief via `applyMissionResult`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: Control/Unrest shove.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/ownership.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: None
