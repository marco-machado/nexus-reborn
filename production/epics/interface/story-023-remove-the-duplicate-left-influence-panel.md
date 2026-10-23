# Story 023: Remove the duplicate left INFLUENCE panel

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.2 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 3 (owner 2026-10-23: adopted); Layout Zones.

The left INFLUENCE panel repeats the Influence figure the header already prints. The owner adopted the spec's recommendation on 2026-10-23: delete it, leaving the left column to SECTORS (which already scrolls at 100%, 356 px box for 396 px of content).

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

- [x] GIVEN the World Network at 1280×720 and text scales 90 / 100 / 110 / 125 WHEN it renders THEN the left column holds SECTORS only (no INFLUENCE panel), the header still prints Influence, and nothing clips.
- [x] GIVEN an Influence spend or a Debrief award WHEN the World Network shows THEN the header Influence carries the new value in the same frame, so no Influence figure is lost with the panel.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Panel at `src/ui/WorldMap.tsx:867-871` inside `aside.wm-left`. Remove it and let SECTORS take the height; check the grid/flex rules for `.wm-left` in `src/ui/ui.css` so the list grows rather than leaving a gap.
- The header Influence lives in the shared screen chrome (`src/ui/Nav.tsx:44`); do not touch it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-024: the bottom RESOURCE POOL → INTEL.
- IF-026: type sizes.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `left-column-sectors-only`
  - Setup: New Operation; text scale 90, 100, 110 and 125 in Settings.
  - Verify: list the panel titles in `aside.wm-left`; read the header resources; check clipping, overlap and scroll at each scale.
  - Pass condition: only `SECTORS` is in the left column; the header still prints `INFLUENCE n PTS`; nothing clips or overlaps at the four scales (a scrolling SECTORS list with Antarctica reachable counts as not clipped).
  - Edge cases: a campaign banner posted at 125%; the first-visit card showing; record how many sector rows are visible as an observation.

- **AC-2** (guard) — added by `/qa-plan` 2026-10-23:
  - Setup: a fixture with Influence ≥ the Stabilize cost on an open focused sector; then a clean-win Debrief return.
  - Verify: read the header `INFLUENCE n PTS` immediately before and after a Stabilize spend (same captured frame as the status word change), and immediately on the World Network after the Debrief return.
  - Pass condition: the header shows the debited value in the frame the status word turns `ACTIVE`, and the awarded value on the first frame of the return; no other Influence figure remains on the screen.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-023/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [x] Created — `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720)

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: all passing (AC-1 and guards; none deferred)
**Implementation**: Left INFLUENCE panel removed; SECTORS takes the column.
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
