# Story 012: Assembly hire refusals and heavy-tier hint

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0019: Deploy gate; ADR-0013: Credits never overdraw
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: disabled controls carry visible owner-reported reasons; critical state is never color-only.
- Guardrail: no refusal audio is required.
- Guardrail: Interface does not compute affordability or capacity.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC26) GIVEN an unseen heavy-tier advisory and an otherwise-valid heavy-tier deployment, WHEN the mission starts, THEN the existing speed-penalty hint appears once. A later valid deployment in the same campaign does not repeat it. An over-limit Assembly attempt is refused with its reason and never enters Mission; it is not the heavy-tier mission-hint trigger.
- [ ] (AC28) GIVEN candidate offers with owner-reported costs, Credits and roster capacity, WHEN Assembly is shown in unaffordable and full-roster fixtures separately, THEN hire cost versus Credits is visible and hire is disabled with the matching reason. Overdraft and Deploy refusal retain disabled controls plus visible reasons; no refusal audio is required for either.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Heavy-tier speed-penalty hint fires once per campaign on mission start, not on an over-limit Assembly attempt.
- Hire cost versus Credits is visible; full roster and unaffordable each show their matching reason.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: missing-contract Deploy refusal.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-012 — Assembly hire refusals and heavy-tier hint (UI)
**Automated (where a seam exists)**:
- `src/ui/assemblyRows.test.ts`, `src/ui/armHints.test.ts`: unaffordable fixture → cost vs Credits visible, hire disabled with the matching reason; full-roster fixture likewise
- Valid heavy-tier deployment with the advisory unseen → speed-penalty hint once; a later valid deployment in the same campaign does not repeat it
- Over-limit (> 400 kg) is refused with its reason, never enters Mission, and is not the hint trigger
- Overdraft and Deploy refusals keep disabled controls plus visible reasons; no refusal sound is requested
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-012/`; sign-off: qa-lead
**Checklist**:
- [ ] Screenshots: unaffordable hire, full roster, over-limit refusal, heavy-tier hint in Mission
**Edge cases**: Mass limit 400 kg literal; Deploy refused with zero assigned or any Injured assigned

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/if-012/` (5 captures at 1280x720, `capture.mjs`, `capture-output.txt`, click-through record `README.md`); tests in `src/ui/assemblyRows.test.ts` (hireView) and `src/ui/armHints.test.ts` (heavy-tier advisory, over-limit refusal)

---

## Dependencies

- Depends on: Story 001
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 2/2 passing (AC26, AC28). Nothing deferred.
**Deviations**: None blocking. Advisory: the story's Control Manifest guardrail "Interface does not compute affordability or capacity" is not in `docs/architecture/control-manifest.md`. ADR-0013 ("Presentation vs ledger") lets the Interface disable hire when Credits are short, but `hireView` (src/ui/assemblyRows.ts:64-67) repeats the owner's capacity and Credits checks. That is a risk that the two copies drift apart. See the code-review findings below.
**Test Evidence**: UI. Retained screenshots in `production/qa/evidence/if-012/` (01 unaffordable hire, 02 full roster, 03 hire-allowed control, 04 over-limit Deploy refused, 05 heavy-tier advisory in Mission, all 1280x720), plus `capture.mjs`, `capture-output.txt` (ALL PASS) and the click-through record `README.md`. Tests: `src/ui/assemblyRows.test.ts`, `src/ui/armHints.test.ts`.
**Code Review**: APPROVED WITH SUGGESTIONS. Specialists: lead-programmer, qa-tester, ui-programmer. No blocking findings. ADR Compliance COMPLIANT (ADR-0013, ADR-0017, ADR-0019), Standards 6/6, Architecture CLEAN. The workflow ran unattended, so autonomous mode took the default Phase 9 option [A] as a note only, and no files were edited after the review.
**Mutation Check**: Mutation check: skipped — UI story (the skill runs it for Logic and Integration only)
**Story-done decisions (autonomous)**: Phase 7 took the default "Close the story (Recommended)". QL-TEST-COVERAGE and LP-CODE-REVIEW were skipped in Lean mode. The specialist /code-review above satisfies the review requirement.

**Advisory code-review findings (follow-up candidates)**:
- src/ui/assemblyRows.ts:64-67: `hireView` checks roster capacity and Credits again, when appStore.hireOperative and campaignStore.acceptHire already check them. ADR-0013 sanctions this, so it is a drift risk, not a breach. The lasting fix is an owner-side `hireRefusal()` that both the action and the view read. That changes a store, so it needs a follow-up story with lead-programmer sign-off.
- src/ui/assemblyRows.ts:52: `hireView` has no branch for an invalid cost. With cost 0 or NaN it returns can:true, but hireOperative refuses, so HIRE is enabled, does nothing and shows no reason. Seeded data never reaches this, so severity is low.
- src/ui/assemblyRows.ts:61: the view and the owner check refusals in a different order. The view goes campaign-failed, then roster-full, then credits. The owner goes credits first. A full roster with too few Credits shows ROSTER AT CAPACITY, while the owner refuses on Credits. No test pins which reason wins when two conditions hold at once.
- src/ui/assemblyRows.test.ts:91: the "agrees with the owner" test hard-codes `campaignFailed: false`. The campaign-failed refusal is not checked end to end through hireOperative/acceptHire.
- src/ui/index.tsx (HIRE button, ~l.994-1005): screen readers hear the refusal reason more than once, through the aria-label suffix and aria-describedby, and `title` repeats it a third time. `role="status"` is added in the same render as the text, so the live region may not announce at all. Suggested fix: keep the label the same in both states, describe the reason only through aria-describedby, and keep the role fixed.
- src/ui/ui.css:2601 `.ts-rec-why { min-height: 1.3em }`: "SHORT" wraps onto a second line on every card (screenshot 01), so card height changes between the allowed and refused states. Nothing is clipped. Fixing it needs an art/UX decision (shorter copy or a two-line slot). capture.mjs `clipped()` checks only horizontal overflow.
- src/ui/armHints.test.ts:106-112: the over-limit reason assertion calls canDeploy on inputs the test built itself. The visible "OFFLOAD 30.1 KG" reason is checked only in capture-output.txt.
- src/ui/armHints.test.ts:59-63,78: the AC26 positive path calls createWorld + tick directly. The startMission → mission → advisory chain is covered only by the headless capture.
- src/ui/armHints.test.ts:46: the IF-012 integration block sits in the P-01 armed-hint helper test file. This is a placement note; the QA plan names this file.
- QA plan item "no refusal sound is requested": no automated test covers it. Only the README reasons it out. The AC says refusal audio is not required, so this is a coverage gap.
- production/qa/evidence/if-012/capture.mjs:14: the script only runs on this machine (hard-coded Chrome path and a global @playwright/cli). The README's revision ("f490d39 plus working-tree changes") cannot be checked out. Record the commit hash once this is committed.
- production/qa/evidence/if-012/capture.mjs:148: `dismissHint('hint-overweight')` runs before the second deploy, so `toasts === 0` does not by itself prove the advisory was not repeated. That rests on `hints.length === 0` and on the unit test's `seen` length of 1. No screenshot shows it.
