# Story 013: Abort writes nothing to Economy

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-008`, `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0012: Store placement for Intel and generated contracts
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Mid-mission persistence or resume.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a mission in progress on a generated contract that is Offered, Credits C CR, WHEN Abort is confirmed, THEN there is no debrief, no invoice is built, Credits stay C CR, and the generated record remains Offered.
- [ ] GIVEN a mission in progress on Glass Veil Unwon, Credits C CR, WHEN Abort is confirmed, THEN there is no debrief, no invoice is built, Credits stay C CR, and Glass Veil remains Unwon.
- [ ] GIVEN a mission already aborted, Credits C CR, WHEN Abort is confirmed again or teardown runs, THEN Credits stay C CR, the contract record and the apply-once key are unchanged, the record is not marked `unfiled`, and no ETA is set, so there is no Tax catch-up. *(GDD Edge Cases: If Abort; If mission is running.)*

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- An aborted or torn-down deploy burns its key and never applies. Abort does not mark `unfiled`.
- No performance impact expected: abort is a one-shot lifecycle path with no per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 004 owns the World Network half of abort.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Integration.*

**Test file**: `src/state/missionStore.test.ts`, `src/state/appStore.test.ts`

**What to test**:
- Confirmed Abort on an Offered generated contract: no outcome, no invoice, Credits C, record still Offered
- Confirmed Abort on an Unwon Glass Veil: same, still Unwon
- Second Abort or teardown after Abort: Credits, record and apply-once key unchanged; no `unfiled`; no ETA

**Edge cases**: Abort at t = 0; Abort after hits taken; a second Abort is a no-op.

**Existing coverage / gap**: Extends `missionStore.test.ts` ~L228 "abort leaves the World Network blob unchanged".

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/missionStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 012
- Unlocks: None
