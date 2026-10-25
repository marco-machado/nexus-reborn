## Gate Check: Production → Polish

**Date**: 2026-10-25
**Checked by**: gate-check skill
**Config**: workflow full, qa.level full, review_mode full, team.size studio, performance.enforce warn. HEAD `8405909`.
**Previous runs**: `gate-check-polish-2026-10-19.md`, `gate-check-polish-2026-10-19-r2.md` (both FAIL).

### Required Artifacts: 10/11 met
- [x] Code organized into subsystems: `src/game`, `src/world`, `src/state`, `src/scene`, `src/ui` (CLAUDE.md Layers).
- [x] Core mechanics implemented: 175/175 stories Complete, 0 Blocked, 8 epics.
- [x] Main path playable end-to-end: QA TC-10 played win (`qa-signoff-sprint-011-2026-10-25-main.md`), agent session 3 played four missions, and the owner played the post-fix build (2026-10-25, informal).
- [x] Logic/Integration tests beside their modules (`src/**/*.test.ts`). Sprint 11 Logic stories TM-018, TM-019, TM-021, WN-021 have tests (TM-021's story file still says "Partial"; stale against the sign-off).
- [ ] **Smoke check for the current build: missing.** `production/qa/smoke-2026-10-24-sprint-011.md` is PASS at `ca6d51e`. BUG-0010 to BUG-0013 (`aa90ae9`, `0b30f4b`, `6b71865`, `bc0bfbd`) changed 10 `src/` files after it. The QA re-run on `93c58e0` (`src/` identical to HEAD) repeated the suite, lint, build and R1–R4 sweeps, not the walked smoke items or the frame fixture.
- [x] QA plan: `production/qa/qa-plan-sprint-011-2026-10-24.md`.
- [x] QA sign-off: `production/qa/qa-signoff-sprint-011-2026-10-25-main.md`, APPROVED WITH CONDITIONS, all conditions met.
- [x] 3+ playtest sessions: 1 human (`playtest-2026-10-19-marco.md`) + 3 agent (`playtest-2026-10-23-agent-s2/s3/s4.md`). Owner ruled 2026-10-25 that agent sessions count.
- [x] Coverage: new player (marco, s2, s3), mid-game (s4), difficulty (s3, s4).
- [x] Fun hypothesis revised: owner adopted the CD-PLAYTEST revision (`fun-hypothesis-2026-10-23.md:6`) on 2026-10-25. Not yet written into `design/gdd/game-concept.md:233`.

### Quality Checks
- [x] Tests passing: vitest 1678/1678 in 69 files, run during this gate.
- [x] No open S1 bugs. Open: BUG-0008 (S3, deferred to Polish).
- [x] Performance within budget (`production/polish/full-report-2026-10-24.md`, at `ab1cf1e`): p95 7.2–9.2 ms vs 16.7; draw calls max 224 vs 300; heap 69.2 MB vs 192; mission entry 4364 ms vs 5 s. CONCERNS: mission-entry hitch untraced (3 spikes > 50 ms per deploy), 13% headroom on mission entry.
- [x] Critical fun issues addressed: fixes in WN-021, WN-022, TM-019, TM-020, TM-021, IF-039; owner's informal post-fix play (2026-10-25) reports lethality, confusion and "too hard" resolved. CONCERNS: no written report.
- [x] Confusion loops: Control vs ownership (3 of 4 sessions) and finding objectives (3 of 4) were identified; WN-022 and TM-020 answer them; owner's play confirms. Same CONCERNS.
- [x] Difficulty curve: met on the owner's ruling. CONCERNS: `design/difficulty-curve.md` Validation Checklist all unchecked; "too hard" Open Question not updated.
- [x] All implemented screens have UX specs: 8 Approved specs in `design/ux/`; Balance and Pause covered inside host specs.
- [x] Interaction pattern library current (updated 2026-10-23).
- [x] Accessibility verified through the existing gates (owner ruling 2026-10-19). CONCERNS: `.pp-live` blink runs under reduced motion.

### Blockers
1. **No smoke report for the current build.** Run `/smoke-check sprint` on `main`.

### Recommendations
- Record the owner's rulings: revised hypothesis into `game-concept.md`; "too hard" decision into `difficulty-curve.md` Open Questions; a short playtest report of the informal post-fix session.
- Settle the order of `/sprint-plan new` and this gate (ROADMAP/CLAUDE.md vs `production/milestones/polish.md` § Dependencies); put the six code reviews and the art items into Sprint 12.
- Re-run this gate on or after 2026-10-28, once the hand-play and World Network re-profile are recorded.

### Director Panel Assessment
Panel: 4 of 4 (`workflow: full`).

Creative Director: CONCERNS
  Pillars and fantasy come through; the strategic drift got design answers (WN-021, WN-022). The informal owner session supports the lethality and confusion fixes, not the difficulty curve. Record the hypothesis and rulings; write up the 2026-10-28 session against the difficulty-curve checklist.

Technical Director: CONCERNS
  22/22 ADRs Accepted; build green on `93c58e0` (= HEAD src). Gaps: smoke for current src; `/code-review` not run on WN-021, WN-022, TM-019, TM-020, TM-021, IF-039; three TRs unregistered; mission-entry hitch untraced; only Chromium measured (RISK-0005).

Producer: CONCERNS
  Polish milestone planned (target 2026-11-13, Sprints 12–13, risks in `production/risk-register/`). No `sprint-012.md`; sprint-plan/gate order conflict; Sprint 11 runs to 10-28 with the hand-play and re-profile due that day; owner rulings only in chat; six stories without sprint rows; audio listening pass outcome not recorded; stale lines in `polish.md`.

Art Director: CONCERNS
  Art bible and UX coverage complete; TM-020 signed. Open: white ellipses overlapping hero shapes (art bible §3.4); destroy-objective zone pulse vs device rings undecided; optional rings hidden by buildings; Print White and crisis-red token drift; `.pp-live` under reduced motion.

### Verdict: FAIL
The required smoke check for the current build is missing; all four directors returned CONCERNS.

Chain-of-Verification: 5 questions checked (2 by tool: smoke HEAD line re-read and `src/` diffed against `131a5c1` and `93c58e0`; `game-concept.md:233` re-read). Verdict unchanged.

### Owner Override (2026-10-25)
The owner overrode the FAIL verdict and advanced the stage to Polish, ruling that the missing smoke check covers only small text and layout fixes. The gate-check skill does not allow a FAIL to advance the stage; the stage was changed on the owner's explicit instruction. `project.yaml` `project.stage` and `production/stage.txt` set to `Polish`.

### Accepted Risks (accepted by the owner, 2026-10-25)
- No smoke report for the current build (BUG-0010 to BUG-0013 fixes untested by the walked smoke items and frame fixture).
- Owner rulings not yet on disk: agent playtests count; revised hypothesis adopted; post-fix informal play resolves lethality, confusion and "too hard".
- Difficulty-curve Validation Checklist unchecked.
- `/code-review` not run on WN-021, WN-022, TM-019, TM-020, TM-021, IF-039; three TRs unregistered.
- No Polish sprint plan; Sprint 11 still runs to 2026-10-28.
- Mission-entry hitch untraced; only Chromium measured.
- Art: §3.4 ellipse overlap, destroy-marker decision, optional-ring visibility, Print White and crisis-red tokens, `.pp-live` under reduced motion.
