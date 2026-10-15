# Story 006: Other eligibility refusals; no cancel verb

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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

- [ ] GIVEN a mission in progress and Advanced Propellants available, WHEN it is authorized, THEN eligibility returns before `start()` and `spendCredits`, Ballistics stays idle, the project stays available, Research emits no spend, and Credits are unchanged. (In-field is not a Research-screen refusal reason.)
- [ ] GIVEN all 21 projects researched, WHEN any is authorized again, THEN eligibility returns before `start()` and `spendCredits`, every lab stays idle, every project stays researched, and Credits are unchanged.
- [ ] GIVEN the Research screen, WHEN its actions are enumerated, THEN the action set is project-node inspect plus one Authorize on the inspected project; there is no Cancel, Stop or Abort-project control, and Authorize has no second confirm. Mission Abort is not this control.
- [ ] GIVEN Research's public API, WHEN its exports are enumerated, THEN there is no cancel, stop or abort-project export.

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

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: None
