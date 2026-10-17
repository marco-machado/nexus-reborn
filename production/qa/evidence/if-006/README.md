# IF-006 click-through: Menu Continue, New Operation arm, Balance with recording off

Run: dev server on :4206 (`PORT=4206 npm run dev`), then
`SWEEP_URL=http://localhost:4206/ node production/qa/evidence/if-006/capture.mjs`.
Headless Chrome for Testing, 1280x720, text scale 125 (the maximum). Result:
`capture-output.txt` (ALL PASS). Harness assists: localStorage seeding (bad
blob, valid save via writeSave, telemetry records, text scale, recording off);
Menu clicks and the Settings -> Balance path are real pointer input.

Screens exercised: Menu never-started (01), Menu unreadable with visible reason
(02), Menu valid with Continue (03), New Operation armed, blob unchanged, expiry
disarms (04), Balance reached from Settings with recording off and a nonempty
log (05). Re-review found the primary CTA's closing chevron cut by its
clip-path at scale 125 ("<< NEW OPERATION >"); `src/ui/ui.css`
`.menu-actions .cta-inner` now uses tighter tracking and padding and wraps
rather than clips, and the IF-001 sweep now treats a clip-path as clipping
(it re-ran clean). After that fix, no clipping or truncation observed at 1280x720 scale 125 beyond the
pre-existing wrapped "--" in the MEAN FIRST CONTACT cell of Balance (IF-001 owns).

Covers AC17 (arm), AC21, AC25 (Balance reachable). The save line is a plain
element (it is static after mount, so it is not a live region). Unit seam:
`src/ui/menuPersistence.test.ts` (renders MainMenu markup per fixture).
