# Story 020: Rust Haven opens at intel 1; Glass Veil and Hollow Crown at 2

> **Epic**: World Network
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 0.3 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/world-network.md` (Core Rule 7; Opening desk ACs), living spec §5 and §9 authored table
**Requirement**: `TR-world-network-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21): the only authored contract open at intel 1 was the Severe one (Chance 36); the Moderate one (Chance 82) opens first now.
**Change impact**: `docs/architecture/change-impact-2026-10-21-world-network.md` (every ADR Still Valid; note E).

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts
**Secondary ADRs**: ADR-0020: Campaign fail flags (`allWon` and `expectedWin` stay the three authored ids)
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore; `missionLocked(mission, intelLevel)` is the contract gate; authored contracts remain `MISSIONS` data.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Static data and pure TypeScript; no React or three.js API involved.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Required: Intel owner is World Network; live home `campaignStore.intelLevel`; the gate stays `missionLocked` (ADR-0012).
- Forbidden: a second intel ledger or a second lock rule in Interface or `appStore`.
- Guardrail: `src/game/data.ts` is a CONTRACT FILE; read its header before editing.

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [ ] GIVEN New Operation at intel 1, WHEN Scan / OPEN CONTRACTS is read before `t` advances, THEN Rust Haven is selectable and Glass Veil and Hollow Crown read locked (`missionLocked` true for m01 and m02, false for m03).
- [ ] GIVEN intel 2, WHEN the three authored contracts are read, THEN all three are selectable.
- [ ] GIVEN the authored table in living spec §9, WHEN `MISSIONS[].intelReq` is read, THEN m03 Rust Haven = 1, m01 Glass Veil = 2, m02 Hollow Crown = 2, and no other field of any authored contract changed.
- [ ] GIVEN a saved campaign at intel 1 with Glass Veil in `contractsWon`, WHEN it hydrates, THEN the blob is valid, Glass Veil reads locked for new deploys, and the campaign-complete record is unchanged (ADR-0020 `expectedWin` is the three ids, not the gate order).

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Change only the three `intelReq` values in `src/game/data.ts`. `missionLocked` (`src/state/campaignStore.ts`), `appStore.selectMission` and `WorldMap.tsx` read `intelReq` from data; no other non-test code names m01 or m03 (TD-CHANGE-IMPACT, 2026-10-21).
- Update the data table test and every lock assertion that assumed m01 open at intel 1 and m03 locked: `data.test.ts`, `campaignStore.test.ts`, `appStore.test.ts` and any WorldMap / Scan test fixture. These are fixture changes, not a determinism change; say so in the commit body.
- Do not touch intel awards (+40, +15 clean) or `INTEL_PROGRESS` (25). Difficulty-curve OQ 3 (one clean win to intel 2) is a separate decision.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Economy story 023: the seeded opening market offer.
- Interface story 013: the four-row orientation card and START HERE copy that names the open contract with the highest Chance.
- Any change to the Scan lock chrome itself (World Network story 014 owns hide/lock presentation).

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, Logic:

- `src/game/data.test.ts`: intelReq table pinned to 1 / 2 / 2 for m03 / m01 / m02.
- `src/state/campaignStore.test.ts`: `missionLocked` at intel 1 → m03 false, m01 and m02 true; at intel 2 → all false.
- `src/state/appStore.test.ts`: `selectMission('m01')` no-ops at intel 1; `selectMission('m03')` selects.
- `src/state/save.test.ts`: a v10 fixture at intel 1 with `contractsWon: ['m01']` validates and hydrates; `campaignWon` unchanged.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: a passing test file beside the module (`src/game/data.test.ts`, `src/state/campaignStore.test.ts`); the whole suite green.

**Status**: [ ] Not created

---

## Dependencies

- Depends on: none
- Unlocks: Interface story 013 (START HERE copy assumes Rust Haven is open at intel 1)

---

## Completion Notes
_(filled by `/story-done`)_
