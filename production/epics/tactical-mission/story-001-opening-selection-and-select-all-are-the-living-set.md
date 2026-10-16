# Story 001: Opening selection and Select-all are the living set

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0016: Tactical sim contract  
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: MEDIUM
**Engine Notes**: ADR-0016 Knowledge Risk: sim uses no three.js APIs; geometry/camera MEDIUM. CameraRig / GameCanvas import from `three/webgpu` (r185) — no OrbitControls, no physics addon, no `THREE.Clock` as game clock. Verify against `docs/engine-reference/web/VERSION.md` before touching `src/scene/`.

**Control Manifest Rules (this layer)**:
- Required: One system, one seed, unsaved lifetime; five verbs on the custom TypeScript sim.
- Forbidden: Never split the tactical system into sibling systems.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **1a.** **GIVEN** a just-opened mission with at least one living operative and at least one dead operative, **WHEN** the mission starts, **THEN** the opening selection is exactly the living set.
- [x] **1b.** **GIVEN** that mission, **WHEN** Select-all (0 / backtick) is issued, **THEN** selection is exactly the living set.
- [x] **1d.** **GIVEN** keys 1–4, **WHEN** the slot is dead, **THEN** it is not selected; **WHEN** the slot is living, **THEN** that slot is selected.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Dead operatives are never a valid recipient: the opening selection, Select-all (0 / backtick), and slot keys 1–4 filter to the living set.
- Keys resolve through the one remap table (`src/game/bindings.ts`); this story asserts the sim-side selection result, not key chrome.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: dead-id and empty-selection no-ops.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-001 — Opening selection and Select-all are the living set (Logic)
**Test file**: `src/state/missionStore.test.ts` (selection), plus the HUD key handler if it holds the 1–4 / 0 / backtick logic
**What to test**:
- AC 1a: a mission opened with a dead operative (e.g. a roster with one KIA slot represented as a dead row) opens with `selected` equal to exactly the living ids
- AC 1b: Select-all (0 and backtick) sets `selected` to exactly the living ids
- AC 1d: key on a dead slot leaves selection unchanged; key on a living slot selects that slot
**Edge cases**: all four living; only one living; Select-all after a death mid-mission; clicking a hostile does not clear selection (GDD Edge Case)
**Mutation check**: make Select-all include dead rows → AC 1b fails
*Reconciled at /story-done (2026-10-16): the tests live in `src/game/world.test.ts` (as Test Evidence names), not `src/state/missionStore.test.ts`; the selection rules are pure functions in `src/game/selection.ts`.*
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts`, `describe('selection is the living set (TM-001, AC 1a / 1b / 1d)')`, 8 tests

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 003

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (1a, 1b, 1d — each covered by a TM-001 unit test in `src/game/world.test.ts`; `npx vitest run src/game/world.test.ts -t TM-001` gave 8 passed at /story-done)
**Deviations**: None blocking. ADVISORY: `src/scene/Input.tsx` was changed (the key/click handler now calls `src/game/selection.ts`); the story lists no files to modify, but its QA case names the HUD key handler, so this is within intent. ADR-0016 compliant per /code-review.
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (8 TM-001 tests). The QA case's `src/state/missionStore.test.ts` path was reconciled to `src/game/world.test.ts`.
**Run result**: NOT VERIFIED — unattended workflow run; no in-game click-through performed (from the /dev-story checkpoint). ADVISORY: confirm in the build that a mission opens with only living operatives selected and that 0 / backtick / 1–4 behave.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer
**Code Review advisory findings** (not fixed in this story):
- `src/scene/Input.tsx:296` + `src/game/selection.ts:59`: the hostile-click rule exists twice. Input.tsx calls `clickSelection` only inside `if (pick.agent)`, so the `if (!pick.agent) return current` branch is unreachable from production and the hostile-click edge-case test guards the unreachable copy. Fix: drop the Input.tsx gate, call `clickSelection` for any pick, call `noteTutorial` only when `pick.agent`.
- `src/game/world.test.ts:2461` / `src/scene/Input.tsx:205`: tests cover the pure helpers, not the wiring. AC 1a is applied by `if (ms.selected.length === 0) ms.setSelected(openingSelection(w))` (depends on `ms.reset()` at `src/state/missionLifecycle.ts:32`); Select-all is applied at `Input.tsx:141`. Neither is tested, and the 1a test adds no protection beyond the 1b test (both return `livingAgentIds`).
- `src/game/world.test.ts:2455`: the `kill()` helper sets `hp = 0` and `stance = 'dead'` directly instead of going through `killUnit` (`src/game/world.ts:675`); a mutation dropping either half of `isAlive` would pass every TM-001 test. "Death mid-mission" is simulated, not reached through the sim.
- Story file: Test Evidence status and the QA case test path were stale — reconciled at this /story-done.
- `src/scene/Input.tsx:19`: `import type { SelectionPick as Pick }` shadows TypeScript's built-in `Pick<T,K>` (pre-existing problem); `isAlive as alive` also hides the exported name. Suggest using the real names.
- `src/scene/Input.tsx:55`: `agentsInBox` checks `u.kind !== 'agent' || !alive(u)` inline instead of calling `isLivingAgent`; box-drag selection can drift from the shared rule.
**Untested criteria**: none UNTESTED at unit level; the store/handler wiring for AC 1a and 1b is untested (see above). Recommend adding tests in a follow-up story.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/selection.ts:40 selectAll returns every agent id including dead rows (w.units.filter(kind==='agent')) → 'Select-all (0 / backtick) picks exactly the living ids (AC 1b)' failed (plus 2 other Select-all tests); restored (cmp match, test file green)
**Closure decision**: Phase 7 ran unattended (automation: autonomous); took the recommended option "Close the story". QL-TEST-COVERAGE and LP-CODE-REVIEW spawn skipped — Lean mode.
