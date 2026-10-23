# Story 029: Locked contract rows dim the frame, not the text, and their reason prints in Red Hot

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Rule 4 colour roles; Standard accessibility tier)
**Requirement**: `TR-interface-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 17 (red-dim 3.18:1); Accessibility → Contrast (owner 2026-10-23: a locked row dims its frame only); merged story (owner 2026-10-23).

Locked OPEN CONTRACTS rows are drawn at `opacity: 0.55` (`src/ui/ui.css:1508`), which pulls every text run in them under 4.5:1, and the reason prints in `red-dim` (3.18:1 in both modes, not remapped). The owner ruled on 2026-10-23 that a locked row dims its frame and borders only, and merged the reason-colour fix and the locked row's chip contrast into this one story so it has no circular dependency on IF-027.

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

- [ ] GIVEN a locked OPEN CONTRACTS row (intel-locked, and failed campaign) in default and high-contrast modes WHEN it renders THEN every text run in the row has effective opacity 1 and is ≥4.5:1 as rendered (the reason in Red Hot; codename, `TYPE // CITY` and chips in Ink or brighter), and the row still reads as locked through its dimmed frame, the lock glyph and the reason text.
- [ ] GIVEN a locked row and an open row viewed in grayscale WHEN compared THEN the locked row is told apart by its lock glyph (≥3:1 non-text floor) and reason text, and it keeps `aria-disabled`.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Replace `.wm-op.locked { opacity: 0.55 }` with a frame-only treatment (border colour or background) so no ancestor of a text run carries opacity < 1.
- Reason text: `<i className="red-dim">` at `src/ui/WorldMap.tsx:1042` → Red Hot (`var(--red-hot)`). Leave the global `.red-dim` rule (`ui.css:467`) alone unless nothing else uses it.
- Chips in locked rows (`CHANCE`, `ETA`, `GENERATED`, `EXPIRY`, `WorldMap.tsx:1050-1062`) use `.chip.dim` (Ink Dim): shared with IF-027 — whichever lands first makes the World Network chip change.
- The lock glyph uses Ink Dim (`ui.css:1511`, 4.29:1 at full opacity) and is a non-text mark: ≥3:1 is its floor.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-017: the `CAMPAIGN LOST` wording.
- IF-027: Ink Dim runs outside locked rows.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE (assembled from the qa-lead's IF-029 and IF-036 blocks after the owner merged them; IF-036 alone was GAPS for the circular dependency)). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `locked-row-frame-and-reason`
  - Setup: intel-locked rows (opening desk: Glass Veil, Hollow Crown) and a failed campaign; default mode and high contrast.
  - Verify: for every text run in a locked row: the product of ancestor `opacity` and the text colour alpha; the computed colour; the ratio as rendered. Compare the locked row's frame (border, background or a frame-only opacity) with an open row's; check the lock glyph and the reason are present.
  - Pass condition: every run has effective opacity 1 and ≥4.5:1 in both modes; the reason is Red Hot `rgb(255,107,85)` and the `red-dim` class is not used on it; the locked frame differs from an open row's; the lock glyph is drawn instead of the target glyph and the reason is visible.
  - Edge cases: in a failed campaign `CAMPAIGN LOST` is the same element and gets the same treatment; `aria-disabled` unchanged; the lock glyph ≥3:1 (non-text floor).

- **AC-2** (guard) — added by `/qa-plan` 2026-10-23:
  - Setup: opening desk (Glass Veil and Hollow Crown locked, Rust Haven open); grayscale filter on.
  - Verify: compare a locked row and an open row side by side; measure the lock glyph's contrast against the row (non-text); read `aria-disabled`.
  - Pass condition: the locked row is identifiable by its lock glyph and reason text with colour removed; the glyph is ≥3:1; locked rows carry `aria-disabled="true"`, open rows do not.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-029/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
