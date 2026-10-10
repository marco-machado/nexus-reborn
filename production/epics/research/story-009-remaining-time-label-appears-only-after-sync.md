# Story 009: Remaining time label appears only after sync

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Painting 0, or painting before sync.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN a running lab with endT = 7200 and strategic t = 1000, WHEN remaining time is read after sync(1000), THEN it is 6200 strategic seconds, labeled remaining, not the catalog duration; GIVEN the project is researched, THEN there is no countdown.
- [ ] GIVEN a project still active with endT = 7200, WHEN the remaining function is queried at t = 7200 and at any t > 7200 before the matching sync, THEN it returns none, not 0. (This formula-oracle query is allowed and is not a screen paint.)
- [ ] GIVEN the Research screen rendered with an active 2h project (startedT = 0, endT = 7200) at t = 7199 before any sync (lastSyncT unset or older), WHEN the DOM is queried by the remaining label's test selector, THEN no remaining label exists; WHEN sync(7199) runs and the DOM is re-queried, THEN the label reads 1 (endT − t rounded up) and lastSyncT === 7199.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The screen paints remaining only after `sync(t)` for that same t and must never paint 0. Paint format (raw seconds vs H:MM:SS) is an Interface decision; assert the numeric value under the stated format.
- `progress` is not a Research output.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic owns Research screen layout.

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

- Depends on: Story 008
- Unlocks: None
