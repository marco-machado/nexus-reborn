# IF-025 results: Each Influence action prints its effect as visible text

- **Story type**: UI. **Gate**: BLOCKING. Sprint 11 `/team-qa` Phase 5, executed 2026-10-24 by Claude (headless).
- **Build**: HEAD `131a5c1`, final sprint build. `git status --short src` shows only test files not imported by the app (`src/game/tutorial.test.ts`, `src/state/tutorialStore.test.ts`, `src/game/world.noRoute.test.ts`).
- **Cases**: `production/qa/test-cases/if-025-each-influence-action-prints-its-effect-cases.md`
- **Harness**: `handwalk.mjs` in this folder (lines 22-367 of `production/qa/evidence/sprint-011/probe.mjs` copied verbatim, plus `STATES.opening` from its line 371). Headless Chrome for Testing via playwright-core, 1280x720, DPR 1, against the already-running dev server on http://localhost:4200 (not started or stopped by this run). Final run: `run.log` (20 PASS, 1 FAIL, "no console or page errors"). Per-state JSON (M results, `clipped('.wm-right')`) and PNGs sit next to it.
- **Card gate**: every measurement logged `card absent; after: no card` (the probe's `dismissCard()` worked; UNDERSTOOD never needed).

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| TC-01 | AC-1, AC-2 UNAFFORDABLE | R1 (`r1-probe/run.log` lines 103-110) | All 8 lines PASS, e.g. line 109: `PASS IF-025 scale 125: each action prints its effect below the button // [{"text":"-12 UNREST OVER 6H","below":true,"visible":true,"overlap":false,"disabled":true},{"text":"+8 CONTROL OVER 12H",...},{"text":"WAIVE INTEL GATE // +24H EXPIRY",...}]`; line 110: `PASS IF-025 scale 125: right column does not clip`. Same three texts at 90/100/110. Log line 154: `no console or page errors`. | PASS |
| TC-02 | AC-1 rendered text | Hand-walk (`if-025-tc02-100.json/.png`) | All 3 effect spans hold one text node (nodeType 3) equal to `-12 UNREST OVER 6H`, `+8 CONTROL OVER 12H`, `WAIVE INTEL GATE // +24H EXPIRY`; span outside the `<button>`; button innerText e.g. `1 STABILIZE\n8P\nUNAFFORDABLE` (no effect); aria-label e.g. `1 STABILIZE // 8 PTS // -12 UNREST OVER 6H // UNAFFORDABLE`; `title` null; `aria-hidden="true"`. | PASS |
| TC-03 | AC-1, AC-2 UNAFFORDABLE | Hand-walk (`if-025-tc03-<scale>[-row].json/.png`, 12 captures) | Europe contracts = 1, so Expedite expected UNAFFORDABLE. 90/100/110/125: statuses `UNAFFORDABLE/UNAFFORDABLE/UNAFFORDABLE`, all disabled, every row meets the row pass rule, `clipped` `[]`. | PASS |
| TC-04 | AC-1, AC-2 CLEAR vs UNAFFORDABLE | Hand-walk (`if-025-tc04-*`, 12 captures) | Header `INFLUENCE 8 PTS`, selected `eu`. 90/100/110/125: `CLEAR/UNAFFORDABLE/UNAFFORDABLE`, disabled `[false,true,true]`, all rows meet the row pass rule, `clipped` `[]`. | PASS |
| TC-05 | AC-2 ACTIVE / COOLDOWN / NO TARGET, AC-1 | Hand-walk (`if-025-tc05-*`, 12 captures + 3 grayscale) | Real `page.click` on STABILIZE; header `INFLUENCE 22 PTS`; store influence 22, paused true, one pending stabilize spend; clock t unchanged across the sweep (95.72 before and after). 90/100/110/125: `ACTIVE/COOLDOWN 12H/NO TARGET`, all disabled, `overlap` false on every row, all rows meet the row pass rule, `clipped` `[]` (no spill, no textoverlap). Grayscale captures viewed: all three status words and effect lines readable. | PASS |
| TC-06 | AC-1, Expedite wrap edge | Hand-walk (`if-025-tc06-<scale>.json/.png`) | Expedite `CLEAR`. Lines: 90 = 1, 100 = 1, 110 = 1, 125 = 1. scrollWidth 282 = clientWidth 282 at every scale; scrollHeight = clientHeight (11/12/13/15); span left/right = wrap left/right (968.5 / 1250.6); no next sibling inside the wrap; row pass rule met. | PASS |
| TC-07 | AC-1 edge: OPEN CONTRACTS reachable at 125 | Hand-walk (`if-025-tc07.json`, `-top`, `-sector-end`, `-ops-end` PNGs) | Sector scroller: scrollHeight 452 / clientHeight 247 / `auto`; wheel moved scrollTop 0 -> 205 (max 205); at max the last effect line (306-321) lies inside the scroller (119-366). Ops list: 2 rows, scrollHeight 173 / clientHeight 94 / `auto`; head `OPEN CONTRACTS 1 / 2` and row 1 in view at scroll 0; row 1 (GLASS VEIL, 66 px) fully inside. **Row 2 (NEON GARDEN) is 101 px tall in a 94 px list**: at max scroll (79) the row spans 413-514 vs list 420-514, so its top 7 px are cut. Expected: every row fully inside at some scroll position and at max scroll. The cut part is frame only: row 2 border-top 1 px + padding-top 7 px, first text line top 423 (inside), `cutText` `[]`; all row-2 text is readable in `if-025-tc07-ops-end.png`. | FAIL |
| TC-08 | AC-2 SECTOR LOCKED (N/A), Antarctica edge | Hand-walk (`if-025-tc08.json`, `-100.png`, `-125.png`) | With `selected: 'an'`: 0 `.wm-act-wrap`, 0 `.wm-act`, `.wm-actions` childElementCount 0 at 100 and 125; none of `SECTOR LOCKED` / the three effect strings in the document; `clipped` `[]` at both scales; back on `eu`, 3 rows. Real pointer click on the Antarctica SECTORS row left `selected` = `eu` (see Notes). | PASS |

**AC-2 `SECTOR LOCKED`**: N/A per Phase 5 ruling. No actions are offered for a locked sector (`influenceActionsFor` returns `[]`); covered by TC-08 (0 rows, no `SECTOR LOCKED` text anywhere).

## Per-AC

- **AC-1** (effect printed as visible text under the button, not only title/aria-label, no clip at 90/100/110/125): **PASS** for the action rows (TC-01 to TC-06; TC-07 sector-scroller part). The story's QA edge case "OPEN CONTRACTS still scrolls with every row reachable at 125%" **FAILS the case's criterion** (TC-07: a 101 px contract row cannot be fully shown in the 94 px list; its text is all reachable and readable, only 7 px of frame is cut).
- **AC-2** (status never overlaps the effect; UNAFFORDABLE, CLEAR, ACTIVE, COOLDOWN 12H, NO TARGET): **PASS** (TC-01, TC-03, TC-04, TC-05). `SECTOR LOCKED`: N/A, covered by TC-08.

## Notes

1. TC-07 detail for triage: the cut row is a GENERATED contract row with four meta chips (GENERATED / CHANCE / ETA / EXPIRY) stacked in its right column, which makes it 101 px tall at 125. The ScrollBox height at 125 is 94 px. Severity proposal for qa-lead: low (frame-only cut, no text lost); the story's own wording is "every row reachable", which a lenient reading would meet. Ruling needed on whether the case's "fully into view" criterion stands.
2. TC-08 step 1: the Antarctica SECTORS row is `aria-disabled="true"` with no click handler, so a real pointer click does not focus it (selected stayed `eu`). Playwright's `page.click` refuses it as not enabled; the script used `page.mouse.click` at the row centre. Antarctica's empty sector panel is reachable only by setting the store, which further confirms `SECTOR LOCKED` cannot appear on screen.
3. TC-05: after the real click, STABILIZE keeps keyboard focus and draws its focus ring (visible as a dashed outline in the grayscale capture); it does not cover the effect line (`onTop` true).
4. TC-06: Expedite's effect does not wrap at any scale (1 line, 282 px, exactly the wrap width).
5. Teardown (cases file precondition 11) not run by this executor: the Phase 5 brief says not to stop the shared dev server. The headless browser is closed at the end of the script.
6. Cases file precondition 10 asks for a folder README and for the AC-2 line in "the evidence README"; this executor is authorised to write only this file, so the HEAD/build statement and the AC-2 line are recorded above.
7. Script fixes made during the run (no app change): added `STATES.opening` (not inside lines 22-367); replaced `page.click` on the aria-disabled Antarctica row with a pointer click; added row-rect and cut-text diagnostics to TC-07.

## Story verdict

**FAIL** (one case fails its written criterion: TC-07, OPEN CONTRACTS row 2 cut by 7 px of frame at 125). Every action-row check for AC-1 and AC-2 passes. If qa-lead rules that "reachable" means every row's text can be scrolled into view, TC-07 becomes PASS and the verdict becomes PASS WITH NOTES.

## qa-lead ruling (orchestrator, 2026-10-24)
TC-07 is resolved as **PASS WITH NOTES**. The governing criterion is the story's edge case, "OPEN CONTRACTS still scrolls with every row reachable at 125%" (production/epics/interface/story-025-each-influence-action-prints-its-effect.md:73). Every row's text scrolls into view and reads in full (if-025-tc07-ops-end.png, cutText empty). The cases file's "fully into view" criterion is stricter than the story.
Observation, not a defect: at 125% the generated row NEON GARDEN is 101 px tall and the list only 94 px, so the top 7 px of the row's frame (border and padding) can never be seen at once with the rest of the row.
Story verdict: **PASS WITH NOTES**.
