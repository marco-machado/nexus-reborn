# WN-017 — Opening desk and post-win Scan — Manual test cases

**Story**: `production/epics/world-network/story-017-opening-desk-and-post-win-scan.md`
**Story type**: Integration (secondary UI) | **Evidence output**: `production/qa/evidence/wn-017/` | **Gate**: BLOCKING (qa-lead for screenshots; lead-programmer for `src/state/worldStore.test.ts`)
**Build under test**: commit 41febe7 (flat SVG World Network map; not the uncommitted globe)
**Scope**: QA plan `production/qa/qa-plan-sprint-002-2026-10-12.md` § Manual QA Checklist → WN-017
**Covered by automated tests, not here**: AC2. A non-quiet win at frozen `t0` appends the mission-result Feed event at `t0` before ETA advancement, and awards and sector effects follow the outcome rules. The story states this is not a player-visible screen. Evidence is the "Debrief write-back at frozen t0" test and the WN-017 describe in `src/state/worldStore.test.ts`. The apply reading the outcome DTO is covered by the same tests.
**Out of scope**: the first-visit overlay (Core Rule 13) and the arrival-failure open question. Record no finding on either.

## Common setup

- `npm run dev -- --strictPort`, http://localhost:4200, viewport 1280x720. Use a fresh New Operation (confirm erase if a save exists).
- Console handle (read-only in these cases; no store is written):
  ```js
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  ```

---

## Test Case: WN-017-01 — Focus moves among the six open sectors with no contract selected

**Preconditions**: Fresh New Operation, World Network, orientation dismissed, within the first real minute. No contract clicked (`(await import('/src/state/appStore.ts')).useAppStore.getState().missionId === null`).
**Steps**:
1. Press FOCUS NEXT SECTOR 6 times, recording the focused panel title each time.
2. Click one sector row in the left list (for example, ASIA).
**Expected Result**: Focus cycles EUROPE → AFRICA → ASIA → OCEANIA → NORTH AMERICA → SOUTH AMERICA → EUROPE. A row click focuses that sector. `missionId` stays `null`.
**Pass Criteria**: All six open sectors are reachable with no contract selected, and Antarctica is never focused.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-017-02 — Sector readout prints four numbers

**Preconditions**: As WN-017-01.
**Steps**:
1. For each focused sector, read the panel. Capture `wn-017-02-opening-focus-1280x720.png`.
**Expected Result**: The panel prints CONTROL `n%`, UNREST `n%`, TAX YIELD `n CR / 24h`, and GARRISON CONDITION (SECURE / STRAINED / other label).
**Pass Criteria**: All four values are present for all six sectors.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-017-03 — Pause stops `t`; speed changes the advance

**Preconditions**: As WN-017-01, clock live at the default speed.
**Steps**:
1. Read the header clock and `useWorldStore.getState().t`. Wait 2 s and read them again.
2. Press PAUSE STRATEGIC CLOCK. Read `t`, wait 2 s, and read it again. Capture `wn-017-03-opening-paused-1280x720.png`.
3. Press RESUME STRATEGIC CLOCK, then CLOCK SPEED 1X. Measure the change in `t` over 2 s.
4. Press CLOCK SPEED 8X and measure the change in `t` over 2 s.
**Expected Result**: `t` advances while live. While paused, `t` is unchanged and the speed readout shows `PAUSED`. After resume, `t` advances again. The 8X change is about 8 times the 1X change (`TIME_SCALE` 60 world s per real s at 1X).
**Pass Criteria**: Paused delta is 0, resumed delta is > 0, and the 8X delta is more than 1X delta x 6 (tolerance for frame timing).
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-017-04 — Contract select is not the only enabled verb

**Preconditions**: As WN-017-01, no contract selected.
**Steps**:
1. Try each control in turn: FOCUS PREVIOUS / NEXT, the sector rows, Stabilize / Lobby / Expedite (enabled or a stated refusal reason at Influence 0), PAUSE, the four CLOCK SPEED buttons, TIMELINE REVIEW, the Feed entries, MARK EVENTS READ, and the top nav.
**Expected Result**: Focus, the clock controls, timeline, Feed, and nav respond with no contract selected. BRIEF stays locked until a contract is selected.
**Pass Criteria**: At least Focus, Pause, and Speed are enabled and act while `missionId === null`.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-017-05 — First clean non-quiet win from Influence 0 shows Influence 8 on the post-ETA live board

**Preconditions**: Fresh New Operation. `useWorldStore.getState().influence === 0`. No Influence spend at any point in this case. Glass Veil (`m01`) has not been won before, so this is not a quiet replay. This case needs a **real played win**. Do not seed Influence (the earlier seeded `wn-017-04` capture was superseded for this reason). Play guide: `docs/mission-playbook.md`.
**Steps**:
1. On World Network, record `influence` (0) and `t`. Capture the header.
2. Select GLASS VEIL → Brief → Team/Assembly → Mission. Win with **0 civilians hit**.
3. On Debrief, confirm CONTRACT FULFILLED, Collateral 0, and the Contract ETA line. Record the ETA days.
4. Continue to World Network. Read the header INFLUENCE immediately, before interacting. Then pause the clock.
5. Run `const w = useWorldStore.getState(); ({ influence: w.influence, t: w.t, review: w.review, paused: w.paused })`.
6. Capture the World Network at 1280x720 (`wn-017-05-post-win-influence-8-1280x720.png`).
**Expected Result**: The header reads `INFLUENCE 8 PTS` (6 win + 2 clean), and the Influence panel reads 8. `t` is at least the pre-mission `t` + ETA days x 86400 (the board is post-ETA). `review === null` and the clock reads LIVE, so this is the live board and not a timeline review.
**Pass Criteria**: `influence === 8`, the header shows 8, `t` is past the ETA jump, and `review === null`.
**Actual Result**:
**Pass/Fail**:

> Known observation (GDD accepts; not a defect): after a 2-day ETA catch-up, the win's Feed entry can be evicted by `MAX_EVENTS = 40`. The post-win criterion does not require Feed retention.

## Test Case: WN-017-06 — No clipping at 1280x720

**Preconditions**: The captures from WN-017-02, WN-017-03, and WN-017-05.
**Steps**:
1. Inspect the header (Influence, Credits, clock), the sector panel, the clock controls, and OPEN CONTRACTS.
**Expected Result**: All text is fully visible, with no overlap or ellipsis. Captures are 1280x720 (the earlier in-app 800x450 JPEGs do not satisfy this).
**Pass Criteria**: No truncated or overlapping text, and every capture is 1280x720.
**Actual Result**:
**Pass/Fail**:
