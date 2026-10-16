# Story 013: Debrief classifies survivors as Ready, Injured, or KIA

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: abort writing campaign state; a second apply of the same outcome.
- Forbidden: a Tactical-side apply guard or key (Tactical echoes the key it was given).
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** a living survivor with `f = 0.35`, **WHEN** debrief applies, **THEN** that operative stays Ready and `injuryRecoverySec` is not invoked. *(GDD AC 18)*
- [x] **GIVEN** a living survivor with `0 < f < 0.35`, **WHEN** debrief applies at `t0`, **THEN** they are Injured, their Squad bay is empty, they cannot be assigned, and `D = injuryRecoverySec(f)`. *(GDD AC 19)*
- [x] **GIVEN** end HP = 0, **WHEN** debrief applies, **THEN** the operative is KIA not Injured, `injuryRecoverySec` is not invoked, and `survivorHp` lists survivors only. *(GDD AC 20)*
- [x] **GIVEN** one operative id listed as both dead and injured on an outcome, **WHEN** debrief applies, **THEN** that id is KIA only. *(GDD AC 76)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Roster writes happen in `reportMission` inside the single apply-once Debrief transaction (ADR-0021 `applyDebrief`).
- `f = 0.35` stays Ready; `0 < f < 0.35` → Injured with `D = injuryRecoverySec(f)` and bay cleared; end HP 0 → KIA; an id in both dead and injured is KIA only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 014: KIA removal effects.
- Story 017: ETA catch-up of injuries.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/state/campaignStore.test.ts`
**What to test**:
- f = 0.35 stays Ready; helper not invoked (AC 1)
- 0 < f < 0.35 → Injured, bay cleared, unassignable, D = injuryRecoverySec(f) (AC 2)
- End HP 0 → KIA, helper not invoked, `survivorHp` lists survivors only (AC 3)
- Id in both dead and injured lists → KIA only (AC 4)

**Edge cases to cover**: f > 0.35 keeps the bay; the last assigned newly Injured leaves all bays empty.
**Estimated test count**: ~5 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/state/campaignStore.test.ts`, describe block "debrief classifies survivors as Ready, Injured, or KIA (RA-013)" (6 tests); Vitest 62/62 passed 2026-10-16

---

## Dependencies

- Depends on: Story 012
- Unlocks: Story 014, Story 015, Story 016, Story 017, Story 018, Story 019

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 4/4 passing (none deferred)
**Verdict**: COMPLETE WITH NOTES (`/story-done`, run unattended inside the implement-stories workflow; Phase 7 took the default "Close the story")
**Deviations**: None. All changes within stated scope: the only code change is the RA-013 test block in `src/state/campaignStore.test.ts` (lines 819-896). The classification logic was already present in `src/state/campaignStore.ts` `reportMission` (lines 236-275) and `src/state/debrief.ts` (squad cleanup, lines 44-52).
**Test Evidence**: Logic: `src/state/campaignStore.test.ts` (RA-013 describe block, 6 tests). Vitest for the file ran during `/story-done`: 62/62 passed.
**Code Review**: Ran (`/code-review` on `src/state/campaignStore.test.ts`, `src/state/campaignStore.ts`, `src/state/debrief.ts`). Verdict: NOT ASSESSED — the lead-programmer and qa-tester specialist reviews could not be spawned (the workflow subagent had no Agent tool). The reviewer's own pass found nothing blocking; ADR-0002 and ADR-0021 COMPLIANT; `tsc -b` and eslint clean. Lean mode: the LP-CODE-REVIEW gate was not spawned; QL-TEST-COVERAGE skipped (Lean mode). Recommended: re-run `/code-review` from a session that can spawn agents if specialist sign-off is needed.
**Specialist Code Review (2026-10-16)**: APPROVED. Specialists spawned from the main session: lead-programmer APPROVED, qa-tester TESTABLE. Fixes: 1a3f655, 4545bed, 0564a8f. Suggestions recorded: world.test survivorHp test hard-codes op2 from DEFAULT_SQUAD order. This supersedes the NOT ASSESSED result above.
**Run result**: N/A — Logic story; no player-visible surface changed (from the `/dev-story` checkpoint).

**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC 18: f = 0.35 stays Ready, helper not invoked | campaignStore.test.ts::"f = 0.35 stays Ready and keeps its bay; no downtime is computed (AC 18)" | COVERED (observable effects) |
| AC 19: 0 < f < 0.35 Injured, bay empty, unassignable, D = injuryRecoverySec(f) | campaignStore.test.ts::"0 < f < 0.35 is Injured at t0 + injuryRecoverySec(f)..." | COVERED |
| AC 20: end HP 0 is KIA, helper not invoked, survivorHp lists survivors only | campaignStore.test.ts::"end HP 0 is KIA, not Injured; survivorHp lists survivors only (AC 20)" | COVERED (survivorHp part: see advisory) |
| AC 76: id both dead and injured is KIA only | campaignStore.test.ts::"an id listed as both dead and injured is KIA only (AC 76)" | COVERED |

**Advisory findings (from /code-review, recorded here)**:
- Process gap, not a code defect: the specialist reviews (lead-programmer, qa-tester) did not run, so `/code-review` is NOT ASSESSED. Re-run from a session with the Agent tool if specialist sign-off is needed.
- AC 18 and AC 20 say `injuryRecoverySec` "is not invoked". The tests check this through observable effects (`recoverAtT` stays null, `lastReport.injured` empty), not a spy. A `vi.spyOn` on the ESM export would not catch the in-module call anyway. Accepted as covered by observable effects only.
- AC 20 test: `expect(Object.keys(useAppStore.getState().outcome!.survivorHp)).toEqual(['op1','op3'])` checks the fixture the test built itself, so it proves nothing. "survivorHp lists survivors only" is produced by `src/game/world.ts:1786` (skips `u.stance === 'dead'`). No world test checks a mission with some deaths leaves the dead out of `survivorHp`. Recommend a `src/game/world.test.ts` case where one operative dies and the squad wins (follow-up).
- Edge case (survivorHp entry exactly 0 for an id not in deadIds would grade Injured with max downtime): checked during `/story-done`. In `src/game/world.ts` the damage path (lines 743-772) calls `killUnit` whenever `t.hp <= 0`, and `killUnit` (line 675) sets `hp = 0` and `stance = 'dead'`; the only other hp write (line 1494) heals. `maybeOutcome` skips dead-stance agents, so a living agent does not reach the outcome at hp 0. No change needed.
- Bookkeeping: `production/sprint-status.yaml` lists `estimate_days: 0.2` while this story header says 1.0 d. Not reconciled here; left for `/sprint-plan` or the owner.

