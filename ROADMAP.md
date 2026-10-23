# Roadmap

> Keep this file current at all times. Every change of plan, every finished
> step, and every new step updates it in the same turn. It always lists the
> next steps, and at the very least the very next step. Rules: `CLAUDE.md` → Roadmap.

**Last updated:** 2026-10-23
**Stage:** Production (`project.yaml`)
**Sprint:** Sprint 11 (2026-10-23 to 2026-10-28) — all 20 stories IF-016 to IF-035 Complete 2026-10-23; QA sign-off pending
**Goal (owner, 2026-10-23):** pass the Production → Polish `/gate-check`. Open blockers from gate re-run 3 (`gate-check-polish-2026-10-19-r3.md`): five screens without UX specs; playtests 2–3 and the fun hypothesis; smoke at HEAD; plus accessibility compliance and the pattern library.

## Next step

1. **UX specs for Research, Brief, Assembly, Debrief and Settings** (`/ux-design` each, then `/ux-review`), measured on the running build with the Sprint 11 probe approach; fix the as-built accessibility deltas they find (type floors, ink contrast, hit targets) on those screens.

## After that

2. **Interaction pattern library**: add the Scan marker / Focus selection and the Influence moment note (spec Open Question 15).
3. **`/smoke-check sprint`** at HEAD, then **`/team-qa sprint`** for Sprint 11.
4. **Playtests 2 and 3**, `/playtest-report`, and the fun-hypothesis validation (gate blocker 2).
5. **World Network p95 re-profile** (dated 2026-10-28) and the draw-call / memory sampling.
6. **`/retrospective`**, then **`/gate-check`** Production → Polish.
7. Register a hit-target TR at a later `/architecture-review` (IF-031 to IF-035 waiver).

## Dated commitments (owner, retro 10 action 3)

| Due | Item |
|---|---|
| 2026-10-23 (Fri, Sprint 11 day 1; moved from Sat 24 by the owner) | Audio listening pass |
| 2026-10-28 | Hand-played mission, folded into the EC-023 winnability playtest |
| 2026-10-28 | Re-profile World Network p95 (also sets the open-time budget the World Network spec leaves blank) |
| Polish | BUG-0008 (deferred) |

## Done recently

- 2026-10-23 — Sprint 11 implemented: IF-016 to IF-035 Complete (World Network to its UX spec; type, ink and hit-target floors; card no longer blocks the clock). Probe `production/qa/evidence/sprint-011/probe.mjs` ALL PASS (152); 1642 tests; code review APPROVED WITH SUGGESTIONS, applied. `npm test` ×3 green before the first story (retro 10 action 4).
- 2026-10-23 — `/qa-plan sprint`: `production/qa/qa-plan-sprint-011-2026-10-23.md` written; five missing guard cases (IF-020, IF-023, IF-026, IF-029, IF-030) added and back-filled into the stories; the four IF-015 gaps carried as Brief cases.
- 2026-10-23 — `/sprint-plan new`: Sprint 11 written (`production/sprints/sprint-011.md`, `production/sprint-status.yaml`). Guard ACs added to IF-016 to IF-035 for the `/story-readiness` minimum; PR-SPRINT CONCERNS → owner Option A (IF-019, IF-025 Nice to Have); TR waiver for IF-031 to IF-035; view-control bar stays.
- 2026-10-23 — `/create-stories interface`: IF-016 to IF-035 written (19 UI, 1 Integration) from the World Network spec's as-built deltas. Owner rulings recorded in the spec and decision log: OQ2 Unrest ink and bar by state; OQ3 left INFLUENCE panel removed, RESOURCE POOL → INTEL; OQ5 `-- CHANNEL OPEN --`; OQ8 effect on its own line; OQ17 Ink Dim and Ink Faint text → Ink, locked rows dim the frame only; IF-026 readout list; IF-035 added.
- 2026-10-23 — `/sprint-plan new` run: BLOCKED, no Ready stories (145 of 145 Complete). No sprint file written.
- 2026-10-23 — World Network spec Open Questions 20 and 21 closed by the owner: failed-banner line replaced (`ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`); minimum hit target 24×24 CSS px (WCAG 2.2 SC 2.5.8 AA). Spec only; code still open.
- 2026-10-23 — World Network spec revised (focus order, measured contrast, character limits, null handling, flagged doc conflicts) and re-reviewed: APPROVED, 3 advisory; header marked Approved and committed.
- 2026-10-23 — `/ux-review` of the World Network spec: NEEDS REVISION (3 blocking, 8 advisory).
- 2026-10-22 — `ROADMAP.md` added, with the rule to keep it current in `CLAUDE.md` (`cf2aa9d`).
- 2026-10-22 — World Network UX spec written; globe Scan recorded as owner decision in the pillars, Interface Rule 5 and the World Network GDD (`bfb72f0`).
