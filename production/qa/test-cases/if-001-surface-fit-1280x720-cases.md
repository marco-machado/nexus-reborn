# IF-001 manual test cases: every surface fits 1280x720 at every text scale

- **Story**: `production/epics/interface/story-001-every-surface-fits-1280-720-at-every-text-scale.md` (AC1, AC20)
- **Story type**: UI. **Evidence**: `production/qa/evidence/smoke-2026-10-19/if-001/` (smoke re-run, reviewed here). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude (review). Sign-off: qa-lead.

## Execution mode

Review only. The Sprint 9 smoke check re-ran `sweep.mjs` on today's tree. Do not re-run it. Review `run.log`, `sweep-result.json` and the PNGs in the smoke folder. No dev server is needed.

Shared preconditions (record the results in TC-01 Actual):

1. `diff production/qa/evidence/if-001/sweep.mjs production/qa/evidence/smoke-2026-10-19/if-001/sweep.mjs` prints nothing, so the smoke ran the signed-off script unchanged.
2. Find the tested revision in `production/qa/smoke-2026-10-19-sprint-009.md`. If the record names none, write "revision not recorded" and use the commit that added it: `git log -1 --format=%H -- production/qa/smoke-2026-10-19-sprint-009.md`. Then `git log --oneline <rev>..HEAD -- src/` must print nothing. If it prints commits, stop. The captures do not show the current tree, and the sweep must be re-run fresh into `production/qa/evidence/team-qa-2026-10-19-s9/if-001/`.
3. Fixture label: the sweep reaches Debrief through a mission (`run.log`: `mission won`). Read the header of `sweep.mjs` and record whether that win was played or seeded. Seeded evidence must say so (`docs/mission-playbook.md`, Rules of the run).

---

## IF-001-TC-01: Sweep totals are clean at every surface and scale

**ACs**: AC1
**Preconditions**: Shared preconditions 1 to 3 met.
**Steps**:
1. Open `production/qa/evidence/smoke-2026-10-19/if-001/run.log`.
2. Find the line `<surface> @<scale>%: ok (...)` for each surface (menu, settings, world-network, research, brief, assembly, mission-hud, pause, pause-settings, debrief) at each scale (90, 100, 110, 125).
3. Open `sweep-result.json` and total its clip findings and its overlap findings across all 40 surface/scale entries.
4. Read the last two lines of `run.log`.

**Expected Result**: There are 40 `ok` lines, none missing and none with any other status. The clip total is 0 and the overlap total is 0. If any intersection is listed, it must involve a declared overlay (AC1: "except declared overlays (Settings, Balance, pause, toasts)"). The renderer line ends `| console errors 0` and the final line reads `ALL SURFACES CLEAN`. Copy any renderer messages verbatim into Actual. Today's log lists `THREE.WebGLRenderer: Context Lost.` twice. These lines are not an AC1 criterion; record them only.
**Pass Criteria**: 40 of 40 entries are `ok`, with 0 clips, 0 undeclared overlaps and the final line `ALL SURFACES CLEAN`.
**Actual Result**:
**Pass/Fail**:

## IF-001-TC-02: Visual review shows no cut-off text and no undeclared overlap

**ACs**: AC1
**Preconditions**: TC-01 run.
**Steps**:
1. Confirm that the smoke folder holds `<surface>-1280x720-scale<n>.png` for all 40 surface/scale pairs, plus `mission-hud-1280x720-scale125-slot4.png`.
2. Open each PNG at 100% zoom. Check the last glyphs of every label, button and table cell, and every panel edge.
3. In the settings, pause, pause-settings and mission-hud captures, name the layer that is a declared overlay.

**Expected Result**: AC1 holds: "no element's text is cut off by its container, no element's bounding box intersects another's except declared overlays (Settings, Balance, pause, toasts)". Any other intersection is a finding. That includes a save-failure notice, which is not on the declared list (see the IF-010 ruling).
**Pass Criteria**: 41 PNGs show 0 cut-off text and 0 undeclared intersections.
**Actual Result**:
**Pass/Fail**:

## IF-001-TC-03: Assembly and Debrief overflow at 125% is reached by scrolling

**ACs**: AC1
**Preconditions**: TC-01 run.
**Steps**:
1. In `run.log`, find the `assembly @125%` and `debrief @125%` lines and their indented `scrolled <selector> (<n>px y, <k> stops)` lines.
2. Open `assembly-1280x720-scale125.png` and `debrief-1280x720-scale125.png`. Find the scroll container that the log names.

**Expected Result**: Both lines read `ok` with at least 2 scroll positions. Each has at least one `scrolled` line with n > 0. Today's Debrief line reads `scrolled .db-rows (113px y, 1 stops)`. The captures show the container clipped at its own scroll edge, not text cut by a fixed box (AC1: "scrolled overflow remains reachable").
**Pass Criteria**: Assembly and Debrief at 125% each read `ok` and each has at least one scrolled container with n > 0.
**Actual Result**:
**Pass/Fail**:

## IF-001-TC-04: A window below the minimum scrolls and does not compress

**ACs**: AC1
**Preconditions**: TC-01 run.
**Steps**:
1. Find the `sub-minimum` lines in `run.log`.
2. Open `submin-debrief-1100x650-scale125.png` and `submin-debrief-1100x650-scale125-scrolled.png` next to `debrief-1280x720-scale125.png`.
3. Compare panel widths and the content at the right and bottom edges.

**Expected Result**: `run.log` reads `sub-minimum {"appRoot":[1280,720],"viewport":[1100,650],"scroll":[1280,720]}` and then `sub-minimum ok`. The unscrolled capture shows the 1280x720 layout cut off at the viewport edge. The scrolled capture shows the rest. Panel widths match the 1280x720 capture (AC1: "Smaller-than-minimum windows scroll and do not compress panels").
**Pass Criteria**: appRoot equals [1280,720] in a 1100x650 viewport, the scroll extent is at least appRoot, and no panel is narrower than in the 1280x720 capture.
**Actual Result**:
**Pass/Fail**:

## IF-001-TC-05: The AC20 click-through record names every unexercised screen

**ACs**: AC20
**Preconditions**: The click-through record is `production/qa/evidence/if-001/README.md`, section "Browser coverage" ("Partial run of `docs/click-through.md` at 1280x720").
**Steps**:
1. List every step and screen in `docs/click-through.md`.
2. Mark each one, from the README, as exercised or as named unexercised.
3. Read the README result line and the closing AC20 line.

**Expected Result**: Every click-through step appears in one of the two lists. The README reads "The unexercised click-through steps above remain open; a partial run is not a pass of them (AC20)". The result is stated as partial for the unexercised set (AC20: "the record names every unexercised screen or interaction. A partial run is not a pass of the unexercised set").
**Pass Criteria**: 0 click-through steps are missing from both lists.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. Cross-reference to IF-010. If qa-lead accepts the `SAVE FAILED // CAMPAIGN NOT FILED` notice covering orientation-card text, then AC1's declared-overlay list (Settings, Balance, pause, toasts) needs the write-failure notice added, or a recorded exception. Otherwise, TC-02 fails on any capture that shows it.

Nothing else needs a ruling.
