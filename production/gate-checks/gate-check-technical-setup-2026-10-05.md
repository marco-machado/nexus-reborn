# Gate Check: Technical Setup → Pre-Production

**Date**: 2026-10-05
**Checked by**: gate-check skill (review mode: full)

### Verdict: CONCERNS

## Required Artifacts: 10/13 present

- [x] Engine chosen — AGENTS.md pins three.js 0.185.1 / React 19.2.8 / Vite 6.4.3. No `[CHOOSE]`.
- [x] `docs/technical-preferences.md` — populated. Naming conventions are set. Performance budgets are still `[PENDING]`.
- [x] `design/art/art-bible.md` — all 9 sections. Sections 1–4 are real content, not headers.
- [x] ADRs — 20/20 Accepted. Each has Engine Compatibility (0.185.1 / r185) and GDD Requirements Addressed. Depends On graph is a DAG.
- [x] `docs/engine-reference/web/` — VERSION.md risk HIGH, pin matches prefs. `deprecated-apis.md` present.
- [ ] `tests/unit/` and `tests/integration/` — missing as literal paths. Colocated Vitest is the project convention (`package.json` `"test": "vitest run"`; at least 21 `*.test.ts` files under `src/`).
- [ ] CI workflow (`.github/workflows/tests.yml` or equivalent) — missing. No `.github/` tree.
- [x] Example tests — colocated Vitest files exist. Suite was not re-run this check.
- [x] `docs/architecture/architecture.md` — present. Foundation is World Network only. Required Foundation ADRs: none outstanding.
- [ ] `docs/architecture/requirements-traceability.md` — named path missing. Equivalent is `docs/architecture/traceability-index.md` (stale: 64/64). Registry is current: `tr-registry.yaml` v6, 66 entries, no `gap` string, `TR-tactical-012` and `TR-interface-008` both `coverage: covered`.
- [x] `/architecture-review` — reports exist; latest `architecture-review-2026-09-11.md`.
- [x] `design/accessibility-requirements.md` — Standard tier, status Active.
- [x] `design/ux/interaction-patterns.md` — present. Status In Design, pending `/ux-review`.

## Quality Checks: 8/9 passing

- [x] Core systems covered — rendering ADR-0010, input/audio ADR-0017, state ADR-0011.
- [ ] Performance budgets — not set. Prefs frame rate, frame budget, draw calls, and memory are `[PENDING — docs/game-design.md §20]`. §20 says no numerical product-level budget is established.
- [x] Accessibility tier defined — Standard.
- [x] UX spec started — `design/ux/hud.md` Approved; `design/ux/main-menu.md` In Design.
- [x] ADR Engine Compatibility — 20/20, pin 0.185.1, Knowledge Risk HIGH.
- [x] ADR GDD Requirements Addressed — 20/20.
- [x] Deprecated APIs are not the chosen path — ADR-0010 forbids `waitForGPU`, `WebGLRenderer`, `new PostProcessing`, `ShaderMaterial`. `src/` has no matches for those calls.
- [x] HIGH-risk domains addressed — VERSION.md HIGH risk is stamped in the ADRs and in `architecture.md` (WebGPU init, r3f `createRoot`, `RenderPipeline`/TSL, React 19.2).
- [x] Foundation coverage — World Network is the only Foundation system. Its TRs are covered in the registry. The two TRs missing from the index are Feature/Presentation, and both are covered.

Engine validation: all ADRs agree on 0.185.1. Post-cutoff APIs in ADR-0010 and ADR-0016 are the chosen WebGPU path, stamped HIGH, not deprecated calls. ADR dependency cycles: none.

## Blockers

None. The three missing named paths and the unset budgets do not block entering Pre-Production. They must be owned inside that phase, before story breakdown treats them as done.

## Recommendations

- QQ-01: set product budgets in `docs/technical-preferences.md` and `docs/game-design.md` §20, or mark perf acceptance criteria deferred. Do not treat art bible §8.3/§8.4 triangle and draw-call figures as ratified.
- QQ-02 is implementation debt on Accepted ADR-0009 / ADR-0019 (`DeployParams` / `startMission`). Name it as a story before any deploy or roster story. Do not mint a new ADR.
- Refresh `traceability-index.md` so it matches registry v6, or stories will drop `TR-tactical-012` and `TR-interface-008`. Fix `docs/engine-reference/web/modules/webgpu.md` ("PostProcessing is gone") to match ADR-0010 (r185 still exports a warnOnce wrapper).
- Add a CI workflow as an early story. Do not create empty `tests/unit/` to satisfy the template.
- `/ux-review` `design/ux/main-menu.md` and `design/ux/interaction-patterns.md` before UI stories. New Operation is specified as secondary amber; P-13 allows amber to mark ON; P-14 allows a green chip on the Mission HUD. The main-menu decision table marks the looping scan sweep Removed; a later sentence still names it. Pause-menu is Pre-Production work, not this gate.

## Director Panel Assessment

Creative Director:  CONCERNS
  The Operations Director fantasy holds: fixed elevated camera, five verbs plus auto-acquire, one OS, stray fire priced at debrief. Main menu still treats boot lines and the footer as decorative and never state-bearing, which drops corporate cost from the first touchpoint. Interaction patterns are pending `/ux-review`; the non-color Live/Review cue is still an undecided form. Not a phase blocker.

Technical Director: CONCERNS
  Architecture is sound. 20/20 ADRs Accepted, DAG, HIGH-risk domains addressed, Foundation 12 TRs covered, QQ-02 is implementation debt. Not READY because product performance budgets are still pending. Index lag, engine-reference wording, missing CI, and the template test paths are not phase blockers.

Producer:           CONCERNS
  Scope is the closed eight-system cut. No timeline file, so calendar fit is unvalidated. Epics and the first sprint are this phase's job. QQ-01, QQ-02, missing CI, and unreviewed UX specs must stay off an unplanned critical path. Read the registry, not the stale index, when breaking stories.

Art Director:       CONCERNS
  Visual identity is established. Art bible §1 is the anchor. Provisional §8.3/§8.4 numbers must not be treated as ratified. Main-menu amber on a non-money control, and P-13/P-14 amber-ON and green-chip tones, will cause rework if those specs are built as written. Header still says AD-ART-BIBLE CONCERNS after the 2026-09-23 revision; that does not block entry.

Any CONCERNS keeps the verdict at CONCERNS. No director returned NOT READY.

## Verdict: CONCERNS

Minor, tracked gaps. None block entering Pre-Production. `production/stage.txt` stays `Technical Setup` (verdict is CONCERNS, not PASS).

Chain-of-Verification: 5 questions checked — verdict unchanged. Re-read `design/ux/main-menu.md` (New Operation secondary amber; looping scan marked Removed, later sentence still names it) and `design/ux/interaction-patterns.md` (P-13 amber may mark ON; P-14 green chip tone). Confirmed `package.json` test script is `vitest run`. No timeline or milestone files under `production/`.
