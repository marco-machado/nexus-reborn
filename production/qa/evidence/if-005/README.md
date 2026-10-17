# IF-005 click-through: Research Authorize, keyboard activation, focus return

Run: dev server on :4201 (`PORT=4201 npm run dev`), then
`SWEEP_URL=http://localhost:4201/ node production/qa/evidence/if-005/capture.mjs`.
Headless Chrome for Testing, 1280x720. Result: `capture-output.txt` (ALL PASS).
Harness assists: store setState sets each fixture (Credits, empty labs, paused
strategic clock during Timeline key checks) and reads results back; all input is
real pointer/keyboard.

Screens exercised: Research (01 disabled Authorize with reason, 02 focused and
selected node ring, 03 Active after Authorize), World Network Timeline (04
Review after Left), Mission pause (05 focus on Resume), Settings over pause (06),
pause after Settings closes (07, focus back in the pause modal).

Covers AC8, AC18, AC19. Unit seam: `src/ui/researchInput.test.ts` (Authorize
gating, Timeline key model, no store mutation from selection or Review).
