# Story 001: Credits ledger: opening balance, deposits and non-positive spends

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-001`, `TR-economy-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw  
**Secondary ADRs**: ADR-0008: Influence is a wallet; tax is Nexus income
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: `economyStore` holding Credits.
- Forbidden: A pure `tryDebit` helper in `src/game` for Credits.
- Forbidden: Chrome is not the guard: production must not `setState({ credits })` except hydrate.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN a new campaign, WHEN the Credits ledger is first read, THEN it is 128,450 CR.
- [ ] GIVEN Credits 0 CR, WHEN a Tax deposit of 1,000 CR applies, THEN Credits = 1,000 CR; GIVEN Tax amount A > 0, WHEN Economy deposits, THEN Credits increase by A; GIVEN A ≤ 0, THEN Credits are unchanged.
- [ ] GIVEN Credits 128,450 CR, WHEN a spend of 0 CR or of −1 CR is requested, THEN Credits stay 128,450 CR and no research or hire starts.
- [ ] GIVEN Credits 128,450 CR and `net_payout = 0 CR` already applied, WHEN Economy deposits Tax 1,000 CR, THEN Credits = 129,450 CR and `new_balance = 129,450 CR`.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Economy owns Credits; live home is `appStore.credits`; opening `INITIAL_CREDITS = 128450`.
- `spendCredits` refuses `amount <= 0` or overdraft as an identity no-op (`return s`); `addCredits` ignores non-positive.
- Tax deposit is the emitted amount — Economy never recomputes yield (World Network owns it).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: overdraft refusal and exact-balance spends.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 012
