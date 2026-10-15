# Story 019: crewBonus from applied ids

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
- Forbidden: Adding Experience into the research crew bonus.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN appliedNodeIds empty, WHEN crewBonus is computed, THEN (0, 0).
- [x] GIVEN appliedNodeIds = [Pain Inhibitor], THEN maxHp 14, speed 0; GIVEN [Synaptic Enhancement, Neural Cache Array], THEN maxHp 18, speed 0.55.
- [x] GIVEN Experience bonuses on a survivor, WHEN crewBonus is computed from appliedNodeIds, THEN Experience +2 HP / +0.05 m/s are not included.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- `createWorld` copies `roster.maxHp` / `roster.speed`; it does not re-run `crewBonus`, `xpBonus` or `tierSpeedDelta`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Roster epic owns Experience.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/game/research.test.ts`.
- Empty → (0, 0)
- [Pain Inhibitor] → maxHp 14, speed 0
- [Synaptic Enhancement, Neural Cache Array] → maxHp 18, speed 0.55
- Experience +2 HP / +0.05 m/s not included
- Edge: Float compare on speed (`toBeCloseTo`)

**Gap**: Probably test-only; check the exact AC values.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/research.test.ts` (describe "crewBonus from applied ids (RS-019)", 4 tests); 1038/1038 passing on 2026-10-14

---

## Dependencies

- Depends on: Story 014
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (all covered by automated tests in `src/game/research.test.ts`, describe "crewBonus from applied ids (RS-019)"; none deferred)
**Deviations**: None. Change is test-only in `src/game/research.test.ts`; ADR-0005 compliant; forbidden rule (Experience in the research crew bonus) respected.
**Test Evidence**: Logic: test file at `src/game/research.test.ts`. Full suite re-run at /story-done: `npx vitest run` 45 files, 1038/1038 passed on 2026-10-14.
**Run result**: N/A — pure game-layer logic test; nothing player-visible changed (from /dev-story checkpoint).
**Code Review**: Ran (/code-review on `src/game/research.test.ts`). Verdict: NOT ASSESSED — specialist agents (lead-programmer, gameplay-programmer, qa-tester) could not be spawned in the unattended subagent (no Agent tool). Self-run checks were clean, ADR-0005 COMPLIANT, no required changes, 71/71 in `src/game/research.test.ts`. Recommend re-running /code-review in a context that can spawn agents.
**QA gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Closure decision**: Autonomous mode; took default "Close the story (Recommended)". Not committed.

**Advisory findings (from /code-review)**:
- Review gap: Phase 7 specialist review never ran (no Agent tool); verdict NOT ASSESSED, not APPROVED.
- Estimate mismatch (owner's call, unresolved): story header says `Estimate: 0.5 d`; `production/sprint-status.yaml` RS-019 says `estimate_days: 0.1`.
- Evidence claim: the "1038/1038 passing" line was unverified at review time; /story-done re-ran the full suite and confirmed 1038/1038 on 2026-10-14.
- Redundant assertions: AC3 test's `.not.toBe(18 + xp.maxHp)` / `.not.toBeCloseTo(0.55 + xp.speed, 10)` add nothing beyond the exact `toBe(18)` / `toBeCloseTo(0.55)` checks; its last line repeats test 1. Valid as written; could be trimmed.
- Unrealistic fixtures: `['c-pain']` omits prerequisite `c-synaptic`; `['c-synaptic','c-cache']` omits `c-accelerator`/`c-weave`. Passes because `appliedNodeIds`/`currentIssue` do not check `needs`; would break if prerequisite checks are added. Listing prerequisites in `done` would make fixtures sturdier.
- Clean checks: AC values match data (c-pain +14 maxHp CHEST; c-synaptic +0.2 speed CHEST; c-cache +18 maxHp +0.35 speed NEURAL); `xpBonus(XP_PER_SURVIVE)` = {2, 0.05}; speed uses `toBeCloseTo`; no React/three.js/per-frame state.
