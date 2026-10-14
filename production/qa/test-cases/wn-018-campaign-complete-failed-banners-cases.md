# WN-018 — Campaign complete and failed banners, incl. pyrrhic win — Manual test cases

**Story**: `production/epics/world-network/story-018-campaign-complete-and-failed-banners-incl-pyrrhic-win.md`
**Story type**: Integration (secondary UI) | **Evidence output**: `production/qa/evidence/wn-018/` | **Gate**: BLOCKING (qa-lead for screenshots; lead-programmer for `src/state/campaignStore.test.ts`, `src/state/appStore.test.ts`)
**Build under test**: commit 41febe7 (flat SVG World Network map; not the uncommitted globe)
**Scope**: QA plan `production/qa/qa-plan-sprint-002-2026-10-12.md` § Manual QA Checklist → WN-018
**Covered by automated tests / prior evidence, not re-run here**: the flags are never both true, and the outcome DTO is read rather than the live roster (`campaignStore.test.ts`, `appStore.test.ts`). The pyrrhic Debrief (AC3) is an **IF-011 evidence regression only**: `src/ui/debriefFlags.test.ts` plus `production/qa/evidence/if-011/if-011-pyrrhic-win-1280x720.png`. WN-018-05 is a code-change check, not a recapture.

## Common setup

- `npm run dev -- --strictPort`, http://localhost:4200, viewport 1280x720. Fresh New Operation per fixture → World Network → dismiss the orientation.
- Flags are produced through `campaignStore.reportMission`, the same path the Debrief uses. **Never set `campaignWon` / `campaignFailed` by hand.** Setting Intel via `setState` is acceptable for this UI check. This bypasses Debrief and worldStore write-back. That is fine for banner and select checks, not for economy checks.
  ```js
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useAppStore } = await import('/src/state/appStore.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const out = (won, deadIds) => ({ applyKey: 1, won, kills: 0, casualties: deadIds.length, timeSec: 0, civiliansHit: 0,
    reward: 0, bonus: 0, deadIds, survivorHp: {}, quietReplay: false })
  ```

---

## Test Case: WN-018-01 — Three authored wins post the campaign-complete banner

**Preconditions**: Fresh New Operation. Seed:
```js
useCampaignStore.setState({ intelLevel: 3 })
const t = useWorldStore.getState().t
for (const id of ['m01', 'm02', 'm03']) useCampaignStore.getState().reportMission(id, out(true, []), t)
useCampaignStore.getState()  // expect contractsWon [m01,m02,m03], campaignWon true, campaignFailed false
```
**Steps**:
1. Read the banner above the World Network main area.
2. Capture `wn-018-complete-1280x720.png`.
**Expected Result**: A banner reads `CAMPAIGN COMPLETE` / `ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE` with `3 / 3` and a ◆ sigil. `campaignWon === true` and `campaignFailed === false`. No failed banner is shown.
**Pass Criteria**: The complete banner is present, the store flags match, and only one banner shows.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-018-02 — Authored contracts stay selectable after completion

**Preconditions**: The WN-018-01 state.
**Steps**:
1. Focus EUROPE (or the sector holding GLASS VEIL). Confirm its OPEN CONTRACTS row has no lock glyph and its `aria-label` starts `OPEN CONTRACT`.
2. Click GLASS VEIL. Read `useAppStore.getState().phase` and `.missionId`.
3. Return to World Network (back from Brief) and repeat steps 1–2 for HOLLOW CROWN (`m02`) and RUST HAVEN (`m03`), focusing their sectors.
**Expected Result**: Each click moves to Brief with `phase === 'brief'` and `missionId` set to that contract's id.
**Pass Criteria**: 3/3 authored contracts select, and none is a no-op.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-018-03 — Empty living roster on an incomplete campaign posts campaign-failed

**Preconditions**: Fresh New Operation. Seed a loss that kills the whole roster:
```js
const ids = useCampaignStore.getState().operatives.map((o) => o.id)
useCampaignStore.getState().reportMission('m01', out(false, ids), useWorldStore.getState().t)
useCampaignStore.getState()  // expect operatives.length 0, contractsWon [], campaignFailed true, campaignWon false
```
**Steps**:
1. Read the banner.
2. Capture `wn-018-failed-1280x720.png`.
**Expected Result**: The banner reads `CAMPAIGN FAILED` / `ROSTER EMPTY // NETWORK COMMAND SUSPENDED` with `0 / 3` and a ◆ sigil. No complete banner is shown.
**Pass Criteria**: The failed banner is present, the flags match, and only one banner shows.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-018-04 — Contract select is a no-op when failed; Focus, the clock, and Research still work

**Preconditions**: The WN-018-03 state.
**Steps**:
1. Click GLASS VEIL in OPEN CONTRACTS and its Scan marker. Read `phase` and `missionId`.
2. In the console run `useAppStore.getState().selectMission('m01')` and read `phase` / `missionId` again.
3. Press FOCUS NEXT SECTOR twice. Press PAUSE, then RESUME, then CLOCK SPEED 8X, and confirm `useWorldStore.getState().t` advances.
4. Open Research from the top nav, then return to World Network.
**Expected Result**: Every contract row shows a lock with `aria-label` containing `// LOCKED //`. After the clicks and the direct `selectMission`, `phase === 'world'` and `missionId === null`. Focus changes, Pause stops `t`, speed changes the advance, and the Research screen opens.
**Pass Criteria**: Contract select changes nothing in 3 attempts. Focus, the clock, and Research each respond.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-018-05 — Pyrrhic Debrief unchanged since IF-011 (regression check only)

**Preconditions**: None in-app. Evidence: `production/qa/evidence/if-011/if-011-pyrrhic-win-1280x720.png`, `src/ui/debriefFlags.test.ts`.
**Steps**:
1. Run `git log --oneline 96b9b05..41febe7 -- src/ui/Debrief*.tsx src/ui/debriefFlags.ts src/state/debrief.ts` (adjust to the actual Debrief file names) and record the output.
2. Run `npx vitest run src/ui/debriefFlags.test.ts` and record the result.
3. If step 1 lists any commit, escalate to qa-lead for an in-app recapture against IF-011 test cases (`production/qa/test-cases/if-011-pyrrhic-win-banner-cases.md`). Do not recapture under this story otherwise.
**Expected Result**: No Debrief code commits since 96b9b05, and `debriefFlags.test.ts` passes. The IF-011 capture still shows CAMPAIGN FAILED first and dominant, the full net payout, the note `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED`, and a Win grade. There is no second banner implementation (`rg -n "PYRRHIC" src` shows one source).
**Pass Criteria**: Empty diff, tests green, and a single pyrrhic banner source. Otherwise result is BLOCKED pending recapture.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-018-06 — No clipping; banners not color-only

**Preconditions**: The captures from WN-018-01 and WN-018-03.
**Steps**:
1. Inspect both banners at 1280x720 for cut-off text.
2. Confirm each banner states its meaning in text (`CAMPAIGN COMPLETE` / `CAMPAIGN FAILED`, subtitle, `n / 3`) and exposes `role="status"`. Optionally check a greyscale view of each capture.
**Expected Result**: Both banners are fully visible and readable without color. The text alone distinguishes complete from failed.
**Pass Criteria**: No truncation, and each state is identifiable from text with color removed.
**Actual Result**:
**Pass/Fail**:
