# Story 035: Remaining World Network pointer targets meet 24×24

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Standard accessibility tier)
**Requirement**: `TR-interface-???` — **no TR registered for hit-target size.** Source: WCAG 2.2 SC 2.5.8 (AA, 24×24 CSS px), owner decision 2026-10-23, spec Open Question 21 and Input checklist. **Owner waiver 2026-10-23 (Sprint 11 planning): this story proceeds without a registered TR; register it at a later `/architecture-review`.**
*(no registry entry yet)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 21 (owner 2026-10-23: WCAG 2.2 SC 2.5.8, 24×24 CSS px); Input checklist hit-target table.

Only four targets were measured for the spec. The owner added this story on 2026-10-23 for the rest: Pause/Resume, `n UNREAD`, `> GO LIVE`, the Scan view controls, the imagery credit link, both `UNDERSTOOD` buttons and the nav tabs. The visible glyph may stay smaller; the hit area carries the size (spec Input checklist).

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

- [ ] GIVEN the World Network at 1280×720, text scale 100% WHEN Pause/Resume, `n UNREAD`, `> GO LIVE`, the Scan view controls (zoom, HOME, FOCUS SECTOR, SOUTH POLE, LABELS), the imagery credit link, `UNDERSTOOD` on the first-visit card and on the Influence moment note, and the four nav tabs are measured THEN each hit area is ≥24×24 CSS px, or meets a WCAG 2.2 SC 2.5.8 exception (spacing, equivalent, inline) named in the evidence with its measurement.
- [ ] GIVEN the enlarged targets WHEN measured THEN no hit area overlaps a neighbouring target (transport row, globe toolbar, nav).

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- `> GO LIVE`: the whole `.wm-live.review` button (`src/ui/WorldMap.tsx:514`) is the target. `n UNREAD` at :715. View controls are `.globe-toolbar` buttons and the credit link `.globe-credit` in `src/ui/WorldGlobe.tsx` (~:460-474). Nav tabs are `src/ui/Nav.tsx` (shared by all four Screens).
- `FEED CLEAR` is a non-interactive `<span>` as built (:707): not a pointer target.
- The credit link stands alone, so the inline exception probably does not apply; prefer enlarging it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-031 to IF-034: Feed rows, Timeline, speed buttons, steppers.
- Scan markers: exempt by the equivalent-control exception.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `remaining-hit-targets`
  - Setup: 1280×720, text scale 100%; show each conditional target: Review off NOW (`> GO LIVE`), an unread event (`n UNREAD`), New Operation (card `UNDERSTOOD`), an action affordable for the first time (note `UNDERSTOOD`).
  - Verify: `getBoundingClientRect` of each target (nav tabs on all four Screens, Brief locked and unlocked); for any under 24×24, test the spacing exception (a 24 px circle centred on the target intersects no other target or circle).
  - Pass condition: each target ≥24×24 CSS px, or the README names its exception (spacing, equivalent — naming the equivalent control — or inline) with the measurement; Scan markers not measured.
  - Edge cases: `FEED CLEAR` recorded N/A (not interactive); if the view-control bar has been removed (owner playtest 2026-10-19 suggests Polish), record those controls N/A; enlarged hit areas do not overlap neighbours (transport row, toolbar).

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-035/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: IF-026 (soft: type sizes change boxes; measure after it lands)
- Unlocks: None
