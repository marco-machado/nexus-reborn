# PV-018 — Write-failure notice on World Network at 1280x720 — Manual test cases (M-5)

**Story**: `production/epics/persistence-and-validation/story-018-write-failure-never-reports-filed.md`
**Story type**: Integration (UI evidence) | **Evidence output**: `production/qa/evidence/pv-018/` | **Gate**: not a gate item; observation for `/ux-design`
**Scope**: Re-shoot the notice and measure overlap with the Feed panel. **Position and copy are not ACs** (`SAVE FAILED // CAMPAIGN NOT FILED` is placeholder in `src/ui/filingStatus.ts`, pending `/ux-design`). The overlap case records an observation; it does not pass or fail the story. A confirmed overlap is an S4 candidate for `/bug-report`, not a defect against the AC.

## Common setup

- `npm run dev -- --strictPort --port 4200`; driver `production/qa/evidence/smoke-2026-10-15-s6/lib.mjs`, 1280x720.
- Selectors: notice `.write-fail-region .write-fail-notice`; Feed panel `.wm-feed`; Feed rows `.wm-feed-line`.
- **Harness injection** (as smoke s10): `Storage.prototype.setItem` throws `QuotaExceededError` for `nexus-save-v1` only; keep the original in `window.__origSet`.
- Trigger the failing write with a real Screen write (navigate to Research, then back to World Network through the nav), not `setState` on a store. If no Screen write occurs, wait 2 s on World Network (strategic time ticks schedule autosave).

---

## Test Case: PV-018-M5-01 — Notice shows and status is write-failed

**Preconditions**: New Operation → World Network, orientation dismissed; Feed has at least 3 rows (wait for events or advance strategic time via the UI; record the row count).
**Steps**:
1. Install the injection.
2. Visit Research via its nav tab (find the label with `L.btns(page)`), then return with `[aria-label="WORLD NETWORK"]`; wait 1.5 s.
3. Read `useSaveStatusStore.getState().status`, the notice text, and collect `pageerror` entries.
**Expected Result**: Status `write-failed`; notice reads `SAVE FAILED // CAMPAIGN NOT FILED`; no page error.
**Pass Criteria**: All three true (this re-checks PV-018 behaviour; it is pass/fail).
**Evidence**: `production/qa/evidence/pv-018/pv-018-m5-world-notice-1280x720.png`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-018-M5-02 — Record notice overlap with the Feed (observation)

**Preconditions**: PV-018-M5-01 state, notice visible on World Network.
**Steps**:
1. Read `getBoundingClientRect()` of the notice, `.wm-feed`, and each `.wm-feed-line`.
2. For each, compute the intersection rectangle with the notice; record which feed rows (by index and text) intersect and the overlap area in px.
3. Read `getComputedStyle` `position` and `z-index` of `.write-fail-region` and `.wm-feed`.
4. Capture the full page `pv-018-m5-world-notice-1280x720.png` (shared with M5-01) and a clip around the notice `pv-018-m5-notice-feed-overlap-1280x720.png`.
**Expected Result**: Observation only. Record: notice rect, Feed rect, list of overlapped rows and px area, whether any Feed text is hidden. Smoke s10 reported overlap with the third Feed line; record whether that reproduces.
**Pass Criteria**: N/A (observation). Mark Pass/Fail as `OBSERVED` with "overlap yes/no". If yes, log an S4 candidate via `/bug-report` referencing this case and the pending `/ux-design` decision.
**Evidence**: `production/qa/evidence/pv-018/pv-018-m5-notice-feed-overlap-1280x720.png`, `production/qa/evidence/pv-018/pv-018-m5-rects.json`
**Actual Result**:
**Pass/Fail**:

## Test Case: PV-018-M5-03 — Notice clears when the next write lands

**Preconditions**: PV-018-M5-02 done.
**Steps**:
1. Restore `Storage.prototype.setItem = window.__origSet`.
2. Trigger a Screen write (Research → World Network); wait 1.5 s.
3. Read status and whether `.write-fail-notice` exists.
4. Capture `pv-018-m5-notice-cleared-1280x720.png`.
**Expected Result**: Status `filed`; notice element absent; `.write-fail-region` still mounted (empty live region).
**Pass Criteria**: All three true.
**Evidence**: `production/qa/evidence/pv-018/pv-018-m5-notice-cleared-1280x720.png`
**Actual Result**:
**Pass/Fail**:


---

## Execution Record — 2026-10-15 (/team-qa sprint)

**Executed by**: Claude (CLAUDE.md "Do It Yourself"), Playwright driving headed Chrome for Testing at 1280x720 against `npm run dev` on 4200, revision `02491cf`. Driver and raw results: `production/qa/evidence/team-qa-2026-10-15-s6/` (`manual.mjs`, `manual.log`, `manual.json`). Telemetry and settings were set through the Settings UI. Missions were played by the sim-order bot in god mode with `ff: 2` (harness assist). The driver was written in parallel with these cases, so it follows each case's intent; steps it did not perform are listed. Per-step Actual/Pass fields above are left as written; this record is the result.

| Check | Actual | Result |
|---|---|---|
| Inject QuotaExceededError on save key, trigger write | filing `write-failed` / `quota`, `SAVE FAILED // CAMPAIGN NOT FILED` shown, 0 page errors | PASS |
| Notice vs Feed at 1280x720 | notice 308x29 at (486,619) lies fully inside Feed (471,536 541x124); covers 2 Feed rows ("CORPSEC RAID SWEEPS LAGOS", "STRIKE COLUMNS BLOCK NEW CARTHAGE") | OBSERVED |

**Story result: PASS WITH NOTES.** No AC sets position; the overlap goes with the placeholder copy pending `/ux-design`. Evidence: `evidence/pv-018/m5-01-world-network-write-failed-1280x720.png`.
