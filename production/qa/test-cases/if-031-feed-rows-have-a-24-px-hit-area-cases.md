# IF-031 — Feed rows have a 24 px hit area: manual test cases

**Story**: `production/epics/interface/story-031-feed-rows-have-a-24-px-hit-area.md`
**Story type**: UI | **Evidence location**: `production/qa/evidence/sprint-011/` (story map README) and `production/qa/evidence/if-031/` (story's own evidence path) | **Gate level**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Sources**: story Acceptance Criteria and `## QA Test Cases` (check `feed-row-hit-area`); `production/qa/qa-plan-sprint-011-2026-10-23.md` lines 34 and 150; `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-031 row: "Feed rows >=24 px, no overlap | R1 | E, R1").
**Written**: 2026-10-24 (qa-tester, `/team-qa` Sprint 11 Phase 4)

## Run conditions (all cases)

- Executor: Claude, headless Chrome for Testing via `npx playwright-cli` (or the probe's `playwright-core` launch), viewport exactly 1280x720. Never the user's Chrome.
- App: `npm run dev` on port 4200, URL `http://localhost:4200/`. Stop the server after the run and confirm nothing listens on port 4200.
- Text scale 100%, high contrast off (store defaults after `localStorage.clear()`).
- State is set through the stores, as `production/qa/evidence/sprint-011/probe.mjs` does. Probe fixture used here: **`opening`** (`STATES.opening`: `fresh()` = clear localStorage, reload, `save.startNewOperation()`, `goto('world')`; then `dismissCard()` = `useTutorialStore.markSeen('hint-worldmap')`; then `pause()`). The IF-031 probe block then seeds 14 events by cloning `events[0]` with ids 9000-9013, `t = i * 60`, and sets `unread: 3`.
- Feed facts from the build (read 2026-10-24, not a spec): rows are `button.wm-feed-line` inside `.scroll.wm-feed-list` (`src/ui/WorldMap.tsx` `EventsFeed`); the list shows the last 14 events, **newest first** (`slice(-14).reverse()`); a row click calls `markRead()` then `select(e.sector)`; `markRead` sets `useWorldStore.unread` to 0 (`src/state/worldStore.ts:1072`); with `unread === 0` the Feed header shows `FEED CLEAR`, otherwise `n UNREAD`. CSS: `.wm-feed-line { min-height: 24px; padding: 3px 4px }`, list `gap: 1px`.

## Coverage map

| AC | Cases |
|---|---|
| AC-1 (every row box >=24 px at 1280x720, 100%) | IF031-TC-01, IF031-TC-03, IF031-TC-06 |
| AC-2 guard (14 events: scrolls with newest reachable; no overlap; click focuses sector and marks read) | IF031-TC-02, IF031-TC-03, IF031-TC-04, IF031-TC-05 |

| Case | Mode |
|---|---|
| IF031-TC-01 | Covered by R1 probe check: `IF-031 every Feed row >= 24 px high` |
| IF031-TC-02 | Covered by R1 probe check: `IF-031 Feed rows do not overlap` |
| IF031-TC-03 | Hand-walk |
| IF031-TC-04 | Hand-walk |
| IF031-TC-05 | Hand-walk |
| IF031-TC-06 | Hand-walk |

Note: section 6 of the strategy lists IF-031 as R1 only. The R1 IF-031 block asserts row height and non-overlap only. The scroll, newest-row, click-focus and mark-read parts of AC-2, and the story's "wrapped rows are taller" edge case, are not asserted by any probe check, so TC-03 to TC-06 are hand-walks.

---

## IF031-TC-01 — Every Feed row is at least 24 px high (14 events)

**Mode**: Covered by R1 probe check: `IF-031 every Feed row >= 24 px high`
**AC covered**: AC-1
**Preconditions**:
- Run conditions above. R1 is run on HEAD `131a5c1` with `PROBE_URL=http://localhost:4200/ PROBE_OUT=<new dir>/ node production/qa/evidence/sprint-011/probe.mjs`.
- Fixture `opening`, then the IF-031 block's 14-event seed (`unread: 3`).

**Steps**:
1. Start `npm run dev` (port 4200) and wait for the listener.
2. Run R1 as above to completion.
3. In `<new dir>/probe-output.txt`, find the line for `IF-031 every Feed row >= 24 px high`.
4. Record the detail string `<n> rows, min h <h>`.
5. Confirm the screenshot `if-031-035-targets.png` exists in `<new dir>` and is 1280x720.

**Expected Result**: The line reads PASS; `n` is 14; `min h` is >= 24. The screenshot exists at 1280x720 and shows the Feed with rows.
**Pass Criteria**: PASS line present AND `n === 14` AND `min h >= 24` AND the PNG is 1280x720. Any FAIL, `n < 14`, or a missing PNG fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF031-TC-02 — Feed rows do not overlap (14 events)

**Mode**: Covered by R1 probe check: `IF-031 Feed rows do not overlap`
**AC covered**: AC-2 (rows do not overlap)
**Preconditions**: Same R1 run as IF031-TC-01 (fixture `opening` + 14-event seed).

**Steps**:
1. In the same `<new dir>/probe-output.txt`, find the line for `IF-031 Feed rows do not overlap`.
2. Record PASS or FAIL.

**Expected Result**: PASS. Each row's top is at or below the previous row's bottom (the probe allows 0.5 px tolerance).
**Pass Criteria**: The line reads PASS. Fails if it reads FAIL or is missing.

**Actual Result**:

**Pass/Fail**:

---

## IF031-TC-03 — Wrapped rows are taller, still >=24 px, and do not overlap

**Mode**: Hand-walk (the R1 seed clones `events[0]`, so all 14 rows carry the same text and no row wraps)
**AC covered**: AC-1, AC-2 (rows do not overlap)
**Preconditions**:
- Run conditions above; fixture `opening` set up as the probe does it (`fresh()`, `dismissCard()`, `pause()`).

**Steps**:
1. Seed 14 events with distinct sectors, two of them long enough to wrap, through the store:
   ```js
   const { useWorldStore } = await import('/src/state/worldStore.ts')
   const s = useWorldStore.getState(); const base = s.events[0]
   const sectors = ['na','sa','eu','af','as','oc']
   const long = 'LONG FEED LINE FOR WRAP CHECK '.repeat(6).trim()
   const events = Array.from({ length: 14 }, (_, i) => ({ ...base, contract: undefined, id: 9100 + i, t: i * 60,
     sector: sectors[i % 6], text: (i === 3 || i === 10) ? long : 'SHORT LINE ' + i }))
   useWorldStore.setState({ events, unread: 3 })
   ```
2. Wait 250 ms.
3. Run `[...document.querySelectorAll('.wm-feed-line')].map(b => b.getBoundingClientRect())` and record each row's `top`, `height`, and text.
4. Identify the two rows whose text is the long string (event ids 9103 and 9110).
5. Check each adjacent pair: `rows[i].top >= rows[i-1].top + rows[i-1].height - 0.5`.
6. Scroll the Feed list (`.wm-feed-list`) so both long rows are in view in turn and capture a 1280x720 screenshot of each as `if-031-wrapped-rows-<n>.png` in the evidence directory.

**Expected Result**: 14 rows. Every row height >= 24. Each long row is taller than the tallest short row (its text wraps onto 2 or more lines inside the row, not clipped and not spilling into the next row). No adjacent pair overlaps.
**Pass Criteria**: All of: row count 14; `min(height) >= 24`; height of each long row > max height of the short rows; zero overlapping pairs; screenshots show the long text fully inside its row. Any one false fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF031-TC-04 — With 14 events the Feed scrolls and the newest row is reachable

**Mode**: Hand-walk (no probe check asserts scroll or the newest row)
**AC covered**: AC-2 (scrolls with the newest row reachable)
**Preconditions**: State from IF031-TC-03 step 1 (14 events, distinct sectors; newest event is id 9113, `t = 780`, `00:13` per `hhmm`), or re-seed it after fixture `opening`.

**Steps**:
1. Read from `.wm-feed-list`: `scrollHeight`, `clientHeight`, `scrollTop`. Record them.
2. Read the first row's text and the first row's rect, and the list's rect. Confirm the first row is the newest event (id 9113 text `SHORT LINE 13`).
3. Confirm the first row's rect lies fully inside the list's visible rect (`row.top >= list.top` and `row.bottom <= list.bottom`).
4. Scroll the list to the bottom (`el.scrollTop = el.scrollHeight`), wait 150 ms, and confirm the last row (oldest shown, `SHORT LINE 0`) lies fully inside the list's visible rect. Capture `if-031-feed-scrolled-bottom.png`.
5. Scroll back to the top with the mouse wheel over the Feed (`page.mouse.wheel(0, -2000)` with the pointer over `.wm-feed-list`), wait 150 ms, and confirm the newest row is fully visible again. Capture `if-031-feed-top.png`.
6. While scrolled to the top, append one more event through the store (`id: 9114, t: 840, sector: 'eu', text: 'SHORT LINE 14'`) and wait 250 ms. Record the row count and the first row's text.
7. Scroll the list to the bottom, append another event (`id: 9115, t: 900, text: 'SHORT LINE 15'`), wait 250 ms, then scroll to the top and confirm `SHORT LINE 15` is the first row and fully visible.

**Expected Result**: `scrollHeight > clientHeight` (the list overflows and scrolls). The newest event is the first row and is reachable (fully visible at the top). The oldest shown row is reachable at the bottom. After each append the row count stays 14 (the cap) and the new event is the first row, reachable by scrolling to the top.
**Pass Criteria**: All of: `scrollHeight > clientHeight`; step 2 first row is `SHORT LINE 13`; steps 3, 4, 5 and 7 find the named row fully inside the list's visible rect; step 6 and 7 row count is 14 with the newest appended event first. If `scrollHeight <= clientHeight` at 14 rows, record the measured values and mark the case **Fail — cannot show scrolling at 14 events** and raise it to qa-lead (the AC states the Feed scrolls with 14 events).

**Actual Result**:

**Pass/Fail**:

---

## IF031-TC-05 — A row click focuses its sector and marks the event read

**Mode**: Hand-walk (the only probe Feed-click check is IF-019's, run under the orientation card with the cloned single-sector seed; it asserts `selected !== undefined` and never reads `unread`)
**AC covered**: AC-2 (a row click still focuses its sector and marks the event read)
**Preconditions**: State from IF031-TC-03 step 1 (14 events across `na, sa, eu, af, as, oc`, `unread: 3`), orientation card dismissed (fixture `opening`).

**Steps**:
1. Set a known starting selection that differs from the target row's sector: `useWorldStore.getState().select('na')`. Wait 150 ms.
2. Read and record `useWorldStore.getState().selected` and `unread`, and the Feed header text (`.wm-feed` header: expect `3 UNREAD`).
3. Scroll the Feed list to the bottom. Bring the row for `SHORT LINE 2` (event sector `eu`) into view with `scrollIntoView({ block: 'nearest' })`; record its text and sector.
4. Click that row with a real pointer click at its centre (`locator.click()`). Wait 200 ms.
5. Read `selected`, `unread`, the Feed header text, and the current phase (`useAppStore.getState().phase`).
6. Capture `if-031-row-click-focused.png` (the sector readout and the Feed header visible).
7. Repeat steps 1-5 with `unread` reset to 3 and a row of a different sector (`SHORT LINE 4` -> `as`) clicked with a keyboard activation: focus the row button and press Enter.

**Expected Result**: After each click/activation: `selected` equals the clicked row's event sector (`eu`, then `as`); `unread` is 0; the Feed header shows `FEED CLEAR` instead of `n UNREAD`; phase stays `world`; the right-hand sector readout names the clicked sector.
**Pass Criteria**: For both activations: `selected` = expected sector AND `unread === 0` AND header text contains `FEED CLEAR` AND phase is `world`. Any mismatch fails the case.

**Actual Result**:

**Pass/Fail**:

---

## IF031-TC-06 — The pointer hits the right row across its whole 24 px box

**Mode**: Hand-walk (R1 measures boxes; it does not hit-test Feed rows)
**AC covered**: AC-1 (the hit area carries the 24 px size; story Context: "The visible glyph may stay smaller; the hit area carries the size")
**Preconditions**: State from IF031-TC-03 step 1, list scrolled to the top.

**Steps**:
1. For each row fully inside the list's visible rect, take its rect and an x at `left + width / 2`.
2. Hit-test `document.elementFromPoint(x, top + 1)`, `(x, top + height / 2)` and `(x, bottom - 1)`; for each, record whether `.closest('.wm-feed-line')` is that same row.
3. For every adjacent pair, hit-test the 1 px gap midpoint `(x, (prev.bottom + next.top) / 2)` and record which element (if any) it returns.
4. Pick one short row; move the real pointer to `(x, top + 1)` and click; confirm `selected` equals that row's sector (not the row above's).
5. Repeat step 4 at `(x, bottom - 1)` on a different short row whose neighbour below has a different sector; confirm the clicked row's sector is selected, not the neighbour's.

**Expected Result**: Every top/middle/bottom hit returns its own row. The gap returns neither row or the list itself, never a row other than the two neighbours. The edge clicks select the clicked row's sector.
**Pass Criteria**: 100% of step 2 hits return the row under test; steps 4 and 5 select the expected sector. Any hit that returns a different row, or an edge click that selects a neighbour's sector, fails the case.

**Actual Result**:

**Pass/Fail**:

---

## Evidence to record

- R1 `probe-output.txt` lines for TC-01/TC-02 (copy the exact lines into the evidence README).
- Screenshots: `if-031-035-targets.png` (R1), `if-031-wrapped-rows-*.png`, `if-031-feed-top.png`, `if-031-feed-scrolled-bottom.png`, `if-031-row-click-focused.png`, all 1280x720, headless.
- Measured values per hand-walk: row count, min/max row height, `scrollHeight` / `clientHeight`, selected/unread before and after each click.
- Closing: dev server stopped, port 4200 listener gone, headless browser closed.
