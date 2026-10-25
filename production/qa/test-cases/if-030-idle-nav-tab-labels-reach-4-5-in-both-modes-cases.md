# IF-030 — Idle nav tab labels reach 4.5:1 in both modes: manual test cases

**Story**: `production/epics/interface/story-030-idle-nav-tab-labels-reach-4-5-in-both-modes.md`
**Story type**: UI | **Evidence location**: `production/qa/evidence/` (Sprint 11 run: `production/qa/evidence/sprint-011/`) | **Gate level**: BLOCKING
**Sources**: story Acceptance Criteria and `## QA Test Cases`; `production/qa/qa-plan-sprint-011-2026-10-23.md` (IF-030 checklist, AC-2 guard); `production/qa/qa-strategy-sprint-011-2026-10-24.md` sections 5–6 (F1, F7; IF-030 row)
**Build under test**: HEAD `131a5c1`
**Written**: 2026-10-24 (qa-tester, `/team-qa` Sprint 11 Phase 4)

## Run conditions (all cases)

- Executed by Claude, headless Chrome for Testing via `npx playwright-cli` / playwright-core, viewport exactly **1280x720**, against `npm run dev` on **port 4200**. Never the in-app pane or the user's Chrome.
- State fixtures through the stores, as `production/qa/evidence/sprint-011/probe.mjs` does:
  - **`opening` fixture**: `localStorage.clear()`, reload, `save.startNewOperation()`, `appStore.goto('world')`, `tutorialStore.markSeen('hint-worldmap')` (card dismissed), `worldStore.setState({ paused: true })`. No contract selected, so the Brief tab is **locked** on World Network, Research and Assembly.
  - **Screen entry** (probe `onScreen(phase)`): World Network = stay; Research = `appStore.goto('research')`; Assembly = `appStore.goto('team')`; Brief = `appStore.selectMission('m03')`.
  - **High contrast**: `settingsStore.setHighContrast(true|false)`; confirm `document.documentElement.classList.contains('s-high-contrast')` matches before measuring.
- Contrast = WCAG ratio of the label's computed colour composited over the nav's own background (`.navtab` `background: var(--bg-panel)` = `rgba(7, 16, 15, 0.92)`) on Void `#04070a`, computed by script (probe helper `window.__probe.runs('.navtabs')`). Not the panel value.
- "Idle" = every `.navtab` without class `active`, including the locked Brief tab's `.navtab-label`. The selected (`.active`, teal) tab is excluded from AC-1 measurement.
- Probe output on file (`probe-output.txt`) is from `ad176af` and is stale against HEAD (strategy F1). Cases marked "Covered by R1 probe check" pass only on a **fresh R1 run at HEAD**, not on the stored output.
- Teardown after every session: stop the dev server, confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` empty), close the browser.

## Coverage map

| Case | AC | Execution |
|---|---|---|
| IF030-TC-01 | AC-1 | Covered by R1 probe checks: `IF-030 World Network default: idle labels >= 4.5:1`, `IF-030 World Network high contrast: idle labels >= 4.5:1` |
| IF030-TC-02 | AC-1 | Covered by R1 probe checks: `IF-030 Research default: idle labels >= 4.5:1`, `IF-030 Research high contrast: idle labels >= 4.5:1` |
| IF030-TC-03 | AC-1 | Covered by R1 probe checks: `IF-030 Brief default: idle labels >= 4.5:1`, `IF-030 Brief high contrast: idle labels >= 4.5:1` |
| IF030-TC-04 | AC-1 | Covered by R1 probe checks: `IF-030 Assembly default: idle labels >= 4.5:1`, `IF-030 Assembly high contrast: idle labels >= 4.5:1` |
| IF030-TC-05 | AC-1 (edge: Brief unlocked), AC-2 (aria-current) | Hand-walk |
| IF030-TC-06 | AC-1 (edge: `NO CONTRACT SELECTED` observation) | Hand-walk |
| IF030-TC-07 | AC-2 (takes the HC remap) | Covered by R1 probe checks: `IF-030 <Screen>: idle labels take the high-contrast remap` x4 (World Network, Research, Brief, Assembly) |
| IF030-TC-08 | AC-2 (`aria-current="page"`) | Covered by R1 probe checks: `IF-030 <Screen> <default\|high contrast>: one tab aria-current="page"` x8 |
| IF030-TC-09 | AC-2 (cause recorded in the commit message; strategy F7) | Hand-walk (`git log` search) |

Brief **locked** edge case is exercised inside TC-01, TC-02 and TC-04 (the `opening` fixture has no contract, so the locked Brief tab's label is in the idle set). Brief **unlocked** as an idle tab is not in the probe and is TC-05.

---

## IF030-TC-01 — World Network: idle labels >= 4.5:1, default and high contrast

**AC covered**: AC-1 (incl. edge: Brief locked; selected tab excluded)
**Execution**: Covered by R1 probe checks: `IF-030 World Network default: idle labels >= 4.5:1`; `IF-030 World Network high contrast: idle labels >= 4.5:1`
**Preconditions**: Dev server on 4200 at HEAD `131a5c1`; headless browser at 1280x720; `opening` fixture applied; phase `world`; high contrast off.
**Steps**:
1. Confirm `appStore.phase === 'world'` and the `.navtab.active` label reads `WORLD NETWORK`.
2. Confirm the Brief tab has class `locked` and its `.navtab-cond` reads `NO CONTRACT SELECTED`.
3. With high contrast off (`s-high-contrast` absent on `:root`), install the probe helpers and, for each `.navtab` without `active`, read the `.navtab-label` text, computed `color` and composited ratio from `window.__probe.runs('.navtabs')`.
4. Call `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` is on `:root`, re-install helpers, repeat step 3.
5. Capture `if-030-nav-world-hc.png` at 1280x720 in high contrast.
**Expected Result**: Three idle labels (RESEARCH, BRIEF (locked), ASSEMBLY) are measured in each mode; each ratio is >= 4.5:1 in default and in high contrast. WORLD NETWORK (active) is not in the measured set.
**Pass criteria**: idle set has exactly 3 entries in each mode, none is `WORLD NETWORK`, and every ratio >= 4.50. Any ratio < 4.50, a missing ratio, or an active tab in the set = Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-02 — Research: idle labels >= 4.5:1, default and high contrast

**AC covered**: AC-1 (incl. edge: Brief locked; selected tab excluded)
**Execution**: Covered by R1 probe checks: `IF-030 Research default: idle labels >= 4.5:1`; `IF-030 Research high contrast: idle labels >= 4.5:1`
**Preconditions**: As TC-01, then `appStore.goto('research')`, wait 500 ms; high contrast off.
**Steps**:
1. Confirm `appStore.phase === 'research'` and the `.navtab.active` label reads `RESEARCH`.
2. Confirm the Brief tab has class `locked`.
3. High contrast off: read each idle `.navtab-label` text, computed `color` and composited ratio over the nav background.
4. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`, repeat step 3.
5. Capture `if-030-nav-research-hc.png` in high contrast.
**Expected Result**: WORLD NETWORK, BRIEF (locked), ASSEMBLY each >= 4.5:1 in both modes; RESEARCH excluded.
**Pass criteria**: 3 idle entries per mode, none is `RESEARCH`, every ratio >= 4.50; otherwise Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-03 — Brief: idle labels >= 4.5:1, default and high contrast

**AC covered**: AC-1 (selected tab excluded)
**Execution**: Covered by R1 probe checks: `IF-030 Brief default: idle labels >= 4.5:1`; `IF-030 Brief high contrast: idle labels >= 4.5:1`
**Preconditions**: As TC-01, then `appStore.selectMission('m03')`, wait 500 ms; high contrast off.
**Steps**:
1. Confirm `appStore.phase === 'brief'` and the `.navtab.active` label reads `BRIEF`; no tab has class `locked`.
2. High contrast off: read each idle `.navtab-label` text, computed `color` and composited ratio.
3. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`, repeat step 2.
4. Capture `if-030-nav-brief-hc.png` in high contrast.
**Expected Result**: WORLD NETWORK, RESEARCH, ASSEMBLY each >= 4.5:1 in both modes; BRIEF excluded.
**Pass criteria**: 3 idle entries per mode, none is `BRIEF`, every ratio >= 4.50; otherwise Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-04 — Assembly: idle labels >= 4.5:1, default and high contrast

**AC covered**: AC-1 (incl. edge: Brief locked; selected tab excluded)
**Execution**: Covered by R1 probe checks: `IF-030 Assembly default: idle labels >= 4.5:1`; `IF-030 Assembly high contrast: idle labels >= 4.5:1`
**Preconditions**: As TC-01, then `appStore.goto('team')`, wait 500 ms; high contrast off.
**Steps**:
1. Confirm `appStore.phase === 'team'` and the `.navtab.active` label reads `ASSEMBLY`.
2. Confirm the Brief tab has class `locked`.
3. High contrast off: read each idle `.navtab-label` text, computed `color` and composited ratio.
4. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`, repeat step 3.
5. Capture `if-030-nav-team-hc.png` in high contrast.
**Expected Result**: WORLD NETWORK, RESEARCH, BRIEF (locked) each >= 4.5:1 in both modes; ASSEMBLY excluded.
**Pass criteria**: 3 idle entries per mode, none is `ASSEMBLY`, every ratio >= 4.50; otherwise Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-05 — Brief unlocked as an idle tab: >= 4.5:1, remap and aria-current on three Screens

**AC covered**: AC-1 (edge: Brief unlocked), AC-2 (remap and `aria-current` in this state)
**Execution**: Hand-walk (the R1 probe measures the Brief tab only while locked or while selected)
**Preconditions**: As TC-01 (`opening` fixture), then `appStore.selectMission('m03')` so a contract is selected; high contrast off.
**Steps**:
1. `appStore.goto('world')`, wait 500 ms. Confirm phase `world` and that the Brief tab has neither `locked` nor `active` and its `aria-disabled` is absent (contract still selected). If the Brief tab is locked again, stop and record "selection not retained across goto" as the Actual Result (the state cannot be reached this way; flag to qa-lead).
2. High contrast off: for every idle `.navtab-label` (WORLD NETWORK excluded), read text, computed `color` and composited ratio over the nav background.
3. Read `aria-current` on all four `.navtab` elements.
4. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`; repeat steps 2–3.
5. Capture `if-030-brief-open-world-hc.png` at 1280x720.
6. `setHighContrast(false)`; repeat steps 2–5 after `appStore.goto('research')` (capture `if-030-brief-open-research-hc.png`), then after `appStore.goto('team')` (capture `if-030-brief-open-team-hc.png`).
**Expected Result**: On each of World Network, Research and Assembly, the unlocked BRIEF label and the other idle labels are >= 4.5:1 in both modes; each idle label's computed colour differs between default and high contrast; exactly one tab (the current Screen's, class `active`) carries `aria-current="page"` and the other three have none.
**Pass criteria**: For all 3 Screens x 2 modes: every idle ratio >= 4.50; idle colours default != high contrast for every label; count of `aria-current="page"` == 1 and it is on the `.active` tab. Any miss = Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-06 — `NO CONTRACT SELECTED` condition text ratio (observation)

**AC covered**: AC-1 (edge: `NO CONTRACT SELECTED` reported as an observation only)
**Execution**: Hand-walk (the R1 probe does not report this run)
**Preconditions**: `opening` fixture (Brief locked); phase `world`; high contrast off.
**Steps**:
1. Locate `.navtab.locked .navtab-cond`; confirm its text is `NO CONTRACT SELECTED`.
2. High contrast off: read its computed `color`, `font-size`, and composited ratio over the nav background (same helper as TC-01).
3. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`; repeat step 2.
4. Repeat steps 2–3 on Research (`goto('research')`) and Assembly (`goto('team')`).
**Expected Result**: Colour, size and ratio recorded for 3 Screens x 2 modes. No threshold applies (story: observation only). A value < 4.5:1 is written as an observation for the qa-lead, not a Fail of IF-030.
**Pass criteria**: All six readings recorded in Actual Result (Pass = recorded; Fail = any reading missing).
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-07 — Idle labels take the high-contrast remap on all four Screens

**AC covered**: AC-2 (idle labels take the high-contrast remap)
**Execution**: Covered by R1 probe checks: `IF-030 World Network: idle labels take the high-contrast remap`; `IF-030 Research: ...`; `IF-030 Brief: ...`; `IF-030 Assembly: ...`
**Preconditions**: As TC-01 to TC-04 (each Screen entered from a fresh `opening` fixture).
**Steps**:
1. For each Screen (World Network, Research, Brief, Assembly): with high contrast off, record the computed `color` of every idle `.navtab-label`.
2. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`, record the same labels' computed `color`.
3. Compare the two lists per Screen.
4. Record the observed values against the palette: `--ink` default `#b8d8cf` = `rgb(184, 216, 207)`; `--ink` under `:root.s-high-contrast` `#e2f6ee` = `rgb(226, 246, 238)` (`src/index.css` lines 16, 51).
**Expected Result**: On every Screen, each idle label's colour in high contrast differs from its default colour (the label takes the remap). Per the story's implementation (`.navtab` `color: var(--ink)`), default reads `rgb(184, 216, 207)` and high contrast `rgb(226, 246, 238)`.
**Pass criteria**: For all 4 Screens, the default colour list != the high-contrast colour list, and no idle label keeps the same colour in both modes. Token-value match in step 4 is recorded; a differing-but-unexpected value is a CONCERN to qa-lead, not a Fail of this criterion.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-08 — Exactly the current Screen's tab carries `aria-current="page"`

**AC covered**: AC-2 (selected tab still carries `aria-current="page"`)
**Execution**: Covered by R1 probe checks: `IF-030 <Screen> default: one tab aria-current="page"` and `IF-030 <Screen> high contrast: one tab aria-current="page"` for World Network, Research, Brief, Assembly (8 checks)
**Preconditions**: As TC-01 to TC-04.
**Steps**:
1. On each Screen, high contrast off: read `getAttribute('aria-current')` on all four `.navtab` elements and note which has class `active`.
2. `setHighContrast(true)`, wait 200 ms, confirm `s-high-contrast` on `:root`; repeat step 1.
**Expected Result**: In each of the 8 Screen x mode combinations exactly one tab has `aria-current="page"`; it is the `.active` tab and its label names the current Screen (WORLD NETWORK / RESEARCH / BRIEF / ASSEMBLY). The other three tabs (including the locked Brief tab) have no `aria-current`.
**Pass criteria**: 8/8 combinations have count == 1 and the attribute is on the `.active` tab matching the Screen; otherwise Fail.
**Actual Result**:
**Pass/Fail**:

---

## IF030-TC-09 — The traced cause of the as-built non-remap is in a commit message

**AC covered**: AC-2 (cause traced and recorded in the commit message); strategy F7
**Execution**: Hand-walk (`git log` search; no browser)
**Preconditions**: Repository at HEAD `131a5c1` on `main`. Cause per the story's Completion Notes, to compare against: "not a defect — re-measured on the as-built code, the label is `rgb(93,125,117)` by default and remaps to `rgb(157,195,184)` under high contrast; the 2026-10-23 spec reading was a measurement error and the spec row is corrected. The real failure was 4.29:1 in default mode." Strategy F7 records that a grep of `05c7bd7`'s message for "high contrast / remap / cause" found no match.
**Steps**:
1. `git log --oneline -i --grep='IF-030' 131a5c1` — list commits naming the story.
2. `git log --oneline -- production/epics/interface/story-030-idle-nav-tab-labels-reach-4-5-in-both-modes.md` and `git log --oneline -S'navtab' -- src/ui/ui.css` — list commits that touched the story or the nav CSS.
3. For each commit from steps 1–2 dated 2026-10-23 or later (at minimum `05c7bd7`), run `git show -s <sha>` and search the message case-insensitively for `high.contrast`, `remap`, `measurement error`, `cause`, `nav` (use a regex that matches both "high contrast" and "high-contrast").
4. `git log -i -E --grep='high.contrast|remap|measurement error' --format='%h %s' 131a5c1` as a repository-wide sweep.
5. Quote every matching line verbatim in Actual Result, with its commit SHA.
**Expected Result**: At least one commit message on `main` up to `131a5c1` states, for the IF-030 idle nav labels, what the trace found: that the labels do take the high-contrast remap (the earlier non-remap reading was a measurement error) and/or the actual cause, recognisably matching the Completion Notes.
**Pass criteria**: Pass = a quoted commit-message line that (a) refers to the nav labels or IF-030 and (b) states the traced cause or the measurement-error finding. Fail = no such line. If a line exists but is ambiguous about which nav element it covers (e.g. names the locked row rather than idle labels), record Pass/Fail as **CONCERN — qa-lead ruling** with the quote.
**Actual Result**:
**Pass/Fail**:

---

## Evidence to retain

- `if-030-nav-{world,research,brief,team}-hc.png` (TC-01 to TC-04), `if-030-brief-open-{world,research,team}-hc.png` (TC-05), 1280x720.
- Fresh R1 `probe-output.txt` at HEAD with the IF-030 lines (TC-01 to TC-04, TC-07, TC-08); the run's README states the build commit.
- TC-06 readings and TC-09 quotes in the run README.
