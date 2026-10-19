# Story 001: Every surface fits 1280×720 at every text scale

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Screens must work at 1280×720 without clipping or truncation.
- Required: Settings, Balance, pause, and tutorial toasts are overlays; they do not change `Phase`.
- Guardrail: no per-frame React state (CLAUDE.md).
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [x] (AC1) GIVEN every listed surface (Menu, World Network, Research, Brief, Assembly, Mission HUD, pause, Debrief, Settings) at 1280×720 and each text scale 90 / 100 / 110 / 125%, WHEN the surface is shown, THEN no element's text is cut off by its container, no element's bounding box intersects another's except declared overlays (Settings, Balance, pause, toasts, the first-visit World Network orientation card, the Recruitment Market), and scrolled overflow remains reachable. Smaller-than-minimum windows scroll and do not compress panels.
- [x] (AC20) GIVEN a click-through at 1280×720 following `docs/click-through.md`, WHEN the run is recorded, THEN the record names every unexercised screen or interaction. A partial run is not a pass of the unexercised set.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Text scale is a settings value applied through CSS variables; panels scroll below minimum window size rather than compressing.
- Declared overlays are the only permitted bounding-box intersections.
- The click-through record follows `docs/click-through.md` and names every unexercised screen or interaction.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: semantic colour roles and non-color cues.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-001 — Every surface fits 1280×720 at every text scale (UI)
**Automated (where a seam exists)**:
- `src/state/settingsStore.test.ts`: the text-scale step set is exactly {0.90, 1.00, 1.10, 1.25}, stored as the percents [90, 100, 110, 125] (literals, not the module constant)
- A scripted sweep (kept with the evidence, `production/qa/evidence/if-001/sweep.mjs`): for each of 9 surfaces × 4 scales, assert no element's `scrollWidth > clientWidth` clip and no bounding-box intersection outside the declared overlays (Settings, Balance, pause, toasts); print the failures per surface
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-001/`; sign-off: qa-lead
**Checklist**:
- [x] 36 retained screenshots (Menu, World Network, Research, Brief, Assembly, Mission HUD, pause, Debrief, Settings × 90/100/110/125%)
- [x] One sub-minimum capture (1100×650) of one surface showing scroll, not compression
- [x] Click-through record per `docs/click-through.md`, 1280×720, naming every unexercised screen or interaction (AC20); Mission HUD, pause and Debrief may use labelled fixtures from `docs/mission-playbook.md`
**Edge cases**: Viewport below 1280×720 (e.g. 1100×650): layout scrolls, panels are not compressed; 125% scale on the densest surface (Assembly, Debrief): overflow reachable by scroll; Overlay on overlay (pause + Settings, toasts + pause): the only allowed intersections

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/if-001/` (36 surface captures, 4 pause + Settings captures, 1 Mission HUD capture with KESTREL active, 2 sub-minimum captures, `sweep.mjs`, `sweep-output.txt`, `sweep-result.json`, click-through record `README.md`); step-set test in `src/state/settingsStore.test.ts`

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 003, Story 004, Story 005, Story 006, Story 007, Story 008, Story 009, Story 010, Story 011, Story 012

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 2/2 passing. AC1: `production/qa/evidence/if-001/sweep.mjs` run clean on 9 surfaces x 4 scales plus pause + Settings, each squad slot active at 125% (KESTREL included), and the asserted 1100x650 sub-minimum check (`sweep-output.txt`: ALL SURFACES CLEAN, 0 console errors). AC20: `README.md` Browser coverage names every unexercised step; the click-through is partial and is not a pass of those steps.
**Fixes found by the sweep** (`src/ui/ui.css`): squad card names and weapon names wrap instead of ellipsizing at 125%; the name clears the ACTIVE tag; weapon panel headers wrap inside the panel; the Assembly DEPLOY TEAM button fits its column at every scale. `index.html` declares an empty icon (the `/favicon.ico` 404 was the click-through's only console error).
**Deviations**: None against GDD/ADR. Advisory: the step set is stored as percents [90, 100, 110, 125], the GDD writes 0.90-1.25 (same values). Scope: `index.html` touched outside the listed files (favicon 404).
**Test Evidence**: UI: retained screenshots in `production/qa/evidence/if-001/` (40 surface captures, 1 slot capture, 2 sub-minimum); step-set test in `src/state/settingsStore.test.ts`.
**Code Review**: First review CHANGES REQUIRED (3 blockers: HUD weapon header spill; sweep missed spill from visible-overflow panels; reachability not per axis). Fixed, then re-reviewed: APPROVED WITH SUGGESTIONS, specialists: lead-programmer, qa-tester. Advisories kept: SPILL fires only past a drawn border (not a background edge); weapon names can now wrap past two lines if a longer name is added; the sweep's default browser path is macOS arm64 (override `SWEEP_CHROME`).
**Mutation Check**: skipped — UI story
