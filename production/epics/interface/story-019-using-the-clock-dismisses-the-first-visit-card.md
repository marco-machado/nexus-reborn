# Story 019: Using the clock dismisses the first-visit card for the campaign

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network first-visit overlay; tutorial seen set)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 4 (second half); Interaction Map "Orientation card UNDERSTOOD" row; States & Variants "First-visit card showing / dismissed"; P-23.

P-23 and the spec say using Pause or a speed dismisses the first-visit card for the rest of the campaign. As built (code read 2026-10-23) the card is marked seen only on `UNDERSTOOD` (`src/ui/WorldMap.tsx:794`); the clock works under the card but the card stays.

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

- [ ] GIVEN the first-visit card showing WHEN the player activates Pause/Resume or any of `1X` `2X` `4X` `8X` THEN the clock action applies, `WORLD_ONBOARD_ID` is marked seen, the card leaves, and it does not return after a save and reload.
- [ ] GIVEN the card showing WHEN Focus changes, a Feed row is clicked, or Esc is pressed THEN the card stays and `WORLD_ONBOARD_ID` is not marked seen.
- [ ] GIVEN a card already dismissed by clock use WHEN the clock is used again, and WHEN New Operation starts a new campaign THEN the id is never added twice, and the new campaign shows the card again.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- The transport buttons are `.wm-tbtn` in `src/ui/WorldMap.tsx` (around :610–:630). Route the dismissal through the same handler the buttons use so a test can drive it without a DOM: vitest here is node-only (no jsdom / testing-library in `package.json`).
- `markSeen` must not add a duplicate id (Sprint 10 fixed the guard for IF-013/IF-014; reuse it).
- The seen set persists through the versioned campaign save (`tutorial.seen`); New Operation resets it, so the card returns in a new campaign. Do not change the save version.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-018: `aria-modal`.
- Focus changes, Feed rows and Esc do not dismiss the card (unchanged).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Test: using the clock dismisses the first-visit card for the campaign
  - Given: a fresh campaign; `tutorialStore.seen` lacks `WORLD_ONBOARD_ID`; `worldStore` unpaused at 2×.
  - When: each of Pause/Resume, 1X, 2X, 4X and 8X is applied through the same handler the buttons use.
  - Then: the clock effect applies (`paused` toggles, or `speed` is set); `seen` contains `WORLD_ONBOARD_ID` exactly once, so `WorldOnboard` returns null; a save blob built from the stores carries it in `tutorial.seen`, and hydrating that blob into reset stores keeps the card gone.
  - Edge cases: the already-active speed still dismisses; a speed chosen while paused selects only and still dismisses; a second activation does not duplicate the id; `UNDERSTOOD` still works; Focus changes, Feed rows and Esc do not dismiss; New Operation resets the id so the card returns. If the wiring cannot be reached without a DOM, fall back to a documented Playwright playtest with screenshots of the card before and after each of the five controls.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.
- **AC-3** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: a vitest test beside the module that owns the clock-to-dismiss wiring (e.g. `src/ui/worldOnboard.test.ts`), OR a documented Playwright playtest with screenshots in `production/qa/evidence/if-019/` when no node-only seam exists (vitest here has no DOM environment).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
