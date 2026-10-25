# IF-032 results: Timeline track has a 24 px hit area

- **Story type**: UI. **Gate**: BLOCKING. **Cases**: `production/qa/test-cases/if-032-timeline-track-has-a-24-px-hit-area-cases.md`
- **Build**: HEAD `131a5c1` (`git rev-parse --short HEAD` printed `131a5c1`; uncommitted src changes are test files only, not imported by the app).
- **Server**: existing dev server on http://localhost:4200 (not started or stopped by this run).
- **Browser**: headless Chrome for Testing `~/Library/Caches/ms-playwright/chromium-1247/.../Google Chrome for Testing`, 1280x720, via `playwright-core` from global `@playwright/cli`.
- **Hand-walk script**: `if032.mjs` (launch + `fresh()`/`dismissCard()`/`pause()`/`setScale()` copied from `production/qa/evidence/sprint-011/probe.mjs`; probe's measurement HELPERS not needed and not installed). Log: `run.log`. Card: `dismissCard()` worked; the UNDERSTOOD fallback never fired.
- **Run errors**: `errors 0 []` (zero pageerror, zero console errors).
- **Fixture `timeline-live`**: confirmed before each case: `{"valuenow":0,"valuetext":"LIVE","review":null,"t":108000,"paused":true}`. Track geometry `{"top":570.14,"height":12,"left":202.75,"width":246.80,"cy":576.14}`.

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| TC-01 | AC-1 | R1 | `r1-probe/probe-output.txt:141` `PASS IF-032 Timeline slider pointer hit area >= 24 px high // {"drawn":12,"hit":25}`; `r1-probe/if-031-035-targets.png` exists, 1280x720. | PASS |
| TC-02 | AC-1 | R1 | `r1-probe/probe-output.txt:142` `PASS IF-032 pointer hits the slider at +-11 px; transport centres hit their buttons // {"up":true,"down":true,"transport":true}` | PASS |
| TC-03 | AC-1 (H2) | Hand-walk | t0=108000. Press at (0.25, cy-11): valuenow -18, valuetext `02:32`, review 43200 (exp 43200). Move to 0.50: valuenow -12, `08:32`, review 64800 (exp 64800). Up: unchanged, t=108000. Capture `if-032-drag-above-review.png`: handle at track midpoint, TIME CODE reads `REVIEW -12.0H` / `> GO LIVE`. | PASS |
| TC-04 | AC-1 (H2) | Hand-walk | t0=108000. Press at (0.75, cy+11): valuenow -6, `14:32`, review 86400 (exp 86400). Move to 0.40: valuenow -14.4, `06:08`, review 56160 (exp 56160). Up: unchanged, t=108000. Capture `if-032-drag-below-review.png`. | PASS |
| TC-05 | AC-1 control | Hand-walk | elementFromPoint at cy-14: `DIV.panel-body` (not in track); at cy+14: `DIV.wm-tl-axis` (not in track). After drag at cy-14 and at cy+14: review null, valuetext `LIVE` both times. Measured band (0.5 px scan, x=0.25): y 563.64 to 587.64 = r.top-6.5 to r.top+17.5. | PASS |
| TC-06 | AC-1 edge | Hand-walk | Above (cy-11): press -18; at 0.97 valuenow -0.7, `19:49`, review 105408 (still review); at 0.99 valuenow 0, `LIVE`, review null, live indicator shown, GO LIVE gone; stays Live on up. Below (cy+11): same press/0.97 readings; at r.right+20 (x=469.55) valuenow 0, `LIVE`, review null, live shown, GO LIVE gone. t=108000 = t0. Captures `if-032-drag-to-live.png` (TIME CODE `LIVE`, axis NOW lit), `if-032-drag-to-live-below.png`. | PASS |
| TC-07 | AC-2 | Hand-walk | `page.focus` → activeElement `wm-tl-track`, `LIVE`. ArrowLeft -1; ArrowLeft -2; ArrowRight -1; Home -24; ArrowLeft -24; End 0 `LIVE`; ArrowRight 0 `LIVE`. End: t=108000=t0, focus `wm-tl-track`, scroll [0,0,0] before and after. Capture `if-032-keys-live.png`. | PASS |
| TC-08 | AC-2 | R1 + hand step | R1 line 142 `"transport":true`; IF-019 lines 69-73 all PASS (`PAUSE`, `1X`, `2X`, `4X`, `8X` "under the card applies and dismisses it"). Hand step: `.wm-tbtn` count 5; elementFromPoint at each centre returns that button: `[{"text":"","hit":true},{"text":"1X","hit":true},{"text":"2X","hit":true},{"text":"4X","hit":true},{"text":"8X","hit":true}]` (first is the icon-only PAUSE/RESUME button, `aria-label` `RESUME STRATEGIC CLOCK` while paused). | PASS |

## IF-032 AC-2 (recorded separately per story / strategy F10)

TC-07 (keys scrub the focused slider) PASS; TC-08 (transport centres hit their buttons, count 5) PASS. Captures used: `r1-probe/if-031-035-targets.png`, `if-032/if-032-drag-above-review.png`, `if-032/if-032-drag-below-review.png`, `if-032/if-032-drag-to-live.png`, plus `if-032/if-032-keys-live.png`.

## Notes

1. TC-05 control did not scrub; the band measured 24 px (r.top-6.5 to r.top+17.5 on a 0.5 px scan), matching the designed `inset: -7px -1px` on the 12 px track (the cases file estimated r.top-6 to r.top+18). No finding.
2. The cases file's shared preconditions 3 and teardown (start/stop the dev server) were superseded by the caller's instruction to use the already-running server and not start or stop it. The server was left running, as instructed. The hand-walk browser was closed by the script.
3. Shared precondition 1 says `git status --short src/` prints nothing. It printed `M src/game/tutorial.test.ts`, `M src/state/tutorialStore.test.ts`, `?? src/game/world.noRoute.test.ts`: test files only, none imported by the app (caller-established fact).
4. The fixture is re-applied between cases with store writes, without reloading the page. Each case's pre-reading confirmed Live / review null / t 108000.

## Story verdict

**PASS WITH NOTES**: AC-1 PASS (TC-01 to TC-06), AC-2 PASS (TC-07, TC-08). No FAIL or BLOCKED. The notes cover deviations in procedure only, none in the app.
