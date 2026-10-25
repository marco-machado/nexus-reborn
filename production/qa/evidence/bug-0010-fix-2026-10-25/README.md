# BUG-0010 fix: evidence (2026-10-25)

**Commit:** the commit on branch `worktree-agent-a94c804036698f7c1` that adds this folder (parent `ae4ca69`). Not merged to `main`.

**Change:** the industrial density note (`DENSITY_NOTE.industrial`, `src/game/contracts.ts:420`) and Rust Haven's m03 note (`src/game/data.ts:246`) now read `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY. EVERY CIVILIAN HIT IS BILLED.` `DENSITY_NOTE` is now exported so the new test can read it.

## Results

| Check | Result | File |
|---|---|---|
| New test `src/game/briefNotes.test.ts` before the fix | 2 failed (m03, `DENSITY_NOTE.industrial`), 4 passed | `test-before-fix.txt` |
| `npx vitest run` after the fix | 69 files, 1674 tests passed | `vitest-after-fix.txt` |
| `npm run lint` | exit 0 | (no output) |
| `npm run build` | exit 0 | `build.txt` |
| IF-039 TC-02 re-walk, headless Chrome for Testing, 1280x720, worktree dev server on port 4311 | ALL PASS (8 checks) | `walk.mjs`, `walk-output.txt` |

Rendered `.mb-note` text (text scale 100):

- **Rust Haven (m03):** `CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.` / `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY. EVERY CIVILIAN HIT IS BILLED.` / `DEMOLITION CELLS ARE THE FAST TOOL. GUNFIRE WORKS, SLOWLY.` / `THE YARD GUARD CAN BE BYPASSED ON THE WAY IN.`
- **Seeded SABOTAGE contract `gc7518e2d3` (seed 1964565203, Neon Garden // Oslo):** `HEAVY RAIN. VISIBILITY REDUCED.` / `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY. EVERY CIVILIAN HIT IS BILLED.` / `GENERATED CONTRACT // OFFER EXPIRES IF UNACCEPTED.`

The walk also checks that no note overruns its box horizontally at text scale 100 and 125 (TR-interface-002, raised in the bug's Notes). Both Briefs pass; the longer line wraps to three lines at 125.

Captures: `tc02-m03-100.png`, `tc02-m03-125.png`, `tc02-sabotage-gc7518e2d3-100.png`, `tc02-sabotage-gc7518e2d3-125.png`.

Harness assists (named in `walk.mjs`): localStorage clear, `startNewOperation`, intel set to 5 through `campaignStore.setState`, Brief reached through `appStore.selectMission`, text scale through `settingsStore.setTextScale`.
