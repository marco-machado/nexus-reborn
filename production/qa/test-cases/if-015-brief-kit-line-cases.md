# IF-015 manual test cases: Brief KIT line from objective kinds, plus BUG-0009 verification

- **Story**: `production/epics/interface/story-015-brief-kit-line-from-objective-kinds.md` (AC-1 = AC31, AC-2, AC-3, AC-4 = TR-interface-002)
- **Bug**: `production/qa/bugs/BUG-0009.md` (Fixed, awaiting QA verification; fix commit `ea1960f`)
- **Story type**: UI with a unit seam (`src/ui/kitLine.test.ts`). **Evidence**: `production/qa/evidence/if-015/recapture-2026-10-22/`, `production/qa/evidence/bug-0009-verify-2026-10-22/`. **Gate**: BLOCKING.
- **QA plan**: `production/qa/qa-plan-sprint-010-2026-10-22.md`, Manual QA Checklist "IF-015 — UI".
- **Written**: 2026-10-22, Sprint 10. Executor: Claude. Sign-off: qa-lead.

## Execution mode

Live capture. Headless Chromium at exactly 1280x720 against `npm run dev` on port 4200. Two kinds of run:

- **Harness runs** (`capture.mjs`): node scripts that drive the `playwright-core` bundled with the `@playwright/cli` package. They use named store assists (see below).
- **Real-path runs**: `npx playwright-cli` commands that reach the Brief through the UI (New Operation, Settings, World Network). They have no store assists except where a case names one.

**Priority order (qa-lead)**: run BUG0009-TC-01 to TC-06 and IF015-TC-01 first. The retained `production/qa/evidence/if-015/m03-brief-125.png` was captured before `ea1960f` and still shows the old overlap. The IF-015 110 and 125 captures must be redone on the fixed tree. Then run the rest.

**Owner ruling (KIT copy case)**: `.mb-obj-kit` uppercases the KIT line, so the rendered row reads, for example, `KIT: HOLD THE ZONE FOR 45 S`. That is accepted. The DOM `textContent` keeps the sentence-case AC31 string. The cases below check both.

**Rendered KIT strings (uppercase, as accepted)**:

| Kind | Rendered row |
|---|---|
| destroy | `KIT: POWER CELLS ARM GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY` |
| interact (N s) | `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR N S` |
| escort | `KIT: THE ASSET MUST REACH THE PAD ALIVE` |
| defend (N s) | `KIT: HOLD THE ZONE FOR N S` |
| reach-zone, eliminate-tag, extract | no KIT line |

**What counts as "clips or truncates"** (applies to every visual check): a glyph cut by a box edge or the viewport edge; an ellipsis (`…` or `...`) that is not in the copy; a word missing from the end of a line; two text runs touching or overlapping. Content below the fold of the dossier column is **not** clipping when the column scrolls and the content is fully readable after scrolling (IF-001 behaviour at 110 and 125).

## Shared preconditions (run once, before any case)

1. **Revision**: `git -C /Users/machado/Projects/nexus-reborn merge-base --is-ancestor ea1960f HEAD && echo OK` prints `OK`, and `git status --short src/` prints nothing. Record `git rev-parse --short HEAD` in every Actual Result.
2. **Browser binary**: the harness path `~/Library/Caches/ms-playwright/chromium-1247/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` exists. If it does not, set `SWEEP_CHROME` to an installed Chrome for Testing binary and record the path you used.
3. **Port**: `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing. Start `npm run dev -- --strictPort --port 4200` in the background. Wait until the listener on 4200 is up.
4. **Separate output folders**: the harnesses write PNGs and `capture-output.txt` next to the script, so a run from the original folder overwrites the retained evidence. Copy the scripts instead and run the copies:
   - `mkdir -p production/qa/evidence/if-015/recapture-2026-10-22 && cp production/qa/evidence/if-015/capture.mjs production/qa/evidence/if-015/recapture-2026-10-22/`
   - `mkdir -p production/qa/evidence/bug-0009-verify-2026-10-22 && cp production/qa/evidence/bug-0009-fix-2026-10-22/capture.mjs production/qa/evidence/bug-0009-verify-2026-10-22/`
   - Leave `production/qa/evidence/if-015/*.png` and `production/qa/evidence/bug-0009-fix-2026-10-22/*` unchanged. They are the before and fix-time records.
5. **Named harness assists**, recorded in every harness-based Actual Result: localStorage cleared; New Operation through `save.startNewOperation`; `intelLevel` set to 3 (Glass Veil and Hollow Crown need intel 2, Rust Haven needs intel 1); text scale set through `useSettingsStore.setTextScale`; the Brief opened through `selectMission`. The IF-015 harness injects four generated contracts (one per type, sequence variant 1, threat `HIGH`). The BUG-0009 harness injects HIGH and SEVERE contracts.

## Teardown (after the last case)

1. Close every `playwright-cli` session (`npx playwright-cli close`).
2. Stop the dev server you started. `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing. Record this in the last case's Actual Result.

---

## BUG-0009 verification

### BUG0009-TC-01: The threat-box probe passes on HEAD for every rating at every scale

**Maps to**: BUG-0009 (fix verification, harness)
**Preconditions**: Shared preconditions 1 to 5. Dev server on 4200.
**Steps**:
1. Run `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/bug-0009-verify-2026-10-22/capture.mjs`. Record the exit code.
2. `grep -c '^PASS' production/qa/evidence/bug-0009-verify-2026-10-22/capture-output.txt`.
3. Read the 12 rating × scale lines and the `wrapped` field of each.
4. `diff` this `capture-output.txt` against `production/qa/evidence/bug-0009-fix-2026-10-22/capture-output.txt`.

**Expected Result**: Exit code 0. The last line is `ALL PASS`. There are 13 PASS lines (12 rating × scale lines plus `no console or page errors`) and no FAIL. Every line has `"problems":[]`. `wrapped` reads: MODERATE false/false/true/true, HIGH false/false/false/true, SEVERE false/false/false/true, at 90/100/110/125. The diff with the fix-time output is empty, or differs only in ways recorded in the Actual Result.
**Actual Result**:
**Pass/Fail**:

### BUG0009-TC-02: Rust Haven (MODERATE) at 125: MODERATE does not touch ETA RESPONSE

**Maps to**: BUG-0009 (repro at 125)
**Preconditions**: BUG0009-TC-01 has run.
**Steps**:
1. Open `production/qa/evidence/bug-0009-verify-2026-10-22/moderate-threat-box-125.png` and `moderate-brief-125.png`.
2. Open the retained pre-fix `production/qa/evidence/if-015/m03-brief-125.png` for comparison.
3. In the new captures, find `THREAT RATING`, `MODERATE`, the threat blocks and `ETA RESPONSE: < 06:00`.

**Expected Result**: The pre-fix capture shows the overlap that BUG-0009 describes (this confirms you are comparing the right element). In the new captures, the blocks and `ETA RESPONSE: < 06:00` sit on a second line below `MODERATE` and are right-aligned. No glyph of `MODERATE` touches or sits under any glyph of the ETA line or the blocks. `MODERATE` is shown in full (8 letters, no ellipsis). All four elements are inside the red threat box border.
**Actual Result**:
**Pass/Fail**:

### BUG0009-TC-03: Rust Haven (MODERATE) at 110: the row wraps and nothing touches

**Maps to**: BUG-0009 (110: the layout change)
**Preconditions**: BUG0009-TC-01 has run.
**Steps**:
1. Open `production/qa/evidence/bug-0009-verify-2026-10-22/moderate-threat-box-110.png` and `moderate-brief-110.png`.
2. Compare with the retained pre-fix `production/qa/evidence/if-015/m03-brief-110.png`, which has one line with little margin.

**Expected Result**: The threat row has wrapped: the blocks and `ETA RESPONSE: < 06:00` are on a second line, right-aligned, below `MODERATE`. `MODERATE` and the ETA line do not touch. All of the threat box content is inside its border, and the box border does not overlap the `REWARD` box below it.
**Actual Result**:
**Pass/Fail**:

### BUG0009-TC-04: The 110 wrap does not push Rust Haven's objectives or KIT lines into clipping

**Maps to**: BUG-0009 (side effect of the wrap); AC-4
**Preconditions**: Shared preconditions. IF015-TC-01 has run, so `production/qa/evidence/if-015/recapture-2026-10-22/` holds the post-fix captures. Dev server on 4200.
**Steps**:
1. In `recapture-2026-10-22/capture-output.txt`, read `PASS m03 scale 110: nothing clips, rows inside the viewport`.
2. Open `recapture-2026-10-22/m03-brief-110.png`.
3. Real path: run `npx playwright-cli open http://localhost:4200/`, then `npx playwright-cli resize 1280 720`, then `npx playwright-cli eval "() => [innerWidth, innerHeight]"`, and record the result.
4. Run `npx playwright-cli eval` on an async function that imports `/src/state/save.ts` and calls `startNewOperation()`, imports `/src/state/settingsStore.ts` and calls `setTextScale(110)`, then imports `/src/state/appStore.ts` and calls `selectMission('m03')`. These are store assists; name them in the Actual Result.
5. Before any scrolling, screenshot to `production/qa/evidence/bug-0009-verify-2026-10-22/m03-110-fold.png`. Write down which objective rows and KIT lines are fully visible and which sit below the fold.
6. Scroll the Contract Dossier column to its end. Use `mousewheel 0 600` with the pointer over the dossier, or `eval` with `scrollTop = scrollHeight` on the column. Screenshot to `m03-110-scrolled.png`.
7. Run `npx playwright-cli eval` to read the `textContent` of each `.mb-obj` row and each `.mb-obj-kit`, plus `scrollWidth`/`clientWidth` for each.

**Expected Result**: Step 3 prints `[1280,720]`. The step 1 line is PASS. At the fold, any row or KIT line that is cut by the column's lower edge reaches full view once scrolled. After scrolling, all 5 rows are fully readable from the top of OBJECTIVES to `TERTIARY: EXTRACT THE SQUAD`: PRIMARY reach the relay yard; OPTIONAL drop the backup transformer (+6,000 CR) with the destroy KIT; SECONDARY destroy the three fuel relays with the destroy KIT; TERTIARY hold the yard for the burn with `KIT: HOLD THE ZONE FOR 45 S`; TERTIARY extract the squad. All 3 KIT lines wrap inside the objectives box with no ellipsis. For every element, `scrollWidth <= clientWidth + 1`. The threat box, wrapped as in TC-03, does not overlap the REWARD or OBJECTIVES boxes.
**Actual Result**:
**Pass/Fail**:

### BUG0009-TC-05: The 125 wrap does not push Rust Haven's objectives or KIT lines into clipping

**Maps to**: BUG-0009 (side effect of the wrap); AC-4
**Preconditions**: As BUG0009-TC-04, in the same `playwright-cli` session.
**Steps**:
1. In `recapture-2026-10-22/capture-output.txt`, read `PASS m03 scale 125: nothing clips, rows inside the viewport`.
2. Open `recapture-2026-10-22/m03-brief-125.png`.
3. Run `npx playwright-cli eval` to call `setTextScale(125)`. Scroll the dossier column to the top and screenshot to `production/qa/evidence/bug-0009-verify-2026-10-22/m03-125-fold.png`. Record which rows sit below the fold (code-review advisory 8).
4. Scroll the dossier column to its end and screenshot to `m03-125-scrolled.png`.
5. Read the `.mb-obj` and `.mb-obj-kit` `textContent` and `scrollWidth`/`clientWidth` as in TC-04 step 7.

**Expected Result**: The step 1 line is PASS. The new `m03-brief-125.png` does not show the `MODERATE` / ETA overlap that the retained pre-fix capture shows. After scrolling, all 5 rows and all 3 KIT lines are fully readable, and the last row, `TERTIARY: EXTRACT THE SQUAD`, is fully above the column's bottom edge. No ellipsis. `scrollWidth <= clientWidth + 1` for every element. The rows below the fold at the top of the scroll are listed in the Actual Result.
**Actual Result**:
**Pass/Fail**:

### BUG0009-TC-06: Real path at intel 1: Settings text scale, then Rust Haven from the World Network

**Maps to**: BUG-0009 (reproduction steps 1 to 3, run as written, with no intel assist)
**Preconditions**: Dev server on 4200. A fresh `playwright-cli` session at 1280x720 (`resize 1280 720`, then confirm `[1280,720]` with `eval`). Storage cleared (`delete-data`, or `eval "() => localStorage.clear()"` followed by `reload`).
**Steps**:
1. From the main menu, start a New Operation through the UI. Use `snapshot` to find the control, then `click` it. Dismiss any orientation or tutorial overlay through its own button.
2. Confirm intel is 1 with `eval` on `useCampaignStore.getState().intelLevel`, and that the top bar reads `INTEL 1`.
3. Open Settings and click the button labelled `Text scale 125%` (`aria-label`). Close Settings.
4. In the World Network, select Rust Haven and open its Brief through the UI.
5. Screenshot to `production/qa/evidence/bug-0009-verify-2026-10-22/real-m03-brief-125.png`, then a `screenshot` of the `.mb-threat` element to `real-m03-threat-125.png`.
6. Repeat steps 3 to 5 with `Text scale 110%` (`real-m03-brief-110.png`, `real-m03-threat-110.png`).

**Expected Result**: Rust Haven is selectable at intel 1, and its Brief opens with `THREAT RATING` `MODERATE`. At both 125 and 110, the blocks and `ETA RESPONSE: < 06:00` are on a line below `MODERATE`, nothing touches, and everything is inside the threat box border. The objectives box shows the same rows and KIT lines as in TC-04 and TC-05. This is the same result the harness gives with its intel-3 assist.
**Actual Result**:
**Pass/Fail**:

---

## IF-015 cases

### IF015-TC-01: Re-capture on the fixed tree: the harness passes end to end

**Maps to**: AC-1, AC-3, AC-4
**Preconditions**: Shared preconditions 1 to 5. Dev server on 4200.
**Steps**:
1. Run `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/if-015/recapture-2026-10-22/capture.mjs`. Record the exit code.
2. `grep -c '^PASS' production/qa/evidence/if-015/recapture-2026-10-22/capture-output.txt` and `grep -c '^FAIL'` on the same file.
3. `ls production/qa/evidence/if-015/recapture-2026-10-22/*.png | wc -l`.
4. Confirm that the retained `production/qa/evidence/if-015/*.png` files were not modified (`git status --short production/qa/evidence/if-015/` lists only the new folder).

**Expected Result**: Exit code 0. The last line is `ALL PASS`. There are 58 PASS lines and 0 FAIL lines. 29 PNGs: 28 `*-brief-{90,100,110,125}.png` and `sabotage-deployed-hud-objectives-100.png`. The `authored:` line reads `{"m01":"GLASS VEIL","m02":"HOLLOW CROWN","m03":"RUST HAVEN"}`. The retained files are unchanged.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-02: Glass Veil carries no KIT line

**Maps to**: AC-1 ("a contract with none of those kinds carries no KIT line")
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `m01:` lines in `recapture-2026-10-22/capture-output.txt`.
2. Open `m01-brief-{90,100,110,125}.png`.

**Expected Result**: The kinds read `[reach-zone,eliminate-tag,extract]`, there are 3 of 3 rows, and the KIT list is `[]`. None of the four captures shows a `KIT:` line anywhere in OBJECTIVES.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-03: Hollow Crown carries two interact lines and the escort line

**Maps to**: AC-1
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `m02:` lines in `capture-output.txt`.
2. Open `m02-brief-{90,100,110,125}.png`. Scroll is already applied by the probe, so use the 90 and 100 captures for the full list.

**Expected Result**: The kinds read `[reach-zone,interact:4,interact:5,escort,extract]`. The DOM KIT list is `["KIT: an operative holds the console for 4 s","KIT: an operative holds the console for 5 s","KIT: the asset must reach the pad alive"]`. The rendered rows read `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR 4 S` under the optional server pull, `... FOR 5 S` under the cell-block override, and `KIT: THE ASSET MUST REACH THE PAD ALIVE` under the escort. There is no KIT line under the reach-zone or extract row.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-04: Rust Haven carries two destroy lines and a 45 s hold

**Maps to**: AC-1
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `m03:` lines in `capture-output.txt`.
2. Open `m03-brief-{90,100}.png` (110 and 125 are covered by BUG0009-TC-04 and TC-05).

**Expected Result**: The kinds read `[reach-zone,destroy,destroy,defend:45,extract]`. The DOM KIT list is the destroy string twice, then `KIT: hold the zone for 45 s`. The rendered rows read `KIT: POWER CELLS ARM GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY` under the optional transformer and under the relays, and `KIT: HOLD THE ZONE FOR 45 S` under the hold. The punctuation is a semicolon after `TOOL` and a comma after `WORKS`. There is no KIT line under the reach-zone or extract row.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-05: Generated SEIZURE (variant 1) carries one interact line

**Maps to**: AC-1, AC-2 (generated and authored interact print the same line)
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `SEIZURE:` lines in `capture-output.txt`.
2. Open `seizure-brief-{90,100,110,125}.png`.

**Expected Result**: The resolved type is `SEIZURE` and the kinds read `[reach-zone,interact:4,extract]`. There is one KIT line, `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR 4 S`, under `OVERRIDE THE CHECKPOINT LOCKS`. It is identical to Hollow Crown's 4 s line in TC-03.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-06: Generated EXTRACTION (variant 1) carries an interact line and the escort line

**Maps to**: AC-1, AC-2
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `EXTRACTION:` lines in `capture-output.txt`.
2. Open `extraction-brief-{90,100,110,125}.png`.

**Expected Result**: The resolved type is `EXTRACTION` and the kinds read `[reach-zone,interact:5,escort,extract]`. The KIT lines are `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR 5 S` and `KIT: THE ASSET MUST REACH THE PAD ALIVE`, identical to Hollow Crown's matching lines.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-07: Generated SABOTAGE (variant 1) carries the destroy line and a 45 s hold

**Maps to**: AC-1, AC-2
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `SABOTAGE:` lines in `capture-output.txt`.
2. Open `sabotage-brief-{90,100,110,125}.png`.

**Expected Result**: The resolved type is `SABOTAGE` and the kinds read `[reach-zone,destroy,defend:45,extract]`. The KIT lines are the destroy line and `KIT: HOLD THE ZONE FOR 45 S`, identical to Rust Haven's lines.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-08: Generated SUPPRESSION (variant 1) carries one interact line

**Maps to**: AC-1, AC-2
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the `SUPPRESSION:` lines in `capture-output.txt`.
2. Open `suppression-brief-{90,100,110,125}.png`.

**Expected Result**: The resolved type is `SUPPRESSION` and the kinds read `[reach-zone,interact:4,extract]`. There is one KIT line, `KIT: AN OPERATIVE HOLDS THE CONSOLE FOR 4 S`, under `SEIZE THE PLAZA CONTROL`.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-09: Nothing clips or truncates on any of the 28 Brief captures, including the threat box

**Maps to**: AC-4 (TR-interface-002)
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Confirm the 28 `scale N: nothing clips, rows inside the viewport` lines are PASS. Note that this probe covers `.mb-obj` rows, `.mb-obj-kit` spans and the objectives box only. It does not cover `.mb-threat`.
2. Open each of the 28 captures and check it against the "clips or truncates" definition above. Look at the whole Brief, not only the objectives box: header, recon feed, tactical map, Contract Dossier fields, threat box, reward, objectives, the ACCEPT CONTRACT bar and the bottom nav.
3. On each capture, look for the threat box specifically. For the generated contracts (threat `HIGH`), the row stays on one line at 90, 100 and 110 and wraps at 125, per BUG0009-TC-01.
4. Fill in the grid below with P/F per capture. Note any failure by file name and element.

| Contract | 90 | 100 | 110 | 125 |
|---|---|---|---|---|
| m01 Glass Veil | | | | |
| m02 Hollow Crown | | | | |
| m03 Rust Haven | | | | |
| SEIZURE | | | | |
| EXTRACTION | | | | |
| SABOTAGE | | | | |
| SUPPRESSION | | | | |

**Expected Result**: All 28 probe lines are PASS. All 28 cells are P. No threat value touches its ETA line or blocks on any capture. Content that sits below the dossier fold at 110 or 125 is accepted only where the column scrolls (see the definition).
**Actual Result**:
**Pass/Fail**:

### IF015-TC-10: The deployed SABOTAGE mission lists exactly the Brief's objectives

**Maps to**: AC-3
**Preconditions**: IF015-TC-01 has run.
**Steps**:
1. Read the four `deploy:` lines and the `generated:` line in `capture-output.txt`.
2. Open `recapture-2026-10-22/sabotage-brief-90.png` and `sabotage-deployed-hud-objectives-100.png`, and compare the objective labels in order.

**Expected Result**: All four deploy lines are PASS. The phase is `mission` on `gc-if015-sabotage`. The deployed kinds are `["reach-zone","destroy","defend:45","extract"]`, equal to the Brief's kinds. The mission store and the HUD DOM both list `REACH THE RELAY YARD`, `DESTROY THE THREE FUEL RELAYS`, `HOLD THE YARD FOR THE BURN`, `EXTRACT THE SQUAD`, in that order. The HUD capture's MISSION DIRECTIVES shows those four labels in the order the Brief printed them.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-11: Real path: Rust Haven's Brief objectives equal its deployed objectives

**Maps to**: AC-3 (authored contract, no injected record)
**Preconditions**: The BUG0009-TC-06 session is on Rust Haven's Brief at intel 1 (any text scale; set 100 through Settings).
**Steps**:
1. `eval`: record the `textContent` of every `.mb-obj` row (labels) and every `.mb-obj-kit`.
2. Advance through the UI: ACCEPT CONTRACT, then deploy from Assembly with the default team. Use `snapshot` to find the controls.
3. When the HUD is visible, `eval`: read the `.hud-obj-text` `textContent` list and `useMissionStore.getState().objectives.map(o => o.label)`.
4. Screenshot to `production/qa/evidence/if-015/recapture-2026-10-22/real-m03-deployed-hud-100.png`.

**Expected Result**: The HUD and mission store list the same five objective labels as the Brief rows, in the same order: reach the relay yard, drop the backup transformer, destroy the three fuel relays, hold the yard for the burn, extract the squad. The three Brief KIT lines belong to the destroy, destroy and defend rows of that list.
**Actual Result**:
**Pass/Fail**:

### IF015-TC-12: The unit seam passes on HEAD

**Maps to**: AC-1, AC-2, AC-3 (reclient and Expedite between Brief and deploy are covered by the unit seam only)
**Preconditions**: Shared precondition 1.
**Steps**:
1. Run `npx vitest run src/ui/kitLine.test.ts`. Record the counts.
2. Confirm that the output includes the suites `kitLine: the four kinds (AC31)`, `kitLines over a contract`, `authored and generated objectives of one kind print one line` and `the Brief agrees with the deployed mission`.

**Expected Result**: Exit code 0 and 0 failed tests. All four named suites run and pass.
**Actual Result**:
**Pass/Fail**:
