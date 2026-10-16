# Story 003: Move clears target and Hold Ground; stop-to-engage on the path

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
- Required: Five verbs plus auto-acquire; operatives acquire visible targets when weapons are free.
- Forbidden: No physics engine; routing stays in `src/game/pathfind.ts`.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **2.** **GIVEN** a selected living operative with an Explicit target and Hold Ground on, **WHEN** Move is issued to walkable ground, **THEN** the Explicit target is cleared and Hold Ground is released.
- [x] **2b.** **GIVEN** a Move path that passes a visible in-range CorpSec, Hold Fire off, weapons-free (not drawing, not reloading, magazine > 0, cooldown idle), **WHEN** the operative reaches LOS, **THEN** they stop, engage, then resume the path.
- [x] **2c.** **GIVEN** a selected living operative walking a Move path with Hold Fire on, **WHEN** they pass a visible in-range CorpSec, **THEN** they do not stop-to-engage; the path continues.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Weapons-free means not drawing, not reloading, magazine > 0, cooldown idle.
- Move to walkable ground clears the Explicit target and releases Hold Ground; Hold Fire suppresses stop-to-engage only.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: idle auto-acquire and Attack under Hold Ground.
- Story 006: Hold Ground pin and Stop.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-003 — Move clears target and Hold Ground; stop-to-engage on the path (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 2: an operative with an Explicit target and Hold Ground on gets Move → `targetId` null and `holdGround` false
- AC 2b: a path past a visible in-range CorpSec, Hold Fire off, weapons free → operative stops, fires, then the path resumes (position progresses toward the destination after the engagement)
- AC 2c: same fixture with Hold Fire on → no stop, no shot, path continues
**Edge cases**: weapons not free (reloading, magazine 0, drawing) → no stop-to-engage; Move to a non-walkable tile
**Mutation check**: skip the Hold Ground release in `orderMove` → AC 2 fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`, `src/game/pathfind.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts` (TM-003 describe, 5 tests)

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 004

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (AC 2, 2b, 2c), no deferred items. `npx vitest run src/game/world.test.ts -t TM-003` passed 5/5 (re-run at close).
**Deviations**: None blocking. ADR-0016 Move bullet: COMPLIANT. Advisory items below.
**Test Evidence**: Logic: test file present at `src/game/world.test.ts` (describe "Move clears target and Hold Ground; stop-to-engage (TM-003 ...)", 5 tests). Closed with automation=autonomous, default option "Close the story" taken.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:2115 dropped `u.holdGround = false` in orderMove → "Move clears an Explicit target and releases Hold Ground (AC 2)" failed; restored (cmp match, test file green)

### Advisory findings from /code-review (none blocking)
- VERIFIED (mutation): the `u.stance === 'attacking'` latch in `mayStop` (src/game/world.ts:1009) is not pinned by any test; deleting it passes 5/5. Suggest a test asserting position stays fixed across the cooldown between shots.
- VERIFIED (mutation): the `u.cooldown <= 0` clause in `weaponsFree` (src/game/world.ts:~952) is untested. AC 2b names "cooldown idle". Suggest a 'cooling' spoil (`a1.cooldown = 999` before `orderMove`) in the weapons-free edge test (src/game/world.test.ts:~2711).
- VERIFIED (mutation): removing `u.explicitTarget = false` in `orderMove` (src/game/world.ts:2113) still passes 5/5. Existing behaviour, not in this diff. Suggest `expect(a1.explicitTarget).toBe(false)` in both Move tests.
- DESIGN QUESTION for game-designer (not a defect): a walker that fires its last round keeps stance 'attacking', so `mayStop` stays true through the whole reload while the target is alive, in range and in LOS. GDD line 54 lists "no reload in progress" as a weapons-free condition but does not say what a stopped walker does mid-reload. Either pin the intended behaviour with a test or change the latch. Raised by lead-programmer, qa-tester and gameplay-programmer.
- VERIFIED (reading): the AC 2b test (~2690) places the hostile about 4.5 units from the start, so the walker likely engages on tick 1 (not run to confirm); it never asserts position is unchanged while 'attacking', so it does not show a mid-route stop. Suggest placing the hostile farther along the route and asserting the position holds across attacking ticks.
- VERIFIED (reading): `dealt.hp` in the 2b test is captured before each tick; a rebalance that kills the pinned enemy in one shot would fail `expect(dealt.hp).toBeGreaterThan(0)` without a real bug. The `magazine` and `stance === 'dead'` assertions already prove a shot landed; drop it or capture after the tick.
- VERIFIED (reading): `orderMove` returns early at `if (!base) return` (src/game/world.ts:2106) before the target and Hold Ground reset, so a Move to a tile with no nearby walkable ground leaves the Explicit target and Hold Ground in place. Not covered by AC 2 ("walkable ground"). Decide whether the no-op is intended and pin it with a test.
- Untested-in-depth criteria: none of the ACs are UNTESTED; the gaps above are mutation-survivor coverage, recommend a follow-up test-hardening story.
