# IF-036 — Every surface meets the Standard-tier floors — execution results

**Story type**: UI | **Gate level**: BLOCKING | **Build**: HEAD `131a5c1` | **Date**: 2026-10-24 | **Executed by**: qa-tester (Sprint 11 /team-qa Phase 5)
**Cases**: `production/qa/test-cases/if-036-every-surface-meets-the-standard-tier-floors-cases.md`
**Server**: existing dev server on http://localhost:4200 (not started or stopped by this run). Headless Chrome for Testing 1280x720 only.

## Evidence in this folder

- `if036-handwalk.mjs` — the one hand-walk script (navigation and R4 `HELPERS` copied from `playtest-fixes-2026-10-23/sweep.mjs`; the `.hud-menu-wrap` overlay exclusion removed in a string copy only, for TC-15/21).
- `run.log` / `handwalk-output.txt` / `handwalk.json` — run 2 (the run results are taken from).
- `run-1-detector-bug.log` — run 1, discarded: the TC-23 mid-word detector skipped zero-width line-end spaces and flagged ordinary word wraps (e.g. `minimum|density`). Fixed in the script (gap between the two sides must hold only letters/digits), then re-run.
- `r4-world-alone/` — R4 run with `SURFACES=world` (TC-11 step 2; no such run existed before). `run.log` exit 0.
- Captures: `team-stats-{90,100,110,125}.png`, `break-team-{100,110,125}-1.png`, `settings-panel-{90..125}.png`, `pause-menu-{90..125}.png`, `world-midfade-{25,50,75,settled}.png`, `world-reduced-motion.png`.

## Results

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| TC-036-01 Menu AC-1 | AC-1 | R2/R4 | R2 `## menu: 15 runs, 2 targets`: `<10px: 0`, `<4.5:1 default: 0`, `<4.5:1 high contrast: 0`, `Ink Dim text: 0; Ink Faint text: 0`, `svg text: 0 runs; <10px: 0; <4.5:1: 0`, `targets <24: 0`; R4 same, all 0. R2 ends `no page errors`. `menu-100.png` and `menu-hc.png` opened: Menu at 1280x720. | PASS |
| TC-036-02 Settings AC-1 | AC-1 | R2/R4 | R2 `## settings: 159 runs, 57 targets`, all six checks 0; R4 all six 0. `settings-100.png` and `settings-hc.png` opened: panel open over Menu, HC toggle ON in the hc capture. | PASS |
| TC-036-03 Research AC-1 | AC-1 | R2/R4 | R2 `## research: 85 runs`, all six 0, `svg text: 42 runs; <10px: 0; <4.5:1: 0`; R4 same. `research-hc.png` opened (tree drawn). `research-100.png` not opened (see Not run). | PASS on counts; capture sub-step NOT RUN |
| TC-036-04 Brief AC-1 | AC-1 | R2/R4 | R2 `## brief: 143 runs`, all six 0, `svg text: 4 runs; <10px: 0; <4.5:1: 0`; R4 same. `brief-hc.png` opened (m03 Rust Haven, recon frame visible). `brief-100.png` not opened. | PASS on counts; capture sub-step NOT RUN |
| TC-036-05 Assembly AC-1 | AC-1 | R2/R4 | R2 `## team: 225 runs`, all six 0; R4 same. `team-hc.png` opened (stats, augment slots, loadout slots, mass tier visible). `team-100.png` not opened. | PASS on counts; capture sub-step NOT RUN |
| TC-036-06 Debrief AC-1 | AC-1 | R2/R4 | R2 `## debrief: 45 runs`, all six 0; R4 same. `debrief-100.png` opened: every row drawn; the last visible row (ACCOUNT BALANCE) is dimmed at the scroll edge next to the scroll arrow (see Notes), not a mid-fade capture. | PASS |
| TC-036-07 Mission HUD AC-1 | AC-1 | R2/R4 | R2 `## mission: 126 runs, 13 targets`, all six 0; R4 same. `mission-100.png` opened: live HUD over the rendered city. | PASS |
| TC-036-08 Pause AC-1 | AC-1 | R2/R4 | R2 `## pause: 200 runs, 16 targets`, all six 0; R4 same. `pause-100.png` opened: Pause menu opaque over the dimmed HUD. | PASS |
| TC-036-09 Exemptions | AC-1 | R2 + hand-walk | R2 exempt lines: menu `_ [blink]`; settings `_ [blink] \| RESET ALL [inactive] \| RESET [inactive]`; mission `+ [inactive]`; pause `+ [inactive]`; others absent. Hand-walk: RESET ALL and all 17 RESET buttons `disabled: true` (ratio 2.48) at defaults; `Zoom minimap in` (`+`) `disabled: true` (ratio 2.43) in mission and pause, `Zoom minimap out` enabled. `_` = `span.cursor` in `header.menu-top > div.menu-boot`, ratio 3.84, animation `cursor-blink` (infinite), not a control. Per ruling the caret is recorded under Notes, not FAIL. | PASS |
| TC-036-10 SVG text colour | AC-1 | Hand-walk | Settled, default contrast. SVG runs / Ink Dim or Faint hits: Menu 0/0, Settings 0/0, Research 42/0 (fill `rgb(184, 216, 207)`), Brief 4/0 (fills `rgb(155, 232, 255)`, `rgb(126, 240, 212)`, `rgb(184, 216, 207)`), Assembly 0/0, Debrief 0/0, Mission 0/0, Pause 0/0. | PASS |
| TC-036-11 World settled | AC-1 (F2) | R4 + hand-walk | R4 batch `## world: 202 runs`: all six 0. R4 alone (`r4-world-alone/`): all six 0, `no page errors`. Both `world-100.png` opened: orientation card with UNDERSTOOD. Hand-walk after `finish()` + awaiting finite animations: `.wm-onboard`→body opacity product `1`, 0 runs < 4.5. | PASS |
| TC-036-12 World mid-fade | AC-1 (F2) | Hand-walk | `fade-in` on `.wm-onboard-wrap` found and paused. @40 ms: 14 runs < 4.5 (ratios 2.40–2.84, alpha 0.378 = wrap opacity 0.378 × own 1), all 14 inside the card, all explained by the frozen fade. @80 ms: 0. @120 ms: 0. Settled: 0. Reduced motion on: `s-reduce-motion` set, no fade animation, 0 hits. Per ruling, mid-fade readings go to Notes. | PASS |
| TC-036-13 World batch vs alone (R2) | AC-1 (F2) | R2 | Batch-first `r2-sweep` `## world` `<4.5:1 default: 0`; alone `r2-sweep-world-alone` `<4.5:1 default: 0`. Both 0. | PASS |
| TC-036-14 Menu four scales | AC-2 | R2/R4 | R2 and R4 `## menu` `clip @90: 0`, `@100: 0`, `@110: 0`, `@125: 0`. `menu-125.png` opened (drawn). `menu-90.png`, `menu-110.png` not opened. | PASS on counts; capture sub-step NOT RUN |
| TC-036-15 Settings four scales | AC-2 | Hand-walk | `clipped('.hud-menu-wrap')` with the exclusion removed: 0 entries at 90/100/110/125, at top and at end of scroll (scrollers `div.set-grid` and `div.set-bind-list` scrolled to end); `hscroll` inside wrap: none at all scales. `settings-panel-*.png` captured. | PASS |
| TC-036-16 Research four scales | AC-2 | R2/R4 | Both runs `## research` clip @90/100/110/125: 0. `research-125.png` opened: node labels drawn. | PASS |
| TC-036-17 Brief four scales | AC-2 | R2/R4 | Both runs `## brief` clip @90/100/110/125: 0; no `hscroll ... mb-tac-rail`. `brief-125.png` opened: recon overlay labels and tactical rail drawn. | PASS |
| TC-036-18 Assembly four scales | AC-2 | R2/R4 | Both runs `## team` clip @90/100/110/125: 0. `team-90.png`, `team-125.png` opened; `team-110.png` not opened. (MOBILITY break is TC-22.) | PASS on counts; capture sub-step NOT RUN |
| TC-036-19 Debrief four scales | AC-2 | R2/R4 | Both runs `## debrief` clip @90/100/110/125: 0. `debrief-125.png` opened: rows drawn down to the scroll edge (rest of the list scrolls). | PASS |
| TC-036-20 Mission four scales | AC-2 | R2/R4 | Both runs `## mission` clip @90/100/110/125: 0. `mission-125.png` opened: squad slot column and panel heads on screen. | PASS |
| TC-036-21 Pause four scales | AC-2 | Hand-walk | `clipped('.hud-menu-wrap')` with the exclusion removed: 0 entries at 90/100/110/125; no scrollers, no hscroll. `pause-menu-*.png` captured; `pause-menu-125.png` opened. | PASS |
| TC-036-22 Assembly MOBILITY | AC-2 | Hand-walk | `.ts-stats label` line boxes (label width): @90 HLTH 1, STAMINA 1, FOCUS 1, MOBILITY 1 (49.6 px, 9 px font). @100 MOBILITY **2** (label 49.6 px, 10 px font); @110 MOBILITY **2** (52.5 px, 11 px); @125 MOBILITY **2** (62.9 px, 12.5 px). HLTH/STAMINA/FOCUS 1 at every scale. Captures show `MOBILIT` / `Y` (`team-stats-100.png`, `break-team-*.png`). Expected 1 line box at every scale. Rule `.ts-stats label` has `overflow-wrap: anywhere` (`src/ui/ui.css:2471`). | **FAIL** |
| TC-036-23 Mid-word breaks, eight surfaces | AC-2 | Hand-walk | 8 surfaces × 4 scales walked. Hits: Assembly @100 `MOBILIT\|Y`, @110 `MOBILIT\|Y`, @125 `MOBILIT\|Y` (`div.scroll.ts-detail-list > div.ts-stats > div > label`). Every other surface/scale: 0 (Menu 0 multi-line nodes; Settings 7–11 multi-line nodes, 0 breaks; Research, Brief, Debrief, Mission, Pause 0 breaks). No hit beyond TC-036-22's. | PASS (only hits are the TC-036-22 defect) |

## Not run

- Capture sub-steps of TC-036-03 (`research-100.png`), TC-036-04 (`brief-100.png`), TC-036-05 (`team-100.png`), TC-036-14 (`menu-90.png`, `menu-110.png`), TC-036-18 (`team-110.png`): NOT RUN — not blocked; Claude did not open these files before the coordinator's turn limit. The files exist and can be checked now. Counts for these cases were read and are 0, but the capture sub-step is unobserved, so these cases are not full PASS.

## Notes (non-AC / per rulings)

1. Blinking caret `_` (`span.cursor`, `cursor-blink`, ratio 3.84) on Menu and behind Settings: cursor glyph, recorded here per ruling, not FAIL. R4's Menu line does not list it (its contrast depends on the blink phase when measured).
2. World Network mid-fade @40 ms (25%): 14 runs < 4.5 inside the orientation card, alpha 0.378 from the frozen fade; gone by 80 ms and when settled; none under reduced motion. Recorded per ruling, not FAIL.
3. Settings @125%: the TEXT SCALE description ("Screens scroll rather than clip at larger sizes") is squeezed into a narrow column, one or two words per line (`settings-panel-125.png`). No clip and no mid-word break; layout readability observation only.
4. Debrief: the last visible row is dimmed at the scroll edge (scroll arrow shown) in `debrief-100.png` / `debrief-125.png`; the measured counts are 0 in both R2 and R4.
5. R4 batch `world-100.png` shows the globe area black, while the R4 alone capture shows the globe drawn. Counts identical (0). Renderer warm-up in headless swiftshader; not an AC item.
6. With `.hud-menu-wrap` not excluded, `clipped('body')` lists text/box overlaps between the modal panel and the Menu or HUD behind it (Settings 18–27, Pause 9–23 per scale). That is the modal covering the screen behind it, not a layout defect inside the panel.
7. TC-036-22 defect not yet filed with `/bug-report` (this phase writes results only); route to qa-lead.

## Verdict

**FAIL**
- AC-1: PASS on every count (R2, R4, hand-walk). Five capture sub-steps NOT RUN (listed above).
- AC-2: **FAIL** — TC-036-22: `MOBILITY` renders as 2 line boxes at 100/110/125% (expected 1). Every other AC-2 case passes on counts.

## Capture sub-steps completed (orchestrator, 2026-10-24)
Viewed: r2-sweep/research-100.png, brief-100.png, team-100.png, menu-90.png, menu-110.png, team-110.png. On Research, Brief and the menu at both scales I saw no clipped text, overlapping box or ellipsis. Assembly at 100 and 110 shows the stat tile `MOBILIT` / `Y`, the TC-036-22 defect already recorded. TC-036-03, -04, -05, -14 and -18 are therefore **PASS** (their counts were already 0).
Story verdict stands: **FAIL** (AC-2, TC-036-22: the `MOBILITY` mid-word break; owner ruling 2026-10-24).
