# Story 017: Opening desk and post-win Scan

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Resolving the arrival-failure open question inside this story.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN New Operation on World Network, WHEN the first minute is observed without selecting a contract, THEN Focus can change among the six open sectors, four numbers print, Pause/speed change whether `t` advances, and contract select is not the only enabled verb.
- [ ] GIVEN a non-quiet win at frozen `t0`, WHEN direct outcome write-back completes at an instrumented boundary before ETA advancement, THEN the mission-result Feed event is appended at `t0`, and awards and sector effects follow the outcome rules. (Not a player-visible World Network screen.)
- [ ] GIVEN a first clean non-quiet win starting with Influence 0, WHEN full Debrief write-back and ETA finish and World Network is displayed before another Screen tick, with no other Influence spend or award, THEN the header visibly reads Influence 8 and Scan presents the post-ETA live board.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- The GDD Open Question on arrival failure (“I did not know what to do”) is unclassified by the owner. This story verifies only the stated opening-desk criteria — do not change Core Rule 13 (first-visit overlay) or the desk here.
- Name the screens exercised in the retained click-through evidence (docs/click-through.md).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: Influence income rules.
- Story 003: apply order.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module under `src/state/` / `src/game/` for the state half, plus a retained screenshot of each screen touched in `production/qa/evidence/` and the named click-through (docs/click-through.md).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, Story 008
- Unlocks: None
