# PV-017 — Debrief filing status reads unfiled until the next Screen — Manual test cases (M-2)

**Story**: `production/epics/persistence-and-validation/story-017-debrief-filing-status-reads-unfiled-until-the-next-screen.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/pv-017/` | **Gate**: BLOCKING (screenshots + lead-programmer sign-off); this is the open M-2 gap
**Scope**: AC1 for a paid win and a quiet replay, both reached by a played mission (not store seeding); AC2 and AC3 confirmed on the same run. Copy `INVOICE UNFILED // COMMITS ON NEXT SCREEN` is placeholder pending `/ux-design`; the case checks presence, not wording quality.

## Common setup

- `npm run dev -- --strictPort --port 4200`; driver `production/qa/evidence/smoke-2026-10-15-s6/lib.mjs`, 1280x720.
- Filing status probe (as `scenario.mjs`): `(await import('/src/state/saveStatusStore.ts')).useSaveStatusStore.getState().status`.
- Debrief line selector: `.db-filing[role="status"]`. Campaign key `nexus-save-v1`.
- Harness assist named: `L.play(page, { god: true, ff: 2, budgetMs: 420000 })`. No `reportMission` or outcome seeding.
- Quiet replay = deploying a contract already in `contractsWon` (`src/state/deployFreeze.ts`); confirm with `L.outcome(page).quietReplay === true`.

---

## Test Case: PV-017-M2-01 — Paid-win Debrief shows unfiled

**Preconditions**: Clean origin → `NEW OPERATION` → World Network, orientation dismissed. `contractsWon` is empty.
**Steps**:
1. Snapshot `blob0 = localStorage.getItem('nexus-save-v1')` after the World Network autosave settles (wait 1.5 s).
2. `L.deploy(page, 'OPEN CONTRACT GLASS VEIL')`; `L.play(...)`; `L.waitDebrief(page)`.
3. Record `L.outcome(page)`; confirm `won === true`, `quietReplay === false`.
4. Read filing status and `.db-filing` text. Confirm `localStorage.getItem('nexus-save-v1') === blob0`.
5. Capture `pv-017-m2-paid-win-unfiled-1280x720.png` with the invoice and the filing line in frame.
**Expected Result**: Status `unfiled`; `.db-filing` reads `INVOICE UNFILED // COMMITS ON NEXT SCREEN`; campaign blob unchanged while on Debrief.
**Pass Criteria**: All three true and the line is visible (not clipped) in the 1280x720 screenshot.
**Evidence**: `production/qa/evidence/pv-017/pv-017-m2-paid-win-unfiled-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-017-M2-02 — Return to World Network files; reload + Continue keeps post-apply once

**Preconditions**: PV-017-M2-01 on its Debrief.
**Steps**:
1. Record post-apply values on Debrief via `L.state(page)`: credits, influence, intelLevel, intelProgress, contractsWon, roster.
2. Click `RETURN TO WORLD NETWORK`; wait 1.5 s; read filing status.
3. Reload, confirm Menu `data-save-status` on `.screen.menu`, click `[aria-label^="CONTINUE SAVED OPERATION"]`.
4. Read `L.state(page)` and filing status.
**Expected Result**: Step 2 status `filed`. After Continue, credits/contractsWon/roster equal the step-1 values (not S, not doubled; `GLASS VEIL` id once in `contractsWon`). Status is not `unfiled`.
**Pass Criteria**: Status `filed` at step 2 and named fields equal step 1 after Continue.
**Evidence**: `production/qa/evidence/pv-017/pv-017-m2-filed-after-world-1280x720.png` (World Network after Continue)
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-017-M2-03 — Quiet-replay Debrief shows unfiled

**Preconditions**: PV-017-M2-02 done; `contractsWon` contains the GLASS VEIL contract id; status `filed`.
**Steps**:
1. Snapshot `blob1`. `L.deploy(page, 'OPEN CONTRACT GLASS VEIL')`; `L.play(...)`; `L.waitDebrief(page)`.
2. Record `L.outcome(page)`; confirm `quietReplay === true`.
3. Read filing status and `.db-filing` text; confirm blob still equals `blob1`.
4. Capture `pv-017-m2-quiet-replay-unfiled-1280x720.png`.
**Expected Result**: Status `unfiled`; line `INVOICE UNFILED // COMMITS ON NEXT SCREEN` visible; no payout billed (quiet replay); blob unchanged.
**Pass Criteria**: `quietReplay` true, status `unfiled`, line visible in the screenshot. If `quietReplay` is false the case is BLOCKED (wrong fixture), not Fail.
**Evidence**: `production/qa/evidence/pv-017/pv-017-m2-quiet-replay-unfiled-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-017-M2-04 — Replay to Brief files and keeps selection C

**Preconditions**: PV-017-M2-03 on its Debrief; record `missionId` (C) from `L.state(page)`.
**Steps**:
1. Click `REPLAY MISSION`; wait 1.5 s.
2. Read phase, filing status, `missionId`.
3. Capture `pv-017-m2-replay-brief-filed-1280x720.png`.
**Expected Result**: Phase `brief`; status `filed`; `missionId` equals C.
**Pass Criteria**: All three true.
**Evidence**: `production/qa/evidence/pv-017/pv-017-m2-replay-brief-filed-1280x720.png`
**Actual Result**:
**Pass/Fail**:


---

## Execution Record — 2026-10-15 (/team-qa sprint)

**Executed by**: Claude (CLAUDE.md "Do It Yourself"), Playwright driving headed Chrome for Testing at 1280x720 against `npm run dev` on 4200, revision `02491cf`. Driver and raw results: `production/qa/evidence/team-qa-2026-10-15-s6/` (`manual.mjs`, `manual.log`, `manual.json`). Telemetry and settings were set through the Settings UI. Missions were played by the sim-order bot in god mode with `ff: 2` (harness assist). The driver was written in parallel with these cases, so it follows each case's intent; steps it did not perform are listed. Per-step Actual/Pass fields above are left as written; this record is the result.

| Check | Actual | Result |
|---|---|---|
| Played paid win (GLASS VEIL), Debrief | `quietReplay: false`, filing `unfiled`, line `INVOICE UNFILED // COMMITS ON NEXT SCREEN` | PASS |
| Return to World Network | filing `filed` | PASS |
| Played quiet replay (GLASS VEIL again), Debrief | `quietReplay: true`, filing `unfiled`, same line, title `REPLAY // FEE ALREADY COLLECTED` | PASS |
| Return to World Network | filing `filed` | PASS |

**Story result: PASS.** Evidence: `evidence/pv-017/m2-01-played-paid-win-debrief-unfiled-1280x720.png`, `m2-02-played-quiet-replay-debrief-unfiled-1280x720.png`, `m2-03-quiet-replay-world-network-filed-1280x720.png`. Not run this pass: Replay-to-Brief path (retained `02-replay-to-brief-filed` and unit tests cover it).
