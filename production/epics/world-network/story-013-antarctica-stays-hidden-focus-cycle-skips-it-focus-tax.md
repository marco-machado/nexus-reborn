# Story 013: Antarctica stays hidden; Focus cycle skips it; Focus Tax figure prints

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-007`, `TR-world-network-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0008: Influence is a wallet; tax is Nexus income
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Offering any sector verb for Antarctica.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN intel 1, WHEN Scan, Focus cycle and sector readout are read, THEN Antarctica prints no Control, Unrest, Tax yield or Garrison condition; Focus never selects it; Stabilize / Lobby / Expedite are not offered for it; Scan land is Unknown.
- [ ] GIVEN intel ≥ 2, WHEN those surfaces are read, THEN the same Antarctica behaviour holds.
- [ ] GIVEN Focus on opening Europe, WHEN Tax yield is read, THEN a figure prints and that sector does not pay.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Six sectors are open; Antarctica is locked at every Intel level.
- The printed Tax figure is informational; paying is decided by Story 007's rule.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: Tax emission logic.

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

- Depends on: Story 007
- Unlocks: None
