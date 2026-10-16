# RA-013 / RA-016 Injury presentation cases (gap from Sprint 7 smoke item 4) and frame-time reading

**Stories**: `production/epics/roster-and-assembly/story-013-*.md` (debrief classification, `INJURY_HP_FRAC` = 0.35), `story-016-*.md` (recovery on strategic sync). Existing partial evidence: `production/qa/evidence/ra-017/01-debrief-win-catch-up-injury-30h.jpg` ("INJURED // MARA 30H RECOVERY").
**Story type**: UI/Integration | **Gate level**: BLOCKING (INJ cases), ADVISORY (frame-time case) | **Evidence location**: `production/qa/evidence/ra-013/`
**Environment**: in-app browser, 1280x720, `npm run dev -- --strictPort` (port 4200), starting from NEW OPERATION. Stop the server and confirm port 4200 free afterwards.

## Method labels

- **[SIM]** = mission driven only by `getWorld()` order calls (`orderMove`, `orderUseMed`, `orderAbility`) and `missionStore.setPaused` per `docs/mission-playbook.md`. No store writes.
- **[FIXTURE]** = constructed state (store-set squad/outcome then real `applyDebrief('m01')`, as in `production/qa/evidence/ra-009/README.md`). Evidence must be captioned "constructed fixture".
- **[UI]** = clicks and DOM reads only.
- World time is advanced only with the World Network speed buttons (1X/2X/4X/8X) or waiting; do not write `t` to a store.

## Reaching the Injured state (shared setup, "S-INJ")
Primary [SIM]: play Glass Veil (`m01`) per the playbook with these changes: never call `orderUseMed`; keep one survivor low by letting auto-fire run, pausing every 0.5-1 s and reading `w.units` hp/maxHp. Finish the mission (win via extraction) with at least one living operative at hp/maxHp > 0 and <= 0.35. Record the operative's `hp / maxHp` read from `w.units` immediately before extraction. If no survivor ends in that band after 3 attempts, use the fixture fallback and label every dependent case [FIXTURE]. Abort from pause writes nothing, so abort and redeploy is allowed between attempts.
Note: a win spends the contract ETA as strategic days (ADR-0018 catch-up) and can shorten or complete recovery before the player returns; record world time and the operative's status on return.
Fallback [FIXTURE]: README method with `survivorHp: { op2: 0.2 }` (expected D = round(12h + (1 - 0.2/0.35) * 36h) = about 27h; compute with `injuryRecoverySec` and state the value used).

---

## INJ-01 Debrief shows an Injured line with recovery hours
**Method**: [SIM] via S-INJ (fallback [FIXTURE]; state which).
**Preconditions**: New Operation; mission just ended with a survivor at 0 < f <= 0.35 (f = 0.35 exactly stays Ready, so record the f value; if f is exactly 0.35 the line must NOT appear, which becomes the expected result).
**Steps**:
1. On entering Debrief, wait for the result display to finish.
2. Read all Debrief rows; find the row labelled `INJURED // <CODENAME>`.
3. Read its value text.
4. Compare the hours to the expected `injuryRecoverySec(f)` (12h to 48h range; shallower HP gives more hours) converted to hours, using the recorded f.
5. Screenshot at 1280x720.
**Expected Result**: For f < 0.35: row `INJURED // <CODENAME>` with value `<N>H RECOVERY`, N within 12-48 and consistent with f (reference: `INJURED // MARA 30H RECOVERY` in the ra-017 evidence). Operatives ending > 0.35 produce no Injured row; dead operatives show as KIA, not Injured. Text not clipped.
**Actual Result**:
**Pass/Fail**:

## INJ-02 Boundary: survivor above 0.35 is not listed Injured
**Method**: [SIM] (observation from the same run as INJ-01 if another survivor ended > 0.35), else [FIXTURE] with `survivorHp: { op2: 0.35 }`.
**Preconditions**: Mission ended with at least one survivor with f >= 0.35.
**Steps**:
1. On Debrief, check for any Injured row naming that operative.
2. After RETURN TO WORLD NETWORK, open Assembly and read that operative's status.
**Expected Result**: No Injured row for the operative; Assembly status READY.
**Actual Result**:
**Pass/Fail**:

## INJ-03 Assembly shows the operative Injured, unassigned, assign key disabled
**Method**: [UI] continuing from INJ-01 (same method label).
**Preconditions**: INJ-01 passed; RETURN TO WORLD NETWORK pressed; record world time on return.
**Steps**:
1. Open Assembly from the nav.
2. Locate the injured operative's roster row; read the status badge.
3. Read the four bays and `useAppStore.getState().squad` (read only).
4. Read the row's assign key `disabled` and `title`.
5. Focus the row body and read the dossier CONDITION.
6. Screenshot.
**Expected Result**: Status INJURED (if the win ETA catch-up already covered the full recovery, the status is READY; record the elapsed days and mark the case NOT REACHABLE this run rather than Fail, then use INJ-03b). The operative is in no bay and not in `squad`. Assign key `disabled`, title `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`. Dossier opens and shows CONDITION: INJURED.
**Actual Result**:
**Pass/Fail**:

## INJ-03b Injured state on a path with no catch-up (only if INJ-03 is NOT REACHABLE)
**Method**: [FIXTURE] (README method, lost outcome with survivor f = 0.2; a loss spends no ETA days).
**Preconditions**: Fresh New Operation; fixture applied; Assembly opened.
**Steps**: Perform INJ-03 steps 2-6.
**Expected Result**: Same as INJ-03 (INJURED, unassigned, key disabled with the exact tooltip).
**Actual Result**:
**Pass/Fail**:

## INJ-04 Recovery: after world time passes recovery the operative reads READY, bay stays empty
**Method**: [UI]. World time advanced via World Network speed buttons only. Setup per INJ-03 or INJ-03b (state which).
**Preconditions**: Operative Injured in Assembly (INJ-03/03b). Note the hours of recovery remaining (Debrief hours minus catch-up days if any) and the starting world time.
**Steps**:
1. Go to the World Network; select 8X (or the fastest speed that is stable).
2. Advance until world time exceeds start time + remaining recovery (check the clock readout; sample every ~10 s real time; note how many real seconds elapsed, since the game-seconds per real second is not assumed).
3. Return the clock to a normal speed or pause, open Assembly from the nav.
4. Read the operative's status badge, assign key `disabled`/`title`, and the bays/squad.
5. Click the assign key once (a real UI assign).
6. Screenshot before and after.
**Expected Result**: Status READY after recovery time has passed; before that threshold (sample once earlier, e.g. at about half the remaining time) it still reads INJURED. Bays remain empty after recovery (no auto-refill). Assign key enabled with title `ASSIGN`; click places the operative in a bay.
**Actual Result**:
**Pass/Fail**:

## INJ-05 Recovery fires while Assembly itself is open
**Method**: [UI] (AC 40: a strategy Screen tick including Assembly runs sync). Same setup as INJ-04, using a second injured operative or a repeat run.
**Preconditions**: An operative Injured with little recovery remaining, Assembly open. If the strategic clock is paused on Assembly or does not run there, record that and mark NOT REACHABLE.
**Steps**:
1. With Assembly open, watch the injured row for up to 60 s real time (read status every 5 s).
2. Record the instant the badge changes.
**Expected Result**: The row flips to READY without leaving Assembly once `t >= recoverAtT`; bays stay empty.
**Actual Result**:
**Pass/Fail**:

## PERF-01 Frame-time reading on World Network and Assembly (ADVISORY)
**Method**: [UI] observation, no state change.
**Preconditions**: Fresh load, NEW OPERATION, World Network visible, strategic clock running at 1X, no overlays, tab foregrounded.
**Steps**:
1. On the World Network, inject a sampler via the browser console: record `performance.now()` deltas from `requestAnimationFrame` in an array for 5000 ms (discard the first 10 frames), then compute p50, p95, max, count, and the number of frames > 50 ms.
2. Wait 2 s, repeat once for a second sample on World Network.
3. Open Assembly from the nav; wait 2 s; run the same 5 s sampler twice.
4. Record viewport (1280x720), renderer (WebGPU or WebGL2 fallback, if readable), and whether the sampler tab was visible.
5. Report the numbers as a table: screen, run, frames, p50, p95, max, frames > 50 ms.
**Expected Result**: Numbers recorded for four runs. Flag every frame > 50 ms with its timestamp offset. A max spike on the World Network matching the known R-3 spike is logged as a carry (not a regression); a spike on Assembly, or World Network p95 > 50 ms, is raised as a finding for triage. Headless or in-app browsers may cap frame rate, so compare the two screens with each other, not against a 60 fps target.
**Actual Result**:
**Pass/Fail**: (ADVISORY: record Observed/Flagged rather than Pass/Fail)

---
## Run notes
- Console noise known: `favicon.ico` 404, `THREE.Clock` deprecation.
- Any outcome where the mission fails to produce a qualifying survivor is a setup issue, not a product defect; do not file a bug for it.

---
## Execution Record — 2026-10-16 (`/team-qa sprint`)

**Executor**: Claude, in-app browser, 1280x720, dev server, revision `cfd2066`. The browser pane was hidden for part of the run (background page; timers throttled — affects only real-time rates, not outcomes). Console: no errors.

| Case | Method | Result | Actual |
|---|---|---|---|
| INJ-01 | [SIM] attempt 2 | PASS | Attempt 1 failed setup (3 KIA, MARA at f 0.018, garrison alive; aborted). Attempt 2: Glass Veil win, medkits only below 0.2, MARA routed past patrol e13 to drop under the threshold; pre-extraction f MARA 0.294, TORQ 0.559; collateral 0. Debrief: `INJURED // MARA 18H RECOVERY` (`injuryRecoverySec(0.294)` = 17.76 h; `downtimeSec` 63,805). KIA GHOST, DART shown as KIA, not Injured — `production/qa/evidence/ra-013/01-debrief-sim-win-injured-mara-18h.jpg` |
| INJ-02 | [SIM] same run | PASS | TORQ (f 0.559): no Injured row; Assembly READY |
| INJ-03 | [UI] | NOT REACHABLE | The win's +2-day ETA catch-up (48 h) exceeded the 18 h recovery: MARA READY on return, removed from the squad, not auto-reassigned. Used INJ-03b |
| INJ-03b | [FIXTURE] | PASS | Lost outcome, GHOST f 0.2: Debrief `INJURED // GHOST 28H RECOVERY` (expected 27.43 h; `recoverAtT` 98,743). Assembly: GHOST INJURED, not in a bay or squad, key disabled with the exact tooltip |
| INJ-04 | [UI] 8X on World Network | PASS | 8X ≈ 481 game-s per real s with the pane visible. INJURED at t 14,749 … 71,080 (past half); READY after t ≥ 98,743; bays remained empty; enabled `ASSIGN` key; one click → squad `["op2"]`, `1 / 4 ASSIGNED` |
| INJ-05 | [UI] on Assembly | PASS | Clock ticks on Assembly. At t 93,159 GHOST INJURED; flipped to READY at t 98,799 without leaving Assembly; `0 / 4 ASSIGNED` unchanged; key went from disabled/injured tooltip to enabled `ASSIGN` |
| PERF-01 | [UI] | Observed | Fresh New Operation, clock 1X→2X default, tab visible. ~120 Hz cadence: |

| Screen | Run | Frames | p50 ms | p95 ms | max ms | > 50 ms |
|---|---|---|---|---|---|---|
| World Network | 1 | 590 | 8.3 | 8.8 | 9.3 | 0 |
| World Network | 2 | 590 | 8.3 | 9.0 | 9.4 | 0 |
| World Network | 3 (extra) | 590 | 8.3 | 9.0 | 9.3 | 0 |
| World Network | 4 (extra) | 588 | 8.3 | 9.0 | 25.0 | 0 |
| Assembly | 1 | 590 | 8.3 | 8.6 | 9.4 | 0 |
| Assembly | 2 | 590 | 8.3 | 8.8 | 9.3 | 0 |

No frame over 50 ms; the R-3 spike did not appear in these windows. Renderer backend not read.
