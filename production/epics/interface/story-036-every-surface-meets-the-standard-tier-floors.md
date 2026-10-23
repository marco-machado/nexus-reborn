# Story 036: Every surface meets the Standard-tier type, ink and target floors

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Rule 6 legibility; AC1 every surface at 1280×720 × four text scales; Edge Case "critical state never color-only")
**Requirement**: `TR-interface-001`, `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/accessibility-requirements.md` (Standard tier); art bible §7.5 floors (text ≥10 px; body and readout text ≥4.5:1; Ink Faint never carries text); WCAG 2.2 SC 2.5.8 (24×24, owner 2026-10-23). Added during Sprint 11 (2026-10-23) to close the gate's accessibility check: the sweep of every surface found the same failures Sprint 11 fixed on the World Network.

The owner's World Network rulings (2026-10-23: Ink Dim and Ink Faint text move to Ink, no new dim token; 24×24 targets) are applied to every surface. Decision logged in `production/session-logs/decision-log.md`.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: One palette, dual-owned by `src/index.css` and `src/ui/tokens.ts`; high contrast remaps CSS variables only; Screens at 1280×720 without clipping; critical state never color-only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH (ADR-0017 Knowledge Risk)
**Engine Notes**: DOM, CSS and SVG only; no post-cutoff APIs.

**Control Manifest Rules (this layer)**:
- Required: palette from `src/index.css` / `src/ui/tokens.ts`; no new hex outside neutral tints.
- Required: no clipping or truncation at 1280×720 and text scales 90–125.
- Guardrail: `:root.s-high-contrast` remaps CSS variables only.

---

## Acceptance Criteria

- [x] GIVEN Menu, Settings, Research, Brief, Assembly, Debrief, the Mission HUD and Pause at 1280×720, text scale 100%, WHEN every visible text run (HTML and SVG, SVG at its rendered size) is measured THEN every run is ≥10 px and ≥4.5:1 as rendered in default and high-contrast modes, no text is in Ink Dim or Ink Faint, and every pointer target is ≥24×24 CSS px. Inactive controls (disabled, `aria-disabled`) are exempt from the contrast floor per WCAG 1.4.3 and listed by the sweep.
- [x] GIVEN the same surfaces at text scales 90 / 100 / 110 / 125 WHEN measured THEN nothing clips, truncates, spills out of its control or panel, scrolls sideways, or overlaps another panel.

---

## Implementation Notes

- `src/ui/ui.css`: every `color: var(--ink-dim)` text rule now uses `var(--ink)` (62 rules) and SVG text fills likewise; Ink Faint text moved to Ink, lock glyphs (non-text) to Ink Dim (≥3:1); every scaled font size under 10 px raised to 10 (87 rules); spill fixes on the Brief tactical rail and Assembly (stats, augment slots, loadout slots, mass tier); HUD squad slot column follows the text scale; alert bars to 0.75 opacity; 24×24 for the minimap zoom, HUD and tutorial buttons, Settings sliders and rebind/reset buttons. The scoped `.wm { --ink-dim }` override from IF-027 is gone (redundant).
- `src/ui/index.tsx`: the Brief recon frame's type (briefing lines, readouts, target callout, insertion/extraction tags) moved from SVG text in a stretched viewBox (6–8.6 px, distorted, not following the text scale) to an HTML overlay placed by percentage of the frame; `calloutFor` no longer sizes boxes (`textWidth` removed from `briefMap.ts`).
- `src/ui/portrait.tsx`: the portrait serial microtext (≈2 px rendered) removed; `INK_DIM_A9` token removed (unused).
- Tactical plate labels and Research node labels sized to render ≥10 px at 1280×720 and follow the text scale.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md` (story added after the plan; its cases are the sweep below).

- **AC-1** — Manual check: `all-surfaces-floors`
  - Setup: each surface reached as `sweep.mjs` documents (harness assists named in its header).
  - Verify: `sweep-output.txt` per surface: `<10px`, `<4.5:1 default`, `<4.5:1 high contrast`, `Ink Dim text`, `svg text`, `targets <24`.
  - Pass condition: every count is 0; exemptions listed are inactive controls only.
- **AC-2** — Manual check: `all-surfaces-layout`
  - Setup: as above, at the four text scales.
  - Verify: `clip @90/100/110/125` per surface.
  - Pass condition: 0 at every scale on every surface.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: `production/qa/evidence/screens-2026-10-23/` — `sweep.mjs`, `sweep-output.txt`, `sweep-<surface>.json`, PNGs per surface at four scales and high contrast, `README.md`.

**Status**: [x] Created — `production/qa/evidence/screens-2026-10-23/` (all counts 0)

---

## Dependencies

- Depends on: IF-026, IF-027, IF-029, IF-031 to IF-035 (the World Network rulings it extends)
- Unlocks: the five screen UX specs (their Accessibility sections cite this sweep)

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: 2/2 passing
**Test Evidence**: sweep ALL surfaces at 0 failures (exemptions: disabled RESET / RESET ALL in Settings, the disabled minimap zoom at its limit). Sweep watched failing first: 87 / 76 / 124 / 136 sub-10 px runs and 36–113 sub-4.5:1 runs on Settings / Brief / Assembly / Pause before the change, and the sideways-overflow check failed on a reverted tactical-rail mutation (377 px in 335). World Network probe re-run after the change: ALL PASS 152. `npm test` 1642/1642, lint clean, build OK.
**Code Review**: covered by the Sprint 11 review approach (same files and patterns); no separate specialist run for this story.
