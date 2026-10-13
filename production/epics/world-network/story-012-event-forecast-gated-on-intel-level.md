# Story 012: Event forecast gated on Intel level

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Duplicating forecast weights in the UI.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN intel 1, WHEN the focused sector panel is read, THEN Event forecast is not shown.
- [ ] GIVEN intel 2+, WHEN the focused sector panel is read, THEN Event forecast lists riot, blackout, raid, trade and seizure chances for the next 6 strategic hours using the same weights the generator rolls (formulas stay in GDD §5 / `forecast.ts` — do not copy).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Reuse `src/game/forecast.ts`; the panel must not duplicate weights.
- Select primitives or use `useShallow` in store selectors — never build a new object in a selector (Zustand 5 loops).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: how Intel is earned.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). UI. No automated test file. Screenshots at 1280×720 in `production/qa/evidence/wn-012/`. Sign-off: qa-lead. Click-through note per `docs/click-through.md`.

- Intel 1: the focused sector panel does not show Event forecast.
- Intel 2 or higher: Event forecast lists riot, blackout, raid, trade, and seizure chances for the next 6 strategic hours.
- Printed chances equal `src/game/forecast.ts` for that sector and time. Do not copy the weights into the panel or into this story.
- Nothing clips or truncates at 1280×720.
- Verify after story 011. This header lists no dependency; the sprint sequences 011 first.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 011
