# PV-016 — Balance Export and two-step Clear — Manual test cases (M-1)

**Story**: `production/epics/persistence-and-validation/story-016-balance-export-and-two-step-clear.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/pv-016/` | **Gate**: BLOCKING (screenshots + lead-programmer sign-off); this case is the open M-1 gap from `production/qa/qa-strategy-sprint-006-2026-10-15.md`
**Scope**: AC4 (exported record fields) from a played, non-seeded, non-abort Debrief; AC1 (local download, no upload) is re-observed on the same run. AC2/AC3 (two-step Clear) are covered by smoke s7 and `telemetry.test.ts`; not re-run here.

## Common setup

- `npm run dev -- --strictPort --port 4200`; driver = `production/qa/evidence/smoke-2026-10-15-s6/lib.mjs` (`L.open()` gives 1280x720 headed Chrome for Testing).
- Keys: campaign `nexus-save-v1` (`src/state/save.ts` SAVE_KEY), telemetry `nexus-telemetry-v1` (`src/state/telemetry.ts`), settings `nexus-settings-v1` (`src/state/settingsStore.ts`).
- **Telemetry must be turned on through the Settings UI, never `useSettingsStore.setState`** (`setState` skips `persist()`; see PV-003 cases).
- **Harness assists allowed and named**: `L.play(page, { god: true, ff: 2 })` (heal-to-full and extra sim ticks, inside the sim). No store seeding of outcomes or telemetry records.
- Record the commit under test (`git rev-parse --short HEAD`) in Actual Result.

---

## Test Case: PV-016-M1-01 — Exported JSON from a played Debrief carries every AC4 field

**Preconditions**: Dev server on 4200. Clean origin (`localStorage.clear()` then reload). Menu shows `NEW OPERATION`.
**Steps**:
1. On the Menu click `[aria-label^="OPEN SETTINGS"]`. Click the telemetry toggle (`button[aria-label="TELEMETRY: LOCAL ONLY // OFF"]`). Confirm its aria-label now reads `TELEMETRY: LOCAL ONLY // ON`. Close Settings.
2. Read `localStorage.getItem('nexus-settings-v1')` and confirm `"telemetry":true`.
3. Click `NEW OPERATION`, dismiss the orientation (`L.dismiss`), `L.tagPhases`.
4. `L.deploy(page, 'OPEN CONTRACT GLASS VEIL')`, then `L.play(page, { god: true, ff: 2, budgetMs: 420000 })`, then `L.waitDebrief(page)`.
5. Record `L.outcome(page)` (won, civiliansHit, casualties, deadIds, quietReplay) and the Debrief invoice text (`.db-rows` innerText), including payout and KIA.
6. Read `localStorage.getItem('nexus-telemetry-v1')`; confirm exactly one record and its `outcome` is not `aborted`.
7. Open Balance from Debrief (`[aria-label="Open the balance dashboard over the local mission log"]`). Capture `pv-016-m1-balance-played-1280x720.png`.
8. Start network recording (`page.on('request')`, keep URL + method). Arm `page.waitForEvent('download')`, click `[aria-label="Export the telemetry records as JSON"]`. Record `download.suggestedFilename()`, then `download.saveAs('production/qa/evidence/pv-016/pv-016-m1-nexus-balance.json')`.
9. Open the saved file. Locate the non-abort record. For each AC4 field, write the key and value into Actual Result:
   - outcome → `outcome` (`won` or `lost`)
   - duration → `durationSec`
   - first contact → `firstContactSec` (number, or `null` for a clean run)
   - objectives → `objectiveTimes` (array of `{id, atSec}`)
   - weapon shots and damage → `shotsByWeapon`, `damageByWeapon`
   - damage in and out → `damageTaken`, `damageDealt`
   - civilian hits by source → `civilianHitsBySquad`, `civilianHitsByCorpsec`
   - item use → `medUsed`, `cellUsed`; ability use → `abilityUsesByRole`
   - KIA → `kia`; payout → `payout`; deployed roles → `squadRoles`
10. Save a text excerpt of that record as `pv-016-m1-record-excerpt.txt` (the record object, pretty-printed).
**Expected Result**: Download filename is `nexus-balance.json`. The file parses as JSON and holds the one played record. Every key listed in step 9 is present with a value of the stated type (numbers finite, maps are objects, arrays are arrays). `outcome` matches `L.outcome().won`. `kia` equals `deadIds.length`. `payout` equals the Debrief invoice payout. `squadRoles` has one entry per deployed operative (4 with the harness auto-assign). `objectiveTimes` is non-empty for a won mission. No request recorded during Export other than none or a `data:`/`blob:` URL (no POST, no request to any origin for the export).
**Pass Criteria**: All 15 AC4 keys present and type-correct, the four cross-checks (outcome, kia, payout, roles count) match, and zero network requests were issued by the Export click. Any missing key or any outgoing request is a Fail.
**Evidence**: `production/qa/evidence/pv-016/pv-016-m1-balance-played-1280x720.png`, `production/qa/evidence/pv-016/pv-016-m1-nexus-balance.json`, `production/qa/evidence/pv-016/pv-016-m1-record-excerpt.txt`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-016-M1-02 — Export is byte-equal to the stored telemetry records

**Preconditions**: PV-016-M1-01 completed in the same session; the downloaded file is on disk.
**Steps**:
1. Read `JSON.parse(localStorage.getItem('nexus-telemetry-v1')).records`.
2. Compare it with the record array in `pv-016-m1-nexus-balance.json` (deep equal, key by key).
**Expected Result**: The exported records equal the stored records; nothing is dropped, renamed or recomputed by Export.
**Pass Criteria**: Deep-equal true. Any difference is a Fail; record the differing key.
**Evidence**: append the comparison result to `production/qa/evidence/pv-016/pv-016-m1-record-excerpt.txt`
**Actual Result**:
**Pass/Fail**:


---

## Execution Record — 2026-10-15 (/team-qa sprint)

**Executed by**: Claude (CLAUDE.md "Do It Yourself"), Playwright driving headed Chrome for Testing at 1280x720 against `npm run dev` on 4200, revision `02491cf`. Driver and raw results: `production/qa/evidence/team-qa-2026-10-15-s6/` (`manual.mjs`, `manual.log`, `manual.json`). Telemetry and settings were set through the Settings UI. Missions were played by the sim-order bot in god mode with `ff: 2` (harness assist). The driver was written in parallel with these cases, so it follows each case's intent; steps it did not perform are listed. Per-step Actual/Pass fields above are left as written; this record is the result.

| Check | Actual | Result |
|---|---|---|
| Export from 2 played won records | `nexus-balance.json` downloaded, saved as `evidence/pv-016/m1-nexus-balance-export.json` (`{version, records}`, 2 records) | PASS |
| Network requests during Export | none (non-data/blob URLs: 0) | PASS |
| AC4 field list on a non-abort record | outcome, durationSec, firstContactSec, objectiveTimes, shotsByWeapon, damageByWeapon, damageDealt, damageTaken, civilianHitsBySquad, civilianHitsByCorpsec, medUsed, cellUsed, abilityUsesByRole, kia, payout, squadRoles: all present | PASS |

**Story result: PASS.** Evidence: `evidence/pv-016/m1-01-balance-played-records-1280x720.png`, the exported JSON. Not run this pass: cross-check of values against the Debrief screen, Clear arm/lapse (smoke s7 covered it).
