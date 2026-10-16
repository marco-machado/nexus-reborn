# TM-009 Opening hour lighting (presentation half of AC 10) — 2026-10-16

## Result and scope

- Result: **pass** for the three checklist items of the story's manual half.
- Story: `production/epics/tactical-mission/story-009-opening-hour-is-presentation-and-risk-index.md` (GDD `design/gdd/tactical-mission.md` AC 10, ADR-0007).
- Changed behaviour under test: none. The story changed tests only. This run checks the existing `src/scene/Atmosphere.tsx` look in the app.
- Sign-off: the story names qa-lead. This run was captured by an unattended `/story-done` session. qa-lead sign-off is **not** recorded here.

## Source and environment

| Field | Recorded value |
| --- | --- |
| Tested revision | c97b02d, with TM-009 test-file edits uncommitted (no source changes) |
| Build | Vite dev server (`npm run dev -- --strictPort`, port 4200) |
| Browser | Smoke harness `../smoke-2026-10-15-s6/lib.mjs`: headed Chrome for Testing, Playwright, viewport 1280x720 |
| Driver | `capture.mjs` (this folder). Raw readings: `capture.json` |
| Save | Fresh profile, NEW OPERATION |
| Harness assist | Run 2 sets `campaignStore.intelLevel = 2` so the dusk contract RUST HAVEN unlocks. Nothing else is constructed. |

## Observations

| Check | Expected | Observed | Status | Evidence |
| --- | --- | --- | --- | --- |
| HUD clock differs between two shots 30+ s apart | Clock advances | GLASS VEIL (night, opening 22:14:08): HUD `22:14:10` at sim 2.28 s, `22:14:43` at sim 35.40 s. Both match `missionClockAt` | pass | [01](01-night-open-1280x720.png), [02](02-night-plus30s-1280x720.png) |
| Sky colour and light direction the same in both | No change | Same cool blue night grade, same lamp glows, same shadow direction in 01 and 02. Units and the alert advisory changed (CorpSec alerted during the wait); the lighting did not. Compared by eye; no pixel diff tool was available | pass | [01](01-night-open-1280x720.png), [02](02-night-plus30s-1280x720.png) |
| Dusk and night show different lighting at open | Different | RUST HAVEN (dusk, opening 18:14:08, `missionPeriod` = dusk) opens with a warmer, brighter ground grade than GLASS VEIL at night | pass | [01](01-night-open-1280x720.png), [03](03-dusk-open-1280x720.png) |

The two missions differ in city and weather (GLASS VEIL heavy rain, RUST HAVEN clear), so shot 03 against shot 01 shows the period look differs. It is not a same-script comparison; that is covered by the automated tests.

Console: only the known `favicon.ico` 404.
