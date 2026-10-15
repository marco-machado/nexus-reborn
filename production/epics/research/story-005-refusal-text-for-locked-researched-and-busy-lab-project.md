# Story 005: Refusal text for locked, researched and busy-lab projects

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw  
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A reason enum or exported reason type.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN Hypervelocity Core locked and Ballistics idle, WHEN it is authorized, THEN eligibility returns before `start()` and before `spendCredits` even if balance ≥ cost, Ballistics stays idle, it stays locked, Credits are unchanged, and the refusal text contains the catalog title, the string Advanced Propellants, and a credits-unchanged phrase; the inspected detail names the locked state and the unmet prerequisite and does not imply a charge was attempted.
- [x] GIVEN Ballistics running Advanced Propellants and Tungsten Sabot locked with Rail Stabilization and Smart Fragmentation both unmet, WHEN Tungsten Sabot is authorized, THEN eligibility returns before `start()` and `spendCredits`, Credits are unchanged, and the refusal text contains the catalog title and both prerequisite names at text indices before the lab-not-idle phrase, and a credits-unchanged phrase.
- [x] GIVEN Advanced Propellants researched and Ballistics idle, WHEN it is authorized, THEN eligibility returns before `start()` and `spendCredits`, it stays researched, Credits are unchanged, and the refusal text contains an already-researched phrase and a credits-unchanged phrase; the inspected detail says it is already researched.
- [x] GIVEN Ballistics running Advanced Propellants and Barrel Wear Coating available, WHEN Barrel Wear Coating is authorized, THEN eligibility returns before `start()` and `spendCredits`, Barrel Wear Coating stays available, Credits are unchanged, and the refusal text contains a lab-not-idle phrase and a credits-unchanged phrase.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Eligibility is checked before `start()` and before `spendCredits`; Research emits no spend on a refusal.
- 'No reason enum' is a static source check (no exported reason enum or type), not a runtime assertion.
- The refusal sentence is composed per GDD UI Requirements; Interface owns paint, not the content rule.

---

- **Decided 2026-10-14 (owner, retro task R-5):** the production authorize command is `appStore.authorizeResearch(node, t)` in `src/state/appStore.ts` (ADR-0013 amended; `design/gdd/research.md` Core Rule 3 updated). Tests go in `src/state/appStore.test.ts`.

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: remaining eligibility cases.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/appStore.test.ts`.
- Locked Hypervelocity Core: refusal contains the title, `Advanced Propellants`, and a credits-unchanged phrase; no `start`, no spend, even with balance ≥ cost
- Tungsten Sabot locked on a busy lab: both prerequisite names appear before the lab-not-idle phrase
- Researched Advanced Propellants: already-researched phrase + credits-unchanged phrase
- Barrel Wear Coating on a busy lab: lab-not-idle phrase + credits-unchanged phrase
- Edge: Assert substrings and index order, not whole sentences
- Edge: Inspected detail for locked does not imply a charge

**Gap**: **Source change.** Authorize must return a refusal (text) before `start` and before `spendCredits`.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: unit tests for the production authorize command — `src/state/appStore.test.ts` (describe "Refusal text for locked, researched and busy-lab projects (RS-005)"), per the owner decision of 2026-10-14 above. Supporting changes covered in `src/game/research.test.ts` and `src/state/researchStore.test.ts`.

**Status**: [x] Created — 8 RS-005 tests in `src/state/appStore.test.ts`, passing (vitest run 2026-10-14)

---

## Dependencies

- Depends on: Story 003, Story 004
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (all covered by unit tests in `src/state/appStore.test.ts`; none deferred)
**Verdict**: COMPLETE WITH NOTES (closed unattended in the implement-stories workflow; Phase 7 default "Close the story" taken)

**Test-Criterion Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1 locked Hypervelocity Core | `src/state/appStore.test.ts` — "locked Hypervelocity Core on an idle lab ..." + "inspect of locked Hypervelocity Core ..." | COVERED |
| AC-2 Tungsten Sabot locked, busy lab | `src/state/appStore.test.ts` — "Tungsten Sabot locked on a busy Ballistics lab ..."; screenshot `production/qa/evidence/story-005-refusal-text/01-tungsten-sabot-locked-busy-lab-inspect.jpg` (inspect text) | COVERED |
| AC-3 researched Advanced Propellants | `src/state/appStore.test.ts` — "researched Advanced Propellants on an idle lab ..." + "inspect of researched Advanced Propellants ..." | COVERED |
| AC-4 Barrel Wear Coating, busy lab | `src/state/appStore.test.ts` — "available Barrel Wear Coating on a busy Ballistics lab ..."; screenshot `production/qa/evidence/story-005-refusal-text/02-barrel-wear-coating-lab-not-idle-inspect.jpg` (inspect text) | COVERED |

**Test Evidence**: Logic — `src/state/appStore.test.ts` (8 RS-005 tests pass; full suite 967 passing, eslint and `tsc -b` clean per /code-review). Run result: OBSERVED — screenshots 01 and 02 under `production/qa/evidence/story-005-refusal-text/`.
**Code Review**: Complete — /code-review ran in this workflow. Verdict NOT ASSESSED (the specialist agents lead-programmer, ui-programmer, gameplay-programmer and qa-tester could not be spawned: no Agent tool in the subagent). Nothing found that must change; with the specialist step set aside it would be APPROVED WITH SUGGESTIONS. QL-TEST-COVERAGE skipped — Lean mode.

**Deviations / advisory findings (from /code-review and story-done)**:
- Specialist and QA reviews did not run (no Agent tool). Re-run /code-review from a session that can spawn agents to close the gap.
- ADR drift: `docs/architecture/adr-0013-credits-never-overdraw.md` listed `authorizeResearch(node, t): boolean`; code returns `{ ok: boolean; text: string }` (`src/state/appStore.ts:181`, CONTRACT FILE). Not a forbidden pattern (inline type, no exported reason type). ADR signature lines amended 2026-10-14 at story-done to match.
- Stale spec text: `design/gdd/research.md` Core Rule 3 and the Authorization row still said the mismatch sentence was "not yet shown (Story 005)" / "Unsatisfied in code". Cleared at story-done 2026-10-14.
- Coverage gap (UI surface): the mismatch-undo panel behaviour in `src/ui/Research.tsx` DetailPanel (replaces state text, persists until next attempt or state change via labs/done identity, visible when Authorize disabled) has no test and no screenshot; traced by hand in review. Story ACs only require store text.
- The authorize-attempt refusal text is not reachable from the screen today (button `disabled={!can}`, `src/ui/Research.tsx:373`); players see only the inspect text. Allowed by the GDD ("every authorize the director can attempt"); that surface is covered only by `src/state/appStore.test.ts`.
- Story bookkeeping: Test Evidence section updated here to name `src/state/appStore.test.ts`, per the owner decision.
- Evidence screenshots cover only Tungsten Sabot (locked, busy lab) and Barrel Wear Coating (lab not idle) inspect text; no charge wording in either. Locked Hypervelocity Core and researched Advanced Propellants inspect are covered by unit tests only.
- Positive: eligibility is checked before the balance read, `start()` and `spendCredits`; refusals make no app-store writes (asserted `writes===0`, `calls===[]`); causes in GDD order; no exported reason enum or type; tests assert substrings and index order.
- Scope: `src/game/research.ts` gained a catalog full name for Advanced Propellants (ADVANCED PROPELLANTS) used in the refusal text; `src/state/researchStore.ts` and `src/ui/Research.tsx` touched for inspect text and the panel. All within the authorize/refusal surface.
- Untested criteria: none.

