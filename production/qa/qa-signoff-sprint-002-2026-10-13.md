## QA Sign-Off Report: Sprint 002 — World Network director loop
**Date**: 2026-10-13
**Build under test**: commit `41febe7`. The uncommitted globe work is held out of this sprint by the user's scope decision at the Phase 2 gate.
**Manual QA executed by**: Claude, with a Playwright click-through in headed Chrome at 1280x720 against `41febe7`. The build was served from a clean worktree on port 4201. These cases were actually played, not filled in by hand. No human tester was asked.
**Plan / strategy**: `production/qa/qa-plan-sprint-002-2026-10-13.md`, `production/qa/qa-strategy-sprint-002-2026-10-13.md`. Test cases: `production/qa/test-cases/wn-0{12,13,14,17,18}-*-cases.md`.

### Smoke Check
The report is at `production/qa/smoke-2026-10-13.md`. Its verdict is **PASS** at `41febe7`: 770/770 tests, `npm run build` exit 0, and 10/10 critical paths.

Phase 2 recorded it as PASS WITH WARNINGS because the working tree had moved past `41febe7`. That warning is resolved: the scope is pinned to `41febe7`, and this cycle re-ran `vitest run` on a clean worktree of that commit (42 files, 770/770).

### Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| WN-005 Quiet replay awards nothing | Logic | PASS (in 770/770, clean 41febe7 worktree) | Not required | PASS |
| WN-008 Influence wallet income | Logic | PASS (in 770/770) | Not required | PASS |
| WN-009 Stabilize/Expedite refusals | Logic | PASS (in 770/770) | Not required | PASS |
| WN-010 Stabilize six hourly steps | Logic | PASS (in 770/770) | Not required | PASS |
| WN-011 Intel progress awards | Logic | PASS (in 770/770) | Not required | PASS |
| WN-019 Campaign flag edge cases | Logic | PASS (in 770/770) | Not required | PASS |
| WN-017 Opening desk and post-win Scan | Integration (+UI) | PASS (in 770/770; t0 boundary) | PASS: opening desk AC met; a real clean Glass Veil win from Influence 0 reads INFLUENCE 8 PTS after the 2-day ETA; 2 PNGs | PASS |
| WN-018 Campaign complete/failed banners | Integration (+UI) | PASS (in 770/770) | PASS WITH NOTES: complete and failed reached through played missions; Select works when complete and does nothing when failed; Hydrate keeps the flags; pyrrhic regression unchanged since IF-011; 2 PNGs | PASS WITH NOTES |
| WN-012 Event forecast gated on Intel | UI | Not required | PASS: locked at Intel 1; at Intel 2 and 3 the five chances equal `eventForecast()`; 3 PNGs | PASS |
| WN-013 Antarctica hidden / Focus Tax | UI | Not required | PASS: Antarctica is aria-disabled, never focused and shows no numbers at Intel 1–3; Europe Tax prints 2,468; the next-tax deposit equals North America's yield alone (4,169); 3 PNGs | PASS |
| WN-014 Scan hides contracts above Intel | UI | Not required | PASS: contracts above the director's Intel are hidden but kept in `worldStore.contracts`; equal-Intel and Expedite-waived contracts show; Chance prints at every Intel level; no risk band; 3 PNGs | PASS |

**Evidence**: `production/qa/evidence/wn-0{12,13,14,17,18}-evidence.md`, plus the retained `*-41febe7-1280x720.png` files in each `wn-0NN/` folder. Raw run data and the drivers are in `production/qa/evidence/sprint-002-qa-2026-10-13/`. The sign-off rows in the evidence files are still unchecked.

### Bugs Found

| ID | Story | Severity | Status |
|---|---|---|---|
| — | — | — | None. No bugs were filed in Phase 5, and none in scope were on file from Phase 1 (`production/qa/bugs/` does not exist). |

### Verdict: APPROVED WITH CONDITIONS

There are no open S1/S2 bugs and no story failed. All 11 stories produced executed evidence, and the smoke check passed. WN-018 passed with a documented note.

**Conditions**:
1. **WN-018 copy question.** In the campaign-failed state, Glass Veil's row reads `REQUIRES INTEL LVL 1`. This is not a defect against the current acceptance criteria. The design or UX owner should decide whether that copy is intended. If it is not, file it as a story or bug.
2. **Lead sign-off.** The sign-off rows in the five evidence files (WN-012, 013, 014, 017, 018) are unchecked. A lead needs to review and check them before the sprint closes.

### Conditions Close-Out (2026-10-13)
1. **WN-018 copy**: Marco accepted `REQUIRES INTEL LVL 1` in the campaign-failed state as intended. No story or bug filed.
2. **Lead sign-off**: Marco Machado signed the qa-lead rows in the WN-012, 013, 014, 017 and 018 evidence files.
- **WN-014 bookkeeping**: both acceptance-criteria boxes ticked. The 5 "intel visibility (WN-014)" tests pass in `src/game/contracts.test.ts`.
- **`taxPaid` leak (retro sprint 1 action 4)**: fixed rather than filed. `applyMissionResult` and `spendInfluence` in `src/state/worldStore.ts` now return `commitFlow(f)`, so the session-only key stays off the store. Two assertions in `src/state/worldStore.test.ts` fail without the fix and pass with it. Full suite: 777/777, `tsc -b` exit 0.

**Sprint 2 status: CLOSED.**

### Next Step
Resolve the conditions before advancing. S3/S4 bugs may be deferred to polish.

### Notes
- **Globe work (uncommitted) is out of scope.** It touches `src/ui/WorldMap.tsx`, `WorldGlobe.tsx`, `src/game/atlas.ts` and `scanTerritories.ts`. It has no story ID or acceptance criteria. It needs its own story, unit coverage for its Scan contract filtering, and its own smoke check and QA before it ships. It does not ride in under this sign-off.
- **WN-014 bookkeeping.** The story file says Status Complete, but its AC checkboxes are unchecked. The owner should tick them; there is no quality impact.
- **WN-018 pyrrhic regression.** No commit touched `src/ui/index.tsx` or `src/ui/debriefFlags.ts` between 96b9b05 (IF-011) and 41febe7, so `if-011-pyrrhic-win-banner-evidence.md` still applies.
- Logic story results rest on the automated suite, as the strategy requires.
