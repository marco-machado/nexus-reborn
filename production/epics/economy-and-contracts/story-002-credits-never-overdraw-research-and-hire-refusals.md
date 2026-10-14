# Story 002: Credits never overdraw: research and hire refusals

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: UI-only overdraft disable with a store that always subtracts.
- Forbidden: Clamping a negative Credits blob to 0 on hydrate.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN Credits 15,999 CR and a project listed at 16,000 CR, WHEN research is authorized, THEN it is refused, Credits stay 15,999 CR, and the project does not start.
- [x] GIVEN Credits 15,999 CR and a candidate listed at 16,000 CR, WHEN hire is authorized, THEN it is refused, Credits stay 15,999 CR, and the roster is unchanged.
- [x] GIVEN Credits 16,000 CR and a project listed at 16,000 CR, WHEN research is authorized, THEN it succeeds and Credits = 0 CR.
- [x] GIVEN Credits equal to a candidate's hire cost 16,000 CR, WHEN hire is authorized, THEN it succeeds and Credits = 0 CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Production Research path: re-read credits; if short, return; `if (start(node, t)) spendCredits(cost)` — do not invert to spend-then-start. `researchStore.start` is occupancy only.
- `hireOperative` is check → `acceptHire` → decrement; it does not call `spendCredits`.
- Credits refuse is an identity no-op (no subscriber wake on no-change). Hydrate drop-alls if `!finite(credits) || credits < 0`; do not clamp to 0.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: ledger basics.
- Research and Roster epics own the project/candidate lists.

---

## QA Test Cases

From `/qa-plan` sprint 3 (2026-10-13). Logic. Test file: `src/state/appStore.test.ts`.

**What to test**:
- At 15,999 CR a 16,000 CR project is refused: Credits, research and occupancy unchanged
- At 15,999 CR a 16,000 CR candidate is refused: Credits and roster unchanged
- At exactly 16,000 CR both succeed and Credits = 0

**Edge cases**:
- Order is check, start, then spend (do not invert)
- Refusal is an identity no-op (no subscriber wake)
- Hydrate drops credits that are non-finite or < 0

**Existing coverage**: Partly present: `hireOperative` ('blocks an overdraw without touching the roster') and `economy integration` ('refuses every unaffordable spend'). Check the exact-balance successes for research and hire.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/state/researchStore.test.ts`, `src/game/recruits.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/appStore.test.ts` › `Credits never overdraw (EC-002)`

---

## Dependencies

- Depends on: Story 001
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by unit tests in `src/state/appStore.test.ts` › `Credits never overdraw (EC-002)`; the file ran 88/88 passing at close)
**Deviations**: ADVISORY — ADR-0013 puts the research check → start → spend sequence in `Research.tsx`; it now lives in a new `appStore.authorizeResearch(node, t)` (CONTRACT FILE `src/state/appStore.ts`), and `Research.tsx` calls that. The order and refusal behaviour are the same, so it works the same way; the ADR's debit-site text and diagram should name the new action next time ADR-0013 is touched.
**Test Evidence**: Logic: test file at `src/state/appStore.test.ts`
**Run result**: OBSERVED — per the /dev-story checkpoint: Research AUTHORIZE on Adv. Propellants took Credits 128,450 → 112,450 CR and started the Ballistics lab with no console errors. No screenshot kept; none needed, because no AC names anything on screen.
**Code Review**: Pending — lean mode; this step could not confirm whether /code-review ran. Defaulted to "run /code-review before the sprint close-out" (autonomous run).
