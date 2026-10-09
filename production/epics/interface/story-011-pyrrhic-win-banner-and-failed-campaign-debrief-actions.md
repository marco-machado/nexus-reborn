# Story 011: Pyrrhic win banner and failed-campaign Debrief actions

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0020: Campaign fail flags  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: campaignFailed and campaignWon are two booleans; a completed campaign survives a roster wipe.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Debrief paints owner-supplied values; failure and payout are not recomputed in Interface.
- Required: Critical state is never color-only.
- Forbidden: payout celebration sting.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC29) GIVEN an owner-supplied pyrrhic-win outcome (Win, roster emptied, incomplete campaign) and, separately, a non-pyrrhic Win, WHEN Debrief is shown, THEN the pyrrhic fixture shows the CAMPAIGN FAILED banner above the invoice, first and visually dominant, and the invoice note reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` with the owner-supplied full net payout unchanged; the non-pyrrhic fixture shows neither. Failure and payout values are not recomputed in Interface.
- [ ] (AC30) GIVEN a Debrief on a failed campaign (separate fixtures: pyrrhic win on an authored contract; loss on an authored contract that empties the roster), WHEN the Debrief actions are read, THEN no Replay control is present and World Network return is available. GIVEN a non-failed authored Debrief, THEN Replay is present.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- CAMPAIGN FAILED banner sits above the invoice, first and visually dominant; invoice note reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`.
- Replay is absent on a failed campaign (read `campaignFailed`, do not derive from `operatives.length === 0`).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- GDD AC24 (invoice fixtures show all five money lines, zeros included) is covered by economy-and-contracts story 022 — not duplicated here.

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

- Depends on: Story 009
- Unlocks: None
