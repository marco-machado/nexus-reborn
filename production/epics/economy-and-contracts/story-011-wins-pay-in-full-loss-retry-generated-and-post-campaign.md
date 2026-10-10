# Story 011: Wins pay in full: loss-retry, generated and post-campaign

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-004`, `TR-economy-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0004: A won contract does not pay twice  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Depositing Credits in `setOutcome`.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Glass Veil not yet won after a loss and Credits 128,450 CR, WHEN the retry is won with 0 unique squad civilian hits (World Network apply not run), THEN Credits = 213,450 CR.
- [ ] GIVEN a generated win, Reward 54,500 CR, 0 unique squad civilian hits and optional bonus 0 CR, WHEN debrief applies, THEN Credits increase by 54,500 CR.
- [ ] GIVEN campaign-complete is true and a generated win under the same terms, THEN Credits increase by 54,500 CR.
- [ ] GIVEN Glass Veil already won as part of campaign-complete, WHEN a later win of Glass Veil debriefs, THEN `net_payout = 0 CR`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `applyDebrief` adds `netPayout` via `addCredits`; `setOutcome` never changes `credits`. Generated contracts have no replay.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: quiet-replay pricing.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts` (apply path with the World Network mutators stubbed). — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 010, Story 012
- Unlocks: None
