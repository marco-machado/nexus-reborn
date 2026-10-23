# Milestone: Polish

> Decided by Claude, delegated by the owner's /goal 2026-10-23 ("make all the
> decisions, changes, and fixes needed to get it past /gate-check"). Answers
> producer recommendations from gate re-run 3 (`git show
> bd8ec17:production/gate-checks/gate-check-polish-2026-10-19-r3.md`): no
> Polish plan, milestone, target date or risk register. The owner may revise
> any line.

## Overview

- **Target Date**: 2026-11-13
- **Type**: Beta (feature complete; Polish stage)
- **Duration**: 2 weeks (2026-10-29 to 2026-11-13)
- **Number of Sprints**: 2 (Sprint 12: 2026-10-29 to 2026-11-05; Sprint 13: 2026-11-06 to 2026-11-13)

## Milestone Goal

Take the MVP cut (all eight systems, `design/gdd/game-concept.md` § MVP
Definition) from "feature complete and playable" to "a stranger can pick it
up, play three contracts and say what it is about". No new systems. Polish
closes the as-built deltas the five screen UX specs left open, the playtest
findings that are not critical, the unmeasured performance budgets, and the
one open audio bug. At the end the build goes to the Polish → Release gate.

## Success Criteria

- [ ] Every Open Question in `design/ux/*.md` either ruled and implemented, or ruled "as built" in the spec.
- [ ] Every Medium or Low pain point of playtests 2–4 (`production/qa/playtests/playtest-2026-10-23-*.md`) fixed or ruled "won't fix" with a reason.
- [ ] A fresh agent playtest (new player, three contracts) with no High pain point and no confusion point longer than 5 minutes.
- [ ] `performance.memory_ceiling_mb` set in `project.yaml` and met; load-time budget set and met; draw calls ≤ 300 in every scene.
- [ ] World Network p95 frame time re-profiled (owner date 2026-10-28) and within 16.7 ms.
- [ ] BUG-0008 reproduced and fixed, or closed as not reproducible after the audio listening pass.
- [ ] All S1 and S2 bugs resolved.
- [ ] Performance within budget on the target (desktop browser, 1280×720).
- [ ] `npm test` green three runs in a row, and smoke PASS, on the build that goes to the gate.

## Feature List

### Must Ship (Milestone Fails Without These)

| Feature | Design Doc | Owner | Sprint Target | Status |
|---------|-----------|-------|--------------|--------|
| Playtest 2–4 Medium/Low findings | playtest reports 2026-10-23 | game-designer, ui-programmer | 12 | Not started |
| UX spec Open Questions: World Network, Research, Brief, Assembly, Debrief, Settings, Main Menu | `design/ux/*.md` | ux-designer, ui-programmer | 12–13 | Not started |
| Performance budgets: memory ceiling, load time, draw calls, World Network p95 | `project.yaml`, `production/polish/` | performance-analyst | 12 | Script ready (`perf-2026-10-23/perf.mjs`) |
| BUG-0008 strategy music restart | `production/qa/bugs/BUG-0008.md` | gameplay-programmer | 12 | Open |
| Audio listening pass | `design/gdd/audio.md` | owner | 12 | Owner-dated 2026-10-23 |

### Should Ship (Planned but Cuttable)

| Feature | Design Doc | Owner | Sprint Target | Cut Impact | Status |
|---------|-----------|-------|--------------|-----------|--------|
| Hand-played EC-023 winnability mission | `design/difficulty-curve.md` | owner | 12 | Winnability rests on agent play and unit tests only | Owner-dated 2026-10-28 |
| Hit-target TR at `/architecture-review` | IF-031 to IF-035 waiver | technical-director | 13 | The 24×24 floor stays a story-level rule, not a traced requirement | Not started |

### Stretch Goals (Only if Ahead of Schedule)

| Feature | Design Doc | Owner | Value Add |
|---------|-----------|-------|----------|
| Text-scale 125 sweep at a second resolution (1920×1080) | `design/accessibility-requirements.md` | accessibility-specialist | Layout confidence beyond the 1280×720 minimum |

## Quality Gates

| Gate | Threshold | Measurement Method |
|------|-----------|-------------------|
| Crash rate | 0 uncaught errors per agent playtest | Harness console log, `production/qa/playtests/harness/` |
| Frame rate | p95 ≤ 16.7 ms (60 fps) | `production/polish/perf-*/perf.mjs` |
| Load time | Set by the Sprint 12 profile; met at the gate | `perf.mjs` load timings |
| Critical bugs | 0 open S1 | `production/qa/bugs/` |
| High-severity bugs | 0 open S2 | `production/qa/bugs/` |
| Test coverage | Every Logic and Integration story has a test beside its module | `/test-evidence-review` |

## Risk Register

See `production/risk-register/` (RISK-0001 to RISK-0005).

| Risk | Probability | Impact | Mitigation | Owner | Status |
|------|------------|--------|-----------|-------|--------|
| RISK-0001 Agent playtesters stand in for humans | High | Moderate | Owner hand-play 2026-10-28; one human playtest in Polish | producer | Open |
| RISK-0002 BUG-0008 trigger never isolated | Medium | Minor | Listening pass; mixer source-lifetime trace (ADR-0017) | gameplay-programmer | Open |
| RISK-0003 Memory and load budgets unset | Medium | Moderate | Sprint 12 profile sets both | performance-analyst | Open |
| RISK-0004 One owner reviews everything | High | Moderate | Autonomous mode with logged delegated decisions; owner review at sprint close | producer | Open |
| RISK-0005 Only Chromium measured | Medium | Moderate | Firefox and Safari smoke in Sprint 13 | qa-lead | Open |

## Dependencies

### Internal Dependencies

| Feature | Depends On | Owner of Dependency | Status |
|---------|-----------|-------------------|--------|
| Polish sprint plan | Production → Polish gate PASS | producer | Pending |
| Playtest-finding stories | Playtest reports 2–4 | qa-lead | In progress |

### External Dependencies

| Dependency | Provider | Status | Risk if Delayed |
|-----------|---------|--------|----------------|
| Owner listening pass and hand-played mission | Owner | Dated 2026-10-23 / 2026-10-28 | BUG-0008 and winnability stay unverified by a human |

## Review Schedule

| Date | Review Type | Attendees |
|------|-----------|-----------|
| 2026-11-05 | Sprint 12 close: retrospective, progress check | Producer, Directors |
| 2026-11-09 | Mid-milestone review | Full team |
| 2026-11-12 | Pre-milestone review | Full team |
| 2026-11-13 | Milestone review, then `/gate-check release` | Full team |
