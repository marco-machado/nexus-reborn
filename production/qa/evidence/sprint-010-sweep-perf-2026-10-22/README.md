# Sprint 10 sweep and perf re-run (2026-10-22)

Closes smoke warning 1 of `production/qa/smoke-2026-10-22-sprint-010.md`: the if-001 sweep and the smoke-2026-10-14-s4 perf loop opened Glass Veil, which WN-020 locks at intel 1.

## What changed from the originals

| File | Copied from | Change |
|---|---|---|
| `sweep.mjs` | `if-001/sweep.mjs` | The Brief is Rust Haven. Destroy objectives use grenades. Once no Power Cell is left, the device is set dead by hand. |
| `lib.mjs` | `smoke-2026-10-14-s4/lib.mjs` | Same destroy assist. Loads `playwright-core` from the global `@playwright/cli`. OUT is this folder. |
| `perf.mjs` | `smoke-2026-10-14-s4/perf.mjs` | Deploys Rust Haven. |

The grenade-then-hand-kill assist follows ADR-0016: a Device is never an Attack target. The hand kill is the same assist `world.test.ts` uses. In both runs all three relays were hand-killed (`sweep-output.txt`; `perf.json` play log), so the assisted mission says nothing about winnability.

## Results (HEAD `74d3268`, dev server on 4200)

**Sweep** (`sweep-output.txt`, `sweep-result.json`, PNGs): ALL SURFACES CLEAN. That covers 9 surfaces × 90/100/110/125 at 1280×720, the mission HUD with each slot active at 125, and the 1100×650 sub-minimum. The mission was won and there were 0 console errors. The Brief (Rust Haven) is clean at all four scales, 104/104 boxes overlap-checked, on a tree that includes the BUG-0009 fix `ea1960f`.

**Perf** (`perf.json`, headed Chrome for Testing, real rAF):

| Phase | n | p50 | p95 | p99 | max | >50 ms |
|---|---|---|---|---|---|---|
| world | 6265 | 8.3 | 9.1 | 9.3 | 216.5 | 1 |
| brief | 87 | 8.3 | 9.5 | 25.1 | 25.1 | 0 |
| team | 102 | 8.3 | 9.1 | 9.4 | 25.2 | 0 |
| mission | 9076 | 8.3 | 9.2 | 9.4 | 342.3 | 1 |
| debrief | 467 | 8.3 | 9.2 | 9.3 | 9.4 | 0 |

Long tasks: 359 and 213 (untagged, load), 314 (mission entry), 209 (return to World Network). The 2026-10-14 baseline (`smoke-2026-10-14-s4/perf.json`) has the same shape: one mission-entry frame at 356.8 ms, one world-return frame at 206.4 ms, and long tasks of 427, 198, 335 and 192. No new spike. The Debrief-entry frames with the 3-day ETA catch-up are 7.8 to 8.8 ms. The p50 is 8.3 here against 6.2 on 10-14, which is the display refresh rate of the machine, the same as today's smoke run. Errors: none.
