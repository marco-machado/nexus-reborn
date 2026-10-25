# IF-038 — Spec-review findings: label in name, Debrief Balance and invoice, no overlapping boxes — Manual test cases

**Story**: `production/epics/interface/story-038-spec-review-and-overlap-fixes.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/sprint-011-head-2026-10-24/` (fresh R2 / R3 / R4 outputs + PNGs at 1280x720; hand-walk captures go next to them) | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: HEAD `131a5c1`
**Scope**: story Acceptance Criteria AC-1, AC-2, AC-3 and its `## QA Test Cases`; QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 4 (R2, R3, R4), § 5 (F1), § 6 (IF-038 rows, H9, H10).
**Out of scope**: type size, contrast, target size and clip counts in general (IF-036 / IF-037); focus trap and restore outside the Debrief Balance (IF-037 AC-2).

## Common setup

- `npm run dev -- --strictPort` on http://localhost:4200. Headless Chrome for Testing (the `playwright-core` + `CHROME` path the R2 script uses, or `npx playwright-cli`), never the user's Chrome. Viewport exactly 1280x720 unless the case says otherwise. Stop the server and confirm port 4200 is free afterwards.
- **R2** = `production/qa/evidence/screens-2026-10-23/sweep.mjs`; **R3** = `production/qa/evidence/screens-2026-10-23/focus.mjs`; **R4** = `production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs`. Run each with `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/<run>/` so the committed outputs are not overwritten. The committed outputs date from before HEAD (strategy § 1, F1) and are not evidence for this build.
- R2 / R4 per-surface output lines (in `sweep-output.txt`, detail in `sweep-<surface>.json`): `label-in-name: N` (measured once, at 100% text scale, default palette) and `clip @90/@100/@110/@125: N`. The `clip @N` list includes `boxoverlap <A> x <B> WxH` entries: absolutely or fixed-positioned elements that hold text, are siblings (same parent), and intersect by more than 2x2 px. The world surface excludes `.wm-map-wrap`, `.hud-menu-wrap`, `.tip`, `.globe-view` from the clip and overlap checks.
- R2 label-in-name rule (as coded): for each visible `button, a[href], [role="button"], [role="slider"]` with an `aria-label`, take the first line of `innerText` that contains a letter and has more than one character; normalise both strings (upper case, runs of anything other than A-Z, 0-9 and % become one space); the label must contain the visible line as whole words.
- Hand-walk helper: copy R2's `HELPERS` into the page (`page.evaluate(HELPERS)`) to get `window.__probe.clipped(root)`; use the R2 `labelInName` expression from `measure()` verbatim where a hand-walk case asks for a label-in-name read.
- Fixtures (all in the scripts, quoted by name): R2 `SURFACES.<name>` (`world`, `menu`, `settings`, `research`, `brief`, `team`, `debrief`, `mission`, `pause`, `balance`); R4 adds `hold`, `debriefkia`; R1 probe `production/qa/evidence/sprint-011/probe.mjs` `STATES.opening`, `STATES.failed`, `STATES['influence-note']`.
- Text scale via `useSettingsStore.getState().setTextScale(n)` (n in 90 / 100 / 110 / 125); wait 300 ms after each change.
- Tokens: Red Hot `--red-hot: #ff6b55` = `rgb(255, 107, 85)`; Amber `--amber: #f0b445` = `rgb(240, 180, 69)`; `--bg-panel: rgba(7, 16, 15, 0.92)` (`src/index.css`).

## AC map

| AC | Cases |
|---|---|
| AC-1 — label in name on every surface; the 14 listed controls start with their visible label | IF-038-01 .. -12 |
| AC-2 — Debrief Balance Escape + focus return; invoice region `Mission invoice` with the cut-edge fade; CAMPAIGN FAILED banner `role="status"` | IF-038-13 .. -16 |
| AC-3 — no positioned text box covers another at 1280x720 and four scales; Brief recon column on panel ground; inset tag clears steppers; HUD toasts clear the weapons bar; comms panel gives back width (also at <=1360 px); write-failure notice Red Hot on red frame, no amber | IF-038-17 .. -24 |

## Coverage summary

| Case | Coverage |
|---|---|
| 01, 03, 05, 06, 07, 08, 10, 11 | R2 `label-in-name` (10 also R4) |
| 13, 14 | R3 |
| 17, 20, 21, 24 | R2 `clip @N` boxoverlap (+ R4 where named) |
| 02, 04, 09, 12, 15, 16, 18, 19, 22, 23 | Hand-walk |

---

## AC-1 — Label in Name (WCAG 2.2 SC 2.5.3)

## Test Case: IF-038-01 — World Network: orientation card UNDERSTOOD and `n UNREAD`

**AC covered**: AC-1 (UNDERSTOOD, 1 of 3; `n UNREAD`)
**Coverage**: Covered by R2 check: `label-in-name` on surface `world`
**Preconditions**: Common setup. R2 `SURFACES.world`: New Operation, orientation card (`hint-worldmap`) unseen, `influence: 8`, `selected: 'na'`, `unread: 2`.
**Steps**:
1. Run R2 with `SURFACES=world` (or the full run).
2. Read the `## world` block of the fresh `sweep-output.txt`, line `label-in-name: N`.
3. In `sweep-world.json` → `def.labelInName`, confirm the array is empty.
4. In the same page state, confirm the two controls exist: `button[aria-label="UNDERSTOOD // DISMISS THE ORIENTATION"]` and `button[aria-label^="2 UNREAD"]` (visible text starts `2 UNREAD`).
**Expected Result**: `label-in-name: 0`; both controls are present and visible, so the 0 is not vacuous.
**Pass Criteria**: N = 0 AND both selectors match one visible element each.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-02 — World Network: Influence note UNDERSTOOD

**AC covered**: AC-1 (UNDERSTOOD, 2 of 3)
**Coverage**: Hand-walk (R2's world state also has the orientation card up; whether `.wm-moment-btn` is visible under it is not established, so the note is walked in the probe state that is known to show it)
**Preconditions**: Common setup. R1 probe `STATES['influence-note']`: `fresh()`, `dismissCard()`, `pause()`, then `useWorldStore.setState({ influence: 8, selected: 'na' })`; wait 500 ms.
**Steps**:
1. Confirm `.wm-moment-btn` is visible and its `aria-label` is `UNDERSTOOD // DISMISS THE INFLUENCE NOTE`.
2. Run the R2 `labelInName` expression over the page.
3. Read the button's first visible line with letters (expected `UNDERSTOOD`).
**Expected Result**: The `labelInName` array is empty; the visible line `UNDERSTOOD` is the first word of the accessible name.
**Pass Criteria**: array length = 0 AND `aria-label` normalised starts with `UNDERSTOOD `.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-03 — Assembly: RECRUIT + (n/8), Item slots, DEPLOY TEAM

**AC covered**: AC-1 (RECRUIT, 1 of 2; Item slots; DEPLOY TEAM)
**Coverage**: Covered by R2 check: `label-in-name` on surface `team`
**Preconditions**: Common setup. R2 `SURFACES.team` (Rust Haven `m03` selected, `goto('team')`), New Operation roster (8/8).
**Steps**:
1. Run R2 (surface `team`).
2. Read `label-in-name: N` in the `## team` block and `def.labelInName` in `sweep-team.json`.
3. In the same state, confirm presence: `.ts-recruit-btn` (label `RECRUIT + (8/8) // OPEN THE RECRUITMENT MARKET`), the item slot buttons (labels end `// ITEM SLOT <n> // CYCLE`; selector: locate at run time under the ITEM SLOTS header), and the deploy CTA (label starts `DEPLOY TEAM // `).
**Expected Result**: `label-in-name: 0`; every named control is present.
**Pass Criteria**: N = 0 AND RECRUIT +, at least one item slot, and DEPLOY TEAM each found visible.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-04 — Assembly with an empty roster: RECRUIT >>

**AC covered**: AC-1 (RECRUIT, 2 of 2)
**Coverage**: Hand-walk (no R2/R4 surface empties the roster)
**Preconditions**: Common setup. R2 `SURFACES.team`, then `useCampaignStore.setState({ operatives: [] })` (`/src/state/campaignStore.ts`); wait 400 ms. The screen shows `ROSTER EMPTY`.
**Steps**:
1. Confirm `.ts-none` is visible and holds a `button.cta` with `aria-label="RECRUIT // OPEN THE RECRUITMENT MARKET"` and visible text `RECRUIT >>`.
2. Run the R2 `labelInName` expression.
3. Capture `if-038-04-roster-empty.png`.
**Expected Result**: Array empty. Visible line `RECRUIT >>` normalises to `RECRUIT`, which is the first word of the name.
**Pass Criteria**: array length = 0 AND the button is present.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-05 — Research: AUTHORIZE PROJECT

**AC covered**: AC-1 (AUTHORIZE PROJECT)
**Coverage**: Covered by R2 check: `label-in-name` on surface `research`
**Preconditions**: Common setup. R2 `SURFACES.research` (New Operation, `goto('research')`).
**Steps**:
1. Run R2 (surface `research`).
2. Read `label-in-name: N` in `## research`; confirm `def.labelInName` empty in `sweep-research.json`.
3. Confirm a visible button whose `aria-label` starts `AUTHORIZE PROJECT // ` and whose visible text is `AUTHORIZE PROJECT`.
**Expected Result**: `label-in-name: 0`; the CTA is present.
**Pass Criteria**: N = 0 AND the CTA is found.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-06 — Settings: RESET ALL and the Quality segments

**AC covered**: AC-1 (RESET ALL; the Quality segments)
**Coverage**: Covered by R2 check: `label-in-name` on surface `settings`
**Preconditions**: Common setup. R2 `SURFACES.settings` (Menu → SETTINGS). Bindings at defaults, so RESET ALL is disabled but visible (the check does not skip disabled controls).
**Steps**:
1. Run R2 (surface `settings`).
2. Read `label-in-name: N` in `## settings`; confirm `def.labelInName` empty.
3. Confirm `button.set-reset-all` (label `RESET ALL // EVERY CONTROL TO ITS DEFAULT KEY`) and four Quality segment buttons with labels `AUTO // RENDER QUALITY auto`, `HIGH // ...`, `MED // ...`, `LOW // ...` are visible.
**Expected Result**: `label-in-name: 0`; RESET ALL and 4 Quality segments present.
**Pass Criteria**: N = 0 AND 1 + 4 controls found.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-07 — Balance (from Settings): EXPORT JSON

**AC covered**: AC-1 (EXPORT JSON)
**Coverage**: Covered by R2 check: `label-in-name` on surface `balance`
**Preconditions**: Common setup. R2 `SURFACES.balance` (one seeded abort record via `telemetry.saveRecords`, Menu → SETTINGS → `Open the balance dashboard`).
**Steps**:
1. Run R2 (surface `balance`).
2. Read `label-in-name: N` in `## balance`; confirm `def.labelInName` empty.
3. Confirm a visible button with `aria-label="EXPORT JSON // THE TELEMETRY RECORDS"`.
**Expected Result**: `label-in-name: 0`; EXPORT JSON present.
**Pass Criteria**: N = 0 AND the button is found.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-08 — Debrief: OPEN RESEARCH and research-prompt UNDERSTOOD

**AC covered**: AC-1 (OPEN RESEARCH; UNDERSTOOD, 3 of 3)
**Coverage**: Covered by R2 check: `label-in-name` on surface `debrief`
**Preconditions**: Common setup. R2 `SURFACES.debrief` (won Rust Haven outcome via `settleOutcome`, `.db-filing` shown). The committed `sweep-debrief.json` shows both buttons in this state.
**Steps**:
1. Run R2 (surface `debrief`).
2. Read `label-in-name: N` in `## debrief`; confirm `def.labelInName` empty.
3. Confirm `button[aria-label="OPEN RESEARCH // THE RESEARCH TAB"]` and `button[aria-label="UNDERSTOOD // DISMISS THE RESEARCH PROMPT"]` are visible. If the note is absent on HEAD, re-enter with `hint-debrief-research` removed from `useTutorialStore` `seen` (as R3 step 4 does) and run the `labelInName` expression by hand; record that the R2 0 was vacuous.
**Expected Result**: `label-in-name: 0`; both research-prompt buttons present.
**Pass Criteria**: N = 0 AND both buttons found (directly or after the fallback in step 3, which must also give 0).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-09 — Debrief: BALANCE DATA

**AC covered**: AC-1 (BALANCE DATA)
**Coverage**: Hand-walk (R2's Debrief has no telemetry record, so BALANCE DATA is not rendered there; R3 renders it but does not run label-in-name)
**Preconditions**: Common setup. R2 `SURFACES.debrief`, then seed one record as R3 step 4b does: `telemetry.saveRecords([{ at: Date.now(), missionId: 'm03', outcome: 'aborted', durationSec: 12, seed: 1, squadRoles: ['assault'] }])`; wait 400 ms.
**Steps**:
1. Confirm a visible button with `aria-label="BALANCE DATA // OPEN THE DASHBOARD OVER THE LOCAL MISSION LOG"` and visible text `BALANCE DATA`.
2. Run the R2 `labelInName` expression.
**Expected Result**: Array empty; the visible label is the start of the name.
**Pass Criteria**: array length = 0 AND the button is present.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-10 — Mission HUD: SKIP TUTORIAL

**AC covered**: AC-1 (SKIP TUTORIAL)
**Coverage**: Covered by R2 check: `label-in-name` on surfaces `mission` and `pause`; R4 `label-in-name` on `mission` and `hold`
**Preconditions**: Common setup. R2 `SURFACES.mission` (`startMission`, 6 s), first-mission tutorial toast up (committed `sweep-mission.json` contains SKIP TUTORIAL).
**Steps**:
1. Run R2 and R4.
2. Read `label-in-name: N` for `## mission` and `## pause` (R2) and `## mission`, `## hold` (R4).
3. Confirm `button.hud-toast-btn[aria-label="SKIP TUTORIAL // SKIP THE WHOLE TUTORIAL"]` is visible in the mission state.
**Expected Result**: All four lines read `label-in-name: 0`; the toast button is present.
**Pass Criteria**: 4 of 4 N = 0 AND the button is found.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-11 — Every surface: label-in-name 0

**AC covered**: AC-1 ("GIVEN every surface")
**Coverage**: Covered by R2 check: `label-in-name` on all 10 surfaces (world, menu, settings, research, brief, team, debrief, mission, pause, balance); R4 `label-in-name` on its 12 (adds hold, debriefkia)
**Preconditions**: Common setup. Fresh R2 and R4 runs on HEAD.
**Steps**:
1. Run R2 and R4 in full.
2. Count surfaces whose block reads `label-in-name: 0`.
3. Confirm no block reads `NOT MEASURED` and the last line is `no page errors`.
**Expected Result**: Every measured surface reports 0; all surfaces measured; no page errors.
**Pass Criteria**: R2 10/10 and R4 12/12 surfaces at 0, 0 `NOT MEASURED`, `no page errors` in both outputs.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-12 — The 14 listed controls start with their visible label

**AC covered**: AC-1 ("now start with their visible label")
**Coverage**: Hand-walk (R2 checks that the label *contains* the visible line, not that it *starts* with it)
**Preconditions**: Common setup. Visit the states of IF-038-01 .. -10 in turn (world, influence-note, team, team with empty roster, research, settings, balance, debrief, debrief with a record, mission).
**Steps**:
1. In each state, for each listed control (UNDERSTOOD x3, `n UNREAD`, RECRUIT x2, every Item slot, DEPLOY TEAM, OPEN RESEARCH, BALANCE DATA, AUTHORIZE PROJECT, RESET ALL, AUTO/HIGH/MED/LOW, EXPORT JSON, SKIP TUTORIAL), read `aria-label` and the first visible line with letters (more than one character).
2. Normalise both as R2 does and test `norm(label).startsWith(norm(visible))`.
3. Tabulate control, visible line, label, result.
**Expected Result**: Every row passes. For Item slots the visible first line is the item name or `EMPTY SLOT`, which is the label's first segment.
**Pass Criteria**: 0 rows fail the starts-with test, and every listed control was found (none missing from the table).
**Actual Result**:
**Pass/Fail**:

---

## AC-2 — Debrief Balance, invoice region, failed banner

## Test Case: IF-038-13 — Debrief Balance: Escape closes it, focus returns to BALANCE DATA

**AC covered**: AC-2 (Escape; focus return)
**Coverage**: Covered by R3 checks: `Balance from the Debrief takes focus`; `Escape closes Balance on the Debrief and focus returns to BALANCE DATA`
**Preconditions**: Common setup. R3 step 4 / 4b: first Debrief with the research note, one seeded telemetry record.
**Steps**:
1. Run R3.
2. Read both lines in the fresh `focus-output.txt`.
3. Confirm the last line is `ALL PASS` and no page error was logged.
**Expected Result**: `PASS Balance from the Debrief takes focus`; `PASS Escape closes Balance on the Debrief and focus returns to BALANCE DATA // BALANCE DATA // ...`.
**Pass Criteria**: both lines start `PASS` AND neither `BALANCE DATA shows on the Debrief with a record` FAIL line appears.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-14 — Invoice is a named scroll region with the fade element

**AC covered**: AC-2 (`Mission invoice` region; P-15 fade present)
**Coverage**: Covered by R3 check: `invoice is a named scroll region with the cut-edge fade`
**Preconditions**: Same R3 run as IF-038-13.
**Steps**:
1. Read the line in `focus-output.txt`.
**Expected Result**: `PASS invoice is a named scroll region with the cut-edge fade // {"role":"region","label":"Mission invoice","fade":true}`.
**Pass Criteria**: line starts `PASS` and the JSON shows `role` `region`, `label` `Mission invoice`, `fade` `true`.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-15 — Invoice fade shows at the cut edge and clears at the end

**AC covered**: AC-2 (cut-edge fade, behaviour)
**Coverage**: Hand-walk (R3 asserts the `.scroll-fade` element exists, not that it turns on when rows are cut)
**Preconditions**: Common setup. R4 `SURFACES.debriefkia` (KIA cost row and sector move rows, more rows than the won Debrief); text scale 125 so `.scroll.db-rows` overflows. If it does not overflow at 125, record that and the case is N/A for this build.
**Steps**:
1. Read `.scroll.db-rows` `scrollHeight` and `clientHeight`; confirm `scrollHeight > clientHeight + 1`.
2. With `scrollTop = 0`, read the sibling `.scroll-fade` class list; capture `if-038-15-fade-on.png`.
3. Focus the region (it has `tabIndex 0`) and press End (or set `scrollTop` to `scrollHeight`); wait 200 ms; read the class list again; capture `if-038-15-fade-off.png`.
4. Set text scale back to 100.
**Expected Result**: Step 2: `.scroll-fade` has class `on`. Step 3: `on` is gone. The region is reachable by Tab.
**Pass Criteria**: `on` present at top AND absent at bottom AND region receives focus.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-16 — CAMPAIGN FAILED banner is `role="status"` (H9)

**AC covered**: AC-2 (banner role)
**Coverage**: Hand-walk (no R2/R3/R4/R1 check reads the banner's role)
**Preconditions**: Common setup. R1 probe `STATES.failed`: `STATES.opening`, then `useCampaignStore.setState({ campaignFailed: true })`; wait 500 ms.
**Steps**:
1. Locate `.wm-campaign-fail`; confirm it is visible.
2. Read `getAttribute('role')` and `innerText`.
3. Capture `if-038-16-failed-banner.png`.
**Expected Result**: `role` is `status`; text includes `CAMPAIGN FAILED` (and IF-016's `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`).
**Pass Criteria**: exactly one visible `.wm-campaign-fail` with `role === "status"`.
**Actual Result**:
**Pass/Fail**:

---

## AC-3 — No positioned box over another

## Test Case: IF-038-17 — Brief recon readouts and target callout: no box overlap at four scales

**AC covered**: AC-3 (Brief recon)
**Coverage**: Covered by R2 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` on surface `brief` (boxoverlap entries); R4 same on `brief`
**Preconditions**: Common setup. R2 `SURFACES.brief` (`selectMission('m03')`).
**Steps**:
1. Run R2 and R4 (surface `brief`).
2. Read the four `clip @N` lines in each `## brief` block; in `sweep-brief.json` → `clips`, search every scale for entries starting `boxoverlap`, `textoverlap`.
3. Open `brief-125.png` and look at the recon frame: briefing block, readouts, callout.
**Expected Result**: All `clip @N: 0`; no `boxoverlap` or `textoverlap` naming `.mb-rbrief`, `.mb-rright`, `.mb-rreadout`, `.mb-rcallout`; in the PNG no recon block sits on another.
**Pass Criteria**: 8 of 8 lines (2 runs x 4 scales) = 0.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-18 — Brief recon: one right-hand column on panel ground

**AC covered**: AC-3 ("share one column on panel ground")
**Coverage**: Hand-walk (R2 measures overlap and contrast, not the column structure or the ground)
**Preconditions**: Common setup. R2 `SURFACES.brief`.
**Steps**:
1. Confirm `.mb-recon-labels .mb-rright` exists and contains both the readout block(s) (`.mb-rreadout`) and the target callout (`.mb-rcallout`).
2. At each of 90 / 100 / 110 / 125: read `getComputedStyle(el).backgroundColor` for `.mb-rbrief`, each `.mb-rreadout`, `.mb-rcallout`; read the bounding rects of `.mb-rbrief` and `.mb-rright`.
3. Capture `if-038-18-brief-recon-<scale>.png`.
**Expected Result**: Readouts and callout are children of the one `.mb-rright`; `.mb-rbrief` and `.mb-rreadout` read `rgba(7, 16, 15, 0.92)` (Panel ground), `.mb-rcallout` reads a non-transparent inset ground (`--bg-inset`); `.mb-rbrief` and `.mb-rright` rects do not intersect at any scale.
**Pass Criteria**: structure true AND 0 transparent backgrounds AND 0 intersections over 4 scales.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-19 — World Network inset tag clears both steppers at four scales

**AC covered**: AC-3 (inset tag vs steppers)
**Coverage**: Hand-walk (the R2/R4 world state seeds `influence: 8` with the Influence note unseen, the setup in which the probe asserts the steppers are absent, so R2's boxoverlap may never see the steppers. The same helper runs in R1 check `IF-026 world network scale <n>: nothing clips` on `STATES.opening`; that R1 result may be cited as this case's Actual Result)
**Preconditions**: Common setup. R1 probe `STATES.opening` (card dismissed, clock paused, no Influence note). Steppers `.wm-inset-chev.l` / `.r` visible.
**Steps**:
1. At each of 90 / 100 / 110 / 125: read the rects of `.wm-inset-tag`, `.wm-inset-chev.l`, `.wm-inset-chev.r`.
2. Compute the intersection of the tag with each stepper.
3. Run `window.__probe.clipped('.screen')` and filter entries containing `wm-inset`.
4. Capture `if-038-19-inset-<scale>.png`.
5. Repeat steps 1-2 at 125 with a sector whose tag text is longest (step the inset through all sectors with `.wm-inset-chev.r`; locate the longest at run time).
**Expected Result**: Tag left edge >= stepper L right edge and tag right edge <= stepper R left edge (or no vertical overlap); 0 `wm-inset` entries; the tag wraps instead of running under a stepper.
**Pass Criteria**: 0 intersections > 2x2 px across 4 scales + the longest-tag check, AND 0 `wm-inset` clip entries.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-20 — HUD toasts clear the weapons bar at four scales

**AC covered**: AC-3 (HUD toasts vs weapons bar)
**Coverage**: Covered by R2 check: `clip @90..@125` on surface `mission` (boxoverlap); R4 same on `mission` and `hold`
**Preconditions**: Common setup. R2 `SURFACES.mission` with the tutorial toast up (IF-038-10). `.hud-toasts`, `.hud-weapons` and `.hud-comms` are siblings under the HUD root (`src/ui/Hud.tsx`), so the sibling-only boxoverlap compares them.
**Steps**:
1. Run R2 and R4.
2. Read `clip @90/@100/@110/@125` for R2 `## mission` and R4 `## mission`, `## hold`; search `sweep-mission.json` / `sweep-hold.json` `clips` for `boxoverlap` entries naming `hud-toasts`.
3. Confirm in the same state that `.hud-toasts` and `.hud-weapons` share `parentElement` (one `page.evaluate`); if not, record a CONCERN that the sweep does not compare them and measure the two rects directly at each scale.
**Expected Result**: All 12 lines 0; no `hud-toasts` boxoverlap; the shared-parent check is true.
**Pass Criteria**: 12 of 12 = 0 AND shared parent true (or the direct rect check shows 0 intersections at 4 scales).
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-21 — HUD comms panel vs weapons bar at 1280x720, four scales

**AC covered**: AC-3 (comms panel gives back width)
**Coverage**: Covered by R2 check: `clip @90..@125` on surface `mission` (boxoverlap); R4 same on `mission`, `hold`. At 1280 px the `@media (max-width: 1360px)` rule is in force, so this also exercises the <=1360 px rule at 1280.
**Preconditions**: As IF-038-20.
**Steps**:
1. In the fresh outputs, search `clips` at each scale for `boxoverlap` entries naming `hud-comms` or `hud-weapons`.
2. Open `mission-125.png`: bottom-left COMM LOG panel and bottom-centre weapons bar.
**Expected Result**: 0 entries; in the PNG the comms panel ends left of the weapons bar.
**Pass Criteria**: 0 `hud-comms` / `hud-weapons` boxoverlap entries across 4 scales x 3 surface runs.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-22 — HUD comms panel width at 1360 and 1280 px, 125% text (H10)

**AC covered**: AC-3 ("also at <=1360 px")
**Coverage**: Hand-walk (no R-run uses a 1360 px viewport)
**Preconditions**: Common setup, but a browser context at viewport 1360x720 first, then 1280x720. R2 `SURFACES.mission` in each (weapons bar present: an active operative).
**Steps**:
1. Viewport 1360x720. At each of 90 / 100 / 110 / 125: read `.hud-comms` rect width and right edge, and `.hud-weapons` rect left edge.
2. Capture `if-038-22-comms-1360-<scale>.png`.
3. Repeat steps 1-2 at 1280x720 (`if-038-22-comms-1280-<scale>.png`).
**Expected Result**: Comms width = `286 - (scale - 1) * 80` px (±1): 294 / 286 / 278 / 266 at 90 / 100 / 110 / 125, at both widths. At every point comms right edge <= weapons left edge. 125% at both widths is the required pair (strategy H10); 90-110 are supporting.
**Pass Criteria**: 8 of 8 widths within ±1 px of the formula AND 0 of 8 points with comms right > weapons left.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-23 — Screen write-failure notice: Red Hot words on a red frame, no amber (H10)

**AC covered**: AC-3 (write-failure notice colour)
**Coverage**: Hand-walk (no R-run triggers a write failure)
**Preconditions**: Common setup. R1 probe `STATES.opening` (World Network, card dismissed).
**Steps**:
1. `useSaveStatusStore.getState().markWriteFailed('quota')` (`/src/state/saveStatusStore.ts`); wait 300 ms.
2. Locate `.write-fail-region .write-fail-notice`; read `innerText`, computed `color`, `borderTopColor` (and the other three sides), `backgroundColor`.
3. Capture `if-038-23-write-fail-world.png`.
4. `goto('research')`; repeat steps 2-3 (`if-038-23-write-fail-research.png`).
5. Variant on the orientation card: `fresh()` without `dismissCard()`, `markWriteFailed('quota')`; read the same values on `.wm-onboard-fail` (`if-038-23-write-fail-card.png`).
6. `useSaveStatusStore.getState().reset()`; confirm the notice is gone.
**Expected Result**: Text `SAVE FAILED // CAMPAIGN NOT FILED`. `color` = `rgb(255, 107, 85)` (Red Hot). Border = Red Hot at 60% (computed reads `rgba(255, 107, 85, 0.6)` or the equivalent `color(srgb 1 0.42 0.33 / 0.6)`; RGB channels match Red Hot within 1/255). Neither colour equals Amber `rgb(240, 180, 69)` or contains its channels. Text contrast against the composited panel ground >= 4.5:1. Step 6: notice removed.
**Pass Criteria**: 3 of 3 locations: ink = Red Hot AND all four border sides Red Hot channels AND 0 amber values AND contrast >= 4.5:1; step 6 shows 0 `.write-fail-notice` elements.
**Actual Result**:
**Pass/Fail**:

---

## Test Case: IF-038-24 — Every surface: no positioned box covers another at four scales

**AC covered**: AC-3 ("GIVEN every surface at 1280x720 and four text scales")
**Coverage**: Covered by R2 check: `clip @90..@125` (boxoverlap entries) on all 10 surfaces; R4 same on its 12
**Preconditions**: Fresh R2 and R4 runs on HEAD (as IF-038-11).
**Steps**:
1. For every surface in both runs, read the four `clip @N` lines.
2. Search every `sweep-<surface>.json` `clips` array for entries starting `boxoverlap`.
3. Confirm no `NOT MEASURED` block and `no page errors`.
**Expected Result**: 0 boxoverlap entries anywhere; every `clip @N` line 0.
**Pass Criteria**: R2 40/40 and R4 48/48 (surface x scale) lines = 0 AND 0 boxoverlap entries AND `no page errors` in both.
**Actual Result**:
**Pass/Fail**:
