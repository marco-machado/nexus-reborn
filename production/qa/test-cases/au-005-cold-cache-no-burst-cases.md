# AU-005 manual test cases: cold-cache smoke, unavailable and late audio never burst

- **Story**: `production/epics/audio/story-005-unavailable-and-late-audio-never-burst.md` (AC1 audio unavailable, AC2 late decode and module load, Edge Cases)
- **Story type**: Integration. **Evidence**: `production/qa/evidence/team-qa-2026-10-19-s9/au-005/` (new script). **Gate**: ADVISORY for these cases. Per AC2, cold-cache play is "smoke coverage and console inspection as diagnostics, not as proof of cue admission/drop". The story's blocking proof is the automated evidence that `production/qa/evidence/au-005/README.md` names in `src/game/audio.test.ts`.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Run setup

1. `npm run dev -- --strictPort`. Confirm that `lsof -iTCP:4200 -sTCP:LISTEN` shows a listener. Start the server before the browser so that no HMR reconnect errors appear (the 2026-10-17 run logged some).
2. Write the new script `production/qa/evidence/team-qa-2026-10-19-s9/au-005/cold-cache.mjs`. It launches headless Chromium. Each case uses its own `browser.newContext({ viewport: { width: 1280, height: 720 } })`, a fresh non-persistent profile with an empty HTTP cache and empty storage. It reads `SWEEP_URL=http://localhost:4200/`.
3. The init script, installed with `addInitScript` before navigation, logs four kinds of timestamp in `performance.now()` ms:
   - `AudioBufferSourceNode.prototype.start`, patched to push one timestamp per call to `window.__starts`
   - `BaseAudioContext.prototype.decodeAudioData`, wrapped to push `{t0, t1, ok}` on resolve or reject to `window.__decodes`
   - a capture-phase `pointerdown` listener that pushes to `window.__clicks`
   - `page.on('response')` for `/src/ui/sound.ts`, `/src/game/audio.ts`, `/src/game/audioFreshness.ts` and `inspiration/audio/sfx/*.mp3`, recording the URL, status and arrival time
4. Optional, and must be labelled if used: CDP `Network.emulateNetworkConditions` with added latency, so that the first decodes finish after the rapid clicks.
5. Cold-cache check: every sfx `.mp3` response in the run returns status 200, not 304.
6. The script writes `cold-cache-output.txt` (all four logs, plus console and pageerror messages) and `NN-*.png` beside itself.
7. These cases use harness idle times (2,000 ms) and a 500 ms control window. They are not the runtime freshness window, which stays in the audio README and is not copied here.
8. After the last case, stop the dev server and confirm that port 4200 has no listener.

---

## AU-005-TC-01: No burst of source starts when the first clip decodes finish

**ACs**: AC2 (clip decode, diagnostic)
**Preconditions**: A fresh context, Menu loaded, the decodes of the first clips not yet resolved.
**Steps**:
1. Within 1 s of Menu rendering, click SETTINGS and close it 5 times in a row (10 clicks), as fast as the harness allows.
2. Make no input for 2,000 ms.
3. Read `__clicks`, `__decodes` and `__starts`. Mark the time of the last decode resolve (T_dec).
4. Control: make one fresh click on SETTINGS. Read `__starts` 500 ms later.
5. Capture `01-menu-after-clicks-1280x720.png`.

**Expected Result**: At least one decode resolves after the first click. If not, record "inconclusive: decode finished before input" rather than pass. No start falls in the idle interval of step 2. In particular, no group of 2 or more starts falls within 50 ms of any decode resolve. After the control click, at least 1 start appears, which proves the patch sees the UI path.
**Pass Criteria**: 0 starts in the idle interval and at least 1 start after the control click. If the control click shows 0 starts, mark the case BLOCKED: the instrumentation cannot see the UI cue path.
**Actual Result**:
**Pass/Fail**:

## AU-005-TC-02: A stale click is not replayed when the UI sound module becomes usable

**ACs**: AC2 (module load, diagnostic; recorded separately from TC-01)
**Preconditions**: A new fresh context. The `/src/ui/sound.ts` response has not arrived when the first click lands. Use the optional latency from Run setup 4 if needed, and label it.
**Steps**:
1. Click SETTINGS before the `sound.ts` response arrives. Record that click's time and the arrival time of the module response (T_mod).
2. Make no input for 2,000 ms after T_mod.
3. Read `__starts` and record them separately from the clip-decode evidence.

**Expected Result**: If the first click landed after T_mod, record "inconclusive: module loaded before input". Otherwise, there are 0 starts between T_mod and T_mod + 2,000 ms (AC2: "it must not be replayed as a fresh click").
**Pass Criteria**: 0 starts in the window after the module loads.
**Actual Result**:
**Pass/Fail**:

## AU-005-TC-03: On a cold cache, play is never blocked into a mission and through firing, with no console errors

**ACs**: AC1, AC2 (smoke)
**Preconditions**: The TC-01 context, still fresh with no save. Fixture: Glass Veil (`m01`) on a New Operation (`docs/mission-playbook.md`, "Glass Veil (m01, SEVERE)").
**Steps**:
1. On Menu, activate NEW OPERATION (confirming if asked). On World Network, dismiss the orientation (UNDERSTOOD).
2. Select Glass Veil, then Brief, then Accept Contract, then Assembly, then DEPLOY TEAM.
3. As the mission loads, click the HUD 5 times in a row. Then make no input for 2,000 ms and read `__starts`.
4. Fire: select an operative and right-click a hostile. If no hostile is on screen, use `w.orderAttack([id], targetId)` (playbook, "Driving it from the browser") and record which method was used. Run for 2 s.
5. Capture `03-mission-fire-1280x720.png`. Read the console and pageerror logs.

**Expected Result**: The phase reaches `mission` and the sim time advances. The HUD and the camera respond. There are 0 starts in the idle interval of step 3. At least 1 start appears after firing (a fresh combat cue; diagnostic). There are 0 console errors and 0 page errors.
**Pass Criteria**: The mission is reached and runs, there are 0 idle-interval starts, and there are 0 errors.
**Actual Result**:
**Pass/Fail**:

## AU-005-TC-04: With audio unavailable, play is not blocked

**ACs**: AC1, Edge Cases (unavailable)
**Preconditions**: A new fresh context. The init script also sets `window.AudioContext` and `window.webkitAudioContext` to `undefined` before any app code runs.
**Steps**:
1. Load Menu. Open and close Settings. Move one volume slider.
2. Run TC-03 steps 1 to 4.
3. Capture `04-audio-unavailable-mission-1280x720.png`. Read `__starts`, the console log and the pageerror log.

**Expected Result**: Every screen opens and the mission runs (AC1: "play is not blocked"). There are 0 starts. There are 0 page errors and 0 console errors. Copy any audio-unavailable warning verbatim into Actual.
**Pass Criteria**: The mission is reached and runs, there are 0 page errors and 0 console errors, and there are 0 starts.
**Actual Result**:
**Pass/Fail**:

## AU-005-TC-05: One-shots requested while the context is not running are dropped, not queued (diagnostic)

**ACs**: Edge Cases (context not running, then available)
**Preconditions**: A new fresh context. The init script wraps the `AudioContext` constructor so that `resume()` is deferred until the harness calls `window.__allowResume()`. Label this as an instrumented fixture.
**Steps**:
1. Load Menu. Click SETTINGS and close it 3 times while the context is suspended (record `ctx.state`).
2. Call `__allowResume()`. Make no input for 2,000 ms.
3. Read `__starts`.

**Expected Result**: There are 0 starts after resume with no new input (Edge Cases: "those one-shots are dropped, not queued, and none plays after it becomes available").
**Pass Criteria**: 0 starts in the 2,000 ms after resume.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

None. A failure in TC-01, TC-02 or TC-05 is diagnostic. Report it to qa-lead together with the `src/game/audio.test.ts` result, and do not treat it alone as proof of a defect.
