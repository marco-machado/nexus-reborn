## Gate Check: Production → Polish (re-run 3)

**Date**: 2026-10-19
**Checked by**: gate-check skill
**Config**: workflow full, qa.level full, review_mode full, team.size studio (all from `modes.rigor: full`, raised in 635d66c), performance.enforce warn. HEAD 713eaf9.
**Previous run**: `gate-check-polish-2026-10-19-r2.md` (FAIL at bc2d221, workflow standard).

### Required Artifacts (full tier): 6/9 met
- [x] Core mechanics implemented: 8 epics, 140/140 stories Complete, 0 Blocked.
- [x] Logic/Integration test files exist beside their modules (`src/**/*.test.ts`).
- [x] QA sign-off `production/qa/qa-signoff-sprint-009-2026-10-19-r2.md`: APPROVED WITH CONDITIONS.
- [x] QA plan `production/qa/qa-plan-sprint-009-2026-10-17.md`.
- [x] Main gameplay path playable end-to-end (played in the 2026-10-19 playtest).
- [ ] Smoke check for the current build: `production/qa/smoke-2026-10-19-sprint-009-r3.md` is PASS at 719de93, but 4 `src/` commits land after it (0d920c0, e1cb142, 756ba89, d9648a1). They touch `types.ts` (`orderGrenade` signature), the `save.ts` validator, `world.ts`, `worldStore.ts`, `Input.tsx`, `WorldGlobe.tsx`, `WorldMap.tsx`. Stale.
- [ ] 3+ distinct playtests: 1 (`production/qa/playtests/playtest-2026-10-19-marco.md`, owner role-playing a new player).
- [~] Coverage of new player, mid-game, difficulty: all three in the session's focus, but mid-game and difficulty only partly, because the tester stalled on comprehension.
- [ ] Fun hypothesis validated or revised: neither. Emotional response "Confused"; only the consequence part of the hypothesis landed (roster loss).

### Quality Checks
- [x] Tests passing: vitest 1545/1545 in 60 files; eslint clean; `npm run build` OK (run during this gate).
- [x] No open S1 bugs: BUG-0001..0007 Closed; BUG-0008 (S3/P3) Open.
- [x] Performance (warn): p95 ~9.2 ms vs 16.7 ms (`production/polish/full-report-2026-10-19.md`). CONCERNS: draw calls, memory, load time not measured; ~358 ms mission-entry hitch not ruled on.
- [ ] Playtest findings addressed, not just documented: bugs fixed; comprehension findings (onboarding, sector readout, abilities, Influence actions, Brief) and difficulty have no design change.
- [ ] No confusion loops: with one tester every confusion point is 100%. Blocking ones: extraction console, grenade sourcing, Stabilize/Lobby/Expedite, route back from Brief.
- [ ] All screens have UX specs: World Network, Research, Brief, Assembly, Debrief, Settings have none (`design/ux/` holds hud.md, main-menu.md, interaction-patterns.md).
- [ ] Interaction pattern library current: cannot be while six screens are unspecified.
- n/a Difficulty curve: `design/difficulty-curve.md` does not exist.
- [x] Accessibility: user ruling 2026-10-19 (Verification section of `design/accessibility-requirements.md`).

### Blockers
1. **Stale smoke check.** Run `/smoke-check sprint` at HEAD.
2. **1 of 3 playtests; fun hypothesis unvalidated.** Run 2+ sessions after the comprehension changes, then `/playtest-report` with CD-PLAYTEST.
3. **Playtest findings unaddressed; confusion loops.** Design changes through `/propagate-design-change` on `interface.md` and `world-network.md`; author `design/difficulty-curve.md`.
4. **Six screens without UX specs.** `/ux-design [screen]` for each.

### Recommendations
- Polish milestone, sprint plan, target date and risk register before the next gate (`/sprint-plan update` for the rest of the Sprint 9 window, or a new sprint).
- Draw-call and memory sampling in the perf script; trace the mission-entry hitch.
- Sector Control/Unrest bar needs a text label (art bible §7.3, §7.5); add a label check to the next surface sweep.
- Isolate BUG-0008 early on the ADR-0017 mixer source-lifetime path.

### Director Panel Assessment
Panel: 4 of 4 (`workflow: full`).

Creative Director: NOT READY
  Hypothesis neither validated nor revised; sector readout violates Pillar 2 ("Undecorated numbers the player cannot act on", `game-pillars.md:88`); confusion loops; findings unaddressed; 1 of 3 playtests. A comprehension problem, not a concept problem: design-and-retest loop.

Technical Director: NOT READY
  Stale smoke vs 4 contract-touching commits; 1 of 3 playtests; six screens without specs. The new commits stay inside ADR boundaries. Concerns: unmeasured draw calls/memory/load, unruled hitch, BUG-0008.

Producer: NOT READY
  No Polish plan, milestone, target date or risk register; 1 of 3 playtests; no stories or owners for the comprehension and difficulty work; stale smoke; missing UX specs.

Art Director: CONCERNS
  Art bible complete and consistent with the concept. World Network and Brief need specs before Polish layout work; the unlabeled Control/Unrest bar breaks §7.3/§7.5 (from the playtest, not checked in code); Brief density and the globe control bar belong in those specs.

### Verdict: FAIL
Three required artifacts are unmet and three directors returned NOT READY. FAIL is never overridden into a stage change; `project.stage` stays Production.

Chain-of-Verification: 5 questions checked (2 by tool: `production/qa/playtests/` re-listed, `git log 719de93..HEAD -- src/` re-counted at 4; also searched for a recorded "interface.md is the spec" decision, none). Verdict unchanged.
