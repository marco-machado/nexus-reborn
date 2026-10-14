# Story 001: Credits ledger: opening balance, deposits and non-positive spends

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

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
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a new campaign, WHEN the Credits ledger is first read, THEN it is 128,450 CR.
- [x] GIVEN Credits 0 CR, WHEN a Tax deposit of 1,000 CR applies, THEN Credits = 1,000 CR; GIVEN Tax amount A > 0, WHEN Economy deposits, THEN Credits increase by A; GIVEN A ≤ 0, THEN Credits are unchanged.
- [x] GIVEN Credits 128,450 CR, WHEN a spend of 0 CR or of −1 CR is requested, THEN Credits stay 128,450 CR and no research or hire starts.
- [x] GIVEN Credits 128,450 CR and `net_payout = 0 CR` already applied, WHEN Economy deposits Tax 1,000 CR, THEN Credits = 129,450 CR and `new_balance = 129,450 CR`.

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

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- New campaign reads 128,450 CR (`INITIAL_CREDITS`)
- `addCredits(A)` adds A for A > 0; 0 and negative leave Credits unchanged
- `spendCredits(0)` and `spendCredits(-1)` leave 128,450 CR and start no research or hire
- Tax deposit after a `net_payout = 0` apply gives 129,450 CR (Credits 128,450 + 1,000)

**Edge cases**:
- NaN / Infinity deposit: Credits unchanged (non-finite amounts never reach the ledger)
- Deposit of exactly 1 CR
- Spend of exactly the balance (zero result)

**Existing coverage**: Mostly present: `initial state`, `credits` (spendCredits, spend to exactly zero, ignores zero and negative, addCredits). Missing: the 129,450 CR case through the real Tax deposit (`depositTax` in `src/state/worldStore.ts`, no test names it).

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [x] Present — `src/state/appStore.test.ts` (`describe('Credits ledger (EC-001)')`)

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 012

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by unit tests in `src/state/appStore.test.ts`; `npx vitest run src/state/appStore.test.ts` ran 56/56 passed on 2026-10-14)
**Deviations**: None against TR-economy-001 / TR-economy-009 / ADR-0013. Advisory (resolved 2026-10-14): `addCredits(Infinity)` used to set Credits to Infinity. It now ignores non-finite amounts, following the GDD rule that a non-finite input never reaches the ledger; the EC-001 no-op test covers NaN and ±Infinity. Out of scope: the working tree also carries an unrelated edit to `.claude/skills/dev-story/SKILL.md` (removes `disable-model-invocation`), not part of this story.
**Test Evidence**: Logic: test file at `src/state/appStore.test.ts`
**Run result**: N/A — store logic with no new player-visible surface (from /dev-story checkpoint)
**Code Review**: Done 2026-10-14 — lead-programmer: APPROVED WITH SUGGESTIONS, no blocking findings (commits 6839a5b..a79bed1). qa-tester: INCOMPLETE → fixed: AC3's research/hire half was not exercised (only `spendCredits`); added a 0 / −1 CR research and hire test, `hireOperative` now refuses a non-positive cost, `addCredits` ignores ±Infinity.
