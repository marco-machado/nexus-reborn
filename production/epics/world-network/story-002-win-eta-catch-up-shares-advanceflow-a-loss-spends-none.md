# Story 002: Win-ETA catch-up shares advanceFlow; a loss spends none

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-10

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

- [x] GIVEN a win debrief, WHEN contract ETA days are spent, THEN catch-up runs the same `advanceFlow` as Screen ticking: one due at its timestamp, rearm from that due `t`, equal timestamps in ADR-0018 order (do not author a new order table).
- [x] GIVEN a loss debrief at `t0`, WHEN debrief finishes, THEN strategic `t` stays `t0` and that debrief emits no Tax from ETA.
- [x] GIVEN a span that contains several dues, WHEN `advanceDays` and an equivalent run of `tick` cross it, THEN both fire the same dues in the same order (shared private `advanceFlow`).

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

**Test file path**: `src/state/worldStore.test.ts`

**What to test**:
- A win spends contract ETA through the same `advanceFlow` as Screen `tick`: one due at its timestamp, rearm from that due `t`, equal timestamps in ADR-0018 order. Do not assert a second order table.
- A loss debrief at `t0` leaves strategic `t` at `t0` and emits no Tax from ETA.
- A span with several dues: `advanceDays` and an equivalent run of `tick` fire the same dues in the same order.

**Edge cases to cover**:
- Two dues at one timestamp: expiry, then World Event, then contract generation, then staged spend, then pressure, then Tax yield. Tax at that `t` reads Control after pressure.
- Do not bulk-apply N hours of effects at the jump instant.
- A loss spends no ETA.

*No formula in the Formulas section. Collision order is the ADR-0018 list above. Do not author a new one.*

**Estimated test count**: ~5 unit tests

*Source: `production/qa/qa-plan-sprint-001-2026-10-09.md`*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/worldStore.test.ts` — equal-timestamp collision cases, rearm-from-due, loss leaves `t` at `t0`. — must exist and pass.

**Status**: [x] Created — `src/state/worldStore.test.ts` (7 new tests in "catch-up collision order (ADR-0018)")

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 003, Story 005

---

## Completion Notes
**Completed**: 2026-10-10
**Criteria**: 3/3 passing (all covered by tests in `src/state/worldStore.test.ts`, describe "catch-up collision order (ADR-0018)")
**Deviations**: None. No production code changed; `advanceFlow` in `src/state/worldStore.ts` already implemented the shared catch-up. Advisory test-quality findings logged as TD-005..TD-007 in `docs/tech-debt-register.md`.
**Test Evidence**: Logic: test file at `src/state/worldStore.test.ts` (7 new tests). Lint, test (624/624) and build re-run and passing on 2026-10-10.
**Code Review**: Complete via `/code-review` (lean mode, unattended): no blocking findings. Formally NOT ASSESSED rather than APPROVED because no specialist reviewers were spawned.
**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: win ETA catch-up runs `advanceFlow` in ADR-0018 order | worldStore.test.ts::"an ETA jump fires each due at its timestamp and rearms from that due t", the equal-timestamp cases | COVERED |
| AC-2: loss leaves `t` at `t0`, no Tax from ETA | worldStore.test.ts::"a loss debrief at t0 leaves strategic t at t0 and emits no Tax from ETA" (UI part is a structural source check, see TD-007) | COVERED |
| AC-3: `advanceDays` and a run of `tick` fire the same dues in order | worldStore.test.ts::"advanceDays and a run of ticks fire the same mixed dues in the same order" | COVERED |
**Automation decisions (unattended run)**: Phase 5 lean code-review prompt answered "Yes — /code-review ran"; Phase 7 chose "Close and log advisory deviations as tech debt".
