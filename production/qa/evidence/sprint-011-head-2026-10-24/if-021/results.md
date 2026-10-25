# IF-021 — Unrest ink and bar follow its state — Results (Sprint 11, Phase 5)

**Story type**: UI | **Gate**: BLOCKING (qa-lead sign-off) | **Build**: HEAD `131a5c1` | **Date**: 2026-10-24
**Cases**: `production/qa/test-cases/if-021-unrest-ink-and-bar-follow-its-state-cases.md`
**R1 source**: `production/qa/evidence/sprint-011-head-2026-10-24/r1-probe/run.log` (152/152 PASS; captures `if-021-*.png` in that folder)
**Hand-walk script**: `production/qa/evidence/sprint-011-head-2026-10-24/if-021/if-021-handwalk.mjs` (header, HELPERS and fixtures copied from `production/qa/evidence/sprint-011/probe.mjs`), headless Chrome for Testing via playwright-core, 1280x720, dev server already up on 4200. Output: `if-021/run.log`; captures `if-021-hw-{calm-50,calm-60,pressure-61,crisis-80,crisis-40}.png`, `if-021-antarctica.png`. Page errors during the run: `[]`.

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| IF-021-01 Calm 50 | AC-1 | R1 | run.log:79 `PASS IF-021 opening unrest 50: row and panel ink // {"row":"rgb(184, 216, 207)","panel":"rgb(184, 216, 207)","seg":"segbar mini","panelChip":false} row 12.68:1 panel 12.68:1` | PASS |
| IF-021-02 Calm 60 (boundary) | AC-1 | R1 | run.log:80 `PASS IF-021 opening unrest 60: row and panel ink // {"row":"rgb(184, 216, 207)","panel":"rgb(184, 216, 207)","seg":"segbar mini","panelChip":false} row 12.68:1 panel 12.68:1`. Step 4 (no chip at 60) also observed in hand-walk: `chipText:null` | PASS |
| IF-021-03 Pressure 61 | AC-1 | R1 | run.log:81 `PASS IF-021 pressure unrest 61: row and panel ink // {"row":"rgb(226, 246, 238)","panel":"rgb(226, 246, 238)","seg":"segbar notice mini","chip":"UNREST PRESSURE","panelChip":false} row 17.18:1 panel 17.18:1` | PASS |
| IF-021-04 Pressure chip on row only | AC-1, AC-2 | R1 | run.log:82 `PASS IF-021 pressure chip on the row only // {... "chip":"UNREST PRESSURE","panelChip":false}` | PASS |
| IF-021-05 Crisis 80 | AC-1 | R1 | run.log:83 `PASS IF-021 crisis unrest 80: row and panel ink // {"row":"rgb(255, 107, 85)","panel":"rgb(255, 107, 85)","seg":"segbar red mini","chip":"CRISIS","panelChip":false} row 6.9:1 panel 6.9:1` | PASS |
| IF-021-06 Crisis 40 (hysteresis) | AC-2 | R1 | run.log:84 `PASS IF-021 crisis unrest 40: row and panel ink // {"row":"rgb(255, 107, 85)","panel":"rgb(255, 107, 85)","seg":"segbar red mini","chip":"CRISIS","panelChip":false} row 6.9:1 panel 6.9:1` | PASS |
| IF-021-07 Chips, five states, whole Focus panel | AC-1, AC-2 | Hand-walk | See table A. 20/20 readings match; `UNREST PRESSURE` count in `.wm-right` = 0 in all five states | PASS |
| IF-021-08 Bar fill follows state | AC-1, AC-2 | Hand-walk | See table B. Each fill is its tone class's gradient; widths 50% / 60% / 61% / 80% / 40% = Unrest%. Red end colour recorded: `rgb(224, 75, 60)` | PASS |
| IF-021-09 Antarctica prints none | AC-1 | Hand-walk | Before: `{"text":"ANTARCTICANO SURVEY DATA","readings":0,"unrestReadings":0,"warnings":0,"lock":true,"aria":"ANTARCTICA // NO SURVEY DATA"}`. After forcing `an` Unrest 90 + crisis (store read back `{"an":{"control":0,"unrest":90},"crisis":["an"],"selected":"eu"}`): same text, readings 0, warnings 0, lock true, same aria-label. Real mouse click on row centre (hit-test `{"tag":"B","cls":"wm-sector-name","inRow":true}`) → `selected: "eu"`, Focus panel `EUROPEAN SECTOR` / chip `FOCUS` | PASS |

### Table A — IF-021-07 readings (run.log)

| State | a. row chip text / class | b. aria-label | c. `.wm-right` has `UNREST PRESSURE` | d. Focus chip |
|---|---|---|---|---|
| 50 | `null` / `null` | `EUROPE // CONTROL 62% // UNREST 50%` | false (0) | `FOCUS` |
| 60 | `null` / `null` | `EUROPE // CONTROL 62% // UNREST 60%` | false (0) | `FOCUS` |
| 61 | `UNREST PRESSURE` / `wm-sector-warning notice` | `EUROPE // CONTROL 62% // UNREST 61% // UNREST PRESSURE` | false (0) | `FOCUS` |
| 80 | `CRISIS` / `wm-sector-warning red` | `EUROPE // CONTROL 62% // UNREST 80% // CRISIS` | false (0) | `CRISIS` |
| 40 | `CRISIS` / `wm-sector-warning red` | `EUROPE // CONTROL 62% // UNREST 40% // CRISIS` | false (0) | `CRISIS` |

### Table B — IF-021-08 Unrest bar fill (`.wm-cu > div:nth-child(2) .segbar > i`)

| State | bar class | backgroundImage | width | gradient end |
|---|---|---|---|---|
| 50 | `segbar mini` | `linear-gradient(90deg, rgba(89, 214, 201, 0.55), rgb(89, 214, 201))` | 50% | `rgb(89, 214, 201)` |
| 60 | `segbar mini` | same as 50 | 60% | `rgb(89, 214, 201)` |
| 61 | `segbar notice mini` | `linear-gradient(90deg, color(srgb 0.886275 0.964706 0.933333 / 0.45), rgb(226, 246, 238))` | 61% | `rgb(226, 246, 238)` (Print White) |
| 80 | `segbar red mini` | `linear-gradient(90deg, rgba(224, 75, 60, 0.5), rgb(224, 75, 60))` | 80% | `rgb(224, 75, 60)` |
| 40 | `segbar red mini` | same as 80 | 40% | `rgb(224, 75, 60)` |

Calm-state Control bar (`.wm-cu > div:nth-child(1) .segbar > i`): `segbar mini`, `linear-gradient(90deg, rgba(89, 214, 201, 0.55), rgb(89, 214, 201))`, width 62% — identical fill to the calm Unrest bar.

## Notes

1. **Fixture `dismissCard()` does not close the orientation card at HEAD (harness, not app).** Diagnostic: after `fresh(); dismissCard()`, the harness's store reads `seen: ["hint-worldmap"]` yet `.wm-onboard-wrap` is still in the DOM; resource entries show the app loaded `/src/state/tutorialStore.ts?t=1792893423482` (HMR-versioned) while the harness imported `/src/state/tutorialStore.ts`, a second module instance. `worldStore.ts` is not versioned, so the world fixtures do reach the live store (the observed values change with each patch). The R1 HEAD captures (`r1-probe/if-021-*.png`) show the card over the centre and the left edge of the Focus panel; the R1 DOM readings are unaffected, but those PNGs are not clean screenshots of the states. The hand-walk script closes the card with its own UNDERSTOOD button (logged `card up after dismiss: 0` for every state); `if-021-hw-*.png` are clean captures. The shared probe's `dismissCard` should be fixed (import the versioned URL, or click UNDERSTOOD) before its PNGs are used as UI evidence.
2. **CONCERNS item recorded, not an AC failure:** the crisis bar ends in `--red` `rgb(224, 75, 60)` (#e04b3c), not Red Hot `rgb(255, 107, 85)`. The value text is Red Hot. Whether the bar must match Red Hot exactly is a spec/design question for qa-lead / art direction; the case's pass criterion (fill = its tone class's gradient) is met.
3. Forcing Antarctica into crisis adds class `crisis` to its row (`wm-sector locked crisis`), whose rule sets `border-left-color: rgb(255, 107, 85)`; computed `border-left-width` is `0px` (both before and after), so no tone is drawn. Nothing visible, but the row does carry the crisis class.
4. The pressure-state gradient start is serialised as `color(srgb … / 0.45)` (from `color-mix`), the others as `rgba(...)`. Cosmetic serialisation difference only.

**Story verdict: PASS WITH NOTES** — AC-1 PASS, AC-2 PASS (9/9 cases PASS; notes 1–2 for qa-lead).
