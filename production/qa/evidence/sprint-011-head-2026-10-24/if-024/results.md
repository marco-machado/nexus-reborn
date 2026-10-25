# IF-024 — RESOURCE POOL becomes INTEL — Phase 5 results

**Story type**: UI | **Gate**: BLOCKING (qa-lead sign-off)
**Build**: HEAD `131a5c1`. The only uncommitted `src/` changes are three test files that the app does not import.
**Server**: the existing dev server on http://localhost:4200. I did not start or stop it.
**Cases**: `production/qa/test-cases/if-024-resource-pool-becomes-intel-cases.md`
**Hand-walk script**: `handwalk.mjs` in this folder. It copies lines 21-332 of `production/qa/evidence/sprint-011/probe.mjs` verbatim: the playwright-core and Chrome for Testing launch, `HELPERS`, `fresh`, `dismissCard`, `setScale` and `pause`. It runs headless at 1280x720. Its output is in `run.log` (0 fails, `errors: none`).
**R1 source**: `../r1-probe/run.log` (152/152 PASS) and the R1 PNGs in `../r1-probe/`.
**Setup observed**: `dismissCard()` was enough to dismiss the first-visit card (the UNDERSTOOD fallback never ran). Baseline line: `baseline store {"intelLevel":1,"intelProgress":25} panel "INTEL LEVEL 1 PROGRESS 25 / 100" hdr ["CREDITS128,450 CR","INFLUENCE0 PTS","INTEL1","ROSTER8 / 8"]`.
**Visual review**: I built 2x crops of the INTEL panel from every capture listed below (headless contact sheet) and checked each one by eye.

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| IF-024-01 | AC-1 | R1 | `r1-probe/run.log` lines 90/93/96/99 read `PASS IF-024 scale 90: INTEL panel // "INTEL LEVEL 1 PROGRESS 25 / 100"`, and the 100, 110 and 125 lines print the same string. All 4 scales print the exact string. None of the 4 contains CREDITS, INFLUENCE or ROSTER. The hand-walk re-read (`INFO scale N panel ...`) matches at all 4 scales. | PASS |
| IF-024-02 | AC-1 (no clip) | R1 + eye | `r1-probe/run.log` lines 91/94/97/100 read `PASS IF-026 world network scale {90,100,110,125}: nothing clips`. The hand-walk re-run also gives `clip 0` at all 4 scales. In all 4 of `r1-probe/if-023-024-world-{90,100,110,125}.png`, the INTEL title, `LEVEL 1`, `PROGRESS 25 / 100` and the bar are whole: no ellipsis, no cut glyphs, nothing overlapped, nothing past the viewport edge. | PASS |
| IF-024-03 | AC-1 | Hand-walk | `.wm-intel-panel .panel-title` = `INTEL`. `document.body.innerText` includes "RESOURCE POOL" = `false`. `rg -n "RESOURCE POOL" src` = 0 matches. | PASS |
| IF-024-04 | AC-1 | Hand-walk | `.wm-bottom` has 4 panels. DOM order = `["TIME CODE","TIMELINE","FEED","INTEL"]`. Order by x = the same. INTEL box is x 1021, y 536, 243x124, the right-most panel. In `if-024-strip-100.png`, INTEL is at the bottom right. | PASS |
| IF-024-05 | AC-1 / AC-1 Edge | R1 | `r1-probe/run.log` lines 89/92/95/98: each detail line reads `header ["CREDITS128,450 CR","INFLUENCE0 PTS","INTEL1","ROSTER8 / 8"]` (detail line read by eye at all 4 scales). The hand-walk re-read of `.wm-resource` gives the same 4 readouts at all 4 scales. The INTEL readout = `INTEL1`. | PASS |
| IF-024-06 | AC-1 Edge / AC-2 | Hand-walk + eye | Step 1: panel `INTEL LEVEL 1 PROGRESS 0 / 100`, header `INTEL1`, bar `<i style="width: 0%;">`, no page errors. Step 3: store `{"intelLevel":2,"intelProgress":0}`, panel `INTEL LEVEL 2 PROGRESS 0 / 100`, header `INTEL2`. `100 / 100` never appears. Captures `if-024-progress-0.png` and `if-024-wrap-exact-100.png` show the same text, and the bar is empty (see Note 1). | PASS |
| IF-024-07 | AC-2 | R1 (+ hand re-read) | `r1-probe/run.log` line 102 reads `PASS IF-024 level and progress agree with the header // {"pool":"INTEL LEVEL 2 PROGRESS 15 / 100","hdr":"INTEL2"}`. These are the exact expected values. The hand-walk ran the full 90 + 25 path and got store `{"intelLevel":2,"intelProgress":15}`, panel `INTEL LEVEL 2 PROGRESS 15 / 100`, header `INTEL2`. That confirms a real level-up, not the optional-chaining no-op the case warns about. | PASS |
| IF-024-08 | AC-2 / AC-1 Edge | Hand-walk + eye | 90 + `awardIntel(250)` gives store `{"intelLevel":4,"intelProgress":40}`, panel `INTEL LEVEL 4 PROGRESS 40 / 100`, header `INTEL4`. `if-024-multi-level.png` shows LEVEL 4, 40 / 100, and the bar at about 40%. | PASS |
| IF-024-09 | AC-1 (no clip) after AC-2 | Hand-walk + eye | 8 of 8 captures have clip count 0 and the exact string: `INTEL LEVEL 2 PROGRESS 15 / 100` at 90/100/110/125, and `INTEL LEVEL 10 PROGRESS 99 / 100` at 90/100/110/125. Every panel child (title, LEVEL, value, PROGRESS, value, bar) sits inside the panel box, with scrollWidth = clientWidth. The panel's right edge is 1265 and its bottom is at most 660, inside 1280x720. All 8 PNGs `if-024-level{2,10}-{90,100,110,125}.png` show the title, both rows and the bar whole, including the two-digit `10`. | PASS |

## Per-AC

- **AC-1** (INTEL title, level, `n / 100`, no Credits/Influence/Roster, nothing clips at 90/100/110/125): **PASS**. Cases IF-024-01, -02, -03, -04, -05 and -09 pass, and so does the AC-1 Edge case IF-024-06.
- **AC-2** (guard: after a level-up, progress wraps below 100, the level equals the header Intel, and the header stays in step): **PASS**. Cases IF-024-06 (exact-100 boundary), -07 and -08 pass.

## Notes

1. **Not an AC failure.** `if-024-progress-0.png` shows a sliver of about 1 px at the left end of the bar, even though the inline style is `width: 0%`. `src/ui/ui.css:200` gives `.segbar > i` the rule `transition: width 0.25s ease-out`. The script took the capture 200 ms after progress went from 25 to 0, which is inside the 250 ms transition. The capture after the exact-100 wrap shows the bar fully empty. This is a capture timing artifact, not a rendering defect.
2. The case file's Common setup and Close-out say to start and stop the dev server. Per the Phase 5 instructions, I did neither: the server was already running, and I left it running.
3. The case file names `production/qa/evidence/sprint-011/` as the evidence output. Per the Phase 5 instructions, the HEAD-run evidence is in `production/qa/evidence/sprint-011-head-2026-10-24/if-024/` instead.
4. The script closed its own headless browser. I did not use the user's Chrome or any headed window.

## Story verdict

**PASS**. AC-1 PASS, AC-2 PASS, 9 of 9 cases PASS, 0 FAIL, 0 BLOCKED.
