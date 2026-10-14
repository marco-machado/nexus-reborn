# Story 008: Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-007`, `TR-economy-011`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Docking pay for a squad wipe on a Win.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a non-quiet Hollow Crown win, Reward 62,000 CR, 13 unique squad first-hits and optional complete (+9,000 CR), THEN Collateral = 62,000 CR and `net_payout = 9,000 CR`.
- [ ] GIVEN a non-quiet Rust Haven win at opening Standard, Reward 41,000 CR, 8 unique squad first-hits and optional ignored, THEN Collateral = 40,000 CR and `net_payout = 1,000 CR`.
- [ ] GIVEN a pyrrhic win (tiebreak Win that empties the roster on an incomplete campaign), non-quiet, Reward 85,000 CR, N = 0, THEN `net_payout = 85,000 CR` (full pay).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Use the authored contract values from `src/game/contracts.ts`; assert the GDD figures, not re-derived constants.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: formula arithmetic.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- Hollow Crown: Reward 62,000, 13 hits, optional +9,000 gives Collateral 62,000 and net 9,000
- Rust Haven at opening Standard: Reward 41,000, 8 hits, optional ignored gives Collateral 40,000 and net 1,000
- Pyrrhic non-quiet win (roster emptied, campaign incomplete), Reward 85,000, N = 0, pays 85,000

**Edge cases**:
- Read Reward from `src/game/contracts.ts`, not a copy
- Assert the GDD figures, not re-derived constants

**Existing coverage**: No test found naming Hollow Crown or Rust Haven in `appStore.test.ts` or `contracts.test.ts`. Pyrrhic is partly covered by `applyDebrief` > 'pyrrhic win (WN-018)'.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts`, describe "Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win (EC-008)" (3 tests)

---

## Dependencies

- Depends on: Story 007
- Unlocks: None

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all auto-verified by unit tests; `npx vitest run src/state/appStore.test.ts -t EC-008` ran 3 passed)
**Deviations**: ADVISORY — Implementation Notes point to `src/game/contracts.ts` for authored contract values, but the authored rewards (85,000 / 62,000 / 41,000) and optional defs live in `src/game/data.ts` (`MISSIONS`); the test reads them from there through `economySlice` (`src/game/deploy.ts`), so the intent (no copied constants, assert GDD figures) is met. The story's file pointer is stale.
**Test Evidence**: Logic: `src/state/appStore.test.ts`, describe "Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win (EC-008)" (3 tests)
**Run result**: N/A — test-only story; no player-visible surface changed
**Code Review**: Not confirmed in this step (lean mode; story-done ran unattended, default recorded: run /code-review before sprint close-out)
**Advisory**: QL-TEST-COVERAGE skipped — Lean mode.
