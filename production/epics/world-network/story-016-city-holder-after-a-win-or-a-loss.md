# Story 016: City holder after a win or a loss

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-10

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-014`
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
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN a non-quiet win, WHEN the mission city is read, THEN holder is Nexus.
- [x] GIVEN a non-quiet loss of a Nexus-held city, WHEN the city is read, THEN holder is that city's default holder.
- [x] GIVEN a quiet-replay win with mission city holder **H** at `t0`, WHEN direct outcome write-back completes (before ETA advancement), THEN holder is still **H**.
- [x] GIVEN a non-quiet loss of a Nexus-held city whose default holder is Nexus, WHEN the city is read, THEN holder stays Nexus (no-op — GDD Core Rule 9).

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

**Test file path**: `src/game/ownership.test.ts`, `src/state/worldStore.test.ts`

**What to test**:
- A non-quiet win sets the mission city's holder to Nexus.
- A non-quiet loss of a Nexus-held city sets the holder to that city's default holder.
- A quiet-replay win leaves the holder unchanged at the pre-ETA boundary.
- A non-quiet loss of a Nexus-default city (e.g. `nb`) leaves the holder Nexus.

**Edge cases to cover**:
- Quiet replay: assert only the holder here. Story 005 owns the full quiet-replay assertion (Influence, Intel, Control, Unrest).
- World Network must not read the running mission or the live roster to decide the holder. The write is the outcome DTO at debrief.

*No formula in the Formulas section for holder.*

**Estimated test count**: ~3 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/ownership.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/ownership.test.ts` (Nexus-default no-op), `src/state/worldStore.test.ts` (quiet win on a rival-held city; Nexus-default loss at the store), passing

---

## Dependencies

- Depends on: Story 003
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-10
**Criteria**: 4/4 passing (none deferred)
**Deviations**: Behaviour reversal toward GDD Core Rule 9 — a loss of a Nexus-default city was handed to the first rival (Stratos) and now stays Nexus. Requirement moved from TR-world-network-004 (Story 003's) to the new TR-world-network-014. Unreachable non-holder fallback removed from `nextCityHolder`.
**Test Evidence**: Logic: `src/game/ownership.test.ts`, `src/state/worldStore.test.ts` (full suite 668/668). Run result OBSERVED — `production/qa/evidence/story-016-city-holder/01-before-loss.png`, `02-after-loss.png` (state staged via store import, not a played mission).
**Code Review**: Complete — /code-review APPROVED WITH SUGGESTIONS; suggestions applied.
