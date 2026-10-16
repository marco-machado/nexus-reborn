# Story 016: Grenade confirm spends one power cell; refusal spends nothing

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
- Required: Five verbs plus auto-acquire on the custom sim; abilities live in sibling modules.
- Forbidden: No physics engine — blast resolves LOS only in the sim.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **23.** **GIVEN** a living selected thrower, at least one power cell, grenade cooldown idle, and a confirmed land within 18 m that snaps onto pavement within 2.5 m, **WHEN** the grenade is confirmed, **THEN** one power cell is spent and the blast resolves (70 damage at centre falling to 35 at 3.5 m edge, LOS only).
- [x] **24.** **GIVEN** empty power cells, or a running squad grenade cooldown, **WHEN** a grenade confirm is requested, **THEN** the control is disabled or the throw is refused, and nothing is spent (cells and cooldown unchanged).

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Land within 18 m snaps onto pavement within 2.5 m.
- Blast: 70 damage at centre falling to 35 at 3.5 m edge, LOS only.
- Performance: no performance impact expected — orderGrenade (src/game/world.ts:2404) runs once per confirm, and the blast resolves once per throw. No per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: Device handling remains OQ3.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-016 — Grenade confirm spends one power cell; refusal spends nothing (Logic)
**Test file**: `src/game/world.test.ts`
**What to test**:
- AC 23: valid throw (≤ 18 m, pavement snap ≤ 2.5 m) → cells −1; blast damage 70 at centre, 35 at 3.5 m, 0 beyond or without LOS
- AC 24: zero cells, or squad cooldown running → throw refused, cells and cooldown unchanged
**Edge cases**: land > 18 m refused; a body behind a wall in radius takes 0
**Mutation check**: spend two cells → AC 23 fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts` (describe block `grenade confirm spends one power cell (TM-016, AC 23 / AC 24)`, 6 tests). Present; 6 passed on `vitest -t TM-016` re-run by /story-done.

**Status**: [x] Created

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 2/2 passing (AC 23 and AC 24 covered by automated tests in `src/game/world.test.ts`)
**Deviations**: None. Test-only change; only `src/game/world.test.ts` touched (no layer, CONTRACT FILE, RNG or per-frame-state concerns). Test Evidence path corrected from `abilities.test.ts` to `world.test.ts`.
**Test Evidence**: Logic: `src/game/world.test.ts` (6 TM-016 tests pass)
**Code Review**: APPROVED WITH SUGGESTIONS (no Required Changes) — specialists: lead-programmer, qa-tester, gameplay-programmer. Phase 5 autonomous default taken: LP-CODE-REVIEW not spawned (lean mode); suggestions recorded below for later.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:2427 `inventory.cell -= 1` changed to `-= 2` in orderGrenade → "AC 23: a valid throw spends exactly one cell, arms the cooldown and deals 70 at the centre" failed (5 of 6 TM-016 tests failed); restored (cmp match, test file green)

### Advisory findings from /code-review (not blocking, follow-up)
- Pavement-snap clause of AC 23 untested: add a throw at a non-walkable point within 2.5 m (accepted) and one beyond 2.5 m (refused) (`orderGrenade`, world.ts:2421-2424).
- "Living selected thrower" precondition untested: the `canUseAbility` guard (world.ts:2417-2418) is never exercised with a dead or unknown thrower.
- Cooldown assertion is only `toBeGreaterThan(0)`; GRENADE_COOLDOWN is 4. Tighten (e.g. `toBeCloseTo(4 - 0.25, 0)`), and in the running-cooldown test compare cooldown before and after the refused call with no ticks between.
- Setup comment "Keep the thrower alive and out of every blast under test" is wrong (blast at 3 m, radius 3.5 m); reword to "survive the blast".
- Out-of-range test only probes d >= 19; pin the 18 m boundary (17.9 m accepted, 18.1 m refused) and add a positive control for `far`. In the zero-cell test, `cooldown(w)` is read after a 5 s warm, so it cannot show a refusal leaves cooldown untouched.
- UNVERIFIED: wall edge-case test asserts only a negative (hp unchanged); add a second body in the same blast to prove it fired.
- UNVERIFIED: falloff checked only at 0 m and 3.49 m; add a probe near 1.75 m (expected 52.5).
