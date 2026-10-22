# IF-014 click-through: first-Debrief Research prompt

Revision: `1e268c3` plus the IF-014 working-tree changes.
Run: dev server on :4214 (`npm run dev -- --strictPort --port 4214`), then
`SWEEP_URL=http://localhost:4214/ node production/qa/evidence/if-014/capture.mjs`.
Headless Chrome for Testing, 1280x720, text scales 90 / 100 / 110 / 125 through
the settings store. Result: `capture-output.txt` (ALL PASS, no console or page
errors). The dev server was stopped after the run; no listener remained on
4214 or 4200.

Harness assists (named in the script header): localStorage clear; New
Operation through `save.startNewOperation`; text scale through
`useSettingsStore.setTextScale`; an authored contract selected and a Team
Screen visit (autosaved) through the app store, then `setOutcome` with
`applyKey = lastAppliedKey + 1` (the Debrief screen itself runs
`applyDebrief`); the pyrrhic fixture trims the roster to one operative who
dies (IF-011's wipe fixture); the unaffordable fixture sets Credits to 1,000
before a loss that pays 0. OPEN RESEARCH, UNDERSTOOD and the Menu CONTINUE
are real clicks.

Screens exercised (partial click-through: step 5 of docs/click-through.md —
the Debrief and its exits; Research was entered through the prompt):

- `01-first-debrief-prompt-{90,100,110,125}.png` — first Debrief of a
  campaign, won, 229,225 CR after the payout: one note
  `RESEARCH // BARREL WEAR COATING` with `The BALLISTICS LAB is idle.
  14,000 CR starts BARREL WEAR COATING in 2 hours. Open the RESEARCH tab and
  AUTHORIZE it before the next deploy.` and the OPEN RESEARCH / UNDERSTOOD
  controls. It sits below the invoice and its filing line and above the
  actions (tops: rows end 498, filing end 525, prompt 538, actions 621 at
  100), not inside `.db-filing`. `seen` holds `hint-debrief-research` exactly
  once; the blob's `seen` is still empty (status `unfiled`). Nothing clips at
  any scale; the card ends at 705 px. AC32.
- Reload while on that Debrief, then CONTINUE: `seen` is empty again (the
  mark was memory only, like the unfiled invoice); the next Debrief fires the
  prompt again — `02-reload-then-debrief-prompt-fires-again-100.png`. AC4.
- `03-research-screen-after-open-100.png` — OPEN RESEARCH: `phase` is
  `research`, `missionId` is null (Brief locked), `seen` holds the id once;
  after the Screen autosave the blob's `seen` holds it and status reads
  `filed`. AC2.
- `04-second-debrief-no-prompt-100.png` — a second Debrief in the same
  campaign: no note; `seen` still holds the id once. AC32.
- `05-after-understood-100.png` — fresh campaign, first Debrief, UNDERSTOOD:
  the note closes, the phase stays `debrief`, `seen` holds the id once.
- `06-pyrrhic-debrief-banner-first-{100,125}.png` — pyrrhic win (whole
  roster KIA): `campaignFailed`, the CAMPAIGN FAILED banner is the first child
  of the card (top 38) and the prompt sits below the invoice (538). Banner and
  prompt inside the viewport at both scales. AC3.
- `07-first-debrief-unaffordable-no-prompt-100.png` — first Debrief with
  1,000 CR after a loss: no note and the id stays unfired. AC5.

Probe note: the focused CAMPAIGN FAILED banner draws its focus ring as an
absolute `::after`, which adds 2 px a side to `scrollWidth`/`scrollHeight`;
the clip probe compares its text range to its box, as it does for buttons.
The banner's text (394–886 px) sits inside its box (357–923 px).
