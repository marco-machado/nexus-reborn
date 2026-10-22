# IF-013 click-through: four-row orientation card and the sector-panel Influence moment

Revision: `81bf3d2` plus the IF-013 working-tree changes.
Run: dev server on :4213 (`npm run dev -- --strictPort --port 4213`), then
`SWEEP_URL=http://localhost:4213/ node production/qa/evidence/if-013/capture.mjs`.
Headless Chrome for Testing, 1280x720, text scales 90 / 100 / 110 / 125 through
the settings store. Result: `capture-output.txt` (ALL PASS, no console or page
errors). The dev server was stopped after the run; no listener remained on
4213 or 4200.

Harness assists (named in the script header): localStorage clear; New
Operation through `save.startNewOperation`; text scale through
`useSettingsStore.setTextScale`; Influence set to 8 through the world store as
the owner-reported clean-win fixture (WN Opening desk AC: a first clean win
reads 8); Antarctica focused through `worldStore.select` (its sector button is
inert for a locked sector). Both UNDERSTOOD buttons are real clicks.

Screens exercised (partial click-through: World Network only, step 2 of
docs/click-through.md; Research was entered and left only to show neither
prompt returns):

- `01-card-{90,100,110,125}.png` — New Operation: the orientation card holds
  THE JOB, START HERE, STRATEGIC TIME and THE FOUR NUMBERS (four lines:
  Control, Unrest, Tax yield, Garrison condition) and no Influence or Research
  row. START HERE names NEON GARDEN in OSLO, the EC-023 seeded Moderate offer,
  at Chance 87%, the highest among the open, unlocked offers (Rust Haven is
  open at intel 1 and lower; Glass Veil and Hollow Crown are locked). Pause and
  Clock speed are identified as control over strategic time; Nexus-held Tax
  eligibility is stated. Nothing clips at any scale. AC27.
- UNDERSTOOD: `tutorialStore.seen` holds `hint-worldmap` exactly once; the
  card does not return after leaving for Research and coming back
  (`capture-output.txt`, no image). WN Opening desk AC.
- `02-sector-panel-influence-0-{90,100,110,125}.png` — Europe focused at
  Influence 0: Stabilize and Lobby read UNAFFORDABLE, disabled; Expedite also
  reads UNAFFORDABLE because the seeded offer sits in Europe, so the owner has
  a target and refuses on cost (0 < 12 PTS). No teaching note.
- `02b-sector-panel-influence-0-no-target-na-100.png` — North America focused
  at Influence 0, no generated offer: Stabilize and Lobby UNAFFORDABLE,
  Expedite NO TARGET. No teaching note. AC27 (the story's "Expedite its
  no-target reason" line; see the note below).
- `03-influence-moment-{90,100,110,125}.png` — Influence 8, Europe focused,
  moment unseen: one note `INFLUENCE // 1 STABILIZE` with
  `Affordable now: 8 PTS for -12 UNREST OVER 6H on the focused sector`;
  the 1 STABILIZE button reads CLEAR and is enabled; Lobby and Expedite stay
  UNAFFORDABLE. `hint-influence` is marked seen once on firing. While the
  note is up it takes the sector inset's slot so OPEN CONTRACTS keeps its
  list (79 px at 125, 142 px at 100). Nothing clips at any scale.
- Dismiss: the note closes, the inset returns, `seen` holds `hint-influence`
  exactly once. Influence set to 0 then 20 and North America focused: no note;
  leaving for Research and returning: no note (`capture-output.txt`).
- `04-antarctica-focused-{90,100,110,125}.png` — Influence 8, moment unseen,
  Antarctica focused: no Influence action is offered and no note fires
  (`locked-sector`); `hint-influence` stays unseen. Refocusing Europe from
  the same state fires it once.

Note for the owner: the story and QA plan line "Expedite its no-target reason"
predates EC-023 landing the seeded Moderate offer in Europe, the default
focus. On that board Expedite in Europe has a target and the owner reports
UNAFFORDABLE; NO TARGET is the owner's reason on any sector without a
generated offer (North America captured). Both are owner-reported (AC27);
Interface recomputes nothing.
