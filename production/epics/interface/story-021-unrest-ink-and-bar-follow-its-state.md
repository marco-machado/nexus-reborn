# Story 021: Unrest ink and bar follow its state

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.2 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Rule 4 colour roles)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 2 (owner 2026-10-23: calm Ink, pressure notice tone, crisis Red Hot; the Focus-panel bar follows); States & Variants "Sector under unrest pressure".

Red is danger. As built, the Focus panel prints the Unrest value in red and draws its bar red in every state (`src/ui/WorldMap.tsx:972-973`). The sector row already switches red / notice / default by crisis and pressure (:927). The owner ruled on 2026-10-23: calm Unrest prints Ink, past the pressure line the notice tone, in crisis Red Hot, and the bar follows the same three states.

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

- [ ] GIVEN a sector row and the Focus panel WHEN Unrest is calm (≤ `PRESSURE_UNREST_MIN`, not in crisis) / past the pressure line / in crisis THEN the Unrest value prints in Ink / the Print White notice tone / Red Hot respectively, each ≥4.5:1 as rendered, and the Focus-panel Unrest bar takes the matching tone.
- [ ] GIVEN a sector in crisis whose Unrest has fallen back under the pressure line (hysteresis) WHEN rendered THEN the value and bar stay Red Hot (crisis wins over pressure), and the `UNREST PRESSURE` chip shows on the sector row only.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Focus panel: `src/ui/WorldMap.tsx:972` `<b className="red">` and :973 `<SegBar ... tone="red" mini />`. Compute the state once (crisis wins over pressure) and use it for both.
- `SegBar` (`src/ui/bits.tsx:113`) accepts `tone?: 'amber' | 'red' | 'green'`; a calm default needs no tone, a notice tone must be added (CSS variable from the palette pair in `src/index.css` / `src/ui/tokens.ts`, not a new hex).
- Sector row (:927) prints calm Unrest with no class: make it explicitly Ink so the calm ink does not depend on inheritance.
- Pressure line: `PRESSURE_UNREST_MIN` (60) from `src/game/` via the import at :25; crisis is the owner's `crisis` list (hysteresis per living §5).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-020: Garrison.
- The `UNREST PRESSURE` and `CRISIS` chips (unchanged; the pressure chip sits on the row only).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE (bar clause added by owner ruling after the gate; covered by the same Setup and states)). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `unrest-ink-states`
  - Setup: seed a sector at Unrest 60 (`PRESSURE_UNREST_MIN`), 61, in crisis, and in crisis with Unrest back below the entry threshold (hysteresis).
  - Verify: read the computed colour of the Unrest value in the sector row and the Focus panel, and the Focus-panel bar's fill; note the chips; compute the ratios.
  - Pass condition: calm (≤60, not in crisis) is Ink `rgb(184,216,207)`; pressure is Print White with the `UNREST PRESSURE` chip on the row; crisis is Red Hot with the `CRISIS` chip; each value ≥4.5:1 on both surfaces; the bar's tone matches the value's state.
  - Edge cases: the pressure chip sits on the row only (the Focus panel changes tone only); crisis wins over pressure; Antarctica prints none.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-021/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
