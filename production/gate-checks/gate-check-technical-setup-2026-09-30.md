# Gate Check: Technical Setup → Pre-Production

**Date**: 2026-09-30
**Checked by**: gate-check skill (review mode: full)

### Verdict: CONCERNS

## Required Artifacts: 10/13 present

- [x] Engine chosen — CLAUDE.md stack is pinned (three.js 0.185.1 / React 19.2.8 / Vite 6.4.3). No `[CHOOSE]`.
- [x] `docs/technical-preferences.md` — populated; naming conventions set. Performance budgets still `[PENDING]`.
- [x] `design/art/art-bible.md` — all 9 sections. Sections 1–4 are real content, not headers.
- [x] ADRs — 20/20 Accepted. Each has Engine Compatibility (0.185.1) and GDD Requirements Addressed. Depends On graph is acyclic.
- [x] `docs/engine-reference/web/` — VERSION.md risk HIGH, pin matches prefs. `deprecated-apis.md` present.
- [ ] `tests/unit/` and `tests/integration/` — missing as literal paths. Colocated Vitest is the project convention.
- [ ] CI workflow (`.github/workflows/tests.yml` or equivalent) — missing. No `.github/` tree.
- [x] Example tests — `npm test` this run: 35 files, 591 passed.
- [x] `docs/architecture/architecture.md` — present. Required Foundation/Core ADRs: none outstanding.
- [ ] `docs/architecture/requirements-traceability.md` — named path missing. Equivalent is `docs/architecture/traceability-index.md` (stale: 64/64). Registry is current: `tr-registry.yaml` v6, 66/66 covered, 0 gaps.
- [x] `/architecture-review` — reports exist; latest `architecture-review-2026-09-11.md`.
- [x] `design/accessibility-requirements.md` — Standard tier, committed 2026-09-23.
- [x] `design/ux/interaction-patterns.md` — present (was missing on 2026-09-28). Status In Design, pending `/ux-review`.

## Quality Checks: 8/9 passing

- [x] Core systems covered — rendering ADR-0010, input/audio ADR-0017, state ADR-0011.
- [ ] Performance budgets — not set. Prefs frame rate, frame budget, draw calls, and memory are `[PENDING — docs/game-design.md §20]`. §20 says those budgets are still unapproved. Art bible §8.3/§8.4 3D numbers stay provisional. Naming conventions are set.
- [x] Accessibility tier defined — Standard.
- [x] UX spec started — `design/ux/hud.md` Approved; `design/ux/main-menu.md` In Design.
- [x] ADR Engine Compatibility — 20/20, pin 0.185.1, Knowledge Risk HIGH.
- [x] ADR GDD Requirements Addressed — 20/20.
- [x] Deprecated APIs are not the chosen path — ADR-0010 forbids `waitForGPU`, `WebGLRenderer`, `new PostProcessing`, `ShaderMaterial`. `src/` has no matches for those three renderer calls.
- [x] HIGH-risk domains addressed — VERSION.md HIGH risk is stamped in the ADRs. Architecture principle 4 names the WebGPU frame loop.
- [x] Foundation coverage — World Network is the only Foundation system. Its TRs are covered in the index. The two TRs missing from the index (`TR-tactical-012`, `TR-interface-008`) are Feature/Presentation, and both are `coverage: covered` in the registry.

Engine validation: all ADRs agree on 0.185.1. Post-cutoff APIs in ADR-0010 and ADR-0016 are the chosen WebGPU path, stamped HIGH, not deprecated calls. ADR dependency cycles: none.

## Blockers

None. The three missing named paths and the unset budgets do not block entering Pre-Production. They must be owned inside that phase, before story breakdown.

## Recommendations

- QQ-01: set product budgets in `docs/technical-preferences.md` and `docs/game-design.md` §20, or mark perf acceptance criteria DEFERRED. Do not treat art bible §8.4 triangle and draw-call figures as ratified.
- QQ-02 and QQ-05 are implementation debt on Accepted ADRs (`DeployParams` / `startMission`; pyrrhic-win HUD). Name them as stories. Do not mint new ADRs.
- Refresh `traceability-index.md` so it matches registry v6. Fix `docs/engine-reference/web/modules/webgpu.md` "PostProcessing is gone" to match ADR-0010 (r185 still exports a warnOnce wrapper).
- Add a CI workflow as an early story. Do not create empty `tests/unit/` to satisfy the template. Colocated tests are the convention, and the suite is green.
- `/ux-review` `design/ux/interaction-patterns.md` and `design/ux/main-menu.md` before UI stories. Pause-menu and assembly specs are Pre-Production work, not this gate.

## Director Panel Assessment

Creative Director:  READY
  Fantasy and all five pillars hold across the Approved pillars doc, art bible §1, and the UX set. Unreviewed specs and HUD advisories are not creative blockers.

Technical Director: CONCERNS
  Architecture is sound and Foundation ADRs are Accepted. Not READY because product performance budgets are still pending. Index lag, engine-reference wording, missing CI, and QQ-02 are not phase blockers.

Producer:           CONCERNS
  Scope is the closed shipping cut. No timeline file, so calendar fit is unvalidated; epics and the first sprint are this phase's job. QQ-01, QQ-02, missing CI, and unreviewed UX specs must stay off an unplanned critical path.

Art Director:       CONCERNS
  Visual identity is established. Art bible §1 is the anchor. Provisional §8.3/§8.4 numbers must not be treated as ratified while building the slice. Header still says AD-ART-BIBLE CONCERNS after the 2026-09-23 revision; that does not block entry.

Any CONCERNS keeps the verdict at CONCERNS. No director returned NOT READY.

## Verdict: CONCERNS

Minor, tracked gaps. None block entering Pre-Production. `production/stage.txt` remains `Technical Setup` (verdict is CONCERNS, not PASS).

Chain-of-Verification: 5 questions checked — verdict unchanged. Re-read `architecture.md` Open Questions (QQ-01 is deferrable; no required ADR outstanding). Re-searched `src/` for `PostProcessing`, `waitForGPU`, and `WebGLRenderer` (no matches). Re-read `interaction-patterns.md` (real library, not a stub). Foundation layer is World Network only, and those TRs are covered. The missing test directories and CI file were not softened from a functional failure: the suite passed this run.
