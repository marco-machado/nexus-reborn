# Story 006: Other eligibility refusals; no cancel verb

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw  
**Secondary ADRs**: ADR-0002: A mission in progress is not saved
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Any cancel/stop/abort-project export or control.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN a mission in progress and Advanced Propellants available, WHEN it is authorized, THEN eligibility returns before `start()` and `spendCredits`, Ballistics stays idle, the project stays available, Research emits no spend, and Credits are unchanged. (In-field is not a Research-screen refusal reason.)
- [x] GIVEN all 21 projects researched, WHEN any is authorized again, THEN eligibility returns before `start()` and `spendCredits`, every lab stays idle, every project stays researched, and Credits are unchanged.
- [x] GIVEN the Research screen, WHEN its actions are enumerated, THEN the action set is project-node inspect plus one Authorize on the inspected project; there is no Cancel, Stop or Abort-project control, and Authorize has no second confirm. Mission Abort is not this control.
- [x] GIVEN Research's public API, WHEN its exports are enumerated, THEN there is no cancel, stop or abort-project export.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Do not add a method that returns a refusal in place of a cancel.

---

- **Decided 2026-10-14 (owner):** "a mission in progress" means `useAppStore.getState().phase === 'mission'` — the router's single phase (ADR-0017). Abort and debrief already leave that phase. `appStore.authorizeResearch` checks it before `start()`.

- **Decided 2026-10-14 (owner, retro task R-5):** the production authorize command is `appStore.authorizeResearch(node, t)` in `src/state/appStore.ts` (ADR-0013 amended; `design/gdd/research.md` Core Rule 3 updated). Tests go in `src/state/appStore.test.ts`.

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: refusal text.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/appStore.test.ts`; export check in `src/game/research.test.ts`.
- Mission in progress: refused before `start`/`spendCredits`, lab idle, Credits unchanged
- All 21 researched: every re-authorize refused, labs idle
- Research exports contain no cancel / stop / abort-project name
- Edge: "In progress" means `appStore.phase === 'mission'` (decided 2026-10-14)
- Edge: The Research-screen action set (inspect + one Authorize, no second confirm) is checked in the manual pass

**Gap**: **Source change.** Refuse authorize while a mission is in progress.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. Screen action enumeration may be a component test or a documented click-through. — must exist and pass.

**Status**: [x] Created — 5 tests in `src/state/appStore.test.ts` (RS-006 block), 1 in `src/game/research.test.ts`; screen action set: `production/qa/evidence/rs-006-research-action-set-evidence.md`

---

## Dependencies

- Depends on: Story 003
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 4/4 passing (none deferred)
- AC-1 (mission in progress): `src/state/appStore.test.ts` RS-006 block, C = cost and C = 4×cost, plus the phase-scoped control case — COVERED
- AC-2 (all 21 researched): `src/state/appStore.test.ts` RS-006 'all 21 projects researched' (writes === 0) — COVERED
- AC-3 (Research-screen action set): documented click-through `production/qa/evidence/rs-006-research-action-set-evidence.md` + `production/qa/evidence/rs-006/01-research-action-set-after-authorize.jpg` — COVERED
- AC-4 (no cancel/stop/abort export): `src/state/appStore.test.ts` 'Research public API' + `src/game/research.test.ts` 'no cancel verb (RS-006)' — COVERED
**Deviations**: None blocking. Advisory:
- `src/state/appStore.test.ts` 'Research public API' test applies `/cancel|stop|abort/i` to every appStore module export and state key, not only the Research surface. Passes today (Mission abort lives in PauseMenu `onAbort` / `telemetry.recordAbort`), but a future legitimate Mission action on appStore (e.g. `abortMission`) would fail it. Suggest scoping to `authorizeResearch` plus researchStore, or an allow-list of Mission names.
- `production/qa/evidence/rs-006/01-research-action-set-after-authorize.jpg` is cropped at the left edge (Ballistics header truncated); cosmetic — the DOM enumeration in the evidence .md is the primary proof.
- `src/state/appStore.ts:276` in-field guard returns before the cost check and any researchStore read; matches GDD research.md Core Rule 3, owner decision 2026-10-14, ADR-0013 Decision and ADR-0017 §3 (Phase router). No change needed.
- ADR compliance: ADR-0013 COMPLIANT (refusal is an identity no-op: no start/spendCredits/addCredits, zero app-store writes). ADR-0002 has no Decision heading and nothing applicable to authorize.
**Test Evidence**: Logic: `src/state/appStore.test.ts` (RS-006 block, 5 tests), `src/game/research.test.ts` (1 test); `npx vitest run` on both files: 194/194 passed (run during /story-done, 2026-10-14). Run result: OBSERVED — `production/qa/evidence/rs-006/01-research-action-set-after-authorize.jpg`.
**Code Review**: Complete — /code-review ran in the implement-stories workflow: verdict NOT ASSESSED (specialist agents lead-programmer, gameplay-programmer, qa-tester could not be spawned: no Agent tool in the unattended run); inline review found no required changes, would be APPROVED WITH SUGGESTIONS. `npx tsc -b` and eslint clean on the three source files. Re-run /code-review with agents if specialist sign-off is required.
**Gates**: QL-TEST-COVERAGE skipped — Lean mode. LP-CODE-REVIEW skipped — Lean mode (answered "Yes — /code-review ran", per workflow).
**Autonomous decisions**: Phase 7 close — picked "Close the story (Recommended)" (unattended workflow run).
