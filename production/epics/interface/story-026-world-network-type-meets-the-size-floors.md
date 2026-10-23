# Story 026: World Network type meets the size floors

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Rule 6 legibility at 1280×720)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 17 (sizes); Accessibility "Text legible at 1280×720" (readout list, owner 2026-10-23); art bible §7.5 10 px floor.

Measured 2026-10-23 at 100%: many World Network labels render under the 10 px floor (Influence status 7 px at `src/ui/ui.css:1444`, forecast label 6.5 px, header resource labels, sector readings, chips, Control key and Timeline axis 8 px, several 8.5–9 px). The spec sets readouts ≥12 px and every other run ≥10 px; the readout list was confirmed by the owner on 2026-10-23.

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

- [ ] GIVEN the World Network at 1280×720, text scale 100%, in each state (opening desk; focused sector at each Garrison state; pressure; crisis; Review; failed campaign; first-visit card showing; Influence moment note showing) WHEN the computed font-size of every visible text node is measured THEN every run is ≥10 px, and these readout runs are ≥12 px: header resource values, sector names, CONTROL and UNREST values (rows and panel), TAX YIELD, TAX PAID and GARRISON values, contract codenames, the CLOCK SPEED value, the time code.
- [ ] GIVEN text scale 125 after the size change WHEN the World Network, Research, Brief and Assembly render at 1280×720 THEN nothing clips (overflow scrolls, P-15), including the shared header resources.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Sizes are `calc(Npx * var(--text-scale))` rules in `src/ui/ui.css` (e.g. `.wm-act-status` at :1444). Raise the base px; keep the `--text-scale` multiplier so scales 90–125 still apply.
- Larger type grows boxes: re-check no clipping at 125% (P-15 scroll, never compress a panel). The header resources are in shared chrome (`src/ui/Nav.tsx:42-46`), so their change shows on all four Screens; check the others do not clip.
- Fiction chrome (`aria-hidden`) and the DOM globe labels count as visible text.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-027 / IF-028 / IF-029 / IF-030: inks and contrast.
- IF-031 to IF-035: hit areas.

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: GAPS → revised with the owner (readout list), then ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `type-size-floors`
  - Setup: 1280×720, text scale 100%; visit each state: opening desk; focused sector at SECURE, STRAINED and CRITICAL (Control ≥55 / 35–54 / <35, `worldStore.ts:1112`); Unrest pressure (>60); crisis; Review; failed campaign; first-visit card; Influence moment note.
  - Verify: a script walks every visible text node (`getClientRects` non-empty, not `visibility:hidden`) and records the parent's computed `font-size` and a selector path; `aria-hidden` fiction chrome and the globe labels (LABELS on) count; screen-reader-only text does not.
  - Pass condition: every run ≥10 px; each listed readout run ≥12 px; the README lists the measured minimum per state and each listed readout with its measured size.
  - Edge cases: runs that exist in one state only (`REVIEW -<ago>`, `> GO LIVE`, `CRISIS` and `UNREST PRESSURE` chips, banner lines, `EXPIRY` chip, forecast chips at intel 2+) are measured in their own state (intel 2+ recorded as an extra state); re-check clipping at 125% in the README.

- **AC-2** (guard): partly covered (the 125% clipping recheck on the World Network); the other three Screens have no qa-lead case yet — `/qa-plan` adds it.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-026/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: IF-023, IF-024 (soft: settle the panel layout first)
- Unlocks: IF-025 (soft), IF-031 to IF-035 (soft)
