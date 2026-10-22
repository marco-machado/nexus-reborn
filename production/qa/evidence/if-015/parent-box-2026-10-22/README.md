# IF-015 parent-box probe re-run — 2026-10-22

Retro 10 action 1 (owner qa-lead): the IF-015 clip probe now covers the parent boxes, not only the objective rows. `../capture.mjs` adds one check per contract and text scale: every direct child box of `.mb-dossier-scroll` and every `.mb-tac-stat` in `.mb-tac-rail`. In each box, text runs must stay inside the box and must not run into each other (overlap over 2 px both ways). Each rail stat must sit fully inside the rail when scrolled to, and the rail fade must be off at the bottom. The check fails if it finds no dossier boxes or no rail stats.

Run: `npm run dev -- --strictPort` (port 4200), then
`SWEEP_URL=http://localhost:4200/ SWEEP_OUT=<this folder, absolute, trailing slash> node production/qa/evidence/if-015/capture.mjs`.
Headless Chrome for Testing, 1280x720, text scales 90 / 100 / 110 / 125, 7 contracts (m01–m03 + generated SEIZURE / EXTRACTION / SABOTAGE / SUPPRESSION, all HIGH or authored threat).

Result: `capture-output.txt`, ALL PASS (86 PASS lines; 28 of them are the new parent-box checks, 6 dossier boxes and 9 rail stats each).

Mutation check: with the BUG-0009 fix (ea1960f, `src/ui/ui.css`) reverted in the working tree, the same run failed exactly once:
`FAIL m03 scale 125: parent boxes clean … dossier box1.mb-threat "MODERATE" runs into "ETA RESPONSE: < 06:00"`. The fix was restored with `git checkout -- src/ui/ui.css`.

Not covered here: the four IF-015 gaps carried to the next QA plan (session state), including MODERATE generated contracts and resolutions other than 1280x720. Rail gap 1 is now probed at all four scales on these seven contracts, not walked by hand.
