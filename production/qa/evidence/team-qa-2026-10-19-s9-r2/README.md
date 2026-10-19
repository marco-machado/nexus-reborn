# /team-qa Sprint 9 re-run (r2), 2026-10-19

Strategy: `production/qa/qa-strategy-sprint-009-2026-10-19-r2.md`. Cases: `production/qa/test-cases/sprint-009-r2-rerun-cases.md`.
Build: `main` at `e410b9d`, `npm run dev -- --strictPort` on port 4200 (`.claude/launch.json` "dev").
Runner: Claude, headless Chrome for Testing at exactly 1280x720, temporary profile, real keyboard and pointer input. Harness assists are named in each script header (localStorage clear; live Glass Veil mission through the app store; read-only store access; `blur()` for the nothing-focused cases).
Each folder holds a copy of its script (outputs land next to the script, so the signed and author folders are untouched), `run.log`, its output file and captures.

| Row | Folder | Script origin | Result |
|---|---|---|---|
| R1 + R3 (IF-008 TC-01/04/05/06, all 5 sliders) | `if-008/` | copy of `bug-0001-fix-2026-10-19/probe.mjs` | ALL PASS (35 checks; 5 of 5 sliders: MASTER, UI CUES, COMBAT, MUSIC, AMBIENCE) |
| R2 (Space regression set) | `extra/` | new | ALL PASS (R2-a MUTE and RESUME, R2-b, R2-c, R2-d) |
| R4 (BUG-0002) | `if-005-orig/`, `if-005-menu/` | copies of `team-qa-2026-10-19-s9/if-005/probe.mjs` (the probe that found it) and `bug-0002-fix-2026-10-19/if-005-menu/probe.mjs` | ALL PASS both |
| R4-d (pointer open, Escape) | `toast/` | new | PASS |
| R5 (Tab from page start) | `extra/` | new | PASS: BEGIN NEW OPERATION then OPEN SETTINGS, also after a close |
| R6 (IF-005 smoke capture) | `if-005-smoke/` | copy of `bug-0002-fix-2026-10-19/if-005-smoke/capture.mjs` | ALL PASS (31) |
| R7 (IF-001 sweep) | `if-001/` | copy of `smoke-2026-10-19/if-001/sweep.mjs` | ALL SURFACES CLEAN, exit 0, 44 `ok` surface/scale lines, 0 not ok |
| R8 (IF-006, IF-007) | `if-006/`, `if-007/` | copies of `team-qa-2026-10-19-s9/if-006/capture.mjs`, `smoke-2026-10-19/if-007/capture.mjs` | ALL PASS (12, 27) |
| R8-c (Space with a tutorial toast) | `toast/` | new | Steps 2-3 PASS. Step 4 observation: with focus on `Dismiss tutorial step SELECTION`, Space paused the mission and did not dismiss the toast |
| R9 (AU-001 Settings persistence) | `extra/` | new | PASS: MUSIC 100 → 40 and MUTE ON persist across reload; focus returns to SETTINGS |
| R10 (suite) | — | `npx vitest run` at e410b9d | 1,539/1,539 in 60 files; `npm run lint` no errors; `npm run build` completes |

Console/page errors: 0 in every script.
