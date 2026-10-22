# Story 015: Brief KIT line from objective kinds

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 0.4 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-22

## Context

**GDD**: `design/gdd/interface.md` (Screens table: Brief; AC31), living spec §12 "The brief"
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: `design/difficulty-curve.md` (approved 2026-10-21; KIT strings confirmed by the owner 2026-10-22). Playtest 2026-10-19: the tester did not know the sabotage mission wanted grenades, where grenades came from, or that an operative had to hold the console.
**Change impact**: `docs/architecture/change-impact-2026-10-21-interface.md` (notes F and I).

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer
**Secondary ADRs**: ADR-0009: Partitioned deploy snapshot (Brief reads the MissionDef, not a slice); ADR-0006: Weather script (Brief/live agreement precedent)
**ADR Decision Summary**: One palette and chrome; the Brief must agree with the deployed mission (Pillar 2).
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM only.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: the Brief prints from the same objective list the sim runs (`m.objectives`); never from `notes`, mission id, or hand-written copy.
- Forbidden: a KIT rule keyed on contract type or codename.
- Guardrail: 1280×720 at text scale 90–125 without clipping; the Brief already scrolls at 125% (IF-001).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC31) GIVEN a Brief for any contract, authored or generated, WHEN its objectives are read, THEN every destroy, interact, escort and defend objective carries a KIT line derived from its objective kind and, for interact and defend, its `durationSec`: destroy → "power cells arm grenades, the fast tool; gunfire works, slowly"; interact → "an operative holds the console for N s"; escort → "the asset must reach the pad alive"; defend → "hold the zone for N s". A contract with none of those kinds carries no KIT line.
- [ ] GIVEN the three authored missions and every generated type in all three sequence variants, WHEN `kitLine` is applied, THEN the output depends on `kind` and `durationSec` alone and is identical for authored and generated objectives of the same kind.
- [ ] GIVEN a Brief and the mission it deploys, WHEN the KIT lines and the live objectives are compared, THEN they agree (same objective list; a reclient or Expedite between Brief and deploy changes neither).
- [ ] (TR-interface-002) GIVEN Brief at 1280×720 and text scales 90 / 100 / 110 / 125 for Glass Veil, Hollow Crown, Rust Haven and one generated contract of each type, WHEN captured, THEN nothing clips or truncates.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- `kitLine(def: ObjectiveDef): string | null`, pure, in `src/ui/` beside the other Brief helpers. Reads `kind` and, for interact and defend, `durationSec` as is (the sim uses `durationSec` unmodified for defend; `optFailMul` applies only to optional `failSec`). Returns null for reach-zone, eliminate-tag and extract.
- Brief prints `m.objectives` (`src/ui/index.tsx`, Brief objective list); the sim runs `mission.objectives` (`src/game/world.ts`). Both come from one MissionDef; for generated contracts `objectivesFor(c)` reads only `id`, `type`, `seed`, so the kinds cannot drift between Brief and deploy (TD-CHANGE-IMPACT, 2026-10-21).
- Placement (per-objective note vs a KIT block) is the UX spec's call (`/ux-design` Brief); until then print under each objective row.
- Copy facts, confirmed against the sim: devices die through the ordinary damage path, so power cells are the fast tool, not a requirement; the console is the interact objective, not the escort.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Brief density and recon-panel cuts (playtest "useless info"): `/ux-design` Brief, then its own story.
- Tutorial toast for items (IF-007 owns the HUD toasts).
- Any change to `ObjectiveDef` fields or objective sequences.

---

## QA Test Cases

QA plan: `production/qa/qa-plan-sprint-010-2026-10-22.md`. Provisional, UI with a unit seam:

- `src/ui/kitLine.test.ts`: the four strings for the four kinds with `durationSec` 5 and 45; null for the other three kinds; identical output across the authored missions and `objectivesFor` for every generated type × 3 variants.
- Headless capture at 1280×720 × 4 text scales: Brief for the three authored contracts and one generated contract per type; evidence in `production/qa/evidence/if-015/` with a click-through note.
- Agreement check in the note: the KIT lines on Brief match the objective kinds the deployed mission lists in the HUD objective panel.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/if-015/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not created

---

## Dependencies

- Depends on: none
- Unlocks: playtest 2 "knows Rust Haven relays want power cells before deploying" check

---

## Completion Notes
_(filled by `/story-done`)_
