# IF-028 — Feed times and the Timeline axis move off Ink Faint — Manual test cases

**Story**: `production/epics/interface/story-028-feed-times-and-timeline-axis-move-off-ink-faint.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/sprint-011-head-2026-10-24/` (the strategy's fresh R1 folder: screenshots + README naming HEAD as the final sprint build) | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: HEAD `131a5c1`
**Sources**: story `## Acceptance Criteria` and `## QA Test Cases` (AC-1, AC-2 guard); `production/qa/qa-plan-sprint-011-2026-10-23.md` § IF-028 (parents `.wm-feed-body`, `.wm-tl`); `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 6 (IF-028: "No Ink Faint text; Feed times and axis labels >=4.5:1; NOW teal", R1, status E) and § 4 (R1 run conditions).
**Automated coverage**: none (UI story). The R1 probe (`production/qa/evidence/sprint-011/probe.mjs`) is the scripted check.
**Out of scope**: Ink Dim runs (IF-027). Changing Feed tones (the story only requires that they are unchanged).

## AC coverage map

| AC | Cases |
|---|---|
| AC-1 Feed times and axis labels in Ink at >=4.5:1; no text run on the screen in Ink Faint | IF-028-01, -02, -03, -04 |
| AC-2 (guard) `NOW` stays teal; tone-coloured Feed lines keep their tone; high contrast does not regress | IF-028-05, -06, -07 |

AC-2 results are recorded separately from AC-1 in the evidence README, as the story requires.

## Reference values (spec literals, as pinned in probe.mjs and `src/index.css`)

| Token | Default computed | High contrast computed | Ratio over the panel (default / HC) |
|---|---|---|---|
| Ink `--ink` | `rgb(184, 216, 207)` | `rgb(226, 246, 238)` | 12.68:1 / 17.18:1 |
| Ink Faint `--ink-faint` | `rgb(53, 80, 74)` | `rgb(109, 147, 138)` | 2.21:1 / 5.70:1 |
| Teal `--teal` (not remapped) | `rgb(126, 240, 212)` | `rgb(126, 240, 212)` | 14.10:1 |
| Red Hot `--red-hot` (not remapped) | `rgb(255, 107, 85)` | same | — |
| Green `--green` (not remapped) | `rgb(125, 224, 138)` | same | — |
| Print White `--print-white` (not remapped) | `rgb(226, 246, 238)` | same | — |

The ratios above were computed for a run sitting directly on `rgba(7, 16, 15, 0.92)` over Void `#04070a`. Use them only as a sanity reference. The pass value is the composited ratio as rendered, computed by script over the element's real ancestor chain, using the probe's `bgOf` / `alphaOf` / `ratio` helpers (`probe.mjs` HELPERS).

Feed tone mapping (`src/ui/worldChrome.ts` `eventToneClass`, `src/ui/ui.css`): event tone `red` -> `.wm-feed-line.red` Red Hot; `green` -> `.green` Green; `amber` -> `.notice` Print White; `dim` -> `.dim` Ink. `.wm-feed-t` is set to `var(--ink)` on every line.

## Common setup

- `npm run dev -- --port 4200 --strictPort`. Run headless Chrome for Testing (playwright-cli / playwright-core, as probe.mjs launches it) at exactly 1280x720. Never use the owner's Chrome.
- State fixtures go through the stores, as probe.mjs does: clear localStorage, `save.startNewOperation()`, `appStore.goto('world')`, `tutorialStore.markSeen('hint-worldmap')` to dismiss the orientation card, and `worldStore.setState({ paused: true })` so nothing moves between measurement and capture. This is the probe's `opening` state. Its Feed has events (the probe's IF-022 check "token absent with events" relies on this).
- **Four-tone Feed fixture** (IF-028-06 and -07). Run it in the page after the `opening` state:
  ```js
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const s = useWorldStore.getState()
  const base = s.events[0]
  useWorldStore.setState({
    events: ['red', 'green', 'amber', 'dim'].map((tone, i) => ({ ...base, id: 9100 + i, t: Math.max(0, s.t - (i + 1) * 3600), tone })),
    unread: 0,
  })
  ```
- **Review fixture**: the probe's `review` state, which runs `worldStore.setState({ t: 30 * 3600 })` and then `setReview(30 * 3600 - 6 * 3600)`.
- **High contrast**: `settingsStore.getState().setHighContrast(true)`. Confirm `document.documentElement.classList.contains('s-high-contrast')`.
- Measure only after the orientation card's fade has finished (strategy § 4 step 1 / F2). Wait at least 500 ms after any state change, as the probe's `enter()` does.
- Record console and page errors for the whole run. Any error fails the run it occurred in.
- Teardown: stop the dev server and confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` empty). Close the headless browser.

---

## Test Case: IF-028-01 — No text run in Ink Faint, full-screen sweep, 11 states (default mode)

**AC covered**: AC-1 ("no text run on the screen uses Ink Faint")
**Coverage**: Covered by R1 probe check: `IF-028 <state>: no text in Ink Faint` (11 checks, one per state)
**Preconditions**: Common setup. R1 is run unchanged on HEAD `131a5c1` with `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/`.
**Steps**:
1. Run R1.
2. In `probe-output.txt`, find the 11 `IF-028` lines, one for each of `opening-card`, `opening`, `garrison-secure`, `garrison-strained`, `garrison-critical`, `pressure`, `crisis`, `review`, `failed`, `influence-note`, `intel2`.
3. Confirm the matching `state-<name>.png` captures exist in the output folder.
4. Read the run's error lines (console / pageerror).
**Expected Result**: All 11 lines read `PASS IF-028 <state>: no text in Ink Faint`. None of them lists a run in `rgb(53, 80, 74)`. All 11 captures exist. There are no console or page errors.
**Pass Criteria**: 11 of 11 IF-028 lines PASS, and 0 errors. Any FAIL is filed with `/bug-report`. Do not edit the script to make it pass.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-02 — Feed times print in Ink at >=4.5:1 as rendered

**AC covered**: AC-1 ("Feed times ... print in Ink at >=4.5:1")
**Coverage**: Hand-walk. R1 gives supporting coverage only: `IF-027 <state>: every text run >= 4.5:1 as rendered` and `IF-028 <state>: no text in Ink Faint` include the Feed times, but no probe check asserts that `.wm-feed-t` is Ink.
**Preconditions**: Common setup, `opening` state (default mode, Feed with events, clock paused).
**Steps**:
1. Count the visible `.wm-feed-t` elements. There must be at least 1.
2. For every visible `.wm-feed-t`, read `getComputedStyle(el).color`, the effective alpha (the product of ancestor `opacity` and the colour alpha), and the composited ratio as rendered (probe helpers).
3. Record the min and max ratio, and the set of distinct colours.
4. Capture `if-028-feed-times-default.png`.
**Expected Result**: Every `.wm-feed-t` computes to `rgb(184, 216, 207)` (Ink) with effective alpha 1. Every ratio is >=4.5:1 (the reference is about 12.7:1).
**Pass Criteria**: The count is >=1. The distinct-colour set is exactly `{rgb(184, 216, 207)}`. The minimum alpha is 1. The minimum ratio is >=4.5.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-03 — Timeline axis labels print in Ink at >=4.5:1, live and Review

**AC covered**: AC-1 ("the axis labels print in Ink at >=4.5:1")
**Coverage**: Hand-walk. R1 gives supporting coverage only (the IF-027 ratio check and the IF-028 no-Ink-Faint check in the `opening` and `review` states). No probe check asserts that `.wm-tl-axis` is Ink.
**Preconditions**: Common setup. Part A uses the `opening` state (live). Part B uses the Review fixture.
**Steps**:
1. Part A (live): read the text, computed colour, effective alpha and composited ratio of each `.wm-tl-axis > span` (expect `-24H`, `-12H`, `-6H`, `NOW`).
2. Capture `if-028-axis-live.png`.
3. Part B (Review): apply the Review fixture. Confirm the time code reads `REVIEW -<ago>` with `> GO LIVE`. Repeat step 1.
4. Capture `if-028-axis-review.png`.
**Expected Result**: In both parts, `-24H`, `-12H` and `-6H` compute to `rgb(184, 216, 207)` with alpha 1 and a ratio >=4.5:1. All four labels print, with no ellipsis or clip. In Review, `NOW` has no `.now` class (as built, `src/ui/WorldMap.tsx` `review === null ? 'now' : undefined`). Record its colour; it is expected to be Ink at >=4.5:1. `NOW` in live mode is judged in IF-028-05.
**Pass Criteria**: In each part, the three tick labels are Ink, alpha 1 and >=4.5:1. In Review, `NOW` is >=4.5:1 and is not `rgb(53, 80, 74)`. Record its colour as an observation (see the CONCERNS note on Review `NOW`).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-04 — Document-wide sweep, header and nav included: zero runs in Ink Faint

**AC covered**: AC-1 (QA Test Cases pass condition: "no text run, header and nav included, has `rgb(53,80,74)`")
**Coverage**: Hand-walk. R1's `IF-028 <state>: no text in Ink Faint` sweeps `.screen`. `.screen` contains `.screen-head` and `.navtabs` (`src/ui/Nav.tsx`), so the header and nav are inside its root. Anything portalled outside `.screen` is not in its root. This case confirms the scope and extends the sweep to `body`.
**Preconditions**: Common setup, `opening` state, default mode. Then repeat with the `opening-card` state, measured after the fade has finished.
**Steps**:
1. Run the probe's text-run sweep with root `body` (`window.__probe.runs('body')`, with the HELPERS installed as probe.mjs installs them). Alternatively, walk every visible text node under `body` with the same visibility rule.
2. Confirm that the sweep includes at least one run under `.screen-head` (header resources) and at least one under `.navtabs` (nav labels). Record those counts.
3. Filter the runs whose colour is `rgb(53, 80, 74)`.
4. Repeat steps 1-3 in the `opening-card` state.
**Expected Result**: The header and nav runs are present in the sweep. Zero runs are in `rgb(53, 80, 74)` in either state.
**Pass Criteria**: The header run count is >=1 and the nav run count is >=1. The Ink Faint run count is 0 in both states.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-05 — Axis `NOW` stays teal (live)

**AC covered**: AC-2 ("the axis `NOW` stays teal")
**Coverage**: Hand-walk. No R1 check reads `.wm-tl-axis .now`.
**Preconditions**: Common setup, `opening` state (live, not Review).
**Steps**:
1. Confirm that `.wm-tl-axis .now` exists and that its text is `NOW`.
2. Read its computed `color` and `font-weight`, and its composited ratio.
3. Compare it with the other three axis labels from IF-028-03 Part A.
**Expected Result**: `NOW` computes to `rgb(126, 240, 212)` (Teal) at weight 700. It differs from the Ink tick labels and is >=4.5:1.
**Pass Criteria**: The colour is `rgb(126, 240, 212)` exactly, and the ratio is >=4.5.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-06 — Tone-coloured Feed lines keep their tone; the time on each is Ink

**AC covered**: AC-2 ("tone-coloured Feed lines keep their tone")
**Coverage**: Hand-walk. R1 seeds Feed events only as copies of `events[0]` (a single tone), and no check reads line tone.
**Preconditions**: Common setup, `opening` state, then the four-tone Feed fixture. Default mode.
**Steps**:
1. Confirm that the Feed shows 4 `.wm-feed-line` rows, carrying the classes `red`, `green`, `notice` and `dim`.
2. For each row, read the computed colour of the row's `.wm-feed-x` text and of its `.wm-feed-t`. Read the composited ratio of each.
3. Capture `if-028-feed-tones-default.png`.
**Expected Result**: `.wm-feed-x` text: `red` -> `rgb(255, 107, 85)`, `green` -> `rgb(125, 224, 138)`, `notice` (event tone `amber`) -> `rgb(226, 246, 238)`, `dim` -> `rgb(184, 216, 207)`. `.wm-feed-t` is `rgb(184, 216, 207)` on all 4 rows. No run is `rgb(53, 80, 74)`, and every run is >=4.5:1.
**Pass Criteria**: All 8 colour reads match the expected values exactly, and all 8 ratios are >=4.5.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-028-07 — High contrast does not regress

**AC covered**: AC-2 ("high contrast does not regress")
**Coverage**: Hand-walk. R1 runs its 11-state colour sweep in default mode only. High contrast is exercised only for IF-029 and IF-030. The probe's `INK_FAINT` literal is the default value, so it would not detect the HC Ink Faint `rgb(109, 147, 138)`.
**Preconditions**: Common setup, `opening` state with the four-tone Feed fixture, then high contrast on. Afterwards, the Review fixture with high contrast still on.
**Steps**:
1. With HC on, repeat the IF-028-02 reads on every `.wm-feed-t`.
2. Repeat the IF-028-03 Part A reads on the axis, and the IF-028-05 read on `NOW`.
3. Repeat the IF-028-06 reads on the four tone rows.
4. Run the `body` sweep from IF-028-04. Filter the runs in `rgb(53, 80, 74)` or `rgb(109, 147, 138)`, and the runs below 4.5:1.
5. Capture `if-028-hc.png`.
6. Apply the Review fixture with HC still on. Repeat step 2 for the axis, recording `NOW` as in IF-028-03. Capture `if-028-hc-review.png`.
7. Turn HC off and confirm that the IF-028-02 Feed time colour returns to `rgb(184, 216, 207)`.
**Expected Result**: Under HC, the Feed times and the `-24H`/`-12H`/`-6H` axis labels compute to HC Ink `rgb(226, 246, 238)`, each with a ratio >=4.5:1 and no lower than the same element's default-mode ratio. Live `NOW` stays `rgb(126, 240, 212)`. Tone rows: red, green and notice are unchanged from IF-028-06; `dim` and every `.wm-feed-t` are `rgb(226, 246, 238)`. The `body` sweep finds zero runs in either Ink Faint value and zero runs below 4.5:1. With HC off, the default colours return.
**Pass Criteria**: All of the following hold: Feed times and tick labels are `rgb(226, 246, 238)` under HC; each HC ratio is >= its default ratio and >=4.5; `NOW` is teal; the tone colours match; the Ink Faint count is 0 for both values; the count below 4.5:1 is 0; and the colour reverts when HC is turned off.
**Actual Result**:
**Pass/Fail**:

---

## Evidence README lines to fill (fresh R1 folder)

- Build: HEAD `131a5c1`, "final sprint build".
- AC-1: R1 IF-028 11/11 result (IF-028-01). Feed time and axis colour, alpha and min ratio (IF-028-02, -03). Body-sweep counts, header and nav included (IF-028-04).
- AC-2 (recorded separately): `NOW` colour live (IF-028-05). Four-tone reads (IF-028-06). HC reads and ratios against default (IF-028-07).
- Captures: `state-*.png` (R1), `if-028-feed-times-default.png`, `if-028-axis-live.png`, `if-028-axis-review.png`, `if-028-feed-tones-default.png`, `if-028-hc.png`, `if-028-hc-review.png`.
- Teardown: dev server stopped, port 4200 free, headless browser closed.
