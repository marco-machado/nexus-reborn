# Story 012: Debrief Credits apply once; no Credits move during a mission

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-008`, `TR-economy-010`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0021: Outcome DTO and apply-once key  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: One apply key per deploy; applyDebrief applies an outcome iff its key exceeds lastAppliedKey.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Minting the key outside the composer.
- Forbidden: A Credits-only guard or per-owner keys.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Credits 128,450 CR and a non-quiet win outcome with key K and `net_payout` 75,000 CR, WHEN that same outcome is applied twice, THEN Credits = 203,450 CR (the second apply is a no-op).
- [ ] GIVEN an outcome with key K already applied, WHEN an outcome carrying the same key K is applied again, THEN Credits stay at their post-first-apply value; GIVEN a different (higher) key, THEN it applies.
- [ ] GIVEN Credits C CR at deploy, WHEN the mission is still running, THEN Credits stay C CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- A key applies iff `outcome.applyKey > lastAppliedKey`; keys only increase. The key is minted once per deploy by the `MissionScreen` composer, stamped on the Economy slice as `applyKey`, and echoed on the outcome.
- `applyDebrief` is the only caller of the Debrief owner mutators; Credits move only there.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 003: whole-transaction ordering.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Integration. Test file: `src/state/appStore.test.ts`.

**What to test**:
- Same outcome applied twice with key K and `net_payout` 75,000: 203,450 CR (second is a no-op)
- Same key K again: unchanged; a higher key applies
- Credits at deploy C stay C while the mission runs

**Edge cases**:
- Stray older or equal key applies nothing
- Tax deposit under the same key is also single-shot
- No outcome present: nothing applies

**Existing coverage**: Mostly present: `applyDebrief apply-once` > 'Credits sit under the same key', 're-entering with the same key', 'a stray older or equal key'. Missing: Credits flat during the running mission.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 013
