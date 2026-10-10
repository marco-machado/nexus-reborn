# Gate Check: Pre-Production → Production

**Date**: 2026-10-09
**Checked by**: gate-check skill (review mode: lean, workflow: standard, qa.level: standard)
**Stage write**: not done. `project.stage` stays Pre-Production. A FAIL is not advanced.

### Verdict: FAIL

## Required Artifacts: 7/7 present

At `workflow: standard`, epics and the sprint plan stay required. The art bible, UX specs, and the control manifest are recommended. The vertical slice stays recommended unless a played slice has a validation item that is NO.

- [x] Sprint plan — `production/sprints/sprint-001.md` (2026-10-09 to 2026-10-22)
- [x] Epics — 8 `production/epics/*/EPIC.md`, Foundation (World Network) and Core (Economy, Research, Persistence) included
- [x] MVP GDDs — 8/8 Approved in `design/gdd/systems-index.md`. `gdd-structure-check.sh`: all 8 sections present on each. No `system_overrides`.
- [x] `docs/architecture/architecture.md`
- [x] ADRs — 22 files, `adr-0001` through `adr-0022`, every Status line Accepted. Each has `## Engine Compatibility` and `## ADR Dependencies`. ADR-0001 stamps three.js 0.185.1 / React 19.2.8.
- [x] HUD — `design/ux/hud.md`, Status Approved (`/ux-review hud` 2026-09-29)
- [x] `/ux-review` — `main-menu.md`, `interaction-patterns.md`, and `hud.md` each carry `Approved (/ux-review`. `artifact-check.sh --phase pre-production`: `ux-review` PRESENT 3/3. `NO_CHECK: 0`.

Recommended, present: `design/art/art-bible.md` (9 sections; AD-ART-BIBLE CONCERNS, 2026-09-23; 2026-10-05 revision is not a new sign-off), `docs/architecture/control-manifest.md`, UX specs above. No pause-menu spec.

Recommended, absent: `design/assets/entity-inventory.md`. `production/qa/playtests/` does not exist. The playtest record is the slice report.

## Quality Checks

- [x] Tests — `npm test` (vitest), this run: 38 files, 599 passed, 0 failed. Includes `tests/unit/mass.test.ts` and `tests/integration/weapon-mass.test.ts`. `testing.strict` is unset, so Logic and Integration are strict. No failures.
- [x] Performance — no product FPS, draw-call ceiling, or memory ceiling, by decision (`docs/technical-preferences.md`, 2026-10-05; QQ-01 closed). `project.yaml` performance keys are null on purpose. `performance.enforce: warn`. No `tests/performance/`. No numeric breach.
- [x] Architecture review — `docs/architecture/architecture-review-2026-10-08c.md` PASS, 69/69.
- [x] Cross-GDD review — `design/gdd/gdd-cross-review-2026-10-08.md` verdict line is CONCERNS ("No blocking issues"). The same file records the warnings as fixed that day. Not re-scored after the edits.
- [ ] Sprint plan cites `production/epics/` paths — it does not. WN-001 through WN-007, WN-015, and WN-016 match story titles, including `production/epics/world-network/story-001-strategic-clock-runs-only-on-the-four-screens.md` and `story-002-win-eta-catch-up-shares-advanceflow-a-loss-spends-none.md`.
- [ ] Architecture open questions — QQ-02 is still an open High row: `DeployParams` / `startMission` lag Accepted ADR-0009 and ADR-0019. Labeled implementation debt. QQ-05 (Pyrrhic HUD) is the same class.
- [ ] Vertical slice validation — see Blockers. A human played New Operation → Glass Veil → debrief on 2026-10-06 and reported finishing without guidance. Command landed. Two validation items are NO.

UI-requirement coverage of the three specs against every MVP GDD was not re-audited this run. The specs' Approved status lines are the review record.

## Blockers

1. **A played slice has a validation item that is NO.** `prototypes/nexus-reborn-vertical-slice/REPORT.md` playtested the shipping cut in `src/` (no second tree under `prototypes/`). The metrics row is still target 0, actual 3 critical fun blockers. The 2026-10-08 edit changed the recommendation from PIVOT to PROCEED and did not change that row. "Nothing was built this run" means no throwaway prototype. It does not mean the slice was skipped. One NO is enough for FAIL.
   Confirmed in `src/game/world.ts` `tryFire`: a rolled hit calls `applyDamage` on the aimed unit. `strayVictim` runs only in the miss branch, and that miss is offset past and beside the target. A civilian on the aim line is not hit, so stray fire is never priced. `production/epics/tactical-mission/story-010-squad-caused-civilian-first-hits.md` covers a missed round that continues down the fire lane. It does not cover a body on a hit. Sprint 1 does not include that story.
   The same report records a second NO: on the World Network the tester "did not know what to do, where to start." Grenades "would not launch" was not reproduced and is not a separate blocker.

## Recommendations

- Sprint 1 fills 8.0 of 8.0 available days, and every selected story still has `Estimate: —`. The written cut order drops WN-015 and WN-016, which were already outside the 8 days. The only in-plan cut is WN-007. Run `/story-readiness` on WN-001 and re-estimate before treating 7.0 as real.
- WN-004's notes say to clone all four `DeployParams` slices. Its acceptance criteria are the World Network slice only. Roster stories for `canDeploy` / `startMission` are not in this sprint. Bind WN-004 to its acceptance criteria.
- The report's If Proceeding list (aim-line hits, World Network arrival, grenade repro, visuals, contracts) is not in sprint-001. There is no sprint-002 and no `production/milestones/`.
- Missing pause-menu spec and entity inventory are recommended at this tier.

### Path back to PASS

1. On a hit, check bodies on the shooter→target line, with a test a civilian standing on that line fails today.
2. The first World Network screen tells a new player where to start.
3. A new play of the same loop records the metrics row at 0 critical fun blockers, including one squad-caused civilian hit that is priced on the invoice. Editing the recommendation line does not clear the NO.

## Director Panel Assessment

Panel: 2 of 4 (`workflow: standard`, source `rigor:standard`). Creative and Art were not consulted. Raising `modes.rigor` to `full` widens the panel, because workflow is not set on its own.

Technical Director: NOT READY
  The shipping cut was the slice under test, and "no critical fun blocker bugs" is NO. `tryFire` still applies a hit to the aimed unit. Architecture, the engine pin, the epics, and the sprint plan are otherwise fit to build on. QQ-02 and the missing epic paths are concerns, not separate blockers.

Producer: CONCERNS
  Eight epics and a first sprint are present. Blocked stories: 0. The calendar is 10 working days, 8 available, Must Have 7.0, and nothing is planned in parallel. The day counts are not estimates. The slice's build-state list has no sprint.

Chain-of-Verification: 5 questions checked — verdict unchanged. Tool checks: `tryFire` in `src/game/world.ts` (hit applies to the aimed unit; `strayVictim` is the miss branch); story-010 acceptance criteria (miss continues down the fire lane); `docs/technical-preferences.md` (no product FPS by decision). The fun-blocker NO is the blocker. The producer's schedule notes stay recommendations. The failure is the aim-line behavior and a metrics row that still says 3, which a new play can clear.
