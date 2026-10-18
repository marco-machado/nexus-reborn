# Test Evidence: IF-002 Critical state has non-colour cues; one OS styling

> **Story**: `production/epics/interface/story-002-critical-state-has-non-color-cues-one-os-styling.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-10-17; re-captured 2026-10-18 after the advisory-review fixes
> **Tester**: Claude (headless Chrome for Testing, /dev-story, unattended workflow run)
> **Build / Commit**: 0548369 + uncommitted code-review fixes (Assembly bay focus, brackets inside scrolling lists, Debrief scroller). Earlier: cd98566 (IF-002 work and the Ledger Amber cleanup, committed together), then 0548369 with the fixes from advisory review 2: the 2 Hz edge glow, the lost-banner cross, colour literals moved onto palette tokens, credit balances in Ledger Amber, and the doc wording. The final re-capture (2026-10-18) is from that tree.
> **Captures**: `production/qa/evidence/if-002/` (script `capture.mjs`, transcript `capture-output.txt`, facts `capture-result.json`)

---

## What Was Tested

`capture.mjs` drives the real app on the dev server at 1280×720. It shows each of the 7 critical states once in colour and once under `filter: grayscale(1)` on `<html>`, so the WebGL feed is desaturated too. It then reads the non-colour cue from the DOM and fails if that cue is missing.

Harness assists:
- Focus is reached with the Tab key, so `:focus-visible` is real keyboard focus. The focus sweep also uses Tab.
- For injury/KIA, Alert and result, the sim is frozen (`missionStore.live = false`). The HUD store is then written with the setters the sim uses (`setSquad`, `setAlert`, `setCiviliansHit`, `setResult`). High contrast is switched on by adding `s-high-contrast` to `<html>`, as Settings does.

These assists show each state on demand. They do not exercise the sim rules that produce the states.

**Acceptance criteria covered**: AC2 (all 7 states), AC3 (Menu and Mission HUD captures, recorded below).

---

## AC2: one non-colour cue per state

Re-captured 2026-10-18 after the advisory-review fixes. All captures in `production/qa/evidence/if-002/` are from that run (`capture-output.txt`: ALL PASS).

| # | State | Captures (colour / grey) | Non-colour cue | Hue (living §12) |
|---|---|---|---|---|
| 02 | Focus | `02-focus-colour.png` / `02-focus-grey.png` | The P-04 corner-bracket set: four 2px corners (eight 10×2 px strokes) on a `::after` layer, 4px outside the control. The chevron CTA clips its own box, so it draws the brackets on its face, inset past the chevron cuts. A canvas (minimap) and form fields have no `::after` and keep a 2px frame. Research nodes keep their 2px dashed hex stroke. | Teal; Print White on the teal CTA face. |
| 03 | Lock | `03-lock-colour.png` / `03-lock-grey.png` | The locked Brief tab prints a lock glyph, the word `LOCKED`, the condition `NO CONTRACT SELECTED`, and a dashed frame (P-06). The selected tab has a closed 2px frame. | Red marks the lock. The selected tab is teal. |
| 04 | Selection | `04-selection-colour.png` / `04-selection-grey.png` | Closed double ring (`outline: 3px double`) plus a bracketed slot `[1]`. Two cards are shown, for multi-select. The `ACTIVE` corner tag is a word. | Teal. |
| 05 | Objective | `05-objective-colour.png` / `05-objective-grey.png` | The active row has a triangle mark and the printed token `ACTIVE`. Done rows have a check, failed rows a cross plus struck-through text, pending rows an empty box. | VIP Ice `#9be8ff` on the row, the mark, the token, the progress bar, and the minimap pulse and defend ring. |
| 06 | Injury / KIA | `06-injury-kia-colour.png` / `06-injury-kia-grey.png` | Injured (under 30% HP): health pips drop, the numeral prints (`22/110`), a `+ INJURED` chip shows, and the health bar gets a **2px dashed outline in Red Hot** outside the bar (was a 1px dashed border at 60% red, barely visible). KIA: skull glyph, `FLATLINED`, struck-through name and a faded card (P-09). | Red reinforces. |
| 07 | Alert | `07-alert-colour.png` / `07-alert-grey.png` | Edge glow plus printed word (art bible §4.5, §7.5 #7). Hot, `ALERT: 2` prints bold in Print White inside a 2px Red Hot frame, the bars blink, and the screen edge carries a steady 3px red rim with a red inner glow that pulses at about 2 Hz, the alarm cadence (art bible §7.4); 0.3 alpha, 48px blur (`.hud-edge-glow`, static at full strength under reduced motion). | Red. |
| 08/09 | Result | `08-result-won-*.png`, `09-result-lost-*.png` | Banner words `CONTRACT FULFILLED // EXTRACTION CONFIRMED` and `SQUAD ELIMINATED // CONTRACT TERMINATED`. The lost title now prints in Print White (17.7:1 against the banner ground; the won title is 14.5:1); red carries failure on a 2px frame and the sub-line. The lost title opens with the failed-objective mark (a crossed box), so lost differs from won by shape as well as words. | Teal for won; red frame, sub-line and cross for lost. |
| 10 | Collateral / Credits | `10-collateral-credits-*.png` | Collateral is the hud.md E4 chip: `COLLATERAL 2`, a count with no CR, in Telemetry Ink; the word carries it. Credits print `128,450 CR` (hud.md E5). | Collateral ink (not Ledger Amber). Credits Ledger Amber (art bible §4.1: money). |
| 11 | High contrast | `11-high-contrast-*.png` | The same HUD under `:root.s-high-contrast`: the Alert frame, the injured dashed outline and the selection double ring all hold. | Unchanged. |
| 12 | Focus on an Assembly bay | `12-assembly-bay-focus-*.png` | The bay owns `::after` for its glass sheen, which used to replace the bracket set (no focus cue at all; found by code review 2026-10-18). `.ts-bay:focus-visible::after` now paints the eight bracket strokes over the sheen. | Teal. |
| 13 | Focus inside a scrolling list | `13-sector-focus-*.png` | A sector card in the scrolling sector list draws its bracket set on its own edge (`--focus-inset: 0` on `.scroll` and `.set-bind-list`), so the list no longer clips it. | Teal. |

**Focus sweep**: the script Tabs through the Menu (5 stops), Settings (40), the World Network (39), Research (40), Assembly (39) and the Mission HUD (29). Every stop draws the bracket set, or a 2px frame for a canvas / form field, or the dashed stroke for an SVG node. Clipping is checked against the element's own box, every ancestor whose overflow is not visible or that has a clip-path, and the viewport (`capture-result.json` → `focusSweep`, with the stops each sweep reached). Correction: before 2026-10-18 the sweep checked only the element's own overflow and covered only Menu, World Network and HUD, so this line overstated it. Code review found the gaps: the World Network sector and contract cards, the Assembly roster rows and a Settings rebind row were clipped by their scrolling lists, and Assembly bays showed no focus cue. All are fixed and now pass. The Assembly sweep's 40 Tabs stop in the roster and do not reach the bays; capture 12 covers a focused bay. The Debrief invoice (`.db-rows`), the one focusable scroller, paints the set as its own fixed background; it is checked on a stand-in with the same class (harness assist; the Debrief itself is not reached in this run).

**Minimap**: the check zooms the minimap fully out (it opens at its closest zoom, which leaves the objective zone off the canvas), samples 14 frames with the sim frozen, then restores the zoom. VIP Ice pixels that come and go between frames are the objective pulse; VIP Ice pixels in every frame would be static VIP / DEVICE marks. Result: 24 pulse pixels, 0 steady VIP Ice pixels (this mission shows no VIP or DEVICE mark), 0 amber pixels (`capture-result.json` → `minimap`). Correction: the earlier version of this check reported 1000 "VIP Ice" pixels, but its colour test also matched teal, so those were teal operatives, not the pulse.

**Nominal Green**: none painted under `.hud-root` (`greenInHud: []`).

I opened and viewed `02-focus-grey`, `06-injury-kia-grey`, `07-alert-grey` and `09-result-lost-grey` in earlier 2026-10-18 runs, the softer 2 Hz glow in `07-alert-colour` / `07-alert-grey` from a scratch run, and `09-result-lost-grey` and `03-lock-colour` from the final run. The retained files are from the final run. From the 2026-10-18 code-review fix run I viewed `12-assembly-bay-focus-colour` and `13-sector-focus-grey`: the bracket corners show on the bay and inside the sector card.

---

## AC3: Menu and Mission HUD styling (recorded judgment)

| Check | Menu (`01-menu-*.png`) | Mission HUD (`04`–`11`) |
|---|---|---|
| Shared near-black ground | `rgb(4, 7, 10)` = `--bg` | `rgb(4, 7, 10)` = `--bg` |
| Monospace | `"SF Mono", ui-monospace, … monospace` | same stack |
| Uppercase labels | All labels sampled are uppercase | All labels sampled are uppercase |
| Primary values larger than labels | Title over subtitle and status line | Credits value over its dim `CREDITS` label and `CR` suffix; ammo numerals over the weapon name; codename over name |
| Technical borders | Hairline rules with tick marks; 1px Settings frame; chevron CTA | 1px panel frames with `corners`; double ring on selection |
| Teal selection / live | Focus brackets teal; `NEW OPERATION` CTA Signal Cyan | Selection, ACTIVE tag, clock, live log lines, RELOADING / DRAWING, HOLD, DRAWN, TARGETING, running ability teal |
| Ledger Amber for money only (price, balance and spend authorization) | No amber on the Menu | Credits only. Every credit balance on the Screens is now Ledger Amber too: the header chip, World Network Resource Pool, and Research available and committed credits (they were teal or ink). |
| Red danger | n/a | Alert, edge glow, injury, KIA, lost frame, fire-discipline TIGHT, PAUSED |
| VIP Ice active objective | n/a | Objective row and minimap pulse; DEVICE and VIP marks |

**Coherence judgment**: Menu and Mission HUD read as one terminal. They share the ground, the type, the frame language and the teal instruction colour. Neither surface now spends Ledger Amber on anything but money.

### Recorded deviations: resolved 2026-10-18

1. Menu `NEW OPERATION` / `CONTINUE` CTA is Signal Cyan. The base `.cta` is Signal Cyan; `.cta.spend` keeps the amber face for Authorize Project, the one CTA that debits credits. Accept Contract, Deploy Team and Recruit are Signal Cyan. The secondary `NEW OPERATION` button has no hue (main-menu.md). Recruit market and Replay buttons are Signal Cyan; Hire keeps amber (it spends).
2. Squad card `RELOADING` / `DRAWING` and the `HOLD` chip are teal.
3. `DRAWN`, grenade `TARGETING` and a running ability are teal (running = filled face plus double-weight frame); cooldown is dim ink with its printed countdown.
4. `PAUSED` is red (P-20: red may mark paused); the pause-menu Resume button is teal.
5. Minimap checkpoint is an ink diamond; suspicious CorpSec is red with an open ring around the dot (shape, not hue; P-10), cones red; `DEVICE` is VIP Ice (art bible §5.2). The `DEVICE` amber token is gone from `tokens.ts`.
6. World Network focused sector card (left list and right panel `FOCUS` chip, CONTROL reading), `.wm-land.focus`, and the clock-speed buttons and readout are teal. Research in-progress node, links, legend, lab card and progress readouts are teal.
7. Collateral follows hud.md E4 (the 2026-09-29 decision recorded in hud.md: the spec follows the GDDs). Credits follow art bible §4.1 and hud.md E5.

### Still Ledger Amber outside money (out of this story's list)

Found while making the changes above and not changed in IF-002. A separate cleanup session has since changed these in the same working tree (uncommitted; it reports lint, test, build and the IF-001 sweep passing). That work is not part of this story's evidence, but the final captures include it (for example, Influence and the timeline in `03-lock-colour` are no longer amber).
- Assembly: selected roster row (`.ts-row.sel`) and focused bay (`.ts-bay.focus`) are amber selection and focus; augment pin `ON`; role glyph; mass bar.
- Brief: tactical target outline and callout, `PATROL CONTACTS`, and the map `DEVICE` square (`.mb-tac-device`, `#ffb300`).
- World Network: Influence chip and points, `NO // NOT NEXUS-HELD`, unrest pressure, timeline handle / `NOW` / review date, feed amber lines, sector inset target and influence action cards.
- 3D scene: the device core and ring (`#ffb300`) and the officer chest lamp in `src/scene/unitModel.ts`.
- Pause and Balance armed hints.

---

## Regression

- IF-001 layout sweep (`production/qa/evidence/if-001/sweep.mjs`, run from a scratch copy so IF-001's evidence was not overwritten) on the 2026-10-18 tree: ALL SURFACES CLEAN at 90/100/110/125%, including the sub-minimum window.
- `npm run lint`: clean. `npm run test`: 60 files, 1535 tests passed. `npm run build`: built.
- Unit tests: `src/ui/criticalCues.test.ts` (3 tests) covers objective-state precedence, the active token, and the injured/KIA threshold.

---

## Advisory review: art-director agent (2026-10-18)

This is an agent's review, not the lead sign-off. The lead row below stays pending.

**Verdict**: APPROVED WITH CONDITIONS. None of the conditions blocks AC2 or AC3.

**What it checked**: all 9 greyscale captures; the 01, 04, 05 and 07 colour captures; `capture-result.json` (`greenInHud: []`, `errors: []`); `capture-output.txt` (ALL PASS). It checked them against `docs/game-design.md` §12, art bible §4.1–4.5 and §5.2, `design/ux/hud.md` E4, and `interaction-patterns.md` P-04.

**AC2**: every one of the 7 states still reads in greyscale, and every hue role is correct.
- Injury: the dashed frame on the health bar is barely visible at 1280×720. The `22/110` and `+ INJURED` text still carries the state.
- Alert: `ALERT: 2` reads only as mid-grey text. The edge glow that art bible §4.5 pairs with the word is not in the capture.
- Result: the lost banner title has lower contrast than the won title, but it is readable.

**AC3**: the Menu and the Mission HUD read as one OS. The one real break is the amber `NEW OPERATION` CTA, which is already recorded as a deviation.

**Conditions (all non-blocking; all addressed 2026-10-18, see AC2, AC3 and the resolved list above)**:
1. Replace the focus frame with the P-04 corner-bracket set. Art bible §4.5 and §7.5 make brackets binding.
2. Palette follow-up: move Ledger Amber off the 7 recorded non-money elements. Start with the Menu CTA and the minimap `DEVICE` mark, which goes against art bible §5.2.
3. Design call on the Collateral chip (`hud.md` E4 says ink, count only, no CR). The chip is not in any capture, so the agent could not check it.
4. Add the Alert edge glow, or brighten the Alert word, so it reads more strongly in greyscale.
5. The HUD credits value is white, but art bible §4.1 assigns credits to Ledger Amber. Reconcile this together with condition 2.
6. Not checked: the minimap active-objective pulse in VIP Ice, and whether the cues hold in high-contrast mode. Neither appears in the captures.

---

## Advisory review 2: art-director agent (2026-10-18, after the fixes)

This is an agent's review, not the lead sign-off. The lead row below stays pending.

**Verdict**: APPROVED WITH CONDITIONS. None of the conditions blocks AC2 or AC3.

**What it checked**: all 11 greyscale captures; the 01, 03, 07, 09 and 10 colour captures; `capture-output.txt` (ALL PASS); the `.hud-edge-glow` CSS and its render condition in `Hud.tsx`. It did not view the other colour captures, run the diff, or see any focus-sweep stop other than the Menu CTA.

**Prior conditions**:
1. Focus brackets: resolved. The sweep results are the script's report only.
2. Amber off the seven elements: resolved where captured. `PAUSED` in red was not captured.
3. Collateral: resolved (ink, count only, no CR).
4. Alert: resolved. The framed bold word and the edge rim both read in greyscale.
5. Credits: resolved against art bible §4.1. The §12 wording "price and spend authorization only" still conflicts with it. Resolved 2026-10-18: §12, §14 and interface.md Rule 4, the summary and AC2/AC3 now read "money: prices, credit balances and spend authorization".
6. Partly resolved. High contrast holds. The minimap check does not isolate the objective pulse from the VIP and DEVICE marks.

**AC2**: all states read in greyscale, hue roles match §12, and there is no green on the HUD. Won and lost differ in greyscale only by their words.

**AC3**: Menu and Mission HUD read as one terminal. The teal Menu CTA keeps clear hierarchy over the hueless Settings button.

**New conditions (all non-blocking; 1, 2 and 5 addressed 2026-10-18, see AC2 rows 07 and 08/09; 3 addressed in main-menu.md and 4 in the GDD wording; 6: the 62 rgba literals added since 7a38fcd, and the 3 from 06420c7, are now `color-mix()` of the palette tokens, so they follow high-contrast remaps; 7: the minimap check now isolates the pulse; all 2026-10-18)**:
1. The edge glow breathes on a 1.6 s cycle, which is selection's cadence. The art bible says alarm pulses fast (~2 Hz). Speed it up, or make it static and let the blinking bars carry the motion.
2. The edge glow is loud (`inset 0 0 90px 18px`, 0.42 alpha) and tints the left void and the squad-panel edge. Consider about 0.3 alpha and a shorter blur.
3. main-menu.md says New Operation has "no hue assigned". Reconcile it with the teal primary `<< NEW OPERATION >>`, or record a decision.
4. Reword §12 so credit balances are explicitly allowed Ledger Amber (art bible §4.1).
5. Consider a failure glyph on the lost banner so it differs from won by shape as well as words.
6. The new `rgba(224, 75, 60, …)` literals widen the tokens-only drift already recorded under ADR-0017.
7. Make the minimap check isolate the objective pulse from the VIP and DEVICE marks.

---

## Sign-off

| Role | Name | Verdict | Date |
|---|---|---|---|
| Implementer | Claude (dev-story) | Captures retained and viewed; AC2 cues present in colour and greyscale | 2026-10-17 |
| Advisory (art-director agent) | Claude (art-director agent) | APPROVED WITH CONDITIONS (advisory; conditions non-blocking, see above) | 2026-10-18 |
| Implementer (advisory fixes) | Claude | Conditions 1–6 addressed; re-captured ALL PASS; captures viewed | 2026-10-18 |
| Advisory 2 (art-director agent) | Claude (art-director agent) | APPROVED WITH CONDITIONS (advisory; 7 new conditions, all non-blocking, see above) | 2026-10-18 |
| Lead (art-director) | Marco Machado | PASS | 2026-10-18 |
