# IF-022 manual test cases: empty Feed prints `-- CHANNEL OPEN --`

- **Story**: `production/epics/interface/story-022-empty-feed-prints-channel-open.md` (AC-1, AC-2 guard)
- **Story type**: UI. **Output**: `production/qa/evidence/sprint-011-head-2026-10-24/` (R1 run folder, per QA strategy section 4). **Gate**: BLOCKING.
- **Sources**: story `## Acceptance Criteria` and `## QA Test Cases` (`feed-empty-token`); `production/qa/qa-plan-sprint-011-2026-10-23.md` Manual QA Checklist, IF-022 (parent `.wm-feed-body`); `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-022: "R1 | E, R1").
- **Build under test**: HEAD `131a5c1`. **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude, headless. Sign-off: qa-lead.

## Execution mode

- Headless Chrome for Testing (`npx playwright-cli` or the `playwright-core` harness in `production/qa/evidence/sprint-011/probe.mjs`) at exactly **1280x720**, against `npm run dev` on port **4200**. Never the in-app pane or the user's Chrome. No headed window.
- R1 = `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`. Run it unchanged. A FAIL is filed with `/bug-report`; do not edit the script.
- After the session: stop the dev server and confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` prints nothing).

## Fixtures (as the probe sets them)

- **F-OPENING**: probe state `opening` = `fresh()` (localStorage clear + New Operation via `save.startNewOperation`), `dismissCard()` (`useTutorialStore.getState().markSeen('hint-worldmap')`), `pause()`. A fresh campaign has world clock `t = 0` and the three seed events (`t = -2717, -1277, -257`) in the Feed.
- **F-EMPTY**: F-OPENING, then `useWorldStore.setState({ events: [], unread: 0 })`, wait 200 ms. This is the probe's IF-022 block ("seeded empty").
- **F-REVIEW-EMPTY**: F-OPENING with no store edit to `events`; focus the Timeline track (`.wm-tl-track`, `role="slider"`, `aria-label="TIMELINE REVIEW"`) and press `Home`. This pins Review to `t - DAY` = `-86400`, before the first seed event. This is the story's second setup route ("Review scrubbed before the first event"). R1 does not exercise it.
- Text scale via `useSettingsStore.getState().setTextScale(n)`, as the probe's `setScale` does.

## AC map

| AC | Text (story) | Cases |
|---|---|---|
| AC-1 | No events in the Feed window: prints `-- CHANNEL OPEN --` and not `NO TRAFFIC IN THIS WINDOW` | TC-01, TC-02, TC-03, TC-04 |
| AC-2 (guard) | At least one event: token absent; with none, token not clipped in the bottom strip at text scale 125 | TC-05, TC-06 |

Record AC-1 and AC-2 results separately in the run folder's `README.md` (story QA Test Cases: "record the result separately").

---

## IF-022-TC-01: Seeded empty Feed prints the token

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-022 empty Feed prints -- CHANNEL OPEN --`
**Preconditions**: Dev server up on port 4200 at HEAD `131a5c1`; R1 run started into the dated folder; fixture F-EMPTY at text scale 100.
**Steps**:
1. Run R1.
2. In `probe-output.txt`, find the line for `IF-022 empty Feed prints -- CHANNEL OPEN --`.
3. Open `if-022-empty.png` in the run folder.

**Expected Result**: The line reads `PASS IF-022 empty Feed prints -- CHANNEL OPEN -- // "-- CHANNEL OPEN --"` (the trimmed `textContent` of `.wm-feed-body` equals exactly `-- CHANNEL OPEN --`, so no other text, and no event row, is in the body). The capture is 1280x720 and shows the token in the Feed panel.
**Pass Criteria**: The probe line starts `PASS` and its detail is exactly `"-- CHANNEL OPEN --"`; the PNG exists and is 1280x720.
**Actual Result**:
**Pass/Fail**:

---

## IF-022-TC-02: `NO TRAFFIC IN THIS WINDOW` is absent from the DOM and from `src`

**AC covered**: AC-1
**Coverage**: Hand-walk (R1 asserts only the Feed body's exact text; it neither scans the whole document nor runs `rg`)
**Preconditions**: Fixture F-EMPTY loaded at 1280x720 (same session as TC-01, or a fresh headless page); repo checked out at HEAD `131a5c1` with no `src/` changes (`git status --short src` prints nothing).
**Steps**:
1. In the page, evaluate `document.body.innerHTML.includes('NO TRAFFIC')` and record the boolean.
2. Evaluate `document.body.innerText.includes('NO TRAFFIC')` and record the boolean.
3. From the repo root, run `rg -n "NO TRAFFIC" src` and record its output and exit code.

**Expected Result**: Steps 1 and 2 both return `false`. Step 3 prints nothing and exits 1 (no match).
**Pass Criteria**: `false`, `false`, and an empty `rg` result with exit code 1. Any match fails.
**Actual Result**:
**Pass/Fail**:

---

## IF-022-TC-03: Seeded empty Feed header shows `FEED CLEAR`

**AC covered**: AC-1 (story QA edge case: "the header shows `FEED CLEAR`")
**Coverage**: Covered by R1 probe check: `IF-022 empty Feed header shows FEED CLEAR`
**Preconditions**: As TC-01 (F-EMPTY sets `unread: 0` as well as `events: []`).
**Steps**:
1. In `probe-output.txt`, find the line for `IF-022 empty Feed header shows FEED CLEAR`.
2. In `if-022-empty.png`, read the Feed panel header.

**Expected Result**: The line starts `PASS`. The header shows `FEED CLEAR` and no `n UNREAD` button.
**Pass Criteria**: The probe line starts `PASS` and the capture's Feed header reads `FEED CLEAR`.
**Actual Result**:
**Pass/Fail**:

---

## IF-022-TC-04: Review scrubbed before the first event prints the token

**AC covered**: AC-1 (story setup route 2; Implementation Notes: "scrubbing Review to before the first event is a way to reach the empty state")
**Coverage**: Hand-walk
**Preconditions**: Fixture F-OPENING at text scale 100, 1280x720. Before step 1, confirm `.wm-feed-body .wm-feed-line` count is 3 (the seed events) and the Timeline `aria-valuetext` is `LIVE`.
**Steps**:
1. Focus `.wm-tl-track` (click it or `element.focus()`), then press `Home`.
2. Read `useWorldStore.getState().review` and the Timeline `aria-valuetext`.
3. Read the trimmed `textContent` of `.wm-feed-body` and the count of `.wm-feed-body .wm-feed-line`.
4. Evaluate `document.body.innerText.includes('NO TRAFFIC')`.
5. Read the Feed header text (`FEED CLEAR` or `n UNREAD`) and record it verbatim.
6. Capture `if-022-review-empty.png` into the run folder.
7. Press `End`; read `.wm-feed-body .wm-feed-line` count again.

**Expected Result**: Step 2: `review` is `-86400` and `aria-valuetext` is a time, not `LIVE`. Step 3: body text is exactly `-- CHANNEL OPEN --`, row count 0. Step 4: `false`. Step 5: recorded only (see CONCERN below; this case does not pass or fail on it). Step 7: row count is back to 3 and the token is gone.
**Pass Criteria**: Steps 2, 3, 4 and 7 all match the Expected Result; the PNG exists at 1280x720.
**Note (CONCERN, not a pass condition)**: `UnreadBadge` shows `FEED CLEAR` only when `unread === 0` (`src/ui/WorldMap.tsx:712`), independent of the Review filter. A fresh campaign may start with unread events, so this route can show the token under an `n UNREAD` header. The story's edge case "the header shows `FEED CLEAR`" does not say which route it means. Record the header and refer the question to qa-lead; do not file it as a bug unless the spec rules that the header must read `FEED CLEAR` here.
**Actual Result**:
**Pass/Fail**:

---

## IF-022-TC-05: With at least one event the token is absent

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `IF-022 token absent with events`; plus a hand-walk row-count step (the probe asserts only that `.wm-feed-body` text lacks `CHANNEL OPEN`, which an empty or unrendered body would also satisfy)
**Preconditions**: R1 complete. For step 3, fixture F-OPENING at text scale 100, 1280x720.
**Steps**:
1. In `probe-output.txt`, find the line for `IF-022 token absent with events`.
2. Open `state-opening.png` in the run folder and confirm Feed rows are visible.
3. In a headless page on F-OPENING, read the count of `.wm-feed-body .wm-feed-line` and evaluate `document.querySelector('.wm-feed-body').textContent.includes('CHANNEL OPEN')`.
4. Set `useWorldStore.setState({ events: [<one seed event>] })` using the first element of the current `events`; repeat step 3's reads.

**Expected Result**: Step 1 starts `PASS`. Step 2 shows event rows in the Feed. Step 3: row count is 3 and `includes` is `false`. Step 4: row count is 1 and `includes` is `false` (boundary: exactly one event).
**Pass Criteria**: Probe line `PASS`; step 3 and step 4 each give row count >= 1 with `includes === false`.
**Actual Result**:
**Pass/Fail**:

---

## IF-022-TC-06: Empty token is not clipped in the bottom strip at text scale 125

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `IF-022 empty token not clipped at 125`
**Preconditions**: As TC-01; the probe then sets text scale 125 on F-EMPTY, waits 200 ms, reinstalls its helpers, and runs `__probe.clipped('.wm-feed')`.
**Steps**:
1. In `probe-output.txt`, find the line for `IF-022 empty token not clipped at 125`.
2. Open `if-022-empty-125.png` and read the token in the Feed panel.

**Expected Result**: The line starts `PASS` with no detail (an empty clip list: no `cut`, `truncated`, `hscroll` or spill entry under `.wm-feed`). The capture shows `-- CHANNEL OPEN --` whole, on one line or wrapped without any character cut off, inside the Feed panel.
**Pass Criteria**: The probe line starts `PASS` and the capture shows all 18 characters of `-- CHANNEL OPEN --` inside the panel.
**Actual Result**:
**Pass/Fail**:

---

## Run record

- R1 run folder `README.md` names the commit (`131a5c1`) and states "final sprint build", per QA strategy section 4, item 2.
- Probe run totals (from `probe-output.txt`) and console/page error count: must be ALL PASS with zero errors (strategy section 4, item 3). Record here:
- Dev server stopped; port 4200 free (command output):
