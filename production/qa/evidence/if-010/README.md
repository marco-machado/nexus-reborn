# IF-010 click-through: Debrief filing status and write-failure indicators

Revision: `d10e57e` plus the IF-010 working-tree changes (tests, this evidence).
Run: dev server on :4217 (`npm run dev -- --strictPort --port 4217`), then
`SWEEP_URL=http://localhost:4217/ node production/qa/evidence/if-010/capture.mjs`.
Headless Chrome for Testing, 1280x720, default text scale. Result:
`capture-output.txt` (ALL PASS, no console or page errors). The dev server was
stopped after the run; no listener remained on 4217 or 4200.

Harness assists (named in the script header): localStorage clear; the Screen
visit and a won Debrief on an authored contract set up through the app store
(the Debrief screen itself runs `applyDebrief`); write failures injected by
making `Storage.prototype.setItem` / `removeItem` throw `QuotaExceededError`
for the campaign key only. RETURN TO WORLD NETWORK, REPLAY MISSION, the Menu
New Operation arm + confirm, and the orientation dismiss are real clicks.

Screens exercised (partial click-through: steps 1, 5 and 6 of docs/click-through.md):

- `01-debrief-invoice-unfiled-1280x720.png` — applied Debrief reads
  `INVOICE UNFILED // COMMITS ON NEXT SCREEN` (status `unfiled`). AC22.
- `02-world-return-filed-1280x720.png` — World Network return: still
  `unfiled` the moment the Screen mounts (navigation is not the signal), then
  `filed` once the autosave lands; no failure notice. AC22.
- `03-brief-replay-filed-1280x720.png` — Brief Replay: `filed` after the
  autosave; no failure notice. AC22.
- `04-world-return-write-failed-1280x720.png` — World Network return with the
  first Screen write throwing: `SAVE FAILED // CAMPAIGN NOT FILED`, status
  `write-failed` / `quota`. AC23.
- `05-brief-replay-write-failed-1280x720.png` — Brief Replay with the first
  Screen write throwing: same notice, `write-failed`. AC23.
- `06a-…-with-orientation` / `06b-new-operation-write-failed-1280x720.png` —
  Menu New Operation (save on file, two-step arm) with the erase throwing: the
  new house's World Network shows the failure notice, not an erased/filed
  state. AC23.

Observation (not fixed here; placement is UX-owned): on a fresh campaign the
World Network first-visit orientation card is open, and the notice (fixed at
31vh, chosen in the 2026-10-15 team-qa fix to cover no text on the four
Screens) sits over part of one orientation line (`06a`). After a failed New
Operation erase the tutorial is reset, so a director can see this overlap.
It does not occur on a Debrief exit in normal play (the orientation was
dismissed on the first World visit). No clipping or truncation of the
filing line or the notice at 1280x720. Sign-off: qa-lead (pending).
