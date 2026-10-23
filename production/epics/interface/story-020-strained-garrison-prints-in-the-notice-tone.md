# Story 020: STRAINED Garrison prints in the notice tone, not amber

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Rule 4 colour roles)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 2; Accessibility "Color roles" (art bible §4.2: Ledger Amber is money only).

The Garrison word prints `SECURE` teal, `STRAINED` amber, `CRITICAL` red. Ledger Amber is money only, so `STRAINED` takes the Print White notice tone. The word already carries the state; this is a colour-role correction, not an accessibility fix.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: One palette, dual-owned by `src/index.css` `:root` and `src/ui/tokens.ts`; high contrast remaps CSS variables only; DOM Screens must work at 1280×720 without clipping or truncation; critical state is never color-only; keyboard and mouse, desktop only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH (ADR-0017 Knowledge Risk: training cutoff before the pin)
**Engine Notes**: DOM and CSS only; ADR-0017 uses no post-cutoff APIs. Do not use React 19.2 `<Activity>` / `useEffectEvent` to hide state.

**Control Manifest Rules (this layer)**:
- Required: named colours are dual-owned by `src/index.css` `:root` and `src/ui/tokens.ts`; a palette change touches both files and nothing else. Neutral white/black tints are the only hex/rgba literals allowed.
- Required: Screens work at 1280×720 without clipping or truncation; critical state is never color-only.
- Forbidden: a second palette runtime or CSS-in-JS palette; runtime-reading CSS into `tokens.ts`; gamepad or touch.
- Guardrail: `:root.s-high-contrast` remaps CSS variables only. Per-frame data stays out of React state (header and rows subscribe at hour or rounded-value resolution).

---

## Acceptance Criteria

*From `design/ux/world-network.md` (Approved 2026-10-23), scoped to this story (story granularity `fine`: one criterion, plus guard criteria added by the owner on 2026-10-23 to meet the `/story-readiness` minimum; each guard is drawn from the spec or the qa-lead's edge cases):*

- [x] GIVEN a focused sector WHEN Garrison is `SECURE` / `STRAINED` / `CRITICAL` THEN the word prints in teal / the Print White notice tone / Red Hot respectively, and the amber class is never used for Garrison.
- [x] GIVEN the World Network viewed in grayscale WHEN Garrison is `SECURE`, `STRAINED` or `CRITICAL` THEN the word alone tells the state, and Credits still print in Ledger Amber.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- `src/ui/WorldMap.tsx:986`: `read.garrison === 'SECURE' ? 'teal' : read.garrison === 'STRAINED' ? 'amber' : 'red'`. Swap `amber` for the existing `.notice` class (`src/ui/ui.css:471`, `color: var(--print-white)`).
- Bands come from `src/state/worldStore.ts:1112`: Control ≥55 SECURE, 35–54 STRAINED, <35 CRITICAL.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-021: the Unrest value and bar.
- Credits stay amber (money).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `garrison-tones`
  - Setup: seed the focused sector's Control at the boundaries 55, 54, 35 and 34.
  - Verify: read the computed colour and class of the Garrison value.
  - Pass condition: SECURE is teal `rgb(126,240,212)`; STRAINED is Print White `rgb(232,251,242)` (`notice`); CRITICAL is Red Hot `rgb(255,107,85)`; no `amber` class on the Garrison element in any state.
  - Edge cases: Credits stay amber; Antarctica prints no Garrison.

- **AC-2** (guard) — added by `/qa-plan` 2026-10-23:
  - Setup: the three Garrison states; apply `filter: grayscale(1)` to the page (or capture and desaturate).
  - Verify: read the Garrison slot in each grayscale capture; read the header Credits colour without the filter.
  - Pass condition: each state is told apart by its word alone (`SECURE` / `STRAINED` / `CRITICAL` present and legible); Credits compute to Ledger Amber `rgb(255,208,117)`.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-020/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [x] Created — `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720)

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: all passing (AC-1 and guards; none deferred)
**Implementation**: `notice` replaces `amber` on STRAINED.
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
