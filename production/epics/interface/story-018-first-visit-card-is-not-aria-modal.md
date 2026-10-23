# Story 018: First-visit card is not aria-modal

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network first-visit overlay)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 4 (first half); Accessibility → Focus order item 5; P-23.

The first-visit card is `role="dialog" aria-modal="true"`. P-23 says it is not P-05: it does not trap focus and the clock stays usable underneath (owner ruling: the clock runs under the card). Verified 2026-10-23: Tab from `UNDERSTOOD` already moves to the nav, so `aria-modal="true"` misdescribes the card to assistive technology.

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

*From `design/ux/world-network.md` (Approved 2026-10-23), scoped to this story (story granularity `fine`: one criterion):*

- [ ] GIVEN the first-visit card showing WHEN its DOM is inspected and Tab is pressed from `UNDERSTOOD` THEN the card carries no `aria-modal="true"`, `UNDERSTOOD` has initial focus, and Tab moves focus to the nav.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- `aria-modal="true"` is at `src/ui/WorldMap.tsx:760`. Remove it; `role="dialog"` and the card's accessible name may stay. Keep `autoFocus` on `UNDERSTOOD`.
- Esc must still not dismiss the card (spec Interaction Map, Escape row).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-019: dismissing the card on clock use.
- IF-035: the `UNDERSTOOD` hit area.

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `onboard-not-modal`
  - Setup: New Operation, card showing.
  - Verify: inspect the card root; read `document.activeElement`; press Tab once.
  - Pass condition: no `aria-modal="true"` on the card (`role="dialog"` and its label may stay); `UNDERSTOOD` has initial focus; after Tab, focus is inside `.navtabs`.
  - Edge cases: Shift+Tab reverses; Esc does not dismiss the card.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-018/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
