# Test Evidence: IF-002 Critical state has non-colour cues; one OS styling

> **Story**: `production/epics/interface/story-002-critical-state-has-non-color-cues-one-os-styling.md`
> **Story Type**: Visual/Feel
> **Date**: 2026-10-17
> **Tester**: Claude (headless Chrome for Testing, /dev-story, unattended workflow run)
> **Build / Commit**: e9593fe + uncommitted IF-002 working tree
> **Captures**: `production/qa/evidence/if-002/` (script `capture.mjs`, transcript `capture-output.txt`, facts `capture-result.json`)

---

## What Was Tested

`capture.mjs` drives the real app on the dev server at 1280×720. It shows each of the 7 critical states once in colour and once under `filter: grayscale(1)` on `<html>`, so the WebGL feed is desaturated too. It then reads the non-colour cue from the DOM and fails if that cue is missing.

Harness assists:
- Focus is reached with the Tab key, so `:focus-visible` is real keyboard focus.
- For injury/KIA, Alert and result, the sim is frozen (`missionStore.live = false`). The HUD store is then written with the setters the sim uses (`setSquad`, `setAlert`, `setResult`).

These assists show each state on demand. They do not exercise the sim rules that produce the states.

**Acceptance criteria covered**: AC2 (all 7 states), AC3 (Menu and Mission HUD captures, recorded below).

---

## AC2: one non-colour cue per state

| # | State | Captures (colour / grey) | Non-colour cue | Hue (living §12) |
|---|---|---|---|---|
| 02 | Focus | `02-focus-colour.png` / `02-focus-grey.png` | A 2px frame. The global `:focus-visible` rule draws a 2px outline with a 2px offset. The chevron CTA clips outlines, so it draws an inset 2px frame on its face instead. Research nodes use a 2px dashed hex stroke. | Teal. Ledger Amber no longer marks focus (Research node and Scan marker focus were amber). |
| 03 | Lock | `03-lock-colour.png` / `03-lock-grey.png` | The locked Brief tab prints a lock glyph, the word `LOCKED`, the condition `NO CONTRACT SELECTED`, and a dashed frame (P-06). It used to be dimmed, with a hover tip. The selected tab has a closed 2px frame. | Red marks the lock. The selected tab is now teal (it was amber). |
| 04 | Selection | `04-selection-colour.png` / `04-selection-grey.png` | Closed double ring (`outline: 3px double`) plus a bracketed slot `[1]`. Two cards are shown, for multi-select. The `ACTIVE` corner tag is a word. | Teal (was Ledger Amber). |
| 05 | Objective | `05-objective-colour.png` / `05-objective-grey.png` | The active row has a triangle mark and the printed token `ACTIVE`. Done rows have a check, failed rows a cross plus struck-through text, pending rows an empty box. | VIP Ice `#9be8ff` (was amber) on the row, the mark, the token and the progress bar. The minimap's active-objective pulse and defend ring are also VIP Ice now. |
| 06 | Injury / KIA | `06-injury-kia-colour.png` / `06-injury-kia-grey.png` | Injured (under 30% HP): health pips drop, the numeral prints (`22/110`), a `+ INJURED` chip shows, and the health bar gets a dashed frame. KIA: skull glyph, `FLATLINED`, struck-through name and a faded card (P-09). | Red reinforces. |
| 07 | Alert | `07-alert-colour.png` / `07-alert-grey.png` | The word and number `ALERT: 2`, with blinking bars when hot. Already in place. | Red. |
| 08/09 | Result | `08-result-won-*.png`, `09-result-lost-*.png` | Banner words `CONTRACT FULFILLED // EXTRACTION CONFIRMED` and `SQUAD ELIMINATED // CONTRACT TERMINATED`. Already in place. | Teal for won, red for lost. |

**Nominal Green**: the comm-log `ok` lines were Nominal Green and are now teal. The script scans every element under `.hud-root` for `rgb(125, 224, 138)` and finds none painted (`capture-result.json` → `greenInHud: []`).

Each grey capture still shows its state. I opened 02, 04, 06, 07, 09 and 03 and viewed them.

---

## AC3: Menu and Mission HUD styling (recorded judgment)

| Check | Menu (`01-menu-*.png`) | Mission HUD (`04`–`09`) |
|---|---|---|
| Shared near-black ground | `rgb(4, 7, 10)` = `--bg` | `rgb(4, 7, 10)` = `--bg` |
| Monospace | `"SF Mono", ui-monospace, … monospace` | same stack |
| Uppercase labels | All labels sampled are uppercase (`labelsNotUppercase: []`) | 24 labels sampled, all uppercase |
| Primary values larger than labels | Title over subtitle and status line | the Credits value (15px, bright) beside its smaller dim `CREDITS` label (as captured); ammo numerals over the weapon name; codename over name |
| Technical borders | Hairline rules with tick marks; 1px Settings frame | 1px panel frames with `corners`; double ring on selection |
| Teal selection / live | Focus frame teal | Selection, ACTIVE tag, clock, live log lines teal |
| Ledger Amber for price and spend authorization only | Deviation: the New Operation CTA is amber (see below) | Collateral chip (prints `CR`) is amber, which matches §12. Other deviations are listed below. |
| Red danger | n/a | Alert, injury, KIA, lost banner, fire-discipline TIGHT |
| VIP Ice active objective | n/a | Yes |

**Coherence judgment**: Menu and Mission HUD read as one terminal. They share the ground, the type, the frame language and the teal instruction colour. The remaining incoherence is Ledger Amber used outside price, listed below.

### Recorded deviations (not changed in this story)

Ledger Amber is still used outside price and spend authorization on these elements. None of them is one of the 7 critical states. Each is recorded for a palette follow-up:

1. Menu `NEW OPERATION` / `CONTINUE` chevron CTA (`.cta`), and amber `.btn` CTAs on other Screens.
2. Mission HUD squad card: `RELOADING` / `DRAWING` (amber blink) and the `HOLD` stance chip.
3. Mission HUD weapon headers `DRAWN`, grenade `TARGETING`, and the ability slot `armed` / `cooldown` states.
4. Mission HUD `PAUSED` button state, and the pause-menu Resume button.
5. Minimap checkpoint diamond and suspicious-CorpSec marks and cones. The art bible §5.2 also puts `DEVICE` on VIP Ice, but `DEVICE` is still `#ffb300`.
6. World Network: the focused sector card (`FOCUS`), the `.wm-land.focus` fill, the clock-speed button, and the Research `active` node and links.
7. hud.md E4 says Collateral is Telemetry Ink and count only, with no CR. The shipped chip is amber and prints `−n CR`. The GDD and hud.md disagree here; that needs a design call.

Focus is drawn as a 2px frame, not the corner-bracket set that P-04 and art bible §4.5 name. It is a frame shape and it survives greyscale, but it is not brackets.

---

## Regression

- I ran the IF-001 layout sweep (`production/qa/evidence/if-001/sweep.mjs`, from a scratch copy so IF-001's evidence was not overwritten) on the IF-002 tree. Every surface passed at every scale except `world-network @125%`, which reports `SPILL .wm-act-cost "10P"` and `SPILL .wm-act-status.dim "UNAFFORDABLE"` past `.wm-act`.
- I re-ran the same sweep with the IF-002 changes stashed. It gave the same 2 SPILL lines, so that failure was already there and IF-002 did not cause it.
- `npm run lint`, `npm run test`, `npm run build`: see the dev-story summary.
- Unit tests: `src/ui/criticalCues.test.ts` (3 tests) covers objective-state precedence, the active token, and the injured/KIA threshold.

---

## Sign-off

| Role | Name | Verdict | Date |
|---|---|---|---|
| Implementer | Claude (dev-story) | Captures retained and viewed; AC2 cues present in colour and greyscale | 2026-10-17 |
| Lead (art-director) | **pending** | Required by the QA plan (IF-002 lead sign-off) before `/story-done` | — |
