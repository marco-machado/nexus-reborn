# Story 018: Campaign complete and failed banners, incl. pyrrhic win

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: Empty incomplete living roster sets campaignFailed; a completed campaign stays complete; the two flags cannot both be true.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: Replacing `campaignWon` / `campaignFailed` with an enum.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN Glass Veil, Hollow Crown and Rust Haven all won, WHEN World Network is shown, THEN the campaign-complete banner is posted and all three remain selectable (not locked).
- [ ] GIVEN campaign not complete and living roster count 0 after debrief, WHEN World Network is shown, THEN the campaign-failed banner is posted and contract select is a no-op.
- [ ] GIVEN a pyrrhic win (same-step tiebreak Win that empties the roster on an incomplete campaign), WHEN the debrief is shown, THEN the CAMPAIGN FAILED banner takes precedence, the invoice still prints the full net payout with the `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` note, and the mission grades a Win.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `selectMission` no-ops when `campaignFailed`. Flag writes stay in `reportMission`.
- Do not export a `CampaignStatus` enum; keep the two booleans.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 019: flag edge cases and persistence.

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

- Depends on: Story 003
- Unlocks: Story 019
