# IF-039: Brief, Assembly, Debrief and Abort say what actually happens (manual test cases)

**Story**: `production/epics/interface/story-039-brief-assembly-debrief-and-abort-say-what-happens.md`
**Story type**: UI | **Evidence location**: `production/qa/evidence/sprint-011-head-2026-10-24/` (R4 output in `r4-playtest-sweep/`, hand-walk captures in a sibling `if-039/` folder) | **Gate level**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Sources**: the story's five Acceptance Criteria (exact copy is the AC string); `production/qa/qa-plan-sprint-011-2026-10-24.md` lines 24 and 46 (IF-039: "R2 and R4 (Brief, Assembly, Debrief KIA, HUD at 125); copy read"); `production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs` (R4); `design/ux/brief.md` row 179 (COLLATERAL).
**Added to cycle**: IF-039 was not in the Sprint 11 plan's story list; added to this QA cycle (strategy F11 scope drift).
**Written**: 2026-10-24 (qa-tester, `/team-qa` Sprint 11 Phase 4)

## Run conditions (all cases)

- Executor: Claude, headless Chrome for Testing (the `playwright-core` launch in `sweep.mjs`, or `npx playwright-cli`), viewport exactly 1280x720. Never the user's Chrome.
- App: `npm run dev` on port 4200, URL `http://localhost:4200/`. After the run, stop the server and confirm nothing listens on port 4200.
- Text scale 100% and high contrast off unless a case says otherwise. Scale and contrast are set through `useSettingsStore.getState().setTextScale(n)` / `setHighContrast(b)`, as in `sweep.mjs`.
- Fixtures are set through the stores, as in `sweep.mjs`. `fresh()` = goto URL, `localStorage.clear()`, reload, wait 1200 ms, `save.startNewOperation()`, mark `hint-worldmap`, `hint-influence` and `hint-debrief-research` seen. Named R4 fixtures used below: `brief` (`selectMission('m03')`), `team` (`selectMission('m03')` then `goto('team')`), `debrief` (won, 0 deaths), `debriefkia` (won, `deadIds: ['op3']`, civiliansHit 1), `mission` (`team` then `startMission()`, wait 6 s), `pause` (`mission` then Escape).
- **R4 run command** (cases marked "Covered by R4 check"): `SURFACES=brief,team,debrief,debriefkia,mission,pause PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/r4-playtest-sweep/ node production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs`. `PROBE_OUT` is required: without it the script writes into its own folder and overwrites the 2026-10-23 evidence. (The script's header comment names `screens-2026-10-23/sweep.mjs`, which is R2. R4 is the `playtest-fixes-2026-10-23` copy.) Do not edit the script. A FAIL is filed as a bug.
- R4 check names are the lines in `sweep-output.txt` under `## <surface>`, for example `mission` / `clip @125`. A clip check passes when its count is 0. R4 measures layout only (clip, truncation, spill, off-screen, overlap, contrast, targets). **It does not read copy.** Every exact-copy case is therefore a Hand-walk.
- Build facts read from source on 2026-10-24 (not a spec). `src/` differs from `2c73542` only in `src/main.tsx` and `src/perfHooks.ts`, per `git diff --stat 2c73542 HEAD -- src`. Fresh campaign: 8 operatives, every `xp` is 0 (`initialCampaignData`), `ROSTER_CAP` 8. `m01` and `m02` have `intelReq: 2`, and `selectMission` refuses a locked contract, so cases that open them first set `useCampaignStore.setState({ intelLevel: 2 })`. Days: m01 2, m02 4, m03 3; generated contracts 2/3/4 by threat MODERATE/HIGH/SEVERE.
- Selectors seen in source: `.mb-reward-eta`, `.mb-collateral`, `.mb-obj`, `.mb-note` (Brief); `.ts-deploy-sub`, `.ts-loadout-hint` (Assembly); `.pause-arm-hint`, `button.hud-btn.abort` (Pause); `.hud-objectives .hud-panel-head` (HUD). The Debrief row container is not named here. **Locate it at run time** (find the rows by the text `KIA //`).

## Coverage map

| AC | Cases |
|---|---|
| AC-1 Brief: collateral box, notes, days line, PRIMARY to QUATERNARY | IF039-TC-01, -02, -03, -04, -05, -06 |
| AC-2 Assembly: deploy line names the contract; slot-cycle hint | IF039-TC-07, -08 |
| AC-3 Debrief: one `KIA // <CODENAME>` row per death with `n XP LOST // ROSTER r/cap` | IF039-TC-09, -10, -11 |
| AC-4 Abort-armed hint copy | IF039-TC-12, -13 |
| AC-5 HUD panel head wraps inside its panel at 125% | IF039-TC-14, -15, -16 |

| Case | Mode |
|---|---|
| IF039-TC-01 | Hand-walk |
| IF039-TC-02 | Hand-walk |
| IF039-TC-03 | Hand-walk |
| IF039-TC-04 | Hand-walk |
| IF039-TC-05 | Hand-walk |
| IF039-TC-06 | Covered by R4 check: `brief` / `clip @90`, `clip @100`, `clip @110`, `clip @125` |
| IF039-TC-07 | Hand-walk |
| IF039-TC-08 | Covered by R4 check: `team` / `clip @90`, `clip @100`, `clip @110`, `clip @125` |
| IF039-TC-09 | Hand-walk |
| IF039-TC-10 | Hand-walk |
| IF039-TC-11 | Covered by R4 check: `debriefkia` / `clip @90`, `clip @100`, `clip @110`, `clip @125` |
| IF039-TC-12 | Hand-walk |
| IF039-TC-13 | Covered by R4 check: `pause` / `clip @125` (layout of the Pause panel only; R4 does not arm Abort) |
| IF039-TC-14 | Covered by R4 check: `mission` / `clip @125` |
| IF039-TC-15 | Hand-walk |
| IF039-TC-16 | Hand-walk |

Note on TC-13: the R4 `pause` fixture never presses ABORT, so the armed hint is empty while R4 measures. TC-13 shows only that the Pause panel itself does not clip. The hint's own fit at 125% is a step in TC-12.

---

## IF039-TC-01: Brief collateral box prints the rule, with no meter or percentage

**Mode**: Hand-walk
**AC covered**: AC-1 (collateral box)
**Preconditions**:
- Run conditions above. Dev server up on 4200.
- `fresh()`, then `useCampaignStore.setState({ intelLevel: 2 })`.

**Steps**:
1. `selectMission('m03')`, wait 800 ms. Confirm `useAppStore.getState().phase === 'brief'`.
2. Scroll the dossier `ScrollBox` until the `COLLATERAL:` box is in view. Capture `if039-tc01-m03.png`.
3. Read `document.querySelector('.mb-collateral').innerText`, trimmed and with whitespace collapsed.
4. In the same `.mb-box`, list every descendant. Record any `SegBar`/meter element, and any text matching `/%/` or `/LOW|MODERATE|HIGH \(/`.
5. Import `COLLATERAL_FINE` from `/src/state/appStore.ts` and record its value.
6. Repeat steps 1 to 4 for `m01` and `m02` (go back with `goto('world')` first). Capture `if039-tc01-m01.png` and `if039-tc01-m02.png`.
7. Search the whole Brief's `innerText` for `COLLATERAL TOLERANCE` and `(10%)`.

**Expected Result**: On all three Briefs the collateral text is exactly `5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD`, the box's label is `COLLATERAL:`, and the full line reads `COLLATERAL: 5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD`. `COLLATERAL_FINE` is 5000, so the printed figure comes from it. The box holds no meter or bar and no `%`. `COLLATERAL TOLERANCE` and `(10%)` appear nowhere on the Brief.
**Pass Criteria**: For each of m01, m02 and m03, the string equals `5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD`, AND the meter/percent search finds 0 matches, AND step 7 finds 0 matches. Any difference fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-02: Brief contract notes say `EVERY CIVILIAN HIT IS BILLED.` (authored and generated, every archetype)

**Mode**: Hand-walk
**AC covered**: AC-1 (notes, "GIVEN any Brief")
**Preconditions**:
- As TC-01 (`intelLevel: 2`).
- For the generated contracts: after `fresh()`, read `useWorldStore.getState().contracts`. If it is empty, locate a contract source at run time and record what was used. Clone `contracts[0]` three times with new ids `qa039-seizure`, `qa039-extraction`, `qa039-sabotage` and `type` SEIZURE / EXTRACTION / SABOTAGE, and push the clones with `useWorldStore.setState`. Set `useCampaignStore.setState({ intelLevel: 5 })` so none of them is intel-locked.

**Steps**:
1. For each of `m01`, `m02`, `m03`, `qa039-seizure`, `qa039-extraction`, `qa039-sabotage`: `goto('world')`, then `selectMission(id)`, and wait 800 ms.
2. Confirm `phase === 'brief'`. Scroll to `MISSION NOTES:` and capture `if039-tc02-<id>.png`.
3. Collect `[...document.querySelectorAll('.mb-note')].map(n => n.innerText.trim())`.
4. Record whether any line contains `EVERY CIVILIAN HIT IS BILLED.` exactly.

**Expected Result**: Every one of the six Briefs has at least one MISSION NOTES line containing `EVERY CIVILIAN HIT IS BILLED.`.
**Pass Criteria**: 6 of 6 Briefs contain the exact substring `EVERY CIVILIAN HIT IS BILLED.` in a `.mb-note`. Any Brief without it fails the case. Record the full notes list for each Brief that fails.
**Tester note (source read, not executed)**: `src/game/data.ts` m03 RUST HAVEN notes and `src/game/contracts.ts` `DENSITY_NOTE.industrial` (used for every SABOTAGE contract) read `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.`. Neither contains the AC phrase. Expect m03 and `qa039-sabotage` to fail, and confirm or refute this by running the case. m03 is the Brief the story's own sweep captured.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-03: Brief reward block adds `A WIN SPENDS n DAYS OF WORLD TIME`

**Mode**: Hand-walk
**AC covered**: AC-1 (days line)
**Preconditions**: As TC-01 (`intelLevel: 2`).

**Steps**:
1. `selectMission('m03')`, wait 800 ms.
2. Read `.mb-reward-eta` `innerText` (trimmed). Confirm it sits inside the `.mb-reward` block (`el.closest('.mb-reward')` is not null).
3. Record `resolveMission('m03').etaDays` (import from `/src/state/worldStore.ts`).
4. Repeat for `m01` and `m02`.
5. Search the Brief's `innerText` for `ETA 4D`, `ETA 3D` and `ETA 2D`.
6. Capture `if039-tc03-m03.png` with the reward block visible.

**Expected Result**: m03 reads `A WIN SPENDS 3 DAYS OF WORLD TIME`, m01 `A WIN SPENDS 2 DAYS OF WORLD TIME`, m02 `A WIN SPENDS 4 DAYS OF WORLD TIME`. Each `n` equals that mission's `etaDays`. The line is inside the reward block. No `ETA nD` string remains.
**Pass Criteria**: All three strings equal the expected text exactly, AND each `n` matches `etaDays`, AND `.closest('.mb-reward')` is non-null for each, AND step 5 finds 0 matches.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-04: Authored four-step contracts number PRIMARY, SECONDARY, TERTIARY, QUATERNARY

**Mode**: Hand-walk
**AC covered**: AC-1 (step numbering)
**Preconditions**: As TC-01 (`intelLevel: 2`). From source: m03 has required `rh1`, `rh2`, `rh3`, `rh4` and optional `rh-opt`; m02 has required `hc1`, `hc2`, `hc3`, `hc4` and optional `hc-opt`; m01 has three required steps.

**Steps**:
1. `selectMission('m03')`, wait 800 ms. Scroll the dossier until every `.mb-obj` is in view, capturing each scroll position (`if039-tc04-m03-*.png`).
2. For each `.mb-obj`, in DOM order, record the text of its first `b` (the tier word) and the label text.
3. Repeat for `m02` and `m01`.

**Expected Result**:
- m03, in order: `PRIMARY:` REACH THE RELAY YARD; `OPTIONAL:` DROP THE BACKUP TRANSFORMER (+6,000 CR); `SECONDARY:` DESTROY THE THREE FUEL RELAYS; `TERTIARY:` HOLD THE YARD FOR THE BURN; `QUATERNARY:` EXTRACT THE SQUAD.
- m02, in order: `PRIMARY:`; `OPTIONAL:` (PULL THE DETENTION SERVER); `SECONDARY:`; `TERTIARY:`; `QUATERNARY:`.
- m01: `PRIMARY:`, `SECONDARY:`, `TERTIARY:`, and no `QUATERNARY:`.
- No tier word is printed twice on any Brief, and an optional step never takes a tier number.

**Pass Criteria**: The tier sequences for m03 and m02 are exactly `[PRIMARY, OPTIONAL, SECONDARY, TERTIARY, QUATERNARY]`, AND m01 is exactly `[PRIMARY, SECONDARY, TERTIARY]`. Any repeated tier word fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-05: Generated four-step contracts (SABOTAGE variant 1, EXTRACTION) reach QUATERNARY

**Mode**: Hand-walk
**AC covered**: AC-1 (step numbering, "any Brief")
**Preconditions**:
- `fresh()`, `useCampaignStore.setState({ intelLevel: 5 })`.
- In the page, `import('/src/game/contracts.ts')` and loop `seed = 1, 2, ...` until `sequenceVariant(seed) === 1`, then record that seed `S1`. Clone `useWorldStore.getState().contracts[0]` as `qa039-sab-v1` (`type: 'SABOTAGE'`, `seed: S1`) and as `qa039-ext` (`type: 'EXTRACTION'`, any seed). Push both. If `contracts` is empty, locate a contract source at run time.

**Steps**:
1. `selectMission('qa039-sab-v1')`, wait 800 ms. Record the tier words of every `.mb-obj` in order. Capture `if039-tc05-sab.png`.
2. `goto('world')`, `selectMission('qa039-ext')`, and record the same.
3. Record the contract objects used (id, type, seed, `sequenceVariant(seed)`).

**Expected Result**: SABOTAGE variant 1 has four required steps: `PRIMARY:` REACH THE RELAY YARD, `SECONDARY:` DESTROY THE THREE FUEL RELAYS, `TERTIARY:` HOLD THE YARD FOR THE BURN, `QUATERNARY:` EXTRACT THE SQUAD. EXTRACTION has four required steps ending in `QUATERNARY:` EXTRACT THE SQUAD, plus `OPTIONAL:` PULL THE DETENTION SERVER only when its variant is 2. No tier word repeats.
**Pass Criteria**: Both Briefs show exactly one each of `PRIMARY:`, `SECONDARY:`, `TERTIARY:` and `QUATERNARY:` on their required steps, in that order. Any repeat or a missing QUATERNARY fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-06: Brief does not clip at 90/100/110/125%

**Mode**: Covered by R4 check: `brief` / `clip @90`, `clip @100`, `clip @110`, `clip @125`
**AC covered**: AC-1 (the new collateral and days lines fit, TR-interface-002)
**Preconditions**: Run conditions. R4 run with the command above (fixture `brief` = m03).

**Steps**:
1. Start the dev server and run R4 to completion.
2. In `r4-playtest-sweep/sweep-output.txt`, find `## brief` and its four `clip @` lines.
3. Open `brief-125.png` and check that it is 1280x720.

**Expected Result**: `clip @90: 0`, `clip @100: 0`, `clip @110: 0`, `clip @125: 0`. The `## brief` block is present (not `NOT MEASURED`). The PNG is 1280x720.
**Pass Criteria**: All four counts are 0 AND the block is measured AND the PNG is 1280x720. Any nonzero count fails the case; record its listed lines.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-07: Assembly deploy line names the contract; loadout shows the slot-cycle hint

**Mode**: Hand-walk
**AC covered**: AC-2
**Preconditions**: `fresh()`, `useCampaignStore.setState({ intelLevel: 2 })`. Default squad (op1 to op4), which is not refused for deploy. From source: when a deploy refusal applies, `.ts-deploy-sub` shows the refusal text instead.

**Steps**:
1. `selectMission('m03')`, then `goto('team')`, and wait 900 ms. Capture `if039-tc07-m03.png`.
2. Read `.ts-deploy-sub` `innerText` (trimmed, whitespace collapsed). Record whether the DEPLOY TEAM button is enabled.
3. Read `.ts-loadout-hint` `innerText`. Confirm it is inside the ITEM SLOTS box (`.ts-box`) above `.ts-loadout`.
4. Click the first `.ts-loadout-slot` three times. After each click, record the slot's text and `filled` class.
5. Repeat steps 1 and 2 for `m01` and `m02`.

**Expected Result**: m03 reads `RUST HAVEN // A WIN SPENDS 3 DAYS OF WORLD TIME`, m01 `GLASS VEIL // A WIN SPENDS 2 DAYS OF WORLD TIME`, m02 `HOLLOW CROWN // A WIN SPENDS 4 DAYS OF WORLD TIME`. The hint reads exactly `CLICK A SLOT TO CYCLE: EMPTY > MED KIT > POWER CELL`. The three clicks step the slot EMPTY to MED KIT to POWER CELL to EMPTY, so the hint describes what happens.
**Pass Criteria**: All three deploy strings equal the expected text (DEPLOY enabled, so no refusal text) AND the hint string matches exactly AND the click cycle matches the hint order. Any mismatch fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-08: Assembly does not clip at 90/100/110/125%

**Mode**: Covered by R4 check: `team` / `clip @90`, `clip @100`, `clip @110`, `clip @125`
**AC covered**: AC-2 (the deploy line and the hint fit)
**Preconditions**: As TC-06 (fixture `team` = m03).

**Steps**:
1. Use the TC-06 R4 run.
2. In `sweep-output.txt`, read the `## team` block's four `clip @` lines.
3. Open `team-125.png` and confirm the deploy line and the hint are visible, not cut.

**Expected Result**: All four counts are 0. In `team-125.png` both lines are fully visible.
**Pass Criteria**: All four counts are 0 AND the block is measured AND both strings are visible in the PNG.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-09: Debrief with one death prints one `KIA // <CODENAME>` row with XP lost and roster

**Mode**: Hand-walk
**AC covered**: AC-3
**Preconditions**: Run conditions. Fixture `debriefkia` exactly as in `sweep.mjs` (`team` m03, then `setOutcome(settleOutcome({ won: true, kills: 6, casualties: 1, timeSec: 72, civiliansHit: 1, reward: 37000, deadIds: ['op3'], survivorHp: { op1: 0.9, op2: 0.3, op4: 0.8 }, ... }))`), wait for `.db-filing`, then 2500 ms.

**Steps**:
1. Build the fixture. Capture `if039-tc09.png`.
2. Collect every Debrief row whose label starts with `KIA //` (locate the row container at run time), recording label and value.
3. Record `useCampaignStore.getState().operatives.length` and `lastReport.kia`.
4. Confirm no other line on the Debrief prints the bare codename `DART` as a red name without the `KIA //` label.

**Expected Result**: Exactly one KIA row. Label `KIA // DART`, value `0 XP LOST // ROSTER 7/8` (fresh roster xp is 0, 8 minus 1 dead = 7, cap 8). The row sits after `SQUAD CASUALTIES` and before any `INJURED //` rows. `operatives.length` is 7.
**Pass Criteria**: Count of `KIA //` rows equals 1 AND label equals `KIA // DART` AND value equals `0 XP LOST // ROSTER 7/8`. Anything else fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-10: Two deaths with experience give two rows, each with its own XP; zero deaths give none

**Mode**: Hand-walk
**AC covered**: AC-3 ("each KIA is its own row"; nonzero `n`)
**Preconditions**: `fresh()`, then `team` m03 (wait 900 ms). Then seed experience: `useCampaignStore.setState(s => ({ roster: { ...s.roster, op1: { ...s.roster.op1, xp: 120 }, op3: { ...s.roster.op3, xp: 45 } } }))`, and confirm the values read back.

**Steps**:
1. `setOutcome(settleOutcome({ applyKey: lastAppliedKey + 1, won: true, kills: 4, casualties: 2, timeSec: 120, civiliansHit: 0, reward: 41000, bonus: 0, deadIds: ['op1', 'op3'], survivorHp: { op2: 0.9, op4: 0.9 }, quietReplay: false }))`. Wait for `.db-filing`, then 2500 ms. Capture `if039-tc10-two.png`.
2. Collect every `KIA //` row (label, value, order).
3. Run a fresh R4 `debrief` fixture (won, `deadIds: []`) and count the `KIA //` rows. Capture `if039-tc10-none.png`.

**Expected Result**: Two separate rows: `KIA // MARA` with `120 XP LOST // ROSTER 6/8`, and `KIA // DART` with `45 XP LOST // ROSTER 6/8`. Order follows the roster order (MARA before DART). The zero-death Debrief has 0 `KIA //` rows.
**Pass Criteria**: Exactly 2 KIA rows with exactly those label/value pairs, AND 0 KIA rows on the zero-death Debrief. Combined rows, a wrong XP or a wrong roster count fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-11: Debrief with KIA does not clip at 90/100/110/125%

**Mode**: Covered by R4 check: `debriefkia` / `clip @90`, `clip @100`, `clip @110`, `clip @125`
**AC covered**: AC-3 (KIA rows fit)
**Preconditions**: As TC-06.

**Steps**:
1. Use the TC-06 R4 run.
2. Read the `## debriefkia` block's four `clip @` lines and its `<4.5:1 default` / `<4.5:1 high contrast` counts. The KIA row is red-toned and is critical state.
3. Open `debriefkia-125.png` and confirm the `KIA // DART` row is fully visible.

**Expected Result**: All four clip counts are 0. Both contrast counts are 0. The row is visible in full at 125%.
**Pass Criteria**: All six counts are 0 AND the row is fully visible in the PNG.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-12: Abort armed hint reads the full consequence copy and clears when the window lapses

**Mode**: Hand-walk
**AC covered**: AC-4
**Preconditions**: Run conditions. Fixture `mission` (m03), then press Escape and wait 600 ms (Pause open).

**Steps**:
1. Read `.pause-arm-hint` `innerText` before any press. Record it.
2. Click `button.hud-btn.abort` once. Within 1 s, read `.pause-arm-hint` `innerText` and the button text and `aria-label`. Capture `if039-tc12-armed-100.png`.
3. Wait 3500 ms without pressing. Read the hint, the button text and `useAppStore.getState().phase` again.
4. Set the text scale to 125, re-open Pause if needed, and click ABORT once. Within 1 s, capture `if039-tc12-armed-125.png` and measure the hint box's right edge against its Panel's right edge and against 1280.
5. Set the text scale back to 100.

**Expected Result**: Step 1: the hint is empty. Step 2: the hint reads exactly `PRESS AGAIN WITHIN 3 S TO ABORT // NO INVOICE, CONTRACT STAYS OPEN, ROSTER AS DEPLOYED`, the button reads `CONFIRM?`, and the aria-label is `Confirm abort mission`. Step 3: the hint is empty, the button reads `ABORT`, and `phase` is still `mission` (no confirm happened). Step 4: the full hint is visible, inside the panel and the viewport.
**Pass Criteria**: The step 2 string equals the AC string exactly, AND the step 1 and step 3 hints are empty, AND `phase === 'mission'` after step 3, AND at 125% the hint's right edge is at or inside the panel's right edge and 1280.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-13: Pause panel does not clip at 125% (layout guard for the hint slot)

**Mode**: Covered by R4 check: `pause` / `clip @125`
**AC covered**: AC-4 (supporting; R4 does not arm Abort)
**Preconditions**: As TC-06.

**Steps**:
1. Use the TC-06 R4 run.
2. Read `## pause` `clip @125`, and also `clip @90/100/110`.

**Expected Result**: All four counts are 0.
**Pass Criteria**: All four counts are 0 AND the block is measured. The armed hint's own fit is judged in TC-12 step 4, not here.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-14: Mission HUD at 125%: no panel head spills its panel or runs off screen (R4)

**Mode**: Covered by R4 check: `mission` / `clip @125`
**AC covered**: AC-5
**Preconditions**: As TC-06 (fixture `mission` = m03 SABOTAGE, so the objectives head reads `MISSION DIRECTIVES // SABOTAGE`). R4's spill check uses `.hud-panel` as a host and also has an off-screen check. The story records that both failed on this head before the CSS fix.

**Steps**:
1. Use the TC-06 R4 run.
2. Read `## mission` `clip @125` (and `@90/@100/@110`).
3. Open `mission-125.png` and find the MISSION DIRECTIVES panel.

**Expected Result**: All four counts are 0. No line names `hud-panel-head`, `spill` or `offscreen`. In the PNG the head text sits inside its panel.
**Pass Criteria**: `clip @125: 0` AND the other three are 0 AND the block is measured. Any `spill` or `offscreen` line naming a HUD panel head fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-15: MISSION DIRECTIVES // SABOTAGE wraps inside its panel at 125% (measured)

**Mode**: Hand-walk
**AC covered**: AC-5 ("wraps", not merely "not flagged")
**Preconditions**: Fixture `mission` (m03). Text scale 125 is set after the HUD mounts, then wait 300 ms.

**Steps**:
1. Locate `.hud-objectives .hud-panel-head > span` (the head text) and its `.hud-panel` (`.hud-objectives`).
2. Record the span's text, its `getClientRects().length` (or a line count from `range.getClientRects()` on its text node), its left and right edges, and the panel's left and right edges.
3. Repeat step 2 at scale 100 for comparison.
4. Repeat steps 1 and 2 for every `.hud-panel-head` on the HUD (squad link, weapons and the rest), at 125.
5. Capture `if039-tc15-hud-125.png` and crop it to the objectives panel.

**Expected Result**: At 125% the text is `MISSION DIRECTIVES // SABOTAGE`. Every text line's right edge is ≤ the panel's right edge + 1.5 px and ≤ 1280. Every left edge is ≥ the panel's left edge − 1.5 px. If the text is longer than the panel's inner width, it spans 2 or more lines, so it wraps rather than overflowing. No characters are cut or replaced by an ellipsis. Every other HUD panel head also stays inside its panel.
**Pass Criteria**: For every HUD panel head at 125%, all text line rects lie within panel ± 1.5 px and within 0 to 1280, AND the objectives head's full text is present (no ellipsis), AND where the scale-100 single-line width exceeds the panel's inner width at 125%, the line count is ≥ 2.

**Actual Result**:

**Pass/Fail**:

---

## IF039-TC-16: Longest contract type word (SUPPRESSION) wraps inside the objectives panel at 125%

**Mode**: Hand-walk
**AC covered**: AC-5 (edge case: a longer head than the swept SABOTAGE)
**Preconditions**: `fresh()`, `useCampaignStore.setState({ intelLevel: 5 })`. Clone `useWorldStore.getState().contracts[0]` as `qa039-supp` with `type: 'SUPPRESSION'` and push it. (If `contracts` is empty, locate a contract source at run time.) Then `selectMission('qa039-supp')`, `goto('team')`, wait 900 ms, `startMission()`, and wait 6000 ms.

**Steps**:
1. Set the text scale to 125 and wait 300 ms.
2. Measure the objectives head as in TC-15 step 2. Its text should be `MISSION DIRECTIVES // SUPPRESSION`.
3. Capture `if039-tc16-hud-125.png`.
4. Set the scale to 100.

**Expected Result**: The head reads `MISSION DIRECTIVES // SUPPRESSION`, wraps as needed, and every text line stays inside its panel and the viewport. No ellipsis.
**Pass Criteria**: Same numeric conditions as TC-15 for this head. Any line rect outside panel ± 1.5 px or outside 0 to 1280 fails the case.

**Actual Result**:

**Pass/Fail**:
