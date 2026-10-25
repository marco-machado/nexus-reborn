# IF-018 manual test cases: First-visit card is not aria-modal

- **Story**: `production/epics/interface/story-018-first-visit-card-is-not-aria-modal.md` (AC-1, AC-2 guard)
- **Story type**: UI. **Evidence location**: `production/qa/evidence/sprint-011/` (the story's Test Evidence records this path; `probe-output.txt`, `state-opening-card.png`). **Gate**: BLOCKING.
- **Sources**: story `## Acceptance Criteria` and `## QA Test Cases` (`onboard-not-modal`); `production/qa/qa-plan-sprint-011-2026-10-23.md` Manual QA Checklist, IF-018; `production/qa/qa-strategy-sprint-011-2026-10-24.md` section 6 (IF-018: R1, status E); `design/ux/world-network.md` Accessibility, Focus order item 5 and the Interaction Map Escape row.
- **Written**: 2026-10-24, Sprint 11 `/team-qa` Phase 4. Executor: Claude, headless. Sign-off: qa-lead.

## Execution mode

- **Build under test**: HEAD `131a5c1`.
- **Runner**: Claude, headless `npx playwright-cli` (Chrome for Testing), viewport exactly 1280x720. Never the user's Chrome.
- **Server**: `npm run dev` on port 4200. Stop it after the run and confirm nothing listens on 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` prints nothing).
- **Fixture**: `opening-card` from `production/qa/evidence/sprint-011/probe.mjs` (`STATES['opening-card']` = `fresh()` then `pause()`). `fresh()` clears `localStorage`, reloads, calls `save.startNewOperation()`, then `useAppStore.getState().goto('world')`. `pause()` pauses the World clock through `worldStore`. So the card shows on a new campaign's first World Network visit, with the clock paused.
- **Probe block**: `probe.mjs` section `// IF-018` (lines 501-522 at HEAD). It runs the five checks below in order on one card instance: DOM read, initial focus, Tab, Shift+Tab, Esc.
- **R1**: run the whole probe on HEAD (`node production/qa/evidence/sprint-011/probe.mjs` against port 4200). Copy each `PASS`/`FAIL` line for `IF-018` from the fresh `probe-output.txt` into Actual Result. The copy at `ad176af` is stale (strategy section 6, legend E); it does not count for HEAD.

Shared preconditions (every case):

1. `git rev-parse --short HEAD` prints `131a5c1`, and `git status --porcelain src` prints nothing.
2. Dev server up on port 4200. Browser viewport reads `window.innerWidth === 1280 && window.innerHeight === 720`.
3. The `opening-card` fixture has run, and `document.querySelector('.wm-onboard-wrap')` is non-null (the card is showing).

For the hand-walk cases, open a fresh fixture for each case, so focus starts on `UNDERSTOOD` and no earlier key press shifts it.

---

## IF-018-TC-01: The card carries no aria-modal="true"

**AC covered**: AC-1 (DOM half)
**Coverage**: Covered by R1 probe check: `IF-018 card has no aria-modal="true"`
**Preconditions**: Shared 1-3. No key pressed since the fixture.
**Steps**:
1. Read `document.querySelector('.wm-onboard-wrap').getAttribute('aria-modal')`.
2. Check every descendant: `document.querySelectorAll('.wm-onboard-wrap [aria-modal]').length`.
3. Read `role` and `aria-label` on `.wm-onboard-wrap` and record them (for information only).

**Expected Result**: Step 1 returns `null` (the attribute is absent), or at least anything other than `"true"`. Step 2 returns `0`. Step 3 is recorded only. The story allows `role="dialog"` and the label `World Network orientation` to stay. Their presence or absence does not decide this case.
**Pass Criteria**: The probe line reads `PASS IF-018 card has no aria-modal="true"`, and step 2 returns `0`.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-02: UNDERSTOOD has initial focus

**AC covered**: AC-1 (initial focus)
**Coverage**: Covered by R1 probe check: `IF-018 UNDERSTOOD has initial focus`
**Preconditions**: Shared 1-3. No key press and no click since the fixture.
**Steps**:
1. Read `document.activeElement.textContent.trim()`.
2. Read `document.activeElement.closest('.wm-onboard') !== null`.

**Expected Result**: Step 1 returns `UNDERSTOOD`. Step 2 returns `true` (the focused element is the card's own button, not another `UNDERSTOOD`).
**Pass Criteria**: The probe line reads `PASS IF-018 UNDERSTOOD has initial focus // UNDERSTOOD`.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-03: Tab from UNDERSTOOD moves focus to the nav

**AC covered**: AC-1 (no focus trap)
**Coverage**: Covered by R1 probe check: `IF-018 Tab from UNDERSTOOD reaches the nav`
**Preconditions**: Shared 1-3. Focus is on `UNDERSTOOD` (TC-02 passed).
**Steps**:
1. Press `Tab` once.
2. Read `!!document.activeElement.closest('.navtabs')`.
3. Read `document.activeElement.textContent.trim()` and record it.
4. Read `!!document.querySelector('.wm-onboard-wrap')`.

**Expected Result**: Step 2 returns `true`. Focus has left the card for the nav (Focus order item 6). Step 3 is recorded only; per the spec it is the first nav tab, World Network. Step 4 returns `true`: Tab does not dismiss the card.
**Pass Criteria**: The probe line reads `PASS IF-018 Tab from UNDERSTOOD reaches the nav`.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-04: Shift+Tab reverses the Tab and returns focus to UNDERSTOOD

**AC covered**: AC-2 (guard: Shift+Tab reverses the focus order)
**Coverage**: Covered by R1 probe check: `IF-018 Shift+Tab returns to UNDERSTOOD`
**Preconditions**: Shared 1-3. TC-03 step 1 has run, so focus is inside `.navtabs`.
**Steps**:
1. Press `Shift+Tab` once.
2. Read `document.activeElement.textContent.trim()`.
3. Read `!!document.querySelector('.wm-onboard-wrap')`.

**Expected Result**: Step 2 returns `UNDERSTOOD`. Step 3 returns `true`.
**Pass Criteria**: The probe line reads `PASS IF-018 Shift+Tab returns to UNDERSTOOD // UNDERSTOOD`.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-05: Shift+Tab pressed on UNDERSTOOD moves focus back to the bottom strip

**AC covered**: AC-2 (guard: "Shift+Tab from `UNDERSTOOD`" read literally, with focus starting on `UNDERSTOOD`)
**Coverage**: Hand-walk. The probe presses Shift+Tab only after a Tab (TC-04). It never presses Shift+Tab with focus starting on `UNDERSTOOD`.
**Preconditions**: Shared 1-3, on a fresh `opening-card` fixture. Focus is on `UNDERSTOOD` (re-check `document.activeElement.textContent.trim() === 'UNDERSTOOD'`). No key pressed yet.
**Steps**:
1. Press `Shift+Tab` once.
2. Read `document.activeElement.textContent.trim()`, `document.activeElement.className`, and `!!document.activeElement.closest('.wm-bottom')`.
3. Read `!!document.activeElement.closest('.wm-onboard')`.
4. Read `!!document.querySelector('.wm-onboard-wrap')`.
5. Press `Tab` once and read `document.activeElement.textContent.trim()`.

**Expected Result**: Focus leaves the card backwards, into Focus order item 4, the bottom strip (`design/ux/world-network.md`: "Shift+Tab reverses the order"; item 4 comes just before item 5, the card). Step 2: `closest('.wm-bottom')` is `true`; record the element (expected: the last bottom-strip stop, such as the last Feed row, or `8X` / `n UNREAD` when the Feed has no rows). Step 3 returns `false`. Step 4 returns `true`. Step 5 returns `UNDERSTOOD`.
**Pass Criteria**: Steps 2-5 return `true` / `false` / `true` / `UNDERSTOOD` in that order. If step 2's `closest('.wm-bottom')` is `false` but focus did leave the card (step 3 `false`), record the element and mark **Fail (focus-order deviation)**. That is a Focus order mismatch, not an aria-modal regression; raise it with qa-lead before filing a bug.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-06: Esc leaves the card in place

**AC covered**: AC-2 (guard: Esc does not dismiss the card)
**Coverage**: Covered by R1 probe check: `IF-018 Esc leaves the card in place`
**Preconditions**: Shared 1-3. TC-04 has run, so focus is on `UNDERSTOOD`.
**Steps**:
1. Press `Escape` once.
2. Wait 200 ms.
3. Read `!!document.querySelector('.wm-onboard-wrap')`.
4. Read `(await import('/src/state/tutorialStore.ts')).useTutorialStore.getState().seen.includes('hint-worldmap')` and record the value.

**Expected Result**: Step 3 returns `true`. The spec's Interaction Map Escape row says Esc "never dismisses the first-visit card". Step 4 returns `false`: `hint-worldmap` (`WORLD_ONBOARD_ID`, `src/game/tutorial.ts:198`) is not marked seen, because only `UNDERSTOOD` or clock use marks it.
**Pass Criteria**: The probe line reads `PASS IF-018 Esc leaves the card in place`. The step 4 hand-read, on top of the probe, returns `false`.
**Actual Result**:
**Pass/Fail**:

## IF-018-TC-07: Retained screenshot of the card state at 1280x720

**AC covered**: Story Test Evidence (UI: a retained screenshot of each state touched). Supports AC-1 and AC-2.
**Coverage**: Hand-walk (review of the R1 capture; the probe writes `state-opening-card.png` in its IF-026 state loop, a capture rather than a check).
**Preconditions**: R1 has run on HEAD `131a5c1`.
**Steps**:
1. Run `ls -l production/qa/evidence/sprint-011/state-opening-card.png`. Its mtime must be later than the R1 start time recorded in the fresh `probe-output.txt` header (`# Sprint 11 probe — <ISO time>`).
2. Read its pixel size (`sips -g pixelWidth -g pixelHeight` or equivalent).
3. Open the PNG.

**Expected Result**: Step 1: the file was rewritten by this R1 run. Step 2: 1280 x 720. Step 3: the card `WORLD NETWORK // ORIENTATION` shows over the Scan column with its four rows and `UNDERSTOOD`, the transport strip is visible beside it, and no dimmed full-screen backdrop is drawn (P-23: not P-05).
**Pass Criteria**: All three expectations hold.
**Actual Result**:
**Pass/Fail**:

---

## AC coverage map

| AC | Cases | Probe-covered | Hand-walk |
|---|---|---|---|
| AC-1: no `aria-modal="true"`; `UNDERSTOOD` initial focus; Tab to nav | TC-01, TC-02, TC-03 | all three | none |
| AC-2 guard: Shift+Tab reverses | TC-04, TC-05 | TC-04 | TC-05 |
| AC-2 guard: Esc leaves the card | TC-06 | TC-06 (step 4 is a hand-read) | step 4 only |
| Test Evidence (UI screenshot) | TC-07 | capture only | TC-07 |
