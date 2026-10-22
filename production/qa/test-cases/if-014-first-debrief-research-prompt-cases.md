# IF-014 manual test cases: First-Debrief Research prompt

**Story**: `production/epics/interface/story-014-first-debrief-research-prompt.md` (AC32 + four story ACs, numbered AC-1..AC-5 below as in the story's traceability table)
**QA plan**: `production/qa/qa-plan-sprint-010-2026-10-22.md`, Manual QA Checklist "IF-014 — Integration" (click-through + screenshots); strategy session 2 in `production/qa/qa-strategy-sprint-010-2026-10-22.md`
**Story type**: Integration | **Output**: click-through record + PNGs in `production/qa/evidence/if-014/` | **Gate**: BLOCKING
**Automated coverage (not repeated here)**: `src/ui/debriefResearch.test.ts` (pick rule, affordability boundary, shown-rule, copy), `src/state/appStore.test.ts` (`returnFromDebrief('research')` → `missionId null`, `phase research`), `src/state/save.test.ts` (id validates in `seen`), `src/game/tutorial.test.ts` (`SEEN_IDS`). These cases cover the click-through: the `useDebriefResearchPrompt` hook, routing, persistence and layout, none of which has a DOM test.
**Executor**: Claude, headless Chrome through `npx playwright-cli` (never the in-app pane or the user's Chrome), viewport exactly 1280x720, text scale 100 unless a case says otherwise.
**Build under test**: record `git rev-parse --short HEAD` and `git status --short src/` (must be empty).

## AC map

| AC | Story criterion (short) | Cases |
|---|---|---|
| AC-1 (AC32) | First Debrief: one prompt naming the RESEARCH tab and the cheapest available project; fired once; persists with the seen-set; no later Debrief repeats it | TC01, TC02, TC04, TC05, TC06, TC07, TC12 |
| AC-2 | "Go to Research" leaves through `returnFromDebrief` (contract cleared, Brief locked), lands on Research, `Phase` is `research` | TC03 |
| AC-3 | Failed campaign: CAMPAIGN FAILED banner first and dominant; prompt, if shown, below the invoice | TC08, TC09 |
| AC-4 | Reload on the first Debrief: prompt unfired again (in-memory mark, ADR-0011) | TC10 |
| AC-5 | Cheapest = lowest-cost node with `eligibilityText(...) === null` and `cost <= Credits` post-payout; none qualifies → no prompt, stays unfired | TC01, TC02, TC11, TC12, TC13 |

## Shared setup

- **S-1 Server**: `npm run dev -- --strictPort --port 4200`. At session end stop it and confirm `lsof -i :4200` prints nothing.
- **S-2 Browser**: `npx playwright-cli open http://localhost:4200/`, then `npx playwright-cli resize 1280 720`. Confirm `npx playwright-cli eval "() => innerWidth + 'x' + innerHeight"` returns `1280x720`; if it does not, the run is invalid (record and stop). Keep the console visible (record every console error per case).
- **S-3 Clean campaign** (= `capture.mjs` `fresh()`): `localstorage-delete` the save key (or `eval` `localStorage.clear()`), `reload`, wait ~1.2 s, then start a New Operation. Real path: click **NEW OPERATION** on the Menu. Harness assist (allowed, name it in the record): `eval` `import('/src/state/save.ts').then(s => s.startNewOperation())`.
- **S-4 Debrief fixture** (= `capture.mjs` `reachDebrief(fields, before)`): selects the first unlocked authored contract, `goto('team')` (Screen autosave), waits 900 ms, then `setOutcome(settleOutcome({ applyKey: lastAppliedKey + 1, won: true, reward: 85000, deadIds: [], quietReplay: false, ...fields }))`. The Debrief screen itself runs `applyDebrief`. Variants: `before = 'wipe'` (roster trimmed to one operative who dies → pyrrhic win, IF-011 fixture); `before = 'broke'` (Credits set to 1,000 before the outcome). Never set `campaignFailed`, `seen` or `missionId` by hand.
- **S-5 Probes** (= `capture.mjs` `facts()`), run with `eval` after the Debrief paints (~1.8 s): `phase`, `missionId`, `credits`, `lastAppliedKey`/`outcome.applyKey`, `useTutorialStore.seen`, `useCampaignStore.campaignFailed`, `useSaveStatusStore.status`, the blob's `tutorial.seen` from `localStorage[SAVE_KEY]`, `document.querySelectorAll('.db-research').length` (count, not `querySelector` — code-review advisory 6), prompt text, `.db-filing .db-research` present?, `.db-card.firstElementChild` class, tops/bottoms of `.db-failed`, `.db-rows`, `.db-filing`, `.db-research`, `.db-actions`, `.db-card`.
- **S-6 Id**: `hint-debrief-research`. "Once" means `seen.filter(id => id === 'hint-debrief-research').length === 1`.
- **S-7 Expected copy** for BARREL WEAR COATING: title `RESEARCH // BARREL WEAR COATING`; body `The BALLISTICS LAB is idle. 14,000 CR starts BARREL WEAR COATING in 2 hours. Open the RESEARCH tab and AUTHORIZE it before the next deploy.`; buttons `OPEN RESEARCH`, `UNDERSTOOD`.
- **S-8 Screenshots**: `npx playwright-cli screenshot` saved as `production/qa/evidence/if-014/manual-<TC>-<state>-<scale>.png`. Do not overwrite the `capture.mjs` PNGs (01–07).

Shortcut: `SWEEP_URL=http://localhost:4200/ node production/qa/evidence/if-014/capture.mjs` reruns the scripted subset (TC02, TC03, TC04 partial, TC05, TC08, TC10, TC11). Code-review advisory 5 asks for this rerun before sign-off. The script's PASS lines may be cited as the Actual Result for those cases, but TC01, TC06, TC07, TC09, TC12, TC13 and the TC04 reload step are manual only.

---

## Test Case: IF014-TC01 — End to end: seeded offer win names BARREL WEAR COATING
**AC**: AC-1, AC-5
**Preconditions**: S-1, S-2. S-3 with the real NEW OPERATION click. No fixture: this is the smoke-run path (smoke 2026-10-22 item 4).
**Steps**:
  1. Record Credits from the header on the World Network.
  2. Open Scan, select the seeded NEON GARDEN offer, open the Brief, ACCEPT, go to Assembly, Deploy (real clicks).
  3. Win the mission. Assists allowed and to be named in the record: sim-API moves for Reach/Extract, `orderGrenade`, setting a remaining relay dead (as in the smoke run / `world.test.ts`).
  4. On Debrief wait for the invoice to finish; run S-5 probes; screenshot.
**Expected Result**:
- Debrief reads CONTRACT FULFILLED; payout row +32,000 CR; post-payout Credits − step-1 Credits = 32,000 + the Tax deposited during the ETA catch-up (Economy GDD `economy-and-contracts.md`: Tax is not an invoice line; `new_balance − credits_before = net_payout + tax_deposits`). Record the Tax by logging `appStore.addCredits` deposits (named assist). *Corrected 2026-10-22: the first run expected "+32,000 ±0" and found +4,169 Tax over a 2-day ETA (`production/qa/evidence/if-014/manual-2026-10-22/results.md`).*
- Exactly one `.db-research`; text matches S-7.
- `seen` holds the id once; blob `seen` lacks it; status `unfiled`.
- No console errors.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC02 — First Debrief (fixture): one prompt, placement, four text scales
**AC**: AC-1, AC-5 (reuses `capture.mjs` step 1)
**Preconditions**: S-1, S-2, S-3. S-4 with defaults (won, reward 85,000).
**Steps**:
  1. Reach Debrief; run S-5.
  2. For text scale 90, 100, 110, 125 (Settings → text scale, or assist `useSettingsStore.getState().setTextScale(n)`): wait 300 ms, check clipping of `.db-research`, `.db-research-title`, `.db-research-body`, `.db-research-btn`, `.db-actions .btn`, `.db-card`; screenshot.
**Expected Result**:
- `lastAppliedKey === outcome.applyKey` (prompt read post-apply).
- `querySelectorAll('.db-research').length === 1`; text matches S-7; `credits >= 14000`.
- `seen` holds the id exactly once.
- No CAMPAIGN FAILED banner.
- Order: `.db-research` top >= `.db-rows` bottom and >= `.db-filing` bottom; `.db-actions` top >= `.db-research` top; `.db-filing .db-research` absent (not inside filing chrome).
- At every scale: no clipped element, `.db-card` bottom <= 720, both buttons fully visible.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC03 — OPEN RESEARCH leaves through returnFromDebrief and lands on Research
**AC**: AC-2 (reuses `capture.mjs` step 3)
**Preconditions**: State after TC02 (prompt up, scale 100), or fresh S-3 + S-4.
**Steps**:
  1. Before clicking, record `missionId` (must be non-null) and `phase === 'debrief'`.
  2. Real click **OPEN RESEARCH**.
  3. Within 400 ms run S-5.
  4. Read the bottom navigation: hover/inspect the BRIEF tab.
  5. Wait 900 ms; run S-5 again; screenshot.
**Expected Result**:
- Step 3: `phase === 'research'` (one of the existing seven Phase values, no new value); `missionId === null`; `seen` holds the id once.
- Research Screen is rendered (Research tree visible, RESEARCH tab active).
- BRIEF tab is locked with reason `NO CONTRACT SELECTED`.
- Step 5: status `filed`; blob `tutorial.seen` includes the id (Screen autosave made the mark durable).
- No console errors.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC04 — Second Debrief in the same campaign is silent (and after reload)
**AC**: AC-1 (reuses `capture.mjs` step 4; reload step is new)
**Preconditions**: State after TC03 (on Research, status `filed`, blob holds the id).
**Steps**:
  1. S-4 again (second Debrief, won, reward 85,000). Run S-5; screenshot.
  2. Click RETURN TO WORLD NETWORK; wait for status `filed`.
  3. `reload`; click **CONTINUE** on the Menu.
  4. S-4 again (third Debrief). Run S-5.
**Expected Result**:
- Step 1: `.db-research` count 0; `seen` holds the id once (not twice).
- Step 3: after hydration, `seen` holds the id (persisted with the tutorial seen-set).
- Step 4: `.db-research` count 0.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC05 — UNDERSTOOD closes the note and stays on Debrief
**AC**: AC-1 ("dismiss marks it fired") (reuses `capture.mjs` step 5)
**Preconditions**: S-3 (fresh), S-4 defaults; prompt visible.
**Steps**:
  1. Real click **UNDERSTOOD**; wait 300 ms; run S-5; screenshot.
  2. Check `document.activeElement` (record it; advisory 11 says focus falls to body).
  3. Click RETURN TO WORLD NETWORK; S-4 again.
**Expected Result**:
- Step 1: `.db-research` count 0; `phase === 'debrief'`; `missionId` unchanged from before the click; `seen` holds the id once; invoice, filing line and actions unchanged.
- Step 3: no prompt on the next Debrief.
- Step 2 is recorded only (known advisory, not a fail of this case).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC06 — Leaving by RETURN TO WORLD NETWORK with the prompt up consumes it
**AC**: AC-1 (accepted deviation: mark on fire, not on dismiss; code-review advisory 9 — not driven by `capture.mjs`)
**Preconditions**: S-3 (fresh), S-4 defaults; prompt visible; no click on either prompt button.
**Steps**:
  1. Real click **RETURN TO WORLD NETWORK**; wait 900 ms; run S-5.
  2. S-4 again (second Debrief); run S-5; screenshot.
**Expected Result**:
- Step 1: `phase === 'world'`; `missionId === null`; `seen` holds the id once; blob holds it after the autosave.
- Step 2: `.db-research` count 0.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC07 — REPLAY MISSION with the prompt up; the replay Debrief is silent
**AC**: AC-1 (advisory 9 — not driven by `capture.mjs`)
**Preconditions**: S-3 (fresh), S-4 defaults on an authored contract (REPLAY MISSION visible); prompt visible.
**Steps**:
  1. Real click **REPLAY MISSION**; confirm the Brief shows for the same contract.
  2. Drive the outcome again with S-4's `setOutcome` step only (keep the selected contract) with `quietReplay: true`, which is what the deploy freeze sets for an already-won authored contract (`deployFreeze.ts:27`); run S-5. *Corrected 2026-10-22: S-4's default `quietReplay: false` prints CONTRACT FULFILLED and pays again, so the first run needed a supplementary TC07b.*
**Expected Result**:
- Step 1: `phase === 'brief'`; `missionId` is the replayed contract; `seen` holds the id once.
- Step 2: Debrief reads `REPLAY // FEE ALREADY COLLECTED`; `.db-research` count 0.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC08 — Pyrrhic win: CAMPAIGN FAILED banner first, prompt below the invoice
**AC**: AC-3 (reuses `capture.mjs` step 6, `before = 'wipe'`)
**Preconditions**: S-3 (fresh), S-4 with `before = 'wipe'` (won, the only operative dies).
**Steps**:
  1. Reach Debrief; run S-5.
  2. Compare `getComputedStyle('.db-failed').fontSize` with `.db-title`.
  3. At text scale 100 and 125: clip-check `.db-failed`, `.db-research`, `.db-research-btn`, `.db-card`; screenshot.
**Expected Result**:
- `campaignFailed === true`; `.db-card.firstElementChild` is `.db-failed` reading `CAMPAIGN FAILED`; banner font size >= title font size.
- If a prompt is shown (current build: it is): count 1, `.db-failed` top < `.db-research` top, `.db-research` top >= `.db-rows` bottom and >= `.db-filing` bottom.
- Banner top >= 0, card bottom <= 720, nothing clips at both scales.
- Record the prompt copy verbatim (it says "before the next deploy" while deploy is refused — open owner ruling, not a fail here).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC09 — Roster-emptying loss: banner first, prompt (if any) below the invoice
**AC**: AC-3 (the AC names this case; `capture.mjs` drives only the pyrrhic win)
**Preconditions**: S-3 (fresh), S-4 with `before = 'wipe'` and fields `{ won: false, reward: 0 }`.
**Steps**:
  1. Reach Debrief; run S-5; record `credits`.
  2. Screenshot at scale 100.
**Expected Result**:
- `campaignFailed === true`; banner is the first child of `.db-card`.
- If `credits >= 14000` (expected on a fresh campaign: the loss pays 0 and the opening balance is above 14,000 — record the value): one prompt naming BARREL WEAR COATING, placed below `.db-rows` and `.db-filing`, below the banner.
- If `credits < 14000`: no prompt and the id is absent from `seen`.
- Card bottom <= 720; nothing clips.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC10 — Reload on the first Debrief: the prompt is unfired again
**AC**: AC-4 (explicit case: no automated test covers the `save.ts` phase guard — strategy advisory, code-review advisory 8; reuses `capture.mjs` step 2)
**Preconditions**: S-3 (fresh), S-4 defaults; prompt visible; status `unfiled`; blob `seen` lacks the id.
**Steps**:
  1. Run S-5 and record `seen` (memory) vs blob `seen`.
  2. `reload` while still on Debrief; wait 1.2 s.
  3. On the Menu, read the blob: `localStorage[SAVE_KEY]` `tutorial.seen`.
  4. Click **CONTINUE**; wait 900 ms; run S-5.
  5. S-4 again (this is the campaign's first *filed* Debrief); run S-5; screenshot.
**Expected Result**:
- Step 1: memory `seen` holds the id once; blob `seen` lacks it; status `unfiled`.
- Step 3: blob `seen` lacks the id (the mark never reached storage).
- Step 4: `phase !== 'debrief'` (the Screen recorded before the Debrief, `world` in the capture run); `seen` lacks the id; the Debrief's payout is not in Credits (the invoice was unfiled too — record Credits against the pre-Debrief value).
- Step 5: one prompt naming BARREL WEAR COATING; `seen` holds the id once.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC11 — Nothing affordable: no prompt, id stays unfired
**AC**: AC-5 (reuses `capture.mjs` step 7, `before = 'broke'`)
**Preconditions**: S-3 (fresh), S-4 with `before = 'broke'` and fields `{ won: false, reward: 0 }`.
**Steps**:
  1. Reach Debrief; run S-5; screenshot.
  2. Click RETURN TO WORLD NETWORK; wait for status `filed`; read blob `seen`.
**Expected Result**:
- `credits === 1000`; `.db-research` count 0; `seen` lacks the id.
- Step 2: blob `seen` lacks the id.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC12 — Unfired first Debrief, then an affordable Debrief fires the prompt
**AC**: AC-5 ("stays unfired"), AC-1 (fires once)
**Preconditions**: State after TC11 step 2 (World Network, Credits 1,000, id unfired and filed).
**Steps**:
  1. S-4 with defaults (won, reward 85,000), no `before` assist. Run S-5; screenshot.
  2. Click UNDERSTOOD, RETURN TO WORLD NETWORK, then S-4 again; run S-5.
**Expected Result**:
- Step 1: post-payout `credits >= 14000`; one prompt naming BARREL WEAR COATING (S-7); `seen` holds the id once. The prompt is tied to the first Debrief where a project qualifies, not the campaign's first Debrief.
- Step 2: no prompt.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC13 — Eligibility filter: busy BALLISTICS LAB names the next project
**AC**: AC-5 (the pick uses `eligibilityText`, not cost alone)
**Preconditions**: S-3 (fresh). On the World Network.
**Steps**:
  1. Real clicks: open the RESEARCH tab, select BARREL WEAR COATING, **AUTHORIZE** it. Record Credits (should drop by 14,000).
  2. Return to the World Network. S-4 with defaults.
  3. Run S-5; record `useResearchStore.getState().labs` and `done`; screenshot.
**Expected Result**:
- Whether the ETA finished BARREL WEAR COATING (`done` includes `b-coating`, BALLISTICS LAB idle) or not (BALLISTICS LAB running it), the pick is NEURAL INTERFACE I: title `RESEARCH // NEURAL INTERFACE I`, body names `CYBERNETICS LAB`, `15,000 CR`, `2 hours`. (BARREL WEAR COATING is excluded as running or researched; ADVANCED PROPELLANTS 16,000 is either blocked by the busy lab or costs more.)
- Exactly one prompt; `seen` holds the id once.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF014-TC14 — New Operation resets the prompt for the new campaign
**AC**: AC-1 ("once per campaign")
**Preconditions**: State after TC04 (id fired and filed in campaign A).
**Steps**:
  1. Go to the Menu and real-click **NEW OPERATION** (confirm the overwrite if asked). Do not clear localStorage.
  2. Read memory and blob `seen`.
  3. S-4 with defaults; run S-5.
**Expected Result**:
- Step 2: `seen` lacks the id (`startNewOperation` calls `useTutorialStore.resetAll()`).
- Step 3: one prompt naming BARREL WEAR COATING; `seen` holds the id once.
**Actual Result**:
**Pass/Fail**:

---

## Close-out

- Stop the S-1 server; `lsof -i :4200` prints nothing. Record it.
- Record console errors per case (expected: none).
- Tick the QA plan checklist rows only for cases run: row 1 ← TC01–TC04, TC12; row 2 ← TC08, TC09; row 3 ← TC10.
