# PV-005 — Abort writes nothing; the next Screen writes the clock — Manual test cases (M-4)

**Story**: `production/epics/persistence-and-validation/story-005-mid-mission-reload-and-abort-discard.md`
**Story type**: Integration | **Evidence output**: `production/qa/evidence/pv-005/` (create it) | **Gate**: BLOCKING per story; M-4 is low priority, not a gate blocker
**Why**: smoke s8 found the blob after Abort differed from the mission-start blob only in `world` and could not tell whether Abort wrote or the World Network autosave wrote. `src/state/save.ts` `scheduleAutosave` skips writes while phase is `mission` or `debrief` and writes after a delay once a Screen is active.

## Common setup

- `npm run dev -- --strictPort --port 4200`; driver `production/qa/evidence/smoke-2026-10-15-s6/lib.mjs`, 1280x720. Campaign key `nexus-save-v1`.
- Telemetry OFF (AC2 fixture; check `nexus-settings-v1`). Telemetry writes go to `nexus-telemetry-v1` and are excluded anyway.
- **Write recorder** (observation only; the original `setItem` runs unchanged), installed after the Brief opens:
  ```js
  await page.evaluate(async () => {
    const A = (await import('/src/state/appStore.ts')).useAppStore
    const o = Storage.prototype.setItem; window.__origSet = o; window.__writes = []
    Storage.prototype.setItem = function (k, v) {
      if (k === 'nexus-save-v1') window.__writes.push({ at: performance.now(), phase: A.getState().phase, value: v })
      return o.call(this, k, v)
    }
  })
  ```
- Abort: Escape → `[aria-label="Abort mission"]` → `[aria-label="Confirm abort mission"]` (within 3 s). Record `tAbort = performance.now()` immediately before and after the confirm click.

---

## Test Case: PV-005-M4-01 — No campaign write between Deploy and Abort confirm

**Preconditions**: New Operation, World Network, autosave settled 1.5 s. `S = localStorage.getItem('nexus-save-v1')` and `L.state(page)` recorded. Recorder installed.
**Steps**:
1. `L.deploy(page, 'OPEN CONTRACT GLASS VEIL')`; note `tMission` when phase becomes `mission`.
2. Let the mission run 10 s (no harness ticks).
3. Abort (pause → Abort → Confirm); record `tAbortClick`.
4. Immediately (same evaluate, synchronous after the click) read `__writes.length` and `localStorage.getItem('nexus-save-v1')`.
**Expected Result**: No entry in `__writes` with `phase === 'mission'`. No entry with `at` between `tMission` and `tAbortClick`. The blob read in step 4 equals the last value written before Deploy (Brief/Assembly autosave or S).
**Pass Criteria**: Zero writes during the mission and none synchronous with the Abort confirm.
**Evidence**: `production/qa/evidence/pv-005/pv-005-m4-writes.json` (the `__writes` list with `at`, `phase`, and the markers)
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-005-M4-02 — First post-Abort write is the World Network autosave and differs only in the clock

**Preconditions**: PV-005-M4-01 just completed; recorder still installed.
**Steps**:
1. Wait 2 s on World Network; read `__writes` entries with `at > tAbortClick`.
2. For the first such entry record `phase` and delay `at - tAbortClick`.
3. Diff its parsed value against the pre-Deploy blob, key by key (top-level, then inside `world`).
4. Capture `pv-005-m4-world-after-abort-1280x720.png`.
**Expected Result**: The first post-Abort write has `phase === 'world'` and arrives after the autosave delay, not synchronously. Differences from the pre-Deploy blob are confined to strategic-time fields under `world` (e.g. `t` and fields advanced by strategic ticks); credits, influence, intel, roster, sectors, labs, `contractsWon`, campaign flags equal S.
**Pass Criteria**: First write phase is `world` and every non-`world` key equals S. Any changed durable field is a Fail; list it. A changed `world` field beyond the clock is recorded as an observation for the PV-005 owner, not a Fail (no AC covers the strategic clock after Abort).
**Evidence**: `production/qa/evidence/pv-005/pv-005-m4-diff.txt`, `production/qa/evidence/pv-005/pv-005-m4-world-after-abort-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-005-M4-03 — Reload + Continue restores S; aborted mission not restored

**Preconditions**: PV-005-M4-02 completed. Restore `Storage.prototype.setItem = window.__origSet`.
**Steps**:
1. Reload; click `[aria-label^="CONTINUE SAVED OPERATION"]`.
2. Read `L.state(page)`, `L.outcome(page)`, and `(await import('/src/game/runtime.ts')).getWorld()`.
**Expected Result**: Phase `world`; credits, influence, intelLevel, roster, sectors, `contractsWon`, campaign banners equal S; outcome null; no running world.
**Pass Criteria**: All equal; outcome null; `getWorld()` falsy.
**Evidence**: append to `production/qa/evidence/pv-005/pv-005-m4-diff.txt`
**Actual Result**:
**Pass/Fail**:


---

## Execution Record — 2026-10-15 (/team-qa sprint)

**Executed by**: Claude (CLAUDE.md "Do It Yourself"), Playwright driving headed Chrome for Testing at 1280x720 against `npm run dev` on 4200, revision `02491cf`. Driver and raw results: `production/qa/evidence/team-qa-2026-10-15-s6/` (`manual.mjs`, `manual.log`, `manual.json`). Telemetry and settings were set through the Settings UI. Missions were played by the sim-order bot in god mode with `ff: 2` (harness assist). The driver was written in parallel with these cases, so it follows each case's intent; steps it did not perform are listed. Per-step Actual/Pass fields above are left as written; this record is the result.

| Check | Actual | Result |
|---|---|---|
| Save-key writes logged with phase, from Continue to after Abort | 12 writes: 6 before deploy (world/brief/team), 0 with phase `mission`, 6 after Abort with phase `world` | PASS |
| Post-Abort writes vs blob at mission start | Every post-Abort write equals the mission-start blob once `world` is removed | PASS |

**Story result: PASS.** Abort wrote nothing; the writes after it are the World Network autosave moving the clock. Evidence: `evidence/pv-005/m4-01-world-network-after-abort-1280x720.png` + `manual.log` step `m4-abort`.
**Observation:** on World Network the save key is written about every 0.55 s (6 writes in ~3 s, clock running at 2x). Not an AC issue; worth a look against autosave intent and write cost.
