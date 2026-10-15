## QA Sign-Off Report: Sprint 6 — Persistence and validation

**Date**: 2026-10-15
**QA level**: standard
**Scope**: PV-001..PV-018 (18 stories)
**Strategy**: `production/qa/qa-strategy-sprint-006-2026-10-15.md`
**Plan**: `production/qa/qa-plan-sprint-006-2026-10-15.md`
**Smoke check**: PASS (`production/qa/smoke-2026-10-15-sprint-006.md`: 1,146/1,146 tests across 46 files, build and lint clean)
**Run**: `/team-qa sprint`, automation autonomous, team.size individual (qa-lead at gates, qa-tester for cases). Drafted by qa-lead; verdict checked against the rules by the orchestrator.

### Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| PV-001 | Integration | PASS | Not required (smoke items passed) | PASS |
| PV-002 | Integration | PASS | Not required (smoke items passed) | PASS |
| PV-003 | Integration | PASS | M-3: telemetry, Difficulty and Render quality toggled through the UI persist across reload and New Operation | PASS |
| PV-004 | Integration | PASS | Not required (smoke items passed) | PASS |
| PV-005 | Integration | PASS | M-4: 0 save writes during phase `mission`; post-Abort writes are World Network autosaves that match the mission-start blob except for `world` | PASS |
| PV-006 | Integration | PASS | Not required (smoke items passed) | PASS |
| PV-007 | Integration | PASS | Not required (smoke items passed) | PASS |
| PV-008 | Logic | PASS | Not required | PASS |
| PV-009 | Logic | PASS | Not required | PASS |
| PV-010 | Logic | PASS | Not required | PASS |
| PV-011 | Logic | PASS | Not required | PASS |
| PV-012 | Logic | PASS | Not required | PASS |
| PV-013 | Logic | PASS | M-3 (shared with PV-003) | PASS |
| PV-014 | Logic | PASS | Not required | PASS |
| PV-015 | Logic | PASS | Not required | PASS |
| PV-016 | UI | PASS | M-1: export from 2 played records, all AC4 fields present, 0 network requests; screenshots in `production/qa/evidence/pv-016/` | PASS |
| PV-017 | UI | PASS | M-2: played paid win and played quiet replay both show unfiled, then filed after World Network return; screenshots in `production/qa/evidence/pv-017/` | PASS |
| PV-018 | Integration | PASS | M-5: write-failed state and notice correct, 0 page errors; `production/qa/evidence/pv-018/m5-01-world-network-write-failed-1280x720.png` | PASS WITH NOTES |

Manual cases were run by Claude through Playwright in headed Chrome for Testing at 1280x720 (CLAUDE.md "Do It Yourself"). Missions were played by the sim-order bot in god mode (harness assist); settings were changed through the real UI. Raw log: `production/qa/evidence/team-qa-2026-10-15-s6/manual.log`; results in the "Execution Record" of each `production/qa/test-cases/pv-*-cases.md`. UI evidence: `production/qa/evidence/pv-016-evidence.md`, `pv-017-evidence.md`.

### Bugs Found

None. No bugs were filed in Phase 5. No open bugs are on file for this scope (`production/qa/bugs/` does not exist).

### Verdict: APPROVED WITH CONDITIONS

- **NOT APPROVED check**: no S1/S2 bugs open; no story failed.
- **Precondition**: all 18 stories have executed evidence (tests that ran; 5 manual cases walked); smoke check PASS.
- **Result**: PV-018 is PASS WITH NOTES with the issue documented → APPROVED WITH CONDITIONS.

**Conditions**:
1. **PV-018 notice placement.** At 1280x720 the write-failure notice sits inside the Feed panel and covers 2 Feed rows. No AC covers position; copy and position are placeholders. Route to `/ux-design` and record either an AC for the final position or explicit acceptance of the current placement.
2. **Lead-programmer sign-off for PV-016 and PV-017.** Sign-off rows in `pv-016-evidence.md` and `pv-017-evidence.md` are unchecked. Retained screenshots close UI stories, but the QA plan's exit criteria ask for this sign-off: record it or have the plan owner waive it.
3. **Code review for PV-016 and PV-017.** `/code-review` ended NOT ASSESSED (specialist reviewers never ran; retro R-1). Run it, or have the producer accept the gap.

### Next Step

Resolve conditions before advancing. S3/S4 bugs may be deferred to polish (none open). Once the conditions are cleared or explicitly accepted, run `/gate-check`.

### Notes

- **Smoke observation 3 (PV-003/PV-013)**: caused by the smoke harness calling `setState`; settings changed through the UI persist. Not a defect.
- **World Network autosave rate (PV-005)**: the save key is written about every 0.55 s at a 2x clock on World Network. Meets the ACs; whether a spec limits write frequency was not checked. Question for the persistence owner, not a defect.
- **Evidence location**: the plan names `production/qa/evidence/sprint-006/`, which does not exist. Evidence is in the `pv-NNN/` directories and `team-qa-2026-10-15-s6/`. Deviation recorded; files not moved.
- **Harness-driven evidence**: no human has played this build. M-2 and M-3 narrow the gap; a short human playtest is recommended before the milestone gate.
- **Bookkeeping**: story-006 estimate (1.0 d header vs 0.2 d in `sprint-status.yaml`) unreconciled. PV-006/PV-012 list `appStore.test.ts`/`worldStore.test.ts` as evidence though only `save.test.ts` was extended (stories justify this).

---

### Conditions Update — 2026-10-15 (same day, after sign-off)

| # | Condition | Status | Evidence |
|---|---|---|---|
| 1 | PV-018 notice placement | **Resolved (uncommitted).** `.write-fail-region` moved from `bottom: 72px` to `top: 31vh`. Covers no text on World Network, Research, Brief or Assembly at 1280x720, 1366x768 and 1920x1080, text scale 100 and 125 (24/24 checks). The first try at 41vh failed at 125% (covered Brief map labels); 31vh is the band free at every checked size. Globe city labels drift with rotation and can pass under it. | `production/qa/evidence/team-qa-2026-10-15-s6/fix-verify.mjs`, `fix-verify.json`; `production/qa/evidence/pv-018/fix-notice-world-network-*-scale125.png` |
| 2 | Lead-programmer sign-off PV-016/017 | **Waived** by Marco Machado (owner), 2026-10-15. UI stories close on retained screenshots; sign-off rows removed from both evidence docs. | `production/qa/evidence/pv-016-evidence.md`, `pv-017-evidence.md` |
| 3 | Code review PV-016/017 | **Done.** `/code-review` re-run with lead-programmer, ui-programmer and qa-tester specialists; verdict CHANGES REQUIRED; required changes applied (below). | this section |

**Review fixes applied (uncommitted):**
- `src/ui/Balance.tsx`, `src/ui/balanceActions.ts`, `src/ui/ui.css`: P-01 armed-hint slot for Balance Clear (`PRESS AGAIN WITHIN 3 S TO ERASE RECORDS`, placeholder copy), always-mounted polite live region, cleared on disarm; armed accessible name now starts with the visible label; `pressClear` redundant branch removed and `cleared` documented as "erase requested". Verified in the browser: hint shows when armed, empty after the 3 s lapse (`pv-016/fix-clear-armed-hint-1280x720.png`).
- `src/ui/index.tsx`, `src/ui/ui.css`: Debrief `.db-filing` `role="status"` region always mounted, with a reserved line. Verified through a played win: region shows `INVOICE UNFILED // COMMITS ON NEXT SCREEN`, 0 page errors (`pv-017/fix-debrief-status-region-1280x720.png`).
- `src/state/save.test.ts`: the "one unfiled watcher" test now counts `markUnfiled` calls (store sets could not detect a duplicate watcher); reload and null-storage assertions tightened to `filed` and `write-failed`/`unavailable`.
- `src/state/telemetry.test.ts`: Clear arm window asserted as 3000 ms (was `> 0`).
- `src/state/saveStatusStore.ts`: doc comments on `SaveStatusActions` and `useSaveStatusStore`.
- Checks: `npm run test` 1,146/1,146; `npm run build` and `npm run lint` pass.

**Review findings refuted or superseded:** a research/tutorial change filing the invoice early while on Debrief (refuted: `scheduleAutosave` returns in the debrief phase); stale `unfiled` after a failed New Operation and missing write-failed Debrief copy (superseded by PV-018). Autosave every ~0.5 s on World Network is the intended coalescing (`save.ts` `scheduleAutosave`; GDD Rule 9: delay and coalescing are not rules).

**Left as suggestions:** detached-anchor Export in Firefox (ADR-0015 risk, Chromium-only verified); no render test for Balance/Debrief wiring; Escape closes the Balance panel rather than only disarming (P-01 ambiguity); `startNewOperation` ~60 lines; Menu New Operation also lacks the P-01 armed-hint slot (outside PV-016/017); Sectors panel clips UNREST rows at 125% text scale at 1280x720 (seen in the fix screenshot, outside this sprint's stories).

**Verdict after update:** the recorded verdict stays APPROVED WITH CONDITIONS. All three conditions are now resolved or waived; conditions 1 and 3 landed in db927b2. Next: `/retrospective`, then `/sprint-plan new` (the project stays in Production with Roster, Tactical, Interface and Audio epics open, so no stage `/gate-check` applies yet; the template's generic `/gate-check` step does not apply at sprint close).
