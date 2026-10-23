# Story 025: Each Influence action prints its effect as visible text

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network; P-03 no tooltip-only information)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 8 (owner 2026-10-23: shorten the row; the effect prints on its own line under the button); Localization (status word needs its own line).

Each action's effect (e.g. `-2 UNREST OVER 6H`) is only in `title` and `aria-label`. P-03 and the Standard controls table forbid relying on a tooltip. The owner ruled on 2026-10-23 that each action prints its effect as static text on its own line under the button.

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

- [ ] GIVEN the focused sector's three Influence actions WHEN rendered THEN each prints its effect (the `actionEffect` text) as static visible text on its own line under the button, not only in `title` / `aria-label`, without clipping at 1280×720 and text scales 90 / 100 / 110 / 125.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- `actionEffect(id)` at `src/ui/WorldMap.tsx:154` already builds the copy from the data `worldStore` applies (`game/influence.ts`); print that string, do not write new copy. The button is at :183-199.
- The Localization table flags the status word (`UNAFFORDABLE`, `COOLDOWN 12H`) as over its 72 px box at 100%; the row redesign must keep the status and the effect from overlapping.
- The `aria-label` keeps its full form (`<num> <name> // <cost> PTS // <effect> // <status>`).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-026: the type-size floors (the effect line is a 10 px label).
- The Influence moment note copy (unchanged).

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `influence-effect-lines`
  - Setup: focus a sector; cover Influence 0 (all disabled), one action affordable, a cooldown, an `ACTIVE` spend, and Expedite with no target; repeat at the four text scales.
  - Verify: for each action find the static text equal to `actionEffect(id)`; confirm it is rendered text, not only `title`/`aria-label`; compare its box with the button's.
  - Pass condition: each effect is visible on its own line with its top at or below the button's bottom; it is visible while the button is disabled; nothing clips at the four scales.
  - Edge cases: the Expedite effect (`WAIVE INTEL GATE // +nH EXPIRY`) may wrap but not clip; the status word does not overlap the effect line; OPEN CONTRACTS still scrolls with every row reachable at 125%; Antarctica offers no actions.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-025/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: IF-026 (soft: land the size floors first so the effect line is checked at its final size)
- Unlocks: None
