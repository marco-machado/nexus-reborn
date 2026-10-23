# Story 027: Ink Dim text on the World Network moves to Ink

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Rule 4 colour roles; Standard accessibility tier)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 17 (owner 2026-10-23: Ink Dim text moves to Ink, no new dim token); Accessibility → Contrast.

Ink Dim (`#5d7d75`) text measures 4.29–4.48:1 composited on the panel in default mode, under the 4.5:1 floor. The owner ruled on 2026-10-23 that those runs move to Ink (`#b8d8cf`, 12.27:1 or better); the dim-versus-bright hierarchy rests on size and weight instead. The `--ink-dim` token stays for other Screens.

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

- [x] GIVEN the World Network in default mode WHEN every text run that used Ink Dim (spec Contrast table) is measured as rendered THEN it uses Ink and reaches ≥4.5:1; no World Network text run renders in Ink Dim.
- [x] GIVEN Research, Brief and Assembly WHEN rendered THEN their text colours are unchanged: `--ink-dim` is unchanged in `src/index.css` and `src/ui/tokens.ts`, and any `.dim` / `.chip.dim` change is scoped to World Network selectors.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Targets (spec Contrast table): sector reading and CONTROL/UNREST labels; key-value labels and the `TAX PAID NO` value; Influence status words; forecast label and gate; contract `TYPE // CITY` and chips; `CLOCK SPEED`; Control key names; subtitle; Scan fiction chrome.
- `.chip.dim` (`src/ui/ui.css:182`) and `.dim` are shared by other Screens: scope the change to World Network selectors (e.g. under `.wm-*`) so other Screens do not change. IF-029 also needs the locked-row chips at Ink; whichever story lands first makes the chip change, the other reuses it.
- Do not edit `--ink-dim` in `src/index.css` or `tokens.ts`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-029: locked rows (frame dim, reason text, and their chips as rendered).
- IF-028: Ink Faint runs.
- IF-030: nav tab labels.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `ink-dim-removed`
  - Setup: default mode; opening desk, a focused sector, an open contract row, and the Scan chrome.
  - Verify: script a sweep of every text node (computed colour, effective opacity, ratio as rendered).
  - Pass condition: no World Network text run has colour `rgb(93,125,117)`; each former Ink Dim run is Ink `rgb(184,216,207)` and ≥4.5:1 as rendered.
  - Edge cases: disabled Influence status words; `--ink-dim` unchanged in `index.css` and `tokens.ts`; other Screens unchanged (any `.dim` / `.chip.dim` change scoped to World Network selectors). Locked rows are IF-029's.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-027/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

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
**Implementation**: Scoped token override `.wm { --ink-dim: var(--ink); }` (`--ink-dim` unchanged for other Screens; verified by the four-Screen sweep).
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
