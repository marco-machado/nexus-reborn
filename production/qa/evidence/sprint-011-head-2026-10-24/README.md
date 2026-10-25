# Sprint 11 QA on the final build: /team-qa sprint, 2026-10-24/25

**Build**: HEAD `131a5c1`, the final sprint build. The last `src/` change is `ab9935c`. The only uncommitted `src/` changes are three test files added during this cycle for TM-021: `src/game/tutorial.test.ts`, `src/state/tutorialStore.test.ts` and `src/game/world.noRoute.test.ts`. The app never imports them.
**Harness**: headless Chrome for Testing 1247 (playwright-core) against `npm run dev` on port 4200, viewport 1280×720 unless a case says otherwise. Never the in-app pane or the user's Chrome.
**Plan / strategy**: `production/qa/qa-plan-sprint-011-2026-10-24.md`, `production/qa/qa-strategy-sprint-011-2026-10-24.md`. Cases: `production/qa/test-cases/*-cases.md`.

## Scripted re-runs of record (dev server restarted before them)

| Run | Script | Result |
|---|---|---|
| R1 `r1-probe/` | `../sprint-011/probe.mjs` | 152/152 PASS, no console or page errors |
| R2 `r2-sweep/` | `../screens-2026-10-23/sweep.mjs` | 10 surfaces, every count 0. Exemptions are the blinking caret and inactive controls |
| R2 world alone `r2-sweep-world-alone/` | same | 0 |
| R3 `r3-focus/` | `../screens-2026-10-23/focus.mjs` | 15/16. The FAIL is a script ordering defect: step 4 removes `hint-debrief-research` from the seen set, then `SURFACES.debrief()` → `team()` → `fresh()` marks it seen again. The check it skips was hand-walked in IF-037 TC-12 and passed |
| R4 `r4-playtest-sweep/` | `../playtest-fixes-2026-10-23/sweep.mjs` | 12 surfaces, every count 0 |

## Voided runs, kept as a record

- `r1-probe-void-hmr/`: during this R1 run Claude briefly edited `src/game/tutorial.ts` and `src/game/world.ts` for a TM-021 mutation check. Vite's hot reload sent the page to the menu, so one IF-021 check found no screen.
- `void-dup-store/`: the same edits left Vite serving `tutorialStore.ts` under a `?t=` URL, so the probes' bare-path import held a second store copy and `dismissCard()` did not reach the app. The orientation card stayed up in those captures. The dev server was restarted, and every run above comes from the clean server.

## Per-story results

Each story folder holds its results (`results.md`), script, log and captures. Evidence docs: `production/qa/evidence/<story>-evidence.md`. The four carried Sprint 10 Brief cases (H5 to H8) are in `carried-brief/`.

## Not exercised

Screen-reader output (no assistive-technology run), windows below 1280×720, and a frame-time pass (smoke check item 8 covers that).
