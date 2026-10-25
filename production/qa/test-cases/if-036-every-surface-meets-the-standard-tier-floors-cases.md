# Test Cases: IF-036 — Every surface meets the Standard-tier type, ink and target floors

**Story**: `production/epics/interface/story-036-every-surface-meets-the-standard-tier-floors.md`
**Story type**: UI | **Output location**: `production/qa/evidence/sprint-011-head-2026-10-24/` (`r2-sweep/`, `r4-playtest-sweep/`, hand-walk captures beside them) | **Gate level**: BLOCKING
**Build under test**: HEAD `131a5c1` (last `src/` change `ab9935c`)
**Sources**: story Acceptance Criteria AC-1, AC-2 and QA Test Cases; `production/qa/qa-strategy-sprint-011-2026-10-24.md` sections 4–6 (R2, R4, F1, F2); owner ruling 2026-10-24 on Assembly `MOBILITY`.
**Author**: qa-tester, 2026-10-24 (Sprint 11, /team-qa Phase 4)

---

## Execution environment (all cases)

- `npm run dev` on port 4200. Headless Chrome for Testing, viewport exactly 1280x720. No headed window.
- **R2** = `production/qa/evidence/screens-2026-10-23/sweep.mjs`, run as `PROBE_OUT=production/qa/evidence/sprint-011-head-2026-10-24/r2-sweep/ node production/qa/evidence/screens-2026-10-23/sweep.mjs` (trailing slash required: the script concatenates `OUT + filename`).
- **R4** = `production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs`, same shape with `PROBE_OUT=.../r4-playtest-sweep/`.
- `SURFACES=<name>` limits either script to one surface. Surface names: Menu `menu`, Settings `settings`, Research `research`, Brief `brief`, Assembly `team`, Debrief `debrief`, Mission HUD `mission`, Pause `pause`, World Network `world`.
- Check names below are the exact labels each script prints to `sweep-output.txt` (and stores in `sweep-<surface>.json`).
- Hand-walk measurements run from a scratch script outside the repo that navigates as the sweep does and injects the same helper code. **Never edit `sweep.mjs`** (strategy section 4, rule 3).
- After the session: stop the dev server, confirm nothing listens on port 4200, close the headless browser.

## What the scripts do and do not check (read from the scripts, decides Covered vs Hand-walk)

1. **R2 measures without waiting for animations; R4 waits.** R4's `measure()` awaits `finished` on every finite animation first (its comment cites the 14-hit orientation-card finding). R2 measures after fixed waits only.
2. **The clip check skips `.hud-menu-wrap`.** `clipped()` treats `.hud-menu-wrap, .tip, .globe-view, .wm-map-wrap` as declared overlays and skips them. Settings (`src/ui/index.tsx:271`), Pause (`src/ui/PauseMenu.tsx:93`) and Balance all render inside `.hud-menu-wrap`. So `clip @90/100/110/125` measures none of their content, and AC-2 for Settings and Pause is a **Hand-walk** (TC-036-15, TC-036-21). The AC-1 text checks (`runs('body')`) do include them.
3. **No check catches a word broken across lines.** A label that wraps inside its own box is not a clip, a spill or an overlap, so `clip @N` reports 0 for the `MOBILITY` break. Hence TC-036-22 and TC-036-23 are hand-walks.
4. **SVG text has no Ink Dim / Ink Faint check.** `Ink Dim text; Ink Faint text` covers HTML runs only. The `svg text` line checks size and ratio, not colour. Hence TC-036-10.
5. **The exemption list also exempts a blinking caret** (`[blink]`), which AC-1 does not list. See TC-036-09.
6. **R4 is the stronger layout check.** It adds `offscreen` text past the viewport and `.hud-panel` as a spill host. R2 is the story's named evidence; both are read.
7. Contrast is composited over solid ancestor backgrounds on Void. Gradients, images and the 3D canvas under HUD text are ignored (`bgOf`).

---

## AC-1 — type, ink and target floors at 1280x720, text scale 100%, default and high contrast

**Pass rule for TC-036-01 to 08 (read in R2 `sweep-output.txt`, then cross-checked in R4's):** `<10px: 0`, `<4.5:1 default: 0`, `<4.5:1 high contrast: 0`, `Ink Dim text: 0; Ink Faint text: 0`, `svg text: n runs; <10px: 0; <4.5:1: 0`, `targets <24: 0`, and the surface's header is not `NOT MEASURED`. The `exempt (inactive / blinking)` line is judged in TC-036-09. The run ends with `no page errors`.

### TC-036-01 — Menu meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: `<10px`, `<4.5:1 default`, `<4.5:1 high contrast`, `Ink Dim text; Ink Faint text`, `svg text`, `targets <24` (surface `menu`); cross-check R4, same checks
- **Preconditions**: Dev server up on 4200 at HEAD `131a5c1`; `r2-sweep/` and `r4-playtest-sweep/` empty; R2 runs with no `SURFACES` filter (full batch, which TC-036-13 also needs).
1. Run R2 full batch into `r2-sweep/`.
2. Open `r2-sweep/sweep-output.txt` and find `## menu`.
3. Read the six check lines named above.
4. Open `r2-sweep/menu-100.png` and `menu-hc.png` and confirm they show the Menu at 1280x720 (not a blank page or an error screen).
5. Repeat steps 2–3 in `r4-playtest-sweep/sweep-output.txt` after the R4 run (TC-036-11 step 1).
- **Expected Result**: Every count named in the pass rule is 0 in both runs; the captures show the Menu.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-02 — Settings meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `settings`, opened from the Menu's SETTINGS button); cross-check R4
- **Preconditions**: R2 full batch done (TC-036-01 step 1); R4 done.
1. In `r2-sweep/sweep-output.txt`, find `## settings`.
2. Read the six check lines.
3. Confirm `settings-100.png` shows the Settings panel open over the Menu, and `settings-hc.png` shows it in high contrast.
4. Repeat steps 1–2 in R4's output.
- **Expected Result**: All six counts 0 in both runs; the panel is open in both captures.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-03 — Research meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `research`); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## research` and read the six check lines (SVG node labels count under `svg text`).
2. Confirm `research-100.png` / `research-hc.png` show the Research tree.
3. Repeat step 1 in R4's output.
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-04 — Brief meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `brief`, contract `m03`); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## brief` and read the six check lines. The recon frame's type is now an HTML overlay, so it counts in `<10px` / `<4.5:1`, not in `svg text`.
2. Confirm `brief-100.png` / `brief-hc.png` show the Brief for m03, recon frame visible.
3. Repeat step 1 in R4's output (R4 measures HEAD's post-`2c73542` Brief lines).
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-05 — Assembly meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `team`); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## team` and read the six check lines.
2. Confirm `team-100.png` / `team-hc.png` show Assembly (stats, augment slots, loadout slots, mass tier visible).
3. Repeat step 1 in R4's output.
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-06 — Debrief meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `debrief`, won outcome, measured after `.db-filing` appears + 1.8 s); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## debrief` and read the six check lines.
2. Confirm `debrief-100.png` shows every Debrief row drawn (rows fade in; a half-drawn capture means R2 measured mid-fade: record it and rely on R4's settled reading).
3. Repeat step 1 in R4's output.
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-07 — Mission HUD meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `mission`, 6 s after `startMission`); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## mission` and read the six check lines.
2. Confirm `mission-100.png` shows the live HUD over the rendered city (not a loading state).
3. Repeat step 1 in R4's output.
4. Note: HUD text over the 3D canvas is measured against its solid panel backgrounds only (script limitation 7). Record any HUD text with no solid panel background behind it as an observation.
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-08 — Pause meets the AC-1 floors
- **AC covered**: AC-1
- **Coverage**: Covered by R2 check: same six checks (surface `pause`, Escape in the mission, measured 600 ms later); cross-check R4
- **Preconditions**: R2 and R4 runs done.
1. In R2's output, find `## pause` and read the six check lines.
2. Confirm `pause-100.png` shows the Pause menu fully opaque over the HUD.
3. Repeat step 1 in R4's output.
- **Expected Result**: All six counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-09 — Exemptions are inactive controls only, and listed
- **AC covered**: AC-1 (exemption clause)
- **Coverage**: Covered by R2 check: `exempt (inactive / blinking)`; plus a Hand-walk confirmation of each listed element
- **Preconditions**: R2 and R4 runs done. The story's recorded exemptions are disabled RESET / RESET ALL in Settings (at defaults) and the disabled minimap zoom at its limit.
1. For each of the eight AC-1 surfaces, copy the `exempt (inactive / blinking)` line from R2's output (absent line = no exemptions).
2. Confirm each entry ends in `[inactive]`.
3. For each `[inactive]` entry, open that surface in the scratch script and confirm the control is `:disabled` or `aria-disabled="true"` at that moment (Settings RESET / RESET ALL at defaults; the minimap zoom button at its zoom limit).
4. Record every `[blink]` entry with its text and surface.
- **Expected Result**: Every exempt entry is `[inactive]` and belongs to a control that is disabled or `aria-disabled` when measured. No `[blink]` entries. AC-1 exempts inactive controls only, so a `[blink]` entry is a sub-4.5:1 run the AC does not exempt: record Fail and escalate to qa-lead for a ruling.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-10 — No SVG text is drawn in Ink Dim or Ink Faint
- **AC covered**: AC-1 ("no text is in Ink Dim or Ink Faint", HTML and SVG)
- **Coverage**: Hand-walk (the scripts check SVG size and ratio, not SVG colour)
- **Preconditions**: Dev server up; scratch script that reaches each surface the way R2's `SURFACES` entries do; default contrast mode (Ink Dim is `#5d7d75` = `rgb(93, 125, 117)`, Ink Faint `#35504a` = `rgb(53, 80, 74)` in `src/index.css` and `src/ui/tokens.ts`).
1. For each of Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD and Pause, navigate as R2 does and wait for finite animations to finish.
2. Collect every visible `svg text` / `svg tspan` with non-empty text (skip a `text` that has `tspan` children), and read its computed `fill` with alpha removed.
3. Count the runs whose fill is `rgb(93, 125, 117)` or `rgb(53, 80, 74)`, per surface; list the text and the host class of each.
- **Expected Result**: 0 SVG text runs in Ink Dim or Ink Faint on all eight surfaces.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-11 — F2: World Network measured settled (card fade finished)
- **AC covered**: AC-1 (strategy F2, BLOCKING for AC-1. World Network is not one of AC-1's eight listed surfaces; the strategy ties F2 to AC-1.)
- **Coverage**: Covered by R4 check: `<4.5:1 default`, `<4.5:1 high contrast` (surface `world`; R4's `measure()` awaits every finite animation); plus a Hand-walk confirmation that the card was up and opaque
- **Preconditions**: Dev server up; reduced motion **off** (the card's `fade-in 0.16s` on `.hud-menu-wrap` is removed under `:root.s-reduce-motion`). The R4 `world` surface removes `hint-worldmap` from the seen list, so the orientation card is up.
1. Run R4 full batch into `r4-playtest-sweep/` (`world` runs first).
2. Run R4 again with `SURFACES=world` into a sub-folder `r4-playtest-sweep/world-alone/`.
3. In both outputs read `## world`: `<10px`, `<4.5:1 default`, `<4.5:1 high contrast`, `Ink Dim text; Ink Faint text`, `svg text`, `targets <24`.
4. Confirm `world-100.png` in both folders shows the orientation card (UNDERSTOOD button visible).
5. Hand-walk: in the scratch script, reach the same state, await `finished` on all finite animations, and read the product of `opacity` from `.wm-onboard` up to `body`.
- **Expected Result**: `<4.5:1 default: 0` and `<4.5:1 high contrast: 0` in both the batch and the alone run; every other count 0; the card is visible in the captures; the card's ancestor opacity product is 1.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-12 — F2: World Network measured mid-fade (card fade frozen)
- **AC covered**: AC-1 (strategy F2)
- **Coverage**: Hand-walk (no script measures a controlled fade point)
- **Preconditions**: As TC-036-11. Scratch script injects R4's `HELPERS` and the run-collection part of its `measure()` without the animation wait.
1. `fresh()` as the sweep does, then in one `page.evaluate`: drop `hint-worldmap` from the seen list, set the world store as R4's `world` surface does, call `goto('world')`, wait one animation frame, find the `fade-in` animation on `.wm-onboard-wrap` via `document.getAnimations()`, and `pause()` it.
2. Set its `currentTime` to 40 ms (25%). Collect HTML text runs; record every run with ratio < 4.5 (text, ratio, alpha, path) and capture `world-midfade-25.png`.
3. Repeat step 2 at 80 ms (50%) and 120 ms (75%).
4. `finish()` the animation, await all finite animations, and collect again; capture `world-midfade-settled.png`.
5. Classify each step 2–3 hit: inside `.wm-onboard-wrap` or not; its alpha equals the frozen fade opacity × the element's own opacity or not; still present in step 4 or not.
6. Turn reduced motion on, repeat step 1 (expect no `fade-in` animation to exist) and collect once.
- **Expected Result**: Step 4 reports 0 runs below 4.5:1. Every mid-fade hit is inside `.wm-onboard-wrap`, its alpha is explained by the frozen fade, and it is gone in step 4. Step 6 finds no fade animation and 0 hits. A hit outside the card, or one still present when settled, is a defect to file with `/bug-report`. Whether text inside a 0.16 s fade-in counts as "as rendered" for AC-1 is not settled by the AC or the strategy (F2 says "real" means file a bug, "artefact" means note it in the README). Record the classification and escalate the call to qa-lead; do not mark Pass on the mid-fade hits alone.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-13 — F2: World Network measured first in a batch vs alone (R2, no animation wait)
- **AC covered**: AC-1 (strategy F2; section 4 rule 1: "re-run that surface alone and record both results; do not average them away")
- **Coverage**: Covered by R2 check: `<4.5:1 default` (surface `world`, first in R2's batch)
- **Preconditions**: R2 full batch done (TC-036-01 step 1). Dev server freshly started before that run (a cold first load is the condition the `2c73542` finding describes).
1. Read `## world` → `<4.5:1 default` in `r2-sweep/sweep-output.txt` (batch-first) and list its hits.
2. Run R2 with `SURFACES=world` into `r2-sweep/world-alone/` and read the same line.
3. If either count is non-zero, compare the hit paths against TC-036-12's classification (all inside `.wm-onboard-wrap`, or not).
4. Record both counts side by side in the evidence README.
- **Expected Result**: Both counts 0. If the batch-first count is non-zero and the alone count is 0, both are recorded, and the hits match the mid-fade pattern of TC-036-12 (inside the card, alpha < 1). Hits that do not match that pattern are a defect.
- **Actual Result**:
- **Pass/Fail**:

---

## AC-2 — no clip, truncation, spill, sideways scroll or panel overlap at text scales 90 / 100 / 110 / 125

**Pass rule for the covered cases:** `clip @90: 0`, `clip @100: 0`, `clip @110: 0`, `clip @125: 0` for the surface in R2's output and in R4's output. The `clip @N` line counts `cut`, `truncated`, `clip`, `spill`, `hscroll`, `textoverlap`, `boxoverlap` and panel `overlap` (R4 also `offscreen`). Any listed entry is a failure; quote it.

### TC-036-14 — Menu lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `menu`)
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## menu` in R2's output, then R4's.
2. Open `menu-90.png`, `menu-110.png`, `menu-125.png` and confirm the Menu is drawn at each scale.
- **Expected Result**: All four counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-15 — Settings lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Hand-walk (the scripts' `clip @N` skips everything inside `.hud-menu-wrap`, which holds the Settings panel; R2/R4 `clip @N` on `settings` covers only the Menu behind it)
- **Preconditions**: Dev server up; scratch script with R4's `HELPERS`, edited in the scratch copy only so the `overlay()` selector no longer lists `.hud-menu-wrap`.
1. Reach Settings as R2 does (Menu → SETTINGS button), wait for the 0.16 s fade to finish.
2. For scale 90, 100, 110, 125: set the text scale through the settings store, wait 300 ms, re-inject helpers, run `clipped('body')`, capture `settings-panel-<scale>.png`.
3. At each scale, scroll the panel's scrolling body to its end and run `clipped('body')` again.
4. Record every entry (`cut`, `truncated`, `clip`, `spill`, `hscroll`, `offscreen`, `textoverlap`, `boxoverlap`, `overlap`) that lies inside `.hud-menu-wrap`.
- **Expected Result**: 0 entries inside `.hud-menu-wrap` at all four scales, at the top and at the end of the scroll; no `hscroll` on the panel body.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-16 — Research lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `research`)
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## research` in both outputs.
2. Open `research-125.png` and confirm node labels are drawn.
- **Expected Result**: All four counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-17 — Brief lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `brief`; includes the tactical-rail `hscroll` check the story watched fail at 377 px in 335)
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## brief` in both outputs.
2. Open `brief-125.png` and confirm the recon overlay labels and the tactical rail are drawn.
- **Expected Result**: All four counts 0 in both runs; no `hscroll ... mb-tac-rail` entry.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-18 — Assembly lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `team`). The `MOBILITY` break is not caught by these checks; it is TC-036-22.
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## team` in both outputs.
2. Open `team-90.png`, `team-110.png`, `team-125.png`.
- **Expected Result**: All four counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-19 — Debrief lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `debrief`)
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## debrief` in both outputs.
2. Open `debrief-125.png` and confirm every row is drawn.
- **Expected Result**: All four counts 0 in both runs.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-20 — Mission HUD lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Covered by R2/R4 check: `clip @90`, `clip @100`, `clip @110`, `clip @125` (surface `mission`; R4 adds the `.hud-panel` spill host and `offscreen`)
- **Preconditions**: R2 and R4 runs done.
1. Read the four `clip @N` lines under `## mission` in both outputs.
2. Open `mission-125.png` and confirm the squad slot column and panel heads are on screen.
- **Expected Result**: All four counts 0 in both runs. R4 is decisive where they differ (it has the checks R2 lacks).
- **Actual Result**:
- **Pass/Fail**:

### TC-036-21 — Pause lays out at four text scales
- **AC covered**: AC-2
- **Coverage**: Hand-walk (the Pause menu renders inside `.hud-menu-wrap`, which `clip @N` skips; R2/R4 `clip @N` on `pause` covers only the HUD behind it)
- **Preconditions**: As TC-036-15 (scratch helpers without the `.hud-menu-wrap` exclusion).
1. Reach Pause as R2 does (Assembly → `startMission`, wait 6 s, Escape), wait for the fade to finish.
2. For scale 90, 100, 110, 125: set the scale, wait 300 ms, re-inject helpers, run `clipped('body')`, capture `pause-menu-<scale>.png`.
3. Record every entry inside `.hud-menu-wrap`.
- **Expected Result**: 0 entries inside `.hud-menu-wrap` at all four scales.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-22 — Assembly `MOBILITY` stat label stays on one line (owner ruling 2026-10-24)
- **AC covered**: AC-2 (owner ruling 2026-10-24: a mid-word break of `MOBILITY` at 100/110/125% is a defect against AC-2)
- **Coverage**: Hand-walk (no script check detects a word wrapping inside its own box)
- **Preconditions**: Dev server up; Assembly reached as R2's `team` surface does (`selectMission('m03')`, `goto('team')`); default contrast. Known as-built: the smoke report records the break at 100/110/125% (`design/ux/assembly.md` Open Question 15; the label rule is `.ts-stats label` at `src/ui/ui.css:2471`).
1. Set the text scale to 90 and wait 300 ms.
2. For each `.ts-stats label` (`HLTH`, `STAMINA`, `FOCUS`, `MOBILITY`), select its text node with a `Range` and count `getClientRects()`. Record the count and the label's box width.
3. Capture the stat tile row as `team-stats-<scale>.png` (clip to the `.ts-stats` box).
4. Repeat steps 2–3 at 100, 110 and 125.
- **Expected Result**: At every scale, `MOBILITY` renders as one line box (`getClientRects().length === 1`) and the capture shows `MOBILITY` unbroken. The same holds for `HLTH`, `STAMINA` and `FOCUS`. Two or more line boxes for any label is a mid-word break and a Fail; file it with `/bug-report` against Interface.
- **Actual Result**:
- **Pass/Fail**:

### TC-036-23 — No other word breaks mid-word on the eight surfaces
- **AC covered**: AC-2 (extends the owner's `MOBILITY` ruling to every surface; scope needs qa-lead confirmation, see the note)
- **Coverage**: Hand-walk
- **Preconditions**: Dev server up; scratch script reaching each surface as R2 does; Settings and Pause measured with the panel open.
1. For each of Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD and Pause, at scales 90, 100, 110 and 125:
2. Walk every visible HTML text node. For each node whose `Range.getClientRects()` returns more than one line box, find each line boundary (the first character whose rect starts a new line).
3. Flag the boundary when the characters on both sides of it are letters or digits (no space, hyphen or slash between them).
4. Record each flag: surface, scale, text, host path; capture the region.
- **Expected Result**: No flagged boundary other than any already filed under TC-036-22. Each new flag is recorded and handed to qa-lead to decide whether the owner's `MOBILITY` ruling covers it.
- **Actual Result**:
- **Pass/Fail**:

---

## Coverage map

| AC | Surfaces | Cases | Covered by script | Hand-walk |
|---|---|---|---|---|
| AC-1 floors (size, contrast default + HC, Ink Dim / Faint, targets) | Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause | 01–08 | R2 + R4: `<10px`, `<4.5:1 default`, `<4.5:1 high contrast`, `Ink Dim text; Ink Faint text`, `svg text`, `targets <24` | — |
| AC-1 exemptions | all eight | 09 | R2: `exempt (inactive / blinking)` | confirm each control is disabled |
| AC-1 SVG text colour | all eight | 10 | — | yes |
| AC-1 / F2 World Network | World Network | 11, 12, 13 | R4 `world` settled (11), R2 `world` batch vs alone (13) | mid-fade freeze (12), card opacity (11) |
| AC-2 layout at four scales | Menu, Research, Brief, Assembly, Debrief, Mission HUD | 14, 16–20 | R2 + R4: `clip @90/100/110/125` | — |
| AC-2 layout at four scales | Settings, Pause (inside `.hud-menu-wrap`) | 15, 21 | — (skipped by `clipped()`) | yes |
| AC-2 mid-word break | Assembly `MOBILITY` | 22 | — | yes |
| AC-2 mid-word break | all eight | 23 | — | yes |
