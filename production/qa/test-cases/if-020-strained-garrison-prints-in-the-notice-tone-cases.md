# IF-020 manual test cases: STRAINED Garrison prints in the notice tone, not amber

- **Story**: `production/epics/interface/story-020-strained-garrison-prints-in-the-notice-tone.md` (AC-1 Garrison tones; AC-2 grayscale guard)
- **Story type**: UI. **Gate**: BLOCKING (retained screenshot of each state touched + qa-lead sign-off).
- **Evidence output**: R1 run → `production/qa/evidence/sprint-011-head-2026-10-24/` (strategy section 4, item 2). Hand-walk captures → `production/qa/evidence/if-020/` plus a click-through `README.md` there (story "Test Evidence").
- **Sources**: story `## Acceptance Criteria` and `## QA Test Cases`; `production/qa/qa-plan-sprint-011-2026-10-23.md` Manual QA Checklist "IF-020 — UI" (AC-1, AC-2 grayscale guard); `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 5 F5 and section 6 row IF-020 + addendum H3.
- **Build under test**: HEAD `131a5c1`. **Written**: 2026-10-24, Sprint 11 `/team-qa` phase 4. Executor: Claude. Sign-off: qa-lead.

## Execution mode

Headless Chrome for Testing at exactly 1280x720 against `npm run dev` on port 4200. No headed window in any case.

- **R1 cases** read the output of one run of `production/qa/evidence/sprint-011/probe.mjs` on HEAD. That probe's IF-020 block uses the fixtures `garrison-secure` (Europe Control 60), `garrison-strained` (Control 45) and `garrison-critical` (Control 20), each built on the `opening` fixture (fresh New Operation, orientation card marked seen, world paused). It asserts the Garrison word, computed colour and absence of the `amber` class, and Credits colour. It takes a grayscale capture of STRAINED only and asserts nothing about it.
- **Hand-walk cases** cover what the probe does not: the four Control boundaries the story names (55 / 54 / 35 / 34), Antarctica, the source-level amber guard, and grayscale for all three states (strategy H3, F5).

### Colour literals used by these cases

| Role | Expected computed colour | Source |
|---|---|---|
| Teal (SECURE) | `rgb(126, 240, 212)` | `--teal: #7ef0d4` |
| Print White notice (STRAINED, class `notice`) | `rgb(226, 246, 238)` | `--print-white: #e2f6ee` (`src/index.css`, `src/ui/tokens.ts`, art bible §4 table); probe pins the same |
| Red Hot (CRITICAL) | `rgb(255, 107, 85)` | `--red-hot: #ff6b55` |
| Ledger Amber (Credits, class `amber`) | `rgb(255, 208, 117)` | `.amber { color: var(--amber-hot) }`, `--amber-hot: #ffd075` |

**Literal conflict (needs a qa-lead ruling, see CONCERNS in the hand-back):** the story's AC-1 pass condition and `design/ux/world-network.md` line 449 write Print White as `rgb(232,251,242)`. The palette files and the art bible say `#e2f6ee` = `rgb(226, 246, 238)`, and the probe passed on that value. These cases expect `rgb(226, 246, 238)`. Record the measured value in full either way.

### Shared preconditions (once, before any case)

- **S-1 Revision**: `git -C /Users/machado/Projects/nexus-reborn rev-parse --short HEAD` prints `131a5c1` and `git status --short src/` prints nothing. Record both in every Actual Result.
- **S-2 Port**: `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing. Start `npm run dev -- --strictPort --port 4200` in the background and wait until the listener is up.
- **S-3 R1 run** (feeds IF020-TC-01 to TC-04): `mkdir -p production/qa/evidence/sprint-011-head-2026-10-24/`, then `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`. Record the exit code. Never write over `production/qa/evidence/sprint-011/`. If the strategy's settled/mid-fade R1 variants are being run in the same session (F2), use the settled run for these cases.
- **S-4 Browser for hand-walks**: `npx playwright-cli open http://localhost:4200/` (do not pass `--headed`), `npx playwright-cli resize 1280 720`, then `npx playwright-cli eval "() => innerWidth + 'x' + innerHeight"` must return `1280x720`; otherwise the run is invalid (record and stop). Record every console error per case.
- **S-5 Named store assists** (record in every hand-walk Actual Result; they mirror probe.mjs `fresh`, `dismissCard`, `pause`, `sector`):
  - **Opening**: `localStorage.clear()`, reload, then
    `npx playwright-cli eval "async () => { const save = await import('/src/state/save.ts'); save.startNewOperation(); const { useAppStore } = await import('/src/state/appStore.ts'); useAppStore.getState().goto('world'); const { useTutorialStore } = await import('/src/state/tutorialStore.ts'); useTutorialStore.getState().markSeen('hint-worldmap'); const { useWorldStore } = await import('/src/state/worldStore.ts'); useWorldStore.setState({ paused: true }); return useAppStore.getState().phase }"` → returns `world`.
  - **Set Control C on Europe** (replace `C`):
    `npx playwright-cli eval "async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); const s = useWorldStore.getState(); useWorldStore.setState({ selected: 'eu', sectors: { ...s.sectors, eu: { ...s.sectors.eu, control: C } }, crisis: s.crisis.filter((x) => x !== 'eu') }); return [useWorldStore.getState().selected, useWorldStore.getState().sectors.eu.control] }"`
  - **Read Garrison** (call this READ-G):
    `npx playwright-cli eval "() => { const kv = [...document.querySelectorAll('.wm-right .kv')].find((k) => k.querySelector('span')?.textContent === 'GARRISON CONDITION'); const b = kv?.querySelector('b'); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { text: b.textContent, cls: b.className, color: getComputedStyle(b).color, amber: b.classList.contains('amber'), notice: b.classList.contains('notice'), rect: [r.x, r.y, r.width, r.height], inViewport: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, clipped: b.scrollWidth > b.clientWidth || kv.scrollWidth > kv.clientWidth, onTop: hit === b || b.contains(hit) } }"`
  - **Read Credits** (READ-C): `npx playwright-cli eval "() => { const b = document.querySelector('.wm-resource b.amber'); return b ? { text: b.textContent, color: getComputedStyle(b).color, filter: document.documentElement.style.filter } : null }"`
  - **Grayscale on / off**: `npx playwright-cli eval "() => { document.documentElement.style.filter = 'grayscale(1)'; return getComputedStyle(document.documentElement).filter }"`; off: same with `''`.
- **S-6 Evidence folder**: `mkdir -p production/qa/evidence/if-020/`.

### Teardown (after the last case)

1. Write `production/qa/evidence/if-020/README.md`: HEAD commit, "final sprint build", each PNG with its state, Control value and the READ-G / READ-C values measured, and the R1 output path.
2. `npx playwright-cli close`.
3. Stop the dev server you started; `lsof -nP -iTCP:4200 -sTCP:LISTEN` prints nothing. Record this in the last case's Actual Result.

---

## R1 probe cases (AC-1 states, Credits)

### IF020-TC-01: SECURE prints teal (Control 60)

**AC covered**: AC-1 (SECURE → teal; no amber class)
**Coverage**: Covered by R1 probe check: `IF-020 SECURE prints rgb(126, 240, 212)` (fixture `garrison-secure`)
**Preconditions**: S-1 to S-3 done; R1 has exited.
**Steps**:
1. `grep -n '^.* IF-020 SECURE prints' production/qa/evidence/sprint-011-head-2026-10-24/probe-output.txt`.
2. Read the JSON detail after `//`.
3. Confirm `production/qa/evidence/sprint-011-head-2026-10-24/state-garrison-secure.png` exists if the probe writes it, and record its path.
4. `grep -c '^FAIL' production/qa/evidence/sprint-011-head-2026-10-24/probe-output.txt` and grep the output for `pageerror` / `console`.
**Expected Result**: One line `PASS IF-020 SECURE prints rgb(126, 240, 212)`, detail `{"text":"SECURE","color":"rgb(126, 240, 212)","amber":false}`. The run reports zero page or console errors (strategy section 4, item 3).
**Actual Result**:
**Pass/Fail**:

### IF020-TC-02: STRAINED prints the Print White notice tone (Control 45)

**AC covered**: AC-1 (STRAINED → Print White notice; no amber class)
**Coverage**: Covered by R1 probe check: `IF-020 STRAINED prints rgb(226, 246, 238)` (fixture `garrison-strained`)
**Preconditions**: As TC-01.
**Steps**:
1. `grep -n 'IF-020 STRAINED prints' production/qa/evidence/sprint-011-head-2026-10-24/probe-output.txt`.
2. Read the JSON detail.
3. Record the path of `state-garrison-strained.png` in the R1 folder if written.
**Expected Result**: `PASS IF-020 STRAINED prints rgb(226, 246, 238)`, detail `{"text":"STRAINED","color":"rgb(226, 246, 238)","amber":false}`. (The probe does not assert the `notice` class by name; TC-06 and TC-07 do.)
**Actual Result**:
**Pass/Fail**:

### IF020-TC-03: CRITICAL prints Red Hot (Control 20)

**AC covered**: AC-1 (CRITICAL → Red Hot; no amber class)
**Coverage**: Covered by R1 probe check: `IF-020 CRITICAL prints rgb(255, 107, 85)` (fixture `garrison-critical`)
**Preconditions**: As TC-01.
**Steps**:
1. `grep -n 'IF-020 CRITICAL prints' production/qa/evidence/sprint-011-head-2026-10-24/probe-output.txt`.
2. Read the JSON detail.
3. Record the path of `state-garrison-critical.png` in the R1 folder if written.
**Expected Result**: `PASS IF-020 CRITICAL prints rgb(255, 107, 85)`, detail `{"text":"CRITICAL","color":"rgb(255, 107, 85)","amber":false}`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-04: Credits stay Ledger Amber

**AC covered**: AC-1 edge case (Credits stay amber); AC-2 Credits half (read without the filter)
**Coverage**: Covered by R1 probe check: `IF-020 Credits stay Ledger Amber` (fixture `garrison-strained`; the probe reads Credits before it applies `grayscale(1)`)
**Preconditions**: As TC-01.
**Steps**:
1. `grep -n 'IF-020 Credits stay Ledger Amber' production/qa/evidence/sprint-011-head-2026-10-24/probe-output.txt`.
2. Read the detail.
**Expected Result**: `PASS IF-020 Credits stay Ledger Amber // rgb(255, 208, 117)`.
**Actual Result**:
**Pass/Fail**:

---

## Hand-walk cases: Control boundaries (AC-1)

The probe seeds 60 / 45 / 20. The story's setup names 55, 54, 35 and 34 (bands from `sectorReadout` in `src/state/worldStore.ts`: Control ≥55 SECURE, ≥35 STRAINED, else CRITICAL). These four cases are not covered by any R1 check.

### IF020-TC-05: Control 55 prints SECURE in teal

**AC covered**: AC-1 (lower SECURE boundary; no amber class)
**Coverage**: Hand-walk
**Preconditions**: S-1, S-2, S-4 to S-6. Opening assist applied (S-5).
**Steps**:
1. Apply "Set Control C on Europe" with `C = 55`. Confirm it returns `["eu",55]`.
2. Wait 500 ms (`npx playwright-cli eval "() => new Promise((r) => setTimeout(r, 500))"`).
3. Run READ-G.
4. Read the Focus panel CONTROL value: `npx playwright-cli eval "() => document.querySelector('.wm-cu b')?.textContent"`.
5. `npx playwright-cli screenshot --filename=production/qa/evidence/if-020/garrison-control-55.png` (if the flag differs on this CLI version, save the screenshot and move it to that path; record which).
**Expected Result**: READ-G `text` = `SECURE`, `color` = `rgb(126, 240, 212)`, `cls` contains `teal`, `amber` = false, `notice` = false, `clipped` = false. CONTROL reads `55%`. PNG is 1280x720 and shows `SECURE` in teal in the Focus panel.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-06: Control 54 prints STRAINED in Print White (`notice`)

**AC covered**: AC-1 (upper STRAINED boundary; notice class; no amber class)
**Coverage**: Hand-walk
**Preconditions**: As TC-05 (may continue in the same session).
**Steps**:
1. Apply "Set Control C on Europe" with `C = 54`; confirm `["eu",54]`.
2. Wait 500 ms.
3. Run READ-G.
4. Read the CONTROL value as in TC-05 step 4.
5. Screenshot to `production/qa/evidence/if-020/garrison-control-54.png`.
**Expected Result**: READ-G `text` = `STRAINED`, `color` = `rgb(226, 246, 238)`, `notice` = true, `amber` = false, `clipped` = false. CONTROL reads `54%`. PNG shows `STRAINED` in the near-white notice tone, not amber.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-07: Control 35 prints STRAINED in Print White (`notice`)

**AC covered**: AC-1 (lower STRAINED boundary; notice class; no amber class)
**Coverage**: Hand-walk
**Preconditions**: As TC-05.
**Steps**:
1. Apply "Set Control C on Europe" with `C = 35`; confirm `["eu",35]`.
2. Wait 500 ms.
3. Run READ-G.
4. Read the CONTROL value.
5. Screenshot to `production/qa/evidence/if-020/garrison-control-35.png`.
**Expected Result**: READ-G `text` = `STRAINED`, `color` = `rgb(226, 246, 238)`, `notice` = true, `amber` = false, `clipped` = false. CONTROL reads `35%`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-08: Control 34 prints CRITICAL in Red Hot

**AC covered**: AC-1 (upper CRITICAL boundary; no amber class)
**Coverage**: Hand-walk
**Preconditions**: As TC-05.
**Steps**:
1. Apply "Set Control C on Europe" with `C = 34`; confirm `["eu",34]`.
2. Wait 500 ms.
3. Run READ-G.
4. Read the CONTROL value.
5. Screenshot to `production/qa/evidence/if-020/garrison-control-34.png`.
**Expected Result**: READ-G `text` = `CRITICAL`, `color` = `rgb(255, 107, 85)`, `cls` contains `red`, `amber` = false, `notice` = false, `clipped` = false. CONTROL reads `34%`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-09: The amber class is never wired to Garrison (source guard)

**AC covered**: AC-1 ("the amber class is never used for Garrison", for states not seeded at runtime)
**Coverage**: Hand-walk (source read; one command)
**Preconditions**: S-1.
**Steps**:
1. `rg -n -A3 'GARRISON CONDITION' src/ui/WorldMap.tsx`.
2. `rg -n -i 'garrison' src/ui --glob '!*.test.ts'` and inspect every hit that sets a `className`.
**Expected Result**: The only Garrison readout is the `<b className={'wm-kv-readout ' + (read.garrison === 'SECURE' ? 'teal' : read.garrison === 'STRAINED' ? 'notice' : 'red')}>` line. No Garrison `className` expression in `src/ui/` contains `amber`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-10: Antarctica prints no Garrison

**AC covered**: AC-1 edge case ("Antarctica prints no Garrison")
**Coverage**: Hand-walk
**Preconditions**: As TC-05, with a fresh Opening assist applied (Europe at its new-campaign Control). Record `useWorldStore.getState().selected` before step 1.
**Steps**:
1. Click the `SOUTH POLE` button under the globe: `npx playwright-cli snapshot`, find the `SOUTH POLE` button ref, `npx playwright-cli click <ref>`.
2. Wait 800 ms.
3. Read: `npx playwright-cli eval "async () => { const { useWorldStore } = await import('/src/state/worldStore.ts'); const kv = [...document.querySelectorAll('.kv')].filter((k) => k.querySelector('span')?.textContent === 'GARRISON CONDITION'); return { selected: useWorldStore.getState().selected, caption: document.querySelector('.globe-polar-caption')?.textContent ?? null, garrisonRows: kv.length, panelText: document.querySelector('.wm-right')?.innerText.slice(0, 200) } }"`.
4. Screenshot to `production/qa/evidence/if-020/antarctica-south-pole.png`.
5. Focus cycle: with the Focus panel's next-sector stepper focused, press it once per open sector plus one (read the count from `OPEN_SECTORS` in `/src/game/atlas.ts`), reading `useWorldStore.getState().selected` after each press.
**Expected Result**: `selected` is never `an` (step 3 and every step-5 read). The caption reads `ANTARCTICA` + `UNSURVEYED SECTOR`. No `GARRISON CONDITION` row shows a value for Antarctica: either `garrisonRows` = 0, or the one row belongs to the still-selected non-Antarctic sector named in the panel heading. Nothing on the page prints SECURE / STRAINED / CRITICAL for Antarctica.
**Actual Result**:
**Pass/Fail**:

---

## Hand-walk cases: grayscale (AC-2, strategy H3)

The probe captured STRAINED in grayscale only (`production/qa/evidence/sprint-011/if-020-grayscale-strained.png`, at `ad176af`) and asserted nothing on it. These three cases take all three states at HEAD and read the word.

"Legible" is measured here as: the word's `textContent` matches, its box is inside the viewport and unclipped, it is the topmost element at its own centre (nothing covers it), and the word reads in full in the grayscale PNG. The PNG reading is by eye; the qa-lead may substitute a numeric bar (see CONCERNS in the hand-back).

### IF020-TC-11: Grayscale SECURE is told by its word alone

**AC covered**: AC-2 (SECURE in grayscale)
**Coverage**: Hand-walk
**Preconditions**: As TC-05. Opening assist applied.
**Steps**:
1. Apply "Set Control C on Europe" with `C = 60` (the probe's `garrison-secure` value); confirm `["eu",60]`. Wait 500 ms.
2. Run READ-G (scrolls the row into view). Record it.
3. Grayscale on. Confirm the returned filter is `grayscale(1)`.
4. Run READ-G again.
5. Screenshot to `production/qa/evidence/if-020/grayscale-secure.png`.
6. Open the PNG and read the GARRISON CONDITION slot.
7. Grayscale off; run READ-C.
**Expected Result**: Step 4 READ-G: `text` = `SECURE`, `inViewport` = true, `clipped` = false, `onTop` = true. In the PNG the whole page is gray and the word `SECURE` reads in full next to `GARRISON CONDITION`. Step 7: `filter` = `''` and Credits `color` = `rgb(255, 208, 117)`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-12: Grayscale STRAINED is told by its word alone

**AC covered**: AC-2 (STRAINED in grayscale)
**Coverage**: Hand-walk (R1 writes `if-020-grayscale-strained.png` into the R1 folder but asserts nothing on it; record its path as a cross-check only)
**Preconditions**: As TC-11.
**Steps**:
1. Apply "Set Control C on Europe" with `C = 45`; confirm `["eu",45]`. Wait 500 ms.
2. Run READ-G. Record it.
3. Grayscale on; confirm `grayscale(1)`.
4. Run READ-G again.
5. Screenshot to `production/qa/evidence/if-020/grayscale-strained.png`.
6. Read the GARRISON CONDITION slot in the PNG. Compare with the R1 folder's `if-020-grayscale-strained.png`.
7. Grayscale off; run READ-C.
**Expected Result**: Step 4: `text` = `STRAINED`, `inViewport` = true, `clipped` = false, `onTop` = true. The word `STRAINED` reads in full in the PNG. Step 7: `filter` = `''`, Credits `rgb(255, 208, 117)`.
**Actual Result**:
**Pass/Fail**:

### IF020-TC-13: Grayscale CRITICAL is told by its word alone

**AC covered**: AC-2 (CRITICAL in grayscale; and with TC-11/12, the three states are told apart by word)
**Coverage**: Hand-walk
**Preconditions**: As TC-11.
**Steps**:
1. Apply "Set Control C on Europe" with `C = 20`; confirm `["eu",20]`. Wait 500 ms.
2. Run READ-G. Record it.
3. Grayscale on; confirm `grayscale(1)`.
4. Run READ-G again.
5. Screenshot to `production/qa/evidence/if-020/grayscale-critical.png`.
6. Read the GARRISON CONDITION slot in the PNG. Lay the three grayscale PNGs (TC-11, TC-12, TC-13) side by side and read only the Garrison slot.
7. Grayscale off; run READ-C.
**Expected Result**: Step 4: `text` = `CRITICAL`, `inViewport` = true, `clipped` = false, `onTop` = true. The word `CRITICAL` reads in full. Across the three PNGs the slot reads `SECURE`, `STRAINED`, `CRITICAL` respectively, so each state is identifiable from the word alone with colour removed. Step 7: `filter` = `''`, Credits `rgb(255, 208, 117)`.
**Actual Result**:
**Pass/Fail**:

---

## AC coverage map

| AC / edge | Cases |
|---|---|
| AC-1 SECURE teal | TC-01 (R1, Control 60), TC-05 (Control 55) |
| AC-1 STRAINED Print White `notice` | TC-02 (R1, Control 45), TC-06 (54), TC-07 (35) |
| AC-1 CRITICAL Red Hot | TC-03 (R1, Control 20), TC-08 (34) |
| AC-1 no `amber` class on Garrison | TC-01 to TC-03 (R1), TC-05 to TC-08, TC-09 (source) |
| AC-1 edge: Credits stay amber | TC-04 (R1); re-read in TC-11 to TC-13 step 7 |
| AC-1 edge: Antarctica prints no Garrison | TC-10 |
| AC-2 grayscale, word alone, three states | TC-11, TC-12, TC-13 |
| AC-2 Credits Ledger Amber without filter | TC-04 (R1); TC-11 to TC-13 step 7 |
