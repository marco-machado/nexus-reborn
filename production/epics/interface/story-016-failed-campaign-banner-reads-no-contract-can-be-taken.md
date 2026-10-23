# Story 016: Failed-campaign banner reads ROSTER EMPTY // NO CONTRACT CAN BE TAKEN

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.1 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/interface.md` (Screens table: World Network; Edge Cases: failed campaign)
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/ux/world-network.md` (Approved 2026-10-23) — Open Question 20; States & Variants "Campaign failed".

On a failed campaign the shipped secondary line says `ROSTER EMPTY // NETWORK COMMAND SUSPENDED`, but Focus, the clock, Influence and Research all stay usable (GDD Edge Cases). The owner replaced the line on 2026-10-23 with one that states the one thing that stops: `selectMission` is a no-op.

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

- [x] GIVEN a failed campaign (empty living roster, campaign incomplete) WHEN the World Network shows THEN the `CAMPAIGN FAILED` banner's secondary line reads exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`, and `NETWORK COMMAND SUSPENDED` appears nowhere in `src/`.
- [x] GIVEN a completed campaign (three authored wins) WHEN the World Network shows THEN the `CAMPAIGN COMPLETE` banner, its secondary line and the `n / 3` count are unchanged.

---

## Implementation Notes

*Derived from ADR-0017 §1 (One OS and palette) and the spec; line numbers read 2026-10-23:*

- The line is a literal at `src/ui/WorldMap.tsx:848` (`<i>ROSTER EMPTY // NETWORK COMMAND SUSPENDED</i>`). Change the string only; the banner structure, `role="status"` and the `aria-hidden` sigil (P-21) stay.
- If a unit test pins the absence of the old string, build that string at runtime so the test file does not match its own grep.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- IF-017: the contract rows' `CAMPAIGN LOST` reason.
- The `CAMPAIGN COMPLETE` banner and its secondary line (unchanged).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-011-2026-10-23.md`.

*Written by qa-lead at story creation (QL-STORY-READY, 2026-10-23: ADEQUATE). The developer implements against these — do not invent new test cases during implementation.*

- **AC-1** — Manual check: `failed-banner-copy`
  - Setup: load a failed campaign (empty living roster, campaign incomplete) and open the World Network.
  - Verify: read the `CAMPAIGN FAILED` banner (`role="status"`) secondary line; run `rg -n "NETWORK COMMAND SUSPENDED" src`.
  - Pass condition: the line equals exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`; the grep returns nothing; the headline and the `n / 3` count are unchanged; the `CAMPAIGN COMPLETE` secondary line is unchanged.

- **AC-2** (guard): verified by the Edge cases of AC-1 above; record the result separately in the evidence README or test name.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each state touched in `production/qa/evidence/if-016/`, plus a click-through `README.md` naming the screens and states exercised and the measured values. Capture with headless `npx playwright-cli` at exactly 1280×720 (never the user's Chrome); stop the dev server and confirm nothing listens on port 4200 afterwards. Contrast is the composited ratio as rendered over `rgba(7, 16, 15, 0.92)` on Void `#04070a`, computed by script.

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
**Implementation**: Banner line changed (`src/ui/WorldMap.tsx`); the old string is gone from `src/`.
**Test Evidence**: `production/qa/evidence/sprint-011/` (`README.md` story map, `probe-output.txt` ALL PASS 152 checks, PNGs at 1280×720). Probe watched failing on the as-built code (60 FAIL, then a hard stop under the card) and on two layout mutations (truncation, spill), then ALL PASS. `npm test` 1642/1642, `npm run lint` clean, `npm run build` OK.
**Code Review**: APPROVED WITH SUGGESTIONS — ui-programmer, lead-programmer, qa-tester (2026-10-23). Applied: shared `unrestTone` / `lockReason` helpers with unit tests; dead CSS removed; `.wm-intel-panel` rename; IF-019 tests that could pass by accident fixed and `paused` pinned; browser checks for all five transport buttons and a Feed-row click under the card; Review mode checked at four scales.
**Manifest**: story 2026-10-08 = current 2026-10-08.
