# Story 022: HELD BY names the city majority; the card stops saying Control is ownership

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: UI
> **Estimate**: 0.25 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/world-network.md` (city holder; Tax only from Nexus-held sectors)
**Requirement**: `TR-world-network-014`, `TR-world-network-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtests 3 and 4: North America at Control 86 read "NOT NEXUS-HELD" while Europe at 37 read Nexus-held; Asia 67% Stratos, Africa 4% Nexus-held. The orientation card defined Control as "how much of the sector Nexus holds". Ownership is the majority holder of a sector's cities (`atlas.sectorCorp`), not Control.

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: One palette; critical state never colour-only; Screens at 1280×720 without clipping.
**ADR Version**: 2026-09-10
**Engine**: React 19.2.8 + Vite 6.4.3 | **Risk**: LOW | **Engine Notes**: DOM only.

**Control Manifest Rules (this layer)**:
- Required: the holder is read from the World Network owner, never computed in the UI from Control.

---

## Acceptance Criteria

- [x] GIVEN a sector panel WHEN it prints THEN a HELD BY row before TAX YIELD names the majority holder and the count (`NEXUS GLOBAL // 2 OF 3 CITIES`, teal; another corp in the default tone), or `CONTESTED // CITIES SPLIT 1-1-1` when no corp holds a majority; the words carry the state, not the colour.
- [x] GIVEN the orientation card WHEN it is read THEN THE JOB says a sector pays when Nexus holds most of its cities and a win hands the mission city to Nexus, and the CONTROL line says Control is the order kept in the sector, not who holds it (pointing at HELD BY).

---

## Implementation Notes

- `src/ui/worldChrome.ts` `holderLine(sector, owner)`; `src/ui/WorldMap.tsx` the row; `src/ui/worldOnboard.ts` copy.

---

## QA Test Cases

- **AC-1**: `src/ui/worldChrome.test.ts` describe "HELD BY names the city majority, not Control (WN-022)" (four tests, including one seized city turning North America contested whatever its Control).
- **AC-2**: no unit test pins the new card copy (gap); checked by reading `src/ui/worldOnboard.ts` and the World Network sweep at four text scales (see the timing note in `production/qa/evidence/playtest-fixes-2026-10-23/`).

---

## Test Evidence

**Story Type**: UI
**Status**: [x] Created — tests above; vitest 1664/1664 at `2c73542`; screenshots `world-{90,100,110,125,hc}.png`.

---

## Dependencies

- Depends on: none
- Unlocks: none

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE
**Criteria**: 2/2
**Decision**: Claude, delegated by the owner's /goal 2026-10-23.
**Not done**: `/code-review` not run on this story.
