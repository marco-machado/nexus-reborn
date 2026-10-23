# Roadmap

> Keep this file current at all times. Every change of plan, every finished
> step, and every new step updates it in the same turn. It always lists the
> next steps, and at the very least the very next step. Rules: `CLAUDE.md` → Roadmap.

**Last updated:** 2026-10-23
**Stage:** Production (`project.yaml`)
**Sprint:** Sprint 10 — QA signed off (APPROVED WITH CONDITIONS, `production/qa/qa-signoff-sprint-010-2026-10-22.md`); retrospective done (`production/retrospectives/retro-sprint-10-2026-10-22.md`)

## Next step

1. **`/sprint-plan new`** — Sprint 11, planned from the 20 Ready stories IF-016 to IF-035 (`production/epics/interface/`). The last Sprint 10 close-out step (CLAUDE.md → Gate Checks).

## After that

2. **Next `/qa-plan`** — Sprint 11 cases, plus the four IF-015 coverage gaps (Sprint 10 QA condition 4; listed in `production/session-state/active.md`).
3. **Register a hit-target TR** at the next `/architecture-review`: IF-031 to IF-035 cite `TR-interface-???` (WCAG 2.2 SC 2.5.8, 24×24).

## Dated commitments (owner, retro 10 action 3)

| Due | Item |
|---|---|
| 2026-10-24 | Audio listening pass |
| 2026-10-28 | Hand-played mission, folded into the EC-023 winnability playtest |
| 2026-10-28 | Re-profile World Network p95 (also sets the open-time budget the World Network spec leaves blank) |
| Polish | BUG-0008 (deferred) |

## Done recently

- 2026-10-23 — `/create-stories interface`: IF-016 to IF-035 written (19 UI, 1 Integration) from the World Network spec's as-built deltas. Owner rulings recorded in the spec and decision log: OQ2 Unrest ink and bar by state; OQ3 left INFLUENCE panel removed, RESOURCE POOL → INTEL; OQ5 `-- CHANNEL OPEN --`; OQ8 effect on its own line; OQ17 Ink Dim and Ink Faint text → Ink, locked rows dim the frame only; IF-026 readout list; IF-035 added.
- 2026-10-23 — `/sprint-plan new` run: BLOCKED, no Ready stories (145 of 145 Complete). No sprint file written.
- 2026-10-23 — World Network spec Open Questions 20 and 21 closed by the owner: failed-banner line replaced (`ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`); minimum hit target 24×24 CSS px (WCAG 2.2 SC 2.5.8 AA). Spec only; code still open.
- 2026-10-23 — World Network spec revised (focus order, measured contrast, character limits, null handling, flagged doc conflicts) and re-reviewed: APPROVED, 3 advisory; header marked Approved and committed.
- 2026-10-23 — `/ux-review` of the World Network spec: NEEDS REVISION (3 blocking, 8 advisory).
- 2026-10-22 — `ROADMAP.md` added, with the rule to keep it current in `CLAUDE.md` (`cf2aa9d`).
- 2026-10-22 — World Network UX spec written; globe Scan recorded as owner decision in the pillars, Interface Rule 5 and the World Network GDD (`bfb72f0`).
