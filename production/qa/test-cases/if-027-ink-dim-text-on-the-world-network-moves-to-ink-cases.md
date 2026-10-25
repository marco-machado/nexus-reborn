# Test Cases: IF-027 — Ink Dim text on the World Network moves to Ink

**Story**: `production/epics/interface/story-027-ink-dim-text-on-the-world-network-moves-to-ink.md`
**Story Type**: UI
**Gate Level**: BLOCKING (UI: retained screenshot of each screen touched). The QA strategy also lists IF-027 as "Yes until re-run on HEAD" (`production/qa/qa-strategy-sprint-011-2026-10-24.md` §2, F1).
**Output location for evidence**: the fresh R1 run folder `production/qa/evidence/sprint-011-head-2026-10-24/` (strategy §4 step 2). The story's own Test Evidence names `production/qa/evidence/if-027/`; the run README should map IF-027 to the captures in the R1 folder (strategy F10).
**Sources**: story Acceptance Criteria and `## QA Test Cases`; `production/qa/qa-plan-sprint-011-2026-10-23.md` line 127–129 (IF-027); strategy §5 (F1, F2, F8, F10) and §6 (IF-027 row); `production/session-logs/decision-log.md` line 387 (IF-036 ruling).
**Build under test**: HEAD `131a5c1`
**Author**: qa-tester, 2026-10-24

## Execution environment (all cases)

- Claude runs every case headless: `npx playwright-cli` / Chrome for Testing, viewport exactly 1280x720, against `npm run dev` on port 4200. No headed window.
- State fixtures are set through the stores, as `production/qa/evidence/sprint-011/probe.mjs` does. Fixture names below are the probe's `STATES` keys: `opening-card`, `opening`, `garrison-secure`, `garrison-strained`, `garrison-critical`, `pressure`, `crisis`, `review`, `failed`, `influence-note`, `intel2` (11 states). `opening` = localStorage clear, `save.startNewOperation()`, `goto('world')`, card dismissed via `markSeen('hint-worldmap')`, clock paused.
- Measurement method: the probe's in-page `window.__probe.runs('.screen')` (text node walk; computed colour; effective alpha = ancestor opacity x colour alpha; ratio composited over ancestors' solid backgrounds on Void `#04070a`). Hand-walk cases reuse these helpers by installing the same `HELPERS` block.
- Colour literals: Ink Dim `rgb(93, 125, 117)`; Ink `rgb(184, 216, 207)`.
- AC-1 is a default-mode criterion: high contrast off in every case unless stated.
- After the session: stop the dev server, confirm nothing listens on port 4200, close the test browser.

## Coverage map

| Case | AC | Kind |
|---|---|---|
| TC-IF027-01 | AC-1 (no Ink Dim run) | Covered by R1 probe check: `IF-027 <state>: no text in Ink Dim` |
| TC-IF027-02 | AC-1 (≥4.5:1 as rendered) | Covered by R1 probe check: `IF-027 <state>: every text run >= 4.5:1 as rendered` |
| TC-IF027-03 | AC-1 (each former Ink Dim run is Ink) | Hand-walk |
| TC-IF027-04 | AC-1 edge case (disabled Influence status words) | Hand-walk |
| TC-IF027-05 | AC-1 (runs the probe does not measure) | Hand-walk |
| TC-IF027-06 | AC-2 (`--ink-dim` unchanged in both palette files; supersession recorded) | Hand-walk |

---

## Test Case: TC-IF027-01 — No World Network text run renders in Ink Dim (11 states)

**AC covered**: AC-1 ("no World Network text run renders in Ink Dim")
**Coverage**: Covered by R1 probe check: `IF-027 <state>: no text in Ink Dim` (one line per state, 11 lines)
**Preconditions**:
- `npm run dev` serving HEAD `131a5c1` on port 4200.
- High contrast off, text scale 100 (probe defaults for this loop).
- Fresh output folder `production/qa/evidence/sprint-011-head-2026-10-24/` exists or will be created by the run.

**Steps**:
1. Run `PROBE_URL=http://localhost:4200/ PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/ node production/qa/evidence/sprint-011/probe.mjs`.
2. In `probe-output.txt`, read the 11 lines `IF-027 <state>: no text in Ink Dim` for `opening-card`, `opening`, `garrison-secure`, `garrison-strained`, `garrison-critical`, `pressure`, `crisis`, `review`, `failed`, `influence-note`, `intel2`.
3. Confirm the matching captures `state-<name>.png` exist in the output folder and are 1280x720.
4. Confirm the run's last lines read `no console or page errors` and `ALL PASS`.

**Expected Result**: All 11 lines PASS; no text run under `.screen` has computed colour `rgb(93, 125, 117)` in any state; 11 state captures at 1280x720; no console or page errors.
**Pass Criteria**: 11 of 11 `IF-027 ... no text in Ink Dim` lines read PASS AND the run reports no console or page errors. Any FAIL line fails the case; file it with `/bug-report` quoting the line's detail (text and DOM path). Do not edit the script (strategy §4 step 3).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: TC-IF027-02 — Every World Network text run ≥4.5:1 as rendered (11 states)

**AC covered**: AC-1 ("reaches ≥4.5:1")
**Coverage**: Covered by R1 probe check: `IF-027 <state>: every text run >= 4.5:1 as rendered` (11 lines)
**Preconditions**:
- Same R1 run as TC-IF027-01 (one run serves both cases).
- The orientation card must be settled, not mid-fade, when `opening-card` is measured (strategy §4 step 1; F2: "14 low-contrast hits when measured first in a batch (orientation card mid fade), unresolved").

**Steps**:
1. In the R1 `probe-output.txt`, read the 11 lines `IF-027 <state>: every text run >= 4.5:1 as rendered`.
2. For each PASS line, record the reported minimum (`min N:1`).
3. If any line FAILs on `opening-card` or `opening`, re-measure that state alone: load the fixture, wait until the card's computed `opacity` is `1` (or the card is gone, for `opening`), install the helpers, run `window.__probe.runs('.screen').filter(r => r.ratio < 4.5)`. Record both results; do not discard either (strategy §4 step 1).

**Expected Result**: All 11 lines PASS; each reported minimum is ≥4.5:1.
**Pass Criteria**: 11 of 11 lines PASS. A FAIL that also reproduces in the settled re-measure is a defect (file with `/bug-report`). A FAIL that occurs only mid-fade is recorded as a finding against IF-036/F2 with both measurements; the case is then marked FAIL pending a qa-lead ruling on whether a mid-fade frame counts as "rendered".
**Actual Result**:
**Pass/Fail**:

---

## Test Case: TC-IF027-03 — Each former Ink Dim run now renders in Ink

**AC covered**: AC-1 ("every text run that used Ink Dim (spec Contrast table) ... uses Ink")
**Coverage**: Hand-walk. The R1 probe asserts "not Ink Dim" and "≥4.5:1"; it does not assert that the former Ink Dim runs are Ink `rgb(184, 216, 207)`, which the story's pass condition requires.
**Preconditions**:
- Dev server on port 4200 at HEAD; headless browser at 1280x720; probe `HELPERS` installed after each state change.
- High contrast off; text scale 100.
- Target list = spec Contrast table row "Ink Dim" (`design/ux/world-network.md` line 455). Locked contract rows are out of scope (IF-029).

**Steps**:
1. Load fixture `opening`. Select Europe with the probe's `sector('eu', {})` (no patch), so the sector panel and OPEN CONTRACTS list Europe, including the opening generated offer if it is posted there (confirm in-run; if it is in another sector, select that sector for step 6).
2. Run `window.__probe.runs('.screen')` and, for each target below, locate its run(s) by text and DOM path; record computed colour, effective alpha and ratio.
3. Sector list and panel: sector reading labels; `CONTROL` and `UNREST` labels; every key-value label (TAX YIELD, TAX PAID, GARRISON, and the others shown); the `TAX PAID` value when it reads `NO // NOT NEXUS-HELD` (select a sector Nexus does not hold if Europe shows YES).
4. Influence: each action's status word (`.wm-act-status`) that is not `ACTIVE` and not `CLEAR`.
5. Forecast: the `EVENT FORECAST` label and the gate text (`.wm-fc-lock`) at intel 1.
6. OPEN CONTRACTS: an open row's `TYPE // CITY` line (`.wm-op-main i` on a non-locked row); its chips (`.wm-op-meta .chip`: chance, `ETA nD`, and on the generated offer `GENERATED` and `EXPIRY`); the panel's `n / m` count; and, if the selected sector has no contracts, `SECTOR UNDER PASSIVE MONITORING`.
7. Time controls: the `CLOCK SPEED` label.
8. Scan: the Control key head `SECTORS` and each Control key name (`.wm-key-name`); the fiction chrome `SAT-16E // LIVE` and the focus sector's holder name under the sector title (`.wm-ov .dim`).
9. Subtitle(s): the screen subtitle and the Feed header `FEED CLEAR` / unread readout when it reads `FEED CLEAR`.
10. Load fixture `intel2` and repeat step 5 for the forecast label (the gate text is absent at intel 2; record that).
11. Capture `if-027-ink-runs-opening.png` after step 9 and `if-027-ink-runs-intel2.png` after step 10.

**Expected Result**: Every target run in steps 3–10 has computed colour `rgb(184, 216, 207)`, effective alpha 1 (or, where below 1, a ratio still ≥4.5:1), and ratio ≥4.5:1. The story's context gives Ink at 12.27:1 or better on the panel.
**Pass Criteria**: Every listed target that is present on screen is `rgb(184, 216, 207)` AND ≥4.5:1. A target that is absent in its state is recorded "absent" with the state, not passed. A target in a colour other than Ink or Ink Dim (for example Print White, teal, Red Hot from a neighbouring story's tone rule) is recorded with its colour and checked against the spec and the owning story before it is called a defect (it is not Ink Dim, so TC-IF027-01 still holds); the case then reads FAIL pending that check, not PASS.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: TC-IF027-04 — Disabled Influence status words are Ink and ≥4.5:1

**AC covered**: AC-1, story Edge case "disabled Influence status words"
**Coverage**: Hand-walk. The R1 sweep includes these runs inside the `opening` and `influence-note` states but does not name them; this case reads them out explicitly, including the disabled button's ancestor opacity.
**Preconditions**:
- Dev server on port 4200 at HEAD; 1280x720 headless; high contrast off; text scale 100; helpers installed.
- Note: IF-036's ruling exempts inactive *controls* per WCAG 1.4.3 (decision log line 387). This story's QA Test Cases explicitly list the disabled Influence status words as a case, so they are measured and held to 4.5:1 here; if the result is below 4.5:1, record the conflict for qa-lead rather than applying the exemption silently.

**Steps**:
1. Load fixture `opening`. Record the header Influence value (the New Operation starting value; not asserted here). Select a sector that shows the Influence actions. If no action is disabled at that value, set `useWorldStore.setState({ influence: 0 })` so the numbered actions are unaffordable, and record that assist.
2. For each `.wm-act` button, read `disabled`, the status word text (`.wm-act-status`), its computed colour, the computed `opacity` of the button and of every ancestor up to `.screen`, the effective alpha and the composited ratio from `window.__probe.runs`.
3. Load fixture `influence-note` (Influence 8, `selected: 'na'`). Repeat step 2; record which buttons are enabled and which remain disabled.
4. Capture `if-027-influence-disabled.png` (step 2) and `if-027-influence-note.png` (step 3).

**Expected Result**: Every status word that is not `ACTIVE`/`CLEAR`, on a disabled or an enabled button, is `rgb(184, 216, 207)` and ≥4.5:1 as rendered, with any ancestor opacity included.
**Pass Criteria**: 100% of the recorded non-ACTIVE, non-CLEAR status words are `rgb(184, 216, 207)` AND ≥4.5:1. At least one disabled button is measured (if none is disabled in either state, record the case BLOCKED on fixture and report it).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: TC-IF027-05 — Text the probe does not measure

**AC covered**: AC-1 ("every text run ... measured as rendered"; "no World Network text run renders in Ink Dim")
**Coverage**: Hand-walk. `window.__probe.runs` skips text inside `<svg>` and runs at effective alpha 0 (hover tips while hidden), and the R1 loop measures root `.screen` only.
**Preconditions**:
- Dev server on port 4200 at HEAD; 1280x720 headless; high contrast off; helpers installed.

**Steps**:
1. Load fixture `opening`. Count SVG text: `document.querySelectorAll('.screen svg text, .screen svg tspan').length`. Record the count and, if non-zero, each node's text and computed `fill`.
2. Count World Network text outside `.screen`: walk text nodes of `document.body` whose element is visible and not inside `.screen`; record any found (text, computed colour).
3. List hover tips: `document.querySelectorAll('.screen .tip')`. For each (up to 5 distinct), hover its owner with `page.mouse` / `playwright-cli hover`, wait for the tip's effective alpha to reach 1, then measure the tip's text runs (colour, ratio). If there are none, record "no .tip on World Network".
4. Repeat steps 1–3 in fixture `intel2` (forecast rows render at intel 2).
5. Capture `if-027-tip-hover.png` with one tip shown (skip only if step 3 found none, and say so).

**Expected Result**: SVG text count 0 (or every SVG text fill is Ink and ≥4.5:1); no visible World Network text outside `.screen` in Ink Dim; every shown tip's text is not Ink Dim and is ≥4.5:1.
**Pass Criteria**: Zero runs found in steps 1–4 with colour/fill `rgb(93, 125, 117)` (or `#5d7d75`) AND zero runs below 4.5:1.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: TC-IF027-06 — `--ink-dim` unchanged in both palette files (AC-2, partly superseded)

**AC covered**: AC-2
**Coverage**: Hand-walk (file read and `git diff`; no browser).
**Supersession (recorded)**: AC-2's clause "GIVEN Research, Brief and Assembly WHEN rendered THEN their text colours are unchanged" is **superseded by IF-036**. Owner ruling 2026-10-23, `production/session-logs/decision-log.md` line 387: "extend: Ink Dim / Ink Faint text → Ink, 10 px floor, 24×24 targets, everywhere (IF-036); inactive controls exempt per WCAG 1.4.3". Strategy F8 records the same. The QA plan's "probe diff against a pre-change capture" for those Screens is therefore not run. Implementation history, for the record: IF-027 shipped as the scoped override `.wm { --ink-dim: var(--ink); }` in `05c7bd7`; IF-036 (`d40bff5`) removed it and changed the shared rules to `.chip.dim { color: var(--ink); }` (`src/ui/ui.css:181`) and `.dim { color: var(--ink); }` (`src/ui/ui.css:465`). The clause ".dim / .chip.dim change scoped to World Network selectors" no longer holds at HEAD by design of IF-036; it is not tested here (see the caller's CONCERNS line).
**Preconditions**:
- Repository at HEAD `131a5c1`, clean for `src/index.css` and `src/ui/tokens.ts`.
- Baseline value from the story Context: Ink Dim `#5d7d75`. Pre-story baseline commit: `05c7bd7^` (parent of the IF-016..035 commit).

**Steps**:
1. `rg -n -- '--ink-dim' src/index.css` and record every line.
2. `rg -n 'INK_DIM\b' src/ui/tokens.ts` and record the line.
3. `git diff 05c7bd7^ 131a5c1 -- src/index.css src/ui/tokens.ts` and record every changed line that mentions `ink-dim` or `INK_DIM`.

**Expected Result**:
- Step 1: `:root` declares `--ink-dim: #5d7d75;` (line 17); the high-contrast remap `:root.s-high-contrast` declares `--ink-dim: #9dc3b8;` (line 52). No other declaration of `--ink-dim` in `src/index.css`.
- Step 2: `export const INK_DIM = '#5d7d75'` (line 20).
- Step 3: no changed line touches `--ink-dim` or `INK_DIM` itself. Known, pre-checked: the diff removes `INK_DIM_A9 = 'rgba(93, 125, 117, 0.9)'` (removed in `d40bff5`, IF-036); `INK_DIM_A7` and `INK_DIM_A8` remain. That is an alpha-variant constant, not the `INK_DIM` token, and does not fail this case; record it in Actual Result.

**Pass Criteria**: `--ink-dim` in `src/index.css` `:root` equals `#5d7d75` AND `INK_DIM` in `src/ui/tokens.ts` equals `#5d7d75` AND the step 3 diff shows no change to either declaration (the `INK_DIM_A9` removal recorded, not counted).
**Actual Result**:
**Pass/Fail**:
