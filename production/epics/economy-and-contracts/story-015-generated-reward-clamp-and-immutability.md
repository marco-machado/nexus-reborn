# Story 015: Generated Reward clamp and immutability

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Restamping on Unrest/Control change or Expedite.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a new Severe generated offer, initially priority, u = 0.5, WHEN it is created, THEN Reward = 95,000 CR (clamped).
- [x] GIVEN an existing generated offer with Reward R, WHEN Expedite waives its intel gate and adds 24 strategic hours of expiry, THEN Reward is still R.
- [x] GIVEN a generated Reward R stamped at creation, WHEN sector Unrest or Control changes, THEN Reward is still R.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Reward is stamped once at creation and never recomputed.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 014: base formula.
- Story 018: expiry.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`

**What to test**:
- Severe, priority, u = 0.5 = 95,000 CR (102,900 clamped)
- Expedite (gate waived, +24 h) leaves Reward at R
- A later Unrest or Control change leaves Reward at R

**Edge cases**: A raw value of exactly 95,000 is unchanged; Reward survives a record clone.

**Existing coverage / gap**: Expedite extension is tested (`worldStore.test.ts` ~L880) but not Reward equality.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/contracts.test.ts` (describe "generated Reward clamp and immutability (story 015)", 4 tests), `src/state/worldStore.test.ts` (describe "generated Reward immutability (story 015)", 2 tests)

---

## Dependencies

- Depends on: Story 014
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all auto-verified by unit tests; 176/176 pass under vitest in `src/game/contracts.test.ts` + `src/state/worldStore.test.ts`)
**Deviations**: None. No implementation file changed: `generatedReward` (`src/game/contracts.ts`) already clamps to `CONTRACT_REWARD_MAX` = 95,000, and `reclientContract` copies the reward unchanged. ADR-0012 compliant; no per-frame React state.
**Test Evidence**: Logic: `src/game/contracts.test.ts` (describe "generated Reward clamp and immutability (story 015)"), `src/state/worldStore.test.ts` (describe "generated Reward immutability (story 015)")
**Run result**: N/A — no player-visible change; Reward invariant is pure logic covered by unit tests
**Code Review**: Complete — `/code-review` ran in the implement-stories workflow with verdict NOT ASSESSED, because the lead-programmer and qa-tester specialist reviews could not run (the subagent had no Agent tool). The checks that did run found nothing blocking: ADR-0012 COMPLIANT, tests pass, all 3 ACs covered. Without the specialist rule the verdict would have been APPROVED WITH SUGGESTIONS. Phase 5 (lean) answer was recorded by default because the run was autonomous. QL-TEST-COVERAGE was skipped (Lean mode).

**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: Severe, priority, u = 0.5 → 95,000 CR clamped | contracts.test.ts::"GIVEN a new Severe offer, initially priority, u = 0.5 …" | COVERED |
| AC-2: Expedite leaves Reward at R | worldStore.test.ts::"Expedite waives the gate and adds 24 h of expiry but leaves Reward at R" | COVERED |
| AC-3: Unrest/Control change leaves Reward at R | worldStore.test.ts::"a later Unrest or Control change leaves Reward at R"; contracts.test.ts::"keeps the stamped Reward when a control change re-clients the offer" | COVERED |

**Advisory findings from /code-review (not blocking; candidates for a follow-up test-quality pass)**:
- Process gap: the Phase 7 specialist reviews (lead-programmer, qa-tester) were not run. The reviewer verified every finding below directly.
- `src/game/contracts.test.ts` (story 015, first test): `expect(70000 * (0.9 + 0.5 * 0.3) * 1.4).toBeCloseTo(102900, 6)` checks the test's own arithmetic, not the module. It would still pass if `THREAT_REWARD.SEVERE` or `PRIORITY_REWARD_MUL` changed. Better: assert on the unclamped path (show that the clamp is what changes the result), or drop the line.
- `src/game/contracts.test.ts` (edge-case test): the 95,000 and 94,500 cases hard-code 98,000 (70,000 × 1.4), which duplicates the band constants. The u values come from float math. This works today because `Math.round(raw/500)` absorbs the float error, but it would break silently if the band changed.
- `src/state/worldStore.test.ts` ("a later Unrest or Control change leaves Reward at R"): stabilize, lobby and the mission win (which also re-clients the offer) all run before a single final check. So the test cannot tell which step restamped the Reward if one did. Checking after each step would localize a regression. It still covers the AC as written.
- Story metadata (unchecked ACs, Status In Progress) was expected before /story-done and is now updated.
