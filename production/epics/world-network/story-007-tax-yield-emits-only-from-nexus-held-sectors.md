# Story 007: Tax yield emits only from Nexus-held sectors

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income  
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: A Tax path that bypasses `advanceFlow`.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a Nexus-held sector with printed `tax_yield` A CR (`A = round(base × Control/100 × strain)` per GDD §5), WHEN a Tax due fires, THEN Economy is emitted A CR.
- [ ] GIVEN Contested, WHEN a Tax due fires, THEN emit 0.
- [ ] GIVEN a non-Nexus majority holder, WHEN a Tax due fires, THEN emit 0.
- [ ] GIVEN opening North America (Nexus, 68% Control, 12% Unrest), WHEN a Tax due fires, THEN emit 4,080 CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Tax yield is computed by World Network and emitted to Economy; only Nexus-held sectors pay.
- Formula and constants live in GDD §5 / code; do not copy numbers beyond the acceptance examples.
- Tax is the implicit `else` in `advanceFlow` — keep it the last collision-order kind.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: the printed Focus figure on a non-paying sector.

---

## QA Test Cases

**Test file path**: `src/game/ownership.test.ts` and `src/state/worldStore.test.ts` (Nexus, Contested, non-Nexus, and the 4,080 CR opening case)

**What to test**:
- `tax_yield = round(base × Control/100 × strain)`. `round` is nearest-integer, half ties toward +∞ (`Math.round`).
- A Nexus-held sector emits printed A CR when a Tax due fires.
- Contested emits 0. A non-Nexus majority holder emits 0.
- Opening North America (Nexus, 68% Control, 12% Unrest) emits 4,080 CR, which is `round(6000 × 68/100 × 1)`.

**Edge cases to cover**:
- Strain is 1 at unrest ≤ 60; otherwise `1 − 0.02` per unrest point above 60, floored at 0.25. Unrest is clamped 2–96, so at 96 strain is 0.28 and the 0.25 floor does not bind. Do not retune the floor in this test.
- Opening Europe (Helix): a figure may print and that sector does not pay.
- Economy deposits only an emit where A > 0. A non-positive emit leaves Credits unchanged.
- Tax prints for every open sector and pays only if Nexus-held.

**Estimated test count**: ~6 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/ownership.test.ts` / `src/state/worldStore.test.ts` — table test for Nexus, Contested, non-Nexus, and the 4,080 CR opening case. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 013
