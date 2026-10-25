# IF-033 results: speed buttons have a 24 px hit area (HEAD 131a5c1)

- **Story type**: UI. **Gate**: BLOCKING. **Cases**: `production/qa/test-cases/if-033-speed-buttons-have-a-24-px-hit-area-cases.md`
- **Executed**: 2026-10-24, Sprint 11 `/team-qa` Phase 5, Claude, headless Chrome for Testing (playwright-core, launch/fixture copied from `sprint-011/probe.mjs` lines 22-60 + `fresh()` / `dismissCard()` / `pause()` / IF-031..035 Feed seed), viewport 1280x720 (verified `{"iw":1280,"ih":720,"card":false}` before each fixture's measurements), text scale 100%, high contrast off.
- **Server**: the existing dev server on http://localhost:4200, started and stopped by the orchestrator (Run setup steps 1 and 6 are not this executor's, per the Phase 5 instructions).
- **Script**: `if033.mjs`. **Transcript**: `run.log`. **Captures** (all 1280x720): `if-033-transport-paused.png`, `if-033-transport-1x.png`, `if-033-aria-4x-keyboard.png`, `if-033-labels-blurred.png`.
- **R1 source**: `../r1-probe/run.log` (152/152 PASS, `R1 exit 0`), `../r1-probe/if-031-035-targets.png`.

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| TC-01 1X-8X each ≥24×24 | AC-1 | R1 check `IF-033 1X-8X each >= 24x24` | R1 run.log line 143: `PASS IF-033 1X-8X each >= 24x24 // [{"t":"1X","x":236.75,"y":603.140625,"w":30,"h":24},{"t":"2X","x":270.75,...,"w":30,"h":24},{"t":"4X","x":304.75,...,"w":30,"h":24},{"t":"8X","x":338.75,...,"w":30,"h":24}]`. 4 entries in order 1X/2X/4X/8X; min w 30, min h 24. `if-031-035-targets.png` is 1280x720 (sips) and shows the transport row whole (Resume glyph, 1X, 2X, 4X, 8X, `CLOCK SPEED: PAUSED`) — viewed. R1 line 154 and run end: `no console or page errors`. | PASS |
| TC-02 whole box takes the pointer | AC-1 | Hand-walk + R1 `IF-032 ...` | R1 line 142: `PASS IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons // {"up":true,"down":true,"transport":true}` → `"transport":true`. Hand-walk: `TC-02 20/20 elementFromPoint hits` — centre + 4 corners inset 1 px, each 1X/2X/4X/8X (30×24) resolved to its own `.wm-tbtn`. | PASS |
| TC-03 neighbours do not overlap | AC-2 | Hand-walk | Paused: 5 buttons, adjacent gaps `[4,4,4,4]`, positive-area intersections 0/10 (x 202.75 / 236.75 / 270.75 / 304.75 / 338.75, each 30×24). After real click on 1X: gaps `[4,4,4,4]`, intersections 0/10, same boxes. Total 8/8 gaps ≥ 0, 0/20 intersections. Captures `if-033-transport-paused.png`, `if-033-transport-1x.png` retained (1x capture viewed: row whole, `CLOCK SPEED: 1X`). | PASS |
| TC-04 `aria-pressed` marks the active speed | AC-2 | Hand-walk | All 8 readings OK (see Notes on the count). Paused: Resume `true+on`, speeds all `false`, `PAUSED`, store `paused:true`. Click 1X/2X/4X/8X: exactly the clicked button `true+on`, others + Pause `false`, store `{paused:false, speed:n}`, readout `nX`. Back to 2X: 2X `true+on`, readout `2X`. Click Pause: back to paused pattern. Keyboard focus 4X (activeElement `4X`) + Space: 4X `true+on`, store speed 4, readout `4X`; ariaSnapshot shows `button "CLOCK SPEED 4X" [pressed]`. `aria-pressed` agreed with `.on` on all five buttons in every reading. | PASS |
| TC-05 labels and accessible names unchanged | AC-1 edge | Hand-walk | Texts `1X`/`2X`/`4X`/`8X`; aria-labels `CLOCK SPEED 1X`/`2X`/`4X`/`8X`; `getByRole('button', {name, exact:true})` count 1 for each; ariaSnapshot names equal the aria-labels with visible text `1X` etc. (text contained in name). Clip (focus cleared): every button `sw 28 = cw 28`, `sh 22 = ch 22` → 0 clipped. | PASS |
| TC-06 Pause/Resume both states (observation) | AC-1 edge | Hand-walk + R1 `IF-035 pause, ...` | R1 line 145: `PASS IF-035 pause, unread, view controls, credit link, nav tabs >= 24x24 // 13 targets`. Paused: `aria-label "RESUME STRATEGIC CLOCK"`, `aria-pressed "true"`, 30×24. Unpaused at 1X: `aria-label "PAUSE STRATEGIC CLOCK"`, `aria-pressed "false"`, 30×24. Both ≥24 in both axes; nothing to report to IF-035. | Observation |

## AC results (recorded separately, per story QA Test Cases)

- **AC-1** (1X-8X ≥24×24 at 1280x720, 100%): **PASS** — TC-01, TC-02, TC-05 PASS; TC-06 observation 30×24 in both states.
- **AC-2 guard** (no overlap; `aria-pressed` marks the active speed): **PASS** — TC-03, TC-04 PASS.

## Notes

1. **Script fix, run 2 (not an app change).** Run 1 measured TC-05 while 4X still held keyboard focus from TC-04 step 6 and read 4X `sw 32 > cw 28`, `sh 26 > ch 22`. Diagnosis: the global focus-bracket rule `:where(button, a, [tabindex]):focus-visible::after { position: absolute; inset: var(--focus-inset, -4px) }` (src/index.css lines 89-100) adds 4 px of scrollable overflow; run 2 logged `{"focusVisible":true,"sw":32,"cw":28,"sh":26,"ch":22,"afterInset":"-4px"}` before blur and `sw 28 / sh 22` after. It is the focus indicator, not a clipped label. The script now blurs before measuring labels. Observation only: any scrollWidth/scrollHeight clip test on a focused control will see the same +4 px.
2. **Case count discrepancy.** TC-04's Pass Criteria says "all 7 readings", but its steps produce 8 (step 1, step 2, three in step 3, step 4, step 5, step 6). All 8 were taken and all 8 passed. The cases file is not edited; flag for the case author.
3. TC-06 step 4 asks for the observation in the "evidence README"; it is recorded in this results.md (this executor's write authorisation covers results.md only).
4. Hand-walk run: `no console or page errors`. The orientation card was gone after `dismissCard()` in both fixtures; the UNDERSTOOD fallback was not needed.
5. HEAD values match the stale `ad176af` evidence exactly (1X-8X 30×24 at x 236.75 / 270.75 / 304.75 / 338.75).

## Story verdict

**PASS WITH NOTES** — every AC passes; Notes 1-2 are script/case-file observations, no app defect.
