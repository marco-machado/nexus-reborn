# RA-009 Test Cases: Assembly opens without auto-assign; Injured dossier is inspect-only

**Story**: `production/epics/roster-and-assembly/story-009-assembly-opens-without-auto-assign-injured-dossier.md` (GDD AC 7, AC 23)
**Story type**: UI | **Gate level**: BLOCKING | **Evidence location**: `production/qa/evidence/ra-009/` (re-run evidence: new dated subfolder or files suffixed with the run date)
**Environment**: in-app browser, viewport 1280x720, `npm run dev -- --strictPort` (port 4200), starting from MAIN MENU > NEW OPERATION.
**Executor**: Claude. Stop the dev server and confirm port 4200 is free when done.

## Method labels (every case states one)

- **[FIXTURE]** = constructed state. Reuses the method in `production/qa/evidence/ra-009/README.md`: after selecting contract `m01`, import `/src/state/appStore.ts` and `/src/state/debrief.ts` in the page; set Squad to `['op1','op2']`; store a lost outcome with `deadIds: ['op1']`, `survivorHp: { op2: 0.2 }`, `applyKey` = `lastAppliedKey + 1`; call the real `applyDebrief('m01')`; then open Assembly from the ASSEMBLY nav tab. Any evidence from it must be captioned "constructed fixture".
- **[SIM]** = mission outcome driven by sim order calls per `docs/mission-playbook.md` (`getWorld()` `orderMove/orderUseMed/orderAbility`, `missionStore.setPaused`). No store writes.
- **[UI]** = ordinary clicks and DOM reads only.

Fixture precondition ("State F"): MARA KIA, GHOST newly INJURED, RAVEN INJURED (new-operation seed), Squad `[]`, Ready = DART, TORQ, SLATE, VEX, KESTREL.

---

## RA9-01 AC 1: Assembly opens with all 4 bays empty
**Method**: [FIXTURE] (primary). Optional repeat as RA9-01b via [SIM] if a natural run produces every assigned operative KIA or Injured with >=1 Ready left (not required; label if done).
**Preconditions**: Fresh New Operation; State F reached; Assembly not yet opened.
**Steps**:
1. Click the ASSEMBLY nav tab.
2. Read the header assignment counter and the four Squad bays (01 to 04).
3. In the page, read `useAppStore.getState().squad` (read only).
4. Screenshot at 1280x720.
**Expected Result**: Header reads `0 / 4 ASSIGNED`. Bays 01-04 each read EMPTY BAY / AWAITING ASSIGNMENT. Squad is `[]`. At least one roster row (e.g. DART) shows READY with an enabled assign key.
**Actual Result**:
**Pass/Fail**:

## RA9-02 Deploy refused with NO OPERATIVES ASSIGNED
**Method**: [FIXTURE] state from RA9-01, [UI] reads.
**Preconditions**: Assembly open, Squad `[]`, **and a contract selected**. RETURN TO WORLD NETWORK clears the contract, and ADR-0019 checks `no-contract` first, so reach this state with the contract still selected: select Glass Veil, then apply the fixture by calling `applyDebrief('m01')` directly (do not go through the Debrief screen's return).
**Steps**:
1. Locate the DEPLOY control.
2. Read its `disabled` attribute, `aria-label`, and subline text.
3. Click it once.
4. Read the current phase (UI still Assembly; `useAppStore.getState().phase`).
**Expected Result**: Button is disabled; aria-label is `DEPLOY TEAM // NO OPERATIVES ASSIGNED`; subline `ASSIGN AT LEAST ONE READY OPERATIVE`. No mass or contract reason shown. Click does not start a mission (phase stays `team`).
**Actual Result**:
**Pass/Fail**:

## RA9-03 AC 2: focusing an Injured row body opens its dossier
**Method**: [UI] on State F.
**Preconditions**: Assembly open, State F.
**Steps**:
1. Click the body of the DART row (Ready); note the dossier header.
2. Click the body (not the assign key) of the RAVEN row (Injured).
3. Read the dossier panel: name/role, CONDITION, stats.
4. Click the body of the GHOST row (newly Injured) and read the dossier again.
5. Screenshot with RAVEN or GHOST focused.
**Expected Result**: Each click swaps the dossier to that operative. RAVEN reads `RAVEN / SNIPER` with `CONDITION: INJURED`; GHOST dossier shows CONDITION INJURED. Stats, role protocol and augmentations render. No error or refusal message for inspecting.
**Actual Result**:
**Pass/Fail**:

## RA9-04 AC 2: Injured assign key disabled with exact tooltip
**Method**: [UI] DOM read on State F.
**Preconditions**: Assembly open, State F.
**Steps**:
1. For rows RAVEN and GHOST, read the assign (`+`) button `disabled` attribute and `title`.
2. Click each disabled key once.
3. Read `squad` and the bays.
4. For DART (Ready), read the assign key `disabled` and `title`.
5. Optional: if a headed hover screenshot is available, hover an Injured key and capture it (headless does not draw native tooltips; DOM text is the primary evidence).
**Expected Result**: RAVEN and GHOST keys: `disabled`, `title` exactly `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`. Clicks change nothing (Squad `[]`). DART key: enabled, title `ASSIGN`.
**Actual Result**:
**Pass/Fail**:

## RA9-05 Focusing any dossier leaves bay contents unchanged
**Method**: [UI] on State F, plus one assigned-bay variant.
**Preconditions**: Assembly open, State F, Squad `[]`.
**Steps**:
1. Record bay contents (all EMPTY BAY) and `squad`.
2. Focus, in order: GHOST, DART, RAVEN, KESTREL (row bodies). After each, read `squad` and the four bays.
3. Click the assign key on DART so bay 01 holds DART (this is a real UI assign, not a store write).
4. Focus RAVEN (Injured) and then GHOST, then DART again. After each, read `squad` and bays.
**Expected Result**: After step 2 every read shows `[]` and 4 empty bays. After step 3 Squad is `['<DART id>']` with DART in bay 01. After step 4 Squad is still exactly that one id in bay 01, other bays empty, counter `1 / 4 ASSIGNED`.
**Actual Result**:
**Pass/Fail**:

## RA9-06 No clipping at 1280x720, 100% text scale
**Method**: [UI] on State F.
**Preconditions**: Assembly open, State F, text scale 100%.
**Steps**:
1. Screenshot the full Assembly at 1280x720 with an Injured dossier focused.
2. Run a DOM scan of roster rows, Squad bays, dossier panel and Deploy block: list leaf elements whose `scrollWidth > clientWidth` or `scrollHeight > clientHeight` inside a parent whose `overflow` is not `visible` (and ellipsized text).
3. Scroll the roster list to its end and confirm the last row (KESTREL) is fully reachable.
4. Visually inspect row labels, status badges, bay labels, Deploy subline.
**Expected Result**: Scan lists 0 clipped/truncated elements. No text cut off in rows, bays or Deploy block; roster scrolls rather than clipping.
**Actual Result**:
**Pass/Fail**:

## RA9-07 No clipping at 125% text scale
**Method**: [FIXTURE] state (State F) + text scale via the Settings TEXT SCALE 125% button if reachable from the UI; else `useSettingsStore.getState().setTextScale(125)` (the same action the button calls; label as such).
**Preconditions**: Assembly open, State F.
**Steps**:
1. Set text scale to 125%.
2. Re-open/return to Assembly if the Settings overlay navigated away.
3. Focus RAVEN (Injured). Screenshot at 1280x720.
4. Repeat the RA9-06 step 2 DOM scan and the step 3 scroll check.
5. Read the header (`0 / 4 ASSIGNED`, `ROSTER n / 8`) and bay labels.
6. Reset text scale to 100%.
**Expected Result**: 0 clipped elements. Header, bay labels and Deploy subline may wrap to a second line (known, accepted in the story's advisory) but no glyphs are cut off; KESTREL reachable by scrolling. Any wrap is noted, not failed; any cut-off text is a failure.
**Actual Result**:
**Pass/Fail**:

## RA9-08 Long tooltip is not truncated in the DOM
**Method**: [UI]
**Preconditions**: Assembly open, State F.
**Steps**:
1. Read the full `title` string of the Injured assign key and compare character by character with `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`.
2. Read the Injured key's `aria-label`.
**Expected Result**: `title` is exact. Record the `aria-label` as observed (the story's review notes it gives no reason; observation only, not a failure).
**Actual Result**:
**Pass/Fail**:

---
## Run notes
- Console: `favicon.ico` 404 and `THREE.Clock` deprecation warning are known and unrelated; log anything else.
- Keyboard and gamepad focus are out of scope (story exclusion).

---
## Execution Record — 2026-10-16 (`/team-qa sprint`)

**Executor**: Claude, in-app browser, 1280x720, `npm run dev -- --strictPort`, revision `cfd2066` (clean tree). Fixture per the ra-009 README (`[FIXTURE]`, constructed state): New Operation → Glass Veil selected → Squad `['op1','op2']` → lost outcome `deadIds ['op1']`, `survivorHp {op2: 0.2}` → Debrief entry applied it (`setOutcome`) → RETURN TO WORLD NETWORK → Assembly. Console: no errors.

| Case | Result | Actual |
|---|---|---|
| RA9-01 | PASS | `0 / 4 ASSIGNED`, 4 × EMPTY BAY, squad `[]`; DART Ready with enabled key |
| RA9-02 | PASS (re-run) | First run, after RETURN TO WORLD NETWORK: Deploy disabled, `DEPLOY TEAM // NO CONTRACT SELECTED`. Spec-correct: ADR-0019 (`src/game/deployGate.ts`) names the first failing check, and `no-contract` precedes `none-assigned`; the return clears the contract. The case precondition is wrong, not the product. Re-run as the README did (contract selected, `applyDebrief('m01')` called directly, DART KIA): disabled, `DEPLOY TEAM // NO OPERATIVES ASSIGNED`, subline `ASSIGN AT LEAST ONE READY OPERATIVE`; click leaves phase `team` |
| RA9-03 | PASS | RAVEN dossier `RAVEN / SNIPER`, `CONDITION: INJURED`, stats/protocol/augmentations render — `production/qa/evidence/ra-013/02-assembly-fixture-raven-injured-dossier.jpg` |
| RA9-04 | PASS | RAVEN, GHOST keys disabled, title exactly `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`; clicks leave squad `[]`; DART enabled, title `ASSIGN` |
| RA9-05 | PASS | Focus GHOST/DART/RAVEN/KESTREL: `[]`, 4 empty each time; UI assign DART → `["op3"]`, `1 / 4`; focus RAVEN/GHOST/DART → unchanged |
| RA9-06 | PASS | DOM scan 0 clipped/ellipsized leaves at 100%; roster scrolls to KESTREL |
| RA9-07 | PASS | `setTextScale(125)` (store action the Settings buttons call): DOM scan 0 clipped; header and bay labels wrap; roster list scrolls (374/353) and KESTREL is reachable — `production/qa/evidence/ra-013/03-assembly-fixture-empty-bays-125pct.jpg`; reset to 100% |
| RA9-08 | PASS | title exact; aria-label `ASSIGN RAVEN // STRIKE TEAM 04` (observation: it gives no reason, as the story review noted) |

Observation: with one operative assigned, that operative's unassign key is disabled with title `STRIKE TEAM 04 NEEDS AT LEAST ONE OPERATIVE` (RA-008 last-unassign refusal), so an empty squad with a contract selected is reachable only through a debrief. Recommend fixing RA9-02's precondition in this case file.
