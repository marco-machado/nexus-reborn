# IF-004 click-through: Chance vs Risk bands and World Network owner readouts

Run: dev server on :4200 (`npm run dev -- --strictPort`), then
`node production/qa/evidence/if-004/capture.mjs`. Headless Chrome for Testing,
1280x720, default text scale, working tree on top of `3673808` (uncommitted
IF-004 changes). Result: `capture-output.txt` (no console errors, no overflow on
the Influence actions, Tax line, orientation rows or Brief tactical stats).

Harness assists, named: localStorage clear; `campaignStore.intelLevel` set to 1
then 2 for the Brief compare; `worldStore` influence (40), Europe's generated
contracts removed (so Expedite has no target), the running Stabilize spend
cleared after the real click (so its row shows the cooldown, not ACTIVE); the
Review pin set on `worldStore.review`; `worldStore.selected = 'an'` forced,
because the sector list does not let a player focus Antarctica. New Operation,
the orientation dismissal, Pause, sector focus, the Stabilize spend and the
Glass Veil contract select, the North America Stabilize and Lobby spends, and
the CLOCK SPEED 8X / Pause clicks that run the clock under the Review pin are
real clicks.

Screens exercised (partial click-through, step 2 and the Brief half of step 3
of docs/click-through.md):

1. `01-first-visit-overlay.png` — orientation teaches: printed Tax vs
   Nexus-held payment (North America pays, Europe does not); Pause and Clock
   speed control strategic time; Influence opens at 0 so Stabilize and Lobby
   read UNAFFORDABLE and Expedite reads NO TARGET until the sector lists a
   GENERATED contract (matching the opening Europe row in shot 2), not broken;
   Review pins the Feed while sector numbers stay live.
2. `02-europe-tax-not-paying-unaffordable.png` — Europe: TAX YIELD 2,468 CR /
   24H, TAX PAID NO // NOT NEXUS-HELD; Stabilize and Lobby UNAFFORDABLE at 0
   points, Expedite NO TARGET.
3. `03-north-america-tax-pays.png` — North America: TAX YIELD 4,080 CR / 24H,
   TAX PAID YES // NEXUS-HELD.
4. `04-europe-cooldown-no-target.png` — after a Stabilize spend: COOLDOWN 24H,
   Lobby CLEAR, Expedite NO TARGET.
5. `05-antarctica-no-influence-action.png` — Antarctica row is disabled (NO
   SURVEY DATA, clicking leaves focus on Europe); forced focus shows no
   Influence action and TAX PAID NO.
6. `06-timeline-live.png` / `07-timeline-review-numbers-live.png` — LIVE vs
   REVIEW. Stabilize and Lobby are spent on North America, the Review pin is
   set at -6.0H (clock paused), then CLOCK SPEED 8X runs the clock 1.68h while
   the pin holds (cue REVIEW -7.7H > GO LIVE, Feed still pinned). North
   America's Scan four numbers (ADR-0014: Control, Unrest, Tax yield,
   Garrison) read from live state, not the pin: Control 68% -> 69%, Unrest
   12% -> 10%, Tax yield 4,080 -> 4,140 CR / 24H, Garrison SECURE. The script
   asserts Control/Unrest moved and the pin held, and exits non-zero if not.
7. `08-world-network-intel-1-chance.png` / `10-world-network-intel-2-chance.png`
   — Glass Veil prints CHANCE 36% at intel 1 and at intel 2.
8. `09-brief-intel-1.png` / `11-brief-intel-2.png` — same contract on the
   Brief: PROJECTED SUCCESS 36% at intel 1; RISK INDEX 89 // SEVERE (no
   percent, no cap) at intel 2.

The SECTOR LOCKED refusal is reachable only by forcing Antarctica's focus; no
action row is rendered there, so that wording is covered by
`src/ui/worldChrome.test.ts`, not by a screenshot.

Sign-off: qa-lead (pending).
