# Story 008: sync(t) completes projects; completion pays nothing

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Any completion payout.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN a running lab with endT = 7200, WHEN sync(t = 7199) runs, THEN the project stays active.
- [x] GIVEN endT = 7200, WHEN sync(t = 7200) runs, THEN it is researched and that lab is idle; completion does not call `addCredits` and Credits are unchanged.
- [x] GIVEN Advanced Propellants started at T0 (endT = T0 + 7200), WHEN strategic t advances by at least 7200 and Research sync runs at that t, THEN it is researched. (A quiet-replay win may cause that advance.)

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Laboratories catch up on World Network `t` after a Screen tick or a win ETA jump via `sync(t)`; a loss spends none. No acceptance test is arranged through a win ETA jump.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: `endT`.
- Story 010: field freeze.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/researchStore.test.ts`.
- sync(7199) leaves endT 7200 active
- sync(7200) completes and idles the lab; Credits unchanged, `addCredits` not called
- A strategic jump ≥ 7200 then sync completes it
- Edge: Completes at equality, not one second later

**Gap**: Probably test-only; add the no-payout assertion.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/researchStore.test.ts` (describe "sync(t) completes projects; completion pays nothing"); 29/29 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 007
- Unlocks: Story 009, Story 010, Story 011

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None. Test-only change; no production code touched. `sync()` in `src/state/researchStore.ts` has no `appStore` reference, so the Forbidden rule (no completion payout) holds.
**Test Evidence**: Logic: `src/state/researchStore.test.ts` — `npx vitest run src/state/researchStore.test.ts` 29 passed on 2026-10-14 (re-run by /story-done)
**Run result**: N/A — test-only story; no screen, store contract or runtime path changed, so nothing renders differently
**Code Review**: Complete (lean mode) — `/code-review` ran in the implement-stories workflow. Verdict: NOT ASSESSED — the engine specialist review (lead-programmer / gameplay-programmer, plus the qa-tester pass) could not be spawned because the unattended run has no Agent tool. The parent review found no defects: ADR-0001 COMPLIANT, all 3 ACs covered, 29/29 passing.
**Closed by**: /story-done run unattended inside the implement-stories workflow; Phase 5 lean prompt answered "Yes — /code-review ran" with the result above; Phase 7 took the recommended "Close the story" option.

**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: endT 7200, sync(7199) → stays active | researchStore.test.ts::sync(7199) leaves a run with endT 7200 active | COVERED |
| AC-2: sync(7200) → researched, lab idle, no addCredits, Credits unchanged | researchStore.test.ts::sync(7200) researches it, idles the lab, and neither calls addCredits nor moves Credits; ::completes at equality, not one second later | COVERED |
| AC-3: Propellants at T0, t advances ≥ 7200, sync → researched | researchStore.test.ts::after a strategic clock advance › Advanced Propellants started at T0 is researched once t advances >= 7200 and sync runs at that t | COVERED |

**Advisory findings from /code-review**:
- Process gap: the skill's Phase 7 specialist and qa-tester reviews did not run (no Agent tool). Left as NOT ASSESSED, not APPROVED. Re-run /code-review in a session that can spawn agents if a formal approval is needed.
- Verified: all 3 ACs and all 4 QA cases covered; sync(7199) leaves the run active; sync(7200) adds the node to done, sets labs.ballistics to null, never calls addCredits, Credits unchanged; equality completes at 7200; strategic case uses tick() to reach T0+7201 then syncs.
- Strategic describe calls tick() then sync(t) by hand, so the real Screen wiring in `src/ui/clock.ts:50-51` (startWorldClock calls sinks.syncResearch(t) after each tick) is not exercised. AC3 allows the manual sync. A small startWorldClock test with injected frames and sinks would pin that wiring. The header comment calling tick() "the Screen path" overstates what is covered.
- Strategic describe sets t = 50_000 but keeps the default nextTaxT = 86400; the tick reaches 57201, so no Tax is deposited today. If T0 or the default changes so a tax interval is crossed, depositTax would call appStore addCredits, and afterEach does not restore appStore credits — state would leak into later tests. Consider setting nextTaxT far ahead or snapshotting credits.
- Bookkeeping (Test Evidence status, AC checkboxes) — updated by this /story-done.
- QL-TEST-COVERAGE skipped — Lean mode.
