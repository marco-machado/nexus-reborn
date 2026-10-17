# IF-012 click-through: Assembly hire refusals and heavy-tier advisory

Revision: `f490d39` plus the IF-012 working-tree changes.
Run: dev server on :4218 (`npm run dev -- --strictPort --port 4218`), then
`SWEEP_URL=http://localhost:4218/ node production/qa/evidence/if-012/capture.mjs`.
Headless Chrome for Testing, 1280x720, default text scale. Result:
`capture-output.txt` (ALL PASS, no console or page errors). The dev server was
stopped after the run; no listener remained on 4218 or 4200.

Harness assists (named in the script header): localStorage clear; New
Operation, contract selection and phase changes through the app store; Credits,
roster size and loadout set as owner-reported fixtures; squad mass raised by
giving the assigned operatives extra max HP; tutorial steps marked seen so the
advisory stands alone. RECRUIT, CLOSE and DEPLOY TEAM are real clicks (the
over-limit DEPLOY click is forced onto the disabled button to show it does
nothing).

Screens exercised (partial click-through: Assembly, the recruitment market
overlay, and Mission HUD from docs/click-through.md; no other screen):

- `01-unaffordable-hire-1280x720.png` — roster 4/8, Credits 9,000 CR. Each card
  prints `COST n CR // CREDITS 9,000 CR`; HIRE is disabled and the reason
  `INSUFFICIENT CREDITS // n CR SHORT` is visible under it. AC28.
- `02-full-roster-hire-1280x720.png` — roster 8/8, Credits 500,000 CR. Cost vs
  Credits printed; HIRE disabled with `ROSTER AT CAPACITY // 8 / 8`. AC28.
- `03-hire-allowed-control-1280x720.png` — control: room and Credits, HIRE
  enabled, reason slot blank.
- `04-over-limit-deploy-refused-1280x720.png` — squad 430.1 kg against the
  400 kg limit: DEPLOY disabled, `OFFLOAD 30.1 KG BEFORE DEPLOYMENT` visible;
  the click leaves the phase on Assembly and fires no advisory. AC26, AC28.
- `05-heavy-tier-advisory-in-mission-1280x720.png` — squad between 380 and
  400 kg (HEAVY LOAD // -0.15 M/S in Assembly): Deploy enters Mission and the
  `ADVISORY // HEAVY LOADOUT` toast shows once. A second heavy deployment in
  the same campaign enters Mission with no advisory (checked in
  `capture-output.txt`, no image). AC26.

No refusal sound is requested: a disabled control receives no click, so `act()`
never plays its cue, and the store refusals (`hireOperative`, `startMission`)
call no audio.
