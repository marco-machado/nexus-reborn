# Story 011: Role kits resolve from the operative role

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0009: Partitioned deploy snapshot  
**ADR Decision Summary**: Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create; the running mission never reads live stores.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: running mission reading live stores; worn ids on the Research slice.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** each of the 8 roles, **WHEN** that role’s kit is read, **THEN** it has exactly 1 active and 1 passive. Do not assert §8 effect rows here. *(GDD AC 42)*
- [x] **GIVEN** assigned operatives supplied through the established deployment inputs, **WHEN** each operative’s kit is resolved from its operative definition’s role, **THEN** it resolves to that role’s canonical 1 active and 1 passive (§8). This does not require active/passive identifier fields on the Roster slice. Q keypress execution is Tactical — do not AC it here. *(GDD AC 43)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Kit is resolved from the operative definition’s role through the established deployment inputs; no active/passive id fields on the Roster slice.
- Do not assert §8 effect rows; Q execution is Tactical.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Test file path**: `src/game/abilities.test.ts` or `src/game/data.test.ts`
**What to test**:
- Each of 8 roles has exactly 1 active and 1 passive (AC 1)
- Assigned operatives in deploy inputs resolve their kit from their definition's role (AC 2)

**Edge cases to cover**: a hired duplicate-role operative resolves the same kit. Do not assert §8 effect rows or Q keypress (Tactical).
**Estimated test count**: ~3 unit tests

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/abilities.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/abilities.test.ts` (`describe('role kits (RA-011)')`, 3 tests); `npx vitest run src/game/abilities.test.ts` 7/7 passing on 2026-10-15

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 2/2 passing (none deferred)
- AC 42 → `src/game/abilities.test.ts` › role kits (RA-011) › "gives each of the 8 roles exactly 1 active and 1 passive" — COVERED
- AC 43 → `src/game/abilities.test.ts` › role kits (RA-011) › "resolves each assigned operative kit from its definition role through the deploy inputs" — COVERED
- QA edge case (hired duplicate-role operative) → "resolves a hired duplicate-role operative to the same canonical kit" — COVERED
**Deviations**: None blocking. Advisory:
- TR-roster-002's current registry text ("Wear, Experience, items, mass, and mass tier freeze when the mission is created") does not name role kits; the story's TR mapping is loose. The implementation does not contradict it (the kit is resolved at create from the operative definition, and no kit field is added to the frozen Roster slice).
- `src/game/world.ts:332` and `src/game/world.ts:2228` still read `ROLE_ABILITIES[role]` directly while `src/game/world.ts:1849` uses `operativeKit(op)`. Same behavior; route per-operative lookups through `operativeKit` if it is meant to be the single seam. Role-constant reads (e.g. `ROLE_ABILITIES.support.passive`) can stay.
- AC 43 test resolves kits from the test's own `operatives` input and uses `headlessDeploy` only for `roster.ids` and the no-kit-keys check; it does not reach the `createWorld` ability-row path (`src/game/world.ts:1845-1850`). AC satisfied as written; an end-to-end assertion that `createWorld` per-agent ability rows carry `ROLE_ABILITIES[op.role]` ids would also guard that call site.
- `src/game/abilities.test.ts:63-72` repeats the 8 role literals on purpose, to pin the role set against the `AgentRole` union. No change needed.
- The duplicate-role test walks `rollCandidate` from a fixed seed (state=1, at most 200 iterations); it is deterministic and does not touch campaign RNG state.
**ADR-0009**: Compliant. `DeployParams` / `RosterSlice` (`src/game/deploy.ts`) gain no active/passive/kit fields; kit resolved via `operativeKit` (`src/game/abilities.ts`).
**Guardrails**: No per-frame allocation (single table lookup at world creation), no React state, `src/game/` stays pure TypeScript.
**Test Evidence**: Logic: test file at `src/game/abilities.test.ts` (7/7 passing via `npx vitest run src/game/abilities.test.ts`; `npx tsc -b` and eslint on the three files clean, per /code-review).
**Run result**: N/A — Logic story; kit data and resolver only, no visible surface changed.
**Code Review**: Complete with caveat — /code-review ran on `src/game/abilities.ts`, `src/game/world.ts`, `src/game/abilities.test.ts` and returned NOT ASSESSED because the lead-programmer / gameplay-programmer / qa-tester specialists could not be spawned from the workflow subagent. The direct review found no Required Changes (would otherwise be APPROVED WITH SUGGESTIONS). Re-running /code-review from a context that can spawn specialists remains open.
**Gates**: QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW skipped — Lean mode (/code-review answered above).
**Autonomous decisions**: Phase 5 lean-mode prompt answered "Yes — /code-review ran" with the result above; Phase 7 took "Close the story (Recommended)".
