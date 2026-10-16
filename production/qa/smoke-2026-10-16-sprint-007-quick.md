## Smoke Check Report
**Date**: 2026-10-16
**Sprint**: Sprint 7 (`production/sprints/sprint-007.md`) — Roster and Assembly, 23 stories
**Engine**: Web — three.js 0.185.1 (r185); React 19.2.8; @react-three/fiber 9.6.1; Vite 6.4.3; TypeScript 5.8.3; Zustand 5.0.14
**QA Plan**: `production/qa/qa-plan-sprint-007-2026-10-15.md`
**Argument**: quick (re-check after `production/qa/smoke-2026-10-16-sprint-007.md`, NOT ASSESSED)
**Automation mode**: autonomous; no `AskUserQuestion` batches. The manual rows come from browser runs Claude drove earlier this session on the same revision (CLAUDE.md "Do It Yourself").
**Revision**: `cfd2066`. Source is unchanged since the first smoke run: the working tree adds only `production/qa/` documents.

**Environment**: `project-coherence.sh` — 2 match, 0 differ, 2 not checked (no Web binary probe; project-file checks are Godot-only). CI configured: `.github/workflows/tests.yml`.
**Checklist source**: QA plan "Smoke Test Scope" section (8 items).

---

### Automated Tests

**Status**: PASS (1,278 tests, 1,278 passing; 50 test files)

Command: `npm run test` (`vitest run`, `commands.test`) under `perl -e 'alarm shift; exec @ARGV' 900`. Took 1.31 s.
**Build check (extra)**: PASS — `npm run build` exit 0; `npm run lint` exit 0.

---

### Test Coverage

Coverage scan skipped (`quick`). Run `/smoke-check sprint` for full coverage analysis. The sprint run earlier today found 21 covered, 1 manual, 0 missing, 0 unknown, and no source has changed since.

---

### Manual Smoke Checks

- [x] Build launched this session — yes (dev server on port 4200, in-app browser, 1280x720; three launches today on `cfd2066`)
- [x] 1. Build/tests pass; app launches to the Menu with no console errors — PASS (re-run above; console clean in every run)
- [x] 2. New Operation → Assembly: 8 operatives, Raven Injured, 286.1 kg light — PASS (first smoke run)
- [x] 3. 5th assign, last unassign and Injured assign are all refused — PASS (first smoke run; the last-unassign refusal was seen again in QA, with title `STRIKE TEAM 04 NEEDS AT LEAST ONE OPERATIVE`)
- [x] 4. Deploy → mission → debrief with a casualty and an injury — PASS. A sim-driven Glass Veil win (no store writes) gave KIA GHOST and DART, Experience +1 for MARA and TORQ, and Debrief `INJURED // MARA 18H RECOVERY` (MARA ended at f 0.294; `injuryRecoverySec` gives 17.76 h). On return the 2-day ETA catch-up had already healed MARA (48 h ≥ 18 h). She read READY, was not reassigned, and her bay was cleared. The Assembly injury-hours presentation was covered on a labelled constructed fixture (lost outcome, no ETA): GHOST INJURED with `28H RECOVERY`, disabled key, tooltip `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`. GHOST flipped to READY at t 98,799 against `recoverAtT` 98,743, with the bays left empty. Evidence: `production/qa/test-cases/ra-013-injury-presentation-cases.md` (Execution Record), `production/qa/evidence/ra-013/`
- [x] 5. Abort mid-mission leaves the roster unchanged — PASS (first smoke run; aborted again twice in QA, roster unchanged)
- [x] 6. Hire from the candidate market — PASS (first smoke run)
- [x] 7. Save/reload (Continue) — PASS (first smoke run; snapshot string-equal)
- [x] 8. No new frame spikes on World Network or Assembly — PASS. Fresh New Operation, tab visible, 5 s rAF samples: World Network p50 8.3 / p95 ≤ 9.0 / max ≤ 25.0 ms over 4 runs; Assembly p50 8.3 / p95 ≤ 8.8 / max ≤ 9.4 ms over 2 runs. 0 frames over 50 ms. Readings were taken in the in-app browser, not against a frame budget.

Batch 3 (data integrity and performance) is skipped by `quick`. Save/load and performance appear above as plan items 7 and 8.

---

### Missing Test Evidence

All Logic and Integration stories have test coverage (per the sprint run earlier today; no source change since).

---

### Verdict: PASS

- The automated suite passed: 1,278/1,278.
- All 8 QA-plan smoke items PASS. Items 4 and 8, NOT ASSESSED in the first run, now have executed results.
- No MISSING test evidence entries.

Caveat: the Assembly side of item 4 used a labelled constructed fixture. A natural win on Glass Veil always heals an injury before the player returns, because the ETA is 48 h and the maximum recovery is 48 h.

Cleanup: no dev server was started for this re-check; nothing is listening on port 4200.
