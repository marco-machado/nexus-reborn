# IF-018 results: First-visit card is not aria-modal (Sprint 11 /team-qa Phase 5)

- **Story type**: UI. **Gate**: BLOCKING. **Cases**: `production/qa/test-cases/if-018-first-visit-card-is-not-aria-modal-cases.md`
- **Build**: HEAD `131a5c1` (`git rev-parse --short HEAD` printed `131a5c1`). Dev server on http://localhost:4200, started by the caller (not started or stopped here).
- **R1 source**: `production/qa/evidence/sprint-011-head-2026-10-24/r1-probe/run.log` (header `# Sprint 11 probe — 2026-10-25T01:59:30.283Z`), lines 64-68.
- **Hand-walk**: `if018-handwalk.mjs` in this folder. Headless Chrome for Testing via playwright-core; lines 22-292 and the `fresh` / `store` / `pause` fixtures copied verbatim from `production/qa/evidence/sprint-011/probe.mjs`. Viewport read in-page: `{"w":1280,"h":720,"card":true}`. Run `# IF-018 hand-walk — 2026-10-25T02:10:30.127Z`, output `handwalk-output.txt` / `run.log`, `# 0 FAIL`, `errors: none`. Captures: `tc07-opening-card-1280x720.png`, `tc05-after-shift-tab.png`.

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| IF-018-TC-01 | AC-1 (DOM) | R1 + hand-read (step 2) | R1 line 64: `PASS IF-018 card has no aria-modal="true" // null`. Hand-read: `{"modal":null,"desc":0,"anyModal":0,"role":"dialog","label":"World Network orientation"}` (step 2 = 0; role/label recorded only). | PASS |
| IF-018-TC-02 | AC-1 (initial focus) | R1 + hand-read | R1 line 65: `PASS IF-018 UNDERSTOOD has initial focus // UNDERSTOOD`. Hand-read: activeElement `BUTTON.hud-btn pause`, text `UNDERSTOOD`, `closest('.wm-onboard')` true. | PASS |
| IF-018-TC-03 | AC-1 (no trap) | R1 + hand-read | R1 line 66: `PASS IF-018 Tab from UNDERSTOOD reaches the nav`. Hand-read after Tab: `BUTTON.navtab active`, text `WORLD NETWORK`, inNav true, card still present true. | PASS |
| IF-018-TC-04 | AC-2 guard (Shift+Tab reverses) | R1 + hand-read | R1 line 67: `PASS IF-018 Shift+Tab returns to UNDERSTOOD // UNDERSTOOD`. Hand-read: text `UNDERSTOOD`, inside `.wm-onboard`, card present true. | PASS |
| IF-018-TC-05 | AC-2 guard (Shift+Tab from UNDERSTOOD) | Hand-walk (fresh fixture) | Pre: focus `UNDERSTOOD` in card. After Shift+Tab: `BUTTON.wm-feed-line dim`, text `13:47HELIX CORP SECURES TRADE AGREEMENT IN OSLO>`, aria-label `13:47 HELIX CORP SECURES TRADE AGREEMENT IN OSLO // FOCUS EUROPE`; `closest('.wm-bottom')` true / `closest('.wm-onboard')` false / card present true; then Tab -> `UNDERSTOOD`. Steps 2-5 = true/false/true/UNDERSTOOD. Capture `tc05-after-shift-tab.png` shows the focus ring on that Feed row. | PASS |
| IF-018-TC-06 | AC-2 guard (Esc) | R1 + hand-read (step 4) | R1 line 68: `PASS IF-018 Esc leaves the card in place`. Hand-walk after Escape + 200 ms: card present true, focus still `UNDERSTOOD`, `seen.includes('hint-worldmap')` = `false`. | PASS |
| IF-018-TC-07 | Test Evidence (UI screenshot) | Hand-walk (review of R1 capture) | R1 capture `r1-probe/state-opening-card.png`: mtime `2026-10-24T22:59:33-0300` (= 01:59:33Z), after R1 start 01:59:30.283Z; `sips` 1280 x 720. Opened: `WORLD NETWORK // ORIENTATION` card over the Scan column, four rows (THE JOB, START HERE, STRATEGIC TIME, THE FOUR NUMBERS) and `UNDERSTOOD`; transport strip (play, 1X, 2X, 4X, 8X, CLOCK SPEED: PAUSED) visible beside it; Sectors / sector panel not dimmed. Hand-read of the wrap: `{"background":"rgba(0, 0, 0, 0)","backdropFilter":"none","pointerEvents":"none","box":[0,0,1280,720]}` -> no backdrop. Retained copy from this run: `tc07-opening-card-1280x720.png`. | PASS |

## Notes

1. **Shared precondition 1, second half, not literally met.** `git status --porcelain src` printed ` M src/game/tutorial.test.ts`, ` M src/state/tutorialStore.test.ts`, `?? src/game/world.noRoute.test.ts`. All three are unit-test files; `rg -l "from '.*\.test'" src -g '!*.test.ts'` found no runtime file importing a test file, so the served app is HEAD source. Recorded, not treated as a blocker; qa-lead to confirm.
2. **TC-07 path.** The cases file names `production/qa/evidence/sprint-011/state-opening-card.png`; the HEAD R1 run wrote its captures to `production/qa/evidence/sprint-011-head-2026-10-24/r1-probe/`, so that copy was reviewed.
3. **TC-05 element.** The bottom-strip stop reached was the Feed row `13:47 HELIX CORP SECURES TRADE AGREEMENT IN OSLO` (the oldest of the four rows); focusing it scrolled the Feed so that row sits at the bottom of the list. Matches the spec's "last bottom-strip stop, such as the last Feed row".
4. **Card overlap (observation, not an AC).** In both captures the card's lower edge (y ~549) sits over the TIMELINE and FEED panel title rows (y ~548). The transport buttons and Feed rows stay visible and reachable.
5. The card's wrap keeps `role="dialog"` and `aria-label="World Network orientation"`, which the story allows.

**Story verdict: PASS WITH NOTES** (AC-1 PASS; AC-2 guard PASS; Test Evidence PASS; notes 1 and 4 for qa-lead.)
