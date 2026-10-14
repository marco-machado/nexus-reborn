# Test Evidence: WN-018 Campaign complete and failed banners, including a pyrrhic win

> **Story**: `production/epics/world-network/story-018-campaign-complete-and-failed-banners-incl-pyrrhic-win.md`
> **Story Type**: Integration (secondary: UI banners)
> **Date**: 2026-10-13
> **Tester**: Claude (automated click-through via /team-qa, autonomous mode)
> **Build / Commit**: 41febe7

---

## What Was Tested

Both campaign endings, reached through played missions:
- **Complete (scenario A):** Glass Veil, a generated win to climb to Intel 2, then Hollow Crown and Rust Haven, all won.
- **Failed (scenario B):** three lost missions empty the living roster on an incomplete campaign. The failed state was then reloaded.

The pyrrhic Debrief clause was checked as a regression against IF-011.

**Acceptance criteria covered**: AC-1, AC-2 (manual), AC-3 (regression)

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | Glass Veil, Hollow Crown, Rust Haven all won: campaign-complete banner posted and all three still selectable | PASS | Banner reads `CAMPAIGN COMPLETE // ALL THREE AUTHORED CONTRACTS FULFILLED // WORLD NETWORK REMAINS ACTIVE 3 / 3`. Flags: won true, failed false. Selecting each contract opens the Brief: Glass Veil `m01`, Hollow Crown `m02`, Rust Haven `m03`. |
| AC-2 | Campaign incomplete and living roster 0 after debrief: campaign-failed banner posted and contract select is a no-op | PASS | Banner reads `CAMPAIGN FAILED // ROSTER EMPTY // NETWORK COMMAND SUSPENDED 0 / 3`. Flags: failed true, won false, living 0. Selecting Glass Veil leaves phase `world` and `missionId` null. Focus still moves, the clock still advances, and Research still opens. After a reload, the stored flags and the banner are unchanged. |
| AC-3 | Pyrrhic win: CAMPAIGN FAILED takes precedence, the invoice prints the full net payout with the `PYRRHIC — SQUAD LOST // CAMPAIGN FAILED` note, and the mission grades a Win | PASS (regression) | No commit touched `src/ui/index.tsx` or `src/ui/debriefFlags.ts` between 96b9b05 (IF-011) and 41febe7. The note has a single source, `src/ui/index.tsx:1615`. `debriefFlags.test.ts` is green. The IF-011 screenshot stands: `if-011/if-011-pyrrhic-win-1280x720.png`. |

The banners are not color-only: each has text, a ◆ glyph and an n / 3 count. No clipping at 1280×720.

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `wn-018/wn-018-complete-41febe7-1280x720.png` | Campaign-complete banner, 3 / 3 | AC-1 |
| 2 | `wn-018/wn-018-failed-41febe7-1280x720.png` | Campaign-failed banner, 0 / 3, roster 0 / 8 | AC-2 |
| 3 | `if-011/if-011-pyrrhic-win-1280x720.png` (existing) | Pyrrhic Debrief | AC-3 |

Raw data: `sprint-002-qa-2026-10-13/scenario-a.json` (`p7-campaign-complete`) and `scenario-b.json` (`p7-campaign-failed`, `p9-hydrate-failed`). Debriefs for the three losses: `p7-fail-debrief-{1,2,3}-1280x720.png`.

---

## Test Conditions

- **Platform / hardware**: macOS (Darwin 25.5), Playwright driving headed Chrome for Testing 1247 (real GPU), viewport 1280×720, dev server `vite --strictPort --port 4201` from a clean worktree of `41febe7`.
- **Harness assists** (mission sim only, never the strategic stores): missions played by a bot through the sim order API; "god" mode keeps the squad at full health for wins; for losses, agents at 1 HP are marched at the garrison; mission sim ticks 3× faster. Same assists as smoke 2026-10-13.
- **Console errors**: none, apart from `favicon.ico` 404s.

- **Game state at start**: New Operation on a cleared save. Scenario B seeds Intel 2 once, only for its path-8 check, before the losses.

---

## Observations

- In the failed state, Glass Veil's row reads `GLASS VEIL // LOCKED // REQUIRES INTEL LVL 1`, even though the director already has Intel 1. The select no-op is correct. The copy is the open WN-018 copy question in `production/session-state/active.md`; no current criterion makes it a defect.

---

## Sign-Off

Integration story with UI surfaces. Its integration tests passed in the 770/770 run at 41febe7. The screenshots above are retained.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| qa-lead (screenshots) | | | [ ] |
| lead-programmer (integration tests) | | | [ ] |

