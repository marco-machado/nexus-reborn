# IF-011 manual test cases: Pyrrhic win banner and failed-campaign Debrief actions

**Story**: `production/epics/interface/story-011-pyrrhic-win-banner-and-failed-campaign-debrief-actions.md` (AC29, AC30)
**QA plan**: `production/qa/qa-strategy-sprint-001-2026-10-12.md`, MC-1
**Story type**: UI | **Evidence**: retained screenshots in `production/qa/evidence/if-011/` | **Gate**: BLOCKING (C1 blocks IF-011 sign-off)
**Executor**: Claude, headless Chrome (playwright-cli), viewport 1280x720, fresh browser context per capture (clean save)
**Build under test**: record `git rev-parse --short HEAD` (expected 879bb68 or later; must include 96b9b05) and `git status --short src/` (must be empty)

## Shared setup

- **S-1 Server**: `npm run dev -- --strictPort --port 4200`. When the session ends, stop it and confirm nothing is listening on port 4200 (`lsof -i :4200` prints nothing).
- **S-2 Fixture seeding** (same as `production/qa/evidence/if-011/README.md`). In a fresh context, load `http://localhost:4200/`. Through the Vite dev module graph (`await import('/src/state/...')`), do the following in order:
  1. `useSettingsStore.getState().setTextScale(<scale>)`, then confirm `<html>` has class `s-text-<scale>`.
  2. Wipe fixtures only: `useCampaignStore.setState({ operatives: [first operative] })`.
  3. `useAppStore.setState({ missionId: MISSIONS[0].id })`. This is an authored mission: `isGeneratedMissionId` returns false.
  4. `useAppStore.getState().setOutcome({...})` with `applyKey = lastAppliedKey + 1`, `quietReplay: false`, and `won`/`deadIds` from the table below.
  5. `goto('debrief')`. Debrief's own `applyDebrief` sets `campaignFailed`. Never set `campaignFailed` by hand.
- **S-3 Fixtures**

| Fixture | `won` | `deadIds` | Expected `campaignFailed` after apply |
|---|---|---|---|
| pyrrhic-win | true | [the only operative's id] | true |
| win | true | [] | false |
| failed-loss | false | [the only operative's id] | true |
| loss | false | [] | false |

- **S-4 DOM probes** (run after Debrief paints):
  - `card = document.querySelector('.db-card')`
  - `card.firstElementChild.className`
  - `getComputedStyle(.db-failed).fontSize` vs `getComputedStyle(.db-title).fontSize`
  - `.db-failed` `getBoundingClientRect()`
  - `document.activeElement`
  - `.db-actions` button labels
  - `.db-rows` NOTE and PAYOUT row text
  - `document.scrollingElement.scrollHeight <= innerHeight`, and the same for `scrollWidth <= innerWidth`
  - `useCampaignStore.getState().campaignFailed`
  - console errors
- **S-5 Screenshot names**:
  - 100%: `if-011-<fixture>-1280x720.png`
  - Other scales: `if-011-<fixture>-text{90,110,125}-1280x720.png`
  - Overwrite the existing 13 files. The loss fixture at 90/110/125 adds three new files in the same pattern (see CONCERNS in the hand-off).

---

## Test Case: IF011-TC01 — Pyrrhic win: banner first and dominant (x4 scales)
**AC**: AC29
**Preconditions**: S-1 running. Fresh context. Fixture `pyrrhic-win` seeded per S-2. Run once per text scale 90, 100, 110 and 125 (record each scale as a separate row).
**Steps**:
  1. Seed the fixture at the scale under test and enter Debrief.
  2. Run the S-4 probes.
  3. Read the banner text and the computed background and text colour of `.db-failed`.
  4. Take the screenshot named per S-5.
**Expected Result**:
- `campaignFailed === true`.
- The first element child of `.db-card` is `.db-failed`. It comes before `.db-tag`, `.db-title` and `.db-rows` in DOM order and in on-screen top position.
- Its text is exactly `CAMPAIGN FAILED`.
- The banner font size is greater than or equal to the `.db-title` font size.
- The banner's rect lies fully inside 0..1280 x 0..720.
- The banner's colours are red-family values already in `ui.css`/tokens (`rgba(224, 75, 60, …)` / `--red-hot`), with no new hex.
**Pass Criteria**: PASS only if all bullets hold at this scale.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. First child `.db-failed` "CAMPAIGN FAILED" at all scales; banner/title 42px/42px; banner rect top-bottom 74-138 (90), 63-127 (100), 48-112 (110), 38-102 (125), inside the viewport; colours rgb(255,107,85) on rgba(224,75,60,0.18), border rgba(224,75,60,0.7) (`--red-hot` and existing rgba, no new hex).
**Pass/Fail**: PASS

## Test Case: IF011-TC02 — Pyrrhic win: note text and unchanged net payout (x4 scales)
**AC**: AC29
**Preconditions**: Same as TC01 (same session per scale is fine).
**Steps**:
  1. Before entering Debrief, compute `netPayout(outcome)` from `/src/state/appStore.ts` for the seeded outcome.
  2. Enter Debrief.
  3. Read the NOTE row and the PAYOUT row inside `.db-rows`. At 110/125, if the rows are below the fold, scroll `.db-rows` itself, not the page.
**Expected Result**:
- The NOTE row reads exactly `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` (em dash U+2014).
- PAYOUT equals the precomputed `netPayout(outcome)`. The README baseline is +40,000 CR.
- The payout row is not zero or reduced because of the wipe.
**Pass Criteria**: The note string matches byte-for-byte and the PAYOUT value equals `netPayout(outcome)`.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. NOTE row reads `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` at all 4 scales; PAYOUT +85,000 CR, identical to the plain win fixture (netPayout unchanged).
**Pass/Fail**: PASS

## Test Case: IF011-TC03 — Focus lands on the banner on Debrief entry
**AC**: AC29 (commit 96b9b05; critical state announced, not colour-only)
**Preconditions**: S-1 running. Fixture `pyrrhic-win` at scale 100, then `failed-loss` at scale 100.
**Steps**:
  1. Enter Debrief. Do not click or press any key.
  2. Read `document.activeElement`: its `className`, `role` and `tabIndex`.
  3. Press Tab once and read `document.activeElement` again.
  4. Repeat steps 1-3 for `failed-loss`.
**Expected Result**:
- After step 2, `activeElement` is `.db-failed` with `role="alert"` and `tabIndex = -1`.
- After step 3, focus moves forward into the invoice/actions, not back to `<body>`.
- Both fixtures behave the same.
**Pass Criteria**: `document.activeElement.classList.contains('db-failed')` is true on entry for both fixtures.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. pyrrhic-win and failed-loss: activeElement on entry = `DIV.db-failed`, role=alert, tabIndex -1; one Tab moves to `.db-rows` (role=region, "Mission invoice"). Plain win/loss: focus stays on BODY.
**Pass/Fail**: PASS

## Test Case: IF011-TC04 — Pyrrhic win: no Replay, World Network return present
**AC**: AC30
**Preconditions**: Fixture `pyrrhic-win` (authored mission) at each scale (can be read during TC01).
**Steps**:
  1. List every button in `.db-actions` by visible text and `aria-label`.
  2. Click the World Network return button. The screenshot is already taken.
**Expected Result**:
- No control whose text or label contains `REPLAY` exists anywhere in `.db-card`.
- The return control and Balance are present.
- Clicking return sets `useAppStore.getState().phase === 'world'`.
**Pass Criteria**: Replay count is 0, the return button exists, and after the click `phase === 'world'`.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. Actions on pyrrhic-win at all scales: RETURN TO WORLD NETWORK, BALANCE DATA. No REPLAY MISSION.
**Pass/Fail**: PASS

## Test Case: IF011-TC05 — Failed loss: banner, no pyrrhic note, no Replay (x4 scales)
**AC**: AC29 (banner placement), AC30
**Preconditions**: Fresh context. Fixture `failed-loss` seeded per S-2 at each of the four scales.
**Steps**:
  1. Enter Debrief and run the S-4 probes.
  2. Read the `.db-rows` NOTE row, if any.
  3. List the `.db-actions` controls.
  4. Take the screenshot per S-5.
**Expected Result**:
- `campaignFailed === true`.
- `.db-failed` "CAMPAIGN FAILED" is the first child of `.db-card`, with font size at least the title's.
- No NOTE row contains `PYRRHIC`.
- PAYOUT is 0 CR.
- No Replay control. Return and Balance are present.
**Pass Criteria**: All bullets hold at every scale.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. failed-loss at 90/100/110/125: first child `.db-failed`, 42px/42px; no NOTE row; PAYOUT 0 CR; actions RETURN TO WORLD NETWORK, BALANCE DATA (no Replay).
**Pass/Fail**: PASS

## Test Case: IF011-TC06 — Non-pyrrhic win: no banner, no note, Replay present (x4 scales)
**AC**: AC29 (negative), AC30 (non-failed)
**Preconditions**: Fresh context. Fixture `win` at each of the four scales.
**Steps**:
  1. Enter Debrief and run the S-4 probes.
  2. Read the `.db-rows` text.
  3. List the `.db-actions` controls.
  4. Read `document.activeElement`.
  5. Take the screenshot per S-5.
**Expected Result**:
- `campaignFailed === false`.
- `document.querySelector('.db-failed') === null`, and the first child of `.db-card` is `.db-tag`.
- No row text contains `PYRRHIC` or `CAMPAIGN FAILED`.
- Return, Replay and Balance are all present.
- `activeElement` is `<body>`: no forced focus.
**Pass Criteria**: Banner node is absent, note is absent, and the Replay button count is 1, at every scale.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. win at all scales: first child `.db-tag`; no banner; no NOTE row; PAYOUT +85,000 CR; actions RETURN, REPLAY MISSION, BALANCE DATA.
**Pass/Fail**: PASS

## Test Case: IF011-TC07 — Non-failed loss: no banner, Replay present (x4 scales)
**AC**: AC30 (non-failed authored Debrief)
**Preconditions**: Fresh context. Fixture `loss` at each of the four scales.
**Steps**:
  1. Enter Debrief and run the S-4 probes.
  2. List the `.db-actions` controls.
  3. Take the screenshot per S-5.
**Expected Result**:
- `campaignFailed === false`.
- No `.db-failed`. The first child is `.db-tag`.
- PAYOUT is 0 CR.
- Return, Replay and Balance are present.
**Pass Criteria**: Banner node is absent and the Replay button count is 1, at every scale.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. loss at all scales: first child `.db-tag`; no banner; PAYOUT 0 CR; actions RETURN, REPLAY MISSION, BALANCE DATA.
**Pass/Fail**: PASS

## Test Case: IF011-TC08 — No clipping, no page scroll at 1280x720 (all 16 captures)
**AC**: AC29 ("fully visible without scrolling, clipping or truncation"); CLAUDE.md 1280x720 guardrail
**Preconditions**: Run on each of the 16 fixture/scale combinations from TC01, TC05, TC06 and TC07.
**Steps**:
  1. Check the page: `document.scrollingElement.scrollHeight <= 720` and `scrollWidth <= 1280`.
  2. Check `.db-card` and every `.db-actions` button: the rect is inside the viewport, and `scrollWidth <= clientWidth` (no truncated label).
  3. Check that `.db-failed` (where present), `.db-tag` and `.db-title` are fully inside the viewport, and that each has `scrollWidth <= clientWidth`.
  4. Open the screenshot and inspect it for overlap or cut text.
**Expected Result**:
- There is no page scroll on either axis.
- The banner, tag, title and actions are fully visible and untruncated.
- `.db-rows` is the only element allowed to scroll internally (approved layout fix: at 125 the PAYOUT/NOTE rows may sit below the fold inside `.db-rows`).
**Pass Criteria**: Every numeric check passes on all 16 captures, and no screenshot shows cut or overlapping text outside `.db-rows`.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. All 16 captures: documentElement scrollHeight/scrollWidth within client size (no page scroll); `.db-card` inside 0..720.
**Pass/Fail**: PASS

## Test Case: IF011-TC09 — Console clean and evidence record updated
**AC**: AC29 (retained screenshots), QA plan MC-1 deliverables
**Preconditions**: TC01-TC08 executed.
**Steps**:
  1. Collect console errors and warnings across all captures.
  2. Confirm the 16 PNGs exist under `production/qa/evidence/if-011/` with S-5 names and modification times from this session.
  3. Append the tested revision hash, the date and the measured table to `production/qa/evidence/if-011/README.md`, and update the AC30 row with the loss fixture at all four scales.
  4. Stop the server and confirm port 4200 is free.
**Expected Result**:
- There are no console errors attributable to Debrief. A one-off fresh-context asset 404 is noted but not a failure if unrelated.
- All 16 files are present.
- The README is updated.
- Nothing listens on port 4200.
**Pass Criteria**: All four bullets are true.
**Actual Result**: Executed 2026-10-12 by Claude, headless Chrome 1280x720, HEAD 879bb68 (src/ clean), README fixture seeding. 0 console errors across 16 fresh contexts (the earlier one-off 404 did not recur). 16 PNGs written to `production/qa/evidence/if-011/` (3 new: loss text90/110/125). README updated with revision and table. Port 4200 free after stop.
**Pass/Fail**: PASS

## AC coverage

| AC | Cases |
|---|---|
| AC29 | TC01, TC02, TC03, TC05 (banner), TC06 (negative), TC08, TC09 |
| AC30 | TC04, TC05, TC06, TC07 |
