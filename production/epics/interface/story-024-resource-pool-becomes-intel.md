# Story 024: RESOURCE POOL becomes INTEL

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.2 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 3 (owner 2026-10-23: adopted); ASCII Wireframe (bottom-right `INTEL` panel).

The bottom RESOURCE POOL repeats Credits, Influence and Roster from the header. The owner adopted the spec's recommendation on 2026-10-23: the panel becomes INTEL, showing the level and progress toward the next level as text.

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

- [ ] GIVEN the bottom strip at 1280×720 and text scales 90 / 100 / 110 / 125 WHEN it renders THEN the panel titled `INTEL` prints the intel level and progress as `n / 100` text, prints no Credits, Influence or Roster, and nothing clips.
- [ ] GIVEN an intel level-up WHEN the INTEL panel renders THEN its progress wraps below 100 and its level matches the header Intel.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Panel at `src/ui/WorldMap.tsx:1086-1106` (`.wm-pool`). Keep the existing level read and the `SegBar` if it fits; add the `n / 100` text from the same progress value.
- Intel level and progress live in `campaignStore` (ADR-0012); the header Intel (`Nav.tsx:45`) is unchanged.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-023: the left INFLUENCE panel.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `bottom-intel-panel`
  - Setup: New Operation; repeat at the four text scales.
  - Verify: read the bottom strip's fourth panel; check clipping.
  - Pass condition: the panel title is `INTEL` and no `RESOURCE POOL` remains; it prints the level and `n / 100` progress text; no CREDITS, INFLUENCE or ROSTER; nothing clips at the four scales.
  - Edge cases: progress 0 prints `0 / 100`; after a level-up the progress wraps below 100 (`addIntel`, no cap); the header Intel is unchanged.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-024/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
