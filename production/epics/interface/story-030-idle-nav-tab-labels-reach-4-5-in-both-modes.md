# Story 030: Idle nav tab labels reach 4.5:1 in both modes

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.2 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

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

*From `design/ux/world-network.md` (Approved 2026-10-23), scoped to this story (story granularity `fine`: one criterion, plus guard criteria added by the owner on 2026-10-23 to meet the `/story-readiness` minimum; each guard is drawn from the spec or the qa-lead's edge cases):*

- [x] GIVEN the nav on each of the four Screens WHEN the idle tab labels are measured in default and high-contrast modes against the nav's own composited background THEN each is ≥4.5:1.
- [x] GIVEN high-contrast mode WHEN the nav renders THEN the idle labels take the high-contrast remap (the as-built cause traced and recorded in the commit message), and the selected tab still carries `aria-current="page"`.

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

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `nav-idle-contrast`
  - Setup: open each of World Network, Research, Brief and Assembly, in default mode and high contrast.
  - Verify: measure the idle tab labels against the nav's own composited background (not the panel value).
  - Pass condition: every idle label ≥4.5:1 on all four Screens in both modes.
  - Edge cases: Brief locked and unlocked; the selected tab excluded; the high-contrast non-remap cause traced and recorded; `NO CONTRACT SELECTED` ratio reported as an observation.

- **AC-2** (guard) — added by `/qa-plan` 2026-10-23:
  - Setup: high contrast on; each of the four Screens.
  - Verify: compare each idle label's computed colour with and without high contrast; read `aria-current` on every tab; read the commit message for the traced cause.
  - Pass condition: the idle label colour changes when high contrast is on (it takes the remap); exactly the current Screen's tab carries `aria-current="page"`; the cause of the as-built non-remap is written in the commit message.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-030/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

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
**Implementation**: `.navtab` colour Ink (shared by the four Screens). Cause of the spec's "no high-contrast remap": not a defect — re-measured on the as-built code, the label is `rgb(93,125,117)` by default and remaps to `rgb(157,195,184)` under high contrast; the 2026-10-23 spec reading was a measurement error and the spec row is corrected. The real failure was 4.29:1 in default mode.
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
