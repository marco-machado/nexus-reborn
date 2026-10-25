# IF-031 — Feed rows have a 24 px hit area: execution results

**Story type**: UI | **Gate level**: BLOCKING
**Cases**: `production/qa/test-cases/if-031-feed-rows-have-a-24-px-hit-area-cases.md`
**Build**: HEAD `131a5c1` (uncommitted src changes are three test files the app does not import)
**Run**: 2026-10-24, `/team-qa` Sprint 11 Phase 5, qa-tester (Claude)
**Environment**: dev server `http://localhost:4200/` (already running, started and stopped by the orchestrator, not by this run). Headless Chrome for Testing (chromium-1247) through `playwright-core`, viewport 1280x720, text scale 100%, high contrast off (after `localStorage.clear()`).
**Script**: `if031.mjs` in this folder. Launch, HELPERS and fixtures are copied from `production/qa/evidence/sprint-011/probe.mjs` lines 22-367; only `OUT` changed to point here. Fixture `opening` (`fresh()`, `dismissCard()`, `pause()`); the orientation card was gone after `dismissCard()` (no "card still up" line in the log). Then the TC-03 step 1 seed (14 events, ids 9100-9113, sectors na/sa/eu/af/as/oc, ids 9103 and 9110 long).
**Log**: `run.log` in this folder (`DONE 0 fail(s)`, `errors: []`).
**Ruling applied (orchestrator)**: "marks the event read" means `unread` goes to 0 and `FEED CLEAR` shows. `markRead` clears every unread event, not only the clicked one. TC-05 checks it that way, as the case is written.

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| IF031-TC-01 | AC-1 | R1 probe (`r1-probe/probe-output.txt:139`) | `PASS IF-031 every Feed row >= 24 px high // 14 rows, min h 24`. n = 14, min h = 24. `r1-probe/if-031-035-targets.png` exists and measures 1280x720 (sips). It shows the Feed with rows. | PASS |
| IF031-TC-02 | AC-2 (no overlap) | R1 probe (`r1-probe/probe-output.txt:140`) | `PASS IF-031 Feed rows do not overlap` | PASS |
| IF031-TC-03 | AC-1, AC-2 (no overlap) | Hand-walk | 14 rows. Short rows are 24 px high and the two long rows 39 px. Min height 24; max short height 24; long rows at index 3 and 10 are both 39 > 24. Rows start 25 px apart (24 + 1 px gap); 0 overlapping pairs. In each long row the `.wm-feed-x` text has scrollHeight 33 = clientHeight 33, so nothing is clipped. Its bottom edge (690.6 / 880.6) is inside the row's bottom (693.6 / 883.6). In `if-031-wrapped-rows-1.png` and `-2.png` the long text wraps onto 3 lines, all of them inside the row. | PASS |
| IF031-TC-04 | AC-2 (scrolls, newest reachable) | Hand-walk | List scrollHeight 379 > clientHeight 73. First row: `SHORT LINE 13`, fully inside the list (579.6-603.6 in list 579.6-652.6). Scrolled to the bottom (scrollTop 306): last row `SHORT LINE 0` at 628.6-652.6, fully visible (`if-031-feed-scrolled-bottom.png`). A mouse wheel of -2000 over the list brought it back to scrollTop 0 with `SHORT LINE 13` fully visible (`if-031-feed-top.png`). Step 6: after appending 9114, 14 rows with `SHORT LINE 14` first, at scrollTop 0 and visible. Step 7: scrolled to the bottom, appended 9115, scrolled to the top: 14 rows, `SHORT LINE 15` first and fully visible, oldest shown `SHORT LINE 2`. | PASS |
| IF031-TC-05 | AC-2 (click focuses sector, marks read) | Hand-walk | **Pointer click** on `SHORT LINE 2` (aria "14:34 SHORT LINE 2 // FOCUS EUROPE"). Before: selected `na`, unread 3, badge `3 UNREAD`, readout NORTH AMERICA. After: selected `eu`, unread 0, badge `FEED CLEAR`, phase `world`. The focus panel tag (`.wm-inset-tag`) and the pressed sector-list row both read EUROPE (`if-031-row-click-focused.png`). **Enter key** on `SHORT LINE 4` (aria "... // FOCUS ASIA"). Before: `na` / 3 / `3 UNREAD`. After: `as` / 0 / `FEED CLEAR` / `world`, readout ASIA. | PASS |
| IF031-TC-06 | AC-1 (hit area) | Hand-walk | At scroll top, 2 rows sit fully inside the 73 px list. 6/6 top+1, middle and bottom-1 hit-tests returned their own row. The 1 px gap midpoint returned `button.wm-feed-line`, one of the two neighbours (the case allows this), never a third row. Step 4: a real click at top+1 of `SHORT LINE 11` (y 630.6; the row above is `SHORT LINE 12`/na) selected `oc` and the readout reads OCEANIA (expected OCEANIA). Step 5: a real click at bottom-1 of `SHORT LINE 13` (y 602.6; the row below is `SHORT LINE 12`/NORTH AMERICA) selected `sa` and the readout reads SOUTH AMERICA (expected SOUTH AMERICA, not the neighbour's sector). Before each click the selection was reset to `na`. | PASS |

## Per-AC

- **AC-1** (every row box >= 24 px at 1280x720, 100%): PASS. TC-01, TC-03 and TC-06 pass.
- **AC-2** (with 14 events the Feed scrolls and the newest row is reachable; rows do not overlap; a click focuses the sector and marks the event read): PASS. TC-02 to TC-05 pass.

## Notes (not AC findings)

1. **Ruling recorded.** `markRead` (`src/state/worldStore.ts:1072`) sets `unread: 0`, so a click on any row clears every unread event, not just the one clicked. TC-05 passes under the orchestrator's ruling that this is what "marks the event read" means.
2. **Case text, not the app.** TC-04 preconditions say the newest event (`t = 780`) prints as `00:13`. The build prints `14:45` (`hhmm` adds `BASE_SEC`; aria "14:45 SHORT LINE 13 // FOCUS SOUTH AMERICA"). The pass criterion only names the row text `SHORT LINE 13`, which matched. The case's time example should be corrected.
3. **Feed viewport.** At 1280x720 the Feed list's visible height is 73 px (clientHeight). About 3 short rows fit, and only 2 fit fully at scroll top. Every row is still reachable by scrolling, so the AC holds. This is a density observation for UX.
4. **Bottom fade.** In the wrapped-row screenshots, the list's bottom scroll fade and its chevron hint dim the third wrapped line of a long row that sits at the list's lower edge. The text is inside the row (measured) and readable. Recorded for UX only.
5. **Script fixes during the run** (script only, app untouched). The first pass read the sector readout from `.wm-sector-name`, which is the first row of the sector list (always NORTH AMERICA). That produced 4 false FAILs (TC-05 x2, TC-06 x2) even though `selected` was correct each time. It also asserted the `00:13` time from note 2, which the pass criteria do not include. The script now reads `.wm-inset-tag` and the `aria-pressed="true"` sector row, and checks only the row text. The final run is `DONE 0 fail(s)`.
6. Page errors and console errors during the run: none (`errors: []`).
7. Closing: the headless browser was closed by the script (`browser.close()`). This run did not start or stop the dev server, as instructed.

## Evidence

- `run.log`, `if031.mjs`
- `if-031-wrapped-rows-1.png`, `if-031-wrapped-rows-2.png`, `if-031-feed-scrolled-bottom.png`, `if-031-feed-top.png`, `if-031-row-click-focused.png`: all 1280x720, headless
- R1: `../r1-probe/probe-output.txt` lines 139-140, `../r1-probe/if-031-035-targets.png` (1280x720)

## Story verdict

**PASS WITH NOTES**: all 6 cases pass and both ACs pass. The notes are the recorded mark-read ruling, a wrong time example in the case text, and two UX density/fade observations.
