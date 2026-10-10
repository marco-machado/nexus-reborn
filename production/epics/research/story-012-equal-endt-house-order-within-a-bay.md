# Story 012: Equal-endT house order within a bay

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Labs fund one program; slotted projects are blueprints worn at most one per augmentation bay.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Authorize-order append.
- Forbidden: Changing the sort.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN Neural Cache Array (cybernetics) and Adaptive Command AI (control) as injected active runs set directly via the store fixture (not produced by production authorize), both with the same startedT = S and endT = S + 14 × 3600, with authorize order listing Adaptive Command AI first, WHEN sync(t = S + 50400) runs, THEN done appends Neural Cache Array before Adaptive Command AI and currentIssue(Neural) is Adaptive Command AI by house order.
- [ ] GIVEN Neural Interface I and Sensor Fusion Array both active, both authorized at t = 0 (endT = 7200), with Sensor Fusion Array (control, later BRANCH_IDS) authorized first, WHEN sync(7200) runs and currentIssue(Neural) is read, THEN done appends Neural Interface I before Sensor Fusion Array and currentIssue(Neural) is Sensor Fusion Array by house order.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- An equal `endT` is not latest; a later timer is current issue even if its lab sorts after the earlier timer. House order applies only among same-bay completions.
- The tie non-issue counts as an older completed project and is pinnable (GDD §7). Naming the winner on the assembly dossier is an unsatisfied downstream obligation — do not add current-issue controls here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: ascending endT.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 011
- Unlocks: None
