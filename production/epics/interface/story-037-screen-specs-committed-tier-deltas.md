# Story 037: The five screen specs' committed-tier deltas are fixed

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Rule 6; AC1; AC19 focus trap and restore)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: the UX specs `design/ux/research.md`, `brief.md`, `assembly.md`, `debrief.md`, `settings.md` (drafted 2026-10-23); `design/accessibility-requirements.md` Committed rows (no clipping or truncation; pause and Settings focus trap and restore; reduced motion; never colour alone). Only the as-built deltas that break a Committed row are fixed here; the rest stay Open Questions in their specs (Polish inputs), as on the World Network spec.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: One palette; DOM Screens at 1280×720 without clipping; critical state never colour-only; keyboard and mouse.
**ADR Version**: 2026-09-10
**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH (ADR-0017 Knowledge Risk)
**Engine Notes**: DOM, CSS and SVG only.

**Control Manifest Rules (this layer)**:
- Required: palette tokens only; no clipping or truncation; high contrast via CSS variables.

---

## Acceptance Criteria

- [x] GIVEN every surface at 1280×720 and text scales 90 / 100 / 110 / 125 WHEN measured THEN no text is cut by an ellipsis, no text line is drawn over another (visible parts only), and nothing else clips, spills or scrolls sideways (every `text-overflow: ellipsis` rule removed; Brief COMMS entries wrap; Research node labels use an em line pitch and follow the text scale up to 110% inside the fixed tree).
- [x] GIVEN the Settings opened from Pause, the Balance dashboard and the Recruitment Market WHEN opened, tabbed through and closed THEN focus enters the dialog, Tab stays inside, Escape closes the market, and focus returns to the control that opened each (SETTINGS, OPEN, RECRUIT); after the Debrief Research note's UNDERSTOOD, focus lands on RETURN TO WORLD NETWORK.
- [x] GIVEN reduced motion WHEN an overlay opens THEN it prints with no fade; a researched Research node carries a check glyph besides green; a selected Settings segment or ON toggle is framed (2 px teal), not marked by amber hue; Debrief invoice rows print by a ≤120 ms fade with no travel.

---

## Implementation Notes

- `src/ui/modalFocus.ts`: `useModalFocus(root, { onEscape })` — initial focus, Tab trap, Escape, focus back to the opener; used by `RecruitPanel` (`index.tsx`) and `BalancePanel` (`Balance.tsx`).
- `src/ui/PauseMenu.tsx`: closing Settings refocuses SETTINGS; opening still focuses RESUME. `src/ui/Settings.tsx`: closing Balance refocuses OPEN; segments use `.sel`.
- `src/ui/index.tsx`: Debrief UNDERSTOOD refocuses RETURN; COMMS entries lose their `title` (the text is visible). `src/ui/Research.tsx`: tspans with `dy` in em; `rs-node-done` check glyph.
- `src/ui/ui.css`: 12 ellipsis rules → `overflow-wrap: break-word`; `.btn.sel`; `row-in` fade-only 0.12 s; `.hud-menu-wrap` in the reduced-motion list; `.rs-node-label` capped at 110% growth.

---

## QA Test Cases

- **AC-1**: `production/qa/evidence/screens-2026-10-23/sweep.mjs` — clip check now flags any ellipsis that cuts text and any visible text line over another; all surfaces 0 at four scales.
- **AC-2 / AC-3**: `production/qa/evidence/screens-2026-10-23/focus.mjs` — 13 checks.

---

## Test Evidence

**Story Type**: UI
**Status**: [x] Created — `sweep-output.txt` (0 everywhere), `focus-output.txt` (ALL PASS 13), World Network probe ALL PASS.

---

## Dependencies

- Depends on: IF-036
- Unlocks: `/ux-review` of the five specs

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: 3/3
**Test Evidence**: focus probe watched failing on the pre-fix code (11 of 13 FAIL), then ALL PASS; sweep's new ellipsis and text-overlap checks found 22 Research overlaps at 125% and the Brief COMMS overlap at 90% before the fix, 0 after (the first overlap version reported scrolled-away text as overlapping; lines are now cut to their visible part). vitest 1642/1642, lint clean, build OK.
**Code Review**: not run separately (same patterns as IF-016–IF-036).
