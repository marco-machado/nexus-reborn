# Test Evidence: WN-012 Event forecast gated on Intel level

> **Story**: `production/epics/world-network/story-012-event-forecast-gated-on-intel-level.md`
> **Story Type**: UI
> **Date**: 2026-10-13
> **Tester**: Claude (automated click-through via /team-qa, autonomous mode)
> **Build / Commit**: 41febe7

---

## What Was Tested

The focused sector panel's Event forecast at Intel 1, 2 and 3 with Europe focused. The printed chances were compared against `eventForecast()` from `src/game/forecast.ts`, called in the page on the same live state.

**Acceptance criteria covered**: AC-1, AC-2

---

## Acceptance Criteria Results

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | GIVEN intel 1, the focused sector panel does not show Event forecast | PASS | The panel shows only `EVENT FORECAST // REQUIRES INTEL LVL 2`. No chances print. |
| AC-2 | GIVEN intel 2+, Event forecast lists riot, blackout, raid, trade and seizure chances for the next 6 strategic hours, using the generator's weights | PASS | At intel 2 and 3 the panel reads RIOT 51%, BLKOUT 32%, RAID 41%, TRADE 19%, SEIZE 20%. That is identical to `eventForecast(...,'eu')`. The panel title is `EVENT FORECAST // CHANCE PER CATEGORY OVER THE NEXT 6 STRATEGIC HOURS`. |

No clipping: document 1280×720, no hidden-overflow elements in the panel.

---

## Screenshots / Video

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `wn-012/wn-012-intel1-europe-41febe7-1280x720.png` | Europe focused, Intel 1, forecast locked | AC-1 |
| 2 | `wn-012/wn-012-intel2-europe-41febe7-1280x720.png` | Europe focused, Intel 2, five chances | AC-2 |
| 3 | `wn-012/wn-012-intel3-europe-41febe7-1280x720.png` | Europe focused, Intel 3, five chances | AC-2 |

---

## Test Conditions

- **Game state at start**: New Operation on a cleared save (`localStorage.clear()`), orientation dismissed, clock paused. Intel seeded with `useCampaignStore.setState({ intelLevel })` (UI check only).
- **Platform / hardware**: macOS (Darwin 25.5), Playwright driving headed Chrome for Testing 1247, viewport 1280×720, dev server `vite --strictPort --port 4201` from a clean worktree of `41febe7` (the main checkout's globe work excluded).
- **Framerate during test**: not measured (smoke 2026-10-13 path 10 covers frame time).
- **Any special setup required**: driver `sprint-002-qa-2026-10-13/ui.mjs`; raw results `sprint-002-qa-2026-10-13/ui.json`. Console errors: none.

---

## Observations

- The panel labels blackout as `BLKOUT` and seizure as `SEIZE`. Both are abbreviations, not omissions.

---

## Sign-Off

UI story: closed by the retained screenshots above; a lead sign-off is welcome but not required.

| Role | Name | Date | Signature |
|------|------|------|-----------|
| qa-lead | | | [ ] |

