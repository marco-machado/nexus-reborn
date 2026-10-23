# Story 030: Idle nav tab labels reach 4.5:1 in both modes

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.2 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Rule 4; Standard accessibility tier; high-contrast mode)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 17; Accessibility → Contrast (idle nav labels 4.29:1 in both modes; the label does not take the high-contrast remap, cause not traced).

The idle Research / Brief / Assembly tab labels measure 4.29:1 in default mode and the same in high contrast, so they ignore the remap. Nav is shared by all four Screens. Under the owner's 2026-10-23 ruling (Ink Dim text moves to Ink) these labels move to Ink.

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

- [ ] GIVEN the nav on each of the four Screens WHEN the idle tab labels are measured in default and high-contrast modes against the nav's own composited background THEN each is ≥4.5:1.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Labels: `.navtab-label` inside `.navtab` (`src/ui/Nav.tsx:90,101`; styles `src/ui/ui.css:388-440`). Trace why the high-contrast remap does not reach them (a literal colour or a non-variable rule is likely; `:root.s-high-contrast` remaps CSS variables only) and record the cause in the commit message.
- The selected tab (teal) is out of the measurement; the `NO CONTRACT SELECTED` condition text is reported as an observation only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-035: nav tab hit areas.
- IF-027: World Network panel text.

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `nav-idle-contrast`
  - Setup: open each of World Network, Research, Brief and Assembly, in default mode and high contrast.
  - Verify: measure the idle tab labels against the nav's own composited background (not the panel value).
  - Pass condition: every idle label ≥4.5:1 on all four Screens in both modes.
  - Edge cases: Brief locked and unlocked; the selected tab excluded; the high-contrast non-remap cause traced and recorded; `NO CONTRACT SELECTED` ratio reported as an observation.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-030/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
