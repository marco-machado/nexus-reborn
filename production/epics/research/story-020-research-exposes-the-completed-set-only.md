# Story 020: Research exposes the completed set only

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Computing Chance, Risk index or Event forecast in Research.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN done = [Advanced Propellants, Neural Interface I] as the completed-set export and Neural pinned STOCK, WHEN strategy presentation evaluates Chance, THEN `missionChance` receives researchedCount = 2 from the full completed program, not the worn or unslotted-only count.
- [x] GIVEN fixed deployment patrol, garrison and civilian counts, enemy toughness and clearer-weather visibility, WHEN done changes from empty to [Advanced Propellants, Neural Interface I], THEN `missionRisk` returns the same Risk index and band.
- [x] GIVEN Research's public API, WHEN its exports and returned state are enumerated, THEN it exposes no Chance, Risk-index or Event-forecast computation or number.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Oracles: `src/game/missionParams.ts`, `src/game/forecast.ts`, `design/gdd/tactical-mission.md` `risk_index`. Mapping of completed nodes to authored chance is Tactical / Brief's; Research exposes the completed set only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Brief and Tactical epics own those computations.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Integration.*

**Automated**: `src/game/missionParams.test.ts`; `src/game/forecast.test.ts`; `src/game/research.test.ts`.
- done = [Propellants, Interface I], Neural STOCK → `missionChance` gets researchedCount 2
- done empty → [Propellants, Interface I] leaves `missionRisk` index and band unchanged
- Research exports contain no Chance, Risk or Event-forecast computation
- Edge: Count is the full completed program, not worn or unslotted-only

**Gap**: Unknown; check what count reaches `missionChance`.

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/game/missionParams.test.ts`, `src/game/research.test.ts`, `src/game/forecast.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/missionParams.test.ts` (3), `src/game/forecast.test.ts` (1), `src/game/research.test.ts` (3)

---

## Dependencies

- Depends on: Story 008
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)

| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: `missionChance` receives researchedCount = 2 from the full completed program | `src/game/missionParams.test.ts` › chance reads the full completed program (RS-020) | COVERED |
| AC-2: `missionRisk` index and band unchanged when done changes | `src/game/forecast.test.ts` › mission risk ignores the completed program (RS-020) | COVERED |
| AC-3: Research exposes no Chance, Risk-index or Event-forecast computation | `src/game/research.test.ts` › Research exposes the completed set only (RS-020) | COVERED |

**Deviations**: None against GDD `design/gdd/research.md` (rule 11, AC lines 290-292), TR-research-004 or ADR-0009. Test-only change; no source touched.
**Test Evidence**: Integration: tests beside the module at `src/game/missionParams.test.ts`, `src/game/forecast.test.ts`, `src/game/research.test.ts` (present; 101/101 passed under vitest on 2026-10-14).
**Run result**: N/A — test-only story; no source or screen change (callers already pass `done.length`).
**Code Review**: Complete — `/code-review` ran on the three test files. Verdict NOT ASSESSED: the lead-programmer and qa-tester specialist reviews could not be spawned (no Agent tool in that subagent). Self-checks were clean: no Required Changes, 101/101 tests pass, `tsc -b --noEmit` and eslint clean, ADR-0009 compliant. Read alone, APPROVED WITH SUGGESTIONS. Re-run `/code-review` from a context that can spawn agents to clear NOT ASSESSED.
**QL-TEST-COVERAGE**: skipped — Lean mode.

**Advisory findings (from /code-review, not blocking):**
- `src/game/missionParams.test.ts:257-268` (AC1) is tautological: it computes `useResearchStore.getState().done.length` itself and passes it to `missionChance`, so it never exercises the screen call sites. Those sites pass the full count today (`researched.length` at `src/ui/index.tsx:323`, `src/ui/WorldMap.tsx:275` and `:966` via `chanceFor`), so AC1 holds, but a regression to the worn or applied count would still pass. Suggestion: export `chanceFor` (`src/ui/WorldMap.tsx:91-96`) or a shared Brief helper and test that.
- `src/game/forecast.test.ts:121-140` (AC2) toggles the research store without effect, since `riskFor` never reads `useResearchStore`. The AC holds structurally (Brief `tac` counts at `src/ui/index.tsx:324-335` and `missionMods` take no research input; `missionRisk` called at `src/ui/index.tsx:541-544`), but the test would not catch research being wired into risk inputs later.
- `src/game/research.test.ts:686-715` (AC3) matches export and key names against `/chance|risk|forecast/i` only; a Chance-like computation under another name (e.g. `successOdds`, `threatBand`) would pass. No such export exists today.
- Test hygiene: `src/game/forecast.test.ts:138` resets `done` at the end of the test body, not in `afterEach`/`finally`, so a failed assertion leaves the store dirty. The describe at `src/game/missionParams.test.ts:249` sets `done` in `beforeEach` without a reset; it is the file's last describe, so nothing leaks today.
- Story QA Test Cases "Automated" line named only two test files; aligned at close to include `src/game/research.test.ts`.
- Estimate mismatch: story header says 1.0 d; `production/sprint-status.yaml` says `estimate_days: 0.3`. Left as-is for the owner to reconcile.

**Autonomous-mode decisions**: lean-mode code-review prompt answered "Yes — /code-review ran" with the result above; Phase 7 took "Close the story (Recommended)"; advisory findings recorded here, not logged to `docs/tech-debt-register.md`.
