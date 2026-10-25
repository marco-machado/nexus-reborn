# IF-019 — Using the clock dismisses the first-visit card — Results

**Story type**: Integration | **Gate**: BLOCKING | **Build**: HEAD `131a5c1` | **Date**: 2026-10-24
**Cases**: `production/qa/test-cases/if-019-using-the-clock-dismisses-the-first-visit-card-cases.md`
**Hand-walk script**: `handwalk.mjs` (this folder; launch block and `fresh()`/`pause()` fixture copied from `production/qa/evidence/sprint-011/probe.mjs`), headless Chrome for Testing (chromium-1247) via playwright-core, 1280x720 (viewport read `[1280,720]` at every fixture and after every reload). Output `run.log`; captures `IF019-06-before.png`, `IF019-06-after.png`, `IF019-08-after.png`, `IF019-10-after.png`, `IF019-13-before.png`.
**Dev server**: the already-running listener on 4200 (pid 95099); not started or stopped by this run.

## Automated evidence

`npx vitest run src/ui/worldOnboard.test.ts`:

```
 Test Files  1 passed (1)
      Tests  29 passed (29)
```

With `--reporter=verbose`, all 10 tests under `clockUse: the clock dismisses the first-visit card (IF-019)` show ✓ (fresh campaign unseen; Pause; speed 1X/2X/4X/8X; already-active speed / no duplicate; save and reload; focus changes and mark-read do not dismiss (AC-2); New Operation brings the card back (AC-3)).

## Results

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|------|----|----------|---------------|-------------------|
| IF019-01 | AC-1 | R1 | `r1-probe/run.log` line 69: `PASS IF-019 PAUSE under the card applies and dismisses it // {"paused":true,"speed":2,"card":false}` | PASS |
| IF019-02 | AC-1 | R1 | line 70: `PASS IF-019 1X under the card applies and dismisses it // {"paused":false,"speed":1,"card":false}` | PASS |
| IF019-03 | AC-1 | R1 | line 71: `PASS IF-019 2X under the card applies and dismisses it // {"paused":false,"speed":2,"card":false}` | PASS |
| IF019-04 | AC-1 | R1 | line 72: `PASS IF-019 4X under the card applies and dismisses it // {"paused":false,"speed":4,"card":false}` | PASS |
| IF019-05 | AC-1 | R1 | line 73: `PASS IF-019 8X under the card applies and dismisses it // {"paused":false,"speed":8,"card":false}` | PASS |
| IF019-06 | AC-1, AC-3 | Hand-walk | Step 1: card true, seen 0. Step 2 (4X): speed 4, paused false, card false, seen 1. Step 3 (Pause): paused true, label `RESUME STRATEGIC CLOCK`, seen 1. Step 4 (Resume): paused false, seen 1. Step 5 (1X, 2X, 8X): speeds 1, 2, 8, paused false, seen 1 at each read, card false. No console/page errors. | PASS |
| IF019-07 | AC-1 | Hand-walk | Pre: 2X `aria-pressed="true"`, running, card up, seen 0. After clicking 2X: speed 2, paused false, card false, seen 1. No errors. | PASS |
| IF019-08 | AC-1 | Hand-walk | Step 1 (Resume, label was `RESUME STRATEGIC CLOCK`): card false, seen 1. Step 2 (wait 1000 ms): `nexus-save-v1` `tutorial.seen` = `["hint-worldmap"]`, count 1. Step 3: reload, viewport [1280,720], CONTINUE clicked. Step 4: phase `world`, card false, seen 1. No errors. | PASS |
| IF019-09 | AC-2 | R1 + hand reads | R1 line 74: `PASS IF-019 a Feed row click under the card focuses its sector and leaves the card up // eu -> af, card true`. Hand reads: 4 feed rows; row 2 label `14:28 RIOTS REPORTED IN CAIRO // FOCUS AFRICA` (id `af`); after click selected `af` (match true), card true, seen 0. No errors. | PASS |
| IF019-10 | AC-2 | Hand-walk | Clicked `NORTH AMERICA // CONTROL 68% // UNREST 12%` (first unlocked, unpressed row; no click intercepted). selected `eu` -> `na`, clicked row `aria-pressed="true"`, card true, seen 0. No errors. | PASS |
| IF019-11 | AC-2 | Hand-walk | Focus before Esc on `UNDERSTOOD // DISMISS THE ORIENTATION`. After Escape: card true, seen 0, phase `world`, overlay `null`. No errors. | PASS |
| IF019-12 | Story edge case | Hand-walk | Pre: paused true, speed 2. After UNDERSTOOD: card false, seen 1, paused true, speed 2 (unchanged). No errors. | PASS |
| IF019-13 | AC-3 | Hand-walk | Chained after IF019-08 (pre: card false, seen 1). Reload, viewport [1280,720], `BEGIN NEW OPERATION` then `CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN`. Step 2: phase `world`, card true, seen 0. Step 3 (4X): speed 4, paused false, card false, seen 1. No errors. | PASS |

## Notes

1. **Harness: two tutorialStore instances on this dev server.** The app loads `/src/state/tutorialStore.ts?t=1792893423482` (an HMR timestamp; seen in `performance` resource entries on a fresh load). The bare `import('/src/state/tutorialStore.ts')` the cases file's Common setup names returns a second, separate instance that the app never writes. The first run of `handwalk.mjs` read seen count 0 in every case, including after UNDERSTOOD, while the save blob held `["hint-worldmap"]`. The script was fixed (not the app) to import the URL the app actually loaded; every read in `run.log` records `tutorialUrl` `/src/state/tutorialStore.ts?t=1792893423482` (25 of 25). This is a test-harness artifact, not an app defect. The same applies to any probe that writes the tutorial store through the bare path (probe.mjs `dismissCard`). That is outside IF-019, so it was not assessed here.
2. In IF019-06, step 2 waited 600 ms (the 200 ms in the case plus 400 ms) so the screenshot comes after the card fade. All reads matched.
3. In IF019-11, Esc opened no overlay (`overlay` `null`).
4. The menu buttons were found by their aria-labels (`BEGIN NEW OPERATION`, then `CONFIRM NEW OPERATION // ERASE SAVED CAMPAIGN`). Their visible text is `NEW OPERATION` / `CONFIRM // ERASE SAVE?`, the names the case gives.

## Story verdict

**PASS WITH NOTES**: AC-1 PASS, AC-2 PASS, AC-3 PASS, story edge case (UNDERSTOOD) PASS. The only note is the harness store-instance item (Note 1). No AC failures.
