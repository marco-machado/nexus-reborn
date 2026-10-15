# Story 001: Program catalog, costs and fundability gap

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Unique implants or an equipment locker.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN a new campaign, WHEN the Research program is listed, THEN there are 3 laboratories, 7 projects each, 21 total.
- [x] GIVEN the cost rows in GDD §7, WHEN branch and program costs are summed, THEN 248,000 / 261,000 / 270,000 / 779,000 CR.
- [x] GIVEN the §7 cost rows and the §6 Credits rows (opening 128,450 CR, one clean authored pass 203,000 CR), WHEN the program gap is computed, THEN it is 447,550 CR; and GIVEN minimum-reward generated offers (30,500 CR each), WHEN 15 such wins are applied, THEN they fund the gap (15 × 30,500 = 457,500 ≥ 447,550). This pins the predicate only; pacing ownership stays Economy / World Network.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Three laboratories — Ballistics, Cybernetics, Control Systems — seven projects each. Ballistics is unslotted and squad-wide; Cybernetics and Control Systems are slotted blueprints.
- Read the reward formula from its oracle (living spec §9 / `contracts.ts`); do not paste the table.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: prerequisite states.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/game/research.test.ts`.
- 3 laboratories, 7 projects each, 21 total
- Branch sums 248,000 / 261,000 / 270,000 CR; program 779,000 CR
- Gap = 779,000 − 128,450 − 203,000 = 447,550 CR; 15 minimum generated wins (15 × 30,500 = 457,500) fund it; 14 do not (427,000)
- Edge: Read 128,450 from `INITIAL_CREDITS` and 30,500 from the contracts floor, not pasted literals

**Gap**: Exact 21 / 248,000 / 261,000 / 270,000 / 779,000 asserted? Confirm; the fundability predicate (447,550 gap, 15 × 30,500) has no test.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/research.test.ts` (40/40 pass, `npx vitest run src/game/research.test.ts`, 2026-10-14). `src/state/researchStore.test.ts` not needed for this story (no store behaviour in scope).

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 004

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None
**Test Evidence**: Logic: `src/game/research.test.ts` — AC1 at :284-289 (3 labs, 7 each, 21 total); AC2 at :269-271 plus the 779,000 assertion; AC3 in the `program fundability gap` describe block at :362-387 (gap 447,550; 15 x 30,500 = 457,500 >= gap; 14 x 30,500 = 427,000 < gap). 128,450 read from `INITIAL_CREDITS`, 30,500 from `generatedReward('MODERATE', 0, false)`. The QA plan's "fundability predicate has no test" gap is closed.
**Run result**: N/A — test-only change to static catalog assertions; no player-visible surface changed.
**Code Review**: Complete (lean mode; /code-review ran). Verdict NOT ASSESSED: the lead-programmer and qa-tester specialists could not be spawned (no Agent tool in the workflow subagent); all phases reviewed directly with no blocking defects. ADR-0005 COMPLIANT; Standards 6/6; Architecture CLEAN; tsc and eslint clean. Re-run /code-review where specialists can be spawned.
**QL-TEST-COVERAGE**: skipped — Lean mode.
**Autonomous decisions**: lean-mode code-review prompt answered "Yes — /code-review passed or was approved with suggestions"; Phase 7 took "Close the story (Recommended)".

**Advisory findings (from /code-review)**:
- `src/game/research.test.ts:368` assumes MODERATE is the lowest reward tier without asserting it (true today: MODERATE 34000 < HIGH 52000 < SEVERE 70000). Suggest asserting `minWin <= generatedReward(t, 0, false)` for every threat.
- `src/game/research.test.ts:364` hardcodes `AUTHORED_CLEAN_PASS = 203000` (85k+62k+9k+41k+6k). Allowed by the story edge case and GDD research.md:308 (derived constant, no code owner); could be computed from authored contract data if an owner emerges.
- `src/game/research.test.ts:22` imports `INITIAL_CREDITS` from the Zustand store module (CONTRACT FILE), creating stores as a side effect. Follows existing practice (contracts.test.ts:39) and is test-only; a pure constants module would keep src/game tests free of the state layer.
- Specialist review (lead-programmer, qa-tester) did not run; see Code Review above.
