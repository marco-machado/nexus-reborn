# IF-025 manual test cases: Each Influence action prints its effect as visible text

- **Story**: `production/epics/interface/story-025-each-influence-action-prints-its-effect.md` (AC-1, AC-2 guard)
- **Story type**: UI. **Gate**: BLOCKING (retained screenshot of each state touched). Plan priority: Nice to Have (`production/qa/qa-plan-sprint-011-2026-10-23.md`, IF-025).
- **Sources**: story `## Acceptance Criteria` and `## QA Test Cases` (check `influence-effect-lines`); QA plan Manual QA Checklist, IF-025 AC-1/AC-2; QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-025 row: "R1, E, refresh via R1").
- **Build under test**: HEAD `131a5c1`.
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude, headless. Sign-off: qa-lead.

## Why most cases are hand-walks

R1 (`production/qa/evidence/sprint-011/probe.mjs`, lines 697-715) checks IF-025 in **one** state: the `opening` fixture (Europe, Influence 0, all three actions disabled). It does not cover four of the five action states the story's QA case names: one action affordable, a cooldown, an `ACTIVE` spend, and Expedite with no target. It also leaves these unchecked:

- that the effect text equals `actionEffect(id)`. R1 checks only that the text is non-empty.
- whether the line is on screen. R1's `visible` test does not account for scroll position or occlusion. In the committed captures `if-025-actions-100.png` and `if-025-actions-125.png`, the orientation card is up and covers the left edge of the action rows. Expedite is below the fold at 100. At 125 only a sliver of the STABILIZE row shows.
- the Expedite wrap, the OPEN CONTRACTS scroll at 125, and Antarctica.

Only TC-01 is marked as covered by R1. Every other case is a hand-walk, run headless with the same harness.

## Shared preconditions

1. **Build**: `git rev-parse --short HEAD` prints `131a5c1`, and `git status --short src` prints nothing.
2. **Server and browser**: `npm run dev` is listening on port 4200. The browser is headless Chrome for Testing (`npx playwright-cli`, or the R1 harness) with a viewport of exactly 1280x720, device scale factor 1. Never use a headed window or the user's Chrome.
3. **Base fixture `opening`** (as in `probe.mjs` `STATES.opening`): `fresh()` (goto, clear `localStorage`, reload, `save.startNewOperation()`, `appStore.goto('world')`), then `dismissCard()` (`tutorialStore.markSeen('hint-worldmap')`), then `pause()` (`worldStore.setState({ paused: true })`). Re-inject the probe helpers (`install()`) after every `fresh()` and after every scale change.
4. **Card gate**: before any measurement, confirm that no visible element reads `WORLD NETWORK // ORIENTATION`. If one does, click `UNDERSTOOD` and re-check. Record which happened. A measurement taken with the card up does not count.
5. **Influence note**: in any fixture where Influence is 8 or more, call `tutorialStore.markSeen('hint-influence')` before the measurement, as the probe does at its IF-023 block. The note's copy is out of scope for this story.
6. **Text scale**: set it with `settingsStore.setTextScale(n)` for n in 90 / 100 / 110 / 125, then wait 250 ms.
7. **Expected effect strings** (from `actionEffect` in `src/ui/WorldMap.tsx:153` and `INFLUENCE_ACTIONS` in `src/game/influence.ts:40` at HEAD):
   - `1 STABILIZE`: `-12 UNREST OVER 6H`
   - `2 LOBBY`: `+8 CONTROL OVER 12H`
   - `3 EXPEDITE`: `WAIVE INTEL GATE // +24H EXPIRY`

   The story's Context example (`-2 UNREST OVER 6H`) is a per-step figure, not the printed string. The source of truth is `actionEffect`.
8. **Measurement routine M**: run this in the page after the state and scale are set:

   ```js
   [...document.querySelectorAll('.wm-act-wrap')].map((w) => {
     w.scrollIntoView({ block: 'center' })
     const btn = w.querySelector('.wm-act'), e = w.querySelector('.wm-act-effect'), st = w.querySelector('.wm-act-status')
     const b = btn.getBoundingClientRect(), r = e.getBoundingClientRect(), s = st.getBoundingClientRect()
     const sc = w.closest('.wm-sector-scroll').getBoundingClientRect()
     const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2)
     const cs = getComputedStyle(e)
     return {
       name: btn.querySelector('.wm-act-name').textContent.trim(), status: st.textContent, disabled: btn.disabled,
       label: btn.getAttribute('aria-label'), title: btn.getAttribute('title'),
       effect: e.textContent, ariaHidden: e.getAttribute('aria-hidden'), display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
       below: r.top >= b.bottom - 0.5,
       overlap: !(r.bottom <= s.top || s.bottom <= r.top || r.right <= s.left || s.right <= r.left),
       inView: r.top >= sc.top - 0.5 && r.bottom <= sc.bottom + 0.5 && r.left >= sc.left - 0.5 && r.right <= sc.right + 0.5,
       onTop: !!hit && e.contains(hit),
       ellipsis: cs.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1,
       w: Math.round(r.width), h: Math.round(r.height),
     }
   })
   ```

   Then run `window.__probe.clipped('.wm-right')` (the probe's clip, spill, text-overlap and box-overlap pass). Note that this pass skips text that is scrolled out of view. M scrolls each row into view, which closes that gap row by row.
9. **Row pass rule (used by TC-03 to TC-06)**: for every row, all of the following hold:
   - `effect` equals the expected string for that row (precondition 7)
   - `below`, `inView` and `onTop` are true
   - `overlap` and `ellipsis` are false
   - `display` is not `none`, `visibility` is `visible`, and `opacity` is `1`

   In addition, `clipped('.wm-right')` returns `[]`.
10. **Evidence**: save captures to `production/qa/evidence/sprint-011-head-2026-10-24/if-025/`, following strategy section 4 step 2. This is a new folder: do not write over the committed `sprint-011/` outputs. Save each M result as JSON next to its PNG. The folder's README names HEAD `131a5c1` and states "final sprint build".
11. **Teardown**: stop the dev server, confirm that nothing listens on port 4200, and close the headless browser.

---

## IF-025-TC-01: Opening state (Influence 0, all disabled): effect line below each button, four scales

**AC covered**: AC-1, plus AC-2 for the `UNAFFORDABLE` status
**Mode**: Covered by R1 probe check: `IF-025 scale <n>: each action prints its effect below the button` and `IF-025 scale <n>: right column does not clip`, for n = 90, 100, 110, 125 (8 checks)
**Preconditions**: Shared 1-3. R1 runs on HEAD into the new folder, per strategy section 4: `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`.
**Steps**:
1. Run R1 unchanged on HEAD.
2. In the new `probe-output.txt`, find the 8 IF-025 lines.
3. For each "prints its effect" line, read the JSON array.
4. Open `if-025-actions-90.png`, `-100.png`, `-110.png` and `-125.png` from the new folder.

**Expected Result**: All 8 lines read `PASS`. Each JSON array has 3 entries, and each entry has `"below":true,"visible":true,"overlap":false,"disabled":true`. The `text` values are `-12 UNREST OVER 6H`, `+8 CONTROL OVER 12H` and `WAIVE INTEL GATE // +24H EXPIRY`, in that order. The run reports zero console and page errors.
**Pass Criteria**: All 8 IF-025 probe lines are PASS, and the text values equal the three expected strings exactly. Note that this case does not prove the lines are on screen: the captures may show the orientation card or rows below the fold (see "Why most cases are hand-walks"). TC-03 covers that.
**Actual Result**:
**Pass/Fail**:

---

## IF-025-TC-02: The effect is rendered text equal to `actionEffect(id)`, not only in `title` / `aria-label`

**AC covered**: AC-1 ("prints its effect (the `actionEffect` text) as static visible text ... not only in `title` / `aria-label`")
**Mode**: Hand-walk
**Preconditions**: Shared 1-8. Fixture `opening`, text scale 100, card gate passed.
**Steps**:
1. Run M.
2. For each row, compare `effect` with the expected string (precondition 7).
3. For each row, read `label`. Confirm it has the form `<num> <NAME> // <cost> PTS // <effect> // <status>`, for example `1 STABILIZE // 8 PTS // -12 UNREST OVER 6H // UNAFFORDABLE`.
4. For each row, read `title` and `ariaHidden`.
5. Read the effect span's text node directly: `w.querySelector('.wm-act-effect').firstChild.nodeType === 3`, and the text node's `textContent` equals the expected string.
6. Read the button's own `innerText`, and confirm it does not contain the effect string. The effect must sit outside the button, on its own line.

**Expected Result**:
- `effect` equals `-12 UNREST OVER 6H`, `+8 CONTROL OVER 12H` and `WAIVE INTEL GATE // +24H EXPIRY`.
- Each span holds a DOM text node with that string.
- `label` contains the same effect string between `PTS // ` and ` // <status>`.
- `ariaHidden` is `"true"` (by design: the button's `aria-label` already carries the effect).
- The button's `innerText` does not include the effect string.
- `title` is either absent or, if present, is not the only place the effect appears.

**Pass Criteria**: All three rows have a visible DOM text node equal to the expected effect string, outside the `<button>`, and their `aria-label` keeps its full form.
**Actual Result**:
**Pass/Fail**:

---

## IF-025-TC-03: Opening state: each effect line is on screen and unobscured, four scales

**AC covered**: AC-1 ("visible ... without clipping at 1280x720 and text scales 90 / 100 / 110 / 125"), plus AC-2 for `UNAFFORDABLE`
**Mode**: Hand-walk (closes R1's on-screen gap)
**Preconditions**: Shared 1-9. Fixture `opening`, card gate passed at each scale. Record Europe's generated contracts first: `useWorldStore.getState().contracts.filter((c) => c.sector === 'eu').length`.
**Steps**:
1. Set the text scale to 90.
2. Run M and `clipped('.wm-right')`.
3. Scroll each row into view in `.wm-sector-scroll` and capture the viewport: `if-025-tc03-<scale>-<row>.png` (3 captures per scale).
4. Repeat steps 1-3 at 100, 110 and 125.

**Expected Result**: At each scale, the statuses read `UNAFFORDABLE`, `UNAFFORDABLE` and `UNAFFORDABLE` (Expedite reads `NO TARGET` only if the recorded Europe contract count is 0, because `no-target` is checked before `unaffordable`). All three buttons are disabled. Every row meets the row pass rule (precondition 9). Each capture shows the button with its effect line in full beneath it, with no card or scroll indicator drawn over the line.
**Pass Criteria**: At all four scales, all 3 rows meet the row pass rule and `clipped('.wm-right')` is `[]` (12 rows in total, 12 captures).
**Actual Result**:
- 90:
- 100:
- 110:
- 125:

**Pass/Fail**:

---

## IF-025-TC-04: One action affordable (Influence 8): enabled and disabled rows both print their effect, four scales

**AC covered**: AC-1, plus AC-2 for an enabled `CLEAR` row next to disabled `UNAFFORDABLE` rows
**Mode**: Hand-walk
**Preconditions**: Shared 1-9. Fixture `opening`, then `useWorldStore.setState({ influence: 8 })` (selected stays `eu`), then `markSeen('hint-influence')`. Card gate passed.
**Steps**:
1. Confirm that the header reads `INFLUENCE 8 PTS`.
2. Set the text scale to 90.
3. Run M and `clipped('.wm-right')`, then capture each row (`if-025-tc04-<scale>-<row>.png`).
4. Repeat steps 2-3 at 100, 110 and 125.

**Expected Result**: STABILIZE is `CLEAR` with `disabled:false`. LOBBY is `UNAFFORDABLE` and disabled. EXPEDITE is `UNAFFORDABLE` and disabled (or `NO TARGET` under the TC-03 contract-count rule). At every scale, every row meets the row pass rule. The enabled row's effect line sits beneath its button exactly like the disabled rows' lines do.
**Pass Criteria**: At all four scales, all 3 rows meet the row pass rule and `clipped('.wm-right')` is `[]`.
**Actual Result**:
- 90:
- 100:
- 110:
- 125:

**Pass/Fail**:

---

## IF-025-TC-05: ACTIVE, COOLDOWN and NO TARGET together: effect shows and never overlaps the status word, four scales

**AC covered**: AC-2 (`ACTIVE`, `COOLDOWN nH`, `NO TARGET`), plus AC-1
**Mode**: Hand-walk
**Preconditions**: Shared 1-9. Build the fixture in this order on `opening`:
1. `const s = useWorldStore.getState()`
2. `useWorldStore.setState({ influence: 30, cooldowns: { ...s.cooldowns, 'eu:lobby': s.t + 12 * 3600 }, contracts: s.contracts.filter((c) => c.sector !== 'eu') })`
3. `markSeen('hint-influence')`
4. At text scale 100, scroll STABILIZE into view and click its button with a real pointer click (`page.click`).

Card gate passed. The game stays paused throughout, so the spend stays pending and the cooldown does not tick.
**Steps**:
1. Confirm that the header reads `INFLUENCE 22 PTS` (30 - 8).
2. Set the text scale to 90.
3. Run M and `clipped('.wm-right')`, then capture each row (`if-025-tc05-<scale>-<row>.png`).
4. Repeat steps 2-3 at 100, 110 and 125.
5. At 100, also capture the three rows with `document.documentElement.style.filter = 'grayscale(1)'`. Then clear the filter.

**Expected Result**:
- STABILIZE reads `ACTIVE` (teal), and its button is disabled because its own cooldown is now set. `active` takes precedence over `cooldown` in `influenceStatus`.
- LOBBY reads `COOLDOWN 12H` and is disabled. This is the longest status word the spec's Localization table flags against its 72 px box.
- EXPEDITE reads `NO TARGET` and is disabled.

At every scale, every row meets the row pass rule. In particular, `overlap` is false for each status word. `clipped('.wm-right')` reports no `spill` for `.wm-act-status` (the status word stays inside its button) and no `textoverlap` between a status word and an effect line. In grayscale the three status words and three effect lines can all be read in the capture.
**Pass Criteria**: At all four scales, all 3 rows meet the row pass rule, and `clipped('.wm-right')` is `[]`. The three statuses read `ACTIVE`, `COOLDOWN 12H` and `NO TARGET` exactly.
**Actual Result**:
- Header after spend:
- 90:
- 100:
- 110:
- 125:
- Grayscale capture:

**Pass/Fail**:

---

## IF-025-TC-06: Expedite's effect may wrap but never clips, four scales

**AC covered**: AC-1, plus the story's AC-1 edge case "the Expedite effect (`WAIVE INTEL GATE // +nH EXPIRY`) may wrap but not clip"
**Mode**: Hand-walk
**Preconditions**: Shared 1-9. Fixture `opening` with Influence 30 and `markSeen('hint-influence')`, so EXPEDITE is `CLEAR`. That is the shortest status, and so the widest effect layout. Card gate passed.
**Steps**:
1. Set the text scale to 90.
2. Scroll EXPEDITE into view. Read the line count of its effect text: build a `Range` over the span's text node and count the distinct `top` values of `range.getClientRects()`.
3. Read `e.scrollWidth`, `e.clientWidth`, `e.scrollHeight` and `e.clientHeight`, and the span's rect against the `.wm-act-wrap` rect.
4. Run M for the EXPEDITE row, then capture it (`if-025-tc06-<scale>.png`).
5. Repeat steps 1-4 at 100, 110 and 125.

**Expected Result**: At each scale the line count is 1 or more (wrapping is allowed). `scrollWidth <= clientWidth + 1` and `scrollHeight <= clientHeight + 1`. The span's left and right edges lie within the `.wm-act-wrap` (within 1.5 px), and its bottom lies above the next element's top. The whole string `WAIVE INTEL GATE // +24H EXPIRY` can be read in the capture, with no ellipsis. The row meets the row pass rule.
**Pass Criteria**: At all four scales the Expedite effect shows in full (no clip, no ellipsis, no spill). Record the line count per scale.
**Actual Result**:
- 90 (lines):
- 100 (lines):
- 110 (lines):
- 125 (lines):

**Pass/Fail**:

---

## IF-025-TC-07: At 125%, every action row and every OPEN CONTRACTS row can be reached by scrolling

**AC covered**: AC-1 (no clipping at 125), plus the story's AC-1 edge case "OPEN CONTRACTS still scrolls with every row reachable at 125%", and the Completion Notes ("at text scale 125 the actions sit below the fold of the sector panel and are reached by scrolling")
**Mode**: Hand-walk
**Preconditions**: Shared 1-9. Fixture `opening`, text scale 125, card gate passed.
**Steps**:
1. Read `.wm-sector-scroll`'s `scrollHeight`, `clientHeight` and the computed `overflow-y`.
2. Set `.wm-sector-scroll` `scrollTop` to its maximum. Confirm that the last `.wm-act-wrap`'s effect line lies inside the scroller's rect, and capture the result (`if-025-tc07-sector-end.png`).
3. With the mouse wheel over `.wm-sector-scroll` (`page.mouse.wheel`), scroll from the top to the bottom. Record whether `scrollTop` changes.
4. Read `.wm-ops-list`'s `scrollHeight`, `clientHeight` and `overflow-y`. Count its `.wm-op` rows.
5. Scroll each `.wm-op` row into view in turn. For each, confirm that its rect lies inside `.wm-ops-list`'s rect and that its title text is the top element at its centre (`elementFromPoint`).
6. Set `.wm-ops-list` to its maximum scroll and capture the result (`if-025-tc07-ops-end.png`).
7. Confirm that the OPEN CONTRACTS panel shows at least its head and one row at scroll 0, as the Completion Notes require.

**Expected Result**: Both scrollers have `overflow-y` `auto` or `scroll`. Wherever the content is taller than the scroller (`scrollHeight > clientHeight`), the wheel moves `scrollTop`. At maximum scroll, the last action's effect line and the last contract row are fully inside their scrollers. Every `.wm-op` row in turn passes the inside-rect and top-element checks. At scroll 0, OPEN CONTRACTS shows its head and at least one row.
**Pass Criteria**: All 3 action rows and every OPEN CONTRACTS row can be scrolled fully into view at 125%. No row is cut off at maximum scroll.
**Actual Result**:
- Sector scroller (scrollHeight / clientHeight / overflow-y):
- Ops list (rows, scrollHeight / clientHeight / overflow-y):
- Unreachable rows (if any):

**Pass/Fail**:

---

## IF-025-TC-08: Antarctica offers no actions; `SECTOR LOCKED` cannot be shown on the screen

**AC covered**: AC-2 (`SECTOR LOCKED`), plus the story's AC-1 edge case "Antarctica offers no actions"
**Mode**: Hand-walk
**Preconditions**: Shared 1-6. Fixture `opening` with Influence 30. Card gate passed.
**Steps**:
1. Focus Antarctica: `useWorldStore.setState({ selected: 'an' })`. Then click its row in SECTORS to confirm the real control path focuses it too.
2. Count `.wm-act-wrap` and `.wm-act` elements inside the sector panel, and read `.wm-actions`' `childElementCount`.
3. Search the whole document's text for `SECTOR LOCKED`, `-12 UNREST OVER 6H`, `+8 CONTROL OVER 12H` and `WAIVE INTEL GATE`.
4. Run `clipped('.wm-right')` at 100 and 125, and capture both (`if-025-tc08-<scale>.png`).
5. Focus Europe again (`selected: 'eu'`) and confirm that 3 `.wm-act-wrap` rows come back.

**Expected Result**: Antarctica's sector panel has 0 action rows and 0 effect lines. No text on the screen reads `SECTOR LOCKED` or any effect string. `clipped('.wm-right')` is `[]` at both scales. Europe shows 3 rows again. The `SECTOR LOCKED` word cannot be shown, because `influenceActionsFor` (`src/ui/worldChrome.ts:66`) returns no actions for a locked sector, and Antarctica is the only locked sector (`src/game/atlas.ts`). Record AC-2's `SECTOR LOCKED` case as "not reachable on the screen; covered by no actions offered".
**Pass Criteria**: 0 action rows on Antarctica, no `SECTOR LOCKED` text anywhere, no clip at 100 and 125, and 3 rows back on Europe.
**Actual Result**:
**Pass/Fail**:

---

## AC coverage map

| AC | Cases |
|---|---|
| AC-1 rendered text equal to `actionEffect`, not only `title`/`aria-label` | TC-02 |
| AC-1 on its own line under the button | TC-01, TC-03, TC-04, TC-05, TC-06 |
| AC-1 no clipping at 1280x720 and 90/100/110/125 | TC-01, TC-03, TC-04, TC-05, TC-06, TC-07 |
| AC-2 `UNAFFORDABLE` | TC-01, TC-03, TC-04 |
| AC-2 `COOLDOWN nH` | TC-05 |
| AC-2 `NO TARGET` | TC-05 |
| AC-2 `ACTIVE` | TC-05 |
| AC-2 `SECTOR LOCKED` | TC-08 (not reachable on the screen; see the case) |
| AC-2 effect never overlaps the status word | TC-01, TC-03, TC-04, TC-05 |
| QA edge: Expedite wraps, does not clip | TC-06 |
| QA edge: OPEN CONTRACTS scrolls at 125 | TC-07 |
| QA edge: Antarctica offers no actions | TC-08 |

Per the story's QA Test Cases, record the AC-2 result separately in the evidence README, with one line naming TC-05 and TC-08.
