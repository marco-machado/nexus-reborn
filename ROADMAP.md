# Roadmap

> Keep this file current at all times. Every change of plan, every finished
> step, and every new step updates it in the same turn. It always lists the
> next steps, and at the very least the very next step. Rules: `CLAUDE.md` → Roadmap.

**Last updated:** 2026-10-23
**Stage:** Production (`project.yaml`)
**Sprint:** Sprint 11 — planned 2026-10-23 to 2026-10-28 (`production/sprints/sprint-011.md`); 20 stories IF-016 to IF-035, 3.2 d committed (PR-SPRINT CONCERNS, owner Option A)

## Next step

1. **`/qa-plan sprint`** — Sprint 11 cases, including the five guard cases the stories mark missing (IF-020, IF-023, IF-026, IF-029, IF-030) and the four IF-015 coverage gaps (Sprint 10 QA condition 4; listed in `production/session-state/active.md`).

## After that

2. **`npm test` three times in a row** (retro 10 action 4), before the first story.
3. **`/story-readiness` then `/dev-story`**, wave by wave per `production/sprints/sprint-011.md`, starting with IF-016.
4. **Register a hit-target TR** at a later `/architecture-review` (owner waiver for Sprint 11: IF-031 to IF-035 cite `TR-interface-???`).

## Dated commitments (owner, retro 10 action 3)

| Due | Item |
|---|---|
| 2026-10-23 (Fri, Sprint 11 day 1; moved from Sat 24 by the owner) | Audio listening pass |
| 2026-10-28 | Hand-played mission, folded into the EC-023 winnability playtest |
| 2026-10-28 | Re-profile World Network p95 (also sets the open-time budget the World Network spec leaves blank) |
| Polish | BUG-0008 (deferred) |

## Done recently

- 2026-10-23 — `/sprint-plan new`: Sprint 11 written (`production/sprints/sprint-011.md`, `production/sprint-status.yaml`). Guard ACs added to IF-016 to IF-035 for the `/story-readiness` minimum; PR-SPRINT CONCERNS → owner Option A (IF-019, IF-025 Nice to Have); TR waiver for IF-031 to IF-035; view-control bar stays.
- 2026-10-23 — `/create-stories interface`: IF-016 to IF-035 written (19 UI, 1 Integration) from the World Network spec's as-built deltas. Owner rulings recorded in the spec and decision log: OQ2 Unrest ink and bar by state; OQ3 left INFLUENCE panel removed, RESOURCE POOL → INTEL; OQ5 `-- CHANNEL OPEN --`; OQ8 effect on its own line; OQ17 Ink Dim and Ink Faint text → Ink, locked rows dim the frame only; IF-026 readout list; IF-035 added.
- 2026-10-23 — `/sprint-plan new` run: BLOCKED, no Ready stories (145 of 145 Complete). No sprint file written.
- 2026-10-23 — World Network spec Open Questions 20 and 21 closed by the owner: failed-banner line replaced (`ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`); minimum hit target 24×24 CSS px (WCAG 2.2 SC 2.5.8 AA). Spec only; code still open.
- 2026-10-23 — World Network spec revised (focus order, measured contrast, character limits, null handling, flagged doc conflicts) and re-reviewed: APPROVED, 3 advisory; header marked Approved and committed.
- 2026-10-23 — `/ux-review` of the World Network spec: NEEDS REVISION (3 blocking, 8 advisory).
- 2026-10-22 — `ROADMAP.md` added, with the rule to keep it current in `CLAUDE.md` (`cf2aa9d`).
- 2026-10-22 — World Network UX spec written; globe Scan recorded as owner decision in the pillars, Interface Rule 5 and the World Network GDD (`bfb72f0`).
