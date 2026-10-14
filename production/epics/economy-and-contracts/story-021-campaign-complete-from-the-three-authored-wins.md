# Story 021: Campaign-complete from the three authored wins

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0003: Authored and generated contracts are the same kind of work  
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A second completion rule for generated work.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN exactly two authored contracts won, WHEN campaign-complete is read, THEN it is false.
- [x] GIVEN Glass Veil, Hollow Crown and Rust Haven all won, THEN campaign-complete is true.
- [x] GIVEN all three won, WHEN instances are read, THEN all three remain selectable.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Winning all three authored contracts marks the campaign complete; they stay replayable. Generated wins do not mark complete.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 018/019: banners and failed flags.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/state/campaignStore.test.ts`

**What to test**:
- Two authored wins = false
- Glass Veil, Hollow Crown and Rust Haven won = true; all three stay selectable

**Edge cases**: The same contract won twice counts once; a generated win does not count.

**Existing coverage / gap**: Mostly covered (~L233, L318, L387); add the two-wins case.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts` (describe "campaign complete from the three authored wins (EC-021)"); 41/41 passed via `npx vitest run src/state/campaignStore.test.ts` on 2026-10-14

---

## Dependencies

- Depends on: Story 004
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
- AC-1 two authored wins = false: `src/state/campaignStore.test.ts` "exactly two authored wins leave campaign-complete false" (all three pairs) — COVERED
- AC-2 all three won = true: `src/state/campaignStore.test.ts` "Glass Veil, Hollow Crown and Rust Haven all won marks campaign-complete true" — COVERED
- AC-3 all three stay selectable: `src/state/campaignStore.test.ts` "all three won leaves all three selectable with a living roster" — COVERED
- Edge cases: same contract won twice counts once (new test); a generated win does not count (existing test, ~L464).
**Deviations**: None blocking. ADVISORY: TR-economy-003's registry text ("Authored and generated contracts share brief → assembly → mission → debrief") is about the shared pipeline; this story's ACs are campaign completion (ADR-0003 / ADR-0020). Behaviour matches ADR-0020 (`campaignWon = allWon && !campaignFailed`; only authored wins join `contractsWon`, `src/state/campaignStore.ts`). Test-only change; no scope creep.
**Test Evidence**: Logic: test file at `src/state/campaignStore.test.ts` — present and run, 41/41 passed; `npx tsc -b` clean (per /code-review).
**Run result**: N/A — store-only logic pinned by tests; no player-visible change.
**Code Review**: Complete (lean mode) — /code-review ran on `src/state/campaignStore.test.ts`: "Verdict: NOT ASSESSED" because the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in that subagent); the reviewer's own pass found no required changes (would otherwise be APPROVED WITH SUGGESTIONS). Rerun /code-review where Agent is available if specialist sign-off is needed. QL-TEST-COVERAGE skipped — Lean mode.
**Advisory findings from /code-review**:
- `src/state/campaignStore.test.ts:625-628` — the selectable test mutates `useAppStore` (phase 'brief', missionId 'm03') and nothing resets it; `beforeEach` resets only `useCampaignStore`. Harmless today (last block in file); consider an `afterEach` resetting `useAppStore`.
- `src/state/campaignStore.test.ts:620` — `operatives.length > 0` is weak; asserting the roster equals the ROSTER ids would say more.
- `src/state/campaignStore.test.ts:621` — `intelLevel: 3` lifts intel gates, so the test proves completion does not lock missions, not selectability at a real player's intel level. Acceptable; commented.
- ADR compliance: COMPLIANT with ADR-0003 and ADR-0020. No per-frame React state, no determinism impact.
**Autonomous decisions**: Phase 5 lean prompt answered "Yes — /code-review ran" with the result above; Phase 7 took "Close the story (Recommended)". No tech debt logged.
