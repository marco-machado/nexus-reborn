# Story 004: Accepting a contract is free; one pipeline for authored and generated work

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0003: Authored and generated contracts are the same kind of work  
**Secondary ADRs**: ADR-0013: Credits never overdraw
**ADR Decision Summary**: One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A second “story” pipeline for authored work.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Credits 128,450 CR, WHEN an authored or generated contract is accepted, THEN Credits stay 128,450 CR.
- [ ] GIVEN an authored contract accepted and played to a Win, THEN the Screens visited are Brief, Assembly, Mission, Debrief in that order; GIVEN a generated contract, THEN the same four in the same order.
- [ ] GIVEN Glass Veil already won, WHEN the director returns to the World Network, THEN Glass Veil remains selectable.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Authored and generated contracts are the same kind of work; type chooses the district family and objective set for both.
- `selectMission` does not debit Credits. Do not persist `committedFunds()` as a second ledger.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 021: campaign-complete flag.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Integration.*

**Test file**: `src/state/appStore.test.ts`

**What to test**:
- Accepting an authored or generated contract leaves Credits at 128,450 CR
- Screens visited end Brief, Assembly, Mission, Debrief in order for both kinds
- A won Glass Veil stays selectable

**Edge cases**: Backing out of a Brief does not charge; no second pipeline for authored work.

**Existing coverage / gap**: `selectMission` is ~L180 of `appStore.ts`; no test by that name today.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — Integration test beside `src/state/appStore.ts` / `src/game/contracts.test.ts` driving `selectMission` and the phase sequence. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 021
