# Story 017: a rolled hit strikes the first body on the fire lane

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-10

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**Source**: `production/gate-checks/gate-check-production-2026-10-09.md` — Blocker 1, Path back to PASS step 1. In `src/game/world.ts` `tryFire`, a rolled hit calls `applyDamage` on the aimed unit and never checks the lane, so a civilian standing between shooter and target is never hit and stray fire never reaches the invoice.

**ADR Governing Implementation**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Five protected verbs on a custom TypeScript sim; one system, one seed, unsaved lifetime; citygen is the only generator; fixed camera pose; Hardened is a discrete profile.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Sim-only change in `src/game/world.ts`. No three.js APIs.

**Control Manifest Rules (this layer)**:
- Required: Tactical counts N (`civiliansHit` on `MissionResult`).
- Forbidden: Do not re-own `collateral` CR pricing — Economy prices Credits from the count.
- Guardrail: Preserve deterministic gameplay RNG — the lane check draws no `rng()` values, so seeded outcomes change only where a body actually stands on the lane (AGENTS.md).

---

## Acceptance Criteria

- [ ] **1.** **GIVEN** a squad agent, a CorpSec target in range with clear sight, and a living civilian standing on the shooter→target segment (within `STRAY_R`), **WHEN** the shot rolls a hit, **THEN** the civilian takes the damage, the target takes none, and the tracer ends on the civilian. *(This test fails on today's code.)*
- [ ] **2.** **GIVEN** the AC-1 fixture, **WHEN** that hit resolves, **THEN** `civiliansHit` increases by 1, and the debrief invoice prices it as collateral through Economy's existing path.
- [ ] **3.** **GIVEN** two bodies on the lane, **WHEN** the shot rolls a hit, **THEN** only the body the round enters first is struck (same entry ranking as `strayVictim`).
- [ ] **4.** **GIVEN** the body on the lane stands behind cover from the shooter (`hasLos` false), **WHEN** the shot rolls a hit, **THEN** neither the body nor the target is damaged (the round strikes the wall).
- [ ] **5.** **GIVEN** a clear lane, **WHEN** the shot rolls a hit, **THEN** behaviour is unchanged: the aimed target takes the damage.
- [ ] **6.** **GIVEN** a CorpSec shooter with a civilian on its lane, **WHEN** the hit resolves, **THEN** the civilian is damaged but `civiliansHit` stays 0.
- [ ] **7.** **GIVEN** the same seed and orders, **WHEN** the mission runs twice, **THEN** both runs produce the same outcome (no extra `rng()` draws added).

---

## Implementation Notes

- On a hit, run the lane check on the segment `u.pos → t.pos` before `applyDamage`. Reuse `strayVictim` (it already skips shooter and aimed unit, ranks by entry, and applies `hasLos`), or extract its body into a shared helper. Do not write a second ranking.
- Only consider bodies strictly before the target (`k < 1` on the shooter→target segment), not past it.
- A Deadeye shot counts as a hit and also takes the lane check: it cannot miss, but it cannot pass through a body either.
- Shooters aim past their own side: a rolled hit is not intercepted by a unit of the shooter's `kind`. Without this the squad advancing in file shoots itself in the back and the scripted Glass Veil playthrough is wiped (found during implementation, 2026-10-09).
- The miss branch stays as it is (Story 010).
- Credit `damageByWeapon` to whoever is struck, the same way the miss branch does.

---

## Out of Scope

- Story 010: a missed round continuing down the lane, and the first-hit/unique counting rules.
- Story 011: cover changing hit chance.
- Path back steps 2–3 (World Network arrival, the re-play).

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts`

---

## Dependencies

- Depends on: None (shares `civiliansHit` counting with Story 010; whichever lands first owns the counter)
- Unlocks: re-play for the Production gate (gate-check 2026-10-09, Path back step 3)

## Completion Notes
**Completed**: 2026-10-10
**Criteria**: 7/7 passing. AC-2 is partial: the `civiliansHit` counter is asserted, but no test joins the world outcome to `collateralFine` (logged as TD-008).
**Deviations**: Advisory, resolved. A rolled hit skips units of the shooter's own kind and a miss does not. ADR-0016 "Fire lane" now records this, and records that a VIP or device on the lane is struck from either side.
**Test Evidence**: Logic: `src/game/world.test.ts`. The lane tests cover the civilian hit and the tracer endpoint, a clear lane, entry ranking with an offset body, the own-side skip, cover, CorpSec not billed, and a same-seed run with a body on the lane. The cover, own-side, ranking and tracer tests were each mutation-checked. The full suite passes: 654/654 tests, lint clean, build passes.
**Code Review**: Complete. `/code-review` returned APPROVED WITH SUGGESTIONS (lead-programmer + qa-tester), and the suggestions were applied.
**Run result**: N/A. Sim-only change in `src/game/world.ts`; the behaviour is observed through the headless world in the tests. No click-through was run.
**Open question**: When cover stops a round, the tracer is still drawn through the wall to the target. Visual only; not specified.
