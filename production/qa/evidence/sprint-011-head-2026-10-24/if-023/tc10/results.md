# IF-023 TC-10 results — Played clean win: header carries the award on the World Network return

- **Story type**: UI. **Gate**: BLOCKING. Build HEAD `131a5c1`, dev server :4200 (started by the coordinator, not touched here), headless Chrome for Testing via playwright-core, 1280x720 (`viewport {"width":1280,"height":720}` in `run.log`).
- **Script**: `tc10.mjs`. Lines 4-277 of `../handwalk.mjs` (probe.mjs lines 22-60 + HELPERS) copied verbatim, then a new TC-10 walk. **Transcript**: `run.log` (also `tc10-output.txt`).
- **Captures in this folder** (all opened by Claude): `tc10-world-start.png`, `tc10-mission-start.png`, `if-023-debrief-award.png`, `if-023-return-award.png`.
- **Store instance check**: the app loaded `/src/state/appStore.ts`, `/src/state/worldStore.ts`, `/src/state/missionStore.ts`, `/src/game/runtime.ts` with no `?t=` suffix, so the script's imports read the same stores the app renders from.

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| TC-10 | AC-2 | Hand-walk (played) | Step 1: header `INFLUENCE0 PTS`, store `0`. Step 2: real clicks NEW OPERATION → world, NORTH AMERICA → RUST HAVEN row → brief, ACCEPT CONTRACT → team, DEPLOY TEAM → mission. Played on the live loop with no pausing; won at world time 74.2 s (`result:"won"`, `civ:0`, all four operatives alive: a1 37, a2 66, a3 98, a4 41 HP). Two TM-019 casualty holds (`TORQ AT 34%` at t 19.2, `MARA AT 30%` at t 20.2) were cleared by pressing Space; `setHeld` was never called. Step 3: Debrief `CONTRACT FULFILLED`, `SQUAD CASUALTIES 0`; `outcome {won:true, civiliansHit:0, quietReplay:false}`; missionStore `civiliansHit 0`; worldStore influence `8`. Step 4, first `requestAnimationFrame` after clicking RETURN TO WORLD NETWORK: phase `world`, header `INFLUENCE8 PTS`, `.wm-left` children `1` (`["SECTORS"]`). After the capture: header `INFLUENCE8 PTS`, store `8`. Step 5, visible runs matching `INFLUENCE` or `8 PTS`: header label `div.wm-resource > span > small` "INFLUENCE"; note title `b.wm-moment-title` "INFLUENCE // 1 STABILIZE"; note body "Affordable now: 8 PTS for -12 UNREST OVE..." (a price, per Shared precondition 4, as in TC-11). Neither note is in `.wm-left`. In `if-023-return-award.png`, the header reads INFLUENCE 8 PTS, the left column holds only SECTORS, and the only other "8" figure is the Stabilize price `8P` in the sector panel. Page errors: 0. | PASS |

## Assists and deviations

1. **No sim assist was used.** The fallback (enemies and relays set dead, squad placed on the zones) was in the script but did not run, because the played phase won first. Nothing was written to any store during the mission.
2. **Orders went through the sim's own order calls**, not the harness: `orderMove`, `orderUseMed` and `orderAbility` on `getWorld()`. The case names the harness, but the harness cannot issue scripted orders (same deviation as `../results.md` note 4). No grenades were thrown, and no civilian was hit.
3. **TM-019 holds were cleared with Space**, the game's `tacticalHold` binding (`src/game/bindings.ts:100`), through `page.keyboard.press('Space')`. The earlier attempt's stall at about 12-16 s with `paused:false` fits this hold. In that attempt the hold was never cleared, and `held` was not logged.
4. **Before the run**: `localStorage.clear()` and a reload, then NEW OPERATION, so the run starts from Influence 0. The first-visit card was dismissed by clicking UNDERSTOOD.

## Notes

1. **The case's step 3 expectation does not match the screen** (same as `../results.md` note 2). The Debrief shows no header chip and no `INFLUENCE` text, and `if-023-debrief-award.png` has no civilian line. The clean win is shown by `outcome.civiliansHit 0` and missionStore `civiliansHit 0`. The store already read `8` on the Debrief. This is a test-case wording question, not an AC failure.
2. Both captures were taken right after the first-frame read, so this capture is closer to the first frame than the harness's 120 ms.
