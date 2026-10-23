# Story 034: Inset steppers have a 24 px hit area

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Standard accessibility tier)
**Requirement**: `TR-interface-???` — **no TR registered for hit-target size.** Source: WCAG 2.2 SC 2.5.8 (AA, 24×24 CSS px), owner decision 2026-10-23, spec Open Question 21 and Input checklist. **Owner waiver 2026-10-23 (Sprint 11 planning): this story proceeds without a registered TR; register it at a later `/architecture-review`.**
*(no registry entry yet)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 21 (owner 2026-10-23: WCAG 2.2 SC 2.5.8, 24×24 CSS px); Input checklist hit-target table.

The sector inset `<` `>` steppers are 18×30 (measured 2026-10-23). The visible glyph may stay smaller; the hit area carries the size (spec Input checklist).

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

- [x] GIVEN the sector inset at 1280×720, text scale 100% WHEN `FOCUS PREVIOUS SECTOR` and `FOCUS NEXT SECTOR` are measured THEN each hit area is ≥24×24 CSS px.
- [x] GIVEN the enlarged steppers WHEN activated by click, Enter or Space THEN Focus steps and still skips Antarctica, and the steppers stay absent while the Influence moment note replaces the inset.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Steppers are `.wm-inset-chev.l` / `.r` (`src/ui/ui.css:1345-1365`; buttons at `src/ui/WorldMap.tsx:475,483`).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-031 to IF-035: the other hit targets.
- Scan markers: exempt by the equivalent-control exception.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `inset-stepper-hit-area`
  - Setup: 1280×720, text scale 100%; a focused open sector; Influence note not showing.
  - Verify: measure `FOCUS PREVIOUS SECTOR` and `FOCUS NEXT SECTOR`.
  - Pass condition: each ≥24×24 CSS px.
  - Edge cases: the steppers are absent while the Influence moment note replaces the inset; stepping still skips Antarctica; Enter and Space still activate them.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-034/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [x] Created — `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720)

---

## Dependencies

- Depends on: IF-026 (soft: type sizes change boxes; measure after it lands)
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: all passing (AC-1 and guards; none deferred)
**Implementation**: `.wm-inset-chev` 24 px wide.
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
