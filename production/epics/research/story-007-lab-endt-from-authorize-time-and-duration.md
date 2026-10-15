# Story 007: Lab endT from authorize time and duration

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Defining seconds-per-ETA-day in this system.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Advanced Propellants authorized at t = 0, WHEN the lab run is read, THEN endT = 7200; GIVEN it is authorized at t = 1000, THEN endT = 8200.
- [x] GIVEN Hypervelocity Core (4h) authorized at t = 0, THEN endT = 14400.
- [x] GIVEN each lab idle and all three 14h caps available, WHEN all three are authorized, THEN all three run and each endT = startedT + 50400.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `endT = startedT + duration × 3600` strategic seconds; durations come from the catalog.
- Strategic seconds per ETA day are not authored in Research; do not define one in tests.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: completion on sync.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/researchStore.test.ts`.
- Advanced Propellants at t = 0 → endT 7200; at t = 1000 → 8200
- Hypervelocity Core (4h) at t = 0 → 14400
- All three 14h caps from idle → each endT = startedT + 50400
- Edge: Hours come from `NODES`, not literals

**Gap**: Probably test-only.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/researchStore.test.ts` (describe "lab endT from authorize time and duration"); 25/25 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 008

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None. Test-only change; no production code touched. No seconds-per-ETA-day constant defined (`HOUR = 3600` is seconds per hour).
**Test Evidence**: Logic: `src/state/researchStore.test.ts` — `npx vitest run src/state/researchStore.test.ts` 25 passed on 2026-10-14
**Run result**: N/A — test-only story; no screen, store contract or runtime path changed, so nothing renders differently
**Code Review**: Complete (lean mode) — `/code-review` ran in the implement-stories workflow. Verdict: NOT ASSESSED for the specialist reviews (lead-programmer and qa-tester could not run: the workflow subagent has no Agent tool); otherwise APPROVED WITH SUGGESTIONS, no required changes.
**Closed by**: /story-done run unattended inside the implement-stories workflow; Phase 5 lean prompt answered "Yes — /code-review ran" with the result above; Phase 7 took the recommended "Close the story" option.

**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: Propellants t=0 → 7200; t=1000 → 8200 | researchStore.test.ts::Advanced Propellants authorized at t = 0 / t = 1000 | COVERED |
| AC-2: Hypervelocity Core t=0 → 14400 | researchStore.test.ts::Hypervelocity Core (4h) authorized at t = 0 ends at 14400 | COVERED |
| AC-3: three 14h caps, each endT = startedT + 50400 | researchStore.test.ts::all three 14h caps from idle labs run at once | COVERED |

**Advisory findings from /code-review**:
- Process gap: specialist reviews (lead-programmer, qa-tester) were not run — left as NOT ASSESSED, not passed. Reviewer read the diff, ran the test file (25 passed), `npx tsc -b` exited 0, ESLint printed nothing for the file.
- All three ACs covered; each case goes through `appStore.authorizeResearch` (src/state/appStore.ts:247), the Research screen path, so these are paid starts.
- QA edge case "Hours come from NODES, not literals" met: catalog hours asserted (2, 4, 14) and each endT checked against both the AC literal and `t + node.hours * HOUR`.
- ADR-0001 COMPLIANT: no strategic-time advance, no new clock; CLAUDE.md guardrails untouched.
- Test isolation sound: file-level beforeEach resets the research store; the new block saves/restores credits.
- Minor style: helper `authorize(node: typeof propellants, t)` — importing the `ResearchNode` type would read more clearly.
- Bookkeeping (Test Evidence status, AC checkboxes) — updated by this /story-done.
- `production/sprint-status.yaml` was modified outside the review targets (story status bookkeeping only).
- QL-TEST-COVERAGE skipped — Lean mode.
