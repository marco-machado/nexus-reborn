# Story 002: Win-ETA catch-up shares advanceFlow; a loss spends none

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-002`, `TR-world-network-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0018: Catch-up collision order  
**Secondary ADRs**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: tick and advanceDays share private advanceFlow with one fixed collision order.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Bulk-applying N hours of effects at the jump instant.
- Forbidden: A per-item priority queue replacing kind-level collision.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN a win debrief, WHEN contract ETA days are spent, THEN catch-up runs the same `advanceFlow` as Screen ticking: one due at its timestamp, rearm from that due `t`, equal timestamps in ADR-0018 order (do not author a new order table).
- [ ] GIVEN a loss debrief at `t0`, WHEN debrief finishes, THEN strategic `t` stays `t0` and that debrief emits no Tax from ETA.
- [ ] GIVEN a span that contains several dues, WHEN `advanceDays` and an equivalent run of `tick` cross it, THEN both fire the same dues in the same order (shared private `advanceFlow`).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `tick` and `advanceDays` share private `advanceFlow`; fire exactly one next due process-kind at its timestamp; rearm from the due timestamp, never from now.
- Collision order: expiry → World Event → contract generation → staged spend → pressure → Tax yield.
- Tax is the implicit `else`: a seventh due added to `Math.min` without a new branch is silently Tax. A new kind needs an explicit branch and a collision-order update.
- Do not collapse the two `depositTax` sites (`advanceDays` deposits inside the Zustand `set` updater; `tick` deposits then `set`).
- Do not export `advanceFlow` or a `ProcessKind` enum; do not add a third caller that jumps `t` without `advanceFlow`.
- Any new way to advance strategic time must catch up laboratories, injuries, recruitment and Tax yield at the resulting time (ADR-0001).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: ordering of write-back vs ETA at debrief.
- Story 005: quiet-replay ETA equivalence.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts` — equal-timestamp collision cases, rearm-from-due, loss leaves `t` at `t0`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003, Story 005
