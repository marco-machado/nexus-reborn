# World Network p95 re-profile (2026-10-22)

This re-profile was dated in Sprint 10 QA sign-off condition 5 (retro 10 action 3). Its job is to put a measured number in front of the owner's ruling on the p95 limit: the old 9.0 / 25.0 ms smoke line (`qa-plan-sprint-009-2026-10-17.md:233`) or the `project.yaml` budget (16.7 ms p95, no live frame over 50 ms).

The scripts `perf.mjs` and `lib.mjs` are copied unchanged from `../sprint-010-sweep-perf-2026-10-22/`. Each run is one full loop: World Network at 8X, the Rust Haven Brief, Assembly, the mission (sim god-assist; all three relays were hand-killed), Debrief with the 3-day ETA catch-up, then World Network at 8X. Frames are timed with real rAF.

Setup:
- Build: HEAD `979b855`, `npm run dev` on port 4200 (`preview_start dev`).
- Browser: headed Chrome for Testing (chromium-1247), 1280×720.
- Runs: three, back to back.
- The in-app browser pane stayed open on the game's Menu at :4200 during the runs.

## World Network

| Run | n | p50 | p95 | p99 | max | >50 ms |
|---|---|---|---|---|---|---|
| 1 | 6265 | 8.3 | 9.2 | 9.3 | 158.7 | 1 |
| 2 | 6261 | 8.3 | 9.1 | 9.3 | 166.0 | 1 |
| 3 | 6266 | 8.3 | 9.7 | 10.3 | 158.3 | 1 |

The single frame over 50 ms in each run is the Debrief to World Network return frame. That frame also shows as a `world` long task of 154 to 159 ms; it is R-3, already accepted, and it is excluded from the hitch budget as a load moment (`docs/technical-preferences.md`). The p50 of 8.3 ms is the 120 Hz display floor.

## Other phases (p95 / max, ms)

| Run | brief | team | mission | debrief |
|---|---|---|---|---|
| 1 | 9.3 / 33.2 | 9.2 / 25.0 | 9.2 / 275.7 | 9.3 / 9.4 |
| 2 | 9.2 / 33.3 | 9.1 / 24.1 | 8.9 / 291.7 | 9.0 / 10.5 |
| 3 | 9.3 / 33.3 | 8.8 / 24.9 | 9.6 / 275.1 | 9.7 / 10.3 |

Each run has one mission max over 50 ms: the first-second mission-entry frame (a 258 to 266 ms long task). That is a load moment, as on the 10-14 and 10-22 baselines.

All runs: mission won, 0 errors, ETA catch-up 3 days.

## Against the two limits

| Limit | World Network p95 | Result |
|---|---|---|
| 9.0 ms (old smoke line) | 9.1 to 9.7 ms | Over in all three runs |
| 16.7 ms (`project.yaml` budget) | 9.1 to 9.7 ms | Under in all three runs, by 7.0 ms or more |

Live-play frames over 50 ms, with the load moments excluded: 0 in every run.

The number is for the owner to rule on. This record does not rule.
