# WN-022 — HELD BY names the city majority; the card stops saying Control is ownership — Manual test cases

**Story**: `production/epics/world-network/story-022-held-by-names-the-city-majority.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/sprint-011/` (retained 1280x720 PNG per state named `wn-022-*.png`) | **Gate**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Scope note**: not in the Sprint 11 plan's original scope; added to this QA cycle (QA plan `production/qa/qa-plan-sprint-011-2026-10-24.md` line 14 and line 25).
**Code drift since the story's captures**: `git diff --stat 2c73542 131a5c1 -- src/ui/worldChrome.ts src/ui/worldOnboard.ts src/ui/WorldMap.tsx src/game/atlas.ts src/ui/ui.css src/index.css` is empty (checked 2026-10-24). The code under test is the code that shipped in `2c73542`.

## AC map

| AC | Text (short) | Cases |
|---|---|---|
| AC-1 | HELD BY row before TAX YIELD; `NEXUS GLOBAL // 2 OF 3 CITIES` in teal; another corp in the default tone; `CONTESTED // CITIES SPLIT 1-1-1` with no majority; words carry the state, not the colour | WN-022-01 to -07, -10 |
| AC-1 (manifest rule) | Holder read from the World Network owner, never from Control | WN-022-06 |
| AC-2 | Orientation card: THE JOB says a sector pays when Nexus holds most of its cities and a win hands the mission city to Nexus; the CONTROL line says Control is order kept, not who holds it, pointing at HELD BY | WN-022-08, -09, -11 |
| ADR-0017 layout | 1280x720 without clipping, four text scales + high contrast | WN-022-10, -11 |
| Edge (spec silent) | Sector with no cities (Antarctica) | WN-022-12 |
| Automated evidence | Unit tests for the string logic | WN-022-13 |
| Prior evidence | `production/qa/evidence/playtest-fixes-2026-10-23/world-{90,100,110,125,hc}.png` | WN-022-14 |

## Automated evidence (name, do not re-derive)

- `src/ui/worldChrome.test.ts`, describe `HELD BY names the city majority, not Control (WN-022)`, four tests:
  1. `opening North America: Nexus holds two of three cities` — `{ text: 'NEXUS GLOBAL // 2 OF 3 CITIES', tone: 'teal' }`
  2. `opening Europe: Helix holds two of three` — `{ text: 'HELIX CORP // 2 OF 3 CITIES', tone: 'dim' }`
  3. `opening South America is a three-way split` — `{ text: 'CONTESTED // CITIES SPLIT 1-1-1', tone: 'dim' }`
  4. `one seized city turns North America contested whatever its Control` — text matches `/^CONTESTED/`
- No unit test pins the AC-2 card copy (the story records this gap). WN-022-08 and -09 are the only evidence for AC-2.

## Reference values (from the code at `131a5c1`)

- Opening city holders (`src/game/atlas.ts` `CITIES`): NA nb/pc Nexus, dt Stratos; SA bg Nexus, sp Stratos, lm Omni; EU ln/nc Helix, os Omni; AF cr/lg Omni, jb Helix; AS sg/kt Helix, nk Stratos; OC sy/pr Stratos, ak Nexus. Antarctica (`an`) has no cities and is `locked`.
- Corp names (`CORPS`): `STRATOS INDUSTRIES`, `NEXUS GLOBAL`, `HELIX CORP`, `OMNICORP`.
- Tones: the row's `<b>` carries class `wm-kv-readout teal` or `wm-kv-readout dim`. `.teal` = `var(--teal)` = `rgb(126, 240, 212)` in both modes. `.dim` = `var(--ink)` = `rgb(184, 216, 207)` default, `rgb(226, 246, 238)` under `:root.s-high-contrast`. "Default tone" in the AC = `--ink`.
- Longest opening HELD BY string: `STRATOS INDUSTRIES // 2 OF 3 CITIES` (Oceania, 35 characters). Use it as the clip worst case.

## Common setup

- `npm run dev -- --strictPort` on http://localhost:4200. Headless Chrome for Testing through `playwright-core` (the same launch as `production/qa/evidence/sprint-011/probe.mjs`) or `npx playwright-cli`, viewport exactly 1280x720. Never the user's Chrome.
- **Fresh New Operation** (as `probe.mjs` `fresh()`): `page.goto(URL)`; `localStorage.clear()`; reload; wait 1200 ms; `(await import('/src/state/save.ts')).startNewOperation()`; `useAppStore.getState().goto('world')`; wait 700 ms.
- **Card up / down**: the card shows while `'hint-worldmap'` is not in `useTutorialStore.getState().seen`. Dismiss with `useTutorialStore.getState().markSeen('hint-worldmap')`.
- **Pause**: `useWorldStore.setState({ paused: true })` so Control / Unrest drift and events do not move during reads.
- **Focus a sector**: `useWorldStore.setState({ selected: '<id>' })`.
- **Set a city holder**: `const s = useWorldStore.getState(); useWorldStore.setState({ owner: { ...s.owner, <cityId>: '<corp>' } })`.
- **Set Control**: as `probe.mjs` `sector(id, patch)`: `useWorldStore.setState({ sectors: { ...s.sectors, [id]: { ...s.sectors[id], control: <n> } } })`.
- **Text scale / HC**: `useSettingsStore.getState().setTextScale(<90|100|110|125>)`; `useSettingsStore.getState().setHighContrast(<bool>)`.
- **Read the row**: find the `.kv` whose `span` text is `HELD BY`; read its `b` `textContent`, `className`, and `getComputedStyle(b).color`. Before measuring, await every finite animation (`document.getAnimations()` with finite iterations, `.finished`), as `sweep.mjs` does.
- Record console errors and page errors for every case; any `pageerror` fails the case it occurred in.
- After the session: stop the dev server; `lsof -iTCP:4200 -sTCP:LISTEN` returns nothing; close every browser context.

---

## Test Case: WN-022-01 — HELD BY row exists and sits immediately before TAX YIELD

**AC covered**: AC-1 (row placement)
**Preconditions**: Fresh New Operation; card dismissed; paused; text scale 100; HC off; `selected: 'na'`.
**Steps**:
1. List the label `span` text of every `.kv` row and every `.wm-cu label` inside `.wm-sector-scroll`, in DOM order.
2. Find the indices of `HELD BY` and `TAX YIELD`.
3. Repeat steps 1-2 with `selected` set to `eu`, `sa`, `af`, `as`, `oc`.
4. Capture `wn-022-row-order-na.png`.
**Expected Result**: Exactly one `HELD BY` row per sector panel. Its index is exactly one less than `TAX YIELD`'s (no row between them) in all six sectors. Order observed for NA: `COORD`, `CONTROL`, `UNREST`, `HELD BY`, `TAX YIELD`, `TAX PAID`, `GARRISON CONDITION`, ...
**Pass Criteria**: For all six sectors, `indexOf('TAX YIELD') - indexOf('HELD BY') === 1` and `HELD BY` occurs exactly once.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-02 — Nexus majority: North America reads NEXUS GLOBAL // 2 OF 3 CITIES in teal

**AC covered**: AC-1 (Nexus majority, teal)
**Preconditions**: As WN-022-01 (`selected: 'na'`, opening ownership untouched).
**Steps**:
1. Read the HELD BY `b` text, class and computed colour.
2. Set HC on; read the computed colour again; set HC off.
3. Capture `wn-022-nexus-na.png`.
**Expected Result**: Text exactly `NEXUS GLOBAL // 2 OF 3 CITIES`. Class contains `teal`, not `dim`. Colour `rgb(126, 240, 212)` with HC off and on.
**Pass Criteria**: All three readings equal the expected values exactly (string equality on the text, string equality on the colour).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-03 — Nexus count follows ownership: 3 OF 3 after Detroit flips to Nexus

**AC covered**: AC-1 (the count is the real held count, not a fixed string)
**Preconditions**: As WN-022-02.
**Steps**:
1. Set `owner.dt = 'nexus'`.
2. Wait one frame; read the HELD BY text and class.
3. Set `owner.dt = 'stratos'` (back to opening); read again.
**Expected Result**: Step 2: `NEXUS GLOBAL // 3 OF 3 CITIES`, class `teal`. Step 3: `NEXUS GLOBAL // 2 OF 3 CITIES`, class `teal`. The row updates without a reload or re-focus.
**Pass Criteria**: Both strings match exactly and both reads show class `teal`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-04 — Another corp's majority prints that corp in the default tone

**AC covered**: AC-1 (other corp, default tone)
**Preconditions**: Fresh New Operation; card dismissed; paused; scale 100; HC off; opening ownership.
**Steps**:
1. Focus `eu`; read text, class, colour. Capture `wn-022-other-eu.png`.
2. Focus `af`; read text, class, colour.
3. Focus `as`; read text, class, colour.
4. Focus `oc`; read text, class, colour. Capture `wn-022-other-oc.png`.
5. Set HC on; focus `eu`; read colour. Set HC off.
**Expected Result**:
| Sector | Text | Class | Colour (HC off) |
|---|---|---|---|
| eu | `HELIX CORP // 2 OF 3 CITIES` | `dim` | `rgb(184, 216, 207)` |
| af | `OMNICORP // 2 OF 3 CITIES` | `dim` | `rgb(184, 216, 207)` |
| as | `HELIX CORP // 2 OF 3 CITIES` | `dim` | `rgb(184, 216, 207)` |
| oc | `STRATOS INDUSTRIES // 2 OF 3 CITIES` | `dim` | `rgb(184, 216, 207)` |
Step 5 colour: `rgb(226, 246, 238)`. No other-corp row has class `teal` or colour `rgb(126, 240, 212)`.
**Pass Criteria**: Every cell in the table, and the step-5 colour, match exactly.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-05 — No majority: South America reads CONTESTED // CITIES SPLIT 1-1-1

**AC covered**: AC-1 (contested)
**Preconditions**: Fresh New Operation; card dismissed; paused; scale 100; HC off; opening ownership; `selected: 'sa'`.
**Steps**:
1. Read text, class, colour.
2. Read the TAX PAID row text.
3. Capture `wn-022-contested-sa.png`.
**Expected Result**: Text exactly `CONTESTED // CITIES SPLIT 1-1-1`; class `dim`; colour `rgb(184, 216, 207)`. TAX PAID does not read `YES // NEXUS-HELD` (South America is not Nexus-held: `taxEligible` requires `sectorCorp === 'nexus'`).
**Pass Criteria**: Text, class and colour match exactly; TAX PAID text is not `YES // NEXUS-HELD`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-06 — The holder comes from city ownership, not Control (playtest 3/4 regression)

**AC covered**: AC-1 manifest rule ("never computed in the UI from Control"); design source (NA at Control 86 read NOT NEXUS-HELD; EU at 37 read Nexus-held)
**Preconditions**: Fresh New Operation; card dismissed; paused; scale 100; HC off.
**Steps**:
1. Focus `na`; set NA `control: 86`; set `owner.nb = 'omni'`. Read HELD BY text and class, and TAX PAID text.
2. Set NA `control: 10` (ownership unchanged); read HELD BY text again.
3. Reset `owner.nb = 'nexus'`. Focus `eu`; set EU `control: 37`; set `owner.ln = 'nexus'` and `owner.nc = 'nexus'`. Read HELD BY text and class, and TAX PAID text.
4. Set EU `control: 95`; read HELD BY text again.
5. Capture `wn-022-owner-not-control.png` at the end of step 3.
**Expected Result**: Step 1: `CONTESTED // CITIES SPLIT 1-1-1`, class `dim`; TAX PAID is not `YES // NEXUS-HELD`. Step 2: text unchanged from step 1. Step 3: `NEXUS GLOBAL // 2 OF 3 CITIES`, class `teal`; TAX PAID reads `YES // NEXUS-HELD`. Step 4: text unchanged from step 3.
**Pass Criteria**: All four HELD BY reads match exactly; changing Control alone (steps 2 and 4) changes neither HELD BY text nor class; HELD BY and TAX PAID agree in steps 1 and 3.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-07 — Words carry the state: grayscale read

**AC covered**: AC-1 ("the words carry the state, not the colour"; ADR-0017 critical state never colour-only)
**Preconditions**: Fresh New Operation; card dismissed; paused; scale 100; HC off.
**Steps**:
1. Inject `document.documentElement.style.filter = 'grayscale(1)'`.
2. Focus `na`; capture `wn-022-gray-nexus.png` and read the HELD BY text.
3. Focus `eu`; capture `wn-022-gray-other.png` and read the text.
4. Focus `sa`; capture `wn-022-gray-contested.png` and read the text.
5. Open the three captures and, from the pixels alone, write down the holder each one names.
6. Check the `.kv` row for HELD BY: list its child elements and confirm no swatch, dot or icon is the only carrier of the holder.
7. Remove the filter.
**Expected Result**: The three texts are pairwise different and each names its state in words: `NEXUS GLOBAL` (Nexus holds), `HELIX CORP` (another corp holds), `CONTESTED` (no majority). Each capture shows the full string legibly in grayscale. The row contains only the `HELD BY` label `span` and the readout `b` (no colour-only element).
**Pass Criteria**: The step-5 transcriptions equal the step 2-4 texts exactly; the row has exactly two child elements (`span`, `b`); the three strings are distinct.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-08 — Orientation card: THE JOB copy

**AC covered**: AC-2 (THE JOB)
**Preconditions**: Fresh New Operation; card up (`hint-worldmap` not seen); paused; scale 100; HC off.
**Steps**:
1. Wait for finite animations to finish.
2. Read `.wm-onboard-row[data-row="job"] b` text and the row's `span` text.
3. Capture `wn-022-card-100.png`.
**Expected Result**: Title `THE JOB`. Body exactly: `You run the network from this desk. Every sector prints a Tax yield, but only a Nexus-held sector pays it: one where Nexus holds most of its cities. North America pays from the start, Europe does not. A win hands the mission city to Nexus.` The body contains both AC clauses: `pays it: one where Nexus holds most of its cities` and `A win hands the mission city to Nexus`.
**Pass Criteria**: Title and body equal the expected strings exactly (whitespace-normalised).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-09 — Orientation card: the CONTROL line points at HELD BY; the old definition is gone

**AC covered**: AC-2 (CONTROL line)
**Preconditions**: As WN-022-08.
**Steps**:
1. Read `.wm-onboard-row[data-row="numbers"] b` and every `span` inside its `.wm-onboard-lines`.
2. Find the line that starts `CONTROL:`.
3. Read the whole card's `textContent`; search it for `how much of the sector Nexus holds`.
4. Run `rg -n "how much of the sector" src` in the project.
5. Open the World Network sector panel (dismiss the card) and confirm a row labelled `HELD BY` exists (the target the line names).
**Expected Result**: Row title `THE FOUR NUMBERS`. The CONTROL line is exactly `CONTROL: the order kept in the sector; a win raises it. It sets Tax yield and Garrison, not who holds the sector (HELD BY on the sector panel).` Step 3 and step 4 find nothing. Step 5 finds the `HELD BY` row.
**Pass Criteria**: CONTROL line equals the expected string exactly; zero matches in steps 3 and 4; `HELD BY` row present in step 5.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-10 — HELD BY row unclipped at four text scales and high contrast

**AC covered**: AC-1 + ADR-0017 (1280x720 without clipping)
**Preconditions**: Fresh New Operation; card dismissed; paused.
**Steps**:
For each scale in 90, 100, 110, 125 with HC off, and then scale 100 with HC on (five configurations), and for each of `na` (Nexus), `oc` (longest string, other corp) and `sa` (contested):
1. Set the scale and HC; focus the sector; wait for animations.
2. Scroll the HELD BY row into view inside `.wm-sector-scroll` (`scrollIntoView({ block: 'nearest' })`).
3. For the readout `b`: record `scrollWidth`, `clientWidth`, computed `text-overflow`, `white-space`, and its bounding box; for the label `span`: its bounding box; for `.wm-sector-scroll`: its bounding box.
4. Capture `wn-022-held-<sector>-<scale|hc>.png` (15 captures).
**Expected Result**: In all 15 combinations the full string is visible: `b.scrollWidth <= b.clientWidth` (or the text wraps onto a second line inside the row with no ellipsis); the readout box lies inside the scroll box horizontally; label and readout boxes do not overlap; the capture shows the whole string.
**Pass Criteria**: 15 of 15 combinations meet every condition; any one failure fails the case (record which).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-11 — Orientation card copy unclipped at four text scales and high contrast

**AC covered**: AC-2 + ADR-0017
**Preconditions**: Fresh New Operation; card up; paused.
**Steps**:
For each of 90, 100, 110, 125 (HC off) and 100 with HC on:
1. Set the scale and HC; wait for animations.
2. Record the bounding box of `.wm-onboard`, of the `job` row and of the `numbers` row's CONTROL line `span`, and of the UNDERSTOOD button.
3. For each of those text elements check `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight` (or, if the card scrolls, that scrolling reaches the element and it then lies fully inside the card's visible box).
4. Capture `wn-022-card-<scale|hc>.png`.
**Expected Result**: In all five configurations the THE JOB body and the CONTROL line are fully readable inside the card, the card lies inside 0..1280 x 0..720, and UNDERSTOOD is reachable. No ellipsis, no text cut by the card edge.
**Pass Criteria**: 5 of 5 configurations meet every condition.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-12 — Sector with no cities (Antarctica) does not break the row

**AC covered**: Edge case; the story and GDD are silent on it. Expected value is taken from `holderLine` (`src/ui/worldChrome.ts` line 130), not from a spec. A different reading is a design question for the owner, not a defect.
**Preconditions**: Fresh New Operation; card dismissed; paused; scale 100; HC off.
**Steps**:
1. Set `selected: 'an'`.
2. Read the HELD BY row text and class if the row renders.
3. Check the page-error log.
4. Capture `wn-022-an.png`.
**Expected Result**: No page error. If the panel prints HELD BY, it reads `UNKNOWN` with class `dim`, and TAX PAID is not `YES // NEXUS-HELD`.
**Pass Criteria**: Zero page errors; HELD BY (if present) equals `UNKNOWN`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-13 — Unit tests for the HELD BY string logic pass at HEAD

**AC covered**: AC-1 (automated evidence)
**Preconditions**: Working tree at `131a5c1` (note the uncommitted test-file changes in `git status` at run time; none touch `src/ui/worldChrome.test.ts` unless `git status` says otherwise).
**Steps**:
1. Run `npx vitest run src/ui/worldChrome.test.ts -t "WN-022"`.
2. Record the pass / fail count and the four test names.
**Expected Result**: Four tests run, four pass, names as listed under "Automated evidence".
**Pass Criteria**: Exit code 0 and `4 passed`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: WN-022-14 — Prior captures cross-check

**AC covered**: Supporting evidence only (does not replace -02, -08, -10, -11)
**Preconditions**: `production/qa/evidence/playtest-fixes-2026-10-23/world-{90,100,110,125,hc}.png` and `sweep-world.json` present. Their fixture (`sweep.mjs` `SURFACES.world`): fresh New Operation, card up, `selected: 'na'`, influence 8.
**Steps**:
1. Open each of the five PNGs.
2. Note whether the HELD BY row is visible (not under the card) and what it reads; note the THE JOB and CONTROL lines on the card.
3. Compare with this run's `wn-022-card-*.png` and `wn-022-held-na-*.png`.
**Expected Result**: Where the row is visible it reads `NEXUS GLOBAL // 2 OF 3 CITIES`; the card text matches WN-022-08/-09. The captures cover only the Nexus state; other-corp and contested states have no prior capture (covered by -04, -05, -10).
**Pass Criteria**: No prior capture contradicts this run's results.
**Actual Result**:
**Pass/Fail**:
