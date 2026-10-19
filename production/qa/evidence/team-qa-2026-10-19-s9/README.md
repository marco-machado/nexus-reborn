# Sprint 9 `/team-qa` manual QA run, 2026-10-19

Phase 5 execution record for `/team-qa sprint` (autonomous, team.size individual). Executor: Claude. Review and sign-off: qa-lead (`qa-lead-review.md` in this folder).

- **Build**: `main` at 0dcb87c. `npm run dev -- --strictPort` (Vite, port 4200), started and stopped by Claude. After the run, port 4200 had no listener and no Chrome for Testing process was left.
- **Browser**: headless Chrome for Testing (`chromium-1247`, the global `@playwright/cli` playwright-core), viewport exactly 1280x720, a fresh context per script.
- **Cases**: `production/qa/test-cases/<story>-cases.md`. Strategy: `production/qa/qa-strategy-sprint-009-2026-10-19.md`. Plan: `production/qa/qa-plan-sprint-009-2026-10-17.md` (reused).
- **Signed-off story folders are untouched.** Retained scripts were copied here unchanged and re-run. New probes are new files here.

## What ran

| Story | Script (this folder) | Kind | Result |
|---|---|---|---|
| IF-003 | `if-003/capture.mjs` | retained copy, re-run at HEAD | exit 0. Transcript and `brief-vs-deployed.md` identical to the signed-off originals apart from decimals |
| IF-004 | `if-004/capture.mjs` | retained copy, re-run at HEAD | exit 0. Transcript identical to the original apart from decimals |
| IF-006 | `if-006/capture.mjs` | retained copy, re-run at HEAD | ALL PASS |
| IF-006 | `if-006/probe.mjs` | new probe (TC-06 to TC-09) | ALL PASS |
| IF-008 | `if-008/capture.mjs` | retained copy, re-run at HEAD | ALL PASS |
| IF-008 | `if-008/probe.mjs` | new probe (TC-01, 04, 05, 06) | TC-01, 04, 05 PASS. **TC-06 FAIL**, filed as `production/qa/bugs/BUG-0001.md` |
| IF-012 | `if-012/capture.mjs` | retained copy, re-run at HEAD | ALL PASS |
| IF-012 | `if-012/probe.mjs` | new probe (TC-06, TC-07) | ALL PASS |
| IF-007 | `if-007/probe.mjs` | new probe (TC-01, 03, 08) | ALL PASS |
| IF-005 | `if-005/probe.mjs` | new probe (ruling 2: Settings opened from Menu) | 4 PASS, 2 FAIL: focus lands on the document body after close (tag `BODY`, verified on a second run). qa-lead R4: defect, BUG-0002 |
| AU-005 | `au-005/cold-cache.mjs` | new probe (TC-01 to TC-05), advisory | ALL PASS (advisory) |

Reviewed, not re-run (the smoke check re-ran them on the current tree today; the scripts are byte-identical to the story copies; there are 0 `src/` commits after the smoke record c4c1dc9): IF-001 `smoke-2026-10-19/if-001/`, IF-005 `smoke-2026-10-19/if-005/`, IF-007 `smoke-2026-10-19/if-007/`, IF-010 `smoke-2026-10-19/if-010/`.

## First-run harness faults (fixed, then re-run)

These failures came from the harness, not the build. The outputs above come from the fixed scripts.
- **IF-006 probe**: the seeded lab id `seeded` made the save invalid, and the Menu does not hydrate the campaign. Fixed by seeding the real node `b-propellants`, reading the seeded values before the write, and locating New Operation by its aria-label.
- **IF-007 probe**: the pixel-colour filter missed the alpha-blended pulse, and a click inside the camera view box grabs it instead of panning (`src/ui/Minimap.tsx` onDown). Fixed by logging the VIP Ice `arc()` calls and dragging the view box.
- **AU-005 TC-01**: the control click was itself stale, because the clips were still held, so the case was BLOCKED. Fixed by waiting for every held response and decode before the idle window and the control click.

## Labelled fixtures and assists

- Store jump to a live mission: `appStore.setState({ phase: 'team', missionId: m01, squad: DEFAULT_SQUAD })`, then `startMission()` (IF-005, 006, 007, 008, 012 probes; AU-005 TC-01 and TC-03 used the real UI path: NEW OPERATION, Glass Veil, Accept Contract, ASSIGN, DEPLOY STRIKE TEAM).
- `settingsStore.setDifficulty` (IF-007), `tutorialStore.skipTutorial` (IF-007, IF-012).
- IF-006: seeded Settings and campaign (printed with a `SEEDED:` prefix), and seeded telemetry records via `saveRecords`.
- IF-012: the retained script's Credits, roster, maxHp and loadout fixtures.
- AU-005: L1 1500 ms route latency on sfx; L2 1500 ms on `/src/game/audio.ts`; F5 AudioContext subclass that holds `resume()`.
- AU-005 TC-03 and TC-04 fire through `w.orderAttack` (playbook), recorded in the output.

## Console

0 page errors and 0 console errors in every run. AU-005 recorded these warnings verbatim: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (x2) and `Calling [RenderPassEncoder (unlabeled)].Draw with a vertex count of 0 is unusual.` The IF-001 smoke renderer log has `THREE.WebGLRenderer: Context Lost.` x2.

## Review and bugs

- qa-lead review: `qa-lead-review.md`. It holds the UI sign-offs, the AC20 check, rulings R1–R8, the BUG-0001 labels and the AC-box decisions.
- Bugs filed this run (`production/qa/bugs/`):

| ID | Story | Severity | Priority | Summary |
|---|---|---|---|---|
| BUG-0001 | IF-008 AC11 | S3-Medium | P1-Fix this sprint | Space on a focused Settings volume slider (Settings opened from pause) unpauses the mission and closes Settings |
| BUG-0002 | IF-005 AC19 | S3-Medium | P1-Fix this sprint | Closing Settings opened from the Menu leaves focus on the page body |
| BUG-0003 | IF-010 / IF-001 AC1 | S4-Low | P3-Backlog | The SAVE FAILED notice covers first-visit orientation-card text |

- Per-story evidence docs written this run (signed by qa-lead): `production/qa/evidence/if-003-evidence.md`, `if-004-evidence.md`, `if-006-evidence.md`, `if-007-evidence.md`, `if-010-evidence.md`, `if-012-evidence.md`. None were written for IF-001 (not signed: AC20 record incomplete) or IF-005 (not signed: BUG-0002).
