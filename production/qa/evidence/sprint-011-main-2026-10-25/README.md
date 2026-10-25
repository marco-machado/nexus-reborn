# Sprint 11 QA re-run on main `93c58e0`: /team-qa sprint, 2026-10-25

**Build**: main `93c58e0` (the four bug fixes BUG-0010 to BUG-0013 merged). Working tree clean except this folder, the four bug files and the R3 script fix.
**Harness**: headless Chrome for Testing (playwright-core) against `npm run dev` on port 4200, started fresh for these runs, viewport 1280×720. No `src/` edits during any run.
**Sign-off**: `production/qa/qa-signoff-sprint-011-2026-10-25-main.md`.

| Folder | Script | Result |
|---|---|---|
| `npm-test-run1..3.txt`, `lint.txt`, `build.txt` | `npm test`, `npm run lint`, `npm run build` | 1678/1678 three times; lint exit 0; build exit 0 |
| `r1-probe/` | `../sprint-011/probe.mjs` | 152/152 PASS |
| `r2-sweep/` | `../screens-2026-10-23/sweep.mjs` | every count 0 |
| `r3-focus/` | `../screens-2026-10-23/focus.mjs` (before fix) | 15/16; the FAIL is the step-4 script ordering defect |
| `r3-focus-fixed/` | same, after the fix | 16/16 PASS |
| `r4-playtest-sweep/` | `../playtest-fixes-2026-10-23/sweep.mjs` | every count 0 |
| `w10-bug0010/` | `../bug-0010-fix-2026-10-25/walk.mjs` | IF-039 TC-02 ALL PASS |
| `w11-bug0011/` | `../bug-0011-fix-2026-10-25/linebox.mjs` | IF-036 TC-036-22 PASS |
| `w12-bug0012/` | `../bug-0012-fix-2026-10-25/bug-0012-walk.mjs` | ALL PASS (4 checks) |
| `w13-bug0013/` | `../bug-0013-fix-2026-10-25/probe.mjs` | IF-037 TC-037-03 PASS |

`runs.txt` is the combined log of the batch run.
