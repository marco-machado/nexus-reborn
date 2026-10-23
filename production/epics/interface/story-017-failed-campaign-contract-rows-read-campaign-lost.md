# Story 017: Failed-campaign contract rows read CAMPAIGN LOST

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network; Rule 4 critical state)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 6; States & Variants "Campaign failed"; P-03 (the actual cause).

When the campaign is failed, Scan markers already read `CAMPAIGN LOST`, but OPEN CONTRACTS rows show `REQUIRES INTEL LVL n` for the same locked state. P-03 requires the reason to name the actual cause, and the spec says `CAMPAIGN LOST` on both.

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

- [ ] GIVEN a failed campaign WHEN OPEN CONTRACTS is read THEN every contract row's visible lock reason and the cause in its `aria-label` read `CAMPAIGN LOST` (as the Scan markers already do), never `REQUIRES INTEL LVL n`.
- [ ] GIVEN a campaign that has not failed WHEN an intel-locked row is read THEN it still reads `REQUIRES INTEL LVL n`, and clicking a locked row on a failed campaign leaves the phase on the World Network.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- Markers compute `requirement: campaignFailed ? 'CAMPAIGN LOST' : intelGate(m.intelReq)` at `src/ui/WorldMap.tsx:338`; the OPEN CONTRACTS row prints `intelGate(m.intelReq)` in `.red-dim` at :1042 (helper at :114). Use the same condition for the row text and its `aria-label` (`<code> // LOCKED // <cause>`).
- Rows keep `aria-disabled` and stay tab stops so the reason is announced (spec Focus order).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-029: the reason text's colour (Red Hot) and the locked row's dimming.
- IF-016: the banner line.

---

## QA Test Cases

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `failed-contract-reason`
  - Setup: failed campaign; focus a sector with an open or generated row, then one with an intel-locked authored row.
  - Verify: for every OPEN CONTRACTS row read the visible gate text and the `aria-label`; click a row; compare with the Scan markers.
  - Pass condition: the visible text is `CAMPAIGN LOST` and the `aria-label` ends `// LOCKED // CAMPAIGN LOST`; a click leaves the phase on the World Network; the markers still read `CAMPAIGN LOST`.
  - Edge cases: a row both intel-locked and campaign-lost reads `CAMPAIGN LOST`; on a campaign that has not failed, intel-locked rows still read `REQUIRES INTEL LVL n` (regression).

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-017/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
