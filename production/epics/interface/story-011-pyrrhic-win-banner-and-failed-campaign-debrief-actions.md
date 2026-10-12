# Story 011: Pyrrhic win banner and failed-campaign Debrief actions

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-12

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
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [x] (AC29) GIVEN an owner-supplied pyrrhic-win outcome (Win, roster emptied, incomplete campaign) and, separately, a non-pyrrhic Win, WHEN Debrief is shown, THEN the pyrrhic fixture shows the CAMPAIGN FAILED banner above the invoice, first and visually dominant, and the invoice note reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` with the owner-supplied full net payout unchanged; the non-pyrrhic fixture shows neither. Failure and payout values are not recomputed in Interface.
  - *Observable meaning of "first and visually dominant"* (benchmark for this story):
    - The CAMPAIGN FAILED banner is the first element inside `.db-card`. It comes before the `db-tag` line, the title and the `.db-rows` invoice.
    - Its text is the literal `CAMPAIGN FAILED`, so it doesn't rely on color alone. It uses `RED` / `RED_A*` from `src/ui/tokens.ts`, with no new hex values.
    - Its font size is greater than or equal to the `.db-title` font size.
    - At 1280×720, at every text scale, the banner is fully visible without scrolling, clipping or truncation.
    - The retained screenshots for each fixture under `production/qa/evidence/` (named `if-011-<fixture>-1280x720`) show this.
- [x] (AC30) GIVEN a Debrief on a failed campaign (separate fixtures: pyrrhic win on an authored contract; loss on an authored contract that empties the roster), WHEN the Debrief actions are read, THEN no Replay control is present and World Network return is available. GIVEN a non-failed authored Debrief, THEN Replay is present.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- CAMPAIGN FAILED banner sits above the invoice, first and visually dominant; invoice note reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`.
- Replay is absent on a failed campaign (read `campaignFailed`, do not derive from `operatives.length === 0`).
- **Where the pyrrhic signal comes from (owner-supplied, read-only):**
  - `campaignFailed` is written by `campaignStore.reportMission` (`src/state/campaignStore.ts:268`). It runs inside `applyDebrief` (`src/state/debrief.ts:21`), which Debrief calls in a `useLayoutEffect`.
  - Read it with a primitive selector: `useCampaignStore((s) => s.campaignFailed)`. Zustand re-renders before paint, so the first painted Debrief already shows the post-apply flag.
  - Pyrrhic = `outcome.won && campaignFailed`. A completed campaign that loses its roster stays `campaignWon` and not failed (ADR-0020), so it shows no banner.
  - Don't call `isCampaignFailed` from Interface, and don't derive the state from `operatives.length` or `outcome.deadIds`.
- **Payout:** On a pyrrhic win the invoice keeps `netPayout(outcome)` unchanged. Only the note line changes, to `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`.
- **Loss on a failed campaign (AC30, second fixture):** Show the CAMPAIGN FAILED banner. The pyrrhic note is win-only. Replay is hidden whenever `campaignFailed` is true. The gate at `src/ui/index.tsx:1641` becomes `missionId && !isGeneratedMissionId(missionId) && !campaignFailed`.
- **Fixtures:** The repo has no DOM test harness (vitest only, no jsdom or testing-library).
  - Pull the decision into a pure helper in `src/ui/`, e.g. `debriefFlags(outcome, campaignFailed, generated)` → `{ banner, pyrrhicNote, replay }`. Unit-test it for the pyrrhic win, the non-pyrrhic win, the failed loss and the non-failed authored loss.
  - Seed the screenshot fixtures by setting `appStore.outcome` and `campaignStore` state in the dev console before entering Debrief.

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
- Unit: `src/ui/debriefFlags.test.ts` covers AC29/AC30 flag decisions across the four fixtures.

**Status**: [x] `src/ui/debriefFlags.test.ts` (9 tests) and `production/qa/evidence/if-011/` (13 screenshots + README click-through note)

---

## Dependencies

- Depends on: Story 009
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-12
**Criteria**: 2/2 passing (AC29, AC30)
**Deviations**: None. Advisory: `.db-failed` uses the `rgba(224, 75, 60, …)` values of `RED_A18`/`RED_A7` and `var(--red-hot)` directly in `ui.css`, matching existing rules there; no new colour values. `.db-card` now caps at screen height and `.db-rows` scrolls internally, so at text scale 125 PAYOUT/NOTE sit below the fold (banner, title and actions stay visible).
**Test Evidence**: UI: retained screenshots in `production/qa/evidence/if-011/` (opened: pyrrhic-win, failed-loss, win at 1280×720); unit: `src/ui/debriefFlags.test.ts` passes (9/9), `tsc -b` clean.
**Code Review**: Pending — run `/code-review` on `src/ui/debriefFlags.ts src/ui/debriefFlags.test.ts src/ui/index.tsx src/ui/ui.css` before sprint close-out (lean mode, not yet run).
