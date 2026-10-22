# Story 015: Brief KIT line from objective kinds

> **Epic**: Interface
> **Status**: Complete
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

- [x] (AC31) GIVEN a Brief for any contract, authored or generated, WHEN its objectives are read, THEN every destroy, interact, escort and defend objective carries a KIT line derived from its objective kind and, for interact and defend, its `durationSec`: destroy → "power cells arm grenades, the fast tool; gunfire works, slowly"; interact → "an operative holds the console for N s"; escort → "the asset must reach the pad alive"; defend → "hold the zone for N s". A contract with none of those kinds carries no KIT line.
- [x] GIVEN the three authored missions and every generated type in all three sequence variants, WHEN `kitLine` is applied, THEN the output depends on `kind` and `durationSec` alone and is identical for authored and generated objectives of the same kind.
- [x] GIVEN a Brief and the mission it deploys, WHEN the KIT lines and the live objectives are compared, THEN they agree (same objective list; a reclient or Expedite between Brief and deploy changes neither).
- [x] (TR-interface-002) GIVEN Brief at 1280×720 and text scales 90 / 100 / 110 / 125 for Glass Veil, Hollow Crown, Rust Haven and one generated contract of each type, WHEN captured, THEN nothing clips or truncates.

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

**Status**: [x] Created — `production/qa/evidence/if-015/` (28 Brief PNGs at 1280×720 × 4 scales, `sabotage-deployed-hud-objectives-100.png`, `README.md` click-through note, `capture.mjs`, `capture-output.txt` ALL PASS); unit seam `src/ui/kitLine.test.ts`

---

## Dependencies

- Depends on: none
- Unlocks: playtest 2 "knows Rust Haven relays want power cells before deploying" check

---

## Completion Notes
**Completed**: 2026-10-22
**Verdict**: COMPLETE WITH NOTES
**Criteria**: 4/4 passing (none deferred)
**Deviations**: None blocking. Advisory:
- KIT copy case: the owner-confirmed AC31 strings are sentence case, and that is what `kitLine` returns, the DOM carries, the unit test pins and the capture asserts; `.mb-obj-kit` (`src/ui/ui.css:2101`) adds `text-transform: uppercase`, so the rendered row reads e.g. `KIT: HOLD THE ZONE FOR 45 S` (the unit `s` becomes `S`) to match the Brief chrome. AC31 holds at the data level. Owner / ux-designer ruling needed: keep the uppercase chrome or render the spec string as-is (the `/ux-design` Brief spec, gate blocker 4, is the natural place).
- Pre-existing, outside this diff: `production/qa/evidence/if-015/m03-brief-125.png` shows the Brief threat box's `MODERATE` running into `ETA RESPONSE: < 06:00` at text scale 125 (`.mb-threat-main b { font-size: clamp(17px, 1.6vw, 24px) }`, `src/ui/ui.css:2049`, does not follow `--text-scale`; `.mb-threat-eta` at :2060 does). The IF-015 `ui.css` diff touches only the `.mb-obj-kit` block. The capture's clip probe (`capture.mjs:120-139`) covers `.mb-obj` rows, `.mb-obj-kit` spans and the objectives box, so the AC4 PASS lines are narrower than the AC wording. No bug in `production/qa/bugs/` (BUG-0001..0008) covers it (checked: the only grep hit, BUG-0001:27, is "Standard threat profile"). Recommend qa-lead file BUG-0009 against the Brief (IF-001 owner) and widen the probe to `.mb-threat`.
- GDD self-consistency: `design/gdd/interface.md:369` (AC31) punctuates the destroy line "the fast tool, gunfire works slowly" while the Screens table (`interface.md:58`), the story AC31 and `src/ui/kitLine.ts:12` use "the fast tool; gunfire works, slowly". The implementation follows the Screens table / owner-confirmed copy; make the GDD line match.
- Evidence figure: `production/qa/evidence/if-015/README.md:9` and the dev-story checkpoint say "ALL PASS, 70 probes"; `capture-output.txt` holds 58 `PASS` lines (`grep -c '^PASS'` = 58) plus two data lines and `ALL PASS`. The correct figure is 58; the README is left for the evidence owner to correct.
- README 125% note: `m03-brief-125.png` shows the last row `TERTIARY: EXTRACT THE SQUAD` at the dossier column's scroll edge; the probe (`capture.mjs:123` scrollIntoView) confirms scroll, not clip (IF-001 behaviour), but the README does not say which rows sit below the fold at 125. Add a note per 125% screenshot.
- Player-facing copy in `src/ui/kitLine.ts:12-24` and `src/ui/index.tsx:882` (`KIT:`) is string literals; the repo has no localization layer (`src/i18n` / `src/locales` absent) and the rest of the Brief (`OBJECTIVES:`, `ETA RESPONSE`) follows the same convention. Pre-existing project-wide gap (also noted on IF-013 and IF-014), not a regression; owner decision on scheduling `/localize`.
- Scope: `src/ui/ui.css` (`.mb-obj-kit` styles), `src/ui/kitLine.test.ts` and `production/qa/evidence/if-015/` (capture.mjs, README.md, capture-output.txt, 29 PNGs) are beyond the two files the Implementation Notes name (`src/ui/kitLine.ts`, `src/ui/index.tsx`); all Presentation-layer and story-required. Valid, not creep.
**Test Evidence**: UI: retained screenshots at `production/qa/evidence/if-015/` — `m01-brief-{90,100,110,125}.png` (Glass Veil, no KIT line on any row), `m02-brief-{90,100,110,125}.png` (Hollow Crown: console 4 s, console 5 s, pad line), `m03-brief-{90,100,110,125}.png` (Rust Haven: power-cell line twice, hold 45 s), `seizure-brief-*.png`, `extraction-brief-*.png`, `sabotage-brief-*.png`, `suppression-brief-*.png` (one generated contract per type, sequence variant 1, four scales each), `sabotage-deployed-hud-objectives-100.png` (the deployed HUD lists the Brief's four objectives in order); click-through note `README.md`; `capture-output.txt` ALL PASS (58 PASS lines), no console or page errors. Unit seam: `src/ui/kitLine.test.ts` (file present). Run result: OBSERVED (dev-story checkpoint; images opened at /story-done: m01-brief-100, m02-brief-100, m03-brief-125, sabotage-brief-90, sabotage-deployed-hud-objectives-100). This skill verified test-file existence only; pass/fail is the /code-review record's (vitest 16/16).
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer (`/code-review` run by the implement-stories workflow; vitest 16/16 pass, `tsc -b` clean, lint clean, no listener on 4200/4215). QL-TEST-COVERAGE and LP-CODE-REVIEW were not spawned (no Agent tool in the workflow session); the named /code-review record stands in for both, and its qa-tester coverage findings are carried below.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/ui/kitLine.ts:23 `sec` → `sec + 1` in the defend copy → "defend names the zone hold with durationSec as is: 5 s and 45 s" (and 4 others) failed; restored (cmp match, test file green)
(Checked at /story-done: `src/ui/kitLine.ts:23` reads `'hold the zone for ' + sec + ' s'`, no stray mutant; the named test is `src/ui/kitLine.test.ts:78`.)
**Manifest**: story 2026-10-08 = current 2026-10-08.
**Closed by**: /story-done in autonomous mode (implement-stories workflow); "Close the story (Recommended)" taken by default and logged in `production/session-logs/decision-log.md`.

### Test-Criterion Traceability
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1 (AC31) destroy / interact / escort / defend carry the kind-derived KIT line (interact and defend with `durationSec`); a contract with none of those kinds carries none | `src/ui/kitLine.test.ts` "kitLine: the four kinds (AC31)" (7 cases) and "kitLines over a contract" (Glass Veil, SEIZURE and SUPPRESSION empty; Hollow Crown; Rust Haven); `capture-output.txt` "KIT lines read as specified from kinds" ×7; `m01-brief-100.png`, `m02-brief-100.png`, `m03-brief-125.png` | COVERED (uppercase rendering note above) |
| AC-2 output depends on `kind` and `durationSec` alone; identical for authored and generated objectives of one kind | `kitLine.test.ts` "authored and generated objectives of one kind print one line" (3 authored missions + 4 types × 3 variants reach all four kinds; per-objective and per-(kind, durationSec) identity) | COVERED |
| AC-3 Brief KIT lines and the live objectives agree; a reclient or Expedite between Brief and deploy changes neither | `kitLine.test.ts` "the Brief agrees with the deployed mission" (resolveMission + createWorld on one list; reclient; Expedite); `capture-output.txt` deploy probes ×4; `sabotage-brief-90.png` vs `sabotage-deployed-hud-objectives-100.png` | COVERED |
| AC-4 (TR-interface-002) Brief at 1280×720 × 90 / 100 / 110 / 125 for Glass Veil, Hollow Crown, Rust Haven and one generated contract per type: nothing clips or truncates | 28 `*-brief-{90,100,110,125}.png`; `capture-output.txt` "scale N: nothing clips, rows inside the viewport" ×28 (probe: `.mb-obj` rows, `.mb-obj-kit` spans, objectives box) | COVERED for the story's elements; pre-existing threat-box overlap at m03 / 125 recorded above (outside this diff; BUG-0009 recommended) |

### Advisory findings from /code-review (for follow-up)
1. `production/qa/evidence/if-015/README.md:9` and `production/session-state/active.md:16` say "ALL PASS, 70 probes"; `capture-output.txt` has 58 PASS lines. Correct the figure to 58.
2. `src/ui/kitLine.test.ts:172-183` — `useWorldStore.setState({ contracts: [c] })` is reset only on line 183, after the expects; a failed expectation leaves the injected contract in the shared store, and the setup discards any pre-existing contracts. Move to `afterEach` with capture/restore of the previous array.
3. `src/ui/kitLine.ts:12-54` — `kitLines`, `kitInteract`, `kitDefend`, `KIT_DESTROY`, `KIT_ESCORT` are exported but only `kitLine` has a production caller (`src/ui/index.tsx:33`). Keep deliberately or move `kitLines` into the test.
4. `src/ui/ui.css:2101` — `text-transform: uppercase` on `.mb-obj-kit` renders the owner-confirmed sentence-case AC31 copy as e.g. `KIT: HOLD THE ZONE FOR 45 S`; the DOM, unit test and capture assert the spec string, so AC31 holds at the data level. Needs an owner / ux-designer ruling (see Deviations).
5. Pre-existing, outside this diff: `m03-brief-125.png` shows the Brief threat box's `MODERATE` overlapping `ETA RESPONSE: < 06:00` at text scale 125 (`ui.css:2049` does not scale with `--text-scale`). The clip probe covers only `.mb-obj` rows, `.mb-obj-kit` spans and the objectives box. No bug (BUG-0001..0008) mentions it. Recommend qa-lead file BUG-0009 against the Brief (IF-001 owner) and widen the probe to `.mb-threat`.
6. `src/ui/kitLine.test.ts:90-93` covers only `durationSec` undefined; explicit `durationSec: 0` and a non-integer duration (e.g. 4.5) are untested. The sim (`src/game/world.ts:1673` `if (st === 'active' && d.durationSec)`) skips progress for 0 while the Brief would print "for 0 s". Add both cases.
7. `src/ui/index.tsx:866-883` — the Brief render path (`kitLine(o)`, `has-kit` class, `.mb-obj-kit` span) has no automated test; `kitLine.test.ts` never renders `MissionBrief` and `capture.mjs` is run by hand, not by `npm test`. Accepted by the UI evidence routing; a regression would surface only at the next capture.
8. `production/qa/evidence/if-015/README.md:33-35,49-53` — `m03-brief-125.png` shows the last row `TERTIARY: EXTRACT THE SQUAD` at the dossier column's scroll edge; the probe confirms scroll, not clip, but the README does not say which rows sit below the fold at 125. Add a note per 125% screenshot.
9. Project-wide, not introduced here: `src/ui/kitLine.ts:12-24` and `src/ui/index.tsx:882` are hardcoded English user-facing strings; `.claude/rules/ui-code.md` requires a localization system, but `src/` has none and the rest of the Brief follows the same convention. Owner decision on scheduling `/localize`, not an IF-015 defect.
10. `design/gdd/interface.md:369` (AC31) punctuates the destroy line "the fast tool, gunfire works slowly" while the Screens table (`interface.md:58`), the story AC31 and `kitLine.ts:12` use "the fast tool; gunfire works, slowly". Make the GDD self-consistent.
11. Story Test Evidence status read "[ ] Not created" while the evidence existed; filled by this /story-done.
12. Code review Phase 9 default taken (autonomous mode): [B] run /story-done with suggestions noted for later; the review made no edits.
