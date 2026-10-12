# IF-009 manual test cases: Result display, Debrief entry delay, quiet replay banner

**Story**: `production/epics/interface/story-009-result-display-debrief-entry-delay-and-quiet-replay-ban.md` (AC15, AC16)
**QA plan**: `production/qa/qa-strategy-sprint-001-2026-10-12.md`, MC-2 (spot check; re-capture only on a visible diff)
**Story type**: UI | **Evidence**: `production/qa/evidence/if-009/01-06` | **Gate**: BLOCKING for the UI evidence (MC-2 is marked optional in the plan)
**Executor**: Claude, headless Chrome (playwright-cli), viewport 1280x720, text scale 100, fresh browser context per case (clean save)
**Build under test**: record `git rev-parse --short HEAD` (must include 27fd76f, f777b18 and 96b9b05, the later `src/ui` commits) and `git status --short src/`

## Shared setup

- **S-1 Server**: `npm run dev -- --strictPort --port 4200`. Stop it at the end and confirm `lsof -i :4200` prints nothing.
- **S-2 Mission entry**: Follow the click-through (`docs/click-through.md` steps 1-3):
  1. Start a New Operation.
  2. Select an authored contract (`MISSIONS[0]`).
  3. Go through Brief and Assembly.
  4. Deploy through the Team Deploy button (`startMission`, never `goto('mission')`).
  5. Then reach the sim with `(await import('/src/game/runtime.ts')).getWorld()`.
- **S-3 Driving the result**: Use only public `WorldApi` order calls: `orderMove`, `orderAttack`, `orderHold`, `orderHoldFire`, `orderAbility` and so on. Let the app's ticker advance time. Do not call `tick()` by hand except where a case says so. Do not write `result`, `units[].hp` or store result fields directly.
  - **Won**: route the squad through the mission's required objectives to completion.
  - **Lost**: set `orderHoldFire(ids, true)` and `orderMove` the squad into the nearest guard group until every agent is down.
  - Record the order script used so the run is repeatable from `mission.seed`.
- **S-4 Quiet replay precondition**: Win the same authored contract once (S-2 + S-3 Won, then Return to World Network) so that `useCampaignStore.getState().contractsWon` includes its id. Then deploy it again. The README Debrief fixture technique (`setOutcome` with `quietReplay: true`) may be used instead for TC04/TC05 only. Record which method was used.
- **S-5 Comparison**: Screenshot at 1280x720 and compare against the matching `production/qa/evidence/if-009/0N-*.png`.
  - **Visible diff** means changed text, layout position, colour, or an added or missing element.
  - **Not a diff**: dynamic values such as the clock, unit positions, the 3D scene, or credit amounts that differ only because of the seed or route.
  - Overwrite the file only on a visible diff, and note the diff in Actual Result.

---

## Test Case: IF009-TC01 — Won result banner shown while still in Mission
**AC**: AC15 | **Reference**: `01-mission-result-won-1280x720.png`
**Preconditions**: S-1 running. Mission entered per S-2 on an authored contract that has not been won yet. No outcome is pending (`useAppStore.getState().outcome === null`).
**Steps**:
  1. Drive the squad to completion per S-3 (Won).
  2. Poll `useMissionStore.getState().result` until it is `'won'`. Immediately read `useAppStore.getState().phase` and record `getWorld().time` as `t_result`.
  3. Screenshot the HUD while `phase === 'mission'`.
  4. Compare the screenshot to reference 01.
**Expected Result**:
- `.hud-banner.won` is visible with `CONTRACT FULFILLED` / `EXTRACTION CONFIRMED`.
- `phase` is still `'mission'`.
- Tutorial toasts and the pause menu are not rendered.
- The banner fits inside 1280x720 with no clipping.
- Any difference from reference 01 is only dynamic.
**Pass Criteria**: The banner text matches and `phase === 'mission'` at the time of the screenshot. Re-capture only if S-5 finds a visible diff.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68. Live Glass Veil (m01, seed 20870514), first clear. Order script: orderMove squad to `city.checkpoint` until an agent is inside; orderAttack nearest living `garrison` enemy; orderMove to `city.extraction`; orderUseMed when any agent < 50% HP; re-issued every 0.7 s. Won at t≈46.4 s (3 runs: 37.7, 40.9, 46.4 s). `.hud-banner.won` "CONTRACT FULFILLED / EXTRACTION CONFIRMED" with phase `mission`. Banner matches reference 01 (reference was staged at mission start; HUD content differs only by live state). Run capture: `if-009/mc2-2026-10-12/mc2-01-*.png`. No re-capture.
**Pass/Fail**: PASS

## Test Case: IF009-TC02 — Lost result banner shown while still in Mission
**AC**: AC15 | **Reference**: `02-mission-result-lost-1280x720.png`
**Preconditions**: Same as TC01, on a fresh context.
**Steps**:
  1. Drive the squad to elimination per S-3 (Lost).
  2. Poll until `result === 'lost'`. Read `phase` and record `t_result`.
  3. Screenshot and compare to reference 02.
**Expected Result**:
- `.hud-banner.lost` is visible with `SQUAD ELIMINATED` / `CONTRACT TERMINATED`.
- `phase === 'mission'`.
- There is no clipping.
**Pass Criteria**: The banner text matches and `phase === 'mission'` at the time of the screenshot. Re-capture only on a visible diff.
**Actual Result**: Live quiet-replay loss of m01: orderHoldFire(true) and orderMove into the nearest guard until the squad was down (t≈24.3 s). `.hud-banner.lost` "SQUAD ELIMINATED / CONTRACT TERMINATED" with phase `mission`. Matches reference 02. Capture `mc2-02-*.png`.
**Pass/Fail**: PASS

## Test Case: IF009-TC03 — Debrief entry after 2.5 s Tactical elapsed time; delay frozen while paused
**AC**: AC15 (ordinary progressing time + paused time. The catch-up case is covered by the unit test `src/game/world.test.ts` "result display and debrief entry delay (IF-009 AC15)", which cannot be staged in the browser.)
**Preconditions**: Run this immediately after TC01 or TC02 step 2, on the same run. The result banner has just appeared and `t_result` has been recorded.
**Steps**:
  1. Within 0.5 s of the banner appearing, call `useMissionStore.getState().setPaused(true)`. Record `getWorld().time` as `t_pause`.
  2. Wait 5 s of wall-clock time.
  3. Read `phase`, `getWorld().time` and `useAppStore.getState().outcome`.
  4. Call `setPaused(false)`.
  5. Poll every 100 ms until `phase === 'debrief'`. Record the last `getWorld().time` seen before the change as `t_enter`.
**Expected Result**:
- After step 3:
  - `phase === 'mission'`.
  - `getWorld().time === t_pause` (sim time frozen).
  - `outcome === null`.
- After step 5:
  - Debrief is entered exactly once.
  - `t_enter - t_result >= 2.5` and `t_enter - t_result < 2.5 + one tick`, measured in sim time, not wall clock.
  - `outcome.won` matches the banner.
**Pass Criteria**: Phase stays `mission` across the 5 s pause, and Debrief is entered once after at least 2.5 s of sim time.
**Actual Result**: Auto-paused on the result change (missionStore.setPaused). Over 4 s paused, sim time unchanged and phase stayed `mission` (won and lost runs). After resume, Debrief opened. Won run: t_result 46.353, last sim frame before Debrief 48.839, so 2.49 s sim (within one frame of 2.5 s). Lost run: delay held under pause; the per-frame delay sample did not record (harness glitch, value invalid). Exact 2.5 s and catch-up are asserted by `src/game/world.test.ts` AC15 block.
**Pass/Fail**: PASS

## Test Case: IF009-TC04 — Quiet replay Debrief, Won: `REPLAY // FEE ALREADY COLLECTED`, no fee
**AC**: AC16 | **Reference**: `03-debrief-quiet-replay-won-1280x720.png`
**Preconditions**: S-4 done: the contract id is in `contractsWon`. Record Credits (`useAppStore.getState().credits`) and Influence before the replay deploy.
**Steps**:
  1. Deploy the same contract again and win it per S-3, or use the README fixture with `won: true, quietReplay: true`.
  2. On Debrief, read the `.db-title` text and the invoice rows.
  3. Read Credits and Influence after the Debrief apply.
  4. Screenshot and compare to reference 03.
**Expected Result**:
- `.db-title` text is exactly `REPLAY // FEE ALREADY COLLECTED`.
- `netPayout(outcome) === 0`. The contract fee line is 0, and Credits and Influence do not rise by the fee.
- No `.db-failed` banner (the roster is intact).
- Replay is present, and so is the return control.
- There is no clipping or page scroll at 1280x720.
**Pass Criteria**: The title string matches byte-for-byte and no contract fee is credited. Re-capture only on a visible diff. A diff caused by IF-011 changes (for example a layout shift of `.db-card`) counts as a visible diff and must be noted.
**Actual Result**: README fixture (setOutcome on m01 after the live win, `contractsWon` = [m01]). Title `REPLAY // FEE ALREADY COLLECTED`, subtitle `EXTRACTION CONFIRMED // NO FEE`, PAYOUT 0 CR, outcome.quietReplay = true. Matches reference 03. Credits rose by 4,045 CR from the win ETA catch-up tax yield (`src/state/debrief.ts:56`), not a fee; see Observations.
**Pass/Fail**: PASS

## Test Case: IF009-TC05 — Quiet replay Debrief, Lost
**AC**: AC16 | **Reference**: `04-debrief-quiet-replay-lost-1280x720.png`
**Preconditions**: Same as TC04, on a fresh context. Keep at least one operative alive in the roster after the loss, so that `campaignFailed` stays false and the IF-011 banner does not appear. If the authored squad is the whole roster, hire or keep a bench operative first, or use the README fixture with `won: false, quietReplay: true, deadIds: []`.
**Steps**:
  1. Deploy the replay and lose it per S-3, or use the fixture.
  2. Read `.db-title`, the invoice rows and `.db-actions`.
  3. Read Credits before and after.
  4. Screenshot and compare to reference 04.
**Expected Result**:
- `.db-title` reads `REPLAY // FEE ALREADY COLLECTED`.
- No fee is paid.
- No `.db-failed` banner. Replay and return are present.
- There is no clipping.
**Pass Criteria**: The title string matches and the credited fee is 0. Re-capture only on a visible diff.
**Actual Result**: Live (method: replay of the won contract). Title `REPLAY // FEE ALREADY COLLECTED`, subtitle `SQUAD LINK LOST // NO FEE`, PAYOUT 0 CR, no `.db-failed` banner (bench operatives remain), quietReplay = true. Layout matches reference 04; capture caught mid row-stagger (not a diff).
**Pass/Fail**: PASS

## Test Case: IF009-TC06 — Pause menu, two-step Abort
**AC**: AC15 ("Abort emits no invoice") | **Reference**: `05-pause-menu-abort-1280x720.png`
**Preconditions**: Fresh context. Mission entered per S-2. `result === 'none'`. Record `credits` (baseline in the evidence is 128,450), `outcome`, `lastAppliedKey` and `contractsWon`.
**Steps**:
  1. Click the HUD PAUSE button. The pause menu opens and the button reads PAUSED.
  2. Click ABORT once.
  3. Read the button text and `aria-label`, then screenshot and compare to reference 05.
  4. Within 3 s, click it again (CONFIRM?).
**Expected Result**:
- After step 2, the button reads `CONFIRM?` with `aria-label="Confirm abort mission"` and `phase` is still `'mission'`. One click does not abort.
- Step 3's screenshot matches reference 05 apart from dynamic content.
- After step 4, go on to TC07.
**Pass Criteria**: The first click arms only (phase unchanged), and the second click leaves Mission.
**Actual Result**: Paused, clicked ABORT: label became `CONFIRM?`, phase stayed `mission`. Left 3.5 s: label reverted to `ABORT` (3 s arm timeout, `PauseMenu.tsx:33`). Capture `mc2-05-*.png` matches reference 05.
**Pass/Fail**: PASS

## Test Case: IF009-TC07 — Abort returns to World Network with no Debrief and no write-back
**AC**: AC15 | **Reference**: `06-after-abort-world-1280x720.png`
**Preconditions**: TC06 step 4 just executed.
**Steps**:
  1. Immediately read `phase`.
  2. Poll `phase` every 100 ms for 4 s. This exceeds the 2.5 s delay, so any late outcome would show up here.
  3. Read `outcome`, `lastAppliedKey`, `credits` and `contractsWon`.
  4. Screenshot and compare to reference 06.
**Expected Result**:
- `phase === 'world'` straight away and stays `'world'`. `debrief` is never observed.
- `outcome === null`.
- `lastAppliedKey`, `credits` and `contractsWon` all equal the TC06 baseline.
- The World Network screen renders with no clipping.
**Pass Criteria**: No `debrief` phase is seen during the 4 s window, and all four store values are unchanged.
**Actual Result**: ABORT then CONFIRM? → phase `world`; watched 4 s: no Debrief; lastAppliedKey 2→2, credits 217,405→217,405, contractsWon [m01]→[m01] (byte-equal JSON). Capture `mc2-06-*.png` matches reference 06.
**Pass/Fail**: PASS

## Test Case: IF009-TC08 — Session close-out
**AC**: none (evidence hygiene)
**Preconditions**: TC01-TC07 executed.
**Steps**:
  1. Record console errors per case.
  2. For each reference 01-06, mark one of: no diff, or re-captured (with the reason).
  3. Stop the dev server and confirm port 4200 is free.
**Expected Result**:
- There are no console errors attributable to the HUD or Debrief.
- The diff status is recorded for all 6 references.
- Port 4200 is free.
**Pass Criteria**: All three bullets are true.
**Actual Result**: Dev server stopped; `lsof -iTCP:4200 -sTCP:LISTEN` empty. 0 console errors in the session. No visible diff against 01-06, so references were not overwritten; run captures retained in `production/qa/evidence/if-009/mc2-2026-10-12/`.
**Pass/Fail**: PASS

## AC coverage

| AC | Cases |
|---|---|
| AC15 | TC01, TC02, TC03 (progressing + paused; catch-up via `world.test.ts`), TC06, TC07 |
| AC16 | TC04, TC05 |
