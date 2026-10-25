# IF-029 manual test cases: Locked contract rows dim the frame, not the text, and their reason prints in Red Hot

- **Story**: `production/epics/interface/story-029-locked-contract-rows-dim-the-frame-not-the-text.md` (AC-1, AC-2 guard)
- **Sources**: the story's Acceptance Criteria and `## QA Test Cases`; `production/qa/qa-plan-sprint-011-2026-10-23.md` IF-029 block (incl. the AC-2 grayscale locked-vs-open guard); `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-029 row: "E (capture `if-029-grayscale-locked-vs-open.png`), R1").
- **Story type**: UI. **Gate**: BLOCKING. **Evidence**: R1 output and captures in `production/qa/evidence/sprint-011-head-2026-10-24/` (strategy section 4); hand-walk captures and measurements in `production/qa/evidence/sprint-011-head-2026-10-24/if-029/`. The story's own Test Evidence names `production/qa/evidence/if-029/` (see CONCERNS at the end).
- **Build under test**: HEAD `131a5c1`. The committed `sprint-011/probe-output.txt` (IF-029 lines 111-114 PASS) was produced at `ad176af` and is stale against HEAD's `src/` (strategy section 1). Only a fresh R1 run at HEAD counts.
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude (headless). Sign-off: qa-lead.

## Run setup (once, before TC-01)

1. `npm run dev -- --strictPort`. Confirm `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener.
2. Run R1 unchanged: `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`. `PROBE_OUT` must end in `/` (the script writes `${OUT}${name}.png`). Headless Chrome for Testing, viewport 1280x720 (set in the script's `newContext`). Do not edit `probe.mjs`.
3. `git status --short production/qa/evidence/sprint-011/` prints nothing (the committed outputs were not overwritten).
4. Hand-walk harness: write `production/qa/evidence/sprint-011-head-2026-10-24/if-029/handwalk.mjs`, a headless Chrome for Testing script at exactly 1280x720 that copies verbatim from `probe.mjs`: the `HELPERS` function (`window.__probe.runs`, `ratio`, `over`, `bgOf`), `fresh()`, `dismissCard`, `pause`, `setHC`, `sector`, and the `opening` and `failed` entries of `STATES`. No other harness assist is allowed. Its output goes to `if-029/handwalk-output.txt`.
5. Fixture names used below (all from `probe.mjs`):
   - **opening**: `STATES.opening` = `fresh()` (localStorage clear, `save.startNewOperation()`, `goto('world')`) + `dismissCard()` + `pause()`. Opening desk: GLASS VEIL (`m01`, sector `eu`) and HOLLOW CROWN (`m02`, sector `as`) intel-locked; RUST HAVEN (`m03`, sector `na`) open (`src/game/data.ts`).
   - **failed**: `STATES.failed` = **opening** + `useCampaignStore.setState({ campaignFailed: true })`.
   - Sector selection: `sector('<id>', {})`. Mode: `setHC(true|false)`. Grayscale: `document.documentElement.style.filter = 'grayscale(1)'`.
6. Contrast method (all cases): the WCAG ratio as rendered, composited over the row's ancestors' backgrounds on Void `#04070a` (the panel is `rgba(7, 16, 15, 0.92)`), computed by `window.__probe.runs` / `ratio`; effective opacity = product of every ancestor's computed `opacity` x the colour's alpha (`alphaOf` in HELPERS). Values are computed by script, never read off a screenshot by eye, except where a case says to sample pixels.
7. Literals: Red Hot `rgb(255, 107, 85)`; Ink `rgb(184, 216, 207)` in default mode. For high contrast, read the remapped Ink from `getComputedStyle(document.documentElement).getPropertyValue('--ink')`.
8. After the last case: stop the dev server; confirm `lsof -iTCP:4200 -sTCP:LISTEN` prints nothing; confirm no Chrome for Testing process from the run is left.

## Coverage map

| Case | AC | Coverage |
|---|---|---|
| TC-01 | AC-1 | Covered by R1 probe check: `IF-029 default: locked-row text opacity 1 and >= 4.5:1` |
| TC-02 | AC-1 | Covered by R1 probe check: `IF-029 high contrast: locked-row text opacity 1 and >= 4.5:1` |
| TC-03 | AC-1, AC-2 (`aria-disabled`) | Covered by R1 probe check: `IF-029 default: reason in Red Hot, frame dimmed, glyph and aria-disabled` |
| TC-04 | AC-1, AC-2 (`aria-disabled`) | Covered by R1 probe check: `IF-029 high contrast: reason in Red Hot, frame dimmed, glyph and aria-disabled` |
| TC-05 | AC-1 (codename, `TYPE // CITY`, chips in Ink or brighter) | Hand-walk |
| TC-06 | AC-1 (lock glyph instead of target glyph) | Hand-walk |
| TC-07 | AC-1, AC-2 (second intel-locked row: HOLLOW CROWN) | Hand-walk |
| TC-08 | AC-1 (failed campaign, default) | Hand-walk (R1 supports with `failed: every row in eu/na/as reads CAMPAIGN LOST` and `failed: every text run >= 4.5:1 as rendered`) |
| TC-09 | AC-1 (failed campaign, high contrast) | Hand-walk |
| TC-10 | AC-2 (grayscale locked vs open) | Hand-walk (R1 produces the capture `if-029-grayscale-locked-vs-open.png` but asserts nothing on it) |
| TC-11 | AC-1 edge, AC-2 (lock glyph >= 3:1 non-text) | Hand-walk |
| TC-12 | AC-2 (`aria-disabled` on the whole opening desk) | Hand-walk |

---

## IF-029-TC-01: Intel-locked row text renders at opacity 1 and >= 4.5:1 (default mode)

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-029 default: locked-row text opacity 1 and >= 4.5:1`
**Preconditions**: Run setup steps 1-3 done. Fixture **opening**, sector `eu` selected, high contrast off (the probe sets this itself).
**Steps**:
1. In `sprint-011-head-2026-10-24/probe-output.txt`, find the line `IF-029 default: locked-row text opacity 1 and >= 4.5:1`.
2. Record its detail string (`n <count> alpha <min> ratio <min> <low runs>`).
3. Open `sprint-011-head-2026-10-24/if-029-locked-default.png` and confirm it shows the OPEN CONTRACTS list with the locked row.
4. Confirm the run's last two lines are `no console or page errors` and `ALL PASS` (or record the FAIL count).

**Expected Result**: The line reads `PASS`; `n` >= 1; `alpha 1`; `ratio` >= 4.5; the low-run list is empty. The capture shows the locked row's text at full strength with a visibly different (dashed, unfilled) frame.
**Pass Criteria**: The probe line is `PASS` with `alpha 1` and `ratio` >= 4.5, and the run has no console or page errors.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-02: Intel-locked row text renders at opacity 1 and >= 4.5:1 (high contrast)

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-029 high contrast: locked-row text opacity 1 and >= 4.5:1`
**Preconditions**: TC-01 run. Fixture **opening**, sector `eu`, `setHC(true)` (the probe sets this itself).
**Steps**:
1. In `probe-output.txt`, find `IF-029 high contrast: locked-row text opacity 1 and >= 4.5:1`.
2. Record its detail string.
3. Open `sprint-011-head-2026-10-24/if-029-locked-hc.png`.

**Expected Result**: `PASS`; `n` >= 1; `alpha 1`; `ratio` >= 4.5; no low runs. The capture is in high-contrast mode (brighter borders than the default capture).
**Pass Criteria**: The probe line is `PASS` with `alpha 1` and `ratio` >= 4.5.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-03: Reason in Red Hot, no `red-dim`, frame differs from an open row, glyph present, `aria-disabled` (default mode)

**AC covered**: AC-1; AC-2 (`aria-disabled` part)
**Coverage**: Covered by R1 probe check: `IF-029 default: reason in Red Hot, frame dimmed, glyph and aria-disabled`
**Preconditions**: TC-01 run. Fixture **opening**, sector `eu`, high contrast off.
**Steps**:
1. In `probe-output.txt`, find `IF-029 default: reason in Red Hot, frame dimmed, glyph and aria-disabled`.
2. From its JSON detail, record `reason`, `redDim`, `lockedFrame` (`border`, `bg`, `op`), `openFrame`, `glyph`, `disabled`, `openDisabled`.
3. Also record the R1 line `IF-017 not failed: intel-locked rows read REQUIRES INTEL LVL n` (it confirms the reason text is visible).

**Expected Result**: `PASS`; `reason` = `rgb(255, 107, 85)`; `redDim` = `false`; `lockedFrame.op` = `"1"`; `lockedFrame` and `openFrame` differ in border colour or background; `glyph` = `true`; `disabled` = `true`; `openDisabled` = `null`. The IF-017 line is `PASS` with a non-empty list of `REQUIRES INTEL LVL n` strings.
**Pass Criteria**: Both probe lines are `PASS` and the JSON shows every value listed above.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-04: Reason in Red Hot, no `red-dim`, frame differs, glyph present, `aria-disabled` (high contrast)

**AC covered**: AC-1; AC-2 (`aria-disabled` part)
**Coverage**: Covered by R1 probe check: `IF-029 high contrast: reason in Red Hot, frame dimmed, glyph and aria-disabled`
**Preconditions**: TC-02 run. Fixture **opening**, sector `eu`, `setHC(true)`.
**Steps**:
1. In `probe-output.txt`, find `IF-029 high contrast: reason in Red Hot, frame dimmed, glyph and aria-disabled`.
2. Record the same JSON fields as TC-03.

**Expected Result**: `PASS`; `reason` = `rgb(255, 107, 85)` (Red Hot is not remapped in high contrast, per the story's pass condition); `redDim` = `false`; `lockedFrame.op` = `"1"`; frames differ; `glyph` = `true`; `disabled` = `true`; `openDisabled` = `null`.
**Pass Criteria**: The probe line is `PASS` and the JSON shows every value listed above.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-05: Codename, `TYPE // CITY` and chips in a locked row print in Ink or brighter

**AC covered**: AC-1 ("codename, `TYPE // CITY` and chips in Ink or brighter")
**Coverage**: Hand-walk. R1 asserts >= 4.5:1 and "no Ink Dim text" for the state, but not "Ink or brighter" per run.
**Preconditions**: Run setup step 4 done. Fixture **opening**, sector `eu`; run once with `setHC(false)` and once with `setHC(true)`.
**Steps**:
1. Load fixture **opening**; `sector('eu', {})`; `setHC(false)`; wait 250 ms; install HELPERS.
2. For every `.wm-op.locked` row, list every text run from `window.__probe.runs('.wm-ops-list')` that the row contains, with text, element path, computed `color`, effective alpha and ratio.
3. Classify each run as codename (`.wm-op-main > b`), `TYPE // CITY`, reason (`.wm-op-main i`), or chip (`CHANCE`, `ETA`, `GENERATED`, `EXPIRY`).
4. For each non-reason run, compute its colour's WCAG relative luminance and compare with the luminance of the mode's Ink (Run setup step 7).
5. Repeat steps 1-4 with `setHC(true)`.
6. Capture `if-029/tc05-default.png` and `if-029/tc05-hc.png`.

**Expected Result**: In both modes, every codename, `TYPE // CITY` and chip run has relative luminance >= that mode's Ink, effective alpha 1, and ratio >= 4.5. No run's colour equals Ink Dim `rgb(93, 125, 117)` or Ink Faint `rgb(53, 80, 74)`.
**Pass Criteria**: Zero non-reason runs in any locked row are below Ink's luminance, below alpha 1, or below 4.5:1, in either mode.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-06: Each locked row draws the lock glyph instead of the target glyph

**AC covered**: AC-1 ("the lock glyph is drawn instead of the target glyph")
**Coverage**: Hand-walk. R1 checks only that `locked[0]` has a `.wm-op-glyph svg`; both glyphs are SVGs, so it does not tell them apart.
**Preconditions**: Run setup step 4 done. Fixture **opening**.
**Steps**:
1. Load fixture **opening**; for each sector in `eu`, `as`, `na`: `sector('<id>', {})`, wait 150 ms.
2. For every `.wm-op` row, record its codename, whether it has class `locked`, and the `viewBox` of `.wm-op-glyph svg`. (`LockGlyph` uses `viewBox="0 0 12 14"`; `TargetGlyph` uses `viewBox="0 0 16 16"`, `src/ui/bits.tsx`.)
3. Confirm the glyph `svg` has a non-zero bounding box (`getBoundingClientRect()` width and height > 0) and computed `visibility: visible`.
4. Capture `if-029/tc06-eu.png`, `if-029/tc06-as.png`, `if-029/tc06-na.png`.

**Expected Result**: GLASS VEIL (`eu`) and HOLLOW CROWN (`as`) rows are `locked` and each carries exactly one `svg` with `viewBox="0 0 12 14"` and no `0 0 16 16` glyph. RUST HAVEN (`na`) and every other open row carry `viewBox="0 0 16 16"`. Every glyph has a visible, non-zero box.
**Pass Criteria**: 100% of locked rows show the lock glyph and 0 locked rows show the target glyph; 100% of open rows show the target glyph.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-07: HOLLOW CROWN (second intel-locked row) meets AC-1 in both modes

**AC covered**: AC-1; AC-2 (`aria-disabled`)
**Coverage**: Hand-walk. R1's IF-029 checks select sector `eu` only (committed output: `n 1`), so HOLLOW CROWN in `as` is never measured by them.
**Preconditions**: Run setup step 4 done. Fixture **opening**.
**Steps**:
1. Load fixture **opening**; `sector('as', {})`; `setHC(false)`; wait 250 ms; install HELPERS.
2. Run the same evaluation as the probe's IF-029 block (min effective alpha and min ratio over locked-row runs; reason computed `color`; any `.red-dim` descendant; `border-color`, `border-style`, `background-color`, `opacity` of the locked row; `aria-disabled`), for HOLLOW CROWN's row.
3. Read the reason text.
4. For the frame comparison, take the open row from `na` (RUST HAVEN): `sector('na', {})` and read the same four frame properties.
5. Repeat steps 1-4 with `setHC(true)`.
6. Capture `if-029/tc07-as-default.png` and `if-029/tc07-as-hc.png`.

**Expected Result**: In both modes: min alpha 1; min ratio >= 4.5; reason text matches `REQUIRES INTEL LVL n` and its colour is `rgb(255, 107, 85)`; no `.red-dim` descendant; locked row `opacity` = `1`; locked frame differs from RUST HAVEN's in at least one of border colour, border style or background (as built: `border-style: dashed`, `background: transparent`, `src/ui/ui.css:1514`); `aria-disabled="true"`.
**Pass Criteria**: Every value above holds for HOLLOW CROWN in both default and high contrast.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-08: Failed campaign: `CAMPAIGN LOST` rows get the locked treatment (default mode)

**AC covered**: AC-1 (failed campaign; edge case "`CAMPAIGN LOST` is the same element and gets the same treatment"; "`aria-disabled` unchanged")
**Coverage**: Hand-walk. R1 supports it with `IF-017 failed: every row in eu/na/as reads CAMPAIGN LOST` (text and `aria-label`) and the state sweep line `IF-027 failed: every text run >= 4.5:1 as rendered` (ratio includes alpha but does not assert alpha = 1, and does not read the reason colour, the frame, the glyph or `aria-disabled`).
**Preconditions**: Run setup step 4 done. Before loading **failed**, record from fixture **opening** the frame properties (`border-color`, `border-style`, `background-color`, `opacity`) of one open row in `eu` and of RUST HAVEN in `na`, default mode.
**Steps**:
1. Load fixture **failed**; `setHC(false)`; wait 250 ms; install HELPERS.
2. For each sector in `eu`, `na`, `as`: `sector('<id>', {})`, wait 150 ms, then for every `.wm-op` row record: class `locked` present; reason element `.wm-op-main i` text, computed `color`, class list; min effective alpha and min ratio over the row's text runs; frame properties; glyph `viewBox`; `aria-disabled`.
3. Compare each row's frame with the open-row frame recorded in the precondition.
4. Capture `if-029/tc08-failed-default-eu.png`, `-na.png`, `-as.png`.

**Expected Result**: Every row in all three sectors (RUST HAVEN included) is `locked`. Its reason element is the same `.wm-op-main i` element, reads `CAMPAIGN LOST`, is `rgb(255, 107, 85)`, and has no `red-dim` class. Every run has effective alpha 1 and ratio >= 4.5. The row `opacity` is `1` and its frame differs from the open-row frame. The glyph is the lock glyph (`viewBox="0 0 12 14"`). `aria-disabled="true"` on every row.
**Pass Criteria**: Zero rows in any sector violate any value above.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-09: Failed campaign: `CAMPAIGN LOST` rows get the locked treatment (high contrast)

**AC covered**: AC-1 (failed campaign, high-contrast mode)
**Coverage**: Hand-walk. No R1 check runs the failed fixture in high contrast.
**Preconditions**: TC-08 run. Record the open-row frame from fixture **opening** in high contrast (`setHC(true)`) for comparison.
**Steps**:
1. Load fixture **failed**; `setHC(true)`; wait 250 ms; install HELPERS.
2. Repeat TC-08 steps 2-3 against the high-contrast open-row frame.
3. Capture `if-029/tc09-failed-hc-eu.png`, `-na.png`, `-as.png`.
4. Reset `setHC(false)`.

**Expected Result**: The same values as TC-08 hold in high contrast: every run alpha 1 and >= 4.5:1; reason `CAMPAIGN LOST` in `rgb(255, 107, 85)`, no `red-dim`; row `opacity` 1; frame differs from the high-contrast open row; lock glyph; `aria-disabled="true"`.
**Pass Criteria**: Zero rows in any sector violate any value above in high contrast.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-10: In grayscale, a locked row is told apart from an open row by its lock glyph and reason text

**AC covered**: AC-2 (plan guard "grayscale locked vs open")
**Coverage**: Hand-walk. R1 takes `if-029-grayscale-locked-vs-open.png` (sector `eu`, default mode) but makes no assertion on it.
**Preconditions**: Run setup step 4 done. Fixture **opening**, default mode.
**Steps**:
1. Open `sprint-011-head-2026-10-24/if-029-grayscale-locked-vs-open.png` (R1, HEAD). Record which row is locked and which is open.
2. Hand-walk side by side: load fixture **opening**, `sector('eu', {})`, apply `grayscale(1)`, capture `if-029/tc10-gray-eu.png` (GLASS VEIL locked next to an open row in the same list).
3. `sector('as', {})`, capture `if-029/tc10-gray-as.png` (HOLLOW CROWN); `sector('na', {})`, capture `if-029/tc10-gray-na.png` (RUST HAVEN open).
4. With the filter still on, read for each row: the glyph `viewBox` (lock vs target) and the reason text node's content and rendered box (non-zero, not clipped by `window.__probe.clipped`).
5. In each capture, sample pixels on the glyph (TC-11 method) and on the reason text's row background to confirm the glyph and the reason are drawn (not blended into the frame) with colour removed.
6. Remove the filter.

**Expected Result**: With colour removed, every locked row shows the lock-shaped glyph and a legible reason (`REQUIRES INTEL LVL n`), and every open row shows the target glyph and no reason. The difference is visible in the shape of the glyph and the presence of the reason text, not only in tone. The R1 capture agrees with the hand-walk captures.
**Pass Criteria**: In all grayscale captures, 100% of locked rows have the lock glyph and a visible, unclipped reason; 0 open rows have either.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-11: The lock glyph meets the 3:1 non-text floor (default, high contrast, grayscale)

**AC covered**: AC-1 edge case ("the lock glyph >= 3:1, non-text floor"); AC-2 ("lock glyph >= 3:1 non-text floor")
**Coverage**: Hand-walk. No R1 check measures the glyph.
**Preconditions**: Run setup step 4 done. Fixture **opening**.
**Steps**:
1. Load fixture **opening**; `sector('eu', {})`; `setHC(false)`; install HELPERS.
2. Read the computed `color` of `.wm-op.locked .wm-op-glyph` (the glyph is `currentColor`; as built `var(--ink)`, `src/ui/ui.css:1517`) and every ancestor's `opacity` up to the document root.
3. Composite the glyph colour at its effective alpha over the row's ancestor backgrounds on Void `#04070a` with `window.__probe.over` / `bgOf`, and compute the WCAG ratio with `window.__probe.ratio`.
4. Cross-check by pixels: take an element screenshot of the glyph at 1280x720; sample the centre pixel of the glyph's filled body (the `rect`) and a background pixel inside the row 3 px left of the glyph's box; compute the WCAG ratio of the two sampled colours.
5. Repeat steps 1-4 for HOLLOW CROWN (`as`), then for both rows with `setHC(true)`.
6. With `setHC(false)` and `grayscale(1)` applied, repeat step 4 only (pixel ratio on the desaturated render) for both rows.
7. Record every ratio in `handwalk-output.txt`.

**Expected Result**: The glyph's computed ratio and pixel-sampled ratio are both >= 3.0 for GLASS VEIL and HOLLOW CROWN in default and high contrast, and the pixel ratio is >= 3.0 in grayscale. The glyph's effective alpha is 1.
**Pass Criteria**: All recorded glyph ratios (computed and pixel, 2 rows x default/HC, plus 2 rows grayscale pixel) are >= 3.0. If computed and pixel values disagree on pass/fail, the case fails and both numbers are reported.
**Actual Result**:
**Pass/Fail**:

## IF-029-TC-12: Locked rows carry `aria-disabled="true"`; open rows do not

**AC covered**: AC-2 ("it keeps `aria-disabled`"; plan pass condition "locked rows carry `aria-disabled="true"`, open rows do not")
**Coverage**: Hand-walk. R1 (TC-03/04) reads `aria-disabled` in sector `eu` only; this case covers the whole opening desk.
**Preconditions**: Run setup step 4 done. Fixture **opening**, default mode.
**Steps**:
1. Load fixture **opening**.
2. For each sector in `eu`, `as`, `na`: `sector('<id>', {})`, wait 150 ms, then for every `.wm-op` record codename, class `locked`, and `getAttribute('aria-disabled')`.
3. Repeat step 2 with `setHC(true)` (the attribute must not depend on mode), then `setHC(false)`.
4. Click a locked row (`click({ force: true })`) and read `useAppStore.getState().phase`.

**Expected Result**: GLASS VEIL and HOLLOW CROWN (and every other `locked` row) have `aria-disabled="true"`. RUST HAVEN and every other open row return `null` (attribute absent, not `"false"`). Results are identical in both modes. Clicking a locked row leaves `phase` = `world`.
**Pass Criteria**: Every locked row is `"true"`, every open row is `null`, in both modes, and the locked-row click does not leave the World Network.
**Actual Result**:
**Pass/Fail**:

---

## CONCERNS for qa-lead (raised while writing these cases)

1. **R1's IF-029 checks are narrower than the story's ACs.** They measure sector `eu` only (committed output shows `n 1`), read reason, frame and glyph on `locked[0]` only, cannot tell the lock glyph from the target glyph, do not measure the glyph's 3:1 floor, never run the failed campaign in high contrast, and only capture the grayscale view without asserting anything. TC-05 to TC-12 are hand-walks for that reason.
2. **Evidence location conflict.** The story's Test Evidence names `production/qa/evidence/if-029/`; the strategy (section 4) puts the HEAD re-run in `production/qa/evidence/sprint-011-head-2026-10-24/`. These cases use the strategy's folder. qa-lead to confirm.
3. **Observation, not a defect:** the story's Implementation Notes say the lock glyph uses Ink Dim (4.29:1). As built, `src/ui/ui.css:1517` sets `.wm-op.locked .wm-op-glyph { color: var(--ink) }`. The AC sets only a >= 3:1 floor, so TC-11 measures the floor, not the token.
4. **Observation:** the probe's "frame dimmed" test compares border colour and background only. In the committed output both rows have the same border colour and differ only in background. The as-built dashed border is not compared. TC-07 and TC-08 record `border-style` too.
