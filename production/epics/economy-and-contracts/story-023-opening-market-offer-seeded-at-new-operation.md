# Story 023: One Moderate market offer is seeded at New Operation

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/economy-and-contracts.md` (Core Rule 11), `design/gdd/world-network.md` (Core Rule 10; Opening desk AC), living spec §9
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21): the market opened empty and the first roll landed two strategic hours in, so a paused new director saw only the authored markers.
**Change impact**: `docs/architecture/change-impact-2026-10-21-world-network.md` (notes D, E and "Purity and guard").

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**Secondary ADRs**: ADR-0018: Catch-up collision order; ADR-0011: Campaign persistence envelope; ADR-0003: One contract kind
**ADR Decision Summary**: Generated instances are owned by Economy and live on `worldStore.contracts` / `contractRngState` / `nextContractT`; catch-up is `advanceFlow` only; market RNG is campaign-blob content.
**ADR Version**: 2026-09-10 (ADR-0012 `## Date`); 2026-09-22 (ADR-0018); no `## Last Verified`

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 state; no post-cutoff API.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Required: World Event and generated-market RNG streams live in the campaign blob; `save.ts` is the only writer (ADR-0011).
- Forbidden: a t = 0 checkpoint inside `advanceFlow`, a new `Math.min` due input, or a new collision branch (ADR-0018).
- Forbidden: a second weighting rule in `contracts.ts`; the Secure restriction narrows the input list only.
- Guardrail: `src/game/contracts.ts` stays pure; `contractInputs` is module-private in `worldStore`.

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md` and `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN New Operation, WHEN `worldStore.contracts` is read before `t` advances, THEN exactly one generated instance is open; its sector's garrison is SECURE, its threat MODERATE, its required intel 1, and it carries the ordinary `GeneratedContract` keys (`CONTRACT_KEYS`).
- [ ] GIVEN two New Operations from the same build, WHEN their opening offers are compared, THEN they are identical (same id, sector, client, reward, seed, expiry), because the seed is drawn by stepping `contractRngState` from `INITIAL_CONTRACT_RNG`.
- [ ] GIVEN the seeded state, WHEN `nextContractT` is read, THEN it equals `INITIAL_NEXT_CONTRACT_T` (the first timed checkpoint is unchanged) and the cap of 3 counts the seeded offer.
- [ ] GIVEN an existing v10 campaign blob with its own market, WHEN it hydrates, THEN no offer is added. GIVEN a v3 blob, WHEN it upgrades, THEN its market is written empty as before (unseeded).
- [ ] GIVEN the seeded offer, WHEN it is selected and deployed, THEN it flows through brief → assembly → mission → debrief like any generated contract and leaves the market on fulfil or fail.
- [ ] GIVEN `atlas.ts` sector values, WHEN initial state is built, THEN a test asserts at least one open sector is SECURE, so a retune cannot leave `pickSector` with an empty list.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- One shared helper, for example `initialMarket(): { contracts, contractRngState, nextContractT }`, called from both literal sites: `useWorldStore` create (`src/state/worldStore.ts` around the `contracts: []` literal) and `startNewOperation` in `src/state/save.ts`. Without it the two drift (TD-CHANGE-IMPACT note D).
- The v3 → v4 upgrade in `save.ts` keeps writing `contracts: []` / `INITIAL_CONTRACT_RNG`; hydrate never seeds.
- Purity: either a pure `rollOpeningContract(inputs, state)` in `contracts.ts` that filters `garrison === 'SECURE'` before the existing `pickSector`, or filter in `worldStore` before calling `rollContract`. `pickSector` weights are untouched. SECURE → MODERATE (`contractThreat`) → intel gate 1 (`CONTRACT_INTEL_REQ`).
- Decided 2026-10-22 (owner): yes — the seed appends the usual "OPEN CONTRACT … POSTED" Feed line at t = 0, so `events` holds one entry and `unread` is 1 at New Operation. Test it explicitly; it must not happen by accident elsewhere.
- Fixtures shift: seeding steps `contractRngState` before the first checkpoint, so every later market roll in a new campaign changes. Golden values in `save.test.ts`, `worldStore.test.ts` and `contracts.test.ts` move. Determinism is preserved; say so in the commit body (note E).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network story 020: authored `intelReq` swap.
- Interface story 013: START HERE naming the open contract with the highest Chance.
- Guaranteeing a Moderate offer while intel < 2 (World Network open question, intel-1 stall): not approved; only the opening seed is.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, Logic:

- `src/state/worldStore.test.ts`: initial state holds one SECURE / MODERATE offer; two fresh stores agree on it; `nextContractT === INITIAL_NEXT_CONTRACT_T`; the first timed checkpoint still rolls at `CONTRACT_MIN_SEC` and the cap holds at 3.
- `src/state/save.test.ts`: `startNewOperation` produces the same offer as module init; a v10 fixture hydrates without an added offer; the v3 upgrade fixture stays empty.
- `src/game/contracts.test.ts`: the opening roll never picks a STRAINED or CRITICAL sector; at least one SECURE input exists at atlas defaults.
- `src/state/appStore.test.ts`: the seeded id selects, deploys (`canDeploy`) and leaves the market on a fulfilled outcome.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: passing test files beside the modules (`src/state/worldStore.test.ts`, `src/state/save.test.ts`, `src/game/contracts.test.ts`); the whole suite green.

**Status**: [ ] Not created

---

## Dependencies

- Depends on: none
- Unlocks: Interface story 013 (START HERE has a second low-threat target to name)

---

## Completion Notes
_(filled by `/story-done`)_
