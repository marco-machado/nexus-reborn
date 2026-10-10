# Gate Check: Technical Setup → Pre-Production

**Date**: 2026-10-06
**Checked by**: gate-check skill (review mode: full)

### Verdict: CONCERNS

## Required Artifacts: 13/13 present

- [x] Engine chosen — CLAUDE.md pins three.js 0.185.1 / React 19.2.8 / Vite 6.4.3. No `[CHOOSE]`.
- [x] `docs/technical-preferences.md` — naming set. Performance budgets set 2026-10-05. Coverage minimum still `[PENDING]`.
- [x] `design/art/art-bible.md` — all 9 sections. Sections 1–4 are real content. Header still says AD-ART-BIBLE CONCERNS after the 2026-09-23 revision.
- [x] ADRs — 20/20 Accepted. Each has Engine Compatibility (0.185.1 / r185) and GDD Requirements Addressed. Depends On is a DAG. Foundation is World Network, not a scene/event/save template. Persistence stays Core (ADR-0011). No event bus, by `architecture.md`.
- [x] `docs/engine-reference/web/` — VERSION.md risk HIGH. Pin matches prefs.
- [x] `tests/unit/` and `tests/integration/` — present. `mass.test.ts` and `weapon-mass.test.ts` are real Vitest files, not empty stubs. 35 more tests sit beside modules under `src/`.
- [x] `.github/workflows/tests.yml` — lint, test, build on push and pull request to main.
- [x] Example tests — the two files above. Suite was not re-run this check.
- [x] `docs/architecture/architecture.md` — present. Foundation is World Network only.
- [x] `docs/architecture/requirements-traceability.md` — 66/66 covered, 0 partial, 0 gaps. Foundation gaps: None.
- [x] `/architecture-review` — reports exist. Latest is `architecture-review-2026-09-11.md` (CONCERNS, hygiene, no blockers).
- [x] `design/accessibility-requirements.md` — Standard tier.
- [x] `design/ux/interaction-patterns.md` — Approved 2026-10-05.

## Quality Checks: 9/9 passing

- [x] Core systems covered — rendering ADR-0010, input/audio ADR-0017, state ADR-0011.
- [x] Naming and performance budgets set — ratified caps plus the §20 procedure. No product FPS. Art bible §8.3/§8.4 figures stay provisional.
- [x] Accessibility tier defined — Standard.
- [x] UX spec started — `design/ux/hud.md` and `design/ux/main-menu.md` Approved.
- [x] ADR Engine Compatibility — 20/20, pin 0.185.1, Knowledge Risk HIGH.
- [x] ADR GDD Requirements Addressed — 20/20.
- [x] Deprecated APIs are not the chosen path — ADR-0010 names `waitForGPU`, `WebGLRenderer`, and `PostProcessing` only to forbid them. Review audit agrees.
- [x] HIGH-risk domains addressed — WebGPU init, r3f `createRoot`, `RenderPipeline`/TSL, React 19.2, stamped in `architecture.md`.
- [x] Foundation coverage — World Network, 12 requirements, 0 gaps.

Engine validation: all ADRs agree on 0.185.1. Post-cutoff APIs are the chosen WebGPU path, stamped HIGH. ADR dependency cycles: none.

## Blockers

None. Producer concerns constrain how Pre-Production starts. They do not make entry unexecutable.

## Recommendations

- No timeline file. Do not invent a ship date. Order the first two sprints by dependency.
- QQ-02 is the first implementation story: `DeployParams` and `startMission` still lag Accepted ADR-0009 and ADR-0019. No deploy or roster story before that. Do not mint a new ADR.
- Treat those sprints as brownfield validation of `src/`, not an unbuilt eight-system build. All eight systems are MVP, with no product-tier fallback.
- Do not use art bible §8.4, a product FPS, or a coverage percentage as acceptance. Minimum Coverage is still `[PENDING]`.
- `docs/architecture/control-manifest.md` already exists. Do not regenerate it to enter.
- Pause-menu spec, epics, and the vertical slice are Pre-Production work.

## Director Panel Assessment

Creative Director:  READY
  Operations Director fantasy holds across pillars, the art bible rule, and the Approved HUD, Main Menu, and pattern library. Collateral stays a count in the fight and a priced line at debrief. QQ-02 is debt on the Accepted deploy contracts, not a redesign of the two-layer loop.

Technical Director: READY
  20/20 ADRs Accepted, DAG, HIGH-risk domains addressed, Foundation complete enough to plan. Budgets are the 2026-10-05 caps plus the §20 procedure. QQ-02 is not a missing ADR. Engine-reference wording drift is hygiene.

Producer:           CONCERNS
  Scope is the closed eight-system cut already in `src/`. Realistic for one developer only if the first sprints are brownfield validation plus sequenced debt. No timeline. QQ-02 derails sprint two if a deploy or roster story starts first. Missing epics and a sprint plan are outputs of the next phase, not a reason to stay out.

Art Director:       READY
  Section 1 is the anchor. Approved UX no longer breaks amber-is-money. The AD-ART-BIBLE CONCERNS header is a stale token. §8.3/§8.4 figures stay provisional.

Any CONCERNS keeps the verdict at CONCERNS. No director returned NOT READY.

## Verdict: CONCERNS

Required artifacts and quality checks pass. The producer constraint is real and belongs in the first sprint order. It is not a phase blocker. `production/stage.txt` stays `Technical Setup` (verdict is CONCERNS, not PASS).

Chain-of-Verification: 5 questions checked — verdict unchanged. Re-read `requirements-traceability.md` (66/66, Foundation gaps None), `architecture.md` QQ-02 (implementation debt, not a missing ADR), `technical-preferences.md` budgets (set 2026-10-05; only coverage minimum is still `[PENDING]`), and ADR-0010 (deprecated APIs named only as forbidden). Concerns together sequence the next phase. They do not block entry.
