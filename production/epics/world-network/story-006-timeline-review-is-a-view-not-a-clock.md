# Story 006: Timeline Review is a view, not a clock

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-011`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0014: Timeline Review is a view, not a clock
**ADR Decision Summary**: worldStore.review is a session view cursor; it never writes t and is not saved.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Treating Timeline scrub as a third clock or rewinding `t`.
- Forbidden: A React-local Review pin instead of `worldStore.review`.
- Forbidden: Adding `review` to `SaveV9.world`.
- Forbidden: Reconstructing historical Control/Unrest/owners from the Feed.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN Review time and live Control C, Unrest U, owners O, `t` T, WHEN the Timeline is scrubbed, THEN live C, U, O and T are unchanged; Feed / TimeCode follow the pin; the Scan's four numbers stay live.
- [ ] GIVEN `review < t - DAY` on a tick (not paused), WHEN `tick` runs, THEN `review` snaps to `null`; `advanceDays`, hydrate and New Operation force `review: null`.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `setReview` writes only `review`; never `t`, never `advanceFlow`, never `sync(t)`, never Tax. It does not clamp — WorldMap Timeline writers (seek / nudge / Home / End) clamp to the 24h window or Live.
- The live board continues during Review (unless Pause). Review is not in `SaveV9.world`.
- Do not call `setReview` from `src/game/` or the mission scene; do not pass `worldStore.review` into `GameCanvas` `review` (`ReviewScene` is a different type).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Timeline UI chrome (Interface epic).

---

## QA Test Cases

**Test file path**: `src/state/worldStore.test.ts` (`setReview` does not move `t`, sectors, or owners; snap and force-null); `src/state/save.test.ts` (review absent from the saved world)

**What to test**:
- Scrubbing Review leaves live Control, Unrest, owners, and `t` unchanged. Feed and TimeCode follow the pin. The Scan's four numbers stay live.
- On an unpaused tick, `review < t - DAY` snaps `review` to `null`. `advanceDays`, hydrate, and New Operation force `review: null`.

**Edge cases to cover**:
- `setReview` does not write `t` and does not run `advanceFlow`. It never calls `sync(t)` or Tax.
- Do not reconstruct historical Control.
- The Review pin is not in the campaign blob.

*No formula in the Formulas section for Review.*

**Estimated test count**: ~4 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts` — setReview does not move `t`, sectors or owners; snap/force-null cases; `src/state/save.test.ts` — review absent from the saved world. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: None
