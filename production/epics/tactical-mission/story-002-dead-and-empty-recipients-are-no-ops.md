# Story 002: Dead ids, empty selection, and Attack on a Device are no-ops

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
- Required: Attack = living hostile; there is no Demolish verb.
- Forbidden: Never accept Attack-on-device (`orderAttack` rejects devices — code that accepts it is a defect).
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **1c.** **GIVEN** a dead id, **WHEN** an order names that id, **THEN** it is a no-op (dead never a valid recipient).
- [ ] **1e.** **GIVEN** empty selection, **WHEN** Move, Attack, or Q is issued, **THEN** the order is a no-op.
- [ ] **5d.** **GIVEN** a selected living operative, **WHEN** Attack is issued on a Device, **THEN** no Explicit target is set (no-op). Do not assert Device HP or a fire-lane-vs-charge channel (OQ3).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Orders naming a dead id, or issued with empty selection, change nothing.
- Do not assert Device HP or a fire-lane-vs-charge channel (GDD OQ3 — still open).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: selection sets.
- Story 005: Hold Fire and Attack.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-002 — Dead ids, empty selection, and Attack on a Device are no-ops (Logic)
**Test file**: `src/game/world.test.ts` (`orders`)
**What to test**:
- AC 1c: an order naming a **dead** operative id (killed in the fixture, not an unknown id) changes nothing on that unit
- AC 1e: empty selection: `orderMove([])`, `orderAttack([])` and the Q ability with `[]` leave every unit's path, target and cooldowns unchanged
- AC 5d: `orderAttack(ids, deviceId)` leaves `targetId` null (no Explicit). Do not assert Device HP or a damage channel (OQ3)
**Edge cases**: mixed list of one dead and one living id (only the living one moves); grenade confirm with empty selection (GDD Edge Case)
**Source change**: finding 2. Check the Rust Haven destroy test (L1388) after the change.
**Mutation check**: let `ordered()` keep dead units → AC 1c fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts` (`orders`, 5 tests)

---

## Dependencies

- Depends on: Story 001
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (1c, 1e, 5d — `src/game/world.test.ts` `orders`; 5d also checked in play on Rust Haven: right-click on relay d2 gives a1 a Move ending at the relay, `targetId` null)
**Deviations**: None against GDD/ADR. Out of stated scope, accepted by the owner: `src/scene/Input.tsx` drops Devices from the pick filter (ADR-0016 Migration Plan / Validation Criteria line 216), so a click on a Device falls through to the ground.
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (5 tests); full suite 1291/1291 passing, lint and build clean.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:2053 dropped `&& u.stance !== 'dead'` from ordered() → "a Move or Attack naming a dead operative changes nothing on it (AC 1c)" and "a Move naming one dead and one living id moves only the living one (AC 1c)" failed; restored (cmp match, test file green)

**Advisory findings (from /code-review, not fixed here):**
- No test covers a dead enemy as the Attack target (`world.ts:2103` guard clause `t.stance === 'dead'` could be deleted without a test failing).
- The AC 5d test asserts only `targetId`; it should also assert `explicitTarget` is false.
- A left-click on a Device now reaches the ground handler and clears the selection; a right-click becomes a ground Move. Whether that is the intended UX is a design call; add a Rust Haven smoke line.
- `src/game/data.ts:247` Rust Haven brief ("GUNFIRE WORKS, SLOWLY.") may now mislead — content call for the designer.
- `design/gdd/tactical-mission.md:137` (OQ3) still says code accepts devices as Explicit targets — game-designer to update.
- `docs/architecture/adr-0016-tactical-sim-contract.md:77` defect note is now stale — ADR owner to update.
- The story's QA Test Cases cite the Rust Haven destroy test at L1388; it is now at `world.test.ts:1485` and still passes.
- The test 'a grenade with no living thrower spends no cell' never reads the cell count directly.
