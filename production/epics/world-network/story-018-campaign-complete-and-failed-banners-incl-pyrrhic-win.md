# Story 018: Campaign complete and failed banners, incl. pyrrhic win

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: 1.0 d
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
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

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

From `/qa-plan` sprint 2 (2026-10-12). Integration, secondary UI. State tests: `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`. Pyrrhic Debrief regression: `src/ui/debriefFlags.test.ts`.

- Glass Veil, Hollow Crown, and Rust Haven all won: campaign-complete is set, and `selectMission` still selects each of the three.
- Campaign incomplete and living roster 0 after debrief: campaign-failed is set, and `selectMission` is a no-op.
- The two flags are not both true. Do not export a `CampaignStatus` enum. Do not read the live roster; use the outcome DTO.
- Pyrrhic Debrief stays the IF-011 regression: CAMPAIGN FAILED first, full net payout, note `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`, mission grades a Win. Do not add a second banner implementation.
- Screenshots at 1280×720 in `production/qa/evidence/wn-018/` for the World Network complete and failed banners. Compare the pyrrhic Debrief to `production/qa/evidence/if-011/` unless Debrief code changed. Click-through note per `docs/click-through.md`.

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
