# Story 022: Empty Feed prints -- CHANNEL OPEN --

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network Feed)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 5 (owner 2026-10-23: the string changes); States & Variants "Feed empty"; P-16.

The empty Feed prints `NO TRAFFIC IN THIS WINDOW`; the P-16 empty-channel token is `-- CHANNEL OPEN --`. The owner chose the library token on 2026-10-23. P-16 makes the token the empty state only; it is not a line under existing events.

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

- [ ] GIVEN no events in the Feed window WHEN the Feed renders THEN it prints `-- CHANNEL OPEN --` and not `NO TRAFFIC IN THIS WINDOW`.
- [ ] GIVEN at least one event in the window WHEN the Feed renders THEN `-- CHANNEL OPEN --` is absent; with none, the token is not clipped in the bottom strip at text scale 125.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Literal at `src/ui/WorldMap.tsx:696` (`<div className="wm-empty">NO TRAFFIC IN THIS WINDOW</div>`). Change the string only.
- `EventsFeed` filters on the review pin and shows the latest 14, so scrubbing Review to before the first event is a way to reach the empty state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-028: Feed time ink.
- IF-031: Feed row hit area.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `feed-empty-token`
  - Setup: no events in the Feed (seeded empty, or Review scrubbed before the first event).
  - Verify: read the Feed body; run `rg -n "NO TRAFFIC" src`.
  - Pass condition: it prints `-- CHANNEL OPEN --`; `NO TRAFFIC IN THIS WINDOW` is in neither the DOM nor `src`.
  - Edge cases: with at least one event the token is absent; the token is not clipped in the bottom strip; the header shows `FEED CLEAR`.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-022/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
