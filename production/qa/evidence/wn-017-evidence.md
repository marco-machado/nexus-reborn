# Test Evidence: WN-017 Opening desk and post-win Scan

> **Story**: `production/epics/world-network/story-017-opening-desk-and-post-win-scan.md`
> **Story Type**: Integration (secondary: UI)
> **Date**: 2026-10-13
> **Tester**: Claude (automated click-through via /team-qa, autonomous mode)
> **Build / Commit**: 41febe7

---

## What Was Tested

The opening desk on a fresh New Operation with no contract selected. Then a real first clean, non-quiet Glass Veil win from Influence 0, read back on World Network after Debrief write-back and the ETA.

**Acceptance criteria covered**: AC-1, AC-3 (manual). AC-2 (the t0 Feed append at an instrumented boundary) is covered by `src/state/worldStore.test.ts` in the green 770/770 suite at 41febe7. The story says this is not a player-visible screen.

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | New Operation, first minute, no contract: Focus changes among six open sectors; four numbers print; Pause/speed change whether `t` advances; contract select is not the only enabled verb | PASS | Focus Next ×7 visits af → as → oc → na → sa → eu → af. The panel prints CONTROL 62%, UNREST 18%, TAX YIELD 2,468 CR / 24H, GARRISON CONDITION SECURE. Over 2 s: `t` +0 paused, +120 at 1X, +942 at 8X. The enabled controls include Focus prev/next, sector rows, resume/speeds, Feed items, World Network, Research and Assembly. |
| AC-2 | Non-quiet win at frozen t0: Feed event appended at t0 and awards follow the outcome rules | PASS (automated) | Covered by `worldStore.test.ts`. Scenario A also observed the award at the instant the ETA starts: Influence 0 → 8 with `t` still the launch `t`. |
| AC-3 | First clean non-quiet win from Influence 0: after Debrief write-back and the ETA, the header reads Influence 8 and Scan is the post-ETA board | PASS | Glass Veil won on the first attempt: `won: true, civiliansHit: 0, quietReplay: false`. Back on World Network the header reads `INFLUENCE 8 PTS`. `t` moved from 7,363 at launch to 180,163, which is the 2-day ETA. The board shows the post-ETA state: 2087.05.16 and a South America CRISIS. |

No clipping at 1280×720.

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `wn-017/wn-017-opening-europe-paused-41febe7-1280x720.png` | Opening desk, Europe focused, paused, four numbers | AC-1 |
| 2 | `wn-017/wn-017-post-win-influence-8-41febe7-1280x720.png` | World Network after the clean win and ETA, header INFLUENCE 8 PTS | AC-3 |

Raw data: `sprint-002-qa-2026-10-13/ui.json` (`wn017_opening`) and `scenario-a.json` (`p4-glass-veil-attempt-1`).

---

## Test Conditions

- **Platform / hardware**: macOS (Darwin 25.5), Playwright driving headed Chrome for Testing 1247 (real GPU), viewport 1280×720, dev server `vite --strictPort --port 4201` from a clean worktree of `41febe7`.
- **Harness assists** (mission sim only, never the strategic stores): missions played by a bot through the sim order API; "god" mode keeps the squad at full health for wins; for losses, agents at 1 HP are marched at the garrison; mission sim ticks 3× faster. Same assists as smoke 2026-10-13.
- **Console errors**: none, apart from `favicon.ico` 404s.

- **Game state at start**: New Operation on a cleared save. Nothing was seeded for these checks.

---

## Observations

*No significant observations.*

---

## Sign-Off

Integration story with UI surfaces. Its integration tests passed in the 770/770 run at 41febe7. The screenshots above are retained.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| qa-lead (screenshots) | | | [ ] |
| lead-programmer (integration tests) | | | [ ] |

