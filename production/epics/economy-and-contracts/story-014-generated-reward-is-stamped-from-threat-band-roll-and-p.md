# Story 014: Generated Reward is stamped from threat band, roll and priority

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0003: Authored and generated contracts are the same kind of work
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Creating `src/state/economyStore.ts`.
- Forbidden: Putting generated instances beside Credits on `appStore`.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a new High generated offer, u = 0.5, not initially priority, WHEN it is created, THEN Reward = 54,500 CR.
- [ ] GIVEN a new High offer, u = 0.5, initially priority, THEN Reward = 76,500 CR.
- [ ] GIVEN a new Moderate offer, u = 0, not initially priority, THEN Reward = 30,500 CR.
- [ ] GIVEN a new Moderate offer, u = 0.75, not initially priority, THEN Reward = 38,500 CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Generated instances live on `worldStore.contracts` / `contractRngState` / `nextContractT`; Economy owns them (ADR-0012). The formula and constants are GDD §Formulas / code — assert the GDD figures only.
- Candidate/generated RNG streams live in the campaign blob; keep generation deterministic.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: clamp and immutability.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts`

**What to test**:
- High, u = 0.5, not priority = 54,500 CR
- High, u = 0.5, priority = 76,500 CR
- Moderate, u = 0 = 30,500 CR; Moderate, u = 0.75 = 38,500 CR
- Reward is a field stamped at creation

**Edge cases**: u = 0 and u near 1 stay in 30,000-95,000; priority multiplies once; same seed gives the same Reward.

**Existing coverage / gap**: `rollReward` is private and only "same Threat pays the same" is tested today. Drive it through `rollContract` with a seeded cursor.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 015
