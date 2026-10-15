# RS-006 — Research screen action set (documented click-through)

**Story**: `production/epics/research/story-006-other-eligibility-refusals-no-cancel-verb.md`
**Date**: 2026-10-14 · **Build**: `npm run dev` (port 4200), saved operation → RESEARCH

## AC: action set is inspect + one Authorize; no Cancel / Stop / Abort-project; no second confirm

DOM enumeration of `button, [role=button], a[href], input, select, textarea` on the Research screen:

- 21 project-node inspect controls (`.rs-node`, one per catalog project)
- 1 Authorize (`.rs-auth`) on the inspected project
- Phase nav bar: WORLD NETWORK, RESEARCH, BRIEF, ASSEMBLY (router, not Research actions)
- Labels matching `/cancel|stop|abort|confirm/i`: **none**

Selected BARREL WEAR COATING (available), clicked AUTHORIZE PROJECT once:
project went to IN PROGRESS, Ballistics lab running it; `[role=dialog]`/`[role=alertdialog]`/`dialog[open]` count **0** (no second confirm).
The running lab adds one lab-inspect button; still no Cancel/Stop/Abort control.

Screenshot: `rs-006/01-research-action-set-after-authorize.jpg`
