# WN-012 — Event forecast gated on Intel level — Manual test cases

**Story**: `production/epics/world-network/story-012-event-forecast-gated-on-intel-level.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/wn-012/` | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: commit 41febe7 (flat SVG World Network map; not the uncommitted globe)
**Scope**: QA plan `production/qa/qa-plan-sprint-002-2026-10-12.md` § Manual QA Checklist → WN-012
**Automated coverage**: none for the panel (UI story). `src/game/forecast.test.ts` covers the formula; these cases only check that the panel prints what `eventForecast` returns.

## Common setup

- Run `npm run dev -- --strictPort`; open http://localhost:4200 at a 1280x720 viewport. Port 4200 must be free first.
- Path: Main menu → NEW OPERATION → World Network → dismiss the orientation (`Dismiss the orientation`).
- Seeding Intel is done in the DevTools console. This bypasses how Intel is earned (WN-011); it is acceptable for this UI check:
  ```js
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  useCampaignStore.setState({ intelLevel: N })
  ```
- Pause the strategic clock (`PAUSE STRATEGIC CLOCK`) before reading figures. Unrest moves while live, and the chances move with it.
- Compare reference (WN-012-03), run in the console against the same paused state:
  ```js
  const { eventForecast } = await import('/src/game/forecast.ts')
  const { OPEN_SECTORS } = await import('/src/game/atlas.ts')
  const w = useWorldStore.getState()
  eventForecast(OPEN_SECTORS.map((sector) => ({ sector, unrest: w.sectors[sector].unrest, crisis: w.crisis.includes(sector) })), w.selected)
  ```

---

## Test Case: WN-012-01 — Intel 1 hides the forecast

**Preconditions**: New Operation, World Network, orientation dismissed. `useCampaignStore.getState().intelLevel === 1` (the default; no seeding needed). Europe focused (default `selected: 'eu'`).
**Steps**:
1. Read the focused sector panel (right column) below the Stabilize / Lobby / Expedite actions.
2. Press FOCUS NEXT SECTOR once, then read the panel again.
3. Capture `wn-012-intel1-1280x720.png`.
**Expected Result**: The `EVENT FORECAST` row shows only `REQUIRES INTEL LVL 2`. No RIOT / BLKOUT / RAID / TRADE / SEIZE chips and no percentages appear, for either sector.
**Pass Criteria**: Zero `%` chance chips in the forecast row at intel 1 on both sectors read.
**Actual Result**:
**Pass/Fail**:

> Accepted deviation (story Completion Notes): a locked `REQUIRES INTEL LVL 2` row is shown in place of hiding the section. Pass if no chances print.

## Test Case: WN-012-02 — Intel 2 lists all five categories for the next 6 strategic hours

**Preconditions**: As WN-012-01, then `useCampaignStore.setState({ intelLevel: 2 })`. Clock paused. Europe focused.
**Steps**:
1. Read the `EVENT FORECAST` row.
2. Hover the row and read its tooltip.
3. Capture `wn-012-intel2-1280x720.png`.
**Expected Result**: Five chips print, in this order: RIOT, BLKOUT, RAID, TRADE, SEIZE, each with an integer `%`. The tooltip reads `EVENT FORECAST // CHANCE PER CATEGORY OVER THE NEXT 6 STRATEGIC HOURS`.
**Pass Criteria**: All five categories are present with a percentage, and the tooltip names a 6-strategic-hour window.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-012-03 — Printed chances equal `forecast.ts`

**Preconditions**: As WN-012-02 (intel 2, clock paused).
**Steps**:
1. Write down the five chips printed for Europe.
2. Run the compare reference from Common setup and record the returned `{ kind, chance }` array in the click-through note.
3. Press FOCUS NEXT SECTOR (Africa), keep the clock paused, and repeat steps 1–2.
4. Set `useCampaignStore.setState({ intelLevel: 3 })` and repeat step 1 for the same sector.
**Expected Result**: For each sector, each printed chance equals the `chance` that `eventForecast` returns for that kind. Intel 3 prints the same figures as intel 2. Do not copy the numbers into this plan or the story. They belong in the click-through note only.
**Pass Criteria**: 10/10 printed values (2 sectors x 5 kinds) match the function output exactly. Intel 3 matches intel 2.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-012-04 — No clipping at 1280x720

**Preconditions**: The captures from WN-012-01 and WN-012-02.
**Steps**:
1. Inspect the forecast row and the focused sector panel in both captures.
2. In the intel 2 state, focus each of the six open sectors in turn and check the forecast row.
**Expected Result**: Every chip label and percentage is fully visible. Nothing is cut off, wrapped over another element, or ellipsised. No horizontal scroll appears in the panel.
**Pass Criteria**: No truncated or overlapping text in any of the 6 sectors at intel 2, or in the locked row at intel 1.
**Actual Result**:
**Pass/Fail**:
