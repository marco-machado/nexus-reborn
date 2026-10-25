# IF-019 — Using the clock dismisses the first-visit card for the campaign — Manual test cases

**Story**: `production/epics/interface/story-019-using-the-clock-dismisses-the-first-visit-card.md`
**Story type**: Integration | **Evidence output**: unit test `src/ui/worldOnboard.test.ts` (automated half); R1 probe output + hand-walk screenshots in `production/qa/evidence/sprint-011-head-2026-10-24/` (browser half) | **Gate**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Sources**: story Acceptance Criteria and `## QA Test Cases`; QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` § Automated Tests Required → IF-019 and § Manual QA Checklist → IF-019; QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 6 (IF-019 row: "Browser: Pause, 1X, 2X, 4X, 8X clicked under the card each apply and dismiss; Feed row click leaves the card up", npm test + R1).
**Ruling that overrides story text**: a speed chosen while paused resumes the clock (owner ruling 2026-10-23, story Completion Notes). The story's and QA plan's "selects only" wording is superseded; these cases expect `paused === false` after any speed button.

## Automated evidence (not repeated here)

`src/ui/worldOnboard.test.ts`, describe `clockUse: the clock dismisses the first-visit card (IF-019)` — 10 tests, node-only, through `clockUse`, the handler the five `.wm-tbtn` buttons call (`src/ui/WorldMap.tsx` `TimeControl`):

| Test | AC |
|------|----|
| `a fresh campaign has the card unseen` | AC-1 precondition |
| `Pause applies and marks the card seen once` | AC-1 |
| `speed 1X / 2X / 4X / 8X applies and marks the card seen` (`it.each`, 4 tests; each starts paused at another speed, asserts `speed`, `paused === false`, count 1) | AC-1 (+ speed-while-paused ruling) |
| `the already-active speed still dismisses; repeats never duplicate the id` | AC-1 edge, AC-3 |
| `the dismissal survives a save and reload` (`captureSave` → `resetAll` → `hydrateSave`) | AC-1 (save/reload) |
| `focus changes and mark-read do not dismiss (AC-2)` (`select('na')`, `markRead()`) | AC-2 |
| `New Operation brings the card back (AC-3)` | AC-3 |

Not reachable by the node-only seam, so covered in the browser below: the button wiring itself (that a real click on each `.wm-tbtn` under the card reaches `clockUse`), the card unmounting, a real localStorage save and reload through the Menu, Esc, and `UNDERSTOOD` still working.

## AC map (browser half)

| AC | Text (short) | Cases |
|----|--------------|-------|
| AC-1 | Pause/Resume or 1X/2X/4X/8X under the card: clock action applies, `hint-worldmap` marked seen, card leaves, does not return after save and reload | IF019-01..05 (R1), IF019-06, -07, -08 (hand-walk) |
| AC-2 | Focus change, Feed row click, Esc: card stays, id not marked seen | IF019-09 (R1), IF019-10, -11 (hand-walk) |
| AC-3 | Repeat clock use never adds the id twice; New Operation shows the card again | IF019-06 (repeat), IF019-13 (hand-walk) |
| Story edge case | `UNDERSTOOD` still dismisses | IF019-12 (hand-walk) |

## Common setup

- Server: `npm run dev -- --strictPort --port 4200`. Confirm a listener on 4200 before starting; stop it and confirm 4200 is free afterwards.
- Browser: headless `npx playwright-cli` (Chrome for Testing) only. `open http://localhost:4200/`, `resize 1280 720`, confirm `eval "() => [innerWidth, innerHeight]"` returns `[1280, 720]`. Re-check after every `reload`.
- Record console and page errors for the whole session. Any `pageerror` or console `error` fails the case it appears in.
- Store handles for `eval` (the imports `probe.mjs` uses):
  ```js
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { useTutorialStore } = await import('/src/state/tutorialStore.ts')
  const { useAppStore } = await import('/src/state/appStore.ts')
  const save = await import('/src/state/save.ts')
  ```
- **Fixture `opening-card`** (probe.mjs `STATES['opening-card']`): `fresh()` — `localStorage.clear()`, reload, wait 1.2 s, `save.startNewOperation()`, `useAppStore.getState().goto('world')`, wait 700 ms — then `pause()` (`useWorldStore.setState({ paused: true })`). Result: World Network, orientation card up (`.wm-onboard-wrap` present), clock paused, `hint-worldmap` unseen. Wait for the card fade to finish (≥ 500 ms) before any screenshot.
- **Seen count**: `useTutorialStore.getState().seen.filter(id => id === 'hint-worldmap').length`.
- **Card present**: `!!document.querySelector('.wm-onboard-wrap')`.
- **Transport selectors**: Pause/Resume = `.wm-tbtn` first child (`aria-label` `PAUSE STRATEGIC CLOCK` / `RESUME STRATEGIC CLOCK`); speeds = `button[aria-label="CLOCK SPEED nX"]`. `UNDERSTOOD` = `button[aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"]`.
- All control activations in the steps are real clicks or key presses. Store writes are used only to set preconditions; each is named in the step.
- Screenshots: `production/qa/evidence/sprint-011-head-2026-10-24/if-019/<case-id>-<before|after>.png`. Do not overwrite committed outputs in `production/qa/evidence/sprint-011/`.

---

## Test Case: IF019-01 — PAUSE under the card pauses the clock and dismisses the card

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-019 PAUSE under the card applies and dismisses it`
**Preconditions**: Fixture `opening-card`. Then store write `useWorldStore.setState({ paused: false, speed: 2 })` and wait 150 ms (the probe's "start from a state the click must change"). Card present.
**Steps**:
1. Click the Pause button (`.wm-tbtn` first child, label `PAUSE STRATEGIC CLOCK`).
2. Wait 200 ms.
3. Read `useWorldStore.getState().paused`, `speed`, and card present.
**Expected Result**: The clock is paused, speed is unchanged at 2, and the card is gone.
**Pass Criteria**: `paused === true` AND card present `=== false`. Any other value fails.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-02 — 1X under the card, from paused at 2X, sets 1X, resumes, dismisses

**AC covered**: AC-1 (and the speed-while-paused ruling)
**Coverage**: Covered by R1 probe check: `IF-019 1X under the card applies and dismisses it`
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: true, speed: 2 })`, wait 150 ms. Card present.
**Steps**:
1. Click `button[aria-label="CLOCK SPEED 1X"]`.
2. Wait 200 ms.
3. Read `paused`, `speed`, card present.
**Expected Result**: Speed is 1, the clock runs, the card is gone.
**Pass Criteria**: `speed === 1` AND `paused === false` AND card present `=== false`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-03 — 2X under the card, from paused at 1X, sets 2X, resumes, dismisses

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-019 2X under the card applies and dismisses it`
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: true, speed: 1 })`, wait 150 ms. Card present.
**Steps**:
1. Click `button[aria-label="CLOCK SPEED 2X"]`.
2. Wait 200 ms.
3. Read `paused`, `speed`, card present.
**Expected Result**: Speed is 2, the clock runs, the card is gone.
**Pass Criteria**: `speed === 2` AND `paused === false` AND card present `=== false`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-04 — 4X under the card, from paused at 1X, sets 4X, resumes, dismisses

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-019 4X under the card applies and dismisses it`
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: true, speed: 1 })`, wait 150 ms. Card present.
**Steps**:
1. Click `button[aria-label="CLOCK SPEED 4X"]`.
2. Wait 200 ms.
3. Read `paused`, `speed`, card present.
**Expected Result**: Speed is 4, the clock runs, the card is gone.
**Pass Criteria**: `speed === 4` AND `paused === false` AND card present `=== false`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-05 — 8X under the card, from paused at 1X, sets 8X, resumes, dismisses

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-019 8X under the card applies and dismisses it`
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: true, speed: 1 })`, wait 150 ms. Card present.
**Steps**:
1. Click `button[aria-label="CLOCK SPEED 8X"]`.
2. Wait 200 ms.
3. Read `paused`, `speed`, card present.
**Expected Result**: Speed is 8, the clock runs, the card is gone.
**Pass Criteria**: `speed === 8` AND `paused === false` AND card present `=== false`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-06 — A real click marks `hint-worldmap` seen exactly once; further clock use never duplicates it

**AC covered**: AC-1 ("marked seen"), AC-3 (never added twice)
**Coverage**: Hand-walk (R1 checks only that the card is gone, not the seen set)
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: false, speed: 2 })`. Card present. Seen count 0.
**Steps**:
1. Read the seen count. Screenshot `IF019-06-before.png`.
2. Click 4X. Wait 200 ms. Read the seen count, `speed`, `paused`, card present. Screenshot `IF019-06-after.png`.
3. Click Pause (label now `PAUSE STRATEGIC CLOCK`). Wait 200 ms. Read `paused`, label of the first `.wm-tbtn`, seen count.
4. Click the same button again (label `RESUME STRATEGIC CLOCK`). Wait 200 ms. Read `paused`, seen count.
5. Click 1X, then 2X, then 8X, 200 ms apart. Read `speed`, `paused`, seen count, card present.
**Expected Result**: Step 1: count 0, card up. Step 2: `speed 4`, `paused false`, card gone, count 1. Step 3: `paused true`, label `RESUME STRATEGIC CLOCK`, count 1. Step 4: `paused false`, count 1. Step 5: `speed 8`, `paused false`, count 1, card still absent.
**Pass Criteria**: Count is 0 at step 1 and exactly 1 at every later read; each clock read matches the values above; the card never reappears.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-07 — The already-active speed still dismisses

**AC covered**: AC-1 (story edge case)
**Coverage**: Hand-walk (R1 always starts from a different speed or pause state)
**Preconditions**: Fixture `opening-card`. Store write `useWorldStore.setState({ paused: false, speed: 2 })`. Card present. Seen count 0. `button[aria-label="CLOCK SPEED 2X"]` has `aria-pressed="true"`.
**Steps**:
1. Click `button[aria-label="CLOCK SPEED 2X"]`.
2. Wait 200 ms.
3. Read `speed`, `paused`, card present, seen count.
**Expected Result**: The clock state is unchanged (2X, running) and the card is gone, seen count 1.
**Pass Criteria**: `speed === 2` AND `paused === false` AND card present `=== false` AND seen count `=== 1`.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-08 — A clock dismissal survives a real save, reload and CONTINUE

**AC covered**: AC-1 ("does not return after a save and reload")
**Coverage**: Hand-walk (R1 has no reload; the unit test uses `captureSave`/`hydrateSave`, not localStorage and the Menu)
**Preconditions**: Fixture `opening-card`. Card present. Seen count 0.
**Steps**:
1. Click Pause/Resume (label `RESUME STRATEGIC CLOCK`, since the fixture is paused). Wait 200 ms. Confirm card absent, count 1.
2. Wait at least 1 s for the autosave. `eval` `localStorage.getItem('nexus-save-v1')`; parse it and read `tutorial.seen`.
3. `reload`. Re-check the viewport is 1280x720. On the Menu click `button[aria-label="CONTINUE SAVED OPERATION // OPEN THE WORLD NETWORK"]`.
4. Wait 700 ms. Read `useAppStore.getState().phase`, card present, seen count. Screenshot `IF019-08-after.png`.
**Expected Result**: The saved blob's `tutorial.seen` contains `hint-worldmap` once. After reload and CONTINUE the World Network opens without the card and the seen set holds the id once.
**Pass Criteria**: `tutorial.seen.filter(id => id === 'hint-worldmap').length === 1` in the blob; at step 4 `phase === 'world'`, card present `=== false`, seen count `=== 1`. If the blob lacks the id after 1 s, record the wait used and fail.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-09 — A Feed row click under the card focuses its sector and leaves the card up

**AC covered**: AC-2
**Coverage**: Covered by R1 probe check: `IF-019 a Feed row click under the card focuses its sector and leaves the card up`
**Preconditions**: Fixture `opening-card`. Card present. At least two `.wm-feed-line` rows exist.
**Steps**:
1. Read `useWorldStore.getState().selected` (before) and the sector named in the second Feed row's `aria-label` (text after `// FOCUS `).
2. Click `.wm-feed-line` nth(1).
3. Wait 200 ms.
4. Read `selected` (after), card present, seen count.
**Expected Result**: Focus moves to the row's sector; the card stays up; `hint-worldmap` is not marked seen.
**Pass Criteria**: Card present `=== true` AND seen count `=== 0` AND `selected` equals the sector id of the row's `// FOCUS` sector. (The R1 check asserts only card present and `selected !== undefined`; the seen count and the sector match are read by hand when this case is executed, see CONCERNS.)
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-10 — Changing Focus from the sector list leaves the card up and unseen

**AC covered**: AC-2
**Coverage**: Hand-walk (no probe check clicks a sector row under the card)
**Preconditions**: Fixture `opening-card`. Card present. Seen count 0. Note `selected`.
**Steps**:
1. Pick an unlocked `.wm-sector` row whose sector differs from `selected` (no `locked` class, `aria-pressed="false"`). Record its `aria-label`.
2. Click it. If Playwright reports the click intercepted by `.wm-onboard`, record that, then try the next unlocked row that is not under the card.
3. Wait 200 ms. Read `selected`, card present, seen count. Screenshot `IF019-10-after.png`.
**Expected Result**: Focus moves to the clicked sector (`aria-pressed="true"` on that row); the card stays; the id is not marked seen.
**Pass Criteria**: `selected` changed to the clicked sector AND card present `=== true` AND seen count `=== 0`. If no unlocked row can be clicked under the card, the case fails and the intercepted rows are listed in Actual Result.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-11 — Esc leaves the card up and does not mark it seen

**AC covered**: AC-2
**Coverage**: Hand-walk (R1 check `IF-018 Esc leaves the card in place` covers the card staying, not the seen set)
**Preconditions**: Fixture `opening-card`. Card present. Seen count 0. Focus on `UNDERSTOOD` (initial focus).
**Steps**:
1. Press `Escape`.
2. Wait 200 ms.
3. Read card present, seen count, `useAppStore.getState().phase`, and whether any overlay opened (`useAppStore.getState().overlay`).
**Expected Result**: The card stays, the id is not marked seen, the phase stays `world`.
**Pass Criteria**: Card present `=== true` AND seen count `=== 0` AND `phase === 'world'`. Record the `overlay` value; an overlay opening is an observation, not a failure of this AC.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-12 — UNDERSTOOD still dismisses after the clock wiring

**AC covered**: Story edge case ("`UNDERSTOOD` still works")
**Coverage**: Hand-walk
**Preconditions**: Fixture `opening-card`. Card present. Seen count 0. Record `paused` and `speed`.
**Steps**:
1. Click `button[aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"]`.
2. Wait 300 ms.
3. Read card present, seen count, `paused`, `speed`.
**Expected Result**: The card is gone, the id is seen once, and the clock is unchanged (UNDERSTOOD is not a clock action).
**Pass Criteria**: Card present `=== false` AND seen count `=== 1` AND `paused` and `speed` equal the values recorded in Preconditions.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF019-13 — New Operation after a clock dismissal shows the card again; the clock dismisses it again

**AC covered**: AC-3
**Coverage**: Hand-walk (R1 builds every state from a cleared store; it never starts a second campaign on top of a dismissal)
**Preconditions**: IF019-08 just passed (or: fixture `opening-card`, click 2X, wait ≥ 1 s so the save holds `hint-worldmap`). Card absent, seen count 1.
**Steps**:
1. `reload`. Re-check the viewport is 1280x720. On the Menu click `NEW OPERATION`, then `CONFIRM // ERASE SAVE?`.
2. Wait 700 ms. Read `phase`, card present, seen count. Screenshot `IF019-13-before.png` after the card fade.
3. Click 4X. Wait 200 ms. Read `speed`, `paused`, card present, seen count.
**Expected Result**: The new campaign opens World Network with the card up and the id unseen. Clock use dismisses it again, once.
**Pass Criteria**: Step 2: `phase === 'world'`, card present `=== true`, seen count `=== 0`. Step 3: `speed === 4`, `paused === false`, card present `=== false`, seen count `=== 1`.
**Actual Result**:
**Pass/Fail**:
