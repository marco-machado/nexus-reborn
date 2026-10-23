# Story 021: Taught before it hurts, answered when refused — grenade hint, hold key, order feedback

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.25 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/tactical-mission.md` (verbs; grenades); `design/gdd/interface.md` Rule 13 (tutorial and advisories)
**Requirement**: `TR-interface-007` (hints name the live bindings), `TR-tactical-002` (five verbs)
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtest 3: friendly fire was taught at tutorial step 6/9, which reached the tester a mission after two throws near the squad. Playtest 4: a move order was ignored with no feedback for 15 s of a 90 s escort. Reproduction found no enclosed pocket in the city; the likely cause is an empty selection (a left click on bare ground clears it). CD-PLAYTEST: a command game cannot drop one of its few orders without saying so (Pillar 1).

**ADR Governing Implementation**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Five verbs; dead and empty recipients are no-ops in the sim.
**ADR Version**: per `docs/architecture/adr-0016-tactical-sim-contract.md`
**Engine**: React 19.2.8 + Vite 6.4.3 | **Risk**: LOW | **Engine Notes**: none.

**Control Manifest Rules (this layer)**:
- Required: tutorial copy reads keys through the binding table.
- Forbidden: a sixth verb.

---

## Acceptance Criteria

- [x] GIVEN grenade targeting armed for the first time in a campaign WHEN the ring appears THEN a one-shot BLAST RADIUS hint says everyone inside the red ring takes damage, the squad included, and names the throw and cancel keys; the first tutorial step names the tactical hold key.
- [x] GIVEN a move or attack order WHEN no living operative is selected THEN the log reads `NO LIVING OPERATIVE SELECTED. ORDER NOT TAKEN.` and no click marker is drawn; GIVEN a move with no route THEN the log reads `NO ROUTE TO THAT POINT. ORDER NOT TAKEN.`

---

## Implementation Notes

- `src/game/tutorial.ts` `'hint-grenade'`; fired from `src/scene/Input.tsx` on the first arming. `tut-select` body teaches `tacticalHold`.
- `src/game/world.ts` `NOBODY_SELECTED` in `orderMove` / `orderAttack`; `src/scene/Input.tsx` always forwards the order and draws the click marker only with a selection.

---

## QA Test Cases

- **AC-1**: no unit test pins the hint copy or its firing (gap); read in `src/game/tutorial.ts` and `src/scene/Input.tsx`.
- **AC-2**: `src/game/world.test.ts` "a move or attack order with nobody living selected says so instead of dropping silently". The no-route line has no test of its own (no enclosed pocket was found to drive it).

---

## Test Evidence

**Story Type**: Logic
**Status**: [x] Partial — one test for AC-2; AC-1 and the no-route line untested.

---

## Dependencies

- Depends on: TM-019 (the key the first step names)
- Unlocks: none

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE WITH NOTES
**Criteria**: 2/2 (test coverage partial)
**Decision**: Claude, delegated by the owner's /goal 2026-10-23.
**Not done**: `/code-review` not run. The playtest 4 Frag Charge "NO TARGET FOR THE CHARGE" with hostiles under the cursor is not reproduced and stays on the Polish backlog.
