# WN-013 — Antarctica stays hidden; Focus cycle skips it; Focus Tax figure prints — Manual test cases

**Story**: `production/epics/world-network/story-013-antarctica-stays-hidden-focus-cycle-skips-it-focus-tax.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/wn-013/` | **Gate**: BLOCKING (qa-lead sign-off)
**Build under test**: commit 41febe7 (flat SVG World Network map; not the uncommitted globe)
**Scope**: QA plan `production/qa/qa-plan-sprint-002-2026-10-12.md` § Manual QA Checklist → WN-013
**Automated coverage**: Tax emission rule (who pays) is Story 007's unit tests. Here we check only that the figure prints and that Europe is not a paying sector.

## Common setup

- `npm run dev -- --strictPort`, http://localhost:4200, viewport 1280x720, fresh save (Main menu → NEW OPERATION; confirm erase if a save exists) → World Network → dismiss the orientation.
- Console handles. Seeding Intel via `setState` is acceptable for this UI check:
  ```js
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const { sectorCorp, OPEN_SECTORS } = await import('/src/game/atlas.ts')
  ```
- Antarctica's sector id is `an`.

---

## Test Case: WN-013-01 — Antarctica prints no numbers and Scan land is Unknown (intel 1)

**Preconditions**: Fresh New Operation. `useCampaignStore.getState().intelLevel === 1` (default).
**Steps**:
1. Read the Antarctica row in the left sector list.
2. Read the Scan map control key and Antarctica's land on the map.
3. Capture `wn-013-intel1-europe-1280x720.png` with Europe focused.
**Expected Result**: The row reads `ANTARCTICA` / `NO SURVEY DATA` with a lock. No Control %, Unrest %, Tax yield, or Garrison condition prints for it anywhere on the screen. Antarctica's land is shown under the key's `UNKNOWN` entry, not as a sector holder colour.
**Pass Criteria**: Zero numeric readouts attributed to Antarctica, and its Scan land is Unknown.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-013-02 — Focus never selects Antarctica (intel 1)

**Preconditions**: As WN-013-01. Europe focused.
**Steps**:
1. Press FOCUS NEXT SECTOR 8 times. After each press, record the focused panel title and `useWorldStore.getState().selected`.
2. Press FOCUS PREVIOUS SECTOR 8 times and record the same values.
3. Click the Antarctica row in the sector list. Click Antarctica's land on Scan.
4. Read `useWorldStore.getState().selected`.
**Expected Result**: The forward cycle visits only `eu, af, as, oc, na, sa` and wraps around. The backward cycle visits the same six. Clicking Antarctica leaves focus unchanged. `selected` is never `'an'`.
**Pass Criteria**: `selected === 'an'` is never observed in 16 steps and 2 clicks. The set of visited ids equals `OPEN_SECTORS`.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-013-03 — No sector verb is offered for Antarctica (intel 1)

**Preconditions**: As WN-013-02, after the Antarctica click attempts.
**Steps**:
1. Read the focused sector panel and its Stabilize / Lobby / Expedite actions.
2. Inspect the Antarctica row for any action button or hover menu.
**Expected Result**: The focused panel never renders Antarctica, so Stabilize, Lobby, and Expedite only ever target an open sector. The Antarctica row exposes no verb.
**Pass Criteria**: No Stabilize, Lobby, or Expedite control reachable for `an`.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-013-04 — Same Antarctica behaviour at intel 2 and above

**Preconditions**: Fresh New Operation, then `useCampaignStore.setState({ intelLevel: 2 })`. Repeat with `intelLevel: 3`.
**Steps**:
1. Repeat WN-013-01 through WN-013-03 at intel 2.
2. Capture `wn-013-intel2-europe-1280x720.png` with Europe focused.
3. Repeat steps 1–3 of WN-013-02 at intel 3.
**Expected Result**: Results are identical to intel 1: no numbers, Unknown land, `selected` never `'an'`, no verbs. The Event forecast unlocking at intel 2 (WN-012) has no effect on Antarctica.
**Pass Criteria**: Every WN-013-01..03 pass criterion holds at intel 2 and at intel 3.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-013-05 — Focus on opening Europe prints a Tax figure and Europe does not pay

**Preconditions**: Fresh New Operation, intel 1, Europe focused, no Influence spends. Confirm `sectorCorp('eu', useWorldStore.getState().owner) !== 'nexus'` and record its value (the prior run saw Helix).
**Steps**:
1. Read `TAX YIELD` in the focused panel.
2. Focus each open sector in turn. For each one, record its TAX YIELD figure and `sectorCorp(id, owner)`.
3. Pause the clock. Record the app store's `credits` (`(await import('/src/state/appStore.ts')).useAppStore.getState().credits`) and `useWorldStore.getState().nextTaxT`.
4. Resume at 8X until `t` passes the recorded `nextTaxT`, then pause. Record `credits` again.
**Expected Result**: Europe prints `TAX YIELD <n> CR / 24h` with a non-zero figure. The credits change at the tax tick equals the sum of the TAX YIELD figures of the Nexus-held open sectors only, and Europe's figure is not part of it. If no open sector is Nexus-held, the change is 0.
**Pass Criteria**: The Europe figure prints. The credits delta excludes Europe's yield. Note any Feed seizure that changed a holder during step 4. If one did, re-run.
**Actual Result**:
**Pass/Fail**:

## Test Case: WN-013-06 — No clipping at 1280x720

**Preconditions**: The captures from WN-013-01 and WN-013-04.
**Steps**:
1. Inspect the sector list (Antarctica row included), the focused panel (TAX YIELD, GARRISON CONDITION), and the Scan key.
**Expected Result**: All text is fully visible, with no ellipsis, overlap, or cut-off.
**Pass Criteria**: No truncated or overlapping text in either capture.
**Actual Result**:
**Pass/Fail**:
