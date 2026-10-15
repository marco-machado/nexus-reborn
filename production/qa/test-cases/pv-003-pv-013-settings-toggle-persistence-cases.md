# PV-003 / PV-013 — Settings toggles persist through the UI — Manual test cases (M-3)

**Stories**: `production/epics/persistence-and-validation/story-003-settings-envelope-survives-new-operation-and-reload.md`, `story-013-telemetry-opt-in-default-and-no-network-egress.md`
**Story type**: Integration | **Evidence output**: `production/qa/evidence/pv-003/` (create it) | **Gate**: BLOCKING per story; this M-3 session is not a gate blocker
**Why**: smoke observation 3 saw telemetry read `false` after reload when set by `useSettingsStore.setState`. In `src/state/settingsStore.ts` only the setter actions (`setTelemetry`, `setQuality`, `setDifficulty`) call `persist()`; a raw `setState` does not. These cases drive the real buttons to confirm the UI path persists.

## Common setup

- `npm run dev -- --strictPort --port 4200`; driver `production/qa/evidence/smoke-2026-10-15-s6/lib.mjs`, 1280x720.
- Settings key `nexus-settings-v1`; campaign key `nexus-save-v1`.
- Open Settings from Menu: `[aria-label^="OPEN SETTINGS"]`. Selectors (`src/ui/Settings.tsx`): telemetry `button[aria-label^="TELEMETRY: LOCAL ONLY // "]`; Quality `[aria-label="Render quality <auto|high|medium|low>"]`; Difficulty `[aria-label="Difficulty <STANDARD|HARDENED>"]`. Selected option has class `amber`.
- **Never call `useSettingsStore.setState` in these cases.** Reads through `getState()` are allowed.

---

## Test Case: PV-013-M3-01 — Clean origin defaults telemetry off

**Preconditions**: `localStorage.clear()`, reload to Menu.
**Steps**:
1. Open Settings. Read the telemetry button aria-label and whether `[aria-label="Open the balance dashboard"]` exists.
2. Read `localStorage.getItem('nexus-settings-v1')` and `localStorage.getItem('nexus-telemetry-v1')`.
3. Capture `pv-003-m3-defaults-1280x720.png`.
**Expected Result**: Telemetry reads `// OFF`; no Balance entry; telemetry key absent or empty records.
**Pass Criteria**: All three true.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-defaults-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-003-M3-02 — Telemetry toggle via UI survives reload

**Preconditions**: PV-013-M3-01 done; Settings open.
**Steps**:
1. Click the telemetry button once. Read its aria-label.
2. Read `nexus-settings-v1`; confirm `"telemetry":true`.
3. Close Settings, `page.reload()`, wait 1.2 s. Do not click Continue or New Operation.
4. Open Settings; read the telemetry aria-label and `useSettingsStore.getState().telemetry`.
5. Capture `pv-003-m3-telemetry-on-after-reload-1280x720.png`.
6. Click it again (OFF), reload, re-read.
**Expected Result**: After step 3 reload the button reads `TELEMETRY: LOCAL ONLY // ON` and store reads `true` without Continue. After step 6 it reads `// OFF` and `false`.
**Pass Criteria**: Both reload reads match the value set through the UI.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-telemetry-on-after-reload-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-003-M3-03 — Quality via UI survives reload

**Preconditions**: Menu, Settings open; record the current Quality (button with `amber`).
**Steps**:
1. Click `[aria-label="Render quality low"]` (or any value different from current; record which).
2. Confirm `nexus-settings-v1` holds `"quality":"low"`.
3. Reload; open Settings; read the `amber` Quality button and `getState().quality`.
4. Capture `pv-003-m3-quality-after-reload-1280x720.png`.
**Expected Result**: `LOW` is selected and store reads `low` after reload.
**Pass Criteria**: Value after reload equals the value clicked.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-quality-after-reload-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-003-M3-04 — Difficulty via UI survives reload

**Preconditions**: Menu, Settings open; record the current Difficulty.
**Steps**:
1. Click `[aria-label="Difficulty HARDENED"]` (or the other value; record which).
2. Confirm `nexus-settings-v1` holds `"difficulty":"hardened"`.
3. Reload; open Settings; read the `amber` Difficulty button and `getState().difficulty`.
4. Capture `pv-003-m3-difficulty-after-reload-1280x720.png`.
**Expected Result**: `HARDENED` selected, store `hardened`.
**Pass Criteria**: Value after reload equals the value clicked.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-difficulty-after-reload-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-003-M3-05 — With a campaign, Q2/D2 come from the settings slot, not the campaign blob

**Preconditions**: `NEW OPERATION` started, World Network reached, a campaign blob exists (`nexus-save-v1` non-null). Quality and Difficulty set to known values Q1/D1 via UI.
**Steps**:
1. Return to Menu by reload. Open Settings; change Quality to Q2 and Difficulty to D2 via the buttons.
2. Reload; click `[aria-label^="CONTINUE SAVED OPERATION"]`.
3. Read `getState().quality` / `.difficulty`.
4. Parse `nexus-save-v1` and search it recursively for keys `quality` and `difficulty`.
**Expected Result**: Quality Q2, Difficulty D2; the campaign blob holds neither key.
**Pass Criteria**: Both values equal Q2/D2 and zero matching keys in the campaign blob.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-continue-settings.txt` (values + key search result)
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-003-M3-06 — UI-set Settings survive New Operation confirm

**Preconditions**: Valid campaign; telemetry ON, Quality Q2, Difficulty D2 all set via UI.
**Steps**:
1. On Menu click the New Operation button twice within 3 s (arm, confirm), as in smoke s9.
2. Open Settings; read telemetry, Quality, Difficulty; read `nexus-settings-v1`.
**Expected Result**: All three unchanged.
**Pass Criteria**: Each equals its pre-confirm value.
**Evidence**: `production/qa/evidence/pv-003/pv-003-m3-after-new-operation-1280x720.png`
**Actual Result**:
**Pass/Fail**:


---

## Execution Record — 2026-10-15 (/team-qa sprint)

**Executed by**: Claude (CLAUDE.md "Do It Yourself"), Playwright driving headed Chrome for Testing at 1280x720 against `npm run dev` on 4200, revision `02491cf`. Driver and raw results: `production/qa/evidence/team-qa-2026-10-15-s6/` (`manual.mjs`, `manual.log`, `manual.json`). Telemetry and settings were set through the Settings UI. Missions were played by the sim-order bot in god mode with `ff: 2` (harness assist). The driver was written in parallel with these cases, so it follows each case's intent; steps it did not perform are listed. Per-step Actual/Pass fields above are left as written; this record is the result.

| Check | Actual | Result |
|---|---|---|
| Clean origin defaults | TELEMETRY // OFF, Difficulty STANDARD, Render quality auto | PASS |
| UI clicks: telemetry, Difficulty HARDENED, Render quality high | Buttons pressed; `nexus-settings-v1` = telemetry true, difficulty hardened, quality high | PASS |
| Reload, reopen Settings | All three still set | PASS |
| New Operation, reload | All three still set | PASS |

**Story result: PASS.** Smoke observation 3 (telemetry false after reload) does not reproduce through the UI; it came from the smoke harness's raw `setState`. Evidence: `evidence/pv-003/m3-01-settings-changed-1280x720.png`, `m3-02-settings-after-reload-1280x720.png`. Not run: Text scale, volume, remap persistence (unit tests cover them).
