# IF-028 — Feed times and Timeline axis move off Ink Faint — results

**Story type**: UI | **Gate**: BLOCKING (qa-lead sign-off)
**Cases**: `production/qa/test-cases/if-028-feed-times-and-timeline-axis-move-off-ink-faint-cases.md`
**Build**: HEAD `131a5c1`, "final sprint build" (uncommitted src changes are three test files the app does not import).
**Server**: the already-running dev server at `http://localhost:4200/` (not started or stopped by this run).
**Date**: 2026-10-24
**Hand-walk harness**: `handwalk.mjs` in this folder. It copies `production/qa/evidence/sprint-011/probe.mjs` lines 22–412 verbatim (playwright-core + Chrome for Testing, headless, 1280x720, HELPERS, `fresh` / `dismissCard` / `setHC` / `STATES` / `enter`), then the IF-028 reads. Output: `run.log`, `handwalk-output.txt`, exit 0, `ALL PASS`, 14/14 checks.
**Card**: `dismissCard()` worked. The log reads `card visible: false` after each `opening` entry, so the UNDERSTOOD fallback never ran. In `opening-card` the log reads `opening-card: card visible true`, measured 1.3 s after entry.
**Errors**: `PASS ALL no console or page errors` (hand-walk run). R1: `no console or page errors` (`r1-probe/run.log` line 154).

## Results

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| IF-028-01 | AC-1 | Covered by R1 check | `r1-probe/run.log` lines 5–55: 11 of 11 read `PASS IF-028 <state>: no text in Ink Faint`, for opening-card, opening, garrison-secure, garrison-strained, garrison-critical, pressure, crisis, review, failed, influence-note and intel2 (e.g. line 5 `PASS IF-028 opening-card: no text in Ink Faint`, line 55 `PASS IF-028 intel2: no text in Ink Faint`). All 11 `state-<name>.png` exist in `r1-probe/`. Line 154: `no console or page errors`. Run end: `ALL PASS`, `R1 exit 0`. | PASS |
| IF-028-02 | AC-1 | Hand-walk | `opening`, default mode (HC class false). 4 visible `.wm-feed-t`. Colours `{rgb(184, 216, 207)}`. Min alpha 1. Ratio min 12.68, max 12.68. All 4 measured. Capture `if-028-feed-times-default.png`. | PASS |
| IF-028-03 | AC-1 | Hand-walk | Part A (live): `-24H`, `-12H`, `-6H` each `rgb(184, 216, 207)`, alpha 1, 12.68:1. All 4 labels visible, with no clip or ellipsis. Part B (Review): the time code reads `REVIEW -6.0H` / `> GO LIVE` (`.wm-live.review`). The three ticks are `rgb(184, 216, 207)`, alpha 1, 12.68:1, no clip. `NOW` has `class=""` (no `.now`) and is `rgb(184, 216, 207)`, alpha 1, 12.68:1 (not Ink Faint). Captures `if-028-axis-live.png` and `if-028-axis-review.png`. | PASS |
| IF-028-04 | AC-1 | Hand-walk | `window.__probe.runs('body')`. `opening`: 221 runs, 14 under `.screen-head`, 6 under `.navtabs`, 0 in `rgb(53, 80, 74)`, 0 runs outside `.screen`, min ratio 6.42. `opening-card` (card up, after the fade): 235 runs, head 14, nav 6, Ink Faint 0, outside `.screen` 0, min 6.42. Capture `if-028-opening-card-sweep.png`. | PASS |
| IF-028-05 | AC-2 | Hand-walk | Live `opening`: one `.wm-tl-axis .now`, text `NOW`, `rgb(126, 240, 212)`, weight 700, 14.1:1. It differs from the Ink ticks (`rgb(184, 216, 207)`). | PASS |
| IF-028-06 | AC-2 | Hand-walk | Four-tone fixture: 4 `.wm-feed-line` rows (`dim`, `notice`, `green`, `red`). `.wm-feed-x`: red `rgb(255, 107, 85)` 6.9:1; green `rgb(125, 224, 138)` 11.89:1; notice `rgb(226, 246, 238)` 17.18:1; dim `rgb(184, 216, 207)` 12.68:1. `.wm-feed-t` on all 4 rows: `rgb(184, 216, 207)` 12.68:1. 8 of 8 colours match, 8 of 8 ratios are >=4.5, 0 in Ink Faint. Capture `if-028-feed-tones-default.png`. | PASS |
| IF-028-07 | AC-2 | Hand-walk | HC class `s-high-contrast` true. Feed times: 4, all `rgb(226, 246, 238)`, alpha 1, 17.18:1 against 12.68 default (each pair hc >= def). Ticks `-24H`/`-12H`/`-6H`: `rgb(226, 246, 238)`, alpha 1, 17.18:1 against 12.68 default. Live `NOW`: `.now`, `rgb(126, 240, 212)`, 14.1:1. Tones: red `rgb(255, 107, 85)` 6.9, green `rgb(125, 224, 138)` 11.89, notice `rgb(226, 246, 238)` 17.18 (all unchanged); dim `rgb(226, 246, 238)` 17.18; every `.wm-feed-t` `rgb(226, 246, 238)` 17.18. Body sweep: 220 runs, 0 in `rgb(53, 80, 74)`, 0 in `rgb(109, 147, 138)`, 0 below 4.5 (min 6.9). HC Review: the time code reads `REVIEW -…`; the ticks are `rgb(226, 246, 238)` 17.18:1; `NOW` has `class=""` and is `rgb(226, 246, 238)` 17.18:1. HC off: class false, and the Feed times are back to `{rgb(184, 216, 207)}`. Captures `if-028-hc.png` and `if-028-hc-review.png`. | PASS |

**AC-1** (IF-028-01 to -04): PASS. **AC-2** (IF-028-05 to -07, recorded separately): PASS.

## Notes

1. **Design question (Review `NOW`, per the qa-lead ruling)**. In Review mode the axis `NOW` loses `.now` and prints in Ink, not teal: `rgb(184, 216, 207)` at 12.68:1 in default mode, and `rgb(226, 246, 238)` at 17.18:1 under HC. It passes contrast. Whether Review `NOW` should stay teal is for design. AC-2 "NOW teal" was judged in Live mode (IF-028-05, PASS).
2. **Four-tone fixture timestamps**. All 4 seeded rows print `14:32`. The fixture computes `t: Math.max(0, s.t - (i + 1) * 3600)`. Early in a fresh operation `s.t` is below 1 h, so every row clamps to `t = 0`. This comes from the fixture, not the app, and it does not affect the colour reads.
3. **Feed scroll**. With 4 rows, the 4th row (`red`) sits partly under the Feed's bottom scroll cue in `if-028-feed-tones-default.png`. Its colours were read from computed style. Its ratio (6.9:1) uses the probe's `bgOf`, which ignores gradients and masks, so it is the ratio over the panel and does not account for the scroll-cue fade.
4. The R1 `review` state and this hand-walk both set `t = 30 h`, so the Review capture's date reads `2087.05.15`. That is expected from the fixture.
5. Teardown: the headless browser was closed by the script (`browser.close()`). The dev server on port 4200 was left running, as instructed.

## Story verdict

**PASS WITH NOTES**. All 7 cases PASS. Note 1 is an open design question (Review `NOW` in Ink), and does not fail any AC.
