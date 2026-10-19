# IF-001 every surface at 1280x720 and every text scale — 2026-10-17 (local time)

## Result and scope

- Result: **partial click-through; sweep pass.** The scripted sweep finds no clipped/truncated text and no unintended overlap on all 9 listed surfaces at 90/100/110/125% after the fix below. The click-through per `docs/click-through.md` is **partial**: the unexercised steps are listed under Browser coverage and are not passed by this record.
- Requested checks: story `production/epics/interface/story-001-every-surface-fits-1280-720-at-every-text-scale.md` AC1 and AC20; QA plan case IF-001 (`production/qa/qa-plan-sprint-009-2026-10-17.md`).
- Changed behavior under test (`src/ui/ui.css`): Mission HUD squad card name row and weapon-name labels no longer ellipsize or overlap at 125%; the weapon panel header `PRIMARY // <codename>` wraps inside its panel; the Assembly `DEPLOY TEAM >>` button fits its column at every scale. `index.html` declares an empty icon so the page no longer requests the missing `/favicon.ico`.
- Excluded behavior: semantic colour roles and non-colour cues (Story 002); keyboard focus order; audio.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | `89a51961aae668ce104e910309b789ad1becdf5e` plus the working-tree changes below |
| Working-tree changes | `src/ui/ui.css` (HUD and Assembly fixes), `index.html` (empty icon), `src/state/settingsStore.test.ts` (step-set test), story + sprint-status bookkeeping, this directory. Uncommitted at the time of the run. |
| Build and tools | Vite dev server (`npm run dev -- --strictPort`, port 4200); Node v24.16.0, npm 11.18.0; playwright-core 1.64.0-alpha (from the global `@playwright/cli`) |
| Machine | Apple M5 Pro |
| OS and browser | macOS 26.5.2 (25F84); Google Chrome for Testing 155.0.8059.12, **headless** |
| Rendering | Console: `[scene] renderer backend: WebGPU, quality tier: HIGH`; viewport 1280x720 (and 1100x650 for the sub-minimum check); DPR 1 |
| Save and origin | Fresh browser context; `localStorage.clear()` before load; New Operation |
| Mission setup | Glass Veil (first open contract), Difficulty STANDARD (default), MARA, GHOST, DART and KESTREL (the longest READY codename; the sweep swaps it in for the fourth bay), stock loadout |

## Procedure and observations

### Second correction (after the 2026-10-17 re-review)

The re-review found a real defect the sweep passed and two checker gaps. Items 1-2 fix the checker gaps; items 3-5 are further hardening; the defect is fixed below:

1. **CLIP now catches text spilling out of a visible-overflow panel.** It measures the rendered glyphs (a Range over the leaf's text nodes, not the element's box) and, per axis, walks up the ancestors: past a box scrolling on that axis the text is reachable; past one clipping on that axis it is `CLIPPED`; past a drawn border of a visible-overflow box it is `SPILL`.
2. **Reachability is per axis.** An axis counts as scrollable only when that axis is `auto`/`scroll`, in CLIP and in the OVERFLOW-HIDDEN pass. `.screen` at 110/125% (`overflow-x: hidden; overflow-y: auto`) no longer excuses horizontal loss.
3. **Sub-minimum is asserted**: `.app-root` and the document scroll size must both be at least 1280x720 at 1100x650, or the run fails.
4. **Active-operative pass**: with the Mission HUD at 125% each squad slot is made active in turn (Digit1-4); the weapon header then names that operative. KESTREL is in the squad.
5. Network failures are logged with their URL (`requestfailed`); the orientation dialog is asserted gone after dismissal; `SWEEP_CHROME` overrides the browser path.

With the stricter checks the sweep failed on two real defects, both fixed in `src/ui/ui.css`:

- Mission HUD at 125%: `PRIMARY // MARA DRAWN` ran past the primary panel's right border (`.hud-panel-head` is `nowrap` in a 188px panel below 1360px). Weapon-panel headers now wrap.
- Assembly at every scale: `CLIPPED .cta-inner "DEPLOY TEAM >>" in .screen.ts` and `OVERFLOW-HIDDEN .screen.ts (1315x720 in 1280x720)`. The `>>` was cut off at the right edge in every capture; this is the 1315px `scrollWidth` that the first correction below attributed to nothing visible. The deploy button now uses tighter tracking and padding in its column and wraps rather than clips.

The two console 404s were `/favicon.ico` (the dev server returns 404 for it; `public/` has no icon). `index.html` now declares an empty icon.

### Method

Command: `node production/qa/evidence/if-001/sweep.mjs` with the dev server up. Output: [`sweep-output.txt`](sweep-output.txt); per-check data: [`sweep-result.json`](sweep-result.json).

Checks per surface and scale (see the header of `sweep.mjs`): CLIP (text leaving a non-scrolling container, ellipsized or line-clamped content, overflow-hidden boxes losing text, page overflow hidden) and OVERLAP (two visible text/control boxes intersecting >1px inside the same layer; declared overlays `.hud-menu-wrap` = Settings/Balance/pause and `.hud-toasts` = tutorial toasts are separate layers). Content inside a scroll container counts as reachable for CLIP, and is still checked for OVERLAP:

- Every scroll container (and the page) is stepped through its full range on each player-scrollable axis (overflow auto/scroll on that axis), half a viewport per step plus the end, and both checks run at every position. The output names each scrolled container, its range and the number of stops.
- Two boxes in the same scroll container are compared on their unclipped boxes (their relative position does not change with scrolling), clipped only by overflow-hidden boxes inside that container. Boxes in different scroll contexts are compared on their visible parts at each stepped position.
- Each line reports `checked/candidates`: candidates are all visible text leaves and controls; checked are those that took part in the overlap comparison. Any candidate never checked is printed by name. In this run checked = candidates on every surface at every scale (e.g. settings 157/157 at 125%, assembly 197/197, debrief 36/36), so no box below a fold is skipped.
- Negative control (one-off probe, not kept): a text span planted on the Settings bind list at 125% below the list's fold (row top 607px, list bottom 529px), pulled up onto the row above, was reported as five `OVERLAP ... x span "PLANTED OVERLAP"` lines; the unplanted surface reported none.

Correction to the earlier run: the previous version of the sweep dropped any box fully scrolled out of view from the overlap check (the box counts fell as the scale rose, e.g. settings 137 -> 119, assembly 188 -> 164). Its "pass" covered only what was on screen at the initial scroll position. The results below come from the corrected sweep. While correcting it, two checker false positives appeared and were fixed in the checker, not the UI: (1) the OVERFLOW-HIDDEN rule counted a leaf scrolled out of an inner scroll list (`.ts-detail-list`) as lost from the overflow-hidden `.screen.ts`; a leaf behind a scroll container inside the box is now treated as reachable, the same rule CLIP already used; (2) `.screen.ts` has `overflow-x: hidden` with `scrollWidth` 1315 in 1280 at every scale, and no visible element extends past its right edge (probed at all four scales), so that axis is not player-scrollable and is no longer stepped. At 110/125% `.screen` gets `overflow-y: auto` (`src/ui/ui.css`), but on every surface swept its vertical scroll range was 0; the content below a fold sits in the inner lists named in `sweep-output.txt`.

| Check | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- |
| Menu x 4 scales | no CLIP/OVERLAP | ok | pass | `menu-1280x720-scale{90,100,110,125}.png` |
| Settings (over Menu) x 4 | no CLIP/OVERLAP | ok; `.set-grid` and `.set-bind-list` stepped (125%: 294px and 194px) | pass | `settings-*.png` |
| World Network x 4 | no CLIP/OVERLAP | ok; `.wm-sector-list` stepped (125%: 122px) | pass | `world-network-*.png` |
| Research x 4 | no CLIP/OVERLAP | ok | pass | `research-*.png` |
| Brief (Glass Veil) x 4 | no CLIP/OVERLAP | ok; `.mb-tac-rail` and `.mb-dossier-scroll` stepped (125%: 108px and 178px) | pass | `brief-*.png` |
| Assembly, 4/4 assigned x 4 | no CLIP/OVERLAP | **before second fix:** `DEPLOY TEAM >>` clipped at every scale. **After:** ok; `.ts-roster-list` and `.ts-detail-list` stepped (125%: 129px and 304px) | pass | `assembly-*.png` |
| Mission HUD x 4 | no CLIP/OVERLAP | **before fix, 125%:** `ELLIPSIS .hud-wpn-name "RFC-27 ASSAULT"`, `OVERLAP .hud-agent-active "ACTIVE" x .dim "D. TORRES" (12x3)`; GHOST's name also rendered `L. FERNANDE…`. **After fix:** ok at every scale | pass (after fix) | `mission-hud-*.png` |
| Mission HUD, each slot active x 125% | no CLIP/OVERLAP with each codename in the weapon header | **before second fix:** `PRIMARY // MARA DRAWN` past the panel border. **After:** ok for MARA, GHOST, DART, KESTREL | pass (after fix) | `mission-hud-1280x720-scale125-slot4.png` (KESTREL active) |
| Pause x 4 | no CLIP/OVERLAP | same HUD defect before fix (HUD under the overlay); ok after | pass (after fix) | `pause-*.png` |
| Pause + Settings (overlay on overlay) x 4 | only overlay intersections | ok; `.set-grid` and `.set-bind-list` stepped (125%: 268px and 194px) | pass | `pause-settings-*.png` |
| Debrief (won) x 4 | no CLIP/OVERLAP | ok; invoice rows scroll inside `.db-rows` (overflow-y auto), stepped at every scale (125%: 113px) | pass | `debrief-*.png` |
| Sub-minimum 1100x650, Debrief at 125% | layout holds 1280x720 and the window scrolls | `.app-root` 1280x720, viewport 1100x650, document scroll size 1280x720; asserted (`sub-minimum ok`) | pass | `submin-debrief-1100x650-scale125.png`, `submin-debrief-1100x650-scale125-scrolled.png` |
| Text-scale step set | exactly {90,100,110,125} | `npx vitest run src/state/settingsStore.test.ts`: 18 passed, exit 0 | pass | `src/state/settingsStore.test.ts` (`text scale step set`) |

Sweep exit code (corrected sweep): 0 (`ALL SURFACES CLEAN`). The first run, before the CSS fix, exited 1 with the Mission HUD/pause failures quoted above, which is also the evidence that the checker detects a real clip and overlap.

## Browser coverage

Partial run of `docs/click-through.md` at 1280x720.

- Exercised: step 1 (Menu, open and close Settings, New Operation); step 2 in part (World Network shown, Research opened from the bottom nav, returned to World Network); step 3 in part (Glass Veil selected, Brief, Accept, Assembly with four assigned, Deploy); step 4 in part (Mission HUD live, Pause, Settings from pause, close, Resume); step 5 in part (mission finished, Debrief inspected); step 6 for clipping and overlap on every visited screen at all four scales.
- **Not exercised:** step 2 strategic clock pause/resume, Clock speed change, inspecting a Research project, focused-sector fields (including the opening North America tax yield of 4,080 CR / 24h), header and nav-tab wording checks (including Influence as a point wallet, 0 on a new operation), the World Network chrome wording checks (SECTORS, Scan with ORBITAL SCAN still up, OPEN CONTRACTS, CLOCK SPEED, Pause/Resume, TIMELINE, FEED, TIME CODE and the Control key, and the absence of VIEW SECTOR INTEL, GAME SPEED and WORLD CLOCK), Event forecast; step 3 the Glass Veil Brief weather line naming the coming front and clock (the line is visible in the Brief captures, e.g. the 125% Comms Log `WEATHER: HEAVY RAIN → LIGHT RAIN 22:16:38`, but was not checked against the step), BRIEF nav unlock check, Assembly reached from the nav, augmentation bay cycling; step 4 selecting an operative and issuing a move order by mouse, minimap use, Glass Veil weather retune at 22:16:38, Abort from pause, Balance after abort; step 5 RETURN TO WORLD NETWORK, ETA/catch-up checks, BRIEF re-lock, replay (`REPLAY // FEE ALREADY COLLECTED`), loss path; step 6 focus and keyboard navigation and readability judgement; the Balance overlay; tutorial toast over pause (toasts were present on the Mission HUD captures, pause was not opened over a toast-only state separately); the Audio changes section.
- Record amended 2026-10-19 (/team-qa Sprint 9 re-run): the step 2 World Network chrome wording checks, the two named focused-sector/header facts and the step 3 Brief weather line were added to "Not exercised" per the AC20 check in `production/qa/evidence/team-qa-2026-10-19-s9/qa-lead-review.md`. Sweep re-run at e410b9d: `production/qa/evidence/team-qa-2026-10-19-s9-r2/if-001/`.
- Console errors and warnings: earlier runs logged two `Failed to load resource: 404 (Not Found)` errors, identified as `/favicon.ico` and removed with an empty icon in `index.html` final run: 0 console errors, `ALL SURFACES CLEAN`, exit 0; info lines `THREE.WebGLRenderer: Context Lost.` x2 before the mission renderer reported WebGPU.
- Fixture use: text scale set through the live settings store (`setTextScale`, the same call the Settings buttons make). The mission was played to a win with the sim's own order API (move/attack toward each objective) with the squad healed to full every step ("god" assist) and 6 extra sim ticks per step; the outcome (won, collateral 2) was computed by the sim, not written. This Debrief is a labelled fixture in the sense of `docs/mission-playbook.md`, not a normal-play win.

## Limitations and follow-up

- Headless Chrome only; no headed or other-browser run.
- The checker covers text and controls; it does not judge decorative overlap inside the 3D canvas or SVG globe (excluded by design).
- The unexercised click-through steps above remain open; a partial run is not a pass of them (AC20).

## Cleanup

The dev server started for the run (port 4200, `.claude/launch.json` "dev") was stopped after the run; `lsof -iTCP:4200 -sTCP:LISTEN` then returned nothing (exit 1). The browser context was temporary; no player save was touched.
