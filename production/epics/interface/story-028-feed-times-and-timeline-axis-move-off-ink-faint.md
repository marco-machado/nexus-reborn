# Story 028: Feed times and the Timeline axis move off Ink Faint

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Rule 4 colour roles; Standard accessibility tier)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 17 (owner 2026-10-23: Ink Faint text moves to Ink); Accessibility → Contrast (Ink Faint never carries text, art bible §7.5).

Feed times and the Timeline axis print in Ink Faint (`#35504a`, 2.21:1). Ink Faint never carries text. The owner ruled on 2026-10-23 that they move to Ink.

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

- [ ] GIVEN the Feed and the Timeline in default mode WHEN measured as rendered THEN Feed times and the axis labels print in Ink at ≥4.5:1, and no text run on the screen uses Ink Faint.
- [ ] GIVEN the Timeline and Feed WHEN rendered THEN the axis `NOW` stays teal, tone-coloured Feed lines keep their tone, and high contrast does not regress.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Feed time: `.wm-feed-t` (`src/ui/WorldMap.tsx:665`); axis: `.wm-tl-axis` (`src/ui/ui.css:1652`). `.wm-tl-axis .now` stays teal (:1660).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-027: Ink Dim runs.
- Tone-coloured Feed lines (unchanged).

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `ink-faint-removed`
  - Setup: default mode, Feed with events, Timeline visible.
  - Verify: read the computed colour of `.wm-feed-t` and the `.wm-tl-axis` labels; run the full-screen sweep for Ink Faint.
  - Pass condition: Feed times and axis labels are Ink and ≥4.5:1; no text run, header and nav included, has `rgb(53,80,74)`.
  - Edge cases: `NOW` stays teal; tone-coloured Feed lines unaffected; high contrast does not regress.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-028/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
