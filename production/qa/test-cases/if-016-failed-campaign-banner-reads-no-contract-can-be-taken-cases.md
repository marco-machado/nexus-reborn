# IF-016 — Failed-campaign banner reads ROSTER EMPTY // NO CONTRACT CAN BE TAKEN — Manual test cases

**Story**: `production/epics/interface/story-016-failed-campaign-banner-reads-no-contract-can-be-taken.md`
**Story type**: UI | **Evidence output**: `production/qa/evidence/if-016/` (retained 1280x720 PNG per state + click-through `README.md`); the R1 refresh writes to `production/qa/evidence/sprint-011/` | **Gate**: BLOCKING
**Build under test**: HEAD `131a5c1`
**Sources**: story `## Acceptance Criteria` and `## QA Test Cases`; QA plan `production/qa/qa-plan-sprint-011-2026-10-23.md` § Manual QA Checklist → IF-016 (line 76) and smoke item 5; QA strategy `production/qa/qa-strategy-sprint-011-2026-10-24.md` § 6 (IF-016 row: R1, status E, refresh via R1) and addendum H9.

## AC map

| AC | Text (short) | Cases |
|---|---|---|
| AC-1 | Failed campaign: secondary line exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`; `NETWORK COMMAND SUSPENDED` nowhere in `src/`; headline and `n / 3` count unchanged (QA Test Cases pass condition) | IF-016-01, -02, -03, -04 |
| AC-2 (guard) | Completed campaign: `CAMPAIGN COMPLETE` banner, its secondary line and `n / 3` count unchanged | IF-016-05, -06 |
| Layout guard (Control Manifest / ADR-0017, not a story AC) | Banner at 1280x720 without clipping or truncation | IF-016-07 |

Per the story's QA Test Cases, AC-2 is recorded separately from AC-1 in the evidence README.

## Common setup

- `npm run dev -- --strictPort` on http://localhost:4200. Headless `npx playwright-cli` / Chrome for Testing, viewport exactly 1280x720. Never the user's Chrome.
- **R1 probe cases**: `PROBE_URL=http://localhost:4200/ node production/qa/evidence/sprint-011/probe.mjs`. Read the named line in the fresh `probe-output.txt`. The probe's fixtures:
  - `failed`: `STATES.opening` (fresh New Operation, orientation card dismissed, clock paused), then `useCampaignStore.setState({ campaignFailed: true })`. **The roster is not emptied.** It sets the flag directly.
  - complete: `enter('opening')`, then `useCampaignStore.setState({ campaignWon: true, contractsWon: ['m01', 'm02', 'm03'] })`. Also sets the flag directly.
- **Hand-walk cases** that need the real failure / completion path drive `campaignStore.reportMission`, the path the Debrief uses (same pattern as `production/qa/test-cases/wn-018-campaign-complete-failed-banners-cases.md`). Do not set `campaignWon` / `campaignFailed` by hand in those cases:
  ```js
  const { useCampaignStore } = await import('/src/state/campaignStore.ts')
  const { useWorldStore } = await import('/src/state/worldStore.ts')
  const out = (won, deadIds) => ({ applyKey: 1, won, kills: 0, casualties: deadIds.length, timeSec: 0,
    civiliansHit: 0, reward: 0, bonus: 0, collateral: 0, deadIds, survivorHp: {}, quietReplay: false })
  const t = () => useWorldStore.getState().t
  const allIds = () => useCampaignStore.getState().operatives.map((o) => o.id)
  ```
- Stop the dev server after the session. Confirm nothing listens on port 4200 (`lsof -iTCP:4200 -sTCP:LISTEN` returns nothing).

---

## Test Case: IF-016-01 — Failed banner secondary line reads exactly the new copy

**AC covered**: AC-1
**Coverage**: Covered by R1 probe check: `IF-016 failed banner line` (fixture `failed`; capture `if-016-017-failed.png`)
**Preconditions**: Dev server on 4200 at `131a5c1`. Probe fixture `failed` applied (fresh New Operation, card dismissed, paused, `campaignFailed: true`).
**Steps**:
1. Run the R1 probe.
2. In `probe-output.txt`, find the line starting `PASS IF-016 failed banner line` or `FAIL IF-016 failed banner line`.
3. Read the JSON detail after `//` (the `textContent` of `.wm-campaign-fail i`).
4. Open `if-016-017-failed.png` and read the banner secondary line by eye.
**Expected Result**: The line reads `PASS IF-016 failed banner line // "ROSTER EMPTY // NO CONTRACT CAN BE TAKEN"`. The screenshot shows the `CAMPAIGN FAILED` banner with that secondary line.
**Pass Criteria**: The probe line is PASS, and the detail string equals exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN` (case, spacing and both slashes match).
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-02 — The old string appears nowhere in `src/`

**AC covered**: AC-1
**Coverage**: Hand-walk (one command; the probe does not run it. The evidence README records it, per the QA plan line 19)
**Preconditions**: Working tree at `131a5c1`, no uncommitted changes under `src/` (`git status --porcelain src` returns nothing).
**Steps**:
1. Run `git status --porcelain src`.
2. Run `rg -n "NETWORK COMMAND SUSPENDED" src; echo "exit $?"`.
3. Run `rg -n -i "network command suspended" src; echo "exit $?"` (case-insensitive variant).
**Expected Result**: Step 1 prints nothing. Steps 2 and 3 print no match lines and `exit 1` (no match).
**Pass Criteria**: Both `rg` runs print zero matches and exit 1. Any match, or exit 2 (error), fails.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-03 — Failed banner headline, count, status role and sigil unchanged

**AC covered**: AC-1 (QA Test Cases pass condition: "the headline and the `n / 3` count are unchanged"); also reads `role="status"` (strategy addendum H9)
**Coverage**: Hand-walk (the probe reads only the `<i>` line in the failed state; it does not read `<b>`, `<strong>`, `role` or the sigil)
**Preconditions**: Probe fixture `failed` reproduced in a playwright-cli session at 1280x720 (fresh New Operation, dismiss the orientation card, pause, then `useCampaignStore.setState({ campaignFailed: true })`).
**Steps**:
1. Evaluate:
   ```js
   const el = document.querySelector('.wm-campaign-fail')
   ;({ count: document.querySelectorAll('.wm-campaign-fail').length,
      win: document.querySelectorAll('.wm-campaign-win').length,
      role: el?.getAttribute('role'), b: el?.querySelector('b')?.textContent,
      i: el?.querySelector('i')?.textContent, n: el?.querySelector('strong')?.textContent,
      sigil: el?.querySelector('.wm-campaign-sigil')?.getAttribute('aria-hidden'),
      sigilText: el?.querySelector('.wm-campaign-sigil')?.textContent })
   ```
2. Run `git show 05c7bd7 -- src/ui/WorldMap.tsx` and read the hunk that touches the failed banner.
3. Capture `production/qa/evidence/if-016/if-016-failed-1280x720.png`.
**Expected Result**: `count: 1`, `win: 0`, `role: "status"`, `b: "CAMPAIGN FAILED"`, `i: "ROSTER EMPTY // NO CONTRACT CAN BE TAKEN"`, `n: "0 / 3"`, `sigil: "true"`, `sigilText: "◆"`. In the 05c7bd7 diff, the only changed line in the failed-banner block is the `<i>` line (`- ... NETWORK COMMAND SUSPENDED` / `+ ... NO CONTRACT CAN BE TAKEN`); the `<b>`, `<strong>`, `role` and sigil lines are context lines.
**Pass Criteria**: Every evaluated value equals the expected value, and the diff changes no failed-banner line other than the `<i>` line.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-04 — Failure reached through the real path (roster emptied, campaign incomplete)

**AC covered**: AC-1 (the GIVEN exactly: empty living roster, campaign incomplete)
**Coverage**: Hand-walk (the probe's `failed` fixture sets `campaignFailed` by hand with a full roster, so it does not reproduce the GIVEN)
**Preconditions**: Fresh New Operation, World Network open, orientation card dismissed, clock paused. Helpers from Common setup loaded.
**Steps**:
1. Variant A, no wins: `useCampaignStore.getState().reportMission('m01', out(false, allIds()), t())`.
2. Evaluate `const s = useCampaignStore.getState(); ({ ops: s.operatives.length, won: s.contractsWon, failed: s.campaignFailed, complete: s.campaignWon })`.
3. Read the banner with the step 1 evaluation of IF-016-03.
4. Capture `production/qa/evidence/if-016/if-016-failed-real-path-1280x720.png`.
5. Variant B, one win then a wipe: fresh New Operation, dismiss the card, pause; `reportMission('m01', out(true, []), t())`, then `reportMission('m02', out(false, allIds()), t())`. Repeat steps 2-3.
**Expected Result**: Both variants: `ops: 0`, `failed: true`, `complete: false`; variant A `won: []`, variant B `won: ['m01']`. One `.wm-campaign-fail` banner with `role="status"`, `b` `CAMPAIGN FAILED`, `i` exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`; no `.wm-campaign-win`. Count `0 / 3` in both variants (unchanged from the pre-story markup, which hardcodes `0`).
**Pass Criteria**: In both variants the store values match and the secondary line equals exactly `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`. Record the variant B count as observed. If it reads `0 / 3`, IF-016 passes (count unchanged), and the gap against the UX spec's `n / 3` (`design/ux/world-network.md` line 157) goes to qa-lead as an observation, not an IF-016 failure.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-05 — Completed campaign banner unchanged

**AC covered**: AC-2 (guard)
**Coverage**: Covered by R1 probe check: `IF-016 complete banner unchanged` (fixture: `opening` + `campaignWon: true, contractsWon: ['m01','m02','m03']`; capture `if-016-complete.png`)
**Preconditions**: Dev server on 4200 at `131a5c1`. Probe complete fixture applied.
**Steps**:
1. Run the R1 probe (same run as IF-016-01).
2. In `probe-output.txt`, find the line for `IF-016 complete banner unchanged`.
3. Read the JSON detail (`b`, `i`, `n` from `.wm-campaign-win`).
4. Open `if-016-complete.png` and read the banner by eye.
**Expected Result**: `PASS IF-016 complete banner unchanged // {"b":"CAMPAIGN COMPLETE","i":"ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE","n":"3 / 3"}`. The screenshot shows that banner and no failed banner.
**Pass Criteria**: The probe line is PASS, and the three detail values match exactly.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-06 — Completed campaign reached through the real path; banner markup unchanged

**AC covered**: AC-2 (guard)
**Coverage**: Hand-walk (the probe sets `campaignWon` by hand, and it does not read `role`, the sigil or the diff)
**Preconditions**: Fresh New Operation, World Network open, orientation card dismissed, clock paused. Helpers loaded.
**Steps**:
1. `for (const id of ['m01', 'm02', 'm03']) useCampaignStore.getState().reportMission(id, out(true, []), t())`.
2. Evaluate `const s = useCampaignStore.getState(); ({ ops: s.operatives.length, won: s.contractsWon, failed: s.campaignFailed, complete: s.campaignWon })`.
3. Evaluate the IF-016-03 step 1 snippet with `.wm-campaign-win` in place of `.wm-campaign-fail` (and `fail` count in place of `win`).
4. In `git show 05c7bd7 -- src/ui/WorldMap.tsx`, confirm that no `+`/`-` line falls inside the `banner === 'complete'` block.
5. Capture `production/qa/evidence/if-016/if-016-complete-1280x720.png`.
**Expected Result**: `ops` > 0, `won: ['m01','m02','m03']`, `failed: false`, `complete: true`. One `.wm-campaign-win`, no `.wm-campaign-fail`; `role: "status"`, `b: "CAMPAIGN COMPLETE"`, `i: "ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE"`, `n: "3 / 3"`, sigil `aria-hidden="true"`. The 05c7bd7 diff does not change the complete-banner block.
**Pass Criteria**: All values match, and the diff has no changed line in the complete-banner block.
**Actual Result**:
**Pass/Fail**:

## Test Case: IF-016-07 — Failed banner fits at 1280x720 at every text scale

**AC covered**: none directly. This is the layout guard from the story's Control Manifest rules (ADR-0017: Screens work at 1280x720 without clipping or truncation). It supports AC-1, because the line must be readable in full.
**Coverage**: Partly covered by R1 probe checks: `IF-026 failed: every text run >= 10 px` and `IF-027 failed: every text run >= 4.5:1 as rendered` (failed state, 100% only). Clip and truncation at four scales is a Hand-walk: the probe's clip sweep (`IF-026 world network scale N: nothing clips`) runs on the `opening` state, which has no banner.
**Preconditions**: Probe fixture `failed` reproduced in a playwright-cli session at 1280x720. The probe's `window.__probe` helpers installed (or the same checks by hand: `scrollWidth > clientWidth`, `text-overflow: ellipsis`).
**Steps**:
1. Read the two R1 lines named above for the `failed` state.
2. For each text scale 90, 100, 110, 125 (set the same way as the probe's `setScale`): evaluate `window.__probe.clipped('.wm-campaign-fail')`.
3. At each scale, compare the `.wm-campaign-fail i` box against the `.wm-campaign-fail` box (`getBoundingClientRect`): the line's right edge must be inside the banner, and it must not overlap the `<strong>` count box.
4. Capture `production/qa/evidence/if-016/if-016-failed-scale-<N>-1280x720.png` per scale.
**Expected Result**: Both R1 lines PASS. At every scale `clipped` returns `[]`, the line's box is inside the banner, it does not overlap the count, and the full string `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN` is visible in the capture with no ellipsis.
**Pass Criteria**: Two R1 PASS lines, and zero clip, truncation or overlap entries at all four scales.
**Actual Result**:
**Pass/Fail**:

---

## Evidence README entries (for `production/qa/evidence/if-016/README.md`)

Record AC-1 (IF-016-01 to -04) and AC-2 (IF-016-05, -06) under separate headings. Record the IF-016-02 `rg` output verbatim, and the variant B count observed in IF-016-04.
