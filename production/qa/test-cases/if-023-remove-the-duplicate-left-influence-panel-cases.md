# IF-023 manual test cases: Remove the duplicate left INFLUENCE panel

- **Story**: `production/epics/interface/story-023-remove-the-duplicate-left-influence-panel.md` (AC-1; AC-2 guard)
- **Story type**: UI. **Gate**: BLOCKING (retained screenshot of each state touched). **Output**: screenshots and a click-through `README.md`. The story's Test Evidence names `production/qa/evidence/if-023/`; the existing evidence lives in `production/qa/evidence/sprint-011/`. Use whichever directory the Phase 5 run names, and say which one in the README.
- **Sources**: the story's `## QA Test Cases` and Acceptance Criteria; `production/qa/qa-plan-sprint-011-2026-10-23.md` (IF-023 Manual QA Checklist, incl. the AC-2 guard); `production/qa/qa-strategy-sprint-011-2026-10-24.md` §5 F6 and §6 (IF-023 row, H4).
- **Build under test**: HEAD `131a5c1`.
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude (headless). Sign-off: qa-lead.

## Execution mode

Every case runs headless in Chrome for Testing (`npx playwright-cli`, or Playwright through `playwright-core` as `probe.mjs` and the harness do) at exactly **1280x720** against `npm run dev` on port 4200. Never use the user's Chrome.

- **"Covered by R1 probe check: <name>"**: the case passes when the R1 re-run of `production/qa/evidence/sprint-011/probe.mjs` on HEAD prints `PASS` on that exact check line, and the named capture shows the expected state. No separate walk is needed, but the executor still reads the transcript line and opens the PNG.
- **"Hand-walk"**: no probe check covers the case. Run it in a scratch script that reuses the probe's fixtures (`fresh()`, `dismissCard()`, `pause()`, `setScale()`, `install()` and the `window.__probe` helpers), or through the harness where stated.

## Shared preconditions

1. `git rev-parse --short HEAD` prints `131a5c1`, and `git status --short src` prints nothing (the build under test is HEAD's `src/`).
2. `npm run dev` listens on port 4200. The browser is headless at a 1280x720 viewport (`page.viewportSize()` returns `{ width: 1280, height: 720 }`).
3. Fixture names come from `probe.mjs` `STATES`. `opening` = New Operation through `save.startNewOperation()`, World Network, card dismissed (`markSeen('hint-worldmap')`), clock paused. `opening-card` = the same with the card left up. `failed` = `opening` + `campaignFailed: true`.
4. **Influence balance figure** means any visible text that prints the player's current Influence balance. The cost labels (`8P`/`10P`/`12P` on the action buttons, `n PTS` in the Influence-moment note) are prices, not the balance. To keep a price from being mistaken for the balance, the spend cases suppress the Influence note with `markSeen('hint-influence')`, as the probe does.
5. Afterwards: stop the dev server and the harness, confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` prints nothing), and close every browser.

---

## IF-023-TC-01: Left column holds SECTORS only and the header prints Influence, at 90%

**AC covered**: AC-1
**Mode**: Covered by R1 probe check: `IF-023 scale 90: left column holds SECTORS only; header prints Influence`, plus `IF-026 world network scale 90: nothing clips`
**Preconditions**: Shared 1-3. Fixture `opening`. Text scale 90 (`setScaleText(90)` via `useSettingsStore.getState().setTextScale(90)`).
**Steps**:
1. Run R1 (`probe.mjs`) on HEAD.
2. Find the two check lines above for scale 90 in the transcript.
3. Open `if-023-024-world-90.png`.

**Expected Result**: The IF-023 line reads `PASS` with `1 panel(s) ["SECTORS"]`, and its header list contains an entry that starts with `INFLUENCE` (at `ad176af` it was `"INFLUENCE0 PTS"`). The IF-026 clip line reads `PASS`. The capture shows one panel titled SECTORS in the left column, no INFLUENCE panel, and `INFLUENCE 0 PTS` in the header.
**Pass Criteria**: Both lines read `PASS`, and the capture shows no INFLUENCE panel in the left column.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-02: Left column holds SECTORS only and the header prints Influence, at 100%

**AC covered**: AC-1
**Mode**: Covered by R1 probe check: `IF-023 scale 100: left column holds SECTORS only; header prints Influence`, plus `IF-026 world network scale 100: nothing clips`
**Preconditions**: As TC-01, text scale 100.
**Steps**:
1. Use the R1 run from TC-01.
2. Find the two check lines for scale 100.
3. Open `if-023-024-world-100.png`.

**Expected Result**: As TC-01, at 100%.
**Pass Criteria**: Both lines read `PASS`, and the capture shows no INFLUENCE panel in the left column.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-03: Left column holds SECTORS only and the header prints Influence, at 110%

**AC covered**: AC-1
**Mode**: Covered by R1 probe check: `IF-023 scale 110: left column holds SECTORS only; header prints Influence`, plus `IF-026 world network scale 110: nothing clips`
**Preconditions**: As TC-01, text scale 110.
**Steps**:
1. Use the R1 run from TC-01.
2. Find the two check lines for scale 110.
3. Open `if-023-024-world-110.png`.

**Expected Result**: As TC-01, at 110%.
**Pass Criteria**: Both lines read `PASS`, and the capture shows no INFLUENCE panel in the left column.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-04: Left column holds SECTORS only and the header prints Influence, at 125%

**AC covered**: AC-1
**Mode**: Covered by R1 probe check: `IF-023 scale 125: left column holds SECTORS only; header prints Influence`, plus `IF-026 world network scale 125: nothing clips`
**Preconditions**: As TC-01, text scale 125.
**Steps**:
1. Use the R1 run from TC-01.
2. Find the two check lines for scale 125.
3. Open `if-023-024-world-125.png`.

**Expected Result**: As TC-01, at 125%.
**Pass Criteria**: Both lines read `PASS`, and the capture shows no INFLUENCE panel in the left column.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-05: SECTORS takes the column height, and its list scrolls to Antarctica at every scale

**AC covered**: AC-1 (pass condition: "a scrolling SECTORS list with Antarctica reachable counts as not clipped"; observation: visible sector rows)
**Mode**: Hand-walk (the probe checks for clipping but does not scroll the list, check that Antarctica can be reached, check that the panel fills the column, or count rows)
**Preconditions**: Shared 1-3. Fixture `opening`.
**Steps**:
1. For each scale 90, 100, 110, 125: `setScale(scale)`, wait 250 ms, `install()`.
2. Read the boxes of `aside.wm-left` and `.wm-sectors` (the SECTORS panel). Record the gap: `wm-left.bottom - wm-sectors.bottom` in px.
3. Read `.wm-sector-list`: `clientHeight`, `scrollHeight`, and how many `.wm-sector` buttons are fully inside the list's visible box. Record that count as an observation.
4. Scroll `.wm-sector-list` to `scrollTop = scrollHeight`. Wait one frame. Read the box of the `.wm-sector` whose `aria-label` is `ANTARCTICA // NO SURVEY DATA`.
5. Capture `if-023-sectors-scrolled-<scale>.png`.

**Expected Result**: At each scale, the SECTORS panel ends within 2 px of the bottom of `aside.wm-left`, so it does not leave a gap where the INFLUENCE panel was (story Implementation Notes: "the list grows rather than leaving a gap"). After the scroll, the Antarctica row lies fully inside the list's visible box (top >= list top, bottom <= list bottom), and the capture shows it. The visible row count is recorded for each scale.
**Pass Criteria**: At all four scales, the gap is <= 2 px and the Antarctica row is fully visible after scrolling to the end.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-06: First-visit card showing: left column still SECTORS only, nothing clips, at four scales

**AC covered**: AC-1 (edge case: "the first-visit card showing")
**Mode**: Hand-walk (the probe's four-scale IF-023 loop runs on `opening`, with the card dismissed)
**Preconditions**: Shared 1-3. Fixture `opening-card` (card up, clock paused).
**Steps**:
1. For each scale 90, 100, 110, 125: `setScale(scale)`, wait 250 ms, `install()`.
2. Read `[...document.querySelectorAll('.wm-left .panel-title')].map(t => t.textContent.trim())` and `document.querySelectorAll('.wm-left > *').length`.
3. Read the header: `[...document.querySelectorAll('.wm-resource')].map(r => r.textContent.trim())`.
4. Run `window.__probe.clipped('.screen')`.
5. Confirm the card is still up: `UNDERSTOOD` is visible.
6. Capture `if-023-card-<scale>.png`.

**Expected Result**: At each scale, the titles are `["SECTORS"]` with one child in `.wm-left`, one header entry starts `INFLUENCE` and ends `PTS`, `clipped('.screen')` returns `[]`, and the card is up. The capture shows the card and the left column with no INFLUENCE panel.
**Pass Criteria**: At all four scales: one panel titled SECTORS, header Influence present, zero clip hits, card visible.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-07: Campaign banner posted at 125%: left column still SECTORS only, nothing clips

**AC covered**: AC-1 (edge case: "a campaign banner posted at 125%")
**Mode**: Hand-walk (the probe captures the failed and complete banners at 100% only)
**Preconditions**: Shared 1-3. Text scale 125.
**Steps**:
1. Enter fixture `failed`. Set scale 125, wait 250 ms, `install()`.
2. Confirm the banner line reads `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`.
3. Repeat TC-06 steps 2-4.
4. Capture `if-023-banner-failed-125.png`.
5. Enter fixture `opening`, then set `useCampaignStore.setState({ campaignWon: true, contractsWon: ['m01', 'm02', 'm03'] })` (the probe's complete-banner patch). Set scale 125, wait 250 ms, `install()`.
6. Confirm `.wm-campaign-win b` reads `CAMPAIGN COMPLETE`.
7. Repeat TC-06 steps 2-4.
8. Capture `if-023-banner-complete-125.png`.

**Expected Result**: With each banner up, the left column is `["SECTORS"]` (one child), the header has the `INFLUENCE n PTS` entry, and `clipped('.screen')` returns `[]`. The captures show the banner and the left column, and neither overlaps the other.
**Pass Criteria**: Both banner states: one panel titled SECTORS, header Influence present, zero clip hits.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-08: Header Influence debits in the frame the action turns ACTIVE

**AC covered**: AC-2 (spend half)
**Mode**: Covered by R1 probe check: `IF-023 header Influence debits in the frame the action turns ACTIVE`
**Preconditions**: Shared 1-3. Fixture `opening`, then `influence: 8, selected: 'na'` and `markSeen('hint-influence')` (probe block "IF-023 AC-2"). At 8 points, STABILIZE (8) is the only affordable action.
**Steps**:
1. Use the R1 run from TC-01.
2. Find the check line above.

**Expected Result**: The line reads `PASS` with detail `INFLUENCE8 PTS -> INFLUENCE0 PTS, status ACTIVE` (the value at `ad176af`). The probe reads the header and the status word in the same snapshot, two animation frames after the click.
**Pass Criteria**: The line reads `PASS`, and its detail shows 8 -> 0 with status `ACTIVE`.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-09: Stabilize spend, named: exact debit in the ACTIVE frame; no other Influence balance figure on screen

**AC covered**: AC-2 (spend half; "no other Influence figure remains on the screen")
**Mode**: Hand-walk. The probe clicks the first enabled `.wm-act` without checking that it is STABILIZE. It checks only that the header changed (`before !== after`), not that it fell by the cost. It never looks for a second balance figure. At 8 points its balance also equals the STABILIZE price, so a price could be taken for the balance.
**Preconditions**: Shared 1-4. Fixture `opening`, then `useWorldStore.setState({ influence: 10, selected: 'na' })` and `useTutorialStore.getState().markSeen('hint-influence')`. Wait 200 ms, `install()`. 10 points is >= the Stabilize cost (8), and the expected balance after the spend (2) matches no price.
**Steps**:
1. Read the header `INFLUENCE` `.wm-resource` text. Expect `INFLUENCE10 PTS`.
2. Find the `.wm-act` whose `.wm-act-name` contains `STABILIZE`. Read its `.wm-act-status`. Expect `CLEAR`.
3. In one `page.evaluate`: click that button, await one `requestAnimationFrame`, then return the header Influence text, that button's `.wm-act-status` text, and `useWorldStore.getState().influence`.
4. Capture `if-023-spend-active.png` straight after step 3.
5. In the same state, collect every visible text node on the page (`window.__probe.runs('body')`) and list those matching `/\bINFLUENCE\b/` or `/\b2\s*PTS\b/`, with their element paths.

**Expected Result**: Step 3 returns header `INFLUENCE2 PTS`, status `ACTIVE` and store `2`, all from the same frame. The capture shows `INFLUENCE 2 PTS` in the header and STABILIZE reading ACTIVE. In step 5, the only element printing the balance is the header `.wm-resource`. Other matches are allowed only if they are not balance figures, and each must be named in Actual Result (e.g. a Feed line `STABILIZATION ASSETS DEPLOYED IN NORTH AMERICA` has no figure). No left-column element matches.
**Pass Criteria**: The header reads exactly 10 - 8 = 2 PTS in the same snapshot where the STABILIZE status reads `ACTIVE`, and no element other than the header prints the balance.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-10: Played clean win: header carries the award on the World Network return

**AC covered**: AC-2 (award half; strategy F6/H4; plan smoke item 4)
**Mode**: Hand-walk (played through the harness; no probe check covers the award)
**Preconditions**: Shared 1-3. The harness runs on the dev server: `node production/qa/playtests/harness/play-server.mjs <scratch session dir>` (headless Chrome for Testing, 1280x720, `:4200`). New Operation from the Menu (Influence 0). Rules of the run (`docs/mission-playbook.md`): play through the game's own controls and write no store field. If a civilian is hit, pause, abort and redeploy, because the clean bonus needs `civiliansHit === 0`.
**Steps**:
1. On the World Network, `look`. Record the header `INFLUENCE n PTS` (expect `0 PTS`).
2. Select Rust Haven, then Brief, Assembly and Deploy. Play the mission to a win with no civilian hit.
3. On the Debrief, `look` (capture `if-023-debrief-award.png`). Record the header chip `INFLUENCE n` and the Debrief's civilian line. Run `state` and record `result`.
4. `clicktext RETURN TO WORLD NETWORK`, then `look` straight away (capture `if-023-return-award.png`). Record the header `INFLUENCE n PTS`.
5. From the `look` text in step 4, list every line that contains `INFLUENCE` or the awarded number followed by `PTS`.

**Expected Result**: The award is `INFLUENCE_WIN_PTS` 6 + `INFLUENCE_CLEAN_PTS` 2 = 8 (`src/game/influence.ts`; `worldStore.applyMissionResult`). The Debrief chip already reads `INFLUENCE 8`: `applyDebrief` runs in the Debrief's `useLayoutEffect`, before paint. The first World Network capture after the return reads `INFLUENCE 8 PTS`, which matches smoke item 4's recorded 0 -> 8. Only the header prints the balance. Note: the harness capture comes about 120 ms after the click, not on the first frame. TC-11 covers the first frame.
**Pass Criteria**: The return capture's header reads before + 8 PTS (8 from a New Operation), and no other element on the World Network prints the balance. If the win was not clean, the case is void. Re-run it; do not mark it failed.
**Actual Result**:
**Pass/Fail**:

## IF-023-TC-11: Header carries the award on the first frame of a clean-win Debrief return (seeded)

**AC covered**: AC-2 (award half: "the awarded value on the first frame of the return"; strategy H4)
**Mode**: Hand-walk, **seeded**. The harness has no evaluate command (its commands are look, click, drag, move, wheel, key, holdkey, type, clicktext, wait, savefile, fixture, loadsave and state), so it cannot read the first frame. Per `docs/mission-playbook.md`, the evidence must say that the outcome was seeded.
**Preconditions**: Shared 1-3. A scratch script page: `fresh()`, then `dismissCard()`. Read `lastAppliedKey` from `useAppStore`. Seed a clean-win outcome for Rust Haven (`m03`): `useAppStore.setState({ missionId: 'm03', phase: 'debrief', outcome: { applyKey: lastAppliedKey + 1, won: true, civiliansHit: 0, quietReplay: false, kills: 0, casualties: 0, timeSec: 600, reward: 0, bonus: 0, collateral: 0, netPayout: 0, deadIds: [], survivorHp: {} } })`. Wait 500 ms.
**Steps**:
1. On the Debrief, read the header chip that starts `INFLUENCE` and `useWorldStore.getState().influence`. Capture `if-023-seeded-debrief.png`.
2. In one `page.evaluate`: find the button whose text is `RETURN TO WORLD NETWORK`, click it, await one `requestAnimationFrame`, then return `useAppStore.getState().phase`, the header `.wm-resource` INFLUENCE text, and the count of `.wm-left > *`.
3. Capture `if-023-seeded-return-first-frame.png` straight after step 2.
4. `install()`, then list every visible text run matching `/\bINFLUENCE\b/` or `/\b8\s*PTS\b/` (`window.__probe.runs('body')`), with element paths.

**Expected Result**: Step 1 reads chip `INFLUENCE 8` and store `8` (0 + 6 + 2). Step 2 returns phase `world`, header `INFLUENCE8 PTS` and `1` left-column child, all on the first animation frame after the click. Step 4 finds the balance only in the header `.wm-resource`.
**Pass Criteria**: On the first frame after RETURN TO WORLD NETWORK, the header reads `INFLUENCE 8 PTS`, the phase is `world`, and no other element prints the balance. The README labels this capture **seeded**.
**Actual Result**:
**Pass/Fail**:

---

## AC coverage map

| AC | Cases | R1 probe | Hand-walk |
|---|---|---|---|
| AC-1 SECTORS only, header Influence, nothing clips at 90/100/110/125 | TC-01 to TC-07 | TC-01 to TC-04 | TC-05 (Antarctica reachable, no gap, row count), TC-06 (card), TC-07 (banner at 125) |
| AC-2 header Influence after a spend and an award, same frame; no other figure | TC-08 to TC-11 | TC-08 | TC-09 (named Stabilize, exact debit, no second figure), TC-10 (played award), TC-11 (first-frame award, seeded) |
